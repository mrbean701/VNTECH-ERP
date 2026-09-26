#!/usr/bin/env node
/**
 * Thay MỘT dòng dài trong app/page.tsx theo tiền tố nhận dạng.
 * Dùng khi dòng cũ quá dài để dán lại nguyên văn vào công cụ edit (dễ sai một ký tự).
 * Ghi bằng UTF-8 tường minh nên không bị PowerShell làm hỏng dấu tiếng Việt.
 *
 * Chạy: node tools/replace-line.mjs <file> <tiền-tố-nhận-dạng> <nội-dung-mới>
 */
import { readFileSync, writeFileSync } from "node:fs";

const [, , target, prefix, replacement] = process.argv;
if (!target || !prefix || replacement === undefined) {
  console.error("Cần 3 tham số: <file> <tiền-tố|#số-dòng> <nội-dung-mới>");
  console.error("  ví dụ theo tiền tố: node tools/replace-line.mjs app/page.tsx 'MAP_START' 'nội dung'");
  console.error("  ví dụ theo số dòng: node tools/replace-line.mjs app/page.tsx '#2094' 'nội dung'");
  process.exit(64);
}
const text = readFileSync(target, "utf8");
const lines = text.split("\n");

// Chế độ theo SỐ DÒNG — dùng khi tiền tố chứa ký tự bị shell làm hỏng (&&, <, >, dấu tiếng Việt).
if (/^#\d+$/.test(prefix)) {
  const n = Number(prefix.slice(1));
  if (n < 1 || n > lines.length) { console.error(`Số dòng ${n} ngoài phạm vi 1..${lines.length}.`); process.exit(1); }
  const before = lines[n - 1];
  lines[n - 1] = replacement;
  writeFileSync(target, lines.join("\n"), "utf8");
  console.log(`Đã thay dòng ${n} (${before.length} → ${replacement.length} ký tự).`);
  console.log(`  cũ : ${before.slice(0, 110)}`);
  console.log(`  mới: ${replacement.slice(0, 110)}`);
  process.exit(0);
}

const hits = lines.map((l, i) => [l, i]).filter(([l]) => l.includes(prefix));
if (hits.length !== 1) {
  console.error(`Cần đúng 1 dòng khớp tiền tố, tìm thấy ${hits.length}.`);
  hits.slice(0, 5).forEach(([l, i]) => console.error(`  dòng ${i + 1}: ${l.slice(0, 120)}`));
  process.exit(1);
}
const index = hits[0][1];
const before = lines[index].length;
lines[index] = replacement;
writeFileSync(target, lines.join("\n"), "utf8");
console.log(`Đã thay dòng ${index + 1} (${before} → ${replacement.length} ký tự).`);
