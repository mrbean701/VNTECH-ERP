// MỐC 121 · vòng 216 · NHÓM PO — mục 3.2 (nút «← Quay lại») + 3.3 (dòng rác) trên
// màn `app/screens/PurchaseOrderDrawer.tsx`.
// Viết SAU khi sửa (§14: mọi thay đổi phải có test). Khoá đúng những lỗi đã đo được:
//   ① MỤC 3.2 — `<header>` trong phần tab KHÔNG có quy tắc layout nào (đo: grep mọi selector
//      chứa `header` trong `app/styles/*.css` chỉ ra `.entity-detail-modal > header`, `.card > header p`,
//      `.dashboard-staff-card header …`) ⇒ `<div>` + `<button>` XẾP DỌC ⇒ nút «← Quay lại» nằm
//      DƯỚI tên tài liệu, ở bên TRÁI. Thêm nữa `.page-back` CHỈ được CSS hoá dưới
//      `.project-detail-head` (đo: `canonical.css:346`) — mà màn PO không có lớp cha đó ⇒ nút
//      KHÔNG có viền/nền. ⇒ Chuyển nút sang prop `actions` của `EntityDetailModal`, vốn được
//      ghi rõ trong `EntityDetailModal.tsx:64` là «Nút hành động ở góc phải tiêu đề» và đã có
//      CSS `.edm-head-actions { display:flex; align-items:center }`.
//   ② MỤC 3.3 — dòng «Mã kỹ thuật (request_id)» in thẳng UUID ra màn hình: thông tin chỉ có
//      ý nghĩa kỹ thuật, người dùng nghiệp vụ không dùng được ⇒ bỏ. Nhưng `request_id` VẪN phải
//      còn trong phần «Nguồn PR» (mô tả + nhánh PO mồ côi), và `tests/p2-d2-po-detail.test.mjs:46`
//      vẫn kiểm `purchaseOrder.requestId` trong khối đó ⇒ xoá đúng DÒNG, không xoá dữ liệu nguồn.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const read = (p) => readFileSync(new URL(p, root), "utf8");

const PO = read("app/screens/PurchaseOrderDrawer.tsx").replaceAll("\r\n", "\n");
const EDM = read("app/components/ui/EntityDetailModal.tsx").replaceAll("\r\n", "\n");
const CSS = read("app/styles/canonical.css").replaceAll("\r\n", "\n");
const GLOBALS = read("app/globals.css").replaceAll("\r\n", "\n");
const count = (hay, needle) => hay.split(needle).length - 1;

// ── MỤC 3.2 · nút «← Quay lại» nằm ở GÓC PHẢI TIÊU ĐỀ và nổi bật ─────────────────
test("3.2 — nút «← Quay lại» phải nằm trong prop `actions` của EntityDetailModal (góc phải tiêu đề)", () => {
  const modal = PO.slice(0, PO.indexOf("tabs={[{ key: \"po-detail\""));
  assert.ok(modal.length > 200, "phải tìm thấy lời gọi `<EntityDetailModal`");
  assert.match(modal, /\bactions=\{<button/,
    "⛔ nút «← Quay lại» phải nằm trong `actions` của `EntityDetailModal` (góc phải tiêu đề), không phải trong `<header>` của tab");
  assert.ok(modal.indexOf('← Quay lại') > modal.indexOf("actions={"),
    "nút phải nằm SAU chỗ mở `actions` — nếu không nó không thuộc cụm nút góc phải");
});

test("3.2 — `actions` của EntityDetailModal là khe góc phải, và đã có CSS flex (bằng chứng cho lựa chọn đặt nút ở đó)", () => {
  assert.match(EDM, /\/\*\* Nút hành động ở góc phải tiêu đề\. \*\//,
    "`actions` của `EntityDetailModal` phải được tài liệu hoá là góc phải tiêu đề");
  assert.match(EDM, /\{actions\}/, "`actions` phải được render vào cụm `.edm-head-actions`");
  assert.match(EDM, /className="edm-head-actions"/, "cụm nút phải mang lớp `.edm-head-actions`");
  assert.match(CSS, /\.edm-head-actions \{[^}]*display:\s*flex/,
    "`.edm-head-actions` phải là hàng flex — nếu không, nút «← Quay lại» lại xếp dọc như cũ");
});

test("3.2 — nút phải CÓ lớp nhà `.secondary`, vì `.page-back` KHÔNG có CSS ở bối cảnh modal", () => {
  // ĐO ĐƯỢC: trong `canonical.css` chỉ có đúng 2 quy tắc `.project-detail-head .page-back`,
  // và KHÔNG có quy tắc `.page-back` trần nào ⇒ đặt trong modal thì nút trần, không viền.
  assert.equal(count(CSS, ".project-detail-head .page-back"), 2,
    "giả định nền: `canonical.css` có đúng 2 quy tắc `.project-detail-head .page-back` + `…:hover` (dòng :346 và :357) — nếu đổi hãy cập nhật test");
  assert.equal(count(CSS, "\n.page-back"), 0,
    "giả định nền: KHÔNG có quy tắc `.page-back` không bị giới hạn bởi `.project-detail-head` — nếu có thì `secondary` không còn bắt buộc");
  // ⛔ Nếu sau này ai đó CSS hoá `.page-back` cho mọi nơi thì bỏ được `secondary`. Tới lúc đó sửa test.
  assert.match(PO, /className="secondary page-back"/,
    "nút «← Quay lại» phải mang lớp nhà `.secondary` để có viền/nền/cao 36px — `page-back` một mình KHÔNG có CSS ở modal");
  // `.secondary` khai ở `globals.css` (không phải `canonical.css`).
  assert.match(GLOBALS, /\.secondary \{[^}]*min-height/,
    "`.secondary` phải có kích thước đủ nổi bật (min-height) — khai ở `app/globals.css`");
});

// ── HỒI QUY: nút KHÔNG được nằm lại trong `<header>` của tab ───────────────────────
test("hồi quy — thẻ `<header>` trong phần tab KHÔNG được chứa nút (nó không có layout ⇒ nút sẽ rơi xuống dưới)", () => {
  const head = PO.slice(PO.indexOf("content: <><header>"), PO.indexOf('<div className="drawer-body">'));
  assert.ok(head.length > 50, "phải tìm thấy thẻ `<header>` của phần tab");
  assert.doesNotMatch(head, /<button/,
    "⛔ `<header>` của tab không có quy tắc `display:flex` nào ⇒ đặt nút ở đây là nút rơi xuống dưới tên tài liệu, bên trái (đúng lỗi mục 3.2)");
  assert.match(head, /<div><small className="document-name">ĐƠN MUA \(PURCHASE ORDER\)<\/small>/,
    "`<header>` phải giữ khối tên tài liệu + mã PO");
});

test("hồi quy — nút «← Quay lại» phảI đúng 1 nút trong tệp (tránh nhân bản)", () => {
  assert.equal(count(PO, "page-back"), 1, "chỉ được có đúng 1 nút quay lại trong màn PO");
  assert.equal(count(PO, "← Quay lại"), 1, "chỉ được có đúng 1 nhãn «← Quay lại»");
});

// ── MỤC 3.3 · bỏ dòng rác «Mã kỹ thuật (request_id)» ─────────────────────────────
test("3.3 — dòng «Mã kỹ thuật (request_id)» đã bỏ (không in UUID kỹ thuật ra màn hình)", () => {
  assert.equal(count(PO, "Mã kỹ thuật"), 0,
    "⛔ dòng «Mã kỹ thuật (request_id)» phải bỏ khỏi màn — người dùng nghiệp vụ không dùng được UUID");
  assert.doesNotMatch(PO, /<strong>\{purchaseOrder\.requestId\}<\/strong>/,
    "⛔ không được render thẳng `purchaseOrder.requestId` ra một ô riêng");
});

test("3.3 — bỏ dòng rác KHÔNG được làm mất thông tin cần thiết: `requestId` vẫn là nguồn của «Số phiếu đề nghị»", () => {
  const src = PO.slice(PO.indexOf('data-vntech="po-source-pr"'), PO.indexOf('data-vntech="po-summary-table"'));
  assert.ok(src.length > 50, "phải tìm thấy khối `po-source-pr`");
  assert.match(src, /<strong>\{purchaseOrder\.requestNo \|\| purchaseOrder\.requestId\}<\/strong>/,
    "ô «Số phiếu đề nghị» phải rơi về `requestId` khi không có `requestNo` — đây là chỗ duy nhất còn đọc UUID");
  assert.match(src, /Nguồn PR \(phiếu đề nghị\)/, "phải giữ tiêu đề khối «Nguồn PR»");
  assert.match(src, /PO mồ côi — không truy được PR/,
    "nhánh PO mồ côi (`request_id = NULL`) phải còn nguyên — không được xoá khi dọn dòng rác");
  assert.match(src, /purchase_orders\.request_id/,
    "phần giải thích vẫn phải nêu đích danh cột `purchase_orders.request_id`");
  // ⛔ `tests/p2-d2-po-detail.test.mjs:46` đòi `purchaseOrder.requestId` trong khối này — giữ ràng buộc đó.
  assert.match(src, /purchaseOrder\.requestId/, "khối `po-source-pr` phải còn đọc `requestId` (hợp đồng với p2-d2-po-detail.test.mjs)");
});

// ── HỒI QUY: PHẢI CÒN 4 PHẦN ĐO ĐƯỢC CỦA §21 ───────────────────────────────────
test("hồi quy — dọn dòng rác KHÔNG được xoá bất kỳ phần §21 nào (4 dấu `data-vntech`)", () => {
  for (const marker of ["po-source-pr", "po-summary-table", "po-grn-list", "po-timeline"]) {
    assert.equal(count(PO, `data-vntech="${marker}"`), 1, `thiếu dấu đo được §21: ${marker}`);
  }
  assert.match(PO, /data-vntech="po-source-pr-open"/, "nút mở lại phiếu đề nghị nguồn phải còn");
  assert.match(PO, /disabled=\{!banPR\}/, "nút mở PR nguồn phải vẫn tắt khi không tra được bản ghi");
});