// USER 29/09/2026 (MỐC 54) — DẢI 2 THẺ CHUNG cho hộp thoại «Sửa tài khoản» / «Phân quyền».
//
// ⛔ YÊU CẦU USER:
//   «Trong modal sửa tài khoản tạo 2 tab. 1 là “Sửa tài khoản” 2 là “Phân quyền công việc / Chức năng».
//    Check perm cả 2 tab: nếu user có perm sửa tài khoản nhưng không có perm sửa phân quyền thì KHÔNG
//    click được tab 2. Nếu user CHỈ có perm phân quyền thì khi click nút sửa tài khoản ở tab Tài
//    khoản sẽ mở modal “Phân quyền công việc / Chức năng”, chứ không click được vào sửa tài khoản.»
//
// ⇒ Dải thẻ dùng chung cho HAI hộp thoại `UserEditModal` (modal="userEdit") và
//   `UserAccessModal` (modal="access") ⇒ trông như MỘT hộp thoại có 2 thẻ.

import type { AppData, Row } from "@/lib/ui-shared";

/** Khoá quyền: sửa TÀI KHOẢN = tab 01 · sửa PHÂN QUYỀN = tab 06. */
export const USER_TAB_01 = "admin_tab_01";
export const USER_TAB_06 = "admin_tab_06";

export function hasAdminTab(data: AppData, moduleKey: string): boolean {
  const me = String((data.user as Row | undefined)?.id ?? "");
  if (!me) return false;
  return (data.allModulePermissions || []).some(
    (p: Row) => String(p.userId) === me && String(p.moduleKey) === moduleKey && Number(p.canView) === 1,
  );
}

/** Chế độ mở: "account" (thẻ 1) · "access" (thẻ 2). */
export type UserAdminTab = "account" | "access";

export function AdminUserModalTabs({ data, active, onChange }: {
  data: AppData;
  active: UserAdminTab;
  onChange: (tab: UserAdminTab) => void;
}) {
  const isAdmin = Boolean((data.user as Row | undefined)?.role === "admin");
  const canAccount = isAdmin || hasAdminTab(data, USER_TAB_01);
  const canAccess = isAdmin || hasAdminTab(data, USER_TAB_06);

  return (
    // MỐC 115 — thêm `user-admin-tabs`: dải thẻ NÀY nằm trong modal nên không thuộc scope
    // `.project-management`/`.work-center`/`.team-management` của `project-scope-tabs`, chỉ nhận
    // rule chung `[role="tablist"]` (`flex: 0 0 auto`) ⇒ 2 thẻ co theo độ dài chữ, lệch nhau rõ.
    <div className="project-scope-tabs user-admin-tabs" role="tablist" aria-label="user-admin-tabs" data-vntech="user-admin-tabs">
      <button
        type="button"
        role="tab"
        aria-selected={active === "account"}
        className={active === "account" ? "active" : ""}
        disabled={!canAccount}
        title={canAccount ? "Sửa thông tin tài khoản" : "⛔ Cần quyền «Quản trị hệ thống › Tab 01. Tài khoản»"}
        onClick={() => canAccount && onChange("account")}
      >Sửa tài khoản</button>
      <button
        type="button"
        role="tab"
        aria-selected={active === "access"}
        className={active === "access" ? "active" : ""}
        disabled={!canAccess}
        title={canAccess ? "Phân quyền công việc / Chức năng" : "⛔ Cần quyền «Quản trị hệ thống › Tab 06. Phân quyền người dùng»"}
        onClick={() => canAccess && onChange("access")}
      >Phân quyền công việc / Chức năng</button>
    </div>
  );
}
