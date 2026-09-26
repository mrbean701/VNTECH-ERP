// [PHASE 8 · B2/bước 3] JS PARITY: thêm action `update_po_price` vào scripts/system-route.mjs.
// Mỏ neo: '    if (action === "close_po_line") {' — TỰ CHỐI nếu không khớp đúng 1 lần hoặc đã có handler.
import { readFileSync, writeFileSync } from "node:fs";
const F = "scripts/system-route.mjs";
const APPLY = process.argv.includes("--apply");
let t = readFileSync(F, "utf8");
const NL = t.includes("\r\n") ? "\r\n" : "\n";
const anchor = '    if (action === "close_po_line") {';
const n = t.split(anchor).length - 1;
if (n !== 1) { console.error(`✖ mỏ neo khớp ${n} lần (cần 1) ⇒ DỪNG`); process.exit(1); }
if (t.includes('"update_po_price"')) { console.error("✖ Đã có update_po_price ⇒ DỪNG (tránh chèn trùng)."); process.exit(1); }
const snippet = [
  '    if (action === "update_po_price") {',
  '        requireRole(user, ["procurement", "accountant", "admin"]);',
  '        const poId=clean(payload.purchaseOrderId),stamp=new Date().toISOString();',
  '        const po=await first(`SELECT id,po_no AS poNo,project_id AS projectId,status FROM purchase_orders WHERE id=?`,poId);',
  '        if(!po)throw new Error("PO không tồn tại.");',
  '        const LOCKED_PO=["completed","completed_with_shortage","completed_with_exceptions","cancelled"];',
  '        if(LOCKED_PO.includes(String(po.status)))throw new Error(`PO đã hoàn thành (${po.status}) — không được sửa giá.`);',
  '        if(!(await canAccessProject(user,String(po.projectId),true)))throw new Error("Tài khoản không có quyền sửa PO tại dự án này.");',
  '        const priceLines=Array.isArray(payload.lines)?payload.lines:[];',
  '        if(!priceLines.length)throw new Error("Chưa chọn dòng PO nào để sửa giá.");',
  '        const priceStatements=[];',
  '        for(const pl of priceLines){',
  '            const itemId=clean(pl.purchaseOrderItemId),price=numberValue(pl.unitPrice);',
  '            if(!itemId)throw new Error("Thiếu mã dòng PO.");',
  '            if(price<0)throw new Error("Đơn giá PO không được âm.");',
  '            priceStatements.push(env.DB.prepare(`UPDATE purchase_order_items SET unit_price=?,updated_at=? WHERE id=? AND purchase_order_id=?`).bind(price,stamp,itemId,poId));',
  '        }',
  '        await env.DB.batch(priceStatements);',
  '        await audit(user.id,"UPDATE","purchase_order_price",poId,{lines:priceLines.length},{lines:priceLines.length},request);',
  '        return { message: `Đã cập nhật đơn giá ${priceLines.length} dòng của PO ${po.poNo}; danh mục vật tư KHÔNG thay đổi.` };',
  '    }',
].join("\n");
if (!APPLY) { console.log("CHẠY KHÔ: mỏ neo khớp đúng 1 lần, chưa có handler ⇒ sẵn sàng chèn (thêm --apply)."); process.exit(0); }
t = t.replace(anchor, snippet.split("\n").join(NL) + NL + anchor);
writeFileSync(F, t);
console.log("ĐÃ GHI: scripts/system-route.mjs (chèn update_po_price trước close_po_line).");
