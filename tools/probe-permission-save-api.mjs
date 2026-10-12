// BẮT LỖI «BẤM LƯU KHÔNG LƯU ĐƯỢC QUYỀN» — ĐO ĐƯỜNG API THẬT.
//
// Hai nghi phạm (đọc mã, ⛔ chưa kết luận — bài học D-081 «đo, đừng đoán»):
//   (A) FRONTEND BỎ KHOÁ: payload `save_user_access` map qua `configuredModules(data)`
//       (61 khoá) trong khi ma trận vẽ 77 khoá ⇒ 16 khoá (`admin_tab_01..14`, `admin`,
//       `reports`) ⛔ không bao giờ tới server.  ← đã đo bằng
//       `tools/probe-permission-save-keyset.mjs`
//   (B) BACKEND CHẶN THEO ROLE: `UserManagementUseCase.saveUserAccess:259`
//       `rbac.requireRole(principalAsCurrent(principal), List.of("admin"))` ⇒ người dùng
//       ĐƯỢC CẤP quyền module `admin` (mở được modal, tick được) nhưng role ≠ `admin`
//       ⇒ lưu bị TỪ CHỐI.
//
// Phép đo này phân biệt (A) và (B) bằng HTTP thật, trên tài khoản probe RIÊNG
// (⛔ không đụng tài khoản thật):
//   · B1: admin thật lưu `admin_tab_01` cho user đích → đọc lại xem có persisted không
//         ⇒ nếu CÓ, backend CHẤP NHẬN `admin_tab_NN` ⇒ (A) là nguyên nhân gốc khả thi.
//   · B2: user role≠admin nhưng ĐƯỢC CẤP quyền `admin` gọi cùng API ⇒ ghi HTTP status
//         ⇒ nếu 403/400, (B) là nguyên nhân gốc thứ hai.
//
//   node tools/probe-permission-save-api.mjs [base] [adminUser] [adminPass]

const BASE = process.argv[2] || "http://127.0.0.1:9000";
const ADMIN = process.argv[3] || "admin";
const ADMIN_PASS = process.argv[4] || "Admin123456@";
const STAFF_PASS = "Engineer@2026";

const login = async (u, p) => {
  const r = await fetch(BASE + "/api/system", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "login", username: u, password: p }),
  });
  const cookie = (r.headers.getSetCookie?.() || []).map((c) => c.split(";")[0]).join("; ");
  return { ok: r.status === 200, cookie, status: r.status };
};
const post = async (cookie, action, payload = {}) => {
  const r = await fetch(BASE + "/api/system", {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ action, ...payload }),
  });
  let j = null;
  try { j = await r.json(); } catch {}
  return { status: r.status, json: j };
};
const boot = async (cookie) => {
  const r = await fetch(BASE + "/api/system", { headers: { cookie } });
  let j = null;
  try { j = await r.json(); } catch {}
  return { status: r.status, json: j };
};

console.log("═".repeat(74));
console.log("  ĐO ĐƯỜNG LƯU PHÂN QUYỀN QUA API THẬT");
console.log("═".repeat(74));

const adm = await login(ADMIN, ADMIN_PASS);
console.log(`  Đăng nhập «${ADMIN}»: HTTP ${adm.status}`);
if (!adm.ok) {
  console.error("  ⛔ Không đăng nhập được admin ⇒ KHÔNG đo được. Dừng (không kết luận).");
  process.exit(1);
}
const adminBoot = await boot(adm.cookie);
console.log(`  Vai trò: role=${adminBoot.json?.data?.user?.role} · ${adminBoot.json?.data?.user?.fullName}`);

const stamp = Date.now().toString().slice(-6);
const uname = `probe_permsave_${stamp}`;
const mk = await post(adm.cookie, "create_user", {
  username: uname,
  fullName: `Probe lưu quyền ${stamp}`,
  email: `${uname}@test.local`,
  employeeCode: `NV-PPS-${stamp}`,
  role: "engineer",
  password: STAFF_PASS,
  projectIds: [],
});
console.log(`  Tạo user probe «${uname}»: HTTP ${mk.status}${mk.json?.error ? " · " + mk.json.error : ""}`);

// Tìm id của user probe
const after = await boot(adm.cookie);
const target = (after.json?.data?.users || []).find((u) => String(u.username) === uname);
if (!target) {
  console.error("  ⛔ Không tìm thấy user probe trong bootstrap ⇒ dừng.");
  process.exit(1);
}
const targetId = String(target.id);
console.log(`  userId đích = ${targetId}`);

// ── B1: admin thật lưu `admin_tab_01` (+ vài khoá thường) rồi ĐỌC LẠI ──────────────
const payloadB1 = {
  userId: targetId,
  projectScopes: [],
  warehouseScopes: [],
  modulePermissions: [
    { moduleKey: "admin_tab_01", canView: true, canUse: true, canCreate: true, canEdit: true, canApprove: false, canExport: false, permissionExpiresAt: null },
    { moduleKey: "requests", canView: true, canUse: true, canCreate: false, canEdit: false, canApprove: false, canExport: false, permissionExpiresAt: null },
    { moduleKey: "purchasing", canView: true, canUse: false, canCreate: false, canEdit: false, canApprove: false, canExport: false, permissionExpiresAt: null },
  ],
};
const b1 = await post(adm.cookie, "save_user_access", payloadB1);
console.log("");
console.log(`  [B1] admin thật lưu (có admin_tab_01): HTTP ${b1.status}${b1.json?.error ? " · " + b1.json.error : ""}`);

const verify = await boot(adm.cookie);
const saved = (verify.json?.data?.allModulePermissions || []).filter((p) => String(p.userId) === targetId);
const byKey = new Map(saved.map((p) => [String(p.moduleKey), p]));
const hasAdminTab = byKey.has("admin_tab_01") && Number(byKey.get("admin_tab_01").canView) === 1;
const hasReq = byKey.has("requests") && Number(byKey.get("requests").canView) === 1;
const hasPur = byKey.has("purchasing") && Number(byKey.get("purchasing").canView) === 1;

console.log(`  [B1] Đọc lại: ${saved.length} dòng quyền của user đích`);
console.log(`       · admin_tab_01 persisted : ${hasAdminTab ? "✅ CÓ" : "❌ KHÔNG"}`);
console.log(`       · requests     persisted : ${hasReq ? "✅ CÓ" : "❌ KHÔNG"}`);
console.log(`       · purchasing   persisted : ${hasPur ? "✅ CÓ" : "❌ KHÔNG"}`);

// ── B2 (PA-1 — `DEC-20261008-001`): cấp `admin_tab_06` + `canView` rồi CHÍNH HỌ gọi ─────
// ⚠️ ĐÍNH CHÍNH phép đo cũ: bản trước cấp module **`admin`** và kỳ vọng điều đó là đủ. SAI —
//    UI (`AdminUserModalTabs.hasAdminTab:22` · `page.tsx:3433`) đòi **`admin_tab_06`** + `canView`.
//    PA-1 làm backend khớp ĐÚNG luật đó ⇒ phép đo phải cấp ĐÚNG khoá UI đòi.
//    (Đo lại sau PA-1 cho ra thông điệp 403 KHÁC: «chưa được cấp đúng quyền» thay vì
//     «chưa được khai báo quyền» ⇒ chứng minh registry đã có khoá và guard đã tới bước kiểm quyền.)
const grantTab06 = await post(adm.cookie, "save_user_access", {
  userId: targetId,
  projectScopes: [],
  warehouseScopes: [],
  modulePermissions: [
    // CỐ Ý chỉ bật `canView` — đúng mức tối thiểu mà `hasAdminTab` kiểm.
    { moduleKey: "admin_tab_06", canView: true, canUse: false, canCreate: false, canEdit: false, canApprove: false, canExport: false, permissionExpiresAt: null },
    // ⭐ S-1 — admin cấp SẴN `requests` (v/u/c) để bước B2 của chính họ KHÔNG phải «thêm» gì.
    { moduleKey: "requests", canView: true, canUse: true, canCreate: true, canEdit: false, canApprove: false, canExport: false, permissionExpiresAt: null },
  ],
});
console.log("");
console.log(`  [B2] Admin cấp «admin_tab_06» + «requests»(v/u/c) cho user probe: HTTP ${grantTab06.status}${grantTab06.json?.error ? " · " + grantTab06.json.error : ""}`);

const staff = await login(uname, STAFF_PASS);
console.log(`  [B2] Đăng nhập bằng user probe (role=engineer): HTTP ${staff.status}`);
const staffBoot = await boot(staff.cookie);
const staffHasTab06 = (staffBoot.json?.data?.modulePermissions || []).some(
  (p) => String(p.moduleKey) === "admin_tab_06" && Number(p.canView) === 1,
);
console.log(`  [B2] Bootstrap của họ xác nhận CÓ «admin_tab_06» + canView: ${staffHasTab06 ? "✅ CÓ" : "❌ KHÔNG"}`);

// ⚠️ ĐÍNH CHÍNH (S-1, 08/10/2026): bản CŨ của B2 gửi payload **THÊM `requests` mà tài khoản CHƯA có**
//    ⇒ đó ⭐ CHÍNH LÀ «tự nâng quyền» ⇒ S-1 chặn 403 là **ĐÚNG**, ⛔ không phải lỗi sản phẩm.
//    NAY: B2 giữ **ĐÚNG tập đang có** (admin_tab_06 + requests v/u/c) ⇒ ⛔ không thêm gì ⇒ PHẢI 200.
const b2 = await post(staff.cookie, "save_user_access", {
  userId: targetId,
  projectScopes: [],
  warehouseScopes: [],
  modulePermissions: [
    { moduleKey: "admin_tab_06", canView: true, canUse: false, canCreate: false, canEdit: false, canApprove: false, canExport: false, permissionExpiresAt: null },
    { moduleKey: "requests", canView: true, canUse: true, canCreate: true, canEdit: false, canApprove: false, canExport: false, permissionExpiresAt: null },
  ],
});
console.log(`  [B2] User (role≠admin, có «admin_tab_06») lưu GIỮ NGUYÊN tập đang có: HTTP ${b2.status}${b2.json?.error ? " · " + b2.json.error : ""}`);

// ⭐ B2c — CHỨNG MINH GHI THẬT bằng chiều ĐI XUỐNG (thu hồi `requests.canCreate` của CHÍNH MÌNH).
//    ⚠️ S-1 chỉ chặn chiều ĐI LÊN ⇒ thu hồi PHẢI được phép ⇒ đây là phép thử «ghi thật» hợp lệ.
const b2c = await post(staff.cookie, "save_user_access", {
  userId: targetId,
  projectScopes: [],
  warehouseScopes: [],
  modulePermissions: [
    { moduleKey: "admin_tab_06", canView: true, canUse: false, canCreate: false, canEdit: false, canApprove: false, canExport: false, permissionExpiresAt: null },
    { moduleKey: "requests", canView: true, canUse: true, canCreate: false, canEdit: false, canApprove: false, canExport: false, permissionExpiresAt: null },
  ],
});
console.log(`  [B2c] User TỰ THU HỒI `+"`requests.canCreate`"+` của mình (chiều ĐI XUỐNG): HTTP ${b2c.status}${b2c.json?.error ? " · " + b2c.json.error : ""}`);

// ⭐ B2b — ĐỌC LẠI để chứng minh lệnh Lưu của NON-ADMIN **CÓ GHI THẬT** (⛔ không chỉ trả 200).
// Marker phân biệt: B1 đặt `requests.canCreate = FALSE`, B2 đặt `requests.canCreate = TRUE`
// ⇒ nếu sau B2 đọc lại thấy `canCreate = 1` thì payload của non-admin ĐÃ được ghi xuống CSDL.
const afterB2 = await boot(adm.cookie);
const targetRow = (afterB2.json?.data?.allModulePermissions || []).filter((p) => String(p.userId) === targetId);
const reqRow = targetRow.find((p) => String(p.moduleKey) === "requests");
const tab06Row = targetRow.find((p) => String(p.moduleKey) === "admin_tab_06");
const b2Wrote = Number(reqRow?.canCreate) === 0 && Number(tab06Row?.canView) === 1 && targetRow.length >= 2;
console.log(`  [B2b] ĐỌC LẠI: ${targetRow.length} dòng quyền của tài khoản đích`);
console.log(`        · requests.canCreate = ${Number(reqRow?.canCreate ?? -1)} (⛔ KHÔNG phải 1 — B2c đã THU HỒI) ⇒ ${Number(reqRow?.canCreate) === 0 ? "✅ THU HỒI ĐÃ GHI" : "❌ chưa ghi"}`);
console.log(`        · admin_tab_06.canView = ${Number(tab06Row?.canView ?? -1)} ⇒ ${Number(tab06Row?.canView) === 1 ? "✅ ĐÃ GHI" : "❌ chưa ghi"}`);

// ── B3 — ĐỐI CHỨNG ÂM: user MỚI, ⛔ KHÔNG có quyền nào ⇒ PHẢI 403 (cổng còn hiệu lực) ────
const uname2 = `probe_permdeny_${stamp}`;
const mk2 = await post(adm.cookie, "create_user", {
  username: uname2, fullName: `Probe bị chặn ${stamp}`, email: `${uname2}@test.local`,
  employeeCode: `NV-PPD-${stamp}`, role: "engineer", password: STAFF_PASS, projectIds: [],
});
const after2 = await boot(adm.cookie);
const target2 = (after2.json?.data?.users || []).find((u) => String(u.username) === uname2);
const staff2 = await login(uname2, STAFF_PASS);
const b3 = await post(staff2.cookie, "save_user_access", {
  userId: String(target2?.id || ""),
  projectScopes: [],
  warehouseScopes: [],
  modulePermissions: [{ moduleKey: "requests", canView: true, canUse: false, canCreate: false, canEdit: false, canApprove: false, canExport: false, permissionExpiresAt: null }],
});
console.log("");
console.log(`  [B3] ĐỐI CHỨNG ÂM — user probe #2 (⛔ không quyền nào) tạo: HTTP ${mk2.status}`);
console.log(`  [B3] User ⛔ không quyền gọi save_user_access: HTTP ${b3.status}${b3.json?.error ? " · " + b3.json.error : ""}`);

// ── B4/B5/B6 — ⭐ S-1 (USER CHỐT 08/10/2026 — `DEC-20261008-002`) — «chặn tự nâng quyền cho mình,
//    ngoại lệ chỉ có tài khoản ADMIN thích làm gì thì làm.» Đo ĐỦ **3 CHIỀU**:
//      B4 ⛔ TỰ CẤP THÊM (leo thang)                ⇒ PHẢI 403
//      B5 ⛔ KHÔNG ĐƯỢC CHẶN OAN: giữ nguyên quyền  ⇒ PHẢI 200
//      B6 ⛔ KHÔNG ĐƯỢC CHẶN OAN: cấp cho NGƯỜI KHÁC ⇒ PHẢI 200
console.log("");
console.log("  ── S-1 — CHẶN TỰ NÂNG QUYỀN (đo 3 chiều) ──");

const b4 = await post(staff.cookie, "save_user_access", {
  userId: targetId,
  projectScopes: [],
  warehouseScopes: [],
  modulePermissions: [
    { moduleKey: "admin_tab_06", canView: true, canUse: false, canCreate: false, canEdit: false, canApprove: false, canExport: false, permissionExpiresAt: null },
    { moduleKey: "admin", canView: true, canUse: true, canCreate: true, canEdit: true, canApprove: false, canExport: false, permissionExpiresAt: null },
  ],
});
console.log(`  [B4] NON-ADMIN TỰ CẤP THÊM module «admin» cho mình: HTTP ${b4.status}${b4.json?.error ? " · " + b4.json.error : ""}`);

const b5 = await post(staff.cookie, "save_user_access", {
  userId: targetId,
  projectScopes: [],
  warehouseScopes: [],
  modulePermissions: [
    { moduleKey: "admin_tab_06", canView: true, canUse: false, canCreate: false, canEdit: false, canApprove: false, canExport: false, permissionExpiresAt: null },
    // ⚠️ Giữ ĐÚNG mức đang có sau B2c: `requests` canCreate = FALSE (⛔ KHÔNG bật lại — bật lại là LEO THANG).
    { moduleKey: "requests", canView: true, canUse: true, canCreate: false, canEdit: false, canApprove: false, canExport: false, permissionExpiresAt: null },
  ],
});
console.log(`  [B5] Giữ NGUYÊN quyền đang có (⛔ không thêm gì): HTTP ${b5.status}${b5.json?.error ? " · " + b5.json.error : ""}`);

const b6 = await post(staff.cookie, "save_user_access", {
  userId: String(target2?.id || ""),
  projectScopes: [],
  warehouseScopes: [],
  modulePermissions: [{ moduleKey: "requests", canView: true, canUse: true, canCreate: false, canEdit: false, canApprove: false, canExport: false, permissionExpiresAt: null }],
});
console.log(`  [B6] Cấp quyền cho NGƯỜI KHÁC (⛔ không phải mình): HTTP ${b6.status}${b6.json?.error ? " · " + b6.json.error : ""}`);

console.log("");
console.log("─".repeat(74));
console.log("  PHÂN XỬ");
console.log(`  (A) frontend bỏ 16 khoá      : ${hasAdminTab ? "backend NHẬN admin_tab_01 ⇒ (A) đứng vững" : "backend KHÔNG nhận ⇒ cần xem lại"}`);
console.log(`  (B) PA-1 — admin_tab_06 lưu  : ${b2.status === 200 ? "✅ HTTP 200 ⇒ ĐÃ NỚI ĐÚNG (trước PA-1: 403)" : `❌ vẫn ${b2.status} ⇒ PA-1 CHƯA hiệu lực`}`);
console.log(`  (B2b) GHI THẬT xuống CSDL    : ${b2Wrote ? "✅ đọc lại: requests.canCreate=0 (thu hồi ĐÃ GHI) + admin_tab_06=1 ⇒ lệnh Lưu CÓ hiệu lực" : "❌ đọc lại KHÔNG thấy thay đổi"}`);
console.log(`  (B3) ĐỐI CHỨNG ÂM — ⛔ không quyền: ${b3.status === 403 ? "✅ HTTP 403 ⇒ cổng CÒN hiệu lực (⛔ chưa hở)" : `❌ HTTP ${b3.status} ⇒ ⚠️ CỔNG HỞ, phải xem lại`}`);
const dat = hasAdminTab && b2.status === 200 && b2Wrote && b3.status === 403
  && b4.status === 403 && b5.status === 200 && b6.status === 200;
console.log(`  (B4) S-1 — TỰ NÂNG QUYỀN BỊ CHẶN     : ${b4.status === 403 ? "✅ HTTP 403 ⇒ ⛔ không tự cấp thêm được" : `❌ HTTP ${b4.status} ⇒ ⚠️ VẪN LEO THANG ĐƯỢC`}`);
console.log(`  (B5) S-1 — ⛔ KHÔNG chặn oan (giữ nguyên): ${b5.status === 200 ? "✅ HTTP 200" : `❌ HTTP ${b5.status} ⇒ CHẶN OAN`}`);
console.log(`  (B6) S-1 — ⛔ KHÔNG chặn oan (người khác) : ${b6.status === 200 ? "✅ HTTP 200" : `❌ HTTP ${b6.status} ⇒ CHẶN OAN`}`);
console.log("");
console.log(dat ? "  ✅ KẾT LUẬN: (A) + PA-1 + S-1 ĐỀU ĐÚNG — leo thang bị chặn, ⛔ không chặn oan."
                : "  ⚠️ KẾT LUẬN: có phép kiểm CHƯA ĐẠT — xem các dòng trên.");
process.exit(dat ? 0 : 2);
