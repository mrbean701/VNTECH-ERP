-- ============================================================================
-- V12 — MỞ RỘNG NHẬT KÝ KIỂM TOÁN (ĐỢT P6)
-- ----------------------------------------------------------------------------
-- Hiện trạng: `audit_logs` có 0 dòng — KHÔNG action nào ghi nhật ký. Bảng chỉ có
-- user_id + action + entity + before/after + ip, thiếu ngữ cảnh người thực hiện
-- (tên, vai trò, phòng ban, cấp bậc) và thiếu chức năng/quyền đã dùng.
--
-- Bổ sung 7 cột để tab "Audit log" trả lời được: AI đổi · thuộc phòng nào · cấp bậc
-- gì · dùng quyền nào · đổi cái gì · lúc nào.
--
-- Bảng ĐÃ CÓ dữ liệu ở môi trường khác nên mọi cột phải NULL-able.
-- LƯU Ý: mỗi cột một câu ALTER riêng để bộ sinh schema H2
-- (java-backend/tools/generate-h2-test-schema.mjs) chuyển được sang H2.
-- ============================================================================

ALTER TABLE `audit_logs` ADD COLUMN `user_name` text NULL COMMENT 'Tên người thực hiện tại thời điểm ghi';
ALTER TABLE `audit_logs` ADD COLUMN `user_role` varchar(64) NULL COMMENT 'Mã vai trò (role_catalog.code)';
ALTER TABLE `audit_logs` ADD COLUMN `department` text NULL COMMENT 'Phòng ban của người thực hiện';
ALTER TABLE `audit_logs` ADD COLUMN `system_level` varchar(64) NULL COMMENT 'Cấp bậc hệ thống (system_level_catalog.code)';
ALTER TABLE `audit_logs` ADD COLUMN `module_key` varchar(64) NULL COMMENT 'Chức năng nghiệp vụ bị tác động';
ALTER TABLE `audit_logs` ADD COLUMN `permission_used` varchar(64) NULL COMMENT 'Quyền đã dùng: canView/canUse/canCreate/canEdit/canApprove/canExport';
ALTER TABLE `audit_logs` ADD COLUMN `change_detail` text NULL COMMENT 'Mô tả ngắn thay đổi, đọc được bằng mắt';

CREATE INDEX `audit_logs_occurred_idx` ON `audit_logs` (`occurred_at`);
CREATE INDEX `audit_logs_action_idx` ON `audit_logs` (`action`(191));

-- Kiểm chứng sau khi chạy:
--   SELECT COUNT(*) FROM information_schema.COLUMNS
--    WHERE TABLE_SCHEMA='vntech_erp' AND TABLE_NAME='audit_logs';
--   -- trước 9 cột, sau 16 cột
