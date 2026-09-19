// PHASE 7 (AD-*) — LÕI THUẦN CỦA MÀN QUẢN TRỊ HỆ THỐNG.
//
// Vì sao tách ra tệp riêng: `app/page.tsx` là tệp khổng lồ, mỗi màn gần như nằm trên MỘT dòng nên
// không thể kiểm thử hành vi bằng cách đọc chuỗi. Mọi quy tắc ĐO ĐƯỢC của PHASE 7 (sắp xếp mặc định,
// chọn nhiều + xoá, cột tài khoản, cột audit log, trường tự phục vụ) nằm ở đây dưới dạng hàm THUẦN,
// được `tests/adNN-*.test.mjs` trích khối `AD-PURE-BEGIN/END`, dịch TS→JS bằng esbuild và CHẠY THẬT.
//
// NGUỒN SỰ THẬT của từng trường (không suy đoán): xem chú thích `source` ngay tại khai báo.
//   • `users`            — MySQL, xác minh bằng information_schema (xem TASK-102 §bằng chứng).
//   • bootstrap payload  — `scripts/system-route.mjs:746` (JS) và
//                          `BootstrapDataAdapter.java:1180` (Java) — hai đường ĐỌC.
//   • `audit_logs`       — 17 cột thật; JS ghi 9 cột (`system-route.mjs:179/2599`),
//                          Java ghi 16 cột (`AuditLogAdapter.java:46/:63`).

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

// AD-PURE-BEGIN
// ── AD-01 — NHÃN 12 BƯỚC CỦA MÀN QUẢN TRỊ ───────────────────────────────────────────────────────
// Nguyên văn roadmap `AD-01`: «Đổi tên **Nhân sự → Tài khoản**». Bước 1 nay là «Tài khoản».
// Không đổi khoá module (`admin` vẫn là khoá ĐÃ CÓ), không thêm tab mới ⇒ không cần migration.
export const ADMIN_STEP_LABELS = [
  "Tài khoản",
  "Tổ chức",
  "Chức danh / vai trò",
  "Nhóm quyền nghiệp vụ",
  "Phân quyền phòng ban",
  "Phân quyền người dùng",
  "Cấp bậc hệ thống",
  "Phạm vi dự án & kho",
  "Workflow phê duyệt",
  "Ngoại lệ cá nhân",
  "Audit log",
  "Cấu hình hệ thống",
];

/** Lý do «chưa có nguồn» — KHÔNG bịa số, KHÔNG hiện 0 giả. */
export const ACCOUNT_UNSOURCED_REASON = {
  lastLoginAt:
    "Bảng `users` KHÔNG có cột đăng nhập cuối; bootstrap chỉ trả `activeSessions` (phiên CÒN hiệu lực) với `createdAt`/`expiresAt` (`BootstrapDataAdapter.java` khối activeSessions) — đó là phiên hiện tại, không phải lần đăng nhập cuối.",
  createdAt:
    "Bảng `users` CÓ cột `created_at` nhưng CẢ HAI đường bootstrap đều không trả cột này (`scripts/system-route.mjs:746` và `BootstrapDataAdapter.java:1180`) ⇒ UI không có nguồn. Thêm vào payload phải sửa `scripts/**`/`java-backend/**` — BỊ CẤM trong nhánh này.",
};

// ── AD-02 — 13 CỘT TÀI KHOẢN (nguyên văn thứ tự yêu cầu) ───────────────────────────────────────
// `source: null` = KHÔNG có nguồn dữ liệu ⇒ UI hiện «chưa có nguồn» + lý do, không hiện 0 giả.
export const ACCOUNT_COLUMNS = [
  { key: "employeeCode", label: "Mã", source: "users.employee_code" },
  { key: "username", label: "Tên đăng nhập", source: "users.username" },
  { key: "fullName", label: "Họ tên", source: "users.full_name" },
  { key: "email", label: "Email", source: "users.email" },
  { key: "organizationName", label: "Phòng", source: "organization_units.name (qua users.organization_unit_id)" },
  { key: "roleName", label: "Chức danh", source: "role_catalog.name (qua users.role)" },
  { key: "systemLevelName", label: "Cấp", source: "system_level_catalog.name (qua users.system_level_code)" },
  { key: "approvalLimit", label: "Hạn mức", source: "users.approval_limit" },
  { key: "statusLabel", label: "Trạng thái", source: "users.active" },
  { key: "permissionCount", label: "Số quyền", source: "user_module_permissions (đếm dòng có ≥1 capability)" },
  { key: "roleBase", label: "Vai trò", source: "role_catalog.base_role (System Role dùng để kiểm quyền)" },
  { key: "lastLoginAt", label: "Đăng nhập cuối", source: null },
  { key: "createdAt", label: "Ngày tạo", source: null },
];

/** Nhãn hiển thị khi trường không có nguồn — chuỗi DÙNG CHUNG cho mọi màn (không tự chế mỗi nơi một kiểu). */
export const UNSOURCED_TEXT = "«chưa có nguồn»";

/** 6 capability thật của `user_module_permissions` (`lib/ui-shared.tsx` khai `PERM_CAPS`). */
export const ACCOUNT_CAPS = ["canView", "canUse", "canCreate", "canEdit", "canApprove", "canExport"];

/** Số quyền = số dòng `user_module_permissions` của user có ÍT NHẤT 1 capability = 1. */
export function permissionCountOf(permissions: Row[], userId: unknown): number {
  const id = String(userId ?? "");
  return (permissions || []).filter((p) => String(p?.userId ?? "") === id && ACCOUNT_CAPS.some((cap) => Number(p?.[cap]) === 1)).length;
}

/** Tên cấp bậc từ `system_level_catalog` — thiếu thì trả chuỗi rỗng (UI tự quyết cách hiện). */
export function levelNameOf(levels: Row[], code: unknown): string {
  const key = String(code ?? "");
  if (!key) return "";
  return String((levels || []).find((l) => String(l?.code ?? "") === key)?.name ?? "");
}

/** Tài khoản đang hoạt động? `active` là tinyint 1/0, boolean, hoặc chuỗi "1" (lớp lỗi TASK-052). */
export function accountIsActive(row: Row): boolean {
  const value = row?.active;
  if (value === undefined || value === null || value === "") return true; // DEFAULT 1 của `users.active`
  return value === true || value === 1 || value === "1";
}

// ── AD-04 — SẮP XẾP MẶC ĐỊNH: TRẠNG THÁI → MÃ TÀI KHOẢN ─────────────────────────────────────────
// Nguyên văn roadmap `AD-04`: «Sắp xếp mặc định: Trạng thái → Mã tài khoản».
// Khoá 1 = TRẠNG THÁI (đang hoạt động trước, đã khoá sau); khoá 2 = MÃ tài khoản tăng dần.
export function accountStatusRank(row: Row): number {
  return accountIsActive(row) ? 0 : 1;
}

export function accountSortCompare(a: Row, b: Row): number {
  const rank = accountStatusRank(a) - accountStatusRank(b);
  if (rank !== 0) return rank;
  return String(a?.employeeCode ?? "").localeCompare(String(b?.employeeCode ?? ""), "vi", { numeric: true });
}

export const ACCOUNT_DEFAULT_SORT = "status";

export const ACCOUNT_SORT_NOTE = "Mặc định: Trạng thái (đang hoạt động trước) → Mã tài khoản tăng dần (AD-04)";

/** Suy 13 trường của mỗi tài khoản từ payload bootstrap — KHÔNG bịa, thiếu nguồn thì để `null`. */
export function accountRows(users: Row[], permissions: Row[], levels: Row[]): Row[] {
  return (users || []).map((user) => ({
    ...user,
    statusLabel: accountIsActive(user) ? "Đang hoạt động" : "Đã khoá",
    systemLevelName: levelNameOf(levels, user?.systemLevelCode),
    roleBase: String(user?.roleBase ?? user?.role ?? ""),
    permissionCount: permissionCountOf(permissions, user?.id),
    // Hai trường dưới đây KHÔNG có nguồn trong payload ⇒ giữ `null` để UI hiện «chưa có nguồn».
    lastLoginAt: user?.lastLoginAt ?? null,
    createdAt: user?.createdAt ?? null,
  }));
}

// ── AD-05 — 2 SUB-TAB CỦA BƯỚC «TỔ CHỨC» ───────────────────────────────────────────────────────
// Nguyên văn roadmap `AD-05`: «Tách sub-tab: **Cơ cấu tổ chức** ‖ **Tổ đội theo dự án**».
export const ORG_SUB_TABS = ["Cơ cấu tổ chức", "Tổ đội theo dự án"];

// ── AD-06 — 2 SUB-TAB «CHỨC DANH» và «VAI TRÒ» ─────────────────────────────────────────────────
// Position (chức danh) = `role_catalog` (mã + tên hiển thị + nhóm quyền nghiệp vụ + đơn vị mặc định).
// System Role         = `role_catalog.base_role` = mã kỹ thuật mà `RbacService`/`ActionRbacRegistry`
//                       dùng để kiểm quyền (admin/engineer/warehouse/procurement/accountant/director/team/commander).
export const POSITION_SUB_TABS = [
  { key: "position", label: "Chức danh (Position)", source: "role_catalog.code/name/active/business_group_id" },
  { key: "systemRole", label: "Vai trò hệ thống (System Role)", source: "role_catalog.base_role + engine_role_profiles" },
];

// ── AD-08 — LỌC PHÒNG BAN + CHỌN NHIỀU + XOÁ MỤC ĐÃ CHỌN ───────────────────────────────────────
/** Lọc danh mục phòng ban theo mã/tên (bộ lọc phòng ban của tab «Phân quyền phòng ban»). */
export function filterDepartments(units: Row[], query: string): Row[] {
  const needle = String(query ?? "").trim().toLocaleLowerCase("vi");
  return (units || []).filter((unit) => {
    if (!needle) return true;
    const hay = `${unit?.code ?? ""} ${unit?.name ?? ""}`.toLocaleLowerCase("vi");
    return hay.includes(needle);
  });
}

/** Bật/tắt một mục trong tập đã chọn (trả MẢNG MỚI — không sửa state tại chỗ). */
export function toggleSelection(selected: string[], id: unknown, on?: boolean): string[] {
  const key = String(id ?? "");
  if (!key) return [...selected];
  const has = selected.includes(key);
  const next = on === undefined ? !has : Boolean(on);
  if (next && !has) return [...selected, key];
  if (!next && has) return selected.filter((item) => item !== key);
  return [...selected];
}

/** Chọn/bỏ chọn TOÀN BỘ dòng đang hiển thị (chọn nhiều theo bộ lọc hiện hành). */
export function toggleAllSelection(selected: string[], visibleIds: unknown[], on: boolean): string[] {
  const visible = (visibleIds || []).map((id) => String(id ?? ""));
  return on ? [...new Set([...selected, ...visible])] : selected.filter((id) => !visible.includes(id));
}

/** Tổng số dòng quyền phòng ban sẽ bị xoá theo tập đã chọn (dùng cho nhãn nút + xác nhận). */
export function selectedPermissionRows(rows: Row[], selected: string[]): Row[] {
  const keys = new Set((selected || []).map((s) => String(s)));
  return (rows || []).filter((row) => keys.has(String(row?.id ?? "")));
}

/**
 * CỔNG QUYỀN của «Xoá mục đã chọn»: chỉ tài khoản QUẢN TRỊ mới được xoá quyền phòng ban.
 * Bằng chứng backend: `SystemController.java:395` (`delete_department_permission`) và
 * `ActionRbacRegistry.java:123` (module list RỖNG = admin) + dòng 312 (`canUse`).
 * KHÔNG nới quyền ở UI: hàm này chỉ ẩn/nút, backend vẫn kiểm.
 */
export function canBulkDeleteDepartmentPermissions(user: Row): boolean {
  return String(user?.role ?? "") === "admin";
}

/** Thao tác xoá chỉ khả thi khi CÓ quyền VÀ có ít nhất 1 mục được chọn. */
export function bulkDeleteDepartmentPermissionsEnabled(user: Row, selected: string[]): boolean {
  return canBulkDeleteDepartmentPermissions(user) && (selected || []).length > 0;
}

// ── AD-13 / AD-14 — CỘT NHẬT KÝ KIỂM TOÁN ───────────────────────────────────────────────────────
// AD-13: tách riêng **User** (tài khoản bản ghi thuộc về) và **Actor/Performed By** (người thực hiện).
// Bằng chứng: `audit_logs.user_id` (chủ thể) và `audit_logs.user_name` (tên người thực hiện ĐÓNG BĂNG
// tại thời điểm ghi — `AuditLogAdapter.java:63`), bootstrap trả `COALESCE(al.user_name,u.full_name)`.
export const AUDIT_USER_COLUMN_SOURCE = "audit_logs.user_id → users.full_name (LEFT JOIN trong BootstrapDataAdapter.java)";
export const AUDIT_ACTOR_COLUMN_SOURCE = "audit_logs.user_name (tên người thực hiện đóng băng lúc ghi; NULL thì COALESCE sang users.full_name)";

/** «User» = tài khoản bản ghi thuộc về; «Actor» = người thực hiện thật. */
export function auditActorOf(row: Row): { actorName: string; actorId: string } {
  return { actorName: String(row?.userName ?? "").trim(), actorId: String(row?.userId ?? "").trim() };
}

export function auditUserOf(row: Row, users: Row[]): { userName: string; userId: string; hasOwnRecord: boolean } {
  const userId = String(row?.userId ?? "").trim();
  const found = (users || []).find((u) => String(u?.id ?? "") === userId);
  return { userName: String(found?.fullName ?? ""), userId, hasOwnRecord: Boolean(found) };
}

// AD-14: 8 trường nguyên văn yêu cầu «hành động · module · thực thể · mã thực thể · thời gian · IP ·
// kết quả · metadata» đối chiếu với 17 CỘT THẬT của `audit_logs` (information_schema, DB `vntech_erp`).
// `source: null` = KHÔNG có cột ⇒ muốn đủ phải MIGRATION (BỊ CẤM) ⇒ mục này **BLOCKED**.
export const AUDIT_FIELDS = [
  { key: "action", label: "Hành động", source: "audit_logs.action", available: true },
  { key: "moduleKey", label: "Module", source: "audit_logs.module_key", available: true },
  { key: "entityType", label: "Thực thể", source: "audit_logs.entity_type", available: true },
  { key: "entityId", label: "Mã thực thể", source: "audit_logs.entity_id", available: true },
  { key: "occurredAt", label: "Thời gian", source: "audit_logs.occurred_at", available: true },
  { key: "ipAddress", label: "IP", source: "audit_logs.ip_address", available: true },
  { key: "result", label: "Kết quả", source: null, available: false },
  { key: "metadata", label: "Metadata", source: null, available: false },
];

export function auditAvailableFields(): Row[] {
  return AUDIT_FIELDS.filter((field) => field.available);
}

export function auditBlockedFields(): Row[] {
  return AUDIT_FIELDS.filter((field) => !field.available);
}

/** Bảng `audit_logs` KHÔNG có cột `result`/`metadata` ⇒ chỉ có 6/8 trường có nguồn. */
export function auditHasResultAndMetadata(): boolean {
  return AUDIT_FIELDS.every((field) => field.available);
}

// ── AD-16 — TRƯỜNG NGƯỜI DÙNG ĐƯỢC PHÉP TỰ SỬA ────────────────────────────────────────────────
// Nguyên văn roadmap `AD-16`: «Cho user sửa thông tin được phép (tên hiển thị · ảnh · liên hệ · mật khẩu)».
// `action: null` = KHÔNG có action tự phục vụ nào ở cả 2 đường (`scripts/system-route.mjs` chỉ có
// `change_password` :3227 + `update_profile_avatar` :3243; Java `SystemController.java` chỉ có 2 case
// tương ứng :236/:253) ⇒ tên hiển thị + liên hệ PHẢI thêm action mới = sửa `scripts/**`/Java = BỊ CẤM.
export const SELF_EDIT_FIELDS = [
  { key: "fullName", label: "Tên hiển thị", source: "users.full_name", action: null, editable: false },
  { key: "avatarUrl", label: "Ảnh đại diện", source: "users.avatar_url", action: "update_profile_avatar", editable: true },
  { key: "email", label: "Liên hệ (email)", source: "users.email", action: null, editable: false },
  { key: "password", label: "Mật khẩu", source: "users.password_hash", action: "change_password", editable: true },
];

export function selfEditableFields(): Row[] {
  return SELF_EDIT_FIELDS.filter((field) => field.editable);
}

export function selfBlockedFields(): Row[] {
  return SELF_EDIT_FIELDS.filter((field) => !field.editable);
}

export function selfEditIsComplete(): boolean {
  return SELF_EDIT_FIELDS.every((field) => field.editable);
}
// AD-PURE-END
