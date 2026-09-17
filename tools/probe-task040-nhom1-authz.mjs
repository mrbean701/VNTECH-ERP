// Kiểm RANH GIỚI PHÂN QUYỀN cho TASK-040 nhóm 1 (GOAL §7: backend là security boundary).
//
// VÌ SAO CẦN: nhóm 1 vừa THÊM hai khoá mới vào bootstrap (`emailSettings`, `emailRecipients`). Thêm khoá
// đọc là thêm bề mặt rò rỉ — phải chứng minh người KHÔNG phải admin không nhận được cấu hình SMTP.
// Đồng thời phải chứng minh action GHI `save_email_settings` thật sự chặn ở backend (không chỉ ẩn nút).
//
// Chạy: node tools/probe-task040-nhom1-authz.mjs [base]
const BASE = process.argv[2] || "http://127.0.0.1:18081";
const NONADMIN = { username: "nvdademo", password: "Vntech@2026" }; // engine role = project (KHÔNG phải admin)

const results = [];
const check = (name, ok, detail) => {
  results.push({ name, ok, detail });
  console.log(`  ${ok ? "ĐẠT" : "HỎNG"}  ${name}${detail ? " — " + detail : ""}`);
};

async function login(u, p) {
  const res = await fetch(`${BASE}/api/system`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "login", username: u, password: p }),
  });
  if (!res.ok) return null;
  return (res.headers.getSetCookie?.() ?? [res.headers.get("set-cookie")])
    .filter(Boolean).map((c) => c.split(";")[0]).join("; ");
}

// ---------- 1) admin ----------
const adminCookie = await login("admin", "Admin123456@");
check("đăng nhập được admin", Boolean(adminCookie));
const adminRaw = await (await fetch(`${BASE}/api/system`, { headers: { cookie: adminCookie } })).text();
const adminBoot = JSON.parse(adminRaw).data ?? {};
check("admin THẤY emailSettings", adminBoot.emailSettings != null, JSON.stringify(adminBoot.emailSettings ?? null));
check("admin THẤY emailRecipients", Array.isArray(adminBoot.emailRecipients), typeof adminBoot.emailRecipients);

// ---------- 2) chống rò rỉ mật khẩu SMTP ----------
// Cột `password` là mật khẩu ứng dụng đã mã hoá — KHÔNG được xuất hiện trong payload bootstrap.
const leakageKeys = ["\"password\"", "\"smtpPassword\"", "\"passwordEnc\""];
const leaked = leakageKeys.filter((k) => adminRaw.includes(k));
check("bootstrap KHÔNG trả trường mật khẩu thô (chỉ cờ passwordConfigured)", leaked.length === 0,
  leaked.length ? `thấy: ${leaked.join(", ")}` : "không thấy khoá mật khẩu nào");
check("bootstrap CÓ cờ passwordConfigured", adminBoot.emailSettings != null && "passwordConfigured" in adminBoot.emailSettings);

// ---------- 3) người KHÔNG phải admin ----------
const userCookie = await login(NONADMIN.username, NONADMIN.password);
check(`đăng nhập được ${NONADMIN.username} (không phải admin)`, Boolean(userCookie));

const resWrite = await fetch(`${BASE}/api/system`, {
  method: "POST", headers: { "content-type": "application/json", cookie: userCookie },
  body: JSON.stringify({ action: "save_email_settings", enabled: false, senderName: "X" }),
});
let bodyWrite = {};
try { bodyWrite = await resWrite.json(); } catch { /* bỏ qua */ }
console.log(`  · ${NONADMIN.username} gọi save_email_settings -> HTTP ${resWrite.status}  ${bodyWrite.error ?? bodyWrite.message ?? ""}`);
check("backend CHẶN ghi cấu hình email khi không phải admin (§7)", resWrite.status !== 200,
  `HTTP ${resWrite.status}`);

const userBoot = (await (await fetch(`${BASE}/api/system`, { headers: { cookie: userCookie } })).json()).data ?? {};
check("emailSettings = null với người không phải admin (không rò rỉ SMTP)",
  userBoot.emailSettings == null, JSON.stringify(userBoot.emailSettings ?? null));
check("emailRecipients = [] với người không phải admin (không rò rỉ người nhận duyệt)",
  Array.isArray(userBoot.emailRecipients) && userBoot.emailRecipients.length === 0,
  JSON.stringify(userBoot.emailRecipients ?? null));

console.log("\n=== KẾT QUẢ ===");
const ok = results.every((r) => r.ok);
console.log(`${results.filter((r) => r.ok).length}/${results.length} mục ĐẠT`);
console.log(ok ? "KẾT LUẬN: ranh giới phân quyền đúng, hai khoá mới không rò rỉ ✅" : "KẾT LUẬN: còn mục KHÔNG ĐẠT ⚠");
process.exitCode = ok ? 0 : 1;
