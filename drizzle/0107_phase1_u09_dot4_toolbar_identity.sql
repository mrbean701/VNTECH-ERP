-- VNTECH ERP V5.3.0 — PHASE 1 / U-09 ĐỢT 4: TOOLBAR DANH SÁCH NHÂN SỰ + DANH BẠ NỘI BỘ
-- (metadata identity refresh)
-- Không đổi nghiệp vụ, không đổi schema. Chỉ cập nhật source fingerprint.
--
-- 1. Admin — bước 1 "DANH SÁCH NHÂN SỰ / NGƯỜI DÙNG" (khối NẰM TRONG bộ ảnh chuẩn 07-admin):
--    trước: <div class="table-toolbar"> với tiêu đề + số lượng ở trái và MỘT nút ＋ ở phải;
--           ô tìm kiếm nằm sâu trong AdminStaffList (.staff-full-filters).
--    sau  : ListToolbar = tiêu đề + số lượng (trái) ‖ TÌM + nút ＋ (phải) — đúng khuôn §5.
--
--    Ô tìm kiếm ĐÃ CHUYỂN LÊN toolbar. Trạng thái tìm vẫn do màn cha (Admin) giữ trong adminQuery
--    và truyền xuống qua prop query, nên logic lọc KHÔNG đổi. Vì ô nhập không còn trong
--    AdminStaffList nên prop onQuery được bỏ HẲN (đã kiểm: onQuery chỉ xuất hiện đúng 3 chỗ —
--    chữ ký hàm, ô nhập, và lời gọi) để không phát sinh cảnh báo biến không dùng.
--
--    Bốn <select> phụ (phòng ban · chức danh · trạng thái · sắp xếp) và ô số dòng/trang VẪN nằm
--    trong thân danh sách: chúng là state nội bộ của AdminStaffList, muốn đưa lên toolbar phải
--    nâng state lên màn cha — việc đó để đợt sau, KHÔNG làm ẩu trong đợt này.
--
-- 2. StaffDirectory — DANH BẠ NHÂN SỰ (màn này KHÔNG có trong bộ ảnh chuẩn):
--    trước: hai khối rời — .staff-directory-head (nhãn + <h2> + mô tả + thống kê ONLINE/OFFLINE)
--           và .staff-toolbar (ô tìm ⌕ + select bộ phận + chuỗi đếm "x/y NHÂN SỰ").
--    sau  : MỘT ListToolbar = tiêu đề + mô tả + số lượng (trái) ‖ TÌM · LỌC bộ phận · thống kê
--           ONLINE/OFFLINE (phải). Mọi chữ giữ NGUYÊN VĂN, không tự đặt chữ mới.
--
-- KIỂM CHỨNG: màn Admin nằm trong bộ ảnh chuẩn nên cổng ảnh kiểm trực tiếp (dự đoán: chỉ
-- 07-admin được phép lệch). StaffDirectory không có ảnh chuẩn nên phải kiểm bằng --locate +
-- OCR ảnh chụp thật mới có bằng chứng.

--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='5aece2c2223aac1ec84211d19b0430cc65fbed4922c3105607778fa61ed3d00a'
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
