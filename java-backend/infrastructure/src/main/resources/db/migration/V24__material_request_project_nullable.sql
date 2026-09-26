-- ============================================================================================
-- TASK-136 (phương án A) — PHIẾU ĐỀ NGHỊ MUA KHÔNG BẮT BUỘC THUỘC DỰ ÁN
--
-- Yêu cầu người dùng (21/09/2026):
--   "CHT không cần phải là người phê duyệt đơn đề nghị mà nên đẩy phiếu đề nghị thành PR luôn
--    và vào luồng phê duyệt luôn. Để bất cứ ai cũng có thể lập phiếu đề nghị ví dụ như nhân viên
--    trên văn phòng tổng công ty (không thuộc bất cứ dự án nào, không thuộc phạm vi của bất cứ
--    kho nào)."
--
-- Người dùng đã chốt PHƯƠNG ÁN (A): cho phép `material_requests.project_id` NULL.
-- Phạm vi thay đổi cấu trúc được uỷ quyền: CHỈ cột `project_id` của bảng `material_requests`.
--   ⛔ KHÔNG đụng bảng khác, KHÔNG đụng cột khác (ví dụ `area` giữ nguyên NOT NULL —
--      tầng ứng dụng ghi chuỗi rỗng khi người dùng không nhập).
--
-- LƯU Ý KỸ THUẬT
--   · Giữ NGUYÊN kiểu dữ liệu và collation hiện tại: varchar(64) / utf8mb4 / utf8mb4_unicode_ci
--     (xem `SHOW FULL COLUMNS FROM material_requests LIKE 'project_id'`), chỉ đổi NOT NULL -> NULL.
--   · Index `MUL` trên cột được giữ nguyên (MODIFY không làm mất index).
--   · Idempotent: chạy lại nhiều lần vẫn cho kết quả như nhau.
-- ============================================================================================

ALTER TABLE material_requests
    MODIFY COLUMN project_id VARCHAR(64)
        CHARACTER SET utf8mb4
        COLLATE utf8mb4_unicode_ci
        NULL
        COMMENT 'NULL = phiếu đề nghị không thuộc dự án nào (nhân viên văn phòng công ty)';
