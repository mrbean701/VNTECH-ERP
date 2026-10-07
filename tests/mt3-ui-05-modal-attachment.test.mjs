// MT3-UI-05 — HỢP ĐỒNG: chi tiết mở bằng MODAL (⛔ không side panel/side tab) và vùng hồ sơ
// phải hiển thị đầy đủ: có vùng cuộn, có trạng thái rỗng, xử lý lỗi ảnh/tệp, responsive.
//
// 📌 KẾT QUẢ AUDIT ĐỌC TỪ MÃ (trung thực, không giả định):
//   • `ReceiptDrawer.tsx` ⛔ ĐÃ LÀ MODAL từ trước: `<div class="overlay"><aside class="modal card receipt-modal">`
//     (`.modal` trong `globals.css` = width:min(900px,96vw); max-height:94vh, canh giữa trong `.overlay`;
//      `.drawer` (neo phải, `border-left`) là lớp RIÊNG, ⛔ receipt-modal KHÔNG dùng lớp đó).
//     ⇒ MT3 §E «Chi tiết đơn giao hàng phải là modal, không phải side tab» ĐÃ ĐÚNG từ trước.
//   • Phần còn thiếu thật: vùng hồ sơ chưa có cuộn riêng, chưa xử lý ảnh hỏng, và nuốt im lặng lỗi tải.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const receipt = read("app/screens/ReceiptDrawer.tsx");
const shared = read("lib/ui-shared.tsx");
const css = read("app/styles/canonical.css");
const globals = read("app/globals.css");

test("MT3-UI-05 — Đơn hàng đã giao mở bằng MODAL, ⛔ không dùng lớp side panel (`.drawer`)", () => {
  assert.match(receipt, /className="overlay"[\s\S]{0,120}className="modal card receipt-modal"/,
    "phải mở chi tiết bằng overlay + modal");
  // ⚠️ CHÍNH XÁC: lớp LAYOUT side panel là `.drawer` (đứng riêng, `globals.css:1023` có `border-left`).
  //    Các lớp `drawer-body` / `drawer-section` chỉ là lớp LỒNG bên trong (tên cũ) ⇒ ⛔ KHÔNG cấm.
  assert.doesNotMatch(receipt, /className="drawer(?![\w-])/,
    "⛔ MT3 §E: chi tiết đơn giao hàng phải là MODAL, không phải side tab (không dùng lớp layout `.drawer`)");
  // `.modal` phải thật sự canh giữa và có trần theo viewport (⛔ không cao cứng).
  assert.match(globals, /\.modal\s*\{[^}]*max-height:\s*9\dvh/, "`.modal` phải có trần theo viewport (⛔ không cao cứng)");
  // Lớp layout `.drawer` trong CSS phải là bên phải (để chứng minh 2 lớp này KHÁC nhau).
  assert.match(globals, /\.drawer\s*\{[^}]*border-left/, "`.drawer` là side panel neo phải — khác hẳn `.modal`");
});

test("MT3-UI-05 — vùng hồ sơ CÓ VÙNG CUỘN riêng (⛔ không bị cắt trong modal)", () => {
  assert.match(css, /\.attachment-panel\s*\{[^}]*overflow:\s*auto/,
    "vùng hồ sơ phải cuộn được trong modal");
  assert.match(css, /\.attachment-panel\s*\{[^}]*max-height:\s*min\(\s*\d+vh/,
    "⛔ giới hạn cao phải theo VIEWPORT (vh), không dùng px cứng");
  assert.match(css, /@media \(max-width: 650px\)\s*\{\s*\.attachment-panel\s*\{[^}]*max-height/,
    "phải có xử lý riêng cho màn hẹp (responsive §E)");
});

test("MT3-UI-05 — ⛔ ẢNH HỎNG phải được xử lý (không để biểu tượng ảnh vỡ)", () => {
  assert.match(shared, /onError=\{\(\)=>markBroken\(/, "mọi thẻ ảnh phải có onError xử lý ảnh hỏng");
  assert.match(shared, /attachment-broken-mark/, "phải có nhãn thay thế khi ảnh lỗi");
  assert.match(shared, /attachment-thumb is-broken/, "ảnh thumbnail hỏng cũng phải có nhãn thay thế");
  // ⛔ Ảnh hỏng KHÔNG được bấm mở lightbox (vì không có gì để xem).
  assert.match(shared, /onClick=\{\(\)=>!broken&&setPreview\(file\)\}/, "ảnh lỗi không được mở xem");
});

test("MT3-UI-05 — ⛔ LỖI TẢI phải NÓI THẲNG, không lặng lẽ hiện «chưa có tệp»", () => {
  assert.match(shared, /attachment-load-error/, "phải có vùng báo lỗi tải");
  assert.match(shared, /role="alert"/, "thông báo lỗi phải dùng role=alert để trợ năng đọc được");
  assert.match(shared, /Không tải được danh sách hồ sơ/, "phải nói rõ không tải được, không im lặng");
  // Không được nuốt lỗi bằng `.catch(() => setFiles([]))` trần (không thông báo).
  assert.doesNotMatch(shared, /\.catch\(\(\)\s*=>\s*\{\s*if \(active\) setFiles\(\[\]\);\s*\}\)/,
    "⛔ cấm nuốt im lặng lỗi tải hồ sơ");
});

test("MT3-UI-05 — giữ nguyên trạng thái rỗng và các khả năng đã có", () => {
  assert.match(shared, /Chưa có ảnh hoặc hồ sơ vật tư đặc thù được tải lên/, "phải giữ trạng thái rỗng có sẵn");
  assert.match(shared, /attachment-lightbox/, "phải giữ trình xem ảnh toàn màn (lightbox)");
  assert.match(shared, /event\.key === "Escape"/, "phải giữ đóng bằng phím ESC");
  assert.match(shared, /canManage/, "phải giữ chế độ chỉ-đọc theo quyền");
});
