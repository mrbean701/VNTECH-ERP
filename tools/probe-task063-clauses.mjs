// ════════════════════════════════════════════════════════════════════════════════════════════
// TASK-063 — KIỂM CHỨNG LÚC CHẠY cho 2 lệch mệnh đề đã vá + đo lớp NHÁNH THEO VAI TRÒ
// ════════════════════════════════════════════════════════════════════════════════════════════
// Cổng TĨNH `tools/probe-clause-parity.mjs` so VĂN BẢN câu SQL. Nó chứng minh được "hai câu khớp
// nhau", nhưng KHÔNG chứng minh được kết quả THẬT mà API trả về đúng như vậy. Cổng này kiểm phần đó:
//   • `audits`            — Java cũ `LIMIT 500`, JS `:698` `LIMIT 100` ⇒ so SÁCH id trả về với MySQL.
//   • `adminMaterialCategories` — Java cũ sắp `sort_order,code`, JS `:694` sắp
//     `CASE WHEN active=1 THEN 0 ELSE 1 END,sort_order,name` ⇒ so SÁCH (active,sortOrder,name).
//   • ĐO (không phán) lớp mù #63: khoá có NHÁNH THEO VAI TRÒ mà nhánh dự phòng là BIẾN KHÁC
//     (`canEditCentral ? A : materialCategories`) — cổng tĩnh chỉ so câu ĐẦU nên không thấy.
//
// GIỚI HẠN (nói thẳng):
//   • `material_categories` hiện có **0** nhóm `active=0` ⇒ nhánh "đẩy nhóm chưa dùng xuống cuối"
//     KHÔNG có dữ liệu để chứng minh; phần so chỉ xác nhận `sort_order,name` (in rõ ở kết quả).
//   • Cổng không so JSON JS↔Java (lõi JS cũ không chạy trên MySQL): đối chiếu là **Java ↔ MySQL**.
//
// Chạy: node tools/probe-task063-clauses.mjs [base]
import { execFileSync } from "node:child_process";

const BASE = process.argv[2] || "http://127.0.0.1:18081";
const MYSQL = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
const MYSQL_ARGS = ["--default-character-set=utf8mb4", "-uvntech", "-pvntech", "vntech_erp",
  "--batch", "--raw", "--skip-column-names"];
const sql = (q) => execFileSync(MYSQL, [...MYSQL_ARGS, "-e", q], { encoding: "utf8" });
const sqlRows = (q) => sql(q).split(/\r?\n/).filter(Boolean).map((l) => l.split("\t"));
const sqlOne = (q) => { const r = sqlRows(q); return r.length ? r[0][0] : ""; };
const isMissing = (v) => v === "NULL" || v === "" || v === undefined || v === null;
const num = (v) => (isMissing(String(v)) ? 0 : Number(v));

const results = [];
const check = (name, ok, detail) => {
  results.push({ name, ok });
  console.log(`  ${ok ? "ĐẠT" : "HỎNG"}  ${name}${detail ? " — " + detail : ""}`);
};

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

const admin = await loginAs("admin", "Admin123456@");

// ══════════════════ 1. `audits` — LIMIT 100 (JS `:698`) ══════════════════
console.log("═══ 1. `audits` — trần 100 dòng + đúng SÁCH id của MySQL ═══");
const auditTotal = Number(sqlOne("SELECT COUNT(*) FROM audit_logs"));
const audits = admin.audits ?? [];
const expectIds = sqlRows("SELECT id FROM audit_logs ORDER BY occurred_at DESC LIMIT 100").map((r) => r[0]);
console.log(`  MySQL: audit_logs = ${auditTotal} dòng ⇒ kỳ vọng trả ${Math.min(100, auditTotal)} dòng; Java trả ${audits.length}`);
check(`audits trả đúng ${Math.min(100, auditTotal)} dòng (JS LIMIT 100, bản cũ 500)`,
  audits.length === Math.min(100, auditTotal), `thực ${audits.length}`);
check("SÁCH id khớp MySQL từng dòng một (sắp theo occurred_at DESC)",
  JSON.stringify(audits.map((a) => String(a.id))) === JSON.stringify(expectIds),
  audits.length === expectIds.length ? `so ${expectIds.length} dòng` : "số dòng đã lệch ⇒ không so được");

// ══════════════════ 2. `adminMaterialCategories` — thứ tự ══════════════════
console.log("\n═══ 2. `adminMaterialCategories` — thứ tự `CASE WHEN active=1 THEN 0 ELSE 1 END,sort_order,name` ═══");
const inactiveCats = Number(sqlOne("SELECT COUNT(*) FROM material_categories WHERE active=0"));
const cats = admin.adminMaterialCategories ?? [];
const expectCats = sqlRows(`SELECT CONCAT(active,'|',sort_order,'|',name) FROM material_categories
                            ORDER BY CASE WHEN active=1 THEN 0 ELSE 1 END,sort_order,name`).map((r) => r[0]);
const gotCats = cats.map((c) => `${num(c.active) ? 1 : 0}|${num(c.sortOrder)}|${c.name}`);
check("thứ tự khớp MySQL từng dòng một", JSON.stringify(gotCats) === JSON.stringify(expectCats),
  gotCats.length === expectCats.length ? `so ${expectCats.length} dòng` : `số dòng lệch: Java ${gotCats.length} · MySQL ${expectCats.length}`);
if (inactiveCats === 0) {
  console.log("  (bối cảnh) `material_categories` hiện có 0 nhóm `active=0` ⇒ nhánh “đẩy nhóm chưa dùng xuống cuối”");
  console.log("             KHÔNG có dữ liệu để chứng minh; phần vừa so chỉ xác nhận khoá `sort_order,name`.");
}

// ══════════════════ 3. ĐO lớp mù #63 — nhánh theo vai trò có fallback là BIẾN KHÁC ══════════════════
console.log("\n═══ 3. ĐO (không phán) lớp mù #63 — khoá có NHÁNH THEO VAI TRÒ ═══");
const ROLE_BRANCHED = ["adminMaterialCategories", "adminMaterialSubcategories", "adminMaterials",
  "workflowAssignments", "audits", "allModulePermissions", "users", "sessions"];
let nonAdmin = null;
for (const [u, p] of [["thukydemo", "Vntech@2026"], ["nvkhdemo", "Vntech@2026"]]) {
  try { nonAdmin = { u, data: await loginAs(u, p) }; break; } catch { /* thử tài khoản kế */ }
}
if (!nonAdmin) {
  console.log("  (bỏ qua) không đăng nhập được tài khoản thường ⇒ KHÔNG đo được lớp nhánh theo vai trò");
} else {
  console.log(`  Tài khoản thường: ${nonAdmin.u}`);
  for (const key of ROLE_BRANCHED) {
    const a = admin[key], n = nonAdmin.data[key];
    const shape = (v) => (v === undefined ? "KHÔNG có khoá" : Array.isArray(v) ? `mảng ${v.length} dòng` : typeof v);
    console.log(`    · ${key.padEnd(26)} admin: ${shape(a).padEnd(16)} · thường: ${shape(n)}`);
  }
  console.log("    ⇒ Nếu nhánh JS trả dữ liệu mà Java để TRỐNG thì lệch — kiểm bằng tay theo JS `:694`/`:698`/`:723`.");

  // ── KIỂM (không chỉ ĐO) nhánh dự phòng là BIẾN KHÁC — JS `:694`/`:695`/`:696` ──────────────
  const nd = nonAdmin.data;
  const same = (x, y) => JSON.stringify((x ?? []).map((r) => r?.id ?? r)) === JSON.stringify((y ?? []).map((r) => r?.id ?? r));
  check("thường: `adminMaterialCategories` = `materialCategories` (JS `:694` nhánh dự phòng)",
    same(nd.adminMaterialCategories, nd.materialCategories),
    `${(nd.adminMaterialCategories ?? []).length} ↔ ${(nd.materialCategories ?? []).length} dòng`);
  check("thường: `adminMaterialSubcategories` = `materialSubcategories` (JS `:695` nhánh dự phòng)",
    same(nd.adminMaterialSubcategories, nd.materialSubcategories),
    `${(nd.adminMaterialSubcategories ?? []).length} ↔ ${(nd.materialSubcategories ?? []).length} dòng`);
  check("thường: `adminMaterials` = [] (JS `:696` trả MẢNG RỖNG, KHÔNG dùng nhánh dự phòng)",
    Array.isArray(nd.adminMaterials) && nd.adminMaterials.length === 0,
    `${(nd.adminMaterials ?? []).length} dòng`);
  // Các khoá admin-GATED thuần (JS `isAdmin ? … : []`) phải rỗng với tài khoản thường.
  const MUST_BE_EMPTY = ["workflowAssignments", "audits", "allModulePermissions", "users", "sessions", "adminProjects"];
  const leaked = MUST_BE_EMPTY.filter((k) => nd[k] !== undefined && (!Array.isArray(nd[k]) || nd[k].length !== 0));
  check("không RÒ RỈ khoá admin-gated nào cho tài khoản thường", leaked.length === 0,
    leaked.length ? `rò rỉ: ${leaked.join(", ")}` : `đã kiểm ${MUST_BE_EMPTY.length} khoá`);
}

const pass = results.filter((r) => r.ok).length;
console.log(`\n═══ KẾT QUẢ: ${pass}/${results.length} ĐẠT ═══`);
process.exit(results.every((r) => r.ok) ? 0 : 1);
