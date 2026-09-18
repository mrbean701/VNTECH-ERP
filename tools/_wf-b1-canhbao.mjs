// [WF] PHASE 8 — B1 phần còn lại (bước 1): thêm `approvalWarnings()` (CHỈ CẢNH BÁO, KHÔNG chặn) và gắn vào `issue_stock`.
// Tự chối nếu mỏ neo không khớp đúng 1 lần. Các action còn lại (create_po · receive_goods) + bản Java = việc kế tiếp (ghi rõ).
import { readFileSync, writeFileSync } from "node:fs";
const FILE = "scripts/system-route.mjs";
let text = readFileSync(FILE, "utf8");
const failures = [];
const patch = (label, find, repl) => {
  const n = text.split(find).length - 1;
  if (n !== 1) { failures.push(`[${label}] khớp ${n} lần (cần 1) ⇒ DỪNG`); return; }
  text = text.replace(find, repl);
};

// 1) Helper — đặt ngay sau `isCompanyLeadershipActionGate` (cùng khu vực quyền/duyệt).
patch("thêm approvalWarnings",
  `function isCompanyLeadershipActionGate(user){ return COMPANY_LEADERSHIP_ACTION_CODES.has(clean(user?.role).toLowerCase()); }`,
  `function isCompanyLeadershipActionGate(user){ return COMPANY_LEADERSHIP_ACTION_CODES.has(clean(user?.role).toLowerCase()); }
// [WF] PHASE 8 (18/09) — CẢNH BÁO PHÊ DUYỆT: người dùng quyết **CHỈ CẢNH BÁO, KHÔNG chặn cứng**.
// Vì sao trả MẢNG thay vì ném lỗi: hành vi nghiệp vụ phải GIỮ NGUYÊN như hiện tại (đang chạy thật), còn việc
// "đã qua phê duyệt hay chưa" là thông tin để người dùng biết. MỌI lỗi tra cứu đều bị bắt ⇒ không thể làm hỏng nghiệp vụ.
async function approvalWarnings(entityType, entityId) {
  const type = clean(entityType), id = clean(entityId);
  if (!type || !id) return [];
  try {
    const row = await first(\`SELECT COUNT(*) AS total, COALESCE(SUM(CASE WHEN status='approved' THEN 1 ELSE 0 END),0) AS approved FROM approvals WHERE entity_type=? AND entity_id=?\`, type, id);
    const total = Number(row?.total || 0), approved = Number(row?.approved || 0);
    if (!total) return [\`\${type} \${id}: chưa có bản ghi phê duyệt nào (quy trình động chưa khởi tạo) — vẫn cho phép theo chế độ CHỈ CẢNH BÁO.\`];
    if (approved < total) return [\`\${type} \${id}: còn \${total - approved}/\${total} bước CHƯA duyệt — vẫn cho phép theo chế độ CHỈ CẢNH BÁO.\`];
    return [];
  } catch { return []; }
}`);

// 2) Gắn vào `issue_stock` (cấp phát / xuất kho) — trả thêm `warnings`.
patch("gắn cảnh báo vào issue_stock",
  'await env.DB.batch(statements);await audit(user.id,"POST","stock_issue",issueId,null,{issueNo,requestId,teamId,p10ContractOwnership:true},request);return{message:`Đã cấp phát ${issueNo}; tồn vật lý và tồn Contract đã chuyển sang kho tổ đội.`};',
  'await env.DB.batch(statements);await audit(user.id,"POST","stock_issue",issueId,null,{issueNo,requestId,teamId,p10ContractOwnership:true},request);return{message:`Đã cấp phát ${issueNo}; tồn vật lý và tồn Contract đã chuyển sang kho tổ đội.`,warnings:await approvalWarnings("stock_issue",issueId)};');

if (failures.length) { console.error("KHÔNG GHI — có điều kiện không đạt:"); for (const f of failures) console.error("  ✖ " + f); process.exit(1); }
writeFileSync(FILE, text);
console.log(`ĐÃ GHI: ${FILE} (đã thêm approvalWarnings + gắn vào issue_stock)`);
