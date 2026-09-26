// [PHASE 8 · B2 · bước 0] Điều tra 6 chỗ đã có "pending_approval" trong scripts/system-route.mjs:
// in ngữ cảnh + tìm `action === "..."` gần nhất phía trên để biết THỰC THỂ nào đang dùng trạng thái này.
import { readFileSync } from "node:fs";
const FILE = "scripts/system-route.mjs";
const lines = readFileSync(FILE, "utf8").split("\n");
const hits = [];
lines.forEach((l, i) => { if (l.includes('"pending_approval"')) hits.push(i); });
console.log(`tìm thấy ${hits.length} chỗ có "pending_approval"`);
for (const i of hits) {
  let action = "(không rõ)";
  for (let k = i; k >= 0 && k > i - 260; k--) {
    const m = (lines[k] || "").match(/action === "([a-z_]+)"/);
    if (m) { action = m[1]; break; }
  }
  const line = lines[i];
  const idx = line.indexOf("pending_approval");
  const around = line.slice(Math.max(0, idx - 120), idx + 60);
  console.log(`\n--- dòng ${i + 1} · action gần nhất: ${action} ---`);
  console.log(`  …${around}…`);
}
