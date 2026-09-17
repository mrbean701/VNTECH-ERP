package com.vntech.erp.infrastructure.persistence;

import com.vntech.erp.application.port.out.BootstrapDataPort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Port bootstrap(user) từ monolith JS sang JdbcTemplate + native SQL.
 * Mọi câu SQL giữ NGUYÊN alias camelCase từ scripts/system-route.mjs (bootstrap, dòng ~545)
 * để shape JSON trả về khớp 100% với SPA hiện tại — không cần sửa UI.
 *
 * Phân quyền đơn giản: admin = toàn bộ; user thường = scope theo visibleProjectIds.
 */
@Component
public class BootstrapDataAdapter implements BootstrapDataPort {

    private final JdbcTemplate jdbcTemplate;

    public BootstrapDataAdapter(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> load(Context ctx) {
        Map<String, Object> data = new LinkedHashMap<>();
        boolean admin = ctx.admin();
        List<String> pids = ctx.visibleProjectIds();
        // JS dùng `${projectIds.map(()=>"?").join(",") || "NULL"}` -> khi rỗng là IN (NULL)
        String pidSql = pids.isEmpty() ? "NULL" : inClause(pids);
        // TASK-050/057 — hai biến vai trò dùng cho NHIỀU bộ lọc trong hàm này (JS dùng `effectiveRole(user)`
        // và `clean(user.warehouseScopeKind || "site")`), nên tính MỘT LẦN ở đầu.
        String roleBaseClean = ctx.roleBase() == null ? "" : ctx.roleBase().trim();
        String scopeKind = (ctx.warehouseScopeKind() == null || ctx.warehouseScopeKind().isBlank())
                ? "site" : ctx.warehouseScopeKind().trim();

        // ---- projects: CHỈ dự án trong phạm vi được cấp ----
        // LỖI BẢO MẬT đã sửa: trước đây trả TẤT CẢ dự án active cho mọi user, bỏ qua
        // ctx.visibleProjectIds() (BootstrapUseCase đã tính đúng: admin = toàn bộ,
        // user thường = chỉ dự án trong user_project_scopes). Hệ quả cũ: user không
        // được gán dự án nào vẫn thấy toàn bộ dự án của công ty.
        List<Map<String, Object>> projects = pids.isEmpty() ? List.of() : query("""
                SELECT id,code,name,status,contract_no AS contractNo,contract_name AS contractName,
                       start_date AS startDate,planned_end_date AS plannedEndDate
                FROM projects WHERE status='active' AND id IN (%s) ORDER BY code""".formatted(pidSql), params(pids));
        data.put("projects", projects);
        // JS trả projectAccessAll = isAdmin: UI dùng để quyết định có hiện "Tất cả dự án".
        data.put("projectAccessAll", admin);

        // ---- requests + approvals/items/supplySteps (enrich 3 tầng) ----
        List<Map<String, Object>> requests = query("""
                SELECT mr.id,mr.request_no AS requestNo,mr.project_id AS projectId,p.code AS projectCode,
                       p.name AS projectName,mr.contract_id AS contractId,pc.contract_no AS contractNo,
                       mr.boq_version_id AS boqVersionId,bv.version_code AS boqVersionCode,mr.team_id AS teamId,
                       t.name AS teamName,u.full_name AS requestedBy,mr.requested_at AS requestedAt,
                       mr.needed_at AS neededAt,mr.priority,mr.area,mr.purpose,mr.status,mr.supply_status AS supplyStatus,
                       mr.approval_stage AS approvalStage,mr.total_estimated_value AS totalEstimatedValue,
                       COALESCE(ri.item_count,0) AS itemCount,COALESCE(ri.total_qty,0) AS totalQty,
                       COALESCE(ri.received_qty,0) AS receivedQty,COALESCE(ri.issued_qty,0) AS issuedQty
                FROM material_requests mr
                JOIN projects p ON p.id=mr.project_id
                LEFT JOIN project_contracts pc ON pc.id=mr.contract_id
                LEFT JOIN boq_versions bv ON bv.id=mr.boq_version_id
                LEFT JOIN teams t ON t.id=mr.team_id
                JOIN users u ON u.id=mr.requested_by
                LEFT JOIN (SELECT request_id,COUNT(*) AS item_count,COALESCE(SUM(requested_qty),0) AS total_qty,
                                  COALESCE(SUM(received_qty),0) AS received_qty,COALESCE(SUM(issued_qty),0) AS issued_qty
                           FROM material_request_items GROUP BY request_id) ri ON ri.request_id=mr.id
                WHERE mr.project_id IN (%s)
                ORDER BY mr.requested_at DESC LIMIT 500""".formatted(pidSql), params(pids));
        List<String> requestIds = requests.stream().map(r -> String.valueOf(r.get("id"))).toList();
        if (!requestIds.isEmpty()) {
            String in = inClause(requestIds);
            List<Map<String, Object>> approvalRows = query("""
                    SELECT a.request_id AS requestId,a.stage,a.department,a.status,a.approver_user_id AS approverUserId,
                           u.full_name AS approverName,a.queued_at AS queuedAt,a.due_at AS dueAt,a.notified_at AS notifiedAt,
                           a.reminder_sent_at AS reminderSentAt,a.decided_at AS decidedAt,a.comment
                    FROM approvals a
                    LEFT JOIN users u ON u.id=a.approver_user_id
                    WHERE a.request_id IN (%s) ORDER BY a.stage""".formatted(in), params(requestIds));
            // TASK-044 — 11 trường JS trả về mà Java BỎ SÓT (UI page.tsx:3609 hiển thị trực tiếp):
            // workPackageCode · boqCode · installationArea · contractLineNo · pendingBchQty · closeReason ·
            // remainingQty · rejectedQty · linkedPoCount · linkedReceiptCount · missingDocumentCount.
            List<Map<String, Object>> itemRows = query("""
                    SELECT mri.id,mri.request_id AS requestId,mri.line_no AS lineNo,mri.boq_item_id AS boqItemId,
                           COALESCE(m.code,'[MẤT MÃ]') AS materialCode,
                           COALESCE(m.name,'Vật tư không còn trong Danh mục vật tư gốc') AS materialName,
                           COALESCE(m.unit,'') AS unit,m.brand AS manufacturer,mri.material_id AS materialId,
                           mri.work_package_code AS workPackageCode,mri.boq_code AS boqCode,
                           mri.installation_area AS installationArea,mri.contract_line_no AS contractLineNo,
                           mri.requested_qty AS requestedQty,mri.estimated_unit_price AS unitPrice,
                           mri.approved_purchase_qty AS approvedPurchaseQty,mri.ordered_qty AS orderedQty,
                           mri.delivered_qty AS actualDeliveredQty,mri.received_qty AS receivedQty,
                           CASE WHEN mri.delivered_qty>mri.received_qty
                                THEN mri.delivered_qty-mri.received_qty ELSE 0 END AS pendingBchQty,
                           mri.closed_qty AS closedQty,mri.close_reason AS closeReason,
                           CASE WHEN mri.approved_purchase_qty>mri.received_qty+mri.closed_qty
                                THEN mri.approved_purchase_qty-mri.received_qty-mri.closed_qty
                                ELSE 0 END AS remainingQty,
                           mri.line_status AS lineStatus,mri.issued_qty AS issuedQty,
                           mri.installed_qty AS installedQty,mri.stock_allocation_qty AS stockAllocationQty,
                           mri.origin,mri.approved_supplier AS approvedSupplier,mri.note,
                           (SELECT COALESCE(SUM(gri.rejected_qty),0) FROM goods_receipt_items gri
                              JOIN purchase_order_items poi2 ON poi2.id=gri.purchase_order_item_id
                             WHERE poi2.request_item_id=mri.id) AS rejectedQty,
                           (SELECT COUNT(DISTINCT poi3.purchase_order_id) FROM purchase_order_items poi3
                             WHERE poi3.request_item_id=mri.id) AS linkedPoCount,
                           (SELECT COUNT(DISTINCT gri2.receipt_id) FROM goods_receipt_items gri2
                              JOIN purchase_order_items poi4 ON poi4.id=gri2.purchase_order_item_id
                             WHERE poi4.request_item_id=mri.id) AS linkedReceiptCount,
                           (SELECT COUNT(*) FROM goods_receipts gr2
                              JOIN purchase_order_items poi5 ON poi5.purchase_order_id=gr2.purchase_order_id
                             WHERE poi5.request_item_id=mri.id AND gr2.bch_confirmation_status='confirmed'
                               AND (gr2.certificate_status='missing'
                                    OR gr2.delivery_document_status='missing')) AS missingDocumentCount
                    FROM material_request_items mri
                    LEFT JOIN materials m ON m.id=mri.material_id
                    WHERE mri.request_id IN (%s) ORDER BY mri.request_id,mri.line_no""".formatted(in), params(requestIds));
            // TASK-043 — ĐƯỜNG ĐỌC SAI: JS (system-route.mjs:563-568) tra `custom_field_values` bằng
            // **id DÒNG phiếu** rồi gắn `customFields` lên **từng dòng**. Bản cũ tra bằng **id PHIẾU**
            // và gắn lên **phiếu** ⇒ truy vấn không bao giờ khớp (entity_id là MRI…), nên `customFields`
            // của phiếu luôn `{}` còn từng dòng thì KHÔNG có khoá này (UI đọc `item.customFields`).
            List<String> itemIds = itemRows.stream().map(r -> String.valueOf(r.get("id"))).toList();
            List<Map<String, Object>> customRows = itemIds.isEmpty() ? List.of() : query("""
                    SELECT entity_id AS entityId,field_key AS fieldKey,value_text AS valueText
                    FROM custom_field_values WHERE form_key='request_line' AND entity_id IN (%s)"""
                    .formatted(inClause(itemIds)), params(itemIds));
            Map<String, Map<String, Object>> customByItem = new LinkedHashMap<>();
            for (Map<String, Object> c : customRows) {
                customByItem.computeIfAbsent(String.valueOf(c.get("entityId")), k -> new LinkedHashMap<>())
                        .put(String.valueOf(c.get("fieldKey")), String.valueOf(c.get("valueText")));
            }
            List<Map<String, Object>> itemRowsEnriched = itemRows.stream().map(row -> {
                Map<String, Object> out = new LinkedHashMap<>(row);
                out.put("customFields", customByItem.getOrDefault(String.valueOf(row.get("id")), new LinkedHashMap<>()));
                return out;
            }).toList();
            data.put("requests", requests.stream().map(r -> {
                Map<String, Object> out = new LinkedHashMap<>(r);
                String rid = String.valueOf(r.get("id"));
                out.put("approvals", groupBy(approvalRows, "requestId", rid));
                out.put("items", groupBy(itemRowsEnriched, "requestId", rid));
                return out;
            }).toList());
        } else {
            data.put("requests", List.of());
        }

        // ---- master data cho toàn hệ thống ----
        data.put("teams", query("""
                SELECT t.id,t.code,t.name,t.trade,t.project_id AS projectId,t.warehouse_id AS warehouseId
                FROM teams t WHERE t.project_id IN (%s) AND t.active=1 ORDER BY t.code""".formatted(pidSql), params(pids)));
        data.put("warehouses", query("""
                SELECT id,code,name,type,project_id AS projectId,parent_warehouse_id AS parentWarehouseId
                FROM warehouses WHERE active=1 AND (project_id IS NULL OR project_id IN (%s)) ORDER BY code""".formatted(pidSql), params(pids)));
        data.put("transferWarehouses", query("""
                SELECT w.id,w.code,w.name,w.type,w.project_id AS projectId,p.code AS projectCode,p.name AS projectName
                FROM warehouses w LEFT JOIN projects p ON p.id=w.project_id
                WHERE w.active=1 AND w.type<>'transit'
                ORDER BY CASE WHEN w.type='central' THEN 0 ELSE 1 END,COALESCE(p.code,''),w.code"""));
        data.put("materialCategories", query("""
                SELECT id,code,name,description,sort_order AS sortOrder,active
                FROM material_categories WHERE active=1 ORDER BY sort_order,name"""));
        data.put("materialSubcategories", query("""
                SELECT ms.id,ms.category_id AS categoryId,ms.code,ms.name,ms.description,
                       ms.scope_examples AS scopeExamples,ms.review_status AS reviewStatus,
                       ms.adjustment_note AS adjustmentNote,
                       ms.sort_order AS sortOrder,ms.active,mc.code AS categoryCode,mc.name AS categoryName
                FROM material_subcategories ms JOIN material_categories mc ON mc.id=ms.category_id
                WHERE ms.active=1 AND mc.active=1 ORDER BY mc.sort_order,ms.sort_order,ms.name"""));
        List<Map<String, Object>> materials = new ArrayList<>(query("""
                SELECT m.id,m.code,m.name,m.`system`,m.category_id AS categoryId,mc.code AS categoryCode,
                       mc.name AS categoryName,m.subcategory_id AS subcategoryId,ms.code AS subcategoryCode,
                       ms.name AS subcategoryName,m.specification,m.brand,m.unit,m.standard_price AS standardPrice,
                       m.min_stock AS minStock,m.requires_cocq AS requiresCocq,m.requires_mar AS requiresMar
                FROM materials m
                LEFT JOIN material_categories mc ON mc.id=m.category_id
                LEFT JOIN material_subcategories ms ON ms.id=m.subcategory_id
                WHERE m.active=1 AND (m.category_id IS NULL OR mc.active=1)
                  AND (m.subcategory_id IS NULL OR ms.active=1)
                ORDER BY COALESCE(mc.sort_order,999),COALESCE(ms.sort_order,9999),m.code"""));
        List<Map<String, Object>> aliases = query("""
                SELECT id,material_id AS materialId,alias_name AS aliasName,normalized_name AS normalizedName,
                       verified,active FROM material_aliases WHERE active=1 ORDER BY alias_name""");
        Map<String, List<String>> aliasesByMaterial = new LinkedHashMap<>();
        for (Map<String, Object> a : aliases) {
            aliasesByMaterial.computeIfAbsent(String.valueOf(a.get("materialId")), k -> new ArrayList<>())
                    .add(String.valueOf(a.get("aliasName")));
        }
        materials.forEach(m -> {
            List<String> list = aliasesByMaterial.getOrDefault(String.valueOf(m.get("id")), List.of());
            m.put("aliases", list);
            m.put("aliasText", String.join("; ", list));
        });
        data.put("materials", materials);

        data.put("suppliers", query("""
                SELECT id,code,name,tax_code AS taxCode,contact_name AS contactName,phone,
                       lead_time_days AS leadTimeDays,rating,active FROM suppliers WHERE active=1 ORDER BY code"""));
        if (admin) data.put("adminSuppliers", query("""
                SELECT id,code,name,tax_code AS taxCode,contact_name AS contactName,phone,
                       lead_time_days AS leadTimeDays,rating,active FROM suppliers
                ORDER BY CASE WHEN active=1 THEN 0 ELSE 1 END,code"""));

        // ---- kho: inventory (CTE balances/reservations như JS) ----
        data.put("inventory", pids.isEmpty() ? List.of() : query("""
                WITH movements AS (SELECT sm.material_id AS material_id,sm.to_warehouse_id AS warehouse_id,sm.quantity AS qty
                                   FROM stock_movements sm WHERE sm.to_warehouse_id IS NOT NULL
                                   UNION ALL
                                   SELECT sm.material_id,sm.from_warehouse_id,-sm.quantity
                                   FROM stock_movements sm WHERE sm.from_warehouse_id IS NOT NULL),
                     balances AS (SELECT material_id,warehouse_id,COALESCE(SUM(qty),0) AS balance
                                  FROM movements GROUP BY material_id,warehouse_id),
                     reservations AS (SELECT material_id,warehouse_id,COALESCE(SUM(quantity),0) AS reserved
                                      FROM stock_reservations WHERE status='active' GROUP BY material_id,warehouse_id)
                SELECT p.id AS projectId,p.code AS projectCode,p.name AS projectName,
                       w.id AS warehouseId,w.code AS warehouseCode,w.name AS warehouseName,w.type,
                       m.id AS materialId,m.code AS materialCode,m.name AS materialName,m.unit,m.min_stock AS minStock,
                       COALESCE(mv.balance,0) AS balance,COALESCE(r.reserved,0) AS reserved,
                       CASE WHEN COALESCE(mv.balance,0)-COALESCE(r.reserved,0)>0
                            THEN COALESCE(mv.balance,0)-COALESCE(r.reserved,0) ELSE 0 END AS available
                FROM projects p
                JOIN warehouses w ON w.active=1 AND w.project_id=p.id AND w.type='site'
                CROSS JOIN materials m
                LEFT JOIN balances mv ON mv.warehouse_id=w.id AND mv.material_id=m.id
                LEFT JOIN reservations r ON r.warehouse_id=w.id AND r.material_id=m.id
                WHERE p.id IN (%s) AND (COALESCE(mv.balance,0)<>0 OR COALESCE(r.reserved,0)<>0 OR w.type='site')
                ORDER BY p.code,w.code,m.code""".formatted(pidSql), params(pids)));

        // ---- mua hàng: PO + items, receipts + items ----
        List<Map<String, Object>> purchaseOrders = pids.isEmpty() ? List.of() : query("""
                SELECT po.id,po.po_no AS poNo,po.request_id AS requestId,mr.request_no AS requestNo,
                       po.project_id AS projectId,p.code AS projectCode,s.name AS supplierName,
                       po.ordered_at AS orderedAt,po.eta,po.status,po.total_value AS totalValue,
                       COALESCE(poa.item_count,0) AS itemCount,COALESCE(poa.ordered_qty,0) AS orderedQty,
                       COALESCE(poa.received_qty,0) AS receivedQty,
                       COALESCE(gra.actual_delivered_qty,0) AS actualDeliveredQty
                FROM purchase_orders po
                JOIN projects p ON p.id=po.project_id
                JOIN suppliers s ON s.id=po.supplier_id
                LEFT JOIN material_requests mr ON mr.id=po.request_id
                LEFT JOIN (SELECT purchase_order_id,COUNT(*) AS item_count,COALESCE(SUM(ordered_qty),0) AS ordered_qty,
                                  COALESCE(SUM(received_qty),0) AS received_qty
                           FROM purchase_order_items GROUP BY purchase_order_id) poa ON poa.purchase_order_id=po.id
                LEFT JOIN (SELECT actual_poi.purchase_order_id,COALESCE(SUM(gri.received_qty),0) AS actual_delivered_qty
                           FROM goods_receipt_items gri
                           JOIN purchase_order_items actual_poi ON actual_poi.id=gri.purchase_order_item_id
                           GROUP BY actual_poi.purchase_order_id) gra ON gra.purchase_order_id=po.id
                WHERE po.project_id IN (%s) ORDER BY po.ordered_at DESC LIMIT 300""".formatted(pidSql), params(pids));
        // JS bootstrap gắn items[] lồng vào từng PO; front-end (ReceiptModal, PO detail) đọc trực tiếp po.items.
        if (!purchaseOrders.isEmpty()) {
            List<String> poIds = purchaseOrders.stream().map(r -> String.valueOf(r.get("id"))).toList();
            String in = inClause(poIds);
            List<Map<String, Object>> poItemRows = query("""
                    SELECT poi.id,poi.purchase_order_id AS purchaseOrderId,poi.request_item_id AS requestItemId,
                           poi.line_no AS lineNo,poi.system_code AS systemCode,
                           poi.planned_delivery_at AS plannedDeliveryAt,poi.ordered_qty AS orderedQty,
                           poi.delivered_qty AS actualDeliveredQty,
                           CASE WHEN poi.delivered_qty>poi.received_qty THEN poi.delivered_qty-poi.received_qty ELSE 0 END AS pendingBchQty,
                           poi.received_qty AS receivedQty,poi.closed_qty AS closedQty,poi.close_reason AS closeReason,
                           CASE WHEN poi.ordered_qty>poi.received_qty+poi.closed_qty
                                THEN poi.ordered_qty-poi.received_qty-poi.closed_qty ELSE 0 END AS remainingQty,
                           poi.unit_price AS unitPrice,poi.status,
                           mri.material_id AS materialId,m.code AS materialCode,m.name AS materialName,m.unit
                    FROM purchase_order_items poi
                    JOIN material_request_items mri ON mri.id=poi.request_item_id
                    JOIN materials m ON m.id=mri.material_id
                    WHERE poi.purchase_order_id IN (%s)
                    ORDER BY poi.purchase_order_id,poi.line_no""".formatted(in), params(poIds));
            purchaseOrders = purchaseOrders.stream().map(r -> {
                Map<String, Object> out = new LinkedHashMap<>(r);
                out.put("items", groupBy(poItemRows, "purchaseOrderId", String.valueOf(r.get("id"))));
                return out;
            }).toList();
        }
        data.put("purchaseOrders", purchaseOrders);

        List<Map<String, Object>> receipts = pids.isEmpty() ? List.of() : query("""
                SELECT gr.id,gr.receipt_no AS receiptNo,gr.purchase_order_id AS purchaseOrderId,
                       po.request_id AS requestId,po.po_no AS poNo,p.id AS projectId,p.code AS projectCode,
                       s.name AS supplierName,w.name AS warehouseName,gr.received_at AS receivedAt,
                       gr.qc_status AS qcStatus,gr.document_status AS documentStatus,
                       gr.certificate_status AS certificateStatus,gr.delivery_document_status AS deliveryDocumentStatus,
                       gr.bch_confirmation_status AS bchConfirmationStatus,gr.posting_status AS postingStatus,
                       COALESCE(gra.item_count,0) AS itemCount,COALESCE(gra.actual_delivered_qty,0) AS actualDeliveredQty,
                       COALESCE(gra.accepted_qty,0) AS acceptedQty,COALESCE(gra.rejected_qty,0) AS rejectedQty
                FROM goods_receipts gr
                JOIN purchase_orders po ON po.id=gr.purchase_order_id
                JOIN projects p ON p.id=po.project_id
                JOIN suppliers s ON s.id=po.supplier_id
                JOIN warehouses w ON w.id=gr.warehouse_id
                LEFT JOIN (SELECT receipt_id,COUNT(*) AS item_count,COALESCE(SUM(received_qty),0) AS actual_delivered_qty,
                                  COALESCE(SUM(accepted_qty),0) AS accepted_qty,COALESCE(SUM(rejected_qty),0) AS rejected_qty
                           FROM goods_receipt_items GROUP BY receipt_id) gra ON gra.receipt_id=gr.id
                WHERE po.project_id IN (%s) ORDER BY gr.received_at DESC LIMIT 300""".formatted(pidSql), params(pids));
        // JS bootstrap gắn items[] lồng vào từng phiếu nhập (goods_receipt_items + PO + material).
        if (!receipts.isEmpty()) {
            List<String> receiptIds = receipts.stream().map(r -> String.valueOf(r.get("id"))).toList();
            String in = inClause(receiptIds);
            List<Map<String, Object>> receiptItemRows = query("""
                    SELECT gri.id,gri.receipt_id AS receiptId,gri.purchase_order_item_id AS purchaseOrderItemId,
                           poi.ordered_qty AS orderedQty,gri.received_qty AS actualQty,
                           gri.accepted_qty AS acceptedQty,gri.rejected_qty AS rejectedQty,
                           gri.lot_no AS lotNo,gri.qc_result AS qcResult,
                           m.code AS materialCode,m.name AS materialName,m.unit
                    FROM goods_receipt_items gri
                    JOIN purchase_order_items poi ON poi.id=gri.purchase_order_item_id
                    JOIN material_request_items mri ON mri.id=poi.request_item_id
                    JOIN materials m ON m.id=mri.material_id
                    WHERE gri.receipt_id IN (%s)
                    ORDER BY gri.receipt_id,poi.line_no""".formatted(in), params(receiptIds));
            receipts = receipts.stream().map(r -> {
                Map<String, Object> out = new LinkedHashMap<>(r);
                out.put("items", groupBy(receiptItemRows, "receiptId", String.valueOf(r.get("id"))));
                return out;
            }).toList();
        }
        data.put("receipts", receipts);

        // ---- xuất kho + returns + stock counts ----
        // TASK-057 — cổng đối chiếu TẬP CỘT (`tools/probe-column-parity.mjs`) phát hiện 2 cột thiếu ở đây
        // so với JS `:615`: `si.received_by_name AS receivedByName` (UI `page.tsx:963` dùng làm cột "Người nhận")
        // và `COALESCE(sia.installed_qty,0) AS installedQty` (UI `page.tsx:2219` cộng vào "Đã xác nhận lắp").
        data.put("issues", pids.isEmpty() ? List.of() : query("""
                SELECT si.id,si.issue_no AS issueNo,si.project_id AS projectId,si.team_id AS teamId,
                       p.code AS projectCode,t.name AS teamName,si.issued_at AS issuedAt,si.status,
                       si.received_by_name AS receivedByName,
                       COALESCE(sia.item_count,0) AS itemCount,COALESCE(sia.total_qty,0) AS totalQty,
                       COALESCE(sia.installed_qty,0) AS installedQty
                FROM stock_issues si
                JOIN projects p ON p.id=si.project_id
                JOIN teams t ON t.id=si.team_id
                LEFT JOIN (SELECT issue_id,COUNT(*) AS item_count,COALESCE(SUM(quantity),0) AS total_qty,
                                  COALESCE(SUM(installed_qty),0) AS installed_qty
                           FROM stock_issue_items GROUP BY issue_id) sia ON sia.issue_id=si.id
                WHERE si.project_id IN (%s) ORDER BY si.issued_at DESC LIMIT 200""".formatted(pidSql), params(pids)));
        // TASK-057 — thiếu `mr.returned_by_name AS returnedByName` (JS `:619`; UI `page.tsx:965` dùng làm cột "Người trả").
        data.put("returns", pids.isEmpty() ? List.of() : query("""
                SELECT mr.id,mr.return_no AS returnNo,mr.project_id AS projectId,mr.team_id AS teamId,
                       p.code AS projectCode,t.name AS teamName,mr.returned_at AS returnedAt,mr.status,
                       mr.returned_by_name AS returnedByName,
                       COALESCE(mra.item_count,0) AS itemCount,COALESCE(mra.accepted_qty,0) AS acceptedQty
                FROM material_returns mr
                JOIN projects p ON p.id=mr.project_id
                JOIN teams t ON t.id=mr.team_id
                LEFT JOIN (SELECT return_id,COUNT(*) AS item_count,COALESCE(SUM(accepted_qty),0) AS accepted_qty
                           FROM material_return_items GROUP BY return_id) mra ON mra.return_id=mr.id
                WHERE mr.project_id IN (%s) ORDER BY mr.returned_at DESC LIMIT 200""".formatted(pidSql), params(pids)));
        data.put("stockCounts", pids.isEmpty() ? List.of() : query("""
                SELECT sc.id,sc.count_no AS countNo,sc.project_id AS projectId,p.code AS projectCode,
                       sc.warehouse_id AS warehouseId,w.name AS warehouseName,sc.count_type AS countType,
                       sc.counted_at AS countedAt,sc.status,
                       COALESCE(sca.item_count,0) AS itemCount,COALESCE(sca.total_variance,0) AS totalVariance
                FROM stock_counts sc
                JOIN projects p ON p.id=sc.project_id
                JOIN warehouses w ON w.id=sc.warehouse_id
                LEFT JOIN (SELECT stock_count_id,COUNT(*) AS item_count,COALESCE(SUM(ABS(variance_qty)),0) AS total_variance
                           FROM stock_count_items GROUP BY stock_count_id) sca ON sca.stock_count_id=sc.id
                WHERE sc.project_id IN (%s) ORDER BY sc.counted_at DESC LIMIT 200""".formatted(pidSql), params(pids)));

        // ---- chuyển kho ----
        // TASK-057 — JS `:713` trả 21 cột, bản Java chỉ 14 (thiếu `sourceProjectId`, `destinationProjectId`,
        // `approvedAt`, `shippedAt`, `receivedAt`, `shippedQty`, `receivedQty`) ⇒ UI `page.tsx:1745` hiện
        // "Đã xuất"/"Đã nhận" LUÔN 0, và `page.tsx:2238` lọc theo dự án bị sai. Nay port đủ 21 cột.
        List<Map<String, Object>> transferOrders = query("""
                SELECT t.id,t.transfer_no AS transferNo,t.source_warehouse_id AS sourceWarehouseId,
                       sw.code AS sourceWarehouseCode,sw.name AS sourceWarehouseName,
                       t.destination_warehouse_id AS destinationWarehouseId,
                       dw.code AS destinationWarehouseCode,dw.name AS destinationWarehouseName,
                       t.source_project_id AS sourceProjectId,t.destination_project_id AS destinationProjectId,
                       t.status,t.reason,t.note,t.requested_at AS requestedAt,t.approved_at AS approvedAt,
                       t.shipped_at AS shippedAt,t.received_at AS receivedAt,
                       COALESCE(x.item_count,0) AS itemCount,COALESCE(x.requested_qty,0) AS requestedQty,
                       COALESCE(x.shipped_qty,0) AS shippedQty,COALESCE(x.received_qty,0) AS receivedQty
                FROM transfer_orders t
                JOIN warehouses sw ON sw.id=t.source_warehouse_id
                JOIN warehouses dw ON dw.id=t.destination_warehouse_id
                LEFT JOIN (SELECT transfer_order_id,COUNT(*) AS item_count,SUM(requested_qty) AS requested_qty,
                                  SUM(shipped_qty) AS shipped_qty,SUM(received_qty) AS received_qty
                           FROM transfer_order_items GROUP BY transfer_order_id) x ON x.transfer_order_id=t.id
                ORDER BY t.requested_at DESC LIMIT 300""");
        // JS `:714` — vai trò kho (không phải admin) CHỈ thấy phiếu điều chuyển mà kho nguồn/đích nằm trong
        // danh sách kho họ được thấy. Trước đây Java không lọc ⇒ thủ kho thấy phiếu của mọi kho.
        if (!admin && "warehouse".equals(roleBaseClean)) {
            java.util.Set<String> visibleWarehouseIds = new java.util.LinkedHashSet<>();
            Object warehousesObj = data.get("warehouses");
            if (warehousesObj instanceof List<?> list) {
                for (Object row : list) {
                    if (row instanceof Map<?, ?> map && map.get("id") != null) {
                        visibleWarehouseIds.add(String.valueOf(map.get("id")));
                    }
                }
            }
            transferOrders = transferOrders.stream()
                    .filter(row -> visibleWarehouseIds.contains(String.valueOf(row.get("sourceWarehouseId")))
                            || visibleWarehouseIds.contains(String.valueOf(row.get("destinationWarehouseId"))))
                    .toList();
        }
        data.put("transferOrders", transferOrders);

        // ---- BOQ: boqItems, contracts, versions, sourceItems, mapping candidates ----
        data.put("boqItems", pids.isEmpty() ? List.of() : query("""
                SELECT pbi.id,pbi.project_id AS projectId,pbi.contract_id AS contractId,
                       pbi.boq_version_id AS boqVersionId,p.code AS projectCode,p.name AS projectName,
                       pbi.line_no AS lineNo,pbi.source_order AS sourceOrder,pbi.row_role AS rowRole,
                       pbi.boq_code AS boqCode,pbi.contract_material_code AS contractMaterialCode,
                       pbi.approved_material_code AS approvedMaterialCode,pbi.material_id AS materialId,
                       m.code AS materialCode,COALESCE(bsi.contract_material_name,pbi.description) AS materialName,
                       COALESCE(bsi.unit,m.unit) AS unit,COALESCE(NULLIF(bsi.source_system_code,''),m.`system`,'KHAC') AS systemCode,
                       bsi.source_subgroup_name AS subgroupName,mc.name AS categoryName,pbi.description,
                       pbi.item_type AS itemType,bsi.id AS sourceItemId,
                       COALESCE(bsi.mapping_status,'legacy_mapped') AS mappingStatus,
                       pbi.contract_qty AS contractQty,pbi.remeasured_qty AS remeasuredQty,
                       pbi.unit_price AS unitPrice,pbi.variation_status AS variationStatus,
                       pbi.note,pbi.active
                FROM project_boq_items pbi
                JOIN projects p ON p.id=pbi.project_id
                JOIN materials m ON m.id=pbi.material_id
                LEFT JOIN material_categories mc ON mc.id=m.category_id
                LEFT JOIN boq_source_items bsi ON bsi.project_boq_item_id=pbi.id AND bsi.active=1
                LEFT JOIN boq_versions bv ON bv.id=pbi.boq_version_id
                WHERE pbi.active=1 AND (pbi.boq_version_id IS NULL OR bv.active=1)
                  AND pbi.project_id IN (%s)
                ORDER BY p.code,COALESCE(pbi.source_order,pbi.line_no),pbi.id""".formatted(pidSql), params(pids)));
        data.put("projectContracts", pids.isEmpty() ? List.of() : query("""
                SELECT c.id,c.project_id AS projectId,c.contract_no AS contractNo,
                       c.contract_name AS contractName,c.contract_type AS contractType,
                       c.parent_contract_id AS parentContractId,c.status,c.is_primary AS isPrimary,
                       c.signed_at AS signedAt,c.effective_from AS effectiveFrom,c.effective_to AS effectiveTo,
                       c.note,c.created_at AS createdAt,c.updated_at AS updatedAt
                FROM project_contracts c WHERE c.project_id IN (%s)
                ORDER BY c.project_id,c.is_primary DESC,c.created_at,c.contract_no""".formatted(pidSql), params(pids)));
        data.put("boqVersions", pids.isEmpty() ? List.of() : query("""
                SELECT v.id,v.project_id AS projectId,v.contract_id AS contractId,v.version_no AS versionNo,
                       v.version_code AS versionCode,v.version_name AS versionName,v.revision_type AS revisionType,
                       v.source_file_name AS sourceFileName,v.status,v.active,v.effective_at AS effectiveAt,
                       v.approved_at AS approvedAt,v.created_at AS createdAt,v.updated_at AS updatedAt
                FROM boq_versions v WHERE v.project_id IN (%s)
                ORDER BY v.project_id,v.contract_id,v.version_no DESC""".formatted(pidSql), params(pids)));
        data.put("boqSourceItems", pids.isEmpty() ? List.of() : query("""
                SELECT bsi.id AS sourceItemId,bsi.batch_id AS batchId,bsi.project_id AS projectId,
                       bsi.contract_id AS contractId,bsi.boq_version_id AS boqVersionId,
                       bsi.source_order AS sourceOrder,bsi.source_row AS sourceRow,bsi.row_role AS rowRole,
                       bsi.boq_code AS boqCode,bsi.contract_material_code AS contractMaterialCode,
                       bsi.approved_material_code AS approvedMaterialCode,
                       bsi.contract_material_name AS materialName,bsi.unit,bsi.contract_qty AS contractQty,
                       bsi.remeasured_qty AS remeasuredQty,bsi.unit_price AS unitPrice,bsi.item_type AS itemType,
                       bsi.note,COALESCE(NULLIF(bsi.source_system_code,''),m.`system`,'KHAC') AS systemCode,
                       bsi.source_subgroup_name AS subgroupName,bsi.mapping_status AS mappingStatus,
                       bsi.mapped_material_id AS materialId,m.code AS materialCode,
                       m.name AS standardMaterialName,bsi.project_boq_item_id AS projectBoqItemId,bsi.active
                FROM boq_source_items bsi
                JOIN boq_versions bv ON bv.id=bsi.boq_version_id
                LEFT JOIN materials m ON m.id=bsi.mapped_material_id
                WHERE bsi.project_id IN (%s)
                ORDER BY bsi.project_id,bsi.contract_id,bv.version_no,bsi.source_order,bsi.id""".formatted(pidSql), params(pids)));
        data.put("boqMappingCandidates", pids.isEmpty() ? List.of() : query("""
                SELECT c.id,bsi.project_id AS projectId,bsi.contract_id AS contractId,
                       bsi.contract_material_name AS sourceMaterialName,c.material_id AS materialId,
                       m.code AS materialCode,m.name AS materialName,c.final_score AS score,c.rank_no AS candidateRank,
                       CASE WHEN c.status IN ('exact','very_high','high') THEN 1 ELSE 0 END AS matched
                FROM boq_mapping_candidates c
                JOIN boq_source_items bsi ON bsi.id=c.source_item_id
                LEFT JOIN materials m ON m.id=c.material_id
                WHERE bsi.project_id IN (%s)
                ORDER BY bsi.project_id,c.rank_no""".formatted(pidSql), params(pids)));
        data.put("contractStockLedger", pids.isEmpty() ? List.of() : query("""
                SELECT l.id,l.project_id AS projectId,l.contract_id AS contractId,c.contract_no AS contractNo,
                       l.warehouse_id AS warehouseId,w.code AS warehouseCode,w.name AS warehouseName,
                       l.material_id AS materialId,m.code AS materialCode,m.name AS materialName,m.unit,
                       l.movement_type AS movementType,l.quantity_delta AS quantityDelta,
                       l.occurred_at AS occurredAt,l.reference_type AS referenceType,l.reference_id AS referenceId,
                       l.counterparty_contract_id AS counterpartyContractId,l.note
                FROM contract_stock_ledger l
                JOIN project_contracts c ON c.id=l.contract_id
                JOIN warehouses w ON w.id=l.warehouse_id
                JOIN materials m ON m.id=l.material_id
                WHERE l.project_id IN (%s)
                ORDER BY l.occurred_at DESC,l.id DESC LIMIT 2000""".formatted(pidSql), params(pids)));
        data.put("contractStockBalances", pids.isEmpty() ? List.of() : query("""
                SELECT l.project_id AS projectId,l.contract_id AS contractId,c.contract_no AS contractNo,
                       l.warehouse_id AS warehouseId,w.code AS warehouseCode,
                       l.material_id AS materialId,m.code AS materialCode,m.name AS materialName,m.unit,
                       COALESCE(SUM(l.quantity_delta),0) AS balance
                FROM contract_stock_ledger l
                JOIN project_contracts c ON c.id=l.contract_id
                JOIN warehouses w ON w.id=l.warehouse_id
                JOIN materials m ON m.id=l.material_id
                WHERE l.project_id IN (%s)
                GROUP BY l.project_id,l.contract_id,c.contract_no,l.warehouse_id,w.code,l.material_id,m.code,m.name,m.unit
                HAVING ABS(COALESCE(SUM(l.quantity_delta),0))>0.0000001
                ORDER BY l.project_id,c.contract_no,w.code,m.code""".formatted(pidSql), params(pids)));

        // ---- hệ thống: settings, role/org/menu/module, staff ----
        data.put("settings", first("""
                SELECT company_name AS companyName,stage_1_department AS stage1Department,
                       stage_2_department AS stage2Department,stage_3_department AS stage3Department,
                       approval_sla_hours AS approvalSlaHours,stage_1_sla_hours AS stage1SlaHours,
                       stage_2_sla_hours AS stage2SlaHours,stage_3_sla_hours AS stage3SlaHours,
                       po_sla_hours AS poSlaHours,bch_confirmation_sla_hours AS bchConfirmationSlaHours,
                       slow_moving_days AS slowMovingDays,negative_stock_blocked AS negativeStockBlocked
                FROM company_settings WHERE id='SETTINGS'"""));
        data.put("approvalStageCatalog", query("""
                SELECT id,stage_no AS stageNo,name,description,allowed_role_codes AS allowedRoleCodes,
                       approval_mode AS approvalMode,sla_hours AS slaHours,
                       auto_approve_on_submit AS autoApproveOnSubmit,active,sort_order AS sortOrder
                FROM approval_stage_catalog ORDER BY stage_no"""));
        data.put("roleCatalog", query("""
                SELECT rc.id,rc.code,rc.name,rc.description,rc.base_role AS baseRole,
                       rc.default_organization_unit_id AS defaultOrganizationUnitId,
                       ou.code AS defaultOrganizationCode,ou.name AS defaultOrganizationName,
                       rc.active,rc.sort_order AS sortOrder,rc.system_locked AS systemLocked
                FROM role_catalog rc
                LEFT JOIN organization_units ou ON ou.id=rc.default_organization_unit_id
                %s ORDER BY rc.sort_order,rc.name""".formatted(admin ? "" : "WHERE rc.active=1")));
        data.put("organizationUnits", query("""
                SELECT ou.id,ou.code,ou.name,ou.unit_type AS unitType,ou.parent_id AS parentId,
                       parent.name AS parentName,ou.project_id AS projectId,p.code AS projectCode,
                       ou.description,ou.active,ou.archived_at AS archivedAt,ou.sort_order AS sortOrder,
                       ou.system_locked AS systemLocked
                FROM organization_units ou
                LEFT JOIN organization_units parent ON parent.id=ou.parent_id
                LEFT JOIN projects p ON p.id=ou.project_id
                %s ORDER BY ou.sort_order,ou.name""".formatted(admin ? "" : "WHERE ou.active=1 AND ou.archived_at IS NULL")));
        data.put("menuGroups", query("""
                SELECT id,group_key AS groupKey,name,icon,active,sort_order AS sortOrder,
                       collapsible,system_locked AS systemLocked
                FROM menu_group_catalog %s ORDER BY sort_order,name""".formatted(admin ? "" : "WHERE active=1")));
        List<Map<String, Object>> moduleCatalog = query("""
                SELECT mc.module_key AS moduleKey,mc.label,mc.icon,mc.group_name AS groupName,
                       mc.group_key AS groupKey,mc.active,mc.sort_order AS sortOrder,mc.system_locked AS systemLocked
                FROM module_catalog mc %s ORDER BY mc.sort_order,mc.module_key""".formatted(
                        admin ? "" : "LEFT JOIN menu_group_catalog mg ON mg.group_key=mc.group_key WHERE mc.active=1 AND (mc.group_key IS NULL OR mg.active=1)"));
        data.put("moduleCatalog", moduleCatalog);
        // modulePermissions: admin = toàn bộ module active (giống JS)
        // ⚠️ SỬA LỖI (TASK-052 — "lớp lỗi #4": cột MySQL `tinyint(1)` được JDBC trả về **Boolean**,
        // không phải Number): hai nhánh dưới đây trước kia kiểm `activeVal instanceof Number`
        // ⇒ LUÔN sai ⇒ `data.modulePermissions` của admin LUÔN RỖNG (0 dòng) dù JS trả đủ 61 dòng
        // với permissionSource="admin". Đo được: `moduleCatalog[0].active === true` (JSON boolean).
        // Hệ quả bị UI che: `app/page.tsx:548` trả toàn quyền cho admin TRƯỚC khi đọc danh sách này,
        // nên lỗi không lộ ra ở màn hình quản trị. Dùng chung helper `isActiveOne` như 5 use-case khác
        // trong kho (AdminSystemUseCase:527, ProjectContractUseCase:101, PurchaseManagementUseCase:405,
        // RequestManagementUseCase:598, UserManagementUseCase:596).
        if (admin) {
            List<Map<String, Object>> perms = new ArrayList<>();
            for (Map<String, Object> mod : moduleCatalog) {
                if (isActiveOne(mod.get("active"))) {
                    Map<String, Object> perm = new LinkedHashMap<>();
                    perm.put("userId", ctx.userId());
                    perm.put("moduleKey", mod.get("moduleKey"));
                    perm.put("canView", 1); perm.put("canUse", 1); perm.put("canCreate", 1);
                    perm.put("canEdit", 1); perm.put("canApprove", 1); perm.put("canExport", 1);
                    perm.put("permissionSource", "admin");
                    perms.add(perm);
                }
            }
            data.put("modulePermissions", perms);
        } else if (isCompanyLeadership(ctx.roleCode(), ctx.roleBase())) {
            // ══════════════════════════════════════════════════════════════════════════════
            // TASK-050 (kèm theo) — NHÁNH THỨ BA của JS `system-route.mjs:684` BỊ THIẾU HOÀN TOÀN
            // JS: modulePermissions = admin ? <toàn bộ MODULE_KEYS>
            //                        : isCompanyLeadership(user) ? <mọi module TRỪ "admin">
            //                        : <dòng user_module_permissions của chính người dùng>
            // Bản Java chỉ có nhánh 1 và nhánh 3. Hậu quả ĐO ĐƯỢC: tài khoản `thukydemo`
            // (role `thuky`, base_role `director`) chỉ có 15 dòng `user_module_permissions`, trong khi
            // JS cấp cho họ TOÀN BỘ module (trừ admin) với permissionSource="company_leadership".
            // Việc này PHẢI port cùng lượt với bộ lọc module bên dưới: bộ lọc lấy chính danh sách
            // modulePermissions làm đầu vào, nên nếu để nguyên thì tài khoản Ban giám đốc sẽ bị
            // XOÁ TRẮNG dữ liệu oan (JS không xoá gì cho họ).
            // (Hồ sơ TASK-024 đã ghi nhận lệch này ở mặt "mã vai trò"; đây là mặt ĐỌC của cùng lỗi.)
            // ══════════════════════════════════════════════════════════════════════════════
            List<Map<String, Object>> perms = new ArrayList<>();
            for (Map<String, Object> mod : moduleCatalog) {
                if (isActiveOne(mod.get("active"))
                        && !"admin".equals(String.valueOf(mod.get("moduleKey")))) {
                    Map<String, Object> perm = new LinkedHashMap<>();
                    perm.put("userId", ctx.userId());
                    perm.put("moduleKey", mod.get("moduleKey"));
                    perm.put("canView", 1); perm.put("canUse", 1); perm.put("canCreate", 1);
                    perm.put("canEdit", 1); perm.put("canApprove", 1); perm.put("canExport", 1);
                    perm.put("permissionSource", "company_leadership");
                    perms.add(perm);
                }
            }
            data.put("modulePermissions", perms);
        } else {
            data.put("modulePermissions", query("""
                    SELECT ump.user_id AS userId,ump.module_key AS moduleKey,ump.can_view AS canView,
                           ump.can_use AS canUse,ump.can_create AS canCreate,ump.can_edit AS canEdit,
                           ump.can_approve AS canApprove,ump.can_export AS canExport,
                           COALESCE(ump.permission_source,'manual_override') AS permissionSource
                    FROM user_module_permissions ump
                    JOIN module_catalog mc ON mc.module_key=ump.module_key AND mc.active=1
                    WHERE ump.user_id=? ORDER BY mc.sort_order,ump.module_key""", ctx.userId()));
        }
        data.put("staffDirectory", query("""
                SELECT u.id,u.employee_code AS employeeCode,u.full_name AS fullName,u.email,u.role,
                       COALESCE(rc.name,u.role) AS roleName,u.department,
                       u.organization_unit_id AS organizationUnitId,ou.code AS organizationCode,
                       COALESCE(ou.name,u.department) AS organizationName,u.avatar_url AS avatarUrl,
                       u.system_level_code AS systemLevelCode
                FROM users u
                LEFT JOIN role_catalog rc ON rc.code=u.role
                LEFT JOIN organization_units ou ON ou.id=u.organization_unit_id
                WHERE u.active=1 ORDER BY u.full_name"""));

        // ════════════════════════════════════════════════════════════════════
        // BÙ CÁC TRƯỜNG BOOTSTRAP MÀ UI YÊU CẦU (JS trả, Java trước đây thiếu).
        // Thiếu chúng làm UI crash dạng "Cannot read properties of undefined":
        //   • allModulePermissions  → PersonalExceptionManager (tab "Ngoại lệ cá nhân") + 5 chỗ
        //   • userWarehouseScopes   → tab "Phạm vi dự án & kho"
        //   • approvalStages        → tab "Workflow phê duyệt" (UI dùng tên này, không dùng
        //                             approvalStageCatalog — 20 chỗ trong app/page.tsx)
        // ════════════════════════════════════════════════════════════════════
        // JS: `approvalStages: approvalStageCatalog` — CÙNG một dữ liệu, hai tên.
        data.put("approvalStages", data.get("approvalStageCatalog"));

        data.put("allModulePermissions", admin ? query("""
                SELECT ump.user_id AS userId,ump.module_key AS moduleKey,ump.can_view AS canView,
                       ump.can_use AS canUse,ump.can_create AS canCreate,ump.can_edit AS canEdit,
                       ump.can_approve AS canApprove,ump.can_export AS canExport,
                       ump.permission_expires_at AS permissionExpiresAt,
                       COALESCE(ump.permission_source,'manual_override') AS permissionSource
                FROM user_module_permissions ump
                ORDER BY ump.user_id,ump.module_key""") : query("""
                SELECT ump.user_id AS userId,ump.module_key AS moduleKey,ump.can_view AS canView,
                       ump.can_use AS canUse,ump.can_create AS canCreate,ump.can_edit AS canEdit,
                       ump.can_approve AS canApprove,ump.can_export AS canExport,
                       ump.permission_expires_at AS permissionExpiresAt,
                       COALESCE(ump.permission_source,'manual_override') AS permissionSource
                FROM user_module_permissions ump
                WHERE ump.user_id=? ORDER BY ump.module_key""", ctx.userId()));

        data.put("userWarehouseScopes", admin ? query("""
                SELECT uws.user_id AS userId,uws.warehouse_id AS warehouseId,uws.permission,
                       w.code AS warehouseCode,w.name AS warehouseName,w.type,w.project_id AS projectId
                FROM user_warehouse_scopes uws
                JOIN warehouses w ON w.id=uws.warehouse_id
                ORDER BY uws.user_id,w.code""") : query("""
                SELECT uws.user_id AS userId,uws.warehouse_id AS warehouseId,uws.permission,
                       w.code AS warehouseCode,w.name AS warehouseName,w.type,w.project_id AS projectId
                FROM user_warehouse_scopes uws
                JOIN warehouses w ON w.id=uws.warehouse_id
                WHERE uws.user_id=? ORDER BY w.code""", ctx.userId()));

        // SỬA LỖI (TASK-040 nhóm 1, đường ĐỌC #1): UI đọc `data.emailSettings` để đổ form Quản trị email
        // (app/page.tsx:31 khai báo khoá này trong kiểu Bootstrap). Bản Java port THIẾU hẳn khoá ⇒ form luôn
        // rỗng và người quản trị tưởng đã mất cấu hình SMTP. JS system-route.mjs:721 trả CHỈ cho admin
        // (`isAdmin(user) ? ... : null`) và KHÔNG bao giờ trả cột `password` — chỉ cờ `passwordConfigured`.
        Map<String, Object> emailSettingsRow = admin ? first("""
                SELECT enabled,smtp_host AS smtpHost,smtp_port AS smtpPort,security,username,
                       sender_email AS senderEmail,sender_name AS senderName,base_url AS baseUrl,
                       CASE WHEN password IS NOT NULL AND length(password)>0 THEN 1 ELSE 0 END AS passwordConfigured
                FROM email_settings WHERE id='EMAIL'""") : null;
        data.put("emailSettings", emailSettingsRow == null || emailSettingsRow.isEmpty() ? null : emailSettingsRow);

        // SỬA LỖI (TASK-040 nhóm 1, đường ĐỌC): UI đọc `data.emailRecipients` để đổ cột email người nhận
        // (app/page.tsx:3739 `emailFor()`), nhưng bản Java port THIẾU hẳn khoá này ⇒ `data.emailRecipients`
        // là `undefined` ⇒ luôn hiển thị rỗng: ghi được mà KHÔNG BAO GIỜ đọc lại. JS system-route.mjs:722
        // trả bảng này CHỈ cho admin (`isAdmin(user) ? ... : []`), và không lọc theo dự án.
        data.put("emailRecipients", admin ? query("""
                SELECT id,project_id AS projectId,stage,emails,active
                FROM approval_email_recipients ORDER BY project_id,stage""") : List.of());

        // JS: `workflowAssignments` = bảng approval_project_assignments (phân công người duyệt theo dự án+bước)
        data.put("workflowAssignments", pids.isEmpty() ? List.of() : query("""
                SELECT apa.id,apa.project_id AS projectId,apa.stage,apa.owner_user_id AS ownerUserId,
                       u.full_name AS ownerName,apa.cc_emails AS ccEmails,apa.active
                FROM approval_project_assignments apa
                LEFT JOIN users u ON u.id=apa.owner_user_id
                WHERE apa.project_id IN (%s) ORDER BY apa.project_id,apa.stage""".formatted(pidSql), params(pids)));

        data.put("formFieldConfigs", query("""
                SELECT id,form_key AS formKey,field_key AS fieldKey,display_name AS displayName,
                       data_type AS dataType,source_kind AS sourceKind,visible,required,importable,
                       exportable,editable,sort_order AS sortOrder,options_json AS optionsJson,
                       system_locked AS systemLocked,active
                FROM form_field_config %s ORDER BY form_key,sort_order,field_key""".formatted(
                        admin ? "" : "WHERE active=1")));

        // P4 — workflow đa luồng: quy trình · bước · người duyệt đích danh.
        // Người duyệt chỉ trả về họ tên/mã/vai trò (không lộ email) để màn cấu hình hiển thị được.
        data.put("workflowDefinitions", query("""
                SELECT id,code,name,description,module_key AS moduleKey,project_id AS projectId,
                       is_default AS isDefault,active,version,sort_order AS sortOrder,created_by AS createdBy
                FROM workflow_definitions ORDER BY sort_order,code"""));
        data.put("workflowSteps", query("""
                SELECT id,workflow_id AS workflowId,step_no AS stepNo,name,description,
                       approval_mode AS approvalMode,sla_hours AS slaHours,
                       allow_skip_level AS allowSkipLevel,required_permission AS requiredPermission,active
                FROM workflow_steps ORDER BY workflow_id,step_no"""));
        data.put("workflowStepApprovers", query("""
                SELECT a.id,a.step_id AS stepId,a.user_id AS userId,a.active,
                       u.full_name AS fullName,u.employee_code AS employeeCode,u.role AS role
                FROM workflow_step_approvers a
                LEFT JOIN users u ON u.id=a.user_id
                ORDER BY a.step_id,a.user_id"""));

        // P5 — phân quyền phòng ban (nguồn chính) + thang cấp bậc hệ thống.
        data.put("departmentModulePermissions", query("""
                SELECT d.id,d.organization_unit_id AS organizationUnitId,o.code AS organizationCode,
                       o.name AS organizationName,d.module_key AS moduleKey,
                       d.can_view AS canView,d.can_use AS canUse,d.can_create AS canCreate,
                       d.can_edit AS canEdit,d.can_approve AS canApprove,d.can_export AS canExport,d.active
                FROM department_module_permissions d
                LEFT JOIN organization_units o ON o.id=d.organization_unit_id
                ORDER BY o.code,d.module_key"""));
        data.put("systemLevelCatalog", query("""
                SELECT id,code,name,description,level_rank AS `rank`,auto_grant_all AS autoGrantAll,
                       can_skip_levels AS canSkipLevels,active,sort_order AS sortOrder
                FROM system_level_catalog ORDER BY level_rank,sort_order,code"""));

        List<Map<String, Object>> uiDisplay = query("""
                SELECT id,scope_key AS scopeKey,settings_json AS settingsJson,updated_at AS updatedAt
                FROM ui_display_settings WHERE scope_key='company_default' LIMIT 1""");
        data.put("uiDisplaySettings", uiDisplay.isEmpty() ? null : uiDisplay.get(0));

        data.put("materialAliases", query("""
                SELECT id,material_id AS materialId,alias_name AS aliasName,
                       normalized_name AS normalizedName,verified,active
                FROM material_aliases WHERE active=1 ORDER BY alias_name"""));

        // productIdentity / trustStatus: JS trả hằng số + trạng thái trust lock
        // TASK-057 — JS `:666` đặt alias `id AS productId`; bản Java trả `id` ⇒ `data.productIdentity.productId`
        // là `undefined` (UI đọc `VNTECH_BRAND` nên chưa lộ, nhưng hợp đồng dữ liệu phải khớp JS).
        data.put("productIdentity", first("""
                SELECT id AS productId,legal_owner AS legalOwner,product_name AS productName,
                       product_description AS productDescription,version,
                       source_fingerprint AS sourceFingerprint,
                       source_fingerprint_short AS sourceFingerprintShort
                FROM vntech_product_identity LIMIT 1"""));
        Map<String, Object> trustSettings = first("""
                SELECT trust_mode AS trustMode,enforcement_enabled AS enforcementEnabled,
                       tenant_id AS tenantId,company_code AS companyCode,key_id AS keyId,
                       algorithm,machine_fingerprint AS machineFingerprint,
                       hardware_binding_mode AS hardwareBindingMode
                FROM vntech_trust_settings LIMIT 1""");
        Map<String, Object> trustStatus = new LinkedHashMap<>();
        trustStatus.put("foundationReady", !trustSettings.isEmpty());
        trustStatus.put("trustSettings", trustSettings);
        trustStatus.put("privateKeyPresent", false);
        data.put("trustStatus", trustStatus);

        Map<String, Object> serverInfo = new LinkedHashMap<>();
        serverInfo.put("product", "VNTECH-KHO-MEP-001");
        serverInfo.put("backend", "java-clean-arch");
        serverInfo.put("database", "mysql");
        data.put("serverInfo", serverInfo);

        // adminMaterials / adminMaterialCategories / adminMaterialSubcategories:
        // JS trả bản "admin" (gồm cả bản ghi ẩn). Khi không phải admin thì không có.
        if (admin) {
            // SỬA LỖI (TASK-040 nhóm 3b — lần thứ NĂM gặp dạng "đường ĐỌC thiếu trường"): truy vấn cũ chỉ trả
            // 10 trường, THIẾU `specification`, `brand`, `minStock`, `requiresCocq` và cả mã/tên nhóm
            // (`categoryCode`/`categoryName`/`subcategoryCode`/`subcategoryName`) so với JS
            // `system-route.mjs:696`. Hệ quả: màn Quản trị danh mục vật tư hiển thị thiếu hãng/ĐVT/tồn tối thiểu
            // dù DB có dữ liệu (đã kiểm chứng bằng MySQL: `brand='brand probe'`, `min_stock=7`).
            // Nay khớp nguyên trạng JS: giữ cả bản ghi đã ẩn (KHÔNG lọc active), LEFT JOIN nhóm,
            // sắp xếp theo active rồi thứ tự nhóm, và kèm danh sách alias như khối `materials`.
            List<Map<String, Object>> adminMaterials = new ArrayList<>(query("""
                    SELECT m.id,m.code,m.name,m.`system`,m.category_id AS categoryId,mc.code AS categoryCode,
                           mc.name AS categoryName,m.subcategory_id AS subcategoryId,ms.code AS subcategoryCode,
                           ms.name AS subcategoryName,m.specification,m.brand,m.unit,
                           m.standard_price AS standardPrice,m.min_stock AS minStock,
                           m.requires_cocq AS requiresCocq,m.requires_mar AS requiresMar,m.active
                    FROM materials m
                    LEFT JOIN material_categories mc ON mc.id=m.category_id
                    LEFT JOIN material_subcategories ms ON ms.id=m.subcategory_id
                    ORDER BY CASE WHEN m.active=1 THEN 0 ELSE 1 END,
                             COALESCE(mc.sort_order,999),COALESCE(ms.sort_order,9999),m.code"""));
            adminMaterials.forEach(m -> {
                List<String> list = aliasesByMaterial.getOrDefault(String.valueOf(m.get("id")), List.of());
                m.put("aliases", list);
                m.put("aliasText", String.join("; ", list));
            });
            data.put("adminMaterials", adminMaterials);
            data.put("adminMaterialCategories", query("""
                    SELECT id,code,name,description,sort_order AS sortOrder,active
                    FROM material_categories ORDER BY sort_order,code"""));
            // SỬA LỖI (TASK-041 phần 3, đường ĐỌC thứ SÁU): bản cũ chỉ trả 7 trường, THIẾU
            // `scope_examples`/`review_status`/`adjustment_note` và cả `categoryCode`/`categoryName` so với JS
            // `system-route.mjs:695`. UI đọc `row.scopeExamples` (cột "Phạm vi / ví dụ gồm"),
            // `row.reviewStatus` (nhãn "Đã duyệt"/"Đề xuất") và `row.adjustmentNote` (cột "Ý kiến điều chỉnh")
            // ⇒ thiếu trường thì các cột đó LUÔN trống/giữ mặc định dù DB có dữ liệu.
            data.put("adminMaterialSubcategories", query("""
                    SELECT ms.id,ms.category_id AS categoryId,ms.code,ms.name,ms.description,
                           ms.scope_examples AS scopeExamples,ms.review_status AS reviewStatus,
                           ms.adjustment_note AS adjustmentNote,
                           ms.sort_order AS sortOrder,ms.active,mc.code AS categoryCode,mc.name AS categoryName
                    FROM material_subcategories ms JOIN material_categories mc ON mc.id=ms.category_id
                    ORDER BY CASE WHEN ms.active=1 THEN 0 ELSE 1 END,mc.sort_order,ms.sort_order,ms.name"""));
        }

        // engineRoleProfiles: JS trả business_role_engine_catalog dưới tên này.
        data.put("engineRoleProfiles", data.get("businessRoleEngineProfiles"));

        data.put("supplySteps", pids.isEmpty() ? List.of() : query("""
                SELECT s.id,s.request_id AS requestId,s.step,s.status,s.queued_at AS queuedAt,
                       s.due_at AS dueAt,s.completed_at AS completedAt,s.completed_by AS completedBy,
                       s.comment,s.purchase_order_id AS purchaseOrderId,s.receipt_id AS receiptId
                FROM supply_workflow_steps s
                JOIN material_requests r ON r.id=s.request_id
                WHERE r.project_id IN (%s) ORDER BY s.request_id,s.step""".formatted(pidSql), params(pids)));

        data.put("workItemEvents", query("""
                SELECT e.id,e.work_item_id AS workItemId,e.event_type AS eventType,
                       e.from_status AS fromStatus,e.to_status AS toStatus,
                       e.actor_user_id AS actorUserId,e.reason,e.detail_json AS detailJson,
                       e.occurred_at AS occurredAt
                FROM work_item_events e ORDER BY e.occurred_at DESC LIMIT 500"""));

        data.put("teamSettlements", pids.isEmpty() ? List.of() : query("""
                SELECT id,project_id AS projectId,team_id AS teamId,subcontract_id AS subcontractId,
                       settlement_no AS settlementNo,status,final_value AS finalValue,
                       paid_value AS paidValue,remaining_value AS remainingValue,
                       settled_at AS settledAt,created_at AS createdAt
                FROM team_settlements WHERE project_id IN (%s) ORDER BY created_at DESC""".formatted(pidSql), params(pids)));

        data.put("boqImportBatches", pids.isEmpty() ? List.of() : query("""
                SELECT id,project_id AS projectId,contract_id AS contractId,
                       boq_version_id AS boqVersionId,version_no AS versionNo,
                       source_file_name AS sourceFileName,row_count AS rowCount,
                       imported_by AS importedBy,created_at AS createdAt
                FROM boq_import_batches WHERE project_id IN (%s) ORDER BY created_at DESC""".formatted(pidSql), params(pids)));

        data.put("boqChangeHistory", pids.isEmpty() ? List.of() : query("""
                SELECT id,project_id AS projectId,project_boq_item_id AS projectBoqItemId,
                       action_type AS actionType,before_json AS beforeJson,after_json AS afterJson,
                       reason,actor_user_id AS actorUserId,created_at AS createdAt
                FROM boq_change_history WHERE project_id IN (%s) ORDER BY created_at DESC""".formatted(pidSql), params(pids)));

        data.put("businessRoleGroupScopes", query("""
                SELECT id,business_group_id AS businessGroupId,business_scope_id AS scopeId,
                       is_primary AS isPrimary,created_at AS createdAt
                FROM business_role_group_scopes ORDER BY business_group_id"""));

        data.put("stockReconciliations", pids.isEmpty() ? List.of() : query("""
                SELECT id,project_id AS projectId,warehouse_id AS warehouseId,material_id AS materialId,
                       physical_qty AS physicalQty,contract_qty AS contractQty,
                       difference_qty AS differenceQty,status,checked_at AS checkedAt,created_at AS createdAt
                FROM contract_stock_reconciliations WHERE project_id IN (%s) ORDER BY created_at DESC""".formatted(pidSql), params(pids)));
        if (admin) {
            data.put("users", query("""
                    SELECT u.id,u.employee_code AS employeeCode,u.full_name AS fullName,u.username,u.email,u.role,
                           COALESCE(rc.name,u.role) AS roleName,COALESCE(rc.base_role,u.role) AS roleBase,
                           rc.warehouse_scope_kind AS warehouseScopeKind,u.department,
                           u.organization_unit_id AS organizationUnitId,ou.code AS organizationCode,
                           COALESCE(ou.name,u.department) AS organizationName,u.avatar_url AS avatarUrl,
                           u.approval_limit AS approvalLimit,u.must_change_password AS mustChangePassword,u.active,
                           u.system_level_code AS systemLevelCode
                    FROM users u
                    LEFT JOIN role_catalog rc ON rc.code=u.role
                    LEFT JOIN organization_units ou ON ou.id=u.organization_unit_id
                    ORDER BY u.full_name"""));
            data.put("adminProjects", query("""
                    SELECT id,code,name,status,contract_no AS contractNo,contract_name AS contractName,
                           start_date AS startDate,planned_end_date AS plannedEndDate
                    FROM projects WHERE status<>'purged'
                    ORDER BY CASE WHEN status='active' THEN 0 ELSE 1 END,code"""));
            data.put("userScopes", query("""
                    SELECT ups.user_id AS userId,ups.project_id AS projectId,ups.permission,
                           ups.joined_at AS joinedAt,ups.left_at AS leftAt,
                           ups.position_name AS positionName,
                           p.code AS projectCode,p.name AS projectName
                    FROM user_project_scopes ups JOIN projects p ON p.id=ups.project_id
                    ORDER BY ups.user_id,p.code"""));
            // GĐ5 — thành viên tổ đội kèm thời gian tham gia/rời (bảng team_members, V14).
            // LƯU Ý: `users` KHÔNG có cột role_name — tên chức danh nằm ở role_catalog,
            // phải JOIN qua rc.code = u.role (giống query staffDirectory ở trên).
            data.put("teamMembers", query("""
                    SELECT tm.id,tm.team_id AS teamId,tm.user_id AS userId,
                           tm.role_in_team AS roleInTeam,tm.joined_at AS joinedAt,
                           tm.left_at AS leftAt,tm.active,
                           u.full_name AS fullName,u.employee_code AS employeeCode,
                           u.role AS role,COALESCE(rc.name,u.role) AS roleName,u.department
                    FROM team_members tm
                    LEFT JOIN users u ON u.id=tm.user_id
                    LEFT JOIN role_catalog rc ON rc.code=u.role
                    ORDER BY tm.team_id,tm.joined_at"""));
            data.put("activeSessions", query("""
                    SELECT s.id,s.user_id AS userId,u.full_name AS userName,u.username,
                           s.ip_address AS ipAddress,s.user_agent AS userAgent,s.created_at AS createdAt,
                           s.expires_at AS expiresAt
                    FROM sessions s JOIN users u ON u.id=s.user_id
                    WHERE s.expires_at>? ORDER BY s.created_at DESC LIMIT 300""", java.time.Instant.now()));
            data.put("audits", query("""
                    SELECT al.id,al.action,al.entity_type AS entityType,al.entity_id AS entityId,
                           al.occurred_at AS occurredAt,COALESCE(al.user_name,u.full_name) AS userName,
                           al.user_id AS userId,al.user_role AS userRole,al.department,al.system_level AS systemLevel,
                           al.module_key AS moduleKey,al.permission_used AS permissionUsed,
                           al.change_detail AS changeDetail,al.before_json AS beforeJson,
                           al.after_json AS afterJson,al.ip_address AS ipAddress
                    FROM audit_logs al LEFT JOIN users u ON u.id=al.user_id
                    ORDER BY al.occurred_at DESC LIMIT 500"""));
            data.put("businessRoleEngineProfiles", query("""
                    SELECT id,engine_key AS engineKey,company_code AS companyCode,display_name AS displayName,
                           description,active,sort_order AS sortOrder,system_locked AS systemLocked
                    FROM business_role_engine_catalog ORDER BY sort_order,display_name"""));
            data.put("businessRoleGroups", query("""
                    SELECT id,code,name,description,engine_role AS engineRole,active,
                           sort_order AS sortOrder,system_locked AS systemLocked
                    FROM business_role_group_catalog ORDER BY sort_order,name"""));
            data.put("businessScopes", query("""
                    SELECT id,code,name,description,active,sort_order AS sortOrder,system_locked AS systemLocked
                    FROM business_scope_catalog ORDER BY sort_order,name"""));
        }

        // ---- tài chính / pháp chế / nhân sự (mảng đủ khối, UI không vỡ) ----
        data.put("contractPayments", pids.isEmpty() ? List.of() : query("""
                SELECT cp.id,cp.project_id AS projectId,p.code AS projectCode,p.name AS projectName,
                       cp.recovery_record_id AS recoveryRecordId,cp.payment_date AS paymentDate,
                       cp.reference_no AS referenceNo,cp.description,cp.amount,cp.note,
                       cp.created_at AS createdAt,cp.updated_at AS updatedAt
                FROM contract_payments cp JOIN projects p ON p.id=cp.project_id
                WHERE cp.project_id IN (%s) ORDER BY cp.payment_date DESC,cp.created_at DESC""".formatted(pidSql), params(pids)));
        data.put("productionReports", pids.isEmpty() ? List.of() : query("""
                SELECT pr.id,pr.project_id AS projectId,p.code AS projectCode,p.name AS projectName,
                       pr.report_period AS reportPeriod,pr.reference_no AS referenceNo,pr.description,
                       pr.planned_value AS plannedValue,pr.actual_value AS actualValue,
                       pr.approved_value AS approvedValue,pr.status,pr.submitted_by AS submittedBy,
                       us.full_name AS submittedByName,pr.approved_by AS approvedBy,
                       ua.full_name AS approvedByName,pr.approved_at AS approvedAt,
                       pr.created_at AS createdAt,pr.updated_at AS updatedAt
                FROM production_reports pr
                JOIN projects p ON p.id=pr.project_id
                LEFT JOIN users us ON us.id=pr.submitted_by
                LEFT JOIN users ua ON ua.id=pr.approved_by
                WHERE pr.project_id IN (%s) ORDER BY pr.report_period DESC,pr.updated_at DESC""".formatted(pidSql), params(pids)));
        data.put("capitalRecoveryRecords", pids.isEmpty() ? List.of() : query("""
                SELECT cr.id,cr.project_id AS projectId,p.code AS projectCode,p.name AS projectName,
                       cr.period_key AS periodKey,cr.reference_no AS referenceNo,
                       cr.production_report_id AS productionReportId,pr.approved_value AS productionApprovedValue,
                       cr.submitted_value AS submittedValue,cr.approved_value AS approvedValue,
                       cr.invoice_no AS invoiceNo,cr.invoice_value AS invoiceValue,cr.due_date AS dueDate,
                       cr.status,cr.note,cr.created_at AS createdAt,cr.updated_at AS updatedAt,
                       COALESCE((SELECT SUM(cp.amount) FROM contract_payments cp WHERE cp.recovery_record_id=cr.id),0) AS cashReceived
                FROM capital_recovery_records cr
                JOIN projects p ON p.id=cr.project_id
                LEFT JOIN production_reports pr ON pr.id=cr.production_report_id
                WHERE cr.project_id IN (%s) ORDER BY cr.period_key DESC,cr.updated_at DESC""".formatted(pidSql), params(pids)));
        data.put("teamSubcontracts", pids.isEmpty() ? List.of() : query("""
                SELECT sc.id,sc.project_id AS projectId,sc.team_id AS teamId,t.code AS teamCode,t.name AS teamName,
                       sc.contract_no AS contractNo,sc.contract_name AS contractName,sc.scope_text AS scopeText,
                       sc.contract_value AS contractValue,sc.start_date AS startDate,sc.end_date AS endDate,
                       sc.status,sc.signed_at AS signedAt,sc.note,sc.created_at AS createdAt,sc.updated_at AS updatedAt
                FROM team_subcontracts sc JOIN teams t ON t.id=sc.team_id
                WHERE sc.project_id IN (%s) ORDER BY sc.created_at DESC""".formatted(pidSql), params(pids)));
        data.put("teamProductionRecords", pids.isEmpty() ? List.of() : query("""
                SELECT tp.id,tp.project_id AS projectId,tp.team_id AS teamId,t.name AS teamName,
                       tp.subcontract_id AS subcontractId,sc.contract_no AS contractNo,tp.period_key AS periodKey,
                       tp.reference_no AS referenceNo,tp.description,tp.submitted_value AS submittedValue,
                       tp.approved_value AS approvedValue,tp.status,tp.approved_at AS approvedAt,
                       tp.created_at AS createdAt
                FROM team_production_records tp
                JOIN teams t ON t.id=tp.team_id
                JOIN team_subcontracts sc ON sc.id=tp.subcontract_id
                WHERE tp.project_id IN (%s) ORDER BY tp.period_key DESC,tp.created_at DESC""".formatted(pidSql), params(pids)));
        data.put("teamPayments", pids.isEmpty() ? List.of() : query("""
                SELECT pay.id,pay.project_id AS projectId,pay.team_id AS teamId,t.name AS teamName,
                       pay.subcontract_id AS subcontractId,sc.contract_no AS contractNo,
                       pay.payment_date AS paymentDate,pay.payment_type AS paymentType,
                       pay.reference_no AS referenceNo,pay.description,pay.amount,pay.note,
                       pay.created_at AS createdAt
                FROM team_payments pay
                JOIN teams t ON t.id=pay.team_id
                JOIN team_subcontracts sc ON sc.id=pay.subcontract_id
                WHERE pay.project_id IN (%s) ORDER BY pay.payment_date DESC,pay.created_at DESC""".formatted(pidSql), params(pids)));
        data.put("paymentPlans", pids.isEmpty() ? List.of() : query("""
                SELECT pp.id,pp.plan_no AS planNo,pp.project_id AS projectId,p.code AS projectCode,
                       p.name AS projectName,pp.contract_id AS contractId,pp.po_id AS poId,
                       pp.milestone,pp.planned_date AS plannedDate,pp.planned_amount AS plannedAmount,
                       pp.paid_amount AS paidAmount,pp.status,pp.note,pp.created_at AS createdAt,
                       pp.updated_at AS updatedAt
                FROM payment_plans pp JOIN projects p ON p.id=pp.project_id
                WHERE pp.project_id IN (%s) ORDER BY pp.planned_date,pp.created_at DESC""".formatted(pidSql), params(pids)));
        data.put("advanceRequests", pids.isEmpty() ? List.of() : query("""
                SELECT ar.id,ar.request_no AS requestNo,ar.project_id AS projectId,p.code AS projectCode,
                       p.name AS projectName,ar.requester_id AS requesterId,u.full_name AS requesterName,
                       u.department AS requesterDepartment,ar.amount,ar.purpose,ar.category,ar.status,
                       ar.advance_paid AS advancePaid,ar.settlement_value AS settlementValue,
                       ar.settled_at AS settledAt,ar.note,ar.created_at AS createdAt,ar.updated_at AS updatedAt
                FROM advance_requests ar
                LEFT JOIN projects p ON p.id=ar.project_id
                LEFT JOIN users u ON u.id=ar.requester_id
                WHERE ar.project_id IS NULL OR ar.project_id IN (%s)
                ORDER BY ar.created_at DESC""".formatted(pidSql), params(pids)));
        data.put("siteExpenseClaims", pids.isEmpty() ? List.of() : query("""
                SELECT sc.id,sc.claim_no AS claimNo,sc.project_id AS projectId,p.code AS projectCode,
                       p.name AS projectName,sc.cost_type AS costType,sc.amount,sc.paid_by AS paidBy,
                       pu.full_name AS paidByName,sc.claim_date AS claimDate,sc.description,
                       sc.status,sc.approved_by AS approvedBy,au.full_name AS approvedByName,
                       sc.approved_at AS approvedAt,sc.created_at AS createdAt,sc.updated_at AS updatedAt
                FROM site_expense_claims sc
                JOIN projects p ON p.id=sc.project_id
                LEFT JOIN users pu ON pu.id=sc.paid_by
                LEFT JOIN users au ON au.id=sc.approved_by
                WHERE sc.project_id IN (%s) ORDER BY sc.claim_date DESC,sc.created_at DESC""".formatted(pidSql), params(pids)));
        data.put("bankAccounts", query("""
                SELECT b.id,b.code,b.bank_name AS bankName,b.account_no AS accountNo,b.branch,b.currency,
                       b.opening_balance AS openingBalance,b.active,b.created_at AS createdAt
                FROM bank_accounts b ORDER BY b.active DESC,b.code"""));
        data.put("cashbookEntries", query("""
                SELECT e.id,e.entry_no AS entryNo,e.entry_date AS entryDate,e.account_id AS accountId,
                       b.code AS accountCode,b.bank_name AS bankName,e.entry_type AS entryType,e.amount,
                       e.counterparty,e.reference_type AS referenceType,e.reference_id AS referenceId,
                       e.note,e.created_by AS createdBy,u.full_name AS createdByName,e.created_at AS createdAt
                FROM cashbook_entries e
                LEFT JOIN bank_accounts b ON b.id=e.account_id
                LEFT JOIN users u ON u.id=e.created_by
                ORDER BY e.entry_date DESC,e.created_at DESC"""));
        data.put("accountingVouchers", query("""
                SELECT v.id,v.voucher_no AS voucherNo,v.voucher_date AS voucherDate,
                       v.voucher_type AS voucherType,v.project_id AS projectId,p.code AS projectCode,
                       p.name AS projectName,v.description,v.total_amount AS totalAmount,v.status,
                       v.files_json AS filesJson,v.created_at AS createdAt,v.updated_at AS updatedAt
                FROM accounting_vouchers v
                LEFT JOIN projects p ON p.id=v.project_id
                ORDER BY v.voucher_date DESC,v.created_at DESC"""));
        data.put("hrRecords", query("""
                SELECT h.id,h.user_id AS userId,u.full_name AS fullName,u.employee_code AS employeeCode,
                       u.email,u.department,h.identity_no AS identityNo,h.birth_date AS birthDate,
                       h.birthplace,h.permanent_address AS permanentAddress,h.phone,
                       h.education_level AS educationLevel,h.joined_date AS joinedDate,h.position,h.note
                FROM hr_records h LEFT JOIN users u ON u.id=h.user_id ORDER BY h.full_name"""));
        data.put("laborContracts", query("""
                SELECT lc.id,lc.contract_no AS contractNo,lc.user_id AS userId,u.full_name AS fullName,
                       u.employee_code AS employeeCode,lc.contract_type AS contractType,
                       lc.start_date AS startDate,lc.end_date AS endDate,lc.signing_date AS signingDate,
                       lc.salary,lc.status,lc.note
                FROM labor_contracts lc LEFT JOIN users u ON u.id=lc.user_id
                ORDER BY lc.start_date DESC"""));
        data.put("officialCorrespondence", query("""
                SELECT c.id,c.doc_no AS docNo,c.direction,c.doc_type AS docType,c.issue_date AS issueDate,
                       c.sender_name AS senderName,c.receiver_name AS receiverName,c.summary,
                       c.internal_handler AS internalHandler,c.status,c.result_note AS resultNote,
                       c.created_at AS createdAt
                FROM official_correspondence c ORDER BY c.issue_date DESC,c.created_at DESC"""));
        data.put("legalDocuments", query("""
                SELECT d.id,d.doc_no AS docNo,d.doc_type AS docType,d.title,d.issue_date AS issueDate,
                       d.issuer,d.effective_date AS effectiveDate,d.expiry_date AS expiryDate,d.scope,
                       d.attachment_id AS attachmentId,d.status,d.created_at AS createdAt
                FROM legal_documents d ORDER BY d.issue_date DESC,d.created_at DESC"""));
        data.put("sealManagement", query("""
                SELECT s.id,s.seal_no AS sealNo,s.seal_name AS sealName,s.seal_type AS sealType,
                       s.custodian,s.registered_date AS registeredDate,s.status,s.usage_note AS usageNote
                FROM seal_management s ORDER BY s.seal_no"""));
        data.put("benefitRecords", query("""
                SELECT b.id,b.benefit_no AS benefitNo,b.user_id AS userId,u.full_name AS fullName,
                       b.benefit_type AS benefitType,b.provider,b.start_date AS startDate,
                       b.end_date AS endDate,b.monthly_amount AS monthlyAmount,b.status,b.note
                FROM benefit_records b LEFT JOIN users u ON u.id=b.user_id
                ORDER BY b.start_date DESC"""));
        // SỬA LỖI (TASK-040 nhóm 3, đường ĐỌC): truy vấn cũ THIẾU `source_component_id`, `source_type`,
        // `created_by` và tên người tạo. UI đọc `n.sourceType` để hiển thị "Từ BOQ"/"Thủ công"
        // (app/page.tsx:2522) ⇒ thiếu trường thì LUÔN hiện "Thủ công" dù dữ liệu ghi đúng. Đồng bộ nguyên
        // trạng JS scripts/system-route.mjs:697 (gồm cả JOIN `users` để lấy `createdByName`).
        data.put("materialNorms", query("""
                SELECT mn.id,mn.norm_code AS normCode,mn.project_id AS projectId,p.code AS projectCode,
                       p.name AS projectName,mn.subcategory_id AS subcategoryId,ms.name AS subcategoryName,
                       mn.item_name AS itemName,mn.material_id AS materialId,m.code AS materialCode,
                       m.name AS materialName,m.unit AS materialUnit,mn.base_uom AS baseUom,
                       mn.quantity_per_unit AS quantityPerUnit,mn.unit,mn.source_component_id AS sourceComponentId,
                       mn.source_type AS sourceType,mn.notes,mn.status,mn.active,
                       mn.created_by AS createdBy,u.full_name AS createdByName,
                       mn.created_at AS createdAt,mn.updated_at AS updatedAt
                FROM material_norms mn
                LEFT JOIN projects p ON p.id=mn.project_id
                LEFT JOIN material_subcategories ms ON ms.id=mn.subcategory_id
                LEFT JOIN materials m ON m.id=mn.material_id
                LEFT JOIN users u ON u.id=mn.created_by
                ORDER BY mn.updated_at DESC,mn.norm_code"""));
        data.put("workItems", query("""
                SELECT w.id,w.task_no AS taskNo,w.project_id AS projectId,w.work_group AS workGroup,
                       w.title,w.description,w.status,w.priority,w.progress,
                       w.department_code AS departmentCode,w.work_step AS workStep,
                       w.task_origin AS taskOrigin,w.required_output AS requiredOutput,
                       w.assigned_to AS assigneeUserId,u.full_name AS assigneeName,
                       w.due_at AS dueAt,w.assigned_at AS assignedAt,
                       w.completed_at AS completedAt,w.created_at AS createdAt
                FROM work_items w LEFT JOIN users u ON u.id=w.assigned_to
                ORDER BY w.created_at DESC LIMIT 500"""));
        data.put("taskNotifications", query("""
                SELECT n.id,n.user_id AS userId,n.work_item_id AS taskId,
                       COALESCE(NULLIF(n.title,''),n.body) AS message,n.read_at AS readAt,
                       n.sent_at AS sentAt,n.status,n.created_at AS createdAt
                FROM task_notifications n WHERE n.user_id=? ORDER BY n.created_at DESC LIMIT 200""", ctx.userId()));
        data.put("constructionDailyLogs", pids.isEmpty() ? List.of() : query("""
                SELECT l.id,l.log_no AS logNo,l.project_id AS projectId,p.code AS projectCode,
                       p.name AS projectName,l.warehouse_id AS warehouseId,l.work_date AS workDate,
                       l.shift,l.weather,l.work_content AS workContent,l.labor_count AS laborCount,
                       l.equipment_note AS equipmentNote,l.status,l.submitted_by AS submittedBy,
                       us.full_name AS submittedByName,l.approved_by AS approvedBy,
                       ua.full_name AS approvedByName,l.approved_at AS approvedAt,l.note,
                       l.created_at AS createdAt,l.updated_at AS updatedAt,
                       COALESCE(x.item_count,0) AS itemCount,COALESCE(x.completed_qty,0) AS completedQty
                FROM construction_daily_logs l
                JOIN projects p ON p.id=l.project_id
                LEFT JOIN users us ON us.id=l.submitted_by
                LEFT JOIN users ua ON ua.id=l.approved_by
                LEFT JOIN (SELECT log_id,COUNT(*) AS item_count,SUM(completed_qty) AS completed_qty
                           FROM construction_daily_log_items GROUP BY log_id) x ON x.log_id=l.id
                WHERE l.project_id IN (%s) ORDER BY l.work_date DESC,l.created_at DESC""".formatted(pidSql), params(pids)));

        // ══════════════════════════════════════════════════════════════════════════════════
        // TASK-050 — 4 KHOÁ BOOTSTRAP BỊ THIẾU (lỗi port đường ĐỌC lần thứ 10)
        // Cổng `tools/probe-bootstrap-keys.mjs` (#77) chỉ ra 4 khoá UI ĐỌC mà Java KHÔNG trả;
        // đọc mã hai phía xác nhận JS trả đủ 4 (`system-route.mjs:620,621,659,712`), bản Java
        // không có khoá nào ⇒ 4 màn hình RỖNG ngay sau cutover:
        //   • centralInventory        → Tồn kho tổng
        //   • centralReturns          → Trả hàng về kho tổng
        //   • companyAvailability     → Khả dụng toàn công ty
        //   • constructionDailyLogItems → dòng công việc của Nhật ký thi công
        // Các action GHI tương ứng ĐÃ port từ trước — đúng lớp lỗi "port GHI mà quên port ĐỌC".
        // ══════════════════════════════════════════════════════════════════════════════════

        // JS :620 — Trả hàng về kho tổng (kèm dòng hàng lồng `items` + số tệp đính kèm)
        List<Map<String, Object>> centralReturns = pids.isEmpty() ? List.of() : query("""
                SELECT cr.id,cr.return_no AS returnNo,cr.source_project_id AS sourceProjectId,
                       p.code AS projectCode,p.name AS projectName,
                       cr.source_warehouse_id AS sourceWarehouseId,sw.name AS sourceWarehouseName,
                       cr.central_warehouse_id AS centralWarehouseId,cr.requested_at AS requestedAt,
                       cr.approved_at AS approvedAt,cr.received_at AS receivedAt,cr.status,cr.note,
                       u.full_name AS requestedBy,
                       COALESCE(a.item_count,0) AS itemCount,COALESCE(a.proposed_qty,0) AS proposedQty,
                       COALESCE(a.accepted_qty,0) AS acceptedQty,COALESCE(a.rejected_qty,0) AS rejectedQty,
                       COALESCE(att.attachment_count,0) AS attachmentCount
                FROM central_returns cr
                JOIN projects p ON p.id=cr.source_project_id
                JOIN warehouses sw ON sw.id=cr.source_warehouse_id
                JOIN users u ON u.id=cr.requested_by
                LEFT JOIN (SELECT central_return_id,COUNT(*) AS item_count,SUM(proposed_qty) AS proposed_qty,
                                  SUM(accepted_qty) AS accepted_qty,SUM(rejected_qty) AS rejected_qty
                           FROM central_return_items GROUP BY central_return_id) a
                       ON a.central_return_id=cr.id
                LEFT JOIN (SELECT entity_id,COUNT(*) AS attachment_count FROM attachments
                           WHERE entity_type='central_return' GROUP BY entity_id) att
                       ON att.entity_id=cr.id
                WHERE cr.source_project_id IN (%s)
                ORDER BY cr.requested_at DESC LIMIT 300""".formatted(pidSql), params(pids));
        if (!centralReturns.isEmpty()) {
            List<String> returnIds = centralReturns.stream().map(r -> String.valueOf(r.get("id"))).toList();
            List<Map<String, Object>> returnItemRows = query("""
                    SELECT cri.id,cri.central_return_id AS centralReturnId,cri.material_id AS materialId,
                           m.code AS materialCode,m.name AS materialName,m.unit,
                           cri.proposed_qty AS proposedQty,cri.counted_qty AS countedQty,
                           cri.accepted_qty AS acceptedQty,cri.rejected_qty AS rejectedQty,
                           cri.condition_status AS conditionStatus,cri.unit_cost AS unitCost,
                           cri.rejection_reason AS rejectionReason
                    FROM central_return_items cri
                    JOIN materials m ON m.id=cri.material_id
                    WHERE cri.central_return_id IN (%s)
                    ORDER BY cri.central_return_id,m.code""".formatted(inClause(returnIds)), params(returnIds));
            centralReturns = centralReturns.stream().map(r -> {
                Map<String, Object> out = new LinkedHashMap<>(r);
                out.put("items", groupBy(returnItemRows, "centralReturnId", String.valueOf(r.get("id"))));
                return out;
            }).toList();
        }
        data.put("centralReturns", centralReturns);

        // JS :621 — Tồn kho tổng: chỉ vật tư có số dư <> 0 tại kho WH-CENTRAL (KHÔNG lọc theo dự án)
        List<Map<String, Object>> centralInventory = new ArrayList<>(query("""
                WITH movements AS (
                    SELECT material_id,to_warehouse_id AS warehouse_id,quantity AS qty
                    FROM stock_movements WHERE to_warehouse_id='WH-CENTRAL'
                    UNION ALL
                    SELECT material_id,from_warehouse_id,-quantity
                    FROM stock_movements WHERE from_warehouse_id='WH-CENTRAL'),
                     balances AS (SELECT material_id,COALESCE(SUM(qty),0) AS balance
                                  FROM movements GROUP BY material_id)
                SELECT m.id AS materialId,m.code AS materialCode,m.name AS materialName,m.unit,
                       m.`system`,m.min_stock AS minStock,COALESCE(b.balance,0) AS balance
                FROM materials m LEFT JOIN balances b ON b.material_id=m.id
                WHERE m.active=1 AND COALESCE(b.balance,0)<>0 ORDER BY m.code"""));
        centralInventory.forEach(row -> row.put("aliasText",
                String.join("; ", aliasesByMaterial.getOrDefault(
                        String.valueOf(row.get("materialId")), List.of()))));
        data.put("centralInventory", centralInventory);

        // JS :712 — Khả dụng toàn công ty: on_hand - reserved theo từng kho (KHÔNG lọc theo dự án)
        data.put("companyAvailability", query("""
                WITH movements AS (
                    SELECT material_id,to_warehouse_id AS warehouse_id,quantity AS qty
                    FROM stock_movements WHERE to_warehouse_id IS NOT NULL
                    UNION ALL
                    SELECT material_id,from_warehouse_id,-quantity
                    FROM stock_movements WHERE from_warehouse_id IS NOT NULL),
                     balances AS (SELECT material_id,warehouse_id,SUM(qty) AS on_hand
                                  FROM movements GROUP BY material_id,warehouse_id),
                     res AS (SELECT material_id,warehouse_id,SUM(quantity) AS reserved
                             FROM stock_reservations WHERE status='active'
                             GROUP BY material_id,warehouse_id)
                SELECT w.id AS warehouseId,w.code AS warehouseCode,w.name AS warehouseName,w.type,
                       w.project_id AS projectId,p.code AS projectCode,b.material_id AS materialId,
                       m.code AS materialCode,m.name AS materialName,m.unit,
                       COALESCE(b.on_hand,0) AS onHand,COALESCE(r.reserved,0) AS reserved,
                       CASE WHEN COALESCE(b.on_hand,0)-COALESCE(r.reserved,0)>0
                            THEN COALESCE(b.on_hand,0)-COALESCE(r.reserved,0) ELSE 0 END AS available
                FROM balances b
                JOIN warehouses w ON w.id=b.warehouse_id AND w.active=1
                JOIN materials m ON m.id=b.material_id
                LEFT JOIN projects p ON p.id=w.project_id
                LEFT JOIN res r ON r.material_id=b.material_id AND r.warehouse_id=b.warehouse_id
                WHERE w.type<>'transit' AND COALESCE(b.on_hand,0)<>0
                ORDER BY m.code,w.type,w.code"""));

        // JS :659 — DÒNG công việc của Nhật ký thi công (trước đây Java chỉ trả `constructionDailyLogs`)
        data.put("constructionDailyLogItems", pids.isEmpty() ? List.of() : query("""
                SELECT i.id,i.log_id AS logId,i.boq_item_id AS boqItemId,i.item_name AS itemName,
                       i.location,i.planned_qty AS plannedQty,i.completed_qty AS completedQty,i.unit,
                       i.labor_hours AS laborHours,i.photo_attachment_id AS photoAttachmentId,i.note
                FROM construction_daily_log_items i
                JOIN construction_daily_logs l ON l.id=i.log_id
                WHERE l.project_id IN (%s)""".formatted(pidSql), params(pids)));

        // JS :622 — vai trò kho với phạm vi SITE bị XOÁ TRẮNG 2 khoá kho tổng (đúng trước khi dựng result).
        // LƯU Ý: đây là bộ lọc theo VAI TRÒ, độc lập với bộ lọc theo MODULE ở dưới — port thiếu là LỖI BẢO MẬT.
        if ("warehouse".equals(roleBaseClean) && "site".equals(scopeKind)) {
            data.put("centralInventory", List.of());
            data.put("centralReturns", List.of());
        }

        // ══════════════════════════════════════════════════════════════════════════════════
        // TASK-050 — BỘ LỌC QUYỀN SAU KHI DỰNG `result` (JS `system-route.mjs:728-737`)
        // JS dựng ĐỦ dữ liệu rồi XOÁ TRẮNG theo module khi KHÔNG phải admin:
        //   const view = new Set(modulePermissions.filter(r => Number(r.canView)===1).map(r => r.moduleKey))
        // Bản Java port TRƯỚC ĐÂY KHÔNG CÓ bộ lọc này ⇒ người dùng thường nhận dữ liệu mà JS
        // không hề trả: `users`, `audits`, `activeSessions`, `serverInfo`, `trustStatus`, sổ kho,
        // BOQ/tài chính, danh mục vật tư, nhân sự… Vì cùng một SPA chạy trên cả hai lõi, khớp JS
        // chính là hành vi đúng của bản cutover.
        // GIỚI HẠN ĐÃ BIẾT: đầu vào `modulePermissions` của Java thiếu điều kiện `permission_expires_at`
        // và phép JOIN nhóm menu mà JS:684 có ⇒ tập quyền của Java có thể RỘNG HƠN ⇒ xoá trắng ÍT HƠN
        // JS một chút (không bao giờ nhiều hơn). Việc bù phần thiếu đó thuộc hồ sơ TASK-024.
        // ══════════════════════════════════════════════════════════════════════════════════
        if (!admin) {
            Set<String> view = new LinkedHashSet<>();
            Object permsObj = data.get("modulePermissions");
            if (permsObj instanceof List<?> permsList) {
                for (Object item : permsList) {
                    if (item instanceof Map<?, ?> perm && isOne(perm.get("canView"))) {
                        view.add(String.valueOf(perm.get("moduleKey")));
                    }
                }
            }
            if (!anyModule(view, "dashboard", "site_command", "dept_legal_hr", "dept_legal_labor",
                    "dept_legal_correspondence", "dept_legal_documents", "dept_legal_seal",
                    "dept_legal_benefits")) {
                blank(data, "staffDirectory");
            }
            if (!anyModule(view, "requests", "approvals", "purchasing", "supplier_catalog",
                    "receiving", "delivered")) {
                blank(data, "requests", "supplySteps", "purchaseOrders", "receipts");
            }
            if (!anyModule(view, "warehouse_receipt", "warehouse_issue", "inventory", "stocktake",
                    "central_warehouse", "material_catalog")) {
                blank(data, "inventory", "contractStockLedger", "contractStockBalances",
                        "stockReconciliations", "centralInventory", "centralReturns",
                        "companyAvailability", "transferOrders", "issues", "returns", "stockCounts");
            }
            if (!anyModule(view, "boq", "dept_project_boq", "dept_project_material", "project_progress",
                    "production", "construction", "capital_recovery", "payments", "dept_finance_recovery",
                    "dept_finance_payment_plan", "dept_finance_advance", "dept_finance_site_cost",
                    "dept_finance_cashbank", "dept_finance_documents", "dept_legal_correspondence",
                    "dept_legal_documents", "dept_legal_seal", "dept_legal_benefits", "dept_legal_hr",
                    "dept_legal_labor")) {
                blank(data, "boqItems", "boqSourceItems", "projectContracts", "boqVersions",
                        "boqImportBatches", "boqChangeHistory", "contractPayments", "productionReports",
                        "capitalRecoveryRecords", "constructionDailyLogs", "constructionDailyLogItems",
                        "paymentPlans", "advanceRequests", "siteExpenseClaims", "bankAccounts",
                        "cashbookEntries", "accountingVouchers", "officialCorrespondence",
                        "legalDocuments", "sealManagement", "benefitRecords");
            }
            if (!anyModule(view, "teams", "site_command", "construction")) {
                blank(data, "teams", "teamSubcontracts", "teamProductionRecords", "teamPayments",
                        "teamSettlements");
            }
            if (!anyModule(view, "material_catalog", "central_warehouse", "boq", "requests",
                    "purchasing", "dept_project_material", "material_norms")) {
                blank(data, "materials", "materialCategories", "materialSubcategories",
                        "materialAliases", "materialNorms");
            }
            if (!anyModule(view, "dept_plan_tasks", "dept_plan_assign", "dept_project_tasks",
                    "dept_project_assign", "site_command")) {
                blank(data, "workItems", "workItemEvents", "taskNotifications");
            }
            blank(data, "adminProjects", "adminMaterials", "adminMaterialCategories",
                    "adminMaterialSubcategories", "adminSuppliers", "users", "userScopes",
                    "userWarehouseScopes", "allModulePermissions", "audits", "activeSessions",
                    "emailRecipients");
            data.put("serverInfo", null);
            data.put("trustStatus", null);
            data.put("emailSettings", null);
        }

        return data;
    }

    // ---- helpers ----
    private List<Map<String, Object>> query(String sql, Object... args) {
        return jdbcTemplate.queryForList(sql, args);
    }

    private Map<String, Object> first(String sql, Object... args) {
        List<Map<String, Object>> rows = query(sql, args);
        return rows.isEmpty() ? Map.of() : rows.get(0);
    }

    private static List<Map<String, Object>> groupBy(List<Map<String, Object>> rows, String keyField, String keyValue) {
        return rows.stream()
                .filter(r -> String.valueOf(r.get(keyField)).equals(keyValue))
                .map(r -> (Map<String, Object>) new LinkedHashMap<>(r))
                .toList();
    }

    private static String inClause(List<String> ids) {
        return String.join(",", java.util.Collections.nCopies(ids.size(), "?"));
    }

    private static Object[] params(List<String> ids) {
        return ids.toArray();
    }

    // ── helpers của bộ lọc quyền bootstrap (TASK-050) ────────────────────────────────
    /** JS `system-route.mjs:386` — mã vai trò Ban giám đốc. */
    private static final Set<String> COMPANY_LEADERSHIP_ROLE_CODES =
            Set.of("director", "tgd", "ptgd", "giam_doc", "pho_giam_doc", "thuky", "thu_ky_tgd");

    /**
     * JS `system-route.mjs:387`:
     * {@code COMPANY_LEADERSHIP_ROLE_CODES.has(role.toLowerCase()) || effectiveRole(user)==="director"}.
     * Giữ NGUYÊN hai vế (mã vai trò thô + base_role) thay vì gộp về một vế.
     */
    private static boolean isCompanyLeadership(String roleCode, String roleBase) {
        String code = roleCode == null ? "" : roleCode.trim().toLowerCase();
        String base = roleBase == null ? "" : roleBase.trim().toLowerCase();
        return COMPANY_LEADERSHIP_ROLE_CODES.contains(code) || "director".equals(base);
    }

    /** `Number(row.canView) === 1` của JS — chấp nhận Integer 1, chuỗi "1" và Boolean true (tinyint(1)). */
    private static boolean isOne(Object value) {
        if (value instanceof Number number) return number.intValue() == 1;
        return Boolean.TRUE.equals(value) || "1".equals(String.valueOf(value));
    }

    /**
     * Cột cờ `tinyint(1)` của MySQL: JDBC trả về **Boolean**, KHÔNG phải Number (lớp lỗi #4).
     * Giữ đúng quy ước đã có trong kho (AdminSystemUseCase.isOne v.v.).
     */
    private static boolean isActiveOne(Object value) {
        if (value instanceof Number number) return number.intValue() == 1;
        return Boolean.TRUE.equals(value);
    }

    private static boolean anyModule(Set<String> view, String... moduleKeys) {
        for (String moduleKey : moduleKeys) {
            if (view.contains(moduleKey)) return true;
        }
        return false;
    }

    /** Xoá trắng một nhóm khoá về mảng rỗng — đúng cách JS gán `result.<khoá> = []`. */
    private static void blank(Map<String, Object> data, String... keys) {
        for (String key : keys) data.put(key, List.of());
    }
}