-- NSC migration 002: construction-material subaccounts and procurement mapping.
-- Safe to re-run: new rows use INSERT IGNORE; existing balances/names/IDs are not overwritten.
-- Requires the reviewed base schema and migration 001. Do not run on production before backup/staging sign-off.

-- Backward-compatible column additions for installations created before this migration.
SET @nsc_sql := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chart_of_accounts' AND COLUMN_NAME = 'is_header') = 0, 'ALTER TABLE `chart_of_accounts` ADD COLUMN `is_header` TINYINT(1) NOT NULL DEFAULT 0 AFTER `is_system_locked`', 'SELECT 1');
PREPARE nsc_stmt FROM @nsc_sql; EXECUTE nsc_stmt; DEALLOCATE PREPARE nsc_stmt;
SET @nsc_sql := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'material_procurements' AND COLUMN_NAME = 'account_code') = 0, 'ALTER TABLE `material_procurements` ADD COLUMN `account_code` VARCHAR(50) NULL COMMENT ''Resolved from the stable material category by the server'' AFTER `material_category`', 'SELECT 1');
PREPARE nsc_stmt FROM @nsc_sql; EXECUTE nsc_stmt; DEALLOCATE PREPARE nsc_stmt;
SET @nsc_sql := IF((SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'material_procurements' AND INDEX_NAME = 'idx_mat_account_code') = 0, 'ALTER TABLE `material_procurements` ADD INDEX `idx_mat_account_code` (`account_code`)', 'SELECT 1');
PREPARE nsc_stmt FROM @nsc_sql; EXECUTE nsc_stmt; DEALLOCATE PREPARE nsc_stmt;

-- Machine-readable mapping table for future relational procurement writes; category keys are internal IDs, not SKU names.
CREATE TABLE IF NOT EXISTS `material_category_account_map` (
  `category_key` VARCHAR(100) NOT NULL PRIMARY KEY,
  `account_code` VARCHAR(50) NOT NULL,
  `is_legacy` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_material_category_account` FOREIGN KEY (`account_code`) REFERENCES `chart_of_accounts` (`account_code`) ON DELETE RESTRICT,
  INDEX `idx_material_category_account_code` (`account_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed only the 5xxx construction accounts needed for material classification. Existing account codes are preserved.
START TRANSACTION;
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
VALUES ('nsc-coa-5000', '5000', 'Construction / Project Costs', 'expense', NULL, 1, 1, 'debit', 0.00);

-- Keep the already-established 5000 group as a header; this changes no balance or journal row.
UPDATE `chart_of_accounts` SET `is_header` = 1 WHERE `account_code` = '5000';

INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-5050', '5050', 'Cost of Units Sold (COGS)', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5000';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-5100', '5100', 'Steel & Rebar', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5000';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-5200', '5200', 'Concrete & Pumping', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5000';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-5300', '5300', 'Cement', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5000';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-5400', '5400', 'Sand & Gravel', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5000';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-5500', '5500', 'Masonry (Blocks & Bricks)', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5000';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-5600', '5600', 'Labour & Wages', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5000';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-5700', '5700', 'Machinery & Equipment Rental', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5000';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-5800', '5800', 'Transportation & Logistics', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5000';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-5900', '5900', 'Site Utilities & Fuel', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5000';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-5910', '5910', 'Formwork & Scaffolding', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5000';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-5920', '5920', 'Electrical Works', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5000';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-5930', '5930', 'Plumbing & Sanitary', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5000';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-5940', '5940', 'Carpentry, Doors & Windows', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5000';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-5950', '5950', 'Tiles, Paint & Finishing', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5000';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-5960', '5960', 'Elevator, Excavation & Shoring', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5000';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-5970', '5970', 'Permits, Fees & Engineering', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5000';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-5980', '5980', 'Project & Site Overhead', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5000';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-5990', '5990', 'Other Project Expenses', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5000';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-5010', '5010', 'Specialty Building Materials & Systems', 'expense', `parent`.`id`, 1, 1, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5000';


-- Detailed materials map to a five-digit leaf; product name/brand/size stays in the procurement description.
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-51001', '51001', 'Reinforcing steel and rebar', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5100';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-51002', '51002', 'Structural steel sections and plates', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5100';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-51003', '51003', 'Welded mesh and reinforcement accessories', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5100';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-51004', '51004', 'Binding wire, nails, bolts and metal fasteners', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5100';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-52001', '52001', 'Ready-mix concrete', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5200';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-52002', '52002', 'Precast concrete products', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5200';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-52003', '52003', 'Concrete admixtures and curing compounds', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5200';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-53001', '53001', 'Portland and general-purpose cement', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5300';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-53002', '53002', 'White and decorative cement', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5300';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-53003', '53003', 'Lime and lime-based binders', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5300';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-53004', '53004', 'Gypsum, plaster and wall render', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5300';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-53005', '53005', 'Mortar, tile adhesive and grout', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5300';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-54001', '54001', 'Fine and plastering sand', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5400';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-54002', '54002', 'Gravel, crushed stone and aggregates', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5400';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-54003', '54003', 'Fill, sub-base and road base materials', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5400';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-55001', '55001', 'Fired clay bricks', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5500';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-55002', '55002', 'Concrete blocks', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5500';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-55003', '55003', 'Lightweight and AAC blocks', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5500';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-55004', '55004', 'Paving and interlocking blocks', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5500';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-59101', '59101', 'Formwork timber, boards and lumber', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5910';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-59102', '59102', 'Plywood and reusable form panels', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5910';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-59103', '59103', 'Scaffolding components and materials', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5910';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-59104', '59104', 'Form ties, nails and release agents', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5910';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-59201', '59201', 'Electrical cables and wires', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5920';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-59202', '59202', 'Electrical conduits and trunking', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5920';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-59203', '59203', 'Switches, sockets and outlets', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5920';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-59204', '59204', 'Distribution boards, breakers and protection', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5920';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-59205', '59205', 'Lighting fixtures, lamps and drivers', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5920';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-59206', '59206', 'Earthing and lightning protection', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5920';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-59207', '59207', 'Data, CCTV, intercom and low-voltage equipment', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5920';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-59208', '59208', 'Electrical fittings and consumables', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5920';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-59301', '59301', 'PPR, PVC and HDPE pipes', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5930';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-59302', '59302', 'GI, steel and copper pipes', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5930';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-59303', '59303', 'Pipe fittings, valves and connectors', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5930';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-59304', '59304', 'Drainage, sewer and rainwater materials', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5930';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-59305', '59305', 'Sanitary ware, toilets and basins', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5930';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-59306', '59306', 'Taps, mixers, showers and bathroom accessories', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5930';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-59307', '59307', 'Water tanks, pumps and water heaters', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5930';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-59401', '59401', 'Joinery timber and carpentry materials', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5940';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-59402', '59402', 'Wooden doors and door frames', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5940';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-59403', '59403', 'Metal doors and frames', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5940';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-59404', '59404', 'Aluminium and uPVC windows and frames', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5940';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-59405', '59405', 'Glass, glazing and window accessories', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5940';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-59406', '59406', 'Locks, hinges, handles and door hardware', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5940';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-59407', '59407', 'Built-in cabinets and fitted joinery', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5940';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-59408', '59408', 'Railings, grills and architectural metalwork', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5940';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-59501', '59501', 'Ceramic wall and floor tiles', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5950';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-59502', '59502', 'Porcelain tiles and engineered tile slabs', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5950';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-59503', '59503', 'Marble, granite, terrazzo and natural stone', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5950';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-59504', '59504', 'Parquet, laminate, vinyl and floor coverings', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5950';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-59505', '59505', 'Interior and exterior paints', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5950';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-59506', '59506', 'Primer, putty, varnish and sealers', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5950';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-59507', '59507', 'Gypsum board, plasterboard and ceiling systems', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5950';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-59508', '59508', 'Wall cladding, wallpaper and decorative panels', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5950';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-59509', '59509', 'Cornices, mouldings and decorative trims', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5950';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-59510', '59510', 'Skirting, floor profiles and finishing accessories', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5950';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-50101', '50101', 'Roofing sheets, tiles and rainwater goods', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5010';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-50102', '50102', 'Waterproofing membranes and thermal insulation', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5010';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-50103', '50103', 'HVAC, ventilation, ducting and heating materials', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5010';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-50104', '50104', 'Fire alarms, sprinklers and fire-protection materials', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5010';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-50105', '50105', 'Solar, backup power and building-control systems', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5010';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-50106', '50106', 'Elevators, lifts and escalator materials', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5010';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-50107', '50107', 'Shoring, retaining and geotextile materials', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5010';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-50108', '50108', 'Landscaping, fencing and external works materials', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5010';
INSERT IGNORE INTO `chart_of_accounts`
  (`id`, `account_code`, `account_name`, `account_type`, `parent_account_id`, `is_system_locked`, `is_header`, `normal_balance`, `current_balance`)
SELECT 'nsc-coa-50109', '50109', 'Other specialty construction materials', 'expense', `parent`.`id`, 1, 0, 'debit', 0.00
FROM `chart_of_accounts` AS `parent` WHERE `parent`.`account_code` = '5010';

-- Stable keys for new UI categories plus legacy aliases so old procurement rows keep their former account classification.
INSERT IGNORE INTO `material_category_account_map` (`category_key`, `account_code`, `is_legacy`) VALUES
  ('mat_rebar', '51001', 0),
  ('mat_structural_steel', '51002', 0),
  ('mat_reinforcement_mesh', '51003', 0),
  ('mat_metal_fasteners', '51004', 0),
  ('mat_ready_mix_concrete', '52001', 0),
  ('mat_precast_concrete', '52002', 0),
  ('mat_concrete_admixtures', '52003', 0),
  ('mat_portland_cement', '53001', 0),
  ('mat_white_cement', '53002', 0),
  ('mat_lime', '53003', 0),
  ('mat_gypsum_plaster', '53004', 0),
  ('mat_mortar_adhesive_grout', '53005', 0),
  ('mat_fine_sand', '54001', 0),
  ('mat_gravel_crushed_aggregate', '54002', 0),
  ('mat_fill_base_course', '54003', 0),
  ('mat_clay_bricks', '55001', 0),
  ('mat_concrete_blocks', '55002', 0),
  ('mat_aac_blocks', '55003', 0),
  ('mat_pavers', '55004', 0),
  ('mat_formwork_lumber', '59101', 0),
  ('mat_formwork_plywood', '59102', 0),
  ('mat_scaffold_material', '59103', 0),
  ('mat_formwork_consumables', '59104', 0),
  ('mat_electrical_cables', '59201', 0),
  ('mat_conduits_trunking', '59202', 0),
  ('mat_switches_sockets', '59203', 0),
  ('mat_distribution_panels', '59204', 0),
  ('mat_lighting_fixtures', '59205', 0),
  ('mat_earthing_lightning_protection', '59206', 0),
  ('mat_data_cctv_intercom', '59207', 0),
  ('mat_electrical_accessories', '59208', 0),
  ('mat_plastic_pipes', '59301', 0),
  ('mat_metal_pipes', '59302', 0),
  ('mat_pipe_fittings_valves', '59303', 0),
  ('mat_drainage_sewer', '59304', 0),
  ('mat_sanitary_ware', '59305', 0),
  ('mat_taps_bathroom_accessories', '59306', 0),
  ('mat_tanks_pumps_heaters', '59307', 0),
  ('mat_joinery_timber', '59401', 0),
  ('mat_wooden_doors_frames', '59402', 0),
  ('mat_metal_doors_frames', '59403', 0),
  ('mat_aluminium_upvc_windows', '59404', 0),
  ('mat_glass_glazing', '59405', 0),
  ('mat_locks_hinges_hardware', '59406', 0),
  ('mat_cabinets_joinery', '59407', 0),
  ('mat_railings_metalwork', '59408', 0),
  ('mat_ceramic_tiles', '59501', 0),
  ('mat_porcelain_tiles', '59502', 0),
  ('mat_natural_stone_flooring', '59503', 0),
  ('mat_wood_vinyl_flooring', '59504', 0),
  ('mat_paints', '59505', 0),
  ('mat_primers_putty_varnishes', '59506', 0),
  ('mat_plasterboard_ceilings', '59507', 0),
  ('mat_cladding_wallpaper_panels', '59508', 0),
  ('mat_decorative_mouldings', '59509', 0),
  ('mat_flooring_accessories', '59510', 0),
  ('mat_roofing', '50101', 0),
  ('mat_waterproofing_insulation', '50102', 0),
  ('mat_hvac_ventilation', '50103', 0),
  ('mat_fire_protection', '50104', 0),
  ('mat_solar_building_systems', '50105', 0),
  ('mat_elevator_systems', '50106', 0),
  ('mat_shoring_geotextile', '50107', 0),
  ('mat_landscaping_external_works', '50108', 0),
  ('mat_specialty_materials', '50109', 0),
  ('mat_other', '5990', 0),
  ('مصالح عمومی ساختمانی', '5990', 1),
  ('سیمان و مواد چسباننده', '5300', 1),
  ('ریگ، جغل و سنگ‌دانه', '5400', 1),
  ('خشت و بلاک ساختمانی', '5500', 1),
  ('پایپ‌دوانی و تأسیسات آب', '5930', 1),
  ('تأسیسات برقی و کیبل', '5920', 1),
  ('گچ، رنگ و نازک‌کاری', '5950', 1),
  ('تجهیزات و مصالح متفرقه', '5990', 1),
  ('general construction materials', '5990', 1),
  ('cement & binders', '5300', 1),
  ('sand, gravel & aggregates', '5400', 1),
  ('bricks & blocks', '5500', 1),
  ('plumbing & pipes', '5930', 1),
  ('electrical & wiring', '5920', 1),
  ('plaster, paint & finishing', '5950', 1),
  ('other building materials', '5990', 1),
  ('cement', '5300', 1),
  ('materials', '5300', 1),
  ('steel', '5100', 1),
  ('rebar', '5100', 1),
  ('concrete', '5200', 1),
  ('paint', '5950', 1),
  ('tiles', '5950', 1),
  ('wood_supplier', '5910', 1),
  ('plywood & wood supplier', '5910', 1);

-- Enrich old relational rows only where no account code exists; unknown legacy labels safely fall back to 5990.
UPDATE `material_procurements` AS `mp`
LEFT JOIN `material_category_account_map` AS `map`
  ON `map`.`category_key` = LOWER(TRIM(`mp`.`material_category`))
SET `mp`.`account_code` = COALESCE(`map`.`account_code`, '5990')
WHERE `mp`.`account_code` IS NULL OR `mp`.`account_code` = '';
INSERT IGNORE INTO `nsc_schema_migrations` (`version`) VALUES ('002_construction_material_accounts');
COMMIT;
