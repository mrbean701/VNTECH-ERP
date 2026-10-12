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

import { statusLabel } from "@/lib/status-labels";

export type Tone = "green" | "red" | "amber" | "blue" | "grey";

/**
 * Từ khoá quyết định màu — giữ nguyên đúng tập từ khoá của <Pill> cũ để không đổi hành vi.
 *
 * LƯU Ý QUAN TRỌNG (phát hiện 17/09/2026 khi chuẩn bị thay 88 chỗ <Pill> bằng component này):
 * <Pill> dùng `lower === "đạt"` (SO SÁNH BẰNG) cho màu xanh lá, KHÔNG phải `includes("đạt")`.
 * Nếu để `includes` thì giá trị "Chưa đạt" sẽ thành XANH LÁ (sai ngữ nghĩa) trong khi <Pill> cho
 * XANH DƯƠNG. Vì vậy "đạt" phải nằm ở danh sách SO SÁNH BẰNG, không nằm trong danh sách chứa.
 */
const GREEN_HINTS = ["đã", "đủ"];
const GREEN_EXACT = ["đạt"];
const RED_HINTS = ["từ", "chặn", "trễ", "âm", "không"];
const AMBER_HINTS = ["chờ", "đang", "thiếu", "partial", "dưới"];

/**
 * Suy ra màu từ chữ hiển thị. Xuất ra ngoài để nơi khác dùng lại được (ví dụ tính toán
 * thống kê theo màu) mà không phải chép lại quy tắc.
 *
 * Hàm này PHẢI cho kết quả giống hệt <Pill> cũ với MỌI đầu vào — có công cụ kiểm chứng:
 * `node tools/probe-statusbadge-parity.mjs`.
 */
export function toneOf(value: unknown): Tone {
  const lower = String(value ?? "").toLowerCase();
  if (GREEN_HINTS.some((k) => lower.includes(k)) || GREEN_EXACT.includes(lower)) return "green";
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
  // MT3 §IV.6 / ma trận #5 — 1 BẢNG ÁNH XẠ DÙNG CHUNG: nếu người gọi KHÔNG truyền `label`
  //   thì tự tra `lib/status-labels.ts` thay vì in mã thô (`pending_approval`) ra màn hình.
  // ⚠️ CHỐT AN TOÀN: CHỈ tra khi giá trị **trông như mã thô** (không dấu cách, không ký tự tiếng Việt).
  //   Lý do: `statusLabel` có `humanize()` cho giá trị lạ ⇒ nếu `value` **đã là tiếng Việt**
  //   (vd «Đang hoạt động») thì việc đổi hoa/thường là **hồi quy giao diện** ⛔ không mong muốn.
  const rawText = String(value ?? "");
  // ⛔ ERP-SESSION-03 (07/10/2026) — `BUG-20261007-C03`: chốt CŨ là `/^[a-z0-9_.-]+$/` (**chỉ chữ THƯỜNG**)
  //    ⇒ mã trạng thái VIẾT HOA của Công việc (`IN_PROGRESS` · `WAITING_SUPPLIER` · `REWORK` · `SUBMITTED`…)
  //    **KHÔNG được dịch** và in NGUYÊN MÃ TIẾNG ANH ra màn hình — đúng lỗi user báo «1 số nơi hiển thị tiếng Anh».
  //    ✅ Nay nhận CẢ chữ HOA. Vẫn ⛔ KHÔNG đụng chuỗi có dấu cách hoặc ký tự tiếng Việt ⇒ nhãn đã đúng giữ nguyên.
  const looksLikeRawCode = rawText.length > 0 && /^[A-Za-z0-9_.-]+$/.test(rawText);
  const display: ReactNode = label ?? (looksLikeRawCode ? statusLabel(value) : rawText);
  // Màu suy từ CHỮ ĐANG HIỂN THỊ (tập từ khoá của `toneOf` là tiếng Việt: «chờ» · «đã» · «từ»…).
  // ⛔ Trước đây màu suy từ MÃ THÔ nên mọi badge vừa được dịch đều rơi về `blue` (mất ngữ nghĩa màu).
  const resolved = tone ?? toneOf(typeof display === "string" || typeof display === "number" ? display : value);
  return (
    <span className={`pill ${resolved}`} title={title}>
      <i />
      {display}
    </span>
  );
}

export default StatusBadge;
