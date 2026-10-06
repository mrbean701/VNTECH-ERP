-- =============================================================================
-- V35 — MỐC 121: ĐỔI TÊN MENU «Mua hàng & PO» → «PR & PO»
-- =============================================================================
-- YÊU CẦU USER (01/10/2026, kèm ảnh chụp màn hình):
--   «1. Menu mua hàng & PO đổi tên thành PR & PO»
--   «2. Trong menu PR & PO sẽ có 2 tab, mỗi tab hiển thị 1 danh sách theo chức năng
--        của nó. PR -> hiển thị các đơn PR, PO hiển thị các đơn PO.»
--
-- TRẠNG THÁI SỬA TRƯỚC KHI CHẠY MIGRATION NÀY
--   Vì sao phải có V35: nhãn menu NẰM TRONG CSDL (`module_catalog.label`), không phải
--   trong mã nguồn. Chỉ sửa `lib/menu-helpers.ts` (nhãn dự phòng) sẽ KHÔNG đổi được
--   gì trên máy chạy thật, vì `module_catalog` có dòng và thắng.
--   Ba nơi đã sửa song song cho khớp nhau:
--     • `lib/menu-helpers.ts:84`  — nhãn DỰ PHÒNG khi DB không trả về
--     • `app/page.tsx:168`       — TIÊU ĐỀ + mô tả màn hình
--     • file này                 — nhãn THẬT trên CSDL
--
--   Nhất quán với `docs/dsh/MT3_USER_DECISIONS.md:40` — bảng tổng hợp 10 tab Mua hàng
--   & Cung ứng đã ghi từ trước «PR & PO (Mua hàng & PO) | purchasing» ⇒ tên đích
--   «PR & PO» là CHÍNH THỨC, không phải đề xuất mới.
--
-- PHẠM VI
--   ⛔ KHÔNG INSERT, KHÔNG DELETE, KHÔNG TRUNCATE, KHÔNG đổi kiểu cột.
--   ⛔ KHÔNG đụng `module_key` / `group_key` / `group_name` / `sort_order` / `active` / `icon`.
--     (Nhóm menu vẫn giữ là «MUA HÀNG & CUNG ỨNG» — anh chỉ yêu cầu đổi tên MỤC này.)
--
-- AN TOÀN / IDEMPOTENT
--   Điều kiện `label = 'Mua hàng & PO'` ⇒ chỉ sửa khi đúng tên cũ.
--   Nhánh `LIKE '%?%'` bắt trường hợp MySQL từng làm hỏng ký tự (đã xảy ra ở V34):
--   lúc đó nhãn không còn khớp chuỗi sạch nên cần nhánh thứ hai để chữa nốt.
--   Nếu Admin đã TỰ SỬA tay sang tên khác ⇒ cả 2 điều kiện đều sai ⇒ migration bỏ qua,
--   KHÔNG đè lên lựa chọn của Admin. Chạy lần 2 khớp 0 dòng.
--
-- SAU KHI CHẠY — kiểm chứng bằng:
--   SELECT module_key, label FROM module_catalog WHERE module_key = 'purchasing';
--   → phải là `PR & PO`
--
-- VỀ CÁCH ÁP DỤNG
--   V32/V33/V34 vẫn có thể chưa chạy trên production (`flyway_schema_history` mới nhất
--   = V31, đọc 01/10/2026). V35 chạy SAU chúng theo đúng thứ tự phiên bản khi app khởi động.
-- =============================================================================

UPDATE module_catalog
   SET label      = 'PR & PO',
       updated_at = CURRENT_TIMESTAMP
 WHERE module_key = 'purchasing'
   AND (label = 'Mua hàng & PO' OR label LIKE '%?%');
