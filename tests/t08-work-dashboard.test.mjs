// PHASE 3 (`T-08`) — HỢP ĐỒNG DASHBOARD CÔNG VIỆC: 3 KHỐI **cá nhân · phòng ban · dự án** (§11).
// Nguyên văn `docs/25_TODO_ROADMAP.md` dòng `T-08`: «Dashboard cá nhân + phòng ban + dự án (§11)».
//
// Cách kiểm (cùng kỷ luật với `tests/t07-kanban-board.test.mjs` / `tests/t09-task-team-member.test.mjs`):
//   (1) TRÍCH khối thuần trong `app/screens/WorkDashboard.tsx`, dịch TS→JS bằng esbuild rồi CHẠY với fixtures ⇒
//       mọi con số phải bằng ĐÚNG phép đếm tay trên dữ liệu thật (không bịa, không làm tròn tuỳ ý);
//   (2) ĐỐI CHỨNG ÂM: thiếu nguồn (0 dòng / cột rỗng / chỉ số không tồn tại trong schema) ⇒ «chưa có nguồn»;
//   (3) UI phải VẼ đủ 3 khối, giá trị lấy từ khối tính toán (KHÔNG hardcode số) và in rõ NGUỒN;
//   (4) WorkCenter (tab «Dashboard» — tab số 3 đã chốt ở `T-01`) phải THẬT SỰ gắn khối này.
//
// LƯU Ý: tệp này CỐ Ý không nằm trong `package.json` → `test:regression` giữ nguyên số ca.
// Chạy riêng:  node --test tests/t08-work-dashboard.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import esbuild from "esbuild";

const read = (relative) => readFileSync(new URL("../" + relative, import.meta.url), "utf8");
const dashboard = read("app/screens/WorkDashboard.tsx");
const workCenter = read("app/screens/WorkCenter.tsx");
const route = read("scripts/system-route.mjs");

const BEGIN = "T08-PURE-BEGIN";
const END = "T08-PURE-END";
assert.equal(dashboard.split(BEGIN).length - 1, 1, "Mốc T08-PURE-BEGIN phải xuất hiện đúng 1 lần");
assert.equal(dashboard.split(END).length - 1, 1, "Mốc T08-PURE-END phải xuất hiện đúng 1 lần");
const blockStart = dashboard.indexOf(BEGIN);
const blockEnd = dashboard.indexOf(END, blockStart + BEGIN.length);
assert.ok(blockStart > 0 && blockEnd > blockStart, "WorkDashboard.tsx thiếu khối thuần T08-PURE-BEGIN/END");
const block = dashboard.slice(dashboard.indexOf("\n", blockStart) + 1, blockEnd);
// Phần UI (sau khối thuần) — dùng để kiểm "không hardcode số".
const component = dashboard.slice(blockEnd);

function loadPure() {
  const js = esbuild.transformSync(block, { loader: "ts" }).code;
  const names = ["DASHBOARD_BLOCKS", "DASHBOARD_NO_SOURCE", "DASHBOARD_PROJECT_PROGRESS_NOTE", "dashboardSourceOf", "dashboardStats", "workDashboard"];
  return new Function(`${js}\nreturn { ${names.join(", ")} };`)();
}

// ── FIXTURES: tên trường ĐÚNG theo bootstrap (`workItems` · `projects` · `userScopes`) ─────────────
const PROJECTS = [{ id: "P1", code: "PRJ-1", name: "Dự án 1" }, { id: "P2", code: "PRJ-2", name: "Dự án 2" }];
const DATA = { projects: PROJECTS, userScopes: [{ userId: "U1", projectId: "P1" }, { userId: "U2", projectId: "P1" }, { userId: "U3", projectId: "P2" }] };
const R1 = { id: "R1", taskNo: "CV-1", projectId: "P1", projectCode: "PRJ-1", departmentCode: "KH", assignedTo: "U1", status: "COMPLETED", progress: 100, overdue: false };
const R2 = { id: "R2", taskNo: "CV-2", projectId: "P1", projectCode: "PRJ-1", departmentCode: "KH", assignedTo: "U2", status: "IN_PROGRESS", progress: 50, overdue: true };
const R3 = { id: "R3", taskNo: "CV-3", projectId: "P2", projectCode: "PRJ-2", departmentCode: "DA", assignedTo: "U3", status: "IN_PROGRESS", progress: 0, overdue: false };
const R4 = { id: "R4", taskNo: "CV-4", projectId: "", projectCode: "", departmentCode: "KH", assignedTo: "U1", status: "NEW", progress: 0, overdue: false };
const SCOPE = [R1, R2, R3, R4];
const MINE = [R1, R4];
const isLate = (row) => Boolean(row.overdue) && String(row.status || "") !== "COMPLETED";

test("T-08 — ĐỦ 3 KHỐI: cá nhân · phòng ban · dự án (nguyên văn §11)", () => {
  const { DASHBOARD_BLOCKS } = loadPure();
  assert.deepEqual(DASHBOARD_BLOCKS.map((b) => b.label), ["Cá nhân", "Phòng ban", "Dự án"], "§11 yêu cầu đúng 3 khối: cá nhân · phòng ban · dự án");
  assert.deepEqual(DASHBOARD_BLOCKS.map((b) => b.key), ["personal", "department", "project"]);
  for (const key of ["personal", "department", "project"]) {
    assert.ok(dashboard.includes(`data-dashboard-block="${key}"`), `UI thiếu khối «${key}»`);
  }
  assert.equal((dashboard.match(/data-dashboard-block="/g) || []).length, 3, "UI phải có ĐÚNG 3 khối dashboard");
});

test("T-08 — NGUỒN DỮ LIỆU có thật trong payload (không gọi API mới, không đoán trường)", () => {
  // Bootstrap phải thật sự trả các cột mà dashboard đếm.
  for (const field of ["wi.assigned_to AS assignedTo", "wi.department_code AS departmentCode", "wi.project_id AS projectId", "wi.status", "wi.progress"]) {
    assert.ok(route.includes(field), `bootstrap KHÔNG trả «${field}» ⇒ dashboard không thể tính từ dữ liệu thật`);
  }
  assert.match(route, /SELECT ups\.user_id AS userId,ups\.project_id AS projectId/, "bootstrap `userScopes` thiếu userId/projectId");
  // KHÔNG được đọc những khoá không tồn tại trong payload.
  assert.doesNotMatch(dashboard, /data\.workItemSummary|data\.dashboard|data\.kpi/, "Dashboard đọc khoá KHÔNG có trong payload");
  assert.doesNotMatch(block.replace(/\/\/[^\n]*/g, ""), /fetch\(|action\(|await /, "Khối dashboard KHÔNG được gọi API mới");
});

test("T-08 — MỌI số tính từ dữ liệu thật: đối chiếu ĐÚNG phép đếm tay trên fixtures", () => {
  const { workDashboard } = loadPure();
  const m = workDashboard(DATA, MINE, SCOPE, isLate);
  // KHỐI CÁ NHÂN — chỉ 2 việc mang tên tôi (R1, R4), 1 hoàn thành ⇒ 50%.
  assert.deepEqual([m.personal.total, m.personal.done, m.personal.open, m.personal.late, m.personal.rate], [2, 1, 1, 0, 50]);
  assert.equal(m.personal.progress, 50, "Tiến độ trung bình = (100 + 0) / 2");
  // KHỐI PHÒNG BAN — KH: R1,R2,R4 (3 việc, 1 xong, 1 quá hạn); DA: R3 (1 việc).
  assert.deepEqual(m.departments.map((d) => [d.code, d.total, d.done, d.late, d.rate]), [["KH", 3, 1, 1, 33], ["DA", 1, 0, 0, 0]]);
  // KHỐI DỰ ÁN — P1: R1,R2 (2 việc, 1 xong) + 2 nhân sự (U1,U2); P2: R3 + 1 nhân sự.
  assert.deepEqual(m.projects.map((p) => [p.code, p.name, p.total, p.done, p.rate, p.staff]), [["PRJ-1", "Dự án 1", 2, 1, 50, 2], ["PRJ-2", "Dự án 2", 1, 0, 0, 1]]);
  assert.equal(m.total, 4, "Tổng việc = đúng số dòng phạm vi");
  assert.equal(m.noProject, 1, "R4 không gắn dự án ⇒ báo riêng, KHÔNG gộp vào dự án nào");
  // Tổng các khối phòng ban phải bằng ĐÚNG tập dòng (không mất, không nhân đôi).
  assert.equal(m.departments.reduce((sum, d) => sum + d.total, 0), SCOPE.length, "Tổng các phòng phải bằng đúng số dòng trong phạm vi");
  assert.ok(m.noProject <= m.total, "«Chưa gắn dự án» là TẬP CON của tổng việc, không phải số cộng thêm");
  // Nhóm lạ: phòng/dự án không tồn tại ⇒ 0 dòng, KHÔNG sinh hàng giả.
  assert.equal(workDashboard(DATA, MINE, [{ id: "X", departmentCode: "XX", projectId: "P9", status: "NEW", progress: 0 }], isLate).projects[0].code, "P9", "Dự án không có trong `projects` vẫn phải hiện bằng id THẬT (không bịa tên)");
});

test("T-08 — ĐỐI CHỨNG ÂM: thiếu nguồn ⇒ «chưa có nguồn», TUYỆT ĐỐI không hiện 0 thay cho «không biết»", () => {
  const { workDashboard, dashboardSourceOf, DASHBOARD_NO_SOURCE, DASHBOARD_PROJECT_PROGRESS_NOTE } = loadPure();
  assert.equal(DASHBOARD_NO_SOURCE, "chưa có nguồn");
  // (a) 0 dòng trong phạm vi.
  const empty = workDashboard(DATA, [], [], isLate);
  assert.ok(empty.personalSource.includes(DASHBOARD_NO_SOURCE), "0 dòng phải ghi «chưa có nguồn», không hiện 0");
  assert.ok(empty.projectSource.includes(DASHBOARD_NO_SOURCE));
  assert.ok(empty.departmentSource.includes(DASHBOARD_NO_SOURCE));
  // (b) CÓ dòng nhưng CỘT rỗng ⇒ cũng là «chưa có nguồn» (khác hẳn 0 dòng).
  const noColumns = workDashboard({ projects: [], userScopes: [] }, [], [{ id: "A", status: "NEW" }], isLate);
  assert.ok(noColumns.departmentSource.includes(DASHBOARD_NO_SOURCE), `Nguồn phòng ban phải là «${DASHBOARD_NO_SOURCE}» khi cột departmentCode rỗng`);
  assert.ok(noColumns.projectSource.includes(DASHBOARD_NO_SOURCE));
  assert.ok(noColumns.projectDirectorySource.includes(DASHBOARD_NO_SOURCE), "`projects` rỗng ⇒ tên dự án phải ghi «chưa có nguồn»");
  assert.ok(noColumns.projectStaffSource.includes(DASHBOARD_NO_SOURCE), "`userScopes` rỗng ⇒ số nhân sự dự án phải ghi «chưa có nguồn»");
  // (c) Chỉ số KHÔNG có cột trong schema (tiến độ dự án) ⇒ nói thẳng, không suy diễn bằng cột khác.
  assert.ok(DASHBOARD_PROJECT_PROGRESS_NOTE.includes(DASHBOARD_NO_SOURCE));
  assert.ok(!/projects\s*\.\s*progress/.test(route), "Nếu `projects` CÓ cột tiến độ thì ghi chú «chưa có nguồn» là sai");
  // (d) Hàm nguồn: có dữ liệu ⇒ nêu số dòng THẬT; rỗng ⇒ «chưa có nguồn».
  assert.equal(dashboardSourceOf([{ a: 1 }, { a: "" }], "a", "cột a"), "cột a · 1/2 dòng có giá trị");
  assert.ok(dashboardSourceOf([{ a: "" }], "a", "cột a").includes(DASHBOARD_NO_SOURCE));
});

test("T-08 — UI KHÔNG hardcode số: mọi giá trị lấy từ khối tính toán + in rõ NGUỒN", () => {
  // Không có KPI nào nhận hằng số chuỗi số (value="12") — mọi `value=` phải là biểu thức từ `metrics`.
  assert.doesNotMatch(component, /value="\d/, "KPI trong dashboard đang hardcode số thay vì tính từ dữ liệu");
  for (const expr of ["String(metrics.personal.total)", "String(metrics.personal.done)", "String(metrics.personal.late)", "String(metrics.projects.length)"]) {
    assert.ok(component.includes(`value={${expr}}`), `KPI chưa lấy giá trị từ khối tính toán: ${expr}`);
  }
  // Nguồn phải hiển thị cho CẢ 3 khối.
  assert.equal((component.match(/data-dashboard-source="/g) || []).length, 3, "Mỗi khối phải in rõ NGUỒN dữ liệu");
  for (const key of ["personal", "department", "project"]) assert.ok(component.includes(`data-dashboard-source="${key}"`), `Thiếu dòng nguồn cho khối «${key}»`);
  // Chỉ số không có nguồn phải HIỆN chữ «chưa có nguồn» (không phải số 0).
  assert.match(component, /value=\{DASHBOARD_NO_SOURCE\}/, "KPI «Tiến độ dự án» phải hiện «chưa có nguồn»");
  assert.match(component, /\{DASHBOARD_NO_SOURCE\}<\/span>/, "Cột nhân sự 0 phải hiện «chưa có nguồn»");
  // Có KPI + BẢNG/biểu đồ đơn giản (đúng yêu cầu §11) — dùng lại class có sẵn, không thêm CSS mới.
  assert.match(component, /className="kpi-grid small"/, "Thiếu KPI");
  assert.match(component, /className="baseline-table"/, "Thiếu bảng số liệu");
  assert.match(component, /className="task-bar"/, "Thiếu biểu đồ thanh đơn giản");
});

test("T-08 — GẮN vào tab «Dashboard» của WorkCenter (tab số 3), KHÔNG đổi 5 tab đã chốt ở T-01", () => {
  assert.match(workCenter, /import \{ WorkDashboard \} from "@\/app\/screens\/WorkDashboard";/, "WorkCenter chưa import khối dashboard");
  assert.match(workCenter, /<WorkDashboard\b/, "WorkCenter chưa render khối dashboard");
  assert.match(workCenter, /personalRows=\{mine\}/, "Khối «Cá nhân» phải nhận ĐÚNG tập việc của tôi");
  assert.match(workCenter, /scopeRows=\{scopedWork\}/, "Khối phòng ban/dự án phải nhận tập việc trong PHẠM VI ĐƯỢC PHÉP (T-06)");
  assert.match(workCenter, /isLate=\{isTaskLate\}/, "Khối dashboard phải dùng CÙNG luật quá hạn của màn Công việc");
  // Phải nằm TRONG tab 3 (Dashboard) — không tạo tab/màn mới.
  const i3 = workCenter.indexOf("{tab === 3 &&");
  const i4 = workCenter.indexOf("{tab === 4 &&");
  assert.ok(i3 > 0 && i4 > i3, "Mất nhánh tab 3/tab 4");
  assert.ok(workCenter.slice(i3, i4).includes("<WorkDashboard"), "Khối dashboard phải nằm trong tab «Dashboard» (tab 3)");
  assert.equal((workCenter.match(/const WORK_TABS = \["Cá nhân", "Phòng ban", "Giao việc", "Dashboard", "Báo cáo"\];/g) || []).length, 1, "Không được đổi dải 5 tab đã chốt ở T-01");
});
