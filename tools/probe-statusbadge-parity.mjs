// KIỂM CHỨNG TƯƠNG ĐƯƠNG: toneOf() của StatusBadge  PHẢI  giống hệt logic của <Pill> cũ.
//
// VÌ SAO CẦN: mục U-15 yêu cầu thay 88 chỗ <Pill> bằng <StatusBadge>. Nếu hai hàm suy luận màu
// khác nhau thì việc thay thế là THAY ĐỔI GIAO DIỆN — mà cổng ảnh đang không chạy được (TASK-B02)
// nên sẽ không có cách nào phát hiện lệch. Vì vậy phải chứng minh tương đương Ở MỨC MÃ NGUỒN.
//
// Đã phát hiện một khác biệt thật: <Pill> dùng `lower === "đạt"` (SO SÁNH BẰNG) còn StatusBadge
// ban đầu dùng `includes("đạt")` ⇒ giá trị "Chưa đạt" cho ra XANH DƯƠNG ở Pill nhưng XANH LÁ ở
// StatusBadge. Đã sửa StatusBadge cho khớp; công cụ này khoá lại để không tái diễn.
//
//   node tools/probe-statusbadge-parity.mjs
//
// KỸ THUẬT: KHÔNG import tệp .tsx (cần tsx/esbuild, mà esbuild spawn tiến trình con nên bị EPERM
// dưới sandbox). Thay vào đó ĐỌC TRỰC TIẾP StatusBadge.tsx và lấy ra **cả hằng số lẫn thân hàm**
// rồi dựng hàm bằng new Function — nhờ vậy không chép lại logic, và nếu ai sửa tệp thì công cụ
// này phát hiện ngay.
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SB = readFileSync(join(ROOT, "app", "components", "ui", "StatusBadge.tsx"), "utf8");

function grabArray(name) {
  const m = SB.match(new RegExp("const " + name + "\\s*=\\s*(\\[[^\\]]*\\])"));
  if (!m) throw new Error("Không tìm thấy hằng số " + name + " trong StatusBadge.tsx");
  return m[1];
}
const fnMatch = SB.match(/export function toneOf\(value: unknown\): Tone \{([\s\S]*?)\n\}/);
if (!fnMatch) throw new Error("Không tìm thấy thân hàm toneOf trong StatusBadge.tsx");

const toneOf = new Function(`
  const GREEN_HINTS = ${grabArray("GREEN_HINTS")};
  const GREEN_EXACT = ${grabArray("GREEN_EXACT")};
  const RED_HINTS = ${grabArray("RED_HINTS")};
  const AMBER_HINTS = ${grabArray("AMBER_HINTS")};
  return function toneOf(value) {${fnMatch[1]}
  };
`)();

// ---- Bản tham chiếu: logic của <Pill> chép NGUYÊN VĂN từ app/page.tsx (hàm Pill) ----
function pillTone(value) {
  const lower = String(value).toLowerCase();
  return lower.includes("đã") || lower.includes("đủ") || lower === "đạt" ? "green"
    : lower.includes("từ") || lower.includes("chặn") || lower.includes("trễ") || lower.includes("âm") || lower.includes("không") ? "red"
    : lower.includes("chờ") || lower.includes("đang") || lower.includes("thiếu") || lower.includes("partial") || lower.includes("dưới") ? "amber"
    : "blue";
}

// ---- Bộ giá trị kiểm thử ----
const curated = [
  "", " ", "đạt", "Đạt", "ĐẠT", "Chưa đạt", "chưa đạt", "Không đạt", "đạt yêu cầu", "chưa đủ đạt",
  "đã", "Đã duyệt", "Đã giao đủ", "đủ", "Đang hoạt động", "đang", "chờ", "Chờ duyệt", "Chờ BCH xác nhận",
  "từ chối", "Từ chối", "bị chặn", "trễ", "Trễ hẹn", "âm", "Không đạt", "không", "thiếu", "Thiếu CO/CQ",
  "partial", "dưới", "dưới mức tối thiểu", "pending_approval", "approved", "completed", "returned_to_requester",
  "in_progress", "cancelled", "rejected", "active", "closed", "archived", "paused", "urgent", "high", "normal",
  "Đang dùng", "Đã ngừng", "Đã thanh toán", "Quá hạn", "Sắp đến hạn", "Chưa quyết toán", "Đang giao", "Chưa giao",
  "Đã nhập kho", "Hoàn thành", "Đang thực hiện", "Chờ bên khác", "Cao", "Khẩn", "Thường",
  // Đầu vào không phải chuỗi
  null, undefined, 0, 1, 100, true, false,
  // Chuỗi dài có chứa nhiều từ khoá (kiểm thứ tự ưu tiên)
  "Đã duyệt nhưng đang chờ", "Chờ duyệt — không đạt", "đang thiếu", "đã đủ", "từ chối vì thiếu",
];

// ---- Lấy thêm giá trị THẬT từ mã nguồn: mọi <Pill value="chuỗi literal"> ----
const page = readFileSync(join(ROOT, "app", "page.tsx"), "utf8");
const fromCode = new Set();
for (const m of page.matchAll(/<Pill\s+value="([^"]*)"/g)) fromCode.add(m[1]);
// Giá trị literal bên trong biểu thức: value={"..."} hoặc value={cond ? "A" : "B"}
for (const m of page.matchAll(/<Pill\s+value=\{[^}]*\}/g)) {
  for (const s of m[0].matchAll(/"([^"]*)"/g)) fromCode.add(s[1]);
}

const all = [...curated, ...fromCode];
let bad = 0;
const seen = new Set();
for (const v of all) {
  const key = String(v);
  if (seen.has(key)) continue;
  seen.add(key);
  const a = pillTone(v), b = toneOf(v);
  if (a !== b) { bad++; console.log("  ❌ KHÁC NHAU  " + JSON.stringify(v) + "  → Pill=" + a + " · StatusBadge=" + b); }
}

console.log("═".repeat(78));
console.log("  TƯƠNG ĐƯƠNG  <Pill>  ↔  toneOf(StatusBadge)");
console.log("═".repeat(78));
console.log("  Số giá trị đã kiểm      : " + seen.size + "  (trong đó " + fromCode.size + " lấy từ mã nguồn)");
console.log("  Số giá trị KHÁC NHAU    : " + bad);
console.log(bad === 0
  ? "  KẾT LUẬN: ĐẠT ✅ — hai hàm cho kết quả GIỐNG HỆT với mọi giá trị đã kiểm.\n  ⇒ Thay <Pill> bằng <StatusBadge> KHÔNG làm đổi màu ở bất kỳ chỗ nào."
  : "  KẾT LUẬN: KHÔNG ĐẠT ❌ — còn " + bad + " giá trị cho màu khác nhau ⇒ KHÔNG được thay hàng loạt.");
console.log("═".repeat(78));
process.exit(bad === 0 ? 0 : 1);
