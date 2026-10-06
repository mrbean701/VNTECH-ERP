// U-09 — KIỂM KÊ CÁC DANH SÁCH CẦN CHUYỂN SANG KHUÔN TOOLBAR CHUẨN (§5)
//
// Vì sao cần công cụ này: app/page.tsx có những dòng dài hàng chục nghìn ký tự (mỗi màn hình
// gần như nằm trên một dòng), nên đọc bằng mắt để lập danh sách việc là không đáng tin. Công cụ
// này quét theo DẤU HIỆU CẤU TRÚC và gắn mỗi dấu hiệu với HÀM MÀN HÌNH chứa nó.
//
// KHUÔN CHUẨN §5:
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
// ⚠️ VÒNG 194 — HAI SỬA ĐỔI VỀ MẶT ĐỘ, KHÔNG PHẢI VỀ ĐIỀU KIỆN:
//
// 1) PHẠM VI ĐỌC: trước đây chỉ đọc `app/page.tsx`. Nhưng mã đã tách sang `app/screens/*.tsx`
//    (34 tệp) + `app/components/*.tsx`, nên bảng kiểm kê bỏ sót toàn bộ phần đó — đo được
//    `baseline-filter-card` VẪN CÒN trong `app/screens/Receiving.tsx` mà công cụ không hề thấy.
//    Đây đúng là lỗi đã ghi ở D-062 (cổng `verify:css-baseline` chỉ đọc `globals.css` trong khi
//    `layout.tsx` nạp 3 stylesheet), lặp lại ở tầng probe. Nay quét TOÀN BỘ `app/**/*.tsx|ts`
//    và trừ `app/components/ui` (chính thư viện — đếm nó sẽ tính nhầm thành màn hình).
//
// 2) BÓC CHÚ THÍCH TRƯỚC KHI DÒ: nếu không, chỉ cần một dòng `// .staff-toolbar` trong mã là
//    báo động "còn toolbar riêng" giả — đúng lớp lỗi `canonical.css:1325` của D-062.
//    Bóc `/* … */` (gồm `{/* … */}` của JSX) và dòng `//` / `*`.
//
// ⛔ DANH SÁCH DẤU HIỆU KHÔNG BỊ XOÁ. Có 2 dấu hiệu không còn tệp UI nào dùng, nhưng
//    `staff-toolbar` / `staff-directory-head` / `delivery-timeline` VẪN CÒN CSS (đã ghi vào
//    `KNOWN_DEAD_CANONICAL` của `scripts/css-baseline-audit.mjs`) ⇒ giữ chúng làm VÉ BẢO VỆ
//    HỒI QUI có giá trị: nếu ai đó thêm lại lớp, CSS sẽ bắt được và probe này sẽ báo.
//    Mục D liệt kê rõ cái nào còn CSS, cái nào là bóng ma, để không ai tưởng là đã xoá.
//
// Cách dùng:
//   node tools/probe-list-toolbar-inventory.mjs            # bảng kiểm kê
//   node tools/probe-list-toolbar-inventory.mjs --detail   # kèm số dòng của từng dấu hiệu
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join, resolve, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const APP = join(ROOT, "app");
const UI_LIB = join(APP, "components", "ui");
const DETAIL = process.argv.includes("--detail");

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.tsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

// Bản thu MỌI phần mở rộng — dùng khi cần cả .css, không dùng để tìm màn hình.
function walkAny(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walkAny(full, out);
    else out.push(full);
  }
  return out;
}

// Bỏ chú thích để dấu hiệu chỉ được tính khi nằm trong MÃ THẬT (D-062).
function stripComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .split(/\r?\n/)
    .map((line) => (/^\s*(\/\/|\*)/.test(line) ? "" : line))
    .join("\n");
}

const screenFiles = walk(APP).filter((f) => !f.startsWith(UI_LIB + sep)).sort();

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

const rows = [];
const signalTotals = new Map(); // cls -> { count, files:Set }

for (const file of screenFiles) {
  const rel = relative(ROOT, file).replace(/\\/g, "/");
  const lines = stripComments(readFileSync(file, "utf8")).split(/\r?\n/);
  const screens = new Map();
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
      const total = signalTotals.get(cls) || { count: 0, files: new Set() };
      total.count += count;
      total.files.add(rel);
      signalTotals.set(cls, total);
    }
  });

  for (const [name, entry] of screens) {
    const hits = [...entry.signals.entries()];
    if (!hits.length) continue;
    const groups = new Set(hits.map(([, v]) => v.group));
    const standardized = groups.has("DA-CHUAN-HOA");
    const needsWork = [...groups].some((g) => g !== "DA-CHUAN-HOA");
    rows.push({
      file: rel,
      name,
      line: entry.line,
      hits: hits.map(([cls, v]) => cls + "×" + v.count).join(" · "),
      verdict: standardized && !needsWork ? "DA-CHUAN-HOA" : needsWork ? "CAN-CHUYEN" : "-",
      detail: hits.map(([cls, v]) => cls + "@" + v.lines.join(",")).join("  "),
    });
  }
}

rows.sort((a, b) => (a.file === b.file ? a.line - b.line : a.file.localeCompare(b.file)));

// CSS còn định nghĩa lớp nào không — để phân biệt "vé bảo vệ hồi qui" với "bóng ma".
// ⚠️ Dùng walker RIÊNG cho .css: `walk()` ở trên chỉ thu .tsx|.ts, dùng lại nó ở đây sẽ
//    lặng lẽ cho allCss = "" và mọi lớp đều bị gán nhầm "không CSS".
let allCss = "";
for (const f of walkAny(APP)) if (/\.css$/.test(f)) allCss += readFileSync(f, "utf8");

console.log("═".repeat(104));
console.log("  KIỂM KÊ TOOLBAR DANH SÁCH — toàn bộ app/**/*.tsx");
console.log("  " + screenFiles.length + " tệp màn hình đã quét (đã trừ app/components/ui)");
console.log("═".repeat(104));
console.log("");
console.log(String("TỆP").padEnd(38) + String("HÀM").padEnd(26) + String("DÒNG").padEnd(7) + String("PHÂN LOẠI").padEnd(14) + "DẤU HIỆU");
console.log("-".repeat(104));
for (const r of rows) {
  console.log(String(r.file).padEnd(38) + String(r.name).padEnd(26) + String(r.line).padEnd(7) + String(r.verdict).padEnd(14) + r.hits);
  if (DETAIL) console.log("   " + " ".repeat(68) + r.detail);
}

const canChuyen = rows.filter((r) => r.verdict === "CAN-CHUYEN");
const daChuan = rows.filter((r) => r.verdict === "DA-CHUAN-HOA");

console.log("");
console.log("─".repeat(104));
console.log("D. DẤU HIỆU KHÔNG CÒN TRONG MÃ UI — giữ làm vé bảo vệ hồi qui");
console.log("-".repeat(104));
const ghosts = [];
for (const [cls, group] of SIGNALS) {
  const total = signalTotals.get(cls);
  if (total) continue;
  const hasCss = new RegExp("\\." + cls + "(?![\\w-])").test(allCss);
  ghosts.push(cls + (hasCss ? "  ⟵ CÒN CSS · cảnh báo hồi qui có tác dụng" : "  ⟵ không CSS · bóng ma thuần"));
  if (hasCss) void group;
}
if (!ghosts.length) console.log("  (không có — mọi dấu hiệu đều còn được dùng)");
else ghosts.forEach((g) => console.log("  " + g));
console.log("  Nhóm của các dấu hiệu trên: " + SIGNALS.filter(([c]) => !signalTotals.has(c)).map(([c]) => c).join(" · "));

console.log("");
console.log("─".repeat(104));
console.log("CẦN CHUYỂN : " + canChuyen.length);
console.log("ĐÃ CHUẨN   : " + daChuan.length);
console.log("─".repeat(104));