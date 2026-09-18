// [PHASE 8 · B2/bước 3] JAVA: action `update_po_price` — sửa giá PO khi CHƯA hoàn thành; KHOÁ khi đã hoàn thành; KHÔNG ghi danh mục.
// Mỏ neo theo DÒNG + kiểm cấu trúc; sai điều kiện nào ⇒ KHÔNG ghi tệp nào.
import { readFileSync, writeFileSync } from "node:fs";
const APPLY = process.argv.includes("--apply");
const F = {
  port: "java-backend/application/src/main/java/com/vntech/erp/application/port/out/PurchaseStore.java",
  adp: "java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/PurchaseStoreAdapter.java",
  uc: "java-backend/application/src/main/java/com/vntech/erp/application/service/PurchaseManagementUseCase.java",
  ctl: "java-backend/web/src/main/java/com/vntech/erp/web/controller/SystemController.java",
};
const L = {}, NL = {};
for (const k of Object.keys(F)) { const t = readFileSync(F[k], "utf8"); NL[k] = t.includes("\r\n") ? "\r\n" : "\n"; L[k] = t.split(/\r?\n/); }
const fail = [];
const at = (k, needle) => L[k].findIndex((l) => l.includes(needle));

// 0) chống chèn trùng
for (const k of Object.keys(F)) if (L[k].some((l) => l.includes("updatePoItemPrice") || l.includes('"update_po_price"'))) fail.push(`[${k}] đã có update_po_price ⇒ DỪNG`);

// 1) PORT — thêm 1 method sau khối decidePo (dòng cuối khối: "String notifyTitle, String notifyBody, Instant now);")
const pEnd = at("port", "String notifyTitle, String notifyBody, Instant now);");
if (pEnd < 0) fail.push("[port] không thấy dòng cuối decidePo");
else L.port.splice(pEnd + 1, 0,
  "",
  "    /** [WF] PHASE 8 (B2/b3) — SỬA GIÁ một dòng PO (chỉ khi PO CHƯA hoàn thành; gọi trong 1 giao dịch). */",
  "    void updatePoItemPrice(String poId, String poItemId, double unitPrice, Instant now);");

// 2) ADAPTER — thêm method sau khi khối decidePo đóng (tìm dòng NTF rồi tới dấu } kế tiếp)
const aNtf = at("adp", '"NTF_" + java.util.UUID.randomUUID(), poId, notifyUserId');
let aClose = -1;
if (aNtf >= 0) for (let i = aNtf + 1; i < aNtf + 5; i++) if ((L.adp[i] || "").trim() === "}") { aClose = i; break; }
if (aNtf < 0 || aClose < 0) fail.push(`[adapter] không thấy điểm chèn sau decidePo (aNtf=${aNtf + 1}, aClose=${aClose + 1})`);
else L.adp.splice(aClose + 1, 0,
  "",
  "/** [WF] PHASE 8 (B2/b3) — cập nhật đơn giá 1 dòng PO; ràng buộc theo poId để KHÔNG sửa chéo sang PO khác. */",
  "@Override",
  "@Transactional",
  "public void updatePoItemPrice(String poId, String poItemId, double unitPrice, Instant now) {",
  "    jdbcTemplate.update(",
  "        \"UPDATE purchase_order_items SET unit_price=?, updated_at=? WHERE id=? AND purchase_order_id=?\",",
  "        unitPrice, now, poItemId, poId);",
  "}");

// 3) USE-CASE — thêm method trước khối receive_goods
const uAnchor = at("uc", "/** receive_goods — ghi nhận giao hàng, chưa posting (chờ BCH xác nhận). */");
if (uAnchor < 0) fail.push("[use-case] không thấy mỏ neo receive_goods");
else L.uc.splice(uAnchor, 0,
  "/** [WF] PHASE 8 (B2/b3) — update_po_price: người có quyền sửa PO được sửa ĐƠN GIÁ; KHOÁ khi PO đã hoàn thành. */",
  "public Map<String, Object> updatePoPrice(Principal principal, Map<String, Object> payload) {",
  "    rbac.requireRole(principalAsCurrent(principal), List.of(\"procurement\", \"accountant\", \"admin\"));",
  "    String poId = trim(payload.get(\"purchaseOrderId\"));",
  "    Map<String, Object> po = store.findPoForReceiving(poId)",
  "        .orElseThrow(() -> Api(\"PO không tồn tại.\"));",
  "    String status = sv(po, \"status\");",
  "    if (COMPLETED_PO_STATUSES.contains(status)) {",
  "        throw Api(\"PO đã hoàn thành (\" + status + \") — không được sửa giá.\");",
  "    }",
  "    accessScope.requireProjectAccess(principal.userId(), principal.role(), sv(po, \"projectId\"), true,",
  "        \"Tài khoản không có quyền sửa PO tại dự án này.\");",
  "    List<?> lines = payload.get(\"lines\") instanceof List<?> l ? l : List.of();",
  "    if (lines.isEmpty()) throw Api(\"Chưa chọn dòng PO nào để sửa giá.\");",
  "    Instant now = Instant.now();",
  "    int changed = 0;",
  "    for (Object raw : lines) {",
  "        if (!(raw instanceof Map<?, ?> line)) continue;",
  "        String itemId = trim(line.get(\"purchaseOrderItemId\"));",
  "        double price = strictNonNegative(line.get(\"unitPrice\"), \"Đơn giá PO\");",
  "        if (itemId.isEmpty()) throw Api(\"Thiếu mã dòng PO.\");",
  "        store.updatePoItemPrice(poId, itemId, price, now);",
  "        changed++;",
  "    }",
  "    return Map.of(\"message\", \"Đã cập nhật đơn giá \" + changed + \" dòng của PO \" + sv(po, \"poNo\")",
  "        + \"; danh mục vật tư KHÔNG thay đổi.\");",
  "}",
  "",
  "/** Nhóm trạng thái PO ĐÃ HOÀN THÀNH ⇒ KHOÁ sửa giá (theo yêu cầu nghiệp vụ). */",
  "private static final List<String> COMPLETED_PO_STATUSES = List.of(",
  "    \"completed\", \"completed_with_shortage\", \"completed_with_exceptions\", \"cancelled\");",
  "");

// 4) CONTROLLER — thêm case trước close_po_line
const cAnchor = at("ctl", 'case "close_po_line" -> {');
if (cAnchor < 0) fail.push("[controller] không thấy mỏ neo close_po_line");
else L.ctl.splice(cAnchor, 0,
  'case "update_po_price" -> {',
  "    AuthUseCase.CurrentUser cu = requireCurrentUser(request);",
  "    Map<String, Object> result = purchaseManagementUseCase.updatePoPrice(asPurchasePrincipal(cu), payload);",
  "    return ResponseEntity.ok(jsonResult(result));",
  "}");

if (fail.length) { console.error("KHÔNG GHI — điều kiện không đạt:"); for (const f of fail) console.error("  ✖ " + f); process.exit(1); }
if (!APPLY) { console.log("CHẠY KHÔ: 4 tệp khớp cấu trúc ⇒ sẵn sàng ghi (thêm --apply)."); process.exit(0); }
for (const k of Object.keys(F)) writeFileSync(F[k], L[k].join(NL[k]));
console.log("ĐÃ GHI 4 tệp Java: port + adapter + use-case + controller (action update_po_price).");
