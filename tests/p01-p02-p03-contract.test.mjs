// P-01 · P-02 · P-03 — HỢP ĐỒNG RIÊNG: SẮP XẾP MẶC ĐỊNH · 6 CHIỀU LỌC · LUẬT «KHÔNG XOÁ DỮ LIỆU».
//
// Tệp `tests/p01-purchasing-two-tabs.test.mjs` khẳng định cấu trúc 2 TAB (PR · PO) + cột mỗi tab.
// Tệp NÀY tách riêng 3 nhóm còn lại để khi ĐỎ thì biết ngay hỏng ở đâu:
//   A. P-02 — thứ tự mặc định `created DESC`, Completed/Rejected xuống cuối.
//   B. P-03 — ĐÚNG 6 chiều lọc, nêu TÊN TỪNG CHIỀU + NGUỒN từng chiều.
//   C. LUẬT CỨNG — mã thi hành không được chứa lệnh phá dữ liệu, và màn phải ghi rõ 2 nguồn tài liệu.
//
// Chạy riêng:  node --import tsx --test tests/p01-p02-p03-contract.test.mjs
// (CỐ Ý không nằm trong `package.json` ⇒ `test:regression` giữ nguyên 69 ca.)
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  PURCHASING_FILTER_DIMENSIONS,
  PURCHASING_SORTS,
  PURCHASING_DEFAULT_SORT,
  FINAL_STATUSES,
  isFinalStatus,
  filterPurchasingRows,
  sortCreatedDesc,
  buildPurchasingList,
} from "../app/screens/Purchasing.tsx";

const read = (relative) => readFileSync(new URL("../" + relative, import.meta.url), "utf8");
const SOURCE = read("app/screens/Purchasing.tsx");
const ROADMAP = read("docs/25_TODO_ROADMAP.md");
const SPEC = read("docs/agent-progress/P01-TAB-SPEC.md");

const prLine = (id) => ROADMAP.split(/\r?\n/).find((l) => new RegExp("^\\|\\s*`" + id + "`\\s*\\|").test(l));
const EMPTY_FILTERS = {
  status: "ALL", supplyStatus: "ALL", dateFrom: "", dateTo: "",
  department: "ALL", creator: "ALL", supplier: "ALL", project: "ALL",
};
const DATA = {
  requests: [
    { id: "MR-1", requestNo: "MR-1", projectId: "P1", projectCode: "PRJ-1", requestedBy: "A", requestedAt: "2026-01-05T00:00:00.000Z", status: "approved", supplyStatus: "awaiting_po", createdAt: "2026-01-05T00:00:00.000Z" },
    { id: "MR-2", requestNo: "MR-2", projectId: "P1", projectCode: "PRJ-1", requestedBy: "B", requestedAt: "2026-03-05T00:00:00.000Z", status: "rejected", supplyStatus: "rejected", createdAt: "2026-03-05T00:00:00.000Z" },
    { id: "MR-3", requestNo: "MR-3", projectId: "P2", projectCode: "PRJ-2", requestedBy: "A", requestedAt: "2026-02-05T00:00:00.000Z", status: "pending_approval", supplyStatus: "approval_pending", createdAt: "2026-02-05T00:00:00.000Z" },
  ],
  purchaseOrders: [
    { id: "PO-1", poNo: "PO-1", projectId: "P1", projectCode: "PRJ-1", supplierId: "S1", supplierName: "NCC A", orderedAt: "2026-01-09T00:00:00.000Z", status: "waiting_delivery", totalValue: 10, createdAt: "2026-01-09T00:00:00.000Z" },
    { id: "PO-2", poNo: "PO-2", projectId: "P2", projectCode: "PRJ-2", supplierId: "S2", supplierName: "NCC B", orderedAt: "2026-03-09T00:00:00.000Z", status: "completed", totalValue: 20, createdAt: "2026-03-09T00:00:00.000Z" },
  ],
  staffDirectory: [],
  users: [],
};

// ── A. P-02 — SẮP XẾP MẶC ĐỊNH ────────────────────────────────────────────────────────────────────
test("P-02/a — roadmap dòng `P-02` khai đúng luật sắp xếp (nguồn nguyên văn)", () => {
  const line = prLine("P-02");
  assert.ok(line, "không tìm thấy dòng `P-02` trong roadmap");
  assert.match(line, /Sắp xếp mặc định `created DESC`/, "roadmap phải còn khai `created DESC`");
  assert.match(line, /Completed\/Rejected xuống cuối/, "roadmap phải còn khai luật Completed/Rejected xuống cuối");
});

test("P-02/b — mặc định là `created_desc`; danh sách mặc định trả về đúng thứ tự đó", () => {
  assert.equal(PURCHASING_DEFAULT_SORT, "created_desc", "sắp xếp mặc định phải là `created_desc`");
  assert.equal(PURCHASING_SORTS[0].value, "created_desc", "lựa chọn sắp xếp ĐẦU TIÊN (mặc định) phải là `created_desc`");
  assert.ok(PURCHASING_SORTS.length >= 2, "phải có ít nhất một lựa chọn sắp xếp khác ngoài mặc định");

  const prOrder = buildPurchasingList({ tab: "PR", data: DATA, filters: EMPTY_FILTERS, sortKey: PURCHASING_DEFAULT_SORT }).map((r) => r.id);
  assert.deepEqual(prOrder, ["MR-3", "MR-1", "MR-2"], "PR: mới nhất trước, `rejected` xuống cuối");
  const poOrder = buildPurchasingList({ tab: "PO", data: DATA, filters: EMPTY_FILTERS, sortKey: PURCHASING_DEFAULT_SORT }).map((r) => r.id);
  assert.deepEqual(poOrder, ["PO-1", "PO-2"], "PO: `waiting_delivery` (đang xử lý) trước `completed` dù `created_at` cũ hơn");
});

test("P-02/c — chọn sắp xếp khác thì đổi thứ tự thật (không phải nhãn trang trí)", () => {
  const byOldest = buildPurchasingList({ tab: "PR", data: DATA, filters: EMPTY_FILTERS, sortKey: "created_asc" }).map((r) => r.id);
  assert.deepEqual(byOldest, ["MR-1", "MR-3", "MR-2"], "`created_asc`: cũ nhất trước, nhóm kết thúc vẫn ở cuối");
  assert.notDeepEqual(byOldest, buildPurchasingList({ tab: "PR", data: DATA, filters: EMPTY_FILTERS, sortKey: "created_desc" }).map((r) => r.id),
    "hai lựa chọn sắp xếp phải cho KẾT QUẢ KHÁC NHAU trên cùng dữ liệu");
});

test("P-02/d — nhóm «kết thúc» nhận đúng 4 trạng thái thật của 2 bảng (`completed` · `completed_with_exceptions` · `rejected` · `cancelled`)", () => {
  assert.deepEqual([...FINAL_STATUSES].sort(), ["cancelled", "completed", "completed_with_exceptions", "rejected"]);
  assert.equal(isFinalStatus("completed"), true);
  assert.equal(isFinalStatus("completed_with_exceptions"), true);
  assert.equal(isFinalStatus("rejected"), true);
  assert.equal(isFinalStatus("cancelled"), true);
  assert.equal(isFinalStatus("waiting_delivery"), false);
  assert.equal(isFinalStatus("delivered_pending_confirmation"), false, "«chờ xác nhận giao» CHƯA kết thúc");
  assert.equal(isFinalStatus("partial_delivery"), false);
  assert.equal(isFinalStatus("pending_approval"), false);
  assert.equal(isFinalStatus("approved"), false);
});

test("P-02/e — dòng thiếu `createdAt` không được làm vỡ thứ tự và không bị ném lỗi", () => {
  const rows = [
    { id: "co-ngay", createdAt: "2026-01-01T00:00:00.000Z", status: "approved" },
    { id: "thieu-ngay", status: "approved" },
    { id: "ngay-sai", createdAt: "khong-phai-ngay", status: "approved" },
  ];
  const out = sortCreatedDesc(rows).map((r) => r.id);
  assert.equal(out.length, 3, "không được mất dòng khi thiếu/ sai `createdAt`");
  assert.equal(out[0], "co-ngay", "dòng có ngày hợp lệ mới nhất phải đứng đầu");
  assert.deepEqual([...out].sort(), ["co-ngay", "ngay-sai", "thieu-ngay"], "các dòng còn lại phải còn đủ, không trùng");
});

// ── B. P-03 — 6 CHIỀU LỌC ──────────────────────────────────────────────────────────────────────────
test("P-03/a — 6 chiều lọc: TÊN từng chiều + NGUỒN từng chiều (nguồn: roadmap dòng `P-03`)", () => {
  const line = prLine("P-03");
  assert.ok(line, "không tìm thấy dòng `P-03` trong roadmap");
  assert.match(line, /Lọc theo Trạng thái · Ngày · Phòng ban · Người tạo · NCC · Dự án/, "roadmap phải còn khai đủ 6 chiều");
  assert.equal(PURCHASING_FILTER_DIMENSIONS.length, 6, "phải ĐÚNG 6 chiều — không 5, không 7");
  const expected = ["Trạng thái", "Ngày", "Phòng ban", "Người tạo", "NCC", "Dự án"];
  assert.deepEqual(PURCHASING_FILTER_DIMENSIONS.map((d) => d.label), expected,
    `tên 6 chiều phải khớp roadmap: ${expected.join(" · ")}`);
  // Nguồn từng chiều phải trỏ CỘT/KHOÁ THẬT (đo trên MySQL) — không được để trống hay ghi chung chung.
  const sources = PURCHASING_FILTER_DIMENSIONS.map((d) => d.source);
  assert.match(sources[0], /purchase_orders\.status[\s\S]*material_requests\.supply_status/, "chiều «Trạng thái» phải nêu 2 cột trạng thái thật của 2 bảng");
  assert.match(sources[1], /created_at/, "chiều «Ngày» phải nêu cột `created_at`");
  assert.match(sources[2], /staffDirectory[\s\S]*(organizationName|department)/, "chiều «Phòng ban» phải nêu đường tra `staffDirectory` và trường thật");
  assert.match(sources[3], /requestedBy[\s\S]*orderedAt/, "chiều «Người tạo» phải nêu `requestedBy` (PR) và `orderedAt` (PO)");
  assert.match(sources[4], /supplierName[\s\S]*supplierId/, "chiều «NCC» phải nêu `supplierName`/`supplierId` thật");
  assert.match(sources[5], /projectId/, "chiều «Dự án» phải nêu `projectId`");
});

test("P-03/b — chiều «Ngày»: PR lọc theo NGÀY TẠO, PO lọc theo NGÀY ĐẶT (2 cột thật khác nhau, ghi rõ trên UI)", () => {
  assert.match(SOURCE, /requestedAt[\s\S]{0,120}orderedAt/, "phải nêu rõ PR dùng `requestedAt`, PO dùng `orderedAt`");
  const pr = filterPurchasingRows(DATA.requests, { ...EMPTY_FILTERS, dateFrom: "2026-02-01", dateTo: "2026-02-28" }, DATA);
  assert.deepEqual(pr.map((r) => r.id), ["MR-3"], "PR: 01/02→28/02 chỉ còn MR-3 (theo `requestedAt`)");
  const po = filterPurchasingRows(DATA.purchaseOrders, { ...EMPTY_FILTERS, dateFrom: "2026-03-01" }, DATA);
  assert.deepEqual(po.map((r) => r.id), ["PO-2"], "PO: từ 01/03 chỉ còn PO-2 (theo `orderedAt`)");
});

test("P-03/c — HAI TRỤC TÁCH BẠCH: «Trạng thái» = `status`, «Giai đoạn cung ứng» = `supplyStatus` (MT2 §6.9)", () => {
  // ⚠️ CẬP NHẤT 23/09/2026 (MT2 §6.9 — vá đúng «KNOWN ISSUE: bảng PR trộn status/stage»): hàm lọc nay
  // **⛔ KHÔNG trộn 2 trục** (`app/screens/Purchasing.tsx:199-201`: `supplyStatus` so riêng, `status` so riêng)
  // ⇒ hợp đồng cũ (gửi `status: "awaiting_po"` rồi mong khớp qua `supplyStatus`) là **hành vi TRƯỚC MT2**.
  const bySupplyAxis = filterPurchasingRows(DATA.requests, { ...EMPTY_FILTERS, supplyStatus: "awaiting_po" }, DATA).map((r) => r.id);
  assert.deepEqual(bySupplyAxis, ["MR-1"], "«Giai đoạn cung ứng» = `awaiting_po` phải khớp qua `supplyStatus`");
  const crossed = filterPurchasingRows(DATA.requests, { ...EMPTY_FILTERS, status: "awaiting_po" }, DATA).map((r) => r.id);
  assert.deepEqual(crossed, [], "⛔ trục «Trạng thái» KHÔNG được khớp chéo sang `supplyStatus` (MT2 §6.9)");
  const byStatus = filterPurchasingRows(DATA.requests, { ...EMPTY_FILTERS, status: "rejected" }, DATA).map((r) => r.id);
  assert.deepEqual(byStatus, ["MR-2"], "chọn `rejected` phải khớp qua `status`");
});

test("P-03/d — danh sách lựa chọn của 3 chiều `select` được suy TỪ DỮ LIỆU (không hard-code tên phòng/NCC/dự án)", () => {
  assert.match(SOURCE, /new Set\(/, "phải suy danh sách lựa chọn bằng `Set` từ chính dữ liệu đang có");
  assert.match(SOURCE, /đang có|dữ liệu đang có|suy từ dữ liệu/i, "phải ghi rõ lựa chọn suy từ dữ liệu");
});

test("P-03/e — bộ lọc ĐỔI THẬT số dòng của cả 2 tab (`buildPurchasingList` đi qua `filterPurchasingRows`)", () => {
  const all = buildPurchasingList({ tab: "PR", data: DATA, filters: EMPTY_FILTERS, sortKey: PURCHASING_DEFAULT_SORT });
  const filtered = buildPurchasingList({ tab: "PR", data: DATA, filters: { ...EMPTY_FILTERS, status: "rejected" }, sortKey: PURCHASING_DEFAULT_SORT });
  assert.equal(all.length, 3, "không lọc ⇒ đủ 3 phiếu PR");
  assert.equal(filtered.length, 1, "lọc `rejected` ⇒ còn 1 phiếu");
  assert.equal(filtered[0].id, "MR-2");
});

test("P-03/f — 2 chiều «Phòng ban» và «Người tạo» là 2 chiều KHÁC NHAU (không gộp chung 1 ô)", () => {
  const keys = PURCHASING_FILTER_DIMENSIONS.map((d) => d.key);
  assert.equal(new Set(keys).size, 6, "6 chiều phải là 6 khoá khác nhau");
  assert.ok(keys.includes("department") && keys.includes("creator"), "phải có RIÊNG chiều `department` và `creator`");
  assert.match(SOURCE, /creator/, "chiều «Người tạo» phải có biến lọc riêng");
});

// ── C. LUẬT CỨNG ──────────────────────────────────────────────────────────────────────────────────
test("P-01/c1 — mã thi hành KHÔNG chứa lệnh phá dữ liệu (đã bóc chú thích + chuỗi mô tả)", () => {
  const code = SOURCE
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1 ")
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''")
    .replace(/`(?:[^`\\]|\\.)*`/g, "``")
    .toUpperCase();
  for (const keyword of ["DROP", "TRUNCATE", "DELETE FROM", "ALTER TABLE", "INSERT INTO"]) {
    assert.equal(code.includes(keyword), false, `mã thi hành không được chứa \`${keyword}\``);
  }
  assert.doesNotMatch(code, /UPDATE\s+[A-Z_]+\s+SET/, "mã thi hành không được chứa câu `UPDATE … SET`");
});

test("P-01/c2 — màn ghi RÕ 2 nguồn tài liệu ngay trong mã: đặc tả CỘT và roadmap 6 CHIỀU", () => {
  assert.match(SOURCE, /docs\/agent-progress\/P01-TAB-SPEC\.md/, "phải ghi nguồn cột: đặc tả `P01-TAB-SPEC.md`");
  assert.match(SOURCE, /docs\/25_TODO_ROADMAP\.md/, "phải ghi nguồn 6 chiều lọc: `docs/25_TODO_ROADMAP.md`");
  assert.match(SPEC, /Cột hiển thị mỗi tab/, "đặc tả `P01-TAB-SPEC.md` phải còn mục khai cột");
});

test("P-01/c3 — chỉ đạo 21/09 được ghi lại trong mã (2 tab, không tab MR, KHÔNG xoá dữ liệu)", () => {
  assert.match(SOURCE, /21\/09\/2026/, "phải ghi mốc chỉ đạo 21/09/2026");
  assert.match(SOURCE, /chỉ còn PR và PO|CHỈ PR \+ PO|PR và PO/, "phải ghi rõ chỉ đạo «chỉ còn PR và PO»");
  assert.match(SOURCE, /KHÔNG (xoá|xóa) bảng|không xoá bảng/i, "phải ghi rõ luật KHÔNG xoá bảng/cột/dòng");
});

test("P-01/c4 — hợp đồng 2 tab KHÔNG phá các dấu PHASE 2 đang được cổng DOM đo", () => {
  for (const marker of ["purchasing-pos", "purchasing-po-row", "purchasing-po-open", "po-grn-list"]) {
    assert.ok(SOURCE.includes(marker) || read("app/screens/PurchaseOrderDrawer.tsx").includes(marker),
      `dấu PHASE 2 \`${marker}\` phải còn (cổng probe-p2-ui-dom.mjs 5/5)`);
  }
  assert.match(SOURCE, /Đã giao đủ[\s\S]*Đang giao|Đang giao[\s\S]*Đã giao đủ/, "nhãn trạng thái PO cũ («Đã giao đủ»/«Đang giao») phải còn");
});
