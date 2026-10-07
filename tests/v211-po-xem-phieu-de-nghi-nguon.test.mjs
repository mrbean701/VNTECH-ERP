/**
 * VÒNG 211 — LỖI 3.1: từ PO bấm «Xem phiếu đề nghị nguồn» thì màn hình báo lỗi.
 *
 * GỐC RỄ (đã truy vết, không phải phỏng đoán):
 *   `PurchaseOrderDrawer` gọi `open("detail", { id, requestNo })` — MỘT OBJECT RÚT GỌN 2 TRƯỜNG.
 *   Nhưng `RequestDrawer` nhận `request` và dùng THẲNG, KHÔNG tự tra cứu lại từ `data`
 *   (`app/screens/RequestDrawer.tsx:25-37`). Mọi trường còn lại thành `undefined` ⇒ màn vỡ.
 *   Mọi nơi khác đều truyền DÒNG ĐẦY ĐỦ: `app/screens/Requests.tsx:128`, `app/page.tsx:600/707/1174`.
 *
 * HỢP ĐỒNG ĐƯỢC KHOÁ Ở ĐÂY: caller của `open("detail", …)` PHẢI truyền bản ghi đầy đủ.
 *
 * Vì sao đọc mã nguồn chứ không chạy UI: lỗi này chỉ lộ ra qua thao tác tay trên trình duyệt;
 * tệp thử đọc nguồn là cách duy nhất chặn tái phát trong `npm test` (xem D-086).
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const read = (p) => readFileSync(new URL(p, root), "utf8");

// Bóc chú thích để khẳng định kiểm MÃ, không kiểm lời giải thích (không cắt `://` để khỏi trúng URL).
const codeOf = (src) => src
  .replace(/\/\*[\s\S]*?\*\//g, " ")
  .split("\n")
  .map((line) => {
    const i = line.indexOf("//");
    if (i === -1) return line;
    return i > 0 && line[i - 1] === ":" ? line : line.slice(0, i);
  })
  .join("\n");

const po = read("app/screens/PurchaseOrderDrawer.tsx");
const req = read("app/screens/RequestDrawer.tsx");

test("VỆ 1 — PO KHÔNG được truyền object rút gọn cho màn chi tiết PR", () => {
  // Đây chính là dòng gây lỗi: `open("detail", { id: …, requestNo: … })`.
  assert.doesNotMatch(
    po,
    /open\("detail",\s*\{\s*id:/,
    "PO vẫn truyền object rút gọn `{ id, requestNo }` cho màn chi tiết — " +
      "RequestDrawer dùng thẳng object này nên các trường khác đều undefined và màn sẽ vỡ.",
  );
});

test("VỆ 2 — PO phải tra cứu bản ghi PR đầy đủ theo request_id", () => {
  assert.match(
    po,
    /data\.requests[\s\S]{0,160}?String\(r\.id\)\s*===\s*String\(purchaseOrder\.requestId\)/,
    "PO phải tra cứu PR nguồn trong data.requests theo purchaseOrder.requestId.",
  );
  // Đối chiếu theo `id`, KHÔNG theo `requestNo`: `requestNo` trong payload PO có thể rỗng.
  assert.match(po, /open\("detail",\s*banPR\)/, "Phải mở bằng bản ghi đã tra cứu được, không phải bản ghi tự chế.");
});

test("VỆ 3 — không có bản ghi thì KHÔNG mở màn hỏng và phải nói rõ lý do TẠI CHỖ", () => {
  // ⛔ HỢP ĐỒNG SIẾT LẠI Ở VÒNG 1 (GO-LIVE). Bản gốc khoá `window.alert` + `disabled={!banPR}`.
  //   Đo được: nhánh `alert` nằm SAU khoá `disabled` ⇒ MÃ CHẾT KHÔNG BAO GIỜ CHẠY; còn `title`
  //   hứa «bấm để xem lý do» thì không bao giờ bấm được ⇒ người dùng KHÔNG BAO GIỜ thấy lý do,
  //   chỉ thấy hộp thoại chặn người dùng. Sửa theo đúng mẫu nhà của nút truy vết ngược cùng loại
  //   (`ReceiptDrawer.tsx`: `grn-source-po-missing`).
  //   Ý GỐC GIỮ NGUYÊN: không mở màn hỏng + nói rõ lý do.
  const code = codeOf(po);
  // Đường lùi: nói rõ lý do NGAY TRONG MÀN (không hộp thoại chặn người dùng), nêu luôn request_id để tra.
  assert.doesNotMatch(code, /window\.alert\(/, "Hộp thoại chặn người dùng không được phép thay đường lùi tại chỗ.");
  assert.match(code, /data-vntech="po-source-pr-missing"/, "Phải có nhánh nói rõ lý do khi không tra được PR nguồn.");
  assert.match(code, /purchaseOrder\.requestId\}/, "Thông báo phải nêu request_id để người dùng tra được nguyên nhân.");
  // Nút phải bấm được: lý do nằm trên màn, không phải sau một nút bị khoá.
  assert.doesNotMatch(code, /po-source-pr-open[^>]*disabled/, "Nút không được khoá — người dùng cần bấm/tiệm cận được lý do.");
  // Và phải giữ đúng nguyên tắc cũ: khi không tra được thì KHÔNG mở màn chi tiết PR.
  assert.match(code, /if \(orphan \|\| !banPR\) return;/, "Không có bản ghi thì KHÔNG được mở màn chi tiết PR.");
});

test("VỆ 4 — khoá hợp đồng: RequestDrawer dùng thẳng `request`, không tự tra cứu lại", () => {
  // Đây là lý do gốc rễ. Nếu sau này ai đó cho RequestDrawer tự tra cứu, vệ này sẽ báo
  // để xem lại các call site khác (vì chúng sẽ trở nên thừa/không nhất quán).
  assert.match(
    req,
    /function RequestDrawer\(\{[\s\S]{0,200}?request:\s*Row/,
    "RequestDrawer phải nhận request dạng Row.",
  );
  const coTuTraCuu = /data\.requests[\s\S]{0,120}?\.find\(/.test(
    req.slice(req.indexOf("function RequestDrawer")),
  );
  assert.equal(
    coTuTraCuu,
    false,
    "RequestDrawer đã tự tra cứu lại — mọi call site truyền object rút gọn sẽ không còn hỏng. " +
      "Hãy rà lại toàn bộ `open(\"detail\", …)` và cập nhật tệp thử này.",
  );
});

test("VỆ 5 — mọi call site còn lại của open(\"detail\") đều truyền DÒNG ĐẦY ĐỦ", () => {
  // Trái nhiệm giao kế: chỉ PO vừa được sửa. Hai chỗ còn lại phải truyền biến `row`/`selected`
  // chứ không phải object literal ⇒ không lặp lại lỗi trên.
  const reqs = read("app/screens/Requests.tsx");
  assert.match(reqs, /open\("detail",\s*row\)/, "Requests.tsx phải truyền dòng đầy đủ `row`.");
  const page = read("app/page.tsx");
  for (const bien of ["open(\"detail\",result.row)", "open(\"detail\",n.row)", "open(\"detail\",selected)"]) {
    assert.ok(page.includes(bien), `Thiếu call site hợp lệ: ${bien}`);
  }
  assert.doesNotMatch(page, /open\("detail",\s*\{\s*id:/, "page.tsx không được truyền object rút gọn.");
});