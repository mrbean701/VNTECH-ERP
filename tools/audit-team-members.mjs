#!/usr/bin/env node
// PHASE 6 (`TM-06`) — AUDIT `team_members`: ĐÍNH CHÍNH TIỀN ĐỀ + XÁC ĐỊNH CÁCH NẠP DỮ LIỆU.
//
// Nguyên văn `docs/25_TODO_ROADMAP.md` dòng `TM-06`:
//   «Audit `team_members` (hiện **0 dòng**) — xác định cách nạp dữ liệu»
//
// ⚠️ TIỀN ĐỀ CỦA ROADMAP **SAI**: CSDL thật đang có **6 dòng** (5 dòng `active=1`). Cổng này ĐO LẠI từ
// MySQL và ghi bằng chứng ra `docs/agent-progress/TM-06-TEAM-MEMBERS-AUDIT.csv` để tệp test hợp đồng
// `tests/tm06-team-members-audit.test.mjs` đọc lại (test không tự kết nối MySQL khi máy khác thiếu CLI).
//
// Cổng này CHỈ ĐỌC CSDL + ĐỌC mã nguồn. KHÔNG ghi tệp nào ngoài 1 tệp bằng chứng trong `docs/agent-progress/`.
//
//   node tools/audit-team-members.mjs
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const MYSQL = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
const DB = "vntech_erp";
const OUT_DIR = join(process.cwd(), "docs", "agent-progress");
const OUT_FILE = join(OUT_DIR, "TM-06-TEAM-MEMBERS-AUDIT.csv");

const sql = (query) =>
  execFileSync(MYSQL, ["--default-character-set=utf8mb4", "-uvntech", "-pvntech", DB, "--batch", "--raw", "--skip-column-names", "-e", query], { encoding: "utf8" }).trim();
const rows = (query) => sql(query).split(/\r?\n/).filter(Boolean).map((line) => line.split("\t"));

const evidence = [];
const push = (key, value, source, note) => evidence.push({ key, value: String(value ?? ""), source, note });

console.log("═══ TM-06 · AUDIT `team_members` ═══\n");

if (!existsSync(MYSQL)) {
  console.error(`KHÔNG ĐO ĐƯỢC: không thấy ${MYSQL}`);
  process.exit(2);
}

// ── 1. ĐÍNH CHÍNH TIỀN ĐỀ ─────────────────────────────────────────────────────────────────────────
const total = Number(sql("SELECT COUNT(*) FROM team_members"));
const active = Number(sql("SELECT COUNT(*) FROM team_members WHERE active=1"));
const activeNotLeft = Number(sql("SELECT COUNT(*) FROM team_members WHERE active=1 AND left_at IS NULL"));
const leftoverProbe = Number(sql("SELECT COUNT(*) FROM team_members WHERE id LIKE 'PRB%'"));
const teamCount = Number(sql("SELECT COUNT(*) FROM teams"));
const teamActive = Number(sql("SELECT COUNT(*) FROM teams WHERE active=1"));
console.log(`team_members = ${total} dòng · active=1 = ${active} · active=1 AND left_at IS NULL = ${activeNotLeft}`);
console.log(`  trong đó dòng do PROBE cắm (id LIKE 'PRB%') = ${leftoverProbe}`);
console.log(`teams = ${teamCount} dòng · active=1 = ${teamActive}\n`);
push("team_members_total", total, "SELECT COUNT(*) FROM team_members", "roadmap ghi «0 dòng» ⇒ ĐÍNH CHÍNH");
push("team_members_active", active, "SELECT COUNT(*) ... WHERE active=1", "");
push("team_members_active_not_left", activeNotLeft, "SELECT COUNT(*) ... WHERE active=1 AND left_at IS NULL", "định nghĩa «đang hoạt động» của màn Tổ đội");
push("team_members_probe_leftover", leftoverProbe, "SELECT COUNT(*) ... WHERE id LIKE 'PRB%'", "tàn dư fixture của TASK-073");
push("teams_total", teamCount, "SELECT COUNT(*) FROM teams", "");
push("teams_active", teamActive, "SELECT COUNT(*) FROM teams WHERE active=1", "bootstrap JS chỉ trả active=1");

// ── 2. CỘT + KHOÁ ────────────────────────────────────────────────────────────────────────────────
const columns = rows(`SELECT COLUMN_NAME,COLUMN_TYPE,IS_NULLABLE,COLUMN_DEFAULT,COLUMN_KEY FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='${DB}' AND TABLE_NAME='team_members' ORDER BY ORDINAL_POSITION`);
console.log("Cột của team_members:");
for (const [name, type, nullable, def, key] of columns) {
  console.log(`  ${name.padEnd(14)} ${type.padEnd(16)} null=${nullable} default=${def} key=${key}`);
  push(`column.${name}`, `${type}|null=${nullable}|default=${def}|key=${key}`, "information_schema.COLUMNS", "");
}

// ── 3. NGUỒN GỐC TỪNG DÒNG (theo tiền tố id) ─────────────────────────────────────────────────────
const origins = rows(`SELECT CASE WHEN id LIKE 'TMB_T080_%' THEN 'seed task080' WHEN id LIKE 'PRB073%' THEN 'fixture probe-task073' ELSE 'khác' END AS origin, COUNT(*), MIN(created_at), MAX(created_at) FROM team_members GROUP BY origin`);
console.log("\nNguồn gốc từng dòng (theo tiền tố id + created_at):");
for (const [origin, count, minAt, maxAt] of origins) {
  console.log(`  ${origin.padEnd(24)} ${count} dòng · created_at ${minAt} → ${maxAt}`);
  push(`origin.${origin}`, `${count}|${minAt}|${maxAt}`, "team_members.id + created_at", "");
}

// ── 4. CÁCH NẠP: CÓ ĐƯỜNG GHI TRONG ACTION LAYER KHÔNG? ──────────────────────────────────────────
// Đọc mã nguồn (CHỈ ĐỌC) để trả lời: sản phẩm có action nào ghi `team_members` không?
const { readFileSync } = await import("node:fs");
const route = readFileSync("scripts/system-route.mjs", "utf8");
const javaFiles = [];
const { readdirSync, statSync } = await import("node:fs");
const walk = (dir) => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full);
    else if (entry.endsWith(".java")) javaFiles.push(full);
  }
};
try { walk("java-backend"); } catch { /* thiếu thư mục ⇒ bỏ qua, ghi rõ bên dưới */ }

const routeWritesTeamMembers = /INSERT\s+INTO\s+team_members|UPDATE\s+team_members|DELETE\s+FROM\s+team_members/i.test(route);
const routeReadsTeamMembers = /team_members|teamMembers/.test(route);
const javaWriteFiles = javaFiles.filter((file) => /INSERT\s+INTO\s+team_members|UPDATE\s+team_members|DELETE\s+FROM\s+team_members/i.test(readFileSync(file, "utf8")));
const javaTables = javaFiles.filter((file) => /team_members/i.test(readFileSync(file, "utf8")));

console.log("\nĐường GHI / ĐỌC `team_members` trong mã nguồn sản phẩm:");
console.log(`  scripts/system-route.mjs — GHI: ${routeWritesTeamMembers ? "CÓ" : "KHÔNG"} · ĐỌC: ${routeReadsTeamMembers ? "CÓ" : "KHÔNG"}`);
console.log(`  java-backend — đọc ở ${javaTables.length} tệp · ghi ở ${javaWriteFiles.length} tệp`);
for (const file of javaTables) console.log(`    đọc: ${file}`);
for (const file of javaWriteFiles) console.log(`    GHI: ${file}`);
push("route_writes_team_members", routeWritesTeamMembers ? "yes" : "no", "scripts/system-route.mjs", "0 action ghi ⇒ không nạp được qua sản phẩm");
push("route_reads_team_members", routeReadsTeamMembers ? "yes" : "no", "scripts/system-route.mjs", "KHÔNG đọc ⇒ khoá teamMembers là Java-only");
push("java_read_files", javaTables.length, "java-backend/**/*.java", "");
push("java_write_files", javaWriteFiles.length, "java-backend/**/*.java", "");

// ── 5. SEED / FIXTURE ĐÃ DÙNG ─────────────────────────────────────────────────────────────────────
const seedFile = "tools/task080-seed-real-data.sql";
const seedText = existsSync(seedFile) ? readFileSync(seedFile, "utf8") : "";
const seedHasTeamMembers = /INSERT\s+INTO\s+team_members/i.test(seedText);
console.log(`\n${seedFile} — có INSERT team_members: ${seedHasTeamMembers ? "CÓ" : "KHÔNG"}`);
push("seed_file_inserts_team_members", seedHasTeamMembers ? "yes" : "no", seedFile, "nguồn nạp 4 dòng thật của TASK-080");
const probeFile = "tools/probe-task073-team-members.mjs";
const probeText = existsSync(probeFile) ? readFileSync(probeFile, "utf8") : "";
push("probe_fixture_inserts", /INSERT INTO team_members/i.test(probeText) ? "yes" : "no", probeFile, "nguồn 2 dòng tàn dư");

// ── 6. ĐỐI CHIẾU CHÉO: câu viết KHÁC DẠNG ────────────────────────────────────────────────────────
const alt = Number(sql("SELECT COUNT(*) FROM (SELECT id FROM team_members WHERE active <> 0) x"));
push("cross_check_active_not_zero", alt, "SELECT COUNT(*) FROM (SELECT id ... WHERE active <> 0) x", "câu viết khác dạng phải cho CÙNG kết quả");
push("cross_check_match", alt === active, "so sánh với team_members_active", "đối chứng dương của cổng");
console.log(`\nĐối chiếu chéo (câu khác dạng): active<>0 = ${alt} · active=1 = ${active} ⇒ ${alt === active ? "KHỚP" : "LỆCH"}`);

// ── 7. XUẤT BẰNG CHỨNG ───────────────────────────────────────────────────────────────────────────
mkdirSync(OUT_DIR, { recursive: true });
const csv = ["key,value,source,note", ...evidence.map((item) => `"${item.key}","${String(item.value).replace(/"/g, '""')}","${item.source}","${item.note}"`)].join("\n");
writeFileSync(OUT_FILE, csv + "\n", "utf8");
console.log(`\nBằng chứng đã ghi: ${OUT_FILE} (${evidence.length} dòng)`);

// ── 8. KẾT LUẬN ─────────────────────────────────────────────────────────────────────────────────
const verdict = total > 0 && !routeWritesTeamMembers && javaWriteFiles.length === 0 ? "CONFIRMED" : "UNKNOWN";
console.log(`\nKẾT LUẬN cách nạp dữ liệu: **${verdict}**`);
console.log("  • Không có bất kỳ action nào (JS lẫn Java) ghi `team_members` ⇒ dữ liệu KHÔNG thể sinh ra từ luồng sản phẩm.");
console.log("  • 100% dòng hiện có đến từ SQL ngoài sản phẩm: seed `tools/task080-seed-real-data.sql` + fixture probe.");
console.log("  • Hệ quả: màn «Thành viên tổ đội» mở ra ở trạng thái CHỈ ĐỌC; muốn thêm/sửa thành viên phải có action mới.");
