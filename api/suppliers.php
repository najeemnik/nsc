<?php
/**
 * NSC Suppliers & Vendor Ledger API
 * Solves Excel Flaw #4: Automatic Calculation of Purchases, Payments & Payable Balances
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

sendSecurityHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$db = Database::getConnection();
$user = authenticateUser(false);

if ($method === 'GET') {
    $stmt = $db->query("SELECT * FROM suppliers ORDER BY supplier_name ASC");
    jsonResponse(true, ['suppliers' => $stmt->fetchAll()]);
}

if ($method === 'POST') {
    $raw = file_get_contents('php://input');
    $input = json_decode($raw, true) ?: [];

    $id = $input['id'] ?? generateUuid();
    $name = trim($input['name'] ?? $input['supplierName'] ?? '');
    $phone = trim($input['phone'] ?? '');
    $category = trim($input['materialCategory'] ?? $input['category'] ?? 'مصالح ساختمانی');
    $opening = (float)($input['openingBalance'] ?? 0);
    $purchases = (float)($input['totalPurchases'] ?? 0);
    $paid = (float)($input['totalPaid'] ?? 0);
    $payable = ($opening + $purchases) - $paid;

    if (empty($name)) {
        jsonResponse(false, null, 'نام عرضه‌کننده الزامی است.', 400);
    }

    $stmt = $db->prepare("
        INSERT INTO suppliers (
            id, supplier_name, contact_person, phone, material_category,
            opening_balance, total_purchases, total_paid, current_payable_balance
        ) VALUES (
            :id, :name, :contact, :phone, :cat,
            :open, :pur, :paid, :pay
        ) ON DUPLICATE KEY UPDATE 
            supplier_name = VALUES(supplier_name),
            phone = VALUES(phone),
            material_category = VALUES(material_category),
            total_purchases = VALUES(total_purchases),
            total_paid = VALUES(total_paid),
            current_payable_balance = VALUES(current_payable_balance)
    ");

    $stmt->execute([
        'id' => $id,
        'name' => $name,
        'contact' => $input['contactPerson'] ?? null,
        'phone' => $phone,
        'cat' => $category,
        'open' => $opening,
        'pur' => $purchases,
        'paid' => $paid,
        'pay' => $payable
    ]);

    logAudit($db, $user['id'], $user['name'], 'update', 'suppliers', $id, "ثبت/ویرایش عرضه‌کننده: $name");
    jsonResponse(true, ['id' => $id, 'currentPayableBalance' => $payable], 'اطلاعات تأمین‌کننده و مانده حساب با موفقیت ثبت شد.');
}
