<?php
/**
 * Server-authoritative workspace persistence. Owners retain full tenant access;
 * staff receive only granted project/module data and scoped CRUD changes.
 */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/access_control.php';
require_once __DIR__ . '/material_account_map.php';

sendSecurityHeaders();
$user = authenticateUser(false);
$db = Database::getConnection();
$isOwner = nscAclIsOwner($user);
$tenantId = $isOwner ? requireTenantOwner($user) : nscAclRequireEmployeeTenant($db, $user);
$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

const NSC_WORKSPACE_KEYS = [
    'projects', 'expenses', 'steelRecords', 'concreteRecords', 'contractors', 'suppliers',
    'apartments', 'payments', 'documents', 'laborRecords', 'assets', 'projectPartners',
    'projectInvestments', 'partnerEquityTransfers', 'projectBudgets', 'incomeRecords',
    'materialProcurements', 'interProjectTransfers', 'appSettings',
    'currentProjectId', 'language', 'notificationPreferences', 'dashboardLayout',
];
const NSC_PROJECT_BOUND_KEYS = [
    'expenses', 'steelRecords', 'concreteRecords', 'contractors', 'apartments', 'payments',
    'documents', 'laborRecords', 'assets', 'suppliers', 'projectPartners', 'projectInvestments',
    'partnerEquityTransfers', 'projectBudgets', 'incomeRecords', 'materialProcurements', 'interProjectTransfers',
];
const NSC_SECRET_FIELD_NAMES = [
    'password', 'passwords', 'passwordhash', 'token', 'accesstoken', 'refreshtoken', 'idtoken', 'oauthtoken',
    'gatekey', 'apikey', 'geminiapikey', 'session', 'sessionid', 'csrf', 'csrftoken',
    'clientsecret', 'secretkey', 'privatekey', 'credential', 'credentials', 'authorization', 'cookie',
];

function nscContainsSecretField($value): bool {
    if (!is_array($value)) return false;
    foreach ($value as $key => $child) {
        if (is_string($key)) {
            $normalized = strtolower((string)preg_replace('/[^a-z0-9]/i', '', $key));
            if (in_array($normalized, NSC_SECRET_FIELD_NAMES, true)
                || preg_match('/(?:password|passwd|secret|token|credential|authorization|cookie|session|csrf|otp|totp|twofactor|privatekey|apikey|clientsecret|bearer|mfa)/', $normalized)) {
                return true;
            }
        }
        if (nscContainsSecretField($child)) return true;
    }
    return false;
}

function nscProjectIdsFromRecord(array $record): array {
    $ids = [];
    foreach (['projectId', 'project_id', 'assignedProjectId', 'assigned_project_id', 'fromProjectId', 'from_project_id', 'toProjectId', 'to_project_id'] as $key) {
        if (isset($record[$key]) && is_scalar($record[$key]) && (string)$record[$key] !== '') {
            $ids[] = (string)$record[$key];
        }
    }
    return array_values(array_unique($ids));
}

if ($method === 'GET') {
    $row = false;
    $settings = false;
    $workspace = null;
    $revision = 0;

    if ($isOwner) {
        $stmt = $db->prepare('SELECT workspace_json, revision, updated_at FROM nsc_workspace_snapshots WHERE tenant_id = :tid LIMIT 1');
        $stmt->execute(['tid' => $tenantId]);
        $row = $stmt->fetch();
        if ($row) {
            $workspace = json_decode((string)$row['workspace_json'], true);
            if (!is_array($workspace)) {
                error_log('Invalid workspace JSON for tenant ' . $tenantId);
                jsonResponse(false, null, 'Saved workspace data is unreadable; no data was changed.', 500);
            }
            $revision = (int)$row['revision'];
        }
        $settingsStmt = $db->prepare('SELECT default_language, settings_json, revision FROM nsc_tenant_settings WHERE tenant_id = :tid LIMIT 1');
        $settingsStmt->execute(['tid' => $tenantId]);
        $settings = $settingsStmt->fetch();
    } else {
        $db->beginTransaction();
        try {
            // Read under the same lock order as permission replacement and scoped writes.
            nscAclLockEmployeeTenant($db, $user, $tenantId);
            $stmt = $db->prepare('SELECT workspace_json, revision, updated_at FROM nsc_workspace_snapshots WHERE tenant_id = :tid LIMIT 1 FOR UPDATE');
            $stmt->execute(['tid' => $tenantId]);
            $row = $stmt->fetch();
            $grants = nscAclLoadGrants($db, $tenantId, (string)$user['id'], true);
            if (!nscAclReadableProjectIds($grants)) {
                throw new NscAclException('No server-side project read grants are assigned to this employee.', 403);
            }
            if (!$row) {
                throw new NscAclException('The owner must initialize the workspace before employee access is available.', 409);
            }
            $workspace = json_decode((string)$row['workspace_json'], true);
            if (!is_array($workspace)) {
                throw new NscAclException('Saved workspace data is unreadable; no data was changed.', 500);
            }
            $workspaceProjects = $workspace['projects'] ?? [];
            if (!is_array($workspaceProjects)) {
                throw new NscAclException('Saved project data is unreadable; no data was changed.', 500);
            }
            $grants = nscAclRestrictArchivedProjects($grants, $workspaceProjects);
            $workspace = nscAclFilterWorkspace($workspace, $grants);
            $revision = (int)$row['revision'];
            $db->commit();
        } catch (NscAclException $e) {
            if ($db->inTransaction()) $db->rollBack();
            if ($e->httpStatus === 403) nscAclLogDenied($db, $user, $tenantId, $e->getMessage());
            jsonResponse(false, null, $e->getMessage(), $e->httpStatus);
        } catch (Throwable $e) {
            if ($db->inTransaction()) $db->rollBack();
            error_log('Employee workspace read failed: ' . $e->getMessage());
            jsonResponse(false, null, 'Workspace could not be read.', 500);
        }
    }

    if (is_array($workspace)) nscMaterialAnnotateWorkspace($workspace);
    jsonResponse(true, [
        'exists' => $row !== false,
        'workspace' => $workspace,
        'revision' => $revision,
        'defaultLanguage' => $isOwner
            ? ($settings['default_language'] ?? 'en')
            : ($workspace['language'] ?? 'en'),
        'updatedAt' => $isOwner ? ($row['updated_at'] ?? null) : null,
    ]);
}

if ($method === 'PUT') {
    $raw = file_get_contents('php://input');
    if (!is_string($raw) || strlen($raw) > 15 * 1024 * 1024) {
        jsonResponse(false, null, 'Workspace payload is too large.', 413);
    }
    $input = json_decode($raw, true);
    if (!is_array($input) || !isset($input['workspace']) || !is_array($input['workspace'])) {
        jsonResponse(false, null, 'Invalid workspace payload.', 400);
    }
    if (!isset($input['revision']) || !is_int($input['revision']) || $input['revision'] < 0) {
        jsonResponse(false, null, 'A valid workspace revision is required.', 400);
    }
    if (!isset($input['tenantId']) || !is_string($input['tenantId']) || !hash_equals($tenantId, $input['tenantId'])) {
        jsonResponse(false, null, 'Workspace owner does not match the active session.', 403);
    }
    $workspace = $input['workspace'];
    if (nscContainsSecretField($workspace)) {
        jsonResponse(false, null, 'Workspace data must not contain credentials or session secrets.', 400);
    }

    $unknownKeys = array_diff(array_keys($workspace), NSC_WORKSPACE_KEYS);
    if ($unknownKeys) {
        jsonResponse(false, null, 'Workspace contains unsupported data fields.', 400);
    }

    $normalized = [];
    foreach (NSC_WORKSPACE_KEYS as $key) {
        if (!array_key_exists($key, $workspace)) continue;
        $value = $workspace[$key];
        if (in_array($key, ['projects', 'expenses', 'steelRecords', 'concreteRecords', 'contractors', 'suppliers', 'apartments', 'payments', 'documents', 'laborRecords', 'assets', 'projectPartners', 'projectInvestments', 'partnerEquityTransfers', 'projectBudgets', 'incomeRecords', 'materialProcurements', 'interProjectTransfers'], true)) {
            if (!is_array($value) || count($value) > 20000) {
                jsonResponse(false, null, 'A workspace collection has an invalid shape or exceeds its limit.', 400);
            }
            $seenIds = [];
            foreach ($value as $record) {
                if (!is_array($record) || !isset($record['id']) || !is_scalar($record['id'])) {
                    jsonResponse(false, null, 'Every saved record must have an identifier.', 400);
                }
                $id = (string)$record['id'];
                if ($id === '' || isset($seenIds[$id])) {
                    jsonResponse(false, null, 'Workspace record identifiers must be unique.', 400);
                }
                $seenIds[$id] = true;
            }
        }
        $normalized[$key] = $value;
    }

    $language = $workspace['language'] ?? 'en';
    if (!in_array($language, ['en', 'fa', 'ps'], true)) {
        jsonResponse(false, null, 'Unsupported workspace language.', 400);
    }

    if ($isOwner) {
        $projects = $normalized['projects'] ?? [];
        $projectIds = [];
        foreach ($projects as $project) {
            if (!is_array($project) || !isset($project['id']) || !is_scalar($project['id'])) {
                jsonResponse(false, null, 'Every project must have a valid identifier.', 400);
            }
            $projectIds[(string)$project['id']] = true;
        }
        foreach (NSC_PROJECT_BOUND_KEYS as $key) {
            foreach (($normalized[$key] ?? []) as $record) {
                foreach (nscProjectIdsFromRecord($record) as $projectId) {
                    if (!isset($projectIds[$projectId])) {
                        jsonResponse(false, null, 'A record refers to a project outside this workspace.', 400);
                    }
                }
            }
        }
    }

    $expectedRevision = (int)$input['revision'];
    $newRevision = 0;
    $writeWorkspace = $normalized;
    $employeeAuditSummary = [];
    $db->beginTransaction();
    try {
        // Match permission-replacement lock order: employee, then workspace, then grants.
        if (!$isOwner) nscAclLockEmployeeTenant($db, $user, $tenantId);
        $read = $db->prepare('SELECT workspace_json, revision FROM nsc_workspace_snapshots WHERE tenant_id = :tid FOR UPDATE');
        $read->execute(['tid' => $tenantId]);
        $existing = $read->fetch();
        $currentRevision = $existing ? (int)$existing['revision'] : 0;
        if ($currentRevision !== $expectedRevision) {
            $db->rollBack();
            jsonResponse(false, ['revision' => $currentRevision], 'Workspace changed in another session. Reload before saving.', 409);
        }
        if (!$isOwner) {
            if (!$existing) {
                throw new NscAclException('The owner must initialize the workspace before staff can save changes.', 403);
            }
            $storedWorkspace = json_decode((string)$existing['workspace_json'], true);
            if (!is_array($storedWorkspace)) {
                throw new NscAclException('Saved workspace data is unreadable; no data was changed.', 500);
            }
            // Lock the grant rows for the duration of this write so a concurrent revocation
            // cannot race a staff member's snapshot update.
            $currentGrants = nscAclLoadGrants($db, $tenantId, (string)$user['id'], true);
            $storedProjects = is_array($storedWorkspace['projects'] ?? null) ? $storedWorkspace['projects'] : [];
            $currentGrants = nscAclRestrictArchivedProjects($currentGrants, $storedProjects);
            if (!nscAclReadableProjectIds($currentGrants)) {
                throw new NscAclException('No server-side project read grants are assigned to this employee.', 403);
            }
            $writeWorkspace = nscAclMergeEmployeeWorkspace($storedWorkspace, $normalized, $currentGrants, $employeeAuditSummary);
        }

        nscMaterialAnnotateWorkspace($writeWorkspace);
        $projectsToSave = $writeWorkspace['projects'] ?? [];
        $projectIdsToSave = [];
        foreach ($projectsToSave as $project) {
            if (!is_array($project) || !isset($project['id']) || !is_scalar($project['id'])) {
                throw new NscAclException('Workspace project data is invalid.', 400);
            }
            $projectIdsToSave[(string)$project['id']] = true;
        }
        foreach (NSC_PROJECT_BOUND_KEYS as $key) {
            foreach (($writeWorkspace[$key] ?? []) as $record) {
                if (!is_array($record)) throw new NscAclException('Workspace record data is invalid.', 400);
                foreach (nscProjectIdsFromRecord($record) as $projectId) {
                    if (!isset($projectIdsToSave[$projectId])) {
                        throw new NscAclException('A record refers to a project outside this workspace.', 400);
                    }
                }
            }
        }

        if ($isOwner && $existing) {
            $previousWorkspace = json_decode((string)$existing['workspace_json'], true);
            if (!is_array($previousWorkspace) || !is_array($previousWorkspace['projects'] ?? null)) {
                throw new NscAclException('Saved project data is unreadable; no data was changed.', 500);
            }
            $previousProjectIds = [];
            foreach ($previousWorkspace['projects'] as $project) {
                if (!is_array($project) || !isset($project['id']) || !is_scalar($project['id'])) {
                    throw new NscAclException('Saved project data needs owner review before permissions can be cleaned up.', 500);
                }
                $previousProjectIds[(string)$project['id']] = true;
            }
            $removedProjectIds = array_diff(array_keys($previousProjectIds), array_keys($projectIdsToSave));
            if ($removedProjectIds) {
                $revokeProjectGrants = $db->prepare(
                    'DELETE FROM nsc_user_project_permissions WHERE tenant_id = :tid AND project_id = :pid'
                );
                foreach ($removedProjectIds as $removedProjectId) {
                    $revokeProjectGrants->execute(['tid' => $tenantId, 'pid' => $removedProjectId]);
                }
            }
        }

        $json = json_encode($writeWorkspace, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
        if ($json === false || strlen($json) > 15 * 1024 * 1024) {
            throw new NscAclException('Workspace data could not be encoded or exceeds its limit.', 400);
        }

        $newRevision = $currentRevision + 1;
        if ($existing) {
            $write = $db->prepare(
                'UPDATE nsc_workspace_snapshots SET workspace_json = :json, revision = :rev, updated_by = :uid WHERE tenant_id = :tid'
            );
        } else {
            $write = $db->prepare(
                'INSERT INTO nsc_workspace_snapshots (tenant_id, workspace_json, revision, updated_by) VALUES (:tid, :json, :rev, :uid)'
            );
        }
        $write->execute(['tid' => $tenantId, 'json' => $json, 'rev' => $newRevision, 'uid' => $user['id']]);

        if ($isOwner) {
            $settingsJson = json_encode(['appSettings' => $writeWorkspace['appSettings'] ?? []], JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
            $settings = $db->prepare(
                'INSERT INTO nsc_tenant_settings (tenant_id, default_language, settings_json, revision, updated_by)
                 VALUES (:tid, :lang, :settings, 1, :uid)
                 ON DUPLICATE KEY UPDATE default_language = VALUES(default_language), settings_json = VALUES(settings_json), revision = revision + 1, updated_by = VALUES(updated_by)'
            );
            $settings->execute(['tid' => $tenantId, 'lang' => $language, 'settings' => $settingsJson, 'uid' => $user['id']]);
        }
        if (!$isOwner) {
            nscAclWriteAudit(
                $db,
                $user,
                'update',
                'workspace',
                $tenantId,
                'Employee workspace accepted at revision ' . $newRevision . '; change groups=' . count($employeeAuditSummary) . '.'
            );
            foreach ($employeeAuditSummary as $bucket => $count) {
                if ($bucket === '__overflow__') {
                    nscAclWriteAudit(
                        $db,
                        $user,
                        'update',
                        'workspace',
                        $tenantId,
                        'Employee workspace audit summary capped; additional project-record changes=' . (int)$count . '.'
                    );
                    continue;
                }
                $parts = explode("\0", (string)$bucket);
                if (count($parts) !== 3 || !in_array($parts[0], ['create', 'update', 'delete'], true)) {
                    throw new RuntimeException('Invalid employee audit summary.');
                }
                nscAclWriteAudit(
                    $db,
                    $user,
                    $parts[0],
                    $parts[1],
                    $parts[2],
                    'Scoped employee workspace change in project ' . $parts[2] . '; affected record count=' . (int)$count . '.'
                );
            }
        }
        $db->commit();
    } catch (NscAclException $e) {
        if ($db->inTransaction()) $db->rollBack();
        if (!$isOwner && $e->httpStatus === 403) {
            nscAclLogDenied($db, $user, $tenantId, $e->getMessage());
        }
        jsonResponse(false, null, $e->getMessage(), $e->httpStatus);
    } catch (Throwable $e) {
        if ($db->inTransaction()) $db->rollBack();
        error_log('Workspace save failed: ' . $e->getMessage());
        jsonResponse(false, null, 'Workspace could not be saved.', 500);
    }

    if ($isOwner) {
        logAudit($db, $user['id'], $user['name'] ?? 'Owner', 'update', 'workspace', $tenantId, 'Workspace snapshot saved at revision ' . $newRevision);
    }
    jsonResponse(true, ['revision' => $newRevision]);
}

header('Allow: GET, PUT, OPTIONS');
jsonResponse(false, null, 'Method not allowed.', 405);
