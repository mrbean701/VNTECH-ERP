package com.vntech.erp.infrastructure.persistence;

import com.vntech.erp.application.port.out.BoqStore;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/** Adapter BOQ — native SQL port từ save_boq_version/save_boq_item/set_boq_item_status JS. */
@Component
public class BoqStoreAdapter implements BoqStore {

    private final JdbcTemplate jdbcTemplate;

    public BoqStoreAdapter(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public Optional<Map<String, Object>> findContract(String projectId, String contractId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT id,project_id AS projectId,contract_no AS contractNo,contract_name AS contractName,
                       status,is_primary AS isPrimary
                FROM project_contracts WHERE id=? AND project_id=? AND status='active'""", contractId, projectId);
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }

    @Override
    public Optional<Map<String, Object>> defaultContract(String projectId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT id,project_id AS projectId,contract_no AS contractNo,contract_name AS contractName,
                       status,is_primary AS isPrimary
                FROM project_contracts WHERE project_id=? AND status='active'
                ORDER BY is_primary DESC,created_at,id LIMIT 1""", projectId);
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }

    @Override
    public Optional<Map<String, Object>> findBoqVersion(String projectId, String contractId, String versionId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT id,project_id AS projectId,contract_id AS contractId,version_no AS versionNo,
                       version_code AS versionCode,status,active
                FROM boq_versions WHERE id=? AND project_id=? AND contract_id=?""", versionId, projectId, contractId);
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }

    @Override
    public Optional<Map<String, Object>> activeBoqVersion(String projectId, String contractId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT id,project_id AS projectId,contract_id AS contractId,version_no AS versionNo,
                       version_code AS versionCode,status,active
                FROM boq_versions WHERE project_id=? AND contract_id=? AND active=1
                ORDER BY version_no DESC LIMIT 1""", projectId, contractId);
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }

    @Override
    public long maxBoqVersion(String contractId) {
        Long n = jdbcTemplate.queryForObject(
                "SELECT COALESCE(MAX(version_no),0) FROM boq_versions WHERE contract_id=?", Long.class, contractId);
        return n == null ? 0 : n;
    }

    @Override
    public List<Map<String, Object>> boqSourceItemsForContract(String projectId, String contractId, String boqVersionId) {
        return jdbcTemplate.queryForList("""
                SELECT * FROM boq_source_items
                WHERE project_id=? AND contract_id=? AND boq_version_id=?""",
                projectId, contractId, boqVersionId);
    }

    @Override
    public Optional<Map<String, Object>> findBoqSourceItem(String sourceItemId, String projectId,
                                                           String contractId, String boqVersionId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT * FROM boq_source_items
                WHERE id=? AND project_id=? AND contract_id=? AND boq_version_id=?""",
                sourceItemId, projectId, contractId, boqVersionId);
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }

    @Override
    public Optional<Map<String, Object>> findProjectBoqItem(String id, String projectId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT * FROM project_boq_items WHERE id=? AND project_id=?""", id, projectId);
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }

    @Override
    @Transactional
    public void insertBoqVersion(String versionId, String projectId, String contractId, int versionNo,
                                 String versionCode, String versionName, String revisionType, String sourceFileName,
                                 boolean makeActive, String effectiveAt, String createdBy, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO boq_versions (id,project_id,contract_id,version_no,version_code,version_name,
                                          revision_type,source_file_name,status,active,effective_at,created_by,
                                          created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                versionId, projectId, contractId, versionNo, versionCode, versionName, revisionType,
                sourceFileName, makeActive ? "active" : "draft", makeActive ? 1 : 0, effectiveAt, createdBy, now, now);
    }

    @Override
    @Transactional
    public void deactivateBoqVersions(String contractId, Instant now) {
        jdbcTemplate.update("""
                UPDATE boq_versions SET active=0,status='superseded',updated_at=? WHERE contract_id=? AND active=1""",
                now, contractId);
    }

    @Override
    public Optional<Map<String, Object>> findActiveImportBatch(String projectId, String contractId, String boqVersionId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT * FROM boq_import_batches WHERE project_id=? AND contract_id=? AND boq_version_id=?
                ORDER BY version_no DESC LIMIT 1""", projectId, contractId, boqVersionId);
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }

    @Override
    @Transactional
    public String createImportBatch(String batchId, String projectId, String contractId, String boqVersionId,
                                    String versionCode, String userId, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO boq_import_batches (id,project_id,contract_id,boq_version_id,version_no,
                                                source_file_name,active,row_count,imported_by,created_at,updated_at)
                VALUES (?,?,?,?,(SELECT version_no FROM boq_versions WHERE id=?),NULL,1,0,?,?,?)""",
                batchId, projectId, contractId, boqVersionId, boqVersionId, userId, now, now);
        return batchId;
    }

    @Override
    @Transactional
    public void upsertSourceItem(Map<String, Object> item, boolean isNew, Instant now) {
        if (isNew) {
            jdbcTemplate.update("""
                    INSERT INTO boq_source_items (id,batch_id,project_id,contract_id,boq_version_id,
                                                  source_order,source_row,contract_line_ref,row_role,boq_code,
                                                  contract_code,contract_material_code,approved_material_code,
                                                  contract_material_name,unit,contract_qty,remeasured_qty,unit_price,
                                                  item_type,note,source_system_code,source_subgroup_name,
                                                  raw_source_json,mapped_material_id,standard_material_name_snapshot,
                                                  mapping_status,project_boq_item_id,mapped_by,mapped_at,active,
                                                  created_at,updated_at)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,?,?)""",
                    item.get("id"), item.get("batchId"), item.get("projectId"), item.get("contractId"),
                    item.get("boqVersionId"), item.get("sourceOrder"), item.get("sourceRow"),
                    item.get("contractLineRef"), item.get("rowRole"), item.get("boqCode"),
                    item.get("contractCode"), item.get("contractMaterialCode"), item.get("approvedMaterialCode"),
                    item.get("contractMaterialName"), item.get("unit"), item.get("contractQty"),
                    item.get("remeasuredQty"), item.get("unitPrice"), item.get("itemType"), item.get("note"),
                    item.get("sourceSystemCode"), item.get("subgroupName"),
                    "{\"manual\":true}", item.get("mappedMaterialId"), item.get("standardMaterialName"),
                    item.get("mappingStatus"), item.get("projectBoqItemId"), item.get("mappedBy"),
                    item.get("mappedAt"), now, now);
        } else {
            jdbcTemplate.update("""
                    UPDATE boq_source_items SET source_order=?,source_row=?,contract_line_ref=?,row_role=?,
                           boq_code=?,contract_code=?,contract_material_code=?,approved_material_code=?,
                           contract_material_name=?,unit=?,contract_qty=?,remeasured_qty=?,unit_price=?,
                           item_type=?,note=?,source_system_code=?,source_subgroup_name=?,mapped_material_id=?,
                           standard_material_name_snapshot=?,mapping_status=?,mapped_by=?,mapped_at=?,active=1,
                           updated_at=? WHERE id=?""",
                    item.get("sourceOrder"), item.get("sourceRow"), item.get("contractLineRef"),
                    item.get("rowRole"), item.get("boqCode"), item.get("contractCode"),
                    item.get("contractMaterialCode"), item.get("approvedMaterialCode"),
                    item.get("contractMaterialName"), item.get("unit"), item.get("contractQty"),
                    item.get("remeasuredQty"), item.get("unitPrice"), item.get("itemType"), item.get("note"),
                    item.get("sourceSystemCode"), item.get("subgroupName"), item.get("mappedMaterialId"),
                    item.get("standardMaterialName"), item.get("mappingStatus"), item.get("mappedBy"),
                    item.get("mappedAt"), now, item.get("id"));
        }
    }

    @Override
    @Transactional
    public void upsertProjectBoqItem(Map<String, Object> item, boolean isNew, Instant now) {
        if (isNew) {
            jdbcTemplate.update("""
                    INSERT INTO project_boq_items (id,project_id,contract_id,boq_version_id,source_item_id,
                                                   line_no,source_order,contract_line_ref,row_role,
                                                   parent_source_order,outline_level,source_sheet,source_row,
                                                   boq_code,contract_code,contract_material_code,
                                                   approved_material_code,item_type,material_id,description,
                                                   contract_qty,remeasured_qty,unit_price,variation_status,
                                                   variation_ref,variation_approved_at,note,active,
                                                   created_at,updated_at)
                    VALUES (?,?,?,?,?,?,?,?,?,NULL,0,NULL,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,?,?)""",
                    item.get("id"), item.get("projectId"), item.get("contractId"), item.get("boqVersionId"),
                    item.get("sourceItemId"), item.get("sourceOrder"), item.get("sourceOrder"),
                    item.get("contractLineRef"), item.get("rowRole"), item.get("sourceRow"),
                    item.get("boqCode"), item.get("contractCode"), item.get("contractMaterialCode"),
                    item.get("approvedMaterialCode"), item.get("itemType"), item.get("materialId"),
                    item.get("description"), item.get("contractQty"), item.get("remeasuredQty"),
                    item.get("unitPrice"), item.get("variationStatus"), item.get("variationRef"),
                    item.get("variationApprovedAt"), item.get("note"), now, now);
        } else {
            jdbcTemplate.update("""
                    UPDATE project_boq_items SET line_no=?,source_order=?,contract_line_ref=?,row_role=?,
                           boq_code=?,contract_code=?,contract_material_code=?,approved_material_code=?,
                           item_type=?,material_id=?,description=?,contract_qty=?,remeasured_qty=?,unit_price=?,
                           variation_status=?,variation_ref=?,variation_approved_at=?,note=?,active=1,updated_at=?
                    WHERE id=? AND project_id=? AND contract_id=? AND boq_version_id=?""",
                    item.get("sourceOrder"), item.get("sourceOrder"), item.get("contractLineRef"),
                    item.get("rowRole"), item.get("boqCode"), item.get("contractCode"),
                    item.get("contractMaterialCode"), item.get("approvedMaterialCode"), item.get("itemType"),
                    item.get("materialId"), item.get("description"), item.get("contractQty"),
                    item.get("remeasuredQty"), item.get("unitPrice"), item.get("variationStatus"),
                    item.get("variationRef"), item.get("variationApprovedAt"), item.get("note"), now,
                    item.get("id"), item.get("projectId"), item.get("contractId"), item.get("boqVersionId"));
        }
    }

    @Override
    @Transactional
    public void deactivateProjectBoqItem(String pbiId, Instant now) {
        jdbcTemplate.update("UPDATE project_boq_items SET active=0,updated_at=? WHERE id=?", now, pbiId);
    }

    @Override
    @Transactional
    public void updateImportBatchRowCount(String batchId, Instant now) {
        jdbcTemplate.update("""
                UPDATE boq_import_batches SET
                    row_count=(SELECT COUNT(*) FROM boq_source_items WHERE batch_id=? AND active=1),
                    updated_at=? WHERE id=?""", batchId, now, batchId);
    }

    @Override
    @Transactional
    public void insertBoqChangeHistory(Map<String, Object> history, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO boq_change_history (id,project_id,contract_id,boq_version_id,source_item_id,
                                                project_boq_item_id,action_type,reason,actor_user_id,
                                                before_json,after_json,created_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?)""",
                history.get("id"), history.get("projectId"), history.get("contractId"),
                history.get("boqVersionId"), history.get("sourceItemId"), history.get("projectBoqItemId"),
                history.get("actionType"), history.get("reason"), history.get("actorUserId"),
                history.get("beforeJson"), history.get("afterJson"), now);
    }

    @Override
    @Transactional
    public void setSourceItemActive(String sourceItemId, boolean active, String pbiId, Instant now) {
        jdbcTemplate.update("UPDATE boq_source_items SET active=?,updated_at=? WHERE id=?",
                active ? 1 : 0, now, sourceItemId);
        if (pbiId != null && !pbiId.isBlank()) {
            jdbcTemplate.update("UPDATE project_boq_items SET active=?,updated_at=? WHERE id=?",
                    active ? 1 : 0, now, pbiId);
        }
    }

    @Override
    public Optional<Map<String, Object>> findMaterial(String materialId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT id,code,name,`system`,unit FROM materials WHERE id=? AND active=1""", materialId);
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }

    @Override
    public Optional<Map<String, Object>> findMaterialByCode(String code) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT id,code,name,`system`,unit FROM materials WHERE upper(code)=upper(?) AND active=1""", code);
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }

    @Override
    public Optional<Map<String, Object>> findBoqSourceItemById(String sourceItemId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT * FROM boq_source_items WHERE id=?""", sourceItemId);
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }

    // ---------- Material Matching ----------
    @Override
    public Optional<Map<String, Object>> findBatch(String batchId, String projectId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT id,project_id AS projectId,contract_id AS contractId,boq_version_id AS boqVersionId,
                       version_no AS versionNo,source_file_name AS sourceFileName,active,row_count AS rowCount
                FROM boq_import_batches WHERE id=? AND project_id=?""", batchId, projectId);
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }

    @Override
    public List<Map<String, Object>> sourceRowsForMatching(String batchId) {
        return jdbcTemplate.queryForList("""
                SELECT id,batch_id AS batchId,project_id AS projectId,contract_id AS contractId,
                       boq_version_id AS boqVersionId,source_order AS sourceOrder,source_row AS sourceRow,
                       contract_line_ref AS contractLineRef,row_role AS rowRole,boq_code AS boqCode,
                       contract_code AS contractCode,contract_material_code AS contractMaterialCode,
                       approved_material_code AS approvedMaterialCode,
                       contract_material_name AS contractMaterialName,unit,contract_qty AS contractQty,
                       remeasured_qty AS remeasuredQty,unit_price AS unitPrice,item_type AS itemType,note,
                       source_system_code AS sourceSystemCode,source_subgroup_name AS sourceSubgroupName,
                       mapped_material_id AS mappedMaterialId,
                       standard_material_name_snapshot AS standardMaterialNameSnapshot,
                       mapping_status AS mappingStatus,project_boq_item_id AS projectBoqItemId
                FROM boq_source_items
                WHERE batch_id=? AND active=1 AND row_role IN ('material','component')
                  AND trim(COALESCE(unit,''))<>'' AND trim(COALESCE(contract_material_name,''))<>''
                ORDER BY source_order,id""", batchId);
    }

    @Override
    public List<Map<String, Object>> activeMaterialsForMatching() {
        return jdbcTemplate.queryForList("""
                SELECT id,code,name,`system`,specification,brand,unit,active
                FROM materials WHERE active=1 AND upper(code)<>'__BOQ_STRUCTURE__' ORDER BY code""");
    }

    @Override
    public List<Map<String, Object>> verifiedMaterialAliases() {
        return jdbcTemplate.queryForList("""
                SELECT material_id AS materialId,alias_name AS aliasName
                FROM material_aliases WHERE active=1 AND verified=1""");
    }

    @Override
    public List<Map<String, Object>> materialMappingHistory() {
        return jdbcTemplate.queryForList("""
                SELECT material_id AS materialId,source_normalized AS sourceNormalized,
                       confirm_count AS confirmCount
                FROM material_mapping_history""");
    }

    @Override
    @Transactional
    public String insertMappingRun(String runId, String batchId, String projectId, String contractId,
                                   String boqVersionId, String scope, String provider, String thresholdsJson,
                                   String weightsJson, String userId, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO boq_mapping_runs (id,batch_id,project_id,contract_id,boq_version_id,scope,
                                              provider,provider_fallback,top_k,thresholds_json,weights_json,
                                              run_by,created_at)
                VALUES (?,?,?,?,?,?,?,0,5,?,?,?,?)""",
                runId, batchId, projectId, contractId, boqVersionId, scope, provider,
                thresholdsJson, weightsJson, userId, now);
        return runId;
    }

    @Override
    @Transactional
    public void insertMappingCandidate(String candidateId, String runId, String sourceItemId, String materialId,
                                       int rankNo, double historyScore, double technicalScore, double systemScore,
                                       double uomScore, double fuzzyScore, double embeddingScore, double finalScore,
                                       boolean hardConflict, String conflictReason, String provider, String status,
                                       Instant now) {
        jdbcTemplate.update("""
                INSERT INTO boq_mapping_candidates (id,run_id,source_item_id,material_id,rank_no,history_score,
                                                    technical_score,system_score,uom_score,fuzzy_score,
                                                    embedding_score,final_score,hard_conflict,conflict_reason,
                                                    provider,status,created_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                candidateId, runId, sourceItemId, materialId, rankNo, historyScore, technicalScore,
                systemScore, uomScore, fuzzyScore, embeddingScore, finalScore, hardConflict ? 1 : 0,
                conflictReason, provider, status, now);
    }

    @Override
    @Transactional
    public void updateMappingRunProvider(String runId, String provider, int providerFallback) {
        jdbcTemplate.update(""" 
                UPDATE boq_mapping_runs SET provider=?,provider_fallback=? WHERE id=?""",
                provider, providerFallback, runId);
    }

    @Override
    public Optional<Map<String, Object>> findMappingCandidate(String runId, String sourceItemId, String materialId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT final_score AS finalScore,history_score AS historyScore,
                       technical_score AS technicalScore,system_score AS systemScore,uom_score AS uomScore,
                       fuzzy_score AS fuzzyScore,embedding_score AS embeddingScore,
                       hard_conflict AS hardConflict,conflict_reason AS conflictReason,provider
                FROM boq_mapping_candidates
                WHERE run_id=? AND source_item_id=? AND material_id=?""",
                runId, sourceItemId, materialId);
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }

    @Override
    @Transactional
    public void confirmSourceMapping(String sourceItemId, String materialId, String materialName, String systemCode,
                                     String mappingStatus, String projectBoqItemId, String userId, Instant now) {
        jdbcTemplate.update("""
                UPDATE boq_source_items SET mapped_material_id=?,standard_material_name_snapshot=?,
                       source_system_code=?,mapping_status=?,project_boq_item_id=?,mapped_by=?,mapped_at=?,
                       updated_at=? WHERE id=?""",
                materialId, materialName, systemCode, mappingStatus, projectBoqItemId, userId, now, now, sourceItemId);
    }

    @Override
    @Transactional
    public void insertMappingAudit(String auditId, String sourceItemId, String runId, String oldMaterialId,
                                   String newMaterialId, String actionType, Double finalScore, String scoreDetailJson,
                                   String provider, String reason, boolean saveAlias, String userId, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO boq_mapping_audit (id,source_item_id,run_id,old_material_id,new_material_id,
                                               action_type,final_score,score_detail_json,provider,reason,
                                               save_alias,actor_user_id,created_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                auditId, sourceItemId, runId, oldMaterialId, newMaterialId, actionType, finalScore,
                scoreDetailJson, provider, reason, saveAlias ? 1 : 0, userId, now);
    }

    @Override
    public Optional<Map<String, Object>> findMappingHistory(String materialId, String sourceNormalized) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT id,confirm_count AS confirmCount FROM material_mapping_history
                WHERE material_id=? AND source_normalized=?""", materialId, sourceNormalized);
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }

    @Override
    @Transactional
    public void upsertMappingHistoryConfirmed(String materialId, String sourceNormalized, String sourceText,
                                              String systemCode, String unit, String userId, Instant now) {
        List<Map<String, Object>> existing = jdbcTemplate.queryForList("""
                SELECT id FROM material_mapping_history WHERE material_id=? AND source_normalized=?""",
                materialId, sourceNormalized);
        if (!existing.isEmpty()) {
            jdbcTemplate.update("""
                    UPDATE material_mapping_history SET confirm_count=confirm_count+1,
                           last_confirmed_by=?,last_confirmed_at=?,updated_at=? WHERE id=?""",
                    userId, now, now, existing.get(0).get("id"));
        } else {
            jdbcTemplate.update("""
                    INSERT INTO material_mapping_history (id,material_id,source_normalized,source_text,
                                                         system_code,unit,confirm_count,last_confirmed_by,
                                                         last_confirmed_at,created_at,updated_at)
                    VALUES (?,?,?,?,?,?,1,?,?,?,?)""",
                    "MAPH_" + java.util.UUID.randomUUID(), materialId, sourceNormalized, sourceText,
                    systemCode, unit, userId, now, now, now);
        }
    }

    @Override
    public Optional<Map<String, Object>> findAliasByNormalized(String normalizedName) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT id,material_id AS materialId FROM material_aliases WHERE normalized_name=?""",
                normalizedName);
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }

    @Override
    @Transactional
    public void insertMaterialAlias(String aliasId, String materialId, String aliasName, String normalizedName,
                                    String userId, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO material_aliases (id,material_id,alias_name,normalized_name,verified,active,
                                              created_by,created_at,updated_at)
                VALUES (?,?,?,?,1,1,?,?,?)""",
                aliasId, materialId, aliasName, normalizedName, userId, now, now);
    }

    @Override
    @Transactional
    public void deactivateMainComponent(String sourceItemId, Instant now) {
        jdbcTemplate.update("""
                UPDATE boq_material_components SET active=0,updated_at=? WHERE source_item_id=? AND component_type='main' AND active=1""",
                now, sourceItemId);
    }

    @Override
    public Optional<Map<String, Object>> findMainComponent(String sourceItemId, String materialId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT id FROM boq_material_components
                WHERE source_item_id=? AND material_id=? AND component_type='main'""",
                sourceItemId, materialId);
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }

    @Override
    @Transactional
    public void updateMainComponent(String id, String userId, String sourceMethod, Instant now) {
        jdbcTemplate.update("""
                UPDATE boq_material_components SET active=1,approved_by=?,approved_at=?,source_method=?,
                       updated_at=? WHERE id=?""", userId, now, sourceMethod, now, id);
    }

    @Override
    @Transactional
    public void insertMainComponent(String id, String sourceItemId, String materialId, String unit,
                                    String sourceMethod, String userId, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO boq_material_components (id,source_item_id,material_id,component_type,
                                                     quantity_ratio,component_uom,is_required,source_method,
                                                     approved_by,approved_at,note,active,created_at,updated_at)
                VALUES (?,?,?,'main',1,?,1,?,?,?,NULL,1,?,?)""",
                id, sourceItemId, materialId, unit, sourceMethod, userId, now, now, now);
    }

    // ---------- bulk/delete/clear ----------
    @Override
    public long boqItemDependencyTotal(String pbiId) {
        if (pbiId == null || pbiId.isBlank()) return 0;
        Long n = jdbcTemplate.queryForObject("""
                SELECT (SELECT COUNT(*) FROM material_request_items WHERE boq_item_id=?)
                     + (SELECT COUNT(*) FROM purchase_order_items WHERE boq_item_id=?)
                     + (SELECT COUNT(*) FROM goods_receipt_items WHERE boq_item_id=?)
                     + (SELECT COUNT(*) FROM procurement_allocations WHERE boq_item_id=? AND stage<>'MR')""",
                Long.class, pbiId, pbiId, pbiId, pbiId);
        return n == null ? 0 : n;
    }

    @Override
    public long boqVersionDependencyTotal(String projectId, String contractId, String boqVersionId) {
        Long n = jdbcTemplate.queryForObject("""
                SELECT (SELECT COUNT(*) FROM material_request_items
                        WHERE boq_version_id=? AND request_id IN
                              (SELECT id FROM material_requests WHERE project_id=? AND contract_id=?))
                     + (SELECT COUNT(*) FROM purchase_order_items
                        WHERE boq_version_id=? AND purchase_order_id IN
                              (SELECT id FROM purchase_orders WHERE project_id=? AND contract_id=?))
                     + (SELECT COUNT(*) FROM goods_receipt_items
                        WHERE boq_version_id=? AND receipt_id IN
                              (SELECT gr.id FROM goods_receipts gr JOIN purchase_orders po ON po.id=gr.purchase_order_id
                               WHERE po.project_id=? AND po.contract_id=?))""",
                Long.class, boqVersionId, projectId, contractId,
                boqVersionId, projectId, contractId,
                boqVersionId, projectId, contractId);
        return n == null ? 0 : n;
    }

    @Override
    @Transactional
    public void setVersionActive(String projectId, String contractId, String versionId, boolean active,
                                 String status, Instant now) {
        jdbcTemplate.update("UPDATE boq_source_items SET active=?,updated_at=? WHERE project_id=? AND contract_id=? AND boq_version_id=?",
                active ? 1 : 0, now, projectId, contractId, versionId);
        jdbcTemplate.update("UPDATE project_boq_items SET active=?,updated_at=? WHERE project_id=? AND contract_id=? AND boq_version_id=?",
                active ? 1 : 0, now, projectId, contractId, versionId);
        jdbcTemplate.update("UPDATE boq_import_batches SET active=?,updated_at=? WHERE project_id=? AND contract_id=? AND boq_version_id=?",
                active ? 1 : 0, now, projectId, contractId, versionId);
        jdbcTemplate.update("UPDATE boq_versions SET status=?,active=0,updated_at=? WHERE id=?",
                status, now, versionId);
    }

    @Override
    @Transactional
    public void purgeBoqVersion(String projectId, String contractId, String boqVersionId, String confirmText,
                                String versionCode, String userId, Instant now) {
        // xóa liên kết trước
        jdbcTemplate.update("UPDATE boq_source_items SET project_boq_item_id=NULL WHERE project_id=? AND contract_id=? AND boq_version_id=?", projectId, contractId, boqVersionId);
        jdbcTemplate.update("UPDATE project_boq_items SET source_item_id=NULL WHERE project_id=? AND contract_id=? AND boq_version_id=?", projectId, contractId, boqVersionId);
        List<Map<String, Object>> sources = jdbcTemplate.queryForList("""
                SELECT id,project_boq_item_id AS projectBoqItemId FROM boq_source_items
                WHERE project_id=? AND contract_id=? AND boq_version_id=?""", projectId, contractId, boqVersionId);
        for (Map<String, Object> s : sources) {
            jdbcTemplate.update("DELETE FROM boq_mapping_candidates WHERE source_item_id=?", s.get("id"));
            jdbcTemplate.update("DELETE FROM boq_mapping_audit WHERE source_item_id=?", s.get("id"));
            jdbcTemplate.update("DELETE FROM boq_material_components WHERE source_item_id=?", s.get("id"));
            if (s.get("projectBoqItemId") != null) {
                jdbcTemplate.update("DELETE FROM boq_price_import_items WHERE boq_item_id=?", s.get("projectBoqItemId"));
                jdbcTemplate.update("DELETE FROM custom_field_values WHERE form_key='boq' AND entity_id=?", s.get("projectBoqItemId"));
            }
        }
        jdbcTemplate.update("DELETE FROM boq_change_history WHERE project_id=? AND contract_id=? AND boq_version_id=?", projectId, contractId, boqVersionId);
        List<Map<String, Object>> batches = jdbcTemplate.queryForList("""
                SELECT id FROM boq_import_batches WHERE project_id=? AND contract_id=? AND boq_version_id=?""",
                projectId, contractId, boqVersionId);
        for (Map<String, Object> b : batches) jdbcTemplate.update("DELETE FROM boq_mapping_runs WHERE batch_id=?", b.get("id"));
        jdbcTemplate.update("DELETE FROM boq_source_items WHERE project_id=? AND contract_id=? AND boq_version_id=?", projectId, contractId, boqVersionId);
        jdbcTemplate.update("DELETE FROM project_boq_items WHERE project_id=? AND contract_id=? AND boq_version_id=?", projectId, contractId, boqVersionId);
        jdbcTemplate.update("DELETE FROM boq_import_batches WHERE project_id=? AND contract_id=? AND boq_version_id=?", projectId, contractId, boqVersionId);
        jdbcTemplate.update("DELETE FROM boq_versions WHERE id=?", boqVersionId);
    }

    // ---------- replace / prices ----------
    @Override
    public List<Map<String, Object>> existingSourceRows(String projectId, String contractId, String boqVersionId) {
        return jdbcTemplate.queryForList("""
                SELECT * FROM boq_source_items
                WHERE project_id=? AND contract_id=? AND boq_version_id=? AND active=1
                ORDER BY source_order,id""", projectId, contractId, boqVersionId);
    }

    @Override
    public List<Map<String, Object>> materialCatalogSimple() {
        return jdbcTemplate.queryForList(
                "SELECT id,code,name,`system`,unit FROM materials WHERE active=1");
    }

    @Override
    @Transactional
    public void insertProjectBoqItemFull(Map<String, Object> pbi, String sourceItemId, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO project_boq_items (id,project_id,contract_id,boq_version_id,source_item_id,line_no,
                                               source_order,contract_line_ref,row_role,parent_source_order,
                                               outline_level,source_sheet,source_row,boq_code,contract_code,
                                               contract_material_code,approved_material_code,item_type,material_id,
                                               description,contract_qty,remeasured_qty,unit_price,variation_status,
                                               variation_ref,variation_approved_at,note,active,created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,?,?,NULL,0,NULL,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,?,?)""",
                pbi.get("id"), pbi.get("projectId"), pbi.get("contractId"), pbi.get("boqVersionId"), sourceItemId,
                pbi.get("sourceOrder"), pbi.get("sourceOrder"), pbi.get("contractLineRef"), pbi.get("rowRole"),
                pbi.get("sourceRow"), pbi.get("boqCode"), pbi.get("contractCode"),
                pbi.get("contractMaterialCode"), pbi.get("approvedMaterialCode"), pbi.get("itemType"),
                pbi.get("materialId"), pbi.get("description"), pbi.get("contractQty"), pbi.get("remeasuredQty"),
                pbi.get("unitPrice"), pbi.get("variationStatus"), pbi.get("variationRef"),
                pbi.get("variationApprovedAt"), pbi.get("note"), now, now);
    }

    @Override
    @Transactional
    public void updatePbiLinkSource(String pbiId, String sourceItemId, Instant now) {
        jdbcTemplate.update("UPDATE project_boq_items SET source_item_id=?,updated_at=? WHERE id=?",
                sourceItemId, now, pbiId);
    }

    @Override
    @Transactional
    public void updateSourceItemFull(Map<String, Object> s, Instant now) {
        jdbcTemplate.update("""
                UPDATE boq_source_items SET source_row=?,contract_line_ref=?,row_role=?,boq_code=?,contract_code=?,
                       contract_material_code=?,approved_material_code=?,contract_material_name=?,unit=?,
                       contract_qty=?,remeasured_qty=?,unit_price=?,item_type=?,note=?,source_system_code=?,
                       source_subgroup_name=?,mapped_material_id=?,standard_material_name_snapshot=?,
                       mapping_status=?,mapped_by=?,mapped_at=?,updated_at=? WHERE id=?""",
                s.get("sourceRow"), s.get("contractLineRef"), s.get("rowRole"), s.get("boqCode"),
                s.get("contractCode"), s.get("contractMaterialCode"), s.get("approvedMaterialCode"),
                s.get("contractMaterialName"), s.get("unit"), s.get("contractQty"), s.get("remeasuredQty"),
                s.get("unitPrice"), s.get("itemType"), s.get("note"), s.get("sourceSystemCode"),
                s.get("subgroupName"), s.get("mappedMaterialId"), s.get("standardMaterialName"),
                s.get("mappingStatus"), s.get("mappedBy"), s.get("mappedAt"), now, s.get("id"));
    }

    @Override
    @Transactional
    public void insertSourceItemFull(Map<String, Object> s, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO boq_source_items (id,batch_id,project_id,contract_id,boq_version_id,source_order,
                                              source_row,contract_line_ref,row_role,boq_code,contract_code,
                                              contract_material_code,approved_material_code,contract_material_name,
                                              unit,contract_qty,remeasured_qty,unit_price,item_type,note,
                                              source_system_code,source_subgroup_name,raw_source_json,
                                              mapped_material_id,standard_material_name_snapshot,mapping_status,
                                              project_boq_item_id,mapped_by,mapped_at,active,created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,?,?)""",
                s.get("id"), s.get("batchId"), s.get("projectId"), s.get("contractId"), s.get("boqVersionId"),
                s.get("sourceOrder"), s.get("sourceRow"), s.get("contractLineRef"), s.get("rowRole"),
                s.get("boqCode"), s.get("contractCode"), s.get("contractMaterialCode"),
                s.get("approvedMaterialCode"), s.get("contractMaterialName"), s.get("unit"), s.get("contractQty"),
                s.get("remeasuredQty"), s.get("unitPrice"), s.get("itemType"), s.get("note"),
                s.get("sourceSystemCode"), s.get("subgroupName"), s.get("rawJson"), s.get("mappedMaterialId"),
                s.get("standardMaterialName"), s.get("mappingStatus"), s.get("projectBoqItemId"),
                s.get("mappedBy"), s.get("mappedAt"), now, now);
    }

    @Override
    @Transactional
    public void updateVersionFile(String boqVersionId, String sourceFileName, Instant now) {
        jdbcTemplate.update("UPDATE boq_versions SET source_file_name=?,updated_at=? WHERE id=?",
                sourceFileName, now, boqVersionId);
    }

    @Override
    @Transactional
    public void updateBatchFile(String batchId, String sourceFileName, long rowCount, int active, Instant now) {
        jdbcTemplate.update("""
                UPDATE boq_import_batches SET source_file_name=?,row_count=?,active=?,updated_at=? WHERE id=?""",
                sourceFileName, rowCount, active, now, batchId);
    }

    @Override
    @Transactional
    public void deactivateVersionItems(String projectId, String contractId, String boqVersionId, Instant now) {
        jdbcTemplate.update(
                "UPDATE boq_source_items SET active=0,updated_at=? WHERE project_id=? AND contract_id=? AND boq_version_id=? AND active=1",
                now, projectId, contractId, boqVersionId);
        jdbcTemplate.update(
                "UPDATE project_boq_items SET active=0,updated_at=? WHERE project_id=? AND contract_id=? AND boq_version_id=? AND active=1",
                now, projectId, contractId, boqVersionId);
    }

    @Override
    @Transactional
    public void upsertPriceBatch(String batchId, String projectId, String sourceFileName, int rowCount,
                                 int changedCount, String updatedBy, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO boq_price_import_batches (id,project_id,source_file_name,price_type,row_count,
                                                      changed_count,unchanged_count,updated_by,created_at)
                VALUES (?,?,?,'contract',?,?,?,?,?)""",
                batchId, projectId, sourceFileName, rowCount, changedCount, Math.max(0, rowCount - changedCount),
                updatedBy, now);
    }

    @Override
    public List<Map<String, Object>> pbiPricesForUpdate(String projectId, String contractId, String boqVersionId) {
        return jdbcTemplate.queryForList("""
                SELECT id,unit_price AS unitPrice FROM project_boq_items
                WHERE project_id=? AND contract_id=? AND boq_version_id=?
                  AND row_role IN ('material','component')""",
                projectId, contractId, boqVersionId);
    }

    @Override
    @Transactional
    public void insertPriceItem(String id, String batchId, String boqItemId, double oldPrice, double newPrice,
                                boolean changed, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO boq_price_import_items (id,batch_id,boq_item_id,old_unit_price,new_unit_price,changed,created_at)
                VALUES (?,?,?,?,?,?,?)""", id, batchId, boqItemId, oldPrice, newPrice, changed ? 1 : 0, now);
    }

    @Override
    @Transactional
    public void updatePbiPrice(String boqItemId, double unitPrice, boolean variationPending, Instant now) {
        jdbcTemplate.update("""
                UPDATE project_boq_items SET unit_price=?,variation_status=CASE WHEN ? THEN 'pending'
                       WHEN variation_status='pending' THEN 'none' ELSE variation_status END,updated_at=?
                WHERE id=?""", unitPrice, variationPending ? 1 : 0, now, boqItemId);
    }
}