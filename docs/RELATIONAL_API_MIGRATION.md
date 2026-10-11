# Next technical stage: tenant-scoped relational APIs

## Decision and safety boundary

The employee lifecycle and report-access implementation is complete in code and has passed the disposable PHP/MySQL CI matrix. The Shahhost-specific staging, backup/restore, and final review gate is being deferred until the end of the remaining work, as requested. Employee login/access stays disabled in production (`NSC_EMPLOYEE_ACCESS_ENABLED=false`); no production migration or deployment is authorized.

The next repository-visible gap is the set of legacy relational APIs. They remain guarded with HTTP 410 and must not be opened by removing the guard alone. This document defines the next technical work package; it does not claim that all six roadmap waves have been formally specified.

## Current endpoint inventory

| Guarded API | Main legacy tables referenced | Migration concern |
| --- | --- | --- |
| `apartments.php` | `apartment_units`, `clients`, `projects` | Owner/project scope and client relationships must be explicit. |
| `assets.php` | `assets_machinery`, `projects` | Project ownership and record-action policy. |
| `finance.php` | `payment_vouchers`, `petty_cash_expenses`, `project_transfers`, `revenue_entries`, `treasury_accounts`, `projects` | Multiple modules and cross-project transfers require transaction-wide authorization. |
| `journal.php` | `chart_of_accounts`, `journal_entries`, `journal_lines`, `projects` | Tenant-specific chart-of-accounts and journal ownership must be reviewed. |
| `materials.php` | `material_procurements`, `payment_vouchers`, `suppliers`, `projects` | Procurement, payment, and shared-supplier relationships cross module boundaries. |
| `payroll.php` | `labor_payroll`, `payment_vouchers`, `projects` | Sensitive employee/payroll data and payment side effects. |
| `projects.php` | `projects`, `project_budgets`, `payment_vouchers`, `revenue_entries` | Foundational owner scope; project codes are globally unique in the current base schema. |
| `subcontractors.php` | `subcontractors`, `projects` | Tenant and project ownership must be enforced on every operation. |
| `suppliers.php` | `suppliers` | Shared/master supplier records are owner-only until project-scoped. |

The base schema has no `tenant_id` columns in these legacy tables. Migration 001 adds server-side workspace snapshots, settings, grants, and sessions; it does not retrofit relational tenant ownership. Some guarded route bodies assume tenant columns that are not present in the base schema, but those bodies are unreachable while the first-action guard remains. `backendApi` still contains legacy project-route methods; no active React call sites for those methods were found during this inventory.

Migration 003 now adds nullable owner keys to `projects` and `project_budgets`, owner foreign keys, and a composite budget-to-project tenant foreign key. It leaves all unassigned legacy project rows `tenant_id IS NULL`; it only fills a budget owner when its project has already been explicitly mapped. This is a schema/CI foundation, not authorization and not permission to open the route. The existing globally unique `project_code` constraint is intentionally retained until duplicate/compatibility behavior is reviewed; the added tenant-scoped index does not yet permit duplicate codes across tenants.

## Work order

1. **Keep the deny boundary.** The disposable HTTP integration suite asserts that every route in the legacy endpoint set returns 410 for an authenticated owner. This guard test must remain until each endpoint is separately migrated and reviewed.
2. **Review legacy ownership mapping.** Use actual deployed data and constraints to decide how each project maps to an owner. The repository provides no safe rule for inferring project owners. Do not guess an owner or expose rows with `tenant_id IS NULL`.
3. **Finish the project/budget slice.** Migration 003 is versioned, additive, rerunnable, and exercised in disposable MySQL/MariaDB CI with pre-existing unowned project/budget fixtures. CI checks preservation of those rows and rejects cross-tenant budget attribution. Before route activation, review the deployment-specific mapping, backfill and verify every project and budget, and decide whether/when global project-code uniqueness can safely change.
4. **Migrate one route at a time.** For each route, require server-derived tenant identity, project membership checks, action-level ACL where staff access is intended, transactional audit, and two-tenant MySQL/MariaDB HTTP tests. Add its frontend client/UI only after the API contract is verified.
5. **Preserve scope separation.** Keep the employee feature flag false in production. The lifecycle staging and backup/restore acceptance remains the final gate; never run a migration against production during this work.

## Verification

`npm run check:api-security` classifies every API route and verifies that these nine legacy routes still begin with the fail-closed guard. The disposable CI migration step seeds an unowned legacy project and budget, applies migration 003 twice, and verifies preservation. `scripts/verify-access-control-integration.php` checks same-tenant project/budget inserts, rejects mismatched tenant attribution with the composite foreign key, and exercises HTTP 410 on all nine legacy routes. Native PHP 8.2/8.3 and MySQL 8.0/MariaDB 10.11 are available in CI; this sandbox does not have native PHP/MySQL. No legacy relational route has been reactivated by this work.
