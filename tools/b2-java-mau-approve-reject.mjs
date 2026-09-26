// [PHASE 8 · B2 · parity Java] Lấy MẪU để viết approvePo/rejectPo (Java) + kiểm Java có ghi thông báo không.
import { readFileSync } from "node:fs";
const showFn = (file, needle, n = 26, label = needle) => {
  console.log(`\n===== ${label} (${file.split(/[\\/]/).pop()}) =====`);
  try {
    const lines = readFileSync(file, "utf8").split("\n");
    const i = lines.findIndex((l) => l.includes(needle));
    if (i < 0) { console.log("  KHÔNG TÌM THẤY"); return; }
    for (let k = i; k < Math.min(i + n, lines.length); k++) {
      const t = (lines[k] || "").trim();
      if (t) console.log(`${k + 1}: ${t.slice(0, 180)}`);
    }
  } catch (e) { console.log("  lỗi đọc: " + e.message); }
};
const U = "java-backend/application/src/main/java/com/vntech/erp/application/service/PurchaseManagementUseCase.java";
showFn(U, "public Map<String, Object> closePoLine", 30, "closePoLine (mẫu cập nhật trạng thái PO)");
showFn("java-backend/web/src/main/java/com/vntech/erp/web/controller/SystemController.java", 'case "close_po_line"', 8, "case close_po_line (mẫu controller)");

console.log("\n===== Java có ghi THÔNG BÁO không? (grep toàn bộ java-backend) =====");
const { execFileSync } = await import("node:child_process");
try {
  const out = execFileSync("powershell", ["-NoProfile", "-Command",
    "Get-ChildItem java-backend -Recurse -Filter *.java | Select-String -Pattern 'task_notifications' | Select-Object -First 8 | ForEach-Object { $_.Path + ':' + $_.LineNumber + ': ' + $_.Line.Trim() }"],
    { encoding: "utf8" });
  console.log(out.trim() || "  (KHÔNG thấy task_notifications trong Java ⇒ phải tự thêm method ghi thông báo)");
} catch { console.log("  (không chạy được lệnh grep)"); }
