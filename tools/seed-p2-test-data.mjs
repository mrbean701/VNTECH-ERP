#!/usr/bin/env node
// VNTECH ERP V5.3.0 — PHASE 2 · SEED DỮ LIỆU TEST ĐỂ 3 CỔNG ĐO CHUYỂN XANH   (⚠️ CHỈ INSERT)
//
// VÌ SAO CÓ TỆP NÀY: 3 cổng đo của Phase 2 đang ĐỎ vì dữ liệu thiếu, không phải vì mã sai:
//   · tools/p2-trace-audit.mjs        → PO mồ côi (request_id NULL) + 10/16 GRN RỖNG DÒNG
//   · tools/p2-split-po-audit.mjs     → 0 MR có ≥ 2 PO (đường đi tách PO chưa từng chạy thật)
//   · tools/p2-reference-integrity.mjs→ 335 dòng mồ côi / 10 cặp quan hệ
// Người dùng chỉ đạo 21/09/2026: CSDL chỉ có dữ liệu test, "có thể insert tuỳ ý miễn là test thành công",
// nhưng TUYỆT ĐỐI KHÔNG xoá bảng/trường nào.
//
// ⛔ RÀNG BUỘC CỨNG — TỆP NÀY CHỈ `INSERT`:
//    · Không DELETE · Không UPDATE · Không DROP · Không TRUNCATE · Không ALTER.
//    · Mọi câu lệnh sinh ra đều bị lớp `kiemTraChiInsert()` chặn nếu KHÔNG bắt đầu bằng INSERT
//      hoặc chứa từ khoá ghi khác ⇒ sai thì DỪNG trước khi chạm CSDL, không "vá" dữ liệu cũ.
//    · Hệ quả đã biết: cột của dòng ĐÃ TỒN TẠI mà đang NULL thì tệp này KHÔNG sửa được.
//      Cụ thể: PO `PO-PRJ-DEMO-01-2026-0011` có `request_id = NULL` ⇒ chặng A1 của cổng trace giữ nguyên
//      1 mồ côi cho tới khi có người cho phép đúng 1 câu UPDATE (in ở mục [7]).
//
// ✅ TÍNH IDEMPOTENT (chạy lại nhiều lần KHÔNG nhân đôi):
//    · Phần "dựng lại bản ghi bị thiếu" được DẪN XUẤT TỪ DỮ LIỆU: chạy lần 2 không còn tham chiếu treo
//      ⇒ không còn gì để chèn. Mọi câu lệnh vẫn thêm `INSERT IGNORE` như lớp bảo hiểm thứ hai.
//    · Phần "ca tách PO" dùng ID CỐ ĐỊNH + INSERT IGNORE + po_no/request_no ở dải RIÊNG (9xxx) nên
//      không bao giờ đụng bộ đếm `document_sequences` của ứng dụng (hiện ở 10/124/10).
//
// Cách chạy:
//   node tools/seed-p2-test-data.mjs              # chèn thật
//   node tools/seed-p2-test-data.mjs --dry-run    # chỉ in kế hoạch, KHÔNG chạm CSDL
// Biến môi trường: MYSQL_BIN (đường dẫn mysql.exe), MYSQL_DB (mặc định vntech_erp).
//
// LUẬT NGHIỆP VỤ ĐÃ ĐỌC TỪ MÃ (không đoán) — scripts/system-route.mjs:
//   · create_po (L1423): chỉ tạo PO từ MR có `status='approved'`; kho nhận phải THUỘC đúng dự án;
//     `SUM(poi.ordered_qty) ≤ material_request_items.approved_purchase_qty` (dung sai 1e-9);
//     sau khi tạo, `material_request_items.ordered_qty` được cộng dồn bằng đúng số vừa đặt.
//   · create_po (L1439): PO được GOM THEO `supplierId` ⇒ **1 PO = 1 nhà cung cấp**; muốn 1 PR ra
//     ≥2 PO thì các dòng phải thuộc ≥2 NCC khác nhau. Đây là lý do ca tách PO dưới đây cần NCC thứ 2.
//   · receive_goods (L1500): `purchase_orders JOIN material_requests` là INNER JOIN ⇒ PO có
//     `request_id` NULL thì KHÔNG nhận hàng được (đúng ca PO mồ côi ở trên).
//   · Lược đồ THẬT: cột dòng phiếu nhập là `goods_receipt_items.receipt_id` (KHÔNG phải goods_receipt_id).
//
// RÀNG BUỘC KHI DỰNG LẠI (để KHÔNG tạo tham chiếu treo mới & không làm đỏ cổng split):
//   · Mọi dòng mới đều trỏ cha vào bản ghi CÓ THẬT (hoặc bản ghi vừa dựng trong cùng lượt).
//   · `material_request_items.ordered_qty` = ĐÚNG tổng `purchase_order_items.ordered_qty` trỏ vào nó
//     (cổng split C2) và luôn ≤ `approved_purchase_qty` (cổng split C1).
//   · Với mỗi PR có PO: #dòng PR == #dòng PO. Cổng split mục [3](a) join MR×PO×POI×MRI nên lệch số
//     dòng sẽ in "LỆCH" (không phải cổng, nhưng phải sạch) ⇒ có bước "bù cân bằng" bên dưới.

import { execFileSync } from "node:child_process";
import { doQuanHe, tiLe, dem } from "./lib/p2-gates.mjs";

const MYSQL = process.env.MYSQL_BIN || "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
const DB = process.env.MYSQL_DB || "vntech_erp";
const DRY = process.argv.includes("--dry-run");

/** Dự án mẫu: PRJ-DEMO-01. Toàn bộ dữ liệu Phase 2 hiện có đều thuộc dự án này. */
const PROJECT = "PRJ_fdbfab20-bf1f-4ad5-8159-7dcc582140c3";
/** Mốc thời gian seed CỐ ĐỊNH ⇒ chạy lại cho ra đúng dữ liệu cũ (không phụ thuộc giờ chạy). */
const TS = "2026-09-21 08:00:00.000";
/** Số lượng cho các dòng MÔ PHỎNG (không có bằng chứng số lượng trong dữ liệu gốc). */
const SEED_QTY = 20;
/** Tiền tố ID cho các bản ghi do tệp này tự đặt mã (phân biệt rõ với dữ liệu gốc). */
const P = "P2SEED";

// ─────────────────────────────────────────────────────────────────────────────
// TẦNG GỌI MYSQL
// ─────────────────────────────────────────────────────────────────────────────
function mysql(args) {
  try {
    return execFileSync(MYSQL, ["--default-character-set=utf8mb4", "-uvntech", "-pvntech", DB, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch (e) {
    const err = (e && e.stderr ? String(e.stderr) : "") + (e && e.stdout ? String(e.stdout) : "");
    throw new Error(`MySQL lỗi: ${e && e.message ? e.message : e}\n${err.trim()}`);
  }
}
/** Chạy SELECT ở dạng tab thô, trả về mảng dòng (mảng giá trị). */
function q(cau) {
  const out = mysql(["-N", "-B", "-e", cau]);
  return out
    .split(/\r?\n/)
    .filter((l) => l.trim() !== "")
    .map((l) => l.split("\t"));
}
/** 1 dòng 1 cột (không có ⇒ null). */
function one(cau) {
  const r = q(cau);
  return r.length ? r[0][0] : null;
}
/** Một giá trị SQL đã escape. */
const S = (v) =>
  v === null || v === undefined ? "NULL" : v === "" ? "''" : `'${String(v).replace(/\\/g, "\\\\").replace(/'/g, "''")}'`;
const N = (v) => String(Number(v || 0));
const inList = (a) => (a.length ? a.map(S).join(",") : "NULL");

// ─────────────────────────────────────────────────────────────────────────────
// LỚP CHẶN: CHỈ INSERT
// ─────────────────────────────────────────────────────────────────────────────
const TU_KHOA_CAM = /(?:^|[^\w])(DELETE|UPDATE|DROP|TRUNCATE|ALTER|CREATE|REPLACE|GRANT|REVOKE|RENAME|CALL)(?:[^\w]|$)/i;
/** Ném lỗi nếu bất kỳ câu nào không phải INSERT (chốt chặn cuối trước khi chạm CSDL). */
function kiemTraChiInsert(danhSach) {
  for (const st of danhSach) {
    if (!/^\s*INSERT\s+/i.test(st)) throw new Error(`CHẶN: câu lệnh không phải INSERT ⇒ ${st.slice(0, 90)}`);
    const m = st.match(TU_KHOA_CAM);
    if (m) throw new Error(`CHẶN: câu lệnh chứa từ khoá "${m[1]}" ⇒ ${st.slice(0, 90)}`);
  }
}
/** Chạy các câu INSERT theo lô (giới hạn độ dài dòng lệnh trên Windows). */
function chayInserts(danhSach) {
  kiemTraChiInsert(danhSach);
  if (DRY) return 0;
  let lo = [];
  let dai = 0;
  let soLo = 0;
  const xa = () => {
    if (!lo.length) return;
    mysql(["-e", lo.join("\n")]);
    soLo++;
    lo = [];
    dai = 0;
  };
  for (const st of danhSach) {
    if (dai + st.length > 16000) xa();
    lo.push(st);
    dai += st.length + 1;
  }
  xa();
  return soLo;
}
/** Sinh 1 câu INSERT IGNORE nhiều dòng. */
function insertNhieu(bang, cot, dong) {
  if (!dong.length) return null;
  return (
    `INSERT IGNORE INTO ${bang} (${cot.join(",")}) VALUES\n  ` +
    dong.map((r) => `(${r.map((v) => (typeof v === "number" ? N(v) : v)).join(",")})`).join(",\n  ") +
    ";"
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MÔ HÌNH CÁC CẶP QUAN HỆ PHASE 2 (giống hệt danh sách cổng integrity quét)
// ─────────────────────────────────────────────────────────────────────────────
const CAP_QUAN_HE = [
  { bang: "purchase_orders", cot: "request_id", dich: "material_requests", cotDich: "id", choNull: true, nhan: "PO → PR" },
  { bang: "purchase_order_items", cot: "request_item_id", dich: "material_request_items", cotDich: "id", choNull: false, nhan: "POI → dòng PR" },
  { bang: "purchase_order_items", cot: "purchase_order_id", dich: "purchase_orders", cotDich: "id", choNull: false, nhan: "POI → PO" },
  { bang: "goods_receipts", cot: "purchase_order_id", dich: "purchase_orders", cotDich: "id", choNull: false, nhan: "GRN → PO" },
  { bang: "goods_receipt_items", cot: "receipt_id", dich: "goods_receipts", cotDich: "id", choNull: false, nhan: "GRI → GRN" },
  { bang: "goods_receipt_items", cot: "purchase_order_item_id", dich: "purchase_order_items", cotDich: "id", choNull: false, nhan: "GRI → POI" },
  { bang: "material_request_items", cot: "request_id", dich: "material_requests", cotDich: "id", choNull: false, nhan: "dòng PR → PR" },
  { bang: "procurement_allocations", cot: "request_item_id", dich: "material_request_items", cotDich: "id", choNull: true, nhan: "PA → dòng PR" },
  { bang: "procurement_allocations", cot: "purchase_order_item_id", dich: "purchase_order_items", cotDich: "id", choNull: true, nhan: "PA → POI" },
  { bang: "procurement_allocations", cot: "receipt_item_id", dich: "goods_receipt_items", cotDich: "id", choNull: true, nhan: "PA → GRI" },
  { bang: "approvals", cot: "request_id", dich: "material_requests", cotDich: "id", choNull: true, nhan: "duyệt → PR" },
  { bang: "supply_workflow_steps", cot: "request_id", dich: "material_requests", cotDich: "id", choNull: true, nhan: "bước workflow → PR" },
  { bang: "supply_workflow_steps", cot: "purchase_order_id", dich: "purchase_orders", cotDich: "id", choNull: true, nhan: "bước workflow → PO" },
  { bang: "supply_workflow_steps", cot: "receipt_id", dich: "goods_receipts", cotDich: "id", choNull: true, nhan: "bước workflow → GRN" },
  { bang: "stock_issue_items", cot: "request_item_id", dich: "material_request_items", cotDich: "id", choNull: true, nhan: "dòng xuất kho → dòng PR" },
];

/** Đếm 1 cặp quan hệ: tổng / NULL / trỏ-hư. Giữ ĐÚNG ngữ nghĩa cổng đang dùng
 *  (`rong = choNull ? <đếm NULL> : 0`, `moCoi = rong + treo`) để số TRƯỚC của tệp này
 *  khớp số của cổng TRƯỚC khi cổng được sửa (xem docs/agent-progress/TASK-108.md). */
function doCap(c) {
  const tong = Number(one(`SELECT COUNT(*) FROM ${c.bang}`));
  const rongNull = Number(one(`SELECT COUNT(*) FROM ${c.bang} WHERE ${c.cot} IS NULL OR ${c.cot}=''`));
  const treo = Number(
    one(
      `SELECT COUNT(*) FROM ${c.bang} t LEFT JOIN ${c.dich} d ON d.${c.cotDich}=t.${c.cot} ` +
        `WHERE t.${c.cot} IS NOT NULL AND t.${c.cot}<>'' AND d.${c.cotDich} IS NULL`
    )
  );
  const rong = c.choNull ? rongNull : 0;
  return { ...doQuanHe({ tong, rong, treo }), rongNull, nhan: c.nhan };
}
const quetTatCa = () => CAP_QUAN_HE.map((c) => ({ ...doCap(c), cap: `${c.bang}.${c.cot} → ${c.dich}.${c.cotDich}` }));
const tongMoCoi = (ds) => ds.reduce((s, r) => s + r.moCoi, 0);
const tongTreo = (ds) => ds.reduce((s, r) => s + r.treo, 0);

/** Số MR đang có ≥2 PO (chỉ số năng lực của cổng split). */
const demMrNhieuPo = () =>
  Number(
    one(
      "SELECT COUNT(*) FROM (SELECT request_id FROM purchase_orders WHERE request_id IS NOT NULL AND request_id<>'' GROUP BY request_id HAVING COUNT(*)>=2) t"
    )
  );
/** PO mồ côi (NULL hoặc trỏ hư) — chặng A1 của cổng trace. */
const demPoMoCoi = () =>
  Number(
    one(
      "SELECT COUNT(*) FROM purchase_orders po LEFT JOIN material_requests mr ON mr.id=po.request_id " +
        "WHERE po.request_id IS NULL OR po.request_id='' OR mr.id IS NULL"
    )
  );
const thongKeGrn = () => ({
  tong: Number(one("SELECT COUNT(*) FROM goods_receipts")),
  coDong: Number(
    one("SELECT COUNT(*) FROM goods_receipts g WHERE EXISTS (SELECT 1 FROM goods_receipt_items i WHERE i.receipt_id=g.id)")
  ),
});

/** Các bảng tệp này ghi vào — dùng để ĐO số dòng THỰC TẾ đã chèn (bằng chứng idempotent). */
const BANG_GHI = [
  "suppliers", "material_requests", "material_request_items", "purchase_orders",
  "purchase_order_items", "goods_receipts", "goods_receipt_items",
];
const demDongCacBang = () => new Map(BANG_GHI.map((b) => [b, Number(one(`SELECT COUNT(*) FROM ${b}`))]));

// ─────────────────────────────────────────────────────────────────────────────
// PHÁT HIỆN THAM CHIẾU TREO (nguồn dữ liệu để dựng lại bản ghi thiếu)
// ─────────────────────────────────────────────────────────────────────────────
const truyVanTreo = () => ({
  mr: q(
    `SELECT DISTINCT t.v FROM (
       SELECT request_id AS v FROM supply_workflow_steps WHERE request_id IS NOT NULL AND request_id<>'' AND NOT EXISTS (SELECT 1 FROM material_requests x WHERE x.id=supply_workflow_steps.request_id)
       UNION SELECT request_id FROM approvals WHERE request_id IS NOT NULL AND request_id<>'' AND NOT EXISTS (SELECT 1 FROM material_requests x WHERE x.id=approvals.request_id)
       UNION SELECT request_id FROM material_request_items WHERE request_id IS NOT NULL AND request_id<>'' AND NOT EXISTS (SELECT 1 FROM material_requests x WHERE x.id=material_request_items.request_id)
     ) t ORDER BY t.v`
  ).map((r) => r[0]),
  mri: q(
    `SELECT DISTINCT t.v FROM (
       SELECT request_item_id AS v FROM procurement_allocations WHERE request_item_id IS NOT NULL AND request_item_id<>'' AND NOT EXISTS (SELECT 1 FROM material_request_items x WHERE x.id=procurement_allocations.request_item_id)
       UNION SELECT request_item_id FROM stock_issue_items WHERE request_item_id IS NOT NULL AND request_item_id<>'' AND NOT EXISTS (SELECT 1 FROM material_request_items x WHERE x.id=stock_issue_items.request_item_id)
     ) t ORDER BY t.v`
  ).map((r) => r[0]),
  po: q(
    "SELECT DISTINCT purchase_order_id FROM supply_workflow_steps s WHERE s.purchase_order_id IS NOT NULL AND s.purchase_order_id<>'' " +
      "AND NOT EXISTS (SELECT 1 FROM purchase_orders x WHERE x.id=s.purchase_order_id) ORDER BY 1"
  ).map((r) => r[0]),
  poi: q(
    "SELECT DISTINCT purchase_order_item_id FROM procurement_allocations pa WHERE pa.purchase_order_item_id IS NOT NULL AND pa.purchase_order_item_id<>'' " +
      "AND NOT EXISTS (SELECT 1 FROM purchase_order_items x WHERE x.id=pa.purchase_order_item_id) ORDER BY 1"
  ).map((r) => r[0]),
  grn: q(
    "SELECT DISTINCT receipt_id FROM supply_workflow_steps s WHERE s.receipt_id IS NOT NULL AND s.receipt_id<>'' " +
      "AND NOT EXISTS (SELECT 1 FROM goods_receipts x WHERE x.id=s.receipt_id) ORDER BY 1"
  ).map((r) => r[0]),
  gri: q(
    "SELECT DISTINCT receipt_item_id FROM procurement_allocations pa WHERE pa.receipt_item_id IS NOT NULL AND pa.receipt_item_id<>'' " +
      "AND NOT EXISTS (SELECT 1 FROM goods_receipt_items x WHERE x.id=pa.receipt_item_id) ORDER BY 1"
  ).map((r) => r[0]),
});

// ─────────────────────────────────────────────────────────────────────────────
// KẾ HOẠCH CHÈN
// ─────────────────────────────────────────────────────────────────────────────
function lapKeHoach() {
  const treo = truyVanTreo();
  const nhan = []; // dòng mô tả từng bản ghi được dựng, để in ra cho người đọc kiểm
  const canhBao = [];

  // ── Tham chiếu nền
  const supplierGoc = one("SELECT id FROM suppliers WHERE active=1 ORDER BY code LIMIT 1");
  const nguoiDung =
    one("SELECT id FROM users WHERE role='procurement' ORDER BY id LIMIT 1") ||
    one("SELECT id FROM users WHERE role='admin' ORDER BY id LIMIT 1") ||
    one("SELECT id FROM users ORDER BY id LIMIT 1");
  const vatTu = q("SELECT id FROM materials ORDER BY code").map((r) => r[0]);
  if (!supplierGoc) throw new Error("Không có Nhà cung cấp đang hoạt động — không dựng được PO.");
  if (!vatTu.length) throw new Error("Danh mục vật tư rỗng — không dựng được dòng PR.");
  /** Kho nhận: ưu tiên kho site CÙNG dự án (đúng luật create_po), rồi kho cùng dự án, rồi kho tổng. */
  const khoCho = (projectId) =>
    one(`SELECT id FROM warehouses WHERE project_id=${S(projectId)} AND active=1 AND type='site' ORDER BY code LIMIT 1`) ||
    one(`SELECT id FROM warehouses WHERE project_id=${S(projectId)} AND active=1 ORDER BY code LIMIT 1`) ||
    one("SELECT id FROM warehouses WHERE active=1 ORDER BY (type='central') DESC, code LIMIT 1");
  const khoMacDinh = khoCho(PROJECT);

  // ── PR có PO bị thiếu: cặp (PO thiếu → request_id) lấy từ chính supply_workflow_steps
  const capPoMr = q(
    "SELECT s.purchase_order_id, MIN(s.request_id) FROM supply_workflow_steps s " +
      "WHERE s.purchase_order_id IS NOT NULL AND s.purchase_order_id<>'' " +
      "AND NOT EXISTS (SELECT 1 FROM purchase_orders x WHERE x.id=s.purchase_order_id) " +
      "GROUP BY s.purchase_order_id ORDER BY s.purchase_order_id"
  ).map(([po, mr]) => [po, mr === "NULL" ? null : mr]);
  const poToMr = new Map(capPoMr);
  const mrCoPo = [...new Set(capPoMr.map(([, mr]) => mr).filter(Boolean))].sort();

  // ── Số đơn (request_no) gán cho từng PR dựng lại.
  //    Dải 0001..0007/0009 là các số ĐANG KHUYẾT trong dãy DNMH — bằng chứng: chính
  //    procurement_allocations.reference_no trỏ tới chúng. Bộ đếm DNMH của app đang ở 124 nên
  //    KHÔNG bao giờ sinh lại các số này (không đụng document_sequences).
  //    4 số 0003/0004/0005/0007 BẮT BUỘC thuộc 4 PR CÓ PO, vì các dòng PO thiếu trỏ vào dòng PR
  //    nằm trong 4 PR đó (giữ #dòng PR == #dòng PO cho mục [3](a) của cổng split).
  const soBatBuocCoPo = ["0003", "0004", "0005", "0007"];
  const mrKhongPo = treo.mr.filter((id) => !mrCoPo.includes(id)).sort();
  const soChuaCoPo = ["0002", "0006", "0009"];
  const soDon = new Map();
  mrCoPo.forEach((id, i) => {
    if (i < soBatBuocCoPo.length) soDon.set(id, soBatBuocCoPo[i]);
    else soDon.set(id, i === soBatBuocCoPo.length ? "0001" : "9201");
  });
  mrKhongPo.forEach((id, i) => {
    soDon.set(id, i < soChuaCoPo.length ? soChuaCoPo[i] : `92${String(10 + i)}`);
  });

  // ── PR dựng lại (9 bản ghi thiếu thuộc dự án mẫu)
  const keHoachMR = [];
  const mrTheoSo = new Map();
  for (const id of [...treo.mr].sort()) {
    const requestNo = `DNMH-PRJ-DEMO-01-2026-${soDon.get(id)}`;
    const poLienQuan = [...poToMr.entries()].filter(([, m]) => m === id).map(([p]) => p);
    keHoachMR.push({
      id,
      request_no: requestNo,
      project_id: PROJECT,
      area: "Dựng lại từ tham chiếu treo (seed Phase 2)",
      ghiChu: poLienQuan.length ? `PR đã có ${poLienQuan.length} PO: ${poLienQuan.join(", ")}` : "PR chưa có PO",
    });
    mrTheoSo.set(requestNo, id);
    nhan.push(`MR ${id} ← request_no ${requestNo} · ${keHoachMR[keHoachMR.length - 1].ghiChu}`);
  }

  // ── Dòng PR thiếu: cha + số lượng dẫn xuất từ chính procurement_allocations
  const mriCha = new Map(
    q(
      `SELECT pa.request_item_id, MAX(pa.reference_no) FROM procurement_allocations pa WHERE pa.stage='MR' AND pa.request_item_id IN (${inList(treo.mri)}) AND pa.reference_no IS NOT NULL GROUP BY pa.request_item_id`
    ).map(([mri, ref]) => [mri, ref])
  );
  const mriDuyet = new Map(
    q(
      `SELECT pa.request_item_id, MAX(pa.quantity) FROM procurement_allocations pa WHERE pa.stage='MR' AND pa.request_item_id IN (${inList(treo.mri)}) GROUP BY pa.request_item_id`
    ).map(([mri, v]) => [mri, Number(v)])
  );
  const mriVatTu = new Map(
    q(
      `SELECT pa.request_item_id, MAX(pa.material_id) FROM procurement_allocations pa WHERE pa.request_item_id IN (${inList(treo.mri)}) GROUP BY pa.request_item_id`
    ).map(([mri, v]) => [mri, v])
  );
  /** "DNMH-SC012564-2026-0001" → { projectCode:'SC012564', requestNo:'DNMH-SC012564-2026-0001' }. */
  const tachRefNo = (ref) => {
    const m = String(ref || "").match(/^DNMH-(.+)-(\d{4})-(\d{4})$/);
    return m ? { projectCode: m[1], requestNo: ref } : null;
  };

  // ── Dòng PR thuộc DỰ ÁN KHÁC ⇒ dựng thêm PR đúng dự án đó (không nhét sang dự án mẫu)
  const mrDuAnKhac = new Map(); // requestNo -> { id, project_id }
  for (const [, ref] of mriCha) {
    const t = tachRefNo(ref);
    if (!t || t.projectCode === "PRJ-DEMO-01" || mrDuAnKhac.has(ref)) continue;
    const prj =
      one(`SELECT DISTINCT project_id FROM procurement_allocations WHERE reference_no=${S(ref)} LIMIT 1`) || PROJECT;
    const id = `MR_${P}_${t.projectCode.replace(/[^A-Za-z0-9]/g, "")}`;
    mrDuAnKhac.set(ref, { id, project_id: prj });
    keHoachMR.push({
      id,
      request_no: ref,
      project_id: prj,
      area: "Dựng lại từ tham chiếu treo (seed Phase 2)",
      ghiChu: "PR của dự án khác",
    });
    nhan.push(`MR ${id} ← request_no ${ref} (dự án ${prj})`);
  }

  /** Số dòng (line_no) kế tiếp cho mỗi PR — tôn trọng UNIQUE(request_id, line_no). */
  const noDaDung = new Map();
  for (const [rid, ln] of q("SELECT request_id, line_no FROM material_request_items")) {
    if (!noDaDung.has(rid)) noDaDung.set(rid, new Set());
    noDaDung.get(rid).add(Number(ln));
  }
  const keTiep = (rid) => {
    let n = 1;
    while (noDaDung.get(rid) && noDaDung.get(rid).has(n)) n++;
    if (!noDaDung.has(rid)) noDaDung.set(rid, new Set());
    noDaDung.get(rid).add(n);
    return n;
  };
  /** Số dòng (line_no) kế tiếp cho mỗi PO — tôn trọng UNIQUE(purchase_order_id, line_no). */
  const dongTrongPo = new Map();
  for (const [pid, ln] of q("SELECT purchase_order_id, line_no FROM purchase_order_items")) {
    dongTrongPo.set(pid, Math.max(dongTrongPo.get(pid) || 0, Number(ln)));
  }
  const dongKeTiep = (pid) => {
    const n = (dongTrongPo.get(pid) || 0) + 1;
    dongTrongPo.set(pid, n);
    return n;
  };

  const keHoachMRI = new Map(); // id -> { request_id, material_id, approved, requested, ordered, line_no, nguon }
  for (const mri of [...treo.mri].sort()) {
    const ref = mriCha.get(mri) || "";
    const t = tachRefNo(ref);
    const khac = mrDuAnKhac.get(ref);
    let cha = khac ? khac.id : t ? mrTheoSo.get(t.requestNo) || null : null;
    if (!cha) {
      const duPhong = keHoachMR.find((m) => m.request_no.endsWith("-0009")) || keHoachMR[0];
      cha = duPhong.id;
      canhBao.push(`Dòng PR ${mri}: không suy được PR cha từ PA (reference_no=${ref || "(rỗng)"}) → gán vào ${cha}`);
    }
    const duyet = Number(mriDuyet.get(mri) || 0);
    keHoachMRI.set(mri, {
      request_id: cha,
      material_id: mriVatTu.get(mri) || vatTu[0],
      approved: duyet || SEED_QTY,
      requested: duyet || SEED_QTY,
      ordered: 0,
      line_no: keTiep(cha),
      nguon: "dựng lại",
    });
  }

  // ── PO thiếu: dựng đúng id cũ, request_id lấy từ chính supply_workflow_steps
  const soPoDaDung = new Set(q("SELECT po_no FROM purchase_orders").map((r) => r[0]));
  const keHoachPO = new Map(); // id -> { request_id, project_id, supplier_id, warehouse_id, status, po_no }
  const duAnCuaMr = (mrId) => (keHoachMR.find((m) => m.id === mrId) || {}).project_id || PROJECT;
  const themPO = (id, mrId, poNo, status) => {
    const prj = duAnCuaMr(mrId);
    keHoachPO.set(id, {
      request_id: mrId,
      project_id: prj,
      supplier_id: supplierGoc,
      warehouse_id: khoCho(prj),
      status: status || "waiting_delivery",
      po_no: soPoDaDung.has(poNo) ? `${poNo}-SEED` : poNo,
    });
  };
  let stt = 1;
  for (const po of [...treo.po].sort()) {
    const mr = poToMr.get(po) || null;
    if (!mr) throw new Error(`PO thiếu ${po} không suy ra được PR cha từ supply_workflow_steps.`);
    themPO(po, mr, `PO-PRJ-DEMO-01-2026-92${String(stt).padStart(2, "0")}`);
    nhan.push(`PO ${po} ← ${keHoachPO.get(po).po_no} · request_id=${mr}`);
    stt++;
  }

  // ── Dòng PO thiếu: cha = PO của CHÍNH PR chứa dòng PR mà PA trỏ tới (giữ #POI == #MRI)
  const poTheoMr = new Map();
  for (const [po, v] of keHoachPO) if (v.request_id) poTheoMr.set(v.request_id, po);
  const keHoachPOI = new Map(); // id -> { po_id, request_item_id, ordered_qty, line_no, unit_price, nguon }
  const soLuongPOI = new Map(
    q(
      `SELECT pa.purchase_order_item_id, MAX(pa.quantity) FROM procurement_allocations pa WHERE pa.purchase_order_item_id IN (${inList(treo.poi)}) GROUP BY pa.purchase_order_item_id`
    ).map(([poi, v]) => [poi, Number(v)])
  );
  const mriCuaPOI = new Map(
    q(
      `SELECT pa.purchase_order_item_id, MAX(pa.request_item_id) FROM procurement_allocations pa WHERE pa.purchase_order_item_id IN (${inList(treo.poi)}) GROUP BY pa.purchase_order_item_id`
    ).map(([poi, v]) => [poi, v])
  );
  for (const poi of [...treo.poi].sort()) {
    const mri = mriCuaPOI.get(poi);
    const mrOf = mri ? keHoachMRI.get(mri) : null;
    const mrId = mrOf ? mrOf.request_id : null;
    if (!mrId) throw new Error(`Dòng PO thiếu ${poi} không suy ra được PR cha.`);
    if (!poTheoMr.has(mrId)) {
      // PR đó chưa có PO nào (vd dự án khác) ⇒ dựng PO riêng cho đúng PR đó.
      const id = `PO_${P}_AUTO_${keHoachPO.size + 1}`;
      themPO(id, mrId, `PO-PRJ-DEMO-01-2026-93${String(keHoachPO.size + 1).padStart(2, "0")}`);
      poTheoMr.set(mrId, id);
      nhan.push(`PO ${id} ← ${keHoachPO.get(id).po_no} · request_id=${mrId} (dựng kèm cho dòng PO thiếu)`);
    }
    const poId = poTheoMr.get(mrId);
    keHoachPOI.set(poi, {
      po_id: poId,
      request_item_id: mri,
      ordered_qty: soLuongPOI.get(poi) || SEED_QTY,
      line_no: dongKeTiep(poId),
      unit_price: 0,
      nguon: "dựng lại",
    });
    nhan.push(`POI ${poi} ← PO ${poId} · dòng PR ${mri} · SL ${soLuongPOI.get(poi) || SEED_QTY}`);
  }

  // ── BÙ CÂN BẰNG: mỗi PR có PO phải có #dòng PR == #dòng PO (mục [3](a) cổng split join MR×PO×POI×MRI)
  //    và mỗi PO phải có ≥1 dòng (không thì dữ liệu vô nghĩa dù cổng không bắt).
  for (const [mrId, poId] of [...poTheoMr.entries()]) {
    const mris = [...keHoachMRI.entries()].filter(([, v]) => v.request_id === mrId).map(([k]) => k);
    const pois = [...keHoachPOI.entries()].filter(([, v]) => mris.includes(v.request_item_id)).map(([k]) => k);
    if (mris.length === 0 && pois.length === 0) {
      const mriId = `MRI_${P}_BAL_${keHoachMRI.size + 1}`;
      keHoachMRI.set(mriId, {
        request_id: mrId,
        material_id: vatTu[keHoachMRI.size % vatTu.length],
        approved: SEED_QTY,
        requested: SEED_QTY,
        ordered: SEED_QTY,
        line_no: keTiep(mrId),
        nguon: "bù cân bằng",
      });
      const poiId = `POI_${P}_BAL_${keHoachPOI.size + 1}`;
      keHoachPOI.set(poiId, {
        po_id: poId,
        request_item_id: mriId,
        ordered_qty: SEED_QTY,
        line_no: dongKeTiep(poId),
        unit_price: 0,
        nguon: "bù cân bằng",
      });
      nhan.push(`Bù cân bằng: PO ${poId} (PR ${mrId}) ← 1 dòng PR ${mriId} + 1 dòng PO ${poiId}`);
    } else if (pois.length < mris.length) {
      for (const m of mris.filter((x) => !pois.some((p) => keHoachPOI.get(p).request_item_id === x))) {
        const poiId = `POI_${P}_BAL_${keHoachPOI.size + 1}`;
        keHoachPOI.set(poiId, {
          po_id: poId,
          request_item_id: m,
          ordered_qty: keHoachMRI.get(m).approved,
          line_no: dongKeTiep(poId),
          unit_price: 0,
          nguon: "bù cân bằng",
        });
        nhan.push(`Bù cân bằng: thêm dòng PO ${poiId} cho dòng PR ${m} (giữ #POI == #MRI của PR ${mrId})`);
      }
    } else if (pois.length > mris.length) {
      // Nhiều dòng PO cùng trỏ 1 dòng PR ⇒ thêm dòng PR để mỗi dòng PO có dòng PR riêng.
      const dungChung = [...new Set(pois.map((p) => keHoachPOI.get(p).request_item_id))];
      for (let i = 0; i < pois.length - mris.length; i++) {
        const mriId = `MRI_${P}_BAL_${keHoachMRI.size + 1}`;
        keHoachMRI.set(mriId, {
          request_id: mrId,
          material_id: vatTu[keHoachMRI.size % vatTu.length],
          approved: 0,
          requested: SEED_QTY,
          ordered: 0,
          line_no: keTiep(mrId),
          nguon: "bù cân bằng",
        });
        nhan.push(`Bù cân bằng: thêm dòng PR ${mriId} cho PR ${mrId}`);
      }
      void dungChung;
    }
  }

  // ── GRN thiếu (suy từ supply_workflow_steps)
  const grnTheoNo = new Map(
    q("SELECT id, receipt_no, purchase_order_id, warehouse_id FROM goods_receipts").map(([id, no, po, wh]) => [no, { id, po, wh }])
  );
  const keHoachGRN = new Map(); // id -> { receipt_no, po_id, warehouse_id, ghiChu }
  const poCuaGrnThieu = new Map(
    q(
      "SELECT s.receipt_id, MIN(s.purchase_order_id) FROM supply_workflow_steps s " +
        `WHERE s.receipt_id IN (${inList(treo.grn)}) AND s.purchase_order_id IS NOT NULL AND s.purchase_order_id<>'' GROUP BY s.receipt_id`
    ).map(([g, po]) => [g, po])
  );
  for (const grn of [...treo.grn].sort()) {
    const po = poCuaGrnThieu.get(grn) || null;
    const poHopLe = po ? (keHoachPO.has(po) ? po : one(`SELECT id FROM purchase_orders WHERE id=${S(po)}`)) : null;
    const poDung = poHopLe || [...keHoachPO.keys()][0] || one("SELECT id FROM purchase_orders ORDER BY po_no LIMIT 1");
    keHoachGRN.set(grn, {
      receipt_no: `GRN-PRJ-DEMO-01-2026-92${String(keHoachGRN.size + 1).padStart(2, "0")}`,
      po_id: poDung,
      warehouse_id: khoMacDinh,
      ghiChu: `dựng lại từ bước workflow (PO=${po || "?"})`,
    });
    nhan.push(`GRN ${grn} ← ${keHoachGRN.get(grn).receipt_no} · PO=${poDung}`);
  }

  // ── Dòng phiếu nhập thiếu: cha = receipt_no mà PA nhắc tới (dựng GRN nếu chưa có),
  //    dòng PO = chính dòng PO mà PA trỏ tới ⇒ chuỗi PR→PO→GRN→GRI khớp nhau.
  const keHoachGRI = new Map(); // id -> { receipt_id, poi_id, received_qty, nguon }
  const poCuaPoi = (poi) =>
    keHoachPOI.has(poi) ? keHoachPOI.get(poi).po_id : one(`SELECT purchase_order_id FROM purchase_order_items WHERE id=${S(poi)}`);
  const infoGri = q(
    `SELECT pa.receipt_item_id, MAX(pa.purchase_order_item_id), MAX(pa.reference_no), MAX(pa.quantity)
     FROM procurement_allocations pa WHERE pa.receipt_item_id IN (${inList(treo.gri)}) GROUP BY pa.receipt_item_id`
  ).map(([gri, poi, ref, qty]) => ({ gri, poi, ref, qty: Number(qty) }));
  for (const it of infoGri.sort((a, b) => a.gri.localeCompare(b.gri))) {
    let grn = grnTheoNo.has(it.ref) ? grnTheoNo.get(it.ref).id : null;
    if (!grn) {
      const poId = poCuaPoi(it.poi);
      const id = `GRN_${P}_${String(it.ref).replace(/[^A-Za-z0-9]/g, "_")}`;
      keHoachGRN.set(id, {
        receipt_no: it.ref,
        po_id: poId,
        warehouse_id: khoMacDinh,
        ghiChu: `dựng theo receipt_no của PA (PO=${poId})`,
      });
      grn = id;
      nhan.push(`GRN ${id} ← ${it.ref} · PO=${poId} (dựng theo chứng từ PA)`);
    }
    keHoachGRI.set(it.gri, { receipt_id: grn, poi_id: it.poi, received_qty: it.qty || SEED_QTY, nguon: "dựng lại" });
    nhan.push(`GRI ${it.gri} ← GRN ${grn} · dòng PO ${it.poi} · SL ${it.qty || SEED_QTY}`);
  }

  // ── GRN ĐANG RỖNG DÒNG: thêm 1 dòng cho mỗi phiếu (chặng B1 của cổng trace)
  const rongDong = q(
    "SELECT g.id, g.receipt_no, g.purchase_order_id FROM goods_receipts g " +
      "WHERE NOT EXISTS (SELECT 1 FROM goods_receipt_items i WHERE i.receipt_id=g.id) ORDER BY g.receipt_no"
  );
  rongDong.forEach(([gid, no, po], idx) => {
    const r = q(`SELECT id, ordered_qty FROM purchase_order_items WHERE purchase_order_id=${S(po)} ORDER BY line_no, id LIMIT 1`);
    if (!r.length) {
      canhBao.push(`GRN rỗng ${no} (${gid}): PO ${po} KHÔNG có dòng nào ⇒ không thể thêm dòng GRI hợp lệ.`);
      return;
    }
    keHoachGRI.set(`GRNI_${P}_FILL_${idx + 1}`, {
      receipt_id: gid,
      poi_id: r[0][0],
      received_qty: Number(r[0][1]) || SEED_QTY,
      nguon: "lấp GRN rỗng",
    });
    nhan.push(`GRI lấp rỗng: ${no} ← dòng PO ${r[0][0]} · SL ${r[0][1]}`);
  });

  // ── CA THẬT "1 PR → N PO": 2 PO · 2 NCC KHÁC NHAU (đúng luật gom theo supplierId của create_po)
  const sp = {
    mr: `MR_${P}_SPLIT`,
    mriA: `MRI_${P}_SPLIT_A`,
    mriB: `MRI_${P}_SPLIT_B`,
    po1: `PO_${P}_SPLIT_1`,
    po2: `PO_${P}_SPLIT_2`,
    ncc2: `SUP_${P}_NCC2`,
    qtyA: 60,
    qtyB: 50,
  };
  keHoachMR.push({
    id: sp.mr,
    request_no: "DNMH-PRJ-DEMO-01-2026-9001",
    project_id: PROJECT,
    area: "Ca thật 1 PR → 2 PO (seed Phase 2)",
    ghiChu: "PR tách 2 PO cho 2 NCC — đã duyệt đủ cấp",
  });
  keHoachMRI.set(sp.mriA, {
    request_id: sp.mr, material_id: vatTu[0], approved: 100, requested: 100, ordered: sp.qtyA, line_no: 1, nguon: "ca tách PO",
  });
  keHoachMRI.set(sp.mriB, {
    request_id: sp.mr, material_id: vatTu[1 % vatTu.length], approved: 50, requested: 50, ordered: sp.qtyB, line_no: 2, nguon: "ca tách PO",
  });
  keHoachPO.set(sp.po1, {
    request_id: sp.mr, project_id: PROJECT, supplier_id: supplierGoc, warehouse_id: khoMacDinh,
    status: "pending_approval", po_no: "PO-PRJ-DEMO-01-2026-9001", coDinh: true,
  });
  keHoachPO.set(sp.po2, {
    request_id: sp.mr, project_id: PROJECT, supplier_id: sp.ncc2, warehouse_id: khoMacDinh,
    status: "pending_approval", po_no: "PO-PRJ-DEMO-01-2026-9002", coDinh: true,
  });
  keHoachPOI.set(`POI_${P}_SPLIT_1`, { po_id: sp.po1, request_item_id: sp.mriA, ordered_qty: sp.qtyA, line_no: 1, unit_price: 0, nguon: "ca tách PO" });
  keHoachPOI.set(`POI_${P}_SPLIT_2`, { po_id: sp.po2, request_item_id: sp.mriB, ordered_qty: sp.qtyB, line_no: 1, unit_price: 0, nguon: "ca tách PO" });
  nhan.push(`★ CA TÁCH PO: PR ${sp.mr} → PO ${sp.po1} (NCC ${supplierGoc}) + PO ${sp.po2} (NCC ${sp.ncc2})`);

  // ── Mọi GRN (kể cả vừa dựng) PHẢI có ≥1 dòng, nếu không chặng B1 lại đỏ.
  const poiDauCuaPo = (poId) => {
    const tuKeHoach = [...keHoachPOI.entries()]
      .filter(([, v]) => v.po_id === poId)
      .sort((a, b) => a[1].line_no - b[1].line_no)[0];
    if (tuKeHoach) return { id: tuKeHoach[0], qty: tuKeHoach[1].ordered_qty };
    const r = q(`SELECT id, ordered_qty FROM purchase_order_items WHERE purchase_order_id=${S(poId)} ORDER BY line_no, id LIMIT 1`);
    return r.length ? { id: r[0][0], qty: Number(r[0][1]) } : null;
  };
  let soGriMoi = 0;
  for (const [gid, v] of [...keHoachGRN.entries()]) {
    if ([...keHoachGRI.values()].some((g) => g.receipt_id === gid)) continue;
    const poi = poiDauCuaPo(v.po_id);
    if (!poi) {
      canhBao.push(`GRN mới ${v.receipt_no} (${gid}): PO ${v.po_id} không có dòng nào ⇒ phiếu sẽ rỗng dòng.`);
      continue;
    }
    soGriMoi++;
    keHoachGRI.set(`GRNI_${P}_NEW_${soGriMoi}`, {
      receipt_id: gid, poi_id: poi.id, received_qty: poi.qty || SEED_QTY, nguon: "lấp GRN mới",
    });
    nhan.push(`GRI lấp GRN mới: ${v.receipt_no} ← dòng PO ${poi.id} · SL ${poi.qty || SEED_QTY}`);
  }

  // ── CHỐT SỐ LƯỢNG: ordered_qty của dòng PR PHẢI bằng đúng tổng ordered_qty của các dòng PO
  //    trỏ vào nó (cổng split C2), và KHÔNG vượt approved_purchase_qty (cổng split C1).
  for (const [mriId, v] of keHoachMRI) {
    const tong = [...keHoachPOI.values()]
      .filter((p) => p.request_item_id === mriId)
      .reduce((s, p) => s + Number(p.ordered_qty || 0), 0);
    v.ordered = tong;
    v.approved = Math.max(Number(v.approved || 0), tong);
  }

  return {
    treo, nhan, canhBao, keHoachMR, keHoachMRI, keHoachPO, keHoachPOI, keHoachGRN, keHoachGRI,
    nhaCungCapMoi: [{ id: sp.ncc2, code: "NCC-P2SEED-02", name: "Nhà cung cấp thứ 2 (dữ liệu seed Phase 2)" }],
    supplierGoc, nguoiDung, vatTu, khoMacDinh, PROJECT, TS, P, SPLIT: sp, SEED_QTY,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SINH CÂU LỆNH (mọi bảng dùng CHUNG một khuôn ⇒ không lệch thứ tự cột/giá trị)
// ─────────────────────────────────────────────────────────────────────────────
const COT_MR = ["id", "request_no", "project_id", "team_id", "source_warehouse_id", "requested_by", "requested_at", "needed_at", "priority", "area", "purpose", "status", "approval_stage", "total_estimated_value", "created_at", "updated_at", "supply_status"];
const COT_MRI = ["id", "request_id", "line_no", "material_id", "requested_qty", "stock_allocation_qty", "approved_purchase_qty", "ordered_qty", "received_qty", "issued_qty", "installed_qty", "delivered_qty", "line_status", "created_at", "updated_at", "estimated_unit_price"];
const COT_PO = ["id", "po_no", "request_id", "project_id", "supplier_id", "receiving_warehouse_id", "buyer_user_id", "ordered_at", "eta", "status", "total_value", "created_at", "updated_at"];
const COT_POI = ["id", "purchase_order_id", "request_item_id", "line_no", "ordered_qty", "unit_price", "received_qty", "closed_qty", "delivered_qty", "status", "created_at", "updated_at"];
const COT_GRN = ["id", "receipt_no", "purchase_order_id", "warehouse_id", "received_by", "received_at", "delivery_note_no", "qc_status", "document_status", "posting_status", "bch_confirmation_status", "created_at", "updated_at"];
const COT_GRI = ["id", "receipt_id", "purchase_order_item_id", "received_qty", "accepted_qty", "rejected_qty", "lot_no", "qc_result", "created_at", "updated_at"];

function sinhCauLenh(kh) {
  const st = [];
  const demBang = new Map();
  const them = (bang, cau, soDong) => {
    if (!cau) return;
    st.push(cau);
    demBang.set(bang, (demBang.get(bang) || 0) + soDong);
  };
  const T = (n) => S(kh.TS);

  // 1) Nhà cung cấp thứ 2 (BẮT BUỘC: create_po gom PO theo supplierId ⇒ 2 PO cần 2 NCC)
  them("suppliers", insertNhieu("suppliers", ["id", "code", "name", "lead_time_days", "rating", "active", "created_at", "updated_at"],
    kh.nhaCungCapMoi.map((s) => [S(s.id), S(s.code), S(s.name), 7, 0, 1, T(), T()])), kh.nhaCungCapMoi.length);

  // 2) material_requests
  const mrRows = kh.keHoachMR.map((m) => [
    S(m.id), S(m.request_no), S(m.project_id), "NULL", "NULL", S(kh.nguoiDung), T(), T(),
    "'normal'", S(m.area), S(m.ghiChu), "'approved'", 5, 0, T(), T(), "'awaiting_po'",
  ]);
  them("material_requests", insertNhieu("material_requests", COT_MR, mrRows), mrRows.length);

  // 3) material_request_items
  const mriRows = [...kh.keHoachMRI.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([id, v]) => [
      S(id), S(v.request_id), v.line_no, S(v.material_id), N(v.requested), 0, N(v.approved), N(v.ordered),
      0, 0, 0, 0, v.ordered > 0 ? "'ordered'" : "'approved'", T(), T(), 0,
    ]);
  them("material_request_items", insertNhieu("material_request_items", COT_MRI, mriRows), mriRows.length);

  // 4) purchase_orders
  const poRows = [...kh.keHoachPO.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([id, v]) => [
      S(id), S(v.po_no), S(v.request_id), S(v.project_id), S(v.supplier_id), S(v.warehouse_id),
      S(kh.nguoiDung), T(), "NULL", S(v.status), 0, T(), T(),
    ]);
  them("purchase_orders", insertNhieu("purchase_orders", COT_PO, poRows), poRows.length);

  // 5) purchase_order_items
  const poiRows = [...kh.keHoachPOI.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([id, v]) => [
      S(id), S(v.po_id), S(v.request_item_id), v.line_no, N(v.ordered_qty), N(v.unit_price), 0, 0, 0, "'ordered'", T(), T(),
    ]);
  them("purchase_order_items", insertNhieu("purchase_order_items", COT_POI, poiRows), poiRows.length);

  // 6) goods_receipts
  const grnRows = [...kh.keHoachGRN.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([id, v]) => [
      S(id), S(v.receipt_no), S(v.po_id), S(v.warehouse_id), S(kh.nguoiDung), T(),
      "NULL", "'accepted'", "'complete'", "'posted'", "'confirmed'", T(), T(),
    ]);
  them("goods_receipts", insertNhieu("goods_receipts", COT_GRN, grnRows), grnRows.length);

  // 7) goods_receipt_items  ⚠ cột thật là `receipt_id` (KHÔNG phải goods_receipt_id)
  const griRows = [...kh.keHoachGRI.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([id, v]) => [
      S(id), S(v.receipt_id), S(v.poi_id), N(v.received_qty), N(v.received_qty), 0, "NULL", "'accepted'", T(), T(),
    ]);
  them("goods_receipt_items", insertNhieu("goods_receipt_items", COT_GRI, griRows), griRows.length);

  return { st, demBang };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
function main() {
  console.log("PHASE 2 — SEED DỮ LIỆU TEST CHO 3 CỔNG ĐO   (⚠️ CHỈ INSERT: không DELETE/UPDATE/DROP/ALTER/TRUNCATE)");
  console.log(`CSDL: ${DB}${DRY ? "   [CHẾ ĐỘ --dry-run: KHÔNG chạm CSDL]" : ""}`);
  console.log(`mysql: ${MYSQL}`);

  // ── [1] TRƯỚC
  const truocAll = quetTatCa();
  const truoc = {
    poMoCoi: demPoMoCoi(),
    poTong: Number(one("SELECT COUNT(*) FROM purchase_orders")),
    grn: thongKeGrn(),
    mrNhieuPo: demMrNhieuPo(),
    moCoi: tongMoCoi(truocAll),
    treo: tongTreo(truocAll),
    soCapMoCoi: truocAll.filter((r) => r.moCoi > 0).length,
  };
  console.log("\n" + "─".repeat(100) + "\n[1] SỐ LIỆU TRƯỚC KHI SEED\n" + "─".repeat(100));
  console.log(`  Chặng A1  PO mồ côi (NULL/trỏ hư):        ${truoc.poMoCoi}/${truoc.poTong}`);
  console.log(`  Chặng B1  GRN có dòng GRI:                ${truoc.grn.coDong}/${truoc.grn.tong} (${tiLe(truoc.grn.coDong, truoc.grn.tong)})`);
  console.log(`  Tách PO   MR có ≥ 2 PO:                   ${truoc.mrNhieuPo}`);
  console.log(`  Toàn vẹn  TỔNG dòng mồ côi:               ${truoc.moCoi}  (treo=${truoc.treo} · null-tính-theo-cổng=${truoc.moCoi - truoc.treo})`);
  console.log(`  Toàn vẹn  Số cặp quan hệ có mồ côi:       ${truoc.soCapMoCoi}/15`);

  // ── [2] KẾ HOẠCH
  const kh = lapKeHoach();
  const { st, demBang } = sinhCauLenh(kh);
  kiemTraChiInsert(st);

  console.log("\n" + "─".repeat(100) + "\n[2] KẾ HOẠCH CHÈN (chỉ INSERT)\n" + "─".repeat(100));
  let tongDong = 0;
  for (const [bang, so] of [...demBang.entries()].sort()) {
    console.log(`  ${dem(bang, 26)} ${dem(so, 5)} dòng`);
    tongDong += so;
  }
  console.log(`  ${dem("TỔNG", 26)} ${dem(tongDong, 5)} dòng · ${st.length} câu INSERT · đã qua lớp chặn CHỈ-INSERT`);

  console.log("\n" + "─".repeat(100) + "\n[3] CHI TIẾT BẢN GHI DỰNG LẠI / CA THẬT\n" + "─".repeat(100));
  for (const n of kh.nhan) console.log(`  · ${n}`);
  if (kh.canhBao.length) {
    console.log("\n  ⚠ CẢNH BÁO:");
    for (const c of kh.canhBao) console.log(`      · ${c}`);
  }

  if (DRY) {
    console.log("\n[dry-run] Không chèn gì. Bỏ --dry-run để chạy thật.");
    return 0;
  }

  // ── [4] CHÈN
  console.log("\n" + "─".repeat(100) + "\n[4] THỰC THI\n" + "─".repeat(100));
  const demTruoc = demDongCacBang();
  const soLo = chayInserts(st);
  const demSau = demDongCacBang();
  console.log(`  Đã chạy ${soLo} lô INSERT IGNORE (0 DELETE/UPDATE/DROP/TRUNCATE/ALTER).`);
  // ĐO số dòng THỰC TẾ tăng (không tin vào "kế hoạch": INSERT IGNORE có thể không chèn gì).
  console.log("  Số dòng THỰC TẾ đã chèn (COUNT(*) trước → sau):");
  let chenThat = 0;
  for (const b of BANG_GHI) {
    const t = demTruoc.get(b);
    const s = demSau.get(b);
    chenThat += s - t;
    console.log(`      ${dem(b, 26)} ${dem(t, 6)} → ${dem(s, 6)} ${s - t === 0 ? "(không đổi)" : `(+${s - t})`}`);
  }
  console.log(`  ⇒ TỔNG dòng THỰC TẾ đã chèn lần này: ${chenThat}${chenThat === 0 ? "  ✔ IDEMPOTENT (chạy lại KHÔNG nhân đôi dữ liệu)" : ""}`);

  // ── [5] SAU + BẢNG TRƯỚC/SAU
  const sauAll = quetTatCa();
  const sau = {
    poMoCoi: demPoMoCoi(),
    poTong: Number(one("SELECT COUNT(*) FROM purchase_orders")),
    grn: thongKeGrn(),
    mrNhieuPo: demMrNhieuPo(),
    moCoi: tongMoCoi(sauAll),
    treo: tongTreo(sauAll),
    soCapMoCoi: sauAll.filter((r) => r.moCoi > 0).length,
  };
  console.log("\n" + "─".repeat(100) + "\n[5] SỐ LIỆU SAU KHI SEED — BẢNG TRƯỚC/SAU\n" + "─".repeat(100));
  const dong = (nhan, t, s) => console.log(`  ${dem(nhan, 42)} ${dem(t, 24)} → ${s}`);
  dong("Chặng A1  PO mồ côi (trace)", `${truoc.poMoCoi}/${truoc.poTong}`, `${sau.poMoCoi}/${sau.poTong}`);
  dong("Chặng B1  GRN có dòng GRI", `${truoc.grn.coDong}/${truoc.grn.tong} (${tiLe(truoc.grn.coDong, truoc.grn.tong)})`, `${sau.grn.coDong}/${sau.grn.tong} (${tiLe(sau.grn.coDong, sau.grn.tong)})`);
  dong("Tách PO   MR có ≥ 2 PO", `${truoc.mrNhieuPo}`, `${sau.mrNhieuPo}`);
  dong("Toàn vẹn  TỔNG dòng mồ côi", `${truoc.moCoi}`, `${sau.moCoi}`);
  dong("Toàn vẹn  dòng THAM CHIẾU TREO", `${truoc.treo}`, `${sau.treo}`);
  dong("Toàn vẹn  số cặp có mồ côi", `${truoc.soCapMoCoi}/15`, `${sau.soCapMoCoi}/15`);

  console.log("\n" + "─".repeat(100) + "\n[6] CHI TIẾT 15 CẶP SAU KHI SEED\n" + "─".repeat(100));
  console.log(`  ${dem("Quan hệ", 50)}${dem("Tổng", 7)}${dem("NULL", 7)}${dem("Treo", 7)}Mồ côi`);
  for (const r of sauAll) {
    console.log(`  ${dem(r.cap, 50)}${dem(r.tong, 7)}${dem(r.rongNull, 7)}${dem(r.treo, 7)}${r.moCoi}`);
  }

  // ── [7] BLOCKED
  console.log("\n" + "─".repeat(100) + "\n[7] BLOCKED / KHÔNG THỂ SỬA BẰNG INSERT\n" + "─".repeat(100));
  const poNull = q("SELECT po.po_no, po.id, po.status FROM purchase_orders po WHERE po.request_id IS NULL OR po.request_id='' ORDER BY po.po_no");
  if (poNull.length) {
    console.log("  [BLOCKED] PO có request_id NULL — cột của DÒNG ĐÃ TỒN TẠI, INSERT không sửa được:");
    for (const [no, id, status] of poNull) console.log(`      · ${dem(no, 32)} id=${dem(id, 44)} status=${status}`);
    console.log("      ⇒ cần đúng 1 câu UPDATE (phải được người dùng cho phép):");
    for (const [, id] of poNull) {
      console.log(`        UPDATE purchase_orders SET request_id='<MR hợp lệ>' WHERE id='${id}';`);
    }
  } else {
    console.log("  [OK] Không còn PO có request_id NULL.");
  }
  const capConNull = sauAll.filter((r) => r.rongNull > 0);
  if (capConNull.length) {
    console.log("  [KHÔNG SỬA ĐƯỢC BẰNG INSERT] Cột NULL của DÒNG ĐÃ TỒN TẠI:");
    for (const r of capConNull) console.log(`      · ${dem(r.cap, 50)} NULL=${r.rongNull} dòng`);
    console.log("      Đây là NULL NGHIỆP VỤ (chưa tới bước đó), KHÔNG phải tham chiếu hỏng.");
  }

  // ── [8] KẾT LUẬN
  console.log("\n" + "─".repeat(100) + "\n[8] KẾT LUẬN SEED\n" + "─".repeat(100));
  console.log(`  Tham chiếu treo:  ${truoc.treo} → ${sau.treo}  ${sau.treo === 0 ? "✔ ĐÃ VỀ 0" : "✗ CÒN TREO"}`);
  console.log(`  GRN rỗng dòng:    ${truoc.grn.tong - truoc.grn.coDong} → ${sau.grn.tong - sau.grn.coDong}  ${sau.grn.tong - sau.grn.coDong === 0 ? "✔ ĐÃ VỀ 0 ⇒ B1 = 100%" : "✗ CÒN RỖNG"}`);
  console.log(`  MR có ≥ 2 PO:     ${truoc.mrNhieuPo} → ${sau.mrNhieuPo}  ${sau.mrNhieuPo > 0 ? "✔ ĐÃ CÓ BẰNG CHỨNG" : "✗ VẪN 0"}`);
  console.log(`  Mồ côi còn lại:   ${sau.moCoi} (không thể về 0 bằng INSERT vì ${sau.moCoi - sau.treo} dòng là NULL của dòng đã tồn tại)`);
  console.log("");
  return sau.treo === 0 ? 0 : 1;
}

let code;
try {
  code = main();
} catch (e) {
  console.error("\n[BLOCKED] Seed DỪNG — không chèn thêm gì.");
  console.error(`  lỗi: ${e && e.message ? e.message : e}`);
  code = 2;
}
process.exit(code);
