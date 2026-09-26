// [PHASE 1 · U-12.1] GỘP SELECTOR TRÙNG khi KHAI BÁO GIỐNG HỆT TỪNG BYTE.
// Nguyên lý an toàn: nếu cùng (ngữ cảnh @media + selector) mà các khối khai báo GIỐNG NHAU
// thì việc xoá các khối TRÙNG (giữ khối CUỐI) là HOÁN VỊ THUẦN ⇒ KHÔNG THỂ đổi giao diện.
// Bắt buộc: đếm ngoặc; CHẠY KHÔ mặc định; TỰ CHỐI GHI nếu ngoặc lệch.
import { readFileSync, writeFileSync } from "node:fs";

const APPLY = process.argv.includes("--apply");
const FILES = ["app/globals.css", "app/styles/canonical.css"];

/** Thu mọi khối {..} ở mọi độ sâu, kèm NGỮ CẢNH at-rule bao ngoài. */
function collect(css) {
  const out = [];
  const stack = [];        // các at-rule đang mở
  let mark = 0, i = 0;
  while (i < css.length) {
    const ch = css[i];
    if (ch === "/" && css[i + 1] === "*") { const e = css.indexOf("*/", i + 2); i = e < 0 ? css.length : e + 2; continue; }
    if (ch === '"' || ch === "'") { const q = ch; i++; while (i < css.length && css[i] !== q) { if (css[i] === "\\") i++; i++; } i++; continue; }
    if (ch === "{") {
      const sel = css.slice(mark, i);
      const trimmed = sel.trim();
      const isAt = trimmed.startsWith("@");
      // tìm '}' khớp
      let d = 0, j = i, end = -1;
      while (j < css.length) {
        const c2 = css[j];
        if (c2 === "/" && css[j + 1] === "*") { const e = css.indexOf("*/", j + 2); j = e < 0 ? css.length : e + 2; continue; }
        if (c2 === '"' || c2 === "'") { const q = c2; j++; while (j < css.length && css[j] !== q) { if (css[j] === "\\") j++; j++; } j++; continue; }
        if (c2 === "{") d++;
        else if (c2 === "}") { d--; if (d === 0) { end = j; break; } }
        j++;
      }
      if (isAt) { stack.push({ selStart: mark, braceAt: i, key: trimmed, endAt: end }); }
      else {
        out.push({
          ctx: stack.map((s) => s.key).join(" || "),   // ngữ cảnh @media lồng nhau
          sel: trimmed.replace(/\s+/g, " "),
          body: css.slice(i + 1, end < 0 ? css.length : end).trim(),
          selStart: mark, braceAt: i, bodyEnd: end,
        });
      }
      mark = i + 1; i++; continue;
    }
    if (ch === "}") { stack.pop(); mark = i + 1; i++; continue; }
    if (ch === ";") { mark = i + 1; i++; continue; }
    i++;
  }
  return out;
}

let totDel = 0;
for (const file of FILES) {
  const css = readFileSync(file, "utf8");
  const o0 = (css.match(/\{/g) || []).length, c0 = (css.match(/\}/g) || []).length;
  const rules = collect(css);
  const groups = new Map();
  for (const r of rules) {
    const k = r.ctx + "\u0000" + r.sel;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(r);
  }
  const del = [];
  let groupsDup = 0, groupsIdentical = 0;
  for (const [, list] of groups) {
    if (list.length < 2) continue;
    groupsDup++;
    const same = list.every((r) => r.body === list[0].body);
    if (!same) continue;            // khác khai báo ⇒ KHÔNG động vào (có thể là override có chủ đích)
    groupsIdentical++;
    for (let k = 0; k < list.length - 1; k++) del.push(list[k]);   // giữ khối CUỐI
  }
  del.sort((a, b) => b.selStart - a.selStart);
  let out = css;
  for (const r of del) out = out.slice(0, r.selStart) + out.slice(r.bodyEnd + 1);
  const o1 = (out.match(/\{/g) || []).length, c1 = (out.match(/\}/g) || []).length;
  console.log(`--- ${file} ---`);
  console.log(`  rule: ${rules.length} · nhóm selector trùng: ${groupsDup} · nhóm KHAI BÁO GIỐNG HỆT: ${groupsIdentical}`);
  console.log(`  xoá ${del.length} khối trùng (giữ khối cuối mỗi nhóm)`);
  console.log(`  ngoặc ${o0}/${c0} → ${o1}/${c1} · cân bằng: ${o1 === c1 ? "OK" : "SAI"}`);
  console.log(`  kích thước ${css.length} → ${out.length} (giảm ${css.length - out.length})`);
  if (o1 !== c1) { console.error("  ✖ NGOẶC LỆCH ⇒ TỪ CHỐI GHI"); process.exit(1); }
  totDel += del.length;
  if (APPLY) { writeFileSync(file, out); console.log("  ĐÃ GHI"); }
}
console.log(`\nTỔNG xoá ${totDel} khối trùng · chế độ ${APPLY ? "ĐÃ GHI" : "CHẠY KHÔ"}`);
