// ⚠️ MT3-S03 (08/10/2026) — TỆP NÀY HIỆN ⛔ KHÔNG ĐƯỢC DÙNG Ở ĐÂU (đo được: **0 tham chiếu** trong `app/**` + `lib/**`).
//    ⛔ ĐỪNG tốn công kiểm thử/DOM-verify modal này (bài học `SESSION_C/TEST_LOG.md §C42`).
//    ⚠️ Cần quyết (nối lại menu · xoá · giữ kèm ghi chú): `SESSION_C/HANDOFF_LOG.md` §`HANDOFF-20261007-C15`.
// USER 28/09/2026 — MODAL TÁI DÙNG: 「＋ Tạo Ban chỉ huy」.
//   ⚠️ KHÔNG tạo nghiệp vụ mới — dùng ĐÚNG payload và ĐÚNG cổng quyền đã có:
//     · action  : save_organization_unit  { code, name, unitType:"site_command", projectId, description }
//                 (đọc từ app/page.tsx L1528 — màn quản lý BCH đang dùng)
//     · quyền   : bchGates(isAdminUser(data.user), modulePermission(data,"site_command")).canAddUnit
//                 (đọc từ L1520 + app/screens/project-bch-permissions.ts)
//   ⚠️ BCH thuộc DỰ ÁN ⇒ modal có ô chọn dự án (bắt buộc — server cần projectId).
//   ⚠️ Component hỗ trợ read-only: nếu !canAddUnit thì các ô bị disabled ⇒ không tạo được vượt quyền.
"use client";

import { useState, type FormEvent } from "react";
import { BaseModal } from "@/lib/ui-blocks";
import { isAdminUser, modulePermission } from "@/lib/permissions";
import { bchGates } from "@/app/screens/project-bch-permissions";
import type { AppData, Row } from "@/lib/ui-shared";

export type SiteCommandCreateModalProps = {
  data: AppData;
  close: () => void;
  submit: (name: string, payload: Row) => Promise<boolean>;
  /** USER 28/09/2026 — dự án đang chọn ở màn cha (có thể rỗng). */
  defaultProjectId?: string;
};

export function SiteCommandCreateModal({ data, close, submit, defaultProjectId = "" }: SiteCommandCreateModalProps) {
  const projects: Row[] = data.projects || [];
  const [projectId, setProjectId] = useState(defaultProjectId);
  const [busy, setBusy] = useState(false);

  // ✅ CỔNG QUYỀN THẬT — cùng hàm `bchGates` màn quản lý BCH đang dùng (app/page.tsx L1520).
  const { canAddUnit } = bchGates(isAdminUser(data.user), modulePermission(data, "site_command"));
  const projectMissing = !projectId;

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canAddUnit || busy) return;              // ⛔ chặn ngay ở UI
    const form = event.currentTarget;
    const fd = new FormData(form);
    const code = String(fd.get("unitCode") || "").trim();
    const name = String(fd.get("unitName") || "").trim();
    if (!code || !name || projectMissing) return;
    setBusy(true);
    // ✅ payload GIỐNG HỆT màn quản lý BCH (L1528) — ⛔ không thêm bớt trường nghiệp vụ.
    const ok = await submit("save_organization_unit", {
      organizationUnitId: undefined, code, name,
      unitType: "site_command", projectId,
      description: String(fd.get("unitDescription") || ""),
    });
    setBusy(false);
    if (ok) close();
  }

  return (
    <BaseModal
      title="＋ Tạo Ban chỉ huy dự án"
      note="Ban chỉ huy thuộc đúng một dự án. Mã và tên do quản trị viên tự cấu hình."
      close={close}
    >
      <form className="dept-assign-form" data-project-bch-create="1" onSubmit={save}>
        <label>
          <span>Dự án *</span>
          <select required value={projectId} disabled={!canAddUnit} onChange={(e) => setProjectId(e.target.value)}>
            <option value="">— Chọn dự án —</option>
            {projects.map((p) => <option key={String(p.id)} value={String(p.id)}>{p.code} · {p.name}</option>)}
          </select>
        </label>
        <label>
          <span>Mã Ban chỉ huy *</span>
          <input name="unitCode" required placeholder="Mã Ban chỉ huy (VD BCH-DA-MAU-01)" disabled={!canAddUnit} />
        </label>
        <label>
          <span>Tên Ban chỉ huy *</span>
          <input name="unitName" required placeholder="Tên Ban chỉ huy" disabled={!canAddUnit} />
        </label>
        <label>
          <span>Mô tả (tuỳ chọn)</span>
          <input name="unitDescription" placeholder="Mô tả (tuỳ chọn)" disabled={!canAddUnit} />
        </label>
        {!canAddUnit && (
          <p className="inline-alert">
            <b>Không đủ quyền.</b> Cần quyền tạo Ban chỉ huy trên chức năng Ban chỉ huy.
          </p>
        )}
        {canAddUnit && projectMissing && (
          <p className="inline-alert"><b>Chọn dự án</b> trước khi tạo Ban chỉ huy.</p>
        )}
        <button className="primary" type="submit" disabled={!canAddUnit || projectMissing || busy}>
          {busy ? "Đang tạo…" : "＋ Tạo Ban chỉ huy"}
        </button>
      </form>
    </BaseModal>
  );
}

export default SiteCommandCreateModal;
