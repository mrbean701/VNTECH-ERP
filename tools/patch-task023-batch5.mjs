// TASK-023 LÔ 5 — nối phạm vi DỰ ÁN cho 15 action của ProductionManagementUseCase.
//
// Ngữ nghĩa NGUYÊN VĂN từ scripts/system-route.mjs (trích bằng tools/show-js-scope-checks.mjs).
// Tất cả 15 action chỉ kiểm PHẠM VI DỰ ÁN (không có nhánh kho) ⇒ không cần warehouseScopeKind.
//
// Tên khoá đã kiểm trong ProductionStoreAdapter: findProductionReport/findCapitalRecovery/
// findContractPayment/findTeamProduction/findDailyLog dùng `SELECT *` ⇒ khoá snake_case (project_id);
// findSubcontract thì alias camelCase (projectId).
import { readFileSync, writeFileSync } from "node:fs";

const S = "java-backend/application/src/main/java/com/vntech/erp/application/service/";
const F = S + "ProductionManagementUseCase.java";
const BEANS = "java-backend/web/src/main/java/com/vntech/erp/web/config/ApplicationBeansConfig.java";

const P = (expr, msg) =>
  `        accessScope.requireProjectAccess(principal.userId(), principal.role(), ${expr}, true,\n`
  + `                "${msg}");\n`;

const EDITS = [
  { from: 'import com.vntech.erp.application.rbac.RbacService;',
    to: 'import com.vntech.erp.application.rbac.AccessScopeService;\nimport com.vntech.erp.application.rbac.RbacService;' },
  { from: '    private final RbacService rbac;\n',
    to: '    private final RbacService rbac;\n    private final AccessScopeService accessScope;\n' },

  // 1) save_team_subcontract
  { from: `        rbac.requireRole(principalAsCurrent(principal), List.of("admin", "commander", "project"));
        String projectId = trim(payload.get("projectId"));
        String teamId = trim(payload.get("teamId"));
`,
    to: `        rbac.requireRole(principalAsCurrent(principal), List.of("admin", "commander", "project"));
        String projectId = trim(payload.get("projectId"));
        // JS 1238.
` + P("projectId", "Không có quyền tại dự án này.") + `        String teamId = trim(payload.get("teamId"));
` },

  // 2) save_team_production — JS gộp kiểm tồn tại + phạm vi vào MỘT thông điệp
  { from: `        if (approvedValue > submittedValue + 1e-9)
            throw Api("Sản lượng duyệt không được vượt giá trị trình.");
        Map<String, Object> sc = store.findSubcontract(subcontractId).orElse(null);
        if (sc == null || !sv(sc, "projectId").equals(projectId))
            throw Api("Hợp đồng giao khoán không thuộc phạm vi dự án.");
`,
    to: `        if (approvedValue > submittedValue + 1e-9)
            throw Api("Sản lượng duyệt không được vượt giá trị trình.");
        Map<String, Object> sc = store.findSubcontract(subcontractId).orElse(null);
        // JS 1241: gộp kiểm tồn tại + phạm vi vào cùng một thông điệp như JS.
        if (sc == null || !sv(sc, "projectId").equals(projectId)
                || !accessScope.canAccessProject(principal.userId(), principal.role(), projectId, true))
            throw Api("Hợp đồng giao khoán không thuộc phạm vi dự án.");
` },

  // 3) approve_team_production
  { from: `        if (rec == null || !"submitted".equals(sv(rec, "status")))
            throw Api("Hồ sơ sản lượng không còn ở trạng thái chờ duyệt.");
        Map<String, Object> sc = store.findSubcontract(sv(rec, "subcontract_id")).orElse(Map.of());
`,
    to: `        if (rec == null || !"submitted".equals(sv(rec, "status")))
            throw Api("Hồ sơ sản lượng không còn ở trạng thái chờ duyệt.");
        // JS 1244: phạm vi dự án lấy từ CHÍNH hồ sơ sản lượng.
` + P(`sv(rec, "project_id")`, "Không có quyền tại dự án này.") + `
        Map<String, Object> sc = store.findSubcontract(sv(rec, "subcontract_id")).orElse(Map.of());
` },

  // 4) save_team_payment — cùng dạng gộp như save_team_production
  { from: `        Map<String, Object> sc = store.findSubcontract(subcontractId).orElse(null);
        if (sc == null || !sv(sc, "projectId").equals(projectId))
            throw Api("Hợp đồng giao khoán không thuộc phạm vi dự án.");
        if (!paymentDate.matches("\\\\d{4}-\\\\d{2}-\\\\d{2}")) throw Api("Ngày thanh toán không hợp lệ.");
`,
    to: `        Map<String, Object> sc = store.findSubcontract(subcontractId).orElse(null);
        // JS 1247: gộp kiểm tồn tại + phạm vi vào cùng một thông điệp như JS.
        if (sc == null || !sv(sc, "projectId").equals(projectId)
                || !accessScope.canAccessProject(principal.userId(), principal.role(), projectId, true))
            throw Api("Hợp đồng giao khoán không thuộc phạm vi dự án.");
        if (!paymentDate.matches("\\\\d{4}-\\\\d{2}-\\\\d{2}")) throw Api("Ngày thanh toán không hợp lệ.");
` },

  // 5) settle_team_subcontract
  { from: `        Map<String, Object> sc = store.findSubcontract(subcontractId)
                .orElseThrow(() -> Api("Không có quyền quyết toán hợp đồng này."));
        if (store.teamHeldStockLines(sv(sc, "teamId")) > 0)
`,
    to: `        Map<String, Object> sc = store.findSubcontract(subcontractId)
                .orElseThrow(() -> Api("Không có quyền quyết toán hợp đồng này."));
        // JS 1250.
` + P(`sv(sc, "projectId")`, "Không có quyền quyết toán hợp đồng này.") + `        if (store.teamHeldStockLines(sv(sc, "teamId")) > 0)
` },

  // 6) save_production_report
  { from: `        String reportId = trim(payload.get("productionReportId"));
        String projectId = trim(payload.get("projectId"));
        String reportPeriod = trim(payload.get("reportPeriod"));
`,
    to: `        String reportId = trim(payload.get("productionReportId"));
        String projectId = trim(payload.get("projectId"));
        // JS 1190.
` + P("projectId", "Không có quyền cập nhật sản lượng tại dự án này.") + `        String reportPeriod = trim(payload.get("reportPeriod"));
` },

  // 7) approve_production_report
  { from: `        Map<String, Object> old = store.findProductionReport(reportId)
                .orElseThrow(() -> Api("Không tìm thấy báo cáo sản lượng."));
`,
    to: `        Map<String, Object> old = store.findProductionReport(reportId)
                .orElseThrow(() -> Api("Không tìm thấy báo cáo sản lượng."));
        // JS 1195: phạm vi dự án của CHÍNH báo cáo.
` + P(`sv(old, "project_id")`, "Không có quyền tại dự án này.") },

  // 8) save_capital_recovery
  { from: `        String recoveryId = trim(payload.get("recoveryId"));
        String projectId = trim(payload.get("projectId"));
        String periodKey = trim(payload.get("periodKey"));
`,
    to: `        String recoveryId = trim(payload.get("recoveryId"));
        String projectId = trim(payload.get("projectId"));
        // JS 1214.
` + P("projectId", "Không có quyền cập nhật thu hồi vốn tại dự án này.") + `        String periodKey = trim(payload.get("periodKey"));
` },

  // 9) delete_capital_recovery
  { from: `        Map<String, Object> old = store.findCapitalRecovery(recoveryId)
                .orElseThrow(() -> Api("Không tìm thấy hồ sơ thu hồi vốn."));
`,
    to: `        Map<String, Object> old = store.findCapitalRecovery(recoveryId)
                .orElseThrow(() -> Api("Không tìm thấy hồ sơ thu hồi vốn."));
        // JS 1222: phạm vi dự án của CHÍNH hồ sơ.
` + P(`sv(old, "project_id")`, "Không có quyền tại dự án này.") },

  // 10) save_contract_payment
  { from: `        String paymentId = trim(payload.get("paymentId"));
        String projectId = trim(payload.get("projectId"));
        String recoveryRecordId = nvl(payload.get("recoveryRecordId"));
`,
    to: `        String paymentId = trim(payload.get("paymentId"));
        String projectId = trim(payload.get("projectId"));
        // JS 1226.
` + P("projectId", "Không có quyền cập nhật thanh toán tại dự án này.") + `        String recoveryRecordId = nvl(payload.get("recoveryRecordId"));
` },

  // 11) delete_contract_payment — Java đang BỎ kết quả tra bản ghi; phải giữ lại để lấy project_id
  { from: `        String paymentId = trim(payload.get("paymentId"));
        store.findContractPayment(paymentId).orElseThrow(() -> Api("Không tìm thấy dòng thanh toán."));
        store.deleteContractPayment(paymentId);
`,
    to: `        String paymentId = trim(payload.get("paymentId"));
        // JS 1235: tra bản ghi CŨ rồi kiểm phạm vi dự án của chính bản ghi đó.
        Map<String, Object> oldPayment = store.findContractPayment(paymentId)
                .orElseThrow(() -> Api("Không tìm thấy dòng thanh toán."));
` + P(`sv(oldPayment, "project_id")`, "Không có quyền tại dự án này.") + `        store.deleteContractPayment(paymentId);
` },

  // 12) import_contract_payments
  { from: `        if (projectId.isEmpty() || rows.isEmpty()) throw Api("File thanh toán không có dữ liệu.");
`,
    to: `        if (projectId.isEmpty() || rows.isEmpty()) throw Api("File thanh toán không có dữ liệu.");
        // JS 1232.
` + P("projectId", "Không có quyền cập nhật thanh toán tại dự án này.") },

  // 13) save_construction_daily_log
  { from: `        String logId = trim(payload.get("logId"));
        String projectId = trim(payload.get("projectId"));
        String workDate = trim(payload.get("workDate"));
`,
    to: `        String logId = trim(payload.get("logId"));
        String projectId = trim(payload.get("projectId"));
        // JS 1200.
` + P("projectId", "Không có quyền cập nhật nhật ký thi công tại dự án này.") + `        String workDate = trim(payload.get("workDate"));
` },

  // 14) approve_construction_daily_log — neo phải gồm dòng SAU vì approve/delete dùng chung 2 dòng đầu
  { from: `        if ("approved".equals(sv(old, "status"))) throw Api("Nhật ký đã được duyệt.");
`,
    to: `        // JS 1205: phạm vi dự án của CHÍNH nhật ký.
` + P(`sv(old, "project_id")`, "Không có quyền tại dự án này.") + `        if ("approved".equals(sv(old, "status"))) throw Api("Nhật ký đã được duyệt.");
` },

  // 15) delete_construction_daily_log
  { from: `        if ("approved".equals(sv(old, "status")) && !"admin".equals(principal.role()))
`,
    to: `        // JS 1208: phạm vi dự án của CHÍNH nhật ký.
` + P(`sv(old, "project_id")`, "Không có quyền tại dự án này.") + `        if ("approved".equals(sv(old, "status")) && !"admin".equals(principal.role()))
` },
];

const cache = new Map();
function load(path) {
  if (!cache.has(path)) {
    const raw = readFileSync(path, "utf8");
    cache.set(path, { crlf: raw.includes("\r\n"), text: raw.replace(/\r\n/g, "\n") });
  }
  return cache.get(path);
}

let failed = 0, applied = 0, skipped = 0;
const rows = [];
for (const edit of EDITS) {
  const entry = load(F);
  if (entry.text.includes(edit.from)) {
    entry.text = entry.text.replace(edit.from, edit.to);
    applied++; rows.push(`  APD ${edit.from.trim().split("\n")[0].slice(0, 60)}`);
  } else if (entry.text.includes(edit.to.split("\n")[0]) && edit.to.split("\n")[0].length > 20) {
    skipped++; rows.push(`  BO  ${edit.from.trim().split("\n")[0].slice(0, 60)}`);
  } else {
    failed++; rows.push(`  X   KHONG KHOP: ${edit.from.trim().split("\n")[0].slice(0, 60)}`);
  }
}

// ctor Production nhan AccessScopeService
const prod = load(F);
const ctorRe = /public\s+ProductionManagementUseCase\s*\(([^)]*)\)\s*\{/;
if (/AccessScopeService\s+accessScope\)/.test(prod.text)) { skipped++; rows.push("  BO  ctor Production"); }
else {
  const c = ctorRe.exec(prod.text);
  if (!c) { failed++; rows.push("  X   khong thay ctor Production"); }
  else {
    prod.text = prod.text.slice(0, c.index)
      + `public ProductionManagementUseCase(${c[1].trim()}, AccessScopeService accessScope) {`
      + prod.text.slice(c.index + c[0].length);
    prod.text = prod.text.replace("        this.rbac = rbac;\n    }",
      "        this.rbac = rbac;\n        this.accessScope = accessScope;\n    }");
    applied++; rows.push("  APD ctor Production");
  }
}

// bean productionManagementUseCase
const beans = load(BEANS);
if (/new ProductionManagementUseCase\([^)]*accessScopeService/.test(beans.text)) { skipped++; rows.push("  BO  bean production"); }
else {
  const bsig = /public\s+ProductionManagementUseCase\s+productionManagementUseCase\s*\(([\s\S]*?)\)\s*\{/.exec(beans.text);
  const bctor = /new ProductionManagementUseCase\(([^)]*)\)/.exec(beans.text);
  if (!bsig || !bctor) { failed++; rows.push("  X   khong khop bean production"); }
  else {
    const indent = (bsig[1].match(/\n(\s*)\S/) || [, "                                                                   "])[1];
    beans.text = beans.text.slice(0, bsig.index)
      + `public ProductionManagementUseCase productionManagementUseCase(${bsig[1].replace(/\s*$/, "")},\n${indent}AccessScopeService accessScopeService) {`
      + beans.text.slice(bsig.index + bsig[0].length);
    const b2 = /new ProductionManagementUseCase\(([^)]*)\)/.exec(beans.text);
    beans.text = beans.text.slice(0, b2.index)
      + `new ProductionManagementUseCase(${b2[1]}, accessScopeService)`
      + beans.text.slice(b2.index + b2[0].length);
    applied++; rows.push("  APD bean productionManagementUseCase");
  }
}

if (failed === 0) {
  for (const [path, entry] of cache) {
    writeFileSync(path, entry.crlf ? entry.text.replace(/\n/g, "\r\n") : entry.text, "utf8");
  }
}

console.log("=== TASK-023 LO 5: ProductionManagementUseCase (15 action) ===");
console.log(rows.join("\n"));
console.log(`\nAp dung: ${applied} · Bo qua: ${skipped} · Loi: ${failed}`);
if (failed) console.log("(Co loi nen KHONG ghi tep — tranh trang thai nua voi)");
process.exit(failed === 0 ? 0 : 1);
