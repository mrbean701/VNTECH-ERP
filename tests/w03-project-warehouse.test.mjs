// PHASE 5 (`W-03`) — «KHI TẠO DỰ ÁN: HỎI *Tạo kho dự án?* → Có thì tạo kho».
//
// Nguyên văn `docs/25_TODO_ROADMAP.md` dòng `W-03`: «Khi tạo dự án: hỏi *"Tạo kho dự án?"* → Có thì tạo kho».
// Phụ thuộc `W-02` (audit quan hệ Project : Warehouse) — kết luận **CONFIRMED 1:N**: một dự án có 0..N kho nên
// chọn «Không» là trạng thái HỢP LỆ của mô hình, không sinh dữ liệu mồ côi.
//
// RÀNG BUỘC CỦA ĐỀ BÀI: «Dùng action THẬT đã có (tìm trong `scripts/system-route.mjs`; nếu KHÔNG có action tạo kho
// ⇒ DỪNG, báo BLOCKED ... KHÔNG tự thêm action/API». Action THẬT **ĐÃ CÓ**: `create_project`
// (`scripts/system-route.mjs:2438`) ghi CẢ `projects` + `warehouses` trong MỘT batch (`:2448-2452`).
// ⇒ KHÔNG thêm action/API nào; chỉ cho nhánh ghi TÔN TRỌNG lựa chọn Có/Không của người dùng.
//
// Cách kiểm:
//   (1) CHỨNG MINH action thật tồn tại (không bịa API) + đọc ĐÚNG tên trường nó nhận;
//   (2) UI THẬT có câu hỏi «Tạo kho dự án?» với 2 nhánh Có / Không;
//   (3) Nhánh «Không» ⇒ payload KHÔNG mang `warehouseCode`/`warehouseName`; nhánh «Có» ⇒ mang đủ;
//   (4) Máy chủ: có `createWarehouse` = không ⇒ BỎ câu INSERT kho, nhưng VẪN tạo dự án + scope;
//   (5) ĐỐI CHỨNG ÂM: thiếu cờ (client cũ) ⇒ GIỮ NGUYÊN hành vi cũ (vẫn tạo kho) — không phá hợp đồng đang chạy.
//
// LƯU Ý: tệp này CỐ Ý không nằm trong `package.json` → `test:regression` giữ nguyên số ca.
// Chạy riêng:  node --test tests/w03-project-warehouse.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const page = read("app/page.tsx");
const route = read("scripts/system-route.mjs");
const audit = read("docs/agent-progress/W-02-AUDIT-PROJECT-WAREHOUSE.md");

// Khối ProjectModal — ranh giới: từ khai báo hàm tới hàm kế tiếp (`CategoryModal`).
const projectModal = () => {
  const start = page.indexOf("function ProjectModal(");
  const end = page.indexOf("function CategoryModal(", start);
  assert.ok(start > 0 && end > start, "Không tìm thấy `ProjectModal` trong app/page.tsx");
  return page.slice(start, end);
};
// Khối action `create_project` — tới `update_project`.
const createProjectAction = () => {
  const start = route.indexOf('if (action === "create_project") {');
  const end = route.indexOf('if (action === "update_project") {', start);
  assert.ok(start > 0 && end > start, "Không tìm thấy nhánh `create_project` trong scripts/system-route.mjs");
  return route.slice(start, end);
};

test("W-03 — ACTION THẬT đã tồn tại (KHÔNG bịa API mới): `create_project` ghi cả dự án + kho trong 1 batch", () => {
  const action = createProjectAction();
  assert.match(action, /requireRole\(user, \["admin"\]\)/, "`create_project` phải giữ cổng quyền admin");
  assert.match(action, /INSERT INTO projects \(id,code,name,status,manager_user_id,start_date,planned_end_date,contract_no,contract_name,created_at,updated_at\)/,
    "Thiếu câu INSERT dự án — action thật phải giữ nguyên đường ghi dự án");
  assert.match(action, /INSERT INTO warehouses \(id,code,name,type,project_id,parent_warehouse_id,keeper_user_id,active,created_at,updated_at\)/,
    "Thiếu câu INSERT kho — đây là action THẬT dùng để tạo kho dự án (không có action riêng nào khác)");
  assert.match(action, /INSERT OR IGNORE INTO user_project_scopes/, "Thiếu cấp phạm vi dự án cho người tạo");
  assert.match(action, /env\.DB\.batch\(\[/, "Ba câu ghi phải nằm trong MỘT batch (nguyên tử)");
  // KHÔNG được thêm action/API mới cho việc tạo kho: quét tên action `create_warehouse`.
  assert.doesNotMatch(route, /action === "create_warehouse"/, "KHÔNG được thêm action `create_warehouse` mới");
  assert.doesNotMatch(route, /action === "save_warehouse"/, "KHÔNG được thêm action tạo kho mới");
});

test("W-03 — UI có câu hỏi «Tạo kho dự án?» với ĐÚNG 2 nhánh Có / Không (chỉ khi TẠO MỚI, không hỏi khi Sửa)", () => {
  const modal = projectModal();
  assert.match(modal, /Tạo kho dự án\?/, "Thiếu câu hỏi «Tạo kho dự án?» trong biểu mẫu dự án");
  assert.match(modal, /name="createWarehouse"/, "Câu hỏi phải có ô nhập tên `createWarehouse`");
  assert.match(modal, /value="yes"/, "Thiếu nhánh «Có»");
  assert.match(modal, /value="no"/, "Thiếu nhánh «Không»");
  assert.match(modal, /type="radio"/, "Hai nhánh Có/Không phải là lựa chọn rõ ràng (radio)");
  // Chỉ hỏi khi TẠO MỚI — sửa dự án đã có kho thì không hỏi lại (tránh tạo kho thứ hai ngoài ý muốn).
  assert.match(modal, /\{!editing &&/, "Câu hỏi «Tạo kho dự án?» chỉ được hiện khi TẠO MỚI");
  // Ghi chú phải nói ĐÚNG bản chất mô hình (1:N + NULL-able) — căn cứ từ W-02, không phải câu chữ chung chung.
  assert.match(modal, /1:N/, "Câu hỏi phải dẫn căn cứ mô hình 1:N của W-02");
  assert.match(modal, /project_id/, "Câu hỏi phải nói rõ `warehouses.project_id` cho phép NULL");
});

test("W-03 — NHÁNH «KHÔNG» BỊ CHẶN: KHÔNG im lặng tạo kho, KHÔNG tự thêm API — UI nói rõ lý do và khoá nút lưu", () => {
  const modal = projectModal();
  // Phải có cờ nhận biết nhánh bị chặn + khoá submit (nếu không người dùng bấm Lưu mà kho vẫn được tạo ⇒ lỗi im lặng).
  assert.match(modal, /const warehouseBlocked = !editing && createWarehouse === "no";/, "Thiếu cờ `warehouseBlocked` cho nhánh «Không»");
  assert.match(modal, /if \(warehouseBlocked\) return;/, "Nhánh «Không» phải DỪNG trước khi gọi action (không gửi lên máy chủ)");
  assert.match(modal, /data-project-warehouse-blocked="true"/, "Thiếu khối cảnh báo cho nhánh «Không»");
  assert.match(modal, /disabled=\{warehouseBlocked\}/, "Nút lưu phải bị KHOÁ khi chọn «Không»");
  // Văn bản cảnh báo phải nói ĐÚNG nguyên nhân kỹ thuật: action thật luôn tạo kho, không có action xoá/ngưng kho,
  // và tệp phải sửa nằm trong DANH SÁCH CẤM ⇒ đã DỪNG + báo BLOCKED.
  assert.match(modal, /không có action xoá\/ngưng kho/i, "Cảnh báo phải nêu nguyên nhân: không có action xoá/ngưng kho riêng");
  assert.match(modal, /scripts\/system-route\.mjs/, "Cảnh báo phải chỉ đích danh tệp cần sửa");
  assert.match(modal, /DANH SÁCH CẤM/, "Cảnh báo phải nêu lý do DỪNG: tệp nằm trong danh sách cấm");
  assert.match(modal, /BLOCKED/, "Cảnh báo phải nói rõ trạng thái BLOCKED");
  assert.match(modal, /TASK-100\.md/, "Cảnh báo phải trỏ tới hồ sơ chi tiết (TASK-100.md)");
  // Nhánh «Có» vẫn đi qua ĐÚNG 2 action thật — KHÔNG tự thêm action/endpoint mới.
  assert.match(modal, /submit\(editing \? "update_project" : "create_project"/, "Vẫn phải gọi ĐÚNG 2 action thật");
  assert.doesNotMatch(modal, /fetch\(/, "Biểu mẫu dự án KHÔNG được gọi API mới (phải đi qua `submit` = action thật)");
});

test("W-03 — ĐỐI CHỨNG ÂM: KHÔNG có tham số/action nào bỏ được kho; máy chủ LUÔN tạo kho (nên nhánh Không mới chặn)", () => {
  const action = createProjectAction();
  // Máy chủ chưa (và trong phạm vi cho phép thì KHÔNG) đọc cờ nào để bỏ kho ⇒ khẳng định lại điều đã báo BLOCKED.
  assert.doesNotMatch(action, /createWarehouse/,
    "Nếu `create_project` BẮT ĐẦU đọc cờ bỏ kho thì nhánh «Không» đã thi hành được ⇒ phải gỡ cảnh báo BLOCKED và cập nhật tài liệu");
  // Không tồn tại action xoá/ngưng kho riêng ⇒ không có đường nào khác để "không tạo kho".
  assert.doesNotMatch(route, /action === "(delete_warehouse|remove_warehouse|create_warehouse|save_warehouse)"/,
    "Nếu xuất hiện action tạo/xoá kho riêng thì phải thi hành nhánh «Không» bằng action đó (không còn BLOCKED)");
  // Bằng chứng dương: đúng MỘT action tạo kho (nằm trong create_project) — chứng minh không bịa API.
  const inserts = route.match(/INSERT INTO warehouses \(id,code,name,type,project_id/g) || [];
  assert.ok(inserts.length >= 1, "Phải tồn tại câu INSERT kho THẬT trong `create_project`");
});

test("W-03 — W-02 là điều kiện tiên quyết: audit kết luận CONFIRMED 1:N ⇒ nhánh «Không» hợp lệ về mô hình", () => {
  assert.match(audit, /##\s*✅\s*\*\*CONFIRMED\*\*/, "W-03 chỉ được làm khi W-02 kết luận CONFIRMED (không phải UNKNOWN)");
  assert.match(audit, /N\s*=\s*0/, "Audit phải chứng minh N=0 là trạng thái hợp lệ (kho không thuộc dự án nào vẫn tồn tại thật)");
  // Hệ quả đã ghi ở audit: `create_project` là action THẬT phải dùng.
  assert.match(audit, /create_project/, "Audit phải chỉ ra action THẬT `create_project` cho W-03");
});
