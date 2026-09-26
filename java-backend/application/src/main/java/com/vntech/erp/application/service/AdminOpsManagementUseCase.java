package com.vntech.erp.application.service;

import com.vntech.erp.application.port.out.AdminOpsStore;
import com.vntech.erp.application.port.out.IdGenerator;
import com.vntech.erp.application.port.out.ProductionStore;
import com.vntech.erp.application.rbac.AccessScopeService;
import com.vntech.erp.application.rbac.RbacService;
import com.vntech.erp.domain.service.MaterialMatcherV2;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Use-case vận hành admin — port nguyên trạng save_email_settings / preview_request_import JS.
 */
public final class AdminOpsManagementUseCase {

    private final AdminOpsStore store;
    private final ProductionStore productionStore;
    private final IdGenerator idGenerator;
    private final RbacService rbac;
    private final AccessScopeService accessScope;

    public AdminOpsManagementUseCase(AdminOpsStore store, ProductionStore productionStore,
                                     IdGenerator idGenerator, RbacService rbac, AccessScopeService accessScope) {
        this.store = store;
        this.productionStore = productionStore;
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

    // ============ save_email_settings ============
    public Map<String, Object> saveEmailSettings(Principal principal, Map<String, Object> payload) {
        rbac.requireRole(principalAsCurrent(principal), List.of("admin"));
        boolean enabled = payload.get("enabled") == Boolean.TRUE
                || List.of("1", "true", "on").contains(trim(payload.get("enabled")).toLowerCase(Locale.ROOT));
        String smtpHost = nvl(payload.get("smtpHost"));
        // SỬA LỖI (TASK-040 nhóm 1b): JS là `Math.max(1, numberValue(payload.smtpPort) || 587)`. Bản cũ kẹp
        // sàn `max(1,…)` TRƯỚC rồi mới so `== 0`, mà sau `max` thì không bao giờ bằng 0 ⇒ thiếu trường thì
        // lưu cổng 1 thay vì 587. Phải áp mặc định TRƯỚC khi kẹp sàn, đúng thứ tự toán hạng của JS.
        int rawPort = (int) Math.round(numberValue(payload.get("smtpPort")));
        int smtpPort = rawPort == 0 ? 587 : Math.max(1, rawPort);
        String security = List.of("starttls", "tls", "plain").contains(trim(payload.get("security")))
                ? trim(payload.get("security")) : "starttls";
        String username = nvl(payload.get("username"));
        String suppliedPassword = nvl(payload.get("smtpPassword"));
        String senderEmail = trim(payload.get("senderEmail")).toLowerCase(Locale.ROOT);
        String senderName = blankDefault(trim(payload.get("senderName")), "VNTECH ERP");
        // SỬA LỖI (TASK-040 nhóm 1b): JS `clean(payload.baseUrl).replace(/\/$/, "")` — bỏ ĐÚNG MỘT dấu "/" cuối.
        String baseUrl = nvl(payload.get("baseUrl"));
        if (baseUrl != null && baseUrl.endsWith("/")) baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
        if (enabled && (smtpHost == null || smtpPort < 1 || username == null || suppliedPassword == null
                || emailsFrom(senderEmail).isEmpty()))
            throw Api("Để bật gửi mail cần đủ máy chủ SMTP, tài khoản, mật khẩu ứng dụng và email người gửi.");
        if (baseUrl != null && !baseUrl.matches("(?i)^https?://.*"))
            throw Api("Địa chỉ phần mềm trong email phải bắt đầu bằng http:// hoặc https://.");
        // SỬA LỖI (TASK-040 nhóm 1b): JS `Math.max(1, numberValue(...) || 24)` (và `|| 8` cho BCH). Bản cũ
        // kẹp sàn trước rồi mới so `== 0` ⇒ thiếu trường thì lưu SLA 1 giờ thay vì 24/8 — sai lệch âm thầm
        // mỗi lần trang Quản trị email được lưu mà không gửi kèm 2 trường SLA.
        long rawPo = Math.round(numberValue(payload.get("poSlaHours")));
        long poSla = rawPo == 0 ? 24 : Math.max(1, rawPo);
        long rawBch = Math.round(numberValue(payload.get("bchConfirmationSlaHours")));
        long bchSla = rawBch == 0 ? 8 : Math.max(1, rawBch);
        Instant now = Instant.now();
        Map<String, Object> s = new LinkedHashMap<>();
        s.put("enabled", enabled);
        s.put("smtpHost", smtpHost);
        s.put("smtpPort", smtpPort);
        s.put("security", security);
        s.put("username", username);
        s.put("smtpPassword", suppliedPassword);
        s.put("senderEmail", senderEmail.isEmpty() ? null : senderEmail);
        s.put("senderName", senderName);
        s.put("baseUrl", baseUrl);
        store.upsertEmailSettings(s, principal.userId(), now);
        store.updateSlaSettings(true, poSla, true, bchSla, principal.userId(), now);
        store.clearApprovalEmailRecipients();
        boolean assignmentsProvided = payload.get("assignments") instanceof List<?>;
        List<?> assignments = assignmentsProvided ? (List<?>) payload.get("assignments") : List.of();
        if (assignmentsProvided) store.clearApprovalProjectAssignments();
        for (Object o : assignments) {
            Map<String, Object> row = asMap(o);
            String projectId = trim(row.get("projectId"));
            int stage = (int) Math.round(numberValue(row.get("stage")));
            String ownerUserId = trim(row.get("ownerUserId"));
            String ccEmails = emailsFrom(row.get("ccEmails"));
            if (projectId.isEmpty() || stage == 0 || ownerUserId.isEmpty()) continue;
            store.insertApprovalAssignment(idGenerator.next("APOWN"), projectId, stage, ownerUserId,
                    ccEmails.isEmpty() ? null : ccEmails, principal.userId(), now);
        }
        List<?> recipients = payload.get("recipients") instanceof List<?> l2 ? l2 : List.of();
        for (Object o : recipients) {
            Map<String, Object> row = asMap(o);
            String projectId = trim(row.get("projectId"));
            int stage = (int) Math.round(numberValue(row.get("stage")));
            // SỬA LỖI (TASK-040): UI gửi `recipients: [{ projectId, stage, emails }]` — MỘT trường `emails`
            // (app/page.tsx:3733-3734), đúng như JS đọc (`row.emails`). Bản cũ tìm `userEmail`/`ccEmails`
            // nên luôn rỗng ⇒ `continue` ⇒ KHÔNG ghi gì, kể cả sau khi đã sửa câu lệnh SQL.
            String emails = emailsFrom(row.get("emails"));
            if (projectId.isEmpty() || stage == 0 || emails.isEmpty()) continue;
            // SỬA LỖI (TASK-040 nhóm 1b): JS dùng tiền tố id `MAILTO` (scripts/system-route.mjs:1615); bản Java
            // đặt `AREC` — lệch quy ước id dù cùng một bảng. Đổi cho khớp để bản ghi do Java tạo và do JS tạo
            // không bị phân biệt bởi tiền tố.
            store.insertApprovalRecipient(idGenerator.next("MAILTO"), projectId, stage, emails, now);
        }
        return Map.of("message", "Đã lưu cấu hình email & gửi thông báo duyệt theo dự án và bước duyệt.");
    }

    // ============ preview_request_import ============
    public Map<String, Object> previewRequestImport(Principal principal, Map<String, Object> payload) {
        // [PHASE 2 — CHỈ ĐẠO NGƯỜI DÙNG (3) 21/09/2026] Bước ĐỐI CHIẾU FILE của biểu mẫu lập phiếu phải mở cho
        // MỌI tài khoản có quyền TẠO phiếu (trước đây chốt cứng engineer/commander/admin ⇒ user khác không đối
        // chiếu được file, dù đã được cấp quyền `requests`/`canCreate`). Quyền vẫn qua CỔNG RBAC cấu hình được
        // (module `requests`, năng lực `canCreate`) — KHÔNG mở toang. Đối chiếu bản JS `scripts/system-route.mjs`
        // (action `preview_request_import`, cùng bỏ chốt vai trò).
        String projectId = trim(payload.get("projectId"));
        List<?> rawLines = payload.get("lines") instanceof List<?> l ? l : List.of();
        if (projectId.isEmpty() || rawLines.isEmpty())
            throw Api("Chọn dự án và file có ít nhất một dòng vật tư trước khi đối chiếu.");
        if (rawLines.size() > 100) throw Api("Mỗi phiếu đề nghị được nhập tối đa 100 dòng vật tư.");
        // JS 865.
        accessScope.requireProjectAccess(principal.userId(), principal.role(), projectId, true,
                "Tài khoản không được lập đơn cho dự án này.");
        String contractId = trim(payload.get("contractId"));
        String boqVersionId = trim(payload.get("boqVersionId"));
        Map<String, Object> ctx = store.findContractForVersion(projectId, contractId, boqVersionId)
                .orElseThrow(() -> Api("Hợp đồng chưa có phiên bản BOQ. Hãy tạo/import BOQ trước."));
        contractId = sv(ctx, "id");
        boqVersionId = resolveVersionId(projectId, contractId, boqVersionId);
        List<Map<String, Object>> boqRows = store.boqRowsForPreview(projectId, contractId, boqVersionId);
        List<Map<String, Object>> materials = store.materialsForPreview();
        Map<String, Map<String, Object>> byId = new LinkedHashMap<>();
        Map<String, Map<String, Object>> byCode = new LinkedHashMap<>();
        for (Map<String, Object> row : materials) {
            Map<String, Object> m = new LinkedHashMap<>(row);
            byId.put(sv(m, "id"), m);
            byCode.put(sv(m, "code").toUpperCase(Locale.ROOT), m);
        }
        List<Map<String, Object>> inventoryRows = store.inventoryForProject(projectId);
        Map<String, Double> stockByMaterial = new LinkedHashMap<>();
        for (Map<String, Object> r : inventoryRows)
            stockByMaterial.put(sv(r, "materialId"), numberValue(ci(r, "qty")));
        List<Map<String, Object>> cumulativeRows = store.cumulativeByBoq(projectId, contractId, boqVersionId);
        Map<String, Map<String, Object>> cumulativeByBoq = new LinkedHashMap<>();
        for (Map<String, Object> r : cumulativeRows) cumulativeByBoq.put(sv(r, "boqItemId"), r);

        List<Map<String, Object>> results = new ArrayList<>();
        for (int index = 0; index < rawLines.size(); index++) {
            Map<String, Object> source = asMap(rawLines.get(index));
            String rawCode0 = trim(source.get("materialCode"));
            if (rawCode0.isEmpty()) rawCode0 = trim(source.get("internalMaterialCode"));
            final String rawCode = rawCode0.toUpperCase(Locale.ROOT);
            String rawName = trim(source.get("materialName"));
            String rawUnit = trim(source.get("unit"));
            String rawLine = trim(source.get("contractLineNo"));
            String rawBoq = trim(source.get("boqCode"));
            String rawBoqId = trim(source.get("boqItemId"));
            Map<String, Object> material = null;
            if (!trim(source.get("materialId")).isEmpty()) material = byId.get(trim(source.get("materialId")));
            if (material == null && !rawCode.isEmpty()) material = byCode.get(rawCode);
            if (material == null && !rawName.isEmpty()) {
                String nameKey = normalized(rawName);
                List<Map<String, Object>> candidates = new ArrayList<>();
                for (Map<String, Object> row : materials) {
                    if (normalized(sv(row, "name")).equals(nameKey)
                            && (rawUnit.isEmpty() || normalized(sv(row, "unit")).equals(normalized(rawUnit))))
                        candidates.add(row);
                }
                if (candidates.size() == 1) material = candidates.get(0);
            }
            List<Map<String, Object>> candidates = new ArrayList<>(boqRows);
            final Map<String, Object> fxMaterial = material;
            if (!rawBoqId.isEmpty()) candidates.removeIf(r -> !sv(r, "id").equals(rawBoqId));
            if (!rawLine.isEmpty()) candidates.removeIf(r -> !sv(r, "contractLineRef").equals(rawLine)
                    && !sv(r, "lineNo").equals(rawLine));
            if (!rawBoq.isEmpty()) candidates.removeIf(r -> !sv(r, "boqCode").toUpperCase(Locale.ROOT).equals(rawBoq.toUpperCase(Locale.ROOT)));
            if (fxMaterial != null) candidates.removeIf(r -> !sv(r, "materialId").equals(sv(fxMaterial, "id")));
            if (fxMaterial == null && !rawCode.isEmpty())
                candidates.removeIf(r -> !sv(r, "materialCode").equals(rawCode)
                        && !sv(r, "contractMaterialCode").equals(rawCode)
                        && !sv(r, "approvedMaterialCode").equals(rawCode));
            if (fxMaterial == null && !rawName.isEmpty()) {
                String n = normalized(rawName);
                List<Map<String, Object>> exact = new ArrayList<>();
                for (Map<String, Object> r : candidates)
                    if (normalized(sv(r, "materialName")).equals(n)
                            || normalized(sv(r, "standardMaterialName")).equals(n)) exact.add(r);
                if (!exact.isEmpty()) candidates = exact;
            }
            Map<String, Object> matched = null;
            String status = "not_found";
            String reason = "Không tìm thấy dòng BOQ tương đồng trong Hợp đồng/BOQ Version đang chọn.";
            if (candidates.size() == 1) {
                matched = candidates.get(0);
                status = "exact";
                reason = "Đã đối chiếu đúng một dòng BOQ.";
            } else if (candidates.size() > 1) {
                status = "review";
                reason = "Tìm thấy " + candidates.size() + " dòng có thể khớp; cần chọn đúng dòng BOQ.";
            }
            if (matched != null && material == null && !sv(matched, "materialId").isEmpty())
                material = byId.get(sv(matched, "materialId"));
            Map<String, Object> cum = matched != null ? cumulativeByBoq.get(sv(matched, "id")) : null;
            double requestedQty = cum != null ? numberValue(ci(cum, "requestedQty")) : 0;
            double orderedQty = cum != null ? numberValue(ci(cum, "orderedQty")) : 0;
            double receivedQty = cum != null ? numberValue(ci(cum, "receivedQty")) : 0;
            double contractQty = matched != null ? numberValue(ci(matched, "contractQty")) : 0;
            double stockQty = material != null ? stockByMaterial.getOrDefault(sv(material, "id"), 0.0) : 0;
            double pendingDeliveryQty = Math.max(0, orderedQty - receivedQty);
            double remainingRequestQty = Math.max(0, contractQty - requestedQty);
            Map<String, Object> result = new LinkedHashMap<>(source);
            result.put("materialId", material != null ? sv(material, "id") : sv(source, "materialId"));
            result.put("materialCode", material != null ? sv(material, "code") : rawCode);
            result.put("materialName", material != null ? sv(material, "name") : rawName);
            result.put("unit", material != null ? sv(material, "unit") : rawUnit);
            double unitPrice = numberValue(source.get("unitPrice"));
            if (unitPrice == 0 && material != null) unitPrice = numberValue(ci(material, "standardPrice"));
            result.put("unitPrice", unitPrice);
            result.put("boqItemId", matched != null ? sv(matched, "id") : null);
            result.put("contractId", contractId);
            result.put("boqVersionId", boqVersionId);
            result.put("contractLineNo", matched != null && !sv(matched, "contractLineRef").isEmpty()
                    ? sv(matched, "contractLineRef") : sv(matched, "lineNo"));
            if (result.get("contractLineNo") == null || String.valueOf(result.get("contractLineNo")).isEmpty())
                result.put("contractLineNo", rawLine);
            result.put("boqCode", matched != null ? sv(matched, "boqCode") : rawBoq);
            result.put("contractQty", contractQty);
            result.put("stockQty", stockQty);
            result.put("requestedCumulativeQty", requestedQty);
            result.put("orderedCumulativeQty", orderedQty);
            result.put("receivedCumulativeQty", receivedQty);
            result.put("pendingDeliveryQty", pendingDeliveryQty);
            result.put("remainingRequestQty", remainingRequestQty);
            result.put("cumulativeAfterRequest", requestedQty + numberValue(source.get("quantity")));
            result.put("matchStatus", status);
            result.put("matchReason", reason);
            List<Map<String, Object>> matchCandidates = new ArrayList<>();
            int limit = Math.min(12, candidates.size());
            for (int i = 0; i < limit; i++) {
                Map<String, Object> row = candidates.get(i);
                Map<String, Object> c = new LinkedHashMap<>();
                c.put("boqItemId", sv(row, "id"));
                c.put("contractLineNo", sv(row, "contractLineRef").isEmpty() ? sv(row, "lineNo") : sv(row, "contractLineRef"));
                c.put("boqCode", sv(row, "boqCode"));
                c.put("materialCode", sv(row, "materialCode"));
                c.put("materialName", sv(row, "materialName"));
                c.put("unit", sv(row, "unit"));
                c.put("contractQty", numberValue(ci(row, "contractQty")));
                matchCandidates.add(c);
            }
            result.put("matchCandidates", matchCandidates);
            results.add(result);
        }
        long exact = results.stream().filter(r -> "exact".equals(sv(r, "matchStatus"))).count();
        long review = results.stream().filter(r -> "review".equals(sv(r, "matchStatus"))).count();
        long notFound = results.stream().filter(r -> "not_found".equals(sv(r, "matchStatus"))).count();
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("exact", exact);
        summary.put("review", review);
        summary.put("notFound", notFound);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("message", "Đã đối chiếu " + results.size() + " dòng với " + sv(ctx, "contractNo")
                + " · " + boqVersionId + ".");
        out.put("projectId", projectId);
        out.put("contractId", contractId);
        out.put("boqVersionId", boqVersionId);
        out.put("lines", results);
        out.put("summary", summary);
        return out;
    }

    private String resolveVersionId(String projectId, String contractId, String requested) {
        if (!requested.isEmpty()) return requested;
        return store.findActiveBoqVersionId(projectId, contractId)
                .map(m -> sv(m, "id"))
                .orElse(requested);
    }

    private static String normalized(String v) {
        return MaterialMatcherV2.normalizeMaterialText(v).replaceAll("\\s+", " ").trim();
    }

    private static String emailsFrom(Object o) {
        String raw = trim(o);
        if (raw.isEmpty()) return "";
        List<String> out = new ArrayList<>();
        for (String part : raw.split("[;,\\s]+")) {
            String p = part.trim();
            // JS dùng [...new Set(...)] ⇒ KHỬ TRÙNG LẶP; bản cũ không khử nên một email có thể bị lặp.
            if (p.matches("(?i)^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) {
                String mail = p.toLowerCase(Locale.ROOT);
                if (!out.contains(mail)) out.add(mail);
            }
        }
        return String.join(",", out);
    }

    private static Map<String, Object> asMap(Object o) { return o instanceof Map ? (Map) o : Map.of(); }
    private static Object ci(Map<String, Object> m, String key) {
        if (m == null) return null;
        Object v = m.get(key);
        if (v != null) return v;
        for (Map.Entry<String, Object> e : m.entrySet())
            if (e.getKey().equalsIgnoreCase(key)) return e.getValue();
        return null;
    }
    private static double numberValue(Object o) {
        try { return o == null ? 0 : Double.parseDouble(String.valueOf(o)); }
        catch (NumberFormatException e) { return 0; }
    }
    private static String sv(Map<String, Object> m, String k) { Object v = ci(m, k); return v == null ? "" : String.valueOf(v); }
    private static String trim(Object o) { return o == null ? "" : String.valueOf(o).trim(); }
    private static String nvl(Object o) { String s = trim(o); return s.isEmpty() ? null : s; }
    private static String blankDefault(String s, String fallback) { return s.isEmpty() ? fallback : s; }
    private AuthUseCase.CurrentUser principalAsCurrent(Principal p) {
        return new AuthUseCase.CurrentUser(p.userId(), "", "", null, p.role(), p.roleBase(), p.role(), null, null, null, false);
    }
    private static AuthUseCase.ApiError Api(String message) { return new AuthUseCase.ApiError(message, 400); }
}