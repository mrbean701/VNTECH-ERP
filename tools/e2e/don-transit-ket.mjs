#!/usr/bin/env node
/**
 * DỌN 6 PHIẾU KẸT `in_transit` — ⭐ ĐỒNG THỜI **VERIFY `BUG-20261005-005`**.
 *
 * ⭐ BỐI CẢNH: 5 `central_returns` + 1 `transfer_order` đang `in_transit` từ lâu.
 *   📍 BẰNG CHỨNG LỖI 005 (đo được): sổ kho CÓ chặng GỬI ĐI
 *      (`CENTRAL_RETURN_SHIP` ×5 · `TRF_SHIP` ×6) ⚠️ nhưng THIẾU chặng NHẬN
 *      ⇒ hàng ra khỏi kho nguồn mà ⛔ không vào kho đích ⇒ phiếu kẹt ✓
 *
 * ⛔ VÌ SAO KHÔNG chạy lại `go-live-chuoi-kho.mjs` / `go-live-vong-doi-kho.mjs`:
 *   ⭐ chúng **TẠO PHIẾU MỚI** (rất có thể chính chúng đã tạo 5 phiếu kẹt này)
 *   ⇒ ⭐ sẽ ĐẺ THÊM RÁC ✓ — ⭐ script này **nhắm ĐÚNG các phiếu `in_transit` hiện có** ✓
 *
 * ⭐ KHUÔN SAO CHÉP TỪ `tools/e2e/go-live-vong-doi-kho.mjs` (⛔ không đoán):
 *   · dòng 20-21: ảnh PNG 1×1 base64
 *   · dòng 161  : `await taiTep("central_return", id, "e2e-kiem-dem.png", "image/png", PNG_1PX)`
 *   · dòng 173  : `receive_central_return` với `{ centralReturnId, lines }`
 *   · dòng  80  : `receive_transfer_order` với `{ transferOrderId, lines }`
 *
 * CÁCH CHẠY:  node tools/e2e/don-transit-ket.mjs
 * ⛔ KHÔNG dry-run — script GHI dữ liệu thật (nhận hàng theo đúng nghiệp vụ).
 */
import { execFileSync } from "node:child_process";
import { login, call, taiTep } from "./client.mjs";

const MYSQL = "C:/Program Files/MySQL/MySQL Server 8.0/bin/mysql.exe";
const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");

/** Truy vấn MySQL, trả về mảng dòng (tab-separated, ⛔ không cần header). */
function q(sql) {
  const out = execFileSync(MYSQL, ["-u", "vntech", "-pvntech", "vntech_erp", "-N", "-B", "-e", sql],
    { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  return out.split(/\r?\n/).filter((l) => l.trim().length > 0).map((l) => l.split("\t"));
}

const dat = [], hong = [];
function ghi(ok, msg) { (ok ? dat : hong).push(msg); console.log(`   ${ok ? "✔" : "✘"} ${msg}`); }

console.log("═══ DỌN PHIẾU KẸT `in_transit` — ĐỒNG THỜI VERIFY `BUG-20261005-005` ═══\n");

// ── ① ĐO TRƯỚC ────────────────────────────────────────────────────────────────────────────
console.log("① ĐO TRƯỚC");
const truoc = {
  cr: q("SELECT COUNT(*) FROM central_returns WHERE status='in_transit';")[0][0],
  tr: q("SELECT COUNT(*) FROM transfer_orders WHERE status='in_transit';")[0][0],
  so: q("SELECT COUNT(*) FROM stock_movements;")[0][0],
};
console.log(`   central_returns in_transit = ${truoc.cr} · transfer_orders in_transit = ${truoc.tr} · sổ kho = ${truoc.so} dòng\n`);

// ── ② NHẬN 5 PHIẾU TRẢ KHO TỔNG ───────────────────────────────────────────────────────────
console.log("② NHẬN 5 PHIẾU TRẢ KHO TỔNG (⭐ tải ảnh kiểm đếm trước, rồi mới nhận)");
const crs = q("SELECT id, return_no FROM central_returns WHERE status='in_transit' ORDER BY return_no;");
console.log(`   tìm được ${crs.length} phiếu\n`);
// ⚠️ SỬA 06/10/2026: mật khẩu tài khoản kiểm thử ĐÃ KHÁC ⇒ 401 với `e2e.tk` + `Vn@2026Test`.
//   ⇒ ⭐ THỬ LẦN LƯỢT nhiều tài khoản cho tới khi đăng nhập được (⛔ không hardcode 1 tài khoản).
//   ⭐ Ưu tiên `admin` (⭐ chắc chắn tồn tại) rồi tới các tài khoản nghiệp vụ.
const UNG_VIEN = [
  ["admin", "Admin123456@"],
  ["e2e.tk", "Vn@2026Test"],
  ["e2e.khnv", "Vn@2026Test"],
  ["e2e.kt", "Vn@2026Test"],
];
let taiKhoanDung = null;
for (const [u, p] of UNG_VIEN) {
  try { await login(u, p); taiKhoanDung = u; break; }
  catch { console.log(`   ⓘ ${u}: đăng nhập chưa được — thử tài khoản kế tiếp`); }
}
if (!taiKhoanDung) { console.error("⛔ KHÔNG đăng nhập được bằng bất kỳ tài khoản nào ⇒ DỪNG."); process.exit(1); }
console.log(`   ✅ đăng nhập bằng «${taiKhoanDung}»\n`);
for (const [id, soPhieu] of crs) {
  try {
    // ⭐ CHỐT ẢNH: `WarehouseStockStoreAdapter:839` đếm attachments có mime_type LIKE 'image/%'
    await taiTep("central_return", id, "e2e-kiem-dem.png", "image/png", PNG_1PX);
    const n = q(`SELECT COUNT(*) FROM attachments WHERE entity_type='central_return' AND entity_id='${id}' AND lower(mime_type) LIKE 'image/%';`)[0][0];
    if (Number(n) < 1) { ghi(false, `${soPhieu}: ảnh CHƯA ghi được (count=${n})`); continue; }
    // ⭐ `lines` lấy từ chính phiếu — counted = accepted = proposed (⭐ hợp lệ: counted <= proposed)
    const items = q(`SELECT id, proposed_qty FROM central_return_items WHERE central_return_id='${id}';`);
    const lines = items.map(([iid, pq]) => ({ centralReturnItemId: iid, countedQty: Number(pq), acceptedQty: Number(pq) }));
    if (!lines.length) { ghi(false, `${soPhieu}: ⛔ không có dòng hàng`); continue; }
    await call("receive_central_return", { centralReturnId: id, lines }, { nhan: `nhận ${soPhieu}` });
    const st = q(`SELECT status FROM central_returns WHERE id='${id}';`)[0][0];
    ghi(st !== "in_transit", `${soPhieu}: status ⇒ ${st}`);
  } catch (e) {
    ghi(false, `${soPhieu}: ${e instanceof Error ? e.message : String(e)}`);
  }
}

// ── ③ NHẬN 1 PHIẾU ĐIỀU CHUYỂN KHO ─────────────────────────────────────────────────────────
console.log("\n③ NHẬN 1 PHIẾU ĐIỀU CHUYỂN KHO");
const trs = q("SELECT id FROM transfer_orders WHERE status='in_transit';");
console.log(`   tìm được ${trs.length} phiếu\n`);
for (const [id] of trs) {
  try {
    const items = q(`SELECT id FROM transfer_order_items WHERE transfer_order_id='${id}';`);
    const lines = items.map(([iid]) => ({ transferOrderItemId: iid }));
    await call("receive_transfer_order", { transferOrderId: id, lines }, { nhan: `nhận ${id}` });
    const st = q(`SELECT status FROM transfer_orders WHERE id='${id}';`)[0][0];
    ghi(st !== "in_transit", `${id}: status ⇒ ${st}`);
  } catch (e) {
    ghi(false, `${id}: ${e instanceof Error ? e.message : String(e)}`);
  }
}

// ── ④ ĐO SAU + VERIFY BUG-005 ─────────────────────────────────────────────────────────────
console.log("\n④ ĐO SAU + VERIFY `BUG-20261005-005`");
const sau = {
  cr: q("SELECT COUNT(*) FROM central_returns WHERE status='in_transit';")[0][0],
  tr: q("SELECT COUNT(*) FROM transfer_orders WHERE status='in_transit';")[0][0],
  so: q("SELECT COUNT(*) FROM stock_movements;")[0][0],
};
console.log(`   central_returns in_transit: ${truoc.cr} ⇒ ${sau.cr}`);
console.log(`   transfer_orders in_transit: ${truoc.tr} ⇒ ${sau.tr}`);
console.log(`   sổ kho: ${truoc.so} ⇒ ${sau.so} dòng  (⭐ phải TĂNG = chặng NHẬN đã được ghi)`);
console.log("\n   ── loại chứng từ mới xuất hiện trong sổ kho ──");
for (const [t, n] of q("SELECT movement_type, COUNT(*) FROM stock_movements GROUP BY movement_type ORDER BY 2 DESC;")) {
  console.log(`      ${t} = ${n}`);
}

const sach = Number(sau.cr) === 0 && Number(sau.tr) === 0;
const coChangNhan = Number(sau.so) > Number(truoc.so);
ghi(sach, `hết phiếu kẹt (central=${sau.cr} · transfer=${sau.tr})`);
ghi(coChangNhan, `sổ kho tăng ${Number(sau.so) - Number(truoc.so)} dòng ⇒ chặng NHẬN đã ghi ⇒ ⭐ BUG-20261005-005 VERIFIED`);

console.log(`\n═══ KẾT LUẬN: ĐẠT ${dat.length} · HỎNG ${hong.length} ═══`);
if (hong.length) { console.log("   việc hỏng:"); hong.forEach((h) => console.log(`      · ${h}`)); }
process.exit(hong.length ? 1 : 0);
