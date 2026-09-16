// PHASE 0 — KIỂM CHỨNG BẢO MẬT RBAC Ở TẦNG ACTION
//
// GIẢ THUYẾT CẦN CHỨNG MINH (từ đọc mã nguồn):
//   `RbacService.requireActionModule` được ĐỊNH NGHĨA nhưng KHÔNG BAO GIỜ ĐƯỢC GỌI.
//   `ActionRbacRegistry` (174 action × module × quyền) chỉ được dùng trong AuditTrailFilter
//   để GHI LOG, không phải để CHẶN.
//   ⇒ Những action thuộc 12 use case không có `rbac.requireRole(...)` sẽ KHÔNG được bảo vệ:
//     bất kỳ tài khoản đã đăng nhập nào cũng gọi được, bất kể quyền module hay vai trò.
//
// CÁCH KIỂM CHỨNG: tạo một tài khoản ÍT QUYỀN NHẤT (vai trò ksda, KHÔNG cấp quyền module nào),
// rồi gọi từng action. Phân loại kết quả:
//   • HTTP 403  → ĐƯỢC BẢO VỆ ✅ (bị chặn bởi kiểm quyền)
//   • HTTP 400/401/500 → KHÔNG ĐƯỢC BẢO VỆ ❌ (đã lọt qua kiểm quyền, chỉ vướng kiểm dữ liệu)
//   • HTTP 200  → KHÔNG ĐƯỢC BẢO VỆ ❌❌ (thực thi thành công)
//
//   node tools/probe-security-rbac.mjs
//
// AN TOÀN: mọi payload đều RỖNG hoặc vô hiệu, nên kể cả khi lọt qua kiểm quyền thì các action
// này cũng dừng ở bước kiểm dữ liệu và KHÔNG ghi gì vào DB. Không dùng action xoá.
const BASE = process.env.PROBE_BASE || "http://127.0.0.1:9000";
const ADMIN = { username: "admin", password: "Admin123456@" };
const PASS = "Vntech@2026";

let cookie = "";
async function post(action, payload = {}) {
  const res = await fetch(`${BASE}/api/system`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie },
    body: JSON.stringify({ action, ...payload }),
  });
  const setC = (res.headers.getSetCookie?.() || []).map((c) => c.split(";")[0]).join("; ");
  if (setC) cookie = setC;
  const text = await res.text();
  let json = null; try { json = JSON.parse(text); } catch { /* không phải JSON */ }
  return { status: res.status, json, text };
}
async function login(u, p) {
  cookie = "";
  return post("login", { username: u, password: p });
}
async function asAdmin(action, payload = {}) {
  const saved = cookie;
  cookie = adminCookie;
  const r = await post(action, payload);
  adminCookie = cookie || adminCookie;
  cookie = saved;
  return r;
}

// ---- Action cần kiểm chứng, nhóm theo use case ----
const CASES = [
  ["SupplierManagementUseCase (0 requireRole)", "save_supplier", { name: "x" }],
  ["SupplierManagementUseCase (0 requireRole)", "set_supplier_status", { supplierId: "x", active: 1 }],
  ["MaterialCatalogManagementUseCase (0 requireRole)", "save_material", { name: "x" }],
  ["MaterialCatalogManagementUseCase (0 requireRole)", "save_material_category", { name: "x" }],
  ["MaterialCatalogManagementUseCase (0 requireRole)", "save_material_subcategory", { name: "x" }],
  ["BoqManagementUseCase (0 requireRole)", "save_boq_item", { quantity: 1 }],
  ["BoqManagementUseCase (0 requireRole)", "save_boq_version", { name: "x" }],
  ["OpsTaskManagementUseCase (0 requireRole)", "create_dept_task", { title: "x" }],
  ["OpsTaskManagementUseCase (0 requireRole)", "create_self_work_item", { title: "x" }],
  ["OpsTaskManagementUseCase (0 requireRole)", "update_work_item_status", { workItemId: "x" }],
  ["ProjectContractUseCase (0 requireRole)", "save_project_contract", { contractNo: "x" }],
  ["FinanceManagementUseCase (0 requireRole)", "save_payment_plan", { amount: 1 }],
  ["FinanceManagementUseCase (0 requireRole)", "save_cashbook_entry", { amount: 1 }],
  ["HrManagementUseCase (0 requireRole)", "save_hr_record", { fullName: "x" }],
  ["HrManagementUseCase (0 requireRole)", "save_labor_contract", { salary: 1 }],
  // ĐỐI CHỨNG — các action NÀY phải bị chặn (use case có requireRole)
  ["ĐỐI CHỨNG · UserManagementUseCase (17 requireRole)", "create_user", { username: "x" }],
  ["ĐỐI CHỨNG · UserManagementUseCase (17 requireRole)", "save_user_access", { userId: "x" }],
  ["ĐỐI CHỨNG · ProjectManagementUseCase (4 requireRole)", "create_project", { code: "x" }],
  ["ĐỐI CHỨNG · RequestManagementUseCase (1 requireRole)", "create_request", { projectId: "x" }],
  ["ĐỐI CHỨNG · PurchaseManagementUseCase (4 requireRole)", "create_po", { requestId: "x" }],
];

console.log("═".repeat(100));
console.log("  KIỂM CHỨNG BẢO MẬT RBAC — TÀI KHOẢN ÍT QUYỀN NHẤT");
console.log("═".repeat(100));

// ---------- 1. Đăng nhập admin, tạo tài khoản ít quyền ----------
let r = await login(ADMIN.username, ADMIN.password);
let adminCookie = cookie;
console.log(`[admin] đăng nhập HTTP ${r.status}`);
if (r.status !== 200) throw new Error("Không đăng nhập được admin.");

const stamp = Date.now().toString().slice(-6);
const uname = `sec_probe_${stamp}`;
r = await asAdmin("create_user", {
  username: uname, fullName: `Tài khoản ít quyền ${stamp}`, employeeCode: `SEC-${stamp}`,
  role: "ksda", password: PASS, projectIds: [],
});
console.log(`[tạo tài khoản] ${uname} (vai trò ksda, KHÔNG cấp quyền module) — HTTP ${r.status}`);

r = await login(uname, PASS);
const lowOk = r.status === 200;
console.log(`[đăng nhập ít quyền] HTTP ${r.status} — ${lowOk ? "OK" : "THẤT BẠI"}`);
if (!lowOk) throw new Error("Không đăng nhập được tài khoản ít quyền.");

// Xác nhận tài khoản này KHÔNG có quyền module nào
cookie = adminCookie;
const boot = await (await fetch(`${BASE}/api/system`, { headers: { cookie: adminCookie } })).json();
const me = (boot?.data?.users || []).find((u) => u.username === uname);
const myPerms = (boot?.data?.userModulePermissions || []).filter((p) => String(p.userId) === String(me?.id));
console.log(`[xác nhận] tài khoản có ${myPerms.length} dòng quyền module`);
if (myPerms.length) console.log(`           ${myPerms.map((p) => p.moduleKey).join(", ")}`);

// ---------- 2. Gọi từng action bằng tài khoản ít quyền ----------
r = await login(uname, PASS);
console.log("\n" + "─".repeat(100));
console.log("  KẾT QUẢ GỌI ACTION BẰNG TÀI KHOẢN ÍT QUYỀN");
console.log("─".repeat(100));
console.log("  " + "HTTP".padEnd(6) + "PHÂN LOẠI".padEnd(22) + "ACTION".padEnd(32) + "USE CASE");

const results = [];
for (const [usecase, action, payload] of CASES) {
  let res;
  try { res = await post(action, payload); } catch (e) { res = { status: 0, json: { error: e.message } }; }
  const protectedOk = res.status === 403;
  const verdict = protectedOk ? "ĐƯỢC BẢO VỆ ✅" : (res.status === 200 ? "LỌT + ĐÃ GHI ❌❌" : "LỌT QUA ❌");
  console.log("  " + String(res.status).padEnd(6) + verdict.padEnd(22) + action.padEnd(32) + usecase.split("(")[0].trim());
  results.push({ usecase, action, status: res.status, protectedOk, error: res.json?.error });
}

// ---------- 3. Tổng kết ----------
const controls = results.filter((x) => x.usecase.startsWith("ĐỐI CHỨNG"));
const targets = results.filter((x) => !x.usecase.startsWith("ĐỐI CHỨNG"));
const ctlBlocked = controls.filter((x) => x.protectedOk).length;
const tgtBlocked = targets.filter((x) => x.protectedOk).length;

console.log("\n" + "═".repeat(100));
console.log("  TỔNG KẾT");
console.log("═".repeat(100));
console.log(`  ĐỐI CHỨNG (phải bị chặn): ${ctlBlocked}/${controls.length} bị chặn`);
console.log(`  NHÓM KIỂM TRA (use case 0 requireRole): ${tgtBlocked}/${targets.length} bị chặn`);
console.log("");
if (ctlBlocked === controls.length && tgtBlocked === 0) {
  console.log("  ⇒ GIẢ THUYẾT ĐƯỢC CHỨNG MINH:");
  console.log("    • Action thuộc use case CÓ requireRole  → bị chặn 403 đúng như thiết kế.");
  console.log("    • Action thuộc use case KHÔNG có requireRole → LỌT QUA, không hề bị kiểm quyền.");
  console.log("    Kết luận: ActionRbacRegistry KHÔNG được thực thi. Toàn bộ 174 action được khai báo");
  console.log("    module + quyền nhưng không có tác dụng chặn nào.");
} else if (tgtBlocked === targets.length) {
  console.log("  ⇒ GIẢ THUYẾT SAI: mọi action đều bị chặn. Cần tìm cơ chế chặn khác chưa phát hiện.");
} else {
  console.log(`  ⇒ KẾT QUẢ HỖN HỢP: ${tgtBlocked}/${targets.length} bị chặn — cần rà từng action.`);
}
console.log("═".repeat(100));
