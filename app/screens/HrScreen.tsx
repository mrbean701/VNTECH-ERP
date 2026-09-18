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

import { CardHead, Empty, Kpi, date } from "@/lib/ui-shared";
import type { AppData, Row } from "@/lib/ui-shared";
import { FormEvent } from "react";
function HrScreen({data,project,action,permission,open}:{data:AppData;project:string;action:(name:string,payload:Row)=>Promise<boolean>;permission:Row;open:(name:string,r?:Row)=>void}){
  const rows=data.hrRecords;
  async function saveHr(event:FormEvent<HTMLFormElement>){event.preventDefault();const fd=new FormData(event.currentTarget);const userId=String(fd.get("userId")||"");if(!userId)return window.alert("Chọn nhân sự.");if(await action("save_hr_record",Object.fromEntries(fd)))(event.currentTarget as HTMLFormElement).reset();}
  return <div className="stack module-screen"><div className="kpi-grid small"><Kpi icon="NS" label="Hồ sơ đã lập" value={String(rows.length)} note="Nhân sự đang theo dõi"/><Kpi icon="NB" label="Còn thiếu hồ sơ" value={String(data.staffDirectory.filter((u)=>!rows.some((r)=>String(r.userId)===String(u.id))).length)} note="Chưa có hồ sơ chi tiết" tone="amber"/></div>
  <section className="card"><CardHead title="Hồ sơ nhân sự" note="Bấm vào một dòng để xem hồ sơ chi tiết (chức vụ, liên hệ, cá nhân, dự án đã/đang tham gia, đơn từ). Do Hành chính - Pháp chế cập nhật."/>
  {permission.canCreate&&<form className="payment-entry-inline hr-form" onSubmit={saveHr}><select name="userId" required defaultValue=""><option value="">Nhân sự *</option>{data.staffDirectory.map((u)=><option key={u.id} value={u.id}>{u.fullName} · {u.roleName||u.role||""}</option>)}</select><input name="fullName" placeholder="Họ tên (theo hồ sơ)"/><input name="identityNo" placeholder="Số CCCD/CMND"/><input name="identityDate" type="date"/><input name="birthDate" type="date"/><input name="birthplace" placeholder="Nơi sinh"/><input name="permanentAddress" placeholder="Địa chỉ thường trú"/><input name="phone" placeholder="Điện thoại"/><input name="educationLevel" placeholder="Trình độ học vấn"/><input name="joinedDate" type="date"/><input name="position" placeholder="Chức danh"/><input name="note" placeholder="Ghi chú"/><input name="identityPlace" hidden/><button className="primary">＋ Lập hồ sơ</button></form>}
  <div className="table-wrap"><table><thead><tr><th>Họ tên</th><th>Mã NV</th><th>Phòng ban</th><th>CCCD</th><th>Ngày sinh</th><th>Địa chỉ</th><th>Trình độ</th><th>Ngày vào</th><th>Chức danh</th></tr></thead><tbody>{rows.map((r)=><tr key={r.id} onClick={()=>open("userProfileHr",r)} title="Xem hồ sơ chi tiết" style={{cursor:"pointer"}}><td><strong>{r.fullName}</strong></td><td>{r.employeeCode||"—"}</td><td>{r.department||"—"}</td><td>{r.identityNo||"—"}</td><td>{r.birthDate||"—"}</td><td>{r.permanentAddress||"—"}</td><td>{r.educationLevel||"—"}</td><td>{r.joinedDate||"—"}</td><td>{r.position||"—"}</td></tr>)}{!rows.length&&<tr><td colSpan={9}><Empty text="Chưa có hồ sơ nhân sự."/></td></tr>}</tbody></table></div></section>
  </div>;
}
export {
  HrScreen,
};