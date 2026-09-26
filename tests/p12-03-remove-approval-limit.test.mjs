// MT2-P12-03 (§13.3) — HỢP ĐỒNG bỏ trường «Hạn mức».
// Nguyên văn `docs/dsh/MASTER_TASK_2.md:261`: «⛔ **Bỏ trường "Hạn mức"** — không thay bằng trường khác
// **nếu chưa có nghiệp vụ**.»
//
// Ranh giới đã chốt khi audit: ẩn khỏi **UI + API**, ⛔ **KHÔNG drop cột CSDL** (`V25__…:11` đã ghi rõ
// «KHÔNG drop ở đây») và ⛔ KHÔNG tự thay bằng trường khác (master task cấm khi chưa có nghiệp vụ).
//
// Chạy: node --import tsx --test tests/p12-03-remove-approval-limit.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const pure = readFileSync(new URL("../app/screens/admin-governance-pure.ts", import.meta.url), "utf8");
const adapter = readFileSync(new URL("../java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/BootstrapDataAdapter.java", import.meta.url), "utf8");

test("P12-03 — UI: bảng tài khoản KHÔNG còn cột «Hạn mức»", () => {
  const columns = pure.slice(pure.indexOf("export const ACCOUNT_COLUMNS"), pure.indexOf("];", pure.indexOf("export const ACCOUNT_COLUMNS")));
  assert.ok(!/approvalLimit/.test(columns),
    "⛔ `ACCOUNT_COLUMNS` phải BỎ entry `approvalLimit` — nó sinh cả `<th>` lẫn `colSpan` nên gỡ 1 chỗ là cả cột biến mất");
  assert.ok(!/\{money\(Number\(u\.approvalLimit/.test(page), "⛔ không còn ô hiển thị hạn mức trong bảng tài khoản");
  // ⛔ KHÔNG được tự thay bằng trường khác khi chưa có nghiệp vụ (§13.3).
  assert.ok(!/label:\s*"Hạn mức[^"]*"\s*,\s*source:\s*"(?!users\.approval_limit)/.test(columns),
    "⛔ không được tạo cột thay thế mang nhãn «Hạn mức…» khi chưa có nghiệp vụ");
});

test("P12-03 — UI: modal Sửa tài khoản KHÔNG còn ô nhập «Hạn mức phê duyệt»", () => {
  assert.ok(!/name="approvalLimit"/.test(page), "⛔ không còn input `approvalLimit` trong form tài khoản");
  assert.ok(!/Hạn mức phê duyệt/.test(page), "⛔ không còn nhãn «Hạn mức phê duyệt»");
});

test("P12-03 — API: khối `users` của bootstrap KHÔNG còn trả `approvalLimit`", () => {
  const usersBlock = adapter.slice(adapter.indexOf('data.put("users"'), adapter.indexOf('data.put("adminProjects"'));
  assert.ok(!/approval_limit AS approvalLimit/.test(usersBlock),
    "⛔ payload `users` không được trả `approvalLimit` (§13.3 bỏ trường khỏi API)");
  assert.match(usersBlock, /u\.must_change_password AS mustChangePassword/,
    "các trường còn lại của `users` phải giữ nguyên (⛔ không xoá nhầm cột khác)");
});

test("P12-03 — CSDL: ⛔ KHÔNG được drop cột `users.approval_limit`", () => {
  // Cột vẫn phải còn trong schema (V1) và ⛔ KHÔNG có migration nào DROP nó.
  const baseline = readFileSync(new URL("../java-backend/infrastructure/src/main/resources/db/migration/V1__baseline.sql", import.meta.url), "utf8");
  assert.match(baseline, /`approval_limit`\s+DECIMAL/, "⛔ cột `users.approval_limit` phải CÒN trong schema");
  for (const [name, url] of [
    ["V25", "../java-backend/infrastructure/src/main/resources/db/migration/V25__mt2_approval_overdue_reason_and_user_signature.sql"],
  ]) {
    const sql = readFileSync(new URL(url, import.meta.url), "utf8");
    assert.ok(!/DROP\s+COLUMN\s+`?approval_limit/i.test(sql),
      `⛔ ${name} không được DROP cột approval_limit (master task cấm destructive)`);
  }
  assert.ok(!/ALTER\s+TABLE\s+`?users`?[\s\S]{0,120}DROP\s+COLUMN\s+`?approval_limit/i.test(adapter),
    "⛔ adapter không được chứa lệnh drop cột approval_limit");
});

test("P12-03 — ghi chú giải thích để sau này không ai thêm lại", () => {
  assert.match(pure, /MT2-P12-03[\s\S]{0,400}BỎ cột «Hạn mức»/,
    "phải còn chú thích §13.3 tại ACCOUNT_COLUMNS nói rõ cột CSDL được giữ");
  assert.match(adapter, /MT2-P12-03[\s\S]{0,600}approval_limit`?\s*\*\*GIỮ NGUYÊN/,
    "phải còn chú thích §13.3 tại BootstrapDataAdapter nói rõ cột CSDL được giữ");
});

test("P12-03 — ghi chức cũ: Java vẫn ghi `approval_limit` với 0 ⇒ không lỗi NOT NULL", () => {
  // `numberValue(null)` = 0 (`UserManagementUseCase:622`) ⇒ lưu tài khoản khi form không gửi trường vẫn hợp lệ.
  const useCase = readFileSync(new URL("../java-backend/application/src/main/java/com/vntech/erp/application/service/UserManagementUseCase.java", import.meta.url), "utf8");
  assert.match(useCase, /numberValue\(Object o\)\s*\{[^}]*o == null \? 0/,
    "⛔ `numberValue(null)` phải trả 0 — nếu đổi thành ném lỗi thì lưu tài khoản sẽ 400 khi form bỏ trường");
});
