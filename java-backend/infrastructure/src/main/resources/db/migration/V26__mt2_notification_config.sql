-- ============================================================================
-- V26 — MT2-P1-04 · MT2 §45 (CREATE NOTIFICATION) + §48/§49 (READ STATUS)
-- ----------------------------------------------------------------------------
-- MỤC TIÊU: cấu hình thông báo cho user qua **Web** hoặc **Email**.
--   §45 trường bắt buộc : Loại (Web/Email) · Tên · Mã · Nội dung · Người nhận
--                          · Thời gian gửi · Thời gian kết thúc (đối với Web)
--   §45 recipient       : user đơn · nhiều user · phòng ban · dự án · toàn bộ user
--                          ⇒ "thiết kế recipient targeting ĐỦ LINH HOẠT ĐỂ MỞ RỘNG SAU NÀY"
--   §48 read status      : lưu theo **userID + notificationID** (KHÔNG đánh dấu đọc global)
--                          + nhớ trạng thái "Không nhắc lại hôm nay"
-- ----------------------------------------------------------------------------
-- NGUYÊN TẮC (GOAL MT2 §19 · §14; MT2 §55/§56):
--   * CHỈ **TẠO BẢNG MỚI** — ⛔ KHÔNG DROP / DELETE / TRUNCATE / sửa bảng cũ
--   * ⛔ **KHÔNG sửa `task_notifications`** — bảng đó là HÀNG ĐỢI thông báo gắn `work_item_id`
--     (phục vụ luồng công việc hiện có), KHÁC hẳn "cấu hình thông báo" của MT2 §45
--   * ⛔ KHÔNG bịa nghiệp vụ: chưa có mô tả về nhắc lại/leo thang ⇒ **KHÔNG thêm** cột đó
--   * Mọi bảng mới ghi rõ `COLLATE=utf8mb4_unicode_ci` (bài học dự án: thiếu COLLATE ⇒
--     lỗi "Illegal mix of collations" khi JOIN với bảng gốc utf8mb4_unicode_ci)
--   * Recipient lưu ở BẢNG ĐÍCH RIÊNG (polymorphic) để mở rộng được nhiều loại đối tượng
-- ============================================================================

-- §45 — CẤU HÌNH THÔNG BÁO (một dòng = một cấu hình do quản trị viên tạo)
CREATE TABLE IF NOT EXISTS `notification_configs` (
  `id`            VARCHAR(64)  NOT NULL,
  `code`          VARCHAR(64)  NOT NULL COMMENT 'MT2 §45 — Mã thông báo',
  `name`          VARCHAR(255) NOT NULL COMMENT 'MT2 §45 — Tên thông báo',
  `channel`       VARCHAR(16)  NOT NULL COMMENT 'MT2 §45 — Loại: web | email',
  `content`       TEXT         NULL     COMMENT 'MT2 §45 — Nội dung',
  `recipient_mode` VARCHAR(24) NOT NULL DEFAULT 'all'
                  COMMENT 'MT2 §45 — user | users | department | project | all (mở rộng thêm giá trị mới KHÔNG cần đổi cấu trúc)',
  `send_at`       DATETIME(3)  NULL     COMMENT 'MT2 §45 — Thời gian gửi (NULL = gửi khi có hiệu lực)',
  `end_at`        DATETIME(3)  NULL     COMMENT 'MT2 §45 — Thời gian kết thúc (chỉ áp dụng cho kênh web)',
  `active`        TINYINT(1)   NOT NULL DEFAULT 1,
  `created_by`    VARCHAR(64)  NULL,
  `created_at`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `notification_configs_code_uq` (`code`),
  KEY `notification_configs_channel_idx` (`channel`, `active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='MT2 §45 — cấu hình thông báo (Web/Email) cho user';

-- §45 — NGƯỜI NHẬN của từng cấu hình (bảng đích LINH HOẠT: user / phòng ban / dự án / …)
--   `target_type` + `target_id` cho phép thêm loại đối tượng mới mà KHÔNG đổi cấu trúc bảng.
CREATE TABLE IF NOT EXISTS `notification_config_targets` (
  `id`          VARCHAR(64) NOT NULL,
  `config_id`   VARCHAR(64) NOT NULL,
  `target_type` VARCHAR(24) NOT NULL COMMENT 'MT2 §45 — user | department | project',
  `target_id`   VARCHAR(64) NULL     COMMENT 'NULL khi recipient_mode = all (toàn bộ user)',
  `created_at`  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `notification_config_targets_cfg_idx` (`config_id`, `target_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='MT2 §45 — người nhận của cấu hình thông báo (polymorphic, mở rộng được)';

-- §48/§49 — TRẠNG THÁI THEO TỪNG USER (đọc / "không nhắc lại hôm nay")
--   ⛔ KHÔNG đánh dấu đọc global cho mọi user ⇒ khoá theo (config_id, user_id).
CREATE TABLE IF NOT EXISTS `notification_user_states` (
  `id`           VARCHAR(64) NOT NULL,
  `config_id`    VARCHAR(64) NOT NULL,
  `user_id`      VARCHAR(64) NOT NULL,
  `read_at`      DATETIME(3) NULL COMMENT 'MT2 §49 — đánh dấu đã đọc (theo user)',
  `snooze_until` DATETIME(3) NULL COMMENT 'MT2 §48 — "Không nhắc lại hôm nay": tạm ẩn tới thời điểm này',
  `delivered_at` DATETIME(3) NULL COMMENT 'MT2 §48 — thời điểm đã hiển thị cho user',
  `created_at`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `notification_user_states_uq` (`config_id`, `user_id`),
  KEY `notification_user_states_user_idx` (`user_id`, `read_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='MT2 §48/§49 — trạng thái thông báo THEO TỪNG USER (đọc / không nhắc lại)';
