// VÒNG 1 · MỤC 5 — «mỗi tab PR / PO / Chi tiết lũy kế chỉ hiển thị danh sách tương ứng với tab đó».
//
// BỐI CẢNH (đo thật trên `app/screens/Purchasing.tsx` trước khi sửa):
//   · Bên TRONG thẻ tab (`:342/:343/:345`) 3 bảng ĐÃ đúng là có điều kiện theo `activeTab`.
//   · NHƯNG còn 2 khối ĐỨNG NGOÀI thẻ tab và KHÔNG có điều kiện:
//       `:363` «Đơn mua (PO) — mở chi tiết để truy vết»  ⇒ bảng PO thứ 2 (trùng bảng tab PO)
//       `:365` «LŨY KẾ THEO HỆ VẬT TƯ»                   ⇒ bảng lũy kế thứ 2, hiện ở MỌI tab
//     ⇒ ở tab nào cũng thấy đủ 3 danh sách — khớp với lời user: «đang hiển thị cả 3 danh sách».
//
// ⚠️ CÁI GÌ KHÔNG ĐƯỢC ĐỔI (hợp đồng đang có):
//   · `purchasing-pos`      — `tests/p01-purchasing-two-tabs.test.mjs:263` + `tests/p2-d2-po-detail.test.mjs:121`
//   · `purchasing-po-open`  — `tests/p2-d2-po-detail.test.mjs:122`
//   · `purchasing-po-row`   — `tests/p01-purchasing-two-tabs.test.mjs:264`
//   · chữ «Xem chi tiết PO» — `tests/p01-purchasing-two-tabs.test.mjs:265`
//   ⇒ Vì vậy KHÔNG xoá cả khối, mà GỘP nút «Xem chi tiết PO» vào chính bảng của tab PO và
//     chuyển marker `purchasing-pos` xuống bảng đó. Đúng tinh thần tiêu đề sẵn có của
//     `p01-purchasing-two-tabs.test.mjs:255`: «KHÔNG tạo bảng mới trùng».
//
// ⛔ BA BÀI HỌC ĐÃ NẰM TRONG FILE NÀY (cả ba do chính lần viết đầu tiên vấp):
//   1. Lấy điều kiện tab bằng cách «dấu hiệu `activeTab==="…"` GẦN NHẤT phía trước» là SAI:
//      với bảng «LŨY KẾ THEO HỆ VẬT TƯ», dấu hiệu gần nhất là `{activeTab==="MAT"}` của chính
//      BẢNG TAB 3 ở dòng trên ⇒ vệ sẽ XANH cả khi chưa sửa gì ⇒ vệ rỗng.
//   2. Quét `{…}` phải hiểu CẢ `${…}` lồng nhau: nếu không ghi nhớ lúc quay lại chuỗi template,
//      mọi `${…}` sẽ lệch số ngoặc và làm hỏng kết quả của cả tệp.
//   3. ⭐ Chỉ `activeTab` đứng NGAY SAU `{` mới là cổng tab. Biểu thức
//      `const dateDim=(activeTab==="PR"||activeTab==="PO")?…` là logic JS, nằm trong thân
//      component không có `{` bao quanh; nếu quét mù thì nó gán cổng "PO" cho CẢ component
//      ⇒ mọi marker sau đó đều bị quy về "PO" và vệ 5 mất tác dụng.
//   ⇒ Dùng `gateAt()` bên dưới: mỗi khung `{…}` nhớ điều kiện tab của chính nó, hết khung thì
//     hết hiệu lực; trả về điều kiện GẦN NHẤT ĐANG BAO quanh vị trí cần kiểm.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const CODE = readFileSync(new URL("../app/screens/Purchasing.tsx", import.meta.url), "utf8");

/** Bỏ CHÚ THÍCH để test đo hành vi thật, không đo lời giải thích. */
function codeOf(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}
const CODE_RUN = codeOf(CODE);

/** Cổng tab = `activeTab` đứng ngay sau `{`, ví dụ `{activeTab==="PO"&&…`. */
const GATE_OPEN = /^\s*activeTab\s*===\s*"(PR|PO|MAT)"/;

/**
 * Trả điều kiện tab (`"PR"|"PO"|"MAT"|null`) đang bao quanh CHỈ SỐ `stop` trong `s`.
 * `null` = vị trí đó KHÔNG nằm trong điều kiện tab nào ⇒ khối ấy LUÔN HIỆN ở mọi tab.
 */
function gateAt(s, stop) {
  const frames = [{ mode: "code", gate: null }];
  let i = 0;
  const top = () => frames[frames.length - 1];
  while (i < stop) {
    const m = top().mode;
    const ch = s[i];
    const nx = s[i + 1];
    if (m === "code") {
      if (ch === "/" && nx === "/") { i += 2; while (i < s.length && s[i] !== "\n") i += 1; continue; }
      if (ch === "/" && nx === "*") { const e = s.indexOf("*/", i + 2); i = e === -1 ? s.length : e + 2; continue; }
      if (ch === '"' || ch === "'") { top().mode = ch; i += 1; continue; }
      if (ch === "`") { top().mode = "`"; i += 1; continue; }
      if (ch === "{") {
        frames.push({ mode: "code", gate: null });
        const g = GATE_OPEN.exec(s.slice(i + 1, i + 41));
        if (g) { top().gate = g[1]; i += 1 + g[0].length; continue; }
        i += 1;
        continue;
      }
      if (ch === "}") {
        const done = frames.pop();
        if (frames.length && done.resume) top().mode = done.resume;
        i += 1;
        continue;
      }
      i += 1;
      continue;
    }
    if (m === "`") {
      if (ch === "\\") { i += 2; continue; }
      if (ch === "`") { top().mode = "code"; i += 1; continue; }
      if (ch === "$" && nx === "{") {
        top().mode = "codeInTemplate";
        frames.push({ mode: "code", gate: null, resume: "`" });
        i += 2;
        continue;
      }
      i += 1;
      continue;
    }
    if (m === "codeInTemplate") { top().mode = "`"; i += 1; continue; }
    if (ch === "\\") { i += 2; continue; }
    if (ch === m) { top().mode = "code"; i += 1; continue; }
    i += 1;
  }
  for (let k = frames.length - 1; k >= 0; k -= 1) if (frames[k].gate) return frames[k].gate;
  return null;
}

/** Điều kiện tab của marker (đọc trong MÃ đã bỏ chú thích). */
const gateOf = (src, marker) => {
  const at = src.indexOf(marker);
  return at === -1 ? "KHONG-CO" : gateAt(src, at);
};

/** Đếm số lần một chuỗi xuất hiện trong MÃ (đã bỏ chú thích). */
const countOf = (src, needle) => src.split(needle).length - 1;

// Đánh dấu THẬT của từng khối — đo lại từ mã nguồn 02/10/2026.
// ⛔ Bảng lũy kế hệ vật tư mang CLASS `purchase-system-table`, KHÔNG mang `data-vntech`
//    (`tests/moc121-purchasing-tabs.test.mjs:76` cũng soi class này).
const MARK = {
  pr: 'data-vntech="purchasing-pr-table"',
  po: 'data-vntech="purchasing-po-table"',
  mat: 'data-vntech="purchasing-mat-table"',
  pos: 'data-vntech="purchasing-pos"',
  open: 'data-vntech="purchasing-po-open"',
  row: 'data-vntech="purchasing-po-row"',
  he: 'className="card purchase-system-table"',
};

test("VỆ 1 · marker `purchasing-pos` CÒN (hợp đồng P-01.10 / P2-D2)", () => {
  assert.match(CODE_RUN, new RegExp(MARK.pos), "marker `purchasing-pos` phải còn — đã gộp chứ KHÔNG xoá");
  assert.equal(gateOf(CODE_RUN, MARK.pos), "PO", "`purchasing-pos` nay bọc bảng của TAB PO");
});

test("VỆ 2 · bảng PO trùng ở NGOÀI thẻ tab đã bị gỡ", () => {
  assert.doesNotMatch(CODE_RUN, /purchase-order-detail-card/,
    "khối `purchase-order-detail-card` chính là bảng PO thứ 2 — mỗi tab chỉ được có 1 danh sách");
  assert.doesNotMatch(CODE_RUN, /Đơn mua \(PO\) — mở chi tiết để truy vết/,
    "tiêu đề của bảng PO trùng đã gỡ; nút mở chi tiết chuyển vào bảng của tab PO");
});

test("VỆ 3 · chỉ còn MỘT bảng PO trong toàn màn, và nó thuộc tab PO", () => {
  assert.equal(countOf(CODE_RUN, MARK.row), 1,
    "trước khi sửa có 2 (`<tr>` trong tab PO + `<tr>` trong khối trùng) — giờ phải là 1");
  assert.equal(gateOf(CODE_RUN, MARK.row), "PO",
    "dòng PO còn lại phải nằm trong khối điều kiện activeTab === PO, không phải ngoài thẻ tab");
});

test("VỆ 4 · nút mở chi tiết PO nằm TRONG tab PO, đúng 1 nút", () => {
  assert.equal(countOf(CODE_RUN, MARK.open), 1,
    "nút «Xem chi tiết PO» phải có đúng 1 chỗ (không lặp ở 2 bảng)");
  assert.equal(gateOf(CODE_RUN, MARK.open), "PO",
    "nút mở chi tiết phải nằm trong khối điều kiện activeTab === PO");
  assert.match(CODE_RUN, /Xem chi tiết PO/, "chữ «Xem chi tiết PO» phải còn (hợp đồng P-01.10)");
});

test("VỆ 5 · bảng lũy kế THEO HỆ VẬT TƯ chỉ hiện ở tab lũy kế theo vật tư", () => {
  assert.equal(gateOf(CODE_RUN, MARK.he), "MAT",
    "«LŨY KẾ THEO HỆ VẬT TƯ» phải nằm trong khối điều kiện activeTab === MAT — trước khi sửa nó hiện ở MỌI tab");
});

test("VỆ 6 · 3 bảng trong thẻ tab vẫn phải đúng 1 bảng mỗi tab", () => {
  assert.equal(gateOf(CODE_RUN, MARK.pr), "PR");
  assert.equal(gateOf(CODE_RUN, MARK.po), "PO");
  assert.equal(gateOf(CODE_RUN, MARK.mat), "MAT");
});

test("VỆ 7 · ĐỐI CHỨNG ÂM — gỡ điều kiện tab thì phải báo đỏ (D-098)", () => {
  // Đảo đúng ngược lại thay đổi thật: gỡ điều kiện `MAT` ở bảng lũy kế hệ vật tư
  // và điều kiện `PO` ở bảng chứa nút mở chi tiết ⇒ các vệ phải BẮT ĐỎ.
  // ⛔ CHỈ gỡ điều kiện, GIỮ NGUYÊN dấu `{`: xoá luôn `{` sẽ lệch cân bằng ngoặc và làm
  //    hỏng kết quả của cả những marker nằm SAU (đo thử: `purchasing-po-open` vẫn trả "PO").
  const mutate = (src) => src
    .replace(/\{activeTab==="MAT"&&(<section className="card purchase-system-table")/, "{$1")
    .replace(/\{activeTab==="PO"&&(<div data-vntech="purchasing-pos")/, "{$1");

  const doi = mutate(CODE_RUN);
  assert.notEqual(doi, CODE_RUN, "đối chứng âm phải THAY ĐỔI được mã nguồn — nếu không thì vệ không có tác dụng");
  assert.equal(gateOf(doi, MARK.he), null,
    "gỡ điều kiện MAT ⇒ bảng lũy kế hệ vật tư phải rơi về trạng thái LUÔN HIỆN");
  assert.equal(gateOf(doi, MARK.open), null,
    "gỡ điều kiện PO ⇒ nút mở chi tiết không còn thuộc tab PO nào");
  assert.equal(gateOf(doi, MARK.row), null,
    "gỡ điều kiện PO ⇒ cả dòng PO cũng rơi về trạng thái LUÔN HIỆN");
});