package com.vntech.erp.application.port.out;

import com.vntech.erp.domain.entity.Project;

import java.util.List;
import java.util.Optional;

/**
 * Port (out) — repository Dự án do tầng application khai báo.
 * Tầng infrastructure implement (JPA/MySQL). Domain & application không biết JPA là gì.
 */
public interface ProjectRepository {

    Optional<Project> findById(String id);

    List<Project> findActiveOrderByCode();

    Project save(Project project);
}