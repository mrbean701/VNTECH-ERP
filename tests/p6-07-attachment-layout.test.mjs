// MT2-P6-07 (§4.5) — HỢP ĐỒNG: sửa CHỒNG CHÉO + TRÀN NGANG của khối «TÀI LIỆU ĐÍNH KÈM» (hồ sơ chi tiết phê duyệt).
// Nguyên văn §4.5: «Fix: lỗi font · text overlap · input upload · responsive. ⛔ Không để label và file selector
//                  chồng lên nhau. Phải kiểm trên nhiều kích thước màn hình.»
// ⚠️ TRUNG THỰC: lỗi được TÌM bằng ĐO LIVE (`tools/probe-p6-07-attachment-layout.mjs`) trên bundle đang phục vụ:
//   khối đính kèm bị GRID nhiều cột ⇒ form tải tệp co còn **34px**, ô chọn tệp 26px, `scrollWidth 343 > clientWidth 266`
//   (TRÀN 77–86px). Hợp đồng dưới đây KHOÁ 3 ghi đè CSS đã sửa; phần ĐO LIVE là `probe-p6-07` (4/4 trên bundle
//   VNTECH-FP-EF1A0EB3429FD95F: ô chọn tệp 188×44, chồng 0px², không tràn).
// Chạy: node --import tsx --test tests/p6-07-attachment-layout.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const css = readFileSync(new URL("../app/styles/canonical.css", import.meta.url), "utf8");

test("P6-07 — trong hồ sơ chi tiết phê duyệt, KHỐI ĐÍNH KÈM xếp DỌC (⛔ không bị grid nhiều cột ép form)", () => {
  assert.match(css, /\.approval-files\.real-attachment-panel \.attachment-panel \{ display: block !important; \}/,
    "khối đính kèm phải là BLOCK trong khung hẹp (nếu là grid nhiều cột ⇒ form bị nhét vào cột 34px)");
});

test("P6-07 — form tải tệp về MỘT CỘT, ⛔ bỏ sàn cứng 260px gây tràn", () => {
  assert.match(css, /\.real-attachment-panel \.file-upload \{[\s\S]{0,80}grid-template-columns: minmax\(0, 1fr\) !important;/,
    "phải ghi đè `grid-template-columns: minmax(0,1fr)` cho form trong khung hẹp");
});

test("P6-07 — chặn TRẦN bề rộng ở MỌI tầng bao + clamp ô chọn tệp", () => {
  assert.match(css, /\.attachment-panel, \.approval-files, \.real-attachment-panel \{ min-width: 0; max-width: 100%; \}/,
    "khung bao phải có trần 100%");
  // ⚠️ CẬP NHẤT 23/09/2026 (MT2-P14-03c): 3 khối `.attachment-pick > input[type="file"]` CÙNG ngữ cảnh
  // (P2-06 · P6-07 · font-scale) đã được **GỘP thành 1 khối** để hết «khối trùng» mà cổng `probe-css-budget`
  // đếm là nợ — ⛔ KHÔNG mất thuộc tính nào: khối gộp vẫn chứa `width/min-width/max-width` +
  // `overflow: hidden` + `text-overflow: ellipsis` + `font-size: calc(...)`.
  assert.match(css, /\.attachment-pick > input\[type="file"\] \{[^}]*overflow: hidden; text-overflow: ellipsis;[^}]*\}/,
    "ô chọn tệp native phải bị clamp (nội dung bên trong rộng hơn hộp)");
  assert.match(css, /\.attachment-pick > input\[type="file"\] \{[^}]*max-width: 100%;[^}]*\}/,
    "ô chọn tệp native vẫn phải có trần bề rộng 100% (P2-06)");
});

test("P6-07 — có CÔNG CỤ ĐO LIVE cho khối đính kèm (⛔ không chỉ test tầng nguồn)", () => {
  assert.ok(existsSync(new URL("../tools/probe-p6-07-attachment-layout.mjs", import.meta.url)),
    "phải có probe headless đo 4 kích thước màn hình");
});
