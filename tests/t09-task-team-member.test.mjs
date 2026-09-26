// PHASE 3 (`T-09`) — HỢP ĐỒNG KIẾN TRÚC PHÂN CẤP CỦA MÀN CÔNG VIỆC.
// Nguyên văn `docs/25_TODO_ROADMAP.md` dòng `T-09`: «Kiến trúc Task → Team → Thành viên → Hỗ trợ liên phòng (§10)».
//
// Cách kiểm (cùng kỷ luật với `tests/t07-kanban-board.test.mjs`):
//   (1) TRÍCH khối thuần giữa hai mốc trong `app/screens/WorkHierarchy.tsx`, dịch TS→JS bằng esbuild rồi CHẠY
//       với fixtures để chứng minh CHUỖI 4 CẤP và việc dùng TRƯỜNG THẬT (không đoán tên trường);
//   (2) đối chiếu TÊN TRƯỜNG với NGUỒN THẬT (`scripts/system-route.mjs`, `BootstrapDataAdapter.java`) ⇒ chứng minh
//       `projectId`/`teamId`/`workItemId`/`userId` có thật trong payload;
//   (3) ĐỐI CHỨNG ÂM: thiếu nguồn ⇒ «chưa có nguồn», KHÔNG bịa sĩ số; người không rõ phòng ⇒ KHÔNG bị coi là liên phòng;
//   (4) liên kết mở `EntityDetailModal` (qua cổng dùng chung `ProjectEntityModal`) + WorkCenter thật sự gắn khối này.
//
// LƯU Ý: tệp này CỐ Ý không nằm trong `package.json` → `test:regression` giữ nguyên số ca.
// Chạy riêng:  node --test tests/t09-task-team-member.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import esbuild from "esbuild";

const read = (relative) => readFileSync(new URL("../" + relative, import.meta.url), "utf8");
const hierarchy = read("app/screens/WorkHierarchy.tsx");
const workCenter = read("app/screens/WorkCenter.tsx");
const entityModal = read("app/screens/ProjectEntityModal.tsx");
const route = read("scripts/system-route.mjs");
const javaAdapter = read("java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/BootstrapDataAdapter.java");

const BEGIN = "T09-PURE-BEGIN";
const END = "T09-PURE-END";
assert.equal(hierarchy.split(BEGIN).length - 1, 1, "Mốc T09-PURE-BEGIN phải xuất hiện đúng 1 lần");
assert.equal(hierarchy.split(END).length - 1, 1, "Mốc T09-PURE-END phải xuất hiện đúng 1 lần");
const blockStart = hierarchy.indexOf(BEGIN);
const blockEnd = hierarchy.indexOf(END, blockStart + BEGIN.length);
assert.ok(blockStart > 0 && blockEnd > blockStart, "WorkHierarchy.tsx thiếu khối thuần T09-PURE-BEGIN/END");
const block = hierarchy.slice(hierarchy.indexOf("\n", blockStart) + 1, blockEnd);
const blockCode = block.replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");

function loadPure() {
  const js = esbuild.transformSync(block, { loader: "ts" }).code;
  const names = ["HIERARCHY_LEVELS", "NO_SOURCE_TEXT", "hierarchyTeamOfTask", "hierarchyMembersOfTeam", "hierarchyDepartmentCode", "hierarchySourceOf", "hierarchySupport", "workHierarchy", "hierarchyTotals"];
  return new Function(`${js}\nreturn { ${names.join(", ")} };`)();
}

// ── FIXTURES: đúng tên trường của payload thật ────────────────────────────────────────────────────
const TEAM_A = { id: "T1", code: "TD-01", name: "Tổ đội điện", trade: "Điện", projectId: "P1", warehouseId: "W1" };
const TEAM_B = { id: "T2", code: "TD-02", name: "Tổ đội nước", trade: "Nước", projectId: "P2", warehouseId: "W2" };
const UNITS = [{ id: "O1", code: "KH", name: "Kế hoạch" }, { id: "O2", code: "DA", name: "Dự án" }];
const DIRECTORY = [
  { id: "U1", fullName: "Nguyễn Văn A", organizationCode: "KH", organizationName: "Kế hoạch" },
  { id: "U2", fullName: "Trần Thị B", organizationCode: "DA", organizationName: "Dự án" },
  { id: "U3", fullName: "Lê Văn C" },                       // KHÔNG có phòng ⇒ không được coi là liên phòng
];
const TASK = { id: "CV1", taskNo: "CV-0001", title: "Rà soát hồ sơ", projectId: "P1", projectCode: "PRJ-1", departmentCode: "KH", assignedTo: "U1", assignedToName: "Nguyễn Văn A", status: "IN_PROGRESS" };
const TEAM_MEMBERS = [
  { id: "TM1", teamId: "T1", userId: "U1", roleInTeam: "Tổ trưởng", joinedAt: "2026-01-01", leftAt: null, active: 1, fullName: "Nguyễn Văn A", department: "Kế hoạch" },
  { id: "TM2", teamId: "T1", userId: "U2", roleInTeam: "Thành viên", joinedAt: "2026-02-01", leftAt: null, active: 1, fullName: "Trần Thị B", department: "Dự án" },
  { id: "TM3", teamId: "T1", userId: "U3", roleInTeam: "Thành viên", joinedAt: "2026-02-02", leftAt: "2026-03-01", active: 0, fullName: "Lê Văn C", department: "Kế hoạch" },
  { id: "TM4", teamId: "T2", userId: "U2", roleInTeam: "Tổ trưởng", joinedAt: "2026-03-01", leftAt: null, active: 1, fullName: "Trần Thị B", department: "Dự án" },
];
const PARTICIPANTS = [
  { id: "WPT1", workItemId: "CV1", userId: "U2", userName: "Trần Thị B", roleInTask: "Hỗ trợ", employeeCode: "NV02" },
  { id: "WPT2", workItemId: "CV1", userId: "U1", userName: "Nguyễn Văn A", roleInTask: "Chủ trì", employeeCode: "NV01" },
  { id: "WPT3", workItemId: "CV1", userId: "U3", userName: "Lê Văn C", roleInTask: "Theo dõi", employeeCode: "NV03" },
];
const DATA = { teams: [TEAM_A, TEAM_B], teamMembers: TEAM_MEMBERS, workItemParticipants: PARTICIPANTS, staffDirectory: DIRECTORY, organizationUnits: UNITS, users: [], projects: [{ id: "P1", code: "PRJ-1", name: "Dự án 1" }] };

test("T-09 — CHUỖI 4 CẤP có đủ và đúng thứ tự: Task → Team → Thành viên → Hỗ trợ liên phòng", () => {
  const { HIERARCHY_LEVELS } = loadPure();
  assert.deepEqual(HIERARCHY_LEVELS, ["Task", "Team", "Thành viên", "Hỗ trợ liên phòng"], "Chuỗi §10 phải là Task → Team → Thành viên → Hỗ trợ liên phòng");
  // Khối UI phải VẼ cả 4 cấp: «Task» ở header từng việc, 3 cấp còn lại có mốc dữ liệu riêng.
  assert.ok(hierarchy.includes(">Task · phòng "), "Khối UI thiếu cấp «Task» trong header từng việc");
  for (const label of ["Team", "Thành viên", "Hỗ trợ liên phòng"]) assert.ok(hierarchy.includes(`>${label} (`) || hierarchy.includes(`>${label}<`), `Khối UI thiếu nhãn cấp «${label}»`);
  for (const key of ["team", "members", "support"]) assert.ok(hierarchy.includes(`data-hierarchy-level="${key}"`), `Thiếu khối cấp «${key}» trong UI`);
  assert.ok(hierarchy.includes("HIERARCHY_LEVELS.map"), "UI chưa vẽ danh sách cấp từ hằng số HIERARCHY_LEVELS");
});

test("T-09 — DÙNG TRƯỜNG THẬT: đối chiếu tên trường với bootstrap (không đoán)", () => {
  // Nguồn thật: `teams` (JS) · `team_members` (Java) · `work_item_participants` (JS, T-04) · `work_items` (JS).
  assert.match(route, /t\.project_id AS projectId/, "bootstrap `teams` không có `projectId` ⇒ giả định sai");
  assert.match(javaAdapter, /tm\.team_id AS teamId[\s\S]{0,200}tm\.user_id AS userId/, "bootstrap `teamMembers` không có `teamId`/`userId` ⇒ giả định sai");
  assert.match(route, /p\.work_item_id AS workItemId/, "bootstrap `workItemParticipants` không có `workItemId` ⇒ giả định sai");
  assert.match(route, /wi\.project_id AS projectId/, "bootstrap `workItems` không có `projectId` ⇒ giả định sai");
  // Khối thuần PHẢI đọc đúng các trường đó.
  for (const field of ["task.projectId", "team.projectId", "member.teamId", "member.userId", "row.workItemId", "participant.userId"]) {
    assert.ok(blockCode.includes(field), `Khối thuần chưa đọc trường thật «${field}»`);
  }
  // ĐỐI CHỨNG ÂM: không được dùng tên trường bịa/đã chết.
  assert.doesNotMatch(blockCode, /assigneeUserId|assigneeName\b|task\.teamId|team\.members\b/, "Khối thuần dùng tên trường KHÔNG có trong payload");
  // Trường `teamMembers` là khoá Java-only ⇒ phải khai báo tuỳ chọn và KHÔNG được coi là luôn có.
  assert.match(hierarchy, /data\.teamMembers \|\| \[\]/, "Khối chưa coi `teamMembers` là tuỳ chọn (khoá Java-only)");
});

test("T-09 — Task → Team theo `projectId`; việc KHÔNG gắn dự án thì KHÔNG gán bừa tổ đội", () => {
  const { hierarchyTeamOfTask } = loadPure();
  assert.equal(hierarchyTeamOfTask(TASK, DATA.teams).id, "T1", "Phải chọn tổ đội CÙNG dự án");
  assert.equal(hierarchyTeamOfTask({ ...TASK, projectId: "P2" }, DATA.teams).id, "T2");
  assert.equal(hierarchyTeamOfTask({ ...TASK, projectId: "" }, DATA.teams), null, "[đối chứng âm] việc không gắn dự án không được gán tổ đội");
  assert.equal(hierarchyTeamOfTask({ ...TASK, projectId: "P9" }, DATA.teams), null, "[đối chứng âm] dự án không có tổ đội ⇒ không có Team");
});

test("T-09 — Team → Thành viên: chỉ người ĐANG hoạt động (đúng cách màn Tổ đội lọc)", () => {
  const { hierarchyMembersOfTeam, workHierarchy } = loadPure();
  const members = hierarchyMembersOfTeam(TEAM_A, DATA.teamMembers);
  assert.deepEqual(members.map((m) => m.userId), ["U1", "U2"], "Người đã rời (leftAt/active=0) không được tính là thành viên");
  assert.equal(hierarchyMembersOfTeam(null, DATA.teamMembers).length, 0, "[đối chứng âm] không có tổ đội ⇒ 0 thành viên");
  assert.equal(hierarchyMembersOfTeam(TEAM_A, []).length, 0);
  const node = workHierarchy(DATA, [TASK])[0];
  assert.equal(node.members.length, 2);
  assert.equal(node.team.code, "TD-01");
});

test("T-09 — Hỗ trợ liên phòng: đúng người KHÁC phòng, giữ NGUỒN từng dòng, loại người không rõ phòng", () => {
  const { workHierarchy, hierarchySupport, hierarchyDepartmentCode } = loadPure();
  const node = workHierarchy(DATA, [TASK])[0];
  // U2 (phòng DA) vào bằng CẢ HAI nguồn: người tham gia + thành viên tổ đội; U3 KHÔNG có phòng ⇒ bị loại.
  assert.deepEqual(node.support.map((row) => row.userId).sort(), ["U2"], "Chỉ người khác phòng mới là «hỗ trợ liên phòng»");
  assert.deepEqual(node.support[0].sources.sort(), ["team_members", "work_item_participants"], "Phải giữ NGUỒN của từng dòng (không trộn hai nguồn)");
  assert.equal(node.support[0].departmentCode, "DA");
  // Người CHÍNH phòng của việc (U1 — KH) KHÔNG được coi là hỗ trợ liên phòng.
  assert.ok(!node.support.some((row) => row.userId === "U1"), "Người cùng phòng không được tính là hỗ trợ liên phòng");
  // ĐỐI CHỨNG ÂM: không rõ phòng ⇒ "" và bị loại khỏi danh sách.
  assert.equal(hierarchyDepartmentCode({ department: "Phòng không tồn tại" }, UNITS), "", "Tên phòng lạ phải trả rỗng, không đoán mã");
  assert.equal(hierarchyDepartmentCode({ department: "Dự án" }, UNITS), "DA", "Tra TÊN phòng trong organizationUnits phải ra mã thật");
  assert.deepEqual(hierarchySupport(TASK, [], DIRECTORY, PARTICIPANTS, UNITS).length, 1);
  assert.deepEqual(hierarchySupport(TASK, [], [], PARTICIPANTS, UNITS).length, 0, "[đối chứng âm] thiếu danh bạ ⇒ không kết luận ai liên phòng");
});

test("T-09 — THIẾU NGUỒN thì ghi «chưa có nguồn», KHÔNG hiện 0 thay cho «không biết»", () => {
  const { workHierarchy, NO_SOURCE_TEXT, hierarchySourceOf, hierarchyTotals } = loadPure();
  assert.equal(NO_SOURCE_TEXT, "chưa có nguồn");
  // `teamMembers` VẮNG (đúng thực tế bootstrap JS) ⇒ nguồn thành viên phải là «chưa có nguồn».
  const noMembers = workHierarchy({ ...DATA, teamMembers: [] }, [TASK])[0];
  assert.equal(noMembers.members.length, 0);
  assert.ok(noMembers.memberSource.includes(NO_SOURCE_TEXT), `Nguồn thành viên phải ghi «${NO_SOURCE_TEXT}», nhận được: ${noMembers.memberSource}`);
  // Việc không có người tham gia ⇒ nguồn hỗ trợ cũng phải ghi «chưa có nguồn».
  const noSupport = workHierarchy({ ...DATA, workItemParticipants: [] }, [TASK])[0];
  assert.ok(noSupport.supportSource.includes(NO_SOURCE_TEXT), "Nguồn hỗ trợ phải ghi «chưa có nguồn» khi chưa có người tham gia");
  // Hàm nguồn: cột rỗng ⇒ «chưa có nguồn»; có giá trị ⇒ nêu nguồn kèm số dòng THẬT.
  assert.ok(hierarchySourceOf([{ a: "" }, {}], "a", "cột a").includes(NO_SOURCE_TEXT));
  assert.equal(hierarchySourceOf([{ a: "x" }, {}], "a", "cột a"), "cột a · 1/2 dòng có giá trị");
  assert.deepEqual(hierarchyTotals(workHierarchy(DATA, [TASK])), { tasks: 1, withTeam: 1, members: 2, support: 1 });
  // UI phải VẼ chữ «chưa có nguồn» cho cấp thiếu nguồn (không hardcode 0).
  assert.ok(hierarchy.includes("NO_SOURCE_TEXT"), "UI chưa dùng hằng số «chưa có nguồn»");
});

test("T-09 — LIÊN KẾT mở `EntityDetailModal` cho Team và Nhân sự (qua cổng dùng chung)", () => {
  // Cổng dùng chung PHASE 4 render `EntityDetailModal` (U-01) — đối chiếu ở tệp nguồn.
  assert.match(entityModal, /import \{[^}]*EntityDetailModal[^}]*\} from "@\/app\/components\/ui"/, "ProjectEntityModal phải dùng EntityDetailModal dùng chung");
  assert.match(entityModal, /<EntityDetailModal/, "ProjectEntityModal chưa render EntityDetailModal");
  // Khối phân cấp mở modal qua cổng đó với ĐÚNG 2 loại thực thể: team + user.
  assert.match(hierarchy, /import \{ ProjectEntityModal, type ProjectEntity \} from "@\/app\/screens\/ProjectEntityModal"/, "Thiếu import cổng modal dùng chung");
  assert.match(hierarchy, /<ProjectEntityModal data=\{data\} entity=\{entity\} onClose=\{\(\) => setEntity\(null\)\} permission=\{permission\}/, "Chưa render cổng modal với entity/permission");
  assert.equal((hierarchy.match(/data-entity-kind="team"/g) || []).length, 1, "Team phải có đúng 1 chỗ bấm mở modal");
  assert.match(hierarchy, /setEntity\(\{ kind: "team", row: team \}\)/, "Bấm Team chưa mở modal thực thể «team»");
  assert.match(hierarchy, /setEntity\(\{ kind: "user", row: \{ \.\.\.member, id: member\.userId \} \}\)/, "Bấm thành viên chưa mở modal thực thể «user» (đúng `userId`)");
  assert.match(hierarchy, /setEntity\(\{ kind: "user", row: \{ id: person\.userId, fullName: person\.name \} \}\)/, "Bấm người hỗ trợ chưa mở modal thực thể «user»");
});

test("T-09 — GẮN vào màn Công việc: WorkCenter import + render, KHÔNG đổi 5 tab đã chốt ở T-01", () => {
  assert.match(workCenter, /import \{[^}]*WorkHierarchy[^}]*\} from "@\/app\/screens\/WorkHierarchy";/, "WorkCenter chưa import khối phân cấp");
  assert.match(workCenter, /<WorkHierarchy\b/, "WorkCenter chưa render khối phân cấp");
  assert.match(workCenter, /scopeNote=\{/, "Khối phân cấp chưa nhận ghi chú phạm vi (T-06)");
  assert.match(workCenter, /permission=\{modulePermission\(data, "dept_plan_assign"\)\}/, "Khối phân cấp chưa nhận cổng quyền THẬT của tab «Phòng ban»");
  assert.equal((workCenter.match(/const WORK_TABS = \["Cá nhân", "Phòng ban", "Giao việc", "Dashboard", "Báo cáo"\];/g) || []).length, 1, "Không được đổi dải 5 tab đã chốt ở T-01");
  // ⚠️ CẬP NHẬT 23/09/2026 (MT2-P5-01 §3.1): ánh xạ nay có THÊM khoá `dashboard: 3` (cùng tab «Dashboard»)
  // và GIỮ `kpi: 3` để tương thích ngược — xem `app/screens/WorkCenter.tsx:84-88`. ⛔ 5 tab KHÔNG đổi (dòng trên).
  assert.match(workCenter, /const WORK_TAB_OF_VIEW: Record<WorkMenuView, number> = \{ personal: 0, department: 1, assign: 2, kpi: 3, dashboard: 3, reports: 4 \};/, "Không được đổi ánh xạ view → tab");
});
