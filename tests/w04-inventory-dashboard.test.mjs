// PHASE 5 (`W-04`) — HỢP ĐỒNG «DASHBOARD TỒN KHO»: ĐỦ **8 CHỈ SỐ**, MỌI SỐ TÍNH TỪ PAYLOAD (§19).
//
// Nguyên văn `docs/25_TODO_ROADMAP.md` dòng `W-04`: «Dashboard tồn kho: tổng · khả dụng · giữ chỗ · nhập · xuất ·
// chờ chuyển · sắp hết · giá trị kho (§19)».
//
// Cách kiểm (cùng kỷ luật `tests/t08-work-dashboard.test.mjs`):
//   (1) TRÍCH khối thuần trong `app/screens/WarehouseDashboard.tsx`, dịch TS→JS bằng esbuild rồi CHẠY với fixtures
//       ⇒ mọi con số phải bằng ĐÚNG phép đếm tay (không bịa, không hardcode);
//   (2) KHÔNG gọi API mới: khối thuần KHÔNG được có `fetch(`/`action(`/`await`; ngoài ra Uỷ quyền chỉ dùng
//       khoá CÓ THẬT trong payload bootstrap;
//   (3) ĐỐI CHỨNG ÂM cho «giá trị kho»: `unit_cost` chỉ có trong bảng `stock_movements`, mà bootstrap
//       **KHÔNG trả khoá `stockMovements`** ⇒ giá trị kho THEO SỔ GIÁ VỐN phải là «chưa có nguồn» kèm LÝ DO,
//       TUYỆT ĐỐI không bịa số, KHÔNG lấy `unitPrice` của PO (đang = 0 trên dữ liệu thật) thay thế.
//
// LƯU Ý: tệp này CỐ Ý không nằm trong `package.json` → `test:regression` giữ nguyên số ca.
// Chạy riêng:  node --test tests/w04-inventory-dashboard.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import esbuild from "esbuild";

const read = (relative) => readFileSync(new URL("../" + relative, import.meta.url), "utf8");
const dashboard = read("app/screens/WarehouseDashboard.tsx");
const inventory = read("app/screens/Inventory.tsx");
const route = read("scripts/system-route.mjs");

const BEGIN = "W04-PURE-BEGIN";
const END = "W04-PURE-END";
assert.equal(dashboard.split(BEGIN).length - 1, 1, "Mốc W04-PURE-BEGIN phải xuất hiện đúng 1 lần");
assert.equal(dashboard.split(END).length - 1, 1, "Mốc W04-PURE-END phải xuất hiện đúng 1 lần");
const blockStart = dashboard.indexOf(BEGIN);
const blockEnd = dashboard.indexOf(END, blockStart + BEGIN.length);
assert.ok(blockStart > 0 && blockEnd > blockStart, "WarehouseDashboard.tsx thiếu khối thuần W04-PURE-BEGIN/END");
const block = dashboard.slice(dashboard.indexOf("\n", blockStart) + 1, blockEnd);
const component = dashboard.slice(blockEnd);

function loadPure() {
  const js = esbuild.transformSync(block, { loader: "ts" }).code;
  const names = ["INVENTORY_METRICS", "INVENTORY_NO_SOURCE", "INVENTORY_VALUE_NO_SOURCE_NOTE", "inventorySourceOf", "warehouseDashboard"];
  return new Function(`${js}\nreturn { ${names.join(", ")} };`)();
}

// ── FIXTURES: tên trường ĐÚNG theo `scripts/system-route.mjs` (đã đo bằng payload THẬT) ────────────
const WAREHOUSES = [
  { id: "W1", code: "KHO-P1", name: "Kho công trường P1", type: "site", projectId: "P1", projectCode: "PRJ-1" },
  { id: "W2", code: "KHO-TONG", name: "Kho trung tâm", type: "central", projectId: null, projectCode: null },
];
const MATERIALS = [
  { id: "M1", code: "VT-1", name: "Thép hộp", unit: "cây", standardPrice: 1000 },
  { id: "M2", code: "VT-2", name: "Xi măng", unit: "bao", standardPrice: 0 },
];
// `inventory` — mỗi dòng = (kho × vật tư), có `balance`/`reserved`/`available`/`minStock`.
const INVENTORY = [
  { projectId: "P1", projectCode: "PRJ-1", warehouseId: "W1", warehouseCode: "KHO-P1", warehouseName: "Kho công trường P1", type: "site", materialId: "M1", materialCode: "VT-1", materialName: "Thép hộp", unit: "cây", minStock: 0, balance: 60, reserved: 10, available: 50 },
  { projectId: "P1", projectCode: "PRJ-1", warehouseId: "W1", warehouseCode: "KHO-P1", warehouseName: "Kho công trường P1", type: "site", materialId: "M2", materialCode: "VT-2", materialName: "Xi măng", unit: "bao", minStock: 20, balance: 5, reserved: 0, available: 5 },
];
const RECEIPTS = [
  { id: "GR-1", receiptNo: "GRN-1", acceptedQty: 85, actualDeliveredQty: 85, items: [] },
  { id: "GR-2", receiptNo: "GRN-2", acceptedQty: 15, actualDeliveredQty: 15, items: [] },
];
const ISSUES = [
  { id: "IS-1", issueNo: "PX-1", status: "posted", totalQty: 12, installedQty: 0 },
  { id: "IS-2", issueNo: "PX-2", status: "posted", totalQty: 3, installedQty: 1 },
];
const TRANSFERS = [
  { id: "T1", transferNo: "TRF-1", status: "in_transit", requestedQty: 40, shippedQty: 40, receivedQty: 0 },
  { id: "T2", transferNo: "TRF-2", status: "received", requestedQty: 10, shippedQty: 10, receivedQty: 10 },
];
const DATA = { inventory: INVENTORY, warehouses: WAREHOUSES, materials: MATERIALS, receipts: RECEIPTS, issues: ISSUES, transferOrders: TRANSFERS, centralInventory: [] };

test("W-04 — ĐỦ 8 CHỈ SỐ, ĐÚNG nguyên văn §19: tổng · khả dụng · giữ chỗ · nhập · xuất · chờ chuyển · sắp hết · giá trị kho", () => {
  const { INVENTORY_METRICS } = loadPure();
  assert.deepEqual(INVENTORY_METRICS.map((m) => m.key), [
    "total", "available", "reserved", "inbound", "outbound", "pendingTransfer", "lowStock", "value",
  ], "8 chỉ số phải đủ và đúng thứ tự §19");
  assert.deepEqual(INVENTORY_METRICS.map((m) => m.label), [
    "Tổng tồn", "Khả dụng", "Giữ chỗ", "Nhập", "Xuất", "Chờ chuyển", "Sắp hết", "Giá trị kho",
  ], "Nhãn 8 chỉ số phải khớp §19");
  // Mỗi chỉ số phải khai NGUỒN THẬT (khoá payload) — không có chỉ số nào "nguồn: bịa".
  for (const metric of INVENTORY_METRICS) {
    assert.ok(metric.source && metric.source.length > 3, `Chỉ số «${metric.label}» thiếu khai báo NGUỒN`);
  }
  assert.equal((component.match(/data-inventory-metric="/g) || []).length, 8,
    "UI phải vẽ ĐÚNG 8 ô chỉ số (data-inventory-metric)");
});

test("W-04 — MỌI số tính từ payload: đối chiếu ĐÚNG phép đếm tay trên fixtures", () => {
  const { warehouseDashboard } = loadPure();
  const m = warehouseDashboard(DATA, "ALL");
  assert.equal(m.total, 65, "Tổng tồn = 60 + 5");
  assert.equal(m.available, 55, "Khả dụng = 50 + 5");
  assert.equal(m.reserved, 10, "Giữ chỗ = 10");
  assert.equal(m.inbound, 100, "Nhập = 85 + 15 (acceptedQty của receipts)");
  assert.equal(m.outbound, 15, "Xuất = 12 + 3 (totalQty của issues)");
  assert.equal(m.transfers.pending, 1, "Chờ chuyển = số phiếu điều chuyển CHƯA kết thúc");
  assert.equal(m.lowStock, 1, "Sắp hết = 1 dòng (available 5 < minStock 20); dòng minStock=0 KHÔNG tính");
  assert.equal(m.warehouseCount, 2, "Số kho = 2");
  assert.equal(m.zeroBalanceOnly, false, "Có dòng tồn > 0 ⇒ không rơi vào trạng thái 'chỉ có dòng tồn 0'");
  // Lọc theo dự án: chỉ còn kho của P1 ⇒ cùng tập dòng (2 dòng đều thuộc P1).
  const scoped = warehouseDashboard(DATA, "P1");
  assert.equal(scoped.total, 65);
  // Dự án không có dòng nào ⇒ 0 dòng (KHÁC với "chưa có nguồn" của cột thiếu).
  const none = warehouseDashboard(DATA, "P9");
  assert.equal(none.total, 0);
  assert.equal(none.rows.length, 0);
});

test("W-04 — KHÔNG gọi API mới: khối thuần không có `fetch(`/`action(`/`await` và chỉ đọc khoá CÓ THẬT", () => {
  const stripped = block.replace(/\/\/[^\n]*/g, "");
  assert.doesNotMatch(stripped, /fetch\(/, "Khối dashboard KHÔNG được gọi API mới (fetch)");
  assert.doesNotMatch(stripped, /\baction\(/, "Khối dashboard KHÔNG được gọi action");
  assert.doesNotMatch(stripped, /\bawait\b/, "Khối dashboard KHÔNG được có await");
  assert.doesNotMatch(block, /value=\s*["']\d/, "Khối thuần không được hardcode số");
  // Mọi khoá đọc từ payload đều phải tồn tại trong `AppData` (đã khai ở lib/ui-shared.tsx).
  const uiShared = read("lib/ui-shared.tsx");
  for (const key of ["inventory", "warehouses", "materials", "receipts", "issues", "transferOrders", "centralInventory", "projects"]) {
    assert.match(uiShared, new RegExp(`\\b${key}: Row\\[\\]`), `Khoá payload «${key}» không có trong AppData`);
  }
  // Trường trong dòng phải do bootstrap THẬT sinh ra.
  for (const field of ["w.id AS warehouseId", "COALESCE(mv.balance,0) AS balance", "COALESCE(r.reserved,0) AS reserved", "m.min_stock AS minStock", "COALESCE(gra.accepted_qty,0) AS acceptedQty"]) {
    assert.ok(route.includes(field), `bootstrap KHÔNG trả «${field}» ⇒ dashboard không thể tính từ dữ liệu thật`);
  }
});

test("W-04 — ĐỐI CHỨNG ÂM «giá trị kho»: thiếu `unit_cost` (payload KHÔNG có `stockMovements`) ⇒ «chưa có nguồn» + lý do", () => {
  const { warehouseDashboard, INVENTORY_NO_SOURCE, INVENTORY_VALUE_NO_SOURCE_NOTE } = loadPure();
  assert.equal(INVENTORY_NO_SOURCE, "chưa có nguồn");
  // Bootstrap TRẢ khoá nào? Nếu `stockMovements` KHÔNG có trong payload thì nguồn giá vốn KHÔNG tồn tại.
  assert.doesNotMatch(route, /stockMovements\s*:/,
    "Nếu bootstrap BẮT ĐẦU trả `stockMovements` thì kết luận 'thiếu nguồn' phải được xem lại — không để test xanh giả");
  assert.match(route, /unit_cost/, "Bảng `stock_movements` phải THẬT SỰ có cột unit_cost (nguồn giá vốn duy nhất)");
  const m = warehouseDashboard(DATA, "ALL");
  assert.equal(m.value.ledgerValue, null, "Giá trị kho theo SỔ GIÁ VỐN phải là null (không bịa) khi payload thiếu unit_cost");
  assert.ok(m.value.source.includes(INVENTORY_NO_SOURCE), `Nguồn giá trị kho phải ghi «${INVENTORY_NO_SOURCE}»: "${m.value.source}"`);
  assert.ok(m.value.note.includes(INVENTORY_VALUE_NO_SOURCE_NOTE), "Thiếu LÝ DO cụ thể vì sao giá trị kho chưa có nguồn");
  assert.ok(m.value.note.includes("stock_movements"), "Lý do phải nêu nguồn bị thiếu: stock_movements.unit_cost");
  // Cấm lấy `unitPrice` của PO làm giá vốn: trên dữ liệu THẬT cột này đang = 0 ⇒ sẽ ra "0 đ" SAI.
  // Chỉ soi TRUY CẬP DỮ LIỆU (`<biến>.unitPrice` / chuỗi `"unitPrice"`) — phần văn bản giải thích lý do CẤM
  // nằm trong chuỗi `INVENTORY_VALUE_NO_SOURCE_NOTE` nên hợp lệ và KHÔNG bị coi là vi phạm.
  const dataAccess = block.replace(/`[^`]*`/g, "``").replace(/"[^"]*"/g, '""');
  assert.doesNotMatch(dataAccess, /\.unitPrice\b/, "KHÔNG được dùng unitPrice của PO thay cho unit_cost (đang = 0 trên dữ liệu thật)");
  // «Giá trị theo giá chuẩn danh mục» là chỉ số PHỤ, chỉ tính từ dòng CÓ `standardPrice` > 0 và phải nói rõ bản chất.
  assert.equal(m.value.standardPriceValue, 60 * 1000, "Giá trị theo giá chuẩn = 60 (TỒN của VT-1) × 1000 — chỉ tính tồn, KHÔNG trừ giữ chỗ");
  assert.ok(m.value.standardPriceSource.includes("materials"), "Nguồn giá chuẩn phải nêu `materials.standardPrice`");
  assert.ok(/KHÔNG phải giá vốn/i.test(m.value.standardPriceNote), "Phải nói rõ giá chuẩn KHÔNG phải giá vốn thực tế");
  // Thiếu hẳn `standardPrice` ⇒ cũng «chưa có nguồn», không hiện 0.
  const noPrice = warehouseDashboard({ inventory: INVENTORY, warehouses: WAREHOUSES, materials: [{ id: "M1", code: "VT-1" }] }, "ALL");
  assert.equal(noPrice.value.standardPriceValue, null, "material thiếu standardPrice ⇒ giá trị giá chuẩn phải là null");
  assert.ok(noPrice.value.standardPriceSource.includes(INVENTORY_NO_SOURCE));
  // 0 DÒNG tồn ⇒ cũng phải nói «chưa có nguồn» chứ không hiện 0 như thể đã đo được.
  const empty = warehouseDashboard({ inventory: [], warehouses: [], materials: [] }, "ALL");
  assert.ok(empty.value.source.includes(INVENTORY_NO_SOURCE));
  assert.ok(empty.totalSource.includes(INVENTORY_NO_SOURCE), "0 dòng tồn ⇒ nguồn phải ghi «chưa có nguồn»");
});

test("W-04 — UI KHÔNG hardcode: mọi KPI lấy từ khối tính toán, in rõ NGUỒN, và «giá trị kho» HIỆN chữ khi thiếu nguồn", () => {
  assert.match(component, /className="kpi-grid small"/, "Thiếu dải KPI");
  assert.doesNotMatch(component, /value="\d/, "KPI đang hardcode số thay vì tính từ dữ liệu");
  for (const expr of ["String(metrics.total)", "String(metrics.available)", "String(metrics.reserved)", "String(metrics.inbound)", "String(metrics.outbound)", "String(metrics.transfers.pending)", "String(metrics.lowStock)"]) {
    assert.ok(component.includes(`value={${expr}}`), `KPI chưa lấy giá trị từ khối tính toán: ${expr}`);
  }
  // «Giá trị kho»: có giá vốn ⇒ format; KHÔNG có ⇒ hiện «chưa có nguồn» kèm lý do.
  assert.match(component, /metrics\.value\.ledgerValue\s*===?\s*null\s*\?\s*INVENTORY_NO_SOURCE/, "Ô «Giá trị kho» chưa xử lý nhánh thiếu nguồn");
  assert.match(component, /metrics\.value\.note/, "Ô «Giá trị kho» phải in LÝ DO thiếu nguồn");
  assert.match(component, /metrics\.value\.standardPriceValue/, "Thiếu chỉ số PHỤ «giá trị theo giá chuẩn danh mục»");
  for (const key of ["total", "available", "reserved", "inbound", "outbound", "pendingTransfer", "lowStock", "value"]) {
    assert.ok(component.includes(`data-inventory-metric="${key}"`), `Thiếu ô chỉ số «${key}»`);
  }
  // Nguồn phải in ra cho người dùng thấy (không chỉ nằm trong comment).
  assert.match(component, /data-inventory-source/, "Thiếu dòng in NGUỒN dữ liệu");
  assert.match(component, /className="baseline-table"|className="table-wrap"/, "Thiếu bảng số liệu");
});

test("W-04 — GẮN vào màn Tồn kho dưới dạng TAB «Dashboard tồn kho» (không màn mới, không route mới)", () => {
  assert.match(inventory, /import \{ WarehouseDashboard \} from "@\/app\/screens\/WarehouseDashboard";/, "Inventory chưa import khối dashboard");
  assert.match(inventory, /<WarehouseDashboard\b/, "Inventory chưa render khối dashboard");
  assert.match(inventory, /const WAREHOUSE_TABS = \["Tồn kho", "Dashboard tồn kho"\]/, "Thiếu dải 2 tab «Tồn kho / Dashboard tồn kho»");
  assert.match(inventory, /view\?: WarehouseMenuView/, "Inventory chưa nhận prop `view` từ mục menu");
  assert.match(inventory, /view === "dashboard"/, "Inventory chưa mở tab dashboard theo `view` của mục menu");
  // Màn Tồn kho hiện tại phải được GIỮ NGUYÊN trong tab «Tồn kho».
  assert.match(inventory, /TỒN KHO & ĐIỀU CHUYỂN/, "Tab «Tồn kho» phải giữ nguyên nội dung cũ");
});
