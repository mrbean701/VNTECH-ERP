// MỤC 8/8 — CHUẨN HOÁ MÃ VẬT TƯ THEO PHƯƠNG ÁN A
//
// Yêu cầu người dùng: «Hiện tại trong db tất cả các trường liên quan đến ID hoặc code
// đang ở dạng hash rất khó để kiểm soát - hiển thị - truy xuất... Ví dụ như ID của vật
// tư nên chuyển về dạng số hoặc không cần hash nữa mà kết hợp giữa text và số
// (Mã hệ + mã nhóm + mã vật tư).»
//
// PHƯƠNG ÁN A (đã chốt): GIỮ `id` hash làm khoá nội bộ (invisible), chuẩn hoá `code`
// thành định danh hiển thị `<MÃ HỆ>-<MÃ NHÓM>-<STT>`.
//
// VÌ SAO AN TOÀN: đã kiểm chứng chỉ 4 cột lưu mã vật tư dạng text
// (boq_source_items.contract_material_code / approved_material_code,
//  project_boq_items.contract_material_code / approved_material_code)
// và CẢ 4 ĐỀU RỖNG (0 dòng) ⇒ đổi mã không làm vỡ tham chiếu nào.
//
//   node tools/normalize-material-codes.mjs            # xem trước (dry-run)
//   node tools/normalize-material-codes.mjs --apply    # thực thi
import { execFileSync } from "node:child_process";

const MYSQL = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
const DB = ["--default-character-set=utf8mb4", "-uvntech", "-pvntech", "vntech_erp"];
const APPLY = process.argv.includes("--apply");
const sql = (q) => execFileSync(MYSQL, [...DB, "-N", "-B", "-e", q], { encoding: "utf8" }).trim();

// ---------------------------------------------------------------------------
// BẢNG ÁNH XẠ TƯỜNG MINH — mỗi vật tư hiện có được gán hệ + nhóm + số thứ tự.
// Đây là phán đoán kỹ thuật dựa trên TÊN vật tư, KHÔNG phải suy diễn tự động.
// ---------------------------------------------------------------------------
const MAP = [
  // [mã cũ, hệ, nhóm, số, lý do]
  ["VL-CAPDIEN", "DIEN", "DAY-CAD",    1, "Cáp điện CV → hệ Điện, nhóm Dây cáp"],
  ["VT-DAY-CAD", "DIEN", "DAY-CAD",    2, "Dây cáp điện Cu/PVC → hệ Điện, nhóm Dây cáp"],
  ["VT-APT-32",  "DIEN", "THIET-BI",   1, "Aptomat MCB → hệ Điện, nhóm Thiết bị"],
  ["VT-ONG-CTS", "DIEN", "ONG-LUON",   1, "Ống thép luồn dây → hệ Điện, nhóm Ống luồn dây"],
  ["VL-ONGPVC",  "CTN",  "ONG-NHUA",   1, "Ống nhựa PVC D60 → hệ Cấp thoát nước"],
  ["VT-ONG-PVC", "CTN",  "ONG-NHUA",   2, "Ống nhựa PVC D21 → hệ Cấp thoát nước"],
  ["VT-VAN-CB",  "CTN",  "VAN",        1, "Van cân bằng DN50 → hệ Cấp thoát nước, nhóm Van"],
  ["VT-ONG-GIO", "HVAC", "ONG-GIO",    1, "Ống gió tráng kẽm → hệ HVAC"],
  ["VL-GACH",    "KHAC", "VLXD",       1, "Gạch ống → vật liệu xây dựng (ngoài M&E)"],
  ["VL-GACHMEN", "KHAC", "VLXD",       2, "Gạch men → vật liệu xây dựng"],
  ["VL-SAT02",   "KHAC", "VLXD",       3, "Sắt phi 12 → vật liệu xây dựng"],
  ["VL-THEP",    "KHAC", "VLXD",       4, "Thép hộp → vật liệu xây dựng"],
  ["VL-XIMANG",  "KHAC", "VLXD",       5, "Xi măng → vật liệu xây dựng"],
  ["VL-SON",     "KHAC", "VLXD",       6, "Sơn chống thấm → vật liệu xây dựng"],
];

const SUBCATS = [
  ["DIEN", "DAY-CAD",   "Dây cáp điện"],
  ["DIEN", "THIET-BI",  "Thiết bị điện"],
  ["DIEN", "ONG-LUON",  "Ống luồn dây"],
  ["CTN",  "ONG-NHUA",  "Ống nhựa cấp thoát nước"],
  ["CTN",  "VAN",       "Van và phụ kiện"],
  ["HVAC", "ONG-GIO",   "Ống gió"],
  ["KHAC", "VLXD",      "Vật liệu xây dựng"],
];

const newCode = (h, g, n) => `${h}-${g}-${String(n).padStart(3, "0")}`;

console.log("═".repeat(78));
console.log(`  MỤC 8/8 — CHUẨN HOÁ MÃ VẬT TƯ ${APPLY ? "(THỰC THI)" : "(XEM TRƯỚC — dry-run)"}`);
console.log("═".repeat(78));

// kiểm tra an toàn: 4 cột text phải rỗng
const risky = sql(`SELECT
  (SELECT COUNT(*) FROM boq_source_items WHERE contract_material_code IS NOT NULL AND contract_material_code<>'')
 +(SELECT COUNT(*) FROM boq_source_items WHERE approved_material_code IS NOT NULL AND approved_material_code<>'')
 +(SELECT COUNT(*) FROM project_boq_items WHERE contract_material_code IS NOT NULL AND contract_material_code<>'')
 +(SELECT COUNT(*) FROM project_boq_items WHERE approved_material_code IS NOT NULL AND approved_material_code<>'');`);
console.log(`\n▸ Kiểm tra an toàn: ${risky} tham chiếu mã dạng text ${risky === "0" ? "→ AN TOÀN ✅" : "→ CÓ DỮ LIỆU, DỪNG LẠI ⛔"}`);
if (risky !== "0") { console.log("DỪNG: đổi mã sẽ làm vỡ tham chiếu text."); process.exit(1); }

console.log("\n▸ Bảng ánh xạ mã cũ → mã mới");
const stmts = [];
for (const [oldCode, sys, grp, n, why] of MAP) {
  const nw = newCode(sys, grp, n);
  const exists = sql(`SELECT COUNT(*) FROM materials WHERE code='${oldCode}';`);
  console.log(`  ${exists === "1" ? "•" : "✗"} ${oldCode.padEnd(13)} → ${nw.padEnd(22)} ${why}`);
  if (exists !== "1") { console.log(`     ⚠️  không tìm thấy mã cũ, bỏ qua`); continue; }
  stmts.push(`UPDATE materials SET code='${nw}' WHERE code='${oldCode}';`);
}

if (!APPLY) {
  console.log(`\n▸ Sẽ tạo ${SUBCATS.length} nhóm và cập nhật ${stmts.length} vật tư.`);
  console.log("  Chạy lại với --apply để thực thi.");
  process.exit(0);
}

// 1) tạo nhóm (nếu chưa có)
console.log("\n▸ Tạo nhóm vật tư");
for (const [idx, [sys, grp, name]] of SUBCATS.entries()) {
  const catId = `CAT-${sys}`;
  const subCode = `${sys}-${grp}`;
  const esc = name.replace(/'/g, "''");
  stmts.unshift(
    `INSERT INTO material_subcategories (id, code, name, category_id, active, sort_order, created_at, updated_at)
     SELECT '${subCode}', '${grp}', '${esc}', '${catId}', 1, ${(idx + 1) * 10}, NOW(3), NOW(3)
     WHERE NOT EXISTS (SELECT 1 FROM material_subcategories WHERE id='${subCode}');`
  );
  console.log(`  ${subCode} · ${name}`);
}

// 2) gán hệ/nhóm cho vật tư + 3) ghi vết đổi mã
console.log("\n▸ Gán hệ/nhóm và đổi mã");
for (const [oldCode, sys, grp, n] of MAP) {
  const nw = newCode(sys, grp, n);
  stmts.push(`UPDATE materials SET category_id='CAT-${sys}', subcategory_id='${sys}-${grp}' WHERE code='${nw}';`);
  stmts.push(`INSERT INTO material_code_history (id, material_id, old_code, new_code, reason, changed_by, changed_at)
     SELECT CONCAT('MCH-', REPLACE(UUID(),'-','')), id, '${oldCode}', '${nw}', 'Mục 8/8 — chuẩn hoá mã theo Mã hệ + mã nhóm + STT', 'system', NOW(3)
     FROM materials WHERE code='${nw}';`);
}

const batch = stmts.join("\n");
try {
  execFileSync(MYSQL, [...DB, "-e", batch], { encoding: "utf8" });
  console.log(`\n✅ Đã thực thi ${stmts.length} câu lệnh.`);
} catch (e) {
  console.error("\n⛔ LỖI khi thực thi:\n" + (e.stderr || e.message));
  process.exit(1);
}

console.log("\n▸ Kết quả");
console.log(sql(`SELECT m.code, LEFT(m.name,34) AS ten, m.category_id, m.subcategory_id FROM materials m ORDER BY m.code;`));
console.log("\n▸ Vết đổi mã");
console.log(sql(`SELECT old_code, new_code, COUNT(*) FROM material_code_history GROUP BY old_code, new_code LIMIT 20;`));
