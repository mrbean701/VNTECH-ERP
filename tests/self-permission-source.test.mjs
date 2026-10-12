// HỢP ĐỒNG: cổng UI kiểm quyền CỦA CHÍNH NGƯỜI DÙNG ⛔ KHÔNG được đọc `allModulePermissions`.
//
// ⭐ VÌ SAO CẦN — ⭐ CẢ MỘT HỌ BUG trong phiên 08/10/2026:
//   `BootstrapDataAdapter.java:943` đổ `allModulePermissions` **CHỈ khi `admin === true`**
//   (`data.put("allModulePermissions", admin ? query(…) : …)`)
//   ⇒ với MỌI **non-admin**, mảng đó **RỖNG** ⇒ mọi cổng dạng `(data.allModulePermissions||[]).some(…quyền của CHÍNH họ…)`
//   ⭐ **LUÔN false** ⇒ quyền **uỷ nhiệm** ⛔ vô hiệu trên giao diện ✓
//   📏 Đã trả giá: `BUG-006` · `BUG-008` · và `BUG-009` (4 cổng trong `page.tsx`).
//
// ⚠️ PHÂN BIỆT (⭐ test này khoá đúng sự phân biệt đó):
//   · ĐỌC QUYỀN **NGƯỜI KHÁC** (`permsOf(userId)` · bảng tài khoản · KPI · `manual_override`) ⇒ ⭐ dùng
//     `allModulePermissions` **LÀ ĐÚNG** — ⛔ test này KHÔNG được cấm (nếu cấm bừa sẽ phá màn quản trị).
//   · ĐỌC QUYỀN **CỦA CHÍNH MÌNH** (`=== uid` / `=== data.user?.id` / `hasAdminTab`) ⇒ ⭐ **PHẢI** đọc
//     `data.modulePermissions` (nguồn luôn có) ✓
//
// Chạy: node --test tests/self-permission-source.test.mjs

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const page = read("app/page.tsx");
const modalTabs = read("app/screens/AdminUserModalTabs.tsx");
const bootstrap = read("java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/BootstrapDataAdapter.java");

/** Các dòng có `.some(` + so khớp **chính người dùng** (`=== uid` hoặc `=== data.user?.id`). */
const dongTuKiem = () =>
  page.split("\n").map((line, i) => ({ line, so: i + 1 }))
    .filter(({ line }) => /\.some\(/.test(line)
      && (/String\(p\.userId\)\s*===\s*uid/.test(line) || /String\(p\.userId\)\s*===\s*String\(data\.user\?\.id\)/.test(line)));

test("⭐ MỌI cổng tự-kiểm quyền trong `page.tsx` phải đọc `data.modulePermissions` (⛔ KHÔNG `allModulePermissions`)", () => {
  const ds = dongTuKiem();
  assert.ok(ds.length >= 4, `phải thấy ≥ 4 cổng tự-kiểm (thấy ${ds.length}) — nếu ít hơn thì phép dò đã hỏng`);
  const sai = ds.filter(({ line }) => line.includes("allModulePermissions"));
  assert.deepEqual(sai.map((d) => d.so), [],
    `⛔ dòng ${sai.map((d) => d.so).join(", ")} đọc quyền của CHÍNH người dùng qua \`allModulePermissions\` ⇒ với non-admin LUÔN false ⇒ quyền uỷ nhiệm vô hiệu (BUG-009)`);
});

test("⭐ 4 cổng đã từng chết nay phải đọc `data.modulePermissions` (chống tái phát)", () => {
  for (const ten of ["canViewAudit", "canAdministerStaff", "canManageRole", "canManageUserPermissions"]) {
    const line = page.split("\n").find((l) => l.includes(`const ${ten}`) || l.includes(`${ten}=`) || l.includes(`${ten} =`));
    assert.ok(line, `không tìm thấy cổng ${ten}`);
    assert.match(line, /data\.modulePermissions/, `cổng ${ten} phải đọc \`data.modulePermissions\``);
    assert.doesNotMatch(line, /allModulePermissions/, `cổng ${ten} ⛔ không được quay lại \`allModulePermissions\``);
  }
});

test("⛔ ĐỐI CHỨNG ÂM: các chỗ đọc quyền NGƯỜI KHÁC phải GIỮ `allModulePermissions` (⛔ không cấm bừa)", () => {
  // Nếu test này đỏ ⇒ ai đó đã «sửa» quá tay và ⚠️ sẽ PHÁ màn quản trị (bảng tài khoản/KPI/nút ngoại lệ).
  const phaiGiu = ["userPermissionSpec", "manual_override", "accountRows", "permsOf"];
  const hit = phaiGiu.filter((k) => page.includes(k));
  assert.ok(hit.length >= 4, `phải còn ≥ 4 chỗ dùng quyền người khác (thấy ${hit.length})`);
  assert.match(page, /data\.allModulePermissions/, "⛔ phải CÒN chỗ dùng `allModulePermissions` cho quyền người khác");
});

test("⭐ `hasAdminTab` phải nhận CẢ 2 nguồn (bản vá BUG-008) — ⛔ không được quay lại chỉ 1 nguồn", () => {
  assert.match(modalTabs, /data\.modulePermissions/, "hasAdminTab phải đọc `data.modulePermissions`");
  assert.match(modalTabs, /data\.allModulePermissions/, "hasAdminTab vẫn phải xét `allModulePermissions` (đường của admin)");
});

test("📌 GHI NHỚ NGUỒN GỐC: bootstrap ⛔ CHỈ đổ `allModulePermissions` khi admin — nếu đổi thì test này ĐỎ để buộc rà lại", () => {
  assert.match(bootstrap, /data\.put\("allModulePermissions",\s*admin\s*\?/,
    "nếu bootstrap nay gửi `allModulePermissions` cho MỌI người ⇒ hãy rà lại toàn bộ kết luận của BUG-006/008/009");
});
