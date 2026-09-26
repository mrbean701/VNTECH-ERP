// PHASE 2 (`P-08`) — KHỐI **MENU / ĐIỀU HƯỚNG** «Nhà cung cấp ↔ PO ↔ Vật tư» TRONG MÀN CHI TIẾT PO.
//
// NGUYÊN VĂN YÊU CẦU (`docs/25_TODO_ROADMAP.md` dòng `P-08`): «Liên kết Supplier ↔ MR/PR/PO ↔ Material».
// TRUY VẾT DỮ LIỆU đã xong 15/15 cặp · 0 mồ côi (`tools/p2-reference-integrity.mjs`) ⇒ phần CÒN THIẾU là
// **MENU / ĐIỀU HƯỚNG**. Khối này chính là phần đó — TÁCH RA TỆP RIÊNG để:
//   1) `PurchaseOrderDrawer.tsx` chỉ cần THÊM 1 import + 1 dòng JSX (đúng ràng buộc «vài dòng»);
//   2) toàn bộ LOGIC nằm ở hàm THUẦN `lib/p08-nav-trace.ts` (đã có test `tests/p08-supplier-po-material.test.mjs`).
//
// ⚠️ KHÔNG BỊA DỮ LIỆU: mọi giá trị lấy từ payload (`data.suppliers` · `data.purchaseOrders` · `data.materials`
// · `data.requests`) qua hàm thuần. Thiếu nguồn ⇒ hiện ĐÚNG chuỗi «chưa có nguồn» + LÝ DO, KHÔNG suy diễn.
// ⛔ KHÔNG action/API mới · ⛔ KHÔNG khoá `module_catalog` · ⛔ KHÔNG migration · ⛔ KHÔNG DDL/DML.

import {
  NO_SOURCE_TEXT,
  materialNavLabel,
  purchaseOrderMaterialItems,
  purchaseOrderSupplier,
  supplierPurchaseOrders,
} from "@/lib/p08-nav-trace";
import type { Row } from "@/lib/ui-shared";
import { format } from "@/lib/ui-shared";
import type { P08Data } from "@/lib/p08-nav-trace";

function P08PoNavigation({ data: appData, purchaseOrder }: { data: Row; purchaseOrder: Row }) {
  // `P08Data` chỉ cần 4 khoá của payload — `AppData` có thừa khoá nên phải gán tường minh
  // (gán trực tiếp vào tham số sẽ bị kiểm tra «excess property» của TypeScript).
  const data: P08Data = {
    suppliers: appData.suppliers as Row[],
    purchaseOrders: appData.purchaseOrders as Row[],
    materials: appData.materials as Row[],
    requests: appData.requests as Row[],
  };
  const parsed = purchaseOrderMaterialItems(purchaseOrder);
  const supplierLink = purchaseOrderSupplier(data, purchaseOrder);
  const supplier = supplierLink.supplier;
  const scoped = supplier ? supplierPurchaseOrders(data, supplier) : null;

  return (
    <section className="drawer-section po-nav-trace" data-vntech="p08-po-nav-trace">
      <div className="card-head">
        <div>
          <h2>Điều hướng Nhà cung cấp ↔ PO ↔ Vật tư</h2>
          <p>
            Menu điều hướng dựng từ dữ liệu thật của payload — không nội suy, không khoá module mới.
            {" "}
            {parsed.lines.length} dòng PO · {parsed.lines.filter((line) => line.hasMaterialSource).length} dòng nối được vật tư.
          </p>
        </div>
      </div>

      {/* CHIỀU NGƯỢC: PO → NHÀ CUNG CẤP (+ các PO khác của CÙNG nhà cung cấp đó) */}
      <div className="summary-grid request-summary" data-vntech="p08-po-to-supplier">
        <div>
          <small>Nhà cung cấp của PO</small>
          {supplierLink.hasSource && supplier ? (
            <strong>{String(supplier.code || supplier.id)} · {String(supplier.name || NO_SOURCE_TEXT)}</strong>
          ) : (
            <strong>{NO_SOURCE_TEXT}</strong>
          )}
        </div>
        <div>
          <small>Đối chiếu theo</small>
          <strong>{supplierLink.matchedBy === "supplierId" ? "supplier_id" : supplierLink.matchedBy === "supplierName" ? "supplier_name" : "—"}</strong>
        </div>
        <div>
          <small>PO khác của NCC này</small>
          {scoped && scoped.hasSource ? (
            <strong data-vntech="p08-supplier-po-count">{scoped.purchaseOrders.length} PO</strong>
          ) : (
            <strong>{NO_SOURCE_TEXT}</strong>
          )}
        </div>
      </div>
      {supplierLink.note && <p className="vt-timeline-note" data-vntech="p08-supplier-note">{supplierLink.note}</p>}
      {scoped && scoped.hasSource && scoped.purchaseOrders.length > 1 && (
        <p className="vt-timeline-note" data-vntech="p08-supplier-po-list">
          Đi ngang sang PO cùng nhà cung cấp:{" "}
          {scoped.purchaseOrders
            .map((po: Row) => String(po.poNo || po.id))
            .filter((label: string) => label !== String(purchaseOrder.poNo || purchaseOrder.id))
            .join(" · ") || "(không còn PO nào khác)"}
        </p>
      )}

      {/* CHIỀU XUÔI: PO → VẬT TƯ (mã/tên vật tư THẬT của từng dòng PO) */}
      <div className="table-wrap" data-vntech="p08-po-to-material">
        {parsed.lines.length ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Dòng PO</th>
                <th>Mã vật tư</th>
                <th>Tên vật tư</th>
                <th>ĐVT</th>
                <th>Dòng PR nối sang</th>
                <th>SL đặt</th>
                <th>Nguồn vật tư</th>
              </tr>
            </thead>
            <tbody>
              {parsed.lines.map((line, index) => (
                <tr key={String(line.item.id || index)} data-vntech="p08-material-row">
                  <td>{String(line.item.lineNo ?? index + 1)}</td>
                  <td>
                    {line.hasMaterialSource ? <strong className="code">{line.materialCode}</strong> : <span className="red-text">{line.materialCode}</span>}
                  </td>
                  <td>{line.materialName}</td>
                  <td>{String(line.item.unit || NO_SOURCE_TEXT)}</td>
                  <td>{line.item.requestItemId ? <code>{String(line.item.requestItemId)}</code> : NO_SOURCE_TEXT}</td>
                  <td>{format.format(Number(line.item.orderedQty || 0))}</td>
                  <td>{line.hasMaterialSource ? "có nguồn" : line.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="inline-alert" data-vntech="p08-po-to-material-nosource">
            <b>{NO_SOURCE_TEXT} vật tư.</b> {parsed.note} UI KHÔNG nội suy dòng vật tư thay cho dữ liệu thiếu.
          </div>
        )}
      </div>
      {parsed.lines.length > 0 && !parsed.hasSource && (
        <div className="inline-alert danger" data-vntech="p08-po-to-material-note">
          <b>⚠ {NO_SOURCE_TEXT} vật tư cho mọi dòng PO.</b> {parsed.note}
        </div>
      )}
      {/* Nhãn điều hướng dùng chung hàm thuần — hiện số THẬT, thiếu nguồn thì nói rõ lý do. */}
      <p className="vt-timeline-note" data-vntech="p08-nav-labels">
        {supplier ? materialNavLabel(supplier, scoped?.purchaseOrders || []).label : NO_SOURCE_TEXT}
      </p>
    </section>
  );
}

export { P08PoNavigation };
