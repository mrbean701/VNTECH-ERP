package com.vntech.erp.application.port.out;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Port BOQ — port nguyên trạng save_boq_version/save_boq_item/set_boq_item_status của monolith JS:
 * resolve contract/BOQ context (requireVersion), boq_source_items upsert, project_boq_items đồng bộ,
 * import batches, change history.
 */
public interface BoqStore {

    // ---- context ----
    Optional<Map<String, Object>> findContract(String projectId, String contractId);  // active
    Optional<Map<String, Object>> defaultContract(String projectId);
    Optional<Map<String, Object>> findBoqVersion(String projectId, String contractId, String versionId);
    Optional<Map<String, Object>> activeBoqVersion(String projectId, String contractId);
    long maxBoqVersion(String contractId);
    List<Map<String, Object>> boqSourceItemsForContract(String projectId, String contractId, String boqVersionId);
    Optional<Map<String, Object>> findBoqSourceItem(String sourceItemId, String projectId, String contractId, String boqVersionId);
    Optional<Map<String, Object>> findProjectBoqItem(String id, String projectId);

    // ---- ghi ----
    void insertBoqVersion(String versionId, String projectId, String contractId, int versionNo,
                          String versionCode, String versionName, String revisionType, String sourceFileName,
                          boolean makeActive, String effectiveAt, String createdBy, Instant now);
    void deactivateBoqVersions(String contractId, Instant now);
    Optional<Map<String, Object>> findActiveImportBatch(String projectId, String contractId, String boqVersionId);
    String createImportBatch(String batchId, String projectId, String contractId, String boqVersionId,
                             String versionCode, String userId, Instant now);
    void upsertSourceItem(Map<String, Object> item, boolean isNew, Instant now);
    void upsertProjectBoqItem(Map<String, Object> item, boolean isNew, Instant now);
    void deactivateProjectBoqItem(String pbiId, Instant now);
    void updateImportBatchRowCount(String batchId, Instant now);
    void insertBoqChangeHistory(Map<String, Object> history, Instant now);
    void setSourceItemActive(String sourceItemId, boolean active, String pbiId, Instant now);
    Optional<Map<String, Object>> findMaterial(String materialId);
    Optional<Map<String, Object>> findMaterialByCode(String code);
    /** Tra cứu dòng BOQ nguồn theo id bất kỳ (cho set_boq_item_status/delete). */
    Optional<Map<String, Object>> findBoqSourceItemById(String sourceItemId);

    // ---- Material Matching (compare/confirm) ----
    Optional<Map<String, Object>> findBatch(String batchId, String projectId);
    List<Map<String, Object>> sourceRowsForMatching(String batchId);       // active material/component, có unit+name
    List<Map<String, Object>> activeMaterialsForMatching();                // active, code <> __BOQ_STRUCTURE__
    List<Map<String, Object>> verifiedMaterialAliases();
    List<Map<String, Object>> materialMappingHistory();
    String insertMappingRun(String runId, String batchId, String projectId, String contractId,
                            String boqVersionId, String scope, String provider, String thresholdsJson,
                            String weightsJson, String userId, Instant now);
    void insertMappingCandidate(String candidateId, String runId, String sourceItemId, String materialId,
                                int rankNo, double historyScore, double technicalScore, double systemScore,
                                double uomScore, double fuzzyScore, double embeddingScore, double finalScore,
                                boolean hardConflict, String conflictReason, String provider, String status,
                                Instant now);
    void updateMappingRunProvider(String runId, String provider, int providerFallback);
    Optional<Map<String, Object>> findMappingCandidate(String runId, String sourceItemId, String materialId);

    // confirm: cập nhật mapping trên source item + ghi audit + history + alias + component
    void confirmSourceMapping(String sourceItemId, String materialId, String materialName, String systemCode,
                              String mappingStatus, String projectBoqItemId, String userId, Instant now);
    void insertMappingAudit(String auditId, String sourceItemId, String runId, String oldMaterialId,
                            String newMaterialId, String actionType, Double finalScore, String scoreDetailJson,
                            String provider, String reason, boolean saveAlias, String userId, Instant now);
    Optional<Map<String, Object>> findMappingHistory(String materialId, String sourceNormalized);
    void upsertMappingHistoryConfirmed(String materialId, String sourceNormalized, String sourceText,
                                       String systemCode, String unit, String userId, Instant now);
    Optional<Map<String, Object>> findAliasByNormalized(String normalizedName);
    void insertMaterialAlias(String aliasId, String materialId, String aliasName, String normalizedName,
                             String userId, Instant now);
    void deactivateMainComponent(String sourceItemId, Instant now);
    Optional<Map<String, Object>> findMainComponent(String sourceItemId, String materialId);
    void updateMainComponent(String id, String userId, String sourceMethod, Instant now);
    void insertMainComponent(String id, String sourceItemId, String materialId, String unit,
                             String sourceMethod, String userId, Instant now);

    // ---- bulk/delete/clear (Phase 5 còn lại) ----
    long boqItemDependencyTotal(String pbiId);                       // đếm liên kết MR/PO/GRN/ledger...
    long boqVersionDependencyTotal(String projectId, String contractId, String boqVersionId);
    void setVersionActive(String projectId, String contractId, String versionId, boolean active,
                          String status, Instant now);               // archive/restore toàn phiên bản
    void purgeBoqVersion(String projectId, String contractId, String boqVersionId, String confirmText,
                         String versionCode, String userId, Instant now);

    // ---- replace_boq_items / update_boq_contract_prices ----
    List<Map<String, Object>> existingSourceRows(String projectId, String contractId, String boqVersionId);
    List<Map<String, Object>> materialCatalogSimple();
    void insertProjectBoqItemFull(Map<String, Object> pbi, String sourceItemId, Instant now);
    void updatePbiLinkSource(String pbiId, String sourceItemId, Instant now);
    void updateSourceItemFull(Map<String, Object> source, Instant now);
    void insertSourceItemFull(Map<String, Object> source, Instant now);
    void updateVersionFile(String boqVersionId, String sourceFileName, Instant now);
    void updateBatchFile(String batchId, String sourceFileName, long rowCount, int active, Instant now);
    void deactivateVersionItems(String projectId, String contractId, String boqVersionId, Instant now);
    void upsertPriceBatch(String batchId, String projectId, String sourceFileName, int rowCount,
                          int changedCount, String updatedBy, Instant now);
    List<Map<String, Object>> pbiPricesForUpdate(String projectId, String contractId, String boqVersionId);
    /**
     * TASK-046 — JS `system-route.mjs:2827` ghi `(…,changed,created_at)` với `row.isChanged?1:0`.
     * Bản Java cũ **bỏ cột `changed`** ⇒ lịch sử nhập giá mất cờ "dòng có đổi giá".
     */
    void insertPriceItem(String id, String batchId, String boqItemId, double oldPrice, double newPrice,
                         boolean changed, Instant now);
    void updatePbiPrice(String boqItemId, double unitPrice, boolean variationPending, Instant now);
}