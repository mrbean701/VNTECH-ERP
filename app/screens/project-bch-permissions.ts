// PHASE 4 (`PR-06`) — CỔNG QUYỀN CỦA BAN CHỈ HUY (BCH) — MỘT NGUỒN SỰ THẬT, CÓ HỢP ĐỒNG RIÊNG.
//
// Nguồn yêu cầu: `docs/25_TODO_ROADMAP.md` PHASE 4 dòng `PR-06` — nguyên văn:
//   "BCH: thêm/sửa/xoá theo quyền + link entity mở modal".
//
// ⚠️ QUYỀN KHÔNG ĐƯỢC TỰ NGHĨ RA. Hàm dưới đây chỉ ĐỌC ĐÚNG 6 capability mà hệ thống đang dùng
// (`lib/permissions.ts` — `modulePermission(data, key)` trả `canView/canUse/canCreate/canEdit/
// canApprove/canExport`), đúng cơ chế đã có ở mọi màn khác; `isAdminUser` (cùng tệp) là ngoại lệ
// toàn quyền đã tồn tại từ trước. KHÔNG thêm khái niệm quyền mới.
//
// Ánh xạ thao tác → capability (khớp action THẬT trong `scripts/system-route.mjs`):
//   • thêm BCH (đơn vị)   `save_organization_unit`        → canCreate
//   • sửa BCH (đơn vị)    `save_organization_unit`        → canEdit
//   • ngừng/xoá BCH       `set_organization_unit_status`  → canEdit
//   • thêm/sửa/xoá THÀNH VIÊN `set_organization_unit_member` → canEdit
//     (server chốt `set_organization_unit_member: "canEdit"` — `scripts/system-route.mjs:35`)
//
// Thân hàm viết bằng JS THUẦN (kiểu TypeScript chỉ ở chữ ký) để cổng `tests/pr06-bch-crud.test.mjs`
// trích nguyên văn rồi CHẠY với ≥2 người dùng giả lập (admin · người thiếu quyền).

import type { Row } from "@/lib/ui-shared";

export type BchGates = {
  isAdmin: boolean;
  canView: boolean;
  canUse: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canAddUnit: boolean;
  canEditUnit: boolean;
  canStopUnit: boolean;
  canAddMember: boolean;
  canMoveMember: boolean;
  canRemoveMember: boolean;
};

/** Cổng quyền BCH cho MỘT người dùng: `isAdmin` + hàng capability của module `site_command`. */
export function bchGates(isAdmin: boolean, permission: Row): BchGates {
  const caps = permission || {};
  const canView = isAdmin || Boolean(caps.canView);
  const canUse = isAdmin || Boolean(caps.canUse);
  const canCreate = isAdmin || Boolean(caps.canCreate);
  const canEdit = isAdmin || Boolean(caps.canEdit);
  return {
    isAdmin: Boolean(isAdmin),
    canView: canView,
    canUse: canUse,
    canCreate: canCreate,
    canEdit: canEdit,
    canAddUnit: canCreate,
    canEditUnit: canEdit,
    canStopUnit: canEdit,
    canAddMember: canEdit,
    canMoveMember: canEdit,
    canRemoveMember: canEdit,
  };
}
