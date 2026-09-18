// Q3 — tìm NGUYÊN NHÂN 409 khi nhập danh mục vật tư qua Java: so câu INSERT của Java với ràng buộc NOT NULL thật.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const MYSQL = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
const q = (sql) => execFileSync(MYSQL, ["-uvntech", "-pvntech", "--default-character-set=utf8mb4", "-N", "-B", "vntech_erp", "-e", sql], { encoding: "utf8" }).trim();

console.log("=== 1. Cột NOT NULL KHÔNG có default của bảng `materials` ===");
console.log(q("SELECT column_name, column_type, column_default, is_nullable FROM information_schema.columns WHERE table_schema='vntech_erp' AND table_name='materials' AND is_nullable='NO' ORDER BY ordinal_position").split(/\r?\n/).map((l) => "  " + l).join("\n"));

console.log("\n=== 2. Khoá ngoại / UNIQUE của `materials` ===");
console.log(q("SELECT constraint_name, constraint_type FROM information_schema.table_constraints WHERE table_schema='vntech_erp' AND table_name='materials'").split(/\r?\n/).map((l) => "  " + l).join("\n"));

console.log("\n=== 3. Câu INSERT `materials` trong Java (nguồn) ===");
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    if (!name.endsWith(".java")) continue;
    const text = readFileSync(p, "utf8");
    if (/INSERT INTO materials\b/i.test(text)) {
      const lines = text.split("\n");
      lines.forEach((l, i) => {
        if (/INSERT INTO materials\b/i.test(l)) {
          console.log(`  ${p.replace(process.cwd() + "\\", "")}:${i + 1}`);
          for (let k = i; k < Math.min(i + 14, lines.length); k++) console.log(`     ${lines[k].trim().slice(0, 200)}`);
        }
      });
    }
  }
};
walk("java-backend");

console.log("\n=== 4. `materials` hiện có (14 dòng) — cột id/code/system/category_id ===");
console.log(q("SELECT id, code, system, category_id, subcategory_id FROM materials ORDER BY code LIMIT 20").split(/\r?\n/).map((l) => "  " + l).join("\n"));
