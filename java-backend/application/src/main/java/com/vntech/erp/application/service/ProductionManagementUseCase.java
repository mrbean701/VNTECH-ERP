package com.vntech.erp.application.service;

import com.vntech.erp.application.port.out.IdGenerator;
import com.vntech.erp.application.port.out.ProductionStore;
import com.vntech.erp.application.rbac.AccessScopeService;
import com.vntech.erp.application.rbac.RbacService;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * Use-case Sản lượng & Thu hồi vốn — port nguyên trạng save/approve_production_report,
 * save/delete_capital_recovery, save/delete_contract_payment của monolith JS.
 * RecoveryChainEngine: Sản lượng → Hồ sơ → Duyệt → Hóa đơn → Tiền thực thu.
 */
public final class ProductionManagementUseCase {

    private final ProductionStore store;
    private final IdGenerator idGenerator;
    private final RbacService rbac;
    private final AccessScopeService accessScope;

    public ProductionManagementUseCase(ProductionStore store, IdGenerator idGenerator, RbacService rbac, AccessScopeService accessScope) {
        this.store = store;
        this.idGenerator = idGenerator;
        this.rbac = rbac;
        this.accessScope = accessScope;
    }

    public interface Principal {
        String userId();
        String role();
        /**
         * Mã ENGINE (`role_catalog.base_role`) — giá trị THẬT SỰ dùng để phân quyền, đúng như
         * `effectiveRole(user)` của JS. Mặc định rơi về `role()` để tương thích ngược với mọi
         * tầng gọi chưa truyền giá trị này xuống.
         */
        default String roleBase() { return role(); }
    }

    // ============ production reports ============
    public Map<String, Object> saveProductionReport(Principal principal, Map<String, Object> payload) {
        String reportId = trim(payload.get("productionReportId"));
        String projectId = trim(payload.get("projectId"));
        // JS 1190.
        accessScope.requireProjectAccess(principal.userId(), principal.role(), projectId, true,
                "Không có quyền cập nhật sản lượng tại dự án này.");
        String reportPeriod = trim(payload.get("reportPeriod"));
        String referenceNo = nvl(payload.get("referenceNo"));
        String description = nvl(payload.get("description"));
        double plannedValue = strictNonNegative(payload.get("plannedValue"), "Giá trị kế hoạch");
        double actualValue = strictNonNegative(payload.get("actualValue"), "Giá trị sản lượng thực tế");
        if (projectId.isEmpty() || !reportPeriod.matches("\\d{4}-\\d{2}"))
            throw Api("Báo cáo sản lượng phải có dự án và kỳ YYYY-MM.");
        Instant now = Instant.now();
        if (!reportId.isEmpty()) {
            Map<String, Object> old = store.findProductionReport(reportId)
                    .orElseThrow(() -> Api("Không tìm thấy báo cáo sản lượng."));
            if (!sv(old, "project_id").equals(projectId))
                throw Api("Không được chuyển báo cáo sang dự án khác.");
            if ("approved".equals(sv(old, "status")) && !"admin".equals(principal.role()))
                throw Api("Báo cáo đã duyệt; chỉ Quản trị được phép mở lại/sửa.");
            if (store.productionReportPeriodDuplicate(projectId, reportPeriod, reportId))
                throw Api("Dự án đã có báo cáo sản lượng cho kỳ này.");
            store.updateProductionReport(reportId, reportPeriod, referenceNo, description,
                    plannedValue, actualValue, principal.userId(), false, now);
            return Map.of("message", "Đã cập nhật báo cáo sản lượng để Phòng Dự án kiểm tra/phê duyệt.");
        }
        if (store.productionReportPeriodDuplicate(projectId, reportPeriod, ""))
            throw Api("Dự án đã có báo cáo sản lượng cho kỳ này.");
        store.insertProductionReport(idGenerator.next("PRD"), projectId, reportPeriod, referenceNo, description,
                plannedValue, actualValue, principal.userId(), now);
        return Map.of("message", "Đã ghi nhận báo cáo sản lượng tháng; không lấy số xuất kho làm sản lượng.");
    }

    public Map<String, Object> approveProductionReport(Principal principal, Map<String, Object> payload) {
        String reportId = trim(payload.get("productionReportId"));
        double approvedValue = strictNonNegative(payload.get("approvedValue"), "Giá trị sản lượng được duyệt");
        Map<String, Object> old = store.findProductionReport(reportId)
                .orElseThrow(() -> Api("Không tìm thấy báo cáo sản lượng."));
        // JS 1195: phạm vi dự án của CHÍNH báo cáo.
        accessScope.requireProjectAccess(principal.userId(), principal.role(), sv(old, "project_id"), true,
                "Không có quyền tại dự án này.");
        if (approvedValue > num(old.get("actual_value") == null ? 0 : old.get("actual_value")))
            throw Api("Sản lượng được duyệt không được vượt sản lượng thực tế đã báo cáo.");
        store.approveProductionReport(reportId, approvedValue, principal.userId(), Instant.now());
        return Map.of("message", "Đã phê duyệt sản lượng. Giá trị này là nguồn chuẩn cho thu hồi vốn/KPI.");
    }

    // ============ capital recovery ============
    public Map<String, Object> saveCapitalRecovery(Principal principal, Map<String, Object> payload) {
        String recoveryId = trim(payload.get("recoveryId"));
        String projectId = trim(payload.get("projectId"));
        // JS 1214.
        accessScope.requireProjectAccess(principal.userId(), principal.role(), projectId, true,
                "Không có quyền cập nhật thu hồi vốn tại dự án này.");
        String periodKey = trim(payload.get("periodKey"));
        String referenceNo = nvl(payload.get("referenceNo"));
        String productionReportId = nvl(payload.get("productionReportId"));
        double submittedValue = strictNonNegative(payload.get("submittedValue"), "Giá trị hồ sơ trình");
        double approvedValue = strictNonNegative(payload.get("approvedValue"), "Giá trị được duyệt");
        double invoiceValue = strictNonNegative(payload.get("invoiceValue"), "Giá trị hóa đơn");
        String invoiceNo = nvl(payload.get("invoiceNo"));
        String dueDate = nvl(payload.get("dueDate"));
        String note = nvl(payload.get("note"));
        if (projectId.isEmpty() || !periodKey.matches("\\d{4}-\\d{2}"))
            throw Api("Thu hồi vốn phải có dự án và kỳ YYYY-MM.");
        if (approvedValue > submittedValue)
            throw Api("Giá trị được duyệt không được vượt giá trị hồ sơ đã trình.");
        if (invoiceValue > approvedValue)
            throw Api("Giá trị hóa đơn không được vượt giá trị đã được duyệt.");
        if (dueDate != null && !dueDate.matches("\\d{4}-\\d{2}-\\d{2}"))
            throw Api("Hạn thanh toán phải theo định dạng DD/MM/YYYY.");
        if (productionReportId != null && store.findApprovedProductionReport(productionReportId, projectId).isEmpty())
            throw Api("Báo cáo sản lượng không thuộc dự án đang chọn hoặc chưa phê duyệt.");
        String status = invoiceValue > 0 ? "invoiced" : approvedValue > 0 ? "approved"
                : submittedValue > 0 ? "submitted" : "preparing";
        Instant now = Instant.now();
        if (!recoveryId.isEmpty()) {
            Map<String, Object> old = store.findCapitalRecovery(recoveryId)
                    .orElseThrow(() -> Api("Không tìm thấy hồ sơ thu hồi vốn."));
            if (!sv(old, "project_id").equals(projectId))
                throw Api("Không được chuyển hồ sơ sang dự án khác.");
            store.updateCapitalRecovery(recoveryId, periodKey, referenceNo, productionReportId,
                    submittedValue, approvedValue, invoiceNo, invoiceValue, dueDate, status, note, now);
            return Map.of("message", "Đã cập nhật chuỗi thu hồi vốn.");
        }
        store.insertCapitalRecovery(idGenerator.next("REC"), projectId, periodKey, referenceNo, productionReportId,
                submittedValue, approvedValue, invoiceNo, invoiceValue, dueDate, status, note,
                principal.userId(), now);
        return Map.of("message", "Đã tạo hồ sơ thu hồi vốn theo chuỗi Sản lượng → Hồ sơ → Duyệt → Hóa đơn → Tiền thực thu.");
    }

    public Map<String, Object> deleteCapitalRecovery(Principal principal, Map<String, Object> payload) {
        String recoveryId = trim(payload.get("recoveryId"));
        Map<String, Object> old = store.findCapitalRecovery(recoveryId)
                .orElseThrow(() -> Api("Không tìm thấy hồ sơ thu hồi vốn."));
        // JS 1222: phạm vi dự án của CHÍNH hồ sơ.
        accessScope.requireProjectAccess(principal.userId(), principal.role(), sv(old, "project_id"), true,
                "Không có quyền tại dự án này.");
        if (store.countRecoveryPayments(recoveryId) > 0)
            throw Api("Hồ sơ đã có tiền thực thu liên kết nên không được xóa.");
        store.deleteCapitalRecovery(recoveryId);
        return Map.of("message", "Đã xóa hồ sơ thu hồi vốn chưa phát sinh tiền thu.");
    }

    // ============ contract payments ============
    public Map<String, Object> saveContractPayment(Principal principal, Map<String, Object> payload) {
        String paymentId = trim(payload.get("paymentId"));
        String projectId = trim(payload.get("projectId"));
        // JS 1226.
        accessScope.requireProjectAccess(principal.userId(), principal.role(), projectId, true,
                "Không có quyền cập nhật thanh toán tại dự án này.");
        String recoveryRecordId = nvl(payload.get("recoveryRecordId"));
        String paymentDate = trim(payload.get("paymentDate"));
        String referenceNo = nvl(payload.get("referenceNo"));
        String description = trim(payload.get("description"));
        double amount = strictNonNegative(payload.get("amount"), "Giá trị thanh toán");
        String note = nvl(payload.get("note"));
        if (projectId.isEmpty() || !paymentDate.matches("\\d{4}-\\d{2}-\\d{2}") || description.isEmpty())
            throw Api("Thanh toán phải có dự án, ngày thanh toán và nội dung.");
        if (recoveryRecordId != null && store.findRecoveryForPayment(recoveryRecordId, projectId).isEmpty())
            throw Api("Hồ sơ thu hồi vốn không thuộc dự án đang chọn.");
        Instant now = Instant.now();
        if (!paymentId.isEmpty()) {
            Map<String, Object> old = store.findContractPayment(paymentId)
                    .orElseThrow(() -> Api("Không tìm thấy dòng thanh toán."));
            if (!sv(old, "project_id").equals(projectId))
                throw Api("Không được chuyển dòng thanh toán sang dự án khác.");
            store.updateContractPayment(paymentId, recoveryRecordId, paymentDate, referenceNo, description,
                    amount, note, now);
            return Map.of("message", "Đã cập nhật tiền thực thu/Thanh toán HĐ.");
        }
        store.insertContractPayment(idGenerator.next("PAY"), projectId, recoveryRecordId, paymentDate,
                referenceNo, description, amount, note, principal.userId(), now);
        return Map.of("message", "Đã ghi nhận tiền thực thu/Thanh toán HĐ.");
    }

    public Map<String, Object> deleteContractPayment(Principal principal, Map<String, Object> payload) {
        String paymentId = trim(payload.get("paymentId"));
        // JS 1235: tra bản ghi CŨ rồi kiểm phạm vi dự án của chính bản ghi đó.
        Map<String, Object> oldPayment = store.findContractPayment(paymentId)
                .orElseThrow(() -> Api("Không tìm thấy dòng thanh toán."));
        accessScope.requireProjectAccess(principal.userId(), principal.role(), sv(oldPayment, "project_id"), true,
                "Không có quyền tại dự án này.");
        store.deleteContractPayment(paymentId);
        return Map.of("message", "Đã xóa dòng thanh toán.");
    }

    /** import_contract_payments — nhập hàng loạt dòng thanh toán HĐ (≤5000). */
    public Map<String, Object> importContractPayments(Principal principal, Map<String, Object> payload) {
        String projectId = trim(payload.get("projectId"));
        List<?> rows = payload.get("rows") instanceof List<?> l ? l : List.of();
        if (projectId.isEmpty() || rows.isEmpty()) throw Api("File thanh toán không có dữ liệu.");
        // JS 1232.
        accessScope.requireProjectAccess(principal.userId(), principal.role(), projectId, true,
                "Không có quyền cập nhật thanh toán tại dự án này.");
        if (rows.size() > 5000) throw Api("Mỗi lần chỉ nhập tối đa 5.000 dòng thanh toán.");
        Instant now = Instant.now();
        for (int i = 0; i < rows.size(); i++) {
            Map<String, Object> row = asMap(rows.get(i));
            int rowNo = i + 1;
            String paymentDate = trim(row.get("paymentDate"));
            String description = trim(row.get("description"));
            double amount = strictNonNegative(row.get("amount"), "Dòng " + rowNo + ": Giá trị thanh toán");
            if (!paymentDate.matches("\\d{4}-\\d{2}-\\d{2}") || description.isEmpty())
                throw Api("Dòng " + rowNo + ": thiếu ngày thanh toán hoặc nội dung.");
            store.insertPaymentBulk(idGenerator.next("PAY"), projectId, paymentDate, nvl(row.get("referenceNo")),
                    description, amount, nvl(row.get("note")), principal.userId(), now);
        }
        return Map.of("message", "Đã nhập " + rows.size() + " dòng thanh toán HĐ.");
    }

    /** save_team_subcontract — HĐ giao khoán độc lập với HĐ chính dự án. */
    public Map<String, Object> saveTeamSubcontract(Principal principal, Map<String, Object> payload) {
        // [P-09/TASK-117] Giữ mã ENGINE (commander/project) ĐỂ TƯƠNG THÍCH NGƯỢC + thêm mã CHỨC DANH THẬT
        // của role_catalog (cht→commander, da_nv/da_truong→project). RbacService.requireRole so với
        // CẢ role() và roleBase(); khi roleBase rỗng thì rơi về role() (mã chức danh) nên thiếu mã chức
        // danh = từ chối oan. Nguồn mã: `SELECT code, base_role FROM role_catalog` (MySQL thật).
        rbac.requireRole(principalAsCurrent(principal), List.of("admin", "commander", "cht", "project", "da_nv", "da_truong"));
        String projectId = trim(payload.get("projectId"));
        // JS 1238.
        accessScope.requireProjectAccess(principal.userId(), principal.role(), projectId, true,
                "Không có quyền tại dự án này.");
        String teamId = trim(payload.get("teamId"));
        String contractNo = trim(payload.get("contractNo")).toUpperCase();
        String contractName = trim(payload.get("contractName"));
        String scopeText = nvl(payload.get("scopeText"));
        double contractValue = strictNonNegative(payload.get("contractValue"), "Giá trị giao khoán");
        if (store.findTeam(teamId, projectId).isEmpty() || contractNo.isEmpty() || contractName.isEmpty())
            throw Api("Hợp đồng giao khoán phải chọn đúng tổ đội, có số và tên hợp đồng.");
        if (store.findSubcontractNoDuplicate(projectId, contractNo).isPresent())
            throw Api("Số hợp đồng giao khoán đã tồn tại trong dự án.");
        store.insertTeamSubcontract(idGenerator.next("TSC"), projectId, teamId, contractNo, contractName,
                scopeText, contractValue, nvl(payload.get("startDate")), nvl(payload.get("endDate")),
                nvl(payload.get("note")), principal.userId(), Instant.now());
        return Map.of("message", "Đã lập HĐ giao khoán " + contractNo + "; nghiệp vụ độc lập với HĐ chính dự án.");
    }

    /** save_team_production — ghi sản lượng tổ đội; chống vượt lũy kế HĐ giao khoán. */
    public Map<String, Object> saveTeamProduction(Principal principal, Map<String, Object> payload) {
        // [P-09/TASK-117] ENGINE + mã CHỨC DANH THẬT (xem chú thích ở saveTeamSubcontract).
        rbac.requireRole(principalAsCurrent(principal), List.of("admin", "commander", "cht", "project", "da_nv", "da_truong"));
        String projectId = trim(payload.get("projectId"));
        String subcontractId = trim(payload.get("subcontractId"));
        String periodKey = trim(payload.get("periodKey"));
        String referenceNo = nvl(payload.get("referenceNo"));
        String description = trim(payload.get("description"));
        double submittedValue = strictNonNegative(payload.get("submittedValue"), "Giá trị trình");
        double approvedValue = strictNonNegative(payload.get("approvedValue"), "Giá trị duyệt");
        if (approvedValue > submittedValue + 1e-9)
            throw Api("Sản lượng duyệt không được vượt giá trị trình.");
        Map<String, Object> sc = store.findSubcontract(subcontractId).orElse(null);
        // JS 1241: gộp kiểm tồn tại + phạm vi vào cùng một thông điệp như JS.
        if (sc == null || !sv(sc, "projectId").equals(projectId)
                || !accessScope.canAccessProject(principal.userId(), principal.role(), projectId, true))
            throw Api("Hợp đồng giao khoán không thuộc phạm vi dự án.");
        double accumulated = store.sumApprovedProduction(subcontractId, "");
        if (accumulated + approvedValue > num(sc.get("contractValue")) + 1e-9)
            throw Api("Lũy kế sản lượng duyệt vượt giá trị HĐ giao khoán.");
        store.insertTeamProduction(idGenerator.next("TPR"), projectId, sv(sc, "teamId"), subcontractId,
                periodKey, referenceNo, description, submittedValue, approvedValue, principal.userId(), Instant.now());
        return Map.of("message", "Đã ghi nhận sản lượng tổ đội; chờ duyệt.");
    }

    /** approve_team_production — duyệt; kiểm lại lũy kế (trừ record hiện tại). */
    public Map<String, Object> approveTeamProduction(Principal principal, Map<String, Object> payload) {
        // [P-09/TASK-117] ENGINE + mã CHỨC DANH THẬT (xem chú thích ở saveTeamSubcontract).
        rbac.requireRole(principalAsCurrent(principal), List.of("admin", "commander", "cht", "project", "da_nv", "da_truong"));
        String productionId = trim(payload.get("productionId"));
        Map<String, Object> rec = store.findTeamProduction(productionId).orElse(null);
        if (rec == null || !"submitted".equals(sv(rec, "status")))
            throw Api("Hồ sơ sản lượng không còn ở trạng thái chờ duyệt.");
        // JS 1244: phạm vi dự án lấy từ CHÍNH hồ sơ sản lượng.
        accessScope.requireProjectAccess(principal.userId(), principal.role(), sv(rec, "project_id"), true,
                "Không có quyền tại dự án này.");

        Map<String, Object> sc = store.findSubcontract(sv(rec, "subcontract_id")).orElse(Map.of());
        double acc = store.sumApprovedProduction(sv(rec, "subcontract_id"), productionId);
        if (acc + num(rec.get("approved_value")) > num(sc.get("contractValue")) + 1e-9)
            throw Api("Lũy kế sản lượng duyệt vượt giá trị HĐ giao khoán.");
        store.approveTeamProduction(productionId, principal.userId(), Instant.now());
        return Map.of("message", "Đã duyệt sản lượng tổ đội.");
    }

    /** save_team_payment — thanh toán tổ đội (progress/advance); chặn vượt sản lượng duyệt. */
    public Map<String, Object> saveTeamPayment(Principal principal, Map<String, Object> payload) {
        // [P-09/TASK-117] ENGINE + mã CHỨC DANH THẬT (xem chú thích ở saveTeamSubcontract).
        rbac.requireRole(principalAsCurrent(principal), List.of("admin", "commander", "cht", "accountant", "project", "da_nv", "da_truong"));
        String projectId = trim(payload.get("projectId"));
        String subcontractId = trim(payload.get("subcontractId"));
        double amount = strictNonNegative(payload.get("amount"), "Số tiền thanh toán");
        String paymentDate = trim(payload.get("paymentDate"));
        String paymentType = trim(payload.get("paymentType"));
        if (paymentType.isEmpty()) paymentType = "progress";
        String description = trim(payload.get("description"));
        Map<String, Object> sc = store.findSubcontract(subcontractId).orElse(null);
        // JS 1247: gộp kiểm tồn tại + phạm vi vào cùng một thông điệp như JS.
        if (sc == null || !sv(sc, "projectId").equals(projectId)
                || !accessScope.canAccessProject(principal.userId(), principal.role(), projectId, true))
            throw Api("Hợp đồng giao khoán không thuộc phạm vi dự án.");
        if (!paymentDate.matches("\\d{4}-\\d{2}-\\d{2}")) throw Api("Ngày thanh toán không hợp lệ.");
        double approved = store.sumApprovedProduction(subcontractId, "");
        double paid = store.sumTeamPayments(subcontractId);
        if (!"advance".equals(paymentType) && paid + amount > approved + 1e-9)
            throw Api("Thanh toán lũy kế vượt sản lượng tổ đội đã duyệt.");
        store.insertTeamPayment(idGenerator.next("TPAY"), projectId, sv(sc, "teamId"), subcontractId,
                nvl(payload.get("productionRecordId")), paymentDate, paymentType, nvl(payload.get("referenceNo")),
                description, amount, nvl(payload.get("note")), principal.userId(), Instant.now());
        return Map.of("message", "Đã ghi thanh toán tổ đội vào sổ giao khoán độc lập.");
    }

    /** settle_team_subcontract — quyết toán: chặn khi tổ đội còn giữ vật tư; close HĐ. */
    public Map<String, Object> settleTeamSubcontract(Principal principal, Map<String, Object> payload) {
        // [P-09/TASK-117] ENGINE + mã CHỨC DANH THẬT (xem chú thích ở saveTeamSubcontract).
        rbac.requireRole(principalAsCurrent(principal), List.of("admin", "commander", "cht", "accountant"));
        String subcontractId = trim(payload.get("subcontractId"));
        Map<String, Object> sc = store.findSubcontract(subcontractId)
                .orElseThrow(() -> Api("Không có quyền quyết toán hợp đồng này."));
        // JS 1250.
        accessScope.requireProjectAccess(principal.userId(), principal.role(), sv(sc, "projectId"), true,
                "Không có quyền quyết toán hợp đồng này.");
        if (store.teamHeldStockLines(sv(sc, "teamId")) > 0)
            throw Api("Tổ đội vẫn còn vật tư đang giữ; phải hoàn trả hoặc xác nhận lắp đặt trước quyết toán.");
        double approved = store.sumApprovedProduction(subcontractId, "");
        double paid = store.sumTeamPayments(subcontractId);
        double adjustment = numberValue(payload.get("adjustmentValue"));
        double finalValue = Math.max(0, approved + adjustment);
        double remaining = finalValue - paid;
        String settlementNo = blankDefault(trim(payload.get("settlementNo")), "QT-" + sv(sc, "contractNo"));
        String sid = idGenerator.next("TSET");
        String projectId = sv(sc, "projectId");
        store.insertTeamSettlement(sid, projectId, sv(sc, "teamId"), subcontractId, settlementNo,
                approved, adjustment, finalValue, paid, remaining, nvl(payload.get("note")),
                principal.userId(), Instant.now());
        store.settleSubcontract(subcontractId, Instant.now());
        return Map.of("message", "Đã quyết toán " + sv(sc, "contractNo") + "; còn " + remaining + " phải thanh toán tổ đội.");
    }

    private static Map<String, Object> asMap(Object o) { return o instanceof Map ? (Map) o : Map.of(); }

    // ============ construction daily logs ============
    public Map<String, Object> saveConstructionDailyLog(Principal principal, Map<String, Object> payload) {
        String logId = trim(payload.get("logId"));
        String projectId = trim(payload.get("projectId"));
        // JS 1200.
        accessScope.requireProjectAccess(principal.userId(), principal.role(), projectId, true,
                "Không có quyền cập nhật nhật ký thi công tại dự án này.");
        String workDate = trim(payload.get("workDate"));
        String shift = blankDefault(trim(payload.get("shift")), "sang");
        String weather = nvl(payload.get("weather"));
        String workContent = nvl(payload.get("workContent"));
        int laborCount = Math.max(0, (int) Math.floor(numberValue(payload.get("laborCount"))));
        String equipmentNote = nvl(payload.get("equipmentNote"));
        String note = nvl(payload.get("note"));
        String warehouseId = nvl(payload.get("warehouseId"));
        List<?> rawItems = payload.get("items") instanceof List<?> l ? l : List.of();
        List<Map<String, Object>> items = new java.util.ArrayList<>();
        for (Object o : rawItems) {
            Map<String, Object> row = asMap(o);
            String itemName = trim(row.get("itemName"));
            if (itemName.isEmpty()) continue;
            Map<String, Object> item = new java.util.LinkedHashMap<>();
            item.put("itemName", itemName);
            item.put("boqItemId", nvl(row.get("boqItemId")));
            item.put("location", nvl(row.get("location")));
            item.put("plannedQty", strictNonNegative(row.get("plannedQty"), "Khối lượng kế hoạch"));
            item.put("completedQty", strictNonNegative(row.get("completedQty"), "Khối lượng thực hiện"));
            item.put("unit", nvl(row.get("unit")));
            item.put("laborHours", strictNonNegative(row.get("laborHours"), "Giờ công"));
            item.put("photoAttachmentId", nvl(row.get("photoAttachmentId")));
            item.put("note", nvl(row.get("note")));
            items.add(item);
        }
        if (projectId.isEmpty() || !workDate.matches("\\d{4}-\\d{2}-\\d{2}"))
            throw Api("Nhật ký thi công phải có dự án và ngày YYYY-MM-DD.");
        Instant now = Instant.now();
        if (!logId.isEmpty()) {
            Map<String, Object> old = store.findDailyLog(logId)
                    .orElseThrow(() -> Api("Không tìm thấy nhật ký thi công."));
            if (!sv(old, "project_id").equals(projectId))
                throw Api("Không được chuyển nhật ký sang dự án khác.");
            if ("approved".equals(sv(old, "status")) && !"admin".equals(principal.role()))
                throw Api("Nhật ký đã được duyệt; chỉ Quản trị được phép mở lại/sửa.");
            String nextStatus = "approved".equals(sv(old, "status")) ? "approved"
                    : payload.get("submit") == Boolean.TRUE ? "submitted"
                    : sv(old, "status").isEmpty() ? "draft" : sv(old, "status");
            store.updateDailyLog(logId, workDate, shift, weather, workContent, laborCount, equipmentNote,
                    note, warehouseId, nextStatus, nextStatus.equals("submitted") ? principal.userId() : null, now);
            store.replaceDailyLogItems(logId, items, now);
            return Map.of("message", nextStatus.equals("submitted")
                    ? "Đã cập nhật và gửi nhật ký để Ban chỉ huy/Phòng Dự án kiểm tra." : "Đã cập nhật nhật ký thi công.");
        }
        String code = "DA";
        Map<String, Object> proj = store.findProjectCode(projectId).orElse(null);
        if (proj != null && !sv(proj, "code").isEmpty()) code = sv(proj, "code");
        long n = 0;
        try { n = Long.parseLong(store.dailyLogSequenceNo(projectId, workDate.substring(0, 4))); } catch (Exception ignored) { }
        String logNo = "CDL-" + code + "-" + workDate.substring(0, 4) + "-" + String.format("%04d", n);
        String status0 = payload.get("submit") == Boolean.TRUE ? "submitted" : "draft";
        String submittedBy = payload.get("submit") == Boolean.TRUE ? principal.userId() : null;
        String newId = idGenerator.next("CDL");
        store.insertDailyLog(newId, logNo, projectId, warehouseId, workDate, shift, weather,
                workContent, laborCount, equipmentNote, status0, submittedBy, principal.userId(), now);
        store.replaceDailyLogItems(newId, items, now);
        return Map.of("message", status0.equals("submitted") ? "Đã ghi nhật ký thi công và gửi kiểm tra."
                : "Đã ghi nhật ký thi công (bản nháp).");
    }

    public Map<String, Object> approveConstructionDailyLog(Principal principal, Map<String, Object> payload) {
        String logId = trim(payload.get("logId"));
        Map<String, Object> old = store.findDailyLog(logId)
                .orElseThrow(() -> Api("Không tìm thấy nhật ký thi công."));
        // JS 1205: phạm vi dự án của CHÍNH nhật ký.
        accessScope.requireProjectAccess(principal.userId(), principal.role(), sv(old, "project_id"), true,
                "Không có quyền tại dự án này.");
        if ("approved".equals(sv(old, "status"))) throw Api("Nhật ký đã được duyệt.");
        store.approveDailyLog(logId, principal.userId(), Instant.now());
        return Map.of("message", "Đã duyệt nhật ký thi công; tiến độ thực hiện được dùng làm cơ sở đối chiếu nghiệm thu.");
    }

    public Map<String, Object> deleteConstructionDailyLog(Principal principal, Map<String, Object> payload) {
        String logId = trim(payload.get("logId"));
        Map<String, Object> old = store.findDailyLog(logId)
                .orElseThrow(() -> Api("Không tìm thấy nhật ký thi công."));
        if ("approved".equals(sv(old, "status")) && !"admin".equals(principal.role()))
            throw Api("Nhật ký đã duyệt; chỉ Quản trị được xóa.");
        // JS 1208: phạm vi dự án của CHÍNH nhật ký.
        accessScope.requireProjectAccess(principal.userId(), principal.role(), sv(old, "project_id"), true,
                "Không có quyền tại dự án này.");
        store.deleteDailyLog(logId);
        return Map.of("message", "Đã xóa nhật ký thi công.");
    }

    private static double numberValue(Object o) {
        try { return o == null ? 0 : Double.parseDouble(String.valueOf(o)); }
        catch (NumberFormatException e) { return 0; }
    }

    private static String blankDefault(String s, String fallback) { return s.isEmpty() ? fallback : s; }

    private AuthUseCase.CurrentUser principalAsCurrent(Principal p) {
        return new AuthUseCase.CurrentUser(p.userId(), "", "", null, p.role(), p.roleBase(), p.role(),
                null, null, null, false);
    }

    // ---- helpers ----
    private static double strictNonNegative(Object o, String label) {
        String raw = trim(o);
        if (raw.isEmpty()) throw Api(label + " không được để trống.");
        try { double v = Double.parseDouble(raw); if (v < 0) throw Api(label + " không hợp lệ."); return v; }
        catch (NumberFormatException e) { throw Api(label + " không hợp lệ."); }
    }
    private static double num(Object o) {
        try { return o == null ? 0 : Double.parseDouble(String.valueOf(o)); }
        catch (NumberFormatException e) { return 0; }
    }
    private static String sv(Map<String, Object> m, String k) { Object v = m.get(k); return v == null ? "" : String.valueOf(v); }
    private static String trim(Object o) { return o == null ? "" : String.valueOf(o).trim(); }
    private static String nvl(Object o) { String s = trim(o); return s.isEmpty() ? null : s; }
    private static AuthUseCase.ApiError Api(String message) { return new AuthUseCase.ApiError(message, 400); }
}