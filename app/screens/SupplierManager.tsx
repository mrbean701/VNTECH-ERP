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

import { isAdminUser, roleBase } from "@/lib/permissions";
import { P08SupplierNavigation } from "@/app/screens/P08SupplierNavigation";
import { CardHead, Empty } from "@/lib/ui-shared";
import type { AppData, Row } from "@/lib/ui-shared";
import { FormEvent } from "react";
// PHASE 7 (`P-07`) — 2 MỤC MENU «Nhà cung cấp» / «Đối tác» mở CÙNG màn này, khác nhau ở prop `view`
// (`lib/menu-helpers.ts` → `supplierPartnerMenuItems` → `app/page.tsx`). `view` CHỈ đổi TIÊU ĐỀ + cảnh báo,
// KHÔNG tạo loại dữ liệu mới. ⚠️ Audit `TASK-111` đo được hệ thống CHỈ có bảng nhà cung cấp (`suppliers`) —
// KHÔNG có cột/bảng «đối tác» ⇒ KHÔNG bịa dữ liệu: chế độ «Đối tác» nói RÕ là chưa có nguồn riêng.
function SupplierManager({data,action,view,open}:{data:AppData;action:(name:string,payload:Row)=>Promise<boolean>;view?:"supplier"|"partner"|null;open?:(name:string,row?:Row)=>void}){
  const partnerView=view==="partner";
  const headTitle=partnerView?"Đối tác":"Danh mục Nhà cung cấp dùng cho PO";
  const headNote=partnerView?"CHƯA CÓ NGUỒN DỮ LIỆU ĐỐI TÁC RIÊNG: hệ thống hiện chỉ có danh mục nhà cung cấp (bảng suppliers). Danh sách dưới đây là NHÀ CUNG CẤP — không phải đối tác.":"Mã NCC được dùng trong mẫu Excel lập PO. Ẩn NCC không xóa PO/lịch sử cũ.";
  const rows=data.adminSuppliers?.length?data.adminSuppliers:data.suppliers; const canDeleteSupplier=isAdminUser(data.user)||String(data.user.role)==="kh_truong"||roleBase(data.user)==="kh_truong";
  async function saveForm(event:FormEvent<HTMLFormElement>,supplier?:Row){event.preventDefault();const payload=Object.fromEntries(new FormData(event.currentTarget));const supplierId=supplier?.id;const active=supplier?(supplier.active?1:0):1;if(await action("save_supplier",{...payload,supplierId,active})&&!supplierId)(event.currentTarget as HTMLFormElement).reset();}
  return <><section className="card"><CardHead title={headTitle} note={headNote}/><form className="supplier-new-grid" onSubmit={(event)=>saveForm(event)}><input name="code" placeholder="Mã NCC *" required/><input name="name" placeholder="Tên nhà cung cấp *" required/><input name="taxCode" placeholder="Mã số thuế"/><input name="contactName" placeholder="Người liên hệ"/><input name="phone" placeholder="Điện thoại"/><input name="leadTimeDays" type="number" min="0" defaultValue="0" placeholder="Lead time"/><input name="rating" type="number" min="0" max="5" step="0.1" defaultValue="0" placeholder="Đánh giá"/><button className="primary">＋ Thêm NCC</button></form><div className="supplier-admin-list">{rows.map(row=><form className={`supplier-admin-row ${row.active?"":"inactive"}`} key={row.id} onSubmit={(event)=>saveForm(event,row)}><input name="code" defaultValue={row.code} required/><input name="name" defaultValue={row.name} required/><input name="taxCode" defaultValue={row.taxCode||""} placeholder="MST"/><input name="contactName" defaultValue={row.contactName||""} placeholder="Liên hệ"/><input name="phone" defaultValue={row.phone||""} placeholder="Điện thoại"/><input name="leadTimeDays" type="number" min="0" defaultValue={row.leadTimeDays||0}/><input name="rating" type="number" min="0" max="5" step="0.1" defaultValue={row.rating||0}/><button className="export-mini" type="submit">Lưu</button><button type="button" className={`export-mini ${row.active?"danger":""}`} onClick={()=>action("set_supplier_status",{supplierId:row.id,active:row.active?0:1})}>{row.active?"Ngừng sử dụng":"Kích hoạt"}</button>{canDeleteSupplier&&<button type="button" className="export-mini danger" onClick={()=>window.confirm(`Xóa/ngừng sử dụng NCC ${row.code}? NCC đã có PO sẽ chỉ được ngừng sử dụng.`)&&action("delete_supplier",{supplierId:row.id})}>Xóa</button>}</form>)}{!rows.length&&<Empty text="Chưa có Nhà cung cấp. Hãy thêm NCC trước khi lập PO."/>}</div></section>{!partnerView&&open&&<P08SupplierNavigation data={data} open={open}/>}</>;
}


export {
  SupplierManager,
};