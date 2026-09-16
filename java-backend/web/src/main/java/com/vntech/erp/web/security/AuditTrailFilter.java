package com.vntech.erp.web.security;

import com.vntech.erp.application.rbac.ActionRbacRegistry;
import com.vntech.erp.application.port.out.AuditLogPort;
import com.vntech.erp.application.service.AuthUseCase;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;

import java.io.IOException;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

/**
 * P6 — GHI NHẬT KÝ KIỂM TOÁN CHO MỌI ACTION THAY ĐỔI DỮ LIỆU.
 *
 * VÌ SAO DÙNG FILTER thay vì sửa `SystemController.post()`: bộ điều phối action ở đó là
 * một `switch` hơn 1.200 dòng, mỗi nhánh `return` ngay nên không có điểm chèn chung.
 * Filter bọc ngoài nên phủ được MỌI action hiện có và mọi action thêm sau này mà không
 * phải sửa từng nhánh.
 *
 * Nguyên tắc:
 *   • Chỉ ghi khi POST `/api/system` trả về 2xx (action đã thành công thật).
 *   • Bỏ qua các action không làm thay đổi dữ liệu (đăng nhập/đăng xuất/cài đặt đầu/đọc).
 *   • Mọi lỗi khi ghi nhật ký đều bị nuốt — nhật ký KHÔNG được làm hỏng nghiệp vụ.
 */
@Component
@Order(20)
public class AuditTrailFilter extends OncePerRequestFilter {

    /** Action không làm thay đổi dữ liệu nghiệp vụ ⇒ không ghi nhật ký. */
    private static final Set<String> SKIP_ACTIONS = Set.of(
            "login", "logout", "setup", "system_level_impact", "check_login",
            "heartbeat", "ping");

    private final AuthUseCase authUseCase;
    private final AuditLogPort auditLogPort;
    private final com.vntech.erp.application.port.out.UserAdminStore userAdminStore;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public AuditTrailFilter(AuthUseCase authUseCase, AuditLogPort auditLogPort,
                            com.vntech.erp.application.port.out.UserAdminStore userAdminStore) {
        this.authUseCase = authUseCase;
        this.auditLogPort = auditLogPort;
        this.userAdminStore = userAdminStore;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !"POST".equalsIgnoreCase(request.getMethod())
                || !request.getRequestURI().startsWith("/api/system");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        ContentCachingRequestWrapper cached = new ContentCachingRequestWrapper(request, 64 * 1024);
        chain.doFilter(cached, response);
        try {
            if (response.getStatus() < 200 || response.getStatus() >= 300) return;
            byte[] body = cached.getContentAsByteArray();
            if (body.length == 0) return;
            @SuppressWarnings("unchecked")
            Map<String, Object> payload = objectMapper.readValue(body, Map.class);
            String action = payload.get("action") == null ? "" : String.valueOf(payload.get("action")).trim();
            if (action.isEmpty() || SKIP_ACTIONS.contains(action)) return;
            auditLogPort.logDetailed(buildEntry(action, payload, request));
        } catch (Exception ignored) {
            // Nhật ký không được phép làm hỏng nghiệp vụ.
        }
    }

    private Map<String, Object> buildEntry(String action, Map<String, Object> payload, HttpServletRequest request) throws IOException {
        Map<String, Object> entry = new LinkedHashMap<>();
        entry.put("action", action);
        entry.put("ipAddress", clientIp(request));

        Optional<AuthUseCase.CurrentUser> user = authUseCase.currentUser(tokenOf(request), Instant.now());
        if (user.isPresent()) {
            AuthUseCase.CurrentUser cu = user.get();
            entry.put("userId", cu.id());
            entry.put("userName", cu.fullName());
            entry.put("userRole", cu.role());
            entry.put("department", cu.department());
            entry.put("systemLevel", systemLevelOf(cu.id()));
        }

        String moduleKey = ActionRbacRegistry.modulesFor(action).stream().findFirst().orElse(null);
        entry.put("moduleKey", moduleKey);
        entry.put("permissionUsed", ActionRbacRegistry.capabilityFor(action));

        entry.put("entityType", entityTypeOf(action, moduleKey));
        entry.put("entityId", entityIdOf(payload));

        // after_json = chính payload người dùng gửi (đã lược bớt trường nhạy cảm).
        Map<String, Object> safe = new LinkedHashMap<>(payload);
        safe.remove("action");
        for (String secret : new String[]{"password", "newPassword", "confirmPassword", "currentPassword", "token"}) {
            if (safe.containsKey(secret)) safe.put(secret, "***");
        }
        entry.put("afterJson", objectMapper.writeValueAsString(safe));
        entry.put("changeDetail", describe(action, payload, moduleKey));
        return entry;
    }

    /** Mô tả ngắn, đọc được bằng mắt — hiển thị thẳng trên tab Audit log. */
    private static String describe(String action, Map<String, Object> payload, String moduleKey) {
        StringBuilder sb = new StringBuilder(action);
        if (moduleKey != null && !moduleKey.isBlank()) sb.append(" · chức năng ").append(moduleKey);
        String id = entityIdOf(payload);
        if (!id.isBlank()) sb.append(" · đối tượng ").append(id);
        int fields = payload.size() - 1;
        if (fields > 0) sb.append(" · ").append(fields).append(" trường thay đổi");
        return sb.toString();
    }

    private static String entityIdOf(Map<String, Object> payload) {
        for (String key : new String[]{"id", "userId", "projectId", "requestId", "workflowId", "levelId",
                "stageId", "groupId", "roleId", "materialId", "teamId", "warehouseId", "organizationUnitId",
                "moduleKey", "code"}) {
            Object v = payload.get(key);
            if (v != null && !String.valueOf(v).isBlank()) return String.valueOf(v);
        }
        return "";
    }

    private static String entityTypeOf(String action, String moduleKey) {
        if (moduleKey != null && !moduleKey.isBlank()) return moduleKey;
        int underscore = action.indexOf('_');
        return underscore > 0 ? action.substring(0, underscore) : action;
    }

    /**
     * Cấp bậc hệ thống của người thực hiện (P5) — đọc từ system_level_catalog qua user.
     * Đọc CẢ HAI khoá `levelCode` và `levelcode`: MySQL giữ nguyên văn nhãn alias còn H2
     * viết thường, nên nếu chỉ đọc một khoá thì cấp bậc sẽ rỗng ở một trong hai môi trường.
     */
    private String systemLevelOf(String userId) {
        try {
            return userAdminStore.findUserSystemLevel(userId)
                    .map((l) -> {
                        Object v = l.get("levelCode");
                        if (v == null) v = l.get("levelcode");
                        return v == null ? null : String.valueOf(v);
                    })
                    .orElse(null);
        } catch (Exception e) {
            return null;
        }
    }

    private static String tokenOf(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) return null;
        for (Cookie c : cookies) {
            if (SessionCookieFactory.COOKIE_NAME.equals(c.getName())) {
                return SessionCookieFactory.decode(c.getValue());
            }
        }
        return null;
    }

    private static String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("x-forwarded-for");
        if (forwarded != null && !forwarded.isBlank()) return forwarded.split(",")[0].trim();
        return request.getRemoteAddr();
    }
}
