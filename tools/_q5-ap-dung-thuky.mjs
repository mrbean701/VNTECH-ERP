// Q5 — ÁP DỤNG đổi tên vai trò `thuky` về tên ngắn cho CẢ HAI CSDL (SQLite + MySQL) và ĐO LẠI.
// Tự chối nếu trước khi sửa tên không phải tên dài (tránh sửa nhầm khi dữ liệu đã đổi).
import { DatabaseSync } from "node:sqlite";
import { execFileSync } from "node:child_process";

const NEW = "Thư ký Tổng giám đốc";
const OLD = "Thư ký Tổng giám đốc / Trưởng phòng Hành chính Pháp chế";
const MYSQL = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";

// ── SQLite ──────────────────────────────────────────────────────────────────────────────
const db = new DatabaseSync(".local-data/warehouse.sqlite");
const before = db.prepare("SELECT name FROM role_catalog WHERE code = ?").get("thuky")?.name;
console.log(`SQLite TRƯỚC: ${before}`);
if (before === NEW) console.log("  (đã là tên ngắn — bỏ qua SQLite)");
else if (before !== OLD) { console.error(`  ✖ Tên hiện tại KHÁC tên dài đã biết ⇒ DỪNG để không sửa nhầm.`); process.exit(1); }
else {
  db.prepare("UPDATE role_catalog SET name = ? WHERE code = ?").run(NEW, "thuky");
  console.log(`SQLite SAU  : ${db.prepare("SELECT name FROM role_catalog WHERE code = ?").get("thuky").name}`);
}
db.close();

// ── MySQL (đường phục vụ Java) ───────────────────────────────────────────────────────────
const q = (sql) => execFileSync(MYSQL, ["-uvntech", "-pvntech", "--default-character-set=utf8mb4", "-N", "-B", "vntech_erp", "-e", sql], { encoding: "utf8" }).trim();
const myBefore = q("SELECT name FROM role_catalog WHERE code='thuky';");
console.log(`MySQL TRƯỚC : ${myBefore}`);
if (myBefore === NEW) console.log("  (đã là tên ngắn — bỏ qua MySQL)");
else if (myBefore !== OLD) { console.error(`  ✖ Tên MySQL KHÁC tên dài đã biết ⇒ DỪNG để không sửa nhầm.`); process.exit(1); }
else {
  q(`UPDATE role_catalog SET name='${NEW}' WHERE code='thuky';`);
  console.log(`MySQL SAU   : ${q("SELECT name FROM role_catalog WHERE code='thuky';")}`);
}
console.log(`\nOK: cả 2 CSDL nay đều = "${NEW}"`);
