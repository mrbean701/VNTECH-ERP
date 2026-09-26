// [PHASE 8 · B2] NGUYÊN TỬ HOÁ: gộp 2 ghi (UPDATE PO + INSERT thông báo) vào MỘT method adapter `@Transactional`.
// Sửa theo DÒNG + kiểm cấu trúc trước khi ghi; bất kỳ điều kiện nào sai ⇒ KHÔNG ghi tệp nào.
import { readFileSync, writeFileSync } from "node:fs";
const APPLY = process.argv.includes("--apply");
const F = {
  port: "java-backend/application/src/main/java/com/vntech/erp/application/port/out/PurchaseStore.java",
  adp: "java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/PurchaseStoreAdapter.java",
  uc: "java-backend/application/src/main/java/com/vntech/erp/application/service/PurchaseManagementUseCase.java",
};
const raw = {}, L = {}, NL = {};
for (const k of Object.keys(F)) { raw[k] = readFileSync(F[k], "utf8"); NL[k] = raw[k].includes("\r\n") ? "\r\n" : "\n"; L[k] = raw[k].split(/\r?\n/); }
const fail = [];
const idx = (k, needle) => L[k].findIndex((l) => l.includes(needle));

// ---- 1) PORT: 2 khai báo (kèm chú thích) ⇒ 1 khai báo
const p1 = idx("port", "ghi QUYẾT ĐỊNH cho PO: approve");
const p2 = idx("port", "void insertTaskNotification(");
if (p1 < 0 || p2 < 0 || p2 < p1) fail.push(`[port] không thấy khối 2 method (p1=${p1 + 1}, p2=${p2 + 1})`);
else L.port.splice(p1, p2 - p1 + 1,
  "    /** [WF] PHASE 8 (B2) — QUYẾT ĐỊNH PO + (tuỳ chọn) thông báo người tạo, trong MỘT giao dịch (work_item_id = poId). */",
  "    void decidePo(String poId, String status, String reason, String userId, String notifyUserId,",
  "            String notifyTitle, String notifyBody, Instant now);");

// ---- 2) ADAPTER: thay cả 2 method bằng 1 method @Transactional
const a1 = idx("adp", "ghi quyết định cho PO (native SQL");
const aSig = idx("adp", "public void closePoLine(");
// tìm cặp annotation @Override + @Transactional ngay trước closePoLine (giữ nguyên, thuộc closePoLine)
let aKeep = -1;
for (let i = a1; i < aSig; i++) if (L.adp[i] !== undefined && L.adp[i].trim() === "@Override" && L.adp[i + 1] !== undefined && L.adp[i + 1].trim() === "@Transactional") { aKeep = i; break; }
if (a1 < 0 || aSig < 0 || aKeep < 0 || aKeep <= a1) fail.push(`[adapter] cấu trúc lạ (a1=${a1 + 1}, aKeep=${aKeep + 1}, aSig=${aSig + 1})`);
else L.adp.splice(a1, aKeep - a1,
  "/** [WF] PHASE 8 (B2) — QUYẾT ĐỊNH cho PO + (tuỳ chọn) thông báo cho người tạo, trong MỘT giao dịch. */",
  "@Override",
  "@Transactional",
  "public void decidePo(String poId, String status, String reason, String userId, String notifyUserId,",
  "        String notifyTitle, String notifyBody, Instant now) {",
  "    jdbcTemplate.update(",
  "        \"UPDATE purchase_orders SET status=?, decision_reason=?, decided_by=?, decided_at=?, updated_at=? WHERE id=?\",",
  "        status, reason, userId, now, now, poId);",
  "    if (notifyUserId != null && !notifyUserId.isBlank()) {",
  "        jdbcTemplate.update(",
  "            \"INSERT INTO task_notifications (id,work_item_id,user_id,channel,title,body,status,read_at,sent_at,last_error,created_at,updated_at) \" +",
  "            \"VALUES (?,?,?,?,?,?,?,?,?,?,?,?)\",",
  "            \"NTF_\" + java.util.UUID.randomUUID(), poId, notifyUserId, \"in_app\", notifyTitle, notifyBody, \"SENT\", null, now, null, now, now);",
  "    }",
  "}",
  "");

// ---- 3) USE-CASE: 1 lời gọi duy nhất
const u1 = idx("uc", "store.decidePo(poId, status, approve ? null : reason");
const uEnd = idx("uc", '"(không nêu)" : reason), now);');
if (u1 < 0 || uEnd < 0 || uEnd < u1) fail.push(`[use-case] không thấy khối gọi (u1=${u1 + 1}, uEnd=${uEnd + 1})`);
else {
  let close = -1;
  for (let i = uEnd + 1; i < uEnd + 4 && i < L.uc.length; i++) if (L.uc[i].trim() === "}") { close = i; break; }
  if (close < 0) fail.push("[use-case] không thấy dấu } đóng khối if");
  else L.uc.splice(u1, close - u1 + 1,
    "        String buyer = approve ? \"\" : sv(po, \"buyerUserId\");",
    "        if (!approve && buyer.isEmpty()) buyer = sv(po, \"requesterId\");",
    "        store.decidePo(poId, status, approve ? null : reason, principal.userId(),",
    "            buyer, \"PO \" + sv(po, \"poNo\") + \" đã bị hủy\",",
    "            \"PO \" + sv(po, \"poNo\") + \" đã bị từ chối — hãy tạo lại/xử lý lại. Lý do: \" + (reason.isEmpty() ? \"(không nêu)\" : reason), now);");
}

if (fail.length) { console.error("KHÔNG GHI — điều kiện không đạt:"); for (const f of fail) console.error("  ✖ " + f); process.exit(1); }
if (!APPLY) { console.log("CHẠY KHÔ: cả 3 tệp khớp cấu trúc ⇒ sẵn sàng ghi (thêm --apply)."); process.exit(0); }
for (const k of Object.keys(F)) writeFileSync(F[k], L[k].join(NL[k]));
console.log("ĐÃ GHI 3 tệp: port (1 method) + adapter (@Transactional gộp 2 ghi) + use-case (1 lời gọi).");
