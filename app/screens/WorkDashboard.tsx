// PHASE 3 (`T-08`) — DASHBOARD CÔNG VIỆC: 3 KHỐI CÁ NHÂN · PHÒNG BAN · DỰ ÁN.
// Nguyên văn `docs/25_TODO_ROADMAP.md` dòng `T-08`: «Dashboard cá nhân + phòng ban + dự án (§11)».
//
// NGUYÊN TẮC SỐ LIỆU (bắt buộc):
//   • MỌI số ở đây tính từ dữ liệu ĐANG CÓ trong payload (`workItems` · `projects` · `userScopes`) — KHÔNG gọi API mới.
//   • KHÔNG BỊA SỐ: cột nào không có nguồn (hoặc rỗng trong payload) thì UI ghi «chưa có nguồn» kèm LÝ DO, KHÔNG hiện 0.
//     Nguồn đã đo: `scripts/system-route.mjs:775` (`workItems`: assignedTo · departmentCode · projectId · status ·
//     progress · dueAt · completedAt) · `:634`/`:749` (`projects`, `userScopes`) — KHÔNG có cột "tiến độ dự án" nên
//     chỉ số đó bị ghi rõ là «chưa có nguồn» (đúng ghi nhận đã có ở PHASE 4 — `ProjectEntityModal`).
//
// VÌ SAO TÁCH RA TỆP RIÊNG: tab «Dashboard» là MỘT TAB ĐÃ CHỐT của `T-01` (thứ tự 5 tab KHÔNG đổi) — khối này chỉ
// THÊM NỘI DUNG cho tab đó. Khối thuần nằm giữa hai mốc để test TRÍCH RA và CHẠY THẬT trên fixtures.

import { CardHead, Empty, Kpi } from "@/lib/ui-shared";
import type { AppData, Row } from "@/lib/ui-shared";

// -------------------------------------------------------------------------------------------------
// T08-PURE-BEGIN
// KHỐI THUẦN (không JSX, không import) — test `tests/t08-work-dashboard.test.mjs` TRÍCH RA và CHẠY THẬT.
// -------------------------------------------------------------------------------------------------

// BA KHỐI của `§11` — nguyên văn: cá nhân · phòng ban · dự án.
const DASHBOARD_BLOCKS = [
  { key: "personal", label: "Cá nhân", groupBy: "workItems.assignedTo" },
  { key: "department", label: "Phòng ban", groupBy: "workItems.departmentCode" },
  { key: "project", label: "Dự án", groupBy: "workItems.projectId + projects + userScopes" },
];
const DASHBOARD_NO_SOURCE = "chưa có nguồn";
// Chỉ số CHẮC CHẮN không có nguồn trong payload hiện tại ⇒ nói thẳng, KHÔNG suy diễn bằng số khác.
const DASHBOARD_PROJECT_PROGRESS_NOTE = `${DASHBOARD_NO_SOURCE} — bảng projects KHÔNG có cột tiến độ`;

/**
 * Tình trạng NGUỒN của một cột: `0 dòng` và `cột rỗng` là hai chuyện KHÁC NHAU và cả hai đều KHÔNG được hiện 0.
 * Có nguồn ⇒ nêu tên nguồn kèm số dòng THẬT có giá trị.
 */
function dashboardSourceOf(rows: Row[], field: string, label: string) {
  const list = rows || [];
  if (!list.length) return `${DASHBOARD_NO_SOURCE} — ${label}: 0 dòng trong phạm vi`;
  const known = list.filter((row) => row && row[field] !== undefined && row[field] !== null && String(row[field]) !== "");
  return known.length
    ? `${label} · ${known.length}/${list.length} dòng có giá trị`
    : `${DASHBOARD_NO_SOURCE} — ${label} rỗng trong payload`;
}

/** Thống kê của MỘT nhóm dòng — mọi số đều đếm trực tiếp trên dòng thật. */
function dashboardStats(rows: Row[], isLate: (row: Row) => boolean) {
  const total = rows.length;
  const done = rows.filter((row) => String(row.status || "") === "COMPLETED").length;
  const cancelled = rows.filter((row) => String(row.status || "") === "CANCELLED").length;
  const late = rows.filter((row) => isLate(row)).length;
  const progress = total ? Math.round(rows.reduce((sum, row) => sum + Number(row.progress || 0), 0) / total) : 0;
  return {
    total, done, cancelled,
    open: total - done - cancelled,
    late, progress,
    rate: total ? Math.round((done / total) * 100) : 0,
  };
}

/**
 * DỰNG SỐ LIỆU 3 KHỐI. `personalRows` = việc CỦA TÔI (`assignedTo` = tôi), `scopeRows` = việc trong PHẠM VI ĐƯỢC PHÉP
 * (`T-06`) — hai tập KHÁC NHAU nên truyền riêng, không trộn.
 */
function workDashboard(data: AppData, personalRows: Row[], scopeRows: Row[], isLate: (row: Row) => boolean) {
  const personal = dashboardStats(personalRows || [], isLate);
  const scoped = scopeRows || [];
  const deptCodes = [...new Set(scoped.map((row) => String(row.departmentCode || "")).filter(Boolean))];
  const departments = deptCodes.map((code) => ({
    key: code, code,
    ...dashboardStats(scoped.filter((row) => String(row.departmentCode || "") === code), isLate),
  })).sort((a, b) => b.total - a.total || a.code.localeCompare(b.code, "vi"));
  const projectIds = [...new Set(scoped.map((row) => String(row.projectId || "")).filter(Boolean))];
  const projectDirectory = data.projects || [];
  const projects = projectIds.map((projectId) => {
    const project = projectDirectory.find((row) => String(row.id) === projectId) || null;
    const staff = new Set((data.userScopes || [])
      .filter((scope) => String(scope.projectId || "") === projectId)
      .map((scope) => String(scope.userId || "")).filter(Boolean));
    return {
      key: projectId,
      code: String(project?.code || projectId),
      name: String(project?.name || ""),
      staff: staff.size,
      ...dashboardStats(scoped.filter((row) => String(row.projectId || "") === projectId), isLate),
    };
  }).sort((a, b) => b.total - a.total || a.code.localeCompare(b.code, "vi"));
  return {
    blocks: DASHBOARD_BLOCKS,
    personal,
    departments,
    projects,
    total: scoped.length,
    noProject: scoped.filter((row) => !String(row.projectId || "")).length,
    personalSource: dashboardSourceOf(personalRows || [], "assignedTo", "workItems.assignedTo"),
    departmentSource: dashboardSourceOf(scoped, "departmentCode", "workItems.departmentCode"),
    projectSource: dashboardSourceOf(scoped, "projectId", "workItems.projectId"),
    projectDirectorySource: projectDirectory.length
      ? `projects.code/name · ${projectDirectory.length} dự án`
      : `${DASHBOARD_NO_SOURCE} — projects rỗng trong payload`,
    projectStaffSource: dashboardSourceOf(data.userScopes || [], "userId", "user_project_scopes.user_id"),
    projectProgressNote: DASHBOARD_PROJECT_PROGRESS_NOTE,
  };
}

// T08-PURE-END

/** Thanh tỉ lệ đơn giản, dùng LẠI class `.task-bar` đang có (KHÔNG thêm CSS mới). */
function RateBar({ rate }: { rate: number }) {
  return <div className="task-bar"><span><i style={{ width: `${rate}%` }} /></span><b>{rate}%</b></div>;
}

function WorkDashboard({ data, personalRows, scopeRows, scopeNote, isLate }: {
  data: AppData;
  personalRows: Row[];
  scopeRows: Row[];
  scopeNote: string;
  isLate: (row: Row) => boolean;
}) {
  const metrics = workDashboard(data, personalRows, scopeRows, isLate);
  return <div className="stack work-dashboard">
    {/* ── KHỐI 1/3 — CÁ NHÂN ───────────────────────────────────────────────────────────── */}
    <section className="card" data-dashboard-block="personal" data-dashboard-label={metrics.blocks[0].label}>
      <CardHead title={`Dashboard · ${metrics.blocks[0].label}`} note={`T-08 · ${personalRows.length} việc mang tên tôi — ${scopeNote}`}/>
      <div className="kpi-grid small">
        <Kpi icon="TC" label="Tổng việc của tôi" value={String(metrics.personal.total)} note={`${metrics.personal.open} việc đang mở · ${metrics.personal.cancelled} đã huỷ`} tone="blue"/>
        <Kpi icon="HT" label="Đã hoàn thành" value={String(metrics.personal.done)} note={`Tỉ lệ ${metrics.personal.rate}%`} tone="green"/>
        <Kpi icon="QH" label="Quá hạn" value={String(metrics.personal.late)} note="Tính theo hạn và trạng thái thật" tone="red"/>
        <Kpi icon="TD" label="Tiến độ trung bình" value={`${metrics.personal.progress}%`} note="Trung bình cột progress của việc tôi làm" tone="violet"/>
      </div>
      <p className="muted" data-dashboard-source="personal">Nguồn: {metrics.personalSource}</p>
    </section>

    {/* ── KHỐI 2/3 — PHÒNG BAN ─────────────────────────────────────────────────────────── */}
    <section className="card" data-dashboard-block="department" data-dashboard-label={metrics.blocks[1].label}>
      <CardHead title={`Dashboard · ${metrics.blocks[1].label}`} note={`${metrics.departments.length} phòng có việc trong phạm vi được phép · tổng ${metrics.total} việc`}/>
      <p className="muted" data-dashboard-source="department">Nguồn: {metrics.departmentSource}</p>
      {metrics.departments.length
        ? <div className="table-wrap"><table className="baseline-table">
            <thead><tr><th>Phòng</th><th>Tổng việc</th><th>Hoàn thành</th><th>Đang mở</th><th>Quá hạn</th><th>Tỉ lệ</th><th>Tiến độ TB</th></tr></thead>
            <tbody>{metrics.departments.map((row) => <tr key={row.key}>
              <td><strong>{row.code}</strong></td>
              <td>{row.total}</td>
              <td>{row.done}</td>
              <td>{row.open}</td>
              <td className={row.late ? "red-text" : ""}>{row.late}</td>
              <td><RateBar rate={row.rate}/></td>
              <td><RateBar rate={row.progress}/></td>
            </tr>)}</tbody>
          </table></div>
        : <Empty text={`Chưa có việc phòng ban trong phạm vi được phép. Nguồn: ${metrics.departmentSource}`}/>}
    </section>

    {/* ── KHỐI 3/3 — DỰ ÁN ─────────────────────────────────────────────────────────────── */}
    <section className="card" data-dashboard-block="project" data-dashboard-label={metrics.blocks[2].label}>
      <CardHead title={`Dashboard · ${metrics.blocks[2].label}`} note={`${metrics.projects.length} dự án có việc · ${metrics.noProject} việc CHƯA gắn dự án (không gộp vào dự án nào)`}/>
      <div className="kpi-grid small">
        <Kpi icon="DA" label="Dự án có việc" value={String(metrics.projects.length)} note={metrics.projectSource} tone="blue"/>
        <Kpi icon="NV" label="Nhân sự theo dự án" value={metrics.projectStaffSource === DASHBOARD_NO_SOURCE ? DASHBOARD_NO_SOURCE : String(metrics.projects.reduce((sum, row) => sum + row.staff, 0))} note={metrics.projectStaffSource} tone="violet"/>
        <Kpi icon="TD" label="Tiến độ dự án" value={DASHBOARD_NO_SOURCE} note={metrics.projectProgressNote} tone="red"/>
      </div>
      <p className="muted" data-dashboard-source="project">Nguồn: {metrics.projectSource} · {metrics.projectDirectorySource}</p>
      {metrics.projects.length
        ? <div className="table-wrap"><table className="baseline-table">
            <thead><tr><th>Mã dự án</th><th>Tên dự án</th><th>Nhân sự</th><th>Tổng việc</th><th>Hoàn thành</th><th>Quá hạn</th><th>Tỉ lệ</th></tr></thead>
            <tbody>{metrics.projects.map((row) => <tr key={row.key}>
              <td><strong className="code">{row.code}</strong></td>
              <td>{row.name || <span className="muted">—</span>}</td>
              <td>{row.staff > 0 ? row.staff : <span className="muted">{DASHBOARD_NO_SOURCE}</span>}</td>
              <td>{row.total}</td>
              <td>{row.done}</td>
              <td className={row.late ? "red-text" : ""}>{row.late}</td>
              <td><RateBar rate={row.rate}/></td>
            </tr>)}</tbody>
          </table></div>
        : <Empty text={`Chưa có việc nào gắn dự án trong phạm vi được phép. Nguồn: ${metrics.projectSource}`}/>}
    </section>
  </div>;
}

export {
  DASHBOARD_BLOCKS,
  DASHBOARD_NO_SOURCE,
  DASHBOARD_PROJECT_PROGRESS_NOTE,
  WorkDashboard,
  dashboardSourceOf,
  dashboardStats,
  workDashboard,
};
