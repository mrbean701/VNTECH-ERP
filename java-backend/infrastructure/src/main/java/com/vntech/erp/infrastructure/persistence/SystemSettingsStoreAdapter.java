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

    /**
     * MT2-P14-03b — NGỮ CẢNH TRUST ROOT để xác minh license. ⛔ KHÔNG hard-code: đọc từ CSDL như JS đọc
     * {@code VNTECH_IDENTITY} + {@code TRUST_STATE}. Nguồn: {@code vntech_trust_settings} hàng
     * {@code TRUST-ROOT} ({@code V3__reference_seed.sql:361}) và {@code vntech_product_identity} (1 hàng).
     *
     * <p>⚠️ BÀI HỌC ĐO ĐƯỢC (đã trả giá 1 vòng test): <b>H2 trả NHÃN CỘT VIẾT HOA</b> ({@code TENANTID}) còn
     * MySQL giữ nguyên camelCase ({@code tenantId}) ⇒ đọc map bằng khoá camelCase thì trên H2 mọi giá trị
     * RỖNG (hệ quả đo được: xác minh báo «keyId không thuộc Trust Root», «không thuộc tenant/công ty»,
     * «Unable to decode key») ⇒ PHẢI tra khoá <b>KHÔNG phân biệt hoa/thường</b>.
     */
    @Override
    public Map<String, Object> readTrustIdentity() {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("tenantId", "");
        out.put("companyCode", "");
        out.put("keyId", "");
        out.put("publicKeyPem", "");
        out.put("machineFingerprint", "");
        out.put("productId", "");
        first("""
                SELECT tenant_id AS tenantId, company_code AS companyCode, key_id AS keyId,
                       public_key_pem AS publicKeyPem, machine_fingerprint AS machineFingerprint
                  FROM vntech_trust_settings WHERE id='TRUST-ROOT'""")
                .ifPresent((row) -> {
                    out.put("tenantId", blankToEmpty(field(row, "tenantId")));
                    out.put("companyCode", blankToEmpty(field(row, "companyCode")));
                    out.put("keyId", blankToEmpty(field(row, "keyId")));
                    out.put("publicKeyPem", blankToEmpty(field(row, "publicKeyPem")));
                    out.put("machineFingerprint", blankToEmpty(field(row, "machineFingerprint")));
                });
        first("SELECT id AS productId FROM vntech_product_identity ORDER BY created_at LIMIT 1")
                .ifPresent((row) -> out.put("productId", blankToEmpty(field(row, "productId"))));
        return out;
    }

    /** Tra giá trị theo tên cột KHÔNG phân biệt hoa/thường (H2 trả HOA, MySQL trả camelCase). */
    private static Object field(Map<String, Object> row, String name) {
        for (Map.Entry<String, Object> entry : row.entrySet()) {
            if (entry.getKey() != null && entry.getKey().equalsIgnoreCase(name)) return entry.getValue();
        }
        return null;
    }

    private static String blankToEmpty(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    /**
     * MT2-P14-03b — ghi license ĐÃ XÁC MINH bằng <b>ĐÚNG 18 cột thật</b> của
     * {@code vntech_license_installations} (port JS {@code install_license_foundation}).
     *
     * <p>⚠️ Dùng <b>UPDATE-then-INSERT</b> thay cho {@code ON DUPLICATE KEY UPDATE} của JS để chạy được
     * trên <b>CẢ</b> MySQL (production) <b>VÀ</b> H2 (test) — cùng nghiệp vụ: mỗi {@code license_id} giữ 1 hàng.
     */
    @Override @Transactional
    public void installLicenseFoundation(Map<String, Object> installation) {
        String licenseId = String.valueOf(installation.getOrDefault("licenseId", ""));
        int updated = jdbcTemplate.update("""
                UPDATE vntech_license_installations
                   SET payload_json=?,signature_base64=?,status=?,valid_from=?,valid_until=?,
                       machine_fingerprint=?,verification_detail_json=?,installed_by=?,last_verified_at=?,
                       revoked_at=NULL,updated_at=?
                 WHERE license_id=?""",
                installation.get("payloadJson"), installation.get("signatureBase64"), installation.get("status"),
                installation.get("validFrom"), installation.get("validUntil"),
                installation.get("machineFingerprint"), installation.get("verificationDetailJson"),
                installation.get("installedBy"), installation.get("now"), installation.get("now"), licenseId);
        if (updated == 0) {
            jdbcTemplate.update("""
                    INSERT INTO vntech_license_installations
                        (id,license_id,tenant_id,company_code,product_id,key_id,payload_json,signature_base64,
                         status,valid_from,valid_until,machine_fingerprint,verification_detail_json,installed_by,
                         installed_at,last_verified_at,revoked_at,updated_at)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NULL,?)""",
                    installation.get("id"), licenseId, installation.get("tenantId"),
                    installation.get("companyCode"), installation.get("productId"), installation.get("keyId"),
                    installation.get("payloadJson"), installation.get("signatureBase64"),
                    installation.get("status"), installation.get("validFrom"), installation.get("validUntil"),
                    installation.get("machineFingerprint"), installation.get("verificationDetailJson"),
                    installation.get("installedBy"), installation.get("now"), installation.get("now"),
                    installation.get("now"));
        }
    }

    /** MT2-P14-03b — nhật ký trust ({@code vntech_trust_audit}) — Development Mode, enforcement tắt. */
    @Override @Transactional
    public void recordTrustAudit(String eventType, String actorUserId, String licenseId,
                                 String machineFingerprint, String detailJson, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO vntech_trust_audit
                    (id,event_type,actor_user_id,trust_mode,enforcement_enabled,license_id,machine_fingerprint,
                     detail_json,occurred_at)
                VALUES (?,?,?,'development',0,?,?,?,?)""",
                "TA" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase(), eventType,
                actorUserId, licenseId, machineFingerprint, detailJson, now);
    }

    @Override
    public Optional<Map<String, Object>> findLicense(String id) {
        return first("SELECT * FROM vntech_license_installations WHERE id=?", id);
    }

    /**
     * MT2-P14-03b — yêu cầu chuyển/khôi phục license, port JS {@code request_license_transfer}:
     * 12 cột thật của {@code vntech_license_transfer_requests} (⚠️ {@code status='requested'} — KHÔNG phải
     * {@code 'pending'}) và ⛔ <b>KHÔNG</b> đụng {@code vntech_license_installations} (JS không làm vậy).
     */
    @Override @Transactional
    public void requestLicenseTransfer(String licenseId, String sourceFingerprint, String destinationFingerprint,
                                       String reason, String requestedBy, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO vntech_license_transfer_requests
                    (id,license_id,source_machine_fingerprint,destination_machine_fingerprint,recovery_code_hash,
                     reason,status,requested_by,requested_at,approved_at,completed_at,detail_json)
                VALUES (?,?,?,?,NULL,?,'requested',?,?,NULL,NULL,NULL)""",
                "LTR" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase(),
                licenseId == null || licenseId.isBlank() ? null : licenseId,
                sourceFingerprint == null || sourceFingerprint.isBlank() ? null : sourceFingerprint,
                destinationFingerprint == null || destinationFingerprint.isBlank() ? null : destinationFingerprint,
                reason, requestedBy, now);
    }

    /**
     * SỬA LỖI (TASK-042): bản cũ chạy {@code SELECT COUNT(*) FROM email_queue WHERE status='pending'} —
     * bảng {@code email_queue} **KHÔNG tồn tại** (lược đồ chỉ có {@code email_outbox}) ⇒ MySQL ném
     * "Table … doesn't exist" ⇒ action {@code retry_email} trả **HTTP 500** (đã gọi thật xác nhận).
     * JS `system-route.mjs:1630-1636` còn cho thấy Java <b>hiểu sai nghiệp vụ</b>: JS không đếm mà
     * <b>xếp lại MỘT email theo id</b>.
     */
    @Override @Transactional
    public void requeueEmail(String emailId, Instant now) {
        jdbcTemplate.update("""
                UPDATE email_outbox SET status='queued',next_attempt_at=?,last_error=NULL,updated_at=?
                WHERE id=?""", now, now, emailId);
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