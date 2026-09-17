// ════════════════════════════════════════════════════════════════════════════════════════════
// TASK-069 — CỔNG "HỢP ĐỒNG KIỂU `AppData`" + ĐỐI CHIẾU SỐ DÒNG cho 11 khoá JAVA-ONLY
// ════════════════════════════════════════════════════════════════════════════════════════════
// VÌ SAO CÓ CỔNG NÀY: hai cổng TĨNH đã xanh, nhưng khi liệt kê phần KHÔNG so được thì lộ
// **11 khoá Java-only** (Java khai mà JS không khai theo tên đó) — đúng những khoá chưa từng được đo.
// Cổng TASK-066 trước đó chỉ phủ **38 khoá** vì nó trích từ dạng viết `result.data?.<khoá>`.
//
// NGUỒN SỰ THẬT MẠNH HƠN: **khai báo KIỂU `AppData`** trong `app/page.tsx`
//   `requests: Row[]; … workflowDefinitions: Row[]; … teamMembers?: Row[]; formFieldConfigs?: FormFieldConfig[];`
// — đây là hợp đồng dữ liệu UI cam kết dùng: tên khoá + KIỂU + khoá nào là BẮT BUỘC (`?` = tuỳ chọn).
// Nếu API thiếu một khoá BẮT BUỘC thì UI **âm thầm** thay `[]`/null (khối chuẩn hoá) ⇒ màn trống, KHÔNG lỗi nào nổi lên.
//
// CÁCH ĐO (2 phần):
//   1. Với 6 tài khoản THẬT: mọi khoá BẮT BUỘC phải CÓ + đúng KIỂU; khoá tuỳ chọn nếu có thì cũng đúng kiểu.
//   2. Với 11 khoá Java-only: đối chiếu **số dòng** với MySQL (trích bảng từ chính câu SQL của adapter)
//      ⇒ chứng minh API trả DỮ LIỆU THẬT chứ không phải khai khoá rỗng.
//
// ⚠️ CỔNG PHẢI TỰ CHỨNG MINH (bài học #103): nếu số khoá trích từ `AppData` tụt bất thường ⇒ IN CẢNH BÁO
//    và không cho kết luận (khối khai báo có thể đã được viết lại).
//
// GIỚI HẠN: (a) chỉ kiểm SỰ HIỆN DIỆN + KIỂU, KHÔNG phán nội dung nghiệp vụ (rỗng theo vai trò là hợp lệ);
//          (b) số-dòng đối chiếu theo bảng đầu tiên trong `FROM` — câu SQL nhiều bảng có thể lệch có chủ ý
//          (JOIN lọc dòng); cổng in rõ từng cặp số để người đọc tự phán, KHÔNG tự kết luận "sai".
//
// Chạy: node tools/probe-task069-appdata-contract.mjs [base]
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const BASE = process.argv[2] || "http://127.0.0.1:18081";
const PAGE = "app/page.tsx";
const JAVA_SRC = "java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/BootstrapDataAdapter.java";
const MYSQL = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
const sql = (q) => execFileSync(MYSQL, ["--default-character-set=utf8mb4", "-uvntech", "-pvntech",
  "vntech_erp", "--batch", "--raw", "--skip-column-names", "-e", q], { encoding: "utf8" });
const sqlOne = (q) => { const r = sql(q).split(/\r?\n/).filter(Boolean); return r.length ? r[0].split("\t")[0] : ""; };

// ═══════════════════ 1. TRÍCH HỢP ĐỒNG `AppData` ═══════════════════
const page = readFileSync(PAGE, "utf8");
const block = (() => {
  const start = page.indexOf("type AppData = {");
  if (start < 0) return "";
  const end = page.indexOf("};", start);
  return end < 0 ? "" : page.slice(start, end);
})();
const contract = new Map(); // key -> { kind, optional }
for (const m of block.matchAll(/([a-zA-Z_][a-zA-Z0-9_]*)(\??)\s*:\s*([^;]+);/g)) {
  const [, key, opt, type] = m;
  const t = type.trim();
  const kind = t.endsWith("[]") ? "array"
    : /\|\s*null/.test(t) ? "objectOrNull"
    : t === "boolean" ? "boolean" : "object";
  contract.set(key, { kind, optional: opt === "?" });
}
console.log("═══ 1. HỢP ĐỒNG `AppData` (trích từ `app/page.tsx`) ═══");
const required = [...contract.entries()].filter(([, v]) => !v.optional);
const optional = [...contract.entries()].filter(([, v]) => v.optional);
console.log(`  tổng ${contract.size} khoá — BẮT BUỘC ${required.length} · tuỳ chọn ${optional.length}`);
const COVERAGE_MIN = 80;
if (contract.size < COVERAGE_MIN) {
  console.log(`  ⚠️ ĐỘ PHỦ HỢP ĐỒNG TỤT (${contract.size} < ${COVERAGE_MIN}) — khai báo `+"`AppData`"+` có thể đã đổi cách viết.`);
  console.log("     Kết luận bên dưới KHÔNG đáng tin cho tới khi rà lại cách trích.");
}

// ═══════════════════ 2. ĐO THEO TỪNG VAI TRÒ ═══════════════════
async function loginAs(username, password) {
  const res = await fetch(`${BASE}/api/system`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "login", username, password }),
  });
  if (!res.ok) throw new Error(`đăng nhập ${username} lỗi HTTP ${res.status}`);
  const cookie = (res.headers.getSetCookie?.() ?? [res.headers.get("set-cookie")])
    .filter(Boolean).map((c) => c.split(";")[0]).join("; ");
  const boot = await (await fetch(`${BASE}/api/system`, { headers: { cookie } })).json();
  if (!boot?.data) throw new Error(`bootstrap ${username} không có .data`);
  return boot.data;
}
const ACCOUNTS = [["admin", "Admin123456@"], ["nvkhdemo", "Vntech@2026"], ["trinhtrench", "Vntech@2026"],
  ["nvdademo", "Vntech@2026"], ["tkhodemo", "Vntech@2026"], ["thukydemo", "Vntech@2026"]];

const results = [];
const check = (name, ok, detail) => {
  results.push({ name, ok });
  console.log(`  ${ok ? "ĐẠT" : "HỎNG"}  ${name}${detail ? " — " + detail : ""}`);
};
const kindOk = (v, kind) => kind === "array" ? Array.isArray(v)
  : kind === "objectOrNull" ? (v !== undefined && (v === null || typeof v === "object"))
  : kind === "boolean" ? typeof v === "boolean" : (v !== undefined && v !== null && typeof v === "object");

console.log("\n═══ 2. THEO TỪNG VAI TRÒ: khoá BẮT BUỘC phải CÓ + đúng KIỂU ═══");
let adminData = null;
for (const [user, pass] of ACCOUNTS) {
  let data;
  try { data = await loginAs(user, pass); } catch (e) { check(`[${user}] lấy bootstrap`, false, e.message); continue; }
  if (user === "admin") adminData = data;
  const missing = [];
  const wrongKind = [];
  for (const [key, { kind, optional }] of contract) {
    const has = Object.prototype.hasOwnProperty.call(data, key);
    if (!has) { if (!optional) missing.push(key); continue; }
    if (!kindOk(data[key], kind)) wrongKind.push(`${key}=${data[key] === null ? "null" : typeof data[key]}`);
  }
  check(`[${user}] ${required.length} khoá BẮT BUỘC đều CÓ`, missing.length === 0,
    missing.length ? `thiếu ${missing.length}: ${missing.slice(0, 8).join(", ")}` : "đủ");
  if (wrongKind.length) check(`[${user}] kiểu khớp hợp đồng`, false, wrongKind.slice(0, 6).join(", "));
}

// ═══════════════════ 3. 11 KHOÁ JAVA-ONLY: SỐ DÒNG vs MySQL ═══════════════════
const JAVA_ONLY = ["workflowDefinitions", "workflowSteps", "workflowStepApprovers", "departmentModulePermissions",
  "systemLevelCatalog", "staffDirectory", "formFieldConfigs", "teamMembers", "supplySteps",
  "boqMappingCandidates", "workItemEvents"];
console.log("\n═══ 3. 11 KHOÁ JAVA-ONLY: có trong hợp đồng UI? · số dòng API vs MySQL ═══");
const java = readFileSync(JAVA_SRC, "utf8");
for (const key of JAVA_ONLY) {
  const inContract = contract.has(key);
  const row = adminData ? adminData[key] : undefined;
  const apiCount = Array.isArray(row) ? row.length : row === undefined ? "(THIẾU KHOÁ)" : typeof row;
  // trích bảng đầu tiên trong `FROM` của câu SQL gắn với khoá này
  let table = null;
  const putIdx = java.indexOf(`data.put("${key}"`);
  if (putIdx >= 0) {
    const chunk = java.slice(putIdx, putIdx + 2000);
    let sqlText = null;
    const varDecl = chunk.match(/^\s*(?:List<Map<String, Object>>\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/);
    if (varDecl) {
      const decl = java.indexOf(`${varDecl[1]} =`);
      const q = java.slice(decl, decl + 2000).match(/"""([\s\S]*?)"""/);
      if (q) sqlText = q[1];
    }
    if (!sqlText) { const q = chunk.match(/"""([\s\S]*?)"""/); if (q) sqlText = q[1]; }
    if (sqlText) { const f = sqlText.match(/\bFROM\s+([a-z_][a-z0-9_]*)/i); if (f) table = f[1]; }
  }
  let dbCount = "?";
  if (table) { try { dbCount = Number(sqlOne(`SELECT COUNT(*) FROM ${table}`)); } catch { dbCount = "lỗi"; } }
  console.log(`  ${inContract ? "•" : "✗"} ${key.padEnd(28)} hợp đồng UI: ${inContract ? "CÓ" : "KHÔNG (UI không đọc)"}` +
    ` · API: ${apiCount} · ${table ?? "(không trích được bảng)"}: ${dbCount}`);
}

const pass = results.filter((r) => r.ok).length;
console.log(`\n═══ KẾT QUẢ: ${pass}/${results.length} ĐẠT ═══`);
console.log("GIỚI HẠN: (a) chỉ kiểm SỰ HIỆN DIỆN + KIỂU, KHÔNG phán nội dung (rỗng theo vai trò là HỢP LỆ);");
console.log("         (b) số-dòng theo BẢNG ĐẦU TIÊN trong `FROM` — câu nhiều bảng có thể lệch có chủ ý (JOIN lọc dòng),");
console.log("             cổng in cặp số để người đọc tự phán, KHÔNG tự kết luận sai.");
process.exit(results.every((r) => r.ok) ? 0 : 1);
