-- USER 29/09/2026 (MỐC 55) — thêm ảnh HỢP ĐỒNG LAO ĐỘNG.
-- ⛔ KHÔNG có cột ảnh trong `labor_contracts` (13 cột, xem đã đo) ⇒ thêm mới.
-- ⛔ Mẫu: `users.signature_url` kiểu `text` (MỐC 39, chữ ký nhân viên) — dùng data-URL.
--    ⛔ KHÔNG khai `DEFAULT CURRENT_TIMESTAMP` (cột VARCHAR/text ⇒ ERROR 1067).
--    ⛔ KHÔNG dùng `KEY …` / `UNIQUE KEY …` / `ENGINE=…` (MySQL-only, làm hỏng test SQLite — xem D-025).
ALTER TABLE labor_contracts ADD COLUMN image_url TEXT NULL;
