// HỢP ĐỒNG — «ẢNH / HỒ SƠ VẬT TƯ PHẢI TRỎ ĐÚNG ENDPOINT TỆP» (ERP-SESSION-03, 07/10/2026)
//
// ⛔ VÌ SAO CÓ TỆP NÀY: công cụ của dự án `tools/probe-task075-attachments.mjs` (ca **D2**) đang **ĐỎ**:
//     check("D2 · có ≥2 thẻ <img> trỏ đúng endpoint tệp (dải ảnh + ô thu nhỏ)",
//           page.split('src={`/api/files?id=${encodeURIComponent(file.id)}`}').length - 1 >= 2)
//   ⭐ ĐO ĐƯỢC (07/10/2026, `lib/ui-shared.tsx`):
//     · chuỗi NGUYÊN VĂN mà D2 đòi khớp: **0 lần**
//     · nhưng `/api/files?id=${encodeURIComponent(` xuất hiện **6 lần**, trong đó **3 là thẻ `<img>`**:
//         ① dải ảnh      `<img src={…encodeURIComponent(id)}`            (biến cục bộ `id`)
//         ② ô thu nhỏ    `<img className="attachment-thumb" src={…encodeURIComponent(String(file.id))}`
//         ③ xem trước    `<img src={…encodeURIComponent(String(preview.id))}`
//       (3 lần còn lại là `fetch(DELETE)` và 2 thẻ `<a href=…>` — ⛔ không phải `<img>`)
//   ⇒ **D2 ĐỎ OAN**: ý nghĩa của ca («có ≥2 ảnh trỏ đúng endpoint») **ĐÃ ĐƯỢC THOẢ**; chỉ **cách khớp chuỗi quá cứng**.
//
// ⭐ TỆP NÀY LÀM GÌ: khoá ĐÚNG Ý NGHĨA đó bằng **bộ khớp DUNG SAI** (chấp nhận `id` · `String(file.id)` · `String(preview.id)`)
//   ⇒ (a) chặn hồi quy thật cho khu vực «Ảnh và hồ sơ giao hàng», (b) ⛔ không lặp lại việc «sửa mã đang đúng»
//   chỉ vì một cổng khớp chuỗi cứng.
//   ⚠️ Việc sửa **chính công cụ** `tools/probe-task075-attachments.mjs` ⛔ **không thuộc phiên 03** (`tools/**` là mã dùng chung)
//   ⇒ đã ghi `HANDOFF-20261007-C09`.
//
// Chạy riêng:  node --test tests/mt3-c07-attachment-imgs.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const UI = read("lib/ui-shared.tsx");

/** Đếm thẻ `<img …>` có `src` trỏ `/api/files?id=…` — ⛔ chấp nhận nhiều cách viết tham số (dung sai CÓ CHỦ Ý). */
function imgTagsToFileEndpoint(source) {
  const tags = [...source.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
  return tags.filter((tag) => /\/api\/files\?id=\$\{encodeURIComponent\(/.test(tag));
}

test("C07-1 · có ≥2 thẻ <img> trỏ đúng endpoint tệp (⛔ KHÔNG đòi một cách viết duy nhất)", () => {
  const imgs = imgTagsToFileEndpoint(UI);
  assert.ok(imgs.length >= 2,
    `⛔ Chỉ thấy ${imgs.length} thẻ <img> trỏ /api/files — người dùng sẽ KHÔNG thấy ảnh hồ sơ (dải ảnh + ô thu nhỏ + xem trước)`);
  // ĐỐI CHỨNG ÂM: chuỗi nguyên văn mà cổng cũ đòi khớp ⇒ ghi lại con số để ⛔ không ai "sửa" mã cho vừa chuỗi đó.
  const literalHits = UI.split('src={`/api/files?id=${encodeURIComponent(file.id)}`}').length - 1;
  assert.equal(literalHits, 0,
    "⚠️ nếu con số này KHÁC 0 thì ai đó đã đổi cách viết cho vừa cổng cũ — đọc lại chú thích đầu tệp trước khi kết luận");
});

test("C07-2 · panel Ảnh/Hồ sơ phải có: trạng thái rỗng · lọc theo `mimeType` · bắt lỗi ảnh hỏng", () => {
  // Hợp đồng trường: API trả `mimeType` (⛔ KHÔNG phải `type`) — cổng A3 của dự án đã đo điều này.
  assert.match(UI, /mimeType/, "⛔ UI phải lọc ảnh theo trường `mimeType` (tên trường API thật)");
  assert.match(UI, /data-vntech="attachment-load-error"/, "⛔ phải có thông báo khi KHÔNG tải được danh sách tệp (⛔ không im lặng)");
  assert.match(UI, /markBroken|is-broken/, "⛔ ảnh lỗi phải được đánh dấu (⛔ không hiện khung vỡ im lặng)");
  assert.match(UI, /attachment-photos/, "phải có dải ảnh riêng");
  assert.match(UI, /loadFiles/, "⛔ phải nạp lại danh sách sau khi tải lên/xoá");
});
