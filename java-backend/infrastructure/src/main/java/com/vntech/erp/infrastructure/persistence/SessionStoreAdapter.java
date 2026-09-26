package com.vntech.erp.infrastructure.persistence;

import com.vntech.erp.application.port.out.SessionStore;
import com.vntech.erp.domain.entity.User;
import com.vntech.erp.infrastructure.persistence.jpa.SessionJpaEntity;
import com.vntech.erp.infrastructure.persistence.jpa.SessionJpaRepository;
import com.vntech.erp.infrastructure.persistence.jpa.UserJpaEntity;
import com.vntech.erp.infrastructure.persistence.jpa.UserJpaRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

/** Adapter: SessionStore port <- JPA/MySQL. */
@Component
public class SessionStoreAdapter implements SessionStore {

    private final SessionJpaRepository sessionJpaRepository;
    private final UserJpaRepository userJpaRepository;

    public SessionStoreAdapter(SessionJpaRepository sessionJpaRepository, UserJpaRepository userJpaRepository) {
        this.sessionJpaRepository = sessionJpaRepository;
        this.userJpaRepository = userJpaRepository;
    }

    @Override
    @Transactional
    public void create(String sessionId, String userId, String tokenHash, Instant expiresAt,
                       String ipAddress, String userAgent, Instant createdAt) {
        sessionJpaRepository.save(new SessionJpaEntity(sessionId, userId, tokenHash, expiresAt,
                ipAddress, userAgent, createdAt, createdAt));
    }

    @Override
    @Transactional
    public Optional<User> findActiveUserByValidToken(String tokenHash, Instant now) {
        Optional<SessionJpaEntity> session = sessionJpaRepository.findByTokenHash(tokenHash);
        if (session.isEmpty() || session.get().getExpiresAt().isBefore(now)) return Optional.empty();
        Optional<UserJpaEntity> user = userJpaRepository.findById(session.get().getUserId());
        if (user.isEmpty() || !user.get().isActive()) return Optional.empty();
        return user.map(this::toDomain);
    }

    @Override
    @Transactional
    public void touchLastSeen(String tokenHash, Instant now) {
        sessionJpaRepository.findByTokenHash(tokenHash).ifPresent(s -> {
            s.setLastSeenAt(now);
            sessionJpaRepository.save(s);
        });
    }

    @Override
    @Transactional
    public void deleteByTokenHash(String tokenHash) {
        sessionJpaRepository.deleteByTokenHash(tokenHash);
    }

    @Override
    @Transactional
    public boolean deleteById(String sessionId) {
        boolean existed = sessionJpaRepository.existsById(sessionId);
        sessionJpaRepository.deleteById(sessionId);
        return existed;
    }

    @Override
    @Transactional
    public int deleteByUserId(String userId) {
        // Spring Data không có deleteByUserId trực tiếp -> query xóa tay qua JPQL-less: dùng find rồi delete
        var sessions = sessionJpaRepository.findAll().stream()
                .filter(s -> s.getUserId().equals(userId)).toList();
        sessionJpaRepository.deleteAll(sessions);
        return sessions.size();
    }

    @Override
    @Transactional
    public int deleteByUserIdExceptTokenHash(String userId, String keepTokenHash) {
        var sessions = sessionJpaRepository.findAll().stream()
                .filter(s -> s.getUserId().equals(userId) && !s.getTokenHash().equals(keepTokenHash)).toList();
        sessionJpaRepository.deleteAll(sessions);
        return sessions.size();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<SessionInfo> findInfoById(String sessionId) {
        return sessionJpaRepository.findById(sessionId)
                .flatMap(s -> userJpaRepository.findById(s.getUserId())
                        .map(u -> new SessionInfo(s.getId(), u.getId(), u.getUsername())));
    }

    private User toDomain(UserJpaEntity e) {
        User user = new User(e.getId(), e.getEmployeeCode(), e.getFullName(), e.getUsername(), e.getEmail(),
                e.getPasswordHash(), e.getRole(), e.getDepartment(), e.getOrganizationUnitId(),
                e.getApprovalLimit(), e.isActive(), e.isMustChangePassword(), e.getAvatarUrl());
        // MT2 §13.4 — chữ ký nằm NGOÀI hàm khởi tạo (⛔ không vỡ `new User(...)`) ⇒ nạp qua setter domain.
        user.changeSignature(e.getSignatureUrl());
        return user;
    }
}