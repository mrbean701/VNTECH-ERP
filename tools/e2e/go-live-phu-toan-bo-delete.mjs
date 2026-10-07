// GO-LIVE 05/10/2026 — PHỦ **TOÀN BỘ** 34 ACTION `delete_*` BẰNG ID BỊA (an toàn tuyệt đối).
//
// ⛔ NGUYÊN TẮC: chỉ gọi với **id KHÔNG TỒN TẠI** ⇒ ⛔ KHÔNG thể xoá dữ liệu thật.
//   Vòng 14 mới lấy **mẫu 8/35** và mẫu đó **đã ra 1 lỗi HIGH (BUG-20261010)** ⇒ phủ nốt phần còn lại.
//
// ⛔⛔ MỘT ACTION BỊ **LOẠI TRỪ VÌ NGUY HIỂM THẬT** (⛔ không phải bỏ sót):
//   `delete_unused_materials` — UI gọi với `{confirmText}` **KHÔNG có id** (`page.tsx`)
//   ⇒ nó xoá **MỌI vật tư không dùng** trên TOÀN HỆ THỐNG. Gọi thử = **XOÁ DỮ LIỆU THẬT**.
//   ⇒ ⛔ **KHÔNG CHẠY** (§12: ⛔ không đánh cược dữ liệu thật). Đã ghi nhận là **lỗ hổng phủ**.
//
// ⛔ KHOÁ PAYLOAD: đọc từ chính mã UI, ⛔ KHÔNG đoán.
import { login, call, ghi } from "./client.mjs";

const MK_ADMIN = "Admin123456@";
const MA = "E2E_KHONG_TON_TAI_c4d8";

console.log("=".repeat(84));
console.log("GO-LIVE — PHỦ 34 ACTION delete_* BẰNG ID BỊA (⛔ không thể xoá dữ liệu thật)");
console.log("=".repeat(84));
console.log("⛔ Loại trừ: delete_unused_materials (xoá MỌI vật tư không dùng — ⛔ gọi thử là xoá dữ liệu thật)\n");

await login("admin", MK_ADMIN);

/** [action, payload bịa] — khoá ĐỌC TỪ mã UI. */
const MAU = [
  ["delete_accounting_voucher", { voucherId: MA }],
  ["delete_advance_request", { requestId: MA }],
  ["delete_approval_stage", { stageId: MA }],
  ["delete_benefit_record", { benefitId: MA }],
  ["delete_boq_item", { sourceItemId: MA, reason: "E2E" }],
  ["delete_business_role_group", { groupId: MA }],
  ["delete_business_scope", { scopeId: MA }],
  ["delete_capital_recovery", { recoveryId: MA }],
  ["delete_cashbook_entry", { entryId: MA }],
  ["delete_construction_daily_log", { logId: MA }],
  ["delete_contract_payment", { paymentId: MA }],
  ["delete_correspondence", { corrId: MA }],
  ["delete_department_permission", { organizationUnitId: MA, moduleKey: MA }],
  ["delete_form_field_config", { id: MA, formKey: MA, fieldKey: MA }],
  ["delete_labor_contract", { contractId: MA }],
  ["delete_legal_document", { docId: MA }],
  ["delete_material", { materialId: MA, confirmText: `XOA ${MA}` }],
  ["delete_material_norm", { normId: MA }],
  ["delete_material_subcategory", { subcategoryId: MA }],
  ["delete_menu_group", { groupId: MA }],
  ["delete_notification_config", { configId: MA }],
  ["delete_partner", { partnerId: MA }],
  ["delete_payment_plan", { planId: MA }],
  ["delete_project", { projectId: MA, confirmCode: MA }],
  ["delete_project_contract", { contractId: MA, confirmText: `XOA ${MA}` }],
  ["delete_request", { requestId: MA, reason: "E2E" }],
  ["delete_seal", { sealId: MA }],
  ["delete_selected_materials", { materialIds: [MA], confirmText: `XOA ${MA}` }],
  ["delete_site_expense_claim", { claimId: MA }],
  ["delete_supplier", { supplierId: MA }],
  ["delete_system_level", { levelId: MA }],
  ["delete_user", { userId: MA }],
  ["delete_user_module_override", { userId: MA, moduleKey: MA }],
  ["delete_workflow", { workflowId: MA }],
];

const ket = [];
for (const [action, payload] of MAU) {
  const r = await call(action, payload, { boQuaLoi: true, nhan: `D-${action}` });
  const la500 = r.status >= 500;
  const loi = String(r._loi || r.message || "");
  // ⛔ Phân loại: 4xx sạch = TỐT · 200 nói rõ «0 …» = CHẤP NHẬN (no-op minh bạch) · 200 khác = LỖI · 5xx = LỖI
  const noiRoKhongLamGi = r.ok && /\b0\b/.test(loi);
  const baoSai = r.ok && !noiRoKhongLamGi;
  const dat = (!r.ok && !la500) || noiRoKhongLamGi;
  ket.push({ action, status: r.status, baoSai, dat, loi: loi.slice(0, 110) });
  const nhan = baoSai ? "⛔ BÁO THÀNH CÔNG SAI" : la500 ? "⛔ 500" : noiRoKhongLamGi ? "✔ no-op nói rõ 0" : "✔ chặn sạch";
  console.log(`   ${dat ? "✔" : "⛔"} ${action.padEnd(32)} HTTP ${String(r.status).padEnd(4)} ${nhan.padEnd(22)} ${loi.slice(0, 44)}`);
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
  for (const k of ket.filter((x) => x.baoSai)) console.log(`      · ${k.action.padEnd(32)} «${k.loi}»`);
}
console.log("\n   ⛔ LỖ HỔNG PHỦ ĐÃ BIẾT: `delete_unused_materials` (xoá mọi vật tư không dùng) — ⛔ không kiểm được bằng id bịa.");

ghi("go-live-phu-toan-bo-delete", { tong: ket.length, soDat, soBaoSai, so500, ket });
if (soDat < ket.length) process.exitCode = 1;
