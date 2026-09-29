-- VNTECH ERP V5.3.0 RUT GON DA QUY TRINH PHE DUYET - BO MO TA, BUOC DA DUYET HIEN TEN NGUOI DUYET + THOI GIAN (metadata identity refresh)
-- Không đổi nghiệp vụ và không đổi schema. Chỉ cập nhật source fingerprint sau khi
-- thay đổi mã nguồn giao diện/logic trong ROOT_DIRS.
--
-- Nhãn: rut gon da quy trinh phe duyet - bo mo ta, buoc da duyet hien ten nguoi duyet + thoi gian

-- Giai đoạn này không thay đổi cấu trúc dữ liệu.

--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='96addebf505edc64b25c73ca146cbc908f52b7654d5ef8cee128972edb171ff2'
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
