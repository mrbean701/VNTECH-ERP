"use client";

// ⚠️ MT3-S03 (08/10/2026) — TỆP NÀY HIỆN ⛔ KHÔNG ĐƯỢC DÙNG Ở ĐÂU (đo được: **0 tham chiếu** trong `app/**` + `lib/**`).
//    ⚠️ LƯU Ý: tệp này TỪNG nằm trong «bản kiểm kê modal» (`SESSION_C/TEST_LOG.md §C38.1`, khoá `teamCreate`) ⇒ ⛔ dễ TƯỞNG NHẦM là «đã phủ».
//    ⚠️ Cần quyết (nối lại menu · xoá · giữ kèm ghi chú): `SESSION_C/HANDOFF_LOG.md` §`HANDOFF-20261007-C15`.
// USER 28/09/2026 — DANH SÁCH TỔNG HỢP TRÊN NHIỀU DỰ ÁN cho 4 thẻ của màn «DANH SÁCH DỮ ÁN».
//
// YÊU CẦU CỦA USER (nguyên văn):
//   ④ Nhân sự  → lấy danh sách nhân sự ĐANG ĐƯỢC PHÂN VÀO CÁC DỰ ÁN (danh sách tổng hợp)
//   ⑤ Tổ đội   → lấy danh sách tổ đội của CÁC DỰ ÁN ĐANG HOẠT ĐỘNG; BẤM ⇒ modal chi tiết tổ đội đó
//   ⑥ Kho      → hiển thị các kho THUỘC DỰ ÁN; MẶC ĐỊNH lọc các kho DỰ ÁN CÒN HOẠT ĐỘNG
//   ⑦ Ban chỉ huy → hiển thị các ban chỉ huy DỰ ÁN CÒN HOẠT ĐỘNG
//
// ⚠️ VÌ SAO TÁCH FILE RIÊNG (kỷ luật đã ghi ở `lib/p2-approval-timeline.ts`):
//   `app/page.tsx` là tệp khổng lồ và dải thẻ nằm trọn trong MỘT dòng dài ⇒ logic gom dữ liệu
//   đặt trong JSX sẽ KHÔNG test được ở tầng dữ liệu. File này chỉ nhận `data` + `section`
//   nên `tests/*.test.mjs` import được bằng `node --import tsx` mà KHÔNG tạo vòng import.
//
// ⛔ KHÔNG BỊA DỮ LIỆU: mọi dòng đều GHÉP TỪ bảng ĐANG CÓ trong payload bootstrap
//   (`user_scopes` · `teams` · `team_members` · `warehouses` · `inventory` ·
//   `organization_units`). KHÔNG dựng bảng mới, KHÔNG suy diễn số liệu.
//
// 📌 NGUỒN TÊN TRƯỜNG (đã đọc từ mã đang chạy, ⛔ không đoán):
//   · nhân sự   : `userScopes{userId, projectId, permission, joinedAt}` × `users{}`
//   · tổ đội    : `teams{code, name, trade, warehouseId, projectId, active}` + `teamMembers{teamId, active}`
//   · kho       : `warehouses{code, name, type, projectId, active}` + `inventory{warehouseId, balance}`
//   · ban chỉ huy: `organizationUnits{unitType:"site_command", projectId, archivedAt}` (app/page.tsx:1486)

import { useState } from "react";
import { DataTable, StatusBadge } from "@/app/components/ui";
import { CardHead, format } from "@/lib/ui-shared";
import type { AppData, Row } from "@/lib/ui-shared";

/** Bốn mục danh sách tổng hợp — thứ tự khớp với dải thẻ ngoài của màn Danh sách dự án. */
export const PROJECT_AGG_SECTIONS = ["nhansu", "todoi", "kho", "bch"] as const;
export type ProjectAggSection = (typeof PROJECT_AGG_SECTIONS)[number];

type EntityKind = "project" | "user" | "warehouse" | "team";

export type ProjectAggregateTabsProps = {
  data: AppData;
  section: string;
  openEntity: (kind: EntityKind, row: Row) => void;
  /** USER 28/09/2026 — mở modal ĐÃ CÓ (⛔ không tạo modal trùng): open("teamCreate"). */
  open?: (name: string, row?: Row) => void;
  /** ⛔ chỉ hiện nút «Tạo Tổ đội» khi user CÓ quyền (admin hoặc vai trò cht/commander). */
  canCreateTeam?: boolean;
  /** ⛔ chỉ hiện nút «Tạo Ban chỉ huy» khi `bchGates().canAddUnit` — tính ở CHA rồi truyền xuống. */
  canCreateBch?: boolean;
  /** ⛔ chỉ hiện nút «Tạo kho» khi user có quyền tạo dự án (cùng cổng với nút Tạo Dự án). */
  canCreateWarehouse?: boolean;
};

export function ProjectAggregateTabs({ data, section, openEntity, open, canCreateTeam, canCreateBch, canCreateWarehouse }: ProjectAggregateTabsProps) {
  // ⑥ Kho: mặc định CHỈ hiện kho còn hoạt động; người dùng có thể bật lại kho đã ngừng.
  const [showInactiveWarehouses, setShowInactiveWarehouses] = useState(false);

  const projects: Row[] = data.projects || [];
  const users: Row[] = data.users || [];
  const userScopes: Row[] = data.userScopes || [];
  const teams: Row[] = data.teams || [];
  const teamMembers: Row[] = data.teamMembers || [];
  const warehouses: Row[] = data.warehouses || [];
  const inventory: Row[] = data.inventory || [];
  const orgUnits: Row[] = data.organizationUnits || [];

  /** Dự án CÒN HOẠT ĐỘNG — `projects.status` rỗng được coi là hoạt động (đúng như cách sắp xếp danh sách). */
  const isActiveProject = (p: Row) => String(p?.status || "active") === "active";
  const activeProjects = projects.filter(isActiveProject);
  const activeIds = new Set(activeProjects.map((p) => String(p.id)));
  const projectLabel = (pid: unknown) => {
    const p = projects.find((x) => String(x.id) === String(pid));
    return p ? `${p.code || "—"} · ${p.name || "—"}` : "—";
  };

  // ── ④ NHÂN SỰ: gom từ `userScopes` ⇒ DANH SÁCH TỔNG HỢP, MỖI NGƯỜI GỘP NHIỀU DỰ ÁN ──
  const staffRows: Row[] = (() => {
    const byUser = new Map<string, Row[]>();
    for (const s of userScopes) {
      const uid = String(s.userId);
      const list = byUser.get(uid) ?? [];
      list.push(s);
      byUser.set(uid, list);
    }
    const out: Row[] = [];
    for (const [uid, scopes] of byUser) {
      const u = users.find((x) => String(x.id) === uid);
      if (!u) continue; // ⛔ không bịa người không có trong danh bạ
      const active = scopes.filter((s) => activeIds.has(String(s.projectId)));
      out.push({
        ...u,
        _scopes: scopes,
        _projects: scopes.map((s) => projectLabel(s.projectId)),
        _projectCount: scopes.length,
        _activeProjectCount: active.length,
      });
    }
    // ⛔ KHÔNG đổi thứ tự ngẫu nhiên: sắp theo HỌ TÊN có dấu.
    return out.sort((a, b) => String(a.fullName || "").localeCompare(String(b.fullName || ""), "vi"));
  })();

  // ── ⑤ TỔ ĐỘI: chỉ dự án ĐANG HOẠT ĐỘNG ──
  const teamRows: Row[] = teams
    .filter((t) => activeIds.has(String(t.projectId)))
    .map((t): Row => ({ ...t, _project: projectLabel(t.projectId) }))
    .sort((a: Row, b: Row) => String(a.code || "").localeCompare(String(b.code || ""), "vi"));

  // ── ⑥ KHO: thuộc dự án, mặc định CHỈ kho DỰ ÁN CÒN HOẠT ĐỘNG (tức kho `active !== 0`) ──
  const whAll: Row[] = warehouses
    .filter((w) => activeIds.has(String(w.projectId)))
    .map((w): Row => ({ ...w, _project: projectLabel(w.projectId) }));
  const whRows: Row[] = whAll
    .filter((w) => showInactiveWarehouses || Number(w.active ?? 1) !== 0)
    .sort((a: Row, b: Row) => String(a.code || "").localeCompare(String(b.code || ""), "vi"));
  const whHidden = whAll.length - whRows.length;

  // ── ⑦ BAN CHỈ HUY: `organizationUnits` loại `site_command`, thuộc dự án còn hoạt động ──
  const bchRows: Row[] = orgUnits
    .filter((u) => String(u.unitType) === "site_command" && !u.archivedAt && activeIds.has(String(u.projectId)))
    .map((u): Row => ({ ...u, _project: projectLabel(u.projectId) }))
    .sort((a: Row, b: Row) => String(a.code || "").localeCompare(String(b.code || ""), "vi"));

  if (section === "nhansu") {
    return (
      <section className="card">
        <CardHead
          title="Nhân sự được phân vào dự án"
          note={`${staffRows.length} người · tổng hợp tỪ TẤT CẢ dự án trong phạm vi quyền của bạn · bấm một dòng để mở hồ sơ`}
        />
        <DataTable
          rows={staffRows}
          rowKey={(u) => String(u.id)}
          emptyText="Chưa có nhân sự nào được phân vào dự án."
          onRowClick={(u) => openEntity("user", u)}
          columns={[
            { key: "c1", header: "Họ tên", render: (u) => <><strong>{u.fullName}</strong><small>{u.email || u.username || "—"}</small></> },
            { key: "c2", header: "Mã NV", render: (u) => <>{u.employeeCode || "—"}</> },
            { key: "c3", header: "Phòng ban", render: (u) => <>{u.organizationName || u.department || "—"}</> },
            { key: "c4", header: "Dự án đang tham gia", render: (u) => <>{u._projects?.length ? u._projects.join(" · ") : "—"}</> },
            { key: "c5", header: "Số dự án", render: (u) => <>{u._activeProjectCount}/{u._projectCount} đang hoạt động</> },
            { key: "c6", header: "Trạng thái", render: (u) => <StatusBadge value={u.active === false ? "Đã khoá" : "Đang hoạt động"} /> },
            { key: "c7", header: "", render: (u) => <button type="button" className="export-mini" onClick={(e) => { e.stopPropagation(); openEntity("user", u); }}>Chi tiết ›</button> },
          ]}
        />
      </section>
    );
  }

  if (section === "todoi") {
    return (
      <section className="card">
        <CardHead
          title="Tổ đội của dự án đang hoạt động"
          note={`${teamRows.length} tổ đội · chỉ tính dự án ĐANG HOẠT ĐỘNG · bấm một dòng để mở hộp chi tiết tổ đội`}
        />
        {canCreateTeam && (
          <p className="aggregate-toggle-row">
            <button type="button" className="primary" onClick={() => open?.("teamCreate")}>＋ Tạo tổ đội</button>
          </p>
        )}
        <DataTable
          rows={teamRows}
          rowKey={(t) => String(t.id)}
          emptyText="Chưa có tổ đội nào thuộc dự án đang hoạt động."
          onRowClick={(t) => openEntity("team", t)}
          columns={[
            { key: "c1", header: "Mã tổ đội", render: (t) => <strong className="code">{t.code}</strong> },
            { key: "c2", header: "Tên tổ đội", render: (t) => t.name },
            { key: "c3", header: "Dự án", render: (t) => <>{t._project}</> },
            { key: "c4", header: "Hạng mục", render: (t) => <>{t.trade || "—"}</> },
            { key: "c5", header: "Kho của tổ đội", render: (t) => { const w = warehouses.find((x) => String(x.id) === String(t.warehouseId)); return w ? `${w.code} · ${w.name}` : "—"; } },
            { key: "c6", header: "Thành viên", render: (t) => { const m = teamMembers.filter((x) => String(x.teamId) === String(t.id) && Number(x.active ?? 1) === 1); return m.length ? `${m.length} người` : <span className="muted">Chưa ghi nhận</span>; } },
            { key: "c7", header: "Trạng thái", render: (t) => <StatusBadge value={Number(t.active ?? 1) === 0 ? "Đã ngừng" : "Đang dùng"} /> },
            { key: "c8", header: "", render: (t) => <button type="button" className="export-mini" onClick={(e) => { e.stopPropagation(); openEntity("team", t); }}>Chi tiết ›</button> },
          ]}
        />
      </section>
    );
  }

  if (section === "kho") {
    return (
      <section className="card">
        <CardHead
          title="Kho thuộc dự án"
          note={`${whRows.length} kho · MẶC ĐỊNH chỉ hiện kho của dự án CÒN HOẠT ĐỘNG${whHidden ? ` · đang ẩn ${whHidden} kho đã ngừng` : ""} · bấm một dòng để mở hộp chi tiết kho`}

        />
        {canCreateWarehouse && (
          <p className="aggregate-toggle-row">
            <button type="button" className="primary" onClick={() => open?.("warehouseCreate")}>＋ Tạo kho</button>
          </p>
        )}
        {(whHidden > 0 || showInactiveWarehouses) && (
          <p className="aggregate-toggle-row">
            <button type="button" className="secondary" onClick={() => setShowInactiveWarehouses((v) => !v)}>
              {showInactiveWarehouses ? "Chỉ hiện kho đang hoạt động" : `Hiện cả kho đã ngừng (${whHidden})`}
            </button>
          </p>
        )}
        <DataTable
          rows={whRows}
          rowKey={(w) => String(w.id)}
          emptyText="Chưa có kho nào thuộc dự án đang hoạt động."
          onRowClick={(w) => openEntity("warehouse", w)}
          columns={[
            { key: "c1", header: "Mã kho", render: (w) => <strong className="code">{w.code}</strong> },
            { key: "c2", header: "Tên kho", render: (w) => w.name },
            { key: "c3", header: "Dự án", render: (w) => <>{w._project}</> },
            { key: "c4", header: "Loại", render: (w) => (w.type === "site" ? "Kho công trường" : w.type === "central" ? "Kho tổng" : w.type === "team" ? "Kho tổ đội" : String(w.type || "—")) },
            { key: "c5", header: "Tồn kho", render: (w) => { const bal = inventory.filter((r) => String(r.warehouseId) === String(w.id)); return `${bal.length} mã · ${format.format(bal.reduce((s, r) => s + Number(r.balance || 0), 0))}`; } },
            { key: "c6", header: "Trạng thái", render: (w) => <StatusBadge value={Number(w.active ?? 1) === 0 ? "Đã ngừng" : "Đang dùng"} /> },
            { key: "c7", header: "", render: (w) => <button type="button" className="export-mini" onClick={(e) => { e.stopPropagation(); openEntity("warehouse", w); }}>Chi tiết ›</button> },
          ]}
        />
      </section>
    );
  }

  if (section === "bch") {
    return (
      <section className="card">
        <CardHead
          title="Ban chỉ huy dự án đang hoạt động"
          note={`${bchRows.length} ban chỉ huy · chỉ tính dự án ĐANG HOẠT ĐỘNG · bấm một dòng để mở dự án`}
        />
        {canCreateBch && (
          <p className="aggregate-toggle-row">
            <button type="button" className="primary" onClick={() => open?.("siteCommandCreate")}>＋ Tạo Ban chỉ huy</button>
          </p>
        )}
        <DataTable
          rows={bchRows}
          rowKey={(u) => String(u.id)}
          emptyText="Chưa có ban chỉ huy nào thuộc dự án đang hoạt động."
          onRowClick={(u) => { const pid = String(u.projectId || ""); const p = projects.find((x) => String(x.id) === pid); if (p) openEntity("project", p); }}
          columns={[
            { key: "c1", header: "Mã BCH", render: (u) => <strong className="code">{u.code}</strong> },
            { key: "c2", header: "Tên ban chỉ huy", render: (u) => u.name },
            { key: "c3", header: "Dự án", render: (u) => <>{u._project}</> },
            { key: "c4", header: "Đơn vị cấp trên", render: (u) => { const p = orgUnits.find((x) => String(x.id) === String(u.parentId)); return p ? p.name : "—"; } },
            { key: "c5", header: "Thứ tự", render: (u) => <>{u.sortOrder ?? "—"}</> },
            { key: "c6", header: "", render: (u) => <button type="button" className="export-mini" onClick={(e) => { e.stopPropagation(); const pid = String(u.projectId || ""); const p = projects.find((x) => String(x.id) === pid); if (p) openEntity("project", p); }}>Chi tiết ›</button> },
          ]}
        />
      </section>
    );
  }

  return null;
}
