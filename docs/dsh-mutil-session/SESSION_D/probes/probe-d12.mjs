// PROBE kiểm chứng end-to-end cho `BUG-D12` (báo NGƯỜI GIAO khi việc hoàn thành) + Ô NHẬP % (việc 3).
// Tài khoản admin lấy từ chính tool của dự án `tools/probe-work-permission.mjs` (⛔ KHÔNG đoán mật khẩu).
// ⚠️ Tệp đặt ở TEMP ⇒ ⛔ không ghi gì vào repo.
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
  const cookie = (r.headers.getSetCookie?.() || []).map((c) => c.split(";")[0]).join("; ");
  return { ok: r.status === 200, cookie, status: r.status };
};
const boot = async (cookie) => {
  const r = await fetch(BASE + "/api/system", { headers: { cookie } });
  const j = await r.json().catch(() => null);
  return j?.data || j || {};
};

console.log("═".repeat(78));
console.log("  PROBE `BUG-D12` + Ô NHẬP %  ·  base =", BASE);

const admin = await login("admin", "Admin123456@");
check("Đăng nhập admin", admin.ok, "HTTP " + admin.status);
if (!admin.ok) { console.log("⛔ không đăng nhập được ⇒ dừng"); process.exit(1); }

// ⭐ BƯỚC 0 — ĐƯỜNG NÀO ĐANG PHỤC VỤ? `create_self_work_item` là action JAVA-ONLY ⇒
//    Java phục vụ ⇒ 200/400-khác; Node phục vụ ⇒ 400 «chưa được khai báo quyền/chưa triển khai».
const selfProbe = await post(admin.cookie, "create_self_work_item", { title: `[PROBE ROUTE] ${Date.now()}` });
const servedBy = selfProbe.status === 200 ? "JAVA(hoặc Node đã có action)" : "NODE (chưa có create_self_work_item)";
console.log(`  ℹ️  Đường đang phục vụ: ${servedBy}  (HTTP ${selfProbe.status}${selfProbe.json?.error ? " · " + selfProbe.json.error : ""})`);

// ⭐ BƯỚC 1 — tạo nhân viên kiểm thử (role da_nv ⇒ thuộc phòng DA)
const stamp = Date.now().toString().slice(-6);
const uname = `probe_d12_${stamp}`;
const PASS = "Engineer@2026";
const mk = await post(admin.cookie, "create_user", { username: uname, fullName: `KS probe D12 ${stamp}`, email: `${uname}@test.local`, employeeCode: `NV-PD12-${stamp}`, role: "da_nv", password: PASS, projectIds: [] });
check("Tạo nhân viên kiểm thử (da_nv)", [200, 201].includes(mk.status), `HTTP ${mk.status}${mk.json?.error ? " · " + mk.json.error : ""}`);
const staff = await login(uname, PASS);
check("Đăng nhập được bằng NHÂN VIÊN", staff.ok, "HTTP " + staff.status);
if (!staff.ok) { console.log("⛔ dừng"); process.exit(1); }

const users = (await boot(admin.cookie)).users || [];
const staffUser = users.find((u) => u.username === uname);
check("Tìm được id nhân viên trong dữ liệu bootstrap", Boolean(staffUser), staffUser?.id || "?");

// ⭐ BƯỚC 2 — admin GIAO VIỆC cho nhân viên (để `assigned_by` = admin ≠ người nhận)
const title = `[PROBE D12] việc kiểm chứng ${stamp}`;
const mkTask = await post(admin.cookie, "create_work_item", { departmentCode: "DA", title, assignedTo: staffUser?.id, priority: "normal", description: "probe BUG-D12" });
check("Admin GIAO được việc cho nhân viên", mkTask.status === 200, `HTTP ${mkTask.status}${mkTask.json?.error ? " · " + mkTask.json.error : ""}`);

// tìm task
const wi = ((await boot(admin.cookie)).workItems || []).find((r) => r.title === title);
check("Tìm được việc vừa giao", Boolean(wi), wi?.taskNo || "?");
if (!wi) { console.log("⛔ dừng (không tìm thấy việc)"); process.exit(1); }

// ⭐ BƯỚC 3 — NHÂN VIÊN cập nhật % (ĐÂY LÀ ĐƯỜNG SERVER CỦA «Ô NHẬP %» — VIỆC 3)
const prog = await post(staff.cookie, "update_work_item_progress", { workItemId: wi.id, progress: 45 });
check("★ NHÂN VIÊN cập nhật % = 45 (ô nhập % chạy thật)", prog.status === 200, `HTTP ${prog.status}${prog.json?.error ? " · " + prog.json.error : ""}`);
const afterProg = ((await boot(admin.cookie)).workItems || []).find((r) => r.id === wi.id);
check("★ CSDL ghi đúng 45% + tự chuyển IN_PROGRESS", Number(afterProg?.progress) === 45 && afterProg?.status === "IN_PROGRESS", `progress=${afterProg?.progress} · status=${afterProg?.status}`);

// ⭐ BƯỚC 4 — NHÂN VIÊN gửi kiểm tra (SUBMITTED)
const sub = await post(staff.cookie, "update_work_item_status", { workItemId: wi.id, status: "SUBMITTED" });
check("Nhân viên GỬI KIỂM TRA (SUBMITTED)", sub.status === 200, `HTTP ${sub.status}${sub.json?.error ? " · " + sub.json.error : ""}`);

// ⭐ BƯỚC 5 — ADMIN «Duyệt xong» (COMPLETED) ⇒ phải phát thông báo cho NGƯỜI GIAO (admin) — `BUG-D12`
const comp = await post(admin.cookie, "update_work_item_status", { workItemId: wi.id, status: "COMPLETED" });
check("Admin xác nhận HOÀN THÀNH (COMPLETED)", comp.status === 200, `HTTP ${comp.status}${comp.json?.error ? " · " + comp.json.error : ""}`);

// ⭐ BƯỚC 6 — ĐỐI CHIẾU TRÊN DỮ LIỆU UI: `taskNotifications` của ADMIN phải có hàng «Công việc đã hoàn thành»
const adminNotes = (await boot(admin.cookie)).taskNotifications || [];
const hit = adminNotes.find((n) => String(n.workItemId) === String(wi.id) && /hoàn thành/i.test(String(n.title)));
check("★★ `BUG-D12`: NGƯỜI GIAO (admin) NHẬN ĐƯỢC thông báo «Công việc đã hoàn thành»", Boolean(hit), hit ? `“${hit.title}” · body: ${hit.body}` : `có ${adminNotes.length} thông báo, ⛔ không có hàng cho việc này`);

// ⭐ BƯỚC 7 — 6b: NHÂN VIÊN phải có thông báo «Công việc mới»
const staffNotes = (await boot(staff.cookie)).taskNotifications || [];
check("`6b`: NHÂN VIÊN nhận được thông báo «Công việc mới» khi được giao", staffNotes.some((n) => String(n.workItemId) === String(wi.id) && /Công việc mới/i.test(String(n.title))), `có ${staffNotes.length} thông báo của nhân viên`);

console.log("═".repeat(78));
console.log(`  KẾT QUẢ: ${results.filter((r) => r.ok).length}/${results.length} ĐẠT  ·  đường phục vụ: ${servedBy}`);
console.log(`  ⚠️ Nhân viên kiểm thử đã tạo: ${uname} (role da_nv) — CẦN DỌN sau khi xong.`);
