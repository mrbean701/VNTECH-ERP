import { readFileSync } from "node:fs";
// Phân tích phụ thuộc: hàm/hằng top-level nào CHỈ phụ thuộc vào những cái khác đã "lá" (không gọi hàm nào khác)?
// Mục đích: chọn lát cắt AN TOÀN ĐẦU TIÊN để tách `app/page.tsx` ra module (U-11), tránh import vòng.
const src = readFileSync("app/page.tsx", "utf8");
const lines = src.split(/\r?\n/);

// 1) Liệt kê khai báo top-level (cột 0) dạng: function X( / const X = / type X = / interface X
const decls = [];
const rx = /^(?:export\s+)?(?:async\s+)?(function|const|type|interface)\s+([A-Za-z_$][\w$]*)/;
for (let i = 0; i < lines.length; i++) {
  const m = lines[i].match(rx);
  if (m) decls.push({ kind: m[1], name: m[2], line: i + 1 });
}
const names = new Set(decls.map((d) => d.name));
console.log(`Tổng khai báo top-level: ${decls.length}`);

// 2) Xác định khoảng dòng của mỗi khai báo (đến khai báo kế tiếp ở cột 0)
for (let i = 0; i < decls.length; i++) {
  decls[i].end = i + 1 < decls.length ? decls[i + 1].line - 1 : lines.length;
  decls[i].body = lines.slice(decls[i].line - 1, decls[i].end).join("\n");
}

// 3) Với mỗi khai báo, đếm tên top-level KHÁC xuất hiện trong thân (theo ranh giới từ)
const deps = new Map();
for (const d of decls) {
  const found = new Set();
  for (const other of names) {
    if (other === d.name) continue;
    const re = new RegExp(`(^|[^\\w$.])${other.replace(/\$/g, "\\$")}([^\\w$]|$)`);
    if (re.test(d.body)) found.add(other);
  }
  deps.set(d.name, found);
}

// 4) Lá = không phụ thuộc khai báo top-level nào khác
const leaves = decls.filter((d) => deps.get(d.name).size === 0);
const leafNames = new Set(leaves.map((d) => d.name));
// 5) "Gần lá": chỉ phụ thuộc các lá
const nearLeaves = decls.filter((d) => d !== undefined && !leafNames.has(d.name) && [...deps.get(d.name)].every((x) => leafNames.has(x)));

console.log(`\n=== LÁ (${leaves.length}) — phụ thuộc 0 khai báo top-level khác ===`);
for (const d of leaves) console.log(`  ${String(d.line).padStart(5)}  ${d.kind.padEnd(9)} ${d.name}  (${d.end - d.line + 1} dòng)`);

console.log(`\n=== GẦN LÁ (${nearLeaves.length}) — chỉ phụ thuộc các LÁ ===`);
for (const d of nearLeaves) console.log(`  ${String(d.line).padStart(5)}  ${d.kind.padEnd(9)} ${d.name}  ← ${[...deps.get(d.name)].join(", ")}`);

const totalLeafLines = [...leaves, ...nearLeaves].reduce((s, d) => s + (d.end - d.line + 1), 0);
console.log(`\nTổng số dòng có thể tách AN TOÀN ngay: ${totalLeafLines} / ${lines.length}`);
