// ════════════════════════════════════════════════════════════════════════════════════════════
// MÔ-ĐUN DÙNG CHUNG — ĐỌC CẶP SQL JS ↔ JAVA THEO TỪNG KHOÁ BOOTSTRAP
// ════════════════════════════════════════════════════════════════════════════════════════════
// VÌ SAO TÁCH RA: `probe-column-parity.mjs` (so TẬP CỘT) và `probe-clause-parity.mjs` (so
// `ORDER BY`/`LIMIT`/kiểu `JOIN`) phải ĐỌC HAI NGUỒN GIỐNG HỆT NHAU. Nếu mỗi cổng tự viết một bản
// sao chép thì hai bản sẽ TRÔI KHÁC NHAU, và một cổng đọc sai nguồn sẽ báo "khớp" — tức lại đúng
// lớp lỗi mà bài học #103 cảnh báo ("cổng mất độ phủ mà không báo = cổng nói dối").
//
// NGUỒN:
//   Java: `BootstrapDataAdapter.java` — `data.put("KEY", …)` (SQL nội tuyến) và
//         `List<Map<String, Object>> X = query("""SQL""")` (biến cục bộ).
//   JS  : `scripts/system-route.mjs` — `const|let|var X = … await all(`SQL`)` + object `result = {…}`.
//
// GIỚI HẠN (áp dụng cho CẢ hai cổng):
//   • Chỉ ghép được các khoá TRÙNG TÊN. Khoá JS đặt tên biến khác/tính động thì không so được.
//   • Phép tách là SUY LUẬN VĂN BẢN ⇒ mỗi cổng BẮT BUỘC có ĐỐI CHỨNG DƯƠNG riêng.
//   • Bỏ dấu `;` trong chuỗi/backtick; `%s`/`?` là placeholder (không ảnh hưởng phép so cột/mệnh đề).
import { readFileSync } from "node:fs";

export const JS_SRC = "scripts/system-route.mjs";
export const JAVA_SRC =
  "java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/BootstrapDataAdapter.java";

/** Bỏ LITERAL (nháy đơn/kép) nhưng GIỮ nội dung trong backtick — backtick MySQL là ĐỊNH DANH. */
export function maskLiterals(sql) {
  let out = "";
  let quote = null;
  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    if (quote) {
      if (quote === "`") {
        if (ch === "`") { quote = null; out += " "; continue; }
        out += ch;
        continue;
      }
      if (ch === quote) { quote = null; out += ch; continue; }
      out += " ";
      continue;
    }
    if (ch === "`") { quote = "`"; out += " "; continue; }
    if (ch === "'" || ch === '"') { quote = ch; out += ch; continue; }
    out += ch;
  }
  return out;
}

/** Danh sách SELECT ở mức ngoài cùng (bỏ qua CTE: lấy SELECT cuối cùng trước FROM đầu tiên). */
export function outerSelectList(sql) {
  const masked = maskLiterals(sql);
  let depth = 0;
  let selectStart = -1;
  let fromStart = -1;
  for (let i = 0; i < masked.length; i++) {
    const ch = masked[i];
    if (ch === "(") { depth++; continue; }
    if (ch === ")") { depth--; continue; }
    if (depth !== 0) continue;
    if (/[A-Za-z_]/.test(ch)) {
      const rest = masked.slice(i, i + 7).toUpperCase();
      if (rest.startsWith("SELECT") && /[^A-Za-z0-9_]/.test(masked[i + 6] ?? " ")) {
        if (selectStart < 0) selectStart = i + 6;
        i += 5;
        continue;
      }
      if (rest.startsWith("FROM") && /[^A-Za-z0-9_]/.test(masked[i + 4] ?? " ")) {
        if (selectStart >= 0) { fromStart = i; break; }
      }
    }
  }
  if (selectStart < 0 || fromStart < 0) return null;
  return sql.slice(selectStart, fromStart);
}

/** Cắt theo dấu phẩy ở mức ngoài cùng. */
export function splitTopLevel(list) {
  const masked = maskLiterals(list);
  const items = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < masked.length; i++) {
    const ch = masked[i];
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    else if (ch === "," && depth === 0) { items.push(list.slice(start, i)); start = i + 1; }
  }
  items.push(list.slice(start));
  return items.map((s) => s.trim()).filter(Boolean);
}

/** Tên cột đầu ra: ưu tiên `AS <alias>`; nếu không thì định danh cuối (đã bỏ backtick). */
export function columnOf(item) {
  const clean = item.replace(/`/g, "");
  const asMatch = clean.match(/\s+AS\s+([A-Za-z_][A-Za-z0-9_]*)\s*$/i);
  if (asMatch) return { name: asMatch[1], fromAlias: true };
  const ident = clean.match(/([A-Za-z_][A-Za-z0-9_]*)\s*\)*\s*$/);
  return { name: ident ? ident[1] : null, fromAlias: false };
}

/** Tập tên cột đầu ra của một câu SQL. */
export function columnsOf(sql) {
  const list = outerSelectList(sql);
  if (!list) return { columns: new Set(), exact: 0, approx: 0 };
  const columns = new Set();
  let exact = 0, approx = 0;
  for (const item of splitTopLevel(list)) {
    const col = columnOf(item);
    if (!col.name) continue;
    columns.add(col.name);
    if (col.fromAlias) exact++; else approx++;
  }
  return { columns, exact, approx };
}

// ══════════════════════════ MỆNH ĐỀ: ORDER BY / LIMIT / KIỂU JOIN ══════════════════════════
/**
 * Chuẩn hoá một mệnh đề `ORDER BY` để so hai phía:
 * bỏ backtick · bỏ TIỀN TỐ BẢNG (alias) · gộp khoảng trắng · chữ thường.
 * ⚠️ Bỏ alias khiến `h.created_at` và `l.created_at` trở thành CÙNG chuỗi — đúng ý đồ (so NGỮ NGHĨA
 * sắp xếp) nhưng có thể che lệch bảng; ghi rõ ở phần GIỚI HẠN của cổng gọi.
 */
export function normalizeOrderBy(clause) {
  return clause
    .replace(/`/g, "")
    .replace(/\b[A-Za-z_][A-Za-z0-9_]*\s*\.\s*/g, "")
    .replace(/\s+/g, " ")
    // #105 — DƯƠNG TÍNH GIẢ đã gặp: Java viết `end, coalesce(...)` còn JS viết `end,coalesce(...)`
    // ⇒ chuẩn hoá LUÔN khoảng trắng quanh dấu phẩy, nếu không sẽ báo lệch oan.
    .replace(/\s*,\s*/g, ",")
    .trim()
    .toLowerCase();
}

/** Trích `ORDER BY …` (tới LIMIT/OFFSET/`)` hoặc hết câu). */
export function orderByOf(sql) {
  const masked = maskLiterals(sql).replace(/`/g, "");
  const m = masked.match(/\border\s+by\b([\s\S]*?)(?=\blimit\b|\boffset\b|\bfetch\b|\)\s*$|$)/i);
  if (!m) return null;
  const raw = m[1];
  // cắt phần đuôi ngoài mệnh đề: nếu gặp dấu `)` của subquery bọc ngoài thì dừng
  const stop = raw.search(/\)\s*(?:$|[a-z])/i);
  return normalizeOrderBy(stop >= 0 ? raw.slice(0, stop) : raw);
}

/** Trích giá trị `LIMIT n` (thiếu ⇒ null, khác hẳn với 0). */
export function limitOf(sql) {
  const masked = maskLiterals(sql);
  const m = masked.match(/\blimit\s+(\d+)/i);
  return m ? Number(m[1]) : null;
}

/**
 * Kiểu JOIN theo từng BẢNG: `{ ten_bang: Set<"join"|"left"|"right"|"inner"|"cross"> }`.
 * Dùng để bắt ca `JOIN` ↔ `LEFT JOIN` (khác nhau về việc GIỮ hay BỎ dòng không khớp).
 */
export function joinsOf(sql) {
  const masked = maskLiterals(sql).replace(/`/g, "");
  const out = new Map();
  const re = /\b(?:(left|right|inner|cross)\s+)?(?:outer\s+)?join\s+([a-z_][a-z0-9_]*)/gi;
  let m;
  while ((m = re.exec(masked)) !== null) {
    const kind = (m[1] ?? "join").toLowerCase();
    const table = m[2].toLowerCase();
    const set = out.get(table) ?? new Set();
    set.add(kind);
    out.set(table, set);
  }
  return out;
}

/** So KIỂU JOIN hai phía: trả danh sách khác biệt dạng "table: Java=… · JS=…". */
export function joinDiffs(javaSqls, jsSqls) {
  const j = new Map();
  for (const s of javaSqls) for (const [t, kinds] of joinsOf(s)) {
    (j.get(t) ?? j.set(t, new Set()).get(t)).add([...kinds].sort().join("+"));
  }
  const s = new Map();
  for (const q of jsSqls) for (const [t, kinds] of joinsOf(q)) {
    (s.get(t) ?? s.set(t, new Set()).get(t)).add([...kinds].sort().join("+"));
  }
  const diffs = [];
  for (const t of new Set([...j.keys(), ...s.keys()])) {
    const a = [...(j.get(t) ?? [])].sort().join("|") || "(không join)";
    const b = [...(s.get(t) ?? [])].sort().join("|") || "(không join)";
    if (a !== b) diffs.push(`${t}: Java=${a} · JS=${b}`);
  }
  return diffs;
}

// ══════════════════════════ ĐỌC HAI NGUỒN ══════════════════════════
/** JS: biến → danh sách SQL (chỉ khai báo TRƯỚC object `result` đầu tiên — tránh trùng tên giữa các hàm). */
export function loadJsSqlByVar() {
  const js = readFileSync(JS_SRC, "utf8");
  const declRe = /(?:const|let|var)\s+([A-Za-z_][A-Za-z0-9_]*)\s*=/g;
  const raw = new Map();
  let m;
  while ((m = declRe.exec(js)) !== null) {
    const name = m[1];
    const from = m.index + m[0].length;
    let quote = null;
    let end = from;
    for (let i = from; i < js.length && i < from + 8000; i++) {
      const ch = js[i];
      if (quote) {
        if (ch === quote && js[i - 1] !== "\\") quote = null;
        continue;
      }
      if (ch === "'" || ch === '"' || ch === "`") { quote = ch; continue; }
      if (ch === ";") { end = i; break; }
    }
    const stmt = js.slice(from, end);
    // Ghi nhận `all(` hay `first(` — `first()` NGẦM định 1 dòng (tương đương `LIMIT 1`), nếu không
    // phân biệt thì cổng mệnh đề báo lệch oan khi Java viết `LIMIT 1` tường minh.
    const sqls = [...stmt.matchAll(/(all|first)\(\s*`([\s\S]*?)`/g)]
      .map((x) => ({ sql: x[2], viaFirst: x[1] === "first" }));
    if (!sqls.length) continue;
    raw.set(name, (raw.get(name) ?? []).concat(sqls.map((s) => ({ ...s, offset: m.index }))));
  }
  const resultLitOffset = (() => {
    const at = js.search(/const\s+result\s*=\s*\{/);
    return at < 0 ? Number.MAX_SAFE_INTEGER : at;
  })();
  const jsByVar = new Map();
  const jsFirstByVar = new Map();
  for (const [name, list] of raw) {
    const inScope = list.filter((x) => x.offset < resultLitOffset);
    const chosen = inScope.length ? inScope : list;
    jsByVar.set(name, chosen.map((x) => x.sql));
    jsFirstByVar.set(name, chosen.map((x) => x.viaFirst));
  }
  return { js, jsByVar, jsFirstByVar, resultLitOffset };
}

/** JS: khoá kết quả → SQL, qua object `result = { key: value }`. */
export function loadJsSqlByKey() {
  const { js, jsByVar, jsFirstByVar } = loadJsSqlByVar();
  const jsByKey = new Map(jsByVar);
  const jsFirstByKey = new Map(jsFirstByVar);
  const start = js.search(/const\s+result\s*=\s*\{/);
  if (start < 0) return { jsByKey, jsFirstByKey, mappedByResult: 0 };
  const open = js.indexOf("{", start);
  let depth = 0, quote = null, end = -1;
  for (let i = open; i < js.length; i++) {
    const ch = js[i];
    if (quote) { if (ch === quote && js[i - 1] !== "\\") quote = null; continue; }
    if (ch === "'" || ch === '"' || ch === "`") { quote = ch; continue; }
    if (ch === "{") depth++;
    else if (ch === "}") { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end < 0) return { jsByKey, jsFirstByKey, mappedByResult: 0 };
  let mapped = 0;
  for (const entry of splitTopLevel(js.slice(open + 1, end))) {
    const idx = entry.indexOf(":");
    const key = (idx > 0 ? entry.slice(0, idx) : entry).trim();
    const valueExpr = idx > 0 ? entry.slice(idx + 1).trim() : entry.trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    const ident = valueExpr.match(/^([A-Za-z_][A-Za-z0-9_]*)/);
    if (!ident) continue;
    const sqls = jsByVar.get(ident[1]);
    if (!sqls) continue;
    if (!jsByKey.has(key)) mapped++;
    jsByKey.set(key, sqls);
    jsFirstByKey.set(key, jsFirstByVar.get(ident[1]) ?? sqls.map(() => false));
  }
  return { jsByKey, jsFirstByKey, mappedByResult: mapped };
}

/**
 * Java: khoá `data.put("K", …)` → SQL, gồm cả dạng trỏ tới BIẾN cục bộ
 * (`List<Map<String, Object>> X = query("""SQL""")`) và bảng KHOÁ GHÉP (`composed`).
 */
export function loadJavaSqlByKey(composed = {}) {
  const java = readFileSync(JAVA_SRC, "utf8");
  const javaVars = new Map();
  {
    // Ghi nhận `query(` hay `first(` cho biến cục bộ (`first()` NGẦM định 1 dòng).
    const varRe = /(?:List<Map<String,\s*Object>>|var|final\s+var)\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(?:new\s+ArrayList<>\(\s*)?(query|first)\(\s*"""([\s\S]*?)"""/g;
    let m;
    while ((m = varRe.exec(java)) !== null) {
      javaVars.set(m[1], (javaVars.get(m[1]) ?? []).concat([{ sql: m[3], viaFirst: m[2] === "first" }]));
    }
  }
  const javaByKey = new Map();
  const javaFirstByKey = new Map();
  {
    const putRe = /data\.put\("([A-Za-z_][A-Za-z0-9_]*)"/g;
    let m;
    while ((m = putRe.exec(java)) !== null) {
      const key = m[1];
      const tail = java.slice(m.index, m.index + 6000);
      const end = tail.indexOf(");");
      const body = end >= 0 ? tail.slice(0, end) : tail;
      const sqls = [];
      const flags = [];
      // SQL nội tuyến: xét 14 ký tự NGAY TRƯỚC `"""` để biết `query(` hay `first(`.
      for (const hit of body.matchAll(/"""([\s\S]*?)"""/g)) {
        const before = body.slice(Math.max(0, hit.index - 14), hit.index);
        sqls.push(hit[1]);
        flags.push(/\bfirst\(\s*$/.test(before));
      }
      const bare = tail.match(/^data\.put\("([A-Za-z_][A-Za-z0-9_]*)"\s*,\s*([A-Za-z_][A-Za-z0-9_]*)\s*\)/);
      if (bare) {
        for (const name of composed[key] ?? [bare[2]]) {
          for (const v of javaVars.get(name) ?? []) { sqls.push(v.sql); flags.push(v.viaFirst); }
        }
      }
      if (sqls.length) {
        javaByKey.set(key, (javaByKey.get(key) ?? []).concat(sqls));
        javaFirstByKey.set(key, (javaFirstByKey.get(key) ?? []).concat(flags));
      }
    }
  }
  return { java, javaByKey, javaFirstByKey, javaVarNamesSeen: new Set(javaVars.keys()) };
}
