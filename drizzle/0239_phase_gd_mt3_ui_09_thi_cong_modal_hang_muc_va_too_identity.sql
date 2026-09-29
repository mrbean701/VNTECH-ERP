-- VNTECH ERP V5.3.0 MT3-UI-09-THI-CONG-MODAL-HANG-MUC-VA-TOOLBAR (metadata identity refresh)
-- Không đổi nghiệp vụ và không đổi schema. Chỉ cập nhật source fingerprint sau khi
-- thay đổi mã nguồn giao diện/logic trong ROOT_DIRS.
--
-- Nhãn: MT3-UI-09-thi-cong-modal-hang-muc-va-toolbar

-- Giai đoạn này không thay đổi cấu trúc dữ liệu.

--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='c1edccd1fbdacd6a2e5993aea8a38d1e0e0a0276307bfb320b340f72dd25d309'
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
