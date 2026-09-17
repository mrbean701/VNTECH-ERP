package com.vntech.erp.application.service;

import com.vntech.erp.application.port.out.AuditLogPort;
import com.vntech.erp.application.port.out.IdGenerator;
import com.vntech.erp.application.port.out.MaterialCatalogStore;
import com.vntech.erp.application.rbac.RbacService;
import com.vntech.erp.application.support.MiniJson;
import com.vntech.erp.domain.service.MaterialMatcherV2;
import com.vntech.erp.domain.service.MaterialSystemCodes;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Use-case Material Catalog — port nguyên trạng material/category/subcategory/external/uom JS.
 */
public final class MaterialCatalogManagementUseCase {

    private final MaterialCatalogStore store;
    private final IdGenerator idGenerator;
    private final RbacService rbac;
    private final AuditLogPort auditLog;

    public MaterialCatalogManagementUseCase(MaterialCatalogStore store, IdGenerator idGenerator, RbacService rbac,
                                            AuditLogPort auditLog) {
        this.store = store;
        this.idGenerator = idGenerator;
        this.rbac = rbac;
        this.auditLog = auditLog;
    }

    public interface Principal {
        String userId();
        String role();
    }

    // ============ material ============
    /**
     * TASK-045 — port lại `save_material` theo JS (`system-route.mjs:2607-2643`).
     *
     * <p><b>Lỗi nặng nhất đã sửa:</b> Java lấy {@code system} từ {@code payload.system}, nhưng UI
     * ({@code app/page.tsx:3769}) **không bao giờ gửi khoá này** — JS thì tính
     * {@code system = canonicalMeCode(category.code)}. Hệ quả: mỗi lần admin lưu một mã vật tư, Java ghi
     * {@code system='KHAC'} ⇒ **xoá hệ M&E thật** (dữ liệu đang chạy có 5/14 mã lệch, trong đó
     * {@code DIEN-DAY-CAD-001} và {@code CTN-ONG-NHUA-001} bị đặt thành {@code KHAC}).
     */
    public Map<String, Object> saveMaterial(Principal principal, Map<String, Object> payload) {
        String materialId = trim(payload.get("materialId"));
        String code = trim(payload.get("code")).toUpperCase(Locale.ROOT);
        String name = trim(payload.get("name"));
        String unit = trim(payload.get("unit"));
        String categoryId = trim(payload.get("categoryId"));
        String subcategoryId = trim(payload.get("subcategoryId"));
        // JS `:2614` — 4 trường bắt buộc (bản cũ chỉ đòi code + name).
        if (code.isEmpty() || name.isEmpty() || unit.isEmpty() || categoryId.isEmpty())
            throw Api("Mã vật tư, tên vật tư, ĐVT và hệ M&E là bắt buộc.");
        // JS `:2616-2618`.
        Map<String, Object> category = store.findCategory(categoryId)
                .orElseThrow(() -> Api("Hệ M&E không tồn tại."));
        Instant now = Instant.now();
        if (subcategoryId.isEmpty()) {
            // JS `:2619-2626` — nhóm con mặc định CHUA_PHAN_NHOM, tự tạo nếu chưa có.
            Map<String, Object> fallback = store.findSubcategoryByCode("CHUA_PHAN_NHOM", categoryId).orElse(null);
            if (fallback == null) {
                String fallbackId = idGenerator.next("SUB");
                store.insertSubcategory(fallbackId, categoryId, "CHUA_PHAN_NHOM", "Chưa phân nhóm",
                        "Nhóm mặc định", null, null, null, 9999, principal.userId(), now);
                subcategoryId = fallbackId;
            } else {
                subcategoryId = sv(fallback, "id");
            }
        }
        // JS `:2628-2630`. LƯU Ý: `findSubcategory` dùng `SELECT *` nên khoá trả về là **tên cột thật**
        // `category_id` (bẫy đã ghi ở `MaterialCatalogStoreAdapter:167`), không phải `categoryId`
        // ⇒ phải đọc CẢ HAI để không chặn oan payload đúng của UI.
        Map<String, Object> subcategory = store.findSubcategory(subcategoryId).orElse(null);
        String subOwner = subcategory == null ? "" : blankDefault(sv(subcategory, "categoryId"), sv(subcategory, "category_id"));
        if (subcategory == null || !categoryId.equals(subOwner))
            throw Api("Nhóm con không thuộc hệ M&E đã chọn.");
        // JS `:2631` — `system` suy từ MÃ NHÓM, không phải từ payload.
        String system = MaterialSystemCodes.canonicalMeCode(sv(category, "code"));
        double minStock = numberValue(payload.get("minStock"));
        if (store.materialCodeUsedElsewhere(code, materialId))
            throw Api("Mã vật tư đã tồn tại.");
        Map<String, Object> existing = materialId.isEmpty() ? null : store.findMaterial(materialId).orElse(null);
        // JS `:2641` — đổi mã gốc PHẢI có lý do, và lý do được GHI vào material_code_history.
        if (existing != null && !code.equals(sv(existing, "code"))) {
            String reason = trim(payload.get("codeChangeReason"));
            if (reason.isEmpty()) throw Api("Đổi mã gốc phải nhập lý do để lưu lịch sử.");
            store.insertCodeHistory(idGenerator.next("MCH"), materialId, sv(existing, "code"), code,
                    reason, principal.userId(), now);
        }
        double standardPrice = Math.max(0, numberValue(payload.get("standardPrice")));
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("code", code);
        m.put("name", name);
        m.put("specification", nvl(payload.get("specification")));
        m.put("brand", nvl(payload.get("brand")));
        m.put("unit", unit);
        m.put("system", system);
        m.put("categoryId", categoryId);
        m.put("subcategoryId", subcategoryId);
        m.put("standardPrice", standardPrice);
        m.put("minStock", minStock);
        m.put("requiresMar", payload.get("requiresMar") == Boolean.TRUE);
        if (existing != null) {
            m.put("id", materialId);
            store.updateMaterial(m, now);
        } else {
            m.put("id", idGenerator.next("MAT"));
            m.put("isComponent", payload.get("isComponent") == Boolean.TRUE);
            m.put("formulaKey", nvl(payload.get("formulaKey")));
            m.put("active", payload.get("active") != Boolean.FALSE);
            store.insertMaterial(m, principal.userId(), now);
        }
        String targetId = sv(m, "id");
        // ── TASK-047: ALIAS theo `aliasText` — port nguyên trạng JS `:2634-2641` ────────────────────
        //   aliasText.split(/[;\n]+/) → trim → bỏ rỗng; normalized = normalizeMaterialName(alias);
        //   BỎ alias trùng CHÍNH tên gốc và trùng nhau (giữ bản đầu tiên).
        String canonicalNormalized = MaterialSystemCodes.normalizeMaterialName(name);
        java.util.LinkedHashMap<String, String> aliasByNormalized = new java.util.LinkedHashMap<>();
        for (String raw : String.valueOf(payload.get("aliasText") == null ? "" : payload.get("aliasText"))
                .split("[;\\n]+")) {
            String alias = trim(raw);
            if (alias.isEmpty()) continue;
            String normalized = MaterialSystemCodes.normalizeMaterialName(alias);
            if (normalized.isEmpty() || normalized.equals(canonicalNormalized)) continue;
            aliasByNormalized.putIfAbsent(normalized, alias);
        }
        List<Map<String, Object>> catalog = new java.util.ArrayList<>();
        for (Map<String, Object> row : store.allMaterials())
            if (!sv(row, "id").equals(targetId)) catalog.add(row);
        // JS `:2637-2638` — tên gốc không được trùng/tương đương một mã khác.
        Map<String, Object> canonicalConflict = null;
        for (Map<String, Object> row : catalog)
            if (MaterialSystemCodes.normalizeMaterialName(sv(row, "name")).equals(canonicalNormalized)) {
                canonicalConflict = row; break;
            }
        if (canonicalConflict == null) canonicalConflict = aliasOwnerOf(canonicalNormalized, targetId);
        if (canonicalConflict != null)
            throw Api("Tên gốc “" + name + "” đã thuộc hoặc tương đương mã "
                    + sv(canonicalConflict, "code") + "; hãy chọn đúng mã gốc thay vì tạo vật tư trùng.");
        // JS `:2639` — mỗi tên tương đương không được trùng tên gốc/alias của mã khác.
        for (Map.Entry<String, String> e : aliasByNormalized.entrySet()) {
            Map<String, Object> conflict = null;
            for (Map<String, Object> row : catalog)
                if (MaterialSystemCodes.normalizeMaterialName(sv(row, "name")).equals(e.getKey())) { conflict = row; break; }
            if (conflict == null) conflict = aliasOwnerOf(e.getKey(), targetId);
            if (conflict != null)
                throw Api("Tên tương đương “" + e.getValue() + "” đang thuộc mã "
                        + sv(conflict, "code") + "; không được ghép hai vật tư khác thông số.");
        }
        // JS `:2641` — XOÁ HẾT alias cũ rồi tạo lại; JS KHÔNG hề tự tạo alias bằng chính tên gốc.
        store.deleteAliasesForMaterial(targetId);
        for (Map.Entry<String, String> e : aliasByNormalized.entrySet())
            store.insertAlias(idGenerator.next("MAL"), targetId, e.getValue(), e.getKey(), principal.userId(), now);
        // JS `:2642-2643` — audit + thông điệp.
        auditLog.log(principal.userId(), existing != null ? "UPDATE" : "CREATE", "material", targetId,
                existing == null ? null : MiniJson.stringify(existing),
                MiniJson.stringify(Map.of("code", code, "name", name, "unit", unit, "categoryId", categoryId,
                        "subcategoryId", subcategoryId, "aliases", aliasByNormalized.values())), null);
        return Map.of("message", "Đã lưu mã gốc " + code + " · " + name + " với "
                + aliasByNormalized.size() + " tên tương đương.");
    }

    /**
     * Chủ sở hữu một tên chuẩn hoá (dò bảng `material_aliases`), trừ chính mã đang sửa — tương đương
     * câu `SELECT … FROM material_aliases ma JOIN materials m … WHERE normalized_name=? AND material_id<>?`.
     * `findAliasByNormalized` dùng `SELECT *` nên phải đọc CẢ HAI dạng khoá (`materialId`/`material_id`).
     */
    private Map<String, Object> aliasOwnerOf(String normalized, String excludeMaterialId) {
        Map<String, Object> alias = store.findAliasByNormalized(normalized).orElse(null);
        if (alias == null) return null;
        String owner = blankDefault(sv(alias, "materialId"), sv(alias, "material_id"));
        if (excludeMaterialId.equals(owner)) return null;
        return store.findMaterial(owner).orElse(null);
    }

    public Map<String, Object> setMaterialStatus(Principal principal, Map<String, Object> payload) {
        String materialId = trim(payload.get("materialId"));
        store.findMaterial(materialId).orElseThrow(() -> Api("Không tìm thấy vật tư."));
        boolean active = payload.get("active") == Boolean.TRUE || "1".equals(trim(payload.get("active")));
        store.setMaterialActive(materialId, active, Instant.now());
        return Map.of("message", active ? "Đã kích hoạt vật tư." : "Đã khóa vật tư (không tạo mới nhưng giữ liên kết).");
    }

    public Map<String, Object> deleteMaterial(Principal principal, Map<String, Object> payload) {
        String materialId = trim(payload.get("materialId"));
        store.findMaterial(materialId).orElseThrow(() -> Api("Không tìm thấy vật tư."));
        long refs = store.countMaterialReferences(materialId);
        long requests = store.countRequestItems(materialId);
        long allocations = store.countMaterialLinkedAllocations(materialId);
        if (requests > 0 || allocations > 0)
            throw Api("Vật tư đã phát sinh " + requests + " dòng đề nghị và " + allocations
                    + " liên kết cấp phát. Hãy khóa (archive) thay vì xóa.");
        if (refs > 0)
            throw Api("Vật tư còn " + refs + " alias/mã tham chiếu/quy đổi. Hãy xử lý trước khi xóa.");
        store.hardDeleteMaterial(materialId);
        return Map.of("message", "Đã xóa vật tư chưa phát sinh nghiệp vụ.");
    }

    public Map<String, Object> deleteSelectedMaterials(Principal principal, Map<String, Object> payload) {
        List<String> ids = new ArrayList<>();
        List<?> rows = payload.get("materialIds") instanceof List<?> l ? l : List.of();
        for (Object o : rows) ids.add(trim(o));
        if (ids.isEmpty()) throw Api("Chưa chọn vật tư để xóa.");
        int archived = 0;
        for (String id : ids) {
            if (store.findMaterial(id).isEmpty()) continue;
            long requests = store.countRequestItems(id);
            long allocations = store.countMaterialLinkedAllocations(id);
            if (requests > 0 || allocations > 0) continue; // bỏ qua có nghiệp vụ
            store.setMaterialActive(id, false, Instant.now());
            archived++;
        }
        return Map.of("message", "Đã ẩn " + archived + " vật tư chưa phát sinh nghiệp vụ; các vật tư có liên kết được giữ nguyên.");
    }

    public Map<String, Object> deleteUnusedMaterials(Principal principal, Map<String, Object> payload) {
        List<Map<String, Object>> rows = store.materialsWithReferences();
        int removed = 0;
        for (Map<String, Object> row : rows) {
            long req = numberValue(row.get("requestItems")) > 0 ? 1 : 0;
            long alloc = numberValue(row.get("allocations")) > 0 ? 1 : 0;
            long boq = numberValue(row.get("boqItems")) > 0 ? 1 : 0;
            long mov = numberValue(row.get("movements")) > 0 ? 1 : 0;
            long merged = numberValue(row.get("mergedFrom")) > 0 ? 1 : 0;
            if (req + alloc + boq + mov + merged == 0 && !"__BOQ_STRUCTURE__".equals(sv(row, "code"))) {
                store.hardDeleteMaterial(sv(row, "id"));
                removed++;
            }
        }
        return Map.of("message", "Đã dọn " + removed + " vật tư không phát sinh nghiệp vụ.");
    }

    public Map<String, Object> previewMaterialDependencies(Principal principal, Map<String, Object> payload) {
        List<Map<String, Object>> rows = store.materialsWithReferences();
        List<Map<String, Object>> items = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("materialId", sv(row, "id"));
            item.put("code", sv(row, "code"));
            item.put("requestItems", numberValue(row.get("requestItems")));
            item.put("allocations", numberValue(row.get("allocations")));
            item.put("boqItems", numberValue(row.get("boqItems")));
            item.put("movements", numberValue(row.get("movements")));
            item.put("mergedFrom", numberValue(row.get("mergedFrom")));
            items.add(item);
        }
        return Map.of("message", "Đã đối chiếu " + items.size() + " mã vật tư với liên kết nghiệp vụ.", "items", items);
    }

    public Map<String, Object> mergeMaterialMaster(Principal principal, Map<String, Object> payload) {
        String keepId = trim(payload.get("keepMaterialId"));
        String mergeId = trim(payload.get("mergeMaterialId"));
        if (keepId.isEmpty() || mergeId.isEmpty() || keepId.equals(mergeId))
            throw Api("Hợp nhất cần hai mã vật tư khác nhau.");
        Map<String, Object> keep = store.findMaterial(keepId).orElse(null);
        Map<String, Object> merge = store.findMaterial(mergeId).orElse(null);
        if (keep == null || merge == null) throw Api("Không tìm thấy vật tư để hợp nhất.");
        store.mergeMaterialMaster(keepId, mergeId, principal.userId(), Instant.now());
        return Map.of("message", "Đã hợp nhất " + sv(merge, "code") + " vào " + sv(keep, "code")
                + "; alias/mã tham chiếu/quy đổi đã chuyển, mã cũ bị khóa.");
    }

    // ============ categories ============
    public Map<String, Object> saveMaterialCategory(Principal principal, Map<String, Object> payload) {
        String categoryId = trim(payload.get("categoryId"));
        String code = trim(payload.get("code")).toUpperCase(Locale.ROOT);
        String name = trim(payload.get("name"));
        if (code.isEmpty() || name.isEmpty()) throw Api("Mã và tên nhóm vật tư là bắt buộc.");
        Instant now = Instant.now();
        if (!categoryId.isEmpty() && store.findCategory(categoryId).isPresent()) {
            store.updateCategory(categoryId, code, name, nvl(payload.get("description")), nvl(payload.get("parentId")),
                    (int) Math.round(numberValue(payload.get("sortOrder"))), now);
            return Map.of("message", "Đã cập nhật nhóm vật tư.");
        }
        if (store.findCategoryByCode(code).isPresent()) throw Api("Mã nhóm vật tư đã tồn tại.");
        store.insertCategory(idGenerator.next("MCAT"), code, name, nvl(payload.get("description")),
                nvl(payload.get("parentId")), (int) Math.round(numberValue(payload.get("sortOrder"))),
                principal.userId(), now);
        return Map.of("message", "Đã tạo nhóm vật tư " + code + ".");
    }

    public Map<String, Object> setMaterialCategoryStatus(Principal principal, Map<String, Object> payload) {
        String categoryId = trim(payload.get("categoryId"));
        store.findCategory(categoryId).orElseThrow(() -> Api("Không tìm thấy nhóm vật tư."));
        boolean active = payload.get("active") == Boolean.TRUE || "1".equals(trim(payload.get("active")));
        store.setCategoryActive(categoryId, active, Instant.now());
        return Map.of("message", active ? "Đã kích hoạt nhóm vật tư." : "Đã ẩn nhóm vật tư.");
    }

    public Map<String, Object> deleteMaterialCategory(Principal principal, Map<String, Object> payload) {
        String categoryId = trim(payload.get("categoryId"));
        store.findCategory(categoryId).orElseThrow(() -> Api("Không tìm thấy nhóm vật tư."));
        store.deleteCategorySafe(categoryId);
        return Map.of("message", "Đã xóa nhóm vật tư.");
    }

    // ============ subcategories ============
    /**
     * Port nguyên trạng JS `save_material_subcategory` — scripts/system-route.mjs:2499-2519.
     *
     * <p><b>SỬA LỖI (TASK-041 phần 3).</b> Bản cũ lệch ba điểm:
     * <ol>
     *   <li><b>Hợp đồng payload:</b> đòi {@code code} — nhưng form UI (`MaterialSubcategoryModal`,
     *       `app/page.tsx:3758`) chỉ có {@code categoryId}, {@code name}, {@code sortOrder},
     *       {@code description} ⇒ action **luôn HTTP 400** ("Nhóm con vật tư cần nhóm cha, mã và tên.").
     *       JS tự sinh mã bằng {@code internalGroupCode(name)}.</li>
     *   <li><b>Ghi thiếu 3 cột:</b> {@code scope_examples}, {@code review_status}, {@code adjustment_note}.
     *       JS suy ra: {@code scopeExamples = payload.scopeExamples || payload.description || null};
     *       {@code reviewStatus = hợp lệ ? payload.reviewStatus : (sửa ? "approved" : "proposed")}.</li>
     *   <li><b>Không đồng bộ vật tư con</b> khi nhóm con đổi nhóm cha (JS `:2513`) ⇒ để lại
     *       {@code materials.category_id} mâu thuẫn với nhóm con.</li>
     * </ol>
     */
    public Map<String, Object> saveMaterialSubcategory(Principal principal, Map<String, Object> payload) {
        String subcategoryId = trim(payload.get("subcategoryId"));
        String categoryId = trim(payload.get("categoryId"));
        String name = trim(payload.get("name"));
        // JS: `clean(payload.code).toUpperCase() || internalGroupCode(name)` — UI không gửi `code`.
        String code = blankDefault(trim(payload.get("code")).toUpperCase(Locale.ROOT),
                MaterialSystemCodes.internalGroupCode(name));
        if (categoryId.isEmpty() || name.isEmpty())
            throw Api("Hệ M&E và tên nhóm vật tư là bắt buộc.");
        Map<String, Object> category = store.findCategory(categoryId)
                .orElseThrow(() -> Api("Hệ M&E không tồn tại."));
        String description = nvl(payload.get("description"));
        String scopeExamples = blankDefault(trim(payload.get("scopeExamples")),
                description == null ? "" : description);
        if (scopeExamples.isEmpty()) scopeExamples = null;
        String rawReview = trim(payload.get("reviewStatus"));
        String reviewStatus = List.of("proposed", "pending", "approved", "rejected").contains(rawReview)
                ? rawReview : (subcategoryId.isEmpty() ? "proposed" : "approved");
        String adjustmentNote = nvl(payload.get("adjustmentNote"));
        int sortOrder = (int) Math.round(numberValue(payload.get("sortOrder")));
        Instant now = Instant.now();
        if (!subcategoryId.isEmpty() && store.findSubcategory(subcategoryId).isPresent()) {
            store.updateSubcategory(subcategoryId, categoryId, code, name, description, scopeExamples,
                    reviewStatus, adjustmentNote, sortOrder, now);
            store.updateMaterialsForSubcategory(subcategoryId, categoryId,
                    MaterialSystemCodes.canonicalMeCode(sv(category, "code")), now);
            return Map.of("message", "Đã lưu nhóm vật tư " + name + ".");
        }
        store.insertSubcategory(idGenerator.next("SUB"), categoryId, code, name, description, scopeExamples,
                reviewStatus, adjustmentNote, sortOrder, principal.userId(), now);
        return Map.of("message", "Đã lưu nhóm vật tư " + name + ".");
    }

    public Map<String, Object> setMaterialSubcategoryStatus(Principal principal, Map<String, Object> payload) {
        String subcategoryId = trim(payload.get("subcategoryId"));
        store.findSubcategory(subcategoryId).orElseThrow(() -> Api("Không tìm thấy nhóm con."));
        boolean active = payload.get("active") == Boolean.TRUE || "1".equals(trim(payload.get("active")));
        store.setSubcategoryActive(subcategoryId, active, Instant.now());
        return Map.of("message", active ? "Đã kích hoạt nhóm con." : "Đã ẩn nhóm con.");
    }

    public Map<String, Object> deleteMaterialSubcategory(Principal principal, Map<String, Object> payload) {
        String subcategoryId = trim(payload.get("subcategoryId"));
        store.findSubcategory(subcategoryId).orElseThrow(() -> Api("Không tìm thấy nhóm con."));
        store.deleteSubcategorySafe(subcategoryId);
        return Map.of("message", "Đã xóa nhóm con vật tư.");
    }

    public Map<String, Object> bulkMaterialSubcategoryAction(Principal principal, Map<String, Object> payload) {
        List<String> ids = new ArrayList<>();
        List<?> rows = payload.get("materialIds") instanceof List<?> l ? l : List.of();
        for (Object o : rows) ids.add(trim(o));
        String subcategoryId = trim(payload.get("subcategoryId"));
        if (ids.isEmpty() || subcategoryId.isEmpty()) throw Api("Chưa chọn vật tư/nhóm con.");
        if (store.findSubcategory(subcategoryId).isEmpty()) throw Api("Nhóm con không tồn tại.");
        store.updateMaterialSubcategoryBulk(ids, subcategoryId, Instant.now());
        return Map.of("message", "Đã gán " + ids.size() + " vật tư vào nhóm con đã chọn.");
    }

    // ============ external code / uom ============
    public Map<String, Object> saveMaterialExternalCode(Principal principal, Map<String, Object> payload) {
        String materialId = trim(payload.get("materialId"));
        String codeType = trim(payload.get("codeType")).toUpperCase(Locale.ROOT);
        String ownerKey = trim(payload.get("ownerKey"));
        String externalCode = trim(payload.get("externalCode"));
        if (materialId.isEmpty() || !List.of("CONTRACT", "MAR", "SUPPLIER").contains(codeType) || externalCode.isEmpty())
            throw Api("Mapping mã tham chiếu chưa hợp lệ.");
        Map<String, Object> material = store.findMaterial(materialId)
                .orElseThrow(() -> Api("Không tìm thấy mã vật tư nội bộ."));
        Map<String, Object> existing = store.findExternalCode(codeType, ownerKey, externalCode).orElse(null);
        if (existing != null && !sv(existing, "materialId").equals(materialId))
            throw Api("Mã tham chiếu này đã mapping sang một mã vật tư nội bộ khác.");
        if (existing == null)
            store.insertExternalCode(idGenerator.next("MEC"), materialId, codeType, ownerKey, externalCode,
                    principal.userId(), Instant.now());
        return Map.of("message", "Đã mapping " + codeType + " " + externalCode + " → " + sv(material, "code") + ".");
    }

    public Map<String, Object> saveMaterialUomConversion(Principal principal, Map<String, Object> payload) {
        String materialId = trim(payload.get("materialId"));
        String fromUom = trim(payload.get("fromUom"));
        String toUom = trim(payload.get("toUom"));
        double factor = numberValue(payload.get("factor"));
        if (materialId.isEmpty() || fromUom.isEmpty() || toUom.isEmpty() || factor <= 0)
            throw Api("Quy đổi đơn vị chưa hợp lệ.");
        store.findMaterial(materialId).orElseThrow(() -> Api("Không tìm thấy vật tư."));
        store.upsertUomConversion(materialId, fromUom, toUom, factor, Instant.now());
        return Map.of("message", "Đã lưu quy đổi 1 " + fromUom + " = " + factor + " " + toUom + ".");
    }

    public Map<String, Object> checkMaterialAliasConflicts(Principal principal, Map<String, Object> payload) {
        List<Map<String, Object>> conflicts = store.aliasConflicts();
        return Map.of("message", conflicts.isEmpty() ? "Không có xung đột alias."
                : "Có " + conflicts.size() + " alias trùng giữa nhiều mã vật tư.", "conflicts", conflicts);
    }

    // ============ norms ============
    /** Port nguyên trạng JS `save_material_norm` — scripts/system-route.mjs:1930-1935. */
    public Map<String, Object> saveMaterialNorm(Principal principal, Map<String, Object> payload) {
        // SỬA LỖI (TASK-040 nhóm 3) — bản cũ đọc SAI TÊN TRƯỜNG so với thứ UI thật sự gửi
        // (app/page.tsx:2519 gửi theo `name` của input): UI gửi itemName/quantityPerUnit/projectId/baseUom/
        // subcategoryId/notes, bản cũ đọc name/unitRate/scopeProjectId/description ⇒ mọi giá trị rỗng.
        // Tệ hơn: bản cũ BẮT BUỘC `normCode` trong khi UI KHÔNG BAO GIỜ gửi (JS tự sinh `DM-%04d`)
        // ⇒ action hỏng ngay ở validate, chưa kịp tới SQL. Nay port đúng hợp đồng JS.
        String normId = trim(payload.get("normId"));
        String projectId = nvl(payload.get("projectId"));
        String subcategoryId = nvl(payload.get("subcategoryId"));
        String itemName = trim(payload.get("itemName"));
        String materialId = nvl(payload.get("materialId"));
        String baseUom = nvl(payload.get("baseUom"));
        double quantityPerUnit = strictNonNegative(payload.get("quantityPerUnit"), "Định mức tiêu hao");
        String unit = nvl(payload.get("unit"));
        String sourceComponentId = nvl(payload.get("sourceComponentId"));
        String notes = nvl(payload.get("notes"));
        if (itemName.isEmpty()) throw Api("Hạng mục áp định mức là bắt buộc.");
        if (quantityPerUnit <= 0) throw Api("Định mức tiêu hao phải lớn hơn 0.");
        if (materialId != null && store.findMaterial(materialId).filter(m -> isActiveRow(m)).isEmpty())
            throw Api("Mã vật tư không tồn tại hoặc đang bị ẩn.");
        Instant now = Instant.now();
        if (!normId.isEmpty() && store.findNorm(normId).isPresent()) {
            store.updateNorm(normId, projectId, subcategoryId, itemName, materialId, baseUom, quantityPerUnit,
                    unit, sourceComponentId, notes, now);
            return Map.of("message", "Đã cập nhật định mức vật tư.");
        }
        // JS: `const newId=id("MNR"), seq=COUNT(*)+1, normCode=DM-<4 số>`
        String normCode = "DM-" + String.format("%04d", store.countNorms() + 1);
        store.insertNorm(idGenerator.next("MNR"), normCode, projectId, subcategoryId, itemName, materialId, baseUom,
                quantityPerUnit, unit, sourceComponentId, notes, principal.userId(), now);
        return Map.of("message", "Đã thêm định mức vật tư.");
    }

    /** JS `SELECT id FROM materials WHERE id=? AND active=1` — định mức không được gắn vào vật tư đã ẩn. */
    private static boolean isActiveRow(Map<String, Object> row) {
        Object v = row.get("active");
        if (v == null) return false;
        if (v instanceof Boolean b) return b;
        return "1".equals(String.valueOf(v));
    }

    /** Port nguyên trạng JS `set_material_norm_status` — scripts/system-route.mjs:1936-1938. */
    public Map<String, Object> setMaterialNormStatus(Principal principal, Map<String, Object> payload) {
        String normId = trim(payload.get("normId"));
        // SỬA LỖI (TASK-040 nhóm 3): UI gửi `{normId, active:0|1}` (app/page.tsx:2522), bản cũ đọc `status`
        // (luôn rỗng) rồi ghi status='' + approved_by + approved_at (2 cột không tồn tại ⇒ 500).
        boolean active = payload.get("active") == Boolean.TRUE
                || List.of("1", "true", "on").contains(trim(payload.get("active")).toLowerCase(Locale.ROOT));
        store.findNorm(normId).orElseThrow(() -> Api("Không tìm thấy định mức."));
        store.setNormActive(normId, active, Instant.now());
        return Map.of("message", active ? "Đã kích hoạt định mức." : "Đã ẩn định mức.");
    }

    public Map<String, Object> deleteMaterialNorm(Principal principal, Map<String, Object> payload) {
        String normId = trim(payload.get("normId"));
        store.findNorm(normId).orElseThrow(() -> Api("Không tìm thấy định mức."));
        store.deleteNorm(normId);
        return Map.of("message", "Đã xóa định mức vật tư.");
    }

    public Map<String, Object> estimateMaterialNorms(Principal principal, Map<String, Object> payload) {
        String materialId = trim(payload.get("materialId"));
        store.findMaterial(materialId).orElseThrow(() -> Api("Không tìm thấy vật tư."));
        double usage = store.estimateMaterialNormUsage(materialId);
        return Map.of("message", "Đã ước tính mức sử dụng " + usage + " (dữ liệu lịch sử).", "estimatedUsage", usage);
    }

    // ============ import ============
    /**
     * Port nguyên trạng JS {@code import_material_catalog} — scripts/system-route.mjs:2550-2606.
     *
     * <p><b>SỬA LỖI (TASK-040 nhóm 3b):</b> UI ({@code app/page.tsx:1909-1921}) gửi mỗi dòng với các khoá
     * {@code categoryCode}, {@code categoryName}, {@code subcategoryCode}, {@code subcategoryName},
     * {@code code}, {@code name}, {@code unit}, {@code specification}, {@code brand}, {@code minStock}.
     * Bản Java cũ lại đọc {@code row.get("categoryId")}/{@code row.get("subcategoryId")} — hai khoá UI
     * <b>KHÔNG BAO GIỜ GỬI</b> ⇒ mọi vật tư nhập vào đều <b>MẤT NHÓM</b> ({@code category_id}/
     * {@code subcategory_id} = NULL), và {@code system} lấy từ khoá {@code "system"} cũng không được gửi
     * ⇒ luôn rơi về {@code "KHAC"}.
     *
     * <p>JS còn <b>tự tạo</b> nhóm/nhóm con từ mã trong tệp và cập nhật lại tên nhóm nếu khác. Nay port đủ:
     * <ul>
     *   <li>{@code system = canonicalMeCode(category.code)} — helper dùng chung ở tầng domain (đã có unit test)</li>
     *   <li>nhóm mới: {@code sort_order=999}, mô tả {@code "Tạo từ file danh mục vật tư V5.0.0"}</li>
     *   <li>nhóm con mới: {@code sort_order=999}, riêng {@code CHUA_PHAN_NHOM} là {@code 9999} và mô tả
     *       {@code "Nhóm mặc định"}</li>
     *   <li>yêu cầu đủ <b>Mã + Tên + ĐVT</b> với thông điệp riêng của JS</li>
     * </ul>
     */
    public Map<String, Object> importMaterialCatalog(Principal principal, Map<String, Object> payload) {
        List<?> rows = payload.get("rows") instanceof List<?> l ? l : List.of();
        if (rows.isEmpty()) throw Api("File danh mục vật tư không có dòng dữ liệu.");
        if (rows.size() > 5000) throw Api("Mỗi lần nhập tối đa 5.000 mã vật tư.");

        // Danh mục hiện có — có thể đã bị NULL ở tên/code nên tra bằng chuỗi đã trim + upper như JS.
        Map<String, Map<String, Object>> categoryByCode = new LinkedHashMap<>();
        for (Map<String, Object> c : store.categories()) {
            categoryByCode.put(sv(c, "code").trim().toUpperCase(Locale.ROOT), c);
        }
        Map<String, Map<String, Object>> subcategoryByKey = new LinkedHashMap<>();
        for (Map<String, Object> s : store.subcategories()) {
            subcategoryByKey.put(sv(s, "categoryId") + ":" + sv(s, "code").trim().toUpperCase(Locale.ROOT), s);
        }

        List<Map<String, Object>> prepared = new ArrayList<>();
        int createdCategories = 0;
        int createdSubcategories = 0;
        Instant now = Instant.now();
        for (int i = 0; i < rows.size(); i++) {
            Map<String, Object> row = asMap(rows.get(i));
            int rowNo = i + 1;
            String code = trim(row.get("code")).toUpperCase(Locale.ROOT);
            String name = trim(row.get("name"));
            String unit = trim(row.get("unit"));
            // JS: `if (!code || !name || !unit) throw ... Dòng N: cần đủ Mã vật tư, Tên vật tư và ĐVT.`
            if (code.isEmpty() || name.isEmpty() || unit.isEmpty())
                throw Api("Dòng " + rowNo + ": cần đủ Mã vật tư, Tên vật tư và ĐVT.");
            String categoryCode = blankDefault(trim(row.get("categoryCode")).toUpperCase(Locale.ROOT), "KHAC");
            String categoryName = blankDefault(trim(row.get("categoryName")), categoryCode);
            String subcategoryName = blankDefault(trim(row.get("subcategoryName")), "Chưa phân nhóm");
            String subcategoryCode = blankDefault(trim(row.get("subcategoryCode")).toUpperCase(Locale.ROOT),
                    MaterialSystemCodes.internalGroupCode(subcategoryName));

            Map<String, Object> category = categoryByCode.get(categoryCode);
            if (category == null) {
                String categoryId = idGenerator.next("CAT");
                category = new LinkedHashMap<>();
                category.put("id", categoryId);
                category.put("code", categoryCode);
                category.put("name", categoryName);
                categoryByCode.put(categoryCode, category);
                createdCategories++;
                store.insertCategory(categoryId, categoryCode, categoryName,
                        "Tạo từ file danh mục vật tư V5.0.0", null, 999, principal.userId(), now);
            } else if (!categoryName.isEmpty() && !categoryName.equals(sv(category, "name"))) {
                category.put("name", categoryName);
                store.renameCategoryActive(sv(category, "id"), categoryName, now);
            }

            String categoryId = sv(category, "id");
            String subKey = categoryId + ":" + subcategoryCode;
            Map<String, Object> subcategory = subcategoryByKey.get(subKey);
            if (subcategory == null) {
                String subcategoryId = idGenerator.next("SUB");
                boolean ungrouped = "CHUA_PHAN_NHOM".equals(subcategoryCode);
                subcategory = new LinkedHashMap<>();
                subcategory.put("id", subcategoryId);
                subcategory.put("categoryId", categoryId);
                subcategory.put("code", subcategoryCode);
                subcategory.put("name", subcategoryName);
                subcategoryByKey.put(subKey, subcategory);
                createdSubcategories++;
                store.insertSubcategory(subcategoryId, categoryId, subcategoryCode, subcategoryName,
                        ungrouped ? "Nhóm mặc định" : "Tạo từ file danh mục vật tư V5.0.0",
                        // 3 tham số này để null — ĐÚNG như JS `system-route.mjs:2593`: câu INSERT của luồng
                        // NHẬP DANH MỤC VẬT TƯ không ghi scope_examples/review_status/adjustment_note.
                        null, null, null,
                        ungrouped ? 9999 : 999, principal.userId(), now);
            } else if (!subcategoryName.isEmpty() && !subcategoryName.equals(sv(subcategory, "name"))) {
                subcategory.put("name", subcategoryName);
                store.renameSubcategoryActive(sv(subcategory, "id"), subcategoryName, now);
            }

            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", idGenerator.next("MAT"));
            m.put("code", code);
            m.put("name", name);
            m.put("system", MaterialSystemCodes.canonicalMeCode(categoryCode));
            m.put("categoryId", categoryId);
            m.put("subcategoryId", sv(subcategory, "id"));
            m.put("specification", nvl(row.get("specification")));
            m.put("brand", nvl(row.get("brand")));
            m.put("unit", unit);
            m.put("minStock", Math.max(0, numberValue(row.get("minStock"))));
            prepared.add(m);
        }
        store.importMaterialsBulk(prepared, now);

        List<String> extra = new ArrayList<>();
        if (createdCategories > 0) extra.add(createdCategories + " hệ M&E");
        if (createdSubcategories > 0) extra.add(createdSubcategories + " nhóm con");
        String suffix = extra.isEmpty() ? "" : "; tạo mới " + String.join(" và ", extra);
        return Map.of("message", "Đã nhập/cập nhật " + rows.size() + " mã vật tư" + suffix + ".");
    }

    private String existingIdByCode(String code) {
        Map<String, Object> m = store.findMaterialByCode(code).orElse(null);
        return m != null ? sv(m, "id") : "";
    }

    public Map<String, Object> resetMaterialCatalogTest(Principal principal, Map<String, Object> payload) {
        store.resetMaterialCatalogTest(Instant.now());
        return Map.of("message", "Đã ẩn toàn bộ vật tư TEST khỏi catalog.");
    }

    // ---- helpers ----
    private static double strictNonNegative(Object o, String label) {
        String raw = trim(o);
        if (raw.isEmpty()) throw Api(label + " không được để trống.");
        try { double v = Double.parseDouble(raw); if (v < 0) throw Api(label + " không hợp lệ."); return v; }
        catch (NumberFormatException e) { throw Api(label + " không hợp lệ."); }
    }
    private static double numberValue(Object o) {
        try { return o == null ? 0 : Double.parseDouble(String.valueOf(o)); }
        catch (NumberFormatException e) { return 0; }
    }
    private static String sv(Map<String, Object> m, String k) { Object v = m.get(k); return v == null ? "" : String.valueOf(v); }
    private static String trim(Object o) { return o == null ? "" : String.valueOf(o).trim(); }
    private static String nvl(Object o) { String s = trim(o); return s.isEmpty() ? null : s; }
    private static String blankDefault(String s, String fallback) { return s.isEmpty() ? fallback : s; }
    @SuppressWarnings("unchecked")
    private static Map<String, Object> asMap(Object o) { return o instanceof Map ? (Map) o : Map.of(); }
    private static AuthUseCase.ApiError Api(String message) { return new AuthUseCase.ApiError(message, 400); }
}