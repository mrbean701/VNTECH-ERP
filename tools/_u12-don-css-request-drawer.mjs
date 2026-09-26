// [PHASE 1 · U-12/DỌN CSS] Xoá CSS CHẾT của class `request-drawer` (U-14 đã bỏ class này khỏi markup).
// Bản 2 — sửa lỗi bản 1: `globals.css` bị MINIFY (nhiều rule/dòng) nên phải cập nhật mốc sau MỖI `}`/`;`;
// và phải xử lý cả rule LỒNG trong @media. Mặc định CHẠY KHÔ; kiểm cân bằng ngoặc và TỰ CHỐI nếu lệch.
import { readFileSync, writeFileSync } from "node:fs";

const APPLY = process.argv.includes("--apply");
const NEEDLE = "request-drawer";
const FILES = ["app/globals.css", "app/styles/canonical.css"];

const isWs = (c) => c === " " || c === "\n" || c === "\r" || c === "\t";

/** Với MỖI `{` ở bất kỳ độ sâu: selector = đoạn từ mốc trước đó ({ } ; } tới `{`) */
function collect(css) {
  const out = [];
  let mark = 0;          // mốc bắt đầu selector
  let i = 0;
  while (i < css.length) {
    const ch = css[i];
    if (ch === "/" && css[i + 1] === "*") { const e = css.indexOf("*/", i + 2); i = e < 0 ? css.length : e + 2; continue; }
    if (ch === '"' || ch === "'") { const q = ch; i++; while (i < css.length && css[i] !== q) { if (css[i] === "\\") i++; i++; } i++; continue; }
    if (ch === "{") {
      const selStart = mark;
      // tìm `}` khớp bằng ĐẾM NGOẶC
      let d = 0, j = i, end = -1;
      while (j < css.length) {
        const c2 = css[j];
        if (c2 === "/" && css[j + 1] === "*") { const e = css.indexOf("*/", j + 2); j = e < 0 ? css.length : e + 2; continue; }
        if (c2 === '"' || c2 === "'") { const q = c2; j++; while (j < css.length && css[j] !== q) { if (css[j] === "\\") j++; j++; } j++; continue; }
        if (c2 === "{") d++;
        else if (c2 === "}") { d--; if (d === 0) { end = j; break; } }
        j++;
      }
      out.push({ selStart, braceAt: i, bodyEnd: end });
      mark = i + 1;
      i++;
      continue;
    }
    if (ch === "}" || ch === ";") { mark = i + 1; i++; continue; }
    i++;
  }
  return out;
}

let totRm = 0, totTrim = 0;
for (const file of FILES) {
  const css = readFileSync(file, "utf8");
  const o0 = (css.match(/\{/g) || []).length, c0 = (css.match(/\}/g) || []).length;
  const blocks = collect(css);
  const edits = [];
  let removed = 0, trimmed = 0, skippedAt = 0;
  for (const b of blocks) {
    const sel = css.slice(b.selStart, b.braceAt);
    if (!sel.includes(NEEDLE)) continue;
    if (/^\s*@/.test(sel)) { skippedAt++; continue; }              // @media/@supports: bỏ qua, rule con tự xử lý
    if (b.bodyEnd < 0) continue;                                    // không tìm thấy `}` ⇒ bỏ qua cho an toàn
    const parts = sel.split(",").map((s) => s.trim()).filter(Boolean);
    const alive = parts.filter((p) => !p.includes(NEEDLE));
    if (alive.length === 0) { edits.push({ from: b.selStart, to: b.bodyEnd + 1, rep: "" }); removed++; }
    else { edits.push({ from: b.selStart, to: b.braceAt, rep: alive.join(", ") + " " }); trimmed++; }
  }
  edits.sort((a, b) => b.from - a.from);
  let out = css;
  for (const e of edits) out = out.slice(0, e.from) + e.rep + out.slice(e.to);
  const o1 = (out.match(/\{/g) || []).length, c1 = (out.match(/\}/g) || []).length;
  console.log(`--- ${file} ---`);
  console.log(`  xoá HẲN: ${removed} rule · CẮT phần chết trong danh sách: ${trimmed} rule · bỏ qua @-rule: ${skippedAt}`);
  console.log(`  ngoặc ${o0}/${c0} → ${o1}/${c1} · cân bằng: ${o1 === c1 ? "OK" : "SAI"}`);
  console.log(`  kích thước ${css.length} → ${out.length} (giảm ${css.length - out.length}) · còn '${NEEDLE}': ${(out.match(new RegExp(NEEDLE, "g")) || []).length}`);
  if (o1 !== c1) { console.error("  ✖ NGOẶC LỆCH ⇒ TỪ CHỐI GHI tệp này"); process.exit(1); }
  totRm += removed; totTrim += trimmed;
  if (APPLY) { writeFileSync(file, out); console.log("  ĐÃ GHI"); }
}
console.log(`\nTỔNG: xoá hẳn ${totRm} · cắt ${totTrim} · chế độ ${APPLY ? "ĐÃ GHI" : "CHẠY KHÔ"}`);
