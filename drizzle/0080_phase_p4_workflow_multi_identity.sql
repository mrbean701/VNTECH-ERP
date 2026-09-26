-- VNTECH ERP V5.3.0 PHASE P4 — WORKFLOW ĐA LUỒNG (metadata identity refresh)
-- Bổ sung 3 bảng cho workflow đa luồng + chuyển luồng duyệt 5 bước hiện có thành
-- quy trình mặc định. `approval_stage_catalog` và `approvals` GIỮ NGUYÊN để không
-- phá 20 bản ghi phê duyệt đang chạy (tương thích ngược hoàn toàn).
--   approval_mode: single (1 người) · any_of (1 trong nhiều người là qua) · all_of (tất cả)
-- Bản MySQL tương ứng: java-backend/.../db/migration/V8__workflow_multi.sql

CREATE TABLE IF NOT EXISTS `workflow_definitions` (
  `id` varchar(64) NOT NULL,
  `code` varchar(64) NOT NULL,
  `name` text NOT NULL,
  `description` text,
  `module_key` varchar(64),
  `project_id` varchar(64),
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `version` int NOT NULL DEFAULT 1,
  `sort_order` int NOT NULL DEFAULT 0,
  `created_by` text,
  `created_at` datetime(3) NOT NULL,
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
);
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS `workflow_definitions_code_uidx` ON `workflow_definitions` (`code`);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `workflow_steps` (
  `id` varchar(64) NOT NULL,
  `workflow_id` varchar(64) NOT NULL,
  `step_no` int NOT NULL,
  `name` text NOT NULL,
  `description` text,
  `approval_mode` varchar(32) NOT NULL DEFAULT 'single',
  `sla_hours` int NOT NULL DEFAULT 8,
  `allow_skip_level` tinyint(1) NOT NULL DEFAULT 0,
  `required_permission` varchar(128),
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL,
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
);
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS `workflow_steps_no_uidx` ON `workflow_steps` (`workflow_id`,`step_no`);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `workflow_step_approvers` (
  `id` varchar(64) NOT NULL,
  `step_id` varchar(64) NOT NULL,
  `user_id` varchar(64) NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL,
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
);
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS `workflow_step_approvers_uidx` ON `workflow_step_approvers` (`step_id`,`user_id`);
--> statement-breakpoint

-- Quy trình mặc định chuyển từ cấu hình bậc duyệt cũ
INSERT OR IGNORE INTO `workflow_definitions`
  (`id`,`code`,`name`,`description`,`module_key`,`project_id`,`is_default`,`active`,`version`,`sort_order`,`created_by`,`created_at`,`updated_at`)
VALUES
  ('WF-MUAHANG','WF-MUAHANG-01','Quy trình mua hàng chuẩn',
   'Luồng duyệt 5 bước cho phiếu đề nghị mua hàng, chuyển đổi từ cấu hình bậc duyệt cũ.',
   'requests',NULL,1,1,1,10,'system',datetime('now'),datetime('now'));
--> statement-breakpoint

INSERT OR IGNORE INTO `workflow_steps`
  (`id`,`workflow_id`,`step_no`,`name`,`description`,`approval_mode`,`sla_hours`,`allow_skip_level`,`required_permission`,`active`,`created_at`,`updated_at`)
SELECT 'WFS-' || c.stage_no, 'WF-MUAHANG', c.stage_no, c.name, c.description,
       CASE WHEN c.approval_mode = 'all_roles' THEN 'all_of' ELSE 'single' END,
       c.sla_hours, 0, 'requests.canApprove', c.active, datetime('now'), datetime('now')
  FROM `approval_stage_catalog` c;
--> statement-breakpoint

INSERT OR IGNORE INTO `workflow_step_approvers`
  (`id`,`step_id`,`user_id`,`active`,`created_at`,`updated_at`)
SELECT DISTINCT 'WFSA-' || s.step_no || '-' || a.owner_user_id, s.id, a.owner_user_id,
       1, datetime('now'), datetime('now')
  FROM `workflow_steps` s
  JOIN `approval_project_assignments` a ON a.stage = s.step_no AND a.active = 1
 WHERE s.workflow_id = 'WF-MUAHANG';

--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='b7b69f5feb80a8f8ac8f22997802fd84beddfc334e860566c8a159273dd088cc'
WHERE id='VNTECH-KHO-MEP-001';
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS vntech_product_identity_no_update
BEFORE UPDATE ON vntech_product_identity
BEGIN
  SELECT RAISE(ABORT, 'VNTECH product identity is protected.');
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS vntech_product_identity_no_delete
BEFORE DELETE ON vntech_product_identity
BEGIN
  SELECT RAISE(ABORT, 'VNTECH product identity is protected.');
END;
