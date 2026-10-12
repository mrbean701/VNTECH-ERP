// 🔬 NGHIỆM THU **GIAO VIỆC + DUYỆT VIỆC** TRÊN BẢN ĐANG CHẠY — `ERP-SESSION-04` (vòng 86)
//
// MỤC ĐÍCH (đóng `BUG-D18` — «tách `approve_work_item` làm quản lý phòng bị 403»):
//   ① Trưởng phòng DA (`trdademo`) **GIAO ĐƯỢC VIỆC** cho phòng mình (đường Java dùng luật ĐỘNG theo cấp bậc)
//   ② ⭐ CÙNG người đó **DUYỆT ĐƯỢC** việc (`approve_work_item` + `canApprove`) — đây là hồi quy `BUG-D18`
//   ③ ➕ ĐỐI CHỨNG ÂM (bắt buộc): NHÂN VIÊN ⛔ **KHÔNG** duyệt được (phải 403)
//   ④ 🧹 DỌN DỮ LIỆU: chuyển việc thử sang `CANCELLED` (⛔ không để rác trong CSDL thật)
//
//   node docs/dsh-mutil-session/SESSION_D/probes/probe-nghiem-thu-duyet-cong-viec.mjs [base]
const BASE = process.argv[2] || "http://127.0.0.1:9000";
const REUSE_TASK_NO = process.argv[3] || null; // ⭐ dùng lại việc đã tạo ở lần chạy trước (⛔ không tạo rác mới)
const STAMP = Date.now().toString().slice(-6);
const ADMIN = { u: "admin", p: "Admin123456@" };
const HEAD = { u: "trdademo", p: "Vntech@2026" };   // da_truong — CÓ `work.canApprove=1`
const STAFF = { u: "nvkhdemo", p: "Vntech@2026" };  // kh_nv — nhân viên thường
const MYSQL = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
// ⚠️ BÀI HỌC LẦN CHẠY 1 (vòng 86): phản hồi `create_work_item` ⛔ **KHÔNG** trả `id` (chỉ trả `message` có
//   mã việc `CV-DA-…`) ⇒ probe ⛔ **bỏ qua im lặng** 3 bước sau mà vẫn in «ĐẠT» = ⭐ **KẾT LUẬN GIẢ**.
//   ➡️ Sửa 2 lỗi: ① tra `id` từ CSDL theo mã việc (⛔ không đoán) ② **BẮT BUỘC đủ 4 bước**, thiếu ⇒ **ĐỎ**.
import { execFileSync } from "node:child_process";
function sqlOne(query) {
  try { return execFileSync(MYSQL, ["-uvntech", "-pvntech", "--default-character-set=utf8mb4", "-N", "-B", "vntech_erp", "-e", query], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(); }
  catch { return ""; }
}
const idByTaskNo = (taskNo) => {
  if (!taskNo) return null;
  const v = sqlOne(`SELECT id FROM work_items WHERE task_no='${taskNo.replace(/'/g, "")}' LIMIT 1;`);
  // ⚠️ BÀI HỌC LẦN CHẠY 2 (vòng 86): `id` của `work_items` có dạng **`WI_<uuid>`** ⇒ ⛔ **KHÔNG** được ép
  //   regex hex thuần (regex cũ `/^[0-9a-fA-F-]{8,}$/` ⛔ **loại oan** id hợp lệ ⇒ probe tự chặn chính nó).
  return v && v.length >= 8 ? v : null;
};

const results = [];
const check = (name, ok, detail) => { results.push({ name, ok: Boolean(ok) }); console.log(`  ${ok ? "✅" : "❌"} ${name}${detail ? " — " + detail : ""}`); };
const login = async (a) => {
  const r = await fetch(BASE + "/api/system", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "login", username: a.u, password: a.p }) });
  const cookie = (r.headers.getSetCookie?.() || []).map((c) => c.split(";")[0]).join("; ");
  return { ok: r.status === 200, cookie, status: r.status };
};
const post = async (cookie, action, payload = {}) => {
  const r = await fetch(BASE + "/api/system", { method: "POST", headers: { "content-type": "application/json", cookie }, body: JSON.stringify({ action, ...payload }) });
  let j = null; try { j = await r.json(); } catch {}
  return { status: r.status, json: j, err: j?.error || j?.message || "" };
};

console.log("═".repeat(78));
console.log("  🔬 NGHIỆM THU GIAO VIỆC + DUYỆT VIỆC (bản đang chạy) · base = " + BASE);
console.log("═".repeat(78));

const head = await login(HEAD), staff = await login(STAFF), admin = await login(ADMIN);
check("Đăng nhập 3 vai", head.ok && staff.ok && admin.ok, `trưởng phòng=${head.status} · nhân viên=${staff.status} · admin=${admin.status}`);
if (!(head.ok && staff.ok && admin.ok)) { console.log("\n⛔ Không đăng nhập đủ 3 vai ⇒ dừng."); process.exit(1); }

// ① TRƯỞNG PHÒNG GIAO VIỆC (hoặc DÙNG LẠI việc đã tạo — ⛔ không tạo rác mới)
let workItemId = null, taskNo = REUSE_TASK_NO;
if (REUSE_TASK_NO) {
  workItemId = idByTaskNo(REUSE_TASK_NO);
  check("① (dùng lại) tìm được việc thử theo mã trong CSDL", Boolean(workItemId), `mã=${REUSE_TASK_NO} · id=${workItemId ?? "⛔ KHÔNG THẤY"}`);
} else {
  const created = await post(head.cookie, "create_work_item", {
    departmentCode: "DA", title: `[PROBE D18-S4 ${STAMP}] việc kiểm chứng — sẽ HUỶ sau khi đo`, priority: "normal",
  });
  taskNo = (String(created.err).match(/CV-[A-Z]+-\d+-\d+/) || [])[0] || null;
  workItemId = idByTaskNo(taskNo);
  check("① TRƯỞNG PHÒNG giao được việc cho phòng mình (`create_work_item`) + TRA ĐƯỢC ID từ CSDL",
    created.status === 200 && Boolean(workItemId),
    `HTTP ${created.status} · mã=${taskNo ?? "?"} · id=${workItemId ?? "⛔ KHÔNG TRA ĐƯỢC ⇒ các bước sau ⛔ KHÔNG kiểm được"}`);
}

// ② TRƯỞNG PHÒNG DUYỆT VIỆC  ← HỒI QUY BUG-D18
check("② ⭐ TRƯỞNG PHÒNG DUYỆT được việc (`approve_work_item` + `canApprove`) — HỒI QUY `BUG-D18`", await (async () => {
  if (!workItemId) return false;
  const r = await post(head.cookie, "approve_work_item", { workItemId, status: "COMPLETED", reason: `[PROBE D18-S4 ${STAMP}] nghiệm thu` });
  console.log(`     ↳ HTTP ${r.status}${r.err ? " · " + r.err.slice(0, 100) : ""}`);
  return r.status === 200;
})());

// ③ ĐỐI CHỨNG ÂM — NHÂN VIÊN PHẢI BỊ CHẶN
check("③ ➕ ĐỐI CHỨNG ÂM: NHÂN VIÊN ⛔ KHÔNG duyệt được (phải 4xx)", await (async () => {
  if (!workItemId) return false;
  const r = await post(staff.cookie, "approve_work_item", { workItemId, status: "COMPLETED", reason: `[PROBE D18-S4 ${STAMP}] đối chứng âm` });
  console.log(`     ↳ HTTP ${r.status}${r.err ? " · " + r.err.slice(0, 100) : ""}`);
  return r.status !== 200;
})());

// ④ DỌN DỮ LIỆU
check("④ 🧹 DỌN: chuyển việc thử sang `CANCELLED`", await (async () => {
  if (!workItemId) return false;
  const r = await post(admin.cookie, "update_work_item_status", { workItemId, status: "CANCELLED", reason: `[PROBE D18-S4 ${STAMP}] dọn dữ liệu đo` });
  console.log(`     ↳ HTTP ${r.status}${r.err ? " · " + r.err.slice(0, 100) : ""} · id=${workItemId}`);
  return r.status === 200;
})());

const pass = results.length >= 4 && results.every((r) => r.ok);
console.log("\n" + "═".repeat(78));
console.log(pass ? "  KẾT LUẬN: ✅ ĐẠT — giao việc + duyệt việc hoạt động ĐÚNG trên bản đang chạy"
  : "  KẾT LUẬN: ⛔ CHƯA ĐẠT — xem dòng ❌ ở trên (⚠️ kiểm CÁCH GỌI trước khi kết luận mã hỏng)");
console.log("═".repeat(78));
console.log(`  📌 ID việc thử (để tra cứu log): ${workItemId ?? "(không tạo được)"}`);
// ⚠️ vòng 89: ⛔ không dùng `process.exit()` khi còn socket `fetch` mở (Node crash lúc thoát ⇒ mã thoát hỏng)
process.exitCode = pass ? 0 : 1;
