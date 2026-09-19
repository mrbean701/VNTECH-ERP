-- VNTECH ERP V5.3.0 — PHASE 3 (CONG VIEC) · `T-04`: BINH LUAN + NGUOI THAM GIA/THEO DOI CONG VIEC
-- [CHUOI SQLite] — tep nay chay tren SQLite (dev/local + `tests/workflow-direct.test.ts` giai nen TOAN BO
-- `drizzle/*.sql` vao mot CSDL trong bo nho). Script kiem cua du an (`probe-java-sql-schema.mjs`) cung doc
-- `drizzle/` de phan biet "loi ma" voi "lech luoc do".
--
-- ⚠️ VI SAO KHONG dat DDL MySQL (`COLLATE`/`ENGINE=InnoDB`/`datetime(3)`/`varchar`) vao tep NAY:
--    SQLite se `Parse error` ngay khi `tests/workflow-direct.test.ts` (va `tests/work-item-comment-participant.test.ts`)
--    nap chuoi migration ⇒ `npm test` DO o tang HA TANG, khong phai o nghiep vu. Vi vay du an di HAI CHUOI
--    SONG SONG (xem `docs/agent-progress/TASK-040.md`: "JS chay tren SQLite theo `drizzle/`, Java chay tren
--    MySQL theo Flyway") va MOI bang co DUNG mot tep mang DDL that cua tung CSDL:
--      · MySQL/InnoDB  → `java-backend/infrastructure/src/main/resources/db/migration/V20__task_comment_participant.sql`
--      · SQLite        → tep nay.
--    ⇒ DDL MySQL THAT (de doi chieu voi `SHOW CREATE TABLE` tren may chu) nam o CUOI tep nay trong khoi
--      chu thich "DDL MySQL TUONG UNG".
--
-- NGUON QUYET DINH: `docs/agent-progress/AUDIT-T02-WORK-ITEM-MODEL.md` (T-02, do tren MySQL THAT):
--   · `work_items` (32 cot · 8 dong) + `work_item_events` + `task_notifications` + `task_sla_policies` — DA CO;
--   · `TaskComment`     — THIEU (CONFIRMED): bang binh luan duy nhat la `request_comments`, khoa theo
--                         `request_id` ⇒ KHONG dung duoc cho `work_item_id`;
--   · `TaskParticipant` — THIEU (CONFIRMED): thu gan nhat la `task_notifications.user_id`, nhung do la
--                         "nguoi NHAN THONG BAO", khong phai "nguoi tham gia/theo doi cong viec";
--   · `TaskAttachment`  — dung LAI bang dung chung `attachments` (`entity_type`/`entity_id`) ⇒ KHONG tao bang moi.
--
-- BANG 1 · `work_item_comments` — binh luan nhieu dong theo CONG VIEC (dong luon phan "ghi chu" cua `T-03`).
-- BANG 2 · `work_item_participants` — nguoi THAM GIA / THEO DOI cong viec
--   (`role_in_task`: owner | assignee | follower | supporter — bo tro lien phong cua `T-09`).
--
-- TINH IDEMPOTENT: `CREATE TABLE IF NOT EXISTS` / `CREATE ... INDEX IF NOT EXISTS` ⇒ chay lai vo hai.

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
   DDL MySQL TUONG UNG (nguon THAT: V20__task_comment_participant.sql — KHONG thuc thi o tep nay)
   COLLATE tung cot la BAT BUOC: MySQL 8 mac dinh `utf8mb4_0900_ai_ci`, con toan bo luoc do VNTECH dung
   `utf8mb4_unicode_ci`; chi can mot cot khac collation la JOIN voi `work_items`/`users` no
   "Illegal mix of collations" ⇒ TOAN BO UI 500.

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
