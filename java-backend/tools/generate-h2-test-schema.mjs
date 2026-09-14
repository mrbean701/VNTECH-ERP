// Sinh schema-h2.sql (test) từ V1__baseline.sql — H2 MySQL-mode tương thích.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");
const baseline = join(repoRoot, "java-backend", "infrastructure", "src", "main", "resources", "db", "migration", "V1__baseline.sql");
const outPath = join(repoRoot, "java-backend", "web", "src", "test", "resources", "schema-h2.sql");
// LƯU Ý: còn một bản cũ KHÔNG được dùng ở web/src/main/resources/db/demo/schema-h2.sql.
// Test thật dùng `classpath:schema-h2.sql` (application-test.yml) = file ở src/test/resources.
// Không sửa bản db/demo — nó là di vật, sửa vào đó sẽ không ảnh hưởng test.

const sql = readFileSync(baseline, "utf8");

/**
 * Chuyển index UNIQUE rời (CREATE UNIQUE INDEX `x` ON `t` (`c`);) sang cú pháp H2 tương đương.
 * VÌ SAO PHẢI GIỮ: bản trước BỎ TẤT CẢ index rời với giả định "test không cần", nhưng điều đó làm
 * H2 THIẾU ràng buộc duy nhất so với MySQL — vd `projects_code_uidx`. Hệ quả: test H2 không bao giờ
 * bắt được bug trùng khoá (bug #16) và bug trùng số chứng từ (bug #11), vì MySQL mới là nơi ném lỗi.
 *
 * Chỉ giữ UNIQUE; index thường vẫn bỏ (H2 không hỗ trợ functional/prefix index của MySQL).
 */
const uniqueIndexes = [];
for (const m of sql.matchAll(/CREATE UNIQUE INDEX `([^`]+)` ON `([^`]+)` \(([^;]+)\);/g)) {
  const [, name, table, colsRaw] = m;
  // Cột có prefix length (vd `entity_type`(191)) → H2 không hỗ trợ, lấy tên cột trần.
  const cols = colsRaw
    .split(",")
    .map((c) => c.trim().replace(/^`([^`]+)`\(\d+\)$/, "`$1`"))
    .join(", ");
  uniqueIndexes.push(`CREATE UNIQUE INDEX IF NOT EXISTS \`${name}\` ON \`${table}\` (${cols});`);
}

let out = sql
  .replace(/ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci/g, "")
  .replace(/` DATETIME\(3\)/g, "` TIMESTAMP(3)")
  .replace(/`\(191\)/g, "`")     // H2 không hỗ trợ prefix length (MySQL-only) — giữ backtick đóng
  .replace(/,\n\s*CONSTRAINT `[^`]+` FOREIGN KEY \([^)]*\) REFERENCES `[^`]+` \(`[^`]+`\)/g, "") // bỏ FK
  .replace(/CREATE TABLE (`[a-z_]+`)/g, "CREATE TABLE IF NOT EXISTS $1")
  // Bỏ index THƯỜNG (không ảnh hưởng tính đúng đắn), nhưng GIỮ index UNIQUE (xem giải thích trên).
  .replace(/CREATE INDEX `[^`]+` ON `[^`]+` \([^;]+\);\n?/g, "")
  .replace(/CREATE UNIQUE INDEX `[^`]+` ON `[^`]+` \([^;]+\);\n?/g, "")
  .replace(/CREATE (UNIQUE )?INDEX IF NOT EXISTS `[^`]+` ON `[^`]+` \([^;]+\);\n?/g, "")
  // UNIQUE key inline (UNIQUE KEY `name` (...)) — H2 hỗ trợ cú pháp? chuyển thành UNIQUE(...)
  .replace(/UNIQUE KEY `[^`]+` \(([^)]+)\)/g, "UNIQUE ($1)");

// Gắn lại toàn bộ UNIQUE index rời ở cuối file.
out += "\n\n-- Giữ ràng buộc UNIQUE rời của MySQL (bản trước bỏ sót nên H2 lỏng hơn MySQL).\n"
  + uniqueIndexes.join("\n") + "\n";

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, out);
console.log("schema-h2.sql written, lines:", out.split("\n").length,
  "· unique indexes kept:", uniqueIndexes.length);