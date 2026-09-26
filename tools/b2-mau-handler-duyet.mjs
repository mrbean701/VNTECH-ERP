// [PHASE 8 · B2 · bước 2] Lấy MẪU CHUẨN: in thân 2 handler duyệt đã có trong JS để bắt chước cho PO.
// (Viết dạng .mjs theo đúng bài học: KHÔNG dùng `node -e`.)
import { readFileSync } from "node:fs";
const lines = readFileSync("scripts/system-route.mjs", "utf8").split("\n");
for (const action of ["approve_central_return", "approve_stock_count"]) {
  const start = lines.findIndex((l) => l.includes(`if (action === "${action}") {`));
  console.log(`\n===== ${action} (bắt đầu dòng ${start + 1}) =====`);
  if (start < 0) { console.log("  KHÔNG TÌM THẤY"); continue; }
  let end = start + 1;
  while (end < lines.length && !/^    \}$/.test(lines[end])) end++;
  for (let i = start; i <= Math.min(end, start + 14); i++) console.log(`${i + 1}: ${(lines[i] || "").trim().slice(0, 190)}`);
  console.log(`  (kết thúc ~dòng ${end + 1})`);
}
