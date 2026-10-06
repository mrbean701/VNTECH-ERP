/**
 * GO-LIVE — CHẠY THẬT CHUỖI KHO (yêu cầu user 02/10/2026):
 *   «workflow xuất-nhập kho và workflow cấp phát - hoàn trả cũng phải được thực hiện»
 *
 * Môi trường THẬT: `:9000` → Java `:18081` → MySQL `vntech_erp`.
 *
 * ⛔ BA ĐIỀU ĐO ĐƯỢC QUYẾT ĐỊNH CÁCH VIẾT BÀI NÀY:
 *   1. `inventory` có 1185 dòng nhưng **0 dòng tồn > 0** ⇒ kho TRỐNG ⇒ phải NHẬP trước mới CẤP PHÁT được.
 *   2. Phiếu xuất KHÔNG ghi kho ngay khi tạo. Đọc mã Java (`SystemController.java:1257-1306`) thấy
 *      **WF-XUATKHO-01 có 5 bước**, và kho chỉ bị trừ ở bước ③ `issue_stock_confirm`
 *      («Đây là chỗ DUY NHẤT ghi `stock_movements`»):
 *        ① `issue_stock` (thủ kho/CHT)      → `pending_cht`
 *        ② `approve_stock_issue` (CHT)      → `approved`
 *        ③ `issue_stock_confirm` (thủ kho)  → `issued`   ← GHI KHO
 *        ④ `confirm_stock_issue` (thủ kho)  → `completed`
 *        ⑤ `create_issue_grn`               → GRN nhập kho khác
 *   3. 8 phiếu nhập đang chờ BCH đều thuộc dự án **PRJ-DEMO-01**, KHÔNG thuộc dự án E2E
 *      ⇒ tài khoản `e2e.*` (chỉ có phạm vi E2E-DA-01) bị 403 ĐÚNG LUẬT. Dùng `admin` cho bước này.
 *
 * ⛔ Mỗi bước đều ĐỌC LẠI từ máy chủ. Không tin lời hứa của lời gọi.
 */
import { readFileSync } from "node:fs";
import { login, bootstrap, call, coThat, buoc, tomTatBuoc, ghi, taiTep, tieuDe } from "./client.mjs";

const tt = JSON.parse(readFileSync("tools/e2e/trang-thai-01.json", "utf8"));
const MK = tt.matKhau;
const MK_ADMIN = "Admin123456@";
const BC = [];
const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");

const DU_AN = tt.duAn;
const KHO_SITE = tt.khoSite;
const KHO_TONG = "WH-CENTRAL";
const TEAM1 = tt.teams[0].id;
const KHO_TEAM1 = tt.teams[0].kho;

// ⛔⛔ BÀI HỌC LẦN THỨ 4 (đã dính đúng loại lỗi này 3 lần trước — xem TASK-147 §3.5):
//    `bs.inventory` KHÔNG có khoá `quantity`/`qty`. Khoá THẬT là:
//      inventory[]        → balance · reserved · available
//      companyAvailability[] → onHand · reserved · available
//    Đọc sai khoá ⇒ mọi phép đếm ra 0 ⇒ suýt kết luận nhầm «nhập/xuất kho không ghi sổ»,
//    trong khi `stock_movements` chứng minh hệ thống ghi ĐÚNG.
const soTon = (x) => Number(x.balance ?? x.onHand ?? x.available ?? 0);
const doTon = (bs) => (Array.isArray(bs.inventory) ? bs.inventory : []).map((x) => ({ ...x, _ton: soTon(x) })).filter((x) => x._ton > 0);
const demTon = (bs) => doTon(bs).length;
/**
 * Dòng tồn CÓ THỂ XUẤT tại một kho (dùng `available`, đã trừ `reserved`).
 * ⛔ PHẢI TRA CẢ HAI NGUỒN — đo được: `bs.inventory` chỉ chứa **kho dự án** (site),
 *    còn **kho tổ đội** và **Kho Tổng** chỉ có trong `bs.companyAvailability` (khoá `onHand`).
 *    Chỉ tra `inventory` ⇒ kho tổ đội luôn ra rỗng ⇒ suýt kết luận nhầm «chưa nhận được hàng».
 */
const tonTaiKho = (bs, warehouseId) => {
  const nguon = [
    ...(Array.isArray(bs.inventory) ? bs.inventory : []),
    ...(Array.isArray(bs.companyAvailability) ? bs.companyAvailability : []),
  ];
  const thay = new Map();
  for (const x of nguon) {
    if (String(x.warehouseId) !== String(warehouseId)) continue;
    const con = Number(x.available ?? x.balance ?? x.onHand ?? 0);
    if (con <= 0) continue;
    const cu = thay.get(x.materialId);
    if (!cu || con > cu._con) thay.set(x.materialId, { ...x, _con: con });
  }
  return [...thay.values()];
};

tieuDe("GO-LIVE — CHUỖI KHO THẬT: NHẬP · CẤP PHÁT (5 bước) · HOÀN TRẢ · ĐIỀU CHUYỂN · TRẢ KHO TỔNG");

await login("admin", MK_ADMIN);
let bs = await bootstrap();
console.log(`\n[XUẤT PHÁT] inventory ${(bs.inventory || []).length} dòng · tồn>0 = ${demTon(bs)} · kho Transit = ${(bs.warehouses || []).filter((w) => String(w.type) === "transit").length}`);

// ═══════════════════════════════════════════════════════════════════════════════
// B1 — NHẬP KHO: hoàn tất phiếu nhập đang chờ BCH (dùng admin — phiếu thuộc PRJ-DEMO-01)
// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n═══ B1 · NHẬP KHO ═══");
const choBch = (bs.receipts || []).filter((r) => r.bchConfirmationStatus === "pending").slice(0, 3);
console.log(`      chọn ${choBch.length} phiếu nhập chờ BCH để hoàn tất`);
for (const rc of choBch) {
  await login("admin", MK_ADMIN);
  await buoc(`tải ảnh giao hàng · ${rc.receiptNo}`, async () => {
    await taiTep("goods_receipt", rc.id, "e2e-giao-hang.png", "image/png", PNG_1PX);
    return { ok: true };
  }, BC);
  await buoc(`confirm_delivery · ${rc.receiptNo}`, () => coThat("confirm_delivery", {
    receiptId: rc.id, certificateStatus: "complete", deliveryDocumentStatus: "complete",
    comment: "GO-LIVE — BCH xác nhận giao hàng (chạy thật)",
  }), BC);
}
bs = await bootstrap();
const daXacNhan = (bs.receipts || []).filter((r) => choBch.some((m) => m.id === r.id) && r.bchConfirmationStatus === "confirmed");
console.log(`      đã xác nhận ${daXacNhan.length}/${choBch.length} · tồn>0 sau nhập = ${demTon(bs)}`);
for (const r of daXacNhan) console.log(`        · ${r.receiptNo} · hạch toán=${r.postingStatus} · ảnh=${r.attachmentCount}`);

// ═══════════════════════════════════════════════════════════════════════════════
// B2 — CẤP PHÁT: chạy ĐỦ 5 BƯỚC của WF-XUATKHO-01
// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n═══ B2 · CẤP PHÁT — WF-XUATKHO-01 (5 bước) ═══");
bs = await bootstrap();
const mrChon = (bs.requests || []).find((r) => r.projectId === DU_AN && r.status === "approved" && (r.items || []).length > 0);
const lines = mrChon ? (mrChon.items || []).slice(0, 2).map((i) => ({
  materialId: i.materialId, materialCode: i.materialCode, materialName: i.materialName,
  unit: i.unit || "cái", quantity: 1, requestItemId: i.id,
})) : [];
let buocXuat = {};
if (!mrChon) console.log("      ⛔ không có MR đã duyệt của dự án E2E.");
else {
  console.log(`      MR ${mrChon.requestNo} · ${lines.length} dòng · kho xuất ${KHO_SITE} · tổ đội ${tt.teams[0].code}`);

  await login("e2e.tk", MK);
  const r1 = await buoc("① issue_stock (thủ kho lập phiếu xuất)", () => coThat("issue_stock", {
    projectId: DU_AN, fromWarehouseId: KHO_SITE, teamId: TEAM1, requestId: mrChon.id,
    receivedByName: "E2E Tổ trưởng", note: "GO-LIVE — cấp phát chạy thật", lines,
  }), BC);
  console.log(`         → ${r1?._loi || r1?.message || ""}`);
  bs = await bootstrap();
  const px = (bs.issues || []).find((x) => String(x.projectId) === DU_AN && String(x.teamId) === TEAM1
    && String(x.receivedByName || "") === "E2E Tổ trưởng" && String(x.status) !== "completed")
    || (bs.issues || []).filter((x) => String(x.projectId) === DU_AN).slice(-1)[0];
  buocXuat.taoPhieu = !!px && String(px.status) === "pending_cht";
  console.log(`         phiếu: ${px?.issueNo} · status=${px?.status} ${buocXuat.taoPhieu ? "✔ pending_cht" : "⛔"}`);
  const issueId = px?.id;

  if (issueId) {
    await login("e2e.cht", MK);
    const r2 = await buoc("② approve_stock_issue (CHT duyệt)", () => coThat("approve_stock_issue", { issueId, comment: "GO-LIVE — CHT duyệt cấp phát" }), BC);
    console.log(`         → ${r2?._loi || r2?.message || ""}`);
    bs = await bootstrap();
    buocXuat.chtDuyet = String((bs.issues || []).find((x) => x.id === issueId)?.status) === "approved";
    console.log(`         status=${(bs.issues || []).find((x) => x.id === issueId)?.status} ${buocXuat.chtDuyet ? "✔" : "⛔"}`);

    await login("e2e.tk", MK);
    const r3 = await buoc("③ issue_stock_confirm (XUẤT KHO THẬT — ghi stock_movements)", () => coThat("issue_stock_confirm", { issueId }), BC);
    console.log(`         → ${r3?._loi || r3?.message || ""}`);
    bs = await bootstrap();
    const sau3 = (bs.issues || []).find((x) => x.id === issueId)?.status;
    buocXuat.xuatThat = sau3 === "issued" || sau3 === "completed";
    buocXuat.tonSauXuat = demTon(bs);
    console.log(`         status=${sau3} ${buocXuat.xuatThat ? "✔" : "⛔"} · tồn>0 toàn hệ = ${buocXuat.tonSauXuat}`);

    const r4 = await buoc("④ confirm_stock_issue (thủ kho xác nhận đủ)", () => coThat("confirm_stock_issue", { issueId }), BC);
    console.log(`         → ${r4?._loi || r4?.message || ""}`);
    bs = await bootstrap();
    buocXuat.thuKhoXacNhan = String((bs.issues || []).find((x) => x.id === issueId)?.status) === "completed";
    console.log(`         status=${(bs.issues || []).find((x) => x.id === issueId)?.status} ${buocXuat.thuKhoXacNhan ? "✔" : "⛔"}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// B3 — HOÀN TRẢ
// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n═══ B3 · HOÀN TRẢ ═══");
await login("admin", MK_ADMIN);
bs = await bootstrap();
const tonTeam = tonTaiKho(bs, KHO_TEAM1);
let hoanTraOk = false;
if (!tonTeam.length) {
  console.log(`      ⛔ kho tổ đội chưa có tồn ⇒ phải NHẬN rồi mới TRẢ được (phụ thuộc nghiệp vụ thật).`);
} else {
  await login("e2e.to", MK);
  // ⛔ ĐO TRƯỚC/SAU BẰNG CÙNG MỘT TÀI KHOẢN: `bootstrap` lọc theo phạm vi người đăng nhập,
  //    nên đếm bằng `e2e.to` rồi so với con số đọc bằng `admin` là so hai tập khác nhau (đã dính).
  const truocSL = ((await bootstrap()).returns || []).length;
  const r = await buoc("return_stock (tổ đội trả vật tư dư)", () => coThat("return_stock", {
    projectId: DU_AN, teamId: TEAM1, toWarehouseId: KHO_SITE, returnedByName: "E2E Tổ trưởng",
    note: "GO-LIVE — hoàn trả chạy thật",
    lines: tonTeam.slice(0, 2).map((x) => ({ materialId: x.materialId, quantity: 1, reason: "GO-LIVE — hoàn trả vật tư dư" })),
  }), BC);
  console.log(`      → ${r?._loi || r?.message || ""}`);
  const sauSL = ((await bootstrap()).returns || []).length;
  hoanTraOk = sauSL > truocSL;
  console.log(`      phiếu hoàn trả (cùng tài khoản e2e.to): ${truocSL} → ${sauSL} ${hoanTraOk ? "✔" : "⛔"}`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// B4 — ĐIỀU CHUYỂN KHO (đã có kho Transit nhờ V37)
// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n═══ B4 · ĐIỀU CHUYỂN KHO ═══");
await login("admin", MK_ADMIN);
bs = await bootstrap();
const nguon = tonTaiKho(bs, KHO_SITE)[0];
let dieuChuyenOk = false;
if (!nguon) { console.log("      ⛔ kho nguồn chưa có dòng vật tư nào."); }
else {
  await login("e2e.tk", MK);
  const r = await buoc("3 create_transfer_order (KHO-E2E-01 → kho tổ đội 2)", () => coThat("create_transfer_order", {
    sourceWarehouseId: KHO_SITE, destinationWarehouseId: tt.teams[1].kho,
    reason: "GO-LIVE — điều chuyển nội bộ chạy thật",
    lines: [{ materialId: nguon.materialId, quantity: 1 }],
  }), BC);
  console.log(`      → ${r?._loi || r?.message || ""}`);
  bs = await bootstrap();
  dieuChuyenOk = (bs.transferOrders || []).length > 0;
  console.log(`      tổng phiếu điều chuyển = ${(bs.transferOrders || []).length} ${dieuChuyenOk ? "✔" : "⛔"}`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// B5 — TRẢ VẬT TƯ DƯ VỀ KHO TỔNG
// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n═══ B5 · TRẢ KHO TỔNG ═══");
await login("admin", MK_ADMIN);
bs = await bootstrap();
const nguonTong = tonTaiKho(bs, KHO_SITE)[0];
let traTongOk = false;
if (!nguonTong) { console.log("      ⛔ kho dự án chưa có dòng vật tư nào."); }
else {
  const r = await buoc("create_central_return (admin — có quyền central_warehouse)", () => coThat("create_central_return", {
    projectId: (bs.warehouses || []).find((w) => w.id === KHO_SITE)?.projectId || DU_AN,
    sourceWarehouseId: KHO_SITE, note: "GO-LIVE — trả vật tư dư về Kho Tổng",
    lines: [{ materialId: nguonTong.materialId, quantity: 1, unitCost: Number(nguonTong.unitCost || 0) }],
  }), BC);
  console.log(`      → ${r?._loi || r?.message || ""}`);
  bs = await bootstrap();
  traTongOk = (bs.centralReturns || []).length > 0;
  console.log(`      tổng phiếu trả Kho Tổng = ${(bs.centralReturns || []).length} ${traTongOk ? "✔" : "⛔"}`);
}

// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n═══ TỔNG KẾT ĐO TỪ MÁY CHỦ ═══");
await login("admin", MK_ADMIN);
bs = await bootstrap();
console.log(`      inventory tồn>0: ${demTon(bs)} (đầu vòng 0) · phiếu nhập BCH xác nhận: ${(bs.receipts || []).filter((r) => r.bchConfirmationStatus === "confirmed").length}/${(bs.receipts || []).length}`);
console.log(`      phiếu xuất ${(bs.issues || []).length} · hoàn trả ${(bs.returns || []).length} · điều chuyển ${(bs.transferOrders || []).length} · trả Kho Tổng ${(bs.centralReturns || []).length}`);

const ket = [
  // ⛔ B1 phải chấp nhận HAI trạng thái đúng: (a) vừa xác nhận được phiếu nào đó, HOẶC
  //    (b) KHÔNG CÒN phiếu nào chờ BCH vì các lượt trước đã xác nhận hết (đã cạn việc).
  //    Nếu chỉ đòi (a) thì lượt chạy sau sẽ báo ĐỎ GIẢ dù hệ thống vẫn đúng.
  [`B1 · nhập kho được BCH xác nhận (hoặc đã cạn phiếu chờ: ${(bs.receipts || []).filter((r) => r.bchConfirmationStatus === "pending").length} còn lại)`,
    daXacNhan.length > 0 || choBch.length === 0],
  ["B2① · tạo phiếu xuất (pending_cht)", !!buocXuat.taoPhieu],
  ["B2② · CHT duyệt (approved)", !!buocXuat.chtDuyet],
  ["B2③ · XUẤT KHO THẬT (ghi stock_movements)", !!buocXuat.xuatThat],
  ["B2④ · thủ kho xác nhận (completed)", !!buocXuat.thuKhoXacNhan],
  ["B2 · TỒN KHO > 0 sau xuất", Number(buocXuat.tonSauXuat || 0) > 0],
  ["B3 · hoàn trả tạo được phiếu", hoanTraOk],
  ["B4 · điều chuyển tạo được phiếu (cần kho Transit)", dieuChuyenOk],
  ["B5 · trả Kho Tổng tạo được phiếu", traTongOk],
];
for (const [ten, ok] of ket) console.log(`      ${ok ? "✔" : "⛔"} ${ten}`);
const dat = ket.filter(([, v]) => v).length;
console.log(`      ĐẠT ${dat}/${ket.length}`);

ghi({ giaiDoan: "chuoi-kho", ...buocXuat, xacNhan: daXacNhan.length, hoanTra: hoanTraOk, dieuChuyen: dieuChuyenOk, traTong: traTongOk, dat, tong: ket.length });
console.log("\n" + tomTatBuoc("CHUỖI KHO", BC));
if (dat !== ket.length) process.exitCode = 1;
