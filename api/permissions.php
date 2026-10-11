<?php
/** Owner-managed project/module/action grants for employee accounts. */
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

function nscPermissionProjectsFromWorkspace(PDO $db, string $tenantId, bool $forUpdate = false): array {
    $sql = 'SELECT workspace_json FROM nsc_workspace_snapshots WHERE tenant_id = :tid LIMIT 1';
    if ($forUpdate) $sql .= ' FOR UPDATE';
    $stmt = $db->prepare($sql);
    $stmt->execute(['tid' => $tenantId]);
    $row = $stmt->fetch();
    if (!$row) return [];
    $workspace = json_decode((string)$row['workspace_json'], true);
    if (!is_array($workspace) || !is_array($workspace['projects'] ?? null)) {
        jsonResponse(false, null, 'Saved project data is unreadable; no permission changes were made.', 500);
    }
    $projects = [];
    foreach ($workspace['projects'] as $project) {
        if (!is_array($project) || !nscAclValidProjectId($project['id'] ?? null)) continue;
        $projectId = (string)$project['id'];
        $projects[$projectId] = [
            'id' => $projectId,
            'name' => is_string($project['name'] ?? null) ? $project['name'] : '',
            'projectCode' => is_string($project['projectCode'] ?? $project['code'] ?? null)
                ? (string)($project['projectCode'] ?? $project['code'])
                : '',
            'status' => is_string($project['status'] ?? null) ? $project['status'] : 'active',
        ];
    }
    return $projects;
}

if ($method === 'GET') {
    if (($_GET['action'] ?? 'employees') !== 'employees') {
        jsonResponse(false, null, 'Unsupported action.', 404);
    }
    $projects = nscPermissionProjectsFromWorkspace($db, $tenantId);
    $employeesStmt = $db->prepare(
        "SELECT id, name, username, email, phone, role, is_locked, created_at, last_login_at
         FROM users
         WHERE owner_admin_id = :tid AND is_master = 0
           AND role IN ('project_manager', 'accountant', 'procurement', 'viewer')
         ORDER BY created_at ASC, id ASC"
    );
    $employeesStmt->execute(['tid' => $tenantId]);
    $employees = $employeesStmt->fetchAll();
    $grantsByUser = [];
    if ($employees) {
        $grantsStmt = $db->prepare(
            'SELECT user_id, project_id, module_key, actions_json
             FROM nsc_user_project_permissions WHERE tenant_id = :tid'
        );
        $grantsStmt->execute(['tid' => $tenantId]);
        foreach ($grantsStmt->fetchAll() as $grant) {
            $actions = nscAclDecodeStoredActions($grant['actions_json'] ?? null);
            $module = (string)($grant['module_key'] ?? '');
            $projectId = (string)($grant['project_id'] ?? '');
            $userId = (string)($grant['user_id'] ?? '');
            if (!$actions || !nscAclValidProjectId($projectId)
                || !in_array($module, NSC_ACL_MODULES, true)
                || !isset($projects[$projectId])) continue;
            if ((array_diff($actions, ['read']) && !in_array('read', $actions, true))
                || (in_array($module, NSC_ACL_READ_ONLY_MODULES, true) && array_diff($actions, ['read', 'report']))
                || ($module === 'projects' && array_diff($actions, ['read', 'report']))) continue;
            if (($projects[$projectId]['status'] ?? '') === 'archived') {
                $actions = array_values(array_intersect($actions, ['read', 'report']));
            }
            if (!$actions) continue;
            $grantsByUser[$userId][] = [
                'projectId' => $projectId,
                'module' => $module,
                'actions' => $actions,
            ];
        }
    }
    foreach ($employees as &$employee) {
        $employeeId = (string)$employee['id'];
        $employee['isLocked'] = (bool)$employee['is_locked'];
        $employee['grants'] = $grantsByUser[$employeeId] ?? [];
        unset($employee['is_locked']);
    }
    unset($employee);
    jsonResponse(true, [
        'employees' => $employees,
        'projects' => array_values($projects),
        'modules' => NSC_ACL_MODULES,
        'actions' => NSC_ACL_ACTIONS,
        'readOnlyModules' => NSC_ACL_READ_ONLY_MODULES,
    ]);
}

if ($method !== 'POST') {
    header('Allow: GET, POST, OPTIONS');
    jsonResponse(false, null, 'Method not allowed.', 405);
}
if (($_GET['action'] ?? '') !== 'save_grants') {
    jsonResponse(false, null, 'Unsupported action.', 404);
}

$raw = file_get_contents('php://input');
if (!is_string($raw) || strlen($raw) > 256 * 1024) {
    jsonResponse(false, null, 'Request is too large.', 413);
}
$input = json_decode($raw, true);
if (!is_array($input) || array_diff(array_keys($input), ['userId', 'grants'])
    || !array_key_exists('userId', $input) || !array_key_exists('grants', $input)
    || !nscAclValidProjectId($input['userId'])) {
    jsonResponse(false, null, 'Invalid employee permission request.', 400);
}
try {
    $normalizedGrants = nscAclNormalizeGrantList($input['grants']);
} catch (NscAclException $e) {
    jsonResponse(false, null, $e->getMessage(), $e->httpStatus);
}
$userId = (string)$input['userId'];

try {
    $db->beginTransaction();
    $employeeStmt = $db->prepare(
        "SELECT id, owner_admin_id, role, is_master FROM users
         WHERE id = :uid LIMIT 1 FOR UPDATE"
    );
    $employeeStmt->execute(['uid' => $userId]);
    $employee = $employeeStmt->fetch();
    if (!$employee || (string)($employee['owner_admin_id'] ?? '') !== $tenantId
        || (int)$employee['is_master'] === 1
        || !in_array($employee['role'], ['project_manager', 'accountant', 'procurement', 'viewer'], true)) {
        $db->rollBack();
        jsonResponse(false, null, 'Employee account was not found under this owner.', 404);
    }

    $projects = nscPermissionProjectsFromWorkspace($db, $tenantId, true);
    if (!$projects) {
        $db->rollBack();
        jsonResponse(false, null, 'Create and save a project before assigning project permissions.', 409);
    }
    foreach ($normalizedGrants as $grant) {
        if (!isset($projects[$grant['projectId']])) {
            $db->rollBack();
            jsonResponse(false, null, 'A permission grant references a project outside this owner workspace.', 400);
        }
        if (($projects[$grant['projectId']]['status'] ?? '') === 'archived'
            && array_diff($grant['actions'], ['read', 'report'])) {
            $db->rollBack();
            jsonResponse(false, null, 'Archived projects do not allow employee record changes.', 400);
        }
    }

    $previousCountStmt = $db->prepare('SELECT COUNT(*) FROM nsc_user_project_permissions WHERE tenant_id = :tid AND user_id = :uid');
    $previousCountStmt->execute(['tid' => $tenantId, 'uid' => $userId]);
    $previousGrantCount = (int)$previousCountStmt->fetchColumn();

    $delete = $db->prepare('DELETE FROM nsc_user_project_permissions WHERE tenant_id = :tid AND user_id = :uid');
    $delete->execute(['tid' => $tenantId, 'uid' => $userId]);
    $insert = $db->prepare(
        'INSERT INTO nsc_user_project_permissions
            (tenant_id, user_id, project_id, module_key, actions_json, granted_by)
         VALUES (:tid, :uid, :pid, :module, :actions, :granted_by)'
    );
    foreach ($normalizedGrants as $grant) {
        $insert->execute([
            'tid' => $tenantId,
            'uid' => $userId,
            'pid' => $grant['projectId'],
            'module' => $grant['module'],
            'actions' => json_encode($grant['actions'], JSON_UNESCAPED_UNICODE),
            'granted_by' => $currentUser['id'],
        ]);
    }
    nscAclWriteAudit(
        $db,
        $currentUser,
        'update',
        'permissions',
        $userId,
        'Replaced employee grant set; prior grants=' . $previousGrantCount . '; new grants=' . count($normalizedGrants) . '.'
    );
    $db->commit();
} catch (Throwable $e) {
    if ($db->inTransaction()) $db->rollBack();
    error_log('Employee permission update failed: ' . $e->getMessage());
    jsonResponse(false, null, 'Employee permissions could not be saved.', 500);
}

jsonResponse(true, ['userId' => $userId, 'grants' => $normalizedGrants]);
