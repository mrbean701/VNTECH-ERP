// [PHASE 8 · B2/bước 3] CỔNG 3 CA cho `update_po_price`:
//  A. PO CHƯA hoàn thành ⇒ sửa được + đọc lại đúng giá mới
//  B. PO ĐÃ hoàn thành ⇒ BỊ CHẶN, giá KHÔNG đổi
//  C. DANH MỤC KHÔNG ĐỔI (CHECKSUM TABLE materials trước/sau phải giống hệt)
// An toàn: hoàn tác trong `finally`; không đụng bảng khác.
import { execFileSync } from "node:child_process";
const MYSQL = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
const q = (sql) => execFileSync(MYSQL, ["-uvntech", "-pvntech", "--default-character-set=utf8mb4", "-N", "-B", "vntech_erp", "-e", sql], { encoding: "utf8" }).trim();
const one = (sql) => q(sql).split(/\r?\n/)[0] || "";
const api = async (cookie, body) => { const r = await fetch("http://127.0.0.1:18081/api/system", { method: "POST", headers: { "content-type": "application/json", cookie }, body: JSON.stringify(body) }); return { status: r.status, text: await r.text() }; };

const row = one("SELECT CONCAT(po.id,'|',po.po_no,'|',po.status,'|',poi.id,'|',poi.unit_price) FROM purchase_orders po JOIN purchase_order_items poi ON poi.purchase_order_id=po.id WHERE po.status NOT IN ('completed','completed_with_shortage','completed_with_exceptions','cancelled') ORDER BY po.ordered_at DESC LIMIT 1;");
if (!row) { console.error("✖ Không có PO nào CHƯA hoàn thành để thử ⇒ DỪNG."); process.exit(1); }
const [poId, poNo, poStatus, itemId, oldPriceRaw] = row.split("|");
const oldPrice = Number(oldPriceRaw);
const newPrice = oldPrice + 1234.56;
console.log(`PO test: ${poNo} (${poId}) status='${poStatus}' · dòng ${itemId} · giá gốc=${oldPrice} · giá thử=${newPrice}`);

const results = [];
const check = (ok, label, ev) => { results.push(ok); console.log(`  [${ok ? "ĐẠT " : "HỎNG"}] ${label} :: ${ev}`); };
const catHash = () => one("CHECKSUM TABLE materials;").split(/\s+/).pop();
const catBefore = catHash();
console.log(`CHECKSUM TABLE materials TRƯỚC = ${catBefore}`);

const login = await fetch("http://127.0.0.1:18081/api/system", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "login", username: "admin", password: "Admin123456@" }) });
const cookie = (login.headers.getSetCookie ? login.headers.getSetCookie() : [login.headers.get("set-cookie")]).filter(Boolean).map((c) => c.split(";")[0]).join("; ");

try {
  // ---- CA A: chưa hoàn thành ⇒ sửa được
  const a = await api(cookie, { action: "update_po_price", purchaseOrderId: poId, lines: [{ purchaseOrderItemId: itemId, unitPrice: newPrice }] });
  console.log(`  CA A ⇒ HTTP ${a.status}: ${a.text.slice(0, 150)}`);
  check(a.status === 200 && a.text.includes('"ok":true'), "CA A: sửa giá khi PO CHƯA hoàn thành", `HTTP ${a.status}`);
  const priceAfterA = Number(one(`SELECT unit_price FROM purchase_order_items WHERE id='${itemId}';`));
  check(Math.abs(priceAfterA - newPrice) < 0.01, "CA A: ĐỌC LẠI thấy đúng giá mới", `${oldPrice} → ${priceAfterA} (mong đợi ${newPrice})`);

  // ---- CA B: đã hoàn thành ⇒ BỊ CHẶN
  q(`UPDATE purchase_orders SET status='completed' WHERE id='${poId}';`);
  const b = await api(cookie, { action: "update_po_price", purchaseOrderId: poId, lines: [{ purchaseOrderItemId: itemId, unitPrice: oldPrice + 9999 }] });
  console.log(`  CA B ⇒ HTTP ${b.status}: ${b.text.slice(0, 160)}`);
  check(b.status >= 400 && b.text.includes("hoàn thành"), "CA B: PO ĐÃ hoàn thành ⇒ BỊ CHẶN (nêu rõ lý do)", `HTTP ${b.status}`);
  const priceAfterB = Number(one(`SELECT unit_price FROM purchase_order_items WHERE id='${itemId}';`));
  check(Math.abs(priceAfterB - newPrice) < 0.01, "CA B: giá KHÔNG đổi khi bị chặn", `vẫn = ${priceAfterB}`);

  // ---- CA C: danh mục không đổi
  const catAfter = catHash();
  check(catAfter === catBefore, "CA C: DANH MỤC (`materials`) KHÔNG ĐỔI", `checksum ${catBefore} → ${catAfter}`);
} finally {
  q(`UPDATE purchase_orders SET status='${poStatus}' WHERE id='${poId}';`);
  q(`UPDATE purchase_order_items SET unit_price=${oldPrice} WHERE id='${itemId}';`);
  const st = one(`SELECT status FROM purchase_orders WHERE id='${poId}';`);
  const pr = Number(one(`SELECT unit_price FROM purchase_order_items WHERE id='${itemId}';`));
  console.log(`  HOÀN TÁC: PO status='${st}' (gốc '${poStatus}') · giá=${pr} (gốc ${oldPrice})`);
  check(st === poStatus && Math.abs(pr - oldPrice) < 0.01, "đã HOÀN TÁC về đúng gốc", `status='${st}', giá=${pr}`);
}
const bad = results.filter((r) => !r).length;
console.log(`\n=== CỔNG update_po_price: ${results.length - bad}/${results.length} ĐẠT · ${bad} HỎNG ===`);
process.exit(bad ? 1 : 0);
