// VNTECH PROPRIETARY SOURCE | Owner: CÔNG TY CỔ PHẦN THƯƠNG MẠI ĐẦU TƯ PHÁT TRIỂN CÔNG NGHỆ VIỆT (VNTECH) | Product: VNTECH-KHO-MEP-001 | Fingerprint: SSOT
//
// VÒNG 1 (GO-LIVE) · BUG-20261002-001 — MỤC 6 — «bấm vào "xem phiếu đề nghị nguồn" bị lỗi tỏng modal chi tiết đơn mua PO».
//
// ⛔ BẰNG CHỨNG ĐÃ ĐO (02/10/2026, dữ liệu sống qua `/api/system`, tài khoản admin):
//   · toàn bộ `app/` chỉ có ĐÚNG 1 nút mang nhãn này — `app/screens/PurchaseOrderDrawer.tsx:41`;
//   · `purchaseOrders` 31 dòng, `requestId` rỗng 0 (⇒ 0 PO mồ côi), tra được `banPR` 31/31;
//   · `approvals`/`items`/`approvalStages` đều là mảng ⇒ `RequestDrawer` không vỡ vì dữ liệu.
//
// ⛔ NGUỒN GỐC: trong `PurchaseOrderDrawer.tsx`, `window.alert` nằm sau khoá `disabled={!banPR}`:
//   nút BẬT ⇔ `banPR` có ⇔ KHÔNG đi tới `alert`; nút TẮT ⇔ không bấm được. ⇒ nhánh `alert` là MÃ
//   CHẾT KHÔNG BAO GIỜ CHẠY ĐƯỢC, còn `title` lại hứa «bấm để xem lý do» — đúng cái bấm mà
//   `disabled` chặn. Đây là hành vi LỆCH với nút truy vết ngược cùng loại ở `ReceiptDrawer.tsx:31`,
//   vốn KHÔNG disable và hiện lý do tại chỗ bằng `inline-alert danger` (mẫu nhà).
//   ⇒ D-088: khớp định danh theo VIỆC NÓ LÀM, không theo tên. Sửa bằng đúng mẫu của mẫu nhà.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const read = (p) => readFileSync(new URL(p, root), "utf8");
const count = (hay, needle) => hay.split(needle).length - 1;
const PO_DRAWER = "app/screens/PurchaseOrderDrawer.tsx";
const GRN_DRAWER = "app/screens/ReceiptDrawer.tsx";

// ⛔ CÁI BẪY ĐÃ VẤP (ngay trong lần viết đầu tiên của bộ test này): khẳng định trên NGUYÊN VĂN
//   tệp sẽ đỏ vì CÁCH TỰ GIẢI THÍCH của chính bản sửa nhắc lại đúng những chuỗi bị cấm
//   (`window.alert`, `disabled={!banPR}`, «bấm để xem lý do») trong khối ghi chú. ⇒ Test phải kiểm
//   MÃ, không kiểm chú thích — nếu không thì lần giải thích tiếp theo lại làm đỏ bộ test.
//   Bóc chú thích: khối `/* … */` + `//` hết dòng, nhưng KHÔNG cắt `://` (URL) để không cắt nhầm.
const codeOf = (src) => src
  .replace(/\/\*[\s\S]*?\*\//g, " ")
  .split("\n")
  .map((line) => {
    const i = line.indexOf("//");
    if (i === -1) return line;
    return i > 0 && line[i - 1] === ":" ? line : line.slice(0, i);
  })
  .join("\n");
const readCode = (p) => codeOf(read(p));

// Nhãn nút mà người dùng bấm — lấy nguyên văn từ nguồn, KHÔNG gõ tay (D-097a).
const NHAN_NUT = "Xem phiếu đề nghị nguồn";

// ── ① Hộp thoại chặn người dùng đã bị gỡ ────────────────────────────────────
test("1-1 · không còn `window.alert` chặn người dùng trong màn chi tiết PO", () => {
  const ma = readCode(PO_DRAWER);
  assert.equal(count(ma, "window.alert"), 0,
    "⛔ `window.alert` chặn người dùng còn sót trong màn chi tiết PO — mọi hộp thoại là " +
    "`confirm`/`prompt` cố ý mới được giữ.");
  assert.match(ma, new RegExp(NHAN_NUT),
    "⛔ nút truy vết nguồn PR biến mất khỏi màn chi tiết PO.");
});

// ── ② Nút KHÔNG disable và KHÔNG hứa hư vô ích ──────────────────────────────
test("1-2 · nút mở phiếu nguồn không bị `disabled` và không còn lời hứa không thực hiện", () => {
  const ma = readCode(PO_DRAWER);
  // Nút phải KHÔNG mang thuộc tính `disabled` ở bất kỳ dạng nào.
  assert.equal(count(ma, /po-source-pr-open[^>]*disabled/.source), 0,
    "⛔ `po-source-pr-open` lại bị `disabled` — người dùng bấm không được, và lời hứa " +
    "«bấm để xem lý do» lại là nói dối.");
  assert.equal(count(ma, "bấm để xem lý do"), 0,
    "⛔ còn lời hứa «bấm để xem lý do» trong khi nút bị `disabled` ⇒ người dùng không bao giờ xem được.");
  assert.equal(count(ma, "title={banPR"), 0,
    "⛔ còn `title` tính theo `banPR` — sau khi bỏ disable thì `title` này không còn đường nào chạy.");
});

// ── ③ Khi không tra được nguồn thì PHẢI hiện lý do tại chỗ, khớp mẫu nhà ────
test("1-3 · nhánh mất nguồn hiện lý do tại chỗ, đúng như mẫu GRN của nhà", () => {
  const ma = readCode(PO_DRAWER);
  const grn = readCode(GRN_DRAWER);
  // Mẫu nhà: `grn-source-po-missing` = `inline-alert danger` + lý do cụ thể.
  assert.match(grn, /data-vntech="grn-source-po-missing"/,
    "⛔ mẫu nhà `grn-source-po-missing` không còn — mất chuẩn để đối chiếu (D-088).");
  // Màn PO phải có nhánh tương đương, cùng cơ chế.
  assert.match(ma, /data-vntech="po-source-pr-missing"/,
    "⛔ màn chi tiết PO thiếu nhánh hiện lý do khi không tra được phiếu nguồn.");
  assert.match(ma, /po-source-pr-missing"[\s\S]{0,200}inline-alert danger|inline-alert danger[^]{0,200}po-source-pr-missing"/,
    "⛔ nhánh mất nguồn phải là `inline-alert danger` như mẫu nhà, không phải kiểu khác.");
  // Nhánh mất nguồn phải nói ra con trỏ thật, không nói chung chung.
  assert.match(ma, /po-source-pr-missing[\s\S]{0,900}request_id/,
    "⛔ nhánh mất nguồn không nêu `request_id` thật của đơn ⇒ người dùng không biết vì sao không mở được.");
});

// ── ④ ĐỐI CHỨNG ÂM (D-098): các kiểm tra trên PHẢI bắt được lỗi quay lại ─────
test("1-4 · đối chứng âm — gắn lại `disabled` + `window.alert` thì test phải đỏ", () => {
  const banSua = readCode(PO_DRAWER);
  const coNhan = count(banSua, NHAN_NUT);
  assert.ok(coNhan >= 1, "⛔ nhãn nút không còn trong nguồn — đối chứng âm sẽ bịa ra ngoài thực tế.");

  // Biến thể hồi quy: đúng cái lỗi đã gặp — disable nút + hộp thoại chết sau khoá.
  const hoiquy = banSua.replace(
    /onClick=\{openSourceRequest\}/,
    'onClick={openSourceRequest} disabled={!banPR} title={banPR ? undefined : "bấm để xem lý do"}'
  ).replace(
    /const openSourceRequest = \(\) => \{[\s\S]*?\n/,
    'const openSourceRequest = () => { window.alert("Không mở được phiếu đề nghị nguồn."); };\n'
  );
  assert.notEqual(hoiquy, banSua, "⛔ đối chứng âm không mutate được — test sẽ xanh vì lý do sai (D-098).");

  const baoDinh = (ma) => [
    ["window.alert", count(ma, "window.alert") === 0],
    ["disabled", count(ma, /po-source-pr-open[^>]*disabled/.source) === 0],
    ["lời hứa", count(ma, "bấm để xem lý do") === 0],
    ["title theo banPR", count(ma, "title={banPR") === 0],
    ["nhánh mất nguồn", /data-vntech="po-source-pr-missing"/.test(ma)],
  ];
  const ketQuaThat = baoDinh(banSua).filter(([, ok]) => ok).length;
  const ketQuaHoiQuy = baoDinh(hoiquy).filter(([, ok]) => ok).length;
  assert.ok(ketQuaThat > ketQuaHoiQuy,
    `⛔ đối chứng âm không làm giảm số kiểm tra đạt (thật ${ketQuaThat} / hồi quy ${ketQuaHoiQuy}) ` +
    "⇒ các kiểm tra 1-1/1-2/1-3 không thật sự phát hiện lỗi.");
});

// ── ⑤ Không được hồi sinh lỗi cũ: truy vết phải truyền DÒNG ĐẦY ĐỦ ─────────
test("1-5 · mở phiếu nguồn vẫn truyền bản ghi đầy đủ, không phải object rút gọn", () => {
  const ma = readCode(PO_DRAWER);
  // `banPR` là DÒNG THẬT lấy từ `data.requests` (⛔ vòng 211 từng truyền `{ id, requestNo }` ⇒ màn vỡ).
  assert.match(ma, /const banPR = !orphan \? \(data\.requests \|\| \[\]\)\.find\(/,
    "⛔ `banPR` không còn tra từ `data.requests` — phải là DÒNG ĐẦY ĐỦ, không object rút gọn.");
  assert.match(ma, /open\("detail", banPR\)/,
    "⛔ mở phiếu nguồn không còn truyền `banPR` (dòng đầy đủ) cho `open`.");
  assert.equal(count(ma, /open\("detail",\s*\{/.source), 0,
    "⛔ lại truyền object rút gọn `{…}` cho `open(\"detail\", …)` ⇒ màn vỡ như lỗi vòng 211.");
  // Còn: `data.requests` là nguồn tra cứu, không phải `requestNo` — khớp cột thật `request_id`.
  assert.match(ma, /String\(r\.id\) === String\(purchaseOrder\.requestId\)/,
    "⛔ điều kiện tra cứu phiếu nguồn không còn so `r.id` với `purchaseOrder.requestId`.");
});