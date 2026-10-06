// ĐỐI CHIẾU QUY TRÌNH MẶC ĐỊNH — sau GĐ9 cần chắc chắn quy trình mặc định CỦA CÔNG TY cho
// chức năng `requests` vẫn là `WF-MUAHANG-01`.
//
// ⚠ BẪP CŨNG PHẢI BIẾT: `is_default = 1` KHÔNG có tính loại trừ và còn đặt trên quy trình GÁN
//   RIÊNG CHO DỰ ÁN. Chỉ `project_id IS NULL AND is_default = 1` mới thực sự là mặc định công ty
//   (đúng như `RequestStoreAdapter.stageApproverUserIds:203` và `.stageApprovalMode:216`).
//   ⇒ Lọc chỉ theo `isDefault` sẽ tưởng là có 2 mặc định và tưởng cần "khôi phục" vô ích.
import { login, bootstrap } from "./client.mjs";

const laMacDinhCongTy = (w) => Number(w.isDefault) === 1 && (w.projectId == null || w.projectId === "");
const nMacDinh = (bs, khoa) => bs.workflowDefinitions.filter((w) => w.moduleKey === khoa && laMacDinhCongTy(w));

async function chay() {
  await login("admin", "Admin123456@");
  const bs = await bootstrap();
  let sai = 0;
  console.log("QUY TRÌNH MẶC ĐỊNH CỦA CÔNG TY (project_id rỗng + is_default = 1)\n");
  console.log("  " + "mã".padEnd(20) + "chức năng".padEnd(20) + "bước".padEnd(6) + "người duyệt" + "  ưu tiên");
  for (const [khoa] of [["requests"], ["purchasing"], ["warehouse_issue"], ["warehouse_receipt"]]) {
    const ds = nMacDinh(bs, khoa);
    for (const w of ds) {
      const s = bs.workflowSteps.filter((x) => x.workflowId === w.id && Number(x.active) !== 0);
      const ap = bs.workflowStepApprovers.filter((a) => s.some((x) => x.id === a.stepId));
      const vo = s.filter((x) => !ap.some((a) => a.stepId === x.id)).map((x) => x.stepNo);
      console.log(`  ${w.code.padEnd(20)}${khoa.padEnd(20)}${String(s.length).padEnd(6)}${ap.length}       ${w.sortOrder}${vo.length ? "   ⛔ bước chưa có người duyệt: " + vo.join(",") : ""}`);
      if (vo.length) sai++;
    }
    if (!ds.length) { console.log(`  ${"(không có)".padEnd(20)}${khoa}`); sai++; }
  }
  const req = nMacDinh(bs, "requests");
  const dung = req.length === 1 && req[0].code === "WF-MUAHANG-01";
  const rieng = bs.workflowDefinitions.filter((w) => w.projectId === "PRJ_0af3201a-22d0-4870-961a-26d367350d45");
  console.log("\n  Quy trình gán riêng cho dự án E2E-DA-01: "
    + rieng.map((w) => `${w.code} (is_default=${w.isDefault})`).join(", "));
  console.log("  " + (dung ? "✔ mặc định `requests` vẫn là WF-MUAHANG-01 — KHÔNG cần khôi phục" : "⛔ sai mặc định"));
  console.log("  GHI NHẬN: quy trình gán riêng theo dự án KHÔNG ghi đè mặc định công ty "
    + "(điều kiện truy vấn lọc `project_id IS NULL`), nên giữ lại làm bằng chứng kiểm thử.");
  if (!dung) process.exitCode = 1;
}
chay().catch((e) => { console.log("[LOI]", e.message); process.exitCode = 1; });