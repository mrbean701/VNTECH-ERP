// Q5 — khảo sát tên vai trò `thuky` trước khi sửa: SQLite + nguồn migration sinh ra tên dài.
import { DatabaseSync } from "node:sqlite";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const db = new DatabaseSync(".local-data/warehouse.sqlite");
console.log("=== SQLite role_catalog (thuky) ===");
for (const r of db.prepare("SELECT code, name, default_organization_unit_id FROM role_catalog WHERE code = ?").all("thuky")) {
  console.log(`  code=${r.code} · name=${r.name} · orgUnit=${r.default_organization_unit_id}`);
}
console.log("=== SQLite organization_units liên quan ===");
for (const r of db.prepare("SELECT id, code, name FROM organization_units").all()) console.log(`  ${r.id} · ${r.code} · ${r.name}`);
db.close();

const LONG = "Trưởng phòng Hành chính Pháp chế";
console.log(`\n=== Nguồn sinh ra tên DÀI ("${LONG}") ===`);
const dirs = ["drizzle", "java-backend/src/main/resources/db/migration", "db"];
for (const dir of dirs) {
  let names = [];
  try { names = readdirSync(dir); } catch { continue; }
  for (const name of names) {
    const p = join(dir, name);
    if (!statSync(p).isFile()) continue;
    const text = readFileSync(p, "utf8");
    if (text.includes(LONG) || /thuky/i.test(text)) {
      const hits = text.split("\n").map((l, i) => [i + 1, l]).filter(([, l]) => l.includes(LONG) || /thuky/i.test(l));
      console.log(`  ${p}: ${hits.length} dòng`);
      for (const [n, l] of hits.slice(0, 6)) console.log(`     ${n}: ${l.trim().slice(0, 150)}`);
    }
  }
}
