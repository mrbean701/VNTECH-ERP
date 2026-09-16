-- VNTECH ERP V5.3.0 PHASE P3 — HỒ SƠ NHÂN SỰ CHI TIẾT (metadata identity refresh)
-- Không đổi schema/nghiệp vụ; chỉ cập nhật source fingerprint sau khi:
--   (1) thêm panel "Hồ sơ nhân sự chi tiết": chức vụ · phòng ban · liên hệ · thông tin cá nhân,
--   (2) danh sách dự án đã/đang tham gia — dự án gần nhất lên đầu, dự án đã kết thúc/đã rời
--       được làm mờ và xếp xuống dưới kèm trạng thái,
--   (3) chức vụ trong từng dự án lấy từ approval_project_assignments (workflowAssignments),
--   (4) "Thao tác gần đây" (audit log) và "Đơn từ & giấy tờ" (HĐLĐ, bảo hiểm, phiếu đề nghị,
--       tạm ứng) — phần đơn từ chỉ hiện trong hồ sơ nhân sự của bộ phận Nhân sự,
--   (5) bấm được vào dòng nhân sự ở cả tab "Nhân sự" (Quản trị) và màn "Hồ sơ nhân sự".
-- Bản MySQL: KHÔNG cần migration — thay đổi thuần giao diện.

--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='c06b1c93636e8a0851a71837739f4530ac832ba992e190560c3b51e36b4b94bf'
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
