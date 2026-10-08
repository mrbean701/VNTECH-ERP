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
// MT3 §IV.6 — trạng thái hiển thị bằng nguồn ánh xạ DÙNG CHUNG (⛔ không lộ mã thô ra UI).
import { statusLabel } from "@/lib/status-labels";
import { isAdminUser } from "@/lib/permissions";
import type { AppData, Row } from "@/lib/ui-shared";
import { useState } from "react";
// MT3 §IV.7 + ma trận #6 — XUẤT dùng ĐÚNG thư viện dùng chung (§14), ⛔ không tự viết lại CSV/Blob.
import { downloadCsv } from "@/lib/tabular-export";

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
// MT3 §G — đúng 5 tab: Thông tin · Nhân sự · Dự án · Kho · Lịch sử.
// ⛔ Tab «Cấp phát» cũ (index 4) ĐÃ GỘP vào tab «Lịch sử» vì §G yêu cầu «Lịch sử: TỔNG HỢP tất cả
//    đơn/phiếu liên quan đến tổ đội, có Search · Sort · Filter theo loại đơn/phiếu» ⇒ chức năng
//    cấp phát/hoàn trả KHÔNG bị mất, chỉ chuyển chỗ để lọc được theo loại.
const TEAM_TABS = ["Thông tin", "Nhân sự", "Dự án", "Kho", "Lịch sử"];

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
    // MT3 §G — tab 5 «Lịch sử» nay TỔNG HỢP mọi loại chứng từ của tổ đội:
    // cấp phát (stock_issues) + hoàn trả (material_returns) + nhật ký (audit_logs).
    tab(TEAM_TABS[4], "TỔNG HỢP: stock_issues.team_id + material_returns.team_id + audit_logs(entity_type='team')", issues.length + returns.length + teamAudits.length, true,
      `payload không có chứng từ nào mang team_id của tổ đội, và audit_logs chỉ admin nhận khoá audits[] (scripts/system-route.mjs:756) — ${NO_SOURCE_TEXT}`),
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

/**
 * MT3 §G — TỔNG HỢP LỊCH SỬ TỔ ĐỘI (dùng cho tab «Lịch sử»).
 * ⛔ TUYỆT ĐỐI KHÔNG nhân dòng bằng join: mỗi chứng từ sinh **đúng 1 dòng** từ nguồn của nó
 *    (cấp phát / hoàn trả / nhật ký kiểm toán), rồi gộp bằng `concat` và sắp xếp ở tầng ảnh.
 * ⛔ Không suy diễn thêm loại chứng từ nào ngoài dữ liệu đang có trong payload.
 */
type TeamHistoryRow = { kind: "Cấp phát" | "Hoàn trả" | "Nhật ký"; at: string; code: string; title: string; detail: string; status: string };

function teamHistoryRows(data: AppData, team: Row, allocations: { key: string; label?: string; rows: Row[]; keyField?: string; whoField?: string; atField?: string; qtyField?: string }[]): TeamHistoryRow[] {
  const teamId = String(team?.id ?? "");
  const rows: TeamHistoryRow[] = [];
  // ⛔ Dùng `allocations` (đã lọc theo team_id ở tầng dữ liệu) ⇒ KHÔNG đọc khoá payload không tồn tại.
  for (const source of allocations) {
    for (const item of source.rows) {
      const kind: TeamHistoryRow["kind"] = source.key === "returns" ? "Hoàn trả" : "Cấp phát";
      rows.push({ kind,
        at: String(item[String(source.atField || "createdAt")] || item.createdAt || ""),
        code: String(item[String(source.keyField || "id")] || item.id || ""),
        title: String(item.materialName || item.materialCode || (kind === "Hoàn trả" ? "Phiếu hoàn trả" : "Phiếu cấp phát")),
        detail: String(item[String(source.whoField || "")] || item.projectCode || "—"),
        status: statusLabel(item.status) });
    }
  }
  for (const item of (data.audits || []).filter((r: Row) => String(r.entityType) === "team" && String(r.entityId) === teamId)) {
    rows.push({ kind: "Nhật ký", at: String(item.createdAt || item.occurredAt || ""), code: String(item.action || ""),
      title: String(item.detail || item.entityType || "Thay đổi"), detail: String(item.userName || item.actorName || "—"), status: "—" });
  }
  return rows;
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
  // ── MT3 §G — TAB «LỊCH SỬ» TỔNG HỢP: Search · Sort · Filter theo loại, mặc định MỚI NHẤT ──────
  // ⛔ KHÔNG nhân dòng bằng join: mỗi chứng từ gộp thành **1 dòng** từ nguồn của nó rồi SÁP XẾP Ở TẦNG ẢNH.
  const [histQuery, setHistQuery] = useState("");
  const [histType, setHistType] = useState("ALL");
  const [histSort, setHistSort] = useState("newest");
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
  // ⛔ ERP-SESSION-03 (07/10/2026) — GỠ render khối «Nguồn …» của danh sách ⇒ biến `notes` không còn
  //    dùng để in. Hàm `teamListSourceNotes()` ⛔ KHÔNG xoá (dữ liệu cho `tests/tm01`) ⇒ nay EXPORT
  //    ở cuối tệp để vẫn là một phần hợp đồng dữ liệu (và ⛔ không bị coi là biến chết).
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
    : <span className="muted">{NO_SOURCE_TEXT}</span>;
  // `TM-01` — ô «Hoạt động gần nhất»: có chứng từ ⇒ ngày thật; không ⇒ «chưa có nguồn» + lý do.
  const activityCell = (row: ReturnType<typeof teamListRows>[number]) => row.lastActivityAt
    ? <>{date(row.lastActivityAt)}</>
    : <span className="muted">{NO_SOURCE_TEXT}</span>;

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
    // MT3 §G — CHỨNG TỪ TỔNG HỢP của tổ đội đang chọn. ⛔ Mỗi chứng từ = 1 dòng (không nhân dòng join).
    const historyRows = teamHistoryRows(data, detail, allocations);
    const visibleHistory = historyRows
      .filter((r) => (histType === "ALL" || r.kind === histType)
        && (!histQuery || `${r.code} ${r.title} ${r.detail} ${r.kind}`.toLocaleLowerCase("vi").includes(histQuery.toLocaleLowerCase("vi"))))
      .sort((a, b) => {
        if (histSort === "oldest") return String(a.at).localeCompare(String(b.at));
        if (histSort === "kind") return a.kind.localeCompare(b.kind, "vi") || String(b.at).localeCompare(String(a.at));
        return String(b.at).localeCompare(String(a.at));   // mặc định: MỚI NHẤT TRƯỚC (§G)
      });
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
          {/* MỐC 116 (user 01/10) — BỎ CỘT «NGUỒN». Cột này in tên cột DB thô
              (`teams.code`, `teams.trade`, `teams.leader_user_id → users.full_name`) — thứ CHỈ ĐỂ
              DEV TEST, không phải thông tin nghiệp vụ ⇒ không hiện cho người dùng.
              ⛔ KHÔNG đụng vào `teamDetailTabs()[].source`: đó là DỮ LIỆU, `tests/tm03-team-detail-tabs.test.mjs`
              dòng 55-69 kiểm từng tab phải khai NGUỒN THẬT. Chỉ gỡ phần RENDER. */}
          <CardHead title="Thông tin tổ đội" note="Thông tin lấy trực tiếp từ hồ sơ tổ đội đang được chọn." />
          <div className="table-wrap"><table className="baseline-table"><thead><tr><th>Hạng mục</th><th>Giá trị</th></tr></thead><tbody>
            <tr><td>Mã tổ đội</td><td><strong className="code">{detail.code}</strong></td></tr>
            <tr><td>Tên tổ đội</td><td>{detail.name}</td></tr>
            <tr><td>Hạng mục</td><td>{detail.trade || "—"}</td></tr>
            <tr><td>Tổ trưởng</td><td>{leader?.fullName || <span className="muted">{NO_SOURCE_TEXT}</span>}</td></tr>
            <tr><td>Trạng thái</td><td><StatusBadge value={Number(detail.active ?? 1) === 0 ? TEAM_STOPPED_LABEL : TEAM_ACTIVE_LABEL} /></td></tr>
          </tbody></table></div>
        </section>
        {/* ⛔ ERP-SESSION-03 (07/10/2026) — ĐÃ GỠ CARD «Nguồn dữ liệu của 6 tab».
            Card đó in bảng `Tab · Số dòng · Nguồn · Ghi chú` với NGUYÊN VĂN tên bảng/cột CSDL
            (`stock_issues.team_id`, `inventory[].balance`, `team_members …`) — thông tin CHỈ ĐỂ DEV
            TEST, là RÁC với người dùng cuối (user: «lược bỏ các thông tin bị thừa - rác»).
            ✅ Dữ liệu `teamDetailTabs()[].source` ⛔ KHÔNG bị xoá — 6 test hợp đồng `tests/tm0*.test.mjs`
               vẫn trích và chạy thật; chỉ gỡ phần RENDER (đúng tiền lệ MỐC 116 ở `:458-462`). */}
      </div>}

      {tab === 1 && <div className="stack">
        <section className="card">
          <CardHead title="Nhân sự — thành viên đang hoạt động" note={tabs[1].available ? "Sắp xếp theo ngày tham gia." : "Chưa có dữ liệu thành viên của tổ đội."} />
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
            : <Empty text="Chưa có dữ liệu thành viên của tổ đội trong phiên bản đang chạy." />}
        </section>
        {tabs[1].available && pastMembers.length > 0 && <section className="card">
          <CardHead title="Nhân sự — đã rời tổ đội" />
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
          <CardHead title="Dự án tổ đội thuộc về" note="Mỗi tổ đội thuộc một dự án." />
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
          <CardHead title="Kho của tổ đội" note={warehouse ? "Kho đang gắn với tổ đội này." : "Tổ đội chưa được gắn kho."} />
          <DataTable rows={warehouse ? [warehouse] : []} rowKey={(row) => String(row.id)} emptyText={`${NO_SOURCE_TEXT} — không tra được kho từ teams.warehouse_id trong payload.`} columns={[
            { key: "c1", header: "Mã kho", render: (row) => <strong className="code">{row.code}</strong> },
            { key: "c2", header: "Tên kho", render: (row) => row.name },
            { key: "c3", header: "Loại", render: (row) => (row.type === "team" ? "Kho tổ đội" : row.type === "site" ? "Kho công trường" : row.type === "central" ? "Kho tổng" : String(row.type || "—")) },
            { key: "c4", header: "Dự án", render: (row) => projectOf(row.projectId)?.code || "—" },
          ]} />
        </section>
        <section className="card">
          <CardHead title="Tồn kho tại kho của tổ đội" note={stockRows.length ? `${stockRows.length} mặt hàng đang có tồn.` : "Kho của tổ đội chưa phát sinh tồn kho."} />
          <DataTable rows={stockRows} rowKey={(row, index) => String(row.materialId || index)} emptyText="Kho của tổ đội chưa phát sinh nhập/xuất nên chưa có tồn kho." columns={[
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
        {/* ══ MT3 §G — LỊCH SỬ TỔNG HỢP: Tìm · Sắp xếp · Lọc theo loại; mặc định MỚI NHẤT ══
            ⛔ Mỗi chứng từ là 1 dòng — KHÔNG nhân dòng bằng join. Các bảng chi tiết bên dưới
            vẫn giữ nguyên (⛔ không mất nghiệp vụ nào). */}
        <section className="card" data-vntech="team-history-aggregate">
          <CardHead title="TỔNG HỢP CHỨNG TỪ TỔ ĐỘI" note="Mọi đơn/phiếu liên quan đến tổ đội: cấp phát · hoàn trả · nhật ký thao tác."/>
          <ListToolbar
            title="CHỨNG TỪ CỦA TỔ ĐỘI" note="Tìm · Sắp xếp · Lọc theo loại chứng từ."
            count={visibleHistory.length} total={historyRows.length} unit="chứng từ"
            search={{ value: histQuery, onChange: setHistQuery, placeholder: "Tìm theo số chứng từ, nội dung, người..." }}
            filters={[{ key:"kind", label:"Loại", value:histType, onChange:setHistType, options:[{value:"ALL",label:"Tất cả loại"},{value:"Cấp phát",label:"Cấp phát"},{value:"Hoàn trả",label:"Hoàn trả"},{value:"Nhật ký",label:"Nhật ký"}] }]}
            sort={{ value: histSort, onChange: setHistSort, options:[{value:"newest",label:"Mới nhất trước"},{value:"oldest",label:"Cũ nhất trước"},{value:"kind",label:"Theo loại chứng từ"}] }}
          />
          <DataTable
            rows={visibleHistory}
            rowKey={(row, index) => `${row.kind}-${row.code}-${index}`}
            emptyText="Tổ đội chưa có chứng từ nào trong phạm vi bạn được xem."
            columns={[
              { key: "h1", header: "Loại", render: (row) => <>{row.kind}</> },
              { key: "h2", header: "Số chứng từ", render: (row) => <><strong className="code">{row.code || "—"}</strong></> },
              { key: "h3", header: "Nội dung", render: (row) => <><strong>{row.title}</strong><small>{row.detail}</small></> },
              { key: "h4", header: "Trạng thái", render: (row) => <>{row.status}</> },
              { key: "h5", header: "Thời gian", render: (row) => <>{date(row.at)}</> },
            ]}
          />
        </section>
        <section className="card">
          <CardHead title="Phiếu cấp phát & hoàn trả của tổ đội" note="Hai danh sách dưới đây là phiếu xuất kho và phiếu hoàn trả mang tên tổ đội này." />
          {allocations.map((source) => <div key={source.key} className="stack">
            <CardHead title={`${source.label} — ${source.total} chứng từ`} />
            <DataTable rows={source.rows} rowKey={(row, index) => String(row.id || index)} emptyText={`Chưa có ${source.label.toLowerCase()} nào của tổ đội này.`} columns={[
              { key: "c1", header: "Số chứng từ", render: (row) => <strong className="code">{String(row[source.keyField] || row.id || "—")}</strong> },
              { key: "c2", header: "Trạng thái", render: (row) => <StatusBadge value={statusLabel(row.status)} /> },
              { key: "c3", header: "Người liên quan", render: (row) => String(row[source.whoField] || "—") },
              { key: "c4", header: "Thời điểm", render: (row) => date(row[source.atField] || row.createdAt) },
              { key: "c5", header: "Số lượng", render: (row) => (source.qtyField && row[source.qtyField] !== undefined ? String(row[source.qtyField]) : "—") },
              { key: "c6", header: "Đã lắp", render: (row) => (source.installedField && row[source.installedField] !== undefined ? String(row[source.installedField]) : "—") },
            ]} />
          </div>)}
        </section>
        <section className="card">
          <CardHead title="Phiếu đề nghị mua hàng của dự án" note="Các phiếu đề nghị mua hàng thuộc dự án của tổ đội." />
          <DataTable rows={(data.requests || []).filter((row) => String(row.projectId) === String(detail.projectId))} rowKey={(row, index) => String(row.id || index)} emptyText="Dự án của tổ đội chưa có phiếu đề nghị mua hàng nào." columns={[
            { key: "c1", header: "Số phiếu", render: (row) => <strong className="code">{String(row.requestNo || row.id || "—")}</strong> },
            { key: "c2", header: "Trạng thái", render: (row) => <StatusBadge value={statusLabel(row.status)} /> },
            { key: "c3", header: "Người đề nghị", render: (row) => String(row.requestedBy || "—") },
            { key: "c4", header: "Thời điểm", render: (row) => date(row.requestedAt || row.createdAt) },
          ]} />
        </section>
      </div>}

      {/* MT3 §G — nội dung «Lịch sử thao tác» + «Hợp đồng giao khoán & quyết toán» (tab 5 cũ)
          ĐÃ GỘP vào tab «Lịch sử» (nay là tab 4) để giữ nguyên nghiệp vụ, không xoá gì. */}
      {tab === 4 && <div className="stack">
        <section className="card">
          <CardHead title="Lịch sử thao tác trên tổ đội" />
          {history.auditRowsAvailable
            ? <DataTable rows={history.audits} rowKey={(row, index) => String(row.id || index)} emptyText={`${NO_SOURCE_TEXT} — chưa có dòng audit_logs nào cho entity_type='team' của tổ đội này.`} columns={[
              { key: "c1", header: "Thời điểm", render: (row) => date(row.occurredAt) },
              { key: "c2", header: "Hành động", render: (row) => String(row.action || "—") },
              { key: "c3", header: "Người thực hiện", render: (row) => String(row.userName || "—") },
            ]} />
            : <Empty text="Bạn chưa được xem lịch sử thao tác của tổ đội này." />}
        </section>
        <section className="card">
          <CardHead title="Hợp đồng giao khoán & quyết toán của tổ đội" />
          <DataTable rows={history.subcontracts} rowKey={(row) => String(row.id)} emptyText="Tổ đội chưa có hợp đồng giao khoán nào." columns={[
            { key: "c1", header: "Số HĐ", render: (row) => <strong className="code">{String(row.contractNo || "—")}</strong> },
            { key: "c2", header: "Tên/phạm vi", render: (row) => String(row.contractName || "—") },
            { key: "c3", header: "Giá trị", render: (row) => String(row.contractValue ?? "—") },
            { key: "c4", header: "Trạng thái", render: (row) => <StatusBadge value={statusLabel(row.status)} /> },
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
          {/* MT3 ma trận #6 — nút XUẤT THẬT. Cột lấy ĐÚNG từ `TEAM_LIST_COLUMNS` (⛔ không hard-code lại),
              `status` đi qua bảng nhãn dùng chung `statusLabel`. Xuất đúng các tổ đội ĐANG hiển thị sau lọc. */}
          <button type="button" className="secondary" data-vntech="team-export-csv"
            title="Xuất danh sách tổ đội đang hiển thị ra CSV (UTF-8, có BOM — mở đúng tiếng Việt trong Excel)"
            onClick={() => downloadCsv(
              TEAM_LIST_COLUMNS.map((c) => c.header),
              rows.map((row) => {
                // ⚠️ Kiểu dòng đã có sẵn `statusLabel` (nhãn tiếng Việt) ⇒ ⛔ KHÔNG gọi lại `statusLabel(row.status)`.
                //    Và ⛔ không index bằng chuỗi trên kiểu chặt ⇒ ép về `Record<string, unknown>` để tra theo `c.key`.
                const loose = row as unknown as Record<string, unknown>;
                return TEAM_LIST_COLUMNS.map((c) => {
                  if (c.key === "status") return String(row.statusLabel ?? "");
                  const v = loose[c.key];
                  if (v === null || v === undefined) return "";
                  return typeof v === "object" ? String(loose["projectName"] ?? "") : String(v);
                });
              }),
              "danh-sach-to-doi",
            )}>⤓ Xuất CSV</button>
        </>}
      />
      <p className="muted" data-team-sort-note="TM-02">Thứ tự ưu tiên: <strong>ĐANG HOẠT ĐỘNG</strong> → hoạt động gần nhất ↓ → ngừng.</p>
      {/* ⛔ ERP-SESSION-03 (07/10/2026) — ĐÃ GỠ `<p data-team-source-notes="TM-01">`: đoạn đó in
          `team_members …` · `stock_issues · material_returns …` · `teams WHERE active=1` = tên
          bảng/cột CSDL ⇒ RÁC với người dùng. Hàm `teamListSourceNotes()` ⛔ KHÔNG bị xoá (dữ liệu
          cho `tests/tm01`), chỉ bỏ phần render. */}
      <DataTable rows={rows} rowKey={(row) => row.id} emptyText="Không có tổ đội phù hợp." columns={[
        { key: "code", header: TEAM_LIST_COLUMNS[0].header, render: (row) => <strong className="code">{row.code}</strong> },
        { key: "name", header: TEAM_LIST_COLUMNS[1].header, render: (row) => row.name },
        { key: "status", header: TEAM_LIST_COLUMNS[2].header, render: (row) => <StatusBadge value={row.statusLabel} /> },
        { key: "members", header: TEAM_LIST_COLUMNS[3].header, render: memberCell },
        { key: "project", header: TEAM_LIST_COLUMNS[4].header, render: (row) => (row.projectKnown ? `${row.projectCode} · ${row.projectName}` : <span className="muted">{NO_SOURCE_TEXT}</span>) },
        { key: "lastActivity", header: TEAM_LIST_COLUMNS[5].header, render: activityCell },
        { key: "actions", header: "", render: (row) => <button type="button" className="export-mini" onClick={() => { setDetailId(row.id); setView("detail"); setTab(0); }}>Chi tiết ›</button> },
      ]} />
    </section>
  </div>;
}

export { TeamDirectory, TEAM_LIST_COLUMNS, TEAM_TABS, TEAM_ACTION_GATES, TEAM_ALLOCATION_SOURCES, NO_SOURCE_TEXT, teamListSourceNotes, TEAM_WAREHOUSE_STOCK_FIELDS };
export type { TeamDirectoryProps };
export default TeamDirectory;
