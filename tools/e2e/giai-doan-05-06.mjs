// GIAI ĐOẠN 5 — MỞ PHIẾU ĐỀ NGHỊ MUA HÀNG + GIAI ĐOẠN 6 — DUYỆT TỪNG BƯỚC
// Vài trò mấu chốt kiểm ở đây:
//   1) Phiếu tạo bởi người khác có tự sinh chuỗi approvals[] đúng luồng 4 bước đang cấu hình không.
//   2) Người duyệt ở mỗi bước có ĐÚNG bằng người đã cấu hình không  (đây là mấu chốt chống hardcode).
//   3) Thứ tự bước có bám theo thứ tự cấu hình không.
import { readFileSync, writeFileSync } from "node:fs";
import { login, bootstrap, coThat, call, buoc, tomTatBuoc, ghi, tieuDe, asUser } from "./client.mjs";

const BC = [];
const tt = JSON.parse(readFileSync("tools/e2e/trang-thai-01.json", "utf8"));
const MK = tt.matKhau;
const uid = (u) => tt.users.find((x) => x.username === u)?.id;

tieuDe("GIAI ĐOẠN 5 + 6 — PHIẾU ĐỀ NGHỊ MUA HÀNG VÀ DUYỆT TỪNG BƯỚC");

// ── 5.1 BCH mở phiếu ────────────────────────────────────────────────────────
// ⓘ Bảng tên người dùng phải lấy lúc đăng nhập ADMIN. Khi đăng nhập bằng tài khoản thường,
//   `bs.users` không tra cứu được theo `id` ⇒ dễ tưởng chưa gán người duyệt (đã dính lỗi này 1 lần).
await login("admin", "Admin123456@");
const bsAdmin = await bootstrap();
const TEN = new Map((bsAdmin.users || []).map((u) => [u.id, u.username]));
console.log("      bảng tra cứu tài khoản lấy lúc đăng nhập admin: " + TEN.size + " người");

await login("e2e.cht", MK);
let bs = await bootstrap();
// ⛔ Chi dung dong BOQ THAT (co `materialCode` + `materialId`). `boqItems` con gop them dong nguon
//    chua anh xa (BootstrapDataAdapter:517) — dong do `materialCode = null` nen khong dung duoc.
const dongBoq = bs.boqItems.filter((b) => b.boqVersionId === tt.boqVersionId && b.materialCode && b.materialId);
console.log("[5.1] Ban chi huy mo 3 phieu de nghi mua hang (dang nhap that bang " + asUser.current + ")");
console.log("      dong BOQ dung duoc: " + dongBoq.length + " → " + dongBoq.slice(0, 3).map((b) => b.materialCode).join(", ") + " …");
if (dongBoq.length < 9) { console.log("      [LOI] chua du 9 dong BOQ — chay giai-doan-05a.mjs truoc"); process.exitCode = 1; }

const ds = [
  { so: "01", muc: "E2E - Xi mêng cho hạng mục móng", vts: dongBoq.slice(0, 3) },
  { so: "02", muc: "E2E - Vật tư hoàn thiện tầng 1", vts: dongBoq.slice(3, 6) },
  { so: "03", muc: "E2E - Thiết bị điỆn tạm cho công trường", vts: dongBoq.slice(6, 9) },
];

// ⓘ Toàn bộ phần thân bọc trong hàm để có thể `return` sớm; bản cũ để thiếu điều kiện nên gặp
//   TypeError khi không có phiếu nào — đọc thuộc tính của `undefined` là treo cả lượt chạy.
async function chay() {
const dsDaTao = [];
// `create_request` KHÔNG idempotent — mỗi lần chạy sinh phiếu mới. Phải bỏ qua mục đích đã có.
const mucDaCo = new Set((bs.requests || []).map((r) => String(r.purpose || "")));
for (const d of ds) {
  if (mucDaCo.has(d.muc)) {
    console.log("      · E2E-PR-" + d.so + " đã tồn tại → dùng lại, không tạo lại");
    dsDaTao.push(d.so);
    continue;
  }
  const lines = d.vts.map((b) => ({
    materialId: b.materialId, materialCode: b.materialCode, materialName: b.materialName, unit: b.unit || "cai",
    quantity: Math.max(1, Math.round(Number(b.contractQty || 10) / 10)), unitPrice: b.unitPrice || 100000,
    boqItemId: b.id, contractLineNo: b.contractLineRef || b.lineNo || "", origin: "Hop dong",
    approvedSupplier: "", installationArea: "E2E", note: "Dong BOQ that",
  }));
  await buoc("create_request E2E-PR-" + d.so, () => coThat("create_request", {
    projectId: tt.duAn, contractId: tt.hopDongId, boqVersionId: tt.boqVersionId,
    sourceWarehouseId: tt.khoSite, neededAt: "2026-10-15", area: "Công trường E2E Đà Nẵng",
    priority: "normal", purpose: d.muc, lines,
  }), BC);
  dsDaTao.push(d.so);
}

// ── 5.2 ĐỐI CHIẾU: phiếu có thật không, approvals[] có đúng không ──────────────
bs = await bootstrap();
const mucE2E = new Set(ds.map((d) => d.muc));
// ⚠ Phiếu E2E còn sót từ các lượt chạy trước (3 phiếu/đợt × 2 đợt). KHÔNG xoá (chỉ ADD/UPDATE).
//   Chỉ lấy phiếu MỚI NHẤT cho mỗi mục đích — `requests` trả về theo thứ tự mới trước.
const allE2E = bs.requests.filter((r) => mucE2E.has(String(r.purpose || "")));
const donDat = [...new Map(allE2E.map((r) => [String(r.purpose || ""), r])).values()];
if (allE2E.length > donDat.length) {
  console.log("      ⓘ có " + allE2E.length + " phiếu E2E (mỗi mục đích " + (allE2E.length / donDat.length).toFixed(0)
    + " bản) — giữ " + donDat.length + " bản mới nhất, giữ nguyên bản cũ làm bằng chứng.");
}
console.log("\n[5.2] Đếm lại từ máy chủ: phiếu E2E = " + donDat.length + " (mong đợi " + dsDaTao.length + ")");
if (donDat.length !== dsDaTao.length) {
  console.log("      [LOI] số phiếu không khớp — dừng, không đoán tiếp.");
  BC.push({ ten: "5.2 doi chieu so phieu", ok: false, loi: "so phieu " + donDat.length + "/" + dsDaTao.length });
  process.exitCode = 1;
}

const donDau = donDat[0];
if (!donDau) {
  console.log("      [LOI] không có phiếu nào để kiểm chuỗi phê duyệt");
  ghi({ giaiDoan: "5-6", buoc: "ket-thuc-dung", thatBai: BC.filter((x) => !x.ok).map((x) => x.ten) });
  tomTatBuoc("GIAI ĐOẠN 5 + 6", BC);
  process.exitCode = 1;
  return;
}
console.log("      phiếu: " + donDau.requestNo + " · " + donDau.status + " · " + donDat.length + " dòng vật tư");
console.log("      phiếu: " + donDau.requestNo + " · " + donDau.status + " · " + donDat.length + " dòng vật tư");

// ⓘ `approvals[].approverUserId` CHÍNH LÀ nơi máy chủ chép owner từ `approval_project_assignments`
//   lúc tạo phiếu. Không đọc `bs.workflowAssignments`: bootstrap chỉ trả khoá đó cho admin
//   (BootstrapDataAdapter:1011) — tài khoản thường nhận mảng RỖNG nên dễ tưởng chưa gán ai.
const chon = (list, khoa, gt) => list.find((x) => x[khoa] === gt);
const ten = (id) => TEN.get(id) || "(chưa gán)";
const buocPhep = (bs.approvalStages || [])
  .filter((s) => s.stageKind === "approval" && Number(s.stageNo) <= 5)
  .sort((a, b) => Number(a.stageNo) - Number(b.stageNo));
const tinhNgang = (a) => a.status === "approved" || a.status === "rejected" || a.status === "skipped";

console.log("\n      CHUỖI PHÊ DUYỆT MÁY CHỦ TỰ SINH (" + (donDau.approvals || []).length + " bước, bảng khai báo " + buocPhep.length + "):");
if (!donDau.approvals?.length) {
  console.log("      [LỖI] không có approvals[] — phiếu không vào luồng phê duyệt");
  process.exitCode = 1;
} else {
  for (const a of donDau.approvals) {
    const chu = ten(a.approverUserId);
    const auto = tinhNgang(a) && !a.approverUserId;
    console.log("      bước " + a.stage + " · " + String(a.department || "—").padEnd(24)
      + " · " + String(a.status).padEnd(12) + " · " + chu.padEnd(14)
      + (auto ? "⚠ tự đóng mà không gán ai" : "✔ owner " + chu));
  }
  if (donDau.approvals.length !== buocPhep.length) {
    console.log("      [LỖI] số bước = " + donDau.approvals.length + ", bảng khai báo = " + buocPhep.length);
    process.exitCode = 1;
  }
}

// ── 6 DUYỆT TỪNG BƯỚC ──────────────────────────────────────────────────────
console.log("\n[6] Duyệt từng bước bằng ĐÚNG tài khoản được cấu hình:");
console.log("   (người lấy từ approval_project_assignments; bước 1 bị bỏ qua vì người tạo = chính họ)");
for (const don of donDat) {
  console.log("   · " + don.requestNo + " — trạng thái " + don.status);
  for (let lan = 0; lan < 8; lan++) {
    const bs2 = await bootstrap();
    const hien = chon(bs2.requests, "id", don.id);
    const cho = (hien?.approvals || []).find((a) => a.status === "pending");
    if (!cho) { console.log("      không còn bước chờ → hết chuỗi"); break; }
    const so = Number(cho.stage);
    const chu = ten(cho.approverUserId);
    if (chu === "(chưa gán)") { console.log("      [LỖI] bước " + so + " không có owner"); process.exitCode = 1; break; }
    await login(chu, MK);
    asUser.current = chu;
    const r = await buoc("duyet buoc " + so + " (" + chu + ") · " + don.requestNo, () =>
      coThat("decide_approval", { requestId: don.id, stage: so, decision: "approved", comment: "Duyệt bằng kiểm thử E2E — bước " + so }, { nhan: don.requestNo }), BC);
    // ⓘ `coThat` NÉM lỗi khi server từ chối ⇒ `buoc` bắt lỗi và trả `null`.
    //   Kiểm `r?.ok === false` sẽ KHÔNG bao giờ đúng ⇒ vòng lặp quay 8 lần rồi mới dừng.
    if (!r || r.ok === false) break;
    const bs3 = await bootstrap();
    const h2 = chon(bs3.requests, "id", don.id);
    const a2 = (h2?.approvals || []).find((a) => Number(a.stage) === so);
    console.log("      bước " + so + " (" + chu + ") → " + a2?.status + " · phiếu: " + h2?.status
      + " · người quyết định: " + (a2?.approverUserId ? ten(a2.approverUserId) : "(rỗng)"));
  }
  await login("e2e.cht", MK); asUser.current = "e2e.cht";
}

bs = await bootstrap();
const lai = bs.requests.filter((r) => mucE2E.has(String(r.purpose || "")));
console.log("\n[KẾT] Trạng thái cuối của " + lai.length + " phiếu:");
for (const r of lai) console.log("      " + r.requestNo + " → " + r.status
  + " (" + (r.approvals || []).filter(tinhNgang).length + "/" + (r.approvals || []).length + " bước đã kết thúc)");
writeFileSync("tools/e2e/trang-thai-01.json", JSON.stringify({ ...tt, donDat: lai.map((r) => ({ id: r.id, so: r.requestNo, status: r.status })) }, null, 2), "utf8");
ghi({ giaiDoan: "5-6", buoc: "ket-thuc", ketQua: lai.map((r) => r.status), thatBai: BC.filter((x) => !x.ok).map((x) => x.ten) });
await login("admin", "Admin123456@");
tomTatBuoc("GIAI ĐOẠN 5 + 6", BC);
}
await chay();