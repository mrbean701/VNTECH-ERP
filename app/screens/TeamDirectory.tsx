// PHASE 6 (`TM-01` … `TM-05`) — MÀN TỔ ĐỘI THEO HỢP ĐỒNG CỦA ROADMAP.
//
// Nguyên văn `docs/25_TODO_ROADMAP.md` (PHASE 6 — TỔ ĐỘI):
//   • `TM-01` «Danh sách: mã · tên · trạng thái · thành viên · dự án · hoạt động gần nhất»
//   • `TM-02` «Ưu tiên sắp xếp: ĐANG HOẠT ĐỘNG → hoạt động gần nhất ↓ → ngừng»
//   • `TM-03` «Chi tiết: thông tin · nhân sự · dự án · kho · cấp phát · lịch sử»
//   • `TM-04` «CRUD đầy đủ: tạo · xem · sửa · ngừng (theo quyền)»
//   • `TM-05` «Tab Cấp phát — dùng lại logic cấp phát kho nếu tương thích»
//
// ⚠️ HAI SỰ THẬT ĐÃ ĐO — KHÔNG ĐƯỢC LÀM LẠI SAI (xem `docs/agent-progress/TASK-101.md`):
//   1. `team_members` trên CSDL THẬT **KHÔNG phải 0 dòng** (6 dòng / 5 `active=1`) — roadmap ghi «hiện 0 dòng» là
//      TIỀN ĐỀ SAI, đã đính chính ở `TASK-101.md` §TM-06.
//   2. Khoá `teamMembers` là **Java-only**: `scripts/system-route.mjs` KHÔNG có `team_members`/`teamMembers`
//      (grep = 0) ⇒ trên stack JS màn này **THIẾU nguồn thành viên**. Vì vậy mọi chỗ thiếu nguồn phải hiện
//      **«chưa có nguồn»** kèm LÝ DO — **TUYỆT ĐỐI KHÔNG bịa số, KHÔNG hiện 0 giả**.
//
// NGUỒN DỮ LIỆU ĐÃ ĐỐI CHIẾU (chỉ đọc, KHÔNG thêm khoá payload, KHÔNG bảng/cột mới, KHÔNG migration):
//   • `teams[]`            — `id · code · name · trade · projectId · warehouseId` (`scripts/system-route.mjs:634`)
//   • `teamMembers[]`      — `teamId · userId · roleInTeam · joinedAt · leftAt · active · fullName · employeeCode ·
//                            roleName · department` (`BootstrapDataAdapter.java:1200` — **khoá Java-only**)
//   • `projects[]`         — `id · code · name` (`:612` vùng dự án) · `warehouses[]` — `:644`
//   • `issues[]`           — `issueNo · teamId · issuedAt · status · receivedByName · totalQty` (`:671`)
//   • `returns[]`          — `returnNo · teamId · returnedAt · status · returnedByName` (`:677`)
//   • `requests[]`         — `requestNo · projectId · requestedAt · status · requestedBy` (`:611`)
//   • `teamSettlements[]`  — `teamId · status · settlementNo` (`:722`)
//   • `audits[]`           — `entityType · entityId · action · occurredAt · userName` (`:756`, **CHỈ admin**)
//
// KHỐI THUẦN nằm giữa hai mốc `TM-PURE-BEGIN/END` để 6 test hợp đồng (`tests/tm0*.test.mjs`) TRÍCH RA, dịch
// TS→JS bằng esbuild rồi CHẠY THẬT trên fixtures — đúng kỷ luật `tests/t09-task-team-member.test.mjs`.

import { DataTable, ListToolbar, StatusBadge } from "@/app/components/ui";
import { CardHead, Empty, Kpi, date } from "@/lib/ui-shared";
import { isAdminUser } from "@/lib/permissions";
import type { AppData, Row } from "@/lib/ui-shared";
import { useState } from "react";

// -------------------------------------------------------------------------------------------------
// TM-PURE-BEGIN
// KHỐI THUẦN (không JSX, không import) — test TRÍCH RA và CHẠY THẬT.
// -------------------------------------------------------------------------------------------------

// Nhãn DÙNG CHUNG cho mọi trường hợp "không có nguồn" (khớp `NO_SOURCE_TEXT` của `T-09` / `INVENTORY_NO_SOURCE` `W-04`).
const NO_SOURCE_TEXT = "chưa có nguồn";
// Trạng thái tổ đội — nguyên văn cột `teams.active` (`tinyint(1) NOT NULL DEFAULT 1`).
const TEAM_ACTIVE_LABEL = "Đang hoạt động";
const TEAM_STOPPED_LABEL = "Đã ngừng";

// `TM-01` — ĐÚNG 6 CỘT theo nguyên văn yêu cầu, MỖI CỘT khai NGUỒN THẬT của nó.
// Thứ tự ở đây là thứ tự hiển thị và là thứ tự test hợp đồng đối chiếu.
const TEAM_LIST_COLUMNS = [
  { key: "code", header: "Mã tổ đội", source: "teams.code" },
  { key: "name", header: "Tên tổ đội", source: "teams.name" },
  { key: "status", header: "Trạng thái", source: "teams.active (tinyint(1), DEFAULT 1)" },
  { key: "members", header: "Thành viên", source: "team_members WHERE active=1 AND left_at IS NULL" },
  { key: "project", header: "Dự án", source: "teams.project_id → projects.id" },
  { key: "lastActivity", header: "Hoạt động gần nhất", source: "max(issuedAt · returnedAt) của phiếu cùng teamId" },
];

// `TM-03` — ĐÚNG 6 TAB theo nguyên văn yêu cầu (thứ tự nguyên văn: thông tin · nhân sự · dự án · kho · cấp phát · lịch sử).
const TEAM_TABS = ["Thông tin", "Nhân sự", "Dự án", "Kho", "Cấp phát", "Lịch sử"];

// `TM-02` — thứ tự ưu tiên nguyên văn: ĐANG HOẠT ĐỘNG (0) → hoạt động gần nhất ↓ → ngừng (1).
const TEAM_RANK_ACTIVE = 0;
const TEAM_RANK_STOPPED = 1;

// `TM-04` — ÁNH XẠ THAO TÁC → CAPABILITY. Nguồn: `java-backend/application/src/main/java/com/vntech/erp/application/rbac/ActionRbacRegistry.java`
// (registry THẬT đang cưỡng chế ở route ĐANG PHỤC VỤ — cổng 9000/18081):
//   `:39` create_project_team → module `site_command` · `:233` → capability `canUse`
//   `:190` set_project_team_status → module `site_command` · `:379` → capability `canUse`
//   `:73` delete_project_team → module `site_command` · `:264` → capability `canUse`
//   `:89` issue_stock → modules `teams` + `warehouse_issue` (đây là "logic cấp phát kho" ở `TM-05`)
const TEAM_ACTION_GATES = [
  { action: "create_project_team", label: "Tạo tổ đội", module: "site_command", capability: "canUse" },
  { action: "set_project_team_status", label: "Ngừng / khôi phục tổ đội", module: "site_command", capability: "canUse" },
  { action: "delete_project_team", label: "Xoá tổ đội chưa phát sinh giao dịch", module: "site_command", capability: "canUse" },
];

// `TM-05` — TÁI DÙNG THẬT "logic cấp phát kho": CHÍNH 2 bảng + 2 cột mà luồng cấp phát ghi vào.
//   Lượt XUẤT: `issue_stock` (`scripts/system-route.mjs:1653`) INSERT `stock_issues` (`:1653`) + `stock_issue_items` (`:1654`),
//   và `stock_issue_items.installed_qty` được `confirm_installation` (`:1663`) tăng lên.
//   Lượt HOÀN: `return_stock` (`:1658`) INSERT `material_returns` + `material_return_items`.
//   Cả hai chứng từ mang ĐÚNG `team_id` của tổ đội (`:1653` cột `team_id`, `:1658` cột `team_id`) ⇒ tab Cấp phát đọc lại
//   chính hai nguồn đó, KHÔNG dựng bảng/sổ mới.
const TEAM_ALLOCATION_SOURCES = [
  { key: "issues", label: "Phiếu xuất kho cho tổ đội", table: "stock_issues + stock_issue_items", action: "issue_stock", keyField: "issueNo", atField: "issuedAt", whoField: "receivedByName", qtyField: "totalQty", installedField: "installedQty" },
  { key: "returns", label: "Phiếu hoàn trả vật tư", table: "material_returns + material_return_items", action: "return_stock", keyField: "returnNo", atField: "returnedAt", whoField: "returnedByName", qtyField: "totalQty" },
];
// Cột nhập/xuất của TAB KHO (`TM-03`) cũng lấy từ `inventory[]` — cùng khoá tồn kho mà màn Kho đang dùng.
const TEAM_WAREHOUSE_STOCK_FIELDS = { balance: "inventory[].balance", available: "inventory[].available", reserved: "inventory[].reserved" };

/**
 * Cắt chuỗi ngày về `YYYY-MM-DD` — dùng để SO SÁNH và để hiển thị lại.
 * ⚠️ CỐ Ý cắt BẰNG CHUỖI, KHÔNG qua `new Date(...)`: payload có mốc ISO `2026-09-08T00:00:00.000Z` mà
 * `new Date().toISOString()` sẽ DỜI NGÀY sang 07/09 ở múi giờ UTC+7 ⇒ "hoạt động gần nhất" lệch một ngày
 * (lỗi đã bị `tests/tm02-team-sort.test.mjs` bắt ở lượt chạy đầu). Mốc ngày trong payload đã là ngày nghiệp vụ.
 */
function tmDayKey(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const match = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : "";
}

/** `TM-02`: tổ đội đang hoạt động ⇔ `active !== 0` (đúng cách màn cũ đọc `teams.active`). */
function tmIsActive(team: Row) {
  return Number(team?.active ?? 1) !== 0;
}

/**
 * `TM-01` cột «Hoạt động gần nhất» — TÍNH TỪ CHỨNG TỪ THẬT, không lấy `teams.updated_at`
 * (cột đó bị mọi thao tác hệ thống chạm vào nên không phải "hoạt động của tổ đội").
 * Trả `{ value, source, day }`; KHÔNG có chứng từ nào ⇒ `value` rỗng + `source` ghi «chưa có nguồn».
 */
function tmLastActivity(team: Row, issues: Row[], returns: Row[]) {
  const teamId = String(team?.id ?? "");
  let day = "";
  const parts: string[] = [];
  const scan = (rows: Row[], atField: string, label: string) => {
    const days = (rows || [])
      .filter((row) => String(row?.teamId ?? "") === teamId)
      .map((row) => tmDayKey(row?.[atField]))
      .filter(Boolean)
      .sort();
    if (!days.length) return;
    const latest = days[days.length - 1];
    parts.push(`${label} ${latest}`);
    // Lấy NGÀY LỚN NHẤT giữa MỌI nguồn chứng từ (đối chứng âm ở `tm02` bắt được lỗi "last write wins").
    if (!day || latest > day) day = latest;
  };
  scan(issues, "issuedAt", "Xuất");
  scan(returns, "returnedAt", "Hoàn");
  return {
    day,
    value: day || "",
    source: day ? `stock_issues.issued_at · material_returns.returned_at — ${parts.join(" · ")}` : `${NO_SOURCE_TEXT} — tổ đội này chưa có phiếu xuất/hoàn nào mang teamId của nó`,
  };
}

/**
 * `TM-01` cột «Thành viên» — nguồn THẬT là `team_members` (khoá `teamMembers`).
 * ⚠️ Trên stack JS khoá này VẮNG (Java-only) ⇒ `{ known: false }` và UI phải ghi «chưa có nguồn»,
 * TUYỆT ĐỐI không hiện `0 người` (số 0 đó là "không biết", không phải "không có ai").
 */
function tmMemberSummary(team: Row, teamMembers: Row[] | undefined) {
  const teamId = String(team?.id ?? "");
  if (!Array.isArray(teamMembers)) {
    return { known: false, active: 0, left: 0, source: `${NO_SOURCE_TEXT} — payload không có khoá teamMembers: bảng team_members là khoá Java-only (scripts/system-route.mjs KHÔNG đọc team_members, chỉ BootstrapDataAdapter.java:1200 trả khoá này)` };
  }
  const all = teamMembers.filter((member) => String(member?.teamId ?? "") === teamId);
  const active = all.filter((member) => Number(member?.active ?? 1) === 1 && !member?.leftAt);
  const left = all.filter((member) => Number(member?.active ?? 1) === 0 || Boolean(member?.leftAt));
  return { known: true, active: active.length, left: left.length, source: `team_members.team_id — ${all.length}/${(teamMembers || []).length} dòng có giá trị` };
}

/**
 * `TM-02` — SO SÁNH ƯU TIÊN, một nguồn sự thật duy nhất cho cả sắp xếp lẫn test.
 * Thứ tự nguyên văn: ĐANG HOẠT ĐỘNG → hoạt động gần nhất ↓ → ngừng.
 * (Tổ đội đã ngừng LUÔN xếp sau, kể cả khi có hoạt động mới hơn — đúng chữ "→ ngừng" ở cuối.)
 */
function tmCompare(a: { active: boolean; lastAt: string; code: string }, b: { active: boolean; lastAt: string; code: string }) {
  const rank = (item: { active: boolean }) => (item.active ? TEAM_RANK_ACTIVE : TEAM_RANK_STOPPED);
  if (rank(a) !== rank(b)) return rank(a) - rank(b);
  // "CHƯA CÓ HOẠT ĐỘNG" (ngày rỗng) phải xếp SAU mọi tổ đội có ngày thật trong cùng nhóm trạng thái.
  // ⚠️ KHÔNG thể để `localeCompare` tự xử: nó coi chuỗi rỗng là NHỎ NHẤT ⇒ ở chiều GIẢM DẦN, `""` sẽ nhảy
  // LÊN ĐẦU. Đúng lỗi này đã bị `tests/tm02-team-sort.test.mjs` bắt ở lượt chạy đầu (đối chứng âm có tác dụng).
  const left = String(a.lastAt || "");
  const right = String(b.lastAt || "");
  if (left !== right) {
    if (!left) return 1;
    if (!right) return -1;
    return right.localeCompare(left);
  }
  return String(a.code || "").localeCompare(String(b.code || ""));
}

/** Dựng BẢNG TỔNG HỢP cho danh sách (`TM-01`) — mọi ô đều từ DÒNG THẬT, kèm cờ `known`. */
function teamListRows(data: AppData) {
  const teams: Row[] = data.teams || [];
  const members: Row[] | undefined = data.teamMembers;
  const issues: Row[] = data.issues || [];
  const returns: Row[] = data.returns || [];
  const projects: Row[] = data.projects || [];
  const memberSource = tmMemberSummary({ id: "—" }, members).source;
  const rows = teams.map((team) => {
    const project = projects.find((item) => String(item.id) === String(team.projectId));
    const member = tmMemberSummary(team, members);
    const activity = tmLastActivity(team, issues, returns);
    return {
      id: String(team.id ?? ""),
      code: String(team.code ?? ""),
      name: String(team.name ?? ""),
      trade: String(team.trade ?? ""),
      active: tmIsActive(team),
      statusLabel: tmIsActive(team) ? TEAM_ACTIVE_LABEL : TEAM_STOPPED_LABEL,
      membersKnown: member.known,
      activeMembers: member.active,
      leftMembers: member.left,
      membersSource: member.source,
      projectCode: String(project?.code ?? ""),
      projectName: String(project?.name ?? ""),
      projectKnown: Boolean(project),
      // MT2-P10-01 (§8) — «Filter theo dự án» phải lọc theo `projectId` THẬT (`teams.project_id`),
      // ⛔ không lọc bằng chuỗi mã dự án đã hiển thị (mã rỗng/trùng sẽ lọc sai).
      projectId: String(team.projectId ?? ""),
      lastActivityAt: activity.value,
      lastActivitySource: activity.source,
      stoppedShownInPayload: true,
    };
  });
  // `TM-02` áp ngay ở tầng dữ liệu ⇒ bảng và test dùng CHUNG một thứ tự.
  return rows.sort((a, b) => tmCompare({ active: a.active, lastAt: a.lastActivityAt, code: a.code }, { active: b.active, lastAt: b.lastActivityAt, code: b.code })).map((row) => ({ ...row, memberSourceSummary: memberSource }));
}

/** Ghi chú NGUỒN của từng cột — UI in ra để người dùng biết số nào có thật, số nào không. */
function teamListSourceNotes(data: AppData) {
  const members: Row[] | undefined = data.teamMembers;
  const issues: Row[] = data.issues || [];
  const teamIds = new Set((data.teams || []).map((team) => String(team.id)));
  const issuesMatched = issues.filter((row) => teamIds.has(String(row.teamId))).length;
  return {
    members: Array.isArray(members)
      ? `team_members — ${members.length} dòng trong payload`
      : `${NO_SOURCE_TEXT} — payload KHÔNG có khoá teamMembers (Java-only: scripts/system-route.mjs không đọc team_members)`,
    lastActivity: issues.length
      ? `stock_issues · material_returns — ${issuesMatched}/${issues.length} phiếu xuất mang teamId của tổ đội`
      : `${NO_SOURCE_TEXT} — payload không có phiếu xuất/hoàn nào`,
    stoppedTeams: `${NO_SOURCE_TEXT} — payload bootstrap chỉ trả tổ đội đang hoạt động (teams WHERE active=1, scripts/system-route.mjs:634) nên KHÔNG thể khẳng định "không còn tổ đội đã ngừng"`,
  };
}

/** `TM-04` — CỔNG QUYỀN cho MỘT người dùng. Chỉ ĐỌC capability ĐÃ CÓ; KHÔNG tự nghĩ ra quyền mới.
 *
 * ⚠️ HAI CHỖ GÃY ĐÃ ĐO — GHI RÕ, KHÔNG DỰNG NÚT GIẢ:
 *   (a) **THIẾU ACTION «sửa tổ đội»**: đã grep cả 2 route (`scripts/system-route.mjs` + `SystemController.java`)
 *       — KHÔNG có `update_project_team`/`save_project_team`/`edit_project_team`/`rename_team`. Vì vậy
 *       `canEdit = false` LUÔN LUÔN và UI KHÔNG có nút «Sửa» (nút giả = bấm không có gì xảy ra — đúng lớp lỗi
 *       đã gặp ở KP #90). Muốn có nhánh «sửa» phải thêm action ⇒ **ngoài phạm vi PHASE 6** (`scripts/**` bị CẤM).
 *       Ghi ở `docs/agent-progress/TASK-101.md` §TM-04.
 *   (b) Trước đợt này call-site `app/page.tsx` **KHÔNG truyền `action`/`permission`** cho màn Tổ đội ⇒ mọi thao
 *       tác ghi là BẤT KHẢ. Nay call-site truyền cả hai; hợp đồng `tests/tm04-team-crud.test.mjs` giữ điều đó.
 */
function teamGates(isAdmin: boolean, permission: Row | undefined) {
  const caps = permission || {};
  const allow = (capability: string) => Boolean(isAdmin || caps?.[capability]);
  return {
    isAdmin: Boolean(isAdmin),
    canView: Boolean(isAdmin || caps?.canView || caps?.canUse),
    canCreate: allow("canUse"),
    canStop: allow("canUse"),
    canDelete: allow("canUse"),
    canEdit: false,
  };
}

/**
 * `TM-03` — 6 TAB của chi tiết, mỗi tab khai NGUỒN THẬT. Trả mảng có THỨ TỰ nguyên văn để test đối chiếu.
 * `available=false` ⇔ tab chưa có nguồn dữ liệu ⇒ UI hiện «chưa có nguồn» + lý do, không bịa.
 */
function teamDetailTabs(data: AppData, team: Row) {
  const teamId = String(team?.id ?? "");
  const members: Row[] | undefined = data.teamMembers;
  const myMembers = Array.isArray(members) ? members.filter((member) => String(member.teamId ?? "") === teamId) : [];
  const project = (data.projects || []).find((item) => String(item.id) === String(team?.projectId));
  const warehouse = (data.warehouses || []).find((item) => String(item.id) === String(team?.warehouseId));
  const inventory = (data.inventory || []).filter((item) => String(item.warehouseId) === String(team?.warehouseId));
  const issues = (data.issues || []).filter((item) => String(item.teamId) === teamId);
  const returns = (data.returns || []).filter((item) => String(item.teamId) === teamId);
  // KHÔNG lọc `requests` ở đây: phiếu đề nghị KHÔNG mang `team_id` (đo trên dữ liệu thật: `teamId` NULL ở 4/4
  // phiếu) nên nó chỉ thuộc tab «Cấp phát» dưới dạng lọc theo DỰ ÁN — xem nhánh `tab === 4` của phần UI.
  const teamAudits = (data.audits || []).filter((item) => String(item.entityType) === "team" && String(item.entityId) === teamId);
  const tab = (label: string, source: string, count: number, available: boolean, noSourceReason = "") =>
    ({ label, source, count, available, noSourceReason });
  return [
    tab(TEAM_TABS[0], "teams (id · code · name · trade · project_id · warehouse_id · active) + users.full_name (tổ trưởng)", 1, true),
    tab(TEAM_TABS[1], "team_members WHERE team_id=? (joined_at · left_at · role_in_team · active)", myMembers.length, Array.isArray(members),
      Array.isArray(members) ? "" : `payload KHÔNG có khoá teamMembers (Java-only) — ${NO_SOURCE_TEXT}`),
    tab(TEAM_TABS[2], "teams.project_id → projects (1 dự án / 1 tổ đội theo mô hình hiện hành)", project ? 1 : 0, true),
    tab(TEAM_TABS[3], "teams.warehouse_id → warehouses + inventory[].balance/available/reserved của kho tổ đội", warehouse ? 1 : 0, Boolean(warehouse && inventory.length),
      warehouse ? (inventory.length ? "" : `kho có thật nhưng inventory[] không có dòng nào cho kho này — ${NO_SOURCE_TEXT}`) : `teams.warehouse_id không trỏ tới kho nào trong payload — ${NO_SOURCE_TEXT}`),
    tab(TEAM_TABS[4], "stock_issues.team_id + material_returns.team_id (2 bảng logic cấp phát kho TÁI DÙNG)", issues.length + returns.length, true),
    tab(TEAM_TABS[5], "audit_logs WHERE entity_type='team' (bootstrap :756 — CHỈ admin nhận khoá audits[])", teamAudits.length, teamAudits.length > 0,
      `payload không có dòng audit_logs nào cho entity_type='team' (khoá audits[] chỉ admin nhận — scripts/system-route.mjs:756) — ${NO_SOURCE_TEXT}`),
  ];
}

/** `TM-05` — tab Cấp phát: bảng dữ liệu TÁI DÙNG + NGUỒN của từng loại chứng từ. */
function teamAllocations(data: AppData, team: Row) {
  const teamId = String(team?.id ?? "");
  const issues = (data.issues || []).filter((item) => String(item.teamId) === teamId);
  const returns = (data.returns || []).filter((item) => String(item.teamId) === teamId);
  return TEAM_ALLOCATION_SOURCES.map((source) => {
    const rows = source.key === "issues" ? issues : returns;
    return { ...source, rows, total: rows.length };
  });
}

/** `TM-03` tab Lịch sử — đếm theo NGUỒN THẬT, nguồn nào vắng thì ghi rõ. */
function teamHistory(data: AppData, team: Row) {
  const teamId = String(team?.id ?? "");
  const teamAudits = (data.audits || []).filter((item) => String(item.entityType) === "team" && String(item.entityId) === teamId);
  const settled = (data.teamSettlements || []).filter((item) => String(item.teamId) === teamId);
  const contracts = (data.teamSubcontracts || []).filter((item) => String(item.teamId) === teamId);
  return {
    auditRowsAvailable: Boolean(data.audits && data.audits.length) || Array.isArray(data.audits),
    audits: teamAudits,
    settlements: settled,
    subcontracts: contracts,
    source: "audit_logs (entity_type='team') · team_settlements · team_subcontracts",
  };
}
// TM-PURE-END

// -------------------------------------------------------------------------------------------------
// PHẦN UI — chỉ đọc dữ liệu đã có trong `AppData`, KHÔNG gọi API mới.
// -------------------------------------------------------------------------------------------------

type TeamDirectoryProps = {
  data: AppData;
  action: (name: string, payload: Row) => Promise<boolean>;
  permission?: Row;
};

function TeamDirectory({ data, action, permission }: TeamDirectoryProps) {
  const [view, setView] = useState<"list" | "detail">("list");
  const [detailId, setDetailId] = useState("");
  const [tab, setTab] = useState(0);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState("");
  // MT2-P10-01 (§8) — «Filter theo dự án» của DANH SÁCH TỔ ĐỘI. §8 chỉ yêu cầu ĐÚNG 2 thứ:
  // danh sách tổ đội + filter theo dự án ⇒ ⛔ KHÔNG thêm nghiệp vụ/sort/cột nào ngoài phạm vi (§14).
  const [projectFilter, setProjectFilter] = useState("ALL");

  const teams: Row[] = data.teams || [];
  // `activePermission` của `modulePermission(data, "teams")` (do `app/page.tsx` truyền) đã trả sẵn TOÀN QUYỀN
  // khi `isAdminUser(data.user)` (`lib/permissions.ts:16`) ⇒ chỉ cần thêm cờ `isAdmin` để `teamGates` phản ánh
  // đúng nguồn quyền, KHÔNG hardcode vai trò ở màn này.
  const gates = teamGates(Boolean(permission?.isAdmin) || isAdminUser(data.user), permission);
  const notes = teamListSourceNotes(data);
  const projectOf = (id: unknown) => (data.projects || []).find((item) => String(item.id) === String(id));
  const warehouseOf = (id: unknown) => (data.warehouses || []).find((item) => String(item.id) === String(id));
  const userOf = (id: unknown) => (data.staffDirectory || []).concat(data.users || []).find((item) => String(item.id) === String(id));

  // MT2-P10-01 (§8) — LỌC TẠI NGUỒN: `rows` được dùng cho CẢ số lượng lẫn bảng ⇒ lọc ở đây thì
  // mọi nơi tiêu thụ đều theo dự án đã chọn (không phải sửa từng chỗ hiển thị).
  const rows = teamListRows(data)
    .filter((row) => projectFilter === "ALL" || row.projectId === projectFilter)
    .filter((row) => !q.trim()
      || `${row.code} ${row.name} ${row.trade} ${row.projectCode} ${row.projectName}`
        .toLocaleLowerCase("vi").includes(q.trim().toLocaleLowerCase("vi")));

  const detail = teams.find((item) => String(item.id) === String(detailId));
  const runAction = async (name: string, payload: Row) => {
    setBusy(name);
    try { return await action(name, payload); } finally { setBusy(""); }
  };

  // `TM-01` — ô «Thành viên»: CÓ nguồn ⇒ số thật; KHÔNG nguồn ⇒ «chưa có nguồn», không hiện 0.
  const memberCell = (row: ReturnType<typeof teamListRows>[number]) => row.membersKnown
    ? <>{row.activeMembers} người{row.leftMembers > 0 && <small> · {row.leftMembers} đã rời</small>}</>
    : <span className="muted">{NO_SOURCE_TEXT}<small> · {row.membersSource}</small></span>;
  // `TM-01` — ô «Hoạt động gần nhất»: có chứng từ ⇒ ngày thật; không ⇒ «chưa có nguồn» + lý do.
  const activityCell = (row: ReturnType<typeof teamListRows>[number]) => row.lastActivityAt
    ? <>{date(row.lastActivityAt)}<small> · {row.lastActivitySource}</small></>
    : <span className="muted">{NO_SOURCE_TEXT}<small> · {row.lastActivitySource}</small></span>;

  if (view === "detail" && detail) {
    const tid = String(detail.id);
    const tabs = teamDetailTabs(data, detail);
    const project = projectOf(detail.projectId);
    const warehouse = warehouseOf(detail.warehouseId);
    const leader = userOf(detail.leaderUserId);
    const members: Row[] = (data.teamMembers || []).filter((member) => String(member.teamId) === tid);
    const activeMembers = members.filter((member) => Number(member.active ?? 1) === 1 && !member.leftAt);
    const pastMembers = members.filter((member) => Number(member.active ?? 1) === 0 || Boolean(member.leftAt));
    const allocations = teamAllocations(data, detail);
    const history = teamHistory(data, detail);
    const stockRows = (data.inventory || []).filter((item) => String(item.warehouseId) === String(detail.warehouseId));

    return <div className="stack team-management" data-team-detail={tid}>
      <section className="card project-detail-head">
        <div className="table-toolbar">
          <div>
            <strong>{detail.code} · {detail.name}</strong>
            <span>{detail.trade || "Chưa ghi hạng mục"} · {project?.code || "Chưa gắn dự án"} · {Number(detail.active ?? 1) === 0 ? TEAM_STOPPED_LABEL : TEAM_ACTIVE_LABEL}</span>
          </div>
          <div className="row-actions">
            {gates.canStop && <button type="button" className="secondary" disabled={busy !== ""} onClick={() => void runAction("set_project_team_status", { teamId: tid, active: Number(detail.active ?? 1) === 0 })}>{Number(detail.active ?? 1) === 0 ? "Khôi phục tổ đội" : "Ngừng tổ đội"}</button>}
            <button type="button" className="page-back" onClick={() => setView("list")}>← Quay lại danh sách</button>
          </div>
        </div>
        <div className="project-scope-tabs" role="tablist">
          {tabs.map((item, index) => <button key={item.label} type="button" role="tab" aria-selected={tab === index} className={tab === index ? "active" : ""} onClick={() => setTab(index)}>{item.label}{item.available && item.count ? ` (${item.count})` : ""}</button>)}
        </div>
      </section>

      {tab === 0 && <div className="stack">
        <div className="kpi-grid small">
          <Kpi icon="TD" label="Dự án" value={project?.code || "—"} note={project?.name || "Chưa gắn dự án"} tone="blue" />
          <Kpi icon="K" label="Kho của tổ đội" value={warehouse?.code || "—"} note={warehouse?.name || "Chưa có kho riêng"} tone="violet" />
          <Kpi icon="TV" label="Thành viên" value={tabs[1].available ? String(activeMembers.length) : NO_SOURCE_TEXT} note={tabs[1].available ? `${pastMembers.length} người đã rời` : tabs[1].noSourceReason} tone="green" />
          <Kpi icon="TT" label="Trạng thái" value={Number(detail.active ?? 1) === 0 ? TEAM_STOPPED_LABEL : TEAM_ACTIVE_LABEL} note={Number(detail.active ?? 1) === 0 ? "Không còn nhận việc" : "Đang nhận cấp phát vật tư"} tone={Number(detail.active ?? 1) === 0 ? "red" : "green"} />
        </div>
        <section className="card">
          <CardHead title="Thông tin tổ đội" note="Mọi dòng ghi rõ NGUỒN THẬT (bảng.cột) — không suy diễn" />
          <div className="table-wrap"><table className="baseline-table"><thead><tr><th>Hạng mục</th><th>Giá trị</th><th>Nguồn</th></tr></thead><tbody>
            <tr><td>Mã tổ đội</td><td><strong className="code">{detail.code}</strong></td><td><small>teams.code</small></td></tr>
            <tr><td>Tên tổ đội</td><td>{detail.name}</td><td><small>teams.name</small></td></tr>
            <tr><td>Hạng mục</td><td>{detail.trade || "—"}</td><td><small>teams.trade</small></td></tr>
            <tr><td>Tổ trưởng</td><td>{leader?.fullName || <span className="muted">{NO_SOURCE_TEXT}<small> · teams.leader_user_id = {String(detail.leaderUserId || "NULL")} không tra được trong staffDirectory/users</small></span>}</td><td><small>teams.leader_user_id → users.full_name</small></td></tr>
            <tr><td>Trạng thái</td><td><StatusBadge value={Number(detail.active ?? 1) === 0 ? TEAM_STOPPED_LABEL : TEAM_ACTIVE_LABEL} /></td><td><small>teams.active</small></td></tr>
          </tbody></table></div>
        </section>
        <section className="card">
          <CardHead title="Nguồn dữ liệu của 6 tab" note="Tab nào thiếu nguồn thì nêu rõ lý do — không hiện số 0 thay cho «không biết»" />
          <DataTable rows={tabs} rowKey={(row) => row.label} columns={[
            { key: "c1", header: "Tab", render: (row) => <strong>{row.label}</strong> },
            { key: "c2", header: "Số dòng", render: (row) => row.available ? String(row.count) : <span className="muted">{NO_SOURCE_TEXT}</span> },
            { key: "c3", header: "Nguồn", render: (row) => <small>{row.source}</small> },
            { key: "c4", header: "Ghi chú", render: (row) => row.noSourceReason ? <small>{row.noSourceReason}</small> : "—" },
          ]} emptyText="Không có tab nào." />
        </section>
      </div>}

      {tab === 1 && <div className="stack">
        <section className="card">
          <CardHead title="Nhân sự — thành viên đang hoạt động" note={tabs[1].available ? "Sắp theo NGÀY THAM GIA · nguồn team_members" : tabs[1].noSourceReason} />
          {tabs[1].available
            ? <DataTable rows={[...activeMembers].sort((a, b) => tmCompare({ active: true, lastAt: tmDayKey(a.joinedAt), code: "" }, { active: true, lastAt: tmDayKey(b.joinedAt), code: "" }))} rowKey={(member) => String(member.id)} emptyText="Tổ đội chưa ghi nhận thành viên đang hoạt động." columns={[
              { key: "c1", header: "Họ tên", render: (member) => <strong>{member.fullName || member.userId || "—"}</strong> },
              { key: "c2", header: "Mã NV", render: (member) => member.employeeCode || "—" },
              { key: "c3", header: "Chức vụ", render: (member) => member.roleName || member.role || "—" },
              { key: "c4", header: "Phòng ban", render: (member) => member.department || "—" },
              { key: "c5", header: "Vai trò trong tổ đội", render: (member) => member.roleInTeam || "Thành viên" },
              { key: "c6", header: "Ngày tham gia", render: (member) => (member.joinedAt ? date(member.joinedAt) : "—") },
              { key: "c7", header: "Ngày rời", render: (member) => (member.leftAt ? date(member.leftAt) : "—") },
            ]} />
            : <Empty text={`${NO_SOURCE_TEXT} — payload bootstrap KHÔNG trả khoá teamMembers nên màn này không thể đếm sĩ số. Lý do: bảng team_members chỉ có đường ĐỌC ở Java (BootstrapDataAdapter), scripts/system-route.mjs không đọc bảng này.`} />}
        </section>
        {tabs[1].available && pastMembers.length > 0 && <section className="card">
          <CardHead title="Nhân sự — đã rời tổ đội" note="Lưu vết thời gian tham gia và rời đi (team_members.left_at · active=0)" />
          <DataTable rows={pastMembers} rowKey={(member) => String(member.id)} columns={[
            { key: "c1", header: "Họ tên", render: (member) => <strong>{member.fullName || member.userId || "—"}</strong> },
            { key: "c2", header: "Vai trò", render: (member) => member.roleInTeam || "Thành viên" },
            { key: "c3", header: "Ngày tham gia", render: (member) => (member.joinedAt ? date(member.joinedAt) : "—") },
            { key: "c4", header: "Ngày rời", render: (member) => (member.leftAt ? date(member.leftAt) : "—") },
          ]} emptyText="Không có ai đã rời." />
        </section>}
      </div>}

      {tab === 2 && <div className="stack">
        <section className="card">
          <CardHead title="Dự án tổ đội thuộc về" note="Mô hình hiện hành: mỗi tổ đội thuộc ĐÚNG MỘT dự án (teams.project_id NOT NULL)" />
          <DataTable rows={project ? [project] : []} rowKey={(row) => String(row.id)} emptyText="Tổ đội chưa gắn dự án nào." columns={[
            { key: "c1", header: "Mã dự án", render: (row) => <strong className="code">{row.code}</strong> },
            { key: "c2", header: "Tên dự án", render: (row) => row.name },
            { key: "c3", header: "Bắt đầu", render: (row) => date(row.startDate) },
            { key: "c4", header: "Kết thúc dự kiến", render: (row) => date(row.plannedEndDate) },
          ]} />
        </section>
      </div>}

      {tab === 3 && <div className="stack">
        <section className="card">
          <CardHead title="Kho của tổ đội" note={warehouse ? `${TEAM_WAREHOUSE_STOCK_FIELDS.balance} · ${TEAM_WAREHOUSE_STOCK_FIELDS.available} · ${TEAM_WAREHOUSE_STOCK_FIELDS.reserved}` : `teams.warehouse_id không trỏ tới kho nào trong payload — ${NO_SOURCE_TEXT}`} />
          <DataTable rows={warehouse ? [warehouse] : []} rowKey={(row) => String(row.id)} emptyText={`${NO_SOURCE_TEXT} — không tra được kho từ teams.warehouse_id trong payload.`} columns={[
            { key: "c1", header: "Mã kho", render: (row) => <strong className="code">{row.code}</strong> },
            { key: "c2", header: "Tên kho", render: (row) => row.name },
            { key: "c3", header: "Loại", render: (row) => (row.type === "team" ? "Kho tổ đội" : row.type === "site" ? "Kho công trường" : row.type === "central" ? "Kho tổng" : String(row.type || "—")) },
            { key: "c4", header: "Dự án", render: (row) => projectOf(row.projectId)?.code || "—" },
          ]} />
        </section>
        <section className="card">
          <CardHead title="Tồn kho tại kho của tổ đội" note={stockRows.length ? `${stockRows.length} dòng inventory[]` : `inventory[] không có dòng nào cho kho này — ${NO_SOURCE_TEXT}`} />
          <DataTable rows={stockRows} rowKey={(row, index) => String(row.materialId || index)} emptyText={`${NO_SOURCE_TEXT} — payload không có dòng tồn kho nào cho kho của tổ đội (kho có thể chưa phát sinh nhập/xuất).`} columns={[
            { key: "c1", header: "Mã vật tư", render: (row) => <strong className="code">{row.materialCode || row.materialId}</strong> },
            { key: "c2", header: "Tên vật tư", render: (row) => row.materialName || "—" },
            { key: "c3", header: "ĐVT", render: (row) => row.unit || "—" },
            { key: "c4", header: "Tồn", render: (row) => String(row.balance ?? "—") },
            { key: "c5", header: "Khả dụng", render: (row) => String(row.available ?? "—") },
            { key: "c6", header: "Giữ chỗ", render: (row) => String(row.reserved ?? "—") },
          ]} />
        </section>
      </div>}

      {tab === 4 && <div className="stack">
        <section className="card">
          <CardHead title="TÁI DÙNG logic cấp phát kho" note={`Hai nguồn dưới đây CHÍNH LÀ hai bảng mà action ${allocations.map((item) => item.action).join(" / ")} ghi vào (mang team_id của tổ đội) — KHÔNG dựng sổ/bảng mới`} />
          {allocations.map((source) => <div key={source.key} className="stack">
            <CardHead title={`${source.label} — ${source.total} chứng từ`} note={`Nguồn: ${source.table} · action ghi dữ liệu: ${source.action}`} />
            <DataTable rows={source.rows} rowKey={(row, index) => String(row.id || index)} emptyText={`${NO_SOURCE_TEXT} — chưa có ${source.label.toLowerCase()} nào mang team_id của tổ đội này.`} columns={[
              { key: "c1", header: "Số chứng từ", render: (row) => <strong className="code">{String(row[source.keyField] || row.id || "—")}</strong> },
              { key: "c2", header: "Trạng thái", render: (row) => <StatusBadge value={String(row.status || "—")} /> },
              { key: "c3", header: "Người liên quan", render: (row) => String(row[source.whoField] || "—") },
              { key: "c4", header: "Thời điểm", render: (row) => date(row[source.atField] || row.createdAt) },
              { key: "c5", header: "Số lượng", render: (row) => (source.qtyField && row[source.qtyField] !== undefined ? String(row[source.qtyField]) : "—") },
              { key: "c6", header: "Đã lắp", render: (row) => (source.installedField && row[source.installedField] !== undefined ? String(row[source.installedField]) : "—") },
            ]} />
          </div>)}
        </section>
        <section className="card">
          <CardHead title="Phiếu đề nghị mua hàng của dự án" note="Không mang team_id — lọc theo DỰ ÁN của tổ đội (teamId trong payload luôn NULL ở dữ liệu thật: 0/4 phiếu có team_id)" />
          <DataTable rows={(data.requests || []).filter((row) => String(row.projectId) === String(detail.projectId))} rowKey={(row, index) => String(row.id || index)} emptyText={`${NO_SOURCE_TEXT} — dự án của tổ đội chưa có phiếu đề nghị nào trong payload.`} columns={[
            { key: "c1", header: "Số phiếu", render: (row) => <strong className="code">{String(row.requestNo || row.id || "—")}</strong> },
            { key: "c2", header: "Trạng thái", render: (row) => <StatusBadge value={String(row.status || "—")} /> },
            { key: "c3", header: "Người đề nghị", render: (row) => String(row.requestedBy || "—") },
            { key: "c4", header: "Thời điểm", render: (row) => date(row.requestedAt || row.createdAt) },
          ]} />
        </section>
      </div>}

      {tab === 5 && <div className="stack">
        <section className="card">
          <CardHead title="Lịch sử thao tác trên tổ đội" note={history.source} />
          {history.auditRowsAvailable
            ? <DataTable rows={history.audits} rowKey={(row, index) => String(row.id || index)} emptyText={`${NO_SOURCE_TEXT} — chưa có dòng audit_logs nào cho entity_type='team' của tổ đội này.`} columns={[
              { key: "c1", header: "Thời điểm", render: (row) => date(row.occurredAt) },
              { key: "c2", header: "Hành động", render: (row) => String(row.action || "—") },
              { key: "c3", header: "Người thực hiện", render: (row) => String(row.userName || "—") },
            ]} />
            : <Empty text={`${NO_SOURCE_TEXT} — payload không có khoá audits[] cho tài khoản này. Lý do: bootstrap chỉ trả audit_logs cho ADMIN (scripts/system-route.mjs:756) và chỉ 100 dòng gần nhất toàn hệ thống.`} />}
        </section>
        <section className="card">
          <CardHead title="Hợp đồng giao khoán & quyết toán của tổ đội" note="team_subcontracts.team_id · team_settlements.team_id" />
          <DataTable rows={history.subcontracts} rowKey={(row) => String(row.id)} emptyText={`${NO_SOURCE_TEXT} — tổ đội chưa có hợp đồng giao khoán nào trong payload.`} columns={[
            { key: "c1", header: "Số HĐ", render: (row) => <strong className="code">{String(row.contractNo || "—")}</strong> },
            { key: "c2", header: "Tên/phạm vi", render: (row) => String(row.contractName || "—") },
            { key: "c3", header: "Giá trị", render: (row) => String(row.contractValue ?? "—") },
            { key: "c4", header: "Trạng thái", render: (row) => <StatusBadge value={String(row.status || "—")} /> },
            { key: "c5", header: "Quyết toán", render: (row) => (history.settlements.some((item) => String(item.subcontractId) === String(row.id)) ? "Đã quyết toán" : "Chưa quyết toán") },
          ]} />
        </section>
      </div>}
    </div>;
  }

  return <div className="stack team-management">
    <section className="card" data-vntech="team-project-filter">
      <ListToolbar
        title="DANH SÁCH TỔ ĐỘI"
        note={`${rows.length}/${teamListRows(data).length} tổ đội · mỗi tổ đội thuộc đúng một dự án`}
        count={rows.length}
        total={teamListRows(data).length}
        unit="tổ đội"
        search={{ value: q, onChange: setQ, placeholder: "Tìm mã, tên tổ đội, hạng mục, dự án…" }}
        filters={[{
          key: "project",
          label: "Dự án",
          value: projectFilter,
          onChange: setProjectFilter,
          options: [{ value: "ALL", label: "Tất cả dự án" }].concat((data.projects || []).map((project) => ({
            value: String(project.id),
            label: `${String(project.code || "")} · ${String(project.name || "")}`,
          }))),
        }]}
        actions={<>
          <button type="button" className="primary" disabled={!gates.canCreate || busy !== ""} title={gates.canCreate ? "Tạo tổ đội (action create_project_team)" : "Thiếu quyền: cần capability canUse của module site_command (ActionRbacRegistry :39/:233)"}>＋ TẠO TỔ ĐỘI</button>
        </>}
      />
      <p className="muted" data-team-sort-note="TM-02">Thứ tự ưu tiên: <strong>ĐANG HOẠT ĐỘNG</strong> → hoạt động gần nhất ↓ → ngừng.</p>
      <p className="muted" data-team-source-notes="TM-01">Nguồn: Thành viên — {notes.members} · Hoạt động gần nhất — {notes.lastActivity} · Tổ đội đã ngừng — {notes.stoppedTeams}</p>
      <DataTable rows={rows} rowKey={(row) => row.id} emptyText="Không có tổ đội phù hợp." columns={[
        { key: "code", header: TEAM_LIST_COLUMNS[0].header, render: (row) => <strong className="code">{row.code}</strong> },
        { key: "name", header: TEAM_LIST_COLUMNS[1].header, render: (row) => row.name },
        { key: "status", header: TEAM_LIST_COLUMNS[2].header, render: (row) => <StatusBadge value={row.statusLabel} /> },
        { key: "members", header: TEAM_LIST_COLUMNS[3].header, render: memberCell },
        { key: "project", header: TEAM_LIST_COLUMNS[4].header, render: (row) => (row.projectKnown ? `${row.projectCode} · ${row.projectName}` : <span className="muted">{NO_SOURCE_TEXT}<small> · teams.project_id không tra được trong projects[]</small></span>) },
        { key: "lastActivity", header: TEAM_LIST_COLUMNS[5].header, render: activityCell },
        { key: "actions", header: "", render: (row) => <button type="button" className="export-mini" onClick={() => { setDetailId(row.id); setView("detail"); setTab(0); }}>Chi tiết ›</button> },
      ]} />
    </section>
  </div>;
}

export { TeamDirectory, TEAM_LIST_COLUMNS, TEAM_TABS, TEAM_ACTION_GATES, TEAM_ALLOCATION_SOURCES, NO_SOURCE_TEXT };
export type { TeamDirectoryProps };
export default TeamDirectory;
