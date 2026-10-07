// TEST THẬT cho `lib/warehouse-hub.ts` — HUB «KHO VẬT TƯ» (ERP-SESSION-02, 06/10/2026).
//
// ⭐ VÌ SAO CÓ TỆP NÀY: GO-LIVE §10 «TEST BEFORE FIXED» + §11 «VERIFY BEFORE VERIFIED»
//    ⇒ khối thuần phải được CHẠY THẬT trên fixtures, ⛔ không chỉ «đọc thấy đúng».
//
// Chạy: node --import tsx --test tests/warehouse-hub.test.mjs
import test from "node:test";
import assert from "node:assert/strict";

import {
  WAREHOUSE_HUB_TABS,
  WAREHOUSE_DETAIL_TABS,
  OUT_IN_SUBTABS,
  ALLOCATE_RETURN_SUBTABS,
  SEE_ALL_WAREHOUSE_ROLES,
  hubRoleBase,
  canSeeAllWarehouses,
  totalsForWarehouse,
  totalsFromRows,
  isProjectWarehouse,
  warehouseCards,
  myProjectIds,
  visibleWarehouseCards,
  defaultOutInSubtab,
  defaultAllocateReturnSubtab,
  inventoryRowsOfWarehouse,
  documentsOfWarehouse,
} from "../lib/warehouse-hub.ts";

// ─────────────────────────────────────────────────────────────────────────────
// FIXTURES — dựng theo ĐÚNG hình dạng payload THẬT (`GET /api/system`)
// ─────────────────────────────────────────────────────────────────────────────
const warehouses = [
  { id: "WH-CENTRAL", code: "KHO-TONG", name: "Kho Tổng", type: "central", projectId: null },
  { id: "WH-PRJ-A", code: "KHO-DA", name: "Kho Dự án A", type: "site", projectId: "PRJ-A" },
  { id: "WH-PRJ-B", code: "KHO-DB", name: "Kho Dự án B", type: "site", projectId: "PRJ-B" },
];

const projects = [
  { id: "PRJ-A", name: "Dự án Alpha" },
  { id: "PRJ-B", name: "Dự án Beta" },
];

const inventory = [
  // Kho Tổng: 2 dòng, 1 dòng dưới định mức tối thiểu
  { warehouseId: "WH-CENTRAL", materialCode: "VT-01", balance: 100, reserved: 10, available: 90, minStock: 20 },
  { warehouseId: "WH-CENTRAL", materialCode: "VT-02", balance: 5, reserved: 0, available: 5, minStock: 10 },
  // Kho Dự án A
  { warehouseId: "WH-PRJ-A", materialCode: "VT-01", balance: 40, reserved: 4, available: 36, minStock: 0 },
  // Kho Dự án B
  { warehouseId: "WH-PRJ-B", materialCode: "VT-03", balance: 7, reserved: 1, available: 6, minStock: 2 },
];

const issues = [
  { issueNo: "PX-01", warehouseId: "WH-PRJ-A", projectId: "PRJ-A" },
  { issueNo: "PX-02", warehouseId: "WH-CENTRAL", projectId: "PRJ-B" },
];
const receipts = [{ receiptNo: "PN-01", warehouseId: "WH-CENTRAL" }];
const returns = [{ returnNo: "RET-01", warehouseId: "WH-PRJ-A" }];

// ─────────────────────────────────────────────────────────────────────────────
// 1. HẰNG SỐ — ⭐ nguyên văn yêu cầu user (⛔ không tự đổi tên/bớt tab)
// ─────────────────────────────────────────────────────────────────────────────
test("tabbar cấp 1 đúng 3 tab user yêu cầu, đúng thứ tự", () => {
  assert.deepEqual([...WAREHOUSE_HUB_TABS], ["KHO", "XUẤT & NHẬP", "CẤP PHÁT & HOÀN TRẢ"]);
});

test("subtab của 2 tab phụ đúng yêu cầu", () => {
  assert.deepEqual([...OUT_IN_SUBTABS], ["XUẤT", "NHẬP"]);
  assert.deepEqual([...ALLOCATE_RETURN_SUBTABS], ["CẤP PHÁT", "HOÀN TRẢ"]);
});

test("màn chi tiết kho đúng 5 tab user yêu cầu", () => {
  assert.deepEqual(
    [...WAREHOUSE_DETAIL_TABS],
    ["Dashboard kho", "Tồn kho", "Xuất - Nhập", "Cấp phát - Hoàn trả", "Nhân sự"],
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. QUY TẮC NGOẠI LỆ — ⭐ quyết định user: «Xem tất cả + thao tác theo quyền module»
// ─────────────────────────────────────────────────────────────────────────────
test("roleBase đọc roleBase trước, rồi tới role (khớp lib/permissions.ts)", () => {
  assert.equal(hubRoleBase({ role: "engineer", roleBase: "director" }), "director");
  assert.equal(hubRoleBase({ role: "engineer" }), "engineer");
  assert.equal(hubRoleBase(null), "");
});

test("NGOẠI LỆ: chỉ director + admin được xem TẤT CẢ kho", () => {
  assert.deepEqual([...SEE_ALL_WAREHOUSE_ROLES], ["director", "admin"]);
  assert.equal(canSeeAllWarehouses({ role: "director" }), true);
  assert.equal(canSeeAllWarehouses({ role: "admin" }), true);
  assert.equal(canSeeAllWarehouses({ roleBase: "director" }), true);
  // ⛔ các vai trò KHÁC ⛔ KHÔNG được hưởng ngoại lệ
  for (const role of ["engineer", "commander", "project", "procurement", "accountant", "warehouse", "team"]) {
    assert.equal(canSeeAllWarehouses({ role }), false, `vai trò ${role} ⛔ không được xem tất cả`);
  }
  assert.equal(canSeeAllWarehouses(null), false);
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. TỒN KHO — ⛔ KHÔNG tự cộng lại sổ; chỉ Σ các cột payload đã tính
// ─────────────────────────────────────────────────────────────────────────────
test("totalsForWarehouse chỉ tính ĐÚNG kho theo warehouseId", () => {
  const t = totalsForWarehouse(inventory, "WH-CENTRAL");
  assert.equal(t.materialCount, 2);
  assert.equal(t.balance, 105);
  assert.equal(t.reserved, 10);
  assert.equal(t.available, 95);
  assert.equal(t.belowMinCount, 1); // VT-02: balance 5 < minStock 10
});

test("totalsForWarehouse trả RỖNG khi kho không có dòng hoặc id rỗng", () => {
  assert.deepEqual(totalsForWarehouse(inventory, "KHONG-CO"), {
    materialCount: 0, balance: 0, reserved: 0, available: 0, belowMinCount: 0,
  });
  assert.equal(totalsForWarehouse(inventory, null).materialCount, 0);
});

test("belowMinCount ⛔ KHÔNG đếm dòng minStock = 0 (không có định mức ⇒ không phải sắp hết)", () => {
  const t = totalsFromRows([{ balance: 0, minStock: 0 }, { balance: 1, minStock: 0 }]);
  assert.equal(t.belowMinCount, 0);
});

test("totalsFromRows chịu được giá trị bẩn (undefined/NaN/chuỗi) — ⛔ không ra NaN", () => {
  const t = totalsFromRows([{ balance: undefined }, { balance: "abc" }, { balance: "12" }, null]);
  assert.equal(Number.isNaN(t.balance), false);
  assert.equal(t.balance, 12);
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. CARD KHO — Tên · Mã · Dự án (chỉ kho dự án) · Tồn hiện tại
// ─────────────────────────────────────────────────────────────────────────────
test("warehouseCards: kho TỔNG ⛔ không gán dự án, kho DỰ ÁN có mã + tên dự án", () => {
  const cards = warehouseCards(warehouses, inventory, projects);
  assert.equal(cards.length, 3);
  const central = cards.find((c) => c.id === "WH-CENTRAL");
  const prjA = cards.find((c) => c.id === "WH-PRJ-A");
  assert.equal(central.isProjectWarehouse, false);
  assert.equal(central.projectId, "");   // ⭐ user: «dự án (NẾU là kho dự án)»
  assert.equal(central.projectName, "");
  assert.equal(prjA.isProjectWarehouse, true);
  assert.equal(prjA.projectCode, "");    // payload kho dự án ⛔ không trả projectCode ⇒ ⛔ không bịa
  assert.equal(prjA.projectName, "Dự án Alpha"); // ⭐ tra từ projects[]
});

test("warehouseCards: tồn hiện tại gắn ĐÚNG vào từng card", () => {
  const cards = warehouseCards(warehouses, inventory, projects);
  assert.equal(cards.find((c) => c.id === "WH-CENTRAL").totals.balance, 105);
  assert.equal(cards.find((c) => c.id === "WH-PRJ-A").totals.balance, 40);
  assert.equal(cards.find((c) => c.id === "WH-PRJ-B").totals.balance, 7);
});

test("warehouseCards: kho TỔNG xếp TRƯỚC kho dự án, trong nhóm sắp theo mã", () => {
  const cards = warehouseCards(warehouses, inventory, projects);
  assert.equal(cards[0].id, "WH-CENTRAL");
  assert.deepEqual(cards.slice(1).map((c) => c.code), ["KHO-DA", "KHO-DB"]);
});

test("isProjectWarehouse nhận 'site'/'project', ⛔ không nhận 'central'", () => {
  assert.equal(isProjectWarehouse("site"), true);
  assert.equal(isProjectWarehouse("SITE"), true);
  assert.equal(isProjectWarehouse("project"), true);
  assert.equal(isProjectWarehouse("central"), false);
  assert.equal(isProjectWarehouse(undefined), false);
});

test("warehouseCards nhận danh sách giới hạn warehouseIds (dùng khi đã lọc sẵn)", () => {
  const cards = warehouseCards(warehouses, inventory, projects, ["WH-PRJ-A"]);
  assert.equal(cards.length, 1);
  assert.equal(cards[0].id, "WH-PRJ-A");
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. PHẠM VI XEM — ⭐ trái tim yêu cầu «kho dự án chỉ hiện với user thuộc dự án đó»
// ─────────────────────────────────────────────────────────────────────────────
test("myProjectIds gom đúng + ⛔ không trùng, bỏ rỗng", () => {
  assert.deepEqual(myProjectIds([{ projectId: "PRJ-A" }, { projectId: "PRJ-A" }, { projectId: "" }, {}]), ["PRJ-A"]);
});

test("user THƯỜNG: chỉ thấy kho Tổng + kho dự án MÌNH THUỘC", () => {
  const cards = warehouseCards(warehouses, inventory, projects);
  const out = visibleWarehouseCards(cards, { role: "engineer" }, [{ projectId: "PRJ-A" }]);
  assert.equal(out.seeAll, false);
  assert.deepEqual(out.visible.map((c) => c.id).sort(), ["WH-CENTRAL", "WH-PRJ-A"]);
  assert.equal(out.hiddenByScope, 1); // WH-PRJ-B bị ẩn
});

test("user ⛔ KHÔNG thuộc dự án nào ⇒ vẫn thấy kho TỔNG (⛔ không màn trắng)", () => {
  const cards = warehouseCards(warehouses, inventory, projects);
  const out = visibleWarehouseCards(cards, { role: "team" }, []);
  assert.deepEqual(out.visible.map((c) => c.id), ["WH-CENTRAL"]);
  assert.equal(out.hiddenByScope, 2);
});

test("NGOẠI LỆ director/admin: thấy TẤT CẢ kho, hiddenByScope = 0", () => {
  const cards = warehouseCards(warehouses, inventory, projects);
  for (const role of ["director", "admin"]) {
    const out = visibleWarehouseCards(cards, { role }, []);
    assert.equal(out.seeAll, true, `${role} phải thấy tất cả`);
    assert.equal(out.visible.length, 3);
    assert.equal(out.hiddenByScope, 0);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. SUBTAB MẶC ĐỊNH THEO QUYỀN — ⭐ user: «hiển thị XUẤT trước hoặc NHẬP tùy user perm»
// ─────────────────────────────────────────────────────────────────────────────
test("XUẤT & NHẬP: có quyền Xuất ⇒ mở XUẤT; chỉ có quyền Nhập ⇒ mở NHẬP", () => {
  assert.equal(defaultOutInSubtab(true, true), "XUẤT");
  assert.equal(defaultOutInSubtab(true, false), "XUẤT");
  assert.equal(defaultOutInSubtab(false, true), "NHẬP");
  assert.equal(defaultOutInSubtab(false, false), "XUẤT"); // ⛔ không quyền nào ⇒ vẫn có khung, ⛔ không vỡ UI
});

test("CẤP PHÁT & HOÀN TRẢ: logic tương tự", () => {
  assert.equal(defaultAllocateReturnSubtab(true, true), "CẤP PHÁT");
  assert.equal(defaultAllocateReturnSubtab(false, true), "HOÀN TRẢ");
  assert.equal(defaultAllocateReturnSubtab(false, false), "CẤP PHÁT");
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. LỌC THEO KHO CHO MÀN CHI TIẾT
// ─────────────────────────────────────────────────────────────────────────────
test("inventoryRowsOfWarehouse trả đúng dòng của 1 kho", () => {
  assert.equal(inventoryRowsOfWarehouse(inventory, "WH-PRJ-A").length, 1);
  assert.equal(inventoryRowsOfWarehouse(inventory, "WH-CENTRAL").length, 2);
  assert.equal(inventoryRowsOfWarehouse(inventory, "KHONG-CO").length, 0);
});

test("documentsOfWarehouse lọc theo NHIỀU trường kho (xuất/nhập/cấp phát/hoàn trả)", () => {
  assert.deepEqual(documentsOfWarehouse(issues, "WH-PRJ-A", ["warehouseId"]).map((r) => r.issueNo), ["PX-01"]);
  assert.deepEqual(documentsOfWarehouse(receipts, "WH-CENTRAL", ["warehouseId"]).map((r) => r.receiptNo), ["PN-01"]);
  assert.deepEqual(documentsOfWarehouse(returns, "WH-PRJ-A", ["warehouseId"]).map((r) => r.returnNo), ["RET-01"]);
  assert.equal(documentsOfWarehouse(issues, "", ["warehouseId"]).length, 0);
});
