// PHASE 7 (`AD-14`) — HỢP ĐỒNG: 8/8 TRƯỜNG NHẬT KÝ KIỂM TOÁN, CỘT `result` GHI THẬT Ở CẢ 2 ĐƯỜNG.
//
// Nguyên văn `docs/25_TODO_ROADMAP.md` dòng `AD-14`: «Thêm: hành động · module · thực thể · mã thực thể ·
// thời gian · IP · kết quả · metadata» (phụ thuộc `AD-13`).
//
// LỊCH SỬ CỦA MỤC NÀY (để không hiểu sai trạng thái):
//   • Đợt audit trước: `audit_logs` thiếu cột `result` + `metadata`, và lượt đó BỊ CẤM migration ⇒ mục ghi
//     **BLOCKED** (`docs/agent-progress/AD-14-AUDIT-LOG-KET-QUA-METADATA-BLOCKED.md`).
//   • 21/09/2026 — CHỈ ĐẠO NGƯỜI DÙNG: «AD-14 thêm result» ⇒ mở lại mục này: THÊM cột `result` (ADDITIVE),
//     còn `metadata` = **CHÍNH `before_json`/`after_json`** (người dùng chốt: KHÔNG thêm cột `metadata`).
//
// ĐO Ở 4 TẦNG (lượt này CẤM build/khởi động dịch vụ ⇒ DOM chỉ có nghĩa sau khi build):
//   A. HÀM THUẦN — `app/screens/admin-governance-pure.ts` phải khai 8 trường CÓ NGUỒN (8/8), trong đó
//      `result` → `audit_logs.result`, `metadata` → ánh xạ `before_json`/`after_json`.
//   B. HAI ĐƯỜNG GHI — câu INSERT vào `audit_logs` của `scripts/system-route.mjs` và `AuditLogAdapter.java`
//      phải CÓ cột `result`; quy ước giá trị: `ok` (đã thực hiện xong) · `denied` (bị từ chối) · `failed` (lỗi).
//   C. MIGRATION — drizzle + Flyway: CHỈ THÊM cột, KHÔNG xoá bảng/cột/dữ liệu.
//   D. UI — màn nhật ký hiển thị «Kết quả» từ `result` và «Metadata» = 2 khối JSON (ánh xạ), KHÔNG bịa.
//
// Chạy riêng:  node --test tests/ad14-audit-result.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import esbuild from "esbuild";

const root = new URL("../", import.meta.url);
const read = (p) => readFileSync(new URL(p, root), "utf8");
const pure = read("app/screens/admin-governance-pure.ts");
const ROUTE = read("scripts/system-route.mjs");
const JAVA = read("java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/AuditLogAdapter.java");
const PAGE = read("app/page.tsx");
const DRIZZLE = "drizzle/0162_ad14_audit_log_result.sql";
const FLYWAY = "java-backend/infrastructure/src/main/resources/db/migration/V22__ad14_audit_log_result.sql";
const TASK_DOC = "docs/agent-progress/TASK-107.md";

function loadPure(names) {
  const start = pure.search(/^\/\/ AD-PURE-BEGIN$/m);
  const end = pure.search(/^\/\/ AD-PURE-END$/m);
  const block = pure.slice(start + "// AD-PURE-BEGIN".length, end).replace(/^export /gm, "");
  const js = esbuild.transformSync(block, { loader: "ts" }).code;
  return new Function(`${js}\nreturn { ${names.join(", ")} };`)();
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════
// A. HÀM THUẦN — 8/8 trường CÓ NGUỒN
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════
test("AD-14 — 8/8 trường nguyên văn đều CÓ NGUỒN (không còn «chưa có nguồn» cho kết quả/metadata)", () => {
  const { AUDIT_FIELDS, auditAvailableFields, auditBlockedFields, auditHasResultAndMetadata } = loadPure(
    ["AUDIT_FIELDS", "auditAvailableFields", "auditBlockedFields", "auditHasResultAndMetadata"]);
  assert.deepEqual(AUDIT_FIELDS.map((f) => f.label),
    ["Hành động", "Module", "Thực thể", "Mã thực thể", "Thời gian", "IP", "Kết quả", "Metadata"],
    "Phải khai ĐÚNG 8 nhãn nguyên văn, đúng thứ tự yêu cầu");
  assert.equal(auditAvailableFields().length, 8, "8/8 trường có nguồn sau khi THÊM cột `result`");
  assert.deepEqual(auditBlockedFields(), [], "Không còn trường nào bị chặn");
  assert.equal(auditHasResultAndMetadata(), true, "Cổng 8/8 phải trả TRUE");
  const result = AUDIT_FIELDS.find((f) => f.key === "result");
  assert.equal(result.source, "audit_logs.result", "`Kết quả` phải trỏ ĐÚNG cột `audit_logs.result` (cột THẬT)");
  const metadata = AUDIT_FIELDS.find((f) => f.key === "metadata");
  assert.match(String(metadata.source), /before_json/, "`Metadata` phải trỏ 2 cột JSON sẵn có (ánh xạ theo chỉ đạo người dùng)");
  assert.match(String(metadata.source), /after_json/);
});

test("AD-14 — ĐỐI CHỨNG ÂM: gán cột khác cho 2 trường này vẫn phải bị cổng BẮT", () => {
  const { AUDIT_FIELDS } = loadPure(["AUDIT_FIELDS"]);
  const fakeGate = (fields) => fields.every((f) => f.available)
    && fields.filter((f) => ["result", "metadata"].includes(f.key))
      .every((f) => /^audit_logs\.(result|before_json|after_json)/.test(String(f.source)));
  const faked = AUDIT_FIELDS.map((f) => f.key === "result" ? { ...f, source: "audit_logs.change_detail" } : f);
  assert.equal(fakeGate(faked), false, "[đối chứng âm] `Kết quả` gán vào `change_detail` ⇒ BẮT được");
  assert.equal(fakeGate(AUDIT_FIELDS.map((f) => ({ ...f, available: true, source: null }))), false,
    "[đối chứng âm] chỉ bật `available=true` mà không có tên cột ⇒ HỎNG");
  assert.equal(fakeGate(AUDIT_FIELDS), true, "Dữ liệu THẬT phải qua được cổng");
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════
// B. HAI ĐƯỜNG GHI — `result` phải được ghi THẬT, KHÔNG để rỗng
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════
test("AD-14 — MỌI câu INSERT `audit_logs` (JS + Java) đều có cột `result`", () => {
  for (const [name, text] of [["scripts/system-route.mjs", ROUTE], ["AuditLogAdapter.java", JAVA]]) {
    const inserts = [...text.matchAll(/INSERT INTO audit_logs \(([^)]*)\)/gs)].map((m) => m[1].replace(/\s+/g, " "));
    assert.ok(inserts.length > 0, `${name} phải có ít nhất 1 câu INSERT audit_logs`);
    for (const columns of inserts) {
      assert.match(columns, /\bresult\b/, `${name}: INSERT thiếu cột \`result\` ⇒ cột sẽ rỗng`);
      assert.doesNotMatch(columns, /\bmetadata\b/, `${name}: KHÔNG được thêm cột \`metadata\` (metadata = ánh xạ before_json/after_json)`);
    }
  }
});

test("AD-14 — quy ước giá trị `result` có TÀI LIỆU trong mã + đường JS nhận tham số (không hard-code rỗng)", () => {
  assert.match(ROUTE, /async function audit\([^)]*result\s*=\s*"ok"/, "`audit()` phải có tham số `result` mặc định `ok` (đường ghi chính)");
  assert.match(ROUTE, /"ok"/, "Phải có giá trị `ok` trong mã");
  assert.match(JAVA, /RESULT_OK\s*=\s*"ok"/, "Java phải khai hằng quy ước `RESULT_OK = \"ok\"`");
  for (const [name, text] of [["scripts/system-route.mjs", ROUTE], ["AuditLogAdapter.java", JAVA]]) {
    assert.match(text, /denied|failed/, `${name}: phải ghi rõ từ vựng của 'result' ('ok' · 'denied' · 'failed') để người sau không tự nghĩ mã mới`);
  }
});

test("AD-14 — BOOTSTRAP phải TRẢ `result` cho UI (cả 2 đường đọc)", () => {
  assert.match(ROUTE, /SELECT al\.id,al\.action[\s\S]{0,200}al\.result/, "JS bootstrap phải select `al.result`");
  assert.match(ROUTE, /al\.before_json AS beforeJson,al\.after_json AS afterJson/, "JS bootstrap phải trả 2 khối JSON làm nguồn Metadata");
  const BOOTSTRAP = read("java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/BootstrapDataAdapter.java");
  assert.match(BOOTSTRAP, /al\.result AS result[\s\S]{0,120}FROM audit_logs/, "Java bootstrap phải select `al.result AS result`");
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════
// C. MIGRATION — CHỈ THÊM
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════
test("AD-14 — migration THÊM cột `result` (drizzle + Flyway), KHÔNG xoá gì", () => {
  assert.ok(existsSync(new URL(DRIZZLE, root)), `Thiếu migration SQLite ${DRIZZLE}`);
  assert.ok(existsSync(new URL(FLYWAY, root)), `Thiếu migration MySQL/Flyway ${FLYWAY}`);
  for (const [ten, sql] of [["drizzle", read(DRIZZLE)], ["flyway", read(FLYWAY)]]) {
    assert.match(sql, /ALTER TABLE\s+`?audit_logs`?\s+ADD COLUMN\s+`?result`?/i, `${ten}: phải ADD COLUMN \`result\` vào audit_logs`);
    assert.match(sql, /DEFAULT\s+'{0,2}ok'{0,2}/i, `${ten}: phải có DEFAULT 'ok' để dòng ghi thiếu tham số vẫn KHÔNG rỗng`);
    assert.doesNotMatch(sql, /DROP\s+TABLE/i, `${ten}: KHÔNG được DROP TABLE`);
    assert.doesNotMatch(sql, /DROP\s+COLUMN/i, `${ten}: KHÔNG được DROP COLUMN`);
    assert.doesNotMatch(sql, /DELETE\s+FROM/i, `${ten}: KHÔNG được DELETE dữ liệu`);
    assert.doesNotMatch(sql, /TRUNCATE/i, `${ten}: KHÔNG được TRUNCATE`);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════
// D. UI — hiển thị «Kết quả» thật + «Metadata» = ánh xạ 2 khối JSON
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════
test("AD-14 — UI nhật ký hiển thị «Kết quả» từ `a.result` + «Metadata» ánh xạ before/after", () => {
  assert.match(PAGE, /Kết quả: <b>\{a\.result/, "Chi tiết nhật ký phải hiển thị `result` THẬT của bản ghi");
  assert.match(PAGE, /chưa ghi kết quả|không ghi kết quả/, "Bản ghi cũ thiếu `result` ⇒ phải nói rõ «chưa ghi», KHÔNG bịa giá trị");
  assert.match(PAGE, /Metadata[^\n]{0,200}(after_json[^\n]{0,120}before_json|before_json[^\n]{0,120}after_json)/,
    "«Metadata» phải nói rõ là ÁNH XẠ từ `before_json` + `after_json`");
  assert.doesNotMatch(PAGE, /bảng <code>audit_logs<\/code> không có cột <code>result<\/code>/, "Không được giữ câu «không có cột result» (đã thêm cột)");
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════
// E. HỒ SƠ + ROADMAP — mục đóng được thì cột TT phải là `**DONE**` nguyên văn
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════
test("AD-14 — hồ sơ TASK-107 + cột TT roadmap = `**DONE**` (cổng đếm nguyên văn)", () => {
  assert.ok(existsSync(new URL(TASK_DOC, root)), `Thiếu hồ sơ ${TASK_DOC}`);
  const doc = readFileSync(new URL(TASK_DOC, root), "utf8");
  assert.match(doc, /result/, "Hồ sơ phải nêu cột `result`");
  assert.match(doc, /metadata/, "Hồ sơ phải ghi rõ ánh xạ metadata → before_json/after_json");
  assert.match(doc, /ok/, "Hồ sơ phải ghi quy ước giá trị `result`");
  const roadmap = read("docs/25_TODO_ROADMAP.md");
  const row = roadmap.split(/\r?\n/).find((line) => /^\|\s*`AD-14`\s*\|/.test(line));
  assert.ok(row, "Không tìm thấy dòng `AD-14` trong roadmap");
  const cells = row.split("|").map((c) => c.trim());
  assert.equal(cells[cells.length - 2], "**DONE**", "Cột TT của `AD-14` phải ĐÚNG nguyên văn `**DONE**` (không thêm chữ)");
});
