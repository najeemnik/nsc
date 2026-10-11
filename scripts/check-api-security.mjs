import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '@babel/parser';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const apiDirectory = path.join(repositoryRoot, 'api');
const apiFiles = (await readdir(apiDirectory)).filter(file => file.endsWith('.php')).sort();

const helperFiles = new Set([
  'access_control.php',
  'config.php',
  'db.php',
  'legacy_endpoint_guard.php',
  'material_account_map.php',
]);
const legacyEndpoints = new Set([
  'apartments.php',
  'assets.php',
  'finance.php',
  'journal.php',
  'materials.php',
  'payroll.php',
  'projects.php',
  'subcontractors.php',
  'suppliers.php',
]);
const activeEndpoints = new Set([
  'auth.php',
  'office7.php',
  'permissions.php',
  'reports.php',
  'workspace.php',
]);
const classifiedFiles = new Set([...helperFiles, ...legacyEndpoints, ...activeEndpoints]);
const errors = [];

for (const file of apiFiles) {
  if (!classifiedFiles.has(file)) errors.push(`${file}: API route has no explicit security classification.`);
}
for (const file of classifiedFiles) {
  if (!apiFiles.includes(file)) errors.push(`${file}: expected API file is missing.`);
}

const sources = new Map();
for (const file of apiFiles) {
  sources.set(file, await readFile(path.join(apiDirectory, file), 'utf8'));
}

for (const file of legacyEndpoints) {
  const source = sources.get(file) || '';
  const guardRequire = "require_once __DIR__ . '/legacy_endpoint_guard.php';";
  const guardCall = 'nscBlockLegacyRelationalEndpoint();';
  const requireIndex = source.indexOf(guardRequire);
  const callIndex = source.indexOf(guardCall);
  if (requireIndex < 0 || callIndex < 0 || requireIndex > callIndex || callIndex > 240) {
    errors.push(`${file}: legacy fail-closed guard must be the first route action.`);
    continue;
  }
  const firstDatabaseUse = [
    source.indexOf('Database::getConnection('),
    source.indexOf('->prepare('),
    source.indexOf('->query('),
    source.indexOf('->exec('),
  ].filter(index => index >= 0).sort((a, b) => a - b)[0];
  if (firstDatabaseUse !== undefined && callIndex > firstDatabaseUse) {
    errors.push(`${file}: database access appears before its legacy guard.`);
  }
}

for (const file of activeEndpoints) {
  const source = sources.get(file) || '';
  if (!source.includes('sendSecurityHeaders();')) {
    errors.push(`${file}: security headers and origin handling are missing.`);
  }
  if (!source.includes('authenticateUser(')) {
    errors.push(`${file}: authenticated session check is missing.`);
  }
}

const auth = sources.get('auth.php') || '';
for (const fragment of [
  'nscIsEmployeeAccount($user)',
  '!nscEmployeeAccessEnabled()',
  'createAuthSession($db',
  'authenticateUser(false, true)',
]) {
  if (!auth.includes(fragment)) errors.push(`auth.php: expected employee/session control is missing (${fragment}).`);
}

const office7 = sources.get('office7.php') || '';
if (!office7.includes('authenticateUser(true)')) {
  errors.push('office7.php: master-only session enforcement is missing.');
}

const permissions = sources.get('permissions.php') || '';
for (const fragment of [
  'requireTenantOwner($currentUser)',
  'nscAclIsOwner($currentUser)',
  'nscAclNormalizeGrantList(',
  'nscAclWriteAudit(',
  '$db->beginTransaction()',
  '$db->commit()',
]) {
  if (!permissions.includes(fragment)) errors.push(`permissions.php: expected owner/grant/audit control is missing (${fragment}).`);
}

const reports = sources.get('reports.php') || '';
for (const fragment of [
  "($_GET['action'] ?? '') !== 'generate'",
  'NSC_REPORT_COLLECTIONS_BY_TYPE',
  'nscAclLockEmployeeTenant(',
  'nscAclLoadGrants(',
  "nscAclRequireProjectAction($grants, $projectId, $module, 'report')",
  "nscAclWriteAudit(\n        $db,\n        $user,\n        'export',\n        'reports'",
  'workspaceRevision',
  'nscReportsContainsSecretField($reportData)',
]) {
  if (!reports.includes(fragment)) errors.push(`reports.php: expected scoped report/export control is missing (${fragment}).`);
}
if (reports.includes('legacy_endpoint_guard.php') || reports.includes('nscBlockLegacyRelationalEndpoint()')) {
  errors.push('reports.php: active report endpoint must not retain the legacy fail-closed route guard.');
}
const reportsView = await readFile(path.join(repositoryRoot, 'src/components/views/ReportsView.tsx'), 'utf8');
for (const fragment of [
  'backendApi.generateReport(\n      requestSelection.reportType,\n      requestSelection.projectId,\n      requestSelection.year,',
  'setGeneratedReport({ report, userId: requestSelection.userId })',
  'setPrintWhenReady(true)',
  "activeServerReport ? '' : 'print:hidden'",
]) {
  if (!reportsView.includes(fragment)) errors.push(`ReportsView.tsx: server-authorized report/print flow is missing (${fragment}).`);
}

const workspace = sources.get('workspace.php') || '';
for (const fragment of [
  'nscAclIsOwner($user)',
  'nscAclRequireEmployeeTenant(',
  'nscAclLockEmployeeTenant(',
  'nscAclLoadGrants(',
  'nscAclFilterWorkspace(',
  'nscAclMergeEmployeeWorkspace(',
  'nscAclWriteAudit(',
  "require_once __DIR__ . '/material_account_map.php';",
  'nscMaterialAnnotateWorkspace($workspace)',
  'nscMaterialAnnotateWorkspace($writeWorkspace)',
]) {
  if (!workspace.includes(fragment)) errors.push(`workspace.php: expected scoped read/write control is missing (${fragment}).`);
}

const databaseHelpers = sources.get('db.php') || '';
if (!/nscEnv\(\s*['"]NSC_EMPLOYEE_ACCESS_ENABLED['"]\s*,\s*['"]false['"]\s*\)/.test(databaseHelpers)) {
  errors.push('db.php: employee API access must default to disabled.');
}

const acl = sources.get('access_control.php') || '';
const allowedActions = parsePhpStringList(acl, 'NSC_ACL_ACTIONS');
const expectedActions = ['read', 'create', 'update', 'delete', 'report'];
if (!allowedActions || allowedActions.join('|') !== expectedActions.join('|')) {
  errors.push('access_control.php: server action allow-list must contain read/create/update/delete/report in order.');
}
for (const fragment of ['nscAclRequireProjectAction(', 'nscAclRequireRecordAction(', 'nscAclRestrictArchivedProjects(']) {
  if (!acl.includes(fragment)) errors.push(`access_control.php: required authorization policy is missing (${fragment}).`);
}

const materialAccountHelper = sources.get('material_account_map.php') || '';
for (const fragment of [
  "__DIR__ . '/material_account_map.json'",
  'nscResolveMaterialAccountCode(',
  "$record['accountCode'] = nscResolveMaterialAccountCode($category)",
  "preg_match('/^[0-9]{4,5}$/D'",
]) {
  if (!materialAccountHelper.includes(fragment)) errors.push(`material_account_map.php: safe server-derived account mapping is missing (${fragment}).`);
}

const legacyGuard = sources.get('legacy_endpoint_guard.php') || '';
for (const fragment of ['authenticateUser(false)', 'requireTenantOwner($user)', '410']) {
  if (!legacyGuard.includes(fragment)) errors.push(`legacy_endpoint_guard.php: expected fail-closed behavior is missing (${fragment}).`);
}

function extractQuotedStrings(source) {
  const values = [];
  for (let index = 0; index < source.length;) {
    const quote = source[index];
    if (quote !== "'" && quote !== '"') {
      index++;
      continue;
    }
    const end = source.indexOf(quote, index + 1);
    if (end < 0) break;
    values.push(source.slice(index + 1, end));
    index = end + 1;
  }
  return values;
}

function parsePhpStringList(source, constantName) {
  const marker = `const ${constantName} = [`;
  const markerIndex = source.indexOf(marker);
  if (markerIndex < 0) return null;
  const bodyStart = markerIndex + marker.length;
  const bodyEnd = source.indexOf('];', bodyStart);
  return bodyEnd < 0 ? null : extractQuotedStrings(source.slice(bodyStart, bodyEnd));
}

function parsePhpMapKeys(source, constantName) {
  const marker = `const ${constantName} = [`;
  const markerIndex = source.indexOf(marker);
  if (markerIndex < 0) return null;
  const bodyStart = markerIndex + marker.length;
  const bodyEnd = source.indexOf('];', bodyStart);
  if (bodyEnd < 0) return null;
  const keys = [];
  for (const line of source.slice(bodyStart, bodyEnd).split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("'")) continue;
    const quoteEnd = trimmed.indexOf("'", 1);
    if (quoteEnd > 0 && trimmed.slice(quoteEnd + 1).trimStart().startsWith('=>')) {
      keys.push(trimmed.slice(1, quoteEnd));
    }
  }
  return keys;
}

function findWorkspaceSnapshotKeys(source) {
  const ast = parse(source, { sourceType: 'module', plugins: ['typescript', 'jsx'] });
  let keys = null;
  const ignored = new Set(['loc', 'start', 'end', 'leadingComments', 'trailingComments', 'innerComments', 'comments']);
  const visit = node => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      for (const child of node) visit(child);
      return;
    }
    if (typeof node.type !== 'string') return;
    if (node.type === 'VariableDeclarator' && node.id?.name === 'workspaceSnapshot') {
      const memoCallback = node.init?.type === 'CallExpression' ? node.init.arguments?.[0] : null;
      const returnStatement = memoCallback?.body?.type === 'BlockStatement'
        ? memoCallback.body.body.find(statement => statement.type === 'ReturnStatement')
        : null;
      const object = returnStatement?.argument;
      if (object?.type === 'ObjectExpression') {
        keys = object.properties
          .filter(property => property.type === 'ObjectProperty')
          .map(property => property.key.name ?? property.key.value)
          .filter(key => typeof key === 'string');
      }
      return;
    }
    for (const [key, value] of Object.entries(node)) {
      if (!ignored.has(key)) visit(value);
    }
  };
  visit(ast.program);
  return keys;
}

const appContext = await readFile(path.join(repositoryRoot, 'src/context/AppContext.tsx'), 'utf8');
const snapshotKeys = findWorkspaceSnapshotKeys(appContext);
const workspaceAllowedKeys = parsePhpStringList(workspace, 'NSC_WORKSPACE_KEYS');
const projectBoundKeys = parsePhpStringList(workspace, 'NSC_PROJECT_BOUND_KEYS');
const validationMarker = 'if (in_array($key, [';
const validationMarkerIndex = workspace.indexOf(validationMarker);
const validationBodyStart = validationMarkerIndex < 0 ? -1 : validationMarkerIndex + validationMarker.length;
const validationBodyEnd = validationBodyStart < 0 ? -1 : workspace.indexOf('], true))', validationBodyStart);
const validatedCollectionKeys = validationBodyEnd < 0
  ? null
  : extractQuotedStrings(workspace.slice(validationBodyStart, validationBodyEnd));
const aclCollectionKeys = parsePhpMapKeys(acl, 'NSC_ACL_WORKSPACE_COLLECTION_MODULES');
if (!snapshotKeys) {
  errors.push('AppContext.tsx: workspace snapshot object could not be parsed for ACL coverage.');
} else if (!workspaceAllowedKeys || !validatedCollectionKeys || !aclCollectionKeys || !projectBoundKeys) {
  errors.push('API workspace allowlist, collection validation, project-bound list, or ACL map could not be parsed.');
} else {
  const ownerOnlyKeys = new Set(['appSettings', 'currentProjectId', 'language', 'notificationPreferences', 'dashboardLayout']);
  const persistedKeys = snapshotKeys.filter(key => !ownerOnlyKeys.has(key));
  const dataCollections = persistedKeys.filter(key => key !== 'projects');
  const missingAllowed = persistedKeys.filter(key => !workspaceAllowedKeys.includes(key));
  const missingValidation = persistedKeys.filter(key => !validatedCollectionKeys.includes(key));
  const missingAcl = dataCollections.filter(key => !aclCollectionKeys.includes(key));
  const unbackedAcl = aclCollectionKeys.filter(key => !dataCollections.includes(key));
  const missingProjectBound = dataCollections.filter(key => !projectBoundKeys.includes(key));
  for (const key of missingAllowed) errors.push(`workspace.php: client snapshot field ${key} is not on the server allow-list.`);
  for (const key of missingValidation) errors.push(`workspace.php: client snapshot collection ${key} is missing shape/ID validation.`);
  for (const key of missingAcl) errors.push(`access_control.php: client data collection ${key} has no module ACL mapping.`);
  for (const key of unbackedAcl) errors.push(`access_control.php: ACL collection ${key} is not present in the client workspace snapshot.`);
  for (const key of missingProjectBound) errors.push(`workspace.php: client data collection ${key} is missing project-reference validation.`);
}

if (errors.length) {
  console.error(`API security surface check failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`API security surface check passed (${activeEndpoints.size} active endpoints, ${legacyEndpoints.size} fail-closed legacy endpoints).`);
}
