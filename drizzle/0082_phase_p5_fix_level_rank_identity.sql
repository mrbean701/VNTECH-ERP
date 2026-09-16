-- VNTECH ERP V5.3.0 PHASE P5-FIX — ĐỔI TÊN CỘT `rank` (metadata identity refresh)
-- Không đổi nghiệp vụ; chỉ cập nhật source fingerprint sau khi:
--   (1) thêm migration MySQL V11__rename_level_rank.sql: `system_level_catalog.rank`
--       → `level_rank`. `RANK` là TỪ KHOÁ DÀNH RIÊNG của MySQL 8 nên mọi câu SELECT
--       viết `rank` không backtick đều lỗi 1064, làm BootstrapDataAdapter ném lỗi và
--       toàn bộ giao diện hiện "Internal Server Error".
--   (2) vá an toàn dữ liệu: ràng buộc phòng ban → người dùng được kiểm tra TRƯỚC khi
--       xoá quyền cũ (trước đây một yêu cầu bị từ chối vẫn xoá sạch phạm vi dự án/kho).
-- Bản SQLite (drizzle): đổi tên cột tương ứng.

ALTER TABLE `system_level_catalog` RENAME COLUMN `rank` TO `level_rank`;

--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='3138a6594ad7c23bdbe2da71285b62376d2b9e2434f75292c4aa5c9b5b9f6981'
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
