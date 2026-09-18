// [PHASE 1 · U-16/U-04 · LÔ B] Gác nút Tạo/Sửa/Xuất ở MỨC NÚT, CHỈ khi cờ ĐÃ CÓ trong chính nút đó.
// QUY TẮC AN TOÀN (rút từ lỗi LÔ A): chỉ gác khi tên cờ xuất hiện NGAY TRONG đoạn `<button …>…</button>` được gác
//   ⇒ bảo đảm định danh tồn tại ⇒ không thể lỗi TS2304.
// TỰ CHỐI nếu: dòng không có đúng 1 <button>, cờ không có trong đoạn, hoặc đã gác trước đó.
import { readFileSync, writeFileSync } from "node:fs";
const F = "app/page.tsx";
const APPLY = process.argv.includes("--apply");
const src = readFileSync(F, "utf8");
const NL = src.includes("\r\n") ? "\r\n" : "\n";
const L = src.split(/\r?\n/);

const targets = [
  { line: 1365, flag: "canCreate", note: "MaterialListTable — nút thêm vật tư" },
  { line: 1384, flag: "canEdit",   note: "MaterialListTable — nút sửa dòng" },
  { line: 1265, flag: "canUse",    note: "WarehouseReceipt — nút tạo phiếu nhập" },
];

const fails = [], plan = [];
for (const t of targets) {
  const i = t.line - 1;
  const line = L[i];
  if (!line) { fails.push(`[dòng ${t.line}] không có dòng`); continue; }
  const btns = line.match(/<button\b[\s\S]*?<\/button>/g) || [];
  if (btns.length !== 1) { fails.push(`[dòng ${t.line}] thấy ${btns.length} <button> (cần đúng 1) ⇒ không xác định được nút`); continue; }
  const btn = btns[0];
  if (!new RegExp(`\\b${t.flag}\\b`).test(btn)) { fails.push(`[dòng ${t.line}] cờ '${t.flag}' KHÔNG có trong chính nút ⇒ TỪ CHỐI (tránh TS2304)`); continue; }
  const wrapped = `<PermissionGuard allow={${t.flag}}>${btn}</PermissionGuard>`;
  if (line.includes(wrapped)) { console.log(`  [dòng ${t.line}] đã gác rồi, bỏ qua`); continue; }
  plan.push({ ...t, btn, wrapped });
}

console.log("=== KẾ HOẠCH ===");
for (const p of plan) console.log(`  dòng ${p.line} · ${p.note} · gác bằng allow={${p.flag}}  (cờ CÓ trong nút ✔)`);
if (fails.length) { console.error("KHÔNG GHI — điều kiện không đạt:"); for (const f of fails) console.error("  ✖ " + f); process.exit(1); }
if (!plan.length) { console.log("Không có gì để áp dụng."); process.exit(0); }
if (!APPLY) { console.log("CHẠY KHÔ: sẵn sàng ghi (thêm --apply)."); process.exit(0); }
for (const p of plan) {
  const i = p.line - 1;
  L[i] = L[i].replace(p.btn, p.wrapped);
}
const out = L.join(NL);
const open = (out.match(/<PermissionGuard\b/g) || []).length, close = (out.match(/<\/PermissionGuard>/g) || []).length;
console.log(`\n  thẻ <PermissionGuard> = ${open} · </PermissionGuard> = ${close} ⇒ ${open === close ? "CÂN BẰNG OK" : "LỆCH ⇒ TỪ CHỐI"}`);
if (open !== close) process.exit(1);
writeFileSync(F, out);
console.log("ĐÃ GHI app/page.tsx (LÔ B).");
