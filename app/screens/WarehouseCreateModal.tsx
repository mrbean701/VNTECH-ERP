"use client";

// USER 28/09/2026 — MODAL「＋ Tạo Kho cho dự án」.
//   ⛔ KHÔNG thêm action mới. Dùng action CÓ SẴN `update_project`, vì `ProjectManagementUseCase`
//      L100-104 gọi `upsertSiteWarehouse` ở CẢ HAI nhánh (có kho sẵn / chưa có kho) ⇒ tạo được kho mới.
//   📌 BẰNG CHỨNG: java-backend/.../ProjectManagementUseCase.java L84-105 + ProjectAdminStoreAdapter L61-72.
//   ⚠️ RỦI RO ĐÃ RÀ: `update_project` ghi đè code/name/contractNo/startDate/plannedEndDate của DỰ ÁN
//      ⇒ modal này KHÔNG cho sửa các ô đó; nó gửi ĐÚNG giá trị hiện tại đọc từ dự án đang chọn.
//      (⛔ Nhờ vậy nút này KHÔNG BAO GIỜ làm hỏng thông tin dự án.)
//   QUYỀN: cùng cổng với nút「Tạo Dự án」: isAdminUser || modulePermission(data,"site_command").canCreate.

import { useState, type FormEvent } from "react";
import { BaseModal } from "@/lib/ui-blocks";
import { isAdminUser, modulePermission } from "@/lib/permissions";
import type { AppData, Row } from "@/lib/ui-shared";

export type WarehouseCreateModalProps = {
  data: AppData;
  close: () => void;
  submit: (name: string, payload: Row) => Promise<boolean>;
  /** Dự án đang chọn ở màn cha (có thể rỗng). */
  defaultProjectId?: string;
};

export function WarehouseCreateModal({ data, close, submit, defaultProjectId = "" }: WarehouseCreateModalProps) {
  const projects: Row[] = data.projects || [];
  const [projectId, setProjectId] = useState(defaultProjectId);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  // ✅ Cổng quyền THẬT (cùng cổng với nút Tạo Dự án — cùng họ action create/update project).
  const canCreate = isAdminUser(data.user) || Boolean(modulePermission(data, "site_command").canCreate);
  const project = projects.find((p) => String(p.id) === projectId);
  const projectMissing = !project;
  const invalid = !/^[A-Z0-9._-]{2,32}$/.test(code.trim().toUpperCase()) || !name.trim();

  // Gợi ý mã kho mặc định theo mã dự án (ĐÚNG quy tắc máy chủ: "KHO-" + code) — chỉ để tiện.
  function suggestCode() {
    if (!project) return;
    setCode(`KHO-${String(project.code || "").toUpperCase()}`.slice(0, 32));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canCreate || busy || projectMissing || invalid || !project) return;
    setBusy(true);
    // ⚠️ Gửi ĐÚNG thông tin dự án hiện tại + kho mới.
    //    (server `update_project` cần projectId+code+name; nullIfBlank cho các trường không nhập)
    const ok = await submit("update_project", {
      projectId: String(project.id),
      code: String(project.code || ""),
      name: String(project.name || ""),
      contractNo: project.contractNo || undefined,
      contractName: project.contractName || undefined,
      startDate: project.startDate || undefined,
      plannedEndDate: project.plannedEndDate || undefined,
      warehouseCode: code.trim().toUpperCase(),
      warehouseName: name.trim(),
    });
    setBusy(false);
    if (ok) close();
  }

  return (
    <BaseModal
      title="＋ Tạo kho cho dự án"
      note="Bổ sung kho công trường cho một dự án đã có. Thông tin dự án được giữ nguyên, chỉ thêm kho."
      close={close}
    >
      <form className="dept-assign-form" data-project-warehouse-create="1" onSubmit={save}>
        <label>
          <span>Dự án *</span>
          <select required value={projectId} disabled={!canCreate} onChange={(e) => setProjectId(e.target.value)}>
            <option value="">— Chọn dự án —</option>
            {projects.map((p) => <option key={String(p.id)} value={String(p.id)}>{p.code} · {p.name}</option>)}
          </select>
        </label>
        <label>
          <span>Mã kho *</span>
          <input
            required
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder={project ? `KHO-${String(project.code).toUpperCase()}` : "KHO-MADUAN"}
            disabled={!canCreate}
          />
        </label>
        {project && (
          <p className="muted">
            <button type="button" className="export-mini" onClick={suggestCode} disabled={!canCreate}>
              Gợi ý mã kho
            </button>
          </p>
        )}
        <label>
          <span>Tên kho *</span>
          <input required value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Kho công trường …" disabled={!canCreate} />
        </label>
        {project && (
          <p className="muted">
            Dự án: <b>{project.code}</b> · {project.name} — <b>không bị thay đổi</b>.
          </p>
        )}
        {!canCreate && (
          <p className="inline-alert">
            <b>Không đủ quyền.</b> Cần quyền tạo dự án trên chức năng Ban chỉ huy.
          </p>
        )}
        <button className="primary" type="submit" disabled={!canCreate || projectMissing || invalid || busy}>
          {busy ? "Đang tạo…" : "＋ Tạo kho"}
        </button>
      </form>
    </BaseModal>
  );
}

export default WarehouseCreateModal;
