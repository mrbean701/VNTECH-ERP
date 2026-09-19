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

import type { AppData, ModuleKey, Row } from "@/lib/ui-shared";
function isAdminUser(user: Row) { return user.role === "admin" || roleBase(user) === "admin"; }

function modulePermission(data: AppData, key: ModuleKey) {
  if (isAdminUser(data.user)) return { canView: true, canUse: true, canCreate: true, canEdit: true, canApprove: true, canExport: true };
  const row = data.modulePermissions.find((item) => item.moduleKey === key);
  return { canView: Boolean(row?.canView), canUse: Boolean(row?.canUse), canCreate: Boolean(row?.canCreate), canEdit: Boolean(row?.canEdit), canApprove: Boolean(row?.canApprove), canExport: Boolean(row?.canExport), permissionSource: row?.permissionSource || "none", permissionExpiresAt: row?.permissionExpiresAt || null };
}

function roleBase(user: Row) { return String(user.roleBase || user.role || ""); }
export {
  isAdminUser,
  modulePermission,
  roleBase,
};