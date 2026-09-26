// Săn LỆCH NGỮ NGHĨA: cột mà JS CỘNG DỒN (`col = col + ?`) nhưng Java GHI ĐÈ (`col = ?`).
//
// VÌ SAO CẦN (TASK-040 nhóm 4): cổng `probe-java-sql-live.mjs` chỉ bắt được cột KHÔNG TỒN TẠI. Nó KHÔNG THỂ
// bắt được trường hợp cột có thật nhưng Java ghi sai cách. Ca thật đã xảy ra:
//   JS  : UPDATE stock_issue_items SET installed_qty=installed_qty+?   (CỘNG DỒN)
//   Java: UPDATE stock_issue_items SET installed_qty=?                 (GHI ĐÈ)
// ⇒ xác nhận lắp 3 rồi 4: JS ra 7, Java ra 4 — SAI SỐ LIỆU âm thầm, không lỗi HTTP, không log.
// Đây là lớp lỗi nguy hiểm nhất trong ba lớp của TASK-040 vì không có tín hiệu nào để phát hiện.
//
// CÁCH LÀM: trích các phép gán dạng `x = x + ?` / `x = COALESCE(x,0)+?` ở JS, rồi tìm câu `UPDATE <bảng> SET`
// gần nhất PHÍA TRƯỚC để suy ra (bảng, cột). Bên Java trích các phép gán dạng `x = ?` (đúng một dấu hỏi).
// Giao của hai tập = ỨNG VIÊN cần người đọc xác nhận.
//
// Chạy: node tools/probe-increment-drift.mjs
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const JS_ROUTE = "scripts/system-route.mjs";
const JAVA_ROOTS = ["java-backend/application/src/main/java", "java-backend/infrastructure/src/main/java", "java-backend/web/src/main/java"];

const lineAt = (src, idx) => src.slice(0, idx).split(/\r?\n/).length;

/** Suy ra bảng của câu UPDATE gần nhất phía trước vị trí `idx`. */
function tableBefore(src, idx) {
  const before = src.slice(Math.max(0, idx - 4000), idx);
  const m = [...before.matchAll(/UPDATE\s+[`"']?(\w+)[`"']?\s+SET/gi)].pop();
  return m ? m[1].toLowerCase() : "(không rõ bảng)";
}

// ---------------------------------------------------------------- 1) JS: các cột CỘNG DỒN
const js = readFileSync(JS_ROUTE, "utf8");
const jsIncrements = new Map();   // "table.col" -> [dòng JS]
for (const m of js.matchAll(/(\w+)\s*=\s*(?:COALESCE\(\s*\1\s*,\s*0\s*\)|\1)\s*\+\s*\?/gi)) {
  const col = m[1].toLowerCase();
  const table = tableBefore(js, m.index);
  const key = `${table}.${col}`;
  if (!jsIncrements.has(key)) jsIncrements.set(key, []);
  const ln = lineAt(js, m.index);
  if (jsIncrements.get(key).length < 5) jsIncrements.get(key).push(ln);
}
console.log(`JS: ${jsIncrements.size} cột được CỘNG DỒN (col = col + ?)`);
for (const [k, v] of [...jsIncrements].sort()) console.log(`  ${k.padEnd(46)} dòng JS: ${v.join(", ")}`);
console.log("");

// ---------------------------------------------------------------- 2) Java: các cột GHI ĐÈ
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (name.endsWith(".java")) out.push(p);
  }
  return out;
}
function extractSql(src) {
  const out = [];
  const lineOf = (idx) => src.slice(0, idx).split(/\r?\n/).length;
  for (const m of src.matchAll(/"""([\s\S]*?)"""/g)) out.push({ text: m[1], line: lineOf(m.index) });
  for (const m of src.matchAll(/"((?:[^"\\\n]|\\.)*)"/g)) {
    const t = m[1];
    if (/\b(UPDATE|INSERT\s+INTO)\b/i.test(t)) out.push({ text: t, line: lineOf(m.index) });
  }
  return out;
}

const javaOverwrites = new Map();   // "table.col" -> ["file:line"]
let javaIncrementCount = 0;

// ĐỐI CHỨNG DƯƠNG (--extra-file <đường dẫn>): quét THÊM một tệp Java ngoài cây nguồn.
// Dùng để chứng minh công cụ THẬT SỰ bắt được lỗi đã biết: lấy bản CŨ từ git rồi cho quét lại.
//   git show HEAD:java-backend/.../WarehouseStockStoreAdapter.java > .tmp-old.java
//   node tools/probe-increment-drift.mjs --extra-file .tmp-old.java
// Nếu công cụ báo ứng viên cho tệp cũ mà báo sạch cho cây hiện tại thì phép đo có giá trị.
const extraIdx = process.argv.indexOf("--extra-file");
const javaFiles = [
  ...JAVA_ROOTS.flatMap((r) => { try { return walk(r); } catch { return []; } }),
  ...(extraIdx >= 0 && process.argv[extraIdx + 1] ? [process.argv[extraIdx + 1]] : []),
];
for (const file of javaFiles) {
  const src = readFileSync(file, "utf8");
  const rel = relative(".", file).split(sep).join("/").replace("java-backend/", "");
  for (const { text, line } of extractSql(src)) {
    if (/%s|\$\{|"\s*\+|\+\s*"/.test(text)) continue;
    for (const m of text.matchAll(/UPDATE\s+[`"']?(\w+)[`"']?\s+SET\s+([\s\S]*?)(?=\bWHERE\b|$)/gi)) {
      const table = m[1].toLowerCase();
      for (const assign of m[2].split(",")) {
        const eq = assign.indexOf("=");
        if (eq < 0) continue;
        const col = assign.slice(0, eq).trim().replace(/[`"']/g, "").split(".").pop().toLowerCase();
        const rhs = assign.slice(eq + 1).trim();
        if (!/^\w+$/.test(col)) continue;
        if (/\w\s*\+\s*\?/.test(rhs)) { javaIncrementCount++; continue; }   // Java cũng cộng dồn — bỏ qua
        if (rhs === "?") {                                                 // ghi đè bằng một tham số
          const key = `${table}.${col}`;
          if (!javaOverwrites.has(key)) javaOverwrites.set(key, []);
          if (javaOverwrites.get(key).length < 6) javaOverwrites.get(key).push(`${rel}:${line}`);
        }
      }
    }
  }
}
console.log(`Java: ${javaOverwrites.size} cột được GHI ĐÈ (col = ?) · ${javaIncrementCount} phép cộng dồn (đã bỏ qua)`);
console.log("");

// ---------------------------------------------------------------- 3) GIAO = ỨNG VIÊN
const candidates = [...jsIncrements.keys()].filter((k) => javaOverwrites.has(k)).sort();
console.log("════ ỨNG VIÊN LỆCH NGỮ NGHĨA: JS cộng dồn nhưng Java ghi đè ════");
if (!candidates.length) {
  console.log("  (không có) ✅");
  process.exitCode = 0;
} else {
  for (const k of candidates) {
    console.log(`\n  ▸ ${k}`);
    console.log(`      JS  cộng dồn ở dòng : ${jsIncrements.get(k).join(", ")}`);
    for (const loc of javaOverwrites.get(k)) console.log(`      Java GHI ĐÈ        : ${loc}`);
  }
  console.log(`\nTổng: ${candidates.length} ứng viên.`);
  console.log("LƯU Ý: đây là ỨNG VIÊN, không phải kết luận — một bảng có thể được ghi ở nhiều nơi với ngữ nghĩa");
  console.log("khác nhau. Phải đọc từng chỗ và đối chiếu hành động (action) tương ứng trước khi sửa.");
  process.exitCode = 1;
}
