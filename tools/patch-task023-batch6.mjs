// TASK-023 LÔ 6 — nối phạm vi DỰ ÁN cho 11 action của BoqManagementUseCase.
//
// Ngữ nghĩa NGUYÊN VĂN từ scripts/system-route.mjs. Tất cả chỉ kiểm phạm vi DỰ ÁN.
// Lưu ý: `compare_boq_materials` là mức ĐỌC (write=false) — dùng nhầm mức write sẽ chặn oan người chỉ xem.
// `bulk_boq_item_action` kiểm phạm vi TỪNG DÒNG trong vòng lặp, chặn cả lô nếu có dòng ngoài phạm vi.
import { readFileSync, writeFileSync } from "node:fs";

const S = "java-backend/application/src/main/java/com/vntech/erp/application/service/";
const F = S + "BoqManagementUseCase.java";
const BEANS = "java-backend/web/src/main/java/com/vntech/erp/web/config/ApplicationBeansConfig.java";

const P = (expr, write, msg) =>
  `        accessScope.requireProjectAccess(principal.userId(), principal.role(), ${expr}, ${write},\n`
  + `                "${msg}");\n`;

const EDITS = [
  // BoqManagementUseCase CHƯA từng có RbacService ⇒ phải THÊM import + trường + tham số constructor.
  { from: 'import com.vntech.erp.application.port.out.IdGenerator;',
    to: 'import com.vntech.erp.application.port.out.IdGenerator;\nimport com.vntech.erp.application.rbac.AccessScopeService;' },
  { from: `    private final BoqStore store;
    private final IdGenerator idGenerator;

    public BoqManagementUseCase(BoqStore store, IdGenerator idGenerator) {
        this.store = store;
        this.idGenerator = idGenerator;
    }`,
    to: `    private final BoqStore store;
    private final IdGenerator idGenerator;
    private final AccessScopeService accessScope;

    public BoqManagementUseCase(BoqStore store, IdGenerator idGenerator, AccessScopeService accessScope) {
        this.store = store;
        this.idGenerator = idGenerator;
        this.accessScope = accessScope;
    }` },

  // 1) save_boq_version
  { from: `        String projectId = trim(payload.get("projectId"));
        Map<String, Object> contract = resolveContract(projectId, trim(payload.get("contractId")));
        Boolean makeActive = payload.get("makeActive") != Boolean.FALSE;
`,
    to: `        String projectId = trim(payload.get("projectId"));
        // JS 816.
` + P("projectId", "true", "Không có quyền BOQ dự án này.") + `
        Map<String, Object> contract = resolveContract(projectId, trim(payload.get("contractId")));
        Boolean makeActive = payload.get("makeActive") != Boolean.FALSE;
` },

  // 2) save_boq_item
  { from: `        String projectId = trim(payload.get("projectId"));
        Map<String, Object> contract = resolveContract(projectId, trim(payload.get("contractId")));
        String contractId = sv(contract, "id");
`,
    to: `        String projectId = trim(payload.get("projectId"));
        // JS 2712.
` + P("projectId", "true", "Không có quyền cập nhật BOQ dự án này.") + `
        Map<String, Object> contract = resolveContract(projectId, trim(payload.get("contractId")));
        String contractId = sv(contract, "id");
` },

  // 3) set_boq_item_status — phạm vi của CHÍNH dòng BOQ
  { from: `        Map<String, Object> row = findSourceItemAnywhere(sourceItemId)
                .orElseThrow(() -> Api("Không tìm thấy dòng BOQ."));
        boolean active = payload.get("active") == Boolean.TRUE || "1".equals(trim(payload.get("active")));
`,
    to: `        Map<String, Object> row = findSourceItemAnywhere(sourceItemId)
                .orElseThrow(() -> Api("Không tìm thấy dòng BOQ."));
        // JS 2734.
` + P(`sv(row, "project_id")`, "true", "Không có quyền tại dự án này.") + `        boolean active = payload.get("active") == Boolean.TRUE || "1".equals(trim(payload.get("active")));
` },

  // 4) replace_boq_items
  { from: `        if (rawRows.size() > 5000) throw Api("Mỗi lần nhập tối đa 5.000 dòng BOQ.");
`,
    to: `        if (rawRows.size() > 5000) throw Api("Mỗi lần nhập tối đa 5.000 dòng BOQ.");
        // JS 2799.
` + P("projectId", "true", "Không có quyền cập nhật BOQ dự án này.") },

  // 5) update_boq_contract_prices
  { from: `        String projectId = trim(payload.get("projectId"));
        Map<String, Object> contract = resolveContract(projectId, trim(payload.get("contractId")));
        Optional<Map<String, Object>> v = resolveBoqVersion(projectId, sv(contract, "id"), trim(payload.get("boqVersionId")));
`,
    to: `        String projectId = trim(payload.get("projectId"));
        // JS 2827.
` + P("projectId", "true", "Không có quyền cập nhật BOQ dự án này.") + `
        Map<String, Object> contract = resolveContract(projectId, trim(payload.get("contractId")));
        Optional<Map<String, Object>> v = resolveBoqVersion(projectId, sv(contract, "id"), trim(payload.get("boqVersionId")));
` },

  // 6) bulk_boq_item_action — kiểm phạm vi TỪNG DÒNG, chặn cả lô
  { from: `            Map<String, Object> row = store.findBoqSourceItemById(id).orElse(null);
            if (row == null) continue;
`,
    to: `            Map<String, Object> row = store.findBoqSourceItemById(id).orElse(null);
            if (row == null) continue;
            // JS 2737: kiểm phạm vi TỪNG dòng; có một dòng ngoài phạm vi là chặn CẢ LÔ.
            if (!accessScope.canAccessProject(principal.userId(), principal.role(), sv(row, "project_id"), true)) {
                throw Api("Danh sách có dòng BOQ ngoài phạm vi được cấp quyền.");
            }
` },

  // 7) delete_boq_item
  { from: `        Map<String, Object> row = store.findBoqSourceItemById(sourceItemId)
                .orElseThrow(() -> Api("Không tìm thấy dòng BOQ."));
        String pbiId = sv(row, "project_boq_item_id");
`,
    to: `        Map<String, Object> row = store.findBoqSourceItemById(sourceItemId)
                .orElseThrow(() -> Api("Không tìm thấy dòng BOQ."));
        // JS 2740.
` + P(`sv(row, "project_id")`, "true", "Không có quyền tại dự án này.") + `        String pbiId = sv(row, "project_boq_item_id");
` },

  // 8) clear_boq_version
  { from: `        String projectId = trim(payload.get("projectId"));
        Map<String, Object> contract = resolveContract(projectId, trim(payload.get("contractId")));
        Map<String, Object> version = resolveBoqVersion(projectId, sv(contract, "id"), trim(payload.get("boqVersionId")))
`,
    to: `        String projectId = trim(payload.get("projectId"));
        // JS 2744.
` + P("projectId", "true", "Không có quyền tại dự án này.") + `
        Map<String, Object> contract = resolveContract(projectId, trim(payload.get("contractId")));
        Map<String, Object> version = resolveBoqVersion(projectId, sv(contract, "id"), trim(payload.get("boqVersionId")))
` },

  // 9) request_material_master_from_boq
  { from: `        if (source == null || !sv(source, "project_id").equals(projectId) || !isOne(ci(source, "active")))
            throw Api("Không tìm thấy dòng BOQ nguồn.");
`,
    to: `        if (source == null || !sv(source, "project_id").equals(projectId) || !isOne(ci(source, "active")))
            throw Api("Không tìm thấy dòng BOQ nguồn.");
        // JS 2795.
` + P("projectId", "true", "Không có quyền dự án.") },

  // 10) compare_boq_materials — mức ĐỌC
  { from: `        String projectId = trim(payload.get("projectId"));
        String requestedBatchId = trim(payload.get("batchId"));
        String requestedContractId = trim(payload.get("contractId"));
`,
    to: `        String projectId = trim(payload.get("projectId"));
        // JS 2770: mức ĐỌC (write=false) — so sánh không làm thay đổi dữ liệu.
` + P("projectId", "false", "Không có quyền xem/so sánh BOQ dự án này.") + `        String requestedBatchId = trim(payload.get("batchId"));
        String requestedContractId = trim(payload.get("contractId"));
` },

  // 11) confirm_boq_material_mappings
  { from: `        if (rows.size() > 5000) throw Api("Mỗi lần xác nhận tối đa 5.000 dòng.");
`,
    to: `        if (rows.size() > 5000) throw Api("Mỗi lần xác nhận tối đa 5.000 dòng.");
        // JS 2783.
` + P("projectId", "true", "Không có quyền cập nhật mapping BOQ dự án này.") },
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
    // Kiểm neo DUY NHẤT trước khi thay — bài học lô 5 (neo trùng ⇒ vá rơi sai phương thức).
    const occurrences = entry.text.split(edit.from).length - 1;
    if (occurrences !== 1) {
      failed++;
      rows.push(`  X   NEO KHONG DUY NHAT (${occurrences} lan): ${edit.from.trim().split("\n")[0].slice(0, 50)}`);
      continue;
    }
    entry.text = entry.text.replace(edit.from, edit.to);
    applied++; rows.push(`  APD ${edit.from.trim().split("\n")[0].slice(0, 58)}`);
  } else if (entry.text.includes(edit.to.split("\n")[0]) && edit.to.split("\n")[0].length > 20) {
    skipped++; rows.push(`  BO  ${edit.from.trim().split("\n")[0].slice(0, 58)}`);
  } else {
    failed++; rows.push(`  X   KHONG KHOP: ${edit.from.trim().split("\n")[0].slice(0, 58)}`);
  }
}

// ctor Boq nhan AccessScopeService
const boq = load(F);
const ctorRe = /public\s+BoqManagementUseCase\s*\(([^)]*)\)\s*\{/;
if (/AccessScopeService\s+accessScope\)/.test(boq.text)) { skipped++; rows.push("  BO  ctor Boq"); }
else {
  const c = ctorRe.exec(boq.text);
  if (!c) { failed++; rows.push("  X   khong thay ctor Boq"); }
  else {
    boq.text = boq.text.slice(0, c.index)
      + `public BoqManagementUseCase(${c[1].trim()}, AccessScopeService accessScope) {`
      + boq.text.slice(c.index + c[0].length);
    boq.text = boq.text.replace("        this.rbac = rbac;\n    }",
      "        this.rbac = rbac;\n        this.accessScope = accessScope;\n    }");
    applied++; rows.push("  APD ctor Boq");
  }
}

// bean boqManagementUseCase
const beans = load(BEANS);
if (/new BoqManagementUseCase\([^)]*accessScopeService/.test(beans.text)) { skipped++; rows.push("  BO  bean boq"); }
else {
  const bsig = /public\s+BoqManagementUseCase\s+boqManagementUseCase\s*\(([\s\S]*?)\)\s*\{/.exec(beans.text);
  const bctor = /new BoqManagementUseCase\(([^)]*)\)/.exec(beans.text);
  if (!bsig || !bctor) { failed++; rows.push("  X   khong khop bean boq"); }
  else {
    const indent = (bsig[1].match(/\n(\s*)\S/) || [, "                                                          "])[1];
    beans.text = beans.text.slice(0, bsig.index)
      + `public BoqManagementUseCase boqManagementUseCase(${bsig[1].replace(/\s*$/, "")},\n${indent}AccessScopeService accessScopeService) {`
      + beans.text.slice(bsig.index + bsig[0].length);
    const b2 = /new BoqManagementUseCase\(([^)]*)\)/.exec(beans.text);
    beans.text = beans.text.slice(0, b2.index)
      + `new BoqManagementUseCase(${b2[1]}, accessScopeService)`
      + beans.text.slice(b2.index + b2[0].length);
    applied++; rows.push("  APD bean boqManagementUseCase");
  }
}

if (failed === 0) {
  for (const [path, entry] of cache) {
    writeFileSync(path, entry.crlf ? entry.text.replace(/\n/g, "\r\n") : entry.text, "utf8");
  }
}

console.log("=== TASK-023 LO 6: BoqManagementUseCase (11 action) ===");
console.log(rows.join("\n"));
console.log(`\nAp dung: ${applied} · Bo qua: ${skipped} · Loi: ${failed}`);
if (failed) console.log("(Co loi nen KHONG ghi tep — tranh trang thai nua voi)");
process.exit(failed === 0 ? 0 : 1);
