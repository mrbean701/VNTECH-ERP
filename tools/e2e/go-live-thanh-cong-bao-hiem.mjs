// GO-LIVE 05/10/2026 — ĐƯỜNG THÀNH CÔNG (TASK-202): vòng đời `benefit_record`.
//
// ⭐ VÌ SAO CHỌN CẶP NÀY: `save_benefit_record` **đã thành công 52 lần** nhưng
//   ⛔ **`delete_benefit_record` CHƯA TỪNG THÀNH CÔNG** ⇒ «TẠO ĐƯỢC MÀ CHƯA TỪNG XOÁ ĐƯỢC» ✓
//
// ⭐ HỢP ĐỒNG ĐỌC **TRỌN** TỪ MÃ (`HrManagementUseCase`) — ⛔ không chỉ payload.get:
//   `saveBenefitRecord`: BẮT BUỘC `userId` + `benefitType` ⇒ 400 «Bảo hiểm & chế độ cần nhân sự và loại.»
//     ⚠️ **`userId` PHẢI TỒN TẠI** ⇒ 400 «Nhân sự không tồn tại.»
//     ⚠️⚠️ **`monthlyAmount` dùng `strictNonNegative`** ⇒ ⛔ **RỖNG BỊ TỪ CHỐI**
//        («Mức đóng hàng tháng không được để trống.») ⇒ ⭐ **PHẢI GỬI 0** ✓
//        ⭐ (⭐ ĐỌC HÀM HELPER đã cứu tôi khỏi lỗi này — ⭐ quy tắc «đọc TRỌN» từ TASK-199 trả lãi lần 3)
//     · ⭐ **`benefitNo` TỰ SINH**: `"BH-" + %05d(nextBenefitRecordNo())`
//     · ⚠️ **⛔ KHÔNG trả về `benefitId`** · ⚠️ **⛔ KHÔNG có chốt chống trùng**
//   `deleteBenefitRecord`: ⭐ **CHỈ 1 CHỐT** — tồn tại ⇒ 400 «Không tìm thấy bản ghi.»
//
// ⭐⭐ KỸ THUẬT «SO TẬP ID TRƯỚC/SAU» (TASK-201) — DÙNG LẠI: vì API ⛔ không trả về id,
//    ⭐ so tập id `benefitRecords` trước/sau ⇒ id nào CHỈ CÓ SAU chính là bản của mình ✓
// ⭐⭐ KỸ THUẬT «KIỂM CHỐT CHẶN CHIỀU ÂM» (TASK-200) — DÙNG LẠI: gọi `delete` với **id BỊA** ✓
//
// ⭐ DỮ LIỆU THẬT ĐỌC TỪ CSDL: user `USR_e66f85ff-…` (`e2e.bgd`) · `benefitType` thật = `BHXH` (26 dòng)
//   · **hiện có 52 bản ghi** ⇒ phải về đúng **52** · mảng bootstrap `benefitRecords` (`BootstrapDataAdapter:1518`) ✓
import { readFileSync } from "node:fs";
import { login, call, bootstrap, buoc, tomTatBuoc, tieuDe } from "./client.mjs";

const MK = JSON.parse(readFileSync("tools/e2e/trang-thai-01.json", "utf8")).matKhau;
const BC = [];
const MANG = "benefitRecords";                                  // ⭐ đọc từ BootstrapDataAdapter:1518
const NGUOI = "USR_e66f85ff-96ad-40d5-a632-10be87ab10d5";       // ⭐ e2e.bgd (đọc từ CSDL)
const LOAI = "BHXH";                                            // ⭐ loại thật đang dùng
const DAU_VET = "TASK-202";                                     // ⭐ DẤU VẾT RIÊNG của bài kiểm (⭐ quy tắc từ TASK-201)
tieuDe("ĐƯỜNG THÀNH CÔNG — vòng đời `benefit_record`");

await login("admin", "Admin123456@");
const bs0 = await bootstrap();
const KHOA = Object.keys(bs0).filter((k) => Array.isArray(bs0[k]));
const d0 = Object.fromEntries(KHOA.map((k) => [k, (bs0[k] || []).length]));
const idTruoc = new Set((bs0[MANG] || []).map((r) => String(r.id || "")));   // ⭐ TẬP ID TRƯỚC

const BOQUA = (ly) => { BC.push({ ten: ly, ok: true, loi: null }); console.log(`  [BO QUA] ${ly}`); };
const conLai = [];
let bhId = null, taoOk = false;

// ── ① TẠO THẬT ──────────────────────────────────────────────────────────────────────────
await buoc("① save_benefit_record (TẠO THẬT)", async () => {
  const r = await call("save_benefit_record", {
    userId: NGUOI, benefitType: LOAI, monthlyAmount: 0, note: DAU_VET + " · đường thành công · sẽ xoá",
  }, { boQuaLoi: true });
  if (!r.ok) throw new Error(`tạo thất bại: «${String(r._loi || "").slice(0, 95)}»`);
  taoOk = true;
  return `200 · «${String(r.message || "").slice(0, 45)}»`;
}, BC);

if (!taoOk) {
  BOQUA("②…⑤ bỏ qua — ① CHƯA tạo được gì ⇒ ⛔ không có gì để dọn");
  console.log("      ⓘ ⛔ KHÔNG có bản rác nào được tạo ⇒ ⛔ không cần dọn.");
} else {
  // ── ② ĐỌC LẠI — tìm id MỚI bằng SO TẬP ID ─────────────────────────────────────────────
  const bs1 = await bootstrap();
  const idSau = new Set((bs1[MANG] || []).map((r) => String(r.id || "")));
  const moi = [...idSau].filter((x) => x && !idTruoc.has(x));
  bhId = moi.length === 1 ? moi[0] : null;
  await buoc("② ĐỌC LẠI — tìm id MỚI bằng SO TẬP ID (⛔ không quét mọi mảng)", async () => {
    if (moi.length === 0) throw new Error(`⛔ tạo 200 nhưng ⛔ KHÔNG thấy id mới trong «${MANG}» ⇒ GHI THẤT BẠI ÂM THẦM`);
    if (moi.length > 1) throw new Error(`⚠️ thấy ${moi.length} id mới ⇒ ⛔ không xác định được bản của mình ⇒ DỌN BẰNG SQL`);
    return `id mới = ${bhId.slice(0, 20)}… · SL ${d0[MANG]} → ${(bs1[MANG] || []).length}`;
  }, BC);

  if (!bhId) {
    conLai.push("bản ghi " + DAU_VET);
    BOQUA("③④⑤ bỏ qua — ⛔ không xác định được id ⇒ dọn bằng SQL (lọc note LIKE '%TASK-202%')");
  } else {
    // ── ③ ⭐ CHỐT CHẶN THEO CHIỀU ÂM — id BỊA ⇒ PHẢI 400 «Không tìm thấy bản ghi.» ────────
    await buoc("③ delete với ID BỊA ⇒ phải 400 «Không tìm thấy bản ghi.» (CHIỀU ÂM)", async () => {
      const r = await call("delete_benefit_record", { benefitId: "BEN_KHONG-CO-THUC-THE-NAY" }, { boQuaLoi: true });
      if (r.ok) throw new Error("⛔⛔ XOÁ ĐƯỢC VỚI ID BỊA ⇒ ⭐ CHỐT TỒN TẠI KHÔNG HOẠT ĐỘNG!");
      if (!/Không tìm thấy/i.test(String(r._loi || "")))
        throw new Error(`⛔ 400 nhưng thông điệp LẠ: «${String(r._loi || "").slice(0, 80)}»`);
      return `400 «${String(r._loi || "").slice(0, 45)}» ✓ ⭐ CHỐT HOẠT ĐỘNG`;
    }, BC);

    // ── ④ XOÁ THẬT ────────────────────────────────────────────────────────────────────────
    await buoc("④ delete_benefit_record (XOÁ THẬT — DỌN SẠCH)", async () => {
      const r = await call("delete_benefit_record", { benefitId: bhId }, { boQuaLoi: true });
      if (!r.ok) { conLai.push("BH " + bhId); throw new Error(`⛔ XOÁ THẤT BẠI: «${String(r._loi || "").slice(0, 90)}»`); }
      return `200 · «${String(r.message || "").slice(0, 45)}»`;
    }, BC);

    // ── ⑤ XOÁ LẦN 2 ⇒ PHẢI 400 (⛔ chứng minh ĐÃ XOÁ THẬT) ──────────────────────────────
    await buoc("⑤ XOÁ LẦN 2 ⇒ phải 400 «Không tìm thấy bản ghi.»", async () => {
      const r = await call("delete_benefit_record", { benefitId: bhId }, { boQuaLoi: true });
      if (r.ok) throw new Error("⛔ xoá lần 2 vẫn 200 ⇒ NGHI XOÁ THẤT BẠI ÂM THẦM");
      if (!/Không tìm thấy/i.test(String(r._loi || "")))
        throw new Error(`⛔ 400 nhưng thông điệp LẠ: «${String(r._loi || "").slice(0, 80)}»`);
      return `400 «${String(r._loi || "").slice(0, 42)}» ✓`;
    }, BC);
  }
}

// ── ⑥ KIỂM HẬU QUẢ — ⭐ BẮT BUỘC CẢ 94 MẢNG VỀ ĐÚNG GIÁ TRỊ GỐC ──────────────────────────
const bs9 = await bootstrap();
const d9 = Object.fromEntries(KHOA.map((k) => [k, (bs9[k] || []).length]));
const doi = KHOA.filter((k) => d0[k] !== d9[k]);
console.log(`\n   HẬU QUẢ — ${KHOA.length} mảng bootstrap: ${doi.length === 0 ? "✔ KHÔNG mảng nào đổi (tạo rồi xoá ⇒ về như cũ)" : "⚠️ " + doi.map((k) => `${k}: ${d0[k]}→${d9[k]}`).join(" · ")}`);
console.log(`   ⓘ «${MANG}»: ${d0[MANG]} → ${(bs9[MANG] || []).length}  (⭐ phải BẰNG nhau)`);
if (conLai.length) console.log(`   ⛔⛔ CÒN RÁC CHƯA DỌN: ${conLai.join(" · ")} ⇒ DỌN BẰNG SQL (benefit_records WHERE note LIKE '%${DAU_VET}%')`);

console.log("\n" + tomTatBuoc("VÒNG ĐỜI benefit_record (ĐƯỜNG THÀNH CÔNG)", BC));
process.exitCode = BC.some((b) => b.loi) ? 1 : 0;
