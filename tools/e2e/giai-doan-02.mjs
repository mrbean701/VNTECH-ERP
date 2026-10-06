// GIAI ĐOẠN 2 — CẤU HÌNH LUỒNG DUYỆT NHIỀU BƯỚC
// Tạo quy trình E2E cho chức năng `requests`, 4 bước, mỗi bước chỉ định ĐÍCH DANH người duyệt.
// Ghi lại luồng mặc định cũ để có thể khôi phục.
import { readFileSync, writeFileSync } from "node:fs";
import { login, bootstrap, coThat, buoc, tomTatBuoc, ghi, tieuDe } from "./client.mjs";

const BC = [];
const tt = JSON.parse(readFileSync("tools/e2e/trang-thai-01.json", "utf8"));
const uid = (u) => tt.users.find((x) => x.username === u)?.id || null;

tieuDe("GIAI ĐOẠN 2 — CẤU HÌNH LUỒNG DUYỆT");
await login("admin", "Admin123456@");
const bs = await bootstrap();
ghi({ giaiDoan: 2, buoc: "bat-dau" });

// ── 2.1 KIỂM TRA LUỒNG MẶC ĐỊNH HIỆN TẠI ────────────────────────────────────
console.log("[2.1] Luồng phê duyệt đang có:");
for (const w of bs.workflowDefinitions) {
  const buocCua = bs.workflowSteps.filter((s) => s.workflowId === w.id).sort((a, b) => a.stepNo - b.stepNo);
  console.log("      " + w.code + " · " + w.name + " · module=" + w.moduleKey + (Number(w.isDefault) === 1 ? " (MẶC ĐỊNH)" : "") + " · " + buocCua.length + " bước");
  for (const s of buocCua) {
    const ap = bs.workflowStepApprovers.filter((a) => a.stepId === s.id);
    const ten = ap.map((a) => bs.users.find((u) => u.id === a.userId)?.username || a.userId).join(", ");
    console.log("          bước " + s.stepNo + " · " + s.name + " · " + s.approvalMode + " · SLA " + s.slaHours + "h · duyệt: " + (ten || "⛔ KHÔNG CÓ AI"));
  }
}
const cu = bs.workflowDefinitions.filter((w) => Number(w.isDefault) === 1 && w.moduleKey === "requests");
const luongCu = cu[0] || null;
console.log("      ⇒ luồng mặc định cho `requests`: " + (luongCu ? luongCu.code + " / " + luongCu.id : "KHÔNG CÓ"));

// ── 2.2 KIỂM TRA QUYỀN DUYỆT CỦA USER E2E ───────────────────────────────────
// ⓘ Trường cờ quyền tên là `canApprove` (0/1), KHÔNG phải `capability` (đo sai sẽ ra 0 giả).
console.log("\n[2.2] Quyền của tài khoản E2E (tổng số module × canApprove):");
for (const u of bs.users.filter((x) => x.username?.startsWith("e2e.") && x.username !== "e2e.diag")) {
  const rows = (bs.allModulePermissions || []).filter((p) => String(p.userId) === String(u.id));
  const ap = rows.filter((p) => Number(p.canApprove) === 1);
  const req = rows.filter((p) => p.moduleKey === "requests")[0];
  const apr = rows.filter((p) => p.moduleKey === "approvals")[0];
  console.log("      " + u.username.padEnd(10) + " cap=" + String(u.role).padEnd(11) + " ban=" + String(u.roleBase).padEnd(11)
    + " tongQuyen=" + String(rows.length).padStart(3) + " · quyenDuyet=" + String(ap.length).padStart(2)
    + " · requests(view/use/approve)=" + (req ? req.canView + "/" + req.canUse + "/" + req.canApprove : "khong co")
    + " · approvals=" + (apr ? apr.canView + "/" + apr.canUse + "/" + apr.canApprove : "khong co"));
}

// ── 2.3 TẠO LUỒNG E2E 4 BƯỚC ───────────────────────────────────────────────
console.log("\n[2.3] Tạo luồng E2E 4 bước (mỗi bước 1 người duyệt đích danh):");
const stages = [
  { stepNo: 1, name: "E2E-1 Kỹ sư Dự án đề nghị mua", description: "Xác nhận nhu cầu vật tư tại hiện trường", approvalMode: "single", slaHours: 12, approverUserIds: [uid("e2e.ksda")] },
  { stepNo: 2, name: "E2E-2 Trưởng Kế hoạch kiểm tra khối lượng", description: "Đối chiếu BOQ và khối lượng", approvalMode: "single", slaHours: 24, approverUserIds: [uid("e2e.kh")] },
  { stepNo: 3, name: "E2E-3 Kế toán kiểm tra giá", description: "Kiểm tra đơn giá và tổng giá trị", approvalMode: "single", slaHours: 24, approverUserIds: [uid("e2e.kt")] },
  { stepNo: 4, name: "E2E-4 Giám đốc phê duyệt", description: "Phê duyệt cuối cùng", approvalMode: "single", slaHours: 12, approverUserIds: [uid("e2e.bgd")] },
];
for (const s of stages) if (!s.approverUserIds[0]) { console.log("      [LOI] thiếu user cho bước " + s.stepNo); process.exitCode = 1; }
if (stages.every((s) => s.approverUserIds[0])) {
  await buoc("save_workflow WF-E2E-MUAHANG", () => coThat("save_workflow", {
    code: "WF-E2E-MUAHANG", name: "Quy trình E2E mua hàng 4 bước",
    description: "Luồng kiểm thử E2E — đổi người duyệt và đảo thứ tự ở Giai đoạn 12",
    moduleKey: "requests", projectId: tt.duAn, isDefault: 1, sortOrder: 5, stages,
  }), BC);
}

// ── 2.4 ĐỐI CHIẾU: đọc lại từ máy chủ ────────────────────────────────────────
console.log("\n[2.4] Đối chiếu từ máy chủ:");
const bs2 = await bootstrap();
const wf = bs2.workflowDefinitions.find((w) => w.code === "WF-E2E-MUAHANG");
if (!wf) { console.log("      [LOI] không thấy luồng vừa tạo"); process.exitCode = 1; }
else {
  const bsCua = bs2.workflowSteps.filter((s) => s.workflowId === wf.id).sort((a, b) => a.stepNo - b.stepNo);
  console.log("      mặc định cho `requests`: " + (bs2.workflowDefinitions.find((w) => w.moduleKey === "requests" && Number(w.isDefault) === 1)?.code || "KHÔNG CÓ"));
  for (const s of bsCua) {
    const ap = bs2.workflowStepApprovers.filter((a) => a.stepId === s.id);
    console.log("      bước " + s.stepNo + " · " + s.name + " · " + s.approvalMode + " · SLA " + s.slaHours + "h · " + ap.map((a) => bs2.users.find((u) => u.id === a.userId)?.username || a.userId).join(", "));
  }
  console.log("      tổng bước = " + bsCua.length + " · tổng người duyệt = " + bs2.workflowStepApprovers.filter((a) => bsCua.some((s) => s.id === a.stepId)).length);
}

const trang2 = { ...tt, luongE2E: wf?.id || null, luongE2ECode: wf?.code || null, luongCu: luongCu?.id || null, luongCuCode: luongCu?.code || null, stagesE2E: stages };
writeFileSync("tools/e2e/trang-thai-01.json", JSON.stringify(trang2, null, 2), "utf8");
ghi({ giaiDoan: 2, buoc: "ket-thuc", luongE2E: wf?.id, thatBai: BC.filter((x) => !x.ok).map((x) => x.ten) });
tomTatBuoc("GIAI ĐOẠN 2", BC);