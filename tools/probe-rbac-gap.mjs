#!/usr/bin/env node
/**
 * Đo mức độ nghiêm trọng: người dùng role 'engineer' (không phải admin) có thể gọi
 * những action mà JS yêu cầu quyền module / vai trò cao hơn không?
 *
 * Bối cảnh: RbacService.requireActionModule() tồn tại nhưng KHÔNG được gọi ở đâu
 * (0 lần trong toàn bộ java-backend) ⇒ lớp phân quyền theo MODULE bị vô hiệu.
 */
import { randomBytes, pbkdf2Sync, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";

const BASE = process.argv[2] || "http://127.0.0.1:18081";
const MYSQL = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";

const runSql = (sql) => {
  try {
    return execFileSync(MYSQL, ["-u", "vntech", "-pvntech", "vntech_erp", "-e", sql],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch (e) { return `__FAIL__:${e.code || e.message}`; }
};

const login = async (username, password) => {
  const res = await fetch(`${BASE}/api/system`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "login", username, password }),
  });
  const cookie = (res.headers.getSetCookie?.() || []).map((c) => c.split(";")[0]).join("; ");
  return { status: res.status, cookie };
};

const call = async (action, payload, cookie) => {
  const res = await fetch(`${BASE}/api/system`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ action, ...payload }),
  });
  const j = await res.json().catch(() => ({}));
  return { status: res.status, error: j.error, message: j.message };
};

// tạo user engineer
const uname = `eng${Date.now().toString().slice(-6)}`;
const salt = randomBytes(16);
const key = pbkdf2Sync("Engineer@2026", salt, 600_000, 32, "sha256");
const hash = `pbkdf2$600000$${salt.toString("hex")}$${key.toString("hex")}`;
const uid = "USR_SEC_" + randomUUID().slice(0, 8);
const ins = runSql(`INSERT INTO users (id,employee_code,full_name,username,password_hash,role,department,`
  + `approval_limit,active,must_change_password,created_at,updated_at) VALUES `
  + `('${uid}','${uid}','Engineer probe','${uname}','${hash}','engineer','Ky thuat',0,1,0,NOW(3),NOW(3));`);
if (ins.startsWith("__FAIL__")) { console.log("Không tạo được user probe (sandbox):", ins); process.exit(0); }

const eng = await login(uname, "Engineer@2026");
console.log(`login engineer: HTTP ${eng.status}\n`);
if (eng.status !== 200) { runSql(`DELETE FROM users WHERE id='${uid}';`); process.exit(1); }

// các action mà JS yêu cầu quyền module / vai trò đặc biệt
const probes = [
  ["save_material",        { code: `VT${Date.now().toString().slice(-5)}`, name: "Vat tu probe", unit: "cai", system: "KHAC", standardPrice: 1 }, "material_catalog / canEdit"],
  ["save_supplier",        { name: "NCC probe", code: `NCC${Date.now().toString().slice(-5)}`, active: true }, "supplier_catalog / canCreate"],
  ["create_project",       { code: `PRJ${Date.now().toString().slice(-5)}`, name: "Du an probe", status: "active" }, "admin role"],
  ["save_bank_account",    { code: `BKA${Date.now().toString().slice(-5)}`, bankName: "VCB", accountNo: "123" }, "dept_finance_cashbank / canCreate"],
  ["save_approval_stage",  { code: "HT", name: "Hoi dong", stageNo: 101, allowedRoleCodes: "engineer" }, "approvals / canUse"],
];

console.log("Action mà KỸ SƯ gọi được (đáng lẽ phải bị 403 theo JS):");
let leaked = 0;
for (const [action, payload, note] of probes) {
  const r = await call(action, payload, eng.cookie);
  const bad = r.status !== 403;
  if (bad) leaked++;
  console.log(`  ${bad ? "⚠️ " : "✅"} ${action.padEnd(22)} HTTP ${String(r.status).padEnd(4)} ${(r.error || r.message || "").slice(0, 55)}`);
  console.log(`      (yêu cầu: ${note})`);
}
console.log(`\n⇒ ${leaked}/${probes.length} action THOÁT khỏi kiểm soát phân quyền module`);

runSql(`DELETE FROM users WHERE id='${uid}';`);
console.log("(đã dọn user probe)");
