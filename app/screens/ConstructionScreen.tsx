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
function ConstructionScreen({data,project,action,permission}:{data:AppData;project:string;action:(name:string,payload:Row)=>Promise<boolean>;permission:Row}){
  const projects=data.projects;
  const [conProjectId,setConProjectId]=useState(project!=="ALL"&&project?project:(projects[0]?.id||"ALL"));
  const logs=data.constructionDailyLogs.filter((l)=>conProjectId==="ALL"||String(l.projectId)===String(conProjectId));
  const itemsByLog=(logId:string)=>(data.constructionDailyLogItems||[]).filter((i)=>String(i.logId)===String(logId));
  const [draftItems,setDraftItems]=useState<Row[]>([{}]);
  function patchDraft(index:number,key:string,value:string){setDraftItems((rows)=>rows.map((r,i)=>i===index?{...r,[key]:value}:r));}
  function addDraftRow(){setDraftItems((rows)=>[...rows,{}]);}
  async function saveLog(event:FormEvent<HTMLFormElement>){event.preventDefault();if(conProjectId==="ALL")return window.alert("Hãy chọn một dự án cụ thể.");const submitMode=String((event.nativeEvent as SubmitEvent).submitter?.getAttribute("data-mode")||"draft")==="submit";const fd=new FormData(event.currentTarget);const items=draftItems.map((r,i)=>({itemName:String(fd.get(`itemName-${i}`)||r.itemName||""),location:String(fd.get(`location-${i}`)||r.location||""),plannedQty:Number(fd.get(`plannedQty-${i}`)||0),completedQty:Number(fd.get(`completedQty-${i}`)||0),unit:String(fd.get(`unit-${i}`)||r.unit||""),laborHours:Number(fd.get(`laborHours-${i}`)||0)})).filter((r)=>r.itemName.trim());const payload={projectId:conProjectId,workDate:String(fd.get("workDate")||""),shift:String(fd.get("shift")||"sang"),weather:String(fd.get("weather")||""),workContent:String(fd.get("workContent")||""),laborCount:Number(fd.get("laborCount")||0),equipmentNote:String(fd.get("equipmentNote")||""),note:String(fd.get("note")||""),items,submit:submitMode};if(await action("save_construction_daily_log",payload)){setDraftItems([{}]);(event.currentTarget as HTMLFormElement).reset();}}
  const completedByProject=logs.reduce((s,l)=>s+Number(l.completedQty||0),0),draftCount=logs.filter((l)=>l.status==="draft").length,approvedCount=logs.filter((l)=>l.status==="approved").length;
  return <div className="stack module-screen"><div className="kpi-grid small"><Kpi icon="CN" label="Nhật ký đã duyệt" value={String(approvedCount)} note={`Tổng ${logs.length} phiếu`} tone="green"/><Kpi icon="NH" label="Bản nháp / chờ duyệt" value={String(draftCount)} note="Chưa chốt tiến độ" tone="amber"/><Kpi icon="KL" label="Khối lượng hoàn thành" value={money(completedByProject)} note="Cộng dồn từ các nhật ký"/><Kpi icon="XC" label="Tiến độ thực địa" value={`${logs.filter((l)=>l.status==="approved").length}/${logs.length||1}`} note="Phiếu duyệt / tổng phiếu"/></div>
  <section className="card"><CardHead title="Nhập nhật ký thi công" note="BCH nhập theo ngày; khối lượng thực hiện là cơ sở đối chiếu nghiệm thu, không dùng số xuất kho thay sản lượng."/><div className="filter-grid"><label><span>Dự án</span><select value={conProjectId} onChange={(e:ChangeEvent<HTMLSelectElement>)=>setConProjectId(e.target.value)}>{projects.map((p)=><option key={p.id} value={p.id}>{p.code} · {p.name}</option>)}</select></label></div>{conProjectId!=="ALL"&&permission.canCreate&&<form className="construction-entry-form" onSubmit={saveLog}><div className="payment-entry-inline"><input name="workDate" type="date" required/><select name="shift" defaultValue="sang"><option value="sang">Ca sáng</option><option value="chieu">Ca chiều</option><option value="ca_3">Ca 3</option><option value="nghi">Nghỉ</option></select><input name="weather" placeholder="Thời tiết"/><input name="laborCount" type="number" min="0" placeholder="Số nhân công"/><input name="equipmentNote" placeholder="Máy móc / thiết bị"/><input name="workContent" placeholder="Nội dung thi công"/><input name="note" placeholder="Ghi chú"/></div>
  <div className="construction-items-form">{draftItems.map((r,i)=>(
    <div className="construction-item-row" key={i}>
      <input name={`itemName-${i}`} placeholder="Hạng mục *" value={String(r.itemName||"")} onChange={(e)=>patchDraft(i,"itemName",e.target.value)}/>
      <input name={`location-${i}`} placeholder="Khu vực" value={String(r.location||"")} onChange={(e)=>patchDraft(i,"location",e.target.value)}/>
      <input name={`plannedQty-${i}`} type="number" min="0" step="0.001" placeholder="KH" value={String(r.plannedQty??"")} onChange={(e)=>patchDraft(i,"plannedQty",e.target.value)}/>
      <input name={`completedQty-${i}`} type="number" min="0" step="0.001" placeholder="Thực hiện" value={String(r.completedQty??"")} onChange={(e)=>patchDraft(i,"completedQty",e.target.value)}/>
      <input name={`unit-${i}`} placeholder="ĐVT" value={String(r.unit||"")} onChange={(e)=>patchDraft(i,"unit",e.target.value)}/>
      <input name={`laborHours-${i}`} type="number" min="0" step="0.5" placeholder="Giờ công" value={String(r.laborHours??"")} onChange={(e)=>patchDraft(i,"laborHours",e.target.value)}/>
    </div>
  ))}</div><button type="button" className="secondary" onClick={addDraftRow}>＋ Thêm hạng mục</button><button type="submit" className="primary" data-mode="draft">Lưu nháp</button><button type="submit" className="primary" data-mode="submit">Gửi kiểm tra</button></form>}
  <div className="table-wrap"><table><thead><tr><th>Ngày</th><th>Số phiếu</th><th>Ca / Thời tiết</th><th>Nội dung</th><th>Nhân công</th><th>Hạng mục</th><th>Khối lượng</th><th>Trạng thái</th><th></th></tr></thead><tbody>{logs.map((l)=>{const items=itemsByLog(String(l.id));return <tr key={l.id}><td>{l.workDate}</td><td>{l.logNo}</td><td>{l.shift}<small>{l.weather||"—"}</small></td><td><strong>{l.workContent||"—"}</strong></td><td>{l.laborCount||0}</td><td>{l.itemCount||items.length}</td><td>{money(l.completedQty)}</td><td><StatusBadge value={l.status==="approved"?"Đã duyệt":l.status==="submitted"?"Chờ duyệt":"Bản nháp"}/></td><td>{l.status!=="approved"&&permission.canApprove&&<button className="mini-approve" onClick={()=>action("approve_construction_daily_log",{logId:l.id})}>Duyệt →</button>}{permission.canEdit&&l.status!=="approved"&&<button className="export-mini danger" onClick={()=>window.confirm(`Xóa nhật ký ${l.logNo}?`)&&action("delete_construction_daily_log",{logId:l.id})}>Xóa</button>}</td></tr>;})}{!logs.length&&<tr><td colSpan={9}><Empty text="Chưa có nhật ký thi công trong phạm vi đang chọn."/></td></tr>}</tbody></table></div></section>
  </div>;
}
export {
  ConstructionScreen,
};