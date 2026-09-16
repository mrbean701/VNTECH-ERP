#!/usr/bin/env node
/**
 * Kiểm chứng sau seed V3:
 *  1) create_user có chạy được không (trước đây 400 vì organization_units rỗng)
 *  2) Người dùng mới có đăng nhập được không
 *  3) Menu có dựng được từ moduleCatalog/menuGroups không
 */
const BASE = process.argv[2] || "http://127.0.0.1:18081";
const ADMIN = process.env.AU || "admin";
const APASS = process.env.AP || "Admin123456@";

const login = async (u, p) => {
  const r = await fetch(`${BASE}/api/system`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "login", username: u, password: p }),
  });
  const cookie = (r.headers.getSetCookie?.() || []).map((c) => c.split(";")[0]).join("; ");
  return { status: r.status, cookie, body: await r.text() };
};

const a = await login(ADMIN, APASS);
console.log("admin login:", a.status);
if (!a.cookie) { console.log("❌ không đăng nhập được"); process.exit(1); }

const ctx = await (await fetch(`${BASE}/api/system`, { headers: { Cookie: a.cookie } })).json();
const orgs = ctx.data.organizationUnits || [];
console.log(`organizationUnits: ${orgs.length}`);
console.log("  5 đơn vị đầu:", orgs.slice(0, 5).map((o) => o.code).join(", "));

const org = orgs.find((o) => /KH|DA|TCKT/.test(String(o.code))) || orgs[0];
const uname = `testuser${Date.now().toString().slice(-5)}`;

console.log(`\n═══ 1) create_user (trước đây HTTP 400) ═══`);
const cr = await fetch(`${BASE}/api/system`, {
  method: "POST", headers: { "Content-Type": "application/json", Cookie: a.cookie },
  body: JSON.stringify({
    action: "create_user", username: uname, fullName: "Người dùng kiểm chứng",
    email: `${uname}@test.local`, role: "engineer", password: "Test@12345",
    organizationUnitId: org?.id ?? "", projectIds: [],
  }),
});
const cj = await cr.json().catch(() => ({}));
console.log(`  HTTP ${cr.status} · ${cj.message || cj.error || ""}`);
console.log(`  ${cr.status === 200 ? "✅ ĐÃ TẠO ĐƯỢC NGƯỜI DÙNG — lỗi H1 đã hết" : "❌ vẫn lỗi"}`);

console.log(`\n═══ 2) Đăng nhập bằng user mới ═══`);
const u = await login(uname, "Test@12345");
console.log(`  HTTP ${u.status} ${u.status === 200 ? "✅ đăng nhập được" : "❌ " + u.body.slice(0, 80)}`);

console.log(`\n═══ 3) Menu dựng từ dữ liệu ═══`);
const mods = ctx.data.moduleCatalog || [];
const groups = ctx.data.menuGroups || [];
console.log(`  moduleCatalog: ${mods.length} · menuGroups: ${groups.length}`);
if (groups.length) {
  console.log("  nhóm menu:");
  for (const g of groups.slice(0, 12)) {
    const children = mods.filter((m) => String(m.groupKey) === String(g.groupKey)).length;
    console.log(`    ${String(g.groupKey).padEnd(20)} ${String(g.name).padEnd(28)} (${children} mục)`);
  }
}
console.log(`  ${mods.length && groups.length ? "✅ MENU DỰNG ĐƯỢC TỪ DỮ LIỆU" : "⚠️ chưa đủ dữ liệu"}`);
