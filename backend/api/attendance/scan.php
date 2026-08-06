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
    echo json_encode(["success" => false, "message" => "No QR code or Student ID provided."]);
    exit;
}

$raw_input = trim($data->qr_value);
$stu_prefix_value = 'STU-' . preg_replace('/^STU-?/i', '', $raw_input);
$numeric_only_value = preg_replace('/^STU-?/i', '', $raw_input);

try {
    // 1. Find the student record via qr_value OR student_number (supports both "2025001" and "STU-2025001")
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
               FROM students s
               JOIN sections sec ON s.section_id = sec.section_id
               JOIN grade_levels gl ON sec.grade_level_id = gl.grade_level_id
               LEFT JOIN qr_codes q ON q.student_id = s.student_id
               WHERE q.qr_value = :raw_input
                  OR q.qr_value = :stu_prefix
                  OR s.student_number = :raw_input
                  OR s.student_number = :numeric_val
               LIMIT 1";

    $stmt = $db->prepare($findQR);
    $stmt->bindParam(":raw_input",   $raw_input);
    $stmt->bindParam(":stu_prefix",  $stu_prefix_value);
    $stmt->bindParam(":numeric_val", $numeric_only_value);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        http_response_code(200);
        echo json_encode(["success" => false, "message" => "ACCESS DENIED — Student ID or QR code not recognized."]);
        exit;
    }

    $record = $stmt->fetch();
    $student_id = $record['student_id'];
    $qr_id = $record['qr_id'];

    // 2. If the qr_codes row is missing for this student, auto-generate it on the fly!
    if (empty($qr_id)) {
        $generated_qr = 'STU-' . $record['student_number'];
        $insertQR = $db->prepare("INSERT INTO qr_codes (student_id, qr_value) VALUES (:sid, :qval) ON DUPLICATE KEY UPDATE qr_value = VALUES(qr_value)");
        $insertQR->execute([":sid" => $student_id, ":qval" => $generated_qr]);

        // Get the qr_id
        $getQrId = $db->prepare("SELECT qr_id FROM qr_codes WHERE student_id = :sid LIMIT 1");
        $getQrId->execute([":sid" => $student_id]);
        $qr_id = $getQrId->fetchColumn();
    }

    // 3. Determine last gate status for this QR
    $lastLog = "SELECT status FROM gate_logs WHERE qr_id = :qr_id ORDER BY scan_time DESC LIMIT 1";
    $lastStmt = $db->prepare($lastLog);
    $lastStmt->bindParam(":qr_id", $qr_id);
    $lastStmt->execute();
    $lastRow = $lastStmt->fetch();

    // Toggle: if last was ENTRY → log EXIT; otherwise → log ENTRY
    $newStatus = 'ENTRY';
    $action    = 'time_in';
    if ($lastRow && $lastRow['status'] === 'ENTRY') {
        $newStatus = 'EXIT';
        $action    = 'time_out';
    }

    // 4. Insert new gate log
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
            "student_id"     => (string)$record['student_id'],
            "student_number" => $record['student_number'],
            "first_name"     => $record['first_name'],
            "middle_name"    => $record['middle_name'],
            "last_name"      => $record['last_name'],
            "photo"          => $record['photo'],
            "section_name"   => $record['section_name'],
            "grade_name"     => $record['grade_name'],
            "qr_value"       => $record['qr_value'] ?: ('STU-' . $record['student_number']),
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
