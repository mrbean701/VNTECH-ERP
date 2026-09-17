package com.vntech.erp.application.service;

import com.vntech.erp.application.port.out.IdGenerator;
import com.vntech.erp.application.port.out.MaterialCatalogStore;
import com.vntech.erp.application.rbac.RbacService;
import com.vntech.erp.domain.service.MaterialMatcherV2;

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

    public MaterialCatalogManagementUseCase(MaterialCatalogStore store, IdGenerator idGenerator, RbacService rbac) {
        this.store = store;
        this.idGenerator = idGenerator;
        this.rbac = rbac;
    }

    public interface Principal {
        String userId();
        String role();
    }

    // ============ material ============
    public Map<String, Object> saveMaterial(Principal principal, Map<String, Object> payload) {
        String materialId = trim(payload.get("materialId"));
        String code = trim(payload.get("code")).toUpperCase(Locale.ROOT);
        String name = trim(payload.get("name"));
        if (code.isEmpty() || name.isEmpty()) throw Api("Mã và tên vật tư là bắt buộc.");
        if (store.materialCodeUsedElsewhere(code, materialId))
            throw Api("Mã vật tư đã tồn tại.");
        double standardPrice = Math.max(0, numberValue(payload.get("standardPrice")));
        Instant now = Instant.now();
        if (!materialId.isEmpty() && store.findMaterial(materialId).isPresent()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", materialId);
            m.put("code", code);
            m.put("name", name);
            m.put("specification", nvl(payload.get("specification")));
            m.put("brand", nvl(payload.get("brand")));
            m.put("unit", nvl(payload.get("unit")));
            m.put("system", blankDefault(trim(payload.get("system")), "KHAC").toUpperCase(Locale.ROOT));
            m.put("categoryId", nvl(payload.get("categoryId")));
            m.put("subcategoryId", nvl(payload.get("subcategoryId")));
            m.put("standardPrice", standardPrice);
            m.put("requiresMar", payload.get("requiresMar") == Boolean.TRUE);
            m.put("isComponent", payload.get("isComponent") == Boolean.TRUE);
            m.put("formulaKey", nvl(payload.get("formulaKey")));
            store.updateMaterial(m, now);
            return Map.of("message", "Đã cập nhật vật tư " + code + ".");
        }
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", idGenerator.next("MAT"));
        m.put("code", code);
        m.put("name", name);
        m.put("specification", nvl(payload.get("specification")));
        m.put("brand", nvl(payload.get("brand")));
        m.put("unit", nvl(payload.get("unit")));
        m.put("system", blankDefault(trim(payload.get("system")), "KHAC").toUpperCase(Locale.ROOT));
        m.put("categoryId", nvl(payload.get("categoryId")));
        m.put("subcategoryId", nvl(payload.get("subcategoryId")));
        m.put("standardPrice", standardPrice);
        m.put("requiresMar", payload.get("requiresMar") == Boolean.TRUE);
        m.put("isComponent", payload.get("isComponent") == Boolean.TRUE);
        m.put("active", payload.get("active") != Boolean.FALSE);
        m.put("formulaKey", nvl(payload.get("formulaKey")));
        store.insertMaterial(m, principal.userId(), now);
        // alias theo chuẩn hóa
        String normalized = MaterialMatcherV2.normalizeMaterialText(name);
        if (!normalized.isEmpty() && store.findAliasByNormalized(normalized).isEmpty())
            store.insertAlias(idGenerator.next("MAL"), sv(m, "id"), name, normalized, principal.userId(), now);
        return Map.of("message", "Đã tạo vật tư " + code + ".");
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
    public Map<String, Object> saveMaterialSubcategory(Principal principal, Map<String, Object> payload) {
        String subcategoryId = trim(payload.get("subcategoryId"));
        String categoryId = trim(payload.get("categoryId"));
        String code = trim(payload.get("code")).toUpperCase(Locale.ROOT);
        String name = trim(payload.get("name"));
        if (categoryId.isEmpty() || code.isEmpty() || name.isEmpty())
            throw Api("Nhóm con vật tư cần nhóm cha, mã và tên.");
        if (store.findCategory(categoryId).isEmpty()) throw Api("Nhóm cha không tồn tại.");
        Instant now = Instant.now();
        if (!subcategoryId.isEmpty() && store.findSubcategory(subcategoryId).isPresent()) {
            store.updateSubcategory(subcategoryId, categoryId, code, name, nvl(payload.get("description")),
                    (int) Math.round(numberValue(payload.get("sortOrder"))), now);
            return Map.of("message", "Đã cập nhật nhóm con vật tư.");
        }
        if (store.findSubcategoryByCode(code, categoryId).isPresent())
            throw Api("Mã nhóm con đã tồn tại trong nhóm cha.");
        store.insertSubcategory(idGenerator.next("MSCAT"), categoryId, code, name, nvl(payload.get("description")),
                (int) Math.round(numberValue(payload.get("sortOrder"))), principal.userId(), now);
        return Map.of("message", "Đã tạo nhóm con " + code + ".");
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
    public Map<String, Object> importMaterialCatalog(Principal principal, Map<String, Object> payload) {
        List<?> rows = payload.get("rows") instanceof List<?> l ? l : List.of();
        if (rows.isEmpty()) throw Api("File không có dữ liệu vật tư.");
        if (rows.size() > 5000) throw Api("Mỗi lần nhập tối đa 5.000 dòng.");
        List<Map<String, Object>> prepared = new ArrayList<>();
        int updated = 0, created = 0;
        Instant now = Instant.now();
        for (int i = 0; i < rows.size(); i++) {
            Map<String, Object> row = asMap(rows.get(i));
            int rowNo = i + 1;
            String code = trim(row.get("code")).toUpperCase(Locale.ROOT);
            String name = trim(row.get("name"));
            if (code.isEmpty() || name.isEmpty()) throw Api("Dòng " + rowNo + ": thiếu mã hoặc tên vật tư.");
            boolean exists = store.materialExistsByCodeCaseInsensitive(code);
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", exists ? existingIdByCode(code) : idGenerator.next("MAT"));
            m.put("code", code);
            m.put("name", name);
            m.put("specification", nvl(row.get("specification")));
            m.put("unit", nvl(row.get("unit")));
            m.put("system", blankDefault(trim(row.get("system")), "KHAC").toUpperCase(Locale.ROOT));
            m.put("categoryId", nvl(row.get("categoryId")));
            m.put("subcategoryId", nvl(row.get("subcategoryId")));
            // SỬA LỖI (TASK-040 nhóm 3): bản cũ chuẩn bị các khoá `standardPrice`/`requiresMar`/`isComponent`
            // để ghi vào `materials` — nhưng `is_component` KHÔNG tồn tại trong bảng đó ⇒ 500. JS
            // (scripts/system-route.mjs:2600) ghi standard_price=0, requires_mar=0, requires_cocq=0 và lấy
            // `min_stock` từ dòng nhập, `brand` từ dòng nhập ⇒ đổi sang đúng tập khoá JS.
            m.put("brand", nvl(row.get("brand")));
            m.put("minStock", Math.max(0, numberValue(row.get("minStock"))));
            prepared.add(m);
            if (exists) updated++; else created++;
        }
        store.importMaterialsBulk(prepared, now);
        return Map.of("message", "Đã nhập " + rows.size() + " dòng: " + created + " mới, " + updated + " cập nhật.");
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