// [PHASE 8 · B1] Vá 3 tệp Java cho parity `approvalWarnings()` — mỏ neo + TỰ CHỐI.
// An toàn: nếu `SystemController` KHÔNG có sẵn bean `RequestStore` thì DỪNG và in đúng chỗ cần sửa (không đoán constructor).
import { readFileSync, writeFileSync } from "node:fs";
const APPLY = process.argv.includes("--apply");
const PORT = "java-backend/application/src/main/java/com/vntech/erp/application/port/out/RequestStore.java";
const ADP = "java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/RequestStoreAdapter.java";
const CTL = "java-backend/web/src/main/java/com/vntech/erp/web/controller/SystemController.java";
const failures = [];
let port = readFileSync(PORT, "utf8"), adp = readFileSync(ADP, "utf8"), ctl = readFileSync(CTL, "utf8");
const patch = (which, label, find, repl) => {
  const src = which === "port" ? port : which === "adp" ? adp : ctl;
  const n = src.split(find).length - 1;
  if (n !== 1) { failures.push(`[${label}] khớp ${n} lần (cần 1) ⇒ DỪNG`); return; }
  if (which === "port") port = port.replace(find, repl);
  else if (which === "adp") adp = adp.replace(find, repl);
  else ctl = ctl.replace(find, repl);
};

// 1) Kiểm tra bean RequestStore trong controller (BẮT BUỘC trước khi vá)
const ctlHasStore = /RequestStore\s+\w+/.test(ctl);
console.log("SystemController có sẵn bean RequestStore? " + (ctlHasStore ? "CÓ" : "KHÔNG"));
if (!ctlHasStore) {
  const ctor = ctl.split("\n").findIndex((l) => l.includes("public SystemController("));
  console.log("constructor ở dòng ~" + (ctor + 1) + " ⇒ vòng sau cần thêm tham số RequestStore vào constructor + field.");
  process.exit(2);
}
const storeField = ctl.match(/RequestStore\s+(\w+)/)[1];
console.log("tên field: " + storeField);

// 2) Port: thêm method
patch("port", "port method", "public interface RequestStore {\n", "public interface RequestStore {\n\n    /** [WF] CẢNH BÁO phê duyệt (KHÔNG chặn) cho một chứng từ theo (entityType, entityId). */\n    List<String> approvalWarnings(String entityType, String entityId);\n");

// 3) Adapter: cài đặt (native SQL, trả MẢNG, KHÔNG ném lỗi)
patch("adp", "adapter impl", "    private final JdbcTemplate jdbcTemplate;\n",
  "    private final JdbcTemplate jdbcTemplate;\n\n    /** [WF] PHASE 8 — CẢNH BÁO phê duyệt: trả MẢNG cảnh báo, TUYỆT ĐỐI KHÔNG ném lỗi (chế độ CHỈ CẢNH BÁO). */\n" +
  "    @Override\n" +
  "    public List<String> approvalWarnings(String entityType, String entityId) {\n" +
  "        if (entityType == null || entityType.isBlank() || entityId == null || entityId.isBlank()) return List.of();\n" +
  "        try {\n" +
  "            Map<String, Object> row = jdbcTemplate.queryForMap(\n" +
  "                \"SELECT COUNT(*) AS total, COALESCE(SUM(CASE WHEN status='approved' THEN 1 ELSE 0 END),0) AS approved \" +\n" +
  "                \"FROM approvals WHERE entity_type=? AND entity_id=?\", entityType, entityId);\n" +
  "            long total = ((Number) row.getOrDefault(\"total\", 0)).longValue();\n" +
  "            long approved = ((Number) row.getOrDefault(\"approved\", 0)).longValue();\n" +
  "            if (total == 0) return List.of(entityType + \" \" + entityId + \": chưa có bản ghi phê duyệt nào (quy trình động chưa khởi tạo) — vẫn cho phép theo chế độ CHỈ CẢNH BÁO.\");\n" +
  "            if (approved < total) return List.of(entityType + \" \" + entityId + \": còn \" + (total - approved) + \"/\" + total + \" bước CHƯA duyệt — vẫn cho phép theo chế độ CHỈ CẢNH BÁO.\");\n" +
  "            return List.of();\n" +
  "        } catch (RuntimeException ex) { return List.of(); }\n" +
  "    }\n");

// 4) Controller: thêm warnings vào kết quả của 3 action (KHÔNG put vào map gốc)
const wrap = (call, idExpr) =>
  "                    Map<String, Object> result = " + call + ";\n" +
  "                    Map<String, Object> out = new java.util.LinkedHashMap<>(result);\n" +
  "                    out.put(\"warnings\", " + storeField + ".approvalWarnings(\"" + idExpr[0] + "\", String.valueOf(result.getOrDefault(\"" + idExpr[1] + "\", \"\"))));\n" +
  "                    return ResponseEntity.ok(jsonResult(out));";
patch("ctl", "create_po", 'Map<String, Object> result = purchaseManagementUseCase.createPo(asPurchasePrincipal(cu), payload);\n                    return ResponseEntity.ok(jsonResult(result));', wrap("purchaseManagementUseCase.createPo(asPurchasePrincipal(cu), payload)", ["purchase_order", "poId"]));
patch("ctl", "issue_stock", 'Map<String, Object> result = stockManagementUseCase.issueStock(asStockPrincipal(cu), payload);\n                    return ResponseEntity.ok(jsonResult(result));', wrap("stockManagementUseCase.issueStock(asStockPrincipal(cu), payload)", ["stock_issue", "issueId"]));

if (failures.length) { console.error("KHÔNG GHI — có điều kiện không đạt:"); for (const f of failures) console.error("  ✖ " + f); process.exit(1); }
if (!APPLY) { console.log("CHẠY KHÔ: mỏ neo khớp đủ ⇒ sẵn sàng ghi (thêm --apply)."); process.exit(0); }
writeFileSync(PORT, port); writeFileSync(ADP, adp); writeFileSync(CTL, ctl);
console.log("ĐÃ GHI: port + adapter + controller (3 tệp).");
