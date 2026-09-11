package com.vntech.erp.infrastructure.persistence;

import com.vntech.erp.application.port.out.MaterialCatalogStore;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/** Adapter Material Catalog. */
@Component
public class MaterialCatalogStoreAdapter implements MaterialCatalogStore {

    private final JdbcTemplate jdbcTemplate;

    public MaterialCatalogStoreAdapter(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private Optional<Map<String, Object>> first(String sql, Object... args) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, args);
        return rows.isEmpty() ? Optional.empty() : Optional.of(new LinkedHashMap<>(rows.get(0)));
    }

    // ---- materials ----
    @Override public Optional<Map<String, Object>> findMaterial(String id) { return first("SELECT * FROM materials WHERE id=?", id); }
    @Override public Optional<Map<String, Object>> findMaterialByCode(String code) { return first("SELECT * FROM materials WHERE code=?", code); }

    @Override
    public boolean materialCodeUsedElsewhere(String code, String excludeId) {
        Long n = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM materials WHERE code=? AND id<>COALESCE(?, '')",
                Long.class, code, excludeId == null ? "" : excludeId);
        return n != null && n > 0;
    }

    @Override @Transactional
    public void insertMaterial(Map<String, Object> m, String createdBy, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO materials (id,code,name,system,specification,brand,unit,standard_price,requires_mar,
                                       active,category_id,subcategory_id,created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                m.get("id"), m.get("code"), m.get("name"),
                m.get("system") != null ? m.get("system") : "KHAC",
                m.get("specification"), m.get("brand"),
                m.get("unit") != null ? m.get("unit") : "",
                m.get("standardPrice") != null ? m.get("standardPrice") : 0,
                m.get("requiresMar") == Boolean.TRUE ? 1 : 0,
                m.get("active") == Boolean.FALSE ? 0 : 1,
                m.get("categoryId"), m.get("subcategoryId"), now, now);
    }

    @Override @Transactional
    public void updateMaterial(Map<String, Object> m, Instant now) {
        jdbcTemplate.update("""
                UPDATE materials SET code=?,name=?,system=?,specification=?,brand=?,unit=?,category_id=?,
                       subcategory_id=?,standard_price=?,requires_mar=?,updated_at=?
                WHERE id=?""",
                m.get("code"), m.get("name"), m.get("system") != null ? m.get("system") : "KHAC",
                m.get("specification"), m.get("brand"), m.get("unit"),
                m.get("categoryId"), m.get("subcategoryId"), m.get("standardPrice"),
                m.get("requiresMar") == Boolean.TRUE ? 1 : 0, now, m.get("id"));
    }

    @Override @Transactional
    public void setMaterialActive(String id, boolean active, Instant now) {
        jdbcTemplate.update("UPDATE materials SET active=?,updated_at=? WHERE id=?", active ? 1 : 0, now, id);
    }

    @Override @Transactional
    public void hardDeleteMaterial(String id) {
        jdbcTemplate.update("DELETE FROM materials WHERE id=?", id);
    }

    @Override
    public long countMaterialReferences(String id) {
        return count3("""
                SELECT (SELECT COUNT(*) FROM material_aliases WHERE material_id=?)
                     + (SELECT COUNT(*) FROM material_external_codes WHERE material_id=?)
                     + (SELECT COUNT(*) FROM material_uom_conversions WHERE material_id=?)""", id);
    }

    @Override
    public long countRequestItems(String id) {
        Long n = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM material_request_items WHERE material_id=?", Long.class, id);
        return n == null ? 0 : n;
    }

    @Override
    public long countMaterialLinkedAllocations(String id) {
        Long n = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM procurement_allocations WHERE material_id=?", Long.class, id);
        return n == null ? 0 : n;
    }

    @Override
    public List<Map<String, Object>> materialsWithReferences() {
        return jdbcTemplate.queryForList("""
                SELECT m.id,m.code,m.name,m.active,
                       (SELECT COUNT(*) FROM material_request_items mri WHERE mri.material_id=m.id) AS requestItems,
                       (SELECT COUNT(*) FROM procurement_allocations pa WHERE pa.material_id=m.id) AS allocations,
                       (SELECT COUNT(*) FROM project_boq_items pbi WHERE pbi.material_id=m.id) AS boqItems,
                       (SELECT COUNT(*) FROM stock_movements sm WHERE sm.material_id=m.id) AS movements,
                       (SELECT COUNT(*) FROM materials me WHERE me.code_merge_into_id=m.id) AS mergedFrom
                FROM materials m""");
    }

    @Override public List<Map<String, Object>> allMaterials() {
        return jdbcTemplate.queryForList("SELECT * FROM materials ORDER BY code");
    }

    @Override @Transactional
    public void deactivateSelectedMaterials(List<String> ids, Instant now) {
        for (String id : ids) jdbcTemplate.update("UPDATE materials SET active=0,updated_at=? WHERE id=?", now, id);
    }

    // ---- categories ----
    @Override public Optional<Map<String, Object>> findCategory(String id) { return first("SELECT * FROM material_categories WHERE id=?", id); }
    @Override public Optional<Map<String, Object>> findCategoryByCode(String code) { return first("SELECT * FROM material_categories WHERE code=?", code); }
    @Override public List<Map<String, Object>> categories() { return jdbcTemplate.queryForList("SELECT * FROM material_categories ORDER BY sort_order,code"); }

    @Override @Transactional
    public void insertCategory(String id, String code, String name, String description, String parentId,
                               int sortOrder, String createdBy, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO material_categories (id,code,name,description,sort_order,active,
                                                 created_at,updated_at)
                VALUES (?,?,?,?,?,1,?,?)""", id, code, name, description, sortOrder, now, now);
    }

    @Override @Transactional
    public void updateCategory(String id, String code, String name, String description, String parentId,
                               int sortOrder, Instant now) {
        jdbcTemplate.update("""
                UPDATE material_categories SET code=?,name=?,description=?,sort_order=?,updated_at=?
                WHERE id=?""", code, name, description, sortOrder, now, id);
    }

    @Override @Transactional
    public void setCategoryActive(String id, boolean active, Instant now) {
        jdbcTemplate.update("UPDATE material_categories SET active=?,updated_at=? WHERE id=?", active ? 1 : 0, now, id);
    }

    @Override @Transactional
    public void deleteCategorySafe(String id) {
        jdbcTemplate.update("DELETE FROM material_categories WHERE id=?", id);
    }

    // ---- subcategories ----
    @Override public Optional<Map<String, Object>> findSubcategory(String id) { return first("SELECT * FROM material_subcategories WHERE id=?", id); }
    @Override public Optional<Map<String, Object>> findSubcategoryByCode(String code, String categoryId) { return first("SELECT * FROM material_subcategories WHERE code=? AND category_id=?", code, categoryId); }
    @Override public List<Map<String, Object>> subcategories() { return jdbcTemplate.queryForList("SELECT * FROM material_subcategories ORDER BY sort_order,code"); }

    @Override @Transactional
    public void insertSubcategory(String id, String categoryId, String code, String name, String description,
                                  int sortOrder, String createdBy, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO material_subcategories (id,category_id,code,name,description,sort_order,active,
                                                    created_at,updated_at)
                VALUES (?,?,?,?,?,?,1,?,?)""", id, categoryId, code, name, description, sortOrder, now, now);
    }

    @Override @Transactional
    public void updateSubcategory(String id, String categoryId, String code, String name, String description,
                                  int sortOrder, Instant now) {
        jdbcTemplate.update("""
                UPDATE material_subcategories SET category_id=?,code=?,name=?,description=?,sort_order=?,updated_at=?
                WHERE id=?""", categoryId, code, name, description, sortOrder, now, id);
    }

    @Override @Transactional
    public void setSubcategoryActive(String id, boolean active, Instant now) {
        jdbcTemplate.update("UPDATE material_subcategories SET active=?,updated_at=? WHERE id=?", active ? 1 : 0, now, id);
    }

    @Override @Transactional
    public void deleteSubcategorySafe(String id) {
        jdbcTemplate.update("DELETE FROM material_subcategories WHERE id=?", id);
    }

    // ---- aliases / external / uom ----
    @Override public List<Map<String, Object>> materialAliases(String materialId) {
        return jdbcTemplate.queryForList("SELECT * FROM material_aliases WHERE material_id=?", materialId);
    }

    @Override public Optional<Map<String, Object>> findAliasByNormalized(String normalized) {
        return first("SELECT * FROM material_aliases WHERE normalized_name=?", normalized);
    }

    @Override @Transactional
    public void insertAlias(String id, String materialId, String aliasName, String normalized, String createdBy, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO material_aliases (id,material_id,alias_name,normalized_name,verified,active,created_by,
                                              created_at,updated_at)
                VALUES (?,?,?,?,0,1,?,?,?)""", id, materialId, aliasName, normalized, createdBy, now, now);
    }

    @Override
    public List<Map<String, Object>> aliasConflicts() {
        return jdbcTemplate.queryForList("""
                SELECT a.alias_name AS aliasName,a.normalized_name AS normalizedName,
                       GROUP_CONCAT(DISTINCT a.material_id) AS materialIds,
                       COUNT(DISTINCT a.material_id) AS materialCount
                FROM material_aliases a WHERE a.active=1
                GROUP BY a.normalized_name HAVING COUNT(DISTINCT a.material_id)>1""");
    }

    @Override @Transactional
    public void updateMaterialSubcategoryBulk(List<String> ids, String subcategoryId, Instant now) {
        for (String id : ids) {
            jdbcTemplate.update("UPDATE materials SET subcategory_id=?,updated_at=? WHERE id=?", subcategoryId, now, id);
        }
    }

    @Override @Transactional
    public void insertExternalCode(String id, String materialId, String codeType, String ownerKey, String externalCode,
                                   String createdBy, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO material_external_codes (id,material_id,code_type,owner_key,external_code,active,
                                                     created_at,updated_at)
                VALUES (?,?,?,?,?,1,?,?)""", id, materialId, codeType, ownerKey, externalCode, now, now);
    }

    @Override
    public Optional<Map<String, Object>> findExternalCode(String codeType, String ownerKey, String externalCode) {
        return first("""
                SELECT id,material_id AS materialId FROM material_external_codes
                WHERE code_type=? AND owner_key=? AND upper(external_code)=upper(?)""",
                codeType, ownerKey, externalCode);
    }

    @Override
    public boolean uomConversionExists(String materialId, String fromUom, String toUom) {
        Long n = jdbcTemplate.queryForObject("""
                SELECT COUNT(*) FROM material_uom_conversions
                WHERE material_id=? AND lower(from_uom)=lower(?) AND lower(to_uom)=lower(?)""",
                Long.class, materialId, fromUom, toUom);
        return n != null && n > 0;
    }

    @Override @Transactional
    public void upsertUomConversion(String materialId, String fromUom, String toUom, double factor, Instant now) {
        if (uomConversionExists(materialId, fromUom, toUom)) {
            jdbcTemplate.update("""
                    UPDATE material_uom_conversions SET factor=?,active=1,updated_at=? WHERE material_id=?
                    AND lower(from_uom)=lower(?) AND lower(to_uom)=lower(?)""", factor, now, materialId, fromUom, toUom);
        } else {
            jdbcTemplate.update("""
                    INSERT INTO material_uom_conversions (id,material_id,from_uom,to_uom,factor,active,created_at,updated_at)
                    VALUES (?,?,?,?,?,1,?,?)""", "UOM_" + java.util.UUID.randomUUID(), materialId, fromUom, toUom,
                    factor, now, now);
        }
    }

    @Override
    public boolean materialExistsByCodeCaseInsensitive(String code) {
        Long n = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM materials WHERE upper(code)=upper(?)",
                Long.class, code);
        return n != null && n > 0;
    }

    @Override @Transactional
    public void importMaterialsBulk(List<Map<String, Object>> rows, String createdBy, Instant now) {
        for (Map<String, Object> m : rows) {
            jdbcTemplate.update("""
                    INSERT INTO materials (id,code,name,specification,unit,system,category_id,subcategory_id,
                                           standard_price,requires_mar,is_component,active,created_by,created_at,updated_at)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,1,?,?,?)
                    ON DUPLICATE KEY UPDATE name=VALUES(name),specification=VALUES(specification),unit=VALUES(unit),
                        system=VALUES(system),category_id=VALUES(category_id),subcategory_id=VALUES(subcategory_id),
                        standard_price=VALUES(standard_price),updated_at=VALUES(updated_at)""",
                    m.get("id"), m.get("code"), m.get("name"), m.get("specification"), m.get("unit"), m.get("system"),
                    m.get("categoryId"), m.get("subcategoryId"), m.get("standardPrice"),
                    m.get("requiresMar") == Boolean.TRUE ? 1 : 0, m.get("isComponent") == Boolean.TRUE ? 1 : 0,
                    createdBy, now, now);
        }
    }

    @Override
    public double estimateMaterialNormUsage(String materialId) {
        return 0;
    }

    @Override @Transactional
    public void insertNorm(String id, String materialId, String normCode, String name, double unitRate, String unit,
                           String scopeProjectId, String description, String createdBy, Instant now) {
        jdbcTemplate.update("""
                INSERT INTO material_norms (id,material_id,norm_code,name,unit_rate,unit,scope_project_id,
                                            description,status,active,created_by,created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,'pending',1,?,?,?)""",
                id, materialId, normCode, name, unitRate, unit, scopeProjectId, description, createdBy, now, now);
    }

    @Override @Transactional
    public void updateNorm(String id, String normCode, String name, double unitRate, String unit, String description,
                           Instant now) {
        jdbcTemplate.update("""
                UPDATE material_norms SET norm_code=?,name=?,unit_rate=?,unit=?,description=?,updated_at=? WHERE id=?""",
                normCode, name, unitRate, unit, description, now, id);
    }

    @Override @Transactional
    public void setNormStatus(String id, String status, String approvedBy, Instant now) {
        jdbcTemplate.update("""
                UPDATE material_norms SET status=?,approved_by=?,approved_at=?,updated_at=? WHERE id=?""",
                status, status.equals("approved") ? approvedBy : null, status.equals("approved") ? now : null, now, id);
    }

    @Override @Transactional
    public void deleteNorm(String id) {
        jdbcTemplate.update("DELETE FROM material_norms WHERE id=?", id);
    }

    @Override public Optional<Map<String, Object>> findNorm(String id) { return first("SELECT * FROM material_norms WHERE id=?", id); }
    @Override public List<Map<String, Object>> norms() { return jdbcTemplate.queryForList("SELECT * FROM material_norms ORDER BY norm_code"); }

    @Override
    public long countMaterialsTotal() {
        Long n = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM materials WHERE code<>'__BOQ_STRUCTURE__'", Long.class);
        return n == null ? 0 : n;
    }

    @Override @Transactional
    public void resetMaterialCatalogTest(Instant now) {
        jdbcTemplate.update("UPDATE materials SET active=0,updated_at=? WHERE code LIKE 'TEST%'", now);
    }

    @Override @Transactional
    public void mergeMaterialMaster(String keepId, String mergeId, String mergedBy, Instant now) {
        jdbcTemplate.update("UPDATE material_aliases SET material_id=? WHERE material_id=?", keepId, mergeId);
        jdbcTemplate.update("UPDATE material_external_codes SET material_id=? WHERE material_id=?", keepId, mergeId);
        jdbcTemplate.update("UPDATE material_uom_conversions SET material_id=? WHERE material_id=?", keepId, mergeId);
        jdbcTemplate.update("""
                UPDATE materials SET active=0,code=CONCAT(code,'_X'),updated_at=? WHERE id=?""", now, mergeId);
    }

    private long count3(String sql, String id) {
        Long n = jdbcTemplate.queryForObject(sql, Long.class, id, id, id);
        return n == null ? 0 : n;
    }
}