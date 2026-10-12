// W2 — HỢP ĐỒNG «XEM DANH SÁCH CÔNG VIỆC CỦA **NGƯỜI KHÁC** THEO PHẠM VI» (đặc tả user 08/10/2026).
//
// NGUYÊN VĂN YÊU CẦU USER:
//   • «*Cá nhân là trưởng phòng + được cấp quyền giao việc … có quyền **xem danh sách công việc của người khác
//      thuộc phòng ban của mình***»
//   • «*Cá nhân là giám đốc - admin: có thêm quyền **xem tất cả các danh sách công việc của user** không thuộc
//      phòng ban của mình (toàn bộ user trong hệ thống)*»
//
// ⭐ BẤT BIẾN AN NINH ĐƯỢC KHOÁ BẰNG TỆP NÀY (lý do tồn tại của nó):
//   W2 **⛔ KHÔNG được nới quyền ở giao diện**. Phạm vi do MÁY CHỦ quyết (`workItems` đã lọc sẵn bằng
//   `work_scope` + `isDepartmentManager` trong bootstrap) ⇒ giao diện chỉ được **GOM LẠI** những dòng
//   **ĐÃ ĐƯỢC TRẢ VỀ** (`scopedWork`) và **⛔ không** được thêm API/action nào.
//   ⇒ Test này khoá 3 điều: ① hàm gom đọc ĐÚNG hợp đồng tên trường (`assignedTo`/`assignedToName`) và gom theo
//   **KHOÁ định danh** (⛔ không theo tên — hai người TRÙNG TÊN phải là 2 nhóm) ② nguồn gom là `scopedWork`
//   (tập đã thu hẹp) ③ «Theo người» là chế độ **CHỈ XEM** việc của người khác + mặc định vẫn là «Nhóm của tôi».
//
// ⚠️ Tệp này TỰ ĐỘNG vào cổng `npm run test:regression` (cổng suy danh sách từ thư mục `tests/`) ⇒ phải XANH.
// Chạy riêng: node --test tests/t14-work-owner-view.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import esbuild from "esbuild";

const read = (relative) => readFileSync(new URL("../" + relative, import.meta.url), "utf8");
const workCenter = read("app/screens/WorkCenter.tsx");

const BEGIN = "W2-PURE-BEGIN";
const END = "W2-PURE-END";
assert.equal(workCenter.split(BEGIN).length - 1, 1, "Mốc W2-PURE-BEGIN phải xuất hiện đúng 1 lần");
assert.equal(workCenter.split(END).length - 1, 1, "Mốc W2-PURE-END phải xuất hiện đúng 1 lần");
const blockStart = workCenter.indexOf(BEGIN);
const blockEnd = workCenter.indexOf(END, blockStart + BEGIN.length);
assert.ok(blockStart > 0 && blockEnd > blockStart, "WorkCenter.tsx thiếu khối thuần W2-PURE-BEGIN/END");
// Mốc nằm TRONG dòng chú thích ⇒ trích từ SAU dòng mốc (nếu không, chính chữ mốc thành mã).
const block = workCenter.slice(workCenter.indexOf("\n", blockStart) + 1, blockEnd);
// Bỏ CHÚ THÍCH trước khi kiểm "tên trường chết"/"gọi mạng" — nếu không, chính câu giải thích lỗi cũ làm phép kiểm "đạt".
const blockCode = block.replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");

function loadPure() {
  const js = esbuild.transformSync(block, { loader: "ts" }).code;
  const api = new Function(`${js}\nreturn { workByOwnerGroups, OWNER_VIEW_MODES, OWNER_UNKNOWN_LABEL };`)();
  assert.equal(typeof api.workByOwnerGroups, "function", "Khối W2 phải export `workByOwnerGroups`");
  return api;
}

// ── Fixtures: dùng ĐÚNG tên trường thật của payload (`assignedTo`/`assignedToName`) ─────────────────
const ME = "USR_ME";
const AN = "USR_AN";
const BINH = "USR_BINH";
const row = (id, assignedTo, assignedToName, extra = {}) => ({
  id, taskNo: `CV-${id}`, title: `Việc ${id}`, assignedTo, assignedToName, status: "NEW", ...extra,
});
const ROWS = [
  row("A", ME, "Tôi"),                    // việc của tôi
  row("B", ME, "Tôi"),                    // việc của tôi
  row("C", AN, "Nguyễn Văn An"),          // người khác (trưởng phòng được xem nếu CÙNG phòng — máy chủ đã lọc)
  row("D", AN, "Nguyễn Văn An"),          // cùng người
  row("E", BINH, "Nguyễn Văn An"),        // ⚠️ TRÙNG TÊN nhưng KHÁC người ⇒ phải là NHÓM RIÊNG
  row("F", "", ""),                       // dòng thiếu người thực hiện ⇒ nhóm riêng, ⛔ không gán bừa cho ai
];

test("W2 — HỢP ĐỒNG TÊN TRƯỜNG: gom theo `assignedTo`/`assignedToName` (đã ĐO ở T-05, ⛔ không đoán)", () => {
  assert.match(block, /assignedTo/, "khối W2 phải đọc `assignedTo`");
  assert.match(block, /assignedToName/, "khối W2 phải đọc `assignedToName`");
  assert.doesNotMatch(blockCode, /assigneeUserId|assigneeName\b/, "khối W2 còn dùng tên trường ĐÃ CHẾT (`assigneeUserId`/`assigneeName`)");
  assert.doesNotMatch(blockCode, /createdBy|created_by/, "khối W2 tự bịa `createdBy`/`created_by` cho `work_items`");
  // ⭐ Bất biến an ninh: khối thuần ⛔ KHÔNG gọi mạng/action nào (phạm vi do máy chủ quyết, ⛔ không tự đi hỏi thêm).
  assert.doesNotMatch(blockCode, /fetch\(|XMLHttpRequest|localStorage|require\(|import\s/,
    "khối W2 ⛔ không được gọi mạng/API — phạm vi người được xem do MÁY CHỦ quyết trong payload");
});

test("W2 — `workByOwnerGroups` gom ĐÚNG theo NGƯỜI THỰC HIỆN: đủ người · bộ đếm khớp · ⛔ không mất/không nhân dòng", () => {
  const { workByOwnerGroups } = loadPure();
  const groups = workByOwnerGroups(ROWS);
  // 4 nhóm: TÔI · An · Bình · «chưa gán» (⛔ KHÔNG gộp An với Bình dù TRÙNG TÊN).
  assert.equal(groups.length, 4, "Phải có ĐÚNG 4 nhóm người (An và Bình trùng tên nhưng KHÁC người ⇒ 2 nhóm)");
  const byKey = new Map(groups.map((group) => [group.key, group]));
  assert.deepEqual([...byKey.keys()].sort(), ["", AN, BINH, ME].sort(), "Khoá nhóm phải là `assignedTo` (khoá ĐỊNH DANH)");
  assert.deepEqual(byKey.get(ME).rows.map((r) => r.id), ["A", "B"]);
  assert.deepEqual(byKey.get(AN).rows.map((r) => r.id), ["C", "D"]);
  assert.deepEqual(byKey.get(BINH).rows.map((r) => r.id), ["E"]);
  assert.deepEqual(byKey.get("").rows.map((r) => r.id), ["F"]);
  // Bộ đếm = số dòng của CHÍNH nhóm đó; tổng các nhóm = tổng dòng đưa vào (⛔ không mất, ⛔ không nhân).
  for (const group of groups) assert.equal(group.count, group.rows.length, `Bộ đếm nhóm «${group.label}» không khớp số dòng`);
  assert.equal(groups.reduce((sum, group) => sum + group.count, 0), ROWS.length, "Tổng các nhóm phải bằng số dòng đầu vào");
  // Sắp xếp GIẢM DẦN theo bộ đếm (khuôn `projectWorkGroups` đã có trong cùng tệp).
  const counts = groups.map((group) => group.count);
  assert.deepEqual(counts, [...counts].sort((a, b) => b - a), "Dải nhóm phải sắp giảm dần theo số việc");
});

test("W2 — dữ liệu THIẾU người thực hiện rơi vào nhóm riêng có NHÃN RÕ (⛔ không gán bừa cho ai)", () => {
  const { workByOwnerGroups, OWNER_UNKNOWN_LABEL } = loadPure();
  const groups = workByOwnerGroups(ROWS);
  const unknown = groups.find((group) => group.key === "");
  assert.ok(unknown, "Dòng thiếu `assignedTo` phải có nhóm riêng");
  assert.equal(unknown.label, OWNER_UNKNOWN_LABEL, "Nhóm «thiếu người thực hiện» phải mang nhãn hằng số, ⛔ không lấy tên người khác");
  assert.equal(unknown.count, 1);
  // Đối chứng dương: có TÊN mà ⛔ không có khoá ⇒ vẫn phải vào nhóm «chưa gán» (⛔ không gán theo tên).
  assert.equal(workByOwnerGroups([{ id: "G", assignedToName: "Nguyễn Văn An" }])[0].key, "");
});

test("W2 — [đối chứng ÂM] tên trường GIẢ (`assigneeUserId`) ⛔ KHÔNG được tính là người thực hiện", () => {
  const { workByOwnerGroups, OWNER_UNKNOWN_LABEL } = loadPure();
  const legacy = [{ id: "X", taskNo: "CV-X", title: "Việc cũ", assigneeUserId: ME, assigneeName: "Tôi", status: "NEW" }];
  const groups = workByOwnerGroups(legacy);
  assert.equal(groups.length, 1, "Tên trường giả ⛔ không được sinh nhóm người");
  assert.equal(groups[0].key, "", "⛔ Không được coi `assigneeUserId` là `assignedTo`");
  assert.equal(groups[0].label, OWNER_UNKNOWN_LABEL);
  // Đối chứng DƯƠNG: cùng dòng đó, đổi sang tên THẬT thì phải vào ĐÚNG nhóm của tôi.
  const real = workByOwnerGroups([{ ...legacy[0], assignedTo: ME, assignedToName: "Tôi" }]);
  assert.deepEqual(real.map((group) => [group.key, group.label, group.count]), [[ME, "Tôi", 1]]);
});

test("W2 — [đối chứng ÂM] hàm ⛔ KHÔNG bịa dòng: chỉ trả về những gì được đưa vào", () => {
  const { workByOwnerGroups } = loadPure();
  assert.deepEqual(workByOwnerGroups([]), [], "Danh sách rỗng ⇒ ⛔ không nhóm nào (⛔ không bịa «mọi người» ra)");
  const two = workByOwnerGroups(ROWS.slice(0, 3));
  assert.equal(two.reduce((sum, group) => sum + group.count, 0), 3, "⛔ Không được thêm dòng ⛔ không có trong đầu vào");
  assert.equal(two.length, 2, "3 dòng của 2 người ⇒ ĐÚNG 2 nhóm");
});

test("W2 — UI: bộ chọn cách xem TỒN TẠI nhưng ⛔ KHÔNG còn dạng TAB (yêu cầu user 09/10/2026) · MẶC ĐỊNH «Nhóm của tôi»", () => {
  const { OWNER_VIEW_MODES } = loadPure();
  assert.deepEqual(OWNER_VIEW_MODES.map((mode) => mode.key), ["group", "owner"], "Hai cách xem: `group` rồi `owner`");
  assert.deepEqual(OWNER_VIEW_MODES.map((mode) => mode.label), ["Nhóm của tôi", "Theo người"]);
  // MẶC ĐỊNH = «Nhóm của tôi» ⇒ ai ⛔ không tự đổi thì màn hình y như TRƯỚC W2.
  assert.match(workCenter, /const \[ownerView, setOwnerView\] = useState\("group"\);/, "Cách xem phải MẶC ĐỊNH về «Nhóm của tôi» (`group`)");
  assert.match(workCenter, /const \[ownerId, setOwnerId\] = useState\(""\);/, "Chưa có trạng thái NGƯỜI đang chọn");
  // ⭐ YÊU CẦU USER (ảnh chụp sidebar + tin nhắn): «*Xóa dải tab **Nhóm của tôi - Theo người** ra khỏi tabbar
  //    **Danh sách công việc***» ⇒ ⛔ KHÔNG còn dải `project-scope-tabs`/`role="tablist"` cho CÁCH XEM;
  //    nay là **1 Ô CHỌN THƯỜNG** `data-vntech="work-owner-select"` đặt NGAY TRÊN BẢNG ✓
  const i0 = workCenter.indexOf("{tab === 1 &&");
  const i1 = workCenter.indexOf("{tab === 2 &&");
  const tab0 = workCenter.slice(i0, i1);
  assert.match(tab0, /data-vntech="work-owner-select"/, "Thiếu Ô CHỌN «Xem việc của» (thay dải tab cách xem — yêu cầu user)");
  assert.doesNotMatch(tab0, /work-owner-view-/, "⛔ dải tab «Nhóm của tôi / Theo người» PHẢI ĐÃ BỊ XOÁ khỏi tabbar (yêu cầu user)");
  // ⛔ Bất biến: ô chọn cách xem ⛔ KHÔNG được mang lớp/khuôn TAB (nếu không thì lại là «dải tab» như user phàn nàn).
  //    ⚠️ Lấy lần xuất hiện **CUỐI** của dấu `data-vntech` (⚠️ lần đầu là trong CHÚ THÍCH ⇒ cắt sai khối) và
  //    chỉ soi **trong đúng khối `<label …>…</label>`** của ô chọn.
  const selIdx = tab0.lastIndexOf('data-vntech="work-owner-select"');
  assert.ok(selIdx > 0, "không tìm thấy ô chọn «Xem việc của» trong tab «Danh sách công việc»");
  const selBlock = tab0.slice(tab0.lastIndexOf("<label", selIdx), tab0.indexOf("</label>", selIdx) + 8);
  assert.doesNotMatch(selBlock, /project-scope-tabs|role="tablist"/, "Ô chọn cách xem ⛔ không được dùng khuôn dải tab");
  assert.match(selBlock, /<select/, "Ô chọn cách xem phải là `<select>` thường");
  // ⭐⭐ YÊU CẦU TRỰC TIẾP CỦA USER (09/10/2026): «*filter **Xem việc của**: cần có **logic check perm**, user
  //    ⛔ không có perm thì sẽ **không chọn được hoặc không hiển thị***» ⇒ ⭐ CỔNG QUYỀN = khoá **`work_others`**
  //    (dòng ma trận «Việc của NGƯỜI KHÁC (xem · sửa · duyệt)» — S01 tạo ở `B1`) ✓
  assert.match(workCenter, /const canViewOthers = modulePermission\(data, "work_others"\)\.canView;/,
    "⛔ THIẾU cổng quyền `work_others` cho ô chọn «Xem việc của» (yêu cầu user: không có perm ⇒ không hiện/không chọn được)");
  assert.match(tab0, /\{canViewOthers && <label className="row-actions" data-vntech="work-owner-select"/,
    "⛔ Ô chọn «Xem việc của» PHẢI bị ẨN khi thiếu `work_others.canView` (⛔ không render)");
  // ⭐ «CHỐT ÉP VỀ NHÓM CỦA TÔI»: mọi nhánh hiển thị/bảng phải dùng `ownerViewEff` ⇒ ⛔ KHÔNG lộ việc người khác
  //    khi thiếu quyền (⚠️ kể cả khi state `ownerView` còn là `"owner"` từ trước — ví dụ admin vừa thu quyền).
  assert.match(workCenter, /const ownerViewEff = canViewOthers \? ownerView : "group";/,
    "Thiếu «chốt ép về Nhóm của tôi» (`ownerViewEff`) khi thiếu quyền `work_others`");
  assert.match(workCenter, /const ownerViewEditable = ownerViewEff !== "owner" \|\| ownerIsMe;/,
    "`ownerViewEditable` phải tính theo `ownerViewEff` (⛔ không theo state thô)");
  assert.match(workCenter, /const personalViewRows: Row\[\] = ownerViewEff === "owner" \? ownerRows : personalRows;/,
    "`personalViewRows` phải tính theo `ownerViewEff` (⛔ nếu theo `ownerView` thì thiếu quyền vẫn hiện việc người khác)");
  assert.match(workCenter, /note=\{ownerViewEff === "owner"/, "Ghi chú trên toolbar phải theo `ownerViewEff`");
});

test("W2 — UI: Ô CHỌN «Xem việc của» liệt kê MỖI NGƯỜI 1 mục kèm bộ đếm + nguồn là `scopedWork` (phạm vi máy chủ)", () => {
  const i0 = workCenter.indexOf("{tab === 1 &&");
  const i1 = workCenter.indexOf("{tab === 2 &&");
  assert.ok(i0 > 0 && i1 > i0, "Không tách được nhánh tab «Danh sách công việc» (chỉ số 1)");
  const tab0 = workCenter.slice(i0, i1);
  // ① Nguồn gom việc = tập ĐÃ THU HẸP theo phạm vi (`scopedWork`) — ⛔ KHÔNG gom thẳng payload/`items` để ⛔ không nới quyền.
  assert.match(workCenter, /const ownerGroups = workByOwnerGroups\(scopedWork\);/,
    "W2 phải gom trên `scopedWork` (tập đã thu hẹp) — ⛔ không được gom thẳng trên `items`/payload thô");
  // ② Ô chọn render MỖI NGƯỜI 1 `<option>` từ `ownerGroups` + BỘ ĐẾM + bấm là đổi người (`setOwnerId`).
  assert.match(tab0, /ownerGroups\.map\(\(group\) => <option key=\{group\.key \|\| OWNER_UNKNOWN_KEY\}/,
    "Thiếu danh sách NGƯỜI trong ô chọn (mỗi người 1 `<option>`)");
  assert.match(tab0, /group\.count\b/, "Mục người trong ô chọn thiếu BỘ ĐẾM số việc");
  assert.match(tab0, /setOwnerId\(value === OWNER_UNKNOWN_KEY \? "" : value\)/, "Ô chọn chưa đổi NGƯỜI đang xem (`setOwnerId`)");
  assert.match(tab0, /setOwnerView\("owner"\)/, "Ô chọn chưa bật chế độ «Theo người»");
  // ③ Mục mặc định + trạng thái RỖNG phải nói rõ (⛔ không trắng màn, ⛔ không bịa dữ liệu).
  assert.match(tab0, /<option value="">— \{OWNER_VIEW_MODES\[0\]\.label\} —<\/option>/, "Thiếu mục MẶC ĐỊNH «— Nhóm của tôi —» trong ô chọn");
  assert.match(tab0, /data-vntech="work-owner-empty"/, "Thiếu trạng thái «chưa có việc trong phạm vi được xem»");
  // ④ ⛔ KHÔNG phá hợp đồng T-05: dải nhóm cũ (2 nhóm) vẫn còn nguyên trong tab này.
  assert.match(tab0, /personalGroups\.map\(/, "W2 làm MẤT dải «Nhóm của tôi» của T-05");
  assert.match(tab0, /setPersonalGroup\(/, "W2 làm MẤT bộ lọc nhóm của T-05");
});

test("W2 — UI: việc của NGƯỜI KHÁC là chế độ CHỈ XEM (⛔ không sinh «nút chết» · ⛔ không nới quyền)", () => {
  // Ô nhập %/«Gửi kiểm tra»/«Duyệt xong» chỉ bật khi là việc CỦA CHÍNH MÌNH ⇒ người chỉ có quyền XEM ⛔ không thấy nút.
  // ⚠️ CẬP NHẬT 09/10/2026 (cổng quyền `work_others` — yêu cầu user): luật nay tính theo **`ownerViewEff`**
  //    (đã ép về «Nhóm của tôi» khi thiếu quyền) ⇒ ⛔ không lộ việc người khác.
  assert.match(workCenter, /const ownerViewEditable = ownerViewEff !== "owner" \|\| ownerIsMe;/,
    "Thiếu luật «chỉ việc CỦA MÌNH mới sửa được» ở cách xem «Theo người» (tính theo `ownerViewEff`)");
  // ⚠️ CẬP NHẬT 09/10/2026 (việc 1 user giao): bảng nay đọc `rowsHienThi` (= LỌC trạng thái + SẮP XẾP **sau** khi
  //    đã áp cách xem) ⇒ ⭐ bất biến «Theo người» ⛔ KHÔNG đổi, chỉ **siết thêm**: `rowsHienThi` PHẢI suy TỪ
  //    `personalViewRows` (⛔ không được đọc thẳng `personalRows` — nếu không sẽ lộ việc của người khác khi thiếu quyền).
  assert.match(workCenter, /<TaskTable rows=\{find\(rowsHienThi\)\} allowEdit=\{ownerViewEditable\}/,
    "Bảng ở chế độ «Theo người» chưa buộc theo `ownerViewEditable` ⇒ vẫn hiện nút sửa cho việc của người khác");
  assert.match(workCenter, /const rowsSauLoc = personalViewRows\.filter\(/,
    "`rowsHienThi` phải suy TỪ `personalViewRows` (⚠️ đọc thẳng `personalRows` ⇒ lộ việc người khác khi thiếu quyền)");
  assert.match(workCenter, /const rowsHienThi = sapXepWork\(rowsSauLoc, sortKey\);/,
    "`rowsHienThi` phải = lọc trạng thái → sắp xếp (trên tập đã áp cách xem)");
  assert.match(workCenter, /const ownerIsMe = Boolean\(activeOwnerKey\) && activeOwnerKey === myId;/,
    "Thiếu phép so NGƯỜI đANG CHỌN với chính mình");
  // ⛔ W2 KHÔNG thêm đường gọi mạng nào trong tab «Danh sách công việc» (phạm vi đã có sẵn trong payload).
  const i0 = workCenter.indexOf("{tab === 1 &&");
  const i1 = workCenter.indexOf("{tab === 2 &&");
  const tab0 = workCenter.slice(i0, i1);
  assert.doesNotMatch(tab0, /fetch\(/, "W2 ⛔ không được tự gọi API — phạm vi do MÁY CHỦ trả trong payload");
  assert.doesNotMatch(tab0, /\/api\/system/, "W2 ⛔ không được gọi `/api/system` thêm lần nào");
});
