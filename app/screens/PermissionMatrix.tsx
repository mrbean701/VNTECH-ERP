// USER 29/09/2026 (MỐC 58-5) — MA TRẬN PHÂN QUYỀN DÙNG CHUNG.
//
// ⛔ YÊU CẦU USER: «tab phân quyền công việc / chức năng trong modal Sửa tài khoản có thể
//    sử dụng chung với modal phân quyền công việc / chức năng trong tab phân quyền user
//    để cho đẹp» ⇒ TÁCH RA 1 COMPONENT, hai chỗ cùng dùng (goal §11 Reusable Component).
//
// ⛔ KHÔNG nhân bản JSX: trước đây ma trận nằm rời ở 2 nơi (`UserEditModal` thẻ ② và
//    `UserAccessModal`) ⇒ mỗi lần sửa phải làm 2 lần. Nay 1 nguồn.

import type { Row } from "@/lib/ui-shared";

export type PermissionCapability = "view" | "use" | "create" | "edit" | "approve" | "export";

export const PERMISSION_CAPABILITIES: PermissionCapability[] = ["view", "use", "create", "edit", "approve", "export"];

export const PERMISSION_CAPABILITY_META: Record<PermissionCapability, { label: string; property: string }> = {
  view: { label: "Xem", property: "canView" },
  use: { label: "Thao tác", property: "canUse" },
  create: { label: "Tạo", property: "canCreate" },
  edit: { label: "Sửa", property: "canEdit" },
  approve: { label: "Duyệt", property: "canApprove" },
  export: { label: "Xuất", property: "canExport" },
};

export type PermissionState = Record<string, Partial<Record<PermissionCapability, boolean>>>;

/** Bật 1 quyền thì tự bật `view` (không có `view` thì các quyền khác vô nghĩa). */
export function normalizePermissionCaps(
  current: Partial<Record<PermissionCapability, boolean>>,
  cap: PermissionCapability,
  value: boolean,
): Record<PermissionCapability, boolean> {
  const next = { ...current, [cap]: value } as Record<PermissionCapability, boolean>;
  if (value && cap !== "view") next.view = true;
  if (!next.view) { next.use = false; next.create = false; next.edit = false; next.approve = false; next.export = false; }
  return next;
}

export type PermissionEntry = { kind: "group" | "subgroup" | "module"; key: string; label: string; module?: Row };

/** MỐC 112 — `<input type="date">` cần đúng `YYYY-MM-DD`, còn DB trả `2026-12-31T00:00:00Z`. */
function toDateInputValue(raw: unknown): string {
  if (!raw) return "";
  const s = String(raw);
  return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : "";
}

export default function PermissionMatrix({ entries, state, onToggle, expiryFor, expiryEditable, capabilities = PERMISSION_CAPABILITIES }: {
  entries: PermissionEntry[];
  state: PermissionState;
  onToggle: (moduleKey: string, cap: PermissionCapability, value: boolean) => void;
  expiryFor?: (moduleKey: string) => unknown;
  // MỐC 112 — cột «Hết hạn» trước đây CHỈ ĐỌC (một `<span>`), trong khi cả `UserEditModal`
  // lẫn `UserAccessModal` đều đọc `form.get(`expires-${key}`)` ⇒ LUÔN ra `null` ⇒ không bao
  // giờ có gì để lưu. Bật cờ này để render ô nhập mang `name` (điều khiển bằng `FormData`,
  // khỏi cần useState — đúng cách các ô khác trong modal hoạt động).
  expiryEditable?: boolean;
  capabilities?: PermissionCapability[];
}) {
  return <div className="table-wrap permission-matrix-wrap" data-vntech="permission-matrix">
    <table className="permission-matrix">
      <thead>
        <tr>
          <th>Menu / Chức năng</th>
          <th>Cả dòng</th>
          {capabilities.map((cap) => <th key={cap}>{PERMISSION_CAPABILITY_META[cap].label}</th>)}
          <th>Hết hạn</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((entry) => {
          if (entry.kind === "group") {
            return <tr className="permission-group-row" key={entry.key}><td colSpan={capabilities.length + 3}><strong>{entry.label}</strong></td></tr>;
          }
          if (entry.kind === "subgroup") {
            return <tr className="permission-subgroup-row" key={entry.key}><td colSpan={capabilities.length + 3}>{entry.label}</td></tr>;
          }
          const moduleKey = entry.module?.key ?? String(entry.key).replace(/^module:/, "");
          const st = state[moduleKey] || {};
          return <tr key={entry.key}>
            <td>{entry.label}</td>
            <td>
              <input
                type="checkbox"
                aria-label={`Cả dòng · ${entry.label}`}
                checked={capabilities.every((cap) => Boolean(st[cap]))}
                onChange={(ev) => capabilities.forEach((cap) => onToggle(moduleKey, cap, ev.target.checked))}
              />
            </td>
            {capabilities.map((cap) => (
              <td key={cap}>
                <input
                  type="checkbox"
                  aria-label={`${PERMISSION_CAPABILITY_META[cap].label} · ${entry.label}`}
                  checked={Boolean(st[cap])}
                  onChange={(ev) => onToggle(moduleKey, cap, ev.target.checked)}
                />
              </td>
            ))}
            <td>{expiryEditable
              ? <input
                  type="date"
                  name={`expires-${moduleKey}`}
                  aria-label={`Hết hạn · ${entry.label}`}
                  title="Để trống = không hạn."
                  defaultValue={toDateInputValue(expiryFor?.(moduleKey))}
                />
              : expiryFor ? <span className="muted">{String(expiryFor(moduleKey) ?? "—")}</span> : null}</td>
          </tr>;
        })}
      </tbody>
    </table>
  </div>;
}
