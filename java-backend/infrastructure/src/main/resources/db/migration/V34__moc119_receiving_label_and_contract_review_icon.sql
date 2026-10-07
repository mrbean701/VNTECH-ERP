-- =============================================================================
-- V34 — MỐC 119a: SỬA 2 Ô ĐÃ BỊ MYSQL LÀM HỎNG KHI CHẠY MIGRATION
-- =============================================================================
-- VÌ SAO
--   User 01/10/2026 báo: «menu kế hoạch giao hàng đang bị lỗi chính tả».
--   Đo trực tiếp trên CSDL `vntech_erp` (chỉ đọc) cho thấy `module_catalog` có 76 dòng,
--   trong đó **13 dòng chứa KÝ TỰ DẤU HỎI THẬT** (byte `0x3F`), không phải lỗi font:
--
--       module_key              | label                                            | HEX cột đầu
--       ------------------------|--------------------------------------------------|-------------------------------
--       receiving               | K? ho?ch giao hàng                              | 4B 3F 20686F 3F 6368 ...
--       admin_tab_01..14 (12 dòng)| Quan tri he thong - Tab NN. T?i kho?n ...        | ...
--
--   Vì `hàng` vẫn là UTF-8 đúng (`C3A0`) trong khi `ế`/`ạ` thành `3F`, nên đây KHÔNG phải
--   lỗi encoding lúc hiển thị ⇒ chính MySQL đã thay ký tự đó bằng `?` khi CHẠY
--   migration ở một phiên bản có `SET NAMES` không đúng.
--
--   NGUỒN GỐC: file seed `drizzle/0029_v530_erp_permissions_workflow.sql:141` ĐÃ viết
--   ĐÚNG (`label='Kế hoạch giao hàng'`) ⇒ file nguồn không sai, chỉ lúc thực thi mới hỏng.
--   Vì vậy KHÔNG sửa file drizzle (đã chạy, sửa cũng không đổi được CSDL hiện hữu).
--
-- PHẠM VI
--   V33 (MỐC 114) đã sửa 12 nhãn `admin_tab_*` nhưng KHÔNG chạm `receiving`.
--   V34 sửa đúng **2 ô còn lại**:
--     1. `module_catalog.receiving.label`              → sửa nhãn hiển thị trên MENU
--     2. `module_catalog.dept_legal_contract_review.icon` → sửa ký hiệu `H?` thành `HĐ`
--
-- AN TOÀN
--   ⛔ KHÔNG INSERT, KHÔNG DELETE, KHÔNG TRUNCATE, KHÔNG đổi kiểu cột.
--   ⛔ KHÔNG đụng `module_key` / `group_key` / `group_name` / `sort_order` / `active`.
--   ⛔ CHỐT ĐIỀU KIỆN "CÒN HỎNG" bằng `LIKE '%?%'` thay vì so sánh đúng chuỗi hỏng:
--      nếu Admin đã TỰ SỬA tay (nhãn không còn `?`) thì migration bỏ qua ⇒ không đè
--      lên lựa chọn của Admin. Đây cũng chính là điều kiện idempotent.
--   ✅ Idempotent: chạy lần 2 khớp 0 dòng.
--
-- SAU KHI CHẠY — kiểm chứng bằng:
--   SELECT COUNT(*) FROM module_catalog WHERE label LIKE '%?%' OR icon LIKE '%?%';
--   → phải BẰNG 0.
--   SELECT label FROM module_catalog WHERE module_key='receiving';
--   → `Kế hoạch giao hàng`
--
-- VỀ CÁCH ÁP DỤNG
--   V32 (MỐC 113) và V33 (MỐC 114) vẫn chưa chạy trên production
--   (`flyway_schema_history` mới nhất = V31, đọc 2026-10-01).
--   V34 chạy SAU chúng theo đúng thứ tự phiên bản khi app khởi động.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) MENU «KẾ HOẠCH GIAO HÀNG» — module_key = 'receiving'
-- -----------------------------------------------------------------------------
-- Đo lại: sort_order=30, group_key='purchasing', icon='GN' — giữ nguyên cả ba.
UPDATE module_catalog
   SET label     = 'Kế hoạch giao hàng',
       updated_at = CURRENT_TIMESTAMP
 WHERE module_key = 'receiving'
   AND label LIKE '%?%';

-- -----------------------------------------------------------------------------
-- 2) KÝ HIỆU MENU CỦA MODULE 'REVIEW HĐ' — module_key = 'dept_legal_contract_review'
-- -----------------------------------------------------------------------------
-- Cột `icon` là KÝ HIỆU VĂN BẢN TỰ DO (UI giới hạn `maxLength={4}`, hiển thị thẳng
-- trong thẻ `<i>{item.icon}</i>` ở màn Cấu hình menu cây), KHÔNG phải khoá tra bảng icon
-- ⇒ sửa chữa không làm hỏng gì. Nhãn của module này là `Review HĐ` nên ký hiệu `HĐ`
-- là giá trị đúng (cùng kiểu với `ĐN`, `ĐM` đã có sẵn trong cột này).
UPDATE module_catalog
   SET icon      = 'HĐ',
       updated_at = CURRENT_TIMESTAMP
 WHERE module_key = 'dept_legal_contract_review'
   AND icon LIKE '%?%';