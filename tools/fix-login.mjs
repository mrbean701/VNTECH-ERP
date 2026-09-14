#!/usr/bin/env node
/**
 * Đặt lại mật khẩu CHẮC CHẮN THÀNH CÔNG: ghi hash rồi đăng nhập kiểm chứng ngay,
 * tất cả trong MỘT tiến trình (tránh mọi vấn đề escape/biến của PowerShell).
 *
 * Chạy: node tools/fix-login.mjs [username] [password]
 */
import { randomBytes, pbkdf2Sync } from "node:crypto";
import { execFileSync } from "node:child_process";
import { writeFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const USER = process.argv[2] || "admin";
const PASS = process.argv[3] || "Vntech@2026";
const BASE = process.argv[4] || "http://127.0.0.1:18081";
const MYSQL = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";

const salt = randomBytes(16);
const key = pbkdf2Sync(PASS, salt, 600_000, 32, "sha256");
const hash = `pbkdf2$600000$${salt.toString("hex")}$${key.toString("hex")}`;

const sqlFile = resolve(".fix-login.sql");
writeFileSync(sqlFile,
  `UPDATE users SET password_hash='${hash}', must_change_password=0, updated_at=NOW(3) WHERE username='${USER}';\n`,
  "utf8");

console.log("1) Ghi hash mới vào MySQL…");
try {
  execFileSync(MYSQL, ["-u", "vntech", "-pvntech", "--default-character-set=utf8mb4",
    "vntech_erp", "-e", `source ${sqlFile.replace(/\\/g, "/")}`],
    { stdio: ["ignore", "ignore", "pipe"] });
} catch (e) {
  console.error("   ❌ mysql lỗi:", e.code || e.message);
  console.error("   File SQL:", sqlFile);
  process.exit(1);
}

console.log("2) Đọc lại để xác nhận…");
const back = execFileSync(MYSQL, ["-u", "vntech", "-pvntech", "vntech_erp", "-N", "-e",
  `SELECT password_hash FROM users WHERE username='${USER}';`],
  { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
console.log("   khớp:", back === hash ? "✅" : "❌");

console.log("3) Đăng nhập kiểm chứng…");
const res = await fetch(`${BASE}/api/system`, {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ action: "login", username: USER, password: PASS }),
});
const body = await res.text();
console.log(`   HTTP ${res.status} · ${body.slice(0, 120)}`);

if (res.status === 200) {
  console.log(`\n✅ THÀNH CÔNG — đăng nhập được bằng '${USER}' / '${PASS}'`);
} else if (body.includes("khóa")) {
  console.log("\n⚠️  Đang bị KHÓA do sai quá nhiều lần (lockout trong RAM).");
  console.log("   → KHỞI ĐỘNG LẠI Java backend rồi chạy lại lệnh này.");
} else {
  console.log("\n❌ Vẫn không đăng nhập được — xem chi tiết ở trên.");
}
rmSync(sqlFile, { force: true });
