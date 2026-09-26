// MT2-P13-02 (§14) — HỢP ĐỒNG nút «Không nhắc lại hôm nay».
// Nguyên văn `docs/dsh/MASTER_TASK_2.md:275`: «Phải lưu trạng thái theo **userID + notificationID** ⇒ ⛔
// **không đánh dấu đọc global cho tất cả user**.»
//
// HỢP ĐỒNG BACKEND (đọc từ mã, không đoán):
//   · `SystemController:1274-1277` → `notificationManagementUseCase.snooze(cu.id(), payload)` — userId **luôn**
//     lấy từ PHIÊN ⇒ ⛔ client KHÔNG THỂ snooze thay người khác.
//   · `NotificationManagementUseCase.snooze:225-235` nhận `{configId, snoozeUntil?}`; `configId` rỗng ⇒ 400;
//     `snoozeUntil` không gửi ⇒ mặc định **+24h** (luật CÓ SẴN — ⛔ task này không tự đặt luật mới).
//   · `NotificationStoreAdapter:177-181` ghi `notification_user_states` theo `(config_id, user_id)` ⇒ đúng
//     «userID + notificationID».
//   · `RbacService:45` đưa `mark_notification_snooze` vào `PUBLIC_ACTIONS` ⇒ mọi user đã đăng nhập tự snooze được.
//   ⚠️ `ActionRbacRegistry:59` là `List.of()` — ⛔ đây là **mặc định từ chối 403**, nhưng `PUBLIC_ACTIONS` được
//      kiểm **TRƯỚC** nên vẫn qua. Test này ghim lại đúng thứ tự đó để không ai tưởng là 403.
//
// Ngoài ra task này sửa 1 LỖI CỦA CHÍNH MÌNH ở P13-01: `ModalFooter` có nút primary kiểu **submit**, đặt ngoài
// `<form>` ⇒ NÚT CHẾT («Đóng» không làm gì). Đã bọc modal trong `<form>` + nút submit thật.
//
// Chạy: node --import tsx --test tests/p13-02-snooze-notification.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const page = read("../app/page.tsx");
const controller = read("../java-backend/web/src/main/java/com/vntech/erp/web/controller/SystemController.java");
const useCase = read("../java-backend/application/src/main/java/com/vntech/erp/application/service/NotificationManagementUseCase.java");
const store = read("../java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/NotificationStoreAdapter.java");
const rbac = read("../java-backend/application/src/main/java/com/vntech/erp/application/rbac/RbacService.java");

const modal = page.slice(page.indexOf("function SystemNotificationModal("), page.indexOf("function UserModal("));

test("P13-02 — modal có nút «Không nhắc lại hôm nay» gọi đúng action", () => {
  assert.match(modal, /Không nhắc lại hôm nay/, "phải có đúng nhãn §14");
  // ⚠️ Phải cho phép KHOẢNG TRẮNG sau dấu phẩy: mã nguồn viết `snooze", { configId: …`.
  assert.match(modal, /submit\("mark_notification_snooze",\s*\{\s*configId: notification\.configId\s*\}\)/,
    "phải gọi `mark_notification_snooze` với `configId` của thông báo đang hiện");
});

test("P13-02 — ⛔ KHÔNG gửi userId (chống snooze thay người khác / đánh dấu global)", () => {
  const call = modal.slice(modal.indexOf('submit("mark_notification_snooze"'), modal.indexOf('submit("mark_notification_snooze"') + 200);
  assert.ok(!/userId|user_id/.test(call), "⛔ payload KHÔNG được mang userId — backend lấy `cu.id()` từ phiên");
  assert.match(controller, /mark_notification_snooze[\s\S]{0,120}requireCurrentUser\(request\)[\s\S]{0,160}snooze\(cu\.id\(\), payload\)/,
    "⛔ backend phải lấy userId từ PHIÊN (cu.id()) — đây là chốt chặn «global» của §14");
});

test("P13-02 — ⛔ KHÔNG tự đặt luật snooze (giữ luật sẵn có +24h của backend)", () => {
  const call = modal.slice(modal.indexOf('submit("mark_notification_snooze"'), modal.indexOf('submit("mark_notification_snooze"') + 200);
  assert.ok(!/snoozeUntil/.test(call), "⛔ không gửi snoozeUntil ⇒ dùng luật sẵn có; tự tính sẽ là bịa nghiệp vụ");
  assert.match(useCase, /Instant\.now\(\)\.plusSeconds\(24 \* 3600\)/, "luật mặc định +24h phải còn nguyên ở backend");
});

test("P13-02 — backend ghi trạng thái theo (config_id, user_id) = userID + notificationID", () => {
  assert.match(store, /UPDATE notification_user_states SET snooze_until=\?[\s\S]{0,120}WHERE config_id=\? AND user_id=\?/,
    "phải ghi theo CẢ config_id LẪU user_id (⛔ không ghi global)");
  assert.match(useCase, /if \(configId\.isEmpty\(\)\) throw Api\("Thiếu configId\."\)/, "thiếu configId ⇒ 400");
});

test("P13-02 — mọi user đã đăng nhập đều dùng được (PUBLIC_ACTIONS kiểm TRƯỚC registry)", () => {
  assert.match(rbac, /"mark_notification_snooze"/, "phải nằm trong PUBLIC_ACTIONS (⛔ nếu chỉ có List.of() ⇒ 403)");
  const publicAt = rbac.indexOf('"mark_notification_snooze"');
  assert.ok(publicAt > 0, "phải khai trong RbacService.PUBLIC_ACTIONS");
});

test("P13-02 — sửa lỗi nút chết của P13-01: modal bọc `<form>` + nút Đóng là submit thật", () => {
  assert.match(modal, /<form onSubmit=\{\(event\) => \{ event\.preventDefault\(\); close\(\); \}\}>/,
    "⛔ phải bọc form để nút Đóng thực sự hoạt động (ModalFooter dùng nút submit)");
  assert.ok(!/<ModalFooter close=\{close\} label="Đóng"\/>/.test(modal),
    "⛔ ModalFooter ngoài form tạo NÚT CHẾT (lỗi P13-01 đã phát hiện & sửa ở task này)");
  assert.match(modal, /<button type="submit" className="primary" disabled=\{busy\}>/, "nút Đóng phải là submit thật");
});

test("P13-02 — có trạng thái bận + báo lỗi (⛔ không nuốt lỗi im lặng)", () => {
  assert.match(modal, /const \[busy, setBusy\] = useState\(false\)/, "phải khoá nút khi đang gọi API (tránh bấm 2 lần)");
  assert.match(modal, /setNoticeError\(/, "lỗi API phải hiện cho người dùng (⛔ không im lặng)");
});
