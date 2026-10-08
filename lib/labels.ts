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
//
// ⛔ ERP-SESSION-03 (07/10/2026) — `BUG-20261007-C03`: TỪ 07/10/2026 TỆP NÀY **KHÔNG CÒN BẢNG NHÃN RIÊNG**.
//   Lý do: bản cũ có bảng 25 mã + fallback `row.supplyStatus || row.status` ⇒ **RÒ MÃ THÔ TIẾNG ANH**
//   ra giao diện VÀ ra cả tệp xuất Excel/PDF (`lib/supply-docs.tsx` · `lib/request-actions.ts`), đúng lỗi user
//   báo «một số nơi hiển thị tiếng Anh». Đo được trước khi sửa: `partial_issued` → «Partial issued»,
//   `WAITING_SUPPLIER` → «WAITING SUPPLIER».
//   ✅ Nay bảng nhãn chuỗi cung ứng nằm ở **`lib/status-labels.ts` (nguồn DUY NHẤT)**, domain `supply`.
//   ⛔ THỨ TỰ ƯU TIÊN GIỮ NGUYÊN: `supplyStatus` → `status` → `postingStatus` (hợp đồng cũ, đã kiểm bằng test).

import type { Row } from "@/lib/ui-shared";
import { knownStatusLabel, statusLabel as sharedStatusLabel } from "@/lib/status-labels";

/**
 * Nhãn tiếng Việt cho một dòng chứng từ chuỗi cung ứng.
 *
 * ⛔ GIỮ NGUYÊN thứ tự ưu tiên của bản cũ: thử `supplyStatus` → `status` → `postingStatus`,
 *    lấy trường ĐẦU TIÊN có nhãn ĐÃ BIẾT. Không trường nào có nhãn ⇒ dịch trường đầu tiên
 *    bằng bảng dùng chung (domain `supply`) thay vì **in mã thô** như trước.
 */
function statusLabel(row: Row) {
  const candidates = [row?.supplyStatus, row?.status, row?.postingStatus]
    .map((value) => (value === null || value === undefined ? "" : String(value).trim()))
    .filter(Boolean);
  for (const raw of candidates) {
    const known = knownStatusLabel(raw, "supply");
    if (known) return known;
  }
  return candidates.length ? sharedStatusLabel(candidates[0], "supply") : "—";
}
export {
  statusLabel,
};