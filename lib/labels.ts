// PHASE 1 (U-11) — MODULE DÙNG CHUNG TÁCH KHỎI `app/page.tsx`.
//
// Vì sao tách: `app/page.tsx` là MỘT tệp khổng lồ (hơn 4.000 dòng, hơn 250 khai báo top-level).
// Thứ tự cắt ĐÚNG (đã ghi ở `docs/agent-progress/U14-U11-KHAO-SAT.md` mục 2): tách HELPER DÙNG CHUNG trước
// (gỡ chặn IMPORT VÒNG), rồi mới tách từng màn.
//
// ⚠️ ĐIỀU KIỆN AN TOÀN (do `tools/tach-lat-cat-page.mjs` tự kiểm TRƯỚC KHI GHI): mọi tên mà các khối ở đây
// tham chiếu phải thuộc (a) khối cùng nằm trong tệp này, (b) tên có sẵn của JS, (c) tên đến từ `import` của
// `page.tsx` — công cụ SINH LẠI import đó ở đây, hoặc (d) kiểu của React ⇒ `import type … from "react"`.
// Không còn tên nào khác ⇒ KHÔNG thể tạo import vòng.

import type { Row } from "@/lib/ui-shared";
function statusLabel(row: Row) { const labels: Row = { pending_approval: "Chờ duyệt", approval_pending: "Chờ duyệt", approved: "Đã duyệt", awaiting_po: "Chờ lập PO", waiting_delivery: "Chờ giao hàng", partial_delivery: "Giao một phần", delivered_pending_confirmation: "Chờ BCH xác nhận", awaiting_bch_confirmation: "Chờ BCH xác nhận", received_full_docs_pending: "Đã nhận đủ · Chờ hồ sơ", completed: "Đã hoàn tất", completed_with_exceptions: "Hoàn tất · Thiếu hồ sơ", completed_with_shortage: "Đóng đơn có thiếu", returned_to_requester: "Trả lại CHT", rejected: "Từ chối", cancelled: "Đã hủy", ordered: "Đang mua", partial: "Giao một phần", received: "Đã giao đủ", posted: "Đã ghi sổ", blocked: "Bị chặn" }; return labels[row.supplyStatus] || labels[row.status] || labels[row.postingStatus] || row.supplyStatus || row.status || "—"; }
export {
  statusLabel,
};