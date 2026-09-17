package com.vntech.erp.infrastructure.persistence;

import com.vntech.erp.application.port.out.SystemSettingsStore;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/** Adapter settings/license/factory reset/bulk import. */
@Component
public class SystemSettingsStoreAdapter implements SystemSettingsStore {

    private final JdbcTemplate jdbcTemplate;

    public SystemSettingsStoreAdapter(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private Optional<Map<String, Object>> first(String sql, Object... args) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, args);
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }

    @Override @Transactional
    public void upsertUiDisplaySettings(String json, String updatedBy, Instant now) {
        // SỬA LỖI 500 (TASK-039): câu lệnh cũ dùng id='UI' và THIẾU `scope_key` + `created_at`,
        // mà hai cột đó là NOT NULL không có giá trị mặc định ⇒ MySQL trả error 1364
        // "Field 'scope_key' doesn't have a default value".
        // Port lại ĐÚNG JS: id='UI-company', scope_key='company_default', có created_at.
        jdbcTemplate.update("""
                INSERT INTO ui_display_settings (id,scope_key,settings_json,updated_by,created_at,updated_at)
                VALUES ('UI-company','company_default',?,?,?,?)
                ON DUPLICATE KEY UPDATE settings_json=VALUES(settings_json),updated_by=VALUES(updated_by),
                    updated_at=VALUES(updated_at)""", json, updatedBy, now, now);
    }

    @Override
    public Map<String, Object> readUiDisplaySettings() {
        // JS đọc theo scope_key (KHÔNG phải theo id) — xem scripts/system-route.mjs
        Optional<Map<String, Object>> row = first(
                "SELECT settings_json AS settingsJson FROM ui_display_settings WHERE scope_key='company_default'");
        return row.orElseGet(Map::of);
    }

    @Override @Transactional
    public void updateTrustDevelopmentSettings(String auditId, String licenseServerUrl,
                                               String actorUserId, Instant now) {
        // SỬA LỖI 500 (TASK-039): câu lệnh cũ INSERT cột `settings_json` KHÔNG tồn tại trong bảng
        // và dùng id='TRUST' trong khi hàng thật là 'TRUST-ROOT'.
        // Port nguyên trạng JS: UPDATE đúng các cột có thật, rồi ghi 1 dòng audit.
        jdbcTemplate.update("""
                UPDATE vntech_trust_settings
                   SET trust_mode='development',enforcement_enabled=0,online_attestation_enabled=0,
                       license_server_url=?,updated_at=?
                 WHERE id='TRUST-ROOT'""", licenseServerUrl, now);
        jdbcTemplate.update("""
                INSERT INTO vntech_trust_audit
                    (id,event_type,actor_user_id,trust_mode,enforcement_enabled,license_id,
                     machine_fingerprint,detail_json,occurred_at)
                VALUES (?,?,?,?,?,?,?,?,?)""",
                auditId, "DEVELOPMENT_SETTINGS_UPDATED", actorUserId, "development", 0, null, null,
                "{\"licenseServerUrl\":" + (licenseServerUrl == null ? "null" : "\"" + licenseServerUrl + "\"")
                        + ",\"onlineAttestationEnabled\":false}", now);
    }

    @Override
    public Map<String, Object> readTrustSettings() {
        // JS đọc license_server_url theo id='TRUST-ROOT'
        Optional<Map<String, Object>> row = first(
                "SELECT license_server_url AS licenseServerUrl FROM vntech_trust_settings WHERE id='TRUST-ROOT'");
        return row.orElseGet(Map::of);
    }

    @Override
    public List<Map<String, Object>> factoryResetPreview() {
        return jdbcTemplate.queryForList("""
                SELECT 'material_requests' AS tableName, COUNT(*) AS rowCount FROM material_requests
                UNION ALL SELECT 'stock_movements', COUNT(*) FROM stock_movements
                UNION ALL SELECT 'purchase_orders', COUNT(*) FROM purchase_orders
                UNION ALL SELECT 'goods_receipts', COUNT(*) FROM goods_receipts
                UNION ALL SELECT 'capital_recovery_records', COUNT(*) FROM capital_recovery_records
                UNION ALL SELECT 'users (ngoài admin)', COUNT(*) FROM users WHERE role<>'admin'""");
    }

    @Override @Transactional
    public int factoryResetExecute(String confirmText, String userId, Instant now) {
        if (!"RESET_ALL".equals(confirmText)) return -1;
        int before = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM material_requests", Integer.class);
        jdbcTemplate.update("DELETE FROM stock_movements");
        jdbcTemplate.update("DELETE FROM contract_stock_ledger");
        jdbcTemplate.update("DELETE FROM stock_issues");
        jdbcTemplate.update("DELETE FROM material_returns");
        jdbcTemplate.update("DELETE FROM stock_counts");
        jdbcTemplate.update("DELETE FROM goods_receipts");
        jdbcTemplate.update("DELETE FROM purchase_orders");
        jdbcTemplate.update("DELETE FROM material_request_items");
        jdbcTemplate.update("DELETE FROM material_requests");
        jdbcTemplate.update("DELETE FROM central_returns");
        jdbcTemplate.update("DELETE FROM capital_recovery_records");
        jdbcTemplate.update("DELETE FROM contract_payments");
        jdbcTemplate.update("DELETE FROM transfer_orders");
        jdbcTemplate.update("DELETE FROM supply_workflow_steps");
        jdbcTemplate.update("DELETE FROM stock_reservations");
        jdbcTemplate.update("DELETE FROM procurement_allocations");
        jdbcTemplate.update("UPDATE users SET active=0 WHERE role<>'admin'");
        return before;
    }

    @Override @Transactional
    public void installLicenseFoundation(String licenseKey, String companyName, String edition, String activatedBy,
                                         Instant now) {
        jdbcTemplate.update("""
                INSERT INTO vntech_license_installations (id,license_key,company_name,edition,status,activated_by,
                                                          activated_at,created_at)
                VALUES (?,?,?,?,'active',?,?,?)
                ON DUPLICATE KEY UPDATE company_name=VALUES(company_name),edition=VALUES(edition),
                    status='active',activated_by=VALUES(activated_by),activated_at=VALUES(activated_at)""",
                "LCN" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase(), licenseKey,
                companyName, edition, activatedBy, now, now);
    }

    @Override
    public Optional<Map<String, Object>> findLicense(String id) {
        return first("SELECT * FROM vntech_license_installations WHERE id=?", id);
    }

    @Override @Transactional
    public void requestLicenseTransfer(String licenseId, String toCompanyName, String reason, String requestedBy,
                                       Instant now) {
        jdbcTemplate.update("""
                INSERT INTO vntech_license_transfer_requests (id,license_id,to_company_name,reason,status,
                                                              requested_by,created_at)
                VALUES (?,?,?,?,'pending',?,?)""",
                "LTR" + java.util.UUID.randomUUID().toString().substring(0, 8), licenseId, toCompanyName,
                reason, requestedBy, now);
        jdbcTemplate.update("""
                UPDATE vntech_license_installations SET status='transfer_requested',updated_at=? WHERE id=?""",
                now, licenseId);
    }

    @Override
    public String retryEmailQueue(int limit, Instant now) {
        Long pending = jdbcTemplate.queryForObject("""
                SELECT COUNT(*) FROM email_queue WHERE status='pending'""", Long.class);
        return pending == null ? "0" : String.valueOf(pending);
    }

    @Override public Optional<Map<String, Object>> findProjectByCodeUpper(String code) {
        return first("SELECT id,code,name,status FROM projects WHERE upper(code)=upper(?)", code);
    }

    @Override public Optional<Map<String, Object>> findSiteWarehouseForProject(String projectId) {
        return first("""
                SELECT id,code,name FROM warehouses WHERE project_id=? AND type='site' ORDER BY created_at LIMIT 1""",
                projectId);
    }

    @Override public Optional<Map<String, Object>> findWarehouseOwnerByCodeUpper(String code) {
        return first("SELECT id,project_id AS projectId FROM warehouses WHERE upper(code)=upper(?)", code);
    }

    @Override @Transactional
    public void updateProjectBasic(String projectId, String name, String status, String contractNo,
                                   String contractName, String startDate, String plannedEndDate, Instant now) {
        jdbcTemplate.update("""
                UPDATE projects SET name=?,status=?,contract_no=?,contract_name=?,start_date=?,planned_end_date=?,
                       updated_at=? WHERE id=?""", name, status, contractNo, contractName, startDate,
                plannedEndDate, now, projectId);
    }

    @Override @Transactional
    public void updateWarehouseBasic(String warehouseId, String code, String name, int active, Instant now) {
        jdbcTemplate.update("UPDATE warehouses SET code=?,name=?,active=?,updated_at=? WHERE id=?",
                code, name, active, now, warehouseId);
    }

    @Override @Transactional
    public void insertDefaultWarehouse(Map<String, Object> wh, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO warehouses (id,code,name,type,project_id,parent_warehouse_id,keeper_user_id,active,
                                        created_at,updated_at)
                VALUES (?,?,?,'site',?,'WH-CENTRAL',?,?,?,?)""",
                wh.get("id"), wh.get("code"), wh.get("name"), wh.get("projectId"), wh.get("keeperUserId"),
                wh.get("active"), now, now);
    }

    @Override @Transactional
    public void insertProjectBasic(Map<String, Object> p, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO projects (id,code,name,status,manager_user_id,start_date,planned_end_date,contract_no,
                                      contract_name,created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
                p.get("id"), p.get("code"), p.get("name"), p.get("status"), p.get("managerUserId"),
                p.get("startDate"), p.get("plannedEndDate"), p.get("contractNo"), p.get("contractName"), now, now);
    }

    @Override @Transactional
    public void insertUserProjectScopeAdmin(String userId, String projectId, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO user_project_scopes (id,user_id,project_id,permission,created_at,updated_at)
                VALUES (?,?,?,'admin',?,?)
                ON DUPLICATE KEY UPDATE permission='admin'""",
                "SCOPE_" + java.util.UUID.randomUUID(), userId, projectId, now, now);
    }

    @Override public Optional<Map<String, Object>> findUserByEmail(String email) {
        return first("SELECT id,email,full_name AS fullName,role,active FROM users WHERE lower(email)=lower(?)", email);
    }

    @Override public Optional<Map<String, Object>> findUserByUsername(String username) {
        return first("SELECT id,username,full_name AS fullName,role,active FROM users WHERE lower(username)=lower(?)", username);
    }

    @Override @Transactional
    public void insertUserBasic(Map<String, Object> u, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO users (id,username,email,full_name,role,password_hash,department,active,created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,?,?,?)""",
                u.get("id"), u.get("username"), u.get("email"), u.get("fullName"), u.get("role"),
                u.get("passwordHash"), u.get("department"), u.get("active"), now, now);
    }

    @Override @Transactional
    public void updateUserImported(Map<String, Object> u, Instant now) {
        jdbcTemplate.update("""
                UPDATE users SET full_name=?,role=?,department=?,active=?,updated_at=? WHERE id=?""",
                u.get("fullName"), u.get("role"), u.get("department"), u.get("active"), now, u.get("id"));
    }
}