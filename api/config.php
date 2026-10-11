<?php
/**
 * NSC API runtime configuration.
 * Secrets are supplied by the host environment; no production fallbacks are allowed.
 */

ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);

function nscEnv(string $key, ?string $default = null): ?string {
    $value = getenv($key);
    if ($value === false || trim((string)$value) === '') {
        return $default;
    }
    return trim((string)$value);
}

function nscRequiredEnv(string $key, int $minimumLength = 1): string {
    $value = nscEnv($key);
    if ($value === null || strlen($value) < $minimumLength) {
        error_log('Missing or weak required environment variable: ' . $key);
        throw new RuntimeException('Server configuration is incomplete.');
    }
    return $value;
}

define('APP_ENV', nscEnv('APP_ENV', 'production'));
define('DB_HOST', nscEnv('DB_HOST', 'localhost'));
define('DB_PORT', nscEnv('DB_PORT', '3306'));
define('DB_NAME', nscRequiredEnv('DB_NAME'));
define('DB_USER', nscRequiredEnv('DB_USER'));
define('DB_PASS', nscRequiredEnv('DB_PASS'));
define('DB_CHARSET', 'utf8mb4');
define('APP_SECRET', nscRequiredEnv('APP_SECRET', 32));
define('APP_SESSION_COOKIE', 'nsc_session');
define('APP_CSRF_COOKIE', 'nsc_csrf');
define('UPLOAD_DIR', __DIR__ . '/../uploads/');
define('MAX_FILE_SIZE_BYTES', 10 * 1024 * 1024);
define('ALLOWED_FILE_EXTENSIONS', ['jpg', 'jpeg', 'png', 'pdf', 'webp']);

/**
 * Same-origin by default; explicitly configured exact origins may be added for a separate UI host.
 * Never reflect an arbitrary Origin while allowing credentials.
 */
function sendSecurityHeaders(): void {
    header('Content-Type: application/json; charset=UTF-8');
    header('Cache-Control: no-store, private');
    header('Pragma: no-cache');
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('Referrer-Policy: no-referrer');
    header('Permissions-Policy: camera=(), microphone=(), geolocation=()');
    header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'; base-uri 'none'");

    $origin = isset($_SERVER['HTTP_ORIGIN']) ? trim((string)$_SERVER['HTTP_ORIGIN']) : '';
    $configured = nscEnv('APP_ALLOWED_ORIGINS', '');
    $allowedOrigins = $configured === ''
        ? []
        : array_values(array_filter(array_map('trim', explode(',', $configured))));

    if ($origin !== '') {
        $https = (!empty($_SERVER['HTTPS']) && strtolower((string)$_SERVER['HTTPS']) !== 'off')
            || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
        $scheme = $https ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'] ?? '';
        $sameOrigin = $host !== '' && hash_equals($scheme . '://' . $host, $origin);
        $explicitlyAllowed = in_array($origin, $allowedOrigins, true);

        if (!$sameOrigin && !$explicitlyAllowed) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Origin is not allowed.']);
            exit;
        }

        header('Access-Control-Allow-Origin: ' . $origin);
        header('Access-Control-Allow-Credentials: true');
        header('Vary: Origin');
    }

    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
        if ($origin === '') {
            http_response_code(403);
            exit;
        }
        header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, X-Requested-With, X-CSRF-Token');
        header('Access-Control-Max-Age: 600');
        http_response_code(204);
        exit;
    }
}
