// PHÂN LOẠI các bảng lệch BẢN ĐỒ GHI: bảng đó do ACTION nào ghi, và action đó Java CÓ hay KHÔNG có `case`?
//
// VÌ SAO CẦN: `probe-write-map-drift.mjs` chỉ nói "bảng X: JS ghi cột a, Java không". Nhưng thông tin đó
// KHÔNG đủ để kết luận, vì hai tình huống rất khác nhau:
//   · Java CHƯA PORT cả action đó (không có `case`) ⇒ đúng thiết kế Strangler Fig, KHÔNG phải lỗi cột.
//   · Java CÓ `case` cho action đó nhưng KHÔNG ghi bảng/cột ⇒ **THIẾU PORT THẬT** — đây mới là việc phải sửa.
// Công cụ này tách hai loại đó ra, nên đọc kết quả là biết ngay chỗ nào đáng sửa.
//
// CÁCH LÀM: gán mỗi câu SQL của JS cho ACTION chứa nó (theo dòng `if (action === "…") {` bao quanh), rồi
// đối chiếu với danh sách `case "…"` của SystemController.java.
//
// Chạy: node tools/probe-write-map-triage.mjs [--only <bảng1,bảng2>]
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const JS_ROUTE = "scripts/system-route.mjs";
const CONTROLLER = "java-backend/web/src/main/java/com/vntech/erp/web/controller/SystemController.java";
const JAVA_ROOTS = ["java-backend/application/src/main/java", "java-backend/infrastructure/src/main/java", "java-backend/web/src/main/java"];

const LOWERCASE_WORDS = new Set(["values", "select", "set", "where", "on", "duplicate", "key", "update"]);

function collect(sql, put) {
  for (const m of sql.matchAll(/INSERT\s+INTO\s+[`"']?(\w+)[`"']?\s*\(([^)]*)\)/gi)) {
    for (const c of m[2].split(",")) put(m[1], c.trim().replace(/[`"']/g, "").split(".").pop());
  }
  for (const m of sql.matchAll(/UPDATE\s+[`"']?(\w+)[`"']?\s+SET\s+([\s\S]*?)(?=\bWHERE\b|;|`|\)\s*$|$)/gi)) {
    for (const a of m[2].split(",")) {
      if (!a.includes("=")) continue;
      put(m[1], a.split("=")[0].trim().replace(/[`"']/g, "").split(".").pop());
    }
  }
}
const norm = (v) => { const s = String(v ?? "").toLowerCase(); return /^\w+$/.test(s) && !LOWERCASE_WORDS.has(s) ? s : null; };

// ---------------------------------------------------------------- 1) JS: bảng → cột, kèm ACTION
const jsLines = readFileSync(JS_ROUTE, "utf8").split(/\r?\n/);
const actionRanges = [];
for (let i = 0; i < jsLines.length; i++) {
  const m = jsLines[i].match(/^\s*if \(action === "([a-z0-9_]+)"\)/);
  if (m) actionRanges.push({ name: m[1], from: i });
}
for (let i = 0; i < actionRanges.length; i++) {
  actionRanges[i].to = i + 1 < actionRanges.length ? actionRanges[i + 1].from : jsLines.length;
}

const jsWrite = new Map();        // "bảng.cột" -> Set(action)
const jsTableActions = new Map(); // bảng -> Set(action)
for (const r of actionRanges) {
  const text = jsLines.slice(r.from, r.to).join("\n");
  for (const m of text.matchAll(/`([^`]*)`/g)) {
    const sql = m[1];
    if (sql.includes("${")) continue;
    if (!/\b(INSERT\s+INTO|UPDATE)\b/i.test(sql)) continue;
    collect(sql, (t, c) => {
      const table = t.toLowerCase(), col = norm(c);
      if (!col) return;
      const key = `${table}.${col}`;
      if (!jsWrite.has(key)) jsWrite.set(key, new Set());
      jsWrite.get(key).add(r.name);
      if (!jsTableActions.has(table)) jsTableActions.set(table, new Set());
      jsTableActions.get(table).add(r.name);
    });
  }
}

// ---------------------------------------------------------------- 2) Java: bảng → cột
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (name.endsWith(".java")) out.push(p);
  }
  return out;
}
const javaWrite = new Map();
for (const file of JAVA_ROOTS.flatMap((r) => { try { return walk(r); } catch { return []; } })) {
  const src = readFileSync(file, "utf8");
  for (const m of src.matchAll(/"""([\s\S]*?)"""/g)) {
    if (/%s|\$\{|"\s*\+|\+\s*"/.test(m[1])) continue;
    collect(m[1], (t, c) => {
      const col = norm(c);
      if (!col) return;
      const key = `${t.toLowerCase()}.${col}`;
      if (!javaWrite.has(key)) javaWrite.set(key, new Set());
      javaWrite.get(key).add(relative(".", file).split(sep).join("/"));
    });
  }
  for (const m of src.matchAll(/"((?:[^"\\\n]|\\.)*)"/g)) {
    if (!/\b(INSERT\s+INTO|UPDATE)\b/i.test(m[1]) || /%s|\$\{/.test(m[1])) continue;
    collect(m[1], (t, c) => {
      const col = norm(c);
      if (!col) return;
      const key = `${t.toLowerCase()}.${col}`;
      if (!javaWrite.has(key)) javaWrite.set(key, new Set());
      javaWrite.get(key).add(relative(".", file).split(sep).join("/"));
    });
  }
}

// ---------------------------------------------------------------- 3) Java: các nhánh `case`
const javaCases = new Set([...readFileSync(CONTROLLER, "utf8").matchAll(/case\s+"([a-z0-9_]+)"\s*->/g)].map((m) => m[1]));

// ---------------------------------------------------------------- 4) Phân loại
const onlyIdx = process.argv.indexOf("--only");
const only = onlyIdx >= 0 && process.argv[onlyIdx + 1] ? new Set(process.argv[onlyIdx + 1].split(",").map((s) => s.trim().toLowerCase())) : null;

const missing = [...jsWrite.keys()].filter((k) => !javaWrite.has(k));
const tables = [...new Set(missing.map((k) => k.split(".")[0]))].sort().filter((t) => !only || only.has(t));

console.log(`Tổng: ${missing.length} cặp (bảng,cột) JS ghi mà Java KHÔNG ghi · ${tables.length} bảng\n`);

const buckets = { realGap: [], notPorted: [], mixed: [] };
for (const t of tables) {
  const actions = [...(jsTableActions.get(t) ?? [])].sort();
  const inJava = actions.filter((a) => javaCases.has(a));
  const notInJava = actions.filter((a) => !javaCases.has(a));
  const kind = inJava.length && notInJava.length ? "mixed" : inJava.length ? "realGap" : "notPorted";
  buckets[kind].push({ t, actions, inJava, notInJava });
  const cols = missing.filter((k) => k.startsWith(`${t}.`)).map((k) => k.split(".")[1]).sort();
  const label = kind === "realGap" ? "⚠ THIẾU PORT THẬT" : kind === "mixed" ? "◐ HỖN HỢP" : "○ CHƯA PORT (Strangler Fig)";
  console.log(`── ${t}   ${label}`);
  console.log(`   cột JS ghi mà Java không ghi : ${cols.join(", ") || "(không)"}`);
  console.log(`   action ghi bảng này          : ${actions.join(", ")}`);
  if (inJava.length) console.log(`   Java CÓ case                 : ${inJava.join(", ")}`);
  if (notInJava.length) console.log(`   Java THIẾU case              : ${notInJava.join(", ")}`);
  console.log("");
}

console.log("════ KẾT LUẬN PHÂN LOẠI ════");
console.log(`  ⚠ THIẾU PORT THẬT (Java có case nhưng không ghi)      : ${buckets.realGap.length} bảng`);
for (const b of buckets.realGap) console.log(`      ${b.t}  ← action ${b.inJava.join(", ")}`);
console.log(`  ◐ HỖN HỢP (một phần action đã port, một phần chưa)    : ${buckets.mixed.length} bảng`);
for (const b of buckets.mixed) console.log(`      ${b.t}  ← đã port: ${b.inJava.join(", ")} | chưa: ${b.notInJava.join(", ")}`);
console.log(`  ○ CHƯA PORT (không action nào có case ⇒ đúng Strangler): ${buckets.notPorted.length} bảng`);
for (const b of buckets.notPorted) console.log(`      ${b.t}  ← ${b.actions.join(", ")}`);

console.log("\nLƯU Ý: đây là phân loại theo TÊN ACTION, không thay thế việc đọc mã. Một action có thể có `case`");
console.log("nhưng chạy một phần, hoặc tên action trùng nhau ở nhiều nhánh — vẫn phải mở mã xác nhận trước khi sửa.");
process.exitCode = buckets.realGap.length ? 1 : 0;
