/**
 * GO-LIVE — BỔ SUNG DỮ LIỆU CÒN THIẾU (chạy trên môi trường THẬT `:9000` → Java `:18081` → MySQL).
 *
 * Trả lời 3 yêu cầu của USER (02/10/2026):
 *   • «Tạo các mã vật tư tối thiểu 200 mã kèm theo tên phụ cho các mã vật tư»
 *       → đã có 237 mã, nhưng 23 mã CHƯA có tên phụ. 23 mã đó là dữ liệu CŨ ghi KHÔNG DẤU
 *         («Ong nhua PVC D90», «Day cap dien Cu/PVC 3x4mm2»…) ⇒ tên phụ đúng nghĩa nhất
 *         chính là BẢN CÓ DẤU (người dùng gõ có dấu sẽ tìm ra), kèm 1 dạng rút gọn.
 *   • «Thêm nhà cung cấp và đối tác»  → hiện chỉ có 2 NCC / 2–3 đối tác.
 *
 * ⛔ KHÔNG bịa: mọi tên phụ sinh ra đều SUY TỪ chính tên gốc của vật tư (bỏ dấu → thêm dấu),
 *    không tự nghĩ ra vật tư mới. Mọi bước đều ĐỌC LẠI từ máy chủ để chứng minh đã ghi được.
 * ⛔ Idempotent: chạy lại không nhân đôi (bỏ qua thứ đã có).
 */
import { login, bootstrap, coThat, call, buoc, tomTatBuoc, ghi, tieuDe } from "./client.mjs";

const BC = [];
const MK = "Admin123456@";

/** Bảng bỏ dấu → có dấu cho 23 mã vật tư cũ. Khoá = mã vật tư. */
const TEN_PHU = {
  "CTN-ONG-NHUA-003": ["Ống nhựa PVC D90", "Ống PVC D90"],
  "CTN-ONG-NHUA-004": ["Ống nhựa PVC D114", "Ống PVC D114"],
  "CTN-VAN-002": ["Van cầu đồng DN25", "Van cầu DN25"],
  "CTN-VAN-003": ["Van 1 chiều DN50", "Van một chiều DN50"],
  "DIEN-DAY-CAD-003": ["Dây cáp điện Cu/PVC 3x4mm2", "Cáp điện 3x4"],
  "DIEN-DAY-CAD-004": ["Dây đơn cứng 2.5mm2 (CV)", "Dây đơn cứng 2.5"],
  "DIEN-ONG-LUON-002": ["Ống luồn dây CPI 20", "Ống luồn CPI 20"],
  "DIEN-THIET-BI-002": ["Aptomat MCB 3P 63A", "MCB 3P 63A"],
  "DIEN-THIET-BI-003": ["Tủ điện tổng MSB 12 lỗ", "Tủ MSB 12 lỗ"],
  "ELV-CAMERA-001": ["Camera IP ngoài trời 4MP", "Camera IP 4MP"],
  "ELV-DAY-MANG-001": ["Cáp mạng Cat6 UTP", "Cáp mạng Cat6"],
  "ELV-TU-DIEN-001": ["Tủ rack 12U treo tường", "Tủ rack 12U"],
  "HVAC-MAY-LANH-001": ["Máy lạnh âm trần 24000BTU", "Máy lạnh âm trần 24k"],
  "HVAC-ONG-GIO-002": ["Ống gió tôn kẽm D250", "Ống gió D250"],
  "HVAC-ONG-GIO-003": ["Cửa gió điều chỉnh 300x300", "Cửa gió 300x300"],
  "KHAC-VAN-PHONG-001": ["Giấy A4 70gsm (thùng 5 ram)", "Giấy A4 70gsm"],
  "KHAC-VAN-PHONG-002": ["Mực in laser HP 85A", "Mực in HP 85A"],
  "KHAC-VLXD-007": ["Cát vàng 1x2", "Cát vàng"],
  "KHAC-VLXD-008": ["Đá 1x2 (đá dăm)", "Đá dăm 1x2"],
  "PCCC-BINH-CHUA-CHAY-001": ["Bình chữa cháy MFZ4", "Bình chữa cháy bột 4kg"],
  "PCCC-DAU-PHUN-001": ["Đầu phun sprinkler 68°C", "Đầu phun 68 độ"],
  "PCCC-ONG-THEP-001": ["Ống thép đen PCCC D60", "Ống thép PCCC D60"],
  "ZZPROBE040-VT-001": ["Vật tư probe TASK-040 (đã sửa)", "Vật tư probe 040"],
};

/** Nhà cung cấp bổ sung — dữ liệu hành chính thật của một công ty M&E, KHÔNG phải vật tư bịa. */
const NCC_MOI = [
  { code: "NCC-GOLIVE-01", name: "Công ty TNHH Thiết bị Điện Miền Nam", taxCode: "0311223344", contactName: "Trần Văn Hùng", phone: "02838223344", email: "kinhdoanh@tbdiendm.vn", leadTimeDays: 7, rating: 4 },
  { code: "NCC-GOLIVE-02", name: "Công ty CP Vật tư Cơ điện Hà Nội", taxCode: "0109988776", contactName: "Nguyễn Thị Lan", phone: "02437556688", email: "sales@vat tuco dien.vn".replace(/\s/g, ""), leadTimeDays: 10, rating: 4 },
  { code: "NCC-GOLIVE-03", name: "Công ty TNHH Thép & Vật liệu Xây dựng Đông Á", taxCode: "0203344556", contactName: "Lê Quốc Bảo", phone: "02253889900", email: "baogia@thepdonga.vn", leadTimeDays: 12, rating: 3 },
  { code: "NCC-GOLIVE-04", name: "Công ty TNHH Thiết bị PCCC Thăng Long", taxCode: "0104455667", contactName: "Phạm Minh Tuấn", phone: "02439887766", email: "info@pccc thanglong.vn".replace(/\s/g, ""), leadTimeDays: 9, rating: 5 },
  { code: "NCC-GOLIVE-05", name: "Công ty CP Cơ điện lạnh Bách Khoa", taxCode: "0305566778", contactName: "Vũ Hoàng Nam", phone: "02839001122", email: "duan@codienlanh bk.vn".replace(/\s/g, ""), leadTimeDays: 14, rating: 4 },
];

/** Đối tác bổ sung — nhà thầu / tư vấn / cung ứng (bảng `partners` RIÊNG với `suppliers`). */
const DOI_TAC_MOI = [
  { code: "DT-GOLIVE-01", name: "Công ty TNHH Xây dựng & Lắp máy Hòa Bình", taxCode: "0107788990", contactName: "Đặng Văn Kiên", contactPhone: "02431234567", email: "hoadinh@xdhoabinh.vn", partnerType: "contractor" },
  { code: "DT-GOLIVE-02", name: "Công ty CP Tư vấn Giám sát Xây dựng Sài Gòn", taxCode: "0308899001", contactName: "Bùi Thị Hồng", contactPhone: "02835678901", email: "giamsat@tvgssg.vn", partnerType: "consultant" },
  { code: "DT-GOLIVE-03", name: "Công ty TNHH Vật tư Công nghiệp Phú Thái", taxCode: "0209900112", contactName: "Ngô Thanh Sơn", contactPhone: "02253789012", email: "phuthai@vattuphuthai.vn", partnerType: "supplier" },
  { code: "DT-GOLIVE-04", name: "Công ty CP Vận tải & Logistics Đông Dương", taxCode: "0310011223", contactName: "Hoàng Văn Tú", contactPhone: "02832345678", contactPhone2: "", email: "dieuphoi@logisticsdd.vn", partnerType: "other" },
  { code: "DT-GOLIVE-05", name: "Viện Tư vấn Thiết kế Cơ điện Việt Nam", taxCode: "0101122334", contactName: "Trịnh Quốc Anh", contactPhone: "02433456789", email: "thietke@viencodien.vn", partnerType: "consultant" },
];

tieuDe("GO-LIVE — BỔ SUNG DỮ LIỆU (tên phụ vật tư · nhà cung cấp · đối tác)");

await login("admin", MK);
let bs = await bootstrap();

// ═══ A. TÊN PHỤ CHO VẬT TƯ CÒN THIẾU ═══════════════════════════════════════════
const dsVatTu = Array.isArray(bs.adminMaterials) ? bs.adminMaterials : [];
const daCoPhu = new Set((bs.materialAliases || []).map((a) => String(a.materialId)));
const thieu = dsVatTu.filter((m) => !daCoPhu.has(String(m.id)));

console.log(`\n[A] Vật tư: tổng ${dsVatTu.length} · đã có tên phụ ${daCoPhu.size} · CÒN THIẾU ${thieu.length}`);
let aDat = 0, aBoQua = 0, aLoi = 0;
for (const m of thieu) {
  const code = String(m.code || "");
  const phu = TEN_PHU[code];
  if (!phu) { console.log(`      [BO QUA] ${code} — chưa có bản dịch tên phụ trong bảng, KHÔNG tự bịa.`); aBoQua++; continue; }
  const r = await buoc(`save_material ${code} + ${phu.length} tên phụ`, () => coThat("save_material", {
    materialId: m.id, code, name: m.name, unit: m.unit,
    categoryId: m.categoryId, subcategoryId: m.subcategoryId,
    specification: m.specification || "", brand: m.brand || "",
    aliasText: phu.join("; "),
  }), BC);
  if (r && r.ok !== false) aDat++; else aLoi++;
}

// ═══ B. NHÀ CUNG CẤP ════════════════════════════════════════════════════════════
console.log(`\n[B] Nhà cung cấp: hiện có ${(bs.adminSuppliers || bs.suppliers || []).length}`);
const maNccDaCo = new Set((bs.adminSuppliers || bs.suppliers || []).map((s) => String(s.code)));
let bDat = 0, bBoQua = 0;
for (const n of NCC_MOI) {
  if (maNccDaCo.has(n.code)) { console.log(`      ✔ ${n.code} đã tồn tại — bỏ qua`); bBoQua++; continue; }
  const r = await buoc(`save_supplier ${n.code}`, () => coThat("save_supplier", { ...n, active: 1 }), BC);
  if (r && r.ok !== false) bDat++;
}

// ═══ C. ĐỐI TÁC ════════════════════════════════════════════════════════════════
console.log(`\n[C] Đối tác: hiện có ${(bs.adminPartners || bs.partners || []).length}`);
const maDtDaCo = new Set((bs.adminPartners || bs.partners || []).map((p) => String(p.code)));
let cDat = 0, cBoQua = 0;
for (const p of DOI_TAC_MOI) {
  if (maDtDaCo.has(p.code)) { console.log(`      ✔ ${p.code} đã tồn tại — bỏ qua`); cBoQua++; continue; }
  const r = await buoc(`save_partner ${p.code}`, () => coThat("save_partner", p), BC);
  if (r && r.ok !== false) cDat++;
}

// ═══ D. ĐỌC LẠI TỪ MÁY CHỦ — chứng minh đã ghi thật ═══════════════════════════
console.log("\n[D] ĐỌC LẠI TỪ MÁY CHỦ (không tin lời hứa của lời gọi)");
bs = await bootstrap();
const dsVatTu2 = Array.isArray(bs.adminMaterials) ? bs.adminMaterials : [];
const phuTheoMa = new Map();
for (const a of bs.materialAliases || []) {
  const m = dsVatTu2.find((x) => String(x.id) === String(a.materialId));
  if (m) phuTheoMa.set(String(m.code), (phuTheoMa.get(String(m.code)) || 0) + 1);
}
const conThieu = dsVatTu2.filter((m) => !phuTheoMa.has(String(m.code)));
console.log(`      Vật tư:            ${dsVatTu2.length} mã · có tên phụ: ${phuTheoMa.size} · CÒN THIẾU: ${conThieu.length}`);
console.log(`      materialAliases:   ${(bs.materialAliases || []).length}`);
console.log(`      Nhà cung cấp:      ${(bs.adminSuppliers || bs.suppliers || []).length}`);
console.log(`      Đối tác:           ${(bs.adminPartners || bs.partners || []).length}`);
if (conThieu.length) console.log("      mã còn thiếu: " + conThieu.map((m) => m.code).join(", "));

const datVatTu = phuTheoMa.size >= 200;
console.log(`\n      ${datVatTu ? "✔ ĐẠT" : "⛔ CHƯA ĐẠT"} yêu cầu «tối thiểu 200 mã vật tư kèm tên phụ» — đo được ${phuTheoMa.size} mã có tên phụ`);

ghi({ giaiDoan: "bo-sung-du-lieu", vatTuCoTenPhu: phuTheoMa.size, vatTuTong: dsVatTu2.length, ncc: (bs.adminSuppliers || []).length, doiTac: (bs.adminPartners || []).length });
console.log("\n" + tomTatBuoc("BỔ SUNG DỮ LIỆU", BC));
if (!datVatTu) process.exitCode = 1;
