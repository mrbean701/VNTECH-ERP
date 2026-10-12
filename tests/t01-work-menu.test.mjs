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
// ⚠️ CẬP NHẬT 23/09/2026 (MT2 §3.1 + P5-01): `work_dashboard.view` PHẢI là **`dashboard`** —
// trước đây bảng này ghi `view: "kpi"` (SAI: trỏ vào tab KPI). Nay theo MT2 §3.1 «click menu Công việc
// ⇒ hiển thị Dashboard NGAY» và `lib/menu-helpers.ts:110-122` (chính mã ghi rõ `view: "kpi"` là SAI).
// ⭐ CẬP NHẬT 08/10/2026 (USER — VIỆC 1, chốt qua thẻ quyết định): **GOM 5 MỤC RỜI ⇒ 1 MỤC HUB `work_hub`**
//   · nhãn «Công việc» · nhóm `my_work` · `view: "dashboard"` (bấm ⇒ mở tab Dashboard — đã đưa LÊN ĐẦU)
//   · `permissionKeys` = **HỢP 8 khoá** của 5 mục cũ (⚠️ thiếu khoá nào ⇒ người chỉ có khoá đó MẤT mục menu).
const EXPECTED = [
  { key: "work_hub", label: "Công việc", view: "dashboard",
    permissionKeys: ["dept_plan_kpi", "dept_project_kpi", "dept_plan_tasks", "dept_project_tasks",
      "dept_plan_assign", "dept_project_assign", "dept_plan_alerts", "dept_project_alerts"] },
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

test("T-01 — MỘT MỤC HUB «Công việc» (VIỆC 1): đúng nhãn · đúng nhóm · đích đến tab «Dashboard» · hợp đủ khoá quyền", () => {
  const block = workMenuBlock();
  assert.match(block, /key: "work_hub", label: "Công việc", groupKey: "my_work", view: "dashboard"/,
    "Mục hub phải là: key `work_hub` · label «Công việc» · nhóm `my_work` · `view: \"dashboard\"`");
  assert.equal((block.match(/key: "work_/g) || []).length, 1, "Nhóm «Công việc» phải chỉ còn ĐÚNG 1 MỤC HUB");
  // ⚠️ HỢP KHOÁ QUYỀN: thiếu khoá nào ⇒ người CHỈ có khoá đó MẤT mục menu
  //    (`app/page.tsx` → `item.permissionKeys.find((key) => modulePermission(data, key).canView)`).
  for (const item of EXPECTED) for (const key of item.permissionKeys) {
    assert.ok(block.includes(`"${key}"`), `Mục hub THIẾU khoá quyền ${key} ⇒ người chỉ có khoá này MẤT mục «Công việc»`);
  }
});

test("T-01 — cổng quyền THẬT: mỗi mục lọc bằng `modulePermission(data, permissionKey).canView` (KHÔNG hardcode admin)", () => {
  const block = workChildrenBlock();
  assert.match(block, /item\.permissionKeys\.find\(\(key\) => modulePermission\(data, key\)\.canView\)/,
    "Mục menu chưa lọc bằng `modulePermission(data, permissionKey).canView`");
  assert.doesNotMatch(block, /isAdminUser\(/, "Cổng quyền mục menu KHÔNG được hardcode «chỉ admin»");
});

test("T-01 — MỤC HUB hợp ĐỦ 8 khoá quyền của 5 mục cũ (⛔ không bỏ sót nhóm quyền nào)", () => {
  const keys = EXPECTED[0].permissionKeys;
  // 5 mục cũ dùng 4 CẶP khoá phân biệt (tasks · assign ×2 · kpi · alerts) ⇒ hợp lại = 8 khoá.
  for (const pair of [["dept_plan_tasks", "dept_project_tasks"], ["dept_plan_assign", "dept_project_assign"],
    ["dept_plan_kpi", "dept_project_kpi"], ["dept_plan_alerts", "dept_project_alerts"]]) {
    for (const key of pair) assert.ok(keys.includes(key), `Thiếu khoá ${key} trong hợp quyền của mục hub`);
  }
  assert.equal(new Set(keys).size, keys.length, "⛔ không được trùng khoá trong hợp quyền của mục hub");
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
  // ⭐ CẬP NHẬT 08/10/2026 (USER chốt qua thẻ quyết định) — DẢI **7 TAB**, «Dashboard» ĐẦU TIÊN:
  //   0 Dashboard · 1 Danh sách công việc · 2 Được giao · 3 Phòng ban/ Tổ đội · 4 Giao việc · 5 Dự án · 6 Báo cáo
  //   (VIỆC 1 Dashboard lên đầu · VIỆC 2 «Cá nhân»→«Danh sách công việc» · VIỆC 6 thêm tab «Được giao»
  //    · VIỆC 7 «Phòng ban»→«Phòng ban/ Tổ đội»). ⛔ Vẫn KHÔNG xoá chức năng nào.
  assert.ok(workCenter.includes('const WORK_TABS = ["Dashboard", "Danh sách công việc", "Được giao", "Phòng ban/ Tổ đội", "Giao việc", "Dự án", "Báo cáo"];'),
    "WorkCenter chưa có 7 tab theo thứ tự đã chốt 08/10/2026 (Dashboard ĐẦU)");
  // ⭐ Ánh xạ view → tab mới: `personal`=«Danh sách công việc»(1) · `department`=3 · `assign`=4 · `dashboard`/`kpi`=0 · `reports`=6.
  assert.ok(workCenter.includes('const WORK_TAB_OF_VIEW: Record<WorkMenuView, number> = { personal: 1, department: 3, assign: 4, kpi: 0, dashboard: 0, reports: 6 };'),
    "Thiếu bảng ánh xạ view → tab trong WorkCenter (đúng dải 7 tab, Dashboard = 0)");
  for (const index of [0, 1, 2, 3, 4, 5, 6]) assert.match(workCenter, new RegExp(`\\{tab === ${index} &&`), `Thiếu nhánh render tab ${index}`);

  const start = page.indexOf("function workCenterViewFor(");
  const end = page.indexOf("function WarehouseApp(", start);
  assert.ok(start > 0 && end > start, "Không tìm thấy hàm định tuyến `workCenterViewFor` trong app/page.tsx");
  const fn = page.slice(start, end);
  assert.doesNotMatch(fn, /"assign"/, "«Giao việc» (view assign) TUYỆT ĐỐI không được mở WorkCenter");
  assert.match(page, /workCenterView !== null && <WorkCenter key=\{workCenterView\} view=\{workCenterView\}/, "Chưa truyền view của mục menu vào WorkCenter");
  // ⚠️ CẬP NHẬT 23/09/2026: nhánh render CŨ vẫn SỐNG (đã kiểm bằng grep `<DepartmentTaskWorkspace` = 2 chỗ),
  // nhưng nay có THÊM điều kiện loại trừ `dept_plan_suppliers` + truyền thêm props (`moduleKey/project/onProject/
  // action/navigate`) — hợp đồng cũ chỉ khớp CHUỖI HẸP nên đỏ oan. Khẳng định lại ĐÚNG Ý ĐỊNH: KH/DA còn lối vào.
  assert.match(page, /workCenterView === null && active\.startsWith\("dept_plan_"\) && active !== "dept_plan_tasks" && active !== "dept_plan_suppliers" && <DepartmentTaskWorkspace data=\{data\} department="KH"/,
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

// ⭐ CẬP NHẬT 08/10/2026 (USER chốt qua thẻ quyết định) — DẢI **7 TAB**:
//   0 Dashboard · 1 Danh sách công việc · 2 Được giao · 3 Phòng ban/ Tổ đội · 4 Giao việc · 5 Dự án · 6 Báo cáo
//   (VIỆC 1 Dashboard lên đầu · VIỆC 2 «Danh sách công việc» · VIỆC 6 tab «Được giao» RIÊNG · VIỆC 7 «Phòng ban/ Tổ đội»)
//   ⚠️ Thay cho khẳng định cũ «6 nhánh tab theo đúng thứ tự trong nguồn» — bài học: THỨ TỰ TAB ⇎ THỨ TỰ TRONG NGUỒN.
test("T-01 — dải 7 TAB đúng thứ tự đã chốt + mỗi tab render ĐÚNG nội dung", () => {
  assert.match(workCenter,
    /const WORK_TABS = \["Dashboard", "Danh sách công việc", "Được giao", "Phòng ban\/ Tổ đội", "Giao việc", "Dự án", "Báo cáo"\];/,
    "Dải tab phải đúng 7 tab theo thứ tự đã chốt (Dashboard ĐẦU)");
  // Bất biến ĐÚNG phải kiểm: có ĐỦ 7 nhánh `{tab === n &&}` và mỗi chỉ số 0..6 xuất hiện ĐÚNG MỘT LẦN
  // (thứ tự các nhánh trong NGUỒN là chuyện trình bày, ⛔ không phải hợp đồng hành vi).
  const branches = [...workCenter.matchAll(/\{tab === (\d) &&/g)].map((m) => Number(m[1]));
  assert.deepEqual([...branches].sort((a, b) => a - b), [0, 1, 2, 3, 4, 5, 6],
    "Phải có ĐỦ 7 nhánh tab (0..6), mỗi chỉ số xuất hiện đúng một lần");
  const slice = (n) => {
    const start = workCenter.indexOf(`{tab === ${n} &&`);
    const nexts = [0, 1, 2, 3, 4, 5, 6].map((k) => workCenter.indexOf(`{tab === ${k} &&`, start + 1)).filter((v) => v > start);
    return workCenter.slice(start, nexts.length ? Math.min(...nexts) : undefined);
  };
  assert.match(slice(0), /Dashboard công việc/, "Tab 0 «Dashboard» phải có khối Dashboard (VIỆC 1: tab đầu)");
  assert.match(slice(0), /Việc của tôi \(Dashboard\)/, "Tab 0 phải hiển thị VIỆC CỦA CHÍNH USER (VIỆC 3)");
  assert.match(slice(1), /Danh sách công việc/, "Tab 1 phải là «Danh sách công việc» (VIỆC 2)");
  assert.match(slice(1), /data-vntech="work-create-open"/, "Tab 1 phải có nút mở MODAL «Tạo công việc» (VIỆC 4)");
  assert.match(slice(1), /data-vntech="work-create-modal"/, "MODAL «Tạo công việc» phải nằm trong tab 1");
  assert.match(slice(2), /data-vntech="work-assigned-tab"/, "Tab 2 «Được giao» phải là tab RIÊNG (VIỆC 6)");
  assert.match(slice(3), /Việc phòng ban của tôi/, "Tab 3 «Phòng ban/ Tổ đội» phải giữ bảng việc phòng ban");
  assert.match(slice(3), /Việc của tổ đội tôi tham gia/);
  assert.match(slice(4), /create_work_item/, "Tab 4 «Giao việc» là nơi đặt form giao việc");
  assert.match(slice(5), /data-vntech="work-project-tab"/, "Tab 5 «Dự án» (MT3 §A.2) phải render khối riêng");
  assert.match(slice(5), /CÔNG VIỆC THEO DỰ ÁN/, "Tab 5 «Dự án» phải có bảng công việc theo dự án");
  assert.match(slice(6), /Tỉ lệ hoàn thành theo nhân viên/, "Tab 6 «Báo cáo» phải giữ phần KPI/báo cáo");
  assert.match(slice(6), /<ReportView/);
  assert.match(workCenter, /create_self_work_item/, "Hành động `create_self_work_item` vẫn phải được gọi (nay ở `submitSelfWork`)");
  // ⛔ form giao việc KHÔNG được lẫn sang tab «Được giao» / «Phòng ban/ Tổ đội»
  assert.doesNotMatch(slice(2), /create_work_item/, "Tab «Được giao» ⛔ không chứa form giao việc");
  assert.doesNotMatch(slice(3), /create_work_item/, "Tab «Phòng ban/ Tổ đội» ⛔ không chứa form giao việc");
});
