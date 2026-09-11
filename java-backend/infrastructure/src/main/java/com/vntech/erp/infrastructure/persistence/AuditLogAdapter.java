package com.vntech.erp.infrastructure.persistence;

import com.vntech.erp.application.port.out.AuditLogPort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/** Ghi audit_logs — tương đương audit() của monolith JS. */
@Component
public class AuditLogAdapter implements AuditLogPort {

    private final JdbcTemplate jdbcTemplate;

    public AuditLogAdapter(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    @Transactional
    public void log(String userId, String action, String entityType, String entityId,
                    String beforeJson, String afterJson, String ipAddress) {
        jdbcTemplate.update("""
                INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id,
                                        before_json, after_json, ip_address, occurred_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, "AUD_" + java.util.UUID.randomUUID(), userId, action, entityType, entityId,
                beforeJson, afterJson, ipAddress, Instant.now());
    }
}