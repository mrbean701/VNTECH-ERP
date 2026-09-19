// [PHASE 9 · R-01] MÀN BÁO CÁO DÙNG CHUNG — render MỌI `ReportDefinition` bằng cùng một mã.
// KHÔNG hard-code từng báo cáo: R-02 (Mua hàng) · R-03 (Kho) · R-04 (Dự án) · R-05 (Công việc)
// chỉ cần khai báo định nghĩa và đưa vào `catalog`.
import { useMemo, useState } from "react";
import { DataTable, ListToolbar, type Column, type Option, type ToolbarFilter } from "@/app/components/ui";
import { CardHead } from "@/lib/ui-shared";
import type { Row } from "@/lib/ui-shared";
import { buildReport, filterRows, formatMetric, type FilterSpec, type ReportDefinition } from "@/lib/report-engine";

type FilterState = Record<string, string>;

/** Các bộ lọc KHAI BÁO trong định nghĩa được biến thành dropdown, chọn giá trị từ chính dữ liệu. */
function buildToolbarFilters(def: ReportDefinition, rows: Row[], state: FilterState, set: (field: string, value: string) => void): ToolbarFilter[] {
  const declared = (def.filter ?? []).filter((f) => f.op === "eq" || f.op === "in");
  return declared.map((f) => {
    const values = Array.from(new Set(rows.map((r) => String(r[f.field] ?? "")).filter((v) => v !== ""))).sort();
    const options: Option[] = [{ value: "ALL", label: "Tất cả" }, ...values.map((v) => ({ value: v, label: v }))];
    return { key: f.field, label: f.field, value: state[f.field] ?? "ALL", onChange: (v: string) => set(f.field, v), options };
  });
}

export function ReportView({ catalog, rows, initialKey, project }: {
  catalog: ReportDefinition[];
  rows: Row[];
  initialKey?: string;
  project?: string;
}) {
  const [key, setKey] = useState(initialKey ?? catalog[0]?.key ?? "");
  const def = catalog.find((d) => d.key === key) ?? catalog[0];
  const [state, setState] = useState<FilterState>({});

  const setFilter = (field: string, value: string) => setState((s) => ({ ...s, [field]: value }));

  // Áp bộ lọc người dùng chọn LÊN TRÊN bộ lọc đã khai báo (không sửa định nghĩa gốc).
  const effective: ReportDefinition | undefined = useMemo(() => {
    if (!def) return undefined;
    const extra: FilterSpec[] = (def.filter ?? [])
      .filter((f) => f.op === "eq" || f.op === "in")
      .map((f): FilterSpec => ({ field: f.field, op: "eq", value: state[f.field] ?? "ALL" }))
      .filter((f) => String(f.value) !== "ALL");
    const base = (def.filter ?? []).filter((f) => !(f.op === "eq" || f.op === "in"));
    return { ...def, filter: [...base, ...extra] };
  }, [def, state]);

  const result = useMemo(() => (effective ? buildReport(effective, rows) : undefined), [effective, rows]);

  if (!def || !result) {
    return (
      <div className="stack module-screen">
        <CardHead title="BÁO CÁO" note="Chưa có định nghĩa báo cáo nào được khai báo." />
        <p className="muted">Thêm một <code>ReportDefinition</code> vào catalog để hiển thị báo cáo.</p>
      </div>
    );
  }

  const columns: Column<Record<string, unknown>>[] = result.columns.map((c) => ({
    key: c.key,
    header: c.label,
    render: (row) => {
      const value = c.key in (row as Record<string, unknown>)
        ? (row as Record<string, unknown>)[c.key]
        : (row.metrics as Record<string, number> | undefined)?.[c.key];
      if (typeof value === "number") return formatMetric(value, c.format);
      return String(value ?? "");
    },
  }));

  const tableRows = result.rows.map((r, i) => {
    const flat: Record<string, unknown> = { __i: i };
    result.groupBy.forEach((g, gi) => { flat[g] = r.group[gi]; });
    Object.assign(flat, r.metrics);
    return flat;
  });

  const filters = buildToolbarFilters(def, rows, state, setFilter);

  return (
    <div className="stack module-screen">
      <ListToolbar
        title={def.title.toUpperCase()}
        note={def.note ?? "Báo cáo dùng chung — định nghĩa bằng dữ liệu, không viết mã riêng."}
        count={result.rows.length}
        total={rows.length}
        unit="nhóm"
        filters={filters}
        extra={
          catalog.length > 1 ? (
            <label className="inline-field">
              <span>Báo cáo</span>
              <select value={key} onChange={(e) => { setKey(e.target.value); setState({}); }}>
                {catalog.map((d) => <option key={d.key} value={d.key}>{d.title}</option>)}
              </select>
            </label>
          ) : undefined
        }
      />
      {typeof project === "string" && project !== "ALL" ? (
        <div className="inline-alert"><b>Phạm vi:</b> {project}</div>
      ) : null}
      <DataTable
        rows={tableRows}
        rowKey={(r) => String(r.__i)}
        columns={columns}
        emptyText="Không có dòng nào khớp bộ lọc."
        footer={
          <tr>
            {result.columns.map((c, i) => (
              <td key={c.key}>
                <b>{i === 0 ? "TỔNG" : formatMetric(result.totals[c.key], c.format)}</b>
              </td>
            ))}
          </tr>
        }
      />
      <p className="muted">
        Nguồn: {result.sourceCount}/{result.totalCount} dòng sau lọc · {result.rows.length} nhóm · định nghĩa <code>{def.key}</code>
      </p>
    </div>
  );
}

/** Tiện ích cho catalog: đếm nhanh theo một trường (dùng khi khai báo báo cáo mới). */
export function countByDef(key: string, title: string, field: string, label: string): ReportDefinition {
  return { key, title, groupBy: [field], metrics: [{ key: "soLuong", label, agg: "count" }] };
}

export { filterRows };
