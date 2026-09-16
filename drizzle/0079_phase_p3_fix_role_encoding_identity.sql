-- VNTECH ERP V5.3.0 PHASE P3-FIX — SỬA MÃ HOÁ role_catalog (metadata identity refresh)
-- Không đổi schema; chỉ cập nhật source fingerprint sau khi:
--   (1) thêm migration MySQL V6__fix_role_catalog_encoding.sql khôi phục 8/16 chức danh
--       trong role_catalog bị mất dấu thành '?' (vd 'Ch? huy tr??ng' → 'Chỉ huy trưởng'),
--   (2) vá java-backend/tools/seed-demo.mjs: thêm --default-character-set=utf8mb4 cho mọi
--       lời gọi mysql CLI (nguyên nhân gốc gây mất dấu khi đọc/ghi vòng qua CLI).
-- Bản SQLite (drizzle): role_catalog do 0009/0029 seed bằng UTF-8 đúng nên không cần vá.

UPDATE role_catalog SET name='Chỉ huy trưởng', description='Xác nhận nhu cầu dự án' WHERE code='cht';
--> statement-breakpoint
UPDATE role_catalog SET name='Nhân viên Phòng Dự án', description='Kiểm tra khối lượng đặt hàng' WHERE code='da_nv';
--> statement-breakpoint
UPDATE role_catalog SET name='Trưởng phòng Dự án', description='Quản lý dự án và xác nhận cuối' WHERE code='da_truong';
--> statement-breakpoint
UPDATE role_catalog SET name='Nhân viên Phòng Kế hoạch', description='Mua hàng, PO, kế hoạch giao hàng' WHERE code='kh_nv';
--> statement-breakpoint
UPDATE role_catalog SET name='Trưởng phòng Kế hoạch', description='Quản lý Kế hoạch/Mua hàng và xác nhận cuối' WHERE code='kh_truong';
--> statement-breakpoint
UPDATE role_catalog SET name='Kỹ sư dự án', description='Lập Phiếu đề nghị mua hàng tại BCH' WHERE code='ksda';
--> statement-breakpoint
UPDATE role_catalog SET name='Thủ kho dự án', description='Chỉ đúng dự án và kho được phân công' WHERE code='thu_kho';
--> statement-breakpoint
UPDATE role_catalog SET name='Thư ký Tổng giám đốc / Trưởng phòng Hành chính Pháp chế', description='Duyệt sau CHT trước Phòng Dự án' WHERE code='thuky';

--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='445c7f7852d21bdf562fa718996c5ec147757fa331956c5497da21ce5f342e36'
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
