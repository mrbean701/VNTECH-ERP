// U-09 — KIỂM KÊ CÁC DANH SÁCH CẦN CHUYỂN SANG KHUÔN TOOLBAR CHUẨN (§5)
//
// Vì sao cần công cụ này: app/page.tsx có những dòng dài hàng chục nghìn ký tự (mỗi màn hình
// gần như nằm trên một dòng), nên đọc bằng mắt để lập danh sách việc là không đáng tin. Công cụ
// này quét theo DẤU HIỆU CẤU TRÚC và gắn mỗi dấu hiệu với HÀM MÀN HÌNH chứa nó.
//
// Khuôn chuẩn §5:
//   ---------------------------------------------------------
//   TIÊU ĐỀ / SỐ LƯỢNG          TÌM · LỌC · SẮP XẾP · HÀNH ĐỘNG
//   ---------------------------------------------------------
//   BẢNG DỮ LIỆU
//
// Dấu hiệu "chưa theo khuôn" (cần chuyển):
//   .approved-module-head  + .screen-actions   -> tiêu đề và nút cùng hàng, bộ lọc nằm ở card RIÊNG
//   .baseline-filter-card  + .filter-grid      -> bộ lọc tách rời khỏi tiêu đề
//   .staff-toolbar                             -> kiểu toolbar riêng của màn danh bạ
//   .table-toolbar                             -> tiêu đề + hành động, NHƯNG thiếu ô tìm/lọc chuẩn
//
// Cách dùng:
//   node tools/probe-list-toolbar-inventory.mjs            # bảng kiểm kê
//   node tools/probe-list-toolbar-inventory.mjs --detail   # kèm số dòng của từng dấu hiệu
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FILE = join(ROOT, "app", "page.tsx");
const DETAIL = process.argv.includes("--detail");

const source = readFileSync(FILE, "utf8");
const lines = source.split(/\r?\n/);

// Dấu hiệu cấu trúc: tên lớp -> nhóm
const SIGNALS = [
  ["approved-module-head", "tieu-de-tach-roi"],
  ["screen-actions", "tieu-de-tach-roi"],
  ["baseline-filter-card", "bo-loc-card-rieng"],
  ["filter-grid", "bo-loc-card-rieng"],
  ["staff-directory-head", "toolbar-rieng"],
  ["staff-toolbar", "toolbar-rieng"],
  ["table-toolbar", "tieu-de-hanh-dong"],
  ["list-toolbar", "DA-CHUAN-HOA"],
];

// Nhận diện khai báo hàm màn hình ở đầu dòng.
const DECL = [
  /^export\s+default\s+function\s+([A-Za-z0-9_]+)/,
  /^export\s+function\s+([A-Za-z0-9_]+)/,
  /^function\s+([A-Za-z0-9_]+)/,
  /^const\s+([A-Za-z0-9_]+)\s*[:=]/,
];

const screens = new Map(); // ten ham -> { line, signals: Map<class, {count, lines:[]}> }
let current = "<ngoai-ham>";

lines.forEach((line, index) => {
  const lineNo = index + 1;
  for (const re of DECL) {
    const m = line.match(re);
    if (m) { current = m[1]; break; }
  }
  if (!screens.has(current)) screens.set(current, { line: lineNo, signals: new Map() });
  const entry = screens.get(current);

  for (const [cls, group] of SIGNALS) {
    if (!line.includes(cls)) continue;
    // Đếm số LẦN XUẤT HIỆN trong dòng (một dòng có thể chứa nhiều khối).
    const count = line.split(cls).length - 1;
    const prev = entry.signals.get(cls) || { group, count: 0, lines: [] };
    prev.count += count;
    prev.lines.push(lineNo);
    entry.signals.set(cls, prev);
  }
});

// Chỉ giữ những hàm có ít nhất một dấu hiệu liên quan toolbar/danh sách.
const rows = [];
for (const [name, entry] of screens) {
  const hits = [...entry.signals.entries()].filter(([, v]) => v.group !== undefined);
  if (!hits.length) continue;
  const groups = new Set(hits.map(([, v]) => v.group));
  const standardized = groups.has("DA-CHUAN-HOA");
  const needsWork = [...groups].some((g) => g !== "DA-CHUAN-HOA");
  rows.push({
    name,
    line: entry.line,
    hits: hits.map(([cls, v]) => `${cls}×${v.count}`).join(" · "),
    groups: [...groups].join(","),
    verdict: standardized && !needsWork ? "DA-CHUAN-HOA" : needsWork ? "CAN-CHUYEN" : "-",
    detail: hits.map(([cls, v]) => `${cls}@${v.lines.join(",")}`).join("  "),
  });
}

rows.sort((a, b) => a.line - b.line);

console.log("═".repeat(100));
console.log("  KIỂM KÊ TOOLBAR DANH SÁCH — app/page.tsx");
console.log(`  ${rows.length} hàm màn hình có dấu hiệu toolbar/danh sách`);
console.log("═".repeat(100));
console.log("");
console.log(String("HÀM").padEnd(34) + String("DÒNG").padEnd(7) + String("PHÂN LOẠI").padEnd(14) + "DẤU HIỆU");
console.log("-".repeat(100));
for (const r of rows) {
  console.log(String(r.name).padEnd(34) + String(r.line).padEnd(7) + String(r.verdict).padEnd(14) + r.hits);
  if (DETAIL) console.log("   " + " ".repeat(52) + r.detail);
}

const canChuyen = rows.filter((r) => r.verdict === "CAN-CHUYEN");
const daChuan = rows.filter((r) => r.verdict === "DA-CHUAN-HOA");
console.log("");
console.log("─".repeat(100));
console.log(`CẦN CHUYỂN : ${canChuyen.length}`);
console.log(`ĐÃ CHUẨN   : ${daChuan.length}`);
console.log("─".repeat(100));
