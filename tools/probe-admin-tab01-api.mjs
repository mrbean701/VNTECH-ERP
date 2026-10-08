// CHẨN ĐOÁN: uỷ nhiệm `admin_tab_01` có THẬT SỰ tới được bootstrap của người dùng không?
// ⭐ Dùng để phân biệt ⛔ «lỗi UI/probe» vs ⛔ «lỗi dữ liệu quyền» (bài học D-081: đo, đừng đoán).
//   node tools/probe-admin-tab01-api.mjs
const BASE = process.argv[2] || "http://127.0.0.1:9000";
const ADMIN = "admin", ADMIN_PASS = "Admin123456@", STAFF_PASS = "Engineer@2026";
const stamp = Date.now().toString().slice(-6);

const login = async (u, p) => {
  const r = await fetch(BASE + "/api/system", { method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "login", username: u, password: p }) });
  return { status: r.status, cookie: (r.headers.getSetCookie?.() || []).map((c) => c.split(";")[0]).join("; ") };
};
const post = async (cookie, action, payload = {}) => {
  const r = await fetch(BASE + "/api/system", { method: "POST", headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ action, ...payload }) });
  let j = null; try { j = await r.json(); } catch {}
  return { status: r.status, json: j };
};
const boot = async (cookie) => { const r = await fetch(BASE + "/api/system", { headers: { cookie } }); let j = null; try { j = await r.json(); } catch {} return j; };

const adm = await login(ADMIN, ADMIN_PASS);
if (adm.status !== 200) { console.error("⛔ không login được admin"); process.exit(1); }
const uname = `probe_tab01_${stamp}`;
await post(adm.cookie, "create_user", { username: uname, fullName: `Probe tab01 ${stamp}`, email: `${uname}@test.local`,
  employeeCode: `NV-T01-${stamp}`, role: "engineer", password: STAFF_PASS, projectIds: [] });
const users = (await boot(adm.cookie))?.data?.users || [];
const u = users.find((x) => String(x.username) === uname);
console.log(`  user: ${uname} · id=${u?.id}`);

// Cấp ĐÚNG như ca DƯƠNG của E2E: tab 06 + tab 01
const g = await post(adm.cookie, "save_user_access", {
  userId: String(u?.id), projectScopes: [], warehouseScopes: [],
  modulePermissions: [
    { moduleKey: "admin_tab_06", canView: true, canUse: false, canCreate: false, canEdit: false, canApprove: false, canExport: false, permissionExpiresAt: null },
    { moduleKey: "admin_tab_01", canView: true, canUse: false, canCreate: false, canEdit: false, canApprove: false, canExport: false, permissionExpiresAt: null },
  ],
});
console.log(`  cấp quyền: HTTP ${g.status}${g.json?.error ? " · " + g.json.error : ""}`);

const st = await login(uname, STAFF_PASS);
console.log(`  login user: HTTP ${st.status}`);
const b = await boot(st.cookie);
const mp = (b?.data?.modulePermissions || []).map((p) => `${p.moduleKey}(v=${Number(p.canView)})`);
const amp = (b?.data?.allModulePermissions || []).length;
console.log(`  ⭐ data.modulePermissions (CỦA CHÍNH HỌ): [${mp.join(", ")}]`);
console.log(`  ⭐ data.allModulePermissions: ${amp} dòng ${amp === 0 ? "⇒ ⭐ ĐÚNG như đã đoán: bootstrap ⛔ KHÔNG gửi cho non-admin" : ""}`);
const co01 = mp.some((s) => s.startsWith("admin_tab_01(v=1)"));
console.log(`  ⇒ ${co01 ? "✅ QUYỀN ĐÃ TỚI ĐƯỢC client ⇒ UI ⛔ không mở bước 01 là lỗi UI/probe" : "⛔ QUYỀN KHÔNG TỚI ⇒ lỗi ở tầng CẤP QUYỀN/BACKEND"}`);
process.exitCode = co01 ? 0 : 2;
