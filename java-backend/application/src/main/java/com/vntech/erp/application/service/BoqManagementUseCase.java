package com.vntech.erp.application.service;

import com.vntech.erp.application.port.out.BoqStore;
import com.vntech.erp.application.port.out.IdGenerator;
import com.vntech.erp.application.rbac.AccessScopeService;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

/**
 * Use-case BOQ — port nguyên trạng save_boq_version/save_boq_item/set_boq_item_status của monolith JS.
 */
public final class BoqManagementUseCase {

    private static final Set<String> ROW_ROLES = Set.of("section", "system", "group", "heading", "description",
            "material", "component", "subtotal", "note");

    private final BoqStore store;
    private final IdGenerator idGenerator;
    private final AccessScopeService accessScope;

    public BoqManagementUseCase(BoqStore store, IdGenerator idGenerator, AccessScopeService accessScope) {
        this.store = store;
        this.idGenerator = idGenerator;
        this.accessScope = accessScope;
    }

    public interface Principal {
        String userId();
        String role();
        String fullName();
    }

    // ============ save_boq_version ============
    public Map<String, Object> saveBoqVersion(Principal principal, Map<String, Object> payload) {
        String projectId = trim(payload.get("projectId"));
        // JS 816.
        accessScope.requireProjectAccess(principal.userId(), principal.role(), projectId, true,
                "Không có quyền BOQ dự án này.");

        Map<String, Object> contract = resolveContract(projectId, trim(payload.get("contractId")));
        Boolean makeActive = payload.get("makeActive") != Boolean.FALSE;
        long currentMax = store.maxBoqVersion(sv(contract, "id"));
        int versionNo = payload.get("versionNo") != null && numberValue(payload.get("versionNo")) > 0
                ? (int) numberValue(payload.get("versionNo")) : (int) currentMax + 1;
        String versionId = idGenerator.next("BQVER");
        String versionCode = blankDefault(trim(payload.get("versionCode")), "V" + versionNo);
        String versionName = blankDefault(trim(payload.get("versionName")), "BOQ V" + versionNo);
        if (makeActive) store.deactivateBoqVersions(sv(contract, "id"), java.time.Instant.now());
        store.insertBoqVersion(versionId, projectId, sv(contract, "id"), versionNo, versionCode, versionName,
                blankDefault(trim(payload.get("revisionType")), "revision"), nvl(payload.get("sourceFileName")),
                makeActive, nvl(payload.get("effectiveAt")), principal.userId(), java.time.Instant.now());
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("message", "Đã tạo BOQ V" + versionNo + " cho " + sv(contract, "contractNo") + ".");
        result.put("boqVersionId", versionId);
        return result;
    }

    // ============ save_boq_item ============
    public Map<String, Object> saveBoqItem(Principal principal, Map<String, Object> payload) {
        String projectId = trim(payload.get("projectId"));
        // JS 2712.
        accessScope.requireProjectAccess(principal.userId(), principal.role(), projectId, true,
                "Không có quyền cập nhật BOQ dự án này.");

        Map<String, Object> contract = resolveContract(projectId, trim(payload.get("contractId")));
        String contractId = sv(contract, "id");
        Optional<Map<String, Object>> version = resolveBoqVersion(projectId, contractId, trim(payload.get("boqVersionId")));
        String boqVersionId = version.map(v -> sv(v, "id"))
                .orElseThrow(() -> Api("Hợp đồng chưa có phiên bản BOQ. Hãy tạo/import BOQ trước."));

        String sourceItemId = trim(payload.get("sourceItemId"));
        if (sourceItemId.isEmpty() && !trim(payload.get("boqItemId")).isEmpty()) {
            Map<String, Object> pbi = store.findProjectBoqItem(trim(payload.get("boqItemId")), projectId).orElse(null);
            if (pbi != null) sourceItemId = sv(pbi, "source_item_id");
        }
        Map<String, Object> before = null;
        if (!sourceItemId.isEmpty()) {
            before = store.findBoqSourceItem(sourceItemId, projectId, contractId, boqVersionId).orElse(null);
            if (before == null) throw Api("Dòng BOQ không thuộc Hợp đồng/Phiên bản đang chọn.");
        }
        String rowRole = trim(payload.get("rowRole"));
        if (!ROW_ROLES.contains(rowRole)) rowRole = inferRowRole(payload);
        boolean operative = "material".equals(rowRole) || "component".equals(rowRole);
        String itemType = "outside_contract".equals(trim(payload.get("itemType"))) ? "outside_contract" : "contract";
        String contractMaterialName = String.valueOf(payload.get("materialName") == null
                ? payload.get("contractMaterialName") == null ? "" : payload.get("contractMaterialName")
                : payload.get("materialName")).trim();
        if (contractMaterialName.isEmpty()) throw Api("Tên vật tư/tiêu đề BOQ không được để trống.");
        double contractQty = "outside_contract".equals(itemType) ? 0
                : strictNonNegative(payload.get("contractQty"), "Khối lượng BOQ/HĐ");
        double remeasuredQty = strictNonNegative(payload.get("remeasuredQty") != null ? payload.get("remeasuredQty")
                : payload.get("contractQty"), "Khối lượng bóc lại");
        double unitPrice = strictNonNegative(payload.get("unitPrice") != null ? payload.get("unitPrice") : 0, "Đơn giá hợp đồng");
        double sourceOrder = payload.get("sourceOrder") != null ? numberValue(payload.get("sourceOrder"))
                : numberValue(payload.get("lineNo"));
        if (sourceOrder == 0) {
            sourceOrder = store.boqSourceItemsForContract(projectId, contractId, boqVersionId).stream()
                    .mapToDouble(r -> numberValue(ci(r, "source_order"))).max().orElse(0) + 1;
        }
        // explicit material
        Map<String, Object> explicitMaterial = null;
        String explicitMaterialId = trim(payload.get("materialId"));
        String internalCode = trim(payload.get("internalMaterialCode")).toUpperCase();
        if (!explicitMaterialId.isEmpty() || !internalCode.isEmpty()) {
            explicitMaterial = !explicitMaterialId.isEmpty()
                    ? store.findMaterial(explicitMaterialId).orElse(null)
                    : store.findMaterialByCode(internalCode).orElse(null);
            if (explicitMaterial == null) throw Api("Mã vật tư gốc được chọn không tồn tại hoặc đang bị ẩn.");
        }
        String existingPbiId = before != null ? sv(before, "project_boq_item_id") : trim(payload.get("boqItemId"));
        String existingMappedId = before != null ? sv(before, "mapped_material_id") : "";
        String variationStatusRaw = trim(payload.get("variationStatus"));
        String variationStatus = List.of("none", "pending", "approved", "rejected").contains(variationStatusRaw)
                ? variationStatusRaw : "none";
        if (("outside_contract".equals(itemType) || Math.abs(remeasuredQty - contractQty) > 1e-9) && "none".equals(variationStatus))
            variationStatus = "pending";
        String batchId = null;
        if (before != null) batchId = sv(before, "batch_id");
        if (batchId == null || batchId.isEmpty()) {
            Map<String, Object> activeBatch = store.findActiveImportBatch(projectId, contractId, boqVersionId).orElse(null);
            batchId = activeBatch != null ? sv(activeBatch, "id")
                    : store.createImportBatch(idGenerator.next("BQB"), projectId, contractId, boqVersionId,
                            version.map(v -> sv(v, "versionCode")).orElse("V1"), principal.userId(), java.time.Instant.now());
        }
        String targetSourceId = sourceItemId.isEmpty() ? idGenerator.next("BQS") : sourceItemId;
        Map<String, Object> mapped = null;
        if (operative) {
            mapped = explicitMaterial != null ? explicitMaterial
                    : !existingMappedId.isEmpty() ? store.findMaterial(existingMappedId).orElse(null) : null;
        }
        String mappingStatus = mapped != null
                ? (existingMappedId.equals(sv(mapped, "id")) ? (before != null ? sv(before, "mapping_status") : "confirmed")
                    : "mapped_manual")
                : "unmapped";
        java.time.Instant now = java.time.Instant.now();
        boolean isNew = before == null;
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("id", targetSourceId);
        item.put("batchId", batchId);
        item.put("projectId", projectId);
        item.put("contractId", contractId);
        item.put("boqVersionId", boqVersionId);
        item.put("sourceOrder", sourceOrder);
        item.put("sourceRow", payload.get("sourceRow") != null ? numberValue(payload.get("sourceRow")) : null);
        item.put("contractLineRef", nvlLazy(payload.get("contractLineRef"), payload.get("lineNo")));
        item.put("rowRole", rowRole);
        item.put("boqCode", nvl(payload.get("boqCode")));
        item.put("contractCode", nvl(payload.get("contractCode")));
        item.put("contractMaterialCode", nvl(payload.get("contractMaterialCode")));
        item.put("approvedMaterialCode", nvl(payload.get("approvedMaterialCode")));
        item.put("contractMaterialName", contractMaterialName);
        item.put("unit", nvl(payload.get("unit")));
        item.put("contractQty", contractQty);
        item.put("remeasuredQty", remeasuredQty);
        item.put("unitPrice", unitPrice);
        item.put("itemType", itemType);
        item.put("note", nvl(payload.get("note")));
        item.put("sourceSystemCode", nvl(payload.get("systemCode")));
        item.put("subgroupName", nvl(payload.get("subgroupName")));
        item.put("mappedMaterialId", mapped != null ? sv(mapped, "id") : null);
        item.put("standardMaterialName", mapped != null ? sv(mapped, "name") : null);
        item.put("mappingStatus", mappingStatus);
        item.put("projectBoqItemId", existingPbiId.isEmpty() ? null : existingPbiId);
        item.put("mappedBy", mapped != null ? principal.userId() : null);
        item.put("mappedAt", mapped != null ? now : null);
        store.upsertSourceItem(item, isNew, now);

        String pbiId = existingPbiId;
        if (operative && mapped != null) {
            if (pbiId == null || pbiId.isEmpty()) pbiId = idGenerator.next("BOQ");
            Map<String, Object> pbi = new LinkedHashMap<>(item);
            pbi.put("id", pbiId);
            pbi.put("sourceItemId", targetSourceId);
            pbi.put("description", contractMaterialName);
            pbi.put("materialId", sv(mapped, "id"));
            pbi.put("variationStatus", variationStatus);
            pbi.put("variationRef", nvl(payload.get("variationRef")));
            pbi.put("variationApprovedAt", nvl(payload.get("variationApprovedAt")));
            store.upsertProjectBoqItem(pbi, existingPbiId.isEmpty(), now);
            // đồng bộ lại project_boq_item_id trên source item
            item.put("projectBoqItemId", pbiId);
            store.upsertSourceItem(item, false, now);
        } else if (!existingPbiId.isEmpty()) {
            store.deactivateProjectBoqItem(existingPbiId, now);
        }
        store.updateImportBatchRowCount(batchId, now);
        store.insertBoqChangeHistory(changeHistory(projectId, contractId, boqVersionId, targetSourceId,
                pbiId == null || pbiId.isEmpty() ? null : pbiId, isNew ? "CREATE" : "UPDATE", before, item,
                blankDefault(trim(payload.get("reason")), "Điều chỉnh BOQ được người dùng xác nhận"),
                principal.userId(), now), now);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("message", "Đã " + (isNew ? "thêm" : "cập nhật") + " dòng BOQ " + (long) sourceOrder
                + "; lịch sử thay đổi đã được lưu.");
        result.put("sourceItemId", targetSourceId);
        result.put("boqItemId", pbiId == null || pbiId.isEmpty() ? null : pbiId);
        return result;
    }

    // ============ set_boq_item_status ============
    public Map<String, Object> setBoqItemStatus(Principal principal, Map<String, Object> payload) {
        String sourceItemId = trim(payload.get("sourceItemId"));
        Map<String, Object> row = findSourceItemAnywhere(sourceItemId)
                .orElseThrow(() -> Api("Không tìm thấy dòng BOQ."));
        // JS 2734.
        accessScope.requireProjectAccess(principal.userId(), principal.role(), sv(row, "project_id"), true,
                "Không có quyền tại dự án này.");
        boolean active = payload.get("active") == Boolean.TRUE || "1".equals(trim(payload.get("active")));
        store.setSourceItemActive(sourceItemId, active, sv(row, "project_boq_item_id"), java.time.Instant.now());
        store.insertBoqChangeHistory(changeHistory(sv(row, "project_id"), sv(row, "contract_id"),
                sv(row, "boq_version_id"), sourceItemId, nvlLazy(row.get("project_boq_item_id"), null),
                active ? "RESTORE" : "ARCHIVE", row, Map.of("active", active ? 1 : 0),
                nvl(payload.get("reason")), principal.userId(), java.time.Instant.now()), java.time.Instant.now());
        return Map.of("message", active ? "Đã khôi phục dòng BOQ."
                : "Đã xóa/ẩn dòng BOQ khỏi phiên bản hiện hành; dữ liệu và lịch sử vẫn được giữ để khôi phục.");
    }

    // ---- helpers ----
    /** replace_boq_items — import BOQ: new_version/append/merge/replace_version. */
    public Map<String, Object> replaceBoqItems(Principal principal, Map<String, Object> payload) {
        String projectId = trim(payload.get("projectId"));
        List<?> rawRows = payload.get("rows") instanceof List<?> l ? l : List.of();
        if (rawRows.isEmpty()) throw Api("File BOQ không có dòng dữ liệu.");
        if (rawRows.size() > 5000) throw Api("Mỗi lần nhập tối đa 5.000 dòng BOQ.");
        // JS 2799.
        accessScope.requireProjectAccess(principal.userId(), principal.role(), projectId, true,
                "Không có quyền cập nhật BOQ dự án này.");
        String importMode = List.of("new_version", "append", "merge", "replace_version")
                .contains(trim(payload.get("importMode"))) ? trim(payload.get("importMode")) : "new_version";
        String requestedContractId = trim(payload.get("contractId"));
        Map<String, Object> contract = resolveContract(projectId, requestedContractId);
        String contractId = sv(contract, "id");
        List<Map<String, Object>> catalog = store.materialCatalogSimple();
        Map<String, Map<String, Object>> byCode = new LinkedHashMap<>();
        for (Map<String, Object> m : catalog) byCode.put(sv(m, "code").toUpperCase(), m);
        java.time.Instant now = java.time.Instant.now();
        String boqVersionId = "", versionCode = "V1";
        long versionNo = 1;
        List<Map<String, Object>> existing = new ArrayList<>();
        int startOrder = 0;
        if ("new_version".equals(importMode)) {
            long max = store.maxBoqVersion(contractId);
            versionNo = (int) max + 1;
            versionCode = blankDefault(trim(payload.get("versionCode")), "V" + versionNo);
            String versionName = blankDefault(trim(payload.get("versionName")), "BOQ " + versionCode);
            String revisionType = List.of("original", "revision", "addendum").contains(trim(payload.get("revisionType")))
                    ? trim(payload.get("revisionType")) : (versionNo == 1 ? "original" : "revision");
            boqVersionId = idGenerator.next("BQVER");
            store.deactivateBoqVersions(contractId, now);
            store.insertBoqVersion(boqVersionId, projectId, contractId, (int) versionNo, versionCode, versionName,
                    revisionType, nvl(payload.get("sourceFileName")), true, nvl(payload.get("effectiveAt")),
                    principal.userId(), now);
            Map<String, Object> batch = store.findActiveImportBatch(projectId, contractId, boqVersionId).orElse(null);
            String batchId = batch != null ? sv(batch, "id")
                    : store.createImportBatch(idGenerator.next("BQB"), projectId, contractId, boqVersionId,
                            versionCode, principal.userId(), now);
            return replaceInsertLoop(principal, payload, projectId, contractId, boqVersionId, versionCode,
                    versionNo, importMode, existing, startOrder, byCode, batchId, now, contract);
        }
        Optional<Map<String, Object>> v = resolveBoqVersion(projectId, contractId, trim(payload.get("boqVersionId")));
        if (v.isEmpty()) throw Api("Hợp đồng chưa có phiên bản BOQ. Hãy tạo/import BOQ trước.");
        Map<String, Object> version = v.get();
        boqVersionId = sv(version, "id");
        versionNo = (long) Math.round(num(version.get("versionNo")));
        versionCode = sv(version, "versionCode").isEmpty() ? "V" + versionNo : sv(version, "versionCode");
        if ("archived".equals(sv(version, "status")))
            throw Api("Phiên bản BOQ đang được lưu trữ. Hãy khôi phục trước khi cập nhật.");
        Map<String, Object> batch = store.findActiveImportBatch(projectId, contractId, boqVersionId).orElse(null);
        String batchId = batch != null ? sv(batch, "id")
                : store.createImportBatch(idGenerator.next("BQB"), projectId, contractId, boqVersionId,
                        versionCode, principal.userId(), now);
        existing = store.existingSourceRows(projectId, contractId, boqVersionId);
        int max = 0;
        for (Map<String, Object> r : existing) max = Math.max(max, (int) Math.round(num(r.get("source_order"))));
        startOrder = "append".equals(importMode) ? max : 0;
        if ("replace_version".equals(importMode)) {
            long dep = store.boqVersionDependencyTotal(projectId, contractId, boqVersionId);
            if (dep > 0) throw Api("Phiên bản " + versionCode + " đã phát sinh " + dep
                    + " liên kết ĐNMH/PO/Nhập kho. Không được thay thế trực tiếp; hãy nhập thành phiên bản BOQ mới.");
            if (!("THAY " + versionCode).equals(trim(payload.get("confirmText"))))
                throw Api("Xác nhận thay thế chưa đúng. Hãy nhập “THAY " + versionCode + "”.");
            store.deactivateVersionItems(projectId, contractId, boqVersionId, now);
            existing = new ArrayList<>();
            startOrder = 0;
        }
        return replaceInsertLoop(principal, payload, projectId, contractId, boqVersionId, versionCode,
                versionNo, importMode, existing, startOrder, byCode, batchId, now, contract);
    }

    private Map<String, Object> replaceInsertLoop(Principal principal, Map<String, Object> payload,
                                                  String projectId, String contractId, String boqVersionId,
                                                  String versionCode, long versionNo, String importMode,
                                                  List<Map<String, Object>> existing, int startOrder,
                                                  Map<String, Map<String, Object>> byCode, String batchId,
                                                  java.time.Instant now, Map<String, Object> contract) {
        Map<String, Map<String, Object>> byLineRef = new LinkedHashMap<>();
        Map<String, Map<String, Object>> byBoqCode = new LinkedHashMap<>();
        Map<Long, Map<String, Object>> byOrder = new LinkedHashMap<>();
        for (Map<String, Object> r : existing) {
            if (!sv(r, "contract_line_ref").isEmpty())
                byLineRef.put(sv(r, "contract_line_ref").toLowerCase(), r);
            if (!sv(r, "boq_code").isEmpty()) byBoqCode.put(sv(r, "boq_code").toLowerCase(), r);
            byOrder.put((long) Math.round(num(r.get("source_order"))), r);
        }
        List<?> rawRows = payload.get("rows") instanceof List<?> l ? l : List.of();
        int inserted = 0, updated = 0, explicitMapped = 0;
        for (int index = 0; index < rawRows.size(); index++) {
            Map<String, Object> row = asMap(rawRows.get(index));
            int rowNo = index + 1;
            long fileOrder = (long) Math.round(numberValue(row.get("sourceOrder")));
            if (fileOrder == 0) fileOrder = index + 1;
            Map<String, Object> target = null;
            if ("merge".equals(importMode)) {
                String ref = trim(row.get("contractLineRef"));
                if (ref.isEmpty()) ref = trim(row.get("lineNo"));
                String bc = trim(row.get("boqCode"));
                ref = ref.toLowerCase();
                bc = bc.toLowerCase();
                if (!ref.isEmpty() && byLineRef.containsKey(ref)) target = byLineRef.get(ref);
                else if (!bc.isEmpty() && byBoqCode.containsKey(bc)) target = byBoqCode.get(bc);
                else if (byOrder.containsKey(fileOrder)) target = byOrder.get(fileOrder);
            }
            long sourceOrder = target != null ? (long) Math.round(num(target.get("source_order"))) : fileOrder == 0 ? startOrder + index + 1 : (long) Math.round(num(target != null ? target.get("source_order") : null)) != 0 ? fileOrder : startOrder + index + 1;
            if (target == null) sourceOrder = startOrder + index + 1;
            String rowRole = inferRowRole(row);
            String itemType = "outside_contract".equals(trim(row.get("itemType"))) ? "outside_contract" : "contract";
            String contractMaterialName = String.valueOf(row.get("contractMaterialName") == null
                    ? row.get("materialName") == null ? "" : row.get("materialName") : row.get("contractMaterialName")).trim();
            if (contractMaterialName.isEmpty()) throw Api("Dòng " + rowNo + ": Tên vật tư/tiêu đề BOQ không được để trống.");
            String unit = String.valueOf(row.get("unit") == null ? "" : row.get("unit"));
            String internalCode = trim(row.get("internalMaterialCode")).toUpperCase();
            double contractQty = numberValue(row.get("contractQty"));
            Object rawRemeasured = row.get("remeasuredQty");
            double remeasuredQty = rawRemeasured == null || String.valueOf(rawRemeasured).isBlank()
                    ? contractQty : numberValue(rawRemeasured);
            double unitPrice = strictNonNegative(row.get("unitPrice") != null ? row.get("unitPrice") : 0, "Dòng " + rowNo + ": Đơn giá hợp đồng");
            if (contractQty < 0 || remeasuredQty < 0) throw Api("Dòng " + rowNo + ": khối lượng không được âm.");
            String explicitMaterialId = trim(row.get("materialId"));
            Map<String, Object> mapped = null;
            if ((!internalCode.isEmpty() || !explicitMaterialId.isEmpty()) && List.of("material", "component").contains(rowRole)) {
                if (!explicitMaterialId.isEmpty())
                    for (Map<String, Object> m : store.materialCatalogSimple())
                        if (sv(m, "id").equals(explicitMaterialId)) { mapped = m; break; }
                if (mapped == null && !internalCode.isEmpty()) mapped = byCode.get(internalCode);
                if (mapped == null) throw Api("Dòng " + rowNo + ": Mã vật tư gốc nhập rõ không tồn tại/không hoạt động.");
                explicitMapped++;
            }
            if (target != null) {
                wrapUpdate(projectId, contractId, boqVersionId, row, rowRole, itemType, contractMaterialName, unit,
                        contractQty, remeasuredQty, unitPrice, mapped, target, internalCode, principal.userId(), now, rowNo);
                updated++;
                continue;
            }
            String sourceId = idGenerator.next("BQS");
            String sys = canonicalMeCode(mapped != null && !sv(mapped, "system").isEmpty()
                    ? sv(mapped, "system") : sv(row, "systemCode"));
            String pbiId = null;
            String mappingStatus = "unmapped";
            if (mapped != null && List.of("material", "component").contains(rowRole)) {
                mappingStatus = "mapped_explicit";
                pbiId = idGenerator.next("BOQ");
                Map<String, Object> pbi = new LinkedHashMap<>();
                pbi.put("id", pbiId);
                pbi.put("projectId", projectId);
                pbi.put("contractId", contractId);
                pbi.put("boqVersionId", boqVersionId);
                pbi.put("sourceOrder", sourceOrder);
                pbi.put("contractLineRef", nvlLazy(row.get("contractLineRef"), row.get("lineNo")));
                pbi.put("rowRole", rowRole);
                pbi.put("sourceRow", numberValue(row.get("sourceRow")) == 0 ? null : numberValue(row.get("sourceRow")));
                pbi.put("boqCode", nvl(row.get("boqCode")));
                pbi.put("contractCode", nvl(row.get("contractCode")));
                pbi.put("contractMaterialCode", nvl(row.get("contractMaterialCode")));
                pbi.put("approvedMaterialCode", nvl(row.get("approvedMaterialCode")));
                pbi.put("itemType", itemType);
                pbi.put("materialId", sv(mapped, "id"));
                pbi.put("description", contractMaterialName);
                pbi.put("contractQty", contractQty);
                pbi.put("remeasuredQty", remeasuredQty);
                pbi.put("unitPrice", unitPrice);
                pbi.put("variationStatus", "outside_contract".equals(itemType)
                        || Math.abs(remeasuredQty - contractQty) > 1e-9 ? "pending" : "none");
                pbi.put("variationRef", null);
                pbi.put("variationApprovedAt", null);
                pbi.put("note", nvl(row.get("note")));
                store.insertProjectBoqItemFull(pbi, null, now);
            }
            Map<String, Object> source = new LinkedHashMap<>();
            source.put("id", sourceId);
            source.put("batchId", batchId);
            source.put("projectId", projectId);
            source.put("contractId", contractId);
            source.put("boqVersionId", boqVersionId);
            source.put("sourceOrder", sourceOrder);
            source.put("sourceRow", numberValue(row.get("sourceRow")) == 0 ? null : numberValue(row.get("sourceRow")));
            source.put("contractLineRef", nvlLazy(row.get("contractLineRef"), row.get("lineNo")));
            source.put("rowRole", rowRole);
            source.put("boqCode", nvl(row.get("boqCode")));
            source.put("contractCode", nvl(row.get("contractCode")));
            source.put("contractMaterialCode", nvl(row.get("contractMaterialCode")));
            source.put("approvedMaterialCode", nvl(row.get("approvedMaterialCode")));
            source.put("contractMaterialName", contractMaterialName);
            source.put("unit", unit.isEmpty() ? null : unit);
            source.put("contractQty", contractQty);
            source.put("remeasuredQty", remeasuredQty);
            source.put("unitPrice", unitPrice);
            source.put("itemType", itemType);
            source.put("note", nvl(row.get("note")));
            source.put("sourceSystemCode", sys.isEmpty() ? "KHAC" : sys);
            source.put("subgroupName", nvl(row.get("subgroupName")));
            source.put("rawJson", "{}");
            source.put("mappedMaterialId", mapped != null ? sv(mapped, "id") : null);
            source.put("standardMaterialName", mapped != null ? sv(mapped, "name") : null);
            source.put("mappingStatus", mappingStatus);
            source.put("projectBoqItemId", pbiId);
            source.put("mappedBy", mapped != null ? principal.userId() : null);
            source.put("mappedAt", mapped != null ? now : null);
            store.insertSourceItemFull(source, now);
            if (pbiId != null) store.updatePbiLinkSource(pbiId, sourceId, now);
            inserted++;
        }
        long activeCount = 0;
        for (Map<String, Object> r : store.existingSourceRows(projectId, contractId, boqVersionId))
            if (isOne(ci(r, "active"))) activeCount++;
        store.updateBatchFile(batchId, nvl(payload.get("sourceFileName")), activeCount, 1, now);
        store.updateVersionFile(boqVersionId, nvl(payload.get("sourceFileName")), now);
        return Map.of("message", "Đã nhập BOQ " + sv(contract, "contractNo") + " · " + versionCode + ": "
                + inserted + " dòng mới, " + updated + " dòng cập nhật; " + explicitMapped + " dòng có Mã vật tư gốc.",
                "contractId", contractId, "boqVersionId", boqVersionId, "batchId", batchId,
                "versionNo", versionNo, "inserted", inserted, "updated", updated);
    }

    private String findVersionActiveRemoved() {
        return "0";
    }

    private void wrapUpdate(String projectId, String contractId, String boqVersionId, Map<String, Object> row,
                            String rowRole, String itemType, String contractMaterialName, String unit,
                            double contractQty, double remeasuredQty, double unitPrice,
                            Map<String, Object> mapped, Map<String, Object> target, String internalCode,
                            String userId, java.time.Instant now, int rowNo) {
        String oldPbiId = sv(target, "project_boq_item_id");
        String oldMapped = sv(target, "mapped_material_id");
        if (mapped != null && !oldPbiId.isEmpty() && !oldMapped.isEmpty() && !sv(mapped, "id").equals(oldMapped)) {
            long dep = store.boqItemDependencyTotal(oldPbiId);
            if (dep > 0) throw Api("Dòng " + rowNo + ": mapping cũ đã phát sinh " + dep
                    + " liên kết nghiệp vụ. Không thể đổi Mã vật tư gốc bằng Merge; hãy tạo BOQ Version mới.");
        }
        Map<String, Object> finalMapped = mapped;
        if (finalMapped == null && !oldMapped.isEmpty())
            for (Map<String, Object> m : store.materialCatalogSimple())
                if (sv(m, "id").equals(oldMapped)) { finalMapped = m; break; }
        String mappingStatus = finalMapped != null ? (mapped != null ? "mapped_explicit"
                : sv(target, "mapping_status").isEmpty() ? "confirmed" : sv(target, "mapping_status")) : "unmapped";
        String sys = canonicalMeCode((trim(row.get("systemCode")).isEmpty()
                || "KHAC".equals(canonicalMeCode(trim(row.get("systemCode")))))
                && finalMapped != null && !sv(finalMapped, "system").isEmpty()
                ? sv(finalMapped, "system") : sv(row, "systemCode"));
        Map<String, Object> src = new LinkedHashMap<>(target);
        src.put("sourceRow", numberValue(row.get("sourceRow")) == 0 ? target.get("source_row") : numberValue(row.get("sourceRow")));
        src.put("contractLineRef", nvlLazy(row.get("contractLineRef"), row.get("lineNo")));
        src.put("rowRole", rowRole);
        src.put("boqCode", nvl(row.get("boqCode")));
        src.put("contractCode", nvl(row.get("contractCode")));
        src.put("contractMaterialCode", nvl(row.get("contractMaterialCode")));
        src.put("approvedMaterialCode", nvl(row.get("approvedMaterialCode")));
        src.put("contractMaterialName", contractMaterialName);
        src.put("unit", unit.isEmpty() ? null : unit);
        src.put("contractQty", contractQty);
        src.put("remeasuredQty", remeasuredQty);
        src.put("unitPrice", unitPrice);
        src.put("itemType", itemType);
        src.put("note", nvl(row.get("note")));
        src.put("sourceSystemCode", sys.isEmpty() ? "KHAC" : sys);
        src.put("subgroupName", nvl(row.get("subgroupName")));
        src.put("mappedMaterialId", finalMapped != null ? sv(finalMapped, "id") : null);
        src.put("standardMaterialName", finalMapped != null ? sv(finalMapped, "name") : null);
        src.put("mappingStatus", mappingStatus);
        src.put("mappedBy", mapped != null ? userId : target.get("mapped_by"));
        src.put("mappedAt", mapped != null ? now : target.get("mapped_at"));
        store.updateSourceItemFull(src, now);
        String pbiId = oldPbiId;
        if (List.of("material", "component").contains(rowRole) && finalMapped != null) {
            String variationStatus = "outside_contract".equals(itemType)
                    || Math.abs(remeasuredQty - contractQty) > 1e-9 ? "pending" : "none";
            Map<String, Object> pbi = new LinkedHashMap<>();
            pbi.put("id", pbiId);
            pbi.put("projectId", projectId);
            pbi.put("contractId", contractId);
            pbi.put("boqVersionId", boqVersionId);
            pbi.put("sourceOrder", num(target.get("source_order")));
            pbi.put("contractLineRef", nvlLazy(row.get("contractLineRef"), row.get("lineNo")));
            pbi.put("rowRole", rowRole);
            pbi.put("boqCode", nvl(row.get("boqCode")));
            pbi.put("contractCode", nvl(row.get("contractCode")));
            pbi.put("contractMaterialCode", nvl(row.get("contractMaterialCode")));
            pbi.put("approvedMaterialCode", nvl(row.get("approvedMaterialCode")));
            pbi.put("itemType", itemType);
            pbi.put("materialId", sv(finalMapped, "id"));
            pbi.put("description", contractMaterialName);
            pbi.put("contractQty", contractQty);
            pbi.put("remeasuredQty", remeasuredQty);
            pbi.put("unitPrice", unitPrice);
            pbi.put("variationStatus", variationStatus);
            pbi.put("note", nvl(row.get("note")));
            pbi.put("sourceRow", numberValue(row.get("sourceRow")) == 0 ? null : numberValue(row.get("sourceRow")));
            if (!pbiId.isEmpty()) store.upsertProjectBoqItem(pbi, false, now);
            else {
                pbiId = idGenerator.next("BOQ");
                pbi.put("id", pbiId);
                store.insertProjectBoqItemFull(pbi, sv(target, "id"), now);
                Map<String, Object> link = new LinkedHashMap<>(target);
                link.put("projectBoqItemId", pbiId);
                store.upsertSourceItem(link, false, now);
            }
        }
    }

    /** update_boq_contract_prices — cập nhật hàng loạt đơn giá HĐ từ file. */
    public Map<String, Object> updateBoqContractPrices(Principal principal, Map<String, Object> payload) {
        String projectId = trim(payload.get("projectId"));
        // JS 2827.
        accessScope.requireProjectAccess(principal.userId(), principal.role(), projectId, true,
                "Không có quyền cập nhật BOQ dự án này.");

        Map<String, Object> contract = resolveContract(projectId, trim(payload.get("contractId")));
        Optional<Map<String, Object>> v = resolveBoqVersion(projectId, sv(contract, "id"), trim(payload.get("boqVersionId")));
        if (v.isEmpty()) throw Api("Hợp đồng chưa có phiên bản BOQ. Hãy tạo/import BOQ trước.");
        String boqVersionId = sv(v.get(), "id");
        List<?> updates = payload.get("updates") instanceof List<?> l ? l : List.of();
        if (updates.isEmpty()) throw Api("File không có đơn giá hợp đồng để cập nhật.");
        if (updates.size() > 5000) throw Api("Mỗi lần cập nhật tối đa 5.000 dòng.");
        List<String> ids = new ArrayList<>();
        for (Object o : updates) {
            Map<String, Object> row = asMap(o);
            String id = trim(row.get("boqItemId"));
            if (id.isEmpty()) throw Api("File cập nhật giá có dòng thiếu Mã dòng BOQ.");
            ids.add(id);
        }
        if (new java.util.HashSet<>(ids).size() != ids.size())
            throw Api("File cập nhật giá có Mã dòng BOQ bị trùng.");
        Map<String, Double> beforeMap = new LinkedHashMap<>();
        for (Map<String, Object> row : store.pbiPricesForUpdate(projectId, sv(contract, "id"), boqVersionId))
            beforeMap.put(sv(row, "id"), num(row.get("unitPrice")));
        java.time.Instant now = java.time.Instant.now();
        String batchId = idGenerator.next("BPIB");
        int changed = 0;
        for (int index = 0; index < updates.size(); index++) {
            Map<String, Object> row = asMap(updates.get(index));
            String boqItemId = trim(row.get("boqItemId"));
            double unitPrice = strictNonNegative(row.get("unitPrice") != null ? row.get("unitPrice") : 0, "Dòng " + (index + 1) + ": Đơn giá hợp đồng");
            if (!beforeMap.containsKey(boqItemId))
                throw Api("Dòng " + (index + 1) + ": Mã dòng BOQ không thuộc Contract/BOQ Version hiện tại.");
            double oldPrice = beforeMap.getOrDefault(boqItemId, 0.0);
            boolean isChanged = Math.abs(oldPrice - unitPrice) > 1e-9;
            if (isChanged) changed++;
            store.insertPriceItem(idGenerator.next("BPII"), batchId, boqItemId, oldPrice, unitPrice, now);
            if (isChanged) store.updatePbiPrice(boqItemId, unitPrice, true, now);
        }
        store.upsertPriceBatch(batchId, projectId, nvl(payload.get("sourceFileName")), updates.size(), changed,
                principal.userId(), now);
        return Map.of("message", "Đã cập nhật " + changed + " đơn giá hợp đồng; " + (updates.size() - changed)
                + " dòng giữ nguyên.");
    }

    private static List<String> listOf(Object o) {
        List<String> out = new ArrayList<>();
        if (o instanceof List<?> l) for (Object x : l) { String s = trim(x); if (!s.isEmpty()) out.add(s); }
        return out;
    }

    /** bulk_boq_item_action — archive/restore hàng loạt (≤5000). */
    public Map<String, Object> bulkBoqItemAction(Principal principal, Map<String, Object> payload) {
        List<String> ids = new ArrayList<>(new LinkedHashSet<>(listOf(payload.get("sourceItemIds"))));
        if (ids.isEmpty()) throw Api("Chưa chọn dòng BOQ.");
        if (ids.size() > 5000) throw Api("Mỗi lần xử lý tối đa 5.000 dòng.");
        String mode = "restore".equals(trim(payload.get("mode"))) ? "restore" : "archive";
        boolean active = "restore".equals(mode);
        int changed = 0;
        java.time.Instant now = java.time.Instant.now();
        for (String id : ids) {
            Map<String, Object> row = store.findBoqSourceItemById(id).orElse(null);
            if (row == null) continue;
            // JS 2737: kiểm phạm vi TỪNG dòng; có một dòng ngoài phạm vi là chặn CẢ LÔ.
            if (!accessScope.canAccessProject(principal.userId(), principal.role(), sv(row, "project_id"), true)) {
                throw Api("Danh sách có dòng BOQ ngoài phạm vi được cấp quyền.");
            }
            store.setSourceItemActive(id, active, sv(row, "project_boq_item_id"), now);
            store.insertBoqChangeHistory(changeHistory(sv(row, "project_id"), sv(row, "contract_id"),
                    sv(row, "boq_version_id"), id, nvlLazy(row.get("project_boq_item_id"), null),
                    active ? "RESTORE" : "ARCHIVE", row, Map.of("active", active ? 1 : 0),
                    blankDefault(trim(payload.get("reason")), "Thao tác hàng loạt"), principal.userId(), now), now);
            changed++;
        }
        return Map.of("message", active ? "Đã khôi phục " + changed + " dòng BOQ."
                : "Đã xóa/ẩn " + changed + " dòng BOQ; có thể khôi phục khi cần.");
    }

    /** delete_boq_item — xóa mềm an toàn (giữ lịch sử). */
    public Map<String, Object> deleteBoqItem(Principal principal, Map<String, Object> payload) {
        String sourceItemId = trim(payload.get("sourceItemId"));
        Map<String, Object> row = store.findBoqSourceItemById(sourceItemId)
                .orElseThrow(() -> Api("Không tìm thấy dòng BOQ."));
        // JS 2740.
        accessScope.requireProjectAccess(principal.userId(), principal.role(), sv(row, "project_id"), true,
                "Không có quyền tại dự án này.");
        String pbiId = sv(row, "project_boq_item_id");
        long dep = pbiId.isEmpty() ? 0 : store.boqItemDependencyTotal(pbiId);
        java.time.Instant now = java.time.Instant.now();
        store.setSourceItemActive(sourceItemId, false, pbiId, now);
        store.insertBoqChangeHistory(changeHistory(sv(row, "project_id"), sv(row, "contract_id"),
                sv(row, "boq_version_id"), sourceItemId, pbiId.isEmpty() ? null : pbiId,
                dep > 0 ? "ARCHIVE" : "DELETE_SAFE", row, Map.of("active", 0),
                dep > 0 ? "Có " + dep + " liên kết downstream nên xóa mềm"
                        : blankDefault(trim(payload.get("reason")), "Xóa dòng nhập sai"),
                principal.userId(), now), now);
        return Map.of("message", dep > 0
                ? "Dòng BOQ đã có " + dep + " liên kết nghiệp vụ nên không xóa cứng. Hệ thống đã xóa/ẩn an toàn và giữ lịch sử để truy vết."
                : "Đã xóa dòng BOQ khỏi sử dụng. Dữ liệu được giữ ở trạng thái đã xóa để có thể khôi phục và chống mất lịch sử.");
    }

    /** clear_boq_version — archive/restore/purge toàn phiên bản. */
    public Map<String, Object> clearBoqVersion(Principal principal, Map<String, Object> payload) {
        String projectId = trim(payload.get("projectId"));
        // JS 2744.
        accessScope.requireProjectAccess(principal.userId(), principal.role(), projectId, true,
                "Không có quyền tại dự án này.");

        Map<String, Object> contract = resolveContract(projectId, trim(payload.get("contractId")));
        Map<String, Object> version = resolveBoqVersion(projectId, sv(contract, "id"), trim(payload.get("boqVersionId")))
                .orElseThrow(() -> Api("Hợp đồng chưa có phiên bản BOQ. Hãy tạo/import BOQ trước."));
        String boqVersionId = sv(version, "id");
        String mode = List.of("archive", "restore", "purge").contains(trim(payload.get("mode")))
                ? trim(payload.get("mode")) : "archive";
        java.time.Instant now = java.time.Instant.now();
        if ("purge".equals(mode)) {
            long dep = store.boqVersionDependencyTotal(projectId, sv(contract, "id"), boqVersionId);
            if (dep > 0) throw Api("BOQ Version đã phát sinh " + dep
                    + " liên kết ĐNMH/PO/Nhập kho. Không được xóa vĩnh viễn; hãy Lưu trữ hoặc tạo phiên bản điều chỉnh.");
            String expected = "XOA " + sv(version, "versionCode");
            if (!expected.equals(trim(payload.get("confirmText"))))
                throw Api("Xác nhận chưa đúng. Hãy nhập \u201c" + expected + "\u201d.");
            List<Map<String, Object>> sources = store.sourceRowsForMatching(boqVersionId);
            store.purgeBoqVersion(projectId, sv(contract, "id"), boqVersionId, trim(payload.get("confirmText")),
                    sv(version, "versionCode"), principal.userId(), now);
            return Map.of("message", "Đã xóa vĩnh viễn " + sources.size() + " dòng của "
                    + sv(version, "versionCode") + "; chỉ cho phép vì phiên bản chưa phát sinh nghiệp vụ.");
        }
        boolean active = "restore".equals(mode);
        store.setVersionActive(projectId, sv(contract, "id"), boqVersionId, active,
                active ? "draft" : "archived", now);
        store.insertBoqChangeHistory(changeHistory(projectId, sv(contract, "id"), boqVersionId, null, null,
                active ? "RESTORE_VERSION" : "ARCHIVE_VERSION", version, Map.of("status", active ? "draft" : "archived"),
                nvl(payload.get("reason")), principal.userId(), now), now);
        return Map.of("message", active
                ? "Đã khôi phục dữ liệu " + sv(version, "versionCode") + " ở trạng thái nháp; không tự thay phiên bản hiện hành."
                : "Đã xóa/ẩn toàn bộ dòng của " + sv(version, "versionCode") + "; lịch sử vẫn được giữ và có thể khôi phục.");
    }

    /** request_material_master_from_boq — đánh dấu dòng BOQ cần mã vật tư mới. */
    public Map<String, Object> requestMaterialMasterFromBoq(Principal principal, Map<String, Object> payload) {
        String projectId = trim(payload.get("projectId"));
        String sourceItemId = trim(payload.get("sourceItemId"));
        Map<String, Object> source = store.findBoqSourceItemById(sourceItemId).orElse(null);
        if (source == null || !sv(source, "project_id").equals(projectId) || !isOne(ci(source, "active")))
            throw Api("Không tìm thấy dòng BOQ nguồn.");
        // JS 2795.
        accessScope.requireProjectAccess(principal.userId(), principal.role(), projectId, true,
                "Không có quyền dự án.");
        java.time.Instant now = java.time.Instant.now();
        store.confirmSourceMapping(sourceItemId, null, null, null, "new_material_requested",
                sv(source, "project_boq_item_id"), principal.userId(), now);
        return Map.of("message", "Đã ghi nhận đề nghị tạo mã vật tư gốc mới. Hệ thống chưa tự tạo Material Master.");
    }

    private static List<String> listOfDup(Object o) {
        List<String> out = new ArrayList<>();
        if (o instanceof List<?> l) for (Object x : l) { String s = trim(x); if (!s.isEmpty()) out.add(s); }
        return out;
    }

    /** compare_boq_materials — chạy Material Matching V2 trên batch BOQ, ghi mapping run + candidates. */
    public Map<String, Object> compareBoqMaterials(Principal principal, Map<String, Object> payload) {
        String projectId = trim(payload.get("projectId"));
        // JS 2770: mức ĐỌC (write=false) — so sánh không làm thay đổi dữ liệu.
        accessScope.requireProjectAccess(principal.userId(), principal.role(), projectId, false,
                "Không có quyền xem/so sánh BOQ dự án này.");
        String requestedBatchId = trim(payload.get("batchId"));
        String requestedContractId = trim(payload.get("contractId"));
        String requestedBoqVersionId = trim(payload.get("boqVersionId"));
        Map<String, Object> batch = null;
        if (!requestedBatchId.isEmpty()) {
            batch = store.findBatch(requestedBatchId, projectId)
                    .orElseThrow(() -> Api("Contract/BOQ Version chưa có BOQ nguồn để so sánh. Hãy nhập BOQ trước."));
        } else {
            Map<String, Object> contract = resolveContract(projectId, requestedContractId);
            Optional<Map<String, Object>> v = requestedBoqVersionId.isEmpty()
                    ? store.activeBoqVersion(projectId, sv(contract, "id"))
                    : store.findBoqVersion(projectId, sv(contract, "id"), requestedBoqVersionId);
            if (v.isEmpty()) throw Api("Contract/BOQ Version chưa có BOQ nguồn để so sánh. Hãy nhập BOQ trước.");
            batch = store.findActiveImportBatch(projectId, sv(contract, "id"), sv(v.get(), "id")).orElse(null);
            if (batch == null) throw Api("Contract/BOQ Version chưa có BOQ nguồn để so sánh. Hãy nhập BOQ trước.");
        }
        String scope = "all".equals(trim(payload.get("scope"))) ? "all" : "unmapped";
        List<Map<String, Object>> sourceRows = store.sourceRowsForMatching(sv(batch, "id"));
        if ("unmapped".equals(scope)) sourceRows.removeIf(r -> !sv(r, "mappedMaterialId").isEmpty());
        if (sourceRows.size() > 5000) throw Api("Mỗi lần so sánh tối đa 5.000 dòng BOQ.");
        List<Map<String, Object>> materials = store.activeMaterialsForMatching();
        List<Map<String, Object>> aliasRows = store.verifiedMaterialAliases();
        List<Map<String, Object>> historyRows = store.materialMappingHistory();

        java.time.Instant now = java.time.Instant.now();
        String runId = idGenerator.next("MAPRUN");
        String provider = "local_feature_v1";
        int providerFallback = 0;
        store.insertMappingRun(runId, sv(batch, "id"), projectId, sv(batch, "contractId"),
                sv(batch, "boqVersionId"), scope, provider,
                "{\"exact\":1,\"veryHigh\":0.95,\"high\":0.9,\"review\":0.8}",
                "{\"history\":0.1,\"technical\":0.3,\"system\":0.1,\"uom\":0.15,\"fuzzy\":0.2,\"embedding\":0.15}",
                principal.userId(), now);

        List<Map<String, Object>> results = new ArrayList<>();
        int topK = 5;
        for (Map<String, Object> source : sourceRows) {
            if (!sv(source, "mappedMaterialId").isEmpty()) {
                results.add(enriched(source, "already_mapped", List.of()));
                continue;
            }
            String sourceText = joinClean(source.get("contractMaterialName"), source.get("note"));
            double[] srcEmbed = com.vntech.erp.domain.service.MaterialMatcherV2
                    .localFeatureEmbedding(sourceText, com.vntech.erp.domain.service.MaterialMatcherV2.DIM);
            List<Map<String, Object>> candidates = new ArrayList<>();
            int candidateCount = 0;
            for (Map<String, Object> material : materials) {
                String aliasText = aliasText(aliasRows, sv(material, "id"));
                String candidateText = joinClean(material.get("name"), material.get("specification"),
                        material.get("brand"), aliasText);
                var gate = com.vntech.erp.domain.service.MaterialMatcherV2.materialCandidateGate(
                        source, material, sourceText, candidateText);
                if (!gate.accepted()) continue;
                double[] candEmbed = com.vntech.erp.domain.service.MaterialMatcherV2
                        .localFeatureEmbedding(candidateText, com.vntech.erp.domain.service.MaterialMatcherV2.DIM);
                String sourceNorm = com.vntech.erp.domain.service.MaterialMatcherV2.normalizeMaterialText(sourceText);
                double history = 0;
                for (Map<String, Object> h : historyRows)
                    if (sv(h, "sourceNormalized").equals(sourceNorm) && sv(h, "materialId").equals(sv(material, "id")))
                        history = Double.parseDouble(sv(h, "confirmCount"));
                var score = com.vntech.erp.domain.service.MaterialMatcherV2.scoreMaterialCandidate(
                        source, material, sourceText, candidateText, history, srcEmbed, candEmbed,
                        "local_feature_v1", false);
                candidateCount++;
                if (candidateCount <= topK) {
                    store.insertMappingCandidate(idGenerator.next("MAPC"), runId, sv(source, "id"),
                            score.materialId(), rankOf(candidates.size()), score.historyScore(),
                            score.technicalScore(), score.systemScore(), score.uomScore(), score.fuzzyScore(),
                            score.embeddingScore(), score.finalScore(), score.hardConflict(),
                            score.conflictReason(), score.provider(), score.status(), now);
                }
                candidates.add(scoreMap(score));
            }
            candidates.sort((a, b) -> Double.compare(num(ci(b, "finalScore")), num(ci(a, "finalScore"))));
            List<Map<String, Object>> top = candidates.size() > topK ? candidates.subList(0, topK) : candidates;
            results.add(enriched(source, top.isEmpty() ? "not_found" : sv(top.get(0), "status"), top));
        }
        store.updateMappingRunProvider(runId, provider, providerFallback);
        Map<String, Object> run = new LinkedHashMap<>();
        run.put("id", runId);
        run.put("batchId", batch.get("id"));
        run.put("contractId", batch.get("contractId"));
        run.put("boqVersionId", batch.get("boqVersionId"));
        run.put("versionNo", batch.get("versionNo"));
        run.put("sourceFileName", batch.get("sourceFileName"));
        run.put("scope", scope);
        run.put("provider", provider);
        run.put("providerFallback", providerFallback);
        run.put("topK", 5);
        run.put("thresholds", Map.of("exact", 1, "veryHigh", 0.95, "high", 0.9, "review", 0.8));
        run.put("weights", Map.of("history", 0.1, "technical", 0.3, "system", 0.1, "uom", 0.15, "fuzzy", 0.2, "embedding", 0.15));
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("message", "Đã so sánh " + sourceRows.size() + " dòng BOQ.");
        result.put("run", run);
        result.put("items", results);
        return result;
    }

    /** confirm_boq_material_mappings — commit mapping (kèm remap guard, audit, history, alias, component). */
    public Map<String, Object> confirmBoqMaterialMappings(Principal principal, Map<String, Object> payload) {
        String projectId = trim(payload.get("projectId"));
        List<?> rows = payload.get("mappings") instanceof List<?> l ? l : List.of();
        if (rows.isEmpty()) throw Api("Chưa chọn dòng mapping để cập nhật.");
        if (rows.size() > 5000) throw Api("Mỗi lần xác nhận tối đa 5.000 dòng.");
        // JS 2783.
        accessScope.requireProjectAccess(principal.userId(), principal.role(), projectId, true,
                "Không có quyền cập nhật mapping BOQ dự án này.");
        String runId = nvl(payload.get("runId"));
        java.time.Instant now = java.time.Instant.now();
        int confirmed = 0, remapped = 0;
        for (int index = 0; index < rows.size(); index++) {
            final int rowNo = index + 1;
            Map<String, Object> input = asMap(rows.get(index));
            String sourceId = trim(input.get("sourceItemId"));
            String newMaterialId = trim(input.get("materialId"));
            String thisRun = nvl(input.get("runId"));
            if (thisRun == null) thisRun = runId;
            Map<String, Object> source = store.findBoqSourceItemById(sourceId).orElse(null);
            if (source == null || !sv(source, "project_id").equals(projectId) || !isOne(ci(source, "active")))
                throw Api("Dòng " + rowNo + ": không tìm thấy dòng BOQ nguồn.");
            if (!trim(payload.get("contractId")).isEmpty()
                    && !sv(source, "contract_id").equals(trim(payload.get("contractId"))))
                throw Api("Dòng " + rowNo + ": nguồn BOQ không thuộc Contract đang chọn.");
            if (!trim(payload.get("boqVersionId")).isEmpty()
                    && !sv(source, "boq_version_id").equals(trim(payload.get("boqVersionId"))))
                throw Api("Dòng " + rowNo + ": nguồn BOQ không thuộc BOQ Version đang chọn.");
            Map<String, Object> material = store.findMaterial(newMaterialId)
                    .orElseThrow(() -> Api("Dòng " + rowNo + ": mã vật tư gốc không tồn tại/đã khóa."));
            String oldMaterialId = sv(source, "mapped_material_id");
            boolean isRemap = !oldMaterialId.isEmpty() && !oldMaterialId.equals(newMaterialId);
            if (isRemap && !Boolean.TRUE.equals(input.get("remap")))
                throw Api("Dòng " + rowNo + ": BOQ đã có mã gốc; phải dùng thao tác ĐỔI MAPPING.");
            if (isRemap && trim(input.get("reason")).isEmpty())
                throw Api("Dòng " + rowNo + ": Đổi mapping bắt buộc nhập lý do.");
            Map<String, Object> candidate = null;
            if (thisRun != null && !thisRun.isEmpty())
                candidate = store.findMappingCandidate(thisRun, sourceId, newMaterialId).orElse(null);
            if (candidate != null && isOne(ci(candidate, "hardConflict")))
                throw Api("Dòng " + rowNo + ": ứng viên có xung đột kỹ thuật; không cho batch commit.");
            if (candidate != null && num(ci(candidate, "finalScore")) < 0.80 && !Boolean.TRUE.equals(input.get("manualConfirm")))
                throw Api("Dòng " + rowNo + ": ứng viên dưới 80% không được batch xác nhận. Hãy kiểm tra thủ công.");
            // operational item
            String operationalId = sv(source, "project_boq_item_id");
            if (operationalId.isEmpty()) {
                operationalId = idGenerator.next("BOQ");
                Map<String, Object> pbi = new LinkedHashMap<>();
                pbi.put("id", operationalId);
                pbi.put("projectId", projectId);
                pbi.put("contractId", sv(source, "contract_id"));
                pbi.put("boqVersionId", sv(source, "boq_version_id"));
                pbi.put("sourceItemId", sourceId);
                pbi.put("sourceOrder", num(source.get("source_order")) == 0 ? index + 1 : num(source.get("source_order")));
                pbi.put("contractLineRef", nvlLazy(source.get("contract_line_ref"), null));
                pbi.put("rowRole", sv(source, "row_role").isEmpty() ? "material" : sv(source, "row_role"));
                pbi.put("sourceRow", num(source.get("source_row")) == 0 ? null : num(source.get("source_row")));
                pbi.put("boqCode", nvl(source.get("boq_code")));
                pbi.put("contractCode", nvl(source.get("contract_code")));
                pbi.put("contractMaterialCode", nvl(source.get("contract_material_code")));
                pbi.put("approvedMaterialCode", nvl(source.get("approved_material_code")));
                pbi.put("itemType", "outside_contract".equals(sv(source, "item_type")) ? "outside_contract" : "contract");
                pbi.put("materialId", sv(material, "id"));
                pbi.put("description", String.valueOf(source.get("contract_material_name")));
                pbi.put("contractQty", num(source.get("contract_qty")));
                pbi.put("remeasuredQty", num(source.get("remeasured_qty")));
                pbi.put("unitPrice", num(source.get("unit_price")));
                String it = sv(source, "item_type");
                double cq = num(source.get("contract_qty")), rq = num(source.get("remeasured_qty"));
                pbi.put("variationStatus", "outside_contract".equals(it) || Math.abs(rq - cq) > 1e-9 ? "pending" : "none");
                pbi.put("variationRef", null);
                pbi.put("variationApprovedAt", null);
                pbi.put("note", nvl(source.get("note")));
                store.upsertProjectBoqItem(pbi, true, now);
            } else {
                Map<String, Object> update = new LinkedHashMap<>();
                update.put("id", operationalId);
                update.put("projectId", projectId);
                update.put("contractId", sv(source, "contract_id"));
                update.put("boqVersionId", sv(source, "boq_version_id"));
                update.put("contractLineRef", nvlLazy(source.get("contract_line_ref"), null));
                update.put("rowRole", sv(source, "row_role"));
                update.put("boqCode", nvl(source.get("boq_code")));
                update.put("contractCode", nvl(source.get("contract_code")));
                update.put("contractMaterialCode", nvl(source.get("contract_material_code")));
                update.put("approvedMaterialCode", nvl(source.get("approved_material_code")));
                update.put("itemType", "outside_contract".equals(sv(source, "item_type")) ? "outside_contract" : "contract");
                update.put("materialId", sv(material, "id"));
                update.put("description", String.valueOf(source.get("contract_material_name") == null ? "" : source.get("contract_material_name")));
                update.put("contractQty", num(source.get("contract_qty")));
                update.put("remeasuredQty", num(source.get("remeasured_qty")));
                update.put("unitPrice", num(source.get("unit_price")));
                String it = sv(source, "item_type");
                double cq = num(source.get("contract_qty")), rq = num(source.get("remeasured_qty"));
                update.put("variationStatus", "outside_contract".equals(it) || Math.abs(rq - cq) > 1e-9 ? "pending" : "none");
                update.put("variationRef", null);
                update.put("variationApprovedAt", null);
                update.put("note", nvl(source.get("note")));
                update.put("sourceOrder", num(source.get("source_order")));
                update.put("approvedMaterialCode", nvl(source.get("approved_material_code")));
                store.upsertProjectBoqItem(update, false, now);
            }
            store.confirmSourceMapping(sourceId, sv(material, "id"), sv(material, "name"),
                    canonicalMeCode(sv(material, "system")), "confirmed", operationalId, principal.userId(), now);
            String scoreDetailJson = null;
            if (candidate != null) {
                scoreDetailJson = "{\"history\":" + num(ci(candidate, "historyScore")) + ",\"technical\":"
                        + num(ci(candidate, "technicalScore")) + ",\"system\":" + num(ci(candidate, "systemScore"))
                        + ",\"uom\":" + num(ci(candidate, "uomScore")) + ",\"fuzzy\":" + num(ci(candidate, "fuzzyScore"))
                        + ",\"embedding\":" + num(ci(candidate, "embeddingScore")) + ",\"final\":"
                        + num(ci(candidate, "finalScore")) + ",\"conflict\":" + isOne(ci(candidate, "hardConflict")) + "}";
            }
            store.insertMappingAudit(idGenerator.next("MAPA"), sourceId, thisRun, oldMaterialId.isEmpty() ? null : oldMaterialId,
                    sv(material, "id"), isRemap ? "REMAP" : "CONFIRM",
                    candidate != null ? num(ci(candidate, "finalScore")) : null, scoreDetailJson,
                    candidate != null ? sv(candidate, "provider") : "manual",
                    nvl(input.get("reason")), Boolean.TRUE.equals(input.get("saveAlias")), principal.userId(), now);
            String sourceText = String.valueOf(source.get("contract_material_name") == null ? "" : source.get("contract_material_name"));
            String sourceNormalized = com.vntech.erp.domain.service.MaterialMatcherV2.normalizeMaterialText(sourceText);
            if (!sourceNormalized.isEmpty()) {
                store.upsertMappingHistoryConfirmed(sv(material, "id"), sourceNormalized, sourceText,
                        nvl(source.get("source_system_code")), nvl(source.get("unit")), principal.userId(), now);
                if (Boolean.TRUE.equals(input.get("saveAlias"))) {
                    Map<String, Object> existingAlias = store.findAliasByNormalized(sourceNormalized).orElse(null);
                    if (existingAlias != null && !sv(existingAlias, "materialId").equals(sv(material, "id")))
                        throw Api("Dòng " + rowNo + ": alias đã thuộc mã vật tư khác; không tự ghi đè.");
                    if (existingAlias == null)
                        store.insertMaterialAlias(idGenerator.next("MAL"), sv(material, "id"), sourceText,
                                sourceNormalized, principal.userId(), now);
                }
            }
            store.deactivateMainComponent(sourceId, now);
            Map<String, Object> main = store.findMainComponent(sourceId, sv(material, "id")).orElse(null);
            if (main != null) store.updateMainComponent(sv(main, "id"), principal.userId(),
                    candidate != null ? "matching_v2" : "manual", now);
            else store.insertMainComponent(idGenerator.next("BOQC"), sourceId, sv(material, "id"),
                    String.valueOf(source.get("unit") == null ? sv(material, "unit") : source.get("unit")),
                    candidate != null ? "matching_v2" : "manual", principal.userId(), now);
            confirmed++;
            if (isRemap) remapped++;
        }
        return Map.of("message", "Đã cập nhật " + confirmed + " dòng BOQ; " + remapped
                + " dòng remap. Tên vật tư theo HĐ được giữ nguyên.");
    }

    private String aliasText(List<Map<String, Object>> aliases, String materialId) {
        List<String> out = new ArrayList<>();
        for (Map<String, Object> a : aliases)
            if (sv(a, "materialId").equals(materialId)) out.add(sv(a, "aliasName"));
        return String.join(" | ", out);
    }

    /**
     * ĐÃ GOM VỀ MỘT NGUỒN SỰ THẬT (TASK-040 nhóm 3b): bản cũ chỉ so <b>ĐÚNG BẰNG</b> trong khi JS khớp
     * <b>TIỀN TỐ</b> ⇒ đo được <b>7/28 đầu vào lệch</b> ({@code Điện lực}, {@code DIEN123}, {@code ELV-1},
     * {@code PCCC-01}… bị xếp vào {@code KHAC} thay vì đúng hệ M&amp;E). Nay dùng helper chung ở tầng domain
     * ({@code tools/probe-canonical-me-code-drift.mjs} + {@code MaterialSystemCodesTest} giữ hành vi này).
     */
    private static String canonicalMeCode(String value) {
        return com.vntech.erp.domain.service.MaterialSystemCodes.canonicalMeCode(value);
    }

    private static Map<String, Object> scoreMap(com.vntech.erp.domain.service.MaterialMatcherV2.CandidateScore s) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("materialId", s.materialId());
        m.put("materialCode", s.materialCode());
        m.put("standardMaterialName", s.standardMaterialName());
        m.put("unit", s.unit());
        m.put("system", s.system());
        m.put("specification", s.specification());
        m.put("brand", s.brand());
        m.put("historyScore", s.historyScore());
        m.put("technicalScore", s.technicalScore());
        m.put("systemScore", s.systemScore());
        m.put("uomScore", s.uomScore());
        m.put("fuzzyScore", s.fuzzyScore());
        m.put("embeddingScore", s.embeddingScore());
        m.put("finalScore", s.finalScore());
        m.put("exactMatch", s.exactMatch());
        m.put("hardConflict", s.hardConflict());
        m.put("conflictReason", s.conflictReason());
        m.put("provider", s.provider());
        m.put("providerFallback", s.providerFallback());
        m.put("status", s.status());
        return m;
    }

    private static int rankOf(int size) { return size + 1; }

    private static double num(Object o) {
        try { return o == null ? 0 : Double.parseDouble(String.valueOf(o)); }
        catch (NumberFormatException e) { return 0; }
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> asMap(Object o) { return o instanceof Map ? (Map<String, Object>) o : Map.of(); }

    private static String joinClean(Object... parts) {
        StringBuilder sb = new StringBuilder();
        for (Object p : parts) {
            String s = String.valueOf(p == null ? "" : p);
            if (!s.isBlank()) { if (sb.length() > 0) sb.append(" | "); sb.append(s); }
        }
        return sb.toString();
    }

    private static Map<String, Object> enriched(Map<String, Object> source, String status, List<Map<String, Object>> candidates) {
        Map<String, Object> out = new LinkedHashMap<>(source);
        out.put("status", status);
        out.put("candidates", candidates);
        return out;
    }
    private Optional<Map<String, Object>> findSourceItemAnywhere(String sourceItemId) {
        return store.findBoqSourceItemById(sourceItemId);
    }

    private Map<String, Object> resolveContract(String projectId, String requestedContractId) {
        Optional<Map<String, Object>> contract = requestedContractId.isEmpty()
                ? store.defaultContract(projectId)
                : store.findContract(projectId, requestedContractId);
        return contract.orElseThrow(() -> Api("Hợp đồng không tồn tại/đã ngừng áp dụng trong dự án này."));
    }

    private Optional<Map<String, Object>> resolveBoqVersion(String projectId, String contractId, String requestedVersionId) {
        if (!requestedVersionId.isEmpty()) return store.findBoqVersion(projectId, contractId, requestedVersionId);
        return store.activeBoqVersion(projectId, contractId);
    }

    private String inferRowRole(Map<String, Object> payload) {
        String materialName = String.valueOf(payload.get("materialName") == null ? "" : payload.get("materialName")).trim();
        String unit = trim(payload.get("unit"));
        double qty = numberValue(payload.get("contractQty"));
        if (materialName.isEmpty()) return "note";
        if (unit.isEmpty() && qty == 0) return "group";
        return "material";
    }

    private Map<String, Object> changeHistory(String projectId, String contractId, String boqVersionId,
                                              String sourceItemId, String pbiId, String actionType,
                                              Map<String, Object> before, Map<String, Object> after,
                                              String reason, String actorUserId, java.time.Instant now) {
        Map<String, Object> h = new LinkedHashMap<>();
        h.put("id", idGenerator.next("BQH"));
        h.put("projectId", projectId);
        h.put("contractId", contractId);
        h.put("boqVersionId", boqVersionId);
        h.put("sourceItemId", sourceItemId);
        h.put("projectBoqItemId", pbiId);
        h.put("actionType", actionType);
        h.put("reason", reason);
        h.put("actorUserId", actorUserId);
        h.put("beforeJson", before == null ? null : jsonOf(before));
        h.put("afterJson", after == null ? null : jsonOf(after));
        return h;
    }

    private static String jsonOf(Map<String, Object> m) {
    StringBuilder sb = new StringBuilder("{");
    boolean first = true;
    for (Map.Entry<String, Object> e : m.entrySet()) {
        if (!first) sb.append(",");
        first = false;
        sb.append('"').append(e.getKey().replace("\"", "\\\"")).append("\":");
        Object v = e.getValue();
        if (v == null) sb.append("null");
        else if (v instanceof Number || v instanceof Boolean) sb.append(v);
        else sb.append('"').append(String.valueOf(v).replace("\"", "\\\"")).append('"');
    }
    return sb.append('}').toString();
}

    private static Object ci(Map<String, Object> m, String key) {
        if (m == null) return null;
        Object v = m.get(key);
        if (v != null) return v;
        for (Map.Entry<String, Object> e : m.entrySet())
            if (e.getKey().equalsIgnoreCase(key)) return e.getValue();
        return null;
    }

    private static boolean isOne(Object o) {
        return o instanceof Number n ? n.intValue() == 1 : Boolean.TRUE.equals(o);
    }
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
    private static String sv(Map<String, Object> m, String k) {
        Object v = ci(m, k);
        return v == null ? "" : String.valueOf(v);
    }
    private static String trim(Object o) { return o == null ? "" : String.valueOf(o).trim(); }
    private static String nvl(Object o) { String s = trim(o); return s.isEmpty() ? null : s; }
    private static String nvlLazy(Object a, Object b) {
        String s = trim(a);
        if (s.isEmpty() && b != null) s = trim(b);
        return s.isEmpty() ? null : s;
    }
    private static String blankDefault(String s, String fallback) { return s.isEmpty() ? fallback : s; }
    private static AuthUseCase.ApiError Api(String message) { return new AuthUseCase.ApiError(message, 400); }
}