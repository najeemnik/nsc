-- NSC migration 001: server-side workspace persistence and security primitives.
-- Non-destructive. Run only after the base schema has been reviewed and backed up.
-- This migration creates new tables and never drops or truncates application data.

CREATE TABLE IF NOT EXISTS `nsc_schema_migrations` (
  `version` VARCHAR(100) NOT NULL PRIMARY KEY,
  `applied_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `nsc_tenant_settings` (
  `tenant_id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `default_language` ENUM('en', 'fa', 'ps') NOT NULL DEFAULT 'en',
  `settings_json` LONGTEXT NOT NULL,
  `revision` BIGINT UNSIGNED NOT NULL DEFAULT 1,
  `updated_by` VARCHAR(36) NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_nsc_tenant_settings_owner`
    FOREIGN KEY (`tenant_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_nsc_tenant_settings_updated_by`
    FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Full server-authoritative tenant state during the data migration from browser storage.
-- Snapshots are revisioned and updated with compare-and-swap to prevent lost writes.
-- User credentials, auth tokens, and server-generated audit/security records must never
-- be included in workspace_json.
CREATE TABLE IF NOT EXISTS `nsc_workspace_snapshots` (
  `tenant_id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `workspace_json` LONGTEXT NOT NULL,
  `revision` BIGINT UNSIGNED NOT NULL DEFAULT 1,
  `updated_by` VARCHAR(36) NOT NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_nsc_workspace_owner`
    FOREIGN KEY (`tenant_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_nsc_workspace_updated_by`
    FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Project- and module-specific access. No grant means no access (deny by default).
-- actions_json is validated against the server allow-list; it is never trusted as a client claim.
CREATE TABLE IF NOT EXISTS `nsc_user_project_permissions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `tenant_id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `project_id` VARCHAR(36) NOT NULL,
  `module_key` VARCHAR(64) NOT NULL,
  `actions_json` LONGTEXT NOT NULL,
  `granted_by` VARCHAR(36) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_nsc_project_grant` (`tenant_id`, `user_id`, `project_id`, `module_key`),
  KEY `idx_nsc_grant_user_project` (`tenant_id`, `user_id`, `project_id`),
  CONSTRAINT `fk_nsc_grant_tenant`
    FOREIGN KEY (`tenant_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_nsc_grant_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_nsc_grant_granted_by`
    FOREIGN KEY (`granted_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Opaque server-side sessions: only hashes are stored; raw session IDs are HttpOnly cookies.
CREATE TABLE IF NOT EXISTS `nsc_auth_sessions` (
  `session_hash` CHAR(64) NOT NULL PRIMARY KEY,
  `csrf_hash` CHAR(64) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `revoked_at` DATETIME NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_seen_at` DATETIME NULL,
  KEY `idx_nsc_session_user_expiry` (`user_id`, `expires_at`),
  CONSTRAINT `fk_nsc_session_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Login throttling by a keyed, non-reversible identifier (never store raw passwords).
CREATE TABLE IF NOT EXISTS `nsc_login_rate_limits` (
  `attempt_key` CHAR(64) NOT NULL PRIMARY KEY,
  `failure_count` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `window_started_at` DATETIME NOT NULL,
  `locked_until` DATETIME NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `nsc_schema_migrations` (`version`) VALUES ('001_workspace_persistence');
