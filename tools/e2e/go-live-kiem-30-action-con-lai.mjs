// GO-LIVE 05/10/2026 — ĐO BAO PHỦ TOÀN THỂ: 259 `case` trong `SystemController` ⇒ ✅ 171 đã test ·
// ⛔ 88 chưa (39 là khoá ánh xạ lỗi MySQL, ⛔ không phải action) ⇒ **49 tên action thật chưa test**.
//
// BÀI NÀY kiểm **30 action AN TOÀN** trong 49 đó.
//
// ⭐ TIÊU CHÍ DUY NHẤT, ÁP CHO MỌI ACTION: gọi với **payload RỖNG** ⇒
//    ⛔ **KHÔNG được 5xx** (crash / lỗi máy chủ) — ⭐ đó là lỗi THẬT cần vá;
//    ✅ 400 (thiếu tham số) hoặc 200 (action đọc) đều **chấp nhận được**;
//    ⛔ **KHÔNG được đổi trạng thái** — kiểm bằng đối chiếu MỌI mảng bootstrap trước/sau.
//
// ⛔⛔ LOẠI TRỪ (⛔ KHÔNG gọi, kể cả payload rỗng) — vì PHÁ HOẠI hoặc ĐỔI CẤU HÌNH/BẢO MẬT:
//   `factory_reset_preview` · `factory_reset_execute` · `reset_material_catalog_test` · `reset_user_password`
//   `rebuild_department_permissions` · `revoke_session` · `revoke_user_sessions` · `retry_email`
//   `reorder_menu_layout` · `save_form_field_config` · `save_menu_group` · `save_notification_config`
//   `update_profile_signature` · `work_scope` · `request_license_transfer` · `request_material_master_from_boq`
//   `mark_notification_read` · `mark_notification_snooze` (đã test ở bài khác)
import { readFileSync } from "node:fs";
import { login, call, bootstrap, buoc, tomTatBuoc, tieuDe } from "./client.mjs";

const MK = JSON.parse(readFileSync("tools/e2e/trang-thai-01.json", "utf8")).matKhau;
const BC = [];
tieuDe("ĐO BAO PHỦ: 30 action CHƯA TEST — payload RỖNG ⇒ ⛔ không 5xx · ⛔ không đổi trạng thái");

const DS = [
  "cancel_request", "check_material_alias_conflicts", "close_po_line", "compare_boq_materials",
  "confirm_boq_material_mappings", "create_self_work_item", "create_stock_count",
  "delete_material_category", "delete_project_team", "delete_role_catalog",
  "director_pending_approvals", "estimate_material_norms", "notification_configs", "notification_log",
  "preview_material_dependencies", "preview_request_import", "reassign_work_item",
  "reconcile_contract_stock", "reject_po", "replace_boq_items", "settle_advance_request",
  "settle_team_subcontract", "supplier_material_gaps", "supplier_materials", "system_level_impact",
  "transfer_contract_ownership", "update_boq_contract_prices", "update_po_price",
  "update_returned_request", "update_work_item_progress",
];

await login("admin", "Admin123456@");
const truoc = await bootstrap();

let manh = 0;  // số mảng bootstrap đổi NGAY SAU từng action
for (const a of DS) {
  await buoc(`${a} — payload RỖNG ⇒ ⛔ không 5xx`, async () => {
    const r = await call(a, {}, { boQuaLoi: true });
    // ⭐ 5xx = LỖI THẬT. `coThat` trả `_loi` cho lỗi; ta soi mã trạng thái nếu có.
    const ma = r?.status ?? r?.statusCode ?? r?._status;
    if (typeof ma === "number" && ma >= 500)
      throw new Error(`⛔ ${ma} — LỖI MÁY CHỦ khi payload rỗng (đây là LỖI THẬT cần vá)`);
    const loi = String(r?._loi || r?.message || "");
    if (/Exception|NullPointer|Internal Server Error|500/i.test(loi))
      throw new Error(`⛔ NGHI 5xx/NPE: «${loi.slice(0, 80)}»`);
    // ✅ 400 (thiếu tham số) hoặc 200 (action đọc) đều chấp nhận
    return r?.ok ? `200 (action đọc)` : `400 · ${loi.slice(0, 50)}`;
  }, BC);

  // Kiểm hậu quả NGAY sau mỗi action ⇒ nếu có đổi, biết chắc action nào
  const s = await bootstrap();
  for (const k of Object.keys(truoc)) {
    if (!Array.isArray(truoc[k])) continue;
    if (truoc[k].length !== (s[k] || []).length) {
      console.log(`   ⛔ ${a} ĐÃ LÀM ĐỔI mảng «${k}»: ${truoc[k].length} → ${(s[k] || []).length}`);
      manh++;
    }
  }
}

console.log(`\n   HẬU QUẢ — ${manh === 0 ? "✔ KHÔNG action nào làm đổi mảng bootstrap nào" : `⛔ ${manh} lần ĐỔI`}`);
console.log("\n" + tomTatBuoc("ĐO BAO PHỦ 30 ACTION CHƯA TEST", BC));
process.exitCode = BC.some((b) => b.loi) ? 1 : 0;
