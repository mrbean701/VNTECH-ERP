-- VNTECH ERP V5.3.0 PHASE 2B - ACCOUNTING LEDGER EXPORT (metadata identity refresh)
-- Không đổi schema/nghiệp vụ; chỉ cập nhật source fingerprint sau thêm tính năng xuất sổ kế toán.

DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='bb293e8a0b10418124ed02edbbe34ad7d7ddc88ecd11cc543b09fae11d49a09a'
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