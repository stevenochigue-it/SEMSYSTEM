<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../../config/database.php';
$database = new Database();
$db = $database->getConnection();

try {
    // 1. Fetch all students
    $stmt = $db->query("SELECT id, student_id_number FROM students");
    $students = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($students)) {
        http_response_code(200);
        echo json_encode(["success" => false, "message" => "No students found in system to generate reports data."]);
        exit;
    }

    // 2. Ensure each student has a QR code record
    $qrMap = []; // student_id => qr_id
    foreach ($students as $student) {
        $sid = $student['id'];
        $stNo = $student['student_id_number'];

        $checkQr = $db->prepare("SELECT id FROM qr_codes WHERE student_id = :sid LIMIT 1");
        $checkQr->execute([':sid' => $sid]);
        $qrId = $checkQr->fetchColumn();

        if (!$qrId) {
            $qrVal = strpos($stNo, 'STU-') === 0 ? $stNo : 'STU-' . $stNo;
            $insQr = $db->prepare("INSERT INTO qr_codes (student_id, qr_value) VALUES (:sid, :qval)");
            $insQr->execute([':sid' => $sid, ':qval' => $qrVal]);
            $qrId = $db->lastInsertId();
        }

        $qrMap[$sid] = $qrId;
    }

    $insertedCount = 0;
    $insLog = $db->prepare("INSERT INTO gate_logs (qr_id, scan_time, status) VALUES (:qr_id, :scan_time, :status)");

    // Helper to generate formatted timestamp string
    $makeTimeStr = function($daysAgo, $hour, $minute) {
        $d = new DateTime();
        if ($daysAgo > 0) {
            $d->modify("-{$daysAgo} days");
        }
        $d->setTime($hour, $minute, rand(10, 59));
        return $d->format('Y-m-d H:i:s');
    };

    // Dates schedule to populate:
    // Today (0 days ago)
    // Past 7 days (1 to 7 days ago)
    // Past 30 days (8 to 30 days ago, select weekdays)
    // Past year (40 to 300 days ago, sparse selection)
    $daysList = array_merge(
        [0], // today
        range(1, 7), // past week
        [10, 12, 15, 18, 20, 22, 25, 28], // past month
        [35, 45, 60, 75, 90, 120, 150, 180, 210, 240, 270, 300] // past year
    );

    foreach ($daysList as $daysAgo) {
        foreach ($students as $student) {
            $qrId = $qrMap[$student['id']];
            if (!$qrId) continue;

            // Randomize morning arrival time (7:15 AM - 7:55 AM)
            $entryHour = 7;
            $entryMin = rand(15, 55);
            $entryTimeStr = $makeTimeStr($daysAgo, $entryHour, $entryMin);

            $insLog->execute([
                ':qr_id' => $qrId,
                ':scan_time' => $entryTimeStr,
                ':status' => 'ENTRY'
            ]);
            $insertedCount++;

            // Randomize afternoon exit time (4:00 PM - 5:15 PM)
            $exitHour = rand(16, 17);
            $exitMin = rand(5, 45);
            $exitTimeStr = $makeTimeStr($daysAgo, $exitHour, $exitMin);

            $insLog->execute([
                ':qr_id' => $qrId,
                ':scan_time' => $exitTimeStr,
                ':status' => 'EXIT'
            ]);
            $insertedCount++;
        }
    }

    http_response_code(200);
    echo json_encode([
        "success" => true,
        "count" => $insertedCount,
        "message" => "Successfully generated {$insertedCount} mock attendance records for reports!"
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?>
