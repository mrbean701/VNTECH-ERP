// USER 28/09/2026 (v2) — THAY khối CSS toolbar cũ trong app/globals.css bằng bản ĐÃ SỬA.
// VÌ SAO: lần chèn đầu ép `.list-toolbar{flex-wrap:nowrap}` ⇒ LABEL và TOOLBAR rơi cùng hàng
//         ⇒ toolbar chen vào giữa «DANH SÁCH DỰ ÁN» + mô tả (đúng ảnh người dùng chụp).
//         Bản v2: `.list-toolbar` = CỤT DỌC (label trên, toolbar dưới);
//                 `.list-toolbar-controls` = HÀNG NGANG (nowrap + cuộn ngang khi tràn).
// ⚠️ BÀI HỌC: CSS không có ghi chú `//`; kiểm ngoặc + chuỗi DUY NHẤT trước khi ghi.
import { readFileSync, writeFileSync } from "node:fs";

const DST = "app/globals.css";
const SRC = "tools/toolbar-horizontal-20260928.css";
const END = "/* VNTECH_MASTER_BASELINE_CSS_R1_1_1_END */";
const OLD_TAG = "USER 28/09/2026 — TOOLBAR / NHÓM NÚT CHỨC NĂNG: ÉP NẰM NGANG (1 HÀNG).";

const block = readFileSync(SRC, "utf8");

// --- kiểm khối mới ---
const bad = block.split("\n").filter((l) => l.trim().startsWith("//"));
if (bad.length) { console.log("  🔴 khối mới còn " + bad.length + " dòng `//` ⇒ DỪNG"); process.exit(1); }
const o = (block.match(/\{/g) || []).length, c = (block.match(/\}/g) || []).length;
if (o !== c) { console.log("  🔴 ngoặc lệch " + o + "/" + c + " ⇒ DỪNG"); process.exit(1); }
console.log("  ✅ khối mới: " + block.split("\n").length + " dòng · { } = " + o + "/" + c);

let css = readFileSync(DST, "utf8");

// --- Gỡ khối CŨ (nằm ngay trước END) ---
const endAt = css.indexOf(END);
if (endAt < 0) { console.log("  🔴 không thấy dấu kết thúc"); process.exit(1); }
const head = css.slice(0, endAt);
if (head.includes(OLD_TAG)) {
  const at = head.lastIndexOf("/* ============================================================================");
  const before = head.slice(0, at);
  const removed = head.slice(at);
  console.log("  ✅ đã gỡ khối cũ (" + removed.split("\n").length + " dòng)");
  css = before.trimEnd() + "\n\n" + block.trimEnd() + "\n\n" + css.slice(endAt);
} else if (head.includes("ÉP NẰM NGANG")) {
  console.log("  (khối cũ dùng thẻ khác — thử lại với cột mốc thẻ chuẩn)");
  process.exit(1);
} else {
  console.log("  (chưa có khối nào — chèn mới)");
  css = head.trimEnd() + "\n\n" + block.trimEnd() + "\n\n" + css.slice(endAt);
}

writeFileSync(DST, css, "utf8");

// --- kiểm sau khi ghi ---
const after = readFileSync(DST, "utf8");
const a = (after.match(/\{/g) || []).length, b = (after.match(/\}/g) || []).length;
console.log("  ✅ globals.css " + after.split("\n").length + " dòng · { } = " + a + "/" + b + (a === b ? " (CÂN)" : " 🔴 LỆCH"));
const UNIQ = [
  "flex-direction:column!important;   /* ⛔ KHÔNG được để `row`",
  ".list-toolbar-controls{",
  "flex-wrap:nowrap!important;         /* ⛔ chính là hàng ngang",
  ".row-actions,.list-toolbar-actions,.screen-actions,.purchase-action-bar,.drawer-export-group{",
  ".supplier-admin-row,.supplier-new-grid{",
];
for (const u of UNIQ) console.log("     " + (after.includes(u) ? "✅" : "🔴") + " " + u.slice(0, 58));
// đảm bảo khối cũ đã biến mất
console.log("     " + (!after.includes(OLD_TAG) ? "✅" : "🔴") + " khối cũ đã bị thay");
