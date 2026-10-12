// 🔬 KIỂM ĐỒNG BỘ DỮ LIỆU GIỮA **MySQL (bản chạy)** VÀ **SQLite (bản cục bộ/đường JS)** — `ERP-SESSION-04` (vòng 90)
// ⚠️ VÌ SAO: migration `V40` (khoá `work`) chỉ được áp cho **MySQL**. Nếu SQLite ⛔ chưa có khoá đó thì
//   **đường JS khi chạy ở chế độ cục bộ ⛔ không có quyền `work`** ⇒ ⚠️ lệch dữ liệu giữa 2 đường
//   (⭐ đúng việc còn lại «thêm mã drizzle 0353» đã ghi trong RUNBOOK `docs/60`).
// ⚠️ CHỈ ĐỌC cả 2 CSDL.
//   node docs/dsh-mutil-session/SESSION_D/probes/do-dong-bo-2-csdl.mjs
import { DatabaseSync } from "node:sqlite";
import { execFileSync } from "node:child_process";

const SQLITE = ".local-data/warehouse.sqlite";
const MYSQL = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
const my = (q) => { try { return execFileSync(MYSQL, ["-uvntech", "-pvntech", "--default-character-set=utf8mb4", "-N", "-B", "vntech_erp", "-e", q], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(); } catch { return "?"; } };

console.log("═".repeat(78));
console.log("  🔬 ĐỒNG BỘ DỮ LIỆU: MySQL (đang chạy) ↔ SQLite (cục bộ)");
console.log("═".repeat(78));

const db = new DatabaseSync(SQLITE, { readOnly: true });
const lite = (q) => { try { return db.prepare(q).all().map((r) => Object.values(r)[0]); } catch (e) { return ["⛔ " + String(e.message).slice(0, 70)]; } };

const rows = [
  ["số dòng `module_catalog`", my("SELECT COUNT(*) FROM module_catalog;"), lite("SELECT COUNT(*) FROM module_catalog")[0]],
  ["có khoá `work` trong `module_catalog`", Number(my("SELECT COUNT(*) FROM module_catalog WHERE module_key='work';")) ? "CÓ" : "KHÔNG", Number(lite("SELECT COUNT(*) FROM module_catalog WHERE module_key='work'")[0]) ? "CÓ" : "KHÔNG"],
  ["dòng `department_module_permissions` khoá `work`", my("SELECT COUNT(*) FROM department_module_permissions WHERE module_key='work';"), lite("SELECT COUNT(*) FROM department_module_permissions WHERE module_key='work'")[0]],
  ["dòng `user_module_permissions` khoá `work` có can_approve=1", my("SELECT COUNT(*) FROM user_module_permissions WHERE module_key='work' AND can_approve=1;"), lite("SELECT COUNT(*) FROM user_module_permissions WHERE module_key='work' AND can_approve=1")[0]],
  ["số `organization_units`", my("SELECT COUNT(*) FROM organization_units;"), lite("SELECT COUNT(*) FROM organization_units")[0]],
  ["số `users`", my("SELECT COUNT(*) FROM users;"), lite("SELECT COUNT(*) FROM users")[0]],
];
console.log("\n  " + "chỉ số".padEnd(52) + "MySQL   SQLite");
for (const [label, a, b] of rows) console.log("  " + String(label).padEnd(52) + String(a).padEnd(8) + String(b));

const myWork = String(rows[1][1]) === "CÓ";
const liteWork = String(rows[1][2]) === "CÓ";
console.log("\n  KẾT LUẬN:");
console.log(`   · MySQL (bản ĐANG CHẠY) có khoá «work»      : ${myWork ? "✅" : "⛔"}`);
console.log(`   · SQLite (đường JS / cục bộ) có khoá «work» : ${liteWork ? "✅" : "⚠️ CHƯA ⇒ cần mã drizzle 0353 (việc còn lại đã ghi trong docs/60)"}`);
if (myWork && !liteWork) console.log("   ⚠️ LỆCH DỮ LIỆU 2 ĐƯỜNG: đường JS ở chế độ cục bộ ⛔ chưa có quyền «work»");
db.close();
// ⚠️ không dùng `process.exit()` (bài học vòng 89: Node crash lúc thoát khi còn socket mở)
process.exitCode = 0;
