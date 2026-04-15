<?php
// Database Configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'patient_record_db');

function getDBConnection() {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    if ($conn->connect_error) {
        die(json_encode(['error' => 'Database connection failed: ' . $conn->connect_error]));
    }
    $conn->set_charset('utf8mb4');
    return $conn;
}

// Session helper
function requireAuth() {
    if (session_status() === PHP_SESSION_NONE) session_start();
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        die(json_encode(['error' => 'Unauthorized']));
    }
}

function jsonResponse($data, $code = 200) {
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

function logActivity($action, $entity_type, $entity_id, $performed_by, $details = '') {
    $conn = getDBConnection();
    $stmt = $conn->prepare("INSERT INTO activity_log (action, entity_type, entity_id, performed_by, details) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param('sssss', $action, $entity_type, $entity_id, $performed_by, $details);
    $stmt->execute();
    $conn->close();
}
?>
