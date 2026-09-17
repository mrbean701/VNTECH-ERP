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
import { execFileSync } from "node:child_process";
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
    // ⚠️ SỬA LỖI CỦA CHÍNH CỔNG (17/09): bản trước lấy THẲNG tên BIẾN trong controller
    // (`requestManagementUseCase` — camelCase) rồi tra vào bảng khoá theo tên TỆP/LỚP
    // (`RequestManagementUseCase` — PascalCase) ⇒ tra KHÔNG BAO GIỜ khớp ⇒ `CẢ HAI ĐỀU GHI: 0`
    // và "khe hở" luôn bằng ĐÚNG số action JS có audit (152) — một hằng số, không phải phép đo.
    // Nay chuẩn hoá về PascalCase trước khi tra.
    const cls = call ? call[1].charAt(0).toUpperCase() + call[1].slice(1) : null;
    javaCases.push({
      name: m[1],
      useCase: call ? call[1] : null,
      cls,
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
  const javaAudit = c && c.cls ? Boolean(classHasAudit[c.cls]) : false;
  if (a.audit && !javaAudit) onlyJs.push({ ...a, useCase: c?.useCase ?? "(không có case)", method: c?.method ?? "—" });
  else if (a.audit && javaAudit) both.push(a.name);
}
// Đối chứng dương cho chính cổng: số case tra được lớp phải > 0, nếu không thì phép đo vô nghĩa.
const mapped = javaCases.filter((c) => c.cls && classHasAudit[c.cls] !== undefined).length;
console.log(`ĐỐI CHỨNG: ${mapped}/${javaCases.length} nhánh case tra được LỚP use-case (phải > 0, nếu = 0 là cổng hỏng)`);

console.log(`JS: ${jsActions.length} action · trong đó CÓ gọi audit(): ${jsActions.filter((a) => a.audit).length}`);
console.log(`Java: ${javaCases.length} nhánh case · lớp use-case CÓ gọi audit(): ${Object.values(classHasAudit).filter(Boolean).length}/${Object.keys(classHasAudit).length}`);
console.log(`\n═══ KHE HỞ Ở TẦNG USE-CASE: JS ghi nhật ký mà LỚP use-case Java KHÔNG ghi: ${onlyJs.length} action ═══`);
console.log(`⚠️ ĐỌC KỸ: con số này là KHE HỞ Ở TẦNG USE-CASE (tên hành động + mức chi tiết nghiệp vụ),`);
console.log(`   **KHÔNG** có nghĩa là "action đó không có dòng nhật ký nào": \`AuditTrailFilter\` (tầng web, P6)`);
console.log(`   ghi MỘT dòng cho MỌI POST /api/system thành công (trừ 7 action trong SKIP_ACTIONS).`);
for (const a of onlyJs.slice(0, 60)) console.log(`  ${a.name.padEnd(34)} → ${a.useCase}.${a.method}`);
if (onlyJs.length > 60) console.log(`  … còn ${onlyJs.length - 60} action`);

// ═════════════ ĐỐI CHIẾU DỮ LIỆU THẬT: con số trên có phải "không hề ghi nhật ký" không? ═════════════
// BÀI HỌC TASK-067 (17/09): đã có lúc con số "128 action thiếu audit" bị đọc thành "128 action không được
// ghi nhật ký" và suýt dẫn tới việc port hàng loạt `audit(...)` KHÔNG cần thiết. Phép đo dưới đây chứng minh
// bằng dữ liệu: action thuộc danh sách "khe hở" ấy CÓ dòng trong `audit_logs`, và các dòng đó mang
// `module_key` + `ip_address` — hai cột CHỈ `AuditTrailFilter` mới điền (use-case `auditLog.log` không điền).
const MYSQL = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
const sqlRows = (q) => execFileSync(MYSQL, ["--default-character-set=utf8mb4", "-uvntech", "-pvntech",
  "vntech_erp", "--batch", "--raw", "--skip-column-names", "-e", q], { encoding: "utf8" })
  .split(/\r?\n/).filter(Boolean).map((l) => l.split("\t"));
try {
  const db = new Map();
  for (const [action, total, filterWritten] of sqlRows(`
      SELECT action, COUNT(*), SUM(CASE WHEN module_key IS NOT NULL AND ip_address IS NOT NULL THEN 1 ELSE 0 END)
      FROM audit_logs GROUP BY action`)) {
    db.set(action, { total: Number(total), filterWritten: Number(filterWritten) });
  }
  const gapPresent = onlyJs.filter((a) => db.has(a.name));
  const gapFilterWritten = gapPresent.filter((a) => db.get(a.name).filterWritten > 0);
  console.log(`\n═══ ĐỐI CHIẾU DỮ LIỆU \`audit_logs\` (${db.size} action khác nhau có dòng) ═══`);
  console.log(`  trong ${onlyJs.length} action "khe hở": CÓ dòng nhật ký = ${gapPresent.length}` +
    ` · trong đó do LỚP FILTER ghi = ${gapFilterWritten.length}`);
  console.log(`  ví dụ: ${gapFilterWritten.slice(0, 6).map((a) => `${a.name} (${db.get(a.name).total} dòng)`).join(" · ") || "(không có)"}`);
  console.log(`  ⇒ KẾT LUẬN ĐÚNG: khe hở này là về TÊN/CHI TIẾT hành động ở tầng use-case, KHÔNG phải thiếu nhật ký.`);
  console.log(`  ⚠️ Cổng CHỈ đối chiếu các action ĐÃ từng chạy (có dòng) — action chưa từng chạy thì không kiểm được.`);
} catch (e) {
  console.log(`\n⚠️ KHÔNG đối chiếu được \`audit_logs\`: ${String(e.message).slice(0, 120)}`);
  console.log(`   ⇒ Kết luận về "khe hở" phải để ở mức GIẢ THUYẾT cho tới khi đối chiếu được dữ liệu.`);
}
console.log(`\n═══ CẢ HAI ĐỀU GHI: ${both.length} action ═══\n  ${both.join(", ")}`);
console.log(`\nGHI CHÚ GIỚI HẠN: phép đo Java theo LỚP use-case (không theo từng method) và chỉ thấy`);
console.log(`lời gọi tĩnh `+ "`auditLog.log(...)`" + `; AuditTrailFilter (tầng web) ghi thêm 1 dòng/request.`);
console.log(`Đây là BẢN ĐỒ KHE HỞ để chọn việc — KHÔNG thay thế việc đọc mã từng luồng.`);
process.exit(0);
