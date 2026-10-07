-- MOC 103 — BAO LOI + GOP Y: tach 2 muc va «nhom chuc nang» KHONG BAT BUOC.
-- USER 29/09/2026: «tiêu đề, mục (góp ý, báo lỗi), nhóm chức năng (không bắt buộc), nội dung».
-- ⛔ KHÔNG dùng KEY/ENGINE (sẽ làm hỏng test SQLite); KHÔNG dùng VARCHAR(32) + DEFAULT CURRENT_TIMESTAMP (ERROR 1067).
ALTER TABLE error_reports ADD COLUMN report_type VARCHAR(16) NULL;
-- ⛔ `module_key` đã cho phép NULL từ đầu ⇒ «nhóm chức năng» KHÔNG bắt buộc, không cần migration.
UPDATE error_reports SET report_type = 'bao_loi' WHERE report_type IS NULL;
