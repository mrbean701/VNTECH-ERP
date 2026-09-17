"use client";

// PHASE 1 (U-02) — DATA TABLE DÙNG CHUNG
//
// Trước đây mỗi danh sách tự viết `<div className="table-wrap"><table>…` với cách xử lý
// rỗng / đang tải / lỗi khác nhau (hoặc không xử lý gì). Component này gom về một khuôn:
//
//   • tiêu đề cột, có sắp xếp
//   • trạng thái RỖNG · ĐANG TẢI · LỖI — thống nhất toàn hệ thống
//   • bấm cả dòng để mở chi tiết
//   • markup khớp `.table-wrap` + `.baseline-table` sẵn có nên không lệch giao diện
//
// Cách dùng:
//   <DataTable
//     rows={rows} rowKey={(r) => String(r.id)}
//     columns={[
//       { key:"code",   header:"Mã",        sortable:true, render:(r)=><strong>{r.code}</strong> },
//       { key:"name",   header:"Tên",       render:(r)=>r.name },
//       { key:"status", header:"Trạng thái", render:(r)=><StatusBadge value={r.status} /> },
//     ]}
//     sort={{ key: sortKey, dir: sortDir, onChange: (k)=>… }}
//     onRowClick={(r)=>openDetail(r)}
//     emptyText="Chưa có dữ liệu."
//   />

import type { CSSProperties, ReactNode } from "react";

export type Column<T> = {
  key: string;
  header: ReactNode;
  /** Trả về nội dung ô. Nhận thêm `index` (thứ tự dòng) để dùng được cột STT — TASK-079. */
  render: (row: T, index: number) => ReactNode;
  sortable?: boolean;
  align?: "left" | "right" | "center";
  width?: string;
  /** Ẩn cột này khi đang xem (dùng cho ô bật/tắt cột). */
  hidden?: boolean;
  /** Lớp CSS thêm cho ô TIÊU ĐỀ — hữu ích khi cần style riêng mà không phải sửa component. */
  className?: string;
  /** Lớp CSS cho Ô DỮ LIỆU theo TỪNG DÒNG (vd tô đỏ dòng quá hạn) — TASK-081. */
  cellClassName?: (row: T, index: number) => string | undefined;
};

export function DataTable<T>({
  columns, rows, rowKey, sort, onRowClick, emptyText = "Chưa có dữ liệu.",
  loading, error, footer, toolbar, rowStyle,
}: {
  columns: Column<T>[];
  rows: T[];
  /** Trả về khoá duy nhất cho mỗi dòng. Bỏ trống thì dùng chỉ số. */
  rowKey?: (row: T, index: number) => string;
  sort?: { key: string; dir: "asc" | "desc"; onChange: (key: string) => void };
  onRowClick?: (row: T) => void;
  emptyText?: string;
  loading?: boolean;
  error?: string | null;
  footer?: ReactNode;
  /** Nội dung chèn ngay trên bảng (thanh công cụ, cảnh báo…). */
  toolbar?: ReactNode;
  /**
   * CSS nội tuyến cho CẢ DÒNG — TASK-083. Cần để giữ nguyên các chỗ tô nền theo trạng thái
   * (vd bảng ma trận quyền phòng ban tô nền vàng dòng "chưa lưu" bằng `style` trên `<tr>`).
   */
  rowStyle?: (row: T, index: number) => CSSProperties | undefined;
}) {
  const visible = columns.filter((c) => !c.hidden);

  const sortMark = (c: Column<T>) => {
    if (!sort || !c.sortable) return null;
    if (sort.key !== c.key) return <i className="dt-sort-idle">↕</i>;
    return <i className="dt-sort-active">{sort.dir === "asc" ? "↑" : "↓"}</i>;
  };

  return (
    <>
      {toolbar}
      {error && <div className="inline-alert danger dt-error">Lỗi tải dữ liệu: {error}</div>}
      <div className="table-wrap">
        <table className="baseline-table">
          <thead>
            <tr>
              {visible.map((c) => (
                <th
                  key={c.key}
                  style={c.width ? { width: c.width } : undefined}
                  className={[c.sortable && sort ? "dt-sortable" : "", c.align ? `dt-${c.align}` : "", c.className || ""].filter(Boolean).join(" ")}
                  onClick={c.sortable && sort ? () => sort.onChange(c.key) : undefined}
                  aria-sort={sort && sort.key === c.key ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}
                >
                  {c.header}{sortMark(c)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={visible.length || 1}><div className="empty dt-loading"><span>…</span><strong>Đang tải dữ liệu…</strong></div></td></tr>
            )}
            {!loading && rows.map((row, i) => (
              <tr
                key={rowKey ? rowKey(row, i) : i}
                className={onRowClick ? "dt-clickable" : undefined}
                style={rowStyle ? rowStyle(row, i) : undefined}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {visible.map((c) => (
                  <td key={c.key} className={[c.align ? `dt-${c.align}` : "", c.cellClassName ? c.cellClassName(row, i) : ""].filter(Boolean).join(" ") || undefined}>{c.render(row, i)}</td>
                ))}
              </tr>
            ))}
            {!loading && !rows.length && (
              <tr>
                <td colSpan={visible.length || 1}>
                  <div className="empty"><span>✓</span><strong>{emptyText}</strong><p>Dữ liệu mới sẽ xuất hiện tại đây.</p></div>
                </td>
              </tr>
            )}
          </tbody>
          {footer && <tfoot>{footer}</tfoot>}
        </table>
      </div>
    </>
  );
}

export default DataTable;
