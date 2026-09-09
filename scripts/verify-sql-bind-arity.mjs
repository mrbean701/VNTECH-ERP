import { readFile, readdir } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const scanRoots = ["scripts", "app/api"];

async function collect(directory) {
  const out = [];
  let entries;
  try { entries = await readdir(directory, { withFileTypes: true }); }
  catch (error) { if (error?.code === "ENOENT") return out; throw error; }
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) out.push(...await collect(path));
    else if (/\.(?:mjs|js|ts|tsx)$/.test(entry.name) && basename(path) !== "verify-sql-bind-arity.mjs") out.push(path);
  }
  return out;
}

function scanString(source, start) {
  const quote = source[start];
  let dynamic = false;
  for (let i = start + 1; i < source.length; i += 1) {
    if (source[i] === "\\") { i += 1; continue; }
    if (quote === "`" && source[i] === "$" && source[i + 1] === "{") dynamic = true;
    if (source[i] === quote) return { end: i, value: source.slice(start + 1, i), dynamic };
  }
  return null;
}

function scanParen(source, open) {
  let depth = 1, quote = "", escaped = false;
  for (let i = open + 1; i < source.length; i += 1) {
    const ch = source[i];
    if (quote) {
      if (escaped) { escaped = false; continue; }
      if (ch === "\\") { escaped = true; continue; }
      if (ch === quote) quote = "";
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") { quote = ch; continue; }
    if (ch === "(") depth += 1;
    else if (ch === ")") { depth -= 1; if (depth === 0) return i; }
  }
  return -1;
}

function countArguments(source) {
  if (!source.trim()) return 0;
  let count = 1, depth = 0, quote = "", escaped = false;
  for (const ch of source) {
    if (quote) {
      if (escaped) { escaped = false; continue; }
      if (ch === "\\") { escaped = true; continue; }
      if (ch === quote) quote = "";
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") { quote = ch; continue; }
    if (ch === "(" || ch === "[" || ch === "{") depth += 1;
    else if (ch === ")" || ch === "]" || ch === "}") depth -= 1;
    else if (ch === "," && depth === 0) count += 1;
  }
  return count;
}

const files = [];
for (const relative of scanRoots) files.push(...await collect(join(root, relative)));
let checked = 0, skippedDynamic = 0;
const mismatches = [];

for (const file of files) {
  const source = await readFile(file, "utf8");
  let cursor = 0;
  while ((cursor = source.indexOf(".prepare(", cursor)) >= 0) {
    let sqlStart = cursor + ".prepare(".length;
    while (/\s/.test(source[sqlStart])) sqlStart += 1;
    if (!["`", "'", '"'].includes(source[sqlStart])) { cursor = sqlStart + 1; continue; }
    const sqlString = scanString(source, sqlStart);
    if (!sqlString) break;
    let chain = sqlString.end + 1;
    while (/\s/.test(source[chain])) chain += 1;
    if (source[chain] !== ")") { cursor = chain + 1; continue; }
    chain += 1;
    while (/\s/.test(source[chain])) chain += 1;
    if (!source.startsWith(".bind(", chain)) { cursor = chain + 1; continue; }
    const bindOpen = chain + ".bind".length;
    const bindEnd = scanParen(source, bindOpen);
    if (bindEnd < 0) break;
    const args = source.slice(bindOpen + 1, bindEnd);
    const line = source.slice(0, cursor).split("\n").length;
    if (sqlString.dynamic || args.includes("...")) skippedDynamic += 1;
    else {
      checked += 1;
      const placeholders = (sqlString.value.match(/\?/g) || []).length;
      const bindings = countArguments(args);
      if (placeholders !== bindings) mismatches.push({ file: file.slice(root.length + 1), line, placeholders, bindings });
    }
    cursor = bindEnd + 1;
  }
}

if (mismatches.length) {
  for (const row of mismatches) console.error(`SQL bind arity sai: ${row.file}:${row.line} · placeholders=${row.placeholders} · bindings=${row.bindings}`);
  console.error(`SQL bind arity preflight: KHÔNG ĐẠT · ${mismatches.length} lỗi.`);
  process.exit(1);
}
console.log(`SQL bind arity preflight: ĐẠT · ${checked} literal statements · ${skippedDynamic} dynamic statements do runtime regression kiểm soát.`);
