// 🔬 NGHIỆM THU **BẤT BIẾN «ẨN NHƯNG ⛔ KHÔNG MẤT QUYỀN»** BẰNG **DỮ LIỆU THẬT** — `ERP-SESSION-04` (vòng 91)
//
// ⚠️ VÌ SAO CẦN (rủi ro lớn nhất của quyết định «ẩn» của user):
//   `save_user_access` là **FULL-REPLACE** (`clearUserScopes()` xoá cứng rồi ghi lại) ⇒ **khoá nào
//   ⛔ KHÔNG gửi lên sẽ bị XOÁ** ⇒ nếu việc «ẩn 4 khoá cũ khỏi ma trận» mà **vô tình** làm chúng rơi khỏi
//   tập gửi lên thì **MẤT QUYỀN ÂM THẦM** của mọi người dùng.
//
// ⭐ CÁCH LÀM (mạnh nhất mà ⛔ không cần BUILD): nhập **HÀM THẬT** `permissionMatrixKeys`
//   (`app/screens/PermissionAccessPanel.tsx:110`) + **HẰNG SỐ THẬT** `MATRIX_HIDDEN_MODULE_KEYS`
//   (`app/screens/PermissionMatrix.tsx:44`) rồi chạy trên **payload THẬT** lấy từ bản đang chạy.
//
//   node docs/dsh-mutil-session/SESSION_D/probes/verify-an-khong-mat-quyen.mjs [base]
const BASE = process.argv[2] || "http://127.0.0.1:9000";
const results = [];
const check = (name, ok, detail) => { results.push({ name, ok: Boolean(ok) }); console.log(`  ${ok ? "✅" : "❌"} ${name}${detail ? " — " + detail : ""}`); };

console.log("═".repeat(78));
console.log("  🔬 BẤT BIẾN «ẨN NHƯNG ⛔ KHÔNG MẤT QUYỀN» — đo bằng DỮ LIỆU THẬT");
console.log("═".repeat(78));

// ── NHẬP HÀM/HẰNG SỐ THẬT (⚠️ nếu alias `@/` chặn ⇒ báo rõ, ⛔ không giả vờ đã kiểm) ──
let permissionMatrixKeys, MATRIX_HIDDEN_MODULE_KEYS, importError = "";
try {
  ({ permissionMatrixKeys } = await import("../../../../app/screens/PermissionAccessPanel.tsx"));
  ({ MATRIX_HIDDEN_MODULE_KEYS } = await import("../../../../app/screens/PermissionMatrix.tsx"));
} catch (e) { importError = String(e.message).slice(0, 160); }

if (importError) {
  console.log("\n  ⚠️ ⛔ KHÔNG NHẬP ĐƯỢC hàm thật (alias/JSX) ⇒ dừng, ⛔ không kết luận thay:");
  console.log("     " + importError);
  process.exitCode = 2;
} else {
  console.log(`\n① Nhập hàm thật: permissionMatrixKeys=${typeof permissionMatrixKeys} · MATRIX_HIDDEN_MODULE_KEYS=${Array.isArray(MATRIX_HIDDEN_MODULE_KEYS) ? MATRIX_HIDDEN_MODULE_KEYS.length + " khoá" : "⛔"}`);
  const LEGACY = ["dept_plan_tasks", "dept_project_tasks", "dept_plan_assign", "dept_project_assign"];
  check("① `MATRIX_HIDDEN_MODULE_KEYS` ĐÚNG 4 khoá cũ (⛔ không ẩn khoá `work`)",
    Array.isArray(MATRIX_HIDDEN_MODULE_KEYS) && MATRIX_HIDDEN_MODULE_KEYS.length === 4 &&
    LEGACY.every((k) => MATRIX_HIDDEN_MODULE_KEYS.includes(k)) && !MATRIX_HIDDEN_MODULE_KEYS.includes("work"),
    JSON.stringify(MATRIX_HIDDEN_MODULE_KEYS));

  // ── PAYLOAD THẬT ──
  const login = await fetch(BASE + "/api/system", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "login", username: "admin", password: "Admin123456@" }) });
  const cookie = (login.headers.getSetCookie?.() || []).map((c) => c.split(";")[0]).join("; ");
  const data = (await fetch(BASE + "/api/system", { headers: { cookie }, cache: "no-store" }).then((r) => r.json()))?.data || {};
  const activeCat = (data.moduleCatalog || []).filter((r) => r.active !== false);
  console.log(`\n② payload THẬT: moduleCatalog ${(data.moduleCatalog || []).length} dòng (active ${activeCat.length})`);

  const keys = permissionMatrixKeys(data, []);   // ⭐ tập khoá sẽ GỬI LÊN khi bấm Lưu
  console.log(`   tập khoá GỬI LÊN (permissionMatrixKeys) = ${keys.length} khoá`);
  const lostLegacy = LEGACY.filter((k) => !keys.includes(k));
  check("② ⛔ KHÔNG mất quyền: CẢ 4 khoá ẨN vẫn nằm trong tập GỬI LÊN (⇒ `save_user_access` ⛔ không xoá)",
    lostLegacy.length === 0, lostLegacy.length ? "THIẾU: " + lostLegacy.join(", ") : "đủ 4/4");
  check("③ khoá chung «work» CŨNG nằm trong tập gửi lên (⇒ cấp được qua ma trận)",
    keys.includes("work"), keys.includes("work") ? "có" : "⛔ THIẾU");
  check("④ tập gửi lên = ĐÚNG tập khoá danh mục đang bật (⛔ không rơi khoá nào)",
    keys.length === activeCat.length, `${keys.length} so với ${activeCat.length}`);

  // ── VẾ VẼ DÒNG (kiểm bằng hằng số thật + luật lọc của component) ──
  const rendered = activeCat.filter((r) => !MATRIX_HIDDEN_MODULE_KEYS.includes(String(r.moduleKey)));
  console.log(`\n③ nếu vẽ theo luật lọc thật: ${rendered.length} dòng ⛔ không bị ẩn (trong ${activeCat.length})`);
  check("⑤ dòng «Công việc (mọi phòng ban)» (`work`) ĐƯỢC VẼ",
    rendered.some((r) => String(r.moduleKey) === "work"), "có" );
  check("⑥ CẢ 4 dòng CŨ ⛔ KHÔNG được vẽ (đúng quyết định «ẩn» của user)",
    LEGACY.every((k) => !rendered.some((r) => String(r.moduleKey) === k)), "đủ 4/4 ẩn");

  const pass = results.every((r) => r.ok);
  console.log("\n" + "═".repeat(78));
  console.log(pass ? "  KẾT LUẬN: ✅ ĐẠT — «ẩn» ĐÚNG và ⛔ KHÔNG mất quyền (đo bằng hàm + dữ liệu THẬT)"
    : "  KẾT LUẬN: ⛔ CHƯA ĐẠT — xem dòng ❌ ở trên");
  console.log("═".repeat(78));
  process.exitCode = pass ? 0 : 1;
}
