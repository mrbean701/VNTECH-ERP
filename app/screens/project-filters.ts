// PHASE 4 (`PR-02`) — BỘ LỌC 4 CHIỀU CHO DANH SÁCH DỰ ÁN: Trạng thái · Quản lý dự án · Phòng ban · Ngày.
//
// Nguồn yêu cầu: `docs/25_TODO_ROADMAP.md` PHASE 4 dòng `PR-02` — nguyên văn:
//   "Lọc: Trạng thái · Quản lý dự án · Phòng ban · Ngày".
//
// ⚠️ SỰ THẬT ĐÃ ĐO (không đoán) — payload bootstrap THẬT (`GET /api/system`, đo 20/09/2026):
//   `projects` CHỈ trả 8 trường: id, code, name, status, contractNo, contractName, startDate, plannedEndDate.
//   ⇒ KHÔNG có `managerUserId`/`managerName`, KHÔNG có `organizationUnitId` trong payload.
//   (Lược đồ ĐANG CHẠY vẫn có cột `projects.manager_user_id` — `tools/_live-schema.tsv` — nhưng
//    API bootstrap không trả về; `scripts/system-route.mjs:604` / `:748` chỉ SELECT 8 cột đó.
//    `projects` KHÔNG có cột phòng ban nào ⇒ "Phòng ban" không thể đọc thẳng từ dự án.)
//
// VÌ VẬY 2/4 chiều được SUY RA TỪ DỮ LIỆU THẬT ĐANG CÓ, không bịa:
//   • Quản lý dự án  = nhân sự có phạm vi `admin` trên dự án (`user_project_scopes.permission='admin'`)
//                      — đây là nguồn thật duy nhất trong bootstrap nói ai QUẢN LÝ dự án.
//   • Phòng ban      = đơn vị (`users.organization_unit_id` / `organization_code` / `department`)
//                      của các nhân sự THAM GIA dự án (bảng thật `user_project_scopes`).
//   Cả hai đều ghi rõ trên giao diện (toolbar `note`) để người dùng không hiểu nhầm là cột CSDL.
//
// Hàm `projectMatchesFilters` + `projectFilterContext` được viết bằng cú pháp JS thuần trong THÂN hàm
// (kiểu TypeScript chỉ nằm ở chữ ký) ⇒ cổng hợp đồng `tests/pr02-project-filters.test.mjs` TRÍCH
// nguyên văn thân hàm từ tệp này rồi CHẠY THẬT để chứng minh từng chiều lọc có tác dụng.

import type { AppData, Row } from "@/lib/ui-shared";

/** Trạng thái bộ lọc danh sách dự án (PR-02). */
export type ProjectFilterState = {
  /** `status` của dự án — "ALL" = không lọc. */
  status: string;
  /** Người quản lý dự án (userId có phạm vi `admin` trên dự án) — "ALL" = không lọc. */
  managerUserId: string;
  /** Đơn vị/phòng ban của nhân sự tham gia dự án — "ALL" = không lọc. */
  organizationUnitId: string;
  /** Ngày: chỉ lấy dự án có `start_date` >= mốc này (ISO yyyy-mm-dd). */
  startFrom: string;
  /** Ngày: chỉ lấy dự án có `planned_end_date` <= mốc này (ISO yyyy-mm-dd). */
  endTo: string;
};

/** Ngữ cảnh suy ra cho MỘT dự án — dùng bởi `projectMatchesFilters`. */
export type ProjectFilterContext = {
  managerUserId: string;
  organizationUnitKeys: string[];
};

export const PROJECT_FILTER_DEFAULTS: ProjectFilterState = {
  status: "ALL",
  managerUserId: "ALL",
  organizationUnitId: "ALL",
  startFrom: "",
  endTo: "",
};

/**
 * Bộ lọc THẬT của danh sách dự án — 4 chiều: Trạng thái · Quản lý dự án · Phòng ban · Ngày.
 * Trả `false` khi dự án KHÔNG thoả một chiều nào đó.
 */
export function projectMatchesFilters(row: Row, filter: ProjectFilterState, context: ProjectFilterContext): boolean {
  if (filter.status !== "ALL" && String(row.status || "active") !== filter.status) return false;
  if (filter.managerUserId !== "ALL" && String(context.managerUserId || "") !== filter.managerUserId) return false;
  if (filter.organizationUnitId !== "ALL" && context.organizationUnitKeys.indexOf(filter.organizationUnitId) < 0) return false;
  if (filter.startFrom && String(row.startDate || "") < filter.startFrom) return false;
  if (filter.endTo && String(row.plannedEndDate || "") > filter.endTo) return false;
  return true;
}

/**
 * Suy ngữ cảnh lọc cho một dự án từ hai bảng THẬT đang có trong bootstrap:
 * `user_project_scopes` (userId · projectId · permission · leftAt) và danh bạ nhân sự
 * (`staffDirectory`: id · organizationUnitId · organizationCode · department).
 */
export function projectFilterContext(projectId: string, userScopes: Row[], staff: Row[]): ProjectFilterContext {
  const scopes = userScopes.filter((row) => String(row.projectId) === String(projectId) && !row.leftAt);
  const managerUserIds = scopes.filter((row) => String(row.permission) === "admin").map((row) => String(row.userId || ""));
  const scopeMembers = scopes.map((row) => staff.find((user) => String(user.id) === String(row.userId)));
  const unitKeys = scopeMembers
    .map((member) => (member ? [member.organizationUnitId, member.organizationCode, member.department] : []))
    .flat()
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .filter((key, index, all) => all.indexOf(key) === index);
  return { managerUserId: managerUserIds[0] || "", organizationUnitKeys: unitKeys };
}

/** Danh sách dự án đã qua bộ lọc 4 chiều (dùng cho `ListToolbar` + `DataTable`). */
export function filterProjects(rows: Row[], filter: ProjectFilterState, userScopes: Row[], staff: Row[]): Row[] {
  return rows.filter((row) => projectMatchesFilters(row, filter, projectFilterContext(String(row.id), userScopes, staff)));
}

/** Tên người quản lý dự án (suy từ phạm vi `admin`) — "Chưa phân công" khi không có dữ liệu. */
export function projectManagerName(projectId: string, userScopes: Row[], staff: Row[]): string {
  const manager = projectFilterContext(projectId, userScopes, staff).managerUserId;
  if (!manager) return "Chưa phân công";
  const user = staff.find((row) => String(row.id) === String(manager)) || ([] as Row[]).find(() => false);
  return user ? String(user.fullName || manager) : manager;
}

/** Lựa chọn cho 2 chiều lọc suy ra (Quản lý dự án · Phòng ban) — lấy từ dữ liệu THẬT. */
export function projectFilterChoices(data: AppData): { managers: { value: string; label: string }[]; units: { value: string; label: string }[] } {
  const scopes = (data.userScopes || []).filter((row) => !row.leftAt);
  const staff = data.staffDirectory || [];
  const managerIds = scopes.filter((row) => String(row.permission) === "admin").map((row) => String(row.userId || "")).filter(Boolean).filter((id, index, all) => all.indexOf(id) === index);
  const managers = managerIds.map((id) => {
    const user = staff.find((row) => String(row.id) === String(id));
    return { value: id, label: user ? `${user.fullName}${user.employeeCode ? ` · ${user.employeeCode}` : ""}` : id };
  });
  const participantIds = new Set(scopes.map((row) => String(row.userId || "")));
  const unitKeys = staff
    .filter((row) => participantIds.has(String(row.id)))
    .map((row) => ({ id: String(row.organizationUnitId || ""), code: String(row.organizationCode || ""), name: String(row.organizationName || row.department || "") }));
  const seen = new Set<string>();
  const units: { value: string; label: string }[] = [];
  for (const unit of unitKeys) {
    const value = unit.id || unit.code || unit.name;
    if (!value || seen.has(value)) continue;
    seen.add(value);
    units.push({ value, label: `${unit.code || "—"} · ${unit.name || value}` });
  }
  return { managers, units };
}
