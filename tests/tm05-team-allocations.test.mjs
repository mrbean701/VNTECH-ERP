// PHASE 6 (`TM-05`) — HỢP ĐỒNG: TAB «CẤP PHÁT» TÁI DÙNG LOGIC CẤP PHÁT KHO.
// Nguyên văn `docs/25_TODO_ROADMAP.md` dòng `TM-05`:
//   «Tab Cấp phát — dùng lại logic cấp phát kho nếu tương thích»
//
// Kết luận hợp đồng: **TƯƠNG THÍCH — TÁI DÙNG THẬT**. Chứng cứ "tái dùng cái gì" nằm ở 3 tầng:
//   • ACTION: `issue_stock` (`scripts/system-route.mjs:1653`) là CHÍNH action cấp phát kho cho tổ đội
//     (nút Xuất kho gọi nó); nó INSERT `stock_issues` + `stock_issue_items` với cột `team_id`.
//     `confirm_installation` (`:1663`) tăng `stock_issue_items.installed_qty` ⇒ cùng một sổ.
//   • BẢNG: tab Cấp phát đọc LẠI đúng `stock_issues`/`stock_issue_items` (`issues[]`) và `material_returns`
//     (`returns[]`) — KHÔNG dựng bảng/sổ thứ hai.
//   • QUYỀN: `ActionRbacRegistry.java:89` gắn `issue_stock` cho cổng module `teams` + `warehouse_issue`;
//     `scripts/system-route.mjs:12` cũng khai `issue_stock: ["teams","warehouse_issue"]`.
//
// LƯU Ý: tệp này CỐ Ý không nằm trong `package.json` → `test:regression` giữ nguyên số ca.
// Chạy riêng:  node --test tests/tm05-team-allocations.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import esbuild from "esbuild";

const screen = readFileSync(new URL("../app/screens/TeamDirectory.tsx", import.meta.url), "utf8");
const route = readFileSync(new URL("../scripts/system-route.mjs", import.meta.url), "utf8");
const rbac = readFileSync(new URL("../java-backend/application/src/main/java/com/vntech/erp/application/rbac/ActionRbacRegistry.java", import.meta.url), "utf8");

function loadPure() {
  const blockStart = screen.search(/^\/\/ TM-PURE-BEGIN$/m);
  const blockEnd = screen.search(/^\/\/ TM-PURE-END$/m);
  assert.ok(blockStart >= 0 && blockEnd > blockStart, "Thiếu khối thuần TM-PURE-BEGIN/END");
  const block = screen.slice(blockStart + "// TM-PURE-BEGIN".length, blockEnd);
  const js = esbuild.transformSync(block, { loader: "ts" }).code;
  const names = ["teamAllocations", "TEAM_ALLOCATION_SOURCES", "NO_SOURCE_TEXT", "teamDetailTabs"];
  return new Function(`${js}\nreturn { ${names.join(", ")} };`)();
}

const TEAM = { id: "T1", code: "TD-01", name: "Tổ đội điện", projectId: "P1", warehouseId: "W1", active: 1 };
const DATA = {
  teams: [TEAM],
  projects: [{ id: "P1", code: "PRJ-1", name: "Dự án 1" }],
  warehouses: [{ id: "W1", code: "W-T1", name: "Kho tổ đội 1", type: "team", projectId: "P1" }],
  inventory: [{ warehouseId: "W1", materialId: "M1", balance: 7, available: 5, reserved: 2 }],
  issues: [
    { id: "I1", issueNo: "PX-01", teamId: "T1", projectId: "P1", issuedAt: "2026-09-01", status: "posted", receivedByName: "Trần B", totalQty: 10, installedQty: 4 },
    { id: "I2", issueNo: "PX-02", teamId: "T2", projectId: "P1", issuedAt: "2026-09-03", status: "posted", receivedByName: "Lê C", totalQty: 3, installedQty: 0 },
  ],
  returns: [{ id: "R1", returnNo: "RET-01", teamId: "T1", projectId: "P1", returnedAt: "2026-09-07", status: "received", returnedByName: "Trần B", totalQty: 1 }],
  requests: [{ id: "Q1", requestNo: "MR-01", projectId: "P1", requestedAt: "2026-09-02", status: "approved", requestedBy: "Nguyễn A" }],
  teamMembers: [], audits: [],
};

test("TM-05 — KẾT LUẬN: TƯƠNG THÍCH và TÁI DÙNG 2 action cấp phát THẬT của kho", () => {
  const { TEAM_ALLOCATION_SOURCES } = loadPure();
  assert.deepEqual(TEAM_ALLOCATION_SOURCES.map((source) => source.action).sort(), ["issue_stock", "return_stock"],
    "Tab Cấp phát phải tái dùng ĐÚNG 2 action cấp phát/hoàn trả của kho");
  // Action THẬT có trong route JS (CHỈ ĐỌC `scripts/system-route.mjs`).
  assert.match(route, /if \(action === "issue_stock"\) \{/, "Thiếu action `issue_stock` trong route");
  assert.match(route, /if \(action === "return_stock"\) \{/, "Thiếu action `return_stock` trong route");
  // Và chúng ghi vào ĐÚNG 2 bảng mà tab này đọc LẠI.
  const issueBranch = route.slice(route.indexOf('if (action === "issue_stock")'), route.indexOf('if (action === "return_stock")'));
  assert.match(issueBranch, /INSERT INTO stock_issues \(id,issue_no,project_id,from_warehouse_id,team_id,/, "`issue_stock` phải ghi `stock_issues` kèm `team_id`");
  assert.match(issueBranch, /INSERT INTO stock_issue_items \(id,issue_id,material_id,/, "`issue_stock` phải ghi `stock_issue_items`");
  const returnBranch = route.slice(route.indexOf('if (action === "return_stock")'), route.indexOf('if (action === "confirm_installation")'));
  assert.match(returnBranch, /INSERT INTO material_returns \(id,return_no,project_id,team_id,/, "`return_stock` phải ghi `material_returns` kèm `team_id`");
});

test("TM-05 — CÙNG SỔ: action xác nhận lắp đặt sửa chính cột `installed_qty` mà tab Cấp phát đọc", () => {
  assert.match(route, /if \(action === "confirm_installation"\) \{[\s\S]{0,4000}UPDATE stock_issue_items SET installed_qty=installed_qty\+\?/,
    "`confirm_installation` phải tăng `stock_issue_items.installed_qty`");
  const { TEAM_ALLOCATION_SOURCES } = loadPure();
  const issuesSource = TEAM_ALLOCATION_SOURCES.find((source) => source.key === "issues");
  assert.equal(issuesSource.installedField, "installedQty", "Tab Cấp phát phải đọc `installedQty` của cùng bảng đó");
  assert.equal(issuesSource.table, "stock_issues + stock_issue_items");
  assert.equal(issuesSource.qtyField, "totalQty");
});

test("TM-05 — tái dùng được vì HAI bảng đều mang `team_id` (khoá nối tổ đội)", () => {
  const { teamAllocations } = loadPure();
  const byKey = Object.fromEntries(teamAllocations(DATA, TEAM).map((source) => [source.key, source]));
  assert.equal(byKey.issues.total, 1, "chỉ phiếu của ĐÚNG tổ đội T1 (PX-01), không lẫn phiếu của T2");
  assert.deepEqual(byKey.issues.rows.map((row) => row.issueNo), ["PX-01"]);
  assert.equal(byKey.returns.total, 1);
  assert.deepEqual(byKey.returns.rows.map((row) => row.returnNo), ["RET-01"]);
  // Trường dùng để HIỂN THỊ phải là trường THẬT có trong bootstrap (không đoán). Alias cách nhau bởi XUỐNG DÒNG
  // trong SQL của bootstrap nên KHÔNG được gộp `bia.installed_qty AS installedQty` thành 1 chuỗi liền.
  for (const field of ["si.team_id AS teamId", "si.issue_no AS issueNo", "si.issued_at AS issuedAt", "si.received_by_name AS receivedByName", "installed_qty AS installedQty"]) {
    assert.ok(route.includes(field), `Bootstrap thiếu cột «${field}» mà tab Cấp phát đang hiển thị`);
  }
});

test("TM-05 — QUYỀN: `issue_stock` mở bằng cổng module `teams` + `warehouse_issue` ở CẢ 2 route", () => {
  assert.match(route, /issue_stock: \["teams","warehouse_issue"\]/, "ACTION_MODULE (JS) phải gắn `issue_stock` cho teams + warehouse_issue");
  assert.match(rbac, /Map\.entry\("issue_stock", List\.of\("teams", "warehouse_issue"\)\)/, "ActionRbacRegistry (Java) phải khớp JS");
  assert.match(rbac, /Map\.entry\("return_stock", List\.of\("teams", "stocktake"\)\)/, "`return_stock` cũng phải gắn cổng `teams`");
  // Tab Cấp phát KHÔNG được tự nghĩ ra khoá module mới: chỉ đọc dữ liệu đã có.
  assert.doesNotMatch(screen, /moduleKey: "/, "Màn Tổ đội không được khai khoá module mới");
});

test("TM-05 — ĐỐI CHỨNG ÂM: tổ đội không có phiếu nào ⇒ «chưa có nguồn», KHÔNG hiện 0", () => {
  const { teamAllocations, NO_SOURCE_TEXT } = loadPure();
  assert.equal(NO_SOURCE_TEXT, "chưa có nguồn");
  const empty = teamAllocations({ ...DATA, issues: [], returns: [] }, TEAM);
  for (const source of empty) {
    assert.equal(source.total, 0);
    assert.equal(source.rows.length, 0);
  }
  // UI phải dùng `available`/`emptyText` chứa «chưa có nguồn» ⇒ người dùng phân biệt được "0 phiếu" với "không đọc được".
  assert.match(screen, /emptyText=\{`\$\{NO_SOURCE_TEXT\} — chưa có \$\{source\.label\.toLowerCase\(\)\} nào mang team_id của tổ đội này\.`\}/,
    "Bảng cấp phát rỗng phải ghi «chưa có nguồn» + lý do");
  // Đối chứng DƯƠNG: phiếu của tổ đội KHÁC không được tính sang tổ đội này.
  const other = teamAllocations(DATA, { ...TEAM, id: "T2" });
  assert.equal(other.find((source) => source.key === "issues").total, 1);
  assert.deepEqual(other.find((source) => source.key === "issues").rows.map((row) => row.issueNo), ["PX-02"]);
});

test("TM-05 — tab «Cấp phát» là tab số 4 (thứ tự nguyên văn của TM-03) và có bảng dữ liệu riêng", () => {
  const { teamDetailTabs } = loadPure();
  const tabs = teamDetailTabs(DATA, TEAM);
  assert.equal(tabs[4].label, "Cấp phát");
  assert.match(tabs[4].source, /stock_issues\.team_id/);
  assert.match(tabs[4].source, /material_returns\.team_id/);
  assert.equal(tabs[4].count, 2);
  assert.match(screen, /TÁI DÙNG logic cấp phát kho/, "UI phải nói rõ đây là TÁI DÙNG logic cấp phát kho");
  assert.match(screen, /allocations\.map\(\(source\) =>/, "UI phải render bảng cấp phát từ nguồn tái dùng");
});
