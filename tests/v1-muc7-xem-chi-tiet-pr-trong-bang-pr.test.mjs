// VÒNG 1 (GO-LIVE) · MỤC 7 — "cho phép xem chi tiết đơn mua (PR) trong bảng danh sách PR".
//
// BỐI CẢNH: tab PR của màn Mua hàng & Cung ứng (`app/screens/Purchasing.tsx`) trước đây chỉ có
// các cột dữ liệu, không có đường mở chi tiết phiếu. Người dùng phải mò sang màn khác.
//
// HỢP ĐỒNG PHẢI GIỮ (đã đo trước khi sửa):
//   · `open("detail", row)` là đường mở PR — `app/page.tsx:722` render `RequestDrawer variant="page"`;
//     `open("poDetail", po)` là đường mở PO — `app/page.tsx:724` render `PurchaseOrderDrawer`.
//     ⛔ KHÔNG được dùng nhầm hai cổng này (đó chính là lỗi loại «bấm sai chỗ thì tỏng modal»).
//   · `tests/moc121-purchasing-tabs.test.mjs:112` cắt khối tab từ `purchasing-tabs` tới `purchasing-pr-table`
//     rồi cấm `action("` ⇒ cột thao tác phải nằm SAU `purchasing-pr-table`, đặt vào đó là hợp lệ.
//
// BA BÀI HỌC ĐÃ CHỐT TỪ MỤC 5 (xem DECISIONS.md D-101 / D-102):
//   1. Vệ phải bỏ CHÚ THÍCH trước khi đo — `codeOf(src)`. Bản sửa thường giải thích bằng chính
//      chuỗi mà vệ cấm, nếu không vệ sẽ xanh giả.
//   2. Vệ phải có ĐỐI CHỨNG ÂM (D-098): sửa ngược tệp thì vệ phải ĐỎ, không thể không đỏ.
//   3. Cột thao tác không dùng điều kiện quyền (D-093): nút luôn hiện, đúng như nút "Xem chi tiết PO"
//      đã có. Khai điều kiện quyền mà không truyền prop xuống là cách làm nút biến mất im lặng.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const SRC = readFileSync(new URL("../app/screens/Purchasing.tsx", import.meta.url), "utf8");
const CODE = SRC.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

const MARK_ROW = "purchasing-pr-table";
const MARK_NEXT_PANEL = "purchasing-pos";
const MARK_BTN = "purchasing-pr-open";
const LABEL = "Xem chi tiết PR";

// Khối bảng tab PR: từ marker của bảng PR tới marker của khối kế tiếp (bảng PO).
const prPanel = (src) => {
  const a = src.indexOf(MARK_ROW);
  const b = src.indexOf(MARK_NEXT_PANEL, a);
  assert.ok(a >= 0, "khong tim thay marker bang tab PR");
  assert.ok(b > a, "khong tim thay khoi bang tiep theo sau bang tab PR");
  return src.slice(a, b);
};

test("MUC 7 V1 — nút mo chi tiiet PR ton tai DUNG MOT LAN trong man", () => {
  const total = CODE.split(MARK_BTN).length - 1;
  assert.equal(total, 1, `marker ${MARK_BTN} phai xuat hien dung 1 lan, hien tai = ${total}`);
});

test("MUC 7 V2 — nút goi dung CONG 'detail' (PR), KHONG phai 'poDetail' (PO)", () => {
  assert.match(
    CODE,
    /onClick=\{\(\)=>open\("detail",\s*\w+\)\}/,
    "nut phai goi open(\"detail\", <row>) — day la duong mo RequestDrawer (chi tiet PR)",
  );
  const panel = prPanel(CODE);
  assert.doesNotMatch(panel, /open\("poDetail"/, "trong bang tab PR KHONG duoc goi cong poDetail — do la cua PO");
});

test("MUC 7 V3 — bang PR phai co MOT COT THAO TAC o cuoi thead", () => {
  const panel = prPanel(CODE);
  assert.match(panel, /<th\s*\/>\s*<\/tr><\/thead>/, "thead cuoi bang PR phai co them mot <th /> truoc </tr></thead>");
});

test("MUC 7 V4 — moi dong cua bang PR ket thuc bang o nut, khong thoi do", () => {
  const panel = prPanel(CODE);
  // ⛔ KHÔNG dùng `[^>]*` ở đây: thuộc tính `onClick={()=>…}` chứa dấu `>` của toán tử mũi tên
  //    ⇒ `[^>]*` dừng sớm và vệ đỏ vì lý do SAI (đo lượt đầu: 5/6 xanh, V4 đỏ oan).
  const cell = new RegExp(`<td><button[^>]*?data-vntech="${MARK_BTN}"[\\s\\S]*?>${LABEL}</button></td></tr>`);
  assert.match(panel, cell, "phan cuoi moi <tr> cua bang PR phai la <td> chua nut mo chi tiet");
});

test("MUC 7 V5 — nut nam TRONG khung bang tab PR, khong loai ra khoi panel", () => {
  const panel = prPanel(CODE);
  const total = panel.split(MARK_BTN).length - 1;
  assert.equal(total, 1, `trong khung bang tab PR phai co dung 1 marker ${MARK_BTN}, hien tai = ${total}`);
  assert.ok(panel.includes(LABEL), `khong thay chu "${LABEL}" trong khung bang tab PR`);
});

test("MUC 7 V6 — DOC CHUNG AM: sai cong / bo cot thao tac thi V2 va V3 phai DO", () => {
  // (a) sai cong: doi sang poDetail
  const saiCong = CODE.replace('onClick={()=>open("detail",', 'onClick={()=>open("poDetail",');
  assert.notEqual(saiCong, CODE, "thay the (a) khong tac dung — mau thay mau ra khong khop mo hinh that");
  assert.doesNotMatch(
    prPanel(saiCong),
    /onClick=\{\(\)=>open\("detail",\s*\w+\)\}/,
    "phe bien 'detail' phai mat khi doi sang 'poDetail'",
  );

  // (b) bo cot thao tac o thead
  const boCot = prPanel(CODE).replace(/<th\s*\/>\s*<\/tr><\/thead>/, "</tr></thead>");
  assert.notEqual(boCot, prPanel(CODE), "thay the (b) khong tac dung — thead khong co <th /> de go");
  assert.doesNotMatch(boCot, /<th\s*\/>\s*<\/tr><\/thead>/, "V3 phai DO khi bo cot thao tac");
});
