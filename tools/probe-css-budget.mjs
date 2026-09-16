// GĐ0 — CỔNG CHẶN NỢ CSS
//
// Đếm các chỉ số nợ kỹ thuật của tầng CSS và CHẶN TRẦN: chỉ được giảm, không được tăng.
// Đây là thước đo cho GĐ2 (viết lại tầng CSS có cấu trúc).
//
//   node tools/probe-css-budget.mjs            # kiểm tra so với trần
//   node tools/probe-css-budget.mjs --init     # ghi lại trần hiện tại làm mốc
//   node tools/probe-css-budget.mjs --report   # chỉ in bảng, không chặn (exit 0)
//
// Trần lưu ở tools/css-budget.json — có thể sửa tay khi cố ý siết chặt.
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BUDGET_FILE = join(ROOT, "tools", "css-budget.json");
const APP_DIR = join(ROOT, "app");

const args = process.argv.slice(2);
const MODE_INIT = args.includes("--init");
const MODE_REPORT = args.includes("--report");

// Sàn cỡ chữ: 10px là mức nhỏ nhất còn đọc được trên màn hình mật độ cao.
// Xem docs/22 GĐ1 mục 3 — mọi cỡ nhỏ hơn đều bị coi là nợ.
const FONT_FLOOR_PX = 10;

// ---------- Thu thập tệp CSS ----------
function walkCss(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (["node_modules", "dist", ".next", ".git"].includes(name)) continue;
      walkCss(p, acc);
    } else if (name.endsWith(".css")) acc.push(p);
  }
  return acc;
}
const cssFiles = walkCss(APP_DIR).sort();

// TỆP SỔ TOKEN: chỉ khai báo biến thiết kế, KHÔNG tạo quy tắc tạo hình nào.
// Sổ token lớn lên là từ vựng thiết kế phong phú hơn — đó không phải nợ CSS.
// Vì vậy không tính số dòng của nó vào trần `lines` (vẫn báo riêng để theo dõi).
const LEDGER_FILES = new Set(["app/styles/tokens.css"]);

// Đếm dòng THẬT: bỏ phần tử rỗng sinh ra do ký tự xuống dòng ở cuối tệp.
// (Lưu ý: `Measure-Object -Line` của PowerShell KHÔNG đếm dòng trống — đừng dùng nó.)
function countLines(text) {
  const parts = text.split(/\r?\n/);
  if (parts.length && parts[parts.length - 1] === "") parts.pop();
  return parts.length;
}

// ---------- Bóc các khối quy tắc ----------
// Trả về danh sách selector (chuẩn hoá) của MỌI quy tắc, kể cả lồng trong @media.
function extractSelectors(cssText) {
  const noComments = cssText.replace(/\/\*[\s\S]*?\*\//g, " ");
  const selectors = [];
  let depth = 0;
  let token = "";
  for (let i = 0; i < noComments.length; i++) {
    const ch = noComments[i];
    if (ch === "{") {
      const sel = token.trim();
      if (sel && !sel.startsWith("@")) selectors.push(sel.replace(/\s+/g, " "));
      depth++; token = "";
    } else if (ch === "}") {
      depth--; token = "";
    } else if (ch === ";" && depth === 0) {
      token = ""; // at-rule không có khối, ví dụ @charset
    } else {
      token += ch;
    }
  }
  return selectors;
}

const metrics = { files: {}, totals: {} };
let totalImportant = 0, totalLines = 0, totalBytes = 0, ledgerLines = 0;
let tableWrapOccurrences = 0, duplicateSelectors = 0, fontSizeBelowFloor = 0;
const allSelectorCount = new Map();

for (const file of cssFiles) {
  const raw = readFileSync(file, "utf8");
  const rel = relative(ROOT, file).replace(/\\/g, "/");
  const lines = countLines(raw);
  const bytes = Buffer.byteLength(raw, "utf8");
  // Đếm trên bản ĐÃ BỎ COMMENT. Nhắc tới `!important` trong ghi chú giải thích KHÔNG
  // phải là nợ — nếu tính cả comment thì mỗi lần viết tài liệu lại bị báo vượt trần.
  // (Dòng/byte vẫn tính trên bản gốc vì đó là kích thước tệp thật.)
  const text = raw.replace(/\/\*[\s\S]*?\*\//g, " ");
  const important = (text.match(/!important/g) || []).length;

  const selectors = extractSelectors(text);
  const counts = new Map();
  for (const s of selectors) {
    counts.set(s, (counts.get(s) || 0) + 1);
    allSelectorCount.set(s, (allSelectorCount.get(s) || 0) + 1);
  }
  const dups = [...counts.entries()].filter(([, n]) => n > 1);
  const dupCount = dups.reduce((a, [, n]) => a + (n - 1), 0);

  const tw = (text.match(/\.table-wrap/g) || []).length;
  const tinyFonts = [...text.matchAll(/font-size\s*:\s*([\d.]+)px/g)]
    .map((m) => Number(m[1])).filter((n) => n > 0 && n < FONT_FLOOR_PX).length;

  metrics.files[rel] = {
    lines, bytes, important, rules: selectors.length,
    duplicateSelectorBlocks: dupCount, tableWrap: tw, fontSizeBelowFloor: tinyFonts,
  };
  metrics.files[rel].topDuplicates = dups
    .sort((a, b) => b[1] - a[1]).slice(0, 6)
    .map(([s, n]) => ({ selector: s.slice(0, 70), times: n }));

  totalImportant += important; totalBytes += bytes;
  if (LEDGER_FILES.has(rel)) ledgerLines += lines; else totalLines += lines;
  tableWrapOccurrences += tw; fontSizeBelowFloor += tinyFonts;
}
duplicateSelectors = [...allSelectorCount.values()].filter((n) => n > 1).reduce((a, n) => a + (n - 1), 0);
const uniqueSelectors = allSelectorCount.size;

metrics.totals = {
  cssFiles: cssFiles.length,
  lines: totalLines,
  bytes: totalBytes,
  important: totalImportant,
  tableWrap: tableWrapOccurrences,
  uniqueSelectors,
  duplicateSelectors,
  fontSizeBelowFloor,
};

// Nguồn giao diện (để báo cáo kèm, không đặt trần)
const pagePath = join(APP_DIR, "page.tsx");
if (existsSync(pagePath)) {
  const page = readFileSync(pagePath, "utf8");
  metrics.source = {
    "app/page.tsx": {
      lines: countLines(page),
      topLevelFunctions: (page.match(/^function [A-Z]/gm) || []).length,
    },
  };
}

// ---------- In bảng ----------
console.log("═".repeat(78));
console.log("  NGÂN SÁCH CSS — VNTECH ERP");
console.log("═".repeat(78));
console.log("");
console.log("  Theo tệp:");
console.log("  " + "tệp".padEnd(30) + "dòng".padStart(8) + "!important".padStart(12) + "quy tắc".padStart(10) + "trùng".padStart(8));
for (const [rel, m] of Object.entries(metrics.files)) {
  console.log("  " + rel.padEnd(30) + String(m.lines).padStart(8) + String(m.important).padStart(12)
    + String(m.rules).padStart(10) + String(m.duplicateSelectorBlocks).padStart(8));
}
console.log("");
console.log("  Tổng hợp:");
const t = metrics.totals;
const rows = [
  ["Tổng số dòng", t.lines],
  ["Dòng sổ token (ngoài trần)", ledgerLines],
  ["Số tệp CSS", t.cssFiles],
  ["Tổng dung lượng (byte)", t.bytes],
  ["Số lần !important", t.important],
  ["Số lần .table-wrap", t.tableWrap],
  ["Selector duy nhất", t.uniqueSelectors],
  ["Selector định nghĩa trùng", t.duplicateSelectors],
  [`font-size < ${FONT_FLOOR_PX}px (dưới sàn)`, t.fontSizeBelowFloor],
];
for (const [k, v] of rows) console.log("    " + String(k).padEnd(34) + String(v).padStart(8));

if (metrics.source) {
  console.log("");
  console.log("  Nguồn giao diện:");
  for (const [f, m] of Object.entries(metrics.source)) {
    console.log("    " + f.padEnd(34) + "dòng " + String(m.lines).padStart(6) + "   hàm cấp cao " + m.topLevelFunctions);
  }
}

// ---------- Ghi trần ----------
if (MODE_INIT) {
  const budget = {
    _doc: "Trần nợ CSS VNTECH ERP. Chỉ được GIẢM. Sinh bởi tools/probe-css-budget.mjs --init.",
    _fontFloorPx: FONT_FLOOR_PX,
    ceilings: {
      important: t.important,
      tableWrap: t.tableWrap,
      duplicateSelectors: t.duplicateSelectors,
      fontSizeBelowFloor: t.fontSizeBelowFloor,
      lines: t.lines,
    },
    perFile: Object.fromEntries(Object.entries(metrics.files).map(([k, m]) => [k, {
      lines: m.lines, important: m.important, duplicateSelectorBlocks: m.duplicateSelectorBlocks,
    }])),
  };
  writeFileSync(BUDGET_FILE, JSON.stringify(budget, null, 2) + "\n", "utf8");
  console.log("");
  console.log("  ✅ Đã ghi trần vào tools/css-budget.json");
  console.log("═".repeat(78));
  process.exit(0);
}

if (MODE_REPORT) { console.log("\nKẾT LUẬN: chỉ báo cáo (--report), không chặn."); console.log("═".repeat(78)); process.exit(0); }

// ---------- So với trần ----------
if (!existsSync(BUDGET_FILE)) {
  console.log("\n⚠️  Chưa có tools/css-budget.json — chạy --init để lập mốc trước.");
  console.log("═".repeat(78));
  process.exit(1);
}
const budget = JSON.parse(readFileSync(BUDGET_FILE, "utf8"));
const checks = [
  ["important", t.important, budget.ceilings.important, "Số lần !important"],
  ["tableWrap", t.tableWrap, budget.ceilings.tableWrap, "Số lần .table-wrap"],
  ["duplicateSelectors", t.duplicateSelectors, budget.ceilings.duplicateSelectors, "Selector định nghĩa trùng"],
  ["fontSizeBelowFloor", t.fontSizeBelowFloor, budget.ceilings.fontSizeBelowFloor, `font-size < ${FONT_FLOOR_PX}px`],
  ["lines", t.lines, budget.ceilings.lines, "Tổng số dòng CSS"],
];

console.log("");
console.log("  Đối chiếu trần (chỉ được giảm):");
let violations = 0;
for (const [key, now, ceil, label] of checks) {
  const ok = now <= ceil;
  if (!ok) violations++;
  const delta = now - ceil;
  console.log(`   ${ok ? "✅" : "❌"} ${label.padEnd(32)} hiện ${String(now).padStart(6)}  trần ${String(ceil).padStart(6)}`
    + (delta > 0 ? `   VƯỢT ${delta}` : delta < 0 ? `   giảm ${-delta}` : ""));
}

// Trần theo từng tệp
const perFileViolations = [];
for (const [rel, m] of Object.entries(metrics.files)) {
  const pb = budget.perFile?.[rel];
  if (!pb) continue;
  for (const [k, label] of [["lines", "dòng"], ["important", "!important"], ["duplicateSelectorBlocks", "khối trùng"]]) {
    if (m[k] > pb[k]) perFileViolations.push(`${rel}: ${label} ${m[k]} > ${pb[k]}`);
  }
}
if (perFileViolations.length) {
  console.log("");
  console.log("  ❌ Vượt trần theo tệp:");
  for (const v of perFileViolations) console.log("     • " + v);
  violations += perFileViolations.length;
}

console.log("");
console.log("═".repeat(78));
console.log(violations === 0
  ? "KẾT LUẬN: ĐẠT ✅ — không chỉ số nào vượt trần"
  : `KẾT LUẬN: KHÔNG ĐẠT ❌ — ${violations} chỉ số vượt trần`);
console.log("═".repeat(78));
process.exit(violations === 0 ? 0 : 1);
