// GIAI ĐOẠN 8C — XUẤT KHO CHO TỔ ĐỘI (5 BƯỚC) + TỔ ĐỘI TRẢ LẠI VẬT TƯ
// Chạy lại an toàn: mỗi bước được dẫn bởi TRẠNG THÁI thực tế trên máy chủ, không phải bằng biến đếm.
import fs from "node:fs";
import { login, bootstrap, coThat, buoc, tomTatBuoc } from "./client.mjs";

const tt = JSON.parse(fs.readFileSync("tools/e2e/trang-thai-01.json", "utf8"));
const MK = tt.matKhau;
const BC = [];

const daDoi = new Set(["completed", "cancelled", "posted"]);

async function chay() {
  console.log("==============================================================================");
  console.log("GIAI ĐOẠN 8C — XUẤT KHO CHO TỔ ĐỘI + TỔ ĐỘI TRẢ LẠI VẬT TƯ");
  console.log("==============================================================================");

  await login("admin", "Admin123456@");
  let bs = await bootstrap();
  const duAn = bs.projects.find((p) => p.id === tt.duAn);
  const toDoi = (bs.teams || []).find((t) => t.projectId === tt.duAn);
  if (!duAn || !toDoi) { console.log("  ⛔ Không tìm thấy dự án / tổ đội E2E."); process.exitCode = 1; return; }
  console.log(`[8.0] Dự án ${duAn.code} · tổ đội ${toDoi.code} · kho tổ đội ${toDoi.warehouseId}`);

  // ── Tìm phiếu xuất kho đã có sẵn của dự án (idempotency) ────────────────────
  const timPx = (b) => (b.issues || [])
    .filter((x) => x.projectId === tt.duAn && x.teamId === toDoi.id)
    .sort((a, c) => String(c.issuedAt || "").localeCompare(String(a.issuedAt || "")))[0];
  let px = timPx(bs);
  console.log(`      phiếu xuất kho hiện có: ${px ? px.issueNo + " (" + px.status + ", " + px.itemCount + " dòng)" : "(chưa có)"}`);

  // ── Bước ①: lập phiếu xuất kho ────────────────────────────────────────────
  if (!px) {
    console.log("\n[8.1] Thủ kho (e2e.tk) lập phiếu xuất kho cho tổ đội");
    await login("e2e.khnv", MK);
    const bsK = await bootstrap();
    const mr = (bsK.requests || [])
      .filter((r) => r.projectId === tt.duAn && ["approved", "ordered", "partial_received", "received", "partial_issued"].includes(r.status))
      .map((r) => ({ r, items: (r.items || []).filter((i) => Number(i.issuedQty || 0) === 0 && Number(i.approvedPurchaseQty || 0) > 0) }))
      .filter((x) => x.items.length > 0)
      .sort((a, c) => String(a.r.requestNo).localeCompare(String(c.r.requestNo)))[0];
    if (!mr) { console.log("  ⛔ Không còn dòng nào cần cấp phát."); process.exitCode = 1; return; }
    console.log(`      MR: ${mr.r.requestNo} · ${mr.items.length} dòng chưa cấp phát`);

    // ⛔ `stock_issues.received_by_name` NOT NULL (V1__baseline.sql:1709) nhưng lấy từ
    //    `nvl(payload.receivedByName)` ⇒ không truyền là NULL ⇒ HTTP 409 «vi phạm ràng buộc».
    // ⛔ `requests[].items[].contractId` RỖNG ⇒ phải truyền `contractId` ở từng dòng.
    await login("e2e.tk", MK);
    const bsKho = await bootstrap();
    const ton = (bsKho.inventory || []).filter((r) => r.warehouseId === tt.khoSite && Number(r.balance) > 0);
    const cand = mr.items.map((i) => ({
      materialId: i.materialId, quantity: Math.min(1, Number(i.approvedPurchaseQty || 0)),
      requestItemId: i.id, contractId: tt.hopDongId,
      workPackageCode: "E2E-HANG-MUC-01", installationArea: "Khu A — Tầng 1",
    }));
    const du = cand.filter((l) => ton.some((r) => r.materialId === l.materialId));
    if (!du.length) { console.log("  ⛔ Không dòng nào có tồn tại kho công trường."); process.exitCode = 1; return; }
    const r1 = await buoc("issue_stock", () => coThat("issue_stock", {
      projectId: tt.duAn, fromWarehouseId: tt.khoSite, teamId: toDoi.id, requestId: mr.r.id, lines: du,
      receivedByName: "E2E Tổ trưởng", note: "E2E — cấp phát vật tư cho tổ đội",
    }), BC);
    if (!r1 || r1.ok === false) { console.log("  ⛔ Dừng tại bước ①."); process.exitCode = 1; return; }
    await login("admin", "Admin123456@");
    bs = await bootstrap();
    px = timPx(bs);
    if (!px) { console.log("  ⛔ Không đọc lại được phiếu xuất kho."); process.exitCode = 1; return; }
  }
  console.log(`      ✔ phiếu ${px.issueNo} · trạng thái ${px.status} · ${px.itemCount} dòng · ${px.totalQty} đơn vị`);

  // ── Bước ②: CHT duyệt (role commander|admin) ───────────────────────────────
  if (px.status === "pending_cht") {
    console.log("\n[8.2] Chỉ huy trưởng (e2e.cht) duyệt phiếu xuất kho");
    await login("e2e.cht", MK);
    const r2 = await buoc("approve_stock_issue", () => coThat("approve_stock_issue", {
      issueId: px.id, decision: "approved", comment: "E2E — duyệt cấp phát cho tổ đội",
    }), BC);
    if (!r2 || r2.ok === false) { console.log("  ⛔ Dừng tại bước ②."); process.exitCode = 1; return; }
    px = { ...px, status: "approved" };
  } else console.log(`\n[8.2] Bỏ qua — phiếu đang ở trạng thái ${px.status}`);

  // ── Bước ③: tiến hành xuất kho (ghi sổ kho tại đây) ─────────────────────────
  if (px.status === "approved") {
    console.log("\n[8.3] Thủ kho (e2e.tk) tiến hành xuất kho");
    await login("e2e.tk", MK);
    const r3 = await buoc("issue_stock_confirm", () => coThat("issue_stock_confirm", { issueId: px.id, comment: "E2E — bắt đầu xuất" }), BC);
    if (!r3 || r3.ok === false) { console.log("  ⛔ Dừng tại bước ③."); process.exitCode = 1; return; }
    px = { ...px, status: "issued" };
  } else console.log(`\n[8.3] Bỏ qua — phiếu đang ở trạng thái ${px.status}`);

  // ── Bước ④: thủ kho xác nhận xuất đủ ──────────────────────────────────────
  if (px.status === "issued") {
    console.log("\n[8.4] Thủ kho (e2e.tk) xác nhận đã xuất đủ");
    const r4 = await buoc("confirm_stock_issue", () => coThat("confirm_stock_issue", { issueId: px.id, comment: "E2E — xuất đủ" }), BC);
    if (!r4 || r4.ok === false) { console.log("  ⛔ Dừng tại bước ④."); process.exitCode = 1; return; }
    px = { ...px, status: "completed" };
  } else console.log(`\n[8.4] Bỏ qua — phiếu đang ở trạng thái ${px.status}`);

  // ── Bước ⑤: sinh phiếu nhập GRN-PX ────────────────────────────────────────
  let coGrnPx;
  await login("admin", "Admin123456@");
  bs = await bootstrap();
  coGrnPx = (bs.receipts || []).filter((r) => String(r.receiptNo || "").startsWith("GRN-PX") && String(r.projectId) === tt.duAn);
  if (!coGrnPx.length) {
    console.log("\n[8.5] Thủ kho (e2e.tk) lập phiếu nhập từ phiếu xuất (GRN-PX)");
    await login("e2e.tk", MK);
    const r5 = await buoc("create_issue_grn", () => coThat("create_issue_grn", { issueId: px.id }), BC);
    if (!r5 || r5.ok === false) { console.log("  ⛔ Dừng tại bước ⑤."); process.exitCode = 1; return; }
  } else console.log(`\n[8.5] Bỏ qua — đã có ${coGrnPx.map((g) => g.receiptNo).join(", ")}`);

  // ── Bước ⑥: tổ đội trả lại vật tư ─────────────────────────────────────────
  await login("admin", "Admin123456@");
  bs = await bootstrap();
  let dsTra = (bs.returns || []).filter((r) => r.projectId === tt.duAn);
  if (dsTra.length) console.log(`\n[8.6] Bỏ qua — đã có phiếu trả vật tư ${dsTra.map((g) => g.returnNo || g.id).join(", ")}`);
  else {
    console.log("\n[8.6] Tổ đội (e2e.to) trả lại vật tư dư");
    await login("e2e.to", MK);
    // ⛔ bootstrap `inventory` CHỈ liệt kê kho `site` (5 kho × 237 vật tư); kho `central` nằm ở
    //    `centralInventory`, kho `team` KHÔNG nằm ở đâu ⇒ phải đọc `contractStockBalances`.
    const bsTo = await bootstrap();
    const tonTo = (bsTo.contractStockBalances || []).filter((r) => r.warehouseId === toDoi.warehouseId && Number(r.balance) > 0);
    console.log("      tồn kho tổ đội: " + (tonTo.length ? tonTo.map((r) => r.materialCode + "=" + r.balance).join(", ") : "(không có)"));
    if (!tonTo.length) { console.log("  ⛔ Kho tổ đội chưa có tồn ⇒ không trả được."); process.exitCode = 1; return; }
    const tra = tonTo.slice(0, 2).map((r) => ({
      materialId: r.materialId, quantity: Math.min(1, Number(r.balance)), condition: "usable",
      reason: "E2E — vật tư thừa, trả lại kho công trường", contractId: tt.hopDongId,
    }));
    const r6 = await buoc("return_stock", () => coThat("return_stock", {
      projectId: tt.duAn, teamId: toDoi.id, toWarehouseId: tt.khoSite, lines: tra,
      returnedByName: "E2E Tổ trưởng", note: "Kiểm thử hoàn trả vật tư",
    }), BC);
    if (!r6 || r6.ok === false) { console.log("  ⛔ Dừng tại bước ⑥."); process.exitCode = 1; return; }
  }

  // ── Đối chiếu lại từ máy chủ (D-070: chỉ tin phần đọc lại này) ──────────────
  console.log("\n[8.7] ĐỐI CHIẾU TỪ MÁY CHỦ");
  await login("admin", "Admin123456@");
  const bsF = await bootstrap();
  const pxF = (bsF.issues || []).find((x) => x.id === px.id);
  const grnPx = (bsF.receipts || []).filter((r) => String(r.receiptNo || "").startsWith("GRN-PX") && r.projectId === tt.duAn);
  const ret = (bsF.returns || []).filter((r) => r.projectId === tt.duAn);
  const tonToF = (bsF.contractStockBalances || []).filter((r) => r.warehouseId === toDoi.warehouseId && Number(r.balance) > 0);
  const ledgerTeam = (bsF.contractStockLedger || []).filter((l) => l.warehouseId === toDoi.warehouseId);
  console.log(`      phiếu xuất  ${pxF?.issueNo} → ${pxF?.status} (${pxF?.itemCount} dòng, ${pxF?.totalQty} đv)`);
  console.log(`      GRN-PX      ${grnPx.map((g) => `${g.receiptNo} [${g.postingStatus}/${g.bchConfirmationStatus}] ${g.itemCount} dòng`).join(", ") || "(không có)"}`);
  console.log(`      phiếu trả   ${ret.map((g) => `${g.returnNo} [${g.status}] ${g.itemCount} dòng`).join(", ") || "(không có)"}`);
  console.log(`      tồn kho tổ đội còn ${tonToF.map((r) => r.materialCode + "=" + r.balance).join(", ") || "(rỗng)"}`);
  console.log(`      sổ Contract tại kho tổ đội: ${ledgerTeam.length} dòng`);
  // ⓘ Sau bước ⑤ `create_issue_grn` đổi trạng thái phiếu xuất sang `grn_created`
  //   (không phải `completed`) ⇒ tiêu chí đối chiếu phải chấp nhận cả hai.
  const xongPhieu = pxF?.status === "grn_created" || pxF?.status === "completed";
  const that = [xongPhieu, grnPx.length > 0, ret.length > 0, ledgerTeam.length > 0];
  if (that.some((x) => !x)) { console.log("  ⛔ CÓ ĐIỀU CHƯA KHỚP — xem dòng trên."); process.exitCode = 1; }
  else console.log("      ✔ cả 4 mốc khớp");

  console.log("\n" + tomTatBuoc("GIAI ĐOẠN 8C — XUẤT KHO + TRẢ VẬT TƯ", BC));
}

chay().catch((e) => { console.log("[LOI]", e.message); process.exitCode = 1; });