package com.vntech.erp.infrastructure.persistence.jpa;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/** Spring Data repository users — chi tiết kỹ thuật ở infrastructure. */
public interface UserJpaRepository extends JpaRepository<UserJpaEntity, String> {

    long countByActiveTrue();

    Optional<UserJpaEntity> findByUsernameIgnoreCase(String username);
}