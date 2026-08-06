<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
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

$database = new Database();
$db = $database->getConnection();

try {
    // 1. Get linked student number for this parent
    $q_parent = "SELECT linked_student_number FROM users WHERE id = :id LIMIT 1";
    $stmt_parent = $db->prepare($q_parent);
    $stmt_parent->bindParam(":id", $userId);
    $stmt_parent->execute();
    
    if ($stmt_parent->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(array("success" => false, "message" => "User account not found."));
        exit;
    }
    
    $parent = $stmt_parent->fetch();
    $studentNumber = $parent['linked_student_number'];
    
    if (empty($studentNumber)) {
        echo json_encode(array("linked" => false, "message" => "No student linked to this account."));
        exit;
    }
    
    // 2. Fetch student details
    $q_student = "SELECT id, student_number, first_name, last_name, course, year_level, section, contact_number, guardian_name, photo, status FROM students WHERE student_number = :student_number LIMIT 1";
    $stmt_student = $db->prepare($q_student);
    $stmt_student->bindParam(":student_number", $studentNumber);
    $stmt_student->execute();
    
    if ($stmt_student->rowCount() === 0) {
        echo json_encode(array("linked" => false, "message" => "Linked student not found in records."));
        exit;
    }
    
    $student = $stmt_student->fetch();
    
    // 3. Fetch attendance history
    $q_attendance = "SELECT id, student_number, date, time_in, time_out, status FROM attendance WHERE student_number = :student_number ORDER BY date DESC, id DESC LIMIT 50";
    $stmt_attendance = $db->prepare($q_attendance);
    $stmt_attendance->bindParam(":student_number", $studentNumber);
    $stmt_attendance->execute();
    
    $logs = array();
    while ($row = $stmt_attendance->fetch()) {
        $logs[] = array(
            "id" => $row['id'],
            "student_number" => $row['student_number'],
            "date" => $row['date'],
            "time_in" => $row['time_in'],
            "time_out" => $row['time_out'],
            "status" => $row['status']
        );
    }
    
    echo json_encode(array(
        "linked" => true,
        "student" => array(
            "id" => $student['id'],
            "student_number" => $student['student_number'],
            "first_name" => $student['first_name'],
            "last_name" => $student['last_name'],
            "course" => $student['course'],
            "year_level" => $student['year_level'],
            "section" => $student['section'],
            "contact_number" => $student['contact_number'],
            "guardian_name" => $student['guardian_name'],
            "photo" => $student['photo'],
            "status" => $student['status']
        ),
        "logs" => $logs
    ));
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(array("success" => false, "message" => "Database error: " . $e->getMessage()));
}
?>
