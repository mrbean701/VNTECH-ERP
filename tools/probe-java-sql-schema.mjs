// Đối chiếu SQL trong mã Java với LƯỢC ĐỒ THẬT (MySQL migration V*.sql).
//
// VÌ SAO CẦN: TASK-039 phát hiện 2 action admin trả HTTP 500 chỉ vì câu lệnh Java tham chiếu
// cột/bảng KHÔNG tồn tại (`settings_json` ở bảng không có nó; `scope_key` bị bỏ sót khi INSERT).
// Đó là một LỚP lỗi, không phải lỗi đơn lẻ: biên dịch sạch, mọi cổng tĩnh đều "xanh", nhưng hỏng
// lúc chạy. Công cụ này bắt cả lớp đó mà không cần gọi từng action.
//
// LƯỢC ĐỒ LẤY TỪ ĐÂU: `java-backend/infrastructure/src/main/resources/db/migration/V*.sql` — chính là
// các migration Flyway mà MySQL đang chạy (log khởi động xác nhận "validated 16 migrations").
//
// ⚠ GIỚI HẠN ĐÃ BIẾT (TASK-040 nhóm 2): công cụ này DỰNG LẠI lược đồ từ tệp văn bản, nên nếu tệp migration
// và DB đang chạy lệch nhau thì nó đo sai. Đã từng xảy ra: thiếu `CHANGE COLUMN` ⇒ tố oan `level_rank`.
// ⇒ Khi cần KẾT LUẬN, dùng `tools/probe-java-sql-live.mjs` (đối chiếu INFORMATION_SCHEMA của DB đang chạy).
// Hai công cụ cho KẾT QUẢ BẰNG NHAU nghĩa là tệp migration khớp DB; lệch nhau nghĩa là tệp migration đã lệch DB.
//
// TÍN HIỆU CAO NHẤT (và đúng loại đã gây lỗi) là INSERT/UPDATE vì chúng liệt kê TÊN CỘT TƯỜNG MINH:
//   INSERT INTO t (c1,c2,...)   ·   UPDATE t SET c1=?,c2=?
// Ngoài ra kiểm sự tồn tại của BẢNG trong FROM/JOIN.
//
// Chạy: node tools/probe-java-sql-schema.mjs [--all]
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const MIGRATION_DIR = "java-backend/infrastructure/src/main/resources/db/migration";
const JAVA_ROOTS = ["java-backend/application/src/main/java", "java-backend/infrastructure/src/main/java", "java-backend/web/src/main/java"];

// ------------------------------------------------------------------ 1) đọc lược đồ
const schema = new Map();   // table(lower) -> Set(column(lower))
const tables = new Set();

function ensure(t) {
  const k = t.toLowerCase();
  if (!schema.has(k)) schema.set(k, new Set());
  tables.add(k);
  return k;
}

const migFiles = readdirSync(MIGRATION_DIR).filter((f) => /^V\d+__.*\.sql$/.test(f)).sort();
for (const f of migFiles) {
  let sql = readFileSync(join(MIGRATION_DIR, f), "utf8");
  sql = sql.replace(/--[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");   // bỏ chú thích
  // CREATE TABLE [IF NOT EXISTS] `t` ( ... );
  for (const m of sql.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"']?(\w+)[`"']?\s*\(([\s\S]*?)\n\s*\)\s*ENGINE/gi)) {
    const t = ensure(m[1]);
    for (const line of m[2].split("\n")) {
      const c = line.trim().match(/^[`"']?(\w+)[`"']?\s+/);
      if (!c) continue;
      const name = c[1].toLowerCase();
      if (["primary", "unique", "key", "index", "constraint", "foreign", "check", "fulltext", "spatial"].includes(name)) continue;
      schema.get(t).add(name);
    }
  }
  // ALTER TABLE `t` ADD [COLUMN] `c` ... / CHANGE / RENAME / DROP
  //
  // SỬA LỖI (TASK-040 nhóm 2): bản đầu CHỈ xử lý `ADD [COLUMN]` nên **bỏ qua đổi tên cột**. Hệ quả thật:
  // `V10` tạo cột `` `rank` `` rồi `V11__rename_level_rank.sql:24` đổi tên thành `level_rank`; bản đồ lược đồ
  // vẫn giữ `rank` ⇒ công cụ TỐ OAN `UserAdminStoreAdapter` (dùng `level_rank`, ĐÚNG theo DB đang chạy).
  // Một dương tính giả như vậy đủ để "sửa" mã đang đúng thành sai.
  // ⚠ Nguồn sự thật của Java là LƯỢC ĐỒ ĐANG CHẠY — dùng `tools/probe-java-sql-live.mjs` (đọc
  // `tools/_live-schema.tsv` từ INFORMATION_SCHEMA) khi cần kết luận, vì tệp migration có thể lệch.
  for (const m of sql.matchAll(/ALTER\s+TABLE\s+[`"']?(\w+)[`"']?\s+([\s\S]*?);/gi)) {
    const t = ensure(m[1]);
    const body = m[2];
    for (const a of body.matchAll(/ADD\s+(?:COLUMN\s+)?[`"']?(\w+)[`"']?/gi)) schema.get(t).add(a[1].toLowerCase());
    for (const a of body.matchAll(/\bCHANGE\s+(?:COLUMN\s+)?[`"']?(\w+)[`"']?\s+[`"']?(\w+)[`"']?/gi)) {
      schema.get(t).delete(a[1].toLowerCase());
      schema.get(t).add(a[2].toLowerCase());
    }
    for (const a of body.matchAll(/\bRENAME\s+COLUMN\s+[`"']?(\w+)[`"']?\s+TO\s+[`"']?(\w+)[`"']?/gi)) {
      schema.get(t).delete(a[1].toLowerCase());
      schema.get(t).add(a[2].toLowerCase());
    }
    for (const a of body.matchAll(/\bDROP\s+(?:COLUMN\s+)?[`"']?(\w+)[`"']?/gi)) schema.get(t).delete(a[1].toLowerCase());
  }
}

console.log(`Lược đồ: ${migFiles.length} tệp migration · ${tables.size} bảng · ${[...schema.values()].reduce((s, v) => s + v.size, 0)} cột`);

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

/** Ghép nội dung các text block """...""" và chuỗi "..." có chứa SQL, giữ số dòng. */
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
const KNOWN_SKIP_STRICT = new Set(["supply_workflow_steps", "vntech_product_identity"]);

for (const file of javaFiles) {
  const src = readFileSync(file, "utf8");
  const rel = relative(".", file).split(sep).join("/");
  for (const { text, line } of extractSql(src)) {
    // Bỏ câu lệnh ĐỘNG (ghép chuỗi / template %s) — không phân tích tĩnh được
    if (/%s|%d|\$\{|"\s*\+|\+\s*"/.test(text)) continue;

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

// ------------------------------------------------------------------ 1b) đọc THÊM lược đồ drizzle
//
// VÌ SAO CẦN CẢ HAI: JS chạy trên SQLite theo `drizzle/`, Java chạy trên MySQL theo Flyway. Một cột
// có thể tồn tại ở lược đồ này mà không có ở lược đồ kia ⇒ phải phân biệt:
//   · KHÔNG có ở CẢ HAI  -> chắc chắn là lỗi mã (câu lệnh sẽ nổ ở mọi backend)
//   · chỉ có ở drizzle   -> LỆCH LƯỢC ĐỒ: Java chạy MySQL sẽ nổ
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

/** Phân loại một cột thiếu: lỗi mã chắc chắn, hay lệch lược đồ. */
function classify(table, col) {
  if (!col) return "BẢNG KHÔNG TỒN TẠI (Flyway)";
  const inDrizzle = drizzleSchema.get(table)?.has(col);
  return inDrizzle ? "LỆCH LƯỢC ĐỒ: có ở drizzle, THIẾU ở MySQL" : "LỖI MÃ: cột không có ở CẢ HAI lược đồ";
}

// ------------------------------------------------------------------ 3) báo cáo
console.log(`Tệp Java đã quét: ${javaFiles.length}\n`);

// CHẨN ĐOÁN BỘ PHÂN TÍCH: nếu một bảng bị báo thiếu cột nhưng số cột phân tích được lại QUÁ ÍT thì
// gần như chắc chắn là LỖI PHÂN TÍCH (CREATE TABLE của bảng đó không được khớp), không phải lỗi mã.
// Phải phân biệt được hai thứ này trước khi kết luận — nếu không sẽ buộc tội sai mã nguồn.
const flaggedTables = [...new Set(findings.map((f) => f.table))].sort();
if (flaggedTables.length) {
  console.log("Chẩn đoán bảng bị báo lỗi (số cột phân tích được):");
  for (const t of flaggedTables) {
    const n = schema.get(t)?.size ?? -1;
    const note = n < 8 ? "  <-- NGHI LỖI PHÂN TÍCH (bảng có quá ít cột?)" : "";
    console.log(`  ${t.padEnd(38)} ${String(n).padStart(3)} cột${note}`);
  }
  console.log("");
}

if (!findings.length) {
  console.log("KẾT LUẬN: không thấy tham chiếu bảng/cột sai trong SQL tĩnh (INSERT/UPDATE). ✅");
  process.exitCode = 0;
} else {
  for (const f of findings) f.verdict = classify(f.table, f.col);
  const byVerdict = new Map();
  for (const f of findings) byVerdict.set(f.verdict, (byVerdict.get(f.verdict) || 0) + 1);

  console.log("PHÂN LOẠI (đối chiếu CẢ HAI lược đồ):");
  for (const [k, v] of [...byVerdict].sort((a, b) => b[1] - a[1])) console.log(`  ${String(v).padStart(3)}  ${k}`);
  console.log("");
  console.log(`Lược đồ drizzle đọc được: ${drizzleSchema.size} bảng\n`);

  // In theo nhóm: LỖI MÃ trước (chắc chắn hỏng), rồi LỆCH LƯỢC ĐỒ
  for (const want of ["LỖI MÃ: cột không có ở CẢ HAI lược đồ", "LỆCH LƯỢC ĐỒ: có ở drizzle, THIẾU ở MySQL", "BẢNG KHÔNG TỒN TẠI (Flyway)"]) {
    const group = findings.filter((f) => f.verdict === want);
    if (!group.length) continue;
    console.log(`── ${want} (${group.length}) ──`);
    for (const f of group) console.log(`  ${f.rel}:${f.line}  ${f.table}.${f.col}`);
    console.log("");
  }
  process.exitCode = 1;
}
