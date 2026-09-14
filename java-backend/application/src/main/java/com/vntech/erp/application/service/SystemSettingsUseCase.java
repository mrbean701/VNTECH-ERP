package com.vntech.erp.application.service;

import com.vntech.erp.application.port.out.IdGenerator;
import com.vntech.erp.application.port.out.SystemSettingsStore;
import com.vntech.erp.application.rbac.RbacService;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Use-case settings hệ thống — 9 action cuối catalog: bulk_import_projects/users,
 * factory_reset_preview/execute, install_license_foundation, request_license_transfer,
 * retry_email, save_ui_display_settings, save_trust_development_settings.
 */
public final class SystemSettingsUseCase {

    private final SystemSettingsStore store;
    private final IdGenerator idGenerator;
    private final RbacService rbac;

    public SystemSettingsUseCase(SystemSettingsStore store, IdGenerator idGenerator, RbacService rbac) {
        this.store = store;
        this.idGenerator = idGenerator;
        this.rbac = rbac;
    }

    public interface Principal {
        String userId();
        String role();
    }

    // ============ bulk_import_projects ============
    public Map<String, Object> bulkImportProjects(Principal principal, Map<String, Object> payload) {
        rbac.requireRole(principalAsCurrent(principal), List.of("admin"));
        List<?> rows = payload.get("rows") instanceof List<?> l ? l : List.of();
        if (rows.isEmpty()) throw Api("File không có dự án để nhập.");
        if (rows.size() > 300) throw Api("Mỗi lần import tối đa 300 dự án.");
        List<Map<String, Object>> normalized = new ArrayList<>();
        for (int index = 0; index < rows.size(); index++) {
            Map<String, Object> input = asMap(rows.get(index));
            int rowNo = (int) Math.round(numberValue(input.get("rowNo")));
            if (rowNo == 0) rowNo = index + 1;
            String code = trim(input.get("code")).toUpperCase(Locale.ROOT);
            String name = trim(input.get("name"));
            String startDate = normalizeVietnamDate(input.get("startDate"));
            String plannedEndDate = normalizeVietnamDate(input.get("plannedEndDate"));
            String statusInput = blankDefault(trim(input.get("status")), "ACTIVE").toUpperCase(Locale.ROOT);
            if (code.isEmpty()) throw Api("Dòng " + rowNo + " · Cột “Mã dự án”: bắt buộc nhập.");
            if (!code.matches("[A-Z0-9._-]{2,24}"))
                throw Api("Dòng " + rowNo + " · Cột “Mã dự án”: chỉ nhận 2–24 ký tự A-Z, số, dấu chấm, gạch dưới hoặc gạch ngang.");
            if (name.isEmpty()) throw Api("Dòng " + rowNo + " · Cột “Tên dự án”: bắt buộc nhập.");
            if (startDate != null && !isIsoDate(startDate))
                throw Api("Dòng " + rowNo + " · Cột “Ngày bắt đầu”: phải là ngày hợp lệ theo định dạng DD/MM/YYYY.");
            if (plannedEndDate != null && !isIsoDate(plannedEndDate))
                throw Api("Dòng " + rowNo + " · Cột “Dự kiến kết thúc”: phải là ngày hợp lệ theo định dạng DD/MM/YYYY.");
            if (startDate != null && plannedEndDate != null && plannedEndDate.compareTo(startDate) < 0)
                throw Api("Dòng " + rowNo + " · Cột “Dự kiến kết thúc”: không được trước Ngày bắt đầu.");
            if (!List.of("ACTIVE", "INACTIVE", "ARCHIVED").contains(statusInput))
                throw Api("Dòng " + rowNo + " · Cột “Trạng thái”: chỉ nhận ACTIVE, INACTIVE hoặc ARCHIVED.");
            String warehouseCode = blankDefault(trim(input.get("warehouseCode")), "KHO-" + code).toUpperCase(Locale.ROOT);
            if (!warehouseCode.matches("[A-Z0-9._-]{2,32}"))
                throw Api("Dòng " + rowNo + " · Cột “Mã kho”: không đúng định dạng.");
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("rowNo", rowNo);
            row.put("code", code);
            row.put("name", name);
            row.put("startDate", startDate);
            row.put("plannedEndDate", plannedEndDate);
            row.put("status", "ACTIVE".equals(statusInput) ? "active" : "archived");
            row.put("warehouseCode", warehouseCode);
            row.put("warehouseName", blankDefault(trim(input.get("warehouseName")), "Kho công trường " + code));
            row.put("contractNo", nvl(input.get("contractNo")));
            row.put("contractName", nvl(input.get("contractName")));
            normalized.add(row);
        }
        // duplicate checks
        for (Map<String, Object> row : normalized) {
            boolean dup = normalized.stream().filter(r -> sv(r, "code").equals(sv(row, "code"))).count() > 1;
            if (dup) throw Api("Dòng " + numI(row, "rowNo") + " · Cột “Mã dự án”: trùng mã " + sv(row, "code") + " trong cùng file.");
        }
        for (Map<String, Object> row : normalized) {
            boolean dup = normalized.stream().filter(r -> sv(r, "warehouseCode").equals(sv(row, "warehouseCode"))).count() > 1;
            if (dup) throw Api("Dòng " + numI(row, "rowNo") + " · Cột “Mã kho”: trùng mã " + sv(row, "warehouseCode") + " trong cùng file.");
        }
        Instant now = Instant.now();
        int created = 0, updated = 0;
        for (Map<String, Object> row : normalized) {
            Map<String, Object> existing = store.findProjectByCodeUpper(sv(row, "code")).orElse(null);
            Map<String, Object> currentWarehouse = existing != null
                    ? store.findSiteWarehouseForProject(sv(existing, "id")).orElse(null) : null;
            Map<String, Object> warehouseOwner = store.findWarehouseOwnerByCodeUpper(sv(row, "warehouseCode")).orElse(null);
            if (warehouseOwner != null && (currentWarehouse == null
                    || !sv(warehouseOwner, "id").equals(sv(currentWarehouse, "id"))))
                throw Api("Dòng " + numI(row, "rowNo") + " · Cột “Mã kho”: " + sv(row, "warehouseCode")
                        + " đã thuộc kho/dự án khác.");
            int warehouseActive = "active".equals(sv(row, "status")) ? 1 : 0;
            if (existing != null) {
                store.updateProjectBasic(sv(existing, "id"), sv(row, "name"), sv(row, "status"),
                        sv(row, "contractNo"), sv(row, "contractName"), sv(row, "startDate"), sv(row, "plannedEndDate"), now);
                if (currentWarehouse != null) {
                    store.updateWarehouseBasic(sv(currentWarehouse, "id"), sv(row, "warehouseCode"),
                            sv(row, "warehouseName"), warehouseActive, now);
                } else {
                    Map<String, Object> wh = new LinkedHashMap<>();
                    wh.put("id", idGenerator.next("WH"));
                    wh.put("code", sv(row, "warehouseCode"));
                    wh.put("name", sv(row, "warehouseName"));
                    wh.put("projectId", sv(existing, "id"));
                    wh.put("keeperUserId", principal.userId());
                    wh.put("active", warehouseActive);
                    store.insertDefaultWarehouse(wh, now);
                }
                updated++;
            } else {
                String projectId = idGenerator.next("PRJ");
                Map<String, Object> p = new LinkedHashMap<>();
                p.put("id", projectId);
                p.put("code", sv(row, "code"));
                p.put("name", sv(row, "name"));
                p.put("status", sv(row, "status"));
                p.put("managerUserId", principal.userId());
                p.put("startDate", sv(row, "startDate"));
                p.put("plannedEndDate", sv(row, "plannedEndDate"));
                p.put("contractNo", sv(row, "contractNo"));
                p.put("contractName", sv(row, "contractName"));
                store.insertProjectBasic(p, now);
                Map<String, Object> wh = new LinkedHashMap<>();
                wh.put("id", idGenerator.next("WH"));
                wh.put("code", sv(row, "warehouseCode"));
                wh.put("name", sv(row, "warehouseName"));
                wh.put("projectId", projectId);
                wh.put("keeperUserId", principal.userId());
                wh.put("active", warehouseActive);
                store.insertDefaultWarehouse(wh, now);
                store.insertUserProjectScopeAdmin(principal.userId(), projectId, now);
                created++;
            }
        }
        return Map.of("message", "Đã nhập " + normalized.size() + " dự án: " + created + " tạo mới, " + updated
                + " cập nhật; kho site và phân quyền admin tự động.");
    }

    // ============ bulk_import_users ============
    public Map<String, Object> bulkImportUsers(Principal principal, Map<String, Object> payload) {
        rbac.requireRole(principalAsCurrent(principal), List.of("admin"));
        List<?> rows = payload.get("rows") instanceof List<?> l ? l : List.of();
        if (rows.isEmpty()) throw Api("File không có tài khoản để nhập.");
        if (rows.size() > 5000) throw Api("Mỗi lần import tối đa 5.000 tài khoản.");
        Instant now = Instant.now();
        int created = 0, updated = 0;
        List<String> errors = new ArrayList<>();
        for (int i = 0; i < rows.size(); i++) {
            Map<String, Object> input = asMap(rows.get(i));
            int rowNo = i + 1;
            String email = trim(input.get("email")).toLowerCase(Locale.ROOT);
            String fullName = trim(input.get("fullName"));
            String role = blankDefault(trim(input.get("role")), "engineer");
            String department = trim(input.get("department"));
            if (email.isEmpty() || fullName.isEmpty()) { errors.add("Dòng " + rowNo + ": thiếu email/họ tên."); continue; }
            Map<String, Object> existing = store.findUserByEmail(email).orElse(null);
            Map<String, Object> user = new LinkedHashMap<>();
            if (existing != null) {
                user.put("id", sv(existing, "id"));
                user.put("fullName", fullName);
                user.put("role", role);
                user.put("department", nvl(department));
                user.put("active", input.get("active") == Boolean.FALSE ? 0 : 1);
                store.updateUserImported(user, now);
                updated++;
            } else {
                user.put("id", idGenerator.next("USR"));
                user.put("username", blankDefault(trim(input.get("username")), email.split("@")[0]));
                user.put("email", email);
                user.put("fullName", fullName);
                user.put("role", role);
                user.put("department", nvl(department));
                user.put("passwordHash", ""); // bắt buộc đặt mật khẩu khi đăng nhập lần đầu
                user.put("active", input.get("active") == Boolean.FALSE ? 0 : 1);
                store.insertUserBasic(user, now);
                created++;
            }
        }
        return Map.of("message", "Đã nhập " + rows.size() + " tài khoản: " + created + " mới, " + updated
                + " cập nhật" + (errors.isEmpty() ? "." : "; " + errors.size() + " dòng bỏ qua do thiếu dữ liệu."));
    }

    // ============ factory reset ============
    public Map<String, Object> factoryResetPreview(Principal principal, Map<String, Object> payload) {
        rbac.requireRole(principalAsCurrent(principal), List.of("admin"));
        List<Map<String, Object>> rows = store.factoryResetPreview();
        return Map.of("message", "Xem trước dữ liệu sẽ bị xóa trước khi reset kiểm thử.",
                "items", rows, "confirmText", "RESET_ALL");
    }

    public Map<String, Object> factoryResetExecute(Principal principal, Map<String, Object> payload) {
        rbac.requireRole(principalAsCurrent(principal), List.of("admin"));
        String confirmText = trim(payload.get("confirmText"));
        if (!"RESET_ALL".equals(confirmText)) throw Api("Xác nhận reset chưa đúng. Hãy nhập RESET_ALL.");
        int before = store.factoryResetExecute(confirmText, principal.userId(), Instant.now());
        return Map.of("message", "Đã reset dữ liệu nghiệp vụ (giữ master data và cấu hình); " + before
                + " yêu cầu cũ đã bị xóa.");
    }

    // ============ license ============
    public Map<String, Object> installLicenseFoundation(Principal principal, Map<String, Object> payload) {
        rbac.requireRole(principalAsCurrent(principal), List.of("admin"));
        String licenseKey = trim(payload.get("licenseKey"));
        String companyName = trim(payload.get("companyName"));
        if (licenseKey.isEmpty() || companyName.isEmpty()) throw Api("Khóa kích hoạt và tên công ty là bắt buộc.");
        String edition = blankDefault(trim(payload.get("edition")), "standard");
        store.installLicenseFoundation(licenseKey, companyName, edition, principal.userId(), Instant.now());
        return Map.of("message", "Đã kích hoạt nền tảng bản quyền cho " + companyName + ".");
    }

    public Map<String, Object> requestLicenseTransfer(Principal principal, Map<String, Object> payload) {
        rbac.requireRole(principalAsCurrent(principal), List.of("admin"));
        String licenseId = trim(payload.get("licenseId"));
        String toCompanyName = trim(payload.get("toCompanyName"));
        String reason = trim(payload.get("reason"));
        if (licenseId.isEmpty() || toCompanyName.isEmpty())
            throw Api("Chuyển bản quyền cần mã cài đặt và tên công ty nhận.");
        store.findLicense(licenseId).orElseThrow(() -> Api("Không tìm thấy bản cài đặt bản quyền."));
        store.requestLicenseTransfer(licenseId, toCompanyName, reason.isEmpty() ? null : reason,
                principal.userId(), Instant.now());
        return Map.of("message", "Đã gửi yêu cầu chuyển bản quyền; VNTECH sẽ xử lý thủ công qua phiếu chuyển.");
    }

    // ============ email / settings ============
    public Map<String, Object> retryEmail(Principal principal, Map<String, Object> payload) {
        rbac.requireRole(principalAsCurrent(principal), List.of("admin"));
        String pending = store.retryEmailQueue(100, Instant.now());
        return Map.of("message", "Hàng đợi email còn " + pending + " chưa gửi; sẽ thử lại ở lượt kế tiếp.");
    }

    public Map<String, Object> saveUiDisplaySettings(Principal principal, Map<String, Object> payload) {
        rbac.requireRole(principalAsCurrent(principal), List.of("admin"));
        Map<String, Object> settings = new LinkedHashMap<>();
        settings.put("theme", blankDefault(trim(payload.get("theme")), "light"));
        settings.put("primaryColor", nvl(payload.get("primaryColor")));
        settings.put("language", blankDefault(trim(payload.get("language")), "vi"));
        settings.put("dateFormat", blankDefault(trim(payload.get("dateFormat")), "DD/MM/YYYY"));
        settings.put("companyName", nvl(payload.get("companyName")));
        settings.put("logoUrl", nvl(payload.get("logoUrl")));
        store.upsertUiDisplaySettings(svJson(settings), principal.userId(), Instant.now());
        return Map.of("message", "Đã lưu giao diện hiển thị.");
    }

    public Map<String, Object> saveTrustDevelopmentSettings(Principal principal, Map<String, Object> payload) {
        rbac.requireRole(principalAsCurrent(principal), List.of("admin"));
        Map<String, Object> settings = new LinkedHashMap<>();
        settings.put("developerMode", payload.get("developerMode") == Boolean.TRUE);
        settings.put("allowTestData", payload.get("allowTestData") == Boolean.TRUE);
        settings.put("debugLogging", payload.get("debugLogging") == Boolean.TRUE);
        settings.put("apiSandbox", payload.get("apiSandbox") == Boolean.TRUE);
        store.upsertTrustSettings(svJson(settings), principal.userId(), Instant.now());
        return Map.of("message", "Đã lưu cấu hình môi trường phát triển.");
    }

    // ---- helpers ----
    private static String svJson(Map<String, Object> m) {
        StringBuilder sb = new StringBuilder("{");
        boolean first = true;
        for (Map.Entry<String, Object> e : m.entrySet()) {
            if (!first) sb.append(",");
            first = false;
            sb.append('"').append(e.getKey().replace("\"", "\\\"")).append("\":");
            Object v = e.getValue();
            if (v == null) sb.append("null");
            else if (v instanceof Number || v instanceof Boolean) sb.append(v);
            else sb.append('"').append(String.valueOf(v).replace("\"", "\\\"")).append('"');
        }
        return sb.append('}').toString();
    }

    private static String normalizeVietnamDate(Object o) {
        String raw = trim(o);
        if (raw.isEmpty()) return null;
        if (raw.matches("\\d{4}-\\d{2}-\\d{2}")) return raw;
        java.util.regex.Matcher m = java.util.regex.Pattern.compile("(\\d{1,2})/(\\d{1,2})/(\\d{4})").matcher(raw);
        if (m.matches()) {
            return String.format("%04d-%02d-%02d", Integer.parseInt(m.group(3)),
                    Integer.parseInt(m.group(2)), Integer.parseInt(m.group(1)));
        }
        return raw;
    }

    private static boolean isIsoDate(String s) {
        try { LocalDate.parse(s); return true; } catch (Exception e) { return false; }
    }

    private static int numI(Map<String, Object> row, String key) {
        return (int) Math.round(numberValue(row.get(key)));
    }
    private static double numberValue(Object o) {
        try { return o == null ? 0 : Double.parseDouble(String.valueOf(o)); }
        catch (NumberFormatException e) { return 0; }
    }
    private static String sv(Map<String, Object> m, String k) { Object v = m.get(k); return v == null ? "" : String.valueOf(v); }
    private static String trim(Object o) { return o == null ? "" : String.valueOf(o).trim(); }
    private static String nvl(Object o) { String s = trim(o); return s.isEmpty() ? null : s; }
    private static String blankDefault(String s, String fallback) { return s.isEmpty() ? fallback : s; }
    @SuppressWarnings("unchecked")
    private static Map<String, Object> asMap(Object o) { return o instanceof Map ? (Map) o : Map.of(); }
    private AuthUseCase.CurrentUser principalAsCurrent(Principal p) {
        return new AuthUseCase.CurrentUser(p.userId(), "", "", null, p.role(), p.role(), p.role(), null, null, null, false);
    }
    private static AuthUseCase.ApiError Api(String message) { return new AuthUseCase.ApiError(message, 400); }
}