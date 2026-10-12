// HỢP ĐỒNG TÍCH HỢP MODAL KHO ⇄ API KHO — KHOÁ REGRESSION.
//
// ⭐ VÌ SAO CẦN: hôm 08/10/2026 đã xảy ra ĐÚNG lỗi này —
//   `app/screens/WarehouseFormModal.tsx` (phiên 02) gửi khoá **`warehouseId`**
//   nhưng backend (phiên 01) viết `payload.get("id")` ⇒ **«SỬA KHO» bị coi là TẠO MỚI ⇒ trùng mã ⇒ 400**.
//   ⚠️ Lỗi ⛔ KHÔNG bị bất kỳ cổng nào bắt: `tsc` không thấy (2 bên khác ngôn ngữ), test Java không thấy
//   (test gửi `id`), test FE không thấy (không có ca nào). ⭐ Chỉ lộ khi ĐỌC MÃ NƠI GỌI.
//   ⇒ Test này khoá chặt HỢP ĐỒNG giữa 3 chỗ: modal gửi gì · registry khai gì · use-case đọc gì ✓
//
// Chạy: node --import tsx --test tests/warehouse-modal-contract.test.mjs

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const modal = read("app/screens/WarehouseFormModal.tsx");
const page = read("app/page.tsx");
const useCase = read("java-backend/application/src/main/java/com/vntech/erp/application/service/AdminSystemUseCase.java");
const registry = read("java-backend/application/src/main/java/com/vntech/erp/application/rbac/ActionRbacRegistry.java");
const controller = read("java-backend/web/src/main/java/com/vntech/erp/web/controller/SystemController.java");

test("KHO — modal gửi ĐÚNG action `save_warehouse` và khoá định danh `warehouseId`", () => {
  assert.match(modal, /submit\("save_warehouse",/, "modal phải gọi action save_warehouse");
  // ⭐ KHOÁ ĐỊNH DANH — đây là chỗ đã từng lệch. Quy ước NHÀ là `warehouseId` (khớp `save_warehouse_location`).
  assert.match(modal, /warehouseId:/, "modal phải gửi `warehouseId` (⛔ không phải `id`)");
  assert.match(modal, /\bcode:/, "modal phải gửi `code`");
  assert.match(modal, /\bname:/, "modal phải gửi `name`");
});

test("KHO — use-case ĐỌC ĐÚNG khoá `warehouseId` (⛔ nếu chỉ đọc `id` ⇒ SỬA thành TẠO MỚI ⇒ 400 trùng mã)", () => {
  const fn = useCase.slice(useCase.indexOf("public String saveWarehouse("), useCase.indexOf("public String setWarehouseStatus("));
  assert.ok(fn.length > 0, "phải tìm thấy saveWarehouse");
  // ⭐ ĐIỀU KIỆN SỐNG CÒN: phải đọc `warehouseId` TRƯỚC (có/không có nhánh dự phòng `id` đều được).
  assert.match(fn, /trim\(payload\.get\("warehouseId"\)\)/, "saveWarehouse phải đọc `warehouseId`");
  // ⛔ Chống tái phát: KHÔNG được quay lại kiểu đọc `id` trần làm nguồn DUY NHẤT.
  assert.doesNotMatch(fn, /^\s*String id = trim\(payload\.get\("id"\)\);\s*$/m,
    "⛔ KHÔNG được chỉ đọc `id` — đó chính là lỗi 08/10/2026");
});

test("KHO — 2 action khai ĐỦ ở CẢ HAI bảng RBAC (modules + capabilities)", () => {
  for (const action of ["save_warehouse", "set_warehouse_status"]) {
    // Bảng modules: `Map.entry("<action>", List.of(...))`
    assert.match(registry, new RegExp(`Map\\.entry\\("${action}", List\\.of\\(`), `${action} thiếu ở bảng MODULES`);
    // Bảng capabilities: `Map.entry("<action>", "can<X>")`
    assert.match(registry, new RegExp(`Map\\.entry\\("${action}", "can`), `${action} thiếu ở bảng CAPABILITIES`);
  }
  assert.match(registry, /Map\.entry\("save_warehouse", List\.of\("inventory", "central_warehouse"\)\)/,
    "save_warehouse phải cùng nhóm module với action anh em save_warehouse_location");
});

test("KHO — controller có case cho CẢ 2 action, dùng `requireCurrentUser` ⛔ KHÔNG `requireRequireAdmin`", () => {
  for (const action of ["save_warehouse", "set_warehouse_status"]) {
    const i = controller.indexOf(`case "${action}" ->`);
    assert.ok(i > 0, `controller thiếu case "${action}"`);
    const than = controller.slice(i, i + 400);
    assert.match(than, /requireCurrentUser\(/, `case "${action}" phải dùng requireCurrentUser`);
    // ⭐ BÀI HỌC 3 TẦNG (`BUG-20261008-002`): tầng cứng `role=admin` sẽ CHẶN OAN người được cấp quyền qua CẤU HÌNH.
    assert.doesNotMatch(than, /requireRequireAdmin/, `case "${action}" ⛔ KHÔNG được dùng requireRequireAdmin`);
  }
});

test("KHO — `page.tsx` (S01) đã nối modal: import + case `warehouse`", () => {
  assert.match(page, /import \{ WarehouseFormModal \} from "@\/app\/screens\/WarehouseFormModal";/,
    "page.tsx phải import WarehouseFormModal (⭐ TÁI DÙNG component phiên 02, ⛔ không viết modal thứ hai)");
  assert.match(page, /\{modal === "warehouse" && <WarehouseFormModal/,
    "page.tsx phải có case modal warehouse");
});

test("KHO — ⛔ CỐ Ý KHÔNG có `delete_warehouse` (phiên 02 chốt ALLOW_DELETE_WAREHOUSE = false)", () => {
  // ⛔ Xoá kho sẽ làm MỒ CÔI phiếu nhập/xuất lịch sử ⇒ chỉ «ngừng hoạt động».
  assert.doesNotMatch(registry, /Map\.entry\("delete_warehouse"/, "⛔ KHÔNG được khai delete_warehouse");
  assert.doesNotMatch(controller, /case "delete_warehouse"/, "⛔ KHÔNG được có case delete_warehouse");
});
