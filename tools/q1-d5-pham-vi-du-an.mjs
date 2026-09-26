// Q1 — D5: dọn 5 dòng `user_project_scopes` MỒ CÔI + cấp 1 dòng phạm vi cho `thukydemo` ở PRJ-DEMO-01.
// Người dùng quyết phương án (1): cho phép chạy SQL. Script TỰ CHỐI nếu tiền đề không khớp số đo trước đó.
import { execFileSync } from "node:child_process";

const MYSQL = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
const APPLY = process.argv.includes("--apply");
const DB = "vntech_erp";
const q = (sql) => execFileSync(MYSQL, ["-uvntech", "-pvntech", "--default-character-set=utf8mb4", "-N", "-B", DB, "-e", sql], { encoding: "utf8" }).trim();
const rows = (sql) => q(sql).split(/\r?\n/).filter(Boolean).map((l) => l.split("\t"));

console.log("=== 1. LƯỢC ĐỒ user_project_scopes ===");
console.log(q("SELECT column_name FROM information_schema.columns WHERE table_schema='vntech_erp' AND table_name='user_project_scopes' ORDER BY ordinal_position").split(/\r?\n/).join(", "));

console.log("\n=== 2. TIỀN ĐỀ: 5 dòng MỒ CÔI (phải đúng 5) ===");
const orphans = rows(`SELECT s.id, u.username, s.project_id, s.permission FROM user_project_scopes s LEFT JOIN projects p ON p.id=s.project_id LEFT JOIN users u ON u.id=s.user_id WHERE p.id IS NULL;`);
for (const r of orphans) console.log(`  ${r[0]} · user=${r[1]} · project=${r[2]} · permission=${r[3]}`);
if (orphans.length !== 5) { console.error(`  ✖ Đo được ${orphans.length} dòng mồ côi (kỳ vọng 5) ⇒ DỪNG để không xoá sai.`); process.exit(1); }

console.log("\n=== 3. Owner bước 2 + phạm vi hiện có ===");
const owner = rows("SELECT id, username, role FROM users WHERE username='thukydemo';");
console.log(`  thukydemo: ${owner.map((r) => `${r[0]} · ${r[1]} · role=${r[2]}`).join(" | ") || "KHÔNG THẤY"}`);
if (owner.length !== 1) { console.error("  ✖ Không xác định được đúng 1 tài khoản thukydemo ⇒ DỪNG."); process.exit(1); }
const ownerId = owner[0][0];
const projectId = q("SELECT id FROM projects WHERE code='PRJ-DEMO-01';");
console.log(`  PRJ-DEMO-01 id = ${projectId}`);
const existing = rows(`SELECT id, permission FROM user_project_scopes WHERE user_id='${ownerId}' AND project_id='${projectId}';`);
console.log(`  phạm vi hiện có của thukydemo ở PRJ-DEMO-01: ${existing.length ? existing.map((r) => r.join(":")).join(" · ") : "KHÔNG CÓ (đúng như đo trước: đây là lý do create_request trả 400)"}`);

if (!APPLY) { console.log("\nCHẠY KHÔ: chưa sửa gì. Thêm --apply để ghi."); process.exit(0); }

// ── 4. ÁP DỤNG ───────────────────────────────────────────────────────────────────────────
console.log("\n=== 4. ÁP DỤNG ===");
q(`DELETE s FROM user_project_scopes s LEFT JOIN projects p ON p.id=s.project_id WHERE p.id IS NULL;`);
console.log(`  đã xoá ${orphans.length} dòng mồ côi`);
if (existing.length === 0) {
  // ⚠️ BÀI HỌC ĐÃ GẶP THẬT (lượt chạy đầu của chính script này): INSERT **thiếu cột `id`** (NOT NULL, không có
  // default) ⇒ MySQL báo lỗi, nhưng script in "đã cấp 1 dòng phạm vi" mà **không đọc lại** ⇒ **KHẲNG ĐỊNH SAI**
  // (stderr còn bị che bởi `2>$null` ở tầng gọi). Nay: sinh `id` tường minh + **ĐỌC LẠI để xác nhận**.
  q(`INSERT INTO user_project_scopes (id, user_id, project_id, permission, created_at, updated_at, joined_at) VALUES (CONCAT('SCOPE_', REPLACE(UUID(),'-','')), '${ownerId}', '${projectId}', 'write', NOW(), NOW(), NOW());`);
  const check = q(`SELECT CONCAT(permission,' (',id,')') FROM user_project_scopes WHERE user_id='${ownerId}' AND project_id='${projectId}';`);
  if (!check) { console.error("  ✖ INSERT xong nhưng ĐỌC LẠI KHÔNG THẤY ⇒ DỪNG, không được báo thành công."); process.exit(1); }
  console.log(`  đã cấp 1 dòng phạm vi cho thukydemo ở PRJ-DEMO-01 · đọc lại xác nhận: ${check}`);
} else console.log("  (phạm vi đã có — bỏ qua INSERT)");

// ── 5. ĐO LẠI ────────────────────────────────────────────────────────────────────────────
console.log("\n=== 5. ĐO LẠI ===");
console.log(`  dòng mồ côi còn lại: ${q("SELECT COUNT(*) FROM user_project_scopes s LEFT JOIN projects p ON p.id=s.project_id WHERE p.id IS NULL;")}`);
console.log(`  phạm vi của thukydemo ở PRJ-DEMO-01: ${q(`SELECT CONCAT(permission,' (',id,')') FROM user_project_scopes WHERE user_id='${ownerId}' AND project_id='${projectId}';`)}`);
console.log(`  tổng dòng phạm vi theo quyền: ${q("SELECT CONCAT(permission,'=',COUNT(*)) FROM user_project_scopes GROUP BY permission ORDER BY permission;").split(/\r?\n/).join(" · ")}`);
