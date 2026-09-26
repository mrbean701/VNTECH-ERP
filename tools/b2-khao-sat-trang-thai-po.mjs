// [PHASE 8 · B2] Khảo sát chỗ ĐẶT trạng thái PO (JS create_po + Java createPo) để đổi sang `pending_approval`.
// (Viết tệp .mjs theo đúng bài học: KHÔNG dùng `node -e` vì PowerShell phá dấu nháy.)
import { readFileSync } from "node:fs";
const RE = /waiting_delivery|pending_approval|INSERT INTO purchase_orders|"draft"|"approved"|"cancelled"|status/;

function scan(label, file, fromLine, toLine) {
  console.log(`=== ${label} (${file.split(/[\\/]/).pop()}) ===`);
  const lines = readFileSync(file, "utf8").split("\n");
  const end = Math.min(toLine ?? lines.length, lines.length);
  let shown = 0;
  for (let i = (fromLine ?? 1) - 1; i < end && shown < 14; i++) {
    const t = lines[i] || "";
    if (RE.test(t)) { console.log(`${i + 1}: ${t.trim().slice(0, 185)}`); shown++; }
  }
  if (!shown) console.log("  (không dòng nào khớp)");
}

const js = "scripts/system-route.mjs";
const jsLines = readFileSync(js, "utf8").split("\n");
const jsStart = jsLines.findIndex((l) => l.includes('if (action === "create_po") {'));
console.log(`JS: create_po bắt đầu dòng ${jsStart + 1}`);
scan("JS · create_po", js, jsStart + 1, jsStart + 45);

const jf = "java-backend/application/src/main/java/com/vntech/erp/application/service/PurchaseManagementUseCase.java";
const jLines = readFileSync(jf, "utf8").split("\n");
const jStart = jLines.findIndex((l) => l.includes("createPo("));
console.log(`\nJAVA: createPo bắt đầu dòng ${jStart + 1}`);
scan("JAVA · createPo", jf, jStart + 1, jStart + 160);
