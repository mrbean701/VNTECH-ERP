-- =============================================================================
-- MỐC 113 — BỔ SUNG 5 CỘT `labor_contracts` THIẾU TRONG FLYWAY BASELINE (01/10/2026)
-- =============================================================================
-- VÌ SAO (đo được, không phải phỏng đoán):
--   * `grep -rn job_rank java-backend/**/*.sql` → **0 kết quả** trong toàn bộ thư mục
--     `db/migration/` ⇒ `V1__baseline.sql` (dòng 885) KHÔNG khai báo cột này.
--   * Nhưng MySQL production (`vntech_erp`.`labor_contracts`) **CÓ** tới 18 cột, trong đó có
--     `image_url` / `image_updated_at` / `job_rank` / `grade` / `renewal_round`.
--   ⇒ Hệ quả 1 — 5 test Java đỏ với `Column "lc.job_rank" not found`
--     (FinanceHrChainIntegrationTest · NotificationCenterTest · RequestNoProjectBootstrapIntegrationTest
--      · RequestOverdueReasonTest · SystemControllerAuthTest): đọc 3 adapter
--      (`BootstrapDataAdapter.java:1469`, `HrStoreAdapter.java:97,112`) SELECT các cột có thật.
--   ⇒ Hệ quả 2 — **mọi CSDL MySQL mới dựng từ Flyway sẽ KHÔNG CÓ 5 cột này** và ứng dụng
--     sẽ không khởi động được (SELECT cột không tồn tại). Đây là lỗi tiềm ẩn, chưa nổ vì
--     production được vá tay ngoài Flyway bằng `drizzle/0314_..._ngach_bac_gia_han_lan.sql`.
--
-- NGUỒN GỐC: `drizzle/0314_hop_dong_lao_dong_ngach_bac_gia_han_lan.sql:10-14`
--   (job_rank · grade · renewal_round) và MỐC 58-3 (image_url · image_updated_at).
--
-- AN TOÀN (§19 NO DESTRUCTIVE — tuyệt đối không phá dữ liệu):
--   * **CHỈ ADD COLUMN, đều NULLABLE** ⇒ không ghi đè dữ liệu cũ, không khoá bảng lâu,
--     không sửa kiểu cột, không DROP/DELETE/TRUNCATE.
--   * **IDEMPOTENT** theo đúng mẫu V21/V22 đã có sẵn trong dự án: đếm `information_schema`
--     trước, chỉ `ALTER` khi cột thiếu. ⇒ Trên production (đã có cột) migration là **no-op**;
--     trên CSDL mới (chưa có cột) migration **bổ sung đủ 5 cột**.
--   * Đặt `AFTER` đúng thứ tự `information_schema.COLUMNS` đã đo, để bản mới khớp bản cũ.
--
-- SAU KHI CHẠY — kiểm chứng:
--   SELECT COLUMN_NAME FROM information_schema.COLUMNS
--    WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='labor_contracts'
--      AND COLUMN_NAME IN ('image_url','image_updated_at','job_rank','grade','renewal_round');
--   → phải trả về **5 dòng** (cả trên production, cả trên CSDL mới).
-- =============================================================================

-- (1) image_url — ảnh hợp đồng đính kèm (MỐC 58-3)
SET @c := (SELECT COUNT(*) FROM information_schema.columns
            WHERE table_schema = DATABASE() AND table_name = 'labor_contracts' AND column_name = 'image_url');
SET @ddl := IF(@c = 0,
  'ALTER TABLE `labor_contracts` ADD COLUMN `image_url` TEXT NULL AFTER `updated_at`',
  'DO 0');
PREPARE s FROM @ddl; EXECUTE s; DEALLOCATE PREPARE s;

-- (2) image_updated_at — thời điểm ảnh được cập nhật lần cuối (MỐC 58-3)
SET @c := (SELECT COUNT(*) FROM information_schema.columns
            WHERE table_schema = DATABASE() AND table_name = 'labor_contracts' AND column_name = 'image_updated_at');
SET @ddl := IF(@c = 0,
  'ALTER TABLE `labor_contracts` ADD COLUMN `image_updated_at` DATETIME NULL AFTER `image_url`',
  'DO 0');
PREPARE s FROM @ddl; EXECUTE s; DEALLOCATE PREPARE s;

-- (3) job_rank — chức danh/ngạch (drizzle/0314)
SET @c := (SELECT COUNT(*) FROM information_schema.columns
            WHERE table_schema = DATABASE() AND table_name = 'labor_contracts' AND column_name = 'job_rank');
SET @ddl := IF(@c = 0,
  'ALTER TABLE `labor_contracts` ADD COLUMN `job_rank` VARCHAR(64) NULL AFTER `image_updated_at`',
  'DO 0');
PREPARE s FROM @ddl; EXECUTE s; DEALLOCATE PREPARE s;

-- (4) grade — cấp bậc/lương (drizzle/0314)
SET @c := (SELECT COUNT(*) FROM information_schema.columns
            WHERE table_schema = DATABASE() AND table_name = 'labor_contracts' AND column_name = 'grade');
SET @ddl := IF(@c = 0,
  'ALTER TABLE `labor_contracts` ADD COLUMN `grade` VARCHAR(64) NULL AFTER `job_rank`',
  'DO 0');
PREPARE s FROM @ddl; EXECUTE s; DEALLOCATE PREPARE s;

-- (5) renewal_round — số lần gia hạn hợp đồng (drizzle/0314)
SET @c := (SELECT COUNT(*) FROM information_schema.columns
            WHERE table_schema = DATABASE() AND table_name = 'labor_contracts' AND column_name = 'renewal_round');
SET @ddl := IF(@c = 0,
  'ALTER TABLE `labor_contracts` ADD COLUMN `renewal_round` INT NULL AFTER `grade`',
  'DO 0');
PREPARE s FROM @ddl; EXECUTE s; DEALLOCATE PREPARE s;
