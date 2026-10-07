// GO-LIVE 05/10/2026 — LẤP LỖ HỔNG KIỂM THỬ: `mark_error_report_resolved`.
//
// ⛔ VÌ SAO CÓ BÀI NÀY (đo được 05/10/2026):
//   Quét 214 action của `ActionRbacRegistry`, đối chiếu 548 tệp nguồn ⇒ chỉ **2** action CHƯA TỪNG
//   được tham chiếu. Trong đó `mark_error_report_resolved` là action **THẬT SỰ dùng được**:
//   · có handler: `SystemController.java:1474` → `errorReportUseCase.resolve(payload)`
//   · có UI gọi : `app/screens/ErrorReportAdminPanel.tsx:52` (nút tick «đánh dấu đã xử lý xong»)
//   · RBAC gắn module `admin` (`ActionRbacRegistry.java:59`)
//   Nhưng **CHƯA TỪNG** được bài kiểm nào chạy ⇒ đây là **đường mã chưa hề được kiểm**.
//   (Action còn lại `manage_contract_review` thì **KHÔNG có handler** trong `SystemController`
//    và **không UI nào gọi** ⇒ là ĐĂNG KÝ THỪA, ghi nhận riêng — xem `TASK-158`.)
//
// HỢP ĐỒNG (đọc từ mã, ⛔ không đoán):
//   `ErrorReportUseCase.resolve` (dòng 90-99): `reportId` (bắt buộc) · `resolved` (mặc định true) · `note`
//   · thiếu `reportId` ⇒ «Thiếu mã report.» · không tìm thấy ⇒ «Không tìm thấy report <id>.»
//   · `resolved=false` ⇒ xoá dấu thời gian (MỞ LẠI report)
import { readFileSync } from "node:fs";
import { login, bootstrap, call, coThat, buoc, tomTatBuoc, ghi, tieuDe } from "./client.mjs";

const tt = JSON.parse(readFileSync("tools/e2e/trang-thai-01.json", "utf8"));
const MK = tt.matKhau;
const MK_ADMIN = "Admin123456@";
const NGUOI_GUI = "e2e.kh";
const BC = [];
const ds = (bs, k) => (Array.isArray(bs?.[k]) ? bs[k] : []);
const tim = (bs, id) => ds(bs, "errorReports" in bs ? "errorReports" : "reports").find((r) => String(r.id) === String(id));

/** Lấy report qua ACTION thật (⛔ không đọc bootstrap — báo lỗi KHÔNG nằm trong bootstrap). */
async function layReport(id) {
  const r = await call("error_reports", {}, { boQuaLoi: true, nhan: "doc-lai" });
  return (r.reports || []).find((x) => String(x.id) === String(id)) || null;
}

console.log("=".repeat(78));
console.log("GO-LIVE — LẤP LỖ HỔNG: ĐÁNH DẤU BÁO LỖI ĐÃ XỬ LÝ XONG (mark_error_report_resolved)");
console.log("=".repeat(78));

// ── B1 · người dùng gửi một báo lỗi MỚI để có đối tượng thử ────────────────────────────────
console.log("\n═══ B1 · người dùng gửi báo lỗi mới ═══");
await login(NGUOI_GUI, MK);
const me = (await bootstrap()).user;
console.log(`   người gửi: ${me?.username} · ${me?.fullName} · ${me?.department || "—"}`);
const tieuDeBL = `E2E đánh dấu xong — ${new Date().toISOString().slice(0, 19)}`;
await buoc("gửi báo lỗi", () => coThat("save_error_report", {
  title: tieuDeBL, reportType: "bao_loi", moduleKey: "purchasing",
  content: "Nút Lưu ở màn PR bấm không phản hồi (E2E kiểm đường đánh dấu xong).",
  userId: me?.id, username: me?.username, fullName: me?.fullName,
  employeeCode: me?.employeeCode, organizationUnitId: me?.organizationUnitId, organizationName: me?.department,
}), BC);

await login("admin", MK_ADMIN);
let moi = (await call("error_reports", {}, { boQuaLoi: true, nhan: "tim-moi" })).reports
  ?.filter((r) => String(r.title) === tieuDeBL).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))[0];
console.log(`   report mới = ${moi?.reportCode} · status=${moi?.status}`);

let blTrangThai = false, blMoLai = false, blGhiChu = false;

if (moi?.id) {
  // ── B2 · ĐÁNH DẤU ĐÃ XỬ LÝ XONG (đường CHƯA TỪNG được kiểm) ────────────────────────────
  console.log("\n═══ B2 · đánh dấu ĐÃ XỬ LÝ XONG ═══");
  const r = await buoc("mark_error_report_resolved (resolved=true)", () => coThat("mark_error_report_resolved", {
    reportId: moi.id, resolved: true, note: "Đã khắc phục ở bản vá GO-LIVE (E2E).",
  }), BC);
  const sau = await layReport(moi.id);
  console.log(`   → status = ${sau?.status} · resolvedAt = ${sau?.resolvedAt} · note = ${String(sau?.resolutionNote || "").slice(0, 50)}`);
  if (r?.ok && String(sau?.status) === "resolved" && sau?.resolvedAt) blTrangThai = true;
  if (String(sau?.resolutionNote || "").includes("bản vá GO-LIVE")) blGhiChu = true;

  // ── B3 · MỞ LẠI (resolved=false) — nhánh thứ hai của cùng action ───────────────────────
  console.log("\n═══ B3 · MỞ LẠI báo lỗi (resolved=false) ═══");
  const r2 = await buoc("mark_error_report_resolved (resolved=false)", () => coThat("mark_error_report_resolved", {
    reportId: moi.id, resolved: false,
  }), BC);
  const lai = await layReport(moi.id);
  console.log(`   → status = ${lai?.status} · resolvedAt = ${lai?.resolvedAt}`);
  if (r2?.ok && String(lai?.status) !== "resolved" && !lai?.resolvedAt) blMoLai = true;
}

// ── B4 · ĐỐI CHỨNG ÂM: mã không tồn tại + thiếu mã ────────────────────────────────────────
console.log("\n═══ B4 · ĐỐI CHỨNG ÂM ═══");
await login("admin", MK_ADMIN);
const am1 = await call("mark_error_report_resolved", { reportId: "ERPT_khong_ton_tai_xyz", resolved: true },
  { boQuaLoi: true, nhan: "am-ma-khong-ton-tai" });
const am2 = await call("mark_error_report_resolved", { resolved: true }, { boQuaLoi: true, nhan: "am-thieu-ma" });
const blAm = !am1.ok && /Không tìm thấy report/.test(String(am1._loi || ""))
  && !am2.ok && /Thiếu mã report/.test(String(am2._loi || ""));
console.log(`   mã không tồn tại → ${am1.ok ? "⛔ KHÔNG chặn" : "✔ chặn: " + String(am1._loi).slice(0, 60)}`);
console.log(`   thiếu mã        → ${am2.ok ? "⛔ KHÔNG chặn" : "✔ chặn: " + String(am2._loi).slice(0, 60)}`);

// ── B5 · ĐỐI CHỨNG ÂM QUYỀN: người thường KHÔNG được đánh dấu ────────────────────────────
console.log("\n═══ B5 · ĐỐI CHỨNG ÂM QUYỀN (action gắn module `admin`) ═══");
await login(NGUOI_GUI, MK);
const cuaUser = await call("mark_error_report_resolved",
  { reportId: moi?.id || "x", resolved: true }, { boQuaLoi: true, nhan: "B5-user-thuong" });
const blQuyen = !cuaUser.ok;
console.log(`   ${NGUOI_GUI} gọi → ${cuaUser.ok ? "⛔ KHÔNG chặn (LỖI PHÂN QUYỀN)" : "✔ bị chặn: " + String(cuaUser._loi).slice(0, 70)}`);

// ── KẾT LUẬN ─────────────────────────────────────────────────────────────────────────────
const ket = [
  ["B2 · đánh dấu xong ⇒ status `resolved` + có `resolvedAt`", blTrangThai],
  ["B2 · `note` được ghi vào `resolutionNote`", blGhiChu],
  ["B3 · mở lại ⇒ bỏ `resolved` + xoá `resolvedAt`", blMoLai],
  ["B4 · ĐỐI CHỨNG ÂM: mã sai + thiếu mã đều bị chặn", blAm],
  ["B5 · ĐỐI CHỨNG ÂM QUYỀN: người thường bị chặn", blQuyen],
];
console.log("\n═══ KẾT LUẬN ═══");
let dat = 0;
for (const [ten, ok] of ket) { console.log(`   ${ok ? "✔" : "⛔"} ${ten}`); if (ok) dat++; }
console.log(`   ĐẠT ${dat}/${ket.length}`);

await login("admin", MK_ADMIN);
const nay = await layReport(moi?.id || "");
console.log(`\n   [đo từ máy chủ] ${moi?.reportCode} → status = ${nay?.status} · resolvedAt = ${nay?.resolvedAt || "—"}`);

ghi("go-live-bao-loi-danh-dau-xong", { dat, tong: ket.length, ket });
console.log("\n" + tomTatBuoc("BÁO LỖI — ĐÁNH DẤU XONG", BC));
if (dat < ket.length) process.exitCode = 1;
