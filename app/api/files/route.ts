import { zipSync, strToU8 } from "fflate";
import { getRuntimeEnv, type RuntimeEnv } from "../../../lib/runtime-env";

let env: RuntimeEnv;
async function loadEnv() { env = await getRuntimeEnv(); }

const COOKIE = "mep_session";
const MAX_SIZE = 20 * 1024 * 1024;

type CurrentUser = { id: string; role: string; roleBase?: string };
function getCookie(request: Request, name: string) {
  const source = request.headers.get("cookie") ?? "";
  const match = source.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}
function bytesToHex(bytes: Uint8Array) { return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(""); }
async function sha256(value: string) { const result = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)); return bytesToHex(new Uint8Array(result)); }
async function currentUser(request: Request): Promise<CurrentUser | null> {
  const email = request.headers.get("oai-authenticated-user-email");
  if (email) {
    const row = await env.DB.prepare(`SELECT u.id,u.role,COALESCE(rc.base_role,u.role) AS roleBase FROM users u LEFT JOIN role_catalog rc ON rc.code=u.role WHERE lower(u.email)=lower(?) AND u.active=1`).bind(email).first<CurrentUser>();
    if (row) return row;
  }
  const token = getCookie(request, COOKIE);
  if (!token) return null;
  const row = await env.DB.prepare(`SELECT u.id,u.role,COALESCE(rc.base_role,u.role) AS roleBase FROM sessions s JOIN users u ON u.id=s.user_id LEFT JOIN role_catalog rc ON rc.code=u.role WHERE s.token_hash=? AND s.expires_at>? AND u.active=1`).bind(await sha256(token), new Date().toISOString()).first<CurrentUser>();
  return row ?? null;
}
function safeName(name: string) { return name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").slice(0, 120) || "tai-lieu"; }
async function entityProject(entityType: string, entityId: string) {
  if (entityType === "material_request") return env.DB.prepare(`SELECT project_id AS projectId FROM material_requests WHERE id=?`).bind(entityId).first<{ projectId: string }>();
  if (entityType === "goods_receipt") return env.DB.prepare(`SELECT po.project_id AS projectId FROM goods_receipts gr JOIN purchase_orders po ON po.id=gr.purchase_order_id WHERE gr.id=?`).bind(entityId).first<{ projectId: string }>();
  if (entityType === "central_return") return env.DB.prepare(`SELECT source_project_id AS projectId FROM central_returns WHERE id=?`).bind(entityId).first<{ projectId: string }>();
  return null;
}
async function moduleAllowed(user: CurrentUser, entityType: string, write: boolean) {
  if (user.role === "admin") return true;
  if (write && entityType === "material_request" && !["commander","project"].includes(String(user.roleBase || user.role))) return false;
  const moduleKeys = entityType === "goods_receipt" ? ["receiving", "delivered"] : entityType === "central_return" ? ["central_warehouse"] : ["requests", "approvals"];
  const placeholders = moduleKeys.map(() => "?").join(",");
  const permissionSql = write && entityType === "central_return" ? "(can_edit=1 OR can_approve=1)" : `${write ? "can_edit" : "can_view"}=1`;
  const row = await env.DB.prepare(`SELECT 1 AS ok FROM user_module_permissions WHERE user_id=? AND module_key IN (${placeholders}) AND ${permissionSql} LIMIT 1`).bind(user.id, ...moduleKeys).first<{ ok: number }>();
  return Boolean(row?.ok);
}

function toArrayBuffer(value: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(value.byteLength);
  copy.set(value);
  return copy.buffer;
}
async function sha256Bytes(value: Uint8Array) { const result = await crypto.subtle.digest("SHA-256", toArrayBuffer(value)); return bytesToHex(new Uint8Array(result)); }
type ArchiveSqlRow = Record<string, unknown>;
type ProjectArchiveRow = ArchiveSqlRow & { id: string; code: string; name: string; status: string };
type AttachmentArchiveRow = ArchiveSqlRow & { id: string; storage_key: string; file_name: string; mime_type: string | null };
type AttachmentArchiveManifestRow = { id: string; fileName: string; mimeType: string | null; path: string; sha256: string };
async function rows<T extends ArchiveSqlRow = ArchiveSqlRow>(sql: string, ...binds: unknown[]): Promise<T[]> {
  const result = await env.DB.prepare(sql).bind(...binds).all<T>();
  return result.results ?? [];
}
async function projectArchiveDataset(projectId:string){
  const project=await env.DB.prepare(`SELECT * FROM projects WHERE id=?`).bind(projectId).first<ProjectArchiveRow>();
  if(!project)throw new Error("Không tìm thấy dự án.");
  const tables:Record<string,ArchiveSqlRow[]>={};
  const add=async(name:string,sql:string,...binds:unknown[])=>{tables[name]=await rows(sql,...binds);};
  await add("projects",`SELECT * FROM projects WHERE id=?`,projectId);
  await add("project_contracts",`SELECT * FROM project_contracts WHERE project_id=?`,projectId);
  await add("boq_versions",`SELECT * FROM boq_versions WHERE project_id=?`,projectId);
  await add("boq_import_batches",`SELECT * FROM boq_import_batches WHERE project_id=?`,projectId);
  await add("boq_source_items",`SELECT * FROM boq_source_items WHERE project_id=?`,projectId);
  await add("project_boq_items",`SELECT * FROM project_boq_items WHERE project_id=?`,projectId);
  await add("boq_change_history",`SELECT * FROM boq_change_history WHERE project_id=?`,projectId);
  await add("boq_mapping_runs",`SELECT * FROM boq_mapping_runs WHERE project_id=?`,projectId);
  await add("boq_mapping_candidates",`SELECT c.* FROM boq_mapping_candidates c JOIN boq_mapping_runs r ON r.id=c.run_id WHERE r.project_id=?`,projectId);
  await add("boq_mapping_audit",`SELECT a.* FROM boq_mapping_audit a JOIN boq_mapping_runs r ON r.id=a.run_id WHERE r.project_id=?`,projectId);
  await add("material_requests",`SELECT * FROM material_requests WHERE project_id=?`,projectId);
  await add("material_request_items",`SELECT i.* FROM material_request_items i JOIN material_requests r ON r.id=i.request_id WHERE r.project_id=?`,projectId);
  await add("approvals",`SELECT a.* FROM approvals a JOIN material_requests r ON r.id=a.request_id WHERE r.project_id=?`,projectId);
  await add("approval_stage_decisions",`SELECT d.* FROM approval_stage_decisions d JOIN material_requests r ON r.id=d.request_id WHERE r.project_id=?`,projectId);
  await add("request_comments",`SELECT c.* FROM request_comments c JOIN material_requests r ON r.id=c.request_id WHERE r.project_id=?`,projectId);
  await add("supply_workflow_steps",`SELECT s.* FROM supply_workflow_steps s JOIN material_requests r ON r.id=s.request_id WHERE r.project_id=?`,projectId);
  await add("purchase_orders",`SELECT * FROM purchase_orders WHERE project_id=?`,projectId);
  await add("purchase_order_items",`SELECT i.* FROM purchase_order_items i JOIN purchase_orders p ON p.id=i.purchase_order_id WHERE p.project_id=?`,projectId);
  await add("goods_receipts",`SELECT g.* FROM goods_receipts g JOIN purchase_orders p ON p.id=g.purchase_order_id WHERE p.project_id=?`,projectId);
  await add("goods_receipt_items",`SELECT i.* FROM goods_receipt_items i JOIN goods_receipts g ON g.id=i.receipt_id JOIN purchase_orders p ON p.id=g.purchase_order_id WHERE p.project_id=?`,projectId);
  await add("procurement_allocations",`SELECT * FROM procurement_allocations WHERE project_id=?`,projectId);
  await add("warehouses",`SELECT * FROM warehouses WHERE project_id=?`,projectId);
  await add("warehouse_locations",`SELECT l.* FROM warehouse_locations l JOIN warehouses w ON w.id=l.warehouse_id WHERE w.project_id=?`,projectId);
  await add("stock_movements",`SELECT * FROM stock_movements WHERE project_id=?`,projectId);
  await add("contract_stock_ledger",`SELECT * FROM contract_stock_ledger WHERE project_id=?`,projectId);
  await add("contract_stock_reconciliations",`SELECT * FROM contract_stock_reconciliations WHERE project_id=?`,projectId);
  await add("contract_ownership_transfers",`SELECT * FROM contract_ownership_transfers WHERE source_project_id=? OR destination_project_id=?`,projectId,projectId);
  await add("stock_reservations",`SELECT * FROM stock_reservations WHERE project_id=?`,projectId);
  await add("stock_issues",`SELECT * FROM stock_issues WHERE project_id=?`,projectId);
  await add("stock_issue_items",`SELECT i.* FROM stock_issue_items i JOIN stock_issues s ON s.id=i.issue_id WHERE s.project_id=?`,projectId);
  await add("material_returns",`SELECT * FROM material_returns WHERE project_id=?`,projectId);
  await add("material_return_items",`SELECT i.* FROM material_return_items i JOIN material_returns r ON r.id=i.return_id WHERE r.project_id=?`,projectId);
  await add("stock_counts",`SELECT * FROM stock_counts WHERE project_id=?`,projectId);
  await add("stock_count_items",`SELECT i.* FROM stock_count_items i JOIN stock_counts s ON s.id=i.stock_count_id WHERE s.project_id=?`,projectId);
  await add("transfer_orders",`SELECT * FROM transfer_orders WHERE source_project_id=? OR destination_project_id=?`,projectId,projectId);
  await add("transfer_order_items",`SELECT i.* FROM transfer_order_items i JOIN transfer_orders t ON t.id=i.transfer_order_id WHERE t.source_project_id=? OR t.destination_project_id=?`,projectId,projectId);
  await add("central_returns",`SELECT * FROM central_returns WHERE source_project_id=?`,projectId);
  await add("central_return_items",`SELECT i.* FROM central_return_items i JOIN central_returns r ON r.id=i.central_return_id WHERE r.source_project_id=?`,projectId);
  await add("teams",`SELECT * FROM teams WHERE project_id=?`,projectId);
  await add("team_subcontracts",`SELECT * FROM team_subcontracts WHERE project_id=?`,projectId);
  await add("team_production_records",`SELECT * FROM team_production_records WHERE project_id=?`,projectId);
  await add("team_payments",`SELECT * FROM team_payments WHERE project_id=?`,projectId);
  await add("team_settlements",`SELECT * FROM team_settlements WHERE project_id=?`,projectId);
  await add("production_reports",`SELECT * FROM production_reports WHERE project_id=?`,projectId);
  await add("capital_recovery_records",`SELECT * FROM capital_recovery_records WHERE project_id=?`,projectId);
  await add("contract_payments",`SELECT * FROM contract_payments WHERE project_id=?`,projectId);
  await add("work_items",`SELECT * FROM work_items WHERE project_id=?`,projectId);
  await add("work_item_events",`SELECT e.* FROM work_item_events e JOIN work_items w ON w.id=e.work_item_id WHERE w.project_id=?`,projectId);
  await add("task_notifications",`SELECT n.* FROM task_notifications n JOIN work_items w ON w.id=n.work_item_id WHERE w.project_id=?`,projectId);
  await add("project_close_checks",`SELECT * FROM project_close_checks WHERE project_id=?`,projectId);
  await add("approval_email_recipients",`SELECT * FROM approval_email_recipients WHERE project_id=?`,projectId);
  await add("document_sequences",`SELECT * FROM document_sequences WHERE project_id=?`,projectId);
  await add("user_project_scopes",`SELECT * FROM user_project_scopes WHERE project_id=?`,projectId);
  await add("user_warehouse_scopes",`SELECT s.* FROM user_warehouse_scopes s JOIN warehouses w ON w.id=s.warehouse_id WHERE w.project_id=?`,projectId);
  await add("organization_units",`SELECT * FROM organization_units WHERE project_id=?`,projectId);
  await add("material_mar_approvals",`SELECT * FROM material_mar_approvals WHERE project_id=?`,projectId);
  const attachmentRows=await rows<AttachmentArchiveRow>(`SELECT a.* FROM attachments a WHERE (a.entity_type='material_request' AND a.entity_id IN (SELECT id FROM material_requests WHERE project_id=?)) OR (a.entity_type='goods_receipt' AND a.entity_id IN (SELECT g.id FROM goods_receipts g JOIN purchase_orders p ON p.id=g.purchase_order_id WHERE p.project_id=?)) OR (a.entity_type='central_return' AND a.entity_id IN (SELECT id FROM central_returns WHERE source_project_id=?))`,projectId,projectId,projectId);
  tables.attachments=attachmentRows;
  const entityIds:string[]=[];for(const list of Object.values(tables))for(const row of list||[])if(row?.id)entityIds.push(String(row.id));
  if(entityIds.length){const chunks:ArchiveSqlRow[]=[];for(let i=0;i<entityIds.length;i+=250){const part=entityIds.slice(i,i+250),marks=part.map(()=>'?').join(',');chunks.push(...await rows(`SELECT * FROM audit_logs WHERE entity_id IN (${marks})`,...part));}tables.audit_logs=chunks;}else tables.audit_logs=[];
  return {project,tables,attachments:attachmentRows};
}
async function makeProjectArchive(projectId:string,user:CurrentUser){
  const {project,tables,attachments}=await projectArchiveDataset(projectId);
  const files:Record<string,Uint8Array>={};let recordCount=0;
  for(const [name,list] of Object.entries(tables)){recordCount+=(list||[]).length;files[`data/${name}.json`]=strToU8(JSON.stringify(list,null,2));}
  const attachmentManifest:AttachmentArchiveManifestRow[]=[];
  for(const a of attachments){const obj=await env.BUCKET.get(a.storage_key);if(!obj)throw new Error(`Thiếu tệp đính kèm ${a.file_name}; không thể xác nhận archive đầy đủ.`);const bytes=new Uint8Array(await new Response(obj.body).arrayBuffer());const rel=`attachments/${safeName(a.id)}-${safeName(a.file_name)}`;files[rel]=bytes;attachmentManifest.push({id:a.id,fileName:a.file_name,mimeType:a.mime_type,path:rel,sha256:await sha256Bytes(bytes)});}
  const manifest={format:"VNTECH_PROJECT_OFFLINE_ARCHIVE_V1",schemaVersion:"5.3.0-FULL-W2-0047",generatedAt:new Date().toISOString(),generatedBy:user.id,project:{id:project.id,code:project.code,name:project.name,status:project.status},recordCount,attachmentCount:attachments.length,tables:Object.fromEntries(Object.entries(tables).map(([k,v])=>[k,(v||[]).length])),attachments:attachmentManifest};
  files['MANIFEST.json']=strToU8(JSON.stringify(manifest,null,2));files['README.txt']=strToU8(`VNTECH ERP PROJECT OFFLINE ARCHIVE\nProject: ${project.code} - ${project.name}\nGenerated: ${manifest.generatedAt}\nRecords: ${recordCount}\nAttachments: ${attachments.length}\nKeep this ZIP unchanged. Use MANIFEST.json and SHA-256 for integrity verification.\n`);
  const zipped=zipSync(files,{level:6});const archiveSha=await sha256Bytes(zipped);const fileName=`VNTECH_PROJECT_${safeName(project.code)}_OFFLINE_${new Date().toISOString().slice(0,10).replaceAll('-','')}.zip`;const archiveId=`PAR_${crypto.randomUUID()}`,stamp=new Date().toISOString();
  await env.DB.prepare(`INSERT INTO project_archives(id,project_id,project_code,project_name,file_name,sha256,byte_size,record_count,attachment_count,schema_version,status,generated_by,generated_at,downloaded_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(archiveId,project.id,project.code,project.name,fileName,archiveSha,zipped.byteLength,recordCount,attachments.length,manifest.schemaVersion,'verified',user.id,stamp,stamp).run();
  return {zipped,fileName,archiveId,archiveSha,recordCount,attachmentCount:attachments.length};
}
async function assertEntityAccess(user: CurrentUser, entityType: string, entityId: string, write = false) {
  const entity = await entityProject(entityType, entityId);
  if (!entity?.projectId) throw new Error("Chứng từ không tồn tại hoặc loại hồ sơ không được hỗ trợ.");
  if (user.role !== "admin") {
    const scope = await env.DB.prepare(`SELECT permission FROM user_project_scopes WHERE user_id=? AND project_id=?`).bind(user.id, entity.projectId).first<{ permission: string }>();
    if (!scope) throw new Error("Tài khoản không được truy cập hồ sơ của dự án này.");
    if (write && !["write", "approve", "admin"].includes(String(scope.permission))) throw new Error("Tài khoản chỉ được xem hồ sơ dự án này.");
  }
  if (!(await moduleAllowed(user, entityType, write))) throw new Error(write ? "Tài khoản chưa được phép tải hồ sơ lên mục này." : "Tài khoản không được xem mục hồ sơ này.");
}

export async function POST(request: Request) {
  try {
    await loadEnv();
    const user = await currentUser(request);
    if (!user) return Response.json({ ok: false, error: "Chưa đăng nhập." }, { status: 401 });
    const form = await request.formData();
    const file = form.get("file");
    const entityType = String(form.get("entityType") ?? "").trim();
    const entityId = String(form.get("entityId") ?? "").trim();
    if (!(file instanceof File) || !entityType || !entityId) return Response.json({ ok: false, error: "Thiếu tệp hoặc chứng từ liên quan." }, { status: 400 });
    if (file.size > MAX_SIZE) return Response.json({ ok: false, error: "Tệp vượt giới hạn 20 MB." }, { status: 413 });
    await assertEntityAccess(user, entityType, entityId, true);
    const attachmentId = `ATT_${crypto.randomUUID()}`;
    const storageKey = `${entityType}/${entityId}/${attachmentId}-${safeName(file.name)}`;
    await env.BUCKET.put(storageKey, file.stream(), { httpMetadata: { contentType: file.type || "application/octet-stream" }, customMetadata: { entityType, entityId, uploadedBy: user.id } });
    const stamp = new Date().toISOString();
    await env.DB.prepare(`INSERT INTO attachments (id,entity_type,entity_id,file_name,storage_key,mime_type,uploaded_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)`).bind(attachmentId, entityType, entityId, file.name, storageKey, file.type || "application/octet-stream", user.id, stamp, stamp).run();
    return Response.json({ ok: true, attachment: { id: attachmentId, fileName: file.name } }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không thể tải tệp.";
    const forbidden = /không được|chỉ được|chưa được phép/i.test(message);
    return Response.json({ ok: false, error: message }, { status: forbidden ? 403 : 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await loadEnv();
    const user = await currentUser(request);
    if (!user) return Response.json({ ok: false, error: "Chưa đăng nhập." }, { status: 401 });
    const url = new URL(request.url);
    const attachmentId = url.searchParams.get("id")?.trim();
    if (!attachmentId) return Response.json({ ok: false, error: "Thiếu mã tệp." }, { status: 400 });
    const row = await env.DB.prepare(`SELECT id,entity_type AS entityType,entity_id AS entityId,storage_key AS storageKey,uploaded_by AS uploadedBy FROM attachments WHERE id=?`).bind(attachmentId).first<{ id:string; entityType:string; entityId:string; storageKey:string; uploadedBy:string }>();
    if (!row) return Response.json({ ok: false, error: "Không tìm thấy tệp." }, { status: 404 });
    await assertEntityAccess(user, row.entityType, row.entityId, true);
    if (user.role !== "admin" && row.entityType === "material_request" && !["commander","project"].includes(String(user.roleBase || user.role))) return Response.json({ ok:false,error:"Chỉ Chỉ huy trưởng hoặc Phòng Dự án được xóa hồ sơ vật tư đặc thù." },{status:403});
    await env.BUCKET.delete(row.storageKey);
    await env.DB.prepare(`DELETE FROM attachments WHERE id=?`).bind(attachmentId).run();
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không thể xóa tệp.";
    const forbidden = /không được|chỉ được|chưa được phép/i.test(message);
    return Response.json({ ok: false, error: message }, { status: forbidden ? 403 : 500 });
  }
}

export async function GET(request: Request) {
  try {
    await loadEnv();
    const user = await currentUser(request);
    if (!user) return new Response("Chưa đăng nhập", { status: 401 });
    const url = new URL(request.url);
    const archiveProjectId = url.searchParams.get("projectArchive")?.trim();
    if (archiveProjectId) {
      if (user.role !== "admin") return new Response("Chỉ Quản trị viên được xuất toàn bộ dữ liệu dự án.", { status: 403 });
      const archive = await makeProjectArchive(archiveProjectId, user);
      return new Response(toArrayBuffer(archive.zipped), { headers: { "Content-Type": "application/zip", "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(archive.fileName)}`, "Cache-Control": "private, no-store", "X-VNTECH-Archive-Id": archive.archiveId, "X-VNTECH-Archive-SHA256": archive.archiveSha, "X-VNTECH-Record-Count": String(archive.recordCount), "X-VNTECH-Attachment-Count": String(archive.attachmentCount) } });
    }
    const attachmentId = url.searchParams.get("id");
    const entityType = url.searchParams.get("entityType")?.trim();
    const entityId = url.searchParams.get("entityId")?.trim();
    if (!attachmentId && entityType && entityId) {
      await assertEntityAccess(user, entityType, entityId, false);
      const result = await env.DB.prepare(`SELECT a.id,a.file_name AS fileName,a.mime_type AS mimeType,a.created_at AS createdAt,u.full_name AS uploadedByName FROM attachments a JOIN users u ON u.id=a.uploaded_by WHERE a.entity_type=? AND a.entity_id=? ORDER BY a.created_at DESC`).bind(entityType, entityId).all();
      return Response.json({ ok: true, attachments: result.results ?? [] }, { headers: { "Cache-Control": "private, no-store" } });
    }
    if (!attachmentId) return new Response("Thiếu mã tệp", { status: 400 });
    const row = await env.DB.prepare(`SELECT entity_type AS entityType,entity_id AS entityId,file_name AS fileName,storage_key AS storageKey,mime_type AS mimeType FROM attachments WHERE id=?`).bind(attachmentId).first<{ entityType: string; entityId: string; fileName: string; storageKey: string; mimeType: string }>();
    if (!row) return new Response("Không tìm thấy tệp", { status: 404 });
    await assertEntityAccess(user, row.entityType, row.entityId, false);
    const object = await env.BUCKET.get(row.storageKey);
    if (!object) return new Response("Không tìm thấy dữ liệu tệp", { status: 404 });
    return new Response(object.body, { headers: { "Content-Type": row.mimeType, "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(row.fileName)}`, "Cache-Control": "private, no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không thể tải tệp";
    const forbidden = /không được|chỉ được|chưa được phép/i.test(message);
    return new Response(message, { status: forbidden ? 403 : 500 });
  }
}
