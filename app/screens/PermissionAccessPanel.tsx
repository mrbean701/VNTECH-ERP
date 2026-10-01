"use client";

/**
 * MỐC 117 — TÁI SỬ DỤNG MODAL PHÂN QUYỀN.
 *
 * USER 01/10/2026 (nguyên văn):
 *   «modal sửa tài khoản - tab phân quyền công việc / chức năng là modal dùng chung với
 *    modal sửa quyền của tab 6 phân quyền người dùng nên có thể đồng bộ hoặc tái sử dụng.
 *    hãy chỉnh sửa modal sửa tài khoản - tab phân quyền công việc / chức năng theo hướng này.»
 *
 * Tình trạng trước MỐC 117 — hai modal vẽ ma trận phân quyền riêng, lệch nhau:
 *   · `UserAccessModal`  (tab 6 «Phân quyền người dùng»): ma trận ĐẦY ĐỦ dựng tay —
 *     nút «✓ Chọn tất cả» / «□ Bỏ chọn tất cả», checkbox 3 trạng thái theo CỘT và theo DÒNG,
 *     `HelpTip` cho từng cột, cột «Hết hạn».
 *   · `UserEditModal`    (thẻ «Phân quyền công việc / chức năng»): dùng component
 *     `PermissionMatrix` rút gọn — KHÔNG có nút hàng loạt, KHÔNG có checkbox cột/dòng,
 *     KHÔNG có «Phạm vi kho», KHÔNG có cảnh báo đổi ≥20 quyền.
 *   ⇒ Người dùng mở cùng một việc ở 2 nơi mà thấy 2 giao diện khác nhau.
 *
 * Cách sửa: chọn BẢN GIÀU TÍNH NĂNG (của `UserAccessModal`) làm bản chuẩn, dựng trong panel
 * này, rồi CẢ HAI modal cùng dùng. Không hạ cấp thẻ «Phân quyền công việc / chức năng».
 *
 * Ba điểm cần giữ nguyên khi tách (ghi rõ để người sau không "dọn cho gọn"):
 *  1. ⛔ KHÔNG nhận `onChange` kiểu callback. Panel SỞ HỮU ô tick và ghi ra `stateRef`.
 *     Nếu modal khởi tạo `{}` rồi truyền xuống, lần Lưu đầu tiên sẽ gửi toàn `false`
 *     ⇒ XÓA SẠCH toàn bộ quyền của tài khoản. Vì vậy modal đọc `stateRef.current` lúc submit.
 *  2. ⛔ Ô «Hết hạn» là `<input type="date">` (YYYY-MM-DD), KHÔNG phải `datetime-local`.
 *     Vế Java nhận `LocalDate`; nếu gửi `2026-06-30T00:00` sẽ lệch/round sai. Bản cũ của
 *     `UserAccessModal` dùng `datetime-local` — đó là chỗ lệch đã được thống nhất lại ở đây.
 *  3. `tests/runtime-admin-boq-regression.test.mjs` khẳng định các chuỗi
 *     «PHÂN QUYỀN CÔNG VIỆC / CHỨC NĂNG», «Đồng bộ SSOT», `permission-group-row`,
 *     `permission-subgroup-row` tồn tại trong mã giao diện. Markup đã chuyển sang tệp này
 *     nên tệp này PHẢI được thêm vào `readUiSource()` của test đó (không được xoá assert).
 *
 * Không import từ `app/page.tsx` (thành phần cha) — nếu không sẽ thành vòng lùi. Vì vậy
 * `HelpTip` được truyền vào qua prop `help`, còn `TriStateCheckbox` + `ADMIN_HELP_TEXT`
 * đã được chuyển sang `lib/ui-shared.tsx` ở chính MỐC 117.
 */
import { useEffect, useRef, useState } from "react";
import type { MutableRefObject, ReactNode } from "react";

import { ADMIN_HELP_TEXT, TriStateCheckbox } from "@/lib/ui-shared";
import type { AppData, Row } from "@/lib/ui-shared";
import { normalizePermissionCaps, PERMISSION_CAPABILITIES, PERMISSION_CAPABILITY_META } from "@/app/screens/PermissionMatrix";
import type { PermissionCapability, PermissionEntry, PermissionState } from "@/app/screens/PermissionMatrix";

type HelpTipComponent = (props: { text: string }) => ReactNode;

type EmptyRow = Record<string, never>;
type Cell = Record<PermissionCapability, boolean>;

/**
 * Nội dung trợ giúp cho 6 cột quyền. `PERMISSION_CAPABILITY_META` chỉ có `label`+`property`,
 * còn bản `UserAccessModal` cũ tra `ADMIN_HELP_TEXT.permission*` — bảng tra ở đây là nguồn
 * chuẩn sau MỐC 117 (trước đây nó nằm rời trong modal, còn `PermissionMatrix` thì không có).
 */
const CAPABILITY_HELP: Record<PermissionCapability, string> = {
  view: ADMIN_HELP_TEXT.permissionView,
  use: ADMIN_HELP_TEXT.permissionUse,
  create: ADMIN_HELP_TEXT.permissionCreate,
  edit: ADMIN_HELP_TEXT.permissionEdit,
  approve: ADMIN_HELP_TEXT.permissionApprove,
  export: ADMIN_HELP_TEXT.permissionExport,
};

/**
 * Đếm số ô quyền khác với CSDL hiện tại — dùng cho cảnh báo đổi hàng loạt.
 * Trả về 0 khi chưa có quyền nào trong `state` (chưa render/chưa nạp) để KHÔNG bắt người
 * dùng xác nhận vô nghĩa.
 */
export function countChangedPermissions(data: AppData, userId: string, next: PermissionState): number {
  const current = (data.allModulePermissions || []).filter((item) => String(item.userId) === String(userId));
  if (!next || Object.keys(next).length === 0) return 0;
  let changed = 0;
  for (const item of current) {
    const target = next[item.moduleKey];
    if (!target) continue; // module không còn trong danh sách ⇒ không tính là thay đổi
    for (const cap of PERMISSION_CAPABILITIES) {
      const property = PERMISSION_CAPABILITY_META[cap].property;
      if (Boolean((item as unknown as EmptyRow)[property]) !== Boolean(target[cap])) changed += 1;
    }
  }
  return changed;
}

/** `2026-06-30T00:00:00` → `2026-06-30` cho `<input type="date">`. */
function toDateInputValue(value: unknown): string {
  const raw = String(value ?? "").trim();
  const match = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : "";
}

function scopeFor(data: AppData, userId: string, projectId: string): string {
  const found = (data.userScopes || []).find(
    (item) => String(item.userId) === String(userId) && String(item.projectId) === String(projectId),
  );
  return String(found?.permission || "none");
}

function warehouseScopeFor(data: AppData, userId: string, warehouseId: string): string {
  const found = (data.userWarehouseScopes || []).find(
    (item) => String(item.userId) === String(userId) && String(item.warehouseId) === String(warehouseId),
  );
  return String(found?.permission || "none");
}

export default function PermissionAccessPanel({
  data,
  user,
  entries,
  help,
  stateRef,
  showMatrixTitle = true,
}: {
  data: AppData;
  /** Dòng người dùng lấy thẳng từ `data.users` — không suy diễn `roleBase` từ role. */
  user: Row;
  entries: PermissionEntry[];
  /** Component `HelpTip` của `page.tsx` (truyền vào để tránh import ngược gây vòng lùi). */
  help: HelpTipComponent;
  stateRef: MutableRefObject<PermissionState>;
  /** Thẻ «Sửa tài khoản» đã có `<h3>` riêng nên không cần tiêu đề lặp lại. */
  showMatrixTitle?: boolean;
}) {
  const HelpTip = help;
  const userId = String(user.id || "");
  const assignableModules = (data.moduleCatalog || []).filter(
    (item) => Boolean(item.enabled !== false) && item.key !== "admin",
  );
  const activeProjects = (data.adminProjects || []).filter((row) => row.status === "active");

  const permissionFor = (moduleKey: string): Row =>
    (data.allModulePermissions || []).find(
      (item) => String(item.userId) === userId && item.moduleKey === moduleKey,
    ) || ({} as Row);

  // Nạp sẵn quyền hiện có rồi ghi vào `stateRef` NGAY KHI MOUNT (effect chạy sau render đầu).
  // Đây là điều kiện để lần Lưu đầu tiên không gửi toàn `false` ⇒ xoá sạch quyền.
  const [permissionState, setPermissionState] = useState<PermissionState>(() =>
    Object.fromEntries(
      assignableModules.map((item) => {
        const current = permissionFor(item.key);
        return [
          item.key,
          Object.fromEntries(
            PERMISSION_CAPABILITIES.map((cap) => [
              cap,
              Boolean((current as unknown as EmptyRow)[PERMISSION_CAPABILITY_META[cap].property]),
            ]),
          ) as Cell,
        ];
      }),
    ),
  );

  useEffect(() => {
    stateRef.current = permissionState;
  }, [permissionState, stateRef]);

  // ── Hành vi phụ thuộc: bật quyền con ⇒ tự bật quyền cha; bỏ «Xem» ⇒ thu hồi tất cả.
  // Dùng CHUNG `normalizePermissionCaps` của `PermissionMatrix` để hai nơi không lệch luật.
  const onToggle = (moduleKey: string, cap: PermissionCapability, value: boolean) => {
    const current = permissionState[moduleKey] || (Object.fromEntries(PERMISSION_CAPABILITIES.map((k) => [k, false])) as Cell);
    setPermissionState({ ...permissionState, [moduleKey]: normalizePermissionCaps(current, cap, value) });
  };

  const setAll = (value: boolean) => {
    setPermissionState(
      Object.fromEntries(
        assignableModules.map((item) => [
          item.key,
          Object.fromEntries(PERMISSION_CAPABILITIES.map((cap) => [cap, value])) as Cell,
        ]),
      ),
    );
  };

  const setColumnAll = (cap: PermissionCapability, value: boolean) => {
    setPermissionState(
      Object.fromEntries(
        assignableModules.map((item) => [
          item.key,
          normalizePermissionCaps(permissionState[item.key] || (Object.fromEntries(PERMISSION_CAPABILITIES.map((k) => [k, false])) as Cell), cap, value),
        ]),
      ),
    );
  };

  const setRowAll = (moduleKey: string, value: boolean) => {
    setPermissionState({
      ...permissionState,
      [moduleKey]: Object.fromEntries(PERMISSION_CAPABILITIES.map((cap) => [cap, value])) as Cell,
    });
  };

  const rowState = (moduleKey: string) => {
    const selected = PERMISSION_CAPABILITIES.filter((cap) => Boolean(permissionState[moduleKey]?.[cap])).length;
    return {
      all: selected === PERMISSION_CAPABILITIES.length,
      some: selected > 0 && selected < PERMISSION_CAPABILITIES.length,
    };
  };

  const columnState = (cap: PermissionCapability) => {
    const selected = assignableModules.filter((item) => permissionState[item.key]?.[cap]).length;
    return {
      all: assignableModules.length > 0 && selected === assignableModules.length,
      some: selected > 0 && selected < assignableModules.length,
    };
  };

  // ── Phạm vi kho: chỉ tài khoản thuộc nhóm thủ kho mới được gán kho.
  const warehouseKind = String(user.warehouseScopeKind || "");
  const isWarehouseRole = String(user.roleBase || user.role) === "warehouse";
  const availableWarehouses = isWarehouseRole
    ? (data.warehouses || []).filter((row) => (warehouseKind === "central" ? row.type === "central" : row.type === "site"))
    : [];

  const sectionNumber = isWarehouseRole ? 3 : 2;

  return (
    <div className="embedded-permission-body">
      <section className="permission-section">
        <h3>
          1. Phạm vi dự án <HelpTip text="Quyền chức năng chỉ có hiệu lực trong những dự án người dùng được gán. Không nhìn thấy = không truy cập; Chỉ xem = đọc; Thao tác/sửa = xử lý nghiệp vụ; Phê duyệt = được tham gia bước duyệt khi đúng workflow." />
        </h3>
        <p>Quyền chức năng bên dưới chỉ có hiệu lực trong dự án đã được gán.</p>
        <div className="permission-grid">
          {activeProjects.map((project) => (
            <label key={project.id}>
              <span>
                <b>{project.code}</b> · {project.name}
              </span>
              <select name={`project-${project.id}`} defaultValue={scopeFor(data, userId, String(project.id))} title="Chọn mức truy cập của người dùng trong riêng dự án này.">
                <option value="none">Không nhìn thấy</option>
                <option value="read">Chỉ xem</option>
                <option value="write">Cho phép thao tác/sửa</option>
                <option value="approve">Cho phép phê duyệt</option>
              </select>
            </label>
          ))}
        </div>
      </section>

      {isWarehouseRole && (
        <section className="permission-section">
          <h3>2. Phạm vi kho bắt buộc</h3>
          <p>
            {warehouseKind === "central"
              ? "Thủ kho Tổng chỉ được gán Kho Tổng; hệ thống chặn toàn bộ kho dự án."
              : "Thủ kho dự án chỉ được gán kho thuộc đúng dự án đã được cấp ở mục 1; hệ thống chặn Kho Tổng và dự án khác."}
          </p>
          <div className="permission-grid">
            {availableWarehouses.map((warehouse) => (
              <label key={warehouse.id}>
                <span>
                  <b>{warehouse.code}</b> · {warehouse.name}
                  <small>
                    {" · "}
                    {warehouse.type === "central"
                      ? "Kho Tổng"
                      : (data.adminProjects || []).find((p) => p.id === warehouse.projectId)?.code || "Kho dự án"}
                  </small>
                </span>
                <select name={`warehouse-${warehouse.id}`} defaultValue={warehouseScopeFor(data, userId, String(warehouse.id))}>
                  <option value="none">Không truy cập</option>
                  <option value="read">Chỉ xem</option>
                  <option value="write">Cho phép thao tác</option>
                  <option value="approve">Thao tác + xác nhận</option>
                </select>
              </label>
            ))}
          </div>
        </section>
      )}

      {showMatrixTitle && (
        <>
          <h3>PHÂN QUYỀN CÔNG VIỆC / CHỨC NĂNG</h3>
          <p className="muted">
            Đồng bộ SSOT — một chỗ nguồn số liệu cho cả nhân viên và quyền; thêm / bỏ một chức năng tự động cập nhật nguồn này.
          </p>
        </>
      )}

      <section className="permission-section">
        <div className="permission-section-head">
          <div>
            <h3>
              {sectionNumber}. Ma trận quyền từng chức năng
            </h3>
            <p>
              Checkbox ở đầu cột chọn/bỏ cả cột; checkbox “Cả dòng” chọn/bỏ toàn bộ quyền của một chức năng. Ô tổng có trạng thái ▣ khi
              mới chọn một phần.
            </p>
          </div>
          <div className="bulk-select-actions">
            <button type="button" className="secondary" title="Bật toàn bộ các quyền trong ma trận. Ngày hết hạn không bị thay đổi." onClick={() => setAll(true)}>
              ✓ Chọn tất cả
            </button>
            <button type="button" className="secondary" title="Thu hồi toàn bộ các quyền trong ma trận. Ngày hết hạn không bị thay đổi." onClick={() => setAll(false)}>
              □ Bỏ chọn tất cả
            </button>
          </div>
        </div>
        <div className="table-wrap">
          <table className="permission-matrix">
            <thead>
              <tr>
                <th>Chức năng</th>
                <th>
                  <div className="permission-master">
                    <span>Cả dòng</span>
                    <HelpTip text="Mỗi checkbox ở cột này chọn/bỏ toàn bộ Xem, Thao tác, Tạo, Sửa, Duyệt, Xuất của riêng chức năng đó." />
                  </div>
                </th>
                {PERMISSION_CAPABILITIES.map((cap) => {
                  const state = columnState(cap);
                  const meta = PERMISSION_CAPABILITY_META[cap];
                  return (
                    <th key={cap}>
                      <div className="permission-master">
                        <span>{meta.label}</span>
                        <HelpTip text={CAPABILITY_HELP[cap]} />
                      </div>
                      <TriStateCheckbox
                        checked={state.all}
                        some={state.some}
                        title={`${state.all ? "Bỏ" : "Chọn"} quyền ${meta.label} cho tất cả chức năng`}
                        onChange={(checked) => setColumnAll(cap, checked)}
                      />
                    </th>
                  );
                })}
                <th>
                  <div className="permission-master">
                    <span>Hết hạn</span>
                    <HelpTip text={ADMIN_HELP_TEXT.permissionExpiry} />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                if (entry.kind === "group") {
                  return (
                    <tr className="permission-group-row" key={entry.key}>
                      <td colSpan={PERMISSION_CAPABILITIES.length + 3}>
                        <strong>{entry.label}</strong>
                      </td>
                    </tr>
                  );
                }
                if (entry.kind === "subgroup") {
                  return (
                    <tr className="permission-subgroup-row" key={entry.key}>
                      <td colSpan={PERMISSION_CAPABILITIES.length + 3}>
                        <span>↳ {entry.label}</span>
                      </td>
                    </tr>
                  );
                }
                const item = entry.module!;
                const summary = rowState(item.key);
                return (
                  <tr className="permission-module-row" key={item.key}>
                    <td>
                      <strong>{item.label}</strong>
                      <small>
                        {item.group}
                        {item.subGroup ? ` › ${item.subGroup}` : ""}
                      </small>
                    </td>
                    <td>
                      <TriStateCheckbox
                        checked={summary.all}
                        some={summary.some}
                        title={`${summary.all ? "Bỏ" : "Chọn"} toàn bộ quyền của ${item.label}`}
                        onChange={(checked) => setRowAll(item.key, checked)}
                      />
                    </td>
                    {PERMISSION_CAPABILITIES.map((cap) => (
                      <td key={cap}>
                        <input
                          type="checkbox"
                          name={`${cap}-${item.key}`}
                          checked={Boolean(permissionState[item.key]?.[cap])}
                          title={CAPABILITY_HELP[cap]}
                          aria-label={`${PERMISSION_CAPABILITY_META[cap].label} · ${item.label}`}
                          onChange={(event) => onToggle(item.key, cap, event.target.checked)}
                        />
                      </td>
                    ))}
                    <td>
                      <input
                        type="date"
                        name={`expires-${item.key}`}
                        defaultValue={toDateInputValue(permissionFor(item.key).permissionExpiresAt)}
                        title={ADMIN_HELP_TEXT.permissionExpiry}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="inline-alert">
        <b>Nguyên tắc:</b> chức danh không tự sinh quyền. Bật Tạo/Sửa/Duyệt tự bật Xem + Thao tác; bật Xuất tự bật Xem. Bỏ Xem
        sẽ thu hồi toàn bộ quyền phụ thuộc. Quản trị viên có thể thu hồi bất kỳ lúc nào.
      </div>
    </div>
  );
}
