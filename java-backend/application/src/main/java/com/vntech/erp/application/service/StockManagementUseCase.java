package com.vntech.erp.application.service;

import com.vntech.erp.application.port.out.IdGenerator;
import com.vntech.erp.application.port.out.WarehouseStockStore;
import com.vntech.erp.application.rbac.AccessScopeService;
import com.vntech.erp.application.rbac.RbacService;
import com.vntech.erp.domain.service.StockLedgerEngine;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Use-case kho — port nguyên trạng issue_stock của monolith JS:
 * kiểm tra team/MR/warehouse, tồn vật lý + giữ chỗ + tồn Contract ownership (multi-contract),
 * phiếu xuất PX-..., movements + contract ledger -qty, items, MR tiến độ, release reservation.
 */
public final class StockManagementUseCase {

    private final WarehouseStockStore store;
    private final IdGenerator idGenerator;
    private final RbacService rbac;
    private final AccessScopeService accessScope;

    public StockManagementUseCase(WarehouseStockStore store, IdGenerator idGenerator, RbacService rbac, AccessScopeService accessScope) {
        this.store = store;
        this.idGenerator = idGenerator;
        this.rbac = rbac;
        this.accessScope = accessScope;
    }

    public interface Principal {
        String userId();
        String role();
        String fullName();
        /**
         * Mã ENGINE (`role_catalog.base_role`) — giá trị THẬT SỰ dùng để phân quyền, đúng như
         * `effectiveRole(user)` của JS. Mặc định rơi về `role()` để tương thích ngược với mọi
         * tầng gọi chưa truyền giá trị này xuống.
         */
        default String roleBase() { return role(); }

        /**
         * Loại phạm vi kho của tài khoản (role_catalog.warehouse_scope_kind: "site" | "central").
         * Nhánh kho của canAccessWarehouse dùng giá trị này để chặn thủ kho dự án thao tác Kho Tổng
         * và ngược lại. Mặc định rỗng ⇒ AccessScopeService coi như "site" (đúng JS).
         */
        default String warehouseScopeKind() { return ""; }
    }

    public Map<String, Object> issueStock(Principal principal, Map<String, Object> payload) {
        rbac.requireRole(principalAsCurrent(principal), List.of("warehouse", "commander", "admin"));
        String projectId = trim(payload.get("projectId"));
        String fromWarehouseId = trim(payload.get("fromWarehouseId"));
        // JS 1510: kiểm vai trò TRƯỚC, rồi mới kiểm phạm vi dự án/kho (TASK-023).
        accessScope.requireProjectAccess(principal.userId(), principal.role(), projectId, true,
                "Tài khoản không có quyền cấp phát tại dự án này.");
        accessScope.requireWarehouseAccess(principal.userId(), principal.role(),
                principal.warehouseScopeKind(), fromWarehouseId, true,
                "Tài khoản không có quyền xuất tại kho này.");
        String teamId = trim(payload.get("teamId"));
        String requestId = trim(payload.get("requestId"));
        List<?> rawLines = payload.get("lines") instanceof List<?> l ? l : List.of();
        Map<String, Object> team = store.findTeam(teamId, projectId)
                .orElse(null);
        Map<String, Object> mr = store.findRequestForIssue(requestId, projectId).orElse(null);
        if (team == null || mr == null || rawLines.isEmpty())
            throw Api("Phiếu cấp phát phải đúng dự án, MR, tổ đội và có vật tư.");
        if (!List.of("approved", "ordered", "partial_received", "received", "partial_issued")
                .contains(sv(mr, "status")))
            throw Api("MR chưa ở trạng thái cho phép cấp phát.");
        if (store.findActiveWarehouse(fromWarehouseId, projectId).isEmpty())
            throw Api("Kho nguồn cấp phát phải thuộc đúng dự án.");

        Instant now = Instant.now();
        String issueId = idGenerator.next("ISS");
        int year = java.time.LocalDate.now().getYear();
        long seq = store.nextSequenceNo("PX:" + projectId + ":" + year, "PX", projectId, year, now);
        // Số phiếu PHẢI kèm mã dự án: document_sequences đếm theo (project, year) nên nếu chỉ dùng
        // "PX-<year>-<seq>" thì hai dự án khác nhau sẽ trùng số và vi phạm stock_issues_no_uidx (global).
        // Giữ cùng quy ước với số PO đang dùng: PO-<MÃ DỰ ÁN>-<year>-<seq>.
        String issueNo = "PX-" + sv(mr, "projectCode").toUpperCase() + "-" + year + "-" + String.format("%04d", seq);

        List<Map<String, Object>> items = new ArrayList<>();
        for (int index = 0; index < rawLines.size(); index++) {
            Map<String, Object> line = asMap(rawLines.get(index));
            int rowNo = index + 1;
            String materialId = trim(line.get("materialId"));
            double qty = numberValue(line.get("quantity"));
            String requestItemId = trim(line.get("requestItemId"));
            Map<String, Object> requestLine = store.findRequestLine(requestItemId, requestId, materialId).orElse(null);
            if (requestLine == null || qty <= 0) throw Api("Dòng " + rowNo + ": cấp phát không hợp lệ.");
            String contractId = trim(line.get("contractId"));
            if (contractId.isEmpty()) contractId = sv(requestLine, "contractId");
            if (contractId.isEmpty()) contractId = sv(mr, "contractId");
            if (contractId.isEmpty()) throw Api("Dòng " + rowNo + ": MR thiếu Contract ownership.");

            StockLedgerEngine.BalanceStore bs = new StockLedgerEngine.BalanceStore() {
                @Override public double stockBalance(String w, String m) { return store.stockBalance(w, m); }
                @Override public double reservedBalance(String w, String m, String exclude) { return store.reservedBalance(w, m, exclude); }
                @Override public double contractBalance(String p, String c, String w, String m) { return store.contractBalance(p, c, w, m); }
                @Override public double reservedForRequest(String w, String m, String r) { return 0; }
            };
            StockLedgerEngine.Availability av = StockLedgerEngine.availability(bs, projectId, contractId,
                    fromWarehouseId, materialId, requestId);
            String error = StockLedgerEngine.validateIssue(av, qty);
            if (!error.isEmpty()) throw Api("Dòng " + rowNo + ": " + error);
            if (numberValue(ci(requestLine, "issuedQty")) + qty > numberValue(ci(requestLine, "requestedQty")) + 1e-9)
                throw Api("Dòng " + rowNo + ": số lượng cấp lũy kế vượt nhu cầu MR.");

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", idGenerator.next("SMII"));
            item.put("materialId", materialId);
            item.put("requestItemId", requestItemId);
            item.put("contractId", contractId);
            item.put("quantity", qty);
            item.put("workPackageCode", nvl(line.get("workPackageCode")));
            item.put("installationArea", nvl(line.get("installationArea")));
            item.put("requestedQty", numberValue(ci(requestLine, "requestedQty")));
            items.add(item);
        }

        Map<String, Object> header = new LinkedHashMap<>();
        header.put("id", issueId);
        header.put("issueNo", issueNo);
        header.put("projectId", projectId);
        header.put("fromWarehouseId", fromWarehouseId);
        // Kho nhận là KHO TỔ ĐỘI (teams.warehouse_id) — JS ghi movement SMI chuyển hàng sang kho này.
        header.put("toWarehouseId", sv(team, "warehouseId"));
        header.put("teamId", teamId);
        header.put("requestId", requestId);
        header.put("issuedBy", principal.userId());
        header.put("receivedByName", nvl(payload.get("receivedByName")));
        header.put("approvedBy", principal.userId());
        header.put("issuedAt", now);
        header.put("signedAt", now);
        header.put("note", nvl(payload.get("note")));
        store.insertStockIssue(header, items, now);
        for (Map<String, Object> item : items) {
            store.updateRequestItemIssued(sv(item, "requestItemId"), (double) item.get("quantity"), 0, now);
            // ĐÃ XOÁ (TASK-040 nhóm 4): lệnh gọi cũ `updateIssueItemInstalled(item.id, 0, now)` ở đây là
            // THỪA — `insertStockIssue` đã ghi `installed_qty=0` ngay trong câu INSERT (adapter dòng ~129),
            // đúng như JS (system-route.mjs:1511 bind giá trị 0 cho cột installed_qty). JS không có câu ghi
            // lại nào sau khi chèn. Nay phương thức đó mang nghĩa CỘNG DỒN nên gọi với 0 chỉ là vô nghĩa.
            store.releaseReservationsForRequest(requestId, sv(item, "materialId"), fromWarehouseId, now);
        }
        long sla = 24;
        store.insertSupplyWorkflowStepIssued(requestId, issueId, now, sla);
        boolean anyRemaining = false;
        for (Map<String, Object> item : items) {
            double issued = numberValue(item.get("quantity"));
            if (issued + 1e-9 < numberValue(item.get("requestedQty"))) anyRemaining = true;
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("message", "Đã xuất kho " + items.size() + " dòng; phiếu " + issueNo + " đã ghi nhận."
                + (anyRemaining ? " MR còn lượng chưa cấp đủ." : ""));
        result.put("issueId", issueId);
        result.put("issueNo", issueNo);
        return result;
    }

    // ---- helpers ----
    /** return_stock — tổ đội hoàn trả kho dự án; Contract ownership bảo toàn. */
    public Map<String, Object> returnStock(Principal principal, Map<String, Object> payload) {
        rbac.requireRole(principalAsCurrent(principal), List.of("warehouse", "team", "admin"));
        String projectId = trim(payload.get("projectId"));
        String teamId = trim(payload.get("teamId"));
        String toWarehouseId = trim(payload.get("toWarehouseId"));
        // JS 1515: kiểm vai trò TRƯỚC, rồi mới kiểm phạm vi dự án/kho (TASK-023).
        accessScope.requireProjectAccess(principal.userId(), principal.role(), projectId, true,
                "Tài khoản không có quyền hoàn trả tại dự án này.");
        accessScope.requireWarehouseAccess(principal.userId(), principal.role(),
                principal.warehouseScopeKind(), toWarehouseId, true,
                "Tài khoản không có quyền nhận hoàn trả tại kho này.");
        List<?> rawLines = payload.get("lines") instanceof List<?> l ? l : List.of();
        Map<String, Object> team = store.findTeam(teamId, projectId).orElse(null);
        if (team == null || rawLines.isEmpty()) throw Api("Phiếu hoàn trả cần đúng tổ đội và vật tư.");
        if (store.findActiveWarehouse(toWarehouseId, projectId).isEmpty())
            throw Api("Kho nhận hoàn trả phải thuộc đúng dự án.");
        Instant now = Instant.now();
        String returnId = idGenerator.next("RET");
        int year = java.time.LocalDate.now().getYear();
        long seq = store.nextSequenceNo("RET:" + projectId + ":" + year, "RET", projectId, year, now);
        // Kèm mã dự án: material_returns_no_uidx là unique TOÀN CỤC nhưng sequence đếm theo (project, year).
        String returnNo = "RET-" + sv(team, "projectCode").toUpperCase() + "-" + year + "-" + String.format("%04d", seq);
        String teamWarehouseId = sv(team, "warehouseId");
        List<Map<String, Object>> items = new ArrayList<>();
        for (int index = 0; index < rawLines.size(); index++) {
            Map<String, Object> line = asMap(rawLines.get(index));
            int rowNo = index + 1;
            String materialId = trim(line.get("materialId"));
            double qty = numberValue(line.get("quantity"));
            double physicalQty = store.stockBalance(teamWarehouseId, materialId);
            if (qty <= 0 || qty > physicalQty + 1e-9)
                throw Api("Dòng " + rowNo + ": số lượng hoàn trả vượt tồn vật lý tổ đội.");
            Map<String, Object> owner = store.resolveOwnershipContract(projectId, teamWarehouseId, materialId,
                            trim(line.get("contractId")))
                    .orElseThrow(() -> Api("Dòng " + rowNo + ": không xác định Contract ownership (nhiều contract hoặc không có)."));
            String contractId = sv(owner, "id");
            double ownerQty = store.contractBalance(projectId, contractId, teamWarehouseId, materialId);
            if (qty > ownerQty + 1e-9)
                throw Api("Dòng " + rowNo + ": số lượng hoàn trả vượt tồn Contract của tổ đội (còn " + ownerQty + ").");
            String condition = trim(line.get("condition"));
            if (condition.isEmpty()) condition = "usable";
            double accepted = "usable".equals(condition) ? qty : 0;
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", idGenerator.next("RETI"));
            item.put("materialId", materialId);
            item.put("contractId", contractId);
            item.put("quantity", qty);
            item.put("acceptedQty", accepted);
            item.put("condition", condition);
            item.put("reason", nvl(line.get("reason")));
            item.put("fromWarehouseId", teamWarehouseId);
            item.put("toWarehouseId", toWarehouseId);
            items.add(item);
        }
        Map<String, Object> header = new LinkedHashMap<>();
        header.put("id", returnId);
        header.put("returnNo", returnNo);
        header.put("projectId", projectId);
        header.put("teamId", teamId);
        header.put("toWarehouseId", toWarehouseId);
        header.put("returnedByName", nvl(payload.get("returnedByName")));
        header.put("receivedBy", principal.userId());
        header.put("returnedAt", now);
        header.put("note", nvl(payload.get("note")));
        boolean acceptedAny = items.stream().anyMatch(i -> (double) i.get("acceptedQty") > 0);
        store.insertMaterialReturn(header, items, acceptedAny, now);
        return Map.of("message", "Đã nhận hoàn trả " + returnNo + "; Contract ownership được bảo toàn.");
    }

    /** confirm_installation — tổ đội xác nhận đã lắp; giảm tồn Contract + movement INSTALL. */
    public Map<String, Object> confirmInstallation(Principal principal, Map<String, Object> payload) {
        rbac.requireRole(principalAsCurrent(principal), List.of("team", "warehouse", "commander", "admin"));
        String issueItemId = trim(payload.get("issueItemId"));
        double quantity = numberValue(payload.get("quantity"));
        Map<String, Object> item = store.findIssueItem(issueItemId)
                .orElseThrow(() -> Api("Dòng xác nhận lắp đặt không hợp lệ."));
        if (quantity <= 0) throw Api("Dòng xác nhận lắp đặt không hợp lệ.");
        // JS 1520: phạm vi dự án lấy từ CHÍNH dòng xuất kho, không lấy từ payload.
        accessScope.requireProjectAccess(principal.userId(), principal.role(), sv(item, "projectId"), true,
                "Tài khoản không có quyền tại dự án này.");
        double installedQty = numberValue(item.get("installedQty"));
        double issueQty = numberValue(item.get("quantity"));
        if (installedQty + quantity > issueQty + 1e-9)
            throw Api("Số lượng xác nhận lắp vượt số lượng tổ đội đã nhận.");
        String teamWarehouseId = sv(item, "teamWarehouseId");
        double physicalQty = store.stockBalance(teamWarehouseId, sv(item, "materialId"));
        if (quantity > physicalQty + 1e-9)
            throw Api("Tồn vật lý tổ đội không đủ để xác nhận đã lắp.");
        String contractId = sv(item, "contractId");
        if (contractId.isEmpty())
            throw Api("Dòng xuất kho thiếu Contract ownership; không thể xác nhận lắp.");
        double ownerQty = store.contractBalance(sv(item, "projectId"), contractId, teamWarehouseId, sv(item, "materialId"));
        if (quantity > ownerQty + 1e-9)
            throw Api("Tồn Contract của tổ đội không đủ để xác nhận đã lắp.");
        Instant now = Instant.now();
        store.updateIssueItemInstalled(issueItemId, quantity, now);
        store.updateRequestItemInstalledOnly(sv(item, "requestItemId"), quantity, now);
        store.insertInstallMovement(sv(item, "issueId"), issueItemId, quantity, contractId, teamWarehouseId,
                sv(item, "materialId"), sv(item, "projectId"), principal.userId(), now);
        // ĐÃ XOÁ (TASK-040 nhóm 4): nhánh cũ gọi `store.updateIssueItemStatusInstalled(...)` khi lắp đủ số
        // lượng — ghi cột `stock_issue_items.status` KHÔNG tồn tại ⇒ HTTP 500 đúng ở lần xác nhận CUỐI.
        // JS `confirm_installation` (system-route.mjs:1520) KHÔNG đánh dấu trạng thái ở đâu ⇒ đây là hành vi
        // tự thêm; cách đúng là bỏ, KHÔNG phải thêm cột vào MySQL cho khớp.
        return Map.of("message", "Đã xác nhận lắp đặt " + quantity + "; tồn kho và sổ Contract đã cập nhật.");
    }

    /** create_transfer_order — điều chuyển nội bộ; khóa Contract ownership từng dòng. */
    public Map<String, Object> createTransferOrder(Principal principal, Map<String, Object> payload) {
        String sourceWarehouseId = trim(payload.get("sourceWarehouseId"));
        String destinationWarehouseId = trim(payload.get("destinationWarehouseId"));
        List<?> rawLines = payload.get("lines") instanceof List<?> l ? l : List.of();
        if (sourceWarehouseId.isEmpty() || destinationWarehouseId.isEmpty()
                || sourceWarehouseId.equals(destinationWarehouseId) || rawLines.isEmpty())
            throw Api("Phiếu điều chuyển phải có kho nguồn, kho đích khác nhau và ít nhất một vật tư.");
        // JS 1446: phạm vi kho nguồn (không kiểm kho đích — đúng JS).
        accessScope.requireWarehouseAccess(principal.userId(), principal.role(),
                principal.warehouseScopeKind(), sourceWarehouseId, true,
                "Không có quyền lập điều chuyển từ kho nguồn này.");
        Map<String, Object> sw = store.findWarehouseFull(sourceWarehouseId)
                .orElseThrow(() -> Api("Kho nguồn/đích không hợp lệ."));
        Map<String, Object> dw = store.findWarehouseFull(destinationWarehouseId)
                .orElseThrow(() -> Api("Kho nguồn/đích không hợp lệ."));
        if ("transit".equals(sv(dw, "type"))) throw Api("Kho nguồn/đích không hợp lệ.");
        Map<String, Object> transit = store.findTransitWarehouse()
                .orElseThrow(() -> Api("Thiếu kho Transit hệ thống."));
        Instant now = Instant.now();
        int year = java.time.LocalDate.now().getYear();
        String sourceProjectId = sv(sw, "projectId");
        String destinationProjectId = sv(dw, "projectId");
        long seq = store.nextSequenceNo("TRANSFER:" + year, "TRANSFER",
                sourceProjectId.isEmpty() ? destinationProjectId : sourceProjectId, year, now);
        String transferId = idGenerator.next("TRF");
        String transferNo = "TRF-" + year + "-" + String.format("%05d", seq);
        List<Map<String, Object>> items = new ArrayList<>();
        for (int index = 0; index < rawLines.size(); index++) {
            Map<String, Object> line = asMap(rawLines.get(index));
            int rowNo = index + 1;
            String materialId = trim(line.get("materialId"));
            double qty = numberValue(line.get("quantity"));
            if (materialId.isEmpty() || qty <= 0) throw Api("Dòng " + rowNo + ": vật tư/số lượng không hợp lệ.");
            double physical = store.stockBalance(sourceWarehouseId, materialId);
            double reserved = store.reservedBalance(sourceWarehouseId, materialId, "");
            double available = Math.max(0, physical - reserved);
            if (qty > available + 1e-9)
                throw Api("Dòng " + rowNo + ": số lượng điều chuyển vượt tồn vật lý khả dụng (" + available + ").");
            String sourceContractId = null, destinationContractId = null;
            if (!sourceProjectId.isEmpty()) {
                sourceContractId = store.resolveOwnershipContract(sourceProjectId, sourceWarehouseId,
                                materialId, trim(line.get("sourceContractId")))
                        .map(m -> sv(m, "id"))
                        .orElseThrow(() -> Api("Dòng " + rowNo + ": không xác định Contract ownership nguồn."));
                double ownerQty = store.contractBalance(sourceProjectId, sourceContractId, sourceWarehouseId, materialId);
                if (qty > ownerQty + 1e-9)
                    throw Api("Dòng " + rowNo + ": Contract nguồn chỉ còn " + ownerQty + ".");
            }
            if (!destinationProjectId.isEmpty()) {
                if (!trim(line.get("destinationContractId")).isEmpty()) {
                    destinationContractId = trim(line.get("destinationContractId"));
                } else if (!sourceProjectId.isEmpty() && sourceProjectId.equals(destinationProjectId) && sourceContractId != null) {
                    destinationContractId = sourceContractId;
                } else {
                    destinationContractId = store.defaultContractId(destinationProjectId)
                            .orElseThrow(() -> Api("Dòng " + rowNo + ": dự án đích chưa có Contract hoạt động."));
                }
            }
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", idGenerator.next("TRFI"));
            item.put("materialId", materialId);
            item.put("sourceContractId", sourceContractId);
            item.put("destinationContractId", destinationContractId);
            item.put("quantity", qty);
            item.put("note", nvl(line.get("note")));
            items.add(item);
        }
        Map<String, Object> header = new LinkedHashMap<>();
        header.put("id", transferId);
        header.put("transferNo", transferNo);
        header.put("sourceWarehouseId", sourceWarehouseId);
        header.put("destinationWarehouseId", destinationWarehouseId);
        header.put("sourceProjectId", sourceProjectId.isEmpty() ? null : sourceProjectId);
        header.put("destinationProjectId", destinationProjectId.isEmpty() ? null : destinationProjectId);
        header.put("transitWarehouseId", sv(transit, "id"));
        header.put("requestedBy", principal.userId());
        header.put("requestedAt", now);
        header.put("reason", blankDefault(trim(payload.get("reason")), "Điều chuyển nội bộ"));
        header.put("note", nvl(payload.get("note")));
        store.insertTransferOrder(header, items, now);
        return Map.of("message", "Đã tạo " + transferNo + "; Contract ownership của từng dòng đã được khóa để chờ duyệt.");
    }

    /** approve_transfer_order — duyệt; approved_qty = requested_qty. */
    public Map<String, Object> approveTransferOrder(Principal principal, Map<String, Object> payload) {
        String transferId = trim(payload.get("transferOrderId"));
        Map<String, Object> t = store.findTransferOrder(transferId)
                .orElseThrow(() -> Api("Phiếu điều chuyển không ở trạng thái chờ duyệt."));
        if (!"requested".equals(sv(t, "status")))
            throw Api("Phiếu điều chuyển không ở trạng thái chờ duyệt.");
        // JS 1450: phạm vi kho nguồn của chính phiếu.
        accessScope.requireWarehouseAccess(principal.userId(), principal.role(),
                principal.warehouseScopeKind(), sv(t, "sourceWarehouseId"), true,
                "Không có quyền duyệt kho nguồn.");

        store.setTransferApproved(transferId, principal.userId(), Instant.now());
        return Map.of("message", "Đã duyệt điều chuyển; kho nguồn có thể xuất hàng.");
    }

    /** ship_transfer_order — xuất khỏi kho nguồn sang Transit; bảo toàn ownership. */
    public Map<String, Object> shipTransferOrder(Principal principal, Map<String, Object> payload) {
        String transferId = trim(payload.get("transferOrderId"));
        Map<String, Object> t = store.findTransferOrder(transferId)
                .orElseThrow(() -> Api("Phiếu chưa được duyệt hoặc đã xuất."));
        if (!"approved".equals(sv(t, "status"))) throw Api("Phiếu chưa được duyệt hoặc đã xuất.");
        // JS 1452: phạm vi kho nguồn.
        accessScope.requireWarehouseAccess(principal.userId(), principal.role(),
                principal.warehouseScopeKind(), sv(t, "sourceWarehouseId"), true,
                "Chỉ thủ kho nguồn/đúng phạm vi mới được xác nhận xuất.");

        List<Map<String, Object>> items = store.transferOrderItems(transferId);
        String sourceProjectId = sv(t, "sourceProjectId");
        for (Map<String, Object> item : items) {
            double qty = numberValue(ci(item, "approvedQty"));
            double physical = store.stockBalance(sv(t, "sourceWarehouseId"), sv(item, "materialId"));
            double reserved = store.reservedBalance(sv(t, "sourceWarehouseId"), sv(item, "materialId"), "");
            double available = Math.max(0, physical - reserved);
            if (qty <= 0 || qty > available + 1e-9)
                throw Api("Không đủ tồn vật lý khả dụng để xuất " + sv(item, "materialId") + "; còn " + available + ".");
            if (!sourceProjectId.isEmpty()) {
                String contractId = sv(item, "sourceContractId");
                if (contractId.isEmpty()) throw Api("Dòng điều chuyển thiếu Contract nguồn.");
                double ownerQty = store.contractBalance(sourceProjectId, contractId, sv(t, "sourceWarehouseId"), sv(item, "materialId"));
                if (qty > ownerQty + 1e-9)
                    throw Api("Contract nguồn không đủ tồn để xuất " + sv(item, "materialId") + "; còn " + ownerQty + ".");
            }
            item.put("fromWarehouseId", sv(t, "sourceWarehouseId"));
            item.put("quantity", qty);
        }
        store.shipTransfer(transferId, items, sv(t, "transitWarehouseId"), sourceProjectId, principal.userId(), Instant.now());
        return Map.of("message", sv(t, "transferNo") + " đã xuất khỏi kho nguồn; Transit bảo toàn Contract ownership nguồn.");
    }

    /** receive_transfer_order — Kho đích nhận; cập nhật items + status. */
    public Map<String, Object> receiveTransferOrder(Principal principal, Map<String, Object> payload) {
        String transferId = trim(payload.get("transferOrderId"));
        Map<String, Object> t = store.findTransferOrder(transferId)
                .orElseThrow(() -> Api("Phiếu chưa ở trạng thái đang vận chuyển."));
        if (!"in_transit".equals(sv(t, "status"))) throw Api("Phiếu chưa ở trạng thái đang vận chuyển.");
        // JS 1457: phạm vi kho ĐÍCH.
        accessScope.requireWarehouseAccess(principal.userId(), principal.role(),
                principal.warehouseScopeKind(), sv(t, "destinationWarehouseId"), true,
                "Chỉ thủ kho đích/đúng phạm vi mới được xác nhận nhận.");

        List<?> rawLines = payload.get("lines") instanceof List<?> l ? l : List.of();
        List<Map<String, Object>> updates = new ArrayList<>();
        long lostTotal = 0;
        for (Map<String, Object> item : store.transferOrderItems(transferId)) {
            Map<String, Object> line = null;
            for (Object o : rawLines) {
                Map<String, Object> r = asMap(o);
                if (sv(r, "transferOrderItemId").equals(sv(item, "id"))) { line = r; break; }
            }
            double shipped = numberValue(ci(item, "shippedQty"));
            if (shipped == 0) shipped = numberValue(ci(item, "approvedQty"));
            double received = line != null ? numberValue(line.get("receivedQty")) : shipped;
            double rejected = line != null ? numberValue(line.get("rejectedQty")) : 0;
            if (received < 0 || rejected < 0 || received + rejected > shipped + 1e-9)
                throw Api("Số nhận/từ chối vượt số đã xuất.");
            double lost = Math.max(0, shipped - received - rejected);
            lostTotal += lost;
            Map<String, Object> u = new LinkedHashMap<>();
            u.put("id", sv(item, "id"));
            u.put("received", received);
            u.put("rejected", rejected);
            u.put("lost", lost);
            updates.add(u);
        }
        store.receiveTransfer(transferId, updates, t, lostTotal, principal.userId(), Instant.now());
        return Map.of("message", "Đã nhận " + sv(t, "transferNo") + "; tồn đích và Contract ownership được ghi theo số thực nhận."
                + (lostTotal > 0 ? " (thất thoát " + lostTotal + " đơn vị)." : ""));
    }

    private static Object ci(Map<String, Object> m, String key) {
        if (m == null) return null;
        Object v = m.get(key);
        if (v != null) return v;
        for (Map.Entry<String, Object> e : m.entrySet())
            if (e.getKey().equalsIgnoreCase(key)) return e.getValue();
        return null;
    }

    private static String blankDefault(String s, String fallback) { return s.isEmpty() ? fallback : s; }

    // ============ central returns ============
    /** create_central_return — dự án đề nghị trả dư về Kho Tổng. */
    public Map<String, Object> createCentralReturn(Principal principal, Map<String, Object> payload) {
        String projectId = trim(payload.get("projectId"));
        String sourceWarehouseId = trim(payload.get("sourceWarehouseId"));
        List<?> rawLines = payload.get("lines") instanceof List<?> l ? l : List.of();
        // JS 1466: phạm vi DỰ ÁN rồi phạm vi KHO — kiểm trước khi xác nhận kho thuộc dự án.
        accessScope.requireProjectAccess(principal.userId(), principal.role(), projectId, true,
                "Tài khoản không có quyền tại dự án này.");
        accessScope.requireWarehouseAccess(principal.userId(), principal.role(),
                principal.warehouseScopeKind(), sourceWarehouseId, true,
                "Không có quyền xuất tại kho dự án này.");

        if (store.findActiveWarehouse(sourceWarehouseId, projectId).isEmpty() || rawLines.isEmpty())
            throw Api("Phiếu trả Kho Tổng phải đúng kho dự án và có vật tư.");
        Map<String, Object> central = store.findCentralWarehouse()
                .orElseThrow(() -> Api("Chưa cấu hình Kho Tổng."));
        Instant now = Instant.now();
        int year = java.time.LocalDate.now().getYear();
        long seq = store.nextSequenceNo("CENTRAL_RETURN:" + projectId + ":" + year, "CENTRAL_RETURN", projectId, year, now);
        String returnId = idGenerator.next("CRET");
        String projectCode = "PRJ";
        Map<String, Object> wh = store.findWarehouseById(sourceWarehouseId).orElse(Map.of());
        String returnNo = "KT-RET-" + projectCode.toUpperCase() + "-" + year + "-" + String.format("%04d", seq);
        List<Map<String, Object>> items = new ArrayList<>();
        for (int index = 0; index < rawLines.size(); index++) {
            Map<String, Object> line = asMap(rawLines.get(index));
            int rowNo = index + 1;
            String materialId = trim(line.get("materialId"));
            double qty = numberValue(line.get("quantity"));
            double physical = store.stockBalance(sourceWarehouseId, materialId);
            if (qty <= 0 || qty > physical + 1e-9)
                throw Api("Dòng " + rowNo + ": số lượng đề nghị chuyển vượt tồn vật lý kho nguồn.");
            String contractId = store.resolveOwnershipContract(projectId, sourceWarehouseId, materialId,
                            trim(line.get("contractId")))
                    .map(m -> sv(m, "id"))
                    .orElseThrow(() -> Api("Dòng " + rowNo + ": không xác định Contract ownership."));
            double ownerQty = store.contractBalance(projectId, contractId, sourceWarehouseId, materialId);
            if (qty > ownerQty + 1e-9)
                throw Api("Dòng " + rowNo + ": Contract chỉ còn " + ownerQty + " tại kho nguồn.");
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", idGenerator.next("CRETI"));
            item.put("materialId", materialId);
            item.put("contractId", contractId);
            item.put("quantity", qty);
            item.put("conditionStatus", blankDefault(trim(line.get("conditionStatus")), "usable"));
            item.put("unitCost", numberValue(line.get("unitCost")));
            items.add(item);
        }
        Map<String, Object> header = new LinkedHashMap<>();
        header.put("id", returnId);
        header.put("returnNo", returnNo);
        header.put("projectId", projectId);
        header.put("sourceWarehouseId", sourceWarehouseId);
        header.put("centralWarehouseId", sv(central, "id"));
        header.put("requestedBy", principal.userId());
        header.put("requestedAt", now);
        header.put("note", nvl(payload.get("note")));
        store.insertCentralReturn(header, items, now);
        return Map.of("message", "Đã lập " + returnNo + "; Contract ownership từng dòng đã được khóa, chờ phê duyệt.");
    }

    /** approve_central_return — duyệt; xuất kho nguồn → Transit (bảo toàn ownership). */
    public Map<String, Object> approveCentralReturn(Principal principal, Map<String, Object> payload) {
        String returnId = trim(payload.get("centralReturnId"));
        Map<String, Object> row = store.findCentralReturn(returnId)
                .orElseThrow(() -> Api("Phiếu không còn ở trạng thái chờ duyệt."));
        if (!"pending_approval".equals(sv(row, "status"))) throw Api("Phiếu không còn ở trạng thái chờ duyệt.");
        // JS 1471: phạm vi dự án của chính phiếu (không kiểm kho — đúng JS).
        accessScope.requireProjectAccess(principal.userId(), principal.role(), sv(row, "projectId"), true,
                "Tài khoản không có quyền tại dự án này.");

        String transitId = store.findTransitWarehouse().map(m -> sv(m, "id"))
                .orElseThrow(() -> Api("Thiếu kho Transit hệ thống."));
        String projectId = sv(row, "projectId");
        String sourceWarehouseId = sv(row, "sourceWarehouseId");
        List<Map<String, Object>> items = new ArrayList<>();
        for (Map<String, Object> it : store.centralReturnItems(returnId)) {
            double qty = numberValue(ci(it, "proposedQty"));
            double physical = store.stockBalance(sourceWarehouseId, sv(it, "materialId"));
            double ownerQty = store.contractBalance(projectId, sv(it, "contractId"), sourceWarehouseId, sv(it, "materialId"));
            if (qty > physical + 1e-9 || qty > ownerQty + 1e-9)
                throw Api("Tồn vật lý/Contract nguồn không đủ; dừng duyệt để tránh sai sổ.");
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("materialId", sv(it, "materialId"));
            item.put("contractId", sv(it, "contractId"));
            item.put("quantity", qty);
            items.add(item);
        }
        Map<String, Object> context = new LinkedHashMap<>();
        context.put("projectId", projectId);
        context.put("sourceWarehouseId", sourceWarehouseId);
        String reason = blankDefault(trim(payload.get("reason")), "Đồng ý chuyển vật tư dư về Kho Tổng");
        store.approveCentralReturnWithShip(returnId, reason, transitId, context, items, principal.userId(), Instant.now());
        return Map.of("message", "Đã duyệt và xuất khỏi kho nguồn; Transit giữ nguyên Contract ownership.");
    }

    /** receive_central_return — Kho Tổng kiểm đếm và nhận. */
    public Map<String, Object> receiveCentralReturn(Principal principal, Map<String, Object> payload) {
        String returnId = trim(payload.get("centralReturnId"));
        List<?> rawLines = payload.get("lines") instanceof List<?> l ? l : List.of();
        Map<String, Object> row = store.findCentralReturn(returnId)
                .orElseThrow(() -> Api("Phiếu phải được duyệt và có kết quả kiểm đếm."));
        if (!"in_transit".equals(sv(row, "status")) || rawLines.isEmpty())
            throw Api("Phiếu phải được duyệt và có kết quả kiểm đếm.");
        // JS 1476: phạm vi Kho Tổng nhận phiếu — đặt trước kiểm ảnh, đúng thứ tự JS.
        accessScope.requireWarehouseAccess(principal.userId(), principal.role(),
                principal.warehouseScopeKind(), sv(row, "centralWarehouseId"), true,
                "Chỉ Thủ kho Tổng được nhận phiếu vào Kho Tổng.");

        if (store.centralReturnImageCount(returnId) < 1)
            throw Api("Phải tải ít nhất một ảnh kiểm đếm trước khi Kho Tổng xác nhận.");
        Map<String, Map<String, Object>> sourceMap = new LinkedHashMap<>();
        for (Map<String, Object> it : store.centralReturnItems(returnId)) sourceMap.put(sv(it, "id"), it);
        String transitId = store.findTransitWarehouse().map(m -> sv(m, "id"))
                .orElseThrow(() -> Api("Thiếu kho Transit hệ thống."));
        List<Map<String, Object>> updates = new ArrayList<>();
        long acceptedTotal = 0, rejectedTotal = 0;
        for (Object o : rawLines) {
            Map<String, Object> line = asMap(o);
            String itemId = trim(line.get("centralReturnItemId"));
            Map<String, Object> source = sourceMap.get(itemId);
            double counted = numberValue(line.get("countedQty"));
            double accepted = numberValue(line.get("acceptedQty"));
            if (source == null || counted < 0 || accepted < 0 || accepted > counted + 1e-9
                    || counted > numberValue(ci(source, "proposedQty")) + 1e-9)
                throw Api("Kết quả kiểm đếm Kho Tổng không hợp lệ.");
            double proposed = numberValue(ci(source, "proposedQty"));
            double transitBalance = store.stockBalance(transitId, sv(source, "materialId"));
            double transitOwner = store.contractBalance(sv(row, "projectId"), sv(source, "contractId"),
                    transitId, sv(source, "materialId"));
            if (proposed > transitBalance + 1e-9 || proposed > transitOwner + 1e-9)
                throw Api("Số liệu Transit vật lý/Contract không đủ; dừng nhận để tránh sai tồn.");
            double rejected = Math.max(0, counted - accepted);
            double lost = Math.max(0, proposed - counted);
            double rejectedWithLost = rejected + lost;
            acceptedTotal += accepted;
            rejectedTotal += rejectedWithLost;
            Map<String, Object> u = new LinkedHashMap<>();
            u.put("id", itemId);
            u.put("materialId", sv(source, "materialId"));
            u.put("contractId", sv(source, "contractId"));
            u.put("counted", counted);
            u.put("accepted", accepted);
            u.put("rejected", rejectedWithLost);
            updates.add(u);
        }
        Map<String, Object> context = new LinkedHashMap<>();
        context.put("projectId", sv(row, "projectId"));
        context.put("sourceWarehouseId", sv(row, "sourceWarehouseId"));
        context.put("centralWarehouseId", sv(row, "centralWarehouseId"));
        context.put("transitWarehouseId", transitId);
        store.receiveCentralReturn(returnId, updates, context, acceptedTotal, rejectedTotal,
                principal.userId(), Instant.now());
        return Map.of("message", "Đã nhận về Kho Tổng; tồn đích và Contract ownership ghi theo số kiểm đếm thực."
                + (rejectedTotal > 0 ? " (loại " + rejectedTotal + " đơn vị)." : ""));
    }

    // ============ stocktake ============
    /** create_stock_count — lập phiếu kiểm kê; variance = actual - book. */
    public Map<String, Object> createStockCount(Principal principal, Map<String, Object> payload) {
        // JS 1523: requireRole(user,["warehouse","commander","admin"]) — TASK-022 bổ sung.
        rbac.requireRole(principalAsCurrent(principal), List.of("warehouse", "commander", "admin"));
        String projectId = trim(payload.get("projectId"));
        String warehouseId = trim(payload.get("warehouseId"));
        List<?> rawLines = payload.get("lines") instanceof List<?> l ? l : List.of();
        // JS 1527: phạm vi DỰ ÁN kiểm trước khi tra kho.
        accessScope.requireProjectAccess(principal.userId(), principal.role(), projectId, true,
                "Tài khoản không có quyền kiểm kê tại dự án này.");
        Map<String, Object> warehouse = store.findWarehouseById(warehouseId).orElse(null);
        if (warehouse == null || !sv(warehouse, "projectId").equals(projectId) || rawLines.isEmpty())
            throw Api("Phiếu kiểm kê phải đúng dự án, kho và có dữ liệu đếm.");
        // JS 1532: phạm vi KHO kiểm sau khi đã xác nhận kho thuộc dự án.
        accessScope.requireWarehouseAccess(principal.userId(), principal.role(),
                principal.warehouseScopeKind(), warehouseId, true,
                "Tài khoản không có quyền kiểm kê kho này.");
        Instant now = Instant.now();
        int year = java.time.LocalDate.now().getYear();
        long seq = store.nextSequenceNo("KK:" + projectId + ":" + year, "KK", projectId, year, now);
        String countId = idGenerator.next("COUNT");
        // Kèm mã dự án: stock_counts_no_uidx unique TOÀN CỤC, sequence lại đếm theo (project, year).
        String countNo = "KK-" + sv(warehouse, "projectCode").toUpperCase() + "-" + year + "-"
                + String.format("%04d", seq);
        List<Map<String, Object>> items = new ArrayList<>();
        for (int index = 0; index < rawLines.size(); index++) {
            Map<String, Object> line = asMap(rawLines.get(index));
            String materialId = trim(line.get("materialId"));
            double actualQty = numberValue(line.get("actualQty"));
            double bookQty = store.stockBalance(warehouseId, materialId);
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", idGenerator.next("COUNTI"));
            item.put("materialId", materialId);
            item.put("bookQty", bookQty);
            item.put("actualQty", actualQty);
            item.put("variance", actualQty - bookQty);
            item.put("reason", nvl(line.get("reason")));
            items.add(item);
        }
        store.insertStockCount(countId, countNo, projectId, warehouseId,
                blankDefault(trim(payload.get("countType")), "periodic"), items, principal.userId(), now);
        return Map.of("message", "Đã lập " + countNo + "; chênh lệch đang chờ duyệt điều chỉnh.");
    }

    /** approve_stock_count — duyệt; ghi sổ adjustment ADJ theo variance. */
    public Map<String, Object> approveStockCount(Principal principal, Map<String, Object> payload) {
        // JS 1550: requireRole(user,["commander","project","admin"]) — TASK-022 bổ sung.
        rbac.requireRole(principalAsCurrent(principal), List.of("commander", "project", "admin"));
        String countId = trim(payload.get("countId"));
        Map<String, Object> count = store.findStockCount(countId)
                .orElseThrow(() -> Api("Phiếu kiểm kê không tồn tại hoặc đã xử lý."));
        if (!"pending_approval".equals(sv(count, "status")))
            throw Api("Phiếu kiểm kê không tồn tại hoặc đã xử lý.");
        // JS 1555/1557: kiểm phạm vi theo chính phiếu kiểm kê (không theo payload).
        accessScope.requireProjectAccess(principal.userId(), principal.role(), sv(count, "projectId"), true,
                "Tài khoản không có quyền duyệt kiểm kê tại dự án này.");
        accessScope.requireWarehouseAccess(principal.userId(), principal.role(),
                principal.warehouseScopeKind(), sv(count, "warehouseId"), true,
                "Tài khoản không có quyền duyệt kiểm kê tại kho này.");
        List<Map<String, Object>> items = new ArrayList<>();
        for (Map<String, Object> it : store.stockCountItems(countId)) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", sv(it, "id"));
            item.put("materialId", sv(it, "materialId"));
            item.put("variance", numberValue(ci(it, "varianceQty")));
            items.add(item);
        }
        store.approveStockCountAdjustments(countId, items, sv(count, "projectId"), sv(count, "warehouseId"),
                principal.userId(), Instant.now());
        return Map.of("message", "Đã duyệt kiểm kê và ghi sổ các điều chỉnh chênh lệch.");
    }

    // ============ Phase 6 còn lại ============
    /** reconcile_contract_stock — đối soát tồn vật lý vs tồn Contract theo từng vật tư. */
    public Map<String, Object> reconcileContractStock(Principal principal, Map<String, Object> payload) {
        rbac.requireRole(principalAsCurrent(principal), List.of("warehouse", "commander", "admin"));
        String projectId = trim(payload.get("projectId"));
        String warehouseId = trim(payload.get("warehouseId"));
        if (projectId.isEmpty() || warehouseId.isEmpty())
            throw Api("Đối soát cần chọn đúng một dự án và kho.");
        // JS 858: phạm vi ở mức ĐỌC (write=false) — đối soát không làm thay đổi dữ liệu.
        if (!accessScope.canAccessProject(principal.userId(), principal.role(), projectId, false)
                || !accessScope.canAccessWarehouse(principal.userId(), principal.role(),
                        principal.warehouseScopeKind(), warehouseId, false)) {
            throw Api("Không có quyền đối soát kho này.");
        }
        List<Map<String, Object>> rows = store.reconcilePhysicalVsContract(warehouseId, projectId);
        Instant now = Instant.now();
        int mismatch = 0;
        for (Map<String, Object> row : rows) {
            double diff = numberValue(ci(row, "differenceQty"));
            String status = Math.abs(diff) < 1e-7 ? "balanced" : "mismatch";
            if ("mismatch".equals(status)) mismatch++;
            Map<String, Object> rec = new LinkedHashMap<>();
            rec.put("projectId", projectId);
            rec.put("warehouseId", warehouseId);
            rec.put("materialId", sv(row, "materialId"));
            rec.put("physicalQty", numberValue(ci(row, "physicalQty")));
            rec.put("contractQty", numberValue(ci(row, "contractQty")));
            rec.put("differenceQty", diff);
            rec.put("status", status);
            store.insertReconciliation(rec, principal.userId(), nvl(payload.get("note")), now);
        }
        return Map.of("message", "Đã đối soát " + rows.size() + " mã; " + mismatch + " mã chênh lệch được ghi nhận.");
    }

    /** transfer_contract_ownership — chuyển ownership vật tư 1 kho giữa 2 Contract. */
    public Map<String, Object> transferContractOwnership(Principal principal, Map<String, Object> payload) {
        rbac.requireRole(principalAsCurrent(principal), List.of("commander", "project", "admin"));
        String projectId = trim(payload.get("projectId"));
        String warehouseId = trim(payload.get("warehouseId"));
        String materialId = trim(payload.get("materialId"));
        String sourceContractId = trim(payload.get("sourceContractId"));
        String destinationContractId = trim(payload.get("destinationContractId"));
        double qty = numberValue(payload.get("quantity"));
        String reason = trim(payload.get("reason"));
        if (projectId.isEmpty() || warehouseId.isEmpty() || materialId.isEmpty()
                || sourceContractId.isEmpty() || destinationContractId.isEmpty() || qty <= 0)
            throw Api("Chuyển ownership cần đủ kho, vật tư, Contract nguồn/đích hợp lệ và số lượng > 0.");
        // JS 855: JS gộp hai kiểm vào một thông điệp.
        if (!accessScope.canAccessProject(principal.userId(), principal.role(), projectId, true)
                || !accessScope.canAccessWarehouse(principal.userId(), principal.role(),
                        principal.warehouseScopeKind(), warehouseId, true)) {
            throw Api("Không có quyền tại dự án/kho này.");
        }
        if (sourceContractId.equals(destinationContractId)) throw Api("Contract nguồn và đích phải khác nhau.");
        Map<String, Object> source = store.findContractActive(sourceContractId).orElse(null);
        Map<String, Object> dest = store.findContractActive(destinationContractId).orElse(null);
        if (source == null || dest == null) throw Api("Contract nguồn/đích phải đang hoạt động.");
        double ownerQty = store.contractBalance(projectId, sourceContractId, warehouseId, materialId);
        if (qty > ownerQty + 1e-9)
            throw Api("Contract nguồn không đủ tồn kế toán tại kho để chuyển (còn " + ownerQty + ").");
        if (reason.isEmpty()) throw Api("Chuyển ownership bắt buộc nhập lý do.");
        Instant now = Instant.now();
        Map<String, Object> srcRow = new LinkedHashMap<>();
        srcRow.put("id", "CSL_" + java.util.UUID.randomUUID());
        srcRow.put("projectId", projectId);
        srcRow.put("contractId", sourceContractId);
        srcRow.put("warehouseId", warehouseId);
        srcRow.put("materialId", materialId);
        srcRow.put("movementType", "OWN_TRANSFER");
        srcRow.put("quantityDelta", -qty);
        srcRow.put("occurredAt", now);
        srcRow.put("referenceType", "contract_ownership_transfer");
        srcRow.put("referenceId", "");
        srcRow.put("referenceItemId", null);
        srcRow.put("counterpartyContractId", destinationContractId);
        srcRow.put("actorUserId", principal.userId());
        srcRow.put("note", reason);
        store.insertContractLedgerRow(srcRow, now);
        Map<String, Object> dstRow = new LinkedHashMap<>(srcRow);
        dstRow.put("id", "CSL_" + java.util.UUID.randomUUID());
        dstRow.put("contractId", destinationContractId);
        dstRow.put("quantityDelta", qty);
        dstRow.put("counterpartyContractId", sourceContractId);
        store.insertContractLedgerRow(dstRow, now);
        int year = java.time.LocalDate.now().getYear();
        String no = String.format("%06d", Long.parseLong(store.nextOwnershipTransferNo(year)));
        Map<String, Object> ot = new LinkedHashMap<>();
        ot.put("id", "OWN_" + java.util.UUID.randomUUID());
        ot.put("transferNo", "OWN-" + year + "-" + no);
        ot.put("warehouseId", warehouseId);
        ot.put("materialId", materialId);
        ot.put("sourceProjectId", projectId);
        ot.put("sourceContractId", sourceContractId);
        ot.put("destinationProjectId", projectId);
        ot.put("destinationContractId", destinationContractId);
        ot.put("quantity", qty);
        ot.put("reason", reason);
        ot.put("sourceReferenceType", "manual");
        ot.put("sourceReferenceId", "");
        ot.put("postedBy", principal.userId());
        store.recordOwnershipTransferLite(ot, now);
        return Map.of("message", "Đã chuyển ownership " + qty + " từ Contract nguồn sang Contract đích; sổ kế toán đã ghi song song.");
    }

    /** reverse_stock_movement — đảo giao dịch kho có lý do; chặn đảo giao dịch đã đảo. */
    public Map<String, Object> reverseStockMovement(Principal principal, Map<String, Object> payload) {
        rbac.requireRole(principalAsCurrent(principal), List.of("warehouse", "commander", "admin"));
        String movementId = trim(payload.get("movementId"));
        String reason = trim(payload.get("reason"));
        if (reason.isEmpty()) throw Api("Đảo giao dịch phải có lý do.");
        Map<String, Object> mov = store.findStockMovement(movementId)
                .orElseThrow(() -> Api("Không tìm thấy giao dịch kho."));
        if (!sv(mov, "reversal_of_id").isEmpty()) throw Api("Không được đảo một giao dịch đảo.");
        if (store.findReversal(movementId).isPresent()) throw Api("Giao dịch này đã được đảo trước đó.");
        // JS 1277: chỉ kiểm khi kho KHÁC RỖNG; findStockMovement dùng SELECT * nên khoá snake_case.
        String scopeFromWh = sv(mov, "from_warehouse_id");
        if (!scopeFromWh.isEmpty()) {
        accessScope.requireWarehouseAccess(principal.userId(), principal.role(),
                principal.warehouseScopeKind(), scopeFromWh, true,
                "Không có quyền tại kho nguồn.");
        }
        String scopeToWh = sv(mov, "to_warehouse_id");
        if (!scopeToWh.isEmpty()) {
        accessScope.requireWarehouseAccess(principal.userId(), principal.role(),
                principal.warehouseScopeKind(), scopeToWh, true,
                "Không có quyền tại kho đích.");
        }
        Instant now = Instant.now();
        Map<String, Object> reverse = new LinkedHashMap<>();
        reverse.put("id", "MOV_" + java.util.UUID.randomUUID());
        reverse.put("projectId", sv(mov, "project_id"));
        reverse.put("contractId", sv(mov, "contract_id").isEmpty() ? null : sv(mov, "contract_id"));
        reverse.put("destinationContractId", sv(mov, "destination_contract_id").isEmpty() ? sv(mov, "contract_id") : sv(mov, "destination_contract_id"));
        reverse.put("materialId", sv(mov, "material_id"));
        reverse.put("fromWarehouseId", sv(mov, "to_warehouse_id").isEmpty() ? null : sv(mov, "to_warehouse_id"));
        reverse.put("toWarehouseId", sv(mov, "from_warehouse_id").isEmpty() ? null : sv(mov, "from_warehouse_id"));
        reverse.put("movementType", "REV_" + sv(mov, "movement_type"));
        reverse.put("quantity", numberValue(ci(mov, "quantity")));
        reverse.put("unitCost", 0);
        reverse.put("occurredAt", now);
        reverse.put("referenceType", "reversal");
        reverse.put("referenceId", reason);
        reverse.put("postedBy", principal.userId());
        reverse.put("movementId", movementId);
        store.insertMovementReversal(reverse, now);
        String contractId = sv(mov, "contract_id");
        String fromWh = sv(mov, "from_warehouse_id"), toWh = sv(mov, "to_warehouse_id");
        String projectId = sv(mov, "project_id");
        String materialId = sv(mov, "material_id");
        double qty = numberValue(ci(mov, "quantity"));
        if (!contractId.isEmpty() && !projectId.isEmpty() && !fromWh.isEmpty() && !toWh.isEmpty()) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", "CSL_" + java.util.UUID.randomUUID());
            row.put("projectId", projectId);
            row.put("contractId", contractId);
            row.put("warehouseId", fromWh);
            row.put("materialId", materialId);
            row.put("movementType", "REV_" + sv(mov, "movement_type"));
            row.put("quantityDelta", qty);
            row.put("occurredAt", now);
            row.put("referenceType", "reversal");
            row.put("referenceId", movementId);
            row.put("referenceItemId", null);
            row.put("counterpartyContractId", null);
            row.put("actorUserId", principal.userId());
            row.put("note", reason);
            store.insertContractLedgerRow(row, now);
        }
        store.updateMovementReversalMarker(movementId, now);
        return Map.of("message", "Đã đảo giao dịch kho " + movementId + "; sổ vật lý và Ownership đã hoàn nguyên.");
    }

    // ---- helpers ----
    private static double numberValue(Object o) {
        try { return o == null ? 0 : Double.parseDouble(String.valueOf(o)); }
        catch (NumberFormatException e) { return 0; }
    }
    private static String sv(Map<String, Object> m, String k) {
        if (m == null) return "";
        Object v = m.get(k);
        if (v != null) return String.valueOf(v);
        for (Map.Entry<String, Object> e : m.entrySet())
            if (e.getKey().equalsIgnoreCase(k)) return String.valueOf(e.getValue());
        return "";
    }
    private static String trim(Object o) { return o == null ? "" : String.valueOf(o).trim(); }
    private static String nvl(Object o) { String s = trim(o); return s.isEmpty() ? null : s; }
    @SuppressWarnings("unchecked")
    private static Map<String, Object> asMap(Object o) { return o instanceof Map ? (Map<String, Object>) o : Map.of(); }
    private static AuthUseCase.ApiError Api(String message) { return new AuthUseCase.ApiError(message, 400); }

    private AuthUseCase.CurrentUser principalAsCurrent(Principal p) {
        return new AuthUseCase.CurrentUser(p.userId(), "", p.fullName(), null, p.role(), p.roleBase(), p.role(),
                p.warehouseScopeKind(), null, null, false);
    }
}