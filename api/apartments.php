<?php
/**
 * NSC Apartment Units & Commercial Pre-sales API
 * Manages Units, Prices (USD & AFN), Client Information & Outstanding Receivables
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

sendSecurityHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$db = Database::getConnection();
$user = authenticateUser(false);

if ($method === 'GET') {
    $projectId = $_GET['projectId'] ?? null;
    $sql = "SELECT u.*, p.name as project_name, c.client_name, c.phone as client_phone 
            FROM apartment_units u 
            LEFT JOIN projects p ON u.project_id = p.id 
            LEFT JOIN clients c ON u.client_id = c.id";
    $params = [];
    if ($projectId) {
        $sql .= " WHERE u.project_id = :pid";
        $params['pid'] = $projectId;
    }
    $sql .= " ORDER BY u.floor_number ASC, u.unit_number ASC";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    jsonResponse(true, ['units' => $stmt->fetchAll()]);
}

if ($method === 'POST') {
    $raw = file_get_contents('php://input');
    $input = json_decode($raw, true) ?: [];

    $id = $input['id'] ?? generateUuid();
    $projectId = $input['projectId'] ?? '';
    $unitNumber = trim($input['unitNumber'] ?? '');
    $floor = (int)($input['floorNumber'] ?? 1);
    $area = (float)($input['areaSqm'] ?? 0);
    $unitType = $input['unitType'] ?? 'apartment';
    $priceUsd = (float)($input['priceUsd'] ?? 0);
    $priceAfn = (float)($input['priceAfn'] ?? 0);
    $totalPaid = (float)($input['totalPaidAfn'] ?? 0);
    $balance = max(0, $priceAfn - $totalPaid);
    $status = $input['status'] ?? 'available';

    if (empty($projectId) || empty($unitNumber)) {
        jsonResponse(false, null, 'شناسه پروژه و شماره پلاک الزامی هستند.', 400);
    }

    $stmt = $db->prepare("
        INSERT INTO apartment_units (
            id, project_id, unit_number, floor_number, area_sqm,
            unit_type, price_usd, price_afn, total_paid_afn,
            balance_receivable_afn, status, notes
        ) VALUES (
            :id, :pid, :uno, :floor, :area,
            :type, :pusd, :pafn, :paid,
            :bal, :status, :notes
        ) ON DUPLICATE KEY UPDATE 
            floor_number = VALUES(floor_number),
            area_sqm = VALUES(area_sqm),
            unit_type = VALUES(unit_type),
            price_usd = VALUES(price_usd),
            price_afn = VALUES(price_afn),
            total_paid_afn = VALUES(total_paid_afn),
            balance_receivable_afn = VALUES(balance_receivable_afn),
            status = VALUES(status),
            notes = VALUES(notes)
    ");

    $stmt->execute([
        'id' => $id,
        'pid' => $projectId,
        'uno' => $unitNumber,
        'floor' => $floor,
        'area' => $area,
        'type' => $unitType,
        'pusd' => $priceUsd,
        'pafn' => $priceAfn,
        'paid' => $totalPaid,
        'bal' => $balance,
        'status' => $status,
        'notes' => $input['notes'] ?? null
    ]);

    logAudit($db, $user['id'], $user['name'], 'update', 'apartments', $id, "ثبت/ویرایش پلاک: $unitNumber");
    jsonResponse(true, ['id' => $id, 'balanceReceivable' => $balance], 'اطلاعات واحد با موفقیت ثبت شد.');
}
