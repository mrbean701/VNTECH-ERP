// PHASE 1 (U-11) — MODULE DÙNG CHUNG TÁCH KHỎI `app/page.tsx`.
//
// Vì sao tách: `app/page.tsx` là MỘT tệp khổng lồ (hơn 4.000 dòng, hơn 250 khai báo top-level).
// Thứ tự cắt ĐÚNG (đã ghi ở `docs/agent-progress/U14-U11-KHAO-SAT.md` mục 2): tách HELPER DÙNG CHUNG trước
// (gỡ chặn IMPORT VÒNG), rồi mới tách từng màn.
//
// ⚠️ ĐIỀU KIỆN AN TOÀN (do `tools/tach-lat-cat-page.mjs` tự kiểm TRƯỚC KHI GHI): mọi tên mà các khối ở đây
// tham chiếu phải thuộc (a) khối cùng nằm trong tệp này, (b) tên có sẵn của JS, (c) tên đến từ `import` của
// `page.tsx` — công cụ SINH LẠI import đó ở đây, hoặc (d) kiểu của React ⇒ `import type … from "react"`.
// Không còn tên nào khác ⇒ KHÔNG thể tạo import vòng.

import { statusLabel } from "@/lib/labels";
import { downloadSupplyPdf, downloadSupplyXlsx } from "@/lib/request-export";
import type { SupplyExportDocument } from "@/lib/request-export";
import type { AppData, Row } from "@/lib/ui-shared";
function SupplyExportButtons({ doc, compact = true, stopPropagation = false }: { doc: SupplyExportDocument; compact?: boolean; stopPropagation?: boolean }) {
  const cls = compact ? "export-mini" : "secondary";
  return <span className="supply-export-buttons"><button type="button" className={cls} onClick={(event) => { if (stopPropagation) event.stopPropagation(); downloadSupplyXlsx(doc); }}>⇩ Excel</button><button type="button" className={cls} onClick={(event) => { if (stopPropagation) event.stopPropagation(); downloadSupplyPdf(doc); }}>⇩ PDF</button></span>;
}


function receiptSupplyDocument(data: AppData, receipt: Row): SupplyExportDocument {
  const po = data.purchaseOrders.find((row) => row.id === receipt.purchaseOrderId) || {};
  const request = data.requests.find((row) => row.id === (po.requestId || receipt.requestId)) || {};
  const project = data.projects.find((row) => row.id === (po.projectId || receipt.projectId)) || {};
  const requestItems = new Map<string,Row>((request.items || []).map((item: Row) => [String(item.id), item]));
  const currentItems = new Map<string,Row>((receipt.items || []).map((item: Row) => [String(item.purchaseOrderItemId), item]));
  const cutoff = receipt.receivedAt ? new Date(receipt.receivedAt).getTime() : Number.POSITIVE_INFINITY;
  const cumulative = new Map<string, { actual: number; accepted: number }>();
  data.receipts.filter((row) => row.purchaseOrderId === receipt.purchaseOrderId && (!row.receivedAt || new Date(row.receivedAt).getTime() <= cutoff)).forEach((row) => {
    (row.items || []).forEach((item: Row) => { const key = String(item.purchaseOrderItemId); const current = cumulative.get(key) || { actual: 0, accepted: 0 }; current.actual += Number(item.actualQty || 0); current.accepted += Number(item.acceptedQty || 0); cumulative.set(key, current); });
  });
  return {
    kind: "delivery", requestNo: po.requestNo || request.requestNo || "DNMH-KHONG-RO", poNo: receipt.poNo || po.poNo || "PO-KHONG-RO", receiptNo: receipt.receiptNo, projectCode: receipt.projectCode || po.projectCode || project.code, projectName: project.name,
    supplierName: receipt.supplierName || po.supplierName, warehouseName: receipt.warehouseName, orderedAt: po.orderedAt, eta: po.eta, receivedAt: receipt.receivedAt, deliveryNoteNo: receipt.deliveryNoteNo,
    bchConfirmedAt: receipt.bchConfirmedAt, bchConfirmedByName: receipt.bchConfirmedByName, certificateStatus: receipt.certificateStatus, deliveryDocumentStatus: receipt.deliveryDocumentStatus, status: receipt.bchConfirmationStatus === "confirmed" ? "BCH đã xác nhận" : "Chờ BCH xác nhận",
    lines: (po.items || []).map((item: Row, index: number) => { const source = requestItems.get(String(item.requestItemId)) || {} as Row; const trip = currentItems.get(String(item.id)) || {} as Row; const total = cumulative.get(String(item.id)) || { actual: 0, accepted: 0 }; return { lineNo: item.lineNo || index + 1, materialCode: item.materialCode, materialName: item.materialName, unit: item.unit, requestedQty: Number(source.requestedQty || 0), approvedQty: Number(source.approvedPurchaseQty || 0), orderedQty: Number(item.orderedQty || 0), unitPrice: Number(item.unitPrice || 0), actualTripQty: Number(trip.actualQty || 0), acceptedTripQty: Number(trip.acceptedQty || 0), actualCumulativeQty: total.actual, acceptedCumulativeQty: total.accepted, lotNo: trip.lotNo || "" }; }),
  };
}


function poSupplyDocument(data: AppData, po: Row): SupplyExportDocument {
  const request = data.requests.find((row) => row.id === po.requestId) || {};
  const project = data.projects.find((row) => row.id === po.projectId) || {};
  const warehouse = data.warehouses.find((row) => row.id === po.receivingWarehouseId) || {};
  const requestItems = new Map<string,Row>((request.items || []).map((item: Row) => [String(item.id), item]));
  return {
    kind: "po", requestNo: po.requestNo || request.requestNo || "DNMH-KHONG-RO", poNo: po.poNo || "PO-KHONG-RO", projectCode: po.projectCode || project.code, projectName: project.name,
    supplierName: po.supplierName, warehouseName: warehouse.name, orderedAt: po.orderedAt, eta: po.eta, status: statusLabel(po),
    lines: (po.items || []).map((item: Row, index: number) => { const source = requestItems.get(String(item.requestItemId)) || {} as Row; return { lineNo: item.lineNo || index + 1, materialCode: item.materialCode, materialName: item.materialName, unit: item.unit, requestedQty: Number(source.requestedQty || 0), approvedQty: Number(source.approvedPurchaseQty || 0), orderedQty: Number(item.orderedQty || 0), unitPrice: Number(item.unitPrice || 0), actualTripQty: null, acceptedTripQty: null, actualCumulativeQty: Number(item.actualDeliveredQty || 0), acceptedCumulativeQty: Number(item.receivedQty || 0) }; }),
  };
}

export {
  SupplyExportButtons,
  poSupplyDocument,
  receiptSupplyDocument,
};