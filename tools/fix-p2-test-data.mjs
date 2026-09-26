#!/usr/bin/env node
// VNTECH ERP V5.3.0 — PHASE 2 · SỬA DỮ LIỆU TEST BỊ HỎNG THAM CHIẾU   (⚠️ CHỈ UPDATE)
//
// VÌ SAO CÓ TỆP NÀY: `tools/seed-p2-test-data.mjs` CHỈ được INSERT nên không sửa được cột của DÒNG ĐÃ TỒN TẠI.
// Ngày 21/09/2026 người dùng cho phép rõ: «ok update dữ liệu để test đi, dự án còn thiếu phần nào thì tự
// động cài đặt» ⇒ tách riêng một tệp UPDATE để giữ nguyên cam kết "seed CHỈ INSERT" của tệp kia.
//
// ⛔ RÀNG BUỘC CỨNG — TỆP NÀY CHỈ `UPDATE`:
//    · Không DELETE · Không DROP · Không TRUNCATE · Không ALTER · Không INSERT.
//      (Người dùng cấm tuyệt đối việc xoá bảng/cột và xoá dòng.)
//    · Lớp `kiemTraChiUpdate()` chặn mọi câu không bắt đầu bằng UPDATE hoặc chứa từ khoá cấm, TRƯỚC khi chạm CSDL.
//    · KHÔNG tạo dự án/vật tư giả: chỉ trỏ về bản ghi CÓ THẬT đã tồn tại. Những mồ côi cần BỊA master data
//      (dự án/vật tư không tồn tại) thì tệp này KHÔNG tự làm — in ra ở mục [4] để người dùng chốt.
//
// ✅ IDEMPOTENT: mỗi lần sửa đều qua bước DÒ (SELECT) tìm đúng dòng đang hỏng ⇒ chạy lại lần 2 không còn
//    dòng nào hỏng ⇒ 0 câu UPDATE được phát.
//
// Cách chạy:
//   node tools/fix-p2-test-data.mjs              # sửa thật
//   node tools/fix-p2-test-data.mjs --dry-run    # chỉ in kế hoạch, KHÔNG chạm CSDL

import { execFileSync } from "node:child_process";
import { dem } from "./lib/p2-gates.mjs";

const MYSQL = process.env.MYSQL_BIN || "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
const DB = process.env.MYSQL_DB || "vntech_erp";
const DRY = process.argv.includes("--dry-run");
const TS = "2026-09-21 09:00:00.000";
/** Dự án mẫu — nơi mọi dữ liệu Phase 2 đang sống. */
const PROJECT = "PRJ_fdbfab20-bf1f-4ad5-8159-7dcc582140c3";
/** MR dùng làm cha khi PO mồ côi KHÔNG có dòng nào để suy ra PR (không xảy ra trên dữ liệu hiện tại). */
const MR_DU_PHONG = "MR_46cee316-73f1-467b-905a-2c74f2bd5ce7";

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
function q(cau) {
  const out = mysql(["-N", "-B", "-e", cau]);
  return out.split(/\r?\n/).filter((l) => l.trim() !== "").map((l) => l.split("\t"));
}
const one = (cau) => {
  const r = q(cau);
  return r.length ? r[0][0] : null;
};
/** `mysql -N -B` in giá trị NULL ra chuỗi "NULL" ⇒ phải quy về null thật, nếu không sẽ ghi chuỗi 'NULL' vào CSDL. */
const sach = (v) => (v === null || v === undefined || v === "NULL" || v === "" ? null : v);
/** Lấy 1 giá trị vô hướng đã làm sạch. */
const oneSach = (cau) => sach(one(cau));
const S = (v) =>
  v === null || v === undefined ? "NULL" : v === "" ? "''" : `'${String(v).replace(/\\/g, "\\\\").replace(/'/g, "''")}'`;

// ─── LỚP CHẶN: CHỈ UPDATE ────────────────────────────────────────────────────
const TU_KHOA_CAM = /(?:^|[^\w])(DELETE|DROP|TRUNCATE|ALTER|CREATE|REPLACE|GRANT|REVOKE|RENAME|CALL|INSERT)(?:[^\w]|$)/i;
function kiemTraChiUpdate(danhSach) {
  for (const st of danhSach) {
    if (!/^\s*UPDATE\s+/i.test(st)) throw new Error(`CHẶN: câu lệnh không phải UPDATE ⇒ ${st.slice(0, 90)}`);
    const m = st.match(TU_KHOA_CAM);
    if (m) throw new Error(`CHẶN: câu lệnh chứa từ khoá "${m[1]}" ⇒ ${st.slice(0, 90)}`);
  }
}
/** Chạy 1 câu UPDATE, trả về số dòng THỰC SỰ bị đổi (ROW_COUNT). */
function chayUpdate(cau) {
  kiemTraChiUpdate([cau]);
  if (DRY) return 0;
  const out = mysql(["-N", "-B", "-e", `${cau}\nSELECT ROW_COUNT();`]);
  const dong = out.split(/\r?\n/).filter((l) => l.trim() !== "");
  return Number(dong[dong.length - 1] || 0);
}
/** Kho nhận hợp lệ của một dự án: ưu tiên kho site → kho cùng dự án → kho tổng (đúng luật create_po). */
const khoCua = (prj) =>
  oneSach(`SELECT id FROM warehouses WHERE project_id=${S(prj)} AND active=1 AND type='site' ORDER BY code LIMIT 1`) ||
  oneSach(`SELECT id FROM warehouses WHERE project_id=${S(prj)} AND active=1 ORDER BY code LIMIT 1`) ||
  oneSach("SELECT id FROM warehouses WHERE active=1 ORDER BY (type='central') DESC, code LIMIT 1");
/** Kho nếu CÒN TỒN TẠI, ngược lại null (tránh ghi lại một id đã hỏng). */
const khoNeuCon = (wh) => (wh && wh !== "NULL" ? oneSach(`SELECT id FROM warehouses WHERE id=${S(wh)}`) : null);
/** Dự án nếu CÒN TỒN TẠI, ngược lại null. */
const duAnNeuCon = (prj) => (prj && prj !== "NULL" ? oneSach(`SELECT id FROM projects WHERE id=${S(prj)}`) : null);
/** Vật tư CÓ THẬT được dùng nhiều nhất — dùng khi không suy được vật tư từ dòng PR anh em. */
const vatTuNhieuNhat = () =>
  oneSach(
    "SELECT mri.material_id FROM material_request_items mri JOIN materials m ON m.id=mri.material_id " +
      "GROUP BY mri.material_id ORDER BY COUNT(*) DESC, mri.material_id LIMIT 1"
  );

// ─── CÁC LẦN SỬA ─────────────────────────────────────────────────────────────
/** Mỗi hàm trả về { ma, tieuDe, viSao, dong: [{id, cot, truoc, sau, nhan}], cau: <SQL>|null }. */
function keHoach() {
  const ds = [];
  const khoDuPhong = khoCua(PROJECT);

  // (1) PO mồ côi — GỠ BLOCKED: chọn PR theo CHÍNH dòng của PO (không đoán)
  {
    const dong = q(
      `SELECT po.id, po.po_no, IFNULL(po.request_id,'<NULL>'), po.project_id,
              (SELECT MIN(mri.request_id) FROM purchase_order_items poi
                 JOIN material_request_items mri ON mri.id=poi.request_item_id
                WHERE poi.purchase_order_id=po.id AND mri.request_id IS NOT NULL
                  AND EXISTS (SELECT 1 FROM material_requests mr2 WHERE mr2.id=mri.request_id)) AS pr_tu_dong_po
         FROM purchase_orders po
         LEFT JOIN material_requests mr ON mr.id=po.request_id
        WHERE po.request_id IS NULL OR po.request_id='' OR mr.id IS NULL
        ORDER BY po.po_no`
    ).map(([id, no, cu, prj, tuDong]) => ({
      id,
      cot: "request_id",
      truoc: cu === "NULL" ? "<NULL>" : cu,
      sau: sach(tuDong) || MR_DU_PHONG,
      nhan: `${no} · chọn PR = ${sach(tuDong) || MR_DU_PHONG} (${sach(tuDong) ? "suy từ chính dòng của PO → PR cha" : "dự phòng"})`,
      prj,
    }));
    ds.push({
      ma: "F1",
      tieuDe: "PO mồ côi → gán request_id (ĐIỀU KIỆN ĐỂ CỔNG TRACE ĐẠT)",
      viSao:
        "Căn cứ DUY NHẤT không phải suy đoán: dòng purchase_order_items của chính PO trỏ tới một dòng PR " +
        "(material_request_items) đã có thật; PR cha của dòng đó là PR mà PO này thuộc về. " +
        "Điều kiện thật của mã: create_po (system-route.mjs L1427) và receive_goods (L1504) đều INNER JOIN " +
        "material_requests qua purchase_orders.request_id — request_id NULL thì PO không tạo/không nhận hàng được.",
      dong,
      cau: (r) => `UPDATE purchase_orders SET request_id=${S(r.sau)}, updated_at=${S(TS)} WHERE id=${S(r.id)} AND (request_id IS NULL OR request_id='');`,
    });
  }

  // (2) PO có kho nhận KHÔNG tồn tại
  {
    const dong = q(
      `SELECT po.id, po.po_no, po.project_id, po.receiving_warehouse_id FROM purchase_orders po
        WHERE NOT EXISTS (SELECT 1 FROM warehouses w WHERE w.id=po.receiving_warehouse_id) ORDER BY po.po_no`
    ).map(([id, no, prj, wh]) => ({
      id,
      cot: "receiving_warehouse_id",
      truoc: wh,
      sau: khoCua(prj) || khoDuPhong,
      nhan: `${no} · kho ${wh} KHÔNG tồn tại → thay bằng kho CÓ THẬT của chính dự án PO`,
    }));
    ds.push({
      ma: "F2",
      tieuSo: "kho nhận PO",
      tieuDe: "PO trỏ tới kho KHÔNG tồn tại",
      viSao: "Luật thật create_po (L1428): kho nhận PO phải THUỘC ĐÚNG dự án và đang hoạt động ⇒ trỏ về kho site có thật của dự án.",
      dong,
      cau: (r) => `UPDATE purchase_orders SET receiving_warehouse_id=${S(r.sau)}, updated_at=${S(TS)} WHERE id=${S(r.id)};`,
    });
  }

  // (3) GRN có kho KHÔNG tồn tại (kho của phiếu nhập phải bằng kho nhận của PO — receive_goods L1543)
  {
    const dong = q(
      `SELECT gr.id, gr.receipt_no, gr.warehouse_id, gr.purchase_order_id,
              (SELECT po.project_id FROM purchase_orders po WHERE po.id=gr.purchase_order_id) AS prj_po
         FROM goods_receipts gr
        WHERE NOT EXISTS (SELECT 1 FROM warehouses w WHERE w.id=gr.warehouse_id) ORDER BY gr.receipt_no`
    ).map(([id, no, wh, po, prjPo]) => {
      // Ưu tiên 1: kho nhận của PO nếu kho đó CÒN TỒN TẠI (sau F2 thì PO đã có kho hợp lệ).
      // Ưu tiên 2: kho có thật của dự án PO. (KHÔNG dùng lại chính id đang hỏng.)
      const cuaPo = po ? khoNeuCon(oneSach(`SELECT receiving_warehouse_id FROM purchase_orders WHERE id=${S(po)}`)) : null;
      const cuaDuAn = prjPo ? khoCua(prjPo) : null;
      return {
        id,
        cot: "warehouse_id",
        truoc: wh,
        sau: cuaPo || cuaDuAn || khoDuPhong,
        nhan: `${no} · kho ${wh} KHÔNG tồn tại → ${cuaPo ? "theo kho nhận của PO" : "theo kho có thật của dự án PO"} (${cuaPo || cuaDuAn || khoDuPhong})`,
      };
    });
    ds.push({
      ma: "F3",
      tieuSo: "kho phiếu nhập",
      tieuDe: "Phiếu nhập trỏ tới kho KHÔNG tồn tại",
      viSao: "Luật thật receive_goods (L1543): goods_receipts.warehouse_id được gán bằng chính kho nhận của PO.",
      dong,
      cau: (r) => `UPDATE goods_receipts SET warehouse_id=${S(r.sau)}, updated_at=${S(TS)} WHERE id=${S(r.id)};`,
    });
  }

  // (4) GRN.received_by đang chứa TÊN người thay vì mã người dùng
  {
    const dong = q(
      `SELECT gr.id, gr.receipt_no, gr.received_by, u.id FROM goods_receipts gr JOIN users u ON u.full_name = gr.received_by
        WHERE NOT EXISTS (SELECT 1 FROM users x WHERE x.id=gr.received_by) ORDER BY gr.receipt_no`
    ).map(([id, no, cu, uid]) => ({
      id,
      cot: "received_by",
      truoc: cu,
      sau: uid,
      nhan: `${no} · "${cu}" là TÊN hiển thị → thay bằng mã người dùng thật ${uid}`,
    }));
    ds.push({
      ma: "F4",
      tieuSo: "người nhận hàng",
      tieuDe: "received_by chứa TÊN hiển thị (không phải mã người dùng)",
      viSao: "Cột này là khoá mềm tới users.id (mã hoá ở L1543: bind(user.id)). Khớp theo ĐÚNG họ tên trong bảng users — không đoán.",
      dong,
      cau: (r) => `UPDATE goods_receipts SET received_by=${S(r.sau)}, updated_at=${S(TS)} WHERE id=${S(r.id)};`,
    });
  }

  // (5) PR trỏ tới dự án KHÔNG tồn tại  (do đợt seed kế thừa project_id mồ côi từ procurement_allocations)
  {
    const dong = q(
      `SELECT mr.id, mr.request_no, mr.project_id FROM material_requests mr
        WHERE NOT EXISTS (SELECT 1 FROM projects p WHERE p.id=mr.project_id) ORDER BY mr.request_no`
    ).map(([id, no, prj]) => ({
      id,
      cot: "project_id",
      truoc: prj,
      sau: PROJECT,
      nhan: `${no} · dự án ${prj} KHÔNG tồn tại → đưa về dự án mẫu (nơi mọi dữ liệu Phase 2 đang sống)`,
    }));
    ds.push({
      ma: "F5",
      tieuSo: "dự án của PR",
      tieuDe: "PR trỏ tới dự án KHÔNG tồn tại (do tệp seed kế thừa id mồ côi)",
      viSao:
        "Bảng projects chỉ có 2 dòng (DA-MAU-01, PRJ-DEMO-01); các id PRJ_62845d6e/PRJ_daedb25b/PRJ_370df722 " +
        "xuất hiện trong chứng từ nhưng KHÔNG có trong bảng projects. Không bịa dự án mới (sẽ đổi danh sách dự án " +
        "trên UI) ⇒ trỏ về dự án mẫu. Xem mục [4] để biết các mồ côi CÒN LẠI cần người dùng chốt.",
      dong,
      cau: (r) => `UPDATE material_requests SET project_id=${S(r.sau)}, updated_at=${S(TS)} WHERE id=${S(r.id)};`,
    });
  }

  // (6) PO trỏ tới dự án KHÔNG tồn tại → theo dự án của chính PR (chạy SAU F5 nên PR đã hợp lệ)
  {
    const dong = q(
      `SELECT po.id, po.po_no, po.project_id,
              (SELECT mr.project_id FROM material_requests mr WHERE mr.id=po.request_id) AS prj_pr
         FROM purchase_orders po
        WHERE NOT EXISTS (SELECT 1 FROM projects p WHERE p.id=po.project_id) ORDER BY po.po_no`
    ).map(([id, no, prj, prjPr]) => ({
      id,
      cot: "project_id",
      truoc: prj,
      // Dự án của PR nguồn chỉ dùng được nếu nó CÒN TỒN TẠI (F5 có thể đã đưa PR về dự án mẫu ở lượt trước).
      sau: duAnNeuCon(prjPr) || PROJECT,
      nhan: `${no} · dự án ${prj} KHÔNG tồn tại → theo dự án của PR nguồn (${duAnNeuCon(prjPr) || PROJECT})`,
    }));
    ds.push({
      ma: "F6",
      tieuSo: "dự án của PO",
      tieuDe: "PO trỏ tới dự án KHÔNG tồn tại",
      viSao: "PO phải cùng dự án với PR nguồn (create_po lấy mr.projectId) và kho nhận phải thuộc dự án đó.",
      dong,
      cau: (r) => `UPDATE purchase_orders SET project_id=${S(r.sau)}, updated_at=${S(TS)} WHERE id=${S(r.id)};`,
    });
  }

  // (7) Dòng PR trỏ tới vật tư KHÔNG tồn tại
  {
    const vtNhieu = vatTuNhieuNhat();
    const dong = q(
      `SELECT mri.id, mri.request_id, mri.material_id,
              (SELECT mri2.material_id FROM material_request_items mri2
                WHERE mri2.request_id=mri.request_id AND mri2.id<>mri.id
                  AND EXISTS (SELECT 1 FROM materials m WHERE m.id=mri2.material_id)
                ORDER BY mri2.line_no LIMIT 1) AS vt_anh_em
         FROM material_request_items mri
        WHERE NOT EXISTS (SELECT 1 FROM materials m WHERE m.id=mri.material_id)
        ORDER BY mri.id`
    ).map(([id, rid, vt, anhEm]) => {
      const anhEmThat = sach(anhEm);
      return {
        id,
        cot: "material_id",
        truoc: vt,
        sau: anhEmThat || vtNhieu,
        nhan: `${rid} · vật tư ${vt} KHÔNG tồn tại → ${anhEmThat ? `lấy vật tư của dòng PR anh em (${anhEmThat})` : `vật tư có thật dùng nhiều nhất (${vtNhieu})`}`,
      };
    });
    ds.push({
      ma: "F7",
      tieuSo: "vật tư của dòng PR",
      tieuDe: "Dòng PR trỏ tới vật tư KHÔNG tồn tại",
      viSao: "Ưu tiên bằng chứng mạnh nhất: dòng PR ANH EM trong cùng phiếu đã trỏ tới vật tư có thật ⇒ dùng lại chính vật tư đó.",
      dong,
      cau: (r) => `UPDATE material_request_items SET material_id=${S(r.sau)}, updated_at=${S(TS)} WHERE id=${S(r.id)};`,
    });
  }

  return ds;
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
function main() {
  console.log("PHASE 2 — SỬA DỮ LIỆU TEST HỎNG THAM CHIẾU   (⚠️ CHỈ UPDATE: không DELETE/DROP/TRUNCATE/ALTER/INSERT)");
  console.log(`CSDL: ${DB}${DRY ? "   [CHẾ ĐỘ --dry-run: KHÔNG chạm CSDL]" : ""}`);

  const ke = keHoach();
  const cau = [];
  for (const k of ke) for (const r of k.dong) cau.push(k.cau(r));
  kiemTraChiUpdate(cau);

  console.log("\n" + "─".repeat(100) + "\n[1] KẾ HOẠCH SỬA\n" + "─".repeat(100));
  let tong = 0;
  for (const k of ke) {
    console.log(`  ${k.ma}  ${k.tieuDe}`);
    console.log(`      vì sao: ${k.viSao}`);
    if (!k.dong.length) {
      console.log("      → không có dòng nào hỏng (đã sạch / đã sửa trước đó)");
      continue;
    }
    for (const r of k.dong) {
      console.log(`      · ${r.nhan}`);
      console.log(`        ${dem(r.cot, 24)} TRƯỚC = ${dem(String(r.truoc).slice(0, 44), 46)} SAU = ${r.sau}`);
    }
    tong += k.dong.length;
  }
  console.log(`  ⇒ TỔNG số dòng sẽ bị UPDATE: ${tong} · ${cau.length} câu UPDATE · đã qua lớp chặn CHỈ-UPDATE`);

  if (DRY) {
    console.log("\n[dry-run] Không sửa gì. Bỏ --dry-run để chạy thật.");
    return 0;
  }

  console.log("\n" + "─".repeat(100) + "\n[2] THỰC THI\n" + "─".repeat(100));
  let soCau = 0;
  let soDong = 0;
  for (const k of ke) {
    let n = 0;
    for (const r of k.dong) {
      const changed = chayUpdate(k.cau(r));
      soCau++;
      n += changed;
      soDong += changed;
    }
    console.log(`  ${k.ma}  ${dem(k.tieuDe.slice(0, 56), 58)} ${k.dong.length} dòng dự kiến → ${n} dòng THỰC SỰ đổi`);
  }
  console.log(`  ⇒ Đã chạy ${soCau} câu UPDATE · ${soDong} dòng bị đổi (0 DELETE/DROP/TRUNCATE/ALTER/INSERT).`);

  // ── [3] KIỂM LẠI
  console.log("\n" + "─".repeat(100) + "\n[3] KIỂM LẠI SAU KHI SỬA\n" + "─".repeat(100));
  const conLai = [
    ["PO.request_id mồ côi", `SELECT COUNT(*) FROM purchase_orders po LEFT JOIN material_requests mr ON mr.id=po.request_id WHERE po.request_id IS NULL OR po.request_id='' OR mr.id IS NULL`],
    ["PO kho nhận không tồn tại", `SELECT COUNT(*) FROM purchase_orders po WHERE NOT EXISTS (SELECT 1 FROM warehouses w WHERE w.id=po.receiving_warehouse_id)`],
    ["GRN kho không tồn tại", `SELECT COUNT(*) FROM goods_receipts gr WHERE NOT EXISTS (SELECT 1 FROM warehouses w WHERE w.id=gr.warehouse_id)`],
    ["GRN.received_by không phải mã ND", `SELECT COUNT(*) FROM goods_receipts gr WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id=gr.received_by)`],
    ["MR dự án không tồn tại", `SELECT COUNT(*) FROM material_requests mr WHERE NOT EXISTS (SELECT 1 FROM projects p WHERE p.id=mr.project_id)`],
    ["PO dự án không tồn tại", `SELECT COUNT(*) FROM purchase_orders po WHERE NOT EXISTS (SELECT 1 FROM projects p WHERE p.id=po.project_id)`],
    ["MRI vật tư không tồn tại", `SELECT COUNT(*) FROM material_request_items mri WHERE NOT EXISTS (SELECT 1 FROM materials m WHERE m.id=mri.material_id)`],
  ];
  for (const [nhan, sqlText] of conLai) {
    const n = Number(one(sqlText));
    console.log(`  ${dem(nhan, 34)} ${dem(n, 5)} ${n === 0 ? "✔ sạch" : "✗ CÒN"}`);
  }

  // ── [4] MỒ CÔI CÒN LẠI — cần người dùng chốt (không tự bịa master data)
  console.log("\n" + "─".repeat(100) + "\n[4] MỒ CÔI KHÔNG TỰ SỬA (cần BỊA master data ⇒ chờ người dùng chốt)\n" + "─".repeat(100));
  const paPrj = q("SELECT project_id, COUNT(*) FROM procurement_allocations t WHERE NOT EXISTS (SELECT 1 FROM projects d WHERE d.id=t.project_id) GROUP BY project_id ORDER BY project_id");
  const paVt = q("SELECT material_id, COUNT(*) FROM procurement_allocations t WHERE NOT EXISTS (SELECT 1 FROM materials d WHERE d.id=t.material_id) GROUP BY material_id ORDER BY material_id");
  if (paPrj.length || paVt.length) {
    console.log("  procurement_allocations (bảng này KHÔNG được đợt seed ghi vào ⇒ mồ côi CÓ TỪ TRƯỚC):");
    for (const [p, n] of paPrj) console.log(`      · project_id ${dem(p, 46)} ${n} dòng — dự án này không có trong bảng projects`);
    for (const [m, n] of paVt) console.log(`      · material_id ${dem(m, 46)} ${n} dòng — vật tư này không có trong bảng materials`);
    console.log("  ⇒ 2 cách, người dùng chọn:");
    console.log("      (a) INSERT dự án/vật tư còn thiếu (phải ĐẶT TÊN mới ⇒ thêm dòng vào danh mục dự án/vật tư trên UI);");
    console.log("      (b) UPDATE các dòng procurement_allocations về dự án/vật tư có thật (đổi nghĩa 3 chuỗi chứng từ cũ).");
  } else {
    console.log("  Không còn.");
  }
  console.log("");
  return 0;
}

let code;
try {
  code = main();
} catch (e) {
  console.error("\n[BLOCKED] Sửa DỮ LIỆU DỪNG — không đổi thêm gì.");
  console.error(`  lỗi: ${e && e.message ? e.message : e}`);
  code = 2;
}
process.exit(code);
