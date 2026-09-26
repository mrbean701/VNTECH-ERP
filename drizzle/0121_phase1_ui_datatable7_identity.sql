-- VNTECH ERP V5.3.0 — PHASE 1 / UI: LÀM MỚI ĐỊNH DANH NGUỒN (TASK-083 · U-15 đợt 2, tiếp 5)
-- (metadata identity refresh)
-- Không đổi nghiệp vụ, không đổi schema. Chỉ cập nhật source fingerprint.
--
-- VÌ SAO: chuyển bảng **"Kế hoạch giao hàng" (12 cột)** của màn Giao nhận sang `<DataTable>` — bảng thứ 12
-- của `U-15` đợt 2. LƯU Ý CÁCH VIẾT (đã trả giá ở lượt trước, xem `TASK-083.md` mục 3c):
--   • **LUÔN có khoảng trắng sau `=>`** khi thân là JSX (`render: (row) => <…/>`). Viết `=><>` bị TypeScript
--     hiểu là **danh sách tham số generic rỗng** ⇒ biến `row` rơi ra ngoài hàm ⇒ 2 lỗi `TS2304`.
--   • Ô **trộn chữ + biểu thức** (`▧ {row.certificateCount}`) dùng **`<span>`** thay vì fragment trần cho rõ ràng.
--   • Cột chỉ trả **chuỗi** thì trả thẳng (`render: (row) => row.poNo`), bớt JSX.
-- Giữ nguyên công thức `ordered`/`actual`/`remain`/`pct` (chỉ chuyển vào `render` của đúng cột),
-- `emptyText` nguyên văn: "Không còn PO phù hợp bộ lọc."
-- Kết quả đo: `DataTable` dùng thật **24 → 25 lần** · bảng tự viết **76 → 75 chỗ** · trạng thái rỗng tự viết
-- **79 → 78 chỗ**.
-- Khối identity bên dưới do `tools/refresh-phase-identity.mjs` sinh theo cơ chế FIXED POINT.

--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='55085cec342ffa25c4e1385890e6e45d247f760f28050b85cb483997ef00b708'
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
