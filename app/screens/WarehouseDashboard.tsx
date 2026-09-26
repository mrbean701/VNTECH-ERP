// PHASE 5 (`W-04`) — DASHBOARD TỒN KHO: ĐỦ 8 CHỈ SỐ THEO §19.
// Nguyên văn `docs/25_TODO_ROADMAP.md` dòng `W-04`: «Dashboard tồn kho: tổng · khả dụng · giữ chỗ · nhập · xuất ·
// chờ chuyển · sắp hết · giá trị kho (§19)».
//
// NGUYÊN TẮC SỐ LIỆU (bắt buộc — đúng khuôn `T-08`):
//   • MỌI số ở đây tính từ dữ liệu ĐANG CÓ trong payload (`inventory` · `warehouses` · `materials` · `receipts` ·
//     `issues` · `transferOrders`) — **KHÔNG gọi API mới, KHÔNG thêm bảng, KHÔNG migration**.
//   • KHÔNG BỊA SỐ. Cột nào KHÔNG có nguồn trong payload thì UI ghi «chưa có nguồn» kèm LÝ DO, KHÔNG hiện 0.
//   • Nguồn đã ĐO bằng payload THẬT (`GET /api/system` trên Java 18081) + `scripts/system-route.mjs`:
//       `inventory[]`  : projectId · projectCode · warehouseId · warehouseCode · warehouseName · type ·
//                        materialId · materialCode · materialName · unit · minStock · balance · reserved · available
//                        (`:651` — balance = Σ stock_movements, reserved = Σ stock_reservations status='active')
//       `receipts[]`   : acceptedQty · actualDeliveredQty · rejectedQty (`:661`, từ `goods_receipt_items`)
//       `issues[]`     : totalQty · installedQty · itemCount (`:671`)
//       `transferOrders[]`: status · requestedQty · shippedQty · receivedQty (`:673`)
//       `warehouses[]` : id · code · name · type · projectId · projectCode (`:644`)
//       `materials[]`  : standardPrice (giá CHUẨN của danh mục — KHÔNG phải giá vốn)
//
//   ⚠️ «GIÁ TRỊ KHO» — ĐỐI CHỨNG ÂM (điểm dễ bịa số nhất, xem `INVENTORY_VALUE_NO_SOURCE_NOTE`):
//     Giá vốn thật chỉ nằm ở `stock_movements.unit_cost`, nhưng bootstrap **KHÔNG trả khoá `stockMovements`**
//     (đã đo: payload chỉ có `stockCounts`/`contractStockLedger`/`contractStockBalances`/`stockReconciliations`),
//     và trên dữ liệu thật `stock_movements.unit_cost` đang **= 0 cho mọi dòng** ⇒ kể cả có khoá cũng ra 0 ĐÚNG
//     nghĩa "0 đồng" mà là "chưa được ghi giá". Vì vậy:
//       – «Giá trị kho» (giá vốn) = **«chưa có nguồn»** + lý do, KHÔNG lấy `purchase_order_items.unitPrice`
//         thay thế (cột đó đang = 0 trên dữ liệu thật ⇒ sẽ in "0 đ" SAI).
//       – Kèm chỉ số PHỤ «Giá trị theo giá chuẩn danh mục» = Σ(balance × `materials.standardPrice`), CHỈ trên các
//         dòng có `standardPrice` > 0, và nói rõ **đây KHÔNG phải giá vốn**.
//
// VÌ SAO TÁCH RA TỆP RIÊNG: tab «Dashboard tồn kho» là MỘT MỤC MENU ĐÃ CHỐT của `W-01`; khối này chỉ THÊM
// NỘI DUNG cho tab đó trong màn Tồn kho (`app/screens/Inventory.tsx`). Khối thuần nằm giữa hai mốc để test
// TRÍCH RA và CHẠY THẬT trên fixtures.

import { CardHead, Kpi, NavIcon } from "@/lib/ui-shared";
import type { AppData, Row } from "@/lib/ui-shared";

// -------------------------------------------------------------------------------------------------
// W04-PURE-BEGIN
// KHỐI THUẦN (không JSX, không import) — test `tests/w04-inventory-dashboard.test.mjs` TRÍCH RA và CHẠY THẬT.
// -------------------------------------------------------------------------------------------------

// TÁM CHỈ SỐ của §19 — đúng thứ tự nguyên văn yêu cầu, mỗi chỉ số khai NGUỒN THẬT của nó.
const INVENTORY_METRICS = [
  { key: "total", label: "Tổng tồn", source: "inventory[].balance — Σ nhập − Σ xuất theo stock_movements (bootstrap :651)" },
  { key: "available", label: "Khả dụng", source: "inventory[].available — tồn trừ giữ chỗ (balance − reserved)" },
  { key: "reserved", label: "Giữ chỗ", source: "inventory[].reserved — Σ stock_reservations WHERE status='active'" },
  { key: "inbound", label: "Nhập", source: "receipts[].acceptedQty — goods_receipt_items (bootstrap :661)" },
  { key: "outbound", label: "Xuất", source: "issues[].totalQty — stock_issues (bootstrap :671)" },
  { key: "pendingTransfer", label: "Chờ chuyển", source: "transferOrders[] chưa received/cancelled (bootstrap :673)" },
  { key: "lowStock", label: "Sắp hết", source: "inventory[] có minStock > 0 và available < minStock" },
  { key: "value", label: "Giá trị kho", source: "stock_movements.unit_cost — CHƯA có trong payload (xem lý do)" },
];
// Nhãn DÙNG CHUNG cho mọi trường hợp "không có nguồn" (khớp `DASHBOARD_NO_SOURCE` của `T-08`).
const INVENTORY_NO_SOURCE = "chưa có nguồn";
// LÝ DO cụ thể — bắt buộc in ra UI, không được để người dùng tự đoán.
const INVENTORY_VALUE_NO_SOURCE_NOTE = `Giá vốn thật chỉ có ở stock_movements.unit_cost, nhưng payload bootstrap KHÔNG trả khoá stockMovements (và mọi dòng stock_movements.unit_cost trên CSDL hiện đang = 0 ⇒ có đọc cũng KHÔNG phải giá vốn thật). Vì vậy KHÔNG hiện số ở đây thay vì bịa hoặc lấy unitPrice của PO (đang = 0).`;
// Trạng thái đóng của phiếu điều chuyển — nguyên văn điều kiện đang dùng ở màn Tồn kho cũ.
const INVENTORY_TRANSFER_CLOSED = ["received", "cancelled"];
const INVENTORY_NO_PROJECT_SCOPE = "Tất cả dự án được phân quyền";

/** Tình trạng NGUỒN của một tập giá trị: 0 dòng và cột rỗng là hai chuyện KHÁC NHAU, cả hai đều KHÔNG được hiện 0. */
function inventorySourceOf(rows: Row[], field: string, label: string) {
  const list = rows || [];
  if (!list.length) return `${INVENTORY_NO_SOURCE} — ${label}: 0 dòng trong phạm vi`;
  const known = list.filter((row) => row && row[field] !== undefined && row[field] !== null && String(row[field]) !== "");
  return known.length
    ? `${label} · ${known.length}/${list.length} dòng có giá trị`
    : `${INVENTORY_NO_SOURCE} — ${label} rỗng trong payload`;
}
const inventoryNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * DỰNG SỐ LIỆU 8 CHỈ SỐ từ payload. `projectScope` = "ALL" hoặc id dự án (đúng cách màn Tồn kho cũ lọc).
 * Mọi phép tính đều trên DÒNG THẬT; không có hằng số nào thay cho dữ liệu.
 */
function warehouseDashboard(data: AppData, projectScope: string) {
  const allInventory: Row[] = data.inventory || [];
  const inScope = (row: Row) => projectScope === "ALL" || String(row.projectId || "") === String(projectScope);
  const rows = allInventory.filter(inScope);
  const warehouses: Row[] = (data.warehouses || []).filter((row) => projectScope === "ALL" || String(row.projectId || "") === String(projectScope));
  const materials: Row[] = data.materials || [];
  const receipts: Row[] = (data.receipts || []).filter((row) => projectScope === "ALL" || String(row.projectId || "") === String(projectScope));
  const issues: Row[] = (data.issues || []).filter((row) => projectScope === "ALL" || String(row.projectId || "") === String(projectScope));
  const transfers: Row[] = (data.transferOrders || []).filter((row) => projectScope === "ALL"
    || String(row.sourceProjectId || "") === String(projectScope)
    || String(row.destinationProjectId || "") === String(projectScope));
  const pendingTransfers = transfers.filter((row) => !INVENTORY_TRANSFER_CLOSED.includes(String(row.status || "")));

  const total = rows.reduce((sum, row) => sum + inventoryNumber(row.balance), 0);
  const available = rows.reduce((sum, row) => sum + inventoryNumber(row.available ?? row.balance), 0);
  const reserved = rows.reduce((sum, row) => sum + inventoryNumber(row.reserved), 0);
  const inbound = receipts.reduce((sum, row) => sum + inventoryNumber(row.acceptedQty ?? row.actualDeliveredQty), 0);
  const outbound = issues.reduce((sum, row) => sum + inventoryNumber(row.totalQty), 0);
  // «Sắp hết» chỉ tính dòng CÓ cấu hình tồn tối thiểu (minStock > 0) — minStock = 0 nghĩa là "chưa đặt mức", không phải "hết".
  const lowRows = rows.filter((row) => inventoryNumber(row.minStock) > 0 && inventoryNumber(row.available ?? row.balance) < inventoryNumber(row.minStock));

  // ── GIÁ TRỊ KHO ────────────────────────────────────────────────────────────────────────────────
  // (a) Giá vốn theo sổ: KHÔNG có nguồn trong payload ⇒ null + lý do. KHÔNG suy diễn bằng cột khác.
  //     `stockMovements` KHÔNG thuộc `AppData` (bootstrap không trả) — khai tại chỗ để tsc vẫn kiểm được kiểu.
  const movements: Row[] = (data as AppData & { stockMovements?: Row[] }).stockMovements || [];
  const ledgerValue = movements.length
    ? movements.reduce((sum, movement) => sum + inventoryNumber(movement.quantity) * inventoryNumber(movement.unitCost), 0)
    : null;
  const priceByMaterial = new Map(materials.map((material) => [String(material.id), material]));
  const priced = rows.map((row) => {
    const material = priceByMaterial.get(String(row.materialId)) || null;
    const standardPrice = material ? inventoryNumber(material.standardPrice) : 0;
    return { row, standardPrice };
  }).filter((entry) => entry.standardPrice > 0);
  const standardPriceValue = priced.length
    ? priced.reduce((sum, entry) => sum + inventoryNumber(entry.row.balance) * entry.standardPrice, 0)
    : null;

  // Bảng theo kho — số liệu THẬT trên từng dòng, không nội suy.
  const byWarehouse = warehouses.map((warehouse) => {
    const own = rows.filter((row) => String(row.warehouseId) === String(warehouse.id));
    return {
      id: warehouse.id, code: warehouse.code, name: warehouse.name, type: warehouse.type,
      projectCode: warehouse.projectCode || "",
      balance: own.reduce((sum, row) => sum + inventoryNumber(row.balance), 0),
      reserved: own.reduce((sum, row) => sum + inventoryNumber(row.reserved), 0),
      available: own.reduce((sum, row) => sum + inventoryNumber(row.available ?? row.balance), 0),
      lines: own.length,
    };
  }).sort((a, b) => b.balance - a.balance);

  return {
    rows,
    byWarehouse,
    lowRows,
    warehouseCount: warehouses.length,
    total, available, reserved, inbound, outbound,
    transfers: { total: transfers.length, pending: pendingTransfers.length, rows: pendingTransfers },
    lowStock: lowRows.length,
    zeroBalanceOnly: rows.length > 0 && rows.every((row) => inventoryNumber(row.balance) === 0),
    value: {
      ledgerValue,
      source: ledgerValue === null ? `${INVENTORY_NO_SOURCE} — payload KHÔNG trả khoá stockMovements` : "stockMovements[].quantity × unitCost",
      note: INVENTORY_VALUE_NO_SOURCE_NOTE,
      standardPriceValue,
      standardPriceSource: standardPriceValue === null
        ? `${INVENTORY_NO_SOURCE} — materials.standardPrice rỗng/không dòng tồn nào có giá`
        : `materials.standardPrice × inventory[].balance · ${priced.length}/${rows.length || 0} dòng có giá`,
      standardPriceNote: "Giá trị theo GIÁ CHUẨN của danh mục vật tư — đây KHÔNG phải giá vốn thực tế (giá vốn cần stock_movements.unit_cost).",
    },
    totalSource: inventorySourceOf(rows, "balance", "inventory[].balance"),
    availableSource: inventorySourceOf(rows, "available", "inventory[].available"),
    reservedSource: inventorySourceOf(rows, "reserved", "inventory[].reserved"),
    inboundSource: inventorySourceOf(receipts, "acceptedQty", "receipts[].acceptedQty"),
    outboundSource: inventorySourceOf(issues, "totalQty", "issues[].totalQty"),
    transferSource: inventorySourceOf(transfers, "status", "transferOrders[].status"),
    lowStockSource: inventorySourceOf(rows, "minStock", "inventory[].minStock"),
  };
}
// W04-PURE-END

function WarehouseDashboard({ data, project }: { data: AppData; project: string }) {
  const metrics = warehouseDashboard(data, project);
  const scopeLabel = project === "ALL"
    ? INVENTORY_NO_PROJECT_SCOPE
    : (data.projects || []).find((row) => String(row.id) === String(project))?.code || String(project);
  const money = (value: number | null) => value === null ? INVENTORY_NO_SOURCE : `${Math.round(value).toLocaleString("vi-VN")} đ`;
  const quantity = (value: number) => Math.round(value).toLocaleString("vi-VN");
  const valueTone = metrics.value.ledgerValue === null ? "amber" : "green";

  return <div className="stack" data-dashboard-block="inventory">
    <section className="card">
      <CardHead title="DASHBOARD TỒN KHO"
        note={`Phạm vi: ${scopeLabel} · ${metrics.warehouseCount} kho · ${metrics.rows.length} dòng tồn theo (kho × vật tư). Mọi số tính TRỰC TIẾP từ dữ liệu đang có trong payload — không gọi API mới.`}/>
      <div className="kpi-grid small">
        <div data-inventory-metric="total"><Kpi icon="TC" label="Tổng tồn" value={String(metrics.total)} note={`Σ balance trên ${metrics.rows.length} dòng tồn (On hand)`} tone="blue"/></div>
        <div data-inventory-metric="available"><Kpi icon="KD" label="Khả dụng" value={String(metrics.available)} note="Tồn trừ phần đã giữ chỗ — dùng được để cấp phát" tone="green"/></div>
        <div data-inventory-metric="reserved"><Kpi icon="GC" label="Giữ chỗ" value={String(metrics.reserved)} note="Đang bị giữ cho phiếu đề nghị (stock_reservations)" tone="violet"/></div>
        <div data-inventory-metric="inbound"><Kpi icon="NK" label="Nhập" value={String(metrics.inbound)} note={`Σ acceptedQty trên ${(data.receipts || []).length} phiếu nhập trong phạm vi`} tone="blue"/></div>
        <div data-inventory-metric="outbound"><Kpi icon="XK" label="Xuất" value={String(metrics.outbound)} note={`Σ totalQty trên ${(data.issues || []).length} phiếu xuất trong phạm vi`} tone="amber"/></div>
        <div data-inventory-metric="pendingTransfer"><Kpi icon="DC" label="Chờ chuyển" value={String(metrics.transfers.pending)} note={`${metrics.transfers.rows.length} phiếu điều chuyển chưa nhận/xuất — trên tổng ${metrics.transfers.total} phiếu`} tone="violet"/></div>
        <div data-inventory-metric="lowStock"><Kpi icon="SH" label="Sắp hết" value={String(metrics.lowStock)} note="Số dòng có mức tồn tối thiểu và tồn khả dụng ĐANG dưới mức đó" tone="red"/></div>
        <div data-inventory-metric="value"><Kpi icon="GT" label="Giá trị kho" value={metrics.value.ledgerValue === null ? INVENTORY_NO_SOURCE : money(metrics.value.ledgerValue)}
          note={metrics.value.ledgerValue === null ? metrics.value.note : "Σ quantity × unit_cost từ stock_movements"} tone={valueTone}/></div>
      </div>
      <p className="muted" data-inventory-source="eight-metrics">Nguồn 8 chỉ số: tổng/khả dụng/giữ chỗ/sắp hết → `inventory[]`; nhập → `receipts[].acceptedQty`; xuất → `issues[].totalQty`; chờ chuyển → `transferOrders[].status`; giá trị kho → `stock_movements.unit_cost` ({metrics.value.source}).</p>
    </section>

    <section className="card">
      <CardHead title="Giá trị kho — vì sao có ô «chưa có nguồn»" note="Đối chứng âm: KHÔNG bịa số khi thiếu nguồn (đúng khuôn T-08)."/>
      <div className="simple-list">
        <div><span className="doc-icon"><NavIcon name="inventory"/></span><div>
          <strong>Giá vốn theo sổ kho: {metrics.value.ledgerValue === null ? INVENTORY_NO_SOURCE : money(metrics.value.ledgerValue)}</strong>
          <p>{metrics.value.note}</p>
        </div></div>
        <div><span className="doc-icon"><NavIcon name="material_catalog"/></span><div>
          <strong>Giá trị theo giá chuẩn danh mục: {money(metrics.value.standardPriceValue)}</strong>
          <p>{metrics.value.standardPriceSource} — {metrics.value.standardPriceNote}</p>
        </div></div>
      </div>
    </section>

    <section className="card">
      <CardHead title="Tồn kho theo từng kho" note={`${metrics.byWarehouse.length} kho trong phạm vi — mỗi dự án có thể có NHIỀU kho (W-02 đã xác nhận quan hệ Project : Warehouse là 1:N).`}/>
      <div className="table-wrap"><table className="baseline-table"><thead><tr><th>Mã kho</th><th>Tên kho</th><th>Dự án</th><th>Loại</th><th>Tồn</th><th>Giữ chỗ</th><th>Khả dụng</th><th>Dòng tồn</th></tr></thead><tbody>
        {metrics.byWarehouse.map((warehouse) => <tr key={String(warehouse.id)}>
          <td><strong className="code">{warehouse.code}</strong></td>
          <td>{warehouse.name}</td>
          <td>{warehouse.projectCode || "Kho Tổng"}</td>
          <td>{warehouse.type === "central" ? "Kho Tổng" : warehouse.type === "team" ? "Kho tổ đội" : warehouse.type === "transit" ? "Trung chuyển" : "Kho dự án"}</td>
          <td><strong>{quantity(warehouse.balance)}</strong></td>
          <td>{quantity(warehouse.reserved)}</td>
          <td>{quantity(warehouse.available)}</td>
          <td>{warehouse.lines}</td>
        </tr>)}
        {!metrics.byWarehouse.length && <tr><td colSpan={8}>{INVENTORY_NO_SOURCE} — không có kho nào trong phạm vi</td></tr>}
      </tbody></table></div>
      <p className="muted" data-inventory-source="by-warehouse">Nguồn: `warehouses[]` (id · code · name · type · projectId · projectCode) ghép `inventory[].warehouseId`.</p>
    </section>

    <section className="card">
      <CardHead title={`Vật tư dưới mức tồn tối thiểu (${metrics.lowStock})`} note="Chỉ tính dòng CÓ cấu hình mức tối thiểu (minStock > 0) — mức 0 nghĩa là 'chưa đặt', KHÔNG phải 'đã hết'."/>
      <div className="table-wrap"><table className="baseline-table"><thead><tr><th>Mã vật tư</th><th>Tên vật tư</th><th>Kho</th><th>Tồn khả dụng</th><th>Mức tối thiểu</th><th>Thiếu</th></tr></thead><tbody>
        {metrics.lowRows.map((row, index) => <tr key={String(`${row.warehouseId}-${row.materialId}-${index}`)}>
          <td><strong className="code">{row.materialCode}</strong></td>
          <td>{row.materialName}</td>
          <td>{row.warehouseCode || row.warehouseName || "—"}</td>
          <td><strong className="red-text">{quantity(inventoryNumber(row.available ?? row.balance))}</strong></td>
          <td>{quantity(inventoryNumber(row.minStock))}</td>
          <td>{quantity(Math.max(0, inventoryNumber(row.minStock) - inventoryNumber(row.available ?? row.balance)))}</td>
        </tr>)}
        {!metrics.lowRows.length && <tr><td colSpan={6}>Không có dòng nào dưới mức tồn tối thiểu ({metrics.lowStockSource})</td></tr>}
      </tbody></table></div>
    </section>

    <section className="card">
      <CardHead title="Nguồn dữ liệu của từng chỉ số" note="In rõ nguồn + số dòng THẬT: phân biệt «0 dòng» với «cột rỗng trong payload» — cả hai đều KHÔNG được hiện 0."/>
      <div className="simple-list">
        <div><div><strong>Tổng tồn</strong><p>{metrics.totalSource}</p></div></div>
        <div><div><strong>Khả dụng</strong><p>{metrics.availableSource}</p></div></div>
        <div><div><strong>Giữ chỗ</strong><p>{metrics.reservedSource}</p></div></div>
        <div><div><strong>Nhập</strong><p>{metrics.inboundSource}</p></div></div>
        <div><div><strong>Xuất</strong><p>{metrics.outboundSource}</p></div></div>
        <div><div><strong>Chờ chuyển</strong><p>{metrics.transferSource}</p></div></div>
        <div><div><strong>Sắp hết</strong><p>{metrics.lowStockSource}</p></div></div>
        <div><div><strong>Giá trị kho</strong><p>{metrics.value.source}</p></div></div>
      </div>
    </section>
  </div>;
}

export {
  INVENTORY_METRICS,
  INVENTORY_NO_SOURCE,
  INVENTORY_VALUE_NO_SOURCE_NOTE,
  WarehouseDashboard,
  inventorySourceOf,
  warehouseDashboard,
};
