// TASK-027 — KIỂM CHỨNG SỐNG bằng TÀI KHOẢN THẬT cho các thay đổi VAI TRÒ + PHẠM VI.
//
// Vì sao dùng payload RỖNG: tầng Java chỉ phục vụ action GHI. Chốt quyền nằm ở ĐẦU mỗi nhánh
// `case` (và trong UseCase) TRƯỚC khi validate/ghi. Nên với payload rỗng:
//   - bị chặn  -> HTTP 403  (và KHÔNG có gì được ghi)
//   - được phép -> HTTP 400 (thiếu tham số) — vẫn KHÔNG ghi gì
// Nhờ vậy đo được ma trận CHO/CHẶN một cách an toàn tuyệt đối, không cần tạo dữ liệu giả.
//
// Ba pha:
//   Pha 0 — bảng vai trò thật (login + GET bootstrap, chỉ đọc)
//   Pha 1 — CHỐNG HỞ: action admin-only × tài khoản thường  -> bắt buộc 403
//   Pha 2 — CHỐNG CHẶN OAN (hồi quy): action thuộc vai trò mình -> KHÔNG được 403
//
// Chạy: node tools/probe-task027-live.mjs [base]
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const BASE = process.argv[2] || "http://127.0.0.1:9000";
const DIR = "java-backend/application/src/main/java/com/vntech/erp/application/service";

// ---------------------------------------------------------------- ánh xạ vai trò
const EXPECTED = {
  cht: "commander", da_nv: "project", da_truong: "project", ksda: "engineer",
  kh_nv: "procurement", kh_truong: "procurement", thu_kho: "warehouse", kho_tong: "warehouse",
  thuky: "director", hcpc_truong: "director", admin: "admin",
};

const ACCOUNTS = [
  ["admin", "Admin123456@"],
  ["ksda.demo", "Vntech@2026"],
  ["thukydemo", "Vntech@2026"],
  ["nvdademo", "Vntech@2026"],
  ["nvkhdemo", "Vntech@2026"],
  ["trdademo", "Vntech@2026"],
  ["tkhodemo", "Vntech@2026"],
  ["cha.ht", "Vntech@2026"],
  ["engineer.demo", "Vntech@2026"],
  ["trinhtrench", "Vntech@2026"],
];

// ------------------------------------------------- trích action -> vai trò từ Java
function matchParen(text, open) {
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    const c = text[i];
    if (c === "(") depth++;
    else if (c === ")") { depth--; if (depth === 0) return i; }
    else if (c === '"') { i++; while (i < text.length && text[i] !== '"') { if (text[i] === "\\") i++; i++; } }
  }
  return -1;
}
const camelToSnake = (s) => s.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();

function loadActionRoles() {
  const map = new Map();
  for (const f of readdirSync(DIR).filter((n) => n.endsWith("UseCase.java"))) {
    const text = readFileSync(join(DIR, f), "utf8");
    const re = /requireRole\s*\(/g;
    let m;
    while ((m = re.exec(text)) !== null) {
      const open = m.index + m[0].length - 1;
      const close = matchParen(text, open);
      if (close < 0) continue;
      const roles = [...text.slice(open + 1, close).matchAll(/"([a-z_]+)"/g)].map((x) => x[1]);
      const sigs = [...text.slice(0, m.index).matchAll(/(?:public|private|protected)\s+[\w<>,\[\]\.\s]+\s+([a-zA-Z_][\w]*)\s*\(/g)];
      const action = camelToSnake(sigs.length ? sigs[sigs.length - 1][1] : "?");
      map.set(action, [...new Set([...(map.get(action) || []), ...roles])]);
    }
  }
  return map;
}

// Action CẤM thử bằng payload rỗng (có thể chạy thật dù thiếu tham số).
const DANGEROUS = new Set([
  "factory_reset_execute", "factory_reset_preview", "rebuild_department_permissions",
  "bulk_import_projects", "bulk_import_users", "install_license_foundation",
  "request_license_transfer", "retry_email", "reorder_menu_layout", "reorder_form_fields",
]);

// ---------------------------------------------------------------- HTTP
async function login(username, password) {
  const res = await fetch(`${BASE}/api/system`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "login", username, password }),
  });
  if (!res.ok) return { error: `HTTP ${res.status}` };
  const cookie = (res.headers.getSetCookie?.() ?? [res.headers.get("set-cookie")])
    .filter(Boolean).map((c) => c.split(";")[0]).join("; ");
  return { cookie };
}

async function bootstrap(cookie) {
  const res = await fetch(`${BASE}/api/system`, { headers: { cookie } });
  if (!res.ok) return { error: `HTTP ${res.status}` };
  const j = await res.json();
  return { user: j.data?.user ?? j.user ?? {} };
}

async function call(cookie, action) {
  const res = await fetch(`${BASE}/api/system`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ action }),
  });
  let error = "";
  try { error = String((await res.json()).error ?? ""); } catch { /* bỏ qua */ }
  return { status: res.status, error };
}

// ---------------------------------------------------------------- chạy
const actionRoles = loadActionRoles();
const adminOnly = [...actionRoles].filter(([a, r]) =>
  r.length === 1 && r[0] === "admin" && !DANGEROUS.has(a)).map(([a]) => a);

console.log(`Nguồn: ${BASE}`);
console.log(`Chốt quyền đọc được từ mã nguồn: ${actionRoles.size} action · admin-only dùng để thử: ${adminOnly.length}\n`);

console.log("=== PHA 0 — BẢNG VAI TRÒ THẬT (chỉ đọc) ===");
const sessions = [];
let roleBad = 0;
for (const [u, p] of ACCOUNTS) {
  const { cookie, error } = await login(u, p);
  if (error) { console.log(`  ?   ${u.padEnd(15)} đăng nhập lỗi (${error})`); continue; }
  const b = await bootstrap(cookie);
  if (b.error) { console.log(`  ?   ${u.padEnd(15)} bootstrap lỗi (${b.error})`); continue; }
  const role = String(b.user.role ?? "");
  const roleBase = String(b.user.roleBase ?? "");
  const roleName = String(b.user.roleName ?? "");
  const expect = EXPECTED[role];
  let verdict = "OK ";
  if (!roleBase) { verdict = "THIẾU"; roleBad++; }
  else if (expect && roleBase !== expect) { verdict = "SAI "; roleBad++; }
  console.log(`  ${verdict} ${u.padEnd(15)} role=${role.padEnd(12)} roleBase=${roleBase.padEnd(13)} roleName=${roleName}`);
  sessions.push({ u, cookie, role, roleBase });
}
console.log(`  -> ${roleBad === 0 ? "mọi roleBase ĐÚNG mã engine ✅" : `${roleBad} tài khoản SAI ⚠`}`);

console.log("\n=== PHA 1 — CHỐNG HỞ: action admin-only phải bị 403 với tài khoản thường ===");
let hole = 0, denyOk = 0;
for (const s of sessions) {
  if (s.roleBase === "admin") continue;
  const bad = [];
  for (const a of adminOnly) {
    const r = await call(s.cookie, a);
    if (r.status !== 403) { bad.push(`${a}->${r.status}`); hole++; }
    else denyOk++;
  }
  console.log(`  ${bad.length === 0 ? "ĐẠT" : "HỞ "} ${s.u.padEnd(15)} (${s.roleBase}) bị chặn ${adminOnly.length - bad.length}/${adminOnly.length}`
    + (bad.length ? ` · LỌT: ${bad.join(", ")}` : ""));
}

console.log("\n=== PHA 2 — CHỐNG CHẶN OAN: action thuộc vai trò mình KHÔNG được 403 ===");
// PHÂN LOẠI THEO TẦNG từ thông điệp lỗi (3 tầng RBAC độc lập, kết luận khác nhau hoàn toàn):
//   T1 module  : "chưa được quản trị viên cấp đúng quyền"  -> dữ liệu user_module_permissions
//                (nếu ACTION_MODULE của Java = JS thì JS cũng chặn ⇒ ĐÚNG, không phải lỗi mã)
//   T2 vai trò : "không có quyền thực hiện nghiệp vụ"       -> requireRole  (SAI nếu vai trò có trong danh sách)
//   T3 phạm vi : "không được ... dự án/kho ..."             -> AccessScopeService (payload rỗng nên ĐÚNG)
const layerOf = (msg) =>
  msg.includes("chưa được quản trị viên cấp đúng quyền") ? "T1-module"
    : msg.includes("không có quyền thực hiện nghiệp vụ") ? "T2-vai-tro"
      : msg.includes("Thao tác chưa được khai báo quyền") ? "T0-chua-khai-bao"
        : "T3-pham-vi";
const tally = new Map();
let blockedWrong = 0, allowOk = 0, t2 = 0;
for (const s of sessions) {
  const mine = [...actionRoles].filter(([a, r]) => r.includes(s.roleBase) && !DANGEROUS.has(a)).map(([a]) => a);
  if (!mine.length) { console.log(`  --  ${s.u.padEnd(15)} (${s.roleBase}) không có action nào thuộc vai trò`); continue; }
  const bad = [];
  for (const a of mine) {
    const r = await call(s.cookie, a);
    if (r.status === 403) {
      const L = layerOf(r.error);
      tally.set(L, (tally.get(L) || 0) + 1);
      blockedWrong++;
      if (L === "T2-vai-tro") t2++;
      bad.push(`${a} [${L}] ${r.error.slice(0, 58)}`);
    } else allowOk++;
  }
  console.log(`  ${bad.length === 0 ? "ĐẠT" : "CÓ 403"} ${s.u.padEnd(15)} (${s.roleBase}) cho phép ${mine.length - bad.length}/${mine.length}`
    + (bad.length ? `\n        ↳ ${bad.join("\n        ↳ ")}` : ""));
}

console.log("\n--- Phân loại 403 theo tầng ---");
for (const [k, v] of [...tally].sort()) console.log(`  ${k.padEnd(16)} ${v}`);
console.log("\nTỔNG: chặn đúng(tầng admin) " + denyOk + " · lọt " + hole + " · cho phép đúng " + allowOk
  + " · 403 tầng-vai-trò (LỖI THẬT) " + t2 + " · 403 khác " + (blockedWrong - t2));
const pass = hole === 0 && t2 === 0 && roleBad === 0;
console.log(pass
  ? "KẾT LUẬN: vai trò ĐÚNG trên tài khoản thật; mọi 403 còn lại thuộc tầng module/phạm vi (cần đối chiếu dữ liệu) "
  : "KẾT LUẬN: còn 403 ở tầng VAI TRÒ ⇒ lỗi thật ⚠");
process.exit(pass ? 0 : 1);
