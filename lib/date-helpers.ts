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

import { UI_NOW_MS } from "@/lib/ui-shared";
function daysFromToday(iso: unknown): number | null {
  const s = String(iso ?? "").slice(0, 10);
  if (!s) return null;
  const t = new Date(s + "T00:00:00").getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor((UI_NOW_MS - t) / 86400000);
}

/** Số ngày chậm tiến độ: chỉ tính khi dự án còn hoạt động và đã qua ngày kết thúc dự kiến. */
export {
  daysFromToday,
};