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

import { DataTable, ListToolbar, StatusBadge } from "@/app/components/ui";
import { CardHead, Kpi, PROJECT_STATUS_LABELS, date } from "@/lib/ui-shared";
import type { AppData, Row } from "@/lib/ui-shared";
import { useState } from "react";
// =============================================================================
// GĐ5 — TỔ ĐỘI: DANH SÁCH + CHI TIẾT
// Yêu cầu: danh sách tổ đội → chi tiết gồm dự án đang/đã tham gia, sĩ số, THỜI GIAN
// THAM GIA VÀ RỜI ĐI của từng người, click user → hồ sơ, và tab ĐƠN TỪ tổng hợp.
// Dữ liệu: data.teams + data.teamMembers (bảng mới ở migration V14) + chứng từ.
// =============================================================================
function TeamManagement({ data, open }: { data: AppData; open: (name: string, row?: Row) => void }) {
  const [view, setView] = useState<"list" | "detail">("list");
  const [detailId, setDetailId] = useState("");
  const [tab, setTab] = useState(0);
  const [q, setQ] = useState("");

  const teams: Row[] = data.teams || [];
  const members: Row[] = data.teamMembers || [];
  const projOf = (id: unknown) => (data.projects || []).find((p) => String(p.id) === String(id));
  const whOf = (id: unknown) => (data.warehouses || []).find((w) => String(w.id) === String(id));
  const membersOf = (tid: string) => members.filter((m) => String(m.teamId) === String(tid));

  const filtered = teams.filter((t) => !q.trim() ||
    `${t.code || ""} ${t.name || ""} ${t.trade || ""} ${projOf(t.projectId)?.code || ""}`
      .toLocaleLowerCase("vi").includes(q.trim().toLocaleLowerCase("vi")));

  const detail = teams.find((t) => String(t.id) === String(detailId));

  if (view === "detail" && detail) {
    const tid = String(detail.id);
    const all = membersOf(tid);
    const activeMembers = all.filter((m) => Number(m.active ?? 1) === 1 && !m.leftAt);
    const past = all.filter((m) => m.leftAt || Number(m.active ?? 1) === 0);
    const proj = projOf(detail.projectId);
    const wh = whOf(detail.warehouseId);
    // Đơn từ của tổ đội: phiếu của dự án + phiếu xuất/hoàn gắn đúng teamId
    const docs = [
      { label: "Phiếu đề nghị mua hàng của dự án", noKey: "requestNo", statusKey: "status", whoKey: "requestedBy", atKey: "requestedAt",
        rows: (data.requests || []).filter((r) => String(r.projectId) === String(detail.projectId)) },
      { label: "Phiếu xuất kho cho tổ đội", noKey: "issueNo", statusKey: "status", whoKey: "receivedByName", atKey: "issuedAt",
        rows: (data.issues || []).filter((r) => String(r.teamId) === tid) },
      { label: "Phiếu hoàn trả vật tư", noKey: "returnNo", statusKey: "status", whoKey: "returnedByName", atKey: "returnedAt",
        rows: (data.returns || []).filter((r) => String(r.teamId) === tid) },
    ];
    const totalDocs = docs.reduce((s, g) => s + g.rows.length, 0);
    const TABS = ["Tổng quan", "Thành viên", `Đơn từ (${totalDocs})`];

    return <div className="stack team-management">
      <section className="card project-detail-head">
        <div className="table-toolbar">
          <div><strong>{detail.code} · {detail.name}</strong>
            <span>{detail.trade || "Chưa ghi hạng mục"} · {activeMembers.length} thành viên đang hoạt động · {past.length} đã rời</span></div>
          <div className="row-actions"><button type="button" className="page-back" onClick={() => setView("list")}>← Quay lại danh sách</button></div>
        </div>
        <div className="project-scope-tabs" role="tablist">
          {TABS.map((label, i) => <button key={label} type="button" role="tab" aria-selected={tab === i} className={tab === i ? "active" : ""} onClick={() => setTab(i)}>{label}</button>)}
        </div>
      </section>

      {tab === 0 && <div className="stack">
        <div className="kpi-grid small">
          <Kpi icon="DA" label="Dự án" value={proj?.code || "—"} note={proj?.name || "Chưa gắn dự án"} tone="blue"/>
          <Kpi icon="K" label="Kho của tổ đội" value={wh?.code || "—"} note={wh?.name || "Chưa có kho riêng"} tone="violet"/>
          <Kpi icon="TV" label="Thành viên" value={String(activeMembers.length)} note={`${past.length} người đã rời`} tone="green"/>
          <Kpi icon="TT" label="Trạng thái" value={detail.active === 0 ? "Đã ngừng" : "Đang hoạt động"} note={detail.active === 0 ? "Không còn nhận việc" : "Đang nhận cấp phát vật tư"} tone={detail.active === 0 ? "red" : "green"}/>
        </div>
        <section className="card">
          <CardHead title="Dự án tổ đội đang tham gia" note="Theo quy tắc nghiệp vụ hiện hành, mỗi tổ đội thuộc đúng một dự án"/>
          <DataTable rows={proj ? [proj] : []} rowKey={(row) => String(row.id)} emptyText="Tổ đội chưa gắn dự án nào." columns={[{ key: "c1", header: "Mã dự án", render: (row) => <strong className="code">{row.code}</strong> }, { key: "c2", header: "Tên dự án", render: (row) => row.name }, { key: "c3", header: "Trạng thái", render: (row) => <StatusBadge value={PROJECT_STATUS_LABELS[String(row.status || "active")] || String(row.status || "—")} /> }, { key: "c4", header: "Bắt đầu", render: (row) => date(row.startDate) }, { key: "c5", header: "Kết thúc dự kiến", render: (row) => date(row.plannedEndDate) }, { key: "c6", header: "Vai trò tổ đội", render: () => "Thi công / cấp phát vật tư" }]} />
        </section>
      </div>}

      {tab === 1 && <div className="stack">
        <section className="card">
          <CardHead title="Thành viên đang hoạt động" note="Sắp xếp theo NGÀY THAM GIA · bấm “Hồ sơ” để xem dự án / phòng ban / tổ đội của người đó"/>
          <DataTable rows={[...activeMembers].sort((a, b) => String(a.joinedAt || "").localeCompare(String(b.joinedAt || "")))} rowKey={(m) => String(m.id)} emptyText="Tổ đội chưa ghi nhận thành viên. Bảng team_members đã sẵn sàng (migration V14) — cần bổ sung dữ liệu." columns={[
            { key: "c1", header: "Họ tên", render: (m) => <strong>{m.fullName || "—"}</strong> },
            { key: "c2", header: "Mã NV", render: (m) => m.employeeCode || "—" },
            { key: "c3", header: "Chức vụ", render: (m) => m.roleName || m.role || "—" },
            { key: "c4", header: "Phòng ban", render: (m) => m.department || "—" },
            { key: "c5", header: "Vai trò trong tổ đội", render: (m) => m.roleInTeam || "Thành viên" },
            { key: "c6", header: "Ngày tham gia", render: (m) => (m.joinedAt ? date(m.joinedAt) : "—") },
            { key: "c7", header: "Ngày rời", render: () => "—" },
            { key: "c8", header: "", render: (m) => <button type="button" className="export-mini" onClick={() => open("userProfile", { ...m, id: m.userId })}>Hồ sơ ›</button> },
          ]} />
        </section>
        {past.length > 0 && <section className="card">
          <CardHead title="Thành viên đã rời tổ đội" note="Lưu vết thời gian tham gia và rời đi"/>
          <DataTable rows={past} rowKey={(m) => String(m.id)} columns={[
            { key: "c1", header: "Họ tên", render: (m) => <strong>{m.fullName || "—"}</strong> },
            { key: "c2", header: "Mã NV", render: (m) => m.employeeCode || "—" },
            { key: "c3", header: "Vai trò", render: (m) => m.roleInTeam || "Thành viên" },
            { key: "c4", header: "Ngày tham gia", render: (m) => (m.joinedAt ? date(m.joinedAt) : "—") },
            { key: "c5", header: "Ngày rời", render: (m) => (m.leftAt ? date(m.leftAt) : "—") },
            { key: "c6", header: "Thời gian tham gia", render: (m) => { const days = m.joinedAt && m.leftAt ? Math.max(0, Math.round((new Date(String(m.leftAt)).getTime() - new Date(String(m.joinedAt)).getTime()) / 86400000)) : null; return days === null ? "—" : `${days} ngày`; } },
          ]} />
        </section>}
      </div>}

      {tab === 2 && <div className="stack">
        {docs.map((g) => <section className="card" key={g.label}>
          <CardHead title={g.label} note={`${g.rows.length} chứng từ`}/>
          <DataTable rows={g.rows} rowKey={(r, i) => String(String(r.id || i))} columns={[{ key: "c1", header: "Số chứng từ", render: (r) => <><strong className="code">{String(r[g.noKey] || r.id || "—")}</strong></> }, { key: "c2", header: "Trạng thái", render: (r) => <><StatusBadge value={String(r[g.statusKey] || "—")}/></> }, { key: "c3", header: "Người liên quan", render: (r) => <>{String(r[g.whoKey] || "—")}</> }, { key: "c4", header: "Thời điểm", render: (r) => <>{date(r[g.atKey] || r.createdAt)}</> }]} emptyText="Không có chứng từ." />
        </section>)}
      </div>}
    </div>;
  }

  return <div className="stack team-management">
    <section className="card">
      <ListToolbar
        title="DANH SÁCH TỔ ĐỘI"
        note={`${filtered.length}/${teams.length} tổ đội · mỗi tổ đội thuộc đúng một dự án`}
        search={{ value: q, onChange: setQ, placeholder: "Tìm mã, tên tổ đội, hạng mục, dự án…" }}
      />
      <DataTable rows={filtered} rowKey={(t) => String(t.id)} emptyText="Không có tổ đội phù hợp." columns={[
        { key: "c1", header: "Mã tổ đội", render: (t) => <strong className="code">{t.code}</strong> },
        { key: "c2", header: "Tên tổ đội", render: (t) => t.name },
        { key: "c3", header: "Hạng mục", render: (t) => t.trade || "—" },
        { key: "c4", header: "Dự án", render: (t) => { const p = projOf(t.projectId); return p ? `${p.code} · ${p.name}` : "—"; } },
        { key: "c5", header: "Kho của tổ đội", render: (t) => { const wh = whOf(t.warehouseId); return wh ? `${wh.code} · ${wh.name}` : "—"; } },
        { key: "c6", header: "Thành viên", render: (t) => { const act = membersOf(String(t.id)).filter((m) => Number(m.active ?? 1) === 1 && !m.leftAt).length; return act > 0 ? `${act} người` : <span className="muted">Chưa ghi nhận</span>; } },
        { key: "c7", header: "Quyết toán", render: (t) => { const settled = (data.teamSettlements || []).some((s) => String(s.teamId) === String(t.id) && String(s.status) === "closed"); return <StatusBadge value={settled ? "Đã quyết toán" : "Chưa quyết toán"} />; } },
        { key: "c8", header: "Trạng thái", render: (t) => <StatusBadge value={t.active === 0 ? "Đã ngừng" : "Đang hoạt động"} /> },
        { key: "c9", header: "", render: (t) => <button type="button" className="export-mini" onClick={() => { setDetailId(String(t.id)); setView("detail"); setTab(0); }}>Chi tiết ›</button> },
      ]} />
    </section>
  </div>;
}

export {
  TeamManagement,
};