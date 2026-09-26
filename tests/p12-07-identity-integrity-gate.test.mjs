// MT2-P12-07 (§13.3) — HỢP ĐỒNG cổng kiểm tra toàn vẹn định danh người dùng.
// Yêu cầu: «⛔ **không tạo hai identity khác nhau cho cùng một user**» — biến thành CỔNG **chạy lại được**
// (`tools/IdentityIntegrityCheck.java`) thay vì chỉ đo một lần.
//
// ⛔ Điều kiện bắt buộc của cổng này: **CHỈ ĐỌC** — nếu nó ghi được dữ liệu thì bản thân nó thành nguồn
// rủi ro mới cho identity ⇒ test phải bắt được điều đó.
//
// KẾT QUẢ CHẠY THẬT trên MySQL (22/09/2026, sau migration V29):
//   hồ sơ mồ côi = 0 · 1 user nhiều hồ sơ = 0 · trùng mã NV = 0 · trùng tên đăng nhập = 0
//   3 ràng buộc UNIQUE còn nguyên ⇒ **exit 0**; 3 CẢNH BÁO (chưa có mã 1 / chưa có cấp bậc 2 / chưa có hồ sơ 9) là
//   TRẠNG THÁI DỮ LIỆU đã biết (BLK-02 · BLK-06) ⇒ ⛔ cổng KHÔNG tự sửa và vẫn exit 0.
//
// Chạy: node --import tsx --test tests/p12-07-identity-integrity-gate.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const gate = read("../tools/IdentityIntegrityCheck.java");
const v1 = read("../java-backend/infrastructure/src/main/resources/db/migration/V1__baseline.sql");
const useCase = read("../java-backend/application/src/main/java/com/vntech/erp/application/service/UserManagementUseCase.java");
const hrBlock = v1.slice(v1.indexOf("CREATE TABLE `hr_records`"), v1.indexOf("CREATE INDEX `idx_hr_records_name`"));

test("P12-07 — cổng kiểm tra phải TUYỆT ĐỐI CHỈ ĐỌC (⛔ không được ghi dữ liệu)", () => {
  // Bỏ qua phần chú thích để không vướng từ khoá trong chú thích tiếng Việt.
  const code = gate.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
  assert.ok(!/\bINSERT\b/i.test(code), "⛔ cổng không được INSERT");
  assert.ok(!/\bUPDATE\b/i.test(code), "⛔ cổng không được UPDATE");
  assert.ok(!/\bDELETE\b/i.test(code), "⛔ cổng không được DELETE");
  assert.ok(!/\bALTER\b/i.test(code), "⛔ cổng không được ALTER");
  assert.ok(!/\bDROP\b/i.test(code), "⛔ cổng không được DROP");
  assert.ok(!/\bTRUNCATE\b/i.test(code), "⛔ cổng không được TRUNCATE");
});

test("P12-07 — cổng phải kiểm đủ 4 dạng vi phạm định danh của §13.3", () => {
  assert.match(gate, /LEFT JOIN users u ON u\.id=h\.user_id WHERE u\.id IS NULL/, "phải bắt hồ sơ nhân sự trỏ user KHÔNG tồn tại");
  assert.match(gate, /GROUP BY user_id HAVING COUNT\(\*\)>1/, "phải bắt 1 user có NHIỀU hồ sơ nhân sự");
  assert.match(gate, /GROUP BY employee_code HAVING COUNT\(\*\)>1/, "phải bắt trùng mã nhân viên");
  assert.match(gate, /GROUP BY username HAVING COUNT\(\*\)>1/, "phải bắt trùng tên đăng nhập");
});

test("P12-07 — phân biệt LỖI (exit 1) và CẢNH BÁO (exit 0): ⛔ không tự sửa dữ liệu nghiệp vụ", () => {
  assert.match(gate, /System\.exit\(errors > 0 \? 1 : 0\)/, "vi phạm định danh ⇒ exit 1 (dùng làm cổng chặn)");
  // ⚠️ Không neo theo `CẢNH BÁO` rồi quét xa: từ khoá đó xuất hiện ở phần KHAI BÁO biến (rất sớm trong tệp)
  // nên cửa sổ `[\s\S]{0,200}` không với tới nhãn cảnh báo. ⇒ Kiểm tra trực tiếp TỪNG cảnh báo.
  assert.match(gate, /warn\(c, "Tài khoản CHƯA có mã nhân viên \(BLK-06\)"/, "thiếu mã là CẢNH BÁO (BLK-06) chứ không phải lỗi kỹ thuật");
  assert.match(gate, /warn\(c, "Tài khoản CHƯA có cấp bậc hệ thống \(BLK-02\)"/, "thiếu cấp bậc là CẢNH BÁO (BLK-02)");
  assert.ok(!/setUserSignature|UPDATE users/i.test(gate), "⛔ cổng không được tự sửa dữ liệu (gán mã/hồ sơ là quyết định nghiệp vụ)");
});

test("P12-07 — cổng phải xác nhận ràng buộc UNIQUE còn tồn tại (ai xoá index ⇒ cổng phải thấy)", () => {
  assert.match(gate, /information_schema\.STATISTICS[\s\S]{0,300}users_employee_code_uidx/, "phải kiểm chỉ mục UNIQUE mã nhân viên còn");
  assert.match(gate, /hr_records_uidx_user_id/, "phải kiểm chỉ mục UNIQUE hồ sơ↔user còn");
  assert.match(hrBlock, /UNIQUE KEY `hr_records_uidx_user_id` \(`user_id`\)/, "schema V1 phải còn UNIQUE user_id");
  assert.match(hrBlock, /`user_id` VARCHAR\(64\) NOT NULL/, "hồ sơ nhân sự bắt buộc có user_id");
});

test("P12-07 — tầng ứng dụng phải chặn tạo user KHÔNG có mã (bổ sung cho P12-05)", () => {
  const create = useCase.slice(useCase.indexOf("public String createUser("), useCase.indexOf("public String createUser(") + 3200);
  assert.match(create, /if \(employeeCode\.isEmpty\(\)\)[\s\S]{0,300}400\)/,
    "⛔ lỗ hổng P12-05 phải được giữ đã vá (không được lùi code)");
});
