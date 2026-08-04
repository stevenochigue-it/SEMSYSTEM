<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../../config/database.php';

function getAuthenticatedUserId() {
    $authHeader = '';

    // 1. Try $_SERVER['HTTP_AUTHORIZATION'] (set by .htaccess RewriteRule)
    if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
    }
    // 2. Try REDIRECT_HTTP_AUTHORIZATION (another Apache variant)
    elseif (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    }
    // 3. Try apache_request_headers() as last resort
    elseif (function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        if (!empty($headers['Authorization'])) {
            $authHeader = $headers['Authorization'];
        } elseif (!empty($headers['authorization'])) {
            $authHeader = $headers['authorization'];
        }
    }

    if (!empty($authHeader) && preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        $decoded = json_decode(base64_decode($matches[1]), true);
        if ($decoded && isset($decoded['id'])) {
            return $decoded['id'];
        }
    }
    return null;
}

$userId = getAuthenticatedUserId();
if (!$userId) {
    http_response_code(401);
    echo json_encode(array("success" => false, "message" => "Unauthorized access."));
    exit;
}

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->student_number)) {
    $database = new Database();
    $db = $database->getConnection();
    
    try {
        // Allow unlinking by passing empty string
        if ($data->student_number === '') {
            $update = "UPDATE users SET linked_student_number = NULL WHERE id = :id";
            $update_stmt = $db->prepare($update);
            $update_stmt->bindParam(":id", $userId);
            if ($update_stmt->execute()) {
                http_response_code(200);
                echo json_encode(array("success" => true, "message" => "Account unlinked successfully."));
            } else {
                http_response_code(500);
                echo json_encode(array("success" => false, "message" => "Failed to unlink account."));
            }
            exit;
        }

        // Verify student exists
        $query = "SELECT student_number, first_name, last_name FROM students WHERE student_number = :student_number LIMIT 1";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":student_number", $data->student_number);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            $student = $stmt->fetch();
            
            // Link to parent account
            $update = "UPDATE users SET linked_student_number = :student_number WHERE id = :id";
            $update_stmt = $db->prepare($update);
            $update_stmt->bindParam(":student_number", $data->student_number);
            $update_stmt->bindParam(":id", $userId);
            
            if ($update_stmt->execute()) {
                http_response_code(200);
                echo json_encode(array(
                    "success" => true, 
                    "message" => "Successfully linked account to student " . $student['first_name'] . " " . $student['last_name'] . ".",
                    "student_number" => $data->student_number
                ));
            } else {
                http_response_code(500);
                echo json_encode(array("success" => false, "message" => "Failed to update parent link in database."));
            }
        } else {
            http_response_code(404);
            echo json_encode(array("success" => false, "message" => "Student not found. Please verify the student number."));
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(array("success" => false, "message" => "Server database error: " . $e->getMessage()));
    }
} else {
    // Handle empty student_number (unlink)
    $database = new Database();
    $db = $database->getConnection();
    try {
        $update = "UPDATE users SET linked_student_number = NULL WHERE id = :id";
        $update_stmt = $db->prepare($update);
        $update_stmt->bindParam(":id", $userId);
        if ($update_stmt->execute()) {
            http_response_code(200);
            echo json_encode(array("success" => true, "message" => "Account unlinked successfully."));
        } else {
            http_response_code(500);
            echo json_encode(array("success" => false, "message" => "Failed to unlink account."));
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(array("success" => false, "message" => "Database error: " . $e->getMessage()));
    }
}
?>
