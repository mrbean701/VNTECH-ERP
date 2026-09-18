import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
// U-11 (18/09/2026) — đọc HỢP NHẤT nguồn giao diện vì `page.tsx` đang được tách thành module (roadmap `U-11`).
const readUiSource = () => ['app/page.tsx', 'lib/ui-shared.tsx']
  .map((relative) => { try { return readFileSync(resolve(root, relative), 'utf8'); } catch { return ''; } })
  .join('\n');

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const page = readUiSource();
const css = readFileSync(resolve(root, 'app/globals.css'), 'utf8');

const mobileStart = page.indexOf('{mobileNavOpen&&<>');
const mobileEnd = page.indexOf('<main><header', mobileStart);
assert.ok(mobileStart >= 0 && mobileEnd > mobileStart, 'Không tìm thấy block mobile navigation canonical.');
const mobile = page.slice(mobileStart, mobileEnd);

test('Mobile menu group expansion persists instead of resetting on each open', () => {
  assert.match(page, /localStorage\.setItem\(menuStorageKey, JSON\.stringify\(openGroups\.slice\(0, 2\)\)\)/);
  assert.doesNotMatch(mobile, /setOpenGroups\(\[\]\)/);
  // KP #89 (18/09/2026): cơ chế "nhóm con phòng ban" đã dọn (nhánh render không bao giờ chạy — xem
  // tools/probe-kp89-dead-dept-branch.mjs). Phép kiểm nay CẤM nó quay lại, mạnh hơn phép kiểm cũ.
  assert.doesNotMatch(page, /openDeptSubgroups|mobileDepartmentExpanded|department_management/);
});

test('Active group auto-opens and active leaf is scrolled into view', () => {
  assert.match(page, /const activeGroup = allowedModules\.find\(\(item\) => item\.key === active\)\?\.groupKey/);
  assert.match(page, /setOpenGroups\(\(current\) => current\.includes\(String\(activeGroup\)\)/);
  assert.match(page, /querySelector<HTMLElement>\('\.mobile-nav-panel \[aria-current="page"\]'\)/);
  assert.match(page, /scrollIntoView\(\{block:"nearest",inline:"nearest"\}\)/);
});

test('Single-child mobile groups navigate directly instead of acting like dead display rows', () => {
  assert.match(mobile, /const directChild=singleChild&&groupKey!=="site_command"\?singleChild:null/);
  assert.match(mobile, /if\(directChild\)return <button/);
  assert.match(mobile, /activateModule\(directChild\.key\)/);
});

test('Project management renders its LIVE child modules (dead workspace tree removed)', () => {
  // KP #96 (18/09/2026): "cây workspace theo dự án" (8 mục/dự án) treo trên một sentinel KHÔNG nhóm menu nào
  // có (`menu_group_catalog` chỉ 12 nhóm thật, cả MySQL lẫn SQLite) ⇒ đã DỌN. Giao diện THẬT của nhóm
  // «QUẢN LÝ DỰ ÁN» là danh sách con phẳng. Phép kiểm nay khẳng định cái ĐANG chạy và CẤM cây chết quay lại.
  assert.match(page, /groupKey: "site_command", name: "QUẢN LÝ DỰ ÁN"/);
  assert.match(mobile, /group\.children\.map\(\(item\)=>\{/);
  assert.match(mobile, /activateModule\(item\.key\)/);
  assert.doesNotMatch(page, /__site_command_tree_disabled__|project-workspace|projectWorkspaceItems|PROJECT_WORKSPACE_ITEMS|activateProjectModule/);
});

test('Parent/subgroup rows are expand actions and leaf rows are navigation actions', () => {
  assert.match(mobile, /data-nav-action="expand"/);
  assert.match(mobile, /data-nav-action="navigate"/);
  assert.match(mobile, /aria-current=/);
  assert.match(mobile, /aria-expanded=/);
});

test('Mobile tap targets remain usable for nested menu levels', () => {
  assert.match(css, /\.mobile-nav-panel \.mobile-nav-dashboard,[\s\S]*?min-height:44px!important/);
  assert.match(css, /\.mobile-nav-panel \.mobile-nav-children>button\{[\s\S]*?min-height:40px!important/);
  assert.match(css, /touch-action:manipulation!important/);
  // Cấp "cháu" của cây menu KHÔNG còn (chỉ nhánh chết phát ra `mobile-nav-grandchildren`) ⇒ CẤM quay lại.
  assert.doesNotMatch(page, /mobile-nav-grandchildren/);
  assert.doesNotMatch(css, /mobile-nav-grandchildren/);
});

test('Project management exposes Production module that was previously orphaned', () => {
  assert.match(page, /\{ key: "production", label: "Sản lượng", icon: "SL", groupKey: "project_management" \}/);
  assert.match(page, /active === "production" && <ProductionReports/);
});

test('Material norms is implemented as a real screen with its dedicated component', () => {
  assert.match(page, /material_norms: \["Định mức vật tư theo dự án"/);
  assert.match(page, /active === "material_norms" && <MaterialNormsScreen/);
  const developmentModuleSet = page.match(/DEVELOPMENT_MODULES = new Set<ModuleKey>\((\[[^\]]*\])\)/)?.[1] || '';
  assert.ok(developmentModuleSet.length > 0, 'Không tìm thấy DEVELOPMENT_MODULES set.');
  assert.doesNotMatch(developmentModuleSet, /"material_norms"/);
});
