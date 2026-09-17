-- VNTECH ERP V5.3.0 — PHASE 1 / UI: LÀM MỚI ĐỊNH DANH NGUỒN (TASK-083 · U-15 đợt 2, tiếp 9)
-- (metadata identity refresh)
-- Không đổi nghiệp vụ, không đổi schema. Chỉ cập nhật source fingerprint.
--
-- VÌ SAO: chuyển **bảng danh mục vật tư** (`MaterialCatalogPage`, `baseline-table material-list-table`) sang `<DataTable>` — bảng thứ 16.
--   • Giữ **lớp định dạng riêng** `material-list-table` qua `tableClassName` — luật thật ở `app/styles/canonical.css:732`
--     `.material-list-table td, .material-list-table th { white-space: nowrap }` và `:734` cho `button:disabled`
--     trong `.row-actions`. Bỏ tham số này là **mất chặn ngắt dòng** (đúng bài học mục 3b của `TASK-083.md`).
--   • Cột **"Tên phụ (alias)" là ĐỘNG**: bảng cũ render `{showAlias && <th>…}` và `{showAlias && <td>…}`; nay là một
--     `Column` với **`hidden: !showAlias`** — `DataTable` tự lọc `columns.filter(c => !c.hidden)` nên **cột tiêu đề và
--     cột dữ liệu biến mất cùng nhau**; `colSpan` của dòng rỗng cũng tự đúng (`visible.length`).
--   • Phép tính theo dòng `const al = aliasOf(m.id)` chuyển **nguyên vẹn** vào trong `render` của cột alias.
--   • Giữ nguyên: 3 nút `export-mini` (Sửa/Hợp nhất/Ngừng) với `disabled` + `title` **nguyên văn**, `StatusBadge`
--     cho trạng thái, và `emptyText` **nguyên văn**: "Không có vật tư phù hợp bộ lọc."
--   • Dải `<div className="material-list-note">` **ở ngoài** bảng (dòng 1773–1776) giữ nguyên vị trí.
-- Kết quả đo: `DataTable` dùng thật **28 → 29 lần** · bảng tự viết **72 → 71 chỗ** · trạng thái rỗng tự viết
-- **75 → 74 chỗ**. `app/page.tsx` 4025 → 4019 dòng.
-- Khối identity bên dưới do `tools/refresh-phase-identity.mjs` sinh theo cơ chế FIXED POINT.

--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='6341c996591d3dd30278400e6229a3ec790c15a3090efa4ccfe75f15766bbde6'
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
