// TASK-235 — TEST cấu trúc modal «Tạo/Sửa kho» theo QUY TẮC USER CHỐT (`DEC-20261008-013`).
// ⚠️ Đây là test CẤU TRÚC (đọc mã) — vì modal chưa được nối vào `page.tsx` (thuộc S01).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const MODAL = "app/screens/WarehouseFormModal.tsx";

// ⚠️⚠️ BÀI HỌC (§33, TEST-20261008-047): dò CHỮ trên TOÀN tệp là QUÁ THÔ — chú thích giải thích
//   quy tắc («Thủ kho … cấu hình sau», «Quy tắc ③: KHÔNG xoá kho») sẽ KHỚP SAI và làm test ĐỎ oan.
//   ⇒ Phải BỎ CHÚ THÍCH trước khi kiểm «⛔ không có X».
const stripComments = (src) =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, "")   // khối /* ... */
    .replace(/^\s*\/\/.*$/gm, "")        // dòng // ...
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ""); // JSX {/* ... */}
const CODE = () => stripComments(read(MODAL));

test("TASK-235 — §17 REUSE: dùng `BaseModal` CHUNG, ⛔ không tự dựng vỏ modal mới", () => {
  const src = CODE();
  assert.match(src, /import \{ BaseModal \} from "@\/lib\/ui-blocks"/, "phải import BaseModal dùng chung");
  // ⛔ không được tự vẽ overlay/modal shell riêng
  assert.doesNotMatch(src, /className="overlay/, "⛔ không tự dựng lớp overlay riêng");
});

test("TASK-235 — quy tắc ① TẠO MỚI: tự sinh mã `KD-xxx` + chỉ 3 thông tin cơ bản", () => {
  const src = CODE();
  assert.match(src, /nextWarehouseCode\(/, "tạo mới phải TỰ SINH mã kho theo quy tắc KD-xxx");
  assert.match(src, /data-warehouse-field="projectId"/, "có chọn Dự án");
  assert.match(src, /data-warehouse-field="code"/, "có Mã kho");
  assert.match(src, /data-warehouse-field="name"/, "có Tên kho");
  // ⛔ user chốt: «chưa cần phải thêm thủ kho hay các thông tin khác»
  // ⚠️ KIỂM Ô NHẬP, ⛔ KHÔNG kiểm chữ «thủ kho» — chữ đó XUẤT HIỆN HỢP LỆ trong `note`
  //    («Thủ kho và các thông tin khác cấu hình sau») và trong chú thích ⇒ dò chữ sẽ ĐỎ OAN.
  assert.doesNotMatch(src, /data-warehouse-field="keeper/, "⛔ KHÔNG có ô nhập thủ kho khi tạo kho");
  assert.doesNotMatch(src, /name="keeper/, "⛔ KHÔNG có input thủ kho");
});

test("TASK-235 — quy tắc ② SỬA: cho sửa MÃ KHO + kiểm trùng khi sửa", () => {
  const src = CODE();
  assert.match(src, /canEditCode/, "phải có cờ cho phép/không cho sửa mã kho (mặc định cho phép)");
  assert.match(src, /editing \? row\?\.code : undefined/, "⭐ khi SỬA phải truyền `currentCode` ⇒ bỏ qua chính nó, ⛔ không báo trùng sai");
  assert.match(src, /canEdit/, "quy tắc ② yêu cầu PHÂN QUYỀN sửa kho");
  assert.match(src, /Bạn không có quyền sửa kho/, "phải có thông báo khi thiếu quyền");
});

test("TASK-235 — ⭐ TÊN KHO: kho DỰ ÁN theo mẫu `KHO <tên dự án>`, kho Tổng thì ⛔ không áp mẫu", () => {
  const src = CODE();
  assert.match(src, /projectWarehouseName\(/, "phải dùng hàm đặt tên theo quy tắc");
  assert.match(src, /validateProjectWarehouseName\(/, "phải kiểm tên theo quy tắc");
  assert.match(src, /isProjectWarehouse/, "phải PHÂN BIỆT kho dự án vs kho Tổng");
});

test("TASK-235 — ⛔⛔ quy tắc ③: KHÔNG có chức năng XOÁ KHO trong modal", () => {
  const src = CODE();
  // user chốt: «Xóa kho: không cho phép nhưng cho phép ẩn kho hoặc set trạng thái ngừng hoạt động»
  assert.doesNotMatch(src, /delete_warehouse/, "⛔ TUYỆT ĐỐI không gọi action xoá kho");
  assert.doesNotMatch(src, /Xoá kho|Xóa kho/i, "⛔ không có nút/label xoá kho");
});

test("TASK-235 — ⛔ modal KHÔNG tự gọi API/CSDL; chỉ đẩy qua `submit` (backend thuộc S01)", () => {
  const src = CODE();
  assert.match(src, /submit\("save_warehouse"/, "phải đi qua `submit` của nơi gọi");
  assert.doesNotMatch(src, /fetch\(|axios|requestApi\(/, "⛔ không tự gọi API");
  // ⚠️ Dùng NGUỒN GỐC (còn chú thích) — vì `HANDOFF-…` được ghi trong CHÚ THÍCH (truy vết §22).
  assert.match(read(MODAL), /HANDOFF-20261008-009/, "phải ghi rõ phụ thuộc backend ⇒ truy vết §22");
});
