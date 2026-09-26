// PHASE 3 (`T-06`) — HỢP ĐỒNG "VIỆC PHÒNG BAN": CHỈ trong PHẠM VI ĐƯỢC PHÉP, KHÔNG MỞ RỘNG QUYỀN.
//
// Cách kiểm: đọc mã nguồn để chốt HỢP ĐỒNG KHOÁ (khoá payload thật, không đoán) rồi TRÍCH khối thuần
// giữa hai mốc `T06-PURE-BEGIN/END`, dịch TS→JS bằng esbuild và CHẠY với ≥2 người dùng mô phỏng
// (1 quản trị thấy nhiều hơn + user thường chỉ thấy trong phạm vi), kèm ĐỐI CHỨNG ÂM.
//
// Bằng chứng nền (đo thật trên payload `:9000`, ghi ở TASK-097):
//   workItems  : assignedTo · assignedToName · assignedBy · assignedByName · departmentCode · projectId · priority · status
//   userScopes : userId · projectId · permission · projectCode (KHÔNG có trường `id` người nhận khác)
//   departmentModulePermissions: organizationUnitId · organizationCode · moduleKey · canView · …
//   modulePermissions: userId · moduleKey · canView · …
//   `userScopes` của người KHÔNG phải admin = [] (bootstrap `:749`) ⇒ mọi phép lọc phía UI chỉ có thể THU HẸP.
//
// LƯU Ý: tệp này CỐ Ý không nằm trong `package.json` → `test:regression` giữ nguyên 69 ca.
// Chạy riêng:  node --test tests/t06-department-scope.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import esbuild from "esbuild";

const read = (relative) => readFileSync(new URL("../" + relative, import.meta.url), "utf8");
const workCenter = read("app/screens/WorkCenter.tsx");
const permissions = read("lib/permissions.ts");

const BEGIN = "T06-PURE-BEGIN";
const END = "T06-PURE-END";
assert.equal(workCenter.split(BEGIN).length - 1, 1, "Mốc T06-PURE-BEGIN phải xuất hiện đúng 1 lần");
assert.equal(workCenter.split(END).length - 1, 1, "Mốc T06-PURE-END phải xuất hiện đúng 1 lần");
const blockStart = workCenter.indexOf(BEGIN);
const blockEnd = workCenter.indexOf(END, blockStart + BEGIN.length);
assert.ok(blockStart > 0 && blockEnd > blockStart, "WorkCenter.tsx thiếu khối thuần T06-PURE-BEGIN/END");
// Mốc nằm TRONG một dòng chú thích ⇒ bắt đầu trích từ SAU dòng mốc (nếu không, chính chữ mốc thành mã).
const block = workCenter.slice(workCenter.indexOf("\n", blockStart) + 1, blockEnd);
// Bỏ CHÚ THÍCH trước khi kiểm "tên trường đã chết"/"gọi mạng" — tránh chính câu giải thích làm phép kiểm "đạt".
const blockCode = block.replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");

function loadPure() {
  const js = esbuild.transformSync(block, { loader: "ts" }).code;
  const api = new Function(`${js}\nreturn { workScopeOf, departmentWorkScope };`)();
  assert.equal(typeof api.departmentWorkScope, "function", "Khối T-06 phải export `departmentWorkScope`");
  assert.equal(typeof api.workScopeOf, "function", "Khối T-06 phải export `workScopeOf`");
  return api;
}

// ── Fixtures: 4 người dùng + 5 việc ───────────────────────────────────────────────────────────────
const WI = (id, extra) => ({ id, taskNo: `CV-${id}`, title: `Việc ${id}`, assignedTo: "U1", assignedToName: "Người 1", assignedBy: "U9", assignedByName: "Quản lý", departmentCode: "KH", priority: "normal", status: "NEW", progress: 0, ...extra });
const ROWS = [
  WI("KH-mine", { assignedTo: "U1", departmentCode: "KH" }),                    // việc của chính user KH (U1)
  WI("KH-mate", { assignedTo: "U2", departmentCode: "KH" }),                    // việc đồng nghiệp cùng phòng (U2)
  WI("DA-other", { assignedTo: "U3", departmentCode: "DA" }),                   // việc PHÒNG KHÁC
  WI("BCH-noproject", { assignedTo: "U5", departmentCode: "BCH", projectId: null }), // BCH không gắn dự án
  WI("BCH-project", { assignedTo: "U5", departmentCode: "BCH", projectId: "PRJ-1" }), // BCH gắn dự án ĐƯỢC CẤP
  WI("BCH-foreign", { assignedTo: "U5", departmentCode: "BCH", projectId: "PRJ-9" }), // BCH gắn dự án KHÔNG được cấp
];

const ADMIN = { id: "U0", role: "admin", roleBase: "admin", organizationCode: "VNTECH" };
const KH_NV = { id: "U1", role: "kh_nv", roleBase: "procurement", organizationCode: "KH", department: "KH" };
const KH_TRUONG = { id: "U2", role: "kh_truong", roleBase: "procurement", organizationCode: "KH", department: "KH" };
const BCH_NV = { id: "U4", role: "thu_kho", roleBase: "warehouse", organizationCode: "BCH", department: "BCH" };
const GRANT = { moduleKey: "dept_plan_tasks", canView: 1, canUse: 1 };
const data = (user, extra = {}) => ({ user, modulePermissions: [GRANT], userScopes: [], departmentModulePermissions: [], ...extra });

const ids = (rows) => rows.map((r) => r.id).sort();

test("T-06 — HỢP ĐỒNG KHOÁ: chỉ dùng khoá THẬT của payload (`userScopes.userId`, `departmentModulePermissions.organizationCode`)", () => {
  assert.match(block, /userScopes/, "khối T-06 phải đọc `data.userScopes`");
  assert.match(block, /userId/, "lọc phạm vi dự án phải so `userScopes[].userId` (khoá thật)");
  assert.match(block, /projectId/, "phải dùng `userScopes[].projectId`");
  assert.match(block, /departmentModulePermissions/, "phải đọc `data.departmentModulePermissions`");
  assert.match(block, /organizationCode/, "`departmentModulePermissions` phải khớp theo `organizationCode` (đo thật)");
  assert.match(block, /modulePermissions/, "phải đọc `data.modulePermissions` (cấp quyền theo người)");
  assert.match(block, /moduleKey/, "phải lọc theo `moduleKey`");
  assert.match(block, /canView/, "phải kiểm `canView` trước khi cho thấy việc phòng ban");
  assert.match(block, /assignedTo\b/, "phải dùng `assignedTo` để nhận diện việc của chính mình");
  assert.doesNotMatch(blockCode, /assigneeUserId|assigneeName\b/, "khối T-06 còn dùng tên trường đã chết");
  // Bằng chứng nền: `lib/permissions.ts` cũng đọc đúng hai khoá này — không có hệ tên thứ hai.
  assert.match(permissions, /item\.moduleKey === key/);
  assert.match(permissions, /Boolean\(row\?\.canView\)/);
});

test("T-06 — QUẢN TRỊ thấy NHIỀU HƠN user thường (admin = toàn bộ payload, không bị lọc thêm)", () => {
  const { departmentWorkScope } = loadPure();
  const adminSees = departmentWorkScope(data(ADMIN), ROWS);
  assert.equal(adminSees.length, ROWS.length, "Admin phải thấy toàn bộ payload (bootstrap đã là `1=1` cho admin)");
  const nvSees = departmentWorkScope(data(KH_NV), ROWS);
  assert.ok(nvSees.length < adminSees.length, "User thường phải thấy ÍT hơn quản trị");
});

test("T-06 — user thường (KH) CHỈ thấy việc của chính mình; KHÔNG thấy việc đồng nghiệp, KHÔNG thấy phòng khác", () => {
  const { departmentWorkScope } = loadPure();
  const seen = ids(departmentWorkScope(data(KH_NV), ROWS));
  assert.deepEqual(seen, ["KH-mine"]);
  // ĐỐI CHỨNG ÂM tường minh:
  assert.ok(!seen.includes("KH-mate"), "[đối chứng âm] user thường thấy được việc của đồng nghiệp");
  assert.ok(!seen.includes("DA-other"), "[đối chứng âm] user KH thấy được việc phòng DA");
  assert.ok(!seen.includes("BCH-noproject") && !seen.includes("BCH-project"), "[đối chứng âm] user KH thấy được việc phòng BCH");
});

test("T-06 — TRƯỞNG PHÒNG thấy việc trong PHÒNG MÌNH (không chỉ việc của mình) nhưng vẫn KHÔNG vượt phòng", () => {
  const { departmentWorkScope } = loadPure();
  const seen = ids(departmentWorkScope(data(KH_TRUONG), ROWS));
  assert.deepEqual(seen, ["KH-mate", "KH-mine"], "Trưởng phòng KH phải thấy việc phòng KH (mình + đồng nghiệp)");
  assert.ok(!seen.includes("DA-other"), "[đối chứng âm] trưởng phòng KH thấy được việc phòng DA");
  assert.ok(!seen.includes("BCH-project") && !seen.includes("BCH-noproject"), "[đối chứng âm] trưởng phòng KH thấy được việc phòng BCH");
  // Đối chứng: hạ vai trò xuống nhân viên (GIỮ NGUYÊN id U1) ⇒ mất phần việc của đồng nghiệp (chứng minh cổng vai trò CÓ tác dụng).
  const demoted = ids(departmentWorkScope(data({ ...KH_NV, role: "kh_nv" }), ROWS));
  assert.deepEqual(demoted, ["KH-mine"], "Cổng «trưởng phòng» không có tác dụng");
});

test("T-06 — user BCH: theo phạm vi DỰ ÁN được cấp (`userScopes.userId` của chính mình), không lấy scope người khác", () => {
  const { departmentWorkScope } = loadPure();
  const mine = data(BCH_NV, { userScopes: [{ userId: "U4", projectId: "PRJ-1", permission: "write" }] });
  assert.deepEqual(ids(departmentWorkScope(mine, ROWS)), ["BCH-noproject", "BCH-project"], "BCH phải thấy việc không gắn dự án + việc thuộc dự án ĐƯỢC CẤP, KHÔNG thấy dự án khác");
  assert.ok(!ids(departmentWorkScope(mine, ROWS)).includes("BCH-foreign"), "[đối chứng âm] thấy việc thuộc dự án CHƯA được cấp");
  const wrongOwner = data(BCH_NV, { userScopes: [{ userId: "U9", projectId: "PRJ-1", permission: "admin" }] });
  assert.deepEqual(ids(departmentWorkScope(wrongOwner, ROWS)), ["BCH-noproject"], "[đối chứng âm] dùng scope của NGƯỜI KHÁC ⇒ mở rộng quyền");
});

test("T-06 — KHÔNG có quyền xem việc phòng ban ⇒ còn lại đúng việc của chính mình (cổng quyền thật)", () => {
  const { departmentWorkScope } = loadPure();
  // Người này là trưởng phòng KH nhưng THIẾU cấp quyền module ⇒ chỉ thấy việc của chính mình (U2 ⇒ KH-mate).
  const noGrantUser = data({ ...KH_TRUONG, id: "U2" }, { modulePermissions: [] });
  assert.deepEqual(ids(departmentWorkScope(noGrantUser, ROWS)), ["KH-mate"], "Thiếu `canView` mà vẫn thấy việc phòng ⇒ cổng quyền bị hở");
  // Cấp quyền ở tầng PHÒNG (`departmentModulePermissions`) cũng phải mở được cổng — nhưng chỉ cho phòng của mình.
  const deptGranted = data({ ...KH_TRUONG, id: "U2" }, { modulePermissions: [], departmentModulePermissions: [{ organizationCode: "KH", moduleKey: "dept_plan_tasks", canView: 1 }] });
  assert.deepEqual(ids(departmentWorkScope(deptGranted, ROWS)), ["KH-mate", "KH-mine"]);
  const otherDeptGrant = data({ ...KH_TRUONG, id: "U2" }, { modulePermissions: [], departmentModulePermissions: [{ organizationCode: "DA", moduleKey: "dept_plan_tasks", canView: 1 }] });
  assert.deepEqual(ids(departmentWorkScope(otherDeptGrant, ROWS)), ["KH-mate"], "[đối chứng âm] cấp quyền cho PHÒNG KHÁC vẫn mở được cổng");
});

test("T-06 — BẤT BIẾN: kết quả LUÔN là tập con của payload (chỉ THU HẸP, không tự sinh dòng, không gọi mạng)", () => {
  const { departmentWorkScope } = loadPure();
  for (const user of [ADMIN, KH_NV, KH_TRUONG, BCH_NV]) {
    const seen = departmentWorkScope(data(user), ROWS);
    assert.ok(seen.every((r) => ROWS.includes(r)), "Lọc mà sinh ra dòng không có trong payload ⇒ mở rộng quyền");
    assert.equal(seen.length, new Set(seen).size, "Kết quả bị trùng dòng");
  }
  assert.doesNotMatch(blockCode, /fetch\(|await |XMLHttpRequest/, "Khối lọc phạm vi phải THUẦN, không được gọi mạng");
});

test("T-06 — UI tab «Phòng ban» dùng phạm vi này và ĐÃ GỠ lỗ hổng nới phạm vi `\"CN\"` cứng", () => {
  const i1 = workCenter.indexOf("{tab === 1 &&");
  const i2 = workCenter.indexOf("{tab === 2 &&");
  assert.ok(i1 > 0 && i2 > i1, "Không tách được nhánh tab «Phòng ban»");
  const tab1 = workCenter.slice(i1, i2);
  assert.match(tab1, /Việc phòng ban của tôi/, "Mất tiêu đề của T-01");
  assert.match(tab1, /Việc của tổ đội tôi tham gia/, "Mất tiêu đề của T-01");
  assert.doesNotMatch(tab1, /create_work_item/, "Form giao việc phải nằm ở tab «Giao việc» (T-01)");
  assert.match(workCenter, /departmentWorkScope\(/, "Tab «Phòng ban» chưa dùng `departmentWorkScope`");
  assert.match(workCenter, /Phạm vi được phép|phạm vi được phép/, "Tab «Phòng ban» chưa nói rõ phạm vi được phép cho người dùng");
  // Lỗ hổng cũ: `myDepts` cộng cứng mã "CN" cho MỌI tài khoản ⇒ nới phạm vi không có căn cứ.
  assert.doesNotMatch(workCenter, /String\(me\.organizationCode \|\| ""\), "CN"/, "Còn giữ mã phòng \"CN\" cộng cứng trong `myDepts`");
});
