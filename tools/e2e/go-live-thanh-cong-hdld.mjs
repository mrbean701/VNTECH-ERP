// GO-LIVE 05/10/2026 — ĐƯỜNG THÀNH CÔNG (TASK-201): vòng đời `labor_contract`.
//
// ⭐ VÌ SAO CHỌN CẶP NÀY: `save_labor_contract` **đã thành công 25 lần** nhưng
//   ⛔ **`delete_labor_contract` CHƯA TỪNG THÀNH CÔNG** ⇒ «TẠO ĐƯỢC MÀ CHƯA TỪNG XOÁ ĐƯỢC» ✓
//
// ⭐ HỢP ĐỒNG ĐỌC **TRỌN** TỪ MÃ (`HrManagementUseCase`) — ⛔ không chỉ payload.get:
//   `saveLaborContract`: BẮT BUỘC `userId` + `contractType` ⇒ 400 «Hợp đồng lao động cần nhân sự và loại hợp đồng.»
//     ⚠️ **`userId` PHẢI TỒN TẠI** ⇒ 400 «Nhân sự không tồn tại.»
//     · `salary` = strictNonNegative · `imageUrl` **chỉ nhận data-URL ảnh** ⇒ ⭐ gửi RỖNG
//     · ⭐ **`contractNo` TỰ SINH**: `"HĐLĐ-" + %05d(nextLaborContractNo())`
//     · ⚠️ **⛔ KHÔNG trả về `contractId`** và ⚠️ **⛔ KHÔNG có chốt chống trùng** (mã tự sinh)
//   `deleteLaborContract`: ⭐ **CHỈ 1 CHỐT** — tồn tại ⇒ 400 «Không tìm thấy hợp đồng.»
//
// ⭐⭐ KỸ THUẬT TÌM ID MỚI (vì API ⛔ không trả id): ⭐ **so TẬP ID trước/sau** trên mảng
//    `laborContracts` (⭐ tên mảng đọc từ `BootstrapDataAdapter:1464` — ⛔ không đoán) ⇒
//    ⭐ id nào CHỈ CÓ SAU khi tạo chính là bản ghi mới ✓ ⛔ không quét mọi mảng (bài học TASK-195) ✓
//
// ⭐ DỮ LIỆU THẬT ĐỌC TỪ CSDL: user `USR_e66f85ff-…` (`e2e.bgd`, active) ·
//   `contractType` thật = «Hợp đồng xác định thời hạn» (19 dòng) · **hiện có 26 hợp đồng** ⇒ phải về đúng 26 ✓
import { readFileSync } from "node:fs";
import { login, call, bootstrap, buoc, tomTatBuoc, tieuDe } from "./client.mjs";

const MK = JSON.parse(readFileSync("tools/e2e/trang-thai-01.json", "utf8")).matKhau;
const BC = [];
const MANG = "laborContracts";                                  // ⭐ đọc từ BootstrapDataAdapter:1464
const NGUOI = "USR_e66f85ff-96ad-40d5-a632-10be87ab10d5";       // ⭐ e2e.bgd (đọc từ CSDL)
const LOAI = "Hợp đồng xác định thời hạn";                      // ⭐ loại thật đang dùng
tieuDe("ĐƯỜNG THÀNH CÔNG — vòng đời `labor_contract`");

await login("admin", "Admin123456@");
const bs0 = await bootstrap();
const KHOA = Object.keys(bs0).filter((k) => Array.isArray(bs0[k]));
const d0 = Object.fromEntries(KHOA.map((k) => [k, (bs0[k] || []).length]));
const idTruoc = new Set((bs0[MANG] || []).map((r) => String(r.id || "")));   // ⭐ TẬP ID TRƯỚC

const BOQUA = (ly) => { BC.push({ ten: ly, ok: true, loi: null }); console.log(`  [BO QUA] ${ly}`); };
const conLai = [];
let hdId = null, taoOk = false;

// ── ① TẠO THẬT ──────────────────────────────────────────────────────────────────────────
await buoc("① save_labor_contract (TẠO THẬT)", async () => {
  const r = await call("save_labor_contract", {
    userId: NGUOI, contractType: LOAI, salary: 1, note: "TASK-201 · đường thành công · sẽ xoá",
  }, { boQuaLoi: true });
  if (!r.ok) throw new Error(`tạo thất bại: «${String(r._loi || "").slice(0, 95)}»`);
  taoOk = true;
  return `200 · «${String(r.message || "").slice(0, 45)}»`;
}, BC);

if (!taoOk) {
  BOQUA("②…⑤ bỏ qua — ① CHƯA tạo được gì ⇒ ⛔ không có gì để dọn");
  console.log("      ⓘ ⛔ KHÔNG có bản rác nào được tạo ⇒ ⛔ không cần dọn.");
} else {
  // ── ② ĐỌC LẠI — tìm id MỚI bằng SO TẬP ID (⭐ API ⛔ không trả contractId) ─────────────
  const bs1 = await bootstrap();
  const idSau = new Set((bs1[MANG] || []).map((r) => String(r.id || "")));
  const moi = [...idSau].filter((x) => x && !idTruoc.has(x));
  hdId = moi.length === 1 ? moi[0] : null;
  await buoc("② ĐỌC LẠI — tìm id MỚI bằng SO TẬP ID (⛔ không quét mọi mảng)", async () => {
    if (moi.length === 0) throw new Error(`⛔ tạo 200 nhưng ⛔ KHÔNG thấy id mới trong «${MANG}» ⇒ GHI THẤT BẠI ÂM THẦM`);
    if (moi.length > 1) throw new Error(`⚠️ thấy ${moi.length} id mới ⇒ ⛔ không xác định được bản của mình ⇒ DỌN BẰNG SQL`);
    return `id mới = ${hdId.slice(0, 20)}… · SL ${d0[MANG]} → ${(bs1[MANG] || []).length}`;
  }, BC);

  if (!hdId) {
    conLai.push("HĐLĐ mới của " + NGUOI);
    BOQUA("③④⑤ bỏ qua — ⛔ không xác định được id ⇒ dọn bằng SQL (lọc theo user_id + created_at)");
  } else {
    // ── ③ ⭐ CHỐT CHẶN THEO CHIỀU ÂM — id BỊA ⇒ PHẢI 400 «Không tìm thấy hợp đồng.» ────────
    await buoc("③ delete với ID BỊA ⇒ phải 400 «Không tìm thấy hợp đồng.» (CHIỀU ÂM)", async () => {
      const r = await call("delete_labor_contract", { contractId: "LBC_KHONG-CO-THUC-THE-NAY" }, { boQuaLoi: true });
      if (r.ok) throw new Error("⛔⛔ XOÁ ĐƯỢC VỚI ID BỊA ⇒ ⭐ CHỐT TỒN TẠI KHÔNG HOẠT ĐỘNG!");
      if (!/Không tìm thấy/i.test(String(r._loi || "")))
        throw new Error(`⛔ 400 nhưng thông điệp LẠ: «${String(r._loi || "").slice(0, 80)}»`);
      return `400 «${String(r._loi || "").slice(0, 45)}» ✓ ⭐ CHỐT HOẠT ĐỘNG`;
    }, BC);

    // ── ④ XOÁ THẬT ────────────────────────────────────────────────────────────────────────
    await buoc("④ delete_labor_contract (XOÁ THẬT — DỌN SẠCH)", async () => {
      const r = await call("delete_labor_contract", { contractId: hdId }, { boQuaLoi: true });
      if (!r.ok) { conLai.push("HĐLĐ " + hdId); throw new Error(`⛔ XOÁ THẤT BẠI: «${String(r._loi || "").slice(0, 90)}»`); }
      return `200 · «${String(r.message || "").slice(0, 45)}»`;
    }, BC);

    // ── ⑤ XOÁ LẦN 2 ⇒ PHẢI 400 (⛔ chứng minh ĐÃ XOÁ THẬT) ──────────────────────────────
    await buoc("⑤ XOÁ LẦN 2 ⇒ phải 400 «Không tìm thấy hợp đồng.»", async () => {
      const r = await call("delete_labor_contract", { contractId: hdId }, { boQuaLoi: true });
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
if (conLai.length) console.log(`   ⛔⛔ CÒN RÁC CHƯA DỌN: ${conLai.join(" · ")} ⇒ DỌN BẰNG SQL (labor_contracts WHERE user_id='${NGUOI}' AND note LIKE '%TASK-201%')`);

console.log("\n" + tomTatBuoc("VÒNG ĐỜI labor_contract (ĐƯỜNG THÀNH CÔNG)", BC));
process.exitCode = BC.some((b) => b.loi) ? 1 : 0;
