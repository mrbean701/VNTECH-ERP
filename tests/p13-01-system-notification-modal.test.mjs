// MT2-P13-01 (§14) — HỢP ĐỒNG modal thông báo HỆ THỐNG khi đăng nhập.
// Nguyên văn `docs/dsh/MASTER_TASK_2.md:272-274`: «Login → Check notifications by userID → Check active
// period → Display system notification modal. Modal hiển thị: **nội dung · người tạo · thời gian phát hành**
// + nút «Không nhắc lại hôm nay».»
//
// GAP đo được: backend ĐÃ CÓ `systemNotifications` (lọc theo userID + thời gian + chưa đọc + snooze) nhưng
// ① ⛔ khối đó **KHÔNG trả `created_by`** ⇒ UI không thể hiện «người tạo»; ② **UI = 0 dòng** (không modal);
// ③ `AppData` **không khai** `systemNotifications` ⇒ bài học TASK-069 (đường đọc thiếu khoá bị bỏ âm thầm).
//
// Phạm vi P13-01 = modal + 3 trường. ⛔ «Không nhắc lại hôm nay» = P13-02; ⛔ «đánh dấu đã đọc» = P13-03
// ⇒ không dựng nút chết, không tự gắn cờ read/snooze (giả lập trạng thái chưa có action).
//
// Chạy: node --import tsx --test tests/p13-01-system-notification-modal.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const page = read("../app/page.tsx");
const shared = read("../lib/ui-shared.tsx");
const adapter = read("../java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/BootstrapDataAdapter.java");

const modal = page.slice(page.indexOf("function SystemNotificationModal("), page.indexOf("function UserModal("));
const noticeQuery = adapter.slice(adapter.indexOf('data.put("systemNotifications"'), adapter.indexOf('data.put("systemNotifications"') + 1800);

test("P13-01 — payload phải trả «người tạo» (createdBy) — §14", () => {
  assert.match(noticeQuery, /c\.created_by AS createdBy/, "⛔ khối systemNotifications phải chiếu `created_by` (trước đây thiếu ⇒ modal không hiện được người tạo)");
  assert.match(noticeQuery, /c\.content/, "phải có nội dung");
  assert.match(noticeQuery, /c\.send_at AS sendAt/, "phải có thời gian phát hành");
});

test("P13-01 — backend vẫn LỌC theo userID + khoảng thời gian + chưa đọc (§14 'Check notifications by userID → Check active period')", () => {
  assert.match(noticeQuery, /LEFT JOIN notification_user_states s ON s\.config_id=c\.id AND s\.user_id=\?/, "phải lọc theo userID của người đang đăng nhập");
  assert.match(noticeQuery, /c\.channel='web'/, "chỉ thông báo kênh Web ở bước này");
  assert.match(noticeQuery, /c\.send_at IS NULL OR c\.send_at<=CURRENT_TIMESTAMP/, "phải kiểm khoảng thời gian gửi");
  assert.match(noticeQuery, /c\.end_at IS NULL OR c\.end_at>CURRENT_TIMESTAMP/, "phải kiểm khoảng thời gian kết thúc");
  assert.match(noticeQuery, /s\.read_at IS NULL/, "chỉ hiện thông báo CHƯA đọc");
  assert.match(noticeQuery, /s\.snooze_until IS NULL OR s\.snooze_until<=CURRENT_TIMESTAMP/, "⛔ không hiện thông báo đã snooze trong ngày");
});

test("P13-01 — `AppData` PHẢI khai `systemNotifications` (bài học TASK-069: thiếu khoá ⇒ mảng rỗng âm thầm)", () => {
  assert.match(shared, /systemNotifications: Row\[\];/, "phải khai BẮT BUỘC (không `?`) để tsc bắt lỗi đường đọc thiếu khoá");
  assert.match(page, /systemNotifications: Array\.isArray\(result\.data\?\.systemNotifications\) \? result\.data\.systemNotifications : \[\]/,
    "khối chuẩn hoá phải luôn cho mảng (⛔ không để undefined làm vỡ modal)");
});

test("P13-01 — modal hiện đúng 3 trường §14: nội dung · người tạo · thời gian phát hành", () => {
  assert.match(modal, /Người tạo:[\s\S]{0,120}notification\.createdBy/, "phải hiện người tạo (fallback «Hệ thống» khi trống)");
  assert.match(modal, /Thời gian phát hành:[\s\S]{0,120}date\(notification\.sendAt\)/, "phải hiện thời gian phát hành");
  assert.match(modal, /notification\.content/, "phải hiện nội dung");
  assert.match(modal, /<BaseModal/, "⛔ phải dùng khuôn modal dùng chung (§23)");
  assert.match(modal, /data-vntech="system-notification-modal"/, "phải có marker nghiệm thu");
});

test("P13-01 — modal hiện tại đã tích hợp P13-02/P13-03 mà không dựng modal riêng", () => {
  assert.match(modal, /mark_notification_snooze/, "P13-02 đã nối action snooze trong cùng modal dùng chung");
  assert.match(modal, /mark_notification_read/, "P13-03 đã nối action read trong cùng modal dùng chung");
  assert.match(modal, /<button type="submit"[^>]*>\{busy \? "Đang lưu…" : "Đóng"\}<\/button>/,
    "phải giữ nút Đóng dạng submit trong modal");
});

test("P13-01 — modal chỉ hiện 1 thông báo theo thứ tự + đóng không làm mất thông báo khác", () => {
  assert.match(page, /const currentSystemNotice=systemNotifications\[0\]/, "hiện tuần tự 1 thông báo (⛔ không dồn cả danh sách vào 1 modal)");
  assert.match(page, /dismissedSystemNotices/, "phải nhớ thông báo đã đóng trong phiên để không mở lại");
  assert.match(page, /<SystemNotificationModal notification=\{currentSystemNotice\} close=\{dismissSystemNotice\} submit=\{action\}\/>/,
    "phải nối modal hiện tại vào màn chính với submit callback dùng chung");
});
