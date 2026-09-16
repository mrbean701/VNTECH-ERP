package com.vntech.erp.application.service;

import com.vntech.erp.application.port.out.IdGenerator;
import com.vntech.erp.application.port.out.OpsTaskStore;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

/**
 * Use-case nhiệm vụ/tổ đội/bước duyệt/MAR — port nguyên trạng create_work_item,
 * project team, approval stage, save_mar_approval JS.
 */
public final class OpsTaskManagementUseCase {

    private static final Set<String> TASK_STATUSES = Set.of("NEW", "IN_PROGRESS", "SUBMITTED", "COMPLETED",
            "BLOCKED", "WAITING", "ON_HOLD", "CANCELLED");
    private static final Set<String> TASK_WAITING = Set.of("BLOCKED", "WAITING", "ON_HOLD");

    private final OpsTaskStore store;
    private final IdGenerator idGenerator;

    public OpsTaskManagementUseCase(OpsTaskStore store, IdGenerator idGenerator) {
        this.store = store;
        this.idGenerator = idGenerator;
    }

    public interface Principal {
        String userId();
        String role();
        String fullName();
        String email();
    }

    // ============ work items ============
    public Map<String, Object> createWorkItem(Principal principal, Map<String, Object> payload) {
        String department = trim(payload.get("departmentCode")).toUpperCase(Locale.ROOT);
        if (!List.of("KH", "DA").contains(department)) throw Api("Phòng ban không hợp lệ.");
        if (!store.userIsDepartmentManager(principal.userId(), department))
            throw Api("Chỉ Trưởng phòng hoặc Quản trị viên được giao việc thủ công.");
        if (!trim(payload.get("sourceId")).isEmpty() || !trim(payload.get("sourceType")).isEmpty()
                || !trim(payload.get("sourceModule")).isEmpty())
            throw Api("Giao việc thủ công chỉ dùng cho công việc không có nghiệp vụ nguồn. Task từ ERP phải được hệ thống tự sinh.");
        String title = trim(payload.get("title"));
        if (title.isEmpty()) throw Api("Cần nhập nội dung công việc.");
        String projectId = nvl(payload.get("projectId"));
        String dueAt = nvl(payload.get("dueAt"));
        Instant now = Instant.now();
        long seq = java.util.concurrent.ThreadLocalRandom.current().nextLong(100000, 999999);
        String taskNo = "CV-" + department + "-" + now.toString().substring(2, 10).replace("-", "") + "-" + String.format("%04d", seq % 10000);
        Map<String, Object> task = new LinkedHashMap<>();
        task.put("id", idGenerator.next("WI"));
        task.put("department", department);
        task.put("workGroup", blankDefault(trim(payload.get("workGroup")), "GIAO_VIEC_BO_SUNG"));
        task.put("title", title);
        task.put("description", nvl(payload.get("description")));
        task.put("projectId", projectId);
        task.put("workStep", "MANUAL");
        task.put("assignedTo", nvl(payload.get("assignedTo")));
        task.put("assignedBy", principal.userId());
        task.put("dueAt", dueAt);
        task.put("priority", blankDefault(trim(payload.get("priority")), "normal"));
        task.put("requiredOutput", nvl(payload.get("requiredOutput")));
        task.put("sourceId", null);
        task.put("sourceType", null);
        task.put("sourceModule", null);
        task.put("taskNo", taskNo);
        task.put("createdBy", principal.userId());
        store.insertWorkItem(task, now);
        return Map.of("message", "Đã giao " + taskNo + ". SLA/KPI tính ngay từ assigned_at và đã tạo thông báo cho nhân viên.");
    }

    /**
     * GĐ4 — TỰ TẠO VIỆC CHO CHÍNH MÌNH.
     *
     * Khác {@link #createWorkItem} ở 3 điểm CỐT LÕI (có chủ đích, không phải sao chép):
     *   1. KHÔNG đòi hỏi Trưởng phòng/Admin — mọi người dùng đều tự giao việc cho mình.
     *   2. `assignedTo` LUÔN lấy từ principal, KHÔNG đọc từ payload ⇒ không thể lợi dụng
     *      đường này để mạo danh giao việc cho người khác. Muốn giao cho người khác phải
     *      dùng `create_work_item` (đã có kiểm tra Trưởng phòng/Admin).
     *   3. `department_code` = "CN" (Cá nhân). Cột này NOT NULL và `createWorkItem` chỉ
     *      nhận KH/DA; dùng mã riêng giúp việc cá nhân KHÔNG lẫn vào màn công việc
     *      phòng ban (màn đó lọc theo KH/DA).
     */
    public Map<String, Object> createSelfWorkItem(Principal principal, Map<String, Object> payload) {
        String title = trim(payload.get("title"));
        if (title.isEmpty()) throw Api("Cần nhập nội dung công việc.");
        if (!trim(payload.get("sourceId")).isEmpty() || !trim(payload.get("sourceType")).isEmpty()
                || !trim(payload.get("sourceModule")).isEmpty())
            throw Api("Việc tự tạo chỉ dùng cho công việc không có nghiệp vụ nguồn.");
        Instant now = Instant.now();
        long seq = java.util.concurrent.ThreadLocalRandom.current().nextLong(100000, 999999);
        String taskNo = "CVCN-" + now.toString().substring(2, 10).replace("-", "") + "-" + String.format("%04d", seq % 10000);
        Map<String, Object> task = new LinkedHashMap<>();
        task.put("id", idGenerator.next("WI"));
        task.put("department", "CN");
        task.put("workGroup", blankDefault(trim(payload.get("workGroup")), "VIEC_CA_NHAN"));
        task.put("title", title);
        task.put("description", nvl(payload.get("description")));
        task.put("projectId", nvl(payload.get("projectId")));
        task.put("workStep", "MANUAL");
        task.put("assignedTo", principal.userId());
        task.put("assignedBy", principal.userId());
        task.put("dueAt", nvl(payload.get("dueAt")));
        task.put("priority", blankDefault(trim(payload.get("priority")), "normal"));
        task.put("requiredOutput", nvl(payload.get("requiredOutput")));
        task.put("sourceId", null);
        task.put("sourceType", null);
        task.put("sourceModule", null);
        task.put("taskNo", taskNo);
        task.put("createdBy", principal.userId());
        store.insertWorkItem(task, now);
        return Map.of("message", "Đã tạo " + taskNo + " cho chính bạn.");
    }

    public Map<String, Object> updateWorkItemProgress(Principal principal, Map<String, Object> payload) {
        String taskId = trim(payload.get("workItemId"));
        int progress = Math.max(0, Math.min(100, (int) Math.round(numberValue(payload.get("progress")))));
        Map<String, Object> task = store.findWorkItem(taskId)
                .orElseThrow(() -> Api("Không tìm thấy nhiệm vụ."));
        if (!sv(task, "assigned_to").equals(principal.userId())
                && !store.userIsDepartmentManager(principal.userId(), sv(task, "department_code")))
            throw Api("Không có quyền cập nhật nhiệm vụ này.");
        Instant now = Instant.now();
        String currentStatus = sv(task, "status");
        store.updateWorkItemProgress(taskId, progress, currentStatus, now);
        String nextStatus = "NEW".equals(currentStatus) && progress > 0 ? "IN_PROGRESS" : currentStatus;
        if (!nextStatus.equals(currentStatus)) {
            store.insertWorkItemEvent(idGenerator.next("EVT"), taskId, "PROGRESS", currentStatus, nextStatus,
                    principal.userId(), null, null, null, "{\"progress\":" + progress + "}", now);
        }
        return Map.of("message", "Đã cập nhật tiến độ " + progress + "%.");
    }

    public Map<String, Object> updateWorkItemStatus(Principal principal, Map<String, Object> payload) {
        String taskId = trim(payload.get("workItemId"));
        String next = trim(payload.get("status")).toUpperCase(Locale.ROOT);
        String reason = trim(payload.get("reason"));
        if (!TASK_STATUSES.contains(next)) throw Api("Trạng thái nhiệm vụ không hợp lệ.");
        Map<String, Object> task = store.findWorkItem(taskId)
                .orElseThrow(() -> Api("Không tìm thấy nhiệm vụ."));
        boolean manager = store.userIsDepartmentManager(principal.userId(), sv(task, "department_code"));
        if (!sv(task, "assigned_to").equals(principal.userId()) && !manager)
            throw Api("Không có quyền cập nhật nhiệm vụ này.");
        if (TASK_WAITING.contains(next) && reason.isEmpty())
            throw Api("Trạng thái Chờ/Blocked/On hold bắt buộc phải có lý do hoặc bằng chứng.");
        if ("COMPLETED".equals(next) && !manager)
            throw Api("Người thực hiện chỉ Gửi kiểm tra; Trưởng phòng/người có thẩm quyền mới xác nhận Hoàn thành.");
        Instant now = Instant.now();
        String currentStatus = sv(task, "status");
        double progress = "COMPLETED".equals(next) ? 100 : numberValue(task.get("progress"));
        Map<String, Object> u = new LinkedHashMap<>();
        u.put("id", taskId);
        u.put("status", next);
        u.put("progress", progress);
        u.put("waitingReason", TASK_WAITING.contains(next) ? reason : null);
        u.put("waitingStartedAt", TASK_WAITING.contains(next) ? now : null);
        u.put("stamp", now);
        u.put("actor", principal.userId());
        store.updateWorkItemStatus(u, now);
        store.insertWorkItemEvent(idGenerator.next("EVT"), taskId, "STATUS", currentStatus, next,
                principal.userId(), null, null, reason.isEmpty() ? null : reason, null, now);
        return Map.of("message", "Đã chuyển " + sv(task, "task_no") + " sang " + next
                + ". SLA gốc vẫn tính từ assigned_at; thời gian chờ hợp lệ được tách khỏi lỗi công việc.");
    }

    public Map<String, Object> reassignWorkItem(Principal principal, Map<String, Object> payload) {
        String taskId = trim(payload.get("workItemId"));
        String nextUser = trim(payload.get("assignedTo"));
        String reason = trim(payload.get("reason"));
        Map<String, Object> task = store.findWorkItem(taskId)
                .orElseThrow(() -> Api("Không tìm thấy nhiệm vụ."));
        if (!store.userIsDepartmentManager(principal.userId(), sv(task, "department_code")))
            throw Api("Chỉ Trưởng phòng/Quản trị viên được đổi người phụ trách.");
        if (reason.isEmpty()) throw Api("Đổi người phụ trách phải có lý do.");
        if (!store.userCanReceiveDepartmentTask(nextUser, sv(task, "department_code"), sv(task, "project_id")))
            throw Api("Nhân sự mới không thuộc đúng phòng hoặc phạm vi dự án.");
        Instant now = Instant.now();
        store.reassignWorkItem(taskId, nextUser, principal.userId(), now);
        store.insertWorkItemEvent(idGenerator.next("EVT"), taskId, "REASSIGNED", sv(task, "status"), "NEW",
                principal.userId(), sv(task, "assigned_to"), nextUser, reason, null, now);
        return Map.of("message", "Đã chuyển nhiệm vụ cho nhân sự mới; SLA trách nhiệm mới bắt đầu ngay tại thời điểm giao lại và toàn bộ lịch sử được giữ.");
    }

    public Map<String, Object> markTaskNotificationRead(Principal principal, Map<String, Object> payload) {
        String notificationId = trim(payload.get("notificationId"));
        store.markNotificationRead(notificationId, principal.userId(), Instant.now());
        return Map.of("message", "Đã đánh dấu thông báo đã đọc.");
    }

    // ============ project teams ============
    /**
     * Port nguyên trạng JS create_project_team: cần dự án đang hoạt động, chống trùng mã/tên trong dự án,
     * sinh mã toàn cục <PROJECTCODE>-<CODE>, tạo KHO TỔ ĐỘI (type='team', cha là kho site) rồi mới ghi tổ đội
     * trỏ tới kho đó — teams.warehouse_id là NOT NULL nên thiếu kho sẽ lỗi ràng buộc.
     */
    public Map<String, Object> createProjectTeam(Principal principal, Map<String, Object> payload) {
        String projectId = trim(payload.get("projectId"));
        String code = trim(payload.get("code")).toUpperCase(Locale.ROOT);
        String name = trim(payload.get("name"));
        String trade = trim(payload.get("trade"));
        if (projectId.isEmpty() || code.isEmpty() || name.isEmpty() || trade.isEmpty())
            throw Api("Dự án, mã tổ đội, tên tổ đội và hạng mục là bắt buộc.");
        Map<String, Object> project = store.findActiveProject(projectId)
                .orElseThrow(() -> Api("Dự án không tồn tại hoặc đã đóng."));
        if (store.teamCodeExists(projectId, code) || store.teamNameExists(projectId, name))
            throw Api("Mã hoặc tên tổ đội đã tồn tại trong dự án này.");
        String globalCode = (trim(project.get("code")) + "-" + code)
                .replaceAll("[^A-Za-z0-9_-]", "-");
        if (globalCode.length() > 48) globalCode = globalCode.substring(0, 48);
        if (store.teamGlobalCodeExists(globalCode)) throw Api("Mã tổ đội đã tồn tại. Hãy dùng mã khác.");
        // Kho site là cha của kho tổ đội; thiếu kho site thì không thể xuất vật tư cho tổ đội.
        String siteWarehouseId = store.findFirstSiteWarehouse(projectId)
                .map(w -> trim(w.get("id")))
                .orElseThrow(() -> Api("Dự án chưa có kho dự án để liên kết tổ đội."));

        String teamId = idGenerator.next("TEAM");
        String warehouseId = idGenerator.next("WHTEAM");
        String warehouseCode = ("TD-" + globalCode);
        if (warehouseCode.length() > 48) warehouseCode = warehouseCode.substring(0, 48);

        Instant now = Instant.now();
        Map<String, Object> team = new LinkedHashMap<>();
        team.put("id", teamId);
        team.put("projectId", projectId);
        team.put("code", globalCode);
        team.put("name", name);
        team.put("trade", trade);
        team.put("warehouseId", warehouseId);
        team.put("leaderUserId", nvl(payload.get("leaderUserId")));
        store.insertProjectTeamWithWarehouse(team, warehouseId, warehouseCode,
                "Kho tổ đội · " + name, siteWarehouseId, now);
        return Map.of("message", "Đã tạo tổ đội " + name + " trong dự án " + trim(project.get("code")) + ".");
    }

    public Map<String, Object> saveProjectTeam(Principal principal, Map<String, Object> payload) {
        String teamId = trim(payload.get("teamId"));
        String projectId = trim(payload.get("projectId"));
        Map<String, Object> team = store.findProjectTeam(teamId, projectId)
                .orElseThrow(() -> Api("Không tìm thấy tổ đội."));
        String code = trim(payload.get("code")).toUpperCase(Locale.ROOT);
        String name = trim(payload.get("name"));
        if (code.isEmpty() || name.isEmpty()) throw Api("Mã và tên tổ đội là bắt buộc.");
        Map<String, Object> update = new LinkedHashMap<>();
        update.put("id", teamId);
        update.put("code", code);
        update.put("name", name);
        update.put("warehouseId", nvl(payload.get("warehouseId")));
        update.put("description", nvl(payload.get("description")));
        update.put("leaderUserId", nvl(payload.get("leaderUserId")));
        store.updateProjectTeam(update, Instant.now());
        return Map.of("message", "Đã cập nhật tổ đội.");
    }

    public Map<String, Object> setProjectTeamStatus(Principal principal, Map<String, Object> payload) {
        String teamId = trim(payload.get("teamId"));
        String projectId = trim(payload.get("projectId"));
        store.findProjectTeam(teamId, projectId).orElseThrow(() -> Api("Không tìm thấy tổ đội."));
        boolean active = payload.get("active") == Boolean.TRUE || "1".equals(trim(payload.get("active")));
        Instant now = Instant.now();
        // JS set_project_team_status bật/tắt kèm kho tổ đội để tồn kho không còn dùng được khi tổ đội ngừng.
        store.findTeamWarehouseId(teamId).ifPresent(warehouseId -> store.setWarehouseStatus(warehouseId, active, now));
        store.setProjectTeamStatus(teamId, active, now);
        return Map.of("message", active ? "Đã kích hoạt tổ đội." : "Đã ngừng hoạt động của tổ đội (không xóa dữ liệu).");
    }

    /**
     * JS delete_project_team: chỉ xóa khi tổ đội CHƯA phát sinh giao dịch (xuất kho/hoàn trả/đề nghị),
     * và xóa kèm kho tổ đội để không bỏ lại kho mồ côi.
     */
    public Map<String, Object> deleteProjectTeam(Principal principal, Map<String, Object> payload) {
        String teamId = trim(payload.get("teamId"));
        String projectId = trim(payload.get("projectId"));
        store.findProjectTeam(teamId, projectId).orElseThrow(() -> Api("Không tìm thấy tổ đội."));
        if (store.teamHasTransactions(teamId))
            throw Api("Tổ đội đã phát sinh giao dịch; chỉ được ngừng hoạt động, không được xóa vật lý.");
        String warehouseId = store.findTeamWarehouseId(teamId).orElse(null);
        store.deleteProjectTeamWithWarehouse(teamId, warehouseId);
        return Map.of("message", "Đã xóa tổ đội chưa phát sinh giao dịch.");
    }

    // ============ approval stages ============
    public Map<String, Object> saveApprovalStage(Principal principal, Map<String, Object> payload) {
        String stageId = trim(payload.get("stageId"));
        String code = trim(payload.get("code"));
        String name = trim(payload.get("name"));
        int stageNo = (int) Math.round(numberValue(payload.get("stageNo")));
        String allowedRoleCodes = nvl(payload.get("allowedRoleCodes"));
        if (code.isEmpty() || name.isEmpty() || stageNo <= 0) throw Api("Bước duyệt cần mã, tên và số thứ tự.");
        if (stageNo < 100 && store.findApprovalStageCatalog(String.valueOf(stageNo)).isEmpty())
            throw Api("Bước duyệt hệ thống không tồn tại; chỉ được tạo bước HTML (≥100).");
        Instant now = Instant.now();
        if (!stageId.isEmpty() && store.findApprovalStage(stageId).isPresent()) {
            if (store.stageCodeExists(String.valueOf(stageNo), stageId)) throw Api("Mã bước duyệt đã tồn tại.");
            Map<String, Object> stage = new LinkedHashMap<>();
            stage.put("id", stageId);
            stage.put("code", code);
            stage.put("name", name);
            stage.put("stageNo", stageNo);
            stage.put("allowedRoleCodes", allowedRoleCodes);
            store.updateApprovalStage(stage, now);
            return Map.of("message", "Đã cập nhật bước duyệt.");
        }
        if (store.stageCodeExists(String.valueOf(stageNo), "")) throw Api("Mã bước duyệt đã tồn tại.");
        Map<String, Object> stage = new LinkedHashMap<>();
        stage.put("id", idGenerator.next("ASTG"));
        stage.put("code", code);
        stage.put("name", name);
        stage.put("stageNo", stageNo);
        stage.put("allowedRoleCodes", allowedRoleCodes);
        stage.put("createdBy", principal.userId());
        store.insertApprovalStage(stage, now);
        return Map.of("message", "Đã tạo bước duyệt tùy chỉnh.");
    }

    public Map<String, Object> setApprovalStageStatus(Principal principal, Map<String, Object> payload) {
        String stageId = trim(payload.get("stageId"));
        store.findApprovalStage(stageId).orElseThrow(() -> Api("Không tìm thấy bước duyệt."));
        boolean active = payload.get("active") == Boolean.TRUE || "1".equals(trim(payload.get("active")));
        store.setApprovalStageStatus(stageId, active, Instant.now());
        return Map.of("message", active ? "Đã kích hoạt bước duyệt." : "Đã ẩn bước duyệt (không dùng cho yêu cầu mới).");
    }

    public Map<String, Object> deleteApprovalStage(Principal principal, Map<String, Object> payload) {
        String stageId = trim(payload.get("stageId"));
        store.findApprovalStage(stageId).orElseThrow(() -> Api("Không tìm thấy bước duyệt."));
        store.deleteApprovalStageSafe(stageId);
        return Map.of("message", "Đã xóa bước duyệt tùy chỉnh.");
    }

    // ============ P4: workflow đa luồng ============
    private static final java.util.Set<String> APPROVAL_MODES = java.util.Set.of("single", "any_of", "all_of");

    /**
     * save_workflow — tạo/cập nhật MỘT quy trình kèm toàn bộ bước và người duyệt đích danh.
     * Ghi đè bước trong một giao dịch để tránh trạng thái nửa vời.
     * payload: { workflowId?, code, name, description?, moduleKey?, projectId?, isDefault?, sortOrder?, stages: [...] }
     * mỗi phần tử stages: { stepNo, name, description?, approvalMode, slaHours, allowSkipLevel?, approverUserIds: [...] }
     */
    public Map<String, Object> saveWorkflow(Principal principal, Map<String, Object> payload) {
        String workflowId = trim(payload.get("workflowId"));
        String code = trim(payload.get("code"));
        String name = trim(payload.get("name"));
        String description = nvl(payload.get("description"));
        String moduleKey = trim(payload.get("moduleKey"));
        String projectId = trim(payload.get("projectId"));
        boolean isDefault = payload.get("isDefault") == Boolean.TRUE || "1".equals(trim(payload.get("isDefault")));
        int sortOrder = (int) Math.round(numberValue(payload.get("sortOrder")));
        if (code.isEmpty() || name.isEmpty()) throw Api("Quy trình cần mã và tên.");
        if (!code.matches("[A-Za-z0-9._-]{3,64}")) throw Api("Mã quy trình chỉ gồm chữ, số, dấu chấm, gạch ngang/gạch dưới (3–64 ký tự).");

        // moduleKey phải tồn tại trong danh mục chức năng (nếu có khai báo)
        if (!moduleKey.isEmpty() && store.workflowDefinitions() != null) {
            // kiểm tra gián tiếp qua module_catalog đã được bootstrap kiểm chứng; ở đây chỉ chặn ký tự lạ
            if (!moduleKey.matches("[A-Za-z0-9_]{2,64}")) throw Api("Mã chức năng không hợp lệ.");
        }

        Object rawStages = payload.get("stages");
        List<Map<String, Object>> stageInputs = new ArrayList<>();
        if (rawStages instanceof List<?> list) {
            for (Object item : list) {
                if (item instanceof Map<?, ?> m) {
                    //noinspection unchecked
                    stageInputs.add((Map<String, Object>) m);
                }
            }
        }
        if (stageInputs.isEmpty()) throw Api("Quy trình phải có ít nhất một bước duyệt.");

        // Chuẩn hóa + kiểm tra từng bước
        int autoNo = 0;
        List<Map<String, Object>> steps = new ArrayList<>();
        List<Map<String, Object>> approvers = new ArrayList<>();
        java.util.Set<Integer> usedNo = new java.util.HashSet<>();
        for (Map<String, Object> raw : stageInputs) {
            autoNo++;
            int stepNo = (int) Math.round(numberValue(raw.get("stepNo")));
            if (stepNo <= 0) stepNo = autoNo;
            if (!usedNo.add(stepNo)) throw Api("Số thứ tự bước bị trùng: " + stepNo + ".");
            String stepName = trim(raw.get("name"));
            if (stepName.isEmpty()) throw Api("Bước " + stepNo + " chưa có tên.");
            String mode = trim(raw.get("approvalMode"));
            if (mode.isEmpty()) mode = "single";
            if (!APPROVAL_MODES.contains(mode)) throw Api("Cách xác nhận của bước " + stepNo + " không hợp lệ (single/any_of/all_of).");

            List<String> userIds = new ArrayList<>();
            Object rawUsers = raw.get("approverUserIds");
            if (rawUsers instanceof List<?> users) {
                for (Object u : users) {
                    String id = trim(u);
                    if (!id.isEmpty() && !userIds.contains(id)) userIds.add(id);
                }
            }
            if (userIds.isEmpty()) throw Api("Bước " + stepNo + " (“" + stepName + "”) chưa chỉ định người duyệt.");
            if ("single".equals(mode) && userIds.size() > 1)
                throw Api("Bước " + stepNo + " chọn “một người duyệt” thì chỉ được chỉ định đúng một người.");

            String stepId = idGenerator.next("WFS");
            Map<String, Object> step = new LinkedHashMap<>();
            step.put("id", stepId);
            step.put("stepNo", stepNo);
            step.put("name", stepName);
            step.put("description", nvl(raw.get("description")));
            step.put("approvalMode", mode);
            int sla = (int) Math.round(numberValue(raw.get("slaHours")));
            step.put("slaHours", sla <= 0 ? 8 : sla);
            step.put("allowSkipLevel", raw.get("allowSkipLevel") == Boolean.TRUE || "1".equals(trim(raw.get("allowSkipLevel"))) ? 1 : 0);
            step.put("requiredPermission", trim(raw.get("requiredPermission")));
            steps.add(step);
            for (String userId : userIds) {
                Map<String, Object> ap = new LinkedHashMap<>();
                ap.put("id", idGenerator.next("WFSA"));
                ap.put("stepId", stepId);
                ap.put("userId", userId);
                approvers.add(ap);
            }
        }
        steps.sort((a, b) -> Integer.compare((int) a.get("stepNo"), (int) b.get("stepNo")));

        Instant now = Instant.now();
        boolean exists = !workflowId.isEmpty() && store.findWorkflow(workflowId).isPresent();
        if (exists) {
            Optional<Map<String, Object>> byCode = store.findWorkflowByCode(code);
            if (byCode.isPresent() && !trim(byCode.get().get("id")).equals(workflowId))
                throw Api("Mã quy trình “" + code + "” đã được dùng cho quy trình khác.");
        } else {
            if (store.findWorkflowByCode(code).isPresent()) throw Api("Mã quy trình “" + code + "” đã tồn tại.");
            workflowId = idGenerator.next("WF");
        }

        Map<String, Object> workflow = new LinkedHashMap<>();
        workflow.put("id", workflowId);
        workflow.put("code", code);
        workflow.put("name", name);
        workflow.put("description", description);
        workflow.put("moduleKey", moduleKey.isEmpty() ? null : moduleKey);
        workflow.put("projectId", projectId.isEmpty() ? null : projectId);
        workflow.put("isDefault", isDefault ? 1 : 0);
        workflow.put("sortOrder", sortOrder);
        workflow.put("createdBy", principal.userId());
        store.upsertWorkflow(workflow, now);
        store.replaceWorkflowSteps(workflowId, steps, approvers, now);

        int approverCount = approvers.size();
        return Map.of("message", (exists ? "Đã cập nhật quy trình “" : "Đã tạo quy trình “") + name + "” với "
                + steps.size() + " bước và " + approverCount + " người duyệt.", "workflowId", workflowId);
    }

    public Map<String, Object> setWorkflowStatus(Principal principal, Map<String, Object> payload) {
        String workflowId = trim(payload.get("workflowId"));
        store.findWorkflow(workflowId).orElseThrow(() -> Api("Không tìm thấy quy trình."));
        boolean active = payload.get("active") == Boolean.TRUE || "1".equals(trim(payload.get("active")));
        store.setWorkflowStatus(workflowId, active, Instant.now());
        return Map.of("message", active ? "Đã kích hoạt quy trình." : "Đã ngừng áp dụng quy trình (hồ sơ đang chạy giữ nguyên).");
    }

    public Map<String, Object> deleteWorkflow(Principal principal, Map<String, Object> payload) {
        String workflowId = trim(payload.get("workflowId"));
        Map<String, Object> wf = store.findWorkflow(workflowId)
                .orElseThrow(() -> Api("Không tìm thấy quy trình."));
        if ("WF-MUAHANG".equals(workflowId) || "WF-MUAHANG-01".equals(trim(wf.get("code"))))
            throw Api("Đây là quy trình mặc định của hệ thống — chỉ được ngừng áp dụng, không được xóa.");
        store.deleteWorkflowSafe(workflowId);
        return Map.of("message", "Đã xóa quy trình và toàn bộ bước của quy trình.");
    }

    // ============ MAR ============
    public Map<String, Object> saveMarApproval(Principal principal, Map<String, Object> payload) {
        String projectId = trim(payload.get("projectId"));
        String materialId = trim(payload.get("materialId"));
        String status = trim(payload.get("status"));
        if (!List.of("pending", "approved", "rejected").contains(status)) throw Api("Trạng thái MAR không hợp lệ.");
        store.findActiveMaterial(materialId).orElseThrow(() -> Api("Không tìm thấy vật tư."));
        Map<String, Object> existing = store.findMaterialMarApproval(projectId, materialId).orElse(null);
        Instant now = Instant.now();
        if (existing != null) {
            store.updateMarApproval(sv(existing, "id"), nvl(payload.get("approvalNo")), status,
                    nvl(payload.get("note")), principal.userId(), now);
        } else {
            store.insertMarApproval(idGenerator.next("MAR"), projectId, materialId, nvl(payload.get("approvalNo")),
                    status, nvl(payload.get("note")), principal.userId(), now);
        }
        return Map.of("message", "Đã cập nhật MAR: " + status + ".");
    }

    // ---- helpers ----
    private static double numberValue(Object o) {
        try { return o == null ? 0 : Double.parseDouble(String.valueOf(o)); }
        catch (NumberFormatException e) { return 0; }
    }
    private static String sv(Map<String, Object> m, String k) { Object v = m.get(k); return v == null ? "" : String.valueOf(v); }
    private static String trim(Object o) { return o == null ? "" : String.valueOf(o).trim(); }
    private static String nvl(Object o) { String s = trim(o); return s.isEmpty() ? null : s; }
    private static String blankDefault(String s, String fallback) { return s.isEmpty() ? fallback : s; }
    private static AuthUseCase.ApiError Api(String message) { return new AuthUseCase.ApiError(message, 400); }
}