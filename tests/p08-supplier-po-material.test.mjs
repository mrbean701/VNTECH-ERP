// `P-08` — TEST HỢP ĐỒNG cho điều hướng **Nhà cung cấp ↔ PO ↔ Vật tư** (`lib/p08-nav-trace.ts`).
//
// CỐ Ý KHÔNG nằm trong `package.json` (`test:regression` giữ nguyên 69 ca) — đúng khuôn
// `tests/p07-supplier-partner-split.test.mjs`.
//
// Chạy: `node --import tsx --test tests/p08-supplier-po-material.test.mjs`
//
// Dữ liệu test dùng ĐÚNG tên trường đã đo trên payload bootstrap (xem đầu `lib/p08-nav-trace.ts`).

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const MODULE_PATH = "lib/p08-nav-trace.ts";

// ── Payload mẫu: 2 NCC · 3 PO · 3 vật tư · 2 PR (dựng ĐÚNG hình dạng payload thật) ────────────
// Ca thật đã đo: 1 PR → 2 PO · 2 NCC khác nhau (`tools/seed-p2-test-data.mjs` dòng 594-628).
const SUP_A = "SUP_aaaa-1111";
const SUP_B = "SUP_bbbb-2222";
const PO_1 = "PO_1111-aaaa";
const PO_2 = "PO_2222-bbbb";
const PO_3 = "PO_3333-cccc";
const MAT_1 = "MAT_1111-thep";
const MAT_2 = "MAT_2222-xi";
const MAT_3 = "MAT_3333-cat";
const MRI_1 = "MRI_1111";
const MRI_2 = "MRI_2222";
const MRI_3 = "MRI_3333";

const data = {
  suppliers: [
    { id: SUP_A, code: "NCC-001", name: "Thép Nam Việt", active: 1, phone: "0900000001" },
    { id: SUP_B, code: "NCC-002", name: "Vật liệu Hà Nội", active: 1, phone: "0900000002" },
    { id: "SUP_cccc-3333", code: "NCC-003", name: "Chưa từng có PO", active: 1 },
  ],
  purchaseOrders: [
    {
      id: PO_1,
      poNo: "PO-2026-001",
      supplierId: SUP_A,
      supplierName: "Thép Nam Việt",
      requestId: "MR_1",
      orderedAt: "2026-09-01T00:00:00Z",
      status: "ordered",
      items: [
        { id: "POI_1", requestItemId: MRI_1, materialId: MAT_1, materialCode: "MAT-001", materialName: "Thép hộp 40x40", unit: "cây", orderedQty: 10, receivedQty: 4, closedQty: 0 },
        { id: "POI_2", requestItemId: MRI_2, materialId: MAT_2, materialCode: "MAT-002", materialName: "Xi măng PCB40", unit: "bao", orderedQty: 20, receivedQty: 20, closedQty: 0 },
      ],
    },
    {
      id: PO_2,
      poNo: "PO-2026-002",
      supplierId: SUP_A,
      supplierName: "Thép Nam Việt",
      requestId: "MR_1",
      orderedAt: "2026-09-02T00:00:00Z",
      status: "ordered",
      // Dòng PO thiếu `materialId`/`materialCode` ⇒ phải hiện «chưa có nguồn», KHÔNG bịa.
      items: [{ id: "POI_3", requestItemId: MRI_3, orderedQty: 5, receivedQty: 0, closedQty: 0 }],
    },
    {
      id: PO_3,
      poNo: "PO-2026-003",
      supplierId: SUP_B,
      supplierName: "Vật liệu Hà Nội",
      requestId: "MR_2",
      orderedAt: "2026-09-03T00:00:00Z",
      status: "ordered",
      items: [{ id: "POI_4", requestItemId: MRI_1, materialId: MAT_1, materialCode: "MAT-001", materialName: "Thép hộp 40x40", unit: "cây", orderedQty: 7, receivedQty: 0, closedQty: 0 }],
    },
  ],
  materials: [
    { id: MAT_1, code: "MAT-001", name: "Thép hộp 40x40", unit: "cây" },
    { id: MAT_2, code: "MAT-002", name: "Xi măng PCB40", unit: "bao" },
    { id: MAT_3, code: "MAT-003", name: "Cát vàng", unit: "m3" },
  ],
  requests: [
    { id: "MR_1", requestNo: "MR-2026-001", items: [{ id: MRI_1, materialId: MAT_1 }, { id: MRI_2, materialId: MAT_2 }, { id: MRI_3, materialId: MAT_3 }] },
    { id: "MR_2", requestNo: "MR-2026-002", items: [{ id: MRI_1, materialId: MAT_1 }] },
  ],
};

async function load() {
  assert.ok(existsSync(MODULE_PATH), `Thiếu tệp ${MODULE_PATH}`);
  const mod = await import(`../${MODULE_PATH}`);
  return mod;
}

// ── ① CHIỀU XUÔI: NHÀ CUNG CẤP → PO CỦA NCC ĐÓ ───────────────────────────────────────────────
test("① NCC → PO: lọc ĐÚNG PO theo `supplierId`, KHÔNG lẫn PO của NCC khác", async () => {
  const { supplierPurchaseOrders } = await load();
  const scoped = supplierPurchaseOrders(data, data.suppliers[0]);
  assert.equal(scoped.hasSource, true);
  assert.equal(scoped.matchedBy, "supplierId");
  assert.deepEqual(scoped.purchaseOrders.map((po) => po.id), [PO_1, PO_2]);
  assert.ok(!scoped.purchaseOrders.some((po) => po.id === PO_3), "KHÔNG được lẫn PO của NCC thứ hai");
});

test("①b NCC không có PO ⇒ vẫn có nguồn, danh sách RỖNG + lý do rõ", async () => {
  const { supplierPurchaseOrders } = await load();
  const scoped = supplierPurchaseOrders(data, data.suppliers[2]);
  assert.equal(scoped.hasSource, true);
  assert.equal(scoped.purchaseOrders.length, 0);
  assert.match(scoped.note, /CHƯA có PO/);
});

// ── ② CHIỀU XUÔI: PO → VẬT TƯ (dữ liệu THẬT của dòng PO) ────────────────────────────────────
test("② PO → Vật tư: lấy `materialCode`/`materialName` THẬT của dòng PO", async () => {
  const { purchaseOrderMaterialItems } = await load();
  const parsed = purchaseOrderMaterialItems(data.purchaseOrders[0]);
  assert.equal(parsed.hasSource, true);
  assert.equal(parsed.lines.length, 2);
  assert.equal(parsed.lines[0].materialCode, "MAT-001");
  assert.equal(parsed.lines[0].materialName, "Thép hộp 40x40");
  assert.equal(parsed.lines[0].materialId, MAT_1);
  assert.equal(parsed.lines[0].hasMaterialSource, true);
  assert.equal(parsed.lines[0].note, "");
});

test("②b Dòng PO thiếu nguồn vật tư ⇒ ĐÚNG chuỗi «chưa có nguồn» + LÝ DO (KHÔNG bịa)", async () => {
  const { purchaseOrderMaterialItems, NO_SOURCE_TEXT } = await load();
  assert.equal(NO_SOURCE_TEXT, "chưa có nguồn");
  const parsed = purchaseOrderMaterialItems(data.purchaseOrders[1]);
  assert.equal(parsed.lines.length, 1);
  assert.equal(parsed.lines[0].hasMaterialSource, false);
  assert.equal(parsed.lines[0].materialCode, NO_SOURCE_TEXT);
  assert.equal(parsed.lines[0].materialName, NO_SOURCE_TEXT);
  assert.match(parsed.lines[0].note, /thiếu `materialId`/);
  assert.equal(parsed.hasSource, false);
});

test("②c PO không kèm `items` ⇒ trả mảng rỗng + lý do «không kèm `items`»", async () => {
  const { purchaseOrderMaterialItems } = await load();
  const parsed = purchaseOrderMaterialItems({ id: PO_1, poNo: "PO-2026-001" });
  assert.equal(parsed.hasSource, false);
  assert.equal(parsed.lines.length, 0);
  assert.match(parsed.note, /items/);
});

// ── ③ CHUỖI ĐẦY ĐỦ: NCC → PO → VẬT TƯ ────────────────────────────────────────────────────────
test("③ Chuỗi NCC → PO → Vật tư: đếm đúng PO và dòng vật tư CÓ nguồn", async () => {
  const { supplierToPurchaseOrderChain } = await load();
  const chain = supplierToPurchaseOrderChain(data, data.suppliers[0]);
  assert.ok(chain);
  assert.equal(chain.supplierCode, "NCC-001");
  assert.equal(chain.purchaseOrders.length, 2);
  assert.equal(chain.materialLines.length, 3, "2 dòng PO-1 + 1 dòng PO-2");
  assert.equal(chain.sourcedMaterialCount, 2, "chỉ 2 dòng có `materialId` thật");
});

// ── ④ CHIỀU NGƯỢC: VẬT TƯ → PO → NHÀ CUNG CẤP ────────────────────────────────────────────────
test("④ Vật tư → PO: MAT-001 nằm trong PO-1 và PO-3; PO-2 không chứa ⇒ KHÔNG trả về", async () => {
  const { materialPurchaseOrders: materialPos } = await load();
  const scoped = materialPos(data, MAT_1);
  assert.equal(scoped.hasSource, true);
  assert.equal(scoped.matchedBy, "poItem.materialId");
  assert.deepEqual(scoped.purchaseOrders.map((po) => po.id).sort(), [PO_1, PO_3].sort());
});

test("④b Cầu nối dự phòng `requestItemId`: dòng PO KHÔNG có `materialId` vẫn truy được qua dòng PR", async () => {
  const { materialPurchaseOrders: materialPos } = await load();
  // MAT-3 ⇒ MRI_3 ⇒ POI_3 của PO_2 (dòng PO đó KHÔNG khai materialId) ⇒ phải tìm ra PO-2.
  const scoped = materialPos(data, MAT_3);
  assert.equal(scoped.hasSource, true);
  assert.equal(scoped.matchedBy, "requestItemId");
  assert.deepEqual(scoped.purchaseOrders.map((po) => po.id), [PO_2]);
  assert.match(scoped.note, /requestItemId/);
});

test("④c Vật tư chưa từng đặt ⇒ danh sách RỖNG + lý do, KHÔNG bịa PO", async () => {
  const { materialPurchaseOrders: materialPos } = await load();
  const scoped = materialPos(data, "MAT_khong-ton-tai");
  assert.equal(scoped.purchaseOrders.length, 0);
  assert.match(scoped.note, /CHƯA có PO/);
});

test("④d PO → NCC: khớp `supplierId`; payload cũ thiếu `supplierId` ⇒ lùi về TÊN NCC và GHI RÕ", async () => {
  const { purchaseOrderSupplier } = await load();
  const ok = purchaseOrderSupplier(data, data.purchaseOrders[0]);
  assert.equal(ok.hasSource, true);
  assert.equal(ok.matchedBy, "supplierId");
  assert.equal(ok.supplier.id, SUP_A);

  const legacy = purchaseOrderSupplier(data, { id: PO_1, supplierName: "Thép Nam Việt" });
  assert.equal(legacy.hasSource, true);
  assert.equal(legacy.matchedBy, "supplierName");
  assert.match(legacy.note, /TÊN NCC/);
});

test("④e PO có `supplierId` KHÔNG nằm trong danh mục ⇒ «chưa có nguồn» + lý do", async () => {
  const { purchaseOrderSupplier } = await load();
  const missing = purchaseOrderSupplier(data, { id: PO_1, supplierId: "SUP_khong-co" });
  assert.equal(missing.hasSource, false);
  assert.equal(missing.supplier, null);
  assert.match(missing.note, /KHÔNG có trong danh mục/);
});

// ── ⑤ BẢN ĐỒ ĐIỀU HƯỚNG (DAG) ───────────────────────────────────────────────────────────────
test("⑤ buildP08NavGraph: đủ 3 tầng + 2 loại cạnh, đếm khớp dữ liệu THẬT", async () => {
  const { buildP08NavGraph } = await load();
  const graph = buildP08NavGraph(data);
  assert.equal(graph.suppliers.length, 3);
  assert.equal(graph.purchaseOrders.length, 3);
  assert.equal(graph.materials.length, 3);
  assert.equal(graph.supplierPoEdges.length, 3, "PO-1+PO-2 (NCC A) + PO-3 (NCC B)");
  assert.equal(graph.poMaterialEdges.length, 3, "2 dòng PO-1 + 1 dòng PO-3");
  assert.equal(graph.linkedSupplierCount, 2, "NCC-003 chưa có PO");
  assert.equal(graph.poWithMaterialCount, 2, "PO-2 rỗng nguồn vật tư");
  assert.equal(graph.unsourcedPoLineCount, 1, "đúng 1 dòng PO thiếu nguồn");
  assert.ok(graph.notes.some((note) => note.includes("chưa có nguồn")), "phải có cảnh báo chưa có nguồn");
});

test("⑤b Payload THIẾU khoá ⇒ notes nói rõ từng tầng chưa có nguồn, KHÔNG ném lỗi", async () => {
  const { buildP08NavGraph } = await load();
  const graph = buildP08NavGraph({});
  assert.equal(graph.suppliers.length, 0);
  assert.equal(graph.supplierPoEdges.length, 0);
  assert.equal(graph.poMaterialEdges.length, 0);
  assert.equal(graph.notes.length, 3, "thiếu `suppliers` + `purchaseOrders` + `materials`");
  assert.ok(graph.notes.every((note) => note.includes("chưa có nguồn")));
});

test("⑤c `null`/`undefined` ⇒ graph rỗng, KHÔNG ném lỗi", async () => {
  const { buildP08NavGraph } = await load();
  for (const input of [null, undefined]) {
    const graph = buildP08NavGraph(input);
    assert.equal(graph.suppliers.length, 0);
    assert.equal(graph.purchaseOrders.length, 0);
    assert.equal(graph.materials.length, 0);
  }
});

// ── ⑥ NHÃN NÚT ĐIỀU HƯỚNG ───────────────────────────────────────────────────────────────────
test("⑥ Nhãn nút «NCC → PO» / «PO → Vật tư» / «Vật tư → PO» dùng số THẬT", async () => {
  const { buildP08NavGraph, supplierNavLabel, poNavLabel, materialNavLabel } = await load();
  const graph = buildP08NavGraph(data);
  const label = supplierNavLabel(graph.suppliers[0]);
  assert.equal(label.hasSource, true);
  assert.match(label.label, /NCC-001 · Thép Nam Việt — 2 PO/);

  const poLabel = poNavLabel(data.purchaseOrders[0]);
  assert.equal(poLabel.hasSource, true);
  assert.match(poLabel.label, /PO-2026-001 — 2 dòng · 2 vật tư/);

  const poLabel2 = poNavLabel(data.purchaseOrders[1]);
  assert.equal(poLabel2.hasSource, false, "PO-2 thiếu nguồn vật tư");
  assert.match(poLabel2.label, /chưa có nguồn/);

  const matLabel = materialNavLabel(data.materials[0], poRowsForMaterial(graph, MAT_1));
  assert.equal(matLabel.hasSource, true);
  assert.match(matLabel.label, /MAT-001 · Thép hộp 40x40 — 2 PO/);

  const noPo = supplierNavLabel(graph.suppliers[2]);
  assert.equal(noPo.hasSource, false);
  assert.match(noPo.label, /chưa có nguồn PO/);
});

function poRowsForMaterial(graph, materialId) {
  const poIds = new Set(graph.poMaterialEdges.filter((edge) => edge.materialId === materialId).map((edge) => edge.purchaseOrderId));
  return graph.purchaseOrders.filter((po) => poIds.has(po.id));
}

// ── ⑦ KỶ LUẬT: HÀM THUẦN · KHÔNG DB · KHÔNG KHOÁ MỚI · KHÔNG DDL/DML ────────────────────────
test("⑦ Module là HÀM THUẦN: 0 `import`, 0 DB, 0 `module_catalog`, 0 khoá module mới", async () => {
  const source = readFileSync(MODULE_PATH, "utf8");
  const code = source.replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
  assert.ok(!/\bimport\b/.test(code), "KHÔNG được import gì (hàm thuần, dễ test offline)");
  assert.ok(!/require\(/.test(code), "KHÔNG dùng `require`");
  assert.ok(!/\b(mysql|jdbcTemplate|fetch\(|axios|XMLHttpRequest)\b/.test(code), "KHÔNG chạm DB/HTTP");
  assert.ok(!/\b(INSERT|UPDATE|DELETE|ALTER|DROP|TRUNCATE)\b/.test(code), "KHÔNG DDL/DML");
  assert.ok(!/module_catalog/.test(code), "KHÔNG chạm `module_catalog`");
  assert.ok(!/MenuKey|ModuleKey/.test(code), "KHÔNG khai khoá module mới");
});

test("⑦b Không tệp `drizzle/**` nào nhắc tới điều hướng `P-08` (không migration mới)", async () => {
  const { execSync } = await import("node:child_process");
  const out = execSync('git grep -l "p08-nav-trace" -- drizzle || echo ""', { encoding: "utf8" }).trim();
  assert.equal(out.replace(/^"|"$/g, ""), "", "KHÔNG được có tham chiếu `p08-nav-trace` trong `drizzle/**`");
});
