// PHASE 4 (`PR-02`) — HỢP ĐỒNG MÀN DỰ ÁN: "Lọc: Trạng thái · Quản lý dự án · Phòng ban · Ngày".
//
// Vì sao kiểm ở tầng NGUỒN (không phải DOM): ứng dụng đang phục vụ một BẢN BUILD cũ hơn nguồn, mà
// `npm run build` KHÔNG thuộc quyền của nhánh này — cùng lý do đã ghi ở `tests/pr01-project-tabs.test.mjs`.
//
// ĐIỂM MẠNH CỦA TỆP NÀY (khác kiểm chuỗi thuần): 2 hàm lọc THẬT được TRÍCH NGUYÊN VĂN THÂN HÀM từ
// `app/screens/project-filters.ts` rồi CHẠY bằng `new Function` ⇒ chứng minh TỪNG CHIỀU lọc có tác
// dụng thật trên dữ liệu giả lập, không chỉ chứng minh "có chuỗi trong mã".
//
// Chạy:  node --test tests/pr02-project-filters.test.mjs
// (Cố ý KHÔNG nằm trong `package.json` → `test:regression` giữ nguyên 69 ca.)
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const pageSource = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const filterSource = readFileSync(new URL("../app/screens/project-filters.ts", import.meta.url), "utf8");

const pmStart = pageSource.indexOf("function ProjectManagement(");
assert.ok(pmStart > 0, "Không tìm thấy `ProjectManagement` trong app/page.tsx");
const pmEnd = pageSource.indexOf("function ProjectProgress(", pmStart);
assert.ok(pmEnd > pmStart, "Không xác định được hết thân `ProjectManagement`");
const pm = pageSource.slice(pmStart, pmEnd);

const listStart = pm.indexOf('if (view === "list")');
const detailStart = pm.indexOf("// =========================== CHI TIẾT");
assert.ok(listStart > 0 && detailStart > listStart, "Không tách được nhánh DANH SÁCH / CHI TIẾT");
const listBranch = pm.slice(listStart, detailStart);

/** Trích NGUYÊN VĂN thân hàm `export function <name>(…)` và chạy nó bằng JS thuần. */
function extractFunction(source, name, ...argNames) {
  const start = source.indexOf(`export function ${name}(`);
  assert.ok(start > 0, `Không tìm thấy \`export function ${name}\``);
  const bodyStart = source.indexOf("{", start);
  const bodyEnd = source.indexOf("\n}", bodyStart);
  assert.ok(bodyStart > 0 && bodyEnd > bodyStart, `Không xác định được thân hàm \`${name}\``);
  const body = source.slice(bodyStart + 1, bodyEnd);
  assert.doesNotMatch(body, /:\s*(string|boolean|number|Row|ProjectFilter\w+)\b/, `Thân hàm \`${name}\` chứa cú pháp TypeScript ⇒ không chạy được bằng JS thuần`);
  return new Function(...argNames, body);
}

const projectMatchesFilters = extractFunction(filterSource, "projectMatchesFilters", "row", "filter", "context");
const projectFilterContext = extractFunction(filterSource, "projectFilterContext", "projectId", "userScopes", "staff");

// --- dữ liệu giả lập, ĐÚNG hình dạng payload thật (đã đo `GET /api/system`) --------------------
const projects = [
  { id: "P1", code: "DA-1", name: "Dự án 1", status: "active", startDate: "2026-01-01", plannedEndDate: "2026-12-31" },
  { id: "P2", code: "DA-2", name: "Dự án 2", status: "paused", startDate: "2025-06-01", plannedEndDate: "2025-12-31" },
];
const userScopes = [
  { userId: "U1", projectId: "P1", permission: "admin", leftAt: null },
  { userId: "U2", projectId: "P1", permission: "write", leftAt: null },
  { userId: "U4", projectId: "P2", permission: "admin", leftAt: null },
  { userId: "U3", projectId: "P2", permission: "write", leftAt: null },
];
const staff = [
  { id: "U1", fullName: "Trưởng phòng Dự án C", organizationUnitId: "ORG-DA", organizationCode: "DA", department: "Phòng Dự án" },
  { id: "U2", fullName: "Kỹ sư dự án", organizationUnitId: "ORG-DA", organizationCode: "DA", department: "Phòng Dự án" },
  { id: "U3", fullName: "Nhân viên Kế hoạch F", organizationUnitId: "ORG-KH", organizationCode: "KH", department: "Phòng Kế hoạch" },
  { id: "U4", fullName: "Trưởng phòng Kế hoạch B", organizationUnitId: "ORG-KH", organizationCode: "KH", department: "Phòng Kế hoạch" },
];
const DEFAULTS = { status: "ALL", managerUserId: "ALL", organizationUnitId: "ALL", startFrom: "", endTo: "" };
const ctxOf = (pid) => projectFilterContext(pid, userScopes, staff);
const keep = (filter) => projects.filter((row) => projectMatchesFilters(row, { ...DEFAULTS, ...filter }, ctxOf(row.id))).map((row) => row.id);

test("PR-02 — toolbar DANH SÁCH có ĐỦ 4 CHIỀU lọc (Trạng thái · Quản lý dự án · Phòng ban · Ngày)", () => {
  assert.match(listBranch, /filters=\{\[/, "Danh sách dự án chưa có nhóm LỌC của ListToolbar");
  for (const label of ["Trạng thái", "Quản lý dự án", "Phòng ban"]) {
    assert.match(listBranch, new RegExp(`label: "${label}"`), `Thiếu chiều lọc "${label}" trong filters của ListToolbar`);
  }
  assert.match(listBranch, /type="date"/, "Thiếu chiều lọc NGÀY (ô nhập ngày)");
  assert.match(listBranch, /startFrom/, "Chiều NGÀY chưa nối vào state `startFrom` (mốc `start_date`)");
  assert.match(listBranch, /endTo/, "Chiều NGÀY chưa nối vào state `endTo` (mốc `planned_end_date`)");
});

test("PR-02 — màn danh sách lọc bằng HÀM THẬT của dự án (không tự viết lại chuỗi if)", () => {
  assert.match(pageSource, /from "@\/app\/screens\/project-filters"/, "page.tsx chưa import module lọc dự án");
  assert.match(pm, /projectMatchesFilters\(/, "Màn dự án chưa gọi `projectMatchesFilters`");
  assert.match(pm, /projectFilterContext\(/, "Màn dự án chưa dựng ngữ cảnh lọc `projectFilterContext`");
});

test("PR-02 — CHIỀU 1 · TRẠNG THÁI: `status` lọc thật", () => {
  assert.deepEqual(keep({ status: "active" }), ["P1"]);
  assert.deepEqual(keep({ status: "paused" }), ["P2"]);
  assert.deepEqual(keep({ status: "ALL" }), ["P1", "P2"]);
});

test("PR-02 — CHIỀU 2 · QUẢN LÝ DỰ ÁN: lọc thật theo `user_project_scopes.permission='admin'`", () => {
  assert.equal(ctxOf("P1").managerUserId, "U1", "Ngữ cảnh P1 phải nhận đúng người quản lý (phạm vi admin)");
  assert.equal(ctxOf("P2").managerUserId, "U4", "Ngữ cảnh P2 phải nhận đúng người quản lý (phạm vi admin)");
  assert.deepEqual(keep({ managerUserId: "U1" }), ["P1"]);
  assert.deepEqual(keep({ managerUserId: "U4" }), ["P2"]);
});

test("PR-02 — CHIỀU 3 · PHÒNG BAN: lọc thật theo đơn vị của nhân sự tham gia dự án", () => {
  assert.ok(ctxOf("P1").organizationUnitKeys.includes("ORG-DA"), "Ngữ cảnh P1 phải có phòng ban của nhân sự tham gia");
  assert.ok(!ctxOf("P1").organizationUnitKeys.includes("ORG-KH"), "P1 KHÔNG được dính phòng ban của dự án khác");
  assert.deepEqual(keep({ organizationUnitId: "ORG-DA" }), ["P1"]);
  assert.deepEqual(keep({ organizationUnitId: "ORG-KH" }), ["P2"]);
  assert.deepEqual(keep({ organizationUnitId: "ORG-HCPC" }), []);
});

test("PR-02 — CHIỀU 4 · NGÀY: lọc thật theo `start_date` và `planned_end_date`", () => {
  assert.deepEqual(keep({ startFrom: "2026-01-01" }), ["P1"]);
  assert.deepEqual(keep({ endTo: "2025-12-31" }), ["P2"]);
  assert.deepEqual(keep({ startFrom: "2025-01-01", endTo: "2026-12-31" }), ["P1", "P2"]);
});

test("PR-02 — ĐỐI CHỨNG ÂM: bỏ hẳn một chiều khỏi bộ lọc thì ca của chiều đó PHẢI ĐỎ", () => {
  // Chứng minh bộ lọc không "luôn đúng": một hàm rỗng (không có 4 chiều) phải cho kết quả KHÁC.
  const noFilter = new Function("row", "filter", "context", "return true;");
  assert.notDeepEqual(projects.filter((row) => noFilter(row, { ...DEFAULTS, status: "active" }, ctxOf(row.id))).map((r) => r.id), ["P1"], "Bộ lọc rỗng vẫn cho kết quả như bộ lọc thật ⇒ phép kiểm vô nghĩa");
});
