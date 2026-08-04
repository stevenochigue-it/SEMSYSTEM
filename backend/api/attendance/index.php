<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once '../../config/database.php';
$database = new Database();
$db = $database->getConnection();

try {
    $query = "SELECT
                gl.log_id,
                gl.qr_id,
                gl.scan_time,
                gl.status,
                s.student_id,
                s.student_number,
                s.first_name,
                s.middle_name,
                s.last_name,
                sec.section_name,
                grl.grade_name
              FROM gate_logs gl
              JOIN qr_codes q ON gl.qr_id = q.qr_id
              JOIN students s ON q.student_id = s.student_id
              JOIN sections sec ON s.section_id = sec.section_id
              JOIN grade_levels grl ON sec.grade_level_id = grl.grade_level_id
              ORDER BY gl.scan_time DESC
              LIMIT 500";

    $stmt = $db->prepare($query);
    $stmt->execute();
    $logs = $stmt->fetchAll();

    http_response_code(200);
    echo json_encode($logs);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error: " . $e->getMessage()]);
}
?>
