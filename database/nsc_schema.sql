-- =====================================================================
-- NSC ERP & CONSTRUCTION FINANCE DATABASE SCHEMA
-- نظام یکپارچه مالی، کنترول مصارف پروژه و مدیریت ساختمانی
-- Compatible with MySQL 8.x, 5.7 & MariaDB (Shahhost SSD Silver)
-- Character Set: utf8mb4 (Full Dari / Pashto / Persian Unicode Support)
-- =====================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

-- ---------------------------------------------------------------------
-- 1. جدول مشخصات شرکت و تنظیمات عمومی (Company Setup)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `company_profiles`;
CREATE TABLE `company_profiles` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `company_name` VARCHAR(255) NOT NULL,
  `registration_no` VARCHAR(100) NULL,
  `tax_tin_number` VARCHAR(100) NULL,
  `primary_currency` VARCHAR(10) NOT NULL DEFAULT 'AFN',
  `secondary_currency` VARCHAR(10) NOT NULL DEFAULT 'USD',
  `usd_to_afn_rate` DECIMAL(12, 4) NOT NULL DEFAULT 70.0000,
  `office_phone` VARCHAR(50) NULL,
  `contact_email` VARCHAR(150) NULL,
  `official_address` TEXT NULL,
  `logo_url` TEXT NULL,
  `invoice_header_note` TEXT NULL,
  `invoice_footer_terms` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 2. جدول کاربران و سطوح امنیتی (Users, Authentication & Roles)
-- حل اساسی نقایص امنیتی: کلمات عبور بصورت هش رمزگذاری شده (bcrypt)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `owner_admin_id` VARCHAR(36) NULL COMMENT 'ارتباط کارمند با مالک اصلی شرکت',
  `name` VARCHAR(150) NOT NULL,
  `username` VARCHAR(80) NOT NULL UNIQUE,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('master', 'admin', 'project_manager', 'accountant', 'procurement', 'viewer') NOT NULL DEFAULT 'viewer',
  `phone` VARCHAR(40) NULL,
  `company_name` VARCHAR(200) NULL,
  `company_address` TEXT NULL,
  `avatar_url` TEXT NULL,
  `subscription_plan` ENUM('trial', 'pro', 'enterprise', 'lifetime') DEFAULT 'pro',
  `subscription_expires_at` DATETIME NULL,
  `is_locked` TINYINT(1) NOT NULL DEFAULT 0,
  `is_master` TINYINT(1) NOT NULL DEFAULT 0,
  `permissions_json` LONGTEXT NULL,
  `allowed_modules_json` LONGTEXT NULL,
  `allowed_tabs_json` LONGTEXT NULL,
  `last_login_at` DATETIME NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_owner` (`owner_admin_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 3. جدول پیکربندی دفتر هفت (Office 7 Master Control)
-- مدیریت اختصاصی پرمیژن‌ها، سرویس‌ها، ماژول‌ها و امنیت مالک کل سیستم
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `office7_tenant_configs`;
CREATE TABLE `office7_tenant_configs` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `tenant_user_id` VARCHAR(36) NOT NULL UNIQUE,
  `gate_key_hash` VARCHAR(255) NULL COMMENT 'کلید اختصاصی دروازه امنیتی دفتر هفت',
  `ai_assistant_enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `cloud_sync_enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `max_allowed_projects` INT NOT NULL DEFAULT 100,
  `max_allowed_staff` INT NOT NULL DEFAULT 20,
  `active_modules_json` LONGTEXT NOT NULL,
  `accessible_tabs_json` LONGTEXT NOT NULL,
  `updated_by` VARCHAR(36) NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_office7_user` FOREIGN KEY (`tenant_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 4. دوره‌های مالی و سال حسابداری (Fiscal Periods)
-- حل مشکل شماره ۱ اکسل: تفکیک دقیق سال + ماه مالی و جلوگیری از خلط اطلاعات
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `fiscal_periods`;
CREATE TABLE `fiscal_periods` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `fiscal_year` INT NOT NULL,
  `period_month` INT NOT NULL,
  `period_name` VARCHAR(100) NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `status` ENUM('open', 'closed', 'locked') NOT NULL DEFAULT 'open',
  `closed_by` VARCHAR(36) NULL,
  `closed_at` DATETIME NULL,
  INDEX `idx_fiscal_year_month` (`fiscal_year`, `period_month`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 5. شناسنامه و اطلاعات اصلی پروژه‌ها (Project Master)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `projects`;
CREATE TABLE `projects` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `project_code` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(255) NOT NULL,
  `client_name` VARCHAR(255) NULL,
  `contract_value` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  `approved_budget` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'AFN',
  `location` VARCHAR(255) NULL,
  `start_date` DATE NULL,
  `expected_finish` DATE NULL,
  `status` ENUM('planning', 'active', 'on_hold', 'completed', 'archived') NOT NULL DEFAULT 'active',
  `project_manager` VARCHAR(150) NULL,
  `total_area_sqm` DECIMAL(12, 2) NULL,
  `floors_count` INT NULL,
  `notes` TEXT NULL,
  `created_by` VARCHAR(36) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_projects_status` (`status`),
  INDEX `idx_projects_code` (`project_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 6. بودجه‌بندی تفصیلی پروژه‌ها بر اساس سرفصل (Project Budgets)
-- مقایسه بودجه پیش‌بینی‌شده با هزینه واقعی (Budget vs Actual)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `project_budgets`;
CREATE TABLE `project_budgets` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `project_id` VARCHAR(36) NOT NULL,
  `category_code` VARCHAR(60) NOT NULL,
  `category_name` VARCHAR(150) NOT NULL,
  `budgeted_amount` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'AFN',
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_budget_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  INDEX `idx_budget_proj_cat` (`project_id`, `category_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 7. درختواره و کدینگ حساب‌ها (Chart of Accounts)
-- حل مشکل شماره ۵ اکسل: ساختار واقعی حسابداری دوطرفه
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `chart_of_accounts`;
CREATE TABLE `chart_of_accounts` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `account_code` VARCHAR(50) NOT NULL UNIQUE,
  `account_name` VARCHAR(200) NOT NULL,
  `account_type` ENUM('asset', 'liability', 'equity', 'revenue', 'expense') NOT NULL,
  `parent_account_id` VARCHAR(36) NULL,
  `is_system_locked` TINYINT(1) NOT NULL DEFAULT 0,
  `normal_balance` ENUM('debit', 'credit') NOT NULL,
  `current_balance` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_coa_type` (`account_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 8. حساب‌های بانکی، صندوق مرکزی و تنخواه‌گردان (Treasury, Bank & Cash)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `treasury_accounts`;
CREATE TABLE `treasury_accounts` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `account_type` ENUM('bank', 'central_cash', 'petty_cash') NOT NULL,
  `account_name` VARCHAR(150) NOT NULL,
  `bank_name` VARCHAR(100) NULL,
  `account_number` VARCHAR(100) NULL,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'AFN',
  `opening_balance` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  `current_balance` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  `custodian_name` VARCHAR(150) NULL,
  `gl_account_id` VARCHAR(36) NULL,
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 9. تأمین‌کنندگان و فروشندگان مصالح (Suppliers)
-- حل مشکل شماره ۴ اکسل: محاسبه خودکار صورت‌حساب و مانده بدهی/طلب
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `suppliers`;
CREATE TABLE `suppliers` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `supplier_name` VARCHAR(200) NOT NULL,
  `contact_person` VARCHAR(150) NULL,
  `phone` VARCHAR(50) NULL,
  `address` TEXT NULL,
  `material_category` VARCHAR(100) NULL,
  `tax_id` VARCHAR(100) NULL,
  `opening_balance` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  `total_purchases` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  `total_paid` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  `current_payable_balance` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 10. مقاطعه‌کاران و پیمانکاران فرعی (Subcontractors)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `subcontractors`;
CREATE TABLE `subcontractors` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `contractor_name` VARCHAR(200) NOT NULL,
  `trade_specialty` VARCHAR(150) NOT NULL,
  `phone` VARCHAR(50) NULL,
  `project_id` VARCHAR(36) NULL,
  `contract_value` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  `certified_work_amount` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  `paid_amount` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  `retention_amount` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  `remaining_balance` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  `status` ENUM('active', 'completed', 'suspended') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_subcontractor_proj` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 11. مشتریان و خریداران پلاک‌ها/واحدها (Clients & Unit Sales)
-- مدیریت مطالبات شرکت (Customer Register & Receivables)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `clients`;
CREATE TABLE `clients` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `client_name` VARCHAR(200) NOT NULL,
  `phone` VARCHAR(50) NOT NULL,
  `national_id_tazkira` VARCHAR(80) NULL,
  `address` TEXT NULL,
  `total_contract_value` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  `total_billed_amount` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  `total_paid_amount` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  `outstanding_receivable` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 12. واحدها، اپارتمان‌ها و دکان‌های تجاری (Apartment & Commercial Units)
-- ادغام تخصصی ماژول پیش‌فروش‌های NSC
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `apartment_units`;
CREATE TABLE `apartment_units` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `project_id` VARCHAR(36) NOT NULL,
  `unit_number` VARCHAR(50) NOT NULL,
  `floor_number` INT NOT NULL,
  `area_sqm` DECIMAL(10, 2) NOT NULL,
  `unit_type` ENUM('apartment', 'penthouse', 'shop', 'office', 'parking') NOT NULL DEFAULT 'apartment',
  `client_id` VARCHAR(36) NULL,
  `price_usd` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
  `price_afn` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  `total_paid_afn` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  `balance_receivable_afn` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  `status` ENUM('available', 'reserved', 'sold') NOT NULL DEFAULT 'available',
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_unit_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  INDEX `idx_unit_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 13. دفتر پرداخت‌ها و مصارف پروژه (Payment Register & Actual Costs)
-- ستون فقرات محاسبه مصارف واقعی پروژه در سود و زیان
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `payment_vouchers`;
CREATE TABLE `payment_vouchers` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `voucher_no` VARCHAR(50) NOT NULL UNIQUE,
  `project_id` VARCHAR(36) NOT NULL,
  `payee_type` ENUM('supplier', 'subcontractor', 'labor_wage', 'staff_salary', 'equipment_rental', 'office_admin', 'permit_tax', 'transport_fuel', 'partner_withdrawal', 'other') NOT NULL,
  `payee_id` VARCHAR(36) NULL,
  `payee_name` VARCHAR(255) NOT NULL,
  `expense_category` VARCHAR(100) NOT NULL,
  `budget_category_id` VARCHAR(36) NULL,
  `amount` DECIMAL(16, 2) NOT NULL,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'AFN',
  `exchange_rate` DECIMAL(12, 4) NOT NULL DEFAULT 1.0000,
  `amount_in_base_afn` DECIMAL(16, 2) NOT NULL,
  `payment_method` ENUM('cash', 'bank_transfer', 'cheque', 'hawala', 'credit') NOT NULL DEFAULT 'cash',
  `source_account_id` VARCHAR(36) NULL COMMENT 'حساب پرداخت‌کننده از جدول treasury_accounts',
  `invoice_or_bill_no` VARCHAR(100) NULL,
  `payment_date` DATE NOT NULL,
  `payment_status` ENUM('paid', 'partial', 'pending', 'cancelled') NOT NULL DEFAULT 'paid',
  `approved_by` VARCHAR(150) NULL,
  `recorded_by_user_id` VARCHAR(36) NULL,
  `attachment_url` TEXT NULL,
  `description` TEXT NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_payment_proj` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE RESTRICT,
  INDEX `idx_payment_date` (`payment_date`),
  INDEX `idx_payment_proj_cat` (`project_id`, `expense_category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 14. تدارکات و خرید مصالح ساختمانی (Material Purchases)
-- حل مشکل شماره ۲ اکسل: اتصال مستقیم به جدول مصارف و تأمین‌کننده
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `material_procurements`;
CREATE TABLE `material_procurements` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `procurement_code` VARCHAR(50) NOT NULL UNIQUE,
  `project_id` VARCHAR(36) NOT NULL,
  `supplier_id` VARCHAR(36) NULL,
  `supplier_name` VARCHAR(200) NOT NULL,
  `material_category` VARCHAR(100) NOT NULL,
  `item_description` VARCHAR(255) NOT NULL,
  `quantity` DECIMAL(14, 3) NOT NULL,
  `unit_of_measure` VARCHAR(50) NOT NULL,
  `unit_price` DECIMAL(14, 2) NOT NULL,
  `total_cost` DECIMAL(16, 2) NOT NULL,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'AFN',
  `is_paid` TINYINT(1) NOT NULL DEFAULT 1,
  `payment_voucher_id` VARCHAR(36) NULL COMMENT 'اتصال به سند پرداخت برای اعمال در Actual Cost',
  `bill_invoice_no` VARCHAR(100) NULL,
  `received_by` VARCHAR(150) NULL,
  `purchase_date` DATE NOT NULL,
  `bill_image_url` TEXT NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_material_proj` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE RESTRICT,
  INDEX `idx_mat_project` (`project_id`),
  INDEX `idx_mat_supplier` (`supplier_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 15. کارکرد و دستمزد کارگران (Labor Wages & Payroll)
-- حل مشکل شماره ۳ اکسل: اتصال خودکار به پرداخت‌ها و سود و زیان
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `labor_payroll`;
CREATE TABLE `labor_payroll` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `payroll_number` VARCHAR(50) NOT NULL UNIQUE,
  `project_id` VARCHAR(36) NOT NULL,
  `worker_or_team_leader` VARCHAR(200) NOT NULL,
  `work_type_description` VARCHAR(255) NOT NULL,
  `days_or_work_units` DECIMAL(10, 2) NOT NULL,
  `rate_per_unit` DECIMAL(14, 2) NOT NULL,
  `gross_amount` DECIMAL(16, 2) NOT NULL,
  `advance_deduction` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  `net_amount_paid` DECIMAL(16, 2) NOT NULL,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'AFN',
  `payment_voucher_id` VARCHAR(36) NULL,
  `payroll_date` DATE NOT NULL,
  `approved_by` VARCHAR(150) NULL,
  `is_fully_settled` TINYINT(1) NOT NULL DEFAULT 1,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_labor_proj` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE RESTRICT,
  INDEX `idx_labor_date` (`payroll_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 16. دفتر عواید و دریافت‌های مالی (Income Register & Revenue)
-- منبع محاسبه عواید پروژه و سود/زیان (Project P&L)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `revenue_entries`;
CREATE TABLE `revenue_entries` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `receipt_number` VARCHAR(50) NOT NULL UNIQUE,
  `project_id` VARCHAR(36) NOT NULL,
  `client_id` VARCHAR(36) NULL,
  `received_from` VARCHAR(255) NOT NULL,
  `income_type` ENUM('client_installment', 'apartment_sale', 'partner_equity', 'owner_capital', 'advance_payment', 'scrap_material_sale', 'miscellaneous') NOT NULL,
  `amount` DECIMAL(16, 2) NOT NULL,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'AFN',
  `exchange_rate` DECIMAL(12, 4) NOT NULL DEFAULT 1.0000,
  `amount_in_base_afn` DECIMAL(16, 2) NOT NULL,
  `payment_method` ENUM('cash', 'bank_transfer', 'cheque', 'hawala', 'other') NOT NULL DEFAULT 'bank_transfer',
  `deposit_account_id` VARCHAR(36) NOT NULL COMMENT 'اتصال به treasury_accounts',
  `reference_document_no` VARCHAR(100) NULL,
  `received_date` DATE NOT NULL,
  `recorded_by_user_id` VARCHAR(36) NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_revenue_proj` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE RESTRICT,
  INDEX `idx_revenue_date` (`received_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 17. تراکنش‌های بانکی و صندوق مرکزی (Bank & Cash Transactions Ledger)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `treasury_transactions`;
CREATE TABLE `treasury_transactions` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `transaction_code` VARCHAR(50) NOT NULL UNIQUE,
  `account_id` VARCHAR(36) NOT NULL,
  `transaction_type` ENUM('deposit', 'withdrawal', 'transfer') NOT NULL,
  `project_id` VARCHAR(36) NULL,
  `amount` DECIMAL(16, 2) NOT NULL,
  `balance_after` DECIMAL(16, 2) NOT NULL,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'AFN',
  `party_name` VARCHAR(255) NULL,
  `reference_slip_no` VARCHAR(100) NULL,
  `description` TEXT NULL,
  `transaction_date` DATE NOT NULL,
  `created_by_user_id` VARCHAR(36) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_treasury_acc` FOREIGN KEY (`account_id`) REFERENCES `treasury_accounts` (`id`) ON DELETE RESTRICT,
  INDEX `idx_treasury_date` (`transaction_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 18. تنخواه‌گردان و مصارف خرد کارگاهی (Petty Cash Register)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `petty_cash_expenses`;
CREATE TABLE `petty_cash_expenses` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `voucher_no` VARCHAR(50) NOT NULL UNIQUE,
  `project_id` VARCHAR(36) NOT NULL,
  `petty_cash_account_id` VARCHAR(36) NOT NULL,
  `expense_category` VARCHAR(100) NOT NULL,
  `amount` DECIMAL(14, 2) NOT NULL,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'AFN',
  `paid_to_person` VARCHAR(200) NOT NULL,
  `purpose` TEXT NOT NULL,
  `approved_by` VARCHAR(150) NULL,
  `receipt_photo_url` TEXT NULL,
  `expense_date` DATE NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_petty_proj` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 19. دارایی‌ها، تجهیزات و ماشین‌آلات (Assets & Equipment Register)
-- محاسبه استهلاک و رهگیری دارایی‌های کارگاه
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `assets_machinery`;
CREATE TABLE `assets_machinery` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `asset_tag_code` VARCHAR(50) NOT NULL UNIQUE,
  `asset_name` VARCHAR(200) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `assigned_project_id` VARCHAR(36) NULL,
  `purchase_date` DATE NOT NULL,
  `purchase_cost` DECIMAL(16, 2) NOT NULL,
  `current_book_value` DECIMAL(16, 2) NOT NULL,
  `salvage_value` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  `useful_life_years` INT NOT NULL DEFAULT 5,
  `serial_or_engine_no` VARCHAR(150) NULL,
  `location_site` VARCHAR(200) NULL,
  `status` ENUM('active', 'in_service', 'under_repair', 'disposed', 'rented') NOT NULL DEFAULT 'active',
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 20. حواله‌ها و انتقالات بین پروژه‌ها (Inter-Project Transfers)
-- حل مشکل شماره ۶ اکسل: اتصال کامل انتقالات به بیلان پروژه‌ها و حساب‌ها
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `project_transfers`;
CREATE TABLE `project_transfers` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `transfer_number` VARCHAR(50) NOT NULL UNIQUE,
  `from_project_id` VARCHAR(36) NOT NULL,
  `to_project_id` VARCHAR(36) NOT NULL,
  `transfer_nature` ENUM('funds', 'materials', 'equipment') NOT NULL DEFAULT 'funds',
  `amount_or_value` DECIMAL(16, 2) NOT NULL,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'AFN',
  `from_treasury_account_id` VARCHAR(36) NULL,
  `to_treasury_account_id` VARCHAR(36) NULL,
  `material_specs_json` LONGTEXT NULL,
  `transfer_date` DATE NOT NULL,
  `approved_by` VARCHAR(150) NOT NULL,
  `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'approved',
  `description` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_trans_from_proj` FOREIGN KEY (`from_project_id`) REFERENCES `projects` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_trans_to_proj` FOREIGN KEY (`to_project_id`) REFERENCES `projects` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 21. سند روزنامچه و اسناد تعدیلات حسابداری (General Journal & Adjustments)
-- حل مشکل شماره ۵ اکسل: ساختار سند دوبل حسابداری (Debit = Credit)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `journal_entries`;
CREATE TABLE `journal_entries` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `voucher_number` VARCHAR(50) NOT NULL UNIQUE,
  `entry_date` DATE NOT NULL,
  `fiscal_period_id` VARCHAR(36) NULL,
  `project_id` VARCHAR(36) NULL,
  `narration` TEXT NOT NULL,
  `total_debit` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  `total_credit` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  `is_balanced` TINYINT(1) NOT NULL DEFAULT 1,
  `is_posted` TINYINT(1) NOT NULL DEFAULT 1,
  `created_by_user_id` VARCHAR(36) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_journal_date` (`entry_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `journal_lines`;
CREATE TABLE `journal_lines` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `journal_entry_id` VARCHAR(36) NOT NULL,
  `account_id` VARCHAR(36) NOT NULL,
  `debit_amount` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  `credit_amount` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  `memo` VARCHAR(255) NULL,
  CONSTRAINT `fk_jl_entry` FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_jl_account` FOREIGN KEY (`account_id`) REFERENCES `chart_of_accounts` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 22. جدول تخصصی سیخ‌گول (Steel / Rebar Tracking - NSC Core)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `steel_procurements`;
CREATE TABLE `steel_procurements` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `project_id` VARCHAR(36) NOT NULL,
  `date` DATE NOT NULL,
  `supplier` VARCHAR(200) NOT NULL,
  `size_mm` VARCHAR(50) NOT NULL,
  `weight_tons` DECIMAL(10, 3) NOT NULL,
  `price_per_ton` DECIMAL(14, 2) NOT NULL,
  `total_cost` DECIMAL(16, 2) NOT NULL,
  `payment_status` ENUM('paid', 'pending', 'partial') NOT NULL DEFAULT 'paid',
  `truck_number` VARCHAR(100) NULL,
  `invoice_number` VARCHAR(100) NULL,
  `structural_element` VARCHAR(150) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_steel_proj` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 23. جدول تخصصی کانکریت‌ریزی (Concrete Casting - NSC Core)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `concrete_castings`;
CREATE TABLE `concrete_castings` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `project_id` VARCHAR(36) NOT NULL,
  `date` DATE NOT NULL,
  `supplier` VARCHAR(200) NOT NULL,
  `mix_type` VARCHAR(100) NOT NULL,
  `volume_m3` DECIMAL(10, 3) NOT NULL,
  `price_per_m3` DECIMAL(14, 2) NOT NULL,
  `total_cost` DECIMAL(16, 2) NOT NULL,
  `slump_cm` VARCHAR(50) NULL,
  `structural_element` VARCHAR(150) NULL,
  `payment_status` ENUM('paid', 'pending', 'partial') NOT NULL DEFAULT 'paid',
  `invoice_number` VARCHAR(100) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_concrete_proj` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 24. شرکا و سرمایه‌گذاران پروژه (Project Partners & Equity)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `project_partners`;
CREATE TABLE `project_partners` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `project_id` VARCHAR(36) NOT NULL,
  `partner_name` VARCHAR(200) NOT NULL,
  `phone` VARCHAR(50) NULL,
  `share_percentage` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  `total_investment` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  `current_balance` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_partner_proj` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `partner_investments`;
CREATE TABLE `partner_investments` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `partner_id` VARCHAR(36) NOT NULL,
  `project_id` VARCHAR(36) NOT NULL,
  `amount` DECIMAL(16, 2) NOT NULL,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'AFN',
  `deposit_date` DATE NOT NULL,
  `payment_method` VARCHAR(50) NOT NULL DEFAULT 'bank_transfer',
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_inv_partner` FOREIGN KEY (`partner_id`) REFERENCES `project_partners` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 25. مدیریت اسناد، فاکتورها و تصاویر بل‌ها (Document Archives)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `project_documents`;
CREATE TABLE `project_documents` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `document_title` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `related_entity_type` ENUM('project', 'payment', 'material', 'contractor', 'supplier', 'unit', 'general') NOT NULL,
  `related_entity_id` VARCHAR(36) NOT NULL,
  `file_url` TEXT NOT NULL,
  `file_size_kb` INT NULL,
  `file_extension` VARCHAR(20) NULL,
  `uploaded_by_user_id` VARCHAR(36) NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 26. ردپای سیستم و لاگ امنیت (System Security & Audit Trail)
-- حل مشکلات شماره ۷ و ۸ اکسل: ثبت چه کسی، چه کاری، چه زمانی و از چه آی‌پی انجام داد
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `system_audit_logs`;
CREATE TABLE `system_audit_logs` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(36) NULL,
  `user_name` VARCHAR(150) NOT NULL,
  `action` ENUM('login', 'logout', 'create', 'update', 'delete', 'lock', 'unlock', 'export', 'transfer') NOT NULL,
  `module` VARCHAR(80) NOT NULL,
  `record_id` VARCHAR(100) NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` TEXT NULL,
  `details` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_audit_user` (`user_id`),
  INDEX `idx_audit_action` (`action`),
  INDEX `idx_audit_module` (`module`),
  INDEX `idx_audit_time` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- داده‌های پایه و پیش‌فرض (SEED DATA)
-- شامل کابل پلازا، کاربران، حساب‌های اولیه و درختواره حساب‌ها
-- =====================================================================

-- ۱. مشخصات شرکت کابل پلازا
INSERT INTO `company_profiles` (`id`, `company_name`, `registration_no`, `tax_tin_number`, `primary_currency`, `secondary_currency`, `usd_to_afn_rate`, `office_phone`, `contact_email`, `official_address`, `invoice_header_note`, `invoice_footer_terms`)
VALUES (
  'company-001',
  'شرکت ساختمانی و توسعه کابل پلازا',
  'KP-CONST-2026',
  '9004829102',
  'AFN',
  'USD',
  70.0000,
  '+93 78 378 8278',
  'info@kabulplaza.af',
  'چهارراهی شهید، کابل، افغانستان',
  'سیستم مدیریت مالی، کنترل مصارف و حسابداری پروژه‌های ساختمانی',
  'تمام حساب‌ها طبق اسناد تصدیق‌شده مالی معتبر می‌باشد.'
);

-- ۲. کاربران اولیه سیستم (شامل مدیر ارشد، دفتر هفت و پرسونل)
-- پسورد پیش‌فرض هش‌شده برای 'admin123' و 'password123' با الگوریتم امن Bcrypt
INSERT INTO `users` (`id`, `owner_admin_id`, `name`, `username`, `email`, `password_hash`, `role`, `phone`, `company_name`, `subscription_plan`, `is_locked`, `is_master`, `allowed_modules_json`, `allowed_tabs_json`)
VALUES
(
  'usr-master-001',
  NULL,
  'مالک و مدیر عالی (دفتر هفت)',
  'office7',
  'master@kabulplaza.af',
  '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password
  'master',
  '+93783788278',
  'کابل پلازا',
  'lifetime',
  0,
  1,
  '{"steel":true,"concrete":true,"expenses":true,"contractors":true,"suppliers":true,"apartments":true,"payments":true,"documents":true,"reports":true,"auditLogs":true,"income":true,"materials":true,"labor":true,"treasury":true,"assets":true,"transfers":true,"journal":true}',
  '["dashboard","projects","steel","concrete","expenses","contractors","suppliers","apartments","payments","budget","documents","reports","accounting","settings","users","audit_logs","income","materials","labor","treasury","assets","transfers","journal"]'
),
(
  'usr-admin-002',
  'usr-master-001',
  'مدیر مالی و پروژه',
  'admin',
  'finance@kabulplaza.af',
  '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password
  'admin',
  '+93799112233',
  'کابل پلازا',
  'pro',
  0,
  0,
  '{"steel":true,"concrete":true,"expenses":true,"contractors":true,"suppliers":true,"apartments":true,"payments":true,"documents":true,"reports":true,"auditLogs":true,"income":true,"materials":true,"labor":true,"treasury":true,"assets":true,"transfers":true,"journal":true}',
  '["dashboard","projects","steel","concrete","expenses","contractors","suppliers","apartments","payments","budget","documents","reports","accounting","settings","users","audit_logs"]'
);

-- ۳. تنظیمات اولیه دفتر هفت برای کاربر مالک
INSERT INTO `office7_tenant_configs` (`id`, `tenant_user_id`, `gate_key_hash`, `ai_assistant_enabled`, `cloud_sync_enabled`, `max_allowed_projects`, `max_allowed_staff`, `active_modules_json`, `accessible_tabs_json`)
VALUES (
  'cfg-office7-001',
  'usr-master-001',
  '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  1,
  1,
  100,
  50,
  '{"steel":true,"concrete":true,"expenses":true,"contractors":true,"suppliers":true,"apartments":true,"payments":true,"documents":true,"reports":true,"auditLogs":true,"income":true,"materials":true,"labor":true,"treasury":true,"assets":true,"transfers":true,"journal":true}',
  '["dashboard","projects","steel","concrete","expenses","contractors","suppliers","apartments","payments","budget","documents","reports","accounting","settings","users","audit_logs"]'
);

-- ۴. پروژه نمونه کابل پلازا (Project Master P-001)
INSERT INTO `projects` (`id`, `project_code`, `name`, `client_name`, `contract_value`, `approved_budget`, `currency`, `location`, `start_date`, `expected_finish`, `status`, `project_manager`, `total_area_sqm`, `floors_count`, `notes`)
VALUES (
  'proj-001',
  'P-001',
  'برج تجاری و رهایشی کابل پلازا',
  'شرکت سرمایه‌گذاری کابل پلازا',
  100000000.00,
  80000000.00,
  'AFN',
  'کابل، چهارراهی شهید، سرک میدان هوایی',
  '2025-01-01',
  '2027-12-30',
  'active',
  'انجنیر احسان‌الله',
  18500.00,
  18,
  'پروژه شامل ۵ طبقه تجاری، ۱۲ طبقه رهایشی و پارکینگ زیرزمینی مدرن'
);

-- ۵. بودجه‌های سرفصل پروژه کابل پلازا (Project Budgets)
INSERT INTO `project_budgets` (`id`, `project_id`, `category_code`, `category_name`, `budgeted_amount`, `currency`)
VALUES
  ('bgt-001', 'proj-001', 'materials', 'مواد و مصالح ساختمانی (سیمان، ریگ، خشت و غیره)', 28000000.00, 'AFN'),
  ('bgt-002', 'proj-001', 'steel', 'سیخ‌گول و آهن‌آلات سازه', 20000000.00, 'AFN'),
  ('bgt-003', 'proj-001', 'concrete', 'کانکریت آماده و پمپاژ', 14000000.00, 'AFN'),
  ('bgt-004', 'proj-001', 'labor', 'معاشات و دستمزد کارگران و استادکاران', 10000000.00, 'AFN'),
  ('bgt-005', 'proj-001', 'subcontractor', 'قراردادهای فرعی (برق، پایپ‌دوانی، نما، لفت)', 5000000.00, 'AFN'),
  ('bgt-006', 'proj-001', 'equipment', 'کرایه ماشین‌آلات و تجهیزات سنگین', 2000000.00, 'AFN'),
  ('bgt-007', 'proj-001', 'overhead', 'مصارف اداری، جوازها و احتیاطی', 1000000.00, 'AFN');

-- ۶. حساب‌های خزانه‌داری اولیه (صندوق و بانک)
INSERT INTO `treasury_accounts` (`id`, `account_type`, `account_name`, `bank_name`, `account_number`, `currency`, `opening_balance`, `current_balance`, `custodian_name`)
VALUES
  ('acc-001', 'central_cash', 'صندوق مرکزی کارگاه کابل پلازا', NULL, NULL, 'AFN', 500000.00, 500000.00, 'احمد مسعود'),
  ('acc-002', 'bank', 'حساب جاری د افغانستان بانک', 'د افغانستان بانک', 'AFN-90281-01', 'AFN', 15000000.00, 15000000.00, 'حسابداری مرکزی'),
  ('acc-003', 'petty_cash', 'صندوق خُرد (تنخواه‌گردان ساحه)', NULL, NULL, 'AFN', 100000.00, 100000.00, 'نجیب‌الله ناظر');

-- ۷. کدینگ حساب‌های پیش‌فرض (Chart of Accounts)
INSERT INTO `chart_of_accounts` (`id`, `account_code`, `account_name`, `account_type`, `normal_balance`, `current_balance`, `is_system_locked`)
VALUES
  ('coa-101', '1010', 'موجودی نقد و صندوق', 'asset', 'debit', 500000.00, 1),
  ('coa-102', '1020', 'موجودی حساب‌های بانکی', 'asset', 'debit', 15000000.00, 1),
  ('coa-103', '1030', 'حساب‌های دریافتنی از مشتریان', 'asset', 'debit', 0.00, 1),
  ('coa-104', '1040', 'پیش‌پرداخت‌ها به تأمین‌کنندگان', 'asset', 'debit', 0.00, 1),
  ('coa-105', '1050', 'ماشین‌آلات و تجهیزات کارگاه', 'asset', 'debit', 4500000.00, 1),
  ('coa-201', '2010', 'حساب‌های پرداختنی (تأمین‌کنندگان)', 'liability', 'credit', 0.00, 1),
  ('coa-202', '2020', 'اسناد پرداختنی به مقاطعه‌کاران', 'liability', 'credit', 0.00, 1),
  ('coa-203', '2030', 'ودایع و تضمین حسن انجام کار (Retention)', 'liability', 'credit', 0.00, 1),
  ('coa-301', '3010', 'سرمایه شرکا و مالکین', 'equity', 'credit', 20000000.00, 1),
  ('coa-401', '4010', 'عواید حاصل از قرارداد و فروش واحدها', 'revenue', 'credit', 0.00, 1),
  ('coa-501', '5010', 'هزینه مصالح ساختمانی مصرفی', 'expense', 'debit', 0.00, 1),
  ('coa-502', '5020', 'هزینه دستمزد و کارکرد پرسونل', 'expense', 'debit', 0.00, 1),
  ('coa-503', '5030', 'هزینه مقاطعه‌کاران فرعی', 'expense', 'debit', 0.00, 1),
  ('coa-504', '5040', 'هزینه کرایه تجهیزات و ماشین‌آلات', 'expense', 'debit', 0.00, 1),
  ('coa-505', '5050', 'مصارف اداری و عمومی ساحه', 'expense', 'debit', 0.00, 1);

-- ۸. ثبت اولین لاگ امنیتی سیستم
INSERT INTO `system_audit_logs` (`user_id`, `user_name`, `action`, `module`, `record_id`, `ip_address`, `details`)
VALUES ('usr-master-001', 'مالک کل (دفتر هفت)', 'create', 'system', 'init', '127.0.0.1', 'راه‌اندازی موفقانه دیتابیس MySQL سیستم جامع مالی و مهندسی NSC روی هاست Shahhost');
