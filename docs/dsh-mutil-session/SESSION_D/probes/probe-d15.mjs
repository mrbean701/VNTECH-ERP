// ĐIỀU TRA `BUG-D15`: việc tự tạo (`CVCN-…`) có tồn tại trong CSDL/API không, và AI nhìn thấy nó?
const BASE = process.argv[2] || "http://127.0.0.1:9000";
const TASKNO = process.argv[3] || "CVCN-261008-7629";
const STAFF = { u: process.argv[4] || "probe_self_186408", p: "Engineer@2026" };
const post = async (cookie, action, payload = {}) => {
  const r = await fetch(BASE + "/api/system", { method: "POST", headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) }, body: JSON.stringify({ action, ...payload }) });
  let j = null; try { j = await r.json(); } catch { }
  return { status: r.status, json: j };
};
const login = async (u, p) => {
  const r = await fetch(BASE + "/api/system", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "login", username: u, password: p }) });
  return { ok: r.status === 200, cookie: (r.headers.getSetCookie?.() || []).map((c) => c.split(";")[0]).join("; "), status: r.status };
};
const boot = async (cookie) => (await fetch(BASE + "/api/system", { headers: { cookie } }).then((r) => r.json()).catch(() => null))?.data || {};
const show = (label, items) => {
  const hit = items.find((r) => String(r.taskNo) === TASKNO);
  console.log(`  ${hit ? "✅" : "❌"} ${label}: ${items.length} việc${hit ? ` — THẤY ${hit.taskNo} · dept=${hit.departmentCode} · assignedTo=${hit.assignedTo} · người nhận=${hit.assignedToName} · status=${hit.status}` : ` — ⛔ KHÔNG thấy ${TASKNO}`}`);
  const cns = items.filter((r) => String(r.departmentCode) === "CN");
  console.log(`      (trong đó dept='CN': ${cns.length}${cns.length ? " — " + cns.map((r) => r.taskNo).join(", ") : ""})`);
  return hit;
};

const admin = await login("admin", "Admin123456@");
console.log("═".repeat(78));
console.log(`  ĐIỀU TRA BUG-D15 · tìm ${TASKNO}`);
if (admin.ok) { const b = await boot(admin.cookie); show("ADMIN (lọc 1=1)", b.workItems || []); }
const staff = await login(STAFF.u, STAFF.p);
console.log(`  đăng nhập nhân viên ${STAFF.u}: HTTP ${staff.status}`);
if (staff.ok) {
  const b = await boot(staff.cookie);
  show(`NHÂN VIÊN ${STAFF.u}`, b.workItems || []);
  console.log("      role/dept của nhân viên:", JSON.stringify(b.user ? { role: b.user.role, base: b.user.roleBase, department: b.user.department } : null));
  const mine = (b.workItems || []).filter((r) => String(r.assignedTo) === String(b.user?.id));
  console.log(`      việc ĐƯỢC GIAO cho chính họ: ${mine.length}`);
}
console.log("═".repeat(78));
