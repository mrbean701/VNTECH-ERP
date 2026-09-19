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

import { configuredMenuGroups, modules } from "@/lib/menu-helpers";
import type { AppData, Row } from "@/lib/ui-shared";
function workflowApproverCandidates(data: AppData, moduleKey: string): Row[] {
  return (data.users || [])
    .filter((u) => Number(u.active ?? 1) === 1)
    .map((u): Row => {
      const perm = (data.allModulePermissions || []).find(
        (p) => String(p.userId) === String(u.id) && String(p.moduleKey) === moduleKey);
      const isAdmin = String(u.role) === "admin";
      return { ...u, hasApprovePermission: isAdmin || Number(perm?.canApprove) === 1 };
    })
    .sort((a, b) => Number(b.hasApprovePermission) - Number(a.hasApprovePermission)
      || String(a.fullName || "").localeCompare(String(b.fullName || ""), "vi"));
}

// ---------------------------------------------------------------------------
// ĐỢT P5 — PHÂN QUYỀN PHÒNG BAN · PHÂN QUYỀN NGƯỜI DÙNG · CẤP BẬC HỆ THỐNG
// ---------------------------------------------------------------------------
// =============================================================================
// MỤC 7/8 — DANH SÁCH NHÂN SỰ FULL MÀN
// Yêu cầu: «danh sách nhân sự đang không hiển thị đúng danh sách mà bị chia đôi màn
// hình ra rồi, tôi muốn nó phải hiển thị dạng danh sách full màn và có các chức năng
// crud search sort fillter».
// → Bảng toàn màn hình + tìm kiếm + lọc (phòng ban / chức danh / trạng thái) +
//   sắp xếp + phân trang + nút CRUD (Hồ sơ / Sửa / Quyền) dùng chung modal với admin.
// =============================================================================

function configuredModules(data: AppData, includeHidden = false) {
  const catalog = data.moduleCatalog || [];
  const groups = configuredMenuGroups(data, true);
  return modules.map((item) => {
    const config = catalog.find((row) => row.moduleKey === item.key);
    let groupKey = item.key==="material_catalog" ? "material_master" : String(config?.groupKey ?? item.groupKey ?? "").trim() || null;
    if (groupKey === "project_management") groupKey = "site_command";
    let group = groups.find((row) => String(row.groupKey) === groupKey);
    if (!group && config?.groupName) {
      const normalizedName = String(config.groupName).trim().toLocaleLowerCase("vi");
      group = groups.find((row) => String(row.name || "").trim().toLocaleLowerCase("vi") === normalizedName);
      if (group) groupKey = String(group.groupKey);
    }
    return { ...item, label: item.key==="material_catalog" ? "Danh mục vật tư gốc" : item.key==="central_warehouse" ? "Kho Tổng" : (config?.label || item.label), icon: config?.icon || item.icon, groupKey, group: group?.name || config?.groupName || null, active: config ? Boolean(config.active) : true, sortOrder: Number(config?.sortOrder ?? modules.indexOf(item) * 10) };
  }).filter((item) => includeHidden || item.active).sort((a, b) => a.sortOrder - b.sortOrder);
}
export {
  configuredModules,
  workflowApproverCandidates,
};