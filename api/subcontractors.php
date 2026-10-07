<?php
/**
 * NSC Subcontractors & Trade Contracts API
 * Manages Subcontractors, Certified Work, Paid Amounts, Retention & Balances
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

sendSecurityHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$db = Database::getConnection();
$user = authenticateUser(false);

if ($method === 'GET') {
    $projectId = $_GET['projectId'] ?? null;
    $sql = "SELECT s.*, p.name as project_name 
            FROM subcontractors s 
            LEFT JOIN projects p ON s.project_id = p.id";
    $params = [];
    if ($projectId) {
        $sql .= " WHERE s.project_id = :pid";
        $params['pid'] = $projectId;
    }
    $sql .= " ORDER BY s.created_at DESC";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    jsonResponse(true, ['subcontractors' => $stmt->fetchAll()]);
}

if ($method === 'POST') {
    $raw = file_get_contents('php://input');
    $input = json_decode($raw, true) ?: [];

    $id = $input['id'] ?? generateUuid();
    $name = trim($input['name'] ?? $input['contractorName'] ?? '');
    $trade = trim($input['specialty'] ?? $input['tradeSpecialty'] ?? 'قراردادی عمومی');
    $phone = trim($input['phone'] ?? '');
    $projectId = $input['projectId'] ?? null;
    $contractValue = (float)($input['contractValue'] ?? 0);
    $certifiedAmount = (float)($input['certifiedAmount'] ?? 0);
    $paidAmount = (float)($input['paidAmount'] ?? 0);
    $retentionAmount = (float)($input['retentionAmount'] ?? 0);
    $remaining = max(0, $certifiedAmount - $paidAmount);
    $status = $input['status'] ?? 'active';

    if (empty($name)) {
        jsonResponse(false, null, 'نام قراردادی الزامی است.', 400);
    }

    $stmt = $db->prepare("
        INSERT INTO subcontractors (
            id, contractor_name, trade_specialty, phone, project_id,
            contract_value, certified_work_amount, paid_amount,
            retention_amount, remaining_balance, status
        ) VALUES (
            :id, :name, :trade, :phone, :pid,
            :cval, :cert, :paid,
            :ret, :rem, :status
        ) ON DUPLICATE KEY UPDATE 
            contractor_name = VALUES(contractor_name),
            trade_specialty = VALUES(trade_specialty),
            phone = VALUES(phone),
            contract_value = VALUES(contract_value),
            certified_work_amount = VALUES(certified_work_amount),
            paid_amount = VALUES(paid_amount),
            retention_amount = VALUES(retention_amount),
            remaining_balance = VALUES(remaining_balance),
            status = VALUES(status)
    ");

    $stmt->execute([
        'id' => $id,
        'name' => $name,
        'trade' => $trade,
        'phone' => $phone,
        'pid' => $projectId,
        'cval' => $contractValue,
        'cert' => $certifiedAmount,
        'paid' => $paidAmount,
        'ret' => $retentionAmount,
        'rem' => $remaining,
        'status' => $status
    ]);

    logAudit($db, $user['id'], $user['name'], 'update', 'contractors', $id, "ثبت/ویرایش مقاطعه‌کار: $name");
    jsonResponse(true, ['id' => $id], 'اطلاعات پیمانکار با موفقیت ثبت شد.');
}
