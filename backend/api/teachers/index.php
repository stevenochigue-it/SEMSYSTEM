<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once '../../config/database.php';
$database = new Database();
$db = $database->getConnection();

// Auto-create table if missing in MySQL
$createTableSql = "CREATE TABLE IF NOT EXISTS teachers (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    employee_id      VARCHAR(50) NULL,
    first_name       VARCHAR(100) NOT NULL,
    middle_name      VARCHAR(100) NULL,
    last_name        VARCHAR(100) NOT NULL,
    subject          VARCHAR(150) NULL,
    grade_level      VARCHAR(50) NULL,
    section_advisory VARCHAR(100) NULL,
    contact_number   VARCHAR(30) NULL,
    status           ENUM('active', 'on_leave', 'inactive') NOT NULL DEFAULT 'active',
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
$db->exec($createTableSql);

$method = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id']) ? (int)$_GET['id'] : null;

try {
    // ── GET: List all teachers ────────────────────────────────────────────────
    if ($method === 'GET') {
        $sql = "SELECT
                    t.id,
                    t.employee_id,
                    t.first_name,
                    t.middle_name,
                    t.last_name,
                    t.subject,
                    t.grade_level,
                    t.section_advisory,
                    t.contact_number,
                    t.status,
                    t.created_at,
                    CONCAT_WS(' ', t.first_name, t.middle_name, t.last_name) AS full_name
                FROM teachers t
                ORDER BY t.last_name ASC, t.first_name ASC";
        $stmt = $db->prepare($sql);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        http_response_code(200);
        echo json_encode($rows);
        exit;
    }

    // ── POST: Add new teacher ─────────────────────────────────────────────────
    if ($method === 'POST') {
        $data = json_decode(file_get_contents("php://input"));

        if (empty($data->first_name) || empty($data->last_name)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "First name and last name are required."]);
            exit;
        }

        $sql = "INSERT INTO teachers
                    (employee_id, first_name, middle_name, last_name, subject, grade_level, section_advisory, contact_number, status)
                VALUES
                    (:emp_id, :first, :middle, :last, :subject, :grade_level, :section_adv, :contact, :status)";
        $stmt = $db->prepare($sql);
        $stmt->execute([
            ':emp_id'      => $data->employee_id      ?? null,
            ':first'       => trim($data->first_name),
            ':middle'      => $data->middle_name       ?? null,
            ':last'        => trim($data->last_name),
            ':subject'     => $data->subject           ?? null,
            ':grade_level' => $data->grade_level       ?? null,
            ':section_adv' => $data->section_advisory  ?? null,
            ':contact'     => $data->contact_number    ?? null,
            ':status'      => $data->status            ?? 'active',
        ]);

        $newId = $db->lastInsertId();
        $getNew = $db->prepare("SELECT *, CONCAT_WS(' ', first_name, middle_name, last_name) AS full_name FROM teachers WHERE id = :id");
        $getNew->execute([':id' => $newId]);
        $newRow = $getNew->fetch(PDO::FETCH_ASSOC);

        http_response_code(201);
        echo json_encode(["success" => true, "message" => "Teacher added successfully.", "teacher" => $newRow]);
        exit;
    }

    // ── PUT: Update existing teacher ──────────────────────────────────────────
    if ($method === 'PUT' && $id) {
        $data = json_decode(file_get_contents("php://input"));

        $sql = "UPDATE teachers SET
                    employee_id      = :emp_id,
                    first_name       = :first,
                    middle_name      = :middle,
                    last_name        = :last,
                    subject          = :subject,
                    grade_level      = :grade_level,
                    section_advisory = :section_adv,
                    contact_number   = :contact,
                    status           = :status
                WHERE id = :id";
        $stmt = $db->prepare($sql);
        $stmt->execute([
            ':emp_id'      => $data->employee_id      ?? null,
            ':first'       => trim($data->first_name  ?? ''),
            ':middle'      => $data->middle_name       ?? null,
            ':last'        => trim($data->last_name    ?? ''),
            ':subject'     => $data->subject           ?? null,
            ':grade_level' => $data->grade_level       ?? null,
            ':section_adv' => $data->section_advisory  ?? null,
            ':contact'     => $data->contact_number    ?? null,
            ':status'      => $data->status            ?? 'active',
            ':id'          => $id,
        ]);

        http_response_code(200);
        echo json_encode(["success" => true, "message" => "Teacher updated successfully."]);
        exit;
    }

    // ── DELETE: Remove teacher ────────────────────────────────────────────────
    if ($method === 'DELETE' && $id) {
        $stmt = $db->prepare("DELETE FROM teachers WHERE id = :id");
        $stmt->execute([':id' => $id]);
        http_response_code(200);
        echo json_encode(["success" => true, "message" => "Teacher deleted successfully."]);
        exit;
    }

    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed."]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?>
