// ⚠️ CHỈ ĐỌC — NGHIỆM THU «MA TRẬN WORK ĐỘNG» TRÊN APP ĐANG CHẠY (`:9000` → Java + MySQL).
// ⛔ KHÔNG gọi action ghi nào (chỉ `login` + GET payload ứng dụng).
//
// ⭐ NÂNG CẤP 08/10/2026 (`ERP-SESSION-04` · vòng 89): trước đây probe chỉ **IN** số liệu ⇒ ⛔ **luôn exit 0**,
//   ⛔ không dùng làm cổng được. Nay: **KHẲNG ĐỊNH + MÃ THOÁT** (ĐẠT ⇒ 0 · CHƯA ĐẠT ⇒ 1).
//   ➕ Bổ sung bất biến theo quyết định user «**ẩn** 4 khoá cũ»: 4 khoá đó **VẪN PHẢI CÒN** trong
//     `module_catalog` (⛔ TUYỆT ĐỐI không xoá — chúng vẫn là cổng quyền THẬT của tầng UI/tab).
//
//   node docs/dsh-mutil-session/SESSION_D/probes/verify-ma-tran-dong.mjs [base]
const BASE = process.argv[2] || "http://127.0.0.1:9000";
const LEGACY = ["dept_plan_tasks", "dept_project_tasks", "dept_plan_assign", "dept_project_assign"];

const results = [];
const check = (name, ok, detail) => { results.push({ name, ok: Boolean(ok) }); console.log(`  ${ok ? "✅" : "❌"} ${name}${detail ? " — " + detail : ""}`); };
const login = async (u, p) => {
  const r = await fetch(BASE + "/api/system", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "login", username: u, password: p }),
  });
  return { ok: r.status === 200, cookie: (r.headers.getSetCookie?.() || []).map((c) => c.split(";")[0]).join("; ") };
};
const boot = async (cookie) =>
  (await fetch(BASE + "/api/system", { headers: { cookie }, cache: "no-store" }).then((r) => r.json()).catch(() => null))?.data || {};

console.log("═".repeat(78));
console.log("  NGHIỆM THU «MA TRẬN WORK ĐỘNG» TRÊN APP ĐANG CHẠY · base = " + BASE);
console.log("═".repeat(78));

const a = await login("admin", "Admin123456@");
if (!a.ok) { console.log("⛔ không đăng nhập được admin ⇒ dừng"); process.exit(1); }
const d = await boot(a.cookie);

// ── ① DANH MỤC MODULE ─────────────────────────────────────────────────────────
const cat = d.moduleCatalog || [];
const work = cat.find((r) => String(r.moduleKey) === "work");
const legacyInCat = LEGACY.filter((k) => cat.some((r) => String(r.moduleKey) === k));
console.log(`\n① module_catalog: ${cat.length} dòng (trước thay đổi = 76)`);
console.log(`   khoá «work» = ${work ? JSON.stringify(work) : "⛔ KHÔNG THẤY"}`);
console.log(`   4 khoá CŨ còn trong danh mục: ${legacyInCat.length}/4 ${legacyInCat.join(", ")}`);
check("① khoá chung «work» có trong danh mục module", Boolean(work));
check("①b ⛔ KHÔNG được xoá 4 khoá CŨ khỏi danh mục (chúng vẫn là cổng quyền THẬT của tab/màn)", legacyInCat.length === 4,
  `còn ${legacyInCat.length}/4`);

// ── ② CẤP THEO ĐƠN VỊ ─────────────────────────────────────────────────────────
const dmp = d.departmentModulePermissions || [];
const rows = dmp.filter((r) => String(r.moduleKey) === "work");
console.log(`\n② department_module_permissions: ${dmp.length} dòng · khoá «work» = ${rows.length} đơn vị`);
for (const r of rows) {
  const u = (d.organizationUnits || []).find((x) => String(x.id) === String(r.organizationUnitId));
  console.log(`   · ${String(u?.code ?? r.organizationUnitId).padEnd(11)} view=${r.canView} use=${r.canUse} create=${r.canCreate} edit=${r.canEdit} approve=${r.canApprove}`);
}
check("② khoá «work» được cấp theo ĐƠN VỊ (≥8 đơn vị — đo ban đầu = 8)", rows.length >= 8, `${rows.length} đơn vị`);

// ── ③ CẤP THEO NGƯỜI (quyết định user: admin quyết ai là trưởng phòng) ────────
const all = d.allModulePermissions || [];
const workUsers = all.filter((r) => String(r.moduleKey) === "work" && Number(r.canApprove) === 1);
console.log(`\n③ user_module_permissions: ${all.length} dòng · «work» + canApprove=1 = ${workUsers.length} (mong đợi 3 — 3 tài khoản "%_truong")`);
check("③ đúng 3 tài khoản có quyền DUYỆT khoá «work» (bù hồi quy `BUG-D18`)", workUsers.length === 3, `${workUsers.length} dòng`);

// ── ④ ĐƠN VỊ THẬT ────────────────────────────────────────────────────────────
const units = (d.organizationUnits || []).map((u) => u.code);
console.log(`\n④ mã đơn vị THẬT: ${units.length} — ${units.join(", ")}`);
check("④ ≥11 đơn vị thật (backend tra ĐỘNG theo danh sách này, ⛔ không hardcode 2 phòng)", units.length >= 11, `${units.length} đơn vị`);

// ── ⑤ GIAO DIỆN (⚠️ kiểm được SAU BUILD — ghi rõ kỳ vọng tại đây) ─────────────
// ⭐ CẬP NHẬT 09/10/2026 (MÔ HÌNH B của user — `HANDOFF-20261009-A09/A16` + `CHG-D31`): ⚠️ kỳ vọng CŨ
//    («hiện đúng 1 dòng *Công việc (mọi phòng ban)*») ĐÃ SAI ⇒ nay nhóm `my_work` phải vẽ:
//    **`work` + 6 khoá TAB + `work_others` = 8 dòng**, trong đó **4 khoá CŨ vẫn ẨN** ở tầng vẽ
//    (`MATRIX_HIDDEN_MODULE_KEYS`) ⇒ ⭐ **hiển thị thực = 8 dòng** (⚠️ ⛔ không còn là 1 dòng như trước).
//    📏 NGUỒN: `configuredModules(payload thật)` = **71** dòng, nhóm `my_work` có **14** dòng dữ liệu
//    (đo 09/10/2026 — xem `probe verify-menu-my_work.mjs` để kiểm phần MENU).
console.log("\n⑤ GIAO DIỆN MA TRẬN (⚠️ phải BUILD FE mới kiểm được — kỳ vọng theo MÔ HÌNH B, đã cập nhật 09/10/2026):");
console.log("   · nhóm `my_work` HIỆN: «Công việc (mọi phòng ban)» + **6 dòng TAB** (`work_dashboard`·`work_list`·");
console.log("     `work_department`·`work_assign`·`work_project`·`work_reports`) + **«Việc của NGƯỜI KHÁC (xem · sửa · duyệt)»** (`work_others`) = **8 dòng**");
console.log("   · 4 dòng CŨ (`dept_plan_tasks`·`dept_project_tasks`·`dept_plan_assign`·`dept_project_assign`) ⛔ KHÔNG hiện");
console.log("     (nếu lọt ra ⇒ `MATRIX_HIDDEN_MODULE_KEYS` chưa vào bản build)");
console.log("   · ⚠️ tick `work_others` TRONG ma trận ⛔ **chưa có tác dụng** (chưa cưỡng chế ở tầng nào — `HANDOFF-A14`)");
console.log("   · ⛔ đổi 2 nút HÀNG LOẠT không được ghi 0 cho 4 khoá ẩn (đã khoá bằng `tests/v214` VỆ 8)");
console.log("   · mở «Phân quyền» → chọn 1 người → tick cột «Duyệt» ở dòng đó = cách admin chỉ định trưởng phòng");

const pass = results.every((r) => r.ok);
console.log("\n" + "═".repeat(78));
console.log(pass ? "  KẾT LUẬN: ✅ ĐẠT (phần dữ liệu/backend) — ⏳ còn phần GIAO DIỆN chờ BUILD FE"
  : "  KẾT LUẬN: ⛔ CHƯA ĐẠT — xem dòng ❌ ở trên");
console.log("═".repeat(78));
// ⚠️ BÀI HỌC (vòng 89): ⛔ **KHÔNG** dùng `process.exit()` khi còn socket `fetch` mở ⇒ Node **CRASH lúc thoát**
//   (`Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)` · mã thoát **-1073740791** = 0xC0000409)
//   ⚠️ dù kết luận đã in đúng ⇒ **mã thoát hỏng ⇒ cổng ⛔ không dùng được trong tự động hoá**.
//   ➡️ Đặt `process.exitCode` rồi để Node tự thoát êm ✓
process.exitCode = pass ? 0 : 1;
