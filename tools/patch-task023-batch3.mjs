// TASK-023 LÔ 3 — nối phạm vi cho 10 action kho còn lại của StockManagementUseCase.
//
// Ngữ nghĩa lấy NGUYÊN VĂN từ scripts/system-route.mjs (trích bằng tools/show-js-scope-checks.mjs)
// và đối chiếu tên khoá thật trong WarehouseStockStoreAdapter (findTransferOrder/findCentralReturn
// alias camelCase; findStockMovement dùng SELECT * nên snake_case).
//
//   confirm_installation  L1520 canAccessProject(item.projectId,true)        "Tài khoản không có quyền tại dự án này."
//   create_transfer_order L1446 canAccessWarehouse(sourceWarehouseId,true)   "Không có quyền lập điều chuyển từ kho nguồn này."
//   approve_transfer_order L1450 canAccessWarehouse(t.source_warehouse_id,true) "Không có quyền duyệt kho nguồn."
//   ship_transfer_order   L1452 canAccessWarehouse(t.sourceWarehouseId,true) "Chỉ thủ kho nguồn/đúng phạm vi mới được xác nhận xuất."
//   receive_transfer_order L1457 canAccessWarehouse(t.destinationWarehouseId,true) "Chỉ thủ kho đích/đúng phạm vi mới được xác nhận nhận."
//   create_central_return L1466 canAccessProject(projectId,true) + canAccessWarehouse(sourceWarehouseId,true)
//   approve_central_return L1471 canAccessProject(row.projectId,true)        "Không có quyền tại dự án này."
//   receive_central_return L1476 canAccessWarehouse(row.centralWarehouseId,true) "Chỉ Thủ kho Tổng được nhận phiếu vào Kho Tổng."
//   reconcile_contract_stock L858 canAccessProject(projectId,false) + canAccessWarehouse(warehouseId,false) — mức ĐỌC
//   transfer_contract_ownership L855 canAccessProject(projectId,true) + canAccessWarehouse(warehouseId,true)
//   reverse_stock_movement L1277 canAccessWarehouse(from,true) + canAccessWarehouse(to,true), CHỈ khi kho khác rỗng
import { readFileSync, writeFileSync } from "node:fs";

const F = "java-backend/application/src/main/java/com/vntech/erp/application/service/StockManagementUseCase.java";

const P = (projectIdExpr, write) =>
  `        accessScope.requireProjectAccess(principal.userId(), principal.role(), ${projectIdExpr}, ${write},\n`
  + `                "Tài khoản không có quyền tại dự án này.");\n`;
const W = (whExpr, write, msg) =>
  `        accessScope.requireWarehouseAccess(principal.userId(), principal.role(),\n`
  + `                principal.warehouseScopeKind(), ${whExpr}, ${write},\n`
  + `                "${msg}");\n`;

const EDITS = [
  // 1) confirm_installation — tra issue item từ DB rồi mới kiểm phạm vi dự án
  { from: `        Map<String, Object> item = store.findIssueItem(issueItemId)
                .orElseThrow(() -> Api("Dòng xác nhận lắp đặt không hợp lệ."));
        if (quantity <= 0) throw Api("Dòng xác nhận lắp đặt không hợp lệ.");
`,
    to: `        Map<String, Object> item = store.findIssueItem(issueItemId)
                .orElseThrow(() -> Api("Dòng xác nhận lắp đặt không hợp lệ."));
        if (quantity <= 0) throw Api("Dòng xác nhận lắp đặt không hợp lệ.");
        // JS 1520: phạm vi dự án lấy từ CHÍNH dòng xuất kho, không lấy từ payload.
` + P(`sv(item, "projectId")`, "true") },

  // 2) create_transfer_order — phạm vi kho NGUỒN
  { from: `                || sourceWarehouseId.equals(destinationWarehouseId) || rawLines.isEmpty())
            throw Api("Phiếu điều chuyển phải có kho nguồn, kho đích khác nhau và ít nhất một vật tư.");
`,
    to: `                || sourceWarehouseId.equals(destinationWarehouseId) || rawLines.isEmpty())
            throw Api("Phiếu điều chuyển phải có kho nguồn, kho đích khác nhau và ít nhất một vật tư.");
        // JS 1446: phạm vi kho nguồn (không kiểm kho đích — đúng JS).
` + W("sourceWarehouseId", "true", "Không có quyền lập điều chuyển từ kho nguồn này.") },

  // 3) approve_transfer_order
  { from: `        if (!"requested".equals(sv(t, "status")))
            throw Api("Phiếu điều chuyển không ở trạng thái chờ duyệt.");
        store.setTransferApproved(transferId, principal.userId(), Instant.now());
`,
    to: `        if (!"requested".equals(sv(t, "status")))
            throw Api("Phiếu điều chuyển không ở trạng thái chờ duyệt.");
        // JS 1450: phạm vi kho nguồn của chính phiếu.
` + W(`sv(t, "sourceWarehouseId")`, "true", "Không có quyền duyệt kho nguồn.") + `
        store.setTransferApproved(transferId, principal.userId(), Instant.now());
` },

  // 4) ship_transfer_order
  { from: `        if (!"approved".equals(sv(t, "status"))) throw Api("Phiếu chưa được duyệt hoặc đã xuất.");
        List<Map<String, Object>> items = store.transferOrderItems(transferId);
`,
    to: `        if (!"approved".equals(sv(t, "status"))) throw Api("Phiếu chưa được duyệt hoặc đã xuất.");
        // JS 1452: phạm vi kho nguồn.
` + W(`sv(t, "sourceWarehouseId")`, "true", "Chỉ thủ kho nguồn/đúng phạm vi mới được xác nhận xuất.") + `
        List<Map<String, Object>> items = store.transferOrderItems(transferId);
` },

  // 5) receive_transfer_order
  { from: `        if (!"in_transit".equals(sv(t, "status"))) throw Api("Phiếu chưa ở trạng thái đang vận chuyển.");
        List<?> rawLines = payload.get("lines") instanceof List<?> l ? l : List.of();
`,
    to: `        if (!"in_transit".equals(sv(t, "status"))) throw Api("Phiếu chưa ở trạng thái đang vận chuyển.");
        // JS 1457: phạm vi kho ĐÍCH.
` + W(`sv(t, "destinationWarehouseId")`, "true", "Chỉ thủ kho đích/đúng phạm vi mới được xác nhận nhận.") + `
        List<?> rawLines = payload.get("lines") instanceof List<?> l ? l : List.of();
` },

  // 6) create_central_return — phạm vi dự án RỒI phạm vi kho, TRƯỚC khi xác nhận kho thuộc dự án
  { from: `        List<?> rawLines = payload.get("lines") instanceof List<?> l ? l : List.of();
        if (store.findActiveWarehouse(sourceWarehouseId, projectId).isEmpty() || rawLines.isEmpty())
            throw Api("Phiếu trả Kho Tổng phải đúng kho dự án và có vật tư.");
`,
    to: `        List<?> rawLines = payload.get("lines") instanceof List<?> l ? l : List.of();
        // JS 1466: phạm vi DỰ ÁN rồi phạm vi KHO — kiểm trước khi xác nhận kho thuộc dự án.
` + P("projectId", "true") + W("sourceWarehouseId", "true", "Không có quyền xuất tại kho dự án này.") + `
        if (store.findActiveWarehouse(sourceWarehouseId, projectId).isEmpty() || rawLines.isEmpty())
            throw Api("Phiếu trả Kho Tổng phải đúng kho dự án và có vật tư.");
` },

  // 7) approve_central_return — phạm vi dự án của chính phiếu
  { from: `        if (!"pending_approval".equals(sv(row, "status"))) throw Api("Phiếu không còn ở trạng thái chờ duyệt.");
        String transitId = store.findTransitWarehouse().map(m -> sv(m, "id"))
`,
    to: `        if (!"pending_approval".equals(sv(row, "status"))) throw Api("Phiếu không còn ở trạng thái chờ duyệt.");
        // JS 1471: phạm vi dự án của chính phiếu (không kiểm kho — đúng JS).
` + P(`sv(row, "projectId")`, "true") + `
        String transitId = store.findTransitWarehouse().map(m -> sv(m, "id"))
` },

  // 8) receive_central_return — phạm vi KHO TỔNG
  { from: `        if (!"in_transit".equals(sv(row, "status")) || rawLines.isEmpty())
            throw Api("Phiếu phải được duyệt và có kết quả kiểm đếm.");
        if (store.centralReturnImageCount(returnId) < 1)
`,
    to: `        if (!"in_transit".equals(sv(row, "status")) || rawLines.isEmpty())
            throw Api("Phiếu phải được duyệt và có kết quả kiểm đếm.");
        // JS 1476: phạm vi Kho Tổng nhận phiếu — đặt trước kiểm ảnh, đúng thứ tự JS.
` + W(`sv(row, "centralWarehouseId")`, "true", "Chỉ Thủ kho Tổng được nhận phiếu vào Kho Tổng.") + `
        if (store.centralReturnImageCount(returnId) < 1)
` },

  // 9) reconcile_contract_stock — mức ĐỌC (false), không phải write
  { from: `        if (projectId.isEmpty() || warehouseId.isEmpty())
            throw Api("Đối soát cần chọn đúng một dự án và kho.");
        List<Map<String, Object>> rows = store.reconcilePhysicalVsContract(warehouseId, projectId);
`,
    to: `        if (projectId.isEmpty() || warehouseId.isEmpty())
            throw Api("Đối soát cần chọn đúng một dự án và kho.");
        // JS 858: phạm vi ở mức ĐỌC (write=false) — đối soát không làm thay đổi dữ liệu.
        if (!accessScope.canAccessProject(principal.userId(), principal.role(), projectId, false)
                || !accessScope.canAccessWarehouse(principal.userId(), principal.role(),
                        principal.warehouseScopeKind(), warehouseId, false)) {
            throw Api("Không có quyền đối soát kho này.");
        }
        List<Map<String, Object>> rows = store.reconcilePhysicalVsContract(warehouseId, projectId);
` },

  // 10) transfer_contract_ownership
  { from: `                || sourceContractId.isEmpty() || destinationContractId.isEmpty() || qty <= 0)
            throw Api("Chuyển ownership cần đủ kho, vật tư, Contract nguồn/đích hợp lệ và số lượng > 0.");
`,
    to: `                || sourceContractId.isEmpty() || destinationContractId.isEmpty() || qty <= 0)
            throw Api("Chuyển ownership cần đủ kho, vật tư, Contract nguồn/đích hợp lệ và số lượng > 0.");
        // JS 855: JS gộp hai kiểm vào một thông điệp.
        if (!accessScope.canAccessProject(principal.userId(), principal.role(), projectId, true)
                || !accessScope.canAccessWarehouse(principal.userId(), principal.role(),
                        principal.warehouseScopeKind(), warehouseId, true)) {
            throw Api("Không có quyền tại dự án/kho này.");
        }
` },

  // 11) reverse_stock_movement — CHỈ kiểm kho khi giao dịch CÓ kho tương ứng (đúng JS)
  { from: `        if (store.findReversal(movementId).isPresent()) throw Api("Giao dịch này đã được đảo trước đó.");
        Instant now = Instant.now();
`,
    to: `        if (store.findReversal(movementId).isPresent()) throw Api("Giao dịch này đã được đảo trước đó.");
        // JS 1277: chỉ kiểm khi kho KHÁC RỖNG; findStockMovement dùng SELECT * nên khoá snake_case.
        String scopeFromWh = sv(mov, "from_warehouse_id");
        if (!scopeFromWh.isEmpty()) {
` + W("scopeFromWh", "true", "Không có quyền tại kho nguồn.") + `        }
        String scopeToWh = sv(mov, "to_warehouse_id");
        if (!scopeToWh.isEmpty()) {
` + W("scopeToWh", "true", "Không có quyền tại kho đích.") + `        }
        Instant now = Instant.now();
` },
];

const raw = readFileSync(F, "utf8");
const crlf = raw.includes("\r\n");
let text = raw.replace(/\r\n/g, "\n");

let applied = 0, skipped = 0, failed = 0;
const rows = [];
for (const edit of EDITS) {
  if (text.includes(edit.from)) {
    text = text.replace(edit.from, edit.to);
    applied++; rows.push(`  APD ${edit.from.trim().split("\n")[0].slice(0, 62)}`);
  } else if (text.includes(edit.to.split("\n")[0]) && text.includes(edit.from.split("\n")[0])) {
    skipped++; rows.push(`  BO  ${edit.from.trim().split("\n")[0].slice(0, 62)}`);
  } else {
    failed++; rows.push(`  X   KHONG KHOP: ${edit.from.trim().split("\n")[0].slice(0, 62)}`);
  }
}

if (failed === 0) writeFileSync(F, crlf ? text.replace(/\n/g, "\r\n") : text, "utf8");

console.log("=== TASK-023 LO 3: 10 action kho con lai ===");
console.log(rows.join("\n"));
console.log(`\nAp dung: ${applied} · Bo qua: ${skipped} · Loi: ${failed}`);
if (failed) console.log("(Co loi nen KHONG ghi tep — tranh trang thai nua voi)");
process.exit(failed === 0 ? 0 : 1);
