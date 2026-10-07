// PHASE 1 (U-11) — MODULE DÙNG CHUNG tách khỏi `app/page.tsx`.
//
// ⭐ TASK-227 (06/10/2026) — YÊU CẦU USER: «Thêm 1 tab là Danh mục hệ vật tư, trong tab này sẽ hiển
//   thị ra danh sách hệ vật tư và nhóm nút CRUD · SEARCH · SORT · FILTER».
//   · Nguồn dữ liệu: `data.adminMaterialCategories || data.materialCategories` (đo thật trong
//     `scripts/system-route.mjs:674` + `:784` → cột đọc được: `id · code · name · description ·
//     sortOrder · active`). ⛔ KHÔNG bịa trường nào không có trong payload.
//   · API (đo thật `scripts/system-route.mjs:2693/2718/2725`):
//       · `save_material_category`        { code*, name*, description?, sortOrder?, categoryId? }  → admin
//       · `set_material_category_status`  { categoryId, active }                                  → admin
//       · `delete_material_category`      { categoryId }                                           → admin
//     ⛔ Lưu ý NGHIỆP VỤ: server **CHẶN XÓA** khi hệ còn vật tư (`system-route.mjs:2728-2730`) ⇒
//     UI phải nói rõ điều này, không hứa xóa được.
//   · Modal biểu mẫu: `CategoryModal` (đã có sẵn ở `app/page.tsx`, `modal === "categoryMaster"`).
import { DataTable, PermissionGuard, StatusBadge } from "@/app/components/ui";
import { isAdminUser } from "@/lib/permissions";
import { CardHead } from "@/lib/ui-shared";
import type { AppData, Row } from "@/lib/ui-shared";
import { downloadCsv } from "@/lib/tabular-export";
import { useState } from "react";

function MaterialCategoryList({ data, open, action, permission }: {
  data: AppData;
  open: (name: string, row?: Row) => void;
  action: (name: string, payload: Row) => Promise<boolean>;
  permission: Row;
}) {
  const categories: Row[] = data.adminMaterialCategories || data.materialCategories || [];
  const subcategories: Row[] = data.adminMaterialSubcategories || data.materialSubcategories || [];

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ALL");
  const [sortBy, setSortBy] = useState("sortOrder");

  const canEdit = Boolean(permission?.canEdit);
  const isAdmin = isAdminUser(data.user);

  // Số vật tư / nhóm con MỖI hệ — chỉ để cột «Phạm vi sử dụng», ⛔ không điều khiển hiển thị khác.
  const materialCount = (id: unknown) =>
    (data.adminMaterials || data.materials || []).filter((m) => String(m.categoryId) === String(id)).length;
  const subgroupCount = (id: unknown) => subcategories.filter((s) => String(s.categoryId) === String(id)).length;

  const rows = categories
    .filter((c) => status === "ALL" || (status === "ACTIVE" ? Number(c.active) !== 0 : Number(c.active) === 0))
    .filter((c) => {
      if (!q.trim()) return true;
      const hay = `${c.code} ${c.name} ${c.description}`.toLocaleLowerCase("vi");
      return hay.includes(q.trim().toLocaleLowerCase("vi"));
    })
    .sort((a, b) => {
      if (sortBy === "name") return String(a.name || "").localeCompare(String(b.name || ""), "vi");
      if (sortBy === "code") return String(a.code || "").localeCompare(String(b.code || ""));
      if (sortBy === "usage") return materialCount(a.id) - materialCount(b.id);
      return Number(a.sortOrder || 0) - Number(b.sortOrder || 0);
    });

  return <section className="card material-list-card" data-vntech="material-category-list">
    <CardHead title="Danh mục hệ vật tư"
      note="Hệ vật tư là mục cha lớn (HVAC, Điện, PCCC…). Mỗi hệ có thể chứa nhiều nhóm vật tư." />
    <div className="material-list-filters">
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm mã hệ, tên hệ, mô tả…" aria-label="Tìm hệ vật tư" />
      <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Lọc trạng thái hệ vật tư">
        <option value="ALL">Tất cả trạng thái</option>
        <option value="ACTIVE">Đang dùng</option>
        <option value="HIDDEN">Đã ẩn</option>
      </select>
      <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sắp xếp hệ vật tư">
        <option value="sortOrder">Sắp xếp: Thứ tự hiển thị</option>
        <option value="code">Sắp xếp: Mã hệ</option>
        <option value="name">Sắp xếp: Tên hệ</option>
        <option value="usage">Sắp xếp: Số vật tư</option>
      </select>
      <PermissionGuard allow={canEdit}>
        <button type="button" className="primary" disabled={!canEdit}
          title={canEdit ? "Thêm hệ vật tư" : "Bạn không có quyền tạo hệ vật tư"}
          onClick={() => open("categoryMaster")}>＋ Thêm hệ vật tư</button>
      </PermissionGuard>
      <button type="button" className="secondary" data-vntech="material-category-export-csv"
        title="Xuất danh sách hệ vật tư đang hiển thị ra CSV (UTF-8, có BOM)"
        onClick={() => downloadCsv(
          ["Mã hệ", "Tên hệ vật tư", "Mô tả", "Thứ tự", "Số nhóm", "Số vật tư", "Trạng thái"],
          rows.map((c) => [
            String(c.code ?? ""),
            String(c.name ?? ""),
            String(c.description ?? ""),
            String(c.sortOrder ?? 0),
            String(subgroupCount(c.id)),
            String(materialCount(c.id)),
            Number(c.active) === 0 ? "Đã ẩn" : "Đang dùng",
          ]),
          "danh-muc-he-vat-tu",
        )}>⤓ Xuất CSV</button>
    </div>
    <DataTable
      rows={rows}
      rowKey={(c) => String(c.id)}
      tableClassName="material-list-table"
      emptyText="Không có hệ vật tư phù hợp bộ lọc."
      columns={[
        { key: "code", header: "Mã hệ", render: (c) => <strong className="code">{c.code || "—"}</strong> },
        { key: "name", header: "Tên hệ vật tư", render: (c) => <strong>{c.name}</strong> },
        { key: "description", header: "Mô tả", render: (c) => <>{c.description || "—"}</> },
        { key: "sortOrder", header: "Thứ tự", render: (c) => <>{c.sortOrder ?? 0}</> },
        { key: "subgroups", header: "Số nhóm", render: (c) => <>{subgroupCount(c.id)}</> },
        { key: "materials", header: "Số vật tư", render: (c) => <>{materialCount(c.id)}</> },
        { key: "active", header: "Trạng thái", render: (c) => Number(c.active) === 0 ? <StatusBadge value="Đã ẩn"/> : <StatusBadge value="Đang dùng"/> },
        { key: "actions", header: "Thao tác", render: (c) => <div className="row-actions">
          <PermissionGuard allow={canEdit}>
            <button type="button" className="export-mini" disabled={!canEdit}
              title={canEdit ? "Sửa hệ vật tư" : "Thiếu quyền Sửa"}
              onClick={() => open("categoryMaster", c)}>Sửa</button>
          </PermissionGuard>
          <button type="button" className="export-mini"
            disabled={!isAdmin}
            title={isAdmin ? (Number(c.active) === 0 ? "Hiện lại hệ" : "Ẩn hệ khỏi danh sách chọn") : "Chỉ Quản trị hệ thống được ẩn/hiện hệ"}
            onClick={() => action("set_material_category_status", { categoryId: c.id, active: Number(c.active) === 0 ? 1 : 0 })}>
            {Number(c.active) === 0 ? "Hiện" : "Ẩn"}
          </button>
          <PermissionGuard allow={isAdmin}>
            <button type="button" className="export-mini danger" disabled={!isAdmin || materialCount(c.id) > 0}
              title={materialCount(c.id) > 0
                ? "Hệ đang có vật tư — hãy chuyển vật tư sang hệ khác hoặc Ẩn hệ để giữ lịch sử"
                : "Xóa hệ và các nhóm con trống"}
              onClick={() => {
                if (!window.confirm(`Xóa hệ vật tư ${c.name}? Các nhóm con trong hệ cũng bị xóa.`)) return;
                void action("delete_material_category", { categoryId: c.id });
              }}>Xóa</button>
          </PermissionGuard>
        </div> },
      ]}
    />
    <div className="material-list-note">
      <span>{rows.length}/{categories.length} hệ vật tư</span>
      <span>{canEdit ? "Bạn có quyền Sửa" : "Bạn chỉ có quyền xem — các nút đã bị vô hiệu hoá"}</span>
    </div>
  </section>;
}

export {
  MaterialCategoryList,
};