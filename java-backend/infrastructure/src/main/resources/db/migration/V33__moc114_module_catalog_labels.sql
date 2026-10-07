-- =============================================================================
-- V33 — MỐC 114d: SỬA NHÃN TIẾNG VIỆT THIẾU DẤU CỦA 14 TAB QUẢN TRỊ HỆ THỐNG
-- =============================================================================
-- VÌ SAO
--   User 01/10/2026 yêu cầu: «1 số label vẫn bị lỗi tiếng Việt, hãy audit lại
--   toàn bộ hệ thống, phần nào có tiếng Việt phải viết có dấu» (MỐC 114).
--   Đo trực tiếp trên CSDL `vntech_erp` (chỉ đọc) cho thấy:
--       module_catalog có 76 dòng; 14 dòng có nhãn BẮT ĐẦU bằng tiền tố
--       KHÔNG DẤU `Quan tri he thong - Tab NN.` ⇒ menu Quản trị hệ thống hiển thị
--       sai tiếng Việt ở CẢ 14 tab. Trong đó 3 tab (02, 07, 11) không có bất kỳ
--       dấu nào: `…- Tab 02. Tai chinh`, `…- Tab 07. Cap bo he thong`, `…- Tab 11. Audit log`.
--   Nguồn gốc: `drizzle/0262_phase_gd_module_quan_tri_he_thong_tung_tab_identity.sql`
--   đã INSERT tiền tố không dấu. File drizzle này LỊCH SỬ đã chạy nên KHÔNG sửa —
--   sửa nó không đổi được CSDL hiện hữu ⇒ migration MỚI mới là cách đúng.
--
-- NGUỒN GỐC
--   Đo đạc:  SELECT COUNT(*) FROM module_catalog WHERE label LIKE 'Quan tri he thong%';
--             → 14 (đã xác minh trên `vntech_erp` production, truy vấn CHỈ ĐỌC).
--
-- AN TOÀN
--   ⛔ KHÔNG INSERT, KHÔNG DELETE, KHÔNG TRUNCATE, KHÔNG đổi kiểu cột, KHÔNG đổi
--      `module_key`/`icon`/`active`/`sort_order`/`group_key`/`group_name`/`system_locked`.
--   ⛔ KHÔNG đụng 62 module khác.
--   ⛔ CHỐT `label LIKE 'Quan tri he thong - Tab %'`: nếu Admin đã TỰ ĐỔI tên tab qua
--      chức năng `save_module_catalog`, nhãn đó KHÔNG còn khớp mệnh đề ⇒ migration
--      bỏ qua, không đè lên lựa chọn của Admin.
--   ✅ IDEMPOTENT: chạy lần 2 khớp 0 dòng (nhãn đã có dấu ≠ tiền tố không dấu).
--   ✅ Chạy an toàn trên DB đã bổ sung bằng tay: vẫn UPDATE đúng những dòng còn sai.
--
-- LƯU Ý
--   V32 (MỐC 113) chưa chạy trên production (`flyway_schema_history` mới nhất = V31).
--   V33 chạy SAU V32 khi app khởi động, đúng thứ tự phiên bản.
--
-- SAU KHI CHẠY — kiểm chứng bằng:
--   SELECT COUNT(*) FROM module_catalog WHERE label LIKE 'Quan tri he thong%';
--   → phải BẰNG 0. Còn 14 dòng `admin_tab_%` với nhãn có dấu là đạt.
-- =============================================================================

UPDATE module_catalog
   SET label = CASE module_key
         WHEN 'admin_tab_01' THEN 'Quản trị hệ thống - Tab 01. Tài khoản'
         WHEN 'admin_tab_02' THEN 'Quản trị hệ thống - Tab 02. Tổ chức'
         WHEN 'admin_tab_03' THEN 'Quản trị hệ thống - Tab 03. Chức danh / vai trò'
         WHEN 'admin_tab_04' THEN 'Quản trị hệ thống - Tab 04. Nhóm quyền nghiệp vụ'
         WHEN 'admin_tab_05' THEN 'Quản trị hệ thống - Tab 05. Phân quyền phòng ban'
         WHEN 'admin_tab_06' THEN 'Quản trị hệ thống - Tab 06. Phân quyền người dùng'
         WHEN 'admin_tab_07' THEN 'Quản trị hệ thống - Tab 07. Cấp bậc hệ thống'
         WHEN 'admin_tab_08' THEN 'Quản trị hệ thống - Tab 08. Phạm vi dự án & kho'
         WHEN 'admin_tab_09' THEN 'Quản trị hệ thống - Tab 09. Workflow phê duyệt'
         WHEN 'admin_tab_10' THEN 'Quản trị hệ thống - Tab 10. Ngoại lệ cá nhân'
         WHEN 'admin_tab_11' THEN 'Quản trị hệ thống - Tab 11. Audit log'
         WHEN 'admin_tab_12' THEN 'Quản trị hệ thống - Tab 12. Cấu hình hệ thống'
         WHEN 'admin_tab_13' THEN 'Quản trị hệ thống - Tab 13. Thông báo'
         WHEN 'admin_tab_14' THEN 'Quản trị hệ thống - Tab 14. Báo lỗi'
       END,
       updated_at = CURRENT_TIMESTAMP
 WHERE module_key IN ('admin_tab_01', 'admin_tab_02', 'admin_tab_03', 'admin_tab_04',
                      'admin_tab_05', 'admin_tab_06', 'admin_tab_07', 'admin_tab_08',
                      'admin_tab_09', 'admin_tab_10', 'admin_tab_11', 'admin_tab_12',
                      'admin_tab_13', 'admin_tab_14')
   AND label LIKE 'Quan tri he thong - Tab %';

-- -----------------------------------------------------------------------------
-- PHẦN 2 — ĐÃ TÁCH RA KHỎI MIGRATION NÀY (2026-10-01)
-- -----------------------------------------------------------------------------
-- Trước đây V33 còn chứa thêm một `UPDATE warehouses` sửa 2 tên kho seed thiếu dấu
-- (`Kho to doi - To doi dien nuoc 2` → `Kho tổ đối - Tổ đối điện nước 2`, và
--  `Kho to doi - To doi hoan thien 3` → `Kho tổ đối - Tổ đối hoàn thiện 3`).
--
-- ⛔ ĐÃ GỠ KHỎI ĐÂY vì đó là **DỮ LIỆU NGHIỆP VỤ**, không phải nhãn hệ thống, và
--    anh CHƯA duyệt. Giữ nó trong V33 nghĩa là Flyway sẽ tự ý đổi tên kho ngay
--    lần chạy kế tiếp mà không có quyết định nghiệp vụ nào.
--
-- ⏸ Trạng thái: CHỜ USER CONFIRMATION (xem `docs/dsh-state/CHECKLIST.md`).
--    Khi anh đồng ý, tạo `V35__moc119_warehouse_names.sql` với đúng 2 `UPDATE` trên
--    (chốt `name LIKE 'Kho to doi - To doi%'` để không đè lên tên do Admin đặt tay).
--
-- ℹ️ Ghi chú kỹ thuật: `user_warehouse_scopes` và mọi báo cáo tham chiếu theo
--    `warehouse_id`, KHÔNG theo chuỗi tên ⇒ khi nào sửa, đổi tên KHÔNG phá liên kết.
-- -----------------------------------------------------------------------------