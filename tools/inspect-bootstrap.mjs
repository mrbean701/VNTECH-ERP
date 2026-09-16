#!/usr/bin/env node
/**
 * Soi payload bootstrap thật: liệt kê tên trường của từng mảng + 1 bản ghi mẫu.
 * Dùng để viết UI đúng field name thay vì đoán.
 *
 * Chạy: node tools/inspect-bootstrap.mjs [url] [user] [password] [tên-mảng,...]
 *   U=... P=... cũng dùng được qua biến môi trường.
 */
const BASE = process.argv[2] || "http://127.0.0.1:9000";
const USER = process.argv[3] || process.env.U || "admin";
const PASS = process.argv[4] || process.env.P || "Admin123456@";
const ONLY = (process.argv[5] || "").split(",").map((s) => s.trim()).filter(Boolean);

const login = await fetch(`${BASE}/api/system`, {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ action: "login", username: USER, password: PASS }),
});
if (!login.ok) { console.error("Đăng nhập thất bại:", login.status, await login.text()); process.exit(1); }
const cookie = (login.headers.getSetCookie?.() || []).map((c) => c.split(";")[0]).join("; ");
const res = await fetch(`${BASE}/api/system`, { headers: { cookie } });
const json = await res.json();
const data = json.data || {};

const arrays = Object.entries(data).filter(([, v]) => Array.isArray(v));
console.log(`Tổng ${arrays.length} mảng trong bootstrap\n`);
for (const [key, rows] of arrays) {
  if (ONLY.length && !ONLY.includes(key)) continue;
  const fields = rows.length ? Object.keys(rows[0]) : [];
  console.log(`── ${key}  (${rows.length} bản ghi)`);
  if (!rows.length) { console.log("   (rỗng)"); continue; }
  console.log("   trường: " + fields.join(", "));
  console.log("   mẫu   : " + JSON.stringify(rows[0]).slice(0, 460));
  console.log("");
}
if (!ONLY.length) {
  console.log("── đối tượng đơn (không phải mảng) ──");
  Object.entries(data).filter(([, v]) => v && typeof v === "object" && !Array.isArray(v))
    .forEach(([k, v]) => console.log(`   ${k}: ${JSON.stringify(v).slice(0, 200)}`));
}
