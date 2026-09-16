-- ============================================================================
-- V11 — ĐỔI TÊN CỘT `rank` THÀNH `level_rank` (khắc phục lỗi cú pháp MySQL 8)
-- ----------------------------------------------------------------------------
-- `RANK` là TỪ KHOÁ DÀNH RIÊNG của MySQL 8.0.2+ (hàm cửa sổ). V10 tạo bảng với
-- cột `rank` (có backtick nên CREATE/INSERT chạy được), nhưng mọi câu SELECT viết
-- `SELECT ...,rank,...` KHÔNG có backtick đều lỗi:
--   ERROR 1064 (42000): You have an error in your SQL syntax ... near ',rank,'
--
-- Vì BootstrapDataAdapter chạy câu này ngay khi tải dữ liệu nên toàn bộ giao diện
-- hiện "Internal Server Error" (GET /api/system trả 500).
--
-- Đổi tên cột để không còn phụ thuộc vào backtick — tránh tái diễn.
-- Các câu SELECT sẽ dùng `level_rank AS rank` để giao diện không phải đổi.
--
-- Kiểm chứng sau khi chạy:
--   SELECT COUNT(*) FROM information_schema.COLUMNS
--    WHERE TABLE_SCHEMA='vntech_erp' AND TABLE_NAME='system_level_catalog' AND COLUMN_NAME='rank';
--   -- phải = 0
--
-- LƯU Ý: V10 CỐ Ý giữ nguyên tên cột `rank` (đã chạy, sửa sẽ lệch Flyway checksum).
-- Cài đặt mới sẽ chạy V10 (tạo `rank`) rồi V11 (đổi tên) — kết quả giống nhau.
-- ============================================================================

ALTER TABLE `system_level_catalog` CHANGE COLUMN `rank` `level_rank` int NOT NULL DEFAULT 0
  COMMENT 'Số càng lớn cấp càng cao (đặt tên tránh từ khoá RANK của MySQL 8)';
