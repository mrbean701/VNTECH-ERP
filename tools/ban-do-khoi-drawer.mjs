// U-14 bước 2/6 — BẢN ĐỒ KHỐI DRAWER bằng QUÉT VĂN BẢN (đáng tin cho việc lập kế hoạch tách tab).
// Vì sao không dùng công cụ AST: bộ lọc theo thẻ của `boc-cau-truc-jsx-ast.mjs` chưa khớp được (2 lỗi đã ghi),
// nên ở đây dùng mốc VĂN BẢN — mỗi mốc đều in kèm VỊ TRÍ để công cụ chuyển đổi dùng lại làm mỏ neo.
import { readFileSync } from "node:fs";
const LINE = Number(process.argv[2] || 2894);
const line = readFileSync("app/page.tsx", "utf8").split("\n")[LINE - 1];
console.log(`dòng ${LINE} · ${line.length} ký tự`);

const marks = [];
const push = (label, index, extra = "") => marks.push({ label, index, extra });
for (const m of line.matchAll(/<section\b[^>]*className="([^"]*)"/g)) push("<section>", m.index, m[1]);
for (const m of line.matchAll(/<\/section>/g)) push("</section>", m.index);
for (const m of line.matchAll(/<div className="[^"]*"/g)) {
  const cls = m[0].slice(m[0].indexOf('"') + 1, -1);
  if (/drawer-body|summary-grid|card|stack|admin-mini-list|table-scroll|attachment-panel|approval|row-actions|inline-alert|page-mode/.test(cls)) push("<div>", m.index, cls);
}
for (const m of line.matchAll(/<(header|footer|aside)\b/g)) push(`<${m[1]}>`, m.index);
for (const m of line.matchAll(/<\/(header|footer|aside)>/g)) push(`</${m[1]}>`, m.index);
for (const m of line.matchAll(/<CardHead\b[^>]*title="([^"]*)"/g)) push("CardHead", m.index, m[1]);
for (const m of line.matchAll(/<button\b[^>]*?(?:form="([^"]*)")?[^>]*>([^<]{0,40})</g)) {
  if (m[2] && m[2].trim()) push("button", m.index, m[2].trim().slice(0, 40));
}
marks.sort((a, b) => a.index - b.index);
for (const k of marks) console.log(`  @${String(k.index).padStart(5)}  ${k.label}${k.extra ? "  · " + k.extra : ""}`);
console.log(`\nTổng mốc: ${marks.length} · section: ${marks.filter((m) => m.label === "<section>").length} · CardHead: ${marks.filter((m) => m.label === "CardHead").length}`);
