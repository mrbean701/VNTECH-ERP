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

import { StatusBadge } from "@/app/components/ui";
import { CardHead, Empty, Kpi, date, money } from "@/lib/ui-shared";
import type { AppData, Row } from "@/lib/ui-shared";
import { FormEvent, useState } from "react";
import type { ChangeEvent } from "react";
function DocumentsScreen({data,project,action,permission}:{data:AppData;project:string;action:(name:string,payload:Row)=>Promise<boolean>;permission:Row}){
  const [docProjectId,setDocProjectId]=useState(project!=="ALL"&&project?project:"");
  const rows=data.accountingVouchers.filter((r)=>!docProjectId||String(r.projectId||"")===String(docProjectId));
  const [voucherProjects]=useState(data.projects);
  async function saveVoucher(event:FormEvent<HTMLFormElement>){event.preventDefault();const fd=new FormData(event.currentTarget);const projectId=String(fd.get("projectId")||"");if(!projectId)return window.alert("Chọn dự án (hoặc để chứng từ liên công ty chọn rồi điền ghi chú).");if(await action("save_accounting_voucher",Object.fromEntries(fd)))(event.currentTarget as HTMLFormElement).reset();}
  const voucherTypes=[["TH","Phiếu thu"],["CH","Phiếu chi"],["XK","Phiếu xuất kho"],["NK","Phiếu nhập kho"],["HD","Hóa đơn GTGT"],["KH","Chứng từ khác"]];
  return <div className="stack module-screen"><div className="kpi-grid small"><Kpi icon="CT" label="Chứng từ đã lập" value={String(rows.length)} note="Cộng dồn"/><Kpi icon="GT" label="Tổng giá trị" value={money(rows.reduce((s,r)=>s+Number(r.totalAmount||0),0))} note="Theo dõi bởi Phòng Tài chính"/><Kpi icon="LO" label="Phiếu thu" value={String(rows.filter((r)=>String(r.voucherType)?.includes("Thu")).length)} note="Thu tiền"/><Kpi icon="LC" label="Phiếu chi" value={String(rows.filter((r)=>String(r.voucherType)?.includes("Chi")).length)} note="Chi tiền"/></div>
  <section className="card"><CardHead title="Chứng từ kế toán" note="Đăng ký chứng từ gốc và liên kết nguồn nghiệp vụ (thu hồi vốn, thanh toán, tạm ứng, chi phí)."/><div className="filter-grid"><label><span>Dự án</span><select value={docProjectId} onChange={(e:ChangeEvent<HTMLSelectElement>)=>setDocProjectId(e.target.value)}><option value="">Tất cả dự án</option>{voucherProjects.map((p)=><option key={p.id} value={p.id}>{p.code} · {p.name}</option>)}</select></label></div>
  {permission.canCreate&&<form className="payment-entry-inline voucher-form" onSubmit={saveVoucher}><input name="voucherDate" type="date" required/><select name="voucherType" required defaultValue=""><option value="">Loại chứng từ *</option>{voucherTypes.map(([code,label])=><option key={code} value={label}>{label}</option>)}</select><select name="projectId" defaultValue=""><option value="">Dự án (tùy chọn)</option>{voucherProjects.map((p)=><option key={p.id} value={p.id}>{p.code}</option>)}</select><input name="totalAmount" type="number" min="0" step="1" placeholder="Giá trị *" required/><input name="description" placeholder="Nội dung / diễn giải"/><input name="filesJson" placeholder="Mã file đính kèm (JSON)" hidden/><button className="primary">＋ Lập chứng từ</button></form>}
  <div className="table-wrap"><table><thead><tr><th>Số CT</th><th>Ngày</th><th>Loại</th><th>Dự án</th><th>Nội dung</th><th>Giá trị</th><th>Người lập</th><th></th></tr></thead><tbody>{rows.map((r)=><tr key={r.id}><td>{r.voucherNo}</td><td>{r.voucherDate}</td><td><StatusBadge value={r.voucherType}/></td><td>{r.projectCode||"—"}</td><td>{r.description||"—"}</td><td><strong>{money(r.totalAmount)}</strong></td><td>{r.createdByName||"—"}</td><td>{permission.canEdit&&<button className="export-mini danger" onClick={()=>window.confirm("Xóa chứng từ?")&&action("delete_accounting_voucher",{voucherId:r.id})}>Xóa</button>}</td></tr>)}{!rows.length&&<tr><td colSpan={8}><Empty text="Chưa có chứng từ kế toán."/></td></tr>}</tbody></table></div></section>
  </div>;
}
export {
  DocumentsScreen,
};