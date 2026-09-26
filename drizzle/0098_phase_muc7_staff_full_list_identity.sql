-- VNTECH ERP V5.3.0 MỤC 7/8 — DANH SÁCH NHÂN SỰ FULL MÀN (metadata identity refresh)
-- Không đổi nghiệp vụ và không đổi schema. Chỉ cập nhật source fingerprint sau khi:
--
--   (1) thêm component `AdminStaffList` trong app/page.tsx và thay khối mini-list cũ
--       ở tab "Nhân sự" của màn Quản trị hệ thống.
--
-- Lý do (nguyên văn yêu cầu): «Phần danh sách nhân sự trong 1 Nhân sự đang không hiển
-- thị đúng danh sách mà bị chia đôi màn hình ra rồi, tôi muốn nó phải hiển thị dạng
-- danh sách full màn và có các chức năng crud search sort fillter».
--
-- Nguyên nhân gốc tìm được: khối cũ nằm trong `.admin-overview-grid` (lưới nhiều cột)
-- và chỉ render `.admin-mini-list` — một danh sách nút, KHÔNG phải bảng, và bị giới hạn
-- `slice(0,30)` nên không bao giờ hiện đủ nhân sự.
--
-- Thay đổi:
--   • Bảng toàn màn hình 9 cột: STT · Mã NV · Họ tên · Tài khoản · Chức danh ·
--     Phòng ban · Email · Trạng thái · Thao tác.
--   • Tìm kiếm (tên/mã NV/email/tài khoản) + 4 bộ lọc: phòng ban, chức danh,
--     trạng thái, sắp xếp + chọn số dòng mỗi trang.
--   • Phân trang đầy đủ (25/50/100 mỗi trang) — khắc phục giới hạn 30 dòng cũ.
--   • Nút CRUD dùng CHUNG modal với admin: Hồ sơ (userProfile) · Sửa (userEdit) ·
--     Quyền (access) — không tạo modal trùng.
--   • Ép `.admin-overview-grid` về một cột để khối không còn bị chia đôi.

-- Mục này không thay đổi cấu trúc dữ liệu.

--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='fc65a4205b2575970ee2293dfbfe152696d93a7bed9ae697ffee7174a3c6ed2a'
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
