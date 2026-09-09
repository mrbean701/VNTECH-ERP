import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFile, readdir } from "node:fs/promises";

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
      const result = [];
      for (const statement of statements) result.push(await statement.run());
      this.database.exec("COMMIT");
      return result;
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
  }
}

const sqlite = new DatabaseSync(":memory:");
sqlite.exec("PRAGMA foreign_keys=ON");
for (const file of (await readdir("drizzle")).filter((name) => name.endsWith(".sql")).sort()) {
  const sql = await readFile(`drizzle/${file}`, "utf8");
  for (const statement of sql.split("--> statement-breakpoint").map((value) => value.trim()).filter(Boolean)) sqlite.exec(statement);
}

globalThis.__MEP_LOCAL_ENV__ = {
  DB: new TestDatabase(sqlite),
  BUCKET: { put: async () => {}, get: async () => null },
  EMAIL_SECRET: "security-regression",
  TRUST_STATE: { machineFingerprint: "d".repeat(64) },
};

const { GET, POST } = await import("../scripts/system-route.mjs");

async function request(action, payload = {}, cookie = "") {
  const response = await POST(new Request("http://security.test/api/system", {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ action, ...payload }),
  }));
  let body = {};
  try { body = await response.json(); } catch {}
  return { response, body };
}

async function login(username, password) {
  const { response, body } = await request("login", { username, password });
  assert.equal(response.status, 200, body.error);
  return response.headers.get("set-cookie")?.split(";")[0] || "";
}

await request("setup", {
  companyName: "VNTECH SECURITY TEST",
  fullName: "Quản trị kiểm thử",
  username: "admin",
  password: "Security@Test2026",
});
const adminCookie = await login("admin", "Security@Test2026");

await test("payload nghiệp vụ không được trả về khi người dùng không có quyền", async () => {
  let result = await request("create_user", {
    employeeCode: "SEC-DA01",
    fullName: "Nhân viên Dự án",
    username: "security.project",
    email: "security.project@vntech.test",
    password: "Project@Test2026",
    role: "project",
    department: "PHÒNG DỰ ÁN",
    approvalLimit: 0,
  }, adminCookie);
  assert.equal(result.response.status, 200, result.body.error);

  const cookie = await login("security.project", "Project@Test2026");
  const response = await GET(new Request("http://security.test/api/system", { headers: { Cookie: cookie } }));
  assert.equal(response.status, 200);
  const data = (await response.json()).data;
  assert.deepEqual(data.boqItems, []);
  assert.deepEqual(data.purchaseOrders, []);
  assert.deepEqual(data.receipts, []);
  assert.deepEqual(data.allModulePermissions, []);
  assert.ok(data.staffDirectory.some((row) => row.email === "security.project@vntech.test"));
});

await test("API Admin từ chối người dùng thường dù gọi trực tiếp", async () => {
  const cookie = await login("security.project", "Project@Test2026");
  const result = await request("save_role_catalog", {
    code: "forbidden-role",
    name: "Vai trò không được tạo",
    businessGroupId: "BRG-PROJECT",
  }, cookie);
  assert.equal(result.response.status, 403);
  assert.match(result.body.error, /quyền|truy cập|admin/i);
});

await test("ngoại lệ thủ công sống qua thay đổi phòng ban; quyền mặc định cũ bị thay", async () => {
  const adminResponse = await GET(new Request("http://security.test/api/system", { headers: { Cookie: adminCookie } }));
  const adminData = (await adminResponse.json()).data;
  const user = adminData.users.find((row) => row.username === "security.project");
  assert.ok(user);
  const inherited = adminData.allModulePermissions
    .filter((row) => row.userId === user.id)
    .map((row) => ({
      moduleKey: row.moduleKey,
      canView: Boolean(row.canView),
      canUse: Boolean(row.canUse),
      canCreate: Boolean(row.canCreate),
      canEdit: Boolean(row.canEdit),
      canApprove: Boolean(row.canApprove),
      canExport: Boolean(row.canExport),
    }));
  inherited.push({ moduleKey: "dept_finance_payment_plan", canView: true, canUse: false, canCreate: false, canEdit: false, canApprove: false, canExport: false });
  let result = await request("save_user_access", { userId: user.id, projectScopes: [], warehouseScopes: [], modulePermissions: inherited }, adminCookie);
  assert.equal(result.response.status, 200, result.body.error);

  result = await request("update_user", {
    userId: user.id,
    employeeCode: "SEC-DA01",
    fullName: "Nhân viên Kế hoạch",
    username: "security.project",
    email: "security.project@vntech.test",
    role: "procurement",
    department: "PHÒNG KẾ HOẠCH",
    approvalLimit: 0,
    active: true,
  }, adminCookie);
  assert.equal(result.response.status, 200, result.body.error);
  const manual = sqlite.prepare("SELECT permission_source AS source,can_view AS canView,can_use AS canUse FROM user_module_permissions WHERE user_id=? AND module_key='dept_finance_payment_plan'").get(user.id);
  assert.equal(manual.source, "manual_override");
  assert.equal(manual.canView, 1);
  assert.equal(manual.canUse, 0);
  assert.equal(sqlite.prepare("SELECT COUNT(*) AS count FROM user_module_permissions WHERE user_id=? AND permission_source='department_default' AND module_key LIKE 'dept_project_%'").get(user.id).count, 0);
  assert.ok(sqlite.prepare("SELECT COUNT(*) AS count FROM user_module_permissions WHERE user_id=? AND permission_source='department_default' AND module_key LIKE 'dept_plan_%'").get(user.id).count > 0);
});

await test("khóa tài khoản có hiệu lực ngay và mật khẩu không xuất hiện trong bootstrap", async () => {
  const user = sqlite.prepare("SELECT id FROM users WHERE username='security.project'").get();
  const result = await request("set_user_status", { userId: user.id, active: false }, adminCookie);
  assert.equal(result.response.status, 200, result.body.error);
  const denied = await request("login", { username: "security.project", password: "Project@Test2026" });
  assert.equal(denied.response.status, 401);
  const adminResponse = await GET(new Request("http://security.test/api/system", { headers: { Cookie: adminCookie } }));
  const raw = JSON.stringify(await adminResponse.json());
  assert.doesNotMatch(raw, /password_hash|passwordHash|Project@Test2026/i);
});

sqlite.close();
