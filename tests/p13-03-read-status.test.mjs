// MT2-P13-03 (§14.1) — HỢP ĐỒNG trạng thái ĐÃ ĐỌC (theo user).
// Nguyên văn `docs/dsh/MASTER_TASK_2.md:277-278`: «Mỗi notification có **"Đánh dấu đã đọc"** + **"Đánh dấu
// tất cả đã đọc"**. Trạng thái **theo user**.» (+ §14: «⛔ không đánh dấu đọc global cho tất cả user»)
//
// 🔴 ROOT CAUSE ĐÃ TÌM RA Ở TẦNG DỮ LIỆU (P1-03 làm backend nhưng BỎ SÓT 1 nhánh):
//   · `notificationsForUser` đọc bằng `LEFT JOIN notification_user_states s … WHERE s.read_at IS NULL`
//     ⇒ một thông báo **CHƯA TỪNG có state row** (chưa snooze, chưa đọc) VẪN hiện.
//   · `markAllRead` bản cũ **CHỈ UPDATE** dòng đã tồn tại ⇒ sau khi bấm «Đánh dấu tất cả đã đọc», các
//     thông báo chưa có state row **VẪN HIỆN LẠI** ⇒ nút không thực sự làm hết ý nghĩa (fake completion).
//   ⇒ FIX: UPDATE + INSERT các dòng còn THIẾU, dùng **ĐÚNG bộ lọc** của `notificationsForUser`.
//
// Hợp đồng backend: `mark_notification_read` ← `{configId}` · `mark_notification_all_read` ← **không tham số**
// · cả hai dùng `cu.id()` từ phiên ⇒ ⛔ không thể đánh dấu global/thay người khác.
//
// Chạy: node --import tsx --test tests/p13-03-read-status.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const page = read("../app/page.tsx");
const store = read("../java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/NotificationStoreAdapter.java");
const useCase = read("../java-backend/application/src/main/java/com/vntech/erp/application/service/NotificationManagementUseCase.java");
const controller = read("../java-backend/web/src/main/java/com/vntech/erp/web/controller/SystemController.java");

const modal = page.slice(page.indexOf("function SystemNotificationModal("), page.indexOf("function UserModal("));
const markAll = store.slice(store.indexOf("public int markAllRead("), store.indexOf("public int markAllRead(") + 2200);

test("P13-03 — UI có ĐÚNG 2 nút §14.1: đánh dấu đã đọc + đánh dấu tất cả đã đọc", () => {
  assert.match(modal, />Đánh dấu đã đọc</, "nút «Đánh dấu đã đọc»");
  assert.match(modal, />Đánh dấu tất cả đã đọc</, "nút «Đánh dấu tất cả đã đọc»");
  assert.match(modal, /submit\("mark_notification_read",\s*\{\s*configId: notification\.configId\s*\}\)/, "gọi action đánh dấu đã đọc với configId");
  assert.match(modal, /submit\("mark_notification_all_read",\s*\{\s*\}\)/, "⛔ action đánh dấu TẤT CẢ không nhận tham số");
});

test("P13-03 — ⛔ KHÔNG gửi userId ở cả 2 nút (trạng thái THEO USER, không global)", () => {
  for (const action of ["mark_notification_read", "mark_notification_all_read"]) {
    const at = modal.indexOf(`submit("${action}"`);
    const call = modal.slice(at, at + 180);
    assert.ok(!/userId|user_id/.test(call), `⛔ ${action} không được mang userId — backend lấy \`cu.id()\` từ phiên`);
  }
  assert.match(controller, /mark_notification_read[\s\S]{0,120}requireCurrentUser\(request\)[\s\S]{0,160}markRead\(cu\.id\(\), payload\)/, "⛔ backend phải lấy userId từ phiên");
  assert.match(controller, /mark_notification_all_read[\s\S]{0,120}requireCurrentUser\(request\)[\s\S]{0,160}markAllRead\(cu\.id\(\)\)/, "⛔ đánh dấu tất cả cũng phải theo user của phiên");
});

test("P13-03 — ROOT CAUSE: markAllRead phải INSERT nốt dòng CHƯA có state row", () => {
  assert.match(markAll, /UPDATE notification_user_states SET read_at=COALESCE\(read_at,\?\)/, "phải UPDATE dòng đã tồn tại");
  assert.match(markAll, /INSERT INTO notification_user_states/,
    "⛔ PHẢI INSERT các dòng còn thiếu — nếu không, thông báo chưa có state row sẽ vẫn hiện sau khi đánh dấu tất cả đã đọc");
  assert.match(markAll, /NOT EXISTS \(SELECT 1 FROM notification_user_states s/,
    "INSERT phải loại trừ dòng đã có (⛔ không tạo trùng)");
  assert.match(markAll, /return updated \+ inserted;/, "trả về TỔNG số thông báo vừa đánh dấu (message của API phải đúng)");
});

test("P13-03 — bộ lọc INSERT phải KHỚP đúng bộ lọc của `notificationsForUser` (⛔ không lệch)", () => {
  for (const clause of [/c\.active=1/, /c\.channel='web'/, /c\.send_at IS NULL OR c\.send_at<=\?/, /c\.end_at IS NULL OR c\.end_at>\?/]) {
    assert.match(markAll, clause, `bộ lọc INSERT thiếu: ${clause}`);
  }
  const listQuery = store.slice(store.indexOf("notificationsForUser("), store.indexOf("notificationsForUser(") + 1200);
  assert.match(listQuery, /c\.active=1 AND c\.channel='web'/, "nguồn hiển thị cùng điều kiện");
});

test("P13-03 — markRead vẫn bám userId + configId và markAllRead chỉ bám userId (⛔ không đổi hợp đồng)", () => {
  assert.match(useCase, /public Map<String, Object> markRead\(String userId, Map<String, Object> payload\)/, "markRead(userId, payload)");
  assert.match(useCase, /if \(configId\.isEmpty\(\)\) throw Api\("Thiếu configId\."\)/, "thiếu configId ⇒ 400");
  // ⚠️ SQL ở đây được NỐI CHUỖI bằng `" + "` ⇒ `read_at=…` và `WHERE config_id=…` KHÔNG nằm trong cùng
  // một literal ⇒ regex phải chấp nhận khoảng trắng/ký tự nối giữa chúng (bài học: soi mã thật, đừng đoán).
  assert.match(store, /UPDATE notification_user_states SET read_at=COALESCE\(read_at,\?\),updated_at=\?[\s\S]{0,80}WHERE config_id=\? AND user_id=\?/,
    "markRead ghi theo (config_id, user_id)");
  assert.match(store, /markRead\(String configId, String userId, Instant now\)/, "chữ ký markRead(configId, userId, now)");
  // ⚠️ `markRead` có **ĐÚNG 1** lần INSERT (tạo dòng trạng thái khi chưa có) — chú thích nằm TRƯỚC lệnh đó,
  // nên ⛔ đừng bắt "INSERT … chú thích … INSERT" (chỉ có 1 INSERT) — khớp theo thứ tự thật trong mã.
  const markReadBlock = store.slice(store.indexOf("markRead(String configId"), store.indexOf("markRead(String configId") + 1200);
  assert.match(markReadBlock, /Chưa từng có dòng trạng thái[\s\S]{0,300}INSERT INTO notification_user_states/,
    "⛔ markRead phải tạo dòng trạng thái khi chưa có (cùng hướng sửa với markAllRead ở P13-03)");
});

test("P13-03 — UI khoá nút khi đang lưu + báo lỗi (⛔ không nuốt lỗi)", () => {
  assert.match(modal, /const \[busy, setBusy\] = useState\(false\)/, "có trạng thái bận");
  const footer = modal.slice(modal.indexOf('<footer className="modal-footer">'), modal.indexOf("</footer>"));
  assert.match(footer, /disabled=\{busy\}/, "⛔ nút phải khoá khi đang gọi API (tránh bấm nhiều lần)");
  assert.match(modal, /setNoticeError\(/, "phải hiện lỗi API");
});
