-- ══════════════════════════════════════════════════════════════════════════════════════════════════
-- V40 — KHOÁ QUYỀN «work» DÙNG CHUNG MỌI PHÒNG BAN (MA TRẬN PHÂN QUYỀN WORK **ĐỘNG**)
-- ══════════════════════════════════════════════════════════════════════════════════════════════════
-- QUYẾT ĐỊNH USER 08/10/2026 (`ERP-SESSION-04`, chốt qua thẻ quyết định — **PHƯƠNG ÁN A**):
--   «Trong ma trận hiện tại thì lại chia ra 2 phòng ban, trong khi công ty có rất nhiều phòng ban,
--    nên **không được hardcode mà phải thiết kế động**.»
--
-- ⭐ SỐ ĐO TRƯỚC KHI SỬA (⛔ không suy diễn — đo từ CSDL thật + API `bootstrap`):
--   · `organization_units` = **11 đơn vị** (BGD·DA·HCPC·BCH·E2E-BCH-01·E2E-DIAG-BCH·KH·NS·TCKT·
--     VNTECH·VNTECH-01) · `users` = **73 tài khoản** thuộc **8 đơn vị** (BCH 44 · DA 15 · KH 5 ·
--     BGD 4 · TCKT 2 · HCPC 1 · NS 1 · 1 tài khoản không đơn vị).
--   · Nhóm quyền WORK cũ chỉ có **4 khoá / 2 phòng ban** (`dept_plan_*` = Phòng Kế hoạch ·
--     `dept_project_*` = Phòng Dự án) ⇒ nhân sự TCKT/HCPC/NS ⛔ không có khoá nào để cấp quyền CÔNG VIỆC.
--   · `work_items.department_code` **đã ĐỘNG** từ lâu: giá trị thật gồm `DA` và `CN` — trong đó
--     `CN` = **«Cá nhân»** theo thiết kế (`OpsTaskManagementUseCase.java:303`), ⛔ KHÔNG phải mã phòng.
--
-- ✅ VIỆC CỦA MIGRATION NÀY (⛔ KHÔNG cấp thêm quyền cho ai ngoài phần «bù hồi quy» ở §3):
--   §1. Thêm khoá `work` vào `module_catalog` — cổng **NĂNG LỰC** (Xem·Thao tác·Tạo·Sửa·Duyệt·Xuất),
--       ⛔ KHÔNG gắn phòng ban nào. ⚠️ Bắt buộc phải có dòng ở đây: backend **validate khoá quyền theo
--       `module_catalog`** (`UserAdminStoreAdapter.java:249` → `SELECT module_key FROM module_catalog
--       WHERE active=1`) ⇒ thiếu dòng = ⛔ không lưu được quyền cho khoá đó.
--   §2. Cấp khoá `work` cho **mọi đơn vị** theo đúng **MẪU ĐANG CÓ** của chính đơn vị đó:
--       lấy `MAX()` của 4 khoá WORK cũ ⇒ **giữ nguyên năng lực hiện tại**, ⛔ KHÔNG nới thêm
--       (đúng luật dự án: «⛔ KHÔNG tự cấp thêm quyền — quyết định nghiệp vụ», xem `MASTER_STATUS` mục 80).
--   §3. **BÙ HỒI QUY** cho 3 tài khoản quản lý phòng: xem chú thích §3 bên dưới.
--
-- 🔗 LUẬT PHẠM VI (⛔ KHÔNG nằm trong bảng quyền — tính ĐỘNG ở backend, đã port CẢ 2 đường):
--   · `scripts/system-route.mjs` → `function workScopeAll(user)` (cuối tệp)
--   · `BootstrapDataAdapter.isWorkCompanyScope(...)` + mệnh đề `workItemWhere`
--   ① admin/lãnh đạo công ty ⇒ TOÀN BỘ việc · ② còn lại ⇒ việc CỦA MÌNH + việc CÙNG MÃ PHÒNG khi
--   đơn vị mình là `site_command` (giữ nguyên quyền cũ) HOẶC chức danh mình là quản lý phòng `%_truong`.
--   Mã phòng tra ĐỘNG `users.organization_unit_id → organization_units.code` ⇒ chạy đúng cho cả 11 đơn vị.
--
-- ⚠️ GHI CHÚ KỸ THUẬT: file này BẮT BUỘC **IDEMPOTENT** (chạy lại ⛔ không đổi kết quả):
--   `INSERT IGNORE` + `INSERT … SELECT … WHERE NOT EXISTS` + `UPDATE … WHERE` (chỉ vá dòng thiếu cờ).
-- ⚠️ ⛔ KHÔNG đụng 4 khoá WORK cũ: chúng vẫn là cổng THẬT của tầng UI (tab của `WorkCenter`, tiêu đề màn,
--   tìm kiếm, nhánh render) ⇒ xoá/tắt là **vỡ màn Công việc**.
-- ══════════════════════════════════════════════════════════════════════════════════════════════════

-- ── §1. KHOÁ `work` TRONG `module_catalog` ────────────────────────────────────────────────────────
-- `sort_order = 9` ⇒ đứng NGAY TRƯỚC `dept_plan_tasks` (21) trong nhóm `my_work`.
-- `group_key = 'my_work'` ⇒ nằm cùng nhóm «Công việc» ở ma trận phân quyền.
-- `system_locked = 0` ⇒ quản trị viên còn đổi được nhãn/thứ tự (khoá hệ thống thì khoá cứng).
INSERT IGNORE INTO `module_catalog`
  (`module_key`,`label`,`icon`,`group_name`,`active`,`sort_order`,`system_locked`,`created_at`,`updated_at`,`group_key`)
VALUES
  ('work','Công việc (mọi phòng ban)','CV','QUẢN LÝ PHÒNG BAN',1,9,0,NOW(3),NOW(3),'my_work');

-- ── §2. CẤP KHOÁ `work` CHO MỌI ĐƠN VỊ — THEO ĐÚNG MẪU HIỆN CÓ (⛔ KHÔNG NỚI THÊM) ────────────────
-- `MAX(p.can_*)` = năng lực CAO NHẤT mà đơn vị đó đang có trên 4 khoá WORK cũ (nếu đơn vị chưa có dòng
-- nào thì `COALESCE` ⇒ 0). Nhờ vậy: đơn vị nào đang `can_edit=1` thì khoá mới cũng `1`; đơn vị đang
-- `0` vẫn `0` ⇒ **⛔ không có đơn vị nào được cấp thêm quyền ngoài hiện trạng**.
INSERT INTO `department_module_permissions`
  (`id`,`organization_unit_id`,`module_key`,`can_view`,`can_use`,`can_create`,`can_edit`,`can_approve`,
   `can_export`,`active`,`updated_by`,`created_at`,`updated_at`)
SELECT CONCAT('DMP-WORK-', o.id), o.id, 'work',
       COALESCE(MAX(p.can_view),0), COALESCE(MAX(p.can_use),0), COALESCE(MAX(p.can_create),0),
       COALESCE(MAX(p.can_edit),0), COALESCE(MAX(p.can_approve),0), COALESCE(MAX(p.can_export),1),
       1, 'V40-work-dong', NOW(3), NOW(3)
  FROM `organization_units` o
  LEFT JOIN `department_module_permissions` p
         ON p.organization_unit_id = o.id
        AND p.module_key IN ('dept_plan_tasks','dept_project_tasks','dept_plan_assign','dept_project_assign')
 WHERE o.active = 1 AND o.archived_at IS NULL
   AND NOT EXISTS (SELECT 1 FROM `department_module_permissions` d
                    WHERE d.organization_unit_id = o.id AND d.module_key = 'work')
 GROUP BY o.id
-- ⚠️ CHỈ chèn cho đơn vị THẬT SỰ có năng lực WORK (tổng 5 cờ > 0). VÌ SAO (⚠️ phát hiện khi áp thử lên
--    CSDL thật — ĐO ĐƯỢC **11 đơn vị nhưng chỉ 8 đơn vị có dòng quyền WORK**): 3 đơn vị còn lại
--    (`E2E-BCH-01`·`E2E-DIAG-BCH` + 1) **⛔ chưa từng có dòng `department_module_permissions` nào**.
--    Nếu chèn dòng `work` toàn số 0 cho chúng thì đơn vị bị coi là **«ĐÃ cấu hình quyền»**, và
--    `assertDepartmentAllowsPermissions` (ràng buộc «quyền người ⛔ không vượt quá quyền phòng») sẽ
--    BẮT ĐẦU ÁP cho đơn vị đó ⇒ có thể **CHẶN cấp quyền** ở các module khác — hồi quy ⛔ không đáng có.
 HAVING (COALESCE(MAX(p.can_view),0) + COALESCE(MAX(p.can_use),0) + COALESCE(MAX(p.can_create),0)
       + COALESCE(MAX(p.can_edit),0) + COALESCE(MAX(p.can_approve),0)) > 0;

-- ── §3. BÙ HỒI QUY — QUYỀN DUYỆT VIỆC CỦA QUẢN LÝ PHÒNG (3 tài khoản, ⛔ không phải «cấp mới») ──────
-- ⚠️ HỒI QUY DO CHÍNH VIỆC TÁCH ACTION `approve_work_item` (quyết định user 08/10, câu hỏi Q2 chọn (b)
--    «tách action mới + `canApprove`»): TRƯỚC khi tách, nút «Duyệt» đi qua `update_work_item_status`
--    (`canEdit`) nên quản lý phòng DUYỆT ĐƯỢC; SAU khi tách, nút đi qua `approve_work_item`
--    (`canApprove`) — mà ĐO CSDL: 4 khoá WORK cũ có `can_approve=0` ở **BCH·DA·HCPC·KH·TCKT**
--    ⇒ quản lý phòng Kế hoạch/Dự án bị **403** khi bấm «Duyệt» (⚠️ admin/lãnh đạo ⛔ không bị vì đi
--    nhánh `isAdmin`/`isCompanyLeadership`).
-- ✅ CÁCH BÙ: cấp `can_approve=1` trên **khoá `work`** cho **ĐÚNG tập tài khoản đã duyệt được trước đây**
--    — tức các tài khoản có chức danh quản lý phòng (`role LIKE '%\_truong'`; ĐO ĐƯỢC **3 tài khoản**:
--    `e2e.kh`·`trinhtrench` = `kh_truong` (KH) · `trdademo` = `da_truong` (DA)) ⇒ **khôi phục ĐÚNG hành vi cũ**,
--    ⛔ KHÔNG mở thêm cho nhân viên (cấp ở tầng NGƯỜI DÙNG, ⛔ không phải tầng phòng ban — cấp ở tầng
--    phòng ban là **mọi nhân viên trong phòng đều duyệt được**, SAI).
-- 📌 CÒN TREO (cần user quyết): TCKT·HCPC·NS·BCH chưa có chức danh `%_truong` ⇒ chưa xác định được
--    «ai là trưởng phòng» ở các đơn vị đó. Migration này ⛔ KHÔNG tự đoán — xem `docs/60` + HANDOFF.
-- ⚠️ VÌ SAO PHẢI `INSERT` (⛔ KHÔNG chỉ `UPDATE`): khoá `work` là khoá **MỚI** ⇒ **chưa có dòng nào**
--    trong `user_module_permissions` ⇒ nếu chỉ `UPDATE` thì khớp **0 dòng** và hồi quy ⛔ **KHÔNG được bù**
--    (⚠️ đây là lỗi tôi tự phát hiện khi soạn file: bản nháp đầu CHỈ có `UPDATE` ⇒ vô hiệu).
INSERT INTO `user_module_permissions`
  (`id`,`user_id`,`module_key`,`can_view`,`can_use`,`can_create`,`can_edit`,`can_approve`,`can_export`,
   `permission_expires_at`,`permission_source`,`created_at`,`updated_at`)
SELECT CONCAT('UMP-WORK-', u.id), u.id, 'work', 1, 1, 1, 1, 1, 1, NULL, 'manual_override', NOW(3), NOW(3)
  FROM `users` u
 WHERE u.active = 1
   AND u.role LIKE '%\_truong'
   AND NOT EXISTS (SELECT 1 FROM `user_module_permissions` x
                    WHERE x.user_id = u.id AND x.module_key = 'work');

-- Phòng vệ: dòng `work` ĐÃ CÓ nhưng thiếu cờ duyệt (khi migration chạy lại trên dữ liệu đã chỉnh tay).
UPDATE `user_module_permissions` u
   SET u.can_approve = 1, u.updated_at = NOW(3)
 WHERE u.module_key = 'work' AND u.can_approve = 0
   AND EXISTS (SELECT 1 FROM `users` x WHERE x.id = u.user_id AND x.role LIKE '%\_truong');

-- ── §4. GIA CỐ: đơn vị ⛔ KHÔNG có dòng `work` thì bổ sung (phòng vệ nếu §2 bị chạy khi bảng đang khoá) ──
UPDATE `department_module_permissions` d
   SET d.active = 1, d.updated_at = NOW(3)
 WHERE d.module_key = 'work' AND d.active = 0;
