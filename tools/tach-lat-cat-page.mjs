// U-11 — CÔNG CỤ TÁCH LÁT CẮT KHỎI `app/page.tsx` (bước 1 + bước 2).
//
// HAI CHẾ ĐỘ:
//   (A) TỰ CHỌN LÁ SẠCH (bước 1 — đã dùng):  node tools/tach-lat-cat-page.mjs --dry | (không tham số)
//       Chỉ chuyển khai báo KHÔNG JSX, KHÔNG import, KHÔNG kiểu React ⇒ tệp mới không cần import nào.
//   (B) CHỈ ĐỊNH DANH SÁCH (bước 2):        node tools/tach-lat-cat-page.mjs --move=A,B,C [--dry]
//       Cho phép khối CÓ JSX và CÓ import ⇒ công cụ **SINH DÒNG IMPORT** tương ứng trong tệp mới
//       (ánh xạ tên → module lấy từ chính các câu `import` của `page.tsx`; `ReactNode`… → `react`).
//
// NGUYÊN TẮC AN TOÀN (tự kiểm TRƯỚC KHI GHI; vi phạm ⇒ KHÔNG ghi gì):
//   Mọi tên mà khối chuyển đi tham chiếu phải thuộc một trong:
//     (a) các khối CÙNG được chuyển trong lượt này,
//     (b) tên có sẵn của JS/trình duyệt,
//     (c) tên đến từ `import` của `page.tsx`  → công cụ sinh lại import đó ở tệp mới,
//     (d) kiểu của React (`ReactNode`…)        → công cụ sinh `import type { … } from "react"`.
//   Nếu còn tên nào KHÁC ⇒ **từ chối chuyển khối đó** và in rõ tên (tránh import vòng / thiếu import).
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PAGE = join(root, "app", "page.tsx");
// `@/*` trỏ về GỐC dự án (`tsconfig.json`: `"@/*": ["./*"]`) ⇒ ghi vào `lib/` ở GỐC (không phải `app/lib/`).
// `--out=<đường dẫn tương đối>` cho phép tách MÀN ra tệp riêng (bước 3 của U-11), ví dụ:
//   node tools/tach-lat-cat-page.mjs --move=SealScreen --out=app/screens/SealScreen.tsx
const OUT_ARG = (process.argv.find((a) => a.startsWith("--out=")) || "").slice(6);
const OUT = OUT_ARG ? join(root, OUT_ARG.replace(/[\\/]/g, "/")) : join(root, "lib", "ui-shared.tsx");
const TARGET = OUT_ARG ? OUT_ARG.replace(/\\/g, "/") : "lib/ui-shared.tsx";
// Câu import chèn ngược vào `page.tsx` trỏ tới tệp mới (mặc định suy ra từ `--out`).
const BACK_SPEC = (process.argv.find((a) => a.startsWith("--back=")) || "").slice(7)
  || (OUT_ARG ? "@/" + OUT_ARG.replace(/\\/g, "/").replace(/\.tsx?$/, "") : "@/lib/ui-shared");
const DRY = process.argv.includes("--dry");
const MOVE_ARG = (process.argv.find((a) => a.startsWith("--move=")) || "").slice(7);

const BUILTINS = new Set([
  "Date", "Math", "Number", "String", "Boolean", "JSON", "Object", "Array", "Intl", "RegExp",
  "Map", "Set", "Promise", "console", "window", "document", "undefined", "null", "true", "false",
  "NaN", "Infinity", "parseInt", "parseFloat", "isNaN", "encodeURIComponent", "decodeURIComponent",
  "setTimeout", "clearTimeout", "localStorage", "sessionStorage", "alert", "fetch", "CSSProperties",
]);
const REACT_TYPES = new Set([
  "ReactNode", "ReactElement", "CSSProperties", "FormEvent", "ChangeEvent", "MouseEvent",
  "KeyboardEvent", "Dispatch", "SetStateAction", "RefObject", "ReactPortal", "FC",
]);
const KEYWORDS = new Set([
  "function", "const", "let", "var", "return", "if", "else", "for", "while", "do", "switch", "case",
  "break", "continue", "new", "typeof", "instanceof", "in", "of", "class", "extends", "super", "this",
  "try", "catch", "finally", "throw", "delete", "void", "yield", "await", "async", "default", "export",
  "import", "from", "as", "type", "interface", "enum", "implements", "public", "private", "protected",
  "readonly", "static", "abstract", "declare", "namespace", "module", "satisfies", "keyof", "infer",
  "string", "number", "boolean", "any", "unknown", "never", "object", "symbol", "bigint",
  "Record", "Partial", "Readonly", "Pick", "Omit", "ArrayLike",
]);

const src = readFileSync(PAGE, "utf8");
const lines = src.split(/\r?\n/);

// ---- 1. Khai báo top-level (mở rộng lên trên để kéo theo chú thích liền trên) ----
const decls = [];
const rx = /^(?:export\s+)?(?:async\s+)?(function|const|type|interface)\s+([A-Za-z_$][\w$]*)/;
for (let i = 0; i < lines.length; i++) {
  const m = lines[i].match(rx);
  if (m) decls.push({ kind: m[1], name: m[2], line: i + 1 });
}
for (let i = 0; i < decls.length; i++) {
  decls[i].end = i + 1 < decls.length ? decls[i + 1].line - 1 : lines.length;
}
for (const d of decls) {
  let s = d.line;
  while (s - 1 >= 1 && /^\s*(\/\/|\/\*|\*|\*\/)/.test(lines[s - 2])) s--;
  d.line = s;
  d.body = lines.slice(d.line - 1, d.end).join("\n");
  d.refs = new Set([...d.body.matchAll(/([A-Za-z_$][\w$]*)/g)].map((m) => m[1]).filter((n) => !KEYWORDS.has(n) && !BUILTINS.has(n)));
}
const topNames = new Set(decls.map((d) => d.name));
const byName = new Map(decls.map((d) => [d.name, d]));

// ---- 2. Ánh xạ import của page.tsx (gộp cả câu import nhiều dòng) ----
const importMap = new Map(); // tên -> { spec, isType }
{
  let i = 0;
  while (i < lines.length) {
    if (!/^import\b/.test(lines[i])) { i++; continue; }
    let stmt = lines[i], j = i;
    while (!/from\s+["']/.test(stmt) && !/^import\s+["']/.test(stmt) && j + 1 < lines.length) { j++; stmt += " " + lines[j]; }
    const m = stmt.match(/^import\s+(?:type\s+)?\{([\s\S]*?)\}\s+from\s+["']([^"']+)["']/);
    if (m) {
      const stmtIsType = /^import\s+type\s+\{/.test(stmt);
      for (const raw of m[1].split(",")) {
        const t = raw.trim();
        if (!t) continue;
        const isType = stmtIsType || /^type\s+/.test(t);
        const name = t.replace(/^type\s+/, "").split(/\s+as\s+/).pop().trim();
        if (name) importMap.set(name, { spec: m[2], isType });
      }
    }
    i = j + 1;
  }
}
console.log(`Khai báo top-level: ${decls.length} · tên từ import: ${importMap.size}`);

// ---- 3. Chọn khối cần chuyển ----
let moving;
if (MOVE_ARG) {
  moving = MOVE_ARG.split(",").map((s) => s.trim()).filter(Boolean).map((n) => byName.get(n)).filter(Boolean);
  const missing = MOVE_ARG.split(",").map((s) => s.trim()).filter((n) => n && !byName.has(n));
  if (missing.length) throw new Error(`Không tìm thấy khai báo: ${missing.join(", ")}`);
} else {
  moving = decls.filter((d) => ![...d.refs].some((r) => topNames.has(r) && r !== d.name)
    && !/(^|[^\w])<[a-zA-Z][\w.-]*([\s/>]|$)/.test(d.body.replace(/=>/g, ""))
    && ![...d.refs].some((r) => importMap.has(r) || REACT_TYPES.has(r)));
}

const movingNames = new Set(moving.map((d) => d.name));
// Kiểm an toàn — CHỈ hỏi đúng câu cần hỏi: khối chuyển đi có tham chiếu **thứ gì NẰM NGOÀI nó** không?
//   • khai báo top-level của `page.tsx` mà KHÔNG được chuyển  ⇒ CHẶN (sẽ tạo import vòng).
//   • tên đến từ `import`                                     ⇒ OK, công cụ sinh lại import ở tệp mới.
//   • kiểu của React                                          ⇒ OK, sinh `import type … from "react"`.
//   • mọi tên khác (biến cục bộ, tham số, khoá object, tên thuộc tính, dữ liệu SVG trong chuỗi…)
//     ⇒ KHÔNG LIÊN QUAN (nằm trong chính khối đó) — nếu bắt cả những tên này thì cổng báo động giả
//       hàng trăm dòng (đã xảy ra thật ở lượt chạy thử đầu: `NavIcon` bị buộc tội vì dữ liệu path SVG).
const problems = [];
for (const d of moving) {
  const bad = [...d.refs].filter((r) => topNames.has(r) && r !== d.name && !movingNames.has(r));
  if (bad.length) problems.push(`${d.name}: phụ thuộc khối KHÔNG được chuyển → ${bad.join(", ")}`);
}
console.log(`\nKhối sẽ chuyển (${moving.length}): ${moving.map((d) => `${d.name}(${d.end - d.line + 1}d)`).join(", ")}`);
if (problems.length) {
  console.log("\nTỪ CHỐI GHI — lý do:");
  for (const p of problems) console.log("   • " + p);
  process.exit(1);
}

const movedLines = moving.reduce((s, d) => s + (d.end - d.line + 1), 0);
console.log(`Tổng dòng sẽ chuyển: ${movedLines} · page.tsx ${lines.length} → ${lines.length - movedLines}`);
if (DRY) { console.log("\n[--dry] Không ghi gì."); process.exit(0); }

// ---- 4. Sinh import cho tệp mới ----
const need = new Map(); // spec -> { values:Set, types:Set }
const add = (spec, name, isType) => {
  if (!need.has(spec)) need.set(spec, { values: new Set(), types: new Set() });
  (isType ? need.get(spec).types : need.get(spec).values).add(name);
};
// Tên đã nằm CHÍNH TRONG module đích (lô 1 hoặc cùng lô này) ⇒ KHÔNG được sinh import cho nó.
// ⚠️ Lỗi đã gặp thật: `format`/`NAV_ICON_TYPE`/`Row`… đã chuyển sang module ở lô 1 nhưng vẫn còn trong
// danh sách `import` của `page.tsx` ⇒ công cụ sinh `import … from "@/lib/ui-shared"` NGAY TRONG chính
// `lib/ui-shared.tsx` ⇒ `tsc` báo `TS2440: Import declaration conflicts with local declaration`.
const selfNames = new Set(movingNames);
try {
  const raw = readFileSync(OUT, "utf8");
  for (const m of raw.matchAll(/^(?:async\s+)?(function|const|type|interface)\s+([A-Za-z_$][\w$]*)/gm)) selfNames.add(m[2]);
} catch { /* chạy lần đầu */ }

for (const d of moving) for (const r of d.refs) {
  if (topNames.has(r) || BUILTINS.has(r) || selfNames.has(r)) continue;
  const info = importMap.get(r);
  if (info) add(info.spec, r, info.isType);
  else if (REACT_TYPES.has(r)) add("react", r, true);
  // tên khác (cục bộ/tham số/khoá object/thuộc tính) ⇒ không phải import
}
const importLines = [...need.entries()].sort((a, b) => a[0].localeCompare(b[0])).flatMap(([spec, g]) => {
  const out = [];
  if (g.values.size) out.push(`import { ${[...g.values].sort().join(", ")} } from "${spec}";`);
  if (g.types.size) out.push(`import type { ${[...g.types].sort().join(", ")} } from "${spec}";`);
  return out;
});

// ---- 5. Ghi tệp ----
const cut = new Set();
const blocks = [];
for (const d of moving) {
  for (let i = d.line; i <= d.end; i++) cut.add(i);
  blocks.push(lines.slice(d.line - 1, d.end).join("\n"));
}
const kept = lines.filter((_, idx) => !cut.has(idx + 1));

let lastImport = -1, inImport = false;
for (let i = 0; i < kept.length; i++) {
  const l = kept[i];
  if (!inImport && /^import\b/.test(l)) {
    inImport = true;
    if (/from\s+["']/.test(l) || /^import\s+["']/.test(l)) { inImport = false; lastImport = i; }
    continue;
  }
  if (inImport && /from\s+["']/.test(l)) { inImport = false; lastImport = i; }
}
if (lastImport < 0) throw new Error("Không tìm thấy câu import nào hoàn chỉnh trong page.tsx");
const typeNames = moving.filter((d) => d.kind === "type" || d.kind === "interface").map((d) => d.name).sort();
const valueNames = moving.filter((d) => d.kind !== "type" && d.kind !== "interface").map((d) => d.name).sort();
const backImports = [];
if (valueNames.length) backImports.push(`import { ${valueNames.join(", ")} } from "${BACK_SPEC}";`);
if (typeNames.length) backImports.push(`import type { ${typeNames.join(", ")} } from "${BACK_SPEC}";`);
kept.splice(lastImport + 1, 0, ...backImports);

const header = [
  "// PHASE 1 (U-11) — MODULE DÙNG CHUNG TÁCH KHỎI `app/page.tsx`.",
  "//",
  "// Vì sao tách: `app/page.tsx` là MỘT tệp khổng lồ (hơn 4.000 dòng, hơn 250 khai báo top-level).",
  "// Thứ tự cắt ĐÚNG (đã ghi ở `docs/agent-progress/U14-U11-KHAO-SAT.md` mục 2): tách HELPER DÙNG CHUNG trước",
  "// (gỡ chặn IMPORT VÒNG), rồi mới tách từng màn.",
  "//",
  "// ⚠️ ĐIỀU KIỆN AN TOÀN (do `tools/tach-lat-cat-page.mjs` tự kiểm TRƯỚC KHI GHI): mọi tên mà các khối ở đây",
  "// tham chiếu phải thuộc (a) khối cùng nằm trong tệp này, (b) tên có sẵn của JS, (c) tên đến từ `import` của",
  "// `page.tsx` — công cụ SINH LẠI import đó ở đây, hoặc (d) kiểu của React ⇒ `import type … from \"react\"`.",
  "// Không còn tên nào khác ⇒ KHÔNG thể tạo import vòng.",
  "",
  ...importLines,
  "",
].join("\n");

// Giữ lại phần đã có trong tệp (khi chạy lần 2+): cắt từ DÒNG KHAI BÁO ĐẦU TIÊN đến TRƯỚC khối `export`.
// ⚠️ Không dùng phép cắt chuỗi mò (`indexOf("\n\n", …)`) — phải cắt theo MỐC CÚ PHÁP rõ ràng.
let existingText = "";
let existingNames = [];
try {
  const raw = readFileSync(OUT, "utf8");
  const rawLines = raw.split(/\r?\n/);
  const firstDecl = rawLines.findIndex((l) => /^(?:export\s+)?(?:async\s+)?(function|const|type|interface)\s+[A-Za-z_$]/.test(l));
  const exportAt = rawLines.findIndex((l) => /^export\s+(type\s+)?\{/.test(l));
  if (firstDecl >= 0) {
    existingText = rawLines.slice(firstDecl, exportAt > firstDecl ? exportAt : rawLines.length).join("\n").trim();
    existingNames = [...existingText.matchAll(/^(?:async\s+)?(function|const|type|interface)\s+([A-Za-z_$][\w$]*)/gm)].map((m) => m[2]);
  }
} catch { /* chạy lần đầu: chưa có tệp */ }
const keptOldNames = existingNames.filter((n) => !movingNames.has(n));
console.log(`Tệp ${TARGET} hiện có: ${existingNames.length} khối (${existingText ? existingText.split(/\r?\n/).length : 0} dòng)`);

const allValueNames = [...new Set([
  ...valueNames,
  ...keptOldNames.filter((n) => !existingText.includes(`type ${n} `) && !existingText.includes(`type ${n}=`)),
])].sort();
const allTypeNames = [...new Set([
  ...typeNames,
  ...keptOldNames.filter((n) => existingText.includes(`type ${n} `) || existingText.includes(`type ${n}=`) || existingText.includes(`interface ${n} `)),
])].sort();

mkdirSync(dirname(OUT), { recursive: true });
const trailer = [
  "",
  allValueNames.length ? `export {\n  ${allValueNames.join(",\n  ")},\n};` : "",
  allTypeNames.length ? `export type {\n  ${allTypeNames.join(",\n  ")},\n};` : "",
  "",
].filter(Boolean).join("\n");

const bodyParts = [existingText, blocks.join("\n\n")].filter(Boolean);
writeFileSync(OUT, header + bodyParts.join("\n\n") + "\n" + trailer, "utf8");
writeFileSync(PAGE, kept.join("\n"), "utf8");
console.log(`\nĐÃ GHI: ${TARGET} (giữ ${keptOldNames.length} khối cũ + thêm ${blocks.length} khối · ${importLines.length} câu import sinh tự động) · page.tsx ${lines.length} → ${kept.length}`);
for (const l of importLines) console.log("   " + l);
