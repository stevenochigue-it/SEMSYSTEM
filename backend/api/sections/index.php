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
                sec.id AS section_id,
                sec.section_name,
                gl.id AS grade_level_id,
                gl.grade_name
              FROM sections sec
              JOIN grade_levels gl ON sec.grade_level_id = gl.id
              ORDER BY gl.id ASC, sec.section_name ASC";

    $stmt = $db->prepare($query);
    $stmt->execute();
    $sections = $stmt->fetchAll();

    http_response_code(200);
    echo json_encode($sections);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error: " . $e->getMessage()]);
}
?>
