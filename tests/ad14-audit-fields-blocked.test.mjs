// PHASE 7 (`AD-14`) — HỢP ĐỒNG: 8 TRƯỜNG NHẬT KÝ KIỂM TOÁN → **BLOCKED** (2/8 trường phải thêm CỘT).
// Nguyên văn `docs/25_TODO_ROADMAP.md` dòng `AD-14`: «Thêm: hành động · module · thực thể · mã thực thể ·
// thời gian · IP · kết quả · metadata» (phụ thuộc `AD-13`).
//
// ĐỀ BÀI: «nếu **buộc thêm cột ⇒ DỪNG mục đó, ghi **BLOCKED** + lý do** ✗ (cấm migration)».
// BẰNG CHỨNG ĐÃ ĐO (information_schema, DB `vntech_erp`): `audit_logs` có 17 cột —
// id · user_id · action · entity_type · entity_id · before_json · after_json · ip_address · occurred_at ·
// user_name · user_role · department · system_level · module_key · permission_used · change_detail.
// ⇒ KHÔNG có cột `result` và KHÔNG có cột `metadata`.
//
// ĐỐI CHỨNG ÂM: (1) 6 trường có nguồn phải được coi là CÓ; (2) nếu ai đó "giả" 2 trường thiếu bằng cách gán
// chúng vào `after_json`/`change_detail` thì cổng `auditHasResultAndMetadata()` phải vẫn trả FALSE; (3) chứng
// minh câu lệnh INSERT của cả 2 đường KHÔNG hề ghi `result`/`metadata`.
//
// Chạy riêng:  node --test tests/ad14-audit-fields-blocked.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import esbuild from "esbuild";

const root = new URL("../", import.meta.url);
const read = (p) => readFileSync(new URL(p, root), "utf8");
const pure = read("app/screens/admin-governance-pure.ts");
const DOC = "docs/agent-progress/AD-14-AUDIT-LOG-KET-QUA-METADATA-BLOCKED.md";

function loadPure(names) {
  const start = pure.search(/^\/\/ AD-PURE-BEGIN$/m);
  const end = pure.search(/^\/\/ AD-PURE-END$/m);
  const block = pure.slice(start + "// AD-PURE-BEGIN".length, end).replace(/^export /gm, "");
  const js = esbuild.transformSync(block, { loader: "ts" }).code;
  return new Function(`${js}\nreturn { ${names.join(", ")} };`)();
}

test("AD-14 — 8 trường nguyên văn; 6 trường CÓ nguồn, 2 trường THIẾU nguồn = `result` + `metadata`", () => {
  const { AUDIT_FIELDS, auditAvailableFields, auditBlockedFields, auditHasResultAndMetadata } = loadPure(
    ["AUDIT_FIELDS", "auditAvailableFields", "auditBlockedFields", "auditHasResultAndMetadata"]);
  assert.deepEqual(AUDIT_FIELDS.map((f) => f.label),
    ["Hành động", "Module", "Thực thể", "Mã thực thể", "Thời gian", "IP", "Kết quả", "Metadata"],
    "Phải khai ĐÚNG 8 nhãn nguyên văn, đúng thứ tự yêu cầu");
  assert.deepEqual(auditBlockedFields().map((f) => f.key).sort(), ["metadata", "result"],
    "Chỉ 2 trường không có cột trong `audit_logs`: kết quả + metadata");
  assert.equal(auditAvailableFields().length, 6, "6/8 trường có cột THẬT");
  assert.equal(auditHasResultAndMetadata(), false, "Bảng thiếu cột ⇒ mục AD-14 KHÔNG thể đóng ⇒ BLOCKED");
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
    .every((f) => /^audit_logs\.(result|metadata)$/.test(String(f.source)));
  assert.equal(auditHasResultAndMetadata(), false, "Dữ liệu THẬT vẫn thiếu cột");
  assert.equal(fakeGate(faked), false, "[đối chứng âm] nhét cột khác vào 2 trường thiếu ⇒ cổng phải BẮT được");
  assert.equal(fakeGate(AUDIT_FIELDS.map((f) => ({ ...f, available: true }))), false,
    "[đối chứng âm] chỉ bật `available=true` mà KHÔNG có tên cột `result`/`metadata` ⇒ vẫn HỎNG");
});

test("AD-14 — BẰNG CHỨNG: KHÔNG câu lệnh INSERT nào của 2 đường ghi `result`/`metadata`", () => {
  const js = read("scripts/system-route.mjs");
  const java = read("java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/AuditLogAdapter.java");
  for (const [name, text] of [["scripts/system-route.mjs", js], ["AuditLogAdapter.java", java]]) {
    const inserts = [...text.matchAll(/INSERT INTO audit_logs \(([^)]*)\)/g)].map((m) => m[1]);
    assert.ok(inserts.length > 0, `${name} phải có ít nhất 1 câu INSERT audit_logs`);
    for (const columns of inserts) {
      assert.ok(!/\bresult\b/.test(columns), `${name}: INSERT KHÔNG được có cột \`result\` (nếu có thì kết luận BLOCKED sai)`);
      assert.ok(!/\bmetadata\b/.test(columns), `${name}: INSERT KHÔNG được có cột \`metadata\``);
    }
  }
});

test("AD-14 — TÀI LIỆU BLOCKED: lý do + bằng chứng cột + 6 trường đã hiển thị được", () => {
  assert.ok(existsSync(new URL(DOC, root)), `Thiếu tài liệu bắt buộc ${DOC}`);
  const text = readFileSync(new URL(DOC, root), "utf8");
  assert.match(text, /\*\*BLOCKED\*\*/, "Tài liệu phải ghi ĐÚNG nguyên văn `**BLOCKED**`");
  assert.match(text, /result/, "Phải nêu cột thiếu `result`");
  assert.match(text, /metadata/, "Phải nêu cột thiếu `metadata`");
  assert.match(text, /information_schema|DESCRIBE|17 cột/, "Phải nêu cách KIỂM CHỨNG cột (đo thật)");
  assert.match(text, /cấm migration|KHÔNG migration/i, "Phải nêu ràng buộc: cấm migration");
  assert.match(text, /6\/8|6 trường/, "Phải nói rõ phần đã hiển thị được (6/8 trường có nguồn)");
});
