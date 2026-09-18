// [PHASE 8 · B2] Lấy mỏ neo JS: câu `INSERT INTO purchase_orders` + literal trạng thái PO (để đổi sang pending_approval).
import { readFileSync } from "node:fs";
const FILE = "scripts/system-route.mjs";
const lines = readFileSync(FILE, "utf8").split("\n");
lines.forEach((l, i) => {
  if (l.includes("INSERT INTO purchase_orders")) {
    console.log(`--- dòng ${i + 1} ---`);
    for (let k = i; k < Math.min(i + 8, lines.length); k++) console.log(`${k + 1}: ${(lines[k] || "").trim().slice(0, 200)}`);
  }
});
console.log("\n=== các literal trạng thái PO xuất hiện trong tệp ===");
const set = new Map();
lines.forEach((l, i) => {
  for (const m of l.matchAll(/"([a-z_]*delivery[a-z_]*|draft|pending_approval|approved|cancelled|completed[a-z_]*)"/g)) {
    const k = m[1];
    if (!set.has(k)) set.set(k, []);
    set.get(k).push(i + 1);
  }
});
for (const [k, v] of set) console.log(`  "${k}" × ${v.length} → dòng ${v.slice(0, 6).join(", ")}`);
