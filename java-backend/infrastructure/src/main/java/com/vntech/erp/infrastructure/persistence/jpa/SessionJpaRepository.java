package com.vntech.erp.infrastructure.persistence.jpa;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Optional;

/** Spring Data repository sessions. */
public interface SessionJpaRepository extends JpaRepository<SessionJpaEntity, String> {

    Optional<SessionJpaEntity> findByTokenHash(String tokenHash);

    void deleteByTokenHash(String tokenHash);
}