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

import { DataTable, PermissionGuard, StatusBadge } from "@/app/components/ui";
import { isAdminUser } from "@/lib/permissions";
import { CardHead } from "@/lib/ui-shared";
import type { AppData, Row } from "@/lib/ui-shared";
import { useState } from "react";
// =============================================================================
// NỢ MỤC 5/8 — BẢNG DANH SÁCH VẬT TƯ ĐẦY ĐỦ (tab 1 của Danh mục vật tư gốc)
// Yêu cầu: «Tab đầu tiên sẽ hiển thị danh sách vật tư (sắp xếp theo id), có đầy đủ các
// thông tin cơ bản về vật tư đó BAO GỒM CẢ TÊN PHỤ ALIAS, hiển thị TẤT CẢ các nút crud
// áp dụng với tất cả các user nhưng chỉ có các user có perm thì mới được sử dụng tính
// năng của nút đó, thêm đầy đủ các search sort filter.»
// =============================================================================
function MaterialListTable({ data, open, permission }: { data: AppData; open: (name: string, row?: Row) => void; permission: Row }) {
  const [q, setQ] = useState("");
  const [system, setSystem] = useState("ALL");
  const [group, setGroup] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [sortBy, setSortBy] = useState("code");
  const [showAlias, setShowAlias] = useState(true);

  const materials: Row[] = data.adminMaterials || data.materials || [];
  const aliases: Row[] = data.materialAliases || [];
  const canEdit = Boolean(permission?.canEdit);
  const canCreate = Boolean(permission?.canCreate);
  const canMerge = Boolean(permission?.canEdit);
  const canRetire = isAdminUser(data.user);

  const aliasOf = (mid: unknown) => aliases
    .filter((a) => String(a.materialId) === String(mid) && Number(a.active ?? 1) === 1)
    .map((a) => String(a.aliasName || "")).filter(Boolean);

  const systems = [...new Set(materials.map((m) => String(m.categoryName || "")).filter(Boolean))].sort((a, b) => a.localeCompare(b, "vi"));
  const groups = [...new Set(materials.map((m) => String(m.subcategoryName || "")).filter(Boolean))].sort((a, b) => a.localeCompare(b, "vi"));

  const rows = materials
    .filter((m) => status === "ALL" || (status === "ACTIVE" ? Number(m.active) !== 0 : Number(m.active) === 0))
    .filter((m) => system === "ALL" || String(m.categoryName || "") === system)
    .filter((m) => group === "ALL" || String(m.subcategoryName || "") === group)
    .filter((m) => {
      if (!q.trim()) return true;
      const hay = `${m.code} ${m.name} ${m.unit} ${m.specification} ${m.brand} ${aliasOf(m.id).join(" ")}`
        .toLocaleLowerCase("vi");
      return hay.includes(q.trim().toLocaleLowerCase("vi"));
    })
    .sort((a, b) => {
      if (sortBy === "name") return String(a.name || "").localeCompare(String(b.name || ""), "vi");
      if (sortBy === "system") return String(a.categoryName || "").localeCompare(String(b.categoryName || ""), "vi");
      return String(a.code || "").localeCompare(String(b.code || ""));
    });

  return <section className="card material-list-card">
    <CardHead title="Danh sách vật tư" note="Sắp xếp theo mã · có tên phụ (alias) · mọi nút CRUD đều hiển thị, nút nào thiếu quyền sẽ bị vô hiệu hoá"/>
    <div className="material-list-filters">
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm mã, tên chuẩn, tên phụ, thông số…" aria-label="Tìm vật tư"/>
      <select value={system} onChange={(e) => setSystem(e.target.value)} aria-label="Lọc hệ vật tư"><option value="ALL">Tất cả hệ</option>{systems.map((s) => <option key={s} value={s}>{s}</option>)}</select>
      <select value={group} onChange={(e) => setGroup(e.target.value)} aria-label="Lọc nhóm vật tư"><option value="ALL">Tất cả nhóm</option>{groups.map((s) => <option key={s} value={s}>{s}</option>)}</select>
      <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Lọc trạng thái vật tư"><option value="ALL">Tất cả trạng thái</option><option value="ACTIVE">Đang dùng</option><option value="LOCKED">Đã ngừng</option></select>
      <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sắp xếp vật tư"><option value="code">Sắp xếp: Mã vật tư</option><option value="name">Sắp xếp: Tên</option><option value="system">Sắp xếp: Hệ</option></select>
      <label className="material-list-toggle"><input type="checkbox" checked={showAlias} onChange={(e) => setShowAlias(e.target.checked)}/> Hiện tên phụ</label>
      <PermissionGuard allow={canCreate}><button type="button" className="primary" disabled={!canCreate} title={canCreate ? "Thêm vật tư" : "Bạn không có quyền tạo vật tư"} onClick={() => open("materialMaster")}>＋ Thêm vật tư</button></PermissionGuard>
    </div>
    <DataTable
      rows={rows}
      rowKey={(m) => String(m.id)}
      tableClassName="material-list-table"
      emptyText="Không có vật tư phù hợp bộ lọc."
      columns={[
        { key: "code", header: "Mã vật tư", render: (m) => <strong className="code">{m.code}</strong> },
        { key: "name", header: "Tên chuẩn", render: (m) => <strong>{m.name}</strong> },
        { key: "alias", header: "Tên phụ (alias)", hidden: !showAlias, render: (m) => { const al = aliasOf(m.id); return al.length ? <>{al.join(" · ")}</> : <span className="muted">Chưa có</span>; } },
        { key: "category", header: "Hệ M&E", render: (m) => <>{m.categoryName || "—"}</> },
        { key: "subcategory", header: "Nhóm", render: (m) => <>{m.subcategoryName || "—"}</> },
        { key: "unit", header: "ĐVT", render: (m) => <>{m.unit || "—"}</> },
        { key: "specification", header: "Thông số", render: (m) => <>{m.specification || "—"}</> },
        { key: "brand", header: "Hãng", render: (m) => <>{m.brand || "—"}</> },
        { key: "minStock", header: "Tồn min", render: (m) => <>{Number(m.minStock || 0)}</> },
        { key: "active", header: "Trạng thái", render: (m) => Number(m.active) === 0 ? <StatusBadge value="Đã ngừng"/> : <StatusBadge value="Đang dùng"/> },
        { key: "actions", header: "Thao tác", render: (m) => <div className="row-actions">
          <PermissionGuard allow={canEdit}><button type="button" className="export-mini" disabled={!canEdit} title={canEdit ? "Sửa vật tư" : "Thiếu quyền Sửa"} onClick={() => open("materialMaster", m)}>Sửa</button></PermissionGuard>
          <button type="button" className="export-mini" disabled={!canMerge} title={canMerge ? "Hợp nhất mã trùng" : "Thiếu quyền Hợp nhất"} onClick={() => open("materialMerge", m)}>Hợp nhất</button>
          <button type="button" className="export-mini" disabled={!canRetire} title={canRetire ? "Ngừng dùng vật tư" : "Chỉ Quản trị hệ thống được ngừng vật tư"} onClick={() => open("materialMaster", { ...m, active: 0 })}>Ngừng</button>
        </div> },
      ]}
    />
    <div className="material-list-note">
      <span>{rows.length}/{materials.length} vật tư</span>
      <span>{canEdit ? "Bạn có quyền Sửa/Hợp nhất" : "Bạn chỉ có quyền xem — các nút đã bị vô hiệu hoá"}</span>
    </div>
  </section>;
}

export {
  MaterialListTable,
};