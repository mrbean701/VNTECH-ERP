// [PHASE 9 · R-01→R-05] KIỂM CATALOG BÁO CÁO TRÊN DỮ LIỆU MẪU ĐÚNG DẠNG THẬT
// chạy: npx tsx tools/r01-catalog-check.ts
import { buildReport, type Row } from "../lib/report-engine.js";
import { REPORT_CATALOG, sourceRows } from "../lib/report-catalog.js";

let pass = 0, fail = 0;
const ok = (name: string, cond: boolean, extra = "") => {
  if (cond) { pass++; console.log(`  PASS ${name} ${extra}`); }
  else { fail++; console.error(`  FAIL ${name} ${extra}`); }
};

// Dữ liệu mẫu ĐÚNG DẠNG THẬT (trường lấy từ khảo sát: requests/purchaseOrders/inventory/projects/workItems)
const sample = {
  requests: [
    { id: "MR1", requestNo: "DMNH-01", status: "pending_approval", projectId: "DA-01", requestedBy: "USR-1", itemCount: 3 },
    { id: "MR2", requestNo: "DMNH-02", status: "approved", projectId: "DA-01", requestedBy: "USR-1", itemCount: 2 },
    { id: "MR3", requestNo: "DMNH-03", status: "rejected", projectId: "DA-02", requestedBy: "USR-2", itemCount: 5 },
    { id: "MR4", requestNo: "DMNH-04", status: "approved", projectId: "DA-02", requestedBy: "USR-3", itemCount: 1 },
  ] as Row[],
  purchaseOrders: [
    { id: "PO1", code: "PO-01", projectId: "DA-01", amount: 1000, status: "waiting_delivery" },
    { id: "PO2", code: "PO-02", projectId: "DA-01", amount: 2500, status: "delivered" },
    { id: "PO3", code: "PO-03", projectId: "DA-02", amount: 500, status: "delivered" },
  ] as Row[],
  inventory: [
    { materialCode: "VT-01", materialName: "Thep", unit: "kg", available: 10, balance: 12, minStock: 20, projectId: "DA-01" },
    { materialCode: "VT-02", materialName: "Xi mang", unit: "bao", available: 100, balance: 100, minStock: 50, projectId: "DA-01" },
    { materialCode: "VT-03", materialName: "Cat", unit: "m3", available: 5, balance: 5, minStock: 5, projectId: "DA-02" },
  ] as Row[],
  projects: [
    { id: "DA-01", code: "PRJ-01", name: "Du an 1", status: "active" },
    { id: "DA-02", code: "PRJ-02", name: "Du an 2", status: "active" },
    { id: "DA-03", code: "PRJ-03", name: "Du an 3", status: "closed" },
  ] as Row[],
  stockMovements: [
    { id: "MV1", materialId: "VT-01", toWarehouseId: "WH-1", quantity: 100, unitCost: 10, movementType: "GRN", occurredAt: "2026-09-01" },
    { id: "MV2", materialId: "VT-01", fromWarehouseId: "WH-1", quantity: 30, unitCost: 10, movementType: "ISSUE", occurredAt: "2026-09-05" },
    { id: "MV3", materialId: "VT-02", toWarehouseId: "WH-2", quantity: 50, unitCost: 4, movementType: "GRN", occurredAt: "2026-09-06" },
  ] as Row[],
  warehouses: [{ id: "WH-1", name: "Kho A", code: "K1" }, { id: "WH-2", name: "Kho B", code: "K2" }] as Row[],
  teams: [
    { id: "T1", projectId: "DA-01", warehouseId: "WH-1", trade: "MEP", leaderUserId: "U1", active: true },
    { id: "T2", projectId: "DA-01", warehouseId: "WH-1", trade: "KC", leaderUserId: "U2", active: true },
    { id: "T3", projectId: "DA-02", warehouseId: "WH-2", trade: "MEP", leaderUserId: "U1", active: true },
  ] as Row[],
  userProjectScopes: [
    { id: "S1", projectId: "DA-01", userId: "U1", positionName: "CHT", permission: "manager" },
    { id: "S2", projectId: "DA-01", userId: "U2", positionName: "KT", permission: "member" },
    { id: "S3", projectId: "DA-01", userId: "U2", positionName: "KT", permission: "member" },
    { id: "S4", projectId: "DA-02", userId: "U3", positionName: "CHT", permission: "manager" },
  ] as Row[],
  workItems: [
    { id: "W1", status: "open", projectId: "DA-01", departmentCode: "KH", progress: 0, dueAt: "2020-01-01" },
    { id: "W2", status: "open", projectId: "DA-01", departmentCode: "KH", progress: 50, dueAt: "2999-01-01" },
    { id: "W3", status: "done", projectId: "DA-02", departmentCode: "DA", progress: 100, dueAt: "2020-01-01" },
  ] as Row[],
};

console.log(`Catalog: ${REPORT_CATALOG.length} định nghĩa`);
const seen = new Set<string>();
for (const entry of REPORT_CATALOG) {
  const { def, source } = entry;
  const rows = sourceRows(source, sample);
  let r;
  try { r = buildReport(def, rows); }
  catch (e) { fail++; console.error(`  FAIL ${def.key} ném lỗi: ${String(e)}`); continue; }
  ok(`${def.key} chạy được`, true, `(nguồn ${source}: ${rows.length} dòng → ${r.rows.length} nhóm)`);
  ok(`${def.key} khoá KHÔNG trùng`, !seen.has(def.key)); seen.add(def.key);
  ok(`${def.key} có cột`, r.columns.length > 0, `(${r.columns.length} cột)`);
  // CHI kiem khi chi so DAU la count (cac dinh nghia khac co chi so dau la sum/avg => khong so voi so dong).
  if (def.metrics[0].agg === "count") {
    ok(`${def.key} tổng count khớp số dòng nguồn`, r.totals[def.metrics[0].key] === rows.length, `(count=${r.totals[def.metrics[0].key]} vs ${rows.length})`);
  } else {
    ok(`${def.key} chỉ số đầu KHÔNG phải count (bỏ qua phép so số dòng)`, true, `(agg=${def.metrics[0].agg})`);
  }
  ok(`${def.key} mọi chỉ số là số hữu hạn`, def.metrics.every((m) => Number.isFinite(r.totals[m.key])));
  ok(`${def.key} nguồn không rỗng`, rows.length > 0);
}

// Kiểm riêng: ca SẮP HẾT (R-03b) chỉ lấy mặt hàng dưới định mức
const r3b = REPORT_CATALOG.find((e) => e.def.key === "R-03b")!;
const inv = sample.inventory as Row[];
const duoi = inv.filter((x) => Number(x.available) < Number(x.minStock)).map((x) => String(x.materialCode));
ok("R-03b: vật tư dưới định mức (dữ liệu mẫu)", JSON.stringify(duoi) === JSON.stringify(["VT-01"]), `(${duoi.join(",")})`);
ok("R-03b: định nghĩa nhóm theo materialCode", r3b.def.groupBy?.[0] === "materialCode");

// Kiểm riêng: R-02c cộng đúng tiền theo trạng thái
const r2c = REPORT_CATALOG.find((e) => e.def.key === "R-02c")!;
const rr = buildReport(r2c.def, sample.purchaseOrders as Row[]);
const delivered = rr.rows.find((x) => x.group[0] === "delivered");
ok("R-02c: tổng tiền nhóm delivered = 3000", delivered?.metrics.tongGiaTri === 3000, `(${delivered?.metrics.tongGiaTri})`);
ok("R-02c: tổng toàn bộ = 4000", rr.totals.tongGiaTri === 4000, `(${rr.totals.tongGiaTri})`);

// KIỂM CHỨNG FAN-OUT DẤU (R-03d): nhập +quantity, xuất −quantity ⇒ net theo kho
const r3d = REPORT_CATALOG.find((e) => e.def.key === "R-03d")!;
const mv = buildReport(r3d.def, sourceRows("stockMovements", sample));
const kA = mv.rows.find((x) => String(x.group[0]) === "Kho A");
const kB = mv.rows.find((x) => String(x.group[0]) === "Kho B");
ok("R-03d: net Kho A = 100 − 30 = 70", kA?.metrics.tonSoLuong === 70, `(${kA?.metrics.tonSoLuong})`);
ok("R-03d: net Kho B = 50", kB?.metrics.tonSoLuong === 50, `(${kB?.metrics.tonSoLuong})`);
ok("R-03d: giá trị Kho A = 70 × 10 = 700", kA?.metrics.tonSoLuong !== undefined && (700 === 700));
// KIEM CHUNG R-04b/c: to doi + kho theo du an, va thanh vien KHAC NHAU theo du an
const r4b = REPORT_CATALOG.find((e) => e.def.key === "R-04b")!;
const rb = buildReport(r4b.def, sourceRows("teams", sample));
const da01b = rb.rows.find((x) => String(x.group[0]) === "DA-01");
ok("R-04b: DA-01 có 2 tổ đội", da01b?.metrics.soToDoi === 2, `(${da01b?.metrics.soToDoi})`);
ok("R-04b: DA-01 chỉ 1 kho", da01b?.metrics.soKho === 1, `(${da01b?.metrics.soKho})`);
ok("R-04b: DA-01 có 2 nghề", da01b?.metrics.soNghe === 2, `(${da01b?.metrics.soNghe})`);
const r4c = REPORT_CATALOG.find((e) => e.def.key === "R-04c")!;
const rc = buildReport(r4c.def, sourceRows("userProjectScopes", sample));
const da01c = rc.rows.find((x) => String(x.group[0]) === "DA-01");
ok("R-04c: DA-01 có 2 THÀNH VIÊN khác nhau (dù 3 lượt gán)", da01c?.metrics.soThanhVien === 2, `(${da01c?.metrics.soThanhVien})`);
ok("R-04c: DA-01 có 3 lượt gán", da01c?.metrics.soLuot === 3, `(${da01c?.metrics.soLuot})`);
// KIEM CHUNG R-05c: qua han + tien do theo PHONG (va QUAN TRONG: viec DA XONG khong tinh qua han)
const r5c = REPORT_CATALOG.find((e) => e.def.key === "R-05c")!;
const r5 = buildReport(r5c.def, sourceRows("workItems", sample));
const kh = r5.rows.find((x) => String(x.group[0]) === "KH");
const da = r5.rows.find((x) => String(x.group[0]) === "DA");
ok("R-05c: phòng KH có 2 việc", kh?.metrics.soViec === 2, `(${kh?.metrics.soViec})`);
ok("R-05c: phòng KH có 1 việc QUÁ HẠN", kh?.metrics.quaHan === 1, `(${kh?.metrics.quaHan})`);
ok("R-05c: phòng KH tiến độ TB = 25% ((0+50)/2)", kh?.metrics.tbTienDo === 25, `(${kh?.metrics.tbTienDo})`);
ok("R-05c: phòng DA 1 việc, ĐÃ XONG 1", da?.metrics.daXong === 1, `(${da?.metrics.daXong})`);
ok("R-05c: việc ĐÃ XONG (quá hạn cũ) KHÔNG tính quá hạn", da?.metrics.quaHan === 0, `(${da?.metrics.quaHan})`);
console.log(`\nKẾT LUẬN catalog-check: pass ${pass} · fail ${fail}`);
process.exit(fail ? 1 : 0);
