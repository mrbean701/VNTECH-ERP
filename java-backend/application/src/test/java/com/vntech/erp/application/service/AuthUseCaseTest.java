package com.vntech.erp.application.service;

import com.vntech.erp.application.port.out.AuditLogPort;
import com.vntech.erp.application.port.out.IdGenerator;
import com.vntech.erp.application.port.out.LoginLockout;
import com.vntech.erp.application.port.out.PasswordHasher;
import com.vntech.erp.application.port.out.SessionStore;
import com.vntech.erp.application.port.out.SystemSetupPort;
import com.vntech.erp.application.port.out.UserRepository;
import com.vntech.erp.domain.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Unit test AuthUseCase — dùng fake ports (không DB, không Spring).
 * Kiểm chứng hành vi KHỚP monolith JS: setup 409 khi đã khởi tạo, login 401 chung,
 * rotate hash khi iterations cũ, session 24h, logout xóa session.
 */
class AuthUseCaseTest {

    private InMemoryUserRepository users;
    private InMemorySessionStore sessions;
    private TestPasswordHasher passwordHasher;
    private boolean seeded = false;
    private AuthUseCase useCase;
    private TestLoginLockout lockout;
    private StringBuilder auditLog = new StringBuilder();

    private static final class InMemoryUserRepository implements UserRepository {
        final Map<String, User> byId = new HashMap<>();
        final Map<String, User> byUsername = new HashMap<>();
        // MT2-P12-04 (§13.3) — ghi lại mốc đăng nhập để test chứng minh CHỈ ghi khi đăng nhập thành công.
        final Map<String, Instant> lastLoginAt = new HashMap<>();
        @Override public long count() { return byId.size(); }
        @Override public Optional<User> findByUsernameIgnoreCase(String username) {
            return byUsername.values().stream()
                    .filter(u -> u.username().equalsIgnoreCase(username) && u.active()).findFirst();
        }
        @Override public Optional<User> findById(String id) { return Optional.ofNullable(byId.get(id)); }
        @Override public User save(User user) { byId.put(user.id(), user); byUsername.put(user.username(), user); return user; }
        @Override public void touchLastLogin(String userId, Instant at) { lastLoginAt.put(userId, at); }
        @Override public Optional<RoleCatalogInfo> findRoleCatalogInfo(String roleCode) {
            // Test double: không có bảng role_catalog nên base_role = chính mã vai trò.
            return Optional.of(new RoleCatalogInfo(roleCode, roleCode, null));
        }
    }

    private static final class InMemorySessionStore implements SessionStore {
        final Map<String, Session> byHash = new HashMap<>();
        final Map<String, Session> byId = new HashMap<>();
        record Session(String id, String tokenHash, String userId, Instant expiresAt, String username) { }
        @Override public void create(String sessionId, String userId, String tokenHash, Instant expiresAt,
                                     String ipAddress, String userAgent, Instant createdAt) {
            Session s = new Session(sessionId, tokenHash, userId, expiresAt, "admin");
            byHash.put(tokenHash, s);
            byId.put(sessionId, s);
        }
        @Override public Optional<User> findActiveUserByValidToken(String tokenHash, Instant now) {
            Session s = byHash.get(tokenHash);
            if (s == null || s.expiresAt.isBefore(now)) return Optional.empty();
            return Optional.of(new User(s.userId, "E1", "Nguyễn Văn A", "admin", null, null,
                    "admin", "VNTECH", null, 0, true, false, null));
        }
        @Override public void touchLastSeen(String tokenHash, Instant now) { }
        @Override public void deleteByTokenHash(String tokenHash) {
            Session s = byHash.remove(tokenHash);
            if (s != null) byId.remove(s.id);
        }
        @Override public boolean deleteById(String sessionId) {
            Session s = byId.remove(sessionId);
            if (s != null) { byHash.remove(s.tokenHash); return true; }
            return false;
        }
        @Override public int deleteByUserId(String userId) {
            int n = (int) byId.values().stream().filter(x -> x.userId.equals(userId)).count();
            byId.entrySet().removeIf(e -> e.getValue().userId.equals(userId));
            byHash.entrySet().removeIf(e -> e.getValue().userId.equals(userId));
            return n;
        }
        @Override public int deleteByUserIdExceptTokenHash(String userId, String keepTokenHash) {
            int n = (int) byId.values().stream()
                    .filter(x -> x.userId.equals(userId) && !x.tokenHash.equals(keepTokenHash)).count();
            byId.entrySet().removeIf(e -> e.getValue().userId.equals(userId) && !e.getValue().tokenHash.equals(keepTokenHash));
            byHash.entrySet().removeIf(e -> e.getValue().userId.equals(userId) && !e.getValue().tokenHash.equals(keepTokenHash));
            return n;
        }
        @Override public Optional<SessionInfo> findInfoById(String sessionId) {
            Session s = byId.get(sessionId);
            return s == null ? Optional.empty() : Optional.of(new SessionInfo(s.id, s.userId, s.username));
        }
    }

    private static final class TestPasswordHasher implements PasswordHasher {
        @Override public String hash(String password) { return "pbkdf2$600000$00$" + password.hashCode(); }
        @Override public boolean verify(String password, String storedHash) { return storedHash != null && storedHash.endsWith("$" + password.hashCode()); }
        @Override public int storedIterations(String storedHash) { return storedHash != null && storedHash.startsWith("pbkdf2$") ? 600000 : 0; }
    }

    private static final class TestLoginLockout implements LoginLockout {
        final Map<String, Integer> count = new HashMap<>();
        @Override public int failureCount(String ip, String user) { return count.getOrDefault(user, 0); }
        @Override public void registerFailure(String ip, String user) { count.merge(user, 1, Integer::sum); }
        @Override public void clearFailures(String ip, String user) { count.remove(user); }
    }

    @BeforeEach
    void setUp() {
        users = new InMemoryUserRepository();
        sessions = new InMemorySessionStore();
        passwordHasher = new TestPasswordHasher();
        lockout = new TestLoginLockout();
        IdGenerator idGen = new IdGenerator() {
            int n = 0;
            @Override public String next(String prefix) { return prefix + "_id" + (++n); }
            @Override public String nextRaw() { return "uuid" + (++n); }
        };
        useCase = new AuthUseCase(users, sessions, passwordHasher, idGen, new SystemSetupPort() {
            @Override public void seedMasters(String adminUserId, String companyName, Instant now) { seeded = true; }
        }, lockout, (userId, action, entityType, entityId, before, after, ip) ->
                auditLog.append(action).append(';'));
    }

    @Test
    void setup_createsAdminAndSession_with201Semantics() {
        AuthUseCase.SetupResult result = useCase.setup("Công ty VNTECH", "Quản trị viên", "admin", "admin@vntech.vn", "VnTech@123");
        assertTrue(users.count() == 1);
        assertTrue(seeded, "seedMasters phải được gọi khi setup");
        assertEquals("admin", users.byId.values().iterator().next().role());
        assertEquals(24, AuthUseCase.SESSION_HOURS);
        assertTrue(result.session().token().startsWith("uuid"));
    }

    @Test
    void setup_twice_throws409_likeJs() {
        useCase.setup("Công ty VNTECH", "Quản trị viên", "admin", null, "VnTech@123");
        AuthUseCase.ApiError e = assertThrows(AuthUseCase.ApiError.class,
                () -> useCase.setup("Cty", "Người khác", "admin2", null, "VnTech@123"));
        assertEquals(409, e.status());
        assertEquals("Hệ thống đã được khởi tạo.", e.getMessage());
    }

    @Test
    void setup_validatesRequiredFieldsAndPasswordPolicy() {
        AuthUseCase.ApiError e1 = assertThrows(AuthUseCase.ApiError.class,
                () -> useCase.setup("", "A", "admin", null, "VnTech@123"));
        assertEquals(400, e1.status());
        AuthUseCase.ApiError e2 = assertThrows(AuthUseCase.ApiError.class,
                () -> useCase.setup("Cty", "A", "admin", null, "vntech@12"));
        assertEquals("Mật khẩu phải có ít nhất 1 chữ hoa.", e2.getMessage());
    }

    @Test
    void login_success_returnsSessionAndMustChangeFlag() {
        useCase.setup("Cty", "A", "admin", null, "VnTech@123");
        AuthUseCase.LoginResult r = useCase.login("admin", "VnTech@123", "127.0.0.1", "test-agent");
        assertFalse(r.mustChangePassword());
        assertTrue(r.session().token().startsWith("uuid"));
    }

    @Test
    void login_wrongPassword_throws401_sameMessage() {
        useCase.setup("Cty", "A", "admin", null, "VnTech@123");
        AuthUseCase.ApiError e = assertThrows(AuthUseCase.ApiError.class,
                () -> useCase.login("admin", "WrongPass@1", "127.0.0.1", "agent"));
        assertEquals(401, e.status());
        assertEquals("Tên đăng nhập hoặc mật khẩu không đúng.", e.getMessage());
    }

    // ── MT2-P12-04 (§13.3) — mốc ĐĂNG NHẬP CUỐI cho danh sách tài khoản ─────────────────────────────
    @Test
    void login_success_recordsLastLoginAt_forAccountList() {
        useCase.setup("Cty", "A", "admin", null, "VnTech@123");
        Instant before = Instant.now();
        useCase.login("admin", "VnTech@123", "127.0.0.1", "agent");
        Instant recorded = users.lastLoginAt.get(users.byUsername.get("admin").id());
        assertTrue(recorded != null, "đăng nhập thành công phải ghi `last_login_at`");
        assertFalse(recorded.isBefore(before.minusSeconds(1)), "mốc đăng nhập phải là thời điểm vừa đăng nhập");
    }

    @Test
    void login_failure_doesNotTouchLastLoginAt() {
        useCase.setup("Cty", "A", "admin", null, "VnTech@123");
        assertThrows(AuthUseCase.ApiError.class,
                () -> useCase.login("admin", "WrongPass@1", "127.0.0.1", "agent"));
        assertTrue(users.lastLoginAt.isEmpty(),
                "⛔ đăng nhập SAI không được ghi `last_login_at` (sẽ bịa dữ liệu)");
    }

    @Test
    void login_success_updatesLastLoginAt_onEachLogin() throws InterruptedException {
        useCase.setup("Cty", "A", "admin", null, "VnTech@123");
        useCase.login("admin", "VnTech@123", "127.0.0.1", "agent");
        Instant first = users.lastLoginAt.get(users.byUsername.get("admin").id());
        // ⚠️ `Instant.now()` có độ phân giải mili-giây ⇒ 2 lần đăng nhập liền nhau có thể TRÙNG mốc.
        //    Chờ tối thiểu để quan sát được việc ghi ĐÈ (không giữ mốc cũ).
        Thread.sleep(10);
        useCase.logout(useCase.login("admin", "VnTech@123", "127.0.0.1", "agent").session().token());
        Instant second = users.lastLoginAt.get(users.byUsername.get("admin").id());
        assertFalse(second.equals(first), "mỗi lần đăng nhập phải cập nhật mốc (không giữ mốc cũ)");
        assertFalse(second.isBefore(first), "mốc đăng nhập phải đi tới, không lùi về quá khứ");
    }

    @Test
    void login_unknownUser_throws401_sameMessage_notLeakingExistence() {
        AuthUseCase.ApiError e = assertThrows(AuthUseCase.ApiError.class,
                () -> useCase.login("khongton tai", "Whatever@1", "127.0.0.1", "agent"));
        assertEquals(401, e.status());
        assertEquals("Tên đăng nhập hoặc mật khẩu không đúng.", e.getMessage());
    }

    @Test
    void passwordPolicyError_matchesJsRules() {
        assertEquals("", AuthUseCase.passwordPolicyError("VnTech@123"));
        assertEquals("Mật khẩu phải có ít nhất 8 ký tự.", AuthUseCase.passwordPolicyError("aA1!"));
        assertEquals("Mật khẩu phải có ít nhất 1 chữ hoa.", AuthUseCase.passwordPolicyError("vntech@12"));
        assertEquals("Mật khẩu phải có ít nhất 1 chữ thường.", AuthUseCase.passwordPolicyError("VNTECH@12"));
        assertEquals("Mật khẩu phải có ít nhất 1 chữ số.", AuthUseCase.passwordPolicyError("VnTech@ab"));
        assertEquals("Mật khẩu phải có ít nhất 1 ký tự đặc biệt.", AuthUseCase.passwordPolicyError("VnTech123"));
    }

    @Test
    void logout_deletesSession() {
        useCase.setup("Cty", "A", "admin", null, "VnTech@123");
        AuthUseCase.LoginResult login = useCase.login("admin", "VnTech@123", "127.0.0.1", "agent");
        String token = login.session().token();
        assertTrue(useCase.currentUser(token, Instant.now()).isPresent());
        useCase.logout(token);
        assertTrue(useCase.currentUser(token, Instant.now()).isEmpty());
    }

    @Test
    void currentUser_rejectsExpiredSession() {
        useCase.setup("Cty", "A", "admin", null, "VnTech@123");
        AuthUseCase.LoginResult login = useCase.login("admin", "VnTech@123", "127.0.0.1", "agent");
        Instant farFuture = Instant.now().plusSeconds(999999);
        assertTrue(useCase.currentUser(login.session().token(), farFuture).isEmpty());
    }

    @Test
    void changePassword_verifiesOld_thenLoginWithNewWorks() {
        useCase.setup("Cty", "A", "admin", null, "VnTech@123");
        String adminId = users.byUsername.get("admin").id();
        useCase.changePassword(adminId, "VnTech@123", "NewPass@456", null);

        // mật khẩu cũ không vào được nữa
        AuthUseCase.ApiError e = assertThrows(AuthUseCase.ApiError.class,
                () -> useCase.login("admin", "VnTech@123", "127.0.0.1", "agent"));
        assertEquals(401, e.status());
        // mật khẩu mới vào được
        AuthUseCase.LoginResult r = useCase.login("admin", "NewPass@456", "127.0.0.1", "agent");
        assertTrue(r.session().token().startsWith("uuid"));
    }

    @Test
    void changePassword_rejectsWrongOldAndWeakNew() {
        useCase.setup("Cty", "A", "admin", null, "VnTech@123");
        String adminId = users.byUsername.get("admin").id();
        AuthUseCase.ApiError e1 = assertThrows(AuthUseCase.ApiError.class,
                () -> useCase.changePassword(adminId, "SaiPass@1", "NewPass@456", null));
        assertEquals(400, e1.status());
        assertEquals("Mật khẩu hiện tại không đúng.", e1.getMessage());
        AuthUseCase.ApiError e2 = assertThrows(AuthUseCase.ApiError.class,
                () -> useCase.changePassword(adminId, "VnTech@123", "vntechpass1", null));
        assertEquals("Mật khẩu phải có ít nhất 1 chữ hoa.", e2.getMessage());
    }

    @Test
    void loginFailure_incrementsLockout_andBlocksAt10() {
        useCase.setup("Cty", "A", "admin", null, "VnTech@123");
        for (int i = 0; i < 10; i++) {
            assertThrows(AuthUseCase.ApiError.class,
                    () -> useCase.login("admin", "WrongPass@1", "1.2.3.4", "agent"));
        }
        assertTrue(useCase.isLoginLocked("1.2.3.4", "admin"), "sau 10 lần sai phải khóa");
        // đăng nhập đúng vẫn bị chặn khi đang khóa
        AuthUseCase.ApiError e = assertThrows(AuthUseCase.ApiError.class,
                () -> useCase.login("admin", "VnTech@123", "1.2.3.4", "agent"));
        assertEquals(429, e.status());
    }

    @Test
    void successfulLogin_clearsLockout() {
        useCase.setup("Cty", "A", "admin", null, "VnTech@123");
        for (int i = 0; i < 3; i++) {
            assertThrows(AuthUseCase.ApiError.class,
                    () -> useCase.login("admin", "WrongPass@1", "1.2.3.4", "agent"));
        }
        AuthUseCase.LoginResult ok = useCase.login("admin", "VnTech@123", "1.2.3.4", "agent");
        assertFalse(useCase.isLoginLocked("1.2.3.4", "admin"));
        assertTrue(ok.session().token().startsWith("uuid"));
    }

    @Test
    void revokeSession_deletesAndReportsUsername() {
        useCase.setup("Cty", "A", "admin", null, "VnTech@123");
        AuthUseCase.LoginResult r = useCase.login("admin", "VnTech@123", "1.2.3.4", "agent");
        String sessionId = sessions.byHash.values().iterator().next().id();
        String message = useCase.revokeSession(sessionId);
        assertTrue(message.contains("admin"));
        assertTrue(useCase.currentUser(r.session().token(), Instant.now()).isEmpty());
    }

    @Test
    void revokeUserSessions_logsOutAll() {
        useCase.setup("Cty", "A", "admin", null, "VnTech@123");
        AuthUseCase.LoginResult r1 = useCase.login("admin", "VnTech@123", "1.2.3.4", "agent");
        AuthUseCase.LoginResult r2 = useCase.login("admin", "VnTech@123", "2.2.2.2", "agent");
        String adminId = users.byUsername.get("admin").id();
        assertTrue(useCase.currentUser(r1.session().token(), Instant.now()).isPresent());
        String message = useCase.revokeUserSessions(adminId);
        assertTrue(message.contains("admin"));
        assertTrue(useCase.currentUser(r1.session().token(), Instant.now()).isEmpty());
        assertTrue(useCase.currentUser(r2.session().token(), Instant.now()).isEmpty());
    }

    @Test
    void updateProfileAvatar_validatesAndClears() {
        useCase.setup("Cty", "A", "admin", null, "VnTech@123");
        String adminId = users.byUsername.get("admin").id();
        String msg = useCase.updateProfileAvatar(adminId, "data:image/png;base64,iVBORw0KGgo=");
        assertEquals("Đã cập nhật ảnh đại diện.", msg);
        assertEquals("data:image/png;base64,iVBORw0KGgo=", users.byUsername.get("admin").avatarUrl());
        // avatar không hợp lệ
        AuthUseCase.ApiError e = assertThrows(AuthUseCase.ApiError.class,
                () -> useCase.updateProfileAvatar(adminId, "https://x/y.png"));
        assertEquals("Ảnh đại diện chỉ hỗ trợ JPG, PNG hoặc WebP.", e.getMessage());
        // xóa avatar
        String cleared = useCase.updateProfileAvatar(adminId, "");
        assertEquals("Đã xóa ảnh đại diện.", cleared);
    }
}