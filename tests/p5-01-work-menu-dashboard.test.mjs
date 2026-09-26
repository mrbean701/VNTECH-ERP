// MT2-P5-01 + MT2-P5-02 (§3.1) — HỢP ĐỒNG REGRESSION: menu «Công việc» ⇄ tab Dashboard.
// ⚠️ TRUNG THỰC: mã đã có từ 22/09 (xem `docs/agent-progress/MT2-PHASE-5-AUDIT.md`); hợp đồng này là
// KHOÁ REGRESSION viết sau, ⛔ KHÔNG giả vờ "đỏ trước khi sửa".
// §3.1: «Click menu Công việc ⇒ hiển thị Dashboard ngay; đưa Dashboard lên ĐẦU menu nếu vẫn giữ menu;
//        hoặc bỏ menu item Dashboard nếu menu Công việc đã có đủ tab và dashboard hiển thị trực tiếp.»
// Chạy: node --import tsx --test tests/p5-01-work-menu-dashboard.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const menu = read("../lib/menu-helpers.ts");
const center = read("../app/screens/WorkCenter.tsx");

test("P5-01 — mục «Dashboard» nhóm «Công việc» trỏ ĐÚNG `view: \"dashboard\"` (⛔ không còn `kpi`)", () => {
  const line = menu.split("\n").find((row) => row.includes('key: "work_dashboard"'));
  assert.ok(line, "phải có mục menu work_dashboard");
  assert.match(line, /view: "dashboard"/, "phải trỏ tab Dashboard, ⛔ không trỏ KPI");
  assert.match(line, /groupKey: "my_work"/, "phải thuộc nhóm menu «Công việc»");
});

test("P5-02 — «Dashboard» đứng ĐẦU nhóm «Công việc» (§3.1 ②)", () => {
  const block = menu.slice(menu.indexOf("const workMenuItems"), menu.indexOf("const legacyWorkMenuKeys"));
  const keys = [...block.matchAll(/key: "(work_[a-z]+)"/g)].map((m) => m[1]);
  assert.deepEqual(keys, ["work_dashboard", "work_personal", "work_department", "work_assign", "work_reports"],
    "Dashboard phải là mục ĐẦU TIÊN của nhóm Công việc");
});

test("P5-01 — `dashboard` ánh xạ ĐÚNG tab index của WORK_TABS (ĐO, ⛔ không hard-code mù)", () => {
  const tabs = center.match(/const WORK_TABS = \[([^\]]+)\]/);
  assert.ok(tabs, "phải đọc được WORK_TABS");
  const labels = [...tabs[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  const dashboardIndex = labels.indexOf("Dashboard");
  assert.ok(dashboardIndex >= 0, "WORK_TABS phải có tab «Dashboard»");
  const map = center.match(/const WORK_TAB_OF_VIEW[^}]+}/);
  assert.ok(map, "phải có WORK_TAB_OF_VIEW");
  assert.match(map[0], new RegExp(`dashboard: ${dashboardIndex}(\\D|$)`),
    `view "dashboard" phải trỏ tab index ${dashboardIndex} (theo WORK_TABS thật)`);
});

test("P5-01 — WorkCenter nhận `view` và render tab theo `view` (⛔ không bỏ qua tham số)", () => {
  assert.match(center, /function WorkCenter\(\{[^}]*view = "personal"/, "WorkCenter phải nhận prop view");
  assert.match(center, /WORK_TAB_OF_VIEW\[view\]/, "tab phải suy từ view ⇒ click menu vào ĐÚNG tab");
});
