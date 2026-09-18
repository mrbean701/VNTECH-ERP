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
import { FormEvent } from "react";
function BenefitsScreen({data,project,action,permission}:{data:AppData;project:string;action:(name:string,payload:Row)=>Promise<boolean>;permission:Row}){
  const rows=data.benefitRecords;
  async function saveBenefit(event:FormEvent<HTMLFormElement>){event.preventDefault();const fd=new FormData(event.currentTarget);const userId=String(fd.get("userId")||"");if(!userId)return window.alert("Chọn nhân sự.");if(await action("save_benefit_record",Object.fromEntries(fd)))(event.currentTarget as HTMLFormElement).reset();}
  const types=[["social","BHXH"],["health","BHYT"],["unemployment","BHTN"],["other","Chế độ khác"]];
  return <div className="stack module-screen"><div className="kpi-grid small"><Kpi icon="BH" label="Đang theo dõi" value={String(rows.filter((r)=>String(r.status)==="active").length)} note={`Tổng ${rows.length}`} tone="green"/><Kpi icon="TI" label="Mức đóng tháng" value={money(rows.filter((r)=>String(r.status)==="active").reduce((s,r)=>s+Number(r.monthlyAmount||0),0))} note="Cộng dồn"/></div>
  <section className="card"><CardHead title="Bảo hiểm & Chế độ" note="Theo dõi BHXH/BHYT/BHTN và chế độ theo nhân sự; nhắc gia hạn theo thời hạn."/>{permission.canCreate&&<form className="payment-entry-inline benefit-form" onSubmit={saveBenefit}><select name="userId" required defaultValue=""><option value="">Nhân sự *</option>{data.staffDirectory.map((u)=><option key={u.id} value={u.id}>{u.fullName}</option>)}</select><select name="benefitType" required defaultValue=""><option value="">Loại *</option>{types.map(([code,label])=><option key={code} value={label}>{label}</option>)}</select><input name="provider" placeholder="Đơn vị cung cấp"/><input name="startDate" type="date"/><input name="endDate" type="date"/><input name="monthlyAmount" type="number" min="0" step="1" placeholder="Mức đóng tháng"/><input name="note" placeholder="Ghi chú"/><button className="primary">＋ Thêm</button></form>}
  <div className="table-wrap"><table><thead><tr><th>Mã</th><th>Nhân sự</th><th>Loại</th><th>Đơn vị</th><th>Từ</th><th>Đến</th><th>Mức đóng</th><th>Trạng thái</th><th></th></tr></thead><tbody>{rows.map((r)=><tr key={r.id}><td>{r.benefitNo}</td><td><strong>{r.fullName}</strong></td><td>{r.benefitType}</td><td>{r.provider||"—"}</td><td>{r.startDate||"—"}</td><td>{r.endDate||"—"}</td><td>{money(r.monthlyAmount)}</td><td><StatusBadge value={String(r.status)==="active"?"Đang tham gia":"Đã dừng"}/></td><td>{permission.canEdit&&<><button className="export-mini" onClick={()=>action("set_benefit_record_status",{benefitId:r.id,status:String(r.status)==="active"?"inactive":"active"})}>{String(r.status)==="active"?"Dừng":"Mở lại"}</button><button className="export-mini danger" onClick={()=>window.confirm("Xóa bản ghi?")&&action("delete_benefit_record",{benefitId:r.id})}>Xóa</button></>}</td></tr>)}{!rows.length&&<tr><td colSpan={9}><Empty text="Chưa có bản ghi bảo hiểm & chế độ."/></td></tr>}</tbody></table></div></section>
  </div>;
}
export {
  BenefitsScreen,
};