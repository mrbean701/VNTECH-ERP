package com.vntech.erp.application.service;

import com.vntech.erp.application.port.out.AuditLogPort;
import com.vntech.erp.application.port.out.IdGenerator;
import com.vntech.erp.application.port.out.LoginLockout;
import com.vntech.erp.application.port.out.PasswordHasher;
import com.vntech.erp.application.port.out.SessionStore;
import com.vntech.erp.application.port.out.SystemSetupPort;
import com.vntech.erp.application.port.out.UserRepository;
import com.vntech.erp.domain.entity.User;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Optional;

/**
 * Use-case xác thực — port nguyên trạng từ monolith JS (handleSetup/handleLogin/logout/currentUser):
 *  - password policy: >=8 ký tự, 1 hoa, 1 thường, 1 số, 1 đặc biệt
 *  - PBKDF2-SHA256 600.000 vòng, định dạng `pbkdf2$iter$salt$hash` (tương thích JS)
 *  - session 24h, cookie mep_session, token SHA-256
 *  - rotate hash khi login với iterations < 600.000 (hash cũ của bản JS)
 *  - lockout đăng nhập 10 lần/15 phút (theo ip+username, như universal-server)
 *  - revoke_session / revoke_user_sessions, update_profile_avatar, change_password (đăng xuất thiết bị khác)
 */
public final class AuthUseCase {

    public static final int SESSION_HOURS = 24;
    public static final int LOGIN_MAX_FAILURES = 10;
    private static final int PASSWORD_MIN_LENGTH = 8;

    private final UserRepository userRepository;
    private final SessionStore sessionStore;
    private final PasswordHasher passwordHasher;
    private final IdGenerator idGenerator;
    private final SystemSetupPort systemSetupPort;
    private final LoginLockout loginLockout;
    private final AuditLogPort auditLogPort;

    public AuthUseCase(UserRepository userRepository, SessionStore sessionStore,
                       PasswordHasher passwordHasher, IdGenerator idGenerator,
                       SystemSetupPort systemSetupPort, LoginLockout loginLockout,
                       AuditLogPort auditLogPort) {
        this.userRepository = userRepository;
        this.sessionStore = sessionStore;
        this.passwordHasher = passwordHasher;
        this.idGenerator = idGenerator;
        this.systemSetupPort = systemSetupPort;
        this.loginLockout = loginLockout;
        this.auditLogPort = auditLogPort;
    }

    public record SessionToken(String token, Instant expiresAt) { }

    public record SetupResult(SessionToken session) { }

    public record LoginResult(SessionToken session, boolean mustChangePassword) { }

    public record CurrentUser(String id, String fullName, String username, String email, String role,
                              String roleBase, String roleName, String warehouseScopeKind,
                              String department, String avatarUrl, boolean mustChangePassword) { }

    /** Kiểm tra chặn đăng nhập — trả true nếu (ip,username) đang bị chặn (10 lần/15 phút). */
    public boolean isLoginLocked(String ipAddress, String username) {
        return loginLockout.failureCount(ipAddress, username.toLowerCase(Locale.ROOT)) >= LOGIN_MAX_FAILURES;
    }

    public static String passwordPolicyError(String value) {
        String password = value == null ? "" : value;
        if (password.length() < PASSWORD_MIN_LENGTH) return "Mật khẩu phải có ít nhất 8 ký tự.";
        if (!password.matches(".*[A-Z].*")) return "Mật khẩu phải có ít nhất 1 chữ hoa.";
        if (!password.matches(".*[a-z].*")) return "Mật khẩu phải có ít nhất 1 chữ thường.";
        if (!password.matches(".*[0-9].*")) return "Mật khẩu phải có ít nhất 1 chữ số.";
        if (!password.matches(".*[^A-Za-z0-9].*")) return "Mật khẩu phải có ít nhất 1 ký tự đặc biệt.";
        return "";
    }

    /** Hệ thống đã khởi tạo khi có >=1 user — đồng bộ handleSetup JS (409). */
    public boolean isSetupComplete() {
        return userRepository.count() > 0;
    }

    /** Cài đặt lần đầu: tạo admin + seed masters + mở phiên. Ném ApiError 409 nếu đã khởi tạo. */
    public SetupResult setup(String companyName, String fullName, String username, String email, String password) {
        if (isSetupComplete()) {
            throw new ApiError("Hệ thống đã được khởi tạo.", 409);
        }
        String name = trim(companyName);
        String adminName = trim(fullName);
        String uname = trim(username).toLowerCase();
        String mail = trim(email).toLowerCase();
        String pass = trim(password);
        if (name.isEmpty() || adminName.isEmpty() || uname.isEmpty()) {
            throw new ApiError("Cần nhập đủ tên công ty, quản trị viên và tên đăng nhập.", 400);
        }
        String passwordError = passwordPolicyError(pass);
        if (!passwordError.isEmpty()) throw new ApiError(passwordError, 400);

        String adminId = idGenerator.next("USR");
        Instant now = Instant.now();
        User admin = new User(adminId, "ADMIN-001", adminName, uname, mail.isEmpty() ? null : mail,
                passwordHasher.hash(pass), "admin", "Công ty VNTECH", null,
                999999999999.0, true, false, null);
        userRepository.save(admin);
        systemSetupPort.seedMasters(adminId, name, now);
        return new SetupResult(createSession(adminId, now, null, null));
    }

    /** Đăng nhập. Lockout 10 lần/15 phút; lỗi chung 401 không lộ tài khoản tồn tại. */
    public LoginResult login(String username, String password, String ipAddress, String userAgent) {
        String uname = trim(username).toLowerCase(Locale.ROOT);
        String pass = trim(password);
        if (isLoginLocked(ipAddress, uname)) {
            throw new ApiError("Tạm khóa đăng nhập 15 phút do nhập sai quá nhiều lần.", 429);
        }
        Optional<User> found = userRepository.findByUsernameIgnoreCase(uname);
        if (found.isEmpty() || found.get().passwordHash() == null
                || !passwordHasher.verify(pass, found.get().passwordHash())) {
            loginLockout.registerFailure(ipAddress, uname);
            throw new ApiError("Tên đăng nhập hoặc mật khẩu không đúng.", 401);
        }
        loginLockout.clearFailures(ipAddress, uname);
        User user = found.get();
        // Rotate hash nếu iterations cũ < 600.000 (hash từ bản JS giai đoạn đầu)
        if (passwordHasher.storedIterations(user.passwordHash()) < 600_000) {
            user.replacePasswordHash(passwordHasher.hash(pass));
            userRepository.save(user);
        }
        SessionToken session = createSession(user.id(), Instant.now(), ipAddress, userAgent);
        return new LoginResult(session, user.mustChangePassword());
    }

    public void logout(String token) {
        if (token == null || token.isBlank()) return;
        sessionStore.deleteByTokenHash(sha256Hex(token));
    }

    /** Đổi mật khẩu (change_password) — verify mật khẩu cũ, kiểm chính sách, đăng xuất thiết bị khác, audit. */
    public void changePassword(String userId, String oldPassword, String newPassword, String keepTokenHash) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiError("Không tìm thấy tài khoản.", 404));
        if (user.passwordHash() == null || !passwordHasher.verify(oldPassword, user.passwordHash())) {
            throw new ApiError("Mật khẩu hiện tại không đúng.", 400);
        }
        String policyError = passwordPolicyError(newPassword);
        if (!policyError.isEmpty()) throw new ApiError(policyError, 400);
        if (oldPassword.equals(newPassword)) {
            throw new ApiError("Mật khẩu mới phải khác mật khẩu hiện tại.", 400);
        }
        user.replacePasswordHash(passwordHasher.hash(newPassword));
        user.clearMustChangePassword();
        userRepository.save(user);
        // JS: DELETE sessions WHERE user_id=? AND token_hash<>keepHash (giữ phiên hiện tại)
        if (keepTokenHash != null && !keepTokenHash.isBlank()) {
            sessionStore.deleteByUserIdExceptTokenHash(userId, keepTokenHash);
        } else {
            sessionStore.deleteByUserId(userId);
        }
        auditLogPort.log(userId, "PASSWORD_CHANGE", "user", userId, null,
                "{\"passwordPolicy\":\"8+ upper/lower/number/special\",\"otherSessionsRevoked\":true}", null);
    }

    /** Thu hồi 1 phiên (revoke_session — admin). */
    public String revokeSession(String sessionId) {
        SessionStore.SessionInfo info = sessionStore.findInfoById(sessionId)
                .orElseThrow(() -> new ApiError("Phiên đăng nhập không còn tồn tại.", 400));
        sessionStore.deleteById(sessionId);
        auditLogPort.log(null, "REVOKE_SESSION", "session", sessionId,
                "{\"userId\":\"" + info.userId() + "\",\"username\":\"" + info.username() + "\"}", null, null);
        return "Đã thu hồi phiên đăng nhập của " + info.username() + ".";
    }

    /** Đăng xuất toàn bộ thiết bị của 1 user (revoke_user_sessions — admin). */
    public String revokeUserSessions(String targetUserId) {
        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ApiError("Tài khoản không tồn tại.", 400));
        sessionStore.deleteByUserId(targetUserId);
        auditLogPort.log(null, "REVOKE_USER_SESSIONS", "user", targetUserId,
                "{\"username\":\"" + target.username() + "\"}", null, null);
        return "Đã đăng xuất toàn bộ thiết bị của " + target.username() + ".";
    }

    /** Cập nhật/xóa ảnh đại diện (update_profile_avatar) — data URL JPG/PNG/WebP <= 2MB như JS. */
    public String updateProfileAvatar(String userId, String avatarDataUrl) {
        if (avatarDataUrl != null && !avatarDataUrl.isBlank()
                && !avatarDataUrl.matches("(?i)^data:image/(png|jpeg|webp);base64,.*")) {
            throw new ApiError("Ảnh đại diện chỉ hỗ trợ JPG, PNG hoặc WebP.", 400);
        }
        if (avatarDataUrl != null && avatarDataUrl.length() > 2_800_000) {
            throw new ApiError("Ảnh đại diện vượt quá giới hạn 2 MB.", 400);
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiError("Không tìm thấy tài khoản.", 404));
        user.changeAvatar(avatarDataUrl == null || avatarDataUrl.isBlank() ? null : avatarDataUrl);
        userRepository.save(user);
        auditLogPort.log(userId, "AVATAR_CHANGE", "user", userId, null,
                "{\"avatarUpdated\":" + (avatarDataUrl != null && !avatarDataUrl.isBlank()) + "}", null);
        return avatarDataUrl == null || avatarDataUrl.isBlank()
                ? "Đã xóa ảnh đại diện." : "Đã cập nhật ảnh đại diện.";
    }

    /** User từ cookie mep_session (token thô) — hoặc empty nếu không hợp lệ. */
    public Optional<CurrentUser> currentUser(String rawToken, Instant now) {
        if (rawToken == null || rawToken.isBlank()) return Optional.empty();
        return sessionStore.findActiveUserByValidToken(sha256Hex(rawToken), now)
                .map(u -> {
                    // Port nguyên trạng JS: roleBase/roleName/warehouseScopeKind lấy từ role_catalog
                    // theo COALESCE(rc.<cột>,u.role); không có dòng role_catalog thì rơi về mã vai trò.
                    UserRepository.RoleCatalogInfo info =
                            userRepository.findRoleCatalogInfo(u.role()).orElse(null);
                    String roleBase = firstNonBlank(info == null ? null : info.baseRole(), u.role());
                    String roleName = firstNonBlank(info == null ? null : info.name(), u.role());
                    String scopeKind = blankToNull(info == null ? null : info.warehouseScopeKind());
                    return new CurrentUser(u.id(), u.fullName(), u.username(), u.email(), u.role(),
                            roleBase, roleName, scopeKind, u.department(), u.avatarUrl(),
                            u.mustChangePassword());
                });
    }

    private static String firstNonBlank(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }

    private SessionToken createSession(String userId, Instant now, String ipAddress, String userAgent) {
        String token = idGenerator.nextRaw() + idGenerator.nextRaw(); // 2 uuid như JS
        Instant expiresAt = now.plus(Duration.ofHours(SESSION_HOURS));
        sessionStore.create(idGenerator.next("SES"), userId, sha256Hex(token), expiresAt,
                ipAddress, userAgent, now);
        return new SessionToken(token, expiresAt);
    }

    public static String sha256Hex(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }

    private static String trim(String value) {
        return value == null ? "" : value.trim();
    }

    /** Lỗi nghiệp vụ có HTTP status — web layer map thành {ok:false,error}. */
    public static final class ApiError extends RuntimeException {
        private final int status;
        public ApiError(String message, int status) {
            super(message);
            this.status = status;
        }
        public int status() { return status; }
    }
}