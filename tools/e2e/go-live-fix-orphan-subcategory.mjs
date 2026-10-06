/**
 * GO-LIVE — SỬA LỖI DỮ LIỆU: 9 MÃ VẬT TƯ CÓ `subcategory_id` MỒ CÔI.
 *
 * LỖI PHÁT HIỆN KHI CHẠY THẬT (02/10/2026, môi trường `:9000` → Java `:18081` → MySQL):
 *   9 mã vật tư trỏ tới `material_subcategories` KHÔNG TỒN TẠI:
 *     ELV-CAMERA-001 · ELV-DAY-MANG-001 · ELV-TU-DIEN-001 · HVAC-MAY-LANH-001
 *     KHAC-VAN-PHONG-001 · KHAC-VAN-PHONG-002
 *     PCCC-BINH-CHUA-CHAY-001 · PCCC-DAU-PHUN-001 · PCCC-ONG-THEP-001
 *   Đo được: `LEFT JOIN ... WHERE s.id IS NULL` → **9** dòng; hệ ELV và PCCC có **0** nhóm con.
 *   HẬU QUẢ THẬT: mọi lần lưu các mã này đều bị từ chối
 *     «Nhóm con không thuộc hệ M&E đã chọn.» ⇒ 9 mã bị ĐÓNG BĂNG, không sửa được giá/tên/ĐVT.
 *
 * CÁCH SỬA (không đoán, không xoá dữ liệu):
 *   1. Tạo ĐÚNG 8 nhóm con còn thiếu dưới đúng hệ của chúng (tên lấy theo mã + tên vật tư đang dùng).
 *   2. Gán lại 9 mã vật tư sang nhóm con VỪA TẠO (giữ nguyên mã, tên, ĐVT, giá).
 *   3. Đọc lại từ máy chủ: đếm lại số mồ côi (phải = 0) và bổ sung nốt tên phụ.
 *
 * ⛔ KHÔNG sửa bằng SQL tay: đi qua API thật để giữ nguyên mọi ràng buộc nghiệp vụ.
 * ⛔ Idempotent: chạy lại không nhân đôi (nhóm con có rồi thì dùng lại).
 */
import { login, bootstrap, coThat, buoc, tomTatBuoc, ghi, tieuDe } from "./client.mjs";

const BC = [];
const MK = "Admin123456@";

/** 8 nhóm con còn thiếu — suy từ chính `subcategory_id` đang mồ côi và tên vật tư đang dùng. */
const NHOM_CON_THIEU = [
  { code: "ELV-CAMERA", categoryId: "CAT-ELV", name: "Camera & quan sát", sortOrder: 10 },
  { code: "ELV-DAY-MANG", categoryId: "CAT-ELV", name: "Cáp mạng & truyền dẫn", sortOrder: 20 },
  { code: "ELV-TU-DIEN", categoryId: "CAT-ELV", name: "Tủ rack & thiết bị điện nhẹ", sortOrder: 30 },
  { code: "HVAC-MAY-LANH", categoryId: "CAT-HVAC", name: "Máy lạnh & điều hoà", sortOrder: 10 },
  { code: "KHAC-VAN-PHONG", categoryId: "CAT-KHAC", name: "Văn phòng phẩm", sortOrder: 10 },
  { code: "PCCC-BINH-CHUA-CHAY", categoryId: "CAT-PCCC", name: "Bình chữa cháy", sortOrder: 10 },
  { code: "PCCC-DAU-PHUN", categoryId: "CAT-PCCC", name: "Đầu phun sprinkler", sortOrder: 20 },
  { code: "PCCC-ONG-THEP", categoryId: "CAT-PCCC", name: "Ống thép PCCC", sortOrder: 30 },
];

/** Tên phụ cho 9 mã này (bản có dấu của tên gốc đang ghi không dấu). */
const TEN_PHU = {
  "ELV-CAMERA-001": ["Camera IP ngoài trời 4MP", "Camera IP 4MP"],
  "ELV-DAY-MANG-001": ["Cáp mạng Cat6 UTP", "Cáp mạng Cat6"],
  "ELV-TU-DIEN-001": ["Tủ rack 12U treo tường", "Tủ rack 12U"],
  "HVAC-MAY-LANH-001": ["Máy lạnh âm trần 24000BTU", "Máy lạnh âm trần 24k"],
  "KHAC-VAN-PHONG-001": ["Giấy A4 70gsm (thùng 5 ram)", "Giấy A4 70gsm"],
  "KHAC-VAN-PHONG-002": ["Mực in laser HP 85A", "Mực in HP 85A"],
  "PCCC-BINH-CHUA-CHAY-001": ["Bình chữa cháy MFZ4", "Bình chữa cháy bột 4kg"],
  "PCCC-DAU-PHUN-001": ["Đầu phun sprinkler 68°C", "Đầu phun 68 độ"],
  "PCCC-ONG-THEP-001": ["Ống thép đen PCCC D60", "Ống thép PCCC D60"],
};

tieuDe("GO-LIVE — SỬA LỖI 9 MÃ VẬT TƯ CÓ NHÓM CON MỒ CÔI");

await login("admin", MK);
let bs = await bootstrap();

const maVatTu = (b) => (Array.isArray(b.adminMaterials) ? b.adminMaterials : []);
const idNhomCon = (b, code) => (b.materialSubcategories || []).find((s) => String(s.code) === code)?.id;
const moCoi = (b) => {
  const co = new Set((b.materialSubcategories || []).map((s) => String(s.id)));
  return maVatTu(b).filter((m) => m.subcategoryId && !co.has(String(m.subcategoryId)));
};

const truoc = moCoi(bs);
console.log(`\n[TRƯỚC] vật tư có nhóm con MỒ CÔI = ${truoc.length}`);
for (const m of truoc) console.log(`      · ${m.code} → subcategoryId="${m.subcategoryId}" (không tồn tại)`);
console.log(`      Tổng nhóm con hiện có = ${(bs.materialSubcategories || []).length}`);

// ── BƯỚC 1: tạo 8 nhóm con còn thiếu ─────────────────────────────────────────
console.log("\n[BƯỚC 1] Tạo nhóm con còn thiếu");
for (const s of NHOM_CON_THIEU) {
  const daCo = idNhomCon(bs, s.code);
  if (daCo) { console.log(`      ✔ ${s.code} đã có (id=${daCo}) — bỏ qua`); continue; }
  await buoc(`save_material_subcategory ${s.code} (${s.name})`, () => coThat("save_material_subcategory", {
    categoryId: s.categoryId, code: s.code, name: s.name, sortOrder: s.sortOrder,
    description: `Nhóm con bổ sung khi sửa lỗi dữ liệu mồ côi (GO-LIVE 02/10/2026)`,
  }), BC);
  bs = await bootstrap();
}
console.log(`      Tổng nhóm con sau khi thêm = ${(bs.materialSubcategories || []).length}`);

// ── BƯỚC 2: gán lại 9 vật tư sang nhóm con hợp lệ ────────────────────────────
console.log("\n[BƯỚC 2] Gán lại vật tư sang nhóm con vừa tạo");
let dat2 = 0;
for (const m of moCoi(bs)) {
  const code = String(m.code);
  // nhóm con đích = chính `subcategory_id` cũ (nay đã tồn tại) — fallback sang mã suy từ tiền tố
  let dich = idNhomCon(bs, String(m.subcategoryId));
  if (!dich) {
    const tienTo = code.split("-").slice(0, 2).join("-");
    dich = idNhomCon(bs, tienTo);
  }
  if (!dich) { console.log(`      [BO QUA] ${code} — chưa tạo được nhóm con đích, KHÔNG đoán bừa.`); continue; }
  const phu = TEN_PHU[code] || [];
  const r = await buoc(`save_material ${code} → nhóm con ${dich}`, () => coThat("save_material", {
    materialId: m.id, code, name: m.name, unit: m.unit,
    categoryId: m.categoryId, subcategoryId: dich,
    specification: m.specification || "", brand: m.brand || "",
    aliasText: phu.join("; "),
  }), BC);
  if (r && r.ok !== false) dat2++;
}
console.log(`      Đã gán lại được: ${dat2}`);

// ── BƯỚC 3: ĐỌC LẠI — chứng minh đã hết mồ côi ───────────────────────────────
bs = await bootstrap();
const sau = moCoi(bs);
const coPhu = new Set((bs.materialAliases || []).map((a) => String(a.materialId)));
const thieuPhu = maVatTu(bs).filter((m) => !coPhu.has(String(m.id)));

console.log("\n[BƯỚC 3] ĐỌC LẠI TỪ MÁY CHỦ");
console.log(`      vật tư có nhóm con MỒ CÔI = ${sau.length}  ${sau.length === 0 ? "✔ ĐÃ HẾT" : "⛔ CÒN: " + sau.map((x) => x.code).join(", ")}`);
console.log(`      vật tư CÓ tên phụ          = ${coPhu.size}/${maVatTu(bs).length}`);
console.log(`      vật tư CÒN THIẾU tên phụ   = ${thieuPhu.length}${thieuPhu.length ? " → " + thieuPhu.map((x) => x.code).join(", ") : ""}`);
console.log(`      tổng materialAliases       = ${(bs.materialAliases || []).length}`);
console.log(`      tổng nhóm con              = ${(bs.materialSubcategories || []).length}`);

const datHet = sau.length === 0;
const du200 = coPhu.size >= 200;
console.log(`\n      ${datHet ? "✔ ĐẠT" : "⛔ CHƯA ĐẠT"} — hết nhóm con mồ côi`);
console.log(`      ${du200 ? "✔ ĐẠT" : "⛔ CHƯA ĐẠT"} — tối thiểu 200 mã vật tư có tên phụ (đo được ${coPhu.size})`);

ghi({ giaiDoan: "sua-nhom-con-mo-coi", truoc: truoc.length, sau: sau.length, vatTuCoTenPhu: coPhu.size, tongNhomCon: (bs.materialSubcategories || []).length });
console.log("\n" + tomTatBuoc("SỬA NHÓM CON MỒ CÔI", BC));
if (!datHet || !du200) process.exitCode = 1;
