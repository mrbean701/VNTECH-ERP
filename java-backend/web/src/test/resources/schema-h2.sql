-- ============================================================
-- VNTECH ERP — V1__baseline.sql (MySQL 8.4, utf8mb4)
-- Sinh tự động từ DATA_MODEL_REFERENCE.json (nguồn: drizzle/0000..0075)
-- Đừng sửa tay: chạy java-backend/tools/generate-flyway-baseline.mjs
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `accounting_vouchers` (
  `id` VARCHAR(64) NOT NULL,
  `voucher_no` VARCHAR(64) NOT NULL,
  `voucher_date` DATE NOT NULL,
  `voucher_type` TEXT NOT NULL,
  `project_id` VARCHAR(64) NULL,
  `description` TEXT NULL,
  `total_amount` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `status` VARCHAR(255) NOT NULL DEFAULT 'draft',
  `files_json` TEXT NULL,
  `created_by` TEXT NOT NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE (`voucher_no`)
) ;



CREATE TABLE IF NOT EXISTS `advance_requests` (
  `id` VARCHAR(64) NOT NULL,
  `request_no` VARCHAR(64) NOT NULL,
  `project_id` VARCHAR(64) NULL,
  `requester_id` VARCHAR(64) NOT NULL,
  `amount` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `purpose` TEXT NOT NULL,
  `category` VARCHAR(255) NOT NULL DEFAULT 'purchase',
  `status` VARCHAR(255) NOT NULL DEFAULT 'draft',
  `advance_paid` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `settlement_value` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `settled_at` TIMESTAMP(3) NULL,
  `note` TEXT NULL,
  `created_by` TEXT NOT NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE (`request_no`)
) ;




CREATE TABLE IF NOT EXISTS `approval_email_recipients` (
  `id` VARCHAR(64) NOT NULL,
  `project_id` VARCHAR(64) NOT NULL,
  `stage` INT NOT NULL,
  `emails` TEXT NOT NULL,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`)
) ;


CREATE TABLE IF NOT EXISTS `approval_project_assignments` (
  `id` VARCHAR(64) NOT NULL,
  `project_id` VARCHAR(64) NOT NULL,
  `stage` INT NOT NULL,
  `owner_user_id` VARCHAR(64) NOT NULL,
  `cc_emails` TEXT NULL,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `updated_by` TEXT NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE (`project_id`, `stage`)
) ;



CREATE TABLE IF NOT EXISTS `approval_stage_catalog` (
  `id` VARCHAR(64) NOT NULL,
  `stage_no` INT NOT NULL,
  `name` TEXT NOT NULL,
  `description` TEXT NULL,
  `allowed_role_codes` VARCHAR(255) NOT NULL DEFAULT '',
  `sla_hours` INT NOT NULL DEFAULT 8,
  `auto_approve_on_submit` INT NOT NULL DEFAULT 0,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  `approval_mode` VARCHAR(255) NOT NULL DEFAULT 'single',
  PRIMARY KEY (`id`)
) ;

CREATE TABLE IF NOT EXISTS `approval_stage_decisions` (
  `id` VARCHAR(64) NOT NULL,
  `request_id` VARCHAR(64) NOT NULL,
  `stage` INT NOT NULL,
  `role_code` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) NOT NULL,
  `decision` TEXT NOT NULL,
  `comment` TEXT NULL,
  `decided_at` TIMESTAMP(3) NOT NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE (`request_id`, `stage`, `role_code`)
) ;

CREATE TABLE IF NOT EXISTS `approvals` (
  `id` VARCHAR(64) NOT NULL,
  `request_id` VARCHAR(64) NOT NULL,
  `stage` INT NOT NULL,
  `department` TEXT NOT NULL,
  `approver_user_id` VARCHAR(64) NULL,
  `status` VARCHAR(255) NOT NULL DEFAULT 'pending',
  `due_at` TIMESTAMP(3) NULL,
  `decided_at` TIMESTAMP(3) NULL,
  `comment` TEXT NULL,
  `decision_snapshot` TEXT NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  `queued_at` TIMESTAMP(3) NULL,
  `notified_at` TIMESTAMP(3) NULL,
  `reminder_sent_at` TIMESTAMP(3) NULL,
  `allowed_role_codes_snapshot` TEXT NULL,
  `approval_mode_snapshot` VARCHAR(255) NOT NULL DEFAULT 'single',
  PRIMARY KEY (`id`)
) ;



CREATE TABLE IF NOT EXISTS `attachments` (
  `id` VARCHAR(64) NOT NULL,
  `entity_type` TEXT NOT NULL,
  `entity_id` VARCHAR(64) NOT NULL,
  `file_name` TEXT NOT NULL,
  `storage_key` TEXT NOT NULL,
  `mime_type` TEXT NOT NULL,
  `uploaded_by` TEXT NOT NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`)
) ;


CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) NULL,
  `action` TEXT NOT NULL,
  `entity_type` TEXT NOT NULL,
  `entity_id` VARCHAR(64) NOT NULL,
  `before_json` TEXT NULL,
  `after_json` TEXT NULL,
  `ip_address` TEXT NULL,
  `occurred_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`)
) ;



CREATE TABLE IF NOT EXISTS `bank_accounts` (
  `id` VARCHAR(64) NOT NULL,
  `code` VARCHAR(64) NOT NULL,
  `bank_name` TEXT NOT NULL,
  `account_no` VARCHAR(64) NOT NULL,
  `branch` TEXT NULL,
  `currency` VARCHAR(255) NOT NULL DEFAULT 'VND',
  `opening_balance` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_by` TEXT NOT NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE (`code`)
) ;

CREATE TABLE IF NOT EXISTS `benefit_records` (
  `id` VARCHAR(64) NOT NULL,
  `benefit_no` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) NOT NULL,
  `benefit_type` TEXT NOT NULL,
  `provider` TEXT NULL,
  `start_date` DATE NULL,
  `end_date` DATE NULL,
  `monthly_amount` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `status` VARCHAR(255) NOT NULL DEFAULT 'active',
  `note` TEXT NULL,
  `created_by` TEXT NOT NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE (`benefit_no`)
) ;


CREATE TABLE IF NOT EXISTS `boq_change_history` (
  `id` VARCHAR(64) NOT NULL,
  `project_id` VARCHAR(64) NOT NULL,
  `contract_id` VARCHAR(64) NULL,
  `boq_version_id` VARCHAR(64) NULL,
  `source_item_id` VARCHAR(64) NULL,
  `project_boq_item_id` VARCHAR(64) NULL,
  `action_type` TEXT NOT NULL,
  `before_json` TEXT NULL,
  `after_json` TEXT NULL,
  `reason` TEXT NULL,
  `actor_user_id` VARCHAR(64) NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`)
) ;


CREATE TABLE IF NOT EXISTS `boq_import_batches` (
  `id` VARCHAR(64) NOT NULL,
  `project_id` VARCHAR(64) NOT NULL,
  `version_no` INT NOT NULL,
  `source_file_name` TEXT NULL,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `row_count` INT NOT NULL DEFAULT 0,
  `imported_by` VARCHAR(64) NOT NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  `contract_id` VARCHAR(64) NULL,
  `boq_version_id` VARCHAR(64) NULL,
  PRIMARY KEY (`id`)
) ;





CREATE TABLE IF NOT EXISTS `boq_mapping_audit` (
  `id` VARCHAR(64) NOT NULL,
  `source_item_id` VARCHAR(64) NOT NULL,
  `run_id` VARCHAR(64) NULL,
  `old_material_id` VARCHAR(64) NULL,
  `new_material_id` VARCHAR(64) NOT NULL,
  `action_type` TEXT NOT NULL,
  `final_score` DECIMAL(18,4) NULL,
  `score_detail_json` TEXT NULL,
  `provider` TEXT NULL,
  `reason` TEXT NULL,
  `save_alias` INT NOT NULL DEFAULT 0,
  `actor_user_id` VARCHAR(64) NOT NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`)
) ;


CREATE TABLE IF NOT EXISTS `boq_mapping_candidates` (
  `id` VARCHAR(64) NOT NULL,
  `run_id` VARCHAR(64) NOT NULL,
  `source_item_id` VARCHAR(64) NOT NULL,
  `material_id` VARCHAR(64) NOT NULL,
  `rank_no` INT NOT NULL,
  `history_score` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `technical_score` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `system_score` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `uom_score` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `fuzzy_score` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `embedding_score` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `final_score` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `hard_conflict` INT NOT NULL DEFAULT 0,
  `conflict_reason` TEXT NULL,
  `provider` TEXT NULL,
  `status` TEXT NOT NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`)
) ;



CREATE TABLE IF NOT EXISTS `boq_mapping_runs` (
  `id` VARCHAR(64) NOT NULL,
  `batch_id` VARCHAR(64) NOT NULL,
  `project_id` VARCHAR(64) NOT NULL,
  `scope` VARCHAR(255) NOT NULL DEFAULT 'unmapped',
  `provider` TEXT NOT NULL,
  `provider_fallback` INT NOT NULL DEFAULT 0,
  `top_k` INT NOT NULL DEFAULT 5,
  `thresholds_json` TEXT NOT NULL,
  `weights_json` TEXT NOT NULL,
  `run_by` VARCHAR(64) NOT NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  `contract_id` VARCHAR(64) NULL,
  `boq_version_id` VARCHAR(64) NULL,
  PRIMARY KEY (`id`)
) ;


CREATE TABLE IF NOT EXISTS `boq_material_components` (
  `id` VARCHAR(64) NOT NULL,
  `source_item_id` VARCHAR(64) NOT NULL,
  `material_id` VARCHAR(64) NOT NULL,
  `component_type` VARCHAR(255) NOT NULL DEFAULT 'main',
  `quantity_ratio` DECIMAL(18,4) NOT NULL DEFAULT 1,
  `component_uom` TEXT NULL,
  `is_required` TINYINT(1) NOT NULL DEFAULT 1,
  `source_method` VARCHAR(255) NOT NULL DEFAULT 'manual',
  `approved_by` VARCHAR(64) NULL,
  `approved_at` TIMESTAMP(3) NULL,
  `note` TEXT NULL,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`)
) ;



CREATE TABLE IF NOT EXISTS `boq_price_import_batches` (
  `id` VARCHAR(64) NOT NULL,
  `project_id` VARCHAR(64) NOT NULL,
  `source_file_name` TEXT NULL,
  `price_type` VARCHAR(255) NOT NULL DEFAULT 'contract',
  `row_count` INT NOT NULL DEFAULT 0,
  `changed_count` INT NOT NULL DEFAULT 0,
  `unchanged_count` INT NOT NULL DEFAULT 0,
  `updated_by` VARCHAR(64) NULL,
  `created_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ;

CREATE TABLE IF NOT EXISTS `boq_price_import_items` (
  `id` VARCHAR(64) NOT NULL,
  `batch_id` VARCHAR(64) NOT NULL,
  `boq_item_id` VARCHAR(64) NOT NULL,
  `old_unit_price` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `new_unit_price` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `changed` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ;



CREATE TABLE IF NOT EXISTS `boq_source_items` (
  `id` VARCHAR(64) NOT NULL,
  `batch_id` VARCHAR(64) NOT NULL,
  `project_id` VARCHAR(64) NOT NULL,
  `source_order` INT NOT NULL,
  `source_row` INT NULL,
  `contract_line_ref` TEXT NULL,
  `row_role` VARCHAR(255) NOT NULL DEFAULT 'material',
  `boq_code` VARCHAR(64) NULL,
  `contract_code` VARCHAR(64) NULL,
  `contract_material_code` VARCHAR(64) NULL,
  `approved_material_code` VARCHAR(64) NULL,
  `contract_material_name` TEXT NULL,
  `unit` TEXT NULL,
  `contract_qty` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `remeasured_qty` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `unit_price` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `item_type` VARCHAR(255) NOT NULL DEFAULT 'contract',
  `note` TEXT NULL,
  `source_system_code` VARCHAR(64) NULL,
  `source_subgroup_name` TEXT NULL,
  `raw_source_json` TEXT NULL,
  `mapped_material_id` VARCHAR(64) NULL,
  `standard_material_name_snapshot` TEXT NULL,
  `mapping_status` VARCHAR(255) NOT NULL DEFAULT 'unmapped',
  `project_boq_item_id` VARCHAR(64) NULL,
  `mapped_by` VARCHAR(64) NULL,
  `mapped_at` TIMESTAMP(3) NULL,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  `contract_id` VARCHAR(64) NULL,
  `boq_version_id` VARCHAR(64) NULL,
  PRIMARY KEY (`id`)
) ;





CREATE TABLE IF NOT EXISTS `boq_versions` (
  `id` VARCHAR(64) NOT NULL,
  `project_id` VARCHAR(64) NOT NULL,
  `contract_id` VARCHAR(64) NOT NULL,
  `version_no` INT NOT NULL,
  `version_code` VARCHAR(64) NOT NULL,
  `version_name` TEXT NULL,
  `revision_type` VARCHAR(255) NOT NULL DEFAULT 'original',
  `source_file_name` TEXT NULL,
  `status` VARCHAR(255) NOT NULL DEFAULT 'active',
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `effective_at` TIMESTAMP(3) NULL,
  `approved_at` TIMESTAMP(3) NULL,
  `created_by` VARCHAR(64) NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE (`contract_id`, `version_no`)
) ;


CREATE TABLE IF NOT EXISTS `business_role_engine_catalog` (
  `id` VARCHAR(64) NOT NULL,
  `engine_key` TEXT NOT NULL,
  `company_code` VARCHAR(64) NOT NULL,
  `display_name` TEXT NOT NULL,
  `description` TEXT NULL,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `sort_order` INT NOT NULL DEFAULT 100,
  `system_locked` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`)
) ;

CREATE TABLE IF NOT EXISTS `business_role_group_catalog` (
  `id` VARCHAR(64) NOT NULL,
  `code` VARCHAR(64) NOT NULL,
  `name` TEXT NOT NULL,
  `description` TEXT NULL,
  `engine_role` TEXT NOT NULL,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `sort_order` INT NOT NULL DEFAULT 100,
  `system_locked` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`)
) ;

CREATE TABLE IF NOT EXISTS `business_role_group_scopes` (
  `id` VARCHAR(64) NOT NULL,
  `business_group_id` VARCHAR(64) NOT NULL,
  `business_scope_id` VARCHAR(64) NOT NULL,
  `is_primary` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE (`business_group_id`, `business_scope_id`)
) ;


CREATE TABLE IF NOT EXISTS `business_scope_catalog` (
  `id` VARCHAR(64) NOT NULL,
  `code` VARCHAR(64) NOT NULL,
  `name` TEXT NOT NULL,
  `description` TEXT NULL,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `sort_order` INT NOT NULL DEFAULT 100,
  `system_locked` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`)
) ;

-- MySQL 8.4 không hỗ trợ functional index; bỏ `business_scope_name_uq` (lower(trim(name)

CREATE TABLE IF NOT EXISTS `capital_recovery_records` (
  `id` VARCHAR(64) NOT NULL,
  `project_id` VARCHAR(64) NOT NULL,
  `period_key` TEXT NOT NULL,
  `reference_no` VARCHAR(64) NULL,
  `production_report_id` VARCHAR(64) NULL,
  `submitted_value` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `approved_value` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `invoice_no` VARCHAR(64) NULL,
  `invoice_value` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `due_date` DATE NULL,
  `status` VARCHAR(255) NOT NULL DEFAULT 'preparing',
  `note` TEXT NULL,
  `created_by` VARCHAR(64) NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`)
) ;


CREATE TABLE IF NOT EXISTS `cashbook_entries` (
  `id` VARCHAR(64) NOT NULL,
  `entry_no` VARCHAR(64) NOT NULL,
  `entry_date` DATE NOT NULL,
  `account_id` VARCHAR(64) NOT NULL,
  `entry_type` TEXT NOT NULL,
  `amount` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `counterparty` TEXT NULL,
  `reference_type` TEXT NULL,
  `reference_id` VARCHAR(64) NULL,
  `note` TEXT NULL,
  `created_by` TEXT NOT NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE (`entry_no`)
) ;



CREATE TABLE IF NOT EXISTS `central_return_items` (
  `id` VARCHAR(64) NOT NULL,
  `central_return_id` VARCHAR(64) NOT NULL,
  `material_id` VARCHAR(64) NOT NULL,
  `proposed_qty` DECIMAL(18,4) NOT NULL,
  `counted_qty` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `accepted_qty` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `rejected_qty` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `condition_status` VARCHAR(255) NOT NULL DEFAULT 'usable',
  `unit_cost` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `rejection_reason` TEXT NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  `contract_id` VARCHAR(64) NULL,
  PRIMARY KEY (`id`)
) ;


CREATE TABLE IF NOT EXISTS `central_returns` (
  `id` VARCHAR(64) NOT NULL,
  `return_no` VARCHAR(64) NOT NULL,
  `source_project_id` VARCHAR(64) NOT NULL,
  `source_warehouse_id` VARCHAR(64) NOT NULL,
  `central_warehouse_id` VARCHAR(64) NOT NULL,
  `requested_by` VARCHAR(64) NOT NULL,
  `requested_at` TIMESTAMP(3) NOT NULL,
  `approved_by` VARCHAR(64) NULL,
  `approved_at` TIMESTAMP(3) NULL,
  `received_by` VARCHAR(64) NULL,
  `received_at` TIMESTAMP(3) NULL,
  `status` VARCHAR(255) NOT NULL DEFAULT 'pending_approval',
  `note` TEXT NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`)
) ;


CREATE TABLE IF NOT EXISTS `company_settings` (
  `id` VARCHAR(64) NOT NULL,
  `company_name` TEXT NOT NULL,
  `stage_1_department` VARCHAR(255) NOT NULL DEFAULT 'BCH / Chỉ huy trưởng',
  `stage_2_department` VARCHAR(255) NOT NULL DEFAULT 'Phòng Dự án',
  `stage_3_department` VARCHAR(255) NOT NULL DEFAULT 'KH-MH / Tài chính',
  `approval_sla_hours` INT NOT NULL DEFAULT 24,
  `slow_moving_days` INT NOT NULL DEFAULT 60,
  `negative_stock_blocked` TINYINT(1) NOT NULL DEFAULT 1,
  `updated_by` TEXT NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  `stage_1_sla_hours` INT NOT NULL DEFAULT 8,
  `stage_2_sla_hours` INT NOT NULL DEFAULT 8,
  `stage_3_sla_hours` INT NOT NULL DEFAULT 8,
  `po_sla_hours` INT NOT NULL DEFAULT 24,
  `bch_confirmation_sla_hours` INT NOT NULL DEFAULT 8,
  PRIMARY KEY (`id`)
) ;

CREATE TABLE IF NOT EXISTS `construction_daily_log_items` (
  `id` VARCHAR(64) NOT NULL,
  `log_id` VARCHAR(64) NOT NULL,
  `boq_item_id` VARCHAR(64) NULL,
  `item_name` TEXT NOT NULL,
  `location` TEXT NULL,
  `planned_qty` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `completed_qty` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `unit` TEXT NULL,
  `labor_hours` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `photo_attachment_id` VARCHAR(64) NULL,
  `note` TEXT NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`)
) ;


CREATE TABLE IF NOT EXISTS `construction_daily_logs` (
  `id` VARCHAR(64) NOT NULL,
  `log_no` VARCHAR(64) NOT NULL,
  `project_id` VARCHAR(64) NOT NULL,
  `warehouse_id` VARCHAR(64) NULL,
  `work_date` DATE NOT NULL,
  `shift` VARCHAR(255) NOT NULL DEFAULT 'sang',
  `weather` TEXT NULL,
  `work_content` TEXT NULL,
  `labor_count` INT NOT NULL DEFAULT 0,
  `equipment_note` TEXT NULL,
  `status` VARCHAR(255) NOT NULL DEFAULT 'draft',
  `submitted_by` TEXT NULL,
  `approved_by` TEXT NULL,
  `approved_at` TIMESTAMP(3) NULL,
  `cancelled_by` TEXT NULL,
  `cancelled_at` TIMESTAMP(3) NULL,
  `note` TEXT NULL,
  `created_by` TEXT NOT NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE (`log_no`)
) ;



CREATE TABLE IF NOT EXISTS `contract_ownership_transfers` (
  `id` VARCHAR(64) NOT NULL,
  `transfer_no` VARCHAR(64) NOT NULL,
  `warehouse_id` VARCHAR(64) NOT NULL,
  `material_id` VARCHAR(64) NOT NULL,
  `source_project_id` VARCHAR(64) NOT NULL,
  `source_contract_id` VARCHAR(64) NOT NULL,
  `destination_project_id` VARCHAR(64) NOT NULL,
  `destination_contract_id` VARCHAR(64) NOT NULL,
  `quantity` DECIMAL(18,4) NOT NULL,
  `reason` TEXT NOT NULL,
  `source_reference_type` TEXT NULL,
  `source_reference_id` VARCHAR(64) NULL,
  `status` VARCHAR(255) NOT NULL DEFAULT 'posted',
  `posted_by` VARCHAR(64) NOT NULL,
  `posted_at` TIMESTAMP(3) NOT NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`)
) ;



CREATE TABLE IF NOT EXISTS `contract_payments` (
  `id` VARCHAR(64) NOT NULL,
  `project_id` VARCHAR(64) NOT NULL,
  `payment_date` DATE NOT NULL,
  `reference_no` VARCHAR(64) NULL,
  `description` TEXT NOT NULL,
  `amount` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `note` TEXT NULL,
  `created_by` VARCHAR(64) NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  `recovery_record_id` VARCHAR(64) NULL,
  PRIMARY KEY (`id`)
) ;



CREATE TABLE IF NOT EXISTS `contract_stock_ledger` (
  `id` VARCHAR(64) NOT NULL,
  `project_id` VARCHAR(64) NOT NULL,
  `contract_id` VARCHAR(64) NOT NULL,
  `warehouse_id` VARCHAR(64) NOT NULL,
  `material_id` VARCHAR(64) NOT NULL,
  `movement_type` TEXT NOT NULL,
  `quantity_delta` DECIMAL(18,4) NOT NULL,
  `occurred_at` TIMESTAMP(3) NOT NULL,
  `reference_type` TEXT NOT NULL,
  `reference_id` VARCHAR(64) NOT NULL,
  `reference_item_id` VARCHAR(64) NULL,
  `counterparty_contract_id` VARCHAR(64) NULL,
  `actor_user_id` VARCHAR(64) NULL,
  `note` TEXT NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`)
) ;



CREATE TABLE IF NOT EXISTS `contract_stock_reconciliations` (
  `id` VARCHAR(64) NOT NULL,
  `project_id` VARCHAR(64) NOT NULL,
  `warehouse_id` VARCHAR(64) NOT NULL,
  `material_id` VARCHAR(64) NOT NULL,
  `physical_qty` DECIMAL(18,4) NOT NULL,
  `contract_qty` DECIMAL(18,4) NOT NULL,
  `difference_qty` DECIMAL(18,4) NOT NULL,
  `status` TEXT NOT NULL,
  `checked_by` VARCHAR(64) NOT NULL,
  `checked_at` TIMESTAMP(3) NOT NULL,
  `note` TEXT NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`)
) ;


CREATE TABLE IF NOT EXISTS `custom_field_values` (
  `id` VARCHAR(64) NOT NULL,
  `form_key` TEXT NOT NULL,
  `entity_id` VARCHAR(64) NOT NULL,
  `field_key` TEXT NOT NULL,
  `value_text` TEXT NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE (`form_key`, `entity_id`, `field_key`)
) ;


CREATE TABLE IF NOT EXISTS `document_sequences` (
  `id` VARCHAR(64) NOT NULL,
  `document_type` TEXT NOT NULL,
  `project_id` VARCHAR(64) NOT NULL,
  `year` INT NOT NULL,
  `last_number` INT NOT NULL DEFAULT 0,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`)
) ;


CREATE TABLE IF NOT EXISTS `email_outbox` (
  `id` VARCHAR(64) NOT NULL,
  `request_id` VARCHAR(64) NULL,
  `stage` INT NULL,
  `event` TEXT NOT NULL,
  `recipients` TEXT NOT NULL,
  `subject` TEXT NOT NULL,
  `text_body` TEXT NOT NULL,
  `html_body` TEXT NOT NULL,
  `status` VARCHAR(255) NOT NULL DEFAULT 'queued',
  `attempt_count` INT NOT NULL DEFAULT 0,
  `next_attempt_at` TIMESTAMP(3) NULL,
  `queued_at` TIMESTAMP(3) NOT NULL,
  `sent_at` TIMESTAMP(3) NULL,
  `last_error` TEXT NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`)
) ;



CREATE TABLE IF NOT EXISTS `email_settings` (
  `id` VARCHAR(64) NOT NULL,
  `enabled` TINYINT(1) NOT NULL DEFAULT 0,
  `smtp_host` TEXT NULL,
  `smtp_port` INT NOT NULL DEFAULT 587,
  `security` VARCHAR(255) NOT NULL DEFAULT 'starttls',
  `username` TEXT NULL,
  `password` TEXT NULL,
  `sender_email` TEXT NULL,
  `sender_name` VARCHAR(255) NOT NULL DEFAULT 'MEP Warehouse',
  `base_url` TEXT NULL,
  `updated_by` TEXT NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`)
) ;

CREATE TABLE IF NOT EXISTS `form_field_config` (
  `id` VARCHAR(64) NOT NULL,
  `form_key` TEXT NOT NULL,
  `field_key` TEXT NOT NULL,
  `display_name` TEXT NOT NULL,
  `data_type` VARCHAR(255) NOT NULL DEFAULT 'text',
  `source_kind` VARCHAR(255) NOT NULL DEFAULT 'core',
  `visible` INT NOT NULL DEFAULT 1,
  `required` INT NOT NULL DEFAULT 0,
  `importable` INT NOT NULL DEFAULT 1,
  `exportable` INT NOT NULL DEFAULT 1,
  `editable` INT NOT NULL DEFAULT 1,
  `sort_order` INT NOT NULL DEFAULT 0,
  `options_json` TEXT NULL,
  `system_locked` TINYINT(1) NOT NULL DEFAULT 0,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE (`form_key`, `field_key`)
) ;

CREATE TABLE IF NOT EXISTS `goods_receipt_items` (
  `id` VARCHAR(64) NOT NULL,
  `receipt_id` VARCHAR(64) NOT NULL,
  `purchase_order_item_id` VARCHAR(64) NOT NULL,
  `received_qty` DECIMAL(18,4) NOT NULL,
  `accepted_qty` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `rejected_qty` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `lot_no` VARCHAR(64) NULL,
  `qc_result` VARCHAR(255) NOT NULL DEFAULT 'pending',
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  `contract_id` VARCHAR(64) NULL,
  `boq_version_id` VARCHAR(64) NULL,
  `boq_item_id` VARCHAR(64) NULL,
  PRIMARY KEY (`id`)
) ;



CREATE TABLE IF NOT EXISTS `goods_receipts` (
  `id` VARCHAR(64) NOT NULL,
  `receipt_no` VARCHAR(64) NOT NULL,
  `purchase_order_id` VARCHAR(64) NOT NULL,
  `warehouse_id` VARCHAR(64) NOT NULL,
  `received_by` TEXT NOT NULL,
  `received_at` TIMESTAMP(3) NOT NULL,
  `delivery_note_no` VARCHAR(64) NULL,
  `qc_status` VARCHAR(255) NOT NULL DEFAULT 'pending',
  `document_status` VARCHAR(255) NOT NULL DEFAULT 'pending',
  `posting_status` VARCHAR(255) NOT NULL DEFAULT 'unposted',
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  `certificate_status` VARCHAR(255) NOT NULL DEFAULT 'pending',
  `delivery_document_status` VARCHAR(255) NOT NULL DEFAULT 'pending',
  `bch_confirmation_status` VARCHAR(255) NOT NULL DEFAULT 'pending',
  `bch_confirmed_by` TEXT NULL,
  `bch_confirmed_at` TIMESTAMP(3) NULL,
  `bch_comment` TEXT NULL,
  `contract_id` VARCHAR(64) NULL,
  `boq_version_id` VARCHAR(64) NULL,
  PRIMARY KEY (`id`)
) ;



CREATE TABLE IF NOT EXISTS `hr_records` (
  `id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) NOT NULL,
  `full_name` TEXT NOT NULL,
  `identity_no` VARCHAR(64) NULL,
  `identity_date` DATE NULL,
  `identity_place` TEXT NULL,
  `birth_date` DATE NULL,
  `birthplace` TEXT NULL,
  `permanent_address` TEXT NULL,
  `phone` TEXT NULL,
  `education_level` TEXT NULL,
  `joined_date` DATE NULL,
  `position` TEXT NULL,
  `note` TEXT NULL,
  `created_by` TEXT NOT NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE (`user_id`)
) ;


CREATE TABLE IF NOT EXISTS `labor_contracts` (
  `id` VARCHAR(64) NOT NULL,
  `contract_no` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) NOT NULL,
  `contract_type` TEXT NOT NULL,
  `start_date` DATE NULL,
  `end_date` DATE NULL,
  `signing_date` DATE NULL,
  `salary` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `status` VARCHAR(255) NOT NULL DEFAULT 'active',
  `note` TEXT NULL,
  `created_by` TEXT NOT NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE (`contract_no`)
) ;



CREATE TABLE IF NOT EXISTS `legal_documents` (
  `id` VARCHAR(64) NOT NULL,
  `doc_no` VARCHAR(64) NOT NULL,
  `doc_type` TEXT NOT NULL,
  `title` TEXT NOT NULL,
  `issue_date` DATE NULL,
  `issuer` TEXT NULL,
  `effective_date` DATE NULL,
  `expiry_date` DATE NULL,
  `scope` TEXT NULL,
  `attachment_id` VARCHAR(64) NULL,
  `status` VARCHAR(255) NOT NULL DEFAULT 'active',
  `created_by` TEXT NOT NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE (`doc_no`)
) ;


CREATE TABLE IF NOT EXISTS `material_aliases` (
  `id` VARCHAR(64) NOT NULL,
  `material_id` VARCHAR(64) NOT NULL,
  `alias_name` TEXT NOT NULL,
  `normalized_name` TEXT NOT NULL,
  `verified` TINYINT(1) NOT NULL DEFAULT 1,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_by` VARCHAR(64) NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE (`normalized_name`)
) ;


CREATE TABLE IF NOT EXISTS `material_categories` (
  `id` VARCHAR(64) NOT NULL,
  `code` VARCHAR(64) NOT NULL,
  `name` TEXT NOT NULL,
  `description` TEXT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`)
) ;

CREATE TABLE IF NOT EXISTS `material_code_history` (
  `id` VARCHAR(64) NOT NULL,
  `material_id` VARCHAR(64) NOT NULL,
  `old_code` VARCHAR(64) NOT NULL,
  `new_code` VARCHAR(64) NOT NULL,
  `reason` TEXT NOT NULL,
  `changed_by` VARCHAR(64) NOT NULL,
  `changed_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`)
) ;


CREATE TABLE IF NOT EXISTS `material_embeddings` (
  `id` VARCHAR(64) NOT NULL,
  `material_id` VARCHAR(64) NOT NULL,
  `provider` TEXT NOT NULL,
  `model` TEXT NOT NULL,
  `semantic_hash` TEXT NOT NULL,
  `vector_json` TEXT NOT NULL,
  `dimension` INT NOT NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`)
) ;


CREATE TABLE IF NOT EXISTS `material_external_codes` (
  `id` VARCHAR(64) NOT NULL,
  `material_id` VARCHAR(64) NOT NULL,
  `code_type` TEXT NOT NULL,
  `owner_key` VARCHAR(255) NOT NULL DEFAULT '',
  `external_code` VARCHAR(64) NOT NULL,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE (`code_type`, `owner_key`, `external_code`)
) ;


CREATE TABLE IF NOT EXISTS `material_mapping_history` (
  `id` VARCHAR(64) NOT NULL,
  `material_id` VARCHAR(64) NOT NULL,
  `source_normalized` TEXT NOT NULL,
  `source_text` TEXT NOT NULL,
  `system_code` VARCHAR(64) NULL,
  `unit` TEXT NULL,
  `confirm_count` INT NOT NULL DEFAULT 1,
  `last_confirmed_by` VARCHAR(64) NOT NULL,
  `last_confirmed_at` TIMESTAMP(3) NOT NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`)
) ;



CREATE TABLE IF NOT EXISTS `material_mar_approvals` (
  `id` VARCHAR(64) NOT NULL,
  `project_id` VARCHAR(64) NOT NULL,
  `material_id` VARCHAR(64) NOT NULL,
  `approval_no` VARCHAR(64) NULL,
  `status` VARCHAR(255) NOT NULL DEFAULT 'pending',
  `approved_at` TIMESTAMP(3) NULL,
  `approved_by` TEXT NULL,
  `note` TEXT NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE (`project_id`, `material_id`)
) ;


CREATE TABLE IF NOT EXISTS `material_norms` (
  `id` VARCHAR(64) NOT NULL,
  `norm_code` VARCHAR(64) NOT NULL,
  `project_id` VARCHAR(64) NULL,
  `subcategory_id` VARCHAR(64) NULL,
  `item_name` TEXT NOT NULL,
  `material_id` VARCHAR(64) NULL,
  `base_uom` TEXT NULL,
  `quantity_per_unit` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `unit` TEXT NULL,
  `source_component_id` VARCHAR(64) NULL,
  `source_type` VARCHAR(255) NOT NULL DEFAULT 'manual',
  `notes` TEXT NULL,
  `status` VARCHAR(255) NOT NULL DEFAULT 'active',
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_by` TEXT NOT NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE (`norm_code`)
) ;




CREATE TABLE IF NOT EXISTS `material_request_items` (
  `id` VARCHAR(64) NOT NULL,
  `request_id` VARCHAR(64) NOT NULL,
  `line_no` INT NOT NULL,
  `material_id` VARCHAR(64) NOT NULL,
  `work_package_code` VARCHAR(64) NULL,
  `boq_code` VARCHAR(64) NULL,
  `route_tag` TEXT NULL,
  `installation_area` TEXT NULL,
  `requested_qty` DECIMAL(18,4) NOT NULL,
  `stock_allocation_qty` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `approved_purchase_qty` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `ordered_qty` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `received_qty` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `issued_qty` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `installed_qty` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `line_status` VARCHAR(255) NOT NULL DEFAULT 'pending',
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  `estimated_unit_price` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `contract_line_no` INT NULL,
  `origin` TEXT NULL,
  `approved_supplier` TEXT NULL,
  `note` TEXT NULL,
  `delivered_qty` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `closed_qty` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `close_reason` TEXT NULL,
  `boq_item_id` VARCHAR(64) NULL,
  `contract_id` VARCHAR(64) NULL,
  `boq_version_id` VARCHAR(64) NULL,
  PRIMARY KEY (`id`)
) ;





CREATE TABLE IF NOT EXISTS `material_requests` (
  `id` VARCHAR(64) NOT NULL,
  `request_no` VARCHAR(64) NOT NULL,
  `project_id` VARCHAR(64) NOT NULL,
  `team_id` VARCHAR(64) NULL,
  `source_warehouse_id` VARCHAR(64) NULL,
  `requested_by` TEXT NOT NULL,
  `requested_at` TIMESTAMP(3) NOT NULL,
  `needed_at` TIMESTAMP(3) NOT NULL,
  `priority` VARCHAR(255) NOT NULL DEFAULT 'normal',
  `area` TEXT NOT NULL,
  `purpose` TEXT NULL,
  `status` VARCHAR(255) NOT NULL DEFAULT 'draft',
  `approval_stage` INT NOT NULL DEFAULT 0,
  `total_estimated_value` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  `supply_status` VARCHAR(255) NOT NULL DEFAULT 'approval_pending',
  `contract_id` VARCHAR(64) NULL,
  `boq_version_id` VARCHAR(64) NULL,
  PRIMARY KEY (`id`)
) ;




CREATE TABLE IF NOT EXISTS `material_return_items` (
  `id` VARCHAR(64) NOT NULL,
  `return_id` VARCHAR(64) NOT NULL,
  `material_id` VARCHAR(64) NOT NULL,
  `quantity` DECIMAL(18,4) NOT NULL,
  `accepted_qty` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `rejected_qty` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `condition` VARCHAR(255) NOT NULL DEFAULT 'usable',
  `reason` TEXT NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  `contract_id` VARCHAR(64) NULL,
  PRIMARY KEY (`id`)
) ;


CREATE TABLE IF NOT EXISTS `material_returns` (
  `id` VARCHAR(64) NOT NULL,
  `return_no` VARCHAR(64) NOT NULL,
  `project_id` VARCHAR(64) NOT NULL,
  `team_id` VARCHAR(64) NOT NULL,
  `to_warehouse_id` VARCHAR(64) NOT NULL,
  `returned_by_name` TEXT NOT NULL,
  `received_by` TEXT NULL,
  `returned_at` TIMESTAMP(3) NOT NULL,
  `status` VARCHAR(255) NOT NULL DEFAULT 'pending',
  `note` TEXT NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`)
) ;




CREATE TABLE IF NOT EXISTS `material_subcategories` (
  `id` VARCHAR(64) NOT NULL,
  `category_id` VARCHAR(64) NOT NULL,
  `code` VARCHAR(64) NOT NULL,
  `name` TEXT NOT NULL,
  `description` TEXT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  `scope_examples` TEXT NULL,
  `review_status` VARCHAR(255) NOT NULL DEFAULT 'approved',
  `adjustment_note` TEXT NULL,
  PRIMARY KEY (`id`)
) ;



CREATE TABLE IF NOT EXISTS `material_uom_conversions` (
  `id` VARCHAR(64) NOT NULL,
  `material_id` VARCHAR(64) NOT NULL,
  `from_uom` TEXT NOT NULL,
  `to_uom` TEXT NOT NULL,
  `factor` DECIMAL(18,4) NOT NULL,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE (`material_id`, `from_uom`, `to_uom`)
) ;

CREATE TABLE IF NOT EXISTS `materials` (
  `id` VARCHAR(64) NOT NULL,
  `code` VARCHAR(64) NOT NULL,
  `name` TEXT NOT NULL,
  `system` TEXT NOT NULL,
  `specification` TEXT NULL,
  `brand` TEXT NULL,
  `unit` TEXT NOT NULL,
  `standard_price` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `min_stock` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `requires_cocq` TINYINT(1) NOT NULL DEFAULT 0,
  `requires_mar` TINYINT(1) NOT NULL DEFAULT 0,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  `category_id` VARCHAR(64) NULL,
  `subcategory_id` VARCHAR(64) NULL,
  PRIMARY KEY (`id`)
) ;




CREATE TABLE IF NOT EXISTS `menu_group_catalog` (
  `id` VARCHAR(64) NOT NULL,
  `group_key` TEXT NOT NULL,
  `name` TEXT NOT NULL,
  `icon` VARCHAR(255) NOT NULL DEFAULT '▦',
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `sort_order` INT NOT NULL DEFAULT 0,
  `collapsible` INT NOT NULL DEFAULT 1,
  `system_locked` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`)
) ;

CREATE TABLE IF NOT EXISTS `module_catalog` (
  `module_key` VARCHAR(64) NOT NULL,
  `label` TEXT NOT NULL,
  `icon` TEXT NOT NULL,
  `group_name` TEXT NULL,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `sort_order` INT NOT NULL DEFAULT 0,
  `system_locked` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  `group_key` TEXT NULL,
  PRIMARY KEY (`module_key`)
) ;

CREATE TABLE IF NOT EXISTS `official_correspondence` (
  `id` VARCHAR(64) NOT NULL,
  `doc_no` VARCHAR(64) NOT NULL,
  `direction` TEXT NOT NULL,
  `doc_type` TEXT NOT NULL,
  `issue_date` DATE NULL,
  `sender_name` TEXT NULL,
  `receiver_name` TEXT NULL,
  `summary` TEXT NULL,
  `internal_handler` TEXT NULL,
  `status` VARCHAR(255) NOT NULL DEFAULT 'received',
  `result_note` TEXT NULL,
  `created_by` TEXT NOT NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE (`doc_no`)
) ;



CREATE TABLE IF NOT EXISTS `organization_units` (
  `id` VARCHAR(64) NOT NULL,
  `code` VARCHAR(64) NOT NULL,
  `name` TEXT NOT NULL,
  `unit_type` TEXT NOT NULL,
  `parent_id` VARCHAR(64) NULL,
  `project_id` VARCHAR(64) NULL,
  `description` TEXT NULL,
  `effective_from` TEXT NULL,
  `effective_to` TEXT NULL,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `archived_at` TIMESTAMP(3) NULL,
  `sort_order` INT NOT NULL DEFAULT 100,
  `system_locked` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`)
) ;

-- MySQL 8.4 không hỗ trợ functional index; bỏ `organization_units_name_uq` (lower(trim(name)



CREATE TABLE IF NOT EXISTS `payment_plans` (
  `id` VARCHAR(64) NOT NULL,
  `plan_no` VARCHAR(64) NOT NULL,
  `project_id` VARCHAR(64) NOT NULL,
  `contract_id` VARCHAR(64) NULL,
  `po_id` VARCHAR(64) NULL,
  `milestone` TEXT NULL,
  `planned_date` DATE NULL,
  `planned_amount` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `paid_amount` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `status` VARCHAR(255) NOT NULL DEFAULT 'planned',
  `note` TEXT NULL,
  `created_by` TEXT NOT NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE (`plan_no`)
) ;



CREATE TABLE IF NOT EXISTS `procurement_allocations` (
  `id` VARCHAR(64) NOT NULL,
  `project_id` VARCHAR(64) NOT NULL,
  `contract_id` VARCHAR(64) NOT NULL,
  `boq_version_id` VARCHAR(64) NULL,
  `boq_item_id` VARCHAR(64) NULL,
  `material_id` VARCHAR(64) NOT NULL,
  `request_item_id` VARCHAR(64) NULL,
  `purchase_order_item_id` VARCHAR(64) NULL,
  `receipt_item_id` VARCHAR(64) NULL,
  `stage` TEXT NOT NULL,
  `quantity` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `reference_no` VARCHAR(64) NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`)
) ;



CREATE TABLE IF NOT EXISTS `production_reports` (
  `id` VARCHAR(64) NOT NULL,
  `project_id` VARCHAR(64) NOT NULL,
  `report_period` TEXT NOT NULL,
  `reference_no` VARCHAR(64) NULL,
  `description` TEXT NULL,
  `planned_value` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `actual_value` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `approved_value` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `status` VARCHAR(255) NOT NULL DEFAULT 'submitted',
  `submitted_by` VARCHAR(64) NULL,
  `approved_by` VARCHAR(64) NULL,
  `approved_at` TIMESTAMP(3) NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE (`project_id`, `report_period`)
) ;


CREATE TABLE IF NOT EXISTS `project_archives` (
  `id` VARCHAR(64) NOT NULL,
  `project_id` VARCHAR(64) NOT NULL,
  `project_code` VARCHAR(64) NOT NULL,
  `project_name` TEXT NOT NULL,
  `file_name` TEXT NOT NULL,
  `sha256` TEXT NOT NULL,
  `byte_size` INT NOT NULL DEFAULT 0,
  `record_count` INT NOT NULL DEFAULT 0,
  `attachment_count` INT NOT NULL DEFAULT 0,
  `schema_version` TEXT NOT NULL,
  `status` VARCHAR(255) NOT NULL DEFAULT 'verified',
  `generated_by` TEXT NOT NULL,
  `generated_at` TIMESTAMP(3) NOT NULL,
  `downloaded_at` TIMESTAMP(3) NULL,
  `purged_at` TIMESTAMP(3) NULL,
  `purge_audit_id` VARCHAR(64) NULL,
  PRIMARY KEY (`id`)
) ;



CREATE TABLE IF NOT EXISTS `project_boq_items` (
  `id` VARCHAR(64) NOT NULL,
  `project_id` VARCHAR(64) NOT NULL,
  `line_no` INT NOT NULL,
  `boq_code` VARCHAR(64) NULL,
  `contract_code` VARCHAR(64) NULL,
  `material_id` VARCHAR(64) NOT NULL,
  `description` TEXT NULL,
  `contract_qty` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `unit_price` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `note` TEXT NULL,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  `item_type` VARCHAR(255) NOT NULL DEFAULT 'contract',
  `remeasured_qty` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `variation_status` VARCHAR(255) NOT NULL DEFAULT 'none',
  `variation_ref` TEXT NULL,
  `variation_approved_at` TIMESTAMP(3) NULL,
  `contract_material_code` VARCHAR(64) NULL,
  `approved_material_code` VARCHAR(64) NULL,
  `source_order` INT NULL,
  `contract_line_ref` TEXT NULL,
  `row_role` VARCHAR(255) NOT NULL DEFAULT 'material',
  `parent_source_order` INT NULL,
  `outline_level` INT NOT NULL DEFAULT 0,
  `source_sheet` TEXT NULL,
  `source_row` INT NULL,
  `contract_id` VARCHAR(64) NULL,
  `boq_version_id` VARCHAR(64) NULL,
  `source_item_id` VARCHAR(64) NULL,
  PRIMARY KEY (`id`)
) ;





CREATE TABLE IF NOT EXISTS `project_close_checks` (
  `id` VARCHAR(64) NOT NULL,
  `project_id` VARCHAR(64) NOT NULL,
  `check_key` TEXT NOT NULL,
  `status` VARCHAR(255) NOT NULL DEFAULT 'pending',
  `detail` TEXT NULL,
  `checked_by` TEXT NULL,
  `checked_at` TIMESTAMP(3) NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE (`project_id`, `check_key`)
) ;

CREATE TABLE IF NOT EXISTS `project_contracts` (
  `id` VARCHAR(64) NOT NULL,
  `project_id` VARCHAR(64) NOT NULL,
  `contract_no` VARCHAR(64) NOT NULL,
  `contract_name` TEXT NOT NULL,
  `contract_type` VARCHAR(255) NOT NULL DEFAULT 'main',
  `parent_contract_id` VARCHAR(64) NULL,
  `status` VARCHAR(255) NOT NULL DEFAULT 'active',
  `is_primary` TINYINT(1) NOT NULL DEFAULT 0,
  `signed_at` TIMESTAMP(3) NULL,
  `effective_from` TEXT NULL,
  `effective_to` TEXT NULL,
  `note` TEXT NULL,
  `created_by` VARCHAR(64) NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE (`project_id`, `contract_no`)
) ;


CREATE TABLE IF NOT EXISTS `projects` (
  `id` VARCHAR(64) NOT NULL,
  `code` VARCHAR(64) NOT NULL,
  `name` TEXT NOT NULL,
  `status` VARCHAR(255) NOT NULL DEFAULT 'active',
  `manager_user_id` VARCHAR(64) NULL,
  `start_date` DATE NULL,
  `planned_end_date` DATE NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  `contract_no` VARCHAR(64) NULL,
  `contract_name` TEXT NULL,
  PRIMARY KEY (`id`)
) ;


CREATE TABLE IF NOT EXISTS `purchase_order_items` (
  `id` VARCHAR(64) NOT NULL,
  `purchase_order_id` VARCHAR(64) NOT NULL,
  `request_item_id` VARCHAR(64) NOT NULL,
  `line_no` INT NOT NULL,
  `ordered_qty` DECIMAL(18,4) NOT NULL,
  `unit_price` DECIMAL(18,4) NOT NULL,
  `received_qty` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `status` VARCHAR(255) NOT NULL DEFAULT 'ordered',
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  `system_code` VARCHAR(64) NULL,
  `planned_delivery_at` TIMESTAMP(3) NULL,
  `delivered_qty` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `closed_qty` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `close_reason` TEXT NULL,
  `closed_by` VARCHAR(64) NULL,
  `closed_at` TIMESTAMP(3) NULL,
  `contract_id` VARCHAR(64) NULL,
  `boq_version_id` VARCHAR(64) NULL,
  `boq_item_id` VARCHAR(64) NULL,
  PRIMARY KEY (`id`)
) ;




CREATE TABLE IF NOT EXISTS `purchase_orders` (
  `id` VARCHAR(64) NOT NULL,
  `po_no` VARCHAR(64) NOT NULL,
  `project_id` VARCHAR(64) NOT NULL,
  `supplier_id` VARCHAR(64) NOT NULL,
  `receiving_warehouse_id` VARCHAR(64) NOT NULL,
  `buyer_user_id` VARCHAR(64) NOT NULL,
  `ordered_at` TIMESTAMP(3) NOT NULL,
  `eta` TEXT NULL,
  `status` VARCHAR(255) NOT NULL DEFAULT 'draft',
  `total_value` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  `request_id` VARCHAR(64) NULL,
  `delivery_queued_at` TIMESTAMP(3) NULL,
  `delivery_completed_at` TIMESTAMP(3) NULL,
  `contract_id` VARCHAR(64) NULL,
  `boq_version_id` VARCHAR(64) NULL,
  PRIMARY KEY (`id`)
) ;




CREATE TABLE IF NOT EXISTS `request_comments` (
  `id` VARCHAR(64) NOT NULL,
  `request_id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) NOT NULL,
  `comment` TEXT NOT NULL,
  `visibility` VARCHAR(255) NOT NULL DEFAULT 'internal',
  `created_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`)
) ;


CREATE TABLE IF NOT EXISTS `role_catalog` (
  `id` VARCHAR(64) NOT NULL,
  `code` VARCHAR(64) NOT NULL,
  `name` TEXT NOT NULL,
  `description` TEXT NULL,
  `base_role` VARCHAR(255) NOT NULL DEFAULT 'engineer',
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `sort_order` INT NOT NULL DEFAULT 0,
  `system_locked` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  `business_group_id` VARCHAR(64) NULL,
  `warehouse_scope_kind` TEXT NULL,
  `default_organization_unit_id` VARCHAR(64) NULL,
  PRIMARY KEY (`id`)
) ;

CREATE TABLE IF NOT EXISTS `seal_management` (
  `id` VARCHAR(64) NOT NULL,
  `seal_no` VARCHAR(64) NOT NULL,
  `seal_name` TEXT NOT NULL,
  `seal_type` TEXT NOT NULL,
  `custodian` TEXT NULL,
  `registered_date` DATE NULL,
  `status` VARCHAR(255) NOT NULL DEFAULT 'active',
  `usage_note` TEXT NULL,
  `created_by` TEXT NOT NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE (`seal_no`)
) ;

CREATE TABLE IF NOT EXISTS `server_deployment_metadata` (
  `id` VARCHAR(64) NOT NULL,
  `deployment_mode` TEXT NOT NULL,
  `database_engine` TEXT NOT NULL,
  `storage_mode` TEXT NOT NULL,
  `public_url` TEXT NULL,
  `node_name` TEXT NULL,
  `installed_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`)
) ;

CREATE TABLE IF NOT EXISTS `sessions` (
  `id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) NOT NULL,
  `token_hash` TEXT NOT NULL,
  `expires_at` TIMESTAMP(3) NOT NULL,
  `ip_address` TEXT NULL,
  `user_agent` TEXT NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  `last_seen_at` TIMESTAMP(3) NULL,
  PRIMARY KEY (`id`)
) ;



CREATE TABLE IF NOT EXISTS `site_expense_claims` (
  `id` VARCHAR(64) NOT NULL,
  `claim_no` VARCHAR(64) NOT NULL,
  `project_id` VARCHAR(64) NOT NULL,
  `cost_type` TEXT NOT NULL,
  `amount` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `paid_by` TEXT NULL,
  `claim_date` DATE NULL,
  `description` TEXT NULL,
  `voucher_attachment_id` VARCHAR(64) NULL,
  `status` VARCHAR(255) NOT NULL DEFAULT 'draft',
  `approved_by` TEXT NULL,
  `approved_at` TIMESTAMP(3) NULL,
  `created_by` TEXT NOT NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE (`claim_no`)
) ;




CREATE TABLE IF NOT EXISTS `stock_count_items` (
  `id` VARCHAR(64) NOT NULL,
  `stock_count_id` VARCHAR(64) NOT NULL,
  `material_id` VARCHAR(64) NOT NULL,
  `book_qty_snapshot` DECIMAL(18,4) NOT NULL,
  `actual_qty` DECIMAL(18,4) NOT NULL,
  `variance_qty` DECIMAL(18,4) NOT NULL,
  `reason` TEXT NULL,
  `approved_adjustment_qty` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`)
) ;


CREATE TABLE IF NOT EXISTS `stock_counts` (
  `id` VARCHAR(64) NOT NULL,
  `count_no` VARCHAR(64) NOT NULL,
  `project_id` VARCHAR(64) NOT NULL,
  `warehouse_id` VARCHAR(64) NOT NULL,
  `count_type` TEXT NOT NULL,
  `counted_at` TIMESTAMP(3) NOT NULL,
  `status` VARCHAR(255) NOT NULL DEFAULT 'draft',
  `approved_by` TEXT NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`)
) ;



CREATE TABLE IF NOT EXISTS `stock_issue_items` (
  `id` VARCHAR(64) NOT NULL,
  `issue_id` VARCHAR(64) NOT NULL,
  `material_id` VARCHAR(64) NOT NULL,
  `request_item_id` VARCHAR(64) NULL,
  `quantity` DECIMAL(18,4) NOT NULL,
  `installed_qty` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `work_package_code` VARCHAR(64) NULL,
  `installation_area` TEXT NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  `contract_id` VARCHAR(64) NULL,
  PRIMARY KEY (`id`)
) ;



CREATE TABLE IF NOT EXISTS `stock_issues` (
  `id` VARCHAR(64) NOT NULL,
  `issue_no` VARCHAR(64) NOT NULL,
  `project_id` VARCHAR(64) NOT NULL,
  `from_warehouse_id` VARCHAR(64) NOT NULL,
  `team_id` VARCHAR(64) NOT NULL,
  `request_id` VARCHAR(64) NULL,
  `issued_by` TEXT NOT NULL,
  `received_by_name` TEXT NOT NULL,
  `approved_by` TEXT NULL,
  `issued_at` TIMESTAMP(3) NOT NULL,
  `status` VARCHAR(255) NOT NULL DEFAULT 'draft',
  `signed_at` TIMESTAMP(3) NULL,
  `note` TEXT NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`)
) ;




CREATE TABLE IF NOT EXISTS `stock_movements` (
  `id` VARCHAR(64) NOT NULL,
  `project_id` VARCHAR(64) NOT NULL,
  `material_id` VARCHAR(64) NOT NULL,
  `from_warehouse_id` VARCHAR(64) NULL,
  `to_warehouse_id` VARCHAR(64) NULL,
  `movement_type` TEXT NOT NULL,
  `quantity` DECIMAL(18,4) NOT NULL,
  `unit_cost` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `occurred_at` TIMESTAMP(3) NOT NULL,
  `reference_type` TEXT NOT NULL,
  `reference_id` VARCHAR(64) NOT NULL,
  `posted_by` TEXT NOT NULL,
  `reversal_of_id` VARCHAR(64) NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  `contract_id` VARCHAR(64) NULL,
  `destination_contract_id` VARCHAR(64) NULL,
  PRIMARY KEY (`id`)
) ;




-- index trùng tên `stock_movements_reference_idx` (bỏ lần tạo thứ 2)


CREATE TABLE IF NOT EXISTS `stock_reservations` (
  `id` VARCHAR(64) NOT NULL,
  `project_id` VARCHAR(64) NOT NULL,
  `warehouse_id` VARCHAR(64) NOT NULL,
  `material_id` VARCHAR(64) NOT NULL,
  `request_id` VARCHAR(64) NULL,
  `request_item_id` VARCHAR(64) NULL,
  `quantity` DECIMAL(18,4) NOT NULL,
  `status` VARCHAR(255) NOT NULL DEFAULT 'active',
  `reserved_at` TIMESTAMP(3) NOT NULL,
  `released_at` TIMESTAMP(3) NULL,
  `created_by` TEXT NOT NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`)
) ;



CREATE TABLE IF NOT EXISTS `suppliers` (
  `id` VARCHAR(64) NOT NULL,
  `code` VARCHAR(64) NOT NULL,
  `name` TEXT NOT NULL,
  `tax_code` VARCHAR(64) NULL,
  `contact_name` TEXT NULL,
  `phone` TEXT NULL,
  `lead_time_days` INT NOT NULL DEFAULT 0,
  `rating` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`)
) ;


CREATE TABLE IF NOT EXISTS `supply_workflow_steps` (
  `id` VARCHAR(64) NOT NULL,
  `request_id` VARCHAR(64) NOT NULL,
  `purchase_order_id` VARCHAR(64) NULL,
  `receipt_id` VARCHAR(64) NULL,
  `step` TEXT NOT NULL,
  `status` VARCHAR(255) NOT NULL DEFAULT 'pending',
  `queued_at` TIMESTAMP(3) NOT NULL,
  `due_at` TIMESTAMP(3) NULL,
  `completed_at` TIMESTAMP(3) NULL,
  `completed_by` TEXT NULL,
  `comment` TEXT NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`)
) ;



CREATE TABLE IF NOT EXISTS `task_notifications` (
  `id` VARCHAR(64) NOT NULL,
  `work_item_id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) NOT NULL,
  `channel` VARCHAR(255) NOT NULL DEFAULT 'in_app',
  `title` TEXT NOT NULL,
  `body` TEXT NOT NULL,
  `status` VARCHAR(255) NOT NULL DEFAULT 'PENDING',
  `read_at` TIMESTAMP(3) NULL,
  `sent_at` TIMESTAMP(3) NULL,
  `last_error` TEXT NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`)
) ;


CREATE TABLE IF NOT EXISTS `task_sla_policies` (
  `department_code` VARCHAR(64) NOT NULL,
  `status` VARCHAR(64) NOT NULL,
  `responsibility_clock_runs` INT NOT NULL DEFAULT 1,
  `process_clock_runs` INT NOT NULL DEFAULT 1,
  `requires_reason` TINYINT(1) NOT NULL DEFAULT 0,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`department_code`, `status`)
) ;

CREATE TABLE IF NOT EXISTS `team_payments` (
  `id` VARCHAR(64) NOT NULL,
  `project_id` VARCHAR(64) NOT NULL,
  `team_id` VARCHAR(64) NOT NULL,
  `subcontract_id` VARCHAR(64) NOT NULL,
  `production_record_id` VARCHAR(64) NULL,
  `payment_date` DATE NOT NULL,
  `payment_type` VARCHAR(255) NOT NULL DEFAULT 'progress',
  `reference_no` VARCHAR(64) NULL,
  `description` TEXT NOT NULL,
  `amount` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `note` TEXT NULL,
  `created_by` VARCHAR(64) NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`)
) ;


CREATE TABLE IF NOT EXISTS `team_production_records` (
  `id` VARCHAR(64) NOT NULL,
  `project_id` VARCHAR(64) NOT NULL,
  `team_id` VARCHAR(64) NOT NULL,
  `subcontract_id` VARCHAR(64) NOT NULL,
  `period_key` TEXT NOT NULL,
  `reference_no` VARCHAR(64) NULL,
  `description` TEXT NULL,
  `submitted_value` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `approved_value` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `status` VARCHAR(255) NOT NULL DEFAULT 'submitted',
  `submitted_by` VARCHAR(64) NULL,
  `approved_by` VARCHAR(64) NULL,
  `approved_at` TIMESTAMP(3) NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE (`subcontract_id`, `period_key`)
) ;


CREATE TABLE IF NOT EXISTS `team_settlements` (
  `id` VARCHAR(64) NOT NULL,
  `project_id` VARCHAR(64) NOT NULL,
  `team_id` VARCHAR(64) NOT NULL,
  `subcontract_id` VARCHAR(64) NOT NULL,
  `settlement_no` VARCHAR(64) NOT NULL,
  `approved_production_value` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `adjustment_value` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `final_value` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `paid_value` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `remaining_value` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `status` VARCHAR(255) NOT NULL DEFAULT 'draft',
  `settled_at` TIMESTAMP(3) NULL,
  `note` TEXT NULL,
  `created_by` VARCHAR(64) NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE (`subcontract_id`, `settlement_no`)
) ;


CREATE TABLE IF NOT EXISTS `team_subcontracts` (
  `id` VARCHAR(64) NOT NULL,
  `project_id` VARCHAR(64) NOT NULL,
  `team_id` VARCHAR(64) NOT NULL,
  `contract_no` VARCHAR(64) NOT NULL,
  `contract_name` TEXT NOT NULL,
  `scope_text` TEXT NULL,
  `contract_value` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `start_date` DATE NULL,
  `end_date` DATE NULL,
  `status` VARCHAR(255) NOT NULL DEFAULT 'draft',
  `signed_at` TIMESTAMP(3) NULL,
  `note` TEXT NULL,
  `created_by` VARCHAR(64) NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE (`project_id`, `contract_no`)
) ;


CREATE TABLE IF NOT EXISTS `teams` (
  `id` VARCHAR(64) NOT NULL,
  `code` VARCHAR(64) NOT NULL,
  `name` TEXT NOT NULL,
  `trade` TEXT NOT NULL,
  `project_id` VARCHAR(64) NOT NULL,
  `warehouse_id` VARCHAR(64) NOT NULL,
  `leader_user_id` VARCHAR(64) NULL,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`)
) ;




CREATE TABLE IF NOT EXISTS `transfer_order_items` (
  `id` VARCHAR(64) NOT NULL,
  `transfer_order_id` VARCHAR(64) NOT NULL,
  `material_id` VARCHAR(64) NOT NULL,
  `requested_qty` DECIMAL(18,4) NOT NULL,
  `approved_qty` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `shipped_qty` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `received_qty` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `rejected_qty` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `lost_qty` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `note` TEXT NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  `source_contract_id` VARCHAR(64) NULL,
  `destination_contract_id` VARCHAR(64) NULL,
  PRIMARY KEY (`id`)
) ;


CREATE TABLE IF NOT EXISTS `transfer_orders` (
  `id` VARCHAR(64) NOT NULL,
  `transfer_no` VARCHAR(64) NOT NULL,
  `source_warehouse_id` VARCHAR(64) NOT NULL,
  `destination_warehouse_id` VARCHAR(64) NOT NULL,
  `source_project_id` VARCHAR(64) NULL,
  `destination_project_id` VARCHAR(64) NULL,
  `transit_warehouse_id` VARCHAR(64) NOT NULL,
  `requested_by` TEXT NOT NULL,
  `requested_at` TIMESTAMP(3) NOT NULL,
  `approved_by` TEXT NULL,
  `approved_at` TIMESTAMP(3) NULL,
  `shipped_by` TEXT NULL,
  `shipped_at` TIMESTAMP(3) NULL,
  `received_by` TEXT NULL,
  `received_at` TIMESTAMP(3) NULL,
  `status` VARCHAR(255) NOT NULL DEFAULT 'requested',
  `reason` TEXT NULL,
  `note` TEXT NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE (`transfer_no`)
) ;




CREATE TABLE IF NOT EXISTS `ui_display_settings` (
  `id` VARCHAR(64) NOT NULL,
  `scope_key` TEXT NOT NULL,
  `settings_json` TEXT NOT NULL,
  `updated_by` TEXT NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`)
) ;

CREATE TABLE IF NOT EXISTS `user_module_permissions` (
  `id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) NOT NULL,
  `module_key` TEXT NOT NULL,
  `can_view` INT NOT NULL DEFAULT 0,
  `can_use` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  `can_create` INT NOT NULL DEFAULT 0,
  `can_edit` INT NOT NULL DEFAULT 0,
  `can_approve` INT NOT NULL DEFAULT 0,
  `can_export` INT NOT NULL DEFAULT 0,
  `permission_expires_at` TIMESTAMP(3) NULL,
  `permission_source` VARCHAR(255) NOT NULL DEFAULT 'manual_override',
  PRIMARY KEY (`id`)
) ;


CREATE TABLE IF NOT EXISTS `user_project_scopes` (
  `id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) NOT NULL,
  `project_id` VARCHAR(64) NOT NULL,
  `permission` VARCHAR(255) NOT NULL DEFAULT 'read',
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`)
) ;


CREATE TABLE IF NOT EXISTS `user_warehouse_scopes` (
  `id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) NOT NULL,
  `warehouse_id` VARCHAR(64) NOT NULL,
  `permission` VARCHAR(255) NOT NULL DEFAULT 'read',
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE (`user_id`, `warehouse_id`)
) ;


CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(64) NOT NULL,
  `employee_code` VARCHAR(64) NOT NULL,
  `full_name` TEXT NOT NULL,
  `username` TEXT NOT NULL,
  `password_hash` TEXT NULL,
  `role` TEXT NOT NULL,
  `department` TEXT NOT NULL,
  `approval_limit` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  `email` TEXT NULL,
  `avatar_url` TEXT NULL,
  `organization_unit_id` VARCHAR(64) NULL,
  `must_change_password` INT NOT NULL DEFAULT 0,
  `password_reset_at` TIMESTAMP(3) NULL,
  `password_reset_by` TEXT NULL,
  PRIMARY KEY (`id`)
) ;




CREATE TABLE IF NOT EXISTS `vntech_attestation_events` (
  `id` VARCHAR(64) NOT NULL,
  `license_id` VARCHAR(64) NULL,
  `machine_fingerprint` TEXT NULL,
  `request_nonce` TEXT NULL,
  `server_response_json` TEXT NULL,
  `status` TEXT NOT NULL,
  `attempted_at` TIMESTAMP(3) NOT NULL,
  `next_attempt_at` TIMESTAMP(3) NULL,
  `error_message` TEXT NULL,
  PRIMARY KEY (`id`)
) ;

CREATE TABLE IF NOT EXISTS `vntech_license_installations` (
  `id` VARCHAR(64) NOT NULL,
  `license_id` VARCHAR(64) NOT NULL,
  `tenant_id` VARCHAR(64) NOT NULL,
  `company_code` VARCHAR(64) NOT NULL,
  `product_id` VARCHAR(64) NOT NULL,
  `key_id` VARCHAR(64) NOT NULL,
  `payload_json` TEXT NOT NULL,
  `signature_base64` TEXT NOT NULL,
  `status` TEXT NOT NULL,
  `valid_from` TEXT NULL,
  `valid_until` TEXT NULL,
  `machine_fingerprint` TEXT NULL,
  `verification_detail_json` TEXT NULL,
  `installed_by` TEXT NULL,
  `installed_at` TIMESTAMP(3) NOT NULL,
  `last_verified_at` TIMESTAMP(3) NULL,
  `revoked_at` TIMESTAMP(3) NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`)
) ;


CREATE TABLE IF NOT EXISTS `vntech_license_transfer_requests` (
  `id` VARCHAR(64) NOT NULL,
  `license_id` VARCHAR(64) NULL,
  `source_machine_fingerprint` TEXT NULL,
  `destination_machine_fingerprint` TEXT NULL,
  `recovery_code_hash` TEXT NULL,
  `reason` TEXT NOT NULL,
  `status` VARCHAR(255) NOT NULL DEFAULT 'requested',
  `requested_by` TEXT NULL,
  `requested_at` TIMESTAMP(3) NOT NULL,
  `approved_at` TIMESTAMP(3) NULL,
  `completed_at` TIMESTAMP(3) NULL,
  `detail_json` TEXT NULL,
  PRIMARY KEY (`id`)
) ;

CREATE TABLE IF NOT EXISTS `vntech_product_identity` (
  `id` VARCHAR(64) NOT NULL,
  `legal_owner` TEXT NOT NULL,
  `product_name` TEXT NOT NULL,
  `product_description` TEXT NOT NULL,
  `version` TEXT NOT NULL,
  `source_fingerprint` TEXT NOT NULL,
  `source_fingerprint_short` TEXT NOT NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`)
) ;

CREATE TABLE IF NOT EXISTS `vntech_release_signatures` (
  `id` VARCHAR(64) NOT NULL,
  `release_fingerprint` TEXT NOT NULL,
  `manifest_sha256` TEXT NOT NULL,
  `key_id` VARCHAR(64) NOT NULL,
  `signature_base64` TEXT NULL,
  `verification_status` VARCHAR(255) NOT NULL DEFAULT 'unsigned_development',
  `verified_at` TIMESTAMP(3) NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`)
) ;

CREATE TABLE IF NOT EXISTS `vntech_trust_audit` (
  `id` VARCHAR(64) NOT NULL,
  `event_type` TEXT NOT NULL,
  `actor_user_id` VARCHAR(64) NULL,
  `trust_mode` TEXT NOT NULL,
  `enforcement_enabled` INT NOT NULL,
  `license_id` VARCHAR(64) NULL,
  `machine_fingerprint` TEXT NULL,
  `detail_json` TEXT NULL,
  `occurred_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`)
) ;

CREATE TABLE IF NOT EXISTS `vntech_trust_settings` (
  `id` VARCHAR(64) NOT NULL,
  `trust_mode` VARCHAR(255) NOT NULL DEFAULT 'development',
  `enforcement_enabled` INT NOT NULL DEFAULT 0,
  `tenant_id` VARCHAR(64) NOT NULL,
  `company_code` VARCHAR(64) NOT NULL,
  `key_id` VARCHAR(64) NOT NULL,
  `algorithm` TEXT NOT NULL,
  `public_key_pem` TEXT NOT NULL,
  `brand_fingerprint` TEXT NOT NULL,
  `release_fingerprint` TEXT NOT NULL,
  `machine_fingerprint` TEXT NULL,
  `hardware_binding_mode` VARCHAR(255) NOT NULL DEFAULT 'foundation',
  `native_verifier_mode` VARCHAR(255) NOT NULL DEFAULT 'foundation',
  `online_attestation_enabled` INT NOT NULL DEFAULT 0,
  `license_server_url` TEXT NULL,
  `last_attested_at` TIMESTAMP(3) NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`)
) ;

CREATE TABLE IF NOT EXISTS `warehouse_locations` (
  `id` VARCHAR(64) NOT NULL,
  `warehouse_id` VARCHAR(64) NOT NULL,
  `code` VARCHAR(64) NOT NULL,
  `name` TEXT NOT NULL,
  `location_type` VARCHAR(255) NOT NULL DEFAULT 'bin',
  `secure` INT NOT NULL DEFAULT 0,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE (`warehouse_id`, `code`)
) ;

CREATE TABLE IF NOT EXISTS `warehouses` (
  `id` VARCHAR(64) NOT NULL,
  `code` VARCHAR(64) NOT NULL,
  `name` TEXT NOT NULL,
  `type` TEXT NOT NULL,
  `project_id` VARCHAR(64) NULL,
  `parent_warehouse_id` VARCHAR(64) NULL,
  `keeper_user_id` VARCHAR(64) NULL,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`)
) ;



CREATE TABLE IF NOT EXISTS `work_item_events` (
  `id` VARCHAR(64) NOT NULL,
  `work_item_id` VARCHAR(64) NOT NULL,
  `event_type` TEXT NOT NULL,
  `from_status` TEXT NULL,
  `to_status` TEXT NULL,
  `actor_user_id` VARCHAR(64) NOT NULL,
  `previous_assignee` TEXT NULL,
  `new_assignee` TEXT NULL,
  `reason` TEXT NULL,
  `detail_json` TEXT NULL,
  `occurred_at` TIMESTAMP(3) NOT NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`)
) ;


CREATE TABLE IF NOT EXISTS `work_items` (
  `id` VARCHAR(64) NOT NULL,
  `task_no` VARCHAR(64) NOT NULL,
  `department_code` VARCHAR(64) NOT NULL,
  `work_group` TEXT NOT NULL,
  `title` TEXT NOT NULL,
  `description` TEXT NULL,
  `project_id` VARCHAR(64) NULL,
  `source_module` TEXT NULL,
  `source_type` TEXT NULL,
  `source_id` VARCHAR(64) NULL,
  `source_no` VARCHAR(64) NULL,
  `work_step` TEXT NOT NULL,
  `dedupe_key` TEXT NOT NULL,
  `task_origin` VARCHAR(255) NOT NULL DEFAULT 'manual',
  `assigned_to` TEXT NOT NULL,
  `assigned_by` TEXT NOT NULL,
  `assigned_at` TIMESTAMP(3) NOT NULL,
  `due_at` TIMESTAMP(3) NULL,
  `priority` VARCHAR(255) NOT NULL DEFAULT 'normal',
  `status` VARCHAR(255) NOT NULL DEFAULT 'NEW',
  `progress` INT NOT NULL DEFAULT 0,
  `required_output` TEXT NULL,
  `waiting_reason` TEXT NULL,
  `waiting_started_at` TIMESTAMP(3) NULL,
  `submitted_at` TIMESTAMP(3) NULL,
  `completed_at` TIMESTAMP(3) NULL,
  `completed_by` TEXT NULL,
  `cancelled_at` TIMESTAMP(3) NULL,
  `cancelled_by` TEXT NULL,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE (`task_no`),
  UNIQUE (`dedupe_key`)
) ;




SET FOREIGN_KEY_CHECKS = 1;

-- Baseline tạo bởi generator — bảng: 114

-- Giữ ràng buộc UNIQUE rời của MySQL (bản trước bỏ sót nên H2 lỏng hơn MySQL).
CREATE UNIQUE INDEX IF NOT EXISTS `approval_email_recipients_scope_uidx` ON `approval_email_recipients` (`project_id`, `stage`);
CREATE UNIQUE INDEX IF NOT EXISTS `approvals_request_stage_uidx` ON `approvals` (`request_id`, `stage`);
CREATE UNIQUE INDEX IF NOT EXISTS `boq_import_batches_project_version_uidx` ON `boq_import_batches` (`project_id`, `version_no`);
CREATE UNIQUE INDEX IF NOT EXISTS `boq_import_batches_contract_version_uidx` ON `boq_import_batches` (`contract_id`, `version_no`);
CREATE UNIQUE INDEX IF NOT EXISTS `boq_mapping_candidates_run_source_rank_uidx` ON `boq_mapping_candidates` (`run_id`, `source_item_id`, `rank_no`);
CREATE UNIQUE INDEX IF NOT EXISTS `boq_material_components_uidx` ON `boq_material_components` (`source_item_id`, `material_id`, `component_type`);
CREATE UNIQUE INDEX IF NOT EXISTS `contract_ownership_transfers_no_uidx` ON `contract_ownership_transfers` (`transfer_no`);
CREATE UNIQUE INDEX IF NOT EXISTS `document_sequences_scope_uidx` ON `document_sequences` (`document_type`, `project_id`, `year`);
CREATE UNIQUE INDEX IF NOT EXISTS `goods_receipts_no_uidx` ON `goods_receipts` (`receipt_no`);
CREATE UNIQUE INDEX IF NOT EXISTS `material_embeddings_provider_uidx` ON `material_embeddings` (`material_id`, `provider`, `model`);
CREATE UNIQUE INDEX IF NOT EXISTS `material_mapping_history_uidx` ON `material_mapping_history` (`material_id`, `source_normalized`);
CREATE UNIQUE INDEX IF NOT EXISTS `request_items_line_uidx` ON `material_request_items` (`request_id`, `line_no`);
CREATE UNIQUE INDEX IF NOT EXISTS `material_requests_no_uidx` ON `material_requests` (`request_no`);
CREATE UNIQUE INDEX IF NOT EXISTS `material_returns_no_uidx` ON `material_returns` (`return_no`);
CREATE UNIQUE INDEX IF NOT EXISTS `material_subcategories_category_code_uidx` ON `material_subcategories` (`category_id`, `code`);
CREATE UNIQUE INDEX IF NOT EXISTS `materials_code_uidx` ON `materials` (`code`);
CREATE UNIQUE INDEX IF NOT EXISTS `projects_code_uidx` ON `projects` (`code`);
CREATE UNIQUE INDEX IF NOT EXISTS `purchase_order_items_line_uidx` ON `purchase_order_items` (`purchase_order_id`, `line_no`);
CREATE UNIQUE INDEX IF NOT EXISTS `purchase_orders_no_uidx` ON `purchase_orders` (`po_no`);
CREATE UNIQUE INDEX IF NOT EXISTS `sessions_token_uidx` ON `sessions` (`token_hash`);
CREATE UNIQUE INDEX IF NOT EXISTS `stock_count_items_uidx` ON `stock_count_items` (`stock_count_id`, `material_id`);
CREATE UNIQUE INDEX IF NOT EXISTS `stock_counts_no_uidx` ON `stock_counts` (`count_no`);
CREATE UNIQUE INDEX IF NOT EXISTS `stock_issues_no_uidx` ON `stock_issues` (`issue_no`);
CREATE UNIQUE INDEX IF NOT EXISTS `suppliers_code_uidx` ON `suppliers` (`code`);
CREATE UNIQUE INDEX IF NOT EXISTS `teams_code_uidx` ON `teams` (`code`);
CREATE UNIQUE INDEX IF NOT EXISTS `user_module_permission_uidx` ON `user_module_permissions` (`user_id`, `module_key`);
CREATE UNIQUE INDEX IF NOT EXISTS `user_project_scope_uidx` ON `user_project_scopes` (`user_id`, `project_id`);
CREATE UNIQUE INDEX IF NOT EXISTS `users_employee_code_uidx` ON `users` (`employee_code`);
CREATE UNIQUE INDEX IF NOT EXISTS `users_username_uidx` ON `users` (`username`);
CREATE UNIQUE INDEX IF NOT EXISTS `users_email_uidx` ON `users` (`email`);
CREATE UNIQUE INDEX IF NOT EXISTS `warehouses_code_uidx` ON `warehouses` (`code`);


-- Bảng thêm bởi migration sau V1 (H2 không chạy Flyway).
CREATE TABLE IF NOT EXISTS `department_module_permissions` (
  `id`               varchar(64) NOT NULL,
  `organization_unit_id` varchar(64) NOT NULL,
  `module_key`       varchar(64) NOT NULL,
  `can_view`         int NOT NULL DEFAULT 0,
  `can_use`          int NOT NULL DEFAULT 0,
  `can_create`       int NOT NULL DEFAULT 0,
  `can_edit`         int NOT NULL DEFAULT 0,
  `can_approve`      int NOT NULL DEFAULT 0,
  `can_export`       int NOT NULL DEFAULT 0,
  `active`           tinyint(1) NOT NULL DEFAULT 1,
  `updated_by`       text NULL,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE (`organization_unit_id`,`module_key`)
) ;

CREATE TABLE IF NOT EXISTS `system_level_catalog` (
  `id`               varchar(64) NOT NULL,
  `code`             varchar(64) NOT NULL,
  `name`             text NOT NULL,
  `description`      text NULL,
  `level_rank`             int NOT NULL DEFAULT 0 ,
  `auto_grant_all`   tinyint(1) NOT NULL DEFAULT 0 ,
  `can_skip_levels`  tinyint(1) NOT NULL DEFAULT 0 ,
  `active`           tinyint(1) NOT NULL DEFAULT 1,
  `sort_order`       int NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE (`code`)
) ;

CREATE TABLE IF NOT EXISTS `team_members` (
  `id` varchar(64) NOT NULL,
  `team_id` varchar(64) NOT NULL,
  `user_id` varchar(64) NOT NULL,
  `role_in_team` varchar(255) NULL,
  `joined_at` TIMESTAMP(3) NOT NULL,
  `left_at` TIMESTAMP(3) NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE (`team_id`,`user_id`,`joined_at`)
) ;

CREATE TABLE IF NOT EXISTS `workflow_definitions` (
  `id`          varchar(64)  NOT NULL,
  `code`        varchar(64)  NOT NULL,
  `name`        text         NOT NULL,
  `description` text         NULL,
  `module_key`  varchar(64)  NULL ,
  `project_id`  varchar(64)  NULL ,
  `is_default`  tinyint(1)   NOT NULL DEFAULT 0,
  `active`      tinyint(1)   NOT NULL DEFAULT 1,
  `sort_order`  int          NOT NULL DEFAULT 0,
  `created_by`  text         NULL,
  `created_at` TIMESTAMP(3)  NOT NULL,
  `updated_at` TIMESTAMP(3)  NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE (`code`)
) ;

CREATE TABLE IF NOT EXISTS `workflow_steps` (
  `id`           varchar(64)  NOT NULL,
  `workflow_id`  varchar(64)  NOT NULL,
  `step_no`      int          NOT NULL,
  `name`         text         NOT NULL,
  `description`  text         NULL,
  `approval_mode` varchar(32) NOT NULL DEFAULT 'single' ,
  `sla_hours`    int          NOT NULL DEFAULT 8,
  `allow_skip_level` tinyint(1) NOT NULL DEFAULT 0 ,
  `required_permission` varchar(128) NULL ,
  `active`       tinyint(1)   NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP(3)  NOT NULL,
  `updated_at` TIMESTAMP(3)  NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE (`workflow_id`,`step_no`)
) ;

CREATE TABLE IF NOT EXISTS `workflow_step_approvers` (
  `id`         varchar(64) NOT NULL,
  `step_id`    varchar(64) NOT NULL,
  `user_id`    varchar(64) NOT NULL,
  `active`     tinyint(1)  NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE (`step_id`,`user_id`)
) ;

-- Cột thêm bởi migration sau V1.
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `system_level_code` varchar(64);
ALTER TABLE `audit_logs` ADD COLUMN IF NOT EXISTS `user_name` text;
ALTER TABLE `audit_logs` ADD COLUMN IF NOT EXISTS `user_role` varchar(64);
ALTER TABLE `audit_logs` ADD COLUMN IF NOT EXISTS `department` text;
ALTER TABLE `audit_logs` ADD COLUMN IF NOT EXISTS `system_level` varchar(64);
ALTER TABLE `audit_logs` ADD COLUMN IF NOT EXISTS `module_key` varchar(64);
ALTER TABLE `audit_logs` ADD COLUMN IF NOT EXISTS `permission_used` varchar(64);
ALTER TABLE `audit_logs` ADD COLUMN IF NOT EXISTS `change_detail` text;
ALTER TABLE `user_project_scopes` ADD COLUMN IF NOT EXISTS `joined_at` datetime(3);
ALTER TABLE `user_project_scopes` ADD COLUMN IF NOT EXISTS `left_at` datetime(3);
ALTER TABLE `user_project_scopes` ADD COLUMN IF NOT EXISTS `position_name` varchar(255);

-- [TASK-115] Hai cột dưới đây bị THIẾU trong H2 vì migration tạo chúng bằng DDL ĐỘNG
-- (`SET @ddl := IF(...) ... PREPARE/EXECUTE`) nên generator tools/generate-h2-test-schema.mjs
-- KHÔNG bắt được (regex chỉ khớp `ALTER TABLE ... ADD COLUMN` literal):
--   V21__p2_pr_approval_dynamic_default.sql -> approval_stage_catalog.stage_kind
--   V22__ad14_audit_log_result.sql          -> audit_logs.result
-- Kiểu + DEFAULT lấy ĐÚNG theo MySQL thật (lệnh information_schema ngày 22/09/2026).
-- Hệ quả nếu thiếu: RequestStoreAdapter/BootstrapDataAdapter dùng `stage_kind` và đường ghi
-- nhật ký dùng `result` đều ném BadSqlGrammarException -> cổng `mvn -pl web -am test` đỏ.
-- KHỐI THỦ CÔNG: generator CHÉP LẠI nguyên văn mọi thứ giữa 2 mốc dưới đây.
-- [H2-MANUAL-START]
ALTER TABLE `approval_stage_catalog` ADD COLUMN IF NOT EXISTS `stage_kind` varchar(16) NOT NULL DEFAULT 'approval';
ALTER TABLE `audit_logs` ADD COLUMN IF NOT EXISTS `result` varchar(32) NOT NULL DEFAULT 'ok';
-- TASK-127 (21/09/2026) — bảng `partners` (ĐỐI TÁC là BẢNG RIÊNG): payload bootstrap Java
-- (BootstrapDataAdapter) ĐỌC bảng này ⇒ schema H2 của test PHẢI có, nếu không
-- `SystemControllerAuthTest` đỏ vì `Table "partners" not found` (H2 JdbcSQLSyntaxErrorException).
-- Vì DDL này đến từ Flyway `V23__partners_table.sql` (migration SAU V1 baseline) nên generator
-- `tools/generate-h2-test-schema.mjs` (sinh từ V1) KHÔNG tự bắt được ⇒ đặt trong KHỐI THỦ CÔNG này
-- (cùng tiền lệ V21/V22 ở trên). Cột sao chép từ `V23__partners_table.sql`, cú pháp H2 như `suppliers`.
CREATE TABLE IF NOT EXISTS `partners` (
  `id` VARCHAR(64) NOT NULL,
  `code` VARCHAR(64) NOT NULL,
  `name` TEXT NOT NULL,
  `tax_code` VARCHAR(64) NULL,
  `address` TEXT NULL,
  `contact_name` TEXT NULL,
  `contact_phone` TEXT NULL,
  `email` VARCHAR(191) NULL,
  `partner_type` VARCHAR(32) NOT NULL DEFAULT 'supplier',
  `status` VARCHAR(32) NOT NULL DEFAULT 'active',
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP(3) NOT NULL,
  `updated_at` TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (`id`)
) ;
CREATE UNIQUE INDEX IF NOT EXISTS `partners_code_uidx` ON `partners` (`code`);
-- [H2-MANUAL-END]
