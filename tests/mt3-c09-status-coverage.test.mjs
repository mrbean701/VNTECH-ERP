// HỢP ĐỒNG — BẢNG NHÃN DÙNG CHUNG phải phủ **GIÁ TRỊ THẬT TRONG CSDL** (ERP-SESSION-03, 07/10/2026)
//
// ⛔ LỖI USER BÁO (MASTER TASK 3): «Hiện tại 1 số nơi hiển thị tiếng Anh» ⇒ phiên 03 đã vá 3 vòng (C04/C06/C09).
// ⭐ VÒNG NÀY (`TASK-20261007-C18`) ĐO **GIÁ TRỊ THẬT TRONG CSDL** (SELECT DISTINCT qua `mysql`, ⛔ chỉ đọc) rồi
//   kiểm qua bảng nhãn dùng chung. ĐO ĐƯỢC **3 giá trị CHƯA có nhãn**:
//     `goods_receipts.bch_confirmation_status = confirmed` → «Confirmed»  ⛔
//     `goods_receipts.qc_status = accepted`                → «Accepted»   ⛔
//     `goods_receipts.qc_status = passed`                  → «Passed»     ⛔
//   ⚠️ NHƯNG ⛔ **chưa rò ra màn hình**: mọi call site đều dịch TAY (đo 5 chỗ: `Inventory.tsx` · `PurchaseOrderDrawer.tsx`
//      · `ReceiptDrawer.tsx` · `app/page.tsx`) ⇒ đây là **LỖ HỔNG TIỀM ẨN + TRÙNG LẶP 5 CHỖ**.
//   ✅ VÁ TẠI NGUỒN: thêm 2 domain `bch_confirmation` + `qc_result` vào `lib/status-labels.ts`.
//
// ⛔ VÌ SAO 2 DOMAIN MỚI **KHÔNG** NẰM TRONG `DOMAIN_LOOKUP_ORDER` (đọc kỹ trước khi "sửa"):
//   `DOMAIN_LOOKUP_ORDER` là đường tra **CHÉO** khi người gọi ⛔ KHÔNG truyền domain. Hai domain mới chứa các mã
//   **DÙNG CHUNG** với domain khác (`pending` · `rejected`) ⇒ nếu đưa vào thứ tự tra chéo thì
//   **kết quả của mã dùng chung CÓ THỂ ĐỔI** (ví dụ `pending` bị dịch thành «Chờ BCH xác nhận» ở nơi khác) ⇒ ⚠️ HỒI QUY.
//   ⇒ Giữ chúng **CHỈ dùng khi người gọi truyền domain tường minh** ⇒ **⛔ 0 thay đổi** cho mọi nhãn đang chạy (xem C09-3).
//
// Chạy riêng:  node --test tests/mt3-c09-status-coverage.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import esbuild from "esbuild";

const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
function loadStatusLabels() {
  const js = esbuild.transformSync(read("lib/status-labels.ts"), { loader: "ts", format: "cjs", target: "node20" }).code;
  const mod = { exports: {} };
  new Function("module", "exports", js)(mod, mod.exports);
  return mod.exports;
}
const { statusLabel, knownStatusLabel } = loadStatusLabels();
const SRC = read("lib/status-labels.ts");

test("C09-1 · 3 giá trị THẬT trong CSDL nay có nhãn TIẾNG VIỆT khi truyền ĐÚNG domain", () => {
  assert.equal(statusLabel("confirmed", "bch_confirmation"), "BCH đã xác nhận");
  assert.equal(statusLabel("pending", "bch_confirmation"), "Chờ BCH xác nhận");
  assert.equal(statusLabel("rejected", "bch_confirmation"), "BCH từ chối");
  assert.equal(statusLabel("accepted", "qc_result"), "Đạt");
  assert.equal(statusLabel("passed", "qc_result"), "Đạt");
  assert.equal(statusLabel("failed", "qc_result"), "Không đạt");
  assert.equal(statusLabel("rejected", "qc_result"), "Không đạt");
  // ĐỐI CHỨNG ÂM: nếu ⛔ KHÔNG truyền domain thì vẫn rơi về humanize (tiếng Anh) — đúng như đo được, ⛔ không tự nhận domain.
  assert.equal(statusLabel("confirmed"), "Confirmed");
});

test("C09-2 · ⛔ 2 domain mới KHÔNG được đưa vào `DOMAIN_LOOKUP_ORDER` (tránh đổi kết quả mã DÙNG CHUNG)", () => {
  const at = SRC.indexOf("DOMAIN_LOOKUP_ORDER");
  assert.ok(at >= 0, "phải có `DOMAIN_LOOKUP_ORDER`");
  const line = SRC.slice(at, SRC.indexOf("\n", at));
  assert.doesNotMatch(line, /bch_confirmation|qc_result/,
    "⛔ ĐƯA 2 DOMAIN MỚI VÀO THỨ TỰ TRA CHÉO ⇒ `pending`/`rejected` có thể bị dịch SAI ở nơi khác ⇒ HỒI QUY (§25)");
});

test("C09-3 · HỒI QUY: các mã DÙNG CHUNG đang chạy giữ NGUYÊN nhãn (snapshot ĐO TỪ CSDL)", () => {
  // ⭐ Snapshot chống hồi quy: nếu ai thêm domain vào thứ tự tra chéo, các ca này sẽ ĐỎ ngay.
  // ⚠️ CA `complete` ĐÃ SỬA KỲ VỌNG CỦA TÔI (⛔ tôi đoán «Hoàn thành» là SAI):
  //    ⭐ QUÉT **62 CỘT TRẠNG THÁI** trong CSDL ⇒ `complete` **CHỈ** xuất hiện ở
  //    `goods_receipts.certificate_status` · `goods_receipts.delivery_document_status` · `goods_receipts.document_status`
  //    ⇒ «Đã có» (CO/CQ · giấy giao hàng) là **ĐÚNG**; ⛔ không cột nào dùng `complete` với nghĩa «Hoàn thành».
  // ⚠️ TOÀN BỘ GIÁ TRỊ DƯỚI ĐÂY LÀ **ĐO ĐƯỢC** (chạy `statusLabel` thật qua esbuild), ⛔ **KHÔNG phải tôi đoán**:
  //    ⭐ BÀI HỌC NGAY TRONG CA NÀY: tôi đoán sai **2 lần** — `complete` (đoán «Hoàn thành», thật là «Đã có») và
  //    `in_progress` (đoán «Đang thực hiện», thật là «Đang xử lý»). Snapshot **PHẢI ĐO**, ⛔ không được viết theo trí nhớ.
  //    ⭐ `complete`: **QUÉT 62 CỘT TRẠNG THÁI** trong CSDL ⇒ chỉ có ở `goods_receipts.certificate_status` ·
  //       `delivery_document_status` · `document_status` ⇒ «Đã có» là ĐÚNG.
  //    ⚠️ `locked` ĐO ĐƯỢC = «Locked» (tiếng Anh) NHƯNG **đã kiểm CSDL: `locked` ⛔ KHÔNG phải giá trị trạng thái nào**
  //       ⇒ ⛔ không phải rò rỉ đang chạy ⇒ ⛔ KHÔNG đưa vào snapshot (tránh "khoá" một nhãn tiếng Anh).
  const snap = [
    ["complete", "Đã có"], ["pending", "Chờ xử lý"], ["approved", "Đã duyệt"], ["rejected", "Từ chối"],
    ["posted", "Đã ghi sổ"], ["issued", "Đã xuất kho"], ["partial_issued", "Xuất một phần"],
    ["in_progress", "Đang xử lý"], ["WAITING_SUPPLIER", "Chờ NCC"], ["REWORK", "Làm lại"],
    ["critical", "Khẩn cấp"], ["urgent", "Khẩn"], ["high", "Cao"], ["normal", "Bình thường"], ["low", "Thấp"],
    ["draft", "Bản nháp"], ["submitted", "Đã trình"], ["active", "Đang hoạt động"],
    ["archived", "Đã lưu trữ"], ["cancelled", "Đã huỷ"], ["completed", "Hoàn thành"],
  ];
  for (const [code, expected] of snap) {
    assert.equal(knownStatusLabel(code) || statusLabel(code), expected, `⛔ mã dùng chung \`${code}\` đã ĐỔI nhãn ⇒ kiểm lại DOMAIN_LOOKUP_ORDER`);
  }
  // Và `pending`/`rejected` ⛔ KHÔNG được lấy nhãn của 2 domain MỚI khi không truyền domain:
  assert.equal(statusLabel("pending"), "Chờ xử lý", "⛔ `pending` bị dịch thành nhãn của domain mới ⇒ HỒI QUY");
  assert.equal(statusLabel("rejected"), "Từ chối", "⛔ `rejected` bị dịch thành nhãn của domain mới ⇒ HỒI QUY");
});

test("C09-4 · ⛔ mã lạ vẫn KHÔNG lộ mã thô (fallback an toàn phải giữ)", () => {
  assert.equal(statusLabel("zzz_khong_co_that"), "Zzz khong co that");
  assert.equal(statusLabel(""), "—");
  assert.equal(statusLabel(null), "—");
  assert.equal(statusLabel(undefined), "—");
  assert.equal(statusLabel("Đã duyệt"), "Đã duyệt", "chuỗi đã là tiếng Việt phải GIỮ NGUYÊN");
});
