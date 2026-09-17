// So sánh THUẬT TOÁN `canonicalMeCode` giữa JS và Java — mô phỏng lại ĐÚNG như mã viết ở hai phía.
//
// VÌ SAO: khi chuẩn bị port `import_material_catalog` (TASK-040 nhóm 3b) tôi phát hiện `canonicalMeCode`
// đã tồn tại ở Java (BoqManagementUseCase:943) nhưng KHÁC JS ở chỗ JS khớp theo TIỀN TỐ còn Java khớp ĐÚNG BẰNG.
//
// ⚠ GIỚI HẠN: script này mô phỏng lại hai thuật toán đã đọc từ mã nguồn (không gọi mã Java thật). Nó chứng minh
// hai THUẬT TOÁN khác nhau trên cùng đầu vào; muốn chứng minh hành vi Java thật thì phải gọi action có dùng nó.
//
// JS  (scripts/system-route.mjs:44-54):
//    raw = clean(v).NFD bỏ dấu, đ→d, UPPERCASE, bỏ [^A-Z0-9]
//    ELV|DNHE|DIENNHE hoặc startsWith → DNHE ; DIEN|ELECTRICAL hoặc startsWith → DIEN ; …
// Java (BoqManagementUseCase:943-952):
//    raw = MaterialMatcherV2.normalizeMaterialText(v) rồi bỏ [^a-z0-9]
//    chỉ so BẰNG (List.contains) — KHÔNG có startsWith
//
// Chạy: node tools/probe-canonical-me-code-drift.mjs

// ---- JS phía: dựng lại đúng mã nguồn JS ----
const cleanJs = (v) => String(v ?? "").trim();
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

// ---- Java phía: dựng lại ĐÚNG hai bước mà BoqManagementUseCase dùng ----
// Bước 1: MaterialMatcherV2.normalizeMaterialText (domain) — giữ + . / - và khoảng trắng
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
function javaCanonical(value) {
  const raw = javaNormalizeMaterialText(value).replace(/[^a-z0-9]/g, "");
  if (["dien", "electrical"].includes(raw)) return "DIEN";
  if (["ctn", "nuoc", "capthoatnuoc", "plumbing"].includes(raw)) return "CTN";
  if (["hvac", "dieuhoathonggio"].includes(raw)) return "HVAC";
  if (["dnhe", "diennhe", "elv"].includes(raw)) return "DNHE";
  if (["pccc", "fire"].includes(raw)) return "PCCC";
  return "KHAC";
}

// ---- đầu vào thử: các mã hệ M&E thật + biến thể có hậu tố ----
const cases = [
  "DIEN", "Điện", "DIEN LUC", "Điện lực", "dien-nhe", "DIENNHE", "ELV", "ELV-1", "DNHE", "DNHE_2",
  "CTN", "Cấp thoát nước", "CAP THOAT NUOC", "PLUMBING", "PCCC", "Fire", "PCCC-01", "HVAC", "Điều hoà thông gió",
  "DIEUHOATHONGGIO", "KHAC", "OTHER", "Vật tư khác", "", "  ", "XYZ", "DIEN123", "DIEN.TU",
];

console.log("đầu vào".padEnd(24) + "JS".padEnd(8) + "Java".padEnd(8) + "kết luận");
console.log("─".repeat(56));
let drift = 0;
for (const c of cases) {
  const a = jsCanonical(c), b = javaCanonical(c);
  const same = a === b;
  if (!same) drift += 1;
  console.log(`${JSON.stringify(c).padEnd(24)}${a.padEnd(8)}${b.padEnd(8)}${same ? "khớp" : "LỆCH"}`);
}
console.log("─".repeat(56));
console.log(`${cases.length} đầu vào · ${drift} LỆCH`);

// ---- kiểm tất định: chứng minh nguyên nhân là THIẾU startsWith ----
console.log("\nNguyên nhân — các hậu tố này làm JS khớp tiền tố còn Java thì không:");
for (const suffix of ["123", "-01", ".TU", " LUC", "_2"]) {
  const input = "DIEN" + suffix;
  console.log(`  "DIEN${suffix}" -> JS ${jsCanonical(input)} · Java ${javaCanonical(input)}`);
}

process.exitCode = drift ? 1 : 0;
