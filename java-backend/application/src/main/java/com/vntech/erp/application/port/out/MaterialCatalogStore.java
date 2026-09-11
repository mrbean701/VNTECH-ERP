package com.vntech.erp.application.port.out;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/** Port Material Catalog — port nguyên trạng material crud/import/merge JS. */
public interface MaterialCatalogStore {

    Optional<Map<String, Object>> findMaterial(String id);
    Optional<Map<String, Object>> findMaterialByCode(String code);
    boolean materialCodeUsedElsewhere(String code, String excludeId);
    void insertMaterial(Map<String, Object> m, String createdBy, Instant now);
    void updateMaterial(Map<String, Object> m, Instant now);
    void setMaterialActive(String id, boolean active, Instant now);
    void hardDeleteMaterial(String id);
    long countMaterialReferences(String id);
    long countRequestItems(String id);
    long countMaterialLinkedAllocations(String id);
    List<Map<String, Object>> materialsWithReferences();
    List<Map<String, Object>> allMaterials();
    void deactivateSelectedMaterials(List<String> ids, Instant now);
    Optional<Map<String, Object>> findCategory(String id);
    Optional<Map<String, Object>> findCategoryByCode(String code);
    List<Map<String, Object>> categories();
    void insertCategory(String id, String code, String name, String description, String parentId,
                        int sortOrder, String createdBy, Instant now);
    void updateCategory(String id, String code, String name, String description, String parentId,
                        int sortOrder, Instant now);
    void setCategoryActive(String id, boolean active, Instant now);
    void deleteCategorySafe(String id);
    Optional<Map<String, Object>> findSubcategory(String id);
    Optional<Map<String, Object>> findSubcategoryByCode(String code, String categoryId);
    List<Map<String, Object>> subcategories();
    void insertSubcategory(String id, String categoryId, String code, String name, String description,
                           int sortOrder, String createdBy, Instant now);
    void updateSubcategory(String id, String categoryId, String code, String name, String description,
                           int sortOrder, Instant now);
    void setSubcategoryActive(String id, boolean active, Instant now);
    void deleteSubcategorySafe(String id);
    List<Map<String, Object>> materialAliases(String materialId);
    Optional<Map<String, Object>> findAliasByNormalized(String normalized);
    void insertAlias(String id, String materialId, String aliasName, String normalized, String createdBy,
                     Instant now);
    List<Map<String, Object>> aliasConflicts();
    void updateMaterialSubcategoryBulk(List<String> ids, String subcategoryId, Instant now);
    void insertExternalCode(String id, String materialId, String codeType, String ownerKey, String externalCode,
                            String createdBy, Instant now);
    Optional<Map<String, Object>> findExternalCode(String codeType, String ownerKey, String externalCode);
    void upsertUomConversion(String materialId, String fromUom, String toUom, double factor, Instant now);
    boolean uomConversionExists(String materialId, String fromUom, String toUom);
    void importMaterialsBulk(List<Map<String, Object>> rows, String createdBy, Instant now);
    boolean materialExistsByCodeCaseInsensitive(String code);
    double estimateMaterialNormUsage(String materialId);
    void insertNorm(String id, String materialId, String normCode, String name, double unitRate, String unit,
                    String scopeProjectId, String description, String createdBy, Instant now);
    void updateNorm(String id, String normCode, String name, double unitRate, String unit, String description,
                    Instant now);
    void setNormStatus(String id, String status, String approvedBy, Instant now);
    void deleteNorm(String id);
    Optional<Map<String, Object>> findNorm(String id);
    List<Map<String, Object>> norms();
    long countMaterialsTotal();
    void resetMaterialCatalogTest(Instant now);
    void mergeMaterialMaster(String keepId, String mergeId, String mergedBy, Instant now);
}