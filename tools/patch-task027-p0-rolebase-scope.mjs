// Vá TASK-027: hai lỗi P0 phát hiện bằng kiểm chứng SỐNG với tài khoản thật.
//
// LỖI 1 — create_request / decide_approval dựng lớp vô danh Principal TẠI CHỖ trong `case`,
//         thiếu override roleBase() ⇒ rơi về mặc định roleBase()=role() = MÃ CHUẨN ("ksda").
//         requireRole([engineer, commander, admin]) so với "ksda" ⇒ 403.
//         Hệ quả: CHỈ admin lập được phiếu đề nghị mua — chặn đứng nghiệp vụ cốt lõi.
//         (Đã đo được: ksda.demo / engineer.demo / cha.ht đều 403 "không có quyền thực hiện nghiệp vụ".)
//         Bản vá: dùng lại helper asReqPrincipal(cu) — đã có roleBase()/fullName()/email().
//
// LỖI 2 — AccessScopeService.canAccessWarehouse so `"warehouse".equals(role)` với MÃ ENGINE,
//         nhưng mọi nơi gọi truyền principal.role() = MÃ CHUẨN (thu_kho/kho_tong)
//         ⇒ nhánh phạm vi kho KHÔNG BAO GIỜ chạy cho người dùng kho thật.
//         JS dùng effectiveRole(user) nên nhánh đó chạy được (scripts/system-route.mjs:229).
//         Bản vá: chấp nhận CẢ mã engine lẫn mã chuẩn, đúng quy ước đã dùng ở RbacService.requireRole.
import { readFileSync, writeFileSync } from "node:fs";

const CTRL = "java-backend/web/src/main/java/com/vntech/erp/web/controller/SystemController.java";
const SCOPE = "java-backend/application/src/main/java/com/vntech/erp/application/rbac/AccessScopeService.java";

let changes = 0;
const apply = (path, fn) => {
  const before = readFileSync(path, "utf8");
  const after = fn(before);
  if (after !== before) { writeFileSync(path, after, "utf8"); changes++; }
  return after;
};

// ------------------------------------------------------------------ LỖI 1
apply(CTRL, (src) => {
  let out = src;
  for (const method of ["createRequest", "decideApproval"]) {
    // ĐÃ VÁ thì bỏ qua (kiểm tra trạng thái ĐÍCH trước, KHÔNG kiểm trạng thái NGUỒN —
    // bài học từ lỗi idempotency trước đây).
    if (out.includes(`requestManagementUseCase.${method}(asReqPrincipal(cu), payload)`)) continue;
    const re = new RegExp(
      `requestManagementUseCase\\.${method}\\(\\s*new RequestManagementUseCase\\.Principal\\(\\) \\{[\\s\\S]*?\\}\\s*,\\s*payload\\)`,
      "");
    if (!re.test(out)) { console.log(`  ! không khớp được ${method}`); continue; }
    out = out.replace(re, `requestManagementUseCase.${method}(asReqPrincipal(cu), payload)`);
    console.log(`  ✓ ${method} -> asReqPrincipal(cu)`);
  }
  return out;
});

// ------------------------------------------------------------------ LỖI 1b (nhất quán)
apply(CTRL, (src) => {
  const anchor = `private static AdminSystemUseCase.Principal asAdminPrincipal(AuthUseCase.CurrentUser cu) {`;
  const at = src.indexOf(anchor);
  if (at < 0) { console.log("  ! không thấy asAdminPrincipal"); return src; }
  const end = src.indexOf("};", at);
  const block = src.slice(at, end);
  if (block.includes("roleBase()")) { console.log("  = asAdminPrincipal đã có roleBase, bỏ qua"); return src; }
  // Chèn ngay sau dòng role() bất kể thụt lề thực tế.
  const patched = block.replace(
    /(@Override public String role\(\) \{ return cu\.role\(\); \}\r?\n)(\s*)/,
    (m, line, indent) => `${line}${indent}@Override public String roleBase() { return cu.roleBase(); }\n${indent}`);
  if (patched === block) { console.log("  ! asAdminPrincipal: không chèn được"); return src; }
  console.log("  ✓ asAdminPrincipal -> thêm roleBase()");
  return src.slice(0, at) + patched + src.slice(end);
});

// ------------------------------------------------------------------ LỖI 2
apply(SCOPE, (src) => {
  if (src.includes(`isWarehouseRole(role)`)) { console.log("  = AccessScopeService đã vá, bỏ qua"); return src; }
  const from = `        if ("warehouse".equals(role)) {`;
  if (!src.includes(from)) { console.log("  ! không thấy nhánh warehouse"); return src; }
  const to = `        // SỬA LỖI PHẠM VI KHO (TASK-027): JS so với effectiveRole(user) = MÃ ENGINE
        // (scripts/system-route.mjs:229). Các nơi gọi trong Java truyền principal.role() = MÃ CHUẨN
        // (thu_kho/kho_tong) nên nhánh này trước đây KHÔNG BAO GIỜ chạy ⇒ người dùng kho thật bị
        // đánh giá sai: hoặc chặn oan (thiếu user_project_scopes), hoặc lọt vào kho central qua
        // module material_catalog. Nhận cả hai mã, đúng quy ước của RbacService.requireRole.
        if (isWarehouseRole(role)) {`;
  let out = src.replace(from, to);
  // Thêm hàm phụ trợ cạnh isAdmin.
  const iAdmin = out.indexOf("private static boolean isAdmin(");
  if (iAdmin < 0) { console.log("  ! không thấy isAdmin()"); return out; }
  const close = out.indexOf("\n    }", iAdmin) + "\n    }\n".length;
  const helper = `
    /** Vai trò kho: mã ENGINE "warehouse" hoặc mã CHUẨN thu_kho/kho_tong (ánh xạ nhiều-về-một). */
    private static boolean isWarehouseRole(String role) {
        return "warehouse".equals(role) || "thu_kho".equals(role) || "kho_tong".equals(role);
    }
`;
  out = out.slice(0, close) + helper + out.slice(close);
  console.log("  ✓ AccessScopeService -> isWarehouseRole(role) + hàm phụ trợ");
  return out;
});

// ------------------------------------------------------------------ hậu kiểm
const ctrl = readFileSync(CTRL, "utf8");
const scope = readFileSync(SCOPE, "utf8");
const checks = [
  ["create_request dùng helper", ctrl.includes("requestManagementUseCase.createRequest(asReqPrincipal(cu), payload)")],
  ["decide_approval dùng helper", ctrl.includes("requestManagementUseCase.decideApproval(asReqPrincipal(cu), payload)")],
  ["không còn lớp vô danh cho Request", !/requestManagementUseCase\.(createRequest|decideApproval)\(\s*new /.test(ctrl)],
  ["AccessScopeService dùng isWarehouseRole", scope.includes("isWarehouseRole(role)")],
  ["hàm isWarehouseRole tồn tại", /private static boolean isWarehouseRole\(String role\)/.test(scope)],
];
console.log(`\nĐã sửa ${changes} tệp. Hậu kiểm:`);
let ok = true;
for (const [name, pass] of checks) { console.log(`  ${pass ? "ĐẠT" : "HỎNG"}  ${name}`); if (!pass) ok = false; }
process.exit(ok ? 0 : 1);
