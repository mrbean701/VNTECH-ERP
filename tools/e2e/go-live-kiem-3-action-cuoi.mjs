// GO-LIVE 05/10/2026 — BỊT NỐT KHOẢNG TRỐNG BAO PHỦ: 3 action AN TOÀN còn lại trong 19 chưa test.
//
// BỐI CẢNH: 49 action thật chưa test (đo ở TASK-188) ⇒ đã kiểm 30 (TASK-188) ⇒ còn **19**.
//   Trong 19 đó, **16 BỊ LOẠI TRỪ CÓ LÝ DO** (phá hoại / cấu hình / phiên / email):
//     `factory_reset_preview` · `factory_reset_execute` · `reset_material_catalog_test` · `reset_user_password`
//     `rebuild_department_permissions` · `retry_email` · `reorder_menu_layout` · `delete_unused_materials`
//     `request_license_transfer` · `request_material_master_from_boq` · `revoke_session` · `revoke_user_sessions`
//     `save_form_field_config` · `save_menu_group` · `save_notification_config` · `update_profile_signature`
//   (⭐ `revoke_user_sessions` đặc biệt nguy: nếu id rỗng nó có thể **đăng xuất chính người gọi**)
//
// ⇒ BÀI NÀY kiểm **3 action AN TOÀN** cuối cùng, cùng tiêu chí như TASK-188:
//    ⛔ KHÔNG được 5xx (lỗi máy chủ) · ⛔ KHÔNG được đổi trạng thái.
//    ✅ 400 (thiếu/tệ tham số) hoặc 200 (không tìm thấy ⇒ không làm gì) đều chấp nhận.
import { readFileSync } from "node:fs";
import { login, call, bootstrap, buoc, tomTatBuoc, tieuDe } from "./client.mjs";

const MK = JSON.parse(readFileSync("tools/e2e/trang-thai-01.json", "utf8")).matKhau;
const BC = [];
const ID = "KHONG-CO-THUC-THE-NAY-00000000";
tieuDe("BỊT KHOẢNG TRỐNG: 3 action AN TOÀN cuối cùng (payload RỖNG + ID BỊA)");

const DS = [
  { a: "mark_notification_read", extra: { notificationId: ID, id: ID } },
  { a: "mark_notification_snooze", extra: { notificationId: ID, id: ID, minutes: 5 } },
  // ⚠️ `reverse_stock_movement` có thể ĐẢO một bút toán kho — nhưng với ID BỊA thì ⛔ không khớp
  //    bản ghi thật nào ⇒ an toàn. ⭐ Và đây là ca ĐÁNG KIỂM NHẤT: cùng họ với BUG-012/013.
  { a: "reverse_stock_movement", extra: { movementId: ID, id: ID } },
];

await login("admin", "Admin123456@");
const truoc = await bootstrap();

for (const { a, extra } of DS) {
  for (const [nhan, payload] of [["payload RỖNG", {}], ["ID BỊA", extra]]) {
    await buoc(`${a} · ${nhan} ⇒ ⛔ không 5xx`, async () => {
      const r = await call(a, payload, { boQuaLoi: true });
      const ma = r?.status ?? r?.statusCode ?? r?._status;
      if (typeof ma === "number" && ma >= 500) throw new Error(`⛔ ${ma} — LỖI MÁY CHỦ (LỖI THẬT cần vá)`);
      const loi = String(r?._loi || r?.message || "");
      if (/Exception|NullPointer|Internal Server Error|500/i.test(loi)) throw new Error(`⛔ NGHI 5xx/NPE: «${loi.slice(0, 80)}»`);
      return r?.ok ? "200 (không tìm thấy ⇒ không làm gì)" : `400 · ${loi.slice(0, 50)}`;
    }, BC);
  }
  // ⭐ Kiểm hậu quả NGAY sau mỗi action ⇒ nếu có đổi, biết chắc action nào
  const s = await bootstrap();
  for (const k of Object.keys(truoc)) {
    if (!Array.isArray(truoc[k])) continue;
    if (truoc[k].length !== (s[k] || []).length)
      console.log(`   ⛔ ${a} ĐÃ LÀM ĐỔI mảng «${k}»: ${truoc[k].length} → ${(s[k] || []).length}`);
  }
}
console.log("   HẬU QUẢ — đã đối chiếu mọi mảng bootstrap sau TỪNG action (⛔ dòng ⛔ nào ở trên = có đổi)");

console.log("\n" + tomTatBuoc("BỊT KHOẢNG TRỐNG 3 ACTION AN TOÀN", BC));
process.exitCode = BC.some((b) => b.loi) ? 1 : 0;
