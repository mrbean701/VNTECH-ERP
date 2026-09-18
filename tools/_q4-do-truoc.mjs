// Q4 — ĐO TRƯỚC khi cấp `can_create` cho phòng ban: hiện trạng 480 dòng + 42 dòng đã có quyền tạo.
import { execFileSync } from "node:child_process";
const MYSQL = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
const q = (sql) => execFileSync(MYSQL, ["-uvntech", "-pvntech", "--default-character-set=utf8mb4", "-N", "-B", "vntech_erp", "-e", sql], { encoding: "utf8" }).trim();

console.log("=== 1. Tổng quan ===");
console.log(q("SELECT CONCAT('tổng dòng=', COUNT(*), ' · can_use=1: ', SUM(can_use=1), ' · can_create=1: ', SUM(can_create=1), ' · can_edit=1: ', SUM(can_edit=1), ' · can_approve=1: ', SUM(can_approve=1)) FROM department_module_permissions"));

console.log("\n=== 2. 42 dòng ĐÃ có can_create=1 (theo mẫu này) ===");
console.log(q("SELECT CONCAT(o.code, ' · ', p.module_key, ' · use=', p.can_use, ' create=', p.can_create, ' edit=', p.can_edit) FROM department_module_permissions p JOIN organization_units o ON o.id=p.organization_unit_id WHERE p.can_create=1 ORDER BY o.code, p.module_key").split(/\r?\n/).map((l) => "  " + l).join("\n"));

console.log("\n=== 3. Ứng viên: can_use=1 nhưng can_create=0 (theo module) ===");
console.log(q("SELECT CONCAT(p.module_key, ' = ', COUNT(*)) FROM department_module_permissions p WHERE p.can_use=1 AND p.can_create=0 GROUP BY p.module_key ORDER BY p.module_key").split(/\r?\n/).map((l) => "  " + l).join("\n"));

console.log("\n=== 4. 8 đơn vị phòng ban ===");
console.log(q("SELECT CONCAT(o.code, ' · ', o.name) FROM organization_units o ORDER BY o.code").split(/\r?\n/).map((l) => "  " + l).join("\n"));

console.log("\n=== 5. Module nghiệp vụ đang có dòng quyền (để loại trừ module chỉ-đọc) ===");
console.log(q("SELECT GROUP_CONCAT(DISTINCT module_key ORDER BY module_key SEPARATOR ' · ') FROM department_module_permissions").split(/\r?\n/).map((l) => "  " + l).join("\n"));
