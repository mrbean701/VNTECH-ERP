// USER 28/09/2026 — QUÉT: nhóm nút chức năng nào ĐANG XẾP DỌC (cần chuyển sang HÀNG NGANG)?
// Quét TĨNH trên CSS + đối chiếu nơi dùng trong TSX. Chỉ ĐỌC.
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const files = [];
function walk(d, depth = 0) {
  if (depth > 4 || !existsSync(d)) return;
  for (const e of readdirSync(d, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name === ".git" || e.name === "dist") continue;
    const p = join(d, e.name);
    if (e.isDirectory()) walk(p, depth + 1);
    else if (e.name.endsWith(".css")) files.push(p);
  }
}
walk("app");
walk("styles");
for (const f of ["app/globals.css", "app/styles/canonical.css"]) if (existsSync(f) && !files.includes(f)) files.push(f);

console.log("  tep CSS: " + files.length + "  -> " + files.map((f) => f.replace(/\\/g, "/")).join(" · "));

// Nhóm nút hay dùng: tên lớp chứa action/actions/buttons/toolbar/footer/control/ops/row-actions…
const RX_NAME = /(action|actions|buttons|toolbar|footer|controls?|ops|commands|btn-group|row-actions|head-actions|card-actions|form-actions|modal-footer|drawer-actions|tab-actions)/i;

const hits = [];
for (const f of files) {
  const txt = readFileSync(f, "utf8");
  // tách từng luật: selector { ... }
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(txt))) {
    const sel = m[1].trim().replace(/\s+/g, " ");
    const body = m[2];
    if (!RX_NAME.test(sel)) continue;
    const col = /flex-direction\s*:\s*column/i.test(body);
    const grid1 = /grid-template-columns\s*:\s*(1fr|minmax\(0,\s*1fr\)|100%|repeat\(\s*1\s*,)/i.test(body);
    const block = /\bdisplay\s*:\s*(block|grid)\b/i.test(body) && !/flex/i.test(body) && grid1;
    if (col || grid1 || block) {
      const esc = txt.slice(0, m.index).split("\n").length;
      hits.push({ f: f.replace(/\\/g, "/"), line: esc, sel: sel.slice(0, 90), why: col ? "flex-direction:column" : grid1 ? "grid 1 cot" : "block", body: body.replace(/\s+/g, " ").slice(0, 110) });
    }
  }
}

console.log("  === RULE NGHI NGHO XEP DOC: " + hits.length + " ===");
const seen = new Set();
for (const h of hits) {
  const k = h.sel + "|" + h.why;
  if (seen.has(k)) continue;
  seen.add(k);
  console.log("  🔴 " + h.why.padEnd(22) + " " + h.sel);
  console.log("       " + h.f + ":" + h.line);
  console.log("       " + h.body);
}
