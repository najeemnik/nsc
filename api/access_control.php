<?php
/**
 * Server-authoritative project/module/action access controls for staff.
 * This file does not grant access by itself: each data endpoint must call the
 * checks below. Unrecognized, malformed, or absent grants always deny access.
 */
require_once __DIR__ . '/db.php';

const NSC_ACL_MODULES = [
    'dashboard', 'projects', 'income', 'materials', 'labor', 'steel', 'concrete', 'expenses',
    'contractors', 'suppliers', 'apartments', 'payments', 'treasury', 'petty_cash', 'assets',
    'transfers', 'partners', 'budget', 'accounting', 'journal', 'documents', 'reports',
];
const NSC_ACL_ACTIONS = ['read', 'create', 'update', 'delete', 'report'];
// These views do not expose record CRUD controls; report/export remains a separately grantable action.
const NSC_ACL_READ_ONLY_MODULES = ['dashboard', 'reports'];
const NSC_ACL_WORKSPACE_COLLECTION_MODULES = [
    'expenses' => 'expenses',
    'steelRecords' => 'steel',
    'concreteRecords' => 'concrete',
    'contractors' => 'contractors',
    'suppliers' => 'suppliers',
    'apartments' => 'apartments',
    'payments' => 'payments',
    'documents' => 'documents',
    'laborRecords' => 'labor',
    'assets' => 'assets',
    'projectPartners' => 'partners',
    'projectInvestments' => 'partners',
    'partnerEquityTransfers' => 'partners',
    'projectBudgets' => 'budget',
    'incomeRecords' => 'income',
    'materialProcurements' => 'materials',
    'interProjectTransfers' => 'transfers',
];

class NscAclException extends RuntimeException {
    public $httpStatus;

    public function __construct(string $message, int $httpStatus = 403) {
        parent::__construct($message);
        $this->httpStatus = $httpStatus;
    }
}

function nscAclIsList(array $value): bool {
    if ($value === []) return true;
    return array_keys($value) === range(0, count($value) - 1);
}

function nscAclIsOwner(array $user): bool {
    return (int)($user['is_master'] ?? 0) !== 1
        && ($user['role'] ?? '') === 'admin'
        && trim((string)($user['owner_admin_id'] ?? '')) === ''
        && (string)($user['id'] ?? '') !== '';
}

/** Resolve and re-check an employee's owner relationship and both account states. */
function nscAclRequireEmployeeTenant(PDO $db, array $user): string {
    $userId = trim((string)($user['id'] ?? ''));
    $tenantId = trim((string)($user['owner_admin_id'] ?? ''));
    if ($userId === '' || $tenantId === '' || $userId === $tenantId
        || (int)($user['is_master'] ?? 0) === 1
        || in_array(($user['role'] ?? ''), ['admin', 'master'], true)) {
        jsonResponse(false, null, 'Employee access is not configured for this account.', 403);
    }

    $employee = $db->prepare(
        "SELECT id FROM users
         WHERE id = :uid AND owner_admin_id = :tid AND is_master = 0 AND is_locked = 0
           AND role IN ('project_manager', 'accountant', 'procurement', 'viewer')
           AND (subscription_expires_at IS NULL OR subscription_expires_at > UTC_TIMESTAMP())
         LIMIT 1"
    );
    $employee->execute(['uid' => $userId, 'tid' => $tenantId]);
    if (!$employee->fetch()) {
        jsonResponse(false, null, 'Employee account is inactive or no longer assigned to this owner.', 403);
    }

    $owner = $db->prepare(
        "SELECT id, is_locked, subscription_expires_at FROM users
         WHERE id = :tid AND role = 'admin' AND is_master = 0
           AND (owner_admin_id IS NULL OR owner_admin_id = '')
         LIMIT 1"
    );
    $owner->execute(['tid' => $tenantId]);
    $ownerRow = $owner->fetch();
    if (!$ownerRow || (int)$ownerRow['is_locked'] !== 0) {
        jsonResponse(false, null, 'The employee owner account is unavailable.', 403);
    }
    if (!empty($ownerRow['subscription_expires_at'])
        && strtotime((string)$ownerRow['subscription_expires_at'] . ' UTC') <= time()) {
        jsonResponse(false, null, 'The owner subscription has expired.', 402);
    }
    return $tenantId;
}

/** Lock and revalidate both accounts before an employee workspace mutation. */
function nscAclLockEmployeeTenant(PDO $db, array $user, string $tenantId): void {
    $stmt = $db->prepare(
        "SELECT e.id
         FROM users e
         INNER JOIN users o ON o.id = e.owner_admin_id
         WHERE e.id = :uid AND e.owner_admin_id = :tid
           AND e.is_master = 0 AND e.is_locked = 0
           AND e.role IN ('project_manager', 'accountant', 'procurement', 'viewer')
           AND (e.subscription_expires_at IS NULL OR e.subscription_expires_at > UTC_TIMESTAMP())
           AND o.role = 'admin' AND o.is_master = 0
           AND (o.owner_admin_id IS NULL OR o.owner_admin_id = '')
           AND o.is_locked = 0
           AND (o.subscription_expires_at IS NULL OR o.subscription_expires_at > UTC_TIMESTAMP())
         LIMIT 1 FOR UPDATE"
    );
    $stmt->execute(['uid' => (string)($user['id'] ?? ''), 'tid' => $tenantId]);
    if (!$stmt->fetch()) {
        throw new NscAclException('Employee or owner account is inactive; no workspace change was applied.', 403);
    }
}

function nscAclValidProjectId($projectId): bool {
    return is_string($projectId)
        && strlen($projectId) <= 36
        && (bool)preg_match('/^[A-Za-z0-9][A-Za-z0-9._-]{0,35}$/D', $projectId);
}

function nscAclNormalizeActions($value): array {
    if (!is_array($value) || !nscAclIsList($value) || count($value) < 1 || count($value) > count(NSC_ACL_ACTIONS)) {
        throw new NscAclException('Each grant must contain a valid action list.', 400);
    }
    $actions = [];
    foreach ($value as $action) {
        if (!is_string($action) || !in_array($action, NSC_ACL_ACTIONS, true)) {
            throw new NscAclException('A grant contains an unsupported action.', 400);
        }
        if (isset($actions[$action])) {
            throw new NscAclException('A grant cannot repeat the same action.', 400);
        }
        $actions[$action] = true;
    }
    $normalized = array_values(array_filter(NSC_ACL_ACTIONS, static function ($action) use ($actions) {
        return isset($actions[$action]);
    }));
    $requiresRead = ['create', 'update', 'delete', 'report'];
    if (array_intersect($normalized, $requiresRead) && !in_array('read', $normalized, true)) {
        throw new NscAclException('Create, update, delete, and report actions require read access for the same project and module.', 400);
    }
    return $normalized;
}

/** Validate the complete replacement grant list before any database mutation. */
function nscAclNormalizeGrantList($value): array {
    if (!is_array($value) || !nscAclIsList($value) || count($value) > 1000) {
        throw new NscAclException('Invalid or oversized grant list.', 400);
    }
    $normalized = [];
    $seen = [];
    foreach ($value as $grant) {
        if (!is_array($grant) || nscAclIsList($grant)) {
            throw new NscAclException('Invalid project permission grant.', 400);
        }
        $unknown = array_diff(array_keys($grant), ['projectId', 'module', 'actions']);
        if ($unknown || count($grant) !== 3) {
            throw new NscAclException('A grant contains unsupported fields.', 400);
        }
        $projectId = $grant['projectId'] ?? null;
        $module = $grant['module'] ?? null;
        if (!nscAclValidProjectId($projectId)
            || !is_string($module)
            || !in_array($module, NSC_ACL_MODULES, true)) {
            throw new NscAclException('A grant contains an invalid project or module.', 400);
        }
        $actions = nscAclNormalizeActions($grant['actions'] ?? null);
        if (in_array($module, NSC_ACL_READ_ONLY_MODULES, true)
            && array_diff($actions, ['read', 'report'])) {
            throw new NscAclException('This module does not support employee record changes.', 400);
        }
        if ($module === 'projects' && array_diff($actions, ['read', 'report'])) {
            throw new NscAclException('Project creation, editing, and deletion remain owner-only.', 400);
        }
        $key = $projectId . "\0" . $module;
        if (isset($seen[$key])) {
            throw new NscAclException('Duplicate project/module grants are not allowed.', 400);
        }
        $seen[$key] = true;
        $normalized[] = ['projectId' => $projectId, 'module' => $module, 'actions' => $actions];
    }
    return $normalized;
}

function nscAclDecodeStoredActions($json): array {
    if (!is_string($json) || $json === '') return [];
    $decoded = json_decode($json, true);
    if (!is_array($decoded) || !nscAclIsList($decoded)) return [];
    $actions = [];
    foreach ($decoded as $action) {
        if (!is_string($action) || !in_array($action, NSC_ACL_ACTIONS, true)) return [];
        $actions[$action] = true;
    }
    return array_values(array_filter(NSC_ACL_ACTIONS, static function ($action) use ($actions) {
        return isset($actions[$action]);
    }));
}

/** Returns [projectId][module] => normalized actions. Malformed rows grant nothing. */
function nscAclLoadGrants(PDO $db, string $tenantId, string $userId, bool $forUpdate = false): array {
    $sql = 'SELECT project_id, module_key, actions_json FROM nsc_user_project_permissions WHERE tenant_id = :tid AND user_id = :uid';
    if ($forUpdate) $sql .= ' FOR UPDATE';
    $stmt = $db->prepare($sql);
    $stmt->execute(['tid' => $tenantId, 'uid' => $userId]);
    $grants = [];
    foreach ($stmt->fetchAll() as $row) {
        $projectId = (string)($row['project_id'] ?? '');
        $module = (string)($row['module_key'] ?? '');
        $actions = nscAclDecodeStoredActions($row['actions_json'] ?? null);
        if (!nscAclValidProjectId($projectId) || !in_array($module, NSC_ACL_MODULES, true) || !$actions) continue;
        if (in_array($module, NSC_ACL_READ_ONLY_MODULES, true) && array_diff($actions, ['read', 'report'])) continue;
        if ($module === 'projects' && array_diff($actions, ['read', 'report'])) continue;
        if (array_diff($actions, ['read']) && !in_array('read', $actions, true)) continue;
        $grants[$projectId][$module] = $actions;
    }
    return $grants;
}

/** Remove employee write rights on archived projects while retaining authorized history reads. */
function nscAclRestrictArchivedProjects(array $grants, array $projects): array {
    $archivedIds = [];
    foreach ($projects as $project) {
        if (is_array($project) && isset($project['id']) && ($project['status'] ?? '') === 'archived') {
            $archivedIds[(string)$project['id']] = true;
        }
    }
    foreach ($archivedIds as $projectId => $_) {
        foreach ($grants[$projectId] ?? [] as $module => $actions) {
            $grants[$projectId][$module] = array_values(array_intersect($actions, ['read', 'report']));
        }
    }
    return $grants;
}

function nscAclCan(array $grants, string $projectId, string $module, string $action): bool {
    if (!nscAclValidProjectId($projectId)
        || !in_array($module, NSC_ACL_MODULES, true)
        || !in_array($action, NSC_ACL_ACTIONS, true)) return false;
    return in_array($action, $grants[$projectId][$module] ?? [], true);
}

/** A report or write action always requires same-project/module read access. */
function nscAclRequireProjectAction(array $grants, string $projectId, string $module, string $action): void {
    if (!nscAclValidProjectId($projectId)
        || !in_array($module, NSC_ACL_MODULES, true)
        || !in_array($action, NSC_ACL_ACTIONS, true)
        || !nscAclCan($grants, $projectId, $module, 'read')
        || !nscAclCan($grants, $projectId, $module, $action)) {
        throw new NscAclException('The employee is not authorized to ' . $action . ' this project/module.', 403);
    }
}

/** Insert security-sensitive ACL audit events inside the caller's transaction. */
function nscAclWriteAudit(PDO $db, array $actor, string $action, string $module, ?string $recordId, ?string $details = null): void {
    $allowedAuditActions = ['login', 'logout', 'create', 'update', 'delete', 'lock', 'unlock', 'export', 'transfer'];
    if (!in_array($action, $allowedAuditActions, true)) {
        throw new InvalidArgumentException('Unsupported audit action.');
    }
    $stmt = $db->prepare(
        'INSERT INTO system_audit_logs (user_id, user_name, action, module, record_id, ip_address, user_agent, details)
         VALUES (:uid, :uname, :action, :module, :rid, :ip, :ua, :details)'
    );
    $stmt->execute([
        'uid' => (string)($actor['id'] ?? ''),
        'uname' => (string)($actor['name'] ?? 'User'),
        'action' => $action,
        'module' => substr($module, 0, 80),
        'rid' => $recordId,
        'ip' => $_SERVER['REMOTE_ADDR'] ?? null,
        'ua' => substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 255),
        'details' => $details === null ? null : substr($details, 0, 4000),
    ]);
}

/** Best-effort event for rejected employee writes; the denial itself never depends on logging. */
function nscAclLogDenied(PDO $db, array $actor, ?string $recordId, string $details): void {
    try {
        nscAclWriteAudit($db, $actor, 'update', 'access_control', $recordId, 'Denied employee workspace write: ' . $details);
    } catch (Throwable $e) {
        error_log('NSC denied-access audit logging failed: ' . $e->getMessage());
    }
}

function nscAclProjectIdsForRecord(array $record): array {
    $ids = [];
    foreach (['projectId', 'project_id', 'assignedProjectId', 'assigned_project_id', 'fromProjectId', 'from_project_id', 'toProjectId', 'to_project_id'] as $key) {
        if (isset($record[$key]) && is_scalar($record[$key]) && (string)$record[$key] !== '') {
            $ids[] = (string)$record[$key];
        }
    }
    return array_values(array_unique($ids));
}

/** Aggregate audit counts by project/module/action, capped to bound log volume on bulk writes. */
function nscAclAccumulateAuditChange(array &$summary, string $action, string $module, array $record, ?array $previousRecord = null): void {
    $projectIds = nscAclProjectIdsForRecord($record);
    if ($previousRecord !== null) {
        $projectIds = array_values(array_unique(array_merge($projectIds, nscAclProjectIdsForRecord($previousRecord))));
    }
    foreach ($projectIds as $projectId) {
        $key = $action . "\0" . $module . "\0" . $projectId;
        if (array_key_exists($key, $summary)) {
            $summary[$key]++;
        } elseif (count($summary) < 100) {
            $summary[$key] = 1;
        } else {
            $summary['__overflow__'] = ($summary['__overflow__'] ?? 0) + 1;
        }
    }
}

function nscAclCanReadRecord(array $grants, string $module, array $record): bool {
    $projectIds = nscAclProjectIdsForRecord($record);
    if (!$projectIds) return false;
    foreach ($projectIds as $projectId) {
        if (!nscAclCan($grants, $projectId, $module, 'read')) return false;
    }
    return true;
}

function nscAclReadableProjectIds(array $grants): array {
    $projectIds = [];
    foreach ($grants as $projectId => $modules) {
        foreach ($modules as $actions) {
            if (in_array('read', $actions, true)) {
                $projectIds[(string)$projectId] = true;
                break;
            }
        }
    }
    return array_keys($projectIds);
}

/** Return only explicitly readable project records and module collections. */
function nscAclFilterWorkspace(array $workspace, array $grants): array {
    if (array_key_exists('projects', $workspace)
        && (!is_array($workspace['projects']) || !nscAclIsList($workspace['projects']))) {
        throw new NscAclException('Saved project data is unreadable.', 500);
    }
    foreach (NSC_ACL_WORKSPACE_COLLECTION_MODULES as $collection => $_module) {
        if (array_key_exists($collection, $workspace)
            && (!is_array($workspace[$collection]) || !nscAclIsList($workspace[$collection]))) {
            throw new NscAclException('Saved workspace collection is unreadable.', 500);
        }
    }
    $readableProjectIds = nscAclReadableProjectIds($grants);
    $filtered = [];
    if (isset($workspace['language']) && in_array($workspace['language'], ['en', 'fa', 'ps'], true)) {
        $filtered['language'] = $workspace['language'];
    }

    $filteredProjects = [];
    foreach (($workspace['projects'] ?? []) as $project) {
        if (!is_array($project) || !isset($project['id'])) continue;
        $projectId = (string)$project['id'];
        if (!in_array($projectId, $readableProjectIds, true)) continue;
        if (nscAclCan($grants, $projectId, 'projects', 'read')) {
            $filteredProjects[] = $project;
        } else {
            $filteredProjects[] = array_intersect_key($project, array_flip(['id', 'name', 'projectCode', 'code', 'status']));
        }
    }
    $filtered['projects'] = $filteredProjects;
    $visibleProjectIds = array_map(static function ($project) {
        return (string)$project['id'];
    }, $filteredProjects);
    $currentProjectId = (string)($workspace['currentProjectId'] ?? '');
    $filtered['currentProjectId'] = in_array($currentProjectId, $visibleProjectIds, true)
        ? $currentProjectId
        : ($visibleProjectIds[0] ?? '');

    foreach (NSC_ACL_WORKSPACE_COLLECTION_MODULES as $collection => $module) {
        $filtered[$collection] = [];
        foreach (($workspace[$collection] ?? []) as $record) {
            if (is_array($record) && nscAclCanReadRecord($grants, $module, $record)) {
                $filtered[$collection][] = $record;
            }
        }
    }
    // Tenant-wide settings and private owner configuration are deliberately omitted.
    return $filtered;
}

function nscAclRequireRecordAction(array $grants, string $module, array $record, string $action): void {
    $projectIds = nscAclProjectIdsForRecord($record);
    if (!$projectIds) {
        throw new NscAclException('Employee records must be assigned to an authorized project.', 403);
    }
    foreach ($projectIds as $projectId) {
        nscAclRequireProjectAction($grants, $projectId, $module, $action);
    }
}

/**
 * Merge an employee's filtered snapshot changes into the full owner snapshot.
 * Hidden collections and tenant-wide settings are preserved, never replaced by
 * the employee's intentionally filtered or incomplete client state.
 */
function nscAclMergeEmployeeWorkspace(array $stored, array $incoming, array $grants, ?array &$auditSummary = null): array {
    if ($auditSummary === null && func_num_args() >= 4) $auditSummary = [];
    $merged = $stored;
    foreach (NSC_ACL_WORKSPACE_COLLECTION_MODULES as $collection => $module) {
        if (!array_key_exists($collection, $incoming)) continue;
        $oldRows = is_array($stored[$collection] ?? null) ? $stored[$collection] : [];
        $newRows = $incoming[$collection];
        if (!is_array($newRows)) throw new NscAclException('Invalid employee workspace collection.', 400);

        $oldById = [];
        foreach ($oldRows as $row) {
            if (!is_array($row) || !isset($row['id']) || !is_scalar($row['id']) || (string)$row['id'] === '') {
                throw new NscAclException('Saved workspace records need owner review before employee writes are accepted.', 500);
            }
            $oldId = (string)$row['id'];
            if (isset($oldById[$oldId])) {
                throw new NscAclException('Saved workspace contains duplicate record identifiers; employee writes are blocked.', 500);
            }
            $oldById[$oldId] = $row;
        }
        $newById = [];
        foreach ($newRows as $row) {
            if (!is_array($row) || !isset($row['id']) || !is_scalar($row['id'])) {
                throw new NscAclException('Every employee record must have an identifier.', 400);
            }
            $id = (string)$row['id'];
            if ($id === '' || isset($newById[$id])) throw new NscAclException('Duplicate employee record identifier.', 400);
            if (!nscAclCanReadRecord($grants, $module, $row)) {
                throw new NscAclException('The employee submitted data outside their project/module read grants.', 403);
            }
            $newById[$id] = $row;
        }

        $resultRows = [];
        foreach ($oldById as $id => $oldRow) {
            $oldIsVisible = nscAclCanReadRecord($grants, $module, $oldRow);
            if (!$oldIsVisible) {
                if (isset($newById[$id])) {
                    throw new NscAclException('The employee cannot reference a record outside their read grants.', 403);
                }
                $resultRows[] = $oldRow;
                continue;
            }

            if (!array_key_exists($id, $newById)) {
                nscAclRequireRecordAction($grants, $module, $oldRow, 'delete');
                if ($auditSummary !== null) nscAclAccumulateAuditChange($auditSummary, 'delete', $module, $oldRow);
                continue;
            }

            $newRow = $newById[$id];
            unset($newById[$id]);
            if ($newRow != $oldRow) {
                nscAclRequireRecordAction($grants, $module, $oldRow, 'update');
                nscAclRequireRecordAction($grants, $module, $newRow, 'update');
                if ((string)$newRow['id'] !== (string)$oldRow['id']) {
                    throw new NscAclException('Record identifiers cannot be changed.', 400);
                }
                if ($auditSummary !== null) nscAclAccumulateAuditChange($auditSummary, 'update', $module, $newRow, $oldRow);
                $resultRows[] = $newRow;
            } else {
                $resultRows[] = $oldRow;
            }
        }

        foreach ($newById as $newRow) {
            nscAclRequireRecordAction($grants, $module, $newRow, 'create');
            if ($auditSummary !== null) nscAclAccumulateAuditChange($auditSummary, 'create', $module, $newRow);
            $resultRows[] = $newRow;
        }
        $merged[$collection] = $resultRows;
    }

    // Projects and tenant-level settings are owner-managed. Keep the server copy.
    foreach (['projects', 'appSettings', 'notificationPreferences', 'dashboardLayout', 'currentProjectId', 'language'] as $ownerKey) {
        if (array_key_exists($ownerKey, $stored)) $merged[$ownerKey] = $stored[$ownerKey];
        else unset($merged[$ownerKey]);
    }
    return $merged;
}
