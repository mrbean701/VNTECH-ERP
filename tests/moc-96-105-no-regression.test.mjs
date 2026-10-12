// MỐC 96-105 — CHỐNG HỒI QUY cho các lỗi đã sửa ngày 29/09/2026.
//
// ⛔ BUG-01 (S1): ô «Email công ty» gửi `email` vào `save_hr_record`, nhưng bảng
//    `hr_records` KHÔNG có cột `email` ⇒ trường bị BỎ QUA âm thầm, không 400/500.
// ⛔ BUG-02 (S1): UI mở khoá ô cho `admin_tab_01` trong khi `updateUser` còn chốt
//    cứng ROLE `admin` ⇒ lưu hồ sơ XONG mới nhận HTTP 403.
// ⛔ D-033: `moduleCatalog.active` là BOOLEAN `true`; lọc `String(x) === "1"` ⇒ mất
//    14/14 dòng `admin_tab_NN` ⇒ nhóm «Quản trị hệ thống» biến mất khỏi ma trận.
//
// Chạy: node --import tsx --test tests/moc-96-105-no-regression.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(resolve(ROOT, p), "utf8");

// ⛔ BO COMMENT DAU FILE — để không quét nhầm `admin_tab_01` nừu trong chú thích.
// ⛔ BO MOI DONG CHÚ THíCH — chỉ kiểm CODE thật.
const stripComments = (src) => src.replace(/^\s*\/\/.*$/gm, "");
const PAGE = read("app/page.tsx");
const CSS = read("app/globals.css");
const HR_MODAL = stripComments(read("app/screens/HrProfileEditModal.tsx"));
const REPORT_MODAL = read("app/screens/ErrorReportModal.tsx");
const REPORT_PANEL = read("app/screens/ErrorReportAdminPanel.tsx");
const USER_USECASE = read("java-backend/application/src/main/java/com/vntech/erp/application/service/UserManagementUseCase.java");
const REPORT_USECASE = read("java-backend/application/src/main/java/com/vntech/erp/application/service/ErrorReportUseCase.java");
const REGISTRY = read("java-backend/application/src/main/java/com/vntech/erp/application/rbac/ActionRbacRegistry.java");
const CONTROLLER = read("java-backend/web/src/main/java/com/vntech/erp/web/controller/SystemController.java");

// ⛔ MỐC 109 — bỏ dòng chú thích `//` của Java TRƯỚC khi kiểm, nếu không thì chính
//    chú thích giải thích lỗi cũ (có nhắc `requireRequireAdmin`) sẽ làm phép kiểm đỏ oan.
const stripJavaComments = (src) => src.replace(/^[ \t]*\/\/.*$/gm, "");

// ⛔ Cắt ĐÚNG MỘT nhánh `case` — dùng mốc `case "` kế tiếp, KHÔNG dùng độ dài cố định:
//    `case "update_user"` chỉ cách `case "set_user_status"` vài dòng, cắt 600 ký tự sẽ
//    tràn sang nhánh sau (nhánh đó dùng `requireRequireAdmin` hợp lệ) ⇒ đỏ OAN.
const caseBlock = (code, name) => {
  const a = code.indexOf(`case "${name}" ->`);
  if (a < 0) return "";
  const b = code.indexOf('case "', a + 10);
  return code.slice(a, b < 0 ? a + 800 : b);
};

// ⛔ SCHEMA THẬT của `hr_records` — nguồn sự thật cho BUG-01.
//    Khi đổi schema phải cập nhật lại danh sách này.
const HR_RECORDS_COLUMNS = [
  "id", "user_id", "full_name", "identity_no", "identity_date", "identity_place",
  "birth_date", "birthplace", "permanent_address", "phone", "education_level",
  "joined_date", "position", "note", "created_by", "created_at", "updated_at",
];

const between = (src, from, to, span = 1400) => {
  const a = src.indexOf(from);
  return a < 0 ? "" : src.slice(a, a + span);
};

// ⛔ MỐC 03 (07/10/2026, ERP-SESSION-03) — `between` ở trên **BỎ QUA tham số `to`** và luôn cắt `span`
//    ký tự. Vì vậy khi `HrProfileEditModal` được bổ sung logic (hotfix `BUG-20261007-C01`) thì cửa sổ
//    1400 ký tự **TRÀN SANG khối code mới** ⇒ test đỏ OAN («modal gửi "fallback"», «email»).
//    ⇒ Cắt **ĐÚNG theo mốc kết thúc của chính lời gọi**. ⛔ GIỮ NGUYÊN `between` cho 7 call site cũ
//    (đổi hành vi của nó sẽ gây hiệu ứng phụ ở các chỗ khác trong tệp này).
// ⚠️ Mốc kết thúc nhận **REGEX**, ⛔ không nhận chuỗi: tệp này dùng **CRLF** nên chuỗi `");\\n"`
//    KHÔNG BAO GIỜ khớp (`);\\r\\n`) ⇒ nếu truyền chuỗi thì hàm lại rơi về «cắt hết phần còn lại»
//    và test tiếp tục đỏ OAN y như lỗi vừa gặp.
const betweenExact = (src, from, endsWith) => {
  const a = src.indexOf(from);
  if (a < 0) return "";
  const rest = src.slice(a);
  const match = rest.match(endsWith);
  return match ? rest.slice(0, match.index + match[0].length) : rest;
};

test("BUG-01 — payload `save_hr_record` KHÔNG được chứa field mà bảng hr_records thiếu", () => {
  const block = betweenExact(HR_MODAL, 'submit("save_hr_record"', /\}\);\r?\n/);
  assert.ok(block, "phải tìm thấy lời gọi save_hr_record trong HrProfileEditModal");
  const obj = block.slice(block.indexOf("{") + 1, block.lastIndexOf("}"));
  const sent = [...obj.matchAll(/(?:^|[\s{,])(\w+):/gm)].map((m) => m[1])
    .filter((k) => !["if", "const", "let", "return", "await", "accountPayload"].includes(k));
  for (const field of sent) {
    const column = field.replace(/([A-Z])/g, "_$1").toLowerCase();
    assert.ok(HR_RECORDS_COLUMNS.includes(column),
      `⛔ BUG-01 tái phát: modal gửi "${field}" ⇒ cột "${column}" mà bảng hr_records KHÔNG có `
      + `⇒ dữ liệu bị bỏ qua âm thầm. Cột thật: ${HR_RECORDS_COLUMNS.join(", ")}`);
  }
});

test("BUG-01 — `email` phải đi qua `update_user` (users.email), KHÔNG qua `save_hr_record`", () => {
  const block = betweenExact(HR_MODAL, 'submit("save_hr_record"', /\}\);\r?\n/);
  assert.doesNotMatch(block, /(?:^|[\s{,])email:/m,
    "⛔ BUG-01 tái phát: `email` lại được gửi vào save_hr_record (bảng không có cột này)");
  // MỐC 03 (07/10/2026) — payload tài khoản nay dựng bằng OBJECT LITERAL (mỗi trường một dòng, có
  // fallback theo hồ sơ hiện có) thay cho chuỗi `accountPayload.email = …` ⇒ soi ĐÚNG khối literal đó.
  // ⛔ Vẫn giữ nguyên ĐIỀU CẦN CHỨNG MINH: `email` đi qua `update_user` (cột `users.email`), ⛔ không qua `save_hr_record`.
  const payloadBlock = betweenExact(HR_MODAL, "const accountPayload: Row = {", /\};/);
  assert.ok(payloadBlock, "phải tìm thấy `const accountPayload: Row = {` trong HrProfileEditModal");
  assert.match(payloadBlock, /email:\s*accountText\("email"/,
    "email phải đi qua accountPayload → update_user (đúng cột users.email)");
  assert.match(HR_MODAL, /submit\("update_user", accountPayload\)/,
    "accountPayload phải được gửi qua `update_user`");
});

test("BUG-02 — `updateUser` phải dùng cổng quyền khớp registry, KHÔNG chốt cứng ROLE admin", () => {
  const sig = between(USER_USECASE, "public String updateUser(", "", 700);
  assert.match(sig, /requireAccountUpdateRight\(/,
    "updateUser phải đi qua `requireAccountUpdateRight` (khớp registry admin_tab_01 + canEdit)");
  assert.doesNotMatch(sig, /requireRole\([^)]*List\.of\("admin"\)/,
    "⛔ BUG-02 tái phát: updateUser chốt cứng ROLE admin ⇒ người có admin_tab_01 lưu xong mới nhận 403");
});

test("BUG-02 — `update_user` phải khai trong registry với module + capability đúng", () => {
  assert.match(REGISTRY, /Map\.entry\("update_user", List\.of\("admin_tab_01"\)\)/,
    "`update_user` phải gắn module `admin_tab_01` (trước đây `List.of()` ⇒ mọi user 403)");
  assert.match(REGISTRY, /Map\.entry\("update_user", "canEdit"\)/,
    "capability phải là `canEdit` (trước đây `canUse` ⇒ quá rộng)");
});

test("BUG-02 — đổi `role` (tức đổi quyền) chỉ ADMIN, chặn leo thang", () => {
  assert.match(USER_USECASE, /private String guardRoleChange\(/,
    "phải có hàm `guardRoleChange` chặn non-admin đổi vai trò");
  const guard = between(USER_USECASE, "private String guardRoleChange(", "", 800);
  assert.match(guard, /403/,
    "`guardRoleChange` phải ném 403 khi người gọi không phải admin");
});

test("BUG-02 — UI KHÔNG tự mở khoá ô chỉ vì «có quyền admin_tab_01»", () => {
  // ⛔ Chỉ kiểm LOGIC (đã bệ comment đầu file), không quét nhầm vì bạn ghi chú.
  assert.doesNotMatch(HR_MODAL, /admin_tab_01/,
    "⛔ BUG-02 tái phát: modal lại kiểm `admin_tab_01` để mở khoá ô "
    + "trong khi backend chỉ nhận qua `requireAccountUpdateRight`");
  assert.doesNotMatch(HR_MODAL, /canEditAccount\s*=\s*[^;]*admin_tab_01/,
    "⛔ canEditAccount KHÔNG được suy ra từ `admin_tab_01`");
});

test("D-033 — lọc `active` phải chấp nhận BOOLEAN, không chỉ chuỗi \"1\"", () => {
  const fn = between(PAGE, "function isModuleActive(", "", 500);
  assert.ok(fn, "phải có hàm chuẩn hoá `isModuleActive`");
  assert.match(fn, /v === true/, "phải nhận `true` (boolean) — API trả boolean, không phải chuỗi \"1\"");
  const rows = between(PAGE, "const adminTabRows", "", 700);
  assert.doesNotMatch(rows, /String\(row\.active[^\n]*\)\s*===\s*"1"/,
    "⛔ D-033 tái phát: `adminTabRows` lọc `String(row.active) === \"1\"` ⇒ mất 14/14 dòng admin_tab_NN");
});

test("MỐC 104 — nhóm `system_admin` được gom nhóm và đưa lên đầu ma trận", () => {
  assert.match(PAGE, /groupKey:\s*"system_admin"/,
    "14 dòng admin_tab_NN phải gắn groupKey `system_admin`");
  assert.match(PAGE, /orderedGroups/, "phải sắp nhóm `system_admin` lên đầu danh sách");
  assert.match(PAGE, /const leftovers=/,
    "phải gom phần module CHƯA khớp group nào thành nhóm riêng (nếu không ⇒ nhóm biến mất)");
});

test("MỐC 105 — ma trận không được tràn ngang (cắt mất cột tên)", () => {
  assert.match(CSS, /permission-matrix-wrap \.resizable-data-table\{[^}]*width:100%/,
    "phải ép bảng về 100% khung chứa — class `.resizable-data-table` có `width:max-content` ⇒ cuộn ngang");
  assert.match(CSS, /permission-matrix-wrap\{[^}]*overflow-x:hidden/,
    "khung chứa phải `overflow-x:hidden` để hết cuộn ngang");
});

test("MỐC 103 — nút nổi báo lỗi phải hiện trên PC, không chỉ trong khối mobile", () => {
  assert.match(PAGE, /error-report-fab/,
    "phải có nút nổi `error-report-fab` — nút cũ nằm trong `.mobile-display-settings` "
    + "(display:none ngoài 650px) ⇒ trên PC không thấy nút nào");
  assert.doesNotMatch(CSS, /\.error-report-fab\{[^}]*display:none/,
    "⛔ nút nổi không được `display:none` — sẽ mất đúng lý do ban đầu");
});

test("MỐC 103 — modal báo lỗi có đủ 4 ô, nhóm chức năng KHÔNG bắt buộc", () => {
  assert.match(REPORT_MODAL, /reportType/, "phải có ô «Mục» (góp ý / báo lỗi)");
  assert.match(REPORT_MODAL, /<span>Tiêu đề/, "phải có ô Tiêu đề");
  assert.match(REPORT_MODAL, /<span>Nội dung/, "phải có ô Nội dung");
  assert.doesNotMatch(REPORT_MODAL, /!moduleKey\s*\)?\s*\{\s*setError/,
    "⛔ nhóm chức năng phải KHÔNG bắt buộc (yêu cầu 29/09)");
  assert.match(REPORT_PANEL, /r\.reportType/, "bảng Tab 14 phải hiện cột «Mục»");
});

test("MỐC 103 — backend phân 2 mục và cho phép nhóm chức năng rỗng", () => {
  assert.match(REPORT_USECASE, /TYPE_SUGGESTION = "gop_y"/, "phải có mục `gop_y`");
  assert.match(REPORT_USECASE, /TYPE_ERROR = "bao_loi"/, "phải có mục `bao_loi`");
  assert.doesNotMatch(REPORT_USECASE, /if \(moduleKey\.isEmpty\(\)\)\s*throw Api\("Thiếu mục/,
    "⛔ backend không được bắt buộc moduleKey");
  assert.match(REPORT_USECASE, /if \(moduleKey\.isEmpty\(\)\) moduleKey = null;/,
    "moduleKey rỗng phải được đổi thành null");
});

// ============================ MỐC 109 (30/09/2026) ============================
// ⛔ LỖI THẬT ĐO ĐƯỢC: `case "update_user"` trong SystemController gọi
//    `requireRequireAdmin(request)` — cổng chốt cứng `"admin".equals(cu.role())`.
//    Hệ quả: người có `admin_tab_01` + `canEdit` (đúng như MỐC 103 đã khai ở registry
//    và ở `UserManagementUseCase.requireAccountUpdateRight`) VẪN luôn nhận 403
//    «Tài khoản không có quyền thực hiện nghiệp vụ này.» ⇒ toàn bộ MỐC 103 thành CODE CHẾT.
//    Đo thật: probe `sec_probe_017830` (role `ksda`) + `admin_tab_01` can_edit=1 ⇒ 403.
//    Bản sửa bỏ cổng admin-only ở controller và DỰA VÀO cổng quyền chung ở đầu `post()`
//    (PHASE 0B) — vì vậy phép kiểm thứ hai dưới đây canh chính cổng chung đó.

test("MỐC 109 — `case \"update_user\"` KHÔNG được chốt cứng role admin ở controller", () => {
  const code = stripJavaComments(CONTROLLER);
  const block = caseBlock(code, "update_user");
  assert.ok(block, "phải tìm thấy nhánh `case \"update_user\"` trong SystemController");
  assert.doesNotMatch(block, /requireRequireAdmin\(/,
    "⛔ MỐC 109 tái phát: `update_user` lại chốt cứng ROLE admin ở controller "
    + "⇒ người có `admin_tab_01` + `canEdit` kêu 403 dù registry đã cho phép");
  assert.match(block, /requireCurrentUser\(request/,
    "`update_user` phải lấy người gọi bằng `requireCurrentUser` (quyền do cổng chung ở post() gác)");
});

test("MỐC 109 — cổng quyền CHUNG ở đầu `post()` vẫn gác mọi action (nền tảng của bản sửa)", () => {
  const code = stripJavaComments(CONTROLLER);
  assert.match(code, /rbacService\.requireActionModule\(requireCurrentUser\(request\), action\)/,
    "⛔ Nền tảng của MỐC 109: `post()` PHẢI gác `rbacService.requireActionModule(..., action)` "
    + "cho MỌI action không công khai. Nếu cổng này mất thì việc bỏ `requireRequireAdmin` "
    + "ở `update_user` sẽ mở toang thao tác cho mọi tài khoản đã đăng nhập");
  assert.match(code, /RbacService\.PUBLIC_ACTIONS\.contains\(action\)/,
    "cổng chung phải miễn đúng danh sách PUBLIC_ACTIONS (allowlist đóng)");
});

test("MỐC 109 — `guardRoleChange` chỉ chặn khi vai trò THẬT SỰ ĐỔI", () => {
  // ⛔ LỖI THẬT ĐO ĐƯỢC (lớp thứ hai): modal sửa tài khoản LUÔN gửi kèm ô `role`.
  //    guardRoleChange chặn MỌI payload CÓ `role` ⇒ người có `admin_tab_01` + `canEdit`
  //    gửi lên `role` Y HỆT vai trò hiện tại vẫn nhận 403 «Chỉ Quản trị hệ thống…».
  //    Đo thật: probe `sec_probe_017830` gửi `role='ksda'` (đúng vai trò đang có) ⇒ 403.
  const guard = between(USER_USECASE, "private String guardRoleChange(", "", 1700);
  assert.ok(guard, "phải có hàm `guardRoleChange`");
  assert.match(guard, /String current = sv\(target, "role"\)/,
    "phải đọc vai trò HIỆN TẠI của tài khoản đích để so sánh");
  assert.match(guard, /equalsIgnoreCase\(trim\(current\)\)/,
    "⛔ MỐC 109 tái phát: `guardRoleChange` chặn MỌI payload có `role` "
    + "⇒ người có `admin_tab_01` KHÔNG BAO GIỜ sửa được tài khoản vì form luôn gửi kèm `role`");
});

// ============================ MỐC 110 (30/09/2026) ============================
// ⛔ LỖI THẬT ĐO ĐƯỢC: nút «Báo lỗi / Góp ý» (yêu cầu của user 29/09) KHÔNG dùng được bởi
//    bất kỳ tài khoản nào không phải admin. Registry khai
//    `Map.entry("save_error_report", List.of())` — nghĩa CŨ của map rỗng là «không gác»,
//    nhưng PHASE 0B (S-03) đã đổi thành MẶC ĐỊNH TỪ CHỐI (`RbacService.requireActionModule`).
//    Đo thật: probe `sec_probe_017830` ⇒ HTTP 403 «Thao tác chưa được khai báo quyền trong hệ thống.»;
//             admin ⇒ HTTP 200 `{"reportCode":"ER202610010757-0ECC"}`.
//    Ý định thiết kế đã ghi ở `app/screens/ErrorReportModal.tsx:14`: «MọI user đã đăng nhập đều
//    gửi được — action `save_error_report` KHÔNG gắc module».
//    Số liệu từng ghi trong `RbacService` («41 admin + 5 công khai = 46») ĐÃ SAI: đo được
//    65 khai rỗng = 38 admin + 8 công khai + **19 MỒ CÔI** (rỗng + không public + không admin).

const RBAC_JAVA = read("java-backend/application/src/main/java/com/vntech/erp/application/rbac/RbacService.java");

test("MỐC 110 — `save_error_report` phải gửi được bởi MỌI user đã đăng nhập", () => {
  const rbac = stripJavaComments(RBAC_JAVA);
  const pub = between(rbac, "PUBLIC_ACTIONS = java.util.Set.of(", ");", 1200);
  assert.ok(pub, "phải tìm thấy danh sách PUBLIC_ACTIONS");
  assert.match(pub, /"save_error_report"/,
    "⛔ MỐC 110 tái phát: `save_error_report` KHÔNG nằm trong PUBLIC_ACTIONS ⇒ registry khai "
    + "`List.of()` mà map rỗng = 403 ⇒ MỌI user không phải admin bấm «Báo lỗi / Góp ý» đều 403");
  // PUBLIC ≠ ẨN DANH: nhánh dispatch phải còn requireCurrentUser.
  assert.match(stripJavaComments(CONTROLLER),
    /case "save_error_report" -> \{ requireCurrentUser\(request\);/,
    "⛔ Vào PUBLIC_ACTIONS chỉ để BỎ CỔNG MODULE — nhánh dispatch PHẢI giữ `requireCurrentUser(request)` "
    + "để vẫn bắt buộc đăng nhập");
});

test("MỐC 110 — đếm action MỒ CÔI QUYỀN (rỗng + không public + không admin-gated)", () => {
  const rbac = stripJavaComments(RBAC_JAVA);
  const reg = stripJavaComments(REGISTRY);
  const ctrl = stripJavaComments(CONTROLLER);
  const pubBlock = between(rbac, "PUBLIC_ACTIONS = java.util.Set.of(", ");", 1200);
  const pub = new Set([...pubBlock.matchAll(/"([a-z0-9_]+)"/g)].map((m) => m[1]));
  const empty = [...reg.matchAll(/Map\.entry\("([a-z0-9_]+)",\s*List\.of\(\)\)/g)].map((m) => m[1]);
  const cases = [...ctrl.matchAll(/case "([a-z0-9_]+)" ->/g)];
  const adminGated = new Set();
  for (let i = 0; i < cases.length; i++) {
    const a = cases[i].index;
    const b = i + 1 < cases.length ? cases[i + 1].index : Math.min(a + 2000, ctrl.length);
    if (ctrl.slice(a, b).includes("requireRequireAdmin(")) adminGated.add(cases[i][1]);
  }
  const orphans = empty.filter((a) => !pub.has(a) && !adminGated.has(a));
  assert.ok(!orphans.includes("save_error_report"),
    `⛔ MỐC 110 tái phát: \`save_error_report\` mồ côi quyền ⇒ user thường KHÔNG gửi được báo lỗi. `
    + `Mồ côi hiện tại: ${orphans.join(", ")}`);
  assert.ok(orphans.length <= 18,
    `⛔ Số action MỒ CÔI QUYỀN tăng lên ${orphans.length} (đo 19, đã sửa 1 ⇒ phải ≤ 18). `
    + `Mồ côi: ${orphans.join(", ")}`);
});
