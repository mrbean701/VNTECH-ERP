// [PHASE 8 · B1] Vá 3 tệp Java — BẢN 2: TỰ NHẬN kiểu xuống dòng (CRLF của repo) để mỏ neo nhiều dòng khớp được.
import { readFileSync, writeFileSync } from "node:fs";
const APPLY = process.argv.includes("--apply");
const PORT = "java-backend/application/src/main/java/com/vntech/erp/application/port/out/RequestStore.java";
const ADP = "java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/RequestStoreAdapter.java";
const CTL = "java-backend/web/src/main/java/com/vntech/erp/web/controller/SystemController.java";
const failures = [];
let port = readFileSync(PORT, "utf8"), adp = readFileSync(ADP, "utf8"), ctl = readFileSync(CTL, "utf8");
const NL = port.includes("\r\n") ? "\r\n" : "\n";
console.log("kiểu xuống dòng: " + (NL === "\r\n" ? "CRLF" : "LF"));
const patch = (which, label, find, repl) => {
  const src = which === "port" ? port : which === "adp" ? adp : ctl;
  const n = src.split(find).length - 1;
  if (n !== 1) { failures.push(`[${label}] khớp ${n} lần (cần 1) ⇒ DỪNG`); return; }
  if (which === "port") port = port.replace(find, repl);
  else if (which === "adp") adp = adp.replace(find, repl);
  else ctl = ctl.replace(find, repl);
};

if (!/RequestStore\s+requestStore/.test(ctl)) { console.error("✖ controller chưa có bean requestStore ⇒ chạy tools/_b1-tiem-requeststore.mjs trước."); process.exit(1); }

// 1) PORT — thêm method (mỏ neo KHÔNG kèm newline để tránh lệch CRLF)
patch("port", "port method", "public interface RequestStore {",
  "public interface RequestStore {" + NL + NL +
  "    /** [WF] PHASE 8 (B1) — CẢNH BÁO phê duyệt (KHÔNG chặn) cho một chứng từ theo (entityType, entityId). */" + NL +
  "    List<String> approvalWarnings(String entityType, String entityId);");

// 2) ADAPTER — cài đặt native SQL, trả MẢNG, KHÔNG ném lỗi
patch("adp", "adapter impl", "    private final JdbcTemplate jdbcTemplate;",
  "    private final JdbcTemplate jdbcTemplate;" + NL + NL +
  "    /** [WF] PHASE 8 (B1) — CHẾ ĐỘ CHỈ CẢNH BÁO: TRẢ MẢNG cảnh báo, TUYỆT ĐỐI KHÔNG ném lỗi. */" + NL +
  "    @Override" + NL +
  "    public List<String> approvalWarnings(String entityType, String entityId) {" + NL +
  "        if (entityType == null || entityType.isBlank() || entityId == null || entityId.isBlank()) return List.of();" + NL +
  "        try {" + NL +
  "            Map<String, Object> row = jdbcTemplate.queryForMap(" + NL +
  "                \"SELECT COUNT(*) AS total, COALESCE(SUM(CASE WHEN status='approved' THEN 1 ELSE 0 END),0) AS approved \" +" + NL +
  "                \"FROM approvals WHERE entity_type=? AND entity_id=?\", entityType, entityId);" + NL +
  "            long total = ((Number) row.getOrDefault(\"total\", 0)).longValue();" + NL +
  "            long approved = ((Number) row.getOrDefault(\"approved\", 0)).longValue();" + NL +
  "            if (total == 0) return List.of(entityType + \" \" + entityId + \": chưa có bản ghi phê duyệt nào (quy trình động chưa khởi tạo) — vẫn cho phép theo chế độ CHỈ CẢNH BÁO.\");" + NL +
  "            if (approved < total) return List.of(entityType + \" \" + entityId + \": còn \" + (total - approved) + \"/\" + total + \" bước CHƯA duyệt — vẫn cho phép theo chế độ CHỈ CẢNH BÁO.\");" + NL +
  "            return List.of();" + NL +
  "        } catch (RuntimeException ex) { return List.of(); }" + NL +
  "    }");

// 3) CONTROLLER — 2 case (create_po, issue_stock): dùng LinkedHashMap mới, KHÔNG put vào map gốc
const wrap = (call, type, idKey) =>
  "Map<String, Object> result = " + call + ";" + NL +
  "                    Map<String, Object> out = new java.util.LinkedHashMap<>(result);" + NL +
  "                    out.put(\"warnings\", requestStore.approvalWarnings(\"" + type + "\", String.valueOf(result.getOrDefault(\"" + idKey + "\", \"\"))));" + NL +
  "                    return ResponseEntity.ok(jsonResult(out));";
patch("ctl", "create_po", "Map<String, Object> result = purchaseManagementUseCase.createPo(asPurchasePrincipal(cu), payload);" + NL + "                    return ResponseEntity.ok(jsonResult(result));",
  wrap("purchaseManagementUseCase.createPo(asPurchasePrincipal(cu), payload)", "purchase_order", "poId"));
patch("ctl", "issue_stock", "Map<String, Object> result = stockManagementUseCase.issueStock(asStockPrincipal(cu), payload);" + NL + "                    return ResponseEntity.ok(jsonResult(result));",
  wrap("stockManagementUseCase.issueStock(asStockPrincipal(cu), payload)", "stock_issue", "issueId"));

if (failures.length) { console.error("KHÔNG GHI — có điều kiện không đạt:"); for (const f of failures) console.error("  ✖ " + f); process.exit(1); }
if (!APPLY) { console.log("CHẠY KHÔ: mỏ neo khớp đủ ⇒ sẵn sàng ghi (thêm --apply)."); process.exit(0); }
writeFileSync(PORT, port); writeFileSync(ADP, adp); writeFileSync(CTL, ctl);
console.log("ĐÃ GHI: port + adapter + controller (3 tệp).");
