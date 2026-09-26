// TASK-023 LÔ 4 — nối phạm vi cho PurchaseManagementUseCase (4 action).
//
// Ngữ nghĩa NGUYÊN VĂN từ scripts/system-route.mjs:
//   create_po       L1283 canAccessProject(mr.projectId,true)  "Tài khoản không có quyền mua hàng tại dự án này."
//                   L1284 canAccessWarehouse(warehouseId,true) "Tài khoản không có quyền thao tác kho nhận PO này."
//   close_po_line   L1305 canAccessProject(line.projectId,true) "Không có quyền tại dự án này."
//   receive_goods   L1319 canAccessProject(po.projectId,true)   "Tài khoản không có quyền giao nhận tại dự án này."
//                   L1321 canAccessWarehouse(po.warehouseId,true) "Tài khoản không có quyền thao tác kho nhận hàng này."
//   confirm_delivery L1388 canAccessProject(receipt.projectId,true) "Tài khoản không có quyền xác nhận tại dự án này."
//                   L1390 canAccessWarehouse(receipt.warehouseId,true) "Tài khoản không có quyền xác nhận tại kho này."
//
// Tên khoá đã kiểm trong PurchaseStoreAdapter: findApprovedRequest.projectId · findPoLine.projectId ·
// findPoForReceiving.projectId+warehouseId · findReceiptInfo.projectId+warehouseId (đều alias camelCase).
import { readFileSync, writeFileSync } from "node:fs";

const S = "java-backend/application/src/main/java/com/vntech/erp/application/service/";
const F = S + "PurchaseManagementUseCase.java";
const CTRL = "java-backend/web/src/main/java/com/vntech/erp/web/controller/SystemController.java";
const BEANS = "java-backend/web/src/main/java/com/vntech/erp/web/config/ApplicationBeansConfig.java";

const P = (expr, write, msg) =>
  `        accessScope.requireProjectAccess(principal.userId(), principal.role(), ${expr}, ${write},\n`
  + `                "${msg}");\n`;
const W = (expr, write, msg) =>
  `        accessScope.requireWarehouseAccess(principal.userId(), principal.role(),\n`
  + `                principal.warehouseScopeKind(), ${expr}, ${write},\n`
  + `                "${msg}");\n`;

const EDITS = [
  { file: F, from: `    private final RbacService rbac;\n`,
    to: `    private final RbacService rbac;\n    private final AccessScopeService accessScope;\n` },
  { file: F, from: 'import com.vntech.erp.application.rbac.RbacService;',
    to: 'import com.vntech.erp.application.rbac.AccessScopeService;\nimport com.vntech.erp.application.rbac.RbacService;' },

  // create_po — phạm vi dự án sau khi tra MR, phạm vi kho sau khi xác nhận kho thuộc dự án
  { file: F, from: `        Map<String, Object> mr = store.findApprovedRequest(requestId)
                .orElseThrow(() -> Api("Chỉ được tạo PO từ MR đã duyệt đủ các cấp."));
        if (store.findWarehouse(warehouseId, sv(mr, "projectId")).isEmpty())
            throw Api("Kho nhận PO phải thuộc đúng dự án.");
`,
    to: `        Map<String, Object> mr = store.findApprovedRequest(requestId)
                .orElseThrow(() -> Api("Chỉ được tạo PO từ MR đã duyệt đủ các cấp."));
        // JS 1283: phạm vi dự án lấy từ CHÍNH phiếu MR (không lấy từ payload).
` + P(`sv(mr, "projectId")`, "true", "Tài khoản không có quyền mua hàng tại dự án này.") + `
        if (store.findWarehouse(warehouseId, sv(mr, "projectId")).isEmpty())
            throw Api("Kho nhận PO phải thuộc đúng dự án.");
        // JS 1284: phạm vi kho nhận PO — kiểm sau khi đã xác nhận kho thuộc dự án.
` + W("warehouseId", "true", "Tài khoản không có quyền thao tác kho nhận PO này.") },

  // close_po_line
  { file: F, from: `        Map<String, Object> line = store.findPoLine(poItemId)
                .orElseThrow(() -> Api("Không tìm thấy dòng PO."));
        double shortage = Math.max(0, numberValue(ci(line, "orderedQty"))
`,
    to: `        Map<String, Object> line = store.findPoLine(poItemId)
                .orElseThrow(() -> Api("Không tìm thấy dòng PO."));
        // JS 1305: phạm vi dự án lấy từ dòng PO.
` + P(`sv(line, "projectId")`, "true", "Không có quyền tại dự án này.") + `
        double shortage = Math.max(0, numberValue(ci(line, "orderedQty"))
` },

  // receive_goods
  { file: F, from: `        if (rawLines.isEmpty()) throw Api("Phiếu nhập cần PO và ít nhất một dòng nhận hàng.");
        List<Map<String, Object>> poItems = store.poItemsForReceiving(poId);
`,
    to: `        if (rawLines.isEmpty()) throw Api("Phiếu nhập cần PO và ít nhất một dòng nhận hàng.");
        // JS 1319/1321: phạm vi dự án rồi phạm vi kho — đều lấy từ CHÍNH phiếu PO.
` + P(`sv(po, "projectId")`, "true", "Tài khoản không có quyền giao nhận tại dự án này.")
  + W(`sv(po, "warehouseId")`, "true", "Tài khoản không có quyền thao tác kho nhận hàng này.") + `
        List<Map<String, Object>> poItems = store.poItemsForReceiving(poId);
` },

  // confirm_delivery
  { file: F, from: `        if (!"pending".equals(sv(receipt, "confirmationStatus")))
            throw Api("Chuyến giao không tồn tại hoặc đã được BCH xác nhận.");
        if (store.goodsReceiptImageCount(receiptId) < 1)
`,
    to: `        if (!"pending".equals(sv(receipt, "confirmationStatus")))
            throw Api("Chuyến giao không tồn tại hoặc đã được BCH xác nhận.");
        // JS 1388/1390: phạm vi dự án rồi phạm vi kho — trước kiểm ảnh, đúng thứ tự JS.
` + P(`sv(receipt, "projectId")`, "true", "Tài khoản không có quyền xác nhận tại dự án này.")
  + W(`sv(receipt, "warehouseId")`, "true", "Tài khoản không có quyền xác nhận tại kho này.") + `
        if (store.goodsReceiptImageCount(receiptId) < 1)
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
  const entry = load(edit.file);
  const name = edit.file.split("/").pop();
  if (entry.text.includes(edit.from)) {
    entry.text = entry.text.replace(edit.from, edit.to);
    applied++; rows.push(`  APD ${name}  ${edit.from.trim().split("\n")[0].slice(0, 56)}`);
  } else if (entry.text.includes(edit.to.trim().slice(0, 60))) {
    skipped++; rows.push(`  BO  ${name}`);
  } else {
    failed++; rows.push(`  X   ${name}  KHONG KHOP: ${edit.from.trim().split("\n")[0].slice(0, 56)}`);
  }
}

// Principal cua Purchase: them warehouseScopeKind
const purchase = load(F);
const BASE_ANCHOR = `        default String roleBase() { return role(); }\n    }`;
if (purchase.text.includes("default String warehouseScopeKind()")) { skipped++; rows.push("  BO  warehouseScopeKind (Purchase)"); }
else if (purchase.text.includes(BASE_ANCHOR)) {
  purchase.text = purchase.text.replace(BASE_ANCHOR,
    `        default String roleBase() { return role(); }\n\n`
    + `        /** Loại phạm vi kho (role_catalog.warehouse_scope_kind: "site" | "central"); rỗng ⇒ coi như "site". */\n`
    + `        default String warehouseScopeKind() { return ""; }\n    }`);
  applied++; rows.push("  APD Purchase.Principal them warehouseScopeKind()");
} else { failed++; rows.push("  X   khong thay Principal cua Purchase"); }

// principalAsCurrent: truyen warehouseScopeKind
const PA_FROM = `p.role(), p.roleBase(), p.role(),\n                null, null, null, false);`;
if (purchase.text.includes("p.warehouseScopeKind()")) { skipped++; rows.push("  BO  principalAsCurrent (Purchase)"); }
else if (purchase.text.includes(PA_FROM)) {
  purchase.text = purchase.text.replace(PA_FROM,
    `p.role(), p.roleBase(), p.role(),\n                p.warehouseScopeKind(), null, null, false);`);
  applied++; rows.push("  APD Purchase.principalAsCurrent truyen warehouseScopeKind");
} else { failed++; rows.push("  X   khong khop principalAsCurrent cua Purchase"); }

// ctor Purchase nhan AccessScopeService
const ctorRe = /public\s+PurchaseManagementUseCase\s*\(([^)]*)\)\s*\{/;
if (/AccessScopeService\s+accessScope\)/.test(purchase.text)) { skipped++; rows.push("  BO  ctor Purchase"); }
else {
  const c = ctorRe.exec(purchase.text);
  if (!c) { failed++; rows.push("  X   khong thay ctor Purchase"); }
  else {
    purchase.text = purchase.text.slice(0, c.index)
      + `public PurchaseManagementUseCase(${c[1].trim()}, AccessScopeService accessScope) {`
      + purchase.text.slice(c.index + c[0].length);
    purchase.text = purchase.text.replace("        this.rbac = rbac;\n    }",
      "        this.rbac = rbac;\n        this.accessScope = accessScope;\n    }");
    applied++; rows.push("  APD ctor Purchase");
  }
}

// controller: asPurchasePrincipal truyen warehouseScopeKind
const ctrl = load(CTRL);
const sig = "asPurchasePrincipal(AuthUseCase.CurrentUser cu) {";
const at = ctrl.text.indexOf(sig);
if (at < 0) { failed++; rows.push("  X   khong thay asPurchasePrincipal"); }
else if (ctrl.text.slice(at, at + 1000).includes("warehouseScopeKind()")) { skipped++; rows.push("  BO  asPurchasePrincipal"); }
else {
  const anchor = `@Override public String roleBase() { return cu.roleBase(); }`;
  const a = ctrl.text.indexOf(anchor, at);
  if (a < 0 || a > at + 1000) { failed++; rows.push("  X   asPurchasePrincipal thieu roleBase()"); }
  else {
    const insertAt = a + anchor.length;
    ctrl.text = ctrl.text.slice(0, insertAt)
      + `\n            @Override public String warehouseScopeKind() { return cu.warehouseScopeKind(); }`
      + ctrl.text.slice(insertAt);
    applied++; rows.push("  APD asPurchasePrincipal truyen warehouseScopeKind");
  }
}

// bean purchaseManagementUseCase
const beans = load(BEANS);
if (/new PurchaseManagementUseCase\([^)]*accessScopeService/.test(beans.text)) { skipped++; rows.push("  BO  bean purchase"); }
else {
  const bsig = /public\s+PurchaseManagementUseCase\s+purchaseManagementUseCase\s*\(([\s\S]*?)\)\s*\{/.exec(beans.text);
  const bctor = /new PurchaseManagementUseCase\(([^)]*)\)/.exec(beans.text);
  if (!bsig || !bctor) { failed++; rows.push("  X   khong khop bean purchase"); }
  else {
    const indent = (bsig[1].match(/\n(\s*)\S/) || [, "                                                             "])[1];
    beans.text = beans.text.slice(0, bsig.index)
      + `public PurchaseManagementUseCase purchaseManagementUseCase(${bsig[1].replace(/\s*$/, "")},\n${indent}AccessScopeService accessScopeService) {`
      + beans.text.slice(bsig.index + bsig[0].length);
    const b2 = /new PurchaseManagementUseCase\(([^)]*)\)/.exec(beans.text);
    beans.text = beans.text.slice(0, b2.index)
      + `new PurchaseManagementUseCase(${b2[1]}, accessScopeService)`
      + beans.text.slice(b2.index + b2[0].length);
    applied++; rows.push("  APD bean purchaseManagementUseCase");
  }
}

if (failed === 0) {
  for (const [path, entry] of cache) {
    writeFileSync(path, entry.crlf ? entry.text.replace(/\n/g, "\r\n") : entry.text, "utf8");
  }
}

console.log("=== TASK-023 LO 4: PurchaseManagementUseCase (4 action) ===");
console.log(rows.join("\n"));
console.log(`\nAp dung: ${applied} · Bo qua: ${skipped} · Loi: ${failed}`);
if (failed) console.log("(Co loi nen KHONG ghi tep — tranh trang thai nua voi)");
process.exit(failed === 0 ? 0 : 1);
