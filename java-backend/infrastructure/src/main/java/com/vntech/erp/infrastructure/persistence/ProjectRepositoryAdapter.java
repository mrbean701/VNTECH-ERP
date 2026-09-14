package com.vntech.erp.infrastructure.persistence;

import com.vntech.erp.application.port.out.ProjectRepository;
import com.vntech.erp.domain.entity.Project;
import com.vntech.erp.domain.valueobject.ProjectStatus;
import com.vntech.erp.infrastructure.persistence.jpa.ProjectJpaEntity;
import com.vntech.erp.infrastructure.persistence.jpa.ProjectJpaRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

/**
 * Adapter: port application (ProjectRepository) <- JPA/MySQL.
 * Chỉ nơi này biết Entity <-> Domain mapping; đổi ORM/DB chỉ sửa adapter này.
 */
@Component
public class ProjectRepositoryAdapter implements ProjectRepository {

    private final ProjectJpaRepository jpaRepository;

    public ProjectRepositoryAdapter(ProjectJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Optional<Project> findById(String id) {
        return jpaRepository.findById(id).map(this::toDomain);
    }

    @Override
    public List<Project> findActiveOrderByCode() {
        return jpaRepository.findByStatusOrderByCodeAsc(ProjectStatus.ACTIVE.code())
                .stream().map(this::toDomain).toList();
    }

    @Override
    public Project save(Project project) {
        ProjectJpaEntity saved = jpaRepository.save(toJpa(project));
        return toDomain(saved);
    }

    private Project toDomain(ProjectJpaEntity e) {
        return new Project(
                e.getId(), e.getCode(), e.getName(), ProjectStatus.fromCode(e.getStatus()),
                e.getManagerUserId(), e.getStartDate(), e.getPlannedEndDate(),
                e.getContractNo(), e.getContractName(), e.getCreatedAt(), e.getUpdatedAt());
    }

    private ProjectJpaEntity toJpa(Project p) {
        return new ProjectJpaEntity(
                p.id(), p.code(), p.name(), p.status().code(),
                p.managerUserId(), p.startDate(), p.plannedEndDate(),
                p.contractNo(), p.contractName(), p.createdAt(), p.updatedAt());
    }
}