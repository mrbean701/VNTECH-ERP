// GĐ4 — KIỂM TRA PHÂN QUYỀN bằng USER THƯỜNG (không phải admin).
//
// Vì sao bắt buộc: bài học đã kiểm chứng — MỌI test/smoke chạy bằng admin sẽ CHE lỗi
// phân quyền (từng lộ 4/5 action cho role engineer vì requireActionModule bị bỏ quên).
//
// Khẳng định 2 chiều:
//   1. create_self_work_item  → user thường PHẢI gọi được (tự tạo việc cho mình)
//   2. create_work_item       → user thường PHẢI BỊ CHẶN (chỉ Trưởng phòng/Admin)
//
//   node tools/probe-work-permission.mjs [base] [adminUser] [adminPass]
const BASE = process.argv[2] || "http://127.0.0.1:9000";
const ADMIN = process.argv[3] || "admin";
const ADMIN_PASS = process.argv[4] || "Admin123456@";

const results = [];
const check = (name, ok, detail) => {
  results.push({ name, ok: Boolean(ok) });
  console.log(`  ${ok ? "✅" : "❌"} ${name}${detail ? " — " + detail : ""}`);
};
const login = async (u, p) => {
  const r = await fetch(BASE + "/api/system", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "login", username: u, password: p }),
  });
  const cookie = (r.headers.getSetCookie?.() || []).map((c) => c.split(";")[0]).join("; ");
  return { ok: r.status === 200, cookie, status: r.status };
};
const post = async (cookie, action, payload = {}) => {
  const r = await fetch(BASE + "/api/system", {
    method: "POST", headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ action, ...payload }),
  });
  let j = null; try { j = await r.json(); } catch {}
  return { status: r.status, json: j };
};

console.log("═".repeat(74));
console.log("  GĐ4 — PHÂN QUYỀN CÔNG VIỆC (kiểm tra bằng USER THƯỜNG)");
console.log("═".repeat(74));

const admin = await login(ADMIN, ADMIN_PASS);
check("Đăng nhập admin", admin.ok, "HTTP " + admin.status);
if (!admin.ok) process.exit(1);

// Tạo (hoặc dùng lại) một user thường role engineer
const stamp = Date.now().toString().slice(-6);
const uname = `probe_gd4_${stamp}`;
const STAFF_PASS = "Engineer@2026";
const mk = await post(admin.cookie, "create_user", {
  username: uname, fullName: `KS kiểm chứng GĐ4 ${stamp}`, email: `${uname}@test.local`,
  employeeCode: `NV-GD4-${stamp}`, role: "engineer", password: STAFF_PASS, projectIds: [],
});
check("Tạo được user thường (engineer)", mk.status === 200 || mk.status === 201,
  `HTTP ${mk.status}${mk.json?.error ? " · " + mk.json.error : ""}`);

const staff = await login(uname, STAFF_PASS);
check("Đăng nhập được bằng user thường", staff.ok, "HTTP " + staff.status);

if (staff.ok) {
  // 1) TỰ TẠO VIỆC — phải THÀNH CÔNG
  const selfTask = await post(staff.cookie, "create_self_work_item", {
    title: `[PROBE GD4 PERM] việc tự tạo ${stamp}`, priority: "normal",
  });
  check("user thường TỰ TẠO được việc cho mình", selfTask.status === 200,
    `HTTP ${selfTask.status}${selfTask.json?.error ? " · " + selfTask.json.error : ""}`);

  // 2) GIAO VIỆC CHO NGƯỜI KHÁC — phải BỊ CHẶN
  const assign = await post(staff.cookie, "create_work_item", {
    departmentCode: "KH", title: `[PROBE GD4 PERM] giao việc ${stamp}`,
  });
  const blocked = assign.status !== 200;
  check("user thường BỊ CHẶN khi giao việc cho người khác", blocked,
    `HTTP ${assign.status}${assign.json?.error ? " · " + assign.json.error : ""}`);

  // 3) Xác nhận việc tự tạo thuộc về chính họ
  const boot = await (await fetch(BASE + "/api/system", { headers: { cookie: staff.cookie } })).json();
  const mine = (boot.data?.workItems || []).filter((r) => /\[PROBE GD4 PERM\] việc tự tạo/.test(String(r.title || "")));
  check("Việc tự tạo hiện trong bootstrap của CHÍNH họ", mine.length > 0, `${mine.length} việc`);
  check("Việc tự tạo gán đúng người tạo", String(mine[0]?.assigneeUserId || "") === String(boot.data?.user?.id || ""),
    mine[0]?.assigneeName);

  // 4) Việc cá nhân KHÔNG lẫn vào phòng ban (departmentCode = CN)
  check("Mã phòng của việc cá nhân là CN", String(mine[0]?.departmentCode || "") === "CN", mine[0]?.departmentCode);
}

// Dọn dẹp
const { spawnSync } = await import("node:child_process");
const mysql = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
const sql = `DELETE FROM work_items WHERE title LIKE '[PROBE GD4 PERM]%'; DELETE FROM users WHERE username LIKE 'probe_gd4_%';`;
const cleanup = spawnSync(mysql, ["--default-character-set=utf8mb4", "-uvntech", "-pvntech", "vntech_erp", "-e", sql], { encoding: "utf8" });
console.log("\n▸ Dọn dẹp: exit=" + cleanup.status);

console.log("\n" + "═".repeat(74));
const failed = results.filter((r) => !r.ok);
console.log(`KẾT LUẬN: ${failed.length === 0 ? "ĐẠT ✅" : failed.length + " MỤC KHÔNG ĐẠT ❌"}`);
console.log("═".repeat(74));
process.exit(failed.length === 0 ? 0 : 2);
