package com.vntech.erp.application.service;

import com.vntech.erp.application.port.out.IdGenerator;
import com.vntech.erp.application.port.out.OpsTaskStore;
import com.vntech.erp.application.rbac.AccessScopeService;
import com.vntech.erp.application.rbac.RbacService;

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
    private final RbacService rbac;
    private final AccessScopeService accessScope;
    private final NotificationManagementUseCase notifications;
    /** MT2-P4-01/P5-03/P5-04 (§3.2) — phạm vi xem/giao công việc theo CẤP BẬC (SELF/DEPARTMENT/COMPANY). */
    private final com.vntech.erp.application.rbac.WorkScopeService workScope;

    public OpsTaskManagementUseCase(OpsTaskStore store, IdGenerator idGenerator, RbacService rbac,
                                    AccessScopeService accessScope,
                                    NotificationManagementUseCase notifications,
                                    com.vntech.erp.application.rbac.WorkScopeService workScope) {
        this.store = store;
        this.idGenerator = idGenerator;
        this.rbac = rbac;
        this.accessScope = accessScope;
        this.notifications = notifications;
        this.workScope = workScope;
    }

    // ══════════════════════════════════════════════════════════════════════════════════════════════════
    // MT2-P4-01 / P5-03 (§3.2 · đề án ①A user chốt 26/09/2026) — ĐỌC PHẠM VI XEM/GIAO THEO CẤP BẬC
    // §3.2:41 «Trưởng phòng trở lên → xem công việc của nhân viên thuộc phòng ban mình …»
    // §3.2:42 «Phó giám đốc trở lên → xem công việc toàn bộ phòng ban · toàn bộ nhân viên công ty ·
    //           giao việc toàn công ty theo quyền»
    // ⇒ Trả payload cho UI P5-03 hiển thị «quyền xem/giao theo cấp» — ⛔ CHỈ ĐỌC, ⛔ không mở quyền mới:
    //    nguồn duy nhất là WorkScopeService (ngưỡng 30/35 ĐO từ `system_level_catalog`).
    // ══════════════════════════════════════════════════════════════════════════════════════════════════
    public Map<String, Object> workScope(Principal principal) {
        AuthUseCase.CurrentUser cu = principalAsCurrent(principal);
        com.vntech.erp.application.rbac.WorkScopeService.Scope scope =
                workScope.scopeOf(cu.id(), cu.role());
        Map<String, Object> out = new LinkedHashMap<>(scope.toMap());
        out.put("userId", cu.id());
        out.put("role", cu.role());
        out.put("levelRankTruongPhong", com.vntech.erp.application.rbac.WorkScopeService.TRUONG_PHONG_MIN_RANK);
        out.put("levelRankPhoGiamDoc", com.vntech.erp.application.rbac.WorkScopeService.PHO_GIAM_DOC_MIN_RANK);
        return out;
    }

    /**
     * MT2-P4-01/P5-04 (§3.2) — <b>được giao việc cho phòng `departmentCode` hay không</b>.
     *
     * <p>Giữ NGUYÊN luật cũ ({@code userIsDepartmentManager}) và <b>chỉ THÊM</b> tầng MT2 §3.2:42
     * «Phó giám đốc trở lên → giao việc <b>toàn công ty</b> theo quyền». ⛔ KHÔNG nới cho tầng thấp hơn,
     * ⛔ KHÔNG bỏ kiểm tra quyền module ở tầng controller/RBAC.
     */
    private boolean canAssignToDepartment(AuthUseCase.CurrentUser cu, String departmentCode) {
        if (store.userIsDepartmentManager(cu.id(), departmentCode)) return true;
        com.vntech.erp.application.rbac.WorkScopeService.Scope scope =
                workScope.scopeOf(cu.id(), cu.role());
        return scope.kind() == com.vntech.erp.application.rbac.WorkScopeService.Kind.COMPANY
                && workScope.canAssignDepartment(scope, departmentCode);
    }

    // ══════════════════════════════════════════════════════════════════════════════════════════════════
    // MT2-P4-03 (§4.1) — CARD «CHỜ GIÁM ĐỐC DUYỆT»
    // §4.1:52 «➕ **Phải có card “Chờ Giám đốc duyệt”** — lấy dữ liệu **THỰC** từ workflow/approval engine.»
    // §4.1:51 «… Kiểm permission/RBAC **ở backend**.» ⇒ quyền = **admin** HOẶC **≥ trưởng phòng** (rank ≥ 30)
    //   (30 = `system_level_catalog.truong_phong` — ĐO từ CSDL ✔, ⛔ không bịa ✗)
    // ⛔ CHỈ ĐỌC — ⛔ KHÔNG đụng luồng duyệt (`decideApproval`) ✗ (GOAL §20 WORKFLOW SAFETY ✔)
    // ══════════════════════════════════════════════════════════════════════════════════════════════════

    /** Mã quyền của bước «Giám đốc» — ĐO từ `approval_stage_catalog` bước 5 = `director,tgd,giam_doc` ✔ */
    public static final List<String> DIRECTOR_ROLE_CODES = List.of("director", "tgd", "giam_doc");
    /** Ngưỡng «≥ trưởng phòng» — `system_level_catalog.level_rank` của `truong_phong` (ĐO ✔). */
    public static final int DIRECTOR_MIN_RANK = 30;

    /**
     * Card «Chờ Giám đốc duyệt» — **dữ liệu THỰC** từ approval engine (§4.1).
     * ⚠️ Lọc theo **`allowed_role_codes_snapshot`** (⛔ **KHÔNG** lọc `stage_no` ✗ — bước 5 có 2 snapshot ✗).
     *
     * @throws AuthUseCase.ApiError 403 nếu **không** phải admin và **không** đủ cấp (⛔ mặc định TỪ CHỐI ✗)
     */
    public Map<String, Object> directorPendingApprovals(Principal principal) {
        AuthUseCase.CurrentUser cu = principalAsCurrent(principal);
        Integer rank = store.userLevelRank(cu.id());
        boolean duQuyen = rbac.isAdmin(cu) || (rank != null && rank >= DIRECTOR_MIN_RANK);
        if (!duQuyen) {
            throw new AuthUseCase.ApiError(
                    "Tài khoản chưa đủ quyền xem vùng phê duyệt (cần quản trị hệ thống hoặc từ Trưởng phòng trở lên).",
                    403);
        }
        List<Map<String, Object>> rows = store.pendingApprovalsForRoleCodes(DIRECTOR_ROLE_CODES);
        Map<String, Object> result = new java.util.LinkedHashMap<>();
        result.put("approvals", rows);
        result.put("total", rows.size());
        return result;
    }

    /** Dựng CurrentUser cho tầng RBAC — roleBase là mã ENGINE do controller truyền xuống. */
    // ---- notification side effects ----
    private void notifySafely(String eventKey) {
        try {
            notifications.dispatch(eventKey);
        } catch (RuntimeException ignored) {
            // Task state and history remain authoritative if user notification configuration is absent/invalid.
        }
    }

    private AuthUseCase.CurrentUser principalAsCurrent(Principal p) {
        return new AuthUseCase.CurrentUser(p.userId(), "", p.fullName(), p.email(), p.role(),
                p.roleBase(), p.role(), null, null, null, false);
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

    // ============ work items ============
    public Map<String, Object> createWorkItem(Principal principal, Map<String, Object> payload) {
        String department = trim(payload.get("departmentCode")).toUpperCase(Locale.ROOT);
        if (!List.of("KH", "DA").contains(department)) throw Api("Phòng ban không hợp lệ.");
        if (!store.userIsDepartmentManager(principal.userId(), department))
            throw Api("Chỉ Trưởng phòng hoặc Quản trị viên được giao việc thủ công.");
        if (!trim(payload.get("sourceId")).isEmpty() || !trim(payload.get("sourceType")).isEmpty()
                || !trim(payload.get("sourceModule")).isEmpty())
            throw Api("Giao việc thủ công chỉ dùng cho công việc không có nghiệp vụ nguồn. Task từ ERP phải được hệ thống tự sinh.");
        // JS 1153: CHỈ kiểm khi projectId KHÁC RỖNG — công việc phòng ban không gắn dự án vẫn hợp lệ.
        String scopeProjectId = trim(payload.get("projectId"));
        if (!scopeProjectId.isEmpty()
                && !accessScope.canAccessProject(principal.userId(), principal.role(), scopeProjectId, true)) {
            throw Api("Không có quyền tại dự án.");
        }
        String title = trim(payload.get("title"));
        if (title.isEmpty()) throw Api("Cần nhập nội dung công việc.");
        String projectId = nvl(payload.get("projectId"));
        // TASK-080C — PORT nhánh chọn người nhận của JS `system-route.mjs:270`:
        //   assignedTo ? userCanReceiveDepartmentTask(...) : defaultDepartmentAssignee(...)
        //   → không có người hợp lệ thì BÁO LỖI (JS: "Chưa có nhân sự … phù hợp/phạm vi dự án để giao việc.").
        // Trước đây Java không kiểm gì: ghi thẳng `assignedTo` (kể cả rỗng) ⇒ công việc không có người nhận,
        // hoặc giao cho người NGOÀI phòng/ngoài phạm vi dự án.
        // ⚠️ Dùng `trim(...)` KHÔNG dùng `nvl(...)`: trong lớp này `nvl` trả về **null** khi rỗng
        // (khai báo dòng 628: `String s = trim(o); return s.isEmpty() ? null : s;`) — gọi `.isEmpty()`
        // trên kết quả `nvl` sẽ nổ NullPointerException (đúng lỗi HTTP 500 đã gặp khi chạy thử 18/09).
        String assignee = trim(payload.get("assignedTo"));
        if (!assignee.isEmpty()) {
            if (!store.userCanReceiveDepartmentTask(assignee, department, projectId)) assignee = "";
        } else {
            assignee = trim(store.defaultDepartmentAssignee(department, projectId));
        }
        if (assignee.isEmpty()) {
            throw Api("Chưa có nhân sự " + ("KH".equals(department) ? "Phòng Kế hoạch" : "Phòng Dự án")
                    + " phù hợp/phạm vi dự án để giao việc.");
        }
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
        task.put("assignedTo", assignee);
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
        // TASK-080C (KP #78) — PORT HAI BƯỚC CÒN THIẾU của JS `createDepartmentTask` (`system-route.mjs:273-277`):
        //   (1) ghi 1 sự kiện `ASSIGNED` vào `work_item_events` (JS `:275`);
        //   (2) `queueTaskNotice` ⇒ `task_notifications` + (nếu người nhận có email) `email_outbox` (JS `:261-267`).
        // Trước đây Java thiếu cả hai ⇒ lịch sử việc trống, người nhận không được thông báo, hàng đợi email
        // rỗng — trong khi chính thông điệp trả về vẫn hứa "đã tạo thông báo cho nhân viên" (câu nói SAI sự thật).
        store.insertWorkItemEvent(idGenerator.next("EVT"), sv(task, "id"), "ASSIGNED", null, "NEW",
                principal.userId(), null, assignee, null, null, now);
        queueTaskNotice(task, assignee, principal, now);
        return Map.of("message", "Đã giao " + taskNo + ". SLA/KPI tính ngay từ assigned_at và đã tạo thông báo cho nhân viên.");
    }

    /**
     * PORT `queueTaskNotice` — JS `scripts/system-route.mjs:261-267`.
     *
     * <p>Ghi THÔNG BÁO trong ứng dụng cho người nhận (bảng `task_notifications`, luôn ghi), và nếu người nhận
     * có email thì xếp thêm một thư vào `email_outbox` (`event='task_assigned'`, `status='queued'`).
     * Nội dung giữ nguyên mẫu câu của JS:
     * <ul>
     *   <li>tiêu đề: {@code Công việc mới: <tên việc>}</li>
     *   <li>thân: {@code <mã việc> · <mã - tên dự án | "Không gắn dự án"> · Hạn: <hạn | "Chưa đặt hạn">}</li>
     * </ul>
     *
     * <p><b>Khác JS một điểm có chủ ý:</b> JS dựng liên kết tuyệt đối từ {@code email_settings.base_url},
     * nếu trống thì lấy origin của request. Tầng use-case của Java không có origin, nên khi `base_url` trống
     * liên kết sẽ ở dạng tương đối {@code /?task=<id>} — KHÔNG bịa ra origin.
     */
    private void queueTaskNotice(Map<String, Object> task, String assigneeId, Principal actor, Instant now) {
        Map<String, Object> contact = store.findUserContact(assigneeId).orElse(null);
        if (contact == null) return;
        String projectId = sv(task, "projectId");
        Map<String, Object> project = projectId.isEmpty() ? null : store.findActiveProject(projectId).orElse(null);
        String projectText = project == null ? "Không gắn dự án"
                : sv(project, "code") + " - " + sv(project, "name");
        String dueText = humanDue(sv(task, "dueAt"));
        String taskNo = sv(task, "taskNo");
        String taskTitle = sv(task, "title");

        Map<String, Object> notice = new LinkedHashMap<>();
        notice.put("id", idGenerator.next("NTF"));
        notice.put("workItemId", sv(task, "id"));
        notice.put("userId", assigneeId);
        notice.put("channel", "in_app");
        notice.put("title", "Công việc mới: " + taskTitle);
        notice.put("body", taskNo + " · " + projectText + " · Hạn: " + dueText);
        store.insertTaskNotification(notice, now);

        String email = sv(contact, "email");
        if (email.isEmpty()) return;
        String base = trim(store.emailBaseUrl()).replaceAll("/+$", "");
        String link = base + "/?task=" + sv(task, "id");
        String textBody = "Bạn được giao công việc mới.\n"
                + "Mã: " + taskNo + "\n"
                + "Công việc: " + taskTitle + "\n"
                + "Dự án: " + projectText + "\n"
                + "Người giao: " + sv(contact, "fullName") + "\n"
                + "Thời điểm giao: " + now + "\n"
                + "Hạn hoàn thành: " + dueText + "\n"
                + "Ưu tiên: " + sv(task, "priority") + "\n"
                + "Mở nhiệm vụ: " + link;
        String htmlBody = "<div style=\"font-family:Arial,sans-serif;max-width:680px;color:#173f58\">"
                + "<h2>" + html(taskTitle) + "</h2><p><b>" + html(taskNo) + "</b></p>"
                + "<p>Dự án: " + html(projectText) + "</p>"
                + "<p>Người giao: " + html(actor.fullName()) + " · Hạn: <b>" + html(dueText) + "</b></p>"
                + "<p><a href=\"" + html(link) + "\" style=\"background:#0b78be;color:white;text-decoration:none;"
                + "padding:10px 16px;border-radius:6px\">Mở nhiệm vụ</a></p></div>";
        Map<String, Object> mail = new LinkedHashMap<>();
        mail.put("id", idGenerator.next("MAIL"));
        mail.put("recipients", email);
        mail.put("subject", "[VNTECH ERP] " + taskNo + " - " + taskTitle);
        mail.put("textBody", textBody);
        mail.put("htmlBody", htmlBody);
        store.insertEmailOutbox(mail, now);
    }

    /** Hiển thị hạn theo JS `:263` (giờ Việt Nam); không phân tích được thì trả nguyên văn. */
    private static String humanDue(String dueAt) {
        String raw = trim(dueAt);
        if (raw.isEmpty()) return "Chưa đặt hạn";
        try {
            java.time.LocalDateTime parsed = java.time.LocalDateTime.parse(raw.replace(' ', 'T'));
            return parsed.format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
        } catch (RuntimeException ignored) {
            return raw;
        }
    }

    /** Thoát HTML như helper `html(...)` của JS. */
    private static String html(String value) {
        return trim(value).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
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
        notifySafely("COMPLETED".equals(next) ? "TASK_COMPLETED" : "TASK_STATUS_CHANGED");
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
        notifySafely("TASK_REASSIGNED");
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
        // JS 1484: requireRole(user,["commander","admin"]) — TASK-022 bổ sung.
        rbac.requireRole(principalAsCurrent(principal), List.of("commander", "admin"));
        String projectId = trim(payload.get("projectId"));
        // JS 1487.
        accessScope.requireProjectAccess(principal.userId(), principal.role(), projectId, true,
                "CHT chỉ được tạo tổ đội trong dự án được phân quyền.");
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
    /**
     * Port nguyên trạng JS `save_approval_stage` — scripts/system-route.mjs:2132-2177.
     *
     * <p><b>SỬA LỖI (TASK-041).</b> Bản cũ lệch cả ba tầng:
     * <ol>
     *   <li><b>Hợp đồng payload:</b> đòi {@code code} — nhưng UI ({@code ApprovalStageModal},
     *       {@code app/page.tsx:3832}) <b>không bao giờ gửi</b> trường này (bảng không có cột `code`) ⇒ action
     *       trả HTTP 400 trước khi tới SQL. Bản cũ cũng <b>tự thêm</b> luật `stageNo < 100` không có trong JS.</li>
     *   <li><b>Nghiệp vụ:</b> chỉ ghi {@code name}/{@code stage_no}/{@code allowed_role_codes} ⇒
     *       {@code sla_hours}, {@code approval_mode}, {@code auto_approve_on_submit}, {@code description},
     *       {@code sort_order} bị bỏ im lặng ⇒ <b>admin sửa SLA nhưng SLA không đổi</b>.</li>
     *   <li><b>Quy tắc thiếu:</b> chỉ MỘT bước được tự duyệt (và chỉ bước ĐẦU của luồng); chặn đổi
     *       {@code stage_no} khi bước đã có lịch sử duyệt; đồng bộ tên bước sang hồ sơ đang chờ.</li>
     * </ol>
     */
    public Map<String, Object> saveApprovalStage(Principal principal, Map<String, Object> payload) {
        String stageId = trim(payload.get("stageId"));
        String name = trim(payload.get("name"));
        String description = nvl(payload.get("description"));
        int stageNo = Math.max(1, (int) Math.round(numberValue(payload.get("stageNo"))));
        double rawSort = numberValue(payload.get("sortOrder"));
        int sortOrder = (int) Math.round(rawSort == 0 ? stageNo * 10 : rawSort);
        double rawSla = numberValue(payload.get("slaHours"));
        int slaHours = Math.max(1, (int) Math.round(rawSla == 0 ? 8 : rawSla));

        // JS gộp vai trò từ MẢNG hoặc từ chuỗi phân tách bằng dấu phẩy, khử trùng lặp và bỏ phần rỗng.
        List<String> allowedRoles = new ArrayList<>();
        Object rawRoles = payload.get("allowedRoleCodes");
        List<?> roleItems = rawRoles instanceof List<?> l ? l : List.of(trim(rawRoles).split(","));
        for (Object item : roleItems) {
            String v = trim(item);
            if (!v.isEmpty() && !allowedRoles.contains(v)) allowedRoles.add(v);
        }
        if (name.isEmpty() || allowedRoles.isEmpty())
            throw Api("Bước phê duyệt phải có tên và ít nhất một vai trò được phép duyệt.");
        List<String> validRoles = store.activeRoleCodes();
        for (String roleCode : allowedRoles)
            if (!validRoles.contains(roleCode))
                throw Api("Vai trò " + roleCode + " không tồn tại hoặc đang bị ẩn.");

        String approvalMode = "all_roles".equals(trim(payload.get("approvalMode"))) ? "all_roles" : "single";
        boolean autoApprove = payload.get("autoApproveOnSubmit") == Boolean.TRUE
                || List.of("1", "true", "on").contains(trim(payload.get("autoApproveOnSubmit")).toLowerCase(Locale.ROOT));
        if (autoApprove && store.countActiveStagesBefore(stageId.isEmpty() ? "__NEW__" : stageId, stageNo) > 0)
            throw Api("Tự xác nhận khi gửi phiếu chỉ được đặt cho bước đầu tiên của luồng. "
                    + "Hãy đưa bước này lên đầu hoặc bỏ tùy chọn tự xác nhận.");

        Instant now = Instant.now();
        Map<String, Object> stage = new LinkedHashMap<>();
        stage.put("stageNo", stageNo);
        stage.put("name", name);
        stage.put("description", description);
        stage.put("allowedRoleCodes", String.join(",", allowedRoles));
        stage.put("approvalMode", approvalMode);
        stage.put("slaHours", slaHours);
        stage.put("autoApproveOnSubmit", autoApprove);
        stage.put("sortOrder", sortOrder);

        if (!stageId.isEmpty()) {
            Map<String, Object> before = store.findApprovalStage(stageId)
                    .orElseThrow(() -> Api("Không tìm thấy bước phê duyệt."));
            int beforeNo = (int) Math.round(numberValue(before.get("stage_no")));
            if (beforeNo != stageNo && store.countApprovalsByStageNo(beforeNo) > 0)
                throw Api("Bước đã có lịch sử phê duyệt nên không thể đổi số bước. "
                        + "Có thể đổi tên, vai trò, SLA hoặc thứ tự hiển thị.");
            if (autoApprove) store.clearAutoApproveExcept(stageId, now);
            stage.put("id", stageId);
            store.updateApprovalStage(stage, now);
            store.propagateStageNameToPendingApprovals(stageNo, name, now);
            return Map.of("message", "Đã cập nhật bước phê duyệt " + name + ".");
        }
        if (autoApprove) store.clearAutoApproveAll(now);
        stage.put("id", idGenerator.next("ASTAGE"));
        store.insertApprovalStage(stage, now);
        return Map.of("message", "Đã thêm bước phê duyệt " + name
                + ". Phiếu mới sẽ áp dụng luồng mới; phiếu cũ giữ nguyên luồng đã tạo.");
    }

    /**
     * Port nguyên trạng JS `set_approval_stage_status` — scripts/system-route.mjs:2179-2198.
     *
     * <p><b>SỬA LỖI (TASK-041):</b> bản cũ chỉ {@code UPDATE active=?} — thiếu **cả hai chốt** của JS:
     * (1) không cho tắt bước đang có hồ sơ chờ (tránh kẹt hồ sơ), (2) không cho tắt bước CUỐI CÙNG
     * (nếu tắt hết thì không còn đường duyệt). Hai chốt này chính là hàng rào cho rủi ro "hồ sơ kẹt"
     * đã ghi ở TASK-035.
     */
    public Map<String, Object> setApprovalStageStatus(Principal principal, Map<String, Object> payload) {
        String stageId = trim(payload.get("stageId"));
        boolean active = payload.get("active") == Boolean.TRUE || "1".equals(trim(payload.get("active")));
        Map<String, Object> stage = store.findApprovalStage(stageId)
                .orElseThrow(() -> Api("Không tìm thấy bước phê duyệt."));
        Instant now = Instant.now();
        if (!active && store.countPendingApprovalsForStageNo((int) Math.round(numberValue(stage.get("stage_no")))) > 0)
            throw Api("Bước này đang có hồ sơ chờ xử lý. Hãy xử lý hết hồ sơ hoặc giữ bước hoạt động; "
                    + "phiếu đang chạy không được cắt ngang.");
        store.setApprovalStageStatus(stageId, active, now);
        if (store.countActiveStages() == 0) {
            store.setApprovalStageStatus(stageId, true, Instant.now());
            throw Api("Hệ thống phải có ít nhất một bước phê duyệt đang hoạt động.");
        }
        return Map.of("message", active
                ? "Đã kích hoạt bước phê duyệt cho các phiếu mới."
                : "Đã ẩn bước khỏi luồng của các phiếu mới; lịch sử phiếu cũ vẫn giữ nguyên.");
    }

    /**
     * Port nguyên trạng JS `delete_approval_stage` — scripts/system-route.mjs:2200-2215.
     *
     * <p><b>SỬA LỖI (TASK-041 phần 2):</b> bản cũ chỉ {@code findApprovalStage} + XOÁ, <b>thiếu cả hai chốt</b>
     * của JS ⇒ trên đường Java, quản trị viên có thể:
     * <ul>
     *   <li>xoá một bước <b>đã có lịch sử hồ sơ</b> (bước 1 hiện có 100 bản ghi `approvals`) ⇒ lịch sử duyệt
     *       trỏ vào một bước không còn tồn tại;</li>
     *   <li>xoá <b>bước hoạt động cuối cùng</b> ⇒ luồng duyệt không còn bước nào.</li>
     * </ul>
     * Hai chốt này bổ sung cho hai chốt đã port ở `set_approval_stage_status`.
     */
    public Map<String, Object> deleteApprovalStage(Principal principal, Map<String, Object> payload) {
        String stageId = trim(payload.get("stageId"));
        Map<String, Object> stage = store.findApprovalStage(stageId)
                .orElseThrow(() -> Api("Không tìm thấy bước phê duyệt."));
        if (store.countApprovalsByStageNo((int) Math.round(numberValue(stage.get("stage_no")))) > 0)
            throw Api("Bước đã có lịch sử hồ sơ nên không được xóa. Hãy dùng Ẩn để ngừng áp dụng cho phiếu mới.");
        if (store.countActiveStages() <= 1)
            throw Api("Không thể xóa bước hoạt động cuối cùng.");
        store.deleteApprovalStageSafe(stageId);
        return Map.of("message", "Đã xóa bước phê duyệt chưa từng sử dụng.");
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
        // JS 1253: requireRole(user,["project","procurement","admin"]) — TASK-022 bổ sung.
        rbac.requireRole(principalAsCurrent(principal), List.of("project", "procurement", "admin"));
        String projectId = trim(payload.get("projectId"));
        // JS 1253.
        accessScope.requireProjectAccess(principal.userId(), principal.role(), projectId, true,
                "Không có quyền tại dự án này.");
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