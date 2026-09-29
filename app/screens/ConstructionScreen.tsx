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

import { ListToolbar, StatusBadge } from "@/app/components/ui";
import { CardHead, Empty, Kpi, date, money } from "@/lib/ui-shared";
// MT3 §IV.7 — xuất Excel/CSV phải là UTF-8 (BOM) để Excel trên Windows đọc đúng tiếng Việt.
import { downloadCsv } from "@/lib/tabular-export";
import type { AppData, Row } from "@/lib/ui-shared";
import { FormEvent, useState } from "react";
import type { ChangeEvent } from "react";
function ConstructionScreen({data,project,action,permission}:{data:AppData;project:string;action:(name:string,payload:Row)=>Promise<boolean>;permission:Row}){
  const projects=data.projects;
  const [conProjectId,setConProjectId]=useState(project!=="ALL"&&project?project:(projects[0]?.id||"ALL"));
  const logs=data.constructionDailyLogs.filter((l)=>conProjectId==="ALL"||String(l.projectId)===String(conProjectId));
  const itemsByLog=(logId:string)=>(data.constructionDailyLogItems||[]).filter((i)=>String(i.logId)===String(logId));
  const [draftItems,setDraftItems]=useState<Row[]>([]);
  // MT3 §D — «Thêm hạng mục» MỞ MODAL (trước đây thêm dòng nhập trực tiếp ngoài bảng).
  const [itemModalOpen,setItemModalOpen]=useState(false);
  const [itemDraft,setItemDraft]=useState<Row>({});
  // MT3 §IV.4 — ô TÌM trong toolbar; ⛔ chỉ lọc hiển thị, ⛔ KHÔNG đổi phạm vi quyền đã được backend lọc.
  const [conQuery,setConQuery]=useState("");
  const visibleLogs=logs.filter((l:Row)=>{const q=conQuery.trim().toLowerCase();if(!q)return true;
    return [l.logNo,l.workContent,l.shift,l.weather].some((v:unknown)=>String(v??"").toLowerCase().includes(q));});
  // MT3 §IV.7 — xuất CSV UTF-8 có BOM (Excel Windows đọc đúng tiếng Việt).
  function downloadConstructionCsv(source:Row[]){downloadCsv(["Ngày","Số phiếu","Ca","Thời tiết","Nội dung","Nhân công","Khối lượng","Trạng thái"],
    source.map((l:Row)=>[String(l.workDate||""),String(l.logNo||""),String(l.shift||""),String(l.weather||""),String(l.workContent||""),Number(l.laborCount||0),Number(l.completedQty||0),String(l.status||"")]),
    `Nhat_ky_thi_cong_${new Date().toISOString().slice(0, 10)}`);}
  function patchDraft(index:number,key:string,value:string){setDraftItems((rows)=>rows.map((r,i)=>i===index?{...r,[key]:value}:r));}
  function addDraftRow(){setDraftItems((rows)=>[...rows,{}]);}
  async function saveLog(event:FormEvent<HTMLFormElement>){event.preventDefault();if(conProjectId==="ALL")return window.alert("Hãy chọn một dự án cụ thể.");const submitMode=String((event.nativeEvent as SubmitEvent).submitter?.getAttribute("data-mode")||"draft")==="submit";const fd=new FormData(event.currentTarget);const items=draftItems.map((r,i)=>({itemName:String(fd.get(`itemName-${i}`)||r.itemName||""),location:String(fd.get(`location-${i}`)||r.location||""),plannedQty:Number(fd.get(`plannedQty-${i}`)||0),completedQty:Number(fd.get(`completedQty-${i}`)||0),unit:String(fd.get(`unit-${i}`)||r.unit||""),laborHours:Number(fd.get(`laborHours-${i}`)||0)})).filter((r)=>r.itemName.trim());const payload={projectId:conProjectId,workDate:String(fd.get("workDate")||""),shift:String(fd.get("shift")||"sang"),weather:String(fd.get("weather")||""),workContent:String(fd.get("workContent")||""),laborCount:Number(fd.get("laborCount")||0),equipmentNote:String(fd.get("equipmentNote")||""),note:String(fd.get("note")||""),items,submit:submitMode};if(await action("save_construction_daily_log",payload)){setDraftItems([{}]);(event.currentTarget as HTMLFormElement).reset();}}
  const completedByProject=logs.reduce((s,l)=>s+Number(l.completedQty||0),0),draftCount=logs.filter((l)=>l.status==="draft").length,approvedCount=logs.filter((l)=>l.status==="approved").length;
  return <div className="stack module-screen"><div className="kpi-grid small"><Kpi icon="CN" label="Nhật ký đã duyệt" value={String(approvedCount)} note={`Tổng ${logs.length} phiếu`} tone="green"/><Kpi icon="NH" label="Bản nháp / chờ duyệt" value={String(draftCount)} note="Chưa chốt tiến độ" tone="amber"/><Kpi icon="KL" label="Khối lượng hoàn thành" value={money(completedByProject)} note="Cộng dồn từ các nhật ký"/><Kpi icon="XC" label="Tiến độ thực địa" value={`${logs.filter((l)=>l.status==="approved").length}/${logs.length||1}`} note="Phiếu duyệt / tổng phiếu"/></div>
  <section className="card"><CardHead title="Nhật ký thi công" note="BCH nhập theo ngày; khối lượng thực hiện là cơ sở đối chiếu nghiệm thu, không dùng số xuất kho thay sản lượng."/><div className="filter-grid"/>{conProjectId!=="ALL"&&permission.canCreate&&<form className="construction-entry-form" onSubmit={saveLog}><div className="payment-entry-inline"><input name="workDate" type="date" required/><select name="shift" defaultValue="sang"><option value="sang">Ca sáng</option><option value="chieu">Ca chiều</option><option value="ca_3">Ca 3</option><option value="nghi">Nghỉ</option></select><input name="weather" placeholder="Thời tiết"/><input name="laborCount" type="number" min="0" placeholder="Số nhân công"/><input name="equipmentNote" placeholder="Máy móc / thiết bị"/><input name="workContent" placeholder="Nội dung thi công"/><input name="note" placeholder="Ghi chú"/></div>
  {/* MT3 §D — hạng mục KHÔNG nhập dòng trực tiếp nữa: bấm «＋ Thêm hạng mục» để MỞ MODAL. */}
  <div className="construction-items-chips" data-vntech="construction-items">
    {draftItems.length? draftItems.map((r,i)=><span className="construction-item-chip" key={i}>
      <b>{String(r.itemName||"")}</b>
      {r.plannedQty!==undefined&&<small>KH {String(r.plannedQty)} {String(r.unit||"")}</small>}
      <button type="button" className="attachment-delete" aria-label={`Bỏ hạng mục ${String(r.itemName||"")}`} onClick={()=>setDraftItems((rows)=>rows.filter((_,j)=>j!==i))}>✕</button>
    </span>): <span className="muted">Chưa thêm hạng mục nào cho nhật ký này.</span>}
  </div>
  {permission.canCreate&&<button type="button" className="secondary" data-vntech="construction-open-item-modal" onClick={()=>{setItemDraft({});setItemModalOpen(true);}}>＋ Thêm hạng mục</button>}
  {/* ⛔ MT3 §D: ĐÃ BỎ nút «Lưu nháp» và «Gửi kiểm tra».
      Phê duyệt KHÔNG mất: bảng bên dưới đã có nút «Duyệt →» cho người có quyền duyệt. */}
  <button type="submit" className="primary">Lưu nhật ký</button></form>}

  {/* MODAL nhập hạng mục (MT3 §D) — ⛔ validate rỗng trước khi thêm. */}
  {itemModalOpen&&<div className="overlay" onMouseDown={(event)=>event.target===event.currentTarget&&setItemModalOpen(false)}><div className="modal card" data-vntech="construction-item-modal">
    <div className="modal-head"><strong>THÊM HẠNG MỤC THI CÔNG</strong><button type="button" onClick={()=>setItemModalOpen(false)} aria-label="Đóng">✕</button></div>
    <div className="modal-body"><div className="filter-grid">
      <label><span>Hạng mục *</span><input autoFocus value={String(itemDraft.itemName||"")} onChange={(e)=>setItemDraft((d)=>({...d,itemName:e.target.value}))} placeholder="VD: Đào móng hệ thống"/></label>
      <label><span>Khu vực</span><input value={String(itemDraft.location||"")} onChange={(e)=>setItemDraft((d)=>({...d,location:e.target.value}))}/></label>
      <label><span>Khối lượng KH</span><input type="number" min="0" step="0.001" value={String(itemDraft.plannedQty??"")} onChange={(e)=>setItemDraft((d)=>({...d,plannedQty:e.target.value}))}/></label>
      <label><span>Thực hiện</span><input type="number" min="0" step="0.001" value={String(itemDraft.completedQty??"")} onChange={(e)=>setItemDraft((d)=>({...d,completedQty:e.target.value}))}/></label>
      <label><span>ĐVT</span><input value={String(itemDraft.unit||"")} onChange={(e)=>setItemDraft((d)=>({...d,unit:e.target.value}))} placeholder="m³, m, tấn…"/></label>
      <label><span>Giờ công</span><input type="number" min="0" step="0.5" value={String(itemDraft.laborHours??"")} onChange={(e)=>setItemDraft((d)=>({...d,laborHours:e.target.value}))}/></label>
    </div></div>
    <footer className="modal-actions">
      <button type="button" className="secondary" onClick={()=>setItemModalOpen(false)}>Huỷ</button>
      <button type="button" className="primary" data-vntech="construction-item-save" onClick={()=>{
        if(!String(itemDraft.itemName||"").trim())return;   // ⛔ chặn hạng mục rỗng
        setDraftItems((rows)=>[...rows,itemDraft]);setItemDraft({});setItemModalOpen(false);
      }}>Thêm hạng mục</button>
    </footer>
  </div></div>}
  {/* MT3 §D + §IV.4 — TOOLBAR CRUD chuẩn: chọn phạm vi dự án (thay cho khối «Chọn dự án» ở đầu trang)
      · Tìm kiếm · Lọc trạng thái · Xuất Excel. ⛔ Nút thao tác vẫn theo `permission` của backend. */}
  <ListToolbar title="NHẬT KÝ THI CÔNG" note="§D — chọn phạm vi dự án trong toolbar; thêm hạng mục qua modal; duyệt từng phiếu ở cột cuối."
    count={logs.length} unit="phiếu"
    search={conQuery?{value:conQuery,onChange:setConQuery,placeholder:"Tìm số phiếu · nội dung · ca..."}:undefined}
    filters={[{key:"project",label:"Dự án",value:conProjectId,onChange:setConProjectId,options:[{value:"ALL",label:"Tất cả dự án"},...projects.map((p)=>({value:String(p.id),label:`${p.code} · ${p.name}`}))]}]}
    secondaryActions={<button type="button" className="secondary" onClick={()=>downloadConstructionCsv(logs)}>⇩ Xuất Excel</button>}
  />
  <div className="table-wrap"><table><thead><tr><th>Ngày</th><th>Số phiếu</th><th>Ca / Thời tiết</th><th>Nội dung</th><th>Nhân công</th><th>Hạng mục</th><th>Khối lượng</th><th>Trạng thái</th><th></th></tr></thead><tbody>{visibleLogs.map((l)=>{const items=itemsByLog(String(l.id));return <tr key={l.id}><td>{l.workDate}</td><td>{l.logNo}</td><td>{l.shift}<small>{l.weather||"—"}</small></td><td><strong>{l.workContent||"—"}</strong></td><td>{l.laborCount||0}</td><td><span className="construction-item-list">{items.length? items.map((it:Row)=><small key={String(it.id)}>{String(it.itemName||"—")}{it.plannedQty!==undefined?` (${String(it.plannedQty)} ${String(it.unit||"")})`:""}</small>) : <span className="muted">—</span>}</span></td><td>{money(l.completedQty)}</td><td><StatusBadge value={l.status==="approved"?"Đã duyệt":l.status==="submitted"?"Chờ duyệt":"Bản nháp"}/></td><td>{l.status!=="approved"&&permission.canApprove&&<button className="mini-approve" onClick={()=>action("approve_construction_daily_log",{logId:l.id})}>Duyệt →</button>}{permission.canEdit&&l.status!=="approved"&&<button className="export-mini danger" onClick={()=>window.confirm(`Xóa nhật ký ${l.logNo}?`)&&action("delete_construction_daily_log",{logId:l.id})}>Xóa</button>}</td></tr>;})}{!logs.length&&<tr><td colSpan={9}><Empty text="Chưa có nhật ký thi công trong phạm vi đang chọn."/></td></tr>}</tbody></table></div></section>
  </div>;
}
export {
  ConstructionScreen,
};