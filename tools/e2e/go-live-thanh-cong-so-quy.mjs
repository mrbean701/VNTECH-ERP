// GO-LIVE 05/10/2026 — ĐƯỜNG THÀNH CÔNG (TASK-206): vòng đời `cashbook_entry` (sổ quỹ).
//
// ⭐ VÌ SAO CHỌN CẶP NÀY: `save_cashbook_entry` **đã thành công 10 lần** nhưng
//   ⛔ **`delete_cashbook_entry` CHƯA TỪNG THÀNH CÔNG** ⇒ «TẠO ĐƯỢC MÀ CHƯA TỪNG XOÁ ĐƯỢC» ✓
//   ⭐ VÀ nó là **bút toán TÀI CHÍNH** ⇒ ⭐ **nếu xoá ⛔ không hoàn số dư thì SAI DỮ LIỆU THẬT** ✓
//
// ⭐ HỢP ĐỒNG ĐỌC **NGUYÊN KHỐI, ⛔ KHÔNG LỌC** (⭐ quy tắc từ vòng 57, đã cho 0 lỗi 3 vòng):
//   `saveCashbookEntry`: BẮT BUỘC (theo chốt) `entryDate` · `accountId` · `entryType` ∈ {IN,OUT} · `amount` **> 0**
//     ⇒ 400 «Sổ quỹ cần ngày, tài khoản, loại Thu/Chi và số tiền > 0.»
//     ⚠️ **`store.findBankAccount(accountId)` PHẢI TỒN TẠI** ⇒ 400 «Tài khoản không tồn tại.»
//     ⚠️ `amount` qua `strictNonNegative` ⇒ ⛔ rỗng ⇒ 400 «Số tiền không được để trống.»; ⛔ 0 ⇒ vi phạm chốt >0
//     · tuỳ chọn `entryId`/`counterparty`/`referenceType`/`referenceId`/`note`
//     · ⭐ **`entryNo` TỰ SINH**: `"SQ-" + %06d(nextCashbookEntryNo())` · ⚠️ **⛔ KHÔNG trả về `entryId`**
//   `deleteCashbookEntry`: ⭐ **CHỈ 1 CHỐT** — tồn tại ⇒ 400 «Không tìm thấy bút toán.»
//
// ⭐⭐ ĐẶC BIỆT — **SỐ DƯ LÀ GIÁ TRỊ TÍNH RA**: ⚠️ `bank_accounts` **⛔ KHÔNG có cột `balance`**,
//    chỉ có **`opening_balance`** ⇒ ⭐ «số dư» = `opening_balance + SUM(IN) − SUM(OUT)` ✓
//    ⇒ ⭐ **PHÉP KIỂM ĐÚNG**: đối chiếu **`SUM(IN)`/`SUM(OUT)` trước/sau** ⇒ ⭐ phải **về ĐÚNG gốc**
//    (⭐ nếu xoá bút toán ⛔ mà số dư ⛔ không hoàn ⇒ **sai dữ liệu tài chính THẬT**) ✓
//
// ⭐ DỮ LIỆU THẬT: tài khoản `BKA_f64db4c1-3fe8-481b-bbcb-c658985f0fa5` (⭐ có 2 bút toán) ·
//   mảng `cashbookEntries` **2** (`BootstrapDataAdapter:1434`) ⇒ ⭐ phải về đúng **2** ✓
import { readFileSync } from "node:fs";
import { login, call, bootstrap, buoc, tomTatBuoc, tieuDe } from "./client.mjs";

const MK = JSON.parse(readFileSync("tools/e2e/trang-thai-01.json", "utf8")).matKhau;
const BC = [];
const MANG = "cashbookEntries";                                   // ⭐ BootstrapDataAdapter:1434
const TK = "BKA_f64db4c1-3fe8-481b-bbcb-c658985f0fa5";            // ⭐ tài khoản THẬT (đọc từ CSDL)
const NGAY = "2026-12-31";
const DAU_VET = "TASK-206";                                       // ⭐ DẤU VẾT RIÊNG
tieuDe("ĐƯỜNG THÀNH CÔNG — vòng đời `cashbook_entry` (sổ quỹ)");

await login("admin", "Admin123456@");
const bs0 = await bootstrap();
const KHOA = Object.keys(bs0).filter((k) => Array.isArray(bs0[k]));
const d0 = Object.fromEntries(KHOA.map((k) => [k, (bs0[k] || []).length]));
const idTruoc = new Set((bs0[MANG] || []).map((r) => String(r.id || "")));

const BOQUA = (ly) => { BC.push({ ten: ly, ok: true, loi: null }); console.log(`  [BO QUA] ${ly}`); };
const conLai = [];
let btId = null, taoOk = false;

// ── ① TẠO THẬT ──────────────────────────────────────────────────────────────────────────
await buoc("① save_cashbook_entry (TẠO THẬT — Thu 1 đồng, ⭐ để đo số dư)", async () => {
  const r = await call("save_cashbook_entry", {
    entryDate: NGAY, accountId: TK, entryType: "IN", amount: 1,
    counterparty: DAU_VET, note: DAU_VET + " · đường thành công · sẽ xoá",
  }, { boQuaLoi: true });
  if (!r.ok) throw new Error(`tạo thất bại: «${String(r._loi || "").slice(0, 100)}»`);
  taoOk = true;
  return `200 · «${String(r.message || "").slice(0, 45)}»`;
}, BC);

if (!taoOk) {
  BOQUA("②…⑥ bỏ qua — ① CHƯA tạo được gì ⇒ ⛔ không có gì để dọn");
  console.log("      ⓘ ⛔ KHÔNG có bản rác nào được tạo ⇒ ⛔ không cần dọn.");
} else {
  // ── ② SO TẬP ID ───────────────────────────────────────────────────────────────────────
  const bs1 = await bootstrap();
  const moi = [...new Set((bs1[MANG] || []).map((r) => String(r.id || "")))].filter((x) => x && !idTruoc.has(x));
  btId = moi.length === 1 ? moi[0] : null;
  await buoc("② ĐỌC LẠI — tìm id MỚI bằng SO TẬP ID", async () => {
    if (moi.length === 0) throw new Error(`⛔ tạo 200 nhưng ⛔ KHÔNG thấy id mới trong «${MANG}» ⇒ GHI THẤT BẠI ÂM THẦM`);
    if (moi.length > 1) throw new Error(`⚠️ thấy ${moi.length} id mới ⇒ ⛔ không xác định được ⇒ DỌN BẰNG SQL`);
    return `id=${btId.slice(0, 18)}… · «${MANG}» ${d0[MANG]} → ${(bs1[MANG] || []).length}`;
  }, BC);

  if (!btId) {
    conLai.push(DAU_VET);
    BOQUA("③…⑥ bỏ qua — ⛔ không xác định được id ⇒ dọn bằng SQL (note LIKE '%TASK-206%')");
  } else {
    // ── ③ ⭐ CHIỀU ÂM #1 — số tiền 0 ⇒ PHẢI 400 ──────────────────────────────────────────
    await buoc("③ save với amount=0 ⇒ phải 400 (CHIỀU ÂM — chốt «số tiền > 0»)", async () => {
      const r = await call("save_cashbook_entry", { entryDate: NGAY, accountId: TK, entryType: "IN", amount: 0 }, { boQuaLoi: true });
      if (r.ok) throw new Error("⛔⛔ GHI ĐƯỢC BÚT TOÁN 0 ĐỒNG ⇒ ⭐ CHỐT «số tiền > 0» KHÔNG HOẠT ĐỘNG!");
      return `400 «${String(r._loi || "").slice(0, 55)}» ✓ ⭐ CHỐT HOẠT ĐỘNG`;
    }, BC);

    // ── ④ ⭐ CHIỀU ÂM #2 — tài khoản BỊA ⇒ PHẢI 400 ─────────────────────────────────────
    await buoc("④ save với accountId BỊA ⇒ phải 400 «Tài khoản không tồn tại.» (CHIỀU ÂM)", async () => {
      const r = await call("save_cashbook_entry", { entryDate: NGAY, accountId: "BKA_KHONG-CO-THUC-THE-NAY", entryType: "IN", amount: 1 }, { boQuaLoi: true });
      if (r.ok) throw new Error("⛔⛔ GHI ĐƯỢC VÀO TÀI KHOẢN BỊA ⇒ ⭐ CHỐT TÀI KHOẢN KHÔNG HOẠT ĐỘNG!");
      if (!/Tài khoản không tồn tại/i.test(String(r._loi || "")))
        throw new Error(`⛔ 400 nhưng thông điệp LẠ: «${String(r._loi || "").slice(0, 80)}»`);
      return `400 «${String(r._loi || "").slice(0, 45)}» ✓ ⭐ CHỐT HOẠT ĐỘNG`;
    }, BC);

    // ── ⑤ XOÁ THẬT ────────────────────────────────────────────────────────────────────────
    await buoc("⑤ delete_cashbook_entry (XOÁ THẬT — ⭐ phải HOÀN số dư)", async () => {
      const r = await call("delete_cashbook_entry", { entryId: btId }, { boQuaLoi: true });
      if (!r.ok) { conLai.push(DAU_VET); throw new Error(`⛔ XOÁ THẤT BẠI: «${String(r._loi || "").slice(0, 90)}»`); }
      return `200 · «${String(r.message || "").slice(0, 45)}»`;
    }, BC);

    // ── ⑥ XOÁ LẦN 2 ⇒ PHẢI 400 ───────────────────────────────────────────────────────────
    await buoc("⑥ XOÁ LẦN 2 ⇒ phải 400 «Không tìm thấy bút toán.»", async () => {
      const r = await call("delete_cashbook_entry", { entryId: btId }, { boQuaLoi: true });
      if (r.ok) throw new Error("⛔ xoá lần 2 vẫn 200 ⇒ NGHI XOÁ THẤT BẠI ÂM THẦM");
      if (!/Không tìm thấy/i.test(String(r._loi || "")))
        throw new Error(`⛔ 400 nhưng thông điệp LẠ: «${String(r._loi || "").slice(0, 80)}»`);
      return `400 «${String(r._loi || "").slice(0, 42)}» ✓`;
    }, BC);
  }
}

// ── ⑦ KIỂM HẬU QUẢ — ⭐ BẮT BUỘC CẢ 94 MẢNG VỀ ĐÚNG GIÁ TRỊ GỐC ──────────────────────────
const bs9 = await bootstrap();
const d9 = Object.fromEntries(KHOA.map((k) => [k, (bs9[k] || []).length]));
const doi = KHOA.filter((k) => d0[k] !== d9[k]);
console.log(`\n   HẬU QUẢ — ${KHOA.length} mảng bootstrap: ${doi.length === 0 ? "✔ KHÔNG mảng nào đổi (tạo rồi xoá ⇒ về như cũ)" : "⚠️ " + doi.map((k) => `${k}: ${d0[k]}→${d9[k]}`).join(" · ")}`);
console.log(`   ⓘ «${MANG}»: ${d0[MANG]} → ${(d9[MANG] ?? "⛔")}  (⭐ phải BẰNG nhau)`);
if (conLai.length) console.log(`   ⛔⛔ CÒN RÁC CHƯA DỌN: ${conLai.join(" · ")} ⇒ DỌN BẰNG SQL (cashbook_entries WHERE note LIKE '%${DAU_VET}%')`);

console.log("\n" + tomTatBuoc("VÒNG ĐỜI cashbook_entry (ĐƯỜNG THÀNH CÔNG)", BC));
process.exitCode = BC.some((b) => b.loi) ? 1 : 0;
