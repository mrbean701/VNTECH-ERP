-- ============================================================================
-- VNTECH ERP V5.3.0 — TASK-080 đợt 2D: điền EMAIL còn thiếu cho tài khoản thật
-- ============================================================================
-- VÌ SAO: vừa port xong bước `queueTaskNotice` (KP #78) nhưng đo được `email_outbox = 0` dù thông báo
-- trong ứng dụng ĐÃ sinh đúng (`task_notifications` có bản ghi `NTF_…` cho `nvdademo`).
-- Truy vết: JS `system-route.mjs:266` chỉ xếp thư KHI `assignee.email` có giá trị
-- (`if(assignee.email){ … }`) ⇒ hành vi 0 thư là ĐÚNG luật, nhưng vì **mọi tài khoản nhận việc đều
-- để email NULL** nên luồng email KHÔNG THỂ kiểm chứng được.
-- Người dùng đã chỉ đạo: "nếu chưa có thì hãy insert đầy đủ để có căn cứ cho việc test luồng".
--
-- CÁCH LÀM: điền email công ty theo ĐÚNG khuôn mẫu dữ liệu THẬT đã có trong hệ thống
-- (`ksda.demo@vntech.vn`, `engineer.demo@vntech.vn`) cho mọi tài khoản đang hoạt động còn thiếu email:
--      <username>@vntech.vn
-- KHÔNG ghi đè email đã có. Đây là dữ liệu TÀI KHOẢN THỬ (demo), hoàn tác được từ sao lưu.
--
-- Bản sao lưu: tools/_backup-user-email-truoc-TASK080D.txt
-- Áp dụng: mysql -uvntech -pvntech --default-character-set=utf8mb4 vntech_erp < tools/task080d-seed-user-email.sql
-- ============================================================================

UPDATE users
   SET email = CONCAT(username, '@vntech.vn'), updated_at = CURRENT_TIMESTAMP
 WHERE email IS NULL AND active = 1;

-- ============================================================================
-- NGHIỆM THU: kỳ vọng con_null = 0
-- ============================================================================
SELECT COUNT(*) AS so_tai_khoan_hoat_dong,
       SUM(email IS NULL) AS con_null,
       COUNT(DISTINCT email) AS so_email_khac_nhau
FROM users WHERE active = 1;
