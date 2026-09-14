#!/usr/bin/env node
/**
 * Khởi tạo instance VNTECH ERP trên Java + MySQL (chạy sau khi cutover Phương án A).
 * Dùng chính endpoint setup/login như UI, nên kiểm chứng luôn đường đi thật của người dùng.
 *
 * Chạy: node tools/cutover-setup.mjs [baseUrl]
 */
const BASE = process.argv[2] || "http://127.0.0.1:18081";

const ADMIN = {
  companyName: "CÔNG TY CỔ PHẦN THƯƠNG MẠI ĐẦU TƯ PHÁT TRIỂN CÔNG NGHỆ VIỆT",
  fullName: "Quản trị viên VNTECH",
  username: "admin",
  email: "admin@vntech.local",
  password: "Vntech@2026",
};

async function post(action, payload = {}) {
  const res = await fetch(`${BASE}/api/system`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, json, text };
}

console.log(`→ Khởi tạo instance tại ${BASE}`);
let r = await post("setup", ADMIN);
if (r.status === 201) {
  console.log(`✅ Đã tạo công ty + tài khoản quản trị (HTTP ${r.status})`);
} else if (r.status === 409) {
  console.log("ℹ️  Hệ thống đã được khởi tạo trước đó (HTTP 409) — bỏ qua setup");
} else {
  console.log(`❌ setup thất bại: HTTP ${r.status} · ${r.json?.error || r.text.slice(0, 200)}`);
  process.exit(1);
}

// Xác minh đăng nhập được bằng chính tài khoản vừa tạo (đúng đường UI sẽ dùng)
const login = await fetch(`${BASE}/api/system`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ action: "login", username: ADMIN.username, password: ADMIN.password }),
});
const loginJson = await login.json().catch(() => null);
if (login.status === 200 && loginJson?.ok) {
  console.log(`✅ Đăng nhập kiểm chứng OK (HTTP ${login.status})`);
} else {
  console.log(`❌ đăng nhập thất bại: HTTP ${login.status} · ${loginJson?.error || ""}`);
  process.exit(1);
}

// Bootstrap phải có dữ liệu nền để UI hiển thị được ngay
const cookie = (login.headers.getSetCookie?.() || []).map((c) => c.split(";")[0]).join("; ");
const boot = await fetch(`${BASE}/api/system`, { headers: { Cookie: cookie } });
const bootJson = await boot.json().catch(() => null);
const d = bootJson?.data || {};
console.log("✅ Bootstrap OK — có sẵn:");
for (const key of ["projects", "materials", "warehouses", "approvalStageCatalog", "roleCatalog", "users"]) {
  const v = d[key];
  console.log(`     ${key.padEnd(22)} ${Array.isArray(v) ? v.length : (v ? 1 : 0)}`);
}

console.log("\n─────────────────────────────────────────────");
console.log(" ĐĂNG NHẬP GIAO DIỆN:");
console.log(`   Tên đăng nhập : ${ADMIN.username}`);
console.log(`   Mật khẩu      : ${ADMIN.password}`);
console.log("─────────────────────────────────────────────");
