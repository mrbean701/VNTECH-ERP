// So sánh thuật toán `canonicalMeCode` giữa JS (nguồn sự thật) và Java HIỆN TẠI, kèm ĐỐI CHỨNG DƯƠNG
// bằng chính bản Java CŨ đã bị vá ở #52.
//
// ⚠ LỊCH SỬ CỦA CHÍNH CÔNG CỤ NÀY: bản đầu chỉ có hai cột "JS" và "Java" với "Java" là bản **CŨ**
// (chỉ so ĐÚNG BẰNG, thiếu các nhánh `startsWith`). Sau khi vá Java ở #52, công cụ vẫn in "7 LỆCH" —
// **gây hiểu nhầm là Java còn lỗi**. Nay tách rõ ba cột:
//   JS            = nguồn sự thật (scripts/system-route.mjs:44-54)
//   Java HIỆN TẠI = logic đang có trong domain/service/MaterialSystemCodes.java
//   Java CŨ       = bản đã bị vá (đối chứng dương: PHẢI còn lệch, chứng minh phép đo không vô dụng)
//
// ⚠ GIỚI HẠN: đây là mô phỏng lại ba thuật toán đã đọc từ mã nguồn (không gọi mã Java thật). Muốn chứng minh
// hành vi Java thật thì phải gọi action có dùng nó; tính đúng của bản Java hiện tại đã được khoá bằng
// **unit test** `MaterialSystemCodesTest` (5 ca, gồm đúng 7 ca từng lệch).
//
// Chạy: node tools/probe-canonical-me-code-drift.mjs
const cleanJs = (v) => String(v ?? "").trim();

/** Nguồn sự thật — nguyên văn JS `system-route.mjs:44-54`. */
function jsCanonical(value) {
  const raw = cleanJs(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d")
    .toUpperCase().replace(/[^A-Z0-9]+/g, "");
  if (!raw) return "KHAC";
  if (["ELV", "DNHE", "DIENNHE"].includes(raw) || raw.startsWith("DNHE") || raw.startsWith("ELV") || raw.startsWith("DIENNHE")) return "DNHE";
  if (["DIEN", "ELECTRICAL"].includes(raw) || raw.startsWith("DIEN")) return "DIEN";
  if (["CTN", "NUOC", "CAPTHOATNUOC", "PLUMBING"].includes(raw) || raw.startsWith("CTN")) return "CTN";
  if (["HVAC", "DIEUHOATHONGGIO"].includes(raw) || raw.startsWith("HVAC")) return "HVAC";
  if (["PCCC", "FIRE"].includes(raw) || raw.startsWith("PCCC")) return "PCCC";
  if (raw === "KHAC" || raw === "OTHER") return "KHAC";
  return "KHAC";
}

/** Mô phỏng bản Java CŨ (trước #52): dùng normalizeMaterialText rồi chỉ so ĐÚNG BẰNG. */
function javaNormalizeMaterialText(value) {
  let s = String(value == null ? "" : value).replace("²", "2").replace("³", "3");
  s = s.normalize("NFD").replace(/\p{M}/gu, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase()
    .replace("ø", " d ")
    .replace(/\bphi\s*(\d+(?:[.,]\d+)?)/g, " d$1 ")
    .replace(/\bdn\s*(\d+(?:[.,]\d+)?)/g, " dn$1 ")
    .replace(/\bmm\s*2\b/g, "mm2")
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9+./-]+/g, " ")
    .replace(/\s+/g, " ").trim();
  return s;
}
function javaCanonicalOld(value) {
  const raw = javaNormalizeMaterialText(value).replace(/[^a-z0-9]/g, "");
  if (["dien", "electrical"].includes(raw)) return "DIEN";
  if (["ctn", "nuoc", "capthoatnuoc", "plumbing"].includes(raw)) return "CTN";
  if (["hvac", "dieuhoathonggio"].includes(raw)) return "HVAC";
  if (["dnhe", "diennhe", "elv"].includes(raw)) return "DNHE";
  if (["pccc", "fire"].includes(raw)) return "PCCC";
  return "KHAC";
}

/**
 * Mô phỏng bản Java HIỆN TẠI — `domain/service/MaterialSystemCodes.canonicalMeCode`:
 * NFD bỏ dấu, thay TƯỜNG MINH `đ`/`Đ` (không dùng `(?i)` vì cờ đó chỉ case-fold ASCII),
 * UPPERCASE, bỏ ký tự không phải chữ-số, rồi có ĐỦ các nhánh `startsWith`.
 */
function javaCanonicalNow(value) {
  const raw = cleanJs(value).normalize("NFD").replace(/\p{M}+/gu, "")
    .replace(/đ/g, "d").replace(/Đ/g, "D")
    .toUpperCase().replace(/[^A-Z0-9]+/g, "");
  if (!raw) return "KHAC";
  if (["ELV", "DNHE", "DIENNHE"].includes(raw) || raw.startsWith("DNHE") || raw.startsWith("ELV") || raw.startsWith("DIENNHE")) return "DNHE";
  if (["DIEN", "ELECTRICAL"].includes(raw) || raw.startsWith("DIEN")) return "DIEN";
  if (["CTN", "NUOC", "CAPTHOATNUOC", "PLUMBING"].includes(raw) || raw.startsWith("CTN")) return "CTN";
  if (["HVAC", "DIEUHOATHONGGIO"].includes(raw) || raw.startsWith("HVAC")) return "HVAC";
  if (["PCCC", "FIRE"].includes(raw) || raw.startsWith("PCCC")) return "PCCC";
  if (raw === "KHAC" || raw === "OTHER") return "KHAC";
  return "KHAC";
}

const cases = [
  "DIEN", "Điện", "DIEN LUC", "Điện lực", "dien-nhe", "DIENNHE", "ELV", "ELV-1", "DNHE", "DNHE_2",
  "CTN", "Cấp thoát nước", "CAP THOAT NUOC", "PLUMBING", "PCCC", "Fire", "PCCC-01", "HVAC", "Điều hoà thông gió",
  "DIEUHOATHONGGIO", "KHAC", "OTHER", "Vật tư khác", "", "  ", "XYZ", "DIEN123", "DIEN.TU",
];

console.log("đầu vào".padEnd(22) + "JS".padEnd(7) + "JavaNay".padEnd(10) + "JavaCu".padEnd(9) + "JS↔Nay   JS↔Cũ");
console.log("─".repeat(74));
let driftNow = 0, driftOld = 0;
for (const c of cases) {
  const js = jsCanonical(c), now = javaCanonicalNow(c), old = javaCanonicalOld(c);
  const sameNow = js === now, sameOld = js === old;
  if (!sameNow) driftNow += 1;
  if (!sameOld) driftOld += 1;
  console.log(`${JSON.stringify(c).padEnd(22)}${js.padEnd(7)}${now.padEnd(10)}${old.padEnd(9)}`
    + `${sameNow ? "khớp" : "LỆCH"}`.padEnd(10) + (sameOld ? "khớp" : "LỆCH"));
}
console.log("─".repeat(74));
console.log(`${cases.length} đầu vào · JS↔Java HIỆN TẠI: ${driftNow} lệch · JS↔Java CŨ: ${driftOld} lệch`);

// ---- ĐỐI CHỨNG DƯƠNG: bản cũ PHẢI còn lệch, nếu không thì phép đo vô dụng ----
console.log("\n──── ĐỐI CHỨNG DƯƠNG ────");
if (driftOld === 0) {
  console.log("  ✖ CÔNG CỤ HỎNG: bản Java CŨ đã lệch 7/28 khi vá ở #52, nay lại khớp hết ⇒ phép đo không đáng tin.");
  process.exitCode = 2;
} else {
  console.log(`  ✔ Bản Java CŨ vẫn lệch ${driftOld}/${cases.length} — đúng như đã đo trước khi vá ⇒ phép đo có giá trị.`);
}

if (driftNow === 0) {
  console.log("KẾT LUẬN: Java HIỆN TẠI khớp JS trên toàn bộ đầu vào thử ✅ (khoá thêm bằng unit test MaterialSystemCodesTest)");
  process.exitCode = 0;
} else {
  console.log(`KẾT LUẬN: Java HIỆN TẠI còn lệch ${driftNow} đầu vào ⚠`);
  process.exitCode = 1;
}
