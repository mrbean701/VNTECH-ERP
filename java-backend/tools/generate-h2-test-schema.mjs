// Sinh schema-h2.sql (test) từ V1__baseline.sql — H2 MySQL-mode tương thích.
//
// ============================================================================================
// [TASK-120] QUY TRÌNH DÙNG ĐÚNG — ĐỌC TRƯỚC KHI CHẠY (bắt buộc)
// ============================================================================================
// Chạy:  node java-backend/tools/generate-h2-test-schema.mjs
//
// ⚠️  Sinh lại là một THAY ĐỔI LƯỢC ĐỒ TEST, KHÔNG phải thao tác vô hại. Sau khi chạy:
//   1. `git diff java-backend/web/src/test/resources/schema-h2.sql` — ĐỌC KỸ TỪNG DÒNG.
//      Lần sinh lại CÓ THỂ THÊM BẢNG/CỘT MỚI từ các migration mới hơn (ví dụ đã từng thêm
//      `work_item_comments`, `work_item_participants`), và có thể đổi thứ tự/định dạng dòng.
//      Nếu diff KHÔNG như mong đợi/không giải thích được ⇒ `git checkout --` khôi phục NGUYÊN VĂN
//      bản đang commit (bản bàn tay đã qua cổng xanh), KHÔNG commit bản vừa sinh.
//   2. Chạy lại CỔNG trước khi commit:  mvn -B -pl web -am test   (bắt buộc XANH: 0 failure/0 error).
//      Không có bước này thì không được commit schema-h2.sql.
//   3. Chỉ commit khi (1) diff đã review xong VÀ (2) cổng xanh. Commit riêng, thông điệp ASCII.
//
// Ghi chú: `schema-h2.sql` đang commit là bản BÀN TAY (hand-edited) đã qua cổng — KHÔNG phải bản
// vừa sinh. Generator có giữ khối `-- [H2-MANUAL-START/END]` và tôn trọng `DROP COLUMN`
// (xem [TASK-115] bên dưới), nhưng vẫn KHÔNG được chạy "blindly".
// ============================================================================================
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
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

// ---------------------------------------------------------------------------
// BẢNG THÊM SAU V1 (V2, V3, ... — vd V8 workflow đa luồng).
// VÌ SAO CẦN: baseline V1 chỉ chứa schema gốc. Trước đây generator chỉ đọc V1 nên
// mọi bảng tạo thêm bằng migration sau này đều THIẾU trong H2 ⇒ test vỡ với
// "Table not found" ngay khi BootstrapDataAdapter truy vấn bảng mới.
// KHÔNG sửa V1 tại chỗ vì sẽ làm Flyway báo "checksum mismatch" trên DB đang chạy.
// ---------------------------------------------------------------------------
const migrationDir = join(repoRoot, "java-backend", "infrastructure", "src", "main", "resources", "db", "migration");
const incremental = [];
const alters = [];
const renames = [];
const drops = [];
for (const name of readdirSync(migrationDir).filter((n) => /^V\d+__.+\.sql$/.test(n) && !/^V1__/.test(n)).sort()) {
  const text = readFileSync(join(migrationDir, name), "utf8");
  for (const m of text.matchAll(/CREATE TABLE IF NOT EXISTS `[^`]+` \([\s\S]*?\n\)[^;]*;/g)) {
    incremental.push(m[0].trim());
  }
  // Cột thêm sau bằng ALTER TABLE ... ADD COLUMN (vd V10: users.system_level_code).
  // H2 có hỗ trợ ADD COLUMN IF NOT EXISTS nên phát lại an toàn.
  for (const m of text.matchAll(/ALTER TABLE `([^`]+)`\s+ADD COLUMN `([^`]+)`\s+([a-zA-Z0-9_]+(?:\([0-9,]+\))?)([^;]*);/g)) {
    alters.push(`ALTER TABLE \`${m[1]}\` ADD COLUMN IF NOT EXISTS \`${m[2]}\` ${m[3]};`);
  }
  // Đổi tên cột (vd V11: system_level_catalog.rank → level_rank).
  // H2 không hiểu cú pháp MySQL `CHANGE COLUMN old new type`, nên KHÔNG phát lại ALTER
  // mà ghi nhận để đổi tên NGAY TRONG câu CREATE TABLE bên dưới.
  for (const m of text.matchAll(/ALTER TABLE `([^`]+)`\s+CHANGE COLUMN `([^`]+)`\s+`([^`]+)`/g)) {
    renames.push({ table: m[1], from: m[2], to: m[3] });
  }
  // [TASK-115] Cột bị XOÁ bằng migration (vd V19: workflow_definitions.version — PHASE 8 · WF-03).
  // VÌ SAO CẦN: generator dựng `workflow_definitions` từ V8 (có `version`) và KHÔNG hề biết V19 đã DROP,
  // nên sinh lại tệp sẽ **đưa cột `version` trở lại** — trong khi MySQL thật đã bị xoá và mã Java (đã sửa)
  // không còn ghi cột này. Ghi nhận để xoá đúng DÒNG khai báo cột trong CREATE TABLE bên dưới.
  for (const m of text.matchAll(/ALTER TABLE `([^`]+)`\s+DROP COLUMN `([^`]+)`/g)) {
    drops.push({ table: m[1], column: m[2] });
  }
}
if (incremental.length || alters.length) {
  const extra = incremental.join("\n\n")
    .replace(/ENGINE=InnoDB DEFAULT CHARSET=utf8mb4( COLLATE=\w+)?/g, "")
    .replace(/`\s+DATETIME\(3\)/gi, "` TIMESTAMP(3)")
    .replace(/COMMENT '[^']*'/g, "")
    .replace(/UNIQUE KEY `[^`]+` \(([^)]+)\)/g, "UNIQUE ($1)")
    .replace(/,\s*\n\s*KEY `[^`]+` \([^)]*\)/g, "");
  out += "\n\n-- Bảng thêm bởi migration sau V1 (H2 không chạy Flyway).\n" + extra + "\n";
  if (alters.length) out += "\n-- Cột thêm bởi migration sau V1.\n" + alters.join("\n") + "\n";
}

// Áp dụng đổi tên cột NGAY TRONG câu CREATE TABLE tương ứng (H2 không hiểu CHANGE COLUMN).
// Chỉ thay trong đúng khối CREATE TABLE của bảng đó để không đụng bảng khác.
for (const r of renames) {
  const block = new RegExp("(CREATE TABLE IF NOT EXISTS `" + r.table + "` \\([\\s\\S]*?\\n\\) ;)");
  const found = out.match(block);
  if (found) {
    out = out.replace(found[1], found[1].split("`" + r.from + "`").join("`" + r.to + "`"));
    console.log(`Đổi tên cột H2: ${r.table}.${r.from} → ${r.to}`);
  } else {
    console.warn(`⚠️ Không tìm thấy CREATE TABLE cho ${r.table} để đổi tên ${r.from} → ${r.to}`);
  }
}

// [TASK-115] Áp dụng XOÁ CỘT vào đúng câu CREATE TABLE của bảng đó (H2 không chạy Flyway).
// Chỉ bỏ DÒNG khai báo cột — KHÔNG đụng tên cột xuất hiện trong khoá/UNIQUE/index.
for (const d of drops) {
  const block = new RegExp("(CREATE TABLE IF NOT EXISTS `" + d.table + "` \\([\\s\\S]*?\\n\\) ;)");
  const found = out.match(block);
  if (!found) {
    console.warn(`⚠️ Không tìm thấy CREATE TABLE cho ${d.table} để xoá cột ${d.column}`);
    continue;
  }
  const before = found[1];
  const after = before
    .split("\n")
    .filter((line) => !new RegExp("^\\s*`" + d.column + "`\\s").test(line))
    .join("\n");
  if (after !== before) {
    out = out.replace(before, after);
    console.log(`Xoá cột H2: ${d.table}.${d.column} (theo migration DROP COLUMN)`);
  } else {
    console.warn(`⚠️ Không tìm thấy dòng cột ${d.table}.${d.column} để xoá (có thể đã bị đổi tên)`);
  }
}

// ---------------------------------------------------------------------------
// [TASK-115] GIỮ LẠI KHỐI THỦ CÔNG của schema-h2.sql.
// VÌ SAO: vài cột do migration tạo bằng DDL ĐỘNG — `SET @ddl := IF(cond,'ALTER TABLE ... ADD COLUMN ...');
// PREPARE ...; EXECUTE ...` — nằm TRONG CHUỖI nên regex ALTER literal ở trên KHÔNG bắt được:
//   • V21__p2_pr_approval_dynamic_default.sql -> approval_stage_catalog.stage_kind
//   • V22__ad14_audit_log_result.sql          -> audit_logs.result
// Chạy lại generator mà không giữ khối này sẽ XOÁ 2 cột ⇒ cổng `mvn -pl web -am test` đỏ trở lại
// (RequestStoreAdapter/BootstrapDataAdapter dùng `stage_kind`, AuditLogAdapter ghi `result`).
// QUY ƯỚC: mọi thứ giữa `-- [H2-MANUAL-START]` và `-- [H2-MANUAL-END]` trong schema-h2.sql hiện có
// được CHÉP LẠI nguyên văn vào bản mới.
// ---------------------------------------------------------------------------
const MANUAL_START = "-- [H2-MANUAL-START]";
const MANUAL_END = "-- [H2-MANUAL-END]";
let manualBlock = "";
try {
  const previous = readFileSync(outPath, "utf8");
  const from = previous.indexOf(MANUAL_START);
  const to = previous.indexOf(MANUAL_END);
  if (from >= 0 && to > from) manualBlock = previous.slice(from, to + MANUAL_END.length);
} catch {
  // Lần sinh đầu tiên: chưa có tệp để giữ khối thủ công.
}
if (manualBlock) {
  out += "\n\n-- Khối THỦ CÔNG giữ nguyên văn (cột sinh bởi migration DDL ĐỘNG — xem [TASK-115]).\n"
    + manualBlock + "\n";
  console.log("Giữ khối thủ công [H2-MANUAL-START..END]:", manualBlock.split("\n").length, "dòng");
}

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, out);
console.log("schema-h2.sql written, lines:", out.split("\n").length,
  "· unique indexes kept:", uniqueIndexes.length, "· bảng thêm sau V1:", incremental.length);