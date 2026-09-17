-- VNTECH ERP V5.3.0 — PHASE 1 / UI: LÀM MỚI ĐỊNH DANH NGUỒN (TASK-083 · U-15 đợt 2, tiếp 4)
-- (metadata identity refresh)
-- Không đổi nghiệp vụ, không đổi schema. Chỉ cập nhật source fingerprint.
--
-- VÌ SAO:
--   1) `app/components/ui/DataTable.tsx` — THÊM thuộc tính **`tableClassName`** cho chính thẻ `<table>`
--      (đặt ở props). Đây là yêu cầu BẮT BUỘC khi chuyển các bảng cũ mang **lớp định dạng riêng**:
--      `.resizable-data-table` (`globals.css:1261-1263`: `table-layout:fixed` + quy tắc ngắt dòng),
--      `.data-table` (`globals.css:124`: con trỏ dòng), `.material-list-table` (`canonical.css:732`: chặn
--      ngắt dòng ô). ⚠️ **Đã gặp thật 18/09:** chuyển bảng lũy kế vật tư mà bỏ lớp ⇒ MẤT định dạng bảng;
--      đã phát hiện bằng cách rà CSS trước khi nạp bản và sửa bằng `tableClassName="resizable-data-table"`.
--   2) `app/page.tsx` — thêm **2 bảng** chuyển sang `<DataTable>`:
--      • `ProjectManagement` — **danh sách KHO của dự án** (9 cột: mã · tên · loại · thủ kho · tồn kho ·
--        chờ nhập · chờ xuất · chờ duyệt · nút "Xem kho ›"); `emptyText` nguyên văn: "Dự án chưa có kho."
--      • `BoqControl` — **chi tiết lũy kế theo vật tư** (10 cột) + GIỮ lớp `resizable-data-table`;
--        `emptyText` nguyên văn: "Chưa có dòng vật tư BOQ/Hợp đồng cho phạm vi đang chọn."
-- Kết quả đo: `DataTable` dùng thật **22 → 24 lần** · bảng tự viết **78 → 76 chỗ** · trạng thái rỗng tự viết
-- **81 → 79 chỗ**.
-- Khối identity bên dưới do `tools/refresh-phase-identity.mjs` sinh theo cơ chế FIXED POINT.

--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='69a1d3cc1b3b55fc4285680e7c5ae351a0e54950db40b5e8c233f8049d85c561'
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
