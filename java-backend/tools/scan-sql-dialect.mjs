#!/usr/bin/env node
/**
 * SCANNER SQL DIALECT (v2 — chính xác) — tìm lỗi chỉ lộ trên MySQL.
 *
 * v1 báo 520 false-positive (VALUES(), ORDER BY, GROUP BY đều hợp lệ).
 * v2 chỉ báo:
 *   A. Reserved word MySQL dùng như TÊN CỘT mà KHÔNG bọc backtick
 *      (giới hạn ở các từ thực sự xuất hiện trong database thật là tên cột)
 *   B. Cú pháp/hàm SQLite-only không chạy được trên MySQL
 *
 * Cách nhận biết "dùng như tên cột": từ đó nằm trong danh sách cột sau
 * SELECT / INSERT INTO t(...) / UPDATE t SET / hoặc trước dấu =,? trong SET/VALUES.
 *
 * Chạy: node java-backend/tools/scan-sql-dialect.mjs
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

/**
 * Từ khoá MySQL **THẬT SỰ RESERVED** (tra tài liệu MySQL 8.0) và có thể xuất hiện
 * như tên cột trong schema VNTECH. `status` KHÔNG nằm trong danh sách này —
 * đã kiểm chứng bằng query thật trên MySQL 8.0.46: `SELECT status FROM projects` chạy OK.
 *
 * `system` đã gây lỗi thật (HTTP 500, Error 1064) — các từ còn lại cùng nhóm rủi ro.
 */
const RISKY_COLUMNS = [
  "system",     // ✅ RESERVED thật — đã gây bug
  "groups",     // ✅ RESERVED
  "rank",       // ✅ RESERVED
  "usage",      // ✅ RESERVED
  "signal",     // ✅ RESERVED
  "condition",  // ✅ RESERVED
  "interval",   // ✅ RESERVED
  "precision",  // ✅ RESERVED
  "key",        // ✅ RESERVED
  "keys",       // ✅ RESERVED
  "values",     // ✅ RESERVED
  "option",     // ✅ RESERVED
  "references", // ✅ RESERVED
  "order",      // ✅ RESERVED (chỉ nguy hiểm khi là TÊN CỘT, không phải ORDER BY)
  "group",      // ✅ RESERVED (tương tự)
  "default",    // ✅ RESERVED
];

/** Cú pháp/hàm SQLite-only (hoặc khác dialect) — CHẮC CHẮN lỗi/chệch trên MySQL. */
const SQLITE_ONLY = [
  { re: /\bINSERT\s+OR\s+IGNORE\b/i, msg: "INSERT OR IGNORE → MySQL: INSERT IGNORE" },
  { re: /\bINSERT\s+OR\s+REPLACE\b/i, msg: "INSERT OR REPLACE → MySQL: REPLACE INTO" },
  { re: /\bUPDATE\s+OR\s+IGNORE\b/i, msg: "UPDATE OR IGNORE → không có trên MySQL" },
  { re: /\bdatetime\s*\(\s*'now'\s*\)/i, msg: "datetime('now') → MySQL: CURRENT_TIMESTAMP(3)" },
  { re: /\bdate\s*\(\s*'now'\s*\)/i, msg: "date('now') → MySQL: CURRENT_DATE" },
  { re: /\bstrftime\s*\(/i, msg: "strftime() — SQLite-only" },
  { re: /\bAUTOINCREMENT\b/i, msg: "AUTOINCREMENT → MySQL: AUTO_INCREMENT" },
  { re: /\bPRAGMA\b/i, msg: "PRAGMA — SQLite-only" },
  { re: /\bWITHOUT\s+ROWID\b/i, msg: "WITHOUT ROWID — SQLite-only" },
  { re: /\bGLOB\b/i, msg: "GLOB — SQLite-only" },
  { re: /\bIIF\s*\(/i, msg: "IIF() → MySQL: IF()" },
  { re: /\bjson_extract\s*\(/i, msg: "json_extract — MySQL: JSON_EXTRACT" },
  { re: /\bLIMIT\s+\d+\s+OFFSET\s+\?/i, msg: "LIMIT n OFFSET ? — MySQL OK; kiểm tra tham số" },
  { re: /\|\|\s*'[^']*'/i, msg: "nối chuỗi || — MySQL coi là OR (trừ khi PIPES_AS_CONCAT)" },
  { re: /\bRAISE\s*\(\s*ABORT/i, msg: "RAISE(ABORT) — SQLite trigger; MySQL dùng SIGNAL" },
  { re: /\bIF\s+NOT\s+EXISTS\s*\(\s*SELECT[\s\S]{0,80}?\)\s*BEGIN/i, msg: "trigger SQLite — không chạy MySQL" },
];

const findings = { columns: [], sqlite: [] };

const files = [];
(function walk(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) {
      if (!/target|node_modules|\.git/.test(p)) walk(p);
    } else if (/\.java$/.test(f)) files.push(p);
  }
})(root);

/** Lấy các đoạn SQL trong text block """ ... """ và chuỗi " ... ". */
function extractSqlSegments(text) {
  const segs = [];
  // text block
  for (const m of text.matchAll(/"""([\s\S]*?)"""/g)) segs.push({ sql: m[1], offset: m.index });
  // chuỗi 1 dòng có từ khoá SQL
  for (const m of text.matchAll(/"((?:[^"\\]|\\.)*)"/g)) {
    if (/\b(SELECT|INSERT|UPDATE|DELETE)\b/i.test(m[1])) segs.push({ sql: m[1], offset: m.index });
  }
  return segs;
}

for (const file of files) {
  const rel = relative(root, file).replace(/\\/g, "/");
  const text = readFileSync(file, "utf8");
  const lineOf = (off) => text.slice(0, off).split("\n").length;

  for (const seg of extractSqlSegments(text)) {
    const sql = seg.sql;

    // ---- B. SQLite-only ----
    for (const { re, msg } of SQLITE_ONLY) {
      const m = re.exec(sql);
      if (m) {
        findings.sqlite.push({ file: rel, line: lineOf(seg.offset + m.index), msg, snippet: m[0].slice(0, 100) });
      }
    }

    // ---- A. reserved word như TÊN CỘT chưa backtick ----
    // A1. sau SELECT ... (danh sách cột) và sau dấu phẩy trong danh sách đó
    for (const w of RISKY_COLUMNS) {
      // xuất hiện như một token cột đứng riêng:  `, w,`  |  `, w ` (trước FROM)  |  `(w,`  |  `SELECT w,`
      const colRe = new RegExp(`(?:^|[\\(,\\s])(?:[a-z_][\\w]*\\.)?(${w})(?=\\s*[,)]|\\s+FROM|\\s+AS\\b)`, "gi");
      let m;
      while ((m = colRe.exec(sql))) {
        const before = sql.slice(Math.max(0, m.index), m.index + m[0].length);
        if (before.includes("`" + w + "`")) continue;           // đã backtick
        if (/VALUES\s*\(/i.test(sql.slice(0, m.index)) && /\)\s*$/m.test(m[0])) continue;
        findings.columns.push({ file: rel, line: lineOf(seg.offset + m.index), word: m[1], snippet: sql.slice(Math.max(0, m.index - 30), m.index + 50).replace(/\s+/g, " ").trim() });
      }

      // A2. dạng `w=?` trong SET hoặc `w AS alias` (INSERT cột / UPDATE SET)
      const setRe = new RegExp(`(?:\\bSET\\b|,)\\s*(${w})\\s*=`, "gi");
      while ((m = setRe.exec(sql))) {
        if (sql.slice(0, m.index + m[0].length).includes("`" + w + "`")) continue;
        findings.columns.push({ file: rel, line: lineOf(seg.offset + m.index), word: m[1], snippet: m[0].trim() });
      }

      // A3. INSERT INTO t (..., w, ...) — cột nằm trong danh sách insert
      const insRe = new RegExp(`INSERT\\s+INTO\\s+[\\w\`]+\\s*\\(([^)]*)\\)`, "gi");
      let im;
      while ((im = insRe.exec(sql))) {
        const cols = im[1];
        // giữ backtick để phân biệt cột đã bọc vs chưa bọc
        const tokens = cols.split(",").map((c) => c.trim());
        if (tokens.some((tk) => tk === w)) {   // CHỈ báo khi trần, không backtick
          findings.columns.push({ file: rel, line: lineOf(seg.offset + im.index), word: w, snippet: `INSERT INTO (...) chứa cột TRẦN ${w}` });
        }
      }
    }
  }
}

// khử trùng lặp
const dedupe = (arr, keyFn) => {
  const seen = new Set();
  return arr.filter((x) => {
    const k = keyFn(x);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};
findings.columns = dedupe(findings.columns, (f) => `${f.file}:${f.line}:${f.word}`);
findings.sqlite = dedupe(findings.sqlite, (f) => `${f.file}:${f.line}:${f.msg}`);

console.log(`=== QUÉT ${files.length} FILE JAVA ===\n`);

console.log(`--- A. RESERVED WORD DÙNG NHƯ CỘT (chưa backtick): ${findings.columns.length} ---`);
for (const f of findings.columns) console.log(`${f.file}:${f.line}  [${f.word}]  ${f.snippet}`);

console.log(`\n--- B. CÚ PHÁP/HÀM SQLITE-ONLY: ${findings.sqlite.length} ---`);
for (const f of findings.sqlite) console.log(`${f.file}:${f.line}  ${f.msg}\n      → ${f.snippet}`);

const total = findings.columns.length + findings.sqlite.length;
console.log(`\n=== TỔNG ĐIỂM CẦN SỬA: ${total} ===`);
process.exit(total === 0 ? 0 : 1);