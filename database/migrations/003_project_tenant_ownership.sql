-- NSC migration 003: additive tenant ownership for the project/budget foundation.
-- Requires the reviewed base schema and migration 001. Safe to re-run on MySQL/MariaDB.
-- IMPORTANT: no project owner can be inferred safely from the legacy schema. Existing
-- projects keep tenant_id=NULL; their budgets inherit an owner only when their project
-- has already been explicitly mapped. Keep projects.php fail-closed until mapping and
-- server-side authorization are reviewed. Do not run on production before backup and
-- staging sign-off.

-- Nullable columns preserve unmapped legacy rows without assigning them to a tenant.
SET @nsc_sql := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'projects' AND COLUMN_NAME = 'tenant_id') = 0, 'ALTER TABLE `projects` ADD COLUMN `tenant_id` VARCHAR(36) NULL DEFAULT NULL AFTER `id`', 'SELECT 1');
PREPARE nsc_stmt FROM @nsc_sql; EXECUTE nsc_stmt; DEALLOCATE PREPARE nsc_stmt;

SET @nsc_sql := IF((SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'projects' AND INDEX_NAME = 'idx_projects_tenant_status') = 0, 'ALTER TABLE `projects` ADD INDEX `idx_projects_tenant_status` (`tenant_id`, `status`)', 'SELECT 1');
PREPARE nsc_stmt FROM @nsc_sql; EXECUTE nsc_stmt; DEALLOCATE PREPARE nsc_stmt;
SET @nsc_sql := IF((SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'projects' AND INDEX_NAME = 'uq_projects_tenant_code') = 0, 'ALTER TABLE `projects` ADD UNIQUE KEY `uq_projects_tenant_code` (`tenant_id`, `project_code`)', 'SELECT 1');
PREPARE nsc_stmt FROM @nsc_sql; EXECUTE nsc_stmt; DEALLOCATE PREPARE nsc_stmt;
SET @nsc_sql := IF((SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'projects' AND INDEX_NAME = 'uq_projects_tenant_id_id') = 0, 'ALTER TABLE `projects` ADD UNIQUE KEY `uq_projects_tenant_id_id` (`tenant_id`, `id`)', 'SELECT 1');
PREPARE nsc_stmt FROM @nsc_sql; EXECUTE nsc_stmt; DEALLOCATE PREPARE nsc_stmt;
SET @nsc_sql := IF((SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'projects' AND CONSTRAINT_NAME = 'fk_projects_tenant_owner' AND CONSTRAINT_TYPE = 'FOREIGN KEY') = 0, 'ALTER TABLE `projects` ADD CONSTRAINT `fk_projects_tenant_owner` FOREIGN KEY (`tenant_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT', 'SELECT 1');
PREPARE nsc_stmt FROM @nsc_sql; EXECUTE nsc_stmt; DEALLOCATE PREPARE nsc_stmt;

SET @nsc_sql := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'project_budgets' AND COLUMN_NAME = 'tenant_id') = 0, 'ALTER TABLE `project_budgets` ADD COLUMN `tenant_id` VARCHAR(36) NULL DEFAULT NULL AFTER `project_id`', 'SELECT 1');
PREPARE nsc_stmt FROM @nsc_sql; EXECUTE nsc_stmt; DEALLOCATE PREPARE nsc_stmt;
SET @nsc_sql := IF((SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'project_budgets' AND INDEX_NAME = 'idx_project_budgets_tenant_project') = 0, 'ALTER TABLE `project_budgets` ADD INDEX `idx_project_budgets_tenant_project` (`tenant_id`, `project_id`)', 'SELECT 1');
PREPARE nsc_stmt FROM @nsc_sql; EXECUTE nsc_stmt; DEALLOCATE PREPARE nsc_stmt;

-- A budget belongs to its project's tenant. This is the only automatic backfill here:
-- it derives ownership from an explicit project mapping and never guesses project owners.
UPDATE `project_budgets` AS `budget`
INNER JOIN `projects` AS `project` ON `project`.`id` = `budget`.`project_id`
SET `budget`.`tenant_id` = `project`.`tenant_id`
WHERE `budget`.`tenant_id` IS NULL
  AND `project`.`tenant_id` IS NOT NULL;

SET @nsc_sql := IF((SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'project_budgets' AND CONSTRAINT_NAME = 'fk_project_budgets_tenant_owner' AND CONSTRAINT_TYPE = 'FOREIGN KEY') = 0, 'ALTER TABLE `project_budgets` ADD CONSTRAINT `fk_project_budgets_tenant_owner` FOREIGN KEY (`tenant_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT', 'SELECT 1');
PREPARE nsc_stmt FROM @nsc_sql; EXECUTE nsc_stmt; DEALLOCATE PREPARE nsc_stmt;
SET @nsc_sql := IF((SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'project_budgets' AND CONSTRAINT_NAME = 'fk_project_budgets_tenant_project' AND CONSTRAINT_TYPE = 'FOREIGN KEY') = 0, 'ALTER TABLE `project_budgets` ADD CONSTRAINT `fk_project_budgets_tenant_project` FOREIGN KEY (`tenant_id`, `project_id`) REFERENCES `projects` (`tenant_id`, `id`) ON DELETE CASCADE ON UPDATE RESTRICT', 'SELECT 1');
PREPARE nsc_stmt FROM @nsc_sql; EXECUTE nsc_stmt; DEALLOCATE PREPARE nsc_stmt;

INSERT IGNORE INTO `nsc_schema_migrations` (`version`) VALUES ('003_project_tenant_ownership');
