#!/usr/bin/env node
/**
 * Đo lường: JS (drizzle/*.sql) seed dữ liệu nền vào những bảng nào, bao nhiêu lệnh,
 * và so sánh với V2__system_seed.sql của Java — để biết chính xác KHOẢNG TRỐNG SEED.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const dir = "drizzle";
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();

const byTable = new Map();
let totalInserts = 0;

for (const f of files) {
  const sql = readFileSync(join(dir, f), "utf8");
  // Bắt: INSERT [OR IGNORE] INTO `table` ...
  const re = /INSERT\s+(?:OR\s+IGNORE\s+)?INTO\s+`?([a-z_][a-z0-9_]*)`?/gi;
  for (const m of sql.matchAll(re)) {
    const t = m[1].toLowerCase();
    byTable.set(t, (byTable.get(t) || 0) + 1);
    totalInserts++;
  }
}

console.log(`═══ JS (drizzle/) — ${files.length} file migration ═══`);
console.log(`   tổng lệnh INSERT: ${totalInserts}`);
console.log(`   số bảng được seed: ${byTable.size}\n`);

// Java V2 seed
const v2 = readFileSync("java-backend/infrastructure/src/main/resources/db/migration/V2__system_seed.sql", "utf8");
const javaTables = new Set();
for (const m of v2.matchAll(/INSERT\s+(?:IGNORE\s+)?INTO\s+`?([a-z_][a-z0-9_]*)`?/gi)) {
  javaTables.add(m[1].toLowerCase());
}
console.log(`═══ Java V2__system_seed.sql ═══`);
console.log(`   số bảng được seed: ${javaTables.size} → ${[...javaTables].join(", ")}\n`);

// Bảng nào JS seed mà Java KHÔNG
const missing = [...byTable.keys()].filter((t) => !javaTables.has(t)).sort();
console.log(`═══ KHOẢNG TRỐNG: ${missing.length} bảng JS seed mà Java CHƯA seed ═══`);
for (const t of missing) console.log(`   ${String(byTable.get(t)).padStart(3)} lệnh  ${t}`);
