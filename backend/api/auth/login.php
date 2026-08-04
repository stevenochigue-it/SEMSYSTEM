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
        $query = "SELECT admin_id, username, password, full_name, position, email
                  FROM system_admins
                  WHERE username = :username
                  LIMIT 1";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":username", $data->username);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch();

            // Support plain-text or bcrypt
            $valid = ($data->password === $row['password'])
                  || password_verify($data->password, $row['password']);

            if ($valid) {
                $token = base64_encode(json_encode([
                    "id"   => $row['admin_id'],
                    "role" => "admin",
                    "exp"  => time() + 3600
                ]));

                http_response_code(200);
                echo json_encode([
                    "success" => true,
                    "token"   => $token,
                    "user"    => [
                        "id"        => $row['admin_id'],
                        "username"  => $row['username'],
                        "full_name" => $row['full_name'],
                        "role"      => "admin",
                        "position"  => $row['position'],
                        "email"     => $row['email'],
                    ]
                ]);
            } else {
                http_response_code(401);
                echo json_encode(["success" => false, "message" => "Invalid password."]);
            }
        } else {
            http_response_code(401);
            echo json_encode(["success" => false, "message" => "Invalid username."]);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Server error: " . $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Incomplete credentials."]);
}
?>
