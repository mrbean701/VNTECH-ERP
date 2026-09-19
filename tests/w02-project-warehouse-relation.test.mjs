// PHASE 5 (`W-02`) — HỢP ĐỒNG AUDIT QUAN HỆ `Project : Warehouse` = **1:N**.
//
// Nguyên văn `docs/25_TODO_ROADMAP.md` dòng `W-02`: «Audit quan hệ Project : Warehouse — xác nhận 1:N».
// Tệp này biến KẾT LUẬN AUDIT thành bất biến CHẠY ĐƯỢC, gồm 3 tầng bằng chứng:
//   (1) TÀI LIỆU  — kết luận CONFIRMED phải nằm trong tệp audit, kèm 5 chữ ký bằng chứng.
//   (2) CODE      — FK N:1 khai báo ở `drizzle/0000_sour_gamma_corps.sql`; **CẤM** UNIQUE trên `project_id`
//                   ở MỌI migration drizzle + `V1__baseline.sql`; route ĐỌC/GHI theo `project_id`.
//   (3) CSDL THẬT — đọc trực tiếp MySQL: schema (không FK cưỡng chế, index thường), số dòng THẬT,
//                   tồn tại dự án có ≥ 2 kho, tồn tại kho `project_id IS NULL`, 0 dòng mồ côi.
//
// ⚠️ CHÍNH SÁCH BỎ QUA CÓ KIỂM SOÁT: đây là CỔNG TÀI LIỆU HOÁ audit, không phải cổng vận hành.
//    Khi `mysql.exe` không kết nối được, các ca CSDL in `BỎ QUA (không kết nối CSDL)` **kèm lý do** và
//    KHÔNG được coi là ĐẠT; các ca TÀI LIỆU + CODE **vẫn bắt buộc ĐẠT** ⇒ kết luận không thể trôi khỏi bằng chứng.
//    Nhờ vậy cổng không "xanh giả" mà cũng không đỏ vì lý do môi trường.
//
// LƯU Ý: tệp này CỐ Ý không nằm trong `package.json` → `test:regression` giữ nguyên số ca.
// Chạy riêng:  node --test tests/w02-project-warehouse-relation.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const AUDIT_FILE = "docs/agent-progress/W-02-AUDIT-PROJECT-WAREHOUSE.md";
const audit = read(AUDIT_FILE);
const drizzle0000 = read("drizzle/0000_sour_gamma_corps.sql");
const baseline = read("java-backend/infrastructure/src/main/resources/db/migration/V1__baseline.sql");
const route = read("scripts/system-route.mjs");

// ── Kết nối CSDL THẬT (đúng cách các probe khác của dự án đang làm: mysql.exe + tài khoản vntech) ──
const MYSQL = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
const DB = "vntech_erp";
let dbOk = true;
let dbError = "";
function sql(query) {
  return execFileSync(MYSQL, ["-uvntech", "-pvntech", "--default-character-set=utf8mb4", "-N", "-B", DB, "-e", query],
    { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 30000 }).trim();
}
try {
  sql("SELECT 1;");
} catch (error) {
  dbOk = false;
  dbError = String(error && error.message ? error.message : error).split("\n")[0].slice(0, 160);
}
const dbTest = (name, fn) => test(name, { skip: dbOk ? false : `BỎ QUA (không kết nối CSDL): ${dbError}` }, fn);

// ── (1) TÀI LIỆU: kết luận audit ────────────────────────────────────────────────────────────────
test("W-02 — kết luận audit là CONFIRMED (1:N) và nêu rõ hai chiều đo được của 1:N", () => {
  assert.match(audit, /##\s*✅\s*\*\*CONFIRMED\*\*/,
    "Tệp audit chưa có kết luận `## ✅ **CONFIRMED**` — W-02 chỉ được ĐÓNG khi kết luận rõ ràng, không 'UNKNOWN' mơ hồ");
  assert.match(audit, /1\s*:\s*N/, "Kết luận phải nói thẳng tỉ lệ 1:N");
  assert.doesNotMatch(audit, /^\s*>\s*##\s*✅\s*\*\*UNKNOWN/m, "Không được vừa CONFIRMED vừa UNKNOWN");
  // Hai chiều của 1:N phải được ĐO, không chỉ suy luận: N>1 (một dự án nhiều kho) và N=0 (kho không thuộc dự án).
  assert.match(audit, /N\s*=\s*2/, "Thiếu chiều N>1 (một dự án có ≥ 2 kho)");
  assert.match(audit, /N\s*=\s*0/, "Thiếu chiều N=0 (kho KHÔNG thuộc dự án nào — quan hệ tuỳ chọn)");
});

test("W-02 — tệp audit dẫn ĐÚNG 5 chữ ký bằng chứng (drizzle · Flyway · route · Java · CSDL thật)", () => {
  const signatures = [
    "drizzle/0000_sour_gamma_corps.sql",
    "V1__baseline.sql",
    "scripts/system-route.mjs",
    "ProjectManagementUseCase.java",
    "information_schema",
  ];
  for (const signature of signatures) {
    assert.ok(audit.includes(signature), `Thiếu chữ ký bằng chứng: ${signature}`);
  }
  assert.ok(audit.includes("SHOW CREATE TABLE"), "Thiếu bằng chứng schema thật (SHOW CREATE TABLE)");
});

test("W-02 — audit nói thẳng GIỚI HẠN: FK không được MySQL cưỡng chế (drizzle khai báo, baseline chỉ có INDEX)", () => {
  assert.match(audit, /KHÔNG được (MySQL|Flyway)[^\n]*cưỡng chế/i,
    "Audit phải nói rõ FK chỉ là KHAI BÁO ở tầng drizzle, KHÔNG được DB cưỡng chế — nếu không sẽ là trích dẫn sai");
  assert.ok(audit.includes("KEY `warehouses_project_idx` (`project_id`)"), "Thiếu nguyên văn INDEX thường trên project_id");
});

// ── (2) CODE: FK N:1 khai báo, CẤM UNIQUE trên project_id ────────────────────────────────────────
test("W-02 — drizzle khai báo FK `warehouses.project_id → projects.id` và cho phép NULL (⇒ 0..N)", () => {
  assert.match(drizzle0000, /`project_id` text,/,
    "Cột `warehouses.project_id` phải cho phép NULL (1:N nghĩa là kho KHÔNG thuộc dự án vẫn hợp lệ)");
  assert.match(drizzle0000, /FOREIGN KEY \(`project_id`\) REFERENCES `projects`\(`id`\)/,
    "Thiếu khai báo FK project_id → projects(id) trong drizzle 0000");
  // FK nằm ở CỘT CON của warehouses ⇒ cardinality N:1 nhìn từ projects ⇒ 1 dự án : N kho.
  const tableStart = drizzle0000.indexOf("CREATE TABLE `warehouses`");
  const tableEnd = drizzle0000.indexOf("--> statement-breakpoint", tableStart);
  const table = drizzle0000.slice(tableStart, tableEnd);
  assert.ok(table.includes("PRIMARY KEY"),
    "Bảng warehouses phải khai PRIMARY KEY (id) — khoá chính là id kho, KHÔNG phải project_id");
});

test("W-02 — ĐỐI CHỨNG ÂM: KHÔNG có UNIQUE trên `warehouses.project_id` ở BẤT KỲ migration drizzle nào", () => {
  const files = readdirSync(resolve(root, "drizzle")).filter((name) => name.endsWith(".sql"));
  assert.ok(files.length > 50, `Phải quét được toàn bộ migration drizzle (đọc được ${files.length} tệp)`);
  const offenders = [];
  for (const name of files) {
    // Bỏ CHÚ THÍCH trước khi soi — nhiều migration ghi chú bằng tiếng Việt có thể chứa chữ UNIQUE.
    const text = read(`drizzle/${name}`).replace(/--[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
    // CHỈ bắt ràng buộc UNIQUE đơn cột trên `project_id` (UNIQUE(project_id) / UNIQUE(project_id, …KHÔNG)),
    // tức KHÔNG bắt UNIQUE hỗn hợp `UNIQUE(project_id, contract_no)` của các bảng khác — đó không phải 1:1.
    const patterns = [
      /UNIQUE\s*\(\s*project_id\s*\)/gi,
      /UNIQUE\s+(?:INDEX|KEY)[^;()]*\(\s*project_id\s*\)/gi,
    ];
    for (const pattern of patterns) {
      const hits = text.match(pattern) || [];
      for (const hit of hits) offenders.push(`drizzle/${name}: ${hit.trim()}`);
    }
  }
  assert.deepEqual(offenders, [],
    `Tìm thấy ràng buộc UNIQUE đơn cột trên project_id ⇒ mô hình là 1:1, KHÔNG phải 1:N:\n  ${offenders.join("\n  ")}`);
});

test("W-02 — ĐỐI CHỨNG ÂM: `V1__baseline.sql` có INDEX thường (không UNIQUE) trên project_id và KHÔNG có FK", () => {
  const block = baseline.slice(baseline.indexOf("CREATE TABLE `warehouses`"));
  const tableEnd = block.indexOf("ENGINE=InnoDB");
  const ddl = block.slice(0, tableEnd);
  assert.ok(ddl.includes("`project_id` VARCHAR(64) NULL"), "Cột project_id trong baseline phải NULL-able");
  assert.doesNotMatch(ddl, /FOREIGN KEY|CONSTRAINT/i,
    "Baseline KHÔNG khai FK (dự án cố ý không cưỡng chế FK ở MySQL) — audit phải phản ánh đúng điều này");
  const after = block.slice(0, block.indexOf("CREATE TABLE `work_item_events`"));
  assert.match(after, /CREATE INDEX `warehouses_project_idx` ON `warehouses` \(`project_id`\);/,
    "Thiếu INDEX thường trên project_id — đây là bằng chứng 1:N ở tầng schema MySQL");
  assert.doesNotMatch(after, /CREATE UNIQUE INDEX[^\n]*warehouses[^\n]*project_id/i,
    "KHÔNG được có UNIQUE INDEX trên warehouses.project_id");
});

test("W-02 — route ĐỌC `warehouses[]` theo project_id và CSDL `LIMIT 1` chứng minh tác giả biết là N kho/dự án", () => {
  assert.match(route, /SELECT w\.id,w\.code,w\.name,w\.type,w\.project_id AS projectId,p\.code AS projectCode,p\.name AS projectName FROM warehouses w LEFT JOIN projects p ON p\.id=w\.project_id/,
    "Thiếu đường ĐỌC thật `warehouses[]` (payload của màn/tồn kho)");
  assert.match(route, /project_id IS NULL OR project_id IN \(/,
    "Thiếu nhánh kho dùng chung (`project_id IS NULL`) ⇒ quan hệ phải là TUỲ CHỌN");
  assert.match(route, /SELECT id,code,name FROM warehouses WHERE project_id=\? AND type='site' ORDER BY created_at LIMIT 1/,
    "Thiếu `LIMIT 1` — nếu là 1:1 thì không cần cắt 'kho đầu tiên'; đây là bằng chứng ngược ủng hộ 1:N");
  assert.match(route, /INSERT INTO warehouses \(id,code,name,type,project_id,parent_warehouse_id,keeper_user_id,active,created_at,updated_at\)/,
    "Thiếu nhánh GHI kho (INSERT INTO warehouses) — W-03 dựa vào nhánh này");
  // Kho TỔ ĐỘI cũng mang project_id ⇒ MỘT dự án có nhiều kho cùng lúc là luồng thật.
  const teamWarehouseInsert = 'Kho tổ đội · ${name}`,"team",projectId';
  assert.ok(route.includes(teamWarehouseInsert),
    "Thiếu bằng chứng kho TỔ ĐỘI gắn cùng project_id ⇒ một dự án có nhiều kho");
  const insertBranches = route.match(/INSERT INTO warehouses \(id,code,name,type,project_id/g) || [];
  assert.ok(insertBranches.length >= 4,
    `Phải có ≥ 4 nhánh INSERT kho cùng một project_id (import/import mới/create_project/update_project) — đọc được ${insertBranches.length}`);
});

// ── (3) CSDL THẬT ───────────────────────────────────────────────────────────────────────────────
dbTest("W-02 — CSDL THẬT: `project_id` NULL-able, UNIQUE chỉ trên `code`, INDEX thường trên `project_id`, KHÔNG FK cưỡng chế", () => {
  const ddl = sql("SHOW CREATE TABLE warehouses;");
  assert.match(ddl, /`project_id` varchar\(64\)( COLLATE [a-z0-9_]+)? DEFAULT NULL/,
    "CSDL thật phải cho phép project_id NULL");
  assert.match(ddl, /UNIQUE KEY `warehouses_code_uidx` \(`code`\)/,
    "UNIQUE phải nằm trên `code` (mã kho) — KHÔNG phải project_id");
  assert.match(ddl, /KEY `warehouses_project_idx` \(`project_id`\)/,
    "Phải có KEY thường trên project_id (bằng chứng 1:N ở tầng schema)");
  assert.doesNotMatch(ddl, /CONSTRAINT[^\n]*FOREIGN KEY/i,
    "Audit kết luận FK KHÔNG được cưỡng chế — nếu CSDL thật CÓ FK thì kết luận phải được sửa, không được để test xanh");

  const fks = sql(`SELECT constraint_name,column_name,referenced_table_name FROM information_schema.key_column_usage WHERE table_schema='${DB}' AND table_name='warehouses' AND referenced_table_name IS NOT NULL;`);
  assert.equal(fks, "", "information_schema KHÔNG được trả FK nào cho bảng warehouses (khớp kết luận audit)");
});

dbTest("W-02 — CSDL THẬT: một dự án có ≥ 2 kho (chiều N>1) VÀ có kho `project_id IS NULL` (chiều N=0)", () => {
  const perProject = sql("SELECT p.code, COUNT(w.id) FROM projects p LEFT JOIN warehouses w ON w.project_id=p.id GROUP BY p.id,p.code;");
  const pairs = perProject.split("\n").filter(Boolean).map((line) => line.split("\t"));
  assert.ok(pairs.length >= 2, `Phải đọc được ≥ 2 dự án, đọc được ${pairs.length}`);
  const counts = pairs.map(([, count]) => Number(count));
  assert.ok(counts.some((count) => count >= 2),
    `Phải tồn tại dự án có ≥ 2 kho (chiều N>1 của 1:N). Đo được: ${perProject.replace(/\n/g, " · ")}`);
  // Bằng chứng NGƯỢC: nếu mọi dự án ≤ 1 kho thì mô hình có thể là 1:1 và audit phải hạ kết luận.
  const orphanProjects = pairs.filter(([, count]) => Number(count) === 0).map(([code]) => code);
  assert.ok(orphanProjects.length === 0 || counts.some((c) => c >= 2),
    "Nếu có dự án 0 kho thì BẮT BUỘC còn dự án ≥ 2 kho để không phải là 1:0");

  const central = sql("SELECT code,type FROM warehouses WHERE project_id IS NULL;");
  assert.ok(central.includes("KHO-TONG"),
    `Phải tồn tại kho KHÔNG thuộc dự án (Kho Tổng) ⇒ quan hệ là tuỳ chọn. Đo được: "${central}"`);
});

dbTest("W-02 — CSDL THẬT: 0 dòng mồ côi (`project_id` không trỏ tới dự án nào) + số dòng khớp tệp audit", () => {
  const orphans = sql("SELECT COUNT(*) FROM warehouses w LEFT JOIN projects p ON p.id=w.project_id WHERE w.project_id IS NOT NULL AND p.id IS NULL;");
  assert.equal(Number(orphans), 0, "Có dòng warehouses.project_id trỏ tới dự án KHÔNG tồn tại");

  const warehouses = Number(sql("SELECT COUNT(*) FROM warehouses;"));
  const projects = Number(sql("SELECT COUNT(*) FROM projects;"));
  const linked = Number(sql("SELECT COUNT(*) FROM warehouses WHERE project_id IS NOT NULL;"));
  assert.ok(warehouses >= 1, "Phải có ít nhất 1 kho để phép đo có nghĩa");
  assert.ok(linked >= 2, `Phải có ≥ 2 kho gắn dự án (cần cho chiều N>1), đo được ${linked}`);

  // Số trong TÀI LIỆU phải KHỚP số đo lại — audit không được trôi khỏi dữ liệu.
  assert.ok(audit.includes(`\`warehouses\`=4`) || audit.includes("**4**"),
    "Tệp audit phải ghi lại số kho đo được (4)");
  assert.match(audit, /`PRJ-DEMO-01 → 2`/, "Tệp audit phải ghi lại chiều N>1 đo được (PRJ-DEMO-01 → 2 kho)");
  assert.ok(warehouses === 4 && projects === 2 && linked === 3
    , `Số đo lại khác con số đã chép trong audit (kho=${warehouses}, dự án=${projects}, kho gắn dự án=${linked}) ⇒ phải cập nhật lại tệp audit`);
});
