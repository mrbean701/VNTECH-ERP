// VNTECH ERP — SINH SÀN CỠ CHỮ (GĐ1)
//
// Vấn đề: globals.css có 107 rule đặt `font-size: calc(8px * var(--user-font-scale))`
// trở xuống. Liệt kê tay sẽ sót và lệch mỗi khi globals.css đổi.
//
// Cách làm: đọc globals.css, tìm MỌI rule có cỡ chữ < 9px, rồi sinh ra
// `app/styles/font-floor.css` — giữ NGUYÊN selector, chỉ nâng sàn lên 10px và
// VẪN nhân `var(--user-font-scale)` để tôn trọng tuỳ chọn cỡ chữ của người dùng.
//
//   node tools/gen-font-floor.mjs
//
// tools/ KHÔNG thuộc ROOT_DIRS nên file này không ảnh hưởng fingerprint.
// LƯU Ý: đây là file SINH TỰ ĐỘNG — không sửa tay. Chạy lại lệnh trên sau khi
// thay đổi globals.css.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(root, "app", "globals.css");
const OUT = join(root, "app", "styles", "font-floor.css");
const FLOOR = 10;          // cỡ chữ tối thiểu (px)
const MIN_DETECT = 9;      // coi là "quá nhỏ" nếu < 9px

const css = readFileSync(SRC, "utf8");

// Bỏ comment để không phân tích nhầm nội dung đã bị vô hiệu hoá
const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");

// font-size:calc(<số>px * var(--user-font-scale[,...]))
const FS_RE = /font-size\s*:\s*calc\(\s*([0-9]*\.?[0-9]+)\s*px\s*\*\s*var\(\s*--user-font-scale[^)]*\)\s*\)/g;
// font-size:<số>px (không nhân scale)
const FS_PLAIN_RE = /font-size\s*:\s*([0-9]*\.?[0-9]+)\s*px/g;

const collected = new Map(); // selector -> giá trị nhỏ nhất gặp được

const rules = [...stripped.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
for (const m of rules) {
  const rawSel = m[1].trim();
  const body = m[2];
  if (!rawSel || rawSel.startsWith("@")) continue;
  // selector có thể dính đuôi @media khi rule nằm trong khối media
  const sel = rawSel.split("}").pop().trim();
  if (!sel || sel.startsWith("@")) continue;

  let smallest = null;
  FS_RE.lastIndex = 0; FS_PLAIN_RE.lastIndex = 0;
  for (const hit of body.matchAll(FS_RE)) {
    const v = parseFloat(hit[1]);
    if (v < MIN_DETECT) smallest = smallest === null ? v : Math.min(smallest, v);
  }
  if (smallest === null) {
    for (const hit of body.matchAll(FS_PLAIN_RE)) {
      const v = parseFloat(hit[1]);
      if (v < MIN_DETECT) smallest = smallest === null ? v : Math.min(smallest, v);
    }
  }
  if (smallest === null) continue;

  for (const one of sel.split(",").map((s) => s.trim()).filter(Boolean)) {
    if (one.startsWith("@")) continue;
    const prev = collected.get(one);
    collected.set(one, prev === undefined ? smallest : Math.min(prev, smallest));
  }
}

const entries = [...collected.entries()].sort((a, b) => a[0].localeCompare(b[0]));
const lines = [];
lines.push("/* ============================================================================");
lines.push("   VNTECH ERP — SÀN CỠ CHỮ (GĐ1)");
lines.push("   ----------------------------------------------------------------------------");
lines.push("   ⚠️  FILE SINH TỰ ĐỘNG — KHÔNG SỬA TAY.");
lines.push("   Sinh bởi: node tools/gen-font-floor.mjs");
lines.push("   Nguồn:    app/globals.css");
lines.push("");
lines.push(`   Tìm thấy ${entries.length} selector đặt cỡ chữ < ${MIN_DETECT}px (nguyên nhân lỗi`);
lines.push("   \"quá nhiều thông tin phải thu nhỏ để nhét vừa\"). Khối này nâng sàn lên");
lines.push(`   ${FLOOR}px nhưng VẪN nhân var(--user-font-scale) để tôn trọng tuỳ chọn cỡ chữ.`);
lines.push("   ========================================================================== */");
lines.push("");
lines.push("/* Token sàn `--vt-font-floor` nay do app/styles/tokens.css khai báo (GĐ1) —");
lines.push("   một nguồn sự thật duy nhất cho mọi giá trị thiết kế.");
lines.push("   Tệp này chỉ DÙNG LẠI token đó, KHÔNG tự khai báo nữa. */");
lines.push("");
lines.push("/* gom theo nhóm selector để dễ đọc */");
lines.push(entries.map(([s]) => s).join(",\n") + " {");
lines.push("  font-size: calc(var(--vt-font-floor) * var(--user-font-scale, 1)) !important;");
lines.push("}");
lines.push("");
lines.push("/* ---------------------------------------------------------------------------");
lines.push("   Bảng đối chiếu selector → cỡ chữ GỐC (để tra khi cần hoàn tác)");
lines.push("   ---------------------------------------------------------------------------");
for (const [s, v] of entries) lines.push(`   ${String(v).padStart(4)}px  ${s}`);
lines.push("   --------------------------------------------------------------------------- */");

writeFileSync(OUT, lines.join("\n") + "\n", "utf8");
console.log(`Đã sinh ${OUT}`);
console.log(`  ${entries.length} selector được nâng sàn lên ${FLOOR}px`);
const tally = {};
for (const [, v] of entries) tally[v] = (tally[v] || 0) + 1;
console.log("  Phân bố cỡ chữ gốc: " + Object.entries(tally).sort().map(([k, n]) => `${k}px×${n}`).join(" · "));
