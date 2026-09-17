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
    /**
     * Đổi tên nhóm vật tư và BẬT lại ({@code active=1}) — đúng JS `scripts/system-route.mjs:2585`.
     *
     * <p><b>THÊM Ở TASK-040 nhóm 3b:</b> nhập danh mục vật tư phải tự cập nhật tên nhóm theo tệp, nhưng
     * {@code updateCategory} ghi đè cả {@code code}/{@code description}/{@code sort_order} và không bật
     * {@code active} ⇒ cần một câu lệnh đúng như JS thay vì lạm dụng hàm cũ.
     */
    void renameCategoryActive(String id, String name, Instant now);
    void insertCategory(String id, String code, String name, String description, String parentId,
                        int sortOrder, String createdBy, Instant now);
    void updateCategory(String id, String code, String name, String description, String parentId,
                        int sortOrder, Instant now);
    void setCategoryActive(String id, boolean active, Instant now);
    void deleteCategorySafe(String id);
    Optional<Map<String, Object>> findSubcategory(String id);
    Optional<Map<String, Object>> findSubcategoryByCode(String code, String categoryId);
    List<Map<String, Object>> subcategories();
    /**
     * Đổi tên nhóm con và BẬT lại ({@code active=1}) — đúng JS `scripts/system-route.mjs:2598`.
     * Xem {@link #renameCategoryActive} để hiểu vì sao không dùng {@code updateSubcategory}.
     */
    void renameSubcategoryActive(String id, String name, Instant now);
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
    /**
     * Nhập hàng loạt vật tư — port theo JS `scripts/system-route.mjs:2600`.
     *
     * <p><b>SỬA LỖI (TASK-040 nhóm 3):</b> bản cũ nhận thêm {@code createdBy} và ghi cột {@code created_by}
     * — cột này <b>không tồn tại</b> trong `materials` (và JS cũng không ghi) ⇒ bỏ tham số cho khỏi ghi sai.
     * Mỗi dòng cần các khoá: `id`, `code`, `name`, `system`, `categoryId`, `subcategoryId`, `specification`,
     * `brand`, `unit`, `minStock`.
     */
    void importMaterialsBulk(List<Map<String, Object>> rows, Instant now);
    boolean materialExistsByCodeCaseInsensitive(String code);
    double estimateMaterialNormUsage(String materialId);
    /** Số dòng định mức hiện có — dùng để sinh mã `DM-%04d` như JS `SELECT COUNT(*)+1` (system-route.mjs:1934). */
    long countNorms();
    /**
     * INSERT định mức — <b>17 cột</b> như JS `save_material_norm` (scripts/system-route.mjs:1934).
     *
     * <p><b>SỬA LỖI (TASK-040 nhóm 3):</b> chữ ký cũ ghi {@code name}/{@code unit_rate}/{@code scope_project_id}/
     * {@code description} — bốn cột này <b>không tồn tại</b> trong `material_norms` (cột thật là
     * {@code item_name}/{@code quantity_per_unit}/{@code project_id}/{@code notes}) ⇒ HTTP 500. Đồng thời
     * bản cũ <b>bỏ sót</b> {@code subcategory_id}, {@code base_uom}, {@code source_component_id},
     * {@code source_type} và ghi {@code status='pending'} trong khi JS ghi {@code 'active'}.
     */
    void insertNorm(String id, String normCode, String projectId, String subcategoryId, String itemName,
                    String materialId, String baseUom, double quantityPerUnit, String unit,
                    String sourceComponentId, String notes, String createdBy, Instant now);
    /**
     * UPDATE định mức — 10 cột như JS (scripts/system-route.mjs:1933). JS <b>KHÔNG</b> cập nhật {@code norm_code}
     * và <b>KHÔNG</b> cập nhật {@code source_type} ở nhánh này (bản Java cũ lại đi cập nhật `norm_code`).
     */
    void updateNorm(String id, String projectId, String subcategoryId, String itemName, String materialId,
                    String baseUom, double quantityPerUnit, String unit, String sourceComponentId, String notes,
                    Instant now);
    /**
     * Bật/tắt định mức — JS `set_material_norm_status` (scripts/system-route.mjs:1937) nhận
     * <b>{@code active}</b> (0/1) và ghi {@code active} + {@code status = 'active'|'inactive'}.
     *
     * <p>Bản cũ nhận một chuỗi `status` tuỳ ý rồi ghi thêm {@code approved_by}/{@code approved_at} —
     * hai cột <b>không tồn tại</b> ⇒ HTTP 500; và vì UI chỉ gửi {@code active} nên `status` luôn rỗng
     * ⇒ dù có tồn tại cột thì cũng ghi rỗng. Xem `app/page.tsx:2522`.
     */
    void setNormActive(String id, boolean active, Instant now);
    void deleteNorm(String id);
    Optional<Map<String, Object>> findNorm(String id);
    List<Map<String, Object>> norms();
    long countMaterialsTotal();
    void resetMaterialCatalogTest(Instant now);
    void mergeMaterialMaster(String keepId, String mergeId, String mergedBy, Instant now);
}