-- ============================================================================
-- V6 — SỬA LỖI MÃ HOÁ TIẾNG VIỆT TRONG role_catalog
-- ----------------------------------------------------------------------------
-- 8/16 chức danh bị mất dấu thành '?' (vd 'Ch? huy tr??ng' thay vì 'Chỉ huy trưởng').
-- Nguyên nhân: dữ liệu được đọc/ghi vòng qua mysql CLI mà KHÔNG có
--   --default-character-set=utf8mb4, nên ký tự ngoài latin1 bị thay bằng '?'.
--   (Đã vá java-backend/tools/seed-demo.mjs để không tái diễn.)
--
-- Ảnh hưởng: roleLabel() trên UI lấy data.roleCatalog.name nên chức danh hiển thị
-- sai ở màn Nhân sự, phân quyền, hồ sơ nhân sự và mọi nơi hiển thị vai trò.
--
-- Giá trị khôi phục lấy từ nguồn canonical: drizzle/0029_v530_erp_permissions_workflow.sql
-- ============================================================================

UPDATE role_catalog SET name = 'Trưởng phòng Kế hoạch',
       description = 'Quản lý Kế hoạch/Mua hàng và xác nhận cuối'
 WHERE id = 'ROLE-kh-truong' AND code = 'kh_truong';
UPDATE role_catalog SET name = 'Nhân viên Phòng Kế hoạch',
       description = 'Mua hàng, PO, kế hoạch giao hàng'
 WHERE id = 'ROLE-kh-nv' AND code = 'kh_nv';
UPDATE role_catalog SET name = 'Trưởng phòng Dự án',
       description = 'Quản lý dự án và xác nhận cuối'
 WHERE id = 'ROLE-da-truong' AND code = 'da_truong';
UPDATE role_catalog SET name = 'Nhân viên Phòng Dự án',
       description = 'Kiểm tra khối lượng đặt hàng'
 WHERE id = 'ROLE-da-nv' AND code = 'da_nv';
UPDATE role_catalog SET name = 'Thư ký Tổng giám đốc / Trưởng phòng Hành chính Pháp chế',
       description = 'Duyệt sau CHT trước Phòng Dự án'
 WHERE id = 'ROLE-thuky' AND code = 'thuky';
UPDATE role_catalog SET name = 'Chỉ huy trưởng',
       description = 'Xác nhận nhu cầu dự án'
 WHERE id = 'ROLE-cht' AND code = 'cht';
UPDATE role_catalog SET name = 'Kỹ sư dự án',
       description = 'Lập Phiếu đề nghị mua hàng tại BCH'
 WHERE id = 'ROLE-ksda' AND code = 'ksda';
UPDATE role_catalog SET name = 'Thủ kho dự án',
       description = 'Chỉ đúng dự án và kho được phân công'
 WHERE id = 'ROLE-thu-kho' AND code = 'thu_kho';

-- Kiểm chứng sau khi chạy (phải = 0):
--   SELECT COUNT(*) FROM role_catalog WHERE name LIKE '%?%' OR description LIKE '%?%';
