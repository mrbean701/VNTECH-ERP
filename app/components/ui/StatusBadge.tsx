"use client";

// PHASE 1 (U-05) — STATUS BADGE DÙNG CHUNG
//
// Trước đây mỗi màn hình tự viết nhãn trạng thái theo cách riêng (hoặc dùng <Pill> với
// logic suy luận màu nằm trong chính component đó). Component này là NGUỒN DUY NHẤT cho
// màu sắc trạng thái, dùng chung cho công việc · dự án · tổ đội · vật tư · phiếu · PO…
//
// Render ĐÚNG markup của <Pill> hiện có (`<span className="pill {tone}"><i />{value}</span>`)
// nên khi thay thế tại chỗ sẽ KHÔNG làm lệch giao diện.
//
// Cách dùng:
//   <StatusBadge value="Đang hoạt động" />
//   <StatusBadge value="pending_approval" label="Chờ duyệt" />
//   <StatusBadge value="completed" tone="green" />   ← ghim màu, không suy luận

import type { ReactNode } from "react";

export type Tone = "green" | "red" | "amber" | "blue" | "grey";

/** Từ khoá quyết định màu — giữ nguyên đúng tập từ khoá của <Pill> cũ để không đổi hành vi. */
const GREEN_HINTS = ["đã", "đủ", "đạt"];
const RED_HINTS = ["từ", "chặn", "trễ", "âm", "không"];
const AMBER_HINTS = ["chờ", "đang", "thiếu", "partial", "dưới"];

/**
 * Suy ra màu từ chữ hiển thị. Xuất ra ngoài để nơi khác dùng lại được (ví dụ tính toán
 * thống kê theo màu) mà không phải chép lại quy tắc.
 */
export function toneOf(value: unknown): Tone {
  const lower = String(value ?? "").toLowerCase();
  if (GREEN_HINTS.some((k) => lower.includes(k))) return "green";
  if (RED_HINTS.some((k) => lower.includes(k))) return "red";
  if (AMBER_HINTS.some((k) => lower.includes(k))) return "amber";
  return "blue";
}

export function StatusBadge({ value, label, tone, title }: {
  /** Giá trị dùng để SUY RA màu. Có thể là mã trạng thái (`pending_approval`) hoặc chữ đã dịch. */
  value: unknown;
  /** Chữ hiển thị. Bỏ trống thì hiển thị chính `value`. */
  label?: ReactNode;
  /** Ghim màu, bỏ qua suy luận. Dùng khi mã trạng thái không chứa từ khoá tiếng Việt. */
  tone?: Tone;
  /** Chú thích khi rê chuột — hữu ích khi nhãn là mã kỹ thuật. */
  title?: string;
}) {
  const resolved = tone ?? toneOf(value);
  return (
    <span className={`pill ${resolved}`} title={title}>
      <i />
      {label ?? String(value ?? "")}
    </span>
  );
}

export default StatusBadge;
