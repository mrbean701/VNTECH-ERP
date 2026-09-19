-- VNTECH ERP V5.3.0 — PHASE 3 (CÔNG VIỆC) · `T-04`: BÌNH LUẬN + NGƯỜI THAM GIA/THEO DÕI CÔNG VIỆC
-- [CHUỖI MySQL/InnoDB] — parity với `drizzle/0155_phase_gd_phase_3_t_04_work_item_comment_participant.sql`
-- (chuỗi SQLite). Hai tệp KHÔNG chép nguyên văn nhau vì hai CSDL KHÁC cú pháp; parity được giữ ở
-- **TÊN BẢNG · TÊN CỘT · CHỈ MỤC**, không ở kiểu chữ.
--
-- NGUỒN QUYẾT ĐỊNH: `docs/agent-progress/AUDIT-T02-WORK-ITEM-MODEL.md` (T-02, đo trên MySQL THẬT):
--   `work_item_events` (nhật ký = TaskHistory) · `work_items.assigned_to/assigned_by/assigned_at` (= TaskAssignment)
--   · `work_items.progress` · `work_items.cancelled_at` **ĐÃ CÓ** ⇒ KHÔNG tạo lại.
--   THIẾU: bình luận theo `work_item_id` (`request_comments` khoá theo `request_id` ⇒ không dùng được) và
--   người tham gia/theo dõi (`task_notifications.user_id` chỉ là người NHẬN THÔNG BÁO).
--   `TaskAttachment` ⇒ **dùng LẠI** bảng dùng chung `attachments` (`entity_type`/`entity_id`), KHÔNG tạo bảng mới.
--
-- ⚠️ VÌ SAO PHẢI GHI `COLLATE=utf8mb4_unicode_ci` CHO **TỪNG CỘT** SO SÁNH/NỐI:
--    MySQL 8 mặc định cột `text`/`varchar` lấy collation **mặc định của server** (`utf8mb4_0900_ai_ci`), trong khi
--    toàn bộ lược đồ VNTECH dùng `utf8mb4_unicode_ci`. Chỉ cần một cột khác collation là JOIN với
--    `work_items`/`users`/`work_item_events` sẽ nổ **"Illegal mix of collations"** ⇒ **TOÀN BỘ UI trả 500**.
--    Vì vậy tệp này ghi COLLATE ở CẢ cấp bảng LẪN cấp cột (khuôn đối chiếu: `request_comments` — bảng đã chạy tốt).
--
-- TÍNH IDEMPOTENT: bảng dùng `CREATE TABLE IF NOT EXISTS`; chỉ mục được tạo qua một thủ tục có bẫy lỗi
--    "Duplicate key name" ⇒ chạy lại vô hại (MySQL 8 KHÔNG hỗ trợ `CREATE INDEX IF NOT EXISTS`).

CREATE TABLE IF NOT EXISTS `work_item_comments` (
  `id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `work_item_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `comment` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `visibility` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'internal',
  `created_at` datetime(3) NOT NULL,
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `work_item_comments_task_idx` (`work_item_id`,`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `work_item_participants` (
  `id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `work_item_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role_in_task` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'follower',
  `notify` tinyint(1) NOT NULL DEFAULT 1,
  `added_by` varchar(64) COLLATE utf8mb4_unicode_ci NULL,
  `created_at` datetime(3) NOT NULL,
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `work_item_participants_task_user_idx` (`work_item_id`,`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Chỉ mục UNIQUE ở bảng thứ hai nằm trong `CREATE TABLE` (idempotent theo bảng); chỉ mục thường của
-- bảng thứ nhất cũng nằm trong `CREATE TABLE`. Không cần thủ tục bổ trợ ⇒ an toàn khi chạy lại.
