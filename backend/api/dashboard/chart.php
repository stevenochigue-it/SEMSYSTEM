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
                DATE(scan_time) AS log_date,
                SUM(CASE WHEN status = 'ENTRY' THEN 1 ELSE 0 END) AS entries,
                SUM(CASE WHEN status = 'EXIT'  THEN 1 ELSE 0 END) AS exits
              FROM gate_logs
              GROUP BY DATE(scan_time)
              ORDER BY log_date DESC
              LIMIT 7";

    $stmt = $db->prepare($query);
    $stmt->execute();

    $raw = [];
    while ($row = $stmt->fetch()) {
        $raw[] = [
            "date"     => date('M d', strtotime($row['log_date'])),
            "raw_date" => $row['log_date'],
            "entries"  => (int)$row['entries'],
            "exits"    => (int)$row['exits'],
        ];
    }

    // Reverse so it's chronological left→right
    $chartData = array_reverse($raw);

    // Pad to 7 days if needed
    if (count($chartData) < 7) {
        $needed = 7 - count($chartData);
        $filled = [];
        for ($i = $needed; $i > 0; $i--) {
            $d = date('Y-m-d', strtotime("-{$i} days"));
            $filled[] = ["date" => date('M d', strtotime($d)), "raw_date" => $d, "entries" => 0, "exits" => 0];
        }
        $chartData = array_merge($filled, $chartData);
    }

    http_response_code(200);
    echo json_encode($chartData);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Database error: " . $e->getMessage()]);
}
?>
