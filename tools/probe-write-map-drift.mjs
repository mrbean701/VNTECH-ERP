// BẢN ĐỒ GHI: so từng CỘT mà JS ghi với từng CỘT mà Java ghi, cho cùng một bảng.
//
// VÌ SAO CẦN: TASK-040 đã gặp **năm lần** dạng lỗi "ghi được mà ĐỌC không ra" và nhiều lần "Java ghi thiếu /
// ghi thừa cột". Các cổng hiện có bắt được: cột KHÔNG TỒN TẠI (lược đồ), ghi sai CÁCH (cộng dồn), action thiếu
// `case`. Còn một lớp chưa có cổng: **Java ghi THIẾU cột so với JS** (âm thầm mất dữ liệu) hoặc **ghi THỪA
// cột mà JS không ghi** (dấu hiệu port tự thêm — như `materials.is_component`/`created_by` đã gặp ở nhóm 3).
//
// CÁCH LÀM: trích `INSERT INTO <bảng> (<cột,…>)` và `UPDATE <bảng> SET <cột>=…` ở CẢ HAI phía, gom theo bảng,
// rồi in hiệu đối xứng. Bỏ qua câu lệnh ĐỘNG (có `${}` ở JS, `%s`/`${}`/ghép chuỗi ở Java) vì không phân tích
// tĩnh được.
//
// ⚠ ĐỌC KẾT QUẢ THẾ NÀO: đây là **ỨNG VIÊN để người đọc xác nhận**, KHÔNG phải kết luận. Cùng một bảng có thể
// được ghi ở nhiều luồng khác nhau, mỗi luồng ghi một tập cột khác nhau là hợp lệ (vd `UPDATE` chỉ sửa 2 cột).
// Dấu hiệu đáng nghi là khi JS ghi một cột ở MỌI câu lệnh mà Java KHÔNG ghi ở bất kỳ câu lệnh nào.
//
// ĐỐI CHỨNG DƯƠNG có sẵn: `vntech_license_installations` là ca lệch ĐÃ BIẾT (TASK-040 nhóm 6 — Java ghi
// `license_key/company_name/edition/activated_by/activated_at/created_at`, JS ghi `license_id/tenant_id/…`).
// Nếu công cụ KHÔNG báo bảng này thì công cụ hỏng.
//
// Chạy: node tools/probe-write-map-drift.mjs [--table <tên_bảng>] [--min <số_cột_lệch_tối_thiểu>]
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const JS_ROUTE = "scripts/system-route.mjs";
const JAVA_ROOTS = ["java-backend/application/src/main/java", "java-backend/infrastructure/src/main/java", "java-backend/web/src/main/java"];

const argOf = (flag, dflt) => { const i = process.argv.indexOf(flag); return i >= 0 ? process.argv[i + 1] : dflt; };
const onlyTable = (argOf("--table", "") || "").toLowerCase();
const minDrift = Number(argOf("--min", "1")) || 1;

const LOWERCASE_WORDS = new Set(["values", "select", "set", "where", "on", "duplicate", "key", "update"]);

/** Trích (bảng → tập cột) từ một đoạn SQL. Trả về cảnh báo nếu gặp cú pháp lạ. */
function collect(sql, into) {
  const put = (table, col) => {
    const t = table.toLowerCase();
    const c = col.toLowerCase();
    if (!c || !/^\w+$/.test(c) || LOWERCASE_WORDS.has(c)) return;
    if (!into.has(t)) into.set(t, new Set());
    into.get(t).add(c);
  };
  for (const m of sql.matchAll(/INSERT\s+INTO\s+[`"']?(\w+)[`"']?\s*\(([^)]*)\)/gi)) {
    for (const c of m[2].split(",")) put(m[1], c.trim().replace(/[`"']/g, "").split(".").pop());
  }
  for (const m of sql.matchAll(/UPDATE\s+[`"']?(\w+)[`"']?\s+SET\s+([\s\S]*?)(?=\bWHERE\b|;|`|\)\s*$|$)/gi)) {
    for (const a of m[2].split(",")) {
      const lhs = a.split("=")[0];
      if (!lhs.includes("=") && !a.includes("=")) continue;
      put(m[1], lhs.trim().replace(/[`"']/g, "").split(".").pop());
    }
  }
}

// ---------- JS ----------
const jsText = readFileSync(JS_ROUTE, "utf8");
const jsWrite = new Map();
for (const m of jsText.matchAll(/`([^`]*)`/g)) {
  const sql = m[1];
  if (sql.includes("${")) continue;                      // câu lệnh động
  if (!/\b(INSERT\s+INTO|UPDATE)\b/i.test(sql)) continue;
  collect(sql, jsWrite);
}
// JS cũng dùng chuỗi thường cho một số câu lệnh ngắn
for (const m of jsText.matchAll(/"((?:[^"\\\n]|\\.)*)"/g)) {
  const sql = m[1];
  if (sql.includes("${") || !/\b(INSERT\s+INTO|UPDATE)\s+\w/i.test(sql)) continue;
  collect(sql, jsWrite);
}

// ---------- Java ----------
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (name.endsWith(".java")) out.push(p);
  }
  return out;
}
const javaWrite = new Map();
const javaFiles = JAVA_ROOTS.flatMap((r) => { try { return walk(r); } catch { return []; } });
let skippedDynamic = 0;
for (const file of javaFiles) {
  const src = readFileSync(file, "utf8");
  const snippets = [
    ...[...src.matchAll(/"""([\s\S]*?)"""/g)].map((m) => m[1]),
    ...[...src.matchAll(/"((?:[^"\\\n]|\\.)*)"/g)].map((m) => m[1]).filter((t) => /\b(INSERT\s+INTO|UPDATE)\b/i.test(t)),
  ];
  for (const sql of snippets) {
    if (/%s|%d|\$\{|"\s*\+|\+\s*"/.test(sql)) { skippedDynamic += 1; continue; }
    collect(sql, javaWrite);
  }
}

console.log(`JS  : ${jsWrite.size} bảng có câu lệnh GHI tĩnh · ${[...jsWrite.values()].reduce((s, v) => s + v.size, 0)} cặp (bảng,cột)`);
console.log(`Java: ${javaWrite.size} bảng · ${[...javaWrite.values()].reduce((s, v) => s + v.size, 0)} cặp  (bỏ qua ${skippedDynamic} câu lệnh động)\n`);

const tables = [...new Set([...jsWrite.keys(), ...javaWrite.keys()])].sort()
  .filter((t) => !onlyTable || t === onlyTable);

const rows = [];
for (const t of tables) {
  const js = jsWrite.get(t) ?? new Set();
  const jv = javaWrite.get(t) ?? new Set();
  const jsOnly = [...js].filter((c) => !jv.has(c)).sort();
  const javaOnly = [...jv].filter((c) => !js.has(c)).sort();
  if (jsOnly.length + javaOnly.length < minDrift) continue;
  rows.push({ t, jsOnly, javaOnly, jsSize: js.size, javaSize: jv.size });
}
rows.sort((a, b) => (b.jsOnly.length + b.javaOnly.length) - (a.jsOnly.length + a.javaOnly.length));

console.log("════ BẢNG CÓ LỆCH BẢN ĐỒ GHI (ứng viên cần đọc) ════");
for (const r of rows) {
  console.log(`\n  ▸ ${r.t}   (JS ${r.jsSize} cột · Java ${r.javaSize} cột)`);
  if (r.jsOnly.length) console.log(`      JS GHI mà Java KHÔNG ghi : ${r.jsOnly.join(", ")}`);
  if (r.javaOnly.length) console.log(`      JAVA GHI mà JS không ghi : ${r.javaOnly.join(", ")}`);
}
console.log(`\nTổng: ${rows.length} bảng có lệch.`);

// ---------- ĐỐI CHỨNG DƯƠNG BẮT BUỘC ----------
const control = "vntech_license_installations";
const got = rows.find((r) => r.t === control);
console.log("\n──── ĐỐI CHỨNG DƯƠNG (ca lệch ĐÃ BIẾT — TASK-040 nhóm 6) ────");
if (!got) {
  console.log(`  ✖ CÔNG CỤ HỎNG: không phát hiện ${control} dù đây là ca lệch đã biết.`);
  process.exitCode = 2;
} else {
  console.log(`  ✔ Bắt được ${control}`);
  console.log(`      JS GHI mà Java KHÔNG ghi : ${got.jsOnly.join(", ") || "(không)"}`);
  console.log(`      JAVA GHI mà JS không ghi : ${got.javaOnly.join(", ") || "(không)"}`);
  console.log("\n  ⚠ Danh sách trên là ỨNG VIÊN, không phải kết luận: phải đọc từng câu lệnh và đối chiếu nghiệp vụ.");
  process.exitCode = 0;
}
