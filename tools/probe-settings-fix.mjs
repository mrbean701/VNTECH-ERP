// Kiểm chứng LÚC CHẠY cho bản vá TASK-039 (2 lỗi HTTP 500 của action admin).
//
// VÌ SAO CẦN: log Java cho thấy `save_ui_display_settings` và `save_trust_development_settings` ném 500
// do SQL lệch lược đồ. Biên dịch sạch KHÔNG chứng minh SQL đúng — phải gọi thật và đọc phản hồi.
// (Đúng bài học của TASK-025: "biên dịch thành công không chứng minh SQL đúng".)
//
// AN TOÀN DỮ LIỆU: đây là 2 action GHI cấu hình. Để không đổi giao diện/cấu hình thật, script:
//   1. ĐỌC giá trị hiện tại trước (từ bootstrap)
//   2. GHI LẠI ĐÚNG giá trị đó (với `ui_display_settings`), và gọi trust với licenseServerUrl rỗng
//      (trạng thái đang có sẵn là development/enforcement=0/attestation=0/url=null)
//   ⇒ chứng minh được đường ghi mà không thay đổi cấu hình.
//
// Chạy: node tools/probe-settings-fix.mjs [base]
const BASE = process.argv[2] || "http://127.0.0.1:9000";

const login = await fetch(`${BASE}/api/system`, {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ action: "login", username: "admin", password: "Admin123456@" }),
});
if (!login.ok) { console.error(`Đăng nhập lỗi HTTP ${login.status}`); process.exit(1); }
const cookie = (login.headers.getSetCookie?.() ?? [login.headers.get("set-cookie")])
  .filter(Boolean).map((c) => c.split(";")[0]).join("; ");

const boot = await (await fetch(`${BASE}/api/system`, { headers: { cookie } })).json();
const current = boot.data?.uiDisplaySettings ?? null;
console.log(`uiDisplaySettings hiện tại: ${current ? JSON.stringify(current).slice(0, 200) : "(null)"}`);
console.log(`trustStatus hiện tại      : ${JSON.stringify(boot.data?.trustStatus?.trustSettings ?? null)}\n`);

async function call(action, payload = {}) {
  const res = await fetch(`${BASE}/api/system`, {
    method: "POST", headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ action, ...payload }),
  });
  let body = {};
  try { body = await res.json(); } catch { /* bỏ qua */ }
  return { status: res.status, message: String(body.message ?? ""), error: String(body.error ?? "") };
}

const results = [];
const check = (name, ok, detail) => { results.push({ name, ok, detail }); };

// --- 1) save_ui_display_settings — ghi LẠI đúng giá trị đang có (không đổi giao diện)
const keep = {
  theme: current?.theme ?? "light",
  primaryColor: current?.primaryColor ?? "",
  language: current?.language ?? "vi",
  dateFormat: current?.dateFormat ?? "DD/MM/YYYY",
  companyName: current?.companyName ?? "",
  logoUrl: current?.logoUrl ?? "",
};
const ui = await call("save_ui_display_settings", keep);
console.log(`save_ui_display_settings   -> HTTP ${ui.status}  ${ui.message || ui.error}`);
check("save_ui_display_settings KHÔNG còn 500", ui.status !== 500, `HTTP ${ui.status} ${ui.error}`);
check("save_ui_display_settings trả 200", ui.status === 200, `HTTP ${ui.status}`);
check("save_ui_display_settings giữ nguyên thông điệp",
  ui.message === "Đã lưu giao diện hiển thị.", ui.message);

// gọi LẦN HAI để chứng minh nhánh ON DUPLICATE KEY UPDATE chạy được (upsert thật)
const ui2 = await call("save_ui_display_settings", keep);
console.log(`save_ui_display_settings #2 -> HTTP ${ui2.status}  ${ui2.message || ui2.error}`);
check("save_ui_display_settings gọi lần 2 vẫn 200 (upsert chạy được)", ui2.status === 200, `HTTP ${ui2.status}`);

// --- 2) save_trust_development_settings — giữ nguyên trạng thái đang có
const trust = await call("save_trust_development_settings", { licenseServerUrl: "" });
console.log(`save_trust_development_settings -> HTTP ${trust.status}  ${trust.message || trust.error}`);
check("save_trust_development_settings KHÔNG còn 500", trust.status !== 500, `HTTP ${trust.status} ${trust.error}`);
check("save_trust_development_settings trả 200", trust.status === 200, `HTTP ${trust.status}`);
check("trust giữ nguyên văn thông điệp của JS",
  trust.message === "Đã lưu cấu hình nền; License Enforcement và Online Attestation vẫn tắt theo thiết kế.",
  trust.message);

// --- 3) hai phép kiểm nghiệp vụ port từ JS phải THẬT SỰ chặn
const enforcement = await call("save_trust_development_settings", { enforcementEnabled: true });
console.log(`  · cố bật enforcementEnabled -> HTTP ${enforcement.status}  ${enforcement.error}`);
check("chặn bật Production Enforcement", enforcement.status === 400 && /Development Mode/.test(enforcement.error),
  `HTTP ${enforcement.status} ${enforcement.error}`);

const badUrl = await call("save_trust_development_settings", { licenseServerUrl: "http://khong-https.local" });
console.log(`  · URL http:// (không HTTPS) -> HTTP ${badUrl.status}  ${badUrl.error}`);
check("bắt buộc HTTPS cho License Server URL", badUrl.status === 400 && /HTTPS/.test(badUrl.error),
  `HTTP ${badUrl.status} ${badUrl.error}`);

// --- 4) đọc lại sau khi ghi
const boot2 = await (await fetch(`${BASE}/api/system`, { headers: { cookie } })).json();
check("đọc lại được uiDisplaySettings sau khi ghi", Boolean(boot2.data?.uiDisplaySettings),
  JSON.stringify(boot2.data?.uiDisplaySettings ?? null).slice(0, 120));

console.log("\n=== KẾT QUẢ ===");
let ok = true;
for (const r of results) { console.log(`  ${r.ok ? "ĐẠT" : "HỎNG"}  ${r.name}${r.detail && !r.ok ? " — " + r.detail : ""}`); if (!r.ok) ok = false; }
console.log(ok ? "\nKẾT LUẬN: cả hai action đã hết 500 và hai phép kiểm nghiệp vụ của JS hoạt động ✅"
  : "\nKẾT LUẬN: còn mục KHÔNG ĐẠT ⚠");
process.exitCode = ok ? 0 : 1;
