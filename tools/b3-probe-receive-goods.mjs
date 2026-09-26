// [PHASE 8 · B3] PROBE `receive_goods` CÓ HOÀN TÁC: kiểm response có `warnings` (parity với JS) rồi KHÔI PHỤC mọi bảng bị ảnh hưởng.
// Bảng ảnh hưởng: goods_receipts · goods_receipt_items · purchase_orders · purchase_order_items · material_requests · supply_workflow_steps.
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
const MYSQL = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
const q = (sql) => execFileSync(MYSQL, ["-uvntech", "-pvntech", "--default-character-set=utf8mb4", "-N", "-B", "vntech_erp", "-e", sql], { encoding: "utf8" }).trim();
const one = (sql) => q(sql).split(/\r?\n/)[0] || "";

// 1) chọn PO + dòng còn lượng để nhận
const row = one(`SELECT CONCAT(po.id,'|',po.po_no,'|',po.status,'|',po.request_id,'|',poi.id,'|',poi.delivered_qty,'|',poi.received_qty,'|',poi.ordered_qty) FROM purchase_orders po JOIN purchase_order_items poi ON poi.purchase_order_id=po.id WHERE po.request_id IS NOT NULL AND po.status NOT IN ('completed','completed_with_shortage','completed_with_exceptions','cancelled') AND poi.ordered_qty > poi.delivered_qty + poi.closed_qty ORDER BY po.ordered_at DESC LIMIT 1;`);
if (!row) { console.error("✖ Không có PO/dòng nào còn lượng để nhận ⇒ DỪNG."); process.exit(1); }
const [poId, poNo, poStatus, mrId, itemId, dQty, rQty, oQty] = row.split("|");
const mrStatus = one(`SELECT COALESCE(status,'') FROM material_requests WHERE id='${mrId}';`);
console.log(`PO test: ${poNo} (${poId}) status='${poStatus}' · dòng ${itemId} ordered=${oQty} delivered=${dQty} received=${rQty} · MR '${mrStatus}'`);

const nGr = Number(one("SELECT COUNT(*) FROM goods_receipts;"));
const nGri = Number(one("SELECT COUNT(*) FROM goods_receipt_items;"));
const nSwf = Number(one("SELECT COUNT(*) FROM supply_workflow_steps;"));
console.log(`TRƯỚC: goods_receipts=${nGr} · goods_receipt_items=${nGri} · supply_workflow_steps=${nSwf}`);

const results = [];
const check = (ok, label, ev) => { results.push(ok); console.log(`  [${ok ? "ĐẠT " : "HỎNG"}] ${label} :: ${ev}`); };
let posted = false;

try {
  const login = await fetch("http://127.0.0.1:18081/api/system", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "login", username: "admin", password: "Admin123456@" }) });
  const cookie = (login.headers.getSetCookie ? login.headers.getSetCookie() : [login.headers.get("set-cookie")]).filter(Boolean).map((c) => c.split(";")[0]).join("; ");
  const res = await fetch("http://127.0.0.1:18081/api/system", { method: "POST", headers: { "content-type": "application/json", cookie }, body: JSON.stringify({ action: "receive_goods", purchaseOrderId: poId, certificateStatus: "complete", deliveryDocumentStatus: "complete", qcOk: true, lines: [{ purchaseOrderItemId: itemId, quantity: 1 }] }) });
  posted = res.status === 200;
  const text = await res.text();
  console.log(`  receive_goods ⇒ HTTP ${res.status}: ${text.slice(0, 220)}`);
  check(res.status === 200 && text.includes('"ok":true'), "receive_goods chạy được", `HTTP ${res.status}`);
  check(text.includes('"warnings"'), "**có trường `warnings`** (parity Java ⇄ JS)", text.includes('"warnings"') ? "CÓ" : "KHÔNG có");
  const nGr2 = Number(one("SELECT COUNT(*) FROM goods_receipts;"));
  check(nGr2 === nGr + 1, "tạo đúng 1 phiếu nhập mới", `goods_receipts ${nGr} → ${nGr2}`);
} catch (e) { check(false, "gọi API", String(e.message).slice(0, 120)); }
finally {
  // 2) HOÀN TÁC
  q(`DELETE FROM goods_receipt_items WHERE receipt_id IN (SELECT id FROM goods_receipts WHERE purchase_order_id='${poId}');`);
  q(`DELETE FROM goods_receipts WHERE purchase_order_id='${poId}';`);
  q(`UPDATE purchase_orders SET status='${poStatus}' WHERE id='${poId}';`);
  q(`UPDATE purchase_order_items SET delivered_qty=${Number(dQty)}, received_qty=${Number(rQty)} WHERE id='${itemId}';`);
  q(`UPDATE material_requests SET status='${mrStatus}' WHERE id='${mrId}';`);
  q(`DELETE FROM supply_workflow_steps WHERE request_id='${mrId}' AND id NOT IN (SELECT * FROM (SELECT id FROM supply_workflow_steps WHERE request_id='${mrId}' LIMIT ${nSwf}) t);`);
  const nGr3 = Number(one("SELECT COUNT(*) FROM goods_receipts;"));
  const nGri3 = Number(one("SELECT COUNT(*) FROM goods_receipt_items;"));
  const st3 = one(`SELECT COALESCE(status,'') FROM purchase_orders WHERE id='${poId}';`);
  const it3 = one(`SELECT CONCAT(delivered_qty,'|',received_qty) FROM purchase_order_items WHERE id='${itemId}';`);
  console.log(`  HOÀN TÁC: goods_receipts=${nGr3}(gốc ${nGr}) · items=${nGri3}(gốc ${nGri}) · PO='${st3}'(gốc '${poStatus}') · dòng=${it3}(gốc '${dQty}|${rQty}')`);
  check(nGr3 === nGr && nGri3 === nGri && st3 === poStatus && it3 === `${dQty}|${rQty}`, "đã HOÀN TÁC đủ 5 bảng", `receipts ${nGr3} · PO '${st3}' · dòng ${it3}`);
  writeFileSync("docs/agent-progress/TASK-094-b3-receive-goods-rollback.sql",
    `-- B3 rollback (chạy nếu probe bị dừng giữa chừng)\nDELETE FROM goods_receipt_items WHERE receipt_id IN (SELECT id FROM goods_receipts WHERE purchase_order_id='${poId}');\nDELETE FROM goods_receipts WHERE purchase_order_id='${poId}';\nUPDATE purchase_orders SET status='${poStatus}' WHERE id='${poId}';\nUPDATE purchase_order_items SET delivered_qty=${Number(dQty)}, received_qty=${Number(rQty)} WHERE id='${itemId}';\nUPDATE material_requests SET status='${mrStatus}' WHERE id='${mrId}';\n`);
}
const bad = results.filter((r) => !r).length;
console.log(`\n=== PROBE receive_goods: ${results.length - bad}/${results.length} ĐẠT · ${bad} HỎNG ===`);
process.exit(bad ? 1 : 0);
