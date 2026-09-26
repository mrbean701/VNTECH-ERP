// Q4 — KIỂM `can_create` CÓ THỰC SỰ ĐƯỢC DÙNG KHÔNG (nếu không, việc cấp quyền chỉ là dữ liệu chết).
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

const java = readFileSync("java-backend/application/src/main/java/com/vntech/erp/application/rbac/ActionRbacRegistry.java", "utf8");
const entries = [...java.matchAll(/Map\.entry\(\s*"([a-z_0-9]+)"\s*,\s*"([A-Za-z]+)"\s*\)/g)].map((m) => [m[1], m[2]]);
const byCap = {};
for (const [, cap] of entries) byCap[cap] = (byCap[cap] || 0) + 1;
console.log("=== Java ActionRbacRegistry: action → capability ===");
console.log(`  tổng mục khớp mẫu: ${entries.length}`);
for (const k of Object.keys(byCap).sort()) console.log(`   ${k} = ${byCap[k]}`);
const createCap = entries.filter(([, cap]) => /create/i.test(cap)).map(([a]) => a);
console.log(`  action gắn capability 'create': ${createCap.length ? createCap.join(", ") : "KHÔNG CÓ"}`);

const js = readFileSync("scripts/system-route.mjs", "utf8");
console.log("\n=== JS: các chỗ dùng capability ===");
for (const needle of ["canUseModule(", "canCreate", "can_create"]) {
  console.log(`  "${needle}": ${js.split(needle).length - 1} lần`);
}
const lines = js.split("\n");
lines.forEach((l, i) => {
  if (/canUseModule\(/.test(l)) console.log(`   dòng ${i + 1}: ${l.trim().slice(0, 160)}`);
});

const db = new DatabaseSync(".local-data/warehouse.sqlite");
console.log("\n=== SQLite department_module_permissions ===");
console.log(`  số dòng = ${db.prepare("SELECT COUNT(*) AS n FROM department_module_permissions").get().n}`);
db.close();
