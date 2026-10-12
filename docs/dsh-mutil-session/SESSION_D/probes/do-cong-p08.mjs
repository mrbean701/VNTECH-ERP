// ĐO CỔNG ROLE của các action P-08 ở CẢ 2 ĐƯỜNG (chỉ ĐỌC) — đầu vào bắt buộc trước khi gán module (bài học TM-04).
import { readFileSync } from "node:fs";
const root = process.argv[2] || ".";
const js = readFileSync(`${root}/scripts/system-route.mjs`, "utf8");
const java = readFileSync(`${root}/java-backend/web/src/main/java/com/vntech/erp/web/controller/SystemController.java`, "utf8");

const ACTIONS = [
  // §A 10 action (2 action tổ đội đã bị LOẠI theo TM-04)
  "save_material_category", "save_material_subcategory", "set_material_category_status", "set_material_subcategory_status",
  "delete_material_category", "delete_material_subcategory", "import_material_catalog",
  "save_approval_stage", "set_approval_stage_status", "delete_approval_stage",
  // §C 6 action cấu hình
  "bulk_import_projects", "bulk_import_users", "save_email_settings", "retry_email",
  "save_ui_display_settings", "save_trust_development_settings",
];

const jsGate = (a) => {
  const i = js.indexOf(`action === "${a}"`);
  if (i < 0) return "⛔ KHÔNG có trong route JS";
  const seg = js.slice(i, i + 400);
  const m = seg.match(/requireRole\([^)]*\)|requireRequireAdmin\([^)]*\)|ADMIN_ONLY[^;]*/);
  const role = seg.match(/requireRole\(\s*user\s*,\s*\[([^\]]*)\]/);
  return role ? `requireRole([${role[1]}])` : (m ? m[0].slice(0, 60) : "⚠️ không thấy cổng role trong 400 ký tự đầu");
};
const javaGate = (a) => {
  const i = java.indexOf(`case "${a}" ->`);
  if (i < 0) return "⛔ KHÔNG có case ở Java";
  const seg = java.slice(i, i + 400);
  const m = seg.match(/requireRequireAdmin\([^)]*\)|requireRole\([^)]*\)|requireCurrentUser\([^)]*\)|actionRbac[^;]*/);
  return m ? m[0].slice(0, 70) : "(không thấy cổng trong 400 ký tự đầu)";
};

console.log("ACTION".padEnd(40), "| JS", "| JAVA");
for (const a of ACTIONS) console.log(a.padEnd(40), "|", jsGate(a).padEnd(38), "|", javaGate(a));
