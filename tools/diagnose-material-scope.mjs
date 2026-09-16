// Chẩn đoán: user có quyền XEM material_catalog nhận được gì trong bootstrap?
const BASE = "http://127.0.0.1:9000";
const { execFileSync } = await import("node:child_process");
const MYSQL = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
const sql = (q) => execFileSync(MYSQL, ["--default-character-set=utf8mb4", "-uvntech", "-pvntech", "vntech_erp", "-N", "-B", "-e", q], { encoding: "utf8" }).trim();

const login = async (u, p) => {
  const r = await fetch(BASE + "/api/system", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "login", username: u, password: p }) });
  return { ok: r.status === 200, cookie: (r.headers.getSetCookie?.() || []).map((c) => c.split(";")[0]).join("; ") };
};
const post = async (cookie, action, payload = {}) => {
  const r = await fetch(BASE + "/api/system", { method: "POST", headers: { "content-type": "application/json", cookie }, body: JSON.stringify({ action, ...payload }) });
  let j = null; try { j = await r.json(); } catch {}
  return { status: r.status, json: j };
};
const boot = async (cookie) => (await (await fetch(BASE + "/api/system", { headers: { cookie } })).json()).data || {};

const admin = await login("admin", "Admin123456@");
const a = await boot(admin.cookie);
console.log("=== ADMIN ===");
console.log("  materials      :", (a.materials || []).length);
console.log("  adminMaterials :", (a.adminMaterials || []).length);
console.log("  adminMaterials có trong payload? ", "adminMaterials" in a);
console.log("  materialCategories:", (a.materialCategories || []).length, "| materialSubcategories:", (a.materialSubcategories || []).length);

// tạo user view-only
const stamp = Date.now().toString().slice(-6);
const uname = `diag_${stamp}`;
const mk = await post(admin.cookie, "create_user", { username: uname, fullName: `Diag ${stamp}`, email: `${uname}@t.local`, employeeCode: `NV-DG-${stamp}`, role: "engineer", password: "Engineer@2026", projectIds: [] });
const u = (await boot(admin.cookie)).users.find((x) => String(x.username) === uname);
const g = await post(admin.cookie, "save_user_access", { userId: u.id, projectScopes: [], warehouseScopes: [], modulePermissions: [{ moduleKey: "material_catalog", canView: true, canUse: false, canCreate: false, canEdit: false, canApprove: false, canExport: false, permissionExpiresAt: "" }] });
console.log(`\n=== USER VIEW-ONLY (${uname}) ===  create=${mk.status} grant=${g.status}`);

const s = await login(uname, "Engineer@2026");
const b = await boot(s.cookie);
console.log("  materials      :", (b.materials || []).length);
console.log("  adminMaterials :", "adminMaterials" in b ? (b.adminMaterials || []).length : "(không có khoá)");
console.log("  materialCategories:", (b.materialCategories || []).length, "| materialSubcategories:", (b.materialSubcategories || []).length);
console.log("  modulePermissions (của user này):", (b.modulePermissions || []).length);
const mp = (b.modulePermissions || []).find((x) => String(x.moduleKey) === "material_catalog");
console.log("  quyền material_catalog:", mp ? JSON.stringify(mp).slice(0, 160) : "(không có dòng nào)");

sql(`DELETE FROM users WHERE username LIKE 'diag_%';`);
console.log("\n▸ đã dọn user chẩn đoán");
