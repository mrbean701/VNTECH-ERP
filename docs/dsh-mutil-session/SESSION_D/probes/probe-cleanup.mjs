// DỌN tài khoản kiểm thử do probe tạo (ưu tiên: KHOÁ tài khoản; nếu xoá được thì xoá).
const BASE = process.argv[2] || "http://127.0.0.1:9000";
const uname = process.argv[3];
const post = async (cookie, action, payload = {}) => {
  const r = await fetch(BASE + "/api/system", { method: "POST", headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) }, body: JSON.stringify({ action, ...payload }) });
  let j = null; try { j = await r.json(); } catch { }
  return { status: r.status, json: j };
};
const r0 = await fetch(BASE + "/api/system", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "login", username: "admin", password: "Admin123456@" }) });
const cookie = (r0.headers.getSetCookie?.() || []).map((c) => c.split(";")[0]).join("; ");
const boot = await fetch(BASE + "/api/system", { headers: { cookie } }).then((r) => r.json()).catch(() => null);
const u = (boot?.data?.users || []).find((x) => x.username === uname);
if (!u) { console.log("⛔ không tìm thấy user " + uname); process.exit(0); }
console.log("user:", u.username, u.id, "active=", u.active);
const del = await post(cookie, "delete_user", { userId: u.id, targetUserId: u.id });
console.log("delete_user ⇒", del.status, del.json?.error || del.json?.message || "");
if (del.status !== 200) {
  for (const pl of [{ userId: u.id, active: 0 }, { targetUserId: u.id, active: 0 }, { userId: u.id, status: "locked" }]) {
    const r = await post(cookie, "set_user_status", pl);
    console.log("set_user_status", JSON.stringify(pl), "⇒", r.status, r.json?.error || r.json?.message || "");
    if (r.status === 200) break;
  }
}
const boot2 = await fetch(BASE + "/api/system", { headers: { cookie } }).then((r) => r.json()).catch(() => null);
const u2 = (boot2?.data?.users || []).find((x) => x.username === uname);
console.log("SAU DỌN:", u2 ? `vẫn thấy (active=${u2.active})` : "✅ đã không còn trong danh sách");
