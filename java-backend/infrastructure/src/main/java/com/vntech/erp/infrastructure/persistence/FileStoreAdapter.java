package com.vntech.erp.infrastructure.persistence;

import com.vntech.erp.application.port.out.FileStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Adapter MySQL + đĩa cho {@link FileStore} — thay thế D1 (metadata) + R2 ({@code env.BUCKET}, nội dung) của JS.
 *
 * <p>Nội dung tệp lưu dưới {@code vntech.files.root} với đúng cấu trúc key của JS
 * ({@code <entityType>/<entityId>/<id>-<safeName>}), nên khi migrate từ R2 chỉ cần copy nguyên key.
 */
@Repository
public class FileStoreAdapter implements FileStore {

    private final JdbcTemplate jdbc;
    private final Path root;

    public FileStoreAdapter(JdbcTemplate jdbc, @Value("${vntech.files.root:./.files}") String rootDir) {
        this.jdbc = jdbc;
        this.root = Paths.get(rootDir).toAbsolutePath().normalize();
    }

    // ================= auth =================

    @Override
    @Transactional(readOnly = true)
    public Optional<FileUser> findUserBySessionTokenHash(String tokenHash, Instant now) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT u.id,u.role,COALESCE(rc.base_role,u.role) AS roleBase
                FROM sessions s
                JOIN users u ON u.id=s.user_id
                LEFT JOIN role_catalog rc ON rc.code=u.role
                WHERE s.token_hash=? AND s.expires_at>? AND u.active=1""",
                tokenHash, Timestamp.from(now));
        return rows.isEmpty() ? Optional.empty() : Optional.of(toUser(rows.get(0)));
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<FileUser> findUserByEmail(String email) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT u.id,u.role,COALESCE(rc.base_role,u.role) AS roleBase
                FROM users u
                LEFT JOIN role_catalog rc ON rc.code=u.role
                WHERE lower(u.email)=lower(?) AND u.active=1""", email);
        return rows.isEmpty() ? Optional.empty() : Optional.of(toUser(rows.get(0)));
    }

    private static FileUser toUser(Map<String, Object> row) {
        return new FileUser(str(row.get("id")), str(row.get("role")), str(row.get("roleBase")));
    }

    // ================= entity → project + RBAC =================

    @Override
    @Transactional(readOnly = true)
    public Optional<String> entityProjectId(String entityType, String entityId) {
        if (entityType == null) return Optional.empty();
        String sql = switch (entityType) {
            case "material_request" -> "SELECT project_id FROM material_requests WHERE id=?";
            case "goods_receipt" -> """
                    SELECT po.project_id FROM goods_receipts gr
                    JOIN purchase_orders po ON po.id=gr.purchase_order_id WHERE gr.id=?""";
            case "central_return" -> "SELECT source_project_id FROM central_returns WHERE id=?";
            default -> null;
        };
        if (sql == null) return Optional.empty();
        List<String> rows = jdbc.queryForList(sql, String.class, entityId);
        return rows.isEmpty() ? Optional.empty() : Optional.ofNullable(rows.get(0));
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<String> projectScopePermission(String userId, String projectId) {
        List<String> rows = jdbc.queryForList(
                "SELECT permission FROM user_project_scopes WHERE user_id=? AND project_id=?",
                String.class, userId, projectId);
        return rows.isEmpty() ? Optional.empty() : Optional.ofNullable(rows.get(0));
    }

    /**
     * Port nguyên trạng JS {@code moduleAllowed()}:
     * admin luôn đúng; ghi vào material_request chỉ CHT/Dự án; module theo loại chứng từ;
     * central_return khi ghi chấp nhận can_edit HOẶC can_approve.
     */
    @Override
    @Transactional(readOnly = true)
    public boolean moduleAllowed(String userId, String entityType, boolean write) {
        Map<String, Object> role = userRole(userId);
        String rawRole = str(role.get("role"));
        if ("admin".equals(rawRole)) return true;
        if (write && "material_request".equals(entityType)) {
            String base = str(role.get("roleBase"));
            if (base.isBlank()) base = rawRole;
            if (!List.of("commander", "project").contains(base)) return false;
        }
        List<String> moduleKeys = switch (entityType == null ? "" : entityType) {
            case "goods_receipt" -> List.of("receiving", "delivered");
            case "central_return" -> List.of("central_warehouse");
            default -> List.of("requests", "approvals");
        };
        String permissionSql = (write && "central_return".equals(entityType))
                ? "(can_edit=1 OR can_approve=1)"
                : (write ? "can_edit=1" : "can_view=1");
        String placeholders = String.join(",", Collections.nCopies(moduleKeys.size(), "?"));
        List<Object> args = new ArrayList<>();
        args.add(userId);
        args.addAll(moduleKeys);
        List<Integer> rows = jdbc.queryForList(
                "SELECT 1 FROM user_module_permissions WHERE user_id=? AND module_key IN (" + placeholders
                        + ") AND " + permissionSql + " LIMIT 1", Integer.class, args.toArray());
        return !rows.isEmpty();
    }

    private Map<String, Object> userRole(String userId) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT u.role,COALESCE(rc.base_role,u.role) AS roleBase
                FROM users u LEFT JOIN role_catalog rc ON rc.code=u.role WHERE u.id=?""", userId);
        return rows.isEmpty() ? Map.of() : rows.get(0);
    }

    // ================= attachments =================

    @Override
    @Transactional
    public void insertAttachment(String id, String entityType, String entityId, String fileName, String storageKey,
                                 String mimeType, String uploadedBy, Instant now) {
        jdbc.update("""
                INSERT INTO attachments (id,entity_type,entity_id,file_name,storage_key,mime_type,
                                         uploaded_by,created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,?,?)""",
                id, entityType, entityId, fileName, storageKey, mimeType, uploadedBy,
                Timestamp.from(now), Timestamp.from(now));
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Map<String, Object>> findAttachment(String attachmentId) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT id,entity_type AS entityType,entity_id AS entityId,file_name AS fileName,
                       storage_key AS storageKey,mime_type AS mimeType,uploaded_by AS uploadedBy
                FROM attachments WHERE id=?""", attachmentId);
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> listAttachments(String entityType, String entityId) {
        return jdbc.queryForList("""
                SELECT a.id,a.file_name AS fileName,a.mime_type AS mimeType,a.created_at AS createdAt,
                       u.full_name AS uploadedByName
                FROM attachments a
                JOIN users u ON u.id=a.uploaded_by
                WHERE a.entity_type=? AND a.entity_id=?
                ORDER BY a.created_at DESC""", entityType, entityId);
    }

    @Override
    @Transactional
    public void deleteAttachment(String attachmentId) {
        jdbc.update("DELETE FROM attachments WHERE id=?", attachmentId);
    }

    // ================= object store trên đĩa =================

    @Override
    public void putObject(String storageKey, byte[] content) {
        Path target = resolve(storageKey);
        try {
            Files.createDirectories(target.getParent());
            Files.write(target, content);
        } catch (IOException e) {
            throw new IllegalStateException("Không ghi được tệp đính kèm: " + e.getMessage(), e);
        }
    }

    @Override
    public Optional<byte[]> getObject(String storageKey) {
        Path target = resolve(storageKey);
        try {
            return Files.exists(target) ? Optional.of(Files.readAllBytes(target)) : Optional.empty();
        } catch (IOException e) {
            throw new IllegalStateException("Không đọc được tệp đính kèm: " + e.getMessage(), e);
        }
    }

    @Override
    public void deleteObject(String storageKey) {
        try {
            Files.deleteIfExists(resolve(storageKey));
        } catch (IOException e) {
            throw new IllegalStateException("Không xóa được tệp đính kèm: " + e.getMessage(), e);
        }
    }

    /** Chặn path traversal: key phải nằm trong root sau khi chuẩn hoá. */
    private Path resolve(String storageKey) {
        Path target = root.resolve(storageKey).normalize();
        if (!target.startsWith(root)) throw new IllegalArgumentException("Đường dẫn tệp không hợp lệ.");
        return target;
    }

    // ================= archive =================

    @Override
    @Transactional(readOnly = true)
    public Optional<Map<String, Object>> findProject(String projectId) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT id,code,name,status FROM projects WHERE id=?", projectId);
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }

    /**
     * Bộ bảng + thứ tự + điều kiện JOIN **sao chép nguyên trạng** {@code projectArchiveDataset()} của JS,
     * kể cả 3 bảng nhánh {@code OR source_project_id/destination_project_id}. Muốn archive khớp JS
     * thì phải giữ đúng danh sách này.
     */
    @Override
    @Transactional(readOnly = true)
    public List<ArchiveTable> archiveTables(String projectId) {
        List<ArchiveTable> tables = new ArrayList<>();
        addArchive(tables, "projects", "SELECT * FROM projects WHERE id=?", projectId);
        addArchive(tables, "project_contracts", "SELECT * FROM project_contracts WHERE project_id=?", projectId);
        addArchive(tables, "boq_versions", "SELECT * FROM boq_versions WHERE project_id=?", projectId);
        addArchive(tables, "boq_import_batches", "SELECT * FROM boq_import_batches WHERE project_id=?", projectId);
        addArchive(tables, "boq_source_items", "SELECT * FROM boq_source_items WHERE project_id=?", projectId);
        addArchive(tables, "project_boq_items", "SELECT * FROM project_boq_items WHERE project_id=?", projectId);
        addArchive(tables, "boq_change_history", "SELECT * FROM boq_change_history WHERE project_id=?", projectId);
        addArchive(tables, "boq_mapping_runs", "SELECT * FROM boq_mapping_runs WHERE project_id=?", projectId);
        addArchive(tables, "boq_mapping_candidates",
                "SELECT c.* FROM boq_mapping_candidates c JOIN boq_mapping_runs r ON r.id=c.run_id WHERE r.project_id=?", projectId);
        addArchive(tables, "boq_mapping_audit",
                "SELECT a.* FROM boq_mapping_audit a JOIN boq_mapping_runs r ON r.id=a.run_id WHERE r.project_id=?", projectId);
        addArchive(tables, "material_requests", "SELECT * FROM material_requests WHERE project_id=?", projectId);
        addArchive(tables, "material_request_items",
                "SELECT i.* FROM material_request_items i JOIN material_requests r ON r.id=i.request_id WHERE r.project_id=?", projectId);
        addArchive(tables, "approvals",
                "SELECT a.* FROM approvals a JOIN material_requests r ON r.id=a.request_id WHERE r.project_id=?", projectId);
        addArchive(tables, "approval_stage_decisions",
                "SELECT d.* FROM approval_stage_decisions d JOIN material_requests r ON r.id=d.request_id WHERE r.project_id=?", projectId);
        addArchive(tables, "request_comments",
                "SELECT c.* FROM request_comments c JOIN material_requests r ON r.id=c.request_id WHERE r.project_id=?", projectId);
        addArchive(tables, "supply_workflow_steps",
                "SELECT s.* FROM supply_workflow_steps s JOIN material_requests r ON r.id=s.request_id WHERE r.project_id=?", projectId);
        addArchive(tables, "purchase_orders", "SELECT * FROM purchase_orders WHERE project_id=?", projectId);
        addArchive(tables, "purchase_order_items",
                "SELECT i.* FROM purchase_order_items i JOIN purchase_orders p ON p.id=i.purchase_order_id WHERE p.project_id=?", projectId);
        addArchive(tables, "goods_receipts",
                "SELECT g.* FROM goods_receipts g JOIN purchase_orders p ON p.id=g.purchase_order_id WHERE p.project_id=?", projectId);
        addArchive(tables, "goods_receipt_items",
                "SELECT i.* FROM goods_receipt_items i JOIN goods_receipts g ON g.id=i.receipt_id "
                        + "JOIN purchase_orders p ON p.id=g.purchase_order_id WHERE p.project_id=?", projectId);
        addArchive(tables, "procurement_allocations", "SELECT * FROM procurement_allocations WHERE project_id=?", projectId);
        addArchive(tables, "warehouses", "SELECT * FROM warehouses WHERE project_id=?", projectId);
        addArchive(tables, "warehouse_locations",
                "SELECT l.* FROM warehouse_locations l JOIN warehouses w ON w.id=l.warehouse_id WHERE w.project_id=?", projectId);
        addArchive(tables, "stock_movements", "SELECT * FROM stock_movements WHERE project_id=?", projectId);
        addArchive(tables, "contract_stock_ledger", "SELECT * FROM contract_stock_ledger WHERE project_id=?", projectId);
        addArchive(tables, "contract_stock_reconciliations",
                "SELECT * FROM contract_stock_reconciliations WHERE project_id=?", projectId);
        addArchive(tables, "contract_ownership_transfers",
                "SELECT * FROM contract_ownership_transfers WHERE source_project_id=? OR destination_project_id=?",
                projectId, projectId);
        addArchive(tables, "stock_reservations", "SELECT * FROM stock_reservations WHERE project_id=?", projectId);
        addArchive(tables, "stock_issues", "SELECT * FROM stock_issues WHERE project_id=?", projectId);
        addArchive(tables, "stock_issue_items",
                "SELECT i.* FROM stock_issue_items i JOIN stock_issues s ON s.id=i.issue_id WHERE s.project_id=?", projectId);
        addArchive(tables, "material_returns", "SELECT * FROM material_returns WHERE project_id=?", projectId);
        addArchive(tables, "material_return_items",
                "SELECT i.* FROM material_return_items i JOIN material_returns r ON r.id=i.return_id WHERE r.project_id=?", projectId);
        addArchive(tables, "stock_counts", "SELECT * FROM stock_counts WHERE project_id=?", projectId);
        addArchive(tables, "stock_count_items",
                "SELECT i.* FROM stock_count_items i JOIN stock_counts s ON s.id=i.stock_count_id WHERE s.project_id=?", projectId);
        addArchive(tables, "transfer_orders",
                "SELECT * FROM transfer_orders WHERE source_project_id=? OR destination_project_id=?",
                projectId, projectId);
        addArchive(tables, "transfer_order_items",
                "SELECT i.* FROM transfer_order_items i JOIN transfer_orders t ON t.id=i.transfer_order_id "
                        + "WHERE t.source_project_id=? OR t.destination_project_id=?", projectId, projectId);
        addArchive(tables, "central_returns", "SELECT * FROM central_returns WHERE source_project_id=?", projectId);
        addArchive(tables, "central_return_items",
                "SELECT i.* FROM central_return_items i JOIN central_returns r ON r.id=i.central_return_id "
                        + "WHERE r.source_project_id=?", projectId);
        addArchive(tables, "teams", "SELECT * FROM teams WHERE project_id=?", projectId);
        addArchive(tables, "team_subcontracts", "SELECT * FROM team_subcontracts WHERE project_id=?", projectId);
        addArchive(tables, "team_production_records", "SELECT * FROM team_production_records WHERE project_id=?", projectId);
        addArchive(tables, "team_payments", "SELECT * FROM team_payments WHERE project_id=?", projectId);
        addArchive(tables, "team_settlements", "SELECT * FROM team_settlements WHERE project_id=?", projectId);
        addArchive(tables, "production_reports", "SELECT * FROM production_reports WHERE project_id=?", projectId);
        addArchive(tables, "capital_recovery_records", "SELECT * FROM capital_recovery_records WHERE project_id=?", projectId);
        addArchive(tables, "contract_payments", "SELECT * FROM contract_payments WHERE project_id=?", projectId);
        addArchive(tables, "work_items", "SELECT * FROM work_items WHERE project_id=?", projectId);
        addArchive(tables, "work_item_events",
                "SELECT e.* FROM work_item_events e JOIN work_items w ON w.id=e.work_item_id WHERE w.project_id=?", projectId);
        addArchive(tables, "task_notifications",
                "SELECT n.* FROM task_notifications n JOIN work_items w ON w.id=n.work_item_id WHERE w.project_id=?", projectId);
        addArchive(tables, "project_close_checks", "SELECT * FROM project_close_checks WHERE project_id=?", projectId);
        addArchive(tables, "approval_email_recipients", "SELECT * FROM approval_email_recipients WHERE project_id=?", projectId);
        addArchive(tables, "document_sequences", "SELECT * FROM document_sequences WHERE project_id=?", projectId);
        addArchive(tables, "user_project_scopes", "SELECT * FROM user_project_scopes WHERE project_id=?", projectId);
        addArchive(tables, "user_warehouse_scopes",
                "SELECT s.* FROM user_warehouse_scopes s JOIN warehouses w ON w.id=s.warehouse_id WHERE w.project_id=?", projectId);
        addArchive(tables, "organization_units", "SELECT * FROM organization_units WHERE project_id=?", projectId);
        addArchive(tables, "material_mar_approvals", "SELECT * FROM material_mar_approvals WHERE project_id=?", projectId);

        // Bảng attachments + alias camelCase mà JS archive dùng (storage_key/file_name/mime_type).
        List<Map<String, Object>> attachments = jdbc.queryForList("""
                SELECT a.*,a.storage_key AS storageKey,a.file_name AS fileName,a.mime_type AS mimeType
                FROM attachments a
                WHERE (a.entity_type='material_request' AND a.entity_id IN
                         (SELECT id FROM material_requests WHERE project_id=?))
                   OR (a.entity_type='goods_receipt' AND a.entity_id IN
                         (SELECT g.id FROM goods_receipts g JOIN purchase_orders p ON p.id=g.purchase_order_id
                          WHERE p.project_id=?))
                   OR (a.entity_type='central_return' AND a.entity_id IN
                         (SELECT id FROM central_returns WHERE source_project_id=?))
                ORDER BY a.created_at""", projectId, projectId, projectId);
        tables.add(new ArchiveTable("attachments", attachments));

        List<String> entityIds = new ArrayList<>();
        for (ArchiveTable table : tables) {
            for (Map<String, Object> row : table.rows()) {
                Object id = row.get("id");
                if (id != null) entityIds.add(String.valueOf(id));
            }
        }
        tables.add(new ArchiveTable("audit_logs", auditLogsForEntityIds(entityIds)));
        return tables;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> auditLogsForEntityIds(List<String> entityIds) {
        if (entityIds == null || entityIds.isEmpty()) return List.of();
        List<Map<String, Object>> out = new ArrayList<>();
        // JS chia lô 250 id để không vượt giới hạn tham số SQL.
        for (int i = 0; i < entityIds.size(); i += 250) {
            List<String> part = entityIds.subList(i, Math.min(entityIds.size(), i + 250));
            String marks = String.join(",", Collections.nCopies(part.size(), "?"));
            out.addAll(jdbc.queryForList("SELECT * FROM audit_logs WHERE entity_id IN (" + marks + ")", part.toArray()));
        }
        return out;
    }

    @Override
    @Transactional
    public void insertProjectArchive(String id, String projectId, String projectCode, String projectName,
                                     String fileName, String sha256, long byteSize, int recordCount,
                                     int attachmentCount, String schemaVersion, String generatedBy, Instant now) {
        jdbc.update("""
                INSERT INTO project_archives (id,project_id,project_code,project_name,file_name,sha256,
                                              byte_size,record_count,attachment_count,schema_version,status,
                                              generated_by,generated_at,downloaded_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                id, projectId, projectCode, projectName, fileName, sha256, byteSize, recordCount,
                attachmentCount, schemaVersion, "verified", generatedBy, Timestamp.from(now), Timestamp.from(now));
    }

    private void addArchive(List<ArchiveTable> tables, String name, String sql, Object... args) {
        List<Map<String, Object>> rows = jdbc.queryForList(sql, args);
        List<Map<String, Object>> copies = new ArrayList<>(rows.size());
        for (Map<String, Object> row : rows) copies.add(new LinkedHashMap<>(row));
        tables.add(new ArchiveTable(name, copies));
    }

    private static String str(Object o) {
        return o == null ? "" : String.valueOf(o);
    }
}
