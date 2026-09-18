package com.vntech.erp.application.service;

import com.vntech.erp.application.port.out.IdGenerator;
import com.vntech.erp.application.port.out.PurchaseStore;
import com.vntech.erp.application.rbac.AccessScopeService;
import com.vntech.erp.application.rbac.RbacService;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Use-case mua hàng — port nguyên trạng create_po/close_po_line của monolith JS:
 * tách PO theo nhà cung cấp, sequence PO-<PROJECT>-<YEAR>-NNNN, MAR check, availability override,
 * procurement_allocations + supply_workflow_steps po_creation, đóng thiếu + shortage rollup.
 */
public final class PurchaseManagementUseCase {

    private final PurchaseStore store;
    private final IdGenerator idGenerator;
    private final RbacService rbac;
    private final AccessScopeService accessScope;

    public PurchaseManagementUseCase(PurchaseStore store, IdGenerator idGenerator, RbacService rbac, AccessScopeService accessScope) {
        this.store = store;
        this.idGenerator = idGenerator;
        this.rbac = rbac;
        this.accessScope = accessScope;
    }

    public interface Principal {
        String userId();
        String role();
        String fullName();
        String email();
        /**
         * Mã ENGINE (`role_catalog.base_role`) — giá trị THẬT SỰ dùng để phân quyền, đúng như
         * `effectiveRole(user)` của JS. Mặc định rơi về `role()` để tương thích ngược với mọi
         * tầng gọi chưa truyền giá trị này xuống.
         */
        default String roleBase() { return role(); }

        /** Loại phạm vi kho (role_catalog.warehouse_scope_kind: "site" | "central"); rỗng ⇒ coi như "site". */
        default String warehouseScopeKind() { return ""; }
    }

    private static final double EPS = 1e-9;

    public Map<String, Object> createPo(Principal principal, Map<String, Object> payload) {
        // SỬA LỖI VAI TRÒ: "procurement" bị canonicalRoleCode đổi thành "kh_nv" khi ghi vào DB
        // ⇒ mã cũ không bao giờ tồn tại ⇒ create_po bị khoá chết thành admin-only.
        rbac.requireRole(principalAsCurrent(principal), List.of("procurement", "admin"));
        String requestId = trim(payload.get("requestId"));
        String warehouseId = trim(payload.get("warehouseId"));
        String defaultEta = trim(payload.get("eta"));
        String defaultSupplierId = trim(payload.get("supplierId"));
        Map<String, Object> mr = store.findApprovedRequest(requestId)
                .orElseThrow(() -> Api("Chỉ được tạo PO từ MR đã duyệt đủ các cấp."));
        // JS 1283: phạm vi dự án lấy từ CHÍNH phiếu MR (không lấy từ payload).
        accessScope.requireProjectAccess(principal.userId(), principal.role(), sv(mr, "projectId"), true,
                "Tài khoản không có quyền mua hàng tại dự án này.");

        if (store.findWarehouse(warehouseId, sv(mr, "projectId")).isEmpty())
            throw Api("Kho nhận PO phải thuộc đúng dự án.");
        // JS 1284: phạm vi kho nhận PO — kiểm sau khi đã xác nhận kho thuộc dự án.
        accessScope.requireWarehouseAccess(principal.userId(), principal.role(),
                principal.warehouseScopeKind(), warehouseId, true,
                "Tài khoản không có quyền thao tác kho nhận PO này.");
        if (!store.supplierActive(defaultSupplierId) && trim(payload.get("lines")).isEmpty())
            throw Api("Nhà cung cấp không hợp lệ.");

        List<Map<String, Object>> sourceItems = store.requestSourceItems(requestId);
        Map<String, Map<String, Object>> sourceMap = new LinkedHashMap<>();
        for (Map<String, Object> row : sourceItems) sourceMap.put(sv(row, "id"), row);

        List<?> rawLines = payload.get("lines") instanceof List<?> l ? l : List.of();
        if (warehouseId.isEmpty() || rawLines.isEmpty())
            throw Api("PO phải có kho nhận và ít nhất một dòng mua hàng.");
        List<Map<String, Object>> normalized = new ArrayList<>();
        Map<String, Double> addedByItem = new LinkedHashMap<>();
        List<String> lineErrors = new ArrayList<>();
        for (int index = 0; index < rawLines.size(); index++) {
            Map<String, Object> line = asMap(rawLines.get(index));
            int excelLine = index + 1;
            String requestItemId = trim(line.get("requestItemId"));
            Map<String, Object> source = sourceMap.get(requestItemId);
            double qty = numberValue(line.get("quantity"));
            if (source == null || qty <= 0) {
                lineErrors.add("Dòng PO " + excelLine + " không hợp lệ.");
                continue;
            }
            String supplierId = trim(line.get("supplierId"));
            if (supplierId.isEmpty()) supplierId = defaultSupplierId;
            if (supplierId.isEmpty()) {
                lineErrors.add("Dòng PO " + excelLine + ": chưa chọn Nhà cung cấp.");
                continue;
            }
            String plannedDeliveryAt = trim(line.get("plannedDeliveryAt"));
            if (plannedDeliveryAt.isEmpty()) plannedDeliveryAt = defaultEta;
            if (!plannedDeliveryAt.matches("\\d{4}-\\d{2}-\\d{2}")) {
                lineErrors.add("Dòng PO " + excelLine + ": ngày giao dự kiến không hợp lệ.");
                continue;
            }
            double already = addedByItem.getOrDefault(requestItemId, 0.0) + qty;
            if (numberValue(ci(source, "orderedQty")) + already > numberValue(ci(source, "approvedQty")) + EPS) {
                lineErrors.add("Dòng PO " + excelLine + ": số lượng đặt vượt số đã được duyệt mua.");
                continue;
            }
            addedByItem.put(requestItemId, already);
            Map<String, Object> nl = new LinkedHashMap<>();
            nl.put("requestItemId", requestItemId);
            nl.put("qty", qty);
            nl.put("supplierId", supplierId);
            nl.put("plannedDeliveryAt", plannedDeliveryAt);
            String systemCode = trim(line.get("systemCode"));
            if (systemCode.isEmpty()) systemCode = String.valueOf(ci(source, "system") == null ? "KHAC" : ci(source, "system"));
            if (systemCode.isEmpty()) systemCode = "KHAC";
            nl.put("systemCode", systemCode);
            nl.put("contractId", ci(source, "contractId"));
            nl.put("boqVersionId", ci(source, "boqVersionId"));
            nl.put("boqItemId", ci(source, "boqItemId"));
            nl.put("materialId", ci(source, "materialId"));
            normalized.add(nl);
        }
        if (!lineErrors.isEmpty()) throw Api(String.join("\n", lineErrors));

        // MAR check: vật tư yêu cầu MAR nhưng chưa duyệt -> chặn
        List<String> materialIds = new ArrayList<>();
        for (Map<String, Object> line : normalized) {
            Map<String, Object> source = sourceMap.get(sv(line, "requestItemId"));
            String mid = String.valueOf(ci(source, "materialId") == null ? "" : ci(source, "materialId"));
            if (!materialIds.contains(mid)) materialIds.add(mid);
        }
        for (String mid : materialIds) {
            Map<String, Object> m = store.findMaterial(mid).orElse(Map.of());
            if (isOne(ci(m, "requiresMar"))) {
                Map<String, Object> mar = store.findMarApproval(sv(mr, "projectId"), mid).orElse(Map.of());
                if (!"approved".equals(sv(mar, "status")))
                    throw Api("Vật tư " + mid + " yêu cầu MAR nhưng chưa được phê duyệt. Hệ thống chặn lập PO.");
            }
            // availability override: tồn ở kho khác
            Map<String, Object> other = store.findOtherAvailableStock(mid, warehouseId).orElse(null);
            String overrideReason = trim(payload.get("availabilityOverrideReason"));
            if (other != null && overrideReason.isEmpty()) {
                double avail = numberValue(ci(other, "available"));
                throw Api("Trước khi mua mới phải xử lý tồn/điều chuyển: vật tư " + mid + " còn " + avail
                        + " tại " + sv(other, "name") + " (" + sv(other, "projectCode") + "). Hãy tạo Phiếu điều chuyển hoặc nhập lý do ngoại lệ được phê duyệt.");
            }
        }

        // tách theo supplier
        Map<String, List<Map<String, Object>>> groups = new LinkedHashMap<>();
        for (Map<String, Object> line : normalized) {
            groups.computeIfAbsent(sv(line, "supplierId"), k -> new ArrayList<>()).add(line);
        }
        Instant now = Instant.now();
        int year = LocalDate.now().getYear();
        List<String> poNos = new ArrayList<>();
        String firstPoId = "";
        boolean allOrdered = true;
        for (Map.Entry<String, List<Map<String, Object>>> entry : groups.entrySet()) {
            String supplierId = entry.getKey();
            List<Map<String, Object>> groupLines = entry.getValue();
            String seqKey = "PO:" + sv(mr, "projectId") + ":" + year;
            long seq = store.nextSequence(seqKey, "PO", sv(mr, "projectId"), year, now);
            String poId = idGenerator.next("PO");
            if (firstPoId.isEmpty()) firstPoId = poId;
            String poNo = "PO-" + sv(mr, "projectCode").toUpperCase() + "-" + year + "-" + String.format("%04d", seq);
            poNos.add(poNo);
            String eta = groupLines.stream().map(l -> sv(l, "plannedDeliveryAt")).sorted().findFirst().orElse(defaultEta);
            store.insertPurchaseOrderWithItems(poId, poNo, requestId, sv(mr, "projectId"),
                    nvl(mr.get("contractId")), nvl(mr.get("boqVersionId")), supplierId, warehouseId,
                    principal.userId(), eta, "pending_approval", groupLines, sv(mr, "projectId"),
                    sv(mr, "contractId"), sv(mr, "boqVersionId"), sv(mr, "requestNo"), now);
        }
        // cập nhật ordered_qty / line_status
        for (Map.Entry<String, Double> e : addedByItem.entrySet()) {
            Map<String, Object> source = sourceMap.get(e.getKey());
            double finalQty = numberValue(ci(source, "orderedQty")) + e.getValue();
            boolean complete = finalQty + EPS >= numberValue(ci(source, "approvedQty"));
            store.updateRequestItemOrdered(e.getKey(), e.getValue(), complete, now);
            if (!complete) allOrdered = false;
        }
        boolean willComplete = allOrdered;
        store.updateRequestSupplyStatus(requestId, willComplete ? "waiting_delivery" : "awaiting_po", now);
        long sla = store.supplyPoSlaHours();
        String comment = poNos.size() + " PO được phát hành";
        // bảo đảm step po_creation completed (nếu tồn tại pending) hoặc insert
        store.insertSupplyWorkflowStepPoCreation(requestId, firstPoId, comment, now, sla);
        if (!willComplete) {
            store.insertPendingPoCreationStep(requestId, sla, "Còn dòng chưa đặt đủ sau khi tách PO", now);
        }
        return Map.of("message", "Đã phát hành " + poNos.size() + " PO: " + String.join(", ", poNos) + ".",
                "poIds", List.of(firstPoId), "poNos", poNos);
    }

    /** close_po_line — đóng thiếu 1 dòng PO + shortage rollup lên MR/PO. */
    public Map<String, Object> closePoLine(Principal principal, Map<String, Object> payload) {
        rbac.requireRole(principalAsCurrent(principal), List.of("procurement", "project", "admin"));
        String poItemId = trim(payload.get("purchaseOrderItemId"));
        String reason = trim(payload.get("reason"));
        if (reason.isEmpty()) throw Api("Đóng thiếu phải có lý do được phê duyệt.");
        Map<String, Object> line = store.findPoLine(poItemId)
                .orElseThrow(() -> Api("Không tìm thấy dòng PO."));
        // JS 1305: phạm vi dự án lấy từ dòng PO.
        accessScope.requireProjectAccess(principal.userId(), principal.role(), sv(line, "projectId"), true,
                "Không có quyền tại dự án này.");

        double shortage = Math.max(0, numberValue(ci(line, "orderedQty"))
                - numberValue(ci(line, "deliveredQty")) - numberValue(ci(line, "closedQty")));
        if (shortage <= 0) throw Api("Dòng PO không còn số lượng thiếu để đóng.");
        Instant now = Instant.now();
        store.closePoLine(poItemId, shortage, reason, principal.userId(), now);
        store.closeRequestItemForShortage(sv(line, "requestItemId"), shortage, reason, now);
        if (store.countPoOpenLines(sv(line, "purchaseOrderId")) == 0)
            store.completePoWithShortage(sv(line, "purchaseOrderId"), now);
        if (store.countRequestOpenLines(sv(line, "requestId")) == 0)
            store.completeRequestWithShortage(sv(line, "requestId"), now);
        return Map.of("message", "Đã đóng thiếu " + shortage + " cho dòng PO; phiếu gốc vẫn giữ số lượng đề nghị và lý do chênh lệch.");
    }

    /** [WF] PHASE 8 (B2) — approve_po: PO đang pending_approval ⇒ waiting_delivery (nối luồng giao hàng sẵn có). */
public Map<String, Object> approvePo(Principal principal, Map<String, Object> payload) {
    return decidePo(principal, payload, true);
}

/** [WF] PHASE 8 (B2) — reject_po: PO ⇒ cancelled + lý do; **PR KHÔNG đổi**; THÔNG BÁO cho người tạo PO. */
public Map<String, Object> rejectPo(Principal principal, Map<String, Object> payload) {
    return decidePo(principal, payload, false);
}

private Map<String, Object> decidePo(Principal principal, Map<String, Object> payload, boolean approve) {
    rbac.requireRole(principalAsCurrent(principal), List.of("procurement", "accountant", "admin"));
    String poId = trim(payload.get("purchaseOrderId"));
    String reason = trim(payload.get("reason"));
    Map<String, Object> po = store.findPoForReceiving(poId)
        .orElseThrow(() -> Api("PO không tồn tại hoặc đã xử lý."));
    if (!"pending_approval".equals(sv(po, "status"))) throw Api("PO không tồn tại hoặc đã xử lý.");
    accessScope.requireProjectAccess(principal.userId(), principal.role(), sv(po, "projectId"), true,
        "Tài khoản không có quyền duyệt PO tại dự án này.");
    Instant now = Instant.now();
    String status = approve ? "waiting_delivery" : "cancelled";
    store.decidePo(poId, status, approve ? null : reason, principal.userId(), now);
    if (!approve) {
        String buyer = sv(po, "buyerUserId");
        if (!buyer.isEmpty()) store.insertTaskNotification(buyer, "PO " + sv(po, "poNo") + " đã bị hủy",
            "PO " + sv(po, "poNo") + " đã bị từ chối — hãy tạo lại/xử lý lại. Lý do: " + (reason.isEmpty() ? "(không nêu)" : reason), now);
    }
    return Map.of("message", approve
        ? "Đã duyệt PO " + sv(po, "poNo") + "; chuyển sang chờ giao hàng."
        : "Đã từ chối PO " + sv(po, "poNo") + "; PR vẫn mở để xử lý lại.");
}
/** receive_goods — ghi nhận giao hàng, chưa posting (chờ BCH xác nhận). */
    public Map<String, Object> receiveGoods(Principal principal, Map<String, Object> payload) {
        rbac.requireRole(principalAsCurrent(principal), List.of("warehouse", "admin"));
        String poId = trim(payload.get("purchaseOrderId"));
        List<?> rawLines = payload.get("lines") instanceof List<?> l ? l : List.of();
        Map<String, Object> po = store.findPoForReceiving(poId)
                .orElseThrow(() -> Api("Phiếu nhập cần PO và ít nhất một dòng nhận hàng."));
        if (rawLines.isEmpty()) throw Api("Phiếu nhập cần PO và ít nhất một dòng nhận hàng.");
        // JS 1319/1321: phạm vi dự án rồi phạm vi kho — đều lấy từ CHÍNH phiếu PO.
        accessScope.requireProjectAccess(principal.userId(), principal.role(), sv(po, "projectId"), true,
                "Tài khoản không có quyền giao nhận tại dự án này.");
        accessScope.requireWarehouseAccess(principal.userId(), principal.role(),
                principal.warehouseScopeKind(), sv(po, "warehouseId"), true,
                "Tài khoản không có quyền thao tác kho nhận hàng này.");

        List<Map<String, Object>> poItems = store.poItemsForReceiving(poId);
        Map<String, Map<String, Object>> map = new LinkedHashMap<>();
        for (Map<String, Object> row : poItems) map.put(sv(row, "id"), row);

        String certificateStatus = blankDefault(trim(payload.get("certificateStatus")), "missing");
        String deliveryDocumentStatus = blankDefault(trim(payload.get("deliveryDocumentStatus")), "missing");
        if (!List.of("complete", "missing", "not_required").contains(certificateStatus))
            throw Api("Trạng thái chứng chỉ không hợp lệ.");
        if (!List.of("complete", "missing").contains(deliveryDocumentStatus))
            throw Api("Trạng thái giấy tờ giao hàng không hợp lệ.");
        boolean documentsOk = "complete".equals(deliveryDocumentStatus);
        boolean qcOk = payload.get("qcOk") == Boolean.TRUE || "true".equals(trim(payload.get("qcOk")));

        Instant now = Instant.now();
        String receiptId = idGenerator.next("GRN");
        int year = LocalDate.now().getYear();
        long seq = store.nextSequence("GRN:" + sv(po, "projectId") + ":" + year, "GRN", sv(po, "projectId"), year, now);
        String receiptNo = "GRN-" + sv(po, "projectCode").toUpperCase() + "-" + year + "-" + String.format("%04d", seq);

        Map<String, Double> acceptedByItem = new LinkedHashMap<>();
        List<Map<String, Object>> items = new ArrayList<>();
        for (Object o : rawLines) {
            Map<String, Object> line = asMap(o);
            String itemId = trim(line.get("purchaseOrderItemId"));
            Map<String, Object> source = map.get(itemId);
            double actualQty = numberValue(line.get("quantity"));
            if (source == null || actualQty <= 0 || acceptedByItem.containsKey(itemId))
                throw Api("Dòng giao hàng thực tế không hợp lệ hoặc bị trùng.");
            double remaining = Math.max(0, numberValue(ci(source, "orderedQty"))
                    - numberValue(ci(source, "deliveredQty")) - numberValue(ci(source, "closedQty")));
            double accepted = qcOk ? Math.min(actualQty, remaining) : 0;
            acceptedByItem.put(itemId, accepted);
            Map<String, Object> itemMap = new LinkedHashMap<>();
            itemMap.put("purchaseOrderItemId", source.get("id"));
            itemMap.put("contractId", ci(source, "contractId"));
            itemMap.put("boqVersionId", ci(source, "boqVersionId"));
            itemMap.put("boqItemId", ci(source, "boqItemId"));
            itemMap.put("materialId", ci(source, "materialId"));
            itemMap.put("requestItemId", ci(source, "requestItemId"));
            itemMap.put("actualQty", actualQty);
            itemMap.put("acceptedQty", accepted);
            itemMap.put("rejectedQty", actualQty - accepted);
            itemMap.put("lotNo", nvl(line.get("lotNo")));
            itemMap.put("qcResult", qcOk ? (accepted < actualQty ? "accepted_with_variance" : "accepted") : "rejected");
            items.add(itemMap);
        }
        boolean isFullyDelivered = true;
        boolean hasAnyAccepted = false;
        for (Map<String, Object> item : poItems) {
            double accepted = acceptedByItem.getOrDefault(sv(item, "id"), 0.0);
            if (numberValue(ci(item, "deliveredQty")) + accepted + numberValue(ci(item, "closedQty")) < numberValue(ci(item, "orderedQty")) - 1e-9)
                isFullyDelivered = false;
            if (numberValue(ci(item, "deliveredQty")) + accepted > 0) hasAnyAccepted = true;
        }
        String nextStatus = isFullyDelivered ? "delivered_pending_confirmation"
                : hasAnyAccepted ? "partial_delivery" : "waiting_delivery";
        Map<String, Object> header = new LinkedHashMap<>();
        header.put("id", receiptId);
        header.put("receiptNo", receiptNo);
        header.put("purchaseOrderId", poId);
        header.put("contractId", nvl(po.get("contractId")));
        header.put("boqVersionId", nvl(po.get("boqVersionId")));
        header.put("warehouseId", sv(po, "warehouseId"));
        header.put("receivedBy", principal.userId());
        header.put("receivedAt", now);
        header.put("deliveryNoteNo", nvl(payload.get("deliveryNoteNo")));
        header.put("qcStatus", qcOk ? "accepted" : "rejected");
        header.put("documentStatus", documentsOk ? "complete" : "missing");
        header.put("certificateStatus", certificateStatus);
        header.put("deliveryDocumentStatus", deliveryDocumentStatus);
        header.put("projectId", sv(po, "projectId"));
        store.insertGoodsReceipt(header, items, now);
        store.updatePoStatusAndMr(poId, nextStatus, isFullyDelivered, sv(po, "requestId"),
                isFullyDelivered ? "awaiting_bch_confirmation" : "partial_delivery", now);
        long sla = store.supplyPoSlaHours();
        store.insertBchConfirmationStep(sv(po, "requestId"), poId, receiptId, now, sla);
        return Map.of("message", receiptNo + " đã ghi nhận giao hàng; đơn chuyển sang chờ BCH kiểm tra ảnh và xác nhận.");
    }

    /** confirm_delivery — BCH xác nhận; posting nhập kho + contract ledger nếu QC accepted. */
    public Map<String, Object> confirmDelivery(Principal principal, Map<String, Object> payload) {
        rbac.requireRole(principalAsCurrent(principal), List.of("commander", "project", "admin"));
        String receiptId = trim(payload.get("receiptId"));
        Map<String, Object> receipt = store.findReceiptInfo(receiptId)
                .orElseThrow(() -> Api("Chuyến giao không tồn tại hoặc đã được BCH xác nhận."));
        if (!"pending".equals(sv(receipt, "confirmationStatus")))
            throw Api("Chuyến giao không tồn tại hoặc đã được BCH xác nhận.");
        // JS 1388/1390: phạm vi dự án rồi phạm vi kho — trước kiểm ảnh, đúng thứ tự JS.
        accessScope.requireProjectAccess(principal.userId(), principal.role(), sv(receipt, "projectId"), true,
                "Tài khoản không có quyền xác nhận tại dự án này.");
        accessScope.requireWarehouseAccess(principal.userId(), principal.role(),
                principal.warehouseScopeKind(), sv(receipt, "warehouseId"), true,
                "Tài khoản không có quyền xác nhận tại kho này.");

        if (store.goodsReceiptImageCount(receiptId) < 1)
            throw Api("Phải tải ít nhất một ảnh giao hàng thực tế trước khi BCH xác nhận.");
        String certificateStatus = trim(payload.get("certificateStatus"));
        String deliveryDocumentStatus = trim(payload.get("deliveryDocumentStatus"));
        if (!List.of("complete", "missing", "not_required").contains(certificateStatus))
            throw Api("BCH phải xác nhận trạng thái chứng chỉ/CO-CQ.");
        if (!List.of("complete", "missing").contains(deliveryDocumentStatus))
            throw Api("BCH phải xác nhận tình trạng giấy giao hàng kèm theo.");
        if (!"complete".equals(deliveryDocumentStatus))
            throw Api("Thiếu giấy giao hàng/biên bản bắt buộc; không được xác nhận nhập kho.");
        boolean documentsOk = "complete".equals(deliveryDocumentStatus);
        Instant now = Instant.now();
        store.updateReceiptConfirmed(receiptId, certificateStatus, deliveryDocumentStatus, documentsOk,
                principal.userId(), nvl(payload.get("comment")), now);
        store.completeBchConfirmationStep(receiptId, principal.userId(),
                blankDefault(trim(payload.get("comment")), "BCH đã xác nhận giao hàng"), now);

        List<Map<String, Object>> receiptItems = store.receiptItems(receiptId);
        double currentAccepted = receiptItems.stream()
                .mapToDouble(i -> numberValue(ci(i, "acceptedQty"))).sum();
        Map<String, Object> poTotals = store.poTotals(sv(receipt, "purchaseOrderId")).orElse(Map.of());
        Map<String, Object> requestTotals = store.requestTotals(sv(receipt, "requestId")).orElse(Map.of());
        long otherPending = store.countPendingReceipts(sv(receipt, "purchaseOrderId"), receiptId);
        long otherExceptions = store.countConfirmedReceiptExceptions(sv(receipt, "purchaseOrderId"), receiptId);
        long requestExceptions = store.countRequestReceiptExceptions(sv(receipt, "requestId"), receiptId);
        boolean fullyDelivered = numberValue(ci(poTotals, "receivedQty")) + currentAccepted
                + numberValue(ci(poTotals, "closedQty")) >= numberValue(ci(poTotals, "orderedQty")) - 1e-9;
        boolean hasAccepted = numberValue(ci(poTotals, "receivedQty")) + currentAccepted > 0;
        boolean allConfirmed = otherPending == 0;
        boolean hasExceptions = otherExceptions > 0 || !documentsOk;
        boolean completed = fullyDelivered && allConfirmed;
        String nextStatus = completed ? (hasExceptions ? "completed_with_exceptions" : "completed")
                : fullyDelivered ? "delivered_pending_confirmation"
                : hasAccepted ? "partial_delivery" : "waiting_delivery";
        boolean requestCompleted = numberValue(ci(requestTotals, "receivedQty")) + currentAccepted
                + numberValue(ci(requestTotals, "closedQty")) >= numberValue(ci(requestTotals, "approvedQty")) - 1e-9;
        boolean requestHasExceptions = requestExceptions > 0 || !documentsOk;
        String nextRequestStatus = requestCompleted
                ? (requestHasExceptions ? "received_full_docs_pending" : "completed") : "partial_delivery";
        store.updatePoReceivedStatus(sv(receipt, "purchaseOrderId"), nextStatus, now);
        store.updateMrReceivedStatus(sv(receipt, "requestId"), nextRequestStatus, now);
        // posting: nếu QC accepted -> nhập kho + contract ledger
        if ("accepted".equals(sv(receipt, "qcStatus")) && !"posted".equals(sv(receipt, "postingStatus"))) {
            store.postGoodsReceipt(receiptId, sv(receipt, "poNo"), principal.userId(), now);
        }
        return Map.of("message", completed
                ? "BCH đã xác nhận " + sv(receipt, "receiptNo") + "; quy trình PO đã kết thúc"
                  + (hasExceptions ? " nhưng còn cảnh báo thiếu hồ sơ" : " đầy đủ") + "."
                : "BCH đã xác nhận " + sv(receipt, "receiptNo") + "; PO tiếp tục chờ giao phần còn thiếu.");
    }

    // ---- helpers ----
    private static Object ci(Map<String, Object> m, String key) {
        if (m == null) return null;
        Object v = m.get(key);
        if (v != null) return v;
        for (Map.Entry<String, Object> e : m.entrySet())
            if (e.getKey().equalsIgnoreCase(key)) return e.getValue();
        return null;
    }
    private static String sv(Object o, String fallback) {
        return o == null || o.toString().isBlank() ? fallback : o.toString();
    }
    private static String sv(Map<String, Object> m, String k) {
        Object v = ci(m, k);
        return v == null ? "" : String.valueOf(v);
    }
    private static String trim(Object o) { return o == null ? "" : String.valueOf(o).trim(); }
    private static String nvl(Object o) { String s = trim(o); return s.isEmpty() ? null : s; }
    private static String blankDefault(String s, String fallback) { return s.isEmpty() ? fallback : s; }
    private static boolean isOne(Object o) { return o instanceof Number n ? n.intValue() == 1 : Boolean.TRUE.equals(o); }
    private static double numberValue(Object o) {
        try { return o == null ? 0 : Double.parseDouble(String.valueOf(o)); }
        catch (NumberFormatException e) { return 0; }
    }
    @SuppressWarnings("unchecked")
    private static Map<String, Object> asMap(Object o) { return o instanceof Map ? (Map<String, Object>) o : Map.of(); }
    private static AuthUseCase.ApiError Api(String message) { return new AuthUseCase.ApiError(message, 400); }

    private AuthUseCase.CurrentUser principalAsCurrent(Principal p) {
        return new AuthUseCase.CurrentUser(p.userId(), "", p.fullName(), p.email(), p.role(), p.roleBase(), p.role(),
                p.warehouseScopeKind(), null, null, false);
    }
}