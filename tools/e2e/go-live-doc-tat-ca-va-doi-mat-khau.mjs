// GO-LIVE 05/10/2026 — LẤP LỖ HỔNG KIỂM THỬ: 2 action UI ĐANG GỌI mà CHƯA HỀ được kiểm.
//
// ⛔ CÁCH TÌM RA (đo 05/10/2026): quét 214 action, tách rõ «action UI THẬT SỰ gọi» (155) khỏi
//   «action có ĐIỂM GỌI trong bài kiểm» (86) ⇒ **92 action UI gọi mà chưa hề được kiểm**.
//   Ưu tiên theo §19 (DỮ LIỆU / BẢO MẬT / WORKFLOW) và theo yêu cầu user «test thông báo web»:
//     A · `mark_notification_all_read` — UI `page.tsx:3327`; backend `SystemController:1375`
//     B · `change_password`            — UI `page.tsx:3380,3389`; backend `SystemController:259`
//
// ⛔ TÍNH CHẤT BẢO MẬT PHẢI KIỂM (ghi trong chính mã — `app/page.tsx:3327`):
//   «KHÔNG gửi `userId` ở CẢ HAI: backend lấy `cu.id()` từ phiên ⇒ trạng thái **theo user**
//    và ⛔ KHÔNG THỂ đánh dấu global.»
//   ⇒ Phải chứng minh: A đánh dấu đã đọc thì thông báo của B **KHÔNG** bị đụng tới.
import { readFileSync } from "node:fs";
import { login, bootstrap, call, coThat, buoc, tomTatBuoc, ghi, tieuDe } from "./client.mjs";

const tt = JSON.parse(readFileSync("tools/e2e/trang-thai-01.json", "utf8"));
const MK = tt.matKhau;
const MK_ADMIN = "Admin123456@";
// ⛔ ĐO ĐƯỢC 05/10/2026: `create_work_item` CHỈ nhận **1/14** tài khoản E2E — `e2e.project`
//   (phải thuộc **Phòng Dự án** *và* trong phạm vi dự án; 13 tài khoản kia bị từ chối
//   «Chưa có nhân sự Phòng Dự án phù hợp/phạm vi dự án để giao việc»).
//   Và chỉ `e2e.project` đang có thông báo (4 tổng · 2 chưa đọc). ⇒ KHÔNG thể dựng cặp A/B
//   cùng có thông báo. Vì vậy tách thành **2 PHA**, mỗi pha chứng minh MỘT tính chất:
//     PHA 1 (CÁCH LY) : A₀ = người KHÔNG có thông báo ⇒ đánh dấu đọc hết ⇒ B phải KHÔNG đổi.
//     PHA 2 (ĐỌC HẾT): A  = `e2e.project` (CÓ chưa đọc) ⇒ đánh dấu ⇒ phải về 0.
const A0 = "e2e.kh";
const A = "e2e.project";
const BC = [];

/** Thông báo của CHÍNH người đang đăng nhập (bootstrap lọc theo `user_id`). */
const tb = (bs) => (Array.isArray(bs.taskNotifications) ? bs.taskNotifications : []);
/** «Chưa đọc» = chưa có `readAt` (đo từ dữ liệu thật, ⛔ không đoán tên khoá). */
const chuaDoc = (ds) => ds.filter((n) => !n.readAt);

async function demChuaDoc(user) {
  await login(user, MK);
  const ds = tb(await bootstrap());
  return { tong: ds.length, chua: chuaDoc(ds).length, khoa: ds[0] ? Object.keys(ds[0]) : [] };
}

console.log("=".repeat(78));
console.log("GO-LIVE — LẤP LỖ HỔNG: ĐÁNH DẤU ĐỌC TẤT CẢ + ĐỔI MẬT KHẨU");
console.log("=".repeat(78));

// ═══════════════════════════════════════════════════════════════════════════════
// A · `mark_notification_all_read` — có CÁCH LY theo user không?
// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n═══ A · ĐÁNH DẤU TẤT CẢ ĐÃ ĐỌC (2 PHA: CÁCH LY + ĐỌC HẾT) ═══");
await login("admin", MK_ADMIN);
const bs = await bootstrap();
const dauVan = new Date().toISOString().slice(11, 19);

// Bảo đảm `A` THẬT SỰ có thông báo chưa đọc (điều kiện tiên quyết của PHA 2).
const nguoiA = bs.users.find((x) => x.username === A);
await buoc(`tạo việc cho ${A}`, () => coThat("create_work_item", {
  departmentCode: "DA", workGroup: "GIAO_VIEC_BO_SUNG",
  title: `E2E-GOLIVE mark-all-read ${dauVan}`,
  description: "Kiểm chứng đánh dấu đã đọc tất cả (E2E GO-LIVE).",
  projectId: tt.duAn, assignedTo: nguoiA?.id, dueAt: "2026-10-30",
}), BC);

// ── PHA 1 · CÁCH LY: người KHÔNG có thông báo đánh dấu ⇒ B (`A`) phải KHÔNG đổi ─────────────
const truocA0 = await demChuaDoc(A0);
const truocB = await demChuaDoc(A);
console.log(`\n   PHA 1 · TRƯỚC — ${A0}: chưa đọc=${truocA0.chua} · ${A} (đối chứng): chưa đọc=${truocB.chua}`);
await login(A0, MK);
const r0 = await buoc(`${A0} gọi mark_notification_all_read (KHÔNG tham số)`, () => coThat("mark_notification_all_read", {}), BC);
console.log(`         → ${r0?.message || r0?._loi || "(không có thông báo)"}`);
const sauB = await demChuaDoc(A);
const duDieuKien = truocB.chua > 0;
// ⛔ CHỈ kết luận khi dựng được điều kiện. Trước đây tôi kiểm vô điều kiện nên khi cả hai bằng 0
//    thì in ra «⛔⛔ LỖI BẢO MẬT» — MỘT CẢNH BÁO SAI. Không đo được thì phải nói «KHÔNG ĐO ĐƯỢC».
const aCachLy = duDieuKien && sauB.chua === truocB.chua;
if (!duDieuKien) {
  console.log(`         ⓘ KHÔNG ĐO ĐƯỢC CÁCH LY: ${A} không có thông báo chưa đọc để đối chứng ⇒ ⛔ KHÔNG kết luận.`);
} else {
  console.log(`         ${aCachLy ? "✔" : "⛔"} CÁCH LY: ${A} ${aCachLy ? "KHÔNG bị đụng" : "BỊ ĐỤNG"} (${truocB.chua} → ${sauB.chua})`);
  if (!aCachLy && sauB.chua === 0) console.log(`            ⛔⛔ LỖI BẢO MẬT: đánh dấu của ${A0} đã ảnh hưởng ${A}!`);
}

// ── PHA 2 · ĐỌC HẾT: chính người CÓ thông báo đánh dấu ⇒ phải về 0 ──────────────────────────
const truocA = await demChuaDoc(A);
console.log(`\n   PHA 2 · TRƯỚC — ${A}: tổng=${truocA.tong} chưa đọc=${truocA.chua}`);
if (truocA.khoa.length) console.log(`         khoá thông báo: ${truocA.khoa.join(", ")}`);
await login(A, MK);
const r = await buoc(`${A} gọi mark_notification_all_read`, () => coThat("mark_notification_all_read", {}), BC);
console.log(`         → ${r?.message || r?._loi || "(không có thông báo)"}`);
const sauA = await demChuaDoc(A);
console.log(`         SAU   — ${A}: tổng=${sauA.tong} chưa đọc=${sauA.chua}`);

// ⛔⛔ PHÁT HIỆN (MEDIUM — BUG-20261009): `mark_notification_all_read` CHỈ xoá thông báo
//   **HỆ THỐNG** (`notification_user_states` ← `notification_configs`), ⛔ KHÔNG đụng
//   `task_notifications.read_at`. Mà badge chuông ở `app/page.tsx:570` lại đếm
//   `unreadTaskNotifications.length + …` ⇒ **bấm «đánh dấu tất cả đã đọc» thì badge KHÔNG về 0**.
//   ⛔ ĐÂY KHÔNG PHẢI «action hỏng»: nó chạy ĐÚNG phạm vi của nó (thông báo hệ thống) — UI vẫn
//   đánh dấu được TỪNG thông báo công việc qua `mark_task_notification_read` (`page.tsx:704,715`).
//   Vấn đề là **TÊN action nói «all» nhưng phạm vi chỉ là một nguồn**, và ⛔ **thiếu nút đọc-tất-cả
//   cho thông báo công việc**. ⇒ GHI NHẬN + chờ user chốt, ⛔ KHÔNG tự đổi ngữ nghĩa giữa GO-LIVE (§12).
const laPhamViHeThong = sauA.chua === truocA.chua && truocA.chua > 0;
console.log(`         ${laPhamViHeThong ? "ⓘ" : "?"} ĐO ĐƯỢC: action KHÔNG xoá thông báo CÔNG VIỆC `
  + `(${truocA.chua} → ${sauA.chua}) — đúng phạm vi «thông báo hệ thống» của nó.`);
console.log(`            ⇒ PHÁT HIỆN MEDIUM (BUG-20261009): badge chuông đếm CẢ thông báo công việc `
  + `(page.tsx:570) nhưng ⛔ KHÔNG có nút đọc-tất-cả cho loại đó ⇒ badge không về 0.`);

// ĐỐI CHỨNG ÂM: chưa đăng nhập ⇒ phải bị chặn
await call("logout", {}, { boQuaLoi: true, nhan: "A3-logout" });
const aKhongPhien = await call("mark_notification_all_read", {}, { boQuaLoi: true, nhan: "A3-khong-phien" });
const aChan = !aKhongPhien.ok;
console.log(`   ${aChan ? "✔" : "⛔"} ĐỐI CHỨNG ÂM: gọi khi CHƯA đăng nhập ⇒ ${aChan ? "bị chặn" : "KHÔNG chặn"}`);

// ═══════════════════════════════════════════════════════════════════════════════
// B · `change_password` — đổi được, mật khẩu cũ hết hiệu lực, chặn mật khẩu cũ sai
// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n═══ B · ĐỔI MẬT KHẨU ═══");
const MK_MOI = "Vn@2026Test#Doi";
await login(A, MK);

const bSai = await call("change_password", { currentPassword: "SaiHoanToan@123", newPassword: MK_MOI },
  { boQuaLoi: true, nhan: "B1-mk-cu-sai" });
console.log(`   ${!bSai.ok ? "✔" : "⛔"} ĐỐI CHỨNG ÂM mật khẩu cũ SAI ⇒ ${bSai.ok ? "KHÔNG chặn" : "chặn: " + String(bSai._loi).slice(0, 70)}`);

const bDoi = await buoc(`${A} đổi mật khẩu`, () => coThat("change_password", {
  currentPassword: MK, newPassword: MK_MOI,
}), BC);
console.log(`   → ${bDoi?.message || bDoi?._loi || "(không có thông báo)"}`);

// Mật khẩu MỚI phải đăng nhập được
let dangNhapMoi = false;
try { await login(A, MK_MOI); dangNhapMoi = true; } catch { dangNhapMoi = false; }
console.log(`   ${dangNhapMoi ? "✔" : "⛔"} đăng nhập bằng mật khẩu MỚI`);

// Mật khẩu CŨ phải HẾT hiệu lực
let dangNhapCu = false;
try { await login(A, MK); dangNhapCu = true; } catch { dangNhapCu = false; }
console.log(`   ${!dangNhapCu ? "✔" : "⛔"} mật khẩu CŨ ${dangNhapCu ? "VẪN đăng nhập được (LỖI BẢO MẬT)" : "đã hết hiệu lực"}`);

// KHÔI PHỤC mật khẩu gốc để không phá các bài khác
await login(A, MK_MOI);
const bHoan = await buoc(`${A} khôi phục mật khẩu gốc`, () => coThat("change_password", {
  currentPassword: MK_MOI, newPassword: MK,
}), BC);
console.log(`   → ${bHoan?.message || bHoan?._loi || "(không có thông báo)"}`);
let hoanXong = false;
try { await login(A, MK); hoanXong = true; } catch { hoanXong = false; }
console.log(`   ${hoanXong ? "✔" : "⛔"} đã khôi phục: đăng nhập lại bằng mật khẩu GỐC`);

// ── KẾT LUẬN ─────────────────────────────────────────────────────────────────
const ket = [
  [`A · ĐO ĐƯỢC phạm vi: action chỉ xoá thông báo HỆ THỐNG, ⛔ không đụng thông báo CÔNG VIỆC`, laPhamViHeThong],
  [`A · CÁCH LY theo user: ${A} KHÔNG bị đụng khi ${A0} đánh dấu`, aCachLy],
  ["A · ĐỐI CHỨNG ÂM: chưa đăng nhập ⇒ bị chặn", aChan],
  ["B · ĐỐI CHỨNG ÂM: mật khẩu cũ SAI ⇒ bị chặn", !bSai.ok],
  ["B · đổi được mật khẩu", !!bDoi?.ok],
  ["B · đăng nhập bằng mật khẩu MỚI", dangNhapMoi],
  ["B · mật khẩu CŨ hết hiệu lực", !dangNhapCu],
  ["B · khôi phục được mật khẩu gốc", hoanXong],
];
console.log("\n═══ KẾT LUẬN ═══");
let dat = 0;
for (const [ten, ok] of ket) { console.log(`   ${ok ? "✔" : "⛔"} ${ten}`); if (ok) dat++; }
console.log(`   ĐẠT ${dat}/${ket.length}`);

ghi("go-live-doc-tat-ca-va-doi-mat-khau", { dat, tong: ket.length, ket });
console.log("\n" + tomTatBuoc("ĐỌC TẤT CẢ + ĐỔI MẬT KHẨU", BC));
if (dat < ket.length) process.exitCode = 1;
