-- VNTECH ERP V5.3.0 PHASE 3E - REQUESTS LOW-STOCK HINT (metadata identity refresh)
-- Không đổi schema/nghiệp vụ; chỉ cập nhật source fingerprint sau khi thêm
-- banner cảnh báo vật tư thiếu tồn trên màn Phiếu đề nghị mua hàng (Requests).

DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='c287ba8ffab9e9b8ac219c65e89ac7da0aaf38c784d249b96c27e6398ec44347'
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