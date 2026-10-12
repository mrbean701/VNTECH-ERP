#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
// PROBE `Q-PERM-01` — CỔNG QUYỀN Ô CHỌN «Xem việc của» (`work_others`) CÓ MỞ ĐÚNG CHO **TRƯỞNG PHÒNG/GIÁM ĐỐC**?
// Phiên: ERP-SESSION-04 (`SESSION_D`) · 09/10/2026 · ⚠️ CHỈ ĐỌC (⛔ không ghi CSDL, ⛔ không đăng nhập tài khoản khác)
//
// VÌ SAO: `WorkCenter.tsx` gate bằng biểu thức: `canViewOthers = modulePermission(data,"work_others").canView`
//   và `modulePermission` (lib/permissions.ts:15-19) đọc **`data.modulePermissions`** = quyền của CHÍNH user.
//   ⚠️ KHÔNG thể đăng nhập tài khoản trưởng phòng (⚠️ phiên trình duyệt đang là của user) ⇒ ⭐ mô phỏng
//   ĐÚNG đầu vào thật: lấy payload `admin` (chứa `allModulePermissions` = quyền MỌI user) ⇒ cắt ra quyền của
//   từng tài khoản trưởng phòng ⇒ chạy **HÀM FE THẬT** ⇒ khẳng định cổng mở/đóng đúng ✓
//
// CÁCH DÙNG: node --import tsx docs/dsh-mutil-session/SESSION_D/probes/verify-cong-work_others.mjs
// MÃ TRẢ VỀ: 0 = ĐẠT · 1 = SAI (cổng ⛔ không mở/không đóng như kỳ vọng) · 2 = ⛔ không đủ số đo
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════

import { modulePermission } from "../../../../lib/permissions.ts";

const BASE = process.env.VNTECH_API || "http://127.0.0.1:9000";
const LOGIN = { username: "admin", password: "Admin123456@" };

// 5 tài khoản ĐÃ ĐƯỢC CẤP `work_others` lúc 16:29 (USER chốt «cấp») — ⚠️ nguồn: `CHG-20261009-D39`
const DA_CAP = [
  { id: "USR_c51d95b2-8f98-4f01-9daa-0b64d0037b7d", ten: "trdademo", vaiTro: "da_truong", nhan: "Trưởng phòng Dự án" },
  { id: "USR_9021140a-3cb4-4a01-a958-d88a3bc8c722", ten: "e2e.kh", vaiTro: "kh_truong", nhan: "Trưởng phòng Kế hoạch" },
  { id: "USR_a5cd3bc6-f7b4-468f-af3b-103170fc0b2c", ten: "trinhtrench", vaiTro: "kh_truong", nhan: "Trưởng phòng Kế hoạch B" },
  { id: "USR_e66f85ff-96ad-40d5-a632-10be87ab10d5", ten: "e2e.bgd", vaiTro: "director", nhan: "Giám đốc" },
  { id: "USR_p2_giamdoc_demo", ten: "giamdoc.demo", vaiTro: "director", nhan: "Giám đốc" },
];

const dong = "═".repeat(96);
console.log(dong);
console.log("PROBE Q-PERM-01 — cổng `work_others` (ô chọn «Xem việc của») có mở cho TRƯỞNG PHÒNG / GIÁM ĐỐC?");
console.log(`⏱  ${new Date().toISOString()} · phiên ERP-SESSION-04 · ⚠️ CHỈ ĐỌC · hàm THẬT: lib/permissions.ts`);
console.log(dong);

const login = await fetch(`${BASE}/api/system`, {
  method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "login", ...LOGIN }),
});
if (login.status >= 500) { console.log(`⚠️ login HTTP ${login.status} (API đang restart) ⇒ ⛔ KHÔNG ĐỦ SỐ ĐO`); process.exitCode = 2; }
else if (login.status !== 200) { console.log(`⚠️ login HTTP ${login.status} ⇒ ⛔ KHÔNG ĐỦ SỐ ĐO`); process.exitCode = 2; }
else {
  const cookie = (login.headers.getSetCookie?.() || []).map((c) => c.split(";")[0]).join("; ");
  const data = (await fetch(`${BASE}/api/system`, { headers: { cookie }, cache: "no-store" }).then((r) => r.json()))?.data || {};
  const all = data.allModulePermissions || [];
  console.log(`📦 payload: allModulePermissions = ${all.length} dòng (⚠️ quyền của MỌI user — chỉ admin nhận được)`);

  let sai = 0;
  for (const u of DA_CAP) {
    const cuaUser = all.filter((r) => String(r.userId) === u.id);
    // ① MÔ PHỎNG ĐÚNG đầu vào thật: user = tài khoản TP/GĐ (⛔ KHÔNG phải admin) + quyền CỦA HỌ
    const dataThat = { ...data, user: { id: u.id, role: u.vaiTro, roleBase: u.vaiTro, fullName: u.ten }, modulePermissions: cuaUser };
    const mo = modulePermission(dataThat, "work_others").canView;
    // ② ĐỐI CHỨNG ÂM: cùng user nhưng ⛔ BỎ dòng `work_others` (⚠️ = trạng thái TRƯỚC khi cấp) ⇒ phải ĐÓNG
    const dataTruoc = { ...dataThat, modulePermissions: cuaUser.filter((r) => String(r.moduleKey) !== "work_others") };
    const dong2 = modulePermission(dataTruoc, "work_others").canView;
    const ok = mo === true && dong2 === false;
    if (!ok) sai++;
    console.log(`   ${ok ? "✅" : "🔴"} ${u.ten.padEnd(14)} (${u.vaiTro.padEnd(10)} · ${u.nhan}) ⇒ SAU cấp: canView=${mo} · TRƯỚC cấp (đối chứng âm): canView=${dong2} · quyền của họ = ${cuaUser.length} dòng`);
  }
  console.log(dong);
  if (sai === 0) { console.log("✅ KẾT LUẬN: cổng `work_others` MỞ cho CẢ 5 tài khoản TP/GĐ ⭐ và ĐÓNG khi ⛔ chưa cấp (đối chứng âm đạt) ⇒ ô chọn «Xem việc của» SẼ HIỆN cho họ ✓"); process.exitCode = 0; }
  else { console.log(`🔴 KẾT LUẬN: ${sai} tài khoản ⛔ KHÔNG đúng kỳ vọng ⇒ xem chi tiết ở trên`); process.exitCode = 1; }
}
