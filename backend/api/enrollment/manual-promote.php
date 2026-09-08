<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once '../../config/database.php';
$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->student_id) || !isset($data->school_year) || !isset($data->grade_level_id) || !isset($data->section_id)) {
    http_response_code(400);
    echo json_encode(["message" => "Incomplete parameters for manual promotion review."]);
    exit;
}

try {
    $promotionStatus  = isset($data->promotion_status) ? $data->promotion_status : 'Promoted';
    $enrollmentStatus = isset($data->enrollment_status) ? $data->enrollment_status : 'Enrolled';

    // Check if student already has an enrollment record
    $check = $db->prepare("SELECT id FROM enrollments WHERE student_id = :student_id");
    $check->bindParam(":student_id", $data->student_id);
    $check->execute();

    if ($check->rowCount() > 0) {
        $stmt = $db->prepare("
            UPDATE enrollments
            SET school_year = :school_year,
                grade_level_id = :grade_level_id,
                section_id = :section_id,
                promotion_status = :promotion_status,
                enrollment_status = :enrollment_status,
                enrollment_mode = 'manual'
            WHERE student_id = :student_id
        ");
    } else {
        $stmt = $db->prepare("
            INSERT INTO enrollments (student_id, grade_level_id, section_id, school_year, enrollment_status, promotion_status, enrollment_mode)
            VALUES (:student_id, :grade_level_id, :section_id, :school_year, :enrollment_status, :promotion_status, 'manual')
        ");
    }

    $stmt->bindParam(":student_id", $data->student_id);
    $stmt->bindParam(":grade_level_id", $data->grade_level_id, PDO::PARAM_INT);
    $stmt->bindParam(":section_id", $data->section_id, PDO::PARAM_INT);
    $stmt->bindParam(":school_year", $data->school_year);
    $stmt->bindParam(":promotion_status", $promotionStatus);
    $stmt->bindParam(":enrollment_status", $enrollmentStatus);

    $stmt->execute();

    // Also update student's primary section reference in students table
    $updateStudent = $db->prepare("UPDATE students SET section_id = :section_id WHERE id = :student_id");
    $updateStudent->bindParam(":section_id", $data->section_id, PDO::PARAM_INT);
    $updateStudent->bindParam(":student_id", $data->student_id);
    $updateStudent->execute();

    http_response_code(200);
    echo json_encode([
        "success" => true,
        "message" => "Manual promotion & enrollment review updated successfully for student ID " . $data->student_id
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Database error: " . $e->getMessage()]);
}
?>
