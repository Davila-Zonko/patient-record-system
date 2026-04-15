<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

require_once 'config.php';

if (session_status() === PHP_SESSION_NONE) session_start();

$path = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true) ?? [];

switch($path) {

    // ========== AUTH ==========
    case 'login':
        $conn = getDBConnection();
        $username = $input['username'] ?? '';
        $password = $input['password'] ?? '';
        
        $stmt = $conn->prepare("SELECT * FROM users WHERE username = ?");
        $stmt->bind_param('s', $username);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();
        
        if ($result && password_verify($password, $result['password'])) {
            $_SESSION['user_id'] = $result['id'];
            $_SESSION['username'] = $result['username'];
            $_SESSION['full_name'] = $result['full_name'];
            $_SESSION['role'] = $result['role'];
            logActivity('LOGIN', 'user', $result['username'], $result['username'], 'User logged in');
            jsonResponse(['success' => true, 'user' => ['id' => $result['id'], 'username' => $result['username'], 'full_name' => $result['full_name'], 'role' => $result['role']]]);
        } else {
            jsonResponse(['error' => 'Invalid credentials'], 401);
        }
        break;

    case 'logout':
        logActivity('LOGOUT', 'user', $_SESSION['username'] ?? '', $_SESSION['username'] ?? '', 'User logged out');
        session_destroy();
        jsonResponse(['success' => true]);
        break;

    case 'check_auth':
        if (isset($_SESSION['user_id'])) {
            jsonResponse(['authenticated' => true, 'user' => ['full_name' => $_SESSION['full_name'], 'role' => $_SESSION['role'], 'username' => $_SESSION['username']]]);
        } else {
            jsonResponse(['authenticated' => false]);
        }
        break;

    // ========== PATIENTS ==========
    case 'get_patients':
        requireAuth();
        $conn = getDBConnection();
        $search = $_GET['search'] ?? '';
        $status = $_GET['status'] ?? '';
        $limit = intval($_GET['limit'] ?? 50);
        $offset = intval($_GET['offset'] ?? 0);

        $where = ['1=1'];
        $params = [];
        $types = '';

        if ($search) {
            $where[] = "(first_name LIKE ? OR last_name LIKE ? OR patient_id LIKE ? OR email LIKE ?)";
            $s = "%$search%";
            $params = array_merge($params, [$s, $s, $s, $s]);
            $types .= 'ssss';
        }
        if ($status) {
            $where[] = "status = ?";
            $params[] = $status;
            $types .= 's';
        }

        $whereStr = implode(' AND ', $where);
        $stmt = $conn->prepare("SELECT *, TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) as age FROM patients WHERE $whereStr ORDER BY created_at DESC LIMIT ? OFFSET ?");
        $params[] = $limit;
        $params[] = $offset;
        $types .= 'ii';

        if ($params) $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

        // Count
        $stmtCount = $conn->prepare("SELECT COUNT(*) as total FROM patients WHERE $whereStr");
        if (count($params) > 2) {
            $countParams = array_slice($params, 0, -2);
            $countTypes = substr($types, 0, -2);
            $stmtCount->bind_param($countTypes, ...$countParams);
        }
        $stmtCount->execute();
        $total = $stmtCount->get_result()->fetch_assoc()['total'];

        jsonResponse(['patients' => $rows, 'total' => $total]);
        break;

    case 'get_patient':
        requireAuth();
        $conn = getDBConnection();
        $id = $_GET['id'] ?? '';
        $stmt = $conn->prepare("SELECT *, TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) as age FROM patients WHERE patient_id = ?");
        $stmt->bind_param('s', $id);
        $stmt->execute();
        $patient = $stmt->get_result()->fetch_assoc();
        if (!$patient) jsonResponse(['error' => 'Patient not found'], 404);
        logActivity('VIEW', 'patient', $id, $_SESSION['username'], 'Patient profile viewed');
        jsonResponse($patient);
        break;

    case 'add_patient':
        requireAuth();
        $conn = getDBConnection();
        
        // Generate patient ID
        $result = $conn->query("SELECT MAX(CAST(SUBSTRING(patient_id, 5) AS UNSIGNED)) as max_id FROM patients");
        $maxId = $result->fetch_assoc()['max_id'] ?? 0;
        $newId = 'PRS-' . str_pad($maxId + 1, 5, '0', STR_PAD_LEFT);

        $fields = ['patient_id', 'first_name', 'last_name', 'date_of_birth', 'gender', 'blood_type', 'phone', 'email', 'address', 'emergency_contact', 'emergency_phone', 'insurance_number', 'allergies', 'chronic_conditions', 'status'];
        $input['patient_id'] = $newId;

        $cols = implode(', ', $fields);
        $placeholders = implode(', ', array_fill(0, count($fields), '?'));
        $stmt = $conn->prepare("INSERT INTO patients ($cols) VALUES ($placeholders)");
        $values = array_map(fn($f) => $input[$f] ?? '', $fields);
        $types = str_repeat('s', count($fields));
        $stmt->bind_param($types, ...$values);

        if ($stmt->execute()) {
            logActivity('CREATE', 'patient', $newId, $_SESSION['username'], "New patient {$input['first_name']} {$input['last_name']} registered");
            jsonResponse(['success' => true, 'patient_id' => $newId]);
        } else {
            jsonResponse(['error' => 'Failed to add patient: ' . $conn->error], 500);
        }
        break;

    case 'update_patient':
        requireAuth();
        $conn = getDBConnection();
        $id = $input['patient_id'] ?? '';
        $fields = ['first_name', 'last_name', 'date_of_birth', 'gender', 'blood_type', 'phone', 'email', 'address', 'emergency_contact', 'emergency_phone', 'insurance_number', 'allergies', 'chronic_conditions', 'status'];
        $setStr = implode(', ', array_map(fn($f) => "$f = ?", $fields));
        $stmt = $conn->prepare("UPDATE patients SET $setStr WHERE patient_id = ?");
        $values = array_map(fn($f) => $input[$f] ?? '', $fields);
        $values[] = $id;
        $types = str_repeat('s', count($fields) + 1);
        $stmt->bind_param($types, ...$values);
        if ($stmt->execute()) {
            logActivity('UPDATE', 'patient', $id, $_SESSION['username'], 'Patient record updated');
            jsonResponse(['success' => true]);
        } else {
            jsonResponse(['error' => 'Update failed'], 500);
        }
        break;

    case 'delete_patient':
        requireAuth();
        $conn = getDBConnection();
        $id = $input['patient_id'] ?? $_GET['id'] ?? '';
        $stmt = $conn->prepare("DELETE FROM patients WHERE patient_id = ?");
        $stmt->bind_param('s', $id);
        if ($stmt->execute()) {
            logActivity('DELETE', 'patient', $id, $_SESSION['username'], 'Patient record deleted');
            jsonResponse(['success' => true]);
        } else {
            jsonResponse(['error' => 'Delete failed'], 500);
        }
        break;

    // ========== MEDICAL RECORDS ==========
    case 'get_records':
        requireAuth();
        $conn = getDBConnection();
        $patientId = $_GET['patient_id'] ?? '';
        if ($patientId) {
            $stmt = $conn->prepare("SELECT mr.*, CONCAT(p.first_name, ' ', p.last_name) as patient_name FROM medical_records mr JOIN patients p ON mr.patient_id = p.patient_id WHERE mr.patient_id = ? ORDER BY mr.visit_date DESC");
            $stmt->bind_param('s', $patientId);
        } else {
            $stmt = $conn->prepare("SELECT mr.*, CONCAT(p.first_name, ' ', p.last_name) as patient_name FROM medical_records mr JOIN patients p ON mr.patient_id = p.patient_id ORDER BY mr.visit_date DESC LIMIT 50");
        }
        $stmt->execute();
        jsonResponse($stmt->get_result()->fetch_all(MYSQLI_ASSOC));
        break;

    case 'add_record':
        requireAuth();
        $conn = getDBConnection();
        $fields = ['patient_id', 'visit_date', 'doctor_name', 'department', 'diagnosis', 'symptoms', 'treatment', 'medications', 'notes', 'follow_up_date'];
        $cols = implode(', ', $fields);
        $placeholders = implode(', ', array_fill(0, count($fields), '?'));
        $stmt = $conn->prepare("INSERT INTO medical_records ($cols) VALUES ($placeholders)");
        $values = array_map(fn($f) => $input[$f] ?? null, $fields);
        $types = str_repeat('s', count($fields));
        $stmt->bind_param($types, ...$values);
        if ($stmt->execute()) {
            logActivity('CREATE', 'record', $input['patient_id'], $_SESSION['username'], 'New medical record added');
            jsonResponse(['success' => true, 'record_id' => $conn->insert_id]);
        } else {
            jsonResponse(['error' => 'Failed to add record'], 500);
        }
        break;

    case 'delete_record':
        requireAuth();
        $conn = getDBConnection();
        $id = $input['id'] ?? '';
        $stmt = $conn->prepare("DELETE FROM medical_records WHERE id = ?");
        $stmt->bind_param('i', $id);
        if ($stmt->execute()) {
            jsonResponse(['success' => true]);
        } else {
            jsonResponse(['error' => 'Delete failed'], 500);
        }
        break;

    // ========== REPORTS & STATS ==========
    case 'get_stats':
        requireAuth();
        $conn = getDBConnection();
        $stats = [];

        $stats['total_patients'] = $conn->query("SELECT COUNT(*) as c FROM patients")->fetch_assoc()['c'];
        $stats['active_patients'] = $conn->query("SELECT COUNT(*) as c FROM patients WHERE status = 'Active'")->fetch_assoc()['c'];
        $stats['critical_patients'] = $conn->query("SELECT COUNT(*) as c FROM patients WHERE status = 'Critical'")->fetch_assoc()['c'];
        $stats['total_records'] = $conn->query("SELECT COUNT(*) as c FROM medical_records")->fetch_assoc()['c'];
        $stats['today_visits'] = $conn->query("SELECT COUNT(*) as c FROM medical_records WHERE DATE(visit_date) = CURDATE()")->fetch_assoc()['c'];
        $stats['new_this_month'] = $conn->query("SELECT COUNT(*) as c FROM patients WHERE MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())")->fetch_assoc()['c'];

        // Gender distribution
        $genderResult = $conn->query("SELECT gender, COUNT(*) as count FROM patients GROUP BY gender");
        $stats['gender_dist'] = $genderResult->fetch_all(MYSQLI_ASSOC);

        // Status distribution
        $statusResult = $conn->query("SELECT status, COUNT(*) as count FROM patients GROUP BY status");
        $stats['status_dist'] = $statusResult->fetch_all(MYSQLI_ASSOC);

        // Blood type distribution
        $btResult = $conn->query("SELECT blood_type, COUNT(*) as count FROM patients WHERE blood_type IS NOT NULL GROUP BY blood_type ORDER BY count DESC");
        $stats['blood_types'] = $btResult->fetch_all(MYSQLI_ASSOC);

        // Departments
        $deptResult = $conn->query("SELECT department, COUNT(*) as count FROM medical_records WHERE department IS NOT NULL GROUP BY department ORDER BY count DESC LIMIT 5");
        $stats['departments'] = $deptResult->fetch_all(MYSQLI_ASSOC);

        // Monthly registrations (last 6 months)
        $monthResult = $conn->query("SELECT DATE_FORMAT(created_at, '%b %Y') as month, COUNT(*) as count FROM patients WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH) GROUP BY DATE_FORMAT(created_at, '%Y-%m') ORDER BY created_at");
        $stats['monthly_reg'] = $monthResult->fetch_all(MYSQLI_ASSOC);

        jsonResponse($stats);
        break;

    // ========== HISTORY / AUDIT LOG ==========
    case 'get_history':
        requireAuth();
        $conn = getDBConnection();
        $limit = intval($_GET['limit'] ?? 50);
        $result = $conn->query("SELECT * FROM activity_log ORDER BY created_at DESC LIMIT $limit");
        jsonResponse($result->fetch_all(MYSQLI_ASSOC));
        break;

    default:
        jsonResponse(['error' => 'Unknown action'], 404);
}
?>
