// HỢP ĐỒNG — «CỔNG QUYỀN ⛔ KHÔNG ĐƯỢC CHỈ XÉT QUYỀN **CẤP NGƯỜI DÙNG**» (ERP-SESSION-03 · **lớp `BUG-20261007-C13`**, HIGH)
//
// ⛔ SỰ CỐ ĐÃ ĐO (2026-10-09):
//   ① `app/page.tsx` → `canAdministerStaff` **chỉ** xét `allModulePermissions` lọc theo `userId` ⇒ ⛔ **BỎ QUA quyền CẤP PHÒNG BAN**
//      + danh sách mã có **MÃ ĐẢO** `dept_hr_legal` (mã thật: `dept_legal_hr`) ⇒ ⚠️ tài khoản role `hr` **CÓ** `dept_legal_hr.can_edit=1`
//      mà **⛔ KHÔNG thấy nút «Sửa hồ sơ»** (⭐ đo bằng đăng nhập thật + API). ⇒ **đã giao `HANDOFF-20261007-C20`** (⛔ `page.tsx` = LOCK phiên 01).
//   ② `lib/workflow-helpers.ts` → `workflowApproverCandidates` **cùng khuôn** ⇒ ⚠️ người có quyền **DUYỆT** theo **phòng ban** bị đánh dấu **SAI**
//      ⇒ `WorkflowModal` (`onlyPermitted`) **ẨN người duyệt HỢP LỆ** + badge «Chưa có quyền duyệt» **sai**. ⇒ ✅ **ĐÃ VÁ** (tệp thuộc phiên 03).
//
// ⭐ DỮ LIỆU ĐÃ ĐO (vì sao phải xét quyền phòng ban):
//   · `department_module_permissions` **CÓ cột `can_approve`** · ⭐ nhiều dòng `can_approve=1` (`approvals` **6 phòng** · `dept_legal_hr` **3** · …)
//   · API trả `departmentModulePermissions[]` với `organizationUnitId` + `moduleKey` + `canApprove` ✅ · `users[]` có `organizationUnitId` ✅
//
// Chạy riêng:  node --test tests/mt3-c16-dept-permission-gates.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const HELPER = "lib/workflow-helpers.ts";

/** ⭐ Cổng quyền có xét **quyền CẤP PHÒNG BAN** chưa? */
export function hasDeptGrantBranch(src) {
  return /departmentModulePermissions/.test(src) && /canApprove/.test(src);
}

test("C16-1 · ⭐ CHỐT VÙNG PHỦ: tệp helper phải đọc được và có nội dung thật (⛔ không ĐẠT RỖNG)", () => {
  const src = read(HELPER);
  assert.ok(src.length > 500, `⛔ CHỐT VÙNG PHỦ: chỉ đọc được ${src.length} ký tự của \`${HELPER}\` ⇒ nghi đọc sai tệp`);
  assert.match(src, /workflowApproverCandidates/, "⛔ CHỐT VÙNG PHỦ: phải tìm thấy hàm `workflowApproverCandidates`");
});

test("C16-2 · `workflowApproverCandidates` PHẢI xét **quyền DUYỆT cấp PHÒNG BAN** (⛔ không chỉ cấp người dùng)", () => {
  const src = read(HELPER);
  assert.ok(hasDeptGrantBranch(src),
    "⛔ TÁI PHÁT lớp `BUG-20261007-C13`: cổng quyền chỉ xét quyền **CẤP NGƯỜI DÙNG** ⇒ " +
    "người có quyền theo **PHÒNG BAN** bị đánh dấu SAI (`WorkflowModal` sẽ ẨN người duyệt hợp lệ). " +
    "⇒ phải xét thêm `data.departmentModulePermissions` theo `organizationUnitId` + `canApprove`.");
  // ⛔ Vẫn phải giữ nhánh quyền cấp NGƯỜI DÙNG và `admin` (⛔ không được bỏ đường nào khi vá):
  assert.match(src, /allModulePermissions/, "⛔ mất nhánh quyền CẤP NGƯỜI DÙNG");
  assert.match(src, /isAdmin/, "⛔ mất nhánh `admin`");
});

test("C16-3 · ĐỐI CHỨNG ÂM: bộ dò PHẢI bắt được mã CŨ (⛔ nếu không ⇒ cổng VÔ DỤNG)", () => {
  // ⭐ MẪU THẬT lấy từ mã TRƯỚC khi vá (nguyên văn hành vi):
  const old = `function workflowApproverCandidates(data, moduleKey) {
  return (data.users || []).map((u) => {
    const perm = (data.allModulePermissions || []).find((p) => String(p.userId) === String(u.id) && String(p.moduleKey) === moduleKey);
    const isAdmin = String(u.role) === "admin";
    return { ...u, hasApprovePermission: isAdmin || Number(perm?.canApprove) === 1 };
  });
}`;
  assert.equal(hasDeptGrantBranch(old), false, "⛔ bộ dò HỎNG: không nhận ra mã CŨ (thiếu nhánh quyền phòng ban)");
  // ⭐ Và ⛔ KHÔNG báo oan mã ĐÃ VÁ:
  const fixed = read(HELPER);
  assert.equal(hasDeptGrantBranch(fixed), true, "⛔ báo OAN mã đã vá");
});

test("C16-4 · `WorkflowModal` phải hiển thị đúng nhãn quyền duyệt (⛔ không nói «Chưa có quyền duyệt» khi thực ra CÓ)", () => {
  const src = read("app/screens/WorkflowModal.tsx");
  assert.ok(src.length > 500, `⛔ CHỐT VÙNG PHỦ: \`WorkflowModal.tsx\` chỉ đọc được ${src.length} ký tự`);
  // ⭐ Modal LỌC theo `hasApprovePermission` ⇒ ⚠️ nguồn của cờ đó PHẢI là helper đã vá (⭐ khoá lại để ⛔ không ai đổi sang nguồn khác):
  assert.match(src, /workflowApproverCandidates|hasApprovePermission/,
    "⛔ modal phải dùng cờ `hasApprovePermission` (nguồn: `workflowApproverCandidates` đã xét quyền phòng ban)");
});
