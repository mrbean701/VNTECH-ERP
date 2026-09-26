// [PHASE 8 · B2 · bước 1] Đổi trạng thái PO KHỞI TẠO: "waiting_delivery" ⇒ "pending_approval" (parity Java + JS).
// Mỏ neo CHÍNH XÁC (tự chối nếu không khớp đúng 1 lần):
//   • JS: trong DÒNG chứa `INSERT INTO purchase_orders`, đổi literal trạng thái ĐẦU TIÊN sau vị trí đó.
//   • Java: trong DÒNG chứa cả `groupLines` và `"waiting_delivery"` (dòng ~177 của PurchaseManagementUseCase).
// (Viết dạng .mjs theo đúng bài học: KHÔNG dùng `node -e`.)
import { readFileSync, writeFileSync } from "node:fs";
const APPLY = process.argv.includes("--apply");
const JS = "scripts/system-route.mjs";
const JV = "java-backend/application/src/main/java/com/vntech/erp/application/service/PurchaseManagementUseCase.java";
const failures = [];
const OLD = "waiting_delivery", NEW = "pending_approval";

// ── JS ──────────────────────────────────────────────────────────────────────
let jsText = readFileSync(JS, "utf8");
const jsLines = jsText.split("\n");
const insIdx = jsLines.findIndex((l) => l.includes("INSERT INTO purchase_orders"));
if (insIdx < 0) failures.push("[JS] không thấy dòng có `INSERT INTO purchase_orders` ⇒ DỪNG");
else {
  const line = jsLines[insIdx];
  const from = line.indexOf("INSERT INTO purchase_orders");
  const at = line.indexOf(OLD, from);
  if (at < 0) failures.push(`[JS] không thấy '${OLD}' SAU mốc INSERT trong dòng ${insIdx + 1} ⇒ DỪNG`);
  else {
    const before = line.slice(Math.max(0, at - 90), at + 40);
    console.log(`JS dòng ${insIdx + 1}: …${before}…`);
    const hits = (line.match(new RegExp(OLD, "g")) || []).length;
    console.log(`  (trong dòng này có ${hits} lần '${OLD}'; sẽ đổi lần ĐẦU TIÊN sau mốc INSERT)`);
    jsLines[insIdx] = line.slice(0, at) + NEW + line.slice(at + OLD.length);
    jsText = jsLines.join("\n");
  }
}

// ── JAVA ────────────────────────────────────────────────────────────────────
let jvText = readFileSync(JV, "utf8");
const jvLines = jvText.split("\n");
const cand = jvLines.map((l, i) => ({ l, i })).filter((x) => x.l.includes("groupLines") && x.l.includes(OLD));
if (cand.length !== 1) failures.push(`[JAVA] thấy ${cand.length} dòng chứa cả 'groupLines' và '${OLD}' (cần 1) ⇒ DỪNG`);
else {
  const { l, i } = cand[0];
  const at = l.indexOf(OLD);
  console.log(`JAVA dòng ${i + 1}: …${l.slice(Math.max(0, at - 80), at + 40).trim()}…`);
  jvLines[i] = l.slice(0, at) + NEW + l.slice(at + OLD.length);
  jvText = jvLines.join("\n");
}

if (failures.length) { console.error("KHÔNG GHI — có điều kiện không đạt:"); for (const f of failures) console.error("  ✖ " + f); process.exit(1); }
if (!APPLY) { console.log("CHẠY KHÔ: mỏ neo khớp ⇒ sẵn sàng ghi (thêm --apply)."); process.exit(0); }
writeFileSync(JS, jsText); writeFileSync(JV, jvText);
console.log("ĐÃ GHI: JS + JAVA (PO khởi tạo ⇒ pending_approval)");
