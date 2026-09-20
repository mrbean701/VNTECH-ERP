// HỢP ĐỒNG MÁY KIỂM CHỨNG HỒ SƠ KIẾN TRÚC `F-04` + `F-05` (PHASE 10 — HÀNH CHÍNH).
//
// Vì sao cần: `F-04`/`F-05` là **CHUẨN BỊ KIẾN TRÚC** (nguyên văn PHASE 10: «CHỈ AUDIT + CHUẨN BỊ
// KIẾN TRÚC») ⇒ sản phẩm là thiết kế, KHÔNG phải mã nghiệp vụ. Bất biến phải khoá:
//   1. Bảng đề xuất KHÔNG được trùng tên bảng ĐANG CÓ (trùng ⇒ migration sẽ đạp lên dữ liệu thật).
//   2. Mặt API đề xuất phải là action THẬT SỰ MỚI (chưa có ở JS route / Java controller / ma trận quyền).
//   3. DDL đề xuất phải ADDITIVE thuần: chỉ `CREATE TABLE IF NOT EXISTS` + `ALTER TABLE … ADD`,
//      KHÔNG `DROP`/`TRUNCATE`/`DELETE`/`UPDATE` (ràng buộc cứng của người dùng).
//   4. Mọi `REFERENCES <bảng>` phải trỏ vào bảng ĐANG CÓ hoặc bảng vừa đề xuất (không trỏ hư không).
//   5. Hồ sơ phải nói rõ **CHƯA ÁP DỤNG** + **không triển khai nghiệp vụ** — nếu không, người đọc
//      tưởng module HR đã chạy thật.
//
// Chạy riêng:  node --import tsx --test tests/f04-f05-hanh-chinh-lich-kien-truc.test.mjs
// (CỐ Ý không nằm trong `package.json` ⇒ `test:regression` giữ nguyên số ca.)
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const F04 = "docs/agent-progress/F-04-HANH-CHINH-KIEN-TRUC.md";
const F05 = "docs/agent-progress/F-05-LICH-KIEN-TRUC.md";
const GATE = "scripts/phase10-architecture-gate.mjs";
const JS_ROUTE = "scripts/system-route.mjs";
const JAVA_CTRL = "java-backend/web/src/main/java/com/vntech/erp/web/controller/SystemController.java";
const REGISTRY = "java-backend/application/src/main/java/com/vntech/erp/application/rbac/ActionRbacRegistry.java";
const ROADMAP = "docs/25_TODO_ROADMAP.md";

const read = (p) => readFileSync(p, "utf8");
const sqlBlocks = (text) => [...text.matchAll(/```sql([\s\S]*?)```/g)].map((m) => m[1]).join("\n;\n");
// Bảng ĐANG CÓ lấy từ ẢNH CHỤP trong cổng đo (cổng tự đối chiếu ảnh chụp ↔ MySQL thật).
function liveTables() {
  const gate = read(GATE);
  const m = gate.match(/LIVE_TABLES_SNAPSHOT\s*=\s*\[([\s\S]*?)\];/);
  assert.ok(m, "cổng thiếu khối LIVE_TABLES_SNAPSHOT");
  return [...m[1].matchAll(/"([a-z_]+)"/g)].map((x) => x[1]);
}
// Dòng action trong mục «MẶT API MỚI» của hồ sơ.
function proposedActions(doc) {
  const sec = doc.split(/^##\s/m).find((s) => /MẶT API MỚI/i.test(s.split("\n")[0]));
  assert.ok(sec, "hồ sơ thiếu mục «MẶT API MỚI»");
  return [...sec.matchAll(/^\|\s*`([a-z][a-z0-9_]+)`\s*\|/gm)].map((m) => m[1]);
}

test("F-04/F-05 — hai hồ sơ kiến trúc + cổng đo tồn tại", () => {
  assert.ok(existsSync(F04), `Thiếu ${F04}`);
  assert.ok(existsSync(F05), `Thiếu ${F05}`);
  assert.ok(existsSync(GATE), `Thiếu ${GATE}`);
});

test("F-04/F-05 — chép NGUYÊN VĂN dòng roadmap, đúng bản chất «kiến trúc / chuẩn bị»", () => {
  const roadmap = read(ROADMAP).split(/\r?\n/);
  const f04Line = roadmap.find((l) => l.startsWith("| `F-04` |"));
  const f05Line = roadmap.find((l) => l.startsWith("| `F-05` |"));
  assert.ok(f04Line && f05Line, "roadmap không còn dòng F-04/F-05");
  const f04 = read(F04);
  const f05 = read(F05);
  assert.match(f04, /chấm công/i);
  assert.match(f04, /lịch làm việc/i);
  assert.match(f04, /nghỉ phép/i);
  // F-05 = Lịch: ngày làm việc · nghỉ phép · ngày lễ · tăng ca · chấm công (đủ 5 vế)
  assert.match(f05, /ngày làm việc/i);
  assert.match(f05, /nghỉ phép/i);
  assert.match(f05, /ngày lễ/i);
  assert.match(f05, /tăng ca/i);
  assert.match(f05, /chấm công/i);
});

test("F-04 — tái dùng engine WF-06: hồ sơ phải chỉ đúng cột/dữ liệu engine ĐÃ CÓ", () => {
  const f04 = read(F04);
  assert.match(f04, /workflow_definitions\.module_key/, "thiếu bằng chứng cột `workflow_definitions.module_key`");
  assert.match(f04, /approval_stage_catalog/, "thiếu bằng chứng `approval_stage_catalog`");
  assert.match(f04, /WF-06/, "hồ sơ phải nối về WF-06 (mục phụ thuộc khai báo)");
  assert.match(f04, /hr_records/, "thiếu neo dữ liệu nhân sự ĐANG CÓ `hr_records`");
});

test("F-04/F-05 — bảng đề xuất KHÔNG trùng bảng đang có, và theo tiền tố `hr_`", () => {
  const live = new Set(liveTables());
  const ddl = sqlBlocks(read(F04)) + "\n" + sqlBlocks(read(F05));
  const proposed = [...ddl.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?(\w+)`?/gi)].map((m) => m[1]);
  assert.ok(proposed.length >= 8, `chỉ thấy ${proposed.length} bảng đề xuất (phải ≥ 8)`);
  const clash = proposed.filter((t) => live.has(t));
  assert.deepEqual(clash, [], "bảng đề xuất TRÙNG bảng đang có ⇒ sẽ đạp dữ liệu thật");
  const badPrefix = proposed.filter((t) => !/^hr_/.test(t));
  assert.deepEqual(badPrefix, [], "bảng mới của module Hành chính phải mang tiền tố `hr_`");
  const dup = proposed.filter((t, i) => proposed.indexOf(t) !== i);
  assert.deepEqual(dup, [], "bảng đề xuất bị khai trùng giữa hai hồ sơ");
});

test("F-04/F-05 — DDL đề xuất ADDITIVE thuần: không DROP/TRUNCATE/DELETE/UPDATE, ALTER chỉ ADD", () => {
  const ddl = sqlBlocks(read(F04)) + "\n" + sqlBlocks(read(F05));
  const bash = [
    [/\bDROP\s+(TABLE|COLUMN|DATABASE|INDEX|VIEW)\b/i, "DROP"],
    [/\bTRUNCATE\b/i, "TRUNCATE"],
    [/\bDELETE\s+FROM\b/i, "DELETE FROM"],
    [/\bUPDATE\s+\w+\s+SET\b/i, "UPDATE … SET"],
  ].filter(([re]) => re.test(ddl)).map(([, n]) => n);
  assert.deepEqual(bash, [], `DDL đề xuất chứa lệnh phá hoại: ${bash.join(", ")}`);
  const creates = [...ddl.matchAll(/CREATE\s+TABLE\s+(IF\s+NOT\s+EXISTS\s+)?`?\w+`?/gi)];
  const badCreate = creates.filter((m) => !m[1]).length;
  assert.equal(badCreate, 0, "mọi CREATE TABLE phải là `IF NOT EXISTS`");
  const alters = [...ddl.matchAll(/ALTER\s+TABLE[\s\S]*?;/gi)].map((m) => m[0]);
  const badAlter = alters.filter((s) => !/\bADD\b/i.test(s) || /\bDROP\b/i.test(s));
  assert.deepEqual(badAlter, [], "ALTER TABLE trong hồ sơ chỉ được ADD (không DROP)");
});

test("F-04/F-05 — mọi `REFERENCES` trỏ vào bảng đang có HOẶC bảng vừa đề xuất", () => {
  const ddl = sqlBlocks(read(F04)) + "\n" + sqlBlocks(read(F05));
  const proposed = new Set([...ddl.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?(\w+)`?/gi)].map((m) => m[1]));
  const known = new Set([...liveTables(), ...proposed]);
  const refs = [...new Set([...ddl.matchAll(/REFERENCES\s+`?(\w+)`?/gi)].map((m) => m[1]))];
  assert.ok(refs.length > 0, "hồ sơ kiến trúc phải khai quan hệ tham chiếu");
  const missing = refs.filter((t) => !known.has(t));
  assert.deepEqual(missing, [], "có `REFERENCES` trỏ vào bảng KHÔNG tồn tại và không được đề xuất");
});

test("F-04/F-05 — mặt API đề xuất là action THẬT SỰ MỚI ở cả 3 nơi", () => {
  const js = read(JS_ROUTE);
  const java = read(JAVA_CTRL);
  const reg = read(REGISTRY);
  const actions = [...new Set([...proposedActions(read(F04)), ...proposedActions(read(F05))])];
  assert.ok(actions.length >= 10, `chỉ đọc được ${actions.length} action đề xuất (phải ≥ 10)`);
  const bad = [];
  for (const a of actions) {
    if (js.includes(`action === "${a}"`)) bad.push(`JS đã có "${a}"`);
    if (java.includes(`case "${a}"`)) bad.push(`Java đã có "${a}"`);
    if (reg.includes(`Map.entry("${a}"`)) bad.push(`ma trận quyền đã có "${a}"`);
  }
  assert.deepEqual(bad, [], `action nêu là «mới» nhưng đã tồn tại: ${bad.join(" · ")}`);
});

test("F-04/F-05 — hồ sơ nói rõ phạm vi: CHƯA ÁP DỤNG + KHÔNG triển khai nghiệp vụ", () => {
  for (const [name, path] of [["F-04", F04], ["F-05", F05]]) {
    const doc = read(path);
    assert.match(doc, /CHƯA\s+ÁP\s+DỤNG/i, `${name}: phải nói rõ DDL/mặt API CHƯA áp dụng`);
    assert.match(doc, /không triển khai nghiệp vụ/i, `${name}: phải nói rõ ngoài phạm vi là triển khai nghiệp vụ`);
    assert.match(doc, /CONFIRMED/, `${name}: phải có kết luận CONFIRMED`);
    assert.match(doc, /(LIKELY|UNKNOWN)/, `${name}: phải có kết luận LIKELY/UNKNOWN`);
  }
});

test("F-04/F-05 — cổng đo kiểm va chạm TÊN BẢNG với CSDL sống và chỉ ĐỌC", () => {
  const gate = read(GATE);
  assert.match(gate, /LIVE_TABLES_SNAPSHOT\s*=\s*\[/);
  assert.match(gate, /hr_/, "cổng phải kiểm danh sách bảng đề xuất của HR");
  assert.match(gate, /information_schema/);
  const sql = [...gate.matchAll(/`([^`]*SELECT[^`]*)`/gi)].map((m) => m[1]).join("\n");
  const offenders = sql.split(/;/).map((s) => s.trim()).filter((s) => /\b(INSERT|UPDATE|DELETE|ALTER|DROP|TRUNCATE|CREATE)\b/i.test(s));
  assert.deepEqual(offenders, [], "cổng đo không được chạy câu lệnh GHI trên CSDL thật");
});
