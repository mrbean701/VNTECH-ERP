// GO-LIVE 05/10/2026 — PHỦ TIẾP họ `set_*_status` / `approve_*` / `confirm_*` … BẰNG ID BỊA.
//
// ⛔ NGUYÊN TẮC: chỉ id KHÔNG TỒN TẠI + giá trị vô nghĩa ⇒ ⛔ KHÔNG thể đổi trạng thái dữ liệu thật.
//   Kỳ vọng: **400 sạch** (chốt chặn hoạt động). ⛔ 200 = báo thành công sai (như BUG-20261010/011).
//
// ⛔⛔ BA ACTION BỊ LOẠI TRỪ VÌ **ĐỔI CẤU HÌNH THẬT** (⛔ không phải bỏ sót — ghi rõ lý do):
//   · `reorder_menu_layout`  — gửi payload bịa có thể **GHI ĐÈ bố cục menu thật**
//   · `reset_material_catalog_test` — tên nói «reset» ⇒ ⛔ nguy cơ xoá danh mục vật tư
//   · `delete_unused_materials` — ⛔ xoá MỌI vật tư không dùng (đã loại ở bài trước)
import { login, call, ghi } from "./client.mjs";

const MK_ADMIN = "Admin123456@";
const MA = "E2E_KHONG_TON_TAI_5e91";

console.log("=".repeat(84));
console.log("GO-LIVE — PHỦ `set_*_status` / `approve_*` / `confirm_*` … BẰNG ID BỊA");
console.log("=".repeat(84));
console.log("⛔ Loại trừ (đổi cấu hình thật): reorder_menu_layout · reset_material_catalog_test · delete_unused_materials\n");

await login("admin", MK_ADMIN);

/** [action, payload bịa] — khoá ĐỌC TỪ mã UI. */
const MAU = [
  // ── set_*_status ──────────────────────────────────────────────────────────────
  ["set_benefit_record_status", { benefitId: MA, status: "inactive" }],
  ["set_boq_item_status", { sourceItemId: MA, active: 0, reason: "E2E" }],
  ["set_business_scope_status", { scopeId: MA, active: 0 }],
  ["set_labor_contract_status", { contractId: MA, status: "ended" }],
  ["set_material_norm_status", { normId: MA, active: 0 }],
  ["set_material_status", { materialId: MA, active: 0 }],
  ["set_material_subcategory_status", { subcategoryId: MA, active: 0 }],
  ["set_menu_group_status", { groupId: MA, active: 0 }],
  ["set_module_status", { moduleKey: MA, active: 0 }],
  ["set_notification_config_status", { configId: MA, active: 0 }],
  ["set_organization_unit_status", { organizationUnitId: MA, active: 0 }],
  ["set_organization_unit_member", { userId: MA, organizationUnitId: MA }],
  ["set_partner_status", { partnerId: MA, active: 0 }],
  ["set_payment_plan_status", { planId: MA, status: "paid", paidAmount: 1 }],
  ["set_project_contract_status", { contractId: MA, active: false }],
  ["set_project_status", { projectId: MA, status: "closed" }],
  ["set_seal_status", { sealId: MA, status: "inactive" }],
  ["set_supplier_status", { supplierId: MA, active: 0 }],
  ["set_system_level_status", { levelId: MA, active: 0 }],
  // ── approve_* / confirm_* / khác ──────────────────────────────────────────────
  ["approve_construction_daily_log", { logId: MA }],
  ["approve_production_report", { productionReportId: MA, approvedValue: 1 }],
  ["approve_site_expense_claim", { claimId: MA }],
  ["approve_stock_count", { countId: MA }],
  ["approve_team_production", { productionId: MA }],
  ["confirm_installation", { issueItemId: MA, quantity: 1 }],
  ["confirm_delivery", { receiptId: MA, certificateStatus: "ok", deliveryDocumentStatus: "ok" }],
  ["resubmit_request", { requestId: MA, comment: "E2E" }],
  ["merge_material_master", { sourceMaterialId: MA, targetMaterialId: MA, reason: "E2E" }],
  ["import_material_catalog", { rows: [] }],
  ["import_contract_payments", { projectId: MA, rows: [] }],
  ["install_license_foundation", { licenseEnvelope: "" }],
  ["clear_boq_version", { projectId: MA, contractId: MA, boqVersionId: MA, mode: "archive", confirmText: MA, reason: "E2E" }],
];

const ket = [];
for (const [action, payload] of MAU) {
  const r = await call(action, payload, { boQuaLoi: true, nhan: `S-${action}` });
  const la500 = r.status >= 500;
  const loi = String(r._loi || r.message || "");
  const noiRoKhongLamGi = r.ok && /\b0\b/.test(loi);
  const baoSai = r.ok && !noiRoKhongLamGi;
  const dat = (!r.ok && !la500) || noiRoKhongLamGi;
  ket.push({ action, status: r.status, baoSai, dat, loi: loi.slice(0, 110) });
  const nhan = baoSai ? "⛔ BÁO THÀNH CÔNG SAI" : la500 ? "⛔ 500" : noiRoKhongLamGi ? "✔ no-op nói rõ 0" : "✔ chặn sạch";
  console.log(`   ${dat ? "✔" : "⛔"} ${action.padEnd(34)} HTTP ${String(r.status).padEnd(4)} ${nhan.padEnd(22)} ${loi.slice(0, 40)}`);
}

const soDat = ket.filter((k) => k.dat).length;
const soBaoSai = ket.filter((k) => k.baoSai).length;
const so500 = ket.filter((k) => k.status >= 500).length;

console.log("\n═══ KẾT LUẬN ═══");
console.log(`   ĐẠT (4xx sạch hoặc no-op nói rõ 0) : ${soDat}/${ket.length}`);
console.log(`   ⛔ BÁO THÀNH CÔNG SAI              : ${soBaoSai}`);
console.log(`   ⛔ 500 lỗi hệ thống                : ${so500}`);
if (soBaoSai) {
  console.log("\n   ⛔ Action BÁO THÀNH CÔNG mà ⛔ KHÔNG nói rõ đã làm gì:");
  for (const k of ket.filter((x) => x.baoSai)) console.log(`      · ${k.action.padEnd(34)} HTTP ${k.status} «${k.loi}»`);
}

ghi("go-live-phu-set-status", { tong: ket.length, soDat, soBaoSai, so500, ket });
if (soDat < ket.length) process.exitCode = 1;
