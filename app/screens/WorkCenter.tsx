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
// PHASE 3 (`T-01`) — MÀN CÔNG VIỆC: 5 TAB ĐÚNG THỨ TỰ CỦA NHÓM MENU «CÔNG VIỆC»
//   Cá nhân (0) · Phòng ban (1) · Giao việc (2) · Dashboard (3) · Báo cáo (4)
// Giữ NGUYÊN hành vi 3 tab cũ: `Việc của tôi` → Cá nhân · `Phòng ban / tổ đội` → Phòng ban · `KPI & báo cáo` → Báo cáo.
// Tab «Báo cáo» TÁI DÙNG `ReportView` + `lib/report-catalog.ts` (nguồn `workItems`) — KHÔNG viết màn mới.
// Mục menu «Giao việc» KHÔNG mở màn này: nó mở `DepartmentTaskWorkspace` (xem nhánh render trong `app/page.tsx`).

import { DataTable, ListToolbar, PermissionGuard, StatusBadge } from "@/app/components/ui";
import { ReportView } from "@/app/screens/ReportView";
import { daysFromToday } from "@/lib/date-helpers";
import type { WorkMenuView } from "@/lib/menu-helpers";
import { isAdminUser, modulePermission, roleBase } from "@/lib/permissions";
import { REPORT_CATALOG, findEntry, sourceRows } from "@/lib/report-catalog";
import { CardHead, Kpi, UI_TODAY, WORK_CLOSED, WORK_STATUS_LABELS, date } from "@/lib/ui-shared";
import type { AppData, Row } from "@/lib/ui-shared";
import { useState } from "react";

// PHASE 3 (`T-01`) — 5 TAB NHÓM «CÔNG VIỆC», ĐÚNG thứ tự đã chốt (5 mục menu ⇄ 5 tab).
const WORK_TABS = ["Cá nhân", "Phòng ban", "Giao việc", "Dashboard", "Báo cáo"];
const WORK_TAB_OF_VIEW: Record<WorkMenuView, number> = { personal: 0, department: 1, assign: 2, kpi: 3, reports: 4 };
// Báo cáo CÔNG VIỆC dùng LẠI catalog chung (`R-05a/b/c`, nguồn `workItems`) — không khai báo định nghĩa mới.
const WORK_REPORT_CATALOG = REPORT_CATALOG.filter((entry) => entry.source === "workItems");

function WorkCenter({ data, action, refresh, view = "personal" }: { data: AppData; action: (name: string, payload: Row) => Promise<boolean>; refresh: () => void; view?: WorkMenuView }) {
  const [tab, setTab] = useState(WORK_TAB_OF_VIEW[view]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const me = data.user || {};
  const myId = String(me.id || "");
  const items: Row[] = data.workItems || [];
  const users: Row[] = data.users || [];

  const canSelf = modulePermission(data, "dept_plan_tasks").canUse || modulePermission(data, "dept_project_tasks").canUse;
  const canAssign = modulePermission(data, "dept_plan_assign").canCreate || modulePermission(data, "dept_project_assign").canCreate;
  const isOverseer = isAdminUser(me) || ["director", "commander"].includes(roleBase(me));

  const myDepts = [...new Set([String(me.organizationCode || ""), "CN"].filter(Boolean))];
  const activeMemberIds = [...new Set((data.teamMembers || []).filter((m) => Number(m.active ?? 1) === 1).map((m) => String(m.userId)))];
  // ⚠️ HỢP ĐỒNG TÊN TRƯỜNG (đã đo bằng bootstrap THẬT, không suy đoán): dòng `workItems` của payload do
  // `work_items` sinh ra mang tên **`assignedTo`/`assignedToName`** (`scripts/system-route.mjs` — `wi.assigned_to AS assignedTo`,
  // `ua.full_name AS assignedToName`). Trước đây màn này đọc `assigneeUserId`/`assigneeName` — HAI TÊN KHÔNG TỒN TẠI
  // ⇒ `mine`/`teamWork` LUÔN rỗng và tab "Việc của tôi" LUÔN 0 việc (lỗi im lặng: `tsc` xanh vì `Row` là chỉ mục mở).
  const mine = items.filter((r) => String(r.assignedTo) === myId);
  const deptWork = items.filter((r) => String(r.assignedTo) !== myId && myDepts.includes(String(r.departmentCode || "")));
  const teamWork = items.filter((r) => String(r.assignedTo) !== myId && activeMemberIds.includes(String(r.assignedTo)));

  const find = (rows: Row[]) => !q.trim() ? rows
    : rows.filter((r) => `${r.taskNo || ""} ${r.title || ""} ${r.assignedToName || ""}`.toLocaleLowerCase("vi").includes(q.trim().toLocaleLowerCase("vi")));

  async function send(name: string, payload: Row, form?: HTMLFormElement) {
    setBusy(true);
    const ok = await action(name, payload);
    setBusy(false);
    if (ok) { form?.reset(); refresh(); }
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
      <ListToolbar
        title="CÔNG VIỆC"
        note={`${mine.length} việc của bạn · ${deptWork.length + teamWork.length} việc phòng ban/tổ đội · ${items.length} tổng`}
        search={{ value: q, onChange: setQ, placeholder: "Tìm mã việc, nội dung, người làm…" }}
      />
      <div className="project-scope-tabs" role="tablist">
        {WORK_TABS.map((label, i) => <button key={label} type="button" role="tab" aria-selected={tab === i} className={tab === i ? "active" : ""} onClick={() => setTab(i)}>{label}</button>)}
      </div>
    </section>

    {tab === 0 && <div className="stack">
      <div className="kpi-grid small">
        <Kpi icon="CV" label="Việc của tôi" value={String(mine.length)} note={`${mine.filter((r) => String(r.status) === "COMPLETED").length} đã xong`} tone="blue"/>
        <Kpi icon="QH" label="Quá hạn" value={String(mine.filter(isTaskLate).length)} note="Cần xử lý trước" tone="red"/>
        <Kpi icon="TL" label="Tỉ lệ hoàn thành" value={`${workRate(mine)}%`} note="Trên việc được giao" tone="green"/>
      </div>
      {canSelf && <section className="card">
        <CardHead title="Tự tạo việc cho bản thân" note="Việc cá nhân (mã CN) không gắn nghiệp vụ nguồn và không lẫn vào việc phòng ban"/>
        <form onSubmit={(e) => { e.preventDefault(); const f = e.currentTarget; const fd = new FormData(f);
          void send("create_self_work_item", { title: fd.get("title"), description: fd.get("description"), projectId: fd.get("projectId"),
            dueAt: fd.get("dueAt"), priority: fd.get("priority"), requiredOutput: fd.get("requiredOutput") }, f); }}>
          <div className="form-grid">
            <label className="full"><span>Nội dung công việc *</span><input name="title" required placeholder="Ví dụ: Rà soát hồ sơ nghiệm thu đợt 2"/></label>
            <label><span>Dự án</span><select name="projectId"><option value="">— Không gắn dự án —</option>{(data.projects || []).map((p) => <option key={String(p.id)} value={String(p.id)}>{p.code} · {p.name}</option>)}</select></label>
            <label><span>Hạn hoàn thành</span><input name="dueAt" type="date"/></label>
            <label><span>Ưu tiên</span><select name="priority"><option value="normal">Bình thường</option><option value="high">Cao</option><option value="urgent">Khẩn</option></select></label>
            <label><span>Kết quả cần có</span><input name="requiredOutput" placeholder="Đầu ra mong đợi"/></label>
            <label className="full"><span>Mô tả</span><textarea name="description" rows={2}/></label>
          </div>
          <PermissionGuard allow={canSelf}><div className="row-actions"><button className="primary" disabled={busy}>＋ Tạo việc cho tôi</button></div></PermissionGuard>
        </form>
      </section>}
      <section className="card">
        <CardHead title="Danh sách việc của tôi" note="Cập nhật tiến độ và đánh dấu hoàn thành ngay tại đây"/>
        <TaskTable rows={find(mine)} allowEdit projCode={projCode} busy={busy} send={send}/>
      </section>
    </div>}

    {tab === 1 && <div className="stack">
      <section className="card">
        <CardHead title="Việc phòng ban của tôi" note="Nhiệm vụ thuộc phòng mà tài khoản trực thuộc"/>
        <TaskTable rows={find(deptWork)} allowEdit={false} projCode={projCode} busy={busy} send={send}/>
      </section>
      <section className="card">
        <CardHead title="Việc của tổ đội tôi tham gia" note="Thành viên tổ đội đang hoạt động"/>
        <TaskTable rows={find(teamWork)} allowEdit={false} projCode={projCode} busy={busy} send={send}/>
      </section>
    </div>}

    {tab === 2 && <div className="stack">
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

    {tab === 3 && <div className="stack">
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
    </div>}

    {tab === 4 && <div className="stack">
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
  </div>;
}


// U-13 — TaskTable khai báo ở CẤP MODULE (trước đây nằm trong thân render của WorkCenter).
// Khai báo trong thân render tạo component MỚI mỗi lần render ⇒ state bên trong bị reset, và eslint
// báo react-hooks/static-components. Nay nhận đủ dữ liệu qua props thay vì đóng kín vào WorkCenter:
//   rows · allowEdit · projCode · busy · send
function TaskTable({ rows, allowEdit, projCode, busy, send }: { rows: Row[]; allowEdit: boolean; projCode: (id: unknown) => string; busy: boolean; send: (name: string, payload: Row) => Promise<void> }) {
  return <DataTable rows={rows} rowKey={(r) => String(String(r.id))} columns={[{ key: "c1", header: "Mã việc", render: (r) => <><strong className="code">{r.taskNo}</strong></> }, { key: "c2", header: "Nội dung", render: (r) => <>{r.title}<small>{r.requiredOutput || r.workGroup || ""}</small></> }, { key: "c3", header: "Người làm", render: (r) => <>{r.assignedToName || "—"}</> }, { key: "c4", header: "Dự án", render: (r) => <>{projCode(r.projectId)}</> }, { key: "c5", header: "Hạn", render: (r) => <>{r.dueAt ? date(r.dueAt) : "—"}{isTaskLate(r) && <small className="red-text">Quá hạn</small>}</> }, { key: "c6", header: "Ưu tiên", render: (r) => <>{r.priority === "urgent" ? "Khẩn" : r.priority === "high" ? "Cao" : "Thường"}</> }, { key: "c7", header: "Tiến độ", render: (r) => <><div className="task-bar"><span><i style={{ width: `${Number(r.progress || 0)}%` }} /></span><b>{Number(r.progress || 0)}%</b></div></> }, { key: "c8", header: "Trạng thái", render: (r) => <><StatusBadge value={WORK_STATUS_LABELS[String(r.status)] || String(r.status || "—")}/></> }, { key: "c9", header: "Thao tác", render: (r) => <><div className="row-actions">
          {[25, 50, 75, 100].map((p) => <button key={p} type="button" className="export-mini" disabled={busy || Number(r.progress || 0) >= p} onClick={() => void send("update_work_item_progress", { workItemId: r.id, progress: p })}>{p}%</button>)}
          {String(r.status) !== "COMPLETED" && <button type="button" className="export-mini" disabled={busy} onClick={() => void send("update_work_item_status", { workItemId: r.id, status: "COMPLETED" })}>Xong</button>}
        </div></> }]} emptyText="Chưa có nhiệm vụ nào." />;
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
  TaskTable,
  WorkCenter,
  isTaskLate,
  workRate,
};
