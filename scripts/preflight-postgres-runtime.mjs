// VNTECH PROPRIETARY SOURCE | V5.0.0 PostgreSQL runtime query preflight
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceFiles = ["scripts/system-route.mjs"];
const adapterFiles = ["app/api/system/route.ts"];
const runtimeFiles = ["scripts/system-route.mjs"];
const forbidden = [
  /GROUP\s+BY\s+mr\.id\b/i,
  /GROUP\s+BY\s+po\.id\b/i,
  /GROUP\s+BY\s+gr\.id\b/i,
  /GROUP\s+BY\s+si\.id\b/i,
  /GROUP\s+BY\s+sc\.id\b/i,
  /HAVING\s+balance\b/i,
  /COUNT\(mri\.id\)\s+AS\s+itemCount/i,
  /COUNT\(poi\.id\)\s+AS\s+itemCount/i,
  /COUNT\(gri\.id\)\s+AS\s+itemCount/i,
];
const requiredMarkers = [
  "LEFT JOIN (SELECT request_id,COUNT(*) AS item_count",
  "balances AS (SELECT material_id,warehouse_id,COALESCE(SUM(qty),0) AS balance",
  "reservations AS (SELECT material_id,warehouse_id",
  "w.project_id=p.id AND w.type='site'",
  "stock_reservations",
  "transfer_orders",
  "material_mar_approvals",
  "LEFT JOIN (SELECT purchase_order_id,COUNT(*) AS item_count",
  "LEFT JOIN (SELECT receipt_id,COUNT(*) AS item_count",
  "LEFT JOIN (SELECT issue_id,COUNT(*) AS item_count",
  "LEFT JOIN (SELECT return_id,COUNT(*) AS item_count",
  "LEFT JOIN (SELECT stock_count_id,COUNT(*) AS item_count",
  "(SELECT COUNT(*) FROM material_request_items mri WHERE mri.request_id=mr.id) AS itemCount",
  "mri.delivered_qty AS actualDeliveredQty",
  "material_aliases",
  "central_returns",
  "permission_expires_at",
  "requestExceptions",
];

function inspectFiles(files, mode) {
  for (const rel of files) {
    const path = join(root, rel);
    if (!existsSync(path)) throw new Error(`Missing PostgreSQL ${mode} source: ${rel}`);
    const text = readFileSync(path, "utf8");
    for (const rx of forbidden) {
      if (rx.test(text)) throw new Error(`Unsafe SQLite-style aggregate query remains in ${rel}: ${rx}`);
    }
    for (const marker of requiredMarkers) {
      if (!text.includes(marker)) throw new Error(`PostgreSQL-safe aggregate marker missing in ${rel}: ${marker}`);
    }
  }
}

export function runStaticPreflight() {
  // V5.3.0 has a single runtime implementation. The Next route is only a thin adapter.
  inspectFiles(sourceFiles, "source");
  for (const rel of adapterFiles) {
    const path=join(root,rel); if(!existsSync(path)) throw new Error(`Missing PostgreSQL route adapter: ${rel}`);
    const text=readFileSync(path,"utf8");
    for (const marker of ["scripts/system-route.mjs","runtimeGET","runtimePOST"]) if(!text.includes(marker)) throw new Error(`PostgreSQL route adapter marker missing in ${rel}: ${marker}`);
  }
  console.log("PostgreSQL runtime SQL static preflight: DAT.");
}

export function runPackagedPreflight() {
  // Runtime image intentionally does not ship app/ TypeScript source. Validate the packaged route only.
  inspectFiles(runtimeFiles, "packaged runtime");
  console.log("PostgreSQL packaged runtime SQL preflight: DAT.");
}

export async function runLivePreflight() {
  // Never require source files inside the production image. The build stage already ran runStaticPreflight().
  runPackagedPreflight();
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("--live requires DATABASE_URL.");
  const pgModule = await import("pg");
  const pgApi = pgModule.default ?? pgModule;
  const Pool = pgApi.Pool ?? pgModule.Pool;
  if (typeof Pool !== "function") throw new Error("Cannot load pg.Pool for live preflight.");
  const pool = new Pool({ connectionString, max: 2, connectionTimeoutMillis: 10000 });

  const probes = [
    ["users-count", `SELECT COUNT(*) AS count FROM users`],
    ["request-summary", `SELECT mr.id,mr.request_no AS requestNo,mr.project_id AS projectId,p.code AS projectCode,p.name AS projectName,mr.team_id AS teamId,t.name AS teamName,u.full_name AS requestedBy,mr.requested_at AS requestedAt,mr.needed_at AS neededAt,mr.priority,mr.area,mr.purpose,mr.status,mr.supply_status AS supplyStatus,mr.approval_stage AS approvalStage,mr.total_estimated_value AS totalEstimatedValue,COALESCE(ri.item_count,0) AS itemCount,COALESCE(ri.total_qty,0) AS totalQty,COALESCE(ri.received_qty,0) AS receivedQty,COALESCE(ri.issued_qty,0) AS issuedQty FROM material_requests mr JOIN projects p ON p.id=mr.project_id LEFT JOIN teams t ON t.id=mr.team_id JOIN users u ON u.id=mr.requested_by LEFT JOIN (SELECT request_id,COUNT(*) AS item_count,COALESCE(SUM(requested_qty),0) AS total_qty,COALESCE(SUM(received_qty),0) AS received_qty,COALESCE(SUM(issued_qty),0) AS issued_qty FROM material_request_items GROUP BY request_id) ri ON ri.request_id=mr.id WHERE 1=0 ORDER BY mr.requested_at DESC LIMIT 1`],
    ["inventory", `WITH movements AS (SELECT sm.material_id AS material_id,sm.to_warehouse_id AS warehouse_id,sm.quantity AS qty FROM stock_movements sm WHERE sm.to_warehouse_id IS NOT NULL UNION ALL SELECT sm.material_id,sm.from_warehouse_id,-sm.quantity FROM stock_movements sm WHERE sm.from_warehouse_id IS NOT NULL), balances AS (SELECT material_id,warehouse_id,COALESCE(SUM(qty),0) AS balance FROM movements GROUP BY material_id,warehouse_id), reservations AS (SELECT material_id,warehouse_id,COALESCE(SUM(quantity),0) AS reserved FROM stock_reservations WHERE status='active' GROUP BY material_id,warehouse_id) SELECT p.id AS projectId,p.code AS projectCode,p.name AS projectName,w.id AS warehouseId,w.code AS warehouseCode,w.name AS warehouseName,w.type,m.id AS materialId,m.code AS materialCode,m.name AS materialName,m.unit,m.min_stock AS minStock,COALESCE(mv.balance,0) AS balance,COALESCE(r.reserved,0) AS reserved,CASE WHEN COALESCE(mv.balance,0)-COALESCE(r.reserved,0)>0 THEN COALESCE(mv.balance,0)-COALESCE(r.reserved,0) ELSE 0 END AS available FROM projects p JOIN warehouses w ON w.active=1 AND w.project_id=p.id AND w.type='site' CROSS JOIN materials m LEFT JOIN balances mv ON mv.warehouse_id=w.id AND mv.material_id=m.id LEFT JOIN reservations r ON r.warehouse_id=w.id AND r.material_id=m.id WHERE 1=0 ORDER BY p.code,w.code,m.code LIMIT 1`],
    ["purchase-orders", `SELECT po.id,po.po_no AS poNo,po.request_id AS requestId,mr.request_no AS requestNo,po.project_id AS projectId,p.code AS projectCode,s.name AS supplierName,po.receiving_warehouse_id AS receivingWarehouseId,po.ordered_at AS orderedAt,po.eta,po.delivery_queued_at AS deliveryQueuedAt,po.delivery_completed_at AS deliveryCompletedAt,po.status,po.total_value AS totalValue,COALESCE(poa.item_count,0) AS itemCount,COALESCE(poa.ordered_qty,0) AS orderedQty,COALESCE(poa.received_qty,0) AS receivedQty,COALESCE(gra.actual_delivered_qty,0) AS actualDeliveredQty FROM purchase_orders po JOIN projects p ON p.id=po.project_id JOIN suppliers s ON s.id=po.supplier_id LEFT JOIN material_requests mr ON mr.id=po.request_id LEFT JOIN (SELECT purchase_order_id,COUNT(*) AS item_count,COALESCE(SUM(ordered_qty),0) AS ordered_qty,COALESCE(SUM(received_qty),0) AS received_qty FROM purchase_order_items GROUP BY purchase_order_id) poa ON poa.purchase_order_id=po.id LEFT JOIN (SELECT actual_poi.purchase_order_id,COALESCE(SUM(gri.received_qty),0) AS actual_delivered_qty FROM goods_receipt_items gri JOIN purchase_order_items actual_poi ON actual_poi.id=gri.purchase_order_item_id GROUP BY actual_poi.purchase_order_id) gra ON gra.purchase_order_id=po.id WHERE 1=0 ORDER BY po.ordered_at DESC LIMIT 1`],
    ["receipts", `SELECT gr.id,gr.receipt_no AS receiptNo,gr.purchase_order_id AS purchaseOrderId,po.request_id AS requestId,po.po_no AS poNo,p.id AS projectId,p.code AS projectCode,s.name AS supplierName,w.name AS warehouseName,gr.received_at AS receivedAt,gr.delivery_note_no AS deliveryNoteNo,gr.qc_status AS qcStatus,gr.document_status AS documentStatus,gr.certificate_status AS certificateStatus,gr.delivery_document_status AS deliveryDocumentStatus,gr.bch_confirmation_status AS bchConfirmationStatus,gr.bch_confirmed_at AS bchConfirmedAt,gr.bch_comment AS bchComment,confirmer.full_name AS bchConfirmedByName,gr.posting_status AS postingStatus,COALESCE(gra.item_count,0) AS itemCount,COALESCE(gra.actual_delivered_qty,0) AS actualDeliveredQty,COALESCE(gra.accepted_qty,0) AS acceptedQty,COALESCE(gra.rejected_qty,0) AS rejectedQty,COALESCE(atta.attachment_count,0) AS attachmentCount FROM goods_receipts gr JOIN purchase_orders po ON po.id=gr.purchase_order_id JOIN projects p ON p.id=po.project_id JOIN suppliers s ON s.id=po.supplier_id JOIN warehouses w ON w.id=gr.warehouse_id LEFT JOIN users confirmer ON confirmer.id=gr.bch_confirmed_by LEFT JOIN (SELECT receipt_id,COUNT(*) AS item_count,COALESCE(SUM(received_qty),0) AS actual_delivered_qty,COALESCE(SUM(accepted_qty),0) AS accepted_qty,COALESCE(SUM(rejected_qty),0) AS rejected_qty FROM goods_receipt_items GROUP BY receipt_id) gra ON gra.receipt_id=gr.id LEFT JOIN (SELECT entity_id,COUNT(*) AS attachment_count FROM attachments WHERE entity_type='goods_receipt' GROUP BY entity_id) atta ON atta.entity_id=gr.id WHERE 1=0 ORDER BY gr.received_at DESC LIMIT 1`],
    ["stock-issues", `SELECT si.id,si.issue_no AS issueNo,si.project_id AS projectId,si.team_id AS teamId,p.code AS projectCode,t.name AS teamName,si.issued_at AS issuedAt,si.status,si.received_by_name AS receivedByName,COALESCE(sia.item_count,0) AS itemCount,COALESCE(sia.total_qty,0) AS totalQty,COALESCE(sia.installed_qty,0) AS installedQty FROM stock_issues si JOIN projects p ON p.id=si.project_id JOIN teams t ON t.id=si.team_id LEFT JOIN (SELECT issue_id,COUNT(*) AS item_count,COALESCE(SUM(quantity),0) AS total_qty,COALESCE(SUM(installed_qty),0) AS installed_qty FROM stock_issue_items GROUP BY issue_id) sia ON sia.issue_id=si.id WHERE 1=0 ORDER BY si.issued_at DESC LIMIT 1`],
    ["returns", `SELECT mr.id,mr.return_no AS returnNo,p.code AS projectCode,t.name AS teamName,mr.returned_at AS returnedAt,mr.status,mr.returned_by_name AS returnedByName,COALESCE(mra.item_count,0) AS itemCount,COALESCE(mra.accepted_qty,0) AS acceptedQty FROM material_returns mr JOIN projects p ON p.id=mr.project_id JOIN teams t ON t.id=mr.team_id LEFT JOIN (SELECT return_id,COUNT(*) AS item_count,COALESCE(SUM(accepted_qty),0) AS accepted_qty FROM material_return_items GROUP BY return_id) mra ON mra.return_id=mr.id WHERE 1=0 ORDER BY mr.returned_at DESC LIMIT 1`],
    ["stock-counts", `SELECT sc.id,sc.count_no AS countNo,sc.project_id AS projectId,p.code AS projectCode,sc.warehouse_id AS warehouseId,w.name AS warehouseName,sc.count_type AS countType,sc.counted_at AS countedAt,sc.status,COALESCE(sca.item_count,0) AS itemCount,COALESCE(sca.total_variance,0) AS totalVariance FROM stock_counts sc JOIN projects p ON p.id=sc.project_id JOIN warehouses w ON w.id=sc.warehouse_id LEFT JOIN (SELECT stock_count_id,COUNT(*) AS item_count,COALESCE(SUM(ABS(variance_qty)),0) AS total_variance FROM stock_count_items GROUP BY stock_count_id) sca ON sca.stock_count_id=sc.id WHERE 1=0 ORDER BY sc.counted_at DESC LIMIT 1`],
    ["request-detail", `SELECT mr.id,mr.request_no AS requestNo,mr.project_id AS projectId,p.code AS projectCode,p.name AS projectName,mr.status,mr.approval_stage AS approvalStage,mr.needed_at AS neededAt,mr.area,mr.total_estimated_value AS total,u.full_name AS requesterName,u.email AS requesterEmail,(SELECT COUNT(*) FROM material_request_items mri WHERE mri.request_id=mr.id) AS itemCount FROM material_requests mr JOIN projects p ON p.id=mr.project_id JOIN users u ON u.id=mr.requested_by WHERE 1=0`],
    ["hf07-form-config", `SELECT id,form_key AS formKey,field_key AS fieldKey,display_name AS displayName,data_type AS dataType,source_kind AS sourceKind,visible,required,importable,exportable,editable,sort_order AS sortOrder,options_json AS optionsJson,system_locked AS systemLocked,active FROM form_field_config WHERE active=1 ORDER BY form_key,sort_order,display_name LIMIT 1`],
    ["v49-material-aliases", `SELECT ma.id,ma.material_id AS materialId,ma.alias_name AS aliasName,ma.normalized_name AS normalizedName FROM material_aliases ma WHERE 1=0`],
    ["v49-central-returns", `SELECT cr.id,cr.return_no AS returnNo,cri.material_id AS materialId,cri.proposed_qty AS proposedQty,cri.accepted_qty AS acceptedQty FROM central_returns cr LEFT JOIN central_return_items cri ON cri.central_return_id=cr.id WHERE 1=0`],
    ["v49-delivery-aggregation", `SELECT mri.id,mri.delivered_qty AS actualDeliveredQty,mri.received_qty AS confirmedQty,mri.closed_qty AS closedQty,poi.system_code AS systemCode,poi.planned_delivery_at AS plannedDeliveryAt FROM material_request_items mri LEFT JOIN purchase_order_items poi ON poi.request_item_id=mri.id WHERE 1=0`],
    ["v49-granular-permissions", `SELECT can_view,can_use,can_create,can_edit,can_approve,can_export,permission_expires_at FROM user_module_permissions WHERE 1=0`],
    ["v530-transfer", `SELECT t.id,t.transfer_no,t.status,i.material_id,i.requested_qty,i.approved_qty,i.shipped_qty,i.received_qty,i.rejected_qty,i.lost_qty FROM transfer_orders t LEFT JOIN transfer_order_items i ON i.transfer_order_id=t.id WHERE 1=0`],
    ["v530-reservation", `SELECT warehouse_id,material_id,quantity,status FROM stock_reservations WHERE 1=0`],
    ["v530-mar", `SELECT project_id,material_id,status,approval_no FROM material_mar_approvals WHERE 1=0`],
    ["v530-project-close", `SELECT project_id,check_key,status,detail FROM project_close_checks WHERE 1=0`],
    ["hf07-boq-confirmed-actual", `SELECT pbi.id,pbi.project_id AS projectId,p.code AS projectCode,p.name AS projectName,pbi.line_no AS lineNo,pbi.boq_code AS boqCode,pbi.contract_code AS contractCode,pbi.contract_material_code AS contractMaterialCode,pbi.approved_material_code AS approvedMaterialCode,pbi.material_id AS materialId,m.code AS materialCode,m.name AS materialName,m.unit,pbi.contract_qty AS contractQty,pbi.remeasured_qty AS remeasuredQty,
    COALESCE((SELECT SUM(mri.ordered_qty) FROM material_request_items mri JOIN material_requests mr2 ON mr2.id=mri.request_id WHERE mr2.project_id=pbi.project_id AND mri.material_id=pbi.material_id AND mr2.status<>'cancelled' AND (COALESCE(pbi.boq_code,'')='' OR COALESCE(mri.boq_code,'')=COALESCE(pbi.boq_code,''))),0) AS orderedQty,
    COALESCE((SELECT SUM(gri.accepted_qty) FROM goods_receipt_items gri JOIN goods_receipts gr ON gr.id=gri.receipt_id AND gr.bch_confirmation_status='confirmed' JOIN purchase_order_items poi ON poi.id=gri.purchase_order_item_id JOIN material_request_items mri ON mri.id=poi.request_item_id JOIN material_requests mr2 ON mr2.id=mri.request_id WHERE mr2.project_id=pbi.project_id AND mri.material_id=pbi.material_id AND mr2.status<>'cancelled' AND (COALESCE(pbi.boq_code,'')='' OR COALESCE(mri.boq_code,'')=COALESCE(pbi.boq_code,''))),0) AS receivedQty,
    COALESCE((SELECT SUM(mri.issued_qty) FROM material_request_items mri JOIN material_requests mr2 ON mr2.id=mri.request_id WHERE mr2.project_id=pbi.project_id AND mri.material_id=pbi.material_id AND mr2.status<>'cancelled'),0) AS issuedQty
    FROM project_boq_items pbi JOIN projects p ON p.id=pbi.project_id JOIN materials m ON m.id=pbi.material_id WHERE 1=0 ORDER BY p.code,pbi.line_no LIMIT 1`],
  ];

  try {
    for (const [name, sql] of probes) {
      try { await pool.query(sql); }
      catch (error) { throw new Error(`PostgreSQL live query preflight failed at ${name}: ${error instanceof Error ? error.message : String(error)}`); }
    }
    console.log(`PostgreSQL runtime SQL live preflight: DAT · ${probes.length} probes.`);
  } finally {
    await pool.end();
  }
}

const isDirectRun = Boolean(process.argv[1]) && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  if (process.argv.includes("--live")) await runLivePreflight();
  else if (process.argv.includes("--packaged")) runPackagedPreflight();
  else runStaticPreflight();
}
