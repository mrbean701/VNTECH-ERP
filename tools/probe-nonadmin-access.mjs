#!/usr/bin/env node
/**
 * Kiểm chứng hậu quả H1/H2 của module_catalog/organization_units RỖNG.
 * Bơm user trực tiếp SQL (vì create_user qua API sẽ bị chặn — đó chính là H1),
 * rồi đăng nhập và thử 1 action nghiệp vụ để đo H2.
 */
import { randomBytes, pbkdf2Sync, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";

const BASE = process.argv[2] || "http://127.0.0.1:18081";
const MYSQL = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";

const runSql = (sql) => {
  try {
    return execFileSync(MYSQL, ["-u", "vntech", "-pvntech", "vntech_erp", "-e", sql],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch (e) {
    return `__SPAWN_FAIL__:${e.code || e.message}`;
  }
};

async function apiLogin(username, password) {
  const res = await fetch(`${BASE}/api/system`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "login", username, password }),
  });
  const cookie = (res.headers.getSetCookie?.() || []).map((c) => c.split(";")[0]).join("; ");
  return { status: res.status, json: await res.json().catch(() => ({})), cookie };
}

const admin = await apiLogin("admin", "Vntech@2026");
console.log("admin login:", admin.status);

// --- H1: tạo user qua API ---
const uname = `ks${Date.now().toString().slice(-6)}`;
const createRes = await fetch(`${BASE}/api/system`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Cookie: admin.cookie },
  body: JSON.stringify({
    action: "create_user", username: uname, fullName: "Ky su kiem chung",
    email: `${uname}@test.local`, role: "engineer", password: "Engineer@2026", projectIds: [],
  }),
});
const cj = await createRes.json().catch(() => ({}));
console.log(`\n[H1] create_user qua API: HTTP ${createRes.status} · ${cj.message || cj.error || ""}`);
console.log(createRes.status !== 200
  ? "     XAC NHAN H1: KHONG tao duoc nguoi dung (organization_units rong)"
  : "     tao duoc");

// --- Bơm user trực tiếp để đo H2 ---
const salt = randomBytes(16);
const key = pbkdf2Sync("Engineer@2026", salt, 600_000, 32, "sha256");
const hash = `pbkdf2$600000$${salt.toString("hex")}$${key.toString("hex")}`;
const uid = "USR_PROBE_" + randomUUID().slice(0, 8);
const out = runSql(`INSERT INTO users (id,employee_code,full_name,username,password_hash,role,department,`
  + `approval_limit,active,must_change_password,created_at,updated_at) VALUES `
  + `('${uid}','${uid}','Ky su probe','${uname}','${hash}','engineer','Phong Ky thuat',0,1,0,NOW(3),NOW(3));`);

if (out.startsWith("__SPAWN_FAIL__")) {
  console.log(`\nCANH BAO: khong do duoc H2 - sandbox chan spawn mysql (${out.split(":")[1]}).`);
  process.exit(0);
}
console.log("\nbom user truc tiep SQL: OK");

// --- H2: kỹ sư thử action nghiệp vụ ---
const eng = await apiLogin(uname, "Engineer@2026");
console.log(`[H2] login ky su: HTTP ${eng.status}`);

if (eng.status === 200) {
  const act = await fetch(`${BASE}/api/system`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: eng.cookie },
    body: JSON.stringify({ action: "save_material", code: `VTKS${Date.now().toString().slice(-4)}`,
      name: "Vat tu test quyen", unit: "cai", system: "KHAC", standardPrice: 1000 }),
  });
  const aj = await act.json().catch(() => ({}));
  console.log(`     save_material: HTTP ${act.status} · ${aj.error || aj.message || ""}`);
  console.log(act.status === 403
    ? "     XAC NHAN H2: nguoi dung KHONG phai admin bi CHAN moi thao tac"
    : "     khong bi chan");
}

runSql(`DELETE FROM users WHERE id='${uid}';`);
console.log("\n(da don user probe)");
