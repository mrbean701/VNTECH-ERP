"use client";

// PHASE 1 (U-06, U-07) — TIMELINE DÙNG CHUNG
//
// U-06 APPROVAL TIMELINE — theo yêu cầu §8.1, màn chi tiết phiếu phải thể hiện được ĐỦ
//      thông tin phê duyệt. Trước đây phần này thiếu người duyệt / phòng ban / thời gian.
//      Mỗi bước hiển thị tối thiểu: SỐ BƯỚC · NGƯỜI DUYỆT · PHÒNG BAN · THỜI GIAN ·
//      TRẠNG THÁI · Ý KIẾN.
//
// U-07 ACTIVITY TIMELINE — dùng chung cho mọi lịch sử (audit log, lịch sử phiếu, lịch sử
//      thực thể…). Trước đây mỗi nơi tự dựng một kiểu.
//
// Cả hai đều responsive: màn hẹp thì dải chuyển sang bố cục dọc, không tràn ngang.

import type { ReactNode } from "react";
import { StatusBadge, type Tone } from "./StatusBadge";

export type ApprovalStepStatus = "approved" | "rejected" | "pending" | "waiting" | "skipped";

export type ApprovalStep = {
  /** Số thứ tự bước — bắt buộc để người dùng đối chiếu với luồng đã cấu hình. */
  no: number;
  /** Tên bước, ví dụ "CHT xác nhận nhu cầu". */
  name: string;
  /** Người đã/cần duyệt. */
  approver?: string;
  /** Phòng ban của người duyệt. */
  department?: string;
  status: ApprovalStepStatus;
  /** Thời điểm quyết định (chuỗi ISO hoặc chuỗi đã định dạng). */
  at?: string | null;
  /** Ý kiến / lý do từ chối. */
  comment?: string | null;
  /** Hạn phải xử lý. */
  dueAt?: string | null;
  /** Thời điểm cấp nhận hồ sơ vào bước này — nhãn "Nhận hồ sơ" lấy nguyên văn từ markup cũ. */
  queuedAt?: string | null;
  /** Thời điểm gửi email nhắc — chỉ hiện với bước CHƯA ra quyết định, đúng như markup cũ. */
  notifiedAt?: string | null;
  /** Câu mô tả thời gian xử lý do nơi gọi tính sẵn (`approvalTiming`) — component không tự tính lại. */
  timingText?: string | null;
  /** Bước đang quá hạn ⇒ tô đỏ dòng thời gian, đúng hành vi cũ. */
  late?: boolean;
};

const STEP_LABEL: Record<ApprovalStepStatus, string> = {
  approved: "Đã duyệt",
  rejected: "Từ chối / trả lại",
  pending: "Chờ duyệt",
  waiting: "Chưa tới lượt",
  skipped: "Bỏ qua",
};

const STEP_TONE: Record<ApprovalStepStatus, Tone> = {
  approved: "green",
  rejected: "red",
  pending: "amber",
  waiting: "grey",
  skipped: "grey",
};

/** Định dạng thời gian an toàn: nhận ISO hoặc chuỗi bất kỳ, không bao giờ ném lỗi. */
function fmt(v?: string | null): string {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function ApprovalTimeline({ steps, title = "DẢI PHÊ DUYỆT", note, compact }: {
  steps: ApprovalStep[];
  title?: string;
  note?: string;
  /** Chế độ gọn — dùng khi nhúng vào card nhỏ. */
  compact?: boolean;
}) {
  const done = steps.filter((s) => s.status === "approved").length;
  const rejected = steps.filter((s) => s.status === "rejected").length;

  return (
    <section className="card vt-timeline-card" data-vntech="approval-timeline">
      <div className="card-head">
        <div>
          <h2>{title}</h2>
          <p>{note || `Đã duyệt ${done}/${steps.length} bước${rejected ? ` · ${rejected} bước bị trả lại` : ""}`}</p>
        </div>
      </div>
      <ol className={`vt-timeline${compact ? " vt-timeline-compact" : ""}`}>
        {steps.map((s) => (
          <li key={s.no} className={`vt-timeline-step is-${s.status}${s.late ? " is-late" : ""}`}>
            <div className="vt-timeline-marker" aria-hidden="true">
              <span>{s.no}</span>
            </div>
            <div className="vt-timeline-body">
              <div className="vt-timeline-head">
                <strong>{s.name}</strong>
                <StatusBadge value={STEP_LABEL[s.status]} tone={STEP_TONE[s.status]} />
              </div>
              <div className="vt-timeline-meta">
                <span title="Người duyệt"><b>Người duyệt:</b> {s.approver || "—"}</span>
                <span title="Phòng ban"><b>Phòng ban:</b> {s.department || "—"}</span>
                <span title="Thời gian"><b>Thời gian:</b> {fmt(s.at)}</span>
                {s.queuedAt && (
                  <span title="Nhận hồ sơ"><b>Nhận hồ sơ:</b> {fmt(s.queuedAt)}</span>
                )}
                {s.dueAt && (
                  <span title="Hạn xử lý"><b>Hạn:</b> {fmt(s.dueAt)}</span>
                )}
              </div>
              {(s.timingText || !s.at) && (
                <p className={s.late ? "vt-timeline-note red-text" : "vt-timeline-note"}>
                  {s.timingText}
                  {s.timingText && !s.at ? " · " : null}
                  {!s.at ? (s.notifiedAt ? `Đã gửi email ${fmt(s.notifiedAt)}` : "Email chưa gửi hoặc chưa cấu hình") : null}
                </p>
              )}
              {s.comment && <p className="vt-timeline-comment">“{s.comment}”</p>}
            </div>
          </li>
        ))}
        {!steps.length && (
          <li className="vt-timeline-empty">
            <div className="empty"><span>✓</span><strong>Chưa có bước phê duyệt.</strong><p>Luồng duyệt sẽ hiện khi phiếu được gửi.</p></div>
          </li>
        )}
      </ol>
    </section>
  );
}

export type ActivityItem = {
  at?: string | null;
  actor?: string;
  action: string;
  detail?: ReactNode;
  tone?: Tone;
};

export function ActivityTimeline({ items, title = "LỊCH SỬ HOẠT ĐỘNG", note, emptyText = "Chưa có hoạt động nào." }: {
  items: ActivityItem[];
  title?: string;
  note?: string;
  emptyText?: string;
}) {
  return (
    <section className="card vt-timeline-card" data-vntech="activity-timeline">
      <div className="card-head"><div><h2>{title}</h2><p>{note || `${items.length} mục`}</p></div></div>
      <ol className="vt-timeline vt-timeline-activity">
        {items.map((it, i) => (
          <li key={i} className="vt-timeline-step">
            <div className="vt-timeline-marker vt-timeline-marker-dot" aria-hidden="true"><span /></div>
            <div className="vt-timeline-body">
              <div className="vt-timeline-head">
                <strong>{it.action}</strong>
                {it.tone && <StatusBadge value={it.action} tone={it.tone} label="" />}
              </div>
              <div className="vt-timeline-meta">
                <span><b>Người thực hiện:</b> {it.actor || "—"}</span>
                <span><b>Thời gian:</b> {fmt(it.at)}</span>
              </div>
              {it.detail && <div className="vt-timeline-detail">{it.detail}</div>}
            </div>
          </li>
        ))}
        {!items.length && (
          <li className="vt-timeline-empty">
            <div className="empty"><span>✓</span><strong>{emptyText}</strong><p>Hoạt động mới sẽ xuất hiện tại đây.</p></div>
          </li>
        )}
      </ol>
    </section>
  );
}

export default ApprovalTimeline;
