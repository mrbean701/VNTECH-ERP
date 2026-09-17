// TASK-081: DỰNG LẠI dữ liệu cha còn thiếu thay vì xoá (chỉ thị người dùng 17/09:
// "Ok dựng lại đi đỡ phải xóa"). Nguyên tắc: dùng dữ liệu THẬT sẵn có (dự án, NCC, kho,
// người dùng, PO) — chỉ tạo bản ghi cha còn thiếu để tệp/ảnh trở nên TRUY CẬP ĐƯỢC.
import { execFileSync } from 'node:child_process';
import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const MYSQL = 'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe';
const run = (sqlText) => execFileSync(MYSQL, ['--default-character-set=utf8mb4', '-uvntech', '-pvntech', 'vntech_erp', '--batch', '--raw', '-e', sqlText], { encoding: 'utf8' });
const rows = (q) => run(q).trim().split(/\r?\n/).slice(1).map((l) => l.split('\t'));
const q = (v) => `'${String(v).replace(/'/g, "''")}'`;

// ── dữ liệu thật để tham chiếu ────────────────────────────────────────────────
const [projectId] = rows("SELECT id FROM projects WHERE code='PRJ-DEMO-01'")[0];
const [supplierId] = rows('SELECT id FROM suppliers ORDER BY id LIMIT 1')[0];
const [warehouseId, warehouseCode] = rows("SELECT id,code FROM warehouses WHERE type='site' ORDER BY code LIMIT 1")[0]
  || rows('SELECT id,code FROM warehouses ORDER BY code LIMIT 1')[0];
const [buyerId, buyerName] = rows("SELECT id,full_name FROM users WHERE username='trinhtrench'")[0];
const [receiverId, receiverName] = rows("SELECT id,full_name FROM users WHERE username='tkhodemo'")[0];
console.log(`tham chiếu thật: dự án=${projectId} · NCC=${supplierId} · kho=${warehouseCode} · người mua=${buyerName} · người nhận=${receiverName}`);

// ── (a) chứng từ MỒ CÔI: thiếu PO cha ─────────────────────────────────────────
const orphan = rows("SELECT gr.id, gr.receipt_no, gr.purchase_order_id, gr.warehouse_id, gr.received_by, gr.received_at FROM goods_receipts gr LEFT JOIN purchase_orders po ON po.id=gr.purchase_order_id WHERE po.id IS NULL")[0];
let sql = '';
if (orphan) {
  const [grId, grNo, poId, grWh, grBy, grAt] = orphan;
  const poNo = 'PO-PRJ-DEMO-01-2026-' + String(Number(rows("SELECT COALESCE(MAX(CAST(SUBSTRING(po_no, -4) AS UNSIGNED)),10)+1 FROM purchase_orders WHERE po_no LIKE 'PO-PRJ-DEMO-01-%'")[0][0])).padStart(4, '0');
  sql += `INSERT INTO purchase_orders (id,po_no,project_id,supplier_id,receiving_warehouse_id,buyer_user_id,ordered_at,status,total_value,created_at,updated_at)
SELECT ${q(poId)}, ${q(poNo)}, ${q(projectId)}, ${q(supplierId)}, ${q(grWh)}, ${q(buyerId)}, DATE_SUB(${q(grAt)}, INTERVAL 7 DAY), 'completed', 0, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM purchase_orders p WHERE p.id=${q(poId)});\n`;
  console.log(`(a) dựng lại PO ${poNo} cho chứng từ mồ côi ${grNo}`);
} else console.log('(a) không còn chứng từ mồ côi');

// ── (b) 10 TỆP RỜI trong kho: dựng phiếu nhập cha + dòng attachments ──────────
const ROOT = join('java-backend', 'data', 'files');
const files = [];
const walk = (dir) => { for (const n of readdirSync(dir)) { const p = join(dir, n); if (statSync(p).isDirectory()) walk(p); else files.push(p); } };
walk(ROOT);
const haveRows = new Set(rows('SELECT storage_key FROM attachments').map((r) => r[0]));
const need = files.filter((p) => !haveRows.has(p.replace(/\\/g, '/').replace(/^java-backend\/data\/files\//, '')));
console.log(`(b) ${files.length} tệp trong kho · ${need.length} tệp CHƯA có dòng trong DB`);

const poIds = rows("SELECT id FROM purchase_orders ORDER BY po_no").map((r) => r[0]);
let idx = 0;
for (const p of need) {
  const key = p.replace(/\\/g, '/').replace(/^java-backend\/data\/files\//, '');
  const parts = key.split('/');
  if (parts.length < 3) continue;
  const [, entityId, filePart] = parts;
  const attId = filePart.slice(0, filePart.indexOf('-')) || `ATT_T081_${idx}`;
  const fileName = filePart.slice(filePart.indexOf('-') + 1);
  const poId = poIds[idx % poIds.length];
  const suffix = /(\d{6})\./.exec(fileName);
  // Tên tệp có thể chứa số KHÔNG phải giờ (vd 985135) ⇒ phải KIỂM HỢP LỆ, không thì dùng giờ hành chính.
  const raw = suffix ? suffix[1] : '';
  const ok = raw.length === 6 && Number(raw.slice(0, 2)) <= 23 && Number(raw.slice(2, 4)) <= 59 && Number(raw.slice(4, 6)) <= 59;
  const hh = ok ? raw.slice(0, 2) : '08';
  const mm = ok ? raw.slice(2, 4) : '30';
  const ss = ok ? raw.slice(4, 6) : '00';
  const receivedAt = `2026-02-${String((idx % 20) + 1).padStart(2, '0')} ${hh}:${mm}:${ss}.000`;
  const receiptNo = `GRN-PRJ-DEMO-01-2026-${String(20 + idx).padStart(4, '0')}`;
  sql += `INSERT INTO goods_receipts (id,receipt_no,purchase_order_id,warehouse_id,received_by,received_at,qc_status,document_status,posting_status,created_at,updated_at,certificate_status,delivery_document_status,bch_confirmation_status)
SELECT ${q(entityId)}, ${q(receiptNo)}, ${q(poId)}, ${q(warehouseId)}, ${q(receiverName)}, ${q(receivedAt)}, 'accepted','complete','posted', NOW(3), NOW(3), 'complete','complete','confirmed'
WHERE NOT EXISTS (SELECT 1 FROM goods_receipts g WHERE g.id=${q(entityId)});\n`;
  sql += `INSERT INTO attachments (id,entity_type,entity_id,file_name,storage_key,mime_type,uploaded_by,created_at,updated_at)
SELECT ${q(attId)}, 'goods_receipt', ${q(entityId)}, ${q(fileName)}, ${q(key)}, 'image/png', ${q(receiverId)}, ${q(receivedAt)}, ${q(receivedAt)}
WHERE NOT EXISTS (SELECT 1 FROM attachments a WHERE a.id=${q(attId)});\n`;
  idx++;
}
console.log(`(b) sẽ dựng ${idx} phiếu nhập + ${idx} dòng attachments`);

const out = join(process.env.TEMP || '.', 'task081-rebuild-parents.sql');
writeFileSync(out, sql, 'utf8');
console.log(`\nSQL đã ghi: ${out} (${sql.length} ký tự)`);
