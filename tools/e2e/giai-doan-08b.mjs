// GIAI ĐOẠN 8B — STO (PHIẾU ĐIỀU CHUYỂN KHO) 5 BƯỚC
// Mục tiêu kiểm thử: STO site -> Transit -> kho tổ đội, bảo toàn Contract ownership.
import fs from "node:fs";
import { login, bootstrap, call, coThat, buoc, tomTatBuoc } from "./client.mjs";

const tt = JSON.parse(fs.readFileSync("tools/e2e/trang-thai-01.json", "utf8"));
const MK = tt.matKhau;
const BC = [];

async function chay() {
  console.log("==============================================================================");
  console.log("GIAI ĐOẠN 8B — STO (ĐIỀU CHUYỂN KHO) 5 BƯỚC");
  console.log("==============================================================================");

  await login("admin", "Admin123456@");
  const bs = await bootstrap();

  // ── Chẩn đoán 1: bảng `warehouses` có kho `type='transit'` không? ────────────
  const kho = bs.warehouses || [];
  const coTransit = kho.filter((w) => String(w.type) === "transit");
  console.log("\n[8.0] Kiểm kho Transit của hệ thống");
  console.log("      tổng số kho: " + kho.length + " · loại: " + [...new Set(kho.map((w) => w.type))].join(", "));
  console.log("      kho type='transit': " + coTransit.length + (coTransit.length ? "" : "   ⛔ KHÔNG CÓ"));

  // ── Chẩn đoán 2: kho tổ đội của dự án E2E ─────────────────────────────────
  const khoTeam = kho.filter((w) => String(w.type) === "team" && w.projectId === tt.duAn);
  if (!khoTeam.length) { console.log("  ⛔ Dự án E2E chưa có kho tổ đội."); process.exitCode = 1; return; }
  const khoDich = khoTeam[0];
  console.log("      kho đích sẽ dùng: " + khoDich.code + " (" + khoDich.name + ")");

  // ── Chẩn đoán 3: tồn thật + tên trường số lượng ────────────────────────────
  const ton = (bs.inventory || []).filter((r) => r.warehouseId === tt.khoSite);
  console.log("      tồn tại kho công trường: " + ton.length + " dòng");
  if (ton.length) console.log("      ⚠ tên trường thực tế của dòng tồn: " + Object.keys(ton[0]).join(", "));
  const soLuong = (r) => Number(r.quantity ?? r.onHand ?? r.stockQty ?? r.qty ?? r.balance ?? 0);
  const co = ton.filter((r) => soLuong(r) > 0);
  console.log("      dòng có tồn > 0: " + co.length);
  for (const r of co.slice(0, 5)) {
    console.log(`        ${String(r.materialCode || r.materialId).padEnd(16)} ${String(r.materialName || "").slice(0, 30).padEnd(32)} ${soLuong(r)}`);
  }
  if (!co.length) { console.log("  ⛔ Kho công trường chưa có tồn nào."); process.exitCode = 1; return; }

  const vatTu = co[0];
  const sl = Math.min(2, Math.floor(soLuong(vatTu)));
  const lines = [{ materialId: vatTu.materialId, quantity: sl, sourceContractId: tt.hopDongId, note: "E2E STO" }];
  console.log("      sẽ điều chuyển: " + sl + " " + (vatTu.materialCode || vatTu.materialId));

  // ── Bước ①: tạo phiếu điều chuyển ─────────────────────────────────────────
  console.log("\n[8.1] Thủ kho (e2e.tk) lập phiếu điều chuyển");
  await login("e2e.tk", MK);
  const tao = await buoc("create_transfer_order", () => coThat("create_transfer_order", {
    sourceWarehouseId: tt.khoSite, destinationWarehouseId: khoDich.id,
    reason: "E2E — cấp vật tư xuống tổ đội", note: "Kiểm thử chuỗi STO 5 bước",
    lines,
  }), BC);

  if (!tao || tao.ok === false) {
    console.log("\n⛔ CHUỖI STO KHÔNG CHẠY ĐƯỢC — ghi nhận lỗi cấu hình dữ liệu");
    console.log("   Nguyên nhân: bảng `warehouses` KHÔNG có dòng `type='transit'`.");
    console.log("   - Migration Drizzle 0030_kho_governance_transfer_reservation.sql:147 có seed:");
    console.log("       INSERT OR IGNORE INTO warehouses ... VALUES ('WH-TRANSIT','TRANSIT',...,'transit',...)");
    console.log("   - Bộ migration FLYWAY (java-backend/.../db/migration/, thực sự chạy lên MySQL) KHÔNG có dòng seed này.");
    console.log("   - Không có action API nào tạo kho ⇒ không tạo được Transit từ giao diện/API.");
    console.log("   ⇒ `StockManagementUseCase.createTransferOrder:624` luôn ném «Thiếu kho Transit hệ thống.»");
    process.exitCode = 1;
    return;
  }

  const bs2 = await bootstrap();
  const sto = (bs2.transferOrders || []).sort((a, b) => String(b.transferNo || "").localeCompare(String(a.transferNo || "")))[0];
  if (!sto) { console.log("  ⛔ Không đọc lại được phiếu điều chuyển."); process.exitCode = 1; return; }
  console.log("      ✔ " + sto.transferNo + " trạng thái=" + sto.status);

  // ── Bước ②: duyệt (Phòng Kế hoạch — inventory.canApprove) ──────────────────
  console.log("\n[8.2] Phòng Kế hoạch (e2e.khnv) duyệt STO");
  await login("e2e.khnv", MK);
  const r2 = await buoc("approve_transfer_order", () => coThat("approve_transfer_order", { transferOrderId: sto.id }), BC);
  if (!r2 || r2.ok === false) { console.log("  ⛔ Dừng tại bước ②."); process.exitCode = 1; return; }

  // ── Bước ③: xuất khỏi kho nguồn sang Transit ─────────────────────────────
  console.log("\n[8.3] Thủ kho (e2e.tk) xác nhận xuất kho nguồn");
  await login("e2e.tk", MK);
  const r3 = await buoc("ship_transfer_order", () => coThat("ship_transfer_order", { transferOrderId: sto.id }), BC);
  if (!r3 || r3.ok === false) { console.log("  ⛔ Dừng tại bước ③."); process.exitCode = 1; return; }

  // ── Bước ④: kho đích nhận ────────────────────────────────────────────────
  console.log("\n[8.4] Thủ kho (e2e.tk) xác nhận nhận tại kho đích");
  const bs3 = await bootstrap();
  const sto3 = (bs3.transferOrders || []).find((t) => t.id === sto.id);
  const items = bs3.transferOrderItems?.filter((i) => i.transferOrderId === sto.id) || [];
  const dong = items.length
    ? items.map((i) => ({ transferOrderItemId: i.id, receivedQty: i.approvedQty ?? i.shippedQty, rejectedQty: 0 }))
    : [];
  const r4 = await buoc("receive_transfer_order", () => coThat("receive_transfer_order", {
    transferOrderId: sto.id, lines: dong,
  }), BC);
  if (!r4 || r4.ok === false) { console.log("  ⛔ Dừng tại bước ④."); process.exitCode = 1; return; }

  // ── Bước ⑤: sinh phiếu nhập GRN-STO ──────────────────────────────────────
  console.log("\n[8.5] Thủ kho (e2e.tk) lập phiếu nhập từ STO (GRN-STO)");
  const r5 = await buoc("create_transfer_grn", () => coThat("create_transfer_grn", { transferId: sto.id }), BC);
  if (!r5 || r5.ok === false) { console.log("  ⛔ Dừng tại bước ⑤."); process.exitCode = 1; return; }

  // ── Đối chiếu lại từ máy chủ (D-070) ──────────────────────────────────────
  console.log("\n[8.6] Đối chiếu từ máy chủ");
  const bs4 = await bootstrap();
  const cn = (bs4.transferOrders || []).find((t) => t.id === sto.id);
  const grnSto = (bs4.receipts || []).filter((r) => String(r.receiptNo || "").startsWith("GRN-STO"));
  console.log("      STO " + (cn?.transferNo || "?") + " → " + (cn?.status || "?"));
  console.log("      GRN sinh ra: " + grnSto.map((g) => g.receiptNo).join(", "));
  if (cn?.status !== "received") { console.log("  ⛔ STO chưa đạt trạng thái received."); process.exitCode = 1; }
  if (!grnSto.length) { console.log("  ⛔ Không sinh được phiếu nhập GRN-STO."); process.exitCode = 1; }

  console.log("\n" + tomTatBuoc("GIAI ĐOẠN 8B — STO", BC));
}

chay().catch((e) => { console.log("[LOI]", e.message); process.exitCode = 1; });