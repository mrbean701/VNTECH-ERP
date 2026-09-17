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
        existing.setUpdatedAt(Instant.now());
        return existing;
    }

    private User toDomain(UserJpaEntity e) {
        return new User(e.getId(), e.getEmployeeCode(), e.getFullName(), e.getUsername(), e.getEmail(),
                e.getPasswordHash(), e.getRole(), e.getDepartment(), e.getOrganizationUnitId(),
                e.getApprovalLimit(), e.isActive(), e.isMustChangePassword(), e.getAvatarUrl());
    }

    private static String str(Object value) {
        return value == null ? "" : String.valueOf(value);
    }
}
