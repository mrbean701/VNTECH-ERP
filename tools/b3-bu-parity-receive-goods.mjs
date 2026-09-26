// [PHASE 8 · B3] Bù parity: `receive_goods` (Java) phát `warnings` như JS.
// ① use-case: trả thêm `receiptId`  ② controller: gắn warnings("goods_receipt", receiptId). Mỏ neo theo DÒNG + tự chối.
import { readFileSync, writeFileSync } from "node:fs";
const APPLY = process.argv.includes("--apply");
const UC = "java-backend/application/src/main/java/com/vntech/erp/application/service/PurchaseManagementUseCase.java";
const CTL = "java-backend/web/src/main/java/com/vntech/erp/web/controller/SystemController.java";
const fail = [];
const uc = readFileSync(UC, "utf8"); const ucNL = uc.includes("\r\n") ? "\r\n" : "\n"; const U = uc.split(/\r?\n/);
const ct = readFileSync(CTL, "utf8"); const ctNL = ct.includes("\r\n") ? "\r\n" : "\n"; const C = ct.split(/\r?\n/);

// chống trùng
if (uc.includes('out.put("receiptId"')) fail.push("[use-case] đã có receiptId ⇒ DỪNG");
if (ct.includes('approvalWarnings("goods_receipt"')) fail.push("[controller] đã có goods_receipt ⇒ DỪNG");

// ① USE-CASE: thay dòng return của receiveGoods
const i = U.findIndex((l) => l.includes('return Map.of("message", receiptNo'));
if (i < 0) fail.push("[use-case] không thấy dòng return của receiveGoods");
else {
  const ind = (U[i].match(/^\s*/) || [""])[0];
  U[i] = ind + "Map<String, Object> recvOut = new java.util.LinkedHashMap<>();" + ucNL +
         ind + "recvOut.put(\"message\", receiptNo + \" đã ghi nhận giao hàng; đơn chuyển sang chờ BCH kiểm tra ảnh và xác nhận.\");" + ucNL +
         ind + "recvOut.put(\"receiptId\", receiptId);" + ucNL +
         ind + "return recvOut;";
}

// ② CONTROLLER: chèn warnings trước return của case receive_goods
const j = C.findIndex((l) => l.trim() === 'case "receive_goods" -> {');
if (j < 0) fail.push("[controller] không thấy case receive_goods");
else {
  let k = -1;
  for (let x = j; x < j + 10 && x < C.length; x++) if (C[x].includes("return ResponseEntity.ok(")) { k = x; break; }
  if (k < 0) fail.push("[controller] không thấy return trong case receive_goods");
  else {
    const ind = (C[k].match(/^\s*/) || [""])[0];
    C.splice(k, 0,
      ind + "Map<String, Object> recvResult = new java.util.LinkedHashMap<>(result);",
      ind + "recvResult.put(\"warnings\", requestStore.approvalWarnings(\"goods_receipt\", String.valueOf(result.getOrDefault(\"receiptId\", \"\"))));",
      ind + "return ResponseEntity.ok(jsonResult(recvResult));");
    C.splice(k + 3, 1); // bỏ dòng return cũ
  }
}

if (fail.length) { console.error("KHÔNG GHI — điều kiện không đạt:"); for (const f of fail) console.error("  ✖ " + f); process.exit(1); }
if (!APPLY) { console.log("CHẠY KHÔ: 2 mỏ neo khớp ⇒ sẵn sàng ghi (thêm --apply)."); process.exit(0); }
writeFileSync(UC, U.join(ucNL)); writeFileSync(CTL, C.join(ctNL));
console.log("ĐÃ GHI: use-case (trả receiptId) + controller (warnings goods_receipt).");
