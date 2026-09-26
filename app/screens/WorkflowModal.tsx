// PHASE 1 (U-11) — MODULE DÙNG CHUNG TÁCH KHỎI `app/page.tsx`.
//
// Vì sao tách: `app/page.tsx` là MỘT tệp khổng lồ (hơn 4.000 dòng, hơn 250 khai báo top-level).
// Thứ tự cắt ĐÚNG (đã ghi ở `docs/agent-progress/U14-U11-KHAO-SAT.md` mục 2): tách HELPER DÙNG CHUNG trước
// (gỡ chặn IMPORT VÒNG), rồi mới tách từng màn.
//
// ⚠️ ĐIỀU KIỆN AN TOÀN (do `tools/tach-lat-cat-page.mjs` tự kiểm TRƯỚC KHI GHI): mọi tên mà các khối ở đây
// tham chiếu phải thuộc (a) khối cùng nằm trong tệp này, (b) tên có sẵn của JS, (c) tên đến từ `import` của
// `page.tsx` — công cụ SINH LẠI import đó ở đây, hoặc (d) kiểu của React ⇒ `import type … from "react"`.
// Không còn tên nào khác ⇒ KHÔNG thể tạo import vòng.

import { ListToolbar } from "@/app/components/ui";
import { BaseModal } from "@/lib/ui-blocks";
import { initials } from "@/lib/ui-shared";
import type { AppData, Row } from "@/lib/ui-shared";
import { configuredModules, workflowApproverCandidates } from "@/lib/workflow-helpers";
import { FormEvent, useState } from "react";
function WorkflowModal({ data, row, close, submit }: { data: AppData; row?: Row; close: () => void; submit: (name: string, payload: Row) => Promise<boolean> }) {
  const [code, setCode] = useState(String(row?.code || ""));
  const [name, setName] = useState(String(row?.name || ""));
  const [description, setDescription] = useState(String(row?.description || ""));
  const [moduleKey, setModuleKey] = useState(String(row?.moduleKey || "requests"));
  const [projectId, setProjectId] = useState(String(row?.projectId || ""));
  const [isDefault, setIsDefault] = useState(Number(row?.isDefault) === 1);
  const [sortOrder, setSortOrder] = useState(String(row?.sortOrder ?? 10));
  const [onlyPermitted, setOnlyPermitted] = useState(false);
  // [WF] Đặc tả 18/09: chọn người duyệt bằng TÌM KIẾM (không bày hết danh sách ⇒ modal gọn).
  const [approverQuery, setApproverQuery] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const existingSteps = (data.workflowSteps || []).filter((s) => String(s.workflowId) === String(row?.id))
    .sort((a, b) => Number(a.stepNo) - Number(b.stepNo))
    .map((s) => ({
      key: String(s.id),
      name: String(s.name || ""),
      description: String(s.description || ""),
      approvalMode: String(s.approvalMode || "single"),
      slaHours: String(s.slaHours ?? 8),
      approverUserIds: (data.workflowStepApprovers || []).filter((a) => String(a.stepId) === String(s.id)).map((a) => String(a.userId)),
    }));
  const [steps, setSteps] = useState<Row[]>(existingSteps.length ? existingSteps : [{
    key: "new-1", name: "", description: "", approvalMode: "single", slaHours: "8", approverUserIds: [],
  }]);
  const candidates = workflowApproverCandidates(data, moduleKey);
  const permittedCount = candidates.filter((c) => c.hasApprovePermission).length;
  const shown = onlyPermitted ? candidates.filter((c) => c.hasApprovePermission) : candidates;
  const moduleOptions = configuredModules(data).filter((m) => m.key !== "admin");
  // [WF] Đặc tả 18/09: gợi ý người duyệt theo TỪ KHOÁ (bỏ dấu như các màn khác) — tối đa 8 dòng cho modal gọn.
  const normApproverText = (value: unknown) => String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const suggestionsFor = (stepKey: string): Row[] => {
    const query = normApproverText(approverQuery[stepKey] ?? "").trim();
    if (!query) return [];
    return shown.filter((u) => [u.fullName, u.employeeCode, u.username, u.organizationName, u.department].some((value) => normApproverText(value).includes(query))).slice(0, 8);
  };
  const patchStep = (index: number, patch: Row) => setSteps((list) => list.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  const toggleApprover = (index: number, userId: string) => setSteps((list) => list.map((s, i) => {
    if (i !== index) return s;
    const current: string[] = Array.isArray(s.approverUserIds) ? s.approverUserIds : [];
    if (String(s.approvalMode) === "single") return { ...s, approverUserIds: current.includes(userId) ? [] : [userId] };
    return { ...s, approverUserIds: current.includes(userId) ? current.filter((x) => x !== userId) : [...current, userId] };
  }));
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!code.trim() || !name.trim()) return setError("Nhập mã và tên quy trình.");
    const stages: Row[] = [];
    for (let i = 0; i < steps.length; i++) {
      const s = steps[i];
      const users: string[] = Array.isArray(s.approverUserIds) ? s.approverUserIds : [];
      if (!String(s.name || "").trim()) return setError(`Bước ${i + 1} chưa có tên.`);
      if (!users.length) return setError(`Bước ${i + 1} (“${s.name}”) chưa chỉ định người duyệt.`);
      if (String(s.approvalMode) === "single" && users.length > 1)
        return setError(`Bước ${i + 1} chọn “Một người duyệt” thì chỉ được chỉ định đúng một người.`);
      stages.push({
        stepNo: i + 1, name: String(s.name).trim(), description: s.description,
        approvalMode: s.approvalMode, slaHours: Number(s.slaHours || 8),
        approverUserIds: users,
      });
    }
    const ok = await submit("save_workflow", {
      workflowId: row?.id, code: code.trim(), name: name.trim(), description,
      moduleKey, projectId, isDefault: isDefault ? 1 : 0, sortOrder: Number(sortOrder || 0), stages,
    });
    if (ok) close();
  }
  return <BaseModal title={row ? `Sửa quy trình: ${row.name}` : "Thêm quy trình phê duyệt"} note="Mỗi bước chọn cách xác nhận và chỉ định đích danh người duyệt." close={close}>
    <form onSubmit={save}>
      <div className="modal-body">
        {error && <div className="inline-alert">{error}</div>}
        <div className="form-grid">
          <label><span>Mã quy trình *</span><input value={code} onChange={(e) => setCode(e.target.value)} placeholder="WF-MUAHANG-02" required /></label>
          <label><span>Tên quy trình *</span><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Quy trình mua hàng rút gọn" required /></label>
          <label><span>Áp dụng cho chức năng</span><select value={moduleKey} onChange={(e) => { setModuleKey(e.target.value); }}>
            <option value="">— Dùng chung —</option>
            {moduleOptions.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
          </select></label>
          <label><span>Áp dụng cho dự án</span><select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            <option value="">— Toàn công ty —</option>
            {data.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select></label>
          <label><span>Thứ tự hiển thị</span><input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} /></label>
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
            <span style={{ margin: 0 }}>Là quy trình mặc định</span>
          </label>
          <label className="span-2"><span>Mô tả</span><input value={description} onChange={(e) => setDescription(e.target.value)} /></label>
        </div>
        <div style={{ marginTop: 14 }}><ListToolbar title={"CÁC BƯỚC DUYỆT"} note={<>{steps.length} bước · {candidates.length - permittedCount} người chưa có quyền duyệt trên chức năng này</>} extra={<><label className="secondary" style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 8px" }}>
              <input type="checkbox" checked={onlyPermitted} onChange={(e) => setOnlyPermitted(e.target.checked)} />
              <span style={{ margin: 0, fontSize: 12 }}>Chỉ hiện người có quyền duyệt</span>
            </label>
            <button type="button" className="primary" onClick={() => setSteps((list) => [...list, { key: `new-${Date.now()}`, name: "", description: "", approvalMode: "any_of", slaHours: "8", approverUserIds: [] }])}>＋ Thêm bước</button></>} /></div>
        {onlyPermitted && !shown.length && <div className="inline-alert">Chưa có ai được cấp quyền duyệt (canApprove) trên chức năng này. Bỏ chọn “Chỉ hiện người có quyền duyệt” để chỉ định thủ công.</div>}
        {steps.map((s, index) => {
          const selected: string[] = Array.isArray(s.approverUserIds) ? s.approverUserIds : [];
          return <section className="card" key={String(s.key)}>
            <ListToolbar title={<>BƯỚC {index + 1}</>} note={<>{selected.length} người duyệt được chỉ định</>} actions={<><button type="button" className="export-mini" disabled={index === 0} onClick={() => setSteps((list) => { const next = [...list]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; return next; })}>↑</button>
                <button type="button" className="export-mini" disabled={index === steps.length - 1} onClick={() => setSteps((list) => { const next = [...list]; [next[index + 1], next[index]] = [next[index], next[index + 1]]; return next; })}>↓</button>
                {steps.length > 1 && <button type="button" className="export-mini danger" onClick={() => setSteps((list) => list.filter((_, i) => i !== index))}>Xóa bước</button>}</>} />
            <div className="form-grid">
              <label><span>Tên bước *</span><input value={String(s.name || "")} onChange={(e) => patchStep(index, { name: e.target.value })} placeholder="CHT xác nhận nhu cầu" /></label>
              <label><span>Cách xác nhận *</span><select value={String(s.approvalMode || "single")} onChange={(e) => patchStep(index, { approvalMode: e.target.value, approverUserIds: e.target.value === "single" ? (Array.isArray(s.approverUserIds) ? s.approverUserIds.slice(0, 1) : []) : s.approverUserIds })}>
                <option value="single">Một người duyệt</option>
                <option value="any_of">Một trong nhiều người duyệt là qua</option>
                <option value="all_of">Tất cả người duyệt phải xác nhận</option>
              </select></label>
              <label><span>SLA (giờ)</span><input type="number" min="1" value={String(s.slaHours ?? 8)} onChange={(e) => patchStep(index, { slaHours: e.target.value })} /></label>
              <label><span>Mô tả bước</span><input value={String(s.description || "")} onChange={(e) => patchStep(index, { description: e.target.value })} /></label>
            </div>
                        <label><span>Tìm người duyệt (gõ tên / mã nhân viên / phòng ban)</span>
              <input value={approverQuery[String(s.key)] ?? ""} onChange={(e) => setApproverQuery((q) => ({ ...q, [String(s.key)]: e.target.value }))} placeholder="Ví dụ: Nguyễn, NV001, Kế hoạch…" />
            </label>
            {(approverQuery[String(s.key)] ?? "").trim().length > 0 && <div className="admin-mini-list">
              {suggestionsFor(String(s.key)).map((u) => <button type="button" key={u.id} className={selected.includes(String(u.id)) ? "is-selected" : ""} onClick={() => toggleApprover(index, String(u.id))}>
                <i className="mini-avatar">{initials(String(u.fullName || "NV"))}</i>
                <span><strong>{u.fullName}</strong><small>{u.employeeCode || u.username} · {u.organizationName || u.department || "—"}</small></span>
                <b>{selected.includes(String(u.id)) ? "✓ Đã chọn" : u.hasApprovePermission ? "Có quyền duyệt" : "Chưa có quyền duyệt"}</b>
              </button>)}
              {!suggestionsFor(String(s.key)).length && <div className="menu-drop-empty">Không tìm thấy người phù hợp.</div>}
            </div>}
            <div className="admin-mini-list">
              {selected.map((userId) => {
                const person = candidates.find((c) => String(c.id) === String(userId));
                return <button type="button" key={userId} className="is-selected" onClick={() => toggleApprover(index, String(userId))} title="Bấm để bỏ khỏi bước này">
                  <i className="mini-avatar">{initials(String(person?.fullName || "NV"))}</i>
                  <span><strong>{person?.fullName || userId}</strong><small>{person ? `${person.employeeCode || person.username} · ${person.organizationName || person.department || "—"}` : "Không còn trong danh sách ứng viên"}</small></span>
                  <b>✕ Bỏ</b>
                </button>;
              })}
              {!selected.length && <div className="menu-drop-empty">Chưa chỉ định người duyệt cho bước này.</div>}
            </div>
            {!selected.length && <div className="inline-alert">Bước {index + 1} chưa có người duyệt — theo chế độ CHỈ CẢNH BÁO, quy trình VẪN lưu được.</div>}
          </section>;
        })}
      </div>
      <footer className="modal-footer"><button className="secondary" type="button" onClick={close}>Hủy</button><button className="primary">{row ? "Lưu quy trình" : "Tạo quy trình"}</button></footer>
    </form>
  </BaseModal>;
}

export {
  WorkflowModal,
};