// [PHASE 0B · S-05] Đọc FileController (Java) + route Node để biết HIỆN có kiểm quyền gì.
import { readFileSync } from "node:fs";
const show = (file, n = 60) => {
  console.log(`\n===== ${file} =====`);
  try {
    const lines = readFileSync(file, "utf8").split("\n");
    lines.slice(0, n).forEach((l, i) => { const t = l.trim(); if (t) console.log(`${i + 1}: ${t.slice(0, 175)}`); });
  } catch (e) { console.log("  lỗi: " + e.message); }
};
show("java-backend/web/src/main/java/com/vntech/erp/web/controller/FileController.java", 70);
console.log("\n=== dấu hiệu KIỂM QUYỀN trong FileController ===");
const t = readFileSync("java-backend/web/src/main/java/com/vntech/erp/web/controller/FileController.java", "utf8");
for (const k of ["requireCurrentUser", "requireActionModule", "rbac", "session", "Cookie", "canAccess", "401", "403", "SecurityContext"]) {
  const n = (t.match(new RegExp(k, "g")) || []).length;
  console.log(`  ${k.padEnd(22)} × ${n}`);
}
