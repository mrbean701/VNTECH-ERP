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
// USER 29/09/2026 (MỐC 49) — dải ô nhập liệu + nút «＋ Lập hồ sơ» **KHÔNG còn nằm dạng dải
// ngang trên màn**, mà chuyển vào **modal «Lập hồ sơ»**; trên màn chỉ còn **tìm kiếm + sắp xếp**.

import { CardHead, Empty, Kpi, date } from "@/lib/ui-shared";
import type { AppData, Row } from "@/lib/ui-shared";
import { ListToolbar } from "@/app/components/ui/ListToolbar";
import { BaseModal } from "@/lib/ui-blocks";
import { FormEvent, useState } from "react";

// USER 29/09/2026 (MỐC 49) — tiêu chí sắp xếp + từ khoá tìm kiếm của màn «Hồ sơ nhân sự».
const HR_SORT_OPTIONS = [
  { value: "name_asc", label: "Họ tên A→Z" },
  { value: "name_desc", label: "Họ tên Z→A" },
  { value: "code_asc", label: "Mã NV A→Z" },
  { value: "joined_desc", label: "Ngày vào mới nhất" },
  { value: "joined_asc", label: "Ngày vào cũ nhất" },
];

function HrScreen({data,project,action,permission,open}:{data:AppData;project:string;action:(name:string,payload:Row)=>Promise<boolean>;permission:Row;open:(name:string,r?:Row)=>void}){
  const rows=data.hrRecords;
  // MỐC 49 — chỉ còn tìm kiếm + sắp xếp trên màn; phần nhập liệu nằm trong modal.
  const [query,setQuery]=useState("");
  const [sort,setSort]=useState("name_asc");
  const [createOpen,setCreateOpen]=useState(false);
  const [saving,setSaving]=useState(false);

  // ⭐ ERP-SESSION-03 (10/10/2026) — BUG-20261007-C15: ⛔ CHẶN GHI ĐÈ HỒ SƠ ĐANG CÓ.
  //   ⛔ SỰ CỐ ĐÃ ĐO: backend `HrManagementUseCase:32-39` khi hồ sơ ĐÃ TỒN TẠI thì gọi `store.updateHrRecord(… nvl(payload.get("x")) …)`
  //     ⇒ ⭐ **khoá VẮNG = NULL** ⇒ ⚠️ bấm «＋ Lập hồ sơ» cho một nhân sự **ĐÃ CÓ hồ sơ** rồi lưu form (phần lớn ô TRỐNG)
  //     ⇒ ⛔ **XOÁ SẠCH** các trường cũ (⭐ **đúng lớp `BUG-20261007-C12` — lỗi CRITICAL mất dữ liệu** mà user đã báo, chỉ khác ĐƯỜNG VÀO).
  //   ⭐ ĐO ĐƯỢC: **42** nhân sự hoạt động vs **26** hồ sơ ⇒ ⚠️ **26 người** phơi ra trước rủi ro này.
  //   ✅ VÁ: ① danh sách chọn CHỈ gồm nhân sự **CHƯA có hồ sơ** (⭐ khớp KPI «Còn thiếu hồ sơ») ② ⭐ vẫn **chốt chặn thứ hai** khi lưu (nếu vì lý do nào đó chọn trúng người đã có ⇒ **hỏi xác nhận**) ③ ghi rõ trong modal là sửa hồ sơ cũ thì bấm vào dòng.
  const missingProfile = data.staffDirectory.filter((u) => !rows.some((r) => String(r.userId) === String(u.id)));

  async function saveHr(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    const form=event.currentTarget;
    const fd=new FormData(form);
    const userId=String(fd.get("userId")||"");
    if(!userId){window.alert("Chọn nhân sự.");return;}
    // ⭐ CHỐT CHẶN 2 (luật 20): user ĐÃ có hồ sơ ⇒ lưu sẽ GHI ĐÈ (khoá vắng ⇒ NULL) ⇒ phải hỏi trước.
    const daCo = rows.find((r) => String(r.userId) === userId);
    if (daCo && !window.confirm(`Nhân sự này ĐÃ CÓ hồ sơ ⇒ lưu tiếp sẽ GHI ĐÈ bằng dữ liệu đang điền (ô nào bỏ trống sẽ thành rỗng).\n\nKhuyên dùng: hủy, bấm vào dòng trong danh sách để SỬA hồ sơ hiện có.\n\nVẫn muốn ghi đè?`)) return;
    setSaving(true);
    try{ if(await action("save_hr_record",Object.fromEntries(fd))){ form.reset(); setCreateOpen(false); } }
    finally{ setSaving(false); }
  }

  // MỐC 49 — lọc theo từ khoá rồi sắp xếp (không gọi API, chỉ hiển thị).
  const visibleRows=[...rows]
    .filter((r)=>{const q=query.trim().toLowerCase();if(!q)return true;
      return [r.fullName,r.employeeCode,r.identityNo,r.position,r.department,r.permanentAddress]
        .some((v)=>String(v??"").toLowerCase().includes(q));})
    .sort((a,b)=>{
      if(sort==="name_desc")return String(b.fullName||"").localeCompare(String(a.fullName||""),"vi");
      if(sort==="code_asc")return String(a.employeeCode||"").localeCompare(String(b.employeeCode||""),"vi");
      if(sort==="joined_desc")return String(b.joinedDate||"").localeCompare(String(a.joinedDate||""));
      if(sort==="joined_asc")return String(a.joinedDate||"").localeCompare(String(b.joinedDate||""));
      return String(a.fullName||"").localeCompare(String(b.fullName||""),"vi");
    });

  return <div className="stack module-screen"><div className="kpi-grid small"><Kpi icon="NS" label="Hồ sơ đã lập" value={String(rows.length)} note="Nhân sự đang theo dõi"/><Kpi icon="NB" label="Còn thiếu hồ sơ" value={String(data.staffDirectory.filter((u)=>!rows.some((r)=>String(r.userId)===String(u.id))).length)} note="Chưa có hồ sơ chi tiết" tone="amber"/></div>
  <section className="card"><CardHead title="Hồ sơ nhân sự" note="Bấm vào một dòng để xem hồ sơ chi tiết (chức vụ, liên hệ, cá nhân, dự án, đơn từ). Do Hành chính - Pháp chế cập nhật."/>
  {/* MỐC 49 — thanh công cụ chỉ còn tìm kiếm + sắp xếp; nút «＋ Lập hồ sơ» mở modal. */}
  <ListToolbar title="Danh sách hồ sơ" count={visibleRows.length} total={rows.length} unit="hồ sơ"
    search={{value:query,onChange:setQuery,placeholder:"Tìm họ tên · mã NV · CCCD · chức danh…"}}
    sort={{value:sort,onChange:setSort,options:HR_SORT_OPTIONS}}
    actions={permission.canCreate?<button type="button" className="primary" onClick={()=>setCreateOpen(true)}>＋ Lập hồ sơ</button>:null} />
  <div className="table-wrap"><table><thead><tr><th>Họ tên</th><th>Mã NV</th><th>Phòng ban</th><th>CCCD</th><th>Ngày sinh</th><th>Địa chỉ</th><th>Trình độ</th><th>Ngày vào</th><th>Chức danh</th></tr></thead><tbody>{visibleRows.map((r)=><tr key={r.id} onClick={()=>open("userProfileHr",r)} title="Xem hồ sơ chi tiết" style={{cursor:"pointer"}}><td><strong>{r.fullName}</strong></td><td>{r.employeeCode||"—"}</td><td>{r.department||"—"}</td><td>{r.identityNo||"—"}</td><td>{date(r.birthDate)}</td><td>{r.permanentAddress||"—"}</td><td>{r.educationLevel||"—"}</td><td>{date(r.joinedDate)}</td><td>{r.position||"—"}</td></tr>)}{!visibleRows.length&&<tr><td colSpan={9}><Empty text={rows.length?"Không có hồ sơ nào khớp từ khoá tìm kiếm.":"Chưa có hồ sơ nhân sự."}/></td></tr>}</tbody></table></div></section>
  {/* MỐC 49 — toàn bộ ô nhập liệu chuyển vào đây. ⭐ SỬA 10/10/2026: `date(...)` cho 2 cột ngày (⭐ trước đây in THÔ `yyyy-mm-dd`, ⛔ lệch chuẩn `dd/mm/yyyy` của app — xem BUG-C15). */}
  {createOpen&&<BaseModal title="Lập hồ sơ nhân sự" note="Điền thông tin hồ sơ cho nhân sự CHƯA có hồ sơ. Mã nhân viên và phòng ban lấy theo tài khoản. ⭐ Nhân sự ĐÃ có hồ sơ thì bấm vào dòng trong danh sách để SỬA (⛔ không lập lại — sẽ ghi đè)." close={()=>setCreateOpen(false)}>
    <form onSubmit={saveHr}>
      <div className="modal-body"><div className="form-grid">
        <label className="span-2"><span>Nhân sự *</span><select name="userId" required defaultValue=""><option value="">{missingProfile.length?"— Chọn nhân sự —":"— Tất cả nhân sự đã có hồ sơ —"}</option>{missingProfile.map((u)=><option key={u.id} value={u.id}>{u.fullName} · {u.roleName||u.role||""}</option>)}</select></label>
        <label><span>Họ tên (theo hồ sơ)</span><input name="fullName"/></label>
        <label><span>Số CCCD/CMND</span><input name="identityNo"/></label>
        <label><span>Ngày cấp CCCD</span><input name="identityDate" type="date"/></label>
        <label><span>Ngày sinh</span><input name="birthDate" type="date"/></label>
        <label><span>Nơi sinh</span><input name="birthplace"/></label>
        <label><span>Địa chỉ thường trú</span><input name="permanentAddress"/></label>
        <label><span>Điện thoại</span><input name="phone"/></label>
        <label><span>Trình độ học vấn</span><input name="educationLevel"/></label>
        <label><span>Ngày vào làm</span><input name="joinedDate" type="date"/></label>
        <label><span>Chức danh</span><input name="position"/></label>
        <label className="span-2"><span>Ghi chú</span><input name="note"/></label>
        <input name="identityPlace" hidden/>
      </div></div>
      <footer className="modal-footer"><button type="button" className="secondary" onClick={()=>setCreateOpen(false)}>Hủy</button><button className="primary" disabled={saving||!missingProfile.length}>{saving?"Đang lưu…":(missingProfile.length?"Lưu hồ sơ":"Tất cả đã có hồ sơ")}</button></footer>
    </form>
  </BaseModal>}
  </div>;
}
export {
  HrScreen,
};
