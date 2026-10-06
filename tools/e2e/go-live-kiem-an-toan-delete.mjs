// GO-LIVE 05/10/2026 — KIỂM AN TOÀN NHÓM `delete_*` (35 action UI gọi, CHƯA TỪNG được kiểm).
//
// ⛔ NGUYÊN TẮC AN TOÀN CỦA BÀI NÀY (đọc trước khi sửa):
//   Gọi thử `delete_*` lên dữ liệu THẬT là NGUY HIỂM: nếu chốt chặn không tồn tại thì bài test
//   sẽ **XOÁ DỮ LIỆU THẬT**. Vì vậy bài này CHỈ làm 2 việc **không thể mất dữ liệu**:
//     ① gọi với **id KHÔNG TỒN TẠI** ⇒ chỉ kiểm cách xử lý lỗi (⛔ không 500, phải là 400 sạch);
//     ② gọi `delete_project` lên dự án **ĐANG HOẠT ĐỘNG** ⇒ bị **2 lớp chốt độc lập** giữ
//        (trạng thái ≠ closed/archived · thiếu gói archive VERIFIED) ⇒ dù lớp này hỏng thì lớp kia vẫn chặn.
//
// ⭐ BỐI CẢNH ĐÃ ĐO (vì sao nhóm này đáng kiểm):
//   · Quét 214 action: tách «UI THẬT SỰ gọi» (155) khỏi «có ĐIỂM GỌI trong bài kiểm» (86)
//     ⇒ **92 action UI gọi mà CHƯA HỀ được kiểm**, trong đó **35 action `delete_*`**.
//   · ⭐ **`SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE WHERE REFERENCED_TABLE_NAME IS NOT NULL`
//     = 0** trên **131 bảng** ⇒ **TOÀN BỘ SCHEMA KHÔNG CÓ KHOÁ NGOẠI**. Nghĩa là **⛔ không có lưới an toàn
//     ở tầng CSDL**: toàn bộ tính toàn vẹn tham chiếu phụ thuộc **duy nhất** vào chốt chặn ở tầng ứng dụng.
//     ⇒ Chốt chặn thiếu ở MỘT action là **dữ liệu mồ côi im lặng**, ⛔ không có gì báo.
import { readFileSync } from "node:fs";
import { login, call, coThat, buoc, tomTatBuoc, ghi, bootstrap } from "./client.mjs";

const tt = JSON.parse(readFileSync("tools/e2e/trang-thai-01.json", "utf8"));
const MK_ADMIN = "Admin123456@";
const BC = [];
const MA_LA = "E2E_KHONG_TON_TAI_9f3c";

console.log("=".repeat(78));
console.log("GO-LIVE — KIỂM AN TOÀN NHÓM delete_* (35 action UI gọi chưa hề được kiểm)");
console.log("=".repeat(78));
console.log("⛔ Bài này ⛔ KHÔNG xoá dữ liệu thật: chỉ dùng id KHÔNG TỒN TẠI + dự án ĐANG HOẠT ĐỘNG.");

await login("admin", MK_ADMIN);
const bs = await bootstrap();

// ── A · 8 action delete_* với id KHÔNG TỒN TẠI ⇒ phải 400 sạch, ⛔ KHÔNG 500 ────────────────
console.log("\n═══ A · xử lý lỗi khi id KHÔNG tồn tại (⛔ không được 500) ═══");
/** [action, payload id] — ĐỌC TỪ mã UI (⛔ không đoán). */
const MAU = [
  ["delete_project", { projectId: MA_LA }],
  ["delete_user", { userId: MA_LA }],
  ["delete_supplier", { supplierId: MA_LA }],
  ["delete_partner", { partnerId: MA_LA }],
  ["delete_material_subcategory", { subcategoryId: MA_LA }],
  // ⛔ KHOÁ THẬT của action này KHÁC các action còn lại: `organizationUnitId` + `moduleKey`
  //    (`app/page.tsx`: `delete_department_permission", { organizationUnitId: deptId, moduleKey: … }`)
  //    — tôi đã đoán `permissionId` và SAI. Đọc từ mã, ⛔ không đoán.
  ["delete_department_permission", { organizationUnitId: MA_LA, moduleKey: MA_LA }],
  ["delete_workflow", { workflowId: MA_LA }],
  ["delete_notification_config", { configId: MA_LA }],
];
let aSach = 0;
for (const [action, payload] of MAU) {
  const r = await call(action, payload, { boQuaLoi: true, nhan: `A-${action}` });
  const la500 = r.status >= 500;
  const sach = !r.ok && !la500 && !!r._loi;
  if (sach) aSach++;
  console.log(`   ${sach ? "✔" : "⛔"} ${action.padEnd(30)} HTTP ${String(r.status).padEnd(4)} ${la500 ? "⛔ 500 (LỖI HỆ THỐNG)" : String(r._loi || r.message || "").slice(0, 62)}`);
}
console.log(`   → ${aSach}/${MAU.length} trả lỗi SẠCH (⛔ không 500)`);

// ── B · CHỐT CHẶN `delete_project` trên dự án ĐANG HOẠT ĐỘNG ────────────────────────────────
console.log("\n═══ B · chốt chặn `delete_project` (dự án ĐANG HOẠT ĐỘNG — 2 lớp độc lập giữ) ═══");
const duAn = bs.projects.find((p) => String(p.id) === String(tt.duAn)) || bs.projects[0];
console.log(`   dự án: ${duAn?.code} · status=${duAn?.status}`);
// Gửi ĐÚNG mã dự án ⇒ vượt được lớp «xác nhận mã», để lớp TRẠNG THÁI phải ra tay.
const bKhongXoa = await call("delete_project", { projectId: duAn?.id, confirmCode: String(duAn?.code || "") },
  { boQuaLoi: true, nhan: "B-chot-trang-thai" });
const conNguyen = !!(await (async () => {
  await login("admin", MK_ADMIN);
  const lai = await bootstrap();
  return (lai.projects || []).some((p) => String(p.id) === String(duAn?.id));
})());
console.log(`   gọi với confirmCode ĐÚNG ⇒ HTTP ${bKhongXoa.status} · ${String(bKhongXoa._loi || bKhongXoa.message || "").slice(0, 90)}`);
console.log(`   ${conNguyen ? "✔" : "⛔⛔"} dự án vẫn CÒN NGUYÊN (⛔ không bị xoá)`);

// Đối chứng âm: confirmCode SAI ⇒ phải bị chặn bởi lớp «xác nhận mã»
const bSaiMa = await call("delete_project", { projectId: duAn?.id, confirmCode: "SAI-MA-XYZ" },
  { boQuaLoi: true, nhan: "B-sai-ma" });
const chanSaiMa = !bSaiMa.ok;
console.log(`   ${chanSaiMa ? "✔" : "⛔"} confirmCode SAI ⇒ bị chặn: ${String(bSaiMa._loi || "").slice(0, 80)}`);

// ── KẾT LUẬN ─────────────────────────────────────────────────────────────────────────────
const ket = [
  [`A · ${aSach}/${MAU.length} action delete_* trả lỗi SẠCH khi id sai (⛔ không 500)`, aSach === MAU.length],
  ["B · dự án ĐANG HOẠT ĐỘNG ⛔ KHÔNG bị xoá (chốt trạng thái)", conNguyen],
  ["B · confirmCode SAI ⇒ bị chặn", chanSaiMa],
];
console.log("\n═══ KẾT LUẬN ═══");
let dat = 0;
for (const [ten, ok] of ket) { console.log(`   ${ok ? "✔" : "⛔"} ${ten}`); if (ok) dat++; }
console.log(`   ĐẠT ${dat}/${ket.length}`);

ghi("go-live-kiem-an-toan-delete", { dat, tong: ket.length, ket, aSach });
console.log("\n" + tomTatBuoc("KIỂM AN TOÀN delete_*", BC));
if (dat < ket.length) process.exitCode = 1;
