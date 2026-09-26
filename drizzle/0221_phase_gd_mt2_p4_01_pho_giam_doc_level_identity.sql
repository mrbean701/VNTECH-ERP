-- =============================================================================
-- MT2-P4-01 (đề án ①A, user chốt 26/09/2026) — BẢN MIRROR cho đường drizzle/SQLite
-- =============================================================================
-- ⚠️ GIỮ PARITY MIGRATION: bản Java/Flyway là
--   `java-backend/infrastructure/src/main/resources/db/migration/V30__mt2_p4_01_add_pho_giam_doc_level.sql`
--   (cùng nội dung logic: thêm ĐÚNG 1 dòng cấp bậc `pho_giam_doc`, `level_rank` = 35).
-- LÝ DO 35 (ĐO từ CSDL, ⛔ không đoán): truong_nhom=20 · truong_phong=30 · giam_doc=40
--   ⇒ phó GĐ nằm GIỮA 30 và 40 ⇒ «trên trưởng phòng, dưới giám đốc».
-- `auto_grant_all`=0 · `can_skip_levels`=0 (MT2 §3.2: giao việc toàn công ty **theo quyền**).
-- `INSERT OR IGNORE` ⇒ idempotent, chỉ THÊM dòng (GOAL §19: ⛔ không sửa/xoá dữ liệu cũ).
-- =============================================================================

INSERT OR IGNORE INTO `system_level_catalog`
  (`id`,`code`,`name`,`description`,`level_rank`,`auto_grant_all`,`can_skip_levels`,`active`,`sort_order`,`created_at`,`updated_at`)
VALUES
  ('LVL-PGD','pho_giam_doc','Phó Giám đốc',
   'Xem công việc toàn bộ phòng ban và toàn bộ nhân viên công ty; giao việc toàn công ty theo quyền (MASTER_TASK_2 §3.2).',
   35,0,0,1,35,datetime('now'),datetime('now'));
