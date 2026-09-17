// ════════════════════════════════════════════════════════════════════════════════════════════
// TASK-065 — KIỂM CHỨNG LÚC CHẠY: `canEditCentral` ≠ `admin` (JS `:693-696`)
// ════════════════════════════════════════════════════════════════════════════════════════════
// JS `:693`:  const canEditCentral = isAdmin(user) || await canUseModule(user,"central_warehouse","canEdit");
// JS `:694-696`: BA khoá `adminMaterialCategories` / `adminMaterialSubcategories` / `adminMaterials`
//                dùng `canEditCentral`, KHÔNG dùng `isAdmin`.
// ⇒ Một tài khoản KHÔNG phải admin nhưng có dòng quyền `central_warehouse.can_edit=1` PHẢI nhận
//   danh sách ĐẦY ĐỦ (gồm cả mục đã ẩn + `aliases`/`aliasText`), không phải danh sách rút gọn.
//
// PHÉP ĐO CÓ ĐỐI CHỨNG ÂM (đây là điểm quan trọng nhất): cùng MỘT tài khoản, chạy 2 lần —
//   (1) CÓ dòng quyền  ⇒ `adminMaterials` = 14 dòng đầy đủ (kèm `aliases`/`aliasText`);
//   (2) KHÔNG có dòng quyền ⇒ `adminMaterials` = [] và 2 khoá kia = bản RÚT GỌN.
//   Nếu cả hai lần cho cùng kết quả thì phép kiểm mới KHÔNG có tác dụng ⇒ cổng báo HỎNG.
//
// FIXTURE: cấp 1 dòng `user_module_permissions` cho `tkhodemo`, **dọn trong `finally`** và khẳng định
// số dòng quay về đúng nền. Cơ sở dữ liệu hiện có **0** dòng cho `central_warehouse` (đo lại ở mục 0).
//
// GIỚI HẠN: cổng chỉ đo trên MỘT tài khoản thật; `menu_group_catalog`/`module_catalog` phải `active=1`
// (đã kiểm ở mục 0) nếu không thì `canUseModule` trả false và phép đo vô nghĩa.
//
// Chạy: node tools/probe-task065-caneditcentral.mjs [base]
import { execFileSync } from "node:child_process";

const BASE = process.argv[2] || "http://127.0.0.1:18081";
const MYSQL = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
const MYSQL_ARGS = ["--default-character-set=utf8mb4", "-uvntech", "-pvntech", "vntech_erp",
  "--batch", "--raw", "--skip-column-names"];
const sql = (q) => execFileSync(MYSQL, [...MYSQL_ARGS, "-e", q], { encoding: "utf8" });
const sqlRows = (q) => sql(q).split(/\r?\n/).filter(Boolean).map((l) => l.split("\t"));
const sqlOne = (q) => { const r = sqlRows(q); return r.length ? r[0][0] : ""; };
const escape = (v) => "'" + String(v).replace(/'/g, "''") + "'";

const PROBE_ID = "UMP_T065_PROBE";
const USERNAME = "tkhodemo";
const PASSWORD = "Vntech@2026";
const MODULE = "central_warehouse";

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

const countGrant = () => Number(sqlOne(
  `SELECT COUNT(*) FROM user_module_permissions WHERE module_key=${escape(MODULE)}`));
const idsOf = (rows) => JSON.stringify((rows ?? []).map((r) => String(r?.id)));

// ═══════════════════════ 0. TIỀN ĐỀ ═══════════════════════
console.log("═══ 0. TIỀN ĐỀ (đo trước khi kết luận) ═══");
const moduleOk = Number(sqlOne(`SELECT COUNT(*) FROM module_catalog WHERE module_key=${escape(MODULE)} AND active=1`)) === 1;
const groupRow = sqlRows(`SELECT mc.group_key,COALESCE((SELECT mg.active FROM menu_group_catalog mg WHERE mg.group_key=mc.group_key),-1)
                          FROM module_catalog mc WHERE mc.module_key=${escape(MODULE)}`);
const groupOk = groupRow.length > 0 && (groupRow[0][0] === "NULL" || String(groupRow[0][1]) === "1");
console.log(`  module_catalog.${MODULE} active=1: ${moduleOk} · menu_group_catalog("${groupRow[0]?.[0]}") active=1: ${groupOk}`);
const baseline = countGrant();
console.log(`  dòng quyền hiện có cho "${MODULE}": ${baseline}`);
const userId = sqlOne(`SELECT id FROM users WHERE username=${escape(USERNAME)}`);
console.log(`  tài khoản đo: ${USERNAME} (${userId})`);
const fullMaterials = Number(sqlOne("SELECT COUNT(*) FROM materials"));
const fullCats = Number(sqlOne("SELECT COUNT(*) FROM material_categories"));
const fullSubcats = Number(sqlOne("SELECT COUNT(*) FROM material_subcategories"));
console.log(`  MySQL: materials=${fullMaterials} · categories=${fullCats} · subcategories=${fullSubcats}`);

if (!moduleOk || !groupOk || !userId) {
  console.log("\n⚠️ TIỀN ĐỀ KHÔNG ĐỦ ⇒ cổng không thể kết luận (canUseModule sẽ luôn trả false).");
  process.exit(1);
}

let noGrant = null, withGrant = null;
try {
  // ═══════════════════════ 1. CÓ dòng quyền ⇒ danh sách ĐẦY ĐỦ ═══════════════════════
  console.log(`\n═══ 1. CẤP quyền "${MODULE}".can_edit=1 cho ${USERNAME} ⇒ phải nhận danh sách ĐẦY ĐỦ ═══`);
  sql(`INSERT INTO user_module_permissions
         (id,user_id,module_key,can_view,can_use,can_create,can_edit,can_approve,can_export,
          permission_expires_at,permission_source,created_at,updated_at)
       VALUES (${escape(PROBE_ID)},${escape(userId)},${escape(MODULE)},1,1,1,1,0,0,NULL,'manual_override',NOW(3),NOW(3))`);
  check("đã tạo dòng quyền TẠM", countGrant() === baseline + 1, `${baseline} → ${countGrant()}`);

  withGrant = await loginAs(USERNAME, PASSWORD);
  const am = withGrant.adminMaterials ?? [];
  const ac = withGrant.adminMaterialCategories ?? [];
  const as = withGrant.adminMaterialSubcategories ?? [];
  check(`adminMaterials = danh sách ĐẦY ĐỦ (${fullMaterials} dòng)`, am.length === fullMaterials, `thực ${am.length}`);
  check("mọi dòng adminMaterials có `aliases` + `aliasText` (chỉ bản đầy đủ mới gắn)",
    am.length > 0 && am.every((r) => Array.isArray(r.aliases) && typeof r.aliasText === "string"),
    `${am.filter((r) => Array.isArray(r.aliases)).length}/${am.length} dòng có aliases`);
  check(`adminMaterialCategories = ${fullCats} dòng (bản đầy đủ)`, ac.length === fullCats, `thực ${ac.length}`);
  check(`adminMaterialSubcategories = ${fullSubcats} dòng (bản đầy đủ)`, as.length === fullSubcats, `thực ${as.length}`);

  // ═══════════════════════ 2. KHÔNG có dòng quyền ⇒ nhánh RÚT GỌN (đối chứng ÂM) ═══════════════════════
  console.log(`\n═══ 2. THU HỒI quyền ⇒ phải quay về nhánh RÚT GỌN (đối chứng ÂM) ═══`);
  sql(`DELETE FROM user_module_permissions WHERE id=${escape(PROBE_ID)}`);
  check("đã xoá dòng quyền TẠM", countGrant() === baseline, `${countGrant()} (nền ${baseline})`);

  noGrant = await loginAs(USERNAME, PASSWORD);
  const am2 = noGrant.adminMaterials ?? [];
  check("adminMaterials = [] (JS `:696` trả MẢNG RỖNG khi không có quyền)", am2.length === 0, `thực ${am2.length}`);
  check("adminMaterialCategories = `materialCategories` (nhánh dự phòng JS `:694`)",
    idsOf(noGrant.adminMaterialCategories) === idsOf(noGrant.materialCategories),
    `${(noGrant.adminMaterialCategories ?? []).length} ↔ ${(noGrant.materialCategories ?? []).length} dòng`);
  check("adminMaterialSubcategories = `materialSubcategories` (nhánh dự phòng JS `:695`)",
    idsOf(noGrant.adminMaterialSubcategories) === idsOf(noGrant.materialSubcategories),
    `${(noGrant.adminMaterialSubcategories ?? []).length} ↔ ${(noGrant.materialSubcategories ?? []).length} dòng`);

  // ═══════════════════════ 3. PHÉP KIỂM MỚI CÓ TÁC DỤNG THẬT ═══════════════════════
  console.log("\n═══ 3. Phép kiểm mới CÓ TÁC DỤNG (hai lần đo phải KHÁC nhau) ═══");
  const before = (withGrant.adminMaterials ?? []).length;
  const after = (noGrant.adminMaterials ?? []).length;
  check("CÓ quyền ≠ KHÔNG quyền (nếu bằng nhau ⇒ phép kiểm mới vô tác dụng)",
    before !== after, `có quyền ${before} dòng · không quyền ${after} dòng`);
} finally {
  // DỌN SẠCH — kể cả khi cổng ném lỗi giữa đường.
  try {
    sql(`DELETE FROM user_module_permissions WHERE id=${escape(PROBE_ID)}`);
    const now = countGrant();
    console.log(`\nDỌN DẸP: dòng quyền "${MODULE}" = ${now} (nền ${baseline}) → ${now === baseline ? "SẠCH ✅" : "⚠️ CÒN SÓT!"}`);
    if (now !== baseline) results.push({ name: "dọn sạch fixture", ok: false });
  } catch (e) {
    console.log(`\n⚠️ DỌN DẸP THẤT BẠI: ${e.message} — PHẢI xoá tay dòng id='${PROBE_ID}'.`);
    results.push({ name: "dọn sạch fixture", ok: false });
  }
}

const pass = results.filter((r) => r.ok).length;
console.log(`\n═══ KẾT QUẢ: ${pass}/${results.length} ĐẠT ═══`);
console.log("GIỚI HẠN: chỉ đo 1 tài khoản thật; phép đo phụ thuộc module_catalog/menu_group_catalog active=1");
console.log("         và việc API đã chạy bản jar có TASK-065 (canEditCentral truyền từ use-case xuống adapter).");
process.exit(results.every((r) => r.ok) ? 0 : 1);
