import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
// U-11 (18/09/2026) — đọc HỢP NHẤT nguồn giao diện vì `page.tsx` đang được tách thành module (roadmap `U-11`).
// Không nới lỏng phép kiểm: literal vẫn phải tồn tại trong nguồn giao diện, chỉ đổi phạm vi ĐỌC.
const readUiSource = () => ['app/page.tsx', 'lib/ui-shared.tsx', 'lib/menu-helpers.ts', 'lib/request-actions.ts', 'lib/workflow-helpers.ts', 'app/screens/BoqControl.tsx']
  .map((relative) => { try { return readFileSync(new URL('../' + relative, import.meta.url), 'utf8'); } catch { return ''; } })
  .join('\n');


const page = readUiSource();
const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');

test('Project/BCH navigation is consolidated into one top-level group', () => {
  assert.match(page, /groupKey: "site_command", name: "QUẢN LÝ DỰ ÁN"/);
  assert.doesNotMatch(page, /groupKey: "project_management", name: "QUẢN LÝ DỰ ÁN"/);
  assert.match(page, /String\(row\.groupKey\) !== "project_management"/);
  assert.match(page, /if \(groupKey === "project_management"\) groupKey = "site_command"/);
});

test('Each project domain stays reachable inside the single QUẢN LÝ DỰ ÁN group', () => {
  // KP #96 (18/09/2026): "8 mục/dự án" (`PROJECT_WORKSPACE_ITEMS`) đã DỌN vì treo trên sentinel không bao giờ
  // khớp. Bất biến còn sống: 7 module dự án vẫn khai báo với `groupKey: "project_management"` và được
  // `configuredModules()` ÁNH XẠ vào nhóm `site_command` ⇒ vẫn tới được người dùng trong MỘT nhóm cấp 1.
  for (const key of ['project_progress', 'construction', 'production', 'capital_recovery', 'boq', 'payments', 'teams']) {
    assert.match(page, new RegExp(`key: "${key}",[^}]*groupKey: "project_management"`), `Thiếu module dự án: ${key}`);
  }
  assert.match(page, /if \(groupKey === "project_management"\) groupKey = "site_command"/);
});

test('Navigation aliases preserve existing purchasing, warehouse and BOQ modules', () => {
  assert.match(page, /\{ key: "requests", label: "Phiếu đề nghị mua hàng", icon: "ĐN", groupKey: "purchasing" \}/);
  assert.match(page, /\{ key: "boq", label: "BOQ \/ Hợp đồng dự án", icon: "BQ", groupKey: "project_management" \}/);
  assert.match(page, /\{ key: "payments", label: "Thanh toán HĐ", icon: "TT", groupKey: "project_management" \}/);
  assert.match(page, /\{ key: "teams", label: "Tổ đội theo dự án", icon: "TĐ", groupKey: "project_management" \}/);
  assert.match(page, /\{ key: "inventory", label: "Tồn kho & điều chuyển", icon: "TK", groupKey: "warehouse" \}/);
  assert.match(page, /\{ key: "material_norms", label: "Định mức vật tư theo dự án", icon: "ĐM", groupKey: "warehouse" \}/);
});

test('Project scope is chosen by the LIVE selector — the dead "workspace lock" must not return', () => {
  // Trước đây: khoá ngữ cảnh dự án (`projectWorkspaceId` → `lockedWorkspaceProject`) + hộp "DỰ ÁN ĐANG LÀM VIỆC".
  // Đo được: `projectWorkspaceId` khởi tạo `null` và CHỈ được gán bởi `activateProjectModule` — hàm chỉ được
  // gọi từ chính 2 nhánh render chết ⇒ toàn bộ cơ chế không bao giờ chạy. Nay chọn dự án bằng selector THẬT.
  assert.match(page, /const setProject = setProjectSelection;/);
  assert.match(page, /<ProjectScopeSelect projects=\{data\.projects\} project=\{project\} onChange=\{setProject\} allowAll=\{data\.projects\.length>1\}\/>/);
  assert.match(page, /const project = data\.projects\.length===1/);
  for (const dead of ['PROJECT_WORKSPACE_CONTEXT_KEYS', 'projectWorkspaceId', 'lockedWorkspaceProject', 'activateProjectModule', 'project-context-lock', 'project-workspace']) {
    assert.doesNotMatch(page, new RegExp(dead), `Cơ chế chết đã dọn (KP #96) không được quay lại: ${dead}`);
  }
});

test('Desktop and mobile reuse the canonical navigation/UI classes without adding a CSS override layer', () => {
  assert.match(page, /data-nav-group=\{groupKey\}/);
  assert.match(page, /className=\{`nav-child nav-child-\$\{groupKey\}/);
  assert.match(page, /className="mobile-nav-children"/);
  assert.match(page, /className=\{`mobile-nav-group \$\{childActive\?"has-active":""\}`\}/);
  assert.match(css, /\.nav-children\{/);
  assert.match(css, /\.mobile-nav-children\{/);
  assert.match(css, /\.mobile-nav-dashboard,/);
  // KP #96: họ lớp của cây chết (`nav-subgroup*`, `mobile-nav-grandchildren`, `project-workspace*`) đã dọn sạch.
  for (const dead of ['nav-subgroup', 'nav-child-dept', 'mobile-nav-subgroup', 'mobile-nav-grandchildren', 'project-workspace', 'dept-chevron']) {
    assert.doesNotMatch(css, new RegExp(`\\.${dead}`), `Lớp CSS chết (KP #89/#96) không được quay lại: .${dead}`);
  }
  assert.doesNotMatch(css, /VNTECH PROJECT NAVIGATION CONSOLIDATION 20260908/);
  assert.ok(css.trimEnd().endsWith('/* VNTECH_MASTER_BASELINE_CSS_R1_1_1_END */'));
});
