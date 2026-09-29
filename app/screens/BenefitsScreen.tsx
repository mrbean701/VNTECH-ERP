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
// USER 29/09/2026 (MỐC 56-5):
// «Mục Bảo hiểm & chế độ — loại bỏ các nút chức năng đi, chuyển vào modal Thêm Bảo hiểm & Chế độ.
//  Click vào nhân sự trong danh sách sẽ hiển thị ra modal chi tiết.»
// ⇒ ① dải ô inline → MODAL «Thêm Bảo hiểm & Chế độ» (dùng lại đúng khuôn của MỐC 55 `LaborScreen`)
// ⇒ ② bấm 1 dòng → MODAL CHI TIẾT.

import { StatusBadge } from "@/app/components/ui";
import { ListToolbar } from "@/app/components/ui/ListToolbar";
import { BaseModal } from "@/lib/ui-blocks";
import { CardHead, Empty, Kpi, date, money } from "@/lib/ui-shared";
import type { AppData, Row } from "@/lib/ui-shared";
import { FormEvent, useState } from "react";

function BenefitsScreen({data,project,action,permission}:{data:AppData;project:string;action:(name:string,payload:Row)=>Promise<boolean>;permission:Row}){
  const rows=data.benefitRecords;
  // MỐC 56-5 — thay dải nhập liệu inline bằng 2 modal.
  const [createOpen,setCreateOpen]=useState(false);
  const [detail,setDetail]=useState<Row|null>(null);
  // MØC 58-4 — sửa ngay trong modal chi tiết (dùng form modal Thêm).
  const [editing,setEditing]=useState(false);
  const [query,setQuery]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");

  async function saveBenefit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    const form=event.currentTarget;
    const fd=new FormData(form);
    const userId=String(fd.get("userId")||"");
    if(!userId){ setError("Chọn nhân sự."); return; }
    setBusy(true); setError("");
    try{
      const ok=await action("save_benefit_record",Object.fromEntries(fd));
      if(ok){ form.reset(); setCreateOpen(false); }
    } finally{ setBusy(false); }
  }

  const types=[["social","BHXH"],["health","BHYT"],["unemployment","BHTN"],["other","Chế độ khác"]];
  const visible=rows.filter((r)=>{const q=query.trim().toLowerCase();if(!q)return true;
    return [r.benefitNo,r.fullName,r.benefitType,r.provider].some((v)=>String(v??"").toLowerCase().includes(q));});
  const fieldRows=(pairs:[string,unknown][])=>pairs.map(([k,v],i)=>(<tr key={i}><th style={{textAlign:"left",fontWeight:600,color:"#5b7185"}}>{k}</th><td>{String(v??"")||"—"}</td></tr>));

  return <div className="stack module-screen"><div className="kpi-grid small"><Kpi icon="BH" label="Đang theo dõi" value={String(rows.filter((r)=>String(r.status)==="active").length)} note={`Tổng ${rows.length}`} tone="green"/><Kpi icon="TI" label="Mức đóng tháng" value={money(rows.filter((r)=>String(r.status)==="active").reduce((s,r)=>s+Number(r.monthlyAmount||0),0))} note="Cộng dồn"/></div>
  <section className="card"><CardHead title="Bảo hiểm & Chế độ" note="Bấm vào một dòng để xem thông tin chi tiết. Theo dõi BHXH/BHYT/BHTN và chế độ theo nhân sự; nhắc gia hạn theo thời hạn."/>
  {/* MỐC 56-5 — thanh công cụ: tìm kiếm + nút mở modal thêm. */}
  <ListToolbar title="Danh sách bản ghi" count={visible.length} total={rows.length} unit="bản ghi"
    search={{value:query,onChange:setQuery,placeholder:"Tìm mã · nhân sự · loại · đơn vị…"}}
    actions={permission.canCreate?<button type="button" className="primary" onClick={()=>{setError("");setCreateOpen(true);}}>＋ Thêm Bảo hiểm &amp; Chế độ</button>:null} />
  <div className="table-wrap"><table><thead><tr><th>Mã</th><th>Nhân sự</th><th>Loại</th><th>Đơn vị</th><th>Từ</th><th>Đến</th><th>Mức đóng</th><th>Trạng thái</th><th></th></tr></thead><tbody>{visible.map((r)=><tr key={r.id} onClick={()=>setDetail(r)} title="Xem thông tin chi tiết" style={{cursor:"pointer"}}><td><strong>{r.benefitNo}</strong></td><td><strong>{r.fullName}</strong></td><td>{r.benefitType}</td><td>{r.provider||"—"}</td><td>{r.startDate||"—"}</td><td>{r.endDate||"—"}</td><td>{money(r.monthlyAmount)}</td><td><StatusBadge value={String(r.status)==="active"?"Đang tham gia":"Đã dừng"}/></td><td onClick={(e)=>e.stopPropagation()}>{permission.canEdit&&<><button className="export-mini" onClick={()=>action("set_benefit_record_status",{benefitId:r.id,status:String(r.status)==="active"?"inactive":"active"})}>{String(r.status)==="active"?"Dừng":"Mở lại"}</button><button className="export-mini danger" onClick={()=>window.confirm("Xóa bản ghi?")&&action("delete_benefit_record",{benefitId:r.id})}>Xóa</button></>}</td></tr>)}{!visible.length&&<tr><td colSpan={9}><Empty text={rows.length?"Không có bản ghi nào khớp từ khoá.":"Chưa có bản ghi bảo hiểm & chế độ."}/></td></tr>}</tbody></table></div></section>

  {/* MỐC 56-5 — MODAL THÊM BẢO HIỂM & CHẾ ĐỘ */}
  {createOpen&&<BaseModal title="Thêm Bảo hiểm & Chế độ" note="Ghi nhận một bản ghi bảo hiểm hoặc chế độ cho nhân sự." close={()=>{setCreateOpen(false);setError("");}}>
    <form onSubmit={saveBenefit}><div className="modal-body" data-vntech="benefit-create"><div className="form-grid">
      <label className="span-2"><span>Nhân sự *</span><select name="userId" required defaultValue=""><option value="">— Chọn nhân sự —</option>{data.staffDirectory.map((u)=><option key={u.id} value={u.id}>{u.fullName}</option>)}</select></label>
      <label className="span-2"><span>Loại *</span><select name="benefitType" required defaultValue=""><option value="">— Chọn loại —</option>{types.map(([code,label])=><option key={code} value={label}>{label}</option>)}</select></label>
      <label><span>Đơn vị cung cấp</span><input name="provider" placeholder="Đơn vị cung cấp"/></label>
      <label><span>Mức đóng tháng</span><input name="monthlyAmount" type="number" min="0" step="1" placeholder="Mức đóng tháng"/></label>
      <label><span>Từ ngày</span><input name="startDate" type="date"/></label>
      <label><span>Đến ngày</span><input name="endDate" type="date"/></label>
      <label className="span-2"><span>Ghi chú</span><input name="note" placeholder="Ghi chú"/></label>
    </div>{error&&<div className="inline-alert danger" style={{marginTop:10}}>{error}</div>}</div>
    <footer className="modal-footer"><button type="button" className="secondary" onClick={()=>setCreateOpen(false)}>Hủy</button><button className="primary" disabled={busy}>{busy?"Đang lưu…":"Lưu bản ghi"}</button></footer></form>
  </BaseModal>}

  {/* MỐC 56-5 — MODAL CHI TIẾT BẢN GHI */}
  {detail&&<BaseModal title={`Bảo hiểm & Chế độ · ${detail.benefitNo||""}`} note="Thông tin đầy đủ của bản ghi đã chọn." close={()=>setDetail(null)}>
    <div className="modal-body" data-vntech="benefit-detail">
      <div className="table-wrap"><table><tbody>{fieldRows([
        ["Mã bản ghi",detail.benefitNo],["Nhân sự",detail.fullName],["Loại",detail.benefitType],
        ["Đơn vị cung cấp",detail.provider],["Từ ngày",detail.startDate],["Đến ngày",detail.endDate],
        ["Mức đóng tháng",detail.monthlyAmount!=null&&detail.monthlyAmount!==""?money(detail.monthlyAmount):null],
        ["Trạng thái",detail.status==="active"?"Đang tham gia":"Đã dừng"],
        ["Ghi chú",detail.note],
      ])}</tbody></table></div>
    </div>
    <footer className="modal-footer">{permission.canEdit&&<button type="button" className="secondary" onClick={()=>setEditing(true)}>✎ Sửa</button>}<button type="button" className="primary" onClick={()=>setDetail(null)}>Đóng</button></footer>

    {editing&&detail&&<div className="overlay modal-overlay" onMouseDown={(ev)=>ev.target===ev.currentTarget&&setEditing(false)}><section className="modal"><header><div><h2>Sửa bản ghi · {detail.benefitNo||""}</h2><p>Cậd bất giữ người của nhân sự</p></div><button type="button" onClick={()=>setEditing(false)}>×</button></header>
      <form onSubmit={async (ev)=>{ev.preventDefault();const fd=new FormData(ev.currentTarget);if(await action("save_benefit_record",{...Object.fromEntries(fd),benefitId:detail.id}))setEditing(false);}}><div className="modal-body" data-vntech="benefit-edit"><div className="form-grid">
        <label className="span-2"><span>Nhân sự *</span><select name="userId" required defaultValue={String(detail.userId||"")}><option value="">— Chọn nhân sự —</option>{data.staffDirectory.map((u)=><option key={u.id} value={u.id}>{u.fullName}</option>)}</select></label>
        <label className="span-2"><span>Loại *</span><select name="benefitType" required defaultValue={String(detail.benefitType||"")}><option value="">— Chọn loại —</option>{types.map(([code,label])=><option key={code} value={label}>{label}</option>)}</select></label>
        <label><span>Đơn vị cung cấp</span><input name="provider" defaultValue={String(detail.provider||"")}/></label>
        <label><span>Mức đóng tháng</span><input name="monthlyAmount" type="number" min="0" step="1" defaultValue={String(detail.monthlyAmount??"")}/></label>
        <label><span>Từ ngày</span><input name="startDate" type="date" defaultValue={String(detail.startDate||"").slice(0,10)}/></label>
        <label><span>Đến ngày</span><input name="endDate" type="date" defaultValue={String(detail.endDate||"").slice(0,10)}/></label>
        <label className="span-2"><span>Ghi chú</span><input name="note" defaultValue={String(detail.note||"")}/></label>
      </div></div><footer className="modal-footer"><button type="button" className="secondary" onClick={()=>setEditing(false)}>Hủy</button><button className="primary">Lưu thay đổi</button></footer></form>
    </section></div>}
  </BaseModal>}
  </div>;
}
export {
  BenefitsScreen,
};
