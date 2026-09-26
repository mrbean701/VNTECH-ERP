// PHASE 3 (`T-07`) — BOARD KANBAN CỦA MÀN CÔNG VIỆC: **BA CHIỀU TÁCH BẠCH, KHÔNG TRỘN**
//
//   • CỘT (cấu trúc bảng)  = **TRẠNG THÁI** (`status`)      — nhãn lấy từ `WORK_STATUS_LABELS` (nguồn thật của màn Công việc),
//                                                            phủ ĐÚNG 12 trạng thái đang có, test t07 đối chiếu lại từng khoá.
//   • NHÃN/MÀU trên thẻ    = **ƯU TIÊN** (`priority`)       — `KANBAN_PRIORITIES` (giá trị thật của cột `work_items.priority`:
//                                                            `critical|high|normal` theo `ORDER BY` của bootstrap, `urgent` theo form tạo việc).
//   • LỌC / NHÓM           = **PHÂN CÔNG** (`assignedTo`)   — ô chọn người (`assignedTo` + tên thật `assignedToName`) kèm số việc mỗi người.
//
// VÌ SAO KHÔNG GỘP: đề bài `T-07` yêu cầu "phân biệt rõ Ưu tiên / Trạng thái / Phân công". Ba chiều này dùng BA trường khác nhau
// (`status` · `priority` · `assignedTo`) và ba phép kiểm ĐỘC LẬP ở tầng hàm thuần (test t07 chạy fixtures chứng minh: đổi ưu tiên
// KHÔNG đổi cột, đổi người KHÔNG đổi cột, chỉ `status` mới đổi cột).
//
// KÉO-THẢ: có làm, bằng HTML5 drag&drop, và **GỌI ACTION THẬT** `update_work_item_status` (đã tồn tại ở `scripts/system-route.mjs:1227`)
// — KHÔNG chỉ đổi giao diện. Trước khi gọi, `kanbanDropGuard` mô phỏng ĐÚNG luật backend (cùng tệp, dòng 1227):
//   (a) chỉ người thực hiện hoặc trưởng phòng của phòng đó được đổi (§ `task.assigned_to!==user.id && !manager` ⇒ chặn),
//   (b) `COMPLETED` chỉ trưởng phòng/quản trị xác nhận (người thực hiện chỉ được "Gửi kiểm tra"),
//   (c) trạng thái Chờ/Blocked/Tạm dừng BẮT BUỘC có lý do.
// Hàm thuần nằm giữa HAI MỐC ĐÁNH DẤU trong tệp này (xem hằng số `BEGIN`/`END` ở `tests/t07-kanban-board.test.mjs`)
// để test TRÍCH RA và CHẠY THẬT (không chỉ đọc chữ). Mỗi mốc chỉ được xuất hiện ĐÚNG MỘT LẦN trong tệp.

import { StatusBadge } from "@/app/components/ui";
import { daysFromToday } from "@/lib/date-helpers";
import { UI_TODAY, WORK_STATUS_LABELS, date } from "@/lib/ui-shared";
import type { Row } from "@/lib/ui-shared";
import { useState } from "react";

// -------------------------------------------------------------------------------------------------
// T07-PURE-BEGIN
// KHỐI THUẦN (JS/TS, KHÔNG JSX, KHÔNG import) — hợp đồng ba chiều + cổng an toàn kéo-thả.
// -------------------------------------------------------------------------------------------------

// CHIỀU 1 — TRẠNG THÁI: cột của bảng. Mỗi trạng thái THẬT có đúng MỘT cột.
// `dropStatus` = trạng thái đích khi thả vào cột (cột gộp nhiều trạng thái thì lấy trạng thái đại diện — khai báo tường minh,
// không suy diễn); test t07 kiểm `dropStatus` LUÔN thuộc `statuses` của chính cột đó.
const KANBAN_COLUMNS = [
  { key: "NEW", label: "Mới", statuses: ["NEW"], dropStatus: "NEW" },
  { key: "DOING", label: "Đang làm", statuses: ["IN_PROGRESS", "REWORK"], dropStatus: "IN_PROGRESS" },
  { key: "WAITING", label: "Chờ / Bị chặn", statuses: ["WAITING_SUPPLIER", "WAITING_CLIENT", "WAITING_APPROVAL", "WAITING_PROJECT", "BLOCKED", "ON_HOLD"], dropStatus: "BLOCKED" },
  { key: "SUBMITTED", label: "Đã trình", statuses: ["SUBMITTED"], dropStatus: "SUBMITTED" },
  { key: "CLOSED", label: "Hoàn thành / Đã huỷ", statuses: ["COMPLETED", "CANCELLED"], dropStatus: "COMPLETED" },
];

// CHIỀU 2 — ƯU TIÊN: nhãn + màu trên thẻ. `rank` chỉ dùng để SẮP xếp trong cột, KHÔNG dùng để chọn cột.
const KANBAN_PRIORITIES = [
  { key: "critical", label: "Khẩn cấp", tone: "red", rank: 0 },
  { key: "urgent", label: "Khẩn", tone: "red", rank: 1 },
  { key: "high", label: "Cao", tone: "orange", rank: 2 },
  { key: "normal", label: "Bình thường", tone: "blue", rank: 3 },
  { key: "low", label: "Thấp", tone: "slate", rank: 4 },
];

// Trạng thái BẮT BUỘC có lý do (đúng tập `TASK_WAITING` của backend — scripts/system-route.mjs:249).
const KANBAN_REASON_STATUSES = ["WAITING_SUPPLIER", "WAITING_CLIENT", "WAITING_APPROVAL", "WAITING_PROJECT", "BLOCKED", "ON_HOLD"];
const KANBAN_KNOWN_STATUSES = KANBAN_COLUMNS.flatMap((column) => column.statuses);

function kanbanColumnOf(status: unknown) {
  const key = String(status || "");
  return KANBAN_COLUMNS.find((column) => column.statuses.includes(key)) || null;
}

function kanbanColumnRows(rows: Row[], columnKey: string): Row[] {
  const column = KANBAN_COLUMNS.find((item) => item.key === columnKey);
  if (!column) return [];
  return rows.filter((row) => column.statuses.includes(String(row.status || "")));
}

function kanbanPriorityOf(row: Row) {
  const key = String(row.priority || "normal");
  return KANBAN_PRIORITIES.find((item) => item.key === key) || KANBAN_PRIORITIES[3];
}

function kanbanAssigneeOf(row: Row) {
  return { id: String(row.assignedTo || ""), name: String(row.assignedToName || "—") };
}

/** PHÂN CÔNG — danh sách người + SỐ VIỆC mỗi người, suy TRỰC TIẾP từ `assignedTo`/`assignedToName` của chính các thẻ đang có
 *  (không cần `data.users` — payload của người dùng thường KHÔNG chứa khoá này). */
function kanbanAssigneeBuckets(rows: Row[]) {
  const map = new Map<string, { id: string; name: string; count: number }>();
  for (const row of rows) {
    const who = kanbanAssigneeOf(row);
    if (!who.id) continue;
    const found = map.get(who.id);
    if (found) found.count += 1;
    else map.set(who.id, { id: who.id, name: who.name, count: 1 });
  }
  return [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "vi"));
}

function kanbanFilterAssignee(rows: Row[], assigneeId: string): Row[] {
  return !assigneeId ? rows : rows.filter((row) => String(row.assignedTo || "") === assigneeId);
}

function kanbanFilterPriority(rows: Row[], priorityKey: string): Row[] {
  return !priorityKey ? rows : rows.filter((row) => String(row.priority || "normal") === priorityKey);
}

/** Sắp trong cột: ưu tiên cao trước, rồi hạn gần nhất, rồi mới tới mã việc (ổn định). */
function kanbanSortInColumn(rows: Row[]): Row[] {
  return [...rows].sort((a, b) =>
    kanbanPriorityOf(a).rank - kanbanPriorityOf(b).rank
    || String(a.dueAt || "9999").localeCompare(String(b.dueAt || "9999"))
    || String(a.taskNo || "").localeCompare(String(b.taskNo || "")));
}

/** Trưởng phòng của NHỮNG phòng nào — mô phỏng `isDepartmentManager` của backend (scripts/system-route.mjs:251). */
function kanbanManagerDepartments(me: Row) {
  const role = String(me.role || "");
  const base = String(me.roleBase || me.role || "");
  if (role === "admin" || base === "admin") return ["KH", "DA", "BCH"];
  return [role === "kh_truong" ? "KH" : "", role === "da_truong" ? "DA" : ""].filter(Boolean);
}

/** CỔNG AN TOÀN KÉO-THẢ. Trả `{ ok, code, message }` — UI chỉ gọi action thật khi `ok === true`. */
function kanbanDropGuard(row: Row, targetStatus: string, context: { myId: string; isAdmin?: boolean; managerDepartments?: string[]; reason?: string }) {
  const target = String(targetStatus || "").toUpperCase();
  if (!KANBAN_KNOWN_STATUSES.includes(target)) return { ok: false, code: "STATUS_KHONG_HOP_LE", message: `Trạng thái đích không hợp lệ: ${target}` };
  if (String(row.status || "") === target) return { ok: false, code: "TRUNG_TRANG_THAI", message: "Việc đã ở đúng trạng thái này." };
  const managers = context.managerDepartments || [];
  const manager = Boolean(context.isAdmin) || managers.includes(String(row.departmentCode || ""));
  if (String(row.assignedTo || "") !== String(context.myId || "") && !manager) {
    return { ok: false, code: "KHONG_CO_QUYEN", message: "Chỉ người thực hiện hoặc trưởng phòng của phòng đó được đổi trạng thái." };
  }
  if (target === "COMPLETED" && !manager) {
    return { ok: false, code: "CHI_TRUONG_PHONG_XAC_NHAN", message: "Người thực hiện chỉ được Gửi kiểm tra; trưởng phòng/quản trị mới xác nhận Hoàn thành." };
  }
  if (KANBAN_REASON_STATUSES.includes(target) && !String(context.reason || "").trim()) {
    return { ok: false, code: "THIEU_LY_DO", message: "Trạng thái Chờ/Bị chặn/Tạm dừng bắt buộc phải có lý do." };
  }
  return { ok: true, code: "OK", message: `Đủ điều kiện chuyển sang ${target}.` };
}

// T07-PURE-END

function WorkKanban({ rows, busy, myId, isAdmin, managerDepartments, scopeNote, onMove }: {
  rows: Row[];
  busy: boolean;
  myId: string;
  isAdmin: boolean;
  managerDepartments: string[];
  scopeNote: string;
  onMove: (workItemId: unknown, status: string, reason: string) => Promise<boolean>;
}) {
  const [assignee, setAssignee] = useState("");
  const [priority, setPriority] = useState("");
  const [reason, setReason] = useState("");
  const [dragId, setDragId] = useState("");
  const [notice, setNotice] = useState("");

  // BA CHIỀU ĐỘC LẬP: lọc theo PHÂN CÔNG rồi theo ƯU TIÊN; CỘT vẫn là TRẠNG THÁI (không lọc cột theo hai chiều kia).
  const byAssignee = kanbanFilterAssignee(rows, assignee);
  const shown = kanbanFilterPriority(byAssignee, priority);
  const buckets = kanbanAssigneeBuckets(rows);

  async function dropTo(column: { key: string; label: string; dropStatus: string }) {
    const row = rows.find((item) => String(item.id) === dragId);
    setDragId("");
    if (!row) return;
    const guard = kanbanDropGuard(row, column.dropStatus, { myId, isAdmin, managerDepartments, reason });
    if (!guard.ok) { setNotice(`${String(row.taskNo || "")}: ${guard.message}`); return; }
    const ok = await onMove(row.id, column.dropStatus, reason);
    setNotice(ok ? `Đã chuyển ${String(row.taskNo || "")} sang «${column.label}».` : `${String(row.taskNo || "")}: máy chủ từ chối — xem thông báo hệ thống.`);
  }

  return <div className="stack">
    <section className="card">
      <div className="card-head">
        <div>
          <h3>Board Kanban công việc</h3>
          <p className="muted">BA CHIỀU TÁCH BẠCH — <b>Cột = Trạng thái</b> · <b>Nhãn thẻ = Ưu tiên</b> · <b>Bộ lọc = Phân công</b>. {scopeNote}</p>
        </div>
      </div>
      <div className="form-grid">
        <label><span>Phân công (lọc theo người được giao)</span>
          <select name="kanbanAssignee" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
            <option value="">— Tất cả người được phân công ({rows.length} việc) —</option>
            {buckets.map((who) => <option key={who.id} value={who.id}>{who.name} · {who.count} việc</option>)}
          </select>
        </label>
        <label><span>Ưu tiên (lọc theo nhãn ưu tiên)</span>
          <select name="kanbanPriority" value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="">— Mọi mức ưu tiên —</option>
            {KANBAN_PRIORITIES.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
          </select>
        </label>
        <label className="full"><span>Lý do (bắt buộc khi thả vào cột Chờ / Bị chặn)</span>
          <input name="kanbanReason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ví dụ: chờ nhà cung cấp xác nhận giá"/>
        </label>
      </div>
      <p className="muted">Kéo-thả gọi action thật <b>update_work_item_status</b>; điều kiện được kiểm trước bằng đúng luật máy chủ (người thực hiện/trưởng phòng · Hoàn thành chỉ trưởng phòng · trạng thái Chờ phải có lý do).</p>
      {notice && <p className="red-text" role="status">{notice}</p>}
    </section>

    <div className="kanban-board">
      {KANBAN_COLUMNS.map((column) => {
        const columnRows = kanbanSortInColumn(kanbanColumnRows(shown, column.key));
        const total = kanbanColumnRows(rows, column.key).length;
        return <section key={column.key} className="card kanban-column"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); void dropTo(column); }}>
          <div className="card-head">
            <div>
              <h3>{column.label}</h3>
              <p className="muted">{columnRows.length} / {total} việc · trạng thái: {column.statuses.map((key) => WORK_STATUS_LABELS[key] || key).join(" · ")}</p>
            </div>
          </div>
          {columnRows.map((row) => {
            const who = kanbanAssigneeOf(row);
            const prio = kanbanPriorityOf(row);
            const late = daysFromToday(row.dueAt);
            const progress = Number(row.progress || 0);
            return <article key={String(row.id)} className="kanban-card" draggable={!busy}
              onDragStart={() => setDragId(String(row.id))} onDragEnd={() => setDragId("")}>
              <header>
                <strong className="code">{row.taskNo}</strong>
                <span className={`kanban-priority ${prio.tone}`} data-priority={prio.key}>{prio.label}</span>
              </header>
              <p>{row.title}</p>
              <small>{who.name} · {row.projectCode || "—"} · {row.dueAt ? date(row.dueAt) : "không hạn"}</small>
              {late !== null && late > 0 && <small className="red-text">Quá hạn {late} ngày</small>}
              <div className="task-bar"><span><i style={{ width: `${progress}%` }} /></span><b>{progress}%</b></div>
              <StatusBadge value={WORK_STATUS_LABELS[String(row.status)] || String(row.status || "—")}/>
            </article>;
          })}
          {!columnRows.length && <p className="muted">Không có việc trong cột này.</p>}
        </section>;
      })}
    </div>
    <p className="muted">Hôm nay {UI_TODAY} — thẻ hiển thị: mã việc · ưu tiên · người được phân công · dự án · hạn · tiến độ · trạng thái.</p>
  </div>;
}

export { KANBAN_COLUMNS, KANBAN_PRIORITIES, kanbanAssigneeBuckets, kanbanColumnOf, kanbanColumnRows, WorkKanban, kanbanDropGuard, kanbanFilterAssignee, kanbanFilterPriority, kanbanManagerDepartments, kanbanPriorityOf, kanbanSortInColumn };
