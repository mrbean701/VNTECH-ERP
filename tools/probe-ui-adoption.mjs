// U-14…U-17 — ĐO MỨC ĐỘ ÁP DỤNG THẬT CỦA THƯ VIỆN UI DÙNG CHUNG
//
// VÌ SAO CẦN: ngày 17/09/2026 tôi phát hiện roadmap đánh DONE các mục U-01/U-02/U-04/U-06/U-07
// trong khi số lần DÙNG THẬT của chúng trong ứng dụng = 0 — tức mới DỰNG KHUNG, chưa áp dụng.
// "Đã tạo tệp" KHÔNG phải là "đã dùng": giá trị thật của việc tái sử dụng nằm ở chỗ các màn
// thực sự gọi tới thành phần dùng chung.
//
// Công cụ này đo hai phía:
//   1. Thành phần dùng chung  — số lần được dùng THẬT (không tính chính thư viện).
//   2. Mẫu cũ còn tồn         — số chỗ vẫn tự viết, tức khối lượng còn phải chuyển.
//
// Cách dùng: node tools/probe-ui-adoption.mjs
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const UI_DIR = join(ROOT, "app", "components", "ui");

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".next", "dist"].includes(entry.name)) continue;
      walk(full, out);
    } else if (/\.(tsx|ts)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

const all = walk(join(ROOT, "app"));
// LOẠI TRỪ chính thư viện: dùng đường dẫn tuyệt đối đã chuẩn hoá, không so khớp chuỗi mờ.
const outsideUi = all.filter((f) => !f.startsWith(UI_DIR + sep));
const pageFile = join(ROOT, "app", "page.tsx");

const count = (text, re) => (text.match(re) || []).length;
const readAll = (files) => files.map((f) => ({ f, t: readFileSync(f, "utf8") }));

const shared = [
  ["StatusBadge", "U-05"],
  ["PermissionGuard", "U-04"],
  ["ListToolbar", "U-03"],
  ["DataTable", "U-02"],
  ["ApprovalTimeline", "U-06"],
  ["ActivityTimeline", "U-07"],
  ["EntityDetailModal", "U-01 / U-10"],
];

console.log("═".repeat(84));
console.log("  MỨC ĐỘ ÁP DỤNG THẬT CỦA THƯ VIỆN UI DÙNG CHUNG");
console.log("═".repeat(84));
console.log("");
console.log("A. THÀNH PHẦN DÙNG CHUNG — số lần được gọi NGOÀI chính thư viện");
console.log("-".repeat(84));
const outside = readAll(outsideUi);
for (const [name, code] of shared) {
  const re = new RegExp("<" + name + "(?![A-Za-z])", "g");
  let total = 0;
  const where = [];
  for (const { f, t } of outside) {
    const n = count(t, re);
    if (n) { total += n; where.push(relative(ROOT, f).replace(/\\/g, "/") + " ×" + n); }
  }
  const verdict = total === 0 ? "CHUA AP DUNG" : "DANG DUNG";
  console.log(`  ${name.padEnd(18)} ${code.padEnd(12)} ${String(total).padStart(3)} lần   ${verdict}`);
  if (where.length) console.log(`      ${where.join(" · ")}`);
}

console.log("");
console.log("B. MẪU CŨ CÒN TỒN — khối lượng còn phải chuyển");
console.log("-".repeat(84));
const page = readFileSync(pageFile, "utf8");
const legacy = [
  ["<Pill ...> tự tạo nhãn trạng thái", /<Pill(?![A-Za-z])/g, "U-15 · thay bằng StatusBadge"],
  ["bảng tự viết (className=table-wrap)", /className="table-wrap"/g, "U-15 · thay bằng DataTable"],
  ["trạng thái rỗng tự viết (<Empty)", /<Empty(?![A-Za-z])/g, "U-15 · DataTable có sẵn empty"],
  ["modal/drawer tự viết (className=overlay)", /className="overlay/g, "U-14 · thay bằng EntityDetailModal"],
  ["điều kiện quyền rải rác", /canUse\s*&&|permission\.[A-Za-z]+\s*&&/g, "U-16 · thay bằng PermissionGuard"],
  ["dải phê duyệt/lịch sử tự viết", /className="timeline"|className="supply-timeline"|className="delivery-timeline"/g, "U-17 · thay bằng Approval/ActivityTimeline"],
];
for (const [label, re, note] of legacy) {
  console.log(`  ${String(count(page, re)).padStart(4)} chỗ   ${label.padEnd(42)} → ${note}`);
}

console.log("");
console.log("C. QUY MÔ TỆP CẦN TÁCH (U-11)");
console.log("-".repeat(84));
console.log(`  app/page.tsx: ${page.split(/\r?\n/).length} dòng · ${count(page, /^(?:export )?(?:default )?function [A-Za-z0-9_]+\(/gm)} hàm top-level`);
console.log("═".repeat(84));
