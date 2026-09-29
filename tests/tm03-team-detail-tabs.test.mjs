// PHASE 6 (`TM-03`) — HỢP ĐỒNG: CHI TIẾT TỔ ĐỘI CÓ ĐỦ 6 TAB.
// Nguyên văn `docs/25_TODO_ROADMAP.md` dòng `TM-03`:
//   «Chi tiết: thông tin · nhân sự · dự án · kho · cấp phát · lịch sử»
//
// Cách kiểm: TRÍCH `teamDetailTabs` (khối thuần) rồi CHẠY với fixtures để chứng minh 6 tab KHÔNG chỉ có nhãn:
// mỗi tab phải khai NGUỒN THẬT và cờ `available` phải đúng (tab thiếu nguồn ⇒ «chưa có nguồn», không hiện 0).
//
// LƯU Ý: tệp này CỐ Ý không nằm trong `package.json` → `test:regression` giữ nguyên số ca.
// Chạy riêng:  node --test tests/tm03-team-detail-tabs.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import esbuild from "esbuild";

const screen = readFileSync(new URL("../app/screens/TeamDirectory.tsx", import.meta.url), "utf8");
const route = readFileSync(new URL("../scripts/system-route.mjs", import.meta.url), "utf8");

function loadPure() {
  const blockStart = screen.search(/^\/\/ TM-PURE-BEGIN$/m);
  const blockEnd = screen.search(/^\/\/ TM-PURE-END$/m);
  assert.ok(blockStart >= 0 && blockEnd > blockStart, "Thiếu khối thuần TM-PURE-BEGIN/END");
  const block = screen.slice(blockStart + "// TM-PURE-BEGIN".length, blockEnd);
  const js = esbuild.transformSync(block, { loader: "ts" }).code;
  const names = ["TEAM_TABS", "teamDetailTabs", "teamHistory", "teamAllocations", "NO_SOURCE_TEXT"];
  return new Function(`${js}\nreturn { ${names.join(", ")} };`)();
}

const TEAM = { id: "T1", code: "TD-01", name: "Tổ đội điện", trade: "Điện", projectId: "P1", warehouseId: "W1", active: 1, leaderUserId: "U1" };
const DATA = {
  teams: [TEAM],
  teamMembers: [{ id: "TM1", teamId: "T1", userId: "U1", roleInTeam: "Tổ trưởng", joinedAt: "2026-01-05", leftAt: null, active: 1, fullName: "Nguyễn A" }],
  projects: [{ id: "P1", code: "PRJ-1", name: "Dự án 1" }],
  warehouses: [{ id: "W1", code: "W-T1", name: "Kho tổ đội 1", type: "team", projectId: "P1" }],
  inventory: [{ projectId: "P1", warehouseId: "W1", materialId: "M1", materialCode: "VT-1", balance: 7, available: 5, reserved: 2 }],
  issues: [{ id: "I1", issueNo: "PX-01", teamId: "T1", projectId: "P1", issuedAt: "2026-09-01", status: "posted", totalQty: 10, installedQty: 4 }],
  returns: [{ id: "R1", returnNo: "RET-01", teamId: "T1", projectId: "P1", returnedAt: "2026-09-07", status: "received", totalQty: 1 }],
  requests: [{ id: "Q1", requestNo: "MR-01", projectId: "P1", requestedAt: "2026-09-02", status: "approved", requestedBy: "Nguyễn A" }],
  audits: [],
  teamSubcontracts: [{ id: "SC1", teamId: "T1", contractNo: "TSC-01", contractName: "Giao khoán điện", contractValue: 100, status: "active" }],
  teamSettlements: [],
};

// 📌 CẬP NHẬT 26/09/2026 theo MASTER TASK 3 §G: đúng 5 tab
//   «Thông tin · Nhân sự · Dự án · Kho · Lịch sử».
// ⛔ Tab «Cấp phát» ĐÃ GỘP vào «Lịch sử» (vì §G: «Lịch sử — Tổng hợp tất cả đơn/phiếu liên quan…
//   có Search · Sort · Filter theo loại») ⇒ ⛔ KHÔNG mất chức năng cấp phát/hoàn trả.
// ⛔ Mọi khẳng định khác (nguồn thật, đếm dòng, đối chứng âm, render UI) được GIỮ NGUYÊN.
test("TM-03 — đúng 5 tab theo MT3 §G, đúng thứ tự nguyên văn", () => {
  const { TEAM_TABS } = loadPure();
  assert.deepEqual(TEAM_TABS, ["Thông tin", "Nhân sự", "Dự án", "Kho", "Lịch sử"],
    "5 tab phải khớp nguyên văn «thông tin · nhân sự · dự án · kho · lịch sử» (MT3 §G)");
  assert.equal(TEAM_TABS.length, 5);
});

test("TM-03 — mỗi tab có NGUỒN THẬT + đếm dòng THẬT trên fixtures", () => {
  const { teamDetailTabs } = loadPure();
  const tabs = teamDetailTabs(DATA, TEAM);
  assert.equal(tabs.length, 5);
  assert.deepEqual(tabs.map((tab) => tab.label), ["Thông tin", "Nhân sự", "Dự án", "Kho", "Lịch sử"]);
  const byLabel = Object.fromEntries(tabs.map((tab) => [tab.label, tab]));
  assert.equal(byLabel["Thông tin"].available, true);
  assert.equal(byLabel["Nhân sự"].count, 1, "Nhân sự = số dòng team_members của ĐÚNG tổ đội này");
  assert.equal(byLabel["Dự án"].count, 1, "Dự án = tổ đội thuộc 1 dự án");
  assert.equal(byLabel["Kho"].count, 1, "Kho = teams.warehouse_id tra được trong warehouses[]");
  // ⛔ Tab «Lịch sử» nay TỔNG HỢP cả cấp phát lẫn hoàn trả ⇒ count = 2 (1 xuất + 1 hoàn trả).
  assert.equal(byLabel["Lịch sử"].count, 2, "Lịch sử = tổng hợp 1 phiếu xuất + 1 phiếu hoàn mang team_id");
  for (const tab of tabs) {
    assert.match(tab.source, /teams|team_members|projects|warehouses|inventory|stock_issues|material_returns|audit_logs/,
      `Tab «${tab.label}» chưa khai NGUỒN THẬT (đang là: ${tab.source})`);
  }
  // Không được tạo nguồn mới: nguồn phải là bảng ĐANG CÓ trong route/bootstrap.
  for (const table of ["teams", "team_members", "projects", "warehouses", "inventory", "stock_issues", "material_returns", "audit_logs"]) {
    assert.ok(tabs.some((tab) => tab.source.includes(table)), `Không tab nào khai nguồn bảng «${table}»`);
  }
});

test("TM-03 — ĐỐI CHỨNG ÂM: thiếu nguồn ⇒ `available=false` + «chưa có nguồn», KHÔNG hiện 0", () => {
  const { teamDetailTabs, NO_SOURCE_TEXT } = loadPure();
  assert.equal(NO_SOURCE_TEXT, "chưa có nguồn");

  // (a) VẮNG khoá `teamMembers` (đúng thực tế bootstrap JS) ⇒ tab Nhân sự KHÔNG có nguồn.
  const noMembers = teamDetailTabs({ ...DATA, teamMembers: undefined }, TEAM);
  const nhanSu = noMembers.find((tab) => tab.label === "Nhân sự");
  assert.equal(nhanSu.available, false, "thiếu khoá teamMembers ⇒ tab Nhân sự phải `available=false`");
  assert.equal(nhanSu.count, 0);
  assert.match(nhanSu.noSourceReason, new RegExp(NO_SOURCE_TEXT), "phải ghi «chưa có nguồn» + lý do");

  // (b) Kho có thật nhưng `inventory[]` rỗng ⇒ tab Kho KHÔNG có nguồn tồn.
  const noStock = teamDetailTabs({ ...DATA, inventory: [] }, TEAM);
  const kho = noStock.find((tab) => tab.label === "Kho");
  assert.equal(kho.available, false, "không có dòng inventory nào cho kho ⇒ `available=false`");
  assert.match(kho.noSourceReason, new RegExp(NO_SOURCE_TEXT));

  // (c) MT3 §G — tab «Lịch sử» nay TỔNG HỢP nhiều nguồn (cấp phát + hoàn trả + audit)
  //     ⇒ «available» chỉ FALSE khi TẤT CẢ các nguồn đều rỗng (ở fixture này luôn có 1 cấp phát + 1 hoàn trả).
  const noAudit = teamDetailTabs({ ...DATA, audits: [] }, TEAM);
  const lichSu = noAudit.find((tab) => tab.label === "Lịch sử");
  assert.equal(lichSu.available, true, "Lịch sử vẫn CÓ nguồn (cấp phát/hoàn trả) dù audits[] rỗng");
  assert.ok(lichSu.source.includes("audit_logs"), "nguồn của tab Lịch sử vẫn phải nêu rõ audit_logs");
  // Đối chứng DƯƠNG: có dòng audit của ĐÚNG tổ đội ⇒ số dòng TĂNG thêm 1 (cộng dồn, không thay thế).
  const withAudit = teamDetailTabs({ ...DATA, audits: [{ id: "A1", entityType: "team", entityId: "T1", action: "CREATE", occurredAt: "2026-09-14", userName: "admin" }] }, TEAM);
  assert.equal(withAudit.find((tab) => tab.label === "Lịch sử").available, true);
  assert.equal(withAudit.find((tab) => tab.label === "Lịch sử").count, lichSu.count + 1,
    "thêm 1 dòng audit của đúng tổ đội này ⇒ count tổng hợp tăng đúng 1");
  // …nhưng audit của tổ đội KHÁC thì KHÔNG được tính.
  const otherAudit = teamDetailTabs({ ...DATA, audits: [{ id: "A2", entityType: "team", entityId: "T9", action: "CREATE", occurredAt: "2026-09-14" }] }, TEAM);
  assert.equal(otherAudit.find((tab) => tab.label === "Lịch sử").count, lichSu.count, "audit của tổ đội khác không được tính vào tổ đội này");
});

test("TM-03 — mọi khoá đọc ra đều ĐÃ CÓ trong bootstrap (không thêm nguồn mới)", () => {
  for (const column of ["t.warehouse_id AS warehouseId", "w.project_id AS projectId", "itemCount", "totalQty"]) {
    assert.ok(route.includes(column), `Bootstrap thiếu cột «${column}» ⇒ giá định của màn Tổ đội sai`);
  }
  assert.match(route, /si\.team_id AS teamId/, "Nguồn `issues[]` phải nằm trong bootstrap");
  assert.match(route, /mr\.return_no AS returnNo/, "Nguồn `returns[]` phải nằm trong bootstrap");
  assert.match(route, /FROM audit_logs al LEFT JOIN users u ON u\.id=al\.user_id/, "Nguồn `audits[]` phải nằm trong bootstrap (chỉ admin)");
});

test("TM-03 — UI render đủ 5 tab từ hằng số (MT3 §G) + tab thiếu nguồn hiện «chưa có nguồn»", () => {
  assert.match(screen, /tabs\.map\(\(item, index\) => <button key=\{item\.label\}/, "Dải tab phải render từ mảng tab của khối thuần");
  for (const index of [0, 1, 2, 3, 4]) {
    assert.ok(screen.includes(`{tab === ${index} &&`), `Thiếu nhánh render tab chỉ số ${index}`);
  }
  // ⛔ Tab 5 («Cấp phát») đã GỘP vào tab 4 «Lịch sử» theo MT3 §G ⇒ nay đúng 5 nhánh 0..4.
  assert.equal(screen.includes("{tab === 5 &&"), false, "⛔ sau MT3 §G chỉ còn 5 tab (0..4) — không được còn nhánh tab 5");
  assert.match(screen, /tab === 4 && <div className="stack">/, "Tab 4 phải là «Lịch sử» tổng hợp (thứ tự nguyên văn MT3 §G)");
  // ⛔ Tab «Lịch sử» phải CÓ phần tổng hợp có Tìm · Sắp xếp · Lọc theo loại, mặc định mới nhất.
  assert.match(screen, /data-vntech="team-history-aggregate"/, "Tab Lịch sử phải có khối TỔNG HỢP chứng từ");
  assert.match(screen, /setHistSort|histSort/, "Phải có điều khiển SẮP XẾP cho lịch sử");
  assert.match(screen, /setHistType|histType/, "Phải có bộ LỌC THEO LOẠI chứng từ");
  assert.match(screen, /tabs\[1\]\.noSourceReason/, "UI phải in LÝ DO thiếu nguồn của tab Nhân sự");
  assert.match(screen, /item\.available && item\.count \? ` \(\$\{item\.count\}\)` : ""/, "Số trên tab chỉ hiện khi tab CÓ nguồn");
});
