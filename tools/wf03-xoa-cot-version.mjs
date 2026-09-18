// [PHASE 8 · WF-03] XOÁ cột DEAD `workflow_definitions.version` (đã chứng minh: KHÔNG nơi nào ĐỌC; chỉ INSERT vì NOT NULL).
// 3 sửa đổi: (1) migration Flyway mới V19 drop cột; (2) test AdminGovernanceIntegrationTest: bỏ `version` khỏi INSERT;
//            (3) schema-h2.sql (schema test): bỏ dòng khai báo `version`.
// Mỏ neo + TỰ CHỐI; mặc định CHẠY KHÔ.
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const APPLY = process.argv.includes("--apply");
const fails = [];
const edits = [];

// (1) migration mới
const MIG = "java-backend/infrastructure/src/main/resources/db/migration/V19__drop_workflow_definitions_version.sql";
if (existsSync(MIG)) fails.push(`[1] migration đã tồn tại: ${MIG}`);
else edits.push({
  kind: "create", path: MIG,
  content: [
    "-- [PHASE 8 · WF-03] Xoá cột DEAD workflow_definitions.version",
    "-- Bằng chứng: KHÔNG nơi nào đọc cột này (không getInt/AS/select); chỉ có INSERT liệt kê vì cột NOT NULL DEFAULT 1.",
    "-- Lộ trình WF-03: \"Dùng cột workflow_definitions.version hoặc xoá nếu không dùng\" => đã chứng minh KHÔNG DÙNG => XOÁ.",
    "ALTER TABLE workflow_definitions DROP COLUMN version;",
    "",
  ].join("\n"),
});

// (2) test: bỏ `version,` khỏi INSERT
const T = "java-backend/web/src/test/java/com/vntech/erp/web/controller/AdminGovernanceIntegrationTest.java";
{
  const s = readFileSync(T, "utf8");
  const a = "(id,code,name,is_default,active,version,sort_order,created_at,updated_at)";
  const b = "(id,code,name,is_default,active,sort_order,created_at,updated_at)";
  const n = s.split(a).length - 1;
  if (n !== 1) fails.push(`[2] mỏ neo INSERT trong test xuất hiện ${n} lần (cần 1)`);
  else edits.push({ kind: "replace", path: T, from: a, to: b });
}

// (3) schema-h2.sql: bỏ dòng `version` trong CREATE TABLE workflow_definitions
const H = "java-backend/web/src/test/resources/schema-h2.sql";
{
  const s = readFileSync(H, "utf8");
  const start = s.indexOf("CREATE TABLE IF NOT EXISTS `workflow_definitions`");
  if (start < 0) fails.push("[3] không thấy CREATE TABLE workflow_definitions trong schema-h2.sql");
  else {
    const end = s.indexOf(");", start);
    const block = s.slice(start, end);
    const m = block.match(/\n\s*`version`[^\n]*/);
    if (!m) fails.push("[3] không thấy dòng `version` trong block workflow_definitions (có thể đã xoá)");
    else edits.push({ kind: "replace", path: H, from: m[0], to: "" });
  }
}

console.log("=== KẾ HOẠCH SỬA ===");
for (const e of edits) console.log(`  ${e.kind === "create" ? "TẠO " : "SỬA "} ${e.path}${e.from ? `\n      - '${e.from.trim().slice(0, 90)}'` : ""}`);
if (fails.length) { console.error("KHÔNG GHI — điều kiện không đạt:"); for (const f of fails) console.error("  ✖ " + f); process.exit(1); }
if (!APPLY) { console.log("CHẠY KHÔ: sẵn sàng ghi (thêm --apply)."); process.exit(0); }
for (const e of edits) {
  if (e.kind === "create") { writeFileSync(e.path, e.content); console.log("ĐÃ TẠO " + e.path); }
  else { const s = readFileSync(e.path, "utf8"); writeFileSync(e.path, s.replace(e.from, e.to)); console.log("ĐÃ SỬA " + e.path); }
}
