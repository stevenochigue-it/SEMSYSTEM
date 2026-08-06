<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        try {
            $query = "SELECT id, username, first_name, middle_name, last_name, role, active, created_at FROM users ORDER BY username ASC";
            $stmt = $db->prepare($query);
            $stmt->execute();
            
            $users = array();
            while ($row = $stmt->fetch()) {
                $row['full_name'] = trim(($row['first_name'] ?? '') . ' ' . (!empty($row['middle_name']) ? $row['middle_name'] . ' ' : '') . ($row['last_name'] ?? ''));
                $users[] = $row;
            }
            
            http_response_code(200);
            echo json_encode($users);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(array("message" => "Database error: " . $e->getMessage()));
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"));
        
        $first_name = !empty($data->first_name) ? trim($data->first_name) : (!empty($data->full_name) ? trim($data->full_name) : '');
        $middle_name = !empty($data->middle_name) ? trim($data->middle_name) : null;
        $last_name = !empty($data->last_name) ? trim($data->last_name) : '';
        
        if (!empty($data->username) && !empty($first_name) && !empty($data->password_hash) && !empty($data->role)) {
            try {
                $query = "INSERT INTO users SET 
                            username = :username, 
                            first_name = :first_name, 
                            middle_name = :middle_name, 
                            last_name = :last_name, 
                            password = :password, 
                            role = :role, 
                            active = 1";
                            
                $stmt = $db->prepare($query);
                
                // Hash password using BCRYPT
                $hashed_password = password_hash($data->password_hash, PASSWORD_BCRYPT);
                
                $stmt->bindParam(":username", $data->username);
                $stmt->bindParam(":first_name", $first_name);
                $stmt->bindParam(":middle_name", $middle_name);
                $stmt->bindParam(":last_name", $last_name);
                $stmt->bindParam(":password", $hashed_password);
                $stmt->bindParam(":role", $data->role);
                
                if ($stmt->execute()) {
                    http_response_code(201);
                    echo json_encode(array("success" => true, "message" => "User account created successfully."));
                } else {
                    http_response_code(500);
                    echo json_encode(array("success" => false, "message" => "Failed to create user."));
                }
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(array("success" => false, "message" => "Database error: " . $e->getMessage()));
            }
        } else {
            http_response_code(400);
            echo json_encode(array("success" => false, "message" => "Incomplete details. First Name and Last Name are required."));
        }
        break;

    case 'PUT':
        $id = isset($_GET['id']) ? $_GET['id'] : null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(array("success" => false, "message" => "User ID is required."));
            break;
        }
        
        $data = json_decode(file_get_contents("php://input"));
        
        try {
            $fields = [];
            $params = [":id" => $id];
            
            foreach ($data as $key => $value) {
                if ($key !== 'id' && $key !== 'created_at') {
                    if ($key === 'password_hash') {
                        // If password hash is sent, hash it and map to database column 'password'
                        if (!empty($value)) {
                            $fields[] = "password = :password";
                            $params[":password"] = password_hash($value, PASSWORD_BCRYPT);
                        }
                    } else {
                        $fields[] = "$key = :$key";
                        $params[":$key"] = $value;
                    }
                }
            }
            
            if (empty($fields)) {
                http_response_code(400);
                echo json_encode(array("success" => false, "message" => "No valid update fields."));
                break;
            }
            
            $query = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = :id";
            $stmt = $db->prepare($query);
            
            if ($stmt->execute($params)) {
                http_response_code(200);
                echo json_encode(array("success" => true, "message" => "User details updated."));
            } else {
                http_response_code(500);
                echo json_encode(array("success" => false, "message" => "Update execution failed."));
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(array("success" => false, "message" => "Database error: " . $e->getMessage()));
        }
        break;

    case 'DELETE':
        $id = isset($_GET['id']) ? $_GET['id'] : null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(array("success" => false, "message" => "User ID is required."));
            break;
        }
        
        try {
            $query = "DELETE FROM users WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(":id", $id);
            
            if ($stmt->execute()) {
                http_response_code(200);
                echo json_encode(array("success" => true, "message" => "User deleted successfully."));
            } else {
                http_response_code(500);
                echo json_encode(array("success" => false, "message" => "Delete execution failed."));
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(array("success" => false, "message" => "Database error: " . $e->getMessage()));
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(array("message" => "Method not allowed."));
        break;
}
?>
