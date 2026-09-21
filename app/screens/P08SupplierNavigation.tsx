// PHASE 2 (`P-08`) — KHỐI **MENU / ĐIỀU HƯỚNG** «Nhà cung cấp → PO của NCC đó → Vật tư» TRÊN MÀN NCC.
//
// NGUYÊN VĂN YÊU CẦU (`docs/25_TODO_ROADMAP.md` dòng `P-08`): «Liên kết Supplier ↔ MR/PR/PO ↔ Material».
// TRUY VẾT DỮ LIỆU đã xong 15/15 cặp · 0 mồ côi (`tools/p2-reference-integrity.mjs`) ⇒ phần CÒN THIẾU là
// **MENU / ĐIỀU HƯỚNG** — đây chính là phần đó: mỗi NCC có nút mở ĐÚNG PO của NCC ấy (mở màn chi tiết PO
// bằng `open("poDetail", po)` — màn đã có sẵn, KHÔNG route mới, KHÔNG khoá module mới).
//
// ⚠️ KHÔNG BỊA: mọi số liệu lấy từ `lib/p08-nav-trace.ts` (hàm THUẦN, đã có test riêng). NCC chưa có PO ⇒
// hiện ĐÚNG chuỗi «chưa có nguồn» + lý do; dòng PO thiếu `materialId` KHÔNG bị đếm là «nối được vật tư».
// ⛔ KHÔNG action/API mới · ⛔ KHÔNG `module_catalog` · ⛔ KHÔNG migration · ⛔ KHÔNG DDL/DML.

import { NO_SOURCE_TEXT, buildP08NavGraph, supplierToPurchaseOrderChain } from "@/lib/p08-nav-trace";
import type { P08Data, SupplierNav } from "@/lib/p08-nav-trace";
import { CardHead, Empty, format } from "@/lib/ui-shared";
import type { AppData, Row } from "@/lib/ui-shared";

function P08SupplierNavigation({ data: appData, open }: { data: AppData; open: (name: string, row?: Row) => void }) {
  // Chỉ lấy 4 khoá payload mà `P-08` cần (KHÔNG đọc thêm gì của `AppData`).
  const data: P08Data = {
    suppliers: appData.suppliers as Row[],
    purchaseOrders: appData.purchaseOrders as Row[],
    materials: appData.materials as Row[],
    requests: appData.requests as Row[],
  };
  const graph = buildP08NavGraph(data);
  const suppliers: Row[] = Array.isArray(appData.suppliers) ? appData.suppliers : [];

  return (
    <section className="card" data-vntech="p08-supplier-nav">
      <CardHead
        title="Điều hướng Nhà cung cấp → PO → Vật tư"
        note={`Liên kết dựng từ dữ liệu thật: ${graph.supplierPoEdges.length} cạnh NCC → PO · ${graph.poMaterialEdges.length} cạnh PO → Vật tư (trên ${graph.purchaseOrders.length} PO). Thiếu nguồn thì hiện «${NO_SOURCE_TEXT}», không nội suy.`}
      />
      {!suppliers.length ? (
        <Empty text="Chưa có Nhà cung cấp trong payload nên chưa dựng được điều hướng NCC → PO." />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Mã NCC</th>
                <th>Tên nhà cung cấp</th>
                <th>PO của NCC này</th>
                <th>Dòng vật tư nối được</th>
                <th>Đối chiếu theo</th>
                <th>Điều hướng</th>
              </tr>
            </thead>
            <tbody>
              {graph.suppliers.map((nav: SupplierNav) => {
                const code = String((nav.supplier as Row).code || "");
                const chain = code ? supplierToPurchaseOrderChain(data, nav.supplier) : null;
                const firstPo = chain && chain.purchaseOrders.length ? chain.purchaseOrders[0] : null;
                return (
                  <tr key={String((nav.supplier as Row).id || nav.code)} data-vntech="p08-supplier-row">
                    <td>
                      <strong className="code">{nav.code}</strong>
                    </td>
                    <td>{nav.name}</td>
                    <td data-vntech="p08-supplier-po-cell">
                      {nav.hasSource ? (
                        <strong className={nav.purchaseOrderCount > 0 ? "green-text" : ""}>{format.format(nav.purchaseOrderCount)} PO</strong>
                      ) : (
                        <span className="red-text">{NO_SOURCE_TEXT}</span>
                      )}
                    </td>
                    <td data-vntech="p08-supplier-material-cell">
                      {nav.hasSource ? format.format(nav.sourceableMaterialCount) : NO_SOURCE_TEXT}
                    </td>
                    <td>
                      {nav.purchaseOrderCount > 0 ? (
                        <span>{chain?.matchedBy === "supplierName" ? "supplier_name" : "supplier_id"}</span>
                      ) : (
                        NO_SOURCE_TEXT
                      )}
                    </td>
                    <td>
                      {firstPo ? (
                        <button
                          type="button"
                          className="secondary"
                          data-vntech="p08-open-supplier-po"
                          onClick={() => open("poDetail", firstPo)}
                        >
                          ◉ Xem PO của NCC ({chain?.purchaseOrders.length} PO)
                        </button>
                      ) : (
                        <small>{nav.note || `NCC chưa có PO — ${NO_SOURCE_TEXT}.`}</small>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {graph.notes.length > 0 && (
        <div className="inline-alert" data-vntech="p08-supplier-nav-nosource">
          <b>Chưa đủ nguồn để dựng đủ chuỗi điều hướng:</b>
          <ul>{graph.notes.map((note: string) => <li key={note}>{note}</li>)}</ul>
        </div>
      )}
    </section>
  );
}

export { P08SupplierNavigation };
