// [PHASE 1 · U-16/U-04 · LÔ A] Gác 2 khối hành động ở MỨC KHỐI trong app/page.tsx (WorkCenter).
// An toàn: thay CHUỖI CHÍNH XÁC (khối ngắn, tự chứa) — KHÔNG cần đếm thẻ; TỰ CHỐI nếu không khớp đúng 1 lần.
// Cờ dùng: canCreate (Tạo việc cho tôi) · canAssign (Giao việc) — đã có trong scope của WorkCenter (kiểm tra trước).
import { readFileSync, writeFileSync } from "node:fs";
const F = "app/page.tsx";
const APPLY = process.argv.includes("--apply");
const src = readFileSync(F, "utf8");

const targets = [
  {
    label: "＋ Tạo việc cho tôi (canSelf)",
    old: '<div className="row-actions"><button className="primary" disabled={busy}>＋ Tạo việc cho tôi</button></div>',
    guard: "canSelf",
  },
  {
    label: "＋ Giao việc (canAssign)",
    old: '<div className="row-actions"><button className="primary" disabled={busy}>＋ Giao việc</button></div>',
    guard: "canAssign",
  },
];

const fails = [];
const plan = [];
for (const t of targets) {
  const n = src.split(t.old).length - 1;
  const already = src.split(`<PermissionGuard allow={${t.guard}}>${t.old}</PermissionGuard>`).length - 1;
  console.log(`  ${t.label}: mỏ neo = ${n} lần · đã gác trước đó = ${already}`);
  if (already === 1 && n === 1) { console.log("    ⇒ đã gác rồi, bỏ qua"); continue; }
  if (n !== 1) { fails.push(`${t.label}: mỏ neo xuất hiện ${n} lần (cần đúng 1)`); continue; }
  if (!src.includes(`const ${t.guard}`) && !src.includes(`${t.guard}=`) && !src.includes(`${t.guard} `)) {
    // kiểm tra thô sự tồn tại của tên cờ; nếu KHÔNG thấy thì từ chối (tránh ReferenceError)
    fails.push(`${t.label}: KHÔNG thấy tên cờ '${t.guard}' trong tệp ⇒ từ chối (tránh ReferenceError)`);
    continue;
  }
  plan.push({ ...t, to: `<PermissionGuard allow={${t.guard}}>${t.old}</PermissionGuard>` });
}

if (fails.length) { console.error("KHÔNG GHI — điều kiện không đạt:"); for (const f of fails) console.error("  ✖ " + f); process.exit(1); }
if (!plan.length) { console.log("Không có gì để áp dụng."); process.exit(0); }
console.log("\n=== KẾ HOẠCH ===");
for (const p of plan) console.log(`  gác '${p.label}' bằng <PermissionGuard allow={${p.guard}}>`);
if (!APPLY) { console.log("CHẠY KHÔ: sẵn sàng ghi (thêm --apply)."); process.exit(0); }
let out = src;
for (const p of plan) out = out.replace(p.old, p.to);
// kiểm tra cấu trúc: số thẻ mở/đóng PermissionGuard phải khớp
const open = (out.match(/<PermissionGuard\b/g) || []).length, close = (out.match(/<\/PermissionGuard>/g) || []).length;
console.log(`\n  thẻ <PermissionGuard> = ${open} · </PermissionGuard> = ${close} ⇒ ${open === close ? "CÂN BẰNG OK" : "LỆCH ⇒ TỪ CHỐI"}`);
if (open !== close) process.exit(1);
writeFileSync(F, out);
console.log("ĐÃ GHI app/page.tsx (LÔ A).");
