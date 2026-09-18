// [PHASE 8 · B2 · bước 2] Chèn 2 handler `approve_po` + `reject_po` vào `scripts/system-route.mjs`,
// đọc ĐOẠN MÃ CHÈN từ tệp riêng (`tools/_b2-handler-insert.txt`) để tránh vấn đề dấu nháy/backtick trong script.
// Mỏ neo: `    if (action === "close_po_line") {` (kề `create_po`) — TỰ CHỐI nếu không khớp đúng 1 lần.
import { readFileSync, writeFileSync } from "node:fs";
const FILE = "scripts/system-route.mjs";
const SNIPPET = "tools/_b2-handler-insert.txt";
const APPLY = process.argv.includes("--apply");
const NL = readFileSync(FILE, "utf8").includes("\r\n") ? "\r\n" : "\n";
let text = readFileSync(FILE, "utf8");
const anchor = '    if (action === "close_po_line") {';
const n = text.split(anchor).length - 1;
if (n !== 1) { console.error(`✖ mỏ neo khớp ${n} lần (cần 1) ⇒ DỪNG`); process.exit(1); }
if (text.includes('"approve_po"') || text.includes('"reject_po"')) { console.error("✖ Đã có approve_po/reject_po ⇒ DỪNG (tránh chèn trùng)."); process.exit(1); }
const snippet = readFileSync(SNIPPET, "utf8").replace(/\r?\n/g, NL);
if (!APPLY) { console.log("CHẠY KHÔ: mỏ neo khớp đúng 1 lần, chưa có handler ⇒ sẵn sàng chèn (thêm --apply)."); process.exit(0); }
text = text.replace(anchor, snippet + anchor);
writeFileSync(FILE, text);
console.log("ĐÃ GHI: " + FILE + " (chèn approve_po + reject_po trước close_po_line)");
