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

if (empty($data->qr_value)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "No QR code value provided."]);
    exit;
}

$qr_value = trim($data->qr_value);

try {
    // 1. Find the QR code record + student info
    $findQR = "SELECT
                  q.qr_id,
                  q.qr_value,
                  s.student_id,
                  s.student_number,
                  s.first_name,
                  s.middle_name,
                  s.last_name,
                  s.photo,
                  s.section_id,
                  sec.section_name,
                  gl.grade_name
               FROM qr_codes q
               JOIN students s ON q.student_id = s.student_id
               JOIN sections sec ON s.section_id = sec.section_id
               JOIN grade_levels gl ON sec.grade_level_id = gl.grade_level_id
               WHERE q.qr_value = :qr_value
               LIMIT 1";

    $stmt = $db->prepare($findQR);
    $stmt->bindParam(":qr_value", $qr_value);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        http_response_code(200);
        echo json_encode(["success" => false, "message" => "ACCESS DENIED — QR code not recognized."]);
        exit;
    }

    $record = $stmt->fetch();
    $qr_id = $record['qr_id'];

    // 2. Determine last gate status for this QR
    $lastLog = "SELECT status FROM gate_logs WHERE qr_id = :qr_id ORDER BY scan_time DESC LIMIT 1";
    $lastStmt = $db->prepare($lastLog);
    $lastStmt->bindParam(":qr_id", $qr_id);
    $lastStmt->execute();
    $lastRow = $lastStmt->fetch();

    // Toggle: if last was ENTRY → log EXIT; otherwise → log ENTRY
    $newStatus = 'ENTRY';
    $action    = 'entry';
    if ($lastRow && $lastRow['status'] === 'ENTRY') {
        $newStatus = 'EXIT';
        $action    = 'exit';
    }

    // 3. Insert new gate log
    $insertLog = "INSERT INTO gate_logs (qr_id, status) VALUES (:qr_id, :status)";
    $insertStmt = $db->prepare($insertLog);
    $insertStmt->bindParam(":qr_id",  $qr_id);
    $insertStmt->bindParam(":status", $newStatus);
    $insertStmt->execute();

    $message = $newStatus === 'ENTRY'
        ? "ACCESS GRANTED — Entry Recorded"
        : "ACCESS GRANTED — Exit Recorded";

    http_response_code(200);
    echo json_encode([
        "success" => true,
        "student" => [
            "student_id"     => $record['student_id'],
            "student_number" => $record['student_number'],
            "first_name"     => $record['first_name'],
            "middle_name"    => $record['middle_name'],
            "last_name"      => $record['last_name'],
            "photo"          => $record['photo'],
            "section_name"   => $record['section_name'],
            "grade_name"     => $record['grade_name'],
            "qr_value"       => $record['qr_value'],
            "last_status"    => $newStatus,
        ],
        "message" => $message,
        "action"  => $action,
        "status"  => $newStatus,
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?>
