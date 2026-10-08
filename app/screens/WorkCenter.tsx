// PHASE 1 (U-11) — MODULE DÙNG CHUNG TÁCH KHỎI `app/page.tsx`.
//
// Vì sao tách: `app/page.tsx` là MỘT tệp khổng lồ (hơn 4.000 dòng, hơn 250 khai báo top-level).
// Thứ tự cắt ĐÚNG (đã ghi ở `docs/agent-progress/U14-U11-KHAO-SAT.md` mục 2): tách HELPER DÙNG CHUNG trước
// (gỡ chặn IMPORT VÒNG), rồi mới tách từng màn.
//
// ⚠️ ĐIỀU KIỆN AN TOÀN (do `tools/tach-lat-cat-page.mjs` tự kiểm TRƯỚC KHI GHI): mọi tên mà các khối ở đây
// tham chiếu phải thuộc (a) khối cùng nằm trong tệp này, (b) tên có sẵn của JS, (c) tên đến từ `import` của
// `page.tsx` — công cụ SINH LẠI import đó ở đây, hoặc (d) kiểu của React ⇒ `import type … from "react"`.
// Không còn tên nào khác ⇒ KHÔNG thể tạo import vòng.
//
// PHASE 3 (`T-01`) — MÀN CÔNG VIỆC, NAY **7 TAB** THEO YÊU CẦU USER 08/10/2026 (chốt qua thẻ quyết định):
//   0 Dashboard · 1 Danh sách công việc · 2 Được giao · 3 Phòng ban/ Tổ đội · 4 Giao việc · 5 Dự án · 6 Báo cáo
// ⭐ «Dashboard» được ĐƯA LÊN ĐẦU (yêu cầu VIỆC 1); «Danh sách công việc» là tên mới của tab «Cá nhân»
//    (yêu cầu VIỆC 2); thêm tab RIÊNG «Được giao» (yêu cầu VIỆC 6); «Phòng ban» đổi tên thành
//    «Phòng ban/ Tổ đội» (yêu cầu VIỆC 7).
// Giữ NGUYÊN hành vi các tab cũ về nội dung: `Việc của tôi` → «Danh sách công việc» · `Phòng ban / tổ đội` → «Phòng ban/ Tổ đội».
// Tab «Báo cáo» TÁI DÙNG `ReportView` + `lib/report-catalog.ts` (nguồn `workItems`) — KHÔNG viết màn mới.
// Mục menu «Giao việc» KHÔNG mở màn này: nó mở `DepartmentTaskWorkspace` (xem nhánh render trong `app/page.tsx`).
//
// PHASE 3 (`T-05`) — tab «Cá nhân»: BA NHÓM RIÊNG (của tôi · được giao · do tôi tạo), mỗi nhóm một bộ lọc + bộ đếm.
// PHASE 3 (`T-06`) — tab «Phòng ban»: CHỈ việc trong PHẠM VI ĐƯỢC PHÉP (thu hẹp trong payload, không mở rộng quyền).
// PHASE 3 (`T-07`) — Board Kanban 3 chiều (Ưu tiên · Trạng thái · Phân công) tách ra `WorkKanban.tsx`, gắn ở đây.

import { DataTable, ListToolbar, PermissionGuard, StatusBadge } from "@/app/components/ui";
// MT3 §IV.7 + ma trận #6 — XUẤT dùng ĐÚNG thư viện dùng chung (§14), ⛔ không tự viết lại CSV/Blob.
//   Và `statusLabel` để ⛔ KHÔNG rò mã thô trạng thái ra tệp xuất (đúng tinh thần ma trận #5).
// ⭐ CẬP NHẬT 08/10/2026 (USER): **⛔ ĐÃ BỎ nút «Xuất CSV» ở MỌI TAB** module «Công việc»
//    ⇒ import `downloadCsv` cũng đã gỡ. Cần lại thì import từ `@/lib/tabular-export`.
import { statusLabel } from "@/lib/status-labels";
import { ReportView } from "@/app/screens/ReportView";
import { WorkDashboard } from "@/app/screens/WorkDashboard";
import { WorkHierarchy } from "@/app/screens/WorkHierarchy";
import { WorkKanban, kanbanManagerDepartments } from "@/app/screens/WorkKanban";
import { daysFromToday } from "@/lib/date-helpers";
import type { WorkMenuView } from "@/lib/menu-helpers";
import { isAdminUser, modulePermission, roleBase } from "@/lib/permissions";
import { REPORT_CATALOG, findEntry, sourceRows } from "@/lib/report-catalog";
import { CardHead, Kpi, UI_TODAY, WORK_CLOSED, WORK_STATUS_LABELS, date } from "@/lib/ui-shared";
import type { AppData, Row } from "@/lib/ui-shared";
import { useEffect, useState } from "react";

// ══════════════════════════════════════════════════════════════════════════════════════════════════
// MT2-P6-01 (§4.1) — CARD «Chờ Giám đốc duyệt»: dữ liệu **THỰC** từ approval engine.
// Dùng API `director_pending_approvals` (MT2-P4-03) — backend **tự chặn 403** theo CẤP BẬC.
// §4.1: «⛔ Không hiển thị card cho user không đủ quyền» ⇒ **403 ⇒ ẨN card** (⛔ không vỡ màn khi lỗi).
// ⛔ KHÔNG đụng khối thuần `T06` của tệp này, ⛔ KHÔNG đụng `WorkDashboard` (có test riêng `t08`).
// ══════════════════════════════════════════════════════════════════════════════════════════════════
function DirectorPendingCard() {
  const [state, setState] = useState<{ loading: boolean; total: number | null; hidden: boolean }>(
    { loading: true, total: null, hidden: false });
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const response = await fetch("/api/system", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "director_pending_approvals" }),
        });
        // ⚠️ `fetch` ⛔ KHÔNG throw khi 403 ⇒ PHẢI tự kiểm (`response.ok` là chưa đủ).
        if (response.status === 403) { if (alive) setState({ loading: false, total: null, hidden: true }); return; }
        const result = await response.json();
        if (!response.ok) { if (alive) setState({ loading: false, total: null, hidden: true }); return; }
        if (alive) setState({ loading: false, total: Number(result.total || 0), hidden: false });
      } catch {
        if (alive) setState({ loading: false, total: null, hidden: true });   // lỗi mạng ⇒ ẩn, KHÔNG vỡ màn
      }
    })();
    return () => { alive = false; };
  }, []);
  if (state.hidden) return null;
  return <Kpi icon="GD" label="Chờ Giám đốc duyệt" value={state.loading ? "…" : String(state.total ?? 0)} note="Phiếu đang chờ ở bước Giám đốc" tone="amber"/>;
}

// ══════════════════════════════════════════════════════════════════════════════════════════════════
// MT2-P6-06 (§4.4) — ĐẾM ĐƠN QUÁ HẠN SLA. TÍNH từ dữ liệu **ĐANG CÓ** trong payload:
// `requests[].approvals[]` mang đúng 2 trường §4.4 yêu cầu lưu (`status` + `due_at`/`dueAt`).
// ⛔ KHÔNG gọi API mới · ⛔ KHÔNG thêm migration · ⛔ KHÔNG BỊA SỐ:
// thiếu nguồn ⇒ trả `null` để UI ghi rõ «chưa có nguồn» (⛔ KHÔNG hiện 0) — theo chuẩn `WorkDashboard.tsx:6`.
// ══════════════════════════════════════════════════════════════════════════════════════════════════
function overdueApprovalCount(data: AppData): number | null {
  const rows: Row[] = Array.isArray(data.requests) ? (data.requests as Row[]) : [];
  const steps: Row[] = rows.flatMap((r: Row) => (Array.isArray(r.approvals) ? (r.approvals as Row[]) : []));
  if (steps.length === 0) return null;                       // ⛔ chưa có nguồn ⇒ KHÔNG hiện 0
  const now = Date.now();
  return steps.filter((a: Row) => String(a.status) === "pending"
    && Boolean(a.dueAt) && Date.parse(String(a.dueAt)) < now).length;
}

// PHASE 3 (`T-01`) → **VIỆC 1 + 2 + 6 + 7 của USER (08/10/2026)**: DẢI **7 TAB**, «Dashboard» ĐẦU TIÊN.
// ⚠️ SỐ ĐO TỪ `WORK_TABS` NGAY DƯỚI — ⛔ KHÔNG suy từ tài liệu cũ (chú thích cũ ghi «5 tab»/«Dashboard=3» đã SAI
//    từ lâu; bài học §16: **nguồn sự thật = MÃ**).
const WORK_TABS = ["Dashboard", "Danh sách công việc", "Được giao", "Phòng ban/ Tổ đội", "Giao việc", "Dự án", "Báo cáo"];
// ⭐ ÁNH XẠ `view` (từ menu) → CHỈ SỐ TAB của dải 7 tab ở trên:
//   «Dashboard»=0 · «Danh sách công việc»=1 · «Được giao»=2 · «Phòng ban/ Tổ đội»=3 · «Giao việc»=4 · «Dự án»=5 · «Báo cáo»=6
// ⚠️ GIỮ alias `kpi: 0` (cùng tab Dashboard) vì `WorkMenuView` vẫn còn `"kpi"` — đúng chủ ý cũ (MT2-P5-01).
// ⚠️ `personal` là «Danh sách công việc» (tên mới), ⛔ KHÔNG phải tab Dashboard.
const WORK_TAB_OF_VIEW: Record<WorkMenuView, number> = { personal: 1, department: 3, assign: 4, kpi: 0, dashboard: 0, reports: 6 };

// ⛔ TẠM ẨN «CHẾ ĐỘ XEM» (Kanban · Cây) — **QUYẾT ĐỊNH CỦA USER 08/10/2026** (vòng 65):
//   nguyên văn: *«tạm thời ẩn Kanban / cây **ghi vào log nếu sau này cần thì dùng lại**»*.
//   ⭐ **GIỮ NGUYÊN MÃ** (`WorkKanban` · `WorkHierarchy` + 2 khối JSX + import + `deptView`) — ⛔ **KHÔNG xoá**.
//   ⭐ **BẬT LẠI SAU NÀY = đổi ĐÚNG 1 CHỖ**: `WORK_VIEW_MODES_HIDDEN = false` ⇒ 3 nút «Bảng · Kanban · Cây»
//      và 2 khối hiện lại y như trước (⛔ không cần viết lại gì).
//   📌 Vì sao ẩn: tab «Phòng ban/ Tổ đội» trước đây hiện **3 cách nhìn CÙNG 1 tập việc** (2 bảng + Kanban + Cây)
//      ⇒ user thấy thừa; ⚠️ `WorkHierarchy` còn phụ thuộc `teamMembers` (**Java-only**) nên hay ghi «chưa có nguồn».
const WORK_VIEW_MODES_HIDDEN = true;
// Báo cáo CÔNG VIỆC dùng LẠI catalog chung (`R-05a/b/c`, nguồn `workItems`) — không khai định nghĩa mới.
const WORK_REPORT_CATALOG = REPORT_CATALOG.filter((entry) => entry.source === "workItems");

// -------------------------------------------------------------------------------------------------
// T05-PURE-BEGIN
// ── T-05 · BA NHÓM VIỆC CÁ NHÂN (khối thuần — test t05 TRÍCH RA và CHẠY, không chỉ đọc chữ) ──────
//
// HỢP ĐỒNG TÊN TRƯỜNG (ĐÃ ĐO bằng payload thật + SQL bootstrap, KHÔNG suy đoán) — `scripts/system-route.mjs`:
//   `wi.assigned_to AS assignedTo`   · `ua.full_name AS assignedToName`   ⇒ NGƯỜI THỰC HIỆN
//   `wi.assigned_by AS assignedBy`   · `ub.full_name AS assignedByName`   ⇒ NGƯỜI GIAO VIỆC
// Bảng `work_items` (drizzle 0031 + Flyway V1) KHÔNG có cột "người tạo" riêng ⇒ «DO TÔI TẠO» = tôi là người GIAO
// (`assignedBy`). Hai tên `assigneeUserId`/`assigneeName` KHÔNG tồn tại trong payload (xem
// `tools/probe-work-item-field-contract.mjs` — cổng đã biến lỗi im lặng này thành bất biến).
const PERSONAL_GROUPS = [
  { key: "mine", label: "Của tôi", note: "Mọi việc đang mang tên tôi — gồm cả việc tôi tự tạo" },
  { key: "assigned", label: "Được giao", note: "Người khác giao cho tôi (người giao khác tôi)" },
  { key: "created", label: "Do tôi tạo", note: "Việc tôi giao/tạo (cho người khác hoặc cho chính tôi)" },
];

/**
 * MT3 §A.2 — Gom nhiệm vụ theo DỰ ÁN cho tab «Dự án».
 * ⛔ KHÔNG phát minh nghiệp vụ: chỉ nhóm CHÍNH SÁCH dữ liệu nhiệm vụ đang có theo `projectCode`,
 *    không suy diễn quy tắc nghiệp vụ nào (không tính tiến độ dự án, không xếp hạng ưu tiên).
 */
function projectWorkGroups(rows: Row[]) {
  const map = new Map<string, { code: string; label: string; rows: Row[] }>();
  for (const row of rows) {
    const code = String(row.projectCode || "").trim();
    const label = String(row.projectName || code || "Chưa gán dự án").trim();
    const key = code || label;
    const current = map.get(key) || { code, label, rows: [] };
    current.rows.push(row);
    map.set(key, current);
  }
  return [...map.values()]
    .map((g) => ({ ...g, done: g.rows.filter((r) => String(r.status) === "COMPLETED").length, late: g.rows.filter(isTaskLate).length }))
    .sort((a, b) => b.rows.length - a.rows.length || a.label.localeCompare(b.label, "vi"));
}

function personalWorkGroups(rows: Row[], myId: string) {
  const mine = rows.filter((row) => String(row.assignedTo) === myId);
  const assigned = mine.filter((row) => String(row.assignedBy) !== myId);
  const created = rows.filter((row) => String(row.assignedBy) === myId);
  return [
    { ...PERSONAL_GROUPS[0], rows: mine, count: mine.length },
    { ...PERSONAL_GROUPS[1], rows: assigned, count: assigned.length },
    { ...PERSONAL_GROUPS[2], rows: created, count: created.length },
  ];
}
// T05-PURE-END

// -------------------------------------------------------------------------------------------------
// T06-PURE-BEGIN
// ── T-06 · PHẠM VI VIỆC PHÒNG BAN ĐƯỢC PHÉP (khối thuần — test t06 TRÍCH RA và CHẠY) ─────────────
//
// Khoá THẬT của payload (đo tại TASK-097, không đoán):
//   • `workItems[]`    : assignedTo · assignedToName · departmentCode · projectId · status · priority
//   • `userScopes[]`   : userId · projectId · permission  (nguồn `user_project_scopes`; RỖNG với người không phải admin)
//   • `modulePermissions[]`            : moduleKey · canView  ⇒ cấp quyền theo NGƯỜI
//   • `departmentModulePermissions[]`  : organizationCode · moduleKey · canView ⇒ cấp quyền theo PHÒNG
// Luật dưới đây MÔ PHỎNG nhánh SQL của bootstrap (`scripts/system-route.mjs` — `workItemWhere`) nên chỉ có thể
// THU HẸP trong chính payload mà máy chủ đã lọc: KHÔNG tự sinh dòng, KHÔNG nới phạm vi.
const WORK_DEPT_MODULE_KEYS = ["dept_plan_tasks", "dept_project_tasks", "dept_plan_assign", "dept_project_assign"];

function workScopeOf(data: AppData) {
  const me: Row = data.user || {};
  const role = String(me.role || "");
  const base = String(me.roleBase || me.role || "");
  const myId = String(me.id || "");
  const isAdmin = role === "admin" || base === "admin";
  const deptCodes = [...new Set([String(me.organizationCode || ""), String(me.department || "")].filter(Boolean))];
  const projectIds = [...new Set((data.userScopes || [])
    .filter((scope) => String(scope.userId) === myId)
    .map((scope) => String(scope.projectId || "")).filter(Boolean))];
  const byUser = (data.modulePermissions || []).some((row) => WORK_DEPT_MODULE_KEYS.includes(String(row.moduleKey || "")) && Boolean(row.canView));
  const byDept = (data.departmentModulePermissions || []).some((row) => WORK_DEPT_MODULE_KEYS.includes(String(row.moduleKey || ""))
    && Boolean(row.canView) && deptCodes.includes(String(row.organizationCode || "")));
  return {
    myId, role, base, deptCodes, projectIds, isAdmin,
    // ⚠️ TRÙNG LUẬT có chủ ý với `kanbanManagerDepartments` (WorkKanban.tsx) — test t07 kiểm HAI nơi này KHỚP NHAU.
    managerDepartments: isAdmin ? ["KH", "DA", "BCH"] : [role === "kh_truong" ? "KH" : "", role === "da_truong" ? "DA" : ""].filter(Boolean),
    canViewDeptWork: byUser || byDept,
  };
}

function departmentWorkScope(data: AppData, rows: Row[]) {
  const scope = workScopeOf(data);
  if (scope.isAdmin) return rows;   // payload của quản trị ĐÃ là toàn bộ (bootstrap: `workItemWhere = 1=1`)
  return rows.filter((row) => {
    const mine = String(row.assignedTo || "") === scope.myId;
    if (!scope.canViewDeptWork) return mine;
    const code = String(row.departmentCode || "");
    if (scope.base === "procurement" || scope.deptCodes.includes("KH")) return code === "KH" && (mine || scope.managerDepartments.includes("KH"));
    if (scope.base === "project" || scope.deptCodes.includes("DA")) return code === "DA" && (mine || scope.managerDepartments.includes("DA"));
    if (scope.deptCodes.includes("BCH")) return code === "BCH" && (mine || !row.projectId || scope.projectIds.includes(String(row.projectId || "")));
    return mine;
  });
}
// T06-PURE-END

function WorkCenter({ data, action, refresh, view = "personal" }: { data: AppData; action: (name: string, payload: Row) => Promise<boolean>; refresh: () => void; view?: WorkMenuView }) {
  const [tab, setTab] = useState(WORK_TAB_OF_VIEW[view]);
  const [personalGroup, setPersonalGroup] = useState("mine");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  // VIỆC 4 (USER 08/10/2026) — «tự tạo việc cho bản thân» chuyển từ FORM NỘI TUYẾN sang MODAL «Tạo công việc».
  const [createOpen, setCreateOpen] = useState(false);
  // VIỆC 7 (USER 08/10/2026) — tab «Phòng ban/ Tổ đội» có **2 SUB-TAB** và Kanban/Cây thành **«CHẾ ĐỘ XEM»**
  //   (user chốt qua thẻ quyết định: *giữ dạng «chế độ xem»* — ⛔ không xoá chức năng, ⛔ không phá test `t07`/`t09`).
  const [deptTab, setDeptTab] = useState<"dept" | "team">("dept");
  const [deptView, setDeptView] = useState<"list" | "kanban" | "tree">("list");
  // VIỆC 5 (USER 08/10/2026) — **MODAL CHI TIẾT CÔNG VIỆC**: click vào công việc (CẢ DÒNG) ⇒ mở modal.
  const [detailRow, setDetailRow] = useState<Row | null>(null);
  const me = data.user || {};
  const myId = String(me.id || "");
  const items: Row[] = data.workItems || [];
  const users: Row[] = data.users || [];

  const canSelf = modulePermission(data, "dept_plan_tasks").canUse || modulePermission(data, "dept_project_tasks").canUse;
  const canAssign = modulePermission(data, "dept_plan_assign").canCreate || modulePermission(data, "dept_project_assign").canCreate;
  const isOverseer = isAdminUser(me) || ["director", "commander"].includes(roleBase(me));

  // ⚠️ HỢP ĐỒNG TÊN TRƯỜNG (đã đo bằng bootstrap THẬT, không suy đoán): dòng `workItems` của payload do
  // `work_items` sinh ra mang tên **`assignedTo`/`assignedToName`** (`scripts/system-route.mjs` — `wi.assigned_to AS assignedTo`,
  // `ua.full_name AS assignedToName`). Trước đây màn này đọc tên KHÔNG TỒN TẠI ⇒ `mine`/`teamWork` LUÔN rỗng và tab
  // "Việc của tôi" LUÔN 0 việc (lỗi im lặng: `tsc` xanh vì `Row` là chỉ mục mở). Nay `T-05`/`T-06` gom luật vào hai
  // khối thuần ở đầu tệp và ĐÃ CÓ TEST CHẠY THẬT chúng.
  const personalGroups = personalWorkGroups(items, myId);
  const personalRows: Row[] = personalGroups.find((group) => group.key === personalGroup)?.rows || [];
  const mine = personalGroups[0].rows;
  // VIỆC 6 (USER 08/10/2026) — tab RIÊNG «Được giao»: TÁI DÙNG ĐÚNG nhóm `assigned` đã có (`personalGroups[1]`,
  // định nghĩa: `assignedTo = tôi` ∧ `assignedBy ≠ tôi`) ⇒ ⛔ KHÔNG viết lại luật lọc (tránh 2 nguồn sự thật).
  const assignedRows = personalGroups[1].rows;
  const scope = workScopeOf(data);
  const managerDepartments = scope.managerDepartments;
  // T-06 — tập việc THUỘC PHẠM VI ĐƯỢC PHÉP; phần bị loại được đếm để người dùng THẤY mình đang bị giới hạn.
  const scopedWork = departmentWorkScope(data, items);
  const outOfScope = items.length - scopedWork.length;
  const myDepts = scope.deptCodes;
  const activeMemberIds = [...new Set((data.teamMembers || []).filter((m) => Number(m.active ?? 1) === 1).map((m) => String(m.userId)))];
  const deptWork = scopedWork.filter((r) => String(r.assignedTo) !== myId && (scope.isAdmin || myDepts.includes(String(r.departmentCode || ""))));
  const teamWork = scopedWork.filter((r) => String(r.assignedTo) !== myId && activeMemberIds.includes(String(r.assignedTo)));
  // ⭐ FIX (vòng 63 — «sửa lại các tab» theo yêu cầu user): `deptWork` và `teamWork` **GIAO NHAU**
  //   (một việc của thành viên tổ đội THUỘC phòng của tôi bị đếm ở CẢ HAI tập) ⇒ tiêu đề cũ ghi
  //   «24 việc phòng ban/tổ đội» trong khi TỔNG chỉ có 16 ⇒ ⚠️ **số liệu vô lý** với người đọc.
  //   ⇒ tính thêm tập **HỢP (không trùng)** để hiển thị ở tiêu đề.
  //   ⛔ KHÔNG đổi 2 tập dùng cho 2 SUB-TAB: mỗi sub-tab vẫn phải hiện ĐÚNG danh sách của nó.
  const deptTeamWork = scopedWork.filter((row) => String(row.assignedTo) !== myId
    && ((scope.isAdmin || myDepts.includes(String(row.departmentCode || ""))) || activeMemberIds.includes(String(row.assignedTo))));
  const scopeNote = `${scope.isAdmin ? "Quản trị: toàn bộ" : `Phòng ${myDepts.join(" / ") || "—"} · dự án ${scope.projectIds.length}${scope.managerDepartments.length ? ` · trưởng phòng ${scope.managerDepartments.join(" / ")}` : ""}`}${outOfScope > 0 ? ` · ${outOfScope} việc NGOÀI phạm vi đã bị ẩn` : ""}`;

  // VIỆC 5·6 (USER 08/10/2026) — AI được XÁC NHẬN HOÀN THÀNH / YÊU CẦU LÀM LẠI?
  // ⚠️ Mô phỏng ĐÚNG luật BE `isDepartmentManager(user, department_code)` — `scripts/system-route.mjs:263`:
  //    `if (isAdmin(user)) return true;` rồi `department==="KH" ? ["kh_truong"] : department==="DA" ? ["da_truong"] : false`
  // ⇒ admin · hoặc (phòng «KH» ∧ role `kh_truong`) · hoặc (phòng «DA» ∧ role `da_truong`); ⚠️ **BCH KHÔNG có**.
  // ⛔ KHÔNG nới rộng hơn: FE cho bấm mà BE từ chối = «nút chết» (đúng lớp lỗi đã ghi trong `BUG-D05`).
  const canApproveRow = (row: Row) => {
    if (scope.isAdmin) return true;
    const code = String(row.departmentCode || "");
    const role = String(me.role || "");
    return (code === "KH" && role === "kh_truong") || (code === "DA" && role === "da_truong");
  };

  const find = (rows: Row[]) => !q.trim() ? rows
    : rows.filter((r) => `${r.taskNo || ""} ${r.title || ""} ${r.assignedToName || ""}`.toLocaleLowerCase("vi").includes(q.trim().toLocaleLowerCase("vi")));

  async function send(name: string, payload: Row, form?: HTMLFormElement) {
    setBusy(true);
    const ok = await action(name, payload);
    setBusy(false);
    if (ok) { form?.reset(); refresh(); }
  }
  // VIỆC 4 (USER 08/10/2026) — nộp form trong MODAL «Tạo công việc».
  // ⚠️ `send` KHÔNG trả kết quả (`Promise<void>`) ⇒ muốn ĐÓNG modal khi thành công thì phải gọi `action` TRỰC TIẾP
  //    (bài học đã ghi ở `docs/52` §4: `send` chỉ dùng cho form nội tuyến).
  async function submitSelfWork(form: HTMLFormElement) {
    const fd = new FormData(form);
    setBusy(true);
    const ok = await action("create_self_work_item", { title: fd.get("title"), description: fd.get("description"),
      projectId: fd.get("projectId"), dueAt: fd.get("dueAt"), priority: fd.get("priority"), requiredOutput: fd.get("requiredOutput") });
    setBusy(false);
    if (ok) { form.reset(); setCreateOpen(false); refresh(); }
  }
  // T-07 — board Kanban gọi ACTION THẬT `update_work_item_status` (KHÔNG đổi trạng thái bằng state cục bộ).
  async function moveStatus(workItemId: unknown, status: string, reason: string) {
    setBusy(true);
    const ok = await action("update_work_item_status", { workItemId, status, reason });
    setBusy(false);
    if (ok) refresh();
    return ok;
  }
  const projCode = (id: unknown) => (data.projects || []).find((p) => String(p.id) === String(id))?.code || "—";

  // PHASE 3 (`T-01`) — số liệu dùng CHUNG cho tab «Dashboard» (3) và tab «Báo cáo» (4):
  // CEO/admin/ban lãnh đạo thấy TOÀN BỘ; người khác chỉ thấy phòng mình.
  const kpiScope = isOverseer ? users : users.filter((u) => myDepts.includes(String(u.organizationCode || "")));
  const kpiMonth = UI_TODAY.slice(0, 7);
  const kpiRows = kpiScope.map((u) => {
    const own = items.filter((r) => String(r.assignedTo) === String(u.id));
    const inMonth = own.filter((r) => String(r.completedAt || r.createdAt || "").slice(0, 7) === kpiMonth);
    return { u, total: own.length, done: own.filter((r) => String(r.status) === "COMPLETED").length,
      late: own.filter(isTaskLate).length, rate: workRate(own),
      mTotal: inMonth.length, mDone: inMonth.filter((r) => String(r.status) === "COMPLETED").length };
  }).filter((r) => isOverseer || r.total > 0).sort((a, b) => b.rate - a.rate || b.total - a.total);
  const kpiByDept = [...new Set(users.map((u) => String(u.organizationCode || u.department || "")).filter(Boolean))]
    .map((code) => { const own = items.filter((r) => String(r.departmentCode || "") === code);
      return { code, total: own.length, rate: workRate(own) }; })
    .filter((r) => r.total > 0).sort((a, b) => b.total - a.total);

  return <div className="stack work-center">
    <section className="card">
      {/* VIỆC 2 (USER 08/10/2026) — ⛔ BỎ ô tìm ở ĐẦU màn; ô tìm nay nằm NGAY TRÊN «Danh sách công việc»
          (xem `ListToolbar` trong khối danh sách của tab «Cá nhân» bên dưới). */}
      {/* ⭐ VIỆC MỚI (USER 08/10/2026): **⛔ BỎ nút «Xuất CSV» ở MỌI TAB** của module «Công việc»
          ⇒ `ListToolbar` nay chỉ còn `title` + `note` (⛔ KHÔNG truyền `actions`).
          ⚠️ Sau này muốn xuất lại: dùng thư viện dùng chung `lib/tabular-export` (`downloadCsv`)
          và ⛔ NHỚ import lại — xem ghi chú ở đầu tệp. */}
      <ListToolbar
        title="CÔNG VIỆC"
        note={`${mine.length} việc của bạn · ${deptTeamWork.length} việc phòng ban/tổ đội · ${items.length} tổng`}
      />
      <div className="project-scope-tabs" role="tablist">
        {WORK_TABS.map((label, i) => <button key={label} type="button" role="tab" aria-selected={tab === i} className={tab === i ? "active" : ""} data-vntech={`work-tab-${i}`} onClick={() => setTab(i)}>{label}</button>)}
      </div>
    </section>
    {/* ── MT3 §A.2 — TAB «DỰ ÁN» (TẠO MỚI): dashboard gom CÔNG VIỆC theo dự án ──────────────
        ⛔ KHÔNG phát minh nghiệp vụ: chỉ TỔNG HỢP dữ liệu nhiệm vụ ĐANG CÓ (cùng tập `rows` mà
        các tab khác dùng), theo `projectCode`. ⛔ Chưa khai báo luật nghiệp vụ mới cho tiến độ dự án. */}
    {tab === 1 && <div className="stack">
      <div className="kpi-grid small">
        <Kpi icon="CV" label="Việc của tôi" value={String(mine.length)} note={`${mine.filter((r) => String(r.status) === "COMPLETED").length} đã xong`} tone="blue"/>
        <Kpi icon="QH" label="Quá hạn" value={String(mine.filter(isTaskLate).length)} note="Cần xử lý trước" tone="red"/>
        <Kpi icon="TL" label="Tỉ lệ hoàn thành" value={`${workRate(mine)}%`} note="Trên việc được giao" tone="green"/>
      </div>
      <section className="card">
        <CardHead title="Ba nhóm việc cá nhân" note="T-05 — mỗi nhóm có BỘ LỌC và BỘ ĐẾM riêng: «Của tôi» (assignedTo = tôi) · «Được giao» (assignedTo = tôi VÀ assignedBy ≠ tôi) · «Do tôi tạo» (assignedBy = tôi)"/>
        <div className="project-scope-tabs" role="tablist" aria-label="Nhóm việc cá nhân">
          {personalGroups.map((group) => <button key={group.key} type="button" role="tab" aria-selected={personalGroup === group.key}
            className={personalGroup === group.key ? "active" : ""} data-personal-group={group.key}
            onClick={() => setPersonalGroup(group.key)}>{group.label} · {group.rows.length}</button>)}
        </div>
        <p className="muted">{personalGroups.find((group) => group.key === personalGroup)?.note}</p>
      </section>
      {canSelf && <section className="card">
        <CardHead title="Tạo công việc" note="Việc cá nhân (mã CN) không gắn nghiệp vụ nguồn và không lẫn vào việc phòng ban — mở MODAL để nhập"/>
        <div className="row-actions">
          <PermissionGuard allow={canSelf}><button type="button" className="primary" disabled={busy} data-vntech="work-create-open"
            onClick={() => setCreateOpen(true)}>＋ Tạo công việc</button></PermissionGuard>
        </div>
      </section>}
      {/* MODAL «Tạo công việc» — khuôn chuẩn của dự án (đối chiếu `ConstructionScreen.tsx:56-73`):
          `.overlay` (bấm ra ngoài để đóng) → `.modal card` (role=dialog + aria-modal + aria-label)
          → `.modal-head` + nút ✕ `aria-label="Đóng"` → `.modal-body` → `footer.modal-actions`. */}
      {createOpen && <div className="overlay" onMouseDown={(event) => event.target === event.currentTarget && setCreateOpen(false)}>
        <div className="modal card" data-vntech="work-create-modal" role="dialog" aria-modal="true" aria-label="Tạo công việc">
          <div className="modal-head"><strong>TẠO CÔNG VIỆC</strong>
            <button type="button" onClick={() => setCreateOpen(false)} aria-label="Đóng">✕</button></div>
          <form onSubmit={(e) => { e.preventDefault(); void submitSelfWork(e.currentTarget); }}>
            <div className="modal-body"><div className="form-grid">
              <label className="full"><span>Nội dung công việc *</span><input name="title" required autoFocus placeholder="Ví dụ: Rà soát hồ sơ nghiệm thu đợt 2"/></label>
              <label><span>Dự án</span><select name="projectId"><option value="">— Không gắn dự án —</option>{(data.projects || []).map((p) => <option key={String(p.id)} value={String(p.id)}>{p.code} · {p.name}</option>)}</select></label>
              <label><span>Hạn hoàn thành</span><input name="dueAt" type="date"/></label>
              <label><span>Ưu tiên</span><select name="priority"><option value="normal">Bình thường</option><option value="high">Cao</option><option value="urgent">Khẩn</option></select></label>
              <label><span>Kết quả cần có</span><input name="requiredOutput" placeholder="Đầu ra mong đợi"/></label>
              <label className="full"><span>Mô tả</span><textarea name="description" rows={2}/></label>
            </div></div>
            <footer className="modal-actions">
              <button type="button" className="secondary" disabled={busy} onClick={() => setCreateOpen(false)}>Huỷ</button>
              <button className="primary" disabled={busy} data-vntech="work-create-submit">＋ Tạo việc cho tôi</button>
            </footer>
          </form>
        </div>
      </div>}
      <section className="card">
        {/* VIỆC 2 (USER 08/10/2026) — «Danh sách việc của tôi» → «Danh sách công việc»,
            và ô TÌM KIẾM hạ xuống NGAY TRÊN bảng (trước đây nằm ở đầu màn — xem `ListToolbar` đầu trang).
            ⚠️ `find()` lọc theo mã việc · nội dung · người làm (không đổi luật lọc). */}
        <ListToolbar
          title="Danh sách công việc"
          note={`Nhóm «${personalGroups.find((group) => group.key === personalGroup)?.label}» · ${personalRows.length} việc — nhập % tiến độ và gửi kiểm tra ngay tại đây`}
          search={{ value: q, onChange: setQ, placeholder: "Tìm mã việc, nội dung, người làm…" }}/>
        <TaskTable rows={find(personalRows)} allowEdit projCode={projCode} busy={busy} send={send} canApproveRow={canApproveRow} onOpenDetail={setDetailRow}/>
      </section>
    </div>}

    {/* VIỆC 6 (USER 08/10/2026) — TAB RIÊNG «Được giao»: việc NGƯỜI KHÁC giao cho tôi.
        ⚠️ Dùng ĐÚNG nhóm `assigned` sẵn có (`personalGroups[1]` = `assignedTo = tôi` ∧ `assignedBy ≠ tôi`)
        ⇒ ⛔ KHÔNG viết lại luật lọc (tránh hai nguồn sự thật). Người thực hiện được NHẬP % + «Gửi kiểm tra»
        (`SUBMITTED`); «Duyệt xong»/«Yêu cầu làm lại» chỉ hiện với người có quyền duyệt (`canApproveRow`). */}
    {tab === 2 && <div className="stack" data-vntech="work-assigned-tab">
      <div className="kpi-grid small">
        <Kpi icon="DG" label="Việc được giao" value={String(assignedRows.length)} note="Người khác giao cho tôi" tone="blue"/>
        <Kpi icon="QH" label="Quá hạn" value={String(assignedRows.filter(isTaskLate).length)} note="Cần xử lý trước" tone="red"/>
        <Kpi icon="TL" label="Tỉ lệ hoàn thành" value={`${workRate(assignedRows)}%`} note="Trên việc được giao" tone="green"/>
      </div>
      <section className="card">
        <CardHead title="Việc được giao cho tôi"
          note={`${assignedRows.length} việc người khác giao cho bạn — nhập % tiến độ và bấm «Gửi kiểm tra» khi xong; trưởng phòng là người xác nhận hoàn thành`}/>
        <TaskTable rows={find(assignedRows)} allowEdit projCode={projCode} busy={busy} send={send} canApproveRow={canApproveRow} onOpenDetail={setDetailRow}/>
      </section>
    </div>}

    {tab === 5 && <div className="stack" data-vntech="work-project-tab">
      <div className="kpi-grid small">
        <Kpi icon="DA" label="Dự án có công việc" value={String(projectWorkGroups(items).length)} note="Trong phạm vi bạn được xem" tone="blue"/>
        <Kpi icon="CV" label="Tổng nhiệm vụ" value={String(items.length)} note="Toàn bộ nhiệm vụ đang giao" tone="green"/>
        <Kpi icon="QH" label="Quá hạn" value={String(items.filter(isTaskLate).length)} note="Cần xử lý trước" tone="red"/>
      </div>
      <section className="card">
        <CardHead title="CÔNG VIỆC THEO DỰ ÁN" note="MT3 §A.2 — tổng hợp nhiệm vụ đang có theo từng dự án."/>
        <div className="table-wrap"><table><thead><tr><th>Dự án</th><th>Số nhiệm vụ</th><th>Đã xong</th><th>Quá hạn</th><th>Tỉ lệ hoàn thành</th></tr></thead>
          <tbody>{projectWorkGroups(items).map((g) => <tr key={g.code || g.label}>
            <td><strong>{g.label}</strong></td>
            <td>{g.rows.length}</td>
            <td>{g.done}</td>
            <td>{g.late}</td>
            <td>{workRate(g.rows)}%</td>
          </tr>)}</tbody></table></div>
        {!projectWorkGroups(items).length && <small>Chưa có nhiệm vụ nào thuộc dự án trong phạm vi bạn được xem.</small>}
      </section>
    </div>}

    {tab === 3 && <div className="stack" data-vntech="work-dept-tab">
      {/* VIỆC 7 (USER 08/10/2026) — tab «Phòng ban/ Tổ đội»: **2 SUB-TAB** (việc phòng ban · việc tổ đội)
          + Kanban/Cây chuyển thành **«CHẾ ĐỘ XEM»** (user chốt: giữ dạng chế độ xem) ⇒ tab gọn mà ⛔ không mất chức năng.
          ⚠️ Giữ NGUYÊN 2 nhãn cũ («Việc phòng ban của tôi» · «Việc của tổ đội tôi tham gia») để ⛔ không phá `t06`. */}
      <section className="card">
        <CardHead title="Phòng ban/ Tổ đội"
          note={`Việc của phòng ban và của tổ đội bạn tham gia — phạm vi được phép: ${scopeNote}`}/>
        <div className="project-scope-tabs" role="tablist" aria-label="Phòng ban hay tổ đội">
          <button type="button" role="tab" aria-selected={deptTab === "dept"} className={deptTab === "dept" ? "active" : ""}
            data-vntech="work-dept-subtab-dept" onClick={() => setDeptTab("dept")}>Việc phòng ban của tôi · {deptWork.length}</button>
          <button type="button" role="tab" aria-selected={deptTab === "team"} className={deptTab === "team" ? "active" : ""}
            data-vntech="work-dept-subtab-team" onClick={() => setDeptTab("team")}>Việc của tổ đội tôi tham gia · {teamWork.length}</button>
        </div>
        {/* ⛔ TẠM ẨN «CHẾ ĐỘ XEM» Kanban/Cây (USER 08/10/2026 — «tạm thời ẩn Kanban/cây, ghi vào log nếu sau này
            cần thì dùng lại»). ⭐ GIỮ NGUYÊN MÃ 2 khối bên dưới + import — chỉ ẨN khỏi giao diện.
            ⭐ BẬT LẠI: đổi `WORK_VIEW_MODES_HIDDEN = false` (ĐÚNG 1 CHỖ) — xem hằng số ở cấp module. */}
        {!WORK_VIEW_MODES_HIDDEN && <div className="project-scope-tabs" role="tablist" aria-label="Chế độ xem">
          {([["list", "Bảng"], ["kanban", "Kanban"], ["tree", "Cây"]] as const).map(([mode, label]) =>
            <button key={mode} type="button" role="tab" aria-selected={deptView === mode} className={deptView === mode ? "active" : ""}
              data-vntech={`work-dept-view-${mode}`} onClick={() => setDeptView(mode)}>{label}</button>)}
        </div>}
      </section>
      {/* ⚠️ Khi đã ẩn «chế độ xem» thì LUÔN hiện bảng (`WORK_VIEW_MODES_HIDDEN` ⇒ bỏ qua `deptView`) — tránh
          trường hợp `deptView` còn giá trị cũ mà ⛔ không có nút nào để đổi lại ⇒ màn trắng. */}
      {(WORK_VIEW_MODES_HIDDEN || deptView === "list") && <section className="card">
        {deptTab === "dept"
          ? <><CardHead title="Việc phòng ban của tôi" note="Nhiệm vụ thuộc phòng mà tài khoản trực thuộc — chỉ trong phạm vi được phép"/>
              <TaskTable rows={find(deptWork)} allowEdit={false} projCode={projCode} busy={busy} send={send} onOpenDetail={setDetailRow}/></>
          : <><CardHead title="Việc của tổ đội tôi tham gia" note="Thành viên tổ đội đang hoạt động (đã lọc theo cùng phạm vi được phép)"/>
              <TaskTable rows={find(teamWork)} allowEdit={false} projCode={projCode} busy={busy} send={send} onOpenDetail={setDetailRow}/></>}
      </section>}
      {!WORK_VIEW_MODES_HIDDEN && deptView === "kanban" && <WorkKanban rows={scopedWork} busy={busy} myId={myId} isAdmin={scope.isAdmin} managerDepartments={kanbanManagerDepartments(me)}
        scopeNote={`Phạm vi: ${scopeNote}`} onMove={moveStatus}/>}
      {/* PHASE 3 (`T-09`) — KIẾN TRÚC 4 CẤP Task → Team → Thành viên → Hỗ trợ liên phòng (§10).
          Nay nằm trong CHẾ ĐỘ XEM «Cây» của tab «Phòng ban/ Tổ đội» (VIỆC 7) — ⛔ vẫn KHÔNG mở màn/menu mới.
          Bấm Team/Nhân sự mở `EntityDetailModal` qua cổng dùng chung `ProjectEntityModal` (PR-04). */}
      {!WORK_VIEW_MODES_HIDDEN && deptView === "tree" && <WorkHierarchy data={data} rows={find(scopedWork)} scopeNote={`Phạm vi: ${scopeNote}`} permission={modulePermission(data, "dept_plan_assign")}/>}
    </div>}

    {tab === 4 && <div className="stack">
      {canAssign && <section className="card">
        <CardHead title="Giao việc cho nhân viên" note="Chỉ Trưởng phòng hoặc Quản trị viên giao được việc thủ công — backend chặn bằng userIsDepartmentManager. Bàn giao chi tiết (hồ sơ · dòng thời gian · đổi trạng thái) nằm ở mục «Giao việc» của menu."/>
        <form onSubmit={(e) => { e.preventDefault(); const f = e.currentTarget; const fd = new FormData(f);
          void send("create_work_item", { departmentCode: fd.get("departmentCode"), title: fd.get("title"), description: fd.get("description"),
            projectId: fd.get("projectId"), assignedTo: fd.get("assignedTo"), dueAt: fd.get("dueAt"),
            priority: fd.get("priority"), requiredOutput: fd.get("requiredOutput") }, f); }}>
          <div className="form-grid">
            <label><span>Phòng ban *</span><select name="departmentCode" required><option value="KH">Phòng Kế hoạch (KH)</option><option value="DA">Phòng Dự án (DA)</option></select></label>
            <label><span>Giao cho *</span><select name="assignedTo" required><option value="">— Chọn nhân viên —</option>{users.filter((u) => u.active !== false).map((u) => <option key={String(u.id)} value={String(u.id)}>{u.fullName} · {u.roleName || u.role || ""}</option>)}</select></label>
            <label className="full"><span>Nội dung công việc *</span><input name="title" required/></label>
            {/* ⭐ FIX `BUG-20261008-D10` (vòng 58): payload gửi đi ĐỌC `fd.get("description")` (dòng dưới)
                nhưng form ⛔ **THIẾU ô nhập** ⇒ «Mô tả» LUÔN RỖNG khi giao việc. Ô này phải có `name="description"`
                — khuôn giống modal «Tạo công việc» (cùng tệp, khối tự tạo việc). */}
            <label className="full"><span>Mô tả</span><textarea name="description" rows={2}/></label>
            <label><span>Dự án</span><select name="projectId"><option value="">— Không gắn dự án —</option>{(data.projects || []).map((p) => <option key={String(p.id)} value={String(p.id)}>{p.code} · {p.name}</option>)}</select></label>
            <label><span>Hạn hoàn thành</span><input name="dueAt" type="date"/></label>
            <label><span>Ưu tiên</span><select name="priority"><option value="normal">Bình thường</option><option value="high">Cao</option><option value="urgent">Khẩn</option></select></label>
            <label><span>Kết quả cần có</span><input name="requiredOutput"/></label>
          </div>
          <PermissionGuard allow={canAssign}><div className="row-actions"><button className="primary" disabled={busy}>＋ Giao việc</button></div></PermissionGuard>
        </form>
      </section>}
      {!canAssign && <section className="card">
        <CardHead title="Giao việc cho nhân viên" note="Tài khoản của bạn chưa có quyền tạo việc (canCreate) ở module giao việc — liên hệ Trưởng phòng hoặc Quản trị hệ thống."/>
      </section>}
    </div>}

    {tab === 0 && <div className="stack">
      <section className="card">
        <CardHead title="Dashboard công việc"
          note={isOverseer ? "Phạm vi: TOÀN BỘ nhân sự (quyền CEO/Quản trị)" : "Phạm vi: phòng ban của bạn"}/>
        <div className="kpi-grid small">
          <Kpi icon="TC" label="Tỉ lệ chung" value={`${workRate(items)}%`} note={`${items.filter((r) => String(r.status) === "COMPLETED").length}/${items.length} nhiệm vụ`} tone="green"/>
          <Kpi icon="QH" label="Đang quá hạn" value={String(items.filter(isTaskLate).length)} note="Trong phạm vi thấy được" tone="red"/>
          <Kpi icon="NV" label="Nhân sự có việc" value={String(kpiRows.filter((r) => r.total > 0).length)} note={`${kpiRows.length} nhân sự trong phạm vi`} tone="blue"/>
          <Kpi icon="TH" label={`Việc tháng ${kpiMonth}`} value={String(kpiRows.reduce((s, r) => s + r.mTotal, 0))} note={`${kpiRows.reduce((s, r) => s + r.mDone, 0)} đã hoàn thành`} tone="violet"/>
        </div>
      </section>
      {/* PHASE 3 (`T-08`) — §11: 3 KHỐI «cá nhân · phòng ban · dự án». Mọi số tính từ dữ liệu ĐANG CÓ trong payload
          (KHÔNG gọi API mới); chỉ số nào không có nguồn thì ghi rõ «chưa có nguồn», KHÔNG bịa số.
          Khối «Cá nhân» nhận ĐÚNG tập việc của tôi; hai khối kia nhận tập việc trong PHẠM VI ĐƯỢC PHÉP (T-06). */}
      {/* MT2-P6-01 (§4.1) — card «Chờ Giám đốc duyệt»: chỉ hiện khi user ĐỦ QUYỀN (API 403 ⇒ tự ẩn). */}
      {/* MT2-P6-06 (§4.4) — card «Đơn quá hạn SLA»: ĐẾM từ payload; thiếu nguồn ⇒ «chưa có nguồn» (⛔ không hiện 0). */}
      <div className="kpi-grid small"><DirectorPendingCard/><Kpi icon="QH" label="Đơn quá hạn SLA" value={overdueApprovalCount(data) === null ? "chưa có nguồn" : String(overdueApprovalCount(data))} note="Phiếu đang chờ đã quá hạn xử lý" tone="red"/></div>
      {/* VIỆC 3 (USER 08/10/2026) — tab «Dashboard» phải hiển thị CÔNG VIỆC CỦA CHÍNH USER NÀY và cho
          **NHẬP % HOÀN THÀNH** ngay tại đây (thay cho các nút «Thao tác» preset cũ).
          ⚠️ Dùng ĐÚNG tập `mine` (= việc `assignedTo` = tôi) — cùng nguồn với tab Cá nhân, ⛔ không gọi API mới. */}
      <section className="card">
        <CardHead title="Việc của tôi (Dashboard)"
          note={`${mine.length} việc mang tên bạn · ${mine.filter((r) => String(r.status) === "COMPLETED").length} đã hoàn thành — nhập % và gửi kiểm tra ngay tại đây`}/>
        <TaskTable rows={find(mine)} allowEdit projCode={projCode} busy={busy} send={send} canApproveRow={canApproveRow} onOpenDetail={setDetailRow}/>
      </section>
      <WorkDashboard data={data} personalRows={mine} scopeRows={scopedWork} isLate={isTaskLate} scopeNote={scopeNote}/>
    </div>}

    {tab === 6 && <div className="stack">
      <section className="card">
        <CardHead title="Tỉ lệ hoàn thành theo nhân viên"
          note={isOverseer ? "Phạm vi: TOÀN BỘ nhân sự (quyền CEO/Quản trị)" : "Phạm vi: phòng ban của bạn"}/>
        <DataTable rows={kpiRows} rowKey={(r) => String(String(r.u.id))} columns={[{ key: "c1", header: "Nhân viên", render: (r) => <><strong>{r.u.fullName}</strong><small>{r.u.employeeCode || r.u.username || ""}</small></> }, { key: "c2", header: "Phòng ban", render: (r) => <>{r.u.organizationName || r.u.department || "—"}</> }, { key: "c3", header: "Chức vụ", render: (r) => <>{r.u.roleName || r.u.role || "—"}</> }, { key: "c4", header: "Tổng việc", render: (r) => <>{r.total}</> }, { key: "c5", header: "Hoàn thành", render: (r) => <><strong>{r.done}</strong></> }, { key: "c6", header: "Quá hạn", cellClassName: (r) => (r.late ? "red-text" : ""), render: (r) => <>{r.late}</> }, { key: "c7", header: "Tỉ lệ", render: (r) => <><div className="task-bar"><span><i style={{ width: `${r.rate}%` }} /></span><b>{r.rate}%</b></div></> }, { key: "c8", header: "Tháng này", render: (r) => <>{r.mDone}/{r.mTotal}</> }]} emptyText="Chưa có dữ liệu KPI." />
      </section>
      {isOverseer && <section className="card">
        <CardHead title="KPI theo phòng ban" note="Chỉ CEO/Ban lãnh đạo/Quản trị hệ thống thấy toàn bộ"/>
        <DataTable rows={kpiByDept} rowKey={(d) => String(d.code)} columns={[{ key: "c1", header: "Phòng ban", render: (d) => <><strong>{d.code}</strong></> }, { key: "c2", header: "Tổng việc", render: (d) => <>{d.total}</> }, { key: "c3", header: "Tỉ lệ hoàn thành", render: (d) => <><div className="task-bar"><span><i style={{ width: `${d.rate}%` }} /></span><b>{d.rate}%</b></div></> }]} emptyText="Chưa có nhiệm vụ theo phòng ban." />
      </section>}
      <ReportView catalog={WORK_REPORT_CATALOG.map((entry) => entry.def)} rowsFor={(key) => sourceRows(findEntry(key)?.source ?? "workItems", data)} />
    </div>}
    {/* VIỆC 5 (USER 08/10/2026) — **MODAL CHI TIẾT CÔNG VIỆC**: mở bằng click **CẢ DÒNG**
        (`onRowClick` của `DataTable`) hoặc nút mã việc (a11y/bàn phím).
        Khuôn chuẩn dự án: `.overlay` → `.modal card` (`role=dialog` + `aria-modal`) → `.modal-head` + ✕ `aria-label="Đóng"`
        → `.modal-body` → `footer.modal-actions`.
        ⚠️ «Nhận xét» **TẠM ẨN** theo QUYẾT ĐỊNH CỦA USER (thẻ quyết định 08/10/2026): BE Java ⛔ CHƯA có handler
        `add_work_item_comment` (gọi vào trả **400**) ⇒ hiện DÒNG THÔNG BÁO, ⛔ KHÔNG hiện nút chết. */}
    {detailRow && <div className="overlay" onMouseDown={(event) => event.target === event.currentTarget && setDetailRow(null)}>
      <div className="modal card" data-vntech="work-detail-modal" role="dialog" aria-modal="true" aria-label="Chi tiết công việc">
        <div className="modal-head"><strong>{String(detailRow.taskNo || "Công việc")}</strong>
          <button type="button" onClick={() => setDetailRow(null)} aria-label="Đóng">✕</button></div>
        <div className="modal-body">
          <h3>{String(detailRow.title || "—")}</h3>
          <div className="form-grid">
            <label><span>Người làm</span><div>{String(detailRow.assignedToName || "—")}</div></label>
            <label><span>Người giao</span><div>{String(detailRow.assignedByName || "—")}</div></label>
            <label><span>Dự án</span><div>{projCode(detailRow.projectId)}</div></label>
            <label><span>Phòng ban</span><div>{String(detailRow.departmentCode || "—")}</div></label>
            <label><span>Hạn hoàn thành</span><div>{detailRow.dueAt ? date(detailRow.dueAt) : "—"}{isTaskLate(detailRow) && <small className="red-text"> Quá hạn</small>}</div></label>
            <label><span>Ưu tiên</span><div>{statusLabel(detailRow.priority, "priority")}</div></label>
            <label><span>Tiến độ</span><div><div className="task-bar"><span><i style={{ width: `${Number(detailRow.progress || 0)}%` }} /></span><b>{Number(detailRow.progress || 0)}%</b></div></div></label>
            <label><span>Trạng thái</span><div><StatusBadge value={WORK_STATUS_LABELS[String(detailRow.status)] || statusLabel(detailRow.status, "work_item")}/></div></label>
            <label className="full"><span>Kết quả cần có</span><div>{String(detailRow.requiredOutput || "—")}</div></label>
          </div>
          <CardHead title="Nhận xét" note="Trao đổi trên công việc"/>
          <p className="muted" data-vntech="work-comment-pending">Nhận xét sẽ bật sau khi backend hoàn tất phần bình luận công việc — hiện ⛔ chưa mở nút để tránh bấm vào là lỗi.</p>
        </div>
        <footer className="modal-actions">
          <button type="button" className="secondary" onClick={() => setDetailRow(null)}>Đóng</button>
          {String(detailRow.status) !== "COMPLETED" && (canApproveRow(detailRow)
            ? <button type="button" className="primary" disabled={busy} data-vntech="work-detail-approve"
                onClick={() => { void send("update_work_item_status", { workItemId: detailRow.id, status: "COMPLETED" }); setDetailRow(null); }}>Duyệt xong</button>
            : <button type="button" className="primary" disabled={busy} data-vntech="work-detail-submit"
                onClick={() => { void send("update_work_item_status", { workItemId: detailRow.id, status: "SUBMITTED" }); setDetailRow(null); }}>Gửi kiểm tra</button>)}
        </footer>
      </div>
    </div>}
  </div>;
}


// U-13 — TaskTable khai báo ở CẤP MODULE (trước đây nằm trong thân render của WorkCenter).
// Khai báo trong thân render tạo component MỚI mỗi lần render ⇒ state bên trong bị reset, và eslint
// báo react-hooks/static-components. Nay nhận đủ dữ liệu qua props thay vì đóng kín vào WorkCenter:
//   rows · allowEdit · projCode · busy · send
function TaskTable({ rows, allowEdit, projCode, busy, send, canApproveRow, onOpenDetail }: { rows: Row[]; allowEdit: boolean; projCode: (id: unknown) => string; busy: boolean; send: (name: string, payload: Row) => Promise<void>; canApproveRow?: (row: Row) => boolean; onOpenDetail?: (row: Row) => void }) {
  return <DataTable rows={rows} rowKey={(r) => String(String(r.id))} onRowClick={onOpenDetail ? (row) => onOpenDetail(row) : undefined} columns={[{ key: "c1", header: "Mã việc", render: (r) => (onOpenDetail
      // VIỆC 5 (USER 08/10/2026) — click MỞ CHI TIẾT: dùng class có sẵn của dự án `.link-cell`
      // (⚠️ ⛔ KHÔNG bịa class mới); cửa chính là **click CẢ DÒNG** (`onRowClick`), nút này giữ cho BÀN PHÍM/a11y.
      ? <button type="button" className="link-cell code" data-vntech="work-open-detail" title="Xem chi tiết công việc" onClick={() => onOpenDetail(r)}>{r.taskNo}</button>
      : <strong className="code">{r.taskNo}</strong>) }, { key: "c2", header: "Nội dung", render: (r) => <>{r.title}<small>{r.requiredOutput || r.workGroup || ""}</small></> }, { key: "c3", header: "Người làm", render: (r) => <>{r.assignedToName || "—"}</> }, { key: "c4", header: "Dự án", render: (r) => <>{projCode(r.projectId)}</> }, { key: "c5", header: "Hạn", render: (r) => <>{r.dueAt ? date(r.dueAt) : "—"}{isTaskLate(r) && <small className="red-text">Quá hạn</small>}</> }, { key: "c6", header: "Ưu tiên", render: (r) => <>{statusLabel(r.priority, "priority")}</> }, { key: "c7", header: "Tiến độ", render: (r) => <><div className="task-bar"><span><i style={{ width: `${Number(r.progress || 0)}%` }} /></span><b>{Number(r.progress || 0)}%</b></div></> }, { key: "c8", header: "Trạng thái", render: (r) => <><StatusBadge value={WORK_STATUS_LABELS[String(r.status)] || statusLabel(r.status, "work_item")}/></> }, { key: "c9", header: "Tiến độ & xác nhận", render: (r) => <ProgressCell row={r} busy={busy} allowEdit={allowEdit} canApprove={Boolean(canApproveRow?.(r))}
          onProgress={(row, value) => void send("update_work_item_progress", { workItemId: row.id, progress: value })}
          onStatus={(row, status, reason) => void send("update_work_item_status", { workItemId: row.id, status, reason })}/> }]} emptyText="Chưa có nhiệm vụ nào." />;
}


// ══════════════════════════════════════════════════════════════════════════════════════════════════
// VIỆC 3 (USER 08/10/2026) — CỘT «TIẾN ĐỘ & XÁC NHẬN»: **NHẬP %** thay 4 nút preset,
//   ⭐ ĐỒNG THỜI SỬA `BUG-20261008-D05` (nút «Xong» cũ gửi `COMPLETED` cho MỌI user ⇒ BE từ chối).
//
// ⚠️ LUẬT BE ĐÃ ĐO — `scripts/system-route.mjs:1275`:
//   `if (next==='COMPLETED' && !manager) throw new Error("Người thực hiện chỉ Gửi kiểm tra;
//    Trưởng phòng/người có thẩm quyền mới xác nhận Hoàn thành.")`
//   ⇒ **người thực hiện gửi `SUBMITTED`** («Gửi kiểm tra»), **chỉ người duyệt** mới gửi `COMPLETED`.
//   Mã trạng thái hợp lệ của route (`TASK_STATUSES:260`): NEW · IN_PROGRESS · WAITING_* · BLOCKED · ON_HOLD ·
//   **SUBMITTED** · **REWORK** · **COMPLETED** · CANCELLED.
//   ✅ ĐÃ SỬA 08/10/2026 (`BUG-20261008-D14`): `REWORK` + 4 mã `WAITING_*` đã được **thêm vào Java**
//      (`OpsTaskManagementUseCase.TASK_STATUSES`) ⇒ nay **2 đường PHỦ NHAU** (có test chống lệch ở `tests/t13`).
// ⚠️ `REWORK` ⛔ KHÔNG bắt buộc lý do ở BE (`TASK_WAITING:261` chỉ gồm WAITING_*/BLOCKED/ON_HOLD) —
//   nhưng yêu cầu NGHIỆP VỤ của user là «yêu cầu làm lại phải nêu lý do» ⇒ FE TỰ CHẶN bằng `disabled`.
// ══════════════════════════════════════════════════════════════════════════════════════════════════
function ProgressCell({ row, busy, allowEdit, canApprove, onProgress, onStatus }: {
  row: Row; busy: boolean; allowEdit: boolean; canApprove: boolean;
  onProgress: (row: Row, value: number) => void; onStatus: (row: Row, status: string, reason?: string) => void;
}) {
  const [value, setValue] = useState(String(Number(row.progress || 0)));
  const [reason, setReason] = useState("");
  const status = String(row.status || "");
  if (!allowEdit) return <span className="muted">—</span>;
  if (status === "COMPLETED") return <span className="muted">Đã hoàn thành</span>;
  const clamped = () => Math.max(0, Math.min(100, Number(value) || 0));
  // VIỆC 5 (USER 08/10/2026) — ⚠️ BẮT BUỘC khi bật `onRowClick`: mọi cú click TRONG ô này (nhập % · Lưu · Duyệt ·
  //   Yêu cầu làm lại · Lý do) phải DỪNG LAN TRUYỀN, nếu ⛔ không thì vừa nhập % vừa bật modal chi tiết.
  return <div className="row-actions" data-vntech="work-progress-cell" onClick={(event) => event.stopPropagation()}>
    <input type="number" min={0} max={100} step={5} value={value} disabled={busy} aria-label="Phần trăm hoàn thành"
      className="export-mini" style={{ width: 78 }} onChange={(e) => setValue(e.target.value)}/>
    <button type="button" className="export-mini" disabled={busy} data-vntech="work-progress-save"
      title="Lưu phần trăm hoàn thành" onClick={() => onProgress(row, clamped())}>Lưu %</button>
    {canApprove ? <>
      <button type="button" className="export-mini" disabled={busy} data-vntech="work-approve"
        title="Xác nhận công việc đã hoàn thành" onClick={() => onStatus(row, "COMPLETED")}>Duyệt xong</button>
      <input value={reason} disabled={busy} aria-label="Lý do yêu cầu làm lại" placeholder="Lý do làm lại…"
        className="export-mini" style={{ width: 150 }} onChange={(e) => setReason(e.target.value)}/>
      <button type="button" className="export-mini" disabled={busy || !reason.trim()} data-vntech="work-rework"
        title={reason.trim() ? "Gửi yêu cầu làm lại kèm lý do" : "Phải nhập lý do trước khi yêu cầu làm lại"}
        onClick={() => { onStatus(row, "REWORK", reason.trim()); setReason(""); }}>Yêu cầu làm lại</button>
    </> : (status === "SUBMITTED"
      ? <span className="muted">Đã gửi kiểm tra — chờ trưởng phòng</span>
      : <button type="button" className="export-mini" disabled={busy} data-vntech="work-submit"
          title="Người thực hiện chỉ GỬI KIỂM TRA; trưởng phòng mới xác nhận hoàn thành"
          onClick={() => onStatus(row, "SUBMITTED")}>Gửi kiểm tra</button>)}
  </div>;
}

function isTaskLate(row: Row): boolean {
  if (WORK_CLOSED.includes(String(row.status))) return false;
  const d = daysFromToday(row.dueAt);
  return d !== null && d > 0;
}

// U-13 — TaskTable khai báo ở CẤP MODULE (trước đây nằm trong thân render của WorkCenter).
// Khai báo trong thân render tạo component MỚI mỗi lần render ⇒ state bên trong bị reset, và eslint
// báo react-hooks/static-components. Nay nhận đủ dữ liệu qua props thay vì đóng kín vào WorkCenter:
//   rows · allowEdit · projCode · busy · send

function workRate(rows: Row[]): number {
  if (!rows.length) return 0;
  return Math.round((rows.filter((r) => String(r.status) === "COMPLETED").length / rows.length) * 100);
}
export {
  ProgressCell,
  TaskTable,
  WorkCenter,
  isTaskLate,
  workRate,
};
