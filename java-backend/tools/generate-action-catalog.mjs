#!/usr/bin/env node
/**
 * VNTECH ERP — Sinh Action Catalog từ monolith JS (reference implementation).
 *
 * Đọc `scripts/system-route.mjs` (branch unity), trích:
 *   - ACTION_MODULE (action -> module)
 *   - ACTION_CAPABILITY (action -> capability)
 *   - toàn bộ nhánh `if (action === "xxx")` trong handleAction + setup/login/logout
 * Xuất ra `java-backend/ACTION_CATALOG.md` + `java-backend/ACTION_CATALOG.json`.
 *
 * ĐẶT Ở java-backend/tools — KHÔNG đặt trong scripts/ (fingerprint gate của bản JS).
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");          // VNTECH-ERP/
const javaBackend = resolve(repoRoot, "java-backend");
const sourceFile = process.argv[2] || join(repoRoot, "scripts", "system-route.mjs");

const source = readFileSync(sourceFile, "utf8");
mkdirSync(javaBackend, { recursive: true });

// ---- 1) Trích khối ACTION_MODULE = { ... }; ----
function extractObjectLiteral(name) {
  const marker = `const ${name} = {`;
  const start = source.indexOf(marker);
  if (start < 0) throw new Error(`Không tìm thấy ${name} trong ${sourceFile}`);
  let i = start + marker.length;
  let depth = 1;
  while (i < source.length && depth > 0) {
    const ch = source[i];
    if (ch === "{") depth++;
    else if (ch === "}") depth--;
    i++;
  }
  const literal = source.slice(start + marker.length - 1, i); // "{ ... }"
  // Đánh giá an toàn bằng Function — literal là cấu trúc JS thuần (không có biến bên ngoài)
  const obj = new Function(`"use strict"; return (${literal});`)();
  return obj;
}

const actionModule = extractObjectLiteral("ACTION_MODULE");
const actionCapability = extractObjectLiteral("ACTION_CAPABILITY");

// ---- 2) Quét mọi nhánh action được xử lý ----
const handled = new Set();
const regex = /if\s*\(\s*action\s*===\s*"([a-z0-9_]+)"/g;
let m;
while ((m = regex.exec(source)) !== null) handled.add(m[1]);

// ---- 3) Hợp nhất thành catalog ----
const allActions = new Set([
  ...Object.keys(actionModule),
  ...Object.keys(actionCapability),
  ...handled,
]);

// Action đã migrate sang Java (Strangler Fig) — cập nhật tools/migrated-actions.json sau mỗi slice
const migratedActions = new Set(
  JSON.parse(readFileSync(join(javaBackend, "tools", "migrated-actions.json"), "utf8")).migrated ?? []
);

const catalog = [...allActions].sort().map((action) => {
  const mod = actionModule[action];
  const cap = actionCapability[action] || null;
  const handledByDispatcher = handled.has(action);
  const moduleList = Array.isArray(mod) ? mod : mod ? [mod] : [];
  return {
    action,
    module: moduleList,
    capability: cap,
    dispatcher: handledByDispatcher,
    origin: handledByDispatcher ? "handleAction" : "reserved/catalog-only",
    migrated: migratedActions.has(action), // Java: đã port sang Java hay chưa
  };
});

const byModule = {};
for (const item of catalog) {
  for (const mod of item.module.length ? item.module : ["(unassigned)"]) {
    (byModule[mod] ??= []).push(item.action);
  }
}

// ---- 4) Xuất ----
const jsonPath = join(javaBackend, "ACTION_CATALOG.json");
writeFileSync(jsonPath, JSON.stringify({ generatedFrom: sourceFile, count: catalog.length, actions: catalog }, null, 2));

const lines = [];
lines.push("# ACTION CATALOG — VNTECH ERP (backend Java mục tiêu)");
lines.push("");
lines.push(`- Nguồn: \`scripts/system-route.mjs\` (monolith JS — reference implementation, branch \`unity\`)`);
lines.push(`- Tổng action: **${catalog.length}** (write dispatcher + reserved)`);
lines.push(`- Cột \`migrated\` = false: action chưa được port sang Java (Strangler Fig — gateway sẽ proxy sang JS legacy).`);
lines.push("");
lines.push("## Theo module");
lines.push("");
const moduleNames = Object.keys(byModule).sort();
for (const mod of moduleNames) {
  lines.push(`### ${mod} (${byModule[mod].length})`);
  lines.push("");
  for (const a of byModule[mod]) {
    const cap = catalog.find((c) => c.action === a)?.capability || "";
    lines.push(`- \`${a}\` — ${cap}`);
  }
  lines.push("");
}
lines.push("## Toàn bộ (bảng)");
lines.push("");
lines.push("| action | module | capability | dispatcher | migrated |");
lines.push("|---|---|---|---|---|");
for (const item of catalog) {
  lines.push(`| ${item.action} | ${item.module.join(", ")} | ${item.capability || ""} | ${item.dispatcher ? "✅" : ""} | ${item.migrated ? "✅" : ""} |`);
}

const mdPath = join(javaBackend, "ACTION_CATALOG.md");
writeFileSync(mdPath, lines.join("\n"));
console.log(`Action Catalog: ${catalog.length} actions`);
console.log(`  -> ${mdPath}`);
console.log(`  -> ${jsonPath}`);