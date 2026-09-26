// [PHASE 8 · B2 · parity Java] Mỏ neo cho 4 tệp: PurchaseStore (port) + PurchaseStoreAdapter + use-case + controller.
import { readFileSync } from "node:fs";
const P = "java-backend/application/src/main/java/com/vntech/erp/application/port/out/PurchaseStore.java";
const A = "java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/PurchaseStoreAdapter.java";
console.log("===== PurchaseStore (port) — chữ ký method =====");
try { readFileSync(P, "utf8").split("\n").forEach((l, i) => { const t = l.trim(); if (/^(Optional|void|List|Map|String|boolean|long|int)\b.*\(/.test(t)) console.log(`  ${i + 1}: ${t.slice(0, 150)}`); }); }
catch (e) { console.log("  lỗi: " + e.message); }
console.log("\n===== PurchaseStoreAdapter — method gần closePoLine / findPoForReceiving =====");
try {
  const lines = readFileSync(A, "utf8").split("\n");
  lines.forEach((l, i) => { const t = l.trim(); if (/public .*(closePoLine|findPoForReceiving|findPoLine|updateRequestSupplyStatus)/.test(t)) console.log(`  ${i + 1}: ${t.slice(0, 150)}`); });
  const j = lines.findIndex((l) => l.includes("public void closePoLine"));
  if (j >= 0) { console.log(`  --- thân closePoLine (dòng ${j + 1}..) ---`); for (let k = j; k < Math.min(j + 8, lines.length); k++) console.log(`  ${k + 1}: ${(lines[k] || "").trim().slice(0, 150)}`); }
} catch (e) { console.log("  lỗi: " + e.message); }
