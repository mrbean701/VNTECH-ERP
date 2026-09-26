package com.vntech.erp.infrastructure.persistence;

import com.vntech.erp.application.port.out.UserRepository;
import com.vntech.erp.domain.entity.User;
import com.vntech.erp.infrastructure.persistence.jpa.UserJpaEntity;
import com.vntech.erp.infrastructure.persistence.jpa.UserJpaRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/** Adapter: UserRepository port <- JPA/MySQL. Mapping Entity <-> Domain chỉ nằm ở đây. */
@Component
public class UserRepositoryAdapter implements UserRepository {

    private final UserJpaRepository jpaRepository;
    private final JdbcTemplate jdbcTemplate;

    public UserRepositoryAdapter(UserJpaRepository jpaRepository, JdbcTemplate jdbcTemplate) {
        this.jpaRepository = jpaRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public long count() {
        return jpaRepository.countByActiveTrue();
    }

    // MT2-P12-04 (§13.3) — ghi mốc đăng nhập gần nhất. ⛔ UPDATE 1 cột, ⛔ KHÔNG chạm mật khẩu/active.
    //   `CURRENT_TIMESTAMP` chạy giống nhau trên MySQL 8 và H2 (bài học cũ ở `stockIssueGrnLines`).
    @Override
    public void touchLastLogin(String userId, java.time.Instant at) {
        jdbcTemplate.update("UPDATE users SET last_login_at=? WHERE id=?",
                java.sql.Timestamp.from(at == null ? java.time.Instant.now() : at), userId);
    }

    @Override
    public Optional<User> findByUsernameIgnoreCase(String username) {
        return jpaRepository.findByUsernameIgnoreCase(username).filter(UserJpaEntity::isActive).map(this::toDomain);
    }

    @Override
    public Optional<User> findById(String id) {
        return jpaRepository.findById(id).map(this::toDomain);
    }

    /**
     * role_catalog theo mã vai trò — đúng các cột mà JS lấy khi dựng phiên đăng nhập.
     * KHÔNG lọc active: JS dùng {@code LEFT JOIN role_catalog rc ON rc.code=u.role} không kèm điều kiện,
     * nên vai trò đã ngừng hoạt động vẫn phải phân giải được base_role cho tài khoản còn đang đăng nhập.
     */
    @Override
    @Transactional(readOnly = true)
    public Optional<RoleCatalogInfo> findRoleCatalogInfo(String roleCode) {
        if (roleCode == null || roleCode.isBlank()) return Optional.empty();
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT base_role AS baseRole,name,warehouse_scope_kind AS warehouseScopeKind
                FROM role_catalog WHERE code=?""", roleCode);
        if (rows.isEmpty()) return Optional.empty();
        Map<String, Object> row = rows.get(0);
        return Optional.of(new RoleCatalogInfo(str(row.get("baseRole")), str(row.get("name")),
                str(row.get("warehouseScopeKind"))));
    }

    @Override
    @Transactional
    public User save(User user) {
        UserJpaEntity entity = jpaRepository.findById(user.id())
                .map(existing -> merge(existing, user))
                .orElseGet(() -> new UserJpaEntity(
                        user.id(), user.employeeCode(), user.fullName(), user.username(), user.email(),
                        user.passwordHash(), user.role(), user.department(), user.organizationUnitId(),
                        user.approvalLimit(), user.active(), user.mustChangePassword(), user.avatarUrl(),
                        Instant.now(), Instant.now()));
        return toDomain(jpaRepository.save(entity));
    }

    private UserJpaEntity merge(UserJpaEntity existing, User user) {
        existing.setPasswordHash(user.passwordHash());
        existing.setAvatarUrl(user.avatarUrl());
        // MT2 §13.4 — chữ ký: gán giá trị hiện tại của domain (null ⇒ XOÁ chữ ký — «thay/xoá ảnh cũ»).
        existing.setSignatureUrl(user.signatureUrl());
        existing.setUpdatedAt(Instant.now());
        return existing;
    }

    private User toDomain(UserJpaEntity e) {
        User user = new User(e.getId(), e.getEmployeeCode(), e.getFullName(), e.getUsername(), e.getEmail(),
                e.getPasswordHash(), e.getRole(), e.getDepartment(), e.getOrganizationUnitId(),
                e.getApprovalLimit(), e.isActive(), e.isMustChangePassword(), e.getAvatarUrl());
        // ⚠️ `User.signatureUrl` ⛔ KHÔNG nằm trong hàm khởi tạo (để ⛔ không vỡ mọi `new User(...)`)
        // ⇒ nạp qua setter domain, đúng kế hoạch an toàn của MT2-P3-04.
        user.changeSignature(e.getSignatureUrl());
        return user;
    }

    private static String str(Object value) {
        return value == null ? "" : String.valueOf(value);
    }
}
