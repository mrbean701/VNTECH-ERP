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

import { downloadCsv, downloadSimpleXlsx } from "@/lib/tabular-export";
import type { TableCell } from "@/lib/tabular-export";
import type { Row } from "@/lib/ui-shared";
function reportRows(headers:string[], rows:string[][], name:string){const result:Row[]=rows.map((cells)=>Object.fromEntries(headers.map((h,i)=>[h,cells[i]??""])));const meta:unknown={__headers:headers,__rows:rows};return Object.assign(result,meta);}

function reportExport(rows: Row[], baseName: string) {
  const sheetName=String(baseName||"Bao_cao").replace(/[\\/:*?\[\]]/g,"-").slice(0,31)||"Bao_cao";
  downloadSimpleXlsx({sheetName,headers:rows[0]?.__headers||[],rows:(rows as unknown as {__rows?:TableCell[][]})?.__rows||[]},`${baseName}_${new Date().toISOString().slice(0,10)}`);
  const headers=rows[0]?.__headers||[]; const body=(rows as unknown as {__rows?:TableCell[][]})?.__rows||[];
  downloadCsv(headers,body,`${baseName}_${new Date().toISOString().slice(0,10)}`);
}
export {
  reportExport,
  reportRows,
};