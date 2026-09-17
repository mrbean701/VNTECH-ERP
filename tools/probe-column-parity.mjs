// ════════════════════════════════════════════════════════════════════════════════════════════
// TASK-056 — CỔNG ĐỐI CHIẾU **TẬP CỘT** SQL giữa JS và Java theo từng khoá bootstrap
// ════════════════════════════════════════════════════════════════════════════════════════════
// VÌ SAO CÓ CỔNG NÀY: đã gặp **3 ca liên tiếp ở mức CỘT** mà cổng theo TÊN KHOÁ không bắt được:
//   • `constructionDailyLogs` thiếu `itemCount` + `completedQty` (TASK-053, #85) ⇒ cột "Khối lượng" luôn 0
//   • `transferOrders` thiếu 7 trường + thiếu bộ lọc theo kho (known issue #52)
//   • (và cổng theo tên khoá cũng không thấy lớp "khoá CÓ khai nhưng null/rỗng theo vai trò" — #50)
// Cổng này đọc **câu SQL hai phía**, tách **tập tên cột đầu ra** rồi so:
//   Java: `data.put("KEY", … query("""SQL""") …)` trong `BootstrapDataAdapter.java`
//   JS  : `const|let|var KEY = await all(`SQL`)` trong `scripts/system-route.mjs`
// và in ra các cột **JS có mà Java KHÔNG có** (đúng lớp lỗi đã gặp 3 lần).
//
// ĐỐI CHỨNG DƯƠNG CỦA CHÍNH BỘ TÁCH CỘT: bộ tách là **suy luận văn bản**, nên phải được kiểm bằng
// **metadata thật của MySQL** (`SELECT * FROM (<sql>) x LIMIT 0` in ra dòng tiêu đề khi dùng --batch).
// Nếu bộ tách lệch metadata ⇒ cổng tự báo HỎNG (không được tin kết quả).
//
// GIỚI HẠN (ghi rõ, không giấu):
//   • Chỉ so các khoá mà **hai bên TRÙNG TÊN biến** (`data.put("X")` ↔ `const X = await all(...)`).
//     Nhiều khoá JS đặt tên biến khác khoá kết quả (`rawBusinessRoleGroups` → `businessRoleGroups`…) ⇒ bỏ qua.
//   • Với `data.put` có nhiều nhánh (`admin ? query(A) : query(B)`), cổng lấy **tất cả** khối SQL của lệnh
//     đó và hợp các cột lại ⇒ nhánh nào thiếu cột vẫn bị bắt, nhưng không quy được về đúng nhánh.
//   • Mục không có `AS <alias>` thì lấy **định danh cuối cùng** trong mục đó (với biểu thức phức tạp có thể sai)
//     — chính vì vậy mới cần đối chứng dương bằng metadata MySQL.
//
// Chạy: node tools/probe-column-parity.mjs
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const JS_SRC = "scripts/system-route.mjs";
const JAVA_SRC = "java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/BootstrapDataAdapter.java";
const MYSQL = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
const js = readFileSync(JS_SRC, "utf8");
const java = readFileSync(JAVA_SRC, "utf8");

// ─────────────────────────── TÁCH TẬP CỘT TỪ MỘT CÂU SQL ───────────────────────────
/**
 * Bỏ chuỗi trong nháy đơn/nháy kép (LITERAL) để không tách nhầm dấu phẩy bên trong literal.
 * ⚠️ SỬA Ở #103 (TASK-062): **backtick KHÔNG phải literal** — trong MySQL nó là dấu ĐỊNH DANH
 * (`m.`system`` vì `system` là từ khoá). Bản cũ coi backtick là literal ⇒ **xoá mất tên cột** ⇒ cổng báo
 * thiếu cột `system` ở CẢ 3 khoá `materials`/`adminMaterials`/`centralInventory`. Đó là DƯƠNG TÍNH GIẢ
 * của cổng, không phải lỗi của bản port ⇒ nay GIỮ NGUYÊN nội dung trong backtick.
 */
function maskLiterals(sql) {
  let out = "";
  let quote = null;
  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    if (quote) {
      if (quote === "`") {
        if (ch === "`") { quote = null; out += " "; continue; }
        out += ch;           // tên cột trong backtick: giữ nguyên (đây là ĐỊNH DANH, không phải literal)
        continue;
      }
      if (ch === quote) { quote = null; out += ch; continue; }
      out += " ";
      continue;
    }
    if (ch === "`") { quote = "`"; out += " "; continue; }   // mở định danh: bỏ dấu, giữ chữ
    if (ch === "'" || ch === '"') { quote = ch; out += ch; continue; }
    out += ch;
  }
  return out;
}

/** Tìm danh sách SELECT ở mức ngoài cùng (bỏ qua CTE: lấy SELECT cuối cùng trước FROM đầu tiên). */
function outerSelectList(sql) {
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

/** Cắt danh sách chọn theo dấu phẩy ở mức ngoài cùng. */
function splitTopLevel(list) {
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

/**
 * Tên cột đầu ra của một mục chọn: ưu tiên `AS <alias>`, nếu không có thì lấy định danh cuối.
 * ⚠️ #103 (TASK-062): BỎ DẤU BACKTICK trước khi khớp — `m.`system`` (định danh MySQL do `system` là từ khoá)
 * phải cho ra cột `system`; bản cũ để nguyên backtick nên biểu thức cuối không khớp ⇒ báo thiếu cột oan.
 */
function columnOf(item) {
  const clean = item.replace(/`/g, "");
  const asMatch = clean.match(/\s+AS\s+([A-Za-z_][A-Za-z0-9_]*)\s*$/i);
  if (asMatch) return { name: asMatch[1], fromAlias: true };
  const ident = clean.match(/([A-Za-z_][A-Za-z0-9_]*)\s*\)*\s*$/);
  return { name: ident ? ident[1] : null, fromAlias: false };
}

function columnsOf(sql) {
  const list = outerSelectList(sql);
  if (!list) return { columns: new Set(), exact: 0, approx: 0 };
  const columns = new Set();
  let exact = 0; let approx = 0;
  for (const item of splitTopLevel(list)) {
    const col = columnOf(item);
    if (!col.name) continue;
    columns.add(col.name);
    if (col.fromAlias) exact++; else approx++;
  }
  return { columns, exact, approx };
}

// ─────────────────────────── ĐỌC HAI PHÍA ───────────────────────────
/**
 * JS: mọi biến được gán bằng `all(...)`/`first(...)` với SQL trong backtick.
 * ⚠️ SỬA Ở #100 (TASK-060): bản cũ đòi `= await all(` NGAY SAU dấu `=`, nên **bỏ sót** dạng phổ biến
 * `const X = <điều kiện> ? await all(`SQL`) : []` và dạng 2 nhánh `isAdmin ? await all(A) : await all(B)`
 * (đó là lý do cổng chỉ so được 29/78 khoá). Nay: lấy TRỌN câu lệnh của khai báo rồi gom **mọi** khối SQL.
 */
const jsByVar = new Map();
{
  const declRe = /(?:const|let|var)\s+([A-Za-z_][A-Za-z0-9_]*)\s*=/g;
  let m;
  while ((m = declRe.exec(js)) !== null) {
    const name = m[1];
    const from = m.index + m[0].length;
    // quét tới hết câu lệnh (`;` ở mức ngoài cùng, bỏ qua chuỗi/backtick)
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
    const sqls = [...stmt.matchAll(/(?:all|first)\(\s*`([\s\S]*?)`/g)].map((x) => x[1]);
    if (!sqls.length) continue;
    const prev = jsByVar.get(name) ?? [];
    jsByVar.set(name, prev.concat(sqls.map((sql) => ({ sql, offset: m.index }))));
  }
}

/**
 * ⚠️ SỬA Ở #103 (TASK-062) — **TRÙNG TÊN BIẾN GIỮA CÁC HÀM** là nguồn DƯƠNG TÍNH GIẢ của bản ánh xạ theo tên:
 * tệp JS dài 3.156 dòng có **5** khai báo tên `materials` ở 5 hàm khác nhau; cổng cũ hợp cả 5 câu SQL ⇒ báo
 * Java "thiếu `active`/`materialId`/`aliasName`" trong khi đó là cột của `adminMaterials`/`materialAliases`.
 * Phép sửa: mọi giá trị bootstrap được gán TRƯỚC khi dựng object `result` ⇒ **chỉ lấy khai báo TRƯỚC
 * object `result` đầu tiên**. Nếu cấu trúc tệp đổi khiến ranh giới này sai, phần **ĐỘ PHỦ** cuối cổng sẽ báo HỎNG.
 */
const RESULT_LIT_OFFSET = (() => {
  const at = js.search(/const\s+result\s*=\s*\{/);
  return at < 0 ? Number.MAX_SAFE_INTEGER : at;
})();
for (const [name, list] of [...jsByVar.entries()]) {
  const inScope = list.filter((x) => x.offset < RESULT_LIT_OFFSET);
  jsByVar.set(name, (inScope.length ? inScope : list).map((x) => x.sql));
}

// ══════════ TASK-060 — ÁNH XẠ KHOÁ KẾT QUẢ → BIẾN CỦA JS (`const result = { key: value, … }`) ══════════
// Trước #100 cổng chỉ so các khoá mà JS **đặt tên biến TRÙNG tên khoá** ⇒ bỏ qua 49/78 khoá.
// JS dựng `result` ở `:727` dạng `{ staffDirectory, requests: enrichedRequests, projects: visibleProjects, … }`
// ⇒ parse chính object literal đó để lấy `khoá → biểu thức`, rồi lấy định danh ĐẦU TIÊN trong biểu thức.
function extractResultEntries(src) {
  const start = src.search(/const\s+result\s*=\s*\{/);
  if (start < 0) return [];
  const open = src.indexOf("{", start);
  let depth = 0;
  let quote = null;
  let end = -1;
  for (let i = open; i < src.length; i++) {
    const ch = src[i];
    if (quote) {
      if (ch === quote && src[i - 1] !== "\\") quote = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === "`") { quote = ch; continue; }
    if (ch === "{") depth++;
    else if (ch === "}") { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end < 0) return [];
  const body = src.slice(open + 1, end);
  return splitTopLevel(body).map((entry) => {
    const idx = entry.indexOf(":");
    // `key: value` hoặc shorthand `value`
    const key = (idx > 0 ? entry.slice(0, idx) : entry).trim();
    const valueExpr = idx > 0 ? entry.slice(idx + 1).trim() : entry.trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) return null;
    const ident = valueExpr.match(/^([A-Za-z_][A-Za-z0-9_]*)/);
    return { key, variable: ident ? ident[1] : null };
  }).filter(Boolean);
}
const resultEntries = extractResultEntries(js);

/** Khoá → danh sách SQL của JS (theo tên khoá, hoặc theo BIẾN mà khoá trỏ tới). */
const jsByKey = new Map();
for (const [varName, sqls] of jsByVar) jsByKey.set(varName, sqls);
let mappedByResult = 0;
for (const entry of resultEntries) {
  if (!entry.variable) continue;
  const sqls = jsByVar.get(entry.variable);
  if (!sqls) continue;
  if (!jsByKey.has(entry.key)) { jsByKey.set(entry.key, sqls); mappedByResult++; }
  else if (jsByKey.get(entry.key) !== sqls) { jsByKey.set(entry.key, sqls); }
}

/**
 * Java: BIẾN CỤC BỘ giữ SQL — `List<Map<String, Object>> X = query("""SQL""")`.
 * ⚠️ THÊM Ở #103 (TASK-062) vì một BÀI HỌC ĐÃ XẢY RA: khi `data.put("boqItems", boqItems)` không còn SQL
 * nội tuyến (vì phải gộp 2 câu + gắn trường dẫn xuất), cổng **ÂM THẦM MẤT ĐỘ PHỦ** khoá đó nhưng vẫn in
 * "KHÔNG khoá nào thiếu cột ✅". Một cổng mất độ phủ mà không báo là cổng NÓI DỐI ⇒ nay cổng phải
 * (a) giải được `data.put("K", biến)`, (b) khai TƯỜNG MINH các khoá GHÉP, (c) TỰ BÁO HỎNG khi mất độ phủ.
 */
const javaVars = new Map();
{
  const varRe = /(?:List<Map<String,\s*Object>>|var|final\s+var)\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(?:new\s+ArrayList<>\(\s*)?query\(\s*"""([\s\S]*?)"""/g;
  let m;
  while ((m = varRe.exec(java)) !== null) {
    const prev = javaVars.get(m[1]) ?? [];
    javaVars.set(m[1], prev.concat([m[2]]));
  }
}

/**
 * KHOÁ GHÉP — khoá bootstrap mà dữ liệu đến từ NHIỀU câu SQL (không phải 1 `query` nội tuyến).
 * Khai tường minh + ghi LÝ DO; nếu ai đó đổi cấu trúc mà quên cập nhật đây, phần ĐỘ PHỦ bên dưới sẽ báo HỎNG.
 */
const JAVA_KEY_SQL_VARS = {
  // JS `:624-655`: `boqItems` = câu CHÍNH (dòng BOQ đã ánh xạ) ⊕ `unmappedSourceRows` (dòng nguồn chưa ánh xạ)
  // ⊕ 3 trường dẫn xuất ⊕ `customFields`.
  boqItems: ["boqMainRows", "unmappedBoqRows"],
};

/** Java: mọi `data.put("KEY", …)` → gom TẤT CẢ khối `"""SQL"""` trong lệnh đó, + giải biến nếu có. */
const javaByKey = new Map();
{
  const putRe = /data\.put\("([A-Za-z_][A-Za-z0-9_]*)"/g;
  let m;
  while ((m = putRe.exec(java)) !== null) {
    const key = m[1];
    const tail = java.slice(m.index, m.index + 6000);
    // kết thúc lệnh: `);` ở mức ngoài cùng của put(...) — lấy thô trong 6000 ký tự nhưng dừng ở lần `);` đầu tiên
    const end = tail.indexOf(");");
    const body = end >= 0 ? tail.slice(0, end) : tail;
    const sqls = [...body.matchAll(/"""([\s\S]*?)"""/g)].map((x) => x[1]);
    // dạng `data.put("KEY", biến)` — giải qua biến cục bộ và/hoặc bảng khoá ghép
    const bare = tail.match(/^data\.put\("([A-Za-z_][A-Za-z0-9_]*)"\s*,\s*([A-Za-z_][A-Za-z0-9_]*)\s*\)/);
    if (bare) {
      const varName = bare[2];
      for (const name of JAVA_KEY_SQL_VARS[key] ?? [varName]) {
        for (const s of javaVars.get(name) ?? []) sqls.push(s);
      }
    }
    if (sqls.length) {
      const prev = javaByKey.get(key) ?? [];
      javaByKey.set(key, prev.concat(sqls));
    }
  }
}
/** Tên biến nào đã được cổng dùng để lấy SQL (để phát hiện khai báo sai tên trong JAVA_KEY_SQL_VARS). */
const javaVarNamesSeen = new Set(javaVars.keys());


// ─────────────────────────── ĐỐI CHỨNG DƯƠNG: bộ tách ↔ metadata MySQL ───────────────────────────
// Cách lấy metadata: dựng BẢNG TẠM từ chính câu SQL rồi `SHOW COLUMNS` — cách này KHÔNG phụ thuộc
// việc câu SQL có dữ liệu hay không (bài học: `SELECT … LIMIT 0` trong chế độ --batch KHÔNG in tiêu đề).
// `%s` (placeholder của Java `.formatted(...)`) và `?` (bind) được thay bằng NULL để câu SQL hợp lệ.
function mysqlColumns(sql) {
  const runnable = sql.replace(/"""/g, "").replace(/%s/g, "NULL").replace(/\?/g, "NULL");
  const script = `CREATE TEMPORARY TABLE vntech_col_probe AS ${runnable}; SHOW COLUMNS FROM vntech_col_probe;`;
  try {
    const out = execFileSync(MYSQL, ["--default-character-set=utf8mb4", "-uvntech", "-pvntech",
      "vntech_erp", "--batch", "--skip-column-names", "-e", script], { encoding: "utf8" });
    return out.split(/\r?\n/).map((l) => l.split("\t")[0].trim()).filter(Boolean);
  } catch (e) {
    return { error: String(e.stderr ?? e.message).replace(/\s+/g, " ").trim().slice(0, 180) };
  }
}

// Chỉ chọn các khoá có SQL **nội tuyến** trong `data.put(...)` (không phải biến trung gian).
const CONTROLS = ["constructionDailyLogs", "transferOrders", "issues", "returns", "companyAvailability", "roleCatalog"];
console.log("═══ ĐỐI CHỨNG DƯƠNG: bộ tách cột của cổng ↔ metadata THẬT của MySQL ═══");
const controlResults = [];
for (const key of CONTROLS) {
  const sqls = javaByKey.get(key);
  if (!sqls) { console.log(`  (bỏ qua) ${key}: không thấy SQL trong adapter`); continue; }
  const parsed = new Set();
  for (const s of sqls) for (const c of columnsOf(s).columns) parsed.add(c);
  const truth = mysqlColumns(sqls[0].replace(/"""/g, ""));
  if (!Array.isArray(truth)) {
    console.log(`  (bỏ qua) ${key}: MySQL không chạy được — ${truth.error}`);
    continue;
  }
  const missingInParse = truth.filter((c) => !parsed.has(c));
  const extraInParse = [...parsed].filter((c) => !truth.includes(c));
  const ok = missingInParse.length === 0 && extraInParse.length === 0;
  controlResults.push(ok);
  console.log(`  ${ok ? "ĐẠT" : "HỎNG"}  ${key}: parser=${parsed.size} cột · MySQL=${truth.length} cột` +
    (ok ? "" : ` · parser thiếu [${missingInParse.join(",")}] · parser thừa [${extraInParse.join(",")}]`));
}

// ─────────────────────────── CHẾ ĐỘ TRA MỘT KHOÁ (`--key <tên>`) ───────────────────────────
// Dùng khi vá: in ra CẢ HAI câu SQL (JS + Java) và danh sách cột thiếu/thừa để sửa không phải đoán.
const keyArgIdx = process.argv.indexOf("--key");
if (keyArgIdx >= 0) {
  const key = process.argv[keyArgIdx + 1];
  const javaSqls = javaByKey.get(key) ?? [];
  const jsSqls = jsByKey.get(key) ?? [];
  console.log(`═══ KHOÁ \`${key}\` ═══`);
  console.log(`\n--- JAVA (${javaSqls.length} câu) ---`);
  javaSqls.forEach((s, i) => console.log(`[${i}] ${s.replace(/\s+/g, " ").trim()}`));
  console.log(`\n--- JS (${jsSqls.length} câu) ---`);
  jsSqls.forEach((s, i) => console.log(`[${i}] ${s.replace(/\s+/g, " ").trim()}`));
  const jsCols = new Set(); for (const s of jsSqls) for (const c of columnsOf(s).columns) jsCols.add(c);
  const javaCols = new Set(); for (const s of javaSqls) for (const c of columnsOf(s).columns) javaCols.add(c);
  console.log(`\nTHIẾU ở Java: ${[...jsCols].filter((c) => !javaCols.has(c)).join(", ") || "(không)"}`);
  console.log(`THỪA ở Java: ${[...javaCols].filter((c) => !jsCols.has(c)).join(", ") || "(không)"}`);
  process.exit(0);
}

// ─────────────────────────── SO SÁNH THEO TỪNG KHOÁ ───────────────────────────
const findings = [];
const compared = [];
const skipped = [];
for (const [key, javaSqls] of javaByKey) {
  const jsSqls = jsByKey.get(key);
  if (!jsSqls) { skipped.push(key); continue; }
  const jsCols = new Set();
  for (const s of jsSqls) for (const c of columnsOf(s).columns) jsCols.add(c);
  const javaCols = new Set();
  for (const s of javaSqls) for (const c of columnsOf(s).columns) javaCols.add(c);
  if (!jsCols.size || !javaCols.size) { skipped.push(key); continue; }
  const missing = [...jsCols].filter((c) => !javaCols.has(c));
  const extra = [...javaCols].filter((c) => !jsCols.has(c));
  compared.push({ key, js: jsCols.size, java: javaCols.size });
  if (missing.length) findings.push({ key, missing, extra });
}

console.log(`\n═══ SO SÁNH TẬP CỘT: đã so ${compared.length} khoá trùng tên hai phía · bỏ qua ${skipped.length} khoá (không trùng tên biến) ═══`);
findings.sort((a, b) => b.missing.length - a.missing.length);
if (!findings.length) {
  console.log("KHÔNG khoá nào thiếu cột. ✅");
} else {
  console.log(`KHOÁ JAVA THIẾU CỘT SO VỚI JS: ${findings.length}`);
  for (const f of findings) {
    console.log(`  • ${f.key} — thiếu ${f.missing.length} cột: ${f.missing.join(", ")}` +
      (f.extra.length ? `  (Java thừa: ${f.extra.join(", ")})` : ""));
  }
}

// ═══════════════════ ĐỘ PHỦ — CỔNG PHẢI TỰ BÁO KHI MẤT KHOÁ (bài học #103) ═══════════════════
// Sự cố thật: sau khi `boqItems` chuyển từ SQL nội tuyến sang mảng ghép, cổng mất độ phủ khoá đó
// nhưng VẪN in "KHÔNG khoá nào thiếu cột ✅". Một cổng mất độ phủ mà không báo là cổng NÓI DỐI.
const comparedKeys = new Set(compared.map((c) => c.key));
const REQUIRED_COMPARED_KEYS = [
  "boqItems", "boqSourceItems", "boqImportBatches", "boqChangeHistory", "boqVersions", "projectContracts",
  "contractStockLedger", "contractStockBalances", "stockReconciliations", "teamSettlements", "teamPayments",
  "modulePermissions", "workflowAssignments", "constructionDailyLogs", "taskNotifications",
  "businessRoleGroupScopes", "organizationUnits", "materials", "adminMaterials", "centralInventory",
];
const MIN_COMPARED = 65;
const coverageProblems = [];
{
  const lost = REQUIRED_COMPARED_KEYS.filter((k) => !comparedKeys.has(k));
  if (lost.length) coverageProblems.push(`mất độ phủ ${lost.length} khoá BẮT BUỘC: ${lost.join(", ")}`);
  if (compared.length < MIN_COMPARED) {
    coverageProblems.push(`số khoá so được tụt còn ${compared.length} (< ${MIN_COMPARED}) — có khoá vừa rơi khỏi cổng`);
  }
  for (const [key, names] of Object.entries(JAVA_KEY_SQL_VARS)) {
    for (const n of names) {
      if (!javaVarNamesSeen.has(n)) coverageProblems.push(`JAVA_KEY_SQL_VARS["${key}"] trỏ tới biến KHÔNG tồn tại: \`${n}\``);
    }
  }
}
if (coverageProblems.length) {
  console.log("\n⚠️ ĐỘ PHỦ CỦA CỔNG CÓ VẤN ĐỀ — kết luận 'không thiếu cột' ở trên KHÔNG đáng tin:");
  for (const p of coverageProblems) console.log(`  • ${p}`);
} else {
  console.log(`\nĐỘ PHỦ: so được ${compared.length} khoá (≥ ${MIN_COMPARED}) · có đủ ${REQUIRED_COMPARED_KEYS.length} khoá bắt buộc` +
    " ⇒ cổng KHÔNG mất độ phủ.");
}

console.log("\nGIỚI HẠN: chỉ so các khoá TRÙNG TÊN hai phía; mục không có `AS` lấy định danh cuối (có thể sai với biểu thức phức tạp)");
console.log("         ⇒ vì vậy cổng BẮT BUỘC có phần đối chứng dương với metadata MySQL ở trên.");
console.log("         Cổng CHỈ so TẬP CỘT — KHÔNG kiểm `ORDER BY`/`LIMIT`/kiểu `JOIN`/mệnh đề `WHERE` (xem Known Problems #61).");
const controlsOk = controlResults.length > 0 && controlResults.every(Boolean);
console.log(`ĐỐI CHỨNG DƯƠNG: ${controlResults.filter(Boolean).length}/${controlResults.length} khoá kiểm được khớp HOÀN TOÀN với MySQL` +
  (controlsOk ? " ⇒ bộ tách cột đáng tin." : " ⇒ ⚠️ bộ tách có vấn đề, ĐỪNG kết luận từ danh sách trên."));
process.exit(controlsOk && coverageProblems.length === 0 ? 0 : 1);
