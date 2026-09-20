#!/usr/bin/env node
// VNTECH ERP V5.3.0 — PHASE 2 · CỔNG ĐO "1 PR → N PO" + "KHÔNG VƯỢT SỐ LƯỢNG ĐÃ DUYỆT"
//
// VÌ SAO CÓ CỔNG NÀY: đặc tả Phase 2 (§9/§10) yêu cầu một phiếu PR có thể TÁCH thành nhiều PO (theo nhà
// cung cấp / theo dòng) và cấm đặt vượt số lượng đã duyệt. Audit trước ghi nhận **0 MR có ≥ 2 PO** nghĩa là
// ĐƯỜNG ĐI đã có trong mã nhưng CHƯA từng chạy thật ⇒ chưa có bằng chứng dữ liệu. Cổng này ĐO LẠI và nói
// THẬT nếu vẫn 0, đồng thời là cổng chặn cho lỗi vượt số lượng khi tính năng tách PO bắt đầu được dùng.
//
// Cách chạy:  node tools/p2-split-po-audit.mjs
// Biến môi trường: MYSQL_BIN (đường dẫn mysql.exe), MYSQL_DB (mặc định vntech_erp).
//
// ⚠️ CHỈ ĐỌC — 2 lớp khoá: (a) mọi câu lệnh là `SELECT`; (b) mọi lần gọi đều kèm
//    `SET SESSION TRANSACTION READ ONLY` nên CSDL TỪ CHỐI lệnh ghi. Không INSERT/UPDATE/DELETE/ALTER/CREATE.
//
// NGƯỠNG (in nguyên văn khi chạy — không giấu ngưỡng):
//   [BẮT BUỘC = 0] C1 Số DÒNG PR bị đặt VƯỢT: `SUM(poi.ordered_qty) > mri.approved_purchase_qty`
//                  (dung sai 0.0001 cho DECIMAL(18,4)). Đặt vượt = vượt quyền duyệt ⇒ phải chặn.
//   [BẮT BUỘC = 0] C2 Số DÒNG PR lệch tổng: `SUM(poi.ordered_qty)` ≠ `material_request_items.ordered_qty`
//                  (engine rollup và dòng PR phải khớp nhau).
//   [NGƯỠNG ĐO, KHÔNG PHẢI CỔNG] B1 Số MR có ≥ 2 PO. Đây là NĂNG LỰC cần bằng chứng, KHÔNG phải lỗi:
//                  = 0 nghĩa là "chưa từng chạy thật" ⇒ in UNKNOWN, KHÔNG tính là chặng đứt.
//   exit 0 = C1 = 0 và C2 = 0 (không vi phạm số lượng) · exit 1 = có vi phạm · exit 2 = KHÔNG kết nối được MySQL

import { execFileSync } from "node:child_process";
import { demMrNhieuPo, dongVuotSoLuong, lechTong, tiLe, ketLuan, dem, DUNG_SAI_SL } from "./lib/p2-gates.mjs";

const MYSQL = process.env.MYSQL_BIN || "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
const DB = process.env.MYSQL_DB || "vntech_erp";
const KHOA_CHI_DOC = "SET SESSION TRANSACTION READ ONLY";

/** Chạy SELECT trong phiên CHỈ ĐỌC. */
function sql(cau) {
  const out = execFileSync(
    MYSQL,
    ["--default-character-set=utf8mb4", "-uvntech", "-pvntech", DB, "-N", "-B", "-e", `${KHOA_CHI_DOC}; ${cau}`],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
  );
  if (/\bERROR\s+\d+\s+\(/.test(out)) throw new Error(`MySQL từ chối: ${cau}\n${out}`);
  return out
    .split(/\r?\n/)
    .filter((l) => l.trim() !== "")
    .map((l) => l.split("\t"));
}
const one = (cau) => {
  const r = sql(cau);
  return r.length ? r[0][0] : "0";
};
/** Kiểm tra cột có thật (không giả định lược đồ). */
const coCot = (bang, cot) =>
  one(
    `SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() ` +
      `AND table_name='${bang}' AND column_name='${cot}'`
  ) === "1";
function tieuDe(t) {
  console.log(`\n${"─".repeat(100)}\n${t}\n${"─".repeat(100)}`);
}

function main() {
  console.log('PHASE 2 — CỔNG ĐO TÁCH PO: "1 PR → N PO" + KHÔNG VƯỢT SỐ LƯỢNG ĐÃ DUYỆT   (CHỈ ĐỌC)');
  console.log(`CSDL: ${DB}`);

  // Tiền đề: lược đồ phải cho phép 1 PR → N PO (request_id KHÔNG unique)
  tieuDe("[0] TIỀN ĐỀ — lược đồ có cho phép 1 PR → N PO không?");
  const soFK = Number(
    one(
      "SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() " +
        "AND constraint_type='FOREIGN KEY' AND table_name='purchase_orders'"
    )
  );
  const uqRequestId = sql(
    "SELECT index_name, non_unique FROM information_schema.statistics " +
      "WHERE table_schema=DATABASE() AND table_name='purchase_orders' AND column_name='request_id'"
  );
  console.log(`  FK trên purchase_orders:                 ${soFK}  (0 ⇒ CSDL không ràng buộc quan hệ)`);
  console.log(
    `  Chỉ mục chứa purchase_orders.request_id: ${
      uqRequestId.length ? uqRequestId.map(([n, u]) => `${n}(unique=${u === "0" ? "CÓ" : "không"})`).join(", ") : "(không có chỉ mục)"
    }`
  );
  const choPhepNhieu = !uqRequestId.some(([, u]) => u === "0");
  console.log(
    choPhepNhieu
      ? "  ⇒ KHÔNG có unique trên request_id ⇒ lược đồ CHO PHÉP 1 PR → N PO."
      : "  ⚠ CÓ unique trên request_id ⇒ lược đồ CHẶN 1 PR → N PO (mâu thuẫn đặc tả §9)."
  );
  if (!coCot("purchase_order_items", "request_item_id") || !coCot("material_request_items", "approved_purchase_qty")) {
    throw new Error("Thiếu cột bắt buộc: purchase_order_items.request_item_id hoặc material_request_items.approved_purchase_qty");
  }

  // ── [1] ĐO 1 PR → N PO
  tieuDe("[1] ĐO THẬT: bao nhiêu PR (material_requests) đã tách thành ≥ 2 PO?");
  const mrTong = Number(one("SELECT COUNT(*) FROM material_requests"));
  const mrCoPo = Number(
    one("SELECT COUNT(*) FROM material_requests mr WHERE EXISTS (SELECT 1 FROM purchase_orders po WHERE po.request_id=mr.id)")
  );
  const rows = sql(
    "SELECT mr.id, mr.request_no, COUNT(po.id) FROM material_requests mr " +
      "JOIN purchase_orders po ON po.request_id=mr.id GROUP BY mr.id, mr.request_no"
  ).map(([id, no, n]) => ({ request_id: id, request_no: no, n: Number(n) }));
  const soMrNhieuPo = demMrNhieuPo(rows);
  const maxPo = rows.reduce((m, r) => Math.max(m, r.n), 0);
  console.log(`  MR tổng:                            ${mrTong}`);
  console.log(`  MR có ít nhất 1 PO:                 ${mrCoPo}`);
  console.log(`  MR có ≥ 2 PO  ← chỉ số cần đo:      ${soMrNhieuPo}`);
  console.log(`  Số PO nhiều nhất trên 1 MR:         ${maxPo}`);
  if (rows.length) {
    console.log("  ▼ PHÂN BỐ PO TRÊN MỖI MR CÓ PO:");
    for (const r of rows.sort((a, b) => b.n - a.n)) console.log(`      · ${dem(r.request_no, 34)} PO=${r.n}`);
  }
  console.log(
    soMrNhieuPo === 0
      ? "  ⇒ SỐ THẬT: 0 MR có ≥ 2 PO. Đường đi tách PO CÓ trong mã nhưng CHƯA có bằng chứng dữ liệu (UNKNOWN)."
      : `  ⇒ SỐ THẬT: ${soMrNhieuPo} MR đã tách ≥ 2 PO ⇒ đường đi tách PO đã chạy thật.`
  );

  // ── [2] VƯỢT SỐ LƯỢNG theo từng dòng PR
  tieuDe("[2] VƯỢT SỐ LƯỢNG: SUM(poi.ordered_qty) vs material_request_items.approved_purchase_qty (theo TỪNG DÒNG PR)");
  const dong = sql(
    "SELECT i.id, i.line_no, i.approved_purchase_qty, IFNULL(SUM(poi.ordered_qty),0) " +
      "FROM material_request_items i LEFT JOIN purchase_order_items poi ON poi.request_item_id=i.id " +
      "GROUP BY i.id, i.line_no, i.approved_purchase_qty"
  ).map(([id, line, approved, ordered]) => ({ id, line, approved: Number(approved), ordered: Number(ordered) }));
  const vuot = dongVuotSoLuong(dong);
  console.log(`  Dòng PR đo được:                    ${dong.length}`);
  console.log(`  Dòng PR bị ĐẶT VƯỢT (dung sai ${DUNG_SAI_SL}):  ${vuot.length}`);
  if (vuot.length) {
    console.log("  ▼ CÁC DÒNG VƯỢT SỐ LƯỢNG:");
    for (const r of vuot) {
      console.log(`      · ${dem(r.id, 46)} dòng ${dem(r.line, 3)} approved=${dem(r.approved, 12)} ordered=${dem(r.ordered, 12)} VƯỢT=${r.vuot}`);
    }
  } else {
    console.log("  ⇒ Không dòng nào đặt vượt số lượng đã duyệt.");
  }

  // ── [3] NHẤT QUÁN TỔNG theo request_id
  tieuDe("[3] NHẤT QUÁN TỔNG theo request_id: SUM(poi.ordered_qty) vs dòng PR rollup");
  const rollup = sql(
    "SELECT mr.request_no, IFNULL(SUM(poi.ordered_qty),0), IFNULL(SUM(i.ordered_qty),0) " +
      "FROM material_requests mr " +
      "LEFT JOIN purchase_orders po ON po.request_id=mr.id " +
      "LEFT JOIN purchase_order_items poi ON poi.purchase_order_id=po.id " +
      "LEFT JOIN material_request_items i ON i.request_id=mr.id " +
      "WHERE po.id IS NOT NULL GROUP BY mr.request_no ORDER BY mr.request_no"
  );
  console.log("  (a) Theo từng MR — đối chiếu 2 cách rollup:");
  for (const [no, tuPOI, tuMRI] of rollup) {
    const lech = Math.abs(Number(tuPOI) - Number(tuMRI));
    console.log(
      `      · ${dem(no, 34)} SUM(poi.ordered_qty)=${dem(tuPOI, 14)} SUM(mri.ordered_qty)=${dem(tuMRI, 14)} ` +
        `${lech <= DUNG_SAI_SL ? "khớp" : `LỆCH ${lech}`}`
    );
  }
  if (!rollup.length) console.log("      (không MR nào có PO)");
  const lechTheoDong = lechTong(
    sql(
      "SELECT i.id, i.ordered_qty, IFNULL(SUM(poi.ordered_qty),0) " +
        "FROM material_request_items i LEFT JOIN purchase_order_items poi ON poi.request_item_id=i.id " +
        "GROUP BY i.id, i.ordered_qty"
    ).map(([id, mriOrdered, poiSum]) => ({ id, mriOrdered: Number(mriOrdered), poiSum: Number(poiSum) }))
  );
  console.log(`  (b) Theo từng dòng PR — dòng có LỆCH TỔNG: ${lechTheoDong.length}`);
  if (lechTheoDong.length) {
    for (const r of lechTheoDong) {
      console.log(`      · ${dem(r.id, 46)} mri.ordered_qty=${dem(r.mriOrdered, 12)} SUM(poi)=${dem(r.poiSum, 12)} lệch=${r.lech}`);
    }
  }

  // ── [4] TỔNG KẾT
  tieuDe("[4] BẢNG TỔNG KẾT");
  const chang = [
    { ma: "C1", ten: "Dòng PR đặt VƯỢT số lượng duyệt", truyDuoc: dong.length - vuot.length, tong: dong.length, moCoi: vuot.length, dat: vuot.length === 0 },
    { ma: "C2", ten: "Dòng PR lệch tổng rollup", truyDuoc: dong.length - lechTheoDong.length, tong: dong.length, moCoi: lechTheoDong.length, dat: lechTheoDong.length === 0 },
  ];
  console.log(`  ${dem("Mã", 4)}${dem("Chặng", 34)}${dem("Đạt/Tổng", 16)}${dem("%", 9)}Ngưỡng                 Kết luận`);
  for (const c of chang) {
    console.log(
      `  ${dem(c.ma, 4)}${dem(c.ten, 34)}${dem(`${c.truyDuoc}/${c.tong}`, 16)}${dem(tiLe(c.truyDuoc, c.tong), 9)}` +
        `${dem("vi phạm = 0", 23)}${c.dat ? "ĐẠT" : "KHÔNG ĐẠT"}`
    );
  }
  console.log(
    `  ${dem("B1", 4)}${dem("MR có ≥2 PO (năng lực)", 34)}${dem(`${soMrNhieuPo} MR`, 16)}` +
      `${dem("—", 9)}${dem("cần bằng chứng", 23)}${soMrNhieuPo > 0 ? "CÓ BẰNG CHỨNG" : "UNKNOWN (chưa chạy thật)"}`
  );
  // ── [5] KẾT LUẬN
  tieuDe("[5] KẾT LUẬN CỔNG");
  const kl = ketLuan(chang);
  for (const c of kl.hong) console.log(`  [HỎNG] ${c.ma} ${c.ten}: ${c.moCoi} dòng vi phạm`);
  console.log(
    choPhepNhieu
      ? "  [ĐẠT] Lược đồ cho phép tách PO: không có unique trên purchase_orders.request_id."
      : "  [HỎNG] Lược đồ CHẶN tách PO: có unique trên purchase_orders.request_id."
  );
  console.log(
    `  [SỐ THẬT] MR có ≥ 2 PO = ${soMrNhieuPo} · Số PO nhiều nhất/1 MR = ${maxPo} · MR có ≥1 PO = ${mrCoPo}/${mrTong}`
  );
  if (soMrNhieuPo === 0) {
    console.log("  [UNKNOWN] Năng lực 1 PR → N PO chưa có ca thật nào ⇒ KHÔNG kết luận được là chạy đúng hay sai.");
  }
  console.log("");
  if (kl.dat && choPhepNhieu) {
    console.log("  KẾT LUẬN: ĐẠT — không có dòng nào đặt vượt số lượng và không lệch tổng rollup.");
  } else {
    console.log(`  KẾT LUẬN: KHÔNG ĐẠT — ${kl.soHong}/${kl.soTong} phép đo vi phạm${choPhepNhieu ? "" : " + lược đồ chặn tách PO"}.`);
  }
  console.log("");
  return kl.dat && choPhepNhieu ? 0 : 1;
}

let code;
try {
  code = main();
} catch (e) {
  console.error("\n[BLOCKED] Không kết nối / không truy vấn được MySQL — DỪNG, KHÔNG suy đoán số liệu.");
  console.error(`  mysql: ${MYSQL}`);
  console.error(`  lỗi:  ${e && e.message ? e.message : e}`);
  process.exit(2);
}
process.exit(code);
