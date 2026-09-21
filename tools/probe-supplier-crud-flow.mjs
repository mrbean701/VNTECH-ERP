// TASK-131 — TEST MỌI NÚT CHỨC NĂNG «NHÀ CUNG CẤP» + «ĐỐI TÁC» BẰNG ĐÚNG USER CÓ QUYỀN,
// KÈM ĐỐI CHỨNG ÂM VỀ QUYỀN VÀ BẰNG CHỨNG SQL TRƯỚC/SAU.
//
//   node tools/probe-supplier-crud-flow.mjs            # XEM TRƯỚC (không đụng dữ liệu)
//   node tools/probe-supplier-crud-flow.mjs --apply    # THỰC THI (ghi DB thật)
//
// KHUÔN TÁI DÙNG: tools/probe-purchasing-flow.mjs (đăng nhập từng vai trò + call(user, action, payload)
// + đếm ĐẠT/HỎNG). Bổ sung của probe này:
//   • CC `mysql` CLI bằng `--xml` để đọc lại DB làm BẰNG CHỨNG ĐỘC LẬP với API (không tin lời API).
//   • Mọi ca ĐỐI CHỨNG ÂM về quyền được tính là ĐẠT khi bị từ chối (HTTP 403) — không phải HỎNG.
//   • Chỉ tạo bản ghi CÓ NHÃN LƯỢT CHẠY (NCC-T131-<tag>/DT-T131-<tag>); KHÔNG đụng 2 NCC gốc và
//     3 đối tác gốc. Chỉ xoá đúng bản ghi do chính lượt chạy này tạo.
//
// ─────────────────────────────────────────────────────────────────────────────────────────────
// HỢP ĐỒNG 6 ACTION (đo từ `scripts/system-route.mjs:1315-1358` VÀ
// `java-backend/.../SupplierManagementUseCase.java` + `PartnerManagementUseCase.java` +
// `SystemController.java:1186-1219`) — trường BẮT BUỘC in đậm:
//
//   save_supplier        [supplierId?] + *code* + *name*  + taxCode/contactName/phone/leadTimeDays/rating/active
//                        ⚠️ payload dùng `phone` — bảng `suppliers` KHÔNG có `contact_phone`/`email`/`status`.
//   set_supplier_status  *supplierId* + *active* (true|"1" ⇒ 1; còn lại ⇒ 0)
//   delete_supplier      *supplierId* — SystemController chặn bằng `requireRequireAdmin` ⇒ CHỈ admin (403 nếu khác)
//   save_partner         [partnerId?] + *code* + *name* + taxCode/address/contactName/contactPhone/email/
//                        partnerType(mặc định "supplier")/status(mặc định active?"active":"inactive")/active
//   set_partner_status   *partnerId* + *active*
//   delete_partner       *partnerId* — cũng `requireRequireAdmin` ⇒ CHỈ admin
//
// RBAC (ActionRbacRegistry): cả 6 action đòi module `supplier_catalog`; capability = `canEdit`
// (trừ 2 action delete bị cổng admin ở controller chặn TRƯỚC).
// Ma trận đo từ `user_module_permissions` (MySQL) cho các tài khoản demo:
//   can_edit=1 : admin(bỏ qua RBAC) · nvkhdemo · trinhtrench
//   can_edit=0 : engineer.demo · ksda.demo · cha.ht · tkhodemo · ntrdademo · thukydemo · nvdademo
//   director/accountant (giamdoc.demo) — RbacService.java:49 cho qua MỌI module trừ "admin" TRƯỚC khi
//     xét capability ⇒ probe ĐO LẠI (khối 5c/10c) thay vì suy đoán JS vs Java.
//   ⚠️ `kttdemo` KHÔNG đăng nhập được bằng mật khẩu demo (HTTP 401) ⇒ không dùng làm đối chứng âm.

// ─────────────────────────────────────────────────────────────────────────────────────────────

import { spawnSync } from "node:child_process";

const BASE = process.env.PROBE_BASE || "http://127.0.0.1:9000";
const PASS = "Vntech@2026";
const ADMIN = { username: "admin", password: "Admin123456@" };
const APPLY = process.argv.includes("--apply");
const MYSQL = process.env.PROBE_MYSQL || "C:/Program Files/MySQL/MySQL Server 8.0/bin/mysql.exe";
const DB = { user: "vntech", pass: "vntech", name: "vntech_erp" };

// Nhãn DUY NHẤT mỗi lượt ⇒ không đụng ràng buộc UNIQUE `suppliers.code` / `partners.code`.
const TAG = new Date().toISOString().replace(/[-:T.]/g, "").slice(0, 14);
const SUP_CODE = `NCC-T131-${TAG}`;
const PTR_CODE = `DT-T131-${TAG}`;
const PTR_CODE_2 = `DT-T131-${TAG}-B`; // dùng cho ca đối chứng âm `save_partner` (phải KHÔNG được tạo)

// ---------- Đọc DB bằng mysql CLI (--xml ⇒ giữ nguyên ký tự tiếng Việt) ----------
function sql(stmt) {
  const r = spawnSync(MYSQL, [
    `-u${DB.user}`, `-p${DB.pass}`, DB.name,
    "--default-character-set=utf8mb4", "--xml", "-e", stmt,
  ], { encoding: "buffer", maxBuffer: 16 * 1024 * 1024 });
  if (r.status !== 0) {
    throw new Error(`mysql lỗi (status ${r.status}): ${r.stderr?.toString("utf8").slice(0, 300)}`);
  }
  const xml = r.stdout.toString("utf8");
  const rows = [];
  for (const m of xml.matchAll(/<row>([\s\S]*?)<\/row>/g)) {
    const row = {};
    for (const f of m[1].matchAll(/<field name="([^"]*)"[^>]*>([\s\S]*?)<\/field>/g)) {
      row[f[1]] = f[2].replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"');
    }
    rows.push(row);
  }
  return rows;
}
const one = (stmt) => sql(stmt)[0] || null;
const supplierRow = (id) => one(`SELECT id,code,name,tax_code,contact_name,phone,lead_time_days,rating,active FROM suppliers WHERE id='${id}'`);
const partnerRow = (id) => one(`SELECT id,code,name,tax_code,address,contact_name,contact_phone,email,partner_type,status,active FROM partners WHERE id='${id}'`);
const count = (t) => Number(one(`SELECT COUNT(*) AS c FROM ${t}`)?.c || 0);
const orphans = () => Number(one(`SELECT COUNT(*) AS c FROM purchase_orders po LEFT JOIN suppliers s ON s.id=po.supplier_id WHERE s.id IS NULL`)?.c || 0);

// ---------- Phiên đăng nhập theo từng tài khoản ----------
// ⚠️ `app/page.tsx` / proxy :9000 dùng chung cookie phiên ⇒ 1 Map cho cả lượt chạy là đủ.
const sessions = new Map();
async function login(username, password) {
  const res = await fetch(`${BASE}/api/system`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "login", username, password }),
  });
  const json = await res.json().catch(() => null);
  const cookie = (res.headers.getSetCookie?.() || []).map((c) => c.split(";")[0]).join("; ");
  if (res.status === 200 && json?.ok !== false && cookie) sessions.set(username, cookie);
  return { status: res.status, ok: res.ok && json?.ok !== false, json, cookie };
}
async function call(username, action, payload = {}) {
  const res = await fetch(`${BASE}/api/system`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie: sessions.get(username) || "" },
    body: JSON.stringify({ action, ...payload }),
  });
  const text = await res.text();
  let json = null; try { json = JSON.parse(text); } catch { /* không phải JSON */ }
  return { status: res.status, ok: res.ok && json?.ok !== false, json, text };
}

const log = [];
// `opts.expectFail` ⇒ ca ĐỐI CHỨNG ÂM: BỊ TỪ CHỐI (403/400) mới là ĐẠT.
// `opts.expectStatus` ⇒ chốt cứng mã HTTP kỳ vọng (dùng cho các ca đối chứng quyền: phải 403).
function step(n, who, what, r, opts = {}) {
  const expectFail = opts.expectFail === true;
  const expectStatus = opts.expectStatus;
  const err = String(r.json?.error || r.json?.message || r.text || "").slice(0, 180);
  let ok;
  if (expectStatus !== undefined) ok = r.status === expectStatus;
  else ok = expectFail ? !r.ok : r.ok;
  const verdict = expectStatus !== undefined
    ? ` (kỳ vọng HTTP ${expectStatus})`
    : expectFail ? " (kỳ vọng BỊ TỪ CHỐI)" : "";
  const line = `${ok ? "✅" : "❌"} ${String(n).padEnd(24)} [${who.padEnd(13)}] ${what} → HTTP ${r.status}${err ? ` · ${err}` : ""}${verdict}`;
  console.log(line);
  log.push({ n, who, what, ok, status: r.status, expectFail, expectStatus, error: err || null });
  return r;
}
// Khẳng định trên BẰNG CHỨNG SQL (độc lập với API) — cũng tính vào ĐẠT/HỎNG.
function assert(n, what, cond, detail) {
  const line = `${cond ? "✅" : "❌"} ${String(n).padEnd(24)} [SQL          ] ${what} → ${detail}`;
  console.log(line);
  log.push({ n, who: "SQL", what, ok: !!cond, status: null, error: cond ? null : detail });
  return cond;
}
const vi = (v) => (v === null || v === undefined ? "NULL" : String(v));

console.log("═".repeat(120));
console.log(`  NHÀ CUNG CẤP + ĐỐI TÁC — TEST NÚT CHỨC NĂNG THEO VAI TRÒ · ${APPLY ? "THỰC THI" : "XEM TRƯỚC"} · tag ${TAG}`);
console.log(`  API ${BASE}  ·  DB ${DB.name} (chỉ ĐỌC để kiểm chứng)  ·  mã test: ${SUP_CODE} / ${PTR_CODE}`);
console.log("═".repeat(120));

// ---------- 0. Baseline (không cần --apply) ----------
console.log("\n── 0. ĐIỂM XUẤT PHÁT ĐO TỪ MySQL (mốc TRƯỚC) ──");
const base = {
  suppliers: count("suppliers"), partners: count("partners"),
  po: count("purchase_orders"), orphans: orphans(),
  supplierCodes: sql("SELECT code FROM suppliers ORDER BY code").map((r) => r.code),
  partnerCodes: sql("SELECT code FROM partners ORDER BY code").map((r) => r.code),
};
console.log(`   NCC: ${base.suppliers} · Đối tác: ${base.partners} · PO: ${base.po} · PO mồ côi (supplier_id trỏ hư): ${base.orphans}`);
console.log(`   mã NCC gốc: ${base.supplierCodes.join(", ")}`);
console.log(`   mã đối tác gốc: ${base.partnerCodes.join(", ")}`);
const GUARD_CODES = new Set([...base.supplierCodes, ...base.partnerCodes]);

// ---------- Kế hoạch (không --apply thì dừng ở đây) ----------
if (!APPLY) {
  console.log(`
KẾ HOẠCH (chạy lại với --apply để thực thi):
  ĐĂNG NHẬP  : admin · nvkhdemo (kh_nv, can_edit=1) · trinhtrench (kh_truong, can_edit=1)
               · ĐỐI CHỨNG ÂM: engineer.demo · cha.ht · tkhodemo · ksda.demo
               · CROSS-CHECK lãnh đạo: giamdoc.demo (director) · ghi nhận kttdemo (401)
  NCC        : save_supplier (nvkhdemo → thêm ${SUP_CODE}) → SQL đọc lại
               save_supplier (nvkhdemo → sửa tên+phone)          → SQL đọc lại
               set_supplier_status (nvkhdemo → 0 rồi 1)          → SQL đọc lại
               delete_supplier (admin — 6 user khác PHẢI 403)    → SQL đọc lại (bản ghi biến mất)
  ĐỐI TÁC    : save_partner (nvkhdemo → thêm ${PTR_CODE}) → SQL đọc lại
               save_partner (trinhtrench → sửa tên+email)        → SQL đọc lại
               set_partner_status (nvkhdemo → 0 rồi 1)           → SQL đọc lại
               delete_partner (admin — 6 user khác PHẢI 403)     → SQL đọc lại
  ÂM QUYỀN   : save_* / set_*_status bằng engineer.demo · cha.ht · tkhodemo · kttdemo ⇒ PHẢI 403
               và bản ghi đối chứng (${PTR_CODE_2}) PHẢI KHÔNG tồn tại trong DB.
  TOÀN VẸN   : đếm NCC/đối tác/PO/mồ côi TRƯỚC–SAU; 2 NCC gốc + 3 đối tác gốc PHẢI còn nguyên.
`);
  console.log("═".repeat(120));
  console.log(`KẾT QUẢ: XEM TRƯỚC — 0 bước thực thi, dữ liệu KHÔNG bị đụng.`);
  console.log("═".repeat(120));
  process.exit(0);
}

// ═════════════════════════ THỰC THI ═════════════════════════
console.log("\n── 1. ĐĂNG NHẬP CÁC VAI TRÒ ──");
const al = await login(ADMIN.username, ADMIN.password);
sessions.set("__admin", sessions.get(ADMIN.username));
sessions.delete(ADMIN.username);
step("1.0", "admin", "đăng nhập admin", al);
if (!al.ok) throw new Error("Không đăng nhập được admin — dừng.");

const EDIT_USERS = ["nvkhdemo", "trinhtrench"];              // can_edit=1
// `can_edit=0` ⇒ PHẢI 403. Cố ý KHÔNG dùng `kttdemo`: tài khoản này trả 401 khi đăng nhập
// (mật khẩu demo không khớp) ⇒ phiên trống ⇒ 401, KHÔNG chứng minh được gì về phân quyền.
const NOEDIT_USERS = ["engineer.demo", "cha.ht", "tkhodemo", "ksda.demo"];
const LEADERSHIP = ["giamdoc.demo"];                          // roleBase/role = director ⇒ RbacService bỏ qua capability
for (const u of [...EDIT_USERS, ...NOEDIT_USERS, ...LEADERSHIP]) {
  const r = await login(u, PASS);
  step(`1.${u}`, u, "đăng nhập", r);
}

// ---------- 2. NHÀ CUNG CẤP: THÊM ----------
console.log("\n── 2. NCC — THÊM MỚI (save_supplier) ──");
const saveSup = (who, extra) => call(who, "save_supplier", {
  code: SUP_CODE, name: "Công ty TNHH Kiểm thử TASK-131", taxCode: "0312345678",
  contactName: "Nguyễn Văn Test", phone: "0900000131", leadTimeDays: 5, rating: 4.5, active: 1,
  ...extra,
});
let r = await saveSup("nvkhdemo", {});
step("2.1", "nvkhdemo", `THÊM NCC ${SUP_CODE}`, r);
let sup = one(`SELECT id FROM suppliers WHERE code='${SUP_CODE}'`);
assert("2.2", "SQL: bản ghi NCC đã lưu", !!sup, sup ? `id=${sup.id}` : "KHÔNG thấy trong DB ✗");
const supId = sup?.id || "";
if (supId) {
  const row = supplierRow(supId);
  console.log(`      TRƯỚC: (không có)  →  SAU: code=${vi(row.code)} · name=${vi(row.name)} · tax_code=${vi(row.tax_code)} · contact_name=${vi(row.contact_name)} · phone=${vi(row.phone)} · lead_time_days=${vi(row.lead_time_days)} · rating=${vi(row.rating)} · active=${vi(row.active)}`);
  assert("2.3", "SQL: đủ trường đã gửi (MST/liên hệ/phone)", row.tax_code === "0312345678" && row.contact_name === "Nguyễn Văn Test" && row.phone === "0900000131",
    `tax_code=${vi(row.tax_code)} contact_name=${vi(row.contact_name)} phone=${vi(row.phone)}`);
}

// ---------- 3. NCC: SỬA ----------
console.log("\n── 3. NCC — SỬA (save_supplier có supplierId) ──");
const before3 = supId ? supplierRow(supId) : null;
r = await saveSup("nvkhdemo", { supplierId: supId, name: "Công ty TNHH Kiểm thử TASK-131 (ĐÃ SỬA)", phone: "0900000999", active: 1 });
step("3.1", "nvkhdemo", "SỬA tên + điện thoại NCC", r);
const after3 = supId ? supplierRow(supId) : null;
console.log(`      TRƯỚC: name=${vi(before3?.name)} · phone=${vi(before3?.phone)}`);
console.log(`      SAU  : name=${vi(after3?.name)} · phone=${vi(after3?.phone)}`);
assert("3.2", "SQL: tên + điện thoại đã đổi", after3?.name === "Công ty TNHH Kiểm thử TASK-131 (ĐÃ SỬA)" && after3?.phone === "0900000999",
  `name=${vi(after3?.name)} phone=${vi(after3?.phone)}`);

// ---------- 4. NCC: ĐỔI TRẠNG THÁI ----------
console.log("\n── 4. NCC — ĐỔI TRẠNG THÁI (set_supplier_status) ──");
r = await call("nvkhdemo", "set_supplier_status", { supplierId: supId, active: 0 });
step("4.1", "nvkhdemo", "NGỪNG SỬ DỤNG NCC (active=0)", r);
let s4 = supId ? supplierRow(supId) : null;
console.log(`      TRƯỚC active=${vi(after3?.active)}  →  SAU active=${vi(s4?.active)}`);
assert("4.2", "SQL: active đã về 0", s4?.active === "0", `active=${vi(s4?.active)}`);
r = await call("nvkhdemo", "set_supplier_status", { supplierId: supId, active: 1 });
step("4.3", "nvkhdemo", "KÍCH HOẠT LẠI NCC (active=1)", r);
s4 = supId ? supplierRow(supId) : null;
assert("4.4", "SQL: active đã về 1", s4?.active === "1", `active=${vi(s4?.active)}`);

// ---------- 5. ĐỐI CHỨNG ÂM QUYỀN TRÊN NCC (ngoài admin) ----------
console.log("\n── 5. ĐỐI CHỨNG ÂM QUYỀN — NCC (can_edit=0 ⇒ PHẢI 403) ──");
for (const u of NOEDIT_USERS) {
  const rr = await saveSup(u, { code: `${SUP_CODE}-X`, name: "Đối chứng âm" });
  step(`5.${u}`, u, "PHẢI bị chặn — save_supplier", rr, { expectStatus: 403 });
}
for (const u of NOEDIT_USERS) {
  const rr = await call(u, "set_supplier_status", { supplierId: supId, active: 0 });
  step(`5b.${u}`, u, "PHẢI bị chặn — set_supplier_status", rr, { expectStatus: 403 });
}
const supX = one(`SELECT id FROM suppliers WHERE code='${SUP_CODE}-X'`);
assert("5.9", "SQL: NCC đối chứng âm KHÔNG được tạo", !supX, supX ? `CÓ bản ghi ${supX.id} ⇒ LỖI BẢO MẬT ✗` : "không có bản ghi ✔");

// ---------- 5c. CROSS-CHECK «LÃNH ĐẠO CẤP CÔNG TY» (RbacService:49 bỏ qua capability) ----------
// `RbacService.requireActionModule` cho `director`/`accountant` qua MỌI module (trừ "admin") TRƯỚC khi
// xét `can_edit`. Đây là chủ ý đã ghi trong JS gốc ⇒ probe ĐO LẠI bằng chứng thay vì suy đoán:
// nếu `giamdoc.demo` (role=director, can_edit=1) GHI ĐƯỢC thì Java KHỚP JS.
console.log("\n── 5c. ĐỐI CHỨNG «director/accountant bỏ qua can_edit» (RbacService.java:49) ──");
const supLeadCode = `${SUP_CODE}-LEAD`;
const rLead = await saveSup("giamdoc.demo", { code: supLeadCode, name: "NCC do Giám đốc tạo (cross-check)" });
step("5c.1", "giamdoc.demo", "save_supplier bằng director (kỳ vọng 200 = khớp JS)", rLead, { expectStatus: 200 });
const supLead = one(`SELECT id,active FROM suppliers WHERE code='${supLeadCode}'`);
assert("5c.2", "SQL: director đã GHI được ⇒ Java khớp JS", !!supLead, supLead ? `id=${supLead.id}` : "KHÔNG tạo được ⇒ Java khác JS ✗");
if (supLead) {
  const rd = await call("__admin", "delete_supplier", { supplierId: supLead.id });
  step("5c.3", "admin", "dọn NCC do director tạo (đúng bản ghi vừa tạo)", rd);
  assert("5c.4", "SQL: đã dọn sạch", !one(`SELECT id FROM suppliers WHERE id='${supLead.id}'`), "không còn bản ghi ✔");
}
const kttLogin = await login("kttdemo", PASS);
step("5c.5", "kttdemo", "đăng nhập (ghi nhận ngoài phạm vi phân quyền)", kttLogin, { expectStatus: 200 });
console.log("      ↳ Nếu ❌ ở 5c.5: `kttdemo` không đăng nhập được bằng mật khẩu demo ⇒ KHÔNG dùng làm đối chứng âm.");

// ---------- 6. NCC: XOÁ (chỉ admin) ----------
console.log("\n── 6. NCC — XOÁ (delete_supplier · SystemController: requireRequireAdmin) ──");
for (const u of [...EDIT_USERS, ...NOEDIT_USERS, ...LEADERSHIP]) {
  const rr = await call(u, "delete_supplier", { supplierId: supId });
  step(`6.${u}`, u, "PHẢI bị chặn — delete_supplier (chưa phải admin)", rr, { expectStatus: 403 });
}
const stillThere = one(`SELECT id FROM suppliers WHERE id='${supId}'`);
assert("6.8", "SQL: NCC vẫn còn sau 7 lần bị chặn", !!stillThere, stillThere ? "còn nguyên ✔" : "ĐÃ BỊ XOÁ ⇒ LỖI BẢO MẬT ✗");
r = await call("__admin", "delete_supplier", { supplierId: supId });
step("6.9", "admin", "XOÁ NCC vừa tạo (chưa phát sinh PO ⇒ xoá cứng)", r);
const gone = one(`SELECT id FROM suppliers WHERE id='${supId}'`);
assert("6.10", "SQL: NCC đã bị xoá khỏi DB", !!r.ok && !gone, gone ? "vẫn còn ⇒ xoá mềm/k hông xoá ✗" : "đã xoá cứng ✔");

// ---------- 7. ĐỐI TÁC: THÊM ----------
console.log("\n── 7. ĐỐI TÁC — THÊM MỚI (save_partner) ──  ⭐ chức năng MỚI");
const savePtr = (who, extra) => call(who, "save_partner", {
  code: PTR_CODE, name: "Công ty CP Đối tác Kiểm thử TASK-131", taxCode: "0398765432",
  address: "Số 131 đường Test, Hà Nội", contactName: "Trần Thị Test", contactPhone: "0911000131",
  email: "doitac131@example.com", partnerType: "contractor", active: 1,
  ...extra,
});
r = await savePtr("nvkhdemo", {});
step("7.1", "nvkhdemo", `THÊM đối tác ${PTR_CODE}`, r);
let ptr = one(`SELECT id FROM partners WHERE code='${PTR_CODE}'`);
assert("7.2", "SQL: bản ghi đối tác đã lưu vào `partners`", !!ptr, ptr ? `id=${ptr.id}` : "KHÔNG thấy trong DB ✗");
const ptrId = ptr?.id || "";
if (ptrId) {
  const row = partnerRow(ptrId);
  console.log(`      TRƯỚC: (không có)  →  SAU: code=${vi(row.code)} · name=${vi(row.name)} · tax_code=${vi(row.tax_code)} · address=${vi(row.address)} · contact_name=${vi(row.contact_name)} · contact_phone=${vi(row.contact_phone)} · email=${vi(row.email)} · partner_type=${vi(row.partner_type)} · status=${vi(row.status)} · active=${vi(row.active)}`);
  assert("7.3", "SQL: đủ 9 trường của hợp đồng save_partner",
    row.tax_code === "0398765432" && row.address === "Số 131 đường Test, Hà Nội" && row.contact_name === "Trần Thị Test"
    && row.contact_phone === "0911000131" && row.email === "doitac131@example.com" && row.partner_type === "contractor",
    `MST=${vi(row.tax_code)} địa chỉ=${vi(row.address)} loại=${vi(row.partner_type)} status=${vi(row.status)}`);
}
assert("7.4", "SQL: đối tác KHÔNG bị trộn với bảng suppliers",
  !one(`SELECT id FROM suppliers WHERE code='${PTR_CODE}'`), "không có dòng nào trong `suppliers` trùng mã đối tác ✔");

// ---------- 8. ĐỐI TÁC: SỬA ----------
console.log("\n── 8. ĐỐI TÁC — SỬA (save_partner có partnerId) ──");
const before8 = ptrId ? partnerRow(ptrId) : null;
r = await savePtr("trinhtrench", { partnerId: ptrId, name: "Công ty CP Đối tác Kiểm thử TASK-131 (ĐÃ SỬA)", email: "doitac131-sua@example.com", partnerType: "consultant" });
step("8.1", "trinhtrench", "SỬA tên + email + loại đối tác", r);
const after8 = ptrId ? partnerRow(ptrId) : null;
console.log(`      TRƯỚC: name=${vi(before8?.name)} · email=${vi(before8?.email)} · partner_type=${vi(before8?.partner_type)}`);
console.log(`      SAU  : name=${vi(after8?.name)} · email=${vi(after8?.email)} · partner_type=${vi(after8?.partner_type)}`);
assert("8.2", "SQL: tên + email + loại đã đổi",
  after8?.name === "Công ty CP Đối tác Kiểm thử TASK-131 (ĐÃ SỬA)" && after8?.email === "doitac131-sua@example.com" && after8?.partner_type === "consultant",
  `name=${vi(after8?.name)} email=${vi(after8?.email)} type=${vi(after8?.partner_type)}`);

// ---------- 9. ĐỐI TÁC: ĐỔI TRẠNG THÁI ----------
console.log("\n── 9. ĐỐI TÁC — ĐỔI TRẠNG THÁI (set_partner_status) ──");
r = await call("nvkhdemo", "set_partner_status", { partnerId: ptrId, active: 0 });
step("9.1", "nvkhdemo", "NGỪNG SỬ DỤNG đối tác (active=0)", r);
let s9 = ptrId ? partnerRow(ptrId) : null;
console.log(`      TRƯỚC active=${vi(after8?.active)} status=${vi(after8?.status)}  →  SAU active=${vi(s9?.active)} status=${vi(s9?.status)}`);
assert("9.2", "SQL: active=0 VÀ status='inactive'", s9?.active === "0" && s9?.status === "inactive", `active=${vi(s9?.active)} status=${vi(s9?.status)}`);
r = await call("nvkhdemo", "set_partner_status", { partnerId: ptrId, active: 1 });
step("9.3", "nvkhdemo", "KÍCH HOẠT LẠI đối tác (active=1)", r);
s9 = ptrId ? partnerRow(ptrId) : null;
assert("9.4", "SQL: active=1 VÀ status='active'", s9?.active === "1" && s9?.status === "active", `active=${vi(s9?.active)} status=${vi(s9?.status)}`);

// ---------- 10. ĐỐI CHỨNG ÂM QUYỀN TRÊN ĐỐI TÁC ----------
console.log("\n── 10. ĐỐI CHỨNG ÂM QUYỀN — ĐỐI TÁC (can_edit=0 ⇒ PHẢI 403) ──");
for (const u of NOEDIT_USERS) {
  const rr = await savePtr(u, { code: PTR_CODE_2, name: "Đối chứng âm đối tác" });
  step(`10.${u}`, u, "PHẢI bị chặn — save_partner", rr, { expectStatus: 403 });
}
for (const u of NOEDIT_USERS) {
  const rr = await call(u, "set_partner_status", { partnerId: ptrId, active: 0 });
  step(`10b.${u}`, u, "PHẢI bị chặn — set_partner_status", rr, { expectStatus: 403 });
}
const ptrX = one(`SELECT id FROM partners WHERE code='${PTR_CODE_2}'`);
assert("10.9", "SQL: đối tác đối chứng âm KHÔNG được tạo", !ptrX, ptrX ? `CÓ bản ghi ${ptrX.id} ⇒ LỖI BẢO MẬT ✗` : "không có bản ghi ✔");
assert("10.10", "SQL: đối tác test vẫn active=1 sau các lần bị chặn",
  (partnerRow(ptrId)?.active) === "1", `active=${vi(partnerRow(ptrId)?.active)}`);

// 10c. Cross-check director trên ĐỐI TÁC (cùng cổng RbacService) — dọn ngay bằng admin.
const ptrLeadCode = `${PTR_CODE}-LEAD`;
const rLeadP = await savePtr("giamdoc.demo", { code: ptrLeadCode, name: "Đối tác do Giám đốc tạo (cross-check)" });
step("10c.1", "giamdoc.demo", "save_partner bằng director (kỳ vọng 200 = khớp JS)", rLeadP, { expectStatus: 200 });
const ptrLead = one(`SELECT id FROM partners WHERE code='${ptrLeadCode}'`);
assert("10c.2", "SQL: director đã GHI được đối tác", !!ptrLead, ptrLead ? `id=${ptrLead.id}` : "KHÔNG tạo được ✗");
if (ptrLead) {
  const rd = await call("__admin", "delete_partner", { partnerId: ptrLead.id });
  step("10c.3", "admin", "dọn đối tác do director tạo", rd);
  assert("10c.4", "SQL: đã dọn sạch", !one(`SELECT id FROM partners WHERE id='${ptrLead.id}'`), "không còn bản ghi ✔");
}

// ---------- 11. ĐỐI TÁC: XOÁ (chỉ admin) ----------
console.log("\n── 11. ĐỐI TÁC — XOÁ (delete_partner · requireRequireAdmin) ──");
for (const u of [...EDIT_USERS, ...NOEDIT_USERS, ...LEADERSHIP]) {
  const rr = await call(u, "delete_partner", { partnerId: ptrId });
  step(`11.${u}`, u, "PHẢI bị chặn — delete_partner (chưa phải admin)", rr, { expectStatus: 403 });
}
const ptrStill = one(`SELECT id FROM partners WHERE id='${ptrId}'`);
assert("11.8", "SQL: đối tác vẫn còn sau 7 lần bị chặn", !!ptrStill, ptrStill ? "còn nguyên ✔" : "ĐÃ BỊ XOÁ ⇒ LỖI BẢO MẬT ✗");
r = await call("__admin", "delete_partner", { partnerId: ptrId });
step("11.9", "admin", "XOÁ đối tác vừa tạo", r);
const ptrGone = one(`SELECT id FROM partners WHERE id='${ptrId}'`);
assert("11.10", "SQL: đối tác đã bị xoá khỏi DB", !!r.ok && !ptrGone, ptrGone ? "vẫn còn ⇒ không xoá ✗" : "đã xoá cứng ✔");

// ---------- 12. TOÀN VẸN DỮ LIỆU ----------
console.log("\n── 12. TOÀN VẸN DỮ LIỆU + KHÔNG ĐỤNG BẢN GHI GỐC ──");
const after = {
  suppliers: count("suppliers"), partners: count("partners"),
  po: count("purchase_orders"), orphans: orphans(),
  supplierCodes: sql("SELECT code FROM suppliers ORDER BY code").map((r) => r.code),
  partnerCodes: sql("SELECT code FROM partners ORDER BY code").map((r) => r.code),
};
console.log(`   NCC : TRƯỚC ${base.suppliers} → SAU ${after.suppliers}`);
console.log(`   ĐT  : TRƯỚC ${base.partners} → SAU ${after.partners}`);
console.log(`   PO  : TRƯỚC ${base.po} → SAU ${after.po}      PO mồ côi: TRƯỚC ${base.orphans} → SAU ${after.orphans}`);
assert("12.1", "SQL: số NCC về ĐÚNG mốc ban đầu", after.suppliers === base.suppliers, `${base.suppliers} → ${after.suppliers}`);
assert("12.2", "SQL: số đối tác về ĐÚNG mốc ban đầu", after.partners === base.partners, `${base.partners} → ${after.partners}`);
assert("12.3", "SQL: 0 PO mồ côi (`purchase_orders.supplier_id` trỏ hư)", after.orphans === 0, `mồ côi = ${after.orphans}`);
const lostCodes = [...GUARD_CODES].filter((c) => !after.supplierCodes.includes(c) && !after.partnerCodes.includes(c));
assert("12.4", "SQL: 2 NCC gốc + 3 đối tác gốc còn NGUYÊN", lostCodes.length === 0,
  lostCodes.length ? `MẤT: ${lostCodes.join(", ")} ✗` : `giữ đủ ${GUARD_CODES.size} mã gốc ✔`);

// ---------- KẾT QUẢ ----------
console.log("\n" + "═".repeat(120));
const passed = log.filter((l) => l.ok).length;
console.log(`KẾT QUẢ: ${passed}/${log.length} bước ĐẠT`);
for (const l of log.filter((x) => !x.ok)) {
  console.log(`   ❌ [${l.who}] ${l.what} → ${l.status === null ? "" : `HTTP ${l.status} `}${l.error || ""}`);
}
console.log("═".repeat(120));
