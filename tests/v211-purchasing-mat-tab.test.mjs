// VÒNG 211 · MỤC 1.4 — TAB THỨ 3 «CHI TIẾT LŨY KẾ THEO VẬT TƯ» TRÊN MÀN MUA HÀNG.
//
// YÊU CẦU USER (vòng 211, mục 1.4): bảng «Chi tiết lũy kế theo vật tư» đang TREO Ở CUỐI MÀN, người
//   dùng phải cuộn tới cuối mới thấy ⇒ chuyển thành TAB THỨ 3 trên dải tab đã có (PR · PO).
//
// QUAN HỆ VỚI CHỈ ĐẠO CŨ 21/09 («bỏ P-01 không tách MR PR PO nữa mà chỉ còn PR và PO thôi»):
//   Chỉ đạo 21/09 nhắm vào việc BỎ TÁCH CHỨNG TỬ MR thành một tab hồ sơ riêng. Tab mới không phải
//   chứng từ: nó là bảng TỔNG HỢP suy ra từ BOQ/Hợp đồng (`data.boqItems`), không có `requestNo`/`poNo`
//   riêng, không bấm được để mở phiếu. ⇒ 2 tab CHỨNG TỪ vẫn là PR/PO, `MR` vẫn bị cấm.
//   ⚠️ Tệp này KHÔNG nới lỏng điều kiện nào của `p01-purchasing-two-tabs.test.mjs` và
//      `moc121-purchasing-tabs.test.mjs`; nó chỉ kiểm tra PHẦN MỚI (tab 3).
//
// ⛔ NGUYÊN TẮC D-085 / D-080 — KHÔNG BỊA CỘT: chỉ hiện trường ĐÃ ĐO THẬT trên `data.boqItems`.
//   Đo ngày 02/10/2026 trên MySQL `vntech_erp` (32 dòng `project_boq_items`):
//     `contractQty` 32/32 · `requestedQty` 13/32 · `approvedQty` 11/32 · `orderedQty` 11/32
//     `receivedQty` 11/32 · `stockQty` 11/32 · `orderedNotReceivedQty` 1/32 · `issuedQty` 5/32
//     `installedQty` 0/32 (toàn 0) · `varianceContract`/`varianceRemeasured` 0/32 dương (tổng −5911)
//     `variationStatus` = none×20 + null×12 · `mappingStatus` = mapped_manual×20 + legacy_mapped×12
//   ⇒ THÊM `orderedNotReceivedQty` + `issuedQty`; CỐ Ý BỎ `installedQty` (toàn 0), `variance*` (toàn âm),
//     `variationStatus`, `mappingStatus` (vệ sinh dữ liệu), `stockQty` (khác miền, sẽ gây nhầm với
//     cột «Còn phải mua» — và đổi công thức đó là QUYẾT ĐỊNH NGHIỆP VỤ, không tự ý sửa).
//
// Chạy riêng:  node --import tsx --test tests/v211-purchasing-mat-tab.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { PURCHASING_TABS, PURCHASING_DEFAULT_TAB, buildMaterialCumulativeRows } from "../app/screens/Purchasing.tsx";

const root = new URL("../", import.meta.url);
const read = (p) => readFileSync(new URL(p, root), "utf8");
const SOURCE = read("app/screens/Purchasing.tsx");

// ⭐ D-088: bóc chú thích trước khi dò, nếu không thì các tên trường được nhắc trong banner
//    «cố ý KHÔNG thêm» sẽ làm cho phép khẳng định "không đọc trường này" đúng một cách giả.
const maCode = (src) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^[ \t]*\/\/.*$/gm, "");
const CODE = maCode(SOURCE);
const between = (src, from, to) => {
  const a = src.indexOf(from);
  assert.ok(a >= 0, `không tìm thấy mốc mở «${from}»`);
  const b = src.indexOf(to, a);
  assert.ok(b > a, `không tìm thấy mốc đóng «${to}» sau «${from}»`);
  return src.slice(a, b + to.length);
};
// Khối JSX của bảng lũy kế (đã bóc chú thích) — mọi khẳng định về cột chỉ soi TRONG khối này.
const MAT_BLOCK = between(CODE, 'data-vntech="purchasing-mat-table"', "]}/></section>");

const BOQ = [
  { id: "B1", projectId: "PRJ-A", rowRole: "material", materialCode: "M1", materialName: "Cáp", contractQty: 10, requestedQty: 10, approvedQty: 8, orderedQty: 6, receivedQty: 4, orderedNotReceivedQty: 2, issuedQty: 1 },
  { id: "B2", projectId: "PRJ-A", rowRole: "component", materialCode: "M2", materialName: "Tủ", contractQty: 5, requestedQty: 0, approvedQty: 0, orderedQty: 0, receivedQty: 0, orderedNotReceivedQty: 0, issuedQty: 0 },
  { id: "B3", projectId: "PRJ-B", rowRole: "material", materialCode: "M3", materialName: "Đèn", contractQty: 7, requestedQty: 7, approvedQty: 7, orderedQty: 7, receivedQty: 7, orderedNotReceivedQty: 0, issuedQty: 7 },
  { id: "B4", projectId: "PRJ-B", rowRole: "outside_contract", materialCode: "M4", materialName: "Thuê xe", contractQty: 2, requestedQty: 0, approvedQty: 0, orderedQty: 0, receivedQty: 0, orderedNotReceivedQty: 0, issuedQty: 0 },
];
const DATA = { boqItems: BOQ };

test("V-211.1 — tab thứ 3 khai báo đúng: key `MAT`, nhãn «Chi tiết lũy kế theo vật tư», nguồn `boqItems`", () => {
  assert.deepEqual(PURCHASING_TABS.map((t) => t.key), ["PR", "PO", "MAT"]);
  const mat = PURCHASING_TABS.find((t) => t.key === "MAT");
  assert.equal(mat.label, "Chi tiết lũy kế theo vật tư");
  assert.equal(mat.source, "boqItems");
  assert.equal(PURCHASING_DEFAULT_TAB, "PR", "tab mặc định vẫn là PR — không được đổi hành vi cũ");
  // Chỉ 2 tab là chứng t��n; `MR` không được quay lại (chỉ đạo 21/09).
  assert.equal(PURCHASING_TABS.filter((t) => ["requests", "purchaseOrders"].includes(t.source)).length, 2);
  assert.equal(PURCHASING_TABS.some((t) => String(t.key).toUpperCase() === "MR"), false, "KHÔNG được có tab `MR`");
});

test("V-211.2 — `buildMaterialCumulativeRows` là hàm thuần: lọc theo phạm vi dự án + 2 loại dòng vật tư", () => {
  assert.equal(buildMaterialCumulativeRows({ data: DATA, project: "ALL" }).length, 3, "phạm vi ALL lấy mọi dòng material/component (loại `outside_contract`)");
  assert.deepEqual(buildMaterialCumulativeRows({ data: DATA, project: "PRJ-A" }).map((r) => r.id), ["B1", "B2"]);
  assert.deepEqual(buildMaterialCumulativeRows({ data: DATA, project: "PRJ-B" }).map((r) => r.id), ["B3"]);
  assert.deepEqual(buildMaterialCumulativeRows({ data: DATA, project: "PRJ-KHONG-CO" }), [], "dự án không có dòng nào ⇒ rỗng (bộ lọc thật sự có tác dụng)");
  assert.deepEqual(buildMaterialCumulativeRows({ data: { boqItems: undefined }, project: "ALL" }), [], "thiếu `boqItems` thì trả rỗng, không ném lỗi");
  // ⛔ KHÔNG chạy qua `filterPurchasingRows`: dòng BOQ không có cột trạng thái/ngày/NCC của chứng từ.
  assert.doesNotMatch(CODE, /buildMaterialCumulativeRows[\s\S]{0,400}?filterPurchasingRows/);
});

test("V-211.3 — bảng lũy kế NẰM TRONG thẻ tab (sau bảng PO) và KHÔNG còn treo ở cuối màn", () => {
  const tabsOpen = CODE.indexOf('data-vntech="purchasing-tabs"');
  const poTable = CODE.indexOf('data-vntech="purchasing-po-table"');
  const matTable = CODE.indexOf('data-vntech="purchasing-mat-table"');
  const tabsClose = CODE.indexOf("</section>", matTable);
  assert.ok(tabsOpen >= 0 && poTable > tabsOpen, "bảng PO phải nằm trong thẻ tab");
  assert.ok(matTable > poTable, "tab 3 phải đứng sau tab PO");
  assert.ok(tabsClose > matTable, "bảng lũy kế phải nằm TRƯỚC khi đóng thẻ tab, không phải treo ngoài");
  assert.match(CODE, /\{activeTab==="MAT"&&\(/, "nội dung tab 3 phải được chặn theo tab đang chọn");
  assert.doesNotMatch(CODE, /card purchase-material-cumulative/, "không được còn lớp `card` của bảng lũy kế ở cuối màn");
  assert.equal((CODE.match(/purchase-material-cumulative/g) || []).length, 1, "bảng lũy kế chỉ được xuất hiện ĐÚNG 1 lần trong JSX");
  assert.match(CODE, /rows=\{boqRows\}/, "bảng lũy kế phải đọc đúng tập dòng `boqRows` đã lọc theo dự án");
});

test("V-211.4 — ⭐ chỉ dùng trường ĐÃ ĐO THẬT; các trường bị loại KHÔNG được đọc trong phần định nghĩa cột", () => {
  for (const field of ["contractQty", "requestedQty", "approvedQty", "orderedQty", "receivedQty", "orderedNotReceivedQty", "issuedQty"]) {
    assert.match(MAT_BLOCK, new RegExp(`row\\.${field}`), `cột phải đọc trường đo thật \`${field}\``);
  }
  for (const field of ["installedQty", "varianceContract", "varianceRemeasured", "variationStatus", "mappingStatus", "stockQty"]) {
    assert.doesNotMatch(MAT_BLOCK, new RegExp(`row\\.${field}`), `⛔ KHÔNG được cột nào đọc \`${field}\` (đo cho thấy toàn 0 / toàn âm / không phải miền mua hàng)`);
  }
  assert.match(MAT_BLOCK, /header: "Đã đặt chưa nhận"/);
  assert.match(MAT_BLOCK, /header: "Đã xuất kho"/);
  assert.match(MAT_BLOCK, /header: "Còn phải mua"/);
  assert.match(MAT_BLOCK, /boqControlQty\(row\)/, "cột «Còn phải mua» giữ nguyên công thức cũ — KHÔNG tự đổi quy tắc nghiệp vụ");
});

test("V-211.5 — tab 3 KHÔNG có 2 ô ngày (dữ liệu BOQ không có cột ngày của chứng từ)", () => {
  assert.match(CODE, /const dateDim=\(activeTab==="PR"\|\|activeTab==="PO"\)\?PURCHASING_DATE_DIM\[activeTab\]:null;/);
  assert.match(CODE, /\.\.\.\(dateDim \? \[/, "2 ô ngày chỉ được render khi `dateDim` có giá trị");
  assert.match(CODE, /\{dateDim&&<p className="purchasing-tab-note" data-vntech="purchasing-date-dim-note">/);
  // ⛔ `PURCHASING_DATE_DIM[activeTab]` CHỈ được xuất hiện đúng 1 lần — trong toán tử đã chặn 2 tab.
  //    Nếu còn chỗ nào đọc thẳng thì tab `MAT` sẽ nhận `undefined` và vỡ lúc render.
  assert.equal((CODE.match(/PURCHASING_DATE_DIM\[activeTab\]/g) || []).length, 1,
    "⛔ chỉ được đọc `PURCHASING_DATE_DIM[activeTab]` trong định nghĩa `dateDim` — tab `MAT` không có chiều ngày");
  assert.match(CODE, /title=\{activeTab==="MAT"\?"CHI TIẾT LŨY KẾ THEO VẬT TƯ"/, "tiêu đề toolbar phải đổi theo tab");
  assert.match(CODE, /unit=\{activeTab==="MAT"\?"vật tư"/, "đơn vị đếm phải là «vật tư» ở tab 3");
  assert.match(CODE, /total=\{activeTab==="MAT"\?boqRows\.length:/, "tổng số dòng phải tính từ `boqRows` ở tab 3");
});

test("V-211.6 — số đếm trên nhãn tab 3 lấy từ tập đã lọc, và khối tab 3 vẫn CHỈ ĐỌC", () => {
  assert.match(CODE, /const visibleMAT=boqRows;/);
  assert.match(CODE, /const counts = \{ PR: visiblePR\.length, PO: visiblePO\.length, MAT: visibleMAT\.length \};/);
  assert.match(CODE, /format\.format\(counts\[tab\.key\]\)/, "mọi tab — kể cả MAT — dùng CHUNG một cách đếm");
  const start = CODE.indexOf('data-vntech="purchasing-tabs"');
  // ⛔ VÒNG 1 GO-LIVE (MỤC 5): neo cũ `card purchase-order-detail-card` ĐÃ BỊ XOÁ khỏi màn ⇒
  //    `indexOf` trả -1 ⇒ `slice(start, -1)` âm thầm lấy gần hết phần còn lại của tệp, tức vệ này
  //    ĐÃ MẤT Ý NGHĨA mà VẪN XANH (D-089: phải kiểm giá trị cũ thật sự còn). Neo lại bằng `between()`
  //    vốn TỰ assert mốc tồn tại — nếu mốc đóng biến mất thì vệ ĐỎ thay vì xanh giả.
  // ⚠️ ĐO ĐƯỢC (VÒNG 1 GO-LIVE): khối chú thích ở `Purchasing.tsx:365` MỞ ở dòng 365 và ĐÓNG Ở
  //    dòng 369, nuốt trọn dòng 368 ⇒ `price-import-preview` KHÔNG có trong `CODE`. Đổi neo cũng
  //    vậy sẽ đỏ. Neo theo thứ nằm TRONG khối tab và không nằm trong chú thích: `purchasing-pos`.
  const block = between(CODE, 'data-vntech="purchasing-tabs"', "purchasing-pos");
  assert.doesNotMatch(block, /action\("(?!update_boq_contract_prices)/, "khối tab chỉ được ĐỌC — không action ghi dữ liệu");
  assert.doesNotMatch(block, /fetch\([^)]*method\s*:\s*"(POST|PUT|DELETE)"/i, "khối tab không được POST/PUT/DELETE");
});

test("V-211.7 — ghi chú MÃ NGUỒN nói thẳng chỗ đứng mới của bảng (tài liệu không mô tả sai màn hình)", () => {
  // ⚠️ YÊU CẦU ĐÃ ĐỔI Ở VÒNG 1 (GO-LIVE) · MỤC 3: user xoá mọi văn bản thừa dưới nhóm nút,
  //    trong đó có đoạn «PR/PO · chỉ ĐỌC · lịch sử phiên bản» ở GIAO DIỆN.
  //    ⇒ Nội dung truy vết PHẢI Ở LẠI trong mã nguồn (`app/screens/Purchasing.tsx:38-42`).
  //    Vệ này đổi từ «có trong giao diện» sang «có trong mã nguồn» — KHÔNG được hạ tiêu chuẩn:
  //    3 dữ kiện truy vết vẫn phải đủ, và thêm vệ chứng minh chúng KHÔNG còn được vẽ ra UI.
  assert.match(SOURCE, /TAB THỨ 3 «CHI TIẾT LŨY KẾ THEO VẬT TƯ»/, "mã nguồn phải ghi rõ bảng đã dời lên dải tab");
  assert.match(SOURCE, /ĐÃ BỊ CHỈ ĐẠO MỚI HƠN THAY THẾ/, "phải nêu việc chỉ đạo 21/09 bị thay thế MỘT PHẦN, không giấu nhận");
  assert.match(SOURCE, /`MR` vẫn KHÔNG quay lại/, "phải nêu rõ luật cấm `MR` còn hiệu lực");
  // ⛔ Và bảo đảm các câu này KHÔNG quay lại xuất hiện trên màn hình (CODE = đã bóc chú thích).
  assert.doesNotMatch(CODE, /vòng 211/, "lịch sử phiên bản không được vẽ ra giao diện nữa");
});