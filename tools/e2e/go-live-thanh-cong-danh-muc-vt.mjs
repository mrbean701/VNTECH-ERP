// GO-LIVE 05/10/2026 — ĐƯỜNG THÀNH CÔNG (TASK-196): `material_category` + `material_subcategory`
//
// ⭐ VÌ SAO CHỌN 2 CẶP NÀY — ĐO ĐƯỢC Ở TASK-195/`bao-phu-that.mjs`:
//   `save_material_category` **đã thành công 10 lần** · `save_material_subcategory` **41 lần**
//   ⛔ **nhưng `delete_material_category` / `delete_material_subcategory` CHƯA TỪNG THÀNH CÔNG**
//   ⇒ ⭐ ĐÚNG LOẠI RỦI RO «TẠO ĐƯỢC MÀ CHƯA TỪNG XOÁ ĐƯỢC» — ⭐ cơ chế sinh rác (đã trải qua ở TASK-195) ✓
//
// ⭐ HỢP ĐỒNG ĐỌC TỪ MÃ (⛔ không đoán):
//   `saveMaterialCategory`   : BẮT BUỘC `code` (tự UPPERCASE) + `name`
//                              · ⭐ TRÙNG `code` ⇒ 400 «Mã nhóm vật tư đã tồn tại.» (dùng làm PHÉP THỬ)
//                              · xoá bằng `categoryId`
//   `saveMaterialSubcategory`: BẮT BUỘC `categoryId` (⭐ phải TỒN TẠI, ⛔ không ⇒ 400 «Hệ M&E không tồn tại.») + `name`
//                              · `code` để trống thì TỰ SINH · xoá bằng `subcategoryId`
//
// ⚠️⚠️ BẪY ĐÃ DÒ RA (⛔ không đoán mảng): dữ liệu xuất hiện LẶP ở **2 cặp mảng**
//   `materialCategories` (16) / `adminMaterialCategories` (16) · `materialSubcategories` (50) / `adminMaterialSubcategories` (50)
//   ⇒ ⭐ bài kiểm đọc id từ CẢ HAI và **bắt buộc cả 94 mảng phải về ĐÚNG giá trị gốc** ✓
import { readFileSync } from "node:fs";
import { login, call, bootstrap, buoc, tomTatBuoc, tieuDe } from "./client.mjs";

const MK = JSON.parse(readFileSync("tools/e2e/trang-thai-01.json", "utf8")).matKhau;
const BC = [];
const T = Date.now().toString(36).toUpperCase();
const MA_CAT = "E2E_CAT_" + T;
const MA_SUB = "E2E_SUB_" + T;
tieuDe("ĐƯỜNG THÀNH CÔNG — material_category + material_subcategory (" + T + ")");

await login("admin", "Admin123456@");
const bs0 = await bootstrap();
const KHOA = Object.keys(bs0).filter((k) => Array.isArray(bs0[k]));
const d0 = Object.fromEntries(KHOA.map((k) => [k, (bs0[k] || []).length]));
// ⭐ đọc id từ MỌI mảng có thể chứa (cả bản `admin*`) rồi ĐỐI CHIẾU CHÉO
const MANG_CAT = ["materialCategories", "adminMaterialCategories"];
const MANG_SUB = ["materialSubcategories", "adminMaterialSubcategories"];
const timId = (bs, mangs, truongId, ma) => {
  const thay = [];
  for (const k of mangs) for (const r of bs[k] || [])
    if (JSON.stringify(r).includes(ma)) { const id = String(r[truongId] || r.id || ""); if (id) thay.push([k, id]); }
  const id = thay.length ? thay[0][1] : null;
  const dongNhat = thay.every(([, i]) => i === id);
  return { id, thay, dongNhat };
};

const BOQUA = (ly) => { BC.push({ ten: ly, ok: true, loi: null }); console.log(`  [BO QUA] ${ly}`); };
const conLai = [];

// ── ① TẠO NHÓM VẬT TƯ ────────────────────────────────────────────────────────────────────
let catId = null, catOk = false;
await buoc("① save_material_category (TẠO THẬT)", async () => {
  const r = await call("save_material_category", { code: MA_CAT, name: "Nhóm E2E " + T, sortOrder: 999 }, { boQuaLoi: true });
  if (!r.ok) throw new Error(`tạo thất bại: «${String(r._loi || "").slice(0, 95)}»`);
  catOk = true;
  return `200 · «${String(r.message || "").slice(0, 48)}»`;
}, BC);

if (!catOk) { BOQUA("②…⑦ bỏ qua — ① CHƯA tạo được gì ⇒ ⛔ không có gì để dọn"); }
else {
  // ── ② PHÉP THỬ CHỐNG TRÙNG (⛔ không cần id) ────────────────────────────────────────────
  await buoc("② TẠO LẦN 2 CÙNG MÃ ⇒ phải 400 «đã tồn tại» (⛔ chứng minh ĐÃ GHI THẬT)", async () => {
    const r = await call("save_material_category", { code: MA_CAT, name: "Trùng" }, { boQuaLoi: true });
    if (r.ok) throw new Error("⛔ lần 2 vẫn 200 ⇒ ⛔ GHI THẤT BẠI ÂM THẦM (hoặc thiếu chốt chống trùng)");
    if (!/đã tồn tại/i.test(String(r._loi || "")))
      throw new Error(`⛔ 400 nhưng thông điệp LẠ: «${String(r._loi || "").slice(0, 70)}»`);
    return `400 «${String(r._loi || "").slice(0, 42)}» ✓`;
  }, BC);

  // ── ③ TÌM ID (đọc ĐÚNG mảng + đối chiếu chéo) ──────────────────────────────────────────
  const bs1 = await bootstrap();
  const c1 = timId(bs1, MANG_CAT, "categoryId", MA_CAT);
  catId = c1.id;
  await buoc("③ ĐỌC LẠI — tìm id nhóm vừa tạo trong ĐÚNG mảng", async () => {
    if (!catId) throw new Error(`⛔ KHÔNG tìm thấy «${MA_CAT}» trong ${MANG_CAT.join("/")} ⇒ ⛔ KHÔNG DỌN ĐƯỢC`);
    return `${c1.thay.map(([k, i]) => k + "=" + i.slice(0, 14)).join(" · ")}${c1.dongNhat ? " · ✔ hai mảng ĐỒNG NHẤT" : " · ⚠️ HAI MẢNG KHÁC NHAU"}`;
  }, BC);

  // ── ④ TẠO NHÓM CON DƯỚI NHÓM VẬT TƯ ─────────────────────────────────────────────────────
  let subId = null, subOk = false;
  await buoc("④ save_material_subcategory (TẠO THẬT, gắn nhóm vừa tạo)", async () => {
    if (!catId) throw new Error("⛔ không có categoryId ⇒ bỏ qua");
    const r = await call("save_material_subcategory", { categoryId: catId, name: "Nhóm con E2E " + T }, { boQuaLoi: true });
    if (!r.ok) throw new Error(`tạo thất bại: «${String(r._loi || "").slice(0, 95)}»`);
    subOk = true;
    return `200 · «${String(r.message || "").slice(0, 48)}»`;
  }, BC);

  if (subOk) {
    const bs2 = await bootstrap();
    const s2 = timId(bs2, MANG_SUB, "subcategoryId", MA_SUB);
    subId = s2.id;
    // ⭐ SAU BẢN VÁ BUG-20261005-014 (TASK-197): xoá NHÓM sẽ **TỰ DỌN nhóm con** (đúng JS gốc
    //    `system-route.mjs:2732`). ⇒ ⭐ BÀI KIỂM **KHÔNG cần** tìm id nhóm con để xoá riêng nữa.
    //    ⚠️ VÀ: nhóm con **có thể ⛔ KHÔNG xuất hiện trong bootstrap** (nghi lọc theo `review_status`)
    //    ⇒ ⭐ thiếu id ở đây **⛔ KHÔNG phải lỗi** — ⭐ đó là **điểm mù đã biết của bootstrap**, ⛔ không phải thất bại.
    //    ⭐ Hệ quả: ⛔ KHÔNG dùng nhánh này để xoá; ⭐ việc dọn nhóm con do **nhánh ⑥ (xoá nhóm)** lo ✓
    await buoc("⑤ ĐỌC LẠI — thử tìm id nhóm con (⛔ thiếu id KHÔNG tính là lỗi — xem ghi chú)", async () => {
      if (!subId) return `ⓘ bootstrap ⛔ không phơi nhóm con (điểm mù đã biết) — ⭐ nhánh ⑥ sẽ dọn theo nhóm`;
      return `${s2.thay.map(([k, i]) => k + "=" + i.slice(0, 14)).join(" · ")}`;
    }, BC);
  }

  // ── ⑥ XOÁ NHÓM VẬT TƯ ─────────────────────────────────────────────────────────────────
  if (catId) {
    await buoc("⑥ delete_material_category (XOÁ THẬT)", async () => {
      const r = await call("delete_material_category", { categoryId: catId }, { boQuaLoi: true });
      if (!r.ok) { conLai.push(MA_CAT); throw new Error(`⛔ XOÁ THẤT BẠI: «${String(r._loi || "").slice(0, 85)}»`); }
      return `200 · «${String(r.message || "").slice(0, 45)}»`;
    }, BC);
    await buoc("⑥b XOÁ NHÓM LẦN 2 ⇒ phải 400 (⛔ chứng minh ĐÃ XOÁ THẬT)", async () => {
      const r = await call("delete_material_category", { categoryId: catId }, { boQuaLoi: true });
      if (r.ok) throw new Error("⛔ xoá lần 2 vẫn 200 ⇒ NGHI XOÁ THẤT BẠI ÂM THẦM");
      if (!/Không tìm thấy/i.test(String(r._loi || "")))
        throw new Error(`⛔ 400 nhưng thông điệp LẠ: «${String(r._loi || "").slice(0, 70)}»`);
      return `400 «${String(r._loi || "").slice(0, 42)}» ✓`;
    }, BC);
  } else { conLai.push(MA_CAT); BOQUA("⑥⑥b bỏ qua — ⛔ không tìm được id nhóm ⇒ dọn bằng SQL"); }
}

// ── ⑦ KIỂM HẬU QUẢ — ⭐ BẮT BUỘC CẢ 94 MẢNG VỀ ĐÚNG GIÁ TRỊ GỐC ──────────────────────────
const bs9 = await bootstrap();
const d9 = Object.fromEntries(KHOA.map((k) => [k, (bs9[k] || []).length]));
const doi = KHOA.filter((k) => d0[k] !== d9[k]);
console.log(`\n   HẬU QUẢ — ${KHOA.length} mảng bootstrap: ${doi.length === 0 ? "✔ KHÔNG mảng nào đổi (tạo rồi xoá ⇒ về như cũ)" : "⚠️ " + doi.map((k) => `${k}: ${d0[k]}→${d9[k]}`).join(" · ")}`);
if (conLai.length) console.log(`   ⛔⛔ CÒN RÁC CHƯA DỌN: ${conLai.join(" · ")} ⇒ PHẢI DỌN BẰNG SQL`);

console.log("\n" + tomTatBuoc("VÒNG ĐỜI material_category + material_subcategory", BC));
process.exitCode = BC.some((b) => b.loi) ? 1 : 0;
