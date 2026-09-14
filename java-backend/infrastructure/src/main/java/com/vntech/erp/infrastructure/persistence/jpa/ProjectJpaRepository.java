package com.vntech.erp.infrastructure.persistence.jpa;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/** Spring Data repository — chi tiết kỹ thuật, nằm ở infrastructure. */
public interface ProjectJpaRepository extends JpaRepository<ProjectJpaEntity, String> {

    List<ProjectJpaEntity> findByStatusOrderByCodeAsc(String status);
}