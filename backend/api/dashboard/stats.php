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
    $today = date('Y-m-d');

    // Total students
    $s1 = $db->query("SELECT COUNT(*) AS total FROM students");
    $totalStudents = (int)$s1->fetch()['total'];

    // Today's entries (ENTRY logs today)
    $s2 = $db->prepare("SELECT COUNT(*) AS total FROM gate_logs WHERE DATE(scan_time) = :today AND status = 'ENTRY'");
    $s2->bindParam(":today", $today);
    $s2->execute();
    $todayEntries = (int)$s2->fetch()['total'];

    // Today's exits (EXIT logs today)
    $s3 = $db->prepare("SELECT COUNT(*) AS total FROM gate_logs WHERE DATE(scan_time) = :today AND status = 'EXIT'");
    $s3->bindParam(":today", $today);
    $s3->execute();
    $todayExits = (int)$s3->fetch()['total'];

    // Students currently "inside": last gate_log status is ENTRY
    $s4 = $db->query("
        SELECT COUNT(*) AS total
        FROM (
            SELECT qr_id, status,
                   ROW_NUMBER() OVER (PARTITION BY qr_id ORDER BY scan_time DESC) AS rn
            FROM gate_logs
        ) latest
        WHERE rn = 1 AND status = 'ENTRY'
    ");
    $studentsInside  = (int)$s4->fetch()['total'];
    $studentsOutside = $totalStudents - $studentsInside;

    // Total gate logs (used as 'activity count' replacing invalid scans)
    $s5 = $db->query("SELECT COUNT(*) AS total FROM gate_logs");
    $totalLogs = (int)$s5->fetch()['total'];

    http_response_code(200);
    echo json_encode([
        "totalStudents"   => $totalStudents,
        "studentsInside"  => $studentsInside,
        "studentsOutside" => $studentsOutside,
        "todayEntries"    => $todayEntries,
        "todayExits"      => $todayExits,
        "invalidScans"    => 0,
        "totalLogs"       => $totalLogs,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Database error: " . $e->getMessage()]);
}
?>
