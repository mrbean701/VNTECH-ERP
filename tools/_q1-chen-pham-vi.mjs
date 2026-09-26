// Q1 — bước 2: CẤP phạm vi cho `thukydemo` ở PRJ-DEMO-01 (lượt trước INSERT không thấy xuất hiện ⇒ tìm nguyên nhân).
import { execFileSync } from "node:child_process";
const MYSQL = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
const run = (sql, label) => {
  try {
    const out = execFileSync(MYSQL, ["-uvntech", "-pvntech", "--default-character-set=utf8mb4", "-N", "-B", "vntech_erp", "-e", sql], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    console.log(`${label}: ${out.trim() || "(không có dòng trả về)"}`);
    return out.trim();
  } catch (error) {
    console.error(`${label}: ✖ LỖI — ${String(error.stderr || error.message).trim()}`);
    return null;
  }
};

console.log("=== ràng buộc NOT NULL của user_project_scopes ===");
run("SELECT column_name, is_nullable, column_default FROM information_schema.columns WHERE table_schema='vntech_erp' AND table_name='user_project_scopes' ORDER BY ordinal_position", "cột");

const ownerId = run("SELECT id FROM users WHERE username='thukydemo'", "user id");
const projectId = run("SELECT id FROM projects WHERE code='PRJ-DEMO-01'", "project id");
if (!ownerId || !projectId) process.exit(1);

const before = run(`SELECT COUNT(*) FROM user_project_scopes WHERE user_id='${ownerId}' AND project_id='${projectId}'`, "phạm vi TRƯỚC");
if (before === "0") {
  run(`INSERT INTO user_project_scopes (id, user_id, project_id, permission, created_at, updated_at, joined_at) VALUES (CONCAT('SCOPE_', REPLACE(UUID(),'-','')), '${ownerId}', '${projectId}', 'write', NOW(), NOW(), NOW())`, "INSERT");
} else console.log("đã có phạm vi — bỏ qua INSERT");
run(`SELECT id, permission, joined_at FROM user_project_scopes WHERE user_id='${ownerId}' AND project_id='${projectId}'`, "phạm vi SAU");
