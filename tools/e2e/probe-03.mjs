// DÒ QUYỀN + cờ active — Giai đoạn 3. Chỉ đọc, không ghi.
import { login, bootstrap, call, tieuDe } from "./client.mjs";

await login("admin", "Admin123456@");
const bs = await bootstrap();

tieuDe("FLAGS TAI KHOAN");
for (const u of bs.users || []) {
  console.log("  " + String(u.username).padEnd(16) + " role=" + String(u.role).padEnd(11) +
    " active=" + String(u.active) + " mustChangePassword=" + String(u.mustChangePassword) +
    " roleBase=" + String(u.roleBase ?? ""));
}

tieuDe("KEYS CUA userScopes[0] / permission lien quan");
const us = bs.userScopes || [];
console.log("  userScopes: " + us.length + " ban ghi");
if (us[0]) {
  console.log("  keys: " + Object.keys(us[0]).join(", "));
  console.log("  mau: " + JSON.stringify(us[0]).slice(0, 600));
}
console.log("\n  bs.user (dang nhap): " + JSON.stringify(bs.user));

tieuDe("QUYEN MODULE CUA TAI KHOAN E2E");
for (const u of bs.users || []) {
  const row = (us || []).find((s) => String(s.userId) === String(u.id));
  const mods = row ? (row.modulePermissions || []).map((m) => (m.canUse ? m.moduleKey : m.moduleKey + "(view)")).join(" ") : "-";
  console.log("  " + String(u.username).padEnd(16) + " :: " + (mods || "(khong co quyen module)"));
}

tieuDe("THU QUYEN GHI CUA TAI KHOAN E2E.NS (probe read-only bang list action)");
// Dùng action có sẵn & chỉ đọc để kiểm phiên đăng nhập được không.
try {
  await login("e2e.ns", "Vn@2026Test");
  const bs2 = await bootstrap();
  console.log("  LOGIN e2e.ns: OK · bootstrap khoa=" + Object.keys(bs2).length +
    " · hrRecords=" + (bs2.hrRecords || []).length +
    " · laborContracts=" + (bs2.laborContracts || []).length +
    " · benefitRecords=" + (bs2.benefitRecords || []).length);
  console.log("  bs2.user = " + JSON.stringify(bs2.user));
  const r = await call("get_hr_records", {}, { boQuaLoi: true });
  console.log("  get_hr_records → ok=" + r.ok + " loi=" + r._loi);
} catch (e) {
  console.log("  LOGIN e2e.ns THAT BAI: " + e.message);
}
await login("admin", "Admin123456@");
