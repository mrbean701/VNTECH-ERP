-- VNTECH ERP V5.3.0 — PHASE 1 / UI: LÀM MỚI ĐỊNH DANH NGUỒN (TASK-034 · TASK-075)
-- (metadata identity refresh)
-- Không đổi nghiệp vụ, không đổi schema. Chỉ cập nhật source fingerprint.
--
-- VÌ SAO TỆP NÀY TỒN TẠI: `npm run build` BỊ CHẶN từ TASK-034 vì dấu vân tay nguồn lệch
-- (nguồn đã đổi qua nhiều vòng sửa nhưng SSOT chưa được làm mới), trong khi
-- `scripts/local-runtime.mjs:177` TỪ CHỐI KHỞI ĐỘNG nếu dòng định danh trong DB
-- không khớp `VNTECH_IDENTITY.sourceFingerprint`; và bảng định danh có TRIGGER CHẶN UPDATE.
-- Người dùng đã cho phép tái lập định danh (chốt 17/09/2026) để giao diện kịp được kiểm thử.
--
-- Khối identity bên dưới do `tools/refresh-phase-identity.mjs` sinh theo cơ chế FIXED POINT
-- (literal 64-hex được bộ chuẩn hoá che ⇒ băm lại vẫn bằng chính nó).

--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='3e28c42db2755dafccdc9b10ef1d2d22ec0d0fe75b8fbffedc2cc89f6c51bbe5'
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
