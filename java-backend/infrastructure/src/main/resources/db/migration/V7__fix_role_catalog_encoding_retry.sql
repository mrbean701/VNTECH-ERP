-- ============================================================================
-- V7 — SỬA LỖI MÃ HOÁ role_catalog (khắc phục bản V6 khớp 0 dòng)
-- ----------------------------------------------------------------------------
-- V6 dùng điều kiện `WHERE id='ROLE-cht' AND code='cht'` theo id trong nguồn drizzle
-- (dạng gạch nối `ROLE-cht`). Nhưng dữ liệu thực tế trong MySQL dùng id dạng gạch dưới
-- (`ROLE_CHT`, `ROLE_DANV`, `ROLE_DATRUONG`, `ROLE_KHNV`, `ROLE_KHTRUONG`, `ROLE_KSDA`,
-- `ROLE_THUKHO`, `ROLE_THUKY`) nên V6 KHÔNG khớp dòng nào và dữ liệu vẫn mất dấu.
-- MySQL không báo lỗi khi UPDATE khớp 0 dòng, nên Flyway vẫn ghi success=1.
--
-- Bản này khớp theo `code` — duy nhất và đúng cho cả hai kiểu id.
--
-- Kiểm chứng sau khi chạy (phải = 0):
--   SELECT COUNT(*) FROM role_catalog WHERE name LIKE '%?%' OR description LIKE '%?%';
-- ============================================================================

UPDATE role_catalog SET name = 'Trưởng phòng Kế hoạch',
       description = 'Quản lý Kế hoạch/Mua hàng và xác nhận cuối'
 WHERE code = 'kh_truong';
UPDATE role_catalog SET name = 'Nhân viên Phòng Kế hoạch',
       description = 'Mua hàng, PO, kế hoạch giao hàng'
 WHERE code = 'kh_nv';
UPDATE role_catalog SET name = 'Trưởng phòng Dự án',
       description = 'Quản lý dự án và xác nhận cuối'
 WHERE code = 'da_truong';
UPDATE role_catalog SET name = 'Nhân viên Phòng Dự án',
       description = 'Kiểm tra khối lượng đặt hàng'
 WHERE code = 'da_nv';
UPDATE role_catalog SET name = 'Thư ký Tổng giám đốc / Trưởng phòng Hành chính Pháp chế',
       description = 'Duyệt sau CHT trước Phòng Dự án'
 WHERE code = 'thuky';
UPDATE role_catalog SET name = 'Chỉ huy trưởng',
       description = 'Xác nhận nhu cầu dự án'
 WHERE code = 'cht';
UPDATE role_catalog SET name = 'Kỹ sư dự án',
       description = 'Lập Phiếu đề nghị mua hàng tại BCH'
 WHERE code = 'ksda';
UPDATE role_catalog SET name = 'Thủ kho dự án',
       description = 'Chỉ đúng dự án và kho được phân công'
 WHERE code = 'thu_kho';
