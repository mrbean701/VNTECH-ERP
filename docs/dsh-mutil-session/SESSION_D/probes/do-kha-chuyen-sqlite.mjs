// 🔬 KIỂM **TÍNH KHẢ CHUYỂN 2 ENGINE** cho 5 câu SQL mới của `BUG-D23` — `ERP-SESSION-04` (vòng 90)
//
// ⚠️ VÌ SAO CẦN: đường JS (`scripts/system-route.mjs`) là đường **dùng chung hợp đồng** và luật dự án
//   yêu cầu SQL chạy được ở **CẢ MySQL VÀ SQLite** (bài học `LIKE '%_truong'` — ⛔ không dùng `'%\_truong'`
//   vì MySQL hiểu `\_` là ký tự thoát còn SQLite ⛔ không). Câu SQL mới của tôi dùng `inherited` JOIN +
//   `EXISTS` + `ORDER BY CASE` ⇒ **phải chứng minh chạy được trên SQLite**, ⛔ không suy đoán.
//
// ⚠️ CHỈ ĐỌC: chỉ `SELECT`, ⛔ không ghi gì vào CSDL.
//   node docs/dsh-mutil-session/SESSION_D/probes/do-kha-chuyen-sqlite.mjs [duong-dan.sqlite]
import { existsSync } from "node:fs";

const FILE = process.argv[2] || ".local-data/warehouse.sqlite";
console.log("═".repeat(78));
console.log("  🔬 KHẢ CHUYỂN 2 ENGINE (SQLite) CHO SQL MỚI CỦA `BUG-D23`");
console.log("  file = " + FILE);
console.log("═".repeat(78));

if (!existsSync(FILE)) { console.log("  ⛔ không thấy tệp SQLite ⇒ dừng"); process.exitCode = 1; }
else {
  let DatabaseSync;
  try { ({ DatabaseSync } = await import("node:sqlite")); }
  catch (e) { console.log("  ⛔ Node này không có `node:sqlite` ⇒ dừng: " + e.message); process.exitCode = 1; }

  if (DatabaseSync) {
    const db = new DatabaseSync(FILE, { readOnly: true });
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all().map((r) => String(r.name));
    console.log(`\n① Bảng trong SQLite: ${tables.length}`);
    const need = ["users", "organization_units", "user_module_permissions", "role_catalog", "work_items"];
    const have = need.filter((t) => tables.includes(t));
    console.log(`   bảng cần cho SQL mới: ${have.length}/${need.length} — ${have.join(", ")}`);
    if (tables.length) console.log(`   (một số bảng khác: ${tables.slice(0, 12).join(", ")}…)`);

    // 5 câu SQL MỚI (nguyên văn từ `scripts/system-route.mjs`, thay `?` bằng tham số thật)
    const CASES = [
      ["① isDepartmentManager — nhánh động (đúng đơn vị + work.canApprove)", `SELECT 1 AS ok FROM users mm LEFT JOIN organization_units ou ON ou.id=mm.organization_unit_id WHERE mm.id=? AND ou.code=? AND EXISTS(SELECT 1 FROM user_module_permissions ump WHERE ump.user_id=mm.id AND ump.module_key='work' AND ump.can_approve=1) LIMIT 1`],
      ["② userCanReceiveDepartmentTask — thành viên đơn vị thật", `SELECT 1 AS ok FROM users mu LEFT JOIN organization_units ou ON ou.id=mu.organization_unit_id WHERE mu.id=? AND ou.code=? LIMIT 1`],
      ["③ defaultDepartmentAssignee — ưu tiên cùng đơn vị", `SELECT u.id,u.full_name AS fullName,u.email,u.role,COALESCE(rc.base_role,u.role) AS roleBase FROM users u LEFT JOIN role_catalog rc ON rc.code=u.role LEFT JOIN organization_units ou ON ou.id=u.organization_unit_id WHERE u.active=1 AND (COALESCE(rc.base_role,u.role)=? OR ou.code=?) ORDER BY CASE WHEN ou.code=? THEN 0 ELSE 1 END,CASE WHEN u.role IN ('kh_nv','da_nv') THEN 0 ELSE 1 END,u.full_name LIMIT 1`],
      ["④ create_work_item — kiểm đơn vị TỒN TẠI", `SELECT 1 AS ok FROM organization_units WHERE code=? AND active=1 LIMIT 1`],
      ["⑤ userCanReceive + dự án (nhánh có projectId)", `SELECT u.id FROM users u LEFT JOIN role_catalog rc ON rc.code=u.role LEFT JOIN organization_units ou ON ou.id=u.organization_unit_id JOIN user_project_scopes ups ON ups.user_id=u.id AND ups.project_id=? WHERE u.active=1 AND (COALESCE(rc.base_role,u.role)=? OR ou.code=?) ORDER BY CASE WHEN ou.code=? THEN 0 ELSE 1 END LIMIT 1`],
    ];
    const BINDS = [["", ""], ["", ""], ["", "", ""], [""], ["", "", "", ""]];

    console.log("\n② CHẠY THỬ TRÊN SQLITE (chỉ SELECT — ⛔ không ghi):");
    let okAll = true;
    for (let i = 0; i < CASES.length; i++) {
      const [label, sql] = CASES[i];
      try {
        const stmt = db.prepare(sql);
        // `?` không tham số ⇒ truyền giá trị rỗng để chỉ kiểm CÚ PHÁP/CÚ PHÁP LẬP KẾ HOẠCH
        stmt.all(...BINDS[i]);
        console.log(`   ✅ ${label} — SQLite CHẤP NHẬN cú pháp`);
      } catch (e) {
        okAll = false;
        console.log(`   ❌ ${label} — SQLite ⛔ TỪ CHỐI: ${String(e.message).slice(0, 110)}`);
      }
    }
    db.close();
    console.log("\n" + "═".repeat(78));
    console.log(okAll ? "  KẾT LUẬN: ✅ CẢ 5 CÂU SQL CHẠY ĐƯỢC TRÊN SQLITE (khả chuyển 2 engine ✓)"
      : "  KẾT LUẬN: ⛔ CÓ CÂU ⛔ KHÔNG CHẠY ĐƯỢC TRÊN SQLITE — xem dòng ❌");
    console.log("═".repeat(78));
    process.exitCode = okAll ? 0 : 1;
  }
}
