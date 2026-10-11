<?php
/**
 * NSC database, response, tenant, and authentication helpers.
 * Authentication uses opaque server-side sessions; raw session IDs are never returned to JS.
 */

require_once __DIR__ . '/config.php';

class Database {
    private static ?PDO $instance = null;

    public static function getConnection(): PDO {
        if (self::$instance instanceof PDO) {
            return self::$instance;
        }

        $dsn = sprintf(
            'mysql:host=%s;port=%s;dbname=%s;charset=%s',
            DB_HOST,
            DB_PORT,
            DB_NAME,
            DB_CHARSET
        );
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::ATTR_STRINGIFY_FETCHES => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci',
        ];

        try {
            self::$instance = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            error_log('NSC database connection failed: ' . $e->getMessage());
            jsonResponse(false, null, 'Database service is temporarily unavailable.', 503);
        }

        return self::$instance;
    }
}

function jsonResponse(bool $success, $data = null, ?string $error = null, int $statusCode = 200): void {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=UTF-8');
    header('Cache-Control: no-store, private');
    $response = ['success' => $success];
    if ($data !== null) {
        $response['data'] = $data;
    }
    if ($error !== null) {
        $response['error'] = $error;
    }
    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

function generateUuid(): string {
    $bytes = random_bytes(16);
    $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
    $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);
    $hex = bin2hex($bytes);
    return sprintf('%s-%s-%s-%s-%s', substr($hex, 0, 8), substr($hex, 8, 4), substr($hex, 12, 4), substr($hex, 16, 4), substr($hex, 20, 12));
}

function isSecureRequest(): bool {
    return (!empty($_SERVER['HTTPS']) && strtolower((string)$_SERVER['HTTPS']) !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https')
        || APP_ENV === 'production';
}

function setNscCookie(string $name, string $value, int $expires, bool $httpOnly, string $path = '/api'): void {
    setcookie($name, $value, [
        'expires' => $expires,
        'path' => $path,
        'secure' => isSecureRequest(),
        'httponly' => $httpOnly,
        'samesite' => 'Strict',
    ]);
}

/** Creates a random, revocable server-side session and returns only the CSRF token. */
function createAuthSession(PDO $db, string $userId): string {
    $rawSession = bin2hex(random_bytes(32));
    $csrfToken = bin2hex(random_bytes(32));
    $expiresAt = gmdate('Y-m-d H:i:s', time() + 12 * 60 * 60);
    $stmt = $db->prepare(
        'INSERT INTO nsc_auth_sessions (session_hash, csrf_hash, user_id, expires_at) VALUES (:sh, :ch, :uid, :exp)'
    );
    $stmt->execute([
        'sh' => hash('sha256', $rawSession),
        'ch' => hash('sha256', $csrfToken),
        'uid' => $userId,
        'exp' => $expiresAt,
    ]);

    $cookieExpiry = time() + 12 * 60 * 60;
    setNscCookie(APP_SESSION_COOKIE, $rawSession, $cookieExpiry, true);
    // This cookie is not an authentication credential. A matching header is also required for writes.
    setNscCookie(APP_CSRF_COOKIE, $csrfToken, $cookieExpiry, false, '/');
    return $csrfToken;
}

function revokeAuthSession(PDO $db): void {
    $rawSession = $_COOKIE[APP_SESSION_COOKIE] ?? '';
    if (is_string($rawSession) && preg_match('/^[a-f0-9]{64}$/', $rawSession)) {
        $stmt = $db->prepare('UPDATE nsc_auth_sessions SET revoked_at = UTC_TIMESTAMP() WHERE session_hash = :sh AND revoked_at IS NULL');
        $stmt->execute(['sh' => hash('sha256', $rawSession)]);
    }
    setNscCookie(APP_SESSION_COOKIE, '', time() - 3600, true);
    setNscCookie(APP_CSRF_COOKIE, '', time() - 3600, false, '/');
}

/** Resolve the company owner; an owner belongs to their own tenant, staff to their owner's tenant. */
function getTenantId(array $user): string {
    if ((int)($user['is_master'] ?? 0) === 1) {
        return '';
    }
    $ownerId = trim((string)($user['owner_admin_id'] ?? ''));
    return $ownerId !== '' ? $ownerId : (string)($user['id'] ?? '');
}

/** Employee accounts remain disabled on the API unless the operator explicitly enables them. */
function nscEmployeeAccessEnabled(): bool {
    return in_array(strtolower((string)nscEnv('NSC_EMPLOYEE_ACCESS_ENABLED', 'false')), ['1', 'true', 'yes', 'on'], true);
}

function nscIsEmployeeAccount(array $user): bool {
    return (int)($user['is_master'] ?? 0) !== 1
        && (trim((string)($user['owner_admin_id'] ?? '')) !== ''
            || in_array(($user['role'] ?? ''), ['project_manager', 'accountant', 'procurement', 'viewer'], true));
}

/**
 * Authenticates an active database user using an HttpOnly session cookie.
 * All write methods require the double-submit CSRF token bound to that session.
 * Employee API access is independently fail-closed until its server feature flag is enabled.
 */
function authenticateUser(bool $requireMaster = false, bool $allowDisabledEmployee = false): array {
    $rawSession = $_COOKIE[APP_SESSION_COOKIE] ?? '';
    if (!is_string($rawSession) || !preg_match('/^[a-f0-9]{64}$/', $rawSession)) {
        jsonResponse(false, null, 'Authentication required.', 401);
    }

    $db = Database::getConnection();
    $stmt = $db->prepare(
        'SELECT u.*, s.session_hash, s.csrf_hash, s.expires_at AS session_expires_at
         FROM nsc_auth_sessions s
         INNER JOIN users u ON u.id = s.user_id
         WHERE s.session_hash = :sh AND s.revoked_at IS NULL AND s.expires_at > UTC_TIMESTAMP() AND u.is_locked = 0
           AND (u.is_master = 1 OR u.subscription_expires_at IS NULL OR u.subscription_expires_at > UTC_TIMESTAMP())
         LIMIT 1'
    );
    $stmt->execute(['sh' => hash('sha256', $rawSession)]);
    $row = $stmt->fetch();
    if (!$row) {
        revokeAuthSession($db);
        jsonResponse(false, null, 'Session expired. Please sign in again.', 401);
    }
    if (nscIsEmployeeAccount($row) && !nscEmployeeAccessEnabled() && !$allowDisabledEmployee) {
        revokeAuthSession($db);
        jsonResponse(false, null, 'Employee API access is disabled pending security verification.', 403);
    }

    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    if (!in_array($method, ['GET', 'HEAD', 'OPTIONS'], true)) {
        $csrfCookie = $_COOKIE[APP_CSRF_COOKIE] ?? '';
        $csrfHeader = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
        $storedCsrfHash = (string)$row['csrf_hash'];
        if (!is_string($csrfCookie) || !is_string($csrfHeader)
            || !preg_match('/^[a-f0-9]{64}$/', $csrfCookie)
            || !hash_equals($csrfCookie, $csrfHeader)
            || !hash_equals($storedCsrfHash, hash('sha256', $csrfCookie))) {
            jsonResponse(false, null, 'CSRF validation failed.', 403);
        }
    }

    if ($requireMaster && (int)($row['is_master'] ?? 0) !== 1) {
        jsonResponse(false, null, 'Forbidden.', 403);
    }

    unset($row['session_hash'], $row['csrf_hash'], $row['session_expires_at']);
    return $row;
}

/** Owner-only until project-scoped grants are enforced by each data endpoint. */
function requireTenantOwner(array $user): string {
    $tenantId = getTenantId($user);
    if ($tenantId === '' || $tenantId !== (string)($user['id'] ?? '') || ($user['role'] ?? '') !== 'admin') {
        jsonResponse(false, null, 'Owner access required.', 403);
    }
    return $tenantId;
}

/** Audit logs are never accepted from client snapshots. */
function logAudit(PDO $db, ?string $userId, string $userName, string $action, string $module, ?string $recordId, ?string $details = null): void {
    try {
        $ip = $_SERVER['REMOTE_ADDR'] ?? null;
        $userAgent = substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 255);
        $stmt = $db->prepare(
            'INSERT INTO system_audit_logs (user_id, user_name, action, module, record_id, ip_address, user_agent, details)
             VALUES (:uid, :uname, :action, :module, :rid, :ip, :ua, :details)'
        );
        $stmt->execute([
            'uid' => $userId,
            'uname' => $userName,
            'action' => $action,
            'module' => $module,
            'rid' => $recordId,
            'ip' => $ip,
            'ua' => $userAgent,
            'details' => $details,
        ]);
    } catch (Throwable $e) {
        error_log('NSC audit logging failed: ' . $e->getMessage());
    }
}
