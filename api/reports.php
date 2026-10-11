<?php
/** Server-authorized report snapshots and auditable report/export actions. */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/access_control.php';

sendSecurityHeaders();
$user = authenticateUser(false);
$db = Database::getConnection();
$isOwner = nscAclIsOwner($user);
$tenantId = $isOwner ? requireTenantOwner($user) : nscAclRequireEmployeeTenant($db, $user);
$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

const NSC_REPORT_COLLECTIONS_BY_TYPE = [
    'financial' => ['expenses', 'payments'],
    'materials' => ['steelRecords', 'concreteRecords'],
    'contractors' => ['contractors', 'expenses', 'payments'],
    'sales' => ['apartments', 'payments'],
    'monthly_pnl' => ['expenses', 'payments', 'apartments'],
];
const NSC_REPORT_SECRET_FIELD_NAMES = [
    'password', 'passwords', 'passwordhash', 'token', 'accesstoken', 'refreshtoken', 'idtoken', 'oauthtoken',
    'gatekey', 'apikey', 'geminiapikey', 'session', 'sessionid', 'csrf', 'csrftoken',
    'clientsecret', 'secretkey', 'privatekey', 'credential', 'credentials', 'authorization', 'cookie',
];

function nscReportsContainsSecretField($value): bool {
    if (!is_array($value)) return false;
    foreach ($value as $key => $child) {
        if (is_string($key)) {
            $normalized = strtolower((string)preg_replace('/[^a-z0-9]/i', '', $key));
            if (in_array($normalized, NSC_REPORT_SECRET_FIELD_NAMES, true)
                || preg_match('/(?:password|passwd|secret|token|credential|authorization|cookie|session|csrf|otp|totp|twofactor|privatekey|apikey|clientsecret|bearer|mfa)/', $normalized)) {
                return true;
            }
        }
        if (nscReportsContainsSecretField($child)) return true;
    }
    return false;
}

function nscReportsLogDenied(PDO $db, array $actor, ?string $projectId, string $details): void {
    try {
        nscAclWriteAudit($db, $actor, 'export', 'reports', $projectId, 'Denied report generation: ' . $details);
    } catch (Throwable $e) {
        error_log('NSC denied report audit logging failed: ' . $e->getMessage());
    }
}

if ($method !== 'POST') {
    header('Allow: POST, OPTIONS');
    jsonResponse(false, null, 'Method not allowed.', 405);
}
if (($_GET['action'] ?? '') !== 'generate') {
    jsonResponse(false, null, 'Unsupported report action.', 404);
}

$raw = file_get_contents('php://input');
if (!is_string($raw) || strlen($raw) > 32 * 1024) {
    jsonResponse(false, null, 'Report request is too large.', 413);
}
$input = json_decode($raw, true);
if (!is_array($input)
    || array_diff(array_keys($input), ['reportType', 'projectId', 'year'])
    || !isset($input['reportType'], $input['projectId'])
    || !is_string($input['reportType'])
    || !is_string($input['projectId'])
    || !isset(NSC_REPORT_COLLECTIONS_BY_TYPE[$input['reportType']])
    || !nscAclValidProjectId($input['projectId'])) {
    jsonResponse(false, null, 'Invalid report request.', 400);
}
$reportType = $input['reportType'];
$projectId = $input['projectId'];
$year = $input['year'] ?? (int)gmdate('Y');
if (!is_int($year) || $year < 2000 || $year > 2100) {
    jsonResponse(false, null, 'Report year must be a whole year between 2000 and 2100.', 400);
}

$collections = NSC_REPORT_COLLECTIONS_BY_TYPE[$reportType];
$requiredModules = ['reports'];
foreach ($collections as $collection) {
    $module = NSC_ACL_WORKSPACE_COLLECTION_MODULES[$collection] ?? null;
    if (!is_string($module)) {
        error_log('Report configuration refers to an unmapped workspace collection: ' . $collection);
        jsonResponse(false, null, 'Report configuration is unavailable.', 500);
    }
    if (!in_array($module, $requiredModules, true)) $requiredModules[] = $module;
}

try {
    $db->beginTransaction();
    if (!$isOwner) {
        // Keep the employee/account lock order aligned with workspace reads and permission revocation.
        nscAclLockEmployeeTenant($db, $user, $tenantId);
    }

    $snapshotStmt = $db->prepare(
        'SELECT workspace_json, revision FROM nsc_workspace_snapshots WHERE tenant_id = :tid LIMIT 1 FOR UPDATE'
    );
    $snapshotStmt->execute(['tid' => $tenantId]);
    $snapshot = $snapshotStmt->fetch();
    if (!$snapshot) {
        throw new NscAclException('The owner must initialize the workspace before reports can be generated.', 409);
    }
    $workspace = json_decode((string)$snapshot['workspace_json'], true);
    if (!is_array($workspace)
        || !isset($workspace['projects'])
        || !is_array($workspace['projects'])
        || !nscAclIsList($workspace['projects'])) {
        throw new NscAclException('Saved project data is unreadable; no report was generated.', 500);
    }

    $project = null;
    foreach ($workspace['projects'] as $candidate) {
        if (is_array($candidate) && (string)($candidate['id'] ?? '') === $projectId) {
            $project = $candidate;
            break;
        }
    }
    if ($project === null) {
        // Do not disclose projects that belong to another tenant.
        throw new NscAclException('The requested project was not found.', 404);
    }

    $grants = [];
    if (!$isOwner) {
        $grants = nscAclLoadGrants($db, $tenantId, (string)$user['id'], true);
        $grants = nscAclRestrictArchivedProjects($grants, $workspace['projects']);
        foreach ($requiredModules as $module) {
            nscAclRequireProjectAction($grants, $projectId, $module, 'report');
        }
        if (($project['status'] ?? '') === 'archived') {
            foreach ($requiredModules as $module) {
                if (!nscAclCan($grants, $projectId, $module, 'read')
                    || !nscAclCan($grants, $projectId, $module, 'report')) {
                    throw new NscAclException('Archived project report access is not authorized.', 403);
                }
            }
        }
    }

    $reportData = [];
    foreach ($collections as $collection) {
        if (array_key_exists($collection, $workspace)
            && (!is_array($workspace[$collection]) || !nscAclIsList($workspace[$collection]))) {
            throw new NscAclException('Saved report data is unreadable; no report was generated.', 500);
        }
        $module = NSC_ACL_WORKSPACE_COLLECTION_MODULES[$collection];
        $rows = [];
        foreach (($workspace[$collection] ?? []) as $record) {
            if (!is_array($record)) continue;
            $recordProjectIds = nscAclProjectIdsForRecord($record);
            if (!in_array($projectId, $recordProjectIds, true)) continue;

            if (!$isOwner) {
                if (!nscAclCanReadRecord($grants, $module, $record)) continue;
                $canReportRecord = true;
                foreach ($recordProjectIds as $recordProjectId) {
                    if (!nscAclCan($grants, $recordProjectId, $module, 'report')) {
                        $canReportRecord = false;
                        break;
                    }
                }
                if (!$canReportRecord) continue;
            }
            if (nscReportsContainsSecretField($record)) {
                throw new NscAclException('Saved report data contains a prohibited credential field; no report was generated.', 500);
            }
            $rows[] = $record;
        }
        $reportData[$collection] = $rows;
    }

    $projectSummary = ['id' => $projectId];
    foreach (['name', 'code', 'projectCode', 'status'] as $projectField) {
        if (is_scalar($project[$projectField] ?? null)) {
            $projectSummary[$projectField] = (string)$project[$projectField];
        }
    }
    if (nscReportsContainsSecretField($projectSummary) || nscReportsContainsSecretField($reportData)) {
        throw new NscAclException('Saved report data contains a prohibited credential field; no report was generated.', 500);
    }

    nscAclWriteAudit(
        $db,
        $user,
        'export',
        'reports',
        $projectId,
        'Generated ' . $reportType . ' report; modules=' . implode(',', $requiredModules)
            . '; workspace_revision=' . (int)$snapshot['revision'] . '; year=' . $year . '.'
    );
    $db->commit();

    jsonResponse(true, [
        'reportType' => $reportType,
        'projectId' => $projectId,
        'year' => $year,
        'workspaceRevision' => (int)$snapshot['revision'],
        'project' => $projectSummary,
        'data' => $reportData,
    ]);
} catch (NscAclException $e) {
    if ($db->inTransaction()) $db->rollBack();
    if ($e->httpStatus === 403) {
        nscReportsLogDenied($db, $user, $projectId, $e->getMessage());
    }
    jsonResponse(false, null, $e->getMessage(), $e->httpStatus);
} catch (Throwable $e) {
    if ($db->inTransaction()) $db->rollBack();
    error_log('Report generation failed: ' . $e->getMessage());
    jsonResponse(false, null, 'Report could not be generated.', 500);
}
