// MT2-P3-05 (§6.4) — HỢP ĐỒNG REGRESSION: vật tư NCC + auto-detect khi tạo PO.
// ⚠️ TRUNG THỰC: hành vi §6.4 đã tồn tại trong baseline (backend `supplier_material_gaps` /
// `save_supplier_material` + UI `SupplierDetailModal`), nên hợp đồng này là KHOÁ REGRESSION viết sau
// khi tính năng có sẵn — ⛔ KHÔNG giả vờ "đỏ trước khi sửa" như TDD.
// Chạy: node --import tsx --test tests/p3-05-supplier-material-autodetect.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const modal = read("../app/screens/SupplierDetailModal.tsx");
const page = read("../app/page.tsx");
const store = read("../java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/SupplierStoreAdapter.java");
const useCase = read("../java-backend/application/src/main/java/com/vntech/erp/application/service/SupplierManagementUseCase.java");
const rbac = read("../java-backend/application/src/main/java/com/vntech/erp/application/rbac/ActionRbacRegistry.java");

test("P3-05 — §6.4 HỎI đúng nguyên văn trước khi thêm vật tư vào danh mục NCC", () => {
  assert.match(modal, /Vật tư này chưa có trong danh mục vật tư của nhà cung cấp\. Bạn có muốn thêm không\?/,
    "phải hiện ĐÚNG câu hỏi §6.4");
});

test("P3-05 — ⛔ KHÔNG tự động thêm: chỉ ĐỌC gaps, việc ghi nằm sau thao tác bấm của user", () => {
  // Đọc gaps: hàm riêng, chỉ gọi nguồn dữ liệu.
  assert.match(modal, /async function checkGaps\(po: Row\)[\s\S]{0,400}loadGaps\(String\(po\.id\)\)/,
    "checkGaps chỉ ĐỌC danh sách thiếu");
  // Ghi: nằm trong approveAdd và chỉ được gọi từ onClick.
  assert.match(modal, /async function approveAdd\(materialId: string\)[\s\S]{0,400}action\("save_supplier_material", \{ supplierId: supplierId, materialId: materialId \}\)/,
    "approveAdd mới gọi action ghi");
  assert.match(modal, /onClick=\{\(\) => approveAdd\(/, "approveAdd phải gắn vào nút bấm của user");
  // ⛔ Cấm auto-add bằng effect.
  assert.doesNotMatch(modal, /useEffect\([\s\S]{0,300}(save_supplier_material|approveAdd)/,
    "⛔ không được tự động thêm bằng useEffect (trái §6.4)");
});

test("P3-05 — nguồn dữ liệu THẬT: UI gọi `supplier_material_gaps`, backend có action + RBAC", () => {
  assert.match(page, /requestApi\("supplier_material_gaps", \{ purchaseOrderId \}\)/,
    "UI phải lấy vật tư thiếu từ action thật");
  assert.match(useCase, /saveSupplierMaterial/, "use-case phải có đường lưu vật tư NCC");
  assert.match(store, /NOT EXISTS \(SELECT 1 FROM supplier_materials sm/, "gaps phải tính bằng truy vấn thật");
  assert.match(rbac, /Map\.entry\("save_supplier_material", List\.of\("supplier_catalog"\)\)/,
    "action ghi phải gác module supplier_catalog");
  assert.match(rbac, /Map\.entry\("supplier_material_gaps", List\.of\("supplier_catalog"\)\)/,
    "action đọc gaps phải gác module supplier_catalog");
});
