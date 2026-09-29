"use client";

// PHASE 1 (U-03) — LIST TOOLBAR DÙNG CHUNG
//
// Chuẩn hoá khuôn toolbar cho MỌI danh sách theo yêu cầu §5:
//
//   ---------------------------------------------------------
//   TIÊU ĐỀ / SỐ LƯỢNG          TÌM · LỌC · SẮP XẾP · HÀNH ĐỘNG
//   ---------------------------------------------------------
//   BẢNG DỮ LIỆU
//   ---------------------------------------------------------
//
// Vấn đề đang sửa: toolbar rải rác khắp hệ thống bị "dồn một phía", có cột trống, nút bị
// đẩy ra ngoài, và mỗi màn một kiểu. Component này gom về một khuôn duy nhất, có responsive.
//
// Render dựa trên lớp CSS sẵn có (`.table-toolbar`, `.row-actions`) và bổ sung
// `.list-toolbar*` trong canonical.css. Nhờ đó markup tương thích với các màn cũ.
//
// Cách dùng:
//   <ListToolbar
//     title="DANH SÁCH DỰ ÁN" note="Project Master" count={rows.length} total={all.length}
//     search={{ value: q, onChange: setQ, placeholder: "Tìm theo mã hoặc tên…" }}
//     filters={[{ key:"status", label:"Trạng thái", value: st, onChange: setSt,
//                 options:[{value:"ALL",label:"Tất cả"},{value:"active",label:"Đang chạy"}] }]}
//     sort={{ value: sortKey, onChange: setSortKey,
//             options:[{value:"created_desc",label:"Mới nhất trước"}] }}
//     actions={<><button className="primary">＋ THÊM</button></>}
//   />

import type { ReactNode } from "react";

export type Option = { value: string; label: string };

export type ToolbarFilter = {
  key: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
};

export function ListToolbar({
  title, note, count, total, unit = "",
  search, filters, sort, actions, extra, secondaryActions,
}: {
  /** Tiêu đề danh sách — nên viết HOA theo quy ước hiện có của hệ thống.
   *  Nhận `ReactNode` để dùng được cả nhãn ĐỘNG (vd `BƯỚC {index + 1}`) — mọi chỗ gọi cũ
   *  truyền CHUỖI vẫn hợp lệ (mở rộng tương thích ngược — TASK-078). */
  title: ReactNode;
  /** Mô tả ngắn dưới tiêu đề. Nhận `ReactNode` cùng lý do trên. */
  note?: ReactNode;
  /** Số dòng đang hiển thị. */
  count?: number;
  /** Tổng số dòng trước khi lọc. */
  total?: number;
  /** Đơn vị hiển thị sau con số, ví dụ "tài khoản" · "vật tư". */
  unit?: string;
  search?: { value: string; onChange: (v: string) => void; placeholder?: string };
  filters?: ToolbarFilter[];
  sort?: { value: string; onChange: (v: string) => void; options: Option[] };
  /**
   * MT3 §IV.4 — NHÓM HÀNH ĐỘNG CHÍNH, hiển thị **BÊN TRÁI** theo thứ tự chuẩn:
   * `Tạo mới → Sửa → Xóa/ngừng sử dụng`.
   * ⛔ Không chuyển nhóm này thành cột dọc ở màn hẹp (MT3 §IV.2).
   */
  actions?: ReactNode;
  /** Nội dung tuỳ ý chen vào vùng điều khiển (vd ô bật/tắt cột, chọn phạm vi). */
  extra?: ReactNode;
  /**
   * MT3 §IV.4 — NHÓM HÀNH ĐỘNG PHỤ hiển thị **BÊN PHẢI** sau bộ lọc:
   * `Xuất Excel · các thao tác phụ`. Tách riêng để giữ đúng thứ tự chuẩn khi toolbar đầy đủ.
   */
  secondaryActions?: ReactNode;
}) {
  return (
    <div className="table-toolbar list-toolbar">
      <div className="list-toolbar-title">
        <strong>{title}</strong>
        {note && <span>{note}</span>}
        {typeof count === "number" && (
          <em className="list-toolbar-count">
            {count}
            {typeof total === "number" && total !== count ? `/${total}` : ""}
            {unit ? ` ${unit}` : ""}
          </em>
        )}
      </div>

      {/* MT3 §IV.4 — hành động CHÍNH (Tạo · Sửa · Xóa) đứng TRƯỜC bộ điều khiển. */}
      {actions && <div className="row-actions list-toolbar-primary">{actions}</div>}

      <div className="list-toolbar-controls">
        {search && (
          <label className="list-toolbar-field list-toolbar-search">
            <span>Tìm</span>
            <input
              type="search"
              value={search.value}
              onChange={(e) => search.onChange(e.target.value)}
              placeholder={search.placeholder || "Nhập từ khoá…"}
            />
          </label>
        )}

        {/* MT3 §IV.4 — thứ tự: Tìm kiếm → Sắp xếp → Bộ lọc → Chọn phạm vi. */}
        {sort && (
          <label className="list-toolbar-field list-toolbar-sort">
            <span>Sắp xếp</span>
            <select value={sort.value} onChange={(e) => sort.onChange(e.target.value)}>
              {sort.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
        )}

        {(filters || []).map((f) => (
          <label className="list-toolbar-field" key={f.key}>
            <span>{f.label}</span>
            <select value={f.value} onChange={(e) => f.onChange(e.target.value)}>
              {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
        ))}

        {extra}

        {/* MT3 §IV.4 — hành động PHỤ (Xuất Excel · thao tác phụ) ở CUỐI. */}
        {secondaryActions && <div className="row-actions list-toolbar-secondary">{secondaryActions}</div>}
      </div>
    </div>
  );
}

export default ListToolbar;
