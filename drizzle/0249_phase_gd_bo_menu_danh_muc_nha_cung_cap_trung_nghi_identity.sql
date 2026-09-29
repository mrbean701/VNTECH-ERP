-- VNTECH ERP V5.3.0 BO MENU DANH MUC NHA CUNG CAP (TRUNG NGHIEP VU); DUA DOI TAC XUONG CUOI NHOM MUA HANG (metadata identity refresh)
-- Không đổi nghiệp vụ và không đổi schema. Chỉ cập nhật source fingerprint sau khi
-- thay đổi mã nguồn giao diện/logic trong ROOT_DIRS.
--
-- Nhãn: bo menu Danh muc nha cung cap (trung nghiep vu); Dua Doi tac xuong cuoi nhom Mua hang

-- Giai đoạn này không thay đổi cấu trúc dữ liệu.

--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='6d3d773ac9de2bdd0e681afae99a48fccba8c56c8c03e67f5ec6c6efef48f8c5'
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
