// Kiểm chứng LÚC CHẠY cho TASK-042 — action `retry_email`.
//
// LỖI ĐÃ SỬA: `SystemSettingsStoreAdapter.retryEmailQueue` chạy
//   SELECT COUNT(*) FROM email_queue WHERE status='pending'
// nhưng lược đồ ĐANG CHẠY **không có bảng `email_queue`** (bảng thật là `email_outbox`)
// ⇒ action trả **HTTP 500** (đã xác nhận bằng cách gọi thật TRƯỚC khi sửa).
// Ngoài ra Java hiểu SAI nghiệp vụ: JS `system-route.mjs:1630-1636` **xếp lại MỘT email theo `emailId`**
//   UPDATE email_outbox SET status='queued',next_attempt_at=?,last_error=NULL,updated_at=? WHERE id=?
// và trả *"Đã xếp lại email để máy chủ gửi."* — không hề đếm.
//
// AN TOÀN: dùng một dòng `email_outbox` TẠM (mã ZZP42) do script tự tạo và tự xoá ở `finally`.
// MySQL CLI phải có `--default-character-set=utf8mb4` (xem bài học ở TASK-041 phần 3).
//
// Chạy: node tools/probe-task042-retry-email.mjs [base]
import { execFileSync } from "node:child_process";

const BASE = process.argv[2] || "http://127.0.0.1:18081";
const MYSQL = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
const mysql = (sql) => execFileSync(MYSQL, ["-uvntech", "-pvntech", "-D", "vntech_erp",
  "--default-character-set=utf8mb4", "--batch", "--raw", "--skip-column-names", "-e", sql],
  { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();

const results = [];
const check = (name, ok, detail) => {
  results.push({ name, ok, detail });
  console.log(`  ${ok ? "ĐẠT" : "HỎNG"}  ${name}${detail ? " — " + detail : ""}`);
};

const login = await fetch(`${BASE}/api/system`, {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ action: "login", username: "admin", password: "Admin123456@" }),
});
if (!login.ok) { console.error(`Đăng nhập lỗi HTTP ${login.status}`); process.exit(1); }
const cookie = (login.headers.getSetCookie?.() ?? [login.headers.get("set-cookie")])
  .filter(Boolean).map((c) => c.split(";")[0]).join("; ");
console.log(`Đăng nhập OK (${BASE})\n`);

async function call(payload = {}) {
  const res = await fetch(`${BASE}/api/system`, {
    method: "POST", headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ action: "retry_email", ...payload }),
  });
  let body = {};
  try { body = await res.json(); } catch { /* bỏ qua */ }
  return { status: res.status, message: String(body.message ?? ""), error: String(body.error ?? ""), raw: JSON.stringify(body).slice(0, 200) };
}

const EMAIL_ID = "EMAIL_ZZP42";
const countRows = () => mysql(`SELECT COUNT(*) FROM email_outbox`);
const before = countRows();
console.log(`TRƯỚC: email_outbox có ${before} dòng\n`);

let cleaned = false;
const cleanup = () => { if (cleaned) return; mysql(`DELETE FROM email_outbox WHERE id='${EMAIL_ID}'`); cleaned = true; };

try {
  // ---- A: dòng tạm ở trạng thái failed có last_error ⇒ xếp lại phải đổi về queued và xoá lỗi ----
  console.log("--- 1) Xếp lại một email THẬT (dòng tạm) ---");
  mysql(`INSERT INTO email_outbox (id,request_id,stage,event,recipients,subject,text_body,html_body,status,
                                   attempt_count,next_attempt_at,queued_at,sent_at,last_error,created_at,updated_at)
         VALUES ('${EMAIL_ID}',NULL,1,'APPROVAL_NEEDED','a@b.c','Chủ đề tạm','text','<p>html</p>','failed',
                 3,NOW(3),NOW(3),NULL,'Lỗi thử tạm',NOW(3),NOW(3))`);
  console.log(`  dòng tạm trước khi gọi: ${mysql(`SELECT CONCAT(status,'|',IFNULL(last_error,''),'|',attempt_count) FROM email_outbox WHERE id='${EMAIL_ID}'`)}`);

  const r1 = await call({ emailId: EMAIL_ID });
  console.log(`  HTTP ${r1.status}  ${r1.message || r1.error}`);
  check("A. retry_email KHÔNG còn 500", r1.status !== 500, `HTTP ${r1.status} ${r1.raw}`);
  check("A. trả 200 + thông điệp NGUYÊN VĂN JS",
    r1.status === 200 && r1.message === "Đã xếp lại email để máy chủ gửi.", `HTTP ${r1.status} "${r1.message}"`);

  const afterRow = mysql(`SELECT CONCAT(status,'|',IFNULL(last_error,'NULL'),'|',attempt_count,'|',(next_attempt_at IS NOT NULL)) FROM email_outbox WHERE id='${EMAIL_ID}'`);
  console.log(`  dòng tạm sau khi gọi:    ${afterRow}`);
  const [status, lastError, , hasNext] = afterRow.split("|");
  check("A. status đổi thành 'queued'", status === "queued", status);
  check("A. last_error được XOÁ về NULL", lastError === "NULL", lastError);
  check("A. next_attempt_at được đặt", hasNext === "1", hasNext);
  check("A. attempt_count KHÔNG bị đổi (JS không đụng cột này)", afterRow.split("|")[2] === "3", afterRow.split("|")[2]);

  // ---- B: id không tồn tại — JS KHÔNG kiểm tồn tại, UPDATE 0 dòng nhưng vẫn trả thông điệp ----
  console.log("\n--- 2) id không tồn tại (JS không kiểm tồn tại) ---");
  const r2 = await call({ emailId: "EMAIL_KHONG_TON_TAI" });
  check("B. vẫn trả 200 + cùng thông điệp như JS",
    r2.status === 200 && r2.message === "Đã xếp lại email để máy chủ gửi.", `HTTP ${r2.status} "${r2.message}"`);

  // ---- C: thiếu emailId ⇒ JS vẫn chạy UPDATE với chuỗi rỗng (0 dòng) ----
  console.log("\n--- 3) thiếu emailId ---");
  const r3 = await call({});
  check("C. không ném lỗi, trả 200 như JS", r3.status === 200, `HTTP ${r3.status} ${r3.raw}`);
} finally {
  cleanup();
  const after = countRows();
  check("dọn sạch: số dòng email_outbox về đúng ban đầu", after === before, `${before} -> ${after}`);
}

console.log("\n=== KẾT QUẢ ===");
const ok = results.every((r) => r.ok);
console.log(`${results.filter((r) => r.ok).length}/${results.length} mục ĐẠT`);
process.exitCode = ok ? 0 : 1;
