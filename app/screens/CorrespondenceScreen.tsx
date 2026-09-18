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
import { CardHead, Empty, Kpi, date } from "@/lib/ui-shared";
import type { AppData, Row } from "@/lib/ui-shared";
import { FormEvent } from "react";
function CorrespondenceScreen({data,project,action,permission}:{data:AppData;project:string;action:(name:string,payload:Row)=>Promise<boolean>;permission:Row}){
  const rows=data.officialCorrespondence;
  async function saveCorr(event:FormEvent<HTMLFormElement>){event.preventDefault();const fd=new FormData(event.currentTarget);const docNo=String(fd.get("docNo")||"");if(!docNo)return window.alert("Nhập số công văn.");if(await action("save_correspondence",Object.fromEntries(fd)))(event.currentTarget as HTMLFormElement).reset();}
  return <div className="stack module-screen"><div className="kpi-grid small"><Kpi icon="DN" label="Công văn đến" value={String(rows.filter((r)=>String(r.direction)==="IN").length)} note="Đã ghi nhận"/><Kpi icon="DI" label="Công văn đi" value={String(rows.filter((r)=>String(r.direction)==="OUT").length)} note="Đã ban hành"/><Kpi icon="XS" label="Đang xử lý" value={String(rows.filter((r)=>["received","processing"].includes(String(r.status))).length)} note="Chưa hoàn tất" tone="amber"/></div>
  <section className="card"><CardHead title="Công văn đến / đi" note="Văn thư theo dõi công văn đến-đi, người xử lý nội bộ và kết quả."/>{permission.canCreate&&<form className="payment-entry-inline correspondence-form" onSubmit={saveCorr}><select name="direction" defaultValue="IN"><option value="IN">Công văn đến</option><option value="OUT">Công văn đi</option></select><input name="docNo" placeholder="Số công văn *" required/><select name="docType" defaultValue=""><option value="">Loại *</option><option>Hành chính</option><option>Kỹ thuật</option><option>Pháp lý</option><option>Hợp đồng</option><option>Khác</option></select><input name="issueDate" type="date"/><input name="senderName" placeholder="Đơn vị gửi"/><input name="receiverName" placeholder="Đơn vị nhận"/><input name="summary" placeholder="Trích yếu"/><input name="internalHandler" placeholder="Người xử lý"/><button className="primary">＋ Ghi nhận</button></form>}
  <div className="table-wrap"><table><thead><tr><th>Số CV</th><th>Hướng</th><th>Loại</th><th>Ngày</th><th>Gửi / Nhận</th><th>Trích yếu</th><th>Xử lý nội bộ</th><th>Trạng thái</th><th></th></tr></thead><tbody>{rows.map((r)=><tr key={r.id}><td>{r.docNo}</td><td><StatusBadge value={String(r.direction)==="IN"?"Đến":"Đi"}/></td><td>{r.docType}</td><td>{r.issueDate||"—"}</td><td>{r.receiverName||r.senderName||"—"}</td><td>{r.summary||"—"}</td><td>{r.internalHandler||"—"}</td><td><StatusBadge value={r.status==="received"?"Đã nhận":r.status==="processing"?"Đang xử lý":r.status==="done"?"Hoàn tất":r.status}/></td><td>{permission.canEdit&&<><button className="export-mini" onClick={()=>window.confirm("Đánh dấu hoàn tất?")&&action("set_correspondence_status",{corrId:r.id,status:"done"})}>Hoàn tất</button><button className="export-mini danger" onClick={()=>window.confirm("Xóa công văn?")&&action("delete_correspondence",{corrId:r.id})}>Xóa</button></>}</td></tr>)}{!rows.length&&<tr><td colSpan={9}><Empty text="Chưa có công văn."/></td></tr>}</tbody></table></div></section>
  </div>;
}
export {
  CorrespondenceScreen,
};