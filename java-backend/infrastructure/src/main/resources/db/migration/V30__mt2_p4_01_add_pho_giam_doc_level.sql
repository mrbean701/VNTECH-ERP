-- =============================================================================
-- MT2-P4-01 (USER CHỌN ĐỀ Á ①A ngày 26/09/2026) — THÊM CẤP BẬC `pho_giam_doc`
-- =============================================================================
-- VÌ SAO: MASTER_TASK_2.md §3.2 (dòng 41-42) yêu cầu nguyên văn
--   «**Phó giám đốc trở lên** → xem công việc **toàn bộ phòng ban** ·
--     xem công việc **toàn bộ nhân viên công ty** · giao việc **toàn công ty** theo quyền».
--   ⛔ Nhưng `system_level_catalog` CHỈ có 5 cấp (10/20/30/40/50) — ⛔ KHÔNG có cấp phó GĐ
--   ⇒ ngưỡng «phó GĐ trở lên» KHÔNG THỂ biểu đạt ⇒ chưa có dịch vụ phạm vi theo cấp bậc.
--   ⇒ ĐO ĐƯỢC: user chốt phương án (A) «thêm cấp `pho_giam_doc`» (⛔ KHÔNG dùng ngưỡng
--     `level_rank >= 40`, vì 40 là `giam_doc` — cao HƠN phó GĐ, sẽ vô hiệu hóa tầng phó GĐ).
--
-- CÁCH CHỌN RANK (ĐO TỪ CSDL, ⛔ không đoán): truong_nhom=20 · truong_phong=30 · giam_doc=40
--   → `pho_giam_doc` = **35** (nằm GIỮA 30 và 40 ⇒ đúng nghĩa «trên trưởng phòng, dưới giám đốc»).
--   `auto_grant_all = 0` (⛔ KHÔNG tự toàn quyền — khác `giam_doc`=40 và `tong_giam_doc`=50;
--     MT2 §3.2 nói phó GĐ «giao việc toàn công ty **theo quyền**» ⇒ vẫn theo module).
--   `can_skip_levels = 0` (⛔ KHÔNG cho vượt cấp trong workflow).
--
-- AN TOÀN: `INSERT IGNORE` (idempotent) · chỉ THÊM dòng, KHÔNG sửa/xoá dữ liệu cũ (GOAL §19).
--   Sau khi chạy: SELECT COUNT(*) FROM system_level_catalog;  → = 6
-- =============================================================================

INSERT IGNORE INTO `system_level_catalog`
  (`id`,`code`,`name`,`description`,`level_rank`,`auto_grant_all`,`can_skip_levels`,`active`,`sort_order`,`created_at`,`updated_at`)
VALUES
  ('LVL-PGD','pho_giam_doc','Phó Giám đốc',
   'Xem công việc toàn bộ phòng ban và toàn bộ nhân viên công ty; giao việc toàn công ty theo quyền (MASTER_TASK_2 §3.2).',
   35,0,0,1,35,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3));
