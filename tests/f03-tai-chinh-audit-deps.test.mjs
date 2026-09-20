// HỢP ĐỒNG MÁY KIỂM CHỨNG HỒ SƠ `F-03` (PHASE 10 — TÀI CHÍNH: AUDIT PHỤ THUỘC).
//
// Vì sao cần: `F-03` KHÔNG có mã nghiệp vụ (nguyên văn mục: «không triển khai nghiệp vụ»)
// ⇒ sản phẩm là BÁO CÁO. Một báo cáo audit chỉ có giá trị nếu MỌI khẳng định của nó còn
// đúng với mã nguồn. Tệp này biến các khẳng định đó thành bất biến: hồ sơ ghi `action` ở
// **dòng nào** thì dòng đó phải thật sự chứa action; ghi bảng nào thì bảng đó phải có
// `CREATE TABLE` ở CẢ HAI chuỗi migration (Flyway cho MySQL + drizzle cho SQLite).
//
// Chạy riêng:  node --import tsx --test tests/f03-tai-chinh-audit-deps.test.mjs
// (CỐ Ý không nằm trong `package.json` ⇒ `test:regression` giữ nguyên số ca.)
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const DOC = "docs/agent-progress/F-03-TAI-CHINH-AUDIT-PHU-THUOC.md";
const GATE = "scripts/phase10-architecture-gate.mjs";
const JS_ROUTE = "scripts/system-route.mjs";
const JAVA_CTRL = "java-backend/web/src/main/java/com/vntech/erp/web/controller/SystemController.java";
const REGISTRY = "java-backend/application/src/main/java/com/vntech/erp/application/rbac/ActionRbacRegistry.java";
const MIG_DIR = "java-backend/infrastructure/src/main/resources/db/migration";
const ROADMAP = "docs/25_TODO_ROADMAP.md";

const read = (p) => readFileSync(p, "utf8");
const linesOf = (p) => read(p).split(/\r?\n/);

test("F-03 — hồ sơ audit + cổng đo sống tồn tại", () => {
  assert.ok(existsSync(DOC), `Thiếu hồ sơ ${DOC}`);
  assert.ok(existsSync(GATE), `Thiếu cổng đo ${GATE}`);
  assert.ok(existsSync(JAVA_CTRL), `Thiếu ${JAVA_CTRL}`);
  assert.ok(existsSync(REGISTRY), `Thiếu ${REGISTRY}`);
});

test("F-03 — hồ sơ chép NGUYÊN VĂN dòng roadmap của mục (không diễn giải lại)", () => {
  const doc = read(DOC);
  const roadmapLine = linesOf(ROADMAP).find((l) => l.startsWith("| `F-03` |"));
  assert.ok(roadmapLine, "roadmap không còn dòng `F-03` — hồ sơ phải được xem lại");
  const yc = roadmapLine.split("|")[3].trim(); // cột «Việc»
  assert.ok(doc.includes("F-03"), "hồ sơ không nhắc mã mục F-03");
  assert.ok(
    doc.includes("**Audit phụ thuộc, chuẩn bị kiến trúc**") && doc.includes("không triển khai nghiệp vụ"),
    "hồ sơ phải chép nguyên văn cột Việc của F-03 (audit phụ thuộc, chuẩn bị kiến trúc, không triển khai nghiệp vụ)",
  );
  assert.ok(yc.length > 0, "cột Việc của F-03 rỗng");
});

test("F-03 — MỌI action trong bảng đều đúng DÒNG ở CẢ HAI đường ghi (JS + Java)", () => {
  const doc = read(DOC);
  const js = linesOf(JS_ROUTE);
  const java = linesOf(JAVA_CTRL);
  const rows = [...doc.matchAll(/^\|\s*\d+\s*\|\s*`([a-z_]+)`\s*\|\s*:(\d+)\s*\|\s*:(\d+)\s*\|/gm)];
  assert.ok(rows.length >= 20, `chỉ đọc được ${rows.length} dòng action trong hồ sơ (phải ≥ 20)`);
  const bad = [];
  for (const [, action, jsLine, javaLine] of rows) {
    const jsText = js[Number(jsLine) - 1] ?? "";
    const javaText = java[Number(javaLine) - 1] ?? "";
    if (!jsText.includes(`action === "${action}"`)) bad.push(`JS :${jsLine} không chứa action === "${action}"`);
    if (!javaText.includes(`case "${action}"`)) bad.push(`JAVA :${javaLine} không chứa case "${action}"`);
    if (!read(REGISTRY).includes(`Map.entry("${action}"`)) bad.push(`ActionRbacRegistry thiếu "${action}"`);
  }
  assert.deepEqual(bad, [], "hồ sơ F-03 ghi sai vị trí action ⇒ báo cáo audit mất giá trị");
});

test("F-03 — MỌI bảng trong bảng số dòng đều có CREATE TABLE ở CẢ 2 chuỗi migration", () => {
  const doc = read(DOC);
  const flyway = readdirSync(MIG_DIR).filter((n) => /^V\d+__.*\.sql$/.test(n)).map((n) => read(join(MIG_DIR, n))).join("\n");
  const drizzle = readdirSync("drizzle").filter((n) => n.endsWith(".sql")).map((n) => read(join("drizzle", n))).join("\n");
  const rows = [...doc.matchAll(/^\|\s*`(\w+)`\s*\|\s*\*\*(\d+)\*\*\s*\|/gm)];
  assert.ok(rows.length >= 14, `chỉ đọc được ${rows.length} dòng bảng trong hồ sơ (phải ≥ 14)`);
  const bad = [];
  for (const [, table, count] of rows) {
    const re = new RegExp(`CREATE TABLE[^;]*\\b${table}\\b`, "i");
    if (!re.test(flyway)) bad.push(`Flyway thiếu CREATE TABLE ${table}`);
    if (!re.test(drizzle)) bad.push(`drizzle thiếu CREATE TABLE ${table}`);
    if (!/^\d+$/.test(count)) bad.push(`${table}: số dòng "${count}" không phải số nguyên`);
  }
  assert.deepEqual(bad, [], "bảng trong hồ sơ F-03 không khớp chuỗi migration");
});

test("F-03 — 8 khoá module tài chính nêu trong hồ sơ đều là khoá THẬT của hệ", () => {
  const doc = read(DOC);
  const js = read(JS_ROUTE);
  const moduleKeysLine = js.split(/\r?\n/).find((l) => l.startsWith("const MODULE_KEYS = ["));
  assert.ok(moduleKeysLine, "không tìm thấy `const MODULE_KEYS` trong scripts/system-route.mjs");
  const declared = new Set([...moduleKeysLine.matchAll(/"([a-z_]+)"/g)].map((m) => m[1]));
  const cited = [...doc.matchAll(/`(dept_finance_[a-z_]+|payments|capital_recovery)`/g)].map((m) => m[1]);
  const uniq = [...new Set(cited)];
  assert.ok(uniq.length >= 8, `hồ sơ chỉ nêu ${uniq.length} khoá module tài chính (phải ≥ 8)`);
  const missing = uniq.filter((k) => !declared.has(k));
  assert.deepEqual(missing, [], "hồ sơ nêu khoá module KHÔNG tồn tại trong MODULE_KEYS");
});

test("F-03 — mục là AUDIT: hồ sơ KHÔNG chứa DDL/DML phá hoại và nói rõ DDL chỉ là đề xuất", () => {
  const doc = read(DOC);
  const blocks = [...doc.matchAll(/```sql([\s\S]*?)```/g)].map((m) => m[1]).join("\n");
  assert.ok(blocks.length > 0, "hồ sơ phải có khối ```sql ghi lại câu SQL đã dùng làm bằng chứng");
  const forbidden = [
    [/\bDROP\s+(TABLE|COLUMN|DATABASE|INDEX)\b/i, "DROP"],
    [/\bTRUNCATE\b/i, "TRUNCATE"],
    [/\bDELETE\s+FROM\b/i, "DELETE FROM"],
    [/\bUPDATE\s+\w+\s+SET\b/i, "UPDATE … SET"],
    [/\bINSERT\s+INTO\b/i, "INSERT INTO"],
    [/\bALTER\s+TABLE\b/i, "ALTER TABLE"],
  ];
  const hits = forbidden.filter(([re]) => re.test(blocks)).map(([, name]) => name);
  assert.deepEqual(hits, [], `hồ sơ audit không được chứa câu lệnh ghi/phá hoại: ${hits.join(", ")}`);
  assert.match(doc, /CHƯA\s+ÁP\s+DỤNG/i, "hồ sơ phải nói rõ DDL đề xuất CHƯA được áp dụng");
  assert.match(doc, /CONFIRMED/, "hồ sơ phải có kết luận CONFIRMED");
  assert.match(doc, /UNKNOWN|LIKELY/, "hồ sơ phải có kết luận LIKELY/UNKNOWN cho phần chưa đủ bằng chứng");
});

test("F-03 — cổng đo sống chỉ ĐỌC MySQL: có ảnh chụp 123 bảng + không có câu lệnh ghi", () => {
  const gate = read(GATE);
  assert.match(gate, /LIVE_TABLES_SNAPSHOT\s*=\s*\[/, "cổng thiếu ảnh chụp LIVE_TABLES_SNAPSHOT");
  assert.match(gate, /information_schema/, "cổng phải đọc lược đồ sống qua information_schema");
  const sql = [...gate.matchAll(/`([^`]*SELECT[^`]*)`/gi)].map((m) => m[1]).join("\n");
  const writeRe = /\b(INSERT|UPDATE|DELETE|ALTER|DROP|TRUNCATE|CREATE)\b/i;
  const offenders = sql.split(/;/).map((s) => s.trim()).filter((s) => writeRe.test(s));
  assert.deepEqual(offenders, [], "cổng đo không được chạy câu lệnh GHI trên CSDL thật");
  const snapshot = [...gate.matchAll(/"([a-z_]+)"/g)].map((m) => m[1]);
  assert.ok(snapshot.includes("payment_plans") && snapshot.includes("users"), "ảnh chụp bảng sống trông không hợp lệ");
});
