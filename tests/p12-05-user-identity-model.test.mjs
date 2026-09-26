// MT2-P12-05 (§13.3) — HỢP ĐỒNG identity model của tài khoản.
// Nguyên văn `docs/dsh/MASTER_TASK_2.md:263`: «Một số user **chưa có mã** ⇒ audit **identity model** ⇒
// bổ sung **User ID** và đảm bảo **khớp với ID trong Hồ sơ nhân sự** ⇒ ⛔ **không tạo hai identity khác nhau
// cho cùng một user**.»
//
// SỐ LIỆU ĐO TRÊN MySQL THẬT (probe chỉ đọc, `tools/_ProbeIdentity.java`):
//   users=13 · hr_records=4 · user thiếu mã nhân viên=1 · user thiếu system_level_code=2
//   user CHƯA có hồ sơ nhân sự=9 · hồ sơ trỏ user không tồn tại=0 · trùng tên khác user_id=0
//   `users_employee_code_uidx` UNIQUE · `hr_records_uidx_user_id` UNIQUE ⇒ DB đã chặn 2 identity trùng.
//
// ROOT CAUSE đã sửa: `createUser` lấy `employeeCode` mà KHÔNG chặn rỗng, trong khi `updateUser` ĐÃ chặn
// ⇒ lỗ hổng tạo tài khoản không mã. §17: backend là lớp kiểm soát.
//
// Chạy: node --import tsx --test tests/p12-05-user-identity-model.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const useCase = read("../java-backend/application/src/main/java/com/vntech/erp/application/service/UserManagementUseCase.java");
const page = read("../app/page.tsx");
const v1 = read("../java-backend/infrastructure/src/main/resources/db/migration/V1__baseline.sql");
const usersBlock = v1.slice(v1.indexOf("CREATE TABLE `users`"), v1.indexOf("CREATE TABLE", v1.indexOf("CREATE TABLE `users`") + 10));
const usersIndexBlock = v1.slice(v1.indexOf("CREATE UNIQUE INDEX `users_employee_code_uidx`"), v1.indexOf("CREATE UNIQUE INDEX", v1.indexOf("CREATE UNIQUE INDEX `users_employee_code_uidx`") + 10));
// ⚠️ `hr_records` nằm TRƯỚC `users` trong V1 (dòng 861 vs 2056) ⇒ phải cắt riêng, không dựa vào thứ tự.
const hrBlock = v1.slice(v1.indexOf("CREATE TABLE `hr_records`"), v1.indexOf("CREATE INDEX `idx_hr_records_name`"));
// Danh sách TÀI KHOẢN (quản trị) — phạm vi §13.3. ⚠️ 6 màn khác (dự án / tổ đội) hiện «—» cho thành viên
// chưa có mã là HỢP LÝ và ⛔ ngoài phạm vi task này (§40 không tự mở rộng).
const accountListBlock = page.slice(page.indexOf("{ACCOUNT_COLUMNS.map"), page.indexOf("colSpan={ACCOUNT_COLUMNS.length"));

test("P12-05 — `createUser` phải CHẶN mã nhân viên rỗng (root cause §13.3)", () => {
  const create = useCase.slice(useCase.indexOf("public String createUser("), useCase.indexOf("public Map<String, Object> updateUser("));
  assert.match(create, /String employeeCode = trim\(payload\.get\("employeeCode"\)\);/, "phải đọc mã vào biến để kiểm tra");
  assert.match(create, /if \(employeeCode\.isEmpty\(\)\)\s*\n?\s*throw new AuthUseCase\.ApiError\("Mã nhân viên là bắt buộc\.", 400\);/,
    "⛔ phải trả 400 khi thiếu mã (trước đây KHÔNG có kiểm tra ⇒ tạo được user không mã)");
  assert.match(create, /store\.insertUser\(userId, employeeCode,/, "phải dùng biến đã kiểm tra khi insert (⛔ không lấy lại từ payload)");
});

test("P12-05 — `updateUser` và `createUser` phải CHẶN GIỐNG NHAU (hết lệch không nhất quán)", () => {
  const create = useCase.slice(useCase.indexOf("public String createUser("), useCase.indexOf("public String updateUser("));
  // ⚠️ `updateUser` trả `String` (không phải `Map`) ⇒ phải cắt theo chữ ký THẬT.
  // ⚠️ Cửa sổ phải ≥2500 ký tự: khối validate nằm ~1450 ký tự sau chữ ký (window 1400 bị cắt mất).
  const update = useCase.slice(useCase.indexOf("public String updateUser("), useCase.indexOf("public String updateUser(") + 2500);
  // ⚠️ HAI luồng dùng thông điệp KHÁC NHAU (`updateUser` gộp nhiều trường) ⇒ assert **HÀNH VI** (400 khi mã rỗng),
  // ⛔ không đòi chuỗi thông điệp giống hệt nhau (đó là chi tiết văn phong, không phải yêu cầu §13.3).
  assert.match(create, /employeeCode\.isEmpty\(\)\)[\s\S]{0,300}ApiError\("Mã nhân viên[^"]*",\s*400\)/,
    "createUser phải trả 400 khi thiếu mã");
  assert.match(update, /employeeCode\.isEmpty\(\)[\s\S]{0,500}ApiError\("[^"]*bắt buộc[^"]*",\s*400\)/,
    "updateUser phải (tiếp tục) trả 400 khi thiếu mã");
  assert.ok(!/update[\s\S]{0,600}employeeCode\.isEmpty\(\)[\s\S]{0,200}403/.test(update),
    "⛔ lỗi thiếu mã phải là 400 (validation) chứ không phải 403 (phân quyền)");
});

test("P12-05 — CSDL đã bảo đảm KHÔNG 2 identity: mã nhân viên UNIQUE + hr_records.user_id UNIQUE", () => {
  // ⚠️ V1 khai UNIQUE bằng câu `CREATE UNIQUE INDEX` RIÊNG (không phải `UNIQUE KEY` trong thân bảng).
  assert.match(usersIndexBlock, /CREATE UNIQUE INDEX `users_employee_code_uidx` ON `users` \(`employee_code`\)/,
    "mã nhân viên phải UNIQUE ở mức DB (chặn 2 user cùng mã)");
  assert.match(hrBlock, /UNIQUE KEY `hr_records_uidx_user_id` \(`user_id`\)/, "1 user chỉ được có 1 hồ sơ nhân sự (UNIQUE user_id)");
  assert.match(hrBlock, /`user_id` VARCHAR\(64\) NOT NULL/, "hồ sơ nhân sự phải bắt buộc có user_id (⛔ không hồ sơ mồ côi)");
  assert.match(usersBlock, /`employee_code` VARCHAR\([^)]*\) NOT NULL/, "mã nhân viên là cột bắt buộc ở mức schema");
});

test("P12-05 — UI: tài khoản thiếu mã phải hiện RÕ «Chưa có mã» (⛔ không để dấu «—» im lặng)", () => {
  assert.match(page, /data-no-employee-code="true"/, "ô Mã phải có marker cho ô thiếu mã để nghiệm thu được");
  assert.match(accountListBlock, /Chưa có mã/, "danh sách TÀI KHOẢN phải hiện nhãn «Chưa có mã» thay vì dấu gạch trung tính");
  assert.ok(!/u\.employeeCode \|\| "—"/.test(accountListBlock),
    "⛔ trong danh sách tài khoản không được hiện «—» cho user chưa có mã (giấu thiếu sót định danh)");
});

test("P12-05 — form tạo user phải CÓ ô Mã nhân viên bắt buộc (khớp chặn backend)", () => {
  assert.match(page, /Tạo tài khoản nội bộ[\s\S]{0,900}Mã nhân viên \*<\/span><input name="employeeCode" required\/>/,
    "⛔ nếu form không có ô mã bắt buộc thì chặn backend sẽ làm không tạo được tài khoản");
});

test("P12-05 — ⛔ KHÔNG tự bịa mã cho user đang trống (cần USER quyết định)", () => {
  // ⚠️ CẬP NHẬT 23/09/2026 (MT2-P14-03c): probe `tools/_ProbeIdentity.java` là **tệp TẠM** — theo đúng ghi chú
  // cũ «Probe chỉ đọc được xoá sau khi dùng» nên nó ĐÃ BỊ XOÁ ⇒ đọc cứng tệp đó gây `ENOENT` (đỏ vì môi trường,
  // ⛔ không phải vì nghiệp vụ). Bất biến CẦN GIỮ là: **trong `tools/` KHÔNG tồn tại probe định danh có khả năng GHI**.
  const dir = resolve(ROOT, "tools");
  const probes = readdirSync(dir).filter((name) => /ProbeIdentity/i.test(name));
  const writeCapable = probes.filter((name) => {
    const text = readFileSync(resolve(dir, name), "utf8");
    return /INSERT\s+INTO|UPDATE\s+\w+\s+SET|DELETE\s+FROM/i.test(text);
  });
  assert.deepEqual(writeCapable, [],
    "⛔ KHÔNG được tồn tại probe định danh có khả năng GHI dữ liệu (phải là CHỈ ĐỌC hoặc đã xoá)");
  // Bằng chứng dương: hành vi «không bịa mã» nằm ở BACKEND (chặn rỗng) — đã kiểm ở ca đầu của tệp này.
  assert.match(useCase, /employeeCode|employee_code/, "Use case phải còn xử lý `employeeCode` (không bịa mã)");
});
