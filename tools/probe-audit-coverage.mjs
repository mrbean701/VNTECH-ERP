// Cổng đo TASK-048 — ĐỘ PHỦ `audit(...)` (nhật ký kiểm toán) giữa monolith JS và backend Java.
//
// VÌ SAO: `audit_logs` là dấu vết pháp lý của hệ thống. JS gọi `audit(...)` ở RẤT NHIỀU action;
// Java mới chỉ có vài chỗ. Câu hỏi cần TRẢ LỜI BẰNG SỐ: action nào JS có ghi mà Java không ghi?
//
// CÁCH ĐO (2 tầng, nói rõ giới hạn):
//   1. JS: quét từng khối `if (action === "X") { … }` → có gọi `audit(` bên trong không?
//   2. Java: quét `case "X" -> { … }` trong SystemController → lấy tên use-case + method được gọi,
//      rồi kiểm **tệp use-case đó** có gọi `auditLog.log(`/`auditLog.logReturningId(` không.
//      ⇒ ĐÂY LÀ PHÉP ĐO THEO LỚP (class-level), KHÔNG phải theo từng method: một lớp có audit ở method A
//      vẫn bị tính là "có" cho method B. Phải đọc mã để kết luận từng method.
//
// Chạy: node tools/probe-audit-coverage.mjs
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const read = (p) => readFileSync(p, "utf8");
const js = read("scripts/system-route.mjs");

// ---------- 1) JS: action nào có audit ----------
const jsActions = [];
{
  const re = /if\s*\(\s*action\s*===\s*"([a-z0-9_]+)"\s*\)/g;
  const hits = [];
  let m;
  while ((m = re.exec(js)) !== null) hits.push({ name: m[1], at: m.index });
  for (let i = 0; i < hits.length; i++) {
    const end = i + 1 < hits.length ? hits[i + 1].at : js.length;
    const body = js.slice(hits[i].at, end);
    jsActions.push({ name: hits[i].name, audit: /await\s+audit\(|audit\(user\.id/.test(body) });
  }
}

// ---------- 2) Java: quét use-case ----------
const appDir = "java-backend/application/src/main/java/com/vntech/erp/application/service";
const classHasAudit = {};
const classFile = {};
for (const f of readdirSync(appDir).filter((f) => f.endsWith(".java"))) {
  const src = read(join(appDir, f));
  const cls = f.replace(/\.java$/, "");
  classHasAudit[cls] = /auditLog\.(log|logReturningId)\(/.test(src);
  classFile[cls] = src;
}

// controller: case → use-case + method
const ctrl = read("java-backend/web/src/main/java/com/vntech/erp/web/controller/SystemController.java");
const javaCases = [];
{
  const re = /case\s+"([a-z0-9_]+)"\s*->\s*\{([\s\S]*?)\n\s*\}/g;
  let m;
  while ((m = re.exec(ctrl)) !== null) {
    const body = m[2];
    const call = body.match(/([a-zA-Z]+UseCase)\.([a-zA-Z0-9_]+)\s*\(/);
    javaCases.push({
      name: m[1],
      useCase: call ? call[1] : null,
      method: call ? call[2] : null,
      hasCase: true,
    });
  }
}
const caseByName = new Map(javaCases.map((c) => [c.name, c]));

// ---------- 3) Kết luận ----------
const onlyJs = [];
const both = [];
for (const a of jsActions) {
  const c = caseByName.get(a.name);
  const javaAudit = c && c.useCase ? Boolean(classHasAudit[c.useCase]) : false;
  if (a.audit && !javaAudit) onlyJs.push({ ...a, useCase: c?.useCase ?? "(không có case)", method: c?.method ?? "—" });
  else if (a.audit && javaAudit) both.push(a.name);
}

console.log(`JS: ${jsActions.length} action · trong đó CÓ gọi audit(): ${jsActions.filter((a) => a.audit).length}`);
console.log(`Java: ${javaCases.length} nhánh case · lớp use-case CÓ gọi audit(): ${Object.values(classHasAudit).filter(Boolean).length}/${Object.keys(classHasAudit).length}`);
console.log(`\n═══ KHE HỞ: JS ghi nhật ký mà lớp use-case Java KHÔNG ghi: ${onlyJs.length} action ═══`);
for (const a of onlyJs.slice(0, 60)) console.log(`  ${a.name.padEnd(34)} → ${a.useCase}.${a.method}`);
if (onlyJs.length > 60) console.log(`  … còn ${onlyJs.length - 60} action`);
console.log(`\n═══ CẢ HAI ĐỀU GHI: ${both.length} action ═══\n  ${both.join(", ")}`);
console.log(`\nGHI CHÚ GIỚI HẠN: phép đo Java theo LỚP use-case (không theo từng method) và chỉ thấy`);
console.log(`lời gọi tĩnh `+ "`auditLog.log(...)`" + `; AuditTrailFilter (tầng web) ghi thêm 1 dòng/request.`);
console.log(`Đây là BẢN ĐỒ KHE HỞ để chọn việc — KHÔNG thay thế việc đọc mã từng luồng.`);
process.exit(0);
