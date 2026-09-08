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

if (!isset($data->school_year) || !isset($data->grade_level_id) || !isset($data->section_id)) {
    http_response_code(400);
    echo json_encode(["message" => "Incomplete parameters for batch promotion."]);
    exit;
}

try {
    $nextGradeId = min((int)$data->grade_level_id + 1, 6);

    $stmt = $db->prepare("
        UPDATE enrollments
        SET school_year = :school_year,
            grade_level_id = :next_grade_id,
            promotion_status = 'Promoted',
            enrollment_mode = 'automatic'
        WHERE grade_level_id = :current_grade_id
          AND section_id = :section_id
          AND enrollment_status = 'Enrolled'
    ");

    $stmt->bindParam(":school_year", $data->school_year);
    $stmt->bindParam(":next_grade_id", $nextGradeId, PDO::PARAM_INT);
    $stmt->bindParam(":current_grade_id", $data->grade_level_id, PDO::PARAM_INT);
    $stmt->bindParam(":section_id", $data->section_id, PDO::PARAM_INT);

    $stmt->execute();
    $count = $stmt->rowCount();

    http_response_code(200);
    echo json_encode([
        "success" => true,
        "promotedCount" => $count,
        "message" => "Batch auto-promotion executed successfully for $count student(s)."
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Database error: " . $e->getMessage()]);
}
?>
