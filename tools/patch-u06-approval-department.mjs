// Vá §8.1 (MASTER TASK) — bổ sung PHÒNG BAN của người duyệt vào dải phê duyệt.
//
// ĐỐI CHIẾU YÊU CẦU §8.1: mỗi bước phải có SỐ BƯỚC · NGƯỜI DUYỆT · PHÒNG BAN · THỜI GIAN ·
// TRẠNG THÁI · Ý KIẾN. Kiểm tra mã hiện tại (app/page.tsx, khối "Tiến trình phê duyệt & thời gian
// xử lý" trong RequestDrawer) cho thấy ĐÃ CÓ 5/6:
//   SỐ BƯỚC   -> "Bước {item}"
//   NGƯỜI DUYỆT-> approval.approverName
//   THỜI GIAN -> queuedAt / dueAt / decidedAt (hàm date) + timing.text
//   TRẠNG THÁI-> class theo approval.status + ký hiệu ✓ / × / –
//   Ý KIẾN    -> {approval.comment && <p>Ý kiến: ...</p>}   <-- ĐÃ CÓ SẴN
//   PHÒNG BAN -> THIẾU  <-- đây là phần vá này
//
// Dữ liệu dùng để suy ra phòng ban (đã đo từ payload thật, KHÔNG đoán trường):
//   approval.approverUserId  ->  data.staffDirectory[].id
//   data.staffDirectory[].department = "Ban chỉ huy công trường" (TÊN người đọc được, không phải mã)
//
// Vì sao KHÔNG thay cả khối bằng component dùng chung <ApprovalTimeline>:
// component đó KHÔNG hiển thị "Nhận hồ sơ", trạng thái email (notifiedAt) và cảnh báo quá hạn
// (timing.late) — những thứ markup hiện tại ĐANG có. Thay ngay sẽ MẤT THÔNG TIN (trái §4/§9).
// Việc áp dụng component dùng chung cần mở rộng component trước ⇒ để ở TASK-013.
import { readFileSync, writeFileSync } from "node:fs";

const FILE = "app/page.tsx";
let src = readFileSync(FILE, "utf8");

if (src.includes("approverDept")) {
  console.log("= Bản vá đã được áp dụng trước đó (thấy 'approverDept') — bỏ qua.");
  process.exit(0);
}

const ANCHOR = "const item = Number(approval.stage); const timing = approvalTiming(approval);";
const TARGET = '${approval.approverName || "Chưa rõ người duyệt"} · ${timing.text}';

const countOf = (s, needle) => s.split(needle).length - 1;
const nAnchor = countOf(src, ANCHOR);
const nTarget = countOf(src, TARGET);

console.log(`Số lần xuất hiện: ANCHOR=${nAnchor} · TARGET=${nTarget}`);
if (nAnchor !== 1) { console.error("HỎNG: ANCHOR không duy nhất — DỪNG để không sửa nhầm chỗ."); process.exit(1); }
if (nTarget !== 1) { console.error("HỎNG: TARGET không duy nhất — DỪNG để không sửa nhầm chỗ."); process.exit(1); }

// 1) Tính phòng ban ngay trong callback của map.
src = src.replace(
  ANCHOR,
  ANCHOR + '\n        const approverDept = data.staffDirectory?.find((u: Row) => u.id === approval.approverUserId)?.department || "";',
);

// 2) Hiển thị phòng ban ngay cạnh tên người duyệt (nhãn "Phòng ban:" lấy đúng nguyên văn đã dùng
//    trong component dùng chung ApprovalTimeline — không tự đặt chữ mới).
src = src.replace(
  TARGET,
  '${approval.approverName || "Chưa rõ người duyệt"}${approverDept ? ` · Phòng ban: ${approverDept}` : ""} · ${timing.text}',
);

writeFileSync(FILE, src, "utf8");

// Hậu kiểm trên nội dung ĐÃ ghi.
const after = readFileSync(FILE, "utf8");
const checks = [
  ["có khai báo approverDept", after.includes("const approverDept = data.staffDirectory?.find((u: Row) => u.id === approval.approverUserId)?.department")],
  ["có hiển thị Phòng ban", after.includes("${approverDept ? ` · Phòng ban: ${approverDept}` : \"\"}")],
  ["lời gọi approvalTiming gốc còn nguyên", countOf(after, "const timing = approvalTiming(approval);") === 1],
  ["ý kiến (comment) vẫn còn", after.includes("Ý kiến: {approval.comment}")],
  ["tên người duyệt vẫn còn", after.includes('approval.approverName || "Chưa rõ người duyệt"')],
];
console.log("\nHậu kiểm:");
let ok = true;
for (const [name, pass] of checks) { console.log(`  ${pass ? "ĐẠT" : "HỎNG"}  ${name}`); if (!pass) ok = false; }
process.exit(ok ? 0 : 1);
