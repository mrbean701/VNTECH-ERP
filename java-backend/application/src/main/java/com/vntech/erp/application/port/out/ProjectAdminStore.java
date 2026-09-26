package com.vntech.erp.application.port.out;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * Port ghi/quản trị dự án (admin) — infrastructure implement bằng JdbcTemplate batch.
 * Port nguyên trạng create_project/update_project/set_project_status của monolith JS.
 */
public interface ProjectAdminStore {

    /**
     * INSERT projects (+ tuỳ cờ) warehouses (site) + user_project_scopes trong **1 transaction**.
     *
     * <p><b>SỬA LỖI MT2-P14-03c (23/09/2026) — Java BỎ QUA cờ `createWarehouse` của UI:</b>
     * UI `app/page.tsx:2709-2742` đã hỏi «Tạo kho dự án?» và gửi {@code createWarehouse: false} khi chọn «Không»,
     * JS `scripts/system-route.mjs` (nhánh `create_project`) đọc cờ và chỉ chèn kho khi
     * {@code createWarehouse !== false} — nhưng bản Java **luôn** chèn kho ⇒ người dùng chọn «Không tạo kho»
     * vẫn bị sinh kho công trường (lệch hành vi + sai dữ liệu, MT2 §5.2/§16/§19).
     *
     * @param createWarehouse false = ⛔ KHÔNG chèn kho (⛔ KHÔNG tạo action/API kho mới); mặc định true
     */
    void insertProjectWithWarehouse(String projectId, String warehouseId, String code, String name,
                                    String managerUserId, String startDate, String plannedEndDate,
                                    String contractNo, String contractName,
                                    String warehouseCode, String warehouseName, String scopeId,
                                    String userId, boolean createWarehouse, Instant now);

    void updateProject(String projectId, String code, String name, String contractNo, String contractName,
                       String startDate, String plannedEndDate, Instant now);

    /** Cập nhật hoặc tạo warehouse site của dự án. */
    void upsertSiteWarehouse(String projectId, String warehouseCode, String warehouseName,
                             String keeperUserId, Instant now);

    /** Warehouse site đầu tiên của dự án (create_project dùng cho update). */
    Map<String, Object> firstSiteWarehouse(String projectId);

    /** Count nghiệp vụ đang mở cho close check (tham số theo JS set_project_status). */
    Map<String, Number> closeCheckCounts(String projectId);

    int saveCloseChecks(String projectId, List<Map<String, Object>> checks, String userId, Instant now);

    /** Archive verified gần nhất sau updatedAt. */
    Map<String, Object> latestVerifiedArchive(String projectId, String sinceUpdatedAt);

    void setWarehouseActive(String projectId, String type, boolean active, Instant now);

    void setProjectStatus(String projectId, String status, Instant now);

    /** Dòng projects (đầy đủ cột) để lấy before/after như JS `SELECT * FROM projects WHERE id=?`. */
    Map<String, Object> findProjectById(String projectId);

    /** DELETE/UPDATE cascade toàn bộ dữ liệu dự án (port nguyên trạng delete_project JS) — 1 transaction. */
    Map<String, Object> purgeProject(String projectId, String archiveId, Instant now);

    /**
     * TASK-046 — liên kết gói archive với bản ghi audit của lần purge
     * (JS `system-route.mjs:2452`: `UPDATE project_archives SET purge_audit_id=? WHERE id=?`).
     * Trước đây Java **bỏ hẳn** câu này ⇒ `purge_audit_id` luôn NULL, mất dấu vết purge.
     */
    void setArchivePurgeAuditId(String archiveId, String auditId, Instant now);

    /** attachment storage_key của dự án (để dọn object storage). */
    List<String> projectAttachmentStorageKeys(String projectId);

    // ---- project_contracts (save_project_contract / set_project_contract_status / delete_project_contract) ----
    Map<String, Object> findContract(String contractId);
    boolean contractHasPrimary(String projectId);
    Map<String, Object> findContractParent(String parentContractId, String projectId);
    void insertContract(String contractId, String projectId, String contractNo, String contractName,
                        String contractType, String parentContractId, boolean isPrimary,
                        String signedAt, String effectiveFrom, String effectiveTo, String note,
                        String createdBy, Instant now);
    void updateContract(String contractId, String contractNo, String contractName, String contractType,
                        String parentContractId, String signedAt, String effectiveFrom, String effectiveTo,
                        String note, Instant now);
    void setContractStatus(String contractId, String status, Instant now);
    double contractStockResidual(String contractId);
    long contractUsageCount(String contractId);
    Map<String, Object> nextPrimaryCandidate(String projectId, String excludeContractId);
    void promotePrimaryContract(String contractId, Instant now);
    void deleteContract(String contractId);
}