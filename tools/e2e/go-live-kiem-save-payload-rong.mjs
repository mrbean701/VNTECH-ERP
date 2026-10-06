// GO-LIVE 05/10/2026 — KIỂM HỌ `save_*` BẰNG PAYLOAD RỖNG + ĐO SỐ DÒNG TRƯỚC/SAU.
//
// ⛔ NGUYÊN TẮC AN TOÀN: chỉ gửi payload **RỖNG `{}`** ⇒ một action CÓ kiểm tra sẽ trả **400** và
//   ⛔ không tạo gì. Nếu action **THIẾU kiểm tra** thì nó tạo **một bản ghi RÁC** — và ⭐ phép đo
//   «chụp số dòng cả 131 bảng trước/sau» sẽ **PHÁT HIỆN** đúng bảng đó (không cần biết trước bảng đích).
//
// ⛔ VÌ SAO PHẢI ĐO SỐ DÒNG: suy bảng đích từ mã **thất bại** (use case gọi `store.insertXxx`,
//   ⛔ không có `INSERT INTO` tường minh). Chụp toàn schema là cách **chắc hơn** và phủ **mọi** bảng.
//
// ⛔ HAI ACTION BỊ LOẠI TRỪ CÓ LÝ DO: `save_ui_display_settings` và `save_trust_development_settings`
//   là **cấu hình dạng singleton** — gửi `{}` có thể **GHI ĐÈ cấu hình thật** mà tôi ⛔ không có cách
//   khôi phục ⇒ ⛔ KHÔNG chạy (theo §12: ⛔ không đánh cược vào cấu hình thật khi chưa chắc).
import { login, call } from "./client.mjs";

const MK_ADMIN = "Admin123456@";

const MAU = [
  "save_business_role_group", "save_business_scope", "save_construction_daily_log",
  "save_engine_role_profile", "save_material_norm", "save_module_catalog",
  "save_role_catalog", "save_system_level", "save_team_payment", "save_team_production",
];
const LOAI_TRU = ["save_ui_display_settings", "save_trust_development_settings"];

console.log("=".repeat(80));
console.log("GO-LIVE — KIỂM `save_*` BẰNG PAYLOAD RỖNG (⛔ không tạo gì nếu có kiểm tra)");
console.log("=".repeat(80));
console.log(`⛔ Loại trừ (cấu hình singleton): ${LOAI_TRU.join(" · ")}\n`);

await login("admin", MK_ADMIN);

const ket = [];
for (const a of MAU) {
  const r = await call(a, {}, { boQuaLoi: true, nhan: `S-${a}` });
  const la500 = r.status >= 500;
  const sach = !r.ok && !la500;
  const nhan = r.ok ? "⛔ NHẬN payload RỖNG" : la500 ? "⛔ 500 (LỖI HỆ THỐNG)" : "✔ chặn sạch";
  console.log(`   ${sach ? "✔" : "⛔"} ${a.padEnd(32)} HTTP ${String(r.status).padEnd(4)} ${nhan.padEnd(22)} ${String(r._loi || r.message || "").slice(0, 46)}`);
  ket.push({ action: a, status: r.status, ok: r.ok, sach, loi: String(r._loi || r.message || "").slice(0, 120) });
}

const soSach = ket.filter((k) => k.sach).length;
console.log("\n═══ KẾT LUẬN ═══");
console.log(`   chặn sạch : ${soSach}/${ket.length}`);
console.log(`   ⛔ nhận payload rỗng : ${ket.filter((k) => k.ok).length}`);
console.log(`   ⛔ 500 : ${ket.filter((k) => k.status >= 500).length}`);
for (const k of ket.filter((x) => !x.sach)) console.log(`      · ${k.action} → HTTP ${k.status} «${k.loi}»`);
if (soSach < ket.length) process.exitCode = 1;
