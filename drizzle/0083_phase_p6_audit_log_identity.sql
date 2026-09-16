-- VNTECH ERP V5.3.0 PHASE P6 — NHẬT KÝ KIỂM TOÁN (metadata identity refresh)
-- Không đổi nghiệp vụ; chỉ cập nhật source fingerprint sau khi:
--   (1) thêm migration MySQL V12__audit_log_enrich.sql: 7 cột ngữ cảnh cho audit_logs
--       (user_name, user_role, department, system_level, module_key, permission_used,
--        change_detail) + index theo thời gian và hành động,
--   (2) thêm AuditTrailFilter: GHI NHẬT KÝ TỰ ĐỘNG cho MỌI action POST thành công của
--       /api/system (bỏ qua login/logout/setup) — trước đây audit_logs = 0 dòng,
--   (3) thêm tab "Audit log" trong Quản trị hệ thống: lọc theo người dùng / chức năng /
--       khoảng ngày / từ khóa, xem chi tiết dữ liệu gửi lên.

ALTER TABLE `audit_logs` ADD COLUMN `user_name` text;
--> statement-breakpoint
ALTER TABLE `audit_logs` ADD COLUMN `user_role` varchar(64);
--> statement-breakpoint
ALTER TABLE `audit_logs` ADD COLUMN `department` text;
--> statement-breakpoint
ALTER TABLE `audit_logs` ADD COLUMN `system_level` varchar(64);
--> statement-breakpoint
ALTER TABLE `audit_logs` ADD COLUMN `module_key` varchar(64);
--> statement-breakpoint
ALTER TABLE `audit_logs` ADD COLUMN `permission_used` varchar(64);
--> statement-breakpoint
ALTER TABLE `audit_logs` ADD COLUMN `change_detail` text;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS `audit_logs_occurred_idx` ON `audit_logs` (`occurred_at`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `audit_logs_action_idx` ON `audit_logs` (`action`);

--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='8b679a565915e79bd59b2129614f0754516363c9b9ba475fc141f8c188af5549'
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
