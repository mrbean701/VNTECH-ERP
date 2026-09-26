-- VNTECH ERP V5.3.0 — PHASE 1 / U-09 ĐỢT 5: TOOLBAR 3 MÀN TRONG TAB QUẢN TRỊ (TASK-008)
-- (metadata identity refresh)
-- Không đổi nghiệp vụ, không đổi schema. Chỉ cập nhật source fingerprint.
--
-- Ba khối .table-toolbar chuyển sang ListToolbar — cả ba đúng dạng lỗi §5 (tiêu đề + số lượng ở
-- trái, ô tìm/lọc dồn trong .row-actions ở phải):
--
--   1. UserPermissionMatrix — BỘ LỌC {rows.length}/{users.length} tài khoản khớp
--        → ListToolbar search + filters=[phòng ban, cấp bậc]
--
--   2. SystemLevelManager — GÁN CẤP BẬC + số tài khoản đang giữ
--        → ListToolbar filters=[tài khoản, cấp bậc] + actions=[nút Xếp cấp bậc]
--
--   3. AuditLogManager — BỘ LỌC {rows.length}/{all.length} bản ghi khớp
--        → ListToolbar search + filters=[người dùng, chức năng] + extra=[Từ ngày, Đến ngày]
--          + actions=[nút Xóa lọc]
--
-- NGUYÊN TẮC: giữ nguyên state/handler, không đổi tên hàm action. Mọi chữ hiển thị (tiêu đề,
-- chuỗi đếm, nhãn "— Tất cả ... —", placeholder) giữ NGUYÊN VĂN. Hai ô ngày không phải select nên
-- đưa vào prop `extra`. Prop `sort` không dùng vì cả ba màn không có điều khiển sắp xếp.
--
-- KHÔNG chuyển khối CHI TIẾT THAY ĐỔI nằm trong hộp thoại audit: đó là tiêu đề của một khối chi
-- tiết bên trong hộp thoại, KHÔNG phải toolbar danh sách — chuyển sẽ sai ngữ nghĩa.
--
-- BA MÀN NÀY KHÔNG NẰM TRONG BỘ ẢNH CHUẨN (chúng ở các bước 6, 7, 11 của màn Quản trị, phải bấm
-- tab mới tới). Vì vậy KHÔNG thể dựa vào cổng ảnh để kiểm; phải kiểm bằng --locate + OCR ảnh
-- chụp thật, nếu không sẽ không có bằng chứng.
--
-- BẪY ĐÃ VẤP: tiêu đề màn SystemLevelManager là "GÁN CẤP BẬC" (chữ A), không phải "GẮN" — tôi
-- chép sai dấu nên bản sửa đầu bị trượt. Bài học: luôn in NGUYÊN VĂN khối định sửa trước khi sửa.

--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='0c5e9c0a6b887d58cfdceacc6c055b71908b32444f51cbedf009618e86a836a7'
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
