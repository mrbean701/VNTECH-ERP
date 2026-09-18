import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
// U-11 (18/09/2026) — đọc HỢP NHẤT nguồn giao diện vì `page.tsx` đang được tách thành module (roadmap `U-11`).
// Không nới lỏng phép kiểm: literal vẫn phải tồn tại trong nguồn giao diện, chỉ đổi phạm vi ĐỌC.
const readUiSource = () => ['app/page.tsx', 'lib/ui-shared.tsx']
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

test('Each project workspace exposes the eight agreed navigation domains', () => {
  const labels = [
    '1. Tổng quan & Nhân sự dự án',
    '2. Kế hoạch & Tiến độ thi công',
    '3. Đề xuất & Nhu cầu dự án',
    '4. Nhật ký & Điều hành hiện trường',
    '5. Sản lượng & Nghiệm thu chất lượng',
    '6. Thầu phụ & Nhân công',
    '7. Phát sinh (V.O) & BOQ/HĐ',
    '8. Tài chính & Thanh quyết toán',
  ];
  for (const label of labels) assert.ok(page.includes(label), `Missing project workspace item: ${label}`);
});

test('Navigation aliases preserve existing purchasing, warehouse and BOQ modules', () => {
  assert.match(page, /\{ key: "requests", label: "Phiếu đề nghị mua hàng", icon: "ĐN", groupKey: "purchasing" \}/);
  assert.match(page, /key: "requests", label: "3\. Đề xuất & Nhu cầu dự án"/);
  assert.match(page, /related: \["inventory", "warehouse_issue", "material_norms"\]/);
  assert.match(page, /key: "boq", label: "7\. Phát sinh \(V\.O\) & BOQ\/HĐ"/);
  assert.match(page, /key: "capital_recovery", label: "8\. Tài chính & Thanh quyết toán"/);
  assert.match(page, /related: \["payments"\]/);
});

test('Project context is locked only while navigating inside project workspace', () => {
  assert.match(page, /PROJECT_WORKSPACE_CONTEXT_KEYS\.has\(active\)/);
  assert.match(page, /function activateProjectModule\(projectId:string,next:ModuleKey\)/);
  assert.match(page, /setProjectSelection\(String\(projectId\)\)/);
  assert.match(page, /setProjectWorkspaceId\(String\(projectId\)\)/);
  assert.match(page, /if\(projectWorkspaceId&&!PROJECT_WORKSPACE_CONTEXT_KEYS\.has\(active\)\)setProjectWorkspaceId\(null\)/);
  assert.match(page, /className="inline-alert project-context-lock"/);
});

test('Desktop and mobile reuse the canonical navigation/UI classes without adding a CSS override layer', () => {
  assert.match(page, /project-workspace-node/);
  assert.match(page, /className="nav-subgroup-items project-workspace-items" hidden=\{!projectOpen\}/);
  assert.match(page, /project-workspace-mobile/);
  assert.match(page, /className="row-actions project-workspace-tabs"/);
  assert.match(css, /\.nav-subgroup/);
  assert.match(css, /\.nav-subgroup-items/);
  assert.match(css, /\.mobile-nav-grandchildren/);
  assert.doesNotMatch(css, /VNTECH PROJECT NAVIGATION CONSOLIDATION 20260908/);
  assert.ok(css.trimEnd().endsWith('/* VNTECH_MASTER_BASELINE_CSS_R1_1_1_END */'));
});
