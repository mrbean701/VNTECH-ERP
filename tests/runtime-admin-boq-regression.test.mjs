import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFile, readdir } from 'node:fs/promises';
import { rankMaterialCandidates, materialCandidateGate } from '../lib/material-matching-v2.mjs';

// U-11 (18/09/2026) — `app/page.tsx` ĐANG ĐƯỢC TÁCH THÀNH MODULE (roadmap `U-11`). Các phép kiểm NỘI DUNG
// phải đọc **HỢP NHẤT nguồn giao diện**, nếu không chính tầng kiểm thử sẽ **CHẶN việc tách mà roadmap yêu cầu**
// (đã xảy ra thật: hằng số chuyển sang `lib/ui-shared.tsx` ⇒ regex không khớp ⇒ test đỏ oan).
// ⚠️ KHÔNG nới lỏng phép kiểm: literal vẫn phải tồn tại trong nguồn giao diện, chỉ đổi phạm vi ĐỌC.
// Tệp nào chưa tồn tại thì bỏ qua (tương thích ngược với bản chỉ có `app/page.tsx`).
const readUiSource = async () => {
  const parts = [];
  for (const relative of ['app/page.tsx', 'lib/ui-shared.tsx', 'lib/menu-helpers.ts', 'lib/request-actions.ts', 'lib/workflow-helpers.ts', 'app/screens/BoqControl.tsx', 'app/screens/RequestDrawer.tsx', 'app/screens/WorkCenter.tsx']) {
    try { parts.push(await readFile(relative, 'utf8')); } catch { /* tệp chưa tồn tại sau khi tách */ }
  }
  return parts.join('\n');
};

class TestStatement {
  constructor(database, sql, values = []) { this.database = database; this.sql = sql; this.values = values; }
  bind(...values) { return new TestStatement(this.database, this.sql, values); }
  async first() { return this.database.prepare(this.sql).get(...this.values) ?? null; }
  async all() { return { success: true, results: this.database.prepare(this.sql).all(...this.values) }; }
  async run() { return { success: true, meta: this.database.prepare(this.sql).run(...this.values) }; }
}
class TestDatabase {
  constructor(database) { this.database = database; }
  prepare(sql) { return new TestStatement(this.database, sql); }
  async batch(statements) {
    this.database.exec('BEGIN');
    try { const out=[]; for (const statement of statements) out.push(await statement.run()); this.database.exec('COMMIT'); return out; }
    catch (error) { this.database.exec('ROLLBACK'); throw error; }
  }
}

const sqlite = new DatabaseSync(':memory:');
sqlite.exec('PRAGMA foreign_keys=ON');
let migrationStatements=0;
for (const file of (await readdir('drizzle')).filter((name)=>name.endsWith('.sql')).sort()) {
  const sql=await readFile(`drizzle/${file}`,'utf8');
  for (const statement of sql.split('--> statement-breakpoint').map((value)=>value.trim()).filter(Boolean)) { sqlite.exec(statement); migrationStatements++; }
}
globalThis.__MEP_LOCAL_ENV__={DB:new TestDatabase(sqlite),BUCKET:{put:async()=>{},get:async()=>null},EMAIL_SECRET:'full-w2-regression',TRUST_STATE:{machineFingerprint:'a'.repeat(64)}};
const { GET, POST } = await import('../scripts/system-route.mjs');

async function post(cookie, action, payload={}) {
  const response=await POST(new Request('http://full-w2.test/api/system',{method:'POST',headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},body:JSON.stringify({action,...payload})}));
  let body={}; try{body=await response.json();}catch{}
  return {status:response.status,body,headers:response.headers};
}
async function load(cookie){const response=await GET(new Request('http://full-w2.test/api/system',{headers:{Cookie:cookie}}));assert.equal(response.status,200);return (await response.json()).data;}

const setup=await post('', 'setup',{companyName:'VNTECH FULL W2 TEST',fullName:'Admin FULL W2',username:'admin',email:'admin@full-w2.test',password:'Admin123456@'});
assert.equal(setup.status,201,setup.body.error);const adminCookie=setup.headers.get('set-cookie').split(';')[0];

async function ensureWorkflowOwners(projectId){
  // PHASE 2 (§6 · §23 — chỉ đạo người dùng 21/09/2026): luồng duyệt PR mặc định nay là 4 tác nhân theo đặc tả,
  // mỗi tác nhân MỘT người duyệt: Thư ký TGĐ (bước 2) → Phòng Dự án (bước 3) → Phòng Kế hoạch (bước 4) →
  // Giám đốc (bước 5). Vì vậy Owner của bước 4 phải là vai trò `procurement/kh_nv` và bước 5 là `director` —
  // trước đây (bước 4 = KH tiếp nhận, bước 5 = DA+KH xác nhận cuối) là `da_truong`/`kh_truong`.
  const stageUsers=[
    {stage:2,username:'p02.thuky',employeeCode:'P02-THUKY',fullName:'Thư ký FULL W2',email:'thuky@full-w2.test',role:'thuky'},
    {stage:3,username:'p02.danv',employeeCode:'P02-DANV',fullName:'Nhân viên DA FULL W2',email:'danv@full-w2.test',role:'project'},
    {stage:4,username:'p02.khnv',employeeCode:'P02-KHNV',fullName:'Nhân viên Kế hoạch FULL W2',email:'khnv@full-w2.test',role:'kh_nv'},
    {stage:5,username:'p02.giamdoc',employeeCode:'P02-GD',fullName:'Giám đốc FULL W2',email:'giamdoc@full-w2.test',role:'director'},
  ];
  const stamp=new Date().toISOString();
  for(const item of stageUsers){
    let u=sqlite.prepare('SELECT id FROM users WHERE username=?').get(item.username);
    if(!u){const r=await post(adminCookie,'create_user',{employeeCode:item.employeeCode,fullName:item.fullName,username:item.username,email:item.email,role:item.role,password:'Admin123456@'});assert.equal(r.status,200,r.body.error);u=sqlite.prepare('SELECT id FROM users WHERE username=?').get(item.username);}
    sqlite.prepare(`INSERT OR IGNORE INTO user_project_scopes(id,user_id,project_id,permission,created_at,updated_at) VALUES (?,?,?,?,?,?)`).run(`UPS-${projectId}-${item.stage}`,u.id,projectId,'approve',stamp,stamp);
    sqlite.prepare(`INSERT INTO approval_project_assignments(id,project_id,stage,owner_user_id,cc_emails,active,updated_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(project_id,stage) DO UPDATE SET owner_user_id=excluded.owner_user_id,active=1,updated_at=excluded.updated_at`).run(`APOWN-${projectId}-${item.stage}`,projectId,item.stage,u.id,null,1,sqlite.prepare("SELECT id FROM users WHERE username='admin'").get().id,stamp,stamp);
  }
}

await test('FULL W2 migration chain + canonical Organization/RBAC', async()=>{
  assert.ok(migrationStatements>450);
  const data=await load(adminCookie);
  assert.ok(data.organizationUnits.some((x)=>x.code==='BGD'&&x.name==='Ban giám đốc'));
  assert.ok(data.organizationUnits.some((x)=>x.code==='HCPC'&&x.name==='Hành chính Pháp chế'));
  assert.ok(data.roleCatalog.some((x)=>x.code==='thuky'&&x.name==='Thư ký Tổng giám đốc'&&x.defaultOrganizationCode==='BGD'));
  assert.ok(data.roleCatalog.some((x)=>x.code==='hcpc_truong'&&x.defaultOrganizationCode==='HCPC'));
  assert.ok(data.businessScopes.length>=9);
});

await test('Import tài khoản chấp nhận Ban giám đốc canonical', async()=>{
  const result=await post(adminCookie,'bulk_import_users',{sourceFileName:'accounts.xlsx',rows:[{rowNo:3,employeeCode:'P01-BGD-01',fullName:'Giám đốc test',username:'p01.director',password:'Admin123456@',email:'director@full-w2.test',department:'Ban giám đốc',role:'director',status:'ACTIVE'}]});
  assert.equal(result.status,200,result.body.error);
  const row=sqlite.prepare("SELECT organization_unit_id AS orgId,department FROM users WHERE username='p01.director'").get();
  assert.equal(row.orgId,'ORG-BGD'); assert.equal(row.department,'Ban giám đốc');
});

await test('Admin reset mật khẩu: cấp mật khẩu tạm, thu hồi session và bắt buộc đổi trước khi dùng', async()=>{
  let r=await post(adminCookie,'create_user',{employeeCode:'P01-RESET-01',fullName:'Nhân sự Reset',username:'p01.reset',email:'reset@full-w2.test',role:'project',department:'Phòng Dự án',password:'OldPassword123@'});assert.equal(r.status,200,r.body.error);
  const target=sqlite.prepare("SELECT id FROM users WHERE username='p01.reset'").get();assert.ok(target?.id);
  let login=await post('','login',{username:'p01.reset',password:'OldPassword123@'});assert.equal(login.status,200,login.body.error);const oldCookie=login.headers.get('set-cookie').split(';')[0];
  r=await post(adminCookie,'reset_user_password',{userId:target.id});assert.equal(r.status,200,r.body.error);assert.ok(r.body.temporaryPassword);assert.notEqual(r.body.temporaryPassword,'OldPassword123@');assert.equal(sqlite.prepare('SELECT must_change_password AS mustChange FROM users WHERE id=?').get(target.id).mustChange,1);
  assert.equal((await post(oldCookie,'preview_request_import',{})).status,401);
  login=await post('','login',{username:'p01.reset',password:r.body.temporaryPassword});assert.equal(login.status,200,login.body.error);const tempCookie=login.headers.get('set-cookie').split(';')[0];
  let blocked=await post(tempCookie,'preview_request_import',{});assert.equal(blocked.status,428);assert.match(blocked.body.error,/đổi mật khẩu tạm thời/i);
  let changed=await post(tempCookie,'change_password',{currentPassword:r.body.temporaryPassword,newPassword:'NewPassword123@'});assert.equal(changed.status,200,changed.body.error);assert.equal(sqlite.prepare('SELECT must_change_password AS mustChange FROM users WHERE id=?').get(target.id).mustChange,0);
  login=await post('','login',{username:'p01.reset',password:'NewPassword123@'});assert.equal(login.status,200,login.body.error);
  const auditRow=sqlite.prepare("SELECT after_json AS afterJson FROM audit_logs WHERE action='PASSWORD_RESET' AND entity_id=? ORDER BY occurred_at DESC LIMIT 1").get(target.id);assert.ok(auditRow);assert.doesNotMatch(String(auditRow.afterJson||''),new RegExp(r.body.temporaryPassword.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')));
});

await test('Phạm vi nghiệp vụ -> Nhóm quyền -> Chức danh đều tùy biến và đồng bộ', async()=>{
  let r=await post(adminCookie,'save_business_scope',{code:'qs_scope',name:'QS / Khối lượng',description:'Phạm vi test FULL W2',sortOrder:501});assert.equal(r.status,200,r.body.error);
  let data=await load(adminCookie);const scope=data.businessScopes.find((x)=>x.code==='qs_scope');assert.ok(scope);
  r=await post(adminCookie,'save_business_role_group',{code:'qs_group',name:'Nhóm QS',engineRole:'project',scopeIds:[scope.id],sortOrder:502});assert.equal(r.status,200,r.body.error);
  data=await load(adminCookie);const group=data.businessRoleGroups.find((x)=>x.code==='qs_group');assert.ok(group);assert.ok(group.scopeIds.includes(scope.id));
  r=await post(adminCookie,'save_role_catalog',{code:'qs_role',name:'Kỹ sư QS FULL W2',businessGroupId:group.id,defaultOrganizationUnitId:'ORG-DA',sortOrder:503});assert.equal(r.status,200,r.body.error);
  data=await load(adminCookie);const role=data.roleCatalog.find((x)=>x.code==='qs_role');assert.ok(role);assert.equal(role.businessGroupId,group.id);assert.equal(role.defaultOrganizationCode,'DA');
});

await test('Project lifecycle: một archive VERIFIED dùng xuyên suốt Đóng → Xóa/Purge và BOQ link vòng được dọn sạch', async()=>{
  let r=await post(adminCookie,'bulk_import_projects',{rows:[{rowNo:2,code:'P01-DELETE',name:'Dự án kết thúc',warehouseCode:'KHO-P01-DELETE',warehouseName:'Kho dự án kết thúc',status:'ACTIVE'}]});assert.equal(r.status,200,r.body.error);
  let p=sqlite.prepare("SELECT id,updated_at AS updatedAt FROM projects WHERE code='P01-DELETE'").get();
  r=await post(adminCookie,'set_project_status',{projectId:p.id,status:'closed'});assert.equal(r.status,400);assert.match(r.body.error,/TẢI TOÀN BỘ DỮ LIỆU DỰ ÁN/i);
  const admin=sqlite.prepare("SELECT id FROM users WHERE username='admin'").get();
  sqlite.prepare(`INSERT INTO project_archives(id,project_id,project_code,project_name,file_name,sha256,byte_size,record_count,attachment_count,schema_version,status,generated_by,generated_at,downloaded_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run('PAR-PRE-CLOSE',p.id,'P01-DELETE','Dự án kết thúc','P01-before-close.zip','a'.repeat(64),100,1,0,'5.3.0-FULL-W2-0047','verified',admin.id,new Date().toISOString(),new Date().toISOString());
  r=await post(adminCookie,'set_project_status',{projectId:p.id,status:'closed'});assert.equal(r.status,200,r.body.error);assert.equal(sqlite.prepare('SELECT status FROM projects WHERE id=?').get(p.id).status,'closed');
  r=await post(adminCookie,'delete_project',{projectId:p.id,confirmCode:'SAI-MA'});assert.equal(r.status,400);assert.match(r.body.error,/nhập chính xác mã dự án/i);
  r=await post(adminCookie,'delete_project',{projectId:p.id,confirmCode:'P01-DELETE'});assert.equal(r.status,200,r.body.error);assert.equal(sqlite.prepare('SELECT status FROM projects WHERE id=?').get(p.id).status,'purged');assert.equal(sqlite.prepare('SELECT active FROM warehouses WHERE project_id=?').get(p.id).active,0);
  const stamp=new Date().toISOString();sqlite.prepare(`INSERT INTO materials(id,code,name,system,specification,brand,unit,standard_price,min_stock,requires_cocq,requires_mar,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run('P01-PURGE-MAT','P01-PURGE-MAT','Vật tư kiểm thử liên kết vòng','DIEN','','','m',0,0,0,0,1,stamp,stamp);
  r=await post(adminCookie,'bulk_import_projects',{rows:[{rowNo:2,code:'P01-PURGE-BOQ',name:'Dự án purge có BOQ',warehouseCode:'KHO-P01-PURGE',warehouseName:'Kho purge BOQ',status:'ACTIVE'}]});assert.equal(r.status,200,r.body.error);const purgeProject=sqlite.prepare("SELECT id FROM projects WHERE code='P01-PURGE-BOQ'").get();
  const purgeContract=await post(adminCookie,'save_project_contract',{projectId:purgeProject.id,contractNo:'HD-PURGE',contractName:'Hợp đồng purge'});assert.equal(purgeContract.status,200,purgeContract.body.error);
  const purgeBoq=await post(adminCookie,'replace_boq_items',{projectId:purgeProject.id,contractId:purgeContract.body.contractId,importMode:'new_version',versionCode:'VPURGE',rows:[{rowRole:'material',lineNo:'1',contractMaterialCode:'HD-PURGE-01',approvedMaterialCode:'PD-PURGE-01',materialName:'Vật tư kiểm thử liên kết vòng',unit:'m',contractQty:1,internalMaterialCode:'P01-PURGE-MAT'}]});assert.equal(purgeBoq.status,200,purgeBoq.body.error);assert.equal(sqlite.prepare('SELECT COUNT(*) c FROM project_boq_items WHERE project_id=?').get(purgeProject.id).c,1);
  r=await post(adminCookie,'set_project_status',{projectId:purgeProject.id,status:'archived'});assert.equal(r.status,200,r.body.error);sqlite.prepare(`INSERT INTO project_archives(id,project_id,project_code,project_name,file_name,sha256,byte_size,record_count,attachment_count,schema_version,status,generated_by,generated_at,downloaded_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run('PAR-PURGE-BOQ',purgeProject.id,'P01-PURGE-BOQ','Dự án purge có BOQ','P01-purge-boq.zip','b'.repeat(64),100,3,0,'5.3.0-FULL-W2-0047','verified',admin.id,new Date().toISOString(),new Date().toISOString());
  r=await post(adminCookie,'delete_project',{projectId:purgeProject.id,confirmCode:'P01-PURGE-BOQ'});assert.equal(r.status,200,r.body.error);assert.equal(sqlite.prepare('SELECT COUNT(*) c FROM boq_source_items WHERE project_id=?').get(purgeProject.id).c,0);assert.equal(sqlite.prepare('SELECT COUNT(*) c FROM project_boq_items WHERE project_id=?').get(purgeProject.id).c,0);assert.equal(sqlite.prepare('SELECT COUNT(*) c FROM boq_versions WHERE project_id=?').get(purgeProject.id).c,0);
  r=await post(adminCookie,'bulk_import_projects',{rows:[{rowNo:2,code:'P01-BOQ',name:'Dự án BOQ',warehouseCode:'KHO-P01-BOQ',warehouseName:'Kho BOQ',status:'ACTIVE'}]});assert.equal(r.status,200,r.body.error);p=sqlite.prepare("SELECT id FROM projects WHERE code='P01-BOQ'").get();
  const c=await post(adminCookie,'save_project_contract',{projectId:p.id,contractNo:'HD-01',contractName:'Hợp đồng 01'});assert.equal(c.status,200,c.body.error);
  r=await post(adminCookie,'set_project_status',{projectId:p.id,status:'archived'});assert.equal(r.status,200,r.body.error);assert.equal(sqlite.prepare('SELECT status FROM projects WHERE id=?').get(p.id).status,'archived');
  r=await post(adminCookie,'set_project_status',{projectId:p.id,status:'active'});assert.equal(r.status,200,r.body.error);
});

await test('BOQ multi-contract/multi-version không ghi đè hợp đồng khác', async()=>{
  const project=sqlite.prepare("SELECT id FROM projects WHERE code='P01-BOQ'").get();
  const c1=sqlite.prepare("SELECT id FROM project_contracts WHERE project_id=? AND contract_no='HD-01'").get(project.id);
  const c2r=await post(adminCookie,'save_project_contract',{projectId:project.id,contractNo:'HD-02',contractName:'Hợp đồng 02'});assert.equal(c2r.status,200,c2r.body.error);const c2={id:c2r.body.contractId};
  let r1=await post(adminCookie,'replace_boq_items',{projectId:project.id,contractId:c1.id,importMode:'new_version',versionCode:'V1',sourceFileName:'hd01-v1.xlsx',rows:[{rowRole:'heading',lineNo:'A',materialName:'CHI PHÍ XÂY DỰNG',unit:'',contractQty:0},{rowRole:'material',lineNo:'1',materialName:'Ống PPR DN20',unit:'m',contractQty:10,systemCode:'CTN'}]});assert.equal(r1.status,200,r1.body.error);
  const r2=await post(adminCookie,'replace_boq_items',{projectId:project.id,contractId:c2.id,importMode:'new_version',versionCode:'V1',sourceFileName:'hd02-v1.xlsx',rows:[{rowRole:'material',lineNo:'1',materialName:'Cáp mạng CAT6 UTP',unit:'m',contractQty:20,systemCode:'DNHE'}]});assert.equal(r2.status,200,r2.body.error);
  assert.equal(sqlite.prepare('SELECT COUNT(*) c FROM boq_source_items WHERE contract_id=?').get(c1.id).c,2);assert.equal(sqlite.prepare('SELECT COUNT(*) c FROM boq_source_items WHERE contract_id=?').get(c2.id).c,1);
  const r3=await post(adminCookie,'replace_boq_items',{projectId:project.id,contractId:c1.id,importMode:'new_version',versionCode:'V2',sourceFileName:'hd01-v2.xlsx',rows:[{rowRole:'material',lineNo:'1',materialName:'Ống PPR DN25',unit:'m',contractQty:12,systemCode:'CTN'}]});assert.equal(r3.status,200,r3.body.error);
  assert.equal(sqlite.prepare('SELECT COUNT(*) c FROM boq_versions WHERE contract_id=?').get(c1.id).c,2);assert.equal(sqlite.prepare('SELECT COUNT(*) c FROM boq_versions WHERE contract_id=?').get(c2.id).c,1);
  assert.equal(sqlite.prepare('SELECT COUNT(*) c FROM boq_source_items WHERE contract_id=?').get(c1.id).c,3);assert.equal(sqlite.prepare('SELECT COUNT(*) c FROM boq_source_items WHERE contract_id=?').get(c2.id).c,1);
  const loaded=await load(adminCookie);assert.ok(loaded.boqSourceItems.some((row)=>row.contractId===c1.id&&row.materialName==='Ống PPR DN25'));assert.ok(loaded.boqSourceItems.some((row)=>row.contractId===c2.id&&row.materialName==='Cáp mạng CAT6 UTP'));
  const c3r=await post(adminCookie,'save_project_contract',{projectId:project.id,contractNo:'HD-XOA',contractName:'Hợp đồng nhập nhầm'});assert.equal(c3r.status,200,c3r.body.error);
  let deleted=await post(adminCookie,'delete_project_contract',{contractId:c3r.body.contractId,confirmText:'XOA SAI'});assert.equal(deleted.status,400);assert.match(deleted.body.error,/XOA HD-XOA/);
  deleted=await post(adminCookie,'delete_project_contract',{contractId:c3r.body.contractId,confirmText:'XOA HD-XOA'});assert.equal(deleted.status,200,deleted.body.error);assert.equal(sqlite.prepare('SELECT COUNT(*) c FROM project_contracts WHERE id=?').get(c3r.body.contractId).c,0);
  const parent=await post(adminCookie,'save_project_contract',{projectId:project.id,contractNo:'HD-CHA',contractName:'Hợp đồng cha'});assert.equal(parent.status,200,parent.body.error);
  const child=await post(adminCookie,'save_project_contract',{projectId:project.id,contractNo:'PL-01',contractName:'Phụ lục 01',parentContractId:parent.body.contractId});assert.equal(child.status,200,child.body.error);
  deleted=await post(adminCookie,'delete_project_contract',{contractId:parent.body.contractId,confirmText:'XOA HD-CHA'});assert.equal(deleted.status,400);assert.match(deleted.body.error,/phụ lục/i);
  deleted=await post(adminCookie,'delete_project_contract',{contractId:child.body.contractId,confirmText:'XOA PL-01'});assert.equal(deleted.status,200,deleted.body.error);
  deleted=await post(adminCookie,'delete_project_contract',{contractId:parent.body.contractId,confirmText:'XOA HD-CHA'});assert.equal(deleted.status,200,deleted.body.error);
});

await test('BOQ CRUD: sửa, xóa đơn, khôi phục, xóa/khôi phục toàn version và Change History', async()=>{
  const project=sqlite.prepare("SELECT id FROM projects WHERE code='P01-BOQ'").get();const c1=sqlite.prepare("SELECT id FROM project_contracts WHERE project_id=? AND contract_no='HD-01'").get(project.id);const version=sqlite.prepare("SELECT id,version_code AS code FROM boq_versions WHERE contract_id=? AND version_code='V2'").get(c1.id);const source=sqlite.prepare('SELECT id FROM boq_source_items WHERE boq_version_id=? ORDER BY source_order LIMIT 1').get(version.id);
  let r=await post(adminCookie,'save_boq_item',{projectId:project.id,contractId:c1.id,boqVersionId:version.id,sourceItemId:source.id,rowRole:'material',itemType:'contract',sourceOrder:1,contractLineRef:'1',systemCode:'CTN',materialName:'Ống PPR DN25 - sửa đúng',unit:'m',contractQty:12,remeasuredQty:12,unitPrice:100,note:'Sửa nhập sai',reason:'Sửa nhập sai'});assert.equal(r.status,200,r.body.error);assert.equal(sqlite.prepare('SELECT contract_material_name n FROM boq_source_items WHERE id=?').get(source.id).n,'Ống PPR DN25 - sửa đúng');assert.ok(sqlite.prepare('SELECT COUNT(*) c FROM boq_change_history WHERE source_item_id=?').get(source.id).c>=1);
  r=await post(adminCookie,'delete_boq_item',{sourceItemId:source.id,reason:'Xóa dòng test'});assert.equal(r.status,200,r.body.error);assert.equal(sqlite.prepare('SELECT active FROM boq_source_items WHERE id=?').get(source.id).active,0);
  r=await post(adminCookie,'bulk_boq_item_action',{sourceItemIds:[source.id],mode:'restore',reason:'Khôi phục test'});assert.equal(r.status,200,r.body.error);assert.equal(sqlite.prepare('SELECT active FROM boq_source_items WHERE id=?').get(source.id).active,1);
  r=await post(adminCookie,'clear_boq_version',{projectId:project.id,contractId:c1.id,boqVersionId:version.id,mode:'archive',reason:'Archive version test'});assert.equal(r.status,200,r.body.error);assert.equal(sqlite.prepare('SELECT status FROM boq_versions WHERE id=?').get(version.id).status,'archived');
  r=await post(adminCookie,'clear_boq_version',{projectId:project.id,contractId:c1.id,boqVersionId:version.id,mode:'restore',reason:'Restore version test'});assert.equal(r.status,200,r.body.error);assert.equal(sqlite.prepare('SELECT status FROM boq_versions WHERE id=?').get(version.id).status,'draft');
  const disposable=await post(adminCookie,'replace_boq_items',{projectId:project.id,contractId:c1.id,importMode:'new_version',versionCode:'VDEL',rows:[{rowRole:'material',lineNo:'X',contractMaterialCode:'HD-X',approvedMaterialCode:'PD-X',materialName:'Vật tư kiểm thử liên kết vòng',unit:'m',contractQty:1,internalMaterialCode:'P01-PURGE-MAT'}]});assert.equal(disposable.status,200,disposable.body.error);assert.equal(sqlite.prepare('SELECT COUNT(*) c FROM project_boq_items WHERE boq_version_id=?').get(disposable.body.boqVersionId).c,1);
  r=await post(adminCookie,'clear_boq_version',{projectId:project.id,contractId:c1.id,boqVersionId:disposable.body.boqVersionId,mode:'purge',confirmText:'XOA VDEL'});assert.equal(r.status,200,r.body.error);assert.equal(sqlite.prepare('SELECT COUNT(*) c FROM boq_versions WHERE id=?').get(disposable.body.boqVersionId).c,0);
  const loaded=await load(adminCookie);assert.ok(loaded.boqChangeHistory.some((row)=>row.boqVersionId===version.id));
});

await test('Material Matching: exact=100%, loại candidate rác, heading/ĐVT trống không vào API matching', async()=>{
  const source={contractMaterialName:'Ống đồng điều hòa 6.35mm',unit:'m',systemCode:'HVAC'};const nonsense={id:'BAD',code:'DIEN-BAD',name:'Băng đồng 25x3mm liên kết các cọc',unit:'m',system:'DIEN'};assert.equal(materialCandidateGate(source,nonsense).accepted,false);assert.equal((await rankMaterialCandidates(source,[nonsense])).length,0);
  const exactSource={contractMaterialName:'Cáp Cu/XLPE/PVC 4x120mm2',unit:'m',systemCode:'DIEN'};const exactMaterial={id:'EXACT',code:'DIEN-EXACT',name:'Cáp Cu/XLPE/PVC 4x120mm2',unit:'m',system:'DIEN'};const exact=await rankMaterialCandidates(exactSource,[exactMaterial]);assert.equal(exact[0].finalScore,1);assert.equal(exact[0].status,'exact');
  const stamp=new Date().toISOString();sqlite.prepare(`INSERT INTO materials(id,code,name,system,specification,brand,unit,standard_price,min_stock,requires_cocq,requires_mar,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run('P01-MAT-EXACT','DIEN-P01-001','Cáp Cu/XLPE/PVC 4x120mm2','DIEN','4x120mm2','', 'm',0,0,0,0,1,stamp,stamp);
  const project=sqlite.prepare("SELECT id FROM projects WHERE code='P01-BOQ'").get();const c2=sqlite.prepare("SELECT id FROM project_contracts WHERE project_id=? AND contract_no='HD-02'").get(project.id);
  const imported=await post(adminCookie,'replace_boq_items',{projectId:project.id,contractId:c2.id,importMode:'new_version',versionCode:'V2',rows:[{rowRole:'heading',lineNo:'A',materialName:'DÂY CÁP ĐIỆN TRONG NHÀ',unit:'',contractQty:0},{rowRole:'material',lineNo:'1',contractMaterialCode:'HD-CAP-120',approvedMaterialCode:'PD-CAP-120',materialName:'Cáp Cu/XLPE/PVC 4x120mm2',unit:'m',contractQty:10,systemCode:'DIEN'}]});assert.equal(imported.status,200,imported.body.error);
  const compared=await post(adminCookie,'compare_boq_materials',{projectId:project.id,contractId:c2.id,boqVersionId:imported.body.boqVersionId,batchId:imported.body.batchId,scope:'all'});assert.equal(compared.status,200,compared.body.error);assert.equal(compared.body.items.length,1);const cand=compared.body.items[0].candidates.find((x)=>x.materialId==='P01-MAT-EXACT');assert.ok(cand);assert.equal(cand.finalScore,1);assert.equal(cand.status,'exact');
  const sourceItem=compared.body.items[0];const confirmed=await post(adminCookie,'confirm_boq_material_mappings',{projectId:project.id,contractId:c2.id,boqVersionId:imported.body.boqVersionId,runId:compared.body.run.id,mappings:[{sourceItemId:sourceItem.id,materialId:'P01-MAT-EXACT',runId:compared.body.run.id}]});assert.equal(confirmed.status,200,confirmed.body.error);
  const mapped=sqlite.prepare('SELECT material_id AS materialId,contract_material_code AS contractMaterialCode,approved_material_code AS approvedMaterialCode FROM project_boq_items WHERE source_item_id=?').get(sourceItem.id);assert.equal(mapped.materialId,'P01-MAT-EXACT');assert.equal(mapped.contractMaterialCode,'HD-CAP-120');assert.equal(mapped.approvedMaterialCode,'PD-CAP-120');assert.notEqual(mapped.contractMaterialCode,'DIEN-P01-001');assert.notEqual(mapped.approvedMaterialCode,'DIEN-P01-001');
});

await test('M&E canonical dùng chung DIEN/CTN/HVAC/DNHE/PCCC/KHAC', async()=>{
  const cats=sqlite.prepare('SELECT code FROM material_categories WHERE active=1 ORDER BY code').all().map((x)=>x.code);for(const code of ['DIEN','CTN','HVAC','DNHE','PCCC','KHAC'])assert.ok(cats.includes(code),`missing ${code}`);assert.ok(!cats.includes('ELV'));
  const routeSource=await readFile('scripts/system-route.mjs','utf8');assert.match(routeSource,/row_role IN \('material','component'\) AND trim\(COALESCE\(unit,''\)\)<>''/);
});

await test('Bulk nhóm con + Trust collapse UI có marker hành vi', async()=>{
  const stamp=new Date().toISOString();sqlite.prepare(`INSERT INTO material_subcategories(id,category_id,code,name,scope_examples,review_status,active,sort_order,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`).run('SUB-P01-BULK','CAT-DIEN','DIEN-P01-BULK','Nhóm bulk FULL W2','test','approved',1,999,stamp,stamp);
  let r=await post(adminCookie,'bulk_material_subcategory_action',{subcategoryIds:['SUB-P01-BULK'],operation:'hide'});assert.equal(r.status,200,r.body.error);assert.equal(sqlite.prepare("SELECT active FROM material_subcategories WHERE id='SUB-P01-BULK'").get().active,0);
  r=await post(adminCookie,'bulk_material_subcategory_action',{subcategoryIds:['SUB-P01-BULK'],operation:'restore'});assert.equal(r.status,200,r.body.error);assert.equal(sqlite.prepare("SELECT active FROM material_subcategories WHERE id='SUB-P01-BULK'").get().active,1);
  r=await post(adminCookie,'bulk_material_subcategory_action',{subcategoryIds:['SUB-P01-BULK'],operation:'delete'});assert.equal(r.status,200,r.body.error);assert.equal(sqlite.prepare("SELECT COUNT(*) c FROM material_subcategories WHERE id='SUB-P01-BULK'").get().c,0);
  const ui=await readUiSource();assert.match(ui,/Chọn tất cả nhóm con đang lọc/);assert.match(ui,/bulk_material_subcategory_action/);assert.match(ui,/VNTECH LICENSE & TRUST/);assert.match(ui,/setExpanded\(value=>!value\)/);assert.match(ui,/expanded&&/);
});


await test('ĐNMH preview/enrich + tạo phiếu PostgreSQL-safe theo Contract/BOQ Version', async()=>{
  const project=sqlite.prepare("SELECT id FROM projects WHERE code='P01-BOQ'").get();
  const contract=sqlite.prepare("SELECT id FROM project_contracts WHERE project_id=? AND contract_no='HD-02'").get(project.id);
  await ensureWorkflowOwners(project.id);
  const imported=await post(adminCookie,'replace_boq_items',{projectId:project.id,contractId:contract.id,importMode:'new_version',versionCode:'VREQ',rows:[{rowRole:'material',lineNo:'10',boqCode:'BOQ-10',materialName:'Cáp Cu/XLPE/PVC 4x120mm2',unit:'m',contractQty:50,systemCode:'DIEN',internalMaterialCode:'DIEN-P01-001'}]});
  assert.equal(imported.status,200,imported.body.error);
  const preview=await post(adminCookie,'preview_request_import',{projectId:project.id,contractId:contract.id,boqVersionId:imported.body.boqVersionId,lines:[{lineNo:1,contractLineNo:'10',boqCode:'BOQ-10',materialCode:'DIEN-P01-001',materialName:'Cáp Cu/XLPE/PVC 4x120mm2',unit:'m',quantity:5}]});
  assert.equal(preview.status,200,preview.body.error);assert.equal(preview.body.summary.exact,1);assert.equal(preview.body.lines[0].contractQty,50);assert.equal(preview.body.lines[0].matchStatus,'exact');
  const created=await post(adminCookie,'create_request',{projectId:project.id,contractId:contract.id,boqVersionId:imported.body.boqVersionId,neededAt:'2026-09-10',area:'Tầng test',priority:'normal',purpose:'FULL W2 runtime',lines:preview.body.lines});
  assert.equal(created.status,200,created.body.error);assert.match(created.body.message||'',/Đã lập phiếu/);
  const request=sqlite.prepare("SELECT id,request_no AS requestNo,contract_id AS contractId,boq_version_id AS boqVersionId FROM material_requests WHERE purpose='FULL W2 runtime' ORDER BY created_at DESC LIMIT 1").get();assert.ok(request?.requestNo);assert.equal(request.contractId,contract.id);assert.equal(request.boqVersionId,imported.body.boqVersionId);
  assert.equal(sqlite.prepare('SELECT COUNT(*) c FROM material_request_items WHERE request_id=?').get(request.id).c,1);
  assert.ok(sqlite.prepare('SELECT COUNT(*) c FROM approvals WHERE request_id=?').get(request.id).c>=1);
});

await test('Project scope toàn hệ thống + RBAC popup + sticky grid + Factory Reset có marker hành vi', async()=>{
  const ui=await readUiSource();const css=await readFile('app/globals.css','utf8');const backend=await readFile('scripts/system-route.mjs','utf8');
  assert.match(ui,/projectAccessAll/);assert.match(ui,/Dự án được phân quyền/);assert.match(ui,/allowAll=\{data.projects.length>1\}/);assert.match(ui,/const initialProject=data.projects.length===1\?String\(data.projects\[0\]\.id\):"ALL"/);assert.match(backend,/const projectAccessAll = isAdmin\(user\);/);
  assert.match(ui,/PHÂN QUYỀN CÔNG VIỆC \/ CHỨC NĂNG/);assert.match(ui,/Đồng bộ SSOT/);assert.match(ui,/permissionMenuStructure/);assert.match(ui,/permission-group-row/);assert.match(ui,/permission-subgroup-row/);
  assert.match(ui,/preview_request_import/);assert.match(ui,/Đối chiếu lại/);assert.match(ui,/Mặc định gọn/);assert.match(ui,/column-resize-handle/);
  assert.match(css,/\.table-wrap>table>thead>tr>th\{position:sticky/);assert.match(css,/\.request-grid-wrap/);assert.match(css,/\.factory-reset-card/);
  assert.match(ui,/KHÔI PHỤC CÀI ĐẶT GỐC/);assert.match(ui,/VNTECH_ALLOW_FACTORY_RESET=1/);assert.match(ui,/Reset vật tư test · Đang khóa/);
  assert.match(backend,/factory_reset_preview/);assert.match(backend,/factory_reset_execute/);assert.doesNotMatch(backend,/\(\? IS NULL OR boq_version_id=\?\)/);
  const resetPreview=await post(adminCookie,'factory_reset_preview',{});assert.equal(resetPreview.status,200,resetPreview.body.error);assert.equal(resetPreview.body.enabled,false);
});


await test('Project context đồng bộ ĐNMH + tìm vật tư BOQ + collapse/brand UI REV1', async()=>{
  const ui=await readUiSource();const css=await readFile('app/globals.css','utf8');
  assert.match(ui,/contextProject=\{project\}/);
  assert.match(ui,/Đồng bộ theo dự án đang chọn ở màn hình ngoài/);
  // TASK-136/TASK-137 (21/09/2026) — chỉ đạo người dùng: ô Dự án bỏ chốt bắt buộc ⇒ ghi chú mới.
  assert.match(ui,/Không bắt buộc: có thể để trống — phiếu sẽ không thuộc dự án nào/);
  assert.match(ui,/const contractId=contracts\.some/);
  assert.match(ui,/const boqVersionId=versions\.some/);
  assert.match(ui,/setContractSelection\(""\);setBoqVersionSelection\(""\)/);
  // TASK-139 (21/09/2026) — chỉ đạo người dùng: ô «tên vật tư» tìm theo DANH MỤC VẬT TƯ GỐC (`data.materials`),
  // BỎ logic tìm theo BOQ / danh mục vật tư dự án. Hợp đồng mới thay assertion `:230` cũ (đòi placeholder BOQ).
  assert.match(ui,/Gõ mã \/ tên vật tư để tìm trong danh mục/);
  assert.doesNotMatch(ui,/để tìm BOQ/);
  assert.match(ui,/materialSearchListId/);
  assert.match(ui,/module-section-collapse/);
  assert.match(css,/linear-gradient\(180deg,#f59e0b 0%,#ff7a18 42%,#2f8cf0 100%\)/);
  assert.match(css,/\.module-section-collapse>summary/);
});

await test('Factory Reset test-gate xóa dữ liệu về fresh-install nhưng giữ canonical migration seed', async()=>{
  process.env.VNTECH_ALLOW_FACTORY_RESET='1';
  let result=await post(adminCookie,'factory_reset_execute',{confirmText:'KHOI PHUC CAI DAT GOC',backupConfirmed:true,password:'SaiPassword@1'});assert.equal(result.status,400);assert.match(result.body.error,/Mật khẩu Quản trị viên không đúng/);
  result=await post(adminCookie,'factory_reset_execute',{confirmText:'KHOI PHUC CAI DAT GOC',backupConfirmed:true,password:'Admin123456@'});assert.equal(result.status,200,result.body.error);assert.equal(result.body.setupRequired,true);
  assert.equal(sqlite.prepare('SELECT COUNT(*) c FROM users').get().c,0);assert.equal(sqlite.prepare('SELECT COUNT(*) c FROM projects').get().c,0);assert.equal(sqlite.prepare("SELECT COUNT(*) c FROM warehouses WHERE id='WH-CENTRAL'").get().c,1);
  assert.ok(sqlite.prepare("SELECT COUNT(*) c FROM organization_units WHERE code IN ('BGD','HCPC')").get().c>=2);
  delete process.env.VNTECH_ALLOW_FACTORY_RESET;
});

await test('Release manifest loại backup/update-state khỏi Docker context', async()=>{
  const generator=await readFile('scripts/generate-release-manifest.mjs','utf8');
  const verifier=await readFile('scripts/verify-full-release.mjs','utf8');
  assert.match(generator,/\.vntech_backups/);
  assert.match(generator,/\.vntech_update_state/);
  assert.match(verifier,/Manifest không được tham chiếu dữ liệu backup\/update-state/);
});

await test('BOQ source rows giữ kiểu Row để TypeScript không thu hẹp sai contract', async()=>{
  const ui=await readUiSource();
  assert.match(ui,/new Map<string, Row>/);
  assert.match(ui,/const sourceRows: Row\[\]/);
  assert.match(ui,/const op: Row = operationalBySource/);
});

await test('Workflow fixture tuân thủ contract RBAC động: Nhóm quyền có scope và Chức danh có Phòng mặc định', async()=>{
  const workflow=await readFile('tests/workflow-direct.test.ts','utf8');
  const groupCalls=[...workflow.matchAll(/api\("save_business_role_group",\{([^}]*)\}\)/g)].map((m)=>m[1]);
  assert.ok(groupCalls.length>=3,'Workflow phải có các case create/update Nhóm quyền');
  for(const payload of groupCalls) assert.match(payload,/scopeIds\s*:/,'Mọi save_business_role_group trong workflow phải truyền scopeIds');
  const roleCalls=[...workflow.matchAll(/api\("save_role_catalog",\{([^}]*)\}\)/g)].map((m)=>m[1]);
  assert.ok(roleCalls.length>=3,'Workflow phải có các case create/update Chức danh');
  for(const payload of roleCalls) assert.match(payload,/defaultOrganizationUnitId\s*:/,'Mọi save_role_catalog trong workflow phải truyền defaultOrganizationUnitId');
  assert.match(workflow,/const projectOrgUnit=data\.organizationUnits\.find\(\(row:any\)=>row\.code==="DA"\)/,'Workflow phải dùng Phòng Dự án canonical, không dùng tên phòng tùy ý');
});

sqlite.close();


test("Built UI contract dùng marker ổn định cho rule loại heading khỏi matching", async () => {
  const page = await readUiSource();
  const verifier = await readFile("scripts/verify-built-ui-contract.mjs", "utf8");
  assert.match(page, /data-contract="VNTECH_BOQ_HEADING_MATCHING_EXCLUSION_V1"/);
  assert.match(verifier, /VNTECH_BOQ_HEADING_MATCHING_EXCLUSION_V1/);
  assert.doesNotMatch(verifier, /dòng tiêu đề chỉ tổ chức hiển thị và không tham gia matching\./);
});

test('FULL W2 UX/workflow contract: header, drawer rộng, ngày Việt Nam, luồng CHT→Thư ký→DA→TPDA→TPKH', async () => {
  const page = await readUiSource();
  const css = await readFile('app/globals.css','utf8');
  const route = await readFile('scripts/system-route.mjs','utf8');
  const migration = await readFile('drizzle/0045_patch01_runtime_admin_boq_hardening.sql','utf8');
  const importer = await readFile('lib/admin-bulk-import.ts','utf8');
  assert.doesNotMatch(page,/className="topbar-brand vntech-brand-ribbon"/,'Header FULL không được render brand panel cũ');
  assert.match(page,/topbar-city-art topbar-city-light[\s\S]{0,160}vntech-header-city-light\.webp/,'Header FULL phải render City artwork');
  assert.match(css,/width:min\(68vw,1240px\)/,'Drawer\/modal desktop phải mở rộng trong dải 55–70%');
  assert.match(page,/day:"2-digit", month:"2-digit", year:"numeric"/,'UI phải hiển thị DD\/MM\/YYYY');
  assert.match(importer,/normalizeProjectImportDate/,'Import dự án phải chuẩn hóa ngày');
  assert.match(importer,/serial > 20000 && serial < 80000/,'Import phải nhận Excel serial date');
  assert.match(route,/returned_to_requester/,'Phiếu bị trả lại phải quay về CHT');
  assert.match(route,/resubmit_request/,'CHT phải gửi lại từ đầu được');
  assert.match(route,/delete_request/,'CHT phải xóa phiếu bị trả lại chưa phát sinh PO được');
  assert.match(migration,/name='CHT xác nhận nhu cầu'[\s\S]{0,360}auto_approve_on_submit=1[\s\S]{0,160}stage_no=1/,'Bước 1 phải là CHT tự xác nhận khi bấm Gửi');
  assert.match(migration,/name='Thư ký Tổng giám đốc'[\s\S]{0,320}stage_no=2/,'Bước 2 phải là Thư ký TGĐ');
  assert.match(migration,/name='Phòng Dự án'[\s\S]{0,320}stage_no=3/,'Bước 3 phải là Phòng Dự án');
  assert.match(migration,/name='Trưởng phòng Dự án'[\s\S]{0,360}stage_no=4/,'Bước 4 phải là Trưởng phòng Dự án');
  assert.match(migration,/name='Trưởng phòng Kế hoạch'[\s\S]{0,360}stage_no=5/,'Bước 5 phải là Trưởng phòng Kế hoạch');
  assert.match(migration,/stage_no>5/,'Chỉ các stage cũ sau cấp 5 mới bị tắt');
  // TASK-136/TASK-137 (21/09/2026) — CHỈ ĐẠO NGƯỜI DÙNG: gửi phiếu KHÔNG còn popup xác nhận;
  // cảnh báo "không tự thu hồi" chuyển thành ghi chú đầu form (BaseModal `note`).
  assert.doesNotMatch(page,/Bạn có chắc chắn muốn gửi phiếu này\?/,'Gửi phiếu KHÔNG còn popup xác nhận (chỉ đạo người dùng 21/09/2026)');
  assert.match(page,/Sau khi gửi, phiếu vào luồng phê duyệt ngay và không tự thu hồi\./,'Đầu form phải cảnh báo không thể tự thu hồi sau khi gửi');
  // ⚠️ MT2-P6-02 (§4.2, 23/09/2026) — ĐỔI NHÃN nút trong khu vực «PHIẾU ĐANG XỬ LÝ»:
  //    «◉ XEM / TẢI PHIẾU» ⇒ **«◉ CHI TIẾT»** vì §4.2 yêu cầu «Trong bảng Phiếu đang xử lý phải có nút “Chi tiết” ⇒ mở modal».
  //    ⛔ HÀNH VI KHÔNG ĐỔI: cùng `onClick={()=>open("detail",selected)}` ⇒ vẫn mở được phiếu TRƯỚC khi quyết định
  //    (đúng Ý NGHĨA gốc của phép kiểm này) — chỉ nhãn đổi theo yêu cầu mới của MASTER TASK 2 (GOAL §4: MT2 ưu tiên).
  assert.match(page,/>◉ CHI TIẾT<\/button>/,'Màn duyệt phải mở được phiếu (nút «Chi tiết» — §4.2) trước khi quyết định');
});

test('FULL W2 account recovery + project offline archive contract', async () => {
  const page = await readUiSource();
  const route = await readFile('scripts/system-route.mjs','utf8');
  const files = await readFile('app/api/files/route.ts','utf8');
  const migration = await readFile('drizzle/0046_patch01_account_recovery_project_offline_archive.sql','utf8');
  assert.match(migration,/must_change_password/);
  assert.match(migration,/CREATE TABLE IF NOT EXISTS project_archives/);
  assert.match(route,/reset_user_password/);
  assert.match(route,/DELETE FROM sessions WHERE user_id=\?/);
  assert.match(route,/PASSWORD_RESET/);
  assert.doesNotMatch(route,/UPDATE project_archives SET status='close_snapshot'/,'Archive VERIFIED đã tải phải tiếp tục hợp lệ cho bước Purge sau khi Đóng');
  assert.match(route,/PURGE_AFTER_OFFLINE_ARCHIVE/);
  assert.match(files,/VNTECH_PROJECT_OFFLINE_ARCHIVE_V1/);
  assert.match(files,/MANIFEST\.json/);
  assert.match(files,/contract_ownership_transfers/);
  assert.match(page,/RESET MẬT KHẨU/);
  assert.match(page,/Tải toàn bộ dữ liệu/);
  assert.match(page,/ForcedPasswordModal/);
});

test('FULL W2 responsive contract: login PC, mobile tree, collapsed hover flyout', async () => {
  const page = await readUiSource();
  const css = await readFile('app/globals.css','utf8');
  const migration0007 = await readFile('drizzle/0007_dynamic_projects_materials_boq_permissions.sql','utf8');
  assert.match(page,/VNTECH_FULL_W2_LOGIN_UI/,'Login FULL W2 phải có contract marker ổn định');
  assert.match(page,/NỀN TẢNG QUẢN TRỊ &amp;[\s\S]{0,120}ĐIỀU HÀNH DOANH NGHIỆP/,'Login phải dùng tiêu đề đã chốt');
  assert.match(page,/VNTECH[\s\S]{0,80}Enterprise Resource Planning[\s\S]{0,80}\(VNTECH ERP\)/,'Login phải giải nghĩa VNTECH ERP');
  assert.doesNotMatch(page,/Hệ thống quản trị phòng ban, dự án, mua hàng, kho vật tư,[\s\S]{0,100}phê duyệt và điều hành doanh nghiệp\.?/,'Login không được chứa dòng mô tả đã bị loại bỏ');
  assert.match(page,/VNTECH_FULL_W2_MOBILE_NAV/,'Mobile menu phải có tree contract');
  assert.match(page,/VNTECH_FULL_MOBILE_NAV_INTERACTION/,'Mobile menu phải có interaction contract');
  assert.match(page,/className="mobile-nav-children"/,'Mobile phải hiển thị được cấp con');
  assert.match(page,/mobile-brand-lockup/,'Mobile header phải có nhận diện VNTECH');
  assert.match(page,/opened \|\| sidebarCollapsed/,'Sidebar collapsed phải render branch để hover flyout');
  // KP #89 + KP #96 (18/09/2026): các biểu thức cũ (`hidden={!subOpen&&!sidebarCollapsed}`, cây workspace theo
  // dự án) thuộc 2 NHÁNH RENDER CHẾT đã DỌN — xem tools/probe-kp89-dead-dept-branch.mjs (25/25) và
  // tools/probe-kp96-dead-project-tree.mjs (31/31). Bất biến CÒN SỐNG: khung menu THU GỌN vẫn phải xổ được
  // cấp con khi hover, và nhánh desktop vẫn render cấp con trong `.nav-children`.
  assert.match(page,/className="nav-children" data-nav-label=\{group\.name\}/,'Nhánh desktop phải render cấp con trong .nav-children');
  assert.match(css,/\.app-shell\.sidebar-collapsed \.nav-tree-group:hover>\.nav-children/,'Khung thu gọn phải xổ cấp con khi hover (kể cả khi nhánh desktop đang đóng)');
  assert.doesNotMatch(css,/\.nav-subgroup|\.mobile-nav-grandchildren|\.project-workspace|\[data-nav-group="project_management"\]/,'Họ lớp của 2 cây chết (KP #89/#96) không được quay lại');
  assert.match(css,/VNTECH_MASTER_BASELINE_CSS_R1_1_1_BEGIN/);
  assert.match(css,/\.app-shell\.sidebar-collapsed \.nav-tree-group:hover>\.nav-children/,'Collapsed sidebar phải hover xổ flyout');
  assert.match(css,/width:min\(86vw,360px\)/,'Mobile drawer phải gọn và không tràn màn hình');
  assert.match(css,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/,'Dashboard mobile phải hỗ trợ KPI 2 cột');
  assert.match(css,/auth-enterprise-shell/,'PC login phải dùng layout doanh nghiệp mới');
  assert.match(css,/VNTECH_MASTER_BASELINE_CSS_R1_1_1_BEGIN/,'Phải có canonical CSS của Master Baseline R1.1.1');
  assert.match(page,/auth-login-master-art[\s\S]{0,120}vntech-login-r1-left\.png/,'Login desktop phải dùng master art độ phân giải cao');
  assert.match(page,/auth-city-art auth-city-light[\s\S]{0,160}vntech-header-city-light\.webp/,'Login phải render City Light bằng DOM thật');
  assert.match(css,/\.app-shell\.vntech-full-ui[\s\S]{0,7000}grid-template-areas:"spacer search actions user"/,'Header desktop phải giữ bốn slot không chồng nhau');
  assert.doesNotMatch(css,/vntech-login-wave\.svg|vntech-header-ribbon\.svg|vntech-mobile-header-ribbon\.svg|vntech-mobile-menu-ribbon\.svg|vntech-mobile-login-ribbon\.svg/,'FULL UI không được quay lại artwork cũ');
  assert.match(migration0007,/WITH module_keys\(module_key\) AS \([\s\S]*VALUES/,'Migration cài mới phải seed module bằng VALUES tương thích D1');
  assert.doesNotMatch(migration0007,/SELECT 'dashboard' module_key UNION ALL/,'Migration 0007 không được dùng compound SELECT gây lỗi cài mới D1');
});



test('MASTER BASELINE: /api/files has one SSOT and server adapters execute built Worker route', async () => {
  const universal = await readFile('scripts/universal-server.mjs','utf8');
  const local = await readFile('scripts/local-server.mjs','utf8');
  const runtime = await readFile('scripts/universal-runtime.mjs','utf8');
  const appRoute = await readFile('app/api/files/route.ts','utf8');
  assert.doesNotMatch(universal,/files-route\.mjs|filesRoute\./,'Universal Server không được giữ API files song song');
  assert.doesNotMatch(local,/files-route\.mjs|filesRoute\./,'Local Server không được giữ API files song song');
  assert.doesNotMatch(local,/\bfilesRouteUrl\b/,'Local Server không được còn biến filesRouteUrl mồ côi sau cleanup');
  assert.match(universal,/pathname === "\/api\/files"[\s\S]{0,240}worker\.fetch\(request, runtime\.env, executionContext\)/,'Universal Server phải chạy đúng built Worker route');
  assert.match(local,/pathname === "\/api\/files"[\s\S]{0,240}worker\.fetch\(request, runtime\.env, executionContext\)/,'Local Server phải chạy đúng built Worker route');
  assert.match(appRoute,/export async function DELETE/,'SSOT files phải hỗ trợ DELETE');
  assert.match(runtime,/async delete\(key\)[\s\S]{0,140}unlink\(path\)/,'Storage adapter phải thực thi delete vật lý');
});
test('Docker lint guard: project archive route không được dùng explicit any', async () => {
  const route = await readFile('app/api/files/route.ts','utf8');
  assert.doesNotMatch(route, /:\s*any\b|\bas\s+any\b|<\s*any\s*>/, 'app/api/files/route.ts không được chứa explicit any vì release lint cấm @typescript-eslint/no-explicit-any');
  assert.match(route, /type ArchiveSqlRow = Record<string, unknown>/);
  assert.match(route, /type AttachmentArchiveRow = ArchiveSqlRow/);
});


test('Docker typecheck guard: project archive ZIP dùng ArrayBuffer tương thích Web API', async () => {
  const route = await readFile('app/api/files/route.ts','utf8');
  assert.match(route, /function toArrayBuffer\(value: Uint8Array\): ArrayBuffer/);
  assert.match(route, /crypto\.subtle\.digest\("SHA-256", toArrayBuffer\(value\)\)/);
  assert.match(route, /new Response\(toArrayBuffer\(archive\.zipped\)/);
  assert.doesNotMatch(route, /crypto\.subtle\.digest\("SHA-256", value\)/);
  assert.doesNotMatch(route, /new Response\(archive\.zipped,/);
});

test('FULL W2 runtime UI: mobile/header/glass flyout/approval detail/password copy', async () => {
  const page = await readUiSource();
  const css = await readFile('app/globals.css','utf8');
  const route = await readFile('scripts/system-route.mjs','utf8');
  const files = await readFile('app/api/files/route.ts','utf8');
  assert.match(css,/VNTECH_MASTER_BASELINE_CSS_R1_1_1_BEGIN/,'Phải có canonical CSS của Master Baseline R1.1.1');
  assert.match(css,/backdrop-filter:blur\(18px\)/,'Collapsed sidebar phải dùng Glass Flyout');
  assert.match(css,/@media\s*\(max-width:980px\)\s*\{[\s\S]{0,1200}\.auth-page\.auth-full-city-login/,'Mobile login phải có responsive contract canonical max-width:980px');
  assert.match(page,/Ảnh \/ Hồ sơ vật tư đặc thù/,'MR phải dùng đúng tên hồ sơ vật tư đặc thù');
  assert.match(page,/SAO CHÉP MẬT KHẨU/,'Reset mật khẩu phải có nút copy rõ ràng');
  assert.match(page,/notificationCount=unreadTaskNotifications\.length\+actionableApprovalNotifications\.length/,'Chuông phải tính cả phiếu chờ duyệt');
  assert.match(page,/VNTECH_REQUEST_DETAIL_ALL_LINES_V1/,'Chi tiết phiếu phải có contract hiển thị toàn bộ dòng');
  assert.match(route,/chưa đối chiếu được đúng dòng BOQ\/Hợp đồng/,'Không cho gửi dòng chưa match BOQ nếu không phải ngoài HĐ');
  assert.match(route,/Chỉ Chỉ huy trưởng được hủy phiếu bị trả lại/,'Backend phải chặn hủy phiếu sai bước');
  assert.match(route,/LEFT JOIN materials m ON m\.id=mri\.material_id/,'Chi tiết MR không được mất dòng khi material master thiếu liên kết');
  assert.match(files,/export async function DELETE/,'Phải có xóa file đính kèm theo quyền');
  assert.match(files,/Chỉ Chỉ huy trưởng hoặc Phòng Dự án được xóa hồ sơ vật tư đặc thù/);
});

test('FULL W2 SQL bind arity guard: tạo Task Engine phải có đúng 32 cột, 32 placeholder và 32 giá trị', async () => {
  const route = await readFile('scripts/system-route.mjs','utf8');
  const line = route.split(/\r?\n/).find((value) => value.includes('INSERT INTO work_items('));
  assert.ok(line, 'Không tìm thấy lệnh tạo work_items');
  const sqlMatch = line.match(/prepare\(`([^`]*)`\)\.bind\(/);
  assert.ok(sqlMatch, 'Không phân tích được SQL work_items');
  const columnMatch = sqlMatch[1].match(/^INSERT INTO work_items\(([^)]+)\) VALUES/);
  assert.ok(columnMatch, 'Không phân tích được danh sách cột work_items');
  const bindStart = line.indexOf('.bind(') + 6;
  const bindEnd = line.lastIndexOf('),');
  assert.ok(bindStart > 5 && bindEnd > bindStart, 'Không phân tích được danh sách bind work_items');
  const bindSource = line.slice(bindStart, bindEnd);
  let depth = 0, quote = '', escaped = false, bindCount = bindSource.trim() ? 1 : 0;
  for (const ch of bindSource) {
    if (quote) {
      if (escaped) { escaped = false; continue; }
      if (ch === '\\') { escaped = true; continue; }
      if (ch === quote) quote = '';
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue; }
    if (ch === '(' || ch === '[' || ch === '{') depth += 1;
    else if (ch === ')' || ch === ']' || ch === '}') depth -= 1;
    else if (ch === ',' && depth === 0) bindCount += 1;
  }
  const columnCount = columnMatch[1].split(',').length;
  const placeholderCount = (sqlMatch[1].match(/\?/g) || []).length;
  assert.equal(columnCount, 32);
  assert.equal(placeholderCount, columnCount, 'Số placeholder SQL không khớp số cột work_items');
  assert.equal(bindCount, placeholderCount, 'Số giá trị bind không khớp placeholder SQL work_items');
});


test('MASTER BASELINE R1.1.1 CSS dynamic contracts: source-generated classes cannot be deleted', async () => {
  const page = await readUiSource();
  const css = await readFile('app/globals.css','utf8');
  const toneBlock = page.match(/const NAV_ICON_TONE:[^{]+\{([\s\S]*?)\n\};/i)?.[1] || '';
  const tones = [...toneBlock.matchAll(/:\s*"([a-z0-9_-]+)"/gi)].map((m) => m[1]);
  assert.ok(tones.length > 0, 'Phải đọc được NAV_ICON_TONE từ source');
  assert.match(css,/\.nav-glyph\s*\{[^}]*width:25px!important[^}]*height:25px!important[^}]*background:#eef5ff!important/i,'Base nav-glyph phải giữ kích thước/nền canonical');
  for (const tone of new Set(tones)) {
    if (tone === 'blue') continue;
    assert.match(css,new RegExp(`\\.nav-glyph-${tone}\\s*\\{`),`Thiếu CSS động nav-glyph-${tone}`);
  }
  for (const status of ['manual','exact','review','not_found']) {
    assert.match(css,new RegExp(`\\.request-match-${status}\\s*\\{`),`Thiếu request-match-${status}`);
  }
  assert.doesNotMatch(css,/@media[^{]*\{\s*\}/,'Không được còn media block rỗng sau cleanup');
  assert.doesNotMatch(css,/\.topbar-brand\b|\.vntech-brand-ribbon\b/,'Không được phục hồi CSS header brand cũ không còn DOM');
});
