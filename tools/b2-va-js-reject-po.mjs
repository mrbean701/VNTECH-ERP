// [PHASE 8 · B2] Vá JS `reject_po`: work_item_id phải là ID THẬT (bảng NOT NULL) + status theo quy ước "SENT".
// Mỏ neo + TỰ CHỐI: không khớp đúng 1 lần thì KHÔNG ghi.
import { readFileSync, writeFileSync } from "node:fs";
const F = "scripts/system-route.mjs";
const APPLY = process.argv.includes("--apply");
let t = readFileSync(F, "utf8");
const failures = [];
const rep = (from, to, label) => {
  const n = t.split(from).length - 1;
  if (n !== 1) { failures.push(`[${label}] mỏ neo khớp ${n} lần (cần 1) ⇒ DỪNG`); return; }
  t = t.replace(from, to);
};
// 1) work_item_id: null ⇒ poId  (trong reject_po)
if (!t.includes('.bind(id("NTF"),poId,po.buyerUserId,"in_app"')) {
  rep('.bind(id("NTF"),null,po.buyerUserId,"in_app"', '.bind(id("NTF"),poId,po.buyerUserId,"in_app"', "work_item_id");
} else failures.push("[work_item_id] đã sửa ⇒ DỪNG (tránh sửa trùng)");
// 2) status: "sent" ⇒ "SENT" (quy ước JS dòng 265)
if (t.includes('"sent",null,stamp,null,stamp,stamp)')) {
  rep('"sent",null,stamp,null,stamp,stamp)', '"SENT",null,stamp,null,stamp,stamp)', "status SENT");
} else failures.push('[status] không thấy \'"sent",null,stamp,null,stamp,stamp)\' ⇒ DỪNG');

if (failures.length) { console.error("KHÔNG GHI — có điều kiện không đạt:"); for (const f of failures) console.error("  ✖ " + f); process.exit(1); }
if (!APPLY) { console.log("CHẠY KHÔ: 2 mỏ neo khớp ⇒ sẵn sàng ghi (thêm --apply)."); process.exit(0); }
writeFileSync(F, t);
console.log("ĐÃ GHI: JS reject_po (work_item_id = poId · status = SENT)");
