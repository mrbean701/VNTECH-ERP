// GO-LIVE 05/10/2026 — KIỂM 12 ACTION CỦA 6 THỰC THỂ CHƯA TỪNG TEST, THEO **KHUÔN 400** ĐÃ XÁC LẬP.
//
// BỐI CẢNH: 6 thực thể `material_norm` · `payment_plan` · `seal` · `legal_document` · `correspondence` ·
// `business_role_group` đều có cặp `save_*` + `delete_*` và **UI có gọi**, nhưng **chưa từng được test**.
// ⛔ BÀI NÀY **KHÔNG TẠO DỮ LIỆU**: chỉ kiểm hai khuôn đã xác lập ở 34 action khác:
//   ① `delete_*` với **id BỊA**  → kỳ vọng **400 «Không tìm thấy …»** (⛔ KHÔNG được trả 200 — đó là BUG-20261011)
//   ② `save_*`  với **payload RỖNG** → kỳ vọng **400** (⛔ không được ghi dòng rác)
//
// ⓘ ĐỐI CHIẾU CƠ CHẾ ĐÃ BIẾT (ActionRbacRegistry):
//   material_norm        → module `material_norms`              · save=canCreate · delete=canEdit
//   payment_plan         → module `dept_finance_payment_plan`   · save=canCreate · delete=canEdit
//   seal                 → module `dept_legal_seal`             · save=canCreate · delete=canEdit
//   legal_document       → module `dept_legal_documents`        · save=canCreate · delete=canEdit
//   correspondence       → module `dept_legal_correspondence`   · save=canCreate · delete=canEdit
//   business_role_group  → module `[]` (KHÔNG có cổng module)  · save=canUse    · delete=canUse
import { login, call, bootstrap, buoc, tomTatBuoc, tieuDe } from "./client.mjs";

const MK = JSON.parse(await import("node:fs").then((m) => m.readFileSync("tools/e2e/trang-thai-01.json", "utf8"))).matKhau;
const BC = [];
const ID_BI = "KHONG-CO-THUC-THE-NAY-00000000";

tieuDe("KIỂM 12 ACTION · 6 THỰC THỂ CHƯA TỪNG TEST (theo khuôn 400)");

await login("admin", "Admin123456@");
const truoc = await bootstrap();
const demTruoc = (bs) => ({
  material_norms: (bs.materialNorms || []).length,
});

const DS = [
  { ten: "material_norm", save: "save_material_norm", del: "delete_material_norm", idKey: "normId" },
  { ten: "payment_plan", save: "save_payment_plan", del: "delete_payment_plan", idKey: "planId" },
  { ten: "seal", save: "save_seal", del: "delete_seal", idKey: "sealId" },
  { ten: "legal_document", save: "save_legal_document", del: "delete_legal_document", idKey: "documentId" },
  { ten: "correspondence", save: "save_correspondence", del: "delete_correspondence", idKey: "correspondenceId" },
  { ten: "business_role_group", save: "save_business_role_group", del: "delete_business_role_group", idKey: "groupId" },
];

for (const e of DS) {
  // ① delete với id BỊA — kỳ vọng 400
  await buoc(`① ${e.del} với id BỊA → kỳ vọng 400`, async () => {
    const r = await call(e.del, { [e.idKey]: ID_BI, id: ID_BI }, { boQuaLoi: true });
    if (r?.ok) throw new Error(`⛔ TRẢ 200 cho id BỊA — vi phạm khuôn «Không tìm thấy» (xem BUG-20261011)`);
    const loi = String(r?._loi || r?.message || "");
    if (!/Không tìm thấy|không tồn tại|Không có/i.test(loi))
      throw new Error(`⛔ 400 nhưng THÔNG ĐIỆP LẠ: «${loi.slice(0, 90)}»`);
    return `400 · ${loi.slice(0, 70)}`;
  }, BC);

  // ② save với payload RỖNG — kỳ vọng 400 (⛔ không ghi dòng rác)
  await buoc(`② ${e.save} với payload RỖNG → kỳ vọng 400`, async () => {
    const r = await call(e.save, {}, { boQuaLoi: true });
    if (r?.ok) throw new Error(`⛔ TRẢ 200 cho payload RỖNG — có thể đã ghi dòng rác!`);
    const loi = String(r?._loi || r?.message || "");
    return `400 · ${loi.slice(0, 70)}`;
  }, BC);
}

// ── KIỂM HẬU QUẢ TẠI CHỖ: ⛔ payload rỗng KHÔNG được tạo dòng nào ────────────────────────
const sau = await bootstrap();
const TRUONG = ["materialNorms", "paymentPlans", "seals", "legalDocuments", "correspondences", "businessRoleGroups"];
for (const k of TRUONG) {
  const t = (truoc[k] || []).length, s2 = (sau[k] || []).length;
  console.log(`   ${k.padEnd(20)} ${t} → ${s2} ${t === s2 ? "✔ không đổi" : "⛔ ĐÃ ĐỔI — payload rỗng GHI ĐƯỢC DỮ LIỆU!"}`);
}

console.log("\n" + tomTatBuoc("KIỂM 12 ACTION · 6 THỰC THỂ", BC));
process.exitCode = BC.some((b) => b.loi) ? 1 : 0;
