// USER 28/09/2026 — CHỨNG MINH NHÁNH «BƯỚC ĐÃ DUYỆT» BẰNG DỮ LIỆU THẬT TỪ API.
//   ⛔ KHÔNG tin vào việc "đã sửa mã" — phải chạy đúng hàm + đúng dữ liệu `decidedAt` thật
//      rồi in ra CHÍNH XÁC chuỗi mà người dùng sẽ thấy trên màn hình.
import { approvalDecisionAtView, approvalDecisionCommentView } from "../lib/p2-approval-timeline.ts";

const B = "http://127.0.0.1:9000";
const r = await fetch(B + "/api/system", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ action: "login", username: "admin", password: "Admin123456@" }),
});
const ck = (r.headers.get("set-cookie") || "").split(";")[0];
const data = (await (await fetch(B + "/api/system", { headers: { cookie: ck } })).json()).data || {};
const reqs = data.requests || [];

// Đúng biểu thức JSX đang dùng ở app/page.tsx cho dòng phụ của khối người xử lý.
function subLine(stageNo, currentStage, approval) {
  if (stageNo > currentStage) return "Chưa tới bước này";
  if (stageNo === currentStage) return "Người/nhóm đang xử lý";
  const dept = approval?.department ? " · " + approval.department : "";
  const at = approvalDecisionAtView(approval);
  const time = approval?.status === "approved" && at.hasSource ? " · duyệt lúc " + at.value : "";
  return "Đã xử lý" + dept + time;
}

const target = reqs.find((q) => String(q.requestNo) === "DNMH-CTY-2026-0002") || reqs.find((q) => (q.approvals || []).some((a) => a.status === "approved"));
const approvals = (target.approvals || []).slice().sort((a, b) => Number(a.stage) - Number(b.stage));
const approvedCount = approvals.filter((a) => a.status === "approved").length;
// currentStage = bước đầu tiên CHƯA duyệt (đúng logic màn hình).
const currentStage = approvals.find((a) => a.status !== "approved")?.stage ?? Math.max(...approvals.map((a) => Number(a.stage)), 0);

console.log("  PHIẾU: " + target.requestNo + " · " + target.status);
console.log("  bước đã duyệt: " + approvedCount + "/" + approvals.length + " · bước đang xử lý: " + currentStage);
console.log("  ── DÒNG SẼ HIỂN THỊ DƯỚI TÊN BƯỚC ──");
for (const a of approvals) {
  const at = approvalDecisionAtView(a);
  const cm = approvalDecisionCommentView(a);
  console.log("   bước " + a.stage + " [" + a.status + "]");
  console.log("      tên người duyệt : " + (a.approverName || "(chưa có tên)"));
  console.log("      dòng phụ        : " + subLine(Number(a.stage), currentStage, a));
  console.log("      khối quyết định : " + (at.hasSource || cm.hasSource ? "CÓ (chỉ hiện dữ liệu thật)" : "ẨN — lý do nằm ở tooltip"));
  console.log("      title tooltip   : " + (!at.hasSource ? at.note : !cm.hasSource ? cm.note : "(không cần)"));
}
const empty = approvals.filter((a) => { const at = approvalDecisionAtView(a); const cm = approvalDecisionCommentView(a); return !at.hasSource && !cm.hasSource; }).length;
console.log("  ── KẾT QUẢ ──");
console.log("   bước có khối 'Thời điểm duyệt/Bình luận' hiện ra: " + (approvals.length - empty) + "/" + approvals.length);
console.log("   ⇒ rút gọn được " + empty + " khối rỗng so với bản cũ.");
