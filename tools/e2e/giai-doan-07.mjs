import { readFileSync, writeFileSync } from "node:fs";
import { login, bootstrap, call, coThat, buoc, tomTatBuoc, asUser, ghi, tieuDe } from "./client.mjs";

const BC = [];
const tt = JSON.parse(readFileSync("tools/e2e/trang-thai-01.json", "utf8"));
const MK = tt.matKhau;
const ETA = "2026-10-20";

tieuDe("GIAI ĐOẠN 7 — TẠO ĐƠN MUA HÀNG (PO) VÀ DUYỆT PO");

await login("admin", "Admin123456@");
let bs = await bootstrap();
const ncc = (bs.suppliers || []).find((s) => s.active !== false);
console.log("\n[7.0] Nhà cung cấp: " + ncc.name + " (" + ncc.id + ") · kho nhận: " + tt.khoSite);

// ── 7.1 Phòng Kế hoạch lập PO từ các phiếu đã duyệt ───────────────────────────
const don = (bs.requests || []).filter((r) => String(r.purpose || "").startsWith("E2E") && r.status === "approved");
const daCoPo = new Set((bs.purchaseOrders || []).map((p) => p.requestId));
console.log("[7.1] Phòng Kế hoạch (e2e.khnv) lập PO cho " + don.length + " phiếu đã duyệt");
console.log("      ⓘ KHÔNG có action «tách PO» hay «đặt PO» riêng — tách/đặt chỉ làm trong create_po:");
console.log("        mỗi dòng gắn `requestItemId`; một dòng phiếu có thể tách ra N dòng PO, và cộng dồn");

const tao = [];
for (const d of don) {
  if (daCoPo.has(d.id)) {
    console.log("      · " + d.requestNo + " đã có PO → bỏ qua (idempotent)");
    continue;
  }
  const items = (d.items || []).filter((i) => Number(i.approvedPurchaseQty || 0) > 0);
  const lines = items.map((i) => ({
    requestItemId: i.id,
    quantity: Math.max(1, Math.round(Number(i.approvedPurchaseQty) / 2)),  // ⓘ CHỈ ĐẶT MỘT NỬA ⇒ chứng minh được tách dòng
    supplierId: ncc.id,
    plannedDeliveryAt: ETA,
  }));
  if (!lines.length) { console.log("      [LOI] " + d.requestNo + " không có dòng nào được duyệt"); process.exitCode = 1; continue; }
  await login("e2e.khnv", MK);
  asUser.current = "e2e.khnv";
  await buoc("create_po · " + d.requestNo + " (" + lines.length + " dòng)", () => coThat("create_po", {
    requestId: d.id, warehouseId: tt.khoSite, supplierId: ncc.id, eta: ETA, lines,
  }, d.requestNo), BC);
  tao.push(d.requestNo);
}

// ── 7.2 Kế toán duyệt PO ────────────────────────────────────────────────────
bs = await bootstrap();
const poMoi = (bs.purchaseOrders || []).filter((p) => tao.includes((bs.requests.find((r) => r.id === p.requestId) || {}).requestNo));
console.log("\n[7.2] Kế toán (e2e.kt) duyệt " + poMoi.length + " PO — vai trò `accountant` được `decidePo` cho phép");
for (const p of poMoi) {
  await login("e2e.kt", MK);
  asUser.current = "e2e.kt";
  await buoc("approve_po · " + p.poNo, () => coThat("approve_po", { purchaseOrderId: p.id }, p.poNo), BC);
}

// ── 7.3 Đối chiếu lại từ máy chủ ───────────────────────────────────────────
bs = await bootstrap();
console.log("\n[7.3] Đối chiếu từ máy chủ:");
for (const p of bs.purchaseOrders.filter((x) => x.projectId === tt.duAn)) {
  const lay = bs.requests.find((r) => r.id === p.requestId);
  console.log("      " + p.poNo + " · " + p.status + " · " + (p.items?.length ?? p.itemCount ?? "?") + " dòng"
    + " · từ phiếu " + lay?.requestNo + " · " + (p.totalAmount != null ? p.totalAmount : ""));
}
const trang = bs.purchaseOrders.filter((p) => p.projectId === tt.duAn).map((p) => p.status);
if (!trang.some((s) => s === "waiting_delivery")) {
  console.log("      [LOI] không có PO nào sang `waiting_delivery`");
  process.exitCode = 1;
}
writeFileSync("tools/e2e/trang-thai-01.json", JSON.stringify({
  ...tt,
  poList: bs.purchaseOrders.filter((p) => p.projectId === tt.duAn).map((p) => ({ id: p.id, so: p.poNo, status: p.status, requestId: p.requestId })),
  nccId: ncc.id,
}, null, 2), "utf8");
ghi({ giaiDoan: "7", buoc: "ket-thuc", trangThaiPo: trang, thatBai: BC.filter((x) => !x.ok).map((x) => x.ten) });
await login("admin", "Admin123456@");
tomTatBuoc("GIAI ĐOẠN 7", BC);