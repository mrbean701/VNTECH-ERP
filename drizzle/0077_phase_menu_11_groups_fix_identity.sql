-- VNTECH ERP V5.3.0 PHASE MENU-11 FIX — BỔ SUNG CHỨC NĂNG BỊ SÓT (metadata identity refresh)
-- Không đổi schema/nghiệp vụ; chỉ cập nhật source fingerprint sau khi:
--   gán lại nhóm cho module dept_project_tender ("Đấu thầu" - Phòng Dự án) mà
--   migration tái cấu trúc menu trước đó bỏ sót, tránh chức năng bị ẩn khỏi menu.
-- Bản MySQL tương ứng: java-backend/.../db/migration/V5__menu_orphan_fix.sql

UPDATE module_catalog SET group_key = 'mep', sort_order = 35 WHERE module_key = 'dept_project_tender';

--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='60ed251ef7dc7a4c498358a412e8e1308d1af9417a81eeeeb8942770aa5c6e09'
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
