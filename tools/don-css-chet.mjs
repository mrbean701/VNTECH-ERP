// DỌN CSS CHẾT (KP #89 + KP #96 + các lớp chết do cổng CSS phát hiện).
//
// VÌ SAO PHẢI DỌN: `scripts/css-baseline-audit.mjs` có phép kiểm "lớp CSS chết" (tên lớp không xuất hiện trong
// nguồn giao diện và không khớp tiền tố động). Sau khi dọn 2 nhánh render chết (4 nhóm con phòng ban — KP #89,
// và cây workspace theo dự án — KP #96), KHÔNG nguồn giao diện nào còn phát ra họ lớp `nav-subgroup*`,
// `nav-child-dept-*`, `mobile-nav-subgroup*`, `mobile-nav-grandchildren`, `dept-chevron`, `project-workspace*`
// ⇒ toàn bộ họ CSS tương ứng là mã chết; cổng CSS sẽ HỎNG nếu để lại. Đây là BẰNG CHỨNG, không phải sở thích.
//
// Cách dùng:  node tools/don-css-chet.mjs [--apply]     (mặc định: chạy khô, in kế hoạch)
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";

const CSS = "app/globals.css";
const APPLY = process.argv.includes("--apply");

// Họ lớp chết: so theo TÊN LỚP trong selector (`nav-subgroup` khớp cả `nav-subgroup-toggle`) — không so chuỗi thô.
const DEAD_PREFIXES = ["nav-subgroup", "nav-child-dept", "nav-child-bch", "mobile-nav-subgroup", "mobile-nav-grandchildren", "dept-chevron", "mobile-nav-expanded", "project-workspace"];
const DEAD_ATTRS = ['[data-nav-group="department_management"]', '[data-nav-group="project_management"]'];

// Bất biến SỐNG: các lớp/thành phần này PHẢI còn trong CSS sau khi dọn (chống xoá quá tay).
const LIVE = [
  ".nav-glyph{",
  ".mobile-nav-panel.mobile-nav-root",
  ".mobile-nav-children",
  ".mobile-nav-dashboard",
  ".nav-children{",
  '.nav-tree-group[data-nav-group="site_command"]',
];

const classTokens = (selector) => [...selector.matchAll(/\.([A-Za-z_][\w-]*)/g)].map((m) => m[1]);
const isDeadName = (name) => DEAD_PREFIXES.some((p) => name === p || name.startsWith(p + "-"));
const isDead = (selector) => DEAD_ATTRS.some((attr) => selector.includes(attr)) || classTokens(selector).some(isDeadName);

/** Mô phỏng ĐÚNG phép kiểm "lớp CSS chết" của scripts/css-baseline-audit.mjs (để tự chặn trước khi ghi). */
function deadCssClasses(cssText) {
  const sourceExt = new Set([".tsx", ".ts", ".jsx", ".js", ".mjs", ".html"]);
  const parts = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) {
        if (["node_modules", "dist", ".next", ".git", "tests", "scripts", "drizzle"].includes(name)) continue;
        walk(path);
      } else if (sourceExt.has(extname(name)) && resolve(path) !== resolve(CSS)) parts.push(readFileSync(path, "utf8"));
    }
  };
  walk("app");
  walk("lib");
  const source = parts.join("\n");
  const dynamicPrefixes = new Set([...source.matchAll(/([A-Za-z_][\w-]*-)\$\{/g)].map((m) => m[1]));
  const classes = new Set([...cssText.matchAll(/(?<![\w-])\.([A-Za-z_][\w-]*)/g)].map((m) => m[1]));
  return [...classes].filter((name) => !source.includes(name) && ![...dynamicPrefixes].some((p) => name.startsWith(p))).sort();
}

/** Bóc mọi khối `{…}` của CSS (kể cả khối lồng trong @media) kèm vùng selector. */
function parseRules(text) {
  const rules = [];
  const stack = [];
  let boundary = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === "{") { stack.push({ selStart: boundary, openIdx: i }); boundary = i + 1; }
    else if (ch === "}") { const node = stack.pop(); if (node) rules.push({ ...node, closeIdx: i }); boundary = i + 1; }
    else if (ch === ";") { if (text.slice(boundary, i).trim().startsWith("@")) boundary = i + 1; }
  }
  return rules;
}

let css = readFileSync(CSS, "utf8");
const original = css;
const before = { bytes: Buffer.byteLength(css, "utf8"), important: (css.match(/!important/g) || []).length, lines: css.split("\n").length };
const plan = [];
let removedRules = 0, droppedSelectors = 0;

for (let pass = 0; pass < 12; pass++) {
  const rules = parseRules(css).sort((a, b) => b.selStart - a.selStart);
  let touched = false;
  for (const rule of rules) {
    const raw = css.slice(rule.selStart, rule.openIdx);
    const body = css.slice(rule.openIdx + 1, rule.closeIdx);
    const trimmed = raw.trim();
    if (trimmed.startsWith("@")) {
      if (!body.trim() && !/^@(font-face|keyframes|charset|import)/.test(trimmed)) {
        css = css.slice(0, rule.selStart) + css.slice(rule.closeIdx + 1);
        plan.push(`xoá at-block RỖNG ${raw.replace(/\s+/g, " ").trim().slice(0, 60)}`);
        removedRules++; touched = true;
      }
      continue;
    }
    const lead = raw.match(/^\s*/)[0];
    const parts = raw.split(",").map((p) => p.replace(/\s+/g, " ").trim()).filter(Boolean);
    if (!parts.length) continue;
    const deadParts = parts.filter(isDead);
    if (!deadParts.length) continue;
    if (deadParts.length === parts.length) {
      const text = raw.replace(/\s+/g, " ").trim();
      css = css.slice(0, rule.selStart) + css.slice(rule.closeIdx + 1);
      removedRules++; touched = true;
      plan.push(`xoá cả rule (${parts.length} selector đều chết): ${text.slice(0, 110)}`);
    } else {
      const kept = parts.filter((p) => !isDead(p));
      css = css.slice(0, rule.selStart) + lead + kept.join(",\n" + lead) + css.slice(rule.openIdx);
      droppedSelectors += deadParts.length; touched = true;
      plan.push(`bỏ ${deadParts.length}/${parts.length} selector, giữ ${kept.length}: ${kept.join(" | ").slice(0, 90)}`);
    }
  }
  if (!touched) break;
}

// ── HẬU KIỂM ──────────────────────────────────────────────────────────────────────────────
const failures = [];
const count = (t, n) => t.split(n).length - 1;
for (const rule of parseRules(css)) {
  const raw = css.slice(rule.selStart, rule.openIdx);
  if (raw.trim().startsWith("@")) continue;
  for (const part of raw.split(",").map((p) => p.replace(/\s+/g, " ").trim()).filter(Boolean)) {
    if (isDead(part)) failures.push(`vẫn còn selector chết: ${part.slice(0, 90)}`);
  }
}
for (const needle of LIVE) if (!css.includes(needle)) failures.push(`MẤT lớp còn sống: ${needle}`);
if (count(css, "VNTECH_MASTER_BASELINE_CSS_R1_1_1_BEGIN") !== 1) failures.push("mốc BEGIN khác 1");
if (count(css, "VNTECH_MASTER_BASELINE_CSS_R1_1_1_END") !== 1) failures.push("mốc END khác 1");
const endMarker = "/* VNTECH_MASTER_BASELINE_CSS_R1_1_1_END */";
const endIdx = css.indexOf(endMarker);
if (endIdx < 0 || css.slice(endIdx + endMarker.length).trim()) failures.push("có nội dung sau mốc END");
if (/@media[^{]*\{\s*\}/.test(css)) failures.push("còn @media rỗng");
const after = { bytes: Buffer.byteLength(css, "utf8"), important: (css.match(/!important/g) || []).length, lines: css.split("\n").length };
if (after.bytes > 400653) failures.push(`vượt hạn mức byte: ${after.bytes}`);
if (after.important > 4950) failures.push(`vượt hạn mức !important: ${after.important}`);
const beforeCount = (original.match(/\{/g) || []).length, afterCount = (css.match(/\{/g) || []).length;
if (beforeCount !== afterCount + removedRules) failures.push(`số khối không khớp: trước ${beforeCount} · sau ${afterCount} · đã xoá ${removedRules}`);
const deadAfter = deadCssClasses(css);
console.log(`  • lớp CSS chết (mô phỏng cổng CSS): trước ${deadCssClasses(original).length} → sau ${deadAfter.length}`);
if (deadAfter.length) failures.push(`còn lớp CSS chết sau khi dọn: ${deadAfter.slice(0, 14).join(", ")}${deadAfter.length > 14 ? " …" : ""}`);

console.log("=== KẾ HOẠCH DỌN CSS ===");
for (const line of plan) console.log("  • " + line);
console.log(`  • xoá ${removedRules} rule · bỏ ${droppedSelectors} selector khỏi danh sách trộn`);
console.log(`  • bytes ${before.bytes} → ${after.bytes} (giảm ${before.bytes - after.bytes})`);
console.log(`  • !important ${before.important} → ${after.important} (giảm ${before.important - after.important})`);
console.log(`  • dòng ${before.lines} → ${after.lines}`);

if (failures.length) {
  console.error("\nKHÔNG GHI TỆP — có điều kiện không đạt:");
  for (const f of failures.slice(0, 20)) console.error("  ✖ " + f);
  if (failures.length > 20) console.error(`  … còn ${failures.length - 20} điều kiện không đạt nữa`);
  process.exit(1);
}
if (!APPLY) { console.log("\nCHẠY KHÔ: chưa ghi tệp. Thêm --apply để ghi."); process.exit(0); }
writeFileSync(CSS, css);
console.log("\nĐÃ GHI: app/globals.css");
