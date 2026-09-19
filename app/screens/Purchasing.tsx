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

import { DataTable, StatusBadge } from "@/app/components/ui";
import { downloadBoqPriceTemplateXlsx } from "@/lib/boq-export";
import { parseSpreadsheetRows } from "@/lib/material-import";
import { BOQ_SYSTEM_CODES, CardHead, Empty, Kpi, boqControlQty, boqSystemName, downloadBlankPoPlanningTemplate, downloadPoPlanningTemplate, format, mapBoqPriceRows, moneyBillion, normalizeBoqSystemCode } from "@/lib/ui-shared";
import type { AppData, Row } from "@/lib/ui-shared";
import { Fragment, useState } from "react";
function Purchasing({ data, project, open, action, canUse }: { data: AppData; project: string; open: (name: string, row?: Row) => void; action:(name:string,payload:Row)=>Promise<boolean>; canUse: boolean }) {
  const requests=data.requests.filter((row)=>(project==="ALL"||row.projectId===project)&&row.supplyStatus==="awaiting_po"); const pos=data.purchaseOrders.filter((row)=>project==="ALL"||row.projectId===project); const boqRows=data.boqItems.filter((row)=>(project==="ALL"||row.projectId===project)&&["material","component"].includes(String(row.rowRole||"material"))); const selected=project==="ALL"?null:data.projects.find((row)=>row.id===project);
  const contractRows=boqRows.filter((row)=>row.itemType!=="outside_contract"); const contract=contractRows.reduce((sum,row)=>sum+Number(row.contractQty||0)*Number(row.unitPrice||0),0); const ordered=contractRows.reduce((sum,row)=>sum+Math.min(Number(row.contractQty||0),Number(row.orderedQty||0))*Number(row.unitPrice||0),0); const received=contractRows.reduce((sum,row)=>sum+Math.min(Number(row.contractQty||0),Number(row.receivedQty||0))*Number(row.unitPrice||0),0); const paid=data.contractPayments.filter((row)=>project==="ALL"||row.projectId===project).reduce((sum,row)=>sum+Number(row.amount||0),0); const efficiency=ordered>0?Math.min(100,received/ordered*100):0;
  const [pricePreview,setPricePreview]=useState<Row[]>([]); const [priceFileName,setPriceFileName]=useState("");
  async function importPrices(file?:File){if(!file||!selected)return;try{const updates=mapBoqPriceRows(await parseSpreadsheetRows(file),boqRows);setPricePreview(updates);setPriceFileName(file.name);}catch(error){setPricePreview([]);window.alert(error instanceof Error?error.message:"Không đọc được file đơn giá hợp đồng.");}}
  async function confirmPrices(){if(!selected||!pricePreview.length)return;const ok=await action("update_boq_contract_prices",{projectId:selected.id,sourceFileName:priceFileName,updates:pricePreview.map(({boqItemId,sourceOrder,unitPrice})=>({boqItemId,sourceOrder,unitPrice}))});if(ok){setPricePreview([]);setPriceFileName("");}}
  const systemRows=BOQ_SYSTEM_CODES.map((code)=>{const rows=boqRows.filter((row)=>normalizeBoqSystemCode(row.systemCode||row.customFields?.systemCode)===code);const c=rows.filter((row)=>row.itemType!=="outside_contract");const a=c.reduce((sum,row)=>sum+Number(row.contractQty||0)*Number(row.unitPrice||0),0);const b=c.reduce((sum,row)=>sum+Math.min(Number(row.contractQty||0),Number(row.orderedQty||0))*Number(row.unitPrice||0),0);const r=c.reduce((sum,row)=>sum+Math.min(Number(row.contractQty||0),Number(row.receivedQty||0))*Number(row.unitPrice||0),0);return{code,name:boqSystemName(code),a,b,r,pct:b?Math.min(100,r/b*100):0};}).filter((row)=>row.a||row.b||row.r||project==="ALL");
  // PHASE P-01 — 3 giai đoạn MR · PR · PO (điều kiện lọc lấy từ DỮ LIỆU THẬT, xem P01-TAB-SPEC.md).
  const [stageTab,setStageTab]=useState("MR");
  const scopedRequests=data.requests.filter((row)=>project==="ALL"||row.projectId===project);
  const mrRows=scopedRequests.filter((row)=>String(row.status)==="pending_approval");
  const prRows=scopedRequests.filter((row)=>String(row.status)==="approved");
  const poRows=pos;
  const doc={projectCode:selected?.code,projectName:selected?.name,contractNo:selected?.contractNo,rows:boqRows,fieldConfigs:data.formFieldConfigs};
  return <div className="stack module-screen purchasing-screen baseline-screen"><div className="kpi-grid"><Kpi icon="MR" label="MR chờ lập PO" value={format.format(requests.length)} note="↑ tự chuyển sau duyệt cuối"/><Kpi icon="PO" label="PO chờ giao" value={format.format(pos.filter((row)=>!["completed","completed_with_exceptions"].includes(String(row.status))).length)} note="Theo trạng thái đơn hàng" tone="violet"/><Kpi icon="DG" label="PO đang giao" value={format.format(pos.filter((row)=>String(row.status).includes("partial")||String(row.status).includes("delivery")).length)} note="Đang cập nhật giao hàng" tone="amber"/><Kpi icon="GT" label="Tổng giá trị đối chiếu" value={moneyBillion(contract)} note="Theo BOQ/Hợp đồng" tone="green"/></div>
    <section className="card purchase-cumulative-card"><div className="purchase-cumulative-head"><div><h2>LŨY KẾ MUA HÀNG ĐỐI CHIẾU BOQ/HỢP ĐỒNG</h2><p>Số liệu tính đến ngày {new Intl.DateTimeFormat("vi-VN").format(new Date())}</p></div></div><div className="purchase-summary-metrics"><article><small>TỔNG GIÁ TRỊ HỢP ĐỒNG (A)</small><strong>{moneyBillion(contract)}</strong><i><b style={{width:"100%"}}/></i><span>100% · Hợp đồng</span></article><article><small>GIÁ TRỊ ĐỐI CHIẾU (B)</small><strong>{moneyBillion(ordered)}</strong><i><b style={{width:`${contract?Math.min(100,ordered/contract*100):0}%`}}/></i><span>{contract?(ordered/contract*100).toLocaleString("vi-VN",{maximumFractionDigits:2}):"0"}% · B/A</span></article><article><small>ĐÃ NHẬN HÀNG (C)</small><strong>{moneyBillion(received)}</strong><i><b style={{width:`${contract?Math.min(100,received/contract*100):0}%`}}/></i><span>{contract?(received/contract*100).toLocaleString("vi-VN",{maximumFractionDigits:2}):"0"}% · C/A</span></article><article><small>THANH TOÁN (D)</small><strong>{moneyBillion(paid)}</strong><i><b style={{width:`${contract?Math.min(100,paid/contract*100):0}%`}}/></i><span>{contract?(paid/contract*100).toLocaleString("vi-VN",{maximumFractionDigits:2}):"0"}% · D/A</span></article><div className="purchase-efficiency-columns"><div><i className="received" style={{height:`${Math.max(6,efficiency)}%`}}/><strong>{efficiency.toLocaleString("vi-VN",{maximumFractionDigits:2})}%</strong><span>Đã nhận / Đối chiếu</span></div><div><i className="remaining" style={{height:`${Math.max(6,100-efficiency)}%`}}/><strong>{Math.max(0,100-efficiency).toLocaleString("vi-VN",{maximumFractionDigits:2})}%</strong><span>Còn lại</span></div></div></div></section>
    <div className="purchase-action-bar"><button className="secondary" onClick={()=>selected?downloadBoqPriceTemplateXlsx(doc):window.alert("Hãy chọn một dự án cụ thể.")}>⇩ TẢI MẪU ĐƠN GIÁ HĐ</button><label className={`secondary file-inline ${!selected||!canUse?"is-disabled":""}`}>⇧ NHẬP ĐƠN GIÁ HĐ<input type="file" accept=".xlsx,.csv" disabled={!selected||!canUse} onChange={(e)=>{void importPrices(e.target.files?.[0]);e.target.value="";}}/></label><button className="secondary" onClick={()=>requests[0]?downloadPoPlanningTemplate(data,requests[0]):downloadBlankPoPlanningTemplate(data)}>⇩ TẢI MẪU PO</button><button className="secondary" disabled={!requests[0]} onClick={()=>requests[0]&&open("po",requests[0])}>⇧ NHẬP PO EXCEL</button><button className="primary" disabled={!canUse||!requests[0]} onClick={()=>requests[0]&&open("po",requests[0])}>＋ PHÁT HÀNH PO</button></div>
    {pricePreview.length>0&&<section className="card price-import-preview"><header><div><strong>KIỂM TRA TRƯỚC KHI CẬP NHẬT · {priceFileName}</strong><small>{pricePreview.length} dòng hợp lệ · {pricePreview.filter((row)=>row.changed).length} dòng thay đổi</small></div><div className="row-actions"><button className="secondary" onClick={()=>setPricePreview([])}>HỦY</button><button className="primary" onClick={()=>void confirmPrices()}>XÁC NHẬN CẬP NHẬT GIÁ</button></div></header></section>}
    <section className="card purchase-system-table"><div className="table-wrap"><table className="baseline-table"><thead><tr><th>NHÓM VẬT TƯ (HỆ M&E)</th><th>HỢP ĐỒNG (A)</th><th>ĐỐI CHIẾU (B)</th><th>ĐÃ NHẬN (C)</th><th>THANH TOÁN (D)</th><th>C/E/B</th><th>TRẠNG THÁI</th></tr></thead><tbody>{systemRows.map((row)=><Fragment key={row.code}><tr className="system-total-row"><td><strong>⌄ &nbsp; HỆ {row.name.toUpperCase()}</strong></td><td><strong>{moneyBillion(row.a)}</strong></td><td><strong>{moneyBillion(row.b)}</strong></td><td><strong>{moneyBillion(row.r)}</strong></td><td><strong>{moneyBillion(row.a?paid*(row.a/Math.max(contract,1)):0)}</strong></td><td><strong>{row.pct.toLocaleString("vi-VN",{maximumFractionDigits:2})}%</strong></td><td><StatusBadge value={row.pct>=50?"Đạt kế hoạch":"Cần theo dõi"}/></td></tr></Fragment>)}{!systemRows.length&&<tr><td colSpan={7}><Empty text="Chưa có dữ liệu BOQ/Hợp đồng phát sinh trong phạm vi đang chọn."/></td></tr>}<tr className="total-row"><td><strong>TỔNG CỘNG</strong></td><td><strong>{moneyBillion(contract)}</strong></td><td><strong>{moneyBillion(ordered)}</strong></td><td><strong>{moneyBillion(received)}</strong></td><td><strong>{moneyBillion(paid)}</strong></td><td><strong>{efficiency.toLocaleString("vi-VN",{maximumFractionDigits:2})}%</strong></td><td></td></tr></tbody></table></div></section>
    {/* PHASE P-01 — TÁCH MR · PR · PO THÀNH 3 TAB RIÊNG.
        Ngữ nghĩa RÚT RA TỪ DỮ LIỆU THẬT (không suy đoán — xem docs/agent-progress/P01-TAB-SPEC.md):
          MR = phiếu đề nghị CHỜ DUYỆT  (material_requests.status = pending_approval)  · 7 dòng thực tế
          PR = phiếu ĐÃ DUYỆT           (material_requests.status = approved)          · 10 dòng thực tế
          PO = đơn mua hàng             (purchase_orders)                              · 7 dòng thực tế
        ⚠️ KHÔNG tồn tại bảng `purchase_requests` ⇒ PR là TẬP CON của `material_requests` (đã duyệt), không phải thực thể riêng.
        Khối BOQ/nhập giá ở trên/dưới được GIỮ NGUYÊN (không di chuyển) để không làm hỏng luồng nhập giá. */}
    <section className="card purchase-stage-tabs"><CardHead title="Danh sách mua hàng theo giai đoạn" note="MR = chờ duyệt · PR = đã duyệt (chuẩn bị lên PO) · PO = đơn mua hàng. Nguồn: material_requests (theo status) + purchase_orders."/>
      <div className="purchase-tabs" role="tablist">{([["MR",mrRows.length],["PR",prRows.length],["PO",poRows.length]] as Array<[string,number]>).map(([key,count])=>(<button key={key} role="tab" aria-selected={stageTab===key} className={stageTab===key?"primary":"secondary"} onClick={()=>setStageTab(key)}>{key} <b>{format.format(count)}</b></button>))}</div>
      {stageTab==="MR"&&<DataTable rows={mrRows} rowKey={(row)=>String(row.id)} emptyText="Không có phiếu đề nghị nào đang chờ duyệt trong phạm vi đang chọn." columns={[
        { key: "s1", header: "Số phiếu", render: (row) => <strong>{row.requestNo||"—"}</strong> },
        { key: "s2", header: "Người đề nghị", render: (row) => <>{row.requestedBy||"—"}</> },
        { key: "s3", header: "Ngày đề nghị", render: (row) => <>{row.requestedAt?String(row.requestedAt).slice(0,10):"—"}</> },
        { key: "s4", header: "Cần có", render: (row) => <>{row.neededAt?String(row.neededAt).slice(0,10):"—"}</> },
        { key: "s5", header: "Số dòng", render: (row) => <>{format.format(Number(row.itemCount||0))}</> },
        { key: "s6", header: "Ưu tiên", render: (row) => <>{row.priority||"—"}</> },
        { key: "s7", header: "Trạng thái", render: (row) => <StatusBadge value={row.status||"—"}/> },
      ]}/>}
      {stageTab==="PR"&&<DataTable rows={prRows} rowKey={(row)=>String(row.id)} emptyText="Không có phiếu đã duyệt nào trong phạm vi đang chọn." columns={[
        { key: "r1", header: "Số phiếu", render: (row) => <strong>{row.requestNo||"—"}</strong> },
        { key: "r2", header: "Người đề nghị", render: (row) => <>{row.requestedBy||"—"}</> },
        { key: "r3", header: "Ngày đề nghị", render: (row) => <>{row.requestedAt?String(row.requestedAt).slice(0,10):"—"}</> },
        { key: "r4", header: "Số dòng", render: (row) => <>{format.format(Number(row.itemCount||0))}</> },
        { key: "r5", header: "Giai đoạn cung ứng", render: (row) => <StatusBadge value={row.supplyStatus||"—"}/> },
        { key: "r6", header: "Bước duyệt", render: (row) => <>{row.approvalStage===undefined?"—":String(row.approvalStage)}</> },
      ]}/>}
      {stageTab==="PO"&&<DataTable rows={poRows} rowKey={(row)=>String(row.id)} emptyText="Không có đơn mua hàng nào trong phạm vi đang chọn." columns={[
        { key: "p1", header: "Số PO", render: (row) => <strong>{row.poNo||"—"}</strong> },
        { key: "p2", header: "Ngày đặt", render: (row) => <>{row.orderedAt?String(row.orderedAt).slice(0,10):"—"}</> },
        { key: "p3", header: "Dự kiến nhận", render: (row) => <>{row.eta?String(row.eta).slice(0,10):"—"}</> },
        { key: "p4", header: "Giá trị", render: (row) => <>{moneyBillion(Number(row.amount||row.totalValue||0))}</> },
        { key: "p5", header: "Trạng thái", render: (row) => <StatusBadge value={row.status||"—"}/> },
      ]}/>}
    </section>
    <section className="card purchase-material-cumulative"><CardHead title="Chi tiết lũy kế theo vật tư" note="Chỉ hiển thị dữ liệu thực từ BOQ, đề nghị, PO và giao nhận; không nội suy dòng minh họa."/><DataTable rows={boqRows} rowKey={(row)=>String(row.id)} emptyText="Chưa có dòng vật tư BOQ/Hợp đồng cho phạm vi đang chọn." tableClassName="resizable-data-table" columns={[
  { key: "c1", header: "STT HĐ", render: (row) => <>{row.sourceOrder||"—"}</> },
  { key: "c2", header: "Mã vật tư", render: (row) => <strong>{row.materialCode||"—"}</strong> },
  { key: "c3", header: "Tên vật tư", render: (row) => <>{row.materialName||"—"}</> },
  { key: "c4", header: "ĐVT", render: (row) => <>{row.unit||"—"}</> },
  { key: "c5", header: "BOQ/HĐ", render: (row) => <>{format.format(Number(row.contractQty||0))}</> },
  { key: "c6", header: "Đã đề nghị", render: (row) => <>{format.format(Number(row.requestedQty||0))}</> },
  { key: "c7", header: "Đã duyệt mua", render: (row) => <>{format.format(Number(row.approvedQty||row.approvedPurchaseQty||0))}</> },
  { key: "c8", header: "Lũy kế PO", render: (row) => <>{format.format(Number(row.orderedQty||0))}</> },
  { key: "c9", header: "Đã nhận", render: (row) => <>{format.format(Number(row.receivedQty||0))}</> },
  { key: "c10", header: "Còn phải mua", render: (row) => <strong>{format.format(Math.max(0,boqControlQty(row)-Number(row.orderedQty||0)))}</strong> },
]}/></section>
  </div>;
}
export {
  Purchasing,
};