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
//
// USER 29/09/2026 (MỐC 55):
// «mục Hợp đồng lao động — đưa các nút chức năng vào trong modal lập hợp đồng. Cho modal này cho
//  phép user tải lên hình ảnh của hợp đồng. Khi user click vào hợp đồng thì sẽ hiển thị ra modal
//  thông tin của hợp đồng bao gồm cả hình ảnh đã tải lên.»
// ⇒ ① dải ô nhập liệu inline → MODAL «Lập hợp đồng» (kèm upload ảnh)
// ⇒ ② bấm vào 1 dòng hợp đồng → MODAL chi tiết (kèm ảnh đã tải lên)

import { StatusBadge } from "@/app/components/ui";
import { ListToolbar } from "@/app/components/ui/ListToolbar";
import { BaseModal } from "@/lib/ui-blocks";
import { CardHead, Empty, Kpi, UI_NOW_MS, date, money } from "@/lib/ui-shared";
import type { AppData, Row } from "@/lib/ui-shared";
import { ChangeEvent, FormEvent, useState } from "react";

// MỐC 55 — Ô CHỌN ẢNH data-URL (cùng cách `SignatureField` MỐC 39 đã dùng thật cho chữ ký).
// ⛔ KHÔNG dùng `FileUpload`/`AttachmentPanel`: nó gọi endpoint riêng `/api/files?entityType=…`
//    (bảng đính kèm) còn `labor_contracts.image_url` lưu data-URL ⇒ dùng picker nội tuyến.
function ContractImageField({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  const [error, setError] = useState("");
  function pick(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { setError("Chỉ hỗ trợ JPG, PNG hoặc WebP."); return; }
    if (file.size > 2.8 * 1024 * 1024) { setError("Ảnh hợp đồng tối đa 2,8 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => { onChange(String(reader.result || "")); setError(""); };
    reader.readAsDataURL(file);
  }
  return <div className="signature-field" data-vntech="labor-contract-image">
    <div className="signature-preview">{value ? <img src={value} alt="Ảnh hợp đồng"/> : <span className="muted">Chưa có ảnh hợp đồng</span>}</div>
    <div><strong>Ảnh hợp đồng</strong><p>JPG/PNG/WebP · tối đa 2,8 MB · <b>đúng 1 ảnh</b>; chọn ảnh mới sẽ <b>thay ảnh cũ</b>.</p>
      {error && <small className="red-text">{error}</small>}
      <div className="row-actions">
        <label className="secondary file-inline">{value ? "Thay ảnh hợp đồng" : "Chọn ảnh hợp đồng"}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={pick}/></label>
        {value ? <button type="button" className="secondary" onClick={() => onChange("")}>Xóa ảnh</button> : null}
      </div>
    </div>
  </div>;
}

function LaborScreen({data,project,action,permission}:{data:AppData;project:string;action:(name:string,payload:Row)=>Promise<boolean>;permission:Row}){
  const rows=data.laborContracts;const active=rows.filter((r)=>String(r.status)==="active");
  // MỐC 55 — thay dải nhập liệu inline bằng 2 modal.
  const [createOpen,setCreateOpen]=useState(false);
  const [detail,setDetail]=useState<Row|null>(null);
  // MØC 58-3 — sửa hợp đồng + thay ảnh (thời gian đổi ảnh lưu xuống CƢL đị)
  const [editing,setEditing]=useState(false);
  const [editImage,setEditImage]=useState("");
  const [query,setQuery]=useState("");
  const [imageUrl,setImageUrl]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");

  async function saveContract(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    const form=event.currentTarget;
    const fd=new FormData(form);
    const userId=String(fd.get("userId")||"");
    if(!userId){ setError("Chọn nhân sự."); return; }
    setBusy(true); setError("");
    try{
      const ok=await action("save_labor_contract",{ ...Object.fromEntries(fd), imageUrl });
      if(ok){ form.reset(); setImageUrl(""); setCreateOpen(false); }
    } finally{ setBusy(false); }
  }

  const types=[["probation","Thử việc"],["fixed_1y","Xác định thời hạn 1 năm"],["fixed_3y","Xác định thời hạn 3 năm"],["indefinite","Không xác định thời hạn"],["part_time","Bán thời gian"]];
  const visible=rows.filter((r)=>{const q=query.trim().toLowerCase();if(!q)return true;
    return [r.contractNo,r.fullName,r.contractType].some((v)=>String(v??"").toLowerCase().includes(q));});
  const fieldRows=(pairs:[string,unknown][])=>pairs.map(([k,v],i)=>(<tr key={i}><th style={{textAlign:"left",fontWeight:600,color:"#5b7185"}}>{k}</th><td>{String(v??"")||"—"}</td></tr>));

  return <div className="stack module-screen"><div className="kpi-grid small"><Kpi icon="HD" label="Hợp đồng đang hiệu lực" value={String(active.length)} note={`Tổng ${rows.length} hợp đồng`} tone="green"/><Kpi icon="HH" label="Sắp hết hạn (60 ngày)" value={String(active.filter((r)=>r.endDate&&((new Date(r.endDate).getTime()-UI_NOW_MS)/86400000)<=60&&((new Date(r.endDate).getTime()-UI_NOW_MS)/86400000)>=0).length)} note="Cần gia hạn" tone="amber"/><Kpi icon="TN" label="Thử việc" value={String(rows.filter((r)=>String(r.contractType)?.includes("Thử việc")||String(r.contractType)==="probation").length)} note="Đang thử việc"/><Kpi icon="KT" label="Đã kết thúc" value={String(rows.filter((r)=>String(r.status)==="ended").length)} note="Lưu lịch sử"/></div>
  <section className="card"><CardHead title="Hợp đồng lao động" note="Bấm vào một dòng để xem thông tin hợp đồng kèm ảnh đã tải lên. Loại hợp đồng thử việc / xác định thời hạn / không thời hạn; theo dõi hết hạn để gia hạn."/>
  {/* MỐC 55 — thanh công cụ: tìm kiếm + nút mở modal lập hợp đồng. */}
  <ListToolbar title="Danh sách hợp đồng" count={visible.length} total={rows.length} unit="hợp đồng"
    search={{value:query,onChange:setQuery,placeholder:"Tìm số HĐ · nhân sự · loại hợp đồng…"}}
    actions={permission.canCreate?<button type="button" className="primary" onClick={()=>{setImageUrl("");setError("");setCreateOpen(true);}}>＋ Lập HĐ</button>:null} />
  <div className="table-wrap"><table><thead><tr><th>Số HĐ</th><th>Nhân sự</th><th>Loại</th><th>Ký</th><th>Từ</th><th>Đến</th><th>Lương</th><th>Trạng thái</th><th></th></tr></thead><tbody>{visible.map((r)=><tr key={r.id} onClick={()=>setDetail(r)} title="Xem thông tin hợp đồng" style={{cursor:"pointer"}}><td><strong>{r.contractNo}</strong>{String(r.imageUrl||"")?" 📎":""}</td><td><strong>{r.fullName}</strong></td><td>{r.contractType}</td><td>{r.signingDate||"—"}</td><td>{r.startDate||"—"}</td><td>{r.endDate||"—"}</td><td>{money(r.salary)}</td><td><StatusBadge value={r.status==="active"?"Đang hiệu lực":r.status==="ended"?"Kết thúc":"Tạm ngừng"}/></td><td onClick={(e)=>e.stopPropagation()}>{permission.canEdit&&<><button className="export-mini" onClick={()=>action("set_labor_contract_status",{contractId:r.id,status:r.status==="active"?"ended":"active"})}>{r.status==="active"?"Kết thúc":"Mở lại"}</button><button className="export-mini danger" onClick={()=>window.confirm("Xóa hợp đồng?")&&action("delete_labor_contract",{contractId:r.id})}>Xóa</button></>}</td></tr>)}{!visible.length&&<tr><td colSpan={9}><Empty text={rows.length?"Không có hợp đồng nào khớp từ khoá.":"Chưa có hợp đồng lao động."}/></td></tr>}</tbody></table></div></section>

  {/* MỐC 55 — MODAL LẬP HỢP ĐỒNG (chứa toàn bộ ô + tải ảnh) */}
  {createOpen&&<BaseModal title="Lập hợp đồng lao động" note="Điền thông tin hợp đồng và tải lên ảnh chụp/scan hợp đồng (JPG · PNG · WebP, tối đa 2,8 MB)." close={()=>{setCreateOpen(false);setError("");}}>
    <form onSubmit={saveContract}><div className="modal-body" data-vntech="labor-contract-create"><div className="form-grid">
      <label className="span-2"><span>Nhân sự *</span><select name="userId" required defaultValue=""><option value="">— Chọn nhân sự —</option>{data.staffDirectory.map((u)=><option key={u.id} value={u.id}>{u.fullName} · {u.roleName||u.role||""}</option>)}</select></label>
      <label className="span-2"><span>Loại HĐ *</span><select name="contractType" required defaultValue=""><option value="">— Chọn loại —</option>{types.map(([code,label])=><option key={code} value={label}>{label}</option>)}</select></label>
      <label><span>Ngày ký</span><input name="signingDate" type="date"/></label>
      <label><span>Từ ngày</span><input name="startDate" type="date"/></label>
      <label><span>Đến ngày</span><input name="endDate" type="date"/></label>
      <label><span>Mức lương</span><input name="salary" type="number" min="0" step="1" placeholder="Mức lương"/></label>
      <label className="span-2"><span>Ghi chú</span><input name="note" placeholder="Ghi chú"/></label>
      <div className="span-2 signature-field-slot"><ContractImageField value={imageUrl} onChange={setImageUrl}/></div>
    </div>{error&&<div className="inline-alert danger" style={{marginTop:10}}>{error}</div>}</div>
    <footer className="modal-footer"><button type="button" className="secondary" onClick={()=>setCreateOpen(false)}>Hủy</button><button className="primary" disabled={busy}>{busy?"Đang lưu…":"Lưu hợp đồng"}</button></footer></form>
  </BaseModal>}

  {/* MỐC 55 — MODAL CHI TIẾT HỢP ĐỒNG (kèm ảnh đã tải lên) */}
  {detail&&<BaseModal title={`Hợp đồng · ${detail.contractNo||""}`} note="Thông tin đầy đủ và ảnh hợp đồng đã tải lên." close={()=>setDetail(null)}>
    <div className="modal-body" data-vntech="labor-contract-detail">
      <div className="table-wrap"><table><tbody>{fieldRows([
        ["Số hợp đồng",detail.contractNo],["Nhân sự",detail.fullName],["Loại hợp đồng",detail.contractType],
        ["Ngày ký",detail.signingDate],["Từ ngày",detail.startDate],["Đến ngày",detail.endDate],
        ["Mức lương",detail.salary!=null&&detail.salary!==""?money(detail.salary):null],
        ["Trạng thái",detail.status==="active"?"Đang hiệu lực":detail.status==="ended"?"Kết thúc":"Tạm ngừng"],
        ["Ghi chú",detail.note],
        ["Cập nhật ảnh lúc",detail.imageUpdatedAt?date(String(detail.imageUpdatedAt)):"—"],
      ])}</tbody></table></div>
      <div style={{marginTop:14}}><b style={{fontSize:"calc(10px * var(--user-font-scale))"}}>Ảnh hợp đồng</b>
        {String(detail.imageUrl||"")
          ? <img src={String(detail.imageUrl)} alt={`Ảnh hợp đồng ${detail.contractNo||""}`} style={{maxWidth:"100%",borderRadius:10,marginTop:8,border:"1px solid #e3e9f1"}}/>
          : <p className="muted" style={{marginTop:6}}>Chưa tải ảnh cho hợp đồng này.</p>}
      </div>
    </div>
    <footer className="modal-footer">{permission.canEdit&&<button type="button" className="secondary" onClick={()=>{setEditImage(String(detail.imageUrl||""));setEditing(true);}}>✎ Sửa</button>}<button type="button" className="primary" onClick={()=>setDetail(null)}>Đóng</button></footer>
  </BaseModal>}
  {/* MỐC 58-3 — MODAL SỬA HỢP ĐỒNG + THAY ẢNH (thời gian đổi ảnh do backend ghi vào CSDL) */}
  {editing&&detail&&<BaseModal title={`Sửa hợp đồng · ${detail.contractNo||""}`} note="Cập nhật thông tin hợp đồng và thay ảnh. Thời gian thay ảnh được hệ thống ghi lại tự động." close={()=>setEditing(false)}>
    <form onSubmit={async (ev)=>{ev.preventDefault();const fd=new FormData(ev.currentTarget);
      if(await action("save_labor_contract",{...Object.fromEntries(fd),contractId:detail.id,imageUrl:editImage})){
        setEditing(false); setDetail(null);}}}><div className="modal-body" data-vntech="labor-contract-edit"><div className="form-grid">
      <label className="span-2"><span>Nhân sự *</span><select name="userId" required defaultValue={String(detail.userId||"")}><option value="">— Chọn nhân sự —</option>{data.staffDirectory.map((u)=><option key={u.id} value={u.id}>{u.fullName} · {u.roleName||u.role||""}</option>)}</select></label>
      <label className="span-2"><span>Loại HĐ *</span><select name="contractType" required defaultValue={String(detail.contractType||"")}><option value="">— Chọn loại —</option>{types.map(([code,label])=><option key={code} value={label}>{label}</option>)}</select></label>
      <label><span>Ngày ký</span><input name="signingDate" type="date" defaultValue={String(detail.signingDate||"").slice(0,10)}/></label>
      <label><span>Từ ngày</span><input name="startDate" type="date" defaultValue={String(detail.startDate||"").slice(0,10)}/></label>
      <label><span>Đến ngày</span><input name="endDate" type="date" defaultValue={String(detail.endDate||"").slice(0,10)}/></label>
      <label><span>Mức lương</span><input name="salary" type="number" min="0" step="1" defaultValue={String(detail.salary??"")}/></label>
      <label className="span-2"><span>Ghi chú</span><input name="note" defaultValue={String(detail.note||"")}/></label>
      <div className="span-2"><ContractImageField value={editImage} onChange={setEditImage}/></div>
    </div></div><footer className="modal-footer"><button type="button" className="secondary" onClick={()=>setEditing(false)}>Hủy</button><button className="primary" disabled={busy}>{busy?"Đang lưu…":"Lưu thay đổi"}</button></footer></form>
  </BaseModal>}
  </div>;
}
export {
  LaborScreen,
};
