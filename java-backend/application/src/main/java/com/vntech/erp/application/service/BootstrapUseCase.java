package com.vntech.erp.application.service;

import com.vntech.erp.application.port.out.BootstrapDataPort;
import com.vntech.erp.application.port.out.ProjectRepository;
import com.vntech.erp.application.port.out.ProjectScopeStore;

import java.util.List;
import java.util.Map;

/**
 * Use-case bootstrap: tính context (admin / scope user) rồi gọi BootstrapDataPort.
 * Port nguyên trạng đoạn đầu bootstrap(user) của monolith JS:
 *   - admin: visible = toàn bộ project active
 *   - user thường: visible = theo user_project_scopes
 * Trả về `data` khối GET /api/system — shape JSON khớp 100% SPA.
 */
public final class BootstrapUseCase {

    private final ProjectRepository projectRepository;
    private final ProjectScopeStore projectScopeStore;
    private final BootstrapDataPort bootstrapDataPort;

    public BootstrapUseCase(ProjectRepository projectRepository, ProjectScopeStore projectScopeStore,
                            BootstrapDataPort bootstrapDataPort) {
        this.projectRepository = projectRepository;
        this.projectScopeStore = projectScopeStore;
        this.bootstrapDataPort = bootstrapDataPort;
    }

    public Map<String, Object> load(String userId, boolean admin, String roleCode, String roleBase,
                                    String warehouseScopeKind) {
        List<String> allProjectIds = projectRepository.findActiveOrderByCode().stream()
                .map(p -> p.id())
                .toList();
        List<String> visibleProjectIds;
        if (admin) {
            visibleProjectIds = allProjectIds;
        } else {
            visibleProjectIds = projectScopeStore.findProjectIdsByUserId(userId);
            // chỉ giữ những project còn active (giống JS: filter theo allowed set)
            visibleProjectIds = visibleProjectIds.stream()
                    .filter(allProjectIds::contains)
                    .toList();
        }
        // TASK-050: mang thêm roleCode/roleBase + warehouseScopeKind xuống adapter vì bộ lọc quyền của
        // JS (system-route.mjs:622, :684, :728-737) phụ thuộc vai trò kho + vai trò Ban giám đốc,
        // không chỉ projectIds.
        BootstrapDataPort.Context ctx = new BootstrapDataPort.Context(userId, admin,
                roleCode, roleBase, warehouseScopeKind, visibleProjectIds, allProjectIds);
        Map<String, Object> data = bootstrapDataPort.load(ctx);
        data.put("setup", false);
        return data;
    }
}