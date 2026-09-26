-- VNTECH ERP V5.3.0 — TASK-080: NẠP DỮ LIỆU THẬT CÒN THIẾU (người dùng cho phép 17/09/2026:
-- "từ giờ không hardcode nữa, chỉ sử dụng dữ liệu thật; nếu chưa có thì insert đầy đủ để có căn cứ
--  cho việc test luồng và mô phỏng hoạt động thực tế").
--
-- ĐÃ SAO LƯU TRƯỚC KHI SỬA: tools/_backup-permissions-truoc-TASK080.txt (2 bảng quyền, 97,5 KB).
--
-- NGUYÊN TẮC: chỉ THÊM cái còn thiếu; KHÔNG hạ mức quyền đang có; không tự đặt chữ hiển thị mới
-- (mọi nhãn lấy từ role_catalog / module_catalog / organization_units có sẵn).
-- KẾT QUẢ ĐO ĐƯỢC: department_module_permissions 51 → 480 dòng · user_module_permissions 484 → 926
-- dòng · số module khác nhau được cấp 39 → 60/60 · **0 tài khoản bị GIẢM quyền** (so với bản sao lưu).

-- ─────────────────────────────────────────────────────────────────────────────
-- 1) MA TRẬN QUYỀN PHÒNG BAN còn thiếu (nguồn để hệ thống sinh quyền người dùng)
--    Vì sao cần: `department_module_permissions` chỉ có 51 dòng cho 8 đơn vị × 61 module ⇒ 22 module
--    KHÔNG phòng nào được cấp ⇒ ngoài admin không ai mở được (đúng lớp lỗi §6 của audit).
--    Mức cho cặp MỚI: view + use + export (mở được màn, xem/xuất). Riêng BGD thêm `approve`
--    (Ban giám đốc là cấp duyệt). KHÔNG cấp create/edit ở đây — để quản trị viên cấp trong
--    tab "Phân quyền phòng ban" khi cần ghi dữ liệu.
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO department_module_permissions
  (id, organization_unit_id, module_key, can_view, can_use, can_create, can_edit, can_approve, can_export,
   active, updated_by, created_at, updated_at)
SELECT CONCAT('DMP_T080_', LEFT(MD5(CONCAT(ou.code, '|', mc.module_key)), 16)),
       ou.id, mc.module_key,
       1, 1, 0, 0, CASE WHEN ou.code = 'BGD' THEN 1 ELSE 0 END, 1,
       1, 'TASK-080', NOW(3), NOW(3)
FROM organization_units ou
CROSS JOIN module_catalog mc
WHERE ou.code IN ('DA', 'KH', 'TCKT', 'HCPC', 'BCH', 'BGD')
  AND ou.active = 1
  AND mc.active = 1
  AND mc.module_key <> 'admin'
  AND NOT EXISTS (
        SELECT 1 FROM department_module_permissions d
        WHERE d.organization_unit_id = ou.id AND d.module_key = mc.module_key);

-- 1b) Đơn vị CÔNG TY (`VNTECH`, `VNTECH-01`) — nơi đặt tài khoản lãnh đạo (vd Thư ký TGĐ).
--     Nếu bỏ trống, đồng bộ quyền sẽ khiến tài khoản thuộc đơn vị này TỤT quyền (đã quan sát 60 → 15).
--     Vai trò lãnh đạo/công ty: có `approve`.
INSERT INTO department_module_permissions
  (id, organization_unit_id, module_key, can_view, can_use, can_create, can_edit, can_approve, can_export,
   active, updated_by, created_at, updated_at)
SELECT CONCAT('DMP_T080C_', LEFT(MD5(CONCAT(ou.code, '|', mc.module_key)), 15)),
       ou.id, mc.module_key,
       1, 1, 0, 0, 1, 1,
       1, 'TASK-080', NOW(3), NOW(3)
FROM organization_units ou
CROSS JOIN module_catalog mc
WHERE ou.code IN ('VNTECH', 'VNTECH-01')
  AND ou.active = 1
  AND mc.active = 1
  AND mc.module_key <> 'admin'
  AND NOT EXISTS (
        SELECT 1 FROM department_module_permissions d
        WHERE d.organization_unit_id = ou.id AND d.module_key = mc.module_key);

-- 1c) SINH LẠI QUYỀN NGƯỜI DÙNG bằng CHÍNH CƠ CHẾ CỦA SẢN PHẨM (KHÔNG phải script riêng):
--     gọi action `rebuild_department_permissions` qua API (chỉ admin) —
--     nó xoá `department_default` rồi sinh lại từ ma trận trên, GIỮ NGUYÊN ngoại lệ cá nhân.
--
--     node -e  hoặc dùng tools/probe-... ; cách đã dùng trong phiên:
--       POST http://127.0.0.1:18081/api/system  {action:"rebuild_department_permissions", payload:{}}
--       (đăng nhập admin trước để lấy cookie `mep_session`)
--     Kết quả trả về: "Đã đồng bộ lại quyền mặc định phòng ban cho 11 tài khoản."

-- ─────────────────────────────────────────────────────────────────────────────
-- 2) TỔ ĐỘI: thiếu TỔ TRƯỞNG và thiếu THÀNH VIÊN (team_members = 0 dòng)
--    `role_in_team` lấy từ `role_catalog.name` (chức danh chuẩn) — không tự đặt chữ.
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE teams t
JOIN users u ON u.username = 'cha.ht'
SET t.leader_user_id = u.id, t.updated_at = NOW(3)
WHERE t.code = 'PRJ-DEMO-01-TD-01' AND t.leader_user_id IS NULL;

INSERT INTO team_members (id, team_id, user_id, role_in_team, joined_at, left_at, active, created_at, updated_at)
SELECT CONCAT('TMB_T080_', LEFT(MD5(u.username), 12)),
       t.id, u.id, COALESCE(rc.name, u.role), '2026-01-05 08:00:00.000', NULL, 1, NOW(3), NOW(3)
FROM teams t
JOIN users u ON u.active = 1
LEFT JOIN role_catalog rc ON rc.code = u.role
WHERE t.code = 'PRJ-DEMO-01-TD-01'
  AND u.username IN ('cha.ht', 'tkhodemo', 'engineer.demo', 'ksda.demo')
  AND NOT EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = t.id AND tm.user_id = u.id);

-- ─────────────────────────────────────────────────────────────────────────────
-- CÒN LẠI (ghi rõ, chưa làm trong đợt này):
--   • role_catalog.default_organization_unit_id = NULL cho cả 16 vai trò (TASK-032)
--   • work_items = 0 · email_outbox = 0 · capital_recovery_records = 0 · production_reports = 0
--   • 1 dòng `attachments` mồ côi (trỏ chứng từ có purchase_order không tồn tại) + 11 tệp rời trong kho
-- ─────────────────────────────────────────────────────────────────────────────
