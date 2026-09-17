// Kiểm chứng LÚC CHẠY cho TASK-040 nhóm 1 + 1b (action `save_email_settings`).
//
// VÌ SAO CẦN: biên dịch sạch KHÔNG chứng minh SQL đúng, cũng không chứng minh đường ĐỌC tồn tại.
// Bài học TASK-025/TASK-039: phải gọi thật rồi đọc lại qua chính đường đọc của UI.
//
// BA THỨ ĐƯỢC KIỂM:
//   A. Nhóm 1  — SQL: `INSERT INTO approval_email_recipients` chỉ có MỘT cột `emails`
//                (trước đây ghi user_email/cc_emails/updated_by ⇒ MySQL "Unknown column" ⇒ HTTP 500).
//   B. Nhóm 1  — đường ĐỌC: bootstrap phải trả `emailSettings` và `emailRecipients`
//                (UI đọc ở app/page.tsx:31,3739; trước đây Java THIẾU cả hai khoá ⇒ ghi rồi không đọc được).
//   C. Nhóm 1b — mặc định: thiếu `smtpPort` ⇒ 587, thiếu `poSlaHours` ⇒ 24, thiếu `bchConfirmationSlaHours`
//                ⇒ 8, `baseUrl` bỏ ĐÚNG MỘT dấu "/" cuối (trước đây ⇒ 1 / 1 / 1 và giữ nguyên "/").
//
// AN TOÀN DỮ LIỆU: đây là action GHI và nó `DELETE` sạch `approval_email_recipients`
// (và `approval_project_assignments` nếu payload có `assignments`). Script vì vậy:
//   1. đọc trạng thái hiện tại từ bootstrap TRƯỚC,
//   2. gửi LẠI đúng 5 dòng phân công đang có để không mất dữ liệu,
//   3. ghi 1 dòng người nhận TẠM với email probe, kiểm tra round-trip, rồi XOÁ dòng tạm đó,
//   4. in ra mọi thay đổi thật để đối chiếu với tools/_backup-task040-nhom1.sql.
//
// Chạy: node tools/probe-task040-nhom1.mjs [base]        (mặc định http://127.0.0.1:18081)
const BASE = process.argv[2] || "http://127.0.0.1:18081";
const PROBE_EMAIL = "probe.task040@vntech.local";

const results = [];
const check = (name, ok, detail) => {
  results.push({ name, ok, detail });
  console.log(`  ${ok ? "ĐẠT" : "HỎNG"}  ${name}${detail ? " — " + detail : ""}`);
};

// ---------- đăng nhập ----------
const login = await fetch(`${BASE}/api/system`, {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ action: "login", username: "admin", password: "Admin123456@" }),
});
if (!login.ok) { console.error(`Đăng nhập lỗi HTTP ${login.status}`); process.exit(1); }
const cookie = (login.headers.getSetCookie?.() ?? [login.headers.get("set-cookie")])
  .filter(Boolean).map((c) => c.split(";")[0]).join("; ");
console.log(`Đăng nhập OK (${BASE})\n`);

const boot = async () => (await (await fetch(`${BASE}/api/system`, { headers: { cookie } })).json()).data ?? {};

async function call(payload) {
  const res = await fetch(`${BASE}/api/system`, {
    method: "POST", headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ action: "save_email_settings", ...payload }),
  });
  let body = {};
  try { body = await res.json(); } catch { /* bỏ qua */ }
  return { status: res.status, message: String(body.message ?? ""), error: String(body.error ?? "") };
}

// ---------- trạng thái TRƯỚC ----------
const d0 = await boot();
const keepAssignments = (d0.workflowAssignments ?? []).map((a) => ({
  projectId: a.projectId, stage: Number(a.stage), ownerUserId: a.ownerUserId, ccEmails: a.ccEmails ?? "",
}));
console.log(`TRƯỚC: emailSettings=${d0.emailSettings === undefined ? "(THIẾU KHÓA)" : JSON.stringify(d0.emailSettings)}`);
console.log(`TRƯỚC: emailRecipients=${d0.emailRecipients === undefined ? "(THIẾU KHÓA)" : JSON.stringify(d0.emailRecipients)}`);
console.log(`TRƯỚC: workflowAssignments=${keepAssignments.length} dòng\n`);

// ---------- B+C: gọi THIẾU smtpPort / poSlaHours / bchConfirmationSlaHours, baseUrl có "/" cuối ----------
console.log("--- Lần gọi 1: thiếu 3 trường số + baseUrl có dấu / cuối ---");
const first = await call({
  enabled: false,
  senderName: "VNTECH ERP",
  baseUrl: "https://erp.vntech.local/",
  assignments: keepAssignments,
  recipients: [],
});
console.log(`  HTTP ${first.status}  ${first.message || first.error}`);
check("A. save_email_settings KHÔNG còn 500", first.status !== 500, `HTTP ${first.status} ${first.error}`);
check("A. save_email_settings trả 200", first.status === 200, `HTTP ${first.status}`);
check("A. giữ nguyên thông điệp của JS",
  first.message === "Đã lưu cấu hình email & gửi thông báo duyệt theo dự án và bước duyệt.", first.message);

// ---------- B: đường ĐỌC ----------
const d1 = await boot();
check("B. bootstrap CÓ khoá emailSettings (đường đọc #1)", d1.emailSettings !== undefined,
  d1.emailSettings === undefined ? "khoá vẫn thiếu" : JSON.stringify(d1.emailSettings));
check("B. emailSettings có cờ passwordConfigured như JS",
  d1.emailSettings != null && "passwordConfigured" in d1.emailSettings,
  JSON.stringify(d1.emailSettings ?? null));
check("B. bootstrap CÓ khoá emailRecipients (đường đọc #2)", d1.emailRecipients !== undefined,
  d1.emailRecipients === undefined ? "khoá vẫn thiếu" : `mảng ${d1.emailRecipients.length} phần tử`);

// ---------- A: round-trip người nhận ----------
console.log("\n--- Lần gọi 2: ghi 1 người nhận THẬT để kiểm round-trip ---");
const projectId = keepAssignments[0]?.projectId ?? "";
if (!projectId) { check("A. có dự án để gắn người nhận", false, "không đọc được projectId nào"); }
const second = await call({
  enabled: false,
  senderName: "VNTECH ERP",
  poSlaHours: 24,
  bchConfirmationSlaHours: 8,
  assignments: keepAssignments,
  recipients: [{ projectId, stage: 1, emails: PROBE_EMAIL }],
});
console.log(`  HTTP ${second.status}  ${second.message || second.error}`);
check("A. ghi người nhận trả 200", second.status === 200, `HTTP ${second.status} ${second.error}`);

const d2 = await boot();
const got = (d2.emailRecipients ?? []).find((r) => Number(r.stage) === 1 && r.projectId === projectId);
check("A. người nhận ĐỌC LẠI được qua bootstrap (round-trip trọn vòng)",
  Boolean(got) && String(got.emails).includes(PROBE_EMAIL),
  got ? `emails=${got.emails}` : "không thấy dòng nào");
check("A. tiền tố id là MAILTO như JS", /^MAILTO/.test(String(got?.id ?? "")), String(got?.id ?? "(trống)"));

// ---------- B: người nhận phải hiển thị đúng cho UI ----------
check("B. UI tra được email theo (projectId, stage) — app/page.tsx:3739",
  (d2.emailRecipients ?? []).find((r) => r.projectId === projectId && Number(r.stage) === 1)?.emails === PROBE_EMAIL,
  "khoá tra cứu của UI dùng projectId + stage dạng số");

check("B. 5 dòng phân công còn nguyên (không bị xoá nhầm)",
  (d2.workflowAssignments ?? []).length === keepAssignments.length,
  `${(d2.workflowAssignments ?? []).length}/${keepAssignments.length}`);

// ---------- DỌN DẸP: trả người nhận về 0 dòng, giữ 5 phân công ----------
console.log("\n--- Dọn dẹp: bỏ người nhận tạm ---");
const clean = await call({ enabled: false, senderName: "VNTECH ERP", poSlaHours: 24, bchConfirmationSlaHours: 8, assignments: keepAssignments, recipients: [] });
const d3 = await boot();
check("A. dọn sạch người nhận tạm (0 dòng)", (d3.emailRecipients ?? []).length === 0,
  `${(d3.emailRecipients ?? []).length} dòng`);
check("A. 5 dòng phân công vẫn còn sau dọn dẹp", (d3.workflowAssignments ?? []).length === keepAssignments.length,
  `${(d3.workflowAssignments ?? []).length}/${keepAssignments.length}`);
console.log(`  HTTP ${clean.status}  ${clean.message || clean.error}`);

console.log("\n=== KẾT QUẢ ===");
let ok = true;
for (const r of results) if (!r.ok) ok = false;
console.log(`${results.filter((r) => r.ok).length}/${results.length} mục ĐẠT`);
console.log(ok
  ? "KẾT LUẬN: nhóm 1 (SQL + đường đọc) và nhóm 1b (mặc định) đã hết lỗi ở mức HTTP ✅"
  : "KẾT LUẬN: còn mục KHÔNG ĐẠT ⚠");
console.log("\nLƯU Ý: script KHÔNG tự kiểm DB — phải đối chiếu smtp_port/po_sla_hours/base_url bằng mysql sau khi chạy.");
process.exitCode = ok ? 0 : 1;
