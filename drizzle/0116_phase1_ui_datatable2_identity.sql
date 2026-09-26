-- VNTECH ERP V5.3.0 — PHASE 1 / UI: LÀM MỚI ĐỊNH DANH NGUỒN (TASK-083 · U-15 đợt 2)
-- (metadata identity refresh)
-- Không đổi nghiệp vụ, không đổi schema. Chỉ cập nhật source fingerprint.
--
-- VÌ SAO: chuyển bảng **"thành viên đã rời tổ đội"** trong `TeamManagement` (`app/page.tsx`) từ markup
-- tự viết (`<div className="table-wrap"><table className="baseline-table">…`) sang component dùng chung
-- `<DataTable>` — bảng tự viết **87 → 86**, `DataTable` dùng thật **13 → 14**.
-- Đây là việc đầu tiên của `U-15` đợt 2 (còn 19 bảng phẳng; 70 bảng còn lại là nhóm dòng/colSpan —
-- KHÔNG chuyển được vì `DataTable` không có khái niệm dòng nhóm).
-- • Bỏ `emptyText` có chủ ý: markup cũ KHÔNG có trạng thái rỗng, nên dùng nguyên văn mặc định của
--   component dùng chung ("Chưa có dữ liệu.") thay vì tự đặt chữ mới (quy tắc #7 của dự án).
-- Khối identity bên dưới do `tools/refresh-phase-identity.mjs` sinh theo cơ chế FIXED POINT.

--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='d0b3b43ed5051c4779bb7339981be0ac3be2d3a6b43b4aafb8695b4dc3aa9900'
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
