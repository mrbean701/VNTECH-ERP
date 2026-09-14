package com.vntech.erp.infrastructure.persistence;

import com.vntech.erp.application.port.out.ProjectScopeStore;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** Đọc user_project_scopes — native SQL đơn giản. */
@Component
public class ProjectScopeStoreAdapter implements ProjectScopeStore {

    private final JdbcTemplate jdbcTemplate;

    public ProjectScopeStoreAdapter(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> findProjectIdsByUserId(String userId) {
        return jdbcTemplate.queryForList(
                "SELECT project_id AS id FROM user_project_scopes WHERE user_id = ?", String.class, userId);
    }
}