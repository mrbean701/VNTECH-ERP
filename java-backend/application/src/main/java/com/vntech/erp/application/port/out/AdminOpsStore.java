package com.vntech.erp.application.port.out;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/** Port vận hành admin — port nguyên trạng save_email_settings / preview_request_import JS. */
public interface AdminOpsStore {

    // ---- email settings ----
    void upsertEmailSettings(Map<String, Object> s, String userId, Instant now);
    void updateSlaSettings(boolean poSla, long poHours, boolean bchSla, long bchHours, String userId, Instant now);
    void clearApprovalEmailRecipients();
    void clearApprovalProjectAssignments();
    void insertApprovalAssignment(String id, String projectId, int stage, String ownerUserId, String ccEmails,
                                  String updatedBy, Instant now);
    void insertApprovalRecipient(String id, String projectId, int stage, String userEmail, String ccEmails,
                                 String updatedBy, Instant now);

    // ---- preview request import context ----
    Optional<Map<String, Object>> findProjectBasic(String projectId);
    Optional<Map<String, Object>> findActiveBoqVersionId(String projectId, String contractId);
    Optional<Map<String, Object>> findContractForVersion(String projectId, String contractId, String boqVersionId);
    List<Map<String, Object>> boqRowsForPreview(String projectId, String contractId, String boqVersionId);
    List<Map<String, Object>> materialsForPreview();
    List<Map<String, Object>> inventoryForProject(String projectId);
    List<Map<String, Object>> cumulativeByBoq(String projectId, String contractId, String boqVersionId);
}