// BASELINE `P-08` (TRƯỚC BUILD): gọi các action ADMIN-ONLY bằng tài khoản NHÂN VIÊN với payload ⛔ VÔ HẠI
// (payload rỗng ⇒ cổng quyền chạy TRƯỚC use case ⇒ 403 = bị chặn quyền; 400 = ĐÃ QUA cổng quyền rồi mới lỗi dữ liệu).
// ⭐ Mục đích: ghi lại THÔNG ĐIỆP/quy tắc HIỆN TẠI làm mốc «TRƯỚC» để sau BUILD đối chiếu «SAU».
const BASE = process.argv[2] || "http://127.0.0.1:9000";
const U = process.argv[3] || "probe_self_186408";
const P = process.argv[4] || "Engineer@2026";
const ACTIONS = ["bulk_import_projects", "delete_material_category", "save_email_settings", "retry_email", "save_ui_display_settings"];
const post = async (cookie, action) => {
  const r = await fetch(BASE + "/api/system", { method: "POST", headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) }, body: JSON.stringify({ action }) });
  let j = null; try { j = await r.json(); } catch { }
  return { status: r.status, error: j?.error || j?.message || JSON.stringify(j)?.slice(0, 90) };
};
const login = async (u, p) => {
  const r = await fetch(BASE + "/api/system", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "login", username: u, password: p }) });
  return { ok: r.status === 200, cookie: (r.headers.getSetCookie?.() || []).map((c) => c.split(";")[0]).join("; ") };
};
console.log("═".repeat(80));
console.log(`  BASELINE P-08 · tài khoản NHÂN VIÊN «${U}» · payload RỖNG (⛔ vô hại)`);
const s = await login(U, P);
if (!s.ok) { console.log("  ⛔ không đăng nhập được — dừng"); process.exit(1); }
for (const a of ACTIONS) {
  const r = await post(s.cookie, a);
  const label = r.status === 403 ? "🔴 BỊ CHẶN (403)" : r.status === 400 ? "⚠️ ĐÃ QUA CỔNG QUYỀN (400 = lỗi dữ liệu)" : `${r.status}`;
  console.log(`  ${a.padEnd(32)} HTTP ${r.status}  ${label}\n      → ${r.error}`);
}
console.log("═".repeat(80));
console.log("  📌 Sau BUILD, chạy lại: kỳ vọng **403** + thông điệp «Tài khoản không có quyền thực hiện nghiệp vụ này.»");
