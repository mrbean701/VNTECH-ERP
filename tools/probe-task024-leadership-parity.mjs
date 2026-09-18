// Q2 (18/09/2026) — CỔNG PARITY: `isCompanyLeadership` giữa JS và Java (TASK-024).
//
// BỐI CẢNH ĐO ĐƯỢC: Java có HAI khái niệm "Ban lãnh đạo" khác nhau, JS trước đây chỉ có MỘT:
//   • CỔNG QUYỀN HÀNH ĐỘNG  — `RbacService.isCompanyLeadership`          = {director, accountant}
//   • BỘ LỌC BOOTSTRAP      — `BootstrapDataAdapter.isCompanyLeadership` = 7 mã vai trò + base_role='director'
// Người dùng quyết (b): "giữ Java, sửa JS" ⇒ JS phải phản chiếu ĐÚNG cả hai khái niệm.
//
// Cổng này: (1) đọc TẬP MÃ từ 3 tệp nguồn (không chép tay); (2) đối chiếu từng cặp; (3) tính trên
// TÀI KHOẢN THẬT trong MySQL xem tài khoản nào ĐỔI quyền so với hành vi JS CŨ.
//
//   node tools/probe-task024-leadership-parity.mjs
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const MYSQL = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
const checks = [];
const ok = (label, pass, detail) => checks.push({ label, pass, detail });

const js = readFileSync("scripts/system-route.mjs", "utf8");
const rbac = readFileSync("java-backend/application/src/main/java/com/vntech/erp/application/rbac/RbacService.java", "utf8");
const bootstrapJava = readFileSync("java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/BootstrapDataAdapter.java", "utf8");

const parseJsSet = (name) => {
  const m = js.match(new RegExp(`const ${name} = new Set\\(\\[([^\\]]*)\\]\\)`));
  return m ? m[1].split(",").map((s) => s.trim().replace(/^"|"$/g, "")).filter(Boolean).sort() : null;
};
const parseJavaSetOf = (text, marker) => {
  const m = text.match(new RegExp(`${marker}\\s*=\\s*Set\\.of\\(([^)]*)\\)`));
  return m ? m[1].split(",").map((s) => s.trim().replace(/^"|"$/g, "")).filter(Boolean).sort() : null;
};

const jsGate = parseJsSet("COMPANY_LEADERSHIP_ACTION_CODES");
const jsBootstrap = parseJsSet("COMPANY_LEADERSHIP_ROLE_CODES");
const javaGate = (rbac.match(/List\.of\(([^)]*)\)\.contains\(user\.role\(\)\)/) || [])[1]?.split(",").map((s) => s.trim().replace(/^"|"$/g, "")).filter(Boolean).sort() || null;
const javaBootstrap = parseJavaSetOf(bootstrapJava, "COMPANY_LEADERSHIP_ROLE_CODES");

ok("(A) đọc được tập mã ở cả 4 nguồn", Boolean(jsGate && jsBootstrap && javaGate && javaBootstrap),
  `JS-gate=${jsGate?.length} · JS-bootstrap=${jsBootstrap?.length} · Java-gate=${javaGate?.length} · Java-bootstrap=${javaBootstrap?.length}`);
ok("(A) đối chứng DƯƠNG: tập không rỗng và ≥2 phần tử", (jsGate?.length || 0) >= 2 && (jsBootstrap?.length || 0) >= 2, `${jsGate?.join(",")} | ${jsBootstrap?.join(",")}`);
ok("(B) CỔNG QUYỀN: JS-gate == Java-gate (RbacService)", JSON.stringify(jsGate) === JSON.stringify(javaGate), `JS=[${jsGate}] · Java=[${javaGate}]`);
ok("(B) BỘ LỌC BOOTSTRAP: JS-bootstrap == Java-bootstrap (BootstrapDataAdapter)", JSON.stringify(jsBootstrap) === JSON.stringify(javaBootstrap), `JS=[${jsBootstrap}] · Java=[${javaBootstrap}]`);
const gateCalls = (js.match(/isCompanyLeadershipActionGate\(user\)\s*&&/g) || []).length;
ok("(B) JS dùng cổng quyền ở `defaultDepartmentPermission` + `canUseModule`", gateCalls === 2, `${gateCalls} chỗ gọi (không tính dòng định nghĩa)`);
ok("(B) JS vẫn dùng bộ lọc bootstrap ở nhánh modulePermissions", /: isCompanyLeadership\(user\) \? MODULE_KEYS/.test(js), "nhánh bootstrap giữ nguyên");

// ── (C) TÀI KHOẢN THẬT: ai ĐỔI quyền so với JS CŨ ───────────────────────────────────────────
const rows = execFileSync(MYSQL, ["-uvntech", "-pvntech", "--default-character-set=utf8mb4", "-N", "-B", "vntech_erp", "-e",
  "SELECT u.username, u.role, COALESCE(r.base_role,'') FROM users u LEFT JOIN role_catalog r ON r.code=u.role WHERE u.active=1 ORDER BY u.username;"],
  { encoding: "utf8" }).split(/\r?\n/).filter(Boolean).map((l) => l.split("\t"));

const JS_OLD = (role, base) => ["director", "tgd", "ptgd", "giam_doc", "pho_giam_doc", "thuky", "thu_ky_tgd"].includes(String(role).toLowerCase()) || String(base).toLowerCase() === "director";
const JS_NEW = (role) => ["director", "accountant"].includes(String(role).toLowerCase());

const changed = [];
for (const [username, role, base] of rows) {
  const oldV = JS_OLD(role, base), newV = JS_NEW(role);
  if (oldV !== newV) changed.push(`${username} (role=${role}${base ? ", base=" + base : ""}): ${oldV ? "CÓ" : "không"} → ${newV ? "CÓ" : "không"}`);
}
console.log("=== (C) TÀI KHOẢN ĐỔI QUYỀN «CỔNG LÃNH ĐẠO» SO VỚI JS CŨ ===");
console.log(changed.length ? changed.map((c) => "  • " + c).join("\n") : "  (không tài khoản nào đổi)");
ok("(C) có đo được danh sách tài khoản thật", rows.length > 0, `${rows.length} tài khoản hoạt động`);

const failed = checks.filter((c) => !c.pass);
for (const c of checks) console.log(`  ${c.pass ? "ĐẠT " : "HỎNG"} ${c.label}${c.detail ? "  —  " + c.detail : ""}`);
console.log(`\nQ2 — PARITY công lãnh đạo JS↔Java: ${checks.length - failed.length}/${checks.length} ĐẠT`);
process.exit(failed.length ? 1 : 0);
