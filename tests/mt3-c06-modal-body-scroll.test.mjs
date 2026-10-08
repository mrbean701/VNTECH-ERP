// HỢP ĐỒNG — `BUG-20261007-C07` (ERP-SESSION-03, 07/10/2026): THÂN MODAL PHẢI GIÃN HẾT KHUNG VÀ CUỘN ĐƯỢC.
//
// ⛔ HIỆN TƯỢNG USER BÁO (MT3 §V-E «Đơn hàng đã giao»):
//   «Modal chi tiết giao hàng đang hiển thị sai, mục **Ảnh và hồ sơ giao hàng** đang bị **ẩn** đi không hiển thị đầy đủ».
//
// ⭐ ĐO ĐƯỢC TRƯỚC KHI SỬA (Chrome headless, 1440×900, mở modal «Chi tiết đơn giao hàng»):
//     .receipt-modal   top=0  bottom=768  h=768   overflow=hidden      (vh=808)
//     .drawer-body     top=101 bottom=669 h=568   clientH=568 scrollH=568
//                      flex="0 1 auto"  min-height="auto"  overflowY=auto
//     khối CUỐI kết thúc ở bottom=707  >  đáy thân 669   ⇒ **38px BỊ CẮT**
//     và `scrollHeight == clientHeight` ⇒ ⛔ **KHÔNG có gì để cuộn** ⇒ nội dung bị cắt là **KHÔNG THỂ TỚI**.
//
// ⭐ ROOT CAUSE: `.drawer-body` là lớp của `.drawer`, ⛔ KHÔNG có `flex:1 1 auto` và ⛔ KHÔNG có `min-height:0`;
//   nó nằm trong `.modal` (`display:flex; flex-direction:column; overflow:hidden`) ⇒ thân KHÔNG giãn hết khung,
//   ⛔ KHÔNG co xuống dưới kích thước nội dung (`min-height:auto`) ⇒ nội dung tràn ra ngoài và bị `overflow:hidden` CẮT.
//   Lớp ĐI KÈM `.modal` là **`.modal-body`** — có `flex:1 1 auto; min-height:0` (xem `app/globals.css`).
//
// Chạy riêng:  node --test tests/mt3-c06-modal-body-scroll.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const GLOBALS = read("app/globals.css");

/** Trích thân quy tắc theo selector (⛔ không regex tham lam toàn tệp). */
function ruleBody(css, selector) {
  const at = css.indexOf(selector);
  if (at < 0) return "";
  const open = css.indexOf("{", at), close = css.indexOf("}", open);
  return open < 0 || close < 0 ? "" : css.slice(open + 1, close);
}

test("C06-1 · `.modal` ⛔ CẮT nội dung (`overflow:hidden`) ⇒ thân modal BẮT BUỘC có `flex:1 1 auto` + `min-height:0`", () => {
  const modal = ruleBody(GLOBALS, ".modal {");
  assert.ok(modal, "không tìm thấy quy tắc `.modal {` trong `app/globals.css`");
  assert.match(modal, /overflow:\s*hidden/, "tiền đề: `.modal` phải là khung CẮT nội dung (nếu đổi thì phải đọc lại bài học này)");
  const body = ruleBody(GLOBALS, ".modal-body {");
  assert.ok(body, "không tìm thấy quy tắc `.modal-body {`");
  assert.match(body, /flex:\s*1 1 auto/, "⛔ `.modal-body` phải giãn hết khung (`flex:1 1 auto`) ⇒ nếu mất, nội dung cuối modal bị CẮT");
  assert.match(body, /min-height:\s*0/, "⛔ `.modal-body` phải có `min-height:0` ⇒ nếu mất, thân không co được ⇒ nội dung tràn ra ngoài khung");
  assert.match(body, /overflow-y:\s*auto/, "⛔ thân modal phải là vùng CUỘN (nội dung dài phải cuộn tới được)");
});

test("C06-2 · `.drawer-body` ⛔ KHÔNG có `flex`/`min-height` ⇒ ⛔ TUYỆT ĐỐI không dùng nó làm thân của `.modal`", () => {
  const body = ruleBody(GLOBALS, ".drawer-body {");
  assert.ok(body, "không tìm thấy quy tắc `.drawer-body {`");
  assert.doesNotMatch(body, /flex:\s*1 1 auto/, "⚠️ nếu `.drawer-body` NAY đã có `flex:1 1 auto` thì hợp đồng này đã cũ ⇒ đọc lại `BUG-20261007-C07` trước khi sửa test");
});

test("C06-3 · `ReceiptDrawer` (modal «Chi tiết đơn giao hàng») phải dùng thân `.modal-body` — ⛔ không dùng trần `.drawer-body`", () => {
  const src = read("app/screens/ReceiptDrawer.tsx");
  // Tiền đề: khung là `.modal` (⛔ không phải `.drawer`).
  assert.match(src, /className="modal card receipt-modal"/, "tiền đề: khung của modal này là `.modal`");
  // ⛔ CẤM: thân CHỈ có `drawer-body` (thiếu `modal-body`) ⇒ tái phát lỗi cắt nội dung.
  assert.doesNotMatch(src, /<div className="drawer-body">/,
    "⛔ `<div className=\"drawer-body\">` trần trong `.modal` ⇒ thân KHÔNG giãn/không cuộn ⇒ 2 khối cuối (Ảnh giao hàng · Chứng chỉ) BỊ CẮT");
  // ✅ BẮT BUỘC: có `modal-body` (dù ghép thêm lớp nào khác).
  assert.match(src, /className="drawer-body modal-body"|className="modal-body/,
    "⛔ thân modal phải mang lớp `modal-body` (đi kèm `.modal`) để có `flex:1 1 auto; min-height:0`");
  // Và 2 khối user báo PHẢI còn trong mã (⛔ không được 'sửa' bằng cách xoá mục).
  assert.match(src, /Ảnh giao hàng/, "⛔ KHÔNG được xoá khối «Ảnh giao hàng»");
  assert.match(src, /Chứng chỉ \/ Tài liệu đã tải lên/, "⛔ KHÔNG được xoá khối «Chứng chỉ / Tài liệu đã tải lên»");
  assert.match(src, /<AttachmentPanel entityType="goods_receipt" entityId=\{receipt\.id\} \/>/, "⛔ khối hồ sơ phải vẫn render `AttachmentPanel`");
});

test("C06-4 · ⛔ KHÔNG còn tệp nào ghép `.modal` (khung) với thân `.drawer-body` TRẦN", () => {
  const files = [];
  const walk = (dirUrl, prefix) => {
    for (const e of readdirSync(dirUrl, { withFileTypes: true })) {
      const next = prefix + e.name;
      if (e.isDirectory()) { walk(new URL(e.name + "/", dirUrl), next + "/"); continue; }
      if (/\.tsx$/.test(e.name) && !/\.test\./.test(e.name)) files.push(next);
    }
  };
  for (const root of ["app", "lib"]) walk(new URL(`../${root}/`, import.meta.url), root + "/");
  // ⭐ CHỐT VÙNG PHỦ (⭐ chống «ĐẠT RỖNG» — LUẬT 21): ⛔ nếu bộ quét không đọc được tệp nào thì «0 vi phạm» VÔ NGHĨA.
  assert.ok(files.length >= 40, `⛔ CHỐT VÙNG PHỦ: chỉ quét được ${files.length} tệp (kỳ vọng ≥ 40) ⇒ bộ quét HỎNG`);
  const offenders = [];
  for (const f of files) {
    const code = read(f).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    const hasModalShell = /className="[^"]*\bmodal\b[^"]*"/.test(code);
    const bareDrawerBody = /<div className="drawer-body">/.test(code);
    if (hasModalShell && bareDrawerBody) offenders.push(f);
  }
  assert.deepEqual(offenders, [],
    "⛔ Tệp vừa dùng khung `.modal` vừa dùng thân `.drawer-body` TRẦN ⇒ nội dung cuối modal sẽ bị CẮT:\n" + offenders.join("\n"));
});

test("C06-9 · ĐỐI CHỨNG ÂM: bộ dò của `C06-4` PHẢI bắt được HÌNH DẠNG NGUY HIỂM thật (⛔ nếu không ⇒ cổng VÔ DỤNG)", () => {
  // ⭐ Dùng ĐÚNG 2 biểu thức của `C06-4` (⭐ mẫu lịch sử thật: khung `.modal` + thân `.drawer-body` TRẦN):
  const radar = (code) => {
    const hasModalShell = /className="[^"]*\bmodal\b[^"]*"/.test(code);
    const bareDrawerBody = /<div className="drawer-body">/.test(code);
    return hasModalShell && bareDrawerBody;
  };
  assert.equal(radar(`<div className="modal"><div className="drawer-body"><div className="drawer-section">x</div></div></div>`), true,
    "⛔ bộ dò HỎNG: không bắt được mẫu «khung .modal + thân .drawer-body TRẦN»");
  // ⛔ Và ⛔ KHÔNG báo oan hình dạng AN TOÀN (thân đã đổi sang `.modal-body` / `.drawer-body edm-body`):
  assert.equal(radar(`<div className="modal"><div className="modal-body"><div className="drawer-body edm-body">x</div></div></div>`), false,
    "⛔ báo OAN hình dạng an toàn");
});