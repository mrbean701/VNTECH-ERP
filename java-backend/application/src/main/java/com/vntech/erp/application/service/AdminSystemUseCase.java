package com.vntech.erp.application.service;

import com.vntech.erp.application.port.out.AdminSystemStore;
import com.vntech.erp.application.port.out.IdGenerator;
import com.vntech.erp.application.rbac.AccessScopeService;
import com.vntech.erp.application.rbac.RbacService;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;

/**
 * Use-case cấu hình hệ thống admin — port nguyên trạng:
 * org units (save/set_status/member), menu groups (save/set_status/delete),
 * module catalog (save/set_status), form field config (save/delete) của monolith JS.
 */
public final class AdminSystemUseCase {

    private static final Pattern CODE = Pattern.compile("^[A-Z0-9._-]{2,24}$");
    private static final Pattern LOWERCASE_CODE = Pattern.compile("^[a-z0-9_-]{2,40}$");
    private static final Pattern FIELD_KEY = Pattern.compile("^[A-Za-z][A-Za-z0-9_]*$");
    private static final List<String> FORM_KEYS = List.of("boq", "boq_purchase", "request_header", "request_line");
    private static final List<String> DATA_TYPES = List.of("text", "textarea", "number", "date", "select",
            "checkbox", "money", "percent");

    private final AdminSystemStore store;
    private final IdGenerator idGenerator;
    private final RbacService rbac;
    private final AccessScopeService accessScope;
    private final UserManagementUseCase userManagement;

    public AdminSystemUseCase(AdminSystemStore store, IdGenerator idGenerator, RbacService rbac,
                              UserManagementUseCase userManagement, AccessScopeService accessScope) {
        this.store = store;
        this.idGenerator = idGenerator;
        this.rbac = rbac;
        this.accessScope = accessScope;
        this.userManagement = userManagement;
    }

    public interface Principal {
        String userId();
        String role();

        /** Loại phạm vi kho (site | central); rỗng ⇒ coi như "site". */
        default String warehouseScopeKind() { return ""; }
    }

    // ================= organization_units =================
    public String saveOrganizationUnit(Principal principal, Map<String, Object> payload) {
        rbac.requireRole(principalAsCurrent(principal), List.of("admin"));
        String orgId = trim(payload.get("organizationUnitId"));
        String code = trim(payload.get("code")).toUpperCase();
        String name = trim(payload.get("name"));
        String unitType = trim(payload.get("unitType")).toLowerCase();
        String parentId = nvl(payload.get("parentId"));
        String projectId = nvl(payload.get("projectId"));
        String description = nvl(payload.get("description"));
        String effectiveFrom = nvl(payload.get("effectiveFrom"));
        String effectiveTo = nvl(payload.get("effectiveTo"));
        int sortOrder = (int) Math.floor(optNumber(payload.get("sortOrder"), 100));
        if (!CODE.matcher(code).matches())
            throw Api("Mã đơn vị gồm 2–24 ký tự A-Z, số, dấu chấm, gạch dưới hoặc gạch ngang.");
        if (name.isEmpty()) throw Api("Tên đơn vị là bắt buộc.");
        if (!List.of("company", "department", "site_command").contains(unitType))
            throw Api("Loại đơn vị tổ chức không hợp lệ.");
        if (effectiveFrom != null && !effectiveFrom.matches("\\d{4}-\\d{2}-\\d{2}"))
            throw Api("Ngày hiệu lực từ phải theo định dạng DD/MM/YYYY.");
        if (effectiveTo != null && !effectiveTo.matches("\\d{4}-\\d{2}-\\d{2}"))
            throw Api("Ngày hiệu lực đến phải theo định dạng DD/MM/YYYY.");
        if (effectiveFrom != null && effectiveTo != null && effectiveTo.compareTo(effectiveFrom) < 0)
            throw Api("Ngày hiệu lực đến không được trước ngày hiệu lực từ.");
        if ("site_command".equals(unitType) && !"BCH".equals(code) && projectId == null)
            throw Api("BCH dự án phải gắn với một dự án cụ thể.");
        if (parentId != null) {
            if (parentId.equals(orgId)) throw Api("Đơn vị không thể là cấp trên của chính nó.");
            if (store.findOrgByCodeOrName(parentId).isEmpty()) throw Api("Đơn vị cấp trên không tồn tại hoặc đã bị ẩn.");
            if (!orgId.isEmpty() && store.isDescendant(orgId, parentId))
                throw Api("Không thể chọn một đơn vị cấp dưới làm cấp trên.");
        }
        if (store.organizationUnitCodeExists(code, orgId)) throw Api("Mã đơn vị " + code + " đã tồn tại.");
        if (store.organizationUnitNameExists(name, orgId)) throw Api("Tên đơn vị \u201c" + name + "\u201d đã tồn tại.");
        Instant now = Instant.now();
        if (!orgId.isEmpty()) {
            Map<String, Object> before = store.findOrganizationUnitFull(orgId)
                    .orElseThrow(() -> Api("Không tìm thấy đơn vị tổ chức."));
            boolean locked = isOne(before.get("system_locked"));
            if (locked && (!code.equals(sv(before, "code")) || !unitType.equals(sv(before, "unit_type"))))
                throw Api("Đơn vị gốc được phép đổi tên/mô tả nhưng không được đổi mã hoặc loại.");
            store.updateOrganizationUnit(orgId, code, name, unitType, parentId, projectId, description,
                    effectiveFrom, effectiveTo, sortOrder, now);
            store.syncUserDepartmentsByOrg(orgId, name, now);
            return "Đã cập nhật đơn vị " + code + " · " + name + "; tên hiển thị của nhân sự liên kết đã đồng bộ.";
        }
        store.insertOrganizationUnit(idGenerator.next("ORG"), code, name, unitType, parentId, projectId,
                description, effectiveFrom, effectiveTo, sortOrder, false, now);
        return "Đã thêm đơn vị " + code + " · " + name + ".";
    }

    public String setOrganizationUnitStatus(Principal principal, Map<String, Object> payload) {
        rbac.requireRole(principalAsCurrent(principal), List.of("admin"));
        String orgId = trim(payload.get("organizationUnitId"));
        boolean active = toBool(payload.get("active"));
        Map<String, Object> before = store.findOrganizationUnitFull(orgId)
                .orElseThrow(() -> Api("Không tìm thấy đơn vị tổ chức."));
        if (!active && isOne(before.get("system_locked")))
            throw Api("Đơn vị tổ chức gốc không được ngừng hoạt động.");
        if (!active) {
            if (store.countActiveUsersByOrg(orgId) > 0)
                throw Api("Đơn vị còn nhân sự hoạt động. Hãy chuyển nhân sự sang đơn vị khác trước khi lưu trữ.");
            if (store.countActiveChildrenByOrg(orgId) > 0)
                throw Api("Đơn vị còn cấp dưới hoạt động. Hãy chuyển hoặc lưu trữ cấp dưới trước.");
        }
        store.setOrganizationUnitActive(orgId, active, Instant.now());
        return active ? "Đã kích hoạt đơn vị tổ chức."
                : "Đã lưu trữ đơn vị; dữ liệu lịch sử vẫn được giữ nguyên.";
    }

    public String setOrganizationUnitMember(Principal principal, Map<String, Object> payload) {
        // Không requireRole admin — admin hoặc người có quyền dự án (JS kiểm tra canAccessProject)
        String userId = trim(payload.get("userId"));
        String orgId = nvl(payload.get("organizationUnitId"));
        Map<String, Object> target = store.findUserOrgMembership(userId)
                .orElseThrow(() -> Api("Không tìm thấy nhân sự."));
        Map<String, Object> unit = null;
        if (orgId != null) {
            unit = store.findSiteCommandUnit(orgId)
                    .orElseThrow(() -> Api("Đơn vị phải là Ban chỉ huy dự án (site_command)."));
            if (!isOne(unit.get("active")) || unit.get("archived_at") != null)
                throw Api("Ban chỉ huy không còn hoạt động.");
        }
        if (!rbac.isAdmin(principalAsCurrent(principal))) {
            throw Api("Tài khoản không có quyền quản lý Ban chỉ huy dự án này.");
        }
        Instant now = Instant.now();
        String fullName = sv(target, "fullName");
        if (orgId != null) {
            if (orgId.equals(sv(target, "organizationUnitId")))
                throw Api(fullName + " đã thuộc Ban chỉ huy này.");
            store.assignUserToUnit(userId, orgId, sv(unit, "name"), now);
        } else {
            if (sv(target, "organizationUnitId").isEmpty())
                throw Api(fullName + " không thuộc Ban chỉ huy nào để gỡ.");
            store.unassignUserFromUnit(userId, now);
        }
        userManagement.rebuildDepartmentDefaults(userId);
        return orgId != null ? "Đã thêm " + fullName + " vào Ban chỉ huy."
                : "Đã gỡ " + fullName + " khỏi Ban chỉ huy.";
    }

    // ================= menu_group_catalog =================
    public String saveMenuGroup(Principal principal, Map<String, Object> payload) {
        rbac.requireRole(principalAsCurrent(principal), List.of("admin"));
        String groupId = trim(payload.get("groupId"));
        String name = trim(payload.get("name"));
        String icon = trim(payload.get("icon"));
        String iconCode = (icon.length() > 4 ? icon.substring(0, 4) : icon).toUpperCase();
        if (iconCode.isEmpty()) iconCode = "\u25a6";
        int sortOrder = (int) Math.floor(optNumber(payload.get("sortOrder"), 0));
        boolean collapsible = toBool(payload.get("collapsible"));
        if (name.isEmpty()) throw Api("Tên nhóm menu là bắt buộc.");
        Instant now = Instant.now();
        if (!groupId.isEmpty()) {
            Map<String, Object> before = store.findMenuGroup(groupId)
                    .orElseThrow(() -> Api("Không tìm thấy nhóm menu."));
            store.updateMenuGroup(groupId, name, iconCode, collapsible, sortOrder, now);
            store.syncModuleGroupName(sv(before, "groupKey"), name, now);
            return "Đã cập nhật nhóm " + name + ".";
        }
        String groupKey = trim(payload.get("groupKey")).toLowerCase();
        if (!LOWERCASE_CODE.matcher(groupKey).matches())
            throw Api("Mã nhóm gồm 2–40 ký tự a-z, số, gạch dưới hoặc gạch ngang.");
        if (store.menuGroupKeyExists(groupKey)) throw Api("Mã nhóm menu đã tồn tại.");
        store.insertMenuGroup(idGenerator.next("MGR"), groupKey, name, iconCode, collapsible, sortOrder, now);
        return "Đã thêm nhóm menu " + name + ".";
    }

    public String setMenuGroupStatus(Principal principal, Map<String, Object> payload) {
        rbac.requireRole(principalAsCurrent(principal), List.of("admin"));
        String groupId = trim(payload.get("groupId"));
        boolean active = toBool(payload.get("active"));
        Map<String, Object> before = store.findMenuGroup(groupId)
                .orElseThrow(() -> Api("Không tìm thấy nhóm menu."));
        if (!active && store.findAdminModuleInGroup(sv(before, "groupKey")).isPresent())
            throw Api("Không thể ẩn nhóm đang chứa Quản trị hệ thống. Hãy chuyển mục quản trị sang một nhóm đang hoạt động trước.");
        store.setMenuGroupActive(groupId, active, Instant.now());
        return active ? "Đã hiện nhóm menu."
                : "Đã ẩn nhóm menu và các mục con khỏi thanh điều hướng.";
    }

    public String deleteMenuGroup(Principal principal, Map<String, Object> payload) {
        rbac.requireRole(principalAsCurrent(principal), List.of("admin"));
        String groupId = trim(payload.get("groupId"));
        Map<String, Object> before = store.findMenuGroup(groupId)
                .orElseThrow(() -> Api("Không tìm thấy nhóm menu."));
        if (isOne(before.get("system_locked")))
            throw Api("Nhóm hệ thống không được xóa. Có thể đổi tên, sắp xếp hoặc ẩn nếu không chứa mục quản trị.");
        if (store.countModulesInGroup(sv(before, "groupKey")) > 0)
            throw Api("Nhóm còn chức năng bên trong. Hãy chuyển các mục sang nhóm khác trước khi xóa.");
        store.deleteMenuGroup(groupId);
        return "Đã xóa nhóm " + sv(before, "name") + ".";
    }

    // ================= module_catalog =================
    public String saveModuleCatalog(Principal principal, Map<String, Object> payload) {
        rbac.requireRole(principalAsCurrent(principal), List.of("admin"));
        String moduleKey = trim(payload.get("moduleKey"));
        Map<String, Object> before = store.findModule(moduleKey)
                .orElseThrow(() -> Api("Mục chức năng không hợp lệ."));
        String label = trim(payload.get("label"));
        String icon = trim(payload.get("icon"));
        String iconCode = (icon.length() > 4 ? icon.substring(0, 4) : icon).toUpperCase();
        String groupKey = trim(payload.get("groupKey"));
        int sortOrder = (int) Math.floor(optNumber(payload.get("sortOrder"), 0));
        if (label.isEmpty() || iconCode.isEmpty()) throw Api("Tên hiển thị và ký hiệu menu là bắt buộc.");
        String groupName = null;
        if (!groupKey.isEmpty()) {
            Map<String, Object> group = store.findMenuGroupByKey(groupKey)
                    .orElseThrow(() -> Api("Nhóm menu đã chọn không tồn tại."));
            groupName = sv(group, "name");
        }
        if ("admin".equals(moduleKey) && groupKey.isEmpty())
            throw Api("Mục Quản trị hệ thống phải được đặt trong một nhóm menu.");
        store.updateModule(moduleKey, label, iconCode, groupName, groupKey.isEmpty() ? null : groupKey,
                sortOrder, Instant.now());
        return "Đã cập nhật mục " + label + ".";
    }

    public String setModuleStatus(Principal principal, Map<String, Object> payload) {
        rbac.requireRole(principalAsCurrent(principal), List.of("admin"));
        String moduleKey = trim(payload.get("moduleKey"));
        boolean active = toBool(payload.get("active"));
        if (store.findModule(moduleKey).isEmpty()) throw Api("Mục chức năng không hợp lệ.");
        if ("admin".equals(moduleKey) && !active)
            throw Api("Không thể ẩn mục Danh mục & phân quyền vì đây là nơi khôi phục cấu hình hệ thống.");
        store.setModuleActive(moduleKey, active, Instant.now());
        return active ? "Đã hiện lại mục chức năng."
                : "Đã ẩn mục chức năng trên thanh điều hướng và với người dùng.";
    }

    // ================= form_field_config =================
    public String saveFormFieldConfig(Principal principal, Map<String, Object> payload) {
        rbac.requireRole(principalAsCurrent(principal), List.of("admin"));
        String formKey = trim(payload.get("formKey"));
        String fieldKey = trim(payload.get("fieldKey"));
        String displayName = trim(payload.get("displayName"));
        String existingId = trim(payload.get("id"));
        if (!FORM_KEYS.contains(formKey)) throw Api("Biểu mẫu cấu hình không hợp lệ.");
        if (!FIELD_KEY.matcher(fieldKey).matches())
            throw Api("Khóa trường chỉ được dùng chữ, số và dấu gạch dưới, bắt đầu bằng chữ.");
        if (displayName.isEmpty()) throw Api("Tên hiển thị của cột/trường không được để trống.");
        Optional<Map<String, Object>> existing = store.findFormField(formKey, fieldKey);
        String dataType = DATA_TYPES.contains(trim(payload.get("dataType"))) ? trim(payload.get("dataType")) : "text";
        String sourceKind = existing.isPresent() ? sv(existing.get(), "sourceKind") : "custom";
        boolean systemLocked = existing.isPresent() && isOne(existing.get().get("system_locked"));
        boolean visible = toBool(payload.get("visible"));
        boolean required = toBool(payload.get("required"));
        boolean importable = toBool(payload.get("importable"));
        boolean exportable = toBool(payload.get("exportable"));
        boolean editableRequested = toBool(payload.get("editable"));
        boolean editable = "system".equals(sourceKind) ? false : editableRequested;
        boolean active = !(payload.get("active") == Boolean.FALSE || "0".equals(trim(payload.get("active"))));
        String optionsJson = null;
        Object opts = payload.get("options");
        if (opts instanceof List<?> list && !list.isEmpty()) {
            optionsJson = list.stream().map(Object::toString).filter(s -> !s.isBlank()).distinct()
                    .collect(java.util.stream.Collectors.toList()).toString();
        } else if (!trim(payload.get("optionsJson")).isEmpty()) {
            List<String> items = java.util.Arrays.stream(trim(payload.get("optionsJson")).split("[;\\n]+"))
                    .map(String::trim).filter(s -> !s.isEmpty()).toList();
            if (!items.isEmpty()) optionsJson = items.toString();
        }
        String configId = existing.isPresent() ? sv(existing.get(), "id")
                : existingId.isEmpty() ? idGenerator.next("FFC") : existingId;
        store.upsertFormField(configId, formKey, fieldKey, displayName, dataType, sourceKind,
                visible, required, importable, exportable, editable,
                (int) Math.floor(optNumber(payload.get("sortOrder"), 0)), optionsJson, systemLocked, active,
                Instant.now());
        return "Đã lưu cấu hình \u201c" + displayName + "\u201d. Mẫu Excel/CSV và giao diện sẽ dùng cấu hình mới.";
    }

    public String deleteFormFieldConfig(Principal principal, Map<String, Object> payload) {
        rbac.requireRole(principalAsCurrent(principal), List.of("admin"));
        String formKey = trim(payload.get("formKey"));
        String fieldKey = trim(payload.get("fieldKey"));
        Map<String, Object> existing = store.findFormField(formKey, fieldKey)
                .orElseThrow(() -> Api("Không tìm thấy trường cấu hình."));
        if (isOne(existing.get("system_locked")))
            throw Api("Đây là trường lõi hệ thống. Có thể đổi tên, ẩn hoặc bỏ bắt buộc nhưng không xóa khỏi cấu trúc dữ liệu.");
        store.disableFormField(formKey, fieldKey, Instant.now());
        return "Đã bỏ trường \u201c" + sv(existing, "displayName") + "\u201d khỏi biểu mẫu. Dữ liệu lịch sử vẫn được giữ.";
    }

    /** save_warehouse_location — upsert vị trí trong kho. */
    public String saveWarehouseLocation(Principal principal, Map<String, Object> payload) {
        String warehouseId = trim(payload.get("warehouseId"));
        String code = trim(payload.get("code")).toUpperCase();
        String name = trim(payload.get("name"));
        String locationType = trim(payload.get("locationType"));
        if (locationType.isEmpty()) locationType = "bin";
        if (warehouseId.isEmpty() || code.isEmpty() || name.isEmpty())
            throw Api("Mã và tên vị trí kho là bắt buộc.");
        if (store.findWarehouse(warehouseId).isEmpty()) throw Api("Kho không còn tồn tại.");
        // JS 1273.
        accessScope.requireWarehouseAccess(principal.userId(), principal.role(),
                principal.warehouseScopeKind(), warehouseId, true,
                "Không có quyền cấu hình vị trí tại kho này.");
        boolean secure = payload.get("secure") == Boolean.TRUE || "1".equals(trim(payload.get("secure")));
        boolean active = !(payload.get("active") == Boolean.FALSE || "0".equals(trim(payload.get("active"))));
        store.upsertWarehouseLocation(warehouseId, code, name, locationType, secure, active, Instant.now());
        return "Đã lưu vị trí " + code + " tại kho.";
    }

    // ================= business_role_engine_catalog =================
    private static final List<String> ALLOWED_ENGINES = List.of("engineer", "commander", "project",
            "procurement", "accountant", "warehouse", "team", "director");

    public String saveEngineRoleProfile(Principal principal, Map<String, Object> payload) {
        rbac.requireRole(principalAsCurrent(principal), List.of("admin"));
        String profileId = trim(payload.get("profileId"));
        String engineKey = trim(payload.get("engineKey"));
        String companyCode = trim(payload.get("companyCode")).toLowerCase();
        String displayName = trim(payload.get("displayName"));
        String description = trim(payload.get("description"));
        int sortOrder = (int) Math.floor(optNumber(payload.get("sortOrder"), 0));
        if (profileId.isEmpty() || !ALLOWED_ENGINES.contains(engineKey))
            throw Api("Không tìm thấy quyền nền cần cập nhật.");
        if (!LOWERCASE_CODE.matcher(companyCode).matches())
            throw Api("Mã quyền nền tại công ty gồm 2–32 ký tự a-z, số, gạch dưới hoặc gạch ngang.");
        if (displayName.isEmpty()) throw Api("Tên quyền nền tại công ty không được để trống.");
        Map<String, Object> before = store.findEngineProfile(profileId, engineKey)
                .orElseThrow(() -> Api("Quyền nền không tồn tại hoặc khóa liên kết không khớp."));
        if (store.engineCompanyCodeExists(companyCode, profileId))
            throw Api("Mã quyền nền tại công ty đã được sử dụng. Hãy nhập mã khác.");
        store.updateEngineProfile(profileId, companyCode, displayName, description, sortOrder, Instant.now());
        return "Đã đổi quyền nền thành " + companyCode + " · " + displayName + ". Các danh sách liên quan đã tự cập nhật.";
    }

    // ================= business_scope_catalog =================
    public String saveBusinessScope(Principal principal, Map<String, Object> payload) {
        rbac.requireRole(principalAsCurrent(principal), List.of("admin"));
        String scopeId = trim(payload.get("scopeId"));
        String code = trim(payload.get("code")).toLowerCase();
        String name = trim(payload.get("name"));
        String description = trim(payload.get("description"));
        int sortOrder = (int) Math.floor(optNumber(payload.get("sortOrder"), 0));
        if (!LOWERCASE_CODE.matcher(code).matches())
            throw Api("Mã phạm vi gồm 2–40 ký tự a-z, số, gạch dưới hoặc gạch ngang.");
        if (name.isEmpty()) throw Api("Tên phạm vi nghiệp vụ là bắt buộc.");
        if (store.businessScopeDuplicate(code, name, scopeId))
            throw Api("Mã hoặc tên phạm vi nghiệp vụ đã tồn tại.");
        Instant now = Instant.now();
        if (!scopeId.isEmpty()) {
            store.findBusinessScope(scopeId).orElseThrow(() -> Api("Không tìm thấy phạm vi nghiệp vụ."));
            store.updateBusinessScope(scopeId, code, name, description, sortOrder, now);
            return "Đã cập nhật phạm vi " + name + ".";
        }
        store.insertBusinessScope(idGenerator.next("BSCOPE"), code, name, description, sortOrder, now);
        return "Đã thêm phạm vi nghiệp vụ " + name + ".";
    }

    public String setBusinessScopeStatus(Principal principal, Map<String, Object> payload) {
        rbac.requireRole(principalAsCurrent(principal), List.of("admin"));
        String scopeId = trim(payload.get("scopeId"));
        boolean active = toBool(payload.get("active"));
        store.findBusinessScope(scopeId).orElseThrow(() -> Api("Không tìm thấy phạm vi nghiệp vụ."));
        if (!active && store.businessScopeInUseByActiveGroup(scopeId))
            throw Api("Phạm vi đang được nhóm quyền hoạt động sử dụng. Hãy chuyển mapping trước khi ẩn.");
        store.setBusinessScopeActive(scopeId, active, Instant.now());
        return active ? "Đã kích hoạt phạm vi nghiệp vụ." : "Đã ẩn phạm vi nghiệp vụ.";
    }

    public String deleteBusinessScope(Principal principal, Map<String, Object> payload) {
        rbac.requireRole(principalAsCurrent(principal), List.of("admin"));
        String scopeId = trim(payload.get("scopeId"));
        Map<String, Object> before = store.findBusinessScope(scopeId)
                .orElseThrow(() -> Api("Không tìm thấy phạm vi nghiệp vụ."));
        if (isOne(before.get("system_locked")))
            throw Api("Phạm vi gốc không được xóa cứng; có thể đổi tên sau khi bỏ bảo vệ ở release riêng hoặc dùng phạm vi tùy chỉnh.");
        if (store.businessScopeInUse(scopeId))
            throw Api("Phạm vi đang được nhóm quyền sử dụng. Hãy gỡ mapping trước khi xóa.");
        store.deleteBusinessScope(scopeId);
        return "Đã xóa phạm vi nghiệp vụ chưa phát sinh liên kết.";
    }

    // ================= business_role_group_catalog =================
    public String saveBusinessRoleGroup(Principal principal, Map<String, Object> payload) {
        rbac.requireRole(principalAsCurrent(principal), List.of("admin"));
        String groupId = trim(payload.get("groupId"));
        String requestedCode = trim(payload.get("code")).toLowerCase();
        String name = trim(payload.get("name"));
        String description = trim(payload.get("description"));
        String engineRole = trim(payload.get("engineRole"));
        int sortOrder = (int) Math.floor(optNumber(payload.get("sortOrder"), 0));
        List<String> scopeIds = distinctScopeIds(payload.get("scopeIds"));
        if (name.isEmpty() || !ALLOWED_ENGINES.contains(engineRole))
            throw Api("Tên hoặc quyền nền của nhóm nghiệp vụ chưa hợp lệ.");
        if (scopeIds.isEmpty()) throw Api("Nhóm quyền phải có ít nhất một Phạm vi nghiệp vụ.");
        for (String scopeId : scopeIds) {
            Map<String, Object> scope = store.findBusinessScope(scopeId).orElse(null);
            if (scope == null || !isOne(scope.get("active")))
                throw Api("Phạm vi nghiệp vụ được chọn không tồn tại hoặc đang bị ẩn.");
        }
        Instant now = Instant.now();
        if (!groupId.isEmpty()) {
            Map<String, Object> before = store.findBusinessRoleGroup(groupId)
                    .orElseThrow(() -> Api("Không tìm thấy nhóm nghiệp vụ."));
            if ("admin".equals(sv(before, "code")))
                throw Api("Không được đổi mã nhóm Quản trị hệ thống.");
            String code = requestedCode.isEmpty() ? sv(before, "code") : requestedCode;
            if (!LOWERCASE_CODE.matcher(code).matches())
                throw Api("Mã nhóm gồm 2–32 ký tự a-z, số, gạch dưới hoặc gạch ngang.");
            if (store.businessRoleGroupCodeExists(code, groupId))
                throw Api("Mã nhóm nghiệp vụ đã được sử dụng. Hãy nhập mã khác.");
            store.updateBusinessRoleGroup(groupId, code, name, description, engineRole, sortOrder, now);
            store.replaceGroupScopes(groupId, scopeIds, scopeIds.isEmpty() ? "" : scopeIds.get(0), now);
            store.syncRolesBaseRoleByGroup(groupId, engineRole, now);
            return "Đã cập nhật " + code + " · " + name + "; phạm vi nghiệp vụ và chức danh liên kết đã đồng bộ.";
        }
        String code = requestedCode;
        if (!LOWERCASE_CODE.matcher(code).matches())
            throw Api("Mã nhóm gồm 2–32 ký tự a-z, số, gạch dưới hoặc gạch ngang.");
        if (store.businessRoleGroupCodeExists(code, ""))
            throw Api("Mã nhóm nghiệp vụ đã được sử dụng. Hãy nhập mã khác.");
        String newId = idGenerator.next("BRG");
        store.insertBusinessRoleGroup(newId, code, name, description, engineRole, sortOrder, now);
        store.replaceGroupScopes(newId, scopeIds, scopeIds.isEmpty() ? "" : scopeIds.get(0), now);
        return "Đã thêm nhóm nghiệp vụ " + name + ".";
    }

    public String setBusinessRoleGroupStatus(Principal principal, Map<String, Object> payload) {
        rbac.requireRole(principalAsCurrent(principal), List.of("admin"));
        String groupId = trim(payload.get("groupId"));
        boolean active = toBool(payload.get("active"));
        Map<String, Object> group = store.findBusinessRoleGroup(groupId)
                .orElseThrow(() -> Api("Không tìm thấy nhóm nghiệp vụ."));
        if ("admin".equals(sv(group, "code")) && !active)
            throw Api("Không được ẩn nhóm Quản trị hệ thống.");
        store.setBusinessRoleGroupActive(groupId, active, Instant.now());
        return active ? "Đã hiện nhóm nghiệp vụ." : "Đã ẩn nhóm nghiệp vụ.";
    }

    public String deleteBusinessRoleGroup(Principal principal, Map<String, Object> payload) {
        rbac.requireRole(principalAsCurrent(principal), List.of("admin"));
        String groupId = trim(payload.get("groupId"));
        Map<String, Object> group = store.findBusinessRoleGroup(groupId)
                .orElseThrow(() -> Api("Không tìm thấy nhóm nghiệp vụ."));
        if (isOne(group.get("system_locked")))
            throw Api("Nhóm nghiệp vụ gốc không được xóa cứng; Quản trị viên có thể đổi tên hoặc ẩn nhóm.");
        if (store.countRolesUsingGroup(groupId) > 0)
            throw Api("Nhóm đang được gán cho vai trò/chức danh. Hãy chuyển các vai trò sang nhóm khác trước khi xóa.");
        store.deleteBusinessRoleGroup(groupId);
        return "Đã xóa nhóm nghiệp vụ tùy chỉnh chưa phát sinh liên kết.";
    }

    // ================= reorder_menu_layout =================
    public String reorderMenuLayout(Principal principal, Map<String, Object> payload) {
        rbac.requireRole(principalAsCurrent(principal), List.of("admin"));
        Instant now = Instant.now();
        java.util.List<?> groups = payload.get("groups") instanceof java.util.List<?> l ? l : java.util.List.of();
        java.util.List<?> modules = payload.get("modules") instanceof java.util.List<?> l ? l : java.util.List.of();
        java.util.Set<String> knownGroups = new java.util.HashSet<>();
        for (Map<String, Object> row : store.listMenuGroups()) knownGroups.add(sv(row, "groupKey"));
        for (Object o : groups) {
            Map<String, Object> row = asMap(o);
            String groupKey = trim(row.get("groupKey"));
            if (knownGroups.contains(groupKey))
                store.updateMenuGroupSort(groupKey, (int) Math.floor(optNumber(row.get("sortOrder"), 0)), now);
        }
        for (Object o : modules) {
            Map<String, Object> row = asMap(o);
            String moduleKey = trim(row.get("moduleKey"));
            String groupKey = trim(row.get("groupKey"));
            if (!store.moduleKeyExists(moduleKey)) continue;
            if (!groupKey.isEmpty() && !knownGroups.contains(groupKey))
                throw Api("Nhóm menu của " + moduleKey + " không hợp lệ.");
            if ("admin".equals(moduleKey) && groupKey.isEmpty())
                throw Api("Mục Quản trị hệ thống phải nằm trong một nhóm để tránh mất đường truy cập quản trị.");
            Map<String, Object> grp = store.findMenuGroupByKeyRow(groupKey);
            String groupName = grp == null ? null : sv(grp, "name");
            store.updateModuleGroupAndSort(moduleKey, groupKey.isEmpty() ? null : groupKey, groupName,
                    (int) Math.floor(optNumber(row.get("sortOrder"), 0)), now);
        }
        return "Đã lưu bố cục menu.";
    }

    // ================= reorder_form_fields =================
    public String reorderFormFields(Principal principal, Map<String, Object> payload) {
        rbac.requireRole(principalAsCurrent(principal), List.of("admin"));
        String formKey = trim(payload.get("formKey"));
        if (!FORM_KEYS.contains(formKey)) throw Api("Biểu mẫu cấu hình không hợp lệ.");
        java.util.List<?> items = payload.get("items") instanceof java.util.List<?> l ? l : java.util.List.of();
        if (items.isEmpty() || items.size() > 200)
            throw Api("Danh sách cột cần có từ 1 đến 200 mục.");
        java.util.Set<String> seen = new java.util.HashSet<>();
        Instant now = Instant.now();
        for (int index = 0; index < items.size(); index++) {
            Map<String, Object> item = asMap(items.get(index));
            String fieldKey = trim(item.get("fieldKey"));
            String displayName = trim(item.get("displayName"));
            if (!FIELD_KEY.matcher(fieldKey).matches() || !seen.add(fieldKey))
                throw Api("Khóa trường bị trống, trùng hoặc không hợp lệ.");
            Map<String, Object> existing = store.findFormField(formKey, fieldKey).orElse(null);
            if (existing == null) continue; // bỏ qua trường đã xóa
            String sourceKind = sv(existing, "sourceKind");
            String dataType = DATA_TYPES.contains(trim(item.get("dataType"))) ? trim(item.get("dataType")) : "text";
            boolean editable = !"system".equals(sourceKind) && toBool(item.get("editable"));
            store.updateFormFieldSortConfig(sv(existing, "id"), displayName, dataType,
                    toBool(item.get("visible")), toBool(item.get("required")), toBool(item.get("importable")),
                    toBool(item.get("exportable")), editable, index + 1, !(item.get("active") == Boolean.FALSE), now);
        }
        return "Đã lưu lại thứ tự và cấu hình các cột của biểu mẫu.";
    }

    private static List<String> distinctScopeIds(Object o) {
        java.util.LinkedHashSet<String> set = new java.util.LinkedHashSet<>();
        if (o instanceof java.util.List<?> l) for (Object x : l) { String s = trim(x); if (!s.isEmpty()) set.add(s); }
        return new java.util.ArrayList<>(set);
    }

    // ---- helpers ----
    private static String trim(Object o) { return o == null ? "" : String.valueOf(o).trim(); }
    private static String nvl(Object o) { String s = trim(o); return s.isEmpty() ? null : s; }
    private static String sv(Map<String, Object> m, String k) { Object v = m.get(k); return v == null ? "" : String.valueOf(v); }
    private static boolean isOne(Object o) { return o instanceof Number n ? n.intValue() == 1 : Boolean.TRUE.equals(o); }
    private static boolean toBool(Object o) {
        if (o == null) return false;
        if (o instanceof Boolean b) return b;
        return List.of("1", "true", "on").contains(String.valueOf(o).trim().toLowerCase());
    }
    private static double optNumber(Object o, double fallback) {
        try { return o == null ? fallback : Double.parseDouble(String.valueOf(o)); }
        catch (NumberFormatException e) { return fallback; }
    }
    @SuppressWarnings("unchecked")
    private static Map<String, Object> asMap(Object o) { return o instanceof Map ? (Map<String, Object>) o : Map.of(); }
    private static AuthUseCase.ApiError Api(String message) { return new AuthUseCase.ApiError(message, 400); }

    private AuthUseCase.CurrentUser principalAsCurrent(Principal p) {
        return new AuthUseCase.CurrentUser(p.userId(), "", "", null, p.role(), p.role(), p.role(),
                p.warehouseScopeKind(), null, null, false);
    }
}