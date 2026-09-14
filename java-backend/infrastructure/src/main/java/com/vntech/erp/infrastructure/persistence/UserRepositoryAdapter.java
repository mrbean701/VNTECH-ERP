package com.vntech.erp.infrastructure.persistence;

import com.vntech.erp.application.port.out.UserRepository;
import com.vntech.erp.domain.entity.User;
import com.vntech.erp.infrastructure.persistence.jpa.UserJpaEntity;
import com.vntech.erp.infrastructure.persistence.jpa.UserJpaRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

/** Adapter: UserRepository port <- JPA/MySQL. Mapping Entity <-> Domain chỉ nằm ở đây. */
@Component
public class UserRepositoryAdapter implements UserRepository {

    private final UserJpaRepository jpaRepository;

    public UserRepositoryAdapter(UserJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
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
}