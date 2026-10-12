// BẮT LỖI «BẤM LƯU KHÔNG LƯU ĐƯỢC QUYỀN» — so sánh TẬP KHOÁ (máy DÒ LỆCH).
//
// LỖI ĐÃ ĐO ĐƯỢC (trước bản vá 07/10/2026):
//   ma trận trong `PermissionAccessPanel` vẽ theo `permissionMenuStructure(data)` =
//   `configuredModules(data)` ∪ `admin_tab_NN` (`app/page.tsx:269-280`), nên panel CÓ ô tick
//   cho 14 khoá `admin_tab_NN`; nhưng payload `save_user_access` map qua `configuredModules(data)`
//   (`app/page.tsx` — `UserEditModal`/`UserAccessModal`) — tập này KHÔNG có `admin_tab_NN`
//   ⇒ tick vào 16 khoá (`admin_tab_01..14` + `admin` + `reports`) bị BỎ QUA.
//   📏 Đo trên bootstrap thật: panel 77 khoá · payload 61 khoá · MẤT 16.
//
// BẢN VÁ: cả panel lẫn hai modal dùng CHUNG `permissionMatrixKeys(data, entries)`.
//
// CÁCH ĐO NÀY ⛔ KHÔNG VÒNG QUANH (không tự chứng minh chính mình):
//   · Tập PAYLOAD  = gọi hàm ĐÃ SHIP `permissionMatrixKeys` (import thật từ tệp nguồn).
//   · Tập PANEL    = DỰNG LẠI ĐỘC LẬP công thức panel vẽ ô tick từ `moduleCatalog` + `entries`.
//   Hai tập phải TRÙNG. Nếu ai đó sửa helper lệch khỏi thứ panel vẽ ⇒ phép đo này ĐỎ.
//
//   node --import tsx tools/probe-permission-save-keyset.mjs [base] [user] [pass]

import { configuredModules } from "../lib/workflow-helpers.ts";
import { permissionMatrixKeys } from "../app/screens/PermissionAccessPanel.tsx";

const BASE = process.argv[2] || "http://127.0.0.1:9000";
const USER = process.argv[3] || "e2e.bgd";
const PASS = process.argv[4] || "Vn@2026Test";

const login = await fetch(BASE + "/api/system", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ action: "login", username: USER, password: PASS }),
});
if (login.status !== 200) {
  console.error(`⛔ Đăng nhập thất bại (HTTP ${login.status}) — không đo được.`);
  process.exit(1);
}
const cookie = (login.headers.getSetCookie?.() || []).map((c) => c.split(";")[0]).join("; ");
const boot = await (await fetch(BASE + "/api/system", { headers: { cookie } })).json();
const data = boot.data || {};
if (!boot.ok) {
  console.error("⛔ Bootstrap không ok — không đo được.");
  process.exit(1);
}

// ── TẬP KHOÁ MÀ PANEL VẼ Ô TICK — DỰNG LẠI ĐỘC LẬP công thức của panel ─────────────
// 1) assignableModules = data.moduleCatalog (active) → key = String(item.moduleKey)
const catalogKeys = (data.moduleCatalog || [])
  .filter((item) => item.active !== false)
  .map((item) => String(item.moduleKey));
// 2) entries = permissionMenuStructure(data) → configuredModules (bỏ admin) ∪ admin_tab_NN
const menuKeys = configuredModules(data)
  .filter((item) => item.key !== "admin")
  .map((item) => String(item.key));
const adminTabKeys = (data.moduleCatalog || [])
  .filter((row) => /^admin_tab_\d{2}$/.test(String(row.moduleKey)) && row.active !== false)
  .map((row) => String(row.moduleKey));
const panelKeys = [...new Set([...catalogKeys, ...menuKeys, ...adminTabKeys])];

// ── TẬP KHOÁ MÀ PAYLOAD `save_user_access` GỬI ĐI — GỌI HÀM ĐÃ SHIP ───────────────
// Dựng `entries` đúng hình dạng `PermissionEntry[]` rồi để chính hàm nguồn tính.
const entries = [...new Set([...menuKeys, ...adminTabKeys])].map((key) => ({
  kind: "module",
  key,
  label: key,
  module: { key },
}));
const submitKeys = permissionMatrixKeys(data, entries);

const submitSet = new Set(submitKeys);
const lostKeys = panelKeys.filter((key) => !submitSet.has(key));
const extraKeys = submitKeys.filter((key) => !panelKeys.includes(key));

console.log("═".repeat(74));
console.log("  ĐO TẬP KHOÁ PHÂN QUYỀN — panel vẽ gì vs payload gửi gì");
console.log("═".repeat(74));
console.log(`  Tài khoản đo        : ${USER} (${data.user?.fullName || "?"})`);
console.log(`  moduleCatalog       : ${(data.moduleCatalog || []).length} dòng`);
console.log(`  Khoá PANEL vẽ ô tick: ${panelKeys.length}`);
console.log(`  Khoá PAYLOAD gửi đi : ${submitKeys.length}`);
console.log("");
if (lostKeys.length === 0) {
  console.log("  ✅ KHÔNG lệch: mọi ô tick người dùng bấm đều được gửi đi.");
} else {
  console.log(`  ❌ LỆCH ${lostKeys.length} khoá — tick vào các ô này BỊ MẤT khi bấm Lưu:`);
  for (const key of lostKeys) {
    const row = (data.moduleCatalog || []).find((r) => String(r.moduleKey) === key);
    console.log(`       · ${key}${row?.label ? " — " + row.label : ""}`);
  }
}
if (extraKeys.length > 0) {
  console.log("");
  console.log(`  ⚠️  ${extraKeys.length} khoá payload gửi NHƯNG panel không vẽ: ${extraKeys.join(", ")}`);
}

console.log("");
console.log("─".repeat(74));
console.log(lostKeys.length === 0
  ? "KẾT LUẬN: đường lưu quyền khớp khoá — lỗi (nếu có) KHÔNG nằm ở đây."
  : "KẾT LUẬN: có khoá panel vẽ mà payload bỏ qua ⇒ NGUYÊN NHÂN GỐC khả thi của «bấm Lưu không lưu».");
process.exit(lostKeys.length === 0 ? 0 : 2);
