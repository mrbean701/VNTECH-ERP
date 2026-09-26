// PHASE 5 (`W-03`) — «Khi tạo dự án: hỏi *"Tạo kho dự án?"* → Có thì tạo kho».
//
// HỢP ĐỒNG CHẠY ĐƯỢC cho bản ĐÃ GỠ BLOCKED (người dùng đã cho phép sửa `scripts/system-route.mjs`).
// Tệp `tests/w03-project-warehouse.test.mjs` là hồ sơ LỊCH SỬ của trạng thái BLOCKED (nó tự ghi ở dòng 98-99:
// «Nếu `create_project` BẮT ĐẦU đọc cờ bỏ kho thì ... phải gỡ cảnh báo BLOCKED») — tệp này là hợp đồng MỚI.
//
// Cách kiểm:
//   (1) Máy chủ `create_project` ĐỌC cờ `createWarehouse` + BỌC câu `INSERT INTO warehouses` trong
//       `if (createWarehouse !== false) {` ⇒ mặc định (cờ vắng) VẪN tạo kho (tương thích ngược).
//       Vẫn ghi `projects` + `user_project_scopes` trong MỘT batch nguyên tử ⇒ dự án luôn được tạo.
//   (2) Cờ là BOOLEAN MẶC ĐỊNH `true`: chạy THẬT biểu thức đọc cờ trích từ mã nguồn (không chép lại logic).
//   (3) Giao diện `ProjectModal` (app/page.tsx) BỎ CHẶN nhánh «Không» và TRUYỀN cờ xuống action thật.
//   (4) ĐỐI CHỨNG ÂM: KHÔNG thêm câu `DELETE`/`DROP`/`TRUNCATE`/`ALTER` nào (quét từ khoá).
//   (5) ĐỐI CHỨNG ÂM: KHÔNG thêm khoá `module_catalog` mới.
//
// Chạy:            node --test tests/w03-project-warehouse-flag.test.mjs
// Chạy RED (bản máy chủ TRƯỚC khi sửa — bằng chứng đỏ→xanh):
//   git show <commit-cu>:scripts/system-route.mjs > %TEMP%\route-old.mjs
//   W03_SYSTEM_ROUTE=%TEMP%\route-old.mjs node --test tests/w03-project-warehouse-flag.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const readFile = (relative) => readFileSync(resolve(root, relative), "utf8");
const routePath = process.env.W03_SYSTEM_ROUTE || "scripts/system-route.mjs";
const route = readFile(routePath);
const page = readFile("app/page.tsx");

// Khối action `create_project` — ranh giới: tới action kế tiếp (`update_project`).
const actionBlock = () => {
  const start = route.indexOf('if (action === "create_project") {');
  const end = route.indexOf('if (action === "update_project") {', start);
  assert.ok(start > 0 && end > start, "Không tìm thấy nhánh `create_project` trong " + routePath);
  return route.slice(start, end);
};
// Khối ProjectModal — ranh giới: từ khai báo hàm tới `CategoryModal`.
const modalBlock = () => {
  const start = page.indexOf("function ProjectModal(");
  const end = page.indexOf("function CategoryModal(", start);
  assert.ok(start > 0 && end > start, "Không tìm thấy `ProjectModal` trong app/page.tsx");
  return page.slice(start, end);
};

test("W-03 (1) — `create_project` ĐỌC cờ `createWarehouse` và BỌC câu INSERT kho trong `if (createWarehouse !== false)`", () => {
  const action = actionBlock();
  assert.match(action, /requireRole\(user, \["admin"\]\)/, "`create_project` phải giữ cổng quyền admin");
  assert.match(action, /const rawCreateWarehouse = payload\.createWarehouse;/, "Máy chủ phải ĐỌC cờ từ payload");
  assert.match(action, /if \(createWarehouse !== false\) \{/, "Câu INSERT kho phải nằm trong điều kiện `createWarehouse !== false`");

  const ifAt = action.indexOf("if (createWarehouse !== false) {");
  const warehouseInsertAt = action.indexOf("INSERT INTO warehouses (id,code,name,type,project_id");
  const scopeInsertAt = action.indexOf("INSERT OR IGNORE INTO user_project_scopes");
  const projectInsertAt = action.indexOf("INSERT INTO projects (id,code,name,status,manager_user_id");
  assert.ok(warehouseInsertAt > ifAt, "Câu INSERT kho phải nằm TRONG khối `if` (sau vị trí mở khối)");
  assert.ok(projectInsertAt > 0 && projectInsertAt < ifAt, "Câu INSERT dự án KHÔNG được nằm trong điều kiện ⇒ dự án LUÔN được tạo");
  assert.ok(scopeInsertAt > warehouseInsertAt, "Câu cấp phạm vi dự án vẫn phải được ghi (không phụ thuộc cờ)");
  assert.doesNotMatch(action.slice(0, ifAt), /INSERT INTO warehouses \(id,code,name,type,project_id/,
    "Trước khối `if` KHÔNG được còn câu INSERT kho nào khác (không có đường ghi kho ngoài điều kiện)");
  assert.equal((action.match(/INSERT INTO warehouses \(id,code,name,type,project_id/g) || []).length, 1,
    "Đúng MỘT câu INSERT kho trong `create_project` (không thêm đường ghi kho thứ hai)");
  assert.match(action, /await env\.DB\.batch\(statements\)/, "Ba câu ghi vẫn phải nằm trong MỘT batch nguyên tử");
  assert.doesNotMatch(route, /action === "create_warehouse"/, "KHÔNG được thêm action `create_warehouse` mới");
  assert.doesNotMatch(route, /action === "(save_warehouse|delete_warehouse|remove_warehouse)"/, "KHÔNG được thêm action kho mới");
  // Thông điệp trả về phải nói ĐÚNG việc đã làm (không báo «đã tạo kho» khi người dùng chọn Không).
  assert.match(action, /createWarehouse !== false \?/, "Thông điệp trả về phải rẽ theo cờ (nói đúng có/không tạo kho)");
  assert.match(action, /createWarehouse \}/, "Audit log phải ghi lại lựa chọn cờ để truy vết");
});

test("W-03 (2) — MẶC ĐỊNH = TẠO KHO: cờ vắng/true ⇒ tạo kho; false/'no'/'0' ⇒ KHÔNG tạo kho (chạy THẬT biểu thức đọc cờ)", () => {
  const action = actionBlock();
  const start = action.indexOf("const rawCreateWarehouse");
  const end = action.indexOf("const statements = [", start);
  assert.ok(start > 0 && end > start, "Không trích được biểu thức đọc cờ `createWarehouse`");
  const flagSource = action.slice(start, end).trim();
  assert.ok(flagSource.endsWith(";"), "Biểu thức đọc cờ phải là một câu lệnh hoàn chỉnh");
  // eslint-disable-next-line no-new-func
  const readFlag = new Function("payload", `${flagSource}\nreturn createWarehouse;`);
  const cases = [
    [{}, true, "cờ VẮNG (mọi nơi gọi CŨ) ⇒ MẶC ĐỊNH tạo kho"],
    [{ createWarehouse: undefined }, true, "`undefined` ⇒ mặc định tạo kho"],
    [{ createWarehouse: null }, true, "`null` ⇒ mặc định tạo kho"],
    [{ createWarehouse: "" }, true, "chuỗi rỗng ⇒ mặc định tạo kho"],
    [{ createWarehouse: true }, true, "true ⇒ tạo kho"],
    [{ createWarehouse: "yes" }, true, "«Có» của UI (chuỗi) ⇒ tạo kho"],
    [{ createWarehouse: "YES" }, true, "«Có» viết hoa ⇒ tạo kho"],
    [{ createWarehouse: false }, false, "false ⇒ KHÔNG tạo kho"],
    [{ createWarehouse: "false" }, false, "chuỗi 'false' ⇒ KHÔNG tạo kho"],
    [{ createWarehouse: "no" }, false, "«Không» của UI (chuỗi) ⇒ KHÔNG tạo kho"],
    [{ createWarehouse: " NO " }, false, "«Không» có khoảng trắng/hoa ⇒ KHÔNG tạo kho"],
    [{ createWarehouse: 0 }, false, "0 ⇒ KHÔNG tạo kho"],
    [{ createWarehouse: "0" }, false, "chuỗi '0' ⇒ KHÔNG tạo kho"],
  ];
  for (const [payload, expected, why] of cases) {
    assert.equal(readFlag(payload), expected, `Cờ \`createWarehouse\` sai với ${JSON.stringify(payload)} — ${why}`);
  }
  // Bằng chứng dương: điều kiện bọc là `!== false` ⇒ cờ vắng (true) VẪN chạy câu INSERT kho.
  assert.match(action, /if \(createWarehouse !== false\) \{/, "Điều kiện bọc phải là `!== false` để cờ vắng vẫn tạo kho");
});

test("W-03 (3) — GIAO DIỆN ProjectModal TRUYỀN cờ xuống action thật + đã BỎ CHẶN nhánh «Không»", () => {
  const modal = modalBlock();
  // Câu hỏi Có/Không giữ nguyên (đã có từ đợt trước) + căn cứ mô hình 1:N của W-02.
  assert.match(modal, /Tạo kho dự án\?/, "Thiếu câu hỏi «Tạo kho dự án?»");
  assert.match(modal, /data-project-warehouse-question="create"/, "Thiếu dấu vết (data attribute) của câu hỏi");
  assert.match(modal, /name="createWarehouse"/, "Thiếu ô nhập tên `createWarehouse`");
  assert.match(modal, /type="radio"/, "Hai nhánh phải là radio");
  assert.match(modal, /value="yes"/, "Thiếu nhánh «Có»");
  assert.match(modal, /value="no"/, "Thiếu nhánh «Không»");
  assert.match(modal, /\{!editing &&/, "Câu hỏi chỉ được hiện khi TẠO MỚI");
  assert.match(modal, /1:N/, "Câu hỏi phải dẫn căn cứ mô hình 1:N của W-02");
  assert.match(modal, /project_id/, "Câu hỏi phải nói rõ `warehouses.project_id` cho phép NULL");
  // TRUYỀN CỜ: boolean xuống đúng action thật, đặt SAU spread để thắng chuỗi "yes"/"no" của radio.
  assert.match(modal, /createWarehouse: createWarehouse === "yes"/, "UI phải TRUYỀN cờ `createWarehouse` (boolean) khi tạo dự án");
  assert.match(modal, /submit\(editing \? "update_project" : "create_project"/, "Vẫn phải gọi ĐÚNG 2 action thật");
  assert.doesNotMatch(modal, /fetch\(/, "Biểu mẫu KHÔNG được gọi API mới (phải đi qua `submit` = action thật)");
  // BỎ CHẶN: không còn khối cảnh báo/khoá nút lưu của trạng thái BLOCKED.
  assert.doesNotMatch(modal, /warehouseBlocked/, "Đã bỏ chặn nên KHÔNG được còn cờ `warehouseBlocked`");
  assert.doesNotMatch(modal, /data-project-warehouse-blocked/, "Đã bỏ chặn nên KHÔNG được còn khối cảnh báo BLOCKED");
  assert.doesNotMatch(modal, /disabled=\{warehouseBlocked\}/, "Nút lưu KHÔNG được khoá vì lý do BLOCKED nữa");
  // Nhánh «Không» phải THI HÀNH ĐƯỢC: 2 ô kho không bắt buộc + bị vô hiệu hoá (không gửi lên máy chủ).
  assert.match(modal, /const skipWarehouse = !editing && createWarehouse === "no";/, "Thiếu cờ `skipWarehouse` cho nhánh «Không»");
  assert.match(modal, /data-project-warehouse-skipped="true"/, "Nhánh «Không» phải nói RÕ hệ quả (không tạo kho)");
  assert.equal((modal.match(/required=\{!skipWarehouse\}/g) || []).length, 2, "2 ô Mã/Tên kho phải bỏ `required` khi chọn «Không»");
  assert.equal((modal.match(/disabled=\{skipWarehouse\}/g) || []).length, 2, "2 ô Mã/Tên kho phải bị vô hiệu hoá khi chọn «Không»");
});

test("W-03 (4) — ĐỐI CHỨNG ÂM: KHÔNG thêm câu DELETE/DROP/TRUNCATE/ALTER nào (quét từ khoá)", () => {
  const action = actionBlock();
  const dangerous = action.match(/\b(DELETE|DROP|TRUNCATE|ALTER)\b/gi) || [];
  assert.deepEqual(dangerous, [], "Nhánh `create_project` KHÔNG được chứa DELETE/DROP/TRUNCATE/ALTER");
  const modal = modalBlock();
  assert.doesNotMatch(modal, /\b(DELETE|DROP|TRUNCATE|ALTER)\b/i, "Biểu mẫu dự án KHÔNG được chứa DDL/DML phá huỷ");
  assert.doesNotMatch(modal, /method="delete"/i, "Biểu mẫu KHÔNG được dùng HTTP DELETE");
  // Chỉ 3 câu ghi THẬT + đúng 1 câu INSERT kho (không thêm đường ghi/xoá nào khác).
  assert.equal((action.match(/env\.DB\.prepare\(`(INSERT|UPDATE|DELETE)/g) || []).length, 3,
    "Phải giữ ĐÚNG 3 câu ghi (dự án + kho có điều kiện + phạm vi dự án)");
});

test("W-03 (5) — ĐỐI CHỨNG ÂM: KHÔNG thêm khoá `module_catalog` mới", () => {
  const action = actionBlock();
  assert.doesNotMatch(action, /module_catalog/, "`create_project` KHÔNG được thêm khoá `module_catalog` mới");
  const keysMatch = route.match(/const MODULE_KEYS = \[([\s\S]*?)\];/);
  assert.ok(keysMatch, "Không tìm thấy `MODULE_KEYS` trong " + routePath);
  const keys = keysMatch[1].split(",").map((key) => key.trim().replace(/^"|"$/g, "")).filter(Boolean);
  assert.equal(keys.length, 61, "Số khoá module phải GIỮ NGUYÊN 61 (baseline đo tại commit 7e93543) — không thêm khoá mới");
  assert.equal(keys.filter((key) => /warehouse/.test(key)).length, 3,
    "Số khoá liên quan kho phải giữ nguyên 3 (`warehouse_receipt`, `warehouse_issue`, `central_warehouse`)");
  assert.equal(keys.filter((key) => /create_warehouse|project_warehouse|warehouse_flag/.test(key)).length, 0,
    "KHÔNG được thêm khoá module cho cờ tạo kho");
});
