// [PHASE 8 · B2] SỬA LỖI: bổ sung `buyer_user_id` vào SQL findPoForReceiving + dự phòng `requested_by` (không thất bại im lặng).
// Mỏ neo + TỰ CHỐI: nếu bất kỳ mỏ neo nào không khớp đúng 1 lần thì KHÔNG ghi tệp nào.
import { readFileSync, writeFileSync } from "node:fs";
const APPLY = process.argv.includes("--apply");
const ADP = "java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/PurchaseStoreAdapter.java";
const UC = "java-backend/application/src/main/java/com/vntech/erp/application/service/PurchaseManagementUseCase.java";
let adp = readFileSync(ADP, "utf8"), uc = readFileSync(UC, "utf8");
const failures = [];
const rep = (which, text, from, to, label) => {
  const n = text.split(from).length - 1;
  if (n !== 1) { failures.push(`[${label}] mỏ neo khớp ${n} lần (cần 1) ⇒ DỪNG`); return text; }
  return text.replace(from, to);
};

// 1) SQL: thêm 2 cột người nhận (buyer_user_id của PO + requested_by của MR làm dự phòng)
if (!adp.includes("buyer_user_id AS buyerUserId")) {
  adp = rep("adp", adp,
    "po.receiving_warehouse_id AS warehouseId,po.status,po.eta,",
    "po.receiving_warehouse_id AS warehouseId,po.status,po.eta,\npo.buyer_user_id AS buyerUserId,mr.requested_by AS requesterId,",
    "adapter SQL");
} else failures.push("[adapter] đã có buyerUserId ⇒ DỪNG (tránh sửa trùng)");

// 2) Use-case: dự phòng người nhận để KHÔNG thất bại im lặng
if (!uc.includes('buyer = sv(po, "requesterId")')) {
  uc = rep("uc", uc,
    'String buyer = sv(po, "buyerUserId");',
    'String buyer = sv(po, "buyerUserId");\nif (buyer.isEmpty()) buyer = sv(po, "requesterId");',
    "use-case fallback");
} else failures.push("[use-case] đã có fallback ⇒ DỪNG (tránh sửa trùng)");

if (failures.length) { console.error("KHÔNG GHI — có điều kiện không đạt:"); for (const f of failures) console.error("  ✖ " + f); process.exit(1); }
if (!APPLY) { console.log("CHẠY KHÔ: 2 mỏ neo khớp ⇒ sẵn sàng ghi (thêm --apply)."); process.exit(0); }
writeFileSync(ADP, adp); writeFileSync(UC, uc);
console.log("ĐÃ GHI: adapter (thêm buyerUserId + requesterId) + use-case (dự phòng người nhận).");
