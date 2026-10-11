# Employee project access controls (Wave 2 — in progress)

## Current enforcement boundary

- `permissions.php` is owner-only. It lists existing staff users, projects, and grants; its `save_grants` action atomically replaces one employee's grants after checking that the employee belongs to the active owner and every project exists in that owner's saved workspace. The permission update and its audit event are written in the same transaction.
- `nsc_user_project_permissions` is created by `database/migrations/001_workspace_persistence.sql`. A missing, malformed, or unknown grant is denied.
- The grant action allow-list is `read`, `create`, `update`, `delete`, and `report`. `create`, `update`, `delete`, and `report` require `read` for the same project and module. Report permission is distinct from CRUD. Project creation, editing, and deletion remain owner-only; settings, users, and audit logs are not grantable.
- `workspace.php` returns only project/module data covered by read grants. Employee writes are merged into the full owner snapshot under a revision lock; hidden records and owner settings are preserved. Each create/update/delete is checked against the matching action and every affected project. Cross-project transfers require authorization for all involved projects.
- Material category IDs and their English/Dari/Pashto labels share `api/material_account_map.json`. The PHP workspace helper discards any client-supplied account code and derives it from the stable category key (legacy labels are supported; unknown categories fall back to 5990). The procurement projection is wired to journal WIP, budget actuals and unit profitability. This workspace mapping is distinct from relational procurement writes, whose legacy endpoint remains closed.
- Employee workspace reads and writes re-check and lock the employee and owner rows, then lock the workspace and grant rows. Permission replacement uses the same employee-then-workspace lock order to reduce stale-grant races. This still needs verification against the target PHP/MySQL versions.
- Important employee record changes are summarized into `system_audit_logs` in the same transaction as the workspace write. Permission replacement is also audited transactionally. Denied workspace attempts are logged best-effort.
- Archived projects keep only explicitly granted `read`/`report` actions; record changes are denied. Removing a project through an owner snapshot save revokes stored grants for that project in the same transaction.
- Records without an explicit project reference are intentionally not exposed to employees. This keeps shared supplier/master records owner-only until their data model is project-scoped.
- Existing relational business endpoints remain fail-closed through `legacy_endpoint_guard.php`; `reports.php` is the exception and is now an active, authenticated `POST reports.php?action=generate` route. It reads a locked tenant workspace revision, requires `read` plus `report` for the `reports` module and every underlying data module for employees, returns only the selected project's authorized collections, and records an `export` audit event before returning. The owner and employee print paths wait for this server response and print those returned records; neither falls back to client-held report data after a denial. Owners are scoped to their own tenant and bypass employee grants. The browser print dialog itself is not a server-created PDF/export file.
- Report plans are explicit: `financial` reads expenses/payments; `materials` reads steel/concrete; `contractors` reads contractors/expenses/payments; `sales` reads apartments/payments; `monthly_pnl` reads expenses/payments/apartments. Each plan also requires `reports:read` and `reports:report`, plus `read`/`report` on each listed data module in the requested project. Each record is rechecked against all referenced projects. Cross-tenant project IDs return not-found without exposing foreign data, locked/disabled staff sessions are rejected, selected report rows containing secret-bearing fields fail closed, and the report response includes its source workspace revision. Project metadata in a report is restricted to ID/name/code/status.
- This does not reactivate the other relational business endpoints. Modules without a collection in the workspace map below (including treasury/accounting/journal/petty cash) still have no active employee data route; storing a grant does not make those routes usable.
- Employee access remains independently disabled at the API by default using `NSC_EMPLOYEE_ACCESS_ENABLED=false`. Login is rejected, and an old employee session is revoked on its next authenticated API request; the frontend also refuses employee activation. Production stays disabled pending Shahhost version confirmation, staging backup/restore, and final review. Employee account creation/edit/deletion is not implemented in this flow; the grant page only manages accounts that already exist.

## Workspace collection mapping

| Snapshot collection | Grant module |
| --- | --- |
| `expenses` | `expenses` |
| `steelRecords` | `steel` |
| `concreteRecords` | `concrete` |
| `contractors` | `contractors` |
| `suppliers` | `suppliers` |
| `apartments` | `apartments` |
| `payments` | `payments` |
| `documents` | `documents` |
| `laborRecords` | `labor` |
| `assets` | `assets` |
| `projectPartners`, `projectInvestments`, `partnerEquityTransfers` | `partners` |
| `projectBudgets` | `budget` |
| `incomeRecords` | `income` |
| `materialProcurements` | `materials` |
| `interProjectTransfers` | `transfers` |

Full project metadata is governed by the separate `projects` grant; a redacted ID/name/code/status summary is returned for projects with readable data and is the only project metadata in generated reports. `dashboard` and `reports` do not support employee record CRUD; any employee report operation still requires explicit `read` and `report` actions. Other grantable modules remain unusable for employees until their server routes are migrated and guarded.

## Verification before enabling employees

1. Use an isolated staging database that matches the main host's PHP and MySQL/MariaDB versions. Never test employee writes against production data.
2. Review migration 001 against the base schema and migration 002 against the deployed COA/MySQL version; confirm old account-code uniqueness, take and restore-test a staging backup, then apply the migrations only to staging. Never run 002 on production during this work.
3. Use fabricated tenants, owners, employees, projects, and records to test owner grant creation/replacement/revocation, cross-tenant denial, malformed actions, locked employees, expired subscriptions, and stale project IDs.
4. Test employee reads and attempted creates/updates/deletes across at least two projects and modules, including hidden-record IDs, duplicate IDs, project reassignment, cross-project transfers, archived projects, secrets, stale revisions, and owner-only settings.
5. Exercise simultaneous grant revocation and employee reads/writes/reports; verify the lock order, transaction rollback behavior, and that failed or unauthorized writes preserve the complete owner snapshot. A report racing revocation may complete only before the revocation commits; afterward it must return no protected data.
6. Verify `reports.php?action=generate` on the disposable service: missing reports-module and underlying-module rights, same-tenant project scoping, cross-tenant not-found, locked-account rejection, owner access while the employee flag is false, revision provenance, selected-module filtering, and audit behavior. Confirm the report area remains print-hidden until a successful server response.
7. Run `.github/workflows/php-mysql-integration.yml` against its disposable PHP/MySQL service matrix, then complete an independent security review. The workflow tests the report endpoint alongside fabricated-tenant access filtering, grant revocation/write races, and account-state denials; it never uses production credentials or data. The feature flag stays false in production and frontend staff activation stays blocked until all remaining gates pass.
8. Transfer to the main host only after all six planned waves and final testing: confirm a fresh production backup and tested restore, migration/cutover and rollback plan, then do a controlled deployment and post-deploy smoke test. No production migration or deployment has been run in this work.

`scripts/verify-access-control.php` contains database-independent policy tests. `scripts/verify-access-control-integration.php` exercises the actual PHP HTTP endpoints against a disposable MySQL-compatible database; it refuses to run unless `NSC_INTEGRATION_TEST=1`, `APP_ENV=test`, `DB_NAME=nsc_ci`, and a loopback DB host are set. `scripts/check-api-security.mjs` remains a static surface check and does not replace integration tests.

`.github/workflows/php-mysql-integration.yml` provisions native PHP 8.2/8.3 and disposable MySQL 8.0/MariaDB 10.11 services. It loads the base schema and migrations only into a per-job `nsc_ci` database, re-runs migration 002 to check idempotency, runs the policy/syntax checks, and tests owner grant writes, employee reads/writes, report generation with both reports-module and underlying-module grants, cross-tenant denial, locked accounts, audit entries, stale revisions, and concurrent grant-revocation races against writes and reports. The employee flag is false by default; it is switched on only in the isolated HTTP test server. No production credentials or data are used.

The sandbox itself has no native PHP CLI, MySQL/MariaDB, Docker, or Podman. Its local fallback, `npm run verify:php-wasm`, validates the policy suite and PHP syntax (including the report route) using pinned `@php-wasm/cli@3.1.57`; the package is not an application dependency or part of default build/lint gates, and it emits a Node-engine warning under Node 22. The previously completed GitHub Actions run (`38135182008`) passed all four native PHP/MySQL matrix combinations before this report endpoint was activated. The workflow now includes native report authorization/export HTTP tests as well as migration re-run and workspace concurrency checks; verify a green run for the report-enabled commit before sign-off. Production sign-off still requires matching Shahhost's exact versions and a staging backup/restore test.
