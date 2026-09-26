// [PHASE 8 · B2 · parity Java] Vá 4 tệp: PurchaseStore (port) + PurchaseStoreAdapter + PurchaseManagementUseCase + SystemController.
// An toàn: MỎ NEO + TỰ CHỐI; nếu bất kỳ mỏ neo nào không khớp đúng 1 lần thì KHÔNG ghi tệp nào.
import { readFileSync, writeFileSync } from "node:fs";
const APPLY = process.argv.includes("--apply");
const F = {
  port: "java-backend/application/src/main/java/com/vntech/erp/application/port/out/PurchaseStore.java",
  adp: "java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/PurchaseStoreAdapter.java",
  uc: "java-backend/application/src/main/java/com/vntech/erp/application/service/PurchaseManagementUseCase.java",
  ctl: "java-backend/web/src/main/java/com/vntech/erp/web/controller/SystemController.java",
};
const src = {}; for (const k of Object.keys(F)) src[k] = readFileSync(F[k], "utf8");
const NL = src.port.includes("\r\n") ? "\r\n" : "\n";
const failures = [];
const insertBefore = (key, anchor, text, label) => {
  const n = src[key].split(anchor).length - 1;
  if (n !== 1) { failures.push(`[${label}] mỏ neo khớp ${n} lần (cần 1) ⇒ DỪNG`); return; }
  src[key] = src[key].replace(anchor, text.split("\n").join(NL) + anchor);
};
const insertAfter = (key, anchor, text, label) => {
  const n = src[key].split(anchor).length - 1;
  if (n !== 1) { failures.push(`[${label}] mỏ neo khớp ${n} lần (cần 1) ⇒ DỪNG`); return; }
  src[key] = src[key].replace(anchor, anchor + NL + text.split("\n").join(NL));
};
const has = (key, s) => src[key].includes(s);
if (has("port", "decidePo")) failures.push("[port] đã có decidePo ⇒ DỪNG (tránh chèn trùng)");

// 1) PORT — thêm 2 method sau closePoLine
insertAfter("port", "void closePoLine(String poItemId, double shortage, String reason, String userId, Instant now);", [
  "",
  "    /** [WF] PHASE 8 (B2) — ghi QUYẾT ĐỊNH cho PO: approve ⇒ waiting_delivery; reject ⇒ cancelled + lý do/người quyết/thời điểm. */",
  "    void decidePo(String poId, String status, String reason, String userId, Instant now);",
  "",
  "    /** [WF] PHASE 8 (B2) — thông báo trong ứng dụng cho người tạo PO (bảng task_notifications). */",
  "    void insertTaskNotification(String userId, String title, String body, Instant now);",
].join("\n"), "port");

// 2) ADAPTER — cài đặt 2 method, chèn TRƯỚC closePoLine
insertBefore("adp", "public void closePoLine(", [
  "/** [WF] PHASE 8 (B2) — ghi quyết định cho PO (native SQL, cùng khuôn các method khác của adapter). */",
  "@Override",
  "public void decidePo(String poId, String status, String reason, String userId, Instant now) {",
  "    jdbcTemplate.update(",
  "        \"UPDATE purchase_orders SET status=?, decision_reason=?, decided_by=?, decided_at=?, updated_at=? WHERE id=?\",",
  "        status, reason, userId, now, now, poId);",
  "}",
  "",
  "/** [WF] PHASE 8 (B2) — thông báo trong ứng dụng (12 cột task_notifications; ghi thẳng, không phụ thuộc use-case khác). */",
  "@Override",
  "public void insertTaskNotification(String userId, String title, String body, Instant now) {",
  "    jdbcTemplate.update(",
  "        \"INSERT INTO task_notifications (id,work_item_id,user_id,channel,title,body,status,read_at,sent_at,last_error,created_at,updated_at) \" +",
  "        \"VALUES (?,?,?,?,?,?,?,?,?,?,?,?)\",",
  "        \"NTF_\" + java.util.UUID.randomUUID(), null, userId, \"in_app\", title, body, \"sent\", null, now, null, now, now);",
  "}",
  "",
].join("\n"), "adapter");

// 3) USE-CASE — thêm approvePo/rejectPo trước khối receive_goods
insertBefore("uc", "/** receive_goods — ghi nhận giao hàng, chưa posting (chờ BCH xác nhận). */", [
  "/** [WF] PHASE 8 (B2) — approve_po: PO đang pending_approval ⇒ waiting_delivery (nối luồng giao hàng sẵn có). */",
  "public Map<String, Object> approvePo(Principal principal, Map<String, Object> payload) {",
  "    return decidePo(principal, payload, true);",
  "}",
  "",
  "/** [WF] PHASE 8 (B2) — reject_po: PO ⇒ cancelled + lý do; **PR KHÔNG đổi**; THÔNG BÁO cho người tạo PO. */",
  "public Map<String, Object> rejectPo(Principal principal, Map<String, Object> payload) {",
  "    return decidePo(principal, payload, false);",
  "}",
  "",
  "private Map<String, Object> decidePo(Principal principal, Map<String, Object> payload, boolean approve) {",
  "    rbac.requireRole(principalAsCurrent(principal), List.of(\"procurement\", \"accountant\", \"admin\"));",
  "    String poId = trim(payload.get(\"purchaseOrderId\"));",
  "    String reason = trim(payload.get(\"reason\"));",
  "    Map<String, Object> po = store.findPoForReceiving(poId)",
  "        .orElseThrow(() -> Api(\"PO không tồn tại hoặc đã xử lý.\"));",
  "    if (!\"pending_approval\".equals(sv(po, \"status\"))) throw Api(\"PO không tồn tại hoặc đã xử lý.\");",
  "    accessScope.requireProjectAccess(principal.userId(), principal.role(), sv(po, \"projectId\"), true,",
  "        \"Tài khoản không có quyền duyệt PO tại dự án này.\");",
  "    Instant now = Instant.now();",
  "    String status = approve ? \"waiting_delivery\" : \"cancelled\";",
  "    store.decidePo(poId, status, approve ? null : reason, principal.userId(), now);",
  "    if (!approve) {",
  "        String buyer = sv(po, \"buyerUserId\");",
  "        if (!buyer.isEmpty()) store.insertTaskNotification(buyer, \"PO \" + sv(po, \"poNo\") + \" đã bị hủy\",",
  "            \"PO \" + sv(po, \"poNo\") + \" đã bị từ chối — hãy tạo lại/xử lý lại. Lý do: \" + (reason.isEmpty() ? \"(không nêu)\" : reason), now);",
  "    }",
  "    return Map.of(\"message\", approve",
  "        ? \"Đã duyệt PO \" + sv(po, \"poNo\") + \"; chuyển sang chờ giao hàng.\"",
  "        : \"Đã từ chối PO \" + sv(po, \"poNo\") + \"; PR vẫn mở để xử lý lại.\");",
  "}",
  "",
].join("\n"), "use-case");

// 4) CONTROLLER — thêm 2 case trước close_po_line
insertBefore("ctl", 'case "close_po_line" -> {', [
  'case "approve_po" -> {',
  "    AuthUseCase.CurrentUser cu = requireCurrentUser(request);",
  "    Map<String, Object> result = purchaseManagementUseCase.approvePo(asPurchasePrincipal(cu), payload);",
  "    return ResponseEntity.ok(jsonResult(result));",
  "}",
  'case "reject_po" -> {',
  "    AuthUseCase.CurrentUser cu = requireCurrentUser(request);",
  "    Map<String, Object> result = purchaseManagementUseCase.rejectPo(asPurchasePrincipal(cu), payload);",
  "    return ResponseEntity.ok(jsonResult(result));",
  "}",
].join("\n"), "controller");

if (failures.length) { console.error("KHÔNG GHI — có điều kiện không đạt:"); for (const f of failures) console.error("  ✖ " + f); process.exit(1); }
if (!APPLY) { console.log("CHẠY KHÔ: 4 mỏ neo khớp ⇒ sẵn sàng ghi (thêm --apply)."); process.exit(0); }
for (const k of Object.keys(F)) writeFileSync(F[k], src[k]);
console.log("ĐÃ GHI 4 tệp Java (port + adapter + use-case + controller).");
