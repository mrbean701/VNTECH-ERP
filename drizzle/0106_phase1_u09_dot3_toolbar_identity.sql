-- VNTECH ERP V5.3.0 — PHASE 1 / U-09 ĐỢT 3: CHUẨN HOÁ TOOLBAR 3 MÀN CÓ TRONG BỘ ẢNH CHUẨN
-- (metadata identity refresh)
-- Không đổi nghiệp vụ, không đổi schema. Chỉ cập nhật source fingerprint.
--
-- Chọn 3 màn này vì cả ba ĐỀU NẰM TRONG BỘ ẢNH CHUẨN (03-work · 04-team · 02-project) nên
-- cổng so ảnh kiểm chứng được trực tiếp — khác với các màn không có ảnh chuẩn, phải kiểm
-- bằng --locate + OCR mới có bằng chứng.
--
-- Bốn khối toolbar đã chuyển sang <ListToolbar>:
--
--   1. WorkCenter — khối .table-toolbar ở chế độ danh sách việc:
--        trước: hàng <div> tiêu đề + hàng <div class="row-actions"> chứa input tìm kiếm
--        sau  : ListToolbar title="CÔNG VIỆC" + note (giữ NGUYÊN VĂN chuỗi đếm) + search
--
--   2. TeamManagement — khối .table-toolbar "DANH SÁCH TỔ ĐỘI":
--        sau  : ListToolbar title + note (giữ nguyên) + search
--
--   3. ProjectManagement — khối .table-toolbar "DANH SÁCH DỰ ÁN":
--        trước: input tìm + 2 <select> (trạng thái, sắp xếp) nằm trong .row-actions
--        sau  : ListToolbar search + filters=[trạng thái] + sort=[sắp xếp]
--               (dùng đúng prop `sort` của khuôn chuẩn thay vì select tự chế)
--
--   4. ProjectManagement — khối .table-toolbar ở ĐẦU MÀN CHI TIẾT dự án:
--        trước: <strong> tiêu đề + <span> mô tả + 2 nút trong .row-actions
--        sau  : ListToolbar title + note + actions=[2 nút]
--
-- NGUYÊN TẮC ĐÃ GIỮ: không đổi handler, không đổi state, không đổi tên hàm action, không tự
-- đặt chữ mới. Mọi chữ hiển thị đều lấy NGUYÊN VĂN từ markup cũ (tiêu đề, chuỗi đếm, placeholder).
--
-- VÌ SAO KHÔNG LÀM MÀN Receiving TRONG ĐỢT NÀY: màn GIAO NHẬN không có tiêu đề sẵn trên màn
-- (chỉ có card lọc tách rời + .table-toolbar "Tổng N bản ghi"). Thêm tiêu đề sẽ là TỰ ĐẶT CHỮ,
-- trái nguyên tắc không suy đoán — cần xác nhận tên màn từ menu trước khi làm.
--
-- KIỂM CHỨNG DỰ KIẾN: cả 3 màn có trong bộ ảnh chuẩn nên dự đoán CHỈ 03-work · 04-team ·
-- 02-project được phép lệch; 4 màn còn lại (01-dashboard · 05-material · 06-warehouse ·
-- 07-admin) phải 0 px.

--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='2a2c61885ddb98c9fbf742985f93611aba124eae651890ad38f33515e35d082c'
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
