<?php
/**
 * Lightweight unit tests for the access-control policy functions.
 * Run from the repository root with: php scripts/verify-access-control.php
 * The dummy environment values are never used to open a database connection.
 */
putenv('DB_NAME=nsc_policy_tests');
putenv('DB_USER=nsc_policy_tests');
putenv('DB_PASS=nsc_policy_tests');
putenv('APP_SECRET=local-policy-test-secret-32-chars-minimum');
putenv('APP_ENV=development');
require_once __DIR__ . '/../api/access_control.php';

function nscTestAssert(bool $condition, string $message): void {
    if (!$condition) throw new RuntimeException('FAILED: ' . $message);
}

function nscTestExpectAclException(callable $operation, int $expectedStatus, string $message): void {
    try {
        $operation();
    } catch (NscAclException $e) {
        nscTestAssert($e->httpStatus === $expectedStatus, $message . ' (wrong status)');
        return;
    }
    throw new RuntimeException('FAILED: ' . $message . ' (no denial)');
}

putenv('NSC_EMPLOYEE_ACCESS_ENABLED=false');
nscTestAssert(!nscEmployeeAccessEnabled(), 'Employee API access defaults to disabled.');
putenv('NSC_EMPLOYEE_ACCESS_ENABLED=true');
nscTestAssert(nscEmployeeAccessEnabled(), 'The server-side employee-access flag accepts an explicit true value.');
putenv('NSC_EMPLOYEE_ACCESS_ENABLED=false');
nscTestAssert(nscIsEmployeeAccount(['id' => 'employee-1', 'owner_admin_id' => 'owner-1', 'role' => 'accountant', 'is_master' => 0]), 'Linked non-master accounts are identified as employees.');
nscTestAssert(nscIsEmployeeAccount(['id' => 'employee-2', 'owner_admin_id' => null, 'role' => 'viewer', 'is_master' => 0]), 'Employee roles remain disabled even when their owner link is malformed.');
nscTestAssert(!nscIsEmployeeAccount(['id' => 'owner-1', 'owner_admin_id' => null, 'role' => 'admin', 'is_master' => 0]), 'Owner accounts are not identified as employees.');
nscTestAssert(!nscIsEmployeeAccount(['id' => 'master-1', 'owner_admin_id' => 'owner-1', 'is_master' => 1]), 'Master accounts are not identified as employees.');

$normalized = nscAclNormalizeGrantList([
    ['projectId' => 'project-a', 'module' => 'expenses', 'actions' => ['update', 'read']],
]);
nscTestAssert($normalized[0]['actions'] === ['read', 'update'], 'Actions are normalized in stable order.');
$reportGrant = nscAclNormalizeGrantList([
    ['projectId' => 'project-a', 'module' => 'expenses', 'actions' => ['report', 'read']],
]);
nscTestAssert($reportGrant[0]['actions'] === ['read', 'report'], 'Report is independently grantable and normalized after read.');
$dashboardReportGrant = nscAclNormalizeGrantList([
    ['projectId' => 'project-a', 'module' => 'dashboard', 'actions' => ['read', 'report']],
]);
nscTestAssert($dashboardReportGrant[0]['actions'] === ['read', 'report'], 'Dashboard allows read and report but not record mutation.');
$treasuryWriteGrant = nscAclNormalizeGrantList([
    ['projectId' => 'project-a', 'module' => 'treasury', 'actions' => ['read', 'create', 'update']],
]);
nscTestAssert($treasuryWriteGrant[0]['actions'] === ['read', 'create', 'update'], 'Owners can explicitly grant employee treasury actions.');
nscTestExpectAclException(
    static function () { nscAclNormalizeGrantList([['projectId' => 'project-a', 'module' => 'expenses', 'actions' => ['report']]]); },
    400,
    'Report grants without read must be rejected.'
);
nscTestExpectAclException(
    static function () { nscAclNormalizeGrantList([['projectId' => 'project-a', 'module' => 'expenses', 'actions' => ['read', 'read']]]); },
    400,
    'Duplicate actions must be rejected.'
);
nscTestExpectAclException(
    static function () { nscAclNormalizeGrantList([['projectId' => 'project-a', 'module' => 'dashboard', 'actions' => ['read', 'create']]]); },
    400,
    'Dashboard record mutations must be rejected.'
);
nscTestExpectAclException(
    static function () { nscAclNormalizeGrantList([['projectId' => 'project-a', 'module' => 'expenses', 'actions' => ['create']]]); },
    400,
    'Write grants without read must be rejected.'
);
nscTestExpectAclException(
    static function () { nscAclNormalizeGrantList([['projectId' => 'project-a', 'module' => 'settings', 'actions' => ['read']]]); },
    400,
    'Owner-only settings must not be grantable.'
);
nscTestExpectAclException(
    static function () { nscAclNormalizeGrantList([['projectId' => 'project-a', 'module' => 'projects', 'actions' => ['read', 'update']]]); },
    400,
    'Project creation and editing must remain owner-only.'
);
$projectReportGrant = nscAclNormalizeGrantList([
    ['projectId' => 'project-a', 'module' => 'projects', 'actions' => ['read', 'report']],
]);
nscTestAssert($projectReportGrant[0]['actions'] === ['read', 'report'], 'Project metadata can be explicitly reported without allowing project edits.');
nscTestExpectAclException(
    static function () { nscAclNormalizeGrantList([['projectId' => 'project-a', 'module' => 'expenses', 'actions' => ['read', 'approve']]]); },
    400,
    'Unknown actions must be rejected.'
);

$ownerWorkspace = [
    'projects' => [
        ['id' => 'project-a', 'name' => 'A', 'status' => 'active', 'contractValue' => 1000],
        ['id' => 'project-b', 'name' => 'B', 'status' => 'active', 'contractValue' => 2000],
        ['id' => 'project-c', 'name' => 'C', 'status' => 'active', 'contractValue' => 3000],
    ],
    'currentProjectId' => 'project-c',
    'language' => 'en',
    'appSettings' => ['companyName' => 'Owner Company'],
    'expenses' => [
        ['id' => 'expense-a', 'projectId' => 'project-a', 'amount' => 10],
        ['id' => 'expense-b', 'projectId' => 'project-b', 'amount' => 20],
        ['id' => 'expense-c', 'projectId' => 'project-c', 'amount' => 30],
    ],
    'suppliers' => [
        ['id' => 'shared-supplier', 'name' => 'Shared supplier'],
    ],
];
$limitedGrants = [
    'project-a' => ['expenses' => ['read', 'update', 'create']],
];
nscTestAssert(!nscAclCan([], 'project-a', 'expenses', 'read'), 'No grant denies even read access by default.');
nscTestAssert(!nscAclCan($limitedGrants, 'project-b', 'expenses', 'read'), 'Grants do not leak to another project.');
nscTestAssert(!nscAclCan($limitedGrants, 'project-a', 'income', 'read'), 'Grants do not leak to another module.');
nscTestExpectAclException(
    static function () { nscAclFilterWorkspace(['projects' => 'corrupt'], []); },
    500,
    'Malformed stored project data fails closed.'
);
$filtered = nscAclFilterWorkspace($ownerWorkspace, $limitedGrants);
nscTestAssert(count($filtered['projects']) === 1 && $filtered['projects'][0]['id'] === 'project-a', 'Only projects with read grants are listed.');
nscTestAssert(!array_key_exists('contractValue', $filtered['projects'][0]), 'Project summaries hide fields without the projects/read grant.');
nscTestAssert(count($filtered['expenses']) === 1 && $filtered['expenses'][0]['id'] === 'expense-a', 'Workspace collections are filtered by project and module.');
nscTestAssert($filtered['suppliers'] === [], 'Unscoped shared records are hidden from employees.');
nscTestAssert(!array_key_exists('appSettings', $filtered), 'Tenant settings are omitted from employee snapshots.');
nscTestAssert($filtered['currentProjectId'] === 'project-a', 'The current project is reset to an authorized project.');

$employeeInput = [
    'projects' => [['id' => 'project-a', 'name' => 'A']],
    'currentProjectId' => 'project-a',
    'language' => 'ps',
    'appSettings' => ['companyName' => 'Attempted change'],
    'expenses' => [['id' => 'expense-a', 'projectId' => 'project-a', 'amount' => 11]],
];
$employeeAuditSummary = [];
$merged = nscAclMergeEmployeeWorkspace($ownerWorkspace, $employeeInput, $limitedGrants, $employeeAuditSummary);
nscTestAssert($merged['expenses'][0]['amount'] === 11, 'An authorized update is merged.');
nscTestAssert(count($employeeAuditSummary) === 1 && reset($employeeAuditSummary) === 1, 'Authorized mutations are summarized for audit logging.');
$reportActionGrants = ['project-a' => ['expenses' => ['read', 'report']]];
nscAclRequireProjectAction($reportActionGrants, 'project-a', 'expenses', 'report');
nscTestAssert(!nscAclCan($reportActionGrants, 'project-a', 'expenses', 'create'), 'Report permission does not grant record creation.');
nscTestExpectAclException(
    static function () use ($limitedGrants) { nscAclRequireProjectAction($limitedGrants, 'project-a', 'expenses', 'report'); },
    403,
    'Read grants without report permission cannot run report actions.'
);
nscTestAssert($merged['expenses'][1]['id'] === 'expense-b' && $merged['expenses'][2]['id'] === 'expense-c', 'Unassigned project records are preserved.');
nscTestAssert($merged['projects'] === $ownerWorkspace['projects'], 'Employee project-list edits are ignored.');
nscTestAssert($merged['appSettings'] === $ownerWorkspace['appSettings'], 'Employee tenant-setting edits are ignored.');
nscTestAssert($merged['language'] === 'en', 'Employee changes cannot overwrite the owner language default.');

nscTestExpectAclException(
    static function () use ($ownerWorkspace, $limitedGrants) {
        nscAclMergeEmployeeWorkspace($ownerWorkspace, [
            'expenses' => [
                ['id' => 'expense-a', 'projectId' => 'project-a', 'amount' => 10],
                ['id' => 'expense-b', 'projectId' => 'project-b', 'amount' => 20],
            ],
        ], $limitedGrants);
    },
    403,
    'A hidden project record cannot be injected by ID.'
);

$readOnlyGrants = ['project-a' => ['expenses' => ['read']]];
nscTestExpectAclException(
    static function () use ($ownerWorkspace, $readOnlyGrants) {
        nscAclMergeEmployeeWorkspace($ownerWorkspace, [
            'expenses' => [['id' => 'expense-a', 'projectId' => 'project-a', 'amount' => 99]],
        ], $readOnlyGrants);
    },
    403,
    'Read-only grants cannot update records.'
);
nscTestExpectAclException(
    static function () use ($ownerWorkspace, $readOnlyGrants) {
        nscAclMergeEmployeeWorkspace($ownerWorkspace, ['expenses' => []], $readOnlyGrants);
    },
    403,
    'Read-only grants cannot delete records.'
);
nscTestExpectAclException(
    static function () use ($ownerWorkspace, $readOnlyGrants) {
        nscAclMergeEmployeeWorkspace($ownerWorkspace, [
            'expenses' => [
                ['id' => 'expense-a', 'projectId' => 'project-a', 'amount' => 10],
                ['id' => 'new-expense', 'projectId' => 'project-a', 'amount' => 12],
            ],
        ], $readOnlyGrants);
    },
    403,
    'Read-only grants cannot create records.'
);
$created = nscAclMergeEmployeeWorkspace($ownerWorkspace, [
    'expenses' => [
        ['id' => 'expense-a', 'projectId' => 'project-a', 'amount' => 10],
        ['id' => 'new-expense', 'projectId' => 'project-a', 'amount' => 12],
    ],
], $limitedGrants);
nscTestAssert(count($created['expenses']) === 4 && $created['expenses'][1]['id'] === 'expense-b', 'An authorized create does not replace hidden records.');

$moveWorkspace = [
    'expenses' => [
        ['id' => 'expense-a', 'projectId' => 'project-b', 'amount' => 11],
        ['id' => 'expense-b', 'projectId' => 'project-b', 'amount' => 20],
    ],
];
$projectMoveReadOnlyTarget = [
    'project-a' => ['expenses' => ['read', 'update']],
    'project-b' => ['expenses' => ['read']],
];
nscTestExpectAclException(
    static function () use ($ownerWorkspace, $moveWorkspace, $projectMoveReadOnlyTarget) {
        nscAclMergeEmployeeWorkspace($ownerWorkspace, $moveWorkspace, $projectMoveReadOnlyTarget);
    },
    403,
    'Moving an existing record requires update rights in both source and destination projects.'
);
$projectMoveGrants = [
    'project-a' => ['expenses' => ['read', 'update']],
    'project-b' => ['expenses' => ['read', 'update']],
];
$moved = nscAclMergeEmployeeWorkspace($ownerWorkspace, $moveWorkspace, $projectMoveGrants);
nscTestAssert($moved['expenses'][0]['projectId'] === 'project-b', 'A record can move only when both projects grant update.');

$deleteGrants = ['project-a' => ['expenses' => ['read', 'delete']]];
$afterDelete = nscAclMergeEmployeeWorkspace($ownerWorkspace, ['expenses' => []], $deleteGrants);
nscTestAssert(count($afterDelete['expenses']) === 2 && $afterDelete['expenses'][0]['id'] === 'expense-b', 'An authorized delete removes only the assigned-project record.');

$transfer = ['id' => 'transfer-1', 'fromProjectId' => 'project-a', 'toProjectId' => 'project-b'];
nscTestAssert(!nscAclCanReadRecord($limitedGrants, 'transfers', $transfer), 'Cross-project records require read permission in both projects.');
$crossProjectGrants = [
    'project-a' => ['transfers' => ['read']],
    'project-b' => ['transfers' => ['read']],
];
nscTestAssert(nscAclCanReadRecord($crossProjectGrants, 'transfers', $transfer), 'Cross-project reads pass only when both project grants exist.');
$transferAuditSummary = [];
nscAclAccumulateAuditChange(
    $transferAuditSummary,
    'update',
    'transfers',
    ['fromProjectId' => 'project-a', 'toProjectId' => 'project-c'],
    ['fromProjectId' => 'project-a', 'toProjectId' => 'project-b']
);
nscTestAssert(count($transferAuditSummary) === 3, 'Cross-project transfer audits cover source, old destination, and new destination projects.');

$archivedGrants = nscAclRestrictArchivedProjects([
    'project-a' => ['expenses' => ['read', 'update', 'report']],
], [
    ['id' => 'project-a', 'status' => 'archived'],
]);
nscTestAssert(nscAclCan($archivedGrants, 'project-a', 'expenses', 'read'), 'Archived projects retain explicitly granted historical reads.');
nscTestAssert(nscAclCan($archivedGrants, 'project-a', 'expenses', 'report'), 'Archived projects retain explicitly granted historical report access.');
nscTestAssert(!nscAclCan($archivedGrants, 'project-a', 'expenses', 'update'), 'Archived projects lose employee write actions.');

fwrite(STDOUT, "Access-control policy checks passed.\n");
