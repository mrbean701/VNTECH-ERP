// GO-LIVE 05/10/2026 — KIỂM HỆ THỐNG: **MỌI `save_*` với THAM SỐ MÉO** (TASK-209).
//
// ⭐⭐⭐ VÌ SAO BÀI NÀY — **TỔNG QUÁT HOÁ PHÁT HIỆN CỦA VÒNG 62**:
//   ⭐ **CẢ 3 LỖI 500** của phiên đều lộ ra khi gọi action với **tham số BẤT THƯỜNG**:
//     · BUG-20261005-012 — SQL 1055 (`check_material_alias_conflicts`)
//     · BUG-20261005-013 — SQL 1054 (`preview_material_dependencies`)
//     · BUG-20261005-015 — `voucherDate.substring(0,4)` trên chuỗi ngắn ⇒ StringIndexOutOfBounds
//   ⇒ ⭐⭐ **KIỂM HỆ THỐNG**: gọi **MỌI `save_*`** với tham số **MÉO nhưng ⛔ KHÔNG RỖNG** ⇒
//      ⭐ **bắt mọi lỗi `substring` / `parse*` / `.get(0)` / SQL còn sót** ✓
//
// ⭐ THAM SỐ MÉO DÙNG CHUNG: **`"1"`** — ⭐ nó **KHÔNG RỖNG** (⇒ ⛔ không bị chốt «bắt buộc» chặn)
//   nhưng **SAI ĐỊNH DẠNG** với mọi thứ cần ngày/số/khoá ⇒ ⭐ **chính xác cái đã giết `voucherDate`** ✓
//
// ⛔ TIÊU CHÍ DUY NHẤT: ⛔ **KHÔNG được 5xx**. ✅ 400 (bị chốt chặn) hoặc 200 (không làm gì) đều nhận ✓
// ⛔ KỶ LUẬT: bọc `chup-so-dong.mjs --truoc/--sau`; mọi giá trị đều mang **DẤU VẾT RIÊNG** `E2E-MALFORM-*`
//   để ⭐ **lọc rác theo dấu vết riêng** nếu có (⭐ quy tắc từ TASK-201) ✓
import { readFileSync } from "node:fs";
import { login, call, bootstrap, buoc, tomTatBuoc, tieuDe } from "./client.mjs";

const MK = JSON.parse(readFileSync("tools/e2e/trang-thai-01.json", "utf8")).matKhau;
const BC = [];
const DAU_VET = "E2E-MALFORM";   // ⭐ DẤU VẾT RIÊNG — mọi giá trị gửi đi đều mang nó
tieuDe("KIỂM HỆ THỐNG: MỌI `save_*` với THAM SỐ MÉO — ⛔ kỳ vọng KHÔNG 5xx");

// ⭐ DANH SÁCH: mọi `save_*` trong ActionRbacRegistry (⭐ trừ action đã biết chưa cài + `save_user_access`).
//    ⛔ `save_user_access` BỊ LOẠI: nó REPLACE-ALL quyền (⭐ đã cam kết ⛔ không chạy).
const DS = [
  "save_accounting_voucher", "save_advance_request", "save_approval_stage", "save_bank_account",
  "save_benefit_record", "save_boq_item", "save_boq_version", "save_business_role_group",
  "save_business_scope", "save_capital_recovery", "save_cashbook_entry", "save_construction_daily_log",
  "save_contract_payment", "save_correspondence", "save_email_settings", "save_engine_role_profile",
  "save_error_report", "save_form_field_config", "save_hr_record", "save_labor_contract",
  "save_legal_document", "save_mar_approval", "save_material", "save_material_category",
  "save_material_external_code", "save_material_norm", "save_material_subcategory",
  "save_material_uom_conversion", "save_menu_group", "save_module_catalog", "save_notification_config",
  "save_organization_unit", "save_partner", "save_payment_plan", "save_production_report",
  "save_project_contract", "save_role_catalog", "save_seal", "save_site_expense_claim",
  "save_supplier", "save_supplier_material", "save_system_level", "save_team_payment",
  "save_team_production", "save_team_subcontract", "save_trust_development_settings",
  "save_ui_display_settings", "save_warehouse_location", "save_workflow",
];

// ⭐ mọi khoá có thể mà một `save_*` hay đọc — gán `"1"` (⭐ MÉO nhưng ⛔ KHÔNG RỖNG):
//    ⭐ riêng các trường MÃ/TÊN nhận thêm DẤU VẾT RIÊNG để lọc rác về sau.
const KHOA = ["id", "code", "name", "no", "date", "year", "type", "status", "kind", "role", "level",
  "categoryId", "subcategoryId", "projectId", "contractId", "supplierId", "partnerId", "materialId",
  "userId", "accountId", "warehouseId", "teamId", "groupId", "workflowId", "stageId", "planId",
  "sealId", "docId", "corrId", "normId", "benefitId", "entryId", "voucherId", "logId", "itemId",
  "sourceItemId", "boqVersionId", "boqItemId", "approverUserIds", "scopeIds", "materialIds",
  "items", "lines", "stages", "permissions", "unit", "uom", "note", "description", "active", "sortOrder"];
const payloadMeo = () => {
  const p = {};
  for (const k of KHOA) {
    if (["approverUserIds", "scopeIds", "materialIds", "items", "lines", "stages", "permissions"].includes(k)) p[k] = ["1"];
    else if (["active"].includes(k)) p[k] = "1";
    else p[k] = k.match(/code|name|no$/i) ? `${DAU_VET}-${k}` : "1";   // ⭐ mã/tên mang DẤU VẾT RIÊNG
  }
  return p;
};

await login("admin", "Admin123456@");
const bs0 = await bootstrap();
const KHOA_BS = Object.keys(bs0).filter((k) => Array.isArray(bs0[k]));
const d0 = Object.fromEntries(KHOA_BS.map((k) => [k, (bs0[k] || []).length]));

for (const a of DS) {
  await buoc(`${a} — tham số MÉO "1" ⇒ ⛔ KHÔNG 5xx`, async () => {
    const r = await call(a, payloadMeo(), { boQuaLoi: true });
    const ma = r?.status ?? r?.statusCode ?? r?._status;
    if (typeof ma === "number" && ma >= 500)
      throw new Error(`⚠️⚠️ ${ma} — 500: tham số méo "1" làm nổ ngoại lệ ⛔ không bắt`);
    const loi = String(r?._loi || r?.message || "");
    if (/Exception|NullPointer|Internal Server Error|SQLSyntax|1054|1055|1048/i.test(loi))
      throw new Error(`⚠️ NGHI 5xx/SQL: «${loi.slice(0, 90)}»`);
    return r.ok ? `200 · «${String(r.message || "").slice(0, 30)}»` : `400 · ${loi.slice(0, 46)}`;
  }, BC);
}

// ── KIỂM HẬU QUẢ ────────────────────────────────────────────────────────────────────────
const bs9 = await bootstrap();
const d9 = Object.fromEntries(KHOA_BS.map((k) => [k, (bs9[k] || []).length]));
const doi = KHOA_BS.filter((k) => d0[k] !== d9[k]);
console.log(`\n   HẬU QUẢ — ${KHOA_BS.length} mảng bootstrap: ${doi.length === 0 ? "✔ KHÔNG mảng nào đổi (tham số méo ⇒ ⛔ không tạo gì)" : "⚠️ " + doi.map((k) => `${k}: ${d0[k]}→${d9[k]}`).join(" · ")}`);
if (doi.length) console.log(`   ⛔ PHẢI DỌN: lọc theo DẤU VẾT RIÊNG «${DAU_VET}» trên các bảng tương ứng`);

console.log("\n" + tomTatBuoc("KIỂM HỆ THỐNG `save_*` VỚI THAM SỐ MÉO", BC));
process.exitCode = BC.some((b) => b.loi) ? 1 : 0;
