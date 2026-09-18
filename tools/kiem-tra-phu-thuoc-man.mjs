import { readFileSync } from "node:fs";
// Với mỗi MÀN ứng viên, liệt kê phụ thuộc top-level còn lại trong `page.tsx` (chưa nằm ở ui-shared).
const page = readFileSync("app/page.tsx", "utf8");
const shared = readFileSync("lib/ui-shared.tsx", "utf8");
const lines = page.split(/\r?\n/);

const decls = [];
const rx = /^(?:export\s+)?(?:async\s+)?(function|const|type|interface)\s+([A-Za-z_$][\w$]*)/;
for (let i = 0; i < lines.length; i++) {
  const m = lines[i].match(rx);
  if (m) decls.push({ kind: m[1], name: m[2], line: i + 1 });
}
for (let i = 0; i < decls.length; i++) {
  decls[i].end = i + 1 < decls.length ? decls[i + 1].line - 1 : lines.length;
  decls[i].body = lines.slice(decls[i].line - 1, decls[i].end).join("\n");
}
const topNames = new Set(decls.map((d) => d.name));
const sharedNames = new Set([...shared.matchAll(/(?:function|const|type|interface)\s+([A-Za-z_$][\w$]*)/g)].map((m) => m[1]));

const imported = new Set();
for (const line of lines) {
  const m = line.match(/^import\s+(?:type\s+)?\{([^}]+)\}\s+from/);
  if (m) for (const raw of m[1].split(",")) {
    const n = raw.replace(/\btype\s+/, "").trim().split(/\s+as\s+/).pop().trim();
    if (n) imported.add(n);
  }
}

const CANDIDATES = process.argv.slice(2);
for (const name of CANDIDATES) {
  const d = decls.find((x) => x.name === name);
  if (!d) { console.log(`\n== ${name}: KHONG TIM THAY ==`); continue; }
  const refs = new Set([...d.body.matchAll(/([A-Za-z_$][\w$]*)/g)].map((m) => m[1]));
  const depsTop = [...refs].filter((r) => topNames.has(r) && r !== name);
  const depsShared = depsTop.filter((r) => sharedNames.has(r));
  const depsLeft = depsTop.filter((r) => !sharedNames.has(r));
  const depsImport = [...refs].filter((r) => imported.has(r));
  console.log(`\n== ${name} (dong ${d.line}-${d.end}, ${d.end - d.line + 1} dong) ==`);
  console.log(`   da o ui-shared (${depsShared.length}): ${depsShared.join(", ") || "—"}`);
  console.log(`   CON O page.tsx (${depsLeft.length}): ${depsLeft.join(", ") || "—"}`);
  console.log(`   tu import (${depsImport.length}): ${depsImport.slice(0, 12).join(", ") || "—"}`);
}
