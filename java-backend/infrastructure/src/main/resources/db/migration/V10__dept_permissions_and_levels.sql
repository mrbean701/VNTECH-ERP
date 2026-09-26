-- ============================================================================
-- V10 — PHÂN QUYỀN PHÒNG BAN + CẤP BẬC HỆ THỐNG (ĐỢT P5)
-- ----------------------------------------------------------------------------
-- Hiện trạng: chỉ có `user_module_permissions` (cấp quyền cho TỪNG người). Không có
-- cách cấp quyền HÀNG LOẠT cho phòng ban, và không có khái niệm CẤP BẬC để:
--   • cấp bậc cao tự động có quyền cao nhất (không phải cấu hình tay từng người),
--   • cấp bậc cao duyệt VƯỢT CẤP mà không cần thêm tên vào workflow,
--   • cấp bậc cao là NGOẠI LỆ: cấu hình quyền thủ công không cần kiểm tra phòng ban.
--
-- Thêm 2 bảng + 1 cột. `user_module_permissions` GIỮ NGUYÊN (tương thích ngược).
--
-- LƯU Ý COLLATION: BẮT BUỘC ghi rõ `COLLATE=utf8mb4_unicode_ci`. Nếu chỉ ghi
-- `DEFAULT CHARSET=utf8mb4`, MySQL 8 lấy mặc định server `utf8mb4_0900_ai_ci`,
-- khác với `users`/`organization_units` của V1 ⇒ mọi JOIN báo
-- "ERROR 1267: Illegal mix of collations". (Đã dính đúng lỗi này ở V8.)
-- ============================================================================

CREATE TABLE IF NOT EXISTS `department_module_permissions` (
  `id`               varchar(64) NOT NULL,
  `organization_unit_id` varchar(64) NOT NULL,
  `module_key`       varchar(64) NOT NULL,
  `can_view`         int NOT NULL DEFAULT 0,
  `can_use`          int NOT NULL DEFAULT 0,
  `can_create`       int NOT NULL DEFAULT 0,
  `can_edit`         int NOT NULL DEFAULT 0,
  `can_approve`      int NOT NULL DEFAULT 0,
  `can_export`       int NOT NULL DEFAULT 0,
  `active`           tinyint(1) NOT NULL DEFAULT 1,
  `updated_by`       text NULL,
  `created_at`       datetime(3) NOT NULL,
  `updated_at`       datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `department_module_permissions_uidx` (`organization_unit_id`,`module_key`),
  KEY `department_module_permissions_module_idx` (`module_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `system_level_catalog` (
  `id`               varchar(64) NOT NULL,
  `code`             varchar(64) NOT NULL,
  `name`             text NOT NULL,
  `description`      text NULL,
  `rank`             int NOT NULL DEFAULT 0 COMMENT 'Số càng lớn cấp càng cao',
  `auto_grant_all`   tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Tự động có quyền cao nhất, không cần cấu hình',
  `can_skip_levels`  tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Được duyệt vượt cấp, không cần thêm vào workflow',
  `active`           tinyint(1) NOT NULL DEFAULT 1,
  `sort_order`       int NOT NULL DEFAULT 0,
  `created_at`       datetime(3) NOT NULL,
  `updated_at`       datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `system_level_catalog_code_uidx` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cấp bậc gắn trên người dùng; NULL = chưa xếp cấp bậc (đối xử như cấp thấp nhất)
ALTER TABLE `users` ADD COLUMN `system_level_code` varchar(64) NULL COMMENT 'Mã cấp bậc trong system_level_catalog';

-- ---------------------------------------------------------------------------
-- SEED 1: thang cấp bậc 5 bậc. Bậc cao nhất (Tổng giám đốc) tự động có toàn quyền
--         và được duyệt vượt cấp — đúng yêu cầu "CEO không cần thêm vào workflow".
-- ---------------------------------------------------------------------------
INSERT IGNORE INTO `system_level_catalog`
  (`id`,`code`,`name`,`description`,`rank`,`auto_grant_all`,`can_skip_levels`,`active`,`sort_order`,`created_at`,`updated_at`)
VALUES
  ('LVL-NV','nhan_vien','Nhân viên','Thực hiện công việc được giao trong phạm vi phòng ban.',10,0,0,1,10,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
  ('LVL-TN','truong_nhom','Trưởng nhóm / Tổ đội','Điều phối tổ đội, xác nhận công việc hiện trường.',20,0,0,1,20,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
  ('LVL-TP','truong_phong','Trưởng phòng','Quản lý phòng ban, phê duyệt trong phạm vi phòng.',30,0,0,1,30,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
  ('LVL-GD','giam_doc','Giám đốc','Tự động có toàn quyền hệ thống; phê duyệt mọi bước trong phạm vi điều hành.',40,1,0,1,40,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
  ('LVL-CEO','tong_giam_doc','Tổng giám đốc (CEO)','Cấp cao nhất: tự động toàn quyền và được duyệt vượt cấp không cần thêm tên vào quy trình.',50,1,1,1,50,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3));

-- ---------------------------------------------------------------------------
-- SEED 2: quyền mặc định theo phòng ban — mỗi phòng nhận các chức năng của mình.
--         Chỉ lấy MỘT đơn vị cho mỗi mã (dữ liệu hiện có bản ghi trùng mã).
-- ---------------------------------------------------------------------------
INSERT IGNORE INTO `department_module_permissions`
  (`id`,`organization_unit_id`,`module_key`,`can_view`,`can_use`,`can_create`,`can_edit`,`can_approve`,`can_export`,`active`,`updated_by`,`created_at`,`updated_at`)
SELECT CONCAT('DMP-', o.code, '-', m.module_key), o.id, m.module_key, 1, 1, 1, 1, 0, 1, 1, 'system',
       CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
  FROM (SELECT code, MIN(id) AS id FROM `organization_units` WHERE active = 1 AND unit_type = 'department' GROUP BY code) o
  JOIN `module_catalog` m
    ON (o.code = 'KH'   AND m.module_key LIKE 'dept\_plan\_%')
    OR (o.code = 'DA'   AND m.module_key LIKE 'dept\_project\_%')
    OR (o.code = 'TCKT' AND m.module_key LIKE 'dept\_finance\_%')
    OR (o.code = 'HCPC' AND m.module_key LIKE 'dept\_legal\_%');

-- ---------------------------------------------------------------------------
-- SEED 3: xếp cấp bậc cho tài khoản hiện có theo chức danh.
-- ---------------------------------------------------------------------------
UPDATE `users` SET `system_level_code` = 'tong_giam_doc' WHERE `role` = 'admin';
UPDATE `users` SET `system_level_code` = 'giam_doc'      WHERE `role` = 'director' AND `system_level_code` IS NULL;
UPDATE `users` SET `system_level_code` = 'truong_phong' WHERE `role` IN ('kh_truong','da_truong','accountant','procurement','project','warehouse') AND `system_level_code` IS NULL;
UPDATE `users` SET `system_level_code` = 'truong_nhom'  WHERE `role` IN ('cht','commander','team','thuky','thu_kho') AND `system_level_code` IS NULL;
UPDATE `users` SET `system_level_code` = 'nhan_vien'    WHERE `system_level_code` IS NULL;

-- Kiểm chứng sau khi chạy:
--   SELECT COUNT(*) FROM system_level_catalog;                    -- = 5
--   SELECT COUNT(*) FROM department_module_permissions;           -- > 0
--   SELECT COUNT(*) FROM users WHERE system_level_code IS NULL;   -- = 0
