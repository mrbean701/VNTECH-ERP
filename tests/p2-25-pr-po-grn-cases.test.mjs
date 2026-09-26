// PHASE 2 (§25) — 12 TEST CASE BẮT BUỘC CHO CHUỖI PR → DUYỆT → PO → GRN.
//
// Nguồn yêu cầu: `docs/agent-progress/PHASE2-REQUIREMENTS-USER.md` mục 25 (12 case).
// Nhật ký đợt này: `docs/agent-progress/TASK-104.md`.
//
// ⚠️ VÌ SAO CHẠY ĐƯỢC 12 CASE NÀY: bộ test dựng ĐÚNG hạ tầng mà `tests/workflow-direct.test.ts`
//    đang dùng — SQLite in-memory nạp toàn bộ `drizzle/*.sql`, `setRuntimeEnvForTests`, rồi gọi
//    THẲNG `POST/GET` của `app/api/system/route` (engine THẬT, không mô phỏng lại logic).
//    Nhờ vậy mỗi case là một chuỗi hành vi thật: tạo phiếu → duyệt 5 bậc → tách PO → nhận hàng → BCH xác nhận.
//
// ⚠️ KHÁC BIỆT VỚI PRODUCTION (khai báo trung thực, đúng ghi chú TASK-103 §2.5): engine chạy trên
//    SQLite chứ không phải MySQL 8 thật. Vì vậy tệp này là LƯỚI AN TOÀN CHO LOGIC, KHÔNG phải bằng chứng
//    dữ liệu production. Bằng chứng trên MySQL THẬT nằm ở `tools/p2-trace-audit.mjs`,
//    `tools/p2-split-po-audit.mjs`, `tools/p2-reference-integrity.mjs`.
//
// ⚠️ CHÍNH SÁCH KHOẢNG TRỐNG (§25 Case 9): case nào hệ thống CHƯA CÓ tính năng để đạt thì tệp này
//    (a) ĐÁNH DẤU `skip` kèm lý do nguyên văn, và (b) có một test RIÊNG đo BẰNG CHỨNG khoảng trống đó.
//    TUYỆT ĐỐI không hạ thấp kỳ vọng của đặc tả để "xanh giả".
//
// Chạy riêng:  node --import tsx --test tests/p2-25-pr-po-grn-cases.test.mjs
// (tệp CỐ Ý không nằm trong `package.json` → `test:regression` giữ nguyên số ca 69/69)
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { readFile, readdir } from "node:fs/promises";
import { GET, POST } from "../app/api/system/route";
import { POST as FILE_POST } from "../app/api/files/route";
import { setRuntimeEnvForTests } from "../lib/runtime-env";

// ── Tầng CSDL THẬT: đọc chỉ-đọc qua `mysql.exe` (đúng cách các probe khác của dự án đang làm).
//    Không kết nối được ⇒ các ca MySQL BỎ QUA kèm lý do, KHÔNG tính là ĐẠT (chống "xanh giả").
const MYSQL = process.env.MYSQL_BIN || "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
let MYSQL_OK = true;
let MYSQL_ERROR = "";
function mysql(query) {
  return execFileSync(MYSQL, ["-uvntech", "-pvntech", "--default-character-set=utf8mb4", "-N", "-B", "vntech_erp", "-e", query], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 30000 }).trim();
}
try { mysql("SELECT 1;"); } catch (error) { MYSQL_OK = false; MYSQL_ERROR = String(error?.message || error).split("\n")[0].slice(0, 160); }
const ROUTE_SOURCE = readFileSync("scripts/system-route.mjs", "utf8");

// ── Hạ tầng thay thế D1Database bằng SQLite in-memory (giống hệt `tests/workflow-direct.test.ts`) ──
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
const bucket = new Map();
setRuntimeEnvForTests({
  DB: new TestDatabase(sqlite),
  BUCKET: { put: async (key, value) => { bucket.set(key, value); }, get: async (key) => bucket.get(key) ?? null },
  EMAIL_SECRET: "p2-25-test-email-encryption-secret",
});

// ── Dữ liệu nền tối thiểu: 1 dự án, 1 kho công trường, 1 tổ đội, 1 vật tư, 1 NCC, 1 dòng BOQ ──
const STAMP = "2026-09-21T00:00:00.000Z";
const OVERRIDE_REASON = "Quản trị phê duyệt mua mới cho bài kiểm thử §25 (không có tồn khả dụng)";
function seedFixtures() {
  // `setup` đã nạp sẵn danh mục/nhóm con canonical ⇒ tái dùng, chỉ tạo khi thật sự thiếu.
  let categoryId = sqlite.prepare("SELECT id FROM material_categories WHERE code='DIEN' LIMIT 1").get()?.id || "";
  if (!categoryId) {
    categoryId = "CAT-P2";
    sqlite.prepare(`INSERT INTO material_categories (id,code,name,description,sort_order,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)`).run(categoryId, "DIEN", "Điện", "Danh mục kiểm thử §25", 10, 1, STAMP, STAMP);
  }
  let subcategoryId = sqlite.prepare("SELECT id FROM material_subcategories WHERE category_id=? LIMIT 1").get(categoryId)?.id || "";
  if (!subcategoryId) {
    subcategoryId = "SUB-P2";
    sqlite.prepare(`INSERT INTO material_subcategories (id,category_id,code,name,description,sort_order,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)`).run(subcategoryId, categoryId, "CHUA_PHAN_NHOM", "Chưa phân nhóm", null, 10, 1, STAMP, STAMP);
  }
  sqlite.prepare(`INSERT INTO materials (id,code,name,system,category_id,subcategory_id,specification,brand,unit,standard_price,min_stock,requires_cocq,requires_mar,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run("MAT-P2", "VT-P2-001", "Cáp điện kiểm thử §25", "Điện", categoryId, subcategoryId, "4x10mm2", "P2", "m", 1000, 0, 1, 0, 1, STAMP, STAMP);
  sqlite.prepare(`INSERT INTO suppliers (id,code,name,tax_code,contact_name,phone,lead_time_days,rating,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run("SUP-P2-A", "NCC-P2-A", "Nhà cung cấp A (kiểm thử §25)", null, null, null, 3, 5, 1, STAMP, STAMP);
  sqlite.prepare(`INSERT INTO suppliers (id,code,name,tax_code,contact_name,phone,lead_time_days,rating,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run("SUP-P2-B", "NCC-P2-B", "Nhà cung cấp B (kiểm thử §25)", null, null, null, 3, 4, 1, STAMP, STAMP);
  sqlite.prepare(`INSERT INTO projects (id,code,name,status,manager_user_id,start_date,planned_end_date,contract_no,contract_name,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run("PRJ-P2", "DA-P2", "Dự án kiểm thử §25", "active", null, "2026-01-01", "2027-12-31", "HD-P2", "Hợp đồng kiểm thử §25", STAMP, STAMP);
  sqlite.prepare(`INSERT INTO warehouses (id,code,name,type,project_id,parent_warehouse_id,keeper_user_id,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`).run("WH-P2-SITE", "KHO-DA-P2", "Kho DA-P2", "site", "PRJ-P2", null, null, 1, STAMP, STAMP);
  sqlite.prepare(`INSERT INTO warehouses (id,code,name,type,project_id,parent_warehouse_id,keeper_user_id,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`).run("WH-P2-TEAM", "TD-DA-P2-01", "Kho tổ 1", "team", "PRJ-P2", "WH-P2-SITE", null, 1, STAMP, STAMP);
  sqlite.prepare(`INSERT INTO teams (id,code,name,trade,project_id,warehouse_id,leader_user_id,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`).run("TEAM-P2", "TD-DA-P2-01", "Tổ đội 1", "Điện", "PRJ-P2", "WH-P2-TEAM", null, 1, STAMP, STAMP);
}

// ── Phiên đăng nhập + gọi action (đúng chuỗi `POST /api/system` mà UI dùng) ──
let cookie = "";
let adminCookie = "";
const ownerCredentials = new Map();
async function api(action, payload = {}) {
  const response = await POST(new Request("http://warehouse.test/api/system", { method: "POST", headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify({ action, ...payload }) }));
  return { response, result: await response.json() };
}
async function load() {
  const response = await GET(new Request("http://warehouse.test/api/system", { headers: cookie ? { Cookie: cookie } : {} }));
  const result = await response.json();
  assert.equal(response.status, 200, result.error);
  return result.data;
}
async function loginAs(username, password) {
  const saved = cookie; cookie = "";
  const r = await api("login", { username, password });
  assert.equal(r.response.status, 200, r.result.error);
  const c = r.response.headers.get("set-cookie")?.split(";")[0] || "";
  assert(c, "Đăng nhập phải trả cookie phiên");
  cookie = saved; return c;
}
async function configureWorkflowOwners(projectId) {
  // PHASE 2 (§6 · §23 — chỉ đạo người dùng 21/09/2026): luồng duyệt PR mặc định là 4 tác nhân theo đặc tả, mỗi
  // tác nhân MỘT người duyệt: Thư ký Tổng giám đốc (bước 2) → Phòng Dự án (bước 3) → Phòng Kế hoạch (bước 4) →
  // Giám đốc (bước 5) ⇒ Owner bước 4 phải là `procurement/kh_nv`, bước 5 là `director`.
  const rows = [
    { stage: 2, username: "p2.thuky", employeeCode: "P2-THUKY", fullName: "Thư ký §25", email: "p2.thuky@test.local", role: "thuky" },
    { stage: 3, username: "p2.danv", employeeCode: "P2-DANV", fullName: "Nhân viên DA §25", email: "p2.danv@test.local", role: "project" },
    { stage: 4, username: "p2.khnv", employeeCode: "P2-KHNV", fullName: "Nhân viên Kế hoạch §25", email: "p2.khnv@test.local", role: "kh_nv" },
    { stage: 5, username: "p2.giamdoc", employeeCode: "P2-GD", fullName: "Giám đốc §25", email: "p2.giamdoc@test.local", role: "director" },
  ];
  for (const row of rows) {
    const password = "OwnerTest@2026!";
    const created = await api("create_user", { employeeCode: row.employeeCode, fullName: row.fullName, username: row.username, email: row.email, role: row.role, password });
    assert.equal(created.response.status, 200, created.result.error);
    const u = sqlite.prepare("SELECT id FROM users WHERE username=?").get(row.username);
    sqlite.prepare(`INSERT OR IGNORE INTO user_project_scopes(id,user_id,project_id,permission,created_at,updated_at) VALUES (?,?,?,?,?,?)`).run(`UPS-P2-${row.stage}`, u.id, projectId, "approve", STAMP, STAMP);
    sqlite.prepare(`INSERT OR REPLACE INTO user_module_permissions(id,user_id,module_key,can_view,can_use,can_create,can_edit,can_approve,can_export,permission_expires_at,permission_source,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(`UMP-P2-${row.stage}`, u.id, "approvals", 1, 1, 0, 0, 1, 0, null, "manual_override", STAMP, STAMP);
    sqlite.prepare(`INSERT OR REPLACE INTO approval_project_assignments(id,project_id,stage,owner_user_id,cc_emails,active,updated_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)`).run(`APOWN-P2-${row.stage}`, projectId, row.stage, u.id, null, 1, sqlite.prepare("SELECT id FROM users WHERE username='admin'").get().id, STAMP, STAMP);
    ownerCredentials.set(row.stage, { username: row.username, password });
  }
}
async function approveConfiguredWorkflow(requestId, commentPrefix) {
  const originalCookie = cookie;
  try {
    while (true) {
      cookie = adminCookie;
      const snapshot = await load();
      const request = snapshot.requests.find((row) => String(row.id) === String(requestId));
      if (!request || request.status !== "pending_approval") break;
      const stage = snapshot.approvalStages.find((row) => row.active && Number(row.stageNo) === Number(request.approvalStage));
      assert(stage, `Không tìm thấy cấu hình bước ${request.approvalStage}`);
      const cred = ownerCredentials.get(Number(stage.stageNo));
      assert(cred, `Thiếu Owner cho bước ${stage.stageNo}`);
      cookie = await loginAs(cred.username, cred.password);
      const decision = await api("decide_approval", { requestId, stage: Number(stage.stageNo), decision: "approved", comment: `${commentPrefix} – ${stage.name}` });
      assert.equal(decision.response.status, 200, decision.result.error);
    }
  } finally { cookie = originalCookie; }
}
async function uploadImage(entityType, entityId, filename) {
  const form = new FormData();
  form.set("entityType", entityType); form.set("entityId", entityId);
  form.set("file", new File([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], filename, { type: "image/jpeg" }));
  const response = await FILE_POST(new Request("http://warehouse.test/api/files", { method: "POST", headers: { Cookie: cookie }, body: form }));
  assert.equal(response.status, 201, await response.text());
}

// ── Các bước dùng lại cho 12 case ──
async function createRequest(area, quantity) {
  const created = await api("create_request", { projectId: "PRJ-P2", teamId: "TEAM-P2", sourceWarehouseId: "WH-P2-SITE", neededAt: "2026-10-01", area, lines: [{ materialId: "MAT-P2", quantity, unitPrice: 1000, boqItemId: BOQ_ID, contractLineNo: "1" }] });
  assert.equal(created.response.status, 200, created.result.error);
  const data = await load();
  const request = data.requests.find((row) => row.area === area);
  assert(request, `Không tìm thấy phiếu vừa tạo: ${area}`);
  return request;
}
async function approveRequest(requestId, label) {
  await approveConfiguredWorkflow(requestId, label);
  const data = await load();
  return data.requests.find((row) => String(row.id) === String(requestId));
}
/** Tạo ĐÚNG 1 PO cho 1 phiếu đã duyệt (mỗi lần gọi = 1 PO riêng ⇒ dùng để tách N PO từ 1 PR). */
async function createPo(request, quantity, { eta = "2026-10-05", supplierId = "SUP-P2-A" } = {}) {
  return api("create_po", {
    requestId: request.id, supplierId, warehouseId: "WH-P2-SITE", eta,
    availabilityOverrideReason: OVERRIDE_REASON,
    lines: [{ requestItemId: request.items[0].id, quantity, unitPrice: 1000, plannedDeliveryAt: eta }],
  });
}
async function createPoOk(request, quantity, options) {
  const created = await createPo(request, quantity, options);
  assert.equal(created.response.status, 200, created.result.error);
  const data = await load();
  const rows = data.purchaseOrders.filter((row) => String(row.requestId) === String(request.id));
  return rows.sort((a, b) => String(a.poNo).localeCompare(String(b.poNo)));
}
/** Nhận hàng + đính ảnh + BCH xác nhận cho ĐÚNG 1 chuyến (1 GRN). */
async function receiveAndConfirm(poId, quantity, note) {
  const received = await api("receive_goods", { purchaseOrderId: poId, deliveryNoteNo: note, qcOk: true, certificateStatus: "complete", deliveryDocumentStatus: "complete", lines: [{ purchaseOrderItemId: sqlite.prepare("SELECT id FROM purchase_order_items WHERE purchase_order_id=? ORDER BY line_no").get(poId).id, quantity }] });
  assert.equal(received.response.status, 200, received.result.error);
  const data = await load();
  const receipt = data.receipts.find((row) => String(row.purchaseOrderId) === String(poId) && row.deliveryNoteNo === note);
  assert(receipt, `Không thấy phiếu nhập ${note}`);
  await uploadImage("goods_receipt", receipt.id, `${note}.jpg`);
  const confirmed = await api("confirm_delivery", { receiptId: receipt.id, certificateStatus: "complete", deliveryDocumentStatus: "complete", comment: `BCH xác nhận ${note}` });
  assert.equal(confirmed.response.status, 200, confirmed.result.error);
  return receipt.id;
}
async function snapshot(requestId, poIds = []) {
  const data = await load();
  return {
    data,
    request: data.requests.find((row) => String(row.id) === String(requestId)),
    pos: data.purchaseOrders.filter((row) => poIds.includes(String(row.id))),
  };
}

// ── Khởi tạo hệ thống + dữ liệu nền ──
const setup = await api("setup", { companyName: "Công ty kiểm thử §25", fullName: "Quản trị §25", username: "admin", password: "TestKho@2026!" });
assert.equal(setup.response.status, 201, setup.result.error);
cookie = setup.response.headers.get("set-cookie")?.split(";")[0] || "";
assert(cookie);
adminCookie = cookie;
seedFixtures();
let bootstrap = await load();
const boqImported = await api("replace_boq_items", {
  projectId: "PRJ-P2",
  rows: [
    { sourceOrder: 1, contractLineRef: "I", rowRole: "group", materialName: "PHẦN I – HỆ THỐNG ĐIỆN", systemCode: "DIEN", itemType: "contract", customFields: { systemCode: "DIEN" } },
    { sourceOrder: 2, contractLineRef: "1", rowRole: "material", internalMaterialCode: "VT-P2-001", contractMaterialCode: "VT-HD-P2", approvedMaterialCode: "VT-P2-001", materialName: "Cáp điện kiểm thử §25", unit: "m", systemCode: "DIEN", itemType: "contract", contractQty: 100000, remeasuredQty: 100000, unitPrice: 0, customFields: { systemCode: "DIEN" } },
  ],
});
assert.equal(boqImported.response.status, 200, boqImported.result.error);
bootstrap = await load();
const BOQ_ID = bootstrap.boqItems.find((row) => String(row.projectId) === "PRJ-P2" && Number(row.sourceOrder) === 2)?.id;
assert(BOQ_ID, "Thiếu dòng BOQ để lập phiếu");
await configureWorkflowOwners("PRJ-P2");
cookie = adminCookie;

// ════════════════════════════════════════════════════════════════════════════════════════════════
// §25 CASE 1 — PR chưa approve đủ ⇒ KHÔNG được tạo PO
// ════════════════════════════════════════════════════════════════════════════════════════════════
test("§25 Case 1 — PR chưa duyệt đủ: create_po bị backend chặn", async () => {
  const pending = await createRequest("§25 Case 1 – chưa duyệt đủ", 100);
  assert.equal(String(pending.status), "pending_approval", "Phiếu vừa lập phải đang chờ duyệt");
  assert.notEqual(String(pending.supplyStatus), "approved");
  const blocked = await createPo(pending, 100);
  assert.equal(blocked.response.status, 400, "Tạo PO từ phiếu CHƯA duyệt đủ phải bị chặn");
  assert.match(String(blocked.result.error), /đã duyệt đủ các cấp/);
  const after = await load();
  assert.equal(after.purchaseOrders.filter((row) => String(row.requestId) === String(pending.id)).length, 0, "Không được phát sinh PO nào");
});

// ════════════════════════════════════════════════════════════════════════════════════════════════
// §25 CASE 2 — PR approve đủ ⇒ tạo được PO
// ════════════════════════════════════════════════════════════════════════════════════════════════
test("§25 Case 2 — PR duyệt đủ: tạo PO và giữ liên kết nguồn PR", async () => {
  let request = await createRequest("§25 Case 2 – duyệt đủ", 100);
  request = await approveRequest(request.id, "Duyệt Case 2");
  assert.equal(String(request.status), "approved");
  assert.equal(Number(request.items[0].approvedPurchaseQty), 100, "Số lượng duyệt mua phải bằng số lượng đề nghị");
  const pos = await createPoOk(request, 100);
  assert.equal(pos.length, 1);
  assert.equal(String(pos[0].requestId), String(request.id), "PO phải giữ request_id trỏ về PR");
  assert.equal(String(pos[0].requestNo), String(request.requestNo));
  const after = await load();
  const mri = after.requests.find((row) => String(row.id) === String(request.id)).items[0];
  assert.equal(Number(mri.orderedQty), 100, "ordered_qty của dòng PR phải cộng theo PO");
});

// ════════════════════════════════════════════════════════════════════════════════════════════════
// §25 CASE 3 — PR có 3 PO, TẤT CẢ completed ⇒ PR completed
// ════════════════════════════════════════════════════════════════════════════════════════════════
test("§25 Case 3 — 3 PO đều nhận đủ: cả 3 PO completed và PR completed", async () => {
  let request = await createRequest("§25 Case 3 – ba PO hoàn tất", 100);
  request = await approveRequest(request.id, "Duyệt Case 3");
  await createPoOk(request, 34, { eta: "2026-10-05" });
  await createPoOk(request, 33, { eta: "2026-10-06" });
  await createPoOk(request, 33, { eta: "2026-10-07" });
  const first = await snapshot(request.id);
  const pos = first.data.purchaseOrders.filter((row) => String(row.requestId) === String(request.id));
  assert.equal(pos.length, 3, "Một PR phải tách được thành ĐÚNG 3 PO");
  assert.equal(pos.reduce((sum, po) => sum + Number(po.orderedQty), 0), 100);
  for (const [index, po] of pos.entries()) await receiveAndConfirm(po.id, Number(po.orderedQty), `C3-GRN-${index + 1}`);
  const after = await snapshot(request.id);
  const donePos = after.data.purchaseOrders.filter((row) => String(row.requestId) === String(request.id));
  assert.equal(donePos.filter((po) => String(po.status) === "completed").length, 3, `Cả 3 PO phải completed, thực tế: ${donePos.map((po) => po.status).join(",")}`);
  assert.equal(String(after.request.supplyStatus), "completed", "Tổng nhận đủ 100/100 ⇒ PR phải completed");
});

// ════════════════════════════════════════════════════════════════════════════════════════════════
// §25 CASE 4 — PR có 3 PO: 2 completed + 1 incomplete ⇒ PR incomplete
// ════════════════════════════════════════════════════════════════════════════════════════════════
test("§25 Case 4 — 2 PO xong, 1 PO dở: PR KHÔNG được completed", async () => {
  let request = await createRequest("§25 Case 4 – một PO dở dang", 100);
  request = await approveRequest(request.id, "Duyệt Case 4");
  await createPoOk(request, 34, { eta: "2026-10-05" });
  const afterFirst = await createPoOk(request, 33, { eta: "2026-10-06" });
  const afterSecond = await createPoOk(request, 33, { eta: "2026-10-07" });
  assert.equal(afterSecond.length, 3);
  assert.equal(afterFirst.length, 2);
  // Nhận đủ ĐÚNG 2 PO đầu (trao đổi bằng id, không bằng chỉ số mảng) — PO thứ ba để dở.
  const received = [afterSecond[0], afterSecond[1]];
  const pendingPo = afterSecond[2];
  await receiveAndConfirm(received[0].id, Number(received[0].orderedQty), "C4-GRN-1");
  await receiveAndConfirm(received[1].id, Number(received[1].orderedQty), "C4-GRN-2");
  const after = await snapshot(request.id);
  const byId = new Map(after.data.purchaseOrders.map((row) => [String(row.id), row]));
  assert.equal(String(byId.get(String(received[0].id)).status), "completed", "PO đã nhận đủ phải completed");
  assert.equal(String(byId.get(String(received[1].id)).status), "completed", "PO đã nhận đủ phải completed");
  assert.notEqual(String(byId.get(String(pendingPo.id)).status), "completed", "PO chưa nhận hàng KHÔNG được completed");
  assert.notEqual(String(after.request.supplyStatus), "completed", "PR còn PO dở ⇒ KHÔNG được completed");
  assert.equal(String(after.request.supplyStatus), "partial_delivery", "PR phải ở trạng thái giao một phần");
});

// ════════════════════════════════════════════════════════════════════════════════════════════════
// §25 CASE 5 — PO ordered 100, GRN received 70 ⇒ PO incomplete
// ════════════════════════════════════════════════════════════════════════════════════════════════
test("§25 Case 5 — PO 100 nhận 70: PO chưa hoàn tất, còn thiếu 30", async () => {
  let request = await createRequest("§25 Case 5 – nhận thiếu", 100);
  request = await approveRequest(request.id, "Duyệt Case 5");
  const [po] = await createPoOk(request, 100, { eta: "2026-10-05" });
  await receiveAndConfirm(po.id, 70, "C5-GRN-1");
  const after = await snapshot(request.id);
  const row = after.data.purchaseOrders.find((item) => String(item.id) === String(po.id));
  assert.notEqual(String(row.status), "completed", "70/100 ⇒ PO KHÔNG được completed");
  assert.equal(String(row.status), "partial_delivery");
  assert.equal(Number(row.receivedQty), 70);
  assert.equal(Number(row.items[0].remainingQty), 30, "Remaining = Ordered − Received = 30");
  assert.notEqual(String(after.request.supplyStatus), "completed", "PR cũng chưa hoàn tất");
});

// ════════════════════════════════════════════════════════════════════════════════════════════════
// §25 CASE 6 — PO 100 = GRN1 60 + GRN2 40 ⇒ PO completed
// ════════════════════════════════════════════════════════════════════════════════════════════════
test("§25 Case 6 — PO 100 = 60 + 40: PO hoàn tất đúng khi đủ tổng", async () => {
  let request = await createRequest("§25 Case 6 – hai chuyến đủ số", 100);
  request = await approveRequest(request.id, "Duyệt Case 6");
  const [po] = await createPoOk(request, 100, { eta: "2026-10-05" });
  await receiveAndConfirm(po.id, 60, "C6-GRN-1");
  let mid = await snapshot(request.id);
  assert.notEqual(String(mid.data.purchaseOrders.find((row) => String(row.id) === String(po.id)).status), "completed", "60/100 chưa được hoàn tất");
  await receiveAndConfirm(po.id, 40, "C6-GRN-2");
  const after = await snapshot(request.id);
  const row = after.data.purchaseOrders.find((item) => String(item.id) === String(po.id));
  assert.equal(String(row.status), "completed", "60+40=100 ⇒ PO phải completed");
  assert.equal(Number(row.receivedQty), 100);
  assert.equal(Number(row.items[0].remainingQty), 0);
  assert.equal(String(after.request.supplyStatus), "completed");
});

// ════════════════════════════════════════════════════════════════════════════════════════════════
// §25 CASE 7 — PR item 100 → PO001 60 + PO002 40 ⇒ HỢP LỆ
// ════════════════════════════════════════════════════════════════════════════════════════════════
test("§25 Case 7 — PR 100 tách 60 + 40: hợp lệ, không vượt số đã duyệt", async () => {
  let request = await createRequest("§25 Case 7 – tách 60/40", 100);
  request = await approveRequest(request.id, "Duyệt Case 7");
  await createPoOk(request, 60, { eta: "2026-10-05" });
  await createPoOk(request, 40, { eta: "2026-10-06" });
  const after = await snapshot(request.id);
  const pos = after.data.purchaseOrders.filter((row) => String(row.requestId) === String(request.id));
  assert.equal(pos.length, 2, "Phải có đúng 2 PO");
  assert.equal(pos.reduce((sum, po) => sum + Number(po.orderedQty), 0), 100, "Tổng đặt = 100 = số đã duyệt");
  assert.equal(Number(after.request.items[0].orderedQty), 100);
  assert.ok(Number(after.request.items[0].orderedQty) <= Number(after.request.items[0].approvedPurchaseQty) + 1e-9, "Không được vượt số đã duyệt");
});

// ════════════════════════════════════════════════════════════════════════════════════════════════
// §25 CASE 8 — PR item 100 → PO001 60 + PO002 60 ⇒ CHẶN vượt phân bổ
// ════════════════════════════════════════════════════════════════════════════════════════════════
test("§25 Case 8 — PR 100 tách 60 + 60: PO thứ hai bị từ chối", async () => {
  let request = await createRequest("§25 Case 8 – vượt phân bổ", 100);
  request = await approveRequest(request.id, "Duyệt Case 8");
  await createPoOk(request, 60, { eta: "2026-10-05" });
  const overflow = await createPo(request, 60, { eta: "2026-10-06" });
  assert.equal(overflow.response.status, 400, "60+60=120 > 100 ⇒ phải bị chặn");
  assert.match(String(overflow.result.error), /vượt số đã được duyệt mua/);
  const after = await snapshot(request.id);
  const pos = after.data.purchaseOrders.filter((row) => String(row.requestId) === String(request.id));
  assert.equal(pos.length, 1, "PO vượt hạn mức KHÔNG được ghi vào CSDL");
  assert.equal(pos.reduce((sum, po) => sum + Number(po.orderedQty), 0), 60);
  assert.equal(Number(after.request.items[0].orderedQty), 60, "ordered_qty không được tăng khi PO bị chặn");
});

// ════════════════════════════════════════════════════════════════════════════════════════════════
// §25 CASE 9 — Workflow V1 → V2: PR001 giữ V1, PR002 dùng V2  ⇒ KHOẢNG TRỐNG ĐÃ ĐO
// ════════════════════════════════════════════════════════════════════════════════════════════════
test("§25 Case 9 — Workflow versioning V1/V2 [GAP-DOCUMENTED]", { skip: "KHOẢNG TRỐNG ĐÃ TÀI LIỆU HOÁ: hệ thống KHÔNG có workflow versioning — cột `version` của `workflow_definitions` đã bị xoá (Flyway V19), `material_requests`/`purchase_orders` không có cột `workflow_id`/`workflow_version`, và `UNIQUE(code)` chặn tạo WF V2. Case này CHỈ viết được sau khi người dùng chốt Q3 (nhóm A3) — xem TASK-104.md." }, () => {});

test("§25 Case 9 — bằng chứng khoảng trống: thiếu cột liên kết + CSDL chặn bản thứ hai", async (t) => {
  const mrColumns = sqlite.prepare("PRAGMA table_info(material_requests)").all().map((row) => String(row.name));
  const poColumns = sqlite.prepare("PRAGMA table_info(purchase_orders)").all().map((row) => String(row.name));
  const wfColumns = sqlite.prepare("PRAGMA table_info(workflow_definitions)").all().map((row) => String(row.name));
  t.diagnostic(`material_requests có workflow_id=${mrColumns.includes("workflow_id")} · workflow_version=${mrColumns.includes("workflow_version")}`);
  t.diagnostic(`purchase_orders có workflow_id=${poColumns.includes("workflow_id")} · workflow_version=${poColumns.includes("workflow_version")}`);
  t.diagnostic(`workflow_definitions (lược đồ drizzle) các cột: ${wfColumns.join(",")}`);
  // (1) Không có chỗ để GẮN phiếu với một phiên bản luồng ⇒ §7 không thể thoả ở tầng dữ liệu.
  for (const [table, columns] of [["material_requests", mrColumns], ["purchase_orders", poColumns]]) {
    assert.equal(columns.includes("workflow_id"), false, `${table} KHÔNG có cột workflow_id`);
    assert.equal(columns.includes("workflow_version"), false, `${table} KHÔNG có cột workflow_version`);
  }
  // (2) Không có action nào phát hành/soạn phiên bản luồng trong route đang chạy.
  assert.doesNotMatch(ROUTE_SOURCE, /publish_workflow_version|revise_workflow/, "Route KHÔNG được có action phát hành phiên bản workflow");
  // (3) Đo trên MySQL THẬT (chính sách bỏ qua có kiểm soát giống `tests/w02-project-warehouse-relation.test.mjs`).
  if (!MYSQL_OK) {
    t.diagnostic(`BỎ QUA tầng MySQL (không kết nối CSDL): ${MYSQL_ERROR}`);
  } else {
    const realWfColumns = mysql(`SELECT column_name FROM information_schema.columns WHERE table_schema='vntech_erp' AND table_name='workflow_definitions'`).split(/\r?\n/).filter(Boolean);
    const uniqueCode = mysql(`SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema='vntech_erp' AND table_name='workflow_definitions' AND column_name='code' AND non_unique=0`);
    const realMrWorkflow = mysql(`SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='vntech_erp' AND table_name IN ('material_requests','purchase_orders') AND column_name IN ('workflow_id','workflow_version')`);
    t.diagnostic(`MySQL workflow_definitions có cột version=${realWfColumns.includes("version")} · UNIQUE(code)=${uniqueCode} · cột workflow_* trên PR/PO=${realMrWorkflow}`);
    assert.equal(realWfColumns.includes("version"), false, "MySQL thật: cột `version` của workflow_definitions ĐÃ BỊ XOÁ (Flyway V19)");
    assert.equal(Number(uniqueCode), 1, "MySQL thật: `code` vẫn UNIQUE ⇒ không thể tạo WF V2 cùng mã");
    assert.equal(Number(realMrWorkflow), 0, "MySQL thật: PR/PO không có cột workflow_id/workflow_version");
    // DRIFT: lược đồ drizzle (dùng để dựng SQLite) KHÁC MySQL thật ⇒ ghi nhận, không giấu.
    t.diagnostic(`DRIFT LƯỢC ĐỒ: drizzle còn khai cột version=${wfColumns.includes("version")} nhưng MySQL thật đã bỏ ⇒ nguồn lược đồ không thống nhất (xem TASK-104.md).`);
  }
  t.diagnostic("KẾT LUẬN: §25 Case 9 BẤT KHẢ THI cho tới khi Q3 được chốt (nhóm A3).");
});

// ════════════════════════════════════════════════════════════════════════════════════════════════
// §25 CASE 10 — PO cancelled ⇒ kiểm logic hoàn tất PR
// ════════════════════════════════════════════════════════════════════════════════════════════════
test("§25 Case 10 — PO bị huỷ: PR KHÔNG tự hoàn tất", async () => {
  let request = await createRequest("§25 Case 10 – huỷ PO", 100);
  request = await approveRequest(request.id, "Duyệt Case 10");
  const pos = await createPoOk(request, 60, { eta: "2026-10-05" });
  const poA = pos[0];
  const createdB = await createPo(request, 40, { eta: "2026-10-06" });
  assert.equal(createdB.response.status, 200, createdB.result.error);
  const beforeReject = await snapshot(request.id);
  const poB = beforeReject.data.purchaseOrders.find((row) => String(row.requestId) === String(request.id) && String(row.id) !== String(poA.id));
  assert(poB, "Phải tồn tại PO thứ hai để huỷ");
  assert.equal(String(poB.status), "pending_approval");
  const rejected = await api("reject_po", { purchaseOrderId: poB.id, reason: "Nhà cung cấp B không đáp ứng tiến độ (kiểm thử §25 Case 10)" });
  assert.equal(rejected.response.status, 200, rejected.result.error);
  await receiveAndConfirm(poA.id, 60, "C10-GRN-1");
  const after = await snapshot(request.id);
  const cancelled = after.data.purchaseOrders.find((row) => String(row.id) === String(poB.id));
  assert.equal(String(cancelled.status), "cancelled", "PO bị từ chối phải ở trạng thái cancelled");
  assert.notEqual(String(after.request.supplyStatus), "completed", "PO cancelled KHÔNG được tính là đã nhận ⇒ PR còn mở");
  assert.equal(String(after.request.supplyStatus), "partial_delivery");
  assert.equal(Number(after.request.items[0].receivedQty), 60, "Chỉ 60 được nhận; 40 của PO huỷ không được cộng");
});

// ════════════════════════════════════════════════════════════════════════════════════════════════
// §25 CASE 11 — Nhiều GRN cho 1 PO ⇒ cộng số lượng ĐÚNG
// ════════════════════════════════════════════════════════════════════════════════════════════════
test("§25 Case 11 — 3 GRN cho 1 PO: số lượng cộng đúng, không nhân đôi", async () => {
  let request = await createRequest("§25 Case 11 – cộng nhiều GRN", 90);
  request = await approveRequest(request.id, "Duyệt Case 11");
  const [po] = await createPoOk(request, 90, { eta: "2026-10-05" });
  await receiveAndConfirm(po.id, 20, "C11-GRN-1");
  await receiveAndConfirm(po.id, 30, "C11-GRN-2");
  await receiveAndConfirm(po.id, 40, "C11-GRN-3");
  const after = await snapshot(request.id);
  const row = after.data.purchaseOrders.find((item) => String(item.id) === String(po.id));
  const receipts = after.data.receipts.filter((item) => String(item.purchaseOrderId) === String(po.id));
  assert.equal(receipts.length, 3, "1 PO phải có 3 phiếu nhập");
  assert.equal(receipts.reduce((sum, item) => sum + Number(item.acceptedQty), 0), 90, "Tổng chấp nhận = 20+30+40");
  assert.equal(Number(row.receivedQty), 90, "received_qty của PO = 90 (không nhân đôi)");
  assert.equal(Number(row.items[0].receivedQty), 90);
  assert.equal(String(row.status), "completed");
  assert.equal(String(after.request.supplyStatus), "completed");
});

// ════════════════════════════════════════════════════════════════════════════════════════════════
// §25 CASE 12 — Nhiều PO từ 1 PR ⇒ giữ quan hệ nguồn
// ════════════════════════════════════════════════════════════════════════════════════════════════
test("§25 Case 12 — nhiều PO từ 1 PR: quan hệ nguồn được giữ ở CẢ HAI chiều", async () => {
  let request = await createRequest("§25 Case 12 – giữ quan hệ nguồn", 100);
  request = await approveRequest(request.id, "Duyệt Case 12");
  await createPoOk(request, 25, { eta: "2026-10-05", supplierId: "SUP-P2-A" });
  await createPoOk(request, 35, { eta: "2026-10-06", supplierId: "SUP-P2-A" });
  await createPoOk(request, 40, { eta: "2026-10-07", supplierId: "SUP-P2-B" });
  const after = await snapshot(request.id);
  const pos = after.data.purchaseOrders.filter((row) => String(row.requestId) === String(request.id));
  assert.equal(pos.length, 3, "1 PR ⇒ 3 PO");
  for (const po of pos) {
    assert.equal(String(po.requestId), String(request.id), "Mọi PO phải giữ request_id");
    assert.equal(String(po.requestNo), String(request.requestNo), "Mọi PO phải hiển thị được số PR nguồn");
    assert.equal(String(po.items[0].requestItemId), String(request.items[0].id), "Dòng PO phải trỏ về đúng dòng PR");
  }
  assert.deepEqual([...new Set(pos.map((po) => String(po.supplierName)))].sort(), ["Nhà cung cấp A (kiểm thử §25)", "Nhà cung cấp B (kiểm thử §25)"], "PO phải tách theo nhà cung cấp");
  assert.equal(pos.reduce((sum, po) => sum + Number(po.orderedQty), 0), 100);
});

test.after(() => {
  setRuntimeEnvForTests(null);
  sqlite.close();
});
