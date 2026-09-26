// MT2-P12-01 (§13.1) — HỢP ĐỒNG tab THÔNG BÁO (Quản trị hệ thống).
// Nguyên văn `docs/dsh/MASTER_TASK_2.md:254`: «## 13.1. Tab THÔNG BÁO — Thêm tab **Thông báo** — cấu hình
// thông báo cho user qua **Web hoặc Email**. Danh sách có **CRUD · Search · Sort · Filter**.»
//
// GAP đo được trước khi làm: backend ĐÃ CÓ (`save_notification_config` / `notification_configs` /
// `delete_notification_config` / `set_notification_config_status` trong `SystemController`, RBAC module
// `admin`, 3 bảng V26) nhưng **UI = 0 dòng** ⇒ `ADMIN_STEP_LABELS` không có bước «Thông báo».
//
// Chạy: node --import tsx --test tests/p12-01-notification-config-tab.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const labels = readFileSync(new URL("../app/screens/admin-governance-pure.ts", import.meta.url), "utf8");
const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");

test("P12-01 — ADMIN_STEP_LABELS phải có bước «Thông báo»", () => {
  const block = labels.slice(labels.indexOf("export const ADMIN_STEP_LABELS"), labels.indexOf("];", labels.indexOf("export const ADMIN_STEP_LABELS")));
  assert.match(block, /"Thông báo"/, "§13.1 yêu cầu thêm tab Thông báo vào màn Quản trị hệ thống");
});

test("P12-01 — màn Quản trị render khối thông báo với marker nghiệm thu", () => {
  assert.match(page, /step===13&&<section[^>]*data-vntech="notification-config-tab"/,
    "phải render khối THÔNG BÁO ở bước 13 (sau «Cấu hình hệ thống»)");
  assert.match(page, /<ListToolbar\s+title="CẤU HÌNH THÔNG BÁO"/,
    "danh sách phải dùng shared `ListToolbar` (§22) — không tự dựng toolbar riêng");
});

test("P12-01 — danh sách có Search · Sort · Filter (§13.1)", () => {
  assert.match(page, /search=\{\{value:notifQuery,onChange:setNotifQuery/,
    "phải có ô tìm kiếm (search trên mã · tên · nội dung)");
  assert.match(page, /sort=\{\{value:notifSort,onChange:setNotifSort/,
    "phải có sort (mới nhất · cũ nhất · tên A→Z)");
  assert.match(page, /filters=\{\[\{key:"channel"[\s\S]*?\{key:"status"/,
    "phải có filter kênh (Web/Email) + trạng thái (đang bật/đã tắt)");
});

test("P12-01 — nguồn dữ liệu = action `notification_configs` (⛔ không bịa payload)", () => {
  assert.match(page, /requestApi\("notification_configs"\)/,
    "phải nạp danh sách bằng action chỉ đọc `notification_configs`");
  assert.match(page, /res\?\.configs/, "đọc mảng `configs` trả về (jsonResult phẳng hoá: {ok, configs})");
  assert.ok(!/notificationConfigs\s*:\s*\[[\s\S]{0,40}(MOCK|FAKE|DEMO)/i.test(page),
    "⛔ không được tạo dữ liệu thông báo giả");
});

test("P12-01 — thao tác trên dòng dùng action ĐÃ CÓ của backend (không bịa action mới)", () => {
  assert.match(page, /action\("set_notification_config_status",\{configId:row\.id,active:/,
    "nút Bật/Tắt phải gọi `set_notification_config_status` với {configId, active}");
  assert.match(page, /action\("delete_notification_config",\{configId:row\.id\}\)/,
    "nút Xoá phải gọi `delete_notification_config` với {configId}");
});

test("P12-01 — nhãn người nhận phủ đủ 5 kiểu recipient của §13.2", () => {
  assert.match(page, /all:"Toàn bộ user"/, "recipientMode=all");
  assert.match(page, /user:"1 user"/, "recipientMode=user");
  assert.match(page, /users:"Nhiều user"/, "recipientMode=users");
  assert.match(page, /department:"Phòng ban"/, "recipientMode=department");
  assert.match(page, /project:"Dự án"/, "recipientMode=project");
});
