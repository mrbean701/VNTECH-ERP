-- VNTECH ERP V5.3.0 PHASE P5 — PHÂN QUYỀN PHÒNG BAN + CẤP BẬC HỆ THỐNG
--   • department_module_permissions: cấp quyền HÀNG LOẠT cho phòng ban (nguồn chính),
--     quyền của người dùng không được vượt quá quyền của phòng ban.
--   • system_level_catalog + users.system_level_code: cấp bậc cao tự động có toàn quyền
--     và được duyệt vượt cấp mà không cần thêm tên vào từng quy trình.
-- Bản MySQL tương ứng: java-backend/.../db/migration/V10__dept_permissions_and_levels.sql

CREATE TABLE IF NOT EXISTS `department_module_permissions` (
  `id` varchar(64) NOT NULL,
  `organization_unit_id` varchar(64) NOT NULL,
  `module_key` varchar(64) NOT NULL,
  `can_view` int NOT NULL DEFAULT 0,
  `can_use` int NOT NULL DEFAULT 0,
  `can_create` int NOT NULL DEFAULT 0,
  `can_edit` int NOT NULL DEFAULT 0,
  `can_approve` int NOT NULL DEFAULT 0,
  `can_export` int NOT NULL DEFAULT 0,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `updated_by` text,
  `created_at` datetime(3) NOT NULL,
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
);
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS `department_module_permissions_uidx` ON `department_module_permissions` (`organization_unit_id`,`module_key`);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `system_level_catalog` (
  `id` varchar(64) NOT NULL,
  `code` varchar(64) NOT NULL,
  `name` text NOT NULL,
  `description` text,
  `rank` int NOT NULL DEFAULT 0,
  `auto_grant_all` tinyint(1) NOT NULL DEFAULT 0,
  `can_skip_levels` tinyint(1) NOT NULL DEFAULT 0,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL,
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
);
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS `system_level_catalog_code_uidx` ON `system_level_catalog` (`code`);
--> statement-breakpoint

ALTER TABLE `users` ADD COLUMN `system_level_code` varchar(64);
--> statement-breakpoint

INSERT OR IGNORE INTO `system_level_catalog`
  (`id`,`code`,`name`,`description`,`rank`,`auto_grant_all`,`can_skip_levels`,`active`,`sort_order`,`created_at`,`updated_at`)
VALUES
  ('LVL-NV','nhan_vien','Nhân viên','Thực hiện công việc được giao trong phạm vi phòng ban.',10,0,0,1,10,datetime('now'),datetime('now')),
  ('LVL-TN','truong_nhom','Trưởng nhóm / Tổ đội','Điều phối tổ đội, xác nhận công việc hiện trường.',20,0,0,1,20,datetime('now'),datetime('now')),
  ('LVL-TP','truong_phong','Trưởng phòng','Quản lý phòng ban, phê duyệt trong phạm vi phòng.',30,0,0,1,30,datetime('now'),datetime('now')),
  ('LVL-GD','giam_doc','Giám đốc','Tự động có toàn quyền hệ thống; phê duyệt mọi bước trong phạm vi điều hành.',40,1,0,1,40,datetime('now'),datetime('now')),
  ('LVL-CEO','tong_giam_doc','Tổng giám đốc (CEO)','Cấp cao nhất: tự động toàn quyền và được duyệt vượt cấp không cần thêm tên vào quy trình.',50,1,1,1,50,datetime('now'),datetime('now'));
--> statement-breakpoint

INSERT OR IGNORE INTO `department_module_permissions`
  (`id`,`organization_unit_id`,`module_key`,`can_view`,`can_use`,`can_create`,`can_edit`,`can_approve`,`can_export`,`active`,`updated_by`,`created_at`,`updated_at`)
SELECT 'DMP-' || o.code || '-' || m.module_key, o.id, m.module_key, 1, 1, 1, 1, 0, 1, 1, 'system', datetime('now'), datetime('now')
  FROM (SELECT code, MIN(id) AS id FROM `organization_units` WHERE active = 1 AND unit_type = 'department' GROUP BY code) o
  JOIN `module_catalog` m
    ON (o.code = 'KH'   AND m.module_key LIKE 'dept\_plan\_%')
    OR (o.code = 'DA'   AND m.module_key LIKE 'dept\_project\_%')
    OR (o.code = 'TCKT' AND m.module_key LIKE 'dept\_finance\_%')
    OR (o.code = 'HCPC' AND m.module_key LIKE 'dept\_legal\_%');
--> statement-breakpoint

UPDATE `users` SET `system_level_code` = 'tong_giam_doc' WHERE `role` = 'admin';
--> statement-breakpoint
UPDATE `users` SET `system_level_code` = 'giam_doc' WHERE `role` = 'director' AND `system_level_code` IS NULL;
--> statement-breakpoint
UPDATE `users` SET `system_level_code` = 'truong_phong' WHERE `role` IN ('kh_truong','da_truong','accountant','procurement','project','warehouse') AND `system_level_code` IS NULL;
--> statement-breakpoint
UPDATE `users` SET `system_level_code` = 'truong_nhom' WHERE `role` IN ('cht','commander','team','thuky','thu_kho') AND `system_level_code` IS NULL;
--> statement-breakpoint
UPDATE `users` SET `system_level_code` = 'nhan_vien' WHERE `system_level_code` IS NULL;

--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='4d20951aa456495285592da4746f850b549149d76e0ced0a16aad1035fc30e45'
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
