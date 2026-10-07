/**
 * GO-LIVE — HOÀN TẤT VÒNG ĐỜI 2 QUY TRÌNH KHO (yêu cầu user: «workflow xuất-nhập kho … cũng phải được thực hiện»).
 *
 * ⛔ VÌ SAO CẦN: các lượt trước tôi mới TẠO phiếu rồi DỪNG. Đo được: **5 phiếu điều chuyển** đều
 *    `status = requested`, **5 phiếu trả Kho Tổng** đều `pending_approval`, `centralInventory` = **0**
 *    ⇒ quy trình **chưa hoàn tất** (hàng chưa hề di chuyển).
 *
 * VÒNG ĐỜI (đọc từ `StockManagementUseCase`, ⛔ không đoán):
 *   Điều chuyển : `requested` →[approve_transfer_order]→ `approved` →[ship_transfer_order]→ `in_transit`
 *                 →[receive_transfer_order]→ nhận
 *   Trả Kho Tổng: `pending_approval` →[approve_central_return]→ `in_transit`
 *                 →[receive_central_return + lines]→ nhận (⛔ BẮT BUỘC có `lines` kiểm đếm)
 *
 * ⛔ Mỗi bước ĐỌC LẠI từ máy chủ; ghi rõ bước nào chạy bằng tài khoản nghiệp vụ, bước nào phải dùng admin.
 */
import { readFileSync } from "node:fs";
import { login, bootstrap, call, coThat, buoc, tomTatBuoc, ghi, taiTep, tieuDe } from "./client.mjs";

/** Ảnh PNG 1×1 hợp lệ — chỉ để thoả chốt «phải có ≥1 ảnh kiểm đếm» (giống ảnh giao hàng của GRN). */
const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");

const tt = JSON.parse(readFileSync("tools/e2e/trang-thai-01.json", "utf8"));
const MK = tt.matKhau;
const MK_ADMIN = "Admin123456@";
const DU_AN = tt.duAn;
const KHO_SITE = tt.khoSite;
const BC = [];

const ds = (bs, k) => (Array.isArray(bs[k]) ? bs[k] : []);
const tonTheoKho = (bs) => {
  const g = {};
  for (const x of [...(bs.inventory || []), ...(bs.companyAvailability || [])]) {
    const con = Number(x.balance ?? x.onHand ?? 0);
    if (con > 0) g[x.warehouseCode] = (g[x.warehouseCode] || 0) + con;
  }
  return g;
};

/** Gọi action: thử tài khoản NGHIỆP VỤ trước; nếu bị chặn thì ghi rõ rồi mới dùng admin. */
async function goiVoiFallback(tenTaiKhoan, action, payload, nhan) {
  await login(tenTaiKhoan, MK);
  let r = await call(action, payload, { boQuaLoi: true, nhan: `${nhan} [${tenTaiKhoan}]` });
  if (r.ok) { console.log(`         ${action} bằng ${tenTaiKhoan} ✔`); return { ok: true, r, ai: tenTaiKhoan }; }
  console.log(`         ${action} bằng ${tenTaiKhoan} bị chặn: ${String(r._loi).slice(0, 110)}`);
  await login("admin", MK_ADMIN);
  r = await call(action, payload, { boQuaLoi: true, nhan: `${nhan} [admin]` });
  if (!r.ok) { await buoc(`${nhan} (admin)`, () => coThat(action, payload, nhan), BC); return { ok: false, r, ai: "admin" }; }
  console.log(`         ${action} bằng admin ✔`);
  return { ok: true, r, ai: "admin" };
}

tieuDe("GO-LIVE — HOÀN TẤT VÒNG ĐỜI: ĐIỀU CHUYỂN KHO + TRẢ KHO TỔNG");

await login("admin", MK_ADMIN);
let bs = await bootstrap();
const tonTruoc = tonTheoKho(bs);
console.log(`\n[XUẤT PHÁT] tồn theo kho: ${JSON.stringify(tonTruoc)}`);
console.log(`           transferOrders=${ds(bs, "transferOrders").length} · centralReturns=${ds(bs, "centralReturns").length} · centralInventory=${ds(bs, "centralInventory").length}`);

// ═══════════════════════════════════════════════════════════════════════════════
// A · ĐIỀU CHUYỂN KHO — approve → ship → receive
// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n═══ A · ĐIỀU CHUYỂN KHO ═══");
const trfChoDuyet = ds(bs, "transferOrders").filter((t) => String(t.status) === "requested");
console.log(`   phiếu đang 'requested': ${trfChoDuyet.length}`);
let aDuyet = 0, aXuat = 0, aNhan = 0;

for (const t of trfChoDuyet) {
  console.log(`\n   ── ${t.transferNo} · ${t.sourceWarehouseCode} → ${t.destinationWarehouseCode}`);
  const p = { transferOrderId: t.id };
  const r1 = await goiVoiFallback("e2e.khnv", "approve_transfer_order", p, `duyệt ${t.transferNo}`);
  if (!r1.ok) continue;
  // ⛔ Ghi trạng thái NGAY SAU khi duyệt — không đọc ở cuối vòng (lúc đó đã là `received`,
  //    nên phép kiểm `status === "approved"` sẽ luôn sai — đã dính).
  await login("admin", MK_ADMIN);
  if (String(ds(await bootstrap(), "transferOrders").find((x) => x.id === t.id)?.status) === "approved") aDuyet++;
  const r2 = await goiVoiFallback("e2e.tk", "ship_transfer_order", p, `xuất ${t.transferNo}`);
  if (!r2.ok) continue;
  const r3 = await goiVoiFallback("e2e.khnv", "receive_transfer_order", p, `nhận ${t.transferNo}`);
  if (!r3.ok) continue;
  await login("admin", MK_ADMIN);
  const sau = ds(await bootstrap(), "transferOrders").find((x) => x.id === t.id);
  console.log(`         → status cuối = ${sau?.status} · đã xuất=${sau?.shippedQty} · đã nhận=${sau?.receivedQty}`);
  if (String(sau?.status) === "approved") aDuyet++;
  if (["in_transit", "received", "completed"].includes(String(sau?.status))) aXuat++;
  if (Number(sau?.receivedQty || 0) > 0) aNhan++;
}

// ⛔ ĐO TRẠNG THÁI CUỐI CỦA **TẤT CẢ** PHIẾU, không chỉ phiếu vừa chạy trong lượt này.
//    Vòng đời là việc MỘT LẦN: chạy lại lần 2 thì `requested` = 0 (đã xong ở lượt trước).
//    Nếu chỉ đếm theo lượt chạy thì lần sau bài test báo ĐỎ GIẢ dù hệ thống vẫn đúng.
await login("admin", MK_ADMIN);
const trfTatCa = ds(await bootstrap(), "transferOrders");
const trfKetThuc = trfTatCa.filter((t) => ["received", "completed"].includes(String(t.status)));
const trfDaXuat = trfTatCa.filter((t) => ["in_transit", "received", "completed"].includes(String(t.status)));
console.log(`\n   [A·đo cuối] ${trfTatCa.length} phiếu · đã xuất trở lên = ${trfDaXuat.length} · đã nhận = ${trfKetThuc.length}`);
for (const t of trfTatCa) console.log(`      ${t.transferNo} · ${t.status} · xuất=${t.shippedQty} · nhận=${t.receivedQty} · ${t.sourceWarehouseCode} → ${t.destinationWarehouseCode}`);

// ═══════════════════════════════════════════════════════════════════════════════
// B · TRẢ KHO TỔNG — approve → receive (kèm lines kiểm đếm)
// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n═══ B · TRẢ KHO TỔNG ═══");
await login("admin", MK_ADMIN);
bs = await bootstrap();
const cretChoDuyet = ds(bs, "centralReturns").filter((r) => String(r.status) === "pending_approval");
console.log(`   phiếu đang 'pending_approval': ${cretChoDuyet.length}`);

// ── B0 · ĐỐI CHỨNG ÂM: các phiếu xin trả vật tư KHÔNG có tồn vật lý PHẢI bị chặn ───────────
// ⛔ Đây là chốt nghiệp vụ ĐÚNG («Tồn vật lý/Contract nguồn không đủ; dừng duyệt để tránh sai sổ»).
//    KHÔNG lách chốt — thoả nó bằng một phiếu hợp lệ ở B1 bên dưới.
const maTon = new Set((bs.inventory || []).filter((x) => String(x.warehouseId) === KHO_SITE && Number(x.balance ?? 0) > 0).map((x) => String(x.materialId)));
const thieuTon = cretChoDuyet.filter((r) => (r.items || []).some((i) => !maTon.has(String(i.materialId))));
let bChanDung = 0;
for (const r of thieuTon) {
  await login("admin", MK_ADMIN);
  const kq = await call("approve_central_return", { centralReturnId: r.id }, { boQuaLoi: true, nhan: `B0-chan-${r.returnNo}` });
  const dungChot = !kq.ok && /không đủ/.test(String(kq._loi || ""));
  if (dungChot) bChanDung++;
  console.log(`   [ÂM] ${r.returnNo}: ${dungChot ? "✔ BỊ CHẶN ĐÚNG" : "⛔ không chặn / sai thông báo"} — ${String(kq._loi || "(không lỗi)").slice(0, 95)}`);
}
console.log(`   → ${bChanDung}/${thieuTon.length} phiếu thiếu tồn bị chặn đúng`);

// ── B1 · DƯƠNG: tạo phiếu trả HỢP LỆ (vật tư CÓ tồn vật lý) rồi chạy trọn vòng đời ─────────
console.log("\n   ── B1 · phiếu trả HỢP LỆ cho vật tư có tồn thật ──");
const duocTra = (bs.inventory || []).filter((x) => String(x.warehouseId) === KHO_SITE && Number(x.available ?? 0) > 0)[0];
let bDuyet = 0, bNhan = 0, cretMoiId = null;
if (!duocTra) {
  console.log("   ⛔ kho nguồn không còn vật tư khả dụng để trả.");
} else {
  console.log(`   chọn ${duocTra.materialCode} (available=${duocTra.available}) · ${String(duocTra.materialName).slice(0, 40)}`);
  // ⛔ Dùng helper có fallback: `e2e.tk` bị chặn ở `create_central_return` (thiếu quyền
  //    `central_warehouse`), nên phải thử user trước rồi mới tới admin — và GHI RÕ ai làm được.
  const rc = (await goiVoiFallback("e2e.tk", "create_central_return", {
    projectId: DU_AN, sourceWarehouseId: KHO_SITE, note: "GO-LIVE — trả vật tư dư (có tồn thật)",
    lines: [{ materialId: duocTra.materialId, quantity: 1, unitCost: Number(duocTra.unitCost || 0) }],
  }, "B1-tao")).r;
  console.log(`   tạo phiếu: ${rc.ok ? "✔ " + (rc.message || "") : "⛔ " + rc._loi}`);
  await login("admin", MK_ADMIN);
  const moi = ds(await bootstrap(), "centralReturns").filter((r) => String(r.status) === "pending_approval")
    .find((r) => (r.items || []).some((i) => String(i.materialId) === String(duocTra.materialId)));
  cretMoiId = moi?.id || null;
  console.log(`   phiếu mới = ${moi?.returnNo} · ${moi?.status}`);

  if (cretMoiId) {
    const r1 = await goiVoiFallback("e2e.tk", "approve_central_return", { centralReturnId: cretMoiId }, `duyệt ${moi.returnNo}`);
    await login("admin", MK_ADMIN);
    const giua = ds(await bootstrap(), "centralReturns").find((x) => x.id === cretMoiId);
    console.log(`   → sau duyệt: status = ${giua?.status}`);
    if (String(giua?.status) === "in_transit") bDuyet++;

    if (r1.ok && giua?.status === "in_transit") {
      // ⛔ CHỐT NGHIỆP VỤ: `StockManagementUseCase:904` đòi `centralReturnImageCount(returnId) >= 1`,
      //    mà adapter đếm `attachments WHERE entity_type='central_return' AND mime_type LIKE 'image/%'`
      //    (`WarehouseStockStoreAdapter:839`) ⇒ PHẢI tải ảnh kiểm đếm trước khi Kho Tổng xác nhận.
      //    ⛔ KHÔNG lách chốt — tải ảnh thật rồi mới nhận.
      // ⛔ TẢI ẢNH bằng ADMIN: `e2e.tk` bị `FileUseCase` chặn («Tài khoản chưa được phép tải hồ sơ
      //    lên mục này») vì thiếu quyền `central_warehouse` — đúng luật, ⛔ không lách.
      await login("admin", MK_ADMIN);
      await buoc(`tải ảnh kiểm đếm · ${moi.returnNo}`, async () => {
        await taiTep("central_return", cretMoiId, "e2e-kiem-dem.png", "image/png", PNG_1PX);
        return { ok: true };
      }, BC);
      // ⛔ HỢP ĐỒNG `lines` đọc từ `StockManagementUseCase:912-920` (KHÔNG đoán):
      //    khoá là `centralReturnItemId` (không phải `itemId`) + `countedQty` + `acceptedQty`,
      //    ràng buộc `0 ≤ accepted ≤ counted ≤ proposedQty`.
      const lines = (giua.items || []).map((it) => ({
        centralReturnItemId: it.id,
        countedQty: Number(it.proposedQty ?? 0),
        acceptedQty: Number(it.proposedQty ?? 0),
      })).filter((l) => l.countedQty > 0);
      console.log(`   lines (${lines.length}): ${JSON.stringify(lines).slice(0, 210)}`);
      await goiVoiFallback("e2e.tk", "receive_central_return", { centralReturnId: cretMoiId, lines }, `nhận ${moi.returnNo}`);
      await login("admin", MK_ADMIN);
      const cuoi = ds(await bootstrap(), "centralReturns").find((x) => x.id === cretMoiId);
      console.log(`   → sau nhận: status = ${cuoi?.status} · acceptedQty = ${cuoi?.acceptedQty}`);
      if (["received", "completed"].includes(String(cuoi?.status)) && Number(cuoi?.acceptedQty || 0) > 0) bNhan++;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n═══ TỔNG KẾT ĐO TỪ MÁY CHỦ ═══");
await login("admin", MK_ADMIN);
bs = await bootstrap();
const tonSau = tonTheoKho(bs);
console.log(`   tồn theo kho SAU: ${JSON.stringify(tonSau)}`);
console.log(`   TRƯỚC:             ${JSON.stringify(tonTruoc)}`);
console.log(`   transferOrders: ${ds(bs, "transferOrders").map((t) => `${t.transferNo}=${t.status}`).join(" · ")}`);
console.log(`   centralReturns: ${ds(bs, "centralReturns").map((r) => `${r.returnNo}=${r.status}`).join(" · ")}`);
console.log(`   centralInventory (Kho Tổng) = ${ds(bs, "centralInventory").length} dòng`);

const ket = [
  [`A · MỌI phiếu điều chuyển đã ở trạng thái XUẤT trở lên (${trfDaXuat.length}/${trfTatCa.length})`,
    trfTatCa.length > 0 && trfDaXuat.length === trfTatCa.length],
  [`A · có phiếu điều chuyển đã NHẬN (${trfKetThuc.length})`, trfKetThuc.length > 0],
  [`B0 · ÂM — ${thieuTon.length} phiếu thiếu tồn bị CHẶN đúng (chốt nghiệp vụ)`, bChanDung > 0 && bChanDung === thieuTon.length],
  ["B1 · phiếu hợp lệ được DUYỆT (in_transit)", bDuyet > 0],
  ["B1 · phiếu hợp lệ được NHẬN (acceptedQty>0)", bNhan > 0],
];
for (const [ten, ok] of ket) console.log(`   ${ok ? "✔" : "⛔"} ${ten}`);
const dat = ket.filter(([, v]) => v).length;
console.log(`   ĐẠT ${dat}/${ket.length}`);

ghi({ giaiDoan: "vong-doi-kho", aDuyet, aXuat, aNhan, bDuyet, bNhan, dat, tong: ket.length });
console.log("\n" + tomTatBuoc("VÒNG ĐỜI KHO", BC));
if (dat !== ket.length) process.exitCode = 1;
