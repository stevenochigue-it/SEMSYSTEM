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

$invalid_scans_file = sys_get_temp_dir() . '/sem_invalid_scans.txt';
file_put_contents($invalid_scans_file, '0');

http_response_code(200);
echo json_encode(array("success" => true, "message" => "Counter reset successfully."));
?>
