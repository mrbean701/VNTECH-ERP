// 🔬 NGHIỆM THU **PHẠM VI ĐỘNG** CỦA CÔNG VIỆC TRÊN BẢN ĐANG CHẠY — `ERP-SESSION-04` (vòng 85)
//
// MỤC ĐÍCH: kiểm THẲNG 3 yêu cầu của user trên **bản đang chạy** (⛔ không chỉ đọc mã):
//   ① «việc của user nào thì user đó xem»            → nhân viên (`nvdademo`) CHỈ thấy việc của mình
//   ② «việc của nhân viên thì trưởng phòng xem được» → trưởng phòng DA (`trdademo`) thấy việc **phòng DA**
//   ③ «việc của tất cả nhân viên thì giám đốc xem»   → giám đốc (`giamdoc.demo`) thấy **TẤT CẢ**
//   ➕ ĐỐI CHỨNG ÂM (bắt buộc): nhân viên ⛔ **KHÔNG** được thấy nhiều hơn phạm vi của mình.
//
// ⚠️ VÌ SAO PHÉP KIỂM NÀY QUYẾT ĐỊNH: `giamdoc.demo` (director) **được giao 0 việc** (ĐO CSDL) và
//    KHÔNG có chức danh `%_truong` ⇒ theo **luật CŨ** phạm vi = `SELF` ⇒ số việc thấy ≈ **0**.
//    Nếu bản chạy trả về **27** (toàn bộ) ⇒ ⭐ **thay đổi phạm vi ĐỘNG đã CÓ HIỆU LỰC THẬT**.
//
//   node docs/dsh-mutil-session/SESSION_D/probes/probe-nghiem-thu-pham-vi-dong.mjs [base]
import { execFileSync } from "node:child_process";

const BASE = process.argv[2] || "http://127.0.0.1:9000"; // proxy cutover → đường JAVA
const MYSQL = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
const ADCCOUNTS = [
  { user: "admin", pass: "Admin123456@", label: "ADMIN", expect: "all" },
  { user: "giamdoc.demo", pass: "Vntech@2026", label: "GIÁM ĐỐC (director)", expect: "all" },
  { user: "trdademo", pass: "Vntech@2026", label: "TRƯỞNG PHÒNG DA (da_truong)", expect: "dept" },
  { user: "nvkhdemo", pass: "Vntech@2026", label: "NHÂN VIÊN KH (kh_nv)", expect: "self" },
  { user: "ksda.demo", pass: "Vntech@2026", label: "NHÂN VIÊN KS (ksda)", expect: "self" },
];

const results = [];
const check = (name, ok, detail) => { results.push({ name, ok: Boolean(ok) }); console.log(`  ${ok ? "✅" : "❌"} ${name}${detail ? " — " + detail : ""}`); };

function sqlOne(query) {
  try { return execFileSync(MYSQL, ["-uvntech", "-pvntech", "--default-character-set=utf8mb4", "-N", "-B", "vntech_erp", "-e", query], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(); }
  catch (e) { return "?"; }
}
const login = async (u, p) => {
  const r = await fetch(BASE + "/api/system", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "login", username: u, password: p }) });
  const cookie = (r.headers.getSetCookie?.() || []).map((c) => c.split(";")[0]).join("; ");
  return { ok: r.status === 200, cookie, status: r.status };
};
const post = async (cookie, action, payload = {}) => {
  const r = await fetch(BASE + "/api/system", { method: "POST", headers: { "content-type": "application/json", cookie }, body: JSON.stringify({ action, ...payload }) });
  let j = null; try { j = await r.json(); } catch {}
  return { status: r.status, json: j };
};
// ⚠️ BÀI HỌC ĐO ĐƯỢC (vòng 85): payload ứng dụng ⛔ **KHÔNG** phải `POST {action:"bootstrap"}` (⇒ **HTTP 400**),
//   mà là **GET `/api/system`** — ĐÚNG như UI gọi: `app/page.tsx:345` `fetch("/api/system", {cache:"no-store"})`.
//   ⇒ Probe đầu tiên của tôi đo sai cách gọi (⛔ KHÔNG phải mã sai) ⇒ sửa lại theo ĐÚNG đường UI dùng.
const appData = async (cookie) => {
  const r = await fetch(BASE + "/api/system", { method: "GET", headers: { cookie }, cache: "no-store" });
  let j = null; try { j = await r.json(); } catch {}
  return { status: r.status, json: j };
};

console.log("═".repeat(78));
console.log("  🔬 NGHIỆM THU PHẠM VI ĐỘNG CÔNG VIỆC TRÊN BẢN ĐANG CHẠY");
console.log("  base = " + BASE);
console.log("═".repeat(78));

// ── SỰ THẬT CSDL (đo trực tiếp, ⛔ không suy đoán) ─────────────────────────────
const total = Number(sqlOne("SELECT COUNT(*) FROM work_items;"));
const deptDA = Number(sqlOne("SELECT COUNT(*) FROM work_items WHERE department_code='DA';"));
const ownOf = (u) => Number(sqlOne(`SELECT COUNT(*) FROM work_items w JOIN users us ON us.id=w.assigned_to WHERE us.username='${u}';`));
const own = { giamdoc: ownOf("giamdoc.demo"), trda: ownOf("trdademo"), nvkh: ownOf("nvkhdemo"), ksda: ownOf("ksda.demo") };
console.log(`\n  SỰ THẬT CSDL: tổng việc = ${total} · phòng DA = ${deptDA} · được giao: giamdoc=${own.giamdoc} trdademo=${own.trda} nvkhdemo=${own.nvkh} ksda=${own.ksda}`);
console.log("  ⚠️ LƯU Ý: nhánh `admin` của truy vấn ⛔ KHÔNG bị thay đổi bởi đợt này ⇒ số của admin là **MỐC NỀN CÓ SẴN**");

// ── ĐO TRÊN BẢN CHẠY ──────────────────────────────────────────────────────────
console.log("\n  KẾT QUẢ ĐO TRÊN BẢN CHẠY (bootstrap → workItems):");
const seen = {};
for (const a of ADCCOUNTS) {
  const s = await login(a.user, a.pass);
  if (!s.ok) { console.log(`    ⛔ ${a.label}: đăng nhập HTTP ${s.status}`); continue; }
  const b = await appData(s.cookie);
  const n = Array.isArray(b.json?.data?.workItems) ? b.json.data.workItems.length
    : Array.isArray(b.json?.workItems) ? b.json.workItems.length : null;
  seen[a.user] = n;
  console.log(`    · ${a.label.padEnd(30)} thấy ${n === null ? "⛔ KHÔNG ĐỌC ĐƯỢC" : n + " việc"}  (HTTP ${b.status})`);
}

// ── KHẲNG ĐỊNH 3 CHIỀU ────────────────────────────────────────────────────────
console.log("\n  KHẲNG ĐỊNH:");
const admin = seen["admin"], gd = seen["giamdoc.demo"], tr = seen["trdademo"];
const nv1 = seen["nvkhdemo"], nv2 = seen["ksda.demo"];

check("① GIÁM ĐỐC thấy ĐÚNG BẰNG ADMIN (việc của TẤT CẢ nhân viên — yêu cầu user)",
  gd !== null && admin !== null && gd === admin && gd > 0,
  `giám đốc=${gd} · admin=${admin} (⚠️ luật CŨ: giám đốc được giao ${own.giamdoc} việc ⇒ sẽ chỉ thấy ≈${own.giamdoc})`);
check("② TRƯỞNG PHÒNG thấy việc của PHÒNG MÌNH (và ÍT HƠN giám đốc)",
  tr !== null && tr >= deptDA - 5 && tr > 0 && (gd === null || tr <= gd),
  `trưởng phòng DA=${tr} · việc phòng DA=${deptDA} · giám đốc=${gd}`);
check("③ NHÂN VIÊN chỉ thấy việc CỦA MÌNH (⛔ KHÔNG nới rộng)",
  nv1 !== null && nv1 <= own.nvkh && nv2 !== null && nv2 <= own.ksda,
  `nvkhdemo=${nv1} (được giao ${own.nvkh}) · ksda.demo=${nv2} (được giao ${own.ksda})`);
check("➕ ĐỐI CHỨNG ÂM: nhân viên thấy ÍT HƠN HẲN giám đốc (⛔ không mở toàn công ty)",
  nv1 !== null && gd !== null && nv1 < gd,
  `nhân viên=${nv1} < giám đốc=${gd}`);
check("➕ ĐỐI CHỨNG ÂM 2: trưởng phòng DA ⛔ KHÔNG thấy bằng giám đốc (đúng phạm vi phòng)",
  tr !== null && gd !== null && tr <= gd, `trưởng phòng DA=${tr} ≤ giám đốc=${gd}`);

const pass = results.every((r) => r.ok);
console.log("\n" + "═".repeat(78));
console.log(pass ? "  KẾT LUẬN: ✅ PHẠM VI ĐỘNG ĐẠT TRÊN BẢN ĐANG CHẠY"
  : "  KẾT LUẬN: ⛔ CHƯA ĐẠT — xem dòng ❌ ở trên");
console.log("═".repeat(78));
// ⚠️ vòng 89: ⛔ không dùng `process.exit()` khi còn socket `fetch` mở (Node crash lúc thoát ⇒ mã thoát hỏng)
process.exitCode = pass ? 0 : 1;
