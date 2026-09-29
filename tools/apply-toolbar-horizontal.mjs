// USER 28/09/2026 — CHÈN khối CSS «toolbar nằm ngang» (chống vỡ thành hàng dọc) vào app/globals.css.
// ⚠️ BÀI HỌC ĐÃ TRẢ GIÁ: CSS ⛔ KHÔNG có cú pháp ghi chú `//` (chỉ `/* */`) — lần trước tôi viết `//`
//    ⇒ postcss lỗi ⇒ BUILD HỎNG ⇒ dist/ giữ bản cũ ⇒ người dùng ⛔ không thấy thay đổi.
//    ⇒ Lần này KIỂM TRA khối trước khi chèn: phải sạch `//` và không có `{` `}` lệch.
import { readFileSync, writeFileSync } from "node:fs";

const SRC = "tools/toolbar-horizontal-20260928.css";
const DST = "app/globals.css";
const END = "/* VNTECH_MASTER_BASELINE_CSS_R1_1_1_END */";
const TAG = "USER 28/09/2026 — TOOLBAR / NHÓM NÚT CHỨC NĂNG: ÉP NẰM NGANG";

const block = readFileSync(SRC, "utf8");

// ── KIỂM TRA TRƯỚC KHI CHÈN ─────────────────────────────────────────────────
const badLines = block.split("\n").filter((l) => l.trim().startsWith("//"));
if (badLines.length) { console.log("  🔴 khối CSS còn " + badLines.length + " dòng `//` ⇒ DỪNG"); process.exit(1); }
const open = (block.match(/\{/g) || []).length, close = (block.match(/\}/g) || []).length;
if (open !== close) { console.log("  🔴 ngoặc lệch: { = " + open + " · } = " + close + " ⇒ DỪNG"); process.exit(1); }
console.log("  ✅ khối CSS sạch: " + block.split("\n").length + " dòng · { } = " + open + "/" + close);

let css = readFileSync(DST, "utf8");
if (css.includes(TAG)) { console.log("  (đã chèn trước đó — bỏ qua)"); process.exit(0); }
const hits = css.split(END).length - 1;
if (hits !== 1) { console.log("  🔴 dấu kết thúc xuất hiện " + hits + " lần ⇒ DỪNG"); process.exit(1); }

css = css.replace(END, block.trimEnd() + "\n\n" + END);
writeFileSync(DST, css, "utf8");

// ── KIỂM TRA SAU KHI CHÈN ───────────────────────────────────────────────────
const after = readFileSync(DST, "utf8");
const a = (after.match(/\{/g) || []).length, b = (after.match(/\}/g) || []).length;
console.log("  ✅ đã chèn · globals.css " + after.split("\n").length + " dòng · { } = " + a + "/" + b + (a === b ? " (CÂN)" : " 🔴 LỆCH"));
const UNIQ = [".row-actions,.list-toolbar-actions,.screen-actions", ".material-list-filters,.material-master-toolbar", ".supplier-admin-row,.supplier-new-grid", ".personal-summary-metrics,.kpi-grid", "flex-direction:row!important"];
for (const u of UNIQ) console.log("     " + (after.includes(u) ? "✅" : "🔴") + " " + u.slice(0, 60));
