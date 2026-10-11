<?php
/**
 * Disposable-database HTTP integration checks for the PHP/MySQL access-control path.
 *
 * SAFETY: this test refuses to run unless the caller explicitly marks a disposable
 * database named nsc_ci. It creates synthetic tenants/users and leaves them in that
 * disposable database; never point it at a production or shared staging database.
 */
declare(strict_types=1);

if (getenv('NSC_INTEGRATION_TEST') !== '1'
    || getenv('APP_ENV') !== 'test'
    || getenv('DB_NAME') !== 'nsc_ci'
    || !in_array((string)getenv('DB_HOST'), ['127.0.0.1', 'localhost'], true)) {
    fwrite(STDERR, "Refusing to run: use the disposable local nsc_ci database with NSC_INTEGRATION_TEST=1 and APP_ENV=test.\n");
    exit(2);
}
if (!extension_loaded('pdo_mysql') || !extension_loaded('curl')) {
    fwrite(STDERR, "PHP extensions pdo_mysql and curl are required for the integration test.\n");
    exit(2);
}

require_once __DIR__ . '/../api/access_control.php';

function nscIntegrationAssert(bool $condition, string $message): void {
    if (!$condition) {
        throw new RuntimeException('FAILED: ' . $message);
    }
    fwrite(STDOUT, "  PASS  {$message}\n");
}

function nscIntegrationDatabase(): PDO {
    $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', DB_HOST, DB_PORT, DB_NAME);
    try {
        return new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci',
        ]);
    } catch (PDOException $error) {
        throw new RuntimeException('Could not connect to the disposable integration database.', 0, $error);
    }
}

function nscIntegrationInsertUser(PDO $db, string $id, ?string $ownerId, string $role, string $suffix): void {
    $stmt = $db->prepare(
        'INSERT INTO users (id, owner_admin_id, name, username, email, password_hash, role, is_locked, is_master)
         VALUES (:id, :owner, :name, :username, :email, :password_hash, :role, 0, 0)'
    );
    $stmt->execute([
        'id' => $id,
        'owner' => $ownerId,
        'name' => 'CI ' . $suffix,
        'username' => 'ci_' . $suffix,
        'email' => 'ci-' . $suffix . '@example.test',
        'password_hash' => password_hash('integration-only-placeholder', PASSWORD_DEFAULT),
        'role' => $role,
    ]);
}

function nscIntegrationNewSession(PDO $db, string $userId): array {
    $session = bin2hex(random_bytes(32));
    $csrf = bin2hex(random_bytes(32));
    $stmt = $db->prepare(
        'INSERT INTO nsc_auth_sessions (session_hash, csrf_hash, user_id, expires_at)
         VALUES (:session_hash, :csrf_hash, :user_id, :expires_at)'
    );
    $stmt->execute([
        'session_hash' => hash('sha256', $session),
        'csrf_hash' => hash('sha256', $csrf),
        'user_id' => $userId,
        'expires_at' => gmdate('Y-m-d H:i:s', time() + 3600),
    ]);
    return ['session' => $session, 'csrf' => $csrf];
}

function nscIntegrationRequest(string $baseUrl, string $method, string $path, ?array $session = null, ?array $payload = null): array {
    $headers = ['Accept: application/json'];
    if ($payload !== null) $headers[] = 'Content-Type: application/json';
    if ($session !== null && $method !== 'GET') $headers[] = 'X-CSRF-Token: ' . $session['csrf'];
    $curl = curl_init($baseUrl . $path);
    curl_setopt_array($curl, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_TIMEOUT => 20,
        CURLOPT_FRESH_CONNECT => true,
        CURLOPT_FORBID_REUSE => true,
    ]);
    if ($session !== null) {
        curl_setopt($curl, CURLOPT_COOKIE, 'nsc_session=' . $session['session'] . '; nsc_csrf=' . $session['csrf']);
    }
    if ($payload !== null) {
        $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
        curl_setopt($curl, CURLOPT_POSTFIELDS, $json);
    }
    $body = curl_exec($curl);
    $error = curl_error($curl);
    $status = (int)curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);
    if (!is_string($body)) throw new RuntimeException('HTTP request failed: ' . $error);
    $decoded = json_decode($body, true);
    return ['status' => $status, 'body' => $decoded, 'raw' => $body];
}

function nscIntegrationConcurrentRequests(array $requests): array {
    $multi = curl_multi_init();
    $handles = [];
    foreach ($requests as $index => $request) {
        $headers = ['Accept: application/json', 'Content-Type: application/json'];
        if ($request['session'] !== null) $headers[] = 'X-CSRF-Token: ' . $request['session']['csrf'];
        $curl = curl_init($request['url']);
        curl_setopt_array($curl, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => $request['method'],
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_COOKIE => 'nsc_session=' . $request['session']['session'] . '; nsc_csrf=' . $request['session']['csrf'],
            CURLOPT_POSTFIELDS => json_encode($request['payload'], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
            CURLOPT_TIMEOUT => 30,
            CURLOPT_FRESH_CONNECT => true,
            CURLOPT_FORBID_REUSE => true,
        ]);
        curl_multi_add_handle($multi, $curl);
        $handles[$index] = $curl;
    }
    do {
        $multiStatus = curl_multi_exec($multi, $running);
        if ($running > 0) {
            $selected = curl_multi_select($multi, 1.0);
            if ($selected === -1) usleep(10000);
        }
    } while ($running > 0 && $multiStatus === CURLM_OK);

    $responses = [];
    foreach ($handles as $index => $curl) {
        $body = curl_multi_getcontent($curl);
        if (!is_string($body)) throw new RuntimeException('Concurrent HTTP request failed: ' . curl_error($curl));
        $responses[$index] = [
            'status' => (int)curl_getinfo($curl, CURLINFO_HTTP_CODE),
            'body' => json_decode($body, true),
            'raw' => $body,
        ];
        curl_multi_remove_handle($multi, $curl);
        curl_close($curl);
    }
    curl_multi_close($multi);
    ksort($responses);
    return array_values($responses);
}

function nscIntegrationReservePort(): int {
    $socket = stream_socket_server('tcp://127.0.0.1:0', $errno, $error);
    if (!is_resource($socket)) throw new RuntimeException('Could not reserve a local PHP server port: ' . $error);
    $address = stream_socket_get_name($socket, false);
    fclose($socket);
    if (!is_string($address) || !str_contains($address, ':')) throw new RuntimeException('Could not read the reserved port.');
    return (int)substr(strrchr($address, ':'), 1);
}

function nscIntegrationStartServer(bool $employeeAccessEnabled): array {
    $port = nscIntegrationReservePort();
    $logPath = tempnam(sys_get_temp_dir(), 'nsc-php-api-');
    if (!is_string($logPath)) throw new RuntimeException('Could not create a temporary PHP server log.');
    $environment = getenv();
    if (!is_array($environment)) $environment = [];
    $environment['NSC_EMPLOYEE_ACCESS_ENABLED'] = $employeeAccessEnabled ? 'true' : 'false';
    // Multiple CLI workers let the race tests submit genuinely overlapping HTTP requests.
    $environment['PHP_CLI_SERVER_WORKERS'] = '4';
    $command = [PHP_BINARY, '-S', '127.0.0.1:' . $port, '-t', __DIR__ . '/../api'];
    $descriptors = [
        0 => ['file', '/dev/null', 'r'],
        1 => ['file', $logPath, 'a'],
        2 => ['file', $logPath, 'a'],
    ];
    $process = proc_open($command, $descriptors, $pipes, dirname(__DIR__), $environment);
    if (!is_resource($process)) throw new RuntimeException('Could not start the PHP API test server.');
    $server = ['process' => $process, 'port' => $port, 'baseUrl' => 'http://127.0.0.1:' . $port, 'logPath' => $logPath];

    for ($attempt = 0; $attempt < 80; $attempt++) {
        try {
            $probe = nscIntegrationRequest($server['baseUrl'], 'GET', '/permissions.php');
            if ($probe['status'] === 401) return $server;
        } catch (Throwable $ignored) {
            // The listener may not be ready yet.
        }
        usleep(100000);
    }
    $log = is_file($logPath) ? (string)file_get_contents($logPath) : '';
    nscIntegrationStopServer($server);
    throw new RuntimeException('PHP API server did not become ready. ' . $log);
}

function nscIntegrationStopServer(?array &$server): void {
    if ($server === null) return;
    if (isset($server['process']) && is_resource($server['process'])) {
        proc_terminate($server['process']);
        proc_close($server['process']);
    }
    $server = null;
}

function nscIntegrationExpect(array $response, int $status, string $message): void {
    $actual = (int)($response['status'] ?? 0);
    if ($actual !== $status) {
        $body = is_string($response['raw'] ?? null) ? $response['raw'] : json_encode($response['body'] ?? null);
        throw new RuntimeException("FAILED: {$message}; expected HTTP {$status}, got {$actual}: {$body}");
    }
    nscIntegrationAssert(true, $message . ' (HTTP ' . $status . ')');
}

function nscIntegrationStoredWorkspace(PDO $db, string $tenantId): array {
    $stmt = $db->prepare('SELECT workspace_json, revision FROM nsc_workspace_snapshots WHERE tenant_id = :tenant_id');
    $stmt->execute(['tenant_id' => $tenantId]);
    $row = $stmt->fetch();
    if (!$row) throw new RuntimeException('Workspace snapshot disappeared during the test.');
    $workspace = json_decode((string)$row['workspace_json'], true);
    if (!is_array($workspace)) throw new RuntimeException('Workspace snapshot JSON became unreadable.');
    return ['workspace' => $workspace, 'revision' => (int)$row['revision']];
}

$server = null;
$db = null;
$serverLogs = [];
$failed = false;
try {
    fwrite(STDOUT, "Running PHP/MySQL access-control HTTP integration checks against disposable nsc_ci.\n");
    $db = nscIntegrationDatabase();
    $run = bin2hex(random_bytes(5));
    $ownerA = 'ci-owner-a-' . $run;
    $employeeA = 'ci-employee-a-' . $run;
    $ownerB = 'ci-owner-b-' . $run;
    $employeeB = 'ci-employee-b-' . $run;

    $db->beginTransaction();
    nscIntegrationInsertUser($db, $ownerA, null, 'admin', 'owner-a-' . $run);
    nscIntegrationInsertUser($db, $employeeA, $ownerA, 'accountant', 'employee-a-' . $run);
    nscIntegrationInsertUser($db, $ownerB, null, 'admin', 'owner-b-' . $run);
    nscIntegrationInsertUser($db, $employeeB, $ownerB, 'viewer', 'employee-b-' . $run);

    $ownerWorkspace = [
        'projects' => [
            ['id' => 'project-a', 'name' => 'Project A', 'projectCode' => 'A', 'status' => 'active', 'contractValue' => 1000],
            ['id' => 'project-b', 'name' => 'Project B', 'projectCode' => 'B', 'status' => 'active', 'contractValue' => 2000],
            ['id' => 'project-archived', 'name' => 'Archived Project', 'status' => 'archived', 'contractValue' => 3000],
        ],
        'currentProjectId' => 'project-b',
        'language' => 'en',
        'appSettings' => ['companyName' => 'Owner-only test setting'],
        'expenses' => [
            ['id' => 'expense-a', 'projectId' => 'project-a', 'amount' => 10, 'description' => 'Visible expense'],
            ['id' => 'expense-b', 'projectId' => 'project-b', 'amount' => 20, 'description' => 'Hidden expense'],
            ['id' => 'expense-archived', 'projectId' => 'project-archived', 'amount' => 30, 'description' => 'Archived expense'],
        ],
        'payments' => [
            ['id' => 'payment-a', 'projectId' => 'project-a', 'amountUSD' => 5, 'description' => 'Visible payment'],
            ['id' => 'payment-b', 'projectId' => 'project-b', 'amountUSD' => 15, 'description' => 'Hidden payment'],
        ],
        'steelRecords' => [
            ['id' => 'steel-a', 'projectId' => 'project-a', 'totalKg' => 100],
            ['id' => 'steel-b', 'projectId' => 'project-b', 'totalKg' => 900],
        ],
        'concreteRecords' => [
            ['id' => 'concrete-a', 'projectId' => 'project-a', 'volumeM3' => 2],
            ['id' => 'concrete-b', 'projectId' => 'project-b', 'volumeM3' => 9],
        ],
        'contractors' => [
            ['id' => 'contractor-a', 'projectId' => 'project-a', 'name' => 'Visible contractor'],
            ['id' => 'contractor-b', 'projectId' => 'project-b', 'name' => 'Hidden contractor'],
        ],
        'apartments' => [
            ['id' => 'apartment-a', 'projectId' => 'project-a', 'totalPriceUSD' => 500],
            ['id' => 'apartment-b', 'projectId' => 'project-b', 'totalPriceUSD' => 900],
        ],
        'suppliers' => [['id' => 'shared-supplier', 'name' => 'Owner-only shared supplier']],
    ];
    $snapshot = $db->prepare(
        'INSERT INTO nsc_workspace_snapshots (tenant_id, workspace_json, revision, updated_by)
         VALUES (:tenant_id, :workspace_json, 1, :updated_by)'
    );
    $snapshot->execute([
        'tenant_id' => $ownerA,
        'workspace_json' => json_encode($ownerWorkspace, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
        'updated_by' => $ownerA,
    ]);
    $foreignTenantWorkspace = [
        'projects' => [['id' => 'tenant-b-project', 'name' => 'Tenant B Confidential', 'status' => 'active']],
        'expenses' => [['id' => 'tenant-b-expense', 'projectId' => 'tenant-b-project', 'amount' => 99000, 'description' => 'Cross-tenant secret']],
    ];
    $snapshot->execute([
        'tenant_id' => $ownerB,
        'workspace_json' => json_encode($foreignTenantWorkspace, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
        'updated_by' => $ownerB,
    ]);

    $ownerSession = nscIntegrationNewSession($db, $ownerA);
    $ownerBSession = nscIntegrationNewSession($db, $ownerB);
    $disabledEmployeeSession = nscIntegrationNewSession($db, $employeeA);
    $db->commit();

    // Owner grant-management route: success, malformed-action rejection, and cross-tenant denial.
    $server = nscIntegrationStartServer(false);
    $serverLogs[] = $server['logPath'];

    // Owner-only lifecycle operations run while employee sign-in is still disabled.
    $lifecyclePassword = 'ci-lifecycle-password-2026';
    $lifecycleCreatePayload = [
        'name' => 'Lifecycle CI Employee',
        'username' => 'ci_lifecycle_' . $run,
        'email' => 'ci-lifecycle-' . $run . '@example.test',
        'phone' => '+93 700 000 001',
        'password' => $lifecyclePassword,
        'role' => 'procurement',
    ];
    $createdEmployeeResponse = nscIntegrationRequest(
        $server['baseUrl'],
        'POST',
        '/employees.php?action=create',
        $ownerSession,
        $lifecycleCreatePayload
    );
    nscIntegrationExpect($createdEmployeeResponse, 200, 'Owner can create a server-managed employee account while sign-in is disabled');
    $createdEmployee = $createdEmployeeResponse['body']['data']['employee'] ?? null;
    nscIntegrationAssert(is_array($createdEmployee), 'Employee creation returns a public profile');
    $lifecycleEmployeeId = (string)($createdEmployee['id'] ?? '');
    nscIntegrationAssert(
        $lifecycleEmployeeId !== ''
            && ($createdEmployee['isLocked'] ?? false) === true
            && ($createdEmployee['role'] ?? '') === 'procurement',
        'New employee profile is assigned the requested role and starts locked'
    );
    nscIntegrationAssert(
        !array_key_exists('password', $createdEmployee) && !array_key_exists('password_hash', $createdEmployee),
        'Employee creation response never exposes the password or password hash'
    );
    $employeeAccessList = nscIntegrationRequest($server['baseUrl'], 'GET', '/permissions.php?action=employees', $ownerSession);
    nscIntegrationExpect($employeeAccessList, 200, 'Owner can retrieve the employee account and grant-management list');
    $listedLifecycleAccount = null;
    foreach ($employeeAccessList['body']['data']['employees'] ?? [] as $listedEmployee) {
        if (($listedEmployee['id'] ?? '') === $lifecycleEmployeeId) $listedLifecycleAccount = $listedEmployee;
    }
    nscIntegrationAssert(
        is_array($listedLifecycleAccount)
            && ($listedLifecycleAccount['isLocked'] ?? false) === true
            && ($listedLifecycleAccount['grants'] ?? null) === [],
        'Access-management listing exposes the new account as locked with no implicit grants'
    );
    $storedLifecycleEmployee = $db->prepare(
        'SELECT owner_admin_id, password_hash, is_locked FROM users WHERE id = :employee_id'
    );
    $storedLifecycleEmployee->execute(['employee_id' => $lifecycleEmployeeId]);
    $storedLifecycleAccount = $storedLifecycleEmployee->fetch();
    nscIntegrationAssert(
        is_array($storedLifecycleAccount)
            && (string)$storedLifecycleAccount['owner_admin_id'] === $ownerA
            && (int)$storedLifecycleAccount['is_locked'] === 1
            && password_verify($lifecyclePassword, (string)$storedLifecycleAccount['password_hash'])
            && !hash_equals($lifecyclePassword, (string)$storedLifecycleAccount['password_hash']),
        'Employee credentials are password-hashed and the account is tenant-bound and locked in MySQL'
    );

    $shortPasswordPayload = $lifecycleCreatePayload;
    $shortPasswordPayload['username'] = 'ci_short_' . $run;
    $shortPasswordPayload['email'] = 'ci-short-' . $run . '@example.test';
    $shortPasswordPayload['password'] = 'too-short';
    nscIntegrationExpect(
        nscIntegrationRequest($server['baseUrl'], 'POST', '/employees.php?action=create', $ownerSession, $shortPasswordPayload),
        400,
        'Employee creation rejects passwords below the server minimum'
    );
    $shortAccountCount = $db->prepare('SELECT COUNT(*) FROM users WHERE username = :username');
    $shortAccountCount->execute(['username' => $shortPasswordPayload['username']]);
    nscIntegrationAssert((int)$shortAccountCount->fetchColumn() === 0, 'Rejected employee creation makes no partial database account');

    nscIntegrationExpect(
        nscIntegrationRequest(
            $server['baseUrl'],
            'POST',
            '/employees.php?action=update',
            $ownerBSession,
            ['employeeId' => $lifecycleEmployeeId, 'name' => 'Cross-tenant overwrite']
        ),
        404,
        'A different tenant owner cannot update the employee account'
    );
    nscIntegrationExpect(
        nscIntegrationRequest(
            $server['baseUrl'],
            'POST',
            '/employees.php?action=update',
            $ownerSession,
            ['employeeId' => $lifecycleEmployeeId, 'isLocked' => false]
        ),
        400,
        'Employee profile updates reject client-supplied lock and ownership fields'
    );
    $unlockWithoutGrant = nscIntegrationRequest(
        $server['baseUrl'],
        'POST',
        '/employees.php?action=set_lock',
        $ownerSession,
        ['employeeId' => $lifecycleEmployeeId, 'isLocked' => false]
    );
    nscIntegrationExpect($unlockWithoutGrant, 409, 'Owner cannot unlock a new employee before granting project read access');
    $stillLocked = $db->prepare('SELECT is_locked FROM users WHERE id = :employee_id');
    $stillLocked->execute(['employee_id' => $lifecycleEmployeeId]);
    nscIntegrationAssert((int)$stillLocked->fetchColumn() === 1, 'Rejected unlock leaves the employee locked');

    $lifecycleGrant = [
        'userId' => $lifecycleEmployeeId,
        'grants' => [['projectId' => 'project-a', 'module' => 'expenses', 'actions' => ['read']]],
    ];
    nscIntegrationExpect(
        nscIntegrationRequest($server['baseUrl'], 'POST', '/permissions.php?action=save_grants', $ownerSession, $lifecycleGrant),
        200,
        'Owner can assign a tenant project read grant to a newly provisioned employee'
    );
    nscIntegrationExpect(
        nscIntegrationRequest(
            $server['baseUrl'],
            'POST',
            '/employees.php?action=set_lock',
            $ownerSession,
            ['employeeId' => $lifecycleEmployeeId, 'isLocked' => false]
        ),
        200,
        'Owner can unlock an employee after a project/module read grant is saved'
    );
    $unlockedLifecycleAccount = $db->prepare('SELECT is_locked FROM users WHERE id = :employee_id');
    $unlockedLifecycleAccount->execute(['employee_id' => $lifecycleEmployeeId]);
    nscIntegrationAssert((int)$unlockedLifecycleAccount->fetchColumn() === 0, 'Successful owner unlock is persisted in MySQL');

    $disabledLifecycleLogin = nscIntegrationRequest(
        $server['baseUrl'],
        'POST',
        '/auth.php?action=login',
        null,
        ['username' => $lifecycleCreatePayload['username'], 'password' => $lifecyclePassword]
    );
    nscIntegrationExpect($disabledLifecycleLogin, 403, 'Provisioned employee cannot sign in while the production-default feature flag is false');

    $profileChangeSession = nscIntegrationNewSession($db, $lifecycleEmployeeId);
    $updatedPassword = 'ci-lifecycle-password-updated-2026';
    $profileUpdateResponse = nscIntegrationRequest(
        $server['baseUrl'],
        'POST',
        '/employees.php?action=update',
        $ownerSession,
        [
            'employeeId' => $lifecycleEmployeeId,
            'name' => 'Lifecycle CI Employee Updated',
            'email' => 'ci-lifecycle-updated-' . $run . '@example.test',
            'phone' => '+93 700 000 002',
            'password' => $updatedPassword,
            'role' => 'project_manager',
        ]
    );
    nscIntegrationExpect($profileUpdateResponse, 200, 'Owner can update employee profile, role, and password');
    $updatedLifecycleProfile = $profileUpdateResponse['body']['data']['employee'] ?? [];
    nscIntegrationAssert(
        ($updatedLifecycleProfile['name'] ?? '') === 'Lifecycle CI Employee Updated'
            && ($updatedLifecycleProfile['role'] ?? '') === 'project_manager'
            && !array_key_exists('password', $updatedLifecycleProfile)
            && !array_key_exists('password_hash', $updatedLifecycleProfile),
        'Profile update returns only the updated public employee fields'
    );
    $revokedOnProfileChange = $db->prepare(
        'SELECT revoked_at FROM nsc_auth_sessions WHERE session_hash = :session_hash'
    );
    $revokedOnProfileChange->execute(['session_hash' => hash('sha256', $profileChangeSession['session'])]);
    $profileRevokedAt = $revokedOnProfileChange->fetchColumn();
    nscIntegrationAssert($profileRevokedAt !== false && $profileRevokedAt !== null, 'Password, email, or role changes revoke existing employee sessions');
    $updatedPasswordRow = $db->prepare('SELECT password_hash, role, email FROM users WHERE id = :employee_id');
    $updatedPasswordRow->execute(['employee_id' => $lifecycleEmployeeId]);
    $updatedStoredAccount = $updatedPasswordRow->fetch();
    nscIntegrationAssert(
        is_array($updatedStoredAccount)
            && password_verify($updatedPassword, (string)$updatedStoredAccount['password_hash'])
            && !password_verify($lifecyclePassword, (string)$updatedStoredAccount['password_hash'])
            && (string)$updatedStoredAccount['role'] === 'project_manager',
        'Profile update stores only the replacement password hash and the new role'
    );

    $lockChangeSession = nscIntegrationNewSession($db, $lifecycleEmployeeId);
    nscIntegrationExpect(
        nscIntegrationRequest(
            $server['baseUrl'],
            'POST',
            '/employees.php?action=set_lock',
            $ownerSession,
            ['employeeId' => $lifecycleEmployeeId, 'isLocked' => true]
        ),
        200,
        'Owner can lock an employee account'
    );
    $revokedOnLock = $db->prepare('SELECT revoked_at FROM nsc_auth_sessions WHERE session_hash = :session_hash');
    $revokedOnLock->execute(['session_hash' => hash('sha256', $lockChangeSession['session'])]);
    $lockRevokedAt = $revokedOnLock->fetchColumn();
    nscIntegrationAssert($lockRevokedAt !== false && $lockRevokedAt !== null, 'Locking an employee revokes all active sessions');

    nscIntegrationExpect(
        nscIntegrationRequest(
            $server['baseUrl'],
            'POST',
            '/permissions.php?action=save_grants',
            $ownerSession,
            ['userId' => $lifecycleEmployeeId, 'grants' => []]
        ),
        200,
        'Owner can revoke all grants before deleting the employee'
    );
    nscIntegrationExpect(
        nscIntegrationRequest(
            $server['baseUrl'],
            'POST',
            '/employees.php?action=set_lock',
            $ownerSession,
            ['employeeId' => $lifecycleEmployeeId, 'isLocked' => false]
        ),
        409,
        'Owner cannot unlock an employee after all project read grants are revoked'
    );
    $stillLockedAfterRevoke = $db->prepare('SELECT is_locked FROM users WHERE id = :employee_id');
    $stillLockedAfterRevoke->execute(['employee_id' => $lifecycleEmployeeId]);
    nscIntegrationAssert((int)$stillLockedAfterRevoke->fetchColumn() === 1, 'Unlock without a read grant leaves the account locked');

    nscIntegrationExpect(
        nscIntegrationRequest($server['baseUrl'], 'POST', '/permissions.php?action=save_grants', $ownerSession, $lifecycleGrant),
        200,
        'Owner can restore a read grant for lifecycle deletion verification'
    );
    $db->prepare('UPDATE nsc_workspace_snapshots SET updated_by = :employee_id WHERE tenant_id = :tenant_id')
        ->execute(['employee_id' => $lifecycleEmployeeId, 'tenant_id' => $ownerA]);
    $db->prepare(
        'INSERT INTO nsc_tenant_settings (tenant_id, default_language, settings_json, revision, updated_by)
         VALUES (:tenant_id, \'en\', \'{}\', 1, :employee_id)'
    )->execute(['tenant_id' => $ownerA, 'employee_id' => $lifecycleEmployeeId]);
    $db->prepare(
        'UPDATE nsc_user_project_permissions SET granted_by = :grantor_id
         WHERE tenant_id = :tenant_id AND user_id = :employee_id'
    )->execute(['grantor_id' => $lifecycleEmployeeId, 'tenant_id' => $ownerA, 'employee_id' => $lifecycleEmployeeId]);

    nscIntegrationExpect(
        nscIntegrationRequest(
            $server['baseUrl'],
            'POST',
            '/employees.php?action=delete',
            $ownerBSession,
            ['employeeId' => $lifecycleEmployeeId]
        ),
        404,
        'A different tenant owner cannot delete the employee account'
    );
    nscIntegrationExpect(
        nscIntegrationRequest(
            $server['baseUrl'],
            'POST',
            '/employees.php?action=delete',
            $ownerSession,
            ['employeeId' => $lifecycleEmployeeId]
        ),
        200,
        'Owner can delete an employee account with historical attribution and grant relationships'
    );
    $deletedEmployeeCount = $db->prepare('SELECT COUNT(*) FROM users WHERE id = :employee_id');
    $deletedEmployeeCount->execute(['employee_id' => $lifecycleEmployeeId]);
    nscIntegrationAssert((int)$deletedEmployeeCount->fetchColumn() === 0, 'Employee user row is removed after successful deletion');
    $attributionRows = $db->prepare(
        'SELECT (SELECT updated_by FROM nsc_workspace_snapshots WHERE tenant_id = :snapshot_tenant) AS snapshot_actor,
                (SELECT updated_by FROM nsc_tenant_settings WHERE tenant_id = :settings_tenant) AS settings_actor'
    );
    $attributionRows->execute(['snapshot_tenant' => $ownerA, 'settings_tenant' => $ownerA]);
    $transferredAttribution = $attributionRows->fetch();
    nscIntegrationAssert(
        is_array($transferredAttribution)
            && (string)$transferredAttribution['snapshot_actor'] === $ownerA
            && (string)$transferredAttribution['settings_actor'] === $ownerA,
        'Snapshot and tenant-settings attribution is transferred to the owner before employee deletion'
    );
    $deletedEmployeeGrants = $db->prepare('SELECT COUNT(*) FROM nsc_user_project_permissions WHERE tenant_id = :tenant_id AND user_id = :employee_id');
    $deletedEmployeeGrants->execute(['tenant_id' => $ownerA, 'employee_id' => $lifecycleEmployeeId]);
    nscIntegrationAssert((int)$deletedEmployeeGrants->fetchColumn() === 0, 'Employee project grants are removed during deletion');
    $deletedEmployeeSessions = $db->prepare('SELECT COUNT(*) FROM nsc_auth_sessions WHERE user_id = :employee_id');
    $deletedEmployeeSessions->execute(['employee_id' => $lifecycleEmployeeId]);
    nscIntegrationAssert((int)$deletedEmployeeSessions->fetchColumn() === 0, 'Employee sessions are removed during deletion');
    $employeeDeleteAudit = $db->prepare(
        "SELECT COUNT(*) FROM system_audit_logs
         WHERE user_id = :owner_id AND action = 'delete' AND module = 'employees' AND record_id = :employee_id"
    );
    $employeeDeleteAudit->execute(['owner_id' => $ownerA, 'employee_id' => $lifecycleEmployeeId]);
    nscIntegrationAssert((int)$employeeDeleteAudit->fetchColumn() > 0, 'Employee deletion writes a server-side owner audit event');
    $lifecycleAuditRows = $db->prepare(
        'SELECT action, COUNT(*) AS event_count FROM system_audit_logs
         WHERE user_id = :owner_id AND module = \'employees\' AND record_id = :employee_id
         GROUP BY action'
    );
    $lifecycleAuditRows->execute(['owner_id' => $ownerA, 'employee_id' => $lifecycleEmployeeId]);
    $lifecycleAuditCounts = [];
    foreach ($lifecycleAuditRows->fetchAll() as $auditRow) {
        $lifecycleAuditCounts[(string)$auditRow['action']] = (int)$auditRow['event_count'];
    }
    nscIntegrationAssert(
        ($lifecycleAuditCounts['create'] ?? 0) >= 1
            && ($lifecycleAuditCounts['update'] ?? 0) >= 1
            && ($lifecycleAuditCounts['unlock'] ?? 0) >= 1
            && ($lifecycleAuditCounts['lock'] ?? 0) >= 1
            && ($lifecycleAuditCounts['delete'] ?? 0) >= 1,
        'Create, profile update, lock, unlock, and delete each retain server-side audit events'
    );

    $grantPayload = [
        'userId' => $employeeA,
        'grants' => [['projectId' => 'project-a', 'module' => 'expenses', 'actions' => ['read', 'update']]],
    ];
    $saved = nscIntegrationRequest($server['baseUrl'], 'POST', '/permissions.php?action=save_grants', $ownerSession, $grantPayload);
    nscIntegrationExpect($saved, 200, 'Owner can atomically save a project-scoped employee grant');
    nscIntegrationAssert(($saved['body']['success'] ?? false) === true, 'Grant save returns a success response');

    $badAction = $grantPayload;
    $badAction['grants'][0]['actions'] = ['read', 'approve'];
    nscIntegrationExpect(
        nscIntegrationRequest($server['baseUrl'], 'POST', '/permissions.php?action=save_grants', $ownerSession, $badAction),
        400,
        'Unsupported grant actions are rejected'
    );
    $crossTenant = $grantPayload;
    $crossTenant['userId'] = $employeeB;
    nscIntegrationExpect(
        nscIntegrationRequest($server['baseUrl'], 'POST', '/permissions.php?action=save_grants', $ownerSession, $crossTenant),
        404,
        'An owner cannot assign grants to another tenant employee'
    );
    $storedGrants = nscAclLoadGrants($db, $ownerA, $employeeA);
    nscIntegrationAssert(
        ($storedGrants['project-a']['expenses'] ?? []) === ['read', 'update'],
        'Rejected grant requests leave the prior grant set unchanged'
    );

    // The production-default feature flag is exercised as false; the employee session is revoked.
    $disabledResponse = nscIntegrationRequest($server['baseUrl'], 'GET', '/workspace.php', $disabledEmployeeSession);
    nscIntegrationExpect($disabledResponse, 403, 'Employee workspace access is denied while the server flag is false');
    nscIntegrationAssert(
        str_contains((string)($disabledResponse['body']['error'] ?? ''), 'disabled'),
        'Disabled employee response explains the fail-closed state'
    );
    $disabledReportSession = nscIntegrationNewSession($db, $employeeA);
    nscIntegrationExpect(
        nscIntegrationRequest(
            $server['baseUrl'],
            'POST',
            '/reports.php?action=generate',
            $disabledReportSession,
            ['reportType' => 'financial', 'projectId' => 'project-a', 'year' => 2026]
        ),
        403,
        'Employee report endpoint remains closed while the server feature flag is false'
    );
    $ownerReportWhileEmployeesDisabled = nscIntegrationRequest(
        $server['baseUrl'],
        'POST',
        '/reports.php?action=generate',
        $ownerSession,
        ['reportType' => 'financial', 'projectId' => 'project-a', 'year' => 2026]
    );
    nscIntegrationExpect(
        $ownerReportWhileEmployeesDisabled,
        200,
        'Owner report remains tenant-scoped and available while employee access stays disabled'
    );
    nscIntegrationAssert(
        array_column($ownerReportWhileEmployeesDisabled['body']['data']['data']['expenses'] ?? [], 'id') === ['expense-a'],
        'Owner report response is still limited to the requested project'
    );
    nscIntegrationStopServer($server);

    // The flag is enabled only for this isolated test server and disposable database.
    $activeEmployeeSession = nscIntegrationNewSession($db, $employeeA);
    $server = nscIntegrationStartServer(true);
    $serverLogs[] = $server['logPath'];

    $missingReportGrant = nscIntegrationRequest(
        $server['baseUrl'],
        'POST',
        '/reports.php?action=generate',
        $activeEmployeeSession,
        ['reportType' => 'financial', 'projectId' => 'project-a', 'year' => 2026]
    );
    nscIntegrationExpect($missingReportGrant, 403, 'Employee report generation is denied when the reports-module grant is missing');

    $missingDataReportGrantPayload = [
        'userId' => $employeeA,
        'grants' => [
            ['projectId' => 'project-a', 'module' => 'reports', 'actions' => ['read', 'report']],
            ['projectId' => 'project-a', 'module' => 'expenses', 'actions' => ['read', 'update']],
            ['projectId' => 'project-a', 'module' => 'payments', 'actions' => ['read', 'report']],
        ],
    ];
    nscIntegrationExpect(
        nscIntegrationRequest(
            $server['baseUrl'],
            'POST',
            '/permissions.php?action=save_grants',
            $ownerSession,
            $missingDataReportGrantPayload
        ),
        200,
        'Owner can assign report-module access without granting expense report rights'
    );
    $missingDataReportRight = nscIntegrationRequest(
        $server['baseUrl'],
        'POST',
        '/reports.php?action=generate',
        $activeEmployeeSession,
        ['reportType' => 'financial', 'projectId' => 'project-a', 'year' => 2026]
    );
    nscIntegrationExpect($missingDataReportRight, 403, 'Report is denied when any underlying data module lacks report rights');

    $reportGrantPayload = [
        'userId' => $employeeA,
        'grants' => [
            ['projectId' => 'project-a', 'module' => 'reports', 'actions' => ['read', 'report']],
            ['projectId' => 'project-a', 'module' => 'expenses', 'actions' => ['read', 'update', 'report']],
            ['projectId' => 'project-a', 'module' => 'payments', 'actions' => ['read', 'report']],
            ['projectId' => 'project-a', 'module' => 'steel', 'actions' => ['read', 'report']],
            ['projectId' => 'project-a', 'module' => 'concrete', 'actions' => ['read', 'report']],
            ['projectId' => 'project-a', 'module' => 'contractors', 'actions' => ['read', 'report']],
            ['projectId' => 'project-a', 'module' => 'apartments', 'actions' => ['read', 'report']],
        ],
    ];
    $reportGrantsSaved = nscIntegrationRequest(
        $server['baseUrl'],
        'POST',
        '/permissions.php?action=save_grants',
        $ownerSession,
        $reportGrantPayload
    );
    nscIntegrationExpect($reportGrantsSaved, 200, 'Owner can assign explicit report rights to the reports and data modules');

    $foreignTenantReport = nscIntegrationRequest(
        $server['baseUrl'],
        'POST',
        '/reports.php?action=generate',
        $activeEmployeeSession,
        ['reportType' => 'financial', 'projectId' => 'tenant-b-project', 'year' => 2026]
    );
    nscIntegrationExpect($foreignTenantReport, 404, 'Employee cannot generate a report for a project in another tenant');
    nscIntegrationAssert(
        !str_contains((string)($foreignTenantReport['raw'] ?? ''), 'Cross-tenant secret'),
        'Cross-tenant report denial does not disclose foreign workspace data'
    );

    $readResponse = nscIntegrationRequest($server['baseUrl'], 'GET', '/workspace.php', $activeEmployeeSession);
    nscIntegrationExpect($readResponse, 200, 'Authorized employee can read the scoped workspace');
    $visibleWorkspace = $readResponse['body']['data']['workspace'] ?? null;
    nscIntegrationAssert(is_array($visibleWorkspace), 'Employee receives a workspace payload');
    nscIntegrationAssert(
        array_column($visibleWorkspace['projects'] ?? [], 'id') === ['project-a'],
        'Employee sees only the project covered by a read grant'
    );
    nscIntegrationAssert(
        count($visibleWorkspace['expenses'] ?? []) === 1 && ($visibleWorkspace['expenses'][0]['id'] ?? '') === 'expense-a',
        'Employee sees no records from hidden or archived projects'
    );
    nscIntegrationAssert(
        count($visibleWorkspace['payments'] ?? []) === 1 && ($visibleWorkspace['payments'][0]['id'] ?? '') === 'payment-a',
        'Employee workspace read filters payments to the granted project'
    );
    nscIntegrationAssert(
        !array_key_exists('appSettings', $visibleWorkspace)
            && !array_key_exists('contractValue', $visibleWorkspace['projects'][0] ?? []),
        'Owner-only settings and project financial fields are not exposed'
    );

    $generatedReport = nscIntegrationRequest(
        $server['baseUrl'],
        'POST',
        '/reports.php?action=generate',
        $activeEmployeeSession,
        ['reportType' => 'financial', 'projectId' => 'project-a', 'year' => 2026]
    );
    nscIntegrationExpect($generatedReport, 200, 'Employee can generate an explicitly authorized server-side report');
    $generatedReportData = $generatedReport['body']['data'] ?? null;
    nscIntegrationAssert(
        is_array($generatedReportData)
            && ($generatedReportData['reportType'] ?? '') === 'financial'
            && ($generatedReportData['projectId'] ?? '') === 'project-a'
            && (int)($generatedReportData['workspaceRevision'] ?? 0) === 1,
        'Generated report identifies its type, project, and immutable workspace revision'
    );
    nscIntegrationAssert(
        array_column($generatedReportData['data']['expenses'] ?? [], 'id') === ['expense-a']
            && array_column($generatedReportData['data']['payments'] ?? [], 'id') === ['payment-a'],
        'Generated report contains only records from the authorized project and modules'
    );
    nscIntegrationAssert(
        !str_contains((string)($generatedReport['raw'] ?? ''), 'Hidden expense')
            && !str_contains((string)($generatedReport['raw'] ?? ''), 'Hidden payment'),
        'Generated report omits records from other projects in the same tenant'
    );

    $otherReportExpectations = [
        'materials' => ['steelRecords' => 'steel-a', 'concreteRecords' => 'concrete-a'],
        'contractors' => ['contractors' => 'contractor-a', 'expenses' => 'expense-a', 'payments' => 'payment-a'],
        'sales' => ['apartments' => 'apartment-a', 'payments' => 'payment-a'],
        'monthly_pnl' => ['expenses' => 'expense-a', 'payments' => 'payment-a', 'apartments' => 'apartment-a'],
    ];
    foreach ($otherReportExpectations as $reportType => $expectedCollections) {
        $response = nscIntegrationRequest(
            $server['baseUrl'],
            'POST',
            '/reports.php?action=generate',
            $activeEmployeeSession,
            ['reportType' => $reportType, 'projectId' => 'project-a', 'year' => 2026]
        );
        nscIntegrationExpect($response, 200, 'Employee can generate the authorized ' . $reportType . ' report');
        $reportBody = $response['body']['data'] ?? [];
        $actualCollections = array_keys($reportBody['data'] ?? []);
        $expectedCollectionKeys = array_keys($expectedCollections);
        sort($actualCollections, SORT_STRING);
        sort($expectedCollectionKeys, SORT_STRING);
        $onlyExpectedRows = ($reportBody['reportType'] ?? '') === $reportType
            && ($reportBody['projectId'] ?? '') === 'project-a'
            && $actualCollections === $expectedCollectionKeys;
        foreach ($expectedCollections as $collection => $recordId) {
            $onlyExpectedRows = $onlyExpectedRows
                && array_column($reportBody['data'][$collection] ?? [], 'id') === [$recordId];
        }
        nscIntegrationAssert(
            $onlyExpectedRows,
            ucfirst(str_replace('_', ' ', $reportType)) . ' report contains only its authorized project/module collections'
        );
    }

    $reportAudit = $db->prepare(
        "SELECT COUNT(*) FROM system_audit_logs
         WHERE user_id = :user_id AND action = 'export' AND module = 'reports' AND record_id = :project_id"
    );
    $reportAudit->execute(['user_id' => $employeeA, 'project_id' => 'project-a']);
    nscIntegrationAssert((int)$reportAudit->fetchColumn() > 0, 'Report generation writes a server-side export audit event');

    $invalidReportType = nscIntegrationRequest(
        $server['baseUrl'],
        'POST',
        '/reports.php?action=generate',
        $activeEmployeeSession,
        ['reportType' => 'tenant_dump', 'projectId' => 'project-a', 'year' => 2026]
    );
    nscIntegrationExpect($invalidReportType, 400, 'Unsupported report types are rejected');

    $lockedUser = $db->prepare('UPDATE users SET is_locked = 1 WHERE id = :user_id');
    $lockedUser->execute(['user_id' => $employeeA]);
    nscIntegrationExpect(
        nscIntegrationRequest(
            $server['baseUrl'],
            'POST',
            '/reports.php?action=generate',
            $activeEmployeeSession,
            ['reportType' => 'financial', 'projectId' => 'project-a', 'year' => 2026]
        ),
        401,
        'Locked employee account cannot generate reports'
    );
    $unlockedUser = $db->prepare('UPDATE users SET is_locked = 0 WHERE id = :user_id');
    $unlockedUser->execute(['user_id' => $employeeA]);
    // The locked-session probe revokes its session, so issue a fresh one after unlocking.
    $activeEmployeeSession = nscIntegrationNewSession($db, $employeeA);

    $allowedUpdate = [
        'tenantId' => $ownerA,
        'revision' => 1,
        'workspace' => [
            'projects' => [['id' => 'project-a', 'name' => 'Client attempted project edit']],
            'currentProjectId' => 'project-a',
            'language' => 'ps',
            'appSettings' => ['companyName' => 'Client attempted settings edit'],
            'expenses' => [['id' => 'expense-a', 'projectId' => 'project-a', 'amount' => 11, 'description' => 'Authorized update']],
        ],
    ];
    $updateResponse = nscIntegrationRequest($server['baseUrl'], 'PUT', '/workspace.php', $activeEmployeeSession, $allowedUpdate);
    nscIntegrationExpect($updateResponse, 200, 'Employee can update an authorized record');
    nscIntegrationAssert((int)($updateResponse['body']['data']['revision'] ?? 0) === 2, 'Authorized employee write advances the snapshot revision');

    $stored = nscIntegrationStoredWorkspace($db, $ownerA);
    $storedExpenses = array_column($stored['workspace']['expenses'], null, 'id');
    nscIntegrationAssert((float)$storedExpenses['expense-a']['amount'] === 11.0, 'Authorized employee change is persisted');
    nscIntegrationAssert(
        (float)$storedExpenses['expense-b']['amount'] === 20.0
            && (float)$storedExpenses['expense-archived']['amount'] === 30.0,
        'Hidden and archived project records survive the employee write'
    );
    nscIntegrationAssert(
        $stored['workspace']['appSettings']['companyName'] === 'Owner-only test setting'
            && $stored['workspace']['projects'][0]['name'] === 'Project A'
            && $stored['workspace']['language'] === 'en',
        'Employee cannot overwrite owner projects, settings, or default language'
    );
    $audit = $db->prepare("SELECT COUNT(*) FROM system_audit_logs WHERE user_id = :user_id AND module = 'workspace' AND record_id = :tenant_id");
    $audit->execute(['user_id' => $employeeA, 'tenant_id' => $ownerA]);
    nscIntegrationAssert((int)$audit->fetchColumn() > 0, 'Employee workspace mutation writes a server-side audit event');

    $hiddenIdInjection = [
        'tenantId' => $ownerA,
        'revision' => 2,
        'workspace' => ['expenses' => [
            ['id' => 'expense-a', 'projectId' => 'project-a', 'amount' => 11, 'description' => 'Authorized update'],
            ['id' => 'expense-b', 'projectId' => 'project-b', 'amount' => 999, 'description' => 'Attempted hidden edit'],
        ]],
    ];
    nscIntegrationExpect(
        nscIntegrationRequest($server['baseUrl'], 'PUT', '/workspace.php', $activeEmployeeSession, $hiddenIdInjection),
        403,
        'Employee cannot inject or edit a hidden project record by ID'
    );
    $crossProjectCreate = [
        'tenantId' => $ownerA,
        'revision' => 2,
        'workspace' => ['expenses' => [
            ['id' => 'expense-a', 'projectId' => 'project-a', 'amount' => 11, 'description' => 'Authorized update'],
            ['id' => 'new-expense-b', 'projectId' => 'project-b', 'amount' => 40, 'description' => 'Attempted cross-project create'],
        ]],
    ];
    nscIntegrationExpect(
        nscIntegrationRequest($server['baseUrl'], 'PUT', '/workspace.php', $activeEmployeeSession, $crossProjectCreate),
        403,
        'Employee cannot create a record in an ungranted project'
    );
    nscIntegrationExpect(
        nscIntegrationRequest($server['baseUrl'], 'PUT', '/workspace.php', $activeEmployeeSession, $allowedUpdate),
        409,
        'Stale snapshot revisions are rejected'
    );

    // Two parallel writes with the same revision must produce one commit and one conflict.
    $concurrentWrites = [];
    foreach ([12, 13] as $amount) {
        $concurrentWrites[] = [
            'url' => $server['baseUrl'] . '/workspace.php',
            'method' => 'PUT',
            'session' => $activeEmployeeSession,
            'payload' => [
                'tenantId' => $ownerA,
                'revision' => 2,
                'workspace' => ['expenses' => [[
                    'id' => 'expense-a', 'projectId' => 'project-a', 'amount' => $amount, 'description' => 'Concurrent update ' . $amount,
                ]]],
            ],
        ];
    }
    $raceResponses = nscIntegrationConcurrentRequests($concurrentWrites);
    $raceStatuses = array_column($raceResponses, 'status');
    sort($raceStatuses);
    nscIntegrationAssert($raceStatuses === [200, 409], 'Concurrent writes at one revision serialize: one commits and one receives a conflict');
    $afterWriteRace = nscIntegrationStoredWorkspace($db, $ownerA);
    nscIntegrationAssert($afterWriteRace['revision'] === 3, 'Concurrent write race advances the revision exactly once');

    // Race grant revocation against both an in-flight employee write and report using matching DB lock order.
    $revokePayload = ['userId' => $employeeA, 'grants' => []];
    $revocationRace = nscIntegrationConcurrentRequests([
        [
            'url' => $server['baseUrl'] . '/permissions.php?action=save_grants',
            'method' => 'POST',
            'session' => $ownerSession,
            'payload' => $revokePayload,
        ],
        [
            'url' => $server['baseUrl'] . '/workspace.php',
            'method' => 'PUT',
            'session' => $activeEmployeeSession,
            'payload' => [
                'tenantId' => $ownerA,
                'revision' => 3,
                'workspace' => ['expenses' => [[
                    'id' => 'expense-a', 'projectId' => 'project-a', 'amount' => 14, 'description' => 'Revocation race update',
                ]]],
            ],
        ],
        [
            'url' => $server['baseUrl'] . '/reports.php?action=generate',
            'method' => 'POST',
            'session' => $activeEmployeeSession,
            'payload' => ['reportType' => 'financial', 'projectId' => 'project-a', 'year' => 2026],
        ],
    ]);
    nscIntegrationAssert((int)$revocationRace[0]['status'] === 200, 'Owner grant revocation succeeds during the concurrent requests');
    nscIntegrationAssert(
        in_array((int)$revocationRace[1]['status'], [200, 403], true),
        'Concurrent employee write either commits before revocation or is denied after it'
    );
    nscIntegrationAssert(
        in_array((int)$revocationRace[2]['status'], [200, 403], true),
        'Concurrent report either completes before grant revocation or is denied after it'
    );
    if ((int)$revocationRace[2]['status'] === 200) {
        $raceReport = $revocationRace[2]['body']['data'] ?? [];
        nscIntegrationAssert(
            ($raceReport['projectId'] ?? '') === 'project-a'
                && array_column($raceReport['data']['expenses'] ?? [], 'projectId') === ['project-a'],
            'A report winning the revocation race still contains only authorized project data'
        );
    } else {
        nscIntegrationAssert(
            !isset($revocationRace[2]['body']['data']),
            'A report losing the revocation race returns no protected data'
        );
    }
    $remainingGrant = $db->prepare('SELECT COUNT(*) FROM nsc_user_project_permissions WHERE tenant_id = :tenant_id AND user_id = :user_id');
    $remainingGrant->execute(['tenant_id' => $ownerA, 'user_id' => $employeeA]);
    nscIntegrationAssert((int)$remainingGrant->fetchColumn() === 0, 'Revoked grants are absent after both concurrent requests finish');

    $afterRevocationRace = nscIntegrationStoredWorkspace($db, $ownerA);
    $postRevocationAttempt = [
        'tenantId' => $ownerA,
        'revision' => $afterRevocationRace['revision'],
        'workspace' => ['expenses' => [[
            'id' => 'expense-a', 'projectId' => 'project-a', 'amount' => 777, 'description' => 'Must remain denied',
        ]]],
    ];
    nscIntegrationExpect(
        nscIntegrationRequest($server['baseUrl'], 'PUT', '/workspace.php', $activeEmployeeSession, $postRevocationAttempt),
        403,
        'Employee cannot write after the owner revokes the project grant'
    );
    $finalWorkspace = nscIntegrationStoredWorkspace($db, $ownerA);
    nscIntegrationAssert(
        $finalWorkspace['workspace']['expenses'][0]['amount'] !== 777,
        'Denied post-revocation write leaves owner workspace unchanged'
    );

    fwrite(STDOUT, "All PHP/MySQL access-control HTTP integration checks passed.\n");
} catch (Throwable $error) {
    $failureMessage = $error->getMessage();
    fwrite(STDERR, $failureMessage . "\n");
    if (getenv('GITHUB_ACTIONS') === 'true') {
        $annotationMessage = preg_replace('/[\r\n]+/', ' ', $failureMessage) ?? 'Integration check failed.';
        fwrite(STDERR, '::error title=Disposable PHP-MySQL integration failure::' . substr($annotationMessage, 0, 1200) . "\n");
    }
    if ($server !== null && is_file($server['logPath'])) {
        fwrite(STDERR, "--- PHP server log ---\n" . (string)file_get_contents($server['logPath']) . "\n--- end server log ---\n");
    }
    $failed = true;
} finally {
    nscIntegrationStopServer($server);
    foreach ($serverLogs as $serverLog) {
        if (is_file($serverLog)) @unlink($serverLog);
    }
}
if ($failed) exit(1);
