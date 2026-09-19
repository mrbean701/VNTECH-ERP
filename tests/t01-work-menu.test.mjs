// PHASE 3 (`T-01`) — HỢP ĐỒNG MENU NHÓM «CÔNG VIỆC»: 5 MỤC — ĐÚNG NHÃN · ĐÚNG ĐÍCH ĐẾN · CỔNG QUYỀN RIÊNG.
//
// Vì sao kiểm ở tầng NGUỒN (không phải DOM): nhánh `T-01` BỊ CẤM build/khởi động dịch vụ (xem đề bài), mà
// bằng chứng runtime chỉ có nghĩa SAU khi build lại bundle — đúng bài học đã ghi nhiều lần trong dự án.
// Vì vậy hợp đồng chốt ở nguồn, theo đúng cách `tests/pr01-project-tabs.test.mjs` đang làm.
//
// LƯU Ý: tệp này CỐ Ý không nằm trong `package.json` → `test:regression` giữ nguyên số ca.
// Chạy riêng:  node --test tests/t01-work-menu.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (relative) => readFileSync(new URL("../" + relative, import.meta.url), "utf8");
const menuHelpers = read("lib/menu-helpers.ts");
const page = read("app/page.tsx");
const workCenter = read("app/screens/WorkCenter.tsx");

// ── BẢNG CHỐT `T-01` (nguyên văn quyết định của captain — PHƯƠNG ÁN A) ───────────────────────────
// # | Nhãn | Đích đến | Cổng quyền (modulePermission(data, key).canView)
const EXPECTED = [
  { key: "work_personal", label: "Cá nhân", view: "personal", permissionKeys: ["dept_plan_tasks", "dept_project_tasks"] },
  { key: "work_department", label: "Phòng ban", view: "department", permissionKeys: ["dept_plan_assign", "dept_project_assign"] },
  { key: "work_assign", label: "Giao việc", view: "assign", permissionKeys: ["dept_plan_assign", "dept_project_assign"] },
  { key: "work_dashboard", label: "Dashboard", view: "kpi", permissionKeys: ["dept_plan_kpi", "dept_project_kpi"] },
  { key: "work_reports", label: "Báo cáo", view: "reports", permissionKeys: ["dept_plan_alerts", "dept_project_alerts"] },
];
const LEGACY = ["dept_plan_tasks", "dept_project_tasks", "dept_plan_assign", "dept_project_assign"];

const workMenuBlock = () => {
  const start = menuHelpers.indexOf("const workMenuItems");
  const end = menuHelpers.indexOf("const legacyWorkMenuKeys", start);
  assert.ok(start > 0 && end > start, "Không tìm thấy khai báo `workMenuItems` trong lib/menu-helpers.ts");
  return menuHelpers.slice(start, end);
};
// Cắt tới HẾT DÒNG — không phụ thuộc kiểu xuống dòng (LF ở `menu-helpers.ts`, CRLF ở `page.tsx`).
const lineEnd = (text, from) => {
  const candidates = [text.indexOf("\r\n", from), text.indexOf("\n", from)].filter((index) => index > 0);
  return candidates.length ? Math.min(...candidates) : -1;
};
const legacyBlock = () => {
  const start = menuHelpers.indexOf("const legacyWorkMenuKeys");
  const end = lineEnd(menuHelpers, start);
  assert.ok(start > 0 && end > start, "Không tìm thấy khai báo `legacyWorkMenuKeys` trong lib/menu-helpers.ts");
  return menuHelpers.slice(start, end);
};
const workChildrenBlock = () => {
  const start = page.indexOf("const workMenuChildren");
  const end = page.indexOf("});", start);
  assert.ok(start > 0 && end > start, "Không tìm thấy `workMenuChildren` trong app/page.tsx");
  return page.slice(start, end);
};

test("T-01 — 5 mục menu ĐÚNG nhãn · ĐÚNG nhóm · ĐÚNG đích đến (tab) · cổng quyền RIÊNG từng mục", () => {
  const block = workMenuBlock();
  for (const item of EXPECTED) {
    const literal = `key: "${item.key}", label: "${item.label}", groupKey: "my_work", view: "${item.view}", permissionKeys: ["${item.permissionKeys[0]}", "${item.permissionKeys[1]}"]`;
    assert.ok(block.includes(literal), `Thiếu/sai mục menu: ${literal}`);
  }
  assert.equal((block.match(/key: "work_/g) || []).length, 5, "Nhóm «Công việc» phải khai báo ĐÚNG 5 mục");
});

test("T-01 — cổng quyền THẬT: mỗi mục lọc bằng `modulePermission(data, permissionKey).canView` (KHÔNG hardcode admin)", () => {
  const block = workChildrenBlock();
  assert.match(block, /item\.permissionKeys\.find\(\(key\) => modulePermission\(data, key\)\.canView\)/,
    "Mục menu chưa lọc bằng `modulePermission(data, permissionKey).canView`");
  assert.doesNotMatch(block, /isAdminUser\(/, "Cổng quyền mục menu KHÔNG được hardcode «chỉ admin»");
});

test("T-01 — «Cá nhân» và «Phòng ban» KHÔNG dùng chung cổng quyền", () => {
  const personal = EXPECTED[0].permissionKeys.join("|");
  const department = EXPECTED[1].permissionKeys.join("|");
  assert.notEqual(personal, department, "Hai mục phải có cặp khoá quyền KHÁC nhau");
  assert.equal(new Set(EXPECTED.map((item) => item.permissionKeys.join("|"))).size, 4,
    "Phải có 4 cặp khoá quyền phân biệt (Giao việc dùng chung cổng với Phòng ban là CHỦ Ý)");
});

test("T-01 — 4 mục `dept_*` CŨ bị ẨN khỏi menu, nhưng khoá vẫn sống cho quyền/tiêu đề/điều hướng", () => {
  const legacy = legacyBlock();
  for (const key of LEGACY) assert.ok(legacy.includes(`"${key}"`), `Thiếu khoá cũ cần ẩn khỏi menu: ${key}`);
  assert.ok(!legacy.includes('"approvals"'), "KHÔNG được ẩn `approvals` (Trung tâm phê duyệt)");
  assert.match(page, /!legacyWorkMenuKeys\.includes\(item\.key\)/, "Cây menu chưa ẩn 4 mục `dept_*` cũ");
});

test("T-01 — menu (sidebar + mobile) dựng 5 mục MỚI của nhóm «CÔNG VIỆC», vẫn GIỮ `approvals` làm mục thứ 6", () => {
  const hits = page.match(/groupKey==="my_work"&&workMenuChildren\.map\(/g) || [];
  assert.equal(hits.length, 2, "Phải dựng 5 mục mới ở CẢ menu desktop LẪN menu mobile");
  assert.match(page, /workMenuItems\.flatMap\(\(item\) => \{/, "Chưa suy ra danh sách mục menu từ `workMenuItems`");
  assert.doesNotMatch(legacyBlock(), /"approvals"/);
});

test("T-01 — ĐÍCH ĐẾN: 4 mục → `WorkCenter` đúng tab; «Giao việc» → `DepartmentTaskWorkspace` (GIỮ NGUYÊN)", () => {
  assert.ok(workCenter.includes('const WORK_TABS = ["Cá nhân", "Phòng ban", "Giao việc", "Dashboard", "Báo cáo"];'),
    "WorkCenter chưa có ĐÚNG 5 tab theo đúng thứ tự Cá nhân · Phòng ban · Giao việc · Dashboard · Báo cáo");
  assert.ok(workCenter.includes('const WORK_TAB_OF_VIEW: Record<WorkMenuView, number> = { personal: 0, department: 1, assign: 2, kpi: 3, reports: 4 };'),
    "Thiếu bảng ánh xạ view → tab trong WorkCenter");
  for (const index of [0, 1, 2, 3, 4]) assert.match(workCenter, new RegExp(`\\{tab === ${index} &&`), `Thiếu nhánh render tab ${index}`);

  const start = page.indexOf("function workCenterViewFor(");
  const end = page.indexOf("function WarehouseApp(", start);
  assert.ok(start > 0 && end > start, "Không tìm thấy hàm định tuyến `workCenterViewFor` trong app/page.tsx");
  const fn = page.slice(start, end);
  assert.doesNotMatch(fn, /"assign"/, "«Giao việc» (view assign) TUYỆT ĐỐI không được mở WorkCenter");
  assert.match(page, /workCenterView !== null && <WorkCenter key=\{workCenterView\} view=\{workCenterView\}/, "Chưa truyền view của mục menu vào WorkCenter");
  assert.match(page, /workCenterView === null && active\.startsWith\("dept_plan_"\) && active !== "dept_plan_tasks" && <DepartmentTaskWorkspace data=\{data\} department="KH"/,
    "Màn giao việc chi tiết (KH) đã MẤT lối vào");
  assert.match(page, /workCenterView === null && active\.startsWith\("dept_project_"\) && active !== "dept_project_tasks" && <DepartmentTaskWorkspace data=\{data\} department="DA"/,
    "Màn giao việc chi tiết (DA) đã MẤT lối vào");
});

test("T-01 — WorkCenter TÁI DÙNG `ReportView` + `lib/report-catalog.ts` cho tab «Báo cáo» (KHÔNG viết màn mới)", () => {
  assert.match(workCenter, /import \{ ReportView \} from "@\/app\/screens\/ReportView";/);
  assert.match(workCenter, /import \{ REPORT_CATALOG, findEntry, sourceRows \} from "@\/lib\/report-catalog";/);
  assert.match(workCenter, /<ReportView catalog=\{WORK_REPORT_CATALOG\.map\(\(entry\) => entry\.def\)\} rowsFor=\{\(key\) => sourceRows\(findEntry\(key\)\?\.source \?\? "workItems", data\)\} \/>/);
});

test("T-01 — huy hiệu (badge) nhóm «CÔNG VIỆC» KHÔNG mất số việc chưa xong: cộng theo CẢ CẶP khoá quyền", () => {
  // Trước `T-01`, huy hiệu nhóm = badge(`dept_plan_tasks`) + badge(`dept_project_tasks`) (KH + DA).
  // 5 mục mới mang MỘT khoá đích ⇒ phải cộng đủ CẢ CẶP, nếu không huy hiệu sẽ hụt (mất phần DA).
  assert.match(workChildrenBlock(), /badgeKeys: item\.permissionKeys/, "Mục menu chưa giữ cặp khoá quyền để tính huy hiệu");
  assert.match(page, /const workMenuBadge = \(keys: ModuleKey\[\]\) => keys\.reduce\(\(sum, key\) => sum \+ badgeFor\(key\), 0\);/,
    "Thiếu phép cộng huy hiệu theo cặp khoá quyền");
  assert.equal((page.match(/workMenuBadge\(item\.badgeKeys\)/g) || []).length, 4,
    "Huy hiệu phải tính bằng `workMenuBadge` ở CẢ badge nhóm lẫn mục con (desktop + mobile)");
});

test("T-01 — giữ nguyên hành vi 3 tab cũ (Việc của tôi → Cá nhân · Phòng ban/tổ đội → Phòng ban · KPI & báo cáo → Báo cáo)", () => {
  const i0 = workCenter.indexOf("{tab === 0 &&");
  const i1 = workCenter.indexOf("{tab === 1 &&");
  const i2 = workCenter.indexOf("{tab === 2 &&");
  const i3 = workCenter.indexOf("{tab === 3 &&");
  const i4 = workCenter.indexOf("{tab === 4 &&");
  assert.ok(i0 > 0 && i1 > i0 && i2 > i1 && i3 > i2 && i4 > i3, "5 nhánh tab phải theo đúng thứ tự trong nguồn");
  const tab0 = workCenter.slice(i0, i1);
  const tab1 = workCenter.slice(i1, i2);
  const tab2 = workCenter.slice(i2, i3);
  const tab4 = workCenter.slice(i4);
  assert.match(tab0, /create_self_work_item/, "Tab «Cá nhân» phải giữ form tự tạo việc");
  assert.match(tab0, /Danh sách việc của tôi/);
  assert.match(tab1, /Việc phòng ban của tôi/);
  assert.match(tab1, /Việc của tổ đội tôi tham gia/);
  assert.doesNotMatch(tab1, /create_work_item/, "Form giao việc phải được TÁCH sang tab «Giao việc» (số 2)");
  assert.match(tab2, /create_work_item/, "Tab «Giao việc» là nơi đặt form giao việc");
  assert.match(tab4, /Tỉ lệ hoàn thành theo nhân viên/, "Tab «Báo cáo» phải giữ phần KPI/báo cáo đang có");
  assert.match(tab4, /<ReportView/);
});
