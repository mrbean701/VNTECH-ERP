// MT2-P12-04 (§13.3) — HỢP ĐỒNG «Last Login · Created At» cho danh sách tài khoản.
// Nguyên văn `docs/dsh/MASTER_TASK_2.md:262`: «Danh sách tài khoản phải hiển thị **Last Login ·
// Created At** ⇒ **fix root cause** nếu hiện không hiển thị.»
//
// ROOT CAUSE đo được (không suy đoán):
//   · `users.created_at` CÓ trong CSDL nhưng ⛔ chưa từng được chiếu vào payload ⇒ UI hiện «chưa có nguồn».
//   · `users` KHÔNG có cột đăng nhập cuối (grep `db/migration/*.sql` = 0 dòng `last_login`).
//   · ⛔ KHÔNG suy ra từ session: `AuthUseCase.logout` XOÁ dòng session ⇒ lịch sử đăng nhập sẽ mất.
// ⇒ Fix: migration V29 `ADD COLUMN last_login_at` NULLABLE (⛔ không destructive) + ghi khi login thành công
//   + chiếu CẢ HAI cột vào payload `users`.
//
// Chạy: node --import tsx --test tests/p12-04-last-login-created-at.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const pure = read("../app/screens/admin-governance-pure.ts");
const page = read("../app/page.tsx");
const auth = read("../java-backend/application/src/main/java/com/vntech/erp/application/service/AuthUseCase.java");
const adapter = read("../java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/BootstrapDataAdapter.java");
const repo = read("../java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/UserRepositoryAdapter.java");
const port = read("../java-backend/application/src/main/java/com/vntech/erp/application/port/out/UserRepository.java");
const v29 = read("../java-backend/infrastructure/src/main/resources/db/migration/V29__mt2_user_last_login.sql");

test("P12-04 — migration V29: ADD COLUMN NULLABLE, ⛔ KHÔNG destructive", () => {
  assert.match(v29, /ALTER TABLE `users` ADD COLUMN `last_login_at` TIMESTAMP NULL/,
    "phải thêm cột `last_login_at` NULLABLE (dòng cũ = NULL = chưa đăng nhập lần nào)");
  assert.ok(!/DROP\s+(TABLE|COLUMN)/i.test(v29), "⛔ §19: migration không được DROP gì");
  assert.ok(!/UPDATE\s+`?users`?/i.test(v29), "⛔ không ghi dữ liệu bịa (ví dụ set last_login_at = NOW() cho tất cả)");
});

test("P12-04 — 2 schema H2 phải khớp V29 (⛔ không lệch schema khiến test hỏng)", () => {
  for (const [name, p] of [["test", "../java-backend/web/src/test/resources/schema-h2.sql"], ["demo", "../java-backend/web/src/main/resources/db/demo/schema-h2.sql"]]) {
    assert.match(read(p), /`last_login_at`\s+TIMESTAMP\(3\)\s+NULL/, `schema-h2 (${name}) thiếu cột last_login_at`);
  }
});

test("P12-04 — ghi mốc khi login THÀNH CÔNG, ⛔ không ghi khi sai mật khẩu", () => {
  const login = auth.slice(auth.indexOf("public LoginResult login("), auth.indexOf("public void logout("));
  assert.match(login, /userRepository\.touchLastLogin\(user\.id\(\),\s*loginAt\)/,
    "phải ghi mốc đăng nhập trong luồng login");
  const guard = login.indexOf("if (found.isEmpty()");
  const write = login.indexOf("touchLastLogin");
  assert.ok(guard >= 0 && write > guard,
    "⛔ lệnh ghi phải nằm SAU chỗ kiểm tra thông tin đăng nhập (đăng nhập sai không được ghi mốc)");
  assert.match(login, /createSession\(user\.id\(\),\s*loginAt/, "dùng CHUNG 1 mốc thời gian cho phiên và last-login");
});

test("P12-04 — port + adapter implement đúng 1 UPDATE 1 cột", () => {
  assert.match(port, /void touchLastLogin\(String userId, java\.time\.Instant at\)/, "port phải khai báo touchLastLogin");
  assert.match(repo, /UPDATE users SET last_login_at=\? WHERE id=\?/,
    "adapter phải UPDATE đúng 1 cột, ⛔ không chạm password_hash/active");
  assert.ok(!/password_hash|active\s*=/.test(repo.slice(repo.indexOf("touchLastLogin"), repo.indexOf("touchLastLogin") + 400)),
    "⛔ touchLastLogin không được đụng cột nhạy cảm");
});

test("P12-04 — payload `users` phải chiếu CẢ HAI trường", () => {
  const block = adapter.slice(adapter.indexOf('data.put("users"'), adapter.indexOf('data.put("adminProjects"'));
  assert.match(block, /u\.last_login_at AS lastLoginAt/, "phải trả `lastLoginAt`");
  assert.match(block, /u\.created_at AS createdAt/, "phải trả `createdAt` (ROOT CAUSE: cột có sẵn nhưng chưa chiếu)");
});

test("P12-04 — FE: 2 cột có nguồn THẬT + vẫn hiện khi rỗng (⛔ không bịa ngày)", () => {
  const columns = pure.slice(pure.indexOf("export const ACCOUNT_COLUMNS"), pure.indexOf("];", pure.indexOf("export const ACCOUNT_COLUMNS")));
  assert.match(columns, /key: "lastLoginAt", label: "Đăng nhập cuối", source: "users\.last_login_at/, "cột Đăng nhập cuối phải khai nguồn thật");
  assert.match(columns, /key: "createdAt", label: "Ngày tạo", source: "users\.created_at"/, "cột Ngày tạo phải khai nguồn thật");
  assert.ok(!/source: null/.test(columns), "⛔ không còn cột nào `source: null` trong bảng tài khoản");
  // ⛔ KHÔNG bịa: ô vẫn hiện lý do khi giá trị rỗng (user chưa đăng nhập lần nào).
  assert.match(page, /u\.lastLoginAt \? date\(u\.lastLoginAt\) : <span className="muted"/,
    "ô Đăng nhập cuối phải có nhánh rỗng hiện lý do (⛔ không hiện ngày giả)");
});
