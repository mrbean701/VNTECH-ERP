// PHASE 7 (`AD-07`, **P0**) — HỢP ĐỒNG AUDIT: CẤU TRÚC NHÓM QUYỀN NGHIỆP VỤ CÓ THAM GIA KIỂM QUYỀN KHÔNG?
// Nguyên văn `docs/25_TODO_ROADMAP.md` dòng `AD-07`: «Audit + giải thích cấu trúc nhóm quyền nghiệp vụ»
// (ưu tiên **P0**, phụ thuộc `A-15` — đã ĐÓNG với kết luận «KHONG tham gia kiem quyen (chi module_permissions)»).
//
// ĐỀ BÀI YÊU CẦU: kết luận của AD-07 **PHẢI KHỚP** kết luận của A-15 và phải GIẢI THÍCH bằng tài liệu.
// Vì vậy test này KHÔNG chỉ đọc tài liệu — nó kiểm BẰNG CHỨNG MÃ NGUỒN hai chiều:
//   (a) đường KIỂM QUYỀN lúc chạy (`RbacService`, `ModulePermissionStoreAdapter`) CHỈ đọc `user_module_permissions`;
//   (b) `department_module_permissions` CHỈ được dùng làm MẪU/GIỚI HẠN (seed `department_default` + chặn cấp vượt phòng)
//       và bởi nút «Sao chép từ phòng ban» — ĐÚNG như A-15 đã kết luận, KHÔNG phải đường kiểm quyền.
//
// Chạy riêng:  node --test tests/ad07-role-group-audit.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const root = new URL("../", import.meta.url);
const read = (p) => readFileSync(new URL(p, root), "utf8");
const exists = (p) => existsSync(new URL(p, root));

const APP = "java-backend/application/src/main/java/com/vntech/erp/application/";
const INFRA = "java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/";
const DOC = "docs/agent-progress/AD-07-NHOM-QUYEN-NGHIEP-VU-AUDIT.md";

test("AD-07 — (a) ĐƯỜNG KIỂM QUYỀN lúc chạy CHỈ đọc `user_module_permissions`", () => {
  const rbac = read(`${APP}rbac/RbacService.java`);
  const store = read(`${INFRA}ModulePermissionStoreAdapter.java`);
  assert.match(rbac, /user_module_permissions/, "`RbacService` phải kiểm bằng `user_module_permissions`");
  assert.doesNotMatch(rbac, /department_module_permissions/,
    "`RbacService` KHÔNG được đọc `department_module_permissions` (nếu đọc ⇒ A-15/AD-07 sai, phải báo lại)");
  assert.doesNotMatch(store, /department_module_permissions/,
    "`ModulePermissionStoreAdapter` (port kiểm quyền) KHÔNG được đọc bảng phòng ban");
});

test("AD-07 — (b) `department_module_permissions` là MẪU + GIỚI HẠN, không phải cổng kiểm quyền", () => {
  const useCase = read(`${APP}service/UserManagementUseCase.java`);
  // MẪU: seed quyền người dùng từ phòng ban với nguồn `department_default`.
  assert.match(useCase, /replaceDepartmentDefaults/, "Phải có hàm seed quyền từ phòng ban (MẪU)");
  assert.match(useCase, /department_module_permissions là nguồn chính/,
    "Chú thích gốc P5 phải còn (bằng chứng cấu trúc: bảng phòng ban là NGUỒN của bản sao)");
  // GIỚI HẠN: chặn cấp quyền vượt phòng ban (P5.3) — đây là kiểm lúc GHI, không phải kiểm lúc CHẠY.
  assert.match(useCase, /assertDepartmentAllowsPermissions/,
    "Phải còn hàm chặn cấp quyền vượt phòng ban (kiểm khi GHI, không phải cổng chạy)");
  assert.match(useCase, /store\.findDepartmentPermission\(orgUnitId, moduleKey\)/,
    "Giới hạn phải tra đúng dòng quyền phòng ban");
  // Nguồn bản sao phải là `department_default` — phân biệt với `manual_override` (ngoại lệ cá nhân, AD-12).
  const adapter = read(`${INFRA}UserAdminStoreAdapter.java`);
  assert.match(adapter, /department_default/, "Bản sao quyền phòng ban phải mang `permission_source='department_default'");
  assert.match(adapter, /manual_override/, "Ngoại lệ cá nhân phải mang `permission_source='manual_override'");
});

test("AD-07 — nút «Sao chép từ phòng ban» là ĐƯỜNG TIÊU THỤ MẪU (đúng mô tả A-15)", () => {
  const page = read("app/page.tsx");
  assert.match(page, /function copyFromDepartment\(u: Row\)/, "Phải còn hàm `copyFromDepartment` trong app/page.tsx");
  assert.match(page, /deptPermsOf\(u\.organizationUnitId\)/, "Nút sao chép phải đọc quyền của PHÒNG BAN của user");
  assert.match(page, /action\("save_user_access", \{ userId: u\.id, projectScopes, warehouseScopes, modulePermissions \}\)/,
    "Sao chép phải ghi vào QUYỀN NGƯỜI DÙNG (`save_user_access`), không ghi vào bảng phòng ban");
  assert.match(page, /Sao chép từ phòng ban/, "Nút phải tồn tại trên UI (đúng mô tả của người dùng cho A-15)");
});

test("AD-07 — TÀI LIỆU giải thích cấu trúc phải tồn tại, có verdict + sơ đồ + bằng chứng", () => {
  const path = new URL(DOC, root);
  assert.ok(existsSync(path), `Thiếu tài liệu bắt buộc ${DOC}`);
  const text = readFileSync(path, "utf8");
  assert.match(text, /A-15/, "Tài liệu phải dẫn chiếu kết luận `A-15` (điều kiện của chính mục AD-07)");
  assert.match(text, /MẪU|template/i, "Tài liệu phải nói rõ phòng ban là MẪU (template)");
  assert.match(text, /KHÔNG.*(kiểm quyền|đường kiểm quyền)/s, "Tài liệu phải khẳng định KHÔNG phải đường kiểm quyền");
  assert.match(text, /CONFIRMED/, "Kết luận phải có verdict CONFIRMED (mục P0, không được suy đoán)");
  assert.match(text, /user_module_permissions/, "Tài liệu phải nêu cổng kiểm quyền THẬT");
  assert.match(text, /department_module_permissions/, "Tài liệu phải nêu bảng phòng ban");
  assert.match(text, /(java-backend|app\/|scripts\/)[\w./-]+/, "Tài liệu phải trích dẫn tệp + dòng làm bằng chứng");
  // Tài liệu KHÔNG được đề xuất đổi kiến trúc (đề bài: «không tự đổi kiến trúc ✗»).
  assert.match(text, /KHÔNG đổi (kiến trúc|hành vi)/, "Tài liệu phải ghi rõ KHÔNG đổi kiến trúc/hành vi");
  // Hồ sơ TASK-102 phải dẫn lại audit này (truy vết) — nếu thiếu thì mục P0 chưa được ghi hồ sơ.
  assert.ok(exists("docs/agent-progress/TASK-102.md"), "Thiếu hồ sơ docs/agent-progress/TASK-102.md");
  assert.match(read("docs/agent-progress/TASK-102.md"), /AD-07/, "Hồ sơ TASK-102 phải có mục AD-07");
});
