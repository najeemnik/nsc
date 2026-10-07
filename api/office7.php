<?php
/**
 * NSC Office 7 (دفتر هفت) Master Control API
 * Super Admin Tenant Management, Security Key & Module Permissing
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

sendSecurityHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$db = Database::getConnection();

// بررسی احراز هویت - فقط مدیر ارشد یا دارنده کلید دروازه دفتر هفت
$headers = getallheaders();
$masterGateKey = $headers['X-Office7-Gate-Key'] ?? $headers['x-office7-gate-key'] ?? '';

$currentUser = null;
$authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
if (!empty($authHeader)) {
    $currentUser = authenticateUser(false);
}

// بررسی کلید ماستر دفتر هفت
$isMasterAuthorized = false;
if ($currentUser && (int)$currentUser['is_master'] === 1) {
    $isMasterAuthorized = true;
}

if (!$isMasterAuthorized && !empty($masterGateKey)) {
    // کلیدهای معتبر دفتر هفت
    $validKeys = ['nik@master2026', '0093783788278', 'najeemnik@2026', 'password123'];
    if (in_array(trim($masterGateKey), $validKeys, true)) {
        $isMasterAuthorized = true;
    } else {
        // بررسی هش کلید در دیتابیس
        $stmt = $db->query("SELECT gate_key_hash FROM office7_tenant_configs LIMIT 1");
        $cfg = $stmt->fetch();
        if ($cfg && !empty($cfg['gate_key_hash']) && password_verify(trim($masterGateKey), $cfg['gate_key_hash'])) {
            $isMasterAuthorized = true;
        }
    }
}

if (!$isMasterAuthorized) {
    jsonResponse(false, null, 'خطای امنیتی: عدم دسترسی به پنل ماستر دفتر هفت.', 403);
}

// -------------------------------------------------------------
// عملیات GET: دریافت لیست کاربران، شرکت‌ها، تنظیمات و لاگ‌ها
// -------------------------------------------------------------
if ($method === 'GET') {
    $action = $_GET['action'] ?? 'tenants';

    if ($action === 'tenants') {
        $stmt = $db->query("
            SELECT id, owner_admin_id, name, username, email, role, phone, 
                   company_name, company_address, subscription_plan, 
                   subscription_expires_at, is_locked, is_master, 
                   permissions_json, allowed_modules_json, allowed_tabs_json, 
                   last_login_at, created_at 
            FROM users 
            ORDER BY is_master DESC, created_at ASC
        ");
        $users = $stmt->fetchAll();

        foreach ($users as &$u) {
            $u['permissions'] = json_decode($u['permissions_json'] ?? '{}', true);
            $u['customEnabledModules'] = json_decode($u['allowed_modules_json'] ?? '{}', true);
            $u['allowedTabs'] = json_decode($u['allowed_tabs_json'] ?? '[]', true);
            unset($u['permissions_json'], $u['allowed_modules_json'], $u['allowed_tabs_json']);
        }

        jsonResponse(true, ['users' => $users]);
    }

    if ($action === 'audit_logs') {
        $limit = min((int)($_GET['limit'] ?? 100), 500);
        $stmt = $db->prepare("
            SELECT * FROM system_audit_logs 
            ORDER BY created_at DESC 
            LIMIT :lim
        ");
        $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
        $stmt->execute();
        $logs = $stmt->fetchAll();
        jsonResponse(true, ['logs' => $logs]);
    }
}

// -------------------------------------------------------------
// عملیات POST: ذخیره تغییرات، قفل/بازگشایی، بروزرسانی ماژول‌ها
// -------------------------------------------------------------
if ($method === 'POST') {
    $raw = file_get_contents('php://input');
    $input = json_decode($raw, true) ?: [];
    $action = $_GET['action'] ?? 'update_tenant';

    // ۱. به‌روزرسانی مشخصات و ماژول‌های مستأجر/کاربر
    if ($action === 'update_tenant') {
        $userId = $input['id'] ?? '';
        if (empty($userId)) {
            jsonResponse(false, null, 'شناسه کاربر الزامی است.', 400);
        }

        $fields = [];
        $params = ['id' => $userId];

        if (isset($input['name'])) {
            $fields[] = 'name = :name';
            $params['name'] = trim($input['name']);
        }
        if (isset($input['email'])) {
            $fields[] = 'email = :email';
            $params['email'] = trim($input['email']);
        }
        if (isset($input['phone'])) {
            $fields[] = 'phone = :phone';
            $params['phone'] = trim($input['phone']);
        }
        if (isset($input['companyName'])) {
            $fields[] = 'company_name = :cname';
            $params['cname'] = trim($input['companyName']);
        }
        if (isset($input['companyAddress'])) {
            $fields[] = 'company_address = :caddr';
            $params['caddr'] = trim($input['companyAddress']);
        }
        if (!empty($input['password'])) {
            $fields[] = 'password_hash = :pwd';
            $params['pwd'] = password_hash($input['password'], PASSWORD_BCRYPT);
        }
        if (isset($input['subscriptionPlan'])) {
            $fields[] = 'subscription_plan = :splan';
            $params['splan'] = $input['subscriptionPlan'];
        }
        if (isset($input['subscriptionExpiresAt'])) {
            $fields[] = 'subscription_expires_at = :sexp';
            $params['sexp'] = !empty($input['subscriptionExpiresAt']) ? $input['subscriptionExpiresAt'] : null;
        }
        if (isset($input['customEnabledModules'])) {
            $fields[] = 'allowed_modules_json = :mods';
            $params['mods'] = json_encode($input['customEnabledModules'], JSON_UNESCAPED_UNICODE);
        }
        if (isset($input['allowedTabs'])) {
            $fields[] = 'allowed_tabs_json = :tabs';
            $params['tabs'] = json_encode($input['allowedTabs'], JSON_UNESCAPED_UNICODE);
        }
        if (isset($input['permissions'])) {
            $fields[] = 'permissions_json = :perms';
            $params['perms'] = json_encode($input['permissions'], JSON_UNESCAPED_UNICODE);
        }

        if (empty($fields)) {
            jsonResponse(false, null, 'داده‌ای برای به‌روزرسانی ارسال نشده است.', 400);
        }

        $sql = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        logAudit($db, $currentUser['id'] ?? 'master', 'دفتر هفت', 'update', 'users', $userId, 'به‌روزرسانی تنظیمات و پرمیژن‌های کاربر توسط دفتر هفت');

        jsonResponse(true, null, 'تنظیمات کاربر در دفتر هفت با موفقیت ذخیره گردید.');
    }

    // ۲. تغییر وضعیت قفل (Lock/Unlock)
    if ($action === 'toggle_lock') {
        $userId = $input['userId'] ?? '';
        $lockStatus = !empty($input['isLocked']) ? 1 : 0;

        $stmt = $db->prepare("UPDATE users SET is_locked = :l WHERE id = :id AND is_master = 0");
        $stmt->execute(['l' => $lockStatus, 'id' => $userId]);

        logAudit($db, $currentUser['id'] ?? 'master', 'دفتر هفت', $lockStatus ? 'lock' : 'unlock', 'users', $userId, $lockStatus ? 'مسدودسازی دسترسی' : 'رفع مسدودیت دسترسی');

        jsonResponse(true, ['isLocked' => (bool)$lockStatus], 'وضعیت دسترسی کاربر تغییر کرد.');
    }

    // ۳. تغییر کلید امنیتی دروازه دفتر هفت
    if ($action === 'change_gate_key') {
        $newKey = trim($input['newKey'] ?? '');
        if (strlen($newKey) < 6) {
            jsonResponse(false, null, 'کلید دروازه امنیتی باید حداقل ۶ کاراکتر باشد.', 400);
        }

        $newHash = password_hash($newKey, PASSWORD_BCRYPT);
        $stmt = $db->prepare("
            INSERT INTO office7_tenant_configs (id, tenant_user_id, gate_key_hash, active_modules_json, accessible_tabs_json)
            VALUES ('cfg-master', 'usr-master-001', :hash, '{}', '[]')
            ON DUPLICATE KEY UPDATE gate_key_hash = :hash2
        ");
        $stmt->execute(['hash' => $newHash, 'hash2' => $newHash]);

        logAudit($db, $currentUser['id'] ?? 'master', 'دفتر هفت', 'update', 'security', 'gate_key', 'تغییر کلید امنیتی دفتر هفت');
        jsonResponse(true, null, 'کلید امنیتی دروازه دفتر هفت با موفقیت ارتقا یافت.');
    }
}
