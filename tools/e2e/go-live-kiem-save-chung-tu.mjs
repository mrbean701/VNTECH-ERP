// GO-LIVE 05/10/2026 — KIỂM KHUÔN CHO CÁC `save_*` THỰC THỂ CHỨNG TỪ **CHƯA TỪNG TEST**.
//
// BỐI CẢNH: `ActionRbacRegistry` có **50 `save_*`** nhưng tới nay mới test **~14** ⇒ còn **~36 chưa test**.
// ⛔ BÀI NÀY **KHÔNG TẠO DỮ LIỆU**: gọi `save_*` với **payload RỖNG** và kỳ vọng **400**
//    (⛔ nếu trả 200 ⇒ có thể đã ghi **dòng rác** ⇒ phải điều tra ngay).
//
// ⛔⛔ DANH SÁCH **LOẠI TRỪ** — ⛔ KHÔNG BAO GIỜ gọi với payload rỗng vì có thể PHÁ CẤU HÌNH/BẢO MẬT:
//   · `save_user_access`            → REPLACE-ALL quyền (⛔ đã cam kết không chạy)
//   · `save_department_permission`  → kích hoạt `syncDepartmentUsers` (đường đi của BUG-20261010)
//   · `save_email_settings` · `save_ui_display_settings` · `save_trust_development_settings`
//   · `save_form_field_config` · `save_menu_group` · `save_module_catalog` · `save_role_catalog`
//   · `save_system_level` · `save_workflow` · `save_approval_stage` · `save_notification_config`
//   · `save_material_category` · `save_material_subcategory` · `save_material`
//   · `save_business_role_group` · `save_business_scope` · `save_organization_unit`
//   ⓘ Nhóm trên là CẤU HÌNH/DANH MỤC/DANH TÍNH ⇒ payload rỗng có thể **xoá hoặc ghi đè** ⇒ ⛔ không thử.
//
// ⓘ SÁU action đã test ở bài `go-live-kiem-6-thuc-the.mjs`: `save_material_norm` · `save_payment_plan` ·
//   `save_seal` · `save_legal_document` · `save_correspondence` · `save_business_role_group` ⇒ ⛔ không lặp lại.
import { readFileSync } from "node:fs";
import { login, call, bootstrap, buoc, tomTatBuoc, tieuDe } from "./client.mjs";

const MK = JSON.parse(readFileSync("tools/e2e/trang-thai-01.json", "utf8")).matKhau;
const BC = [];
tieuDe("KIỂM KHUÔN 23 `save_*` THỰC THỂ CHỨNG TỪ CHƯA TỪNG TEST (payload RỖNG → kỳ vọng 400)");

// ⭐ Danh sách CHỈ gồm THỰC THỂ CHỨNG TỪ/NGHIỆP VỤ (⛔ không có cấu hình/danh mục/bảo mật).
const DS = [
  "save_accounting_voucher", "save_advance_request", "save_bank_account", "save_benefit_record",
  "save_boq_item", "save_boq_version", "save_capital_recovery", "save_cashbook_entry",
  "save_construction_daily_log", "save_contract_payment", "save_engine_role_profile",
  "save_hr_record", "save_labor_contract", "save_mar_approval", "save_material_external_code",
  "save_material_uom_conversion", "save_production_report", "save_project_contract",
  "save_site_expense_claim", "save_supplier_material", "save_team_payment",
  "save_team_production", "save_team_subcontract", "save_warehouse_location",
];

await login("admin", "Admin123456@");
const truoc = await bootstrap();

for (const a of DS) {
  await buoc(`${a} với payload RỖNG → kỳ vọng 400`, async () => {
    const r = await call(a, {}, { boQuaLoi: true });
    if (r?.ok) throw new Error(`⛔ TRẢ 200 cho payload RỖNG — ⚠️ có thể đã ghi DÒNG RÁC ⇒ phải điều tra!`);
    const loi = String(r?._loi || r?.message || "");
    return `400 · ${loi.slice(0, 60)}`;
  }, BC);
}

// ── KIỂM HẬU QUẢ TẠI CHỖ: payload rỗng ⛔ KHÔNG được tạo dòng nào ────────────────────────────
const sau = await bootstrap();
const KHOA = Object.keys(truoc).filter((k) => Array.isArray(truoc[k]));
let doi = 0;
for (const k of KHOA) {
  const t = truoc[k].length, s2 = (sau[k] || []).length;
  if (t !== s2) { console.log(`   ⛔ ${k}: ${t} → ${s2} — ĐÃ ĐỔI!`); doi++; }
}
console.log(`   Đối chiếu ${KHOA.length} mảng bootstrap: ${doi === 0 ? "✔ KHÔNG mảng nào đổi" : `⛔ ${doi} mảng ĐÃ ĐỔI`}`);

console.log("\n" + tomTatBuoc("KIỂM KHUÔN 23 `save_*` CHỨNG TỪ", BC));
process.exitCode = BC.some((b) => b.loi) ? 1 : 0;
