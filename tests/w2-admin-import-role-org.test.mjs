import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFile, readdir } from "node:fs/promises";
import { mapProjectBulkSheet, mapUserBulkSheet, PROJECT_BULK_HEADERS, USER_BULK_HEADERS } from "../lib/admin-bulk-import.ts";
import { rankMaterialCandidates } from "../lib/material-matching-v2.mjs";

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
    try {
      const output = [];
      for (const statement of statements) output.push(await statement.run());
      this.database.exec("COMMIT");
      return output;
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
  }
}

function userSheetRows(count) {
  const notes = USER_BULK_HEADERS.map((header) => header === "Mật khẩu" ? "Bắt buộc với tài khoản mới" : "Tùy chọn");
  return [
    ["VNTECH ERP – MẪU NHẬP TÀI KHOẢN"],
    ["Không đổi tên cột; mật khẩu không bao giờ được xuất từ hệ thống."],
    [...USER_BULK_HEADERS],
    notes,
    ...Array.from({ length: count }, (_, index) => [
      `W2-${String(index + 1).padStart(3, "0")}`,
      `Nhân viên W2 ${index + 1}`,
      `w2.user.${index + 1}`,
      "W2@Import2026",
      `w2.user.${index + 1}@vntech.test`,
      "DA",
      "da_nv",
      "",
      "",
      "",
      "",
      "ACTIVE",
    ]),
  ];
}

await test("BUG-IMPORT-ACCOUNT-004: mapper nhận đủ 48 dòng sau title/subtitle/header/notes", () => {
  const rows = mapUserBulkSheet(userSheetRows(48), {
    roleCodes: ["da_nv"],
    organizationCodes: ["DA", "Phòng Dự án"],
  });
  assert.equal(rows.length, 48);
  assert.equal(rows[0].rowNo, 5);
  assert.equal(rows[47].rowNo, 52);
  assert.equal(rows[0].username, "w2.user.1");
});

await test("BUG-IMPORT-ACCOUNT-004: lỗi nêu đúng dòng/cột và mật khẩu trống chỉ hợp lệ khi cập nhật", () => {
  const sheet = userSheetRows(1);
  sheet[4][3] = "";
  assert.throws(
    () => mapUserBulkSheet(sheet, { roleCodes: ["da_nv"], organizationCodes: ["DA"] }),
    /Dòng 5 · Cột “Mật khẩu”/,
  );
  assert.equal(mapUserBulkSheet(sheet, {
    existingUsernames: ["w2.user.1"],
    roleCodes: ["da_nv"],
    organizationCodes: ["DA"],
  }).length, 1);
});

await test("BUG-IMPORT-PROJECT-001: mapper nhận template động và báo chính xác ngày sai", () => {
  const validSheet = [
    ["VNTECH ERP – MẪU NHẬP DỰ ÁN"],
    [...PROJECT_BULK_HEADERS],
    ["Bắt buộc", "Bắt buộc", "Tùy chọn", "Tùy chọn", "Tùy chọn", "Tùy chọn", "YYYY-MM-DD", "YYYY-MM-DD", "ACTIVE hoặc ARCHIVED"],
    ["W2-P01", "Dự án W2", "KHO-W2-P01", "Kho W2", "HD-W2", "Gói W2", "2026-09-03", "2027-09-03", "ACTIVE"],
  ];
  const rows = mapProjectBulkSheet(validSheet);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].rowNo, 4);
  validSheet[3][7] = "2025-01-01";
  assert.throws(() => mapProjectBulkSheet(validSheet), /Dòng 4 · Cột “Dự kiến kết thúc”/);
});

const sqlite = new DatabaseSync(":memory:");
sqlite.exec("PRAGMA foreign_keys=ON");
for (const file of (await readdir("drizzle")).filter((name) => name.endsWith(".sql")).sort()) {
  const sql = await readFile(`drizzle/${file}`, "utf8");
  for (const statement of sql.split("--> statement-breakpoint").map((value) => value.trim()).filter(Boolean)) sqlite.exec(statement);
}
globalThis.__MEP_LOCAL_ENV__ = {
  DB: new TestDatabase(sqlite),
  BUCKET: { put: async () => {}, get: async () => null },
  EMAIL_SECRET: "w2-regression",
  TRUST_STATE: { machineFingerprint: "a".repeat(64) },
};
const { GET, POST } = await import("../scripts/system-route.mjs");

async function login(username, password) {
  const response = await POST(new Request("http://w2.test/api/system", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "login", username, password }),
  }));
  assert.equal(response.status, 200);
  return response.headers.get("set-cookie")?.split(";")[0] || "";
}

async function post(cookie, action, payload = {}) {
  const response = await POST(new Request("http://w2.test/api/system", {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ action, ...payload }),
  }));
  let body = {};
  try { body = await response.json(); } catch {}
  return { status: response.status, body };
}

await POST(new Request("http://w2.test/api/system", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ action: "setup", companyName: "VNTECH W2 TEST", fullName: "Admin W2", username: "admin", password: "W2@Test2026" }),
}));
const adminCookie = await login("admin", "W2@Test2026");

await test("BUG-IMPORT-PROJECT-001: preflight nguyên tử, tạo/cập nhật dự án và kho nhất quán", async () => {
  const rejected = await post(adminCookie, "bulk_import_projects", { rows: [
    { rowNo: 5, code: "W2-ATOMIC", name: "Không được ghi", warehouseCode: "KHO-W2-ATOMIC" },
    { rowNo: 6, code: "W2-BAD", name: "Ngày sai", startDate: "2026/09/03" },
  ] });
  assert.equal(rejected.status, 400);
  assert.match(rejected.body.error, /Dòng 6 · Cột “Ngày bắt đầu”/);
  assert.equal(sqlite.prepare("SELECT COUNT(*) AS count FROM projects WHERE code='W2-ATOMIC'").get().count, 0);

  let result = await post(adminCookie, "bulk_import_projects", { sourceFileName: "w2-projects.xlsx", rows: [
    { rowNo: 5, code: "W2-P01", name: "Dự án W2", warehouseCode: "KHO-W2-P01", warehouseName: "Kho W2", startDate: "2026-09-03", plannedEndDate: "2027-09-03", status: "ACTIVE" },
  ] });
  assert.equal(result.status, 200, result.body.error);
  result = await post(adminCookie, "bulk_import_projects", { rows: [
    { rowNo: 5, code: "W2-P01", name: "Dự án W2 hoàn chỉnh", warehouseCode: "KHO-W2-P01", warehouseName: "Kho W2 hoàn chỉnh", status: "ARCHIVED" },
  ] });
  assert.equal(result.status, 200, result.body.error);
  assert.equal(sqlite.prepare("SELECT status FROM projects WHERE code='W2-P01'").get().status, "archived");
  assert.equal(sqlite.prepare("SELECT active FROM warehouses WHERE code='KHO-W2-P01'").get().active, 0);
  result = await post(adminCookie, "bulk_import_projects", { rows: [
    { rowNo: 5, code: "W2-P01", name: "Dự án W2 hoàn chỉnh", warehouseCode: "KHO-W2-P01", warehouseName: "Kho W2 hoàn chỉnh", status: "ACTIVE" },
  ] });
  assert.equal(result.status, 200, result.body.error);
});

await test("BUG-IMPORT-ACCOUNT-004: preflight nguyên tử, quyền kế thừa/ngoại lệ và update không đổi mật khẩu", async () => {
  const rejected = await post(adminCookie, "bulk_import_users", { rows: [
    { rowNo: 5, employeeCode: "AT-01", fullName: "Không được ghi", username: "atomic.one", password: "Atomic@Test1", department: "DA", role: "da_nv", status: "ACTIVE" },
    { rowNo: 6, employeeCode: "AT-02", fullName: "", username: "atomic.two", password: "Atomic@Test2", department: "DA", role: "da_nv", status: "ACTIVE" },
  ] });
  assert.equal(rejected.status, 400);
  assert.match(rejected.body.error, /Dòng 6 · Cột “Họ và tên”/);
  assert.equal(sqlite.prepare("SELECT COUNT(*) AS count FROM users WHERE username='atomic.one'").get().count, 0);

  let result = await post(adminCookie, "bulk_import_users", { sourceFileName: "w2-users.xlsx", rows: [
    { rowNo: 5, employeeCode: "W2-NV01", fullName: "Nhân viên W2", username: "w2.nv01", password: "W2@Account2026", email: "w2.nv01@vntech.test", department: "DA", role: "da_nv", projectCodes: "W2-P01", grantSpec: "boq:view,use,export", revokeSpec: "payments", status: "ACTIVE" },
  ] });
  assert.equal(result.status, 200, result.body.error);
  const account = sqlite.prepare("SELECT id,password_hash AS passwordHash,organization_unit_id AS organizationUnitId FROM users WHERE username='w2.nv01'").get();
  assert.equal(account.organizationUnitId, "ORG-DA");
  assert.ok(!String(account.passwordHash).includes("W2@Account2026"));
  assert.equal(sqlite.prepare("SELECT can_view AS canView,permission_source AS source FROM user_module_permissions WHERE user_id=? AND module_key='dept_project_tasks'").get(account.id).source, "department_default");
  const grant = sqlite.prepare("SELECT can_view AS canView,can_use AS canUse,can_export AS canExport,permission_source AS source FROM user_module_permissions WHERE user_id=? AND module_key='boq'").get(account.id);
  assert.equal(grant.canView, 1);
  assert.equal(grant.canUse, 1);
  assert.equal(grant.canExport, 1);
  assert.equal(grant.source, "manual_override");
  const hashBefore = account.passwordHash;
  result = await post(adminCookie, "bulk_import_users", { rows: [
    { rowNo: 5, employeeCode: "W2-NV01", fullName: "Nhân viên W2 cập nhật", username: "w2.nv01", password: "", email: "w2.nv01@vntech.test", department: "Phòng Dự án", role: "da_nv", projectCodes: "W2-P01", status: "LOCKED" },
  ] });
  assert.equal(result.status, 200, result.body.error);
  const updated = sqlite.prepare("SELECT password_hash AS passwordHash,active FROM users WHERE username='w2.nv01'").get();
  assert.equal(updated.passwordHash, hashBefore);
  assert.equal(updated.active, 0);
});

await test("BUG/REQ-ROLE-002: vai trò canonical không được trùng tên kể cả vai trò đã ẩn", async () => {
  const group = sqlite.prepare("SELECT id FROM business_role_group_catalog WHERE engine_role='project' AND active=1 ORDER BY sort_order LIMIT 1").get();
  let result = await post(adminCookie, "save_role_catalog", { code: "w2_estimator", name: "Kỹ sư dự toán W2", businessGroupId: group.id, defaultOrganizationUnitId: "ORG-DA", sortOrder: 901 });
  assert.equal(result.status, 200, result.body.error);
  const role = sqlite.prepare("SELECT id FROM role_catalog WHERE code='w2_estimator'").get();
  result = await post(adminCookie, "set_role_status", { roleId: role.id, active: false });
  assert.equal(result.status, 200, result.body.error);
  result = await post(adminCookie, "save_role_catalog", { code: "w2_estimator_duplicate", name: "KỸ SƯ DỰ TOÁN W2", businessGroupId: group.id, defaultOrganizationUnitId: "ORG-DA", sortOrder: 902 });
  assert.equal(result.status, 400);
  assert.match(result.body.error, /không được tạo chức danh trùng tên/i);
});

await test("BUG/REQ-ORG-003: BCH động có cha/dự án/hiệu lực, archive giữ lịch sử", async () => {
  const project = sqlite.prepare("SELECT id FROM projects WHERE code='W2-P01'").get();
  let result = await post(adminCookie, "save_organization_unit", {
    code: "BCH-W2-P01",
    name: "Ban chỉ huy W2 P01",
    unitType: "site_command",
    parentId: "ORG-BCH",
    projectId: project.id,
    effectiveFrom: "2026-09-03",
    effectiveTo: "2027-09-03",
    sortOrder: 510,
  });
  assert.equal(result.status, 200, result.body.error);
  const unit = sqlite.prepare("SELECT id,parent_id AS parentId,project_id AS projectId,effective_from AS effectiveFrom FROM organization_units WHERE code='BCH-W2-P01'").get();
  assert.equal(unit.parentId, "ORG-BCH");
  assert.equal(unit.projectId, project.id);
  assert.equal(unit.effectiveFrom, "2026-09-03");

  result = await post(adminCookie, "save_organization_unit", { code: "BCH-W2-DUP", name: "BAN CHỈ HUY W2 P01", unitType: "site_command", parentId: "ORG-BCH", projectId: project.id });
  assert.equal(result.status, 400);
  assert.match(result.body.error, /Tên đơn vị.*đã tồn tại/i);

  result = await post(adminCookie, "set_organization_unit_status", { organizationUnitId: unit.id, active: false });
  assert.equal(result.status, 200, result.body.error);
  const archived = sqlite.prepare("SELECT active,archived_at AS archivedAt FROM organization_units WHERE id=?").get(unit.id);
  assert.equal(archived.active, 0);
  assert.ok(archived.archivedAt);
  result = await post(adminCookie, "set_organization_unit_status", { organizationUnitId: unit.id, active: true });
  assert.equal(result.status, 200, result.body.error);
});

await test("BOQ exact 100% và chỉ material/component được đưa vào matching", async () => {
  const candidates = await rankMaterialCandidates(
    { id: "SOURCE", contractMaterialName: "Cu/XLPE/PVC:FR (3x185+1x95)mm2", unit: "m", systemCode: "DIEN" },
    [{ id: "MATERIAL", code: "DIEN-0001", name: "Cu/XLPE/PVC:FR (3x185+1x95)mm2", unit: "m", system: "DIEN" }],
    { provider: "local_feature_v1", topK: 1 },
  );
  assert.equal(candidates[0].finalScore, 1);
  assert.equal(candidates[0].status, "exact");
  assert.equal(candidates[0].exactMatch, true);
  const routeSource = await readFile("scripts/system-route.mjs", "utf8");
  assert.match(routeSource, /boq_source_items WHERE batch_id=\? AND active=1 AND row_role IN \('material','component'\)/);
});

await test("BOQ runtime API trả đúng 100% và loại dòng tiêu đề khỏi kết quả", async () => {
  const project = sqlite.prepare("SELECT id FROM projects WHERE code='W2-P01'").get();
  const stamp = new Date().toISOString();
  sqlite.prepare(`INSERT INTO materials(id,code,name,system,specification,brand,unit,standard_price,min_stock,requires_cocq,requires_mar,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    "W2-EXACT-MATERIAL",
    "DIEN-W2-EXACT",
    "Cu/XLPE/PVC:FR (3x185+1x95)mm2",
    "DIEN",
    "3x185+1x95mm2",
    "",
    "m",
    0,
    0,
    0,
    0,
    1,
    stamp,
    stamp,
  );
  const imported = await post(adminCookie, "replace_boq_items", {
    projectId: project.id,
    sourceFileName: "boq-exact-runtime.xlsx",
    rows: [
      { rowRole: "heading", lineNo: "A", materialName: "CHI PHÍ XÂY DỰNG", unit: "", contractQty: 0 },
      { rowRole: "material", lineNo: "1", materialName: "Cu/XLPE/PVC:FR (3x185+1x95)mm2", unit: "m", contractQty: 100, systemCode: "DIEN" },
    ],
  });
  assert.equal(imported.status, 200, imported.body.error);
  const compared = await post(adminCookie, "compare_boq_materials", {
    projectId: project.id,
    contractId: imported.body.contractId,
    boqVersionId: imported.body.boqVersionId,
    batchId: imported.body.batchId,
    scope: "all",
  });
  assert.equal(compared.status, 200, compared.body.error);
  assert.equal(compared.body.items.length, 1, "dòng heading không được đưa vào matching");
  const candidate = compared.body.items[0].candidates.find((row) => row.materialId === "W2-EXACT-MATERIAL");
  assert.ok(candidate);
  assert.equal(candidate.exactMatch, true);
  assert.equal(candidate.finalScore, 1);
  assert.equal(candidate.status, "exact");
});

await test("Admin bootstrap trả organization canonical và Trust Development Mode", async () => {
  const response = await GET(new Request("http://w2.test/api/system", { headers: { Cookie: adminCookie } }));
  assert.equal(response.status, 200);
  const data = (await response.json()).data;
  assert.ok(data.organizationUnits.some((unit) => unit.code === "DA"));
  assert.equal(data.trustStatus.trustSettings.enforcementEnabled, 0);
  assert.equal(data.trustStatus.trustSettings.trustMode, "development");
});

sqlite.close();
