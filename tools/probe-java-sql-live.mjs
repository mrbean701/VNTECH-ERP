// Đối chiếu SQL trong mã Java với LƯỢC ĐỒ MySQL ĐANG CHẠY (INFORMATION_SCHEMA), không phải với tệp migration.
//
// VÌ SAO CẦN (bài học TASK-040 nhóm 2):
//   Công cụ cũ `tools/probe-java-sql-schema.mjs` dựng lược đồ bằng cách ĐỌC các tệp `V*.sql` và chỉ áp dụng
//   `ALTER TABLE ... ADD [COLUMN]`. Nó **KHÔNG** áp dụng `CHANGE COLUMN` / `RENAME COLUMN` / `DROP COLUMN`.
//   Hệ quả thật đã xảy ra: `V10` tạo cột `` `rank` `` rồi `V11__rename_level_rank.sql:24` đổi tên thành
//   `level_rank`; công cụ vẫn giữ tên cũ `rank` ⇒ tố oan `UserAdminStoreAdapter` (dùng `level_rank`) là
//   "cột không tồn tại" trong khi **DB thật đúng là `level_rank`**.
//   ⇒ Lược đồ ĐANG CHẠY là nguồn sự thật của Java (giống như log khởi động là nguồn sự thật của Flyway).
//
// CÁCH LẤY LƯỢC ĐỒ ĐANG CHẠY (chạy trước, một lần):
//   mysql -uvntech -pvntech --batch --raw --skip-column-names -e "SELECT CONCAT(TABLE_NAME,CHAR(9),COLUMN_NAME)
//     FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='vntech_erp' ORDER BY TABLE_NAME,ORDINAL_POSITION;" > tools/_live-schema.tsv
//   (BẮT BUỘC có `--raw`: chế độ `--batch` mặc định escape ký tự tab thành `\t` ⇒ tệp hỏng.)
//
// Chạy: node tools/probe-java-sql-live.mjs
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";

const LIVE_TSV = "tools/_live-schema.tsv";
const JAVA_ROOTS = ["java-backend/application/src/main/java", "java-backend/infrastructure/src/main/java", "java-backend/web/src/main/java"];

if (!existsSync(LIVE_TSV)) {
  console.error(`THIẾU ${LIVE_TSV} — hãy kết xuất lược đồ đang chạy trước (xem hướng dẫn ở đầu tệp này).`);
  process.exit(2);
}

// ------------------------------------------------------------------ 1) lược đồ ĐANG CHẠY
const schema = new Map();   // table(lower) -> Set(column(lower))
const tables = new Set();
for (const line of readFileSync(LIVE_TSV, "utf8").split(/\r?\n/)) {
  if (!line.trim()) continue;
  const [t, c] = line.split("\t");
  if (!t || !c) continue;
  const k = t.trim().toLowerCase();
  if (!schema.has(k)) schema.set(k, new Set());
  schema.get(k).add(c.trim().toLowerCase());
  tables.add(k);
}
const colCount = [...schema.values()].reduce((s, v) => s + v.size, 0);
console.log(`Lược đồ ĐANG CHẠY (${LIVE_TSV}): ${tables.size} bảng · ${colCount} cột`);

// ------------------------------------------------------------------ 1b) lược đồ drizzle (SQLite) để phân loại
const drizzleSchema = new Map();
try {
  for (const f of readdirSync("drizzle").filter((n) => /^\d+.*\.sql$/.test(n)).sort()) {
    let sql = readFileSync(join("drizzle", f), "utf8").replace(/--[^\n]*/g, "");
    for (const m of sql.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"']?(\w+)[`"']?\s*\(([\s\S]*?)\n\s*\)\s*;/gi)) {
      const t = m[1].toLowerCase();
      if (!drizzleSchema.has(t)) drizzleSchema.set(t, new Set());
      for (const line of m[2].split("\n")) {
        const c = line.trim().match(/^[`"']?(\w+)[`"']?\s+/);
        if (!c) continue;
        const name = c[1].toLowerCase();
        if (["primary", "unique", "key", "index", "constraint", "foreign", "check"].includes(name)) continue;
        drizzleSchema.get(t).add(name);
      }
    }
    for (const m of sql.matchAll(/ALTER\s+TABLE\s+[`"']?(\w+)[`"']?\s+([\s\S]*?);/gi)) {
      const t = m[1].toLowerCase();
      if (!drizzleSchema.has(t)) drizzleSchema.set(t, new Set());
      for (const a of m[2].matchAll(/ADD\s+(?:COLUMN\s+)?[`"']?(\w+)[`"']?/gi)) drizzleSchema.get(t).add(a[1].toLowerCase());
    }
  }
} catch { /* không có drizzle/ thì bỏ qua */ }

// ------------------------------------------------------------------ 2) quét SQL trong Java
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (name.endsWith(".java")) out.push(p);
  }
  return out;
}
const javaFiles = JAVA_ROOTS.flatMap((r) => { try { return walk(r); } catch { return []; } });

function extractSql(src) {
  const out = [];
  const lineOf = (idx) => src.slice(0, idx).split(/\r?\n/).length;
  for (const m of src.matchAll(/"""([\s\S]*?)"""/g)) out.push({ text: m[1], line: lineOf(m.index) });
  for (const m of src.matchAll(/"((?:[^"\\\n]|\\.)*)"/g)) {
    const t = m[1];
    if (/\b(SELECT|INSERT\s+INTO|UPDATE|DELETE\s+FROM)\b/i.test(t)) out.push({ text: t, line: lineOf(m.index) });
  }
  return out;
}

const findings = [];
const seenSql = new Set();

for (const file of javaFiles) {
  const src = readFileSync(file, "utf8");
  const rel = relative(".", file).split(sep).join("/");
  for (const { text, line } of extractSql(src)) {
    if (/%s|%d|\$\{|"\s*\+|\+\s*"/.test(text)) continue;   // câu lệnh ĐỘNG: không phân tích tĩnh được

    for (const m of text.matchAll(/INSERT\s+INTO\s+[`"']?(\w+)[`"']?\s*\(([^)]*)\)/gi)) {
      const t = m[1].toLowerCase();
      const key = `INS|${rel}|${t}|${m[2]}`;
      if (seenSql.has(key)) continue; seenSql.add(key);
      if (!tables.has(t)) { findings.push({ kind: "BẢNG KHÔNG TỒN TẠI", table: t, col: "", rel, line }); continue; }
      for (const c of m[2].split(",")) {
        const name = c.trim().replace(/[`"']/g, "").toLowerCase();
        if (!name || !/^\w+$/.test(name)) continue;
        if (name === "values" || name === "select") continue;
        if (!schema.get(t).has(name)) findings.push({ kind: "CỘT KHÔNG TỒN TẠI (INSERT)", table: t, col: name, rel, line });
      }
    }

    for (const m of text.matchAll(/UPDATE\s+[`"']?(\w+)[`"']?\s+SET\s+([\s\S]*?)(?=\bWHERE\b|$)/gi)) {
      const t = m[1].toLowerCase();
      const key = `UPD|${rel}|${t}|${m[2]}`;
      if (seenSql.has(key)) continue; seenSql.add(key);
      if (!tables.has(t)) { findings.push({ kind: "BẢNG KHÔNG TỒN TẠI", table: t, col: "", rel, line }); continue; }
      for (const a of m[2].split(",")) {
        const name = a.split("=")[0].trim().replace(/[`"']/g, "").split(".").pop().toLowerCase();
        if (!name || !/^\w+$/.test(name)) continue;
        if (/^(values|case|when|then|else|end)$/.test(name)) continue;
        if (!schema.get(t).has(name)) findings.push({ kind: "CỘT KHÔNG TỒN TẠI (UPDATE SET)", table: t, col: name, rel, line });
      }
    }
  }
}

// ------------------------------------------------------------------ 3) báo cáo
console.log(`Tệp Java đã quét: ${javaFiles.length}\n`);

if (!findings.length) {
  console.log("KẾT LUẬN: không câu lệnh tĩnh nào tham chiếu bảng/cột SAI so với lược đồ ĐANG CHẠY. ✅");
  process.exitCode = 0;
} else {
  console.log(`Phát hiện ${findings.length} tham chiếu sai so với lược đồ ĐANG CHẠY:\n`);
  for (const f of findings) {
    const inDrizzle = f.col && drizzleSchema.get(f.table)?.has(f.col);
    f.verdict = !f.col ? "BẢNG KHÔNG TỒN TẠI"
      : inDrizzle ? "LỆCH: có ở drizzle (SQLite), thiếu ở MySQL"
      : "LỖI MÃ: thiếu ở CẢ lược đồ đang chạy lẫn drizzle";
  }
  const byVerdict = new Map();
  for (const f of findings) byVerdict.set(f.verdict, (byVerdict.get(f.verdict) || 0) + 1);
  for (const [k, v] of [...byVerdict].sort((a, b) => b[1] - a[1])) console.log(`  ${String(v).padStart(3)}  ${k}`);
  console.log("");
  for (const f of findings) console.log(`  [${f.verdict.split(":")[0]}] ${f.rel}:${f.line}  ${f.table}.${f.col || "(bảng)"}`);
  console.log("");
  console.log("GHI CHÚ: đây là phép đo trên LƯỢC ĐỒ ĐANG CHẠY. Nếu một cột ở đây từng bị công cụ cũ");
  console.log("(đọc tệp V*.sql) báo sai, thì công cụ cũ đã bỏ qua CHANGE/RENAME/DROP COLUMN — xem đầu tệp.");
  process.exitCode = 1;
}
