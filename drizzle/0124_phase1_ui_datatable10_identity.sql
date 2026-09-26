-- VNTECH ERP V5.3.0 — PHASE 1 / UI: LÀM MỚI ĐỊNH DANH NGUỒN (TASK-083 · U-15 đợt 2, tiếp 8)
-- (metadata identity refresh)
-- Không đổi nghiệp vụ, không đổi schema. Chỉ cập nhật source fingerprint.
--
-- VÌ SAO: chuyển **bảng danh sách Phiếu đề nghị** (`Requests`, màn `requests`, 9 cột) sang `<DataTable>` — bảng thứ 15.
--   • Đây là bảng **ĐẦU TIÊN cần chọn dòng** ⇒ phải **mở rộng `DataTable` lần thứ 4**: thêm tham số
--     **`rowClassName?: (row, index) => string | undefined`** cho lớp CSS trên `<tr>`.
--   • VÌ SAO phải là **lớp CSS** chứ không phải `rowStyle` đã có: luật tô dòng đang chọn nằm ở
--     `app/globals.css:1217` — `.selected-row td { background:#eef6ff!important }` — **có `!important`** nên
--     **không thể** thay bằng style nội tuyến trên `<tr>` (style nội tuyến thua `!important` của `<td>`).
--   • Giữ **nguyên văn** mọi thứ còn lại: lớp bảng `baseline-table data-table` (truyền `tableClassName="data-table"`
--     để giữ `globals.css:124` con trỏ dòng), 9 cột đúng thứ tự + 2 nút `icon-mini` có `stopPropagation`,
--     ô chọn `radio readOnly`, và `emptyText` nguyên văn: "Không có phiếu phù hợp bộ lọc."
--   • Dải phân trang `<div className="table-pagination functional-summary">` **ở ngoài** `<table>` — giữ nguyên vị trí
--     (vẫn là phần tử anh em ngay sau bảng, KHÔNG đưa vào `footer` của `DataTable` vì `footer` render `<tfoot>` **trong** bảng).
--   • ⚠️ **Thay đổi CÓ CHỦ Ý (đã ghi hồ sơ):** dòng nay có thêm hiệu ứng **hover** vì `DataTable` gắn lớp `dt-clickable`
--     cho mọi dòng bấm được (`canonical.css:829`). Bảng cũ **chỉ** có con trỏ dòng, không có nền hover. Đây là
--     hệ quả **bắt buộc** của component dùng chung (mục tiêu U-02: "bấm cả dòng để mở chi tiết"), và **không đổi**
--     ảnh chụp tĩnh (hover không nằm trong ảnh) — cổng ảnh vẫn phải **trùng byte**.
-- Kết quả đo: `DataTable` dùng thật **27 → 28 lần** · bảng tự viết **73 → 72 chỗ** · trạng thái rỗng tự viết
-- **76 → 75 chỗ**. `app/page.tsx` 4007 → 4025 dòng (do xuống dòng khối JSX, không thêm nghiệp vụ).
-- Khối identity bên dưới do `tools/refresh-phase-identity.mjs` sinh theo cơ chế FIXED POINT.

--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='10606747fb52f13816c385f70f6fc33c86f074f15fa191c82b8def539ff2fbd5'
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
