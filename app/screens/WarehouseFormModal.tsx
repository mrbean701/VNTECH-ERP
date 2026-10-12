"use client";
// ═════════════════════════════════════════════════════════════════════════════════════════════
// ⭐⭐⭐ TASK-235 — MODAL «TẠO / SỬA KHO» (⭐ phiên 02 dựng sẵn để S01 NỐI) ⭐⭐⭐
//   NGUỒN QUY TẮC: `DEC-20261008-013` — trích NGUYÊN VĂN lời user:
//     ① «tạo kho… Kho sẽ được tạo với các thông tin cơ bản như **tên kho, mã kho, tên dự án**,
//        ⛔ **chưa cần phải thêm thủ kho hay các thông tin khác** sau này user sẽ tự cấu hình sau»
//     ② «sửa kho : cho sửa, nhưng phải có **phân quyền sửa kho** thì mới được, **có cho phép sửa mã kho**»
//     ③ «Xóa kho: **không cho phép** nhưng cho phép **ẩn kho** hoặc **set trạng thái ngừng hoạt động**»
//   MÃ KHO: `KD-xxx` (⛔ không trùng) · TÊN KHO: `KHO <tên dự án>`
//
//   ⚠️⚠️ PHẠM VI (⭐ §7): component này CHỈ dựng UI + kiểm dữ liệu.
//        • API   `save_warehouse`        ⇒ ⛔ CHƯA CÓ — backend thuộc `ERP-SESSION-01` (HANDOFF-20261008-009)
//        • Nối `page.tsx` (case modal)   ⇒ ⛔ thuộc `ERP-SESSION-01`
//        ⇒ S01 chỉ cần: import component này + thêm `modal === "warehouse"` ⇒ ⛔ KHÔNG phải tự viết lại.
// ═════════════════════════════════════════════════════════════════════════════════════════════
import { useState, type FormEvent } from "react";
import { BaseModal } from "@/lib/ui-blocks";
import {
  nextWarehouseCode,
  projectWarehouseName,
  validateWarehouseCode,
  validateProjectWarehouseName,
} from "@/lib/warehouse-hub";

// ⚠️ Dùng `unknown` (⛔ KHÔNG dùng `any`) — ESLint của dự án CẤM `any` (`@typescript-eslint/no-explicit-any`)
//    và `tsc` ⛔ KHÔNG bắt được lỗi này ⇒ chỉ ESLint bắt (bài học TEST-20261008-047).
type Row = Record<string, unknown>;
type WarehouseFormData = { warehouses?: Row[]; projects?: Row[] } | null | undefined;

export function WarehouseFormModal({
  data,
  row,
  close,
  submit,
  canEdit = true,
  canEditCode = true,
}: {
  data: WarehouseFormData;
  row: Row | null;
  close: () => void;
  submit: (name: string, payload: Row) => Promise<boolean>;
  /** Quyền SỬA kho (quy tắc ②). ⚠️ VIỆC KIỂM QUYỀN thuộc nơi gọi — xem `canCreate`/`canEdit` của module. */
  canEdit?: boolean;
  /** Quy tắc ② cho phép sửa MÃ KHO — cờ này chỉ để TẮT khi cần, mặc định BẬT. */
  canEditCode?: boolean;
}) {
  const editing = Boolean(row?.id);
  const warehouses: Row[] = (data?.warehouses || []) as Row[];
  const projects: Row[] = (data?.projects || []) as Row[];

  const [projectId, setProjectId] = useState<string>(String(row?.projectId || ""));
  // ⭐ MÃ KHO: tạo mới ⇒ TỰ SINH `KD-xxx` theo đúng quy tắc user (⛔ không trùng). Sửa ⇒ lấy mã hiện tại.
  const [code, setCode] = useState<string>(
    editing ? String(row?.code || "") : nextWarehouseCode(warehouses.map((w) => w.code)),
  );
  const [name, setName] = useState<string>(editing ? String(row?.name || "") : "");
  const [errors, setErrors] = useState<string[]>([]);

  const project = projects.find((p) => String(p.id) === projectId) || null;
  // ⭐ Kho DỰ ÁN ⇒ tên phải theo `KHO <tên dự án>` (quy tắc ③ user chốt).
  //    ⛔ Kho TỔNG (không chọn dự án) ⇒ tên tự do, ⛔ KHÔNG áp mẫu.
  const isProjectWarehouse = Boolean(projectId);

  function chonDuAn(id: string) {
    setProjectId(id);
    const p = projects.find((x) => String(x.id) === id);
    setName(p ? projectWarehouseName(p.name) : "");
  }

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canEdit) {
      setErrors(["Bạn không có quyền sửa kho."]);
      return;
    }
    const kiemMa = validateWarehouseCode(code, warehouses.map((w) => w.code), editing ? row?.code : undefined);
    const kiemTen = isProjectWarehouse
      ? validateProjectWarehouseName(name, project?.name)
      : { ok: Boolean(name.trim()), name: name.trim(), errors: name.trim() ? [] : ["Tên kho là bắt buộc."] };
    const loi = [...kiemMa.errors, ...kiemTen.errors];
    setErrors(loi);
    if (loi.length) return;
    if (
      await submit("save_warehouse", {
        warehouseId: editing ? row?.id : undefined,
        projectId: projectId || undefined,
        code: kiemMa.code,
        name: kiemTen.name,
      })
    )
      close();
  }

  return (
    <BaseModal
      title={editing ? `Sửa kho ${row?.code || ""}` : "Tạo kho"}
      note={
        editing
          ? "Sửa thông tin kho. Mã kho ĐỔI ĐƯỢC nhưng phải theo quy tắc KD-xxx và không trùng kho khác."
          : "Kho mới chỉ cần Mã kho · Tên kho · Dự án. Thủ kho và các thông tin khác cấu hình sau."
      }
      close={close}
    >
      <form onSubmit={send}>
        <div className="modal-body">
          {!canEdit && <div className="auth-alert danger">Bạn không có quyền sửa kho.</div>}
          {errors.length > 0 && (
            <div className="auth-alert danger" data-warehouse-form-errors>
              {errors.map((e) => (
                <div key={e}>{e}</div>
              ))}
            </div>
          )}
          <div className="form-grid">
            <label>
              <span>Dự án</span>
              <select value={projectId} onChange={(e) => chonDuAn(e.target.value)} data-warehouse-field="projectId">
                <option value="">— Kho Tổng / không gắn dự án —</option>
                {projects.map((p) => (
                  <option key={String(p.id)} value={String(p.id)}>
                    {p.code ? `${String(p.code)} · ` : ""}
                    {String(p.name ?? "")}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Mã kho *</span>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                readOnly={editing && !canEditCode}
                placeholder="KD-001"
                data-warehouse-field="code"
              />
            </label>
            <label className="span-2">
              <span>Tên kho *</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                readOnly={isProjectWarehouse}
                placeholder={isProjectWarehouse ? "Tự đặt theo tên dự án: KHO <tên dự án>" : "Kho Tổng"}
                data-warehouse-field="name"
              />
            </label>
          </div>
          <p className="muted" data-warehouse-rule-note>
            Quy tắc: mã kho <b>KD-xxx</b> (không trùng kho khác) · tên kho dự án <b>KHO &lt;tên dự án&gt;</b>.
          </p>
          {/* ⛔ Quy tắc ③: KHÔNG xoá kho — chỉ ẩn / ngừng hoạt động (nút nằm ở danh sách, không ở modal này). */}
        </div>
        <footer className="modal-footer">
          <button className="secondary" type="button" onClick={close}>
            Huỷ
          </button>
          <button className="primary" type="submit" disabled={!canEdit}>
            {editing ? "Lưu kho →" : "Tạo kho →"}
          </button>
        </footer>
      </form>
    </BaseModal>
  );
}

export default WarehouseFormModal;
