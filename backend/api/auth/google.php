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

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->google_id) && !empty($data->google_email) && !empty($data->full_name)) {
    
    $database = new Database();
    $db = $database->getConnection();
    
    try {
        // Check if user exists by google_id
        $query = "SELECT id, username, full_name, role, active, linked_student_number FROM users WHERE google_id = :google_id LIMIT 1";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":google_id", $data->google_id);
        $stmt->execute();
        
        $user = null;
        
        if ($stmt->rowCount() > 0) {
            $user = $stmt->fetch();
        } else {
            // Check if user exists by google_email (maybe registered via form but linking google now)
            $query = "SELECT id, username, full_name, role, active, linked_student_number FROM users WHERE google_email = :google_email LIMIT 1";
            $stmt = $db->prepare($query);
            $stmt->bindParam(":google_email", $data->google_email);
            $stmt->execute();
            
            if ($stmt->rowCount() > 0) {
                $user = $stmt->fetch();
                // Update user to link Google ID
                $update_query = "UPDATE users SET google_id = :google_id WHERE id = :id";
                $update_stmt = $db->prepare($update_query);
                $update_stmt->bindParam(":google_id", $data->google_id);
                $update_stmt->bindParam(":id", $user['id']);
                $update_stmt->execute();
            } else {
                // Register a new parent user
                $username = strtolower(explode('@', $data->google_email)[0]) . '_' . rand(100, 999);
                // Ensure unique username
                $check_username = $db->prepare("SELECT id FROM users WHERE username = :username");
                $check_username->bindParam(":username", $username);
                $check_username->execute();
                if ($check_username->rowCount() > 0) {
                    $username = $username . rand(10, 99);
                }
                
                $insert_query = "INSERT INTO users SET 
                                    username = :username, 
                                    full_name = :full_name, 
                                    password = NULL, 
                                    role = 'parent', 
                                    active = 1,
                                    google_id = :google_id,
                                    google_email = :google_email";
                                    
                $insert_stmt = $db->prepare($insert_query);
                $insert_stmt->bindParam(":username", $username);
                $insert_stmt->bindParam(":full_name", $data->full_name);
                $insert_stmt->bindParam(":google_id", $data->google_id);
                $insert_stmt->bindParam(":google_email", $data->google_email);
                
                if ($insert_stmt->execute()) {
                    $new_id = $db->lastInsertId();
                    $user = array(
                        "id" => $new_id,
                        "username" => $username,
                        "full_name" => $data->full_name,
                        "role" => 'parent',
                        "active" => 1,
                        "linked_student_number" => null
                    );
                }
            }
        }
        
        if ($user) {
            if ($user['active'] == 0) {
                http_response_code(403);
                echo json_encode(array("success" => false, "message" => "Account is disabled. Contact your administrator."));
                exit;
            }
            
            // Generate simple mockup JWT token
            $token = base64_encode(json_encode(array("id" => $user['id'], "role" => $user['role'], "exp" => time() + 3600)));
            
            http_response_code(200);
            echo json_encode(array(
                "success" => true,
                "token" => $token,
                "user" => array(
                    "id" => $user['id'],
                    "username" => $user['username'],
                    "full_name" => $user['full_name'],
                    "role" => $user['role'],
                    "linked_student_number" => isset($user['linked_student_number']) ? $user['linked_student_number'] : null
                )
            ));
        } else {
            http_response_code(500);
            echo json_encode(array("success" => false, "message" => "Failed to process Google sign-in."));
        }
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(array("success" => false, "message" => "Server error: " . $e->getMessage()));
    }
} else {
    http_response_code(400);
    echo json_encode(array("success" => false, "message" => "Incomplete Google profile credentials."));
}
?>
