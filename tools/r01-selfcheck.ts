// [PHASE 9 · R-01] TỰ KIỂM lớp báo cáo dùng chung — chạy: npx tsx tools/r01-selfcheck.ts
import { buildReport, filterRows, formatMetric, type Row, type ReportDefinition } from "../lib/report-engine.js";

let pass = 0, fail = 0;
const eq = (name: string, got: unknown, want: unknown) => {
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g === w) { pass++; console.log(`  PASS ${name} = ${g}`); }
  else { fail++; console.error(`  FAIL ${name}: got ${g} · want ${w}`); }
};

const rows: Row[] = [
  { id: "P1", projectId: "DA-01", status: "pending_approval", qty: 10, amount: 1000, requestedAt: "2026-09-01", flag: true },
  { id: "P2", projectId: "DA-01", status: "approved", qty: 5, amount: 2500, requestedAt: "2026-09-15", flag: "1" },
  { id: "P3", projectId: "DA-02", status: "approved", qty: 20, amount: 500, requestedAt: "2026-08-20", flag: false },
  { id: "P4", projectId: "DA-02", status: "rejected", qty: 0, amount: 0, requestedAt: "2026-09-20" },
];

// 1) LỌC dạng khai báo
eq("filter eq", filterRows(rows, { filter: [{ field: "status", op: "eq", value: "approved" }] }).length, 2);
eq("filter in", filterRows(rows, { filter: [{ field: "projectId", op: "in", value: ["DA-02"] }] }).length, 2);
eq("filter gte", filterRows(rows, { filter: [{ field: "amount", op: "gte", value: 1000 }] }).length, 2);
eq("filter truthy", filterRows(rows, { filter: [{ field: "flag", op: "truthy" }] }).length, 2);
// ⚠ SUA KY VONG (khong sua ma): "pending_approval" CUNG chua "appro" => 3 dong, khong phai 2.
eq("filter contains", filterRows(rows, { filter: [{ field: "status", op: "contains", value: "appro" }] }).length, 3);
eq("dateRange", filterRows(rows, { dateField: "requestedAt", dateRange: { from: "2026-09-01", to: "2026-09-30" } }).length, 3);

// 2) GỘP + CHỈ SỐ (count/sum/avg/min/max/distinct)
const def: ReportDefinition = {
  key: "R-02",
  title: "Bao cao mua hang",
  groupBy: ["projectId"],
  metrics: [
    { key: "soPhieu", label: "So phieu", agg: "count" },
    { key: "tongTien", label: "Tong tien", agg: "sum", field: "amount", format: "money" },
    { key: "tbQty", label: "TB qty", agg: "avg", field: "qty" },
    { key: "maxTien", label: "Max", agg: "max", field: "amount" },
    { key: "soTrangThai", label: "So trang thai", agg: "distinct", field: "status" },
  ],
  sortBy: "tongTien",
  sortDir: "desc",
};
const r = buildReport(def, rows);
eq("sourceCount", r.sourceCount, 4);
eq("rows.length", r.rows.length, 2);
eq("nhom DA-01 count", r.rows.find((x) => x.group[0] === "DA-01")?.metrics.soPhieu, 2);
eq("nhom DA-01 sum", r.rows.find((x) => x.group[0] === "DA-01")?.metrics.tongTien, 3500);
eq("nhom DA-02 avg", r.rows.find((x) => x.group[0] === "DA-02")?.metrics.tbQty, 10);
eq("nhom DA-02 distinct", r.rows.find((x) => x.group[0] === "DA-02")?.metrics.soTrangThai, 2);
eq("totals sum", r.totals.tongTien, 4000);
eq("totals count", r.totals.soPhieu, 4);
eq("sort desc", r.rows.map((x) => x.group[0]), ["DA-01", "DA-02"]);

// 3) GỘP 2 CẤP + LỌC KÈM
const two = buildReport({ ...def, key: "R-x", groupBy: ["projectId", "status"], filter: [{ field: "status", op: "neq", value: "rejected" }] }, rows);
eq("2 cap rows", two.rows.length, 3);
eq("2 cap loc count", two.sourceCount, 3);

// 4) LIMIT + CỘT MẶC ĐỊNH
const lim = buildReport({ ...def, key: "R-y", limit: 1 }, rows);
eq("limit", lim.rows.length, 1);
eq("cot mac dinh", lim.columns.map((c) => c.key), ["projectId", "soPhieu", "tongTien", "tbQty", "maxTien", "soTrangThai"]);

// 5) THUẦN (không đột biến dữ liệu vào)
const before = JSON.stringify(rows);
buildReport(def, rows);
eq("khong dot bien rows", JSON.stringify(rows) === before, true);

// 6) ĐỊNH DẠNG
eq("format money", formatMetric(1000, "money"), "1.000 đ");
eq("format percent", formatMetric(12.5, "percent"), "12,5 %");

console.log(`\nKẾT LUẬN R-01 self-check: pass ${pass} · fail ${fail}`);
process.exit(fail ? 1 : 0);
