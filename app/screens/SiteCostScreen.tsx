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
function SiteCostScreen({data,project,action,permission}:{data:AppData;project:string;action:(name:string,payload:Row)=>Promise<boolean>;permission:Row}){
  const [scProjectId,setScProjectId]=useState(project!=="ALL"&&project?project:"");
  const rows=data.siteExpenseClaims.filter((r)=>!scProjectId||String(r.projectId)===String(scProjectId));
  const totalByType=(type:string)=>rows.filter((r)=>String(r.costType)===type).reduce((s,r)=>s+Number(r.amount||0),0);
  const types: [string, string][] = [["AC","Ăn uống / tiếp khách"],["DC","Đi lại / xăng dầu"],["KS","Khách sạn / thuê trọ"],["VT","Vật tư phụ trợ BCH"],["NH","Nhân công thuê ngoài"],["KH","Khác"]];
  async function saveClaim(event:FormEvent<HTMLFormElement>){event.preventDefault();const fd=new FormData(event.currentTarget);const projectId=String(fd.get("projectId")||"");if(!projectId)return window.alert("Chọn dự án.");if(await action("save_site_expense_claim",Object.fromEntries(fd)))(event.currentTarget as HTMLFormElement).reset();}
  return <div className="stack module-screen"><div className="kpi-grid small">{types.slice(0,4).map(([icon,label])=><Kpi key={label} icon={icon} label={label} value={money(totalByType(label))} note="Cộng dồn" tone={totalByType(label)>0?"amber":"blue"}/>)}</div>
  <section className="card"><CardHead title="Chi phí Ban chỉ huy theo dự án" note="Chi phí ăn ở, đi lại, vật tư phụ trợ và nhân công BCH; có chứng từ liên kết."/><div className="filter-grid"><label><span>Dự án</span><select value={scProjectId} onChange={(e:ChangeEvent<HTMLSelectElement>)=>setScProjectId(e.target.value)}><option value="">Tất cả dự án</option>{data.projects.map((p)=><option key={p.id} value={p.id}>{p.code} · {p.name}</option>)}</select></label></div>
  {permission.canCreate&&<form className="payment-entry-inline site-cost-form" onSubmit={saveClaim}><select name="projectId" required defaultValue=""><option value="">Dự án *</option>{data.projects.map((p)=><option key={p.id} value={p.id}>{p.code}</option>)}</select><select name="costType" required defaultValue=""><option value="">Loại chi phí *</option>{types.map(([code,label])=><option key={label} value={label}>{label}</option>)}</select><input name="amount" type="number" min="0" step="1" placeholder="Số tiền *" required/><select name="paidBy" defaultValue=""><option value="">Người chi</option>{data.staffDirectory.map((u)=><option key={u.id} value={u.id}>{u.fullName}</option>)}</select><input name="claimDate" type="date"/><input name="description" placeholder="Diễn giải"/><button className="primary">＋ Ghi chi phí</button></form>}
  <div className="table-wrap"><table><thead><tr><th>Phiếu</th><th>Dự án</th><th>Loại</th><th>Số tiền</th><th>Người chi</th><th>Ngày</th><th>Diễn giải</th><th>Trạng thái</th><th></th></tr></thead><tbody>{rows.map((r)=><tr key={r.id}><td>{r.claimNo}</td><td><strong>{r.projectCode}</strong></td><td>{r.costType}</td><td><strong>{money(r.amount)}</strong></td><td>{r.paidByName||"—"}</td><td>{r.claimDate||"—"}</td><td>{r.description||"—"}</td><td><StatusBadge value={r.status==="approved"?"Đã duyệt":r.status==="submitted"?"Chờ duyệt":"Bản nháp"}/></td><td>{r.status!=="approved"&&permission.canApprove&&<button className="mini-approve" onClick={()=>action("approve_site_expense_claim",{claimId:r.id})}>Duyệt →</button>}{permission.canEdit&&r.status!=="approved"&&<button className="export-mini danger" onClick={()=>window.confirm("Xóa chi phí?")&&action("delete_site_expense_claim",{claimId:r.id})}>Xóa</button>}</td></tr>)}{!rows.length&&<tr><td colSpan={9}><Empty text="Chưa có chi phí hiện trường."/></td></tr>}</tbody></table></div></section>
  </div>;
}
export {
  SiteCostScreen,
};