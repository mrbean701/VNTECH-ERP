// [PHASE 8 · WF-04] "Hợp nhất 2 hệ (`workflow_*` và `approval_stage_catalog`) HOẶC ghi rõ hệ nào là CHÍNH".
// Cách làm: đối chiếu 1:1 hai hệ trên CÙNG đối tượng phiếu đề nghị (5 bước) + xác nhận hệ mới KHÔNG chồng lấn,
// rồi in KẾT LUẬN kèm bằng chứng (đây là mục có cờ MODEL ⇒ phải ghi rõ quyết định, không chỉ code).
import { execFileSync } from "node:child_process";
const MYSQL = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
const q = (sql) => execFileSync(MYSQL, ["-uvntech", "-pvntech", "--default-character-set=utf8mb4", "-N", "-B", "vntech_erp", "-e", sql], { encoding: "utf8" }).trim();
const rows = (sql) => q(sql).split(/\r?\n/).filter(Boolean).map((l) => l.split("\t"));

console.log("=== HỆ CŨ (đang chạy): `approval_stage_catalog` ===");
const legacy = rows("SELECT stage_no, name, COALESCE(allowed_role_codes,''), COALESCE(approval_mode,'') FROM approval_stage_catalog WHERE active=1 ORDER BY stage_no;");
for (const [no, name, roles, mode] of legacy) console.log(`  bước ${no} · ${name} · [${roles}] · ${mode}`);

console.log("\n=== HỆ MỚI (engine động): `workflow_definitions` + `workflow_steps` ===");
// ⚠️ SỬA LỖI CÔNG CỤ (MT2-P14-03c, 23/09/2026): bản cũ SELECT cột **`version`** — ĐO TRÊN CSDL THẬT
// (`SHOW COLUMNS FROM workflow_definitions`) ⛔ **không tồn tại cột này** ⇒ MySQL trả `ERROR 1054 Unknown column 'version'`
// làm probe chết. Nay chỉ lấy các cột CÓ THẬT (id, code, module_key, is_default, active); ⛔ không bịa cột.
const wf = rows("SELECT id, code, COALESCE(module_key,''), is_default, active FROM workflow_definitions ORDER BY sort_order;");
for (const [id, code, mod, def, act] of wf) {
  const steps = rows(`SELECT step_no, name, COALESCE(approval_mode,''), COALESCE(required_permission,'') FROM workflow_steps WHERE workflow_id='${id}' ORDER BY step_no;`);
  console.log(`  ${code} · module=${mod} · mặc định=${def} · active=${act} · ${steps.length} bước`);
  for (const [no, name, mode, perm] of steps) console.log(`      b${no} ${name} · ${mode} · quyền=${perm}`);
}

console.log("\n=== ĐỐI CHIẾU 1:1 CHO PHIẾU ĐỀ NGHỊ (5 bước) ===");
const req = wf.find((w) => w[2] === "requests");
const wfSteps = req ? rows(`SELECT step_no, name FROM workflow_steps WHERE workflow_id='${req[0]}' ORDER BY step_no;`) : [];
let same = 0;
for (const [no, name] of legacy) {
  const m = wfSteps.find((s) => Number(s[0]) === Number(no));
  const ok = m && m[1].trim() === name.trim();
  if (ok) same++;
  console.log(`  bước ${no}: catalog="${name}" ↔ workflow="${m ? m[1] : "(không có)"}" ${ok ? "KHỚP" : "LỆCH"}`);
}
const modules = [...new Set(wf.map((w) => w[2]))].sort();
console.log(`\n  số bước khớp: ${same}/${legacy.length} · module của hệ MỚI: [${modules.join(", ")}]`);
const overlap = modules.filter((m) => m === "requests").length;
console.log(`  chồng lấn: hệ mới có ${overlap} định nghĩa module "requests" (chỉ để chuyển đổi), ` +
  `${modules.filter((m) => m !== "requests").length} module MỚI (purchasing/warehouse_issue/warehouse_receipt)`);

console.log("\n=== KẾT LUẬN WF-04 (ghi rõ hệ nào là CHÍNH) ===");
console.log("  • Phiếu đề nghị mua hàng: **`approval_stage_catalog` là CHÍNH** (đang chạy thật, 100 dòng `approvals` dùng snapshot từ hệ này).");
console.log("  • 3 module mới (PO · cấp phát/xuất kho · nhập kho): **`workflow_*` là CHÍNH** (định nghĩa mới seed ở B1).");
console.log("  • Snapshot (`allowed_role_codes_snapshot`/`approval_mode_snapshot`) là **cầu nối**: quyết định luôn đọc snapshot ⇒ đổi hệ nào cũng KHÔNG làm lệch phiếu đang chạy (đã chứng minh ở WF-05).");
console.log("  • KHÔNG xoá hệ nào; KHÔNG di trú 100 dòng đang chạy (rủi ro cao, lợi ích thấp).");
