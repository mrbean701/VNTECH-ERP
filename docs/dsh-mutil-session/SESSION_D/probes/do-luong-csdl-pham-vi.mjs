// ⚠️ CHỈ ĐỌC CSDL (SELECT) — đo cấp bậc + chức danh để thiết kế PHẠM VI ĐỘNG (⛔ không hardcode).
// Kết nối dùng đúng mẫu của dự án (tools/_q4-do-truoc.mjs).
import { execFileSync } from "node:child_process";
const MYSQL = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
const q = (sql) =>
  execFileSync(MYSQL, ["-uvntech", "-pvntech", "--default-character-set=utf8mb4", "-N", "-B", "vntech_erp", "-e", sql], {
    encoding: "utf8",
  }).trim();
const show = (title, sql) => {
  console.log("\n" + "─".repeat(78) + "\n" + title);
  const out = q(sql);
  console.log(out ? out.split(/\r?\n/).map((l) => "  " + l).join("\n") : "  (0 dòng)");
};

show("① users.system_level_code → rank (cấp bậc THẬT đang gán, ⛔ không suy từ seed)", `
SELECT CONCAT(COALESCE(u.system_level_code,'(NULL)'), ' · rank=', COALESCE(sl.level_rank,'?'), ' = ', COUNT(*), ' user')
FROM users u LEFT JOIN system_level_catalog sl ON sl.code=u.system_level_code
GROUP BY u.system_level_code, sl.level_rank ORDER BY COALESCE(sl.level_rank,0) DESC`);

show("② CẤP BẬC THEO TỪNG ĐƠN VỊ — ai đủ ngưỡng 30/35 trong phòng mình", `
SELECT CONCAT(COALESCE(ou.code,'(không đơn vị)'), ' · rank=', COALESCE(sl.level_rank,'?'), ' · role=', u.role, ' = ', COUNT(*))
FROM users u
LEFT JOIN organization_units ou ON ou.id=u.organization_unit_id
LEFT JOIN system_level_catalog sl ON sl.code=u.system_level_code
GROUP BY ou.code, sl.level_rank, u.role ORDER BY ou.code, COALESCE(sl.level_rank,0) DESC`);

show("③ CHỨC DANH có mẫu «_truong» (quản lý phòng) — đo để ⛔ không hardcode 'kh_truong'/'da_truong'", `
SELECT CONCAT(rc.code, ' · base=', rc.base_role, ' · đơn vị mặc định=', COALESCE(ou.code,'(NULL)'))
FROM role_catalog rc LEFT JOIN organization_units ou ON ou.id=rc.default_organization_unit_id
WHERE rc.code LIKE '%\\_truong' ORDER BY rc.code`);

show("④ TOÀN BỘ role_catalog đang dùng bởi users (mã → base_role)", `
SELECT CONCAT(u.role, ' → base=', COALESCE(rc.base_role,'(NULL)'), ' = ', COUNT(*), ' user')
FROM users u LEFT JOIN role_catalog rc ON rc.code=u.role
GROUP BY u.role, rc.base_role ORDER BY COUNT(*) DESC`);

show("⑤ work_items.department_code — 2 việc mã «CN» là gì (đối chiếu organization_units)", `
SELECT CONCAT(wi.task_no, ' · dep=', wi.department_code, ' · project=', COALESCE(p.code,'(không dự án)'), ' · status=', wi.status, ' · ', LEFT(wi.title,45))
FROM work_items wi LEFT JOIN projects p ON p.id=wi.project_id
WHERE wi.department_code NOT IN (SELECT code FROM organization_units) OR wi.department_code='CN' ORDER BY wi.task_no`);

show("⑥ ĐƠN VỊ × NHÂN SỰ (mẫu số cho phạm vi động)", `
SELECT CONCAT(COALESCE(ou.code,'(không đơn vị)'), ' · ', COALESCE(ou.unit_type,'?'), ' · ', COUNT(*), ' user')
FROM users u LEFT JOIN organization_units ou ON ou.id=u.organization_unit_id
GROUP BY ou.code, ou.unit_type ORDER BY COUNT(*) DESC`);

