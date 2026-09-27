// MT3-UI-14 — HỢP ĐỒNG: Quản trị hệ thống (§I).
//   (1) ⛔ BỎ nhãn/khối «PHÂN QUYỀN NGƯỜI DÙNG» nằm PHÍA TRÊN các tab (chức năng đã chia thành tab).
//       ⛔ KHÔNG xoá tab và ⛔ KHÔNG đổi quyền nào ngoài yêu cầu.
//   (2) Modal «Tạo thông báo» phải có: đối tượng nhận Toàn bộ/Phòng ban/Dự án/Tùy chọn ·
//       TÌM/LỌC trong danh sách · chọn nhiều bằng checkbox · DANH SÁCH ĐÃ CHỌN bỏ được từng mục ·
//       nút Lưu · ⛔ không mất lựa chọn khi lọc.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const page = read("app/page.tsx");
const css = read("app/styles/canonical.css");

test("MT3-UI-14 — ⛔ đã BỎ nhãn «PHÂN QUYỀN NGƯỜI DÙNG» phía trên các tab", () => {
  assert.doesNotMatch(page, /title="PHÂN QUYỀN NGƯỜI DÙNG"/, "⛔ nhãn «PHÂN QUYỀN NGƯỜI DÙNG» phía trên tab phải bị bỏ (§I)");
  assert.doesNotMatch(page, /note="Nhân sự → Tổ chức → Chức danh → Nhóm quyền → Quyền phòng ban/,
    "⛔ khối ghi chú liệt kê các bước phía trên tab phải bị bỏ (§I)");
});

test("MT3-UI-14 — ⛔ KHÔNG xoá tab: vẫn đủ 13 tab quản trị (gồm «Thông báo»)", () => {
  const pure = read("app/screens/admin-governance-pure.ts");
  const match = pure.match(/ADMIN_STEP_LABELS\s*=\s*\[([\s\S]*?)\]/);
  assert.ok(match, "không tìm thấy ADMIN_STEP_LABELS");
  const labels = [...match[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  assert.equal(labels.length, 13, `⛔ phải giữ nguyên 13 tab, đang có ${labels.length}`);
  assert.ok(labels.includes("Thông báo"), "tab «Thông báo» phải còn");
  for (const must of ["Tài khoản", "Tổ chức", "Phân quyền người dùng", "Audit log"]) {
    assert.ok(labels.includes(must), `⛔ tab «${must}» bị mất`);
  }
});

test("MT3-UI-14 — modal thông báo: đủ 4 loại đối tượng nhận (Toàn bộ · user · Phòng ban · Dự án)", () => {
  for (const mode of ["all", "user", "users", "department", "project"]) {
    assert.match(page, new RegExp(`recipientMode[^;]{0,200}"${mode}"|value="${mode}"`), `thiếu đối tượng nhận «${mode}»`);
  }
  assert.match(page, /NOTIFICATION_TARGET_TYPES/, "phải ánh xạ recipientMode → targetType qua nguồn dùng chung");
});

test("MT3-UI-14 — §I: có TÌM/LỌC trong danh sách đối tượng nhận", () => {
  assert.match(page, /setTargetQuery/, "phải có state từ khoá tìm trong danh sách đối tượng");
  assert.match(page, /filteredTargetOptions/, "phải có danh sách đã LỌC để render");
  assert.match(page, /placeholder="Nhập tên, mã hoặc tài khoản\.\.\."/, "phải có ô nhập tìm kiếm");
  assert.match(page, /Không có mục nào khớp từ khoá tìm kiếm/, "phải có trạng thái rỗng khi lọc không ra kết quả");
});

test("MT3-UI-14 — §I: hiện DANH SÁCH ĐÃ CHỌN trong modal + bỏ được từng mục", () => {
  assert.match(page, /data-vntech="notification-target-chosen"/, "phải có khối hiển thị danh sách đã chọn");
  assert.match(page, /notification-target-chip/, "mỗi mục đã chọn phải là 1 chip");
  assert.match(page, /aria-label=\{`Bỏ \$\{/, "chip phải có nút BỎ kèm nhãn trợ năng");
  assert.match(page, /setTargetIds\(\(current\) => current\.includes\(id\) \? current\.filter/, "bỏ chọn phải cập nhật state thật");
});

test("MT3-UI-14 — §I: ⛔ LỌC chỉ ẩn HIỂN THỊ, KHÔNG làm mất lựa chọn đã tick", () => {
  const fn = page.slice(page.indexOf("const filteredTargetOptions"), page.indexOf("const filteredTargetOptions") + 300);
  assert.doesNotMatch(fn, /setTargetIds|targetIds\s*=/, "⛔ hàm lọc KHÔNG được đụng vào danh sách đã chọn");
  // ⛔ Lọc theo TỪ KHOÁ, không theo trạng thái tick.
  assert.match(fn, /includes\(targetQuery/, "phải lọc theo từ khoá");
});

test("MT3-UI-14 — §I: danh sách dài vẫn cuộn được trong modal (không tràn)", () => {
  assert.match(css, /\.notification-target-list\s*\{[^}]*overflow:\s*auto/, "danh sách đối tượng phải cuộn được");
  assert.match(css, /\.notification-target-list\s*\{[^}]*max-height:\s*min\(/, "⛔ giới hạn cao theo viewport, không px cứng");
  assert.match(css, /@media \(max-width: 650px\)[\s\S]{0,120}\.notification-target-list/, "phải có xử lý cho màn hẹp");
});

test("MT3-UI-14 — đổi loại đối tượng thì XOÁ từ khoá tìm (danh sách đổi nguồn)", () => {
  assert.match(page, /setRecipientMode\(event\.target\.value\); setTargetIds\(\[\]\); setTargetQuery\(""\)/,
    "đổi đối tượng nhận phải reset cả lựa chọn và từ khoá tìm");
});
