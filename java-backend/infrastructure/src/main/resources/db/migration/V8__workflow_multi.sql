-- ============================================================================
-- V8 — WORKFLOW ĐA LUỒNG (nhiều quy trình · nhiều bước · nhiều người duyệt)
-- ----------------------------------------------------------------------------
-- Hiện trạng: chỉ có MỘT luồng duyệt toàn cục `approval_stage_catalog` (5 bước),
-- người duyệt chọn theo VAI TRÒ, mỗi bước đúng MỘT owner
-- (`approval_project_assignments.owner_user_id`). Không thể:
--   • tạo nhiều quy trình cho các nghiệp vụ khác nhau,
--   • chỉ định ĐÍCH DANH nhiều người duyệt cho một bước,
--   • cho phép "một trong nhiều người duyệt là qua" (any_of).
--
-- Bổ sung 3 bảng mới. `approval_stage_catalog` và `approvals` GIỮ NGUYÊN để không
-- phá 20 bản ghi phê duyệt đang có (tương thích ngược hoàn toàn).
--
--   approval_mode: 'single' (1 người) · 'any_of' (nhiều người, 1 người duyệt là qua)
--                  · 'all_of' (tất cả phải duyệt)
--   required_permission: quyền cần có để lọt vào danh sách ứng viên người duyệt
--                  (vd 'requests.canApprove') — dùng cho picker "chọn theo quyền".
-- ============================================================================

CREATE TABLE IF NOT EXISTS `workflow_definitions` (
  `id`          varchar(64)  NOT NULL,
  `code`        varchar(64)  NOT NULL,
  `name`        text         NOT NULL,
  `description` text         NULL,
  `module_key`  varchar(64)  NULL COMMENT 'Gán theo chức năng nghiệp vụ; NULL = dùng chung',
  `project_id`  varchar(64)  NULL COMMENT 'Gán riêng cho một dự án; NULL = áp dụng toàn công ty',
  `is_default`  tinyint(1)   NOT NULL DEFAULT 0,
  `active`      tinyint(1)   NOT NULL DEFAULT 1,
  `version`     int          NOT NULL DEFAULT 1,
  `sort_order`  int          NOT NULL DEFAULT 0,
  `created_by`  text         NULL,
  `created_at`  datetime(3)  NOT NULL,
  `updated_at`  datetime(3)  NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `workflow_definitions_code_uidx` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `workflow_steps` (
  `id`           varchar(64)  NOT NULL,
  `workflow_id`  varchar(64)  NOT NULL,
  `step_no`      int          NOT NULL,
  `name`         text         NOT NULL,
  `description`  text         NULL,
  `approval_mode` varchar(32) NOT NULL DEFAULT 'single' COMMENT 'single | any_of | all_of',
  `sla_hours`    int          NOT NULL DEFAULT 8,
  `allow_skip_level` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Cho phép cấp bậc cao hơn duyệt vượt cấp',
  `required_permission` varchar(128) NULL COMMENT 'Quyền cần có để được chọn làm người duyệt',
  `active`       tinyint(1)   NOT NULL DEFAULT 1,
  `created_at`   datetime(3)  NOT NULL,
  `updated_at`   datetime(3)  NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `workflow_steps_no_uidx` (`workflow_id`,`step_no`),
  KEY `workflow_steps_workflow_idx` (`workflow_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `workflow_step_approvers` (
  `id`         varchar(64) NOT NULL,
  `step_id`    varchar(64) NOT NULL,
  `user_id`    varchar(64) NOT NULL,
  `active`     tinyint(1)  NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL,
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `workflow_step_approvers_uidx` (`step_id`,`user_id`),
  KEY `workflow_step_approvers_step_idx` (`step_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- SEED: chuyển luồng duyệt 5 bước hiện có thành quy trình mặc định đầu tiên,
--       để màn "Workflow phê duyệt" có dữ liệu thật ngay và giữ nguyên hành vi cũ.
-- ---------------------------------------------------------------------------
INSERT IGNORE INTO `workflow_definitions`
  (`id`,`code`,`name`,`description`,`module_key`,`project_id`,`is_default`,`active`,`version`,`sort_order`,`created_by`,`created_at`,`updated_at`)
VALUES
  ('WF-MUAHANG','WF-MUAHANG-01','Quy trình mua hàng chuẩn',
   'Luồng duyệt 5 bước cho phiếu đề nghị mua hàng, chuyển đổi từ cấu hình bậc duyệt cũ.',
   'requests',NULL,1,1,1,10,'system',CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3));

INSERT IGNORE INTO `workflow_steps`
  (`id`,`workflow_id`,`step_no`,`name`,`description`,`approval_mode`,`sla_hours`,`allow_skip_level`,`required_permission`,`active`,`created_at`,`updated_at`)
SELECT CONCAT('WFS-', c.stage_no), 'WF-MUAHANG', c.stage_no, c.name, c.description,
       CASE WHEN c.approval_mode = 'all_roles' THEN 'all_of' ELSE 'single' END,
       c.sla_hours, 0, 'requests.canApprove', c.active, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
  FROM `approval_stage_catalog` c;

-- Người duyệt đích danh: lấy từ phân công đang chạy (approval_project_assignments)
INSERT IGNORE INTO `workflow_step_approvers`
  (`id`,`step_id`,`user_id`,`active`,`created_at`,`updated_at`)
SELECT DISTINCT CONCAT('WFSA-', s.step_no, '-', a.owner_user_id), s.id, a.owner_user_id,
       1, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
  FROM `workflow_steps` s
  JOIN `approval_project_assignments` a ON a.stage = s.step_no AND a.active = 1
 WHERE s.workflow_id = 'WF-MUAHANG';

-- Kiểm chứng sau khi chạy:
--   SELECT COUNT(*) FROM workflow_definitions;          -- >= 1
--   SELECT COUNT(*) FROM workflow_steps;                -- >= 5
--   SELECT COUNT(*) FROM workflow_step_approvers;       -- >= 5
