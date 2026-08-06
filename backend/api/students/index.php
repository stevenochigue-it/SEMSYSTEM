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
$method = $_SERVER['REQUEST_METHOD'];

// Helper: read current admin_id (defaults to 1 for single-admin systems)
function getAdminId() { return 1; }

switch ($method) {

    // ─── GET: List all students with section + grade info ─────────────────
    case 'GET':
        try {
            $query = "SELECT
                        s.student_id,
                        s.student_number,
                        s.first_name,
                        s.middle_name,
                        s.last_name,
                        s.photo,
                        s.section_id,
                        sec.section_name,
                        gl.grade_level_id,
                        gl.grade_name,
                        q.qr_id,
                        q.qr_value,
                        q.created_at,
                        (
                            SELECT gl2.status
                            FROM gate_logs gl2
                            WHERE gl2.qr_id = q.qr_id
                            ORDER BY gl2.scan_time DESC
                            LIMIT 1
                        ) AS last_status
                      FROM students s
                      JOIN sections sec ON s.section_id = sec.section_id
                      JOIN grade_levels gl ON sec.grade_level_id = gl.grade_level_id
                      LEFT JOIN qr_codes q ON q.student_id = s.student_id
                      ORDER BY s.last_name ASC";

            $stmt = $db->prepare($query);
            $stmt->execute();
            $students = $stmt->fetchAll();

            http_response_code(200);
            echo json_encode($students);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["message" => "Error: " . $e->getMessage()]);
        }
        break;

    // ─── POST: Add student + auto-create QR code ──────────────────────────
    case 'POST':
        $data = json_decode(file_get_contents("php://input"));

        if (
            !empty($data->student_number) &&
            !empty($data->first_name) &&
            !empty($data->last_name) &&
            !empty($data->section_id)
        ) {
            try {
                $db->beginTransaction();

                $insertStudent = "INSERT INTO students
                    (student_number, first_name, middle_name, last_name, photo, section_id, admin_id)
                    VALUES
                    (:student_number, :first_name, :middle_name, :last_name, :photo, :section_id, :admin_id)";

                $stmt = $db->prepare($insertStudent);
                $stmt->bindParam(":student_number", $data->student_number);
                $stmt->bindParam(":first_name",     $data->first_name);
                $middle = $data->middle_name ?? null;
                $stmt->bindParam(":middle_name",    $middle);
                $stmt->bindParam(":last_name",      $data->last_name);
                $photo = $data->photo ?? null;
                $stmt->bindParam(":photo",          $photo);
                $stmt->bindParam(":section_id",     $data->section_id);
                $admin_id = getAdminId();
                $stmt->bindParam(":admin_id",       $admin_id);
                $stmt->execute();

                $new_student_id = $db->lastInsertId();

                // Auto-create QR code (value = STU-{student_number})
                $qr_value = 'STU-' . $data->student_number;
                $insertQR = "INSERT INTO qr_codes (student_id, qr_value) VALUES (:student_id, :qr_value)
                             ON DUPLICATE KEY UPDATE qr_value = VALUES(qr_value)";
                $qrStmt = $db->prepare($insertQR);
                $qrStmt->bindParam(":student_id", $new_student_id);
                $qrStmt->bindParam(":qr_value",   $qr_value);
                $qrStmt->execute();

                $db->commit();

                http_response_code(201);
                echo json_encode(["success" => true, "message" => "Student registered successfully.", "qr_value" => $qr_value]);
            } catch (PDOException $e) {
                $db->rollBack();
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Missing required fields: student_number (LRN), first_name, last_name, section_id."]);
        }
        break;

    // ─── PUT: Update student ──────────────────────────────────────────────
    case 'PUT':
        $id = $_GET['id'] ?? null;
        if (!$id) { http_response_code(400); echo json_encode(["success" => false, "message" => "student_id is required."]); break; }

        $data = json_decode(file_get_contents("php://input"), true);
        try {
            $allowed = ['first_name','middle_name','last_name','photo','section_id'];
            $fields = [];
            $params = [":id" => $id];
            foreach ($data as $key => $value) {
                if (in_array($key, $allowed)) {
                    $fields[] = "$key = :$key";
                    $params[":$key"] = $value;
                }
            }
            if (empty($fields)) { http_response_code(400); echo json_encode(["success" => false, "message" => "No valid fields to update."]); break; }

            $query = "UPDATE students SET " . implode(', ', $fields) . " WHERE student_id = :id";
            $stmt = $db->prepare($query);
            $stmt->execute($params);

            http_response_code(200);
            echo json_encode(["success" => true, "message" => "Student updated."]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
        }
        break;

    // ─── DELETE: Remove student (cascades to qr_codes and gate_logs) ──────
    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if (!$id) { http_response_code(400); echo json_encode(["success" => false, "message" => "student_id is required."]); break; }

        try {
            $stmt = $db->prepare("DELETE FROM students WHERE student_id = :id");
            $stmt->bindParam(":id", $id);
            $stmt->execute();

            http_response_code(200);
            echo json_encode(["success" => true, "message" => "Student deleted."]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["message" => "Method not allowed."]);
}
?>
