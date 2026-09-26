// PHASE 7 (`AD-14`) — HỢP ĐỒNG *LỊCH SỬ → HIỆN TẠI*: 8 TRƯỜNG NHẬT KÝ KIỂM TOÁN.
// Nguyên văn `docs/25_TODO_ROADMAP.md` dòng `AD-14`: «Thêm: hành động · module · thực thể · mã thực thể ·
// thời gian · IP · kết quả · metadata» (phụ thuộc `AD-13`).
//
// ⚠️ TỆP NÀY ĐÃ ĐƯỢC CẬP NHẬT 21/09/2026 (không còn là hợp đồng BLOCKED):
//   • Đợt audit trước: `audit_logs` THIẾU cột `result` + `metadata`, lượt đó BỊ CẤM migration ⇒ mục ghi
//     **BLOCKED** (hồ sơ `docs/agent-progress/AD-14-AUDIT-LOG-KET-QUA-METADATA-BLOCKED.md`).
//   • 21/09/2026 — CHỈ ĐẠO NGƯỜI DÙNG: «AD-14 thêm result» ⇒ MIGRATION ADDITIVE thêm cột `result`
//     (drizzle `0162` + Flyway `V22`). `metadata` KHÔNG thêm cột: người dùng chốt metadata = **CHÍNH
//     `before_json` + `after_json`**. Hợp đồng mới (8/8 + 2 đường ghi `result`) nằm ở
//     `tests/ad14-audit-result.test.mjs`; tệp này giữ vai trò: (a) 8 nhãn nguyên văn, (b) ĐỐI CHỨNG ÂM chống
//     «giả nguồn», (c) chốt rằng KHÔNG có cột `metadata` nào được thêm (tránh dữ liệu trùng nghĩa).
//
// Chạy riêng:  node --test tests/ad14-audit-fields-blocked.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import esbuild from "esbuild";

const root = new URL("../", import.meta.url);
const read = (p) => readFileSync(new URL(p, root), "utf8");
const pure = read("app/screens/admin-governance-pure.ts");
const TASK_DOC = "docs/agent-progress/TASK-107.md";

function loadPure(names) {
  const start = pure.search(/^\/\/ AD-PURE-BEGIN$/m);
  const end = pure.search(/^\/\/ AD-PURE-END$/m);
  const block = pure.slice(start + "// AD-PURE-BEGIN".length, end).replace(/^export /gm, "");
  const js = esbuild.transformSync(block, { loader: "ts" }).code;
  return new Function(`${js}\nreturn { ${names.join(", ")} };`)();
}

test("AD-14 — 8 trường nguyên văn; NAY 8/8 trường CÓ nguồn (BLOCKED cũ đã mở bằng migration ADDITIVE)", () => {
  const { AUDIT_FIELDS, auditAvailableFields, auditBlockedFields, auditHasResultAndMetadata } = loadPure(
    ["AUDIT_FIELDS", "auditAvailableFields", "auditBlockedFields", "auditHasResultAndMetadata"]);
  assert.deepEqual(AUDIT_FIELDS.map((f) => f.label),
    ["Hành động", "Module", "Thực thể", "Mã thực thể", "Thời gian", "IP", "Kết quả", "Metadata"],
    "Phải khai ĐÚNG 8 nhãn nguyên văn, đúng thứ tự yêu cầu");
  assert.deepEqual(auditBlockedFields().map((f) => f.key).sort(), [],
    "Không còn trường nào thiếu nguồn");
  assert.equal(auditAvailableFields().length, 8, "8/8 trường có nguồn THẬT");
  assert.equal(auditHasResultAndMetadata(), true, "Cổng 8/8 phải trả TRUE sau khi thêm cột `result`");
  for (const field of auditAvailableFields()) {
    assert.match(String(field.source), /^audit_logs\./, "Trường có nguồn phải ghi rõ tên cột `audit_logs.<cột>`");
  }
});

test("AD-14 — ĐỐI CHỨNG ÂM: gán «kết quả/metadata» vào cột khác KHÔNG được coi là có nguồn", () => {
  const { AUDIT_FIELDS, auditHasResultAndMetadata } = loadPure(["AUDIT_FIELDS", "auditHasResultAndMetadata"]);
  // Kịch bản "lách" hay gặp: coi `after_json` là metadata và `change_detail` là kết quả.
  const faked = AUDIT_FIELDS.map((f) => f.key === "metadata" ? { ...f, source: "audit_logs.after_json", available: true }
    : f.key === "result" ? { ...f, source: "audit_logs.change_detail", available: true } : f);
  const fakeGate = (fields) => fields.every((f) => f.available) && fields.filter((f) => ["result", "metadata"].includes(f.key))
    .every((f) => /^audit_logs\.(result|before_json \+ audit_logs\.after_json)/.test(String(f.source)));
  assert.equal(auditHasResultAndMetadata(), true, "Dữ liệu THẬT đủ 8/8");
  assert.equal(fakeGate(faked), false, "[đối chứng âm] nhét cột khác vào 2 trường thiếu ⇒ cổng phải BẮT được");
  assert.equal(fakeGate(AUDIT_FIELDS.map((f) => ({ ...f, available: true, source: null }))), false,
    "[đối chứng âm] chỉ bật `available=true` mà KHÔNG có tên cột ⇒ vẫn HỎNG");
  assert.equal(fakeGate(AUDIT_FIELDS), true, "Nguồn THẬT phải qua được cổng (chống test rỗng)");
});

test("AD-14 — BẰNG CHỨNG: cả 2 đường ghi CÓ cột `result`, KHÔNG đường nào thêm cột `metadata`", () => {
  const js = read("scripts/system-route.mjs");
  const java = read("java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/AuditLogAdapter.java");
  for (const [name, text] of [["scripts/system-route.mjs", js], ["AuditLogAdapter.java", java]]) {
    const inserts = [...text.matchAll(/INSERT INTO audit_logs \(([^)]*)\)/gs)].map((m) => m[1].replace(/\s+/g, " "));
    assert.ok(inserts.length > 0, `${name} phải có ít nhất 1 câu INSERT audit_logs`);
    for (const columns of inserts) {
      assert.ok(/\bresult\b/.test(columns), `${name}: INSERT PHẢI có cột \`result\` (AD-14 đã mở)`);
      assert.ok(!/\bmetadata\b/.test(columns), `${name}: INSERT KHÔNG được có cột \`metadata\` (metadata = ánh xạ 2 cột JSON)`);
    }
  }
});

test("AD-14 — HỒ SƠ hiện tại: TASK-107 ghi cột `result` + ánh xạ metadata + quy ước giá trị", () => {
  assert.ok(existsSync(new URL(TASK_DOC, root)), `Thiếu hồ sơ ${TASK_DOC}`);
  const text = readFileSync(new URL(TASK_DOC, root), "utf8");
  assert.match(text, /result/, "Phải nêu cột `result`");
  assert.match(text, /metadata/, "Phải nêu ánh xạ `metadata` → `before_json` + `after_json`");
  assert.match(text, /ok/, "Phải ghi quy ước giá trị `result` (`ok`)");
  assert.match(text, /information_schema|DESCRIBE|audit_logs/, "Phải nêu cách KIỂM CHỨNG cột (đo thật)");
  assert.match(text, /ADDITIVE|CHỈ THÊM|chỉ thêm/i, "Phải nêu ràng buộc: migration chỉ THÊM");
  assert.match(text, /8\/8|8 trường/, "Phải nói rõ 8/8 trường có nguồn");
});
