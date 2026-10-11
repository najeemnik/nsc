import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relativePath => fs.readFile(path.join(repositoryRoot, relativePath), 'utf8');
const errors = [];

const [configText, chart, modal, journal, budget, wip, workspace, phpHelper, migration, schema] = await Promise.all([
  read('api/material_account_map.json'),
  read('src/data/chartOfAccounts.ts'),
  read('src/components/modals/AddMaterialModal.tsx'),
  read('src/utils/journalEngine.ts'),
  read('src/utils/budgetUtils.ts'),
  read('src/utils/wipAllocation.ts'),
  read('api/workspace.php'),
  read('api/material_account_map.php'),
  read('database/migrations/002_construction_material_accounts.sql'),
  read('database/nsc_schema.sql'),
]);

let config;
try {
  config = JSON.parse(configText);
} catch (error) {
  console.error(`Material account map JSON is invalid: ${error.message}`);
  process.exit(1);
}

const validAccountCode = value => typeof value === 'string' && /^[0-9]{4,5}$/.test(value);
const groups = new Map();
for (const group of config.groups || []) {
  if (!group?.id || groups.has(group.id)) errors.push(`Duplicate or empty material category group: ${group?.id || '(empty)'}`);
  groups.set(group?.id, group);
  for (const locale of ['en', 'fa', 'ps']) {
    if (typeof group?.labels?.[locale] !== 'string' || !group.labels[locale].trim()) {
      errors.push(`Group ${group?.id || '(empty)'} is missing ${locale} label.`);
    }
  }
}

const categoryIds = new Set();
const detailCodes = new Set();
const parentCodes = new Set();
for (const category of config.categories || []) {
  if (!category || !/^mat_[a-z0-9_]+$/.test(category.id || '')) {
    errors.push(`Invalid material category identifier: ${category?.id || '(empty)'}`);
    continue;
  }
  if (categoryIds.has(category.id)) errors.push(`Duplicate material category identifier: ${category.id}`);
  categoryIds.add(category.id);
  if (!validAccountCode(category.account_code)) errors.push(`${category.id}: invalid account code ${category.account_code}`);
  if (!validAccountCode(category.parent_code)) errors.push(`${category.id}: invalid parent code ${category.parent_code}`);
  if (!groups.has(category.group)) errors.push(`${category.id}: unknown display group ${category.group}`);
  for (const locale of ['en', 'fa', 'ps']) {
    if (typeof category.labels?.[locale] !== 'string' || !category.labels[locale].trim()) {
      errors.push(`${category.id}: missing ${locale} account/category label.`);
    }
  }
  if (!category.existing_account) {
    if (detailCodes.has(category.account_code)) errors.push(`Duplicate material detail account code ${category.account_code}`);
    detailCodes.add(category.account_code);
    parentCodes.add(category.parent_code);
  }
}

if (categoryIds.size < 50) errors.push(`Expected broad construction-material coverage; found only ${categoryIds.size} categories.`);
if (config.version !== 1) errors.push(`Unsupported material account map version: ${config.version}`);
if (config.default_account_code !== '5990') errors.push('Unknown material categories must keep the established 5990 fallback.');
if (!validAccountCode(config.default_account_code)) errors.push('Material map default account code is invalid.');
for (const [legacyCategory, accountCode] of Object.entries(config.legacy_accounts || {})) {
  if (!legacyCategory.trim() || !validAccountCode(accountCode)) errors.push(`Invalid legacy material mapping: ${legacyCategory} -> ${accountCode}`);
}

const chartCodeMatches = [...chart.matchAll(/\{\s*code:\s*'([0-9]{4,5})'/g)].map(match => match[1]);
const literalAccountCodes = new Set(chartCodeMatches);
if (literalAccountCodes.size !== chartCodeMatches.length) errors.push('Chart of Accounts contains duplicate hard-coded account codes.');
for (const accountCode of detailCodes) {
  if (literalAccountCodes.has(accountCode)) errors.push(`Material posting account ${accountCode} collides with an existing chart account.`);
}
for (const category of config.categories || []) {
  if (!literalAccountCodes.has(category.parent_code)) {
    errors.push(`${category.id}: parent ${category.parent_code} is not declared in the chart of accounts.`);
  }
  if (category.existing_account && !literalAccountCodes.has(category.account_code)) {
    errors.push(`${category.id}: its existing account ${category.account_code} is not declared in the chart.`);
  }
}
for (const [legacyCategory, accountCode] of Object.entries(config.legacy_accounts || {})) {
  if (!literalAccountCodes.has(accountCode) && !detailCodes.has(accountCode)) {
    errors.push(`Legacy material mapping ${legacyCategory} targets missing account ${accountCode}.`);
  }
}
for (const parentCode of parentCodes) {
  if (!chart.includes(`...materialAccountsFor('${parentCode}')`)) {
    errors.push(`Chart does not expand detailed material accounts below parent ${parentCode}.`);
  }
}
for (const fragment of [
  "import materialAccountData from '../../api/material_account_map.json';",
  'export function resolveMaterialAccount(',
  'MATERIAL_PURCHASE_CATEGORIES',
]) {
  if (!chart.includes(fragment)) errors.push(`Chart of Accounts is missing the shared material mapping (${fragment}).`);
}

for (const [file, source, fragments] of [
  ['AddMaterialModal.tsx', modal, ['MATERIAL_PURCHASE_CATEGORIES', 'materialCategory.id', 'materialCategory.labels']],
  ['journalEngine.ts', journal, ['resolveMaterialAccount', "sourceType: 'material'", 'input.materialProcurements']],
  ['budgetUtils.ts', budget, ['resolveMaterialAccount', 'input.materialProcurements', 'getAncestorCodes']],
  ['wipAllocation.ts', wip, ['materialProcurements: input.materialProcurements']],
  ['workspace.php', workspace, ["require_once __DIR__ . '/material_account_map.php';", 'nscMaterialAnnotateWorkspace($writeWorkspace)']],
  ['material_account_map.php', phpHelper, ["__DIR__ . '/material_account_map.json'", 'nscResolveMaterialAccountCode(', "$record['accountCode'] = nscResolveMaterialAccountCode($category)"]],
]) {
  for (const fragment of fragments) {
    if (!source.includes(fragment)) errors.push(`${file}: material-accounting integration is missing (${fragment}).`);
  }
}

for (const category of config.categories || []) {
  if (!migration.includes(category.id) || !migration.includes(category.account_code)) {
    errors.push(`MySQL migration is missing category mapping ${category.id} -> ${category.account_code}.`);
  }
  if (!category.existing_account && !migration.includes(`SELECT 'nsc-coa-${category.account_code}', '${category.account_code}'`)) {
    errors.push(`MySQL migration does not seed posting account ${category.account_code} for ${category.id}.`);
  }
}
for (const [legacyCategory, accountCode] of Object.entries(config.legacy_accounts || {})) {
  if (!migration.includes(legacyCategory) || !migration.includes(accountCode)) {
    errors.push(`MySQL migration is missing legacy mapping ${legacyCategory} -> ${accountCode}.`);
  }
}
for (const fragment of [
  'INSERT IGNORE INTO `chart_of_accounts`',
  'INSERT IGNORE INTO `material_category_account_map`',
  'WHERE `mp`.`account_code` IS NULL OR `mp`.`account_code` =',
  "'002_construction_material_accounts'",
]) {
  if (!migration.includes(fragment)) errors.push(`MySQL migration is missing safe/idempotent material-accounting logic (${fragment}).`);
}
if (/\b(DROP\s+TABLE|TRUNCATE\s+TABLE|DELETE\s+FROM)\b/i.test(migration)) {
  errors.push('Material migration contains a destructive table/record operation.');
}
if (/SET\s+`?current_balance`?\s*=/i.test(migration)) {
  errors.push('Material migration must not change existing account balances.');
}
for (const fragment of ['`is_header` TINYINT(1)', '`account_code` VARCHAR(50) NULL', 'CREATE TABLE IF NOT EXISTS `material_category_account_map`']) {
  if (!schema.includes(fragment)) errors.push(`Base MySQL schema is missing ${fragment}.`);
}

if (errors.length) {
  console.error(`Material accounting check failed (${errors.length} issue${errors.length === 1 ? '' : 's'}):`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log(`Material accounting map valid: ${categoryIds.size} localized categories, ${detailCodes.size} new posting subaccounts, ${Object.keys(config.legacy_accounts || {}).length} compatibility aliases.`);
console.log('PHP/workspace, journal, WIP, budget and idempotent MySQL migration wiring verified.');
