-- VNTECH ERP V5.3.0 — PHASE 3 (CÔNG VIỆC) · `T-04`: BÌNH LUẬN + NGƯỜI THAM GIA/THEO DÕI CÔNG VIỆC
-- [CHUỖI SQLite] — tệp này chạy trên SQLite (dev/local + `tests/workflow-direct.test.ts` giải nén TOÀN BỘ
-- `drizzle/*.sql` vào một CSDL trong bộ nhớ). Script kiểm của dự án (`probe-java-sql-schema.mjs`) cũng đọc
-- `drizzle/` để phân biệt "lỗi mã" với "lệch lược đồ".
--
-- ⚠️ VÌ SAO KHÔNG đặt DDL MySQL (`COLLATE`/`ENGINE=InnoDB`/`datetime(3)`/`varchar`) vào tệp NÀY:
--    SQLite sẽ `Parse error` ngay khi bộ kiểm nạp chuỗi migration ⇒ `npm test` ĐỎ ở tầng HẠ TẦNG, không
--    phải ở nghiệp vụ. Vì vậy dự án đi HAI CHUỖI SONG SONG (xem `docs/agent-progress/TASK-040.md`: "JS chạy
--    trên SQLite theo `drizzle/`, Java chạy trên MySQL theo Flyway") và MỖI bảng có ĐÚNG một tệp mang DDL thật:
--      · MySQL/InnoDB → `java-backend/infrastructure/src/main/resources/db/migration/V20__task_comment_participant.sql`
--      · SQLite       → tệp này.
--    DDL MySQL THẬT được chép nguyên văn vào khối chú thích cuối tệp để đối chiếu với `SHOW CREATE TABLE`.
--
-- NGUỒN QUYẾT ĐỊNH: `docs/agent-progress/AUDIT-T02-WORK-ITEM-MODEL.md` (T-02, đo trên MySQL THẬT):
--   · `work_items` (32 cột · 8 dòng) + `work_item_events` + `task_notifications` + `task_sla_policies` — ĐÃ CÓ;
--   · `TaskComment`     — THIẾU (CONFIRMED): bảng bình luận duy nhất là `request_comments`, khoá theo
--                         `request_id` ⇒ KHÔNG dùng được cho `work_item_id`;
--   · `TaskParticipant` — THIẾU (CONFIRMED): thứ gần nhất là `task_notifications.user_id`, nhưng đó là
--                         "người NHẬN THÔNG BÁO", không phải "người tham gia/theo dõi công việc";
--   · `TaskAttachment`  — dùng LẠI bảng dùng chung `attachments` (`entity_type`/`entity_id`) ⇒ KHÔNG tạo bảng mới.
--
-- BẢNG 1 · `work_item_comments` — bình luận nhiều dòng theo CÔNG VIỆC (đóng luôn phần "ghi chú" của `T-03`).
-- BẢNG 2 · `work_item_participants` — người THAM GIA / THEO DÕI công việc
--   (`role_in_task`: owner | assignee | follower | supporter — bổ trợ liên phòng của `T-09`).
--
-- TÍNH IDEMPOTENT: `CREATE TABLE IF NOT EXISTS` / `CREATE ... INDEX IF NOT EXISTS` ⇒ chạy lại vô hại.

CREATE TABLE IF NOT EXISTS `work_item_comments` (
	`id` text PRIMARY KEY NOT NULL,
	`work_item_id` text NOT NULL,
	`user_id` text NOT NULL,
	`comment` text NOT NULL,
	`visibility` text DEFAULT 'internal' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `work_item_comments_task_idx` ON `work_item_comments` (`work_item_id`,`created_at`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `work_item_participants` (
	`id` text PRIMARY KEY NOT NULL,
	`work_item_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role_in_task` text DEFAULT 'follower' NOT NULL,
	`notify` integer DEFAULT 1 NOT NULL,
	`added_by` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `work_item_participants_task_user_idx` ON `work_item_participants` (`work_item_id`,`user_id`);

/* ============================================================================================
   DDL MySQL TƯƠNG ỨNG (nguồn THẬT: V20__task_comment_participant.sql — KHÔNG thực thi ở tệp này)
   COLLATE từng cột là BẮT BUỘC: MySQL 8 mặc định `utf8mb4_0900_ai_ci`, còn toàn bộ lược đồ VNTECH dùng
   `utf8mb4_unicode_ci`; chỉ cần một cột khác collation là JOIN với `work_items`/`users` nổ
   "Illegal mix of collations" ⇒ TOÀN BỘ UI 500.

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
   ============================================================================================ */
