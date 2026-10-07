import { readFileSync, writeFileSync } from "node:fs";
import { login, bootstrap, coThat, buoc, tomTatBuoc, asUser, ghi, taiTep, tieuDe } from "./client.mjs";

const BC = [];
const tt = JSON.parse(readFileSync("tools/e2e/trang-thai-01.json", "utf8"));
const MK = tt.matKhau;
// Ảnh PNG 1×1 hợp lệ, base64 — chỉ để thoát khỏi điều kiện «phải có ≥1 ảnh giao hàng thực tế».
const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");

tieuDe("GIAI ĐOẠN 8 — KHO NHẬN HÀNG, PHIẾU NHẬP (GRN) VÀ BCH XÁC NHẬN");

await login("admin", "Admin123456@");
let bs = await bootstrap();
const pos = (bs.purchaseOrders || []).filter((p) => p.projectId === tt.duAn && p.status === "waiting_delivery");
console.log("\n[8.1] Kho (e2e.tk) lập phiếu nhận hàng cho " + pos.length + " PO đang chờ giao");

const grns = [];
for (const p of pos) {
  const items = p.items || p.orderItems || [];
  if (!items.length) { console.log("      [LOI] " + p.poNo + " không đọc được dòng PO"); process.exitCode = 1; continue; }
  const lines = items.map((i) => ({ purchaseOrderItemId: i.id, quantity: i.orderedQty ?? i.quantity ?? 1, lotNo: "LOT-E2E-01" }));
  await login("e2e.tk", MK);
  asUser.current = "e2e.tk";
  await buoc("receive_goods · " + p.poNo, () => coThat("receive_goods", {
    purchaseOrderId: p.id, lines,
    certificateStatus: "complete", deliveryDocumentStatus: "complete", qcOk: true,
  }, p.poNo), BC);
}

bs = await bootstrap();
// ⚠ Lọc theo DỰ ÁN chứ không theo danh sách PO ở bước 8.1: sau lượt chạy đầu PO đã sang
//   `delivered_pending_confirmation` nên bộ lọc `waiting_delivery` sẽ rỗng ⇒ mất cả phiếu nhận.
const receipts = (bs.receipts || []).filter((r) => r.projectId === tt.duAn);
console.log("      phiếu nhập của dự án: " + receipts.length + " · chờ BCH: "
  + receipts.filter((r) => r.bchConfirmationStatus === "pending").length);
console.log("\n[8.2] Tải ảnh giao hàng cho từng phiếu nhập (bắt buộc trước khi BCH xác nhận)");
for (const rc of receipts) {
  if (rc.bchConfirmationStatus !== "pending") { console.log("      · " + (rc.receiptNo || rc.id) + " đã xác nhận → bỏ qua"); continue; }
  await login("e2e.tk", MK);
  asUser.current = "e2e.tk";
  await buoc("tai anh · " + (rc.receiptNo || rc.id), async () => {
    await taiTep("goods_receipt", rc.id, "e2e-giao-hang.png", "image/png", PNG_1PX);
    return { ok: true };
  }, BC);
}

bs = await bootstrap();
console.log("\n[8.3] BCH (e2e.cht) xác nhận giao hàng — vai trò `commander`");
for (const rc of (bs.receipts || []).filter((r) => receipts.some((x) => x.id === r.id) && r.bchConfirmationStatus === "pending")) {
  await login("e2e.cht", MK);
  asUser.current = "e2e.cht";
  await buoc("confirm_delivery · " + (rc.receiptNo || rc.id), () => coThat("confirm_delivery", {
    receiptId: rc.id, certificateStatus: "complete", deliveryDocumentStatus: "complete",
    comment: "BCH xác nhận giao hàng bằng kiểm thử E2E",
  }, BC), BC);
}

bs = await bootstrap();
console.log("\n[8.4] Đối chiếu từ máy chủ:");
for (const rc of bs.receipts.filter((r) => receipts.some((x) => x.id === r.id))) {
  console.log("      " + (rc.receiptNo || rc.id) + " · BCH=" + rc.bchConfirmationStatus
    + " · hạch=" + rc.postingStatus + " · nhận=" + rc.acceptedQty + "/" + rc.actualDeliveredQty
    + " · chứng từ=" + rc.attachmentCount);
}
for (const p of bs.purchaseOrders.filter((x) => x.projectId === tt.duAn)) {
  console.log("      PO " + p.poNo + " → " + p.status);
}
const xacNhan = (bs.receipts || []).filter((r) => receipts.some((x) => x.id === r.id) && r.bchConfirmationStatus === "confirmed").length;
if (!xacNhan) { console.log("      [LOI] chưa phiếu nhận nào được BCH xác nhận"); process.exitCode = 1; }
writeFileSync("tools/e2e/trang-thai-01.json", JSON.stringify({
  ...tt,
  grns: (bs.receipts || []).filter((r) => receipts.some((x) => x.id === r.id))
    .map((r) => ({ id: r.id, so: r.receiptNo, xacNhan: r.bchConfirmationStatus })),
}, null, 2), "utf8");
ghi({ giaiDoan: "8a", buoc: "ket-thuc", xacNhan, thatBai: BC.filter((x) => !x.ok).map((x) => x.ten) });
await login("admin", "Admin123456@");
tomTatBuoc("GIAI ĐOẠN 8A — NHẬN HÀNG + GRN", BC);