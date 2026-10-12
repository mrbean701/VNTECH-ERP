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
// PHASE 3 (`T-05`) — tab «Danh sách công việc»: **HAI NHÓM** (user chốt 08/10/2026: «gộp lại thành 2 nhóm cho gọn»)
//   — «Của tôi» = TOÀN BỘ việc của bản thân · «Đã giao» = việc tôi giao cho NGƯỜI KHÁC — mỗi nhóm một bộ lọc + bộ đếm.
// ⭐ `W2` (đặc tả user 08/10/2026) — cùng tab có CÁCH XEM thứ hai «Theo người»: xem danh sách công việc của
//   NGƯỜI KHÁC **theo phạm vi do MÁY CHỦ quyết** (trưởng phòng → người trong phòng mình · giám đốc/admin → mọi người):
//   chỉ GOM lại những dòng ĐÃ có trong payload (`scopedWork`) ⇒ ⛔ không thêm API, ⛔ không nới quyền.
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
import type { AppData, ModuleKey, Row } from "@/lib/ui-shared";
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
// ⭐ USER 08/10/2026 (yêu cầu trực tiếp): «Được giao» **ĐÃ NẰM TRONG tab «Danh sách công việc»** (nhóm con `assigned`
//   trong `PERSONAL_GROUPS`) ⇒ ⛔ KHÔNG cần tab riêng ⇒ **ẨN NÚT TAB** (index 2).
// ⚠️ CÁCH LÀM CÓ CHỦ Ý — **GIỮ NGUYÊN chỉ số** của `WORK_TABS` · `WORK_TAB_OF_VIEW` · **các khối nội dung theo index**:
//   ⛔ **KHÔNG xoá phần tử** khỏi mảng: nội dung mỗi tab chọn theo **CHỈ SỐ** (`tab === i`) ⇒ xoá 1 phần tử sẽ làm
//   **LỆCH chỉ số** từ index 2 trở đi ⇒ tab «Phòng ban/Tổ đội»/«Giao việc»/«Dự án»/«Báo cáo» **hiện SAI nội dung**
//   (bẫy im lặng, ⛔ không báo lỗi). ⭐ Đúng tiền lệ `WORK_VIEW_MODES_HIDDEN` ngay dưới: giữ mã, ẩn nút.
//   🔁 BẬT LẠI = xoá 1 phần tử khỏi mảng này (`WORK_TABS_HIDDEN = []`).
const WORK_TABS_HIDDEN = ["Được giao"];
// ⭐ ÁNH XẠ `view` (từ menu) → CHỈ SỐ TAB của dải 7 tab ở trên:
//   «Dashboard»=0 · «Danh sách công việc»=1 · «Được giao»=2 · «Phòng ban/ Tổ đội»=3 · «Giao việc»=4 · «Dự án»=5 · «Báo cáo»=6
// ⚠️ GIỮ alias `kpi: 0` (cùng tab Dashboard) vì `WorkMenuView` vẫn còn `"kpi"` — đúng chủ ý cũ (MT2-P5-01).
// ⚠️ `personal` là «Danh sách công việc» (tên mới), ⛔ KHÔNG phải tab Dashboard.
const WORK_TAB_OF_VIEW: Record<WorkMenuView, number> = { personal: 1, department: 3, assign: 4, kpi: 0, dashboard: 0, reports: 6 };

// -------------------------------------------------------------------------------------------------
// W4-PURE-BEGIN
// ── W4 · DẢI TAB ĐỌC **6 KHOÁ `work_*`** (khối thuần — test t13 TRÍCH RA và CHẠY) ────────────────────
//
// ⭐ HỢP ĐỒNG 2 TẦNG (S01 `HANDOFF-20261009-A09`): ① **khoá TAB** (`work_*`) = *vào/không vào **tab***
//   ② khoá cha `work` + 6 năng lực = *được **THAO TÁC** gì* ⇒ ⛔ **KHÔNG trộn 2 tầng khi code**.
// ⭐ **PHƯƠNG ÁN `A` — «LÙI AN TOÀN» (USER CHỐT 09/10/2026)**: chỉ lọc tab khi tài khoản **ĐÃ CÓ ≥1 khoá `work_*`**;
//   ⛔ **chưa có khoá nào** ⇒ **GIỮ NGUYÊN 7 tab như hiện tại** (⛔ không trắng màn — cấp ban đầu có thể = 0).
// ⚠️ `key: null` = tab **KHÔNG có khoá riêng** (hiện chỉ «Được giao» — tab này **ẨN CỨNG** ở `WORK_TABS_HIDDEN`,
//   ⛔ không phải ẩn theo quyền) ⇒ ⛔ KHÔNG gán khoá bừa cho nó.
// ⚠️ BẤT BIẾN: mảng này phải **KHỚP 1-1 theo THỨ TỰ** với `WORK_TABS` (nội dung tab chọn theo **CHỈ SỐ** —
//   xem chú thích «GIỮ NGUYÊN chỉ số» ở `WORK_TABS_HIDDEN`); `tests/t13` khoá bất biến đó.
const WORK_TAB_KEYS: { label: string; key: ModuleKey | null }[] = [
  { label: "Dashboard", key: "work_dashboard" },
  { label: "Danh sách công việc", key: "work_list" },
  { label: "Được giao", key: null },
  { label: "Phòng ban/ Tổ đội", key: "work_department" },
  { label: "Giao việc", key: "work_assign" },
  { label: "Dự án", key: "work_project" },
  { label: "Báo cáo", key: "work_reports" },
];

/** Tab nào đang HIỆN, theo khoá quyền — hàm THUẦN (test chạy thật, ⛔ không cần DOM). */
function visibleWorkTabs(canView: (key: ModuleKey) => boolean) {
  // ⭐ PHƯƠNG ÁN `A`: chỉ bật luật lọc khi tài khoản **ĐÃ CÓ ≥1 khoá `work_*`** (⛔ chưa có ⇒ giữ nguyên như cũ).
  const coKhoa = WORK_TAB_KEYS.some((row) => Boolean(row.key) && row.key !== null && canView(row.key));
  return WORK_TAB_KEYS.map((row, index) => ({
    ...row,
    index,
    visible: !WORK_TABS_HIDDEN.includes(row.label) && (!row.key || !coKhoa || canView(row.key)),
  }));
}
// W4-PURE-END

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
  { key: "mine", label: "Của tôi", note: "TOÀN BỘ việc của tôi — gồm việc tôi tự tạo VÀ việc người khác giao cho tôi" },
  { key: "assignedOut", label: "Đã giao", note: "Việc tôi đã GIAO CHO NGƯỜI KHÁC (⛔ không tính việc tôi tự tạo cho chính mình)" },
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
  // ⚠️ DỌN TỒN DƯ (09/10/2026 · `ERP-SESSION-04`): dòng `const assigned = mine.filter(...)` cũ đã bỏ vì nhóm
  //   «Được giao» bị GỘP vào «Của tôi» (quyết định 2 nhóm của user) ⇒ biến không còn dùng ⇒ `eslint` báo warning.
  //   ② (giữ lại chú thích cũ bên dưới để ⛔ không mất dấu vết quyết định nghiệp vụ)
  // ⭐ GỘP THÀNH 2 NHÓM (USER chốt 08/10/2026, `ERP-SESSION-04`):
  //   «*gộp lại thành 2 nhóm cho gọn — «Của tôi»: bao gồm việc của bản thân tự tạo VÀ việc của người khác giao;
  //    «Đã giao»: bao gồm TẤT CẢ các việc mà bản thân đã giao cho người khác*»
  //   ⚠️ Trước đây 3 nhóm (`mine` · `assigned` · `created`) ⇒ nhóm «Được giao» là **tập con của «Của tôi»**
  //   (trùng lặp) nên user gộp lại; nhóm 3 đổi từ «Do tôi tạo» (`assignedBy === tôi`, gồm cả tự giao cho mình)
  //   sang «Đã giao» (`assignedBy === tôi` ⛔ **VÀ** `assignedTo !== tôi`) — đúng đặc tả «giao CHO NGƯỜI KHÁC».
  const assignedOut = rows.filter((row) => String(row.assignedBy) === myId && String(row.assignedTo) !== myId);
  return [
    { ...PERSONAL_GROUPS[0], rows: mine, count: mine.length },
    { ...PERSONAL_GROUPS[1], rows: assignedOut, count: assignedOut.length },
  ];
}
// T05-PURE-END

// -------------------------------------------------------------------------------------------------
// W2-PURE-BEGIN
// ── W2 · «XEM DANH SÁCH CÔNG VIỆC CỦA NGƯỜI KHÁC» THEO PHẠM VI (khối thuần — test t14 TRÍCH RA và CHẠY) ─
//
// YÊU CẦU USER (nguyên văn): «*trưởng phòng … có quyền xem danh sách công việc của người khác **thuộc phòng ban
// của mình***» · «*giám đốc - admin … xem tất cả các danh sách công việc của user … **toàn bộ user trong hệ thống***».
//
// ⭐ PHẠM VI DO **MÁY CHỦ** QUYẾT — ⛔ GIAO DIỆN KHÔNG NƠI QUYỀN:
//   `workItems` trong payload đã được bootstrap lọc sẵn bằng `workItemWhere` (`work_scope` + `isDepartmentManager`:
//   trưởng phòng → việc phòng mình · giám đốc/admin → toàn hệ thống). Hàm dưới chỉ **GOM LẠI** đúng những dòng
//   ĐÃ ĐƯỢC TRẢ VỀ ⇒ ⛔ không gọi API mới, ⛔ không tự sinh dòng, ⛔ không đọc tên trường nào ngoài hợp đồng
//   `assignedTo` / `assignedToName` (đã ĐO ở khối T-05 ngay trên).
//   ⚠️ Nhóm theo **`assignedTo`** (KHOÁ ĐỊNH DANH), ⛔ KHÔNG nhóm theo `assignedToName`: hai người TRÙNG TÊN phải
//   là 2 nhóm, nếu không thì bộ đếm của mỗi người sẽ SAI (bài học «đo, ⛔ không đoán»).
const OWNER_VIEW_MODES = [
  { key: "group", label: "Nhóm của tôi" },
  { key: "owner", label: "Theo người" },
];
// Dòng ⛔ không có `assignedTo` (dữ liệu cũ/thiếu) ⇒ gom vào 1 nhóm riêng ⛔ không gán bừa cho ai.
const OWNER_UNKNOWN_LABEL = "Chưa gán người thực hiện";
// ⚠️ GIÁ TRỊ GỬI CỦA Ô CHỌN «Xem việc của» cho nhóm «chưa gán người» — khoá THẬT của nhóm đó là **chuỗi rỗng** `""`,
//   mà `""` lại là giá trị của mục «— Nhóm của tôi —» ⇒ phải có **sentinel** để ⛔ không lẫn 2 trạng thái
//   (⚠️ đây là lớp lỗi im lặng: chọn «chưa gán người» mà hoá ra về chế độ nhóm).
const OWNER_UNKNOWN_KEY = "__khong_ro__";

/** Gom việc theo NGƯỜI THỰC HIỆN (`assignedTo`) — khuôn sao chép từ `projectWorkGroups` (REUSE, ⛔ không viết mới). */
function workByOwnerGroups(rows: Row[]) {
  const map = new Map<string, { key: string; label: string; rows: Row[] }>();
  for (const row of rows) {
    const key = String(row.assignedTo || "").trim();
    const label = String(row.assignedToName || "").trim() || (key ? key : OWNER_UNKNOWN_LABEL);
    const current = map.get(key) || { key, label, rows: [] };
    current.rows.push(row);
    map.set(key, current);
  }
  return [...map.values()]
    .map((group) => ({ ...group, count: group.rows.length }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "vi"));
}
// W2-PURE-END

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
const WORK_DEPT_MODULE_KEYS = ["dept_plan_tasks", "dept_project_tasks", "dept_plan_assign", "dept_project_assign", "work"]; // ⭐ +`work` (08/10/2026 · `ERP-SESSION-04` · `HANDOFF-D13①`): người CHỈ được cấp khoá chung `work` ⛔ trước đây bị chặn khỏi tab «Phòng ban/ Tổ đội» — ⛔ không xoá 4 khoá cũ (vẫn là cổng hợp lệ)

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

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════
// ⭐ USER 09/10/2026 — LỌC + SẮP XẾP cho tab «Danh sách công việc» (áp cho **CẢ 2 nhóm** «Của tôi» và «Đã giao»):
//   «*thêm filter vào 2 tab Của tôi - Đã giao: lọc theo **trạng thái**, sắp xếp theo **trạng thái - ngày hoàn
//   thành - mức độ ưu tiên***»
// ⚠️ Đặt ở **CẤP MODULE** (hàm THUẦN, ⛔ không đọc state) ⇒ ⭐ **test được** bằng `node --import tsx` (⛔ không cần render) ✓
// ⛔ BẤT BIẾN: `"default"` trả **NGUYÊN** thứ tự máy chủ ⇒ ⭐ **hành vi cũ ⛔ không đổi** khi user ⛔ không chọn gì ✓
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════
/** Hạng ƯU TIÊN để sắp xếp — ⚠️ khớp ĐÚNG giá trị `priority` trong payload (`scripts/system-route.mjs` · `BootstrapDataAdapter`). */
export const WORK_PRIORITY_RANK: Record<string, number> = { critical: 0, urgent: 1, high: 2, normal: 3, low: 4 };
/** Lựa chọn SẮP XẾP cho toolbar — ⭐ 3 tiêu chí user yêu cầu + «Mặc định» (= thứ tự máy chủ) ✓ */
export const WORK_SORT_OPTIONS = [
  { value: "default", label: "Mặc định (theo máy chủ)" },
  { value: "status", label: "Theo trạng thái" },
  { value: "completed_desc", label: "Ngày hoàn thành (mới → cũ)" },
  { value: "completed_asc", label: "Ngày hoàn thành (cũ → mới)" },
  { value: "priority", label: "Theo mức độ ưu tiên" },
];
/** Sắp xếp THUẦN trên **bản sao** (⛔ không sửa mảng vào) — `default` ⇒ trả nguyên mảng gốc ✓
 *  ⚠️ «ngày hoàn thành» = `completedAt`; ⭐ **việc CHƯA hoàn thành (rỗng) LUÔN xuống CUỐI ở CẢ 2 CHIỀU**
 *  (⚠️ nếu để thứ tự chuỗi thuần thì chiều «cũ → mới» sẽ đẩy việc chưa xong lên ĐẦU — ⛔ vô nghĩa với người dùng) ✓ */
export function sapXepWork(rows: Row[], sortKey: string): Row[] {
  if (sortKey === "default") return rows;
  const copy = [...rows];
  if (sortKey === "status") copy.sort((a, b) => String(a.status || "").localeCompare(String(b.status || "")));
  else if (sortKey === "completed_desc" || sortKey === "completed_asc") {
    const chieu = sortKey === "completed_desc" ? "desc" : "asc";
    copy.sort((a, b) => {
      const x = String(a.completedAt || ""), y = String(b.completedAt || "");
      if (!x && !y) return 0;
      if (!x) return 1;          // ⭐ chưa hoàn thành ⇒ xuống CUỐI (⛔ không phụ thuộc chiều)
      if (!y) return -1;
      return chieu === "asc" ? x.localeCompare(y) : y.localeCompare(x);
    });
  }
  else if (sortKey === "priority") copy.sort((a, b) => (WORK_PRIORITY_RANK[String(a.priority)] ?? 9) - (WORK_PRIORITY_RANK[String(b.priority)] ?? 9));
  return copy;
}

/** ⭐ VIỆC 2 (USER 09/10/2026) — FORM «Giao việc cho nhân viên» **TÁCH RA DÙNG CHUNG 1 LẦN**:
 *  ① tab «Giao việc» (trong CARD — ⚠️ hành vi cũ ⛔ KHÔNG đổi) ② **MODAL** mở từ nhóm «Đã giao» (yêu cầu user:
 *  «*tab **Đã giao**: modal Tạo công việc ở đây sẽ là modal tạo việc cho **NGƯỜI KHÁC** giống như tab Giao việc*») ✓
 *  ⚠️ VÌ SAO TÁCH: ⛔ KHÔNG được có 2 bản form lệch nhau (⚠️ bài học `BUG-20261008-D10`: form thiếu ô «Mô tả»
 *  ⇒ payload LUÔN rỗng) ⇒ ⭐ **một nguồn sự thật** cho mọi trường đã khoá với backend ✓
 *  ⚠️ `onSubmit` do **NƠI GỌI** quyết: card dùng `send(...)`; modal dùng `action(...)` **TRỰC TIẾP** (vì `send`
 *  trả `Promise<void>` ⇒ ⛔ không biết thành công để ĐÓNG modal — đúng ghi chú ở `submitSelfWork`) ✓ */
function AssignWorkForm({ data, users, busy, canAssign, onSubmit, autoFocusTitle }: {
  data: AppData; users: Row[]; busy: boolean; canAssign: boolean;
  onSubmit: (form: HTMLFormElement) => void; autoFocusTitle?: boolean;
}) {
  return <form onSubmit={(e) => { e.preventDefault(); onSubmit(e.currentTarget); }}>
    <div className="form-grid">
      {/* ⭐ FIX 08/10/2026 (`ERP-SESSION-04`) — USER BÁO: «*tôi đang dùng admin nhưng chỉ giao việc được cho **2 phòng ban**
          là Dự án và Kế hoạch, có vẻ như vẫn hardcode*» ⇒ ⚠️ ĐÚNG: trước đây ô này **CỨNG 2 `<option>` KH/DA**.
          ⇒ Nay lấy **DANH SÁCH ĐỘNG** từ `organizationUnits` (payload thật: **11** đơn vị, có `code`·`name`·`unitType`).
          ⭐ ĐƯỜNG MÁY CHỦ ĐÃ SẴN: `create_work_item` kiểm `SELECT 1 FROM organization_units WHERE code=? AND active=1`
          (đã vá ở `BUG-D23`) ⇒ mọi mã đơn vị THẬT đều qua được, ⛔ không còn chặn cứng KH/DA.
          ⚠️ QUYỀN VẪN DO MÁY CHỦ QUYẾT: trưởng phòng chỉ giao được trong phòng mình (`usersIsDepartmentManager`),
          giám đốc/admin giao được mọi đơn vị ⇒ ⛔ giao diện **không** nới quyền, chỉ hiện đúng dữ liệu. */}
      <label><span>Phòng ban *</span><select name="departmentCode" required><option value="">— Chọn phòng ban —</option>
        {((data as unknown as { organizationUnits?: Row[] }).organizationUnits || [])
          .filter((u) => u.active !== false && (!u.unitType || String(u.unitType) === "department"))
          .map((u) => <option key={String(u.id)} value={String(u.code)}>{String(u.name)}{u.code ? ` (${String(u.code)})` : ""}</option>)}</select></label>
      <label><span>Giao cho *</span><select name="assignedTo" required><option value="">— Chọn nhân viên —</option>{users.filter((u) => u.active !== false).map((u) => <option key={String(u.id)} value={String(u.id)}>{u.fullName} · {u.roleName || u.role || ""}</option>)}</select></label>
      <label className="full"><span>Nội dung công việc *</span><input name="title" required autoFocus={autoFocusTitle}/></label>
      {/* ⭐ FIX `BUG-20261008-D10` (vòng 58): payload gửi đi ĐỌC `fd.get("description")` (dòng dưới)
          nhưng form ⛔ **THIẾU ô nhập** ⇒ «Mô tả» LUÔN RỖNG khi giao việc. Ô này phải có `name="description"`
          — khuôn giống modal «Tạo công việc» (cùng tệp, khối tự tạo việc). */}
      <label className="full"><span>Mô tả</span><textarea name="description" rows={2}/></label>
      <label><span>Dự án</span><select name="projectId"><option value="">— Không gắn dự án —</option>{(data.projects || []).map((p) => <option key={String(p.id)} value={String(p.id)}>{p.code} · {p.name}</option>)}</select></label>
      <label><span>Hạn hoàn thành</span><input name="dueAt" type="date"/></label>
      <label><span>Ưu tiên</span><select name="priority"><option value="normal">Bình thường</option><option value="high">Cao</option><option value="urgent">Khẩn</option></select></label>
      <label><span>Kết quả cần có</span><input name="requiredOutput"/></label>
    </div>
    <PermissionGuard allow={canAssign}><div className="row-actions"><button className="primary" disabled={busy} data-vntech="work-assign-submit">＋ Giao việc</button></div></PermissionGuard>
  </form>;
}

function WorkCenter({ data, action, refresh, view = "personal" }: { data: AppData; action: (name: string, payload: Row) => Promise<boolean>; refresh: () => void; view?: WorkMenuView }) {
  // ⭐ W4 (09/10/2026 — `HANDOFF-A09` của S01, **Mô hình B**) — TAB nào đang HIỆN theo **6 khoá `work_*`**:
  //   `tabsHien[i]` = tab `i` của `WORK_TABS` có được hiện không. ⛔ đây là **TẦNG ①** (vào/không vào TAB),
  //   ⛔ **KHÔNG** phải tầng năng lực (`work` + 6 năng lực = *được THAO TÁC gì*).
  //   ⭐ **PHƯƠNG ÁN `A` (USER chốt)**: ⛔ chưa có khoá `work_*` nào ⇒ **giữ nguyên dải tab như cũ**.
  const tabsHien = visibleWorkTabs((key) => modulePermission(data, key).canView).map((row) => row.visible);
  const [tabChon, setTab] = useState(() => WORK_TABS_HIDDEN.includes(WORK_TABS[WORK_TAB_OF_VIEW[view]]) ? WORK_TABS.indexOf("Danh sách công việc") : (tabsHien[WORK_TAB_OF_VIEW[view]] ? WORK_TAB_OF_VIEW[view] : WORK_TABS.indexOf("Danh sách công việc"))); // ⭐ nếu menu trỏ vào tab ĐÃ ẨN (ẩn cứng ⛔ hoặc ẩn VÌ QUYỀN) ⇒ về «Danh sách công việc» (⛔ không để trắng màn)
  // W4 — «CHỐT RƠI VỀ»: nếu tab đang chọn ⛔ KHÔNG còn hiện (đổi quyền/payload) ⇒ mở tab ĐẦU TIÊN đang hiện
  //   ⇒ ⛔ không bao giờ hiện NỘI DUNG của tab người dùng ⛔ không có quyền (⚠️ `tab` là BIẾN SUY RA, ⛔ không đổi
  //   cách chọn nội dung `tab === i` ⇒ ⛔ không phá cấu trúc đã khoá ở `t05`/`t14`).
  const tabHienDauTien = tabsHien.findIndex(Boolean);
  const tab = tabsHien[tabChon] ? tabChon : (tabHienDauTien >= 0 ? tabHienDauTien : tabChon);
  const [personalGroup, setPersonalGroup] = useState("mine");
  // ⭐ W2 (đặc tả user 08/10/2026) — «XEM DANH SÁCH CÔNG VIỆC CỦA NGƯỜI KHÁC» THEO PHẠM VI.
  //   Mặc định `"group"` = «Nhóm của tôi» ⇒ ⭐ **hành vi cũ ⛔ KHÔNG đổi**; người dùng phải CHỦ ĐỘNG đổi cách xem.
  const [ownerView, setOwnerView] = useState("group");
  const [ownerId, setOwnerId] = useState("");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  // VIỆC 4 (USER 08/10/2026) — «tự tạo việc cho bản thân» chuyển từ FORM NỘI TUYẾN sang MODAL «Tạo công việc».
  const [createOpen, setCreateOpen] = useState(false);
  // ⭐ USER 09/10/2026 (việc 1) — LỌC THEO TRẠNG THÁI + SẮP XẾP cho tab «Danh sách công việc».
  //   ⚠️ 2 state **DÙNG CHUNG** cho CẢ 2 nhóm («Của tôi» · «Đã giao») vì toolbar nằm trong cùng 1 tab,
  //   đổi nhóm chỉ đổi TẬP DÒNG ⇒ ⛔ không cần 2 bộ lọc riêng (⚠️ đúng chữ user: «filter vào **2 tab**») ✓
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortKey, setSortKey] = useState("default");
  // ⭐ USER 09/10/2026 (việc 2) — «tab **Đã giao**: modal Tạo công việc ở đây sẽ là modal tạo việc cho
  //   **NGƯỜI KHÁC** giống như tab «Giao việc»» ⇒ mở ĐÚNG form «Giao việc cho nhân viên» trong MODAL
  //   (⚠️ **TÁI DÙNG** `AssignWorkForm` — ⛔ KHÔNG viết form thứ hai, tránh hai nguồn sự thật) ✓
  const [assignOpen, setAssignOpen] = useState(false);
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
  // ⭐ W3 (đặc tả user §1: «quyền XOÁ công việc (của bản thân)») — cổng THẬT do MÁY CHỦ giữ (`delete_work_item`:
  //   module `work` + capability `canEdit` — `ERP-SESSION-01`, 09/10/2026). FE chỉ HIỆN nút khi chắc chắn máy chủ
  //   cho qua ⇒ ⛔ không sinh «nút chết» (lớp lỗi `BUG-D05`). `modulePermission` đã bao nhánh `admin`.
  const canDeleteWork = modulePermission(data, "work").canEdit;
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
  // ⚠️ DỌN TỒN DƯ (09/10/2026 · `ERP-SESSION-04`): bỏ `const managerDepartments = scope.managerDepartments;` vì
  //   Kanban nay nhận TRỰC TIẾP `kanbanManagerDepartments(me)` (nguồn sự thật 1 chỗ — đúng luật §17 REUSE)
  //   và `WorkKanban` đang TẠM ẨN (`WORK_VIEW_MODES_HIDDEN`) ⇒ biến không dùng ⇒ `eslint` báo warning.
  //   ⚠️ ⛔ KHÔNG chạm `workScopeOf().managerDepartments` — `tests/t07` khoá nó KHỚP `kanbanManagerDepartments`.
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

  // ⭐ W2 — GOM VIỆC THEO NGƯỜI THỰC HIỆN trong **PHẠM VI ĐƯỢC PHÉP** (`scopedWork` = tập đã thu hẹp, ⛔ không bao
  //   giờ rộng hơn payload): người ⛔ không có phạm vi phòng ban sẽ chỉ thấy chính mình (⛔ danh sách rỗng, ⛔ không bịa).
  const ownerGroups = workByOwnerGroups(scopedWork);
  // Người đang chọn: GIỮ lựa chọn nếu còn hợp lệ, ⛔ không thì rơi về nhóm ĐÔNG NHẤT (⛔ không để trắng bảng).
  const activeOwnerKey = ownerGroups.some((group) => group.key === ownerId) ? ownerId : (ownerGroups[0]?.key || "");
  const activeOwner = ownerGroups.find((group) => group.key === activeOwnerKey);
  const ownerRows: Row[] = activeOwner?.rows || [];
  // ⭐ «Theo người» = chế độ **XEM** việc của NGƯỜI KHÁC ⇒ chỉ việc CỦA MÌNH mới cho nhập %/gửi kiểm tra/duyệt
  //   (⛔ không sinh «nút chết» — lớp lỗi `BUG-D05`; máy chủ vẫn là nơi quyết quyền).
  const ownerIsMe = Boolean(activeOwnerKey) && activeOwnerKey === myId;
  // ⭐⭐⭐ YÊU CẦU TRỰC TIẾP CỦA USER (09/10/2026, kèm ảnh): «*filter **Xem việc của**: cần có **logic check perm**,
  //   user không có perm thì sẽ **không chọn được hoặc không hiển thị***» ⇒ ⭐ cổng quyền = khoá **`work_others`**
  //   («Việc của NGƯỜI KHÁC (xem · sửa · duyệt)» — dòng ma trận S01 tạo ở `B1`) ⇒ **⛔ không có `canView` ⇒ ẨN
  //   HẲN ô chọn** + **ÉP về «Nhóm của tôi»** (`ownerViewEff`) ⇒ ⛔ không bao giờ hiện/lộ việc của người khác
  //   khi thiếu quyền (⚠️ kể cả khi trạng thái `ownerView` còn là `"owner"` từ trước — ví dụ admin vừa thu quyền).
  //   ℹ️ `modulePermission` đã bao nhánh `admin` ⇒ admin **luôn** thấy ô chọn ✓
  //   📌 GHI ĐÈ quyết định cũ `DEC-20261009-D16` (khi đó tôi ⛔ không gate vì `work_others` = 0 cấp + chưa cưỡng
  //      chế ở đâu) — nay USER yêu cầu rõ ⇒ gate ở giao diện là **quyết định CỦA USER** ✓
  const canViewOthers = modulePermission(data, "work_others").canView;
  const ownerViewEff = canViewOthers ? ownerView : "group";
  const ownerViewEditable = ownerViewEff !== "owner" || ownerIsMe;
  const personalViewRows: Row[] = ownerViewEff === "owner" ? ownerRows : personalRows;
  // ⭐ VIỆC 1 (USER 09/10/2026) — LỌC THEO TRẠNG THÁI + SẮP XẾP ⇒ ⭐ DÙNG CHUNG cho «Của tôi» và «Đã giao» ✓
  //   ⚠️ `statusFilter = "ALL"` + `sortKey = "default"` ⇒ ⭐ **tập dòng y hệt trước đây** (⛔ không đổi hành vi cũ) ✓
  const rowsSauLoc = personalViewRows.filter((row) => statusFilter === "ALL" || String(row.status) === statusFilter);
  const rowsHienThi = sapXepWork(rowsSauLoc, sortKey);
  // Lựa chọn TRẠNG THÁI lấy từ **DỮ LIỆU THẬT** đang có (⚠️ ⛔ không hiện lựa chọn rỗng) + nhãn dùng **CHUNG**
  // `WORK_STATUS_LABELS`/`statusLabel` (⛔ không khai lại bản đồ trạng thái — tránh hai nguồn sự thật).
  const statusOptions = [
    { value: "ALL", label: "Tất cả trạng thái" },
    ...[...new Set(personalViewRows.map((row) => String(row.status || "")))]
      .filter(Boolean)
      .sort()
      .map((s) => ({ value: s, label: WORK_STATUS_LABELS[s] || statusLabel(s) })),
  ];
  // Cổng quyền cho nút hành động của toolbar: «Của tôi» ⇒ tự tạo việc (`canSelf`); «Đã giao» ⇒ GIAO CHO NGƯỜI KHÁC
  // (`canAssign`) ⇒ ⛔ thiếu quyền thì ⛔ KHÔNG render nút (⛔ không sinh «nút chết» — đúng bài học `BUG-D05`).
  const canOpenCreate = personalGroup === "assignedOut" ? canAssign : canSelf;

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

  // ⭐ W3 — LUẬT THEO DÒNG (mô phỏng ĐÚNG `deleteWorkItem` của Java): chỉ **NGƯỜI GIAO/TẠO** được xoá, và
  //   ⛔ **không** xoá việc đã đóng (`COMPLETED`/`CANCELLED`) ⇒ nút «Xoá» chỉ hiện đúng nơi máy chủ cho qua.
  const canDeleteRow = (row: Row) => canDeleteWork && String(row.assignedBy) === myId && !WORK_CLOSED.includes(String(row.status));
  async function deleteRow(row: Row) {
    setBusy(true);
    const ok = await action("delete_work_item", { workItemId: row.id });
    setBusy(false);
    if (ok) { setDetailRow(null); refresh(); }
  }

  async function send(name: string, payload: Row, form?: HTMLFormElement) {
    setBusy(true);
    const ok = await action(name, payload);
    setBusy(false);
    if (ok) { form?.reset(); refresh(); }
  }
  // VIỆC 4 (USER 08/10/2026) — nộp form trong MODAL «Tạo công việc».
  // ⚠️ `send` KHÔNG trả kết quả (`Promise<void>`) ⇒ muốn ĐÓNG modal khi thành công thì phải gọi `action` TRỰC TIẾP
  //    (bài học đã ghi ở `docs/52` §4: `send` chỉ dùng cho form nội tuyến).
  // ⭐ VIỆC 2 (USER 09/10/2026) — nộp form GIAO VIỆC **trong MODAL**: ⚠️ gọi `action` **TRỰC TIẾP** (⛔ không dùng
  //   `send`) vì cần BIẾT THÀNH CÔNG để **ĐÓNG modal** (⚠️ `send` trả `Promise<void>` — đúng bài học ở `submitSelfWork`) ✓
  async function submitAssignWork(form: HTMLFormElement) {
    const fd = new FormData(form);
    setBusy(true);
    const ok = await action("create_work_item", { departmentCode: fd.get("departmentCode"), title: fd.get("title"), description: fd.get("description"),
      projectId: fd.get("projectId"), assignedTo: fd.get("assignedTo"), dueAt: fd.get("dueAt"),
      priority: fd.get("priority"), requiredOutput: fd.get("requiredOutput") });
    setBusy(false);
    if (ok) { form.reset(); setAssignOpen(false); refresh(); }
  }
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
    const ok = await action(status === "COMPLETED" ? "approve_work_item" : "update_work_item_status", { workItemId, status, reason });
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
        {/* ⭐ W4 — nút tab chỉ vẽ khi `tabsHien[i]` (ẩn CỨNG `WORK_TABS_HIDDEN` ∪ ẩn VÌ QUYỀN theo 6 khoá `work_*`).
            ⚠️ VẪN `WORK_TABS.map` + `data-vntech={work-tab-${i}}` + GIỮ NGUYÊN chỉ số ⇒ ⛔ không lệch nội dung tab. */}
        {WORK_TABS.map((label, i) => tabsHien[i] ? <button key={label} type="button" role="tab" aria-selected={tab === i} className={tab === i ? "active" : ""} data-vntech={`work-tab-${i}`} onClick={() => setTab(i)}>{label}</button> : null)}
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
      {/* ⭐ YÊU CẦU TRỰC TIẾP CỦA USER (09/10/2026, kèm ảnh màn):
          ① «*bỏ section **Tạo công việc** đi, đưa nút Tạo công việc xuống cạnh thanh search*» ⇒ ⛔ **XOÁ card
             «Tạo công việc»**; nút `＋ Tạo công việc` chuyển vào **`actions` của `ListToolbar`** (cạnh ô tìm kiếm) ✓
          ② «*bỏ section **Việc cá nhân** và các thông tin bên trong đi, đưa dải tab **Của tôi - Đã giao** về
             ngay trên **Danh sách công việc** và ngay dưới dashboard*» ⇒ ⛔ **XOÁ card «Việc cá nhân»** (tiêu đề +
             ghi chú + đoạn giải thích) — ⭐ dải nhóm `Của tôi · n` / `Đã giao · n` nay nằm **NGAY TRÊN** bảng
             (trong card «Danh sách công việc», 📍 giữa dải KPI «dashboard» phía trên và bảng bên dưới) ✓
          ⚠️ MODAL `work-create-modal` + luồng `create_self_work_item` ⛔ **KHÔNG đổi** (chỉ đổi CHỖ ĐẶT nút mở) ✓ */}
      {/* MODAL «Tạo công việc» — khuôn chuẩn của dự án (đối chiếu `ConstructionScreen.tsx:56-73`):
          `.overlay` (bấm ra ngoài để đóng) → `.modal card` (role=dialog + aria-modal + aria-label)
          → `.modal-head` + nút ✕ `aria-label="Đóng"` → `.modal-body` → `footer.modal-actions`. */}
      {createOpen && <div className="overlay" style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }} onMouseDown={(event) => event.target === event.currentTarget && setCreateOpen(false)}>
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
      {/* ⭐ VIỆC 2 (USER 09/10/2026) — MODAL «Giao việc cho nhân viên» mở từ nhóm **«Đã giao»**:
          «*tab **Đã giao**: modal Tạo công việc ở đây sẽ là modal tạo việc cho **NGƯỜI KHÁC** giống như tab
          **Giao việc** có bảng Giao việc cho nhân viên*» ⇒ ⭐ **DÙNG LẠI ĐÚNG** `AssignWorkForm` của tab «Giao việc»
          (⚠️ cùng một nguồn trường ⇒ ⛔ không có 2 bản form lệch nhau) + gọi `action` **TRỰC TIẾP** để ⭐ biết THÀNH
          CÔNG rồi mới ĐÓNG modal (⚠️ `send` trả `Promise<void>` ⇒ ⛔ không đóng được — bài học `submitSelfWork`) ✓
          ⚠️ Cổng quyền: `canAssign` (⛔ thiếu quyền thì nút ⛔ không render ⇒ modal này ⛔ không thể mở) ✓ */}
      {assignOpen && <div className="overlay" style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }} onMouseDown={(event) => event.target === event.currentTarget && setAssignOpen(false)}>
        <div className="modal card" data-vntech="work-assign-modal" role="dialog" aria-modal="true" aria-label="Giao việc cho nhân viên">
          <div className="modal-head"><strong>GIAO VIỆC CHO NHÂN VIÊN</strong>
            <button type="button" onClick={() => setAssignOpen(false)} aria-label="Đóng">✕</button></div>
          <div className="modal-body">
            <AssignWorkForm data={data} users={users} busy={busy} canAssign={canAssign} autoFocusTitle
              onSubmit={(form) => { void submitAssignWork(form); }}/>
          </div>
        </div>
      </div>}
      {/* ⭐ YÊU CẦU USER 09/10/2026 (②) — «*bỏ section **Việc cá nhân** … đưa dải tab **Của tôi - Đã giao** về
          **ngay trên «Danh sách công việc»** và **ngay dưới dashboard***»:
          ⇒ ⛔ **XOÁ card «Việc cá nhân»** (tiêu đề + ghi chú + đoạn giải thích) — ⭐ dải nhóm nay là **DẢI RỜI**
          nằm **NGAY DƯỚI dải KPI (dashboard) và NGAY TRÊN card «Danh sách công việc»** (⚠️ ⛔ không nằm TRONG card
          — đúng chữ «ngay TRÊN Danh sách công việc») ✓
          ⚠️ GIỮ NGUYÊN luật: 2 nhóm (`mine` · `assignedOut`) + bộ đếm — xem khối `T05-PURE` ✓ */}
      <div className="project-scope-tabs" role="tablist" aria-label="Nhóm việc cá nhân">
        {personalGroups.map((group) => <button key={group.key} type="button" role="tab" aria-selected={personalGroup === group.key}
          className={personalGroup === group.key ? "active" : ""} data-personal-group={group.key}
          onClick={() => setPersonalGroup(group.key)}>{group.label} · {group.rows.length}</button>)}
      </div>
      <section className="card">
        {/* VIỆC 2 (USER 08/10/2026) — «Danh sách việc của tôi» → «Danh sách công việc»,
            và ô TÌM KIẾM hạ xuống NGAY TRÊN bảng (trước đây nằm ở đầu màn — xem `ListToolbar` đầu trang).
            ⚠️ `find()` lọc theo mã việc · nội dung · người làm (không đổi luật lọc).
            ⭐ YÊU CẦU USER 09/10/2026 (①): nút «＋ Tạo công việc» nay nằm trong `actions` = **CẠNH THANH TÌM KIẾM**
            (thay cho card «Tạo công việc» đã bị bỏ) — ⚠️ cổng quyền `canSelf` + `data-vntech` ⛔ KHÔNG đổi ✓ */}
        <ListToolbar
          title="Danh sách công việc"
          note={ownerViewEff === "owner"
            ? `Người thực hiện «${activeOwner?.label || "—"}» · ${rowsHienThi.length}/${personalViewRows.length} việc — chế độ XEM theo phạm vi máy chủ cho phép`
            : `Nhóm «${personalGroups.find((group) => group.key === personalGroup)?.label}» · ${rowsHienThi.length}/${personalRows.length} việc — nhập % tiến độ và gửi kiểm tra ngay tại đây`}
          search={{ value: q, onChange: setQ, placeholder: "Tìm mã việc, nội dung, người làm…" }}
          /* ⭐ VIỆC 1 (USER 09/10/2026) — «lọc theo TRẠNG THÁI, sắp xếp theo TRẠNG THÁI · NGÀY HOÀN THÀNH · ƯU TIÊN»
             ⇒ 2 prop **CHUẨN CỦA `ListToolbar`** (⛔ không tự dựng ô lọc riêng trong card — ⛔ tránh lệch khuôn §5) ✓
             ⚠️ Lựa chọn trạng thái sinh từ **DỮ LIỆU THẬT** (`statusOptions`) ⇒ ⛔ không có lựa chọn rỗng ✓ */
          filters={[{ key: "status", label: "Trạng thái", value: statusFilter, onChange: setStatusFilter, options: statusOptions }]}
          sort={{ value: sortKey, onChange: setSortKey, options: WORK_SORT_OPTIONS }}
          /* ⭐ YÊU CẦU TRỰC TIẾP CỦA USER 09/10/2026 (16:26 — chốt `Q-UI-01`): «**đổi sang sát ô tìm kiếm**»
             ⇒ nút «＋ Tạo công việc» dùng **`secondaryActions`** (⚠️ `ListToolbar` render nhóm này **NGAY SAU**
             bộ điều khiển = **sát ngay ô tìm kiếm**) thay vì `actions` (nhóm chính, nằm **bên TRÁI** bộ điều khiển
             theo chuẩn nhà MT3 §IV.4) — ⭐ **user là người quyết thứ tự này** (⚠️ ghi rõ để ⛔ không ai «sửa lại cho đúng chuẩn») ✓
             ⭐ VIỆC 2 (USER 09/10/2026): ở nhóm «Đã giao» nút này mở **MODAL GIAO VIỆC CHO NGƯỜI KHÁC**
             (⚠️ cùng form với tab «Giao việc», ⛔ không viết form thứ hai) — và cổng quyền đổi từ `canSelf`
             sang **`canAssign`** (⚠️ ⛔ thiếu quyền ⇒ ⛔ không render nút) ✓
             ⚠️ GIỮ NGUYÊN `data-vntech="work-create-open"` (các test `t05`/`t01` khoá theo dấu hiệu này) ✓ */
          secondaryActions={canOpenCreate ? <PermissionGuard allow={canOpenCreate}><button type="button" className="primary" disabled={busy} data-vntech="work-create-open"
            onClick={() => (personalGroup === "assignedOut" ? setAssignOpen(true) : setCreateOpen(true))}>
            {personalGroup === "assignedOut" ? "＋ Giao việc cho nhân viên" : "＋ Tạo công việc"}</button></PermissionGuard> : undefined}/>
        {/* ⭐ W2 GIỮ CHỨC NĂNG NHƯNG ⛔ KHÔNG CÒN DẠNG TAB (yêu cầu user 09/10/2026):
            «*Xóa dải tab «Nhóm của tôi - Theo người» ra khỏi tabbar «Danh sách công việc»*» ⇒ nay là **1 Ô CHỌN
            THƯỜNG** (⛔ không `project-scope-tabs`, ⛔ không `role="tablist"`), đặt **NGAY TRÊN BẢNG**.
            ⭐ VÀ user yêu cầu **CỔNG QUYỀN**: «*user ⛔ không có perm thì **không chọn được hoặc không hiển thị***»
            ⇒ ⛔ **KHÔNG có `work_others.canView` ⇒ KHÔNG RENDER ô chọn này** (xem `canViewOthers` ở khối dẫn xuất +
            `ownerViewEff` ép về «Nhóm của tôi») ✓
            «— Nhóm của tôi —» = MẶC ĐỊNH (hành vi cũ ⛔ KHÔNG đổi) · chọn 1 người = chế độ **XEM** việc của người đó.
            ⚠️ Danh sách người = **`ownerGroups`** = chỉ những người CÓ việc trong **payload máy chủ đã lọc** ⇒ ⛔ không nới quyền. */}
        {canViewOthers && <label className="row-actions" data-vntech="work-owner-select" style={{ marginTop: 8 }}>
          <span className="muted">Xem việc của</span>
          <select value={ownerViewEff === "owner" ? (activeOwnerKey || OWNER_UNKNOWN_KEY) : ""} className="export-mini"
            onChange={(event) => {
              const value = event.target.value;
              if (!value) { setOwnerView("group"); setOwnerId(""); return; }
              setOwnerView("owner");
              setOwnerId(value === OWNER_UNKNOWN_KEY ? "" : value);
            }}>
            <option value="">— {OWNER_VIEW_MODES[0].label} —</option>
            {ownerGroups.map((group) => <option key={group.key || OWNER_UNKNOWN_KEY} value={group.key || OWNER_UNKNOWN_KEY}>{group.label} · {group.count}</option>)}
          </select>
        </label>}
        {ownerViewEff === "owner" && (ownerGroups.length > 0
          ? <p className="muted" data-vntech="work-owner-note">{ownerIsMe
              ? "Đây là việc CỦA BẠN ⇒ nhập % tiến độ và gửi kiểm tra ngay tại đây."
              : "Chế độ XEM việc của NGƯỜI KHÁC — ⛔ chỉ xem, ⛔ không sửa ở đây; quyền vẫn do máy chủ quyết."}</p>
          : <p className="muted" data-vntech="work-owner-empty">Chưa có công việc nào trong phạm vi bạn được xem — phạm vi do máy chủ cấp (trưởng phòng: người trong phòng mình · giám đốc/admin: toàn hệ thống).</p>)}
        {/* ⭐ W2 — «Theo người»: việc của NGƯỜI KHÁC chỉ XEM (`allowEdit` chỉ bật khi là việc của CHÍNH MÌNH) ⇒
            ⛔ không sinh «nút chết»; ⛔ KHÔNG nới quyền — máy chủ tiếp tục là nơi quyết (payload đã lọc sẵn). */}
        <TaskTable rows={find(rowsHienThi)} allowEdit={ownerViewEditable} projCode={projCode} busy={busy} send={send}
          canApproveRow={ownerViewEditable ? canApproveRow : undefined} canDeleteRow={canDeleteRow} onDelete={deleteRow} onOpenDetail={setDetailRow}/>
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
        <TaskTable rows={find(assignedRows)} allowEdit projCode={projCode} busy={busy} send={send} canApproveRow={canApproveRow} canDeleteRow={canDeleteRow} onDelete={deleteRow} onOpenDetail={setDetailRow}/>
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
        <CardHead title="Giao việc cho nhân viên" note="Chỉ Trưởng phòng hoặc Quản trị viên giao được việc thủ công — backend chặn bằng userIsDepartmentManager. Bàn giao chi tiết (hồ sơ · dòng thời gian · đổi trạng thái) nằm ở mục «Giao việc» của menu."
          /* ⭐ VIỆC 2 (09/10/2026) — form nay là `AssignWorkForm` **DÙNG CHUNG** với MODAL mở từ nhóm «Đã giao»
             (⚠️ cùng 1 nguồn trường ⇒ ⛔ không có 2 bản form lệch nhau). Hành vi nộp ⛔ KHÔNG đổi:
             vẫn `send("create_work_item", …)` + `form.reset()` khi thành công ✓ */
          />
        <AssignWorkForm data={data} users={users} busy={busy} canAssign={canAssign}
          onSubmit={(form) => { const fd = new FormData(form);
            void send("create_work_item", { departmentCode: fd.get("departmentCode"), title: fd.get("title"), description: fd.get("description"),
              projectId: fd.get("projectId"), assignedTo: fd.get("assignedTo"), dueAt: fd.get("dueAt"),
              priority: fd.get("priority"), requiredOutput: fd.get("requiredOutput") }, form); }}/>
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
        <TaskTable rows={find(mine)} allowEdit projCode={projCode} busy={busy} send={send} canApproveRow={canApproveRow} canDeleteRow={canDeleteRow} onDelete={deleteRow} onOpenDetail={setDetailRow}/>
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
        ⭐ CẬP NHẬT 08/10/2026 (`ERP-SESSION-04`): «Nhận xét» **ĐÃ MỞ LẠI** — ⚠️ điều kiện cũ nay **KHÔNG còn đúng**:
        BE Java **ĐÃ CÓ** handler `add_work_item_comment` (port xong) và **ĐO LIVE = HTTP 200** + bình luận **đọc lại được**
        trong `data.workItemComments` ⇒ theo luật dự án (`docs/55:205`: BE xong ⇒ BẬT) nên hiện **danh sách + ô gửi**,
        ⛔ KHÔNG còn dòng «chờ backend» (⚠️ dòng đó nói SAI với người dùng). ⛔ Không thêm CSS mới (ngân sách CSS vượt trần). */}
    {detailRow && <div className="overlay" style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }} onMouseDown={(event) => event.target === event.currentTarget && setDetailRow(null)}>
      <div className="modal card" data-vntech="work-detail-modal" role="dialog" aria-modal="true" aria-label="Chi tiết công việc" style={{ maxHeight: "88vh", overflowY: "auto" }}>
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
          {/* ⭐ VIỆC 5b — DANH SÁCH bình luận + Ô GỬI (BE đã sống; `data.workItemComments` do máy chủ trả). */}
          <div className="form-grid" data-vntech="work-comment-list">
            {(data.workItemComments || []).filter((c) => String(c.workItemId) === String(detailRow.id)).map((c) => (
              <label key={String(c.id)} className="full"><span>{String(c.userName || "—")}{c.createdAt ? ` · ${String(c.createdAt)}` : ""}</span><div>{String(c.comment || "")}</div></label>
            ))}
            {!(data.workItemComments || []).some((c) => String(c.workItemId) === String(detailRow.id)) &&
              <p className="muted" data-vntech="work-comment-empty">Chưa có bình luận nào — anh/chị có thể trao đổi ngay bên dưới.</p>}
          </div>
          <form className="form-grid" data-vntech="work-comment-form"
            onSubmit={(event) => { event.preventDefault(); const form = event.currentTarget; const text = String(new FormData(form).get("comment") || "").trim(); if (!text) return; void send("add_work_item_comment", { workItemId: detailRow.id, comment: text }); form.reset(); }}>
            <label className="full"><span>Thêm bình luận</span>
              <textarea name="comment" rows={2} maxLength={2000} placeholder="Trao đổi, báo cáo tiến độ, nêu vướng mắc…" /></label>
            <div className="full"><button type="submit" className="primary" disabled={busy} data-vntech="work-comment-send">Gửi bình luận</button></div>
          </form>
        </div>
        <footer className="modal-actions">
          <button type="button" className="secondary" onClick={() => setDetailRow(null)}>Đóng</button>
          {String(detailRow.status) !== "COMPLETED" && (canApproveRow(detailRow)
            ? <button type="button" className="primary" disabled={busy} data-vntech="work-detail-approve"
                onClick={() => { void send("approve_work_item", { workItemId: detailRow.id, status: "COMPLETED" }); setDetailRow(null); }}>Duyệt xong</button>
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
function TaskTable({ rows, allowEdit, projCode, busy, send, canApproveRow, canDeleteRow, onDelete, onOpenDetail }: { rows: Row[]; allowEdit: boolean; projCode: (id: unknown) => string; busy: boolean; send: (name: string, payload: Row) => Promise<void>; canApproveRow?: (row: Row) => boolean; canDeleteRow?: (row: Row) => boolean; onDelete?: (row: Row) => void; onOpenDetail?: (row: Row) => void }) {
  return <DataTable rows={rows} rowKey={(r) => String(String(r.id))} onRowClick={onOpenDetail ? (row) => onOpenDetail(row) : undefined} columns={[{ key: "c1", header: "Mã việc", render: (r) => (onOpenDetail
      // VIỆC 5 (USER 08/10/2026) — click MỞ CHI TIẾT: dùng class có sẵn của dự án `.link-cell`
      // (⚠️ ⛔ KHÔNG bịa class mới); cửa chính là **click CẢ DÒNG** (`onRowClick`), nút này giữ cho BÀN PHÍM/a11y.
      ? <button type="button" className="link-cell code" data-vntech="work-open-detail" title="Xem chi tiết công việc" onClick={() => onOpenDetail(r)}>{r.taskNo}</button>
      : <strong className="code">{r.taskNo}</strong>) }, { key: "c2", header: "Nội dung", render: (r) => <>{r.title}<small>{r.requiredOutput || r.workGroup || ""}</small></> }, { key: "c3", header: "Người làm", render: (r) => <>{r.assignedToName || "—"}</> }, { key: "c4", header: "Dự án", render: (r) => <>{projCode(r.projectId)}</> }, { key: "c5", header: "Hạn", render: (r) => <>{r.dueAt ? date(r.dueAt) : "—"}{isTaskLate(r) && <small className="red-text">Quá hạn</small>}</> }, { key: "c6", header: "Ưu tiên", render: (r) => <>{statusLabel(r.priority, "priority")}</> }, { key: "c7", header: "Tiến độ", render: (r) => <><div className="task-bar"><span><i style={{ width: `${Number(r.progress || 0)}%` }} /></span><b>{Number(r.progress || 0)}%</b></div></> }, { key: "c8", header: "Trạng thái", render: (r) => <><StatusBadge value={WORK_STATUS_LABELS[String(r.status)] || statusLabel(r.status, "work_item")}/></> }, { key: "c9", header: "Tiến độ & xác nhận", render: (r) => <ProgressCell row={r} busy={busy} allowEdit={allowEdit} canApprove={Boolean(canApproveRow?.(r))}
          canDelete={Boolean(canDeleteRow?.(r))} onDelete={onDelete}
          onProgress={(row, value) => void send("update_work_item_progress", { workItemId: row.id, progress: value })}
          onStatus={(row, status, reason) => void send(status === "COMPLETED" ? "approve_work_item" : "update_work_item_status", { workItemId: row.id, status, reason })}/> }]} emptyText="Chưa có nhiệm vụ nào." />;
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
function ProgressCell({ row, busy, allowEdit, canApprove, canDelete, onDelete, onProgress, onStatus }: {
  row: Row; busy: boolean; allowEdit: boolean; canApprove: boolean;
  canDelete?: boolean; onDelete?: (row: Row) => void;
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
    {/* ⭐ W3 (đặc tả user §1: «quyền XOÁ công việc (của bản thân)») — nút «Xoá» CHỈ hiện khi ĐỦ **CẢ HAI** điều kiện
        mà MÁY CHỦ đòi (`delete_work_item`, capability `canEdit`): ① tài khoản được cấp `work.canEdit` ② dòng là việc
        do CHÍNH MÌNH giao/tạo và ⛔ chưa đóng (`WORK_CLOSED`). ⛔ KHÔNG hiện ở nơi máy chủ sẽ từ chối ⇒ ⛔ không «nút chết»
        (bài học `BUG-D05`). Hộp xác nhận dùng `window.confirm` — ĐÚNG khuôn nhà (vd `DocumentsScreen`/`PartnerManager`). */}
    {canDelete && onDelete && <button type="button" className="export-mini danger" disabled={busy} data-vntech="work-delete"
      title="Xoá công việc do bạn giao/tạo (xoá MỀM; ⛔ không xoá được việc đã hoàn thành)"
      onClick={() => { if (window.confirm(`Xoá công việc ${String(row.taskNo || "")}? Việc sẽ được XOÁ MỀM và giữ vết nghiệp vụ.`)) onDelete(row); }}>Xoá</button>}
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
