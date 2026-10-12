// PROBE kiểm chứng END-TO-END **VIỆC 4** («Tự tạo việc» — `create_self_work_item` = action JAVA-ONLY)
// + phát hiện khả năng «tạo xong ⛔ KHÔNG THẤY việc» (bộ lọc `workItems` theo vai/dự án).
// ⚠️ Tệp ở TEMP ⇒ ⛔ không ghi gì vào repo. Tài khoản admin lấy từ tool của chính dự án.
const BASE = process.argv[2] || "http://127.0.0.1:9000";
const results = [];
const check = (n, ok, d = "") => { results.push({ n, ok }); console.log(`  ${ok ? "✅" : "❌"} ${n}${d ? " — " + d : ""}`); };
const post = async (cookie, action, payload = {}) => {
  const r = await fetch(BASE + "/api/system", { method: "POST", headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) }, body: JSON.stringify({ action, ...payload }) });
  let j = null; try { j = await r.json(); } catch { }
  return { status: r.status, json: j };
};
const login = async (u, p) => {
  const r = await fetch(BASE + "/api/system", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "login", username: u, password: p }) });
  return { ok: r.status === 200, cookie: (r.headers.getSetCookie?.() || []).map((c) => c.split(";")[0]).join("; "), status: r.status };
};
const boot = async (cookie) => (await fetch(BASE + "/api/system", { headers: { cookie } }).then((r) => r.json()).catch(() => null))?.data || {};

console.log("═".repeat(78));
console.log("  PROBE VIỆC 4 («Tự tạo việc») trên BẢN CHẠY THẬT  ·  base =", BASE);
const admin = await login("admin", "Admin123456@");
check("Đăng nhập admin", admin.ok, "HTTP " + admin.status);
if (!admin.ok) process.exit(1);

const stamp = Date.now().toString().slice(-6);
const uname = `probe_self_${stamp}`;
const PASS = "Engineer@2026";
const mk = await post(admin.cookie, "create_user", { username: uname, fullName: `NV tự tạo việc ${stamp}`, email: `${uname}@test.local`, employeeCode: `NV-PS-${stamp}`, role: "da_nv", password: PASS, projectIds: [] });
check("Tạo nhân viên kiểm thử (da_nv)", [200, 201].includes(mk.status), `HTTP ${mk.status}${mk.json?.error ? " · " + mk.json.error : ""}`);
const staff = await login(uname, PASS);
check("Đăng nhập bằng NHÂN VIÊN", staff.ok, "HTTP " + staff.status);
if (!staff.ok) process.exit(1);

const title = `[PROBE VIỆC 4] tự tạo ${stamp}`;
const self = await post(staff.cookie, "create_self_work_item", { title, priority: "normal", description: "probe viec 4" });
check("★ NHÂN VIÊN TỰ TẠO được việc (không phải admin)", self.status === 200, `HTTP ${self.status}${self.json?.error ? " · " + self.json.error : ""} · ${self.json?.message || ""}`);

const wi = (await boot(staff.cookie)).workItems || [];
const found = wi.find((r) => String(r.title) === title);
check("★★ Việc tự tạo HIỆN trong dữ liệu của chính nhân viên", Boolean(found), found ? `${found.taskNo} · dept=${found.departmentCode} · status=${found.status} · progress=${found.progress}` : `có ${wi.length} việc, ⛔ KHÔNG thấy việc vừa tạo`);
if (found) {
  check("Mã việc đúng khuôn `CVCN-…` (đường JAVA)", /^CVCN-/.test(String(found.taskNo)), found.taskNo);
  check("Người giao = người nhận (việc của CHÍNH MÌNH)", String(found.assignedTo) === String(found.assignedBy), `${found.assignedTo} vs ${found.assignedBy}`);
}
console.log("═".repeat(78));
console.log(`  KẾT QUẢ: ${results.filter((r) => r.ok).length}/${results.length} ĐẠT`);
console.log(`  ⚠️ Tài khoản kiểm thử cần DỌN: ${uname}`);
