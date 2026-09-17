// TASK-023 LÔ 7 — nối phạm vi DỰ ÁN cho 7 action của FinanceManagementUseCase.
//
// Ngữ nghĩa NGUYÊN VĂN từ scripts/system-route.mjs (trích bằng tools/show-js-scope-checks.mjs):
//   save_payment_plan          L1947 canAccessProject(projectId,true)      "Không có quyền cập nhật kế hoạch tại dự án này."
//   set_payment_plan_status    L1952 canAccessProject(old.project_id,true) "Không có quyền tại dự án này."
//   delete_payment_plan        L1955 canAccessProject(old.project_id,true) "Không có quyền tại dự án này."
//   save_advance_request       L1959 canAccessProject(projectId,true)      "Không có quyền tại dự án này."
//   save_site_expense_claim    L1971 canAccessProject(projectId,true)      "Không có quyền tại dự án này."
//   approve_site_expense_claim L1976 canAccessProject(old.project_id,true) "Không có quyền tại dự án này."
//   delete_site_expense_claim  L1979 canAccessProject(old.project_id,true) "Không có quyền tại dự án này."
//
// Tên khoá đã kiểm trong FinanceStoreAdapter: findPaymentPlan/findAdvanceRequest/findSiteExpenseClaim
// đều dùng `SELECT *` ⇒ khoá snake_case (project_id).
import { readFileSync, writeFileSync } from "node:fs";

const S = "java-backend/application/src/main/java/com/vntech/erp/application/service/";
const F = S + "FinanceManagementUseCase.java";
const BEANS = "java-backend/web/src/main/java/com/vntech/erp/web/config/ApplicationBeansConfig.java";

const P = (expr, msg) =>
  `        accessScope.requireProjectAccess(principal.userId(), principal.role(), ${expr}, true,\n`
  + `                "${msg}");\n`;

const EDITS = [
  // 1) save_payment_plan
  { from: `        String projectId = trim(payload.get("projectId"));
        String planId = trim(payload.get("planId"));
        String contractId = nvl(payload.get("contractId"));
`,
    to: `        String projectId = trim(payload.get("projectId"));
        // JS 1947.
` + P("projectId", "Không có quyền cập nhật kế hoạch tại dự án này.") + `        String planId = trim(payload.get("planId"));
        String contractId = nvl(payload.get("contractId"));
` },

  // 2) set_payment_plan_status
  { from: `        Map<String, Object> old = store.findPaymentPlan(planId)
                .orElseThrow(() -> Api("Không tìm thấy kế hoạch thanh toán."));
        if (paidAmount > num(old.get("planned_amount")) + 1e-9)
`,
    to: `        Map<String, Object> old = store.findPaymentPlan(planId)
                .orElseThrow(() -> Api("Không tìm thấy kế hoạch thanh toán."));
        // JS 1952.
` + P(`sv(old, "project_id")`, "Không có quyền tại dự án này.") + `        if (paidAmount > num(old.get("planned_amount")) + 1e-9)
` },

  // 3) delete_payment_plan
  { from: `        Map<String, Object> old = store.findPaymentPlan(planId)
                .orElseThrow(() -> Api("Không tìm thấy kế hoạch thanh toán."));
        if (num(old.get("paid_amount")) > 0)
`,
    to: `        Map<String, Object> old = store.findPaymentPlan(planId)
                .orElseThrow(() -> Api("Không tìm thấy kế hoạch thanh toán."));
        // JS 1955.
` + P(`sv(old, "project_id")`, "Không có quyền tại dự án này.") + `        if (num(old.get("paid_amount")) > 0)
` },

  // 4) save_advance_request
  { from: `        String requestId = trim(payload.get("requestId"));
        String projectId = nvl(payload.get("projectId"));
        String requesterId = trim(payload.get("requesterId"));
`,
    to: `        String requestId = trim(payload.get("requestId"));
        String projectId = nvl(payload.get("projectId"));
        // JS 1959. projectId rỗng ⇒ canAccessProject trả false ⇒ 403, đúng như JS.
` + P("projectId", "Không có quyền tại dự án này.") + `        String requesterId = trim(payload.get("requesterId"));
` },

  // 5) save_site_expense_claim
  { from: `        String claimId = trim(payload.get("claimId"));
        String projectId = trim(payload.get("projectId"));
        String costType = trim(payload.get("costType"));
`,
    to: `        String claimId = trim(payload.get("claimId"));
        String projectId = trim(payload.get("projectId"));
        // JS 1971.
` + P("projectId", "Không có quyền tại dự án này.") + `        String costType = trim(payload.get("costType"));
` },

  // 6) approve_site_expense_claim
  { from: `        if ("approved".equals(sv(old, "status"))) throw Api("Chi phí đã duyệt.");
`,
    to: `        // JS 1976.
` + P(`sv(old, "project_id")`, "Không có quyền tại dự án này.") + `        if ("approved".equals(sv(old, "status"))) throw Api("Chi phí đã duyệt.");
` },

  // 7) delete_site_expense_claim
  { from: `        if ("approved".equals(sv(old, "status")) && !"admin".equals(principal.role()))
            throw Api("Chi phí đã duyệt; chỉ Quản trị được xóa.");
`,
    to: `        // JS 1979.
` + P(`sv(old, "project_id")`, "Không có quyền tại dự án này.") + `        if ("approved".equals(sv(old, "status")) && !"admin".equals(principal.role()))
            throw Api("Chi phí đã duyệt; chỉ Quản trị được xóa.");
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
    const n = entry.text.split(edit.from).length - 1;
    if (n !== 1) { failed++; rows.push(`  X   NEO KHONG DUY NHAT (${n}): ${edit.from.trim().split("\n")[0].slice(0, 52)}`); continue; }
    entry.text = entry.text.replace(edit.from, edit.to);
    applied++; rows.push(`  APD ${edit.from.trim().split("\n")[0].slice(0, 58)}`);
  } else if (entry.text.includes(edit.to.split("\n")[0]) && edit.to.split("\n")[0].length > 20) {
    skipped++; rows.push(`  BO  ${edit.from.trim().split("\n")[0].slice(0, 58)}`);
  } else {
    failed++; rows.push(`  X   KHONG KHOP: ${edit.from.trim().split("\n")[0].slice(0, 58)}`);
  }
}

// import + trường + tham số constructor
const fin = load(F);
if (!fin.text.includes("import com.vntech.erp.application.rbac.AccessScopeService;")) {
  const anchor = "import com.vntech.erp.application.rbac.RbacService;";
  if (fin.text.includes(anchor)) {
    fin.text = fin.text.replace(anchor, "import com.vntech.erp.application.rbac.AccessScopeService;\n" + anchor);
    applied++; rows.push("  APD import AccessScopeService");
  } else { failed++; rows.push("  X   khong thay import RbacService"); }
} else { skipped++; rows.push("  BO  import AccessScopeService"); }

if (!fin.text.includes("private final AccessScopeService accessScope;")) {
  const anchor = "    private final RbacService rbac;\n";
  if (fin.text.includes(anchor)) {
    fin.text = fin.text.replace(anchor, anchor + "    private final AccessScopeService accessScope;\n");
    applied++; rows.push("  APD truong accessScope");
  } else { failed++; rows.push("  X   khong thay truong rbac"); }
} else { skipped++; rows.push("  BO  truong accessScope"); }

const ctorRe = /public\s+FinanceManagementUseCase\s*\(([^)]*)\)\s*\{/;
if (/AccessScopeService\s+accessScope\)/.test(fin.text)) { skipped++; rows.push("  BO  ctor Finance"); }
else {
  const c = ctorRe.exec(fin.text);
  if (!c) { failed++; rows.push("  X   khong thay ctor Finance"); }
  else {
    fin.text = fin.text.slice(0, c.index)
      + `public FinanceManagementUseCase(${c[1].trim()}, AccessScopeService accessScope) {`
      + fin.text.slice(c.index + c[0].length);
    fin.text = fin.text.replace("        this.rbac = rbac;\n    }",
      "        this.rbac = rbac;\n        this.accessScope = accessScope;\n    }");
    applied++; rows.push("  APD ctor Finance");
  }
}

// bean
const beans = load(BEANS);
if (/new FinanceManagementUseCase\([^)]*accessScopeService/.test(beans.text)) { skipped++; rows.push("  BO  bean finance"); }
else {
  const bsig = /public\s+FinanceManagementUseCase\s+financeManagementUseCase\s*\(([\s\S]*?)\)\s*\{/.exec(beans.text);
  const bctor = /new FinanceManagementUseCase\(([^)]*)\)/.exec(beans.text);
  if (!bsig || !bctor) { failed++; rows.push("  X   khong khop bean finance"); }
  else {
    const indent = (bsig[1].match(/\n(\s*)\S/) || [, "                                                             "])[1];
    beans.text = beans.text.slice(0, bsig.index)
      + `public FinanceManagementUseCase financeManagementUseCase(${bsig[1].replace(/\s*$/, "")},\n${indent}AccessScopeService accessScopeService) {`
      + beans.text.slice(bsig.index + bsig[0].length);
    const b2 = /new FinanceManagementUseCase\(([^)]*)\)/.exec(beans.text);
    beans.text = beans.text.slice(0, b2.index)
      + `new FinanceManagementUseCase(${b2[1]}, accessScopeService)`
      + beans.text.slice(b2.index + b2[0].length);
    applied++; rows.push("  APD bean financeManagementUseCase");
  }
}

if (failed === 0) {
  for (const [path, entry] of cache) {
    writeFileSync(path, entry.crlf ? entry.text.replace(/\n/g, "\r\n") : entry.text, "utf8");
  }
}

console.log("=== TASK-023 LO 7: FinanceManagementUseCase (7 action) ===");
console.log(rows.join("\n"));
console.log(`\nAp dung: ${applied} · Bo qua: ${skipped} · Loi: ${failed}`);
if (failed) console.log("(Co loi nen KHONG ghi tep)");
process.exit(failed === 0 ? 0 : 1);
