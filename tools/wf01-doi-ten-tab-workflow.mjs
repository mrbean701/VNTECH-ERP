// [PHASE 8 · WF-01] Đổi tên TAB "Phê duyệt đơn hàng" -> "Workflow" (mục lộ trình: "Đổi tên tab thành Workflow").
// Mỏ neo ASCII + TỰ CHỐI nếu không khớp đúng 1 lần (kỹ luật đã áp dụng nhiều lần trong dự án).
import { readFileSync, writeFileSync } from "node:fs";
const F = "app/page.tsx";
const APPLY = process.argv.includes("--apply");
const src = readFileSync(F, "utf8");
const NL = src.includes("\r\n") ? "\r\n" : "\n";
const oldS = '{ key: "approvals", label: "Phê duyệt đơn hàng"';
const newS = '{ key: "approvals", label: "Workflow"';

const n = src.split(oldS).length - 1;
const already = src.split(newS).length - 1;
console.log(`mỏ neo CŨ '${oldS}' xuất hiện: ${n} lần · mỏ neo MỚI đã có: ${already} lần`);
if (n === 0 && already === 1) { console.log("⇒ đã đổi rồi (WF-01 xong trước đó) — không cần làm gì."); process.exit(0); }
if (n !== 1) { console.error("✖ Không đúng 1 lần ⇒ DỪNG, không sửa."); process.exit(1); }
if (already > 0) { console.error("✖ Đã có nhãn 'Workflow' ở chỗ khác ⇒ DỪNG để tránh nhầm."); process.exit(1); }
if (!APPLY) { console.log("CHẠY KHÔ: sẵn sàng thay nhãn tab (thêm --apply)."); process.exit(0); }
writeFileSync(F, src.replace(oldS, newS));
console.log("ĐÃ GHI: nhãn tab 'approvals' nay là 'Workflow'.");
