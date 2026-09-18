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
import { CardHead, Empty, Kpi, UI_NOW_MS, date, money } from "@/lib/ui-shared";
import type { AppData, Row } from "@/lib/ui-shared";
import { FormEvent } from "react";
function LaborScreen({data,project,action,permission}:{data:AppData;project:string;action:(name:string,payload:Row)=>Promise<boolean>;permission:Row}){
  const rows=data.laborContracts;const active=rows.filter((r)=>String(r.status)==="active");
  async function saveContract(event:FormEvent<HTMLFormElement>){event.preventDefault();const fd=new FormData(event.currentTarget);const userId=String(fd.get("userId")||"");if(!userId)return window.alert("Chọn nhân sự.");if(await action("save_labor_contract",Object.fromEntries(fd)))(event.currentTarget as HTMLFormElement).reset();}
  const types=[["probation","Thử việc"],["fixed_1y","Xác định thời hạn 1 năm"],["fixed_3y","Xác định thời hạn 3 năm"],["indefinite","Không xác định thời hạn"],["part_time","Bán thời gian"]];
  return <div className="stack module-screen"><div className="kpi-grid small"><Kpi icon="HD" label="Hợp đồng đang hiệu lực" value={String(active.length)} note={`Tổng ${rows.length} hợp đồng`} tone="green"/><Kpi icon="HH" label="Sắp hết hạn (60 ngày)" value={String(active.filter((r)=>r.endDate&&((new Date(r.endDate).getTime()-UI_NOW_MS)/86400000)<=60&&((new Date(r.endDate).getTime()-UI_NOW_MS)/86400000)>=0).length)} note="Cần gia hạn" tone="amber"/><Kpi icon="TN" label="Thử việc" value={String(rows.filter((r)=>String(r.contractType)?.includes("Thử việc")||String(r.contractType)==="probation").length)} note="Đang thử việc"/><Kpi icon="KT" label="Đã kết thúc" value={String(rows.filter((r)=>String(r.status)==="ended").length)} note="Lưu lịch sử"/></div>
  <section className="card"><CardHead title="Hợp đồng lao động" note="Các loại hợp đồng thử việc / xác định thời hạn / không thời hạn; theo dõi hết hạn để gia hạn."/>
  {permission.canCreate&&<form className="payment-entry-inline labor-contract-form" onSubmit={saveContract}><select name="userId" required defaultValue=""><option value="">Nhân sự *</option>{data.staffDirectory.map((u)=><option key={u.id} value={u.id}>{u.fullName} · {u.roleName||u.role||""}</option>)}</select><select name="contractType" required defaultValue=""><option value="">Loại HĐ *</option>{types.map(([code,label])=><option key={code} value={label}>{label}</option>)}</select><input name="signingDate" type="date"/><input name="startDate" type="date"/><input name="endDate" type="date"/><input name="salary" type="number" min="0" step="1" placeholder="Mức lương"/><input name="note" placeholder="Ghi chú"/><button className="primary">＋ Lập HĐ</button></form>}
  <div className="table-wrap"><table><thead><tr><th>Số HĐ</th><th>Nhân sự</th><th>Loại</th><th>Ký</th><th>Từ</th><th>Đến</th><th>Lương</th><th>Trạng thái</th><th></th></tr></thead><tbody>{rows.map((r)=><tr key={r.id}><td>{r.contractNo}</td><td><strong>{r.fullName}</strong></td><td>{r.contractType}</td><td>{r.signingDate||"—"}</td><td>{r.startDate||"—"}</td><td>{r.endDate||"—"}</td><td>{money(r.salary)}</td><td><StatusBadge value={r.status==="active"?"Đang hiệu lực":r.status==="ended"?"Kết thúc":"Tạm ngừng"}/></td><td>{permission.canEdit&&<><button className="export-mini" onClick={()=>action("set_labor_contract_status",{contractId:r.id,status:r.status==="active"?"ended":"active"})}>{r.status==="active"?"Kết thúc":"Mở lại"}</button><button className="export-mini danger" onClick={()=>window.confirm("Xóa hợp đồng?")&&action("delete_labor_contract",{contractId:r.id})}>Xóa</button></>}</td></tr>)}{!rows.length&&<tr><td colSpan={9}><Empty text="Chưa có hợp đồng lao động."/></td></tr>}</tbody></table></div></section>
  </div>;
}
export {
  LaborScreen,
};