/* eslint-disable @typescript-eslint/no-explicit-any */
// VNTECH ERP V5.3.0 — PHASE 3 (CÔNG VIỆC) · T-03 / T-04
//
// BÀI KIỂM HỢP ĐỒNG cho những thứ mà `docs/agent-progress/AUDIT-T02-WORK-ITEM-MODEL.md` (đo trên MySQL THẬT)
// kết luận là **THIẾU / UNKNOWN**:
//   · T-04 `TaskComment`     — bình luận theo CÔNG VIỆC (`work_item_comments`);
//   · T-04 `TaskParticipant` — người tham gia/theo dõi công việc (`work_item_participants`);
//   · T-03 "ghi chú nhiều dòng" — chính là bình luận ở trên (KHÔNG tạo cột mới: audit đã chứng minh
//     `progress`/`cancelled_at` ĐÃ CÓ, không được tạo lại);
//   · T-03 "tệp đính kèm theo công việc" — DÙNG LẠI bảng dùng chung `attachments` (`entity_type`/`entity_id`),
//     KHÔNG tạo bảng mới. Vì vậy `/api/files` phải nhận được `entityType='work_item'`.
//
// ⚠️ ĐIỀU KIỆN TIÊN QUYẾT: bootstrap phải LỘ RA 2 khoá `workItemComments` và `workItemParticipants`
// (cùng chỗ với `workItemEvents`); nếu không, màn Công việc không có nguồn dữ liệu và tính năng chỉ nằm ở
// tầng bảng — đúng lớp lỗi "đường ĐỌC thiếu" mà dự án đã gặp nhiều lần (KP #34).
//
// ⚠️ BÀI HỌC VỀ KHUNG KIỂM (đã trả giá ngay ở lượt đầu): KHÔNG dùng `node:test` + `await` ở cấp tệp.
// Trình chạy của `node:test` chỉ BẮT ĐẦU chạy các `test()` SAU KHI tệp nạp xong (kể cả `await` cấp tệp),
// nên thân tệp đã chạy hết `setRuntimeEnvForTests(null); sqlite.close();` TRƯỚC khi bài kiểm đầu tiên chạy
// ⇒ mọi bài đỏ với "database is not open" (lỗi ở KHUNG KIỂM, không ở sản phẩm). Vì vậy tệp này dùng
// **khung tuần tự**: mỗi bước là một hàm async chạy-xong-rồi-mới-sang-bước-sau, có tên và kết quả in ra.
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFile, readdir } from "node:fs/promises";
import { GET, POST } from "../app/api/system/route";
import { POST as FILE_POST, GET as FILE_GET } from "../app/api/files/route";
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

// LƯỢC ĐỒ THẬT: dựng CSDL kiểm thử bằng **chính chuỗi migration `drizzle/`** (đúng như bản chạy SQLite),
// nên nếu migration T-04 viết sai cú pháp thì bộ kiểm này ĐỎ ngay tại đây (bắt trước khi lên MySQL).
const sqlite = new DatabaseSync(":memory:");
sqlite.exec("PRAGMA foreign_keys=ON");
for (const file of (await readdir("drizzle")).filter((name) => name.endsWith(".sql")).sort()) {
  const sql = await readFile(`drizzle/${file}`, "utf8");
  for (const statement of sql.split("--> statement-breakpoint").map((value) => value.trim()).filter(Boolean)) sqlite.exec(statement);
}
for (const table of ["work_item_comments", "work_item_participants"]) {
  const found = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(table);
  assert(found, `Migration T-04 chưa tạo bảng ${table} (chuỗi drizzle không dựng được lược đồ)`);
}

const bucket = new Map<string, unknown>();
setRuntimeEnvForTests({
  DB: new TestDatabase(sqlite) as unknown as D1Database,
  BUCKET: {
    put: async (key: string, value: unknown) => { bucket.set(key, value); },
    get: async (key: string) => bucket.get(key) ?? null,
    delete: async (key: string) => { bucket.delete(key); },
  } as unknown as R2Bucket,
  EMAIL_SECRET: "work-item-comment-encryption-secret",
});

const STAMP = "2026-09-20T00:00:00.000Z";
let cookie = "";
let adminCookie = "";
const managerId = { value: "" };
const assigneeId = { value: "" };

async function api(action: string, payload: Record<string, unknown> = {}) {
  const response = await POST(new Request("http://warehouse.test/api/system", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
    body: JSON.stringify({ action, ...payload }),
  }));
  return { response, result: await response.json() as Record<string, any> };
}
async function load() {
  const response = await GET(new Request("http://warehouse.test/api/system", { headers: cookie ? { Cookie: cookie } : {} }));
  const result = await response.json() as Record<string, any>;
  assert.equal(response.status, 200, result.error);
  return result.data;
}
async function loginAs(username: string, password: string) {
  const saved = cookie; cookie = "";
  const r = await api("login", { username, password });
  const c = r.response.headers.get("set-cookie")?.split(";")[0] || "";
  assert.equal(r.response.status, 200, r.result.error); assert(c, "login phải trả cookie");
  cookie = saved;
  return c;
}
/**
 * Tạo tài khoản qua CHÍNH action thật rồi trả id của nó.
 *
 * ⚠️ `create_user` chỉ ADMIN gọi được ⇒ hàm này TỰ chuyển sang `adminCookie` khi gọi action (không phụ thuộc
 * cookie đang là của ai ở chỗ gọi — bẫy đã mắc: gọi từ ngữ cảnh phiên Trưởng phòng ⇒ HTTP 403).
 *
 * ⚠️ `create_user` chỉ cấp `user_project_scopes.permission='read'` (system-route:3111), mà
 * `create_work_item` đòi quyền GHI ⇒ nếu không nâng lên `write` thì action trả 400 "Không có quyền tại
 * dự án" và bài kiểm sẽ đỏ ở chỗ KHÔNG liên quan tới T-04. Vì vậy phần phạm vi dự án được cấp bằng
 * CHÍNH action thật `save_user_access` (không sửa tay CSDL).
 *
 * ⚠️ Và `save_user_access` XOÁ SẠCH `user_module_permissions` rồi ghi lại đúng những gì payload gửi
 * (system-route:2901) ⇒ phải ĐỌC LẠI quyền mặc định của phòng rồi gửi lại y nguyên, nếu không tài khoản
 * mất hết quyền module và `create_work_item` trả 400 "chưa được cấp đúng quyền" (đã mắc đúng lỗi này).
 */
async function createUser(input: { employeeCode: string; fullName: string; username: string; role: string; department: string; projectIds: string[] }) {
  const password = "WorkItem@2026!";
  const saved = cookie;
  cookie = adminCookie;
  const created = await api("create_user", { ...input, email: `${input.username}@test.local`, password });
  if (created.response.status !== 200) console.log(`    [chẩn đoán] create_user ${input.username} ⇒ HTTP ${created.response.status} · ${JSON.stringify(created.result)}`);
  assert.equal(created.response.status, 200, created.result.error);
  const row = sqlite.prepare("SELECT id FROM users WHERE username=?").get(input.username) as { id: string } | undefined;
  assert(row, `Không tìm thấy user vừa tạo ${input.username}`);
  if (input.projectIds.length) {
    cookie = adminCookie;
    const snapshot = await load();
    const keepModules = (snapshot.allModulePermissions || [])
      .filter((permission: any) => String(permission.userId) === row.id)
      .map((permission: any) => ({
        moduleKey: String(permission.moduleKey), canView: Boolean(permission.canView), canUse: Boolean(permission.canUse),
        canCreate: Boolean(permission.canCreate), canEdit: Boolean(permission.canEdit),
        canApprove: Boolean(permission.canApprove), canExport: Boolean(permission.canExport),
      }));
    assert(keepModules.length > 0, `Tài khoản ${input.username} phải được phòng cấp quyền mặc định`);
    const granted = await api("save_user_access", {
      userId: row.id,
      projectScopes: input.projectIds.map((projectId) => ({ projectId, permission: "write" })),
      warehouseScopes: [],
      modulePermissions: keepModules,
    });
    assert.equal(granted.response.status, 200, granted.result.error);
  }
  cookie = saved;
  return row.id;
}

// ---------------------------------------------------------------- khung kiểm tuần tự
const results: { name: string; ok: boolean; detail: string }[] = [];
async function buoc(name: string, run: () => Promise<void>) {
  try { await run(); results.push({ name, ok: true, detail: "" }); }
  catch (error) {
    const e = error as { message?: string; actual?: unknown; expected?: unknown };
    const extra = e?.actual === undefined ? "" : ` (nhận: ${JSON.stringify(e.actual)} · mong đợi: ${JSON.stringify(e.expected)})`;
    results.push({ name, ok: false, detail: `${e?.message || String(error)}${extra}` });
  }
}

// ---------------------------------------------------------------- dựng nền
const setup = await api("setup", { companyName: "Công ty kiểm thử công việc", fullName: "Quản trị kiểm thử", username: "admin", password: "TestKho@2026!" });
assert.equal(setup.response.status, 201, setup.result.error);
cookie = setup.response.headers.get("set-cookie")?.split(";")[0] || "";
assert(cookie); adminCookie = cookie;

sqlite.prepare(`INSERT INTO projects (id,code,name,status,manager_user_id,start_date,planned_end_date,contract_no,contract_name,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
  .run("PRJ-WI-01", "WI01", "Dự án kiểm thử công việc", "active", null, "2026-01-01", "2027-12-31", "HD-WI", "Hợp đồng kiểm thử công việc", STAMP, STAMP);

// Trưởng phòng Dự án = người GIAO việc (đúng luật `departmentIsManager`: DA → `da_truong`)
managerId.value = await createUser({ employeeCode: "WI-TPDA", fullName: "Trưởng phòng Dự án kiểm thử", username: "wi.tpda", role: "da_truong", department: "DA", projectIds: ["PRJ-WI-01"] });
// Nhân viên Dự án = người NHẬN việc (đúng luật: DA → base_role `project`)
assigneeId.value = await createUser({ employeeCode: "WI-NVDA", fullName: "Nhân viên Dự án kiểm thử", username: "wi.nvda", role: "da_nv", department: "DA", projectIds: ["PRJ-WI-01"] });

const managerCookie = await loginAs("wi.tpda", "WorkItem@2026!");
const assigneeCookie = await loginAs("wi.nvda", "WorkItem@2026!");
cookie = managerCookie;
const created = await api("create_work_item", {
  departmentCode: "DA", title: "Việc kiểm thử bình luận và người tham gia",
  assignedTo: assigneeId.value, projectId: "PRJ-WI-01", priority: "normal",
});
assert.equal(created.response.status, 200, created.result.error);
const data = await load();
const task = data.workItems.find((row: any) => String(row.title) === "Việc kiểm thử bình luận và người tham gia");
assert(task, "Phải thấy việc vừa giao trong bootstrap");
const taskId = String(task.id);

// ---------------------------------------------------------------- các bước kiểm
await buoc("T-04 · hợp đồng ĐỌC: bootstrap trả workItemComments và workItemParticipants", async () => {
  cookie = managerCookie; const snapshot = await load();
  assert(Array.isArray(snapshot.workItemComments), "bootstrap THIẾU khoá workItemComments");
  assert(Array.isArray(snapshot.workItemParticipants), "bootstrap THIẾU khoá workItemParticipants");
});

await buoc("T-04 · trưởng phòng ghi được BÌNH LUẬN nhiều dòng cho công việc", async () => {
  cookie = managerCookie;
  const r = await api("add_work_item_comment", { workItemId: taskId, comment: "Dòng 1: đối chiếu khối lượng.\nDòng 2: thiếu CO/CQ của lô 2." });
  assert.equal(r.response.status, 200, r.result.error);
  const row = sqlite.prepare(`SELECT work_item_id AS workItemId,user_id AS userId,comment,visibility FROM work_item_comments WHERE work_item_id=?`).get(taskId) as any;
  assert(row, "Phải có dòng trong work_item_comments");
  assert.equal(row.userId, managerId.value);
  assert.match(String(row.comment), /Dòng 2: thiếu CO\/CQ/);   // ghi chú NHIỀU DÒNG không bị cắt
  assert.equal(String(row.visibility), "internal");
});

await buoc("T-04 · bình luận RỖNG phải bị TỪ CHỐI (tự kiểm soát)", async () => {
  cookie = managerCookie;
  const before = Number((sqlite.prepare(`SELECT COUNT(*) AS count FROM work_item_comments WHERE work_item_id=?`).get(taskId) as any).count);
  const r = await api("add_work_item_comment", { workItemId: taskId, comment: "   " });
  assert.equal(r.response.status, 400, `HTTP ${r.response.status}`);
  assert.match(String(r.result.error), /nội dung bình luận/i);
  const after = Number((sqlite.prepare(`SELECT COUNT(*) AS count FROM work_item_comments WHERE work_item_id=?`).get(taskId) as any).count);
  assert.equal(after, before, "Bình luận rỗng KHÔNG được ghi vào CSDL");
});

await buoc("T-04 · bình luận của công việc KHÔNG TỒN TẠI phải bị TỪ CHỐI (tự kiểm soát)", async () => {
  cookie = managerCookie;
  const r = await api("add_work_item_comment", { workItemId: "WI_khong_ton_tai", comment: "bình luận mồ côi" });
  assert.equal(r.response.status, 400, `HTTP ${r.response.status}`);
  assert.match(String(r.result.error), /Không tìm thấy nhiệm vụ/i);
});

await buoc("T-04 · người THỰC HIỆN (không phải quản lý) bình luận được", async () => {
  cookie = assigneeCookie;
  const r = await api("add_work_item_comment", { workItemId: taskId, comment: "Đã nhận việc, bắt đầu kiểm tra hồ sơ." });
  assert.equal(r.response.status, 200, r.result.error);
  const row = sqlite.prepare(`SELECT user_id AS userId FROM work_item_comments WHERE work_item_id=? AND user_id=?`).get(taskId, assigneeId.value) as any;
  assert(row, "Người được giao việc phải bình luận được");
});

await buoc("T-04 · trưởng phòng thêm được NGƯỜI THAM GIA/THEO DÕI", async () => {
  cookie = managerCookie;
  const r = await api("set_work_item_participant", { workItemId: taskId, userId: assigneeId.value, roleInTask: "follower", notify: true });
  assert.equal(r.response.status, 200, r.result.error);
  const row = sqlite.prepare(`SELECT work_item_id AS workItemId,user_id AS userId,role_in_task AS roleInTask,notify FROM work_item_participants WHERE work_item_id=? AND user_id=?`).get(taskId, assigneeId.value) as any;
  assert(row, "Phải có dòng trong work_item_participants");
  assert.equal(String(row.roleInTask), "follower");
  assert.equal(Number(row.notify), 1);
});

await buoc("T-04 · thêm NGƯỜI THAM GIA hai lần KHÔNG sinh dòng trùng (khoá duy nhất)", async () => {
  cookie = managerCookie;
  await api("set_work_item_participant", { workItemId: taskId, userId: assigneeId.value, roleInTask: "supporter", notify: false });
  const rows = sqlite.prepare(`SELECT role_in_task AS roleInTask,notify FROM work_item_participants WHERE work_item_id=? AND user_id=?`).all(taskId, assigneeId.value) as any[];
  assert.equal(rows.length, 1, "Phải giữ ĐÚNG MỘT dòng cho mỗi (công việc, người)");
  assert.equal(String(rows[0].roleInTask), "supporter", "Lần thêm sau phải GHI ĐÈ vai trò, không tạo dòng mới");
  assert.equal(Number(rows[0].notify), 0);
});

await buoc("T-04 · vai trò tham gia không hợp lệ phải bị TỪ CHỐI (tự kiểm soát)", async () => {
  cookie = managerCookie;
  const r = await api("set_work_item_participant", { workItemId: taskId, userId: assigneeId.value, roleInTask: "quan_ly_vu_tru" });
  assert.equal(r.response.status, 400, `HTTP ${r.response.status}`);
  assert.match(String(r.result.error), /vai trò/i);
});

await buoc("T-04 · người KHÔNG liên quan không thêm được người tham gia (tự kiểm soát quyền)", async () => {
  console.log("    [chẩn đoán] bắt đầu tạo người ngoài");
  const outsiderId = await createUser({ employeeCode: "WI-OUT", fullName: "Người ngoài công việc", username: "wi.out", role: "thu_kho", department: "KHO", projectIds: [] });
  console.log("    [chẩn đoán] đã tạo người ngoài", outsiderId);
  const outsiderCookie = await loginAs("wi.out", "WorkItem@2026!");
  console.log("    [chẩn đoán] đã đăng nhập người ngoài");
  cookie = outsiderCookie;
  const r = await api("set_work_item_participant", { workItemId: taskId, userId: outsiderId, roleInTask: "follower" });
  console.log(`    [chẩn đoán] người ngoài: HTTP ${r.response.status} · ${JSON.stringify(r.result)}`);
  // Bị chặn ở CỔNG QUYỀN (403) hoặc ở LUẬT CÔNG VIỆC (400) — cả hai đều ĐÚNG.
  // Điều bắt buộc là: KHÔNG được 200 và KHÔNG có dòng nào trong `work_item_participants`.
  assert.notEqual(r.response.status, 200, `Người ngoài phải bị chặn (HTTP ${r.response.status})`);
  assert([400, 403].includes(r.response.status), `Mã chặn phải là 400/403, nhận HTTP ${r.response.status}`);
  assert.equal(Number((sqlite.prepare(`SELECT COUNT(*) AS count FROM work_item_participants WHERE work_item_id=? AND user_id=?`).get(taskId, outsiderId) as any).count), 0);
});

await buoc("T-03 · TỆP ĐÍNH KÈM theo công việc DÙNG LẠI bảng dùng chung attachments", async () => {
  // Không tạo bảng mới: chỉ cần `attachments.entity_type='work_item'` + `entity_id=<id việc>` đi qua được
  // `assertEntityAccess` (dự án suy ra từ `work_items.project_id`) và `moduleAllowed`.
  cookie = managerCookie;
  const form = new FormData();
  form.set("entityType", "work_item");
  form.set("entityId", taskId);
  form.set("file", new File([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], "bang-chung-cong-viec.jpg", { type: "image/jpeg" }));
  const uploaded = await FILE_POST(new Request("http://warehouse.test/api/files", { method: "POST", headers: { Cookie: cookie }, body: form }));
  assert.equal(uploaded.status, 201, `HTTP ${uploaded.status}`);

  const row = sqlite.prepare(`SELECT entity_type AS entityType,entity_id AS entityId,mime_type AS mimeType FROM attachments WHERE entity_type='work_item' AND entity_id=?`).get(taskId) as any;
  assert(row, "Phải có dòng attachments cho work_item");
  assert.equal(String(row.mimeType), "image/jpeg");

  // Đọc lại qua ĐÚNG route liệt kê tệp của sổ dùng chung
  const listed = await FILE_GET(new Request(`http://warehouse.test/api/files?entityType=work_item&entityId=${encodeURIComponent(taskId)}`, { headers: { Cookie: cookie } }));
  assert.equal(listed.status, 200);
  const body = await listed.json() as Record<string, any>;
  assert.equal((body.attachments || []).length, 1, "Danh sách tệp của công việc phải có đúng 1 dòng");
  assert.equal(String(body.attachments[0].fileName), "bang-chung-cong-viec.jpg");
});

await buoc("T-03 · loại hồ sơ LẠ vẫn bị TỪ CHỐI (đối chứng ÂM của việc mở `work_item`)", async () => {
  cookie = managerCookie;
  const form = new FormData();
  form.set("entityType", "khong_ton_tai");
  form.set("entityId", taskId);
  form.set("file", new File([new Uint8Array([1, 2, 3])], "x.bin", { type: "application/octet-stream" }));
  const uploaded = await FILE_POST(new Request("http://warehouse.test/api/files", { method: "POST", headers: { Cookie: cookie }, body: form }));
  assert.notEqual(uploaded.status, 201, "Loại hồ sơ không hỗ trợ KHÔNG được nhận tệp");
});

await buoc("T-03/T-04 · ĐỌC: bootstrap trả ĐÚNG bình luận + người tham gia của việc", async () => {
  cookie = managerCookie; const snapshot = await load();
  const comments = (snapshot.workItemComments || []).filter((row: any) => String(row.workItemId) === taskId);
  assert.equal(comments.length, 2, `Phải thấy 2 bình luận, thấy ${comments.length}`);
  assert(comments.some((row: any) => /Dòng 2: thiếu CO\/CQ/.test(String(row.comment))), "Thiếu bình luận nhiều dòng của quản lý");
  assert(comments.some((row: any) => String(row.userId) === assigneeId.value), "Thiếu bình luận của người thực hiện");
  assert(comments.every((row: any) => Boolean(row.userName)), "Bình luận phải kèm TÊN người bình luận (màn hình cần)");

  const participants = (snapshot.workItemParticipants || []).filter((row: any) => String(row.workItemId) === taskId);
  assert.equal(participants.length, 1, `Phải thấy 1 người tham gia, thấy ${participants.length}`);
  assert.equal(String(participants[0].userId), assigneeId.value);
  assert.equal(String(participants[0].roleInTask), "supporter");
  assert(Boolean(participants[0].userName), "Người tham gia phải kèm TÊN");
});

await buoc("T-03 · huỷ công việc KHÔNG xoá bình luận/tệp (vết nghiệp vụ phải giữ)", async () => {
  cookie = managerCookie;
  const cancelled = await api("update_work_item_status", { workItemId: taskId, status: "CANCELLED", reason: "Kiểm thử giữ vết bình luận khi huỷ" });
  assert.equal(cancelled.response.status, 200, cancelled.result.error);
  assert.equal(Number((sqlite.prepare(`SELECT COUNT(*) AS count FROM work_item_comments WHERE work_item_id=?`).get(taskId) as any).count), 2);
  assert.equal(Number((sqlite.prepare(`SELECT COUNT(*) AS count FROM attachments WHERE entity_type='work_item' AND entity_id=?`).get(taskId) as any).count), 1);
  const row = sqlite.prepare(`SELECT cancelled_at AS cancelledAt FROM work_items WHERE id=?`).get(taskId) as any;
  assert(row.cancelledAt, "cancelled_at phải được ghi (trường 'huỷ lúc' của T-03 ĐÃ CÓ, không tạo lại)");
});

await buoc("T-04 · xoá dự án phải dọn bình luận/người tham gia/tệp của công việc thuộc dự án", async () => {
  // ĐI ĐÚNG ĐƯỜNG SẢN PHẨM: `delete_project` đòi (a) dự án đã Đóng/Lưu trữ, (b) `confirmCode` = mã dự án,
  // (c) có gói archive VERIFIED. Dựng đủ 3 điều kiện bằng dữ liệu thật rồi gọi CHÍNH action — cách này
  // mới chứng minh được các câu `DELETE` mới nằm trong chuỗi dọn của action, không phải test tự xoá tay.
  sqlite.prepare(`UPDATE projects SET status='closed' WHERE id='PRJ-WI-01'`).run();
  sqlite.prepare(`INSERT INTO project_archives (id,project_id,project_code,project_name,file_name,sha256,byte_size,record_count,attachment_count,schema_version,status,generated_by,generated_at,downloaded_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run("PAR-WI-TEST", "PRJ-WI-01", "WI01", "Dự án kiểm thử công việc", "test.zip", "a".repeat(64), 1, 1, 0, "5.3.0", "verified", managerId.value, STAMP, STAMP);
  cookie = adminCookie;
  const removed = await api("delete_project", { projectId: "PRJ-WI-01", confirmCode: "WI01" });
  assert.equal(removed.response.status, 200, removed.result.error);
  assert.equal(Number((sqlite.prepare(`SELECT COUNT(*) AS count FROM work_item_comments WHERE work_item_id=?`).get(taskId) as any).count), 0, "Bình luận phải bị dọn cùng dự án");
  assert.equal(Number((sqlite.prepare(`SELECT COUNT(*) AS count FROM work_item_participants WHERE work_item_id=?`).get(taskId) as any).count), 0, "Người tham gia phải bị dọn cùng dự án");
  assert.equal(Number((sqlite.prepare(`SELECT COUNT(*) AS count FROM attachments WHERE entity_type='work_item' AND entity_id=?`).get(taskId) as any).count), 0, "Tệp đính kèm của công việc phải bị dọn cùng dự án");
});

setRuntimeEnvForTests(null);
sqlite.close();

const failed = results.filter((row) => !row.ok);
for (const row of results) console.log(`  ${row.ok ? "✔" : "✖"} ${row.name}${row.detail ? ` — ${row.detail.split("\n")[0]}` : ""}`);
console.log(`\n=== T-03/T-04 CÔNG VIỆC: ${results.length - failed.length}/${results.length} ĐẠT · ${failed.length} HỎNG ===`);
process.exitCode = failed.length === 0 ? 0 : 1;
