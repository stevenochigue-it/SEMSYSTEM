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
    // Total enrolled
    $s1 = $db->query("SELECT COUNT(*) AS total FROM enrollments WHERE enrollment_status = 'Enrolled'");
    $totalEnrolled = (int)($s1->fetch()['total'] ?? 0);

    // By Grade Level
    $s2 = $db->query("
        SELECT g.grade_name, COUNT(e.id) AS total
        FROM grade_levels g
        LEFT JOIN enrollments e ON g.id = e.grade_level_id AND e.enrollment_status = 'Enrolled'
        GROUP BY g.id, g.grade_name
    ");
    $byGradeLevel = [];
    while ($row = $s2->fetch(PDO::FETCH_ASSOC)) {
        $byGradeLevel[$row['grade_name']] = (int)$row['total'];
    }

    // By Strand (SHS: Grade 11 & 12)
    $byStrand = [
        'STEM' => 0,
        'TVL' => 0,
        'ABM' => 0,
        'HUMSS' => 0,
        'GAS' => 0
    ];
    $s3 = $db->query("
        SELECT sec.section_name, COUNT(e.id) AS total
        FROM sections sec
        JOIN enrollments e ON sec.id = e.section_id AND e.enrollment_status = 'Enrolled'
        WHERE sec.grade_level_id IN (5, 6)
        GROUP BY sec.id, sec.section_name
    ");
    while ($row = $s3->fetch(PDO::FETCH_ASSOC)) {
        foreach (array_keys($byStrand) as $strand) {
            if (strpos(strtoupper($row['section_name']), $strand) !== false) {
                $byStrand[$strand] += (int)$row['total'];
            }
        }
    }

    // By Promotion Status
    $s4 = $db->query("
        SELECT promotion_status, COUNT(*) AS total
        FROM enrollments
        GROUP BY promotion_status
    ");
    $byPromotionStatus = ['promoted' => 0, 'retained' => 0, 'conditional' => 0];
    while ($row = $s4->fetch(PDO::FETCH_ASSOC)) {
        $statusKey = strtolower($row['promotion_status']);
        if (isset($byPromotionStatus[$statusKey])) {
            $byPromotionStatus[$statusKey] = (int)$row['total'];
        }
    }

    http_response_code(200);
    echo json_encode([
        "totalEnrolled"      => $totalEnrolled,
        "byGradeLevel"       => $byGradeLevel,
        "byStrand"           => $byStrand,
        "byPromotionStatus"  => $byPromotionStatus,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Database error: " . $e->getMessage()]);
}
?>
