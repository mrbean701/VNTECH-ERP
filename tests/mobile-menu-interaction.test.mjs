import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const page = readFileSync(resolve(root, 'app/page.tsx'), 'utf8');
const css = readFileSync(resolve(root, 'app/globals.css'), 'utf8');

const mobileStart = page.indexOf('{mobileNavOpen&&<>');
const mobileEnd = page.indexOf('<main><header', mobileStart);
assert.ok(mobileStart >= 0 && mobileEnd > mobileStart, 'Không tìm thấy block mobile navigation canonical.');
const mobile = page.slice(mobileStart, mobileEnd);

test('Mobile department tree persists instead of resetting on each open', () => {
  assert.match(page, /mobileDepartmentStorageKey/);
  assert.match(page, /localStorage\.setItem\(mobileDepartmentStorageKey,mobileDepartmentExpanded\?"1":"0"\)/);
  assert.doesNotMatch(mobile, /setOpenDeptSubgroups\(\[\]\)/);
  assert.doesNotMatch(mobile, /setMobileDepartmentExpanded\(false\)/);
});

test('Active department branch auto-opens and active leaf is scrolled into view', () => {
  assert.match(page, /setMobileDepartmentExpanded\(true\)/);
  assert.match(page, /querySelector<HTMLElement>\('\.mobile-nav-panel \[aria-current="page"\]'\)/);
  assert.match(page, /scrollIntoView\(\{block:"nearest",inline:"nearest"\}\)/);
});

test('Single-child mobile groups navigate directly instead of acting like dead display rows', () => {
  assert.match(mobile, /const directChild=singleChild&&groupKey!=="department_management"&&groupKey!=="site_command"\?singleChild:null/);
  assert.match(mobile, /if\(directChild\)return <button/);
  assert.match(mobile, /activateModule\(directChild\.key\)/);
});

test('Project management always expands to project workspace nodes instead of an empty BCH list', () => {
  assert.match(mobile, /groupKey==="site_command" \? activeSiteProjects\.map/);
  assert.match(mobile, /project-workspace-mobile/);
  assert.match(mobile, /projectWorkspaceItems\.map/);
  assert.match(mobile, /activateProjectModule\(projectId,item\.key\)/);
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
  assert.match(css, /\.mobile-nav-panel \.mobile-nav-grandchildren button\{[\s\S]*?min-height:38px!important/);
  assert.match(css, /touch-action:manipulation!important/);
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
