-- VNTECH ERP V5.3.0 — PHASE 1 / UI: LÀM MỚI ĐỊNH DANH NGUỒN (TASK-083 · U-15 đợt 2, tiếp 3)
-- (metadata identity refresh)
-- Không đổi nghiệp vụ, không đổi schema. Chỉ cập nhật source fingerprint.
--
-- VÌ SAO: thêm **4 bảng** nữa trong `app/page.tsx` chuyển sang `<DataTable>`, tiếp nối các head 0116–0118:
--   • `TeamManagement` — bảng DANH SÁCH TỔ ĐỘI (9 cột: mã · tên · hạng mục · dự án · kho · thành viên ·
--     quyết toán · trạng thái · nút "Chi tiết ›"); các phép tính `projOf`/`whOf`/`membersOf`/`settled`
--     giữ NGUYÊN công thức, chỉ chuyển vào `render` của đúng cột. `emptyText` nguyên văn: "Không có tổ đội phù hợp."
--   • `MaterialCatalogPage` — 2 bảng báo cáo alias 3 cột và 4 cột (dòng một, khoá theo chỉ số như cũ);
--     `emptyText` nguyên văn: "Không có alias trùng." và "Không có xung đột alias với tên chuẩn."
--   • `MaterialCatalogPage` — bảng danh mục vật tư ở **chế độ CHỈ XEM** (7 cột);
--     `emptyText` nguyên văn: "Danh mục vật tư chưa có dữ liệu."
-- Kết quả đo: `DataTable` dùng thật **18 → 22 lần** · bảng tự viết **82 → 78 chỗ** · trạng thái rỗng tự viết
-- **85 → 81 chỗ** · số bảng "cần cân nhắc" **9 → 5**.
-- Khối identity bên dưới do `tools/refresh-phase-identity.mjs` sinh theo cơ chế FIXED POINT.

--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='b66963903acbc99087b760e4aba35fa2b6470ed4a04d3e158005635721158223'
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
