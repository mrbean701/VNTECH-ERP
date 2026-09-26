-- VNTECH ERP V5.3.0 — PHASE 1 / UI: LÀM MỚI ĐỊNH DANH NGUỒN (TASK-083 · U-15 đợt 2, tiếp 7)
-- (metadata identity refresh)
-- Không đổi nghiệp vụ, không đổi schema. Chỉ cập nhật source fingerprint.
--
-- VÌ SAO: chuyển **bảng danh sách dự án** (`ProjectManagement`, màn `project_progress`, 9 cột) sang `<DataTable>` — bảng thứ 14.
--   • Bảng cũ tự viết `<div className="table-wrap"><table className="baseline-table">` ⇒ nay `DataTable` render ĐÚNG cặp
--     lớp này (`baseline-table` là mặc định của component) nên không lệch giao diện.
--   • Trạng thái rỗng nay dùng `emptyText` **nguyên văn**: "Không có dự án phù hợp bộ lọc." (trước là `<Empty>` trong `<td colSpan={9}>`).
--   • Giữ nguyên 3 phép tính theo dòng: `projectOverdueDays(row)` (chậm tiến độ), số nhân sự `scopesOf(projectId).length`,
--     số tổ đội `teamsOf(projectId).length`; giữ nguyên `<strong className="red-text">Chậm N ngày</strong>` và
--     `<StatusBadge value="Đúng tiến độ"/>` cho nhánh đúng hạn.
--   • Nút "Chi tiết ›" vẫn `export-mini`, vẫn `setDetailId` + `setView("detail")` + `setTab(0)` + `setOpenWarehouse("")`.
--   • Viết theo đúng cách đã ghi ở mục 3c của `TASK-083.md`: **khoảng trắng sau `=>`**, thân hàm có `{ }` khi cần biến phụ.
-- Kết quả đo: `DataTable` dùng thật **26 → 27 lần** · bảng tự viết **74 → 73 chỗ** · trạng thái rỗng tự viết
-- **77 → 76 chỗ**. `app/page.tsx` 4019 → 4007 dòng.
-- Khối identity bên dưới do `tools/refresh-phase-identity.mjs` sinh theo cơ chế FIXED POINT.

--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='ada2358d8efd995c23a00486d38094a649bd8ce8544291c205a979b5f3e1885f'
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
