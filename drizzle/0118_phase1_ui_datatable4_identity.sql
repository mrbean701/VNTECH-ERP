-- VNTECH ERP V5.3.0 — PHASE 1 / UI: LÀM MỚI ĐỊNH DANH NGUỒN (TASK-083 · U-15 đợt 2, tiếp 2)
-- (metadata identity refresh)
-- Không đổi nghiệp vụ, không đổi schema. Chỉ cập nhật source fingerprint.
--
-- VÌ SAO:
--   1) `app/components/ui/DataTable.tsx` — THÊM thuộc tính `rowStyle?: (row, index) => CSSProperties`
--      (đặt ở PROPS của component, KHÔNG phải ở kiểu `Column`). Cần để giữ nguyên chỗ tô nền theo trạng
--      thái của cả DÒNG — cụ thể là bảng ma trận quyền phòng ban tô nền vàng `#fff8e6` cho dòng "chưa lưu".
--   2) `app/page.tsx` — chuyển bảng **ma trận quyền phòng ban** (`DepartmentPermissionManager`) sang
--      `DataTable`: 1 cột "Chức năng" + **7 cột ĐỘNG** sinh từ `PERM_CAPS.map` + 1 cột trạng thái;
--      dòng "chưa lưu" giữ nguyên nền vàng qua `rowStyle`.
--
-- ĐỐI CHIẾU CSS (đã kiểm, không suy đoán): `app/styles/canonical.css` dòng 103-113 style **cùng một
-- danh sách selector** cho `.table-wrap table th/td` VÀ `.baseline-table th/td` ⇒ bảng `<table>` trần
-- nằm trong `.table-wrap` có CSS **tương đương** `.baseline-table` mà `DataTable` render ⇒ chuyển được.
--
-- Kết quả đo: `DataTable` dùng thật **17 → 18 lần** · bảng tự viết **83 → 82 chỗ**.
-- Khối identity bên dưới do `tools/refresh-phase-identity.mjs` sinh theo cơ chế FIXED POINT.

--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='28e59c51cb7d699cd216e059fe0f99a03dd43c3fb808bff275c242348e30fb28'
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
