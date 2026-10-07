-- =============================================================================
-- GO-LIVE — SEED THÀNH VIÊN TỔ ĐỘI (yêu cầu user 02/10/2026:
--   «Thêm đầy đủ dữ liệu để test từ user cho đến tổ đội»)
-- =============================================================================
-- ⛔ VÌ SAO PHẢI SEED BẰNG SQL — ĐÃ ĐO, KHÔNG PHẢI ĐOÁN:
--   KHÔNG có đường nào trong ứng dụng ghi được `team_members`:
--     · quét toàn bộ mã nguồn: **0** dòng `INSERT INTO team_members` (cả JS lẫn Java)
--     · `create_project_team` (`OpsTaskManagementUseCase.java:421`) chỉ nhận
--       `projectId · code · name · trade · leaderUserId` rồi gọi
--       `insertProjectTeamWithWarehouse(...)` — **không thêm thành viên**
--     · UI chỉ ĐỌC `data.teamMembers` (`ProjectAggregateTabs`, `ProjectDetailTabs`, `ProjectEntityModal`)
--   ⇒ Đây là LỖ HỔNG CHỨC NĂNG đã biết từ trước: xem chính chú thích trong
--     `tools/task080-seed-real-data.sql:67` — «TỔ ĐỘI: thiếu TỔ TRƯỞNG và thiếu THÀNH VIÊN
--     (`team_members` = 0 dòng)». Tệp này tiếp nối đúng quy ước của tệp đó.
--
-- QUY ƯỚC (theo `task080-seed-real-data.sql`, ⛔ không tự đặt chữ):
--   · `role_in_team` lấy từ `role_catalog.name` (chức danh CHUẨN), không bịa
--   · id = `TMB_GOLIVE_` + 12 hex đầu của MD5(username)
--   · ⛔ Idempotent: `NOT EXISTS` + `COALESCE` để chạy lại không nhân đôi
--   · ⛔ KHÔNG xoá, KHÔNG sửa dòng nào đang có
-- =============================================================================

-- ── 1) TỔ TRƯỞNG cho 2 tổ đội dự án E2E (đang NULL) ────────────────────────────
UPDATE teams t
JOIN users u ON u.username = 'e2e.cht'
SET t.leader_user_id = u.id, t.updated_at = NOW(3)
WHERE t.code = 'E2E-DA-01-E2E-TD01' AND t.leader_user_id IS NULL;

UPDATE teams t
JOIN users u ON u.username = 'e2e.chtsa'
SET t.leader_user_id = u.id, t.updated_at = NOW(3)
WHERE t.code = 'E2E-DA-01-E2E-TD02' AND t.leader_user_id IS NULL;

-- ── 2) THÀNH VIÊN TỔ ĐỘI 1 — Xây dựng kết cấu (dự án E2E) ─────────────────────
-- ⛔ KHOÁ id PHẢI gồm CẢ `t.code`: một người có thể thuộc NHIỀU tổ đội, nên
--    `MD5(username)` không đủ — lần chạy đầu đã dính `ERROR 1062 Duplicate entry
--    'TMB_GOLIVE_573d04c73279' for key 'team_members.PRIMARY'` vì `e2e.tk` nằm ở cả 2 tổ đội.
INSERT INTO team_members (id, team_id, user_id, role_in_team, joined_at, left_at, active, created_at, updated_at)
SELECT CONCAT('TMB_GOLIVE_', LEFT(MD5(CONCAT(u.username, t.code)), 12)),
       t.id, u.id, COALESCE(rc.name, u.role), '2026-09-15 08:00:00.000', NULL, 1, NOW(3), NOW(3)
FROM teams t
JOIN users u ON u.active = 1
LEFT JOIN role_catalog rc ON rc.code = u.role
WHERE t.code = 'E2E-DA-01-E2E-TD01'
  AND u.username IN ('e2e.cht', 'e2e.ksda', 'e2e.project', 'e2e.tk')
  AND NOT EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = t.id AND tm.user_id = u.id);

-- ── 3) THÀNH VIÊN TỔ ĐỘI 2 — Hoàn thiện (dự án E2E) ───────────────────────────
INSERT INTO team_members (id, team_id, user_id, role_in_team, joined_at, left_at, active, created_at, updated_at)
SELECT CONCAT('TMB_GOLIVE_', LEFT(MD5(CONCAT(u.username, t.code)), 12)),
       t.id, u.id, COALESCE(rc.name, u.role), '2026-09-15 08:00:00.000', NULL, 1, NOW(3), NOW(3)
FROM teams t
JOIN users u ON u.active = 1
LEFT JOIN role_catalog rc ON rc.code = u.role
WHERE t.code = 'E2E-DA-01-E2E-TD02'
  AND u.username IN ('e2e.chtsa', 'e2e.to', 'e2e.tk')
  AND NOT EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = t.id AND tm.user_id = u.id);

-- ── 4) THÀNH VIÊN cho 2 tổ đội PRJ-DEMO đang TRỐNG (TD-02 · TD-03) ────────────
INSERT INTO team_members (id, team_id, user_id, role_in_team, joined_at, left_at, active, created_at, updated_at)
SELECT CONCAT('TMB_GOLIVE_', LEFT(MD5(CONCAT(u.username, t.code)), 12)),
       t.id, u.id, COALESCE(rc.name, u.role), '2026-09-15 08:00:00.000', NULL, 1, NOW(3), NOW(3)
FROM teams t
JOIN users u ON u.active = 1
LEFT JOIN role_catalog rc ON rc.code = u.role
WHERE t.code IN ('TD-02', 'TD-03')
  AND (
        (t.code = 'TD-02' AND u.username IN ('cha.ht', 'ksda.demo'))
     OR (t.code = 'TD-03' AND u.username IN ('tkhodemo', 'engineer.demo'))
      )
  AND NOT EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = t.id AND tm.user_id = u.id);
