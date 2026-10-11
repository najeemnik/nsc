<?php
/** NSC authentication API. Passwords are verified against database hashes only. */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

sendSecurityHeaders();
$db = Database::getConnection();
$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

function nscPublicUser(array $user): array {
    unset($user['password_hash'], $user['otp_code'], $user['session_hash'], $user['csrf_hash']);
    $user['permissions'] = json_decode($user['permissions_json'] ?? '{}', true) ?: [];
    $user['customEnabledModules'] = json_decode($user['allowed_modules_json'] ?? '{}', true) ?: [];
    $user['allowedTabs'] = json_decode($user['allowed_tabs_json'] ?? '[]', true) ?: [];
    unset($user['permissions_json'], $user['allowed_modules_json'], $user['allowed_tabs_json']);
    $user['isMasterSuperAdmin'] = (bool)($user['is_master'] ?? false);
    $user['ownerAdminId'] = $user['owner_admin_id'] ?? null;
    $user['companyName'] = $user['company_name'] ?? '';
    $user['companyAddress'] = $user['company_address'] ?? '';
    return $user;
}

function nscLoginAttemptKey(string $identifier): string {
    $ip = (string)($_SERVER['REMOTE_ADDR'] ?? 'unknown');
    return hash_hmac('sha256', strtolower($identifier) . '|' . $ip, APP_SECRET);
}

function nscIsLoginBlocked(PDO $db, string $attemptKey): bool {
    $stmt = $db->prepare('SELECT locked_until FROM nsc_login_rate_limits WHERE attempt_key = :k LIMIT 1');
    $stmt->execute(['k' => $attemptKey]);
    $row = $stmt->fetch();
    return $row && !empty($row['locked_until']) && strtotime($row['locked_until'] . ' UTC') > time();
}

function nscRecordFailedLogin(PDO $db, string $attemptKey): void {
    $stmt = $db->prepare('SELECT failure_count, window_started_at FROM nsc_login_rate_limits WHERE attempt_key = :k FOR UPDATE');
    $db->beginTransaction();
    try {
        $stmt->execute(['k' => $attemptKey]);
        $row = $stmt->fetch();
        $now = time();
        if (!$row || ($now - strtotime($row['window_started_at'] . ' UTC')) > 900) {
            $upsert = $db->prepare(
                'INSERT INTO nsc_login_rate_limits (attempt_key, failure_count, window_started_at, locked_until)
                 VALUES (:k, 1, UTC_TIMESTAMP(), NULL)
                 ON DUPLICATE KEY UPDATE failure_count = 1, window_started_at = UTC_TIMESTAMP(), locked_until = NULL'
            );
            $upsert->execute(['k' => $attemptKey]);
        } else {
            $count = (int)$row['failure_count'] + 1;
            $lockedUntil = $count >= 5 ? gmdate('Y-m-d H:i:s', $now + 900) : null;
            $update = $db->prepare(
                'UPDATE nsc_login_rate_limits SET failure_count = :n, locked_until = :locked WHERE attempt_key = :k'
            );
            $update->execute(['n' => $count, 'locked' => $lockedUntil, 'k' => $attemptKey]);
        }
        $db->commit();
    } catch (Throwable $e) {
        if ($db->inTransaction()) $db->rollBack();
        error_log('NSC login throttle update failed: ' . $e->getMessage());
    }
}

function nscClearLoginFailures(PDO $db, string $attemptKey): void {
    $stmt = $db->prepare('DELETE FROM nsc_login_rate_limits WHERE attempt_key = :k');
    $stmt->execute(['k' => $attemptKey]);
}

if ($method === 'POST') {
    $raw = file_get_contents('php://input');
    if (!is_string($raw) || strlen($raw) > 16384) {
        jsonResponse(false, null, 'Invalid request.', 400);
    }
    $input = json_decode($raw, true);
    if (!is_array($input)) {
        jsonResponse(false, null, 'Invalid request.', 400);
    }
    $action = $_GET['action'] ?? 'login';

    if ($action === 'login') {
        $identifier = trim((string)($input['username'] ?? ''));
        $password = (string)($input['password'] ?? '');
        if ($identifier === '' || $password === '' || strlen($identifier) > 190 || strlen($password) > 1024) {
            jsonResponse(false, null, 'Username or password is incorrect.', 401);
        }

        $attemptKey = nscLoginAttemptKey($identifier);
        if (nscIsLoginBlocked($db, $attemptKey)) {
            jsonResponse(false, null, 'Too many sign-in attempts. Try again later.', 429);
        }

        $stmt = $db->prepare('SELECT * FROM users WHERE username = :u OR email = :e LIMIT 1');
        $stmt->execute(['u' => $identifier, 'e' => $identifier]);
        $user = $stmt->fetch();
        $valid = $user
            && (int)($user['is_locked'] ?? 0) === 0
            && !empty($user['password_hash'])
            && password_verify($password, (string)$user['password_hash']);

        if (!$valid) {
            nscRecordFailedLogin($db, $attemptKey);
            if ($user) {
                logAudit($db, $user['id'], $user['name'] ?? '', 'login', 'auth', $user['id'], 'Failed sign-in attempt');
            }
            jsonResponse(false, null, 'Username or password is incorrect.', 401);
        }

        $expiryValue = $user['subscription_expires_at'] ?? null;
        $subscriptionExpired = (int)($user['is_master'] ?? 0) !== 1
            && is_string($expiryValue)
            && $expiryValue !== ''
            && strtotime($expiryValue . ' UTC') <= time();
        if ($subscriptionExpired) {
            nscClearLoginFailures($db, $attemptKey);
            logAudit($db, $user['id'], $user['name'] ?? '', 'login', 'auth', $user['id'], 'Sign-in blocked: subscription expired');
            jsonResponse(false, null, 'Subscription expired. Contact the system administrator.', 402);
        }
        if (nscIsEmployeeAccount($user) && !nscEmployeeAccessEnabled()) {
            nscClearLoginFailures($db, $attemptKey);
            logAudit($db, $user['id'], $user['name'] ?? '', 'login', 'auth', $user['id'], 'Sign-in blocked: employee access is disabled pending security verification');
            jsonResponse(false, null, 'Employee access is not enabled on this server.', 403);
        }

        nscClearLoginFailures($db, $attemptKey);
        if (password_needs_rehash((string)$user['password_hash'], PASSWORD_DEFAULT)) {
            $newHash = password_hash($password, PASSWORD_DEFAULT);
            $rehash = $db->prepare('UPDATE users SET password_hash = :p WHERE id = :id');
            $rehash->execute(['p' => $newHash, 'id' => $user['id']]);
        }

        $now = gmdate('Y-m-d H:i:s');
        $update = $db->prepare('UPDATE users SET last_login_at = :now WHERE id = :id');
        $update->execute(['now' => $now, 'id' => $user['id']]);
        $csrfToken = createAuthSession($db, (string)$user['id']);
        logAudit($db, $user['id'], $user['name'] ?? '', 'login', 'auth', $user['id'], 'Successful sign-in');

        jsonResponse(true, [
            'user' => nscPublicUser($user),
            'csrfToken' => $csrfToken,
        ], null, 200);
    }

    if ($action === 'logout') {
        $user = authenticateUser(false, true);
        revokeAuthSession($db);
        logAudit($db, $user['id'], $user['name'] ?? '', 'logout', 'auth', $user['id'], 'Signed out');
        jsonResponse(true, null, null, 200);
    }

    jsonResponse(false, null, 'Unsupported action.', 404);
}

if ($method === 'GET') {
    $user = authenticateUser(false);
    jsonResponse(true, ['user' => nscPublicUser($user)]);
}

jsonResponse(false, null, 'Method not allowed.', 405);
