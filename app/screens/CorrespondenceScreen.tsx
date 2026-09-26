// PHASE 1 (U-11) — MODULE DÙNG CHUNG TÁCH KHỎI `app/page.tsx`.
//
// Vì sao tách: `app/page.tsx` là MỘT tệp khổng lồ (hơn 4.000 dòng, hơn 250 khai báo top-level).
// Thứ tự cắt ĐÚNG (đã ghi ở `docs/agent-progress/U14-U11-KHAO-SAT.md` mục 2): tách HELPER DÙNG CHUNG trước
// (gỡ chặn IMPORT VÒNG), rồi mới tách từng màn.
//
// ⚠️ ĐIỀU KIỆN AN TOÀN (do `tools/tach-lat-cat-page.mjs` tự kiểm TRƯỚC khi ghi): mọi tên mà các khối ở đây
// tham chiếu phải thuộc (a) khối cùng nằm trong tệp này, (b) tên có sẵn của JS, (c) tên đến từ `import` của
// `page.tsx` — công cụ SINH LẠI import đó ở đây, hoặc (d) kiểu của React ⇒ `import type … from "react"`.
// Không còn tên nào khác ⇒ KHÔNG thể tạo import vòng.

// MT2-P10-04 (§10.3) — «Công văn đến / đi»: thêm **Tạo công văn** (modal) + **upload nhiều ảnh/tài liệu** +
// **nút Sửa** cho từng công văn.
// NGUYÊN VĂN `docs/dsh/MASTER_TASK_2.md:226`: «Thêm **Tạo công văn**: Số công văn/giấy tờ · Hướng · Loại ·
// Ngày · Ngày tạo · Người gửi · Người nhận · Trích yếu · Trạng thái · **Hình ảnh/tài liệu liên quan
// (upload nhiều ảnh)**. Danh sách công văn: thêm **nút Sửa** cho từng công văn.»
//
// ĐO TRƯỚC KHI CODE (⛔ 0 API/migration mới — §15 REUSE · §16 · §19):
// ① `HrManagementUseCase.saveCorrespondence:92-113` là **UPSERT** — có `corrId` ⇒ `updateCorrespondence` ⇒ nút
//    «Sửa» chỉ cần truyền `corrId` + prefill (⛔ KHÔNG tạo action `update_correspondence` mới).
// ② Payload `officialCorrespondence` (`BootstrapDataAdapter:1451-1457`) ĐÃ CÓ `createdAt/createdByName`
//    ⇒ cột «Ngày tạo» lấy từ đó (⛔ không thêm cột DB).
// ③ Bảng `official_correspondence` ⛔ KHÔNG có cột ảnh ⇒ upload dùng `AttachmentPanel` (khuôn nhiều tệp + lightbox
//    đã có sẵn ở `lib/ui-shared.tsx:295`, `input multiple` + `/api/files`) ⇒ ⛔ không thêm bảng/cột (REUSE §15).

import { StatusBadge } from "@/app/components/ui";
import { CardHead, Empty, Kpi, date } from "@/lib/ui-shared";
import { AttachmentPanel } from "@/lib/ui-shared";
import { BaseModal } from "@/lib/ui-blocks";
import type { AppData, Row } from "@/lib/ui-shared";
import { FormEvent, useState } from "react";
function CorrespondenceScreen({data,project,action,permission}:{data:AppData;project:string;action:(name:string,payload:Row)=>Promise<boolean>;permission:Row}){
  const rows=data.officialCorrespondence;
  // MT2-P10-04 — modal Tạo/Sửa công văn: `null` = đóng · `{}` = TẠO MỚI · có `id` = SỬA.
  const [editing, setEditing]=useState<Row|null>(null);
  async function saveCorr(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    const form=event.currentTarget;
    const fd=new FormData(form);
    const docNo=String(fd.get("docNo")||"");
    if(!docNo){window.alert("Nhập số công văn.");return;}
    const payload:Row=Object.fromEntries(fd);
    // ⛔ upsert có sẵn ở backend (`HrManagementUseCase:101-107`): có corrId ⇒ UPDATE, không ⇒ INSERT.
    if(editing?.id) payload.corrId=String(editing.id);
    if(await action("save_correspondence",payload)){form.reset();setEditing(null);}
  }
  const field=(name:string,label:string,input:React.ReactNode)=><label><span>{label}</span>{input}</label>;
  return <div className="stack module-screen">
  <div className="kpi-grid small"><Kpi icon="DN" label="Công văn đến" value={String(rows.filter((r)=>String(r.direction)==="IN").length)} note="Đã ghi nhận"/><Kpi icon="DI" label="Công văn đi" value={String(rows.filter((r)=>String(r.direction)==="OUT").length)} note="Đã ban hành"/><Kpi icon="XS" label="Đang xử lý" value={String(rows.filter((r)=>["received","processing"].includes(String(r.status))).length)} note="Chưa hoàn tất" tone="amber"/>
  {permission.canCreate&&<div className="row-actions"><button type="button" className="primary" data-vntech="corr-create" onClick={()=>setEditing({})}>＋ TẠO CÔNG VĂN</button></div>}</div>
  <section className="card"><CardHead title="Công văn đến / đi" note="Văn thư theo dõi công văn đến-đi, người xử lý nội bộ và kết quả."/>
  <div className="table-wrap"><table><thead><tr><th>Số CV</th><th>Hướng</th><th>Loại</th><th>Ngày</th><th>Ngày tạo</th><th>Gửi / Nhận</th><th>Trích yếu</th><th>Xử lý nội bộ</th><th>Trạng thái</th><th></th></tr></thead><tbody>{rows.map((r)=><tr key={r.id}><td>{r.docNo}</td><td><StatusBadge value={String(r.direction)==="IN"?"Đến":"Đi"}/></td><td>{r.docType}</td><td>{r.issueDate||"—"}</td><td title={r.createdByName?`Người tạo: ${r.createdByName}`:undefined}>{r.createdAt?date(r.createdAt):"—"}</td><td>{r.receiverName||r.senderName||"—"}</td><td>{r.summary||"—"}</td><td>{r.internalHandler||"—"}</td><td><StatusBadge value={r.status==="received"?"Đã nhận":r.status==="processing"?"Đang xử lý":r.status==="done"?"Hoàn tất":r.status}/></td><td>{permission.canEdit&&<><button className="export-mini" data-vntech="corr-edit" onClick={()=>setEditing(r)}>Sửa</button><button className="export-mini" onClick={()=>window.confirm("Đánh dấu hoàn tất?")&&action("set_correspondence_status",{corrId:r.id,status:"done"})}>Hoàn tất</button><button className="export-mini danger" onClick={()=>window.confirm("Xóa công văn?")&&action("delete_correspondence",{corrId:r.id})}>Xóa</button></>}</td></tr>)}{!rows.length&&<tr><td colSpan={10}><Empty text="Chưa có công văn."/></td></tr>}</tbody></table></div></section>
  {editing&&<BaseModal title={editing.id?"Sửa công văn":"Tạo công văn"} note="Số công văn · Hướng · Loại · Ngày · Người gửi · Người nhận · Trích yếu · Trạng thái · Ảnh/tài liệu liên quan." close={()=>setEditing(null)}>
    <form onSubmit={saveCorr}><div className="modal-body">
      <div className="form-grid" data-vntech="corr-form">
        {field("docNo","Số công văn *",<input name="docNo" required defaultValue={String(editing.docNo||"")}/>)}
        {field("direction","Hướng",<select name="direction" defaultValue={String(editing.direction||"IN")}><option value="IN">Công văn đến</option><option value="OUT">Công văn đi</option></select>)}
        {field("docType","Loại *",<select name="docType" required defaultValue={String(editing.docType||"")}><option value="">Loại *</option><option>Hành chính</option><option>Kỹ thuật</option><option>Pháp lý</option><option>Hợp đồng</option><option>Khác</option></select>)}
        {field("issueDate","Ngày",<input name="issueDate" type="date" defaultValue={String(editing.issueDate||"").slice(0,10)}/>)}
        {field("senderName","Người/đơn vị gửi",<input name="senderName" defaultValue={String(editing.senderName||"")}/>)}
        {field("receiverName","Người/đơn vị nhận",<input name="receiverName" defaultValue={String(editing.receiverName||"")}/>)}
        {field("summary","Trích yếu",<input name="summary" defaultValue={String(editing.summary||"")}/>)}
        {field("internalHandler","Người xử lý",<input name="internalHandler" defaultValue={String(editing.internalHandler||"")}/>)}
        {editing.id&&field("resultNote","Kết quả xử lý",<input name="resultNote" defaultValue={String(editing.resultNote||"")}/>)}
      </div>
      {editing.id
        ? <div data-vntech="corr-attachments"><CardHead title="Hình ảnh / tài liệu liên quan" note="Chọn NHIỀU tệp rồi tải lên một lượt (PDF/ảnh/Office)."/><AttachmentPanel entityType="correspondence" entityId={String(editing.id)}/></div>
        : <p className="muted">Hình ảnh / tài liệu liên quan: tạo & lưu công văn trước, rồi tải tệp lên tại tab Sửa.</p>}
    </div><footer className="modal-footer"><button className="primary" type="submit">Lưu công văn</button><button className="secondary" type="button" onClick={()=>setEditing(null)}>Đóng</button></footer></form>
  </BaseModal>}
  </div>;
}
export {
  CorrespondenceScreen,
};
