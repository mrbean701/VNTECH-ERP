-- VNTECH ERP V5.3.0 — KIẾN TRÚC / KP #96: DỌN "CÂY WORKSPACE THEO DỰ ÁN" (mã chết không bao giờ render)
-- (metadata identity refresh)
-- Không đổi nghiệp vụ, không đổi schema. Chỉ cập nhật source fingerprint.
--
-- NGƯỜI DÙNG QUYẾT (18/09, qua Telegram): KP #96 → **dọn luôn cây đó** (phương án b).
--
-- TIỀN ĐỀ ĐO ĐƯỢC (cổng `tools/probe-kp96-dead-project-tree.mjs` — 31/31 ĐẠT):
--   • Hai nhánh render (desktop + mobile) treo trên sentinel `groupKey==="__site_command_tree_disabled__"`,
--     nhưng `configuredMenuGroups()` KHÔNG BAO GIỜ gán khoá đó: `menu_group_catalog` chỉ có **12 nhóm thật**
--     (đo trên CẢ MySQL + SQLite) và bản fallback `defaultMenuGroups` cũng 12 nhóm.
--   • Nhóm `project_management` còn bị CHÍNH hàm đó **LỌC BỎ** (`.filter((row) => String(row.groupKey)
--     !== "project_management")`) ⇒ CSS `[data-nav-group="project_management"]` cũng không thể khớp.
--   • `projectWorkspaceId` khởi tạo `null` và CHỈ được gán bởi `activateProjectModule` — hàm chỉ được gọi
--     từ chính 2 nhánh chết ⇒ toàn bộ "khoá ngữ cảnh dự án" (lockedWorkspaceProject / activeProjectWorkspace
--     / selectedWorkspaceProject / hộp "DỰ ÁN ĐANG LÀM VIỆC" / 2 dải tab dự án) **chưa bao giờ chạy**.
--
-- ĐÃ DỌN:
--   • `app/page.tsx` 3415 → 3386 dòng (687.648 → 679.802 byte): 2 nhánh render cây (1.807 + 1.336 ký tự),
--     `activeSiteProjects`, 2 state (`projectWorkspaceId`, `openProjectNodeId`), `lockedWorkspaceProject`,
--     `activateProjectModule` (405), effect reset khoá (301), `selectedWorkspaceProject`/`activeWorkspaceItem`,
--     `projectWorkspaceItems`/`activeProjectWorkspace`/2 dải tab (543), hộp "DỰ ÁN ĐANG LÀM VIỆC" (313),
--     2 dải tab trong thân render (1.018 + 577), khối hằng số `PROJECT_WORKSPACE_ITEMS` +
--     `PROJECT_WORKSPACE_CONTEXT_KEYS` (1.143) — thay bằng chú thích ghi lý do + bằng chứng.
--     ⚠️ `project` (dự án đang chọn) nay = nhánh còn sống; **tương đương hành vi** vì toán hạng đã bỏ LUÔN null.
--     ⚠️ Lỗi ĐÃ GẶP khi áp dụng: bỏ `lockedWorkspaceProject || (` mà quên dấu `)` đóng ⇒ `tsc` báo
--     `TS1005: ',' expected` — đã vá + ghi vào công cụ để lần chạy sau không tái phạm.
--   • `app/globals.css`: dọn **100 rule + 60 selector** của họ lớp cây chết (`nav-subgroup*`, `nav-child-dept*`,
--     `nav-child-bch*`, `mobile-nav-subgroup*`, `mobile-nav-grandchildren`, `dept-chevron`, `project-workspace*`,
--     `.mobile-nav-expanded`, 2 họ `[data-nav-group="…"]` chết) ⇒ **388.282 → 370.874 byte**,
--     `!important` **4849 → 4550**.
--   • `scripts/css-baseline-audit.mjs`: mở rộng danh sách **CẤM tái phát** cho cả 2 họ (KP #89 + KP #96).
--   • `scripts/preflight-source.mjs`: 11 marker cũ thuộc nhánh CHẾT (8 mục/dự án, hộp khoá dự án,
--     `activateProjectModule`) → thay bằng marker CÒN SỐNG (danh sách con phẳng + `ProjectScopeSelect`) và
--     **CẤM** 6 tên mã chết quay lại — KHÔNG nới lỏng phép kiểm.
--   • `tests/mobile-menu-interaction.test.mjs` + `tests/project-navigation-consolidation.test.mjs` +
--     `tests/runtime-admin-boq-regression.test.mjs`: viết lại theo **bất biến CÒN SỐNG** (danh sách con phẳng ·
--     chọn dự án bằng `ProjectScopeSelect` · cấp menu `mobile-nav-children` · flyout thu gọn) + **CẤM** cây chết
--     quay lại (trước đây 2 tệp đầu đo MÃ CHẾT ⇒ xanh vô nghĩa).
--
-- CỔNG MỚI: `tools/probe-kp96-dead-project-tree.mjs` — 31/31 ĐẠT (tiền đề + đối chứng dương/âm + đo đóng).
-- GIỮ NGUYÊN: cây phân quyền đọc nhãn `subGroup` · 7 module dự án ánh xạ vào `site_command` · nhóm menu 12 nhóm.

--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='e18ecd44a46d222930f056694506a680af6072cc72a477c2add14a8a3c42a09f'
WHERE id='VNTECH-KHO-MEP-001';
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS vntech_product_identity_no_update
BEFORE UPDATE ON vntech_product_identity
BEGIN
  SELECT RAISE(ABORT, 'VNTECH product identity is protected.');
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS vntech_product_identity_no_delete
BEFORE DELETE ON vntech_product_identity
BEGIN
  SELECT RAISE(ABORT, 'VNTECH product identity is protected.');
END;
