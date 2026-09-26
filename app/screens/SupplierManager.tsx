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

import { ListToolbar } from "@/app/components/ui";
// MT2-P8-05 (§6.3) — MODAL CHI TIẾT NCC (3 tab: Thông tin · PO · Danh sách vật tư).
import { SupplierDetailModal } from "@/app/screens/SupplierDetailModal";
import { supplierToPurchaseOrderChain } from "@/lib/p08-nav-trace";
import type { P08Data } from "@/lib/p08-nav-trace";
import { isAdminUser, roleBase } from "@/lib/permissions";
import { P08SupplierNavigation } from "@/app/screens/P08SupplierNavigation";
import { CardHead, Empty } from "@/lib/ui-shared";
import type { AppData, Row } from "@/lib/ui-shared";
import { FormEvent, useState } from "react";
// PHASE 7 (`P-07`) — 2 MỤC MENU «Nhà cung cấp» / «Đối tác» mở CÙNG màn này, khác nhau ở prop `view`
// (`lib/menu-helpers.ts` → `supplierPartnerMenuItems` → `app/page.tsx`). `view` CHỈ đổi TIÊU ĐỀ + cảnh báo,
// KHÔNG tạo loại dữ liệu mới. ⚠️ Audit `TASK-111` đo được hệ thống CHỈ có bảng nhà cung cấp (`suppliers`) —
// KHÔNG có cột/bảng «đối tác» ⇒ KHÔNG bịa dữ liệu: chế độ «Đối tác» nói RÕ là chưa có nguồn riêng.
function SupplierManager({data,action,view,open,loadGaps}:{data:AppData;action:(name:string,payload:Row)=>Promise<boolean>;view?:"supplier"|"partner"|null;open?:(name:string,row?:Row)=>void;/** MT2-P8-06 (§6.4) — nạp vật tư thiếu của 1 PO (⚠️ `action` ⛔ không trả payload nên phải tách). */loadGaps?:(purchaseOrderId:string)=>Promise<Row[]>}){
  const partnerView=view==="partner";
  // MT2-P8-04 (§6.2) — «Create Supplier: ⛔ không dùng side form ⇒ MỞ MODAL RIÊNG».
  // ⚠️ TRƯỚC: form tạo NCC nằm INLINE trong `<section className="card">`. NAY: ẩn vào MODAL (§23) ✔.
  const [openCreate,setOpenCreate]=useState(false);
  // MT2-P8-03 (§6.2) — «Danh mục NCC phải có Create·Read·Update·Delete·**Search·Sort·Filter**».
  // ✅ TÁI DÙNG `ListToolbar` (ĐÃ CÓ — `app/components/ui/ListToolbar.tsx`) theo §15, ⛔ KHÔNG viết mới.
  const [supQuery,setSupQuery]=useState("");
  const [supSort,setSupSort]=useState("code");
  const [supActive,setSupActive]=useState("all");
  // MT2-P8-05 (§6.3) — NCC đang mở MODAL CHI TIẾT (null = không mở). ⛔ KHÔNG bịa: chuỗi NCC→PO→Vật tư
  // lấy từ hàm THUẦN `supplierToPurchaseOrderChain` (`lib/p08-nav-trace.ts`) — ✅ TÁI DÙNG (§15).
  const [detail,setDetail]=useState<Row|null>(null);
  const p08: P08Data = {
    suppliers: data.suppliers as Row[],
    purchaseOrders: data.purchaseOrders as Row[],
    materials: data.materials as Row[],
    requests: data.requests as Row[],
  };
  const chain = detail ? supplierToPurchaseOrderChain(p08, detail) : null;
  // MT2-P8-02 (§6.1) — ĐỔI TÊN: «Danh mục Nhà cung cấp dùng cho PO» ⇒ «Danh mục Nhà cung cấp».
  // ⚠️ §6.1 nguyên văn: «Đổi "Danh mục nhà cung cấp dùng cho PO" ⇒ "Danh mục nhà cung cấp".»
  // ✅ ĐÃ KHỚP SẴN: `lib/menu-helpers.ts:83` + `app/page.tsx:152` + `tests/p07-supplier-partner-split-probe.mjs:35`.
  const headTitle=partnerView?"Đối tác":"Danh mục Nhà cung cấp";
  const headNote=partnerView?"CHƯA CÓ NGUỒN DỮ LIỆU ĐỐI TÁC RIÊNG: hệ thống hiện chỉ có danh mục nhà cung cấp (bảng suppliers). Danh sách dưới đây là NHÀ CUNG CẤP — không phải đối tác.":"Mã NCC được dùng trong mẫu Excel lập PO. Ẩn NCC không xóa PO/lịch sử cũ.";
  const rows=data.adminSuppliers?.length?data.adminSuppliers:data.suppliers; const canDeleteSupplier=isAdminUser(data.user)||String(data.user.role)==="kh_truong"||roleBase(data.user)==="kh_truong";
  // MT2-P8-03 (§6.2) — SEARCH (mã/tên/MST/liên hệ/điện thoại/email) · FILTER (đang dùng/ngừng) · SORT.
  const supFiltered=rows.filter((row)=>{
    const q=supQuery.trim().toLowerCase();
    const hit=!q||[row.code,row.name,row.taxCode,row.contactName,row.phone,row.email].some((v)=>String(v||"").toLowerCase().includes(q));
    const act=supActive==="all"||(supActive==="on"?Boolean(row.active):!row.active);
    return hit&&act;
  });
  const supRows=[...supFiltered].sort((a,b)=>supSort==="name"?String(a.name||"").localeCompare(String(b.name||"")):String(a.code||"").localeCompare(String(b.code||"")));
  async function saveForm(event:FormEvent<HTMLFormElement>,supplier?:Row){event.preventDefault();const payload=Object.fromEntries(new FormData(event.currentTarget));const supplierId=supplier?.id;const active=supplier?(supplier.active?1:0):1;if(await action("save_supplier",{...payload,supplierId,active})&&!supplierId)(event.currentTarget as HTMLFormElement).reset();}
  return <><section className="card"><ListToolbar title={headTitle} note={headNote} count={supRows.length} total={rows.length} unit="NCC" search={{value:supQuery,onChange:setSupQuery,placeholder:"Tìm mã / tên / MST / liên hệ / email"}} filters={[{key:"status",label:"Trạng thái",value:supActive,onChange:setSupActive,options:[{value:"all",label:"Tất cả"},{value:"on",label:"Đang dùng"},{value:"off",label:"Ngừng dùng"}]}]} sort={{value:supSort,onChange:setSupSort,options:[{value:"code",label:"Mã NCC"},{value:"name",label:"Tên NCC"}]}} actions={<button type="button" className="primary" onClick={()=>setOpenCreate(true)} title="Mở MODAL thêm nhà cung cấp">＋ THÊM NCC</button>}/></section>{openCreate&&<div className="overlay" onMouseDown={(event)=>event.target===event.currentTarget&&setOpenCreate(false)}><section className="card supplier-create-modal" role="dialog" aria-modal="true" aria-label="Thêm nhà cung cấp"><header><div><small className="document-name">THÊM NHÀ CUNG CẤP</small><strong>{headTitle}</strong></div><button type="button" onClick={()=>setOpenCreate(false)} title="Đóng">×</button></header><form className="supplier-new-grid" onSubmit={(event)=>saveForm(event)}><input name="code" placeholder="Mã NCC *" required/><input name="name" placeholder="Tên nhà cung cấp *" required/><input name="taxCode" placeholder="Mã số thuế"/><input name="contactName" placeholder="Người liên hệ"/><input name="phone" placeholder="Điện thoại"/><input name="email" type="email" placeholder="Email"/><input name="leadTimeDays" type="number" min="0" defaultValue="0" placeholder="Lead time"/><input name="rating" type="number" min="0" max="5" step="0.1" defaultValue="0" placeholder="Đánh giá"/><div className="row-actions"><button className="primary" type="submit">✓ Lưu NCC</button><button type="button" className="secondary" onClick={()=>setOpenCreate(false)}>Hủy</button></div></form></section></div>}<section className="card"><div className="supplier-admin-list">{supRows.map(row=><form className={`supplier-admin-row ${row.active?"":"inactive"}`} key={row.id} onSubmit={(event)=>saveForm(event,row)}><input name="code" defaultValue={row.code} required/><input name="name" defaultValue={row.name} required/><input name="taxCode" defaultValue={row.taxCode||""} placeholder="MST"/><input name="contactName" defaultValue={row.contactName||""} placeholder="Liên hệ"/><input name="phone" defaultValue={row.phone||""} placeholder="Điện thoại"/><input name="email" type="email" defaultValue={row.email||""} placeholder="Email"/><input name="leadTimeDays" type="number" min="0" defaultValue={row.leadTimeDays||0}/><input name="rating" type="number" min="0" max="5" step="0.1" defaultValue={row.rating||0}/><button type="button" className="export-mini" onClick={()=>setDetail(row)} title="Mở MODAL chi tiết NCC (§6.3)">Chi tiết</button><button className="export-mini" type="submit">Lưu</button><button type="button" className={`export-mini ${row.active?"danger":""}`} onClick={()=>action("set_supplier_status",{supplierId:row.id,active:row.active?0:1})}>{row.active?"Ngừng sử dụng":"Kích hoạt"}</button>{canDeleteSupplier&&<button type="button" className="export-mini danger" onClick={()=>window.confirm(`Xóa/ngừng sử dụng NCC ${row.code}? NCC đã có PO sẽ chỉ được ngừng sử dụng.`)&&action("delete_supplier",{supplierId:row.id})}>Xóa</button>}</form>)}{!supRows.length&&<Empty text="Chưa có Nhà cung cấp khớp bộ lọc. Hãy thêm NCC hoặc xoá bộ lọc."/>}</div></section>{detail&&chain&&<SupplierDetailModal supplier={detail} purchaseOrders={chain.purchaseOrders} materialLines={chain.materialLines} onClose={()=>setDetail(null)} openPo={open?((po)=>open("poDetail",po)):undefined} action={action} loadGaps={loadGaps}/>}{!partnerView&&open&&<P08SupplierNavigation data={data} open={open}/>}</>;
}


export {
  SupplierManager,
};