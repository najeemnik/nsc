<?php
/** Owner-managed employee account lifecycle. Employee access stays separately feature-flagged. */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/access_control.php';

sendSecurityHeaders();
$currentUser = authenticateUser(false);
$tenantId = requireTenantOwner($currentUser);
if (!nscAclIsOwner($currentUser)) {
    jsonResponse(false, null, 'Company owner access required.', 403);
}
$db = Database::getConnection();
$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

const NSC_EMPLOYEE_ACCOUNT_ROLES = ['project_manager', 'accountant', 'procurement', 'viewer'];

function nscEmployeesNormalizeName($value): string {
    if (!is_string($value)) throw new NscAclException('Employee name is required.', 400);
    $value = trim($value);
    if ($value === '' || strlen($value) > 150) throw new NscAclException('Employee name is invalid.', 400);
    return $value;
}

function nscEmployeesNormalizeUsername($value): string {
    if (!is_string($value)) throw new NscAclException('A valid employee username is required.', 400);
    $value = strtolower(trim($value));
    if (strlen($value) < 3 || strlen($value) > 80
        || !preg_match('/^[a-z0-9][a-z0-9._-]{2,79}$/D', $value)) {
        throw new NscAclException('Employee username must be 3–80 characters and use letters, numbers, dots, underscores, or hyphens.', 400);
    }
    return $value;
}

function nscEmployeesNormalizeEmail($value): string {
    if (!is_string($value)) throw new NscAclException('A valid employee email address is required.', 400);
    $value = strtolower(trim($value));
    if (strlen($value) > 150 || !filter_var($value, FILTER_VALIDATE_EMAIL)) {
        throw new NscAclException('A valid employee email address is required.', 400);
    }
    return $value;
}

function nscEmployeesNormalizePhone($value): ?string {
    if ($value === null) return null;
    if (!is_string($value)) throw new NscAclException('Employee phone number is invalid.', 400);
    $value = trim($value);
    if (strlen($value) > 40) throw new NscAclException('Employee phone number is too long.', 400);
    return $value === '' ? null : $value;
}

function nscEmployeesNormalizeRole($value): string {
    if (!is_string($value) || !in_array($value, NSC_EMPLOYEE_ACCOUNT_ROLES, true)) {
        throw new NscAclException('Unsupported employee role.', 400);
    }
    return $value;
}

function nscEmployeesHashPassword($value): string {
    if (!is_string($value) || strlen($value) < 12 || strlen($value) > 256) {
        throw new NscAclException('Employee password must be 12–256 characters.', 400);
    }
    return password_hash($value, PASSWORD_DEFAULT);
}

/** Lock/revalidate the owner after authentication so lifecycle writes cannot outlive an account lock. */
function nscEmployeesLockOwner(PDO $db, string $tenantId): void {
    $stmt = $db->prepare(
        "SELECT id FROM users
         WHERE id = :tid AND role = 'admin' AND is_master = 0
           AND (owner_admin_id IS NULL OR owner_admin_id = '')
           AND is_locked = 0
           AND (subscription_expires_at IS NULL OR subscription_expires_at > UTC_TIMESTAMP())
         LIMIT 1 FOR UPDATE"
    );
    $stmt->execute(['tid' => $tenantId]);
    if (!$stmt->fetch()) throw new NscAclException('The owner account is unavailable.', 403);
}

/** Lock only a staff account that belongs to the authenticated owner. */
function nscEmployeesLockTarget(PDO $db, string $tenantId, string $employeeId): array {
    $stmt = $db->prepare(
        "SELECT id, name, username, email, phone, role, is_locked
         FROM users
         WHERE id = :uid AND owner_admin_id = :tid AND is_master = 0
           AND role IN ('project_manager', 'accountant', 'procurement', 'viewer')
         LIMIT 1 FOR UPDATE"
    );
    $stmt->execute(['uid' => $employeeId, 'tid' => $tenantId]);
    $employee = $stmt->fetch();
    if (!$employee) throw new NscAclException('Employee account was not found under this owner.', 404);
    return $employee;
}

function nscEmployeesPublicProfile(array $employee): array {
    return [
        'id' => (string)$employee['id'],
        'name' => (string)$employee['name'],
        'username' => (string)$employee['username'],
        'email' => (string)$employee['email'],
        'phone' => $employee['phone'] === null ? null : (string)$employee['phone'],
        'role' => (string)$employee['role'],
        'isLocked' => (bool)$employee['is_locked'],
    ];
}

function nscEmployeesRevokeSessions(PDO $db, string $employeeId): void {
    $stmt = $db->prepare(
        'UPDATE nsc_auth_sessions SET revoked_at = UTC_TIMESTAMP()
         WHERE user_id = :uid AND revoked_at IS NULL'
    );
    $stmt->execute(['uid' => $employeeId]);
}

function nscEmployeesFail(PDO $db, Throwable $error, string $operation): void {
    if ($db->inTransaction()) $db->rollBack();
    if ($error instanceof NscAclException) {
        jsonResponse(false, null, $error->getMessage(), $error->httpStatus);
    }
    error_log('Employee account ' . $operation . ' failed: ' . $error->getMessage());
    if ($error instanceof PDOException && $error->getCode() === '23000') {
        jsonResponse(false, null, 'Employee account conflicts with an existing account or relationship.', 409);
    }
    jsonResponse(false, null, 'Employee account could not be ' . $operation . '.', 500);
}

if ($method !== 'POST') {
    header('Allow: POST, OPTIONS');
    jsonResponse(false, null, 'Method not allowed.', 405);
}

$action = $_GET['action'] ?? '';
if (!in_array($action, ['create', 'update', 'set_lock', 'delete'], true)) {
    jsonResponse(false, null, 'Unsupported employee account action.', 404);
}
$raw = file_get_contents('php://input');
if (!is_string($raw) || strlen($raw) > 32 * 1024) {
    jsonResponse(false, null, 'Employee account request is too large.', 413);
}
$input = json_decode($raw, true);
if (!is_array($input) || nscAclIsList($input)) {
    jsonResponse(false, null, 'Invalid employee account request.', 400);
}

if ($action === 'create') {
    if (array_diff(array_keys($input), ['name', 'username', 'email', 'phone', 'password', 'role'])
        || !isset($input['name'], $input['username'], $input['email'], $input['password'], $input['role'])) {
        jsonResponse(false, null, 'Invalid employee creation fields.', 400);
    }
    try {
        $name = nscEmployeesNormalizeName($input['name']);
        $username = nscEmployeesNormalizeUsername($input['username']);
        $email = nscEmployeesNormalizeEmail($input['email']);
        $phone = nscEmployeesNormalizePhone($input['phone'] ?? null);
        $role = nscEmployeesNormalizeRole($input['role']);
        $passwordHash = nscEmployeesHashPassword($input['password']);
        $employeeId = generateUuid();

        $db->beginTransaction();
        nscEmployeesLockOwner($db, $tenantId);
        $insert = $db->prepare(
            'INSERT INTO users (id, owner_admin_id, name, username, email, password_hash, role, phone, is_locked, is_master)
             VALUES (:id, :tenant_id, :name, :username, :email, :password_hash, :role, :phone, 1, 0)'
        );
        $insert->execute([
            'id' => $employeeId,
            'tenant_id' => $tenantId,
            'name' => $name,
            'username' => $username,
            'email' => $email,
            'password_hash' => $passwordHash,
            'role' => $role,
            'phone' => $phone,
        ]);
        nscAclWriteAudit(
            $db,
            $currentUser,
            'create',
            'employees',
            $employeeId,
            'Created locked employee account; role=' . $role . '.'
        );
        $db->commit();

        jsonResponse(true, [
            'employee' => [
                'id' => $employeeId,
                'name' => $name,
                'username' => $username,
                'email' => $email,
                'phone' => $phone,
                'role' => $role,
                'isLocked' => true,
            ],
        ]);
    } catch (Throwable $e) {
        nscEmployeesFail($db, $e, 'created');
    }
}

if ($action === 'update') {
    if (array_diff(array_keys($input), ['employeeId', 'name', 'email', 'phone', 'password', 'role'])
        || !isset($input['employeeId']) || !is_string($input['employeeId'])
        || !nscAclValidProjectId($input['employeeId'])) {
        jsonResponse(false, null, 'Invalid employee update fields.', 400);
    }
    $employeeId = $input['employeeId'];
    $fields = [];
    $params = ['employee_id' => $employeeId, 'tenant_id' => $tenantId];
    $sessionSensitiveChange = false;
    $auditFields = [];
    try {
        if (array_key_exists('name', $input)) {
            $fields[] = 'name = :name';
            $params['name'] = nscEmployeesNormalizeName($input['name']);
            $auditFields[] = 'name';
        }
        if (array_key_exists('email', $input)) {
            $fields[] = 'email = :email';
            $params['email'] = nscEmployeesNormalizeEmail($input['email']);
            $sessionSensitiveChange = true;
            $auditFields[] = 'email';
        }
        if (array_key_exists('phone', $input)) {
            $fields[] = 'phone = :phone';
            $params['phone'] = nscEmployeesNormalizePhone($input['phone']);
            $auditFields[] = 'phone';
        }
        if (array_key_exists('role', $input)) {
            $fields[] = 'role = :role';
            $params['role'] = nscEmployeesNormalizeRole($input['role']);
            $sessionSensitiveChange = true;
            $auditFields[] = 'role';
        }
        if (array_key_exists('password', $input) && $input['password'] !== '') {
            $fields[] = 'password_hash = :password_hash';
            $params['password_hash'] = nscEmployeesHashPassword($input['password']);
            $sessionSensitiveChange = true;
            $auditFields[] = 'password_reset';
        }
        if (!$fields) jsonResponse(false, null, 'At least one profile field must be changed.', 400);

        $db->beginTransaction();
        $target = nscEmployeesLockTarget($db, $tenantId, $employeeId);
        nscEmployeesLockOwner($db, $tenantId);
        $sessionSensitiveChange = isset($params['password_hash'])
            || (isset($params['email']) && $params['email'] !== (string)$target['email'])
            || (isset($params['role']) && $params['role'] !== (string)$target['role']);
        $update = $db->prepare(
            'UPDATE users SET ' . implode(', ', $fields)
            . ' WHERE id = :employee_id AND owner_admin_id = :tenant_id AND is_master = 0'
        );
        $update->execute($params);
        if ($sessionSensitiveChange) nscEmployeesRevokeSessions($db, $employeeId);
        $updatedStmt = $db->prepare(
            'SELECT id, name, username, email, phone, role, is_locked FROM users
             WHERE id = :uid AND owner_admin_id = :tid LIMIT 1'
        );
        $updatedStmt->execute(['uid' => $employeeId, 'tid' => $tenantId]);
        $updatedEmployee = $updatedStmt->fetch();
        if (!$updatedEmployee) throw new NscAclException('Employee account was not found under this owner.', 404);
        nscAclWriteAudit(
            $db,
            $currentUser,
            'update',
            'employees',
            $employeeId,
            'Updated employee profile fields=' . implode(',', $auditFields)
                . '; sessions_revoked=' . ($sessionSensitiveChange ? 'yes' : 'no') . '.'
        );
        $db->commit();
        jsonResponse(true, ['employee' => nscEmployeesPublicProfile($updatedEmployee)]);
    } catch (Throwable $e) {
        nscEmployeesFail($db, $e, 'updated');
    }
}

if ($action === 'set_lock') {
    if (array_diff(array_keys($input), ['employeeId', 'isLocked'])
        || !isset($input['employeeId'], $input['isLocked'])
        || !is_string($input['employeeId']) || !nscAclValidProjectId($input['employeeId'])
        || !is_bool($input['isLocked'])) {
        jsonResponse(false, null, 'Invalid employee lock request.', 400);
    }
    $employeeId = $input['employeeId'];
    $isLocked = $input['isLocked'];
    try {
        $db->beginTransaction();
        $employee = nscEmployeesLockTarget($db, $tenantId, $employeeId);
        nscEmployeesLockOwner($db, $tenantId);
        $wasLocked = (bool)$employee['is_locked'];
        if (!$isLocked && $wasLocked) {
            $grants = nscAclLoadGrants($db, $tenantId, $employeeId, true);
            if (!nscAclReadableProjectIds($grants)) {
                throw new NscAclException('Assign at least one project/module read grant before unlocking this account.', 409);
            }
        }
        if ($wasLocked !== $isLocked) {
            $update = $db->prepare(
                'UPDATE users SET is_locked = :locked WHERE id = :uid AND owner_admin_id = :tid AND is_master = 0'
            );
            $update->execute(['locked' => $isLocked ? 1 : 0, 'uid' => $employeeId, 'tid' => $tenantId]);
            if ($isLocked) nscEmployeesRevokeSessions($db, $employeeId);
            nscAclWriteAudit(
                $db,
                $currentUser,
                $isLocked ? 'lock' : 'unlock',
                'employees',
                $employeeId,
                $isLocked ? 'Locked employee account and revoked sessions.' : 'Unlocked employee account after project read grants were verified.'
            );
        } elseif ($isLocked) {
            // A repeated lock request still cleans up any stale sessions.
            nscEmployeesRevokeSessions($db, $employeeId);
        }
        $db->commit();
        jsonResponse(true, ['employeeId' => $employeeId, 'isLocked' => $isLocked]);
    } catch (Throwable $e) {
        nscEmployeesFail($db, $e, 'updated');
    }
}

if ($action === 'delete') {
    if (array_diff(array_keys($input), ['employeeId'])
        || !isset($input['employeeId']) || !is_string($input['employeeId'])
        || !nscAclValidProjectId($input['employeeId'])) {
        jsonResponse(false, null, 'Invalid employee deletion request.', 400);
    }
    $employeeId = $input['employeeId'];
    try {
        $db->beginTransaction();
        $employee = nscEmployeesLockTarget($db, $tenantId, $employeeId);
        nscEmployeesLockOwner($db, $tenantId);
        nscEmployeesRevokeSessions($db, $employeeId);
        // Preserve owner snapshot/settings integrity and transfer historical attribution before deletion.
        $snapshotUpdate = $db->prepare(
            'UPDATE nsc_workspace_snapshots SET updated_by = :owner_id
             WHERE tenant_id = :tenant_id AND updated_by = :employee_id'
        );
        $snapshotUpdate->execute(['owner_id' => $tenantId, 'tenant_id' => $tenantId, 'employee_id' => $employeeId]);
        $settingsUpdate = $db->prepare(
            'UPDATE nsc_tenant_settings SET updated_by = :owner_id
             WHERE tenant_id = :tenant_id AND updated_by = :employee_id'
        );
        $settingsUpdate->execute(['owner_id' => $tenantId, 'tenant_id' => $tenantId, 'employee_id' => $employeeId]);
        $grantorUpdate = $db->prepare(
            'UPDATE nsc_user_project_permissions SET granted_by = :owner_id
             WHERE tenant_id = :tenant_id AND granted_by = :employee_id'
        );
        $grantorUpdate->execute(['owner_id' => $tenantId, 'tenant_id' => $tenantId, 'employee_id' => $employeeId]);

        nscAclWriteAudit(
            $db,
            $currentUser,
            'delete',
            'employees',
            $employeeId,
            'Deleted employee account (' . (string)$employee['username'] . '); sessions and project grants removed.'
        );
        $delete = $db->prepare(
            'DELETE FROM users
             WHERE id = :uid AND owner_admin_id = :tid AND is_master = 0
               AND role IN (\'project_manager\', \'accountant\', \'procurement\', \'viewer\')'
        );
        $delete->execute(['uid' => $employeeId, 'tid' => $tenantId]);
        if ($delete->rowCount() !== 1) throw new NscAclException('Employee account was not found under this owner.', 404);
        $db->commit();
        jsonResponse(true, ['employeeId' => $employeeId, 'deleted' => true]);
    } catch (Throwable $e) {
        nscEmployeesFail($db, $e, 'deleted');
    }
}

jsonResponse(false, null, 'Unsupported employee account action.', 404);
