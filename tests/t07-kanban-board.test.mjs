// PHASE 3 (`T-07`) — HỢP ĐỒNG BOARD KANBAN: BA CHIỀU **TÁCH BẠCH** — Ưu tiên · Trạng thái · Phân công.
//
// Cách kiểm: (1) đọc `lib/ui-shared.tsx` để lấy ĐÚNG 12 trạng thái thật, đối chiếu cột Kanban phủ đủ và KHÔNG bịa trạng thái;
// (2) TRÍCH khối thuần giữa hai mốc `T07-PURE-BEGIN/END` trong `app/screens/WorkKanban.tsx`, dịch TS→JS bằng esbuild rồi CHẠY
// với fixtures để chứng minh BA CHIỀU ĐỘC LẬP (đổi ưu tiên ⇒ không đổi cột; đổi người ⇒ không đổi cột; chỉ `status` đổi cột);
// (3) kiểm KÉO-THẢ gọi ACTION THẬT `update_work_item_status` + cổng an toàn mô phỏng đúng luật backend.
//
// LƯU Ý: tệp này CỐ Ý không nằm trong `package.json` → `test:regression` giữ nguyên 69 ca.
// Chạy riêng:  node --test tests/t07-kanban-board.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import esbuild from "esbuild";

const read = (relative) => readFileSync(new URL("../" + relative, import.meta.url), "utf8");
const uiShared = read("lib/ui-shared.tsx");
const kanban = read("app/screens/WorkKanban.tsx");
const workCenter = read("app/screens/WorkCenter.tsx");
const route = read("scripts/system-route.mjs");

const BEGIN = "T07-PURE-BEGIN";
const END = "T07-PURE-END";
// Mỗi mốc phải xuất hiện ĐÚNG MỘT LẦN: nếu tên mốc bị nhắc lại trong chú thích, phép trích sẽ lấy nhầm đoạn giữa.
assert.equal(kanban.split(BEGIN).length - 1, 1, "Mốc T07-PURE-BEGIN phải xuất hiện đúng 1 lần");
assert.equal(kanban.split(END).length - 1, 1, "Mốc T07-PURE-END phải xuất hiện đúng 1 lần");
const blockStart = kanban.indexOf(BEGIN);
const blockEnd = kanban.indexOf(END, blockStart + BEGIN.length);
assert.ok(blockStart > 0 && blockEnd > blockStart, "WorkKanban.tsx thiếu khối thuần T07-PURE-BEGIN/END");
// Mốc nằm TRONG một dòng chú thích ⇒ bắt đầu trích từ SAU dòng mốc (nếu không, chính chữ mốc thành mã).
const block = kanban.slice(kanban.indexOf("\n", blockStart) + 1, blockEnd);
// Bỏ CHÚ THÍCH trước khi kiểm "tên trường đã chết" — tránh chính câu giải thích làm phép kiểm "đạt".
const blockCode = block.replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");

function loadPure() {
  const js = esbuild.transformSync(block, { loader: "ts" }).code;
  const names = ["KANBAN_COLUMNS", "KANBAN_PRIORITIES", "KANBAN_REASON_STATUSES", "kanbanColumnOf", "kanbanColumnRows", "kanbanPriorityOf", "kanbanAssigneeOf", "kanbanAssigneeBuckets", "kanbanFilterAssignee", "kanbanFilterPriority", "kanbanDropGuard", "kanbanManagerDepartments"];
  return new Function(`${js}\nreturn { ${names.join(", ")} };`)();
}

// Trạng thái THẬT — đọc từ nguồn nhãn của màn Công việc, KHÔNG chép tay.
const STATUS_LABELS_BLOCK = uiShared.slice(uiShared.indexOf("const WORK_STATUS_LABELS"), uiShared.indexOf("const WORK_CLOSED"));
const REAL_STATUSES = [...STATUS_LABELS_BLOCK.matchAll(/([A-Z][A-Z_]+):\s*"/g)].map((m) => m[1]);

const CARD = (id, extra = {}) => ({ id, taskNo: `CV-${id}`, title: `Việc ${id}`, assignedTo: "U1", assignedToName: "Người 1", assignedBy: "U9", assignedByName: "Quản lý", departmentCode: "KH", status: "NEW", priority: "normal", dueAt: "2026-09-30", progress: 0, ...extra });
const ROWS = [
  CARD("A", { status: "NEW", priority: "normal" }),
  CARD("B", { status: "NEW", priority: "high", assignedTo: "U2", assignedToName: "Người 2" }),
  CARD("C", { status: "IN_PROGRESS", priority: "urgent" }),
  CARD("D", { status: "BLOCKED", priority: "normal", assignedTo: "U2", assignedToName: "Người 2" }),
  CARD("E", { status: "COMPLETED", priority: "normal" }),
];
const MY = "U1";
const CTX = { myId: MY, isAdmin: false, managerDepartments: [], reason: "" };
const MANAGER = { myId: "U9", isAdmin: false, managerDepartments: ["KH"], reason: "" };

test("T-07 — CHIỀU 1 (TRẠNG THÁI): cột Kanban phủ ĐÚNG 12 trạng thái thật, mỗi trạng thái đúng MỘT cột", () => {
  const { KANBAN_COLUMNS, kanbanColumnOf } = loadPure();
  assert.equal(REAL_STATUSES.length, 12, `Đọc được ${REAL_STATUSES.length} trạng thái từ lib/ui-shared.tsx (kỳ vọng 12)`);
  const covered = KANBAN_COLUMNS.flatMap((c) => c.statuses);
  assert.deepEqual([...covered].sort(), [...REAL_STATUSES].sort(), "Cột Kanban phải phủ ĐÚNG tập trạng thái thật (không thiếu, không bịa)");
  assert.equal(new Set(covered).size, covered.length, "Một trạng thái bị đặt vào HAI cột");
  assert.equal(new Set(KANBAN_COLUMNS.map((c) => c.key)).size, KANBAN_COLUMNS.length, "Khoá cột bị trùng");
  for (const status of REAL_STATUSES) assert.ok(kanbanColumnOf(status), `Trạng thái ${status} không thuộc cột nào`);
  // `dropStatus` (trạng thái đích khi thả) phải là thành viên của CHÍNH cột đó — không suy diễn.
  for (const column of KANBAN_COLUMNS) assert.ok(column.statuses.includes(column.dropStatus), `Cột ${column.key}: dropStatus phải thuộc cột`);
  assert.equal(kanbanColumnOf("KHONG_TON_TAI"), null, "[đối chứng âm] trạng thái lạ phải trả null");
});

test("T-07 — CHIỀU 2 (ƯU TIÊN) tách khỏi CHIỀU 1: đổi ưu tiên KHÔNG đổi cột", () => {
  const { kanbanPriorityOf, kanbanColumnOf } = loadPure();
  const base = CARD("X", { status: "NEW", priority: "normal" });
  const urgent = { ...base, priority: "urgent" };
  assert.notEqual(kanbanPriorityOf(base).label, kanbanPriorityOf(urgent).label, "Nhãn ưu tiên không đổi theo `priority`");
  assert.equal(kanbanColumnOf(base.status).key, kanbanColumnOf(urgent.status).key, "Đổi ƯU TIÊN lại đổi CỘT ⇒ hai chiều bị trộn");
  assert.notEqual(kanbanPriorityOf(base).tone, kanbanPriorityOf(urgent).tone, "Màu ưu tiên phải khác nhau giữa các mức");
  const labels = loadPure().KANBAN_PRIORITIES.map((p) => p.key);
  assert.deepEqual(labels, ["critical", "urgent", "high", "normal", "low"], "Thiếu mức ưu tiên có thật trong DB (`critical`/`high`/`normal`)");
  assert.equal(kanbanPriorityOf({}).key, "normal", "Ưu tiên trống phải quy về `normal` (giá trị mặc định của DB)");
  assert.equal(kanbanPriorityOf({ priority: "la-hoac" }).key, "normal", "[đối chứng âm] ưu tiên lạ phải quy về mặc định");
});

test("T-07 — CHIỀU 3 (PHÂN CÔNG) tách khỏi CHIỀU 1/2: lọc theo người KHÔNG đổi cột, không đổi ưu tiên", () => {
  const { kanbanAssigneeBuckets, kanbanFilterAssignee, kanbanColumnRows } = loadPure();
  const buckets = kanbanAssigneeBuckets(ROWS);
  assert.deepEqual(buckets, [{ id: "U1", name: "Người 1", count: 3 }, { id: "U2", name: "Người 2", count: 2 }], "Bộ đếm theo người phân công sai");
  const onlyU2 = kanbanFilterAssignee(ROWS, "U2");
  assert.deepEqual(onlyU2.map((r) => r.id), ["B", "D"]);
  assert.deepEqual(kanbanFilterAssignee(ROWS, "").length, ROWS.length, "Không chọn người ⇒ phải trả về ĐỦ");
  // Cột vẫn là trạng thái: lọc người xong, tập cột không đổi về Ý NGHĨA (vẫn theo `status`).
  const allColumns = kanbanColumnRows(ROWS, "NEW").map((r) => r.id);
  const filteredColumns = kanbanColumnRows(onlyU2, "NEW").map((r) => r.id);
  assert.deepEqual(allColumns, ["A", "B"]);
  assert.deepEqual(filteredColumns, ["B"], "Lọc theo người phải chỉ THU HẸP trong cùng cột trạng thái");
  assert.ok(filteredColumns.every((id) => allColumns.includes(id)), "Lọc theo người làm thay đổi cột ⇒ trộn chiều Phân công với Trạng thái");
  // Tên người lấy từ trường THẬT `assignedToName`.
  assert.equal(buckets[0].name, ROWS.find((r) => r.assignedTo === "U1").assignedToName);
  assert.doesNotMatch(blockCode, /assigneeUserId|assigneeName\b/, "Khối Kanban còn dùng tên trường đã chết");
});

test("T-07 — BA CHIỀU KHÔNG TRỘN: cột là PHÂN HOẠCH của tập dòng (chỉ phụ thuộc `status`)", () => {
  const { KANBAN_COLUMNS, kanbanColumnRows, kanbanFilterPriority } = loadPure();
  const collected = KANBAN_COLUMNS.flatMap((c) => kanbanColumnRows(ROWS, c.key).map((r) => r.id));
  assert.deepEqual([...collected].sort(), ROWS.map((r) => r.id).sort(), "Hợp các cột phải bằng ĐÚNG tập dòng (không mất, không thêm)");
  assert.equal(new Set(collected).size, collected.length, "Một việc xuất hiện ở HAI cột ⇒ cột không còn là trạng thái thuần");
  // Lọc ưu tiên cũng chỉ THU HẸP, không đổi cột.
  const highOnly = kanbanFilterPriority(ROWS, "high").map((r) => r.id);
  assert.deepEqual(highOnly, ["B"]);
  assert.ok(highOnly.every((id) => kanbanColumnRows(ROWS, "NEW").map((r) => r.id).includes(id)));
});

test("T-07 — KÉO-THẢ gọi ACTION THẬT, không chỉ đổi giao diện", () => {
  assert.match(kanban, /draggable=\{!busy\}/, "Thẻ chưa bật kéo");
  assert.match(kanban, /onDrop=\{/, "Cột chưa nhận thả");
  assert.match(kanban, /onDragStart=\{/, "Thẻ chưa ghi nhận việc đang kéo");
  assert.match(kanban, /kanbanDropGuard\(/, "Chưa kiểm cổng an toàn trước khi gọi action");
  assert.match(kanban, /onMove\(row\.id, column\.dropStatus, reason\)/, "Thả xuống cột phải gọi `onMove` với trạng thái đích của CHÍNH cột đó");
  // Hợp đồng với màn Công việc: `onMove` được cấp bằng ACTION THẬT `update_work_item_status`.
  assert.match(workCenter, /action\("update_work_item_status",\s*\{\s*workItemId/, "WorkCenter chưa nối `onMove` vào action thật `update_work_item_status`");
  assert.match(route, /case "update_work_item_status"|"update_work_item_status"/, "Action `update_work_item_status` không tồn tại ở backend");
  // Không được chuyển trạng thái bằng state cục bộ (đổi giao diện mà không lưu).
  assert.doesNotMatch(kanban.replace(/\/\/[^\n]*/g, ""), /setRows\(|setStatus\(/, "Có dấu hiệu đổi trạng thái bằng state cục bộ thay vì gọi action thật");
});

test("T-07 — CỔNG AN TOÀN kéo-thả mô phỏng ĐÚNG luật backend (4 nhánh chặn + 1 nhánh cho phép)", () => {
  const { kanbanDropGuard, kanbanManagerDepartments } = loadPure();
  const mine = CARD("M", { status: "NEW", assignedTo: MY });
  // (1) người thực hiện được chuyển tiến độ
  assert.equal(kanbanDropGuard(mine, "IN_PROGRESS", CTX).ok, true);
  assert.equal(kanbanDropGuard(mine, "SUBMITTED", CTX).ok, true);
  // (2) người KHÔNG liên quan bị chặn
  const others = CARD("O", { status: "NEW", assignedTo: "U7" });
  assert.equal(kanbanDropGuard(others, "IN_PROGRESS", CTX).code, "KHONG_CO_QUYEN");
  // (3) người thực hiện KHÔNG được tự xác nhận Hoàn thành (đúng luật backend dòng 1227)
  assert.equal(kanbanDropGuard(mine, "COMPLETED", CTX).code, "CHI_TRUONG_PHONG_XAC_NHAN");
  assert.equal(kanbanDropGuard(mine, "COMPLETED", MANAGER).ok, true, "Trưởng phòng của phòng đó phải xác nhận được");
  // (4) trạng thái Chờ/Blocked/Tạm dừng BẮT BUỘC có lý do
  assert.equal(kanbanDropGuard(mine, "BLOCKED", CTX).code, "THIEU_LY_DO");
  assert.equal(kanbanDropGuard(mine, "BLOCKED", { ...CTX, reason: "Chờ nhà cung cấp" }).ok, true);
  // (5) trạng thái không hợp lệ / trùng trạng thái
  assert.equal(kanbanDropGuard(mine, "KHONG_CO", CTX).code, "STATUS_KHONG_HOP_LE");
  assert.equal(kanbanDropGuard(mine, "NEW", CTX).code, "TRUNG_TRANG_THAI");
  // Suy trưởng phòng phải khớp backend: `kh_truong`→KH, `da_truong`→DA, admin→cả 3; người khác rỗng.
  assert.deepEqual(kanbanManagerDepartments({ role: "kh_truong", roleBase: "procurement" }), ["KH"]);
  assert.deepEqual(kanbanManagerDepartments({ role: "da_truong", roleBase: "project" }), ["DA"]);
  assert.deepEqual(kanbanManagerDepartments({ role: "kh_nv", roleBase: "procurement" }), []);
  assert.deepEqual(kanbanManagerDepartments({ role: "admin" }), ["KH", "DA", "BCH"]);
  assert.deepEqual(kanbanManagerDepartments({ role: "thu_kho" }), [], "[đối chứng âm] thủ kho không được coi là trưởng phòng");
});

test("T-07 — Board được GẮN vào màn Công việc (import + render), phạm vi theo T-06", () => {
  assert.match(workCenter, /import \{[^}]*WorkKanban[^}]*\} from "@\/app\/screens\/WorkKanban";/, "WorkCenter chưa import board Kanban");
  assert.match(workCenter, /<WorkKanban\b/, "WorkCenter chưa render board Kanban");
  assert.match(workCenter, /scopeNote=\{/, "Board chưa nhận ghi chú phạm vi (T-06)");
  assert.match(workCenter, /managerDepartments=\{kanbanManagerDepartments\(/, "Chưa truyền phòng mà người dùng là trưởng phòng");
  // Board phải là một PHẦN của màn Công việc, không mở màn/menu mới (T-01 đã chốt 5 mục menu).
  assert.equal((workCenter.match(/const WORK_TABS = \["Cá nhân", "Phòng ban", "Giao việc", "Dashboard", "Báo cáo"\];/g) || []).length, 1, "Board không được đổi dải 5 tab đã chốt ở T-01");
});

test("T-07 — HAI nơi suy «trưởng phòng» (T-06 phạm vi ↔ T-07 cổng kéo-thả) PHẢI cho CÙNG kết quả", () => {
  // Vì sao: `workScopeOf` (T-06, lọc phạm vi) và `kanbanManagerDepartments` (T-07, cổng an toàn) cùng mô phỏng
  // `isDepartmentManager` của backend. Hai bản sao KHÔNG được lệch — nếu lệch thì một bên nới quyền hoặc một bên
  // chặn oan. Test này biến sự trùng lặp thành BẤT BIẾN được kiểm.
  const { kanbanManagerDepartments } = loadPure();
  const wc = workCenter;
  const b = wc.indexOf("T06-PURE-BEGIN");
  const e = wc.indexOf("T06-PURE-END", b);
  const t06 = wc.slice(wc.indexOf("\n", b) + 1, e);
  const scopeApi = new Function(`${esbuild.transformSync(t06, { loader: "ts" }).code}\nreturn { workScopeOf };`)();
  for (const me of [{ role: "kh_truong" }, { role: "da_truong" }, { role: "kh_nv", roleBase: "procurement" }, { role: "admin" }, { role: "thu_kho", organizationCode: "BCH" }]) {
    assert.deepEqual(scopeApi.workScopeOf({ user: me }).managerDepartments, kanbanManagerDepartments(me),
      `Lệch cách suy «trưởng phòng» cho vai trò ${me.role}`);
  }
});
