package com.vntech.erp.application.service;

import com.vntech.erp.application.port.out.ProjectRepository;
import com.vntech.erp.domain.entity.Project;

import java.util.List;

/**
 * Use-case mẫu: danh sách dự án đang hoạt động (bootstrap side).
 * Thuần Java — test unit không cần DB, chỉ cần fake ProjectRepository.
 */
public final class ListActiveProjectsUseCase {

    private final ProjectRepository projectRepository;

    public ListActiveProjectsUseCase(ProjectRepository projectRepository) {
        this.projectRepository = projectRepository;
    }

    public List<Project> list() {
        return projectRepository.findActiveOrderByCode();
    }
}