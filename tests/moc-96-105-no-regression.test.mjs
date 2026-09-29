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

test("BUG-01 — payload `save_hr_record` KHÔNG được chứa field mà bảng hr_records thiếu", () => {
  const block = between(HR_MODAL, 'submit("save_hr_record"', ");\n", 1400);
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
  const block = between(HR_MODAL, 'submit("save_hr_record"', ");\n", 1400);
  assert.doesNotMatch(block, /(?:^|[\s{,])email:/m,
    "⛔ BUG-01 tái phát: `email` lại được gửi vào save_hr_record (bảng không có cột này)");
  assert.match(HR_MODAL, /accountPayload\.email\s*=/,
    "email phải đi qua accountPayload → update_user (đúng cột users.email)");
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
