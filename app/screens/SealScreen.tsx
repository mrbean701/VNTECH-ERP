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
import { CardHead, Empty, date } from "@/lib/ui-shared";
import type { AppData, Row } from "@/lib/ui-shared";
import { FormEvent } from "react";
function SealScreen({data,project,action,permission}:{data:AppData;project:string;action:(name:string,payload:Row)=>Promise<boolean>;permission:Row}){
  const rows=data.sealManagement;
  async function saveSeal(event:FormEvent<HTMLFormElement>){event.preventDefault();if(await action("save_seal",Object.fromEntries(new FormData(event.currentTarget))))(event.currentTarget as HTMLFormElement).reset();}
  return <div className="stack module-screen"><section className="card"><CardHead title="Con dấu / Ủy quyền" note="Đăng ký con dấu, người quản lý và ghi chú sử dụng; theo dõi trạng thái hoạt động."/>{permission.canCreate&&<form className="payment-entry-inline seal-form" onSubmit={saveSeal}><input name="sealNo" placeholder="Số hiệu *" required/><input name="sealName" placeholder="Tên con dấu *" required/><select name="sealType" defaultValue="company"><option value="company">Dấu công ty</option><option value="legal">Dấu pháp nhân</option><option value="signature">Dấu chức danh</option><option value="other">Khác</option></select><input name="custodian" placeholder="Người quản lý"/><input name="registeredDate" type="date"/><input name="usageNote" placeholder="Ghi chú sử dụng"/><button className="primary">＋ Đăng ký</button></form>}
  <div className="table-wrap"><table><thead><tr><th>Số hiệu</th><th>Tên</th><th>Loại</th><th>Người quản lý</th><th>Ngày đăng ký</th><th>Ghi chú</th><th>Trạng thái</th><th></th></tr></thead><tbody>{rows.map((r)=><tr key={r.id}><td>{r.sealNo}</td><td><strong>{r.sealName}</strong></td><td>{r.sealType}</td><td>{r.custodian||"—"}</td><td>{r.registeredDate||"—"}</td><td>{r.usageNote||"—"}</td><td><StatusBadge value={String(r.status)==="active"?"Đang dùng":"Đã thu hồi"}/></td><td>{permission.canEdit&&<><button className="export-mini" onClick={()=>action("set_seal_status",{sealId:r.id,status:String(r.status)==="active"?"inactive":"active"})}>{String(r.status)==="active"?"Thu hồi":"Mở lại"}</button><button className="export-mini danger" onClick={()=>window.confirm("Xóa đăng ký?")&&action("delete_seal",{sealId:r.id})}>Xóa</button></>}</td></tr>)}{!rows.length&&<tr><td colSpan={8}><Empty text="Chưa có đăng ký con dấu."/></td></tr>}</tbody></table></div></section>
  </div>;
}
export {
  SealScreen,
};