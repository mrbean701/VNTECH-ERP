"use client";

// PHASE 4 (`PR-03` + `PR-04`) — CHI TIẾT DỰ ÁN THÀNH 5 TAB CON: chung · nhân sự · tổ đội · kho · lịch sử.
//
// Nguồn yêu cầu: `docs/25_TODO_ROADMAP.md` PHASE 4 dòng `PR-03` — nguyên văn:
//   "Chi tiết dự án thành tab/modal: chung · nhân sự · tổ đội · kho · lịch sử".
//
// VÌ SAO DẢI TAB CON NÀY NẰM TRONG (không thay dải 6 tab của màn): `PR-01` đã chốt dải ngoài
// (Danh sách dự án + Tổng quan · Nhân sự · Tổ đội · Kho · Ban chỉ huy) và dải đó bị KHOÁ bởi
// `tests/pr01-project-tabs.test.mjs` + `tools/probe-project-screen.mjs` (đòi ĐÚNG 6 mục, cùng nhãn).
// ⇒ `PR-03` được thể hiện bằng dải tab con CỦA KHỐI CHI TIẾT (đúng câu chữ roadmap), không phá `PR-01`.
//
// DỮ LIỆU: CHỈ đọc các bảng ĐANG CÓ trong payload bootstrap (`user_project_scopes` · `teams` ·
// `team_members` · `warehouses` · `goods_receipts` · `material_requests` · `purchase_orders` ·
// `work_items`). KHÔNG dựng bảng dữ liệu mới.
//
// ⚠️ "% TIẾN ĐỘ DỰ ÁN" CỐ Ý ĐỂ TRỐNG: người dùng đã chốt nguồn = **NHẬT KÝ THI CÔNG**, nhưng nghiệp
// vụ này CHƯA tồn tại (`projects` không có cột tiến độ — xem `tools/_live-schema.tsv`) ⇒ khối tiến độ
// hiển thị "CHƯA CÓ NGUỒN DỮ LIỆU TIẾN ĐỘ" và KHÔNG suy diễn phần trăm nào. Không bịa công thức.

import { useState } from "react";
import type { FormEvent } from "react";
import { DataTable, StatusBadge } from "@/app/components/ui";
import { daysFromToday } from "@/lib/date-helpers";
import { downloadCsv, downloadSimpleXlsx } from "@/lib/tabular-export";
import { CardHead, UI_TODAY, date, format, money, PROJECT_STATUS_LABELS, taskStatusLabel } from "@/lib/ui-shared";
// ERP-SESSION-03 (07/10/2026) — `BUG-20261007-C04`: cột «Ưu tiên» in MÃ THÔ (`high`/`critical`…)
// ⇒ nay đi qua bảng nhãn DÙNG CHUNG (domain `priority`).
import { statusLabel } from "@/lib/status-labels";
import type { AppData, Row } from "@/lib/ui-shared";
import { projectManagerName } from "@/app/screens/project-filters";
import { BaseModal } from "@/lib/ui-blocks";

/** Nhãn 5 tab con — nguyên văn roadmap: chung · nhân sự · tổ đội · kho · lịch sử. */
// MT3 §C — tab đầu đổi từ «Chung» thành **«Thông tin dự án»** (nhãn rõ nghĩa, khớp tên modal).
export const PROJECT_DETAIL_SUB_TABS = ["Thông tin dự án", "Nhân sự", "Tổ đội", "Kho", "Lịch sử"];
/** Khoá kỹ thuật tương ứng (dùng cho `section`). */
export const PROJECT_DETAIL_SUB_TAB_KEYS = ["chung", "nhansu", "todoi", "kho", "lichsu"];

type EntityKind = "project" | "user" | "warehouse" | "team";
type ProjectDetailTabsProps = {
  data: AppData;
  project: Row;
  section: string;
  onSection: (value: string) => void;
  openEntity: (kind: EntityKind, row: Row) => void;
  /** MT2-P7-04 (§5.3) — TẠO CÔNG VIỆC/NHIỆM VỤ cho dự án đang mở.
   *  ⚠️ §5.3: CHỈ phần NHẬP DỮ LIỆU — ⛔ KHÔNG suy diễn % tiến độ (P7-05 SKIPPED).
   *  Backend `create_work_item` là tầng chặn quyền (§17); trả `true` khi thành công. */
  createWorkItem?: (payload: Row) => Promise<boolean>;
  permission: Row;
};

/** Một dòng lịch sử dự án — mọi mốc đều lấy từ CỘT THẬT của chứng từ/nhân sự. */
type HistoryEvent = { at: string; group: string; label: string; detail: string };

/** Số ngày CHẬM so với mốc kế hoạch — CÙNG công thức đang dùng ở danh sách (`projectOverdueDays`),
 *  chỉ để hiển thị "chậm N ngày"; TUYỆT ĐỐI KHÔNG phải % tiến độ. */
function projectLateDays(row: Row): number {
  if (String(row.status || "active") !== "active") return 0;
  const late = daysFromToday(row.plannedEndDate);
  return late !== null && late > 0 ? late : 0;
}

/** MT2-P7-04 (§5.3) — Khối NHẬP DỮ LIỆU công việc/nhiệm vụ cho dự án.
 *  ⚠️ §5.3: CHỈ triển khai phần HIỂN THỊ + NHẬP DỮ LIỆU —
 *  ⛔ KHÔNG tự tạo logic đánh giá tiến độ (＝ P7-05 SKIPPED, §38).
 *  ✅ MODAL theo §23 (⛔ không sideform) · ✅ TÁI DÙNG `downloadSimpleXlsx` (§15)
 *  · ✅ quyền do BACKEND chặn `create_work_item` (§17) · ✅ §24: form lưới tự wrap. */
function WorkItemCreateCard({ project, createWorkItem }: { project: Row; createWorkItem?: (payload: Row) => Promise<boolean> }) {
  const [openForm, setOpenForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!createWorkItem) { setMessage("Tài khoản chưa được cấp quyền THAO TÁC (backend chặn)."); return; }
    const f = new FormData(event.currentTarget);
    setBusy(true);
    const ok = await createWorkItem({
      projectId: String(project.id),
      title: String(f.get("title") || ""),
      description: String(f.get("description") || ""),
      workGroup: String(f.get("workGroup") || ""),
      assignedTo: String(f.get("assignedTo") || ""),
      dueAt: String(f.get("dueAt") || ""),
      priority: String(f.get("priority") || "normal"),
      requiredOutput: String(f.get("requiredOutput") || ""),
    });
    setBusy(false);
    if (ok) { setOpenForm(false); setMessage("Đã gửi yêu cầu tạo công việc/nhiệm vụ."); }
    else setMessage("Không tạo được công việc — kiểm tra quyền hoặc dữ liệu bắt buộc.");
  }
  function downloadWorkTemplate() {
    downloadSimpleXlsx({
      sheetName: "Công việc",
      title: "MẪU NHẬP CÔNG VIỆC / NHIỆM VỤ DỰ ÁN",
      subtitle: `Dự án ${String(project.code || "")} — điền rồi import lại để tạo hàng loạt (cùng bộ cột với form tạo).`,
      headers: ["Tiêu đề", "Mô tả", "Nhóm việc", "Người phụ trách (tên đăng nhập)", "Hạn (YYYY-MM-DD)", "Ưu tiên", "Kết quả cần đạt"],
      rows: [],
      widths: [36, 40, 18, 26, 16, 12, 32],
      freezeRows: 3,
    }, `Mau_Cong_Viec_${String(project.code || "DuAn")}`);
  }
  return <>
    <div className="row-actions">
      <button type="button" className="primary" disabled={!createWorkItem} title={createWorkItem ? "Mở FORM tạo công việc/nhiệm vụ cho dự án này" : "Tài khoản chưa được cấp quyền THAO TÁC cho màn Quản lý dự án"} onClick={() => { setMessage(""); setOpenForm(true); }}>＋ TẠO CÔNG VIỆC</button>
      <button type="button" className="secondary" onClick={downloadWorkTemplate} title="Tải file Excel mẫu để điền rồi nhập lại">⇩ MẪU EXCEL CÔNG VIỆC</button>
    </div>
    {message && <div className="inline-alert">{message}</div>}
    {openForm && <BaseModal title="Tạo công việc/nhiệm vụ" note={`${String(project.code || "")} · ${String(project.name || "")} — quyền tạo do BACKEND chặn (create_work_item); hệ thống KHÔNG tự tính % tiến độ.`} close={() => setOpenForm(false)}>
      <form onSubmit={submitForm}>
        <div className="modal-body">
          <div className="form-grid">
            <label>Tiêu đề <input name="title" required placeholder="Ví dụ: Nghiệm thu móng trục A" /></label>
            <label>Nhóm việc <input name="workGroup" placeholder="Ví dụ: Thi công" /></label>
            <label>Người phụ trách <input name="assignedTo" placeholder="Tên đăng nhập" /></label>
            <label>Hạn xử lý <input name="dueAt" type="date" /></label>
            <label>Ưu tiên <select name="priority" defaultValue="normal"><option value="low">Thấp</option><option value="normal">Bình thường</option><option value="high">Cao</option><option value="urgent">Khẩn</option></select></label>
            <label>Kết quả cần đạt <input name="requiredOutput" placeholder="Ví dụ: Biên bản nghiệm thu" /></label>
          </div>
          <label>Mô tả <textarea name="description" rows={3} /></label>
        </div>
        <footer className="modal-footer"><button type="button" className="secondary" onClick={() => setOpenForm(false)}>Hủy</button><button type="submit" className="primary" disabled={busy}>{busy ? "Đang gửi…" : "✓ TẠO CÔNG VIỆC"}</button></footer>
      </form>
    </BaseModal>}
  </>;
}

function ProjectDetailTabs({ data, project, section, onSection, openEntity, createWorkItem, permission }: ProjectDetailTabsProps) {
  const pid = String(project.id);
  // MT3 §C — cột «Tổ đội»: khi 1 nhân sự thuộc NHIỀU tổ đội, bấm «Chi tiết» mở danh sách các tổ đội đó.
  const [openTeamsFor, setOpenTeamsFor] = useState<string>("");
  const userScopes: Row[] = data.userScopes || [];
  const directory: Row[] = data.staffDirectory || [];
  const scopes = userScopes.filter((row) => String(row.projectId) === pid);
  const staff = scopes
    .map((scope) => {
      const user = directory.find((row) => String(row.id) === String(scope.userId));
      return user ? { ...user, _scope: scope } : null;
    })
    .filter(Boolean) as Row[];
  const teams = (data.teams || []).filter((row) => String(row.projectId) === pid);
  const warehouses = (data.warehouses || []).filter((row) => String(row.projectId) === pid);
  const keepers = directory.filter((row) => /kho|warehouse/i.test(`${row.role || ""} ${row.roleBase || ""} ${row.roleName || ""}`));
  const canExport = Boolean(permission?.canExport);
  const late = projectLateDays(project);

  /** Đơn vị/phòng ban của nhân sự tham gia dự án — cùng nguồn với bộ lọc `PR-02`. */
  const unitNames = Array.from(new Set(staff.map((user) => String(user.organizationName || user.department || "—"))));

  /** Lịch sử dự án — ghép từ mốc THẬT của chứng từ/nhân sự thuộc dự án, không sinh dữ liệu giả. */
  const events: HistoryEvent[] = [];
  scopes.forEach((scope) => {
    if (!scope.joinedAt) return;
    const user = staff.find((row) => String(row.id) === String(scope.userId));
    events.push({ at: String(scope.joinedAt), group: "Nhân sự", label: `${user?.fullName || scope.userId} tham gia dự án`, detail: `Phạm vi: ${scope.permission || "—"}${scope.positionName ? ` · ${scope.positionName}` : ""}` });
  });
  (data.teamMembers || []).filter((row) => teams.some((team) => String(team.id) === String(row.teamId))).forEach((member) => {
    if (!member.joinedAt) return;
    events.push({ at: String(member.joinedAt), group: "Tổ đội", label: `${member.fullName || member.userId} vào tổ đội`, detail: `${member.roleInTeam || "—"} · ${teams.find((team) => String(team.id) === String(member.teamId))?.code || "—"}` });
  });
  (data.requests || []).filter((row) => String(row.projectId) === pid).forEach((row) => {
    if (!row.requestedAt) return;
    events.push({ at: String(row.requestedAt), group: "Phiếu đề nghị", label: String(row.requestNo || row.id), detail: `${row.requestedBy || "—"} · ${money(row.totalEstimatedValue)}` });
  });
  (data.purchaseOrders || []).filter((row) => String(row.projectId) === pid).forEach((row) => {
    if (!row.orderedAt) return;
    events.push({ at: String(row.orderedAt), group: "Đơn mua hàng", label: String(row.poNo || row.id), detail: `${row.supplierName || "—"} · ${money(row.totalValue)}` });
  });
  (data.receipts || []).filter((row) => String(row.projectId) === pid).forEach((row) => {
    if (!row.receivedAt) return;
    events.push({ at: String(row.receivedAt), group: "Nhập kho", label: String(row.receiptNo || row.id), detail: `${row.supplierName || "—"} · ${row.warehouseName || "—"}` });
  });
  (data.workItems || []).filter((row) => String(row.projectId) === pid).forEach((row) => {
    const at = String(row.assignedAt || row.completedAt || "");
    if (!at) return;
    events.push({ at: at, group: "Công việc", label: String(row.taskNo || row.id), detail: `${row.title || "—"} · ${row.assignedToName || "—"}` });
  });
  const history = events.slice().sort((a, b) => String(b.at).localeCompare(String(a.at))).slice(0, 60);

  const subTabs = <div className="edm-tabs" role="tablist" aria-label="Chi tiết dự án (PR-03)">
    {PROJECT_DETAIL_SUB_TABS.map((label, index) => (
      <button key={label} type="button" role="tab" aria-selected={PROJECT_DETAIL_SUB_TAB_KEYS[index] === section} className={PROJECT_DETAIL_SUB_TAB_KEYS[index] === section ? "is-active" : ""} onClick={() => onSection(PROJECT_DETAIL_SUB_TAB_KEYS[index])}>{label}</button>
    ))}
  </div>;

  return <div className="stack project-detail-tabs" data-detail-tabs="PR-03">
    {subTabs}

    {section === "chung" && <div className="stack">
      <section className="card">
        <CardHead title="Thông tin dự án" note="Nguồn: bảng projects (mã · tên · trạng thái · hợp đồng · mốc thời gian) + quan hệ thật từ user_project_scopes. ⛔ MT3 §C: cột «Nguồn dữ liệu» đã bỏ khỏi bảng (là cột kỹ thuật), thông tin nguồn được ghi tại đây." />
        <div className="table-wrap"><table className="baseline-table">
          {/* MT3 §C — BỎ cột «Nguồn dữ liệu» (cột kỹ thuật, không phải thông tin người dùng cần).
              ⛔ Thông tin nguồn vẫn được GHI trong ghi chú `CardHead` bên dưới để không mất dấu vết. */}
          <thead><tr><th>Hạng mục</th><th>Giá trị</th></tr></thead>
          <tbody>
            <tr><td>Mã · tên dự án</td><td><strong>{project.code}</strong> · {project.name}</td></tr>
            <tr><td>Trạng thái</td><td><StatusBadge value={PROJECT_STATUS_LABELS[String(project.status || "active")] || statusLabel(project.status || "active", "project")}/></td></tr>
            <tr><td>Hợp đồng</td><td>{project.contractNo || "Chưa gắn hợp đồng"}{project.contractName ? ` · ${project.contractName}` : ""}</td></tr>
            <tr><td>Ngày bắt đầu</td><td>{date(project.startDate)}</td></tr>
            <tr><td>Kết thúc dự kiến</td><td>{date(project.plannedEndDate)}</td></tr>
            <tr><td>Chậm tiến độ (theo mốc kế hoạch)</td><td>{late > 0 ? `${late} ngày` : "Đúng hạn"}</td></tr>
            <tr><td>Người quản lý dự án</td><td>{projectManagerName(pid, userScopes, directory)}</td></tr>
            <tr><td>Phòng ban tham gia</td><td>{unitNames.join(" · ") || "Chưa có nhân sự tham gia"}</td></tr>
          </tbody>
        </table></div>
        <div className="row-actions list-toolbar-actions">
          <button type="button" className="secondary" onClick={() => openEntity("project", project)}>Mở chi tiết dự án (EntityDetailModal) ›</button>
          <button type="button" className="secondary" disabled={!canExport} title={canExport ? "Xuất thông tin dự án ra CSV" : "Tài khoản chưa được cấp quyền XUẤT của chức năng Quản lý dự án"} onClick={() => downloadCsv(["Mã dự án", "Tên dự án", "Trạng thái", "Bắt đầu", "Kết thúc dự kiến", "Nhân sự", "Tổ đội", "Kho"], [[String(project.code || ""), String(project.name || ""), String(PROJECT_STATUS_LABELS[String(project.status || "active")] || ""), String(project.startDate || ""), String(project.plannedEndDate || ""), staff.length, teams.length, warehouses.length]], `Chi_tiet_du_an_${project.code || pid}_${UI_TODAY}`)}>⇩ XUẤT</button>
        </div>
      </section>

      <section className="card project-detail-progress" data-progress-source="unavailable">
        <CardHead title="Tiến độ thực hiện dự án" note="Không hiển thị phần trăm khi chưa có nguồn dữ liệu đã chốt" />
        <div className="development-screen-notice">
          <b>CHƯA CÓ NGUỒN DỮ LIỆU TIẾN ĐỘ</b>
          <span>Người dùng đã chốt nguồn phần trăm tiến độ = <strong>NHẬT KÝ THI CÔNG</strong>, nhưng nghiệp vụ nhật ký thi công CHƯA tồn tại trong hệ thống (bảng <code>projects</code> không có cột tiến độ). Khối này CỐ Ý để trống — không suy diễn phần trăm từ BOQ/sản lượng/ngày.</span>
        </div>
      </section>

      <section className="card project-detail-workitems">
        <CardHead title="Công việc cần hoàn thành" note="Tạo công việc/nhiệm vụ · nhập Excel — ⛔ KHÔNG đánh giá % tiến độ" />
        <WorkItemCreateCard project={project} createWorkItem={createWorkItem} />
        {(data.workItems || []).filter((row) => String(row.projectId) === pid).length === 0
          ? <div className="empty"><span>✓</span><strong>Chưa có công việc/nhiệm vụ.</strong><p>Dùng «＋ TẠO CÔNG VIỆC» hoặc «⇩ MẪU EXCEL CÔNG VIỆC» để nhập dữ liệu.</p></div>
          : <div className="table-wrap"><table><thead><tr><th>Tiêu đề</th><th>Nhóm việc</th><th>Phụ trách</th><th>Hạn</th><th>Ưu tiên</th><th>Trạng thái</th></tr></thead><tbody>
              {(data.workItems || []).filter((row) => String(row.projectId) === pid).map((row) => (
                <tr key={String(row.id)}><td><strong>{String(row.title || "—")}</strong></td><td>{String(row.workGroup || "—")}</td><td>{String(row.assignedToName || row.assignedTo || "—")}</td><td>{row.dueAt ? date(String(row.dueAt)) : "—"}</td><td>{statusLabel(String(row.priority || "normal"), "priority")}</td><td><StatusBadge value={taskStatusLabel(String(row.status || "todo"))} /></td></tr>
              ))}
            </tbody></table></div>}
      </section>
    </div>}

    {section === "nhansu" && <section className="card">
      <CardHead title="Nhân sự tham gia dự án" note={`${staff.length} người · bấm một dòng để mở EntityDetailModal`} />
      <DataTable
        rows={staff}
        rowKey={(u) => String(u.id)}
        emptyText="Dự án chưa gán nhân sự nào."
        onRowClick={(u) => openEntity("user", u)}
        columns={[
          { key: "c1", header: "Họ tên", render: (u) => <><button type="button" className="link-cell" onClick={(event) => { event.stopPropagation(); openEntity("user", u); }}><strong>{u.fullName}</strong></button><small>{u.email || u.username || "—"}</small></> },          { key: "c2", header: "Mã NV", render: (u) => <>{u.employeeCode || "—"}</> },
          { key: "c3", header: "Chức vụ", render: (u) => <>{u.roleName || u.role || "—"}</> },
          { key: "c4", header: "Phòng ban", render: (u) => <>{u.organizationName || u.department || "—"}</> },
          { key: "c5", header: "Ngày tham gia", render: (u) => <>{u._scope?.joinedAt ? date(u._scope.joinedAt) : <span className="muted">Chưa ghi nhận</span>}</> },
          { key: "c6", header: "Quyền trong dự án", render: (u) => <>{u._scope?.permission || "—"}</> },
          { key: "c7", header: "Trạng thái", render: (u) => <StatusBadge value={u.active === false ? "Đã khoá" : "Đang hoạt động"}/> },
          // MT3 §C — CỘT «TỔ ĐỘI»: chưa thuộc tổ đội → `N/A`; thuộc 1 → tên tổ đội;
          // thuộc NHIỀU → nút «Chi tiết» mở danh sách các tổ đội user đang tham gia.
          { key: "c9", header: "Tổ đội", render: (u) => {
            const mine = (data.teamMembers || []).filter((m: Row) => String(m.userId) === String(u.id) && Number(m.active ?? 1) === 1);
            if (!mine.length) return <span className="muted">N/A</span>;
            const names = mine.map((m: Row) => (data.teams || []).find((t: Row) => String(t.id) === String(m.teamId))).filter(Boolean);
            if (names.length <= 1) return <><strong>{names[0] ? String(names[0].name || names[0].code || names[0].id) : "—"}</strong></>;
            return <button type="button" className="export-mini" onClick={(event) => { event.stopPropagation(); setOpenTeamsFor(String(u.id)); }}>Chi tiết ({names.length})</button>;
          } },
          { key: "c8", header: "", render: (u) => <button type="button" className="export-mini" onClick={(event) => { event.stopPropagation(); openEntity("user", u); }}>Hồ sơ ›</button> },
        ]}
      />
      {/* MT3 §C — danh sách TỔ ĐỘI của 1 nhân sự khi họ thuộc NHIỀU tổ đội (bấm «Chi tiết» ở cột «Tổ đội»). */}
      {openTeamsFor && <div className="team-inline-list" data-vntech="project-member-teams">
        <strong>Các tổ đội của nhân sự đang chọn:</strong>
        <ul>{(data.teamMembers || []).filter((m: Row) => String(m.userId) === openTeamsFor && Number(m.active ?? 1) === 1).map((m: Row) => {
          const team = (data.teams || []).find((t: Row) => String(t.id) === String(m.teamId));
          return <li key={String(m.id || `${m.teamId}-${m.userId}`)}>
            <button type="button" className="link-cell" onClick={() => team && openEntity("team", team)}>{team ? String(team.name || team.code || team.id) : "Tổ đội đã xoá"}</button>
            {m.roleInTeam ? <small> · vai trò: {String(m.roleInTeam)}</small> : null}
          </li>;
        })}</ul>
        <button type="button" className="secondary" onClick={() => setOpenTeamsFor("")}>Đóng danh sách</button>
      </div>}
    </section>}

    {section === "todoi" && <section className="card">
      <CardHead title="Tổ đội thuộc dự án" note={`${teams.length} tổ đội · bấm một dòng để mở EntityDetailModal`} />
      <DataTable
        rows={teams}
        rowKey={(t) => String(t.id)}
        emptyText="Dự án chưa có tổ đội."
        onRowClick={(t) => openEntity("team", t)}
        columns={[
          { key: "c1", header: "Mã tổ đội", render: (t) => <strong className="code">{t.code}</strong> },
          { key: "c2", header: "Tên tổ đội", render: (t) => t.name },
          { key: "c3", header: "Hạng mục", render: (t) => t.trade || "—" },
          { key: "c4", header: "Kho của tổ đội", render: (t) => { const wh = (data.warehouses || []).find((w) => String(w.id) === String(t.warehouseId)); return wh ? `${wh.code} · ${wh.name}` : "—"; } },
          { key: "c5", header: "Nhân sự", render: (t) => { const members = (data.teamMembers || []).filter((m) => String(m.teamId) === String(t.id) && Number(m.active ?? 1) === 1); return members.length ? `${members.length} người` : <span className="muted">Chưa ghi nhận thành viên</span>; } },
          { key: "c6", header: "Trạng thái", render: (t) => <StatusBadge value={t.active === 0 ? "Đã ngừng" : "Đang dùng"} /> },
          { key: "c7", header: "", render: (t) => <button type="button" className="export-mini" onClick={(event) => { event.stopPropagation(); openEntity("team", t); }}>Chi tiết ›</button> },
        ]}
      />
    </section>}

    {section === "kho" && <section className="card">
      <CardHead title="Kho của dự án" note={`${warehouses.length} kho · bấm một dòng để mở EntityDetailModal (tồn kho · thủ kho · đơn từ)`} />
      <DataTable
        rows={warehouses}
        rowKey={(w) => String(w.id)}
        emptyText="Dự án chưa có kho."
        onRowClick={(w) => openEntity("warehouse", w)}
        columns={[
          { key: "c1", header: "Mã kho", render: (w) => <strong className="code">{w.code}</strong> },
          { key: "c2", header: "Tên kho", render: (w) => w.name },
          { key: "c3", header: "Loại", render: (w) => (w.type === "site" ? "Kho công trường" : w.type === "central" ? "Kho tổng" : w.type === "team" ? "Kho tổ đội" : String(w.type || "—")) },
          { key: "c4", header: "Thủ kho (theo chức danh)", render: () => (keepers[0] ? keepers[0].fullName : <span className="muted">Chưa phân công</span>) },
          { key: "c5", header: "Tồn kho", render: (w) => { const bal = (data.inventory || []).filter((r) => String(r.warehouseId) === String(w.id)); return `${bal.length} mã · ${format.format(bal.reduce((sum, r) => sum + Number(r.balance || 0), 0))}`; } },
          { key: "c6", header: "", render: (w) => <button type="button" className="export-mini" onClick={(event) => { event.stopPropagation(); openEntity("warehouse", w); }}>Xem kho ›</button> },
        ]}
      />
    </section>}

    {section === "lichsu" && <section className="card">
      <CardHead title="Lịch sử dự án" note={`${history.length} mốc · ghép từ mốc THẬT của chứng từ và nhân sự thuộc dự án (không sinh dữ liệu giả)`} />
      <DataTable
        rows={history}
        rowKey={(row, index) => `${row.at}-${row.group}-${index}`}
        emptyText="Chưa có mốc lịch sử nào cho dự án."
        columns={[
          { key: "c1", header: "Thời điểm", render: (row) => <strong>{date(row.at)}</strong> },
          { key: "c2", header: "Nhóm", render: (row) => <StatusBadge value={row.group} /> },
          { key: "c3", header: "Nội dung", render: (row) => row.label },
          { key: "c4", header: "Chi tiết", render: (row) => <span className="muted">{row.detail}</span> },
        ]}
      />
    </section>}
  </div>;
}

export { ProjectDetailTabs };
