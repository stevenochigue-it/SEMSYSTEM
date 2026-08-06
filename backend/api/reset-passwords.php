<?php
require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

// Show current users
$stmt = $db->query("SELECT id, username, password, role, active FROM users");
$users = $stmt->fetchAll();

echo "<pre style='font-size:18px; font-family:monospace;'>";
echo "=== CURRENT USERS IN DATABASE ===\n\n";
foreach ($users as $u) {
    echo "ID:       {$u['id']}\n";
    echo "Username: {$u['username']}\n";
    echo "Password: {$u['password']}\n";
    echo "Role:     {$u['role']}\n";
    echo "Active:   {$u['active']}\n";
    echo "---\n";
}

// Force update
$db->exec("UPDATE users SET password = 'guard123' WHERE username = 'guard'");
$db->exec("UPDATE users SET password = 'admin123' WHERE username = 'admin'");
echo "\n✅ Passwords forcefully updated!\n\n";

// Show after update
$stmt2 = $db->query("SELECT username, password, role FROM users");
$users2 = $stmt2->fetchAll();
echo "=== AFTER UPDATE ===\n";
foreach ($users2 as $u) {
    echo "username: {$u['username']} | password: {$u['password']} | role: {$u['role']}\n";
}
echo "</pre>";
?>
