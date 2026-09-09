-- VNTECH ERP V5.3.0 PHASE 3I - OVERDUE/DUE WARNING REPORT (metadata identity refresh)
-- Không đổi schema/nghiệp vụ; chỉ cập nhật source fingerprint sau khi thêm
-- báo cáo "Cảnh báo quá hạn & sắp đến hạn" (PO trễ hẹn, nhiệm vụ quá hạn, hợp đồng sắp hết hiệu lực)
-- trên màn reports với xuất CSV/XLSX/PDF.

DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='0c5b81e5cd38b19ff71d34badd663fa51d51678c0f953e60e608282cf973a43b'
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