// [PHASE 1 · U-12.2] TÌM `!important` THỪA — CHỈ LỚP *CHỨNG MINH ĐƯỢC LÀ CHẾT*.
//
// VÌ SAO CHỈ LỚP NÀY: xác định `!important` thừa nói chung cần MỘT MÁY CASCADE CSS.
// Lớp an toàn tuyệt đối, không cần suy luận gì thêm:
//   CÙNG một selector, CÙNG một ngữ cảnh (@media), CÙNG một thuộc tính được khai báo ≥ 2 lần,
//   và bản khai báo CUỐI có `!important`  ⇒  bản khai báo TRƯỚC (dù có `!important`) KHÔNG BAO GIỜ thắng
//   ⇒  token `!important` ở bản trước là **CHẾT** ⇒ bỏ token đó KHÔNG đổi kết quả cascade.
//
// AN TOÀN:
//  • Chỉ bỏ ĐÚNG token `!important`, KHÔNG xoá khai báo, KHÔNG đổi selector/thứ tự.
//  • Chỉ so sánh trong CÙNG ngữ cảnh media (khác media ⇒ KHÔNG đụng).
//  • Chạy khô mặc định; `--apply --limit=N` mới ghi, tối đa N thay đổi (lô 20–30).
//  • Tự kiểm: số `!important` giảm ĐÚNG bằng số thay đổi; số `{}` cân bằng; số `!important` còn lại khớp.
import { readFileSync, writeFileSync } from "node:fs";

const FILE = process.argv.find((a) => a.startsWith("--file="))?.slice(7) || "app/globals.css";
const APPLY = process.argv.includes("--apply");
const LIMIT = Number(process.argv.find((a) => a.startsWith("--limit="))?.slice(8) || 0);

const src = readFileSync(FILE, "utf8");
const before = { imp: (src.match(/!important/g) || []).length, open: (src.match(/\{/g) || []).length, close: (src.match(/\}/g) || []).length };
console.log(`Tệp: ${FILE}`);
console.log(`  !important = ${before.imp} · { = ${before.open} · } = ${before.close} ⇒ ${before.open === before.close ? "CÂN BẰNG" : "LỆCH NGAY TỪ ĐẦU (dừng)"}`);
if (before.open !== before.close) process.exit(2);

// ── Bộ quét: đi qua tệp, theo dõi ngữ cảnh @media, thu từng rule trong từng block ──
const rules = []; // {ctx, sel, bodyStart, bodyEnd, decls:[{prop,impFrom,impTo}]}
function parseBlock(start, end, ctx) {
  let i = start;
  while (i < end) {
    const open = src.indexOf("{", i);
    if (open < 0 || open >= end) break;
    const sel = src.slice(i, open).trim();
    // tìm `}` cân bằng
    let depth = 1, j = open + 1;
    while (j < end && depth > 0) { if (src[j] === "{") depth++; else if (src[j] === "}") depth--; j++; }
    const bodyEnd = j - 1;
    if (sel.startsWith("@")) { parseBlock(open + 1, bodyEnd, (ctx ? ctx + " | " : "") + sel.replace(/\s+/g, " ")); }
    else { rules.push({ ctx, sel, bodyStart: open + 1, bodyEnd }); }
    i = j;
  }
}
parseBlock(0, src.length, "");

// ── Gom khai báo theo NHÓM `ngữ cảnh @media || selector` ──
// LÝ DO: CÙNG một CHUỖI selector ⇒ CÙNG độ ưu tiên (specificity) ⇒ rule XUẤT HIỆN SAU thắng tự nhiên.
//        Vậy nếu một thuộc tính được khai báo lại ở rule SAU (cùng selector, cùng media) với `!important`,
//        thì token `!important` ở các khai báo TRƯỚC là **CHẾT** (không bao giờ tham gia quyết định).
const declRe = /([-a-zA-Z]+)\s*:\s*([^;{}]*?)(!important)?(?=;|$)/g;
const groups = new Map(); // key -> [{prop, imp, impOffset, ruleIdx}]
let ruleIdx = 0;
for (const r of rules) {
  const key = (r.ctx || "") + "||" + r.sel;
  if (!groups.has(key)) groups.set(key, []);
  const arr = groups.get(key);
  const body = src.slice(r.bodyStart, r.bodyEnd);
  let m;
  declRe.lastIndex = 0;
  while ((m = declRe.exec(body))) {
    arr.push({
      prop: m[1].toLowerCase(),
      imp: !!m[3],
      impOffset: m[3] ? r.bodyStart + m.index + m[0].length - m[3].length : -1,
      ruleIdx,
      sel: r.sel, ctx: r.ctx,
    });
  }
  ruleIdx++;
}
let dead = [];
for (const [, arr] of groups) {
  // với mỗi thuộc tính: mọi khai báo có !important TRỪ khai báo CUỐI CÙNG của thuộc tính đó ⇒ chết
  const byProp = new Map();
  for (const d of arr) { if (!byProp.has(d.prop)) byProp.set(d.prop, []); byProp.get(d.prop).push(d); }
  for (const [, list] of byProp) {
    if (list.length < 2) continue;
    const last = list[list.length - 1];
    if (!last.imp) continue; // khai báo cuối không !important ⇒ không kết luận được (có thể đang cần)
    for (const d of list.slice(0, -1)) {
      if (d.imp) dead.push({ ctx: d.ctx, sel: d.sel, prop: d.prop, offset: d.impOffset });
    }
  }
}

console.log(`\nSố rule đã quét: ${rules.length}`);
console.log(`SỐ \`!important\` CHẾT (chứng minh được): ${dead.length}`);
const byProp = {};
for (const d of dead) byProp[d.prop] = (byProp[d.prop] || 0) + 1;
console.log("Theo thuộc tính (top 12): " + Object.entries(byProp).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, v]) => `${k}=${v}`).join(" · "));
console.log("Mẫu (10 đầu):");
for (const d of dead.slice(0, 10)) console.log(`  · ${d.sel.slice(0, 60)} { ${d.prop} }  ctx=${d.ctx || "(gốc)"}`);

if (!APPLY) { console.log("\n[CHẠY KHÔ] Không ghi gì. Thêm --apply --limit=25 để sửa một lô."); process.exit(0); }
if (!LIMIT) { console.log("\n✖ Cần --limit=N khi --apply (bắt buộc sửa theo LÔ)."); process.exit(2); }

const chosen = dead.slice(0, LIMIT);
// xoá token `!important` tại các vị trí đã chọn (từ CUỐI về ĐẦU để không lệch offset)
let out = src;
for (const d of [...chosen].sort((a, b) => b.offset - a.offset)) {
  const seg = out.slice(d.offset, d.offset + 10);
  if (!seg.startsWith("!important")) { console.error(`✖ offset ${d.offset} không phải '!important' (thấy '${seg}') ⇒ TỪ CHỐI GHI`); process.exit(3); }
  out = out.slice(0, d.offset) + out.slice(d.offset + 10);
}
const after = { imp: (out.match(/!important/g) || []).length, open: (out.match(/\{/g) || []).length, close: (out.match(/\}/g) || []).length };
console.log(`\nSẽ sửa: ${chosen.length} chỗ · !important ${before.imp} → ${after.imp} (giảm ${before.imp - after.imp}, phải = ${chosen.length})`);
console.log(`  { = ${after.open} (gốc ${before.open}) · } = ${after.close} (gốc ${before.close})`);
if (before.imp - after.imp !== chosen.length) { console.error("✖ số giảm ≠ số sửa ⇒ TỪ CHỐI GHI"); process.exit(3); }
if (after.open !== before.open || after.close !== before.close) { console.error("✖ ngoặc đổi ⇒ TỪ CHỐI GHI"); process.exit(3); }
writeFileSync(FILE, out);
console.log(`ĐÃ GHI ${FILE} (${chosen.length} token !important chết đã bỏ).`);
