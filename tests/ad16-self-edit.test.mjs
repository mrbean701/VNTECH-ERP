// PHASE 7 (`AD-16`) — HỢP ĐỒNG: USER TỰ SỬA THÔNG TIN ĐƯỢC PHÉP (tên hiển thị · ảnh · liên hệ · mật khẩu).
// Nguyên văn `docs/25_TODO_ROADMAP.md` dòng `AD-16`: «Cho user sửa thông tin được phép
// (tên hiển thị · ảnh · liên hệ · mật khẩu)» (phụ thuộc `S-07` ✔).
//
// BẰNG CHỨNG ĐÃ ĐO — chỉ có 2/4 trường có action TỰ PHỤC VỤ ở cả 2 đường ghi:
//   • `change_password`        — `scripts/system-route.mjs:3227` · `SystemController.java:236`
//   • `update_profile_avatar`  — `scripts/system-route.mjs:3243` · `SystemController.java:253`
//   KHÔNG có action nào cho `users.full_name` (tên hiển thị) và `users.email` (liên hệ) ⇒ muốn đủ 4 trường
//   phải THÊM ACTION = sửa `scripts/**` + Java = BỊ CẤM ⇒ mục này **BLOCKED** (đã làm được 2/4 trường).
//
// ĐỐI CHỨNG ÂM: (1) nếu ai đánh dấu tên hiển thị/liên hệ là `editable` mà không có action ⇒ cổng phải HỎNG;
// (2) UI không được có ô nhập cho trường chưa có action (tránh nút chết); (3) không được hardcode quyền admin
// cho chức năng tự phục vụ (mọi vai trò đều có quyền sửa thông tin CỦA MÌNH).
//
// Chạy riêng:  node --test tests/ad16-self-edit.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import esbuild from "esbuild";

const root = new URL("../", import.meta.url);
const read = (p) => readFileSync(new URL(p, root), "utf8");
const pure = read("app/screens/admin-governance-pure.ts");
const page = read("app/page.tsx");
const DOC = "docs/agent-progress/AD-16-TU-SUA-THONG-TIN-BLOCKED.md";

function loadPure(names) {
  const start = pure.search(/^\/\/ AD-PURE-BEGIN$/m);
  const end = pure.search(/^\/\/ AD-PURE-END$/m);
  const block = pure.slice(start + "// AD-PURE-BEGIN".length, end).replace(/^export /gm, "");
  const js = esbuild.transformSync(block, { loader: "ts" }).code;
  return new Function(`${js}\nreturn { ${names.join(", ")} };`)();
}

function settingsBlock() {
  const start = page.indexOf("function AccountSettingsModal(");
  const end = page.indexOf("function ModalFooter(", start);
  assert.ok(start > 0 && end > start, "Không tìm thấy `AccountSettingsModal` trong app/page.tsx");
  return page.slice(start, end);
}

test("AD-16 — 4 trường nguyên văn: 2 trường có action THẬT, 2 trường KHÔNG có action", () => {
  const { SELF_EDIT_FIELDS, selfEditableFields, selfBlockedFields, selfEditIsComplete } = loadPure(
    ["SELF_EDIT_FIELDS", "selfEditableFields", "selfBlockedFields", "selfEditIsComplete"]);
  assert.deepEqual(SELF_EDIT_FIELDS.map((f) => f.label),
    ["Tên hiển thị", "Ảnh đại diện", "Liên hệ (email)", "Mật khẩu"],
    "Phải khai ĐÚNG 4 trường nguyên văn yêu cầu, đúng thứ tự");
  assert.deepEqual(selfEditableFields().map((f) => f.action).sort(), ["change_password", "update_profile_avatar"],
    "2 trường sửa được phải trỏ tới action TỰ PHỤC VỤ ĐÃ CÓ");
  assert.deepEqual(selfBlockedFields().map((f) => f.key).sort(), ["email", "fullName"],
    "Tên hiển thị + liên hệ KHÔNG có action ⇒ không thể tự sửa");
  assert.equal(selfEditIsComplete(), false, "Thiếu 2/4 ⇒ mục AD-16 KHÔNG thể đóng ⇒ BLOCKED");
});

test("AD-16 — ĐỐI CHỨNG ÂM: đánh dấu editable mà KHÔNG có action ⇒ cổng phải HỎNG", () => {
  const { SELF_EDIT_FIELDS } = loadPure(["SELF_EDIT_FIELDS"]);
  const consistent = (fields) => fields.every((f) => Boolean(f.action) === Boolean(f.editable));
  assert.equal(consistent(SELF_EDIT_FIELDS), true, "Dữ liệu THẬT phải nhất quán action ⇔ editable");
  const faked = SELF_EDIT_FIELDS.map((f) => f.key === "fullName" ? { ...f, editable: true } : f);
  assert.equal(consistent(faked), false, "[đối chứng âm] editable=true mà action=null ⇒ cổng phải BẮT được");
});

test("AD-16 — bằng chứng: chỉ 2 action tự phục vụ tồn tại ở CẢ 2 đường ghi", () => {
  const js = read("scripts/system-route.mjs");
  const java = read("java-backend/web/src/main/java/com/vntech/erp/web/controller/SystemController.java");
  assert.match(js, /if \(action === "change_password"\)/, "JS phải có `change_password`");
  assert.match(js, /if \(action === "update_profile_avatar"\)/, "JS phải có `update_profile_avatar`");
  assert.match(java, /case "change_password" -> \{/, "Java phải có case `change_password`");
  assert.match(java, /case "update_profile_avatar" -> \{/, "Java phải có case `update_profile_avatar`");
  // ĐỐI CHỨNG ÂM: KHÔNG có action tự sửa tên hiển thị / email (chỉ có ĐÚNG 1 action chứa «profile»).
  const profileActions = [...js.matchAll(/if \(action === "([a-z_]*profile[a-z_]*)"\)/g)].map((m) => m[1]);
  assert.deepEqual(profileActions, ["update_profile_avatar"],
    `Chỉ được có ĐÚNG 1 action tự phục vụ hồ sơ (avatar); đọc được: ${profileActions.join(", ") || "(không có)"}`);
  assert.doesNotMatch(js, /action === "(update_own_profile|save_my_profile|update_my_profile|save_self_profile|update_my_contact)"/,
    "KHÔNG được tồn tại action tự sửa tên hiển thị / liên hệ (nếu có thì kết luận BLOCKED của AD-16 sai)");
});

test("AD-16 — UI: modal tự phục vụ chỉ nhập trường CÓ action + ghi rõ lý do 2 trường còn lại", () => {
  const block = settingsBlock();
  assert.match(block, /update_profile_avatar/, "UI phải gọi action ảnh đại diện");
  assert.match(block, /change_password/, "UI phải gọi action đổi mật khẩu");
  assert.match(block, /data-self-edit="AD-16"/, "Phải có dấu hiệu hợp đồng `AD-16`");
  assert.match(block, /SELF_EDIT_FIELDS|selfBlockedFields\(\)/, "UI phải dùng danh mục trường dùng chung (một nguồn sự thật)");
  assert.match(block, /chưa có action|không có action/i, "Phải ghi rõ 2 trường còn lại KHÔNG có action tự phục vụ");
  // Không có ô nhập nào cho tên hiển thị / email (tránh nút chết).
  assert.doesNotMatch(block, /name="fullName"/, "KHÔNG được dựng ô nhập tên hiển thị khi chưa có action");
  assert.doesNotMatch(block, /name="email"/, "KHÔNG được dựng ô nhập email khi chưa có action");
  // Không hardcode admin: mọi vai trò tự sửa thông tin của mình.
  assert.doesNotMatch(block, /isAdminUser/, "Chức năng tự phục vụ KHÔNG được gắn cổng admin");
});

test("AD-16 — TÀI LIỆU BLOCKED: lý do + bằng chứng grep + phần đã làm được", () => {
  assert.ok(existsSync(new URL(DOC, root)), `Thiếu tài liệu bắt buộc ${DOC}`);
  const text = readFileSync(new URL(DOC, root), "utf8");
  assert.match(text, /\*\*BLOCKED\*\*/, "Phải ghi ĐÚNG nguyên văn `**BLOCKED**`");
  assert.match(text, /scripts\/system-route\.mjs/, "Phải nêu bằng chứng ở route JS");
  assert.match(text, /SystemController\.java/, "Phải nêu bằng chứng ở route Java");
  assert.match(text, /2\/4|2 trường/, "Phải nói rõ phần đã làm được (2/4 trường)");
  assert.match(text, /BỊ CẤM|cấm sửa/i, "Phải nêu ràng buộc: không được sửa `scripts/**`");
});
