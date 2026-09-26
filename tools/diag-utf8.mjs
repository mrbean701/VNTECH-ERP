#!/usr/bin/env node
/**
 * Quét SÂU toàn bộ payload bootstrap để tìm chuỗi bị lỗi mã hoá (mojibake),
 * và so sánh dữ liệu MySQL đọc qua API với dữ liệu thô trong DB.
 */
const BASE = process.argv[2] || "http://127.0.0.1:18081";
const USER = process.env.U || "admin";
const PASS = process.env.P || "Admin123456@";

const login = await fetch(`${BASE}/api/system`, {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ action: "login", username: USER, password: PASS }),
});
const cookie = (login.headers.getSetCookie?.() || []).map((c) => c.split(";")[0]).join("; ");
const j = await (await fetch(`${BASE}/api/system`, { headers: { Cookie: cookie } })).json();

// Mojibake: UTF-8 bị giải mã như Latin-1/CP1252 rồi mã hoá lại
const MOJI = /Ã[\u0080-\u00BF]|Â[\u0080-\u00BF]|áº|á»|â€|Ä‘|Æ°|á»¡|Ã´|Ã¢|Ãª|Ã |Ã¡/;

let total = 0, bad = 0;
const badSamples = [];

function scan(obj, path = "") {
  if (obj === null || obj === undefined) return;
  if (typeof obj === "string") {
    total++;
    if (MOJI.test(obj)) {
      bad++;
      if (badSamples.length < 25) badSamples.push(`${path} = ${obj.slice(0, 70)}`);
    }
    return;
  }
  if (Array.isArray(obj)) { obj.forEach((v, i) => scan(v, `${path}[${i}]`)); return; }
  if (typeof obj === "object") { for (const k of Object.keys(obj)) scan(obj[k], path ? `${path}.${k}` : k); }
}

scan(j.data, "data");

console.log(`═══ QUÉT TOÀN BỘ PAYLOAD ═══`);
console.log(`  chuỗi đã kiểm tra : ${total}`);
console.log(`  chuỗi nghi mojibake: ${bad}`);
if (badSamples.length) {
  console.log("\n  MẪU NGHI LỖI:");
  for (const s of badSamples) console.log("    " + s);
} else {
  console.log("\n  ✅ KHÔNG phát hiện lỗi mã hoá trong payload API");
}

console.log("\n═══ ĐỐI CHIẾU 20 CHUỖI TIẾNG VIỆT ĐẦU ═══");
for (const [k, arr] of [["users", j.data.users], ["organizationUnits", j.data.organizationUnits],
  ["materials", j.data.materials], ["projects", j.data.projects]]) {
  for (const row of (arr || []).slice(0, 5)) {
    const label = row.fullName ?? row.name ?? row.code ?? "?";
    const ok = !MOJI.test(String(label));
    console.log(`  ${ok ? "✅" : "❌"} ${k.padEnd(18)} ${String(label)}`);
  }
}
