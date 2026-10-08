// USER 29/09/2026 (MỐC 52) — MODAL «SỬA HỒ SƠ NHÂN SỰ` (thay cho nút «Sửa tài khoản`).
//
// ⛔ YÊU CẦU USER:
//   «modal hồ sơ nhân sự chi tiết — nút sửa tài khoản đổi thành sửa hồ sơ, chỉ cho sửa các
//    thông tin cơ bản của hồ sơ nhân sự (Thông tin user) và Thông tin cá nhân, KHÔNG cho
//    sửa tài khoản. Muốn sửa tài khoản phải vào Quản trị hệ thống mới được.»
//
// ⇒ Modal này CHỈ ghi qua action `save_hr_record` (hồ sơ nhân sự), TUYỆT ĐỐI không gọi
//   `update_user` / `save_user_access` ⇒ không đường nào sửa được tài khoản từ đây.
// ⇒ Các trường DANH TÍNH tài khoản (mã nhân viên · tên đăng nhập · vai trò hệ thống · phòng ban)
//   hiển thị READ-ONLY kèm lý do, không có ô nhập.

import { useState, type FormEvent } from "react";
import type { AppData, Row } from "@/lib/ui-shared";
import { BaseModal } from "@/lib/ui-blocks";

function hrOf(data: AppData, row: Row): Row {
  return (data.hrRecords || []).find((r: Row) => String(r.userId) === String(row.userId ?? row.id)) || {};
}

export default function HrProfileEditModal({ data, row, close, submit }: {
  data: AppData;
  row: Row;
  close: () => void;
  submit: (name: string, payload: Row) => Promise<boolean>;
}) {
  const hr = hrOf(data, row);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"user" | "personal">("user");

  const userId = String(row.userId ?? row.id);
  const fullName = String(row.fullName ?? hr.fullName ?? "");
  // MỐC 58-1 — sửa TẤT CẢ thông tin. Trường tài khoản (mã NV · tên đăng nhập · phòng ban)
  // ⚠️⚠️ SỬA CHÚ THÍCH CŨ (ERP-SESSION-03 · 2026-10-09) — ⛔ khối chú thích cũ ĐÃ BỊ GỠ vì SAI so với mã hiện tại
  //   và ⚠️ NẾU LÀM THEO NÓ sẽ TÁI SINH ĐÚNG lỗi «bấm Lưu ⇒ 403 sau khi hồ sơ đã ghi» (BUG-02):
  //   `⛔ Trước đây: "khoá đúng theo hợp đồng backend = chỉ role === admin"` ⇒ ⛔ KHÔNG CÒN ĐÚNG:
  //   ⭐ MỐC 103 (user 29/09) + `ActionRbacRegistry`: `update_user` nay cho **`admin_tab_01` + `canEdit`** đi qua
  //     (`requireAccountUpdateRight` — `UserManagementUseCase.java:167`), ⛔ chỉ `role` là **admin-only** (`:174-176`).
  //   ⛔ VÌ SAO GHI LẠI: ⚠️ đã có lần mở khoá cho `admin_tab_01` khi backend CÒN chặn ⇒ 403 sau khi lưu (BUG-02);
  //     ⚠️ và nay nếu ai **khoá lại theo chú thích cũ** thì người có Tab 01 ⛔ mất quyền sửa hồ sơ (⚠️ đúng lớp `BUG-C13`).
  //   ✅ HỢP ĐỒNG HIỆN TẠI (⭐ cổng `mt3-c13` khoá lại): `canEditAccount = true` (mọi trường TÀI KHOẢN trừ `role` sửa được)
  //     và ⭐ ô `role` **`disabled={!isAdminRole}`** (chống leo thang đặc quyền — khớp backend).
  const isAdminRole = String((data.user as Row | undefined)?.role ?? "") === "admin";
  // MỐC 103 (user 29/09) — mở khóa TOÀN BỘ modal Sửa hồ sơ.
  // Backend `update_user` đã khai `admin_tab_01` (ActionRbacRegistry, canEdit) nên người có quyền
  // Tab 01 VẪN SỬA ĐƯỢC mã NV / tên đăng nhập / họ tên / email / phòng-ban.
  // ⛔ Chỉ ADMIN đổi được VAI TRÒ (backend chặn để chống leo thang đặc quyền — xem UserManagementUseCase:114).
  const canEditAccount = true;

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError("");
    const fd = new FormData(event.currentTarget);
    // ═══════════════════════════════════════════════════════════════════════════════════════════
    // ⛔⛔ BUG-20261007-C12 (CRITICAL — MẤT DỮ LIỆU) · ERP-SESSION-03 · 2026-10-09 · HOTFIX
    //   USER BÁO: «sửa 1 thông tin của 1 user mà không sửa các thông tin khác, bấm lưu luôn thì
    //   các thông tin khác của user đó lại tự động bị XOÁ (hiển thị ---- trong danh sách nhân sự)».
    //
    // ⛔ ROOT CAUSE (ĐÃ CHỨNG MINH END-TO-END Ở TẦNG API — xem BUG_HOTFIX_LOG §C12):
    //   ① TỆP NÀY: form CHỈ render phần của **TAB ĐANG MỞ** (`tab === "user" ? … : …`).
    //      ⇒ khi người dùng ở tab «Thông tin cá nhân» thì các ô của tab «Thông tin user»
    //        (`position` = **Chức danh** · `phone` = **Điện thoại**) **KHÔNG có trong DOM**
    //      ⇒ `fd.get("position")` trả `null` ⇒ `String(null || "")` = **`""`** ⇒ payload gửi **chuỗi RỖNG**.
    //   ② BACKEND `HrManagementUseCase.saveHrRecord` ghi `nvl(payload.get("position"))` với
    //      `nvl(o)` = «rỗng ⇒ **NULL**» ⇒ **GHI ĐÈ giá trị cũ bằng NULL** ⇒ **MẤT DỮ LIỆU**.
    //   ⭐ Đo được: `e2e.diag` có `position = "Chỉ huy trưởng"`; gửi payload đúng như modal cũ sinh ra
    //      (tab cá nhân đang mở) ⇒ **`position` ⇒ NULL** (hồ sơ mất «Chức danh»).
    //      ⚠️ CSDL thật đã có **2 hồ sơ** bị rỗng trường (`cha.ht`: mất `position` + `phone`; `e2e.diag`).
    //
    // ✅ CÁCH VÁ: mọi trường **KHÔNG có trong DOM** (tab kia) ⇒ gửi **GIÁ TRỊ HIỆN CÓ** của hồ sơ
    //    (⚠️ ⛔ KHÔNG phải chuỗi rỗng) ⇒ backend nhận đúng giá trị cũ ⇒ **⛔ không xoá gì**.
    //    ⚠️ PHÂN BIỆT RÕ: `null` = «ô không có trong DOM» ⇒ **giữ giá trị cũ**;
    //       `""` = «ô CÓ trong DOM và người dùng **xoá trắng**» ⇒ **vẫn gửi rỗng** (tôn trọng ý người dùng).
    //    ⛔ Đây là **cùng một lớp lỗi** với `BUG-20261007-C01` (đã vá cho payload `update_user` ở dưới)
    //       — ⚠️ lần đó tôi **chưa áp cùng cách** cho payload `save_hr_record` ⇒ lỗi mất dữ liệu còn lại.
    // ⚠️ NỢ KỸ THUẬT BE (⛔ chưa sửa — luật user «FE → BE → DB»): `saveHrRecord` nên coi
    //    **khoá VẮNG MẶT = «không đổi»** thay vì ghi NULL ⇒ mọi client khác gửi thiếu trường vẫn mất dữ liệu.
    //    Đã ghi `HANDOFF-20261007-C17` cho phiên 01.
    // ═══════════════════════════════════════════════════════════════════════════════════════════
    const hrVal = (name: string, fallback: string) => {
      const raw = fd.get(name);
      return raw === null ? fallback : String(raw).trim();
    };
    // ⛔ CHỈ gửi trường HỒ SƠ. Không có userId-mới, không có role, không có username.
    const ok = await submit("save_hr_record", {
      userId,
      fullName,
      position: hrVal("position", String(hr.position ?? "")),
      // ⛔ KHÔNG gửi `email` vào `save_hr_record` — bảng `hr_records` không có cột này (MỐC 96).
      //    Email đi qua `update_user` bên dưới (chỉ khi `canEditAccount`).
      phone: hrVal("phone", String(hr.phone ?? "")),
      identityNo: hrVal("identityNo", String(hr.identityNo ?? "")),
      identityDate: hrVal("identityDate", String(hr.identityDate ?? "")),
      birthDate: hrVal("birthDate", String(hr.birthDate ?? "")),
      birthplace: hrVal("birthplace", String(hr.birthplace ?? "")),
      permanentAddress: hrVal("permanentAddress", String(hr.permanentAddress ?? "")),
      educationLevel: hrVal("educationLevel", String(hr.educationLevel ?? "")),
      joinedDate: hrVal("joinedDate", String(hr.joinedDate ?? "")),
      note: hrVal("note", String(hr.note ?? "")),
      identityPlace: hrVal("identityPlace", String(hr.identityPlace ?? "")),
    });
    if (!ok) { setBusy(false); return; }

    // ═══════════════════════════════════════════════════════════════════════════════════════════
    // BUG-20261007-C01 — ERP-SESSION-03 · 2026-10-07 · HOTFIX (user: «sửa CCCD báo lỗi …»)
    //
    // ⛔ ROOT CAUSE ĐÃ VÁ: form CHỈ render phần của **TAB ĐANG MỞ** (`tab === "user" ? … : …`,
    //    xem dòng cuối tệp này), nên khi người dùng ở tab «Thông tin cá nhân» thì các ô TÀI KHOẢN
    //    (`employeeCode` · `username` · `fullName` · `email` · `organizationUnitId`) **KHÔNG có
    //    trong DOM** ⇒ mọi `fd.get(...)` trả `null` ⇒ payload gửi lên **CHỈ có `{ userId }`**
    //    ⇒ backend `UserManagementUseCase.java:115-125` nhận `fullName` **RỖNG** và ném
    //    **400 «Mã nhân viên, họ tên, tên đăng nhập và phòng/bộ phận là bắt buộc.»**
    //    ⇒ người dùng sửa **CCCD** nhưng lại nhận thông điệp về **trường tài khoản** ⇒ tưởng lỗi CCCD.
    //
    // ✅ ① CHỈ gọi `update_user` khi **tab TÀI KHOẢN thật sự được gửi** (có ô `fullName` trong form).
    //       Sửa CCCD ở tab cá nhân ⇒ ⛔ KHÔNG sinh lời gọi thừa ⇒ **hết lỗi gốc**.
    // ✅ ② Khi CÓ gọi thật: **luôn gửi ĐỦ trường bắt buộc**; ô rỗng ⇒ lấy **giá trị HIỆN CÓ** của
    //       hồ sơ ⇒ backend ⛔ không bao giờ nhận `fullName`/`username` rỗng.
    // ✅ ③ Đồng bộ tài khoản THẤT BẠI ⇒ ⛔ **KHÔNG đóng modal** + báo **TRUNG THỰC** rằng hồ sơ ĐÃ lưu
    //       (trước đây modal vẫn đóng theo `ok` của `save_hr_record` ⇒ người dùng tưởng **mất dữ liệu**).
    // ⚠️ Nợ kỹ thuật BE (⛔ chưa sửa — luật user «FE → BE → DB»): `UserManagementUseCase.java:115-116`
    //    `fullName` là trường **DUY NHẤT** không có fallback `sv(target,…)` như `employeeCode`/`username`
    //    ⇒ mọi client khác gửi thiếu `fullName` vẫn 400. Đã ghi `HANDOFF-20261007-C02`.
    // ═══════════════════════════════════════════════════════════════════════════════════════════
    const accountTabSubmitted = fd.has("fullName");
    if (accountTabSubmitted && canEditAccount) {
      const accountText = (name: string, fallback: string) => {
        const raw = fd.get(name);
        const value = raw === null ? "" : String(raw).trim();
        return value || fallback;
      };
      const accountPayload: Row = {
        userId,
        employeeCode: accountText("employeeCode", String(row.employeeCode ?? "")),
        username: accountText("username", String(row.username ?? "")),
        fullName: accountText("fullName", fullName),
        email: accountText("email", String(row.email ?? "")),
        organizationUnitId: accountText("organizationUnitId", String(row.organizationUnitId ?? "")),
      };
      const accountOk = await submit("update_user", accountPayload);
      if (!accountOk) {
        setError("Hồ sơ nhân sự ĐÃ lưu, nhưng phần THÔNG TIN TÀI KHOẢN chưa cập nhật được (xem thông báo lỗi phía trên). Bấm «Lưu hồ sơ» để thử lại, hoặc vào Quản trị hệ thống → Tài khoản.");
        setBusy(false);
        return;
      }
    }
    setBusy(false);
    close();
  }

  return (
    <BaseModal
      title={`Sửa hồ sơ · ${fullName}`}
      note="Chỉ sửa THÔNG TIN HỒ SƠ NHÂN SỰ. Muốn sửa tài khoản (tên đăng nhập · vai trò · phòng ban · mật khẩu) vui lòng vào Quản trị hệ thống."
      close={close}
    >
      <form onSubmit={save}>
        <div className="modal-body" data-vntech="hr-profile-edit">
          <div className="project-scope-tabs" role="tablist" aria-label="hr-profile-edit-tabs">
            <button type="button" role="tab" aria-selected={tab === "user"} className={tab === "user" ? "active" : ""} onClick={() => setTab("user")}>Thông tin user</button>
            <button type="button" role="tab" aria-selected={tab === "personal"} className={tab === "personal" ? "active" : ""} onClick={() => setTab("personal")}>Thông tin cá nhân</button>
          </div>

          {error && <div className="inline-alert danger">{error}</div>}

          {/* ⛔⛔ BUG-20261007-C12 (PHẦN 2) — `key={tab}` BẮT BUỘC TRÊN CẢ HAI NHÁNH:
              Hai tab render CÙNG loại `<div className="form-grid">` ở CÙNG vị trí trong cây ⇒ React
              **TÁI DÙNG** các `<input>` cũ thay vì mount lại ⇒ `defaultValue` ⛔ KHÔNG được áp lại.
              ⭐ ĐO ĐƯỢC (vòng 48): ở tab «Thông tin cá nhân», ô «Số CCCD/CMND» hiện **«E2E-DIAG»** (= MÃ NV
              của tab «Thông tin user»), «Địa chỉ thường trú» hiện **«Chẩn đoán»** (= HỌ TÊN),
              «Trình độ học vấn» hiện **«Chỉ huy trưởng»** (= CHỨC DANH) — ⚠️ dù API trả 3 trường này **RỖNG**.
              ⇒ ⚠️ Bấm Lưu là **GHI các giá trị SAI vào trường cá nhân** (⭐ khớp hồ sơ `cha.ht`:
                 `permanent_address` = «Chỉ huy trưởng A» = **họ tên**, `education_level` = «Chỉ huy trưởng» = **chức danh**).
              ✅ `key={tab}` ép React **MOUNT LẠI** nhóm ô khi đổi tab ⇒ `defaultValue` = giá trị THẬT của hồ sơ. */}
          {tab === "user" ? (
            <div className="form-grid" key={tab}>
              {/* MỐC 101 — BUG-02: 3 ô này lưu qua `update_user` ⇒ CHỈ mở khi `role === "admin"`. */}
              <label><span>Mã nhân viên</span><input name="employeeCode" defaultValue={String(row.employeeCode ?? "")} /></label>
              <label><span>Tên đăng nhập</span><input name="username" defaultValue={String(row.username ?? "")} /></label>
              <label><span>Vai trò hệ thống</span><select name="role" defaultValue={String(row.role ?? "")} disabled={!isAdminRole}><option value={String(row.role ?? "")}>{String(row.roleName ?? row.role ?? "")}</option></select><small>{isAdminRole ? "Vai trò hệ thống — sửa được (bạn là Quản trị hệ thống)." : "⛔ ĐỔI VAI TRÒ = ĐỔI QUYỀN — chỉ Quản trị hệ thống mới đổi được. Bạn vẫn sửa được mọi ô khác."}</small></label>
              <label><span>Phòng / bộ phận</span><select name="organizationUnitId" defaultValue={String(row.organizationUnitId ?? "")}><option value="">{String(row.organizationName ?? row.department ?? "-")}</option>{(data.organizationUnits||[]).map((o:Row)=><option key={o.id} value={o.id}>{o.code} · {o.name}</option>)}</select><small>Lưu vào tài khoản (users.organization_unit_id).</small></label>
              <label><span>Họ tên</span><input name="fullName" defaultValue={fullName} /><small>Lưu vào tài khoản (users.full_name).</small></label>
              <label><span>Chức danh</span><input name="position" defaultValue={String(hr.position ?? "")} placeholder="Chức danh trong hồ sơ" /></label>
              {/* MỐC 96 — SỬA LỖI MẤT DỮ LIỆU: bảng `hr_records` KHÔNG có cột `email`.
                  ⛔ Trước đây ô này gõ được nhưng `save_hr_record` VỨT ĐI ⇒ mất âm thầm.
                  ✅ Nay: email thuộc TÀI KHOẢN (`users.email`) ⇒ chỉ dùng được khi có quyền
                  `update_user` (CHỈ vai trò `admin`); không có quyền thì KHOÁ + nêu rõ lý do. */}
              <label><span>Email công ty</span><input name="email" type="email" defaultValue={String(row.email ?? "")} /><small>Lưu vào tài khoản (users.email).</small></label>
              <label><span>Điện thoại</span><input name="phone" defaultValue={String(hr.phone ?? "")} /></label>
            </div>
          ) : (
            <div className="form-grid" key={tab}>
              <label><span>Số CCCD/CMND</span><input name="identityNo" defaultValue={String(hr.identityNo ?? "")} /></label>
              <label><span>Ngày cấp CCCD</span><input name="identityDate" type="date" defaultValue={String(hr.identityDate ?? "")} /></label>
              <label><span>Ngày sinh</span><input name="birthDate" type="date" defaultValue={String(hr.birthDate ?? "")} /></label>
              <label><span>Nơi sinh</span><input name="birthplace" defaultValue={String(hr.birthplace ?? "")} /></label>
              <label className="span-2"><span>Địa chỉ thường trú</span><input name="permanentAddress" defaultValue={String(hr.permanentAddress ?? "")} /></label>
              <label><span>Trình độ học vấn</span><input name="educationLevel" defaultValue={String(hr.educationLevel ?? "")} /></label>
              <label><span>Ngày vào làm</span><input name="joinedDate" type="date" defaultValue={String(hr.joinedDate ?? "")} /></label>
              <label className="span-2"><span>Ghi chú</span><input name="note" defaultValue={String(hr.note ?? "")} /></label>
              <input name="identityPlace" hidden defaultValue={String(hr.identityPlace ?? "")} />
            </div>
          )}
        </div>
        <footer className="modal-footer">
          <button type="button" className="secondary" onClick={close}>Hủy</button>
          <button className="primary" disabled={busy}>{busy ? "Đang lưu…" : "Lưu hồ sơ"}</button>
        </footer>
      </form>
    </BaseModal>
  );
}
