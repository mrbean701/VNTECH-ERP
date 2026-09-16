// GĐ-B — DỰNG ĐỘI NGŨ VÀ PHÂN QUYỀN CHO LUỒNG PURCHASING
//
// Mục tiêu: chuẩn bị đúng người cho 5 bước của workflow WF-MUAHANG, dùng CHÍNH
// API admin của hệ thống (không sửa thẳng DB) — vừa dựng dữ liệu vừa kiểm thử
// luôn chức năng admin.
//
//   node tools/setup-purchasing-actors.mjs            # xem kế hoạch, không ghi
//   node tools/setup-purchasing-actors.mjs --apply    # thực thi
//
// BỐI CẢNH ĐÃ KHẢO SÁT (GĐ-A):
//   • Workflow WF-MUAHANG "Quy trình mua hàng chuẩn", 5 bước, mỗi bước 1 người duyệt cụ thể.
//   • `department_module_permissions` (37 dòng) CHỈ có module `dept_*` ⇒ KHÔNG phòng ban nào
//     có quyền trên requests / approvals / purchasing / receiving / warehouse_receipt /
//     supplier_catalog. Trong khi workflow yêu cầu `requests.canApprove`.
//   • `user_module_permissions` (217 dòng, tất cả permission_source='department_default')
//     sinh từ quy tắc mặc định cũ ⇒ không có module mua hàng.
//   ⇒ Chỉ admin và tài khoản vai trò `director`/`accountant` chạy được nghiệp vụ mua hàng.
//
// CÁCH SỬA: cấu hình `department_module_permissions` cho từng phòng ban liên quan.
// `saveDepartmentPermission` tự động đồng bộ lại quyền cho toàn bộ tài khoản của phòng
// (syncDepartmentUsers) nên không cần gọi thêm bước nào.
const BASE = process.env.PROBE_BASE || "http://127.0.0.1:9000";
const ADMIN = { username: "admin", password: "Admin123456@" };
const APPLY = process.argv.includes("--apply");

const STAFF_PASS = "Vntech@2026";

// Mật khẩu cho tài khoản mới. Phải đủ mạnh theo ràng buộc của hệ thống:
// ≥8 ký tự, có hoa, thường, số và ký tự đặc biệt.

let cookies = "";
async function api(action, payload = {}) {
  const res = await fetch(`${BASE}/api/system`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(cookies ? { cookie: cookies } : {}) },
    body: JSON.stringify({ action, ...payload }),
  });
  const setCookie = res.headers.getSetCookie?.() || [];
  if (setCookie.length) cookies = setCookie.map((c) => c.split(";")[0]).join("; ");
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* không phải JSON */ }
  return { status: res.status, ok: res.ok && json?.ok !== false, json, text };
}
async function get() {
  const res = await fetch(`${BASE}/api/system`, { headers: cookies ? { cookie: cookies } : {} });
  return { status: res.status, json: await res.json().catch(() => null) };
}

// ---------- 1. Đăng nhập admin ----------
const login = await api("login", ADMIN);
console.log(`[đăng nhập] admin: HTTP ${login.status} ok=${login.json?.ok}`);
if (!login.ok) throw new Error("Không đăng nhập được bằng admin.");

const boot = await get();
const data = boot.json?.data || {};
const orgs = data.organizationUnits || [];
const projects = data.projects || [];
const modules = data.moduleCatalog || [];

console.log(`[bootstrap] tổ chức=${orgs.length} dự án=${projects.length} module=${modules.length}`);
console.log(`[bootstrap] dự án: ${projects.map((p) => `${p.code}(${p.id})`).join(" · ")}`);
console.log("");

// ---------- 2. Bảng phân quyền cần thiết ----------
// Tìm ID đơn vị theo MÃ (mã ổn định hơn ID hash).
const findOrg = (code) => orgs.find((o) => String(o.code).toUpperCase() === code.toUpperCase());
const ORG = {
  DA: findOrg("DA"), KH: findOrg("KH"), BCH: findOrg("BCH"),
  VNTECH: findOrg("VNTECH"), TCKT: findOrg("TCKT"), BGD: findOrg("BGD"), HCPC: findOrg("HCPC"),
};
for (const [k, v] of Object.entries(ORG)) {
  if (!v) console.log(`  ⚠️  không tìm thấy đơn vị mã ${k}`);
}

// v=view u=use c=create e=edit a=approve x=export
const GRANTS = [
  // Phòng Dự án: lập phiếu (ksda) + kiểm tra khối lượng (da_nv) + duyệt cuối (da_truong)
  ["DA", "requests",      1, 1, 1, 1, 0, 0],
  ["DA", "approvals",     1, 1, 0, 0, 1, 0],
  ["DA", "purchasing",    1, 0, 0, 0, 0, 0],
  ["DA", "dept_project_boq", 1, 1, 1, 1, 0, 1],   // kiểm tra khối lượng/BOQ cần BOQ
  // Phòng Kế hoạch: tiếp nhận (kh_nv), lập PO, NCC, duyệt cuối (kh_truong)
  ["KH", "requests",      1, 1, 0, 0, 0, 0],
  ["KH", "approvals",     1, 1, 0, 0, 1, 0],
  ["KH", "purchasing",    1, 1, 1, 1, 0, 1],
  ["KH", "supplier_catalog", 1, 1, 1, 1, 0, 1],
  // Ban chỉ huy công trường: CHT xác nhận nhu cầu (cha.ht) + thủ kho nhập hàng (tkhodemo)
  ["BCH", "approvals",    1, 1, 0, 0, 1, 0],
  ["BCH", "receiving",    1, 1, 1, 1, 0, 1],
  ["BCH", "warehouse_receipt", 1, 1, 1, 1, 0, 1],
  // Thư ký Tổng giám đốc (thukydemo) — bước 2
  ["VNTECH", "approvals", 1, 1, 0, 0, 1, 0],
  // Tài chính Kế toán — theo dõi mua hàng/thanh toán
  ["TCKT", "purchasing",  1, 1, 0, 0, 0, 1],
  ["TCKT", "approvals",   1, 1, 0, 0, 1, 0],
];

// ---------- 3. Người dùng cần có ----------
// 5 bước duyệt đã có người. Thiếu: người LẬP PHIẾU (vai trò ksda) nằm đúng Phòng Dự án.
const NEED_USERS = [
  {
    username: "ksda.demo", fullName: "Kỹ sư dự án (đề nghị mua)", employeeCode: "NV-KSDA-01",
    role: "ksda", org: "DA", email: "ksda.demo@vntech.vn",
    why: "người lập phiếu đề nghị mua — bước khởi đầu của WF-MUAHANG",
  },
  {
    username: "engineer.demo", fullName: "Kỹ sư hiện trường (lập phiếu)", employeeCode: "NV-ENG-01",
    role: "engineer", org: "DA", email: "engineer.demo@vntech.vn",
    why: "GĐ-C phát hiện create_request chỉ nhận vai trò engineer/commander/admin — " +
         "vai trò ksda 'Kỹ sư dự án' bị loại khỏi danh sách. Tạo tài khoản engineer để " +
         "chạy được luồng ĐÚNG THEO LUẬT HIỆN HÀNH, đồng thời ghi nhận sai lệch này.",
  },
];

// ---------- 4. In kế hoạch ----------
console.log("═══ KẾ HOẠCH GĐ-B ═══");
console.log(`\n▸ Cấp quyền PHÒNG BAN (${GRANTS.length} dòng):`);
console.log("  " + "phòng".padEnd(10) + "chức năng".padEnd(24) + "xem dùng tạo sửa duyệt xuất");
let missingOrg = 0;
for (const [orgCode, moduleKey, v, u, c, e, a, x] of GRANTS) {
  const org = ORG[orgCode];
  if (!org) { missingOrg++; continue; }
  const known = modules.some((m) => m.moduleKey === moduleKey || m.key === moduleKey);
  console.log("  " + orgCode.padEnd(10) + moduleKey.padEnd(24) + [v, u, c, e, a, x].map((n) => ` ${n}  `).join(""));
  if (!known) console.log(`     ⚠️  module "${moduleKey}" không có trong moduleCatalog`);
}
if (missingOrg) console.log(`  ⚠️  ${missingOrg} dòng bị bỏ vì thiếu đơn vị tổ chức`);

console.log(`\n▸ Tạo tài khoản còn thiếu (${NEED_USERS.length}):`);
const existing = new Set((data.staffDirectory || data.users || []).map((u) => u.username));
for (const u of NEED_USERS) {
  console.log(`  ${existing.has(u.username) ? "đã có " : "TẠO   "} ${u.username} · ${u.fullName} · vai trò ${u.role} · đơn vị ${u.org}`);
  console.log(`          lý do: ${u.why}`);
}

// Kết thúc tự nhiên: KHÔNG dùng process.exit() vì trên Windows Node 24 còn handle
// fetch đang đóng sẽ ném "Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)".
if (!APPLY) {
  console.log("\n(Chạy lại với --apply để thực thi.)");
  process.exitCode = 0;
} else {

// ---------- 5. Thực thi ----------
console.log("\n═══ THỰC THI ═══\n");
let created = 0, granted = 0, failed = 0;

for (const u of NEED_USERS) {
  if (existing.has(u.username)) { console.log(`  • ${u.username}: đã tồn tại, bỏ qua`); continue; }
  const org = ORG[u.org];
  const r = await api("create_user", {
    employeeCode: u.employeeCode, fullName: u.fullName, username: u.username,
    email: u.email, role: u.role, organizationUnitId: org?.id, password: STAFF_PASS,
    projectIds: projects.map((p) => String(p.id)),
  });
  if (r.ok) { created++; console.log(`  ✅ tạo ${u.username} — HTTP ${r.status}`); }
  else { failed++; console.log(`  ❌ tạo ${u.username} — HTTP ${r.status}: ${(r.json?.error || r.text || "").slice(0, 160)}`); }
}

for (const [orgCode, moduleKey, v, u, c, e, a, x] of GRANTS) {
  const org = ORG[orgCode];
  if (!org) continue;
  const r = await api("save_department_permission", {
    organizationUnitId: org.id, moduleKey,
    canView: v, canUse: u, canCreate: c, canEdit: e, canApprove: a, canExport: x,
  });
  if (r.ok) { granted++; console.log(`  ✅ ${orgCode} ← ${moduleKey}`); }
  else { failed++; console.log(`  ❌ ${orgCode} ← ${moduleKey}: HTTP ${r.status} ${(r.json?.error || r.text || "").slice(0, 160)}`); }
}

console.log(`\nTỔNG: tạo ${created} tài khoản · cấp ${granted} quyền phòng ban · ${failed} lỗi`);
console.log(`Mật khẩu tài khoản mới: ${STAFF_PASS}`);
}
