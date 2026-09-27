-- VNTECH ERP V5.3.0 MT3-UI-06-RESPONSIVE-5-WIDTHS-VA-TOGGLE-MENU (metadata identity refresh)
-- Không đổi nghiệp vụ và không đổi schema. Chỉ cập nhật source fingerprint sau khi
-- thay đổi mã nguồn giao diện/logic trong ROOT_DIRS.
--
-- Nhãn: MT3-UI-06-responsive-5-widths-va-toggle-menu

-- Giai đoạn này không thay đổi cấu trúc dữ liệu.

--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='59168833decb11d5bbe63bd3f135f12e6eb87da913cfb88cdd4fe792474e426d'
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
