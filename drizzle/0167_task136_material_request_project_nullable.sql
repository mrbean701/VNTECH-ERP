-- ============================================================================================
-- TASK-136 (phương án A) — drizzle tương ứng cho stack Node: cho phép `material_requests.project_id` NULL
--
-- Yêu cầu người dùng (21/09/2026): bất cứ ai cũng lập được phiếu đề nghị mua, kể cả nhân viên
-- văn phòng tổng công ty KHÔNG thuộc dự án nào và KHÔNG thuộc phạm vi kho nào.
-- Người dùng đã chốt PHƯƠNG ÁN (A): cho phép cột này NULL.
--
-- Đây là bản drizzle song song với Flyway V24__material_request_project_nullable.sql (Java).
-- Phạm vi: CHỈ cột `material_requests.project_id` — ⛔ không đụng bảng/cột khác.
-- Giữ nguyên kiểu + collation: varchar(64) / utf8mb4 / utf8mb4_unicode_ci.
-- ============================================================================================

ALTER TABLE material_requests
    MODIFY COLUMN project_id VARCHAR(64)
        CHARACTER SET utf8mb4
        COLLATE utf8mb4_unicode_ci
        NULL
        COMMENT 'NULL = phieu de nghi khong thuoc du an nao (nhan vien van phong cong ty)';
