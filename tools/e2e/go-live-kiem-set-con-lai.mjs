// GO-LIVE 05/10/2026 — KIỂM **8 `set_*` CHƯA TỪNG TEST** (đo bằng cách đếm: 22/30 đã có trong bài test).
//
// ⚠️ 4 TRONG 8 LÀ ACTION NHẠY CẢM: `set_user_status` · `set_user_system_level` · `set_role_status` ·
//    `set_workflow_status` ⇒ ⛔ CHÚNG CÓ THỂ ẢNH HƯỞNG QUYỀN/TRUY CẬP TOÀN HỆ THỐNG.
//
// ⭐ VÌ SAO KHUÔN NÀY VẪN AN TOÀN: mọi lệnh dùng **ID BỊA** (`KHONG-CO-THUC-THE-NAY-00000000`) ⇒
//    ⛔ **không khớp bất kỳ bản ghi thật nào** ⇒ không thể đổi trạng thái của ai/cái gì ✓
// ⭐ VÀ BÀI NÀY KIỂM **ĐÚNG THỨ CẦN KIỂM**: một action ⛔ **KHÔNG được có TÁC DỤNG PHỤ TOÀN HỆ THỐNG**
//    khi tham số không hợp lệ — ⭐ đó chính xác là loại lỗi của **BUG-20261010**
//    (`delete_department_permission` chạy `syncDepartmentUsers` dù ⛔ không tìm thấy gì).
//
// HAI PHÉP KIỂM CHO MỖI ACTION:
//   ① `{}` (thiếu tham số)            → kỳ vọng **400** (⛔ không được 200)
//   ② `{id bịa + các khoá thường dùng}` → kỳ vọng **400** (⛔ không được 200)
// ⛔ KHÔNG tạo dữ liệu. Kiểm hậu quả: đối chiếu MỌI mảng bootstrap trước/sau + `chup-so-dong.mjs`.
import { readFileSync } from "node:fs";
import { login, call, bootstrap, buoc, tomTatBuoc, tieuDe } from "./client.mjs";

const MK = JSON.parse(readFileSync("tools/e2e/trang-thai-01.json", "utf8")).matKhau;
const BC = [];
const ID = "KHONG-CO-THUC-THE-NAY-00000000";

const DS = [
  { a: "set_approval_stage_status", extra: { stageId: ID, status: "active" } },
  { a: "set_material_category_status", extra: { categoryId: ID, status: "active" } },
  { a: "set_project_team_status", extra: { teamId: ID, status: "active" } },
  { a: "set_role_status", extra: { roleCode: ID, status: "active" } },
  // ⚠️ NHẠY CẢM — người dùng
  { a: "set_user_status", extra: { userId: ID, status: "active" } },
  { a: "set_user_system_level", extra: { userId: ID, levelCode: ID } },
  { a: "set_work_item_participant", extra: { workItemId: ID, userIds: [ID] },
    // ⛔ HAI action ĐÃ ĐĂNG KÝ trong `ActionRbacRegistry` nhưng ⛔ **CHƯA CÀI** ở `SystemController`
    //    (rơi vào nhánh mặc định: «Action … chưa được triển khai trên backend Java»).
    //    Đo được (TASK-187): `add_work_item_comment` · `set_work_item_participant` — và ⭐ **⛔ KHÔNG
    //    action nào trong hai được UI gọi** ⇒ ⛔ không có tính năng nào hỏng với người dùng.
    //    ⭐ Vì đã BIẾT, bài kiểm phải KỲ VỌNG đúng thông điệp đó — ⛔ nếu không thì nó tạo
    //    **TÍN HIỆU SAI** (exit 1) khiến người sau tưởng có lỗi sản phẩm.
    chuaCai: /chưa được triển khai/i },
  { a: "set_workflow_status", extra: { workflowId: ID, status: "active" } },
];

tieuDe("KIỂM 8 `set_*` CHƯA TỪNG TEST — khuôn ID BỊA (⛔ không đụng bản ghi thật)");
await login("admin", "Admin123456@");
const truoc = await bootstrap();

for (const { a, extra, chuaCai } of DS) {
  await buoc(`① ${a} với payload RỖNG → kỳ vọng 400`, async () => {
    const r = await call(a, {}, { boQuaLoi: true });
    if (r?.ok) throw new Error(`⛔ TRẢ 200 cho payload RỖNG ⇒ ⚠️ kiểm ngay có tác dụng phụ không!`);
    const loi = String(r?._loi || r?.message || "");
    if (chuaCai && chuaCai.test(loi)) return `400 · (đã biết) chưa cài ở backend`;
    return `400 · ${loi.slice(0, 55)}`;
  }, BC);

  await buoc(`② ${a} với ID BỊA → kỳ vọng 400 «Không tìm thấy»`, async () => {
    const r = await call(a, extra, { boQuaLoi: true });
    if (r?.ok) throw new Error(`⛔ TRẢ 200 cho ID BỊA ⇒ ⚠️ KHÔNG kiểm tồn tại, hoặc có TÁC DỤNG PHỤ!`);
    const loi = String(r?._loi || r?.message || "");
    // ⭐ Action ĐÃ BIẾT là chưa cài ⇒ kỳ vọng đúng thông điệp «chưa được triển khai» (⛔ không phải lỗi).
    if (chuaCai && chuaCai.test(loi)) return `400 · (đã biết) chưa cài ở backend`;
    if (!/Không tìm thấy|không tồn tại|Không có|không hợp lệ/i.test(loi))
      throw new Error(`⛔ 400 nhưng THÔNG ĐIỆP LẠ: «${loi.slice(0, 80)}»`);
    return `400 · ${loi.slice(0, 55)}`;
  }, BC);
}

// ── KIỂM HẬU QUẢ LỚP 1: mọi mảng bootstrap ⛔ không được đổi ────────────────────────────────
const sau = await bootstrap();
const KHOA = Object.keys(truoc).filter((k) => Array.isArray(truoc[k]));
let doi = 0;
for (const k of KHOA) {
  const t = truoc[k].length, s2 = (sau[k] || []).length;
  if (t !== s2) { console.log(`   ⛔ ${k}: ${t} → ${s2} — ĐÃ ĐỔI!`); doi++; }
}
console.log(`   HẬU QUẢ lớp 1 — đối chiếu ${KHOA.length} mảng bootstrap: ${doi === 0 ? "✔ KHÔNG mảng nào đổi" : `⛔ ${doi} mảng ĐÃ ĐỔI`}`);

console.log("\n" + tomTatBuoc("KIỂM 8 `set_*` CHƯA TEST", BC));
process.exitCode = BC.some((b) => b.loi) ? 1 : 0;
