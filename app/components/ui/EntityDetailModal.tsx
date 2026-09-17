"use client";

// PHASE 1 (U-01 + U-10) — ENTITY DETAIL MODAL DÙNG CHUNG
//
// Vấn đề đang sửa: hệ thống có 31 modal thực thể độc lập (RequestModal, PoModal,
// ProjectModal, MaterialModal, UserModal…), mỗi cái tự xử lý mở/đóng, nạp dữ liệu, kiểm
// quyền, tab, trạng thái rỗng/lỗi — lặp lại cùng một khuôn 31 lần. Đồng thời modal có thể
// VƯỢT VIEWPORT (yêu cầu §5 và U-10).
//
// Component này là MỘT khung dùng chung cho: User · Project · Warehouse · Team · Material ·
// Supplier · Task và mọi thực thể khác. Nó xử lý sẵn:
//   • tab động (chỉ truyền những tab cần dùng)
//   • trạng thái ĐANG TẢI · LỖI · RỖNG · KHÔNG CÓ QUYỀN
//   • giới hạn chiều cao + cuộn nội bộ ⇒ KHÔNG BAO GIỜ vượt viewport
//   • responsive: màn hẹp thì modal chiếm gần trọn màn hình
//
// Cách dùng:
//   <EntityDetailModal
//     open={!!id} onClose={()=>setId(null)}
//     title="Chi tiết dự án" subtitle={project?.code}
//     loading={loading} error={error}
//     canView={permission.canView}
//     tabs={[
//       { key:"info",   label:"Thông tin chung", content:<InfoTab/> },
//       { key:"staff",  label:"Nhân sự",         content:<StaffTab/>, badge: 12 },
//       { key:"teams",  label:"Tổ đội",          content:<TeamTab/> },
//     ]}
//     footer={<ModalFooter…/>}
//   />

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { PermissionGuard } from "./PermissionGuard";

export type DetailTab = {
  key: string;
  label: string;
  content: ReactNode;
  /** Số hiển thị cạnh nhãn tab (số dòng, số bản ghi…). */
  badge?: number | string;
  /** Ẩn tab khi không đủ quyền — KHÔNG phải lớp bảo vệ, backend vẫn phải kiểm. */
  permission?: unknown;
};

export function EntityDetailModal({
  open, onClose, title, subtitle, entityId,
  tabs, loading, error, emptyText, canView = true,
  footer, width = "standard", actions,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Dòng phụ dưới tiêu đề — thường là mã thực thể. */
  subtitle?: ReactNode;
  /** Mã thực thể; hiển thị nhỏ ở góc để tra cứu, và dùng làm khoá khi cần. */
  entityId?: string;
  tabs: DetailTab[];
  loading?: boolean;
  error?: string | null;
  emptyText?: string;
  /** Quyền xem. Sai thì hiển thị màn từ chối thay vì nội dung. */
  canView?: unknown;
  footer?: ReactNode;
  width?: "standard" | "wide";
  /** Nút hành động ở góc phải tiêu đề. */
  actions?: ReactNode;
}) {
  const visibleTabs = useMemo(
    () => tabs.filter((t) => t.permission === undefined || t.permission === true || t.permission === 1 || t.permission === "1"),
    [tabs],
  );
  // Tab người dùng đã bấm (undefined = chưa bấm lần nào).
  const [selectedTab, setSelectedTab] = useState<string | undefined>(undefined);

  // Đổi thực thể hoặc đổi danh sách tab thì quay về tab đầu — tránh trạng thái tab cũ trỏ vào
  // tab không còn tồn tại. SUY RA ngay khi render thay vì đồng bộ bằng useEffect: cách cũ gọi
  // setState trực tiếp trong effect, gây render dây chuyền và bị lint chặn
  // (`react-hooks/set-state-in-effect`). Hành vi với người dùng là như nhau.
  const active = visibleTabs.some((t) => t.key === selectedTab) ? selectedTab : visibleTabs[0]?.key;

  // Đóng bằng phím Esc — hành vi người dùng mong đợi ở mọi modal.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const current = visibleTabs.find((t) => t.key === active) || visibleTabs[0];

  const body = () => {
    if (canView !== true && canView !== 1 && canView !== "1") {
      return (
        <div className="empty edm-state">
          <span>🔒</span><strong>Bạn không có quyền xem thực thể này.</strong>
          <p>Liên hệ Quản trị hệ thống nếu cần cấp quyền.</p>
        </div>
      );
    }
    if (loading) return <div className="empty edm-state"><span>…</span><strong>Đang tải…</strong><p>Vui lòng chờ trong giây lát.</p></div>;
    if (error) return <div className="inline-alert danger">Không tải được dữ liệu: {error}</div>;
    if (!current) return <div className="empty edm-state"><span>✓</span><strong>{emptyText || "Không có nội dung."}</strong><p>Chưa có dữ liệu để hiển thị.</p></div>;
    return current.content;
  };

  return (
    <div className="overlay modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className={`modal entity-detail-modal${width === "wide" ? " edm-wide" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
        <header>
          <div>
            <h2>{title}</h2>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <div className="edm-head-actions">
            {actions}
            {entityId && <code className="edm-entity-id" title="Mã thực thể">{entityId}</code>}
            <button type="button" onClick={onClose} aria-label="Đóng">×</button>
          </div>
        </header>

        {visibleTabs.length > 1 && (
          <nav className="edm-tabs" role="tablist">
            {visibleTabs.map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={t.key === active}
                className={t.key === active ? "is-active" : ""}
                onClick={() => setSelectedTab(t.key)}
              >
                {t.label}
                {t.badge !== undefined && <b className="edm-tab-badge">{t.badge}</b>}
              </button>
            ))}
          </nav>
        )}

        <div className="edm-body" role="tabpanel">{body()}</div>

        {footer && <footer className="modal-footer">{footer}</footer>}
      </section>
    </div>
  );
}

/** Bọc ngoài cho tiện: chỉ hiển thị khi `open`. Dùng khi muốn tránh nhánh if ở nơi gọi. */
export function GuardedEntityModal(props: Parameters<typeof EntityDetailModal>[0] & { permission?: unknown }) {
  const { permission, ...rest } = props;
  return (
    <PermissionGuard allow={permission === undefined ? true : permission}>
      <EntityDetailModal {...rest} />
    </PermissionGuard>
  );
}

export default EntityDetailModal;
