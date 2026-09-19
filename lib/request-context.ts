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

import type { AppData, Row } from "@/lib/ui-shared";
function requestLineContext(data: AppData, projectId: string, item: Row, index: number) {
  const material = data.materials.find((mat) => mat.id === item.materialId) || {};
  const boqRows = data.boqItems.filter((row) => row.projectId === projectId);
  const boq = (item.boqItemId ? boqRows.find((row) => String(row.id) === String(item.boqItemId)) : null) || (item.contractLineNo ? boqRows.find((row) => Number(row.lineNo) === Number(item.contractLineNo) && row.materialId === item.materialId) : null) || boqRows.find((row) => row.materialId === item.materialId && (!item.boqCode || !row.boqCode || row.boqCode === item.boqCode)) || {};
  const stockQty = data.inventory.filter((row) => row.projectId === projectId && row.materialId === item.materialId && (row.warehouseType === "site" || row.type === "site" || !row.warehouseType)).reduce((sum,row)=>sum+Number(row.balance||0),0);
  const orderedCumulativeQty = Number(boq.orderedQty || item.orderedCumulativeQty || item.orderedQty || 0);
  const requestedQty = Number(item.quantity ?? item.requestedQty ?? 0);
  return { ...item, lineNo: item.lineNo || index + 1, contractLineNo: item.contractLineNo || boq.lineNo || "", materialCode: item.materialCode || material.code || boq.materialCode || "", materialName: item.materialName || material.name || boq.materialName || "", unit: item.unit || material.unit || boq.unit || "", manufacturer: item.manufacturer || material.brand || "", origin: item.origin || "", approvedSupplier: item.approvedSupplier || "", contractQty: Number(boq.contractQty || 0), stockQty, orderedCumulativeQty, requestedQty, cumulativeAfterRequest: orderedCumulativeQty + requestedQty, installationArea: item.installationArea || "", note: item.note || "", boqCode: item.boqCode || boq.boqCode || "", customFields: item.customFields || {} };
}
export {
  requestLineContext,
};