// Kiểm chốt CUỐI của TASK-041: "Hệ thống phải có ít nhất một bước phê duyệt đang hoạt động."
//
// VÌ SAO PHẢI LÀM RIÊNG: chốt này chỉ kích hoạt khi số bước đang hoạt động = 1 và ta tắt nốt bước đó.
// Không thể chạm tới bằng probe thường vì bước 1 (bước duy nhất có hồ sơ chờ) bị chốt "đang có hồ sơ chờ"
// chặn TRƯỚC. Nên phải tạm tắt các bước 1–4 bằng SQL, để bước 5 thành bước hoạt động CUỐI CÙNG, rồi gọi API.
//
// ⚠ AN TOÀN: script này SỬA cấu hình thật trong lúc chạy và KHÔI PHỤC ngay sau đó. Bắt buộc đã có
// `tools/_backup-task041.sql`. Nếu script chết giữa đường, chạy lại nó — nó luôn khôi phục ở cuối.
//
// Chạy: node tools/probe-task041-last-stage.mjs [base]   (mặc định http://127.0.0.1:18081)
import { execFileSync } from "node:child_process";

const BASE = process.argv[2] || "http://127.0.0.1:18081";
const MYSQL = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
const mysql = (sql) => execFileSync(MYSQL, ["-uvntech", "-pvntech", "-D", "vntech_erp", "--batch", "--raw",
  "--skip-column-names", "-e", sql], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();

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
async function call(action, payload = {}) {
  const res = await fetch(`${BASE}/api/system`, {
    method: "POST", headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ action, ...payload }),
  });
  let body = {};
  try { body = await res.json(); } catch { /* bỏ qua */ }
  return { status: res.status, message: String(body.message ?? ""), error: String(body.error ?? "") };
}

const activeBefore = mysql("SELECT GROUP_CONCAT(CONCAT(stage_no,':',active) ORDER BY stage_no) FROM approval_stage_catalog");
console.log(`Trạng thái trước: ${activeBefore}\n`);

let restored = false;
const restore = () => {
  if (restored) return;
  mysql("UPDATE approval_stage_catalog SET active=1 WHERE stage_no BETWEEN 1 AND 4");
  restored = true;
  console.log(`\n↩ Đã khôi phục: ${mysql("SELECT GROUP_CONCAT(CONCAT(stage_no,':',active) ORDER BY stage_no) FROM approval_stage_catalog")}`);
};

try {
  console.log("--- Tạm tắt bước 1–4 để bước 5 thành bước hoạt động CUỐI CÙNG ---");
  mysql("UPDATE approval_stage_catalog SET active=0 WHERE stage_no BETWEEN 1 AND 4");
  const activeNow = mysql("SELECT COUNT(*) FROM approval_stage_catalog WHERE active=1");
  console.log(`  số bước đang hoạt động: ${activeNow}`);
  check("dựng được kịch bản: đúng 1 bước hoạt động", activeNow === "1", activeNow);

  const stage5 = mysql("SELECT id FROM approval_stage_catalog WHERE stage_no=5");
  const pending5 = mysql(`SELECT COUNT(*) FROM approvals a JOIN material_requests mr ON mr.id=a.request_id
      WHERE a.stage=5 AND a.status='pending' AND mr.status='pending_approval' AND mr.approval_stage=a.stage`);
  check("bước 5 KHÔNG có hồ sơ chờ (để chốt 'hồ sơ chờ' không che chốt cuối)", pending5 === "0", pending5);

  console.log("\n--- Gọi API tắt bước CUỐI CÙNG ---");
  const off = await call("set_approval_stage_status", { stageId: stage5, active: 0 });
  console.log(`  HTTP ${off.status}  ${off.error || off.message}`);
  check("chặn đúng nguyên văn JS",
    off.status === 400 && off.error === "Hệ thống phải có ít nhất một bước phê duyệt đang hoạt động.",
    `HTTP ${off.status} "${off.error}"`);
  const activeAfter = mysql("SELECT active FROM approval_stage_catalog WHERE stage_no=5");
  check("bước 5 được BẬT LẠI tự động (đúng như JS)", activeAfter === "1", activeAfter);
  const activeCount = mysql("SELECT COUNT(*) FROM approval_stage_catalog WHERE active=1");
  check("luôn còn ít nhất 1 bước hoạt động", Number(activeCount) >= 1, activeCount);
} finally {
  restore();
}

const activeFinal = mysql("SELECT GROUP_CONCAT(CONCAT(stage_no,':',active) ORDER BY stage_no) FROM approval_stage_catalog");
check("trạng thái cuối = trạng thái đầu", activeFinal === activeBefore, `${activeBefore}  →  ${activeFinal}`);
check("không còn bước tạm nào (stage_no=900)",
  mysql("SELECT COUNT(*) FROM approval_stage_catalog WHERE stage_no=900") === "0");

console.log("\n=== KẾT QUẢ ===");
const ok = results.every((r) => r.ok);
console.log(`${results.filter((r) => r.ok).length}/${results.length} mục ĐẠT`);
process.exitCode = ok ? 0 : 1;
