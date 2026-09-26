#!/usr/bin/env node
/**
 * Kiểm chứng: người dùng KHÔNG phải admin có thấy TẤT CẢ dự án không?
 * (JS lọc theo user_project_scopes; Java có vẻ trả hết)
 */
import { randomBytes, pbkdf2Sync, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";

const BASE = "http://127.0.0.1:18081";
const MYSQL = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
const sql = (s) => {
  try { return execFileSync(MYSQL, ["-u","vntech","-pvntech","vntech_erp","-e",s], { encoding:"utf8", stdio:["ignore","pipe","ignore"] }); }
  catch (e) { return `__FAIL__:${e.code||e.message}`; }
};
const login = async (u, p) => {
  const r = await fetch(`${BASE}/api/system`, { method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({action:"login",username:u,password:p}) });
  const c = (r.headers.getSetCookie?.()||[]).map(x=>x.split(";")[0]).join("; ");
  return { status: r.status, cookie: c };
};

// tạo user engineer KHÔNG gán dự án nào
const uname = `engv${Date.now().toString().slice(-5)}`;
const salt = randomBytes(16);
const key = pbkdf2Sync("Engineer@2026", salt, 600000, 32, "sha256");
const hash = `pbkdf2$600000$${salt.toString("hex")}$${key.toString("hex")}`;
const uid = "USR_VIS_" + randomUUID().slice(0,8);
const ins = sql(`INSERT INTO users (id,employee_code,full_name,username,password_hash,role,department,`
  + `approval_limit,active,must_change_password,created_at,updated_at) VALUES `
  + `('${uid}','${uid}','Engineer visibility','${uname}','${hash}','engineer','Ky thuat',0,1,0,NOW(3),NOW(3));`);
if (String(ins).startsWith("__FAIL__")) { console.log("sandbox chặn spawn:", ins); process.exit(0); }

const total = sql(`SELECT COUNT(*) FROM projects WHERE status='active';`).trim().split("\n")[1];
const scopes = sql(`SELECT COUNT(*) FROM user_project_scopes WHERE user_id='${uid}';`).trim().split("\n")[1];
console.log(`Tổng dự án active: ${total} · dự án gán cho user này: ${scopes}`);

const e = await login(uname, "Engineer@2026");
console.log("login engineer:", e.status);
if (e.status === 200) {
  const j = await (await fetch(`${BASE}/api/system`, { headers: { Cookie: e.cookie } })).json();
  const d = j.data || {};
  console.log(`\nbootstrap engineer:`);
  console.log(`  projects      = ${(d.projects||[]).length}  ← đáng lẽ chỉ ${scopes} (hoặc 0)`);
  console.log(`  adminProjects = ${(d.adminProjects||[]).length}`);
  console.log(`  projectAccessAll = ${d.projectAccessAll}`);
  const leak = (d.projects||[]).length > Number(scopes);
  console.log(`\n${leak ? "🐛 XÁC NHẬN: user KHÔNG được gán dự án vẫn THẤY TOÀN BỘ dự án" : "✅ có lọc theo quyền"}`);
  if (d.projects?.length) console.log("  dự án lộ:", d.projects.slice(0,4).map(p=>p.code).join(", "));
}
sql(`DELETE FROM users WHERE id='${uid}';`);
console.log("\n(đã dọn user probe)");
