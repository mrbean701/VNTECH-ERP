-- VNTECH ERP V5.3.0 PHASE 3J - LABEL & PROJECT NAV FIX (metadata identity refresh)
-- Không đổi schema/nghiệp vụ; chỉ cập nhật source fingerprint sau khi:
-- (1) cập nhật 15 nhãn mô tả nghiệp vụ thật (bỏ cụm "ĐANG PHÁT TRIỂN · ..." trên các màn đã hoàn thiện),
-- (2) thu gọn DEVELOPMENT_MODULES (chỉ còn dept_plan_*/dept_project_* workspace),
-- (3) thêm fallback "Chưa có dự án đang hoạt động" cho menu Quản lý dự án khi chưa có dự án active.

DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='54394992d738b8f093c256db5565c1bb43f8ffcfd2ff2f9ef9f0d77b1cf7c77e'
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