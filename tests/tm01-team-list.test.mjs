// PHASE 6 (`TM-01`) — HỢP ĐỒNG: DANH SÁCH TỔ ĐỘI CÓ ĐỦ 6 CỘT.
// Nguyên văn `docs/25_TODO_ROADMAP.md` dòng `TM-01`:
//   «Danh sách: mã · tên · trạng thái · thành viên · dự án · hoạt động gần nhất»
//
// Cách kiểm (cùng kỷ luật `tests/t09-task-team-member.test.mjs`):
//   (1) TRÍCH khối thuần `TM-PURE-BEGIN/END` của `app/screens/TeamDirectory.tsx`, dịch TS→JS bằng esbuild rồi CHẠY
//       với fixtures ⇒ chứng minh DỮ LIỆU của cả 6 cột (không chỉ nhãn cột).
//   (2) Đối chiếu TÊN TRƯỜNG với NGUỒN THẬT (`scripts/system-route.mjs` cho `teams`/`issues`/`returns`,
//       `BootstrapDataAdapter.java` cho `teamMembers`) ⇒ chứng minh KHÔNG ĐOÁN tên trường.
//   (3) ĐỐI CHỨNG ÂM: VẮNG khoá `teamMembers` ⇒ cột «Thành viên» phải là «chưa có nguồn», KHÔNG được hiện `0 người`.
//   (4) UI phải VẼ đúng 6 cột đó + in NGUỒN từng cột.
//
// LƯU Ý: tệp này CỐ Ý không nằm trong `package.json` → `test:regression` giữ nguyên số ca.
// Chạy riêng:  node --test tests/tm01-team-list.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import esbuild from "esbuild";

const read = (relative) => readFileSync(new URL("../" + relative, import.meta.url), "utf8");
const screen = read("app/screens/TeamDirectory.tsx");
const route = read("scripts/system-route.mjs");
const javaAdapter = read("java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/BootstrapDataAdapter.java");

// Mốc nằm trên DÒNG RIÊNG dạng `// TM-PURE-BEGIN` — tên mốc còn được nhắc trong phần chú thích đầu tệp nên
// KHÔNG đếm thô theo chuỗi trần (đếm thô cho 2 lần ⇒ vỡ oan, đã gặp ở lượt chạy đầu của chính tệp này).
const BEGIN_LINE = /^\/\/ TM-PURE-BEGIN$/m;
const END_LINE = /^\/\/ TM-PURE-END$/m;
assert.equal((screen.match(/^\/\/ TM-PURE-BEGIN$/gm) || []).length, 1, "Mốc TM-PURE-BEGIN phải là DÒNG RIÊNG và xuất hiện đúng 1 lần");
assert.equal((screen.match(/^\/\/ TM-PURE-END$/gm) || []).length, 1, "Mốc TM-PURE-END phải là DÒNG RIÊNG và xuất hiện đúng 1 lần");

function loadPure() {
  const blockStart = screen.search(BEGIN_LINE);
  const blockEnd = screen.search(END_LINE);
  const block = screen.slice(blockStart + "// TM-PURE-BEGIN".length, blockEnd);
  const js = esbuild.transformSync(block, { loader: "ts" }).code;
  const names = [
    "NO_SOURCE_TEXT", "TEAM_LIST_COLUMNS", "TEAM_ACTIVE_LABEL", "TEAM_STOPPED_LABEL",
    "teamListRows", "teamListSourceNotes", "tmLastActivity", "tmMemberSummary", "tmIsActive",
  ];
  return new Function(`${js}\nreturn { ${names.join(", ")} };`)();
}

// ── FIXTURES: đúng tên trường của payload thật ────────────────────────────────────────────────────
const TEAM_ACTIVE = { id: "T1", code: "TD-01", name: "Tổ đội điện", trade: "Điện", projectId: "P1", warehouseId: "W1", active: 1 };
const TEAM_STOPPED = { id: "T2", code: "TD-02", name: "Tổ đội nước", trade: "Nước", projectId: "P1", warehouseId: "W2", active: 0 };
const PROJECTS = [{ id: "P1", code: "PRJ-1", name: "Dự án 1" }];
const ISSUES = [
  { id: "I1", issueNo: "PX-01", teamId: "T1", projectId: "P1", issuedAt: "2026-09-01T00:00:00.000Z", status: "posted", receivedByName: "Trần B", totalQty: 10, installedQty: 4 },
  { id: "I2", issueNo: "PX-02", teamId: "T1", projectId: "P1", issuedAt: "2026-09-05T00:00:00.000Z", status: "posted", receivedByName: "Trần B", totalQty: 2, installedQty: 1 },
  { id: "I3", issueNo: "PX-03", teamId: "T2", projectId: "P1", issuedAt: "2026-09-09T00:00:00.000Z", status: "posted", receivedByName: "Lê C", totalQty: 1, installedQty: 0 },
];
const RETURNS = [{ id: "R1", returnNo: "RET-01", teamId: "T1", projectId: "P1", returnedAt: "2026-09-07T00:00:00.000Z", status: "received", returnedByName: "Trần B", totalQty: 1 }];
const TEAM_MEMBERS = [
  { id: "TM1", teamId: "T1", userId: "U1", roleInTeam: "Tổ trưởng", joinedAt: "2026-01-05", leftAt: null, active: 1, fullName: "Nguyễn A" },
  { id: "TM2", teamId: "T1", userId: "U2", roleInTeam: "Thành viên", joinedAt: "2026-01-05", leftAt: null, active: 1, fullName: "Trần B" },
  { id: "TM3", teamId: "T1", userId: "U3", roleInTeam: "Thành viên", joinedAt: "2026-01-06", leftAt: "2026-02-01", active: 0, fullName: "Lê C" },
];
const BASE = { teams: [TEAM_ACTIVE, TEAM_STOPPED], teamMembers: TEAM_MEMBERS, projects: PROJECTS, warehouses: [{ id: "W1", code: "W-T1", name: "Kho tổ đội 1", type: "team", projectId: "P1" }], issues: ISSUES, returns: RETURNS };

test("TM-01 — danh sách khai ĐÚNG 6 cột, ĐÚNG thứ tự nguyên văn", () => {
  const { TEAM_LIST_COLUMNS } = loadPure();
  assert.deepEqual(
    TEAM_LIST_COLUMNS.map((column) => column.header),
    ["Mã tổ đội", "Tên tổ đội", "Trạng thái", "Thành viên", "Dự án", "Hoạt động gần nhất"],
    "6 cột phải khớp nguyên văn «mã · tên · trạng thái · thành viên · dự án · hoạt động gần nhất»",
  );
  // KHÔNG được thừa/thiếu cột (màn cũ có thêm «Hạng mục» · «Kho của tổ đội» · «Quyết toán» ở danh sách).
  assert.equal(TEAM_LIST_COLUMNS.length, 6);
});

test("TM-01 — DÙNG TRƯỜNG THẬT: đối chiếu nguồn (không đoán tên trường)", () => {
  const { TEAM_LIST_COLUMNS } = loadPure();
  // Nguồn THẬT của 6 cột, đo trong mã nguồn đang chạy:
  assert.match(route, /SELECT t\.id,t\.code,t\.name,t\.trade,t\.project_id AS projectId,t\.warehouse_id AS warehouseId FROM teams t/, "bootstrap `teams` phải trả code/name/projectId (nếu không, cột Mã/Tên/Dự án là đoán)");
  assert.match(route, /si\.team_id AS teamId[\s\S]{0,220}si\.issued_at AS issuedAt/, "bootstrap `issues` phải có `teamId`/`issuedAt` (cột Hoạt động gần nhất)");
  assert.match(route, /mr\.team_id AS teamId[\s\S]{0,220}mr\.returned_at AS returnedAt/, "bootstrap `returns` phải có `teamId`/`returnedAt`");
  assert.match(route, /t\.active=1/, "bootstrap `teams` LỌC `active=1` — bằng chứng cho ghi chú «tổ đội đã ngừng chưa có nguồn»");
  assert.match(javaAdapter, /tm\.team_id AS teamId[\s\S]{0,220}tm\.user_id AS userId/, "bootstrap Java `teamMembers` phải có `teamId`/`userId`");
  assert.match(javaAdapter, /tm\.joined_at AS joinedAt[\s\S]{0,120}tm\.left_at AS leftAt/, "bootstrap Java `teamMembers` phải có `joinedAt`/`leftAt`");
  for (const column of TEAM_LIST_COLUMNS) assert.ok(column.source && column.source.length > 3, `Cột «${column.header}» chưa khai NGUỒN`);
});

test("TM-01 — 6 cột có DỮ LIỆU THẬT trên fixtures (chạy khối thuần)", () => {
  const { teamListRows } = loadPure();
  const rows = teamListRows(BASE);
  const active = rows.find((row) => row.id === "T1");
  assert.ok(active, "phải có dòng cho tổ đội T1");
  assert.equal(active.code, "TD-01", "cột Mã");
  assert.equal(active.name, "Tổ đội điện", "cột Tên");
  assert.equal(active.statusLabel, "Đang hoạt động", "cột Trạng thái");
  assert.equal(active.activeMembers, 2, "cột Thành viên = số người active=1 và KHÔNG có leftAt");
  assert.equal(active.leftMembers, 1, "người đã rời phải được đếm riêng");
  assert.equal(active.projectCode, "PRJ-1", "cột Dự án");
  assert.equal(active.lastActivityAt, "2026-09-07", "cột Hoạt động gần nhất = max(issuedAt 09-05 · returnedAt 09-07)");
  assert.match(active.lastActivitySource, /stock_issues\.issued_at/, "phải ghi NGUỒN của ngày hoạt động");

  const stopped = rows.find((row) => row.id === "T2");
  assert.equal(stopped.statusLabel, "Đã ngừng", "tổ đội `active=0` phải hiện Đã ngừng");
  assert.equal(stopped.lastActivityAt, "2026-09-09", "ngày hoạt động tính đúng cho tổ đội khác");
});

test("TM-01 — ĐỐI CHỨNG ÂM: VẮNG `teamMembers` ⇒ «chưa có nguồn», KHÔNG hiện 0 giả", () => {
  const { teamListRows, tmMemberSummary, NO_SOURCE_TEXT, teamListSourceNotes } = loadPure();
  assert.equal(NO_SOURCE_TEXT, "chưa có nguồn");
  const rows = teamListRows({ ...BASE, teamMembers: undefined });
  for (const row of rows) {
    assert.equal(row.membersKnown, false, "thiếu khoá nguồn ⇒ `membersKnown` phải false");
    assert.equal(row.activeMembers, 0, "số đếm nội bộ vẫn 0…");
    assert.match(row.membersSource, new RegExp(NO_SOURCE_TEXT), "…nhưng NGUỒN phải ghi «chưa có nguồn» + lý do");
    assert.match(row.membersSource, /Java-only|team_members/, "lý do phải nêu rõ khoá này là Java-only");
  }
  // UI phải đọc cờ `membersKnown` trước khi in số — không được in thẳng `activeMembers`.
  assert.match(screen, /row\.membersKnown\s*\?\s*<>\{row\.activeMembers\}/, "UI phải rẽ nhánh theo `membersKnown` trước khi hiện số thành viên");
  assert.match(screen, /data-team-source-notes="TM-01"/, "UI phải in khối GHI NGUỒN của danh sách");
  const notes = teamListSourceNotes({ ...BASE, teamMembers: undefined });
  assert.match(notes.members, new RegExp(NO_SOURCE_TEXT));
  assert.match(notes.stoppedTeams, new RegExp(NO_SOURCE_TEXT), "phải nói rõ «đã ngừng» cũng chưa có nguồn vì bootstrap lọc active=1");
  // Đối chứng DƯƠNG: có nguồn thì phải đếm thật, không rơi vào nhánh «chưa có nguồn».
  assert.equal(tmMemberSummary(TEAM_ACTIVE, TEAM_MEMBERS).known, true);
  assert.equal(tmMemberSummary(TEAM_ACTIVE, TEAM_MEMBERS).active, 2);
  assert.equal(tmMemberSummary(TEAM_STOPPED, TEAM_MEMBERS).active, 0, "tổ đội không có thành viên ⇒ 0 THẬT (có nguồn)");
});

test("TM-01 — UI render đúng 6 cột theo hằng số + nút Chi tiết cho từng dòng", () => {
  for (const header of ["Mã tổ đội", "Tên tổ đội", "Trạng thái", "Thành viên", "Dự án", "Hoạt động gần nhất"]) {
    assert.ok(screen.includes(header), `Thiếu nhãn cột «${header}» trong UI`);
  }
  for (const key of ["code", "name", "status", "members", "project", "lastActivity"]) {
    assert.ok(screen.includes(`key: "${key}", header:`), `Cột «${key}» chưa render theo hằng số TEAM_LIST_COLUMNS`);
  }
  assert.match(screen, /onClick=\{\(\) => \{ setDetailId\(row\.id\); setView\("detail"\); setTab\(0\); \}\}/, "Mỗi dòng phải mở được chi tiết");
});
