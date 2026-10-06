// BƯỚC 5B — PHÂN CÔNG OWNER PHÊ DUYỆT THEO DỰ ÁN (cơ chế THẬT của create_request)
// ⚠ PHÁT HIỆN: `create_request` KHÔNG dùng workflowDefinitions/workflowSteps mà dùng:
//     (1) bảng `approval_stages` (5 bước cố định, có allowedRoleCodes)
//     (2) bảng `approval_project_assignments` (projectId + stage → ownerUserId)
//   Hai bước duyệt bắt buộc phải có vai trò khớp `allowedRoleCodes` và đúng vai trò người duyệt.
// ⇒ Cần thêm tài khoản cho 2 vai trò mà 7 tài khoản E2E chưa có: `thuky` (bước 2) và `kh_nv` (bước 4).
// ⚠ `save_email_settings` thay thế TOÀN BỘ danh sách phân công và cả cấu hình SMTP
//   ⇒ phải nạp lại phân công cũ và cấu hình mail cũ rồi gửi lại, chỉ thêm dòng cho dự án E2E.
import { readFileSync, writeFileSync } from "node:fs";
import { login, bootstrap, coThat, buoc, tomTatBuoc, ghi, tieuDe } from "./client.mjs";

const BC = [];
const tt = JSON.parse(readFileSync("tools/e2e/trang-thai-01.json", "utf8"));
const MK = tt.matKhau;
tieuDe("BƯỚC 5B — PHÂN CÔNG OWNER PHÊ DUYỆT THEO DỰ ÁN");

await login("admin", "Admin123456@");
let bs = await bootstrap();
ghi({ giaiDoan: "5B", buoc: "bat-dau" });

// ── 5B.1 Bổ sung tài khoản cho mọi vai trò mà luồng duyệt đòi ────────────────
// ⓘ Dò vai trò từ `approvalStages[].allowedRoleCodes` (nguồn thật của backend) chứ không hardcode danh sách:
//   nhờ vậy nếu backend đổi danh sách vai trò, bước này tự thích ứng thay vì hỏng âm thầm.
console.log("[5B.1] Kiểm tra vai trò mà từng bước duyệt đòi:");
const buocPhanCong = (bs.approvalStages || []).filter((s) => s.stageKind === "approval" && Number(s.stageNo) <= 5)
  .sort((a, b) => Number(a.stageNo) - Number(b.stageNo))
  .map((s) => ({ stage: Number(s.stageNo), ten: s.name, choPhep: String(s.allowedRoleCodes || "").split(",").map((r) => r.trim()).filter(Boolean) }));

const coVai = (u) => [u.role, u.roleBase].filter(Boolean);
const timNguoi = (choPhep) => bs.users.find((u) => u.username?.startsWith("e2e.") && coVai(u).some((r) => choPhep.includes(r)));

const DON_VI_VAI = {
  thuky: "ORG-BGD", thu_ky_tgd: "ORG-BGD", director: "ORG-BGD", tgd: "ORG-BGD", giam_doc: "ORG-BGD",
  commander: "ORG-DA", cht: "ORG-DA", da_nv: "ORG-DA", project: "ORG-DA",
  procurement: tt.donVi["Kế hoạch"], kh_nv: tt.donVi["Kế hoạch"], kh_truong: tt.donVi["Kế hoạch"],
  thu_kho: "ORG-DA", warehouse: "ORG-DA", accountant: tt.donVi["Kế toán"], hr: tt.donVi["Nhân sự"],
};
for (const b of buocPhanCong) {
  const co = timNguoi(b.choPhep);
  b.un = co?.username || null;
  if (co) { console.log("      bước " + b.stage + " · " + b.ten.padEnd(24) + " ← " + co.username.padEnd(11) + " (vai trò " + co.role + ") ✔"); continue; }
  // Chọn vai trò đầu tiên trong danh sách cho phép rồi tạo một tài khoản mang vai trò đó.
  const vai = b.choPhep[0];
  const un = "e2e." + vai.replace(/[^a-z0-9]+/gi, "");
  console.log("      bước " + b.stage + " · " + b.ten.padEnd(24) + " ← CHƯA CÓ AI, tạo " + un + " (vai trò " + vai + ")");
  await buoc("create_user " + un, () => coThat("create_user", {
    employeeCode: "E2E-" + vai.toUpperCase().slice(0, 12), fullName: "E2E " + vai, username: un,
    email: un.split(".")[1] + "@vntech.local", role: vai,
    organizationUnitId: DON_VI_VAI[vai] || "ORG-DA", password: MK, projectIds: [tt.duAn], signatureUrl: "",
  }), BC);
  bs = await bootstrap();
  b.un = bs.users.find((u) => u.username === un)?.username || null;
  if (!b.un) { console.log("      [LOI] tạo tài khoản " + un + " thất bại"); process.exitCode = 1; }
}

// ── 5B.2 Đồng bộ lại tệp trạng thái + dựng lại danh sách tổ đội/kho ─────────
const dsUser = bs.users.filter((u) => u.username?.startsWith("e2e.") && u.username !== "e2e.diag")
  .map((u) => ({ id: u.id, username: u.username, vai: u.role, donVi: u.organizationUnitId, ten: u.fullName }));
tt.users = dsUser;
tt.teams = bs.teams.filter((t) => t.projectId === tt.duAn).map((t) => ({ id: t.id, code: t.code, ten: t.name, trade: t.trade, kho: t.warehouseId }));
tt.khoTeam = bs.warehouses.filter((w) => w.projectId === tt.duAn && w.type === "team").map((w) => ({ id: w.id, code: w.code }));
console.log("\n[5B.2] Tệp trạng thái: " + dsUser.length + " tài khoản · " + tt.teams.length + " tổ đội · " + tt.khoTeam.length + " kho tổ đội");

// ── 5B.3 Phân công Owner cho dự án E2E ──────────────────────────────────────
const idCua = (un) => bs.users.find((u) => u.username === un)?.id;
const thieu = buocPhanCong.filter((b) => !b.un);
if (thieu.length) { console.log("      [LOI] bước chưa có người duyệt: " + thieu.map((t) => t.stage).join(", ")); process.exitCode = 1; }

console.log("\n[5B.3] Phân công Owner cho dự án E2E-DA-01:");
const email = bs.emailSettings || {};
// ⚠ save_email_settings XOÁ SẠCH bảng phân công rồi chèn lại toàn bộ (AdminOpsManagementUseCase:96).
//   Nếu payload có 2 dòng cùng (projectId, stage) thì lần chèn thứ hai đụng khoá duy nhất
//   ⇒ «Dữ liệu đã tồn tại». Phải lọc trùng (giữ dòng sau cùng) trước khi gửi.
const gop = new Map();
for (const a of [
  ...(bs.workflowAssignments || []).map((a) => ({ projectId: a.projectId, stage: a.stage, ownerUserId: a.ownerUserId || "", ccEmails: a.ccEmails || "" })),
  ...buocPhanCong.map((b) => ({ projectId: tt.duAn, stage: b.stage, ownerUserId: idCua(b.un) || "", ccEmails: "" })),
]) gop.set(a.projectId + "|" + Number(a.stage), a);
const assignments = [...gop.values()];
const trung = (bs.workflowAssignments || []).length + buocPhanCong.length - assignments.length;
console.log("      dòng phân công gửi lên = " + assignments.length + " · đã lọc trùng " + trung + " dòng (cùng dự án + cùng bước)");
if (trung) console.log("      ⓘ Nếu không lọc, backend sẽ báo «trùng khoá duy nhất» — đó là lỗi payload, KHÔNG phải giới hạn hệ thống.");

await buoc("save_email_settings (5 phân công dự án E2E)", () => coThat("save_email_settings", {
  enabled: !!email.enabled, smtpHost: email.smtpHost || null, smtpPort: email.smtpPort || 587,
  security: email.security || "starttls", username: email.username || null, smtpPassword: "",
  senderEmail: email.senderEmail || null, senderName: email.senderName || "VNTECH ERP",
  baseUrl: email.baseUrl || null, poSlaHours: 24, bchConfirmationSlaHours: 8, testEmail: "",
  recipients: (bs.emailRecipients || []).map((r) => ({ projectId: r.projectId, stage: r.stage, emails: r.emails })),
  assignments,
}), BC);

// ── 5B.4 Đối chiếu ───────────────────────────────────────────────────────────
bs = await bootstrap();
console.log("\n[5B.4] Đối chiếu từ máy chủ — phân công của dự án E2E-DA-01:");
const cu = (bs.workflowAssignments || []).filter((a) => a.projectId === tt.duAn);
if (cu.length !== 5) { console.log("      [LOI] có " + cu.length + "/5 dòng phân công"); process.exitCode = 1; }
for (const b of buocPhanCong) {
  const a = cu.find((x) => Number(x.stage) === b.stage);
  const dung = a && a.ownerUserId === idCua(b.un) && a.active !== false && a.active !== 0;
  console.log("      bước " + b.stage + " · " + b.ten.padEnd(24) + " → " + String(a?.ownerName || "—").padEnd(28) + (dung ? " ✔" : " ✘ mong đợi " + b.un));
  if (!dung) process.exitCode = 1;
}
const khac = (bs.workflowAssignments || []).filter((a) => a.projectId !== tt.duAn);
console.log("      phân công của dự án khác còn lại: " + khac.length + " (trước đó 5) " + (khac.length === 5 ? "✔ không mất" : "✘ ĐÃ MẤT"));
if (khac.length !== 5) process.exitCode = 1;
console.log("      cấu hình mail sau khi lưu: enabled=" + bs.emailSettings?.enabled + " host=" + bs.emailSettings?.smtpHost);

writeFileSync("tools/e2e/trang-thai-01.json", JSON.stringify(tt, null, 2), "utf8");
ghi({ giaiDoan: "5B", buoc: "ket-thuc", thatBai: BC.filter((x) => !x.ok).map((x) => x.ten) });
tomTatBuoc("BƯỚC 5B", BC);