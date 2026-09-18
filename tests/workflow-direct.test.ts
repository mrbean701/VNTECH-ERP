/* eslint-disable @typescript-eslint/no-explicit-any */
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFile, readdir } from "node:fs/promises";
import { GET, POST } from "../app/api/system/route";
import { POST as FILE_POST } from "../app/api/files/route";
import { mapMaterialRows } from "../lib/material-import";
import { setRuntimeEnvForTests } from "../lib/runtime-env";

class TestStatement {
  constructor(private database: DatabaseSync, private sql: string, private values: unknown[] = []) {}
  bind(...values: unknown[]) { return new TestStatement(this.database, this.sql, values); }
  async first<T>() { return (this.database.prepare(this.sql).get(...this.values) as T | undefined) ?? null; }
  async all<T>() { return { success: true, results: this.database.prepare(this.sql).all(...this.values) as T[] }; }
  async run() { return { success: true, meta: this.database.prepare(this.sql).run(...this.values) }; }
}

class TestDatabase {
  constructor(private database: DatabaseSync) {}
  prepare(sql: string) { return new TestStatement(this.database, sql); }
  async batch(statements: TestStatement[]) {
    this.database.exec("BEGIN");
    try { const results = []; for (const statement of statements) results.push(await statement.run()); this.database.exec("COMMIT"); return results; }
    catch (error) { this.database.exec("ROLLBACK"); throw error; }
  }
}

const sqlite = new DatabaseSync(":memory:");
sqlite.exec("PRAGMA foreign_keys=ON");
for (const file of (await readdir("drizzle")).filter((name) => name.endsWith(".sql")).sort()) {
  const sql = await readFile(`drizzle/${file}`, "utf8");
  for (const statement of sql.split("--> statement-breakpoint").map((value) => value.trim()).filter(Boolean)) sqlite.exec(statement);
}
const bucket = new Map<string, unknown>();
setRuntimeEnvForTests({
  DB: new TestDatabase(sqlite) as unknown as D1Database,
  BUCKET: { put: async (key: string, value: unknown) => { bucket.set(key, value); }, get: async (key: string) => bucket.get(key) ?? null } as unknown as R2Bucket,
  EMAIL_SECRET: "workflow-email-encryption-secret",
});

function seedWorkflowFixtures() {
  const stamp = "2026-08-24T00:00:00.000Z";
  const categoryId=String((sqlite.prepare(`SELECT id FROM material_categories WHERE code='DIEN' LIMIT 1`).get() as {id:string}|undefined)?.id||"CAT-TEST");
  if(categoryId==="CAT-TEST") sqlite.prepare(`INSERT INTO material_categories (id,code,name,description,sort_order,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)`).run(categoryId,"DIEN","Điện","Dữ liệu riêng của bài kiểm thử",10,1,stamp,stamp);
  let subcategoryId=String((sqlite.prepare(`SELECT id FROM material_subcategories WHERE category_id=? LIMIT 1`).get(categoryId) as {id:string}|undefined)?.id||""); if(!subcategoryId){subcategoryId="SUB-TEST";sqlite.prepare(`INSERT INTO material_subcategories (id,category_id,code,name,description,sort_order,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)`).run(subcategoryId,categoryId,"CHUA_PHAN_NHOM","Chưa phân nhóm",null,10,1,stamp,stamp);}
  sqlite.prepare(`INSERT INTO materials (id,code,name,system,category_id,subcategory_id,specification,brand,unit,standard_price,min_stock,requires_cocq,requires_mar,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run("MAT-TEST","VT-TEST-001","Cáp điện kiểm thử","Điện",categoryId,subcategoryId,"4x10mm2","TEST","m",1000,0,1,0,1,stamp,stamp);
  sqlite.prepare(`INSERT INTO suppliers (id,code,name,tax_code,contact_name,phone,lead_time_days,rating,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run("SUP-TEST","NCC-TEST","Nhà cung cấp kiểm thử",null,null,null,3,5,1,stamp,stamp);
  for (let projectIndex=1;projectIndex<=5;projectIndex+=1) {
    const projectId=`PRJ-TEST-${projectIndex}`; const projectCode=`DA${String(projectIndex).padStart(2,"0")}`; const siteWarehouseId=`WH-SITE-${projectIndex}`;
    sqlite.prepare(`INSERT INTO projects (id,code,name,status,manager_user_id,start_date,planned_end_date,contract_no,contract_name,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(projectId,projectCode,`Dự án kiểm thử ${projectIndex}`,"active",null,"2026-01-01","2027-12-31",`HD-${projectIndex}`,`Hợp đồng kiểm thử ${projectIndex}`,stamp,stamp);
    sqlite.prepare(`INSERT INTO warehouses (id,code,name,type,project_id,parent_warehouse_id,keeper_user_id,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`).run(siteWarehouseId,`KHO-${projectCode}`,`Kho ${projectCode}`,"site",projectId,null,null,1,stamp,stamp);
    for(let teamIndex=1;teamIndex<=10;teamIndex+=1){ const teamWarehouseId=`WH-TEAM-${projectIndex}-${teamIndex}`; sqlite.prepare(`INSERT INTO warehouses (id,code,name,type,project_id,parent_warehouse_id,keeper_user_id,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`).run(teamWarehouseId,`TD-${projectCode}-${teamIndex}`,`Kho tổ ${teamIndex}`,"team",projectId,siteWarehouseId,null,1,stamp,stamp); sqlite.prepare(`INSERT INTO teams (id,code,name,trade,project_id,warehouse_id,leader_user_id,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`).run(`TEAM-${projectIndex}-${teamIndex}`,`TD-${projectCode}-${String(teamIndex).padStart(2,"0")}`,`Tổ đội ${teamIndex}`,teamIndex%2?"Điện":"Nước",projectId,teamWarehouseId,null,1,stamp,stamp); }
  }
}

let cookie = "";
const ownerCredentials = new Map<number,{username:string,password:string}>();
let adminCookie = "";
async function loginAs(username:string,password:string){ const saved=cookie; cookie=""; const r=await api('login',{username,password}); assert.equal(r.response.status,200,r.result.error); const c=r.response.headers.get('set-cookie')?.split(';')[0]||''; assert(c); cookie=saved; return c; }
async function configureWorkflowOwners(projectId:string){
  const rows=[
    {stage:2,username:'wf.thuky',employeeCode:'WF-THUKY',fullName:'Thư ký Workflow',email:'wf.thuky@test.local',role:'thuky'},
    {stage:3,username:'wf.danv',employeeCode:'WF-DANV',fullName:'Nhân viên DA Workflow',email:'wf.danv@test.local',role:'project'},
    {stage:4,username:'wf.datruong',employeeCode:'WF-DATR',fullName:'Trưởng DA Workflow',email:'wf.datruong@test.local',role:'da_truong'},
    {stage:5,username:'wf.khtruong',employeeCode:'WF-KHTR',fullName:'Trưởng KH Workflow',email:'wf.khtruong@test.local',role:'kh_truong'},
  ]; const stamp='2026-08-24T00:00:00.000Z';
  for(const row of rows){ const password='OwnerTest@2026!'; const created=await api('create_user',{employeeCode:row.employeeCode,fullName:row.fullName,username:row.username,email:row.email,role:row.role,password}); assert.equal(created.response.status,200,created.result.error); const u=sqlite.prepare('SELECT id FROM users WHERE username=?').get(row.username) as {id:string}; sqlite.prepare(`INSERT OR IGNORE INTO user_project_scopes(id,user_id,project_id,permission,created_at,updated_at) VALUES (?,?,?,?,?,?)`).run(`UPS-${projectId}-${row.stage}`,u.id,projectId,'approve',stamp,stamp); sqlite.prepare(`INSERT OR REPLACE INTO user_module_permissions(id,user_id,module_key,can_view,can_use,can_create,can_edit,can_approve,can_export,permission_expires_at,permission_source,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(`UMP-APPROVALS-${projectId}-${row.stage}`,u.id,'approvals',1,1,0,0,1,0,null,'manual_override',stamp,stamp); sqlite.prepare(`INSERT OR REPLACE INTO approval_project_assignments(id,project_id,stage,owner_user_id,cc_emails,active,updated_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)`).run(`APOWN-${projectId}-${row.stage}`,projectId,row.stage,u.id,null,1,(sqlite.prepare("SELECT id FROM users WHERE username='admin'").get() as {id:string}).id,stamp,stamp); ownerCredentials.set(row.stage,{username:row.username,password}); }
}
async function api(action: string, payload: Record<string, unknown> = {}) {
  const response = await POST(new Request("http://warehouse.test/api/system", { method: "POST", headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify({ action, ...payload }) }));
  return { response, result: await response.json() as Record<string, any> };
}
async function load() {
  const response = await GET(new Request("http://warehouse.test/api/system", { headers: cookie ? { Cookie: cookie } : {} }));
  const result = await response.json() as Record<string, any>;
  assert.equal(response.status, 200, result.error);
  return result.data;
}
async function approveConfiguredWorkflow(requestId: string, commentPrefix: string) {
  const originalCookie=cookie;
  try {
    while (true) {
      cookie=adminCookie; const snapshot = await load();
      const request = snapshot.requests.find((row: any) => String(row.id) === String(requestId));
      if (!request || request.status !== "pending_approval") break;
      const stage = snapshot.approvalStages.find((row: any) => row.active && Number(row.stageNo) === Number(request.approvalStage));
      assert(stage, `Không tìm thấy cấu hình stage ${request.approvalStage}`);
      const cred=ownerCredentials.get(Number(stage.stageNo)); assert(cred,`Thiếu Owner fixture cho stage ${stage.stageNo}`);
      cookie=await loginAs(cred.username,cred.password);
      const decision = await api("decide_approval", { requestId, stage: Number(stage.stageNo), decision: "approved", comment: `${commentPrefix} – ${stage.name}` });
      assert.equal(decision.response.status, 200, decision.result.error);
    }
  } finally { cookie=originalCookie; }
}
async function uploadImage(entityType: string, entityId: string, filename: string) {
  const form = new FormData();
  form.set("entityType", entityType); form.set("entityId", entityId);
  form.set("file", new File([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], filename, { type: "image/jpeg" }));
  const response = await FILE_POST(new Request("http://warehouse.test/api/files", { method: "POST", headers: { Cookie: cookie }, body: form }));
  assert.equal(response.status, 201, await response.text());
}

const setup = await api("setup", { companyName: "Công ty kiểm thử", fullName: "Quản trị kiểm thử", username: "admin", password: "TestKho@2026!" });
assert.equal(setup.response.status, 201, setup.result.error);
cookie = setup.response.headers.get("set-cookie")?.split(";")[0] || "";
assert(cookie); adminCookie=cookie;
seedWorkflowFixtures();
let data = await load();
assert.equal(data.projects.length, 5); assert.equal(data.teams.length, 50);
const project = data.projects[0]; const team = data.teams.find((row: any) => row.projectId === project.id); const warehouse = data.warehouses.find((row: any) => row.type === "site" && row.projectId === project.id); const material = data.materials[0];
await configureWorkflowOwners(project.id); cookie=adminCookie;
const boqImported=await api("replace_boq_items",{projectId:project.id,rows:[
  {sourceOrder:1,contractLineRef:"I",rowRole:"group",materialName:"PHẦN I – HỆ THỐNG ĐIỆN",systemCode:"DIEN",itemType:"contract",customFields:{systemCode:"DIEN"}},
  {sourceOrder:2,contractLineRef:"1",rowRole:"material",internalMaterialCode:material.code,contractMaterialCode:"VT-HD-001",approvedMaterialCode:material.code,materialName:material.name,unit:material.unit,systemCode:"DIEN",itemType:"contract",contractQty:100,remeasuredQty:100,unitPrice:0,customFields:{systemCode:"DIEN"}},
  {sourceOrder:3,contractLineRef:"PS-01",rowRole:"material",internalMaterialCode:material.code,contractMaterialCode:"",approvedMaterialCode:material.code,materialName:"Cáp điện phát sinh ngoài hợp đồng",unit:material.unit,systemCode:"DIEN",itemType:"outside_contract",contractQty:0,remeasuredQty:5,unitPrice:0,variationStatus:"approved",customFields:{systemCode:"DIEN"}},
]});assert.equal(boqImported.response.status,200,boqImported.result.error);
data=await load();const boqMaterial=data.boqItems.find((row:any)=>row.projectId===project.id&&Number(row.sourceOrder)===2);const boqOutside=data.boqItems.find((row:any)=>row.projectId===project.id&&Number(row.sourceOrder)===3);assert(boqMaterial?.id);assert(boqOutside?.id);
const priceUpdated=await api("update_boq_contract_prices",{projectId:project.id,sourceFileName:"Mau_Cap_Nhat_Gia_Tri_BOQ_DA01.xlsx",updates:[{boqItemId:boqMaterial.id,unitPrice:125000},{boqItemId:boqOutside.id,unitPrice:65000}]});assert.equal(priceUpdated.response.status,200,priceUpdated.result.error);assert.match(String(priceUpdated.result.message),/Đã cập nhật 2 dòng/);
const duplicatePrice=await api("update_boq_contract_prices",{projectId:project.id,updates:[{boqItemId:boqMaterial.id,unitPrice:1},{boqItemId:boqMaterial.id,unitPrice:2}]});assert.equal(duplicatePrice.response.status,400);assert.match(String(duplicatePrice.result.error),/bị trùng/);
data=await load();assert.equal(Number(data.boqItems.find((row:any)=>row.id===boqMaterial.id).unitPrice),125000);const priceAudit=sqlite.prepare(`SELECT after_json AS afterJson FROM audit_logs WHERE action='UPDATE_PRICE' ORDER BY occurred_at DESC LIMIT 1`).get() as {afterJson:string};assert.match(priceAudit.afterJson,/Mau_Cap_Nhat_Gia_Tri_BOQ_DA01.xlsx/);
const emailConfigured = await api("save_email_settings", { enabled: true, smtpHost: "smtp.gmail.com", smtpPort: 587, security: "starttls", username: "warehouse@example.com", smtpPassword: "AppPassword#2026", senderEmail: "warehouse@example.com", senderName: "MEP Warehouse", baseUrl: "http://192.168.1.20:8787", poSlaHours: 24, bchConfirmationSlaHours: 8, recipients: [
  { projectId: project.id, stage: 1, emails: "cht@example.com" },
  { projectId: project.id, stage: 2, emails: "thuky@example.com" },
  { projectId: project.id, stage: 3, emails: "pda@example.com" },
  { projectId: project.id, stage: 4, emails: "truongphongda@example.com" },
  { projectId: project.id, stage: 5, emails: "truongphongkh@example.com" },
  { projectId: project.id, stage: 101, emails: "muahang@example.com" },
  { projectId: project.id, stage: 102, emails: "thukho@example.com" },
  { projectId: project.id, stage: 103, emails: "bch@example.com" },
] });
assert.equal(emailConfigured.response.status, 200, emailConfigured.result.error);
assert.match(String(sqlite.prepare(`SELECT password FROM email_settings WHERE id='EMAIL'`).get().password), /^aesgcm\$/);
const preservedOwners = Number((sqlite.prepare(`SELECT COUNT(*) AS count FROM approval_project_assignments WHERE project_id=? AND stage BETWEEN 2 AND 5 AND active=1`).get(project.id) as {count:number}).count);
assert.equal(preservedOwners, 4, "Lưu SMTP/email recipients không được xóa Phân công Owner theo dự án");

const created = await api("create_request", { projectId: project.id, teamId: team.id, sourceWarehouseId: warehouse.id, neededAt: "2026-08-25", area: "Tầng 7 – khu A", priority: "urgent", lines: [{ materialId: material.id, quantity: 12, unitPrice: 1000, boqItemId: boqMaterial.id, contractLineNo: "1", workPackageCode: "CV-TEST" }] });
assert.equal(created.response.status, 200, created.result.error);
data = await load(); let request = data.requests[0];
assert.equal(request.requestNo, "DNMH-DA01-2026-0001");
assert(request.approvals.find((row: any) => Number(row.stage) === 1).queuedAt);
assert.equal(request.approvals.find((row: any) => Number(row.stage) === 1).status, "approved");
assert(request.approvals.find((row: any) => Number(row.stage) === 1).decidedAt);
assert(request.approvals.find((row: any) => Number(row.stage) === 1).approverName);
assert.equal(Number(request.approvals.find((row: any) => Number(row.stage) === 1).jointApprovedCount), 1);
assert(request.approvals.find((row: any) => Number(row.stage) === 2).queuedAt);
assert(request.approvals.find((row: any) => Number(row.stage) === 2).dueAt);
assert.equal(request.approvals.find((row: any) => Number(row.stage) === 2).status, "pending");
assert.equal(Number(request.approvalStage), 2);
{
  const stage2Mail = data.emailOutbox.find((row: any) => row.requestId === request.id && Number(row.stage) === 2 && row.event === "approval_requested");
  assert(stage2Mail, "Bước 2 phải tạo email thông báo cho Owner");
  const stage2Recipients = String(stage2Mail.recipients || "").split(",").map((value: string) => value.trim()).filter(Boolean);
  assert(stage2Recipients.includes("wf.thuky@test.local"), "Owner Bước 2 phải là người nhận email chính");
  assert(stage2Recipients.includes("thuky@example.com"), "Email cấu hình bổ sung chỉ là CC/thông báo và vẫn được nhận mail");
}
await approveConfiguredWorkflow(request.id, "Duyệt kiểm thử");
data = await load(); request = data.requests.find((row: any) => row.id === request.id); assert.equal(request.status, "approved"); assert.equal(request.supplyStatus, "awaiting_po"); assert.equal(Number(request.items[0].approvedPurchaseQty), 12);
const automaticPoTask = sqlite.prepare(`SELECT id,status,assigned_to AS assignedTo,assigned_at AS assignedAt,due_at AS dueAt FROM work_items WHERE source_type='MR' AND source_id=? AND work_step='MR_TO_PO'`).get(request.id) as {id:string,status:string,assignedTo:string,assignedAt:string,dueAt:string}|undefined;
assert(automaticPoTask, "Duyệt đủ 5 bước phải tự tạo nhiệm vụ MR_TO_PO cho Phòng Kế hoạch"); assert.equal(automaticPoTask.status, "NEW"); assert(automaticPoTask.assignedTo); assert(automaticPoTask.assignedAt); assert(automaticPoTask.dueAt);
assert.equal(Number((sqlite.prepare(`SELECT COUNT(*) AS count FROM task_notifications WHERE work_item_id=? AND channel='in_app'`).get(automaticPoTask.id) as {count:number}).count),1,"Nhiệm vụ tự động phải có đúng 1 thông báo in-app cho Owner");
assert.equal(Number((sqlite.prepare(`SELECT COUNT(*) AS count FROM email_outbox WHERE event='task_assigned' AND subject LIKE '%NV-KH-%'`).get() as {count:number}).count),1,"Nhiệm vụ tự động phải xếp đúng 1 email thông báo cho Owner");
assert.equal(request.approvals.length, 5);
assert(request.approvals.every((row: any) => row.status === "approved"));
assert.equal(Number(request.approvals.find((row: any) => Number(row.stage) === 5).jointApprovedCount), 1);
const poQueueStep = request.supplySteps.find((row: any) => row.step === "po_creation");
assert.equal(poQueueStep.status, "pending"); assert(poQueueStep.queuedAt); assert(poQueueStep.dueAt);
assert(data.emailOutbox.some((row: any) => row.requestId === request.id && row.event === "approved" && row.recipients.includes("muahang@example.com")));

const supplier = data.suppliers[0]; const poCreated = await api("create_po", { requestId: request.id, supplierId: supplier.id, warehouseId: warehouse.id, eta: "2026-08-24", lines: [{ requestItemId: request.items[0].id, quantity: 12, unitPrice: 1000 }] }); assert.equal(poCreated.response.status, 200, poCreated.result.error);
data = await load(); const po = data.purchaseOrders[0]; request = data.requests.find((row: any) => row.id === request.id);
assert.equal(po.items.length, 1); assert.equal(po.status, "pending_approval"); assert.equal(po.eta, "2026-08-24"); assert.equal(request.supplyStatus, "waiting_delivery");
// [B2/bước 1] Hợp đồng MỚI: PO phải được DUYỆT trước khi sang giao hàng.
const poApproved = await api("approve_po", { purchaseOrderId: po.id }); assert.equal(poApproved.response.status, 200, poApproved.result.error);
data = await load(); const poApprovedRow = data.purchaseOrders.find((row: any) => row.id === po.id); assert.equal(poApprovedRow.status, "waiting_delivery");
assert.equal(request.supplySteps.find((row: any) => row.step === "po_creation").status, "completed");
assert.equal(request.supplySteps.find((row: any) => row.step === "delivery").status, "pending");
assert(data.emailOutbox.some((row: any) => row.requestId === request.id && row.event === "po_waiting_delivery" && row.recipients === "thukho@example.com"));
const receiptCreated = await api("receive_goods", { purchaseOrderId: po.id, deliveryNoteNo: "GIAO-TEST-01", qcOk: true, certificateStatus: "complete", deliveryDocumentStatus: "complete", lines: [{ purchaseOrderItemId: po.items[0].id, quantity: 13, lotNo: "LOT-TEST" }] }); assert.equal(receiptCreated.response.status, 200, receiptCreated.result.error);

data = await load(); request = data.requests.find((row: any) => row.id === request.id); const receipt = data.receipts.find((row: any) => row.purchaseOrderId === po.id);
assert.equal(request.supplyStatus, "awaiting_bch_confirmation"); assert.equal(receipt.bchConfirmationStatus, "pending");
assert.equal(Number(receipt.actualDeliveredQty), 13); assert.equal(Number(receipt.acceptedQty), 12); assert.equal(Number(receipt.rejectedQty), 1);
assert(data.emailOutbox.some((row: any) => row.requestId === request.id && row.event === "delivery_waiting_bch" && row.recipients === "bch@example.com"));
const confirmationWithoutImage = await api("confirm_delivery", { receiptId: receipt.id, certificateStatus: "complete", deliveryDocumentStatus: "complete" });
assert.equal(confirmationWithoutImage.response.status, 400); assert.match(String(confirmationWithoutImage.result.error), /ít nhất một ảnh/);
const deliveryImage = new FormData();
deliveryImage.set("entityType", "goods_receipt"); deliveryImage.set("entityId", receipt.id);
deliveryImage.set("file", new File([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], "giao-hang-test.jpg", { type: "image/jpeg" }));
const uploaded = await FILE_POST(new Request("http://warehouse.test/api/files", { method: "POST", headers: { Cookie: cookie }, body: deliveryImage }));
assert.equal(uploaded.status, 201, await uploaded.text());
const confirmed = await api("confirm_delivery", { receiptId: receipt.id, certificateStatus: "complete", deliveryDocumentStatus: "complete", comment: "BCH xác nhận đã nhận đủ theo PO; nhà cung cấp giao thừa 1." });
assert.equal(confirmed.response.status, 200, confirmed.result.error);

data = await load(); request = data.requests.find((row: any) => row.id === request.id); const completedPo = data.purchaseOrders.find((row: any) => row.id === po.id); const confirmedReceipt = data.receipts.find((row: any) => row.id === receipt.id);
assert.equal(request.supplyStatus, "completed"); assert.equal(completedPo.status, "completed"); assert.equal(confirmedReceipt.bchConfirmationStatus, "confirmed"); assert.equal(Number(confirmedReceipt.attachmentCount), 1);
assert.equal(request.supplySteps.find((row: any) => row.step === "delivery").status, "completed");
assert.equal(request.supplySteps.find((row: any) => row.step === "bch_confirmation").status, "completed");
assert(data.emailOutbox.some((row: any) => row.requestId === request.id && row.event === "delivery_completed" && row.recipients.includes("muahang@example.com")));

let siteBalance = data.inventory.find((row: any) => row.warehouseId === warehouse.id && row.materialId === material.id); assert.equal(Number(siteBalance.balance), 12);
const issued = await api("issue_stock", { projectId: project.id, fromWarehouseId: warehouse.id, teamId: team.id, requestId: request.id, receivedByName: "Đội trưởng kiểm thử", lines: [{ requestItemId: request.items[0].id, materialId: material.id, quantity: 10 }] }); assert.equal(issued.response.status, 200, issued.result.error);
data = await load(); const teamBalance = data.contractStockBalances.find((row: any) => row.warehouseId === team.warehouseId && row.materialId === material.id); assert.equal(Number(teamBalance.balance), 10);
const issueItem = data.issues[0].items[0]; const installed = await api("confirm_installation", { issueItemId: issueItem.id, quantity: 5 }); assert.equal(installed.response.status, 200, installed.result.error);
data = await load(); const teamAfterInstall = data.contractStockBalances.find((row: any) => row.warehouseId === team.warehouseId && row.materialId === material.id); assert.equal(Number(teamAfterInstall.balance), 5);
const returned = await api("return_stock", { projectId: project.id, teamId: team.id, toWarehouseId: warehouse.id, returnedByName: "Đội trưởng kiểm thử", lines: [{ materialId: material.id, quantity: 2, condition: "usable" }] }); assert.equal(returned.response.status, 200, returned.result.error);
data = await load(); siteBalance = data.inventory.find((row: any) => row.warehouseId === warehouse.id && row.materialId === material.id); assert.equal(Number(siteBalance.balance), 4);
const counted = await api("create_stock_count", { projectId: project.id, warehouseId: warehouse.id, countType: "spot", lines: [{ materialId: material.id, actualQty: 5, reason: "Tìm thấy 1 đơn vị chưa ghi nhận" }] }); assert.equal(counted.response.status, 200, counted.result.error);
data = await load(); const count = data.stockCounts[0]; assert.equal(count.status, "pending_approval"); const approvedCount = await api("approve_stock_count", { countId: count.id }); assert.equal(approvedCount.response.status, 200, approvedCount.result.error);
data = await load(); siteBalance = data.inventory.find((row: any) => row.warehouseId === warehouse.id && row.materialId === material.id); assert.equal(Number(siteBalance.balance), 5);

const second = await api("create_request", { projectId: project.id, teamId: team.id, neededAt: "2026-09-01", area: "Kiểm thử khóa PO", lines: [{ materialId: material.id, quantity: 1, unitPrice: 1000, boqItemId: boqMaterial.id, contractLineNo: "1" }] }); assert.equal(second.response.status, 200, second.result.error);
data = await load(); const fresh = data.requests.find((row: any) => row.area === "Kiểm thử khóa PO"); const blocked = await api("create_po", { requestId: fresh.id, supplierId: supplier.id, warehouseId: warehouse.id, lines: [{ requestItemId: fresh.items[0].id, quantity: 1, unitPrice: 1000 }] }); assert.equal(blocked.response.status, 400); assert.match(String(blocked.result.error), /đã duyệt đủ các cấp/);
const cancelBeforeReturn = await api("cancel_request", { requestId: fresh.id, reason: "Không được phép hủy khi phiếu chưa bị trả lại" }); assert.equal(cancelBeforeReturn.response.status, 400); assert.match(String(cancelBeforeReturn.result.error), /bị trả lại|chờ CHT xử lý/i);
const rejectCred=ownerCredentials.get(Number(fresh.approvalStage)); assert(rejectCred); const beforeRejectCookie=cookie; cookie=await loginAs(rejectCred.username,rejectCred.password); const returnForCancel = await api("decide_approval", { requestId: fresh.id, stage: Number(fresh.approvalStage), decision: "rejected", comment: "Trả lại để CHT xử lý và hủy phiếu kiểm thử" }); cookie=beforeRejectCookie; assert.equal(returnForCancel.response.status, 200, returnForCancel.result.error);
data = await load(); const returnedFresh = data.requests.find((row: any) => row.id === fresh.id); assert.equal(returnedFresh.status, "returned_to_requester"); assert.equal(returnedFresh.supplyStatus, "returned");
const cancelled = await api("cancel_request", { requestId: fresh.id, reason: "Hủy phiếu kiểm thử sau khi đã bị trả lại; phải giữ số" }); assert.equal(cancelled.response.status, 200, cancelled.result.error);
data = await load(); const cancelledRequest = data.requests.find((row: any) => row.id === fresh.id); assert.equal(cancelledRequest.status, "cancelled"); assert.equal(cancelledRequest.requestNo, "DNMH-DA01-2026-0002");
const unmatchedBoq = await api("create_request", { projectId: project.id, neededAt: "2026-09-02", area: "Kiểm thử chặn BOQ không khớp", lines: [{ materialId: material.id, quantity: 1, unitPrice: 1000, boqCode: "BOQ-NOT-MATCH" }] });
assert.equal(unmatchedBoq.response.status, 400);
assert.match(String(unmatchedBoq.result.error), /chưa đối chiếu được đúng dòng BOQ\/Hợp đồng/i);

const imported = await api("create_request", { projectId: project.id, neededAt: "2026-09-10", area: "Nhập từ Excel", lines: [{ materialCode: "VT-EXCEL-0001", materialName: "Vật tư kiểm thử nhập Excel", unit: "cái", system: "Điện", quantity: 25, unitPrice: 50000, workPackageCode: "CV-EXCEL" }] });
assert.equal(imported.response.status, 400);
assert.match(String(imported.result.error), /Danh mục mã vật tư|không tồn tại/i);
data = await load();
assert(!data.requests.some((row: any) => row.area === "Nhập từ Excel"));
assert(!data.materials.some((row: any) => row.code === "VT-EXCEL-0001"));
const oversized = await api("create_request", { projectId: project.id, neededAt: "2026-09-11", area: "Quá giới hạn", lines: Array.from({ length: 101 }, () => ({ materialId: material.id, quantity: 1, boqCode: "BOQ-LIMIT" })) });
assert.equal(oversized.response.status, 400);
assert.match(String(oversized.result.error), /tối đa 100 dòng/);

const templateRows = [
  ["MẪU NHẬP PHIẾU ĐỀ NGHỊ MUA HÀNG"],
  ["Nhập tối đa 100 dòng"],
  [],
  ["STT", "Mã vật tư", "Tên vật tư", "ĐVT", "Hệ thống", "Mã BOQ/Dự toán", "Mã đầu việc", "Số lượng", "Đơn giá dự kiến", "Khu vực lắp đặt"],
  ["1", "", "", "", "", "", "", "", "", ""],
  ["2", material.code, "", "", "", "BOQ-FILE", "", "3", "1000", "Tầng 1"],
  ["3", "", "", "", "", "", "", "", "", ""],
];
const parsedTemplateRows = mapMaterialRows(templateRows, data.materials);
assert.equal(parsedTemplateRows.length, 1);
assert.equal(parsedTemplateRows[0].materialCode, material.code);
assert.equal(parsedTemplateRows[0].quantity, 3);

// Regression: Vietnamese Đ/đ does not decompose under Unicode NFD.
// Headers ĐVT and Đơn giá dự kiến must still be recognized for a brand-new material code.
const vietnameseHeaderRows = [
  [], [], [],
  ["STT", "Mã vật tư", "Tên vật tư", "ĐVT", "Hệ thống", "Mã BOQ/Dự toán", "Mã đầu việc", "Số lượng", "Đơn giá dự kiến", "Khu vực lắp đặt"],
  ["1", "VT-EXCEL-DVT-01", "Ống kiểm thử ĐVT", "m", "Cấp thoát nước", "BOQ-DVT", "", "10", "368000", "Tầng 1"],
];
const parsedVietnameseHeaders = mapMaterialRows(vietnameseHeaderRows, []);
assert.equal(parsedVietnameseHeaders.length, 1);
assert.equal(parsedVietnameseHeaders[0].unit, "m");
assert.equal(parsedVietnameseHeaders[0].unitPrice, 368000);
assert.equal(parsedVietnameseHeaders[0].materialName, "Ống kiểm thử ĐVT");

// V5.0.0: một phiếu gốc tách nhiều PO, nhiều hệ/ngày giao và nhiều chuyến giao.
const multiCreated = await api("create_request", { projectId: project.id, teamId: team.id, sourceWarehouseId: warehouse.id, neededAt: "2026-10-01", area: "Kiểm thử nhiều PO và nhiều chuyến giao", lines: [{ materialId: material.id, quantity: 20, unitPrice: 1000, boqItemId: boqMaterial.id, contractLineNo: "1", workPackageCode: "CV-MULTI" }] });
assert.equal(multiCreated.response.status, 200, multiCreated.result.error);
data = await load(); let multiRequest = data.requests.find((row: any) => row.area === "Kiểm thử nhiều PO và nhiều chuyến giao");
await approveConfiguredWorkflow(multiRequest.id, "Duyệt nhiều PO");
data = await load(); multiRequest = data.requests.find((row: any) => row.id === multiRequest.id);
const firstMultiPo = await api("create_po", { requestId: multiRequest.id, supplierId: supplier.id, warehouseId: warehouse.id, eta: "2026-10-05", availabilityOverrideReason: "Quản trị phê duyệt mua mới vì tồn tại tổ đội đã phân bổ cho công việc khác", lines: [{ requestItemId: multiRequest.items[0].id, quantity: 8, unitPrice: 1000, systemCode: "DIEN", plannedDeliveryAt: "2026-10-05" }] });
assert.equal(firstMultiPo.response.status, 200, firstMultiPo.result.error);
const secondMultiPo = await api("create_po", { requestId: multiRequest.id, supplierId: supplier.id, warehouseId: warehouse.id, eta: "2026-10-12", availabilityOverrideReason: "Quản trị phê duyệt mua mới vì tồn tại tổ đội đã phân bổ cho công việc khác", lines: [{ requestItemId: multiRequest.items[0].id, quantity: 12, unitPrice: 1000, systemCode: "CAP_NUOC", plannedDeliveryAt: "2026-10-12" }] });
assert.equal(secondMultiPo.response.status, 200, secondMultiPo.result.error);
data = await load(); let multiPos = data.purchaseOrders.filter((row: any) => row.requestId === multiRequest.id).sort((a: any,b: any) => String(a.poNo).localeCompare(String(b.poNo)));
assert.equal(multiPos.length, 2); assert.notEqual(multiPos[0].poNo, multiPos[1].poNo);
assert.equal(multiPos[0].items[0].systemCode, "DIEN"); assert.equal(multiPos[0].items[0].plannedDeliveryAt, "2026-10-05");
assert.equal(multiPos[1].items[0].systemCode, "CAP_NUOC"); assert.equal(multiPos[1].items[0].plannedDeliveryAt, "2026-10-12");

const firstPartial = await api("receive_goods", { purchaseOrderId: multiPos[0].id, deliveryNoteNo: "MULTI-01", qcOk: true, certificateStatus: "complete", deliveryDocumentStatus: "complete", lines: [{ purchaseOrderItemId: multiPos[0].items[0].id, quantity: 5 }] });
assert.equal(firstPartial.response.status, 200, firstPartial.result.error);
data = await load(); const multiReceipts = data.receipts.filter((row: any) => row.requestId === multiRequest.id); let partialReceipt = multiReceipts.find((row: any) => row.deliveryNoteNo === "MULTI-01");
await uploadImage("goods_receipt", partialReceipt.id, "multi-01.jpg");
let partialConfirmed = await api("confirm_delivery", { receiptId: partialReceipt.id, certificateStatus: "complete", deliveryDocumentStatus: "complete", comment: "BCH xác nhận đợt giao điện thứ nhất" });
assert.equal(partialConfirmed.response.status, 200, partialConfirmed.result.error);
data = await load(); multiRequest = data.requests.find((row: any) => row.id === multiRequest.id);
assert.equal(Number(multiRequest.items[0].actualDeliveredQty), 5); assert.equal(Number(multiRequest.items[0].receivedQty), 5); assert.equal(Number(multiRequest.items[0].remainingQty), 15);
assert.equal(Number(multiRequest.items[0].linkedPoCount), 2); assert.equal(Number(multiRequest.items[0].linkedReceiptCount), 1);

multiPos = data.purchaseOrders.filter((row: any) => row.requestId === multiRequest.id).sort((a: any,b: any) => String(a.poNo).localeCompare(String(b.poNo)));
const finishFirstPo = await api("receive_goods", { purchaseOrderId: multiPos[0].id, deliveryNoteNo: "MULTI-02", qcOk: true, certificateStatus: "missing", deliveryDocumentStatus: "complete", lines: [{ purchaseOrderItemId: multiPos[0].items[0].id, quantity: 3 }] });
assert.equal(finishFirstPo.response.status, 200, finishFirstPo.result.error);
data = await load(); partialReceipt = data.receipts.find((row: any) => row.requestId === multiRequest.id && row.deliveryNoteNo === "MULTI-02"); await uploadImage("goods_receipt", partialReceipt.id, "multi-02.jpg");
partialConfirmed = await api("confirm_delivery", { receiptId: partialReceipt.id, certificateStatus: "missing", deliveryDocumentStatus: "complete", comment: "BCH xác nhận đủ số lượng, còn thiếu CO/CQ" });
assert.equal(partialConfirmed.response.status, 400);
assert.match(String(partialConfirmed.result.error), /CO\/CQ|chứng chỉ|hồ sơ chưa đầy đủ/i);
partialConfirmed = await api("confirm_delivery", { receiptId: partialReceipt.id, certificateStatus: "complete", deliveryDocumentStatus: "complete", comment: "BCH xác nhận sau khi đã bổ sung đủ CO/CQ" });
assert.equal(partialConfirmed.response.status, 200, partialConfirmed.result.error);

data = await load(); multiPos = data.purchaseOrders.filter((row: any) => row.requestId === multiRequest.id).sort((a: any,b: any) => String(a.poNo).localeCompare(String(b.poNo)));
const finishSecondPo = await api("receive_goods", { purchaseOrderId: multiPos[1].id, deliveryNoteNo: "MULTI-03", qcOk: true, certificateStatus: "complete", deliveryDocumentStatus: "complete", lines: [{ purchaseOrderItemId: multiPos[1].items[0].id, quantity: 12 }] });
assert.equal(finishSecondPo.response.status, 200, finishSecondPo.result.error);
data = await load(); partialReceipt = data.receipts.find((row: any) => row.requestId === multiRequest.id && row.deliveryNoteNo === "MULTI-03"); await uploadImage("goods_receipt", partialReceipt.id, "multi-03.jpg");
partialConfirmed = await api("confirm_delivery", { receiptId: partialReceipt.id, certificateStatus: "complete", deliveryDocumentStatus: "complete", comment: "BCH xác nhận đợt giao hệ nước" });
assert.equal(partialConfirmed.response.status, 200, partialConfirmed.result.error);
data = await load(); multiRequest = data.requests.find((row: any) => row.id === multiRequest.id);
assert.equal(Number(multiRequest.items[0].actualDeliveredQty), 20); assert.equal(Number(multiRequest.items[0].receivedQty), 20); assert.equal(Number(multiRequest.items[0].remainingQty), 0);
assert.equal(Number(multiRequest.items[0].linkedPoCount), 2); assert.equal(Number(multiRequest.items[0].linkedReceiptCount), 3); assert.equal(Number(multiRequest.items[0].missingDocumentCount), 0);
assert.equal(multiRequest.supplyStatus, "completed");

// V5.0.0: đóng phần thiếu có phê duyệt, giữ nguyên nhu cầu gốc và lý do chênh lệch.
const closeCreated = await api("create_request", { projectId: project.id, teamId: team.id, neededAt: "2026-10-15", area: "Kiểm thử đóng thiếu một phần", lines: [{ materialId: material.id, quantity: 10, unitPrice: 1000, boqItemId: boqMaterial.id, contractLineNo: "1" }] });
assert.equal(closeCreated.response.status, 200, closeCreated.result.error);
data = await load(); let closeRequest = data.requests.find((row: any) => row.area === "Kiểm thử đóng thiếu một phần");
await approveConfiguredWorkflow(closeRequest.id, "Duyệt đóng thiếu");
data = await load(); closeRequest = data.requests.find((row: any) => row.id === closeRequest.id);
const closePoCreated = await api("create_po", { requestId: closeRequest.id, supplierId: supplier.id, warehouseId: warehouse.id, eta: "2026-10-18", availabilityOverrideReason: "Quản trị phê duyệt mua mới vì tồn tại tổ đội đã phân bổ cho công việc khác", lines: [{ requestItemId: closeRequest.items[0].id, quantity: 10, unitPrice: 1000, systemCode: "HVAC", plannedDeliveryAt: "2026-10-18" }] });
assert.equal(closePoCreated.response.status, 200, closePoCreated.result.error);
data = await load(); let closePo = data.purchaseOrders.find((row: any) => row.requestId === closeRequest.id);
const closeReceiptCreated = await api("receive_goods", { purchaseOrderId: closePo.id, deliveryNoteNo: "CLOSE-01", qcOk: true, certificateStatus: "complete", deliveryDocumentStatus: "complete", lines: [{ purchaseOrderItemId: closePo.items[0].id, quantity: 4 }] });
assert.equal(closeReceiptCreated.response.status, 200, closeReceiptCreated.result.error);
data = await load(); const closeReceipt = data.receipts.find((row: any) => row.requestId === closeRequest.id); await uploadImage("goods_receipt", closeReceipt.id, "close-01.jpg");
const closeReceiptConfirmed = await api("confirm_delivery", { receiptId: closeReceipt.id, certificateStatus: "complete", deliveryDocumentStatus: "complete", comment: "BCH xác nhận 4, phần còn lại ngừng mua" }); assert.equal(closeReceiptConfirmed.response.status, 200, closeReceiptConfirmed.result.error);
data = await load(); closePo = data.purchaseOrders.find((row: any) => row.requestId === closeRequest.id);
const lineClosed = await api("close_po_line", { purchaseOrderItemId: closePo.items[0].id, reason: "BCH và Mua hàng thống nhất dừng 6 đơn vị còn lại" }); assert.equal(lineClosed.response.status, 200, lineClosed.result.error);
data = await load(); closeRequest = data.requests.find((row: any) => row.id === closeRequest.id); closePo = data.purchaseOrders.find((row: any) => row.requestId === closeRequest.id);
assert.equal(Number(closeRequest.items[0].requestedQty), 10); assert.equal(Number(closeRequest.items[0].receivedQty), 4); assert.equal(Number(closeRequest.items[0].closedQty), 6); assert.equal(Number(closeRequest.items[0].remainingQty), 0);
assert.match(String(closeRequest.items[0].closeReason), /dừng 6/); assert.equal(closeRequest.supplyStatus, "completed_with_shortage"); assert.equal(closePo.status, "completed_with_shortage");

// V5.0.0: mã gốc Kho Tổng, tên tương đương và chống tạo trùng vật tư.
const category = data.materialCategories[0];
const rootMaterialSaved = await api("save_material", { code: "CTN-001", name: "Cút uPVC 45 độ D110 PN8", unit: "cái", categoryId: category.id, aliasText: "Chếch uPVC D110 PN8; Lơi uPVC D110 PN8; Cút uPVC 135 độ D110 PN8" });
assert.equal(rootMaterialSaved.response.status, 200, rootMaterialSaved.result.error);
data = await load(); const rootMaterial = data.materials.find((row: any) => row.code === "CTN-001"); assert(rootMaterial); assert.match(String(rootMaterial.aliasText), /Chếch uPVC/); assert.equal(rootMaterial.aliases.length, 3);
const duplicateAlias = await api("save_material", { code: "CTN-002", name: "Chếch uPVC D110 PN8", unit: "cái", categoryId: category.id });
assert.equal(duplicateAlias.response.status, 400); assert.match(String(duplicateAlias.result.error), /đã thuộc|tương đương/);
const aliasImportRows = [["STT", "Mã vật tư", "Tên vật tư", "ĐVT", "Số lượng"], ["1", "", "Chếch uPVC D110 PN8", "cái", "2"]];
const aliasImported = mapMaterialRows(aliasImportRows, data.materials);
assert.equal(aliasImported.length, 1); assert.equal(aliasImported[0].materialId, rootMaterial.id); assert.equal(aliasImported[0].materialCode, "CTN-001");

// V5.0.0: vật tư dư chỉ tăng Kho Tổng sau duyệt, ảnh kiểm đếm và số lượng thực nhận.
const centralReturnCreated = await api("create_central_return", { projectId: project.id, sourceWarehouseId: warehouse.id, note: "Hoàn vật tư dư cuối dự án", lines: [{ materialId: material.id, quantity: 3, conditionStatus: "usable", unitCost: 1000 }] });
assert.equal(centralReturnCreated.response.status, 200, centralReturnCreated.result.error);
data = await load(); let centralReturn = data.centralReturns.find((row: any) => row.sourceProjectId === project.id && row.status === "pending_approval"); assert(centralReturn);
const centralApproved = await api("approve_central_return", { centralReturnId: centralReturn.id, reason: "BCH xác nhận là vật tư dư" }); assert.equal(centralApproved.response.status, 200, centralApproved.result.error);
await uploadImage("central_return", centralReturn.id, "kiem-dem-kho-tong.jpg");
data = await load(); centralReturn = data.centralReturns.find((row: any) => row.id === centralReturn.id);
const centralReceived = await api("receive_central_return", { centralReturnId: centralReturn.id, lines: [{ centralReturnItemId: centralReturn.items[0].id, countedQty: 3, acceptedQty: 2, conditionStatus: "usable", rejectionReason: "1 đơn vị sai chủng loại", unitCost: 1000 }] });
assert.equal(centralReceived.response.status, 200, centralReceived.result.error);
data = await load(); centralReturn = data.centralReturns.find((row: any) => row.id === centralReturn.id); assert.equal(centralReturn.status, "received_with_rejection"); assert.equal(Number(centralReturn.acceptedQty), 2); assert.equal(Number(centralReturn.rejectedQty), 1);
const centralBalance = data.centralInventory.find((row: any) => row.materialId === material.id); assert.equal(Number(centralBalance.balance), 2);

// Quyền Phòng Dự án được kế thừa; module ngoài phòng chỉ sửa khi Quản trị viên cấp ngoại lệ.
adminCookie = cookie;
const projectHeadCreated = await api("create_user", { employeeCode: "TP-TEST", fullName: "Trưởng dự án kiểm thử", username: "truongduan.test", email: "truongduan.test@example.com", password: "ProjectHead@2026", role: "project", department: "BCH", projectIds: [project.id] });
assert.equal(projectHeadCreated.response.status, 200, projectHeadCreated.result.error);
data = await load(); const projectHead = data.users.find((row: any) => row.username === "truongduan.test"); assert(projectHead);
assert(data.allModulePermissions.some((row: any) => row.userId === projectHead.id && String(row.moduleKey).startsWith("dept_project_") && row.canEdit && row.permissionSource === "department_default"));
assert(!data.allModulePermissions.some((row: any) => row.userId === projectHead.id && row.moduleKey === "material_catalog" && row.canEdit));
cookie = ""; const projectHeadLogin = await api("login", { username: "truongduan.test", password: "ProjectHead@2026" }); assert.equal(projectHeadLogin.response.status, 200, projectHeadLogin.result.error); cookie = projectHeadLogin.response.headers.get("set-cookie")?.split(";")[0] || "";
const editDenied = await api("save_material", { materialId: rootMaterial.id, code: "CTN-001", name: rootMaterial.name, unit: rootMaterial.unit, categoryId: rootMaterial.categoryId, aliasText: rootMaterial.aliasText }); assert.equal(editDenied.response.status, 400); assert.match(String(editDenied.result.error), /chưa được quản trị viên cấp đúng quyền/);
cookie = adminCookie;
const accessGranted = await api("save_user_access", { userId: projectHead.id, projectScopes: [{ projectId: project.id, permission: "read" }], modulePermissions: [{ moduleKey: "material_catalog", canView: true, canUse: true, canCreate: false, canEdit: true, canApprove: false, canExport: false }] }); assert.equal(accessGranted.response.status, 200, accessGranted.result.error);
cookie = ""; const grantedLogin = await api("login", { username: "truongduan.test", password: "ProjectHead@2026" }); assert.equal(grantedLogin.response.status, 200, grantedLogin.result.error); cookie = grantedLogin.response.headers.get("set-cookie")?.split(";")[0] || "";
const editGranted = await api("save_material", { materialId: rootMaterial.id, code: "CTN-001", name: rootMaterial.name, unit: rootMaterial.unit, categoryId: rootMaterial.categoryId, aliasText: `${rootMaterial.aliasText}; Co uPVC 45 độ D110 PN8` }); assert.equal(editGranted.response.status, 200, editGranted.result.error);
cookie = adminCookie; data = await load(); assert(data.audits.some((row: any) => row.action === "PERMISSION" && row.entityId === projectHead.id)); assert(data.audits.some((row: any) => row.action === "UPDATE" && row.entityId === rootMaterial.id));

// V5.2.3: mã/tên quyền nền, mã/tên nhóm, vai trò và hiển thị đều do Quản trị viên cấu hình.
const engineerProfile=data.engineRoleProfiles.find((row:any)=>row.engineKey==="engineer");assert(engineerProfile);
const projectBusinessScope=data.businessScopes.find((row:any)=>row.code==="project_management");assert(projectBusinessScope,"Thiếu Phạm vi nghiệp vụ Phòng Dự án canonical");
const fieldBusinessScope=data.businessScopes.find((row:any)=>row.code==="field_technical");assert(fieldBusinessScope,"Thiếu Phạm vi nghiệp vụ Kỹ thuật hiện trường canonical");
const projectOrgUnit=data.organizationUnits.find((row:any)=>row.code==="DA");assert(projectOrgUnit,"Thiếu Phòng Dự án canonical");
const engineProfileSaved=await api("save_engine_role_profile",{profileId:engineerProfile.id,engineKey:"engineer",companyCode:"ks_giam_sat",displayName:"Kỹ sư giám sát",sortOrder:1,description:"Tên và mã nền do công ty cấu hình"});assert.equal(engineProfileSaved.response.status,200,engineProfileSaved.result.error);
const groupCreated=await api("save_business_role_group",{code:"qs_khoi_luong",name:"Quản lý khối lượng",engineRole:"project",scopeIds:[projectBusinessScope.id],sortOrder:35,description:"QS và kiểm soát BOQ"});assert.equal(groupCreated.response.status,200,groupCreated.result.error);
data=await load();const qsGroup=data.businessRoleGroups.find((row:any)=>row.code==="qs_khoi_luong");assert(qsGroup);assert.equal(qsGroup.name,"Quản lý khối lượng");assert(qsGroup.scopeIds.includes(projectBusinessScope.id));
const temporaryGroupCreated=await api("save_business_role_group",{code:"nhom_tam_xoa",name:"Nhóm tạm để xóa",engineRole:"engineer",scopeIds:[fieldBusinessScope.id],sortOrder:99,description:"Kiểm thử tăng giảm nhóm"});assert.equal(temporaryGroupCreated.response.status,200,temporaryGroupCreated.result.error);data=await load();const temporaryGroup=data.businessRoleGroups.find((row:any)=>row.code==="nhom_tam_xoa");assert(temporaryGroup);const temporaryGroupDeleted=await api("delete_business_role_group",{groupId:temporaryGroup.id});assert.equal(temporaryGroupDeleted.response.status,200,temporaryGroupDeleted.result.error);data=await load();assert(!data.businessRoleGroups.some((row:any)=>row.id===temporaryGroup.id));
const groupRenamed=await api("save_business_role_group",{groupId:qsGroup.id,code:"qs_kiem_soat",name:"QS / Kiểm soát khối lượng",engineRole:"project",scopeIds:[projectBusinessScope.id],sortOrder:4,description:"Mã và tên nhóm do Quản trị viên tự sửa"});assert.equal(groupRenamed.response.status,200,groupRenamed.result.error);
const engineerRole=data.roleCatalog.find((row:any)=>row.code==="engineer");assert(engineerRole);const roleUpdated=await api("save_role_catalog",{roleId:engineerRole.id,code:"engineer",name:"Cán bộ hiện trường",businessGroupId:qsGroup.id,defaultOrganizationUnitId:projectOrgUnit.id,sortOrder:engineerRole.sortOrder,description:"Tên và nhóm đã tùy biến"});assert.equal(roleUpdated.response.status,200,roleUpdated.result.error);
const customRoleCreated=await api("save_role_catalog",{code:"gs_cong_truong",name:"Giám sát công trường",businessGroupId:qsGroup.id,defaultOrganizationUnitId:projectOrgUnit.id,sortOrder:20,description:"Vai trò kiểm thử đổi mã"});assert.equal(customRoleCreated.response.status,200,customRoleCreated.result.error);data=await load();const customRole=data.roleCatalog.find((row:any)=>row.code==="gs_cong_truong");assert(customRole);const customRoleUserCreated=await api("create_user",{employeeCode:"GS-MA-TEST",fullName:"Người dùng kiểm thử đổi mã vai trò",username:"giam.sat.ma.test",email:"giam.sat.ma.test@example.com",password:"RoleCode@2026",role:"gs_cong_truong",department:"Giám sát",projectIds:[]});assert.equal(customRoleUserCreated.response.status,200,customRoleUserCreated.result.error);const customRoleRenamed=await api("save_role_catalog",{roleId:customRole.id,code:"gs_giam_sat",name:"Kỹ sư giám sát",businessGroupId:qsGroup.id,defaultOrganizationUnitId:projectOrgUnit.id,sortOrder:20,description:"Mã vai trò đã đổi và tự chuyển tài khoản"});assert.equal(customRoleRenamed.response.status,200,customRoleRenamed.result.error);
const displaySaved=await api("save_ui_display_settings",{fontFamily:"Tahoma",baseFontSize:14,headingFontSize:18,materialNameSize:15,materialCodeSize:13,textColor:"#111827",mutedColor:"#52687a",materialNameColor:"#000000",materialCodeColor:"#0969a8",rowDensity:"compact"});assert.equal(displaySaved.response.status,200,displaySaved.result.error);
data=await load();assert.equal(data.engineRoleProfiles.find((row:any)=>row.engineKey==="engineer").companyCode,"ks_giam_sat");assert.equal(data.engineRoleProfiles.find((row:any)=>row.engineKey==="engineer").displayName,"Kỹ sư giám sát");assert.equal(data.businessRoleGroups.find((row:any)=>row.id===qsGroup.id).code,"qs_kiem_soat");assert.equal(data.businessRoleGroups.find((row:any)=>row.id===qsGroup.id).name,"QS / Kiểm soát khối lượng");assert(!data.businessRoleGroups.some((row:any)=>row.code==="qs_khoi_luong"));assert.equal(data.roleCatalog.find((row:any)=>row.code==="engineer").name,"Cán bộ hiện trường");assert.equal(data.roleCatalog.find((row:any)=>row.code==="engineer").businessGroupId,qsGroup.id);assert(!data.roleCatalog.some((row:any)=>row.code==="gs_cong_truong"));assert.equal(data.roleCatalog.find((row:any)=>row.code==="gs_giam_sat").name,"Kỹ sư giám sát");assert.equal(data.users.find((row:any)=>row.username==="giam.sat.ma.test").role,"gs_giam_sat");assert.equal(data.uiDisplaySettings.fontFamily,"Tahoma");assert.equal(Number(data.uiDisplaySettings.materialNameSize),15);

// V5.2.3: thứ tự biểu mẫu dùng 1..N liên tục và có thể đổi bằng một lần lưu.
const technicalSourceOrder=data.formFieldConfigs.find((row:any)=>row.formKey==="boq"&&row.fieldKey==="sourceOrder");assert(technicalSourceOrder);assert.equal(Boolean(technicalSourceOrder.visible),false);assert.equal(Boolean(technicalSourceOrder.importable),false);assert.equal(Boolean(technicalSourceOrder.exportable),false);
const boqFields=data.formFieldConfigs.filter((row:any)=>row.formKey==="boq"&&row.fieldKey!=="sourceOrder").sort((a:any,b:any)=>Number(a.sortOrder)-Number(b.sortOrder));assert(boqFields.length>3);
const movedKey=boqFields[2].fieldKey;const reordered=[boqFields[2],boqFields[0],boqFields[1],...boqFields.slice(3)].map((row:any,index:number)=>({...row,sortOrder:index+1}));
const reorderedSaved=await api("reorder_form_fields",{formKey:"boq",items:reordered});assert.equal(reorderedSaved.response.status,200,reorderedSaved.result.error);
data=await load();const reorderedLoaded=data.formFieldConfigs.filter((row:any)=>row.formKey==="boq"&&row.fieldKey!=="sourceOrder").sort((a:any,b:any)=>Number(a.sortOrder)-Number(b.sortOrder));assert.equal(reorderedLoaded[0].fieldKey,movedKey);assert.deepEqual(reorderedLoaded.map((row:any)=>Number(row.sortOrder)),Array.from({length:reorderedLoaded.length},(_,index)=>index+1));

// V5.2.3: tài khoản nhân viên nghỉ việc được khóa trực tiếp, thu hồi phiên và chỉ xóa nếu chưa có lịch sử nghiệp vụ.
cookie=adminCookie;const disposableCreated=await api("create_user",{employeeCode:"NV-XOA-TEST",fullName:"Nhân viên chưa phát sinh",username:"nhanvien.xoa.test",email:"nhanvien.xoa.test@example.com",password:"Disposable@2026",role:"engineer",department:"Kiểm thử",projectIds:[]});assert.equal(disposableCreated.response.status,200,disposableCreated.result.error);data=await load();const disposable=data.users.find((row:any)=>row.username==="nhanvien.xoa.test");assert(disposable);
cookie="";const disposableLogin=await api("login",{username:"nhanvien.xoa.test",password:"Disposable@2026"});assert.equal(disposableLogin.response.status,200,disposableLogin.result.error);cookie=adminCookie;const disposableLocked=await api("set_user_status",{userId:disposable.id,active:0});assert.equal(disposableLocked.response.status,200,disposableLocked.result.error);data=await load();assert.equal(Boolean(data.users.find((row:any)=>row.id===disposable.id)?.active),false);assert.equal(Number((sqlite.prepare(`SELECT COUNT(*) AS count FROM sessions WHERE user_id=?`).get(disposable.id) as {count:number}).count),0);
cookie="";const lockedLogin=await api("login",{username:"nhanvien.xoa.test",password:"Disposable@2026"});assert.notEqual(lockedLogin.response.status,200);cookie=adminCookie;const usedDeleteDenied=await api("delete_user",{userId:disposable.id});assert.equal(usedDeleteDenied.response.status,400);assert.match(String(usedDeleteDenied.result.error),/lịch sử nghiệp vụ/);
const neverUsedCreated=await api("create_user",{employeeCode:"NV-XOA-TRONG",fullName:"Nhân viên chưa đăng nhập",username:"nhanvien.chua.dung",email:"nhanvien.chua.dung@example.com",password:"NeverUsed@2026",role:"engineer",department:"Kiểm thử",projectIds:[]});assert.equal(neverUsedCreated.response.status,200,neverUsedCreated.result.error);data=await load();const neverUsed=data.users.find((row:any)=>row.username==="nhanvien.chua.dung");assert(neverUsed);const neverUsedLocked=await api("set_user_status",{userId:neverUsed.id,active:0});assert.equal(neverUsedLocked.response.status,200,neverUsedLocked.result.error);const neverUsedDeleted=await api("delete_user",{userId:neverUsed.id});assert.equal(neverUsedDeleted.response.status,200,neverUsedDeleted.result.error);data=await load();assert(!data.users.some((row:any)=>row.id===neverUsed.id));

setRuntimeEnvForTests(null); sqlite.close();
console.log("Workflow VNTECH ERP V5.3.0 FULL W2 passed: five-stage approvals/email/SLA → multi-PO/multi-delivery → strict material master → contract stock → inherited/override permissions → configurable groups/roles/UI → user safety.");
