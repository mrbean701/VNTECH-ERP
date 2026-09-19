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

import { statusLabel } from "@/lib/labels";
import { requestLineContext } from "@/lib/request-context";
import type { RequestExportDocument } from "@/lib/request-export";
import type { AppData, Row } from "@/lib/ui-shared";
function savedRequestDocument(data: AppData, request: Row): RequestExportDocument {
  return {
    requestNo: request.requestNo || "De_nghi_cap_vat_tu", projectCode: request.projectCode, projectName: request.projectName, requestedBy: request.requestedBy, requestedAt: request.requestedAt, neededAt: request.neededAt, priority: request.priority, area: request.area, purpose: request.purpose, status: statusLabel(request), fieldConfigs: data.formFieldConfigs,
    lines: (request.items || []).map((item: Row, index: number) => requestLineContext(data, request.projectId, item, index)),
  };
}

async function decide(requestId: string, stage: number, decision: "approved"|"rejected", action: (name:string,payload:Row)=>Promise<boolean>, comment?: string) {
  const resolved = comment === undefined ? (window.prompt(decision === "approved" ? "Bình luận duyệt (có thể để trống):" : "Lý do trả lại / từ chối:") ?? "") : comment;
  if (decision === "rejected" && !String(resolved).trim()) { window.alert("Vui lòng nhập lý do trả lại / từ chối."); return false; }
  return action("decide_approval", { requestId, stage, decision, comment: String(resolved).trim() });
}

export {
  decide,
  savedRequestDocument,
};