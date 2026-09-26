-- ============================================================================
-- V25 — MT2-101 (DATA) · Nền dữ liệu cho MASTER TASK 2
--   §4.4  SLA quá hạn : lưu LÝ DO khi duyệt quá hạn (bắt buộc theo nghiệp vụ)
--   §13.4 Chữ ký user : 1 ảnh chữ ký cho mỗi user (thay ảnh cũ khi upload mới)
-- ----------------------------------------------------------------------------
-- NGUYÊN TẮC (GOAL MT2 §19 · MT2 §56):
--   * CHỈ THÊM CỘT (ADD COLUMN) — KHÔNG DROP / KHÔNG DELETE / KHÔNG TRUNCATE / KHÔNG sửa kiểu cột
--   * KHÔNG backfill dữ liệu giả — cột để NULL cho tới khi có nghiệp vụ thật điền vào
--   * `approvals` ĐÃ CÓ `due_at` + `decided_at` ⇒ thời lượng quá hạn TÍNH ĐƯỢC, cờ `expired` SUY RA ĐƯỢC
--     ⇒ ⛔ KHÔNG thêm cột thời lượng/cờ dư thừa (tránh 2 nguồn sự thật)
--   * `users.approval_limit` ("Hạn mức" — MT2 §13.3 yêu cầu bỏ) ⛔ KHÔNG drop ở đây:
--     xử lý bằng ẩn khỏi UI/API ở task MT2-209 (giữ tương thích ngược)
-- ============================================================================

-- §4.4 — Lý do khi duyệt quá hạn SLA. BẮT BUỘC có giá trị khi `decided_at > due_at`
--        (backend phải validate; cột này chỉ lưu vết, không tự sinh giá trị).
ALTER TABLE approvals
    ADD COLUMN overdue_reason TEXT NULL
    COMMENT 'MT2 §4.4 — ly do khi phe duyet qua han SLA (bat buoc neu decided_at > due_at)';

-- §13.4 — Chữ ký user: đường dẫn tới ĐÚNG 1 ảnh. Upload ảnh mới ⇒ thay giá trị này
--          (backend chịu trách nhiệm xoá/thay tệp cũ). ⛔ Không dùng chung với avatar_url.
ALTER TABLE users
    ADD COLUMN signature_url TEXT NULL
    COMMENT 'MT2 §13.4 — duong dan 1 anh chu ky cua user (thay the khi upload moi)';
