// VÒNG 1 (GO-LIVE) · MỤC 3 — «Xóa các thông tin thừa ở ngay phía dưới nhóm nút chức năng
// của 3 tab PR · PO · Chi tiết lũy kế theo vật tư».
//
// ĐO ĐƯỢC (đọc `app/screens/Purchasing.tsx` trước khi sửa) — có 3 đoạn văn bản nằm ngay
// dưới thanh công cụ, TẤT CẢ đều lặp lại thứ đã hiện ngay phía trên chúng:
//   :339 — mô tả lại bộ lọc (Trạng thái · Ngày · Phòng ban · …) vốn đã là chính thanh công cụ phía trên
//   :341 — giải thích chữ tắt PR/PO + "chỉ ĐỌC" + **ghi lịch sử "vòng 211 · mục 1.4"** (log thay đổi
//          để lại trong giao diện — đúng loại "thông tin thừa" người dùng phản ánh)
//   :340 — ⚠️ cảnh báo PR và PO lọc theo HAI CỘT NGÀY khác nhau ⇒ KHÔNG thừa
//
// ⛔ HỢP ĐỒNG PHẢI GIỮ (đã grep toàn bộ `tests/`):
//   · `tests/moc121-purchasing-tabs.test.mjs:104` — phải còn ít nhất MỘT `purchasing-tab-note`.
//   · `tests/v211-purchasing-mat-tab.test.mjs:107` — phải còn đúng dạng
//     `{dateDim&&<p className="purchasing-tab-note" data-vntech="purchasing-date-dim-note">`.
//   · `tests/v211-purchasing-mat-tab.test.mjs:105,110` — `const dateDim=(activeTab==="PR"||activeTab==="PO")?…`
//     và `PURCHASING_DATE_DIM[activeTab]` đúng 1 lần.
// ⇒ Quyết định: XOÁ HẲN :339 và :341; RÚT GỌN :340 xuống một câu, GIỮ NGUYÊN cấu trúc.
// ⛔ KHÔNG được xoá hết (sẽ phá 2 hợp đồng trên) và ⛔ KHÔNG được xoá cảnh báo ngày — đó là thông tin
//   DÙNG ĐỂ TRUY VẾT: không có nó, người dùng sẽ báo «PR/PO lọc cùng ngày mà số dòng khác nhau = bug».
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const RAW = readFileSync(new URL("../app/screens/Purchasing.tsx", import.meta.url), "utf8");
// Bỏ CHÚ THÍCH trước khi đo (D-101/D-098): bản sửa thường giải thích bằng chính chuỗi mà vệ cấm.
const CODE = RAW.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

const countOf = (src, needle) => src.split(needle).length - 1;

test("MUC 3 V1 — CHI con MOT doan ghi chu duoi nhom nut, va doan do la canh bao ngay", () => {
  // `data-vntech` xuất hiện đúng 1 lần: đoánh số văn bản thừa, không đoánh số class dùng chung.
  assert.equal(countOf(CODE, 'data-vntech="purchasing-date-dim-note"'), 1, "phai con DUNG MOT canh bao ve ngay");
});

test("MUC 3 V2 — da XOA HAI doan thua (mo ta lai bo loc + ghi chu lich su trong UI)", () => {
  assert.doesNotMatch(CODE, /Bảng này chỉ hiện dữ liệu khớp bộ lọc/, "doan mo ta lai bo loc phai bi xoa");
  assert.doesNotMatch(CODE, /vòng 211/gi, "khong duoc de lai ghi chu lich su cua phien ban trong giao dien");
});

test("MUC 3 V3 — canh bao ngay PHAI con va van giu nguyen cu phap", () => {
  // Đúng hình dạng mà `v211:107` khoá.
  assert.match(CODE, /\{dateDim&&<p className="purchasing-tab-note" data-vntech="purchasing-date-dim-note">/);
  // Và còn nói đúng việc: hai tab lọc bằng hai cột ngày khác nhau.
  assert.match(CODE, /Hai cột ngày|hai cột ngày/, "canh bao phai con noi ro PR/PO loc bang HAI cot ngay khac nhau");
});

test("MUC 3 V4 — can bao KHONG con tho lan kieu thuat ngu va lenh lich su", () => {
  const note = /data-vntech="purchasing-date-dim-note"><small>([\s\S]*?)<\/small><\/p>/.exec(CODE);
  assert.ok(note, "khong tach duoc noi dung canh bao ve ngay");
  const text = note[1];
  assert.doesNotMatch(text, /created|PURCHASING_DATE_DIM|vòng 211|field|<code>/, `canh bao con ky thuat thua: ${text}`);
});

test("MUC 3 V5 — HOP DONG moc121: van con it nhat MOT purchasing-tab-note", () => {
  assert.ok(countOf(CODE, "purchasing-tab-note") >= 1, "khong duoc xoa het purchasing-tab-note (moc121:104)");
});

test("MUC 3 V6 — HOP DONG v211: dateDim va PURCHASING_DATE_DIM[activeTab] nguyen ven", () => {
  assert.match(CODE, /const dateDim=\(activeTab==="PR"\|\|activeTab==="PO"\)\?PURCHASING_DATE_DIM\[activeTab\]:null;/);
  assert.equal(countOf(CODE, "PURCHASING_DATE_DIM[activeTab]"), 1, "chi duoc doc o dinh nghia dateDim");
});

test("MUC 3 V7 — DOC CHUNG AM: ghep lai doan thua, hoac rut canh bao ve rong, thi phai DO", () => {
  // (a) ghep lai doan mo ta bo loc
  const ghepLai = CODE.replace(
    /\{dateDim&&<p className="purchasing-tab-note"/,
    '<p className="purchasing-tab-note"><small>Bảng này chỉ hiện dữ liệu khớp bộ lọc: Trạng thái.</small></p>\n      {dateDim&&<p className="purchasing-tab-note"',
  );
  assert.notEqual(ghepLai, CODE, "mau (a) khong khop — hay do lai vi tri khai bao canh bao ve ngay");
  assert.match(ghepLai, /Bảng này chỉ hiện dữ liệu khớp bộ lọc/, "V2 phai bat duoc doan thua khi no bi ghep lai");

  // (b) rut canh bao ve ngay thanh noi dung
  const rutRong = CODE.replace(/(data-vntech="purchasing-date-dim-note"><small>)[\s\S]*?(<\/small><\/p>)/, "$1$2");
  assert.notEqual(rutRong, CODE, "mau (b) khong khop — hay do lai cu phap the canh bao ve ngay");
  assert.doesNotMatch(rutRong, /Hai cột ngày|hai cột ngày/, "V3 phai DO khi canh bao ve ngay bi rut sach");
});