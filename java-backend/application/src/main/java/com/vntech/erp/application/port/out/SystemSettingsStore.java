package com.vntech.erp.application.port.out;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/** Port settings/license/factory reset/bulk import — 9 action cuối catalog. */
public interface SystemSettingsStore {

    void upsertUiDisplaySettings(String json, String updatedBy, Instant now);
    Map<String, Object> readUiDisplaySettings();
    /**
     * Ghi cấu hình Development Mode — port nguyên trạng JS {@code save_trust_development_settings}.
     *
     * <p><b>Vì sao đổi chữ ký (TASK-039):</b> chữ ký cũ {@code upsertTrustSettings(json, …)} giả định
     * bảng {@code vntech_trust_settings} có cột {@code settings_json} để chứa một khối JSON. Lược đồ
     * thật (V1__baseline:2173-2193) <b>KHÔNG có cột đó</b> ⇒ câu lệnh ném
     * "Unknown column 'settings_json'" ⇒ action trả HTTP 500. JS cũng KHÔNG lưu JSON ở bảng này mà
     * {@code UPDATE} đúng các cột có thật. Nay port theo JS.
     *
     * @param auditId          id dòng audit (JS dùng {@code id("TA")})
     * @param licenseServerUrl URL máy chủ license, đã kiểm HTTPS ở tầng use case; null = không đặt
     * @param actorUserId      người thực hiện (ghi vào audit)
     */
    void updateTrustDevelopmentSettings(String auditId, String licenseServerUrl, String actorUserId, Instant now);
    Map<String, Object> readTrustSettings();
    List<Map<String, Object>> factoryResetPreview();
    int factoryResetExecute(String confirmText, String userId, Instant now);
    void installLicenseFoundation(String licenseKey, String companyName, String edition, String activatedBy,
                                  Instant now);
    Optional<Map<String, Object>> findLicense(String id);
    void requestLicenseTransfer(String licenseId, String toCompanyName, String reason, String requestedBy,
                                Instant now);
    String retryEmailQueue(int limit, Instant now);

    Optional<Map<String, Object>> findProjectByCodeUpper(String code);
    Optional<Map<String, Object>> findSiteWarehouseForProject(String projectId);
    Optional<Map<String, Object>> findWarehouseOwnerByCodeUpper(String code);
    void updateProjectBasic(String projectId, String name, String status, String contractNo, String contractName,
                            String startDate, String plannedEndDate, Instant now);
    void updateWarehouseBasic(String warehouseId, String code, String name, int active, Instant now);
    void insertDefaultWarehouse(Map<String, Object> wh, Instant now);
    void insertProjectBasic(Map<String, Object> project, Instant now);
    void insertUserProjectScopeAdmin(String userId, String projectId, Instant now);
    Optional<Map<String, Object>> findUserByEmail(String email);
    Optional<Map<String, Object>> findUserByUsername(String username);
    void insertUserBasic(Map<String, Object> user, Instant now);
    void updateUserImported(Map<String, Object> user, Instant now);
}