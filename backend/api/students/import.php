<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed."]);
    exit;
}

require_once '../../config/database.php';
$database = new Database();
$db = $database->getConnection();

$body    = json_decode(file_get_contents("php://input"), true);
$students = $body['students'] ?? [];

if (empty($students)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "No student data provided."]);
    exit;
}

$imported = 0;
$skipped  = 0;
$errors   = [];
$admin_id = 1; // single-admin system

$checkNum = $db->prepare("SELECT student_id FROM students WHERE student_number = :sn");
$checkSec = $db->prepare("SELECT section_id FROM sections WHERE section_id = :sid");

$insStudent = $db->prepare("INSERT INTO students
    (student_number, first_name, middle_name, last_name, section_id, admin_id)
    VALUES (:sn, :fn, :mn, :ln, :sid, :aid)");

$insQR = $db->prepare("INSERT INTO qr_codes (student_id, qr_value) VALUES (:sid, :qv)");

foreach ($students as $idx => $row) {
    $rowNum = $idx + 2;

    $sn  = trim((string)($row['student_number'] ?? ''));
    $fn  = trim((string)($row['first_name']     ?? ''));
    $mn  = trim((string)($row['middle_name']    ?? ''));
    $ln  = trim((string)($row['last_name']      ?? ''));
    $sid = (int)($row['section_id']             ?? 0);

    if (!$sn || !$fn || !$ln || !$sid) {
        $errors[] = "Row {$rowNum}: Missing required fields (student_number, first_name, last_name, section_id).";
        $skipped++;
        continue;
    }

    // Check duplicate student number
    $checkNum->bindParam(':sn', $sn);
    $checkNum->execute();
    if ($checkNum->fetch()) {
        $errors[] = "Row {$rowNum}: Student number '{$sn}' already exists — skipped.";
        $skipped++;
        continue;
    }

    // Validate section_id exists
    $checkSec->bindParam(':sid', $sid);
    $checkSec->execute();
    if (!$checkSec->fetch()) {
        $errors[] = "Row {$rowNum}: section_id '{$sid}' does not exist — skipped.";
        $skipped++;
        continue;
    }

    try {
        $db->beginTransaction();

        $mnNull = $mn ?: null;
        $insStudent->bindParam(':sn',  $sn);
        $insStudent->bindParam(':fn',  $fn);
        $insStudent->bindParam(':mn',  $mnNull);
        $insStudent->bindParam(':ln',  $ln);
        $insStudent->bindParam(':sid', $sid);
        $insStudent->bindParam(':aid', $admin_id);
        $insStudent->execute();

        $newId   = $db->lastInsertId();
        $qrValue = 'STU-' . $sn;
        $insQR->bindParam(':sid', $newId);
        $insQR->bindParam(':qv',  $qrValue);
        $insQR->execute();

        $db->commit();
        $imported++;
    } catch (PDOException $e) {
        $db->rollBack();
        $errors[] = "Row {$rowNum}: DB error — " . $e->getMessage();
        $skipped++;
    }
}

http_response_code(200);
echo json_encode([
    "success"  => true,
    "imported" => $imported,
    "skipped"  => $skipped,
    "errors"   => $errors,
    "message"  => "Import complete. {$imported} student(s) added, {$skipped} skipped.",
]);
?>
