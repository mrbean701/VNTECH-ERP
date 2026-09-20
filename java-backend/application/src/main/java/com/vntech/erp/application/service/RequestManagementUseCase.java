package com.vntech.erp.application.service;

import com.vntech.erp.application.port.out.AuditLogPort;
import com.vntech.erp.application.port.out.IdGenerator;
import com.vntech.erp.application.port.out.RequestStore;
import com.vntech.erp.application.rbac.AccessScopeService;
import com.vntech.erp.application.rbac.RbacService;
import com.vntech.erp.application.support.MiniJson;

import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Use-case Phiếu đề nghị mua hàng — port nguyên trạng create_request của monolith JS:
 * header required theo form config, resolve contract/BOQ context, material matching (id/code/name+unit/alias),
 * đối chiếu dòng BOQ (nghiêm ngặt chống cộng lũy kế trùng), tạo MR + items + allocations + approvals 5 bậc
 * (auto-approve bước 1 nếu cấu hình, workflow assignment per stage, SLA due_at).
 */
public final class RequestManagementUseCase {

    private static final DateTimeFormatter ISO = DateTimeFormatter.ISO_LOCAL_DATE;

    private final RequestStore store;
    private final IdGenerator idGenerator;
    private final RbacService rbac;
    private final AccessScopeService accessScope;
    // TASK-048 — nhật ký kiểm toán: Java TRƯỚC ĐÂY không ghi dòng `audit_logs` nào cho luồng Phiếu
    // đề nghị (`SELECT COUNT(*) WHERE entity_type='material_request'` = 0) trong khi JS ghi 6 chỗ.
    private final AuditLogPort auditLog;

    public RequestManagementUseCase(RequestStore store, IdGenerator idGenerator, RbacService rbac,
                                    AccessScopeService accessScope, AuditLogPort auditLog) {
        this.store = store;
        this.idGenerator = idGenerator;
        this.rbac = rbac;
        this.accessScope = accessScope;
        this.auditLog = auditLog;
    }

    public interface Principal {
        String userId();
        String role();
        String fullName();
        String email();
        /**
         * Mã ENGINE (`role_catalog.base_role`) — giá trị THẬT SỰ dùng để phân quyền, đúng như
         * `effectiveRole(user)` của JS. Mặc định rơi về `role()` để tương thích ngược với mọi
         * tầng gọi chưa truyền giá trị này xuống.
         */
        default String roleBase() { return role(); }
    }

    public Map<String, Object> createRequest(Principal principal, Map<String, Object> payload) {
        // [PHASE 2 — CHỈ ĐẠO NGƯỜI DÙNG (3) 21/09/2026] «đây là luồng duyệt của đơn đề nghị mua hàng nên TẤT CẢ
        // các user đều có quyền tạo» ⇒ BỎ chốt cứng `List.of("engineer","commander","admin")` (chốt này chặn
        // mọi vai trò khác: kh_nv, kh_truong, da_nv, da_truong, thuky, thu_kho, director…).
        // Quyền TẠO vẫn đi qua CỔNG RBAC do quản trị viên cấu hình (`requireModule`/`user_module_permissions`
        // — module `requests`, năng lực `canCreate`) + phạm vi dự án ở ngay dưới ⇒ KHÔNG mở toang.
        String projectId = trim(payload.get("projectId"));
        // JS 907.
        accessScope.requireProjectAccess(principal.userId(), principal.role(), projectId, true,
                "Tài khoản không được lập đơn cho dự án này.");
        String neededAt = trim(payload.get("neededAt"));
        String area = trim(payload.get("area"));
        List<?> rawLines = payload.get("lines") instanceof List<?> l ? l : List.of();
        if (projectId.isEmpty() || rawLines.isEmpty())
            throw Api("Phiếu đề nghị phải có dự án và ít nhất một dòng vật tư.");
        if (rawLines.size() > 100) throw Api("Mỗi phiếu đề nghị được nhập tối đa 100 dòng vật tư.");

        // Header required theo form_field_config request_header
        checkRequiredHeader(payload, neededAt);
        Map<String, Object> project = store.findActiveProject(projectId)
                .orElseThrow(() -> Api("Dự án không tồn tại hoặc đã ngừng hoạt động."));

        // Resolve contract + BOQ version
        Map<String, Object> contract = resolveContract(projectId, trim(payload.get("contractId")));
        String contractId = sv(contract, "id");
        Optional<Map<String, Object>> version = resolveBoqVersion(projectId, contractId, trim(payload.get("boqVersionId")));
        String boqVersionId = version.map(v -> sv(v, "id")).orElse(null);

        List<Map<String, Object>> boqRows = store.projectBoqRows(projectId, contractId, boqVersionId);

        // Sequence DNMH
        int year = neededAt.matches("\\d{4}-.*") ? Integer.parseInt(neededAt.substring(0, 4)) : LocalDate.now().getYear();
        long seq = store.nextSequence("DNMH:" + projectId + ":" + year, "DNMH", projectId, year, Instant.now());
        String requestNo = "DNMH-" + sv(project, "code").toUpperCase() + "-" + year + "-"
                + String.format("%04d", seq);

        // Material catalog index
        List<Map<String, Object>> catalog = store.activeMaterials();
        List<Map<String, Object>> aliasRows = store.materialAliases();
        Map<String, Map<String, Object>> byId = new LinkedHashMap<>();
        Map<String, Map<String, Object>> byCode = new LinkedHashMap<>();
        Map<String, Map<String, Object>> byNameUnit = new LinkedHashMap<>();
        for (Map<String, Object> m : catalog) {
            byId.put(sv(m, "id"), m);
            byCode.put(sv(m, "code").trim().toUpperCase(), m);
            byNameUnit.put(normalizeMaterialName(sv(m, "name")) + "|" + normalizeMaterialName(sv(m, "unit")), m);
        }
        for (Map<String, Object> alias : aliasRows) {
            Map<String, Object> material = byId.get(sv(alias, "materialId"));
            if (material != null)
                byNameUnit.putIfAbsent(normalizeMaterialName(sv(alias, "aliasName")) + "|"
                        + normalizeMaterialName(sv(material, "unit")), material);
        }

        // Required line fields theo config
        java.util.Set<String> required = new java.util.HashSet<>();
        for (Map<String, Object> cfg : store.formFieldRows("request_line")) {
            if (isOne(gi(cfg, "required")) && isOne(gi(cfg, "active"))) required.add(sv(cfg, "fieldKey"));
        }

        double total = 0;
        List<Map<String, Object>> lines = new ArrayList<>();
        List<String> errors = new ArrayList<>();
        for (int index = 0; index < rawLines.size(); index++) {
            Map<String, Object> line = asMap(rawLines.get(index));
            int excelLine = index + 1;
            try {
                double quantity = numberValue(line.get("quantity"));
                String materialIdInput = trim(line.get("materialId"));
                String materialCodeInput = trim(line.get("materialCode")).toUpperCase();
                String materialNameInput = trim(line.get("materialName"));
                String unitInput = trim(line.get("unit"));
                if (required.contains("quantity") && quantity <= 0)
                    throw new IllegalStateException("Khối lượng đề nghị mua đợt này phải lớn hơn 0.");
                if (required.contains("materialCode") && materialIdInput.isEmpty() && materialCodeInput.isEmpty())
                    throw new IllegalStateException("Mã sản phẩm đang được cấu hình bắt buộc.");
                if (required.contains("materialName") && materialIdInput.isEmpty() && materialNameInput.isEmpty())
                    throw new IllegalStateException("Tên hàng đang được cấu hình bắt buộc.");
                if (required.contains("unit") && materialIdInput.isEmpty() && unitInput.isEmpty())
                    throw new IllegalStateException("Đơn vị đang được cấu hình bắt buộc.");
                if (required.contains("installationArea") && trim(line.get("installationArea")).isEmpty())
                    throw new IllegalStateException("Khu vực thi công đang được cấu hình bắt buộc.");
                if (required.contains("origin") && trim(line.get("origin")).isEmpty())
                    throw new IllegalStateException("Xuất xứ đang được cấu hình bắt buộc.");

                Map<String, Object> material = byId.get(materialIdInput);
                if (material == null && !materialCodeInput.isEmpty()) material = byCode.get(materialCodeInput);
                if (material == null && !materialNameInput.isEmpty()) {
                    material = byNameUnit.get(normalizeMaterialName(materialNameInput) + "|" + normalizeMaterialName(unitInput));
                }
                if (material == null)
                    throw new IllegalStateException("vật tư chưa được mapping với Mã vật tư nội bộ. BOQ/Phiếu đề nghị không được tự tạo mã mới. Hãy tạo/mapping tại Danh mục mã vật tư trước khi nhập.");

                String boqItemId = trim(line.get("boqItemId"));
                if (!boqItemId.isEmpty()) {
                    final String bid = boqItemId;
                    final Map<String, Object> materialNow = material;
                    Map<String, Object> exact = boqRows.stream()
                            .filter(r -> sv(r, "id").equals(bid)).findFirst().orElse(null);
                    if (exact == null) throw new IllegalStateException("Mã dòng BOQ không thuộc Contract/BOQ Version đang chọn.");
                    if (!sv(exact, "materialId").equals(sv(materialNow, "id")))
                        throw new IllegalStateException("Mã dòng BOQ không khớp vật tư đã chọn.");
                } else {
                    String contractLine = trim(line.get("contractLineNo"));
                    String boqCode = trim(line.get("boqCode"));
                    final Map<String, Object> materialNow = material;
                    List<Map<String, Object>> candidates = boqRows.stream()
                            .filter(r -> sv(r, "materialId").equals(sv(materialNow, "id")))
                            .filter(r -> contractLine.isEmpty() || sv(r, "contractLineRef").equals(contractLine)
                                    || sv(r, "lineNo").equals(contractLine))
                            .filter(r -> boqCode.isEmpty() || sv(r, "boqCode").equals(boqCode))
                            .toList();
                    if (candidates.size() == 1) boqItemId = sv(candidates.get(0), "id");
                    else if (candidates.size() > 1)
                        throw new IllegalStateException("vật tư khớp nhiều dòng BOQ. Hãy chọn đúng dòng BOQ trên phiếu để tránh cộng lũy kế trùng.");
                }
                boolean outsideContract = List.of("outside_contract", "variation", "phat_sinh")
                        .contains(trim(line.get("itemType")).toLowerCase())
                        || Boolean.TRUE.equals(line.get("outsideContract"));
                if (boqItemId.isEmpty() && !outsideContract)
                    throw new IllegalStateException("chưa đối chiếu được đúng dòng BOQ/Hợp đồng. Hãy chọn dòng BOQ hoặc đánh dấu hợp lệ là Ngoài HĐ/Phát sinh kèm lý do trước khi gửi duyệt.");
                if (outsideContract && trim(line.get("note")).isEmpty() && trim(line.get("reason")).isEmpty())
                    throw new IllegalStateException("vật tư Ngoài HĐ/Phát sinh bắt buộc nhập lý do/ghi chú.");

                final String finalBoqItemId = boqItemId;
                Map<String, Object> linkedBoq = boqRows.stream()
                        .filter(r -> sv(r, "id").equals(finalBoqItemId)).findFirst().orElse(null);
                double unitPrice = line.get("unitPrice") == null ? 0 : numberValue(line.get("unitPrice"));
                if (unitPrice == 0) unitPrice = numberValue(gi(material, "standardPrice"));
                double lineTotal = quantity * unitPrice;
                total += lineTotal;
                Map<String, Object> nl = new LinkedHashMap<>();
                nl.put("materialId", sv(material, "id"));
                nl.put("materialCode", sv(material, "code"));
                nl.put("materialName", sv(material, "name"));
                nl.put("unit", sv(material, "unit"));
                nl.put("quantity", quantity);
                nl.put("unitPrice", unitPrice);
                nl.put("boqItemId", boqItemId.isEmpty() ? null : boqItemId);
                nl.put("contractId", linkedBoq != null ? sv(linkedBoq, "contractId") : contractId);
                nl.put("boqVersionId", linkedBoq != null ? sv(linkedBoq, "boqVersionId") : boqVersionId);
                nl.put("workPackageCode", nvl(line.get("workPackageCode")));
                nl.put("boqCode", nvl(line.get("boqCode")));
                nl.put("installationArea", nvl(line.get("installationArea")));
                nl.put("contractLineNo", line.get("contractLineNo") == null ? null : numberValue(line.get("contractLineNo")));
                nl.put("origin", nvl(line.get("origin")));
                nl.put("approvedSupplier", nvl(line.get("approvedSupplier")));
                nl.put("note", nvl(line.get("note")));
                nl.put("stockAllocationQty", line.get("stockAllocationQty") == null ? 0 : numberValue(line.get("stockAllocationQty")));
                // TASK-043: JS bind `clean(line.routeTag) || null` cho cột route_tag. Bản cũ truyền
                // item.get("routeTag") nhưng `nl` KHÔNG bao giờ có khoá này ⇒ luôn NULL (trường bị bỏ im lặng).
                nl.put("routeTag", nvl(line.get("routeTag")));
                // TASK-043: trường động — JS system-route.mjs:962 `customFields: customFieldsObject(line.customFields)`.
                nl.put("customFields", customFieldsObject(line.get("customFields")));
                lines.add(nl);
            } catch (IllegalStateException e) {
                errors.add("Dòng " + excelLine + ": " + e.getMessage());
            }
        }
        if (!errors.isEmpty()) throw Api(String.join("\n", errors));

        // Approval stages
        List<Map<String, Object>> stages = store.approvalStages(true);
        if (stages.isEmpty())
            throw Api("Chưa cấu hình bước phê duyệt đang hoạt động. Quản trị viên cần tạo ít nhất 1 bước.");
        Map<Integer, Map<String, Object>> stageOwners = new LinkedHashMap<>();
        // [PHASE 2 · §6 — chỉ đạo người dùng (2)] «mỗi tác nhân = 1 người duyệt, KHÔNG tính người tạo đơn»:
        // bước mà NGƯỜI LẬP PHIẾU có thẩm quyền duyệt (khớp `role` HOẶC `roleBase` — TRÙNG vị từ `canApproveStage`
        // của JS) được BỎ QUA, không đặt Owner ⇒ người tạo KHÔNG tự duyệt đơn của mình.
        for (Map<String, Object> stage : stages) {
            if (isOne(gi(stage, "autoApproveOnSubmit"))) continue;
            if (!creatorMatchedStageRole(stage, principal).isEmpty()) continue;
                Map<String, Object> assignment = store.workflowAssignment(projectId, (int) numberValue(gi(stage, "stageNo")))
                        .orElse(null);
                if (assignment == null || !isOne(gi(assignment, "ownerActive")))
                    throw Api("Dự án chưa được phân công 01 Owner hợp lệ cho Bước " + gi(stage, "stageNo")
                            + " – " + sv(stage, "name") + ". Quản trị viên cần cấu hình “Phân công xử lý theo dự án”.");

                // ══════════════════════════════════════════════════════════════════════════════
                // TASK-049 — port 2 phép kiểm Owner còn THIẾU so với JS `requireWorkflowAssignment`
                // (`scripts/system-route.mjs:442-452`). Bản Java trước đây chỉ kiểm "có phân công +
                // ownerActive" ⇒ phiếu có thể được chuyển tới người **SAI VAI TRÒ của bước** hoặc
                // **không được phân quyền dự án** (JS chặn 400 ở cả hai trường hợp).
                //   :445-447 const allowed = stageRoleCodes(stage);
                //           const ownerBase = SELECT u.role, COALESCE(rc.base_role,u.role) AS baseRole …
                //           if (allowed.length && !allowed.includes(ownerBase.role)
                //                              && !allowed.includes(ownerBase.baseRole))
                //             throw `Owner ${ownerName} không thuộc vai trò được phép của Bước ${stageNo} – ${stage.name}.`
                //   :448-450 const scoped = SELECT 1 FROM user_project_scopes
                //                             WHERE user_id=? AND project_id=? AND permission IN ('read','write','approve','admin')
                //           if (!scoped && clean(ownerBase?.role)!=='admin')
                //             throw `Owner ${ownerName} chưa được phân quyền dự án này.`
                // ══════════════════════════════════════════════════════════════════════════════
                int stageNo = (int) numberValue(gi(stage, "stageNo"));
                String stageName = sv(stage, "name");
                String ownerUserId = sv(assignment, "ownerUserId");
                // JS đọc `assignment.ownerName`; adapter trả alias camelCase, nhưng đọc CẢ HAI dạng khoá
                // để không lặp lại bẫy `SELECT *` đã gặp ở TASK-045.
                String ownerName = sv(assignment, "ownerName");
                if (ownerName.isEmpty()) ownerName = sv(assignment, "owner_name");
                Map<String, Object> ownerBase = store.findUserRoleInfo(ownerUserId).orElse(Map.of());
                String ownerRole = trim(sv(ownerBase, "role"));
                String ownerBaseRole = trim(sv(ownerBase, "baseRole"));
                List<String> allowedRoles = new ArrayList<>();
                for (String code : sv(stage, "allowedRoleCodes").split(",")) {
                    String trimmedCode = code.trim();
                    if (!trimmedCode.isEmpty()) allowedRoles.add(trimmedCode);
                }
                if (!allowedRoles.isEmpty() && !allowedRoles.contains(ownerRole)
                        && !allowedRoles.contains(ownerBaseRole))
                    throw Api("Owner " + ownerName + " không thuộc vai trò được phép của Bước "
                            + stageNo + " – " + stageName + ".");
                if (!"admin".equals(ownerRole) && !store.ownerHasProjectScope(ownerUserId, projectId))
                    throw Api("Owner " + ownerName + " chưa được phân quyền dự án này.");

                stageOwners.put((int) numberValue(gi(stage, "stageNo")), assignment);
        }
        // [PHASE 2 · §6/§23] Bước đang xử lý = bước CHỜ ĐẦU TIÊN chưa bị bỏ qua (tự xác nhận khi gửi HOẶC do
        // người lập phiếu trùng vai trò duyệt). Không còn bước nào ⇒ luồng tự hoàn tất ngay khi gửi.
        // Thay cho hình dạng cũ `autoFirst ? stage[1] : stage[0]` — hình dạng đó chỉ đúng khi luồng có ĐÚNG 1
        // bước tự xác nhận ở đầu và không có luật loại người tạo.
        int currentStage = 0;
        for (Map<String, Object> stage : stages) {
            if (isOne(gi(stage, "autoApproveOnSubmit"))) continue;
            if (!creatorMatchedStageRole(stage, principal).isEmpty()) continue;
            currentStage = (int) numberValue(gi(stage, "stageNo"));
            break;
        }
        boolean allAutoComplete = currentStage == 0;
        if (allAutoComplete) currentStage = (int) numberValue(gi(stages.get(stages.size() - 1), "stageNo"));

        Instant now = Instant.now();
        String requestId = idGenerator.next("MR");

        Map<String, Object> header = new LinkedHashMap<>();
        header.put("id", requestId);
        header.put("requestNo", requestNo);
        header.put("projectId", projectId);
        header.put("contractId", contractId);
        header.put("boqVersionId", boqVersionId);
        header.put("sourceWarehouseId", nvl(payload.get("sourceWarehouseId")));
        header.put("requestedBy", principal.userId());
        header.put("requestedAt", now);
        header.put("neededAt", neededAt.isEmpty() ? now.toString().substring(0, 10) : neededAt);
        header.put("priority", blankDefault(trim(payload.get("priority")), "normal"));
        header.put("area", area);
        header.put("purpose", nvl(payload.get("purpose")));
        header.put("status", allAutoComplete ? "approved" : "pending_approval");
        header.put("approvalStage", currentStage);
        header.put("total", total);

        List<Map<String, Object>> normalizedItems = new ArrayList<>();
        List<Map<String, Object>> customFieldRows = new ArrayList<>();
        for (int i = 0; i < lines.size(); i++) {
            Map<String, Object> line = lines.get(i);
            Map<String, Object> item = new LinkedHashMap<>(line);
            item.put("id", idGenerator.next("MRI"));
            item.put("lineNo", i + 1);
            item.put("contractId", contractId);
            item.put("boqVersionId", boqVersionId);
            item.put("approvedPurchaseQty", allAutoComplete
                    ? Math.max(((Number) line.get("quantity")).doubleValue() - ((Number) line.get("stockAllocationQty")).doubleValue(), 0)
                    : 0);
            item.put("lineStatus", allAutoComplete ? "approved" : "pending");
            normalizedItems.add(item);

            // TASK-043 — port nguyên văn JS system-route.mjs:974:
            //   for (const [fieldKey,value] of Object.entries(customs))
            //     if (clean(fieldKey) && value !== undefined && value !== null && clean(value) !== "")
            //       INSERT custom_field_values (form_key='request_line', entity_id = id DÒNG phiếu, ...)
            // Mỗi dòng một id `CFV_<uuid>` mới, upsert theo (form_key,entity_id,field_key) như JS.
            Object customs = line.get("customFields");
            if (customs instanceof Map<?, ?> map) {
                for (Map.Entry<?, ?> entry : map.entrySet()) {
                    String fieldKey = trim(entry.getKey());
                    Object raw = entry.getValue();
                    if (fieldKey.isEmpty() || raw == null) continue;
                    String valueText = cleanValue(raw);
                    if (valueText.isEmpty()) continue;
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", idGenerator.next("CFV"));
                    row.put("entityId", item.get("id"));
                    row.put("fieldKey", fieldKey);
                    row.put("valueText", valueText);
                    customFieldRows.add(row);
                }
            }
        }

        List<Map<String, Object>> approvalRows = new ArrayList<>();
        for (int i = 0; i < stages.size(); i++) {
            Map<String, Object> stage = stages.get(i);
            // [PHASE 2 · §6] Bước bị bỏ qua = tự xác nhận khi gửi HOẶC người lập phiếu trùng vai trò duyệt.
            // Vết kiểm toán ghi RÕ lý do (`decisionSnapshot.source`) — KHÔNG im lặng bỏ bước.
            boolean autoBySubmit = isOne(gi(stage, "autoApproveOnSubmit"));
            String creatorRole = creatorMatchedStageRole(stage, principal);
            boolean waivedByCreator = !creatorRole.isEmpty();
            boolean isAuto = autoBySubmit || waivedByCreator;
            boolean isQueued = isAuto || (!allAutoComplete && (int) numberValue(gi(stage, "stageNo")) == currentStage);
            String assignedOwner = null;
            if (isAuto) assignedOwner = principal.userId();
            else {
                Map<String, Object> owner = stageOwners.get((int) numberValue(gi(stage, "stageNo")));
                assignedOwner = owner == null ? null : sv(owner, "ownerUserId");
            }
            Map<String, Object> approval = new LinkedHashMap<>();
            approval.put("id", idGenerator.next("APR"));
            approval.put("stage", gi(stage, "stageNo"));
            approval.put("department", sv(stage, "name"));
            approval.put("approverUserId", assignedOwner);
            approval.put("status", isAuto ? "approved" : "pending");
            approval.put("queuedAt", isQueued ? now : null);
            approval.put("dueAt", isQueued ? now.plusSeconds((long) numberValue(gi(stage, "slaHours")) * 3600) : null);
            approval.put("decidedAt", isAuto ? now : null);
            approval.put("comment", !isAuto ? null
                    : autoBySubmit ? "Tự xác nhận khi gửi phiếu: " + sv(stage, "name")
                    : "Người lập phiếu trùng vai trò duyệt của bước " + gi(stage, "stageNo") + " (" + creatorRole
                      + ") — không tự duyệt đơn của mình: " + sv(stage, "name"));
            approval.put("decisionSnapshot", isAuto
                    ? "{\"stage\":" + gi(stage, "stageNo") + ",\"decision\":\"approved\",\"user\":\""
                    + principal.fullName() + "\",\"at\":\"" + now + "\",\"source\":\""
                    + (autoBySubmit ? "request_submission" : "creator_role_waived") + "\"}" : null);
            approval.put("allowedRoleCodes", gi(stage, "allowedRoleCodes"));
            approval.put("approvalMode", "single");
            approvalRows.add(approval);
        }

        store.insertRequest(header, normalizedItems, approvalRows, customFieldRows, now);

        // ══════════════════════════════════════════════════════════════════════════════════
        // TASK-048 — AUDIT #1/6: port NGUYÊN VĂN JS `system-route.mjs:980`
        //   await audit(user.id, "CREATE", "material_request", requestId, null,
        //     { requestNo, projectId, contractId, boqVersionId, lineCount: normalizedLines.length,
        //       newMaterialCount: 0, mappingMode: "strict_internal_material", total, dynamicFields: true },
        //     request);
        // Thứ tự giống JS: ghi DB xong MỚI audit. `before` = null (JS truyền null).
        // ══════════════════════════════════════════════════════════════════════════════════
        Map<String, Object> createAfter = new LinkedHashMap<>();
        createAfter.put("requestNo", requestNo);
        createAfter.put("projectId", projectId);
        createAfter.put("contractId", contractId);
        createAfter.put("boqVersionId", boqVersionId);
        createAfter.put("lineCount", normalizedItems.size());
        createAfter.put("newMaterialCount", 0);
        createAfter.put("mappingMode", "strict_internal_material");
        createAfter.put("total", total);
        createAfter.put("dynamicFields", true);
        auditLog.log(principal.userId(), "CREATE", "material_request", requestId, null,
                MiniJson.stringify(createAfter), null);

        return Map.of("message", allAutoComplete
                ? "Đã lập phiếu " + requestNo + "; luồng phê duyệt tự hoàn tất và chuyển sang Mua hàng & PO."
                : "Đã lập phiếu " + requestNo + " gồm " + normalizedItems.size() + " dòng và chuyển tới bước " + currentStage + ".");
    }

    /**
     * PHASE 2 (§6 · §23 — chỉ đạo người dùng 21/09/2026) — VỊ TỪ «NGƯỜI LẬP PHIẾU CÓ THẨM QUYỀN CỦA BƯỚC NÀY».
     *
     * <p>Trả về mã vai trò khớp (rỗng = không khớp ⇒ bước vẫn phải được duyệt bình thường). Khớp theo
     * `role` HOẶC `roleBase` — ĐÚNG CÙNG vị từ mà `RbacService`/JS `canApproveStage` dùng để cho phép duyệt
     * (`allowed.includes(user.role) || allowed.includes(effectiveRole(user))`). Vì vậy luật «người tạo không tự
     * duyệt» KHÔNG phải một luật thứ hai: ai có thẩm quyền duyệt bước đó thì cũng chính là người bị loại khỏi
     * bước đó khi họ lập phiếu.
     *
     * <p>Đối chiếu bản JS dùng chung: `lib/p2-approval-flow.mjs#matchedStageRole` (cùng quy tắc, cùng thứ tự).
     */
    private String creatorMatchedStageRole(Map<String, Object> stage, Principal principal) {
        String codes = sv(stage, "allowedRoleCodes");
        if (codes.isEmpty()) return "";
        String role = trim(principal.role());
        String base = trim(principal.roleBase());
        for (String raw : codes.split(",")) {
            String code = raw.trim();
            if (code.isEmpty()) continue;
            if (code.equals(role) || code.equals(base)) return code;
        }
        return "";
    }

    /** update_returned_request — CHT chỉnh sửa phiếu bị trả lại. */
    public Map<String, Object> updateReturnedRequest(Principal principal, Map<String, Object> payload) {
        String requestId = trim(payload.get("requestId"));
        Map<String, Object> mr = store.findRequestBasic(requestId)
                .orElseThrow(() -> Api("Không tìm thấy phiếu đề nghị."));
        if (!sv(mr, "requestedBy").equals(principal.userId()) && !"admin".equals(principal.role()))
            throw Api("Chỉ CHT/người lập phiếu hoặc Quản trị viên được sửa phiếu bị trả lại.");
        if (!"returned_to_requester".equals(sv(mr, "status")))
            throw Api("Chỉ phiếu đang chờ CHT xử lý mới được sửa.");
        String neededAt = trim(payload.get("neededAt"));
        List<?> rawLines = payload.get("lines") instanceof List<?> l ? l : List.of();
        java.util.List<Map<String, Object>> lines = new java.util.ArrayList<>();
        for (Object o : rawLines) {
            Map<String, Object> line = asMap(o);
            String itemId = trim(line.get("id"));
            double qty = numberValue(line.get("requestedQty"));
            if (itemId.isEmpty() || qty <= 0) throw Api("Số lượng đề nghị phải lớn hơn 0.");
            Map<String, Object> nl = new LinkedHashMap<>();
            nl.put("id", itemId);
            nl.put("requestedQty", qty);
            lines.add(nl);
        }
        store.updateReturnedRequest(requestId, neededAt.isEmpty() ? null : neededAt,
                blankDefault(trim(payload.get("priority")), "normal"), nvl(payload.get("area")),
                nvl(payload.get("purpose")), lines, principal.userId(),
                "CHT đã chỉnh sửa phiếu sau khi bị trả lại.", Instant.now());

        // ══════════════════════════════════════════════════════════════════════════════════
        // TASK-048 — AUDIT #2/6: JS `:994`
        //   await audit(user.id, "EDIT_RETURNED", "material_request", requestId, mr,
        //     { neededAt, priority: clean(payload.priority), area: clean(payload.area),
        //       purpose: clean(payload.purpose), lineCount: lines.length }, request);
        // ⚠️ BẪY ĐÃ GẶP (bài học #13): `after` dùng giá trị THÔ của payload
        // (`clean(payload.priority)`), KHÔNG phải giá trị đã mặc định hoá ("normal") truyền vào UPDATE.
        // Tương tự `neededAt` là giá trị thô đã trim — không phải `null` khi rỗng.
        // ══════════════════════════════════════════════════════════════════════════════════
        Map<String, Object> editAfter = new LinkedHashMap<>();
        editAfter.put("neededAt", neededAt);
        editAfter.put("priority", trim(payload.get("priority")));
        editAfter.put("area", trim(payload.get("area")));
        editAfter.put("purpose", trim(payload.get("purpose")));
        editAfter.put("lineCount", lines.size());
        auditLog.log(principal.userId(), "EDIT_RETURNED", "material_request", requestId,
                MiniJson.stringify(mr), MiniJson.stringify(editAfter), null);

        return Map.of("message", "Đã lưu chỉnh sửa " + sv(mr, "requestNo") + ". Kiểm tra lại trước khi gửi lại từ đầu.");
    }

    /** resubmit_request — CHT gửi lại phiếu sau khi sửa; khởi động lại luồng duyệt. */
    public Map<String, Object> resubmitRequest(Principal principal, Map<String, Object> payload) {
        String requestId = trim(payload.get("requestId"));
        Map<String, Object> mr = store.findRequestBasic(requestId)
                .orElseThrow(() -> Api("Không tìm thấy phiếu đề nghị."));
        if (!sv(mr, "requestedBy").equals(principal.userId()) && !"admin".equals(principal.role()))
            throw Api("Chỉ CHT/người lập phiếu hoặc Quản trị viên được gửi lại phiếu.");
        if (!"returned_to_requester".equals(sv(mr, "status")))
            throw Api("Chỉ phiếu đã bị trả về CHT mới được gửi lại.");
        List<Map<String, Object>> stages = store.approvalStagesForRequest(requestId);
        if (stages.isEmpty()) throw Api("Chưa cấu hình bước phê duyệt hoạt động.");
        Map<String, Object> firstStage = stages.get(0);
        boolean autoFirst = isOne(gi(firstStage, "autoApproveOnSubmit"));
        // [PHASE 2 · §6] GỬI LẠI cũng phải suy bước khởi động lại từ chính các bước CHƯA bị bỏ qua (người gửi
        // lại trùng vai trò duyệt thì bước đó bị bỏ qua). Hình dạng cũ `autoFirst ? stage[1] : stage[0]` chỉ đúng
        // khi luồng có đúng 1 bước tự xác nhận ở đầu.
        int currentStage = 0;
        for (Map<String, Object> stage : stages) {
            if (isOne(gi(stage, "autoApproveOnSubmit"))) continue;
            if (!creatorMatchedStageRole(stage, principal).isEmpty()) continue;
            currentStage = ((Number) gi(stage, "stageNo")).intValue();
            break;
        }
        if (currentStage == 0) currentStage = ((Number) gi(stages.get(stages.size() - 1), "stageNo")).intValue();
        // Bước khởi động lại đã chốt ⇒ chốt thành biến `final` để lambda bên dưới bắt giữ được
        // (`currentStage` bị gán lại trong vòng lặp nên KHÔNG effectively final).
        final int restartStage = currentStage;
        Map<String, Object> currentConfig = stages.stream()
                .filter(s -> ((Number) gi(s, "stageNo")).intValue() == restartStage).findFirst().orElse(firstStage);
        String comment = "CHT GỬI LẠI: " + blankDefault(trim(payload.get("comment")),
                "Đã sửa phiếu; CHT xác nhận lại và khởi động lại luồng duyệt từ đầu.");
        store.resubmitRequest(requestId, stages, sv(firstStage, "stageNo"), autoFirst, currentStage,
                principal.userId(), comment, Instant.now());

        // ══════════════════════════════════════════════════════════════════════════════════
        // TASK-048 — AUDIT #3/6: JS `:1019`
        //   await audit(user.id, "RESUBMIT", "material_request", requestId, mr,
        //     { confirmedStage: firstStage.stageNo, restartStage: currentStage,
        //       comment: clean(payload.comment) }, request);
        // ⚠️ BẪY (bài học #13): `comment` ở đây là giá trị THÔ `clean(payload.comment)` — KHÔNG phải
        // biến `comment` cục bộ đã được mặc định hoá ("CHT GỬI LẠI: …") truyền xuống store.
        // ══════════════════════════════════════════════════════════════════════════════════
        Map<String, Object> resubmitAfter = new LinkedHashMap<>();
        resubmitAfter.put("confirmedStage", gi(firstStage, "stageNo"));
        resubmitAfter.put("restartStage", currentStage);
        resubmitAfter.put("comment", trim(payload.get("comment")));
        auditLog.log(principal.userId(), "RESUBMIT", "material_request", requestId,
                MiniJson.stringify(mr), MiniJson.stringify(resubmitAfter), null);

        return Map.of("message", "Đã gửi lại " + sv(mr, "requestNo") + "; CHT đã xác nhận và hồ sơ chuyển sang "
                + sv(currentConfig, "name") + ".");
    }

    /** delete_request — xóa phiếu bị trả lại/từ chối (chưa phát sinh PO). */
    public Map<String, Object> deleteRequest(Principal principal, Map<String, Object> payload) {
        String requestId = trim(payload.get("requestId"));
        Map<String, Object> mr = store.findRequestBasic(requestId)
                .orElseThrow(() -> Api("Không tìm thấy phiếu đề nghị."));
        if (!sv(mr, "requestedBy").equals(principal.userId()) && !"admin".equals(principal.role()))
            throw Api("Chỉ người lập phiếu hoặc Quản trị viên được xóa phiếu bị trả lại.");
        if (!List.of("returned_to_requester", "rejected").contains(sv(mr, "status")))
            throw Api("Chỉ phiếu bị trả lại/từ chối và chưa phát sinh mua hàng mới được xóa.");
        if (store.countRequestPoItems(requestId) > 0)
            throw Api("Phiếu đã phát sinh PO nên không được xóa; hãy giữ lịch sử.");

        // ══════════════════════════════════════════════════════════════════════════════════
        // TASK-048 — AUDIT #4/6: JS `:1030`
        //   await audit(user.id, "DELETE_RETURNED", "material_request", requestId, mr,
        //     { reason: clean(payload.reason) || "CHT xóa phiếu bị trả lại để lập mới" }, request);
        // ⚠️ THỨ TỰ: JS audit TRƯỚC rồi mới xoá (dòng 1030 audit, 1031 batch DELETE) ⇒ giữ đúng thứ tự.
        // ══════════════════════════════════════════════════════════════════════════════════
        Map<String, Object> deleteAfter = new LinkedHashMap<>();
        deleteAfter.put("reason", blankDefault(trim(payload.get("reason")),
                "CHT xóa phiếu bị trả lại để lập mới"));
        auditLog.log(principal.userId(), "DELETE_RETURNED", "material_request", requestId,
                MiniJson.stringify(mr), MiniJson.stringify(deleteAfter), null);

        store.deleteRequestCascade(requestId);
        return Map.of("message", "Đã xóa " + sv(mr, "requestNo") + ". CHT có thể lập phiếu mới.");
    }

    /** cancel_request — CHT/Admin hủy phiếu bị trả lại. */
    public Map<String, Object> cancelRequest(Principal principal, Map<String, Object> payload) {
        String requestId = trim(payload.get("requestId"));
        String reason = trim(payload.get("reason"));
        if (reason.isEmpty()) throw Api("Phải nhập lý do hủy phiếu.");
        Map<String, Object> mr = store.findRequestBasic(requestId)
                .orElseThrow(() -> Api("Không tìm thấy phiếu đề nghị."));
        // JS 1048: canAccessProject(user, mr.projectId, true) — kiểm TRƯỚC khi kiểm vai trò.
        accessScope.requireProjectAccess(principal.userId(), principal.role(),
                sv(mr, "projectId"), true, "Tài khoản không có quyền tại dự án.");
        if (!"commander".equals(cancelBaseRole(principal)) && !"admin".equals(principal.role()))
            throw Api("Chỉ Chỉ huy trưởng được hủy phiếu bị trả lại.");
        if (!"returned_to_requester".equals(sv(mr, "status")))
            throw Api("Chỉ phiếu đã bị trả lại và đang chờ CHT xử lý mới được hủy/xóa.");
        if (store.countRequestPoItems(requestId) > 0) throw Api("Phiếu đã phát sinh PO nên không thể hủy.");
        store.cancelRequest(requestId, reason, principal.userId(), Instant.now());

        // ══════════════════════════════════════════════════════════════════════════════════
        // TASK-048 — AUDIT #5/6: JS `:1062`
        //   await audit(user.id, "CANCEL", "material_request", requestId, mr, { reason }, request);
        // ══════════════════════════════════════════════════════════════════════════════════
        auditLog.log(principal.userId(), "CANCEL", "material_request", requestId,
                MiniJson.stringify(mr), MiniJson.stringify(Map.of("reason", reason)), null);

        return Map.of("message", "Đã hủy " + sv(mr, "requestNo") + "; số phiếu được giữ nguyên trong lịch sử.");
    }

    /** decide_approval — port nguyên trạng JS: owner check, single/all_roles, advance, reject, finalize. */
    public Map<String, Object> decideApproval(Principal principal, Map<String, Object> payload) {
        String requestId = trim(payload.get("requestId"));
        int stage = (int) numberValue(payload.get("stage"));
        String decision = trim(payload.get("decision"));
        String comment = trim(payload.get("comment"));
        Map<String, Object> mr = store.findRequestForApproval(requestId)
                .orElseThrow(() -> Api("Không tìm thấy đơn yêu cầu."));
        // JS 1076: phạm vi dự án của CHÍNH đơn (findRequestForApproval alias projectId).
        accessScope.requireProjectAccess(principal.userId(), principal.role(), sv(mr, "projectId"), true,
                "Tài khoản không có quyền tại dự án.");
        if (!canApproveRequestStage(principal.userId(), requestId, stage))
            throw Api("Bạn không phải Owner được phân công của bước này hoặc không đủ RBAC để phê duyệt.");
        if ((int) numberValue(gi(mr, "approvalStage")) != stage || !"pending_approval".equals(sv(mr, "status")))
            throw Api("Hồ sơ chưa đến bước duyệt này hoặc đã được xử lý.");
        if (!List.of("approved", "rejected").contains(decision)) throw Api("Quyết định không hợp lệ.");

        List<Map<String, Object>> stages = store.approvalStagesForRequest(requestId);
        int stageIndex = -1;
        for (int i = 0; i < stages.size(); i++) if ((int) numberValue(stages.get(i).get("stageNo")) == stage) stageIndex = i;
        if (stageIndex < 0) throw Api("Không tìm thấy bước phê duyệt trong luồng của hồ sơ này.");
        Map<String, Object> stageConfig = stages.get(stageIndex);
        String snapshot = "{\"stage\":" + stage + ",\"decision\":\"" + decision + "\",\"user\":\""
                + principal.fullName() + "\",\"at\":\"" + Instant.now() + "\",\"stageName\":\"" + sv(stageConfig, "name") + "\"}";
        Instant now = Instant.now();

        // ══════════════════════════════════════════════════════════════════════════════════
        // TASK-054 — port NGUYÊN VĂN nhánh duyệt SONG SONG `all_roles` của JS `:1087-1108`.
        // TRƯỚC ĐÂY Java "đơn giản hoá": ghi 1 quyết định rồi **ĐI TIẾP như `single`** ⇒ với bước
        // cấu hình 2 vai trò (dữ liệu thật: bước 5 `da_truong,kh_truong`) thì **MỘT vai trò xác nhận
        // là hồ sơ chuyển bước** ⇒ ràng buộc "mọi vai trò phải xác nhận" bị VÔ HIỆU.
        // JS:
        //   :1088 const required = stageRoleCodes(stageConfig)
        //   :1089 const approvedRows = await all(SELECT DISTINCT role_code … decision='approved')
        //   :1091 const roleCode = matchedApprovalRole(user, stageConfig)
        //                       || (isAdmin(user) ? required.find((c)=>!approved.has(c)) || "" : "")
        //   :1092 if (!roleCode) throw "Không xác định được vai trò xác nhận của tài khoản tại bước này."
        //   :1093-1094 chặn trùng vai trò
        //   :1095 INSERT approval_stage_decisions … ; :1096 approved.add(roleCode)
        //   :1097 const missing = required.filter((code)=>!approved.has(code))
        //   :1100 UPDATE approvals SET comment=<tiến độ>
        //   :1101 audit(user.id,"APPROVE_PARTIAL","material_request",requestId,mr,{stage,stageName,roleCode,missing})
        //   :1102 return  ← KHÔNG chuyển bước
        // ══════════════════════════════════════════════════════════════════════════════════
        if ("all_roles".equals(sv(stageConfig, "approvalMode")) && "approved".equals(decision)) {
            List<String> required = new ArrayList<>();
            for (String code : sv(stageConfig, "allowedRoleCodes").split(",")) {
                String trimmed = code.trim();
                if (!trimmed.isEmpty()) required.add(trimmed);
            }
            java.util.Set<String> approved = new java.util.LinkedHashSet<>(
                    store.stageDecisionRoles(requestId, stage));
            String roleCode = matchedApprovalRole(principal, stageConfig);
            // (JS :1091) QUẢN TRỊ VIÊN được điền vai trò còn thiếu — Java trước đây thiếu hẳn nhánh này.
            boolean isAdminUser = "admin".equals(principal.role()) || "admin".equals(principal.roleBase());
            if (roleCode.isEmpty() && isAdminUser) {
                for (String code : required) {
                    if (!approved.contains(code)) { roleCode = code; break; }
                }
            }
            if (roleCode.isEmpty()) throw Api("Không xác định được vai trò xác nhận của tài khoản tại bước này.");
            if (store.stageDecisionRoleExists(requestId, stage, roleCode))
                throw Api("Vai trò này đã xác nhận bước phê duyệt song song.");
            store.insertStageDecision(requestId, stage, roleCode, principal.userId(), "approved", comment, now);
            approved.add(roleCode);
            List<String> missing = new ArrayList<>();
            for (String code : required) {
                if (!approved.contains(code)) missing.add(code);
            }
            if (!missing.isEmpty()) {
                String progress = "Đã xác nhận " + approved.size() + "/" + required.size()
                        + "; còn chờ: " + String.join(", ", missing);
                store.updateApprovalComment(requestId, stage, progress, now);
                Map<String, Object> partialAfter = new LinkedHashMap<>();
                partialAfter.put("stage", stage);
                partialAfter.put("stageName", sv(stageConfig, "name"));
                partialAfter.put("roleCode", roleCode);
                partialAfter.put("missing", missing);
                auditLog.log(principal.userId(), "APPROVE_PARTIAL", "material_request", requestId,
                        MiniJson.stringify(mr), MiniJson.stringify(partialAfter), null);
                return Map.of("message", "Đã ghi nhận xác nhận của " + principal.fullName()
                        + "; " + progress + ".");
            }
        }
        // JS :1105-1108 — bước `all_roles` bị TỪ CHỐI vẫn phải ghi 1 dòng quyết định cho vai trò
        // (JS: `INSERT OR IGNORE`). Trước đây Java bỏ qua ⇒ mất dấu vết vai trò nào đã từ chối.
        if ("all_roles".equals(sv(stageConfig, "approvalMode")) && "rejected".equals(decision)) {
            String roleCode = matchedApprovalRole(principal, stageConfig);
            if (roleCode.isEmpty()) roleCode = trim(principal.role());
            if (roleCode.isEmpty()) roleCode = trim(principal.roleBase());
            if (!roleCode.isEmpty() && !store.stageDecisionRoleExists(requestId, stage, roleCode))
                store.insertStageDecision(requestId, stage, roleCode, principal.userId(), "rejected", comment, now);
        }

        // P4 — all_of: MỌI người duyệt của bước phải xác nhận thì hồ sơ mới chuyển bước.
        // (any_of/single đã được canApproveRequestStage chấp nhận: một người quyết định là qua.)
        if ("all_of".equals(store.stageApprovalMode(sv(mr, "projectId"), stage).orElse("")) && "approved".equals(decision)) {
            java.util.Set<String> pool = new java.util.LinkedHashSet<>(
                    store.stageApproverUserIds(sv(mr, "projectId"), stage));
            if (pool.size() > 1) {
                String decisionKey = "user:" + principal.userId();
                if (store.stageDecisionRoleExists(requestId, stage, decisionKey))
                    throw Api("Bạn đã xác nhận bước “" + sv(stageConfig, "name") + "” rồi.");
                store.insertStageDecision(requestId, stage, decisionKey, principal.userId(), "approved", comment, now);
                store.updateApprovalDecision(requestId, stage, "pending", principal.userId(),
                        comment.isEmpty() ? null : comment, snapshot, now);
                java.util.Set<String> decided = new java.util.HashSet<>(store.stageDecisionUsers(requestId, stage));
                decided.retainAll(pool);
                if (decided.size() < pool.size()) {
                    return Map.of("message", "Đã ghi nhận xác nhận của bạn ở bước “" + sv(stageConfig, "name")
                            + "”. Còn " + (pool.size() - decided.size()) + "/" + pool.size()
                            + " người duyệt chưa xác nhận nên hồ sơ chưa chuyển bước.");
                }
            }
        }

        store.updateApprovalDecision(requestId, stage, decision, principal.userId(),
                comment.isEmpty() ? null : comment, snapshot, now);

        if ("rejected".equals(decision)) {
            if (comment.isEmpty()) throw Api("Bắt buộc nhập lý do trả lại / từ chối hồ sơ.");
            store.returnRequestToRequester(requestId, stage, principal.userId(), comment, now);
            return Map.of("message", "Đã trả phiếu về CHT; bắt buộc sửa và gửi lại từ đầu hoặc xóa phiếu để lập mới.");
        }

        Map<String, Object> nextStage = stageIndex + 1 < stages.size() ? stages.get(stageIndex + 1) : null;
        if (nextStage != null) {
            long sla = (long) numberValue(gi(nextStage, "slaHours"));
            Instant nextDue = now.plusSeconds(sla * 3600);
            store.advanceRequestStage(requestId, (int) numberValue(gi(nextStage, "stageNo")), now, nextDue, now);
            return Map.of("message", "Đã duyệt " + sv(stageConfig, "name") + "; hồ sơ tự chuyển sang " + sv(nextStage, "name") + ".");
        }
        store.finalizeRequestApproval(requestId, stage, now);
        // tạo stock reservations (nếu MR có source warehouse) — port JS khi finalize
        Map<String, Object> mrRow = store.findRequestForApproval(requestId).orElse(Map.of());
        String sourceWarehouse = String.valueOf(mrRow.getOrDefault("sourceWarehouseId", ""));
        if (sourceWarehouse != null && !sourceWarehouse.isBlank()) {
            store.createStockReservations(requestId, sourceWarehouse, principal.userId(), now);
        }
        return Map.of("message", "Đã hoàn tất luồng phê duyệt; hồ sơ tự chuyển sang Mua hàng & PO và bắt đầu tính thời gian lập PO.");
    }

    private boolean canApproveRequestStage(String userId, String requestId, int stage) {
        Map<String, Object> stageRow = store.findApprovalRow(requestId, stage).orElse(null);
        if (stageRow == null) return false;

        // CÓ HAI ĐƯỜNG ĐỦ ĐIỀU KIỆN DUYỆT — chỉ cần MỘT trong hai:
        //   (1) CHỈ ĐỊNH — có tên trong workflow của bước (∪ owner của bước);
        //   (2) THEO VAI TRÒ — vai trò (hoặc vai trò gốc) nằm trong allowed_role_codes của bước.
        // Mỗi bước CHỈ CẦN MỘT NGƯỜI duyệt là hồ sơ chuyển bước (xem decideApproval: single/any_of).
        //
        // LỖI ĐÃ SỬA: trước đây hàm `return false` ngay khi người dùng không nằm trong danh sách
        // chỉ định, nên phép kiểm vai trò ở cuối hàm KHÔNG BAO GIỜ chạy tới. Hệ quả: những tài
        // khoản có ĐÚNG vai trò của bước và có quyền `approvals.canApprove` vẫn bị chặn, trái với
        // thiết kế "ai có quyền duyệt bước đó thì duyệt được".
        Map<String, Object> req = store.findRequestForApproval(requestId).orElse(Map.of());
        java.util.Set<String> pool = new java.util.LinkedHashSet<>(
                store.stageApproverUserIds(sv(req, "projectId"), stage));
        String owner = sv(stageRow, "ownerUserId");
        if (!owner.isEmpty()) pool.add(owner);

        String role = sv(stageRow, "allowedRoleCodes");
        java.util.Set<String> allowed = new java.util.HashSet<>(java.util.Arrays.asList(role.split(",")));
        allowed.removeIf(String::isBlank);

        Map<String, Object> userRole = store.findUserRoleInfo(userId).orElse(Map.of());
        String userRoleCode = sv(userRole, "role");
        String baseRole = sv(userRole, "baseRole");
        boolean roleEligible = "admin".equals(userRoleCode)
                || allowed.contains(userRoleCode) || allowed.contains(baseRole);

        // (1) Được chỉ định đích danh: bước không giới hạn vai trò thì đương nhiên được duyệt;
        //     nếu có giới hạn vai trò thì vẫn phải đúng vai trò.
        if (pool.contains(userId)) return allowed.isEmpty() || roleEligible;
        // (2) Không được chỉ định đích danh nhưng ĐÚNG VAI TRÒ của bước.
        return !allowed.isEmpty() && roleEligible;
    }

    private String matchedApprovalRole(Principal principal, Map<String, Object> stageConfig) {
        java.util.Set<String> allowed = new java.util.HashSet<>(java.util.Arrays
                .asList(sv(stageConfig, "allowedRoleCodes").split(",")));
        allowed.removeIf(String::isBlank);
        Map<String, Object> userRole = store.findUserRoleInfo(principal.userId()).orElse(Map.of());
        if (allowed.contains(sv(userRole, "role"))) return sv(userRole, "role");
        if (allowed.contains(sv(userRole, "baseRole"))) return sv(userRole, "baseRole");
        return "";
    }

    // ---- helpers ----

    /**
     * Mã ENGINE (role_catalog.base_role) của tài khoản — tương đương {@code effectiveRole(user)} trong JS.
     * Mã chuẩn ánh xạ nhiều-về-một sang base_role (cht→commander, da_nv &amp; da_truong→project,
     * kh_nv &amp; kh_truong→procurement, thu_kho &amp; kho_tong→warehouse, ksda→engineer, thuky→director),
     * nên mọi so sánh vai trò kiểu JS phải dùng giá trị này. Không có dòng role_catalog thì rơi về mã vai trò.
     */
    private String cancelBaseRole(Principal principal) {
        String baseRole = sv(store.findUserRoleInfo(principal.userId()).orElse(Map.of()), "baseRole");
        return baseRole.isEmpty() ? principal.role() : baseRole;
    }
    private void checkRequiredHeader(Map<String, Object> payload, String neededAt) {
        List<Map<String, Object>> cfgRows = store.formFieldRows("request_header");
        Map<String, Boolean> byKey = new LinkedHashMap<>();
        for (Map<String, Object> cfg : cfgRows)
            byKey.put(sv(cfg, "fieldKey"), isOne(gi(cfg, "required")) && isOne(gi(cfg, "active")));
        for (String key : List.of("neededAt", "area", "priority", "purpose")) {
            String display = cfgRows.stream()
                    .filter(c -> sv(c, "fieldKey").equals(key))
                    .map(c -> sv(c, "displayName")).filter(s -> !s.isEmpty()).findFirst().orElse(key);
            boolean hasRow = byKey.containsKey(key);
            boolean required = hasRow ? byKey.get(key) : "neededAt".equals(key); // fallback: chỉ neededAt
            if (required && trim(payload.get(key)).isEmpty()) {
                throw Api(display + " đang được Quản trị viên cấu hình bắt buộc.");
            }
        }
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

    static String normalizeMaterialName(String value) {
        String n = java.text.Normalizer.normalize(value == null ? "" : value, java.text.Normalizer.Form.NFD);
        n = n.replaceAll("\\p{M}", "").replace("đ", "d").replace("Đ", "D");
        return n.toLowerCase().replaceAll("[^a-z0-9]+", " ").trim();
    }

    private static double numberValue(Object o) {
        try { return o == null ? 0 : Double.parseDouble(String.valueOf(o)); }
        catch (NumberFormatException e) { return 0; }
    }
    private static boolean isOne(Object o) { return o instanceof Number n ? n.intValue() == 1 : Boolean.TRUE.equals(o); }

    /** Get case-insensitive (H2 trả lowercase keys, MySQL trả đúng alias camelCase). */
    private static Object gi(Map<String, Object> m, String key) {
        if (m == null) return null;
        Object v = m.get(key);
        if (v != null) return v;
        for (Map.Entry<String, Object> e : m.entrySet()) {
            if (e.getKey().equalsIgnoreCase(key)) return e.getValue();
        }
        return null;
    }

    private static String sv(Map<String, Object> m, String k) {
        Object v = gi(m, k);
        return v == null ? "" : String.valueOf(v);
    }
    private static String trim(Object o) { return o == null ? "" : String.valueOf(o).trim(); }
    private static String nvl(Object o) { String s = trim(o); return s.isEmpty() ? null : s; }

    /**
     * TASK-043 — port nguyên văn JS `customFieldsObject` (system-route.mjs:102):
     * <pre>if (!value || typeof value !== "object" || Array.isArray(value)) return {};</pre>
     * ⇒ CHỈ nhận object (Map). Chuỗi JSON / mảng / null đều bị coi là rỗng, không tự đoán ý người gửi.
     */
    private static Map<String, Object> customFieldsObject(Object value) {
        if (!(value instanceof Map<?, ?> raw)) return Map.of();
        Map<String, Object> out = new LinkedHashMap<>();
        for (Map.Entry<?, ?> e : raw.entrySet()) out.put(trim(e.getKey()), e.getValue());
        return out;
    }

    /**
     * TASK-043 — port `clean(value) = String(value ?? "").trim()` (system-route.mjs:35).
     * Khác {@code String.valueOf}: JS in số nguyên không có phần thập phân (`1.0` → "1"), nên phải
     * chuẩn hoá số thực nguyên để `value_text` không lệch so với bản JS.
     */
    private static String cleanValue(Object value) {
        if (value == null) return "";
        if (value instanceof Double d) {
            if (d.isNaN() || d.isInfinite()) return String.valueOf(d);
            if (d == Math.rint(d) && Math.abs(d) < 1e15) return String.valueOf(d.longValue());
            return String.valueOf(d);
        }
        if (value instanceof Float f) return cleanValue(f.doubleValue());
        if (value instanceof Boolean b) return b ? "true" : "false";
        return String.valueOf(value).trim();
    }
    private static String blankDefault(String s, String fallback) { return s.isEmpty() ? fallback : s; }
    @SuppressWarnings("unchecked")
    private static Map<String, Object> asMap(Object o) { return o instanceof Map ? (Map<String, Object>) o : Map.of(); }
    private static AuthUseCase.ApiError Api(String message) { return new AuthUseCase.ApiError(message, 400); }

    private AuthUseCase.CurrentUser principalAsCurrent(Principal p) {
        return new AuthUseCase.CurrentUser(p.userId(), "", p.fullName(), p.email(), p.role(), p.roleBase(), p.role(),
                null, null, null, false);
    }
}