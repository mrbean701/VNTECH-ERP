-- V14 — GĐ3/GĐ5: MỐC THỜI GIAN THAM GIA DỰ ÁN + THÀNH VIÊN TỔ ĐỘI
--
-- Lý do: yêu cầu người dùng
--   • GĐ3 "tab nhân sự (tên, chức vụ, phòng ban) — sort theo ngày tham gia dự án"
--   • GĐ5 "tổ đội gồm bao nhiêu người, thời gian tham gia và rời đi của từng người"
-- Trước migration này `user_project_scopes` chỉ có (user_id, project_id, permission,
-- created_at, updated_at) và KHÔNG có bảng nào mô tả thành viên tổ đội (teams chỉ có
-- leader_user_id) ⇒ không thể sắp xếp theo ngày tham gia hay liệt kê sĩ số tổ đội.
--
-- GHI CHÚ KỸ THUẬT BẮT BUỘC:
--  (1) Mọi bảng mới PHẢI khai báo COLLATE=utf8mb4_unicode_ci, nếu không MySQL 8 sẽ lấy
--      mặc định utf8mb4_0900_ai_ci và JOIN với bảng cũ sẽ báo
--      "ERROR 1267: Illegal mix of collations ..." ⇒ TOÀN BỘ giao diện trắng.
--  (2) PHẢI dùng BACKTICK cho tên bảng/cột: `java-backend/tools/generate-h2-test-schema.mjs`
--      chỉ nhận diện `CREATE TABLE IF NOT EXISTS \`x\`` và `ALTER TABLE \`x\` ADD COLUMN \`y\``.
--      Viết không backtick ⇒ schema H2 thiếu bảng/cột ⇒ test vỡ "Table not found".

-- ---------------------------------------------------------------------------
-- 1) user_project_scopes: mốc thời gian tham gia/rời + chức vụ trong dự án
-- ---------------------------------------------------------------------------
ALTER TABLE `user_project_scopes` ADD COLUMN `joined_at` datetime(3) NULL;
ALTER TABLE `user_project_scopes` ADD COLUMN `left_at` datetime(3) NULL;
ALTER TABLE `user_project_scopes` ADD COLUMN `position_name` varchar(255) NULL;

-- Backfill: dữ liệu cũ chưa có mốc tham gia → lấy ngày tạo bản ghi làm mốc.
UPDATE `user_project_scopes` SET joined_at = created_at WHERE joined_at IS NULL;

-- ---------------------------------------------------------------------------
-- 2) team_members: thành viên tổ đội kèm thời gian tham gia và rời đi
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `team_members` (
  `id` varchar(64) NOT NULL,
  `team_id` varchar(64) NOT NULL,
  `user_id` varchar(64) NOT NULL,
  `role_in_team` varchar(255) NULL,
  `joined_at` datetime(3) NOT NULL,
  `left_at` datetime(3) NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL,
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `team_members_uidx` (`team_id`,`user_id`,`joined_at`),
  KEY `team_members_team_idx` (`team_id`),
  KEY `team_members_user_idx` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Không seed dữ liệu giả: tổ đội hiện có chưa có thành viên, sẽ bổ sung qua giao diện.
