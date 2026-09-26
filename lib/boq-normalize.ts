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

import { normalizeBoqHeader } from "@/lib/ui-shared";
function isBoqTemplateInstructionRow(row:string[]){const markers=["cot he thong tu link tinh khong nhap tay","bat buoc theo cau hinh admin","khong bat buoc"];const cells=row.map(normalizeBoqHeader).filter(Boolean);return cells.filter((cell)=>markers.some((marker)=>cell===marker||cell.startsWith(marker))).length>=2;}

function normalizeBoqRowRole(value: unknown) { const v=normalizeBoqHeader(value); if(v.includes("tong"))return "subtotal"; if(v.includes("tieu de phan")||v==="phan")return "section"; if(v.includes("tieu de he")||v==="he")return "system"; if(v.includes("nhom"))return "group"; if(v.includes("ghi chu"))return "note"; if(v.includes("cau kien")||v.includes("chi tiet"))return "component"; return "material"; }

function normalizeBoqType(value: unknown) { const v = normalizeBoqHeader(value); return v.includes("ngoai") || v.includes("phat sinh") ? "outside_contract" : "contract"; }
export {
  isBoqTemplateInstructionRow,
  normalizeBoqRowRole,
  normalizeBoqType,
};