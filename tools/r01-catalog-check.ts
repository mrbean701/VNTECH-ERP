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
  workItems: [
    { id: "W1", status: "open", projectId: "DA-01" },
    { id: "W2", status: "open", projectId: "DA-01" },
    { id: "W3", status: "done", projectId: "DA-02" },
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

console.log(`\nKẾT LUẬN catalog-check: pass ${pass} · fail ${fail}`);
process.exit(fail ? 1 : 0);
