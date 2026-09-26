// Q10 — KHẢO SÁT LẠI `materials.system` LỆCH (người dùng yêu cầu "khảo sát lại").
//
// CÂU HỎI: có bao nhiêu mã có `system` KHÁC với `canonicalMeCode(category.code)`? Vì sao? Nguồn ghi nào?
// KHÔNG tự sửa dữ liệu — chỉ đo và đề xuất (người dùng từng yêu cầu KHÔNG tự sửa lớp dữ liệu này).
//
//   node tools/probe-q10-materials-system.mjs
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const MYSQL = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
const q = (sql) => execFileSync(MYSQL, ["-uvntech", "-pvntech", "--default-character-set=utf8mb4", "-N", "-B", "vntech_erp", "-e", sql], { encoding: "utf8" }).trim();
const rows = (sql) => q(sql).split(/\r?\n/).filter(Boolean).map((l) => l.split("\t"));

// ── 1. Bản sao quy tắc `canonicalMeCode` — đọc TỪ NGUỒN để không chép tay ────────────────────
// ⚠️ LƯỢT ĐO ĐẦU CỦA CHÍNH PROBE NÀY ĐÃ SAI: regex cũ không khớp định dạng tệp ⇒ đọc được **0 cặp mã**
// ⇒ hàm suy luận luôn trả "KHAC" ⇒ in ra "7 mã lệch" (HIỆN VẬT CỦA PROBE, không phải dữ liệu).
// Nay port ĐÚNG chuỗi luật của `MaterialSystemCodes.canonicalMeCode` (NFD → bỏ dấu → đ→d → UPPER → [A-Z0-9])
// và đọc danh sách mã TỪ CHÍNH TỆP NGUỒN.
const java = readFileSync("java-backend/domain/src/main/java/com/vntech/erp/domain/service/MaterialSystemCodes.java", "utf8");
const body = java.slice(java.indexOf("canonicalMeCode"), java.indexOf("internalGroupCode"));
const systems = [...new Set([...body.matchAll(/return "([A-Z]+)";/g)].map((m) => m[1]))];
const groups = {};
for (const m of body.matchAll(new RegExp(`if \\(contains\\((List\\.of\\([^)]*\\)), raw\\)([\\s\\S]*?)return "([A-Z]+)";`, "g"))) {
  const literals = [...m[1].matchAll(/"([A-Z0-9]+)"/g)].map((x) => x[1]);
  const prefixes = [...m[2].matchAll(/raw\\.startsWith\\("([A-Z0-9]+)"\\)/g)].map((x) => x[1]);
  groups[m[3]] = { literals, prefixes };
}
console.log("=== 1. Luật `canonicalMeCode` đọc từ MaterialSystemCodes.java ===");
console.log(`  hệ M&E: ${systems.join(", ")}`);
for (const [sys, g] of Object.entries(groups)) console.log(`  ${sys}: contains[${g.literals.join(",")}] · startsWith[${g.prefixes.join(",")}]`);
if (!Object.keys(groups).length) { console.error("  ✖ Không đọc được luật ⇒ DỪNG (không kết luận)."); process.exit(1); }

const normalize = (s) => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z0-9]+/g, "");
const canonical = (code) => {
  const raw = normalize(code);
  if (!raw) return "KHAC";
  for (const [sys, g] of Object.entries(groups)) {
    if (g.literals.some((lit) => raw.includes(lit)) || g.prefixes.some((p) => raw.startsWith(p))) return sys;
  }
  return "KHAC";
};
// ĐỐI CHỨNG DƯƠNG: bộ suy luận phải cho kết quả đúng trên các đầu vào đã biết của chính tệp nguồn.
const controls = [["DIEN", "DIEN"], ["Điện lực", "DIEN"], ["CTN", "CTN"], ["HVAC-ONG-GIO", "HVAC"], ["PCCC-01", "PCCC"], ["ELV-1", "DNHE"], ["KHONG-RO", "KHAC"]];
let controlOk = 0;
for (const [input, expect] of controls) { if (canonical(input) === expect) controlOk++; else console.error(`  ✖ ĐỐI CHỨNG: canonical("${input}") = ${canonical(input)} (cần ${expect})`); }
console.log(`  ĐỐI CHỨNG DƯƠNG: ${controlOk}/${controls.length} đầu vào khớp luật`);
if (controlOk !== controls.length) { console.error("  ✖ Đối chứng không đạt ⇒ KHÔNG kết luận về dữ liệu."); process.exit(1); }

// ── 2. Đối chiếu từng mã vật tư ─────────────────────────────────────────────────────────────
const data = rows(`
  SELECT m.code, COALESCE(m.system,''), COALESCE(c.code,''), COALESCE(c.name,''), m.created_at, m.updated_at
  FROM materials m LEFT JOIN material_categories c ON c.id = m.category_id
  ORDER BY m.code;`);
console.log(`\n=== 2. Đối chiếu ${data.length} mã vật tư (system thật ↔ suy ra từ mã nhóm) ===`);
const mismatches = [];
for (const [code, sys, catCode, catName, created, updated] of data) {
  const expect = canonical(catCode);
  const okRow = sys === expect;
  if (!okRow) mismatches.push({ code, sys, catCode, catName, expect, created, updated });
  console.log(`  ${okRow ? "✔" : "✖"} ${code.padEnd(20)} system=${sys.padEnd(6)} nhóm=${catCode.padEnd(18)} suy ra=${expect.padEnd(6)} tạo=${created} sửa=${updated}`);
}
console.log(`\n=== 3. KẾT LUẬN: ${mismatches.length} mã LỆCH / ${data.length} mã ===`);
for (const m of mismatches) console.log(`  • ${m.code}: system="${m.sys}" nhưng nhóm "${m.catCode}" (${m.catName}) ⇒ phải là "${m.expect}"`);

// ── 3. Truy vết nguồn ghi: nhật ký kiểm toán quanh 2 mã lệch ────────────────────────────────
console.log("\n=== 4. Nhật ký kiểm toán liên quan (nếu có) ===");
try {
  const audit = q("SELECT CONCAT(created_at,' · ',COALESCE(action,''),' · ',COALESCE(entity_type,''),' · ',COALESCE(entity_id,'')) FROM audit_logs WHERE entity_type IN ('material','material_catalog') ORDER BY created_at DESC LIMIT 12");
  console.log(audit ? audit.split(/\r?\n/).map((l) => "  " + l).join("\n") : "  (không có dòng nào)");
} catch (e) { console.log("  (không đọc được audit_logs: " + String(e.message).slice(0, 80) + ")"); }

console.log("\n=== 5. Đề xuất (KHÔNG tự sửa) ===");
console.log("  Nếu người dùng đồng ý: UPDATE materials SET system=<suy ra> WHERE code IN (…danh sách trên…) — kèm probe đối chứng trước/sau.");
