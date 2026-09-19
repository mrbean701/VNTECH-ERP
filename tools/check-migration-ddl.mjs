#!/usr/bin/env node
// VNTECH ERP V5.3.0 — KIỂM DDL MIGRATION (guard chống tái phát lỗi "Illegal mix of collations" ⇒ UI 500)
//
// VÌ SAO CÓ TỆP NÀY:
//   Ngày 20/09/2026, audit PHASE 3 (`T-04`) phát hiện migration `0155_…work_item_comment_participant.sql`
//   tạo bảng với **mọi cột là `text` và KHÔNG có `COLLATE`**, đồng thời thiếu `ENGINE=InnoDB … COLLATE=…`.
//   Cột `text` không khai COLLATE sẽ lấy collation **mặc định của server** (`utf8mb4_0900_ai_ci`) ⇒ khi JOIN
//   với bảng cũ (`utf8mb4_unicode_ci`) ⇒ `Illegal mix of collations` ⇒ **TOÀN BỘ UI trả 500** (đã từng xảy ra).
//   Phép kiểm này TỰ ĐỘNG hoá việc kiểm tay đó cho **mọi migration về sau**.
//
// CÁCH DÙNG:
//   node tools/check-migration-ddl.mjs                 # quét toàn bộ, KHÔNG chặn (chỉ báo cáo) — mặc định
//   node tools/check-migration-ddl.mjs --strict        # có vi phạm ⇒ exit 1 (dùng cho cổng CI)
//   node tools/check-migration-ddl.mjs --only=0155     # chỉ kiểm file chứa chuỗi '0155'
//   node tools/check-migration-ddl.mjs --json          # xuất JSON để máy đọc
//
// QUY TẮC KIỂM (mỗi `CREATE TABLE`):
//   R1. Phải có `COLLATE=utf8mb4_unicode_ci` (hoặc trong thân cột, hoặc ở mệnh đề kết bảng).
//   R2. Cột kiểu `text` PHẢI kèm `COLLATE` (nếu không ⇒ lấy mặc định server ⇒ RỦI RO CAO).
//   R3. Cột id/khoá (`id`, `*_id`) PHẢI là `varchar(...)`, KHÔNG được là `text` trơn.
//   R4. Mốc thời gian (`*_at`, `created_at`, `updated_at`) PHẢI là `datetime(3)` / `timestamp`, KHÔNG `text`.
//   R5. Kết bảng PHẢI có `ENGINE=InnoDB` và `COLLATE=utf8mb4_unicode_ci`.
//
// LƯU Ý: migration CŨ (trước 20/09/2026) có thể vi phạm vì viết theo khuôn drizzle khác (drizzle sinh
// `text` cho mọi cột). Vì vậy mặc định là **chế độ báo cáo**, và `--since=0155` để chỉ chặn từ mốc mới.

import { readdirSync, readFileSync } from "node:fs";
import { join, basename } from "node:path";

const args = process.argv.slice(2);
const strict = args.includes("--strict");
const asJson = args.includes("--json");
const only = (args.find((a) => a.startsWith("--only=")) || "").split("=")[1] || "";
const since = (args.find((a) => a.startsWith("--since=")) || "").split("=")[1] || "";
const dir = args.find((a) => a.startsWith("--dir="))?.split("=")[1] || "drizzle";

/** Tách nội dung thành các khối CREATE TABLE (kèm tên bảng + thân khối). */
function tablesOf(sql) {
  const out = [];
  const re = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?([A-Za-z0-9_]+)`?\s*\(([\s\S]*?)\)\s*([^;]*);/gi;
  let m;
  while ((m = re.exec(sql)) !== null) out.push({ name: m[1], body: m[2], tail: m[3] || "" });
  return out;
}

/** Chạy 5 quy tắc trên 1 bảng; trả về danh sách vi phạm. */
function checkTable(t) {
  const v = [];
  const all = `${t.body}\n${t.tail}`;
  if (!/COLLATE\s*=\s*utf8mb4_unicode_ci/i.test(all)) v.push("R1 thiếu COLLATE=utf8mb4_unicode_ci");
  // R2 — cột text thiếu COLLATE
  for (const line of t.body.split(/\r?\n/)) {
    if (/`?\w+`?\s+text\b/i.test(line) && !/COLLATE/i.test(line)) {
      v.push(`R2 cột text thiếu COLLATE: ${line.trim().slice(0, 70)}`);
    }
  }
  // R3 — id/khoá là text trơn
  for (const line of t.body.split(/\r?\n/)) {
    if (/`?(id|\w+_id)`?\s+text\b/i.test(line)) v.push(`R3 khoá dùng text (phải varchar): ${line.trim().slice(0, 70)}`);
  }
  // R4 — mốc thời gian là text
  for (const line of t.body.split(/\r?\n/)) {
    if (/`?\w*_at`?\s+text\b/i.test(line)) v.push(`R4 mốc thời gian dùng text (phải datetime(3)): ${line.trim().slice(0, 70)}`);
  }
  // R5 — thiếu ENGINE/COLLATE ở kết bảng
  if (!/ENGINE\s*=\s*InnoDB/i.test(t.tail)) v.push("R5 thiếu ENGINE=InnoDB ở kết bảng");
  if (!/COLLATE\s*=\s*utf8mb4_unicode_ci/i.test(t.tail)) v.push("R5 thiếu COLLATE=utf8mb4_unicode_ci ở kết bảng");
  return v;
}

const files = readdirSync(dir)
  .filter((f) => f.endsWith(".sql"))
  .filter((f) => (only ? f.includes(only) : true))
  .filter((f) => (since ? f >= since : true))
  .sort();

const report = [];
for (const f of files) {
  const sql = readFileSync(join(dir, f), "utf8");
  if (!/CREATE\s+TABLE/i.test(sql)) continue;
  for (const t of tablesOf(sql)) {
    const v = checkTable(t);
    if (v.length) report.push({ file: f, table: t.name, violations: v });
  }
}

if (asJson) {
  console.log(JSON.stringify({ scanned: files.length, offenders: report.length, report }, null, 2));
} else {
  console.log("═".repeat(96));
  console.log("  KIỂM DDL MIGRATION — chống lỗi 'Illegal mix of collations' (UI 500)");
  console.log(`  Quét ${files.length} tệp trong '${dir}'${only ? ` (lọc: ${only})` : ""}${since ? ` (từ: ${since})` : ""}`);
  console.log("═".repeat(96));
  if (!report.length) {
    console.log("  ✅ KHÔNG có vi phạm.");
  } else {
    for (const r of report) {
      console.log(`\n  ❌ ${r.file}  →  bảng \`${r.table}\``);
      for (const x of r.violations) console.log(`       • ${x}`);
    }
    console.log(`\n  ⇒ ${report.length} bảng có vi phạm / ${files.length} tệp đã quét.`);
    console.log("  (mặc định KHÔNG chặn — thêm --strict để exit 1; migration cũ có thể vi phạm do khuôn drizzle)");
  }
  console.log("═".repeat(96));
}

if (strict && report.length) process.exit(1);
