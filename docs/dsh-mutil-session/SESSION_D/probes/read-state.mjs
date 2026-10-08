// ⚠️ CHỈ ĐỌC — kiểm trạng thái sau tác dụng phụ ngoài ý muốn (email_settings · ui_display_settings).
// ⛔ TUYỆT ĐỐI KHÔNG gọi action ghi nào.
const BASE = process.argv[2] || "http://127.0.0.1:9000";
const login = async (u, p) => {
  const r = await fetch(BASE + "/api/system", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "login", username: u, password: p }) });
  return { ok: r.status === 200, cookie: (r.headers.getSetCookie?.() || []).map((c) => c.split(";")[0]).join("; ") };
};
const boot = async (cookie) => (await fetch(BASE + "/api/system", { headers: { cookie } }).then((r) => r.json()).catch(() => null))?.data || {};
const a = await login("admin", "Admin123456@");
if (!a.ok) { console.log("⛔ không đăng nhập được"); process.exit(1); }
const d = await boot(a.cookie);
console.log("──── CHỈ ĐỌC: trạng thái sau sự cố ────");
console.log("emailSettings      =", JSON.stringify(d.emailSettings));
console.log("uiDisplaySettings  =", JSON.stringify(d.uiDisplaySettings));
console.log("serverInfo         =", JSON.stringify(d.serverInfo)?.slice(0, 300));
