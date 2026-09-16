// PHASE 0B / S-01 — ĐIỀN MODULE CHO CÁC ACTION ĐANG KHAI RỖNG
//
// BỐI CẢNH: 75 action trong ActionRbacRegistry khai `List.of()` (module rỗng).
// Trong đó:
//   • 41 action ĐÃ được SystemController bảo vệ bằng requireRequireAdmin  → an toàn
//   • 32 action chỉ có requireCurrentUser, và use case tương ứng KHÔNG có requireRole
//     → LỖ HỔNG: mọi tài khoản đã đăng nhập đều gọi được (đã chứng minh bằng
//       tools/probe-security-rbac.mjs: 15/15 action lọt qua)
//
// NGUỒN GÁN MODULE: monolith JS gốc (ACTION_CATALOG.json) cũng để trống module cho
// đúng những action này ⇒ KHÔNG có nguồn nào để tra. Module dưới đây được gán theo
// NGỮ NGHĨA của action và theo module_catalog hiện có.
//
// TÍNH AN TOÀN: thêm module LUÔN làm CHẶT hơn, không bao giờ nới lỏng —
// vì RbacService.requireActionModule là phép kiểm THÊM, song song với requireRole
// trong use case. Một action có cả hai thì phải qua CẢ HAI.
//
//   node tools/patch-rbac-registry.mjs            # xem kế hoạch
//   node tools/patch-rbac-registry.mjs --apply    # thực thi
import { readFileSync, writeFileSync } from "node:fs";

const FILE = "java-backend/application/src/main/java/com/vntech/erp/application/rbac/ActionRbacRegistry.java";
const APPLY = process.argv.includes("--apply");

// action → [module(s), lý do]
const ASSIGN = {
  // ---- Hành việc tự phục vụ: GIỮ CÔNG KHAI, không gán module ----
  // (login/logout/setup/đổi mật khẩu/tự đổi ảnh — người dùng phải luôn làm được)
  // logout / change_password / update_profile_avatar: xử lý ở RbacService.PUBLIC_ACTIONS

  // ---- Danh mục vật tư (quản trị dữ liệu chủ toàn công ty) ----
  save_material_category:        ["material_catalog", "tạo/sửa Hệ M&E"],
  delete_material_category:      ["material_catalog", "xoá Hệ M&E"],
  set_material_category_status:  ["material_catalog", "bật/ngừng Hệ M&E"],
  save_material_subcategory:     ["material_catalog", "tạo/sửa Nhóm con"],
  delete_material_subcategory:   ["material_catalog", "xoá Nhóm con"],
  set_material_subcategory_status: ["material_catalog", "bật/ngừng Nhóm con"],
  import_material_catalog:       ["material_catalog", "nhập danh mục vật tư hàng loạt"],

  // ---- Tổ đội: sản lượng / thanh toán / hợp đồng phụ ----
  save_team_production:   ["teams", "ghi sản lượng tổ đội"],
  approve_team_production:["teams", "duyệt sản lượng tổ đội"],
  save_team_payment:      ["teams", "ghi thanh toán tổ đội"],
  save_team_subcontract:  ["teams", "lập hợp đồng phụ tổ đội"],
  settle_team_subcontract:["teams", "quyết toán hợp đồng phụ"],

  // ---- Ban chỉ huy / tổ đội theo dự án ----
  create_project_team:      ["site_command", "tạo tổ đội dự án"],
  delete_project_team:      ["site_command", "xoá tổ đội dự án"],
  set_project_team_status:  ["site_command", "bật/ngừng tổ đội dự án"],

  // ---- Cấu hình hệ thống: chỉ quản trị ----
  save_workflow:                   ["admin", "cấu hình quy trình"],
  delete_workflow:                 ["admin", "xoá quy trình"],
  set_workflow_status:             ["admin", "bật/ngừng quy trình"],
  save_approval_stage:             ["admin", "cấu hình bậc duyệt"],
  delete_approval_stage:           ["admin", "xoá bậc duyệt"],
  set_approval_stage_status:       ["admin", "bật/ngừng bậc duyệt"],
  save_email_settings:             ["admin", "cấu hình email/SMTP"],
  retry_email:                     ["admin", "gửi lại email trong hàng đợi"],
  save_ui_display_settings:        ["admin", "cấu hình hiển thị"],
  save_trust_development_settings: ["admin", "cấu hình chế độ phát triển"],
  install_license_foundation:      ["admin", "cài đặt nền tảng bản quyền"],
  request_license_transfer:        ["admin", "yêu cầu chuyển bản quyền"],
  bulk_import_users:               ["admin", "nhập tài khoản hàng loạt"],
  bulk_import_projects:            ["admin", "nhập dự án hàng loạt"],
};

const src = readFileSync(FILE, "utf8");
const before = src;

let applied = 0;
const notFound = [];
const rows = [];

for (const [action, [mods, why]] of Object.entries(ASSIGN)) {
  const from = `Map.entry("${action}", List.of()),`;
  const to = `Map.entry("${action}", List.of(${mods.split(",").map((m) => `"${m.trim()}"`).join(", ")})),`;
  if (!before.includes(from)) { notFound.push(action); continue; }
  const count = before.split(from).length - 1;
  if (count !== 1) { notFound.push(`${action} (xuất hiện ${count} lần)`); continue; }
  rows.push({ action, mods, why });
}

console.log("═".repeat(96));
console.log(`  S-01 — ĐIỀN MODULE CHO ACTION ĐANG KHAI RỖNG${APPLY ? "  [THỰC THI]" : "  [XEM TRƯỚC]"}`);
console.log("═".repeat(96));
console.log(`  Sẽ gán ${rows.length} action:`);
for (const r of rows) console.log(`   ${r.action.padEnd(34)} → ${r.mods.padEnd(24)} ${r.why}`);
if (notFound.length) {
  console.log(`\n  ⚠️  Không khớp mẫu (${notFound.length}): ${notFound.join(", ")}`);
}

if (!APPLY) {
  console.log("\n(Chạy lại với --apply để thực thi.)");
} else {
  let out = before;
  for (const r of rows) {
    const from = `Map.entry("${r.action}", List.of()),`;
    const to = `Map.entry("${r.action}", List.of(${r.mods.split(",").map((m) => `"${m.trim()}"`).join(", ")})),`;
    out = out.replace(from, to);
    applied++;
  }
  // Ghi UTF-8 KHÔNG BOM — tránh sự cố mã hoá hai lớp đã gặp trước đây
  writeFileSync(FILE, out, { encoding: "utf8" });
  console.log(`\n✅ Đã gán module cho ${applied} action vào ActionRbacRegistry.java`);
  console.log(`   Còn lại ${(out.match(/List\.of\(\)/g) || []).length} action khai rỗng (nhóm đã có requireRequireAdmin).`);
}
console.log("═".repeat(96));
