// USER 28/09/2026 — SỬA LỖI GÂY HỎNG HỢP ĐỒNG KIỂM THỬ.
// ⛔ Tôi đã đổi chuỗi `Đã xử lý` thành `Đã duyệt` ở dòng phụ của bước duyệt ⇒ `tests/p6-04-future-step-no-approver.test.mjs`
//    L26 (`/Đã xử lý[\s\S]{0,140}approval\?\.department/`) HỎNG.
// ⚠️ TỚI TỆ: bộ tự kiểm của tôi cũng viết "Đã duyệt" ⇒ báo ĐẠT SAI ⇒ tôi đã đối chiếu bằng
//    chính tiêu chuẩn mình vừa sửa. BÀI HỌC: ⛔ tự kiểm phải copy NGUYÊN VĂN điều kiện trong test,
//    ⛔ không được tự đặt lại kỳ vọng theo cái mình vừa viết.
// ✅ SỬA: trả về `Đã xử lý` (giữ nguyên hợp đồng) nhưng VẪN kèm thời gian duyệt theo yêu cầu của user.
import { readFileSync, writeFileSync } from "node:fs";

const F = "app/page.tsx";
let t = readFileSync(F, "utf8");

const OLD = '`Đã duyệt${approval?.department?" · "+approval.department:""}${atView.hasSource?" · duyệt lúc "+atView.value:""}`';
const NEW = '`Đã xử lý${approval?.department?" · "+approval.department:""}${approval?.status==="approved"&&atView.hasSource?" · duyệt lúc "+atView.value:""}`';

const n = t.split(OLD).length - 1;
if (n === 0) { console.log("  (đã đúng — không cần sửa)"); }
else if (n > 1) { console.log("  🔴 khớp " + n + " lần — KHÔNG sửa"); process.exit(1); }
else {
  t = t.replace(OLD, NEW);
  writeFileSync(F, t, "utf8");
  console.log("  ✅ đã trả về `Đã xử lý` (giữ hợp đồng P6-04) + kèm `duyệt lúc <thời gian>`");
}

// --- TỰ KIỂM: copy NGUYÊN VĂN điều kiện trong tệp test, ⛔ KHÔNG tự đặt lại ---
const flow = t.slice(t.indexOf("approval-detail-pane"), t.indexOf("approval-meta-pane"));
const CHECKS = [
  // p6-04-future-step-no-approver.test.mjs (nguyên văn)
  ["P6-04 L17 Đang chờ", /Number\(stage\.stageNo\)\s*>\s*currentStage\s*\?\s*"Đang chờ"/],
  ["P6-04 L19 roleLabel sau nhánh", /Number\(stage\.stageNo\)\s*>\s*currentStage\s*\?\s*"Đang chờ"[\s\S]{0,220}roleLabel\(data,code\)/],
  ["P6-04 L21 Chưa tới bước này", /Number\(stage\.stageNo\)\s*>\s*currentStage\s*\?\s*"Chưa tới bước này"/],
  ["P6-04 L26 Đã xử lý + phòng ban", /Đã xử lý[\s\S]{0,140}approval\?\.department/],
  ["P6-04 L28 approval-step-decided-at", /data-vntech="approval-step-decided-at"/],
  // p2-d4-approval-timeline.test.mjs (nguyên văn)
  ["P2-D4 decided-at", /data-vntech="approval-step-decided-at"/],
  ["P2-D4 comment", /data-vntech="approval-step-comment"/],
  ["P2-D4 nhãn Thời điểm duyệt", /Thời điểm duyệt/],
  ["P2-D4 nhãn Bình luận", /Bình luận/],
  ["P2-D4 atView.value", /atView\.value/],
  ["P2-D4 commentView.value", /commentView\.value/],
  ["P2-D4 !atView.hasSource", /!atView\.hasSource/],
  ["P2-D4 !commentView.hasSource", /!commentView\.hasSource/],
  ["P2-D4 const state=approval?.status", /const state=approval\?\.status/],
  ["không hard-code decidedAt", /^(?!.*decidedAt:\s*").*$/s],
];
let bad = 0;
for (const [name, re] of CHECKS) {
  const ok = name === "không hard-code decidedAt" ? !/decidedAt:\s*"/.test(t) : re.test(flow);
  if (!ok) bad += 1;
  console.log("   " + (ok ? "✅" : "🔴") + " " + name);
}
console.log("  === HỢP ĐỒNG (nguyên văn từ test): " + (CHECKS.length - bad) + "/" + CHECKS.length + " ===");
process.exit(bad === 0 ? 0 : 1);
