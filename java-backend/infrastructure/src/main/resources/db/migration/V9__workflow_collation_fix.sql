-- ============================================================================
-- V9 — SỬA COLLATION CHO 3 BẢNG WORKFLOW (khắc phục V8)
-- ----------------------------------------------------------------------------
-- V8 tạo bảng với `DEFAULT CHARSET=utf8mb4` (không nêu COLLATE) ⇒ MySQL 8 lấy mặc
-- định của server là `utf8mb4_0900_ai_ci`. Trong khi `users`, `projects`… của
-- V1__baseline dùng `utf8mb4_unicode_ci`.
--
-- Hệ quả: mọi JOIN giữa bảng workflow và users đều lỗi
--   ERROR 1267: Illegal mix of collations (utf8mb4_unicode_ci,IMPLICIT) and
--               (utf8mb4_0900_ai_ci,IMPLICIT) for operation '='
-- ⇒ BootstrapDataAdapter/workflowStepApprovers ném lỗi ⇒ GET /api/system trả 500
--   ⇒ toàn bộ giao diện hiện "Internal Server Error".
--
-- V8 đã được sửa để luôn ghi rõ COLLATE=utf8mb4_unicode_ci cho cài đặt mới.
-- Migration này chuẩn hoá các DB đã chạy V8 bản cũ.
--
-- Kiểm chứng sau khi chạy:
--   SELECT TABLE_NAME, TABLE_COLLATION FROM information_schema.TABLES
--    WHERE TABLE_SCHEMA='vntech_erp' AND TABLE_NAME LIKE 'workflow%';
--   -- cả 3 phải là utf8mb4_unicode_ci
-- ============================================================================

ALTER TABLE `workflow_definitions`   CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `workflow_steps`         CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `workflow_step_approvers` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
