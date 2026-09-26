// [PHASE 9 · R-01] LỚP TỔNG HỢP BÁO CÁO DÙNG CHUNG — "không hard-code từng báo cáo".
//
// MỤC TIÊU (R-01): mọi báo cáo về sau (R-02 Mua hàng · R-03 Kho · R-04 Dự án · R-05 Công việc)
// chỉ cần KHAI BÁO một `ReportDefinition`; KHÔNG viết lại vòng lặp lọc/gộp/tính.
//
// THIẾT KẾ (thuần, không phụ thuộc React/DB ⇒ test được bằng Node):
//   ReportDefinition {
//     key, title, note?,
//     groupBy?: string[]          // gộp nhiều cấp (vd ["projectId","status"])
//     filter?:  FilterSpec[]      // lọc dạng khai báo
//     metrics:  MetricSpec[]      // count | sum | avg | min | max | distinct
//     columns?: ColumnSpec[]      // cột hiển thị (nhãn + định dạng)
//     dateField?, dateRange?      // lọc theo khoảng ngày (dạng khai báo)
//   }
// Quy ước: HÀM THUẦN, KHÔNG đột biến dữ liệu vào; trả về cấu trúc mới.

export type Row = Record<string, unknown>;

export type Agg = "count" | "sum" | "avg" | "min" | "max" | "distinct";

export interface MetricSpec {
  key: string;          // tên khoá kết quả
  label: string;        // nhãn hiển thị
  agg: Agg;
  field?: string;       // trường nguồn (bắt buộc với sum/avg/min/max/distinct; count bỏ qua)
  format?: "number" | "money" | "percent" | "text";
}

export interface FilterSpec {
  field: string;
  op: "eq" | "neq" | "in" | "nin" | "contains" | "gte" | "lte" | "truthy" | "exists";
  value?: unknown;
}

export interface ColumnSpec {
  key: string;          // khoá trong hàng kết quả (nhóm hoặc metric)
  label: string;
  format?: "number" | "money" | "percent" | "text";
}

export interface ReportDefinition {
  key: string;
  title: string;
  note?: string;
  groupBy?: string[];
  filter?: FilterSpec[];
  metrics: MetricSpec[];
  columns?: ColumnSpec[];
  dateField?: string;
  dateRange?: { from?: string; to?: string }; // so sánh chuỗi ISO YYYY-MM-DD (đầu ngày)
  sortBy?: string;      // khoá sắp xếp
  sortDir?: "asc" | "desc";
  limit?: number;
}

export interface ReportGroupRow {
  group: string[];              // giá trị nhóm theo thứ tự groupBy
  metrics: Record<string, number>;
  count: number;                // số dòng nguồn trong nhóm
}

export interface ReportResult {
  key: string;
  title: string;
  groupBy: string[];
  columns: ColumnSpec[];
  rows: ReportGroupRow[];
  totals: Record<string, number>;
  sourceCount: number;          // số dòng nguồn SAU lọc
  totalCount: number;           // số dòng nguồn TRƯỚC lọc
}

// ── tiện ích ────────────────────────────────────────────────────────────────
const asNumber = (v: unknown): number | null => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return Number(v);
  return null;
};

const asKey = (v: unknown): string => (v === null || v === undefined || v === "" ? "(không xác định)" : String(v));

const truthy = (v: unknown): boolean => v === true || v === 1 || v === "1" || v === "true";

function matchFilter(row: Row, f: FilterSpec): boolean {
  const v = row[f.field];
  switch (f.op) {
    case "eq": return String(v) === String(f.value);
    case "neq": return String(v) !== String(f.value);
    case "in": return Array.isArray(f.value) && (f.value as unknown[]).some((x) => String(x) === String(v));
    case "nin": return Array.isArray(f.value) && !(f.value as unknown[]).some((x) => String(x) === String(v));
    case "contains": return String(v ?? "").toLowerCase().includes(String(f.value ?? "").toLowerCase());
    case "gte": { const a = asNumber(v); const b = asNumber(f.value); return a !== null && b !== null && a >= b; }
    case "lte": { const a = asNumber(v); const b = asNumber(f.value); return a !== null && b !== null && a <= b; }
    case "truthy": return truthy(v);
    case "exists": return v !== null && v !== undefined && v !== "";
    default: return true;
  }
}

const dayPart = (v: unknown): string => String(v ?? "").slice(0, 10);

function inDateRange(row: Row, field: string, range: { from?: string; to?: string }): boolean {
  const d = dayPart(row[field]);
  if (!d) return false;
  if (range.from && d < dayPart(range.from)) return false;
  if (range.to && d > dayPart(range.to)) return false;
  return true;
}

function computeMetric(rows: Row[], m: MetricSpec): number {
  if (m.agg === "count") return rows.length;
  const values = rows.map((r) => (m.field ? r[m.field] : undefined));
  if (m.agg === "distinct") return new Set(values.filter((v) => v !== null && v !== undefined && v !== "").map(String)).size;
  const nums = values.map(asNumber).filter((n): n is number => n !== null);
  if (!nums.length) return 0;
  switch (m.agg) {
    case "sum": return nums.reduce((a, b) => a + b, 0);
    case "avg": return nums.reduce((a, b) => a + b, 0) / nums.length;
    case "min": return Math.min(...nums);
    case "max": return Math.max(...nums);
    default: return 0;
  }
}

// ── API chính ───────────────────────────────────────────────────────────────
export function filterRows(rows: Row[], def: Pick<ReportDefinition, "filter" | "dateField" | "dateRange">): Row[] {
  return rows.filter((r) => {
    if (def.filter && !def.filter.every((f) => matchFilter(r, f))) return false;
    if (def.dateField && def.dateRange && !inDateRange(r, def.dateField, def.dateRange)) return false;
    return true;
  });
}

/** Gộp + tính chỉ số theo KHAI BÁO. Hàm thuần: không đột biến `rows`. */
export function buildReport(def: ReportDefinition, rows: Row[]): ReportResult {
  const groupBy = def.groupBy ?? [];
  const filtered = filterRows(rows, def);

  const buckets = new Map<string, Row[]>();
  for (const r of filtered) {
    const key = groupBy.length ? groupBy.map((g) => asKey(r[g])).join("\u0001") : "\u0000";
    const arr = buckets.get(key);
    if (arr) arr.push(r);
    else buckets.set(key, [r]);
  }
  if (!buckets.size) buckets.set(groupBy.length ? groupBy.map(() => "(không xác định)").join("\u0001") : "\u0000", []);

  let out: ReportGroupRow[] = [];
  for (const [key, group] of buckets) {
    const metrics: Record<string, number> = {};
    for (const m of def.metrics) metrics[m.key] = computeMetric(group, m);
    out.push({ group: groupBy.length ? key.split("\u0001") : [], metrics, count: group.length });
  }

  if (def.sortBy) {
    const dir = def.sortDir === "asc" ? 1 : -1;
    out = out.sort((a, b) => {
      const av = def.sortBy && def.sortBy in a.metrics ? a.metrics[def.sortBy] : Number(a.group[0] ?? 0);
      const bv = def.sortBy && def.sortBy in b.metrics ? b.metrics[def.sortBy] : Number(b.group[0] ?? 0);
      return (av - bv) * dir;
    });
  }
  if (def.limit && def.limit > 0) out = out.slice(0, def.limit);

  const totals: Record<string, number> = {};
  for (const m of def.metrics) {
    // tổng của nhóm = tính lại trên TOÀN BỘ dòng đã lọc (đúng cho count/sum/distinct; avg là trung bình toàn cục)
    totals[m.key] = computeMetric(filtered, m);
  }

  const columns: ColumnSpec[] = def.columns ?? [
    ...groupBy.map((g) => ({ key: g, label: g })),
    ...def.metrics.map((m) => ({ key: m.key, label: m.label, format: m.format })),
  ];

  return {
    key: def.key,
    title: def.title,
    groupBy,
    columns,
    rows: out,
    totals,
    sourceCount: filtered.length,
    totalCount: rows.length,
  };
}

/** Định dạng giá trị theo khai báo (dùng chung cho mọi báo cáo). */
export function formatMetric(value: number | undefined, format?: ColumnSpec["format"]): string {
  const v = value ?? 0;
  switch (format) {
    case "money": return v.toLocaleString("vi-VN", { maximumFractionDigits: 0 }) + " đ";
    case "percent": return v.toLocaleString("vi-VN", { maximumFractionDigits: 1 }) + " %";
    case "number": return v.toLocaleString("vi-VN", { maximumFractionDigits: 2 });
    default: return String(v);
  }
}
