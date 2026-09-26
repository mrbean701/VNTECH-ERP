// PHASE 3 (`T-05`) — HỢP ĐỒNG "VIỆC CÁ NHÂN": **BA NHÓM RIÊNG** — của tôi · được giao · do tôi tạo.
//
// Vì sao kiểm ở tầng NGUỒN + CHẠY THẬT HÀM THUẦN (không phải DOM): nhánh này BỊ CẤM build/khởi động dịch vụ,
// mà bằng chứng runtime chỉ có nghĩa SAU khi dựng lại bundle (bài học đã ghi nhiều lần trong dự án).
// Vì vậy: (1) đọc mã nguồn để chốt HỢP ĐỒNG TÊN TRƯỜNG, (2) TRÍCH khối thuần giữa hai mốc `T05-PURE-BEGIN/END`,
// dịch TS→JS bằng esbuild (đã có sẵn qua `tsx`) và CHẠY với fixtures — nên đây là kiểm HÀNH VI, không chỉ regex.
//
// LƯU Ý: tệp này CỐ Ý không nằm trong `package.json` → `test:regression` giữ nguyên 69 ca.
// Chạy riêng:  node --test tests/t05-personal-work.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import esbuild from "esbuild";

const read = (relative) => readFileSync(new URL("../" + relative, import.meta.url), "utf8");
const workCenter = read("app/screens/WorkCenter.tsx");
const route = read("scripts/system-route.mjs");
const probe = read("tools/probe-work-item-field-contract.mjs");

const BEGIN = "T05-PURE-BEGIN";
const END = "T05-PURE-END";
assert.equal(workCenter.split(BEGIN).length - 1, 1, "Mốc T05-PURE-BEGIN phải xuất hiện đúng 1 lần");
assert.equal(workCenter.split(END).length - 1, 1, "Mốc T05-PURE-END phải xuất hiện đúng 1 lần");
const blockStart = workCenter.indexOf(BEGIN);
const blockEnd = workCenter.indexOf(END, blockStart + BEGIN.length);
assert.ok(blockStart > 0 && blockEnd > blockStart, "WorkCenter.tsx thiếu khối thuần T05-PURE-BEGIN/END");
// Mốc nằm TRONG một dòng chú thích ⇒ bắt đầu trích từ SAU dòng mốc (nếu không, chính chữ mốc thành mã).
const block = workCenter.slice(workCenter.indexOf("\n", blockStart) + 1, blockEnd);
// Bỏ CHÚ THÍCH trước khi kiểm "tên trường đã chết": nếu không, chính câu giải thích lỗi cũ sẽ làm phép kiểm "đạt"
// (bài học đã ghi ở `tools/probe-work-item-field-contract.mjs` dòng 36-37).
const blockCode = block.replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");

function loadPure() {
  const js = esbuild.transformSync(block, { loader: "ts" }).code;
  const api = new Function(`${js}\nreturn { personalWorkGroups, PERSONAL_GROUPS };`)();
  assert.equal(typeof api.personalWorkGroups, "function", "Khối T-05 phải export `personalWorkGroups`");
  return api;
}

// Fixtures: 4 dòng phủ ĐỦ 4 tổ hợp (assignedTo == tôi?) × (assignedBy == tôi?), dùng ĐÚNG tên trường thật.
const ME = "USR_ME";
const OTHER = "USR_OTHER";
const row = (id, assignedTo, assignedBy, extra = {}) => ({
  id, taskNo: `CV-${id}`, title: `Việc ${id}`, assignedTo, assignedByName: assignedBy === ME ? "Tôi" : "Người khác",
  assignedBy, assignedToName: assignedTo === ME ? "Tôi" : "Người khác", status: "NEW", priority: "normal", ...extra,
});
const ROWS = [
  row("A", ME, ME),        // tôi tự tạo cho chính tôi  → "của tôi" + "do tôi tạo"
  row("B", ME, OTHER),     // người khác giao cho tôi  → "của tôi" + "được giao"
  row("C", OTHER, ME),     // tôi giao cho người khác  → "do tôi tạo"
  row("D", OTHER, OTHER),  // không liên quan tới tôi   → không nhóm nào
];

test("T-05 — HỢP ĐỒNG TÊN TRƯỜNG: dùng `assignedTo`/`assignedToName` + `assignedBy`/`assignedByName` (đã ĐO, không đoán)", () => {
  // Lớp 1 — nguồn sinh payload: alias THẬT của bootstrap.
  assert.match(route, /wi\.assigned_to\s+AS\s+assignedTo/, "bootstrap phải alias `wi.assigned_to AS assignedTo`");
  assert.match(route, /wi\.assigned_by\s+AS\s+assignedBy/, "bootstrap phải alias `wi.assigned_by AS assignedBy`");
  assert.match(route, /ua\.full_name\s+AS\s+assignedToName/, "bootstrap phải alias `ua.full_name AS assignedToName`");
  assert.match(route, /ub\.full_name\s+AS\s+assignedByName/, "bootstrap phải alias `ub.full_name AS assignedByName`");
  // `work_items` KHÔNG có cột `created_by` ⇒ KHÔNG được bịa trường `createdBy` cho khoá `workItems`.
  const select = route.slice(route.indexOf("const workItems = await all("), route.indexOf("const workItemIds="));
  assert.doesNotMatch(select, /AS createdBy/, "khoá `workItems` KHÔNG có trường `createdBy` — không được bịa");
  // Lớp 2 — chính khối thuần chỉ đọc hai trường thật.
  assert.match(block, /assignedTo/, "khối T-05 phải đọc `assignedTo`");
  assert.match(block, /assignedBy/, "khối T-05 phải đọc `assignedBy`");
  assert.doesNotMatch(blockCode, /assigneeUserId|assigneeName\b/, "khối T-05 còn dùng tên trường ĐÃ CHẾT (`assigneeUserId`/`assigneeName`)");
  assert.doesNotMatch(blockCode, /createdBy|created_by/, "khối T-05 tự bịa `createdBy`/`created_by` cho `work_items`");
  // Lớp 3 — cổng hợp đồng trường của dự án (T-03/T-04) vẫn dùng đúng hai tên này.
  assert.match(probe, /assignedToName/, "`tools/probe-work-item-field-contract.mjs` phải còn kiểm `assignedToName`");
});

test("T-05 — BA NHÓM tồn tại với nhãn đúng đề bài: của tôi · được giao · do tôi tạo", () => {
  const { personalWorkGroups, PERSONAL_GROUPS } = loadPure();
  const groups = personalWorkGroups(ROWS, ME);
  assert.equal(groups.length, 3, "Phải có ĐÚNG 3 nhóm việc cá nhân");
  assert.deepEqual(groups.map((g) => g.label), ["Của tôi", "Được giao", "Do tôi tạo"]);
  assert.deepEqual(groups.map((g) => g.key), ["mine", "assigned", "created"]);
  assert.deepEqual(PERSONAL_GROUPS.map((g) => g.label), ["Của tôi", "Được giao", "Do tôi tạo"]);
  assert.equal(new Set(groups.map((g) => g.key)).size, 3, "Ba nhóm phải KHÁC nhau về khoá");
});

test("T-05 — mỗi nhóm có BỘ LỌC RIÊNG và ra KẾT QUẢ KHÁC NHAU (đo bằng fixtures, không đọc chữ)", () => {
  const { personalWorkGroups } = loadPure();
  const [mine, assigned, created] = personalWorkGroups(ROWS, ME);
  assert.deepEqual(mine.rows.map((r) => r.id), ["A", "B"], "«Của tôi» = assignedTo === tôi");
  assert.deepEqual(assigned.rows.map((r) => r.id), ["B"], "«Được giao» = assignedTo === tôi VÀ assignedBy !== tôi");
  assert.deepEqual(created.rows.map((r) => r.id), ["A", "C"], "«Do tôi tạo» = assignedBy === tôi");
  assert.notDeepEqual(assigned.rows.map((r) => r.id), created.rows.map((r) => r.id), "Hai nhóm KHÔNG được trùng kết quả");
  assert.equal(mine.rows.filter((r) => !assigned.rows.includes(r)).length, 1, "«Của tôi» phải rộng hơn «Được giao» (gồm cả việc tôi tự tạo)");
});

test("T-05 — mỗi nhóm có BỘ ĐẾM riêng và bộ đếm khớp tập dòng của chính nhóm đó", () => {
  const { personalWorkGroups } = loadPure();
  const groups = personalWorkGroups(ROWS, ME);
  for (const group of groups) {
    assert.equal(typeof group.count, "number", `Nhóm ${group.key} thiếu bộ đếm riêng`);
    assert.equal(group.count, group.rows.length, `Bộ đếm nhóm ${group.key} không khớp số dòng`);
  }
  assert.deepEqual(groups.map((g) => g.count), [2, 1, 2]);
  // Bộ đếm phải phản ánh tổng dòng THẬT (không hardcode).
  const bigger = personalWorkGroups([...ROWS, row("E", ME, OTHER), row("F", ME, ME)], ME);
  assert.deepEqual(bigger.map((g) => g.count), [4, 2, 3], "Bộ đếm không đổi theo dữ liệu ⇒ đang hardcode");
});

test("T-05 — [đối chứng âm] dòng chỉ có TÊN TRƯỜNG GIẢ (`assigneeUserId`) KHÔNG lọt vào nhóm nào", () => {
  const { personalWorkGroups } = loadPure();
  const legacy = [{ id: "X", taskNo: "CV-X", title: "Việc cũ", assigneeUserId: ME, assigneeName: "Tôi", status: "NEW" }];
  const groups = personalWorkGroups(legacy, ME);
  assert.deepEqual(groups.map((g) => g.count), [0, 0, 0], "Tên trường giả vẫn được tính ⇒ hợp đồng tên trường bị phá");
  // Đối chứng dương: cùng dòng đó, đổi sang tên THẬT thì phải được tính.
  const real = [{ ...legacy[0], assignedTo: ME, assignedBy: ME }];
  assert.deepEqual(personalWorkGroups(real, ME).map((g) => g.count), [1, 0, 1]);
});

test("T-05 — UI tab «Cá nhân» RENDER 3 nhóm kèm bộ đếm (không chỉ khai báo trong mã)", () => {
  const i0 = workCenter.indexOf("{tab === 0 &&");
  const i1 = workCenter.indexOf("{tab === 1 &&");
  assert.ok(i0 > 0 && i1 > i0, "Không tách được nhánh tab «Cá nhân»");
  const tab0 = workCenter.slice(i0, i1);
  assert.match(workCenter, /const personalGroups = personalWorkGroups\(items, myId\);/, "Tab «Cá nhân» chưa tính 3 nhóm bằng `personalWorkGroups`");
  assert.match(tab0, /personalGroups\.map\(/, "Tab «Cá nhân» chưa render dải 3 nhóm");
  assert.match(tab0, /g\.rows\.length|group\.rows\.length/, "Dải nhóm chưa hiện bộ đếm riêng");
  assert.match(tab0, /setPersonalGroup\(/, "Chưa có bộ chọn nhóm (bộ lọc riêng theo nhóm)");
  assert.match(workCenter, /const \[personalGroup, setPersonalGroup\] = useState\("mine"\);/, "Trạng thái nhóm đang chọn chưa mặc định về «Của tôi» (khoá `mine`)");
  // KHÔNG được phá hợp đồng `T-01` đã đóng.
  assert.match(tab0, /create_self_work_item/, "Mất form tự tạo việc của T-01");
  assert.match(tab0, /Danh sách việc của tôi/, "Mất tiêu đề danh sách việc của T-01");
});
