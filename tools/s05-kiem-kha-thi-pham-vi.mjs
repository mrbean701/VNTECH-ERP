// [PHASE 0B · S-05] Kiểm khả thi: bảng tệp có cột project/warehouse không? + API của FileUseCase.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
const MYSQL = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
const q = (sql) => execFileSync(MYSQL, ["-uvntech", "-pvntech", "--default-character-set=utf8mb4", "-N", "-B", "vntech_erp", "-e", sql], { encoding: "utf8" }).trim();

console.log("=== bảng tệp/đính kèm có thật ===");
const t = q("SELECT GROUP_CONCAT(table_name) FROM information_schema.tables WHERE table_schema='vntech_erp' AND (table_name LIKE '%attach%' OR table_name LIKE '%file%');");
console.log("  " + t);
for (const name of t.split(",").filter(Boolean)) {
  const cols = q(`SELECT GROUP_CONCAT(column_name ORDER BY ordinal_position) FROM information_schema.columns WHERE table_schema='vntech_erp' AND table_name='${name}';`);
  console.log(`\n  ${name}: ${cols}`);
  const hasProj = /project_id|warehouse_id/.test(cols);
  console.log(`    ⇒ có cột phạm vi (project_id/warehouse_id)? ${hasProj ? "CÓ ✔ ⇒ kiểm phạm vi gọn" : "KHÔNG ⇒ phải tra ngược qua entityType/entityId"}`);
  const n = q(`SELECT COUNT(*) FROM \`${name}\``);
  console.log(`    số dòng: ${n}`);
}
console.log("\n=== FileUseCase: method công khai ===");
const f = "java-backend/application/src/main/java/com/vntech/erp/application/service/FileUseCase.java";
readFileSync(f, "utf8").split("\n").forEach((l, i) => { const s = l.trim(); if (/^public .*\(/.test(s)) console.log(`  ${i + 1}: ${s.slice(0, 150)}`); });
