-- VNTECH ERP V5.3.0 MỤC 6/8 — PHÂN QUYỀN PHÒNG BAN (metadata identity refresh)
-- Không đổi nghiệp vụ và không đổi schema. Chỉ cập nhật source fingerprint sau khi
-- sửa `DepartmentPermissionManager` trong app/page.tsx theo yêu cầu người dùng:
--
--   «Phần dept perm nên để dạng check box đối với các quyền của phòng ban, hiển thị
--    theo danh sách phòng ban, ... phần hiển thị hiện tại đang quá tốn diện tích label
--    CHỌN PHÒNG BAN và các nút chức năng ở bên phải đang không cân xứng với nhau —
--    nên sắp xếp thành 1 dòng cho gọn.»
--
-- Thay đổi cụ thể:
--   (1) BỎ dropdown "— Chọn phòng ban —" → dựng cột DANH SÁCH PHÒNG BAN bên trái,
--       mỗi phòng là một nút hiển thị mã + tên + số quyền đã cấp; phòng đang chọn
--       được tô nền và có vạch xanh bên trái.
--   (2) Các nút chức năng (Cấp nhóm Kế hoạch / Dự án / Tài chính / Hành chính /
--       Bỏ chọn tất cả / Lưu thay đổi) gom về MỘT HÀNG, cùng chiều cao
--       (`min-height: var(--vt-control-h)`) nên không còn lệch nhau.
--   (3) Quyền giữ nguyên dạng CHECKBOX (đã đúng yêu cầu từ trước, đã kiểm chứng lại).
--   (4) Bố cục 2 cột tự thu về 1 cột khi màn hình ≤ 1024px.
--
-- Ghi chú: phần "hiển thị theo danh sách phòng ban" kèm số quyền đã cấp giúp rà soát
-- nhanh phòng nào chưa được cấu hình mà không phải mở từng phòng.

-- Mục này không thay đổi cấu trúc dữ liệu.

--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='532f378eff8f01ecd69e440fca6d22d2400103f7a9019f45fb61c7d831fd3ebf'
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
