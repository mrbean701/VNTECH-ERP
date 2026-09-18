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
import { CardHead, Empty, Kpi, UI_NOW_MS, date } from "@/lib/ui-shared";
import type { AppData, Row } from "@/lib/ui-shared";
import { FormEvent } from "react";
function LegalDocsScreen({data,project,action,permission}:{data:AppData;project:string;action:(name:string,payload:Row)=>Promise<boolean>;permission:Row}){
  const rows=data.legalDocuments;
  async function saveDoc(event:FormEvent<HTMLFormElement>){event.preventDefault();if(await action("save_legal_document",Object.fromEntries(new FormData(event.currentTarget))))(event.currentTarget as HTMLFormElement).reset();}
  return <div className="stack module-screen"><div className="kpi-grid small"><Kpi icon="VB" label="Văn bản đang hiệu lực" value={String(rows.filter((r)=>String(r.status)==="active").length)} note={`Tổng ${rows.length}`} tone="green"/><Kpi icon="HH" label="Sắp hết hiệu lực" value={String(rows.filter((r)=>r.expiryDate&&((new Date(r.expiryDate).getTime()-UI_NOW_MS)/86400000)<=90&&((new Date(r.expiryDate).getTime()-UI_NOW_MS)/86400000)>=0).length)} note="Trong 90 ngày" tone="amber"/></div>
  <section className="card"><CardHead title="Văn bản pháp lý" note="Hợp đồng, phụ lục, quyết định, giấy phép; theo dõi hiệu lực và file đính kèm."/>{permission.canCreate&&<form className="payment-entry-inline legal-doc-form" onSubmit={saveDoc}><input name="docNo" placeholder="Số VB *" required/><select name="docType" defaultValue=""><option value="">Loại *</option><option>Hợp đồng</option><option>Phụ lục</option><option>Quyết định</option><option>Giấy phép</option><option>Công văn quy phạm</option><option>Khác</option></select><input name="title" placeholder="Tiêu đề *" required/><input name="issueDate" type="date"/><input name="issuer" placeholder="Cơ quan ban hành"/><input name="effectiveDate" type="date"/><input name="expiryDate" type="date"/><input name="scope" placeholder="Phạm vi áp dụng"/><button className="primary">＋ Lưu VB</button></form>}
  <div className="table-wrap"><table><thead><tr><th>Số VB</th><th>Loại</th><th>Tiêu đề</th><th>Ban hành</th><th>Cơ quan</th><th>Hiệu lực</th><th>Hết hạn</th><th>Phạm vi</th><th>Trạng thái</th><th></th></tr></thead><tbody>{rows.map((r)=><tr key={r.id}><td>{r.docNo}</td><td>{r.docType}</td><td><strong>{r.title}</strong></td><td>{r.issueDate||"—"}</td><td>{r.issuer||"—"}</td><td>{r.effectiveDate||"—"}</td><td>{r.expiryDate||"—"}</td><td>{r.scope||"—"}</td><td><StatusBadge value={String(r.status)==="active"?"Hiệu lực":"Hết hiệu lực"}/></td><td>{permission.canEdit&&<><button className="export-mini" onClick={()=>action("set_legal_document_status",{docId:r.id,status:String(r.status)==="active"?"inactive":"active"})}>{String(r.status)==="active"?"Hết HL":"Mở lại"}</button><button className="export-mini danger" onClick={()=>window.confirm("Xóa văn bản?")&&action("delete_legal_document",{docId:r.id})}>Xóa</button></>}</td></tr>)}{!rows.length&&<tr><td colSpan={10}><Empty text="Chưa có văn bản pháp lý."/></td></tr>}</tbody></table></div></section>
  </div>;
}
export {
  LegalDocsScreen,
};