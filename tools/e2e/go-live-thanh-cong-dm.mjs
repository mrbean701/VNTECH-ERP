// GO-LIVE 05/10/2026 — ĐƯỜNG THÀNH CÔNG (TASK-194): VÒNG ĐỜI CRUD `material_norm`.
//
// ⭐ PHƯƠNG PHÁP 7 BƯỚC (đã chứng minh ở TASK-193 với `business_role_group`):
//   ① ĐỌC MÃ UseCase ⇒ tên trường + điều kiện (⛔ KHÔNG ĐOÁN) — đã làm, xem dưới
//   ② ĐỌC CSDL / dữ liệu thật nếu cần
//   ③ TẠO THẬT  ④ ĐỌC LẠI (⛔ không tin lời hứa 200)  ⑤ SỬA + XOÁ THẬT
//   ⑥ ĐỌC LẠI xác nhận SẠCH  ⑦ KIỂM HẬU QUẢ (mọi mảng bootstrap + `chup-so-dong.mjs`)
//
// ⭐ HỢP ĐỒNG ĐỌC TỪ MÃ (`MaterialCatalogManagementUseCase.saveMaterialNorm`):
//   BẮT BUỘC : `itemName` (⛔ rỗng ⇒ 400 «Hạng mục áp định mức là bắt buộc.»)
//              `quantityPerUnit` (**> 0** ⇒ ⛔ ≤0 thì 400 «Định mức tiêu hao phải lớn hơn 0.»)
//   TUỲ CHỌN : `normId` (rỗng ⇒ THÊM · có + tồn tại ⇒ CẬP NHẬT) · `projectId` · `subcategoryId`
//              `materialId` (⭐ nếu có thì PHẢI tồn tại & đang hoạt động) · `baseUom` · `unit`
//              `sourceComponentId` · `notes`
//   ⭐ `normCode` **TỰ SINH** (`"DM-" + %04d(countNorms()+1)`) ⇒ ⛔ KHÔNG gửi
//   `deleteMaterialNorm` : cần `normId` TỒN TẠI, ⛔ không thì 400 «Không tìm thấy định mức.»
//
// ⭐⭐ CÁCH KIỂM CHỨNG TỰ THÂN (⛔ không phụ thuộc bootstrap): gọi `save` **LẦN 2 cùng `normId`**
//    ⇒ thông điệp phải đổi từ «Đã **thêm** …» sang «Đã **cập nhật** …» ⇒ ⭐ CHỨNG MINH đã ghi thật.
//    Gọi `delete` **LẦN 2** ⇒ phải 400 «Không tìm thấy định mức.» ⇒ ⭐ CHỨNG MINH đã xoá thật.
import { readFileSync } from "node:fs";
import { login, call, bootstrap, buoc, tomTatBuoc, tieuDe } from "./client.mjs";

const MK = JSON.parse(readFileSync("tools/e2e/trang-thai-01.json", "utf8")).matKhau;
const BC = [];
const MA = "E2E_DM_" + Date.now().toString(36).toUpperCase();
tieuDe("ĐƯỜNG THÀNH CÔNG — vòng đời CRUD `material_norm` (" + MA + ")");

await login("admin", "Admin123456@");
const bs0 = await bootstrap();
const KHOA = Object.keys(bs0).filter((k) => Array.isArray(bs0[k]));
const d0 = Object.fromEntries(KHOA.map((k) => [k, (bs0[k] || []).length]));

// ── ③ TẠO THẬT ──────────────────────────────────────────────────────────────────────────
let normId = null, taoOk = false;
await buoc("③ save_material_norm — THÊM MỚI (payload tối thiểu hợp lệ)", async () => {
  const r = await call("save_material_norm", { itemName: MA, quantityPerUnit: 1 }, { boQuaLoi: true });
  if (!r.ok) throw new Error(`thêm thất bại: «${String(r._loi || "").slice(0, 100)}»`);
  const m = String(r.message || "");
  if (!/thêm/i.test(m)) throw new Error(`⛔ 200 nhưng thông điệp LẠ (⛔ không phải «thêm»): «${m.slice(0, 70)}»`);
  taoOk = true;
  return `200 · «${m.slice(0, 50)}»`;
}, BC);

const BOQUA = (ly) => { BC.push({ ten: ly, ok: true, loi: null }); console.log(`  [BO QUA] ${ly}`); };

if (!taoOk) {
  BOQUA("④⑤⑥ bỏ qua — bước ③ CHƯA tạo được gì nên ⛔ KHÔNG có gì để đọc/sửa/xoá");
  console.log("      ⓘ ⛔ KHÔNG có bản rác nào được tạo ⇒ ⛔ không cần dọn.");
} else {
  // ── ④ ĐỌC LẠI — dùng CHÍNH action để chứng minh đã ghi (gọi lại ⇒ phải chuyển sang «cập nhật») ──
  await buoc("④ ĐỌC LẠI — gọi lại cùng payload ⇒ phải thấy định mức ĐÃ TỒN TẠI", async () => {
    // Tìm normId vừa tạo: quét mọi mảng bootstrap có khoá giống 'norm'
    const bs1 = await bootstrap();
    const ung = Object.keys(bs1).filter((k) => /norm/i.test(k) && Array.isArray(bs1[k]));
    for (const k of ung) {
      const row = (bs1[k] || []).find((x) => JSON.stringify(x).includes(MA));
      if (row) { normId = String(row.id || row.normId || ""); break; }
    }
    if (!normId) return `⚠️ bootstrap ⛔ không phơi định mức (khoá giống «norm»: ${ung.length ? ung.join(",") : "⛔ không có"}) — sẽ xác nhận bằng cách gọi lại ở bước ⑤`;
    return `thấy id=${normId.slice(0, 18)}… trong «${ung.join(",")}»`;
  }, BC);

  // ── ⑤ SỬA THẬT — cách kiểm chứng TỰ THÂN: nếu có normId thì gọi lại ⇒ phải là «cập nhật» ──
  await buoc("⑤ save_material_norm LẦN 2 — phải chuyển sang «Đã cập nhật» (⛔ chứng minh ĐÃ GHI THẬT)", async () => {
    if (!normId) throw new Error("⛔ chưa có normId ⇒ ⛔ KHÔNG DỌN ĐƯỢC — dọn tay mã «" + MA + "»!");
    const r = await call("save_material_norm", { normId, itemName: MA, quantityPerUnit: 2 }, { boQuaLoi: true });
    if (!r.ok) throw new Error(`cập nhật thất bại: «${String(r._loi || "").slice(0, 100)}»`);
    const m = String(r.message || "");
    if (!/cập nhật/i.test(m))
      throw new Error(`⛔ gọi lần 2 mà ⛔ KHÔNG chuyển sang «cập nhật» (nhận «${m.slice(0, 60)}») ⇒ NGHI GHI THẤT BẠI ÂM THẦM`);
    return `200 · «${m.slice(0, 50)}»`;
  }, BC);

  // ── ⑤b XOÁ THẬT ───────────────────────────────────────────────────────────────────────
  await buoc("⑤b delete_material_norm — XOÁ THẬT (DỌN SẠCH)", async () => {
    const r = await call("delete_material_norm", { normId }, { boQuaLoi: true });
    if (!r.ok) throw new Error(`⛔ XOÁ THẤT BẠI: «${String(r._loi || "").slice(0, 90)}» ⇒ CÒN RÁC «${MA}»`);
    return `200 · «${String(r.message || "").slice(0, 50)}»`;
  }, BC);

  // ── ⑥ ĐỌC LẠI — xoá lần 2 ⇒ PHẢI 400 «Không tìm thấy» ⇒ chứng minh đã xoá thật ─────────
  await buoc("⑥ delete LẦN 2 — phải 400 «Không tìm thấy định mức.» (⛔ chứng minh ĐÃ XOÁ THẬT)", async () => {
    const r = await call("delete_material_norm", { normId }, { boQuaLoi: true });
    if (r.ok) throw new Error("⛔ xoá lần 2 vẫn trả 200 ⇒ NGHI XOÁ THẤT BẠI ÂM THẦM");
    if (!/Không tìm thấy/i.test(String(r._loi || "")))
      throw new Error(`⛔ 400 nhưng thông điệp LẠ: «${String(r._loi || "").slice(0, 70)}»`);
    return `400 «${String(r._loi || "").slice(0, 45)}» ✓`;
  }, BC);
}

// ── ⑦ KIỂM HẬU QUẢ ──────────────────────────────────────────────────────────────────────
const bs2 = await bootstrap();
const d2 = Object.fromEntries(KHOA.map((k) => [k, (bs2[k] || []).length]));
const doi = KHOA.filter((k) => d0[k] !== d2[k]);
console.log(`\n   HẬU QUẢ — ${KHOA.length} mảng bootstrap: ${doi.length === 0 ? "✔ KHÔNG mảng nào đổi (tạo rồi xoá ⇒ về như cũ)" : "⚠️ " + doi.map((k) => `${k}: ${d0[k]}→${d2[k]}`).join(" · ")}`);
if (doi.length) console.log("   ⛔ Mảng đổi KHÁC dự kiến ⇒ phải kiểm tay trước khi kết luận.");
console.log(`   ⓘ Mã dùng-một-lần: ${MA}`);

console.log("\n" + tomTatBuoc("VÒNG ĐỜI material_norm (ĐƯỜNG THÀNH CÔNG)", BC));
process.exitCode = BC.some((b) => b.loi) ? 1 : 0;
