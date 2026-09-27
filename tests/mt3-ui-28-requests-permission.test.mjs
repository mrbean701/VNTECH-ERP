// MT3 ma trận **#9** — «Phân quyền nút»: màn Đề nghị mua hàng (`Requests.tsx`).
//
// ⚠️ LỊCH SỬ THẬT (ghi lại để phiên sau không lặp lại):
//   Lần 1 tôi kết luận «⛔ KHÔNG có khoảng trống» dựa trên MẪU GREP QUÁ HẸP
//   (`permission\??:\s*\(`) ⇒ báo «0/40 màn có prop permission» ⇒ **SAI**.
//   Thực tế: **15/40** màn CÓ prop `permission` (khai kiểu `permission: Row` — không có dấu `(`).
//   ⇒ `Requests.tsx` là **ngoại lệ thật**, và quy ước **đã có sẵn** ⇒ thêm vào là THEO QUY ƯỚC.
//   ⇒ Ba lỗi PowerShell khiến tôi kết luận sai (đều ghi ở CURRENT_TASK.md):
//      ① `-Include` thiếu đường dẫn ⇒ trả về RỖNG ⇒ tưởng `PermissionGuard` không tồn tại
//         (thực tế CÓ: `app/components/ui/PermissionGuard.tsx`).
//      ② `$f:` trong chuỗi ⇒ PowerShell tưởng là tham chiếu ổ đĩa.
//      ③ `for { } | Select` ⇒ lỗi "empty pipe element".
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const REQ = readFileSync("app/screens/Requests.tsx", "utf8");
const PAGE = readFileSync("app/page.tsx", "utf8");

test("#9 — `Requests` NHẬN prop `permission` (mẫu rộng: `permission?: Row`) ⛔ không phải `permission\\??:\\s*\\(`", () => {
  assert.match(REQ, /permission\?\s*:\s*Row/, "phải khai prop `permission?: Row` trong KIỂU tham số");
  assert.match(REQ, /\{[^}]*\bpermission\b[^}]*\}\s*:\s*\{/, "và phải có `permission` trong DANH SÁCH rút gọn (⛔ chỉ khai kiểu thì biến chưa được gán)");
});

test("#9 — capability ĐỌC THẲNG từ `permission` ⛔ KHÔNG tự đoán quyền", () => {
  assert.match(REQ, /permission\?\.canCreate/, "phải đọc thẳng `permission?.canCreate`");
  assert.match(REQ, /permission\?\.canExport/, "phải đọc thẳng `permission?.canExport`");
  // ⛔ đối chứng âm: tự chế quyền từ vai trò/role ⇒ KHÔNG được phép.
  assert.doesNotMatch(REQ, /canCreate\s*=\s*[^?]*\b(isAdmin|role)\b/i,
    "⛔ KHÔNG được tự suy quyền từ role — phải đọc capability đã cấu hình");
});

test("#9 — dùng CƠ CHẾ DÙNG CHUNG `PermissionGuard` (§14) + khoá nút khi thiếu quyền", () => {
  assert.match(REQ, /PermissionGuard/, "phải dùng `PermissionGuard` đã có sẵn (⛔ không tự viết cơ chế mới)");
  assert.match(REQ, /<PermissionGuard allow=\{canCreate\}>/, "nút GHI phải bọc trong `allow={canCreate}`");
  assert.match(REQ, /disabled=\{!canCreate\}/, "nút GHI phải TẮT khi không có quyền (⛔ không chỉ ẩn)");
  assert.match(REQ, /Bạn không có quyền/, "phải có `title` giải thích vì sao bị khoá (trợ năng)");
});

test("#9 — 3 nút trong thanh công cụ đều được bảo vệ (Tạo · Nhập Excel · Xuất Excel)", () => {
  const guarded = (REQ.match(/<PermissionGuard allow=\{can(Create|Export)\}>/g) || []).length;
  assert.equal(guarded, 3, `phải có 3 nút được bảo vệ, đếm được ${guarded}`);
});

test("#9 — `page.tsx` truyền `activePermission` (⛔ không tạo biến `permission` mới)", () => {
  assert.match(PAGE, /<Requests[\s\S]{0,600}?permission=\{activePermission\}/,
    "phải truyền `permission={activePermission}` — đúng biến sẵn có ở `page.tsx:556`");
});

test("#9 — ⛔ UI KHÔNG thay thế backend (giữ cổng RBAC thật)", () => {
  // Ghi chú: backend chặn ở `ActionRbacRegistry:89/343` + `RbacService` ⇒ thay đổi này CHỈ là lớp UI.
  assert.match(REQ, /KHÔNG thay thế backend/,
    "phải ghi rõ trong mã rằng UI không thay thế backend (để người sau không tưởng đã an toàn xong)");
});
