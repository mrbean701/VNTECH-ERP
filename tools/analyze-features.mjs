#!/usr/bin/env node
/** Liệt kê nhóm dữ liệu bootstrap + cấu trúc chức năng để phân tích dự án. */
const BASE = process.argv[2] || "http://127.0.0.1:18081";
const USER = process.env.ADMIN_USER || "admin";
const PASS = process.env.ADMIN_PASS || "Vntech@2026";

const login = await fetch(`${BASE}/api/system`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ action: "login", username: USER, password: PASS }),
});
console.log("login:", login.status);
const cookie = (login.headers.getSetCookie?.() || []).map((c) => c.split(";")[0]).join("; ");
if (!cookie) { console.log("KHÔNG có cookie"); process.exit(1); }

const boot = await (await fetch(`${BASE}/api/system`, { headers: { Cookie: cookie } })).json();
const d = boot.data;
if (!d) { console.log("không có data:", JSON.stringify(boot).slice(0, 300)); process.exit(1); }

console.log(`\n═══ NHÓM DỮ LIỆU BOOTSTRAP (${Object.keys(d).length} khóa) ═══`);
for (const k of Object.keys(d).sort()) {
  const v = d[k];
  const n = Array.isArray(v) ? v.length : (v && typeof v === "object" ? Object.keys(v).length : "-");
  console.log(`  ${k.padEnd(32)} ${String(n).padStart(5)}`);
}

console.log("\n═══ MODULE CATALOG (màn hình chức năng) ═══");
const mods = d.moduleCatalog || [];
console.log("  số module:", mods.length);
for (const m of mods.slice(0, 60)) {
  console.log(`  - ${m.moduleKey ?? m.key} · ${(m.name ?? m.label ?? "").slice(0, 55)}`);
}

console.log("\n═══ MENU GROUPS ═══");
const menus = d.menuGroups || [];
console.log("  số nhóm menu:", menus.length);
for (const m of menus) console.log(`  - ${m.code ?? m.groupKey} · ${m.name ?? ""}`);
