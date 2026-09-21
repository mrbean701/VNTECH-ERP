// HỢP ĐỒNG TASK-122 · `Q1` = PHƯƠNG ÁN (A) — NỬA SAU: ĐỔI CÁCH **HIỂN THỊ** KHI XUẤT EXCEL/CSV BOQ.
//
// ⛔ KHÔNG sửa dữ liệu. Chỉ đổi GIÁ TRỊ GHI RA ở cột «Mã dòng BOQ» của 2 nhánh xuất để **GUID không lộ ra**.
//
// ĐO Ở HAI TẦNG:
//   1) TẦNG HÀM THUẦN: import TRỰC TIẾP `lib/boq-line-display.ts` và đo trên DÒNG BOQ THẬT
//      (`tests/q1-boq-lines-payload.json` — chép nguyên văn từ `GET /api/system` của stack đang chạy).
//   2) TẦNG NGUỒN: khẳng định 2 nhánh xuất KHÔNG còn ghi `String(r.id…)`, cột lấy giá trị từ hàm thuần, và
//      KHÔNG câu SQL ghi dữ liệu nào được thêm.
//
// Chạy riêng:  node --import tsx --test tests/q1-boq-export-display.test.mjs
// (tệp CỐ Ý không nằm trong `package.json` → `test:regression` giữ nguyên 69 ca)
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { NO_SOURCE_TEXT, boqLineDisplayCode } from "../lib/boq-line-display.ts";

const read = (relative) => readFileSync(new URL("../" + relative, import.meta.url), "utf8");
const exportSource = read("lib/boq-export.ts");
const displaySource = read("lib/boq-line-display.ts");
// DÒNG BOQ THẬT — 8 dòng đo LIVE tại `GET /api/system` (dự án PRJ-DEMO-01). Các dòng này có:
//   `boqCode = null`, `contractLineRef = null` (CHƯA khai mã dòng) nhưng CÓ `materialCode` + `lineNo`.
const payload = JSON.parse(read("tests/q1-boq-lines-payload.json"));
const GUID = /^(BOQ|BQS|MR|PO|GRN)_/;

// ── ① KHÔNG còn `String(r.id…)` ở 2 nhánh xuất ────────────────────────────────────────────────────
test("Q1-A ① — 2 nhánh xuất Excel/CSV giá BOQ KHÔNG còn ghi `String(r.id…)` (nguồn GUID cho người dùng)", () => {
  assert.doesNotMatch(exportSource, /String\(r\.id/, "`lib/boq-export.ts` vẫn còn ghi `String(r.id…)` ⇒ GUID vẫn lộ ra file xuất");
  // Cột «Mã dòng BOQ» của cả 2 nhánh phải đi qua hàm thuần dùng chung.
  const viaHelper = exportSource.match(/boqLineDisplayCode\(r\)/g) || [];
  assert.equal(viaHelper.length, 2, `Cột «Mã dòng BOQ» phải dùng \`boqLineDisplayCode(r)\` ở ĐÚNG 2 nhánh (XLSX + CSV); đếm được ${viaHelper.length}`);
  assert.match(exportSource, /import \{[^}]*boqLineDisplayCode[^}]*\} from "@\/lib\/boq-line-display"/, "`lib/boq-export.ts` chưa import hàm thuần hiển thị mã dòng BOQ");
  // Tiêu đề cột giữ nguyên (chỉ đổi GIÁ TRỊ, không đổi cấu trúc file xuất).
  const headers = exportSource.match(/"Mã dòng BOQ"/g) || [];
  assert.equal(headers.length, 2, `Cột «Mã dòng BOQ» phải còn ĐÚNG 2 tiêu đề (XLSX + CSV); đếm được ${headers.length}`);
});

// ── ② Trả mã nghiệp vụ khi CÓ nguồn (đúng thứ tự ưu tiên) ─────────────────────────────────────────
test("Q1-A ② — `boqLineDisplayCode` trả MÃ NGHIỆP VỤ khi dòng BOQ có nguồn (thứ tự ưu tiên đo được)", () => {
  assert.equal(boqLineDisplayCode({ code: "BOQ-LINE-001", boqCode: "BQ-IGNORED", contractLineRef: "IV.1.1" }), "BOQ-LINE-001", "`code` là ưu tiên số 1");
  assert.equal(boqLineDisplayCode({ boqCode: "BQ-3", contractLineRef: "B-3", lineNo: 3 }), "BQ-3", "`boqCode` (cột thật `project_boq_items.boq_code`) phải thắng `contractLineRef`");
  assert.equal(boqLineDisplayCode({ lineRef: "LR-9", contractLineRef: "B-9" }), "LR-9", "`lineRef` đứng trước `contractLineRef` theo thứ tự đã chốt");
  assert.equal(boqLineDisplayCode({ contractLineRef: "IV.1.1", no: "N-7" }), "IV.1.1", "`contractLineRef` (cột thật `contract_line_ref`) phải thắng `no`");
  assert.equal(boqLineDisplayCode({ no: "N-7" }), "N-7", "`no` là mắt cuối của chuỗi ưu tiên");
  // Giá trị rỗng/khoảng trắng KHÔNG phải nguồn: phải rơi xuống nguồn kế tiếp, không được trả chuỗi trắng.
  assert.equal(boqLineDisplayCode({ boqCode: "   ", contractLineRef: "B-3" }), "B-3", "`boqCode` chỉ có khoảng trắng ⇒ KHÔNG tính là nguồn");
  assert.equal(boqLineDisplayCode({ boqCode: 0 }), "0", "số 0 là GIÁ TRỊ THẬT (khác rỗng) — không được coi là thiếu nguồn");
  // Dòng BOQ THẬT (chuỗi ưu tiên rỗng) ⇒ rơi xuống mã vật tư đã LƯU + số dòng nguồn, KHÔNG rỗng, KHÔNG GUID.
  assert.equal(boqLineDisplayCode(payload[0]), `KHAC-VLXD-004 · Dòng ${payload[0].lineNo}`, "Dòng thật phải hiện mã vật tư thật + số dòng nguồn (không bịa mã mới)");
  assert.ok(payload.length >= 8, `Bằng chứng payload phải còn ≥ 8 dòng thật (đang có ${payload.length})`);
  const withSource = payload.filter((row) => boqLineDisplayCode(row) !== NO_SOURCE_TEXT).length;
  assert.equal(withSource, payload.length, `CẢ ${payload.length} dòng thật phải có mã hiển thị (không dòng nào rỗng)`);
  // Fallback phải RÚT TỪ DỮ LIỆU THẬT của chính dòng đó (không chế mã mới): mã vật tư + số dòng nguồn.
  for (const row of payload) {
    const shown = boqLineDisplayCode(row);
    assert.ok(shown.includes(String(row.materialCode)), `«${shown}» phải chứa mã vật tư THẬT «${row.materialCode}» của dòng`);
    assert.ok(shown.includes(String(row.lineNo)), `«${shown}» phải chứa số dòng nguồn THẬT «${row.lineNo}» của dòng`);
  }
});

// ── ③ Trả «chưa có nguồn» khi thiếu — và KHÔNG BAO GIỜ trả GUID ───────────────────────────────────
test("Q1-A ③ — thiếu MỌI nguồn ⇒ trả ĐÚNG `chưa có nguồn`; KHÔNG BAO GIỜ trả `<PREFIX>_<GUID>`", () => {
  assert.equal(boqLineDisplayCode({ id: "BOQ_36a50087-88f4-49e3-ac5a-fff0631b733d" }), NO_SOURCE_TEXT, "Chỉ có `id` (GUID) ⇒ BẮT BUỘC là «chưa có nguồn», KHÔNG được trả chính `id`");
  assert.equal(boqLineDisplayCode({}), NO_SOURCE_TEXT, "Dòng rỗng ⇒ «chưa có nguồn»");
  assert.equal(boqLineDisplayCode(null), NO_SOURCE_TEXT, "Không có dòng ⇒ «chưa có nguồn»");
  assert.equal(boqLineDisplayCode(undefined), NO_SOURCE_TEXT, "`undefined` ⇒ «chưa có nguồn»");
  assert.equal(NO_SOURCE_TEXT, "chưa có nguồn", "Nguyên văn nhánh thiếu nguồn phải là «chưa có nguồn» (dùng chung với `lib/p2-approval-timeline.ts`)");
  // KHÔNG BAO GIỜ trả chuỗi dạng khoá kỹ thuật, trên MỌI dòng thật + MỌI tổ hợp đầu vào dò được.
  const probes = [
    ...payload,
    { id: "BOQ_36a50087-88f4-49e3-ac5a-fff0631b733d" },
    { id: "BQS_dca3fab5-b096-4314-ae95-cc54d47b1c31", boqCode: "BQ-3" },
    { id: "MR_46cee316-0000-0000-0000-000000000000" },
    { id: "PO_0001", contractLineRef: "IV.1.1" },
    { id: "GRN_0001", no: "N-1" },
    { sourceItemId: "BQS_dca3fab5-b096-4314-ae95-cc54d47b1c31" },
    {},
    null,
    undefined,
  ];
  for (const row of probes) {
    const shown = boqLineDisplayCode(row);
    assert.equal(typeof shown, "string", "Luôn trả CHUỖI (không `undefined`/`null`)");
    assert.ok(shown.trim().length > 0, "Chuỗi hiển thị KHÔNG được rỗng");
    assert.doesNotMatch(shown, GUID, `Giá trị hiển thị «${shown}» khớp /^(BOQ|BQS|MR|PO|GRN)_/ ⇒ GUID/khoá kỹ thuật lọt ra người dùng`);
    assert.ok(!shown.includes("36a50087") && !shown.includes("dca3fab5"), `Giá trị hiển thị «${shown}» chứa GUID thô`);
  }
  // Tầng NGUỒN: cột «Mã dòng BOQ» không được lấy từ `id`/`sourceItemId` ở bất kỳ đâu trong 2 tệp.
  for (const [name, source] of [["lib/boq-export.ts", exportSource], ["lib/boq-line-display.ts", displaySource]]) {
    assert.doesNotMatch(source, /\["id"\]/, `${name}: KHÔNG được truy cập \`["id"]\` cho cột hiển thị`);
  }
});

// ── ④ 2 CHỖ ĐÃ ĐỔI: mỗi mảng dòng của nhánh xuất lấy cột «Mã dòng BOQ» từ hàm thuần ───────────────
test("Q1-A ④ — ĐÚNG 2 mảng dòng (XLSX + CSV) lấy cột thứ 2 từ `boqLineDisplayCode(r)`, không còn `id`", () => {
  const fragments = exportSource.match(/return\[num\(r\.sourceOrder[\s\S]*?\];/g) || [];
  assert.equal(fragments.length, 2, `Phải có ĐÚNG 2 mảng dòng của 2 nhánh xuất; đếm được ${fragments.length}`);
  for (const [index, fragment] of fragments.entries()) {
    assert.match(fragment, /^return\[num\(r\.sourceOrder\|\|r\.lineNo\|\|i\+1\),boqLineDisplayCode\(r\),/, `Nhánh #${index + 1}: cột «Thứ tự nguồn» → «Mã dòng BOQ» phải là \`boqLineDisplayCode(r)\``);
    assert.doesNotMatch(fragment, /\bid\b/, `Nhánh #${index + 1}: mảng dòng KHÔNG được còn tham chiếu \`id\` (khoá GUID)`);
    assert.match(fragment, /r\.(materialCode|contractMaterialCode)/, `Nhánh #${index + 1}: mảng dòng phải còn ghi mã vật tư thật (không đổi cấu trúc 13 cột)`);
  }
  // ĐỐI CHỨNG: cột «Mã dòng BOQ» của 2 nhánh này ghi ra ĐÚNG giá trị hàm thuần trên dòng BOQ THẬT.
  const shown = payload.map((row) => boqLineDisplayCode(row));
  assert.deepEqual(shown.slice(0, 3), ["KHAC-VLXD-004 · Dòng 1", "KHAC-VLXD-005 · Dòng 2", "KHAC-VLXD-003 · Dòng 3"], "3 dòng đầu phải hiện mã vật tư thật + số dòng nguồn");
  assert.ok(shown.every((value) => !GUID.test(value)), "Không giá trị nào được là khoá kỹ thuật/GUID");
  assert.ok(!shown.includes(String(payload[0].id)), "Không được trả lại chính `id` của dòng");
});

// ── ⑤ KHÔNG thêm câu ghi dữ liệu nào (mã hay SQL), và giữ đúng phạm vi tệp ────────────────────────
test("Q1-A ⑤ — KHÔNG thêm INSERT/UPDATE/DELETE/DDL (mã hay SQL); hàm thuần không import gì", () => {
  const FORBIDDEN = [
    /\bINSERT\s+INTO\b/i, /\bUPDATE\s+[`"']?\w+[`"']?\s+SET\b/i, /\bDELETE\s+FROM\b/i,
    /\bALTER\s+TABLE\b/i, /\bDROP\s+(TABLE|DATABASE|INDEX)\b/i, /\bTRUNCATE\b/i,
    /\bdrizzle\b/i, /\bdb\.execute\b/i, /\bquery\s*\(/i,
  ];
  for (const [name, source] of [["lib/boq-export.ts", exportSource], ["lib/boq-line-display.ts", displaySource]]) {
    for (const pattern of FORBIDDEN) {
      assert.doesNotMatch(source, pattern, `${name}: phát hiện câu GHI DỮ LIỆU khớp ${pattern} — TASK-122 cấm tuyệt đối`);
    }
  }
  // Hàm thuần: KHÔNG import gì (đúng kỷ luật `lib/p2-po-trace.ts` / `lib/p2-approval-timeline.ts`)
  assert.doesNotMatch(displaySource, /^\s*import\s/m, "`lib/boq-line-display.ts` phải là HÀM THUẦN — không import gì (tránh import vòng vào `app/page.tsx`)");
});
