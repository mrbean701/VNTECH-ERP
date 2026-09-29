// USER 28/09/2026 — Liet ke TOAN BO user (khong cat) + quyen module `admin` hien tai.
import { execFileSync } from "node:child_process";
const M = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
const q = (sql) => {
  try { return execFileSync(M, ["-u", "vntech", "-pvntech", "-N", "-B", "vntech_erp", "-e", sql],
    { encoding: "utf8" }).trim(); } catch (e) { return "LOI: " + String(e.stdout || e.stderr || "").slice(0, 100); }
};
const rows = q("SELECT username, role, active, IFNULL(organization_unit_id,'-') FROM users ORDER BY username;");
console.log("== TAT CA USER (" + (rows ? rows.split("\n").length : 0) + ") ==");
for (const r of (rows || "").split("\n")) {
  const [u, role, act, org] = r.split("\t");
  console.log("  " + String(u).padEnd(22) + " role=" + String(role).padEnd(12) + " active=" + act + " org=" + org);
}
console.log("\n== USER TEN CO 'user' ? ==");
const hit = (rows || "").split("\n").filter((r) => r.toLowerCase().startsWith("user\t"));
console.log("  " + (hit.length ? hit.join("\n  ") : "(KHONG CO user ten 'user')"));
console.log("\n== QUYEN module 'admin' ==");
console.log("  " + (q("SELECT u.username, p.module_key, p.can_view, p.can_use, p.can_create, p.can_edit, p.can_approve, p.can_export, p.permission_source FROM user_module_permissions p JOIN users u ON u.id=p.user_id WHERE p.module_key='admin' ORDER BY u.username;") || "(khong co)").replace(/\n/g, "\n  "));
console.log("\n== module_catalog 'admin' ==");
console.log("  " + (q("SELECT module_key,label,group_key,sort_order,system_locked,active FROM module_catalog WHERE module_key='admin';") || "(khong co)"));
