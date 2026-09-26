// ════════════════════════════════════════════════════════════════════════════════════════════
// TASK-066 — CỔNG ĐO "HỢP ĐỒNG KHOÁ BOOTSTRAP ↔ UI" THEO TỪNG VAI TRÒ
// ════════════════════════════════════════════════════════════════════════════════════════════
// VÌ SAO CÓ CỔNG NÀY:
//   Hai cổng TĨNH đã xanh (tập cột 71 khoá · mệnh đề 71 khoá) nhưng vẫn còn **13 khoá Java-only**
//   và **200 tên biến JS không ghép được** ⇒ còn VÙNG MÙ chưa từng đo, trong đó có lớp đã gây lỗi thật:
//   * "khoá CÓ khai nhưng TRƯỜNG DẪN XUẤT thiếu" (Known Problems #50: `engineRoleProfiles` = null;
//     `businessRoleGroups[].scopeIds/scopes` do JS `:675` làm giàu);
//   * "lệch TÊN trường bootstrap" — đã từng gây `TypeError` → React error boundary → TRANG TỰ TẢI LẠI
//     (UI đọc `approvalStages` còn Java trả `approvalStageCatalog`; thiếu `allModulePermissions` ⇒ tab 4/6 trắng).
//
// NGUỒN SỰ THẬT ĐỘC LẬP: **hợp đồng thật của UI** — khối chuẩn hoá trong `app/page.tsx`
//   (`<key>: Array.isArray(result.data?.<key>) ? result.data.<key> : []` / `<key>: result.data?.<key> ?? <mặc định>`).
//   Khối đó chính là danh sách khoá UI tiêu thụ + KIỂU mong đợi. Nếu API thiếu khoá, UI **âm thầm** thay bằng
//   `[]`/null ⇒ màn hình trắng/trống mà KHÔNG có lỗi nào nổi lên ⇒ đúng lớp lỗi cần bắt.
//
// CÁCH ĐO: đăng nhập TỪNG tài khoản THẬT → lấy payload → đối chiếu với hợp đồng:
//   (1) khoá THIẾU HẲN trong payload (UI sẽ tự lấp ⇒ sai âm thầm);
//   (2) SAI KIỂU (UI mong mảng, API trả null/undefined/object);
//   (3) lớp DẪN XUẤT đã biết (#50) trên từng dòng dữ liệu.
//
// GIỚI HẠN (nói thẳng):
//   * Cổng đo **sự HIỆN DIỆN và KIỂU**, KHÔNG phán nội dung nghiệp vụ (dữ liệu rỗng theo vai trò là HỢP LỆ).
//   * Hợp đồng được TRÍCH TỪ VĂN BẢN `page.tsx` ⇒ nếu khối chuẩn hoá được viết lại theo cách khác, số khoá
//     sẽ tụt và cổng in cảnh báo (không âm thầm mất độ phủ — bài học #103).
//
// Chạy: node tools/probe-task066-role-shape.mjs [base]
import { readFileSync } from "node:fs";

const BASE = process.argv[2] || "http://127.0.0.1:18081";
const PAGE = "app/page.tsx";

// ═══════════════════════ 1. HỢP ĐỒNG KHOÁ CỦA UI (trích từ page.tsx) ═══════════════════════
const src = readFileSync(PAGE, "utf8");
const contract = new Map(); // key -> "array" | "other"
for (const m of src.matchAll(/([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*Array\.isArray\(result\.data\?\.([a-zA-Z_][a-zA-Z0-9_]*)\)/g)) {
  contract.set(m[2], "array");
}
for (const m of src.matchAll(/([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*result\.data\?\.([a-zA-Z_][a-zA-Z0-9_]*)\s*\?\?/g)) {
  if (!contract.has(m[2])) contract.set(m[2], "other");
}
// mọi `result.data?.X` còn lại (không khớp 2 dạng trên) vẫn là khoá UI đọc — ghi nhận với kiểu "unknown"
const allRead = new Set([...src.matchAll(/result\.data\?\.([a-zA-Z_][a-zA-Z0-9_]*)/g)].map((m) => m[1]));
for (const k of allRead) if (!contract.has(k)) contract.set(k, "unknown");

console.log("═══ 1. HỢP ĐỒNG KHOÁ CỦA UI (trích từ khối chuẩn hoá `app/page.tsx`) ═══");
console.log(`  UI đọc ${allRead.size} khoá qua \`result.data?.<khoá>\` — trong đó ${[...contract.values()].filter((v) => v === "array").length} khoá khai KIỂU MẢNG`);
if (allRead.size < 30) {
  console.log(`  ⚠️ ĐỘ PHỦ HỢP ĐỒNG TỤT (${allRead.size} < 30) — khối chuẩn hoá có thể đã đổi cách viết.`);
  console.log("     Kết luận bên dưới KHÔNG đáng tin cho tới khi rà lại cách trích.");
}

// ═══════════════════════ 2. ĐO THEO TỪNG VAI TRÒ ═══════════════════════
const ACCOUNTS = [
  ["admin", "Admin123456@"],
  ["nvkhdemo", "Vntech@2026"],
  ["trinhtrench", "Vntech@2026"],
  ["nvdademo", "Vntech@2026"],
  ["tkhodemo", "Vntech@2026"],
  ["thukydemo", "Vntech@2026"],
];

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

const results = [];
const check = (name, ok, detail) => {
  results.push({ name, ok });
  console.log(`  ${ok ? "ĐẠT" : "HỎNG"}  ${name}${detail ? " — " + detail : ""}`);
};

console.log("\n═══ 2. THEO TỪNG VAI TRÒ: khoá thiếu hẳn / sai kiểu ═══");
const missingByRole = new Map();
for (const [user, pass] of ACCOUNTS) {
  let data;
  try {
    data = await loginAs(user, pass);
  } catch (e) {
    check(`[${user}] đăng nhập + lấy bootstrap`, false, e.message);
    continue;
  }
  const missing = [];
  const wrongType = [];
  for (const [key, kind] of contract) {
    if (!Object.prototype.hasOwnProperty.call(data, key)) { missing.push(key); continue; }
    const v = data[key];
    if (kind === "array" && !Array.isArray(v)) wrongType.push(`${key}=${v === null ? "null" : typeof v}`);
    if (kind === "array" && Array.isArray(v) && v.length === 0) { /* rỗng theo vai trò: HỢP LỆ */ }
  }
  missingByRole.set(user, missing);
  check(`[${user}] ${contract.size} khoá hợp đồng đều CÓ trong payload`, missing.length === 0,
    missing.length ? `thiếu ${missing.length}: ${missing.slice(0, 8).join(", ")}` : `đã kiểm ${contract.size} khoá`);
  if (wrongType.length) check(`[${user}] kiểu dữ liệu khớp hợp đồng`, false, `sai kiểu: ${wrongType.slice(0, 6).join(", ")}`);
}

// ═══════════════════════ 3. LỚP DẪN XUẤT ĐÃ BIẾT (Known Problems #50) ═══════════════════════
console.log("\n═══ 3. LỚP 'KHOÁ CÓ KHAI NHƯNG TRƯỜNG DẪN XUẤT THIẾU' (Known Problems #50) ═══");
const admin = await loginAs("admin", "Admin123456@");

// 3a. `businessRoleGroups[].scopeIds` / `[].scopes` — JS `:675` làm giàu từ `business_role_group_scopes`
const groups = admin.businessRoleGroups ?? [];
const groupScopes = admin.businessRoleGroupScopes ?? [];
if (!groups.length) {
  console.log("  (bỏ qua) `businessRoleGroups` rỗng ⇒ không kiểm được trường dẫn xuất");
} else {
  const needScopes = new Set(groupScopes.map((s) => String(s.businessGroupId)));
  const withIds = groups.filter((g) => Array.isArray(g.scopeIds)).length;
  const withScopes = groups.filter((g) => Array.isArray(g.scopes)).length;
  console.log(`  bối cảnh: ${groups.length} nhóm vai trò · ${groupScopes.length} dòng phạm vi · ${needScopes.size} nhóm CÓ phạm vi`);
  check("mọi dòng businessRoleGroups có `scopeIds` (mảng)", withIds === groups.length, `${withIds}/${groups.length}`);
  check("mọi dòng businessRoleGroups có `scopes` (mảng)", withScopes === groups.length, `${withScopes}/${groups.length}`);
  const mismatch = groups.filter((g) => needScopes.has(String(g.id)) && (g.scopeIds ?? []).length === 0)
    .map((g) => g.id);
  check("nhóm CÓ phạm vi trong DB thì `scopeIds` KHÔNG rỗng", mismatch.length === 0,
    mismatch.length ? `rỗng oan: ${mismatch.slice(0, 5).join(", ")}` : "khớp");
}

// 3b. `engineRoleProfiles` — Java trả CÙNG object với `businessRoleEngineProfiles`
const engine = admin.engineRoleProfiles;
check("`engineRoleProfiles` là MẢNG (không null)", Array.isArray(engine),
  engine === undefined ? "KHÔNG có khoá" : Array.isArray(engine) ? `${engine.length} dòng` : typeof engine);
const engineRows = admin.businessRoleEngineProfiles ?? [];
check("`engineRoleProfiles` = `businessRoleEngineProfiles` (Java gán cùng tham chiếu)",
  JSON.stringify(engine ?? null) === JSON.stringify(engineRows), `${(engine ?? []).length} ↔ ${engineRows.length} dòng`);

const pass = results.filter((r) => r.ok).length;
console.log(`\n═══ KẾT QUẢ: ${pass}/${results.length} ĐẠT ═══`);
console.log("GIỚI HẠN: cổng đo SỰ HIỆN DIỆN + KIỂU theo hợp đồng UI; KHÔNG phán nội dung nghiệp vụ.");
console.log("         Dữ liệu rỗng theo vai trò là HỢP LỆ và không bị tính là HỎNG.");
process.exit(results.every((r) => r.ok) ? 0 : 1);
