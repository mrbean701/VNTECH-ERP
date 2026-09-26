// PHASE 0B — KIỂM CHỨNG RBAC Ở TẦNG ACTION (bản đo CHÍNH XÁC)
//
// VÌ SAO PHẢI VIẾT LẠI: bản trước phân loại quá thô — coi mọi phản hồi khác 403 là "LỌT QUA".
// Nhưng một tài khoản LUÔN được cấp quyền mặc định theo phòng ban (create_user tự suy ra),
// nên nếu tài khoản CÓ quyền cho module của action thì việc action chạy tiếp là ĐÚNG.
//
// Bản này so từng action với QUYỀN THẬT của tài khoản, dựa trên chính ActionRbacRegistry:
//
//   tài khoản THIẾU quyền  + HTTP 403  → ĐÚNG: đã chặn
//   tài khoản THIẾU quyền  + KHÁC 403  → ❌ LỌT (lỗ hổng)
//   tài khoản CÓ quyền     + HTTP 403  → ⚠️  KHOÁ NHẦM (chặn người có quyền)
//   tài khoản CÓ quyền     + KHÁC 403  → ĐÚNG: cho phép
//   action KHÔNG khai module + HTTP 403 → ĐÚNG: mặc định từ chối
//
//   node tools/probe-security-rbac.mjs
const BASE = process.env.PROBE_BASE || "http://127.0.0.1:9000";
const ADMIN = { username: "admin", password: "Admin123456@" };
const PASS = "Vntech@2026";
const REGISTRY = "java-backend/application/src/main/java/com/vntech/erp/application/rbac/ActionRbacRegistry.java";

import { readFileSync } from "node:fs";

// ---------- 1. Đọc ActionRbacRegistry: action → module[] ----------
const regSrc = readFileSync(REGISTRY, "utf8");
const ACTION_MODULES = new Map();
for (const m of regSrc.matchAll(/Map\.entry\("([a-z0-9_]+)",\s*List\.of\(([^)]*)\)\)/g)) {
  const mods = [...m[2].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
  ACTION_MODULES.set(m[1], mods);   // mods rỗng = chưa khai module
}
// Bảng QUYỀN của từng action (canView/canUse/canCreate/canEdit/canApprove/canExport).
// Phải so ĐÚNG quyền này — nếu chỉ kiểm "có quyền xem" thì sẽ báo khoá nhầm sai.
const ACTION_CAPABILITY = new Map();
for (const m of regSrc.matchAll(/Map\.entry\("([a-z0-9_]+)",\s*"(can[A-Za-z]+)"\)/g)) {
  ACTION_CAPABILITY.set(m[1], m[2]);
}

let cookie = "";
async function post(action, payload = {}) {
  const res = await fetch(`${BASE}/api/system`, {
    method: "POST", headers: { "Content-Type": "application/json", cookie },
    body: JSON.stringify({ action, ...payload }),
  });
  const setC = (res.headers.getSetCookie?.() || []).map((c) => c.split(";")[0]).join("; ");
  if (setC) cookie = setC;
  const text = await res.text();
  let json = null; try { json = JSON.parse(text); } catch { /* không phải JSON */ }
  return { status: res.status, json, text };
}
async function login(u, p) { cookie = ""; return post("login", { username: u, password: p }); }

console.log("═".repeat(104));
console.log("  KIỂM CHỨNG RBAC TẦNG ACTION — đo theo QUYỀN THẬT của tài khoản");
console.log("═".repeat(104));

// ---------- 2. Admin tạo tài khoản kiểm thử ----------
let r = await login(ADMIN.username, ADMIN.password);
let adminCookie = cookie;
if (r.status !== 200) throw new Error("Không đăng nhập được admin.");
// Read a real project before creating the probe account; the payment-plan action also enforces project scope.
const adminBootForScope = await (await fetch(`${BASE}/api/system`, { headers: { cookie: adminCookie } })).json();
const probeProjectId = adminBootForScope?.data?.projects?.[0]?.id || "";
const stamp = Date.now().toString().slice(-6);
const uname = `sec_probe_${stamp}`;
r = await post("create_user", {
  username: uname, fullName: `Tài khoản kiểm thử ${stamp}`, employeeCode: `SEC-${stamp}`,
  role: "ksda", password: PASS, projectIds: [probeProjectId],
});
console.log(`[tạo tài khoản] ${uname} (vai trò ksda) — HTTP ${r.status}`);

// ---------- 3. Đọc QUYỀN THẬT của tài khoản ----------
let boot = await (await fetch(`${BASE}/api/system`, { headers: { cookie: adminCookie } })).json();
const me = (boot?.data?.users || []).find((u) => u.username === uname);
const myPerms = new Map();
for (const p of (boot?.data?.allModulePermissions || [])) {
  if (String(p.userId) !== String(me?.id)) continue;
  myPerms.set(String(p.moduleKey), p);
}
console.log(`[quyền thật] tài khoản có ${myPerms.size} module được cấp: ${[...myPerms.keys()].sort().join(", ")}`);
const hasModule = (mk, capability) => {
  const p = myPerms.get(mk);
  if (!p) return false;
  // RbacService.capabilityFor mặc định là "canUse" khi action không khai quyền.
  const col = capability || "canUse";
  return Number(p[col] ?? 0) === 1;
};

// ---------- 4. Danh sách action kiểm thử ----------
const CASES = [
  ["save_supplier", { name: "x" }],
  ["set_supplier_status", { supplierId: "x", active: 1 }],
  ["save_material", { name: "x" }],
  ["save_material_category", { name: "x" }],
  ["save_material_subcategory", { name: "x" }],
  ["save_boq_item", { quantity: 1 }],
  ["save_boq_version", { name: "x" }],
  ["create_dept_task", { title: "x" }],
  ["create_self_work_item", { title: "x" }],
  ["update_work_item_status", { workItemId: "x" }],
  ["save_project_contract", { contractNo: "x" }],
  ["save_payment_plan", { projectId: probeProjectId, plannedAmount: 1, plannedDate: "2030-01-01" }],
  ["save_cashbook_entry", { amount: 1 }],
  ["save_hr_record", { fullName: "x" }],
  ["save_labor_contract", { salary: 1 }],
  // ĐỐI CHỨNG — phải luôn bị chặn với tài khoản này
  ["create_user", { username: "x" }],
  ["save_user_access", { userId: "x" }],
  ["create_project", { code: "x" }],
  ["save_workflow", { code: "x" }],
  ["install_license_foundation", {}],
];

// ---------- 5. Gọi và phân loại ----------
r = await login(uname, PASS);
if (r.status !== 200) throw new Error(`Không đăng nhập được ${uname}`);

console.log("\n" + "─".repeat(104));
console.log("  " + "HTTP".padEnd(6) + "CÓ QUYỀN?".padEnd(12) + "KẾT LUẬN".padEnd(26) + "ACTION".padEnd(30) + "MODULE");
console.log("─".repeat(104));

const results = [];
for (const [action, payload] of CASES) {
  let res;
  try { res = await post(action, payload); } catch (e) { res = { status: 0, json: { error: e.message } }; }

  const mods = ACTION_MODULES.get(action);
  const declared = mods !== undefined && mods.length > 0;
  const noModule = mods !== undefined && mods.length === 0;
  const notRegistered = mods === undefined;
  const hasProjectWrite = (boot?.data?.userScopes || [])
    .some((s) => String(s.userId) === String(me?.id) && String(s.projectId) === String(probeProjectId)
      && ["write", "approve", "admin"].includes(String(s.permission)));
  const allowed = declared && mods.some((mk) => hasModule(mk, ACTION_CAPABILITY.get(action)))
    && (action !== "save_payment_plan" || hasProjectWrite);
  const blocked = res.status === 403;

  let verdict, kind;
  if (notRegistered) {
    kind = blocked ? "ĐÚNG (từ chối)" : "LỌT (chưa khai)";
    verdict = "chưa khai module";
  } else if (noModule) {
    kind = blocked ? "ĐÚNG (từ chối)" : "LỌT (module rỗng)";
    verdict = "khai rỗng";
  } else if (allowed) {
    kind = blocked ? "KHOÁ NHẦM" : "ĐÚNG (cho phép)";
    verdict = `${mods.join(",")} · ${ACTION_CAPABILITY.get(action) || "canUse"}`;
  } else {
    kind = blocked ? "ĐÚNG (đã chặn)" : "❌ LỘT QUA";
    verdict = `${mods.join(",")} · ${ACTION_CAPABILITY.get(action) || "canUse"}`;
  }

  const icon = kind.startsWith("❌") ? "❌" : kind === "KHOÁ NHẦM" ? "⚠️ " : "✅";
  console.log(`  ${String(res.status).padEnd(6)}${(allowed ? "CÓ" : "KHÔNG").padEnd(12)}${(icon + " " + kind).padEnd(26)}${action.padEnd(30)}${verdict}`);
  results.push({ action, status: res.status, allowed, kind });
}

// ---------- 6. Tổng kết ----------
const leak = results.filter((x) => x.kind.startsWith("❌"));
const wronglyBlocked = results.filter((x) => x.kind === "KHOÁ NHẦM");
const correct = results.filter((x) => x.kind.startsWith("ĐÚNG"));

console.log("\n" + "═".repeat(104));
console.log("  TỔNG KẾT");
console.log("═".repeat(104));
console.log(`  Hành xử ĐÚNG          : ${correct.length}/${results.length}`);
console.log(`  ❌ LỘT QUA (lỗ hổng)   : ${leak.length}${leak.length ? " — " + leak.map((x) => x.action).join(", ") : ""}`);
console.log(`  ⚠️  KHOÁ NHẦM          : ${wronglyBlocked.length}${wronglyBlocked.length ? " — " + wronglyBlocked.map((x) => x.action).join(", ") : ""}`);
console.log("");
if (!leak.length && !wronglyBlocked.length) {
  console.log("  ⇒ ĐẠT: mọi action đều hành xử đúng theo quyền của tài khoản.");
  console.log("    • Action thiếu quyền  → bị chặn 403");
  console.log("    • Action đủ quyền     → cho phép (đi tiếp tới kiểm dữ liệu)");
  console.log("    • Action chưa khai module → mặc định TỪ CHỐI");
} else {
  console.log("  ⇒ CHƯA ĐẠT — xem danh sách trên.");
}
console.log("═".repeat(104));
// ---------- 7. DỌN DẸP (BẮT BUỘC) ----------
// SỬA LỖI 20/09/2026: bản trước KHÔNG dọn user thử ⇒ để sót tài khoản 'sec_probe_*' trong DB
// ⇒ làm cổng ảnh (07-admin) lệch và gây nhiễu điều tra (xem TASK-094 §64).
// Luôn chạy kể cả khi phần kiểm phía trên lỗi: (1) thử XOÁ; (2) nếu không xoá được (tài khoản đã phát sinh
// dữ liệu) thì KHOÁ lại (active=false) — đúng ngữ nghĩa của màn Quản trị (deleteAccount/toggleStatus).
try {
  const probeUser = me;
  if (!probeUser?.id) {
    console.log("  ⚠️  Không tìm thấy user thử để dọn (có thể create_user đã thất bại).");
  } else {
    const payload = { id: probeUser.id, userId: probeUser.id, username: probeUser.username };
    // ⚠️ BÀI HỌC 20/09/2026: KHÔNG tin phản hồi API — phải ĐỌC LẠI dữ liệu để xác nhận.
    // (Bản trước in "Đã XOÁ" trong khi user vẫn còn ⇒ báo cáo sai.)
    await post("delete_user", payload);
    await post("set_user_status", { ...payload, active: false });
    const after = await post("bootstrap", {});
    const still = (after?.data?.users || []).find((u) => u.username === probeUser.username);
    if (!still) {
      console.log(`  🧹 ĐÃ DỌN (đã xoá hẳn): ${probeUser.username}`);
    } else if (still.active === false || still.active === 0 || still.active === "0") {
      console.log(`  🧹 ĐÃ DỌN (đã khoá, không xoá hẳn vì đã phát sinh dữ liệu): ${probeUser.username}`);
    } else {
      console.log(`  ❌ DỌN DẸP THẤT BẠI — user thử VẪN HOẠT ĐỘNG: ${probeUser.username} ⇒ cần xử lý tay`);
    }
  }
} catch (error) {
  console.log(`  ⚠️  DỌN DẸP LỖI — cần kiểm tay: ${error instanceof Error ? error.message : String(error)}`);
}