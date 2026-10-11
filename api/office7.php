<?php
/** Office 7: master-session-only tenant administration. */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

sendSecurityHeaders();
$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$currentUser = authenticateUser(true);
$db = Database::getConnection();

const NSC_OFFICE7_ALLOWED_TABS = [
    'dashboard', 'projects', 'income', 'materials', 'labor', 'steel', 'concrete', 'expenses',
    'contractors', 'suppliers', 'apartments', 'payments', 'treasury', 'petty_cash', 'assets',
    'transfers', 'budget', 'accounting', 'journal', 'documents', 'reports', 'settings', 'users', 'audit_logs',
];
const NSC_OFFICE7_ALLOWED_MODULES = [
    'steel', 'concrete', 'expenses', 'contractors', 'suppliers', 'apartments', 'payments', 'documents',
    'reports', 'auditLogs', 'income', 'materials', 'labor', 'treasury', 'pettyCash', 'assets', 'transfers', 'journal', 'budget', 'accounting', 'users',
];
const NSC_OFFICE7_PERMISSION_FLAGS = [
    'canManageSales', 'canManageMaterials', 'canManageExpenses', 'canManageReports', 'canManageProjects',
    'canManagePayments', 'canManageSettings', 'canManageTreasury', 'canManagePayroll', 'canManageAssets',
    'canManageTransfers', 'canManageJournal', 'aiEnabled',
];

function nscOffice7ValidId(string $id): bool {
    // The schema permits legacy opaque IDs as well as UUIDs; always bind the exact ID in SQL.
    return strlen($id) <= 36 && (bool)preg_match('/^[A-Za-z0-9][A-Za-z0-9._-]{0,35}$/D', $id);
}

function nscOffice7ParseJson(?string $json, $fallback) {
    if ($json === null || $json === '') return $fallback;
    $decoded = json_decode($json, true);
    return is_array($decoded) ? $decoded : $fallback;
}

function nscOffice7NormalizeTabs($value): array {
    if (!is_array($value) || count($value) > count(NSC_OFFICE7_ALLOWED_TABS)) {
        jsonResponse(false, null, 'Invalid tab grants.', 400);
    }
    $tabs = [];
    foreach ($value as $tab) {
        if (!is_string($tab) || !in_array($tab, NSC_OFFICE7_ALLOWED_TABS, true)) {
            jsonResponse(false, null, 'Unsupported tab grant.', 400);
        }
        $tabs[$tab] = true;
    }
    return array_keys($tabs);
}

function nscOffice7NormalizePermissions($value): array {
    if (!is_array($value) || count($value) > 40) {
        jsonResponse(false, null, 'Invalid permission document.', 400);
    }
    $normalized = [];
    foreach ($value as $key => $setting) {
        if ($key === 'allowedTabs') {
            $normalized['allowedTabs'] = nscOffice7NormalizeTabs($setting);
            continue;
        }
        if ($key === 'allowedModules') {
            if (!is_array($setting) || count($setting) > count(NSC_OFFICE7_ALLOWED_MODULES)) {
                jsonResponse(false, null, 'Invalid module grants.', 400);
            }
            $modules = [];
            foreach ($setting as $module) {
                if (!is_string($module) || !in_array($module, NSC_OFFICE7_ALLOWED_MODULES, true)) {
                    jsonResponse(false, null, 'Unsupported module grant.', 400);
                }
                $modules[$module] = true;
            }
            $normalized['allowedModules'] = array_keys($modules);
            continue;
        }
        if (!is_string($key) || !in_array($key, NSC_OFFICE7_PERMISSION_FLAGS, true) || !is_bool($setting)) {
            jsonResponse(false, null, 'Unsupported permission field.', 400);
        }
        $normalized[$key] = $setting;
    }
    return $normalized;
}

if ($method === 'GET') {
    $action = $_GET['action'] ?? 'tenants';

    if ($action === 'tenants') {
        $stmt = $db->query(
            'SELECT id, owner_admin_id, name, username, email, role, phone, company_name, company_address,
                    subscription_plan, subscription_expires_at, is_locked, is_master, permissions_json,
                    allowed_modules_json, allowed_tabs_json, last_login_at, created_at
             FROM users ORDER BY is_master DESC, created_at ASC'
        );
        $users = $stmt->fetchAll();
        foreach ($users as &$user) {
            $user['permissions'] = nscOffice7ParseJson($user['permissions_json'] ?? null, []);
            $user['customEnabledModules'] = nscOffice7ParseJson($user['allowed_modules_json'] ?? null, []);
            $storedTabs = nscOffice7ParseJson($user['allowed_tabs_json'] ?? null, []);
            $user['allowedTabs'] = $storedTabs ?: ($user['permissions']['allowedTabs'] ?? []);
            $user['is_master'] = (bool)($user['is_master'] ?? false);
            $user['is_locked'] = (bool)($user['is_locked'] ?? false);
            unset($user['permissions_json'], $user['allowed_modules_json'], $user['allowed_tabs_json']);
        }
        unset($user);
        jsonResponse(true, ['users' => $users]);
    }

    if ($action === 'audit_logs') {
        $limit = max(1, min((int)($_GET['limit'] ?? 100), 500));
        $stmt = $db->prepare('SELECT * FROM system_audit_logs ORDER BY created_at DESC LIMIT :lim');
        $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
        $stmt->execute();
        jsonResponse(true, ['logs' => $stmt->fetchAll()]);
    }

    jsonResponse(false, null, 'Unsupported action.', 404);
}

if ($method !== 'POST') {
    header('Allow: GET, POST, OPTIONS');
    jsonResponse(false, null, 'Method not allowed.', 405);
}

$raw = file_get_contents('php://input');
if (!is_string($raw) || strlen($raw) > 65536) {
    jsonResponse(false, null, 'Request is too large.', 413);
}
$input = json_decode($raw, true);
if (!is_array($input)) {
    jsonResponse(false, null, 'Invalid request.', 400);
}
$action = $_GET['action'] ?? 'update_tenant';

if ($action === 'extend_subscription') {
    if (array_diff(array_keys($input), ['userId', 'durationMonths'])) {
        jsonResponse(false, null, 'Unsupported subscription fields.', 400);
    }
    $userId = trim((string)($input['userId'] ?? ''));
    $months = filter_var($input['durationMonths'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 60]]);
    if (!nscOffice7ValidId($userId) || $months === false) {
        jsonResponse(false, null, 'Invalid subscription extension request.', 400);
    }

    try {
        $db->beginTransaction();
        $stmt = $db->prepare('SELECT name, is_master, subscription_expires_at FROM users WHERE id = :id LIMIT 1 FOR UPDATE');
        $stmt->execute(['id' => $userId]);
        $target = $stmt->fetch();
        if (!$target || (int)$target['is_master'] === 1) {
            $db->rollBack();
            jsonResponse(false, null, 'Tenant account not found.', 404);
        }

        $utc = new DateTimeZone('UTC');
        $now = new DateTimeImmutable('now', $utc);
        $current = !empty($target['subscription_expires_at'])
            ? new DateTimeImmutable((string)$target['subscription_expires_at'], $utc)
            : $now;
        $base = $current > $now ? $current : $now;
        $day = (int)$base->format('d');
        $nextMonth = $base->modify('first day of this month')->modify('+' . $months . ' months');
        $lastDay = (int)$nextMonth->modify('last day of this month')->format('d');
        $expiry = $nextMonth->setDate(
            (int)$nextMonth->format('Y'),
            (int)$nextMonth->format('n'),
            min($day, $lastDay)
        )->setTime((int)$base->format('H'), (int)$base->format('i'), (int)$base->format('s'));
        $expirySql = $expiry->format('Y-m-d H:i:s');

        $update = $db->prepare('UPDATE users SET subscription_expires_at = :expiry WHERE id = :id AND is_master = 0');
        $update->execute(['expiry' => $expirySql, 'id' => $userId]);
        $db->commit();
    } catch (Throwable $e) {
        if ($db->inTransaction()) $db->rollBack();
        error_log('Office 7 subscription extension failed: ' . $e->getMessage());
        jsonResponse(false, null, 'Subscription could not be extended.', 500);
    }

    logAudit($db, $currentUser['id'], $currentUser['name'] ?? 'Master', 'update', 'users', $userId, 'Subscription extended by ' . $months . ' calendar months.');
    jsonResponse(true, ['subscriptionExpiresAt' => $expiry->format('Y-m-d') . 'T' . $expiry->format('H:i:s') . 'Z']);
}

if ($action === 'update_tenant') {
    $allowedInputKeys = [
        'id', 'name', 'email', 'phone', 'companyName', 'companyAddress', 'password',
        'subscriptionExpiresAt', 'customEnabledModules', 'allowedTabs', 'permissions',
    ];
    if (array_diff(array_keys($input), $allowedInputKeys)) {
        jsonResponse(false, null, 'Unsupported tenant update fields.', 400);
    }
    $userId = trim((string)($input['id'] ?? ''));
    if (!nscOffice7ValidId($userId)) jsonResponse(false, null, 'Invalid account identifier.', 400);

    $targetStmt = $db->prepare('SELECT id, is_master FROM users WHERE id = :id LIMIT 1');
    $targetStmt->execute(['id' => $userId]);
    $target = $targetStmt->fetch();
    if (!$target || (int)$target['is_master'] === 1) {
        jsonResponse(false, null, 'Tenant account not found.', 404);
    }

    $fields = [];
    $params = ['id' => $userId];
    $simpleFields = [
        'name' => ['column' => 'name', 'max' => 150],
        'email' => ['column' => 'email', 'max' => 150],
        'phone' => ['column' => 'phone', 'max' => 40],
        'companyName' => ['column' => 'company_name', 'max' => 200],
        'companyAddress' => ['column' => 'company_address', 'max' => 4000],
    ];
    foreach ($simpleFields as $inputKey => $rules) {
        if (!array_key_exists($inputKey, $input)) continue;
        if (!is_string($input[$inputKey])) jsonResponse(false, null, 'Invalid tenant profile value.', 400);
        $value = trim($input[$inputKey]);
        if (strlen($value) > $rules['max'] || ($inputKey === 'name' && $value === '')) {
            jsonResponse(false, null, 'Tenant profile value is invalid.', 400);
        }
        if ($inputKey === 'email' && ($value === '' || !filter_var($value, FILTER_VALIDATE_EMAIL))) {
            jsonResponse(false, null, 'A valid email address is required.', 400);
        }
        $fields[] = $rules['column'] . ' = :' . $inputKey;
        $params[$inputKey] = $value;
    }

    if (isset($input['password']) && $input['password'] !== '') {
        if (!is_string($input['password']) || strlen($input['password']) < 12 || strlen($input['password']) > 256) {
            jsonResponse(false, null, 'A new password must be at least 12 characters.', 400);
        }
        $fields[] = 'password_hash = :password_hash';
        $params['password_hash'] = password_hash($input['password'], PASSWORD_DEFAULT);
    }

    if (array_key_exists('subscriptionExpiresAt', $input)) {
        $expiry = $input['subscriptionExpiresAt'];
        if ($expiry === null || $expiry === '') {
            $params['subscription_expires_at'] = null;
        } elseif (is_string($expiry) && strlen($expiry) <= 40) {
            try {
                $date = new DateTimeImmutable($expiry);
                $params['subscription_expires_at'] = $date->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d H:i:s');
            } catch (Throwable $e) {
                jsonResponse(false, null, 'Invalid subscription expiry date.', 400);
            }
        } else {
            jsonResponse(false, null, 'Invalid subscription expiry date.', 400);
        }
        $fields[] = 'subscription_expires_at = :subscription_expires_at';
    }

    if (array_key_exists('customEnabledModules', $input)) {
        if (!is_array($input['customEnabledModules']) || count($input['customEnabledModules']) > count(NSC_OFFICE7_ALLOWED_MODULES)) {
            jsonResponse(false, null, 'Invalid module settings.', 400);
        }
        $modules = [];
        foreach ($input['customEnabledModules'] as $key => $enabled) {
            if (!is_string($key) || !in_array($key, NSC_OFFICE7_ALLOWED_MODULES, true) || !is_bool($enabled)) {
                jsonResponse(false, null, 'Unsupported module setting.', 400);
            }
            $modules[$key] = $enabled;
        }
        $fields[] = 'allowed_modules_json = :modules';
        $params['modules'] = json_encode($modules, JSON_UNESCAPED_UNICODE);
    }

    $permissions = null;
    if (array_key_exists('permissions', $input)) {
        $permissions = nscOffice7NormalizePermissions($input['permissions']);
    }
    if (array_key_exists('allowedTabs', $input)) {
        $tabs = nscOffice7NormalizeTabs($input['allowedTabs']);
        if ($permissions === null) $permissions = [];
        $permissions['allowedTabs'] = $tabs;
        $fields[] = 'allowed_tabs_json = :tabs';
        $params['tabs'] = json_encode($tabs, JSON_UNESCAPED_UNICODE);
    } elseif ($permissions !== null && array_key_exists('allowedTabs', $permissions)) {
        $fields[] = 'allowed_tabs_json = :tabs';
        $params['tabs'] = json_encode($permissions['allowedTabs'], JSON_UNESCAPED_UNICODE);
    }
    if ($permissions !== null) {
        $fields[] = 'permissions_json = :permissions';
        $params['permissions'] = json_encode($permissions, JSON_UNESCAPED_UNICODE);
    }

    if (empty($fields)) jsonResponse(false, null, 'No supported fields were supplied.', 400);

    try {
        $db->beginTransaction();
        $stmt = $db->prepare('UPDATE users SET ' . implode(', ', $fields) . ' WHERE id = :id AND is_master = 0');
        $stmt->execute($params);
        $db->commit();
    } catch (PDOException $e) {
        if ($db->inTransaction()) $db->rollBack();
        error_log('Office 7 tenant update failed: ' . $e->getMessage());
        if ($e->getCode() === '23000') jsonResponse(false, null, 'The account email may already be in use.', 409);
        jsonResponse(false, null, 'Tenant account could not be updated.', 500);
    }

    logAudit($db, $currentUser['id'], $currentUser['name'] ?? 'Master', 'update', 'users', $userId, 'Office 7 updated allowed tenant profile/permission fields.');
    jsonResponse(true, ['updated' => true]);
}

if ($action === 'toggle_lock') {
    if (array_diff(array_keys($input), ['userId', 'isLocked'])) {
        jsonResponse(false, null, 'Unsupported lock fields.', 400);
    }
    $userId = trim((string)($input['userId'] ?? ''));
    $lockValue = $input['isLocked'] ?? null;
    if (!nscOffice7ValidId($userId) || !is_bool($lockValue)) {
        jsonResponse(false, null, 'Invalid account lock request.', 400);
    }
    try {
        $stmt = $db->prepare('UPDATE users SET is_locked = :locked WHERE id = :id AND is_master = 0');
        $stmt->execute(['locked' => $lockValue ? 1 : 0, 'id' => $userId]);
        $check = $db->prepare('SELECT id FROM users WHERE id = :id AND is_master = 0 LIMIT 1');
        $check->execute(['id' => $userId]);
        if (!$check->fetch()) jsonResponse(false, null, 'Tenant account not found.', 404);
    } catch (PDOException $e) {
        error_log('Office 7 tenant lock update failed: ' . $e->getMessage());
        jsonResponse(false, null, 'Account status could not be updated.', 500);
    }

    logAudit($db, $currentUser['id'], $currentUser['name'] ?? 'Master', 'update', 'users', $userId, $lockValue ? 'Account locked by Office 7.' : 'Account unlocked by Office 7.');
    jsonResponse(true, ['isLocked' => $lockValue]);
}

jsonResponse(false, null, 'Unsupported action.', 404);
