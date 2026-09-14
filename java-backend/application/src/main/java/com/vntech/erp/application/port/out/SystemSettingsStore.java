package com.vntech.erp.application.port.out;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/** Port settings/license/factory reset/bulk import — 9 action cuối catalog. */
public interface SystemSettingsStore {

    void upsertUiDisplaySettings(String json, String updatedBy, Instant now);
    Map<String, Object> readUiDisplaySettings();
    void upsertTrustSettings(String json, String updatedBy, Instant now);
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