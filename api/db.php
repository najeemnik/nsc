<?php
/**
 * NSC Database Connection & Security Helpers
 * Strict PDO Implementation with Zero-Vulnerability Architecture
 */

require_once __DIR__ . '/config.php';

class Database {
    private static ?PDO $instance = null;

    public static function getConnection(): PDO {
        if (self::$instance === null) {
            $dsn = sprintf(
                "mysql:host=%s;port=%s;dbname=%s;charset=%s",
                DB_HOST,
                DB_PORT,
                DB_NAME,
                DB_CHARSET
            );

            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                // غیرفعال کردن شبیه‌سازی prepare جهت جلوگیری ۱۰۰٪ از حملات SQL Injection
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
            ];

            try {
                self::$instance = new PDO($dsn, DB_USER, DB_PASS, $options);
            } catch (PDOException $e) {
                error_log("Database connection failure: " . $e->getMessage());
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'error' => 'خطا در اتصال به پایگاه داده. لطفاً تنظیمات دیتابیس را در config.php بررسی نمایید.'
                ], JSON_UNESCAPED_UNICODE);
                exit;
            }
        }

        return self::$instance;
    }
}

/**
 * ارسال پاسخ استاندارد JSON
 */
function jsonResponse(bool $success, $data = null, ?string $error = null, int $statusCode = 200) {
    http_response_code($statusCode);
    $response = ['success' => $success];
    if ($data !== null) {
        $response['data'] = $data;
    }
    if ($error !== null) {
        $response['error'] = $error;
    }
    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

/**
 * تولید شناسه یکتا UUID v4 امن
 */
function generateUuid(): string {
    $bytes = random_bytes(16);
    $bytes[6] = chr(ord($bytes[6]) & 0x0f | 0x40); // set version to 0100
    $bytes[8] = chr(ord($bytes[8]) & 0x3f | 0x80); // set bits 6-7 to 10
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($bytes), 4));
}

/**
 * دریافت توکن و احراز هویت کاربر
 */
function authenticateUser(bool $requireMaster = false): array {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

    if (!preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        jsonResponse(false, null, 'عدم دسترسی: توکن احراز هویت ارسال نشده است.', 401);
    }

    $token = $matches[1];
    $payload = verifyToken($token);
    if (!$payload) {
        jsonResponse(false, null, 'توکن امنیتی نامعتبر یا منقضی شده است. لطفاً دوباره وارد شوید.', 401);
    }

    $db = Database::getConnection();
    $stmt = $db->prepare("SELECT * FROM users WHERE id = :id AND is_locked = 0 LIMIT 1");
    $stmt->execute(['id' => $payload['user_id']]);
    $user = $stmt->fetch();

    if (!$user) {
        jsonResponse(false, null, 'حساب کاربری مسدود شده یا یافت نشد.', 403);
    }

    if ($requireMaster && (int)$user['is_master'] !== 1) {
        jsonResponse(false, null, 'دسترسی غیرمجاز: این عملیات مختص مدیریت ارشد (دفتر هفت) می‌باشد.', 403);
    }

    return $user;
}

/**
 * ساخت توکن امضاشده HMAC امن
 */
function generateToken(string $userId, string $role, int $isMaster): string {
    $header = base64_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $payload = base64_encode(json_encode([
        'user_id' => $userId,
        'role' => $role,
        'is_master' => $isMaster,
        'iat' => time(),
        'exp' => time() + (86400 * 30) // اعتبار ۳۰ روزه
    ]));
    $signature = hash_hmac('sha256', "$header.$payload", JWT_SECRET_KEY, true);
    $encodedSignature = base64_encode($signature);
    return "$header.$payload.$encodedSignature";
}

/**
 * بررسی صحت توکن HMAC
 */
function verifyToken(string $token): ?array {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;

    [$header, $payload, $signature] = $parts;
    $expectedSignature = base64_encode(hash_hmac('sha256', "$header.$payload", JWT_SECRET_KEY, true));

    if (!hash_equals($expectedSignature, $signature)) {
        return null; // امضا مخدوش است
    }

    $data = json_decode(base64_decode($payload), true);
    if (!$data || !isset($data['exp']) || $data['exp'] < time()) {
        return null; // توکن منقضی شده
    }

    return $data;
}

/**
 * ثبت وقایع و ردپای سیستم (System Audit Trail)
 */
function logAudit(PDO $db, ?string $userId, string $userName, string $action, string $module, ?string $recordId, ?string $details = null) {
    try {
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $ua = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
        $stmt = $db->prepare("
            INSERT INTO system_audit_logs (user_id, user_name, action, module, record_id, ip_address, user_agent, details)
            VALUES (:uid, :uname, :action, :module, :rid, :ip, :ua, :details)
        ");
        $stmt->execute([
            'uid' => $userId,
            'uname' => $userName,
            'action' => $action,
            'module' => $module,
            'rid' => $recordId,
            'ip' => $ip,
            'ua' => substr($ua, 0, 255),
            'details' => $details
        ]);
    } catch (Exception $e) {
        error_log("Failed to write audit log: " . $e->getMessage());
    }
}
