"use client";

// PHASE 1 (U-04) — PERMISSION GUARD
//
// ⚠️ NGUYÊN TẮC BẮT BUỘC (theo yêu cầu §6): component này CHỈ ẩn/hiện giao diện.
//    Nó KHÔNG phải là lớp bảo vệ. Backend PHẢI kiểm quyền độc lập — và từ PHASE 0B,
//    SystemController đã gọi `requireActionModule` cho mọi action.
//    Ẩn nút ở đây chỉ để giao diện không mời người dùng bấm vào việc họ không được làm.
//
// Cách dùng:
//   <PermissionGuard allow={permission.canCreate}><button>＋ Thêm</button></PermissionGuard>
//   <PermissionGuard allow={canApprove} fallback={<span>Bạn không có quyền duyệt</span>}>…</PermissionGuard>
//   <PermissionGuard any={[canCreate, canEdit]}>…</PermissionGuard>
//   <PermissionGuard all={[canEdit, canApprove]}>…</PermissionGuard>

import type { ReactNode } from "react";

export function PermissionGuard({ allow, any, all, fallback = null, children }: {
  /** Điều kiện đơn. */
  allow?: unknown;
  /** Đúng nếu CÓ ÍT NHẤT MỘT điều kiện đúng. */
  any?: unknown[];
  /** Đúng nếu TẤT CẢ điều kiện đúng. */
  all?: unknown[];
  /** Hiển thị khi KHÔNG đủ điều kiện. Mặc định không hiển thị gì. */
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const truthy = (v: unknown) => v === true || v === 1 || v === "1" || v === "true";

  let ok = true;
  if (allow !== undefined) ok = truthy(allow);
  if (ok && any && any.length) ok = any.some(truthy);
  if (ok && all && all.length) ok = all.every(truthy);

  return <>{ok ? children : fallback}</>;
}

/** Hàm thuần để tính quyền ở ngoài JSX (dùng trong useMemo, điều kiện if…). */
export function hasPermission(conditions: { allow?: unknown; any?: unknown[]; all?: unknown[] }): boolean {
  const truthy = (v: unknown) => v === true || v === 1 || v === "1" || v === "true";
  if (conditions.allow !== undefined && !truthy(conditions.allow)) return false;
  if (conditions.any && conditions.any.length && !conditions.any.some(truthy)) return false;
  if (conditions.all && conditions.all.length && !conditions.all.every(truthy)) return false;
  return true;
}

export default PermissionGuard;
