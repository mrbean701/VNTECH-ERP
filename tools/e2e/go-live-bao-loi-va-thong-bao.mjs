/**
 * GO-LIVE — TEST THẬT 2 YÊU CẦU CỦA USER (02/10/2026):
 *   (12) «kiểm tra xem user thực hiện báo lỗi thì tài khoản được cấp quyền admin có xem được
 *        chi tiết báo lỗi ấy hay không»
 *   (13) «test thông báo web»
 *
 * Chạy trên môi trường THẬT `:9000` → Java `:18081` → MySQL.
 *
 * ⛔ BÀI HỌC ĐÃ SỬA (ghi lại để không lặp): bản ĐẦU của tệp này đi tìm báo lỗi trong `bootstrap`
 *    rồi kết luận «admin KHÔNG xem được» — SAI. Sự thật đo được:
 *      • báo lỗi lấy qua **ACTION `error_reports`** (`SystemController.java:1473`), KHÔNG qua bootstrap;
 *      • `taskNotifications` **CÓ** trong bootstrap (`BootstrapDataAdapter.java:1651`) nhưng
 *        **lọc theo `user_id` của chính người đăng nhập** ⇒ 0 phần tử là ĐÚNG thiết kế.
 *    ⇒ Phép đo sai chỗ ⇒ kết luận sai. Lần này đo ĐÚNG đường mà UI thật đi.
 */
import fs from "node:fs";
import { login, bootstrap, call, coThat, buoc, tomTatBuoc, ghi, tieuDe } from "./client.mjs";

const tt = JSON.parse(fs.readFileSync("tools/e2e/trang-thai-01.json", "utf8"));
const MK = tt.matKhau;
const MK_ADMIN = "Admin123456@";
const BC = [];
const nguoiGui = "e2e.project";
// ⛔ Sửa sau lần chạy đầu: `e2e.cht` (vai trò `cht`) bị chính sách giao việc Phòng Dự án TỪ CHỐI
//    («Chưa có nhân sự Phòng Dự án phù hợp/phạm vi dự án để giao việc.») ⇒ phải chọn người ĐÚNG
//    vai trò của phòng nhận việc. Dùng `e2e.project` (vai trò `da_nv`, phòng DA).
const NGUOI_NHAN = "e2e.project";

const tb = (bs) => (Array.isArray(bs.taskNotifications) ? bs.taskNotifications : []);

tieuDe("GO-LIVE — TEST BÁO LỖI/GÓP Ý + THÔNG BÁO WEB (đường thật của UI)");

// ═══════════════════════════════════════════════════════════════════════════════
// PHẦN A — BÁO LỖI / GÓP Ý
// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n═══ PHẦN A · BÁO LỖI - GÓP Ý ═══");

await login("admin", MK_ADMIN);
const truocA = (await call("error_reports", {}, { boQuaLoi: true }));
const soTruoc = Array.isArray(truocA.reports) ? truocA.reports.length : 0;
console.log(`      admin gọi action \`error_reports\`: HTTP ${truocA.status} · số báo lỗi TRƯỚC = ${soTruoc}`);

// A1 — user THƯỜNG gửi 1 báo lỗi + 1 góp ý
await login(nguoiGui, MK);
const bsu = await bootstrap();
// ⛔ BÀI HỌC LẦN 2 (đã dính rồi sửa): KHÔNG lấy người gửi từ `bs.users` — với tài khoản KHÔNG phải
//    admin, bootstrap **xoá sạch** `users` (xem `scripts/system-route.mjs:834` `result.users=[]`).
//    Lấy sai chỗ ⇒ `me = undefined` ⇒ payload mất 6 trường người gửi ⇒ DB ghi TRỐNG
//    ⇒ suýt kết luận nhầm «sản phẩm mất thông tin người gửi» (thực ra bài test gửi thiếu).
//    Khoá ĐÚNG là `bs.user` (số ít) — chính người đang đăng nhập.
const me = bsu.user || (bsu.users || []).find((u) => u.username === nguoiGui);
if (!me?.id) console.log("      [CẢNH BÁO] không đọc được `bs.user` — payload sẽ thiếu thông tin người gửi.");
else console.log(`      người gửi đọc từ bs.user: ${me.username} · ${me.fullName} · ${me.employeeCode} · ${me.department}`);
const dauVan = Date.now();
const tieuDeBL = `E2E-GOLIVE báo lỗi ${dauVan}`;
const tieuDeGY = `E2E-GOLIVE góp ý ${dauVan}`;
const gui = (title, reportType, content) => coThat("save_error_report", {
  title, reportType, moduleKey: "purchasing", content,
  userId: me?.id, username: me?.username, fullName: me?.fullName,
  employeeCode: me?.employeeCode, organizationUnitId: me?.organizationUnitId,
  organizationName: me?.department,
});
await buoc(`[${nguoiGui}] gửi BÁO LỖI`, () => gui(tieuDeBL, "bao_loi", "Nút Lưu ở màn PR bấm không phản hồi (E2E GO-LIVE)."), BC);
await buoc(`[${nguoiGui}] gửi GÓP Ý`, () => gui(tieuDeGY, "gop_y", "Đề xuất thêm cột ĐVT vào bảng PR (E2E GO-LIVE)."), BC);

// A2 — ĐỐI CHỨNG ÂM: user thường gọi `error_reports` ⇒ phải BỊ CHẶN
const cuaUser = await call("error_reports", {}, { boQuaLoi: true, nhan: "A2-user-thuong" });
const biChan = cuaUser.ok === false;
console.log(`\n      [ÂM] ${nguoiGui} gọi \`error_reports\`: HTTP ${cuaUser.status} · ${cuaUser._loi || "KHÔNG BỊ CHẶN"}`);
console.log(`      ${biChan ? "✔ ĐÚNG — user thường BỊ CHẶN" : "⛔ HỞ QUYỀN — user thường đọc được danh sách báo lỗi"}`);

// A3 — ADMIN đọc lại: có thấy CHI TIẾT không?
await login("admin", MK_ADMIN);
const sauA = await call("error_reports", {}, { boQuaLoi: true });
const ds = Array.isArray(sauA.reports) ? sauA.reports : [];
const cuaBL = ds.find((r) => String(r.title) === tieuDeBL);
const cuaGY = ds.find((r) => String(r.title) === tieuDeGY);
console.log(`\n      admin gọi \`error_reports\`: số SAU = ${ds.length} (tăng ${ds.length - soTruoc})`);
console.log(`      ${cuaBL ? "✔" : "⛔"} admin THẤY báo lỗi vừa gửi`);
if (cuaBL) {
  const truong = ["reportCode", "title", "content", "reportType", "username", "fullName", "employeeCode", "organizationName", "status", "createdAt"];
  console.log("      CHI TIẾT admin đọc được:");
  for (const t of truong) {
    const v = cuaBL[t];
    console.log(`        · ${t.padEnd(16)} = ${v === undefined || v === null || v === "" ? "(TRỐNG)" : String(v).slice(0, 62)}`);
  }
}
const thayTieuDe = !!cuaBL;
const thayNoiDung = !!cuaBL && String(cuaBL.content || "").includes("E2E GO-LIVE");
const thayNguoiGui = !!cuaBL && String(cuaBL.username || "") === nguoiGui;
const phanLoaiDung = !!cuaGY && String(cuaGY.reportType || "") === "gop_y";
console.log(`      ${thayTieuDe ? "✔" : "⛔"} thấy TIÊU ĐỀ`);
console.log(`      ${thayNoiDung ? "✔" : "⛔"} thấy NỘI DUNG chi tiết`);
console.log(`      ${thayNguoiGui ? "✔" : "⛔"} thấy NGƯỜI GỬI (username)`);
console.log(`      ${phanLoaiDung ? "✔" : "⛔"} phân biệt «Góp ý» / «Báo lỗi»`);

// ═══════════════════════════════════════════════════════════════════════════════
// PHẦN B — THÔNG BÁO WEB
// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n═══ PHẦN B · THÔNG BÁO WEB ═══");

await login(NGUOI_NHAN, MK);
const bsTruoc = await bootstrap();
const tbTruoc = tb(bsTruoc);
console.log(`      [${NGUOI_NHAN}] thông báo TRƯỚC = ${tbTruoc.length}`);

// B1 — admin giao 1 công việc cho e2e.cht ⇒ hệ thống phải sinh thông báo
await login("admin", MK_ADMIN);
const nhan = (await bootstrap()).users.find((u) => u.username === NGUOI_NHAN);
const mucCV = `E2E-GOLIVE thông báo ${dauVan}`;
const rCV = await buoc(`create_work_item giao cho ${NGUOI_NHAN}`, () => coThat("create_work_item", {
  departmentCode: "DA", workGroup: "GIAO_VIEC_BO_SUNG",
  title: mucCV, description: "Kiểm chứng thông báo web (E2E GO-LIVE).",
  projectId: tt.duAn, assignedTo: nhan?.id, dueAt: "2026-10-30",
}), BC);
console.log(`      → ${rCV?._loi || rCV?.message || "(không có thông báo trả về)"}`);

// B2 — người nhận đăng nhập, đếm lại
await login(NGUOI_NHAN, MK);
const bsSau = await bootstrap();
const tbSau = tb(bsSau);
const moi = tbSau.find((n) => String(n.title || "").includes(mucCV) || String(n.body || "").includes(mucCV));
console.log(`      [${NGUOI_NHAN}] thông báo SAU = ${tbSau.length} (tăng ${tbSau.length - tbTruoc.length})`);
if (tbSau.length) {
  const n0 = tbSau[0];
  console.log(`      thông báo mới nhất: ${JSON.stringify({ id: String(n0.id).slice(0, 22), title: String(n0.title || "").slice(0, 46), readAt: n0.readAt, status: n0.status, channel: n0.channel }).slice(0, 190)}`);
}
const coThongBao = tbSau.length > tbTruoc.length;
const thayDungNoiDung = !!moi;
console.log(`      ${coThongBao ? "✔" : "⛔"} số thông báo TĂNG sau khi được giao việc`);
console.log(`      ${thayDungNoiDung ? "✔" : "⛔"} tìm thấy ĐÚNG thông báo của công việc vừa giao`);

// B3 — đánh dấu đã đọc rồi đo lại
let danhDauOk = false;
const chuaDoc = tbSau.filter((n) => !n.readAt);
if (chuaDoc.length) {
  const idTb = chuaDoc[0].id;
  const r = await call("mark_task_notification_read", { notificationId: idTb, id: idTb }, { boQuaLoi: true, nhan: "B3-mark-read" });
  await login(NGUOI_NHAN, MK);
  const sau = tb((await bootstrap())).find((n) => String(n.id) === String(idTb));
  danhDauOk = !!sau?.readAt;
  console.log(`\n      mark_task_notification_read: HTTP ${r.status} · ${r._loi || r.message || "ok"}`);
  console.log(`      ${danhDauOk ? "✔" : "⛔"} đọc lại từ máy chủ: readAt = ${sau?.readAt ?? "(vẫn trống)"}`);
} else {
  console.log("\n      [BO QUA] không có thông báo chưa đọc.");
}

// B4 — email outbox: giao việc có sinh email không?
await login("admin", MK_ADMIN);
const bsMail = await bootstrap();
const mail = Array.isArray(bsMail.emailOutbox) ? bsMail.emailOutbox : [];
const mailCv = mail.filter((m) => String(m.event || "").includes("task_assigned"));
console.log(`\n      email_outbox: tổng ${mail.length} · loại 'task_assigned' = ${mailCv.length}`);
const coEmail = mailCv.length > 0;
console.log(`      ${coEmail ? "✔" : "⛔"} giao việc CÓ sinh email trong hàng đợi (điểm nối cho email noti)`);

// ═══════════════════════════════════════════════════════════════════════════════
const ket = [
  ["A · ÂM — user thường BỊ CHẶN khỏi `error_reports`", biChan],
  ["A · admin thấy TIÊU ĐỀ báo lỗi", thayTieuDe],
  ["A · admin thấy NỘI DUNG chi tiết", thayNoiDung],
  ["A · admin thấy NGƯỜI GỬI", thayNguoiGui],
  ["A · phân biệt Góp ý / Báo lỗi", phanLoaiDung],
  ["B · giao việc làm TĂNG thông báo", coThongBao],
  ["B · đúng nội dung công việc", thayDungNoiDung],
  ["B · đánh dấu đã đọc ghi được", danhDauOk],
  ["B · giao việc sinh email trong hàng đợi", coEmail],
];
console.log("\n═══ KẾT LUẬN ═══");
for (const [ten, ok] of ket) console.log(`      ${ok ? "✔" : "⛔"} ${ten}`);
const dat = ket.filter(([, v]) => v).length;
console.log(`      ĐẠT ${dat}/${ket.length}`);

ghi({ giaiDoan: "bao-loi-thong-bao", baoLoiTruoc: soTruoc, baoLoiSau: ds.length, tbTruoc: tbTruoc.length, tbSau: tbSau.length, emailTaskAssigned: mailCv.length, dat, tong: ket.length });
console.log("\n" + tomTatBuoc("BÁO LỖI + THÔNG BÁO", BC));
if (dat !== ket.length) process.exitCode = 1;
