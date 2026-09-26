// [PHASE 0B · S-05] Đọc thân FileController (từ dòng 48) + đánh dấu method nào CÓ/KHÔNG dùng authUseCase.
import { readFileSync } from "node:fs";
const F = "java-backend/web/src/main/java/com/vntech/erp/web/controller/FileController.java";
const lines = readFileSync(F, "utf8").split("\n");
const map = /@(Get|Post|Delete)Mapping|public\s+ResponseEntity|authUseCase|requireCurrentUser|Optional<AuthUseCase|currentUser|tenant|canAccess|zip|admin/i;
for (let i = 47; i < lines.length; i++) {
  const t = (lines[i] || "").trim();
  if (t && map.test(t)) console.log(`${i + 1}: ${t.slice(0, 175)}`);
}
console.log("\n=== tổng số lần dùng authUseCase trong tệp ===");
const all = lines.join("\n");
console.log("  authUseCase: " + (all.match(/authUseCase/g) || []).length + " lần");
console.log("  requireCurrentUser: " + (all.match(/requireCurrentUser/g) || []).length + " lần");
console.log("  @GetMapping: " + (all.match(/@GetMapping/g) || []).length + " · @PostMapping: " + (all.match(/@PostMapping/g) || []).length + " · @DeleteMapping: " + (all.match(/@DeleteMapping/g) || []).length);
