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

import { isAdminUser, roleBase } from "@/lib/permissions";
import { durationText } from "@/lib/ui-shared";
import type { Row } from "@/lib/ui-shared";
function stageAllowedForUser(stage: Row | undefined, user: Row) { if (isAdminUser(user)) return true; if (!stage) return false; const allowed = String(stage.allowedRoleCodes || "").split(",").map((item) => item.trim()).filter(Boolean); return allowed.includes(String(user.role)) || allowed.includes(roleBase(user)); }

// PHASE 2 (§6 · §23) — PHÂN LOẠI BƯỚC DUYỆT NGAY TRONG DỮ LIỆU (`approval_stage_catalog.stage_kind`):
//   • `approval` = bước duyệt HỒ SƠ phiếu đề nghị mua hàng ⇒ vào chuỗi duyệt (dải tiến trình, KPI chờ duyệt…);
//   • `supply`   = bước CUNG ỨNG/xử lý (101 Lập & phát hành PO · 102 Giao nhận · 103 BCH xác nhận) ⇒ KHÔNG vào
//                  chuỗi duyệt phiếu nhưng VẪN cần phân công Owner + email.
// Trước đây UI viết cứng `[[101,"Lập & phát hành PO"],…]`: đổi người duyệt bước cung ứng phải sửa mã nguồn.
const SUPPLY_STAGE_KIND = "supply";
function stageKindOf(stage: Row | undefined) { return String(stage?.stageKind || stage?.stage_kind || "").trim().toLowerCase() === SUPPLY_STAGE_KIND ? SUPPLY_STAGE_KIND : "approval"; }
function approvalChainStages(stages: Row[] | undefined) { return (Array.isArray(stages) ? stages : []).filter((stage) => stageKindOf(stage) === "approval"); }
function supplyChainStages(stages: Row[] | undefined) { return (Array.isArray(stages) ? stages : []).filter((stage) => stageKindOf(stage) === SUPPLY_STAGE_KIND); }
function sortStageNo(rows: Row[]) { return [...rows].sort((a, b) => Number(a.stageNo) - Number(b.stageNo)); }



function approvalTiming(approval?: Row) { if (!approval?.queuedAt) return { text: "Chờ cấp trước hoàn tất", minutes: 0, late: false, active: false }; const end = approval.decidedAt ? new Date(approval.decidedAt).getTime() : Date.now(); const start = new Date(approval.queuedAt).getTime(); const due = approval.dueAt ? new Date(approval.dueAt).getTime() : 0; const minutes = Math.max(0, (end - start) / 60000); const late = Boolean(due && end > due); return { text: `${approval.decidedAt ? "Đã xử lý" : "Đang chờ"} ${durationText(minutes)} · ${late ? "Quá hạn" : "Trong hạn"}`, minutes, late, active: true }; }

function workflowTiming(step?: Row) { if (!step?.queuedAt) return { text: "Chưa bắt đầu", minutes: 0, late: false }; const end = step.completedAt ? new Date(step.completedAt).getTime() : Date.now(); const start = new Date(step.queuedAt).getTime(); const due = step.dueAt ? new Date(step.dueAt).getTime() : 0; const minutes = Math.max(0, (end - start) / 60000); const late = Boolean(due && end > due); return { text: `${step.completedAt ? "Đã xử lý" : "Đang chờ"} ${durationText(minutes)} · ${late ? "Quá hạn" : "Trong hạn"}`, minutes, late }; }
export {
  approvalChainStages,
  approvalTiming,
  sortStageNo,
  stageAllowedForUser,
  stageKindOf,
  supplyChainStages,
  workflowTiming,
};