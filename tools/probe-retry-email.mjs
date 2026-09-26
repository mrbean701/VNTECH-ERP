// Gọi thật action `retry_email` để xem kết quả HTTP.
//
// VÌ SAO: `SystemSettingsStoreAdapter.retryEmailQueue` chạy
//   SELECT COUNT(*) FROM email_queue WHERE status='pending'
// nhưng lược đồ ĐANG CHẠY **không có bảng `email_queue`** (bảng thật là `email_outbox`)
// ⇒ nhiều khả năng action ném lỗi SQL. Phải gọi thật để có bằng chứng, không suy đoán.
//
// Chạy: node tools/probe-retry-email.mjs [base]
const BASE = process.argv[2] || "http://127.0.0.1:18081";

const login = await fetch(`${BASE}/api/system`, {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ action: "login", username: "admin", password: "Admin123456@" }),
});
if (!login.ok) { console.error(`Đăng nhập lỗi HTTP ${login.status}`); process.exit(1); }
const cookie = (login.headers.getSetCookie?.() ?? [login.headers.get("set-cookie")])
  .filter(Boolean).map((c) => c.split(";")[0]).join("; ");
console.log(`Đăng nhập OK (${BASE})\n`);

const res = await fetch(`${BASE}/api/system`, {
  method: "POST", headers: { "content-type": "application/json", cookie },
  body: JSON.stringify({ action: "retry_email" }),
});
const text = await res.text();
console.log(`retry_email -> HTTP ${res.status}`);
console.log(text.slice(0, 600));

const isSqlError = /doesn't exist|Unknown table|SQLSyntaxError|BadSqlGrammar/i.test(text);
console.log("");
if (res.status >= 500 || isSqlError) {
  console.log("KẾT LUẬN: action LỖI (bảng `email_queue` không tồn tại) ❌");
  process.exitCode = 1;
} else {
  console.log("KẾT LUẬN: action chạy được — KHÔNG xác nhận được giả thuyết lỗi bảng.");
  process.exitCode = 0;
}
