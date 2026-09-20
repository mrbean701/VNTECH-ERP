// VNTECH ERP V5.3.0 — PHASE 2 (§25) · NHÓM A: 6 TEST CASE ĐẦU (1→6) CỦA CHUỖI PR → DUYỆT → PO → GRN.
//
// Nguồn yêu cầu: `docs/agent-progress/PHASE2-REQUIREMENTS-USER.md` mục 25 (12 case). Tệp này làm ĐÚNG 6 CA ĐẦU;
// 6 ca còn lại (7→12) CHƯA LÀM ở lượt này — xem `docs/agent-progress/TASK-112.md`.
//
// VÌ SAO CÓ TỆP NÀY: audit `docs/agent-progress/PHASE2-GAP-ANALYSIS.md` §25 chốt bộ test hiện có "chưa đủ phủ 12 case"
// (5 case thiếu assert · 6 case phủ sót · case 9 bất khả thi) ⇒ mỗi ca dưới đây phải có ASSERT THẬT, không đếm số ca suông.
//
// BA TẦNG ĐO CHO MỖI CA (chạy OFFLINE: không cần build, không cần dịch vụ 8787/9000/18081):
//   [1] HÀM THUẦN THẬT — `lib/p2-po-trace.ts` (`deliveryProgress`/`quantityAudit`/`receiptsForPurchaseOrder`/`numeric`)
//       và `lib/p2-approval-flow.mjs` (`resolveApprovalFlow`): chính các hàm mã sản phẩm đang dùng, không mô phỏng lại.
//   [2] CÔNG THỨC THẬT CỦA ENGINE — trích biểu thức quyết định từ `scripts/system-route.mjs` rồi THI HÀNH trên số liệu
//       của đặc tả (100/70 · 60+40 · 3 PO). Nhờ vậy luật KHÔNG bị chép lại vào test: engine đổi luật ⇒ test ĐỎ ngay,
//       mà cũng không thể "xanh giả" vì test chép sai luật so với engine.
//   [3] DỮ LIỆU THẬT (MySQL, CHỈ ĐỌC) — bất biến dạng "số vi phạm = 0", SỐ LIỆU quyết định bằng hàm thuần của
//       `tools/lib/p2-gates.mjs` (`doQuanHe`/`demMrNhieuPo`/`ketLuan`/`tiLe`/`DUNG_SAI_SL`) — TÁI DÙNG, không viết lại
//       truy vấn đo. Không kết nối được MySQL ⇒ `skip` kèm lý do, KHÔNG tính là ĐẠT (chống xanh giả — cùng quy ước
//       với `tests/p2-25-pr-po-grn-cases.test.mjs`).
//
// ⚠️ HAI LỚP KHOÁ CHỈ ĐỌC cho mọi truy vấn: (a) mọi câu đều là `SELECT`; (b) mỗi lần gọi đều kèm
//    `SET SESSION TRANSACTION READ ONLY` (đúng cách 3 cổng `tools/p2-*-audit.mjs` / `p2-reference-integrity.mjs` đang làm)
//    ⇒ CSDL từ chối lệnh ghi. Tệp này KHÔNG INSERT/UPDATE/DELETE/ALTER/DROP/TRUNCATE.
//
// ⚠️ TỆP CỐ Ý KHÔNG nằm trong `package.json` ⇒ `npm run test:regression` giữ nguyên 69 ca.
// Chạy riêng:  node --import tsx --test tests/p2-s25-a-6cases.test.mjs

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { doQuanHe, demMrNhieuPo, ketLuan, tiLe, DUNG_SAI_SL } from "../tools/lib/p2-gates.mjs";

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// NẠP NGUỒN: nguồn mã + 2 thư viện hàm thuần (nạp ĐỘNG để mỗi ca chỉ phụ thuộc đúng thư viện nó dùng)
// ─────────────────────────────────────────────────────────────────────────────────────────────────
const duongDan = (tuongDoi) => new URL("../" + tuongDoi, import.meta.url).href;
const docNguon = (tuongDoi) => readFileSync(new URL("../" + tuongDoi, import.meta.url), "utf8");

/** Nguồn engine THẬT (chỉ đọc) — nơi thi hành cổng duyệt PR, công thức hoàn tất PO/PR. */
const ROUTE = docNguon("scripts/system-route.mjs");

let _trace = null;
let _flow = null;
const trace = async () => (_trace ?? (await import(duongDan("lib/p2-po-trace.ts"))));
const flow = async () => (_flow ?? (await import(duongDan("lib/p2-approval-flow.mjs"))));

/**
 * TRÍCH một biểu thức quyết định của engine rồi biến nó thành hàm thi hành được.
 * `numberValue` của engine = `Number(v ?? 0)` có chặn `NaN` (xem `numberValue` trong `scripts/system-route.mjs`).
 * `neo` = mẫu LOOKAHEAD để chọn đúng lần khai báo khi tên biến không duy nhất trong tệp (vd `nextStatus`
 * còn xuất hiện ở nhật ký thi công / tạm ứng — neo `(?=completed\s*\?)` trỏ đúng nhánh của BCH xác nhận giao hàng).
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
  // `numberValue` được gắn sẵn vào tham số đầu ⇒ hàm trả về có ĐÚNG chữ ký của biểu thức engine.
  return ham.bind(null, numberValue);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// TẦNG 3: MySQL THẬT, CHỈ ĐỌC (khuôn mẫu lấy nguyên từ `tools/p2-trace-audit.mjs` / `tools/p2-split-po-audit.mjs`)
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

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// DỮ LIỆU MẪU: danh mục bước duyệt THẬT (§6: 4 tác nhân duyệt) + 3 bước cung ứng 101/102/103 phải BỊ LOẠI
// ─────────────────────────────────────────────────────────────────────────────────────────────────
const DANH_MUC_BUOC = [
  { id: "ST-2", stage_no: 2, sort_order: 20, stage_kind: "approval", name: "Thư ký Tổng giám đốc", allowed_role_codes: "thuky", approval_mode: "single", sla_hours: 8, active: 1 },
  { id: "ST-3", stage_no: 3, sort_order: 30, stage_kind: "approval", name: "Phòng Dự án", allowed_role_codes: "project", approval_mode: "single", sla_hours: 8, active: 1 },
  { id: "ST-4", stage_no: 4, sort_order: 40, stage_kind: "approval", name: "Phòng Kế hoạch", allowed_role_codes: "kh_nv", approval_mode: "single", sla_hours: 8, active: 1 },
  { id: "ST-5", stage_no: 5, sort_order: 50, stage_kind: "approval", name: "Giám đốc", allowed_role_codes: "director", approval_mode: "single", sla_hours: 8, active: 1 },
  { id: "ST-101", stage_no: 101, sort_order: 101, stage_kind: "supply", name: "Lập PO", allowed_role_codes: "procurement", approval_mode: "single", sla_hours: 24, active: 1 },
  { id: "ST-102", stage_no: 102, sort_order: 102, stage_kind: "supply", name: "Giao nhận", allowed_role_codes: "warehouse", approval_mode: "single", sla_hours: 24, active: 1 },
  { id: "ST-103", stage_no: 103, sort_order: 103, stage_kind: "supply", name: "BCH xác nhận", allowed_role_codes: "commander", approval_mode: "single", sla_hours: 24, active: 1 },
];
const NGUOI_LAP_KY_THUAT = { id: "U-KT", fullName: "Kỹ thuật hiện trường", role: "engineer", roleBase: "engineer" };
const NGUOI_LAP_GIAM_DOC = { id: "U-GD", fullName: "Giám đốc", role: "director", roleBase: "director" };

// ════════════════════════════════════════════════════════════════════════════════════════════════
// §25 CASE 1 — PR chưa approve đủ ⇒ KHÔNG được tạo PO
// ════════════════════════════════════════════════════════════════════════════════════════════════
test("§25 Case 1 — PR chưa duyệt đủ: luồng chưa hoàn tất + engine chặn tạo PO + dữ liệu thật không có PO mồ côi", async (t) => {
  const { resolveApprovalFlow } = await flow();

  // [1] HÀM THUẦN: người lập phiếu KHÔNG trùng vai trò duyệt nào ⇒ luồng CHƯA hoàn tất, đang chờ đúng bước 2.
  const luong = resolveApprovalFlow(DANH_MUC_BUOC, NGUOI_LAP_KY_THUAT);
  assert.equal(luong.complete, false, "Chưa ai duyệt ⇒ luồng KHÔNG được coi là hoàn tất (nếu true thì PR chưa duyệt vẫn lập được PO)");
  assert.equal(luong.currentStageNo, 2, "Bước đang chờ phải là bước 2 (Thư ký Tổng giám đốc)");
  assert.equal(luong.approverStageCount, 4, "Đặc tả §6: 4 tác nhân duyệt ⇒ «duyệt đủ» nghĩa là đủ 4 quyết định");
  assert.deepEqual(
    luong.steps.map((step) => step.stageNo),
    [2, 3, 4, 5],
    "3 bước CUNG ỨNG 101/102/103 KHÔNG được lọt vào chuỗi duyệt hồ sơ (§6/§23) — chúng là bước xử lý, không phải bước duyệt"
  );

  // [2] MÃ NGUỒN: cổng chặn THẬT trong engine (không phải chỉ ở giao diện).
  assert.match(
    ROUTE,
    /if\s*\(\s*!mr\s*\|\|\s*mr\.status\s*!==\s*"approved"\s*\)\s*throw new Error\("Chỉ được tạo PO từ MR đã duyệt đủ các cấp\."\)/,
    "Engine phải chặn `create_po` khi PR chưa ở trạng thái 'approved' (thông điệp nguyên văn: «Chỉ được tạo PO từ MR đã duyệt đủ các cấp.»)"
  );
  assert.match(
    ROUTE,
    /action === "create_po"[\s\S]{0,180}requireRole\(user, \["procurement", "admin"\]\)/,
    "`create_po` phải kiểm quyền TRƯỚC khi kiểm trạng thái duyệt (chặn cả người không có quyền mua hàng)"
  );

  // [3] DỮ LIỆU THẬT (chỉ đọc): không PO nào trỏ tới PR chưa duyệt đủ về mặt TRẠNG THÁI.
  if (!coMySQL) return t.skip(LOI_MYSQL);
  const tong = motSo("SELECT COUNT(*) FROM purchase_orders");
  const rong = motSo("SELECT COUNT(*) FROM purchase_orders WHERE request_id IS NULL OR request_id=''");
  const treo = motSo(
    "SELECT COUNT(*) FROM purchase_orders po LEFT JOIN material_requests mr ON mr.id=po.request_id " +
      "WHERE po.request_id IS NOT NULL AND po.request_id<>'' AND (mr.id IS NULL OR mr.status<>'approved')"
  );
  const kq = doQuanHe({ tong, rong, treo });
  assert.ok(tong > 0, `CSDL không có PO nào ⇒ phép đo RỖNG, không được kết luận ĐẠT (tỉ lệ truy vết ${tiLe(kq.truyDuoc, tong)})`);
  assert.equal(kq.treo, 0, `Có ${kq.treo} PO trỏ tới PR CHƯA duyệt đủ ⇒ cổng Case 1 bị vi phạm trên dữ liệu thật`);
  assert.equal(kq.rong, 0, `Có ${kq.rong} PO mồ côi (\`request_id\` NULL) ⇒ PO không truy được về PR đã duyệt (§17)`);
  assert.equal(
    ketLuan([{ ma: "C1", ten: "PO truy được về PR đã duyệt đủ", dat: kq.dat }]).dat,
    true,
    `Cổng Case 1 HỎNG: ${kq.moCoi}/${tong} PO không truy được về PR đã duyệt đủ`
  );
  t.diagnostic(`PO=${tong} · truy được về PR đã duyệt=${kq.truyDuoc} (${tiLe(kq.truyDuoc, tong)}) · mồ côi=${kq.moCoi}`);
});

// ════════════════════════════════════════════════════════════════════════════════════════════════
// §25 CASE 2 — PR approve đủ ⇒ tạo PO
// ════════════════════════════════════════════════════════════════════════════════════════════════
test("§25 Case 2 — PR duyệt đủ: bàn giao sang bước lập PO + PO giữ liên kết nguồn + dữ liệu thật có PO từ PR đã duyệt", async (t) => {
  const { resolveApprovalFlow } = await flow();

  // [1] HÀM THUẦN: quy tắc «mỗi tác nhân = 1 người duyệt, không tính người tạo đơn» — bước trùng vai trò người lập bị miễn.
  const cuaKyThuat = resolveApprovalFlow(DANH_MUC_BUOC, NGUOI_LAP_KY_THUAT);
  assert.equal(cuaKyThuat.approverStageCount, 4, "Người lập không trùng vai trò duyệt ⇒ phải cần đủ 4 người duyệt");
  const cuaGiamDoc = resolveApprovalFlow(DANH_MUC_BUOC, NGUOI_LAP_GIAM_DOC);
  assert.equal(cuaGiamDoc.currentStageNo, 2, "Vẫn phải chờ từ bước 2 — người tạo KHÔNG được tự duyệt cả phiếu");
  assert.equal(
    cuaGiamDoc.steps.find((step) => step.stageNo === 5)?.autoApproved,
    true,
    "Bước 5 trùng vai trò người lập ⇒ tự miễn (không tự duyệt đơn của mình)"
  );
  assert.equal(cuaGiamDoc.approverStageCount, 3, "Trùng 1 bước ⇒ chỉ còn 3 người duyệt thật");

  // [2] MÃ NGUỒN: duyệt xong bước CUỐI ⇒ PR chuyển 'approved' + 'awaiting_po' (bàn giao sang bước lập PO).
  assert.match(
    ROUTE,
    /UPDATE material_requests SET status='approved',supply_status='awaiting_po',approval_stage=\?/,
    "Duyệt hết bước phải đặt PR = 'approved' + 'awaiting_po' — đây là tiền đề của cổng `create_po` ở Case 1"
  );
  assert.match(
    ROUTE,
    /UPDATE material_request_items SET approved_purchase_qty=CASE WHEN requested_qty-stock_allocation_qty>0/,
    "Duyệt đủ phải chốt `approved_purchase_qty` — hạn mức để lập PO (dòng còn lại sau phân bổ tồn)"
  );
  assert.match(ROUTE, /"po_creation", "pending"/, "Phải mở bước cung ứng `po_creation` để bàn giao sang khâu lập PO");
  assert.match(
    ROUTE,
    /INSERT INTO purchase_orders \(id,po_no,request_id,project_id,contract_id,boq_version_id,supplier_id,receiving_warehouse_id,buyer_user_id,ordered_at,eta,delivery_queued_at,delivery_completed_at,status,total_value,created_at,updated_at\)/,
    "PO BẮT BUỘC ghi `request_id` — nếu thiếu thì mất liên kết nguồn PR (§9/§17)"
  );
  assert.match(ROUTE, /\.bind\(poId,poNo,requestId,/, "`requestId` phải được bind vào cột `request_id` ĐÚNG thứ tự");

  // [3] DỮ LIỆU THẬT: đã từng tạo PO từ PR đã duyệt (đường đi HỢP LỆ chạy thật, không chỉ có trong mã).
  if (!coMySQL) return t.skip(LOI_MYSQL);
  const poTuPrDaDuyet = motSo(
    "SELECT COUNT(*) FROM purchase_orders po JOIN material_requests mr ON mr.id=po.request_id WHERE mr.status='approved'"
  );
  assert.ok(poTuPrDaDuyet > 0, "Chưa có PO nào từ PR đã duyệt ⇒ đường đi HỢP LỆ chưa từng chạy thật (UNKNOWN)");
  const nhomPo = mysql(
    "SELECT mr.id, mr.request_no, COUNT(po.id) FROM material_requests mr " +
      "JOIN purchase_orders po ON po.request_id=mr.id GROUP BY mr.id, mr.request_no"
  ).map(([id, requestNo, n]) => ({ request_id: id, request_no: requestNo, n: Number(n) }));
  assert.ok(nhomPo.length > 0, "Không có cặp PR→PO nào trong CSDL để đo liên kết nguồn");
  // B1 của cổng `tools/p2-split-po-audit.mjs`: năng lực "1 PR → N PO" là BẰNG CHỨNG cần có, KHÔNG phải cổng ⇒ báo cáo, không gate.
  t.diagnostic(`PO từ PR đã duyệt=${poTuPrDaDuyet} · MR có PO=${nhomPo.length} · MR có ≥2 PO (B1)=${demMrNhieuPo(nhomPo)}`);
});

// ════════════════════════════════════════════════════════════════════════════════════════════════
// §25 CASE 3 — PR → 3 PO → tất cả PO completed → PR completed
// ════════════════════════════════════════════════════════════════════════════════════════════════
test("§25 Case 3 — 1 PR = 3 PO đều nhận đủ ⇒ cả 3 PO hoàn tất và PR hoàn tất", async (t) => {
  const { deliveryProgress, numeric } = await trace();

  // [1] HÀM THUẦN: 3 PO (40+30+30 = 100, khớp đúng số PR đã duyệt) — mỗi PO đều "complete".
  const baPo = [
    { orderedQty: 40, receivedQty: 40, closedQty: 0 },
    { orderedQty: 30, receivedQty: 30, closedQty: 0 },
    { orderedQty: 30, receivedQty: 30, closedQty: 0 },
  ];
  const tienDo = baPo.map((po) => deliveryProgress(po));
  assert.deepEqual(tienDo.map((row) => row.complete), [true, true, true], "Cả 3 PO phải HOÀN TẤT khi received ≥ ordered");
  assert.deepEqual(tienDo.map((row) => row.percent), [100, 100, 100], "Tiến độ giao mỗi PO phải là 100%");
  assert.deepEqual(tienDo.map((row) => row.audit.remaining), [0, 0, 0], "Không PO nào còn thiếu số lượng");
  assert.equal(
    tienDo.reduce((sum, row) => sum + row.audit.ordered, 0),
    100,
    "Tổng đặt của 3 PO phải bằng 100 — bằng đúng số lượng dòng PR đã duyệt (không thừa, không thiếu)"
  );

  // [2] CÔNG THỨC THẬT CỦA ENGINE: 100/100 ⇒ PR hoàn tất; 70/100 ⇒ KHÔNG (khẳng định hai chiều, chống assert một chiều).
  const prHoanTat = congThucEngine("requestCompleted", ["requestTotals", "currentAccepted"]);
  const daNhan = baPo.reduce((sum, po) => sum + numeric(po.receivedQty), 0);
  assert.equal(daNhan, 100, "Cộng dồn số nhận của 3 PO phải bằng 100");
  assert.equal(
    prHoanTat({ receivedQty: daNhan, closedQty: 0, approvedQty: 100 }, 0),
    true,
    "Công thức THẬT của engine phải kết luận PR hoàn tất khi 3 PO nhận đủ 100/100"
  );
  assert.equal(
    prHoanTat({ receivedQty: 70, closedQty: 0, approvedQty: 100 }, 0),
    false,
    "…và KHÔNG hoàn tất khi mới 70/100 (nếu true thì PR tự hoàn tất sớm — sai đặc tả §16)"
  );
  assert.match(
    ROUTE,
    /const requestCompleted = numberValue\(requestTotals\?\.receivedQty\)[\s\S]{0,120}numberValue\(requestTotals\?\.approvedQty\) - 1e-9;/,
    "Phải còn công thức `requestCompleted` đọc tổng từ dòng PR (`material_request_items`)"
  );
  assert.match(
    ROUTE,
    /const nextRequestStatus = requestCompleted \? \(requestHasExceptions \? "received_full_docs_pending" : "completed"\) : "partial_delivery";/,
    "PR nhận đủ ⇒ `completed`; thiếu ⇒ `partial_delivery` (không có nhánh nào tự nhảy sang `completed`)"
  );
  assert.match(
    ROUTE,
    /line_status=CASE WHEN received_qty\+\?\+closed_qty>=approved_purchase_qty THEN 'received'/,
    "Từng DÒNG PR cũng phải tự chốt `line_status='received'` khi nhận đủ (không chỉ đầu phiếu)"
  );

  // [3] DỮ LIỆU THẬT: bất biến "PR hoàn tất ⇒ mọi PO con đã xong".
  if (!coMySQL) return t.skip(LOI_MYSQL);
  const capMrPo = motSo("SELECT COUNT(*) FROM purchase_orders po JOIN material_requests mr ON mr.id=po.request_id");
  assert.ok(capMrPo > 0, "Không có cặp PR→PO nào ⇒ phép đo RỖNG, không được kết luận ĐẠT");
  const viPham = motSo(
    "SELECT COUNT(*) FROM material_requests mr WHERE mr.supply_status IN ('completed','completed_with_shortage') " +
      "AND EXISTS (SELECT 1 FROM purchase_orders po WHERE po.request_id=mr.id " +
      "AND po.status NOT IN ('completed','completed_with_exceptions'))"
  );
  assert.equal(viPham, 0, `Có ${viPham} PR mang trạng thái hoàn tất trong khi vẫn còn PO con CHƯA xong`);
  t.diagnostic(`Cặp PR→PO kiểm tra=${capMrPo} · vi phạm bất biến hoàn tất=${viPham}`);
});

// ════════════════════════════════════════════════════════════════════════════════════════════════
// §25 CASE 4 — PR → 3 PO → 2 completed + 1 incomplete → PR incomplete
// ════════════════════════════════════════════════════════════════════════════════════════════════
test("§25 Case 4 — 2 PO xong + 1 PO dở ⇒ PR CHƯA hoàn tất (không tự nhảy 'completed')", async (t) => {
  const { deliveryProgress, numeric } = await trace();

  // [1] HÀM THUẦN: 40+30 nhận đủ, PO thứ ba 0/30.
  const baPo = [
    { orderedQty: 40, receivedQty: 40, closedQty: 0 },
    { orderedQty: 30, receivedQty: 30, closedQty: 0 },
    { orderedQty: 30, receivedQty: 0, closedQty: 0 },
  ];
  const tienDo = baPo.map((po) => deliveryProgress(po));
  assert.deepEqual(tienDo.map((row) => row.complete), [true, true, false], "2 PO đầu hoàn tất, PO thứ ba CHƯA hoàn tất");
  assert.equal(tienDo[2].audit.remaining, 30, "PO dở phải còn thiếu đúng 30");
  assert.equal(tienDo[2].percent, 0, "PO chưa nhận chuyến nào ⇒ tiến độ 0%, không được làm tròn thành 100%");
  assert.equal(tienDo.filter((row) => row.complete).length, 2, "Đúng 2/3 PO hoàn tất");

  // [2] CÔNG THỨC THẬT CỦA ENGINE: mới nhận 70/100 ⇒ PR KHÔNG hoàn tất, và trạng thái đích phải là 'partial_delivery'.
  const prHoanTat = congThucEngine("requestCompleted", ["requestTotals", "currentAccepted"]);
  const daNhan = baPo.reduce((sum, po) => sum + numeric(po.receivedQty), 0);
  assert.equal(daNhan, 70, "Cộng dồn số nhận của 2 PO xong = 70");
  assert.equal(
    prHoanTat({ receivedQty: daNhan, closedQty: 0, approvedQty: 100 }, 0),
    false,
    "70/100 ⇒ PR KHÔNG hoàn tất dù 2/3 PO đã xong (nếu true thì PR hoàn tất khống — vi phạm Case 4)"
  );
  assert.equal(prHoanTat({ receivedQty: 70, closedQty: 30, approvedQty: 100 }, 0), true, "Chỉ khi phần thiếu được ĐÓNG (`closed_qty`) mới được coi là xong");
  const trangThaiPr = congThucEngine("nextRequestStatus", ["requestCompleted", "requestHasExceptions"]);
  assert.equal(trangThaiPr(false, false), "partial_delivery", "PR chưa đủ ⇒ phải ở `partial_delivery`, KHÔNG được `completed`");
  assert.equal(trangThaiPr(false, true), "partial_delivery", "Có ngoại lệ tài liệu cũng KHÔNG được biến PR thành hoàn tất");
  assert.equal(trangThaiPr(true, false), "completed", "Chỉ khi đủ số lượng mới được `completed`");

  // [3] DỮ LIỆU THẬT: chọn các PR đã tách ≥2 PO mà còn thiếu số lượng (dùng truy vấn con để KHÔNG nhân dòng khi JOIN).
  if (!coMySQL) return t.skip(LOI_MYSQL);
  const prNhieuPo = mysql(
    "SELECT mr.id, mr.supply_status, " +
      "(SELECT COUNT(*) FROM purchase_orders po WHERE po.request_id=mr.id) AS n_po, " +
      "(SELECT COALESCE(SUM(i.received_qty),0)+COALESCE(SUM(i.closed_qty),0) FROM material_request_items i WHERE i.request_id=mr.id) AS da_nhan, " +
      "(SELECT COALESCE(SUM(i.approved_purchase_qty),0) FROM material_request_items i WHERE i.request_id=mr.id) AS da_duyet " +
      "FROM material_requests mr WHERE (SELECT COUNT(*) FROM purchase_orders po WHERE po.request_id=mr.id) >= 2"
  ).map(([id, supplyStatus, nPo, daNhan, daDuyet]) => ({
    id,
    supplyStatus,
    nPo: Number(nPo),
    daNhan: Number(daNhan),
    daDuyet: Number(daDuyet),
  }));
  const conDo = prNhieuPo.filter((row) => row.daNhan < row.daDuyet - DUNG_SAI_SL);
  assert.ok(conDo.length > 0, "Không có PR nào vừa tách ≥2 PO vừa còn thiếu số lượng ⇒ phép đo RỖNG (năng lực tách PO chưa có ca thật)");
  const saiTrangThai = conDo.filter((row) => ["completed", "completed_with_shortage"].includes(row.supplyStatus));
  assert.equal(
    saiTrangThai.length,
    0,
    `Có ${saiTrangThai.length} PR còn thiếu hàng nhưng đã mang trạng thái hoàn tất: ${saiTrangThai.map((row) => row.id).join(", ")}`
  );
  t.diagnostic(
    `PR có ≥2 PO=${prNhieuPo.length} · trong đó còn dở=${conDo.length} · ví dụ: ${conDo
      .slice(0, 3)
      .map((row) => `${row.id}[${row.supplyStatus} ${row.daNhan}/${row.daDuyet}]`)
      .join(" ")}`
  );
});

// ════════════════════════════════════════════════════════════════════════════════════════════════
// §25 CASE 5 — PO ordered = 100, GRN received = 70 ⇒ PO incomplete
// ════════════════════════════════════════════════════════════════════════════════════════════════
test("§25 Case 5 — PO đặt 100 · nhận 70 ⇒ PO CHƯA hoàn tất (còn thiếu 30)", async (t) => {
  const { deliveryProgress, quantityAudit } = await trace();

  // [1] HÀM THUẦN: đúng số liệu đặc tả.
  const po = { orderedQty: 100, receivedQty: 70, closedQty: 0 };
  const tienDo = deliveryProgress(po);
  assert.equal(tienDo.complete, false, "70 < 100 ⇒ PO KHÔNG được coi là hoàn tất");
  assert.equal(tienDo.audit.remaining, 30, "Phải còn thiếu ĐÚNG 30");
  assert.equal(tienDo.percent, 70, "Tiến độ giao phải là 70%");
  assert.equal(tienDo.audit.source, "po_header", "Đối soát phải lấy tổng hợp đầu PO khi payload có `orderedQty`/`receivedQty`");
  assert.equal(quantityAudit(po).received, 70, "`received` phải đọc đúng 70, không suy diễn thêm");
  // Biên: thiếu 0.00005 vẫn là THIẾU (dung sai DECIMAL(18,4) là 0.0001) — chống "làm tròn thành đủ".
  const satNguong = deliveryProgress({ orderedQty: 100, receivedQty: 100 - DUNG_SAI_SL / 2, closedQty: 0 });
  assert.equal(satNguong.complete, false, `Thiếu ${DUNG_SAI_SL / 2} vẫn phải coi là CHƯA đủ`);

  // [2] CÔNG THỨC THẬT CỦA ENGINE: chuyến 70 trên PO đặt 100 ⇒ KHÔNG `fullyDelivered`, đích phải là `partial_delivery`.
  const fullyDelivered = congThucEngine("fullyDelivered", ["poTotals", "currentAccepted"]);
  const poTotals = { orderedQty: 100, receivedQty: 0, closedQty: 0 };
  assert.equal(fullyDelivered(poTotals, 70), false, "Công thức THẬT: 0 + 70 = 70 < 100 ⇒ PO KHÔNG hoàn tất");
  assert.equal(fullyDelivered(poTotals, 100), true, "…và chỉ hoàn tất khi tổng nhận = 100");
  assert.equal(fullyDelivered({ orderedQty: 100, receivedQty: 70, closedQty: 0 }, 0), false, "Nhận tích lũy 70 rồi không nhận thêm ⇒ vẫn chưa đủ");
  const trangThaiPo = congThucEngine("nextStatus", ["completed", "fullyDelivered", "hasAccepted", "hasExceptions"], String.raw`(?=completed\s*\?)`);
  assert.equal(trangThaiPo(false, false, true, false), "partial_delivery", "Nhận một phần ⇒ PO phải ở `partial_delivery`, KHÔNG được `completed`");
  assert.equal(trangThaiPo(false, false, false, false), "waiting_delivery", "Chưa nhận gì ⇒ `waiting_delivery`");
  assert.equal(trangThaiPo(true, true, true, false), "completed", "Đủ số + mọi chuyến đã xác nhận ⇒ `completed`");
  assert.match(ROUTE, /const completed = fullyDelivered && allConfirmed;/, "PO chỉ hoàn tất khi ĐỦ SỐ **VÀ** mọi chuyến giao đã được BCH xác nhận");

  // [3] DỮ LIỆU THẬT: không PO nào mang trạng thái hoàn tất khi tổng nhận còn thiếu.
  if (!coMySQL) return t.skip(LOI_MYSQL);
  const thieu = motSo(
    "SELECT COUNT(*) FROM (SELECT po.id FROM purchase_orders po JOIN purchase_order_items poi ON poi.purchase_order_id=po.id " +
      "GROUP BY po.id, po.status " +
      "HAVING COALESCE(SUM(poi.received_qty),0)+COALESCE(SUM(poi.closed_qty),0) < COALESCE(SUM(poi.ordered_qty),0)-1e-9 " +
      "AND po.status IN ('completed','completed_with_exceptions')) x"
  );
  const dangDo = motSo(
    "SELECT COUNT(*) FROM (SELECT po.id FROM purchase_orders po JOIN purchase_order_items poi ON poi.purchase_order_id=po.id " +
      "GROUP BY po.id, po.status " +
      "HAVING COALESCE(SUM(poi.received_qty),0)+COALESCE(SUM(poi.closed_qty),0) < COALESCE(SUM(poi.ordered_qty),0)-1e-9 " +
      "AND po.status NOT IN ('completed','completed_with_exceptions')) x"
  );
  assert.equal(thieu, 0, `Có ${thieu} PO mang trạng thái HOÀN TẤT nhưng tổng nhận+đóng còn THIẾU so với số đặt (vi phạm Case 5)`);
  assert.ok(dangDo > 0, "Không có PO nào đang dở trên dữ liệu thật ⇒ phép đo RỖNG, không được kết luận ĐẠT");
  t.diagnostic(`PO hoàn tất-khi-thiếu=${thieu} · PO đang dở (đối chứng)=${dangDo}`);
});

// ════════════════════════════════════════════════════════════════════════════════════════════════
// §25 CASE 6 — PO ordered = 100 · GRN1 = 60 + GRN2 = 40 ⇒ PO completed
// ════════════════════════════════════════════════════════════════════════════════════════════════
test("§25 Case 6 — PO đặt 100 = chuyến 60 + chuyến 40 ⇒ PO hoàn tất (cộng dồn nhiều chuyến, không nhân đôi)", async (t) => {
  const { deliveryProgress, numeric, receiptsForPurchaseOrder } = await trace();

  // [1] HÀM THUẦN: gom ĐÚNG 2 chuyến giao của 1 PO rồi cộng dồn — đây cũng là bất biến của Case 11 (nhiều GRN/1 PO).
  const duLieu = {
    receipts: [
      { id: "GR1", receiptNo: "GRN-1", purchaseOrderId: "PO-100", acceptedQty: 60, itemCount: 1 },
      { id: "GR2", receiptNo: "GRN-2", purchaseOrderId: "PO-100", acceptedQty: 40, itemCount: 1 },
      { id: "GR9", receiptNo: "GRN-9", purchaseOrderId: "PO-999", acceptedQty: 15, itemCount: 1 },
    ],
  };
  const chuyen = receiptsForPurchaseOrder(duLieu, "PO-100");
  assert.equal(chuyen.length, 2, "Phải gom ĐÚNG 2 chuyến của PO-100 (không lấy chuyến của PO khác)");
  assert.deepEqual(chuyen.map((row) => row.id), ["GR1", "GR2"], "Đúng 2 chuyến GR1 + GR2, giữ nguyên thứ tự dữ liệu");
  const congDon = chuyen.reduce((sum, row) => sum + numeric(row.acceptedQty), 0);
  assert.equal(congDon, 100, "Cộng dồn 60 + 40 = 100 — không nhân đôi, không mất chuyến");
  const tienDo = deliveryProgress({ orderedQty: 100, receivedQty: congDon, closedQty: 0 });
  assert.equal(tienDo.complete, true, "Đủ 100/100 ⇒ PO hoàn tất");
  assert.equal(tienDo.audit.remaining, 0, "Không còn thiếu số lượng nào");
  assert.equal(tienDo.percent, 100, "Tiến độ giao phải là 100%");

  // [2] CÔNG THỨC THẬT CỦA ENGINE: cộng dồn theo TỪNG lần xác nhận (`received_qty = received_qty + accepted`).
  const fullyDelivered = congThucEngine("fullyDelivered", ["poTotals", "currentAccepted"]);
  assert.equal(
    fullyDelivered({ orderedQty: 100, receivedQty: 60, closedQty: 0 }, 40),
    true,
    "Sau chuyến 60, nhận tiếp chuyến 40 ⇒ engine phải kết luận HOÀN TẤT (đây là phép cộng dồn nhiều GRN)"
  );
  assert.equal(fullyDelivered({ orderedQty: 100, receivedQty: 60, closedQty: 0 }, 35), false, "Chỉ 60+35=95 ⇒ vẫn CHƯA hoàn tất");
  assert.equal(
    fullyDelivered({ orderedQty: 100, receivedQty: 60, closedQty: 0 }, 40 - DUNG_SAI_SL * 10),
    false,
    `Thiếu ${DUNG_SAI_SL * 10} vẫn CHƯA đủ (dung sai engine chỉ 1e-9) — chống «nhận hụt mà vẫn xanh»`
  );
  const trangThaiPo = congThucEngine("nextStatus", ["completed", "fullyDelivered", "hasAccepted", "hasExceptions"], String.raw`(?=completed\s*\?)`);
  assert.equal(trangThaiPo(true, true, true, false), "completed", "Đủ số + đủ chứng từ ⇒ `completed`");
  assert.equal(trangThaiPo(true, true, true, true), "completed_with_exceptions", "Đủ số nhưng thiếu chứng từ ⇒ `completed_with_exceptions` (không được im lặng cho qua)");
  assert.match(
    ROUTE,
    /SET received_qty=received_qty\+\?,status=CASE WHEN received_qty\+\?\+closed_qty>=ordered_qty THEN 'received' ELSE 'partial_received' END/,
    "Mỗi lần BCH xác nhận phải CỘNG DỒN `received_qty` theo dòng PO — nhờ đó nhiều GRN cộng lại thành đủ"
  );

  // [3] DỮ LIỆU THẬT: PO có ≥2 chuyến giao VÀ đã nhận đủ ⇒ phải mang trạng thái hoàn tất.
  if (!coMySQL) return t.skip(LOI_MYSQL);
  const poNhieuChuyen = motSo(
    "SELECT COUNT(*) FROM (SELECT purchase_order_id FROM goods_receipts GROUP BY purchase_order_id HAVING COUNT(*)>=2) g"
  );
  assert.ok(poNhieuChuyen > 0, "Không PO nào có ≥2 chuyến giao trên dữ liệu thật ⇒ phép đo RỖNG (năng lực cộng dồn chưa có ca thật)");
  const sai = motSo(
    "SELECT COUNT(*) FROM (SELECT po.id FROM purchase_orders po JOIN purchase_order_items poi ON poi.purchase_order_id=po.id " +
      "WHERE (SELECT COUNT(*) FROM goods_receipts g WHERE g.purchase_order_id=po.id)>=2 " +
      "GROUP BY po.id, po.status " +
      "HAVING COALESCE(SUM(poi.received_qty),0)+COALESCE(SUM(poi.closed_qty),0) >= COALESCE(SUM(poi.ordered_qty),0)-1e-9 " +
      "AND po.status NOT IN ('completed','completed_with_exceptions')) x"
  );
  assert.equal(sai, 0, `Có ${sai} PO nhiều chuyến giao đã nhận ĐỦ số nhưng KHÔNG mang trạng thái hoàn tất`);
  t.diagnostic(`PO có ≥2 chuyến giao=${poNhieuChuyen} · nhận đủ nhưng chưa hoàn tất=${sai}`);
});
