// Lệch giữa TỆP MIGRATION (`V*.sql`) và DB ĐANG CHẠY (INFORMATION_SCHEMA).
//
// VÌ SAO CẦN: hai công cụ TASK-040 đo ra hai con số khác nhau —
//   · `probe-java-sql-schema.mjs` (dựng lược đồ từ tệp migration): 120 bảng · 1543 cột
//   · `probe-java-sql-live.mjs`   (đọc DB đang chạy):               121 bảng · 1553 cột
// Nghĩa là **tệp migration không tái lập được DB đang chạy**. Điều này quan trọng vì:
//   1. Cài mới từ migration sẽ ra lược đồ KHÁC bản đang chạy ⇒ hỏng theo cách không tái hiện được;
//   2. Khi sửa Java cho khớp DB, phải biết cột nào là "có thật nhưng không có trong migration"
//      (do ALTER tay / migration ngoài Flyway) trước khi kết luận.
//
// Cách lấy lược đồ đang chạy (xem đầu `probe-java-sql-live.mjs`):
//   mysql -uvntech -pvntech --batch --raw --skip-column-names -e "SELECT CONCAT(TABLE_NAME,CHAR(9),COLUMN_NAME)
//     FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='vntech_erp' ORDER BY TABLE_NAME,ORDINAL_POSITION;" > tools/_live-schema.tsv
//
// Chạy: node tools/probe-schema-drift.mjs
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const LIVE_TSV = "tools/_live-schema.tsv";
const MIGRATION_DIR = "java-backend/infrastructure/src/main/resources/db/migration";

if (!existsSync(LIVE_TSV)) {
  console.error(`THIẾU ${LIVE_TSV} — kết xuất lược đồ đang chạy trước (xem đầu tệp).`);
  process.exit(2);
}

// ---- lược đồ ĐANG CHẠY ----
const live = new Map();
for (const line of readFileSync(LIVE_TSV, "utf8").split(/\r?\n/)) {
  if (!line.trim()) continue;
  const [t, c] = line.split("\t");
  if (!t || !c) continue;
  const k = t.trim().toLowerCase();
  if (!live.has(k)) live.set(k, new Set());
  live.get(k).add(c.trim().toLowerCase());
}

// ---- lược đồ dựng lại từ TỆP MIGRATION (cùng thuật toán, gồm cả CHANGE/RENAME/DROP) ----
const mig = new Map();
for (const f of readdirSync(MIGRATION_DIR).filter((n) => /^V\d+__.*\.sql$/.test(n)).sort((a, b) => Number(a.match(/^V(\d+)/)[1]) - Number(b.match(/^V(\d+)/)[1]) || a.localeCompare(b))) {
  let sql = readFileSync(join(MIGRATION_DIR, f), "utf8").replace(/--[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
  const ensure = (t) => { const k = t.toLowerCase(); if (!mig.has(k)) mig.set(k, new Set()); return k; };
  for (const m of sql.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"']?(\w+)[`"']?\s*\(([\s\S]*?)\n\s*\)\s*ENGINE/gi)) {
    const t = ensure(m[1]);
    for (const line of m[2].split("\n")) {
      const c = line.trim().match(/^[`"']?(\w+)[`"']?\s+/);
      if (!c) continue;
      const name = c[1].toLowerCase();
      if (["primary", "unique", "key", "index", "constraint", "foreign", "check", "fulltext", "spatial"].includes(name)) continue;
      // A table-level COMMENT clause is unquoted; a real `comment` column is backtick-quoted.
      if (name === "comment" && !line.trim().startsWith("`")) continue;
      mig.get(t).add(name);
    }
  }
  for (const m of sql.matchAll(/ALTER\s+TABLE\s+[`"']?(\w+)[`"']?\s+([\s\S]*?);/gi)) {
    const t = ensure(m[1]);
    const body = m[2];
      // `comment` is a real column in several domain tables; only the table-level COMMENT clause
    // (outside a column definition) is ignored by the line-shape parser.
    for (const a of body.matchAll(/ADD\s+(?:COLUMN\s+)?[`"']?(\w+)[`"']?/gi)) mig.get(t).add(a[1].toLowerCase());
    for (const a of body.matchAll(/\bCHANGE\s+(?:COLUMN\s+)?[`"']?(\w+)[`"']?\s+[`"']?(\w+)[`"']?/gi)) {
      mig.get(t).delete(a[1].toLowerCase()); mig.get(t).add(a[2].toLowerCase());
    }
    for (const a of body.matchAll(/\bRENAME\s+COLUMN\s+[`"']?(\w+)[`"']?\s+TO\s+[`"']?(\w+)[`"']?/gi)) {
      mig.get(t).delete(a[1].toLowerCase()); mig.get(t).add(a[2].toLowerCase());
    }
    for (const a of body.matchAll(/\bDROP\s+(?:COLUMN\s+)?[`"']?(\w+)[`"']?/gi)) mig.get(t).delete(a[1].toLowerCase());
  }
}

// Bảng do CHÍNH hệ thống quản lý phiên bản sinh ra, không phải bảng nghiệp vụ ⇒ không tính là lệch.
const SYSTEM_TABLES = new Set(["flyway_schema_history", "schema_version", "drizzle_migrations"]);

const liveCols = [...live.values()].reduce((s, v) => s + v.size, 0);
const migCols = [...mig.values()].reduce((s, v) => s + v.size, 0);
let removedCols = 0;
for (const t of SYSTEM_TABLES) { removedCols += live.get(t)?.size ?? 0; live.delete(t); }
console.log(`ĐANG CHẠY   : ${live.size} bảng nghiệp vụ · ${liveCols - removedCols} cột `
  + `(đã trừ ${SYSTEM_TABLES.size} bảng sổ sách: ${removedCols} cột)`);
console.log(`MIGRATION   : ${mig.size} bảng · ${migCols} cột\n`);

let problems = 0;

const onlyLive = [...live.keys()].filter((t) => !mig.has(t)).sort();
if (onlyLive.length) {
  problems += onlyLive.length;
  console.log(`── BẢNG CHỈ CÓ Ở DB ĐANG CHẠY, KHÔNG có trong tệp migration (${onlyLive.length}) ──`);
  for (const t of onlyLive) console.log(`  ${t}  (${live.get(t).size} cột)`);
  console.log("");
}

const onlyMig = [...mig.keys()].filter((t) => !live.has(t)).sort();
if (onlyMig.length) {
  problems += onlyMig.length;
  console.log(`── BẢNG CHỈ CÓ TRONG TỆP MIGRATION, KHÔNG có ở DB đang chạy (${onlyMig.length}) ──`);
  for (const t of onlyMig) console.log(`  ${t}  (${mig.get(t).size} cột)`);
  console.log("");
}

const both = [...live.keys()].filter((t) => mig.has(t)).sort();
const colDrift = [];
for (const t of both) {
  const a = live.get(t), b = mig.get(t);
  const missInMig = [...a].filter((c) => !b.has(c)).sort();
  const missInLive = [...b].filter((c) => !a.has(c)).sort();
  if (missInMig.length || missInLive.length) colDrift.push({ t, missInMig, missInLive });
}
if (colDrift.length) {
  console.log(`── LỆCH CỘT trong các bảng có ở CẢ HAI (${colDrift.length} bảng) ──`);
  for (const d of colDrift) {
    problems += d.missInMig.length + d.missInLive.length;
    if (d.missInMig.length) console.log(`  ${d.t}: ĐANG CHẠY có mà migration thiếu -> ${d.missInMig.join(", ")}`);
    if (d.missInLive.length) console.log(`  ${d.t}: MIGRATION có mà đang chạy thiếu -> ${d.missInLive.join(", ")}`);
  }
  console.log("");
}

if (!problems) {
  console.log("KẾT LUẬN: tệp migration TÁI LẬP ĐƯỢC DB đang chạy (0 lệch). ✅");
  process.exitCode = 0;
} else {
  console.log(`KẾT LUẬN: có ${problems} điểm lệch ⇒ tệp migration KHÔNG tái lập được DB đang chạy. ⚠`);
  console.log("Hệ quả: cài mới từ migration sẽ ra lược đồ khác bản đang chạy. Ghi nhận, KHÔNG tự sửa lược đồ.");
  process.exitCode = 1;
}
