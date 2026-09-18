// [PHASE 0B · S-05] Khảo sát endpoint `/api/files`: định nghĩa ở đâu (Java + JS) và HIỆN có kiểm quyền gì.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const walk = (dir, out = []) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { if (!/node_modules|target|\.next/.test(p)) walk(p, out); continue; }
    if (/\.(java|mjs|ts|tsx)$/.test(name)) out.push(p);
  }
  return out;
};

const files = [...walk("java-backend"), ...walk("scripts"), ...walk("app")];
const hits = [];
for (const f of files) {
  const lines = readFileSync(f, "utf8").split("\n");
  lines.forEach((l, i) => {
    if (/api\/files|\/files\b/.test(l) && /Mapping|route|action|fetch|case "/.test(l)) hits.push({ f, i: i + 1, l: l.trim().slice(0, 165) });
  });
}
console.log(`=== nơi định nghĩa/gọi /api/files (${hits.length} chỗ) ===`);
for (const h of hits.slice(0, 14)) console.log(`${h.f.replace(process.cwd() + "\\", "")}:${h.i}\n    ${h.l}`);
if (!hits.length) console.log("  (không thấy)");

console.log("\n=== Java: có controller cho file? ===");
const ctrls = files.filter((f) => /Controller\.java$/.test(f));
for (const c of ctrls) {
  const t = readFileSync(c, "utf8");
  if (/files|File/.test(t)) console.log("  " + c.replace(process.cwd() + "\\", "") + (/RequestMapping\(/.test(t) ? "  ← có @RequestMapping" : ""));
}
