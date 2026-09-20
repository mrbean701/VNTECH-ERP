// VNTECH ERP V5.3.0 — PHASE 2 (§25) · NHÓM B: 6 TEST CASE CUỐI (7→12) CỦA CHUỖI PR → DUYỆT → PO → GRN.
//
// Nguồn yêu cầu: `docs/agent-progress/PHASE2-REQUIREMENTS-USER.md` mục 25 (12 case). Tệp này làm ĐÚNG 6 CA CUỐI;
// 6 ca đầu (1→6) đã làm ở `tests/p2-s25-a-6cases.test.mjs`. Nhật ký: `docs/agent-progress/TASK-112.md`.
//
// BA TẦNG ĐO CHO MỖI CA (chạy OFFLINE: không build, không cần dịch vụ 8787/9000/18081):
//   [1] HÀM THUẦN THẬT — `lib/p2-po-trace.ts` (`childPurchaseOrdersFor`/`receiptsForPurchaseOrder`/
//       `purchaseOrderForReceipt`/`deliveryProgress`/`numeric`): chính hàm mã sản phẩm đang dùng, KHÔNG mô phỏng lại.
//   [2] CÔNG THỨC THẬT CỦA ENGINE — trích biểu thức quyết định từ `scripts/system-route.mjs` rồi THI HÀNH trên số
//       liệu của đặc tả. Nhờ vậy luật KHÔNG bị chép lại vào test: engine đổi luật ⇒ test ĐỎ ngay, mà cũng không thể
//       "xanh giả" vì test chép sai luật so với engine. Ca 7/8 CẦN dạng trích THỨ HAI (`trichKhoi`) vì chốt chặn
//       "đặt vượt số đã duyệt" của engine là một KHỐI `if (...) throw ...` INLINE, không phải `const` — và chốt đó
//       là chốt DUY NHẤT ở tầng máy chủ, nên dùng `congThucEngine` (chỉ nhận `const`) sẽ không đo được gì.
//   [3] DỮ LIỆU THẬT (MySQL, CHỈ ĐỌC) — bất biến dạng "số vi phạm = 0", SỐ LIỆU quyết định bằng hàm thuần của
//       `tools/lib/p2-gates.mjs` (`doQuanHe`/`dongVuotSoLuong`/`lechTong`/`ketLuan`/`tiLe`/`DUNG_SAI_SL`) — TÁI DÙNG,
//       không viết lại truy vấn đo và không đổi ngữ nghĩa cổng. Không kết nối được MySQL ⇒ `skip` kèm lý do,
//       KHÔNG tính là ĐẠT (cùng quy ước `tests/p2-s25-a-6cases.test.mjs`).
//
// ⚠️ HAI LỚP KHOÁ CHỈ ĐỌC: (a) mọi câu đều là `SELECT`; (b) mỗi lần gọi đều kèm `SET SESSION TRANSACTION READ ONLY`
//    (đúng cách 3 cổng `tools/p2-*-audit.mjs` / `p2-reference-integrity.mjs` đang làm) ⇒ CSDL từ chối lệnh ghi.
//    Tệp này KHÔNG INSERT/UPDATE/DELETE/ALTER/DROP/TRUNCATE.
//
// ⚠️ CHÍNH SÁCH KHOẢNG TRỐNG (§25 Case 9): Case 9 được TÀI LIỆU HOÁ, không được "làm cho xanh".
//    Không hạ kỳ vọng của đặc tả: tệp khẳng định ĐÚNG khoảng trống (tính năng versioning KHÔNG tồn tại), đo cơ chế
//    thay thế CÓ THẬT (snapshot trên `approvals`), và nêu rõ cần gì để làm thật ⇒ ĐẠT hợp lệ + BLOCKED (cần chốt Q3).
//
// ⚠️ TỆP CỐ Ý KHÔNG nằm trong `package.json` ⇒ `npm run test:regression` giữ nguyên 69 ca.
// Chạy riêng:  node --import tsx --test tests/p2-s25-b-6cases.test.mjs

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { doQuanHe, dongVuotSoLuong, lechTong, ketLuan, tiLe, DUNG_SAI_SL } from "../tools/lib/p2-gates.mjs";

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// NẠP NGUỒN: nguồn mã + thư viện hàm thuần (nạp ĐỘNG để mỗi ca chỉ phụ thuộc đúng thư viện nó dùng)
// ─────────────────────────────────────────────────────────────────────────────────────────────────
const duongDan = (tuongDoi) => new URL("../" + tuongDoi, import.meta.url).href;
const docNguon = (tuongDoi) => readFileSync(new URL("../" + tuongDoi, import.meta.url), "utf8");

/** Nguồn engine THẬT (chỉ đọc) — nơi thi hành cổng duyệt PR, chốt chặn vượt phân bổ, công thức hoàn tất PO/PR. */
const ROUTE = docNguon("scripts/system-route.mjs");

let _trace = null;
const trace = async () => (_trace ?? (await import(duongDan("lib/p2-po-trace.ts"))));

/**
 * TRÍCH một biểu thức quyết định của engine rồi biến nó thành hàm thi hành được.
 * `numberValue` của engine = `Number(v ?? 0)` có chặn `NaN` (xem `numberValue` trong `scripts/system-route.mjs`).
 * `neo` = mẫu LOOKAHEAD để chọn đúng lần khai báo khi tên biến không duy nhất trong tệp.
 * Trích không được ⇒ ĐỎ kèm chỉ dẫn cập nhật mẫu trích (hợp đồng §25 vẫn phải giữ).
 */
const numberValue = (value) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};
function congThucEngine(ten, thamSo, neo = "") {
  const khop = ROUTE.match(new RegExp(String.raw`const\s+${ten}\s*=\s*${neo}([^;]+);`));
  assert.ok(
    khop,
    `Không trích được \`const ${ten} = …;\` từ scripts/system-route.mjs — engine đã đổi tên/cấu trúc. ` +
      `Cập nhật mẫu trích của hợp đồng §25 (không được bỏ khẳng định).`
  );
  // Cố ý thi hành ĐÚNG biểu thức của engine thay vì chép lại luật vào test (eslint của dự án không bật `no-new-func`).
  const ham = new Function("numberValue", ...thamSo, `return (${khop[1]});`);
  return ham.bind(null, numberValue);
}

/**
 * TRÍCH một KHỐI lệnh của engine (`mau` = regex có 1 nhóm bắt buộc) rồi biến nó thành hàm thi hành được.
 *
 * VÌ SAO CẦN (khác `congThucEngine`): chốt chặn "số lượng đặt vượt số đã được duyệt mua" của engine là
 * `if (… > … + 1e-9) throw new Error(…)` nằm INLINE trong callback `forEach`, KHÔNG phải `const … = …;`.
 * Nếu chép lại phép so sánh vào test thì luật bị NHÂN BẢN ⇒ engine nới lỏng chốt mà test vẫn xanh.
 * Ở đây test THI HÀNH chính biểu thức của engine: engine đổi ⇒ hàm trả `false` ⇒ assert ĐỎ.
 *
 * @param {string} mau regex có đúng 1 nhóm bắt buộc, nhóm đó là BIỂU THỨC điều kiện.
 * @param {string[]} thamSo tên tham số tự do truyền vào (ở đây: `source`, `next`).
 */
function trichKhoi(mau, thamSo) {
  const khop = ROUTE.match(new RegExp(mau));
  assert.ok(
    khop,
    `Không trích được khối lệnh \`${mau}\` từ scripts/system-route.mjs — engine đã đổi cấu trúc. ` +
      `Cập nhật mẫu trích của hợp đồng §25 (KHÔNG được bỏ khẳng định "chặn đặt vượt phân bổ").`
  );
  const ham = new Function("numberValue", ...thamSo, `if (${khop[1]}) return true; return false;`);
  const goi = ham.bind(null, numberValue);
  return { bieuThuc: khop[1], vuot: (...doiSo) => goi(...doiSo) };
}

/**
 * Bộ lọc phân bổ THẬT của `create_po`: `addedByItem` cộng dồn số đã đặt TRONG CÙNG lượt gọi,
 * rồi đối chiếu `ordered_qty(hiện có) + next` với `approved_purchase_qty`.
 * Trả về danh sách dòng BỊ CHẶN (mô phỏng đúng vòng `forEach` của engine, không thêm luật nào).
 */
function chayChotPhanBo(vuot, dongYeuCau) {
  const daThem = new Map();
  const biChan = [];
  dongYeuCau.forEach((line, index) => {
    const next = (daThem.get(line.requestItemId) || 0) + line.quantity;
    if (vuot({ orderedQty: line.orderedQty, approvedQty: line.approvedQty }, next)) {
      biChan.push({ index: index + 1, requestItemId: line.requestItemId, orderedQty: line.orderedQty, approvedQty: line.approvedQty, next });
      return;
    }
    daThem.set(line.requestItemId, next);
  });
  return { biChan, daThem };
}

/**
 * Mẫu trích chốt chặn VƯỢT PHÂN BỔ của engine (`create_po`) — dùng chung cho Case 7 và Case 8.
 * Viết trên MỘT dòng để tránh xuống dòng ngoài ý muốn trong mẫu regex.
 */
const MAU_CHOT_PHAN_BO = String.raw`if\s*\(\s*(numberValue\(source\.orderedQty\)\s*\+\s*next\s*>\s*numberValue\(source\.approvedQty\)\s*\+\s*1e-9)\s*\)\s*throw new Error\((?:\`|")(?:Dòng PO \$\{index\+1\}: )?số lượng đặt vượt số đã được duyệt mua`;

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// TẦNG 3: MySQL THẬT, CHỈ ĐỌC (khuôn mẫu lấy nguyên từ `tools/p2-split-po-audit.mjs`)
// ─────────────────────────────────────────────────────────────────────────────────────────────────
const MYSQL = process.env.MYSQL_BIN || "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
const CSDL = process.env.MYSQL_DB || "vntech_erp";
const KHOA_CHI_DOC = "SET SESSION TRANSACTION READ ONLY";

function mysql(cau) {
  const out = execFileSync(
    MYSQL,
    ["--default-character-set=utf8mb4", "-uvntech", "-pvntech", CSDL, "-N", "-B", "-e", `${KHOA_CHI_DOC}; ${cau}`],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 30000 }
  );
  if (/\bERROR\s+\d+\s+\(/.test(out)) throw new Error(`MySQL từ chối truy vấn: ${out.trim().slice(0, 200)}`);
  return out
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "")
    .map((line) => line.split("\t"));
}
/** Một số nguyên. */
const motSo = (cau) => Number((mysql(cau)[0] || ["0"])[0] || 0);

let LOI_MYSQL = "";
let coMySQL = true;
try {
  mysql("SELECT 1;");
} catch (error) {
  coMySQL = false;
  LOI_MYSQL = `Không kết nối được MySQL (${String(error?.message || error).split("\n")[0].slice(0, 140)}) — ca dữ liệu KHÔNG được tính là ĐẠT`;
}

// ════════════════════════════════════════════════════════════════════════════════════════════════
// §25 CASE 7 — PR item = 100 · PO001 = 60 · PO002 = 40 ⇒ HỢP LỆ (không vượt phân bổ, rollup khớp)
// ════════════════════════════════════════════════════════════════════════════════════════════════
test("§25 Case 7 — PR dòng 100 tách 60 + 40 ⇒ HỢP LỆ: chốt phân bổ không chặn + rollup khớp + dữ liệu thật không dòng vượt", async (t) => {
  const { childPurchaseOrdersFor, numeric } = await trace();

  // [1] HÀM THUẦN THẬT: 2 PO cùng trỏ 1 dòng PR ⇒ gom đúng 2 PO, tổng đặt bằng đúng số đã duyệt.
  const duLieu = {
    purchaseOrders: [
      { id: "PO001", poNo: "PO001", requestId: "PR-7", requestItemId: "L-100", orderedQty: 60 },
      { id: "PO002", poNo: "PO002", requestId: "PR-7", requestItemId: "L-100", orderedQty: 40 },
      { id: "PO999", poNo: "PO999", requestId: "PR-KHAC", requestItemId: "L-100", orderedQty: 500 },
    ],
  };
  const haiPo = childPurchaseOrdersFor(duLieu, "PR-7");
  assert.equal(haiPo.length, 2, "Phải gom ĐÚNG 2 PO của PR-7 — PO của PR khác KHÔNG được lọt vào (nếu lọt thì tổng bị thổi lên)");
  const tongDat = haiPo.reduce((sum, po) => sum + numeric(po.orderedQty), 0);
  assert.equal(tongDat, 100, "Cộng dồn 60 + 40 = 100 ⇒ ĐÚNG BẰNG số dòng PR đã duyệt mua (hợp lệ, không thừa không thiếu)");

  // [2] CÔNG THỨC THẬT CỦA ENGINE: chạy chính chốt chặn phân bổ của `create_po` trên 2 dòng 60 và 40.
  const chot = trichKhoi(MAU_CHOT_PHAN_BO, ["source", "next"]);
  assert.match(chot.bieuThuc, /numberValue\(source\.orderedQty\)\s*\+\s*next\s*>\s*numberValue\(source\.approvedQty\)\s*\+\s*1e-9/, "Biểu thức trích phải đúng phép so sánh của engine (cộng dồn đã đặt + lượt này vs hạn mức đã duyệt)");
  const { biChan, daThem } = chayChotPhanBo(chot.vuot, [
    { requestItemId: "L-100", orderedQty: 0, approvedQty: 100, quantity: 60 },
    { requestItemId: "L-100", orderedQty: 0, approvedQty: 100, quantity: 40 },
  ]);
  assert.deepEqual(biChan, [], "60 + 40 = 100 KHÔNG được chặn (nếu chặn thì đường đi hợp lệ của Case 7 bị bịt)");
  assert.equal(daThem.get("L-100"), 100, "Chốt phân bổ phải ghi nhận ĐÃ ĐẶT ĐỦ 100 sau 2 dòng");
  const vuotNguong = chot.vuot({ orderedQty: 0, approvedQty: 100 }, 101);
  assert.equal(vuotNguong, true, "…và PHẢI chặn 101/100 — nếu không chặn thì Case 8 không có chốt nào để tựa vào");
  // ⚠️ Dung sai của CHÍNH phép so sánh này là 1e-9 (KHÔNG phải `DUNG_SAI_SL` = 1e-4 của cột DECIMAL(18,4)):
  //    điều kiện là `> approvedQty + 1e-9` nên đúng ngưỡng 1e-9 vẫn LỌT, vượt 1e-9 là BỊ CHẶN.
  assert.equal(chot.vuot({ orderedQty: 0, approvedQty: 100 }, 100 + 1e-9), false, "Đúng ngưỡng dung sai 1e-9 ⇒ chưa vượt (không chặn oan)");
  assert.equal(chot.vuot({ orderedQty: 0, approvedQty: 100 }, 100 + 2e-9), true, "Vượt ngưỡng 1e-9 ⇒ phải chặn");
  assert.equal(
    chot.vuot({ orderedQty: 0, approvedQty: 100 }, 100 + DUNG_SAI_SL),
    true,
    `Vượt hẳn dung sai cột DECIMAL của dự án (DUNG_SAI_SL = ${DUNG_SAI_SL}) ⇒ chắc chắn phải chặn`
  );
  assert.equal(
    chot.vuot({ orderedQty: 0, approvedQty: 100 }, 100 + DUNG_SAI_SL / 2),
    true,
    "Nửa dung sai cột cũng đã lớn hơn 1e-9 ⇒ chốt chặn của engine KHẮT KHE HƠN dung sai cột (ghi nhận trung thực)"
  );

  // [3] DỮ LIỆU THẬT: không dòng PR nào đặt vượt hạn mức, và rollup dòng PR khớp tổng dòng PO.
  if (!coMySQL) return t.skip(LOI_MYSQL);
  const dong = mysql(
    "SELECT i.id, i.line_no, i.approved_purchase_qty, IFNULL(SUM(poi.ordered_qty),0) " +
      "FROM material_request_items i LEFT JOIN purchase_order_items poi ON poi.request_item_id=i.id " +
      "GROUP BY i.id, i.line_no, i.approved_purchase_qty"
  ).map(([id, line, approved, ordered]) => ({ id, line, approved: Number(approved), ordered: Number(ordered) }));
  assert.ok(dong.length > 0, "Không đọc được dòng PR nào ⇒ phép đo RỖNG, không được kết luận ĐẠT");
  const vuot = dongVuotSoLuong(dong); // TÁI DÙNG hàm quyết định của cổng `tools/p2-split-po-audit.mjs`
  const lech = lechTong(
    mysql(
      "SELECT i.id, i.ordered_qty, IFNULL(SUM(poi.ordered_qty),0) " +
        "FROM material_request_items i LEFT JOIN purchase_order_items poi ON poi.request_item_id=i.id " +
        "GROUP BY i.id, i.ordered_qty"
    ).map(([id, mriOrdered, poiSum]) => ({ id, mriOrdered: Number(mriOrdered), poiSum: Number(poiSum) }))
  );
  const kl = ketLuan([
    { ma: "C7-VUOT", ten: "Dòng PR đặt vượt hạn mức đã duyệt", dat: vuot.length === 0 },
    { ma: "C7-LECH", ten: "Dòng PR lệch tổng rollup so với dòng PO", dat: lech.length === 0 },
  ]);
  assert.equal(vuot.length, 0, `Có ${vuot.length} dòng PR đặt VƯỢT hạn mức: ${vuot.slice(0, 3).map((r) => `${r.id} ${r.ordered}/${r.approved}`).join(" · ")}`);
  assert.equal(lech.length, 0, `Có ${lech.length} dòng PR lệch tổng rollup: ${lech.slice(0, 3).map((r) => `${r.id} lệch ${r.lech}`).join(" · ")}`);
  assert.equal(kl.dat, true, `Cổng Case 7 HỎNG: ${kl.soHong}/${kl.soTong} phép đo vi phạm`);
  // Đối chứng chống đo rỗng: phải có ít nhất 1 dòng PR đã được đặt ĐỦ (tức đường đi 60+40 thật sự xảy ra).
  const datDu = dong.filter((r) => r.approved > 0 && r.ordered >= r.approved - DUNG_SAI_SL).length;
  assert.ok(datDu > 0, "Không dòng PR nào đặt đủ hạn mức trên dữ liệu thật ⇒ nhánh 'đặt vừa đủ' chưa từng chạy ⇒ phép đo RỖNG");
  t.diagnostic(`Dòng PR đo được=${dong.length} · đặt vượt=${vuot.length} · lệch rollup=${lech.length} · đặt đủ hạn mức=${datDu} (${tiLe(datDu, dong.length)})`);
});

// ════════════════════════════════════════════════════════════════════════════════════════════════
// §25 CASE 8 — PR item = 100 · PO001 = 60 · PO002 = 60 ⇒ TỪ CHỐI / CHẶN VƯỢT PHÂN BỔ
// ════════════════════════════════════════════════════════════════════════════════════════════════
test("§25 Case 8 — PR dòng 100 với 60 + 60 ⇒ bị CHẶN NGAY TẠI LƯỢT GỌI (chốt cộng dồn) + lược đồ không chặn oan + dữ liệu thật 0 dòng vượt", async (t) => {
  const { childPurchaseOrdersFor, numeric } = await trace();

  // [1] HÀM THUẦN THẬT: nếu 2 PO 60+60 cùng trỏ 1 dòng PR thì tổng PHẢI vượt hạn mức — đây là cái phải bị chặn.
  const duLieu = {
    purchaseOrders: [
      { id: "PO001", poNo: "PO001", requestId: "PR-8", requestItemId: "L-100", orderedQty: 60 },
      { id: "PO002", poNo: "PO002", requestId: "PR-8", requestItemId: "L-100", orderedQty: 60 },
    ],
  };
  const haiPo = childPurchaseOrdersFor(duLieu, "PR-8");
  assert.equal(haiPo.length, 2, "Phải thấy ĐÚNG 2 PO để đo tổng phân bổ");
  assert.equal(haiPo.reduce((sum, po) => sum + numeric(po.orderedQty), 0), 120, "60 + 60 = 120 > 100 ⇒ tình huống vượt phân bổ phải được nhận diện");
  const vuotTheoCong = dongVuotSoLuong([{ id: "L-100", approved: 100, ordered: 120 }]); // TÁI DÙNG hàm quyết định của cổng
  assert.equal(vuotTheoCong.length, 1, "Hàm quyết định của cổng phải xếp dòng 120/100 vào nhóm VƯỢT");
  assert.equal(vuotTheoCong[0].vuot, 20, "Mức vượt phải là 20 (120 − 100)");

  // [2] CÔNG THỨC THẬT CỦA ENGINE: chốt chặn THẬT là cộng dồn TRONG CÙNG lượt gọi ⇒ lượt 2 bị TỪ CHỐI.
  const chot = trichKhoi(MAU_CHOT_PHAN_BO, ["source", "next"]);
  const hong = chayChotPhanBo(chot.vuot, [
    { requestItemId: "L-100", orderedQty: 0, approvedQty: 100, quantity: 60 },
    { requestItemId: "L-100", orderedQty: 0, approvedQty: 100, quantity: 60 },
  ]);
  assert.equal(hong.biChan.length, 1, "PHẢI chặn đúng 1 dòng (lượt 60 thứ hai) — đây là 'prevent over-allocation' của Case 8");
  assert.equal(hong.biChan[0].index, 2, "Dòng bị chặn phải là dòng thứ 2, không phải dòng đầu");
  assert.equal(hong.biChan[0].next, 120, "Giá trị bị chặn phải là 120 = đã đặt 60 + lượt này 60 (chốt cộng dồn, không xét riêng từng dòng)");
  assert.equal(hong.daThem.get("L-100"), 60, "Phần đã ghi nhận phải DỪNG ở 60 — dòng sau bị TỪ CHỐI nên không được cộng vào");
  // Chống hồi quy quan trọng: nếu engine CHỈ xét từng dòng riêng lẻ (60 <= 100) thì tình huống 60+60 sẽ LỌT.
  assert.equal(chot.vuot({ orderedQty: 0, approvedQty: 100 }, 60), false, "Xét RIÊNG một dòng 60 thì không vượt ⇒ chốt cộng dồn mới là thứ chặn Case 8 (đây là lý do phải đo `next`, không đo `qty`)");
  assert.equal(chot.vuot({ orderedQty: 60, approvedQty: 100 }, 60), true, "Khi đã có 60 trong CSDL: 60 + 60 = 120 > 100 ⇒ lần gọi MỚI cũng bị chặn (không chỉ trong cùng 1 lượt)");

  // [3] DỮ LIỆU THẬT: 2 điều kiện — (a) 0 dòng vượt, (b) lược đồ CHO PHÉP nhiều dòng PO trên 1 dòng PR.
  if (!coMySQL) return t.skip(LOI_MYSQL);
  const vuot = motSo(
    "SELECT COUNT(*) FROM (SELECT i.id FROM material_request_items i LEFT JOIN purchase_order_items poi ON poi.request_item_id=i.id " +
      "GROUP BY i.id, i.approved_purchase_qty HAVING COALESCE(SUM(poi.ordered_qty),0) > i.approved_purchase_qty + 1e-4) v"
  );
  assert.equal(vuot, 0, `Có ${vuot} dòng PR đặt vượt hạn mức trên dữ liệu thật ⇒ chốt chặn đã bị lọt`);
  // (b) Đối chứng chống đo rỗng: nếu `request_item_id` là UNIQUE thì "vượt phân bổ" bất khả thi về lược đồ,
  //     nên 0 vi phạm ở (a) là hệ quả của LƯỢC ĐỒ chứ không chứng minh được chốt ứng dụng ⇒ phải kiểm cả hai.
  const coDuyNhat = motSo(
    "SELECT COUNT(DISTINCT s.index_name) FROM information_schema.statistics s WHERE s.table_schema=DATABASE() " +
      "AND s.table_name='purchase_order_items' AND s.non_unique=0 AND s.column_name='request_item_id'"
  );
  const soDong = motSo("SELECT COUNT(*) FROM material_request_items WHERE approved_purchase_qty>0");
  assert.equal(coDuyNhat, 0, "Lược đồ KHÔNG được có unique trên purchase_order_items.request_item_id (nếu có thì «tách nhiều PO trên 1 dòng PR» bất khả thi về lược đồ)");
  assert.ok(soDong > 0, "Không dòng PR nào có hạn mức mua ⇒ phép đo RỖNG, không được kết luận ĐẠT");
  t.diagnostic(`Dòng PR vượt hạn mức=${vuot} · unique(request_item_id)=${coDuyNhat} (0 = lược đồ cho phép tách nhiều PO) · dòng PR có hạn mức=${soDong}`);
});

// ════════════════════════════════════════════════════════════════════════════════════════════════
// §25 CASE 9 — PR001 → Workflow V1 · đổi sang V2 · PR001 giữ V1 · PR002 dùng V2
//   ⇒ TÀI LIỆU HOÁ KHOẢNG TRỐNG: tính năng BẤT KHẢ THI trên lược đồ hiện tại (audit đã chốt, cần người dùng chốt Q3).
// ════════════════════════════════════════════════════════════════════════════════════════════════
test("§25 Case 9 — Workflow V1/V2: [TÀI LIỆU HOÁ KHOẢNG TRỐNG] versioning CHƯA tồn tại + cơ chế thay thế CÓ THẬT (snapshot trên approvals) + BLOCKED chờ chốt Q3", async (t) => {
  // ── A. KHOẢNG TRỐNG Ở TẦNG MÃ NGUỒN (§7 chưa được thi hành trong engine JS) ──
  assert.doesNotMatch(ROUTE, /workflow_id/, "Engine KHÔNG được tham chiếu `workflow_id` — tính năng đa luồng có bảng nhưng CHƯA được nối vào luồng phiếu");
  assert.doesNotMatch(ROUTE, /workflow_version/, "Engine KHÔNG có khái niệm `workflow_version` ⇒ đặc tả §7 «PR001 giữ V1» CHƯA có chỗ thi hành");
  assert.doesNotMatch(
    ROUTE,
    /publish_workflow_version|revise_workflow/,
    "Engine KHÔNG có action phát hành/soạn phiên bản workflow ⇒ không có đường tạo V2"
  );
  // Cơ chế THAY THẾ có thật (ghi trung thực, không hạ kỳ vọng): snapshot ghi cứng lúc tạo phiếu.
  assert.match(
    ROUTE,
    /LEFT JOIN approval_stage_catalog cfg ON cfg\.stage_no=a\.stage/,
    "Cơ chế thay thế CÓ THẬT: quyết định duyệt đọc `approvals` và chỉ JOIN cấu hình làm DỰ PHÒNG (LEFT JOIN)"
  );
  assert.match(
    ROUTE,
    /COALESCE\(NULLIF\(a\.allowed_role_codes_snapshot\s*,\s*''\),cfg\.allowed_role_codes,''\)/,
    "…và ưu tiên `allowed_role_codes_snapshot` đã ghi cứng trên phiếu ⇒ phiếu cũ KHÔNG đổi theo cấu hình mới"
  );
  assert.match(
    ROUTE,
    /COALESCE\(NULLIF\(a\.approval_mode_snapshot\s*,\s*''\),cfg\.approval_mode,'single'\)/,
    "…tương tự với `approval_mode_snapshot` ⇒ cơ chế bất biến hiện có là snapshot TỪNG BƯỚC, không phải versioning cả luồng"
  );

  // ── B. KHOẢNG TRỐNG Ở TẦNG LƯỢC ĐỒ (MySQL THẬT) ──
  if (!coMySQL) {
    t.diagnostic("MySQL không kết nối được ⇒ phần lược đồ của Case 9 chưa đo được (ghi UNKNOWN, KHÔNG tính là ĐẠT)");
    return t.skip(LOI_MYSQL);
  }
  const cotCua = (bang) =>
    mysql(
      `SELECT column_name FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='${bang}'`
    ).map(([ten]) => ten);
  for (const bang of ["material_requests", "purchase_orders"]) {
    const cot = cotCua(bang);
    assert.ok(cot.length > 0, `Không đọc được lược đồ \`${bang}\` ⇒ không thể kết luận về khoảng trống`);
    assert.equal(cot.includes("workflow_id"), false, `${bang} KHÔNG có cột \`workflow_id\` ⇒ KHÔNG có chỗ ghi "phiếu này chạy luồng nào"`);
    assert.equal(cot.includes("workflow_version"), false, `${bang} KHÔNG có cột \`workflow_version\` ⇒ KHÔNG có chỗ ghi "phiếu này chạy bản nào"`);
  }
  const cotWfDef = cotCua("workflow_definitions");
  assert.ok(cotWfDef.length > 0, "Bảng `workflow_definitions` phải tồn tại — nếu mất thì cơ chế thay thế cũng đổ theo");
  assert.equal(cotWfDef.includes("version"), false, "`workflow_definitions.version` đã bị XOÁ (Flyway V19) ⇒ không còn cột phiên bản nào để tách V1/V2");
  assert.equal(cotCua("workflow_steps").includes("version"), false, "`workflow_steps.version` không tồn tại ⇒ không thể song song bước của V1 và bước của V2");
  // Bằng chứng lược đồ CHẶN V2: `UNIQUE(code)` trên định nghĩa ⇒ muốn có V1 và V2 cùng nghiệp vụ phải đổi mã.
  assert.equal(
    motSo(
      "SELECT COUNT(DISTINCT index_name) FROM information_schema.statistics WHERE table_schema=DATABASE() " +
        "AND table_name='workflow_definitions' AND non_unique=0 AND column_name='code'"
    ),
    1,
    "Phải tồn tại ĐÚNG 1 unique trên `workflow_definitions.code` — chính ràng buộc này chặn việc tạo V2 cùng mã"
  );
  const versionTable = motSo(
    "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name LIKE '%workflow_version%'"
  );
  assert.equal(versionTable, 0, "Không có bảng `*workflow_version*` nào ⇒ §7 «definition → version → instance → step instance» CHƯA được dựng");
  // Cơ chế thay thế có thật ở tầng dữ liệu: 2 cột snapshot tồn tại và có bước đã ghi giá trị.
  const cotAppr = cotCua("approvals");
  for (const cot of ["allowed_role_codes_snapshot", "approval_mode_snapshot"]) {
    assert.equal(cotAppr.includes(cot), true, `\`approvals.${cot}\` phải tồn tại — đây là cơ chế thay thế đang gánh tính bất biến của phiếu cũ`);
  }
  const wfDef = motSo("SELECT COUNT(*) FROM workflow_definitions");
  const wfStep = motSo("SELECT COUNT(*) FROM workflow_steps");
  assert.ok(wfDef > 0 && wfStep > 0, `Bảng luồng có sẵn nhưng RỖNG (definition=${wfDef} · step=${wfStep}) ⇒ mọi kết luận về "V1/V2" là đo rỗng`);

  // ── C. ĐIỀU CẦN ĐỂ LÀM THẬT (ghi rõ, không hạ kỳ vọng của đặc tả) ──
  t.diagnostic(
    "KHOẢNG TRỐNG §7 (BLOCKED — cần người dùng chốt Q3): " +
      "(1) dựng `workflow_versions` (definition → version) và nối `workflow_steps.workflow_version_id`; " +
      "(2) thêm `workflow_id` + `workflow_version` (hoặc con trỏ phiên bản) lên `material_requests`/`purchase_orders`; " +
      "(3) bỏ/đổi `UNIQUE(workflow_definitions.code)` vì đang chặn tạo V2; " +
      "(4) ghim phiên bản vào phiếu NGAY LÚC TẠO và chỉ đọc bản đã ghim khi duyệt. " +
      `Hiện trạng: 0 cột workflow_id/version trên PR+PO · 0 bảng *workflow_version* · ${wfDef} definition / ${wfStep} step · cơ chế thay thế = snapshot trên approvals.`
  );
  t.diagnostic(
    "KHÔNG khẳng định: (a) «PR001 giữ V1 / PR002 dùng V2» CHƯA từng chạy thật — không có dữ liệu để đo; " +
      "(b) lược đồ `drizzle/0080` còn khai `version` trong khi MySQL thật đã bỏ ⇒ hai nguồn lược đồ ĐANG LỆCH NHAU."
  );
});

// ════════════════════════════════════════════════════════════════════════════════════════════════
// §25 CASE 10 — PO cancelled ⇒ KIỂM CHỨNG LOGIC HOÀN TẤT CỦA PR
// ════════════════════════════════════════════════════════════════════════════════════════════════
test("§25 Case 10 — PO bị hủy: công thức hoàn tất KHÔNG tự đóng PR + cổng hủy chỉ đụng PO + dữ liệu thật 0 PR đóng khống", async (t) => {
  const { deliveryProgress } = await trace();

  // [1] HÀM THUẦN THẬT: PO bị hủy ⇒ không nhận được gì ⇒ dòng PO còn nguyên phần thiếu.
  const poHuy = { orderedQty: 100, receivedQty: 0, closedQty: 0 };
  const tienDo = deliveryProgress(poHuy);
  assert.equal(tienDo.complete, false, "PO bị hủy (nhận 0) KHÔNG được coi là hoàn tất");
  assert.equal(tienDo.audit.remaining, 100, "Phần thiếu của PO bị hủy vẫn là 100 — hủy KHÔNG được biến thành «đã đóng»");
  assert.equal(tienDo.percent, 0, "Tiến độ nhận của PO bị hủy phải là 0%");

  // [2] CÔNG THỨC + CỔNG THẬT CỦA ENGINE.
  const prHoanTat = congThucEngine("requestCompleted", ["requestTotals", "currentAccepted"]);
  assert.equal(
    prHoanTat({ receivedQty: 0, closedQty: 0, approvedQty: 100 }, 0),
    false,
    "PR có PO bị hủy (nhận 0/100) ⇒ `requestCompleted` PHẢI false — hủy PO không được tự đóng PR"
  );
  assert.equal(prHoanTat({ receivedQty: 0, closedQty: 100, approvedQty: 100 }, 0), true, "…chỉ khi phần thiếu được ĐÓNG bằng `closed_qty` mới được coi là xong (đóng là hành động riêng, không phải hệ quả của hủy)");
  // Cổng hủy PO: chỉ ĐỔI TRẠNG THÁI PO + ghi lý do/người/thời điểm, KHÔNG đụng bảng dữ liệu nhận hàng.
  assert.match(
    ROUTE,
    /UPDATE purchase_orders SET status='cancelled',decision_reason=\?,decided_by=\?,decided_at=\?,updated_at=\? WHERE id=\?/,
    "Cổng hủy PO phải là `UPDATE purchase_orders SET status='cancelled'` kèm lý do/người/thời điểm"
  );
  assert.match(
    ROUTE,
    /PO không tồn tại hoặc đã xử lý\./,
    "Chỉ PO đang `pending_approval` mới được hủy (chống hủy lại PO đã xử lý)"
  );
  assert.match(
    ROUTE,
    /PR vẫn mở để xử lý lại\./,
    "Thông điệp THẬT của engine khẳng định PR vẫn mở sau khi hủy PO — hợp đồng nguồn của Case 10"
  );
  assert.match(ROUTE, /"cancelled"/, "Engine phải có trạng thái `cancelled` cho PO");
  // Bằng chứng PHỦ ĐỊNH: không câu lệnh nào trong cổng hủy đụng tới số lượng nhận/đóng của PO hay PR.
  const thanCongHuy = ROUTE.slice(ROUTE.indexOf('action === "reject_po"'), ROUTE.indexOf('action === "update_po_price"'));
  assert.ok(thanCongHuy.length > 200, "Phải trích được thân cổng hủy PO để kiểm chứng (trích rỗng ⇒ khẳng định dưới đây vô nghĩa)");
  for (const cam of ["purchase_order_items", "material_request_items", "material_requests"]) {
    assert.equal(
      thanCongHuy.includes(cam),
      false,
      `Cổng hủy PO KHÔNG được đụng bảng \`${cam}\` — hủy mà sửa số lượng nhận/đóng của PR chính là lỗi mà Case 10 phải bắt`
    );
  }

  // [3] DỮ LIỆU THẬT: bất biến «PO bị hủy ⇒ PR không được mang trạng thái hoàn tất».
  if (!coMySQL) return t.skip(LOI_MYSQL);
  const tongPo = motSo("SELECT COUNT(*) FROM purchase_orders");
  assert.ok(tongPo > 0, "CSDL không có PO nào ⇒ phép đo RỖNG, không được kết luận ĐẠT");
  const capPoHuy = motSo("SELECT COUNT(*) FROM purchase_orders WHERE status='cancelled'");
  const hoSoHuy = motSo(
    "SELECT COUNT(*) FROM purchase_orders WHERE status='cancelled' AND (COALESCE(decision_reason,'')='' OR decided_at IS NULL OR decided_by IS NULL)"
  );
  assert.equal(hoSoHuy, 0, `Có ${hoSoHuy} PO bị hủy nhưng THIẾU hồ sơ (lý do/người/thời điểm) ⇒ không truy vết được vì sao hủy`);
  const prDongKhong = motSo(
    "SELECT COUNT(DISTINCT mr.id) FROM material_requests mr JOIN purchase_orders po ON po.request_id=mr.id " +
      "WHERE po.status='cancelled' AND mr.supply_status IN ('completed','completed_with_shortage')"
  );
  assert.equal(
    prDongKhong,
    0,
    `Có ${prDongKhong} PR mang trạng thái HOÀN TẤT trong khi vẫn còn PO con bị HỦY ⇒ hủy PO đã bị hiểu nhầm thành hoàn tất`
  );
  const capPoPr = motSo("SELECT COUNT(*) FROM purchase_orders po JOIN material_requests mr ON mr.id=po.request_id");
  assert.ok(capPoPr > 0, "Không có cặp PO→PR nào để đo bất biến hoàn tất ⇒ phép đo RỖNG");
  t.diagnostic(
    `PO=${tongPo} · PO bị hủy=${capPoHuy} · PO hủy thiếu hồ sơ=${hoSoHuy} · PR hoàn tất-khi-còn-PO-hủy=${prDongKhong} · cặp PO→PR=${capPoPr}`
  );
});

// ════════════════════════════════════════════════════════════════════════════════════════════════
// §25 CASE 11 — NHIỀU GRN CHO MỘT PO ⇒ CỘNG DỒN SỐ LƯỢNG PHẢI ĐÚNG
// ════════════════════════════════════════════════════════════════════════════════════════════════
test("§25 Case 11 — nhiều GRN trên 1 PO: cộng dồn phải gộp ĐỦ chuyến (không bỏ sót, không nhân đôi) + dữ liệu thật khớp từng PO", async (t) => {
  const { receiptsForPurchaseOrder, numeric } = await trace();

  // [1] HÀM THUẦN THẬT: gom 3 chuyến của 1 PO, KHÔNG lấy chuyến của PO khác.
  const duLieu = {
    receipts: [
      { id: "G1", receiptNo: "GRN-11-1", purchaseOrderId: "PO-11", acceptedQty: 40, itemCount: 1 },
      { id: "G2", receiptNo: "GRN-11-2", purchaseOrderId: "PO-11", acceptedQty: 35, itemCount: 1 },
      { id: "G3", receiptNo: "GRN-11-3", purchaseOrderId: "PO-11", acceptedQty: 25, itemCount: 1 },
      { id: "G4", receiptNo: "GRN-11-KHAC", purchaseOrderId: "PO-99", acceptedQty: 999, itemCount: 1 },
    ],
  };
  const chuyen = receiptsForPurchaseOrder(duLieu, "PO-11");
  assert.equal(chuyen.length, 3, "Phải gom ĐÚNG 3 chuyến của PO-11 — chuyến của PO khác không được lọt vào");
  const congDon = chuyen.reduce((sum, row) => sum + numeric(row.acceptedQty), 0);
  assert.equal(congDon, 100, "Cộng dồn 40 + 35 + 25 = 100: không bỏ sót chuyến nào và không nhân đôi chuyến nào");
  const chiMotChuyen = numeric(chuyen[0].acceptedQty);
  assert.equal(chiMotChuyen, 40, "Chỉ riêng chuyến đầu không đủ đại diện cho tổng — đây là lý do Case 11 phải đo cộng dồn");

  // [2] CÔNG THỨC THẬT CỦA ENGINE: nhận từng chuyến (received_qty = received_qty + accepted).
  const fullyDelivered = congThucEngine("fullyDelivered", ["poTotals", "currentAccepted"]);
  const poTotals = { orderedQty: 100, receivedQty: 0, closedQty: 0 };
  assert.equal(fullyDelivered(poTotals, chiMotChuyen), false, "Mới nhận chuyến 40/100 ⇒ CHƯA hoàn tất (nếu true thì lỗi bỏ sót chuyến đã bị che)");
  assert.equal(fullyDelivered({ ...poTotals, receivedQty: 40 }, 35), false, "40 + 35 = 75/100 ⇒ vẫn chưa hoàn tất");
  assert.equal(fullyDelivered({ ...poTotals, receivedQty: 75 }, 25), true, "75 + 25 = 100/100 ⇒ PHẢI hoàn tất: đây là phép cộng dồn ĐỦ 3 chuyến");
  assert.equal(fullyDelivered({ ...poTotals, receivedQty: 75 }, 24), false, "Thiếu 1 đơn vị ⇒ KHÔNG được hoàn tất (chống «cộng dồn làm tròn thành đủ»)");
  const trangThaiPo = congThucEngine("nextStatus", ["completed", "fullyDelivered", "hasAccepted", "hasExceptions"], String.raw`(?=completed\s*\?)`);
  const trangThaiHopLe = new Set([trangThaiPo(true, true, true, false), trangThaiPo(true, true, true, true), trangThaiPo(false, true, true, false), trangThaiPo(false, false, true, false), trangThaiPo(false, false, false, false)]);
  assert.equal(trangThaiHopLe.has("completed"), true, "Trạng thái hoàn tất phải nằm trong tập trạng thái hợp lệ của engine");
  assert.equal(trangThaiPo(true, true, true, true), "completed_with_exceptions", "Đủ số nhưng thiếu chứng từ ⇒ phải là `completed_with_exceptions`");

  // [3] DỮ LIỆU THẬT: mỗi PO nhiều chuyến — số nhận theo DÒNG PO phải khớp tổng GRN ĐÃ GHI NHẬN.
  if (!coMySQL) return t.skip(LOI_MYSQL);
  const poNhieuChuyen = mysql(
    "SELECT po.po_no, po.status, IFNULL(SUM(poi.ordered_qty),0) tot_ord, IFNULL(SUM(poi.received_qty),0) tot_rcv, IFNULL(SUM(poi.closed_qty),0) tot_cls, " +
      "(SELECT COUNT(DISTINCT g.id) FROM goods_receipts g WHERE g.purchase_order_id=po.id) n_grn, " +
      "(SELECT COUNT(DISTINCT g.id) FROM goods_receipts g WHERE g.purchase_order_id=po.id AND g.bch_confirmation_status='confirmed') n_grn_xac_nhan, " +
      "IFNULL((SELECT SUM(gri.accepted_qty) FROM goods_receipt_items gri JOIN purchase_order_items p2 ON p2.id=gri.purchase_order_item_id WHERE p2.purchase_order_id=po.id),0) tong_chap_nhan " +
      "FROM purchase_orders po JOIN purchase_order_items poi ON poi.purchase_order_id=po.id " +
      "GROUP BY po.id, po.po_no, po.status " +
      "HAVING (SELECT COUNT(DISTINCT g.id) FROM goods_receipts g WHERE g.purchase_order_id=po.id) >= 2"
  ).map(([poNo, status, ord, rcv, cls, nGrn, nGrnXn, tongChapNhan]) => ({
    poNo,
    status,
    ordered: Number(ord),
    received: Number(rcv),
    closed: Number(cls),
    nGrn: Number(nGrn),
    nGrnXacNhan: Number(nGrnXn),
    tongChapNhan: Number(tongChapNhan),
    congDon: Number(rcv) + Number(cls),
  }));
  assert.ok(poNhieuChuyen.length > 0, "Không PO nào có ≥2 chuyến giao ⇒ phép đo RỖNG, không được kết luận ĐẠT");

  // (a) Bất biến cộng dồn: PO mang trạng thái hoàn tất ⇒ tổng nhận+đóng PHẢI đạt số đặt (đúng công thức engine).
  const hoanTatThieu = poNhieuChuyen.filter((po) => po.status.startsWith("completed") && !fullyDelivered({ orderedQty: po.ordered, receivedQty: po.received, closedQty: po.closed }, 0));
  assert.equal(
    hoanTatThieu.length,
    0,
    `Có ${hoanTatThieu.length} PO nhiều chuyến mang trạng thái HOÀN TẤT nhưng tổng nhận+đóng < số đặt: ${hoanTatThieu.map((po) => `${po.poNo} ${po.congDon}/${po.ordered}`).join(" · ")}`
  );
  // (b) Bất biến trạng thái: PO đã ĐI QUA khâu xác nhận giao hàng phải mang trạng thái mà CÔNG THỨC ENGINE
  //     suy ra được từ chính số liệu của nó. PO còn `pending_approval` (chưa từng giao) nằm NGOÀI miền công thức.
  const ngoaiMien = poNhieuChuyen.filter((po) => po.status === "pending_approval");
  const trongMien = poNhieuChuyen.filter((po) => po.status !== "pending_approval");
  assert.ok(trongMien.length > 0, "Không PO nhiều chuyến nào đã qua khâu giao nhận ⇒ phép đo trạng thái RỖNG, không được kết luận ĐẠT");
  const saiTrangThai = trongMien.filter((po) => !trangThaiHopLe.has(po.status));
  assert.equal(
    saiTrangThai.length,
    0,
    `Có ${saiTrangThai.length} PO nhiều chuyến mang trạng thái KHÔNG suy ra được từ công thức engine: ${saiTrangThai.map((po) => `${po.poNo}[${po.status} ${po.congDon}/${po.ordered}]`).join(" · ")}`
  );
  // (b2) PO mang trạng thái HOÀN TẤT ⇒ tổng GRN đã chấp nhận PHẢI đủ số đặt (chống bỏ sót chuyến khi cộng dồn).
  const hoanTatThieuChuyen = poNhieuChuyen.filter(
    (po) => po.status.startsWith("completed") && po.ordered > 0 && po.tongChapNhan < po.ordered - DUNG_SAI_SL
  );
  assert.equal(
    hoanTatThieuChuyen.length,
    0,
    `Có ${hoanTatThieuChuyen.length} PO HOÀN TẤT mà tổng GRN đã chấp nhận vẫn thiếu: ${hoanTatThieuChuyen.map((po) => `${po.poNo} chấp nhận ${po.tongChapNhan}/${po.ordered} qua ${po.nGrn} chuyến`).join(" · ")}`
  );
  // (c) Đối chứng chống đo rỗng: phải CÓ ít nhất 1 PO nhiều chuyến đã nhận đủ (nếu không thì bất biến (a) vô nghĩa).
  const duHang = poNhieuChuyen.filter((po) => po.ordered > 0 && po.congDon >= po.ordered - DUNG_SAI_SL).length;
  assert.ok(duHang > 0, "Không PO nhiều chuyến nào đã nhận đủ số ⇒ nhánh 'cộng dồn thành đủ' chưa từng chạy ⇒ phép đo RỖNG");
  // (d) BẤT BIẾN NGHIÊM NGẶT cấp dòng: số đã nhận ghi trên dòng PO KHÔNG được VƯỢT tổng số lượng các chuyến
  //     đã chấp nhận (nếu vượt ⇒ số liệu đã được cộng từ nguồn không tồn tại, đúng loại lỗi Case 11 phải bắt).
  const dongVuot = motSo(
    "SELECT COUNT(*) FROM (SELECT poi.id, poi.received_qty rcv, " +
      "IFNULL((SELECT SUM(gri.accepted_qty) FROM goods_receipt_items gri WHERE gri.purchase_order_item_id=poi.id),0) acc, " +
      "(SELECT COUNT(DISTINCT gri.receipt_id) FROM goods_receipt_items gri WHERE gri.purchase_order_item_id=poi.id) n_grn " +
      "FROM purchase_order_items poi) d WHERE d.n_grn >= 2 AND d.rcv > d.acc + 0.0001"
  );
  assert.equal(dongVuot, 0, `Có ${dongVuot} DÒNG PO nhiều chuyến mà số nhận ghi trên dòng VƯỢT tổng chuyến đã chấp nhận ⇒ cộng dồn sai nguồn`);
  // (d2) BẤT BIẾN NGHIÊM NGẶT: không dòng nào nhận VƯỢT số đặt của chính nó.
  const dongVuotDat = motSo("SELECT COUNT(*) FROM purchase_order_items WHERE received_qty+closed_qty > ordered_qty + 0.0001");
  assert.equal(dongVuotDat, 0, `Có ${dongVuotDat} dòng PO nhận+đóng VƯỢT số đặt ⇒ cộng dồn nhiều chuyến đã thổi số lên`);
  // (d3) ĐO ĐỘ LỆCH (BÁO CÁO, KHÔNG phải cổng — nêu trung thực): số đã nhận ghi trên dòng THẤP HƠN tổng
  //     chuyến đã chấp nhận ⇒ chuyến mới chưa được BCH xác nhận nên chưa cộng vào dòng (hiệu ứng dữ liệu mầm P2,
  //     không phải lỗi cộng dồn). Đây là dữ liệu nền, KHÔNG được dùng làm ngưỡng ĐẠT/HỎNG.
  const dongChamCong = motSo(
    "SELECT COUNT(*) FROM (SELECT poi.id, poi.received_qty rcv, " +
      "IFNULL((SELECT SUM(gri.accepted_qty) FROM goods_receipt_items gri WHERE gri.purchase_order_item_id=poi.id),0) acc, " +
      "(SELECT COUNT(DISTINCT gri.receipt_id) FROM goods_receipt_items gri WHERE gri.purchase_order_item_id=poi.id) n_grn " +
      "FROM purchase_order_items poi) d WHERE d.n_grn >= 2 AND d.rcv < d.acc - 0.0001"
  );
  // (e) Bất biến «chỉ chuyến ĐÃ XÁC NHẬN mới được cộng dồn»: PO chưa xác nhận chuyến nào mà đã mang trạng thái
  //     hoàn tất ⇒ số lượng đã bị cộng từ chuyến CHƯA xác nhận (đúng loại lỗi Case 11 phải bắt).
  const hoanTatKhongXacNhan = poNhieuChuyen.filter(
    (po) => po.status.startsWith("completed") && po.nGrn >= 2 && po.nGrnXacNhan === 0
  );
  assert.equal(
    hoanTatKhongXacNhan.length,
    0,
    `Có ${hoanTatKhongXacNhan.length} PO HOÀN TẤT nhưng KHÔNG có chuyến nào ở trạng thái đã xác nhận: ${hoanTatKhongXacNhan.map((po) => po.poNo).join(" · ")}`
  );
  // (f) Số chuyến ĐÃ XÁC NHẬN không được nhiều hơn tổng số chuyến (tự kiểm tra phép đếm của chính test).
  const demSai = poNhieuChuyen.filter((po) => po.nGrnXacNhan > po.nGrn);
  assert.equal(demSai.length, 0, `Phép đếm của test sai: ${demSai.map((po) => `${po.poNo} ${po.nGrnXacNhan}>${po.nGrn}`).join(" · ")}`);
  t.diagnostic(
    `PO có ≥2 chuyến=${poNhieuChuyen.length} (trong miền công thức=${trongMien.length} · còn chờ duyệt=${ngoaiMien.length}) · hoàn tất mà thiếu=${hoanTatThieu.length} · ` +
      `trạng thái lạ=${saiTrangThai.length} · hoàn tất mà tổng GRN thiếu=${hoanTatThieuChuyen.length} · đã nhận đủ=${duHang} · ` +
      `dòng vượt tổng chuyến=${dongVuot} · dòng nhận vượt số đặt=${dongVuotDat} · dòng chậm cộng (dữ liệu nền)=${dongChamCong} · ` +
      `ví dụ: ${poNhieuChuyen.slice(0, 2).map((po) => `${po.poNo}[${po.status} ${po.nGrn} chuyến (${po.nGrnXacNhan} đã xác nhận) ${po.congDon}/${po.ordered}]`).join(" ")}`
  );
});

// ════════════════════════════════════════════════════════════════════════════════════════════════
// §25 CASE 12 — NHIỀU PO TỪ MỘT PR ⇒ QUAN HỆ NGUỒN PHẢI ĐƯỢC GIỮ (CẢ HAI CHIỀU)
// ════════════════════════════════════════════════════════════════════════════════════════════════
test("§25 Case 12 — nhiều PO từ 1 PR: giữ đủ quan hệ nguồn hai chiều + mỗi dòng PO trỏ về ĐÚNG PR + dữ liệu thật 0 mồ côi", async (t) => {
  const { childPurchaseOrdersFor, purchaseOrderForReceipt, receiptsForPurchaseOrder, isOrphanPurchaseOrder, rowKey } = await trace();

  // [1] HÀM THUẦN THẬT — chiều XUÔI (PR → các PO con) và chiều NGƯỢC (GRN → PO nguồn).
  const duLieu = {
    purchaseOrders: [
      { id: "PO-A", poNo: "PO-A", requestId: "PR-12" },
      { id: "PO-B", poNo: "PO-B", requestId: "PR-12" },
      { id: "PO-C", poNo: "PO-C", requestId: "PR-KHAC" },
    ],
    receipts: [{ id: "GR-1", receiptNo: "GRN-12", purchaseOrderId: "PO-B", acceptedQty: 10, itemCount: 1 }],
  };
  const conCuaPr = childPurchaseOrdersFor(duLieu, "PR-12");
  assert.equal(conCuaPr.length, 2, "PR-12 phải giữ ĐÚNG 2 PO con — không gộp thêm PO của PR khác, không mất PO nào");
  assert.deepEqual(conCuaPr.map((po) => rowKey(po.id)), ["PO-A", "PO-B"], "Danh sách PO con phải giữ nguyên dữ liệu nguồn (không sắp xếp lại, không lọc mất)");
  const poNguon = purchaseOrderForReceipt(duLieu, duLieu.receipts[0]);
  assert.equal(rowKey(poNguon?.id), "PO-B", "Chiều NGƯỢC: GRN của PO-B phải quay về ĐÚNG PO-B (không ghép bừa sang PO-A)");
  assert.equal(receiptsForPurchaseOrder(duLieu, "PO-B").length, 1, "Chiều xuôi thứ hai: PO-B phải thấy đúng chuyến GR-1 của mình");
  assert.equal(receiptsForPurchaseOrder(duLieu, "PO-A").length, 0, "PO-A không được 'mượn' chuyến của PO-B ⇒ nguồn không bị trộn");
  assert.equal(purchaseOrderForReceipt({ purchaseOrders: duLieu.purchaseOrders, receipts: [] }, { id: "GR-X", purchaseOrderId: "PO-KHONG-CO" }), null, "GRN trỏ PO không có trong nguồn ⇒ phải trả `null` (hiện «chưa có nguồn»), KHÔNG ghép bừa");
  assert.equal(isOrphanPurchaseOrder({ id: "PO-Z" }), true, "PO không có `requestId` phải bị nhận diện là MỒ CÔI");
  assert.equal(isOrphanPurchaseOrder(duLieu.purchaseOrders[0]), false, "PO có `requestId` hợp lệ KHÔNG được coi là mồ côi");

  // [2] CÔNG THỨC + MÃ NGUỒN THẬT CỦA ENGINE: PO bắt buộc ghi `request_id`; dòng PO bắt buộc ghi `request_item_id`.
  assert.match(
    ROUTE,
    /INSERT INTO purchase_orders \(id,po_no,request_id,/,
    "Mọi PO phải được ghi kèm `request_id` ⇒ quan hệ nguồn PR→PO được lưu thật, không suy diễn từ tên/mã"
  );
  assert.match(
    ROUTE,
    /INSERT INTO purchase_order_items \(id,purchase_order_id,request_item_id,/,
    "Mỗi DÒNG PO phải ghi `request_item_id` ⇒ tách PO ở MỨC DÒNG mới truy vết được"
  );
  assert.match(
    ROUTE,
    /SELECT COUNT\(\*\) AS count FROM purchase_order_items poi JOIN material_request_items mri ON mri\.id=poi\.request_item_id WHERE mri\.request_id=\?/,
    "Engine phải đếm được dòng PO theo PR nguồn (cổng chặn xóa phiếu đã phát sinh PO tựa vào đúng quan hệ này)"
  );
  // [3] DỮ LIỆU THẬT: mọi PO truy được về PR; quan hệ nguồn không mồ côi ở cả hai chiều.
  if (!coMySQL) return t.skip(LOI_MYSQL);
  const tong = motSo("SELECT COUNT(*) FROM purchase_orders");
  const rong = motSo("SELECT COUNT(*) FROM purchase_orders WHERE request_id IS NULL OR request_id=''");
  const treo = motSo(
    "SELECT COUNT(*) FROM purchase_orders po LEFT JOIN material_requests mr ON mr.id=po.request_id " +
      "WHERE po.request_id IS NOT NULL AND po.request_id<>'' AND mr.id IS NULL"
  );
  const kq = doQuanHe({ tong, rong, treo }); // TÁI DÙNG hàm quyết định của cổng truy vết
  assert.ok(tong > 0, "CSDL không có PO nào ⇒ phép đo RỖNG, không được kết luận ĐẠT");
  assert.equal(kq.moCoi, 0, `Có ${kq.moCoi} PO mất quan hệ nguồn (rỗng ${rong} · treo ${treo}) ⇒ truy vết PR→PO đứt`);
  assert.equal(ketLuan([{ ma: "C12-A", ten: "PO giữ quan hệ nguồn về PR", dat: kq.dat }]).dat, true, `Cổng Case 12 HỎNG: ${kq.moCoi}/${tong} PO không truy được về PR`);
  // Chiều thứ hai: mỗi DÒNG PO phải trỏ được về PR của chính nó (không lệch phiếu).
  const dongLechPhieu = motSo(
    "SELECT COUNT(*) FROM purchase_order_items poi JOIN purchase_orders po ON po.id=poi.purchase_order_id " +
      "JOIN material_request_items mri ON mri.id=poi.request_item_id WHERE mri.request_id<>po.request_id"
  );
  assert.equal(dongLechPhieu, 0, `Có ${dongLechPhieu} dòng PO trỏ về dòng PR của PHIẾU KHÁC ⇒ quan hệ nguồn bị lệch (nguy hiểm hơn mồ côi vì trông vẫn 'có nguồn')`);
  // Nhóm PR → PO: dùng hàm thuần của cổng để đếm năng lực «1 PR → N PO» trên dữ liệu thật.
  const nhom = mysql(
    "SELECT mr.id, COUNT(DISTINCT po.id), COUNT(DISTINCT po.supplier_id) FROM material_requests mr " +
      "JOIN purchase_orders po ON po.request_id=mr.id GROUP BY mr.id HAVING COUNT(DISTINCT po.id)>=2"
  ).map(([id, nPo, nNcc]) => ({ id, nPo: Number(nPo), nNcc: Number(nNcc) }));
  assert.ok(nhom.length > 0, "Không PR nào có ≥2 PO trên dữ liệu thật ⇒ năng lực «nhiều PO / 1 PR» chưa có ca thật (phép đo RỖNG)");
  assert.ok(
    nhom.some((row) => row.nNcc >= 2),
    "Không PR nào tách PO sang ≥2 NHÀ CUNG CẤP khác nhau ⇒ chưa chứng minh được quan hệ nguồn giữ nguyên khi đơn bị chia theo NCC"
  );
  const soDuyNhat = motSo(
    "SELECT COUNT(DISTINCT index_name) FROM information_schema.statistics WHERE table_schema=DATABASE() " +
      "AND table_name='purchase_orders' AND non_unique=0 AND column_name='request_id'"
  );
  assert.equal(soDuyNhat, 0, "Lược đồ KHÔNG được có unique trên `purchase_orders.request_id` (nếu có thì 1 PR → N PO bất khả thi)");
  t.diagnostic(
    `PO=${tong} · truy được về PR=${kq.truyDuoc} (${tiLe(kq.truyDuoc, tong)}) · mồ côi=${kq.moCoi} · dòng PO lệch phiếu=${dongLechPhieu} · PR có ≥2 PO=${nhom.length} · PR tách ≥2 NCC=${nhom.filter((r) => r.nNcc >= 2).length}`
  );
});
