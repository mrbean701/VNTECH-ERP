// MT2-P12-02 (§13.2) — HỢP ĐỒNG modal tạo/sửa cấu hình thông báo.
// Nguyên văn `docs/dsh/MASTER_TASK_2.md:257-258`: «Loại thông báo (**Web** / **Email**) · Tên · Mã ·
// Nội dung · Người nhận · Thời gian gửi · **Thời gian kết thúc (đối với Web)**. **Recipient** có thể:
// **user đơn · nhiều user · phòng ban · dự án · toàn bộ user** ⇒ thiết kế recipient targeting **đủ linh
// hoạt để mở rộng sau này**.»
//
// Hợp đồng backend (`NotificationManagementUseCase.saveConfig`): Update = `configId` (⛔ không phải `id`) ·
// `channel ∈ {web,email}` · `recipientMode ∈ {all,user,users,department,project}` · `targets:[{targetType,targetId}]`
// bị THAY TOÀN BẢN · thời gian parse `Instant.parse` hoặc `LocalDateTime` **UTC** ⇒ phải gửi ISO-8601.
//
// Chạy: node --import tsx --test tests/p12-02-notification-config-modal.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
// ⚠️ Ranh giới cắt PHẢI bắt đầu từ `NOTIFICATION_TARGET_TYPES` (khai báo nằm TRƯỚC hàm modal, cùng khối §13.2)
//    — cắt từ `function NotificationConfigModal` sẽ vô tình bỏ mất `toUtcIso` và bảng targetType.
const modal = page.slice(page.indexOf("const NOTIFICATION_TARGET_TYPES"), page.indexOf("function SystemLevelModal"));
const listBlock = page.slice(page.indexOf('data-vntech="notification-config-tab"'), page.indexOf("</section>}\n    {/* AD-03"));

test("P12-02 — modal dùng KHUÔN DÙNG CHUNG (⛔ không dựng modal thứ hai)", () => {
  assert.match(modal, /<BaseModal title=\{editing \?/, "phải dùng shared `BaseModal` (§23)");
  assert.match(modal, /<ModalFooter close=\{close\} label=\{editing \?/, "phải dùng `ModalFooter` dùng chung");
  assert.ok(!/createPortal|<div className="modal-overlay"/.test(modal), "⛔ không tự dựng lớp nền modal");
});

test("P12-02 — đủ 8 trường §13.2", () => {
  for (const [field, label] of [
    ["channel", "Loại thông báo"],
    ["code", "Mã thông báo"],
    ["name", "Tên thông báo"],
    ["content", "Nội dung"],
    ["sendAt", "Thời gian gửi"],
    ["endAt", "Thời gian kết thúc"],
  ]) {
    assert.match(modal, new RegExp(label), `thiếu trường: ${label}`);
    assert.ok(modal.includes(field) || modal.includes(field[0].toUpperCase() + field.slice(1)), `thiếu state/payload cho ${field}`);
  }
  assert.match(modal, /<textarea rows=\{3\}/, "Nội dung phải là textarea (nội dung thông báo dài)");
  assert.match(modal, /type="datetime-local"/, "thời gian phải dùng datetime-local");
});

test("P12-02 — «Thời gian kết thúc» CHỈ hiện với kênh Web (§13.2)", () => {
  assert.match(modal, /\{channel === "web" && <label><span>Thời gian kết thúc/,
    "ô Thời gian kết thúc phải bọc điều kiện kênh === web");
  assert.match(modal, /endAt: channel === "web" \? toUtcIso\(endAt\) : ""/,
    "⛔ khi kênh Email phải gửi endAt rỗng (backend vẫn lưu trường ⇒ rác) ");
});

test("P12-02 — thời gian gửi đúng định dạng backend (ISO-8601 UTC)", () => {
  assert.match(modal, /function toUtcIso\(/, "phải có hàm đổi giờ cục bộ → ISO");
  assert.match(modal, /return parsed\.toISOString\(\)/,
    "⛔ gửi `datetime-local` thô ⇒ backend hiểu là UTC ⇒ LỆCH MÚI GIỜ; phải toISOString()");
});

test("P12-02 — đủ 5 kiểu recipient §13.2 + targets đúng cấu trúc", () => {
  for (const [value, label] of [["all", "Toàn bộ user"], ["user", "1 user"], ["users", "Nhiều user"], ["department", "Phòng ban"], ["project", "Dự án"]]) {
    assert.match(modal, new RegExp(`<option value="${value}">${label}</option>`), `thiếu lựa chọn người nhận: ${value}`);
  }
  assert.match(modal, /targets: recipientMode === "all" \? \[\] : targetIds\.map\(\(targetId\) => \(\{ targetType, targetId \}\)\)/,
    "⛔ mode=all phải gửi targets rỗng; các mode khác gửi {targetType,targetId}");
  assert.match(modal, /user: "user",\s*\n?\s*users: "user",/,
    "⚠️ `user` và `users` phải cùng targetType='user' (backend gộp về bảng đích polymorphic)");
  assert.match(modal, /recipientMode !== "all" && targetIds\.length === 0/,
    "phải chặn mode cụ thể mà chưa chọn đối tượng nhận");
});

test("P12-02 — nguồn chọn đối tượng lấy từ DỮ LIỆU THẬT (⛔ không bịa danh sách)", () => {
  assert.match(modal, /data\.organizationUnits/, "phòng ban lấy từ data.organizationUnits");
  assert.match(modal, /data\.adminProjects/, "dự án lấy từ data.adminProjects");
  assert.match(modal, /data\.users/, "user lấy từ data.users");
  assert.ok(!/MOCK_|FAKE_USER|demoUser/i.test(modal), "⛔ không được tạo danh sách user giả");
});

test("P12-02 — nút Tạo / Sửa trong tab THÔNG BÁO đã nối vào modal (⛔ không còn nút chết)", () => {
  assert.match(listBlock, /open\("notificationConfig"\)/, "nút TẠO THÔNG BÁO phải mở modal");
  assert.match(listBlock, /open\("notificationConfig",row\)/, "nút Sửa trên dòng phải mở modal kèm dòng");
  assert.match(page, /modal === "notificationConfig" && <NotificationConfigModal/,
    "phải đăng ký modal trong registry `modal === …` của page.tsx");
});

test("P12-02 — payload Update dùng `configId` (⛔ không phải `id`)", () => {
  assert.match(modal, /\.\.\.\(editing \? \{ configId: row\?\.id \} : \{\}\)/,
    "khi sửa phải gửi configId — backend `saveConfig` đọc `configId` để quyết định UPDATE");
});
