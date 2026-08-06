<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once '../../config/database.php';

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->username) && !empty($data->password)) {
    $database = new Database();
    $db = $database->getConnection();

    try {
        // 1. Try checking the users table (Admin / Guard / Parent)
        $userQuery = "SELECT id, username, password, first_name, middle_name, last_name, role, active
                      FROM users
                      WHERE username = :username
                      LIMIT 1";
        $stmt = $db->prepare($userQuery);
        $stmt->bindParam(":username", $data->username);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch();

            if (isset($row['active']) && (int)$row['active'] === 0) {
                http_response_code(403);
                echo json_encode(["success" => false, "message" => "Account is inactive."]);
                exit;
            }

            $valid = ($data->password === $row['password'])
                  || password_verify($data->password, $row['password']);

            if ($valid) {
                $token = base64_encode(json_encode([
                    "id"   => $row['id'],
                    "role" => $row['role'],
                    "exp"  => time() + 3600
                ]));

                $fullNameFormatted = trim($row['first_name'] . ' ' . ($row['middle_name'] ? $row['middle_name'] . ' ' : '') . $row['last_name']);

                http_response_code(200);
                echo json_encode([
                    "success" => true,
                    "token"   => $token,
                    "user"    => [
                        "id"          => (string)$row['id'],
                        "username"    => $row['username'],
                        "first_name"  => $row['first_name'],
                        "middle_name" => $row['middle_name'] ?? '',
                        "last_name"   => $row['last_name'],
                        "full_name"   => $fullNameFormatted,
                        "role"        => $row['role'],
                        "position"    => $row['role'] === 'guard' ? 'Gate Security Officer' : 'System User',
                        "email"       => '',
                    ]
                ]);
                exit;
            } else {
                http_response_code(401);
                echo json_encode(["success" => false, "message" => "Invalid password."]);
                exit;
            }
        }

        // 2. Try checking the system_admins table
        $adminQuery = "SELECT admin_id, username, password, first_name, middle_name, last_name, position, email
                       FROM system_admins
                       WHERE username = :username
                       LIMIT 1";
        $stmt = $db->prepare($adminQuery);
        $stmt->bindParam(":username", $data->username);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch();

            $valid = ($data->password === $row['password'])
                  || password_verify($data->password, $row['password']);

            if ($valid) {
                $token = base64_encode(json_encode([
                    "id"   => $row['admin_id'],
                    "role" => "admin",
                    "exp"  => time() + 3600
                ]));

                $fullNameFormatted = trim($row['first_name'] . ' ' . ($row['middle_name'] ? $row['middle_name'] . ' ' : '') . $row['last_name']);

                http_response_code(200);
                echo json_encode([
                    "success" => true,
                    "token"   => $token,
                    "user"    => [
                        "id"          => (string)$row['admin_id'],
                        "username"    => $row['username'],
                        "first_name"  => $row['first_name'],
                        "middle_name" => $row['middle_name'] ?? '',
                        "last_name"   => $row['last_name'],
                        "full_name"   => $fullNameFormatted,
                        "role"        => "admin",
                        "position"    => $row['position'],
                        "email"       => $row['email'],
                    ]
                ]);
                exit;
            } else {
                http_response_code(401);
                echo json_encode(["success" => false, "message" => "Invalid password."]);
                exit;
            }
        }

        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Invalid username or password."]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Server error: " . $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Incomplete credentials."]);
}
?>
