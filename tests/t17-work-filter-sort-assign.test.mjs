// ⭐ T-17 (⚠️ ĐỔI TÊN từ `t16` → `t17` lúc 17:00 09/10/2026 — ⛔ TRÁNH TRÙNG SỐ với `tests/t16-java-sql-textblock-format.test.mjs`
//  ① «*thêm filter vào 2 tab **Của tôi - Đã giao**: lọc theo **trạng thái**, sắp xếp theo **trạng thái - ngày
//     hoàn thành - mức độ ưu tiên***»
//  ② «*tab **Đã giao**: modal Tạo công việc ở đây sẽ là modal tạo việc cho **NGƯỜI KHÁC** giống như tab
//     **Giao việc** có bảng Giao việc cho nhân viên*»
// ⚠️ Test này khoá: (a) HÀM THUẦN `sapXepWork` chạy THẬT (⚠️ ⛔ không chỉ đọc chữ — kèm ĐỐI CHỨNG ÂM),
//   (b) dây nối giao diện (filters/sort/nút theo nhóm), (c) ⭐ BẤT BIẾN TÁI DÙNG: **⛔ CHỈ 1 bản form** giao việc.
// ⚠️ BẮT BUỘC chạy bằng: `node --import tsx --test tests/t17-work-filter-sort-assign.test.mjs`
//   (⚠️ vì test **IMPORT thẳng `app/screens/WorkCenter.tsx`** để chạy HÀM THẬT `sapXepWork` —
//    bỏ `--import tsx` sẽ chết `ERR_UNKNOWN_FILE_EXTENSION`; ⭐ bộ `npm run test:regression` đã dùng đúng loader này)
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const wc = readFileSync(new URL("app/screens/WorkCenter.tsx", root), "utf8");
const { sapXepWork, WORK_SORT_OPTIONS, WORK_PRIORITY_RANK } = await import(
  new URL("app/screens/WorkCenter.tsx", root).href
);

const R = (o) => ({ assignedTo: "u1", assignedBy: "u1", ...o }); // khuôn dòng rút gọn
const DS = [
  R({ title: "a", status: "NEW", priority: "normal", completedAt: null }),
  R({ title: "b", status: "COMPLETED", priority: "critical", completedAt: "2026-10-09T10:00:00.000Z" }),
  R({ title: "c", status: "IN_PROGRESS", priority: "urgent", completedAt: null }),
  R({ title: "d", status: "COMPLETED", priority: "low", completedAt: "2026-10-05T10:00:00.000Z" }),
];

test("T17 — LỌC + SẮP XẾP: `sapXepWork` chạy THẬT trên dữ liệu thử (kèm đối chứng âm)", () => {
  // ① «Mặc định» = ⭐ NGUYÊN thứ tự máy chủ (⛔ KHÔNG được đổi hành vi cũ)
  assert.equal(sapXepWork(DS, "default"), DS, "`default` phải trả NGUYÊN mảng gốc (hành vi cũ ⛔ không đổi)");
  assert.deepEqual(sapXepWork(DS, "default").map((r) => r.title), ["a", "b", "c", "d"]);
  // ② SẮP THEO TRẠNG THÁI
  assert.deepEqual(sapXepWork(DS, "status").map((r) => r.status), ["COMPLETED", "COMPLETED", "IN_PROGRESS", "NEW"]);
  // ③ NGÀY HOÀN THÀNH (mới → cũ): dòng CHƯA xong (`completedAt` rỗng) phải xuống CUỐI
  assert.deepEqual(sapXepWork(DS, "completed_desc").map((r) => r.title), ["b", "d", "a", "c"]);
  // ④ NGÀY HOÀN THÀNH (cũ → mới)
  assert.deepEqual(sapXepWork(DS, "completed_asc").map((r) => r.title), ["d", "b", "a", "c"]);
  // ⑤ MỨC ĐỘ ƯU TIÊN: critical → urgent → high → normal → low
  assert.deepEqual(sapXepWork(DS, "priority").map((r) => r.priority), ["critical", "urgent", "normal", "low"]);
  // ⑥ ⛔ BẤT BIẾN: KHÔNG sửa mảng vào (hàm phải làm việc trên BẢN SAO)
  const goc = DS.map((r) => r.title);
  sapXepWork(DS, "priority");
  assert.deepEqual(DS.map((r) => r.title), goc, "⛔ `sapXepWork` KHÔNG được sửa mảng truyền vào");
  // ⑦ ĐỐI CHỨNG ÂM: khoá sắp xếp LẠ ⇒ trả nguyên thứ tự (⛔ không tự bịa thứ tự)
  assert.deepEqual(sapXepWork(DS, "khong-ton-tai").map((r) => r.title), ["a", "b", "c", "d"]);
  // ⑧ Lựa chọn sắp xếp trên toolbar phải PHỦ ĐỦ 3 tiêu chí user yêu cầu
  const vals = WORK_SORT_OPTIONS.map((o) => o.value);
  for (const v of ["status", "completed_desc", "completed_asc", "priority"]) {
    assert.ok(vals.includes(v), `Thiếu lựa chọn sắp xếp \`${v}\` (user yêu cầu trạng thái · ngày hoàn thành · ưu tiên)`);
  }
  assert.equal(typeof WORK_PRIORITY_RANK.critical, "number", "Thiếu hạng ưu tiên `critical`");
});

test("T17 — BỘ LỌC TRẠNG THÁI + SẮP XẾP nối ĐÚNG vào toolbar và bảng (2 tab dùng CHUNG)", () => {
  // ① dùng ĐÚNG 2 prop CHUẨN của `ListToolbar` (⛔ không tự dựng ô lọc riêng ⇒ ⛔ không lệch khuôn §5)
  assert.match(wc, /filters=\{\[\{ key: "status", label: "Trạng thái", value: statusFilter, onChange: setStatusFilter, options: statusOptions \}\]\}/,
    "Toolbar phải có BỘ LỌC TRẠNG THÁI nối vào state thật");
  assert.match(wc, /sort=\{\{ value: sortKey, onChange: setSortKey, options: WORK_SORT_OPTIONS \}\}/,
    "Toolbar phải có SẮP XẾP nối vào state thật");
  // ② 2 state dùng CHUNG cho CẢ 2 nhóm («Của tôi» + «Đã giao»)
  assert.match(wc, /const \[statusFilter, setStatusFilter\] = useState\("ALL"\)/);
  assert.match(wc, /const \[sortKey, setSortKey\] = useState\("default"\)/);
  // ③ lọc TRƯỚC rồi mới sắp xếp, và BẢNG đọc tập đã lọc (⛔ không đọc thẳng `personalViewRows`)
  assert.match(wc, /const rowsSauLoc = personalViewRows\.filter\(\(row\) => statusFilter === "ALL" \|\| String\(row\.status\) === statusFilter\)/,
    "Phải LỌC theo trạng thái trên tập đang xem");
  assert.match(wc, /const rowsHienThi = sapXepWork\(rowsSauLoc, sortKey\)/, "Phải SẮP XẾP sau khi lọc");
  assert.match(wc, /<TaskTable rows=\{find\(rowsHienThi\)\}/, "Bảng phải đọc tập ĐÃ LỌC + ĐÃ SẮP XẾP");
  // ④ lựa chọn trạng thái sinh từ DỮ LIỆU THẬT (⛔ không có lựa chọn rỗng/dead option)
  assert.match(wc, /\[\.\.\.new Set\(personalViewRows\.map\(\(row\) => String\(row\.status \|\| ""\)\)\)\]/,
    "Lựa chọn trạng thái phải sinh từ dữ liệu thật đang có");
  assert.match(wc, /WORK_STATUS_LABELS\[s\] \|\| statusLabel\(s\)/, "Nhãn trạng thái phải dùng nguồn CHUNG (⛔ không khai lại)");
});

test("T17 — «Đã giao»: nút mở MODAL GIAO VIỆC CHO NGƯỜI KHÁC (⛔ không mở modal tự tạo việc)", () => {
  // ① cổng quyền ĐỔI THEO NHÓM: «Của tôi» ⇒ `canSelf` · «Đã giao» ⇒ `canAssign` (⛔ thiếu quyền ⇒ ⛔ không render nút)
  assert.match(wc, /const canOpenCreate = personalGroup === "assignedOut" \? canAssign : canSelf;/,
    "Cổng quyền nút phải đổi theo nhóm đang xem");
  assert.match(wc, /secondaryActions=\{canOpenCreate \? <PermissionGuard allow=\{canOpenCreate\}/,
    "Nút phải dùng cổng `canOpenCreate` (⛔ không hardcode `canSelf`)");
  // ② HÀNH ĐỘNG: nhóm «Đã giao» ⇒ mở MODAL GIAO VIỆC, các nhóm khác ⇒ modal TỰ TẠO VIỆC (hành vi cũ ⛔ không đổi)
  assert.match(wc, /onClick=\{\(\) => \(personalGroup === "assignedOut" \? setAssignOpen\(true\) : setCreateOpen\(true\)\)\}/,
    "Nút phải mở MODAL GIAO VIỆC khi đang ở nhóm «Đã giao»");
  assert.match(wc, /const \[assignOpen, setAssignOpen\] = useState\(false\)/, "Thiếu state `assignOpen`");
  // ③ có MODAL giao việc + nó DÙNG LẠI form của tab «Giao việc»
  assert.match(wc, /data-vntech="work-assign-modal"/, "Thiếu MODAL «Giao việc cho nhân viên»");
  const modal = wc.slice(wc.indexOf('data-vntech="work-assign-modal"'));
  assert.match(modal.slice(0, 900), /<AssignWorkForm /, "MODAL giao việc phải DÙNG LẠI `AssignWorkForm` (⛔ không viết form thứ hai)");
  // ④ ⭐ BẤT BIẾN TÁI DÙNG: các trường **RIÊNG của form GIAO VIỆC** chỉ được khai ĐÚNG 1 LẦN trong toàn tệp
  //    (⚠️ `requiredOutput` ⛔ KHÔNG dùng để kiểm vì modal «Tạo công việc cho TÔI» cũng có ô này — hợp lệ)
  for (const field of ['name="departmentCode"', 'name="assignedTo"']) {
    const n = (wc.match(new RegExp(field.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length;
    assert.equal(n, 1, `Trường \`${field}\` phải khai ĐÚNG 1 LẦN (⚠️ 2 bản form ⇒ dễ lệch nhau như \`BUG-D10\`)`);
  }
  // ④b `AssignWorkForm` phải được ĐỊNH NGHĨA 1 lần và DÙNG ở ĐÚNG 2 chỗ (card tab «Giao việc» + MODAL «Đã giao»)
  const soLanDung = (wc.match(/<AssignWorkForm /g) || []).length;
  assert.equal(soLanDung, 2, `\`AssignWorkForm\` phải được dùng ĐÚNG 2 chỗ (card tab 4 + modal «Đã giao»), đang có ${soLanDung}`);
  // ⑤ nộp modal phải gọi `action` TRỰC TIẾP (⛔ `send` trả `Promise<void>` ⇒ ⛔ không biết thành công để đóng modal)
  assert.match(wc, /async function submitAssignWork\(form: HTMLFormElement\) \{/);
  const fn = wc.slice(wc.indexOf("async function submitAssignWork"), wc.indexOf("async function submitSelfWork"));
  assert.match(fn, /await action\("create_work_item"/, "`submitAssignWork` phải gọi `action(\"create_work_item\"` TRỰC TIẾP");
  assert.ok(!/send\(/.test(fn), "⛔ `submitAssignWork` KHÔNG được dùng `send` (⛔ không biết thành công ⇒ ⛔ không đóng modal)");
  assert.match(fn, /if \(ok\) \{ form\.reset\(\); setAssignOpen\(false\); refresh\(\); \}/, "Thành công ⇒ reset form + ĐÓNG modal + refresh");
  // ⑥ tab «Giao việc» ⛔ KHÔNG bị đổi hành vi: vẫn gọi `send("create_work_item", …)` và vẫn là CARD (⛔ không modal)
  assert.match(wc, /void send\("create_work_item", \{ departmentCode: fd\.get\("departmentCode"\)/,
    "Tab «Giao việc» vẫn phải nộp bằng `send(...)` (hành vi cũ ⛔ không đổi)");
  assert.match(wc, /title="Giao việc cho nhân viên"/, "Card «Giao việc cho nhân viên» ở tab 4 vẫn phải còn");
});
