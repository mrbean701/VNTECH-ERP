package com.vntech.erp.application.service;

import com.vntech.erp.application.port.out.AuditLogPort;
import com.vntech.erp.application.port.out.IdGenerator;
import com.vntech.erp.application.port.out.ProjectAdminStore;
import com.vntech.erp.application.rbac.RbacService;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Use-case quản trị dự án (admin) — port nguyên trạng create_project/update_project/set_project_status,
 * đủ đầy close checks khi Đóng dự án (MR/PO/điều chuyển/kiểm kê/hoàn trả/giữ chỗ/giao khoán/tồn kho/
 * tồn Contract/đối chiếu + archive bắt buộc) — khớp monolith JS.
 */
public final class ProjectManagementUseCase {

    private static final Pattern CODE = Pattern.compile("^[A-Z0-9._-]{2,24}$");

    /**
     * Mốc dưới khi tìm archive VERIFIED — thay `"0000"` của JS (SQLite so chuỗi được, MySQL thì không).
     * MySQL DATETIME nhỏ nhất là `1000-01-01`; `1970-01-01` là mốc epoch an toàn và bao trọn mọi dữ liệu.
     */
    private static final String ARCHIVE_FLOOR = "1970-01-01 00:00:00";

    private final ProjectAdminStore store;
    private final IdGenerator idGenerator;
    private final RbacService rbac;
    private final AuditLogPort auditLog;

    public ProjectManagementUseCase(ProjectAdminStore store, IdGenerator idGenerator, RbacService rbac,
                                    AuditLogPort auditLog) {
        this.store = store;
        this.idGenerator = idGenerator;
        this.rbac = rbac;
        this.auditLog = auditLog;
    }

    public interface Principal {
        String userId();
        String role();
    }

    public String createProject(Principal principal, Map<String, Object> payload) {
        rbac.requireRole(principalAsCurrent(principal), List.of("admin"));
        String code = trim(payload.get("code")).toUpperCase();
        String name = trim(payload.get("name"));
        if (!CODE.matcher(code).matches() || name.isEmpty())
            throw new AuthUseCase.ApiError("Mã dự án gồm 2–24 ký tự A-Z, số, dấu chấm/gạch; tên dự án là bắt buộc.", 400);
        Instant now = Instant.now();
        // MT2-P14-03c (23/09/2026) — ĐỌC CỜ «Tạo kho dự án?» như JS/UI, ⛔ trước đây Java BỎ QUA cờ này
        // ⇒ người dùng chọn «Không» vẫn bị sinh kho công trường (lệch `scripts/system-route.mjs` + UI).
        boolean createWarehouse = createWarehouseFlag(payload.get("createWarehouse"));
        store.insertProjectWithWarehouse(
                idGenerator.next("PRJ"), idGenerator.next("WH"), code, name, principal.userId(),
                nullIfBlank(payload.get("startDate")), nullIfBlank(payload.get("plannedEndDate")),
                nullIfBlank(payload.get("contractNo")), nullIfBlank(payload.get("contractName")),
                codeOf(trim(payload.get("warehouseCode")), "KHO-" + code),
                blankFallsBack(trim(payload.get("warehouseName")), "Kho công trường " + code),
                idGenerator.next("SCOPE"), principal.userId(), createWarehouse, now);
        return createWarehouse
                ? "Đã tạo dự án " + code + " và kho công trường riêng."
                : "Đã tạo dự án " + code + " (không tạo kho công trường theo lựa chọn).";
    }

    /**
     * Cờ «Tạo kho dự án?» — bản sao ĐÚNG biểu thức của JS `scripts/system-route.mjs` (nhánh `create_project`):
     * vắng / {@code null} / chuỗi rỗng ⇒ **true** (tương thích ngược: mọi nơi gọi CŨ không truyền cờ vẫn tạo kho);
     * chỉ **false** khi giá trị là {@code false}, {@code 0}, {@code "0"}, {@code "false"}, {@code "no"}.
     */
    static boolean createWarehouseFlag(Object raw) {
        if (raw == null) return true;
        if (raw instanceof Boolean flag) return flag;
        String text = String.valueOf(raw).trim().toLowerCase(java.util.Locale.ROOT);
        if (text.isEmpty()) return true;
        return !("0".equals(text) || "false".equals(text) || "no".equals(text));
    }

    public String updateProject(Principal principal, Map<String, Object> payload) {
        rbac.requireRole(principalAsCurrent(principal), List.of("admin"));
        String projectId = trim(payload.get("projectId"));
        String code = trim(payload.get("code")).toUpperCase();
        String name = trim(payload.get("name"));
        if (projectId.isEmpty() || !CODE.matcher(code).matches() || name.isEmpty())
            throw new AuthUseCase.ApiError("Thông tin dự án chưa hợp lệ.", 400);
        Map<String, Object> before = store.findProjectById(projectId);
        if (before == null) throw new AuthUseCase.ApiError("Không tìm thấy dự án.", 400);
        Map<String, Object> currentWarehouse = store.firstSiteWarehouse(projectId);
        String warehouseCode = codeOf(trim(payload.get("warehouseCode")),
                currentWarehouse != null ? String.valueOf(currentWarehouse.getOrDefault("code", "")) : "KHO-" + code);
        if (warehouseCode.isEmpty()) warehouseCode = "KHO-" + code;
        String warehouseName = blankFallsBack(trim(payload.get("warehouseName")),
                currentWarehouse != null ? String.valueOf(currentWarehouse.getOrDefault("name", "")) : "Kho công trường " + code);
        store.updateProject(projectId, code, name, nullIfBlank(payload.get("contractNo")),
                nullIfBlank(payload.get("contractName")), nullIfBlank(payload.get("startDate")),
                nullIfBlank(payload.get("plannedEndDate")), Instant.now());
        if (currentWarehouse != null) {
            store.upsertSiteWarehouse(projectId, warehouseCode, warehouseName, principal.userId(), Instant.now());
        } else {
            store.upsertSiteWarehouse(projectId, warehouseCode, warehouseName, principal.userId(), Instant.now());
        }
        return "Đã cập nhật dự án " + code + " và thông tin kho riêng.";
    }

    public String setProjectStatus(Principal principal, Map<String, Object> payload) {
        rbac.requireRole(principalAsCurrent(principal), List.of("admin"));
        String projectId = trim(payload.get("projectId"));
        String status = trim(payload.get("status")).toLowerCase();
        if (!List.of("active", "closing", "closed", "archived").contains(status))
            throw new AuthUseCase.ApiError("Trạng thái dự án không hợp lệ.", 400);
        Map<String, Object> before = store.findProjectById(projectId);
        if (before == null) throw new AuthUseCase.ApiError("Không tìm thấy dự án.", 400);
        Instant now = Instant.now();
        if ("closed".equals(status)) {
            Map<String, Number> counts = store.closeCheckCounts(projectId);
            List<Map<String, Object>> checks = new ArrayList<>();
            addCheck(checks, "OPEN_MR", counts.get("open_mr"), "Phiếu đề nghị/chương trình cung ứng chưa kết thúc");
            addCheck(checks, "OPEN_PO", counts.get("open_po"), "PO chưa đóng");
            addCheck(checks, "OPEN_TRANSFER", counts.get("open_transfer"), "Phiếu điều chuyển chưa kết thúc");
            addCheck(checks, "OPEN_COUNT", counts.get("open_count"), "Kiểm kê chưa duyệt");
            addCheck(checks, "OPEN_CENTRAL_RETURN", counts.get("open_central_return"), "Hoàn trả Kho Tổng chưa kết thúc");
            addCheck(checks, "OPEN_RESERVATION", counts.get("open_reservation"), "Vẫn còn giữ chỗ tồn kho cho nhu cầu chưa kết thúc");
            addCheck(checks, "OPEN_TEAM_SUBCONTRACT", counts.get("open_team_subcontract"), "Hợp đồng giao khoán tổ đội chưa quyết toán");
            addCheck(checks, "SITE_STOCK", counts.get("site_stock"), "Kho dự án vẫn còn tồn cần quyết toán/điều chuyển");
            addCheck(checks, "TEAM_STOCK", counts.get("team_stock"), "Tổ đội vẫn còn vật tư chưa hoàn trả/xác nhận lắp đặt");
            addCheck(checks, "CONTRACT_STOCK", counts.get("contract_stock"), "Tồn kế toán theo Contract vẫn còn số dư cần đối chiếu/điều chuyển");
            addCheck(checks, "CONTRACT_RECONCILIATION", counts.get("contract_reconciliation"), "Đối chiếu tồn vật lý ↔ tồn Contract còn chênh lệch");
            store.saveCloseChecks(projectId, checks, principal.userId(), now);
            List<String> failed = checks.stream().filter(c -> number(c.get("count")) > 0)
                    .map(c -> c.get("detail") + " (" + c.get("count") + ")").toList();
            if (!failed.isEmpty())
                throw new AuthUseCase.ApiError("Chưa thể đóng dự án: " + String.join("; ", failed)
                        + ". Hãy xử lý quyết toán kho trước.", 400);
            String since = String.valueOf(before.getOrDefault("updated_at", "0000"));
            Map<String, Object> archive = store.latestVerifiedArchive(projectId, since);
            if (archive == null)
                throw new AuthUseCase.ApiError("Trước khi Đóng dự án bắt buộc bấm ‘TẢI TOÀN BỘ DỮ LIỆU DỰ ÁN / LƯU TRỮ OFFLINE’ và tải gói archive đã kiểm tra PASS.", 400);
        }
        store.setProjectStatus(projectId, status, now);
        if ("closed".equals(status)) store.setWarehouseActive(projectId, "site", false, now);
        if ("active".equals(status)) store.setWarehouseActive(projectId, "site", true, now);
        return "Đã cập nhật trạng thái dự án " + status + ".";
    }

    /** delete_project: chỉ dự án Đóng/Lưu trữ, require confirmCode = mã dự án, bắt buộc archive VERIFIED. */
    public Map<String, Object> deleteProject(Principal principal, Map<String, Object> payload) {
        rbac.requireRole(principalAsCurrent(principal), List.of("admin"));
        String projectId = trim(payload.get("projectId"));
        Map<String, Object> project = store.findProjectById(projectId);
        if (project == null) throw new AuthUseCase.ApiError("Không tìm thấy dự án.", 400);
        String status = String.valueOf(project.getOrDefault("status", "")).toLowerCase();
        if (!List.of("closed", "archived").contains(status))
            throw new AuthUseCase.ApiError("Chỉ dự án đã Đóng/Lưu trữ mới được Xóa/Purge khỏi hệ thống vận hành.", 400);
        String confirm = trim(payload.get("confirmCode"));
        String code = String.valueOf(project.getOrDefault("code", ""));
        if (!confirm.equals(code))
            throw new AuthUseCase.ApiError("Xác nhận xóa không đúng. Hãy nhập chính xác mã dự án " + code + ".", 400);
        // TASK-046 (lỗi P0 do probe bắt): bản cũ truyền mốc `"0000"` — JS/SQLite so chuỗi nên vô hại,
        // còn MySQL 8 ném `Incorrect DATETIME value: '0000'` (error 1525) ⇒ **delete_project luôn HTTP 500**,
        // không admin nào purge được dự án. Dùng mốc thời gian hợp lệ, nghĩa "không giới hạn dưới".
        Map<String, Object> archive = store.latestVerifiedArchive(projectId, ARCHIVE_FLOOR);
        if (archive == null)
            throw new AuthUseCase.ApiError("Trước khi Xóa/Purge phải có gói TOÀN BỘ DỮ LIỆU VERIFIED đã tạo trước khi đóng dự án. Không tìm thấy archive VERIFIED hợp lệ.", 400);
        Instant now = Instant.now();
        store.purgeProject(projectId, String.valueOf(archive.get("id")), now);
        // TASK-046 — hai câu JS `system-route.mjs:2451-2452` mà bản Java CŨ bỏ hẳn:
        //   const auditId = id("AUD"); INSERT audit_logs(PURGE_AFTER_OFFLINE_ARCHIVE, "project", projectId,
        //        JSON(project), JSON({archiveId,archiveFile,archiveSha256,status:"purged",
        //        crossProjectTracePreserved:true,objectCleanupFailed}), requestIp(request), stamp);
        //   UPDATE project_archives SET purge_audit_id = <auditId> WHERE id = <archiveId>
        String archiveId = String.valueOf(archive.get("id"));
        String afterJson = "{\"archiveId\":" + json(archiveId)
                + ",\"archiveFile\":" + json(archive.get("fileName"))
                + ",\"archiveSha256\":" + json(archive.getOrDefault("sha256", ""))
                + ",\"status\":\"purged\",\"crossProjectTracePreserved\":true,\"objectCleanupFailed\":[]}";
        String auditId = auditLog.logReturningId(principal.userId(), "PURGE_AFTER_OFFLINE_ARCHIVE",
                "project", projectId, json(project), afterJson, null);
        if (auditId != null) store.setArchivePurgeAuditId(archiveId, auditId, now);
        Map<String, Object> result = new java.util.LinkedHashMap<>();
        String failed = "";
        result.put("message", "Đã xóa/purge dự án " + code + " khỏi dữ liệu vận hành sau khi archive VERIFIED. Metadata tối thiểu và liên kết liên dự án được giữ để bảo toàn toàn vẹn tham chiếu."
                + (failed.isEmpty() ? "" : " Có " + failed + " tệp object-storage chưa dọn được; dữ liệu đã có trong archive và lỗi dọn file đã được audit."));
        result.put("archiveId", archive.get("id"));
        result.put("archiveSha256", archive.getOrDefault("sha256", ""));
        result.put("objectCleanupFailed", java.util.List.of());
        return result;
    }

    // ---- helpers (port logic JS) ----

    private static void addCheck(List<Map<String, Object>> checks, String key, Number count, String detail) {
        checks.add(Map.of("key", key, "count", count == null ? 0 : count.longValue(), "detail", detail));
    }

    private static long number(Object o) {
        return o instanceof Number n ? n.longValue() : 0L;
    }

    private static String trim(Object o) { return o == null ? "" : String.valueOf(o).trim(); }
    private static String nullIfBlank(Object o) { String s = trim(o); return s.isEmpty() ? null : s; }
    private static String blankFallsBack(String s, String fallback) { return s.isEmpty() ? fallback : s; }
    private static String codeOf(String s, String fallback) { return s.isEmpty() ? fallback : s; }

    /**
     * TASK-046 — tương đương `JSON.stringify(value)` của JS cho `before_json`/`after_json` của audit.
     * Cố ý viết tay trong tầng application (không kéo Jackson vào use-case): chỉ cần Map/List/số/boolean/
     * chuỗi/null, và **phải escape đúng** vì `before_json` chứa nguyên dòng dự án (có tiếng Việt, dấu ngoặc).
     */
    private static String json(Object value) {
        if (value == null) return "null";
        if (value instanceof Map<?, ?> map) {
            StringBuilder sb = new StringBuilder("{");
            boolean first = true;
            for (Map.Entry<?, ?> e : map.entrySet()) {
                if (!first) sb.append(',');
                first = false;
                sb.append(json(String.valueOf(e.getKey()))).append(':').append(json(e.getValue()));
            }
            return sb.append('}').toString();
        }
        if (value instanceof Iterable<?> it) {
            StringBuilder sb = new StringBuilder("[");
            boolean first = true;
            for (Object o : it) { if (!first) sb.append(','); first = false; sb.append(json(o)); }
            return sb.append(']').toString();
        }
        if (value instanceof Boolean) return value.toString();
        if (value instanceof Number n) {
            if (n instanceof Double d && (d.isNaN() || d.isInfinite())) return "null";
            return n.toString();
        }
        String s = String.valueOf(value);
        StringBuilder sb = new StringBuilder("\"");
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            switch (c) {
                case '"' -> sb.append("\\\"");
                case '\\' -> sb.append("\\\\");
                case '\n' -> sb.append("\\n");
                case '\r' -> sb.append("\\r");
                case '\t' -> sb.append("\\t");
                default -> {
                    if (c < 0x20) sb.append(String.format("\\u%04x", (int) c)); else sb.append(c);
                }
            }
        }
        return sb.append('"').toString();
    }

    private AuthUseCase.CurrentUser principalAsCurrent(Principal p) {
        return new AuthUseCase.CurrentUser(p.userId(), "", "", null, p.role(), p.role(), p.role(),
                null, null, null, false);
    }
}