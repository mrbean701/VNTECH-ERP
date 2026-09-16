#!/usr/bin/env node
/**
 * Chẩn đoán "DB có dữ liệu nhưng frontend không hiển thị".
 * Kiểm tra: bootstrap trả gì, encoding UTF-8 có đúng không, và menu có dựng được không.
 */
const BASE = process.argv[2] || "http://127.0.0.1:18081";
const USER = process.env.U || "admin";
const PASS = process.env.P || "Vntech@2026";

const login = await fetch(`${BASE}/api/system`, {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ action: "login", username: USER, password: PASS }),
});
console.log("login:", login.status);
const cookie = (login.headers.getSetCookie?.() || []).map((c) => c.split(";")[0]).join("; ");
if (!cookie) { console.log("không có cookie — dừng"); process.exit(1); }

const res = await fetch(`${BASE}/api/system`, { headers: { Cookie: cookie } });
const ctype = res.headers.get("content-type");
console.log("content-type:", ctype, "← phải có charset=UTF-8");

const buf = Buffer.from(await res.arrayBuffer());
const j = JSON.parse(buf.toString("utf8"));
const d = j.data || {};

console.log("\n═══ DỮ LIỆU BOOTSTRAP (số bản ghi) ═══");
const keys = ["projects","adminProjects","materials","users","staffDirectory","warehouses",
  "organizationUnits","moduleCatalog","menuGroups","userScopes","userWarehouseScopes",
  "modulePermissions","allModulePermissions","approvalStages","approvalStageCatalog",
  "materialCategories","roleCatalog","requests","purchaseOrders","teams","suppliers"];
for (const k of keys) {
  const v = d[k];
  const n = Array.isArray(v) ? v.length : (v === undefined ? "THIẾU" : typeof v);
  const flag = v === undefined ? "❌" : (Array.isArray(v) && v.length === 0 ? "⚠️ " : "✅");
  console.log(`  ${flag} ${k.padEnd(24)} ${n}`);
}

console.log("\n═══ KIỂM TRA ENCODING UTF-8 ═══");
const samples = [
  ["settings.companyName", d.settings?.companyName],
  ["projects[0].name", d.projects?.[0]?.name],
  ["materials[0].name", d.materials?.[0]?.name],
  ["users[0].fullName", d.users?.[0]?.fullName],
  ["organizationUnits[0].name", d.organizationUnits?.[0]?.name],
];
for (const [label, val] of samples) {
  const s = String(val ?? "(rỗng)");
  // Phát hiện mojibake: chuỗi UTF-8 bị giải mã sai thường chứa các ký tự Latin-1 đặc trưng
  const mojibake = /Ã|Â|áº|á»|Ä‘|Æ°|á»¡/.test(s);
  console.log(`  ${mojibake ? "❌ MOJIBAKE" : "✅ OK"}  ${label.padEnd(28)} = ${s.slice(0, 60)}`);
}

console.log("\n═══ MENU CÓ DỰNG ĐƯỢC KHÔNG? ═══");
console.log(`  moduleCatalog = ${(d.moduleCatalog || []).length} → ${(d.moduleCatalog || []).length ? "dựng được menu động" : "RỖNG ⇒ UI phải dùng fallback tĩnh"}`);
console.log(`  menuGroups    = ${(d.menuGroups || []).length}`);

console.log("\n═══ BYTE ĐẦU TIÊN (phát hiện BOM/lỗi mã hoá) ═══");
console.log("  hex 50 byte đầu:", buf.subarray(0, 50).toString("hex"));
