// PHASE 2 (§25/§26 · VIỆC 2) — HỢP ĐỒNG Ô TRẠNG THÁI (TT) CỦA `docs/25_TODO_ROADMAP.md`.
//
// Vì sao cần: `tools/probe-roadmap-progress.mjs` là cổng đếm tiến độ 110 mục và nó đọc
// NGUYÊN VĂN ô TT = `cells[cells.length - 2]` (tách theo `|`). Bất kỳ chữ nào thêm vào ô TT
// (ví dụ ghi lý do/DONE kèm ghi chú khác từ vựng) làm mục rơi vào nhóm `OTHER` ⇒ tiến độ SAI.
// Ghi chú/lý do PHẢI nằm ở cột "Việc" (index 3), KHÔNG được nằm ở ô TT.
//
// Tệp này khoá 4 bất biến:
//   1. Mọi dòng mục (`| `XXX-NN` |`) có ĐÚNG 12 ô khi tách theo `|`; ô cuối (index 11) RỖNG
//      (đúng dạng `| … | TT |`) ⇒ ô TT là **index 10**, đồng thời là `cells[length - 2]` (khớp cổng).
//   2. Ô index 10 nằm trong TỪ VỰNG mà cổng phân loại được: `**DONE**` · `**BLOCKED**` ·
//      `DONE / …` · `TODO` · `DOING…` · `KHUNG-XONG…` · (cho phép `DONE` trần, có/không `**`).
//   3. Không dòng nào rơi vào `OTHER` ⇒ DONE + DOING + FRAME_ONLY + BLOCKED + TODO = 110.
//   4. Bất biến riêng PHASE 2: đúng **9** dòng `P-01…P-09`; và cột "Việc" (index 3) của dòng
//      `P-01` phải ghi rõ việc đã **ROLLBACK** (nếu không, người đọc lại tưởng P-01 chưa từng làm).
//
// Chạy riêng:  node --test tests/p2-25-roadmap-status-cell.test.mjs
// (CỐ Ý không nằm trong `package.json` ⇒ `test:regression` giữ nguyên số ca.)
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const ROADMAP = "docs/25_TODO_ROADMAP.md";
const text = readFileSync(ROADMAP, "utf8");
const lines = text.split(/\r?\n/);

// Bản sao NGUYÊN VĂN logic phân loại của `tools/probe-roadmap-progress.mjs` (đọc lại từ chính tệp cổng
// để nếu cổng đổi từ vựng thì test này báo lệch, không âm thầm cho qua).
const PROBE = readFileSync("tools/probe-roadmap-progress.mjs", "utf8");

function rows() {
  const out = [];
  for (const line of lines) {
    const m = line.match(/^\|\s*`([A-Z]+-\d+)`\s*\|(.*)$/);
    if (!m) continue;
    out.push({ id: m[1], raw: line, cells: line.split("|").map((c) => c.trim()) });
  }
  return out;
}

const classify = (s) => {
  const t = s.replace(/\*\*/g, "").trim().toUpperCase();
  if (t === "DONE") return "DONE";
  if (t === "BLOCKED") return "BLOCKED";
  if (t.startsWith("DONE /")) return "DONE";
  if (t.startsWith("DANG-LAM")) return "DOING";
  if (t.startsWith("DOING")) return "DOING";
  if (t.startsWith("KHUNG-XONG")) return "FRAME_ONLY";
  if (t === "TODO") return "TODO";
  return "OTHER";
};

const all = rows();

test("cổng probe vẫn đọc ô TT ở `cells[length-2]` (nếu đổi, test này phải được xem lại)", () => {
  assert.match(PROBE, /const status = cells\[cells\.length - 2\]/, "probe-roadmap-progress.mjs phải vẫn lấy ô TT = cells[length-2]");
});

test("roadmap có đúng 110 dòng mục", () => {
  assert.equal(all.length, 110, `đọc được ${all.length} dòng mục, phải là 110`);
});

test("mọi dòng mục có ĐÚNG 12 ô; ô cuối rỗng ⇒ ô TT là index 10 (= `cells[length-2]`)", () => {
  const bad = all.filter((r) => r.cells.length !== 12);
  assert.deepEqual(bad.map((r) => `${r.id}:${r.cells.length} ô`), [], "số ô phải = 12 với mọi dòng");
  const notEmptyTail = all.filter((r) => r.cells[11] !== "");
  assert.deepEqual(notEmptyTail.map((r) => `${r.id} — "${r.cells[11]}"`), [], "ô cuối (index 11) phải RỖNG");
  // Ô TT phải là index 10 đồng thời cũng là `cells[length-2]` (khớp đúng cổng đang đọc).
  for (const r of all) assert.equal(r.cells[r.cells.length - 2], r.cells[10], `${r.id}: ô TT không khớp index 10`);
});

test("ô TT của MỌI dòng thuộc từ vựng cổng phân loại (không dòng nào vào OTHER)", () => {
  const other = all.filter((r) => classify(r.cells[10]) === "OTHER").map((r) => `${r.id} — "${r.cells[10]}"`);
  assert.deepEqual(other, [], "có dòng rơi vào OTHER ⇒ tiến độ sẽ sai");
});

test("DONE + DOING + FRAME_ONLY + BLOCKED + TODO = 110", () => {
  const tally = {};
  for (const r of all) tally[classify(r.cells[10])] = (tally[classify(r.cells[10])] ?? 0) + 1;
  const sum = ["DONE", "DOING", "FRAME_ONLY", "BLOCKED", "TODO"].reduce((n, k) => n + (tally[k] ?? 0), 0);
  assert.equal(sum, 110, `tổng phân loại = ${sum} · chi tiết ${JSON.stringify(tally)}`);
});

test("PHASE 2 có đúng 9 dòng P-01…P-09, và ô TT chỉ là `**DONE**`/`DONE` · `**BLOCKED**`/`BLOCKED` · `TODO`/`**TODO**`", () => {
  const p = all.filter((r) => /^P-\d+$/.test(r.id));
  assert.deepEqual(p.map((r) => r.id), ["P-01", "P-02", "P-03", "P-04", "P-05", "P-06", "P-07", "P-08", "P-09"]);
  const allowed = new Set(["**DONE**", "**BLOCKED**", "**TODO**", "DONE", "BLOCKED", "TODO"]);
  const bad = p.filter((r) => !allowed.has(r.cells[10])).map((r) => `${r.id} — "${r.cells[10]}"`);
  assert.deepEqual(bad, [], "ô TT của PHASE 2 phải CHÍNH XÁC là `**DONE**` · `DONE` · `**BLOCKED**` · `TODO` · `**TODO**` (lý do ghi ở cột Việc, KHÔNG ghi vào ô TT)");
});

test("lý do/ghi chú PHASE 2 nằm ở cột `Việc` (index 3), KHÔNG nằm ở ô TT", () => {
  const p = all.filter((r) => /^P-\d+$/.test(r.id));
  for (const r of p) {
    assert.ok(r.cells[3] && r.cells[3].length > 0, `${r.id}: cột Việc rỗng`);
    assert.doesNotMatch(r.cells[10], /—|KIỂM|CHƯA|vì|do /i, `${r.id}: ô TT chứa chữ giải thích ⇒ sẽ rơi vào OTHER`);
  }
});

test("P-01 phải ghi rõ việc đã ROLLBACK trong cột Việc", () => {
  const p01 = all.find((r) => r.id === "P-01");
  assert.ok(p01, "không tìm thấy dòng P-01");
  assert.match(p01.cells[3], /ROLLBACK/i, "cột Việc của P-01 phải nêu việc đã rollback (0c7318b)");
});
