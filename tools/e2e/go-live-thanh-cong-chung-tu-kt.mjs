// GO-LIVE 05/10/2026 — ĐƯỜNG THÀNH CÔNG (TASK-207) + ⚠️ NGHI VẤN 500: `accounting_voucher`.
//
// ⭐ VÌ SAO CHỌN CẶP NÀY: `save_accounting_voucher` CHƯA TỪNG thành công và
//   ⛔ **`delete_accounting_voucher` CHƯA TỪNG THÀNH CÔNG** ⇒ «TẠO ĐƯỢC MÀ CHƯA TỪNG XOÁ ĐƯỢC» ✓
//
// ⚠️⚠️ NGHI VẤN 500 — ĐỌC TỪ **NGUYÊN KHỐI** `FinanceManagementUseCase.saveAccountingVoucher`:
//   ```java
//   if (voucherDate.isEmpty() || voucherType.isEmpty()) throw Api("Chứng từ kế toán cần ngày và loại chứng từ.");
//   ...
//   long n = 1;
//   try { n = Long.parseLong(store.nextVoucherNo(voucherDate.substring(0, 4))); } catch (Exception ignored) { }  // ⭐ trong try
//   String voucherNo = "CT-" + voucherDate.substring(0, 4) + "-" + String.format("%04d", n);                    // ⚠️ NGOÀI try
//   ```
//   ⇒ ⭐ Chốt chỉ kiểm **rỗng**, ⛔ **KHÔNG kiểm ĐỘ DÀI/ĐỊNH DẠNG** ⇒ ⭐ **`voucherDate` NGẮN HƠN 4 KÝ TỰ**
//     (ví dụ `"1"`) **qua được chốt** ⇒ ⭐ dòng thứ hai ném **`StringIndexOutOfBoundsException`** ⇒ ⚠️ **500**
//   ⭐ **ĐÂY LÀ ỨNG VIÊN LỖI THẬT** — ⭐ cùng loại với BUG-20261005-012/-013 (500 ⛔ không bắt) ✓
//   ⛔ NHƯNG: ⭐ **bài kiểm phải KỲ VỌNG 400 hoặc ghi nhận 500 là LỖI** — ⛔ không được coi 500 là «bình thường» ✓
//
// ⭐ HỢP ĐỒNG ĐỌC NGUYÊN KHỐI:
//   `saveAccountingVoucher`: BẮT BUỘC `voucherDate` + `voucherType` ⇒ 400 «Chứng từ kế toán cần ngày và loại chứng từ.»
//     ⚠️ `totalAmount` qua `strictNonNegative` ⇒ ⛔ rỗng ⇒ 400 «Giá trị chứng từ không được để trống.» ⇒ **gửi 0** ✓
//     · tuỳ chọn `voucherId` · `projectId` · `description` · `filesJson` · ⭐ **`voucherNo` TỰ SINH** (`CT-<năm>-%04d`)
//     · ⚠️ **⛔ KHÔNG trả về `voucherId`** ⇒ dùng **SO TẬP ID** ✓
//   `deleteAccountingVoucher`: ⭐ **CHỈ 1 CHỐT** — tồn tại ⇒ 400 «Không tìm thấy chứng từ.»
//
// ⭐ DỮ LIỆU THẬT: mảng `accountingVouchers` (`BootstrapDataAdapter:1445`) — ⚠️ **HIỆN CÓ 0 DÒNG**
//   ⇒ ⭐ **bài kiểm này tạo DÒNG ĐẦU TIÊN** ⇒ ⭐ **phải về đúng 0** ✓
import { readFileSync } from "node:fs";
import { login, call, bootstrap, buoc, tomTatBuoc, tieuDe } from "./client.mjs";

const MK = JSON.parse(readFileSync("tools/e2e/trang-thai-01.json", "utf8")).matKhau;
const BC = [];
const MANG = "accountingVouchers";              // ⭐ BootstrapDataAdapter:1445
const NGAY = "2026-12-31";                      // ⭐ dài ≥4 ký tự ⇒ qua được `substring(0,4)`
const DAU_VET = "TASK-207";                     // ⭐ DẤU VẾT RIÊNG
tieuDe("ĐƯỜNG THÀNH CÔNG — vòng đời `accounting_voucher` (chứng từ kế toán)");

await login("admin", "Admin123456@");
const bs0 = await bootstrap();
const KHOA = Object.keys(bs0).filter((k) => Array.isArray(bs0[k]));
const d0 = Object.fromEntries(KHOA.map((k) => [k, (bs0[k] || []).length]));
const idTruoc = new Set((bs0[MANG] || []).map((r) => String(r.id || "")));

const BOQUA = (ly) => { BC.push({ ten: ly, ok: true, loi: null }); console.log(`  [BO QUA] ${ly}`); };
const conLai = [];

// ── ① ⚠️ NGHI VẤN 500 — `voucherDate` NGẮN HƠN 4 KÝ TỰ ────────────────────────────────────
await buoc("① save với voucherDate=\"1\" (ngắn <4) ⇒ ⛔ KHÔNG được 500 (ứng viên lỗi)", async () => {
  const r = await call("save_accounting_voucher", { voucherDate: "1", voucherType: "E2E", totalAmount: 0 }, { boQuaLoi: true });
  const ma = r?.status ?? r?.statusCode ?? r?._status;
  if (typeof ma === "number" && ma >= 500)
    throw new Error(`⚠️⚠️ 500 — LỖI THẬT: \`voucherDate.substring(0,4)\` trên chuỗi ngắn ⇒ StringIndexOutOfBoundsException ⛔ KHÔNG bắt (⭐ ngoài try)`);
  const loi = String(r?._loi || r?.message || "");
  if (/Exception|NullPointer|Internal Server Error/i.test(loi)) throw new Error(`⚠️ NGHI 5xx/NPE: «${loi.slice(0, 80)}»`);
  return r.ok ? `⚠️ 200 — ⛔ GHI ĐƯỢC VỚI NGÀY 1 KÝ TỰ (⭐ cũng là lỗi kiểm tra dữ liệu)` : `400 · ${loi.slice(0, 50)}`;
}, BC);

// ── ② TẠO THẬT (ngày hợp lệ) ─────────────────────────────────────────────────────────────
let ctId = null, taoOk = false;
await buoc("② save_accounting_voucher (TẠO THẬT — ngày hợp lệ)", async () => {
  const r = await call("save_accounting_voucher", {
    voucherDate: NGAY, voucherType: "E2E", totalAmount: 0, description: DAU_VET + " · đường thành công · sẽ xoá",
  }, { boQuaLoi: true });
  if (!r.ok) throw new Error(`tạo thất bại: «${String(r._loi || "").slice(0, 100)}»`);
  taoOk = true;
  return `200 · «${String(r.message || "").slice(0, 45)}»`;
}, BC);

if (!taoOk) {
  BOQUA("③…⑥ bỏ qua — ② CHƯA tạo được gì ⇒ ⛔ không có gì để dọn");
  console.log("      ⓘ ⛔ KHÔNG có bản rác nào được tạo ⇒ ⛔ không cần dọn.");
} else {
  // ── ③ SO TẬP ID ───────────────────────────────────────────────────────────────────────
  const bs1 = await bootstrap();
  const moi = [...new Set((bs1[MANG] || []).map((r) => String(r.id || "")))].filter((x) => x && !idTruoc.has(x));
  ctId = moi.length === 1 ? moi[0] : null;
  await buoc("③ ĐỌC LẠI — tìm id MỚI bằng SO TẬP ID", async () => {
    if (moi.length === 0) throw new Error(`⛔ tạo 200 nhưng ⛔ KHÔNG thấy id mới trong «${MANG}» ⇒ GHI THẤT BẠI ÂM THẦM`);
    if (moi.length > 1) throw new Error(`⚠️ thấy ${moi.length} id mới ⇒ ⛔ không xác định được ⇒ DỌN BẰNG SQL`);
    return `id=${ctId.slice(0, 18)}… · «${MANG}» ${d0[MANG]} → ${(bs1[MANG] || []).length}`;
  }, BC);

  if (!ctId) {
    conLai.push(DAU_VET);
    BOQUA("④…⑥ bỏ qua — ⛔ không xác định được id ⇒ dọn bằng SQL (description LIKE '%TASK-207%')");
  } else {
    // ── ④ ⭐ CHIỀU ÂM — `voucherType` RỖNG ⇒ PHẢI 400 ────────────────────────────────────
    await buoc("④ save với voucherType RỖNG ⇒ phải 400 «cần ngày và loại chứng từ.» (CHIỀU ÂM)", async () => {
      const r = await call("save_accounting_voucher", { voucherDate: NGAY, voucherType: "", totalAmount: 0 }, { boQuaLoi: true });
      if (r.ok) throw new Error("⛔⛔ GHI ĐƯỢC VỚI LOẠI RỖNG ⇒ ⭐ CHỐT KHÔNG HOẠT ĐỘNG!");
      if (!/cần ngày và loại chứng từ/i.test(String(r._loi || "")))
        throw new Error(`⛔ 400 nhưng thông điệp LẠ: «${String(r._loi || "").slice(0, 80)}»`);
      return `400 «${String(r._loi || "").slice(0, 55)}» ✓ ⭐ CHỐT HOẠT ĐỘNG`;
    }, BC);

    // ── ⑤ XOÁ THẬT ────────────────────────────────────────────────────────────────────────
    await buoc("⑤ delete_accounting_voucher (XOÁ THẬT — DỌN SẠCH)", async () => {
      const r = await call("delete_accounting_voucher", { voucherId: ctId }, { boQuaLoi: true });
      if (!r.ok) { conLai.push(DAU_VET); throw new Error(`⛔ XOÁ THẤT BẠI: «${String(r._loi || "").slice(0, 90)}»`); }
      return `200 · «${String(r.message || "").slice(0, 45)}»`;
    }, BC);

    // ── ⑥ XOÁ LẦN 2 ⇒ PHẢI 400 ───────────────────────────────────────────────────────────
    await buoc("⑥ XOÁ LẦN 2 ⇒ phải 400 «Không tìm thấy chứng từ.»", async () => {
      const r = await call("delete_accounting_voucher", { voucherId: ctId }, { boQuaLoi: true });
      if (r.ok) throw new Error("⛔ xoá lần 2 vẫn 200 ⇒ NGHI XOÁ THẤT BẠI ÂM THẦM");
      if (!/Không tìm thấy/i.test(String(r._loi || "")))
        throw new Error(`⛔ 400 nhưng thông điệp LẠ: «${String(r._loi || "").slice(0, 80)}»`);
      return `400 «${String(r._loi || "").slice(0, 42)}» ✓`;
    }, BC);
  }
}

// ── ⑦ KIỂM HẬU QUẢ ───────────────────────────────────────────────────────────────────────
const bs9 = await bootstrap();
const d9 = Object.fromEntries(KHOA.map((k) => [k, (bs9[k] || []).length]));
const doi = KHOA.filter((k) => d0[k] !== d9[k]);
console.log(`\n   HẬU QUẢ — ${KHOA.length} mảng bootstrap: ${doi.length === 0 ? "✔ KHÔNG mảng nào đổi (tạo rồi xoá ⇒ về như cũ)" : "⚠️ " + doi.map((k) => `${k}: ${d0[k]}→${d9[k]}`).join(" · ")}`);
console.log(`   ⓘ «${MANG}»: ${d0[MANG]} → ${(d9[MANG] ?? "⛔")}  (⭐ phải BẰNG nhau — hiện gốc là 0)`);
if (conLai.length) console.log(`   ⛔⛔ CÒN RÁC CHƯA DỌN: ${conLai.join(" · ")} ⇒ DỌN BẰNG SQL (description LIKE '%${DAU_VET}%')`);

console.log("\n" + tomTatBuoc("VÒNG ĐỜI accounting_voucher (ĐƯỜNG THÀNH CÔNG)", BC));
process.exitCode = BC.some((b) => b.loi) ? 1 : 0;
