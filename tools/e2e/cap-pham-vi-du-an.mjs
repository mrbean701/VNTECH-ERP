// CẤP PHẠM VI DỰ ÁN CHO CÁC TÀI KHOẢN E2E
// Gặp lỗi thật khi lập phiếu: «Tài khoản không được lập đơn cho dự án này» ⇒ tài khoản chưa có phạm vi (scope) dự án.
// ⚠ save_user_access làm THAY THẾ TOÀN BỘ: nếu gửi modulePermissions rỗng sẽ XOÁ SẠCH quyền của người dùng
//   ⇒ bắt buộc phải nạp lại đúng quyền hiện có rồi gửi lại, chỉ bổ sung phần phạm vi dự án.
import { readFileSync, writeFileSync } from "node:fs";
import { login, bootstrap, coThat, buoc, tomTatBuoc, ghi, tieuDe } from "./client.mjs";

const BC = [];
const tt = JSON.parse(readFileSync("tools/e2e/trang-thai-01.json", "utf8"));
tieuDe("CẤP PHẠM VI DỰ ÁN CHO TÀI KHOẢN E2E");

await login("admin", "Admin123456@");
const bs = await bootstrap();
ghi({ giaiDoan: "5A-2", buoc: "bat-dau" });

// ── Tra các giá trị phạm vi mà hệ thống đang dùng ───────────────────────────
const gtri = [...new Set((bs.userScopes || []).map((s) => s.permission))];
console.log("  giá trị phạm vi đang có trong hệ thống: " + gtri.join(", "));
const QUYEN = gtri.includes("write") ? "write" : (gtri.includes("admin") ? "admin" : gtri[0]);
console.log("  ⇒ dùng '" + QUYEN + "' cho tài khoản E2E");

const khoIds = [tt.khoSite, ...(tt.khoTeam || []).map((k) => k.id)].filter(Boolean);
const ids = new Set([tt.duAn]);

for (const u of tt.users) {
  const hienTai = (bs.userScopes || []).filter((s) => s.userId === u.id);
  const daCo = hienTai.some((s) => ids.has(s.projectId));
  const quyenHienTai = (bs.allModulePermissions || []).filter((p) => p.userId === u.id);

  console.log("\n  " + u.username + " · phạm vi dự án hiện có: " + hienTai.length + " · số quyền chức năng: " + quyenHienTai.length + (daCo ? " → ĐÃ CÓ dự án E2E" : ""));

  // ⛔ Chỉ bỏ qua khi ĐÃ CÓ phạm vi dự án E2E ở mức `write`.
  // Lý do: `create_user` với `projectIds` chỉ gán phạm vi cho 3/7 tài khoản và gán mức `read`,
  // trong khi người duyệt cần `write` mới được phép quyết định.
  if (daCo && hienTai.find((s) => s.projectId === tt.duAn)?.permission === QUYEN) { console.log("      bỏ qua (đã có phạm vi " + QUYEN + ")"); continue; }

  // Giữ nguyên toàn bộ quyền chức năng đang có, chỉ bổ sung phạm vi dự án + kho.
  const modulePermissions = quyenHienTai.map((p) => ({
    moduleKey: p.moduleKey, canView: !!Number(p.canView), canUse: !!Number(p.canUse),
    canCreate: !!Number(p.canCreate), canEdit: !!Number(p.canEdit),
    canApprove: !!Number(p.canApprove), canExport: !!Number(p.canExport),
    permissionExpiresAt: p.permissionExpiresAt || null,
  }));
  if (!modulePermissions.length) { console.log("      [LOI] tài khoản không có quyền nào — không gửi để tránh làm mất dữ liệu"); process.exitCode = 1; continue; }

  // ⚠ Lọc trùng (projectId, warehouseId): nếu gửi 2 dòng cho cùng một dự án sẽ đụng khoá duy nhất
  //   và backend trả «Dữ liệu đã tồn tại» — đó là lỗi payload, KHÔNG phải hệ thống không cho sửa.
  const gopPhamVi = new Map();
  for (const s of [...hienTai.map((s) => ({ projectId: s.projectId, permission: s.permission })), { projectId: tt.duAn, permission: QUYEN }]) {
    if (s.projectId) gopPhamVi.set(s.projectId, s);
  }
  const gopKho = new Map();
  for (const id of khoIds) if (id) gopKho.set(id, { warehouseId: id, permission: QUYEN });

  await buoc("save_user_access " + u.username, () => coThat("save_user_access", {
    userId: u.id,
    projectScopes: [...gopPhamVi.values()],
    warehouseScopes: [...gopKho.values()],
    modulePermissions,
  }), BC);
}

// ── ĐỐI CHIẾU ────────────────────────────────────────────────────────────────
const bs2 = await bootstrap();
console.log("\n  Đối chiếu từ máy chủ:");
let sai = 0;
for (const u of tt.users) {
  const sc = (bs2.userScopes || []).filter((s) => s.userId === u.id);
  const co = sc.filter((s) => s.projectId === tt.duAn);
  const q = (bs2.allModulePermissions || []).filter((p) => p.userId === u.id).length;
  const dung = co.length === 1 && q > 0;
  console.log("      " + u.username.padEnd(10) + " phạmVi=" + String(sc.length).padStart(2) + " · dự án E2E=" + (co.length ? co[0].permission : "KHÔNG") + " · quền=" + q + (dung ? " ✔" : " ✘"));
  if (!dung) sai++;
}
if (sai) { console.log("      [LOI] " + sai + " tài khoản chưa đúng"); process.exitCode = 1; }
ghi({ giaiDoan: "5A-2", buoc: "ket-thuc", thatBai: BC.filter((x) => !x.ok).map((x) => x.ten) });
tomTatBuoc("CẤP PHẠM VI DỰ ÁN", BC);
void writeFileSync;