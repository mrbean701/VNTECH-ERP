// P-01 / P-02 / P-03 — HỢP ĐỒNG MÀN «MUA HÀNG»: ĐÚNG 2 TAB (PR · PO) + SẮP XẾP `created DESC` + 6 CHIỀU LỌC.
//
// CHỈ ĐẠO NGƯỜI DÙNG 21/09/2026: «bỏ P-01 không tách MR PR PO nữa mà chỉ còn PR và PO thôi»
//   ⇒ màn Mua hàng có ĐÚNG 2 TAB: `PR` (nguồn `data.requests` = bảng `material_requests`) và
//     `PO` (nguồn `data.purchaseOrders` = bảng `purchase_orders`). KHÔNG có tab `MR` riêng.
//
// Đây là yêu cầu GIAO DIỆN: KHÔNG xóa bảng/cột/dòng nào. Tệp này khẳng định thêm luật đó bằng
// phép QUÉT TỪ KHÓA trên nguồn màn Mua hàng (đối chứng: tệp CÓ chứa sẵn các từ khóa này ở dạng
// văn bản mô tả «chỉ đọc», nên phép quét phải soi CÂU LỆNH, không soi chữ mô tả).
//
// Nguồn cột: `docs/agent-progress/P01-TAB-SPEC.md` mục 2 («Cột hiển thị mỗi tab») — đặc tả đã đo
// bằng dữ liệu MySQL THẬT. Riêng tên MR→PR đã gộp theo chỉ đạo 21/09.
//
// Chạy riêng:  node --import tsx --test tests/p01-purchasing-two-tabs.test.mjs
// (CỐ Ý không nằm trong `package.json` ⇒ `test:regression` giữ nguyên 69 ca.)
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  PURCHASING_TABS,
  PURCHASING_DEFAULT_TAB,
  PURCHASING_FILTER_DIMENSIONS,
  PURCHASING_PR_COLUMNS,
  PURCHASING_PO_COLUMNS,
  filterPurchasingRows,
  prListFor,
  poListFor,
  purchasesForTab,
  sortCreatedDesc,
} from "../app/screens/Purchasing.tsx";

const read = (relative) => readFileSync(new URL("../" + relative, import.meta.url), "utf8");
const SOURCE = read("app/screens/Purchasing.tsx");
const SPEC = read("docs/agent-progress/P01-TAB-SPEC.md");

// ── DỮ LIỆU THẬT (đo trên MySQL `vntech_erp` ngày 21/09/2026) ────────────────────────────────────────
//   `material_requests`: 35 dòng (approved/awaiting_po 16 · pending_approval/approval_pending 13 ·
//                        approved/awaiting_bch_confirmation 4 · approved/partial_delivery 2)
//   `purchase_orders`  : 17 dòng (waiting_delivery 8 · delivered_pending_confirmation 4 ·
//                        pending_approval 3 · completed 2)
const REQUEST_APPROVED = {
  id: "MR-0001", requestNo: "MR-PRJ-DEMO-01-2026-0001", projectId: "PRJ-1", projectCode: "PRJ-DEMO-01",
  requestedBy: "Kỹ sư dự án (đề nghị mua)", requestedAt: "2026-01-10T02:00:00.000Z", neededAt: "2026-02-01",
  status: "approved", supplyStatus: "awaiting_po", approvalStage: 5, itemCount: 3, totalEstimatedValue: 125000000,
  createdAt: "2026-01-10T02:00:00.000Z", updatedAt: "2026-01-12T02:00:00.000Z",
};
const REQUEST_PENDING = {
  id: "MR-0002", requestNo: "MR-PRJ-DEMO-01-2026-0002", projectId: "PRJ-1", projectCode: "PRJ-DEMO-01",
  requestedBy: "Kỹ sư hiện trường (lập phiếu)", requestedAt: "2026-01-20T02:00:00.000Z", neededAt: "2026-03-01",
  status: "pending_approval", supplyStatus: "approval_pending", approvalStage: 1, itemCount: 2,
  totalEstimatedValue: 40000000, createdAt: "2026-01-20T02:00:00.000Z",
};
const PO_WAITING = {
  id: "PO-0001", poNo: "PO-PRJ-DEMO-01-2026-0001", projectId: "PRJ-1", projectCode: "PRJ-DEMO-01",
  requestId: "MR-0001", requestNo: "MR-PRJ-DEMO-01-2026-0001", supplierId: "SUP-1", supplierName: "NCC A",
  orderedAt: "2026-01-25T02:00:00.000Z", eta: "2026-03-10", status: "waiting_delivery", totalValue: 90000000,
  orderedQty: 10, receivedQty: 0, itemCount: 1, createdAt: "2026-01-25T02:00:00.000Z",
};
const PO_DONE = {
  id: "PO-0002", poNo: "PO-PRJ-DEMO-01-2026-0002", projectId: "PRJ-2", projectCode: "PRJ-DEMO-02",
  requestId: null, requestNo: null, supplierId: "SUP-2", supplierName: "NCC B",
  orderedAt: "2026-02-05T02:00:00.000Z", eta: "2026-02-20", status: "completed", totalValue: 30000000,
  orderedQty: 5, receivedQty: 5, itemCount: 1, createdAt: "2026-02-05T02:00:00.000Z",
};
const DATA = {
  requests: [REQUEST_APPROVED, REQUEST_PENDING],
  purchaseOrders: [PO_WAITING, PO_DONE],
  staffDirectory: [
    { id: "USR-1", fullName: "Kỹ sư dự án (đề nghị mua)", department: "Phòng Dự án" },
    { id: "USR-2", fullName: "Kỹ sư hiện trường (lập phiếu)", organizationName: "Phòng Dự án" },
  ],
  users: [],
};

// ── 1. ĐÚNG 2 TAB: PR · PO — KHÔNG có tab MR ────────────────────────────────────────────────────────
test("P-01.1 — màn Mua hàng khai ĐÚNG 2 tab: `PR` rồi `PO`, và KHÔNG có tab `MR`", () => {
  assert.deepEqual(PURCHASING_TABS.map((t) => t.key), ["PR", "PO"], "phải là ĐÚNG 2 tab, thứ tự PR · PO");
  assert.deepEqual(PURCHASING_TABS.map((t) => t.label), ["PR", "PO"], "nhãn hiển thị trên dải tab phải là `PR` · `PO`");
  assert.equal(PURCHASING_TABS.some((t) => String(t.key).toUpperCase() === "MR"), false, "KHÔNG được còn tab `MR` riêng");
  assert.equal(PURCHASING_TABS.some((t) => String(t.label).toUpperCase().includes("MR")), false, "KHÔNG nhãn tab nào chứa `MR`");
  assert.equal(PURCHASING_TABS.length, 2, "chỉ đạo 21/09: bỏ tách 3 tab, chỉ còn 2 tab");
});

test("P-01.2 — nguồn dữ liệu mỗi tab: PR = `data.requests` (bảng `material_requests`), PO = `data.purchaseOrders`", () => {
  const pr = PURCHASING_TABS.find((t) => t.key === "PR");
  const po = PURCHASING_TABS.find((t) => t.key === "PO");
  assert.equal(pr.source, "requests", "tab PR phải đọc `requests` (material_requests là NGUỒN của PR)");
  assert.equal(po.source, "purchaseOrders", "tab PO phải đọc `purchaseOrders`");
  assert.match(SOURCE, /data\.requests/, "nguồn `data.requests` phải còn được dùng (không bỏ mất phiếu đề nghị)");
  assert.match(SOURCE, /data\.purchaseOrders/, "nguồn `data.purchaseOrders` phải còn được dùng");
});

test("P-01.3 — tab mặc định là `PR`, và tab đang chọn được giữ bằng `useState`", () => {
  assert.equal(PURCHASING_DEFAULT_TAB, "PR", "tab mặc định phải là PR");
  assert.match(SOURCE, /useState<[^>]*>\(PURCHASING_DEFAULT_TAB\)|useState\(PURCHASING_DEFAULT_TAB\)/,
    "tab đang chọn phải là state cục bộ khởi tạo từ `PURCHASING_DEFAULT_TAB`");
  assert.match(SOURCE, /data-vntech="purchasing-tab"/, "phải có dấu đo được cho từng tab: `data-vntech=\"purchasing-tab\"`");
  assert.match(SOURCE, /role="tab"/, "tab phải là `role=\"tab\"` (đo được trên DOM lúc chạy)");
});

test("P-01.4 — mỗi tab có ĐỦ CỘT theo `P01-TAB-SPEC.md` mục 2 (đã đo bằng dữ liệu thật)", () => {
  assert.match(SPEC, /MR: `requestNo`/, "đặc tả phải còn khai cột tab đề nghị (nguồn của PR)");
  assert.match(SPEC, /PR: như MR/, "đặc tả phải còn khai cột tab PR");
  assert.match(SPEC, /PO: `poNo`/, "đặc tả phải còn khai cột tab PO");

  // PR = cột của MR (đặc tả) + `supplyStatus` + `approvalStage` (đặc tả: «PR: như MR +»).
  const pr = PURCHASING_PR_COLUMNS.map((c) => c.key);
  for (const key of ["requestNo", "projectCode", "requestedBy", "requestedAt", "neededAt", "status",
    "itemCount", "totalEstimatedValue", "supplyStatus", "approvalStage"]) {
    assert.ok(pr.includes(key), `tab PR thiếu cột \`${key}\` (nguồn: P01-TAB-SPEC.md mục 2)`);
  }
  // PO = đúng 6 cột đặc tả + cột nguồn PR (truy vết, đã có ở màn chi tiết PO §21).
  const po = PURCHASING_PO_COLUMNS.map((c) => c.key);
  for (const key of ["poNo", "supplierId", "orderedAt", "eta", "status", "totalValue"]) {
    assert.ok(po.includes(key), `tab PO thiếu cột \`${key}\` (nguồn: P01-TAB-SPEC.md mục 2)`);
  }
  assert.deepEqual(PURCHASING_PO_COLUMNS.map((c) => c.header),
    ["Mã PO", "Nhà cung cấp", "Đã đặt", "Đã nhận", "Còn lại", "Ngày đặt", "ETA", "Trạng thái", "Tổng giá trị"],
    "thứ tự/tiêu đề cột tab PO phải đúng hợp đồng (spec PO + 3 cột đối soát §21 đang có)");
  assert.equal(PURCHASING_PR_COLUMNS.length, 10, "tab PR phải có đúng 10 cột");
  assert.equal(PURCHASING_PO_COLUMNS.length, 9, "tab PO phải có đúng 9 cột");
});

test("P-01.5 — dải tab có SỐ ĐẾM cho từng tab (đếm trên chính dữ liệu trong phạm vi đang chọn)", () => {
  assert.match(SOURCE, /data-vntech="purchasing-tab-count"/, "thiếu dấu đếm số lượng trên nhãn tab");
  assert.match(SOURCE, /counts\.PR/, "số đếm tab PR phải lấy từ biến đếm, không hard-code");
  assert.match(SOURCE, /counts\.PO/, "số đếm tab PO phải lấy từ biến đếm, không hard-code");
  assert.match(SOURCE, /format\.format\(counts\[/, "số đếm phải đi qua `format.format` (định dạng vi-VN)");
});

test("P-01.6 — giữ NGUYÊN các nút hành động hiện có (tạo PO Excel · phát hành PO · mẫu đơn giá · nhập đơn giá)", () => {
  for (const label of ["⇩ TẢI MẪU ĐƠN GIÁ HĐ", "⇧ NHẬP ĐƠN GIÁ HĐ", "⇩ TẢI MẪU PO", "⇧ NHẬP PO EXCEL", "＋ PHÁT HÀNH PO"]) {
    assert.ok(SOURCE.includes(label), `mất nút hành động đang có: «${label}»`);
  }
  assert.match(SOURCE, /open\("po",/, "nút phát hành/nhập PO phải vẫn mở drawer `po`");
  assert.match(SOURCE, /action\(/, "luồng nhập đơn giá hợp đồng phải vẫn gọi action thật");
});

// ── 2. KHÔNG XOÁ DỮ LIỆU / BẢNG / CỘT ──────────────────────────────────────────────────────────────
test("P-01.7 — mã màn Mua hàng KHÔNG chứa câu lệnh phá dữ liệu nào (DROP/DELETE/TRUNCATE/ALTER/UPDATE/INSERT)", () => {
  // Bóc chú thích + chuỗi văn bản MÔ TẢ trước khi quét, vì màn có ghi chú «KHÔNG INSERT/UPDATE/…».
  const code = SOURCE
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1 ")
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''")
    .replace(/`(?:[^`\\]|\\.)*`/g, "``");
  for (const keyword of ["DROP ", "DROP;", "TRUNCATE", "DELETE FROM", "ALTER TABLE", "INSERT INTO", "UPDATE "]) {
    assert.equal(code.toUpperCase().includes(keyword), false,
      `mã thi hành không được chứa \`${keyword.trim()}\` — P-01 là yêu cầu GIAO DIỆN, dữ liệu thật (35 phiếu · 17 PO) phải còn nguyên`);
  }
  // Đối chứng DƯƠNG cho phép quét: chính chuỗi từ khóa có tồn tại trong ghi chú ⇒ phép quét có hiệu lực.
  assert.match(SOURCE, /KHÔNG INSERT\/UPDATE|KHÔNG (INSERT|UPDATE)/i, "phải còn ghi chú nêu rõ luật chỉ-đọc");
});

test("P-01.8 — màn vẫn CHỈ ĐỌC: không thêm lời gọi ghi dữ liệu phía client (`fetch` POST/PUT/DELETE)", () => {
  const writes = SOURCE.match(/fetch\([^)]*\bmethod\s*:\s*["'](POST|PUT|PATCH|DELETE)["']/gi) || [];
  assert.deepEqual(writes, [], "không được thêm lời gọi ghi dữ liệu mới trong màn Mua hàng");
});

// ── 3. P-02 — SẮP XẾP MẶC ĐỊNH `created DESC` ──────────────────────────────────────────────────────
test("P-02.1 — sắp xếp mặc định `created DESC`: bản mới nhất lên đầu (đo bằng hàm thuần)", () => {
  const rows = [
    { id: "a", createdAt: "2026-01-10T02:00:00.000Z", status: "waiting_delivery" },
    { id: "b", createdAt: "2026-03-01T02:00:00.000Z", status: "pending_approval" },
    { id: "c", createdAt: "2026-02-01T02:00:00.000Z", status: "partial_delivery" },
  ];
  assert.deepEqual(sortCreatedDesc(rows).map((r) => r.id), ["b", "c", "a"], "mới nhất phải đứng đầu");
  assert.deepEqual(rows.map((r) => r.id), ["a", "b", "c"], "hàm sắp xếp KHÔNG được sửa mảng đầu vào");
});

test("P-02.2 — Completed/Rejected XUỐNG CUỐI dù `createdAt` mới hơn", () => {
  const rows = [
    { id: "xong", createdAt: "2026-03-05T02:00:00.000Z", status: "completed" },
    { id: "tu-choi", createdAt: "2026-03-04T02:00:00.000Z", status: "rejected" },
    { id: "dang-chay", createdAt: "2026-01-01T02:00:00.000Z", status: "waiting_delivery" },
  ];
  assert.deepEqual(sortCreatedDesc(rows).map((r) => r.id), ["dang-chay", "xong", "tu-choi"],
    "nhóm Completed/Rejected phải nằm SAU nhóm đang xử lý (trong nhóm vẫn mới nhất trước)");
  for (const status of ["completed", "completed_with_exceptions", "rejected"]) {
    assert.equal(sortCreatedDesc([{ id: "z", createdAt: "2026-01-01T00:00:00.000Z", status }])[0].id, "z",
      `trạng thái kết thúc \`${status}\` phải được nhận diện`);
  }
});

test("P-02.3 — nguồn sắp xếp là `createdAt` (cột `created_at` THẬT của cả 2 bảng) và có nhánh chọn sắp xếp khác", () => {
  assert.match(SOURCE, /createdAt/, "phải sắp theo `createdAt` (payload của `material_requests.created_at`/`purchase_orders.created_at`)");
  assert.match(SOURCE, /created_desc/, "phải có khoá sắp xếp `created_desc` (mặc định)");
  assert.match(SOURCE, /PURCHASING_SORTS|sortOptions|sort=\{/, "phải có thanh chọn sắp xếp");
});

// ── 4. P-03 — ĐÚNG 6 CHIỀU LỌC ─────────────────────────────────────────────────────────────────────
test("P-03.1 — đúng 6 chiều lọc, tên khớp NGUYÊN VĂN roadmap `docs/25_TODO_ROADMAP.md` dòng `P-03`", () => {
  const roadmap = read("docs/25_TODO_ROADMAP.md");
  const line = roadmap.split(/\r?\n/).find((l) => /^\|\s*`P-03`\s*\|/.test(l));
  assert.ok(line, "không tìm thấy dòng `P-03` trong roadmap");
  assert.match(line, /Trạng thái · Ngày · Phòng ban · Người tạo · NCC · Dự án/,
    "roadmap phải còn khai đủ 6 chiều (nguồn của danh sách dưới đây)");

  assert.deepEqual(PURCHASING_FILTER_DIMENSIONS.map((d) => d.label),
    ["Trạng thái", "Ngày", "Phòng ban", "Người tạo", "NCC", "Dự án"],
    "6 chiều lọc phải đúng tên và đúng thứ tự roadmap");
  assert.equal(PURCHASING_FILTER_DIMENSIONS.length, 6, "phải ĐÚNG 6 chiều lọc");
  for (const d of PURCHASING_FILTER_DIMENSIONS) {
    assert.ok(d.source && d.source.length > 10, `chiều «${d.label}» phải ghi RÕ NGUỒN dữ liệu (cột thật / khoá payload)`);
  }
});

test("P-03.2 — lọc THẬT bằng hàm thuần: 6 chiều tác động đúng trên dữ liệu", () => {
  const all = [REQUEST_APPROVED, REQUEST_PENDING];
  const base = { status: "ALL", supplyStatus: "ALL", dateFrom: "", dateTo: "", department: "ALL", creator: "ALL", supplier: "ALL", project: "ALL" };

  assert.equal(filterPurchasingRows(all, base, DATA).length, 2, "bộ lọc rỗng phải giữ ĐỦ 2 dòng");
  assert.deepEqual(filterPurchasingRows(all, { ...base, status: "approved" }, DATA).map((r) => r.id), ["MR-0001"], "chiều 1 · Trạng thái");
  assert.deepEqual(filterPurchasingRows(all, { ...base, dateFrom: "2026-01-15" }, DATA).map((r) => r.id), ["MR-0002"], "chiều 2 · Ngày (từ ngày)");
  assert.deepEqual(filterPurchasingRows(all, { ...base, dateTo: "2026-01-15" }, DATA).map((r) => r.id), ["MR-0001"], "chiều 2 · Ngày (đến ngày)");
  assert.deepEqual(filterPurchasingRows(all, { ...base, department: "Phòng Dự án" }, DATA).length, 2, "chiều 3 · Phòng ban (tra qua `staffDirectory`)");
  assert.deepEqual(filterPurchasingRows(all, { ...base, department: "Phòng Kế hoạch" }, DATA).length, 0, "chiều 3 · Phòng ban (không khớp ⇒ 0 dòng, KHÔNG bịa)");
  assert.deepEqual(filterPurchasingRows(all, { ...base, creator: "Kỹ sư hiện trường (lập phiếu)" }, DATA).map((r) => r.id), ["MR-0002"], "chiều 4 · Người tạo");
  assert.deepEqual(filterPurchasingRows(all, { ...base, project: "PRJ-1" }, DATA).length, 2, "chiều 6 · Dự án");
  assert.deepEqual(filterPurchasingRows(all, { ...base, project: "PRJ-2" }, DATA).length, 0, "chiều 6 · Dự án (không khớp ⇒ 0 dòng)");

  const pos = [PO_WAITING, PO_DONE];
  assert.deepEqual(filterPurchasingRows(pos, { ...base, supplier: "NCC A" }, DATA).map((r) => r.id), ["PO-0001"], "chiều 5 · NCC");
  assert.deepEqual(filterPurchasingRows(pos, { ...base, status: "completed" }, DATA).map((r) => r.id), ["PO-0002"], "chiều 1 · Trạng thái PO");
});

test("P-03.3 — chiều «Phòng ban» của PR lấy từ `staffDirectory` (KHÔNG bịa cột `department` trên phiếu)", () => {
  assert.match(SOURCE, /staffDirectory/, "phải tra phòng ban qua `data.staffDirectory` (nguồn duy nhất đang có)");
  assert.match(SOURCE, /organizationName \|\| [^)]*department|department \|\| [^)]*organizationName/,
    "phải dùng `organizationName` (đơn vị canonical) và lùi về `department`");
  assert.match(SOURCE, /chưa có nguồn/i, "dòng/chiều thiếu nguồn BẮT BUỘC nói rõ «chưa có nguồn»");
});

// ── 5. NGUỒN CỘT / NGUỒN CHIỀU PHẢI ĐƯỢC GHI RÕ TRÊN MÀN ───────────────────────────────────────────
test("P-01.9 — màn ghi RÕ nguồn đặc tả cột + nguồn 6 chiều lọc ngay trên UI (không để người đọc đoán)", () => {
  assert.match(SOURCE, /P01-TAB-SPEC\.md/, "phải ghi nguồn cột: `docs/agent-progress/P01-TAB-SPEC.md`");
  assert.match(SOURCE, /25_TODO_ROADMAP\.md/, "phải ghi nguồn 6 chiều lọc: dòng `P-03` trong `docs/25_TODO_ROADMAP.md`");
  assert.match(SOURCE, /dự án ngoài phạm vi đang chọn|ngoài phạm vi đang chọn/, "chiều «Dự án» phải nói rõ phạm vi dự án đang chọn");
});

test("P-01.10 — tab PO dùng LẠI dữ liệu `purchaseOrders` + `data-vntech` cũ, KHÔNG tạo bảng mới trùng", () => {
  const prList = prListFor(DATA);
  const poList = poListFor(DATA);
  assert.equal(prList.length, 2, "PR lấy TOÀN BỘ `data.requests` trong phạm vi (KHÔNG lọc cứng `awaiting_po` như trước)");
  assert.equal(poList.length, 2, "PO lấy toàn bộ `data.purchaseOrders`");
  assert.equal(purchasesForTab("PR", DATA).length, 2, "`purchasesForTab('PR')` phải trả danh sách PR");
  assert.equal(purchasesForTab("PO", DATA).length, 2, "`purchasesForTab('PO')` phải trả danh sách PO");
  assert.equal(purchasesForTab("MR", DATA).length, 0, "tab `MR` KHÔNG tồn tại ⇒ trả rỗng, không có nhánh ẩn nào");
  assert.match(SOURCE, /data-vntech="purchasing-pos"/, "khối PO cũ `data-vntech=\"purchasing-pos\"` phải được GIỮ (PHASE 2 §21)");
  assert.match(SOURCE, /data-vntech="purchasing-po-row"/, "dòng PO cũ phải được GIỮ");
  assert.match(SOURCE, /Xem chi tiết PO/, "nút «Xem chi tiết PO» phải còn");
});
