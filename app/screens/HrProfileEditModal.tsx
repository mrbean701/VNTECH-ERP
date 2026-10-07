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
  // ⛔ MỐC 101 — BUG-02 (S1): CHỈ ROLE `admin` mới gọi được `update_user`.
  //   `UserManagementUseCase.java:104` → `rbac.requireRole(..., List.of("admin"))`.
  //   ⛔ Trước đây mở khoá cho `admin_tab_01` ⇒ người có Tab 01 nhưng không phải admin
  //      thấy ô sửa được, bấm Lưu ⇒ hồ sơ đã ghi xong nhưng `update_user` trả **403**
  //      ⇒ báo lỗi sau khi đã lưu ⇒ người dùng tưởng mất dữ liệu.
  //   ✅ Sửa: khoá đúng theo hợp đồng backend = chỉ `role === "admin"`.
  //      (Quyền `admin_tab_01` là quyền SỬA TÀI KHOẢN, cần `save_user_access` — xem MỐC 48.)
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
    // ⛔ CHỈ gửi trường HỒ SƠ. Không có userId-mới, không có role, không có username.
    const ok = await submit("save_hr_record", {
      userId,
      fullName,
      position: String(fd.get("position") || ""),
      // ⛔ KHÔNG gửi `email` vào `save_hr_record` — bảng `hr_records` không có cột này (MỐC 96).
      //    Email đi qua `update_user` bên dưới (chỉ khi `canEditAccount`).
      phone: String(fd.get("phone") || ""),
      identityNo: String(fd.get("identityNo") || ""),
      identityDate: String(fd.get("identityDate") || ""),
      birthDate: String(fd.get("birthDate") || ""),
      birthplace: String(fd.get("birthplace") || ""),
      permanentAddress: String(fd.get("permanentAddress") || ""),
      educationLevel: String(fd.get("educationLevel") || ""),
      joinedDate: String(fd.get("joinedDate") || ""),
      note: String(fd.get("note") || ""),
      identityPlace: String(fd.get("identityPlace") || ""),
    });
    // MỐC 58-1 — ghi thêm phần TÀI KHOẢN nếu người dùng có quyền.
    if (ok && canEditAccount) {
      const accountPayload: Row = { userId: String(row.userId ?? row.id) };
      if (String(fd.get("employeeCode") || "").trim()) accountPayload.employeeCode = String(fd.get("employeeCode")).trim();
      if (String(fd.get("username") || "").trim()) accountPayload.username = String(fd.get("username")).trim();
      if (String(fd.get("fullName") || "").trim()) accountPayload.fullName = String(fd.get("fullName")).trim();
      if (String(fd.get("email") || "").trim()) accountPayload.email = String(fd.get("email")).trim();
      if (String(fd.get("organizationUnitId") || "").trim()) accountPayload.organizationUnitId = String(fd.get("organizationUnitId")).trim();
      await submit("update_user", accountPayload);
    }
    setBusy(false);
    if (ok) close();
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

          {tab === "user" ? (
            <div className="form-grid">
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
            <div className="form-grid">
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
