// Sinh schema-h2.sql (test) từ V1__baseline.sql — H2 MySQL-mode tương thích.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");
const baseline = join(repoRoot, "java-backend", "infrastructure", "src", "main", "resources", "db", "migration", "V1__baseline.sql");
const outPath = join(repoRoot, "java-backend", "web", "src", "test", "resources", "schema-h2.sql");

const sql = readFileSync(baseline, "utf8");
let out = sql
  .replace(/ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci/g, "")
  .replace(/` DATETIME\(3\)/g, "` TIMESTAMP(3)")
  .replace(/`\(191\)/g, "`")     // H2 không hỗ trợ prefix length (MySQL-only) — giữ backtick đóng
  .replace(/,\n\s*CONSTRAINT `[^`]+` FOREIGN KEY \([^)]*\) REFERENCES `[^`]+` \(`[^`]+`\)/g, "") // bỏ FK
  .replace(/CREATE TABLE (`[a-z_]+`)/g, "CREATE TABLE IF NOT EXISTS $1")
  .replace(/CREATE (UNIQUE )?INDEX `[^`]+` ON `[^`]+` \([^;]+\);\n/g, "") // bỏ index riêng (H2 không hỗ trợ functional/prefix) — test không cần
  .replace(/CREATE (UNIQUE )?INDEX IF NOT EXISTS `[^`]+` ON `[^`]+` \([^;]+\);/g, "")
  // UNIQUE key inline (UNIQUE KEY `name` (...)) — H2 hỗ trợ cú pháp? chuyển thành UNIQUE(...)
  .replace(/UNIQUE KEY `[^`]+` \(([^)]+)\)/g, "UNIQUE ($1)");

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, out);
console.log("schema-h2.sql written, lines:", out.split("\n").length);