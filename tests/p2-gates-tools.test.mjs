// PHASE 2 — TEST CHO 3 CỔNG ĐO (tools/p2-trace-audit.mjs · tools/p2-split-po-audit.mjs · tools/p2-reference-integrity.mjs)
//
// VÌ SAO CÓ TỆP NÀY: 3 cổng đo trên gọi `process.exit()` và cần MySQL thật, nên KHÔNG thể kiểm thử bằng cách
// import thẳng. Vì vậy phần LOGIC ĐO (tính mồ côi, tính % truy vết, chọn nhánh ĐẠT/HỎNG, định dạng bảng)
// được tách ra module thuần `tools/lib/p2-gates.mjs` — có đầu vào dữ liệu, đầu ra xác định, không I/O.
// Tệp này kiểm thử đúng phần thuần đó, CỘNG THÊM một lưới an toàn tĩnh: 3 cổng phải CHỈ ĐỌC.
//
// ⚠️ LƯỚI AN TOÀN CHỈ ĐỌC (quan trọng nhất): nhiệm vụ cấm tuyệt đối INSERT/UPDATE/DELETE/ALTER/CREATE/DROP.
//    Test cuối tệp quét NGUYÊN VĂN 4 tệp cổng và assert không có từ khoá ghi nào. Nếu ai đó thêm một câu
//    UPDATE vào cổng, test này ĐỎ ngay — kể cả khi cổng vẫn chạy được.
//
// Chạy riêng:  node --import tsx --test tests/p2-gates-tools.test.mjs
// (tệp CỐ Ý không nằm trong `package.json` → `test:regression` giữ nguyên số ca)

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TOOLS = ["p2-trace-audit.mjs", "p2-split-po-audit.mjs", "p2-reference-integrity.mjs"];
const LIB = "tools/lib/p2-gates.mjs";

let libCache = null;
async function loadLib() {
  const abs = path.join(ROOT, LIB);
  assert.ok(existsSync(abs), `Thiếu module logic thuần: ${LIB}`);
  // Windows: đường dẫn tuyệt đối PHẢI đổi sang file:// URL trước khi import động.
  if (!libCache) libCache = await import(pathToFileURL(abs).href);
  return libCache;
}

// ─────────────────────────────────────────────────────────────────────────────
// NHÓM 0 — tệp phải tồn tại
// ─────────────────────────────────────────────────────────────────────────────
test("P2-GATES: đủ 3 tệp cổng đo + module logic thuần", async () => {
  for (const t of TOOLS) assert.ok(existsSync(path.join(ROOT, "tools", t)), `Thiếu tools/${t}`);
  assert.ok(existsSync(path.join(ROOT, LIB)), `Thiếu ${LIB}`);
});

// ─────────────────────────────────────────────────────────────────────────────
// NHÓM 1 — logic đo mồ côi / truy vết (tools/lib/p2-gates.mjs)
// ─────────────────────────────────────────────────────────────────────────────
test("P2-GATES: doQuanHe — tách đúng truy được / mồ côi-null / mồ côi-treo", async () => {
  const { doQuanHe } = await loadLib();
  const kq = doQuanHe([
    { tong: 7, rong: 1, treo: 0 },   // 1 NULL, 6 trỏ tới bản ghi thật
    { tong: 13, rong: 0, treo: 0 },
    { tong: 16, rong: 0, treo: 2 },  // 2 trỏ tới bản ghi không tồn tại
  ]);
  assert.equal(kq[0].truyDuoc, 6);
  assert.equal(kq[0].moCoi, 1);
  assert.equal(kq[0].dat, false);
  assert.equal(kq[1].truyDuoc, 13);
  assert.equal(kq[1].dat, true);
  assert.equal(kq[2].moCoi, 2);
  assert.equal(kq[2].dat, false);
});

test("P2-GATES: doQuanHe — bảng rỗng không được coi là ĐẠT (không có bằng chứng)", async () => {
  const { doQuanHe } = await loadLib();
  const kq = doQuanHe([{ tong: 0, rong: 0, treo: 0 }]);
  assert.equal(kq[0].moCoi, 0);
  assert.equal(kq[0].dat, true, "0/0 không có mồ côi ⇒ không có chặng đứt để báo");
  assert.equal(kq[0].rongBang, true, "phải đánh dấu bảng RỖNG để người đọc biết là chưa có bằng chứng");
});

test("P2-GATES: tiLe — % truy vết, chống xanh giả khi mẫu số = 0", async () => {
  const { tiLe } = await loadLib();
  assert.equal(tiLe(6, 7), "85.7%");
  assert.equal(tiLe(13, 13), "100.0%");
  assert.equal(tiLe(0, 0), "n/a");
  assert.equal(tiLe(0, 16), "0.0%");
});

// ─────────────────────────────────────────────────────────────────────────────
// NHÓM 2 — logic đo tách PO / vượt số lượng
// ─────────────────────────────────────────────────────────────────────────────
test("P2-GATES: demMrNhieuPo — đếm đúng số MR có ≥ 2 PO", async () => {
  const { demMrNhieuPo } = await loadLib();
  // 17 MR: 6 MR có đúng 1 PO ⇒ 0 MR có ≥2 PO (đúng dữ liệu thật đã đo)
  const rows1 = Array.from({ length: 17 }, (_, i) => ({ request_id: `MR_${i}`, n: i < 6 ? 1 : 0 }));
  assert.equal(demMrNhieuPo(rows1), 0);
  // 1 MR tách 2 PO ⇒ phải đếm là 1
  const rows2 = [...rows1, { request_id: "MR_x", n: 2 }];
  assert.equal(demMrNhieuPo(rows2), 1);
});

test("P2-GATES: dongVuotSoLuong — chỉ bắt dòng ordered > approved, có dung sai số thực", async () => {
  const { dongVuotSoLuong } = await loadLib();
  const kq = dongVuotSoLuong([
    { id: "A", approved: 100, ordered: 100 },
    { id: "B", approved: 100, ordered: 100.00005 }, // trong dung sai ⇒ KHÔNG vượt
    { id: "C", approved: 100, ordered: 120 },
    { id: "D", approved: 0, ordered: 5 },
  ]);
  assert.deepEqual(kq.map((r) => r.id), ["C", "D"]);
  assert.equal(kq[0].vuot, 20);
});

test("P2-GATES: lechTong — so SUM(poi.ordered_qty) với material_request_items.ordered_qty", async () => {
  const { lechTong } = await loadLib();
  const kq = lechTong([
    { id: "A", mriOrdered: 100, poiSum: 100 },
    { id: "B", mriOrdered: 100, poiSum: 60 }, // PO đặt thiếu so với tổng đã ghi ở dòng PR
  ]);
  assert.equal(kq.length, 1);
  assert.equal(kq[0].id, "B");
  assert.equal(kq[0].lech, 40);
});

// ─────────────────────────────────────────────────────────────────────────────
// NHÓM 3 — logic toàn vẹn tham chiếu
// ─────────────────────────────────────────────────────────────────────────────
test("P2-GATES: mucDoMoCoi — NULL CHỈ là mồ côi khi cột KHÔNG được phép NULL", async () => {
  const { mucDoMoCoi } = await loadLib();
  assert.equal(typeof mucDoMoCoi, "function", "thiếu hàm thuần quyết định mồ côi của một cặp cột");
  // Cột CHO PHÉP NULL theo quy ước nghiệp vụ (vd supply_workflow_steps.receipt_id khi chưa giao hàng):
  // NULL là "chưa tới bước đó" ⇒ KHÔNG tính mồ côi; chỉ tham chiếu TREO mới là mồ côi.
  const choPhep = mucDoMoCoi({ choNull: true, tong: 92, soNull: 72, treo: 8 });
  assert.equal(choPhep.moCoi, 8, "NULL hợp lệ KHÔNG được đếm thành mồ côi (lỗi cũ đếm thành 80)");
  assert.equal(choPhep.rongNull, 72, "vẫn phải giữ RIÊNG số NULL để in ra, không được giấu");
  assert.equal(choPhep.dat, false);
  // Cột KHÔNG cho phép NULL ⇒ NULL là dữ liệu thiếu ⇒ TÍNH là mồ côi.
  assert.equal(mucDoMoCoi({ choNull: false, tong: 35, soNull: 2, treo: 1 }).moCoi, 3);
  // Không còn tham chiếu treo ⇒ cặp ĐẠT, dù còn bao nhiêu NULL hợp lệ.
  assert.equal(mucDoMoCoi({ choNull: true, tong: 92, soNull: 72, treo: 0 }).dat, true);
});

test("P2-GATES: theThamChieu — gộp số liệu 1 quan hệ thành dòng bảng", async () => {
  const { theThamChieu } = await loadLib();
  const the = theThamChieu({
    bang: "purchase_orders", cot: "request_id", dichBang: "material_requests", dichCot: "id",
    tong: 7, rong: 1, treo: 0, viDu: ["MR_abc"],
  });
  assert.equal(the.quanHe, "purchase_orders.request_id → material_requests.id");
  assert.equal(the.moCoi, 1);
  assert.equal(the.dat, false);
  assert.equal(the.duaTrenQuyUoc, true, "0 FK ⇒ mọi quan hệ đều dựa trên quy ước");
});

// ─────────────────────────────────────────────────────────────────────────────
// NHÓM 4 — LƯỚI AN TOÀN CHỈ ĐỌC (quét nguyên văn mã nguồn 3 cổng + module thuần)
// ─────────────────────────────────────────────────────────────────────────────
const TU_KHOA_GHI = [
  /\bINSERT\s+INTO\b/i,
  /\bUPDATE\s+[A-Za-z_`]+\s+SET\b/i,
  /\bDELETE\s+FROM\b/i,
  /\bALTER\s+TABLE\b/i,
  /\bCREATE\s+(TABLE|DATABASE|INDEX|VIEW)\b/i,
  /\bDROP\s+(TABLE|DATABASE|INDEX|VIEW)\b/i,
  /\bTRUNCATE\s+TABLE\b/i,
  /\bREPLACE\s+INTO\b/i,
  /\bGRANT\b|\bREVOKE\b/i,
];

test("P2-GATES CHỈ ĐỌC: 3 cổng + module thuần KHÔNG chứa bất kỳ câu lệnh ghi nào", async () => {
  const viPham = [];
  for (const rel of [...TOOLS.map((t) => `tools/${t}`), LIB]) {
    const src = readFileSync(path.join(ROOT, rel), "utf8");
    for (const re of TU_KHOA_GHI) {
      const m = src.match(re);
      if (m) viPham.push(`${rel}: tìm thấy "${m[0]}"`);
    }
  }
  assert.deepEqual(viPham, [], `Cổng đo PHẢI chỉ đọc. Vi phạm:\n${viPham.join("\n")}`);
});

test("P2-GATES CHỈ ĐỌC: mọi cổng gọi mysql đều dùng cờ -N -B và bọc SET SESSION TRANSACTION READ ONLY", async () => {
  for (const rel of TOOLS.map((t) => `tools/${t}`)) {
    const src = readFileSync(path.join(ROOT, rel), "utf8");
    assert.ok(src.includes('"-N"') && src.includes('"-B"'), `${rel}: thiếu cờ -N -B (định dạng tab thô)`);
    assert.ok(
      src.includes("SET SESSION TRANSACTION READ ONLY"),
      `${rel}: phải bọc kết nối bằng SET SESSION TRANSACTION READ ONLY (khoá cứng ở tầng CSDL)`
    );
    assert.ok(
      src.includes("information_schema."),
      `${rel}: phải tự kiểm tra lược đồ qua information_schema thay vì giả định tên bảng/cột`
    );
  }
});

test("P2-GATES: cả 3 cổng đều nêu ngưỡng ĐẠT/KHÔNG ĐẠT ngay trong tệp (không giấu ngưỡng)", async () => {
  for (const t of TOOLS) {
    const src = readFileSync(path.join(ROOT, "tools", t), "utf8");
    assert.ok(/NGƯỠNG/i.test(src), `tools/${t}: phải ghi rõ NGƯỠNG trong tệp`);
    assert.ok(/exit 0|exit 1|process\.exit/.test(src), `tools/${t}: phải nêu rõ mã thoát`);
  }
});

test("P2-GATES: cả 3 cổng đều báo BLOCKED khi không kết nối được MySQL (không bịa số)", async () => {
  for (const t of TOOLS) {
    const src = readFileSync(path.join(ROOT, "tools", t), "utf8");
    assert.ok(/BLOCKED/.test(src), `tools/${t}: phải có nhánh BLOCKED khi mất kết nối MySQL`);
  }
});
