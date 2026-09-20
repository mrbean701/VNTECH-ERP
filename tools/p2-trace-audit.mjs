#!/usr/bin/env node
// VNTECH ERP V5.3.0 — PHASE 2 · CỔNG ĐO TRUY VẾT CHUỖI PR → PI → PO → POI → GRN → GRI → SL
//
// VÌ SAO CÓ CỔNG NÀY: CSDL `vntech_erp` có **0 khoá ngoại** (cổng này tự đo lại ở mục [0]) nên mọi quan hệ
// chỉ là QUY ƯỚC do mã ứng dụng gánh. Hệ quả đã có thật: 1 PO `request_id = NULL` và 10/16 GRN rỗng dòng.
// Không có cổng tự động thì các vết đứt này chỉ lộ ra SAU KHI người dùng đã nhận hàng. Cổng này đo lại
// TỪ DỮ LIỆU THẬT mỗi lần chạy và in ra SỐ THẬT, không phải suy đoán.
//
// Cách chạy:  node tools/p2-trace-audit.mjs
// Biến môi trường: MYSQL_BIN (đường dẫn mysql.exe), MYSQL_DB (mặc định vntech_erp).
//
// ⚠️ CHỈ ĐỌC — 2 lớp khoá: (a) mọi câu lệnh là `SELECT`; (b) phiên chạy được bọc
//    `SET SESSION TRANSACTION READ ONLY` nên MSQL sẽ TỪ CHỐI mọi lệnh ghi, kể cả vô tình.
//    Không INSERT/UPDATE/DELETE/ALTER/CREATE/DROP. `tests/p2-gates-tools.test.mjs` quét lại điều này.
//
// NGƯỠNG (không giấu ngưỡng — in nguyên văn khi chạy):
//   [BẮT BUỘC = 0] A1 PO mồ côi (`request_id` NULL/rỗng hoặc trỏ PR không tồn tại)
//   [BẮT BUỘC = 0] A2 Dòng POI mồ côi (`request_item_id` trỏ PI không tồn tại)
//   [BẮT BUỘC = 0] A3 GRN mồ côi (`purchase_order_id` trỏ PO không tồn tại)
//   [BẮT BUỘC = 0] A4 Dòng SL khai `reference_type='goods_receipt'` mồ côi
//   [BẮT BUỘC = 0] B1 % GRN RỖNG DÒNG — đây là ĐỘ ĐẦY ĐỦ DỮ LIỆU: GRN rỗng dòng thì KHÔNG đối soát
//                  được số lượng của chuyến giao đó ⇒ chặng đứt ⇒ cổng ĐỎ.
//   exit 0 = chạy được VÀ không chặng nào đứt · exit 1 = có chặng đứt · exit 2 = KHÔNG kết nối được MySQL

import { execFileSync } from "node:child_process";
import { doQuanHe, tiLe, ketLuan, dem } from "./lib/p2-gates.mjs";

const MYSQL = process.env.MYSQL_BIN || "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
const DB = process.env.MYSQL_DB || "vntech_erp";

/** Câu dựng phiên: ép CSDL CHỈ ĐỌC. Gửi kèm mọi lần gọi để không phụ thuộc trạng thái trước đó. */
const KHOA_CHI_DOC = "SET SESSION TRANSACTION READ ONLY";

/** Chạy một câu SELECT trong phiên CHỈ ĐỌC, trả về mảng dòng (mảng giá trị). */
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
/** 1 dòng 1 cột. */
const one = (cau) => {
  const r = sql(cau);
  return r.length ? r[0][0] : "0";
};

function tieuDe(t) {
  console.log(`\n${"─".repeat(100)}\n${t}\n${"─".repeat(100)}`);
}

/**
 * Đo 1 chặng: tong/rong/treo trên một bảng, rồi in ra kèm tỉ lệ truy vết.
 * `dieuKienRong` phải khớp với cột NULL-được.
 */
function doChang(bang, cot, dichBang, dichCot, nhan) {
  const tong = Number(one(`SELECT COUNT(*) FROM ${bang}`));
  const rong = Number(one(`SELECT COUNT(*) FROM ${bang} WHERE ${cot} IS NULL OR ${cot}=''`));
  const treo = Number(
    one(
      `SELECT COUNT(*) FROM ${bang} t LEFT JOIN ${dichBang} d ON d.${dichCot}=t.${cot} ` +
        `WHERE t.${cot} IS NOT NULL AND t.${cot}<>'' AND d.${dichCot} IS NULL`
    )
  );
  const kq = doQuanHe({ tong, rong, treo });
  console.log(
    `  ${dem(nhan, 44)} tổng=${dem(tong, 5)} truy được=${dem(kq.truyDuoc, 5)} ` +
      `(${dem(tiLe(kq.truyDuoc, tong), 7)}) mồ côi=${dem(kq.moCoi, 4)} [NULL=${rong}, trỏ-hư=${treo}]`
  );
  return { ...kq, nhan, bang, cot, dichBang, dichCot };
}

function main() {
  console.log("PHASE 2 — CỔNG ĐO TRUY VẾT: PR→PI→PO→POI→GRN→GRI→SL   (CHỈ ĐỌC, 2 lớp khoá)");
  console.log(`CSDL: ${DB}`);
  console.log(`mysql: ${MYSQL}`);

  // ── [0] TIỀN ĐỀ
  tieuDe("[0] TIỀN ĐỀ — số khoá ngoại THẬT trong CSDL (0 ⇒ mọi quan hệ dưới đây chỉ là QUY ƯỚC)");
  const soFK = Number(
    one(
      "SELECT COUNT(*) FROM information_schema.table_constraints " +
        "WHERE constraint_schema=DATABASE() AND constraint_type='FOREIGN KEY'"
    )
  );
  console.log(`  FOREIGN KEY thật: ${soFK}`);
  console.log(
    soFK === 0
      ? "  ⇒ 0 FK: toàn vẹn tham chiếu CHỈ do mã ứng dụng gánh ⇒ cổng này là lưới an toàn duy nhất."
      : "  ⇒ Có FK thật ở một phần lược đồ."
  );

  // ── [1] PR → PO
  tieuDe("[1] CHẶNG PR (material_requests) → PO (purchase_orders)  ·  qua purchase_orders.request_id");
  const po = doChang("purchase_orders", "request_id", "material_requests", "id", "PO truy được về PR");
  if (po.moCoi > 0) {
    console.log("  ▼ DANH SÁCH PO MỒ CÔI:");
    for (const [no, rid, st] of sql(
      "SELECT po.po_no, IFNULL(po.request_id,'<NULL>'), po.status FROM purchase_orders po " +
        "LEFT JOIN material_requests mr ON mr.id=po.request_id " +
        "WHERE po.request_id IS NULL OR po.request_id='' OR mr.id IS NULL ORDER BY po.po_no"
    )) {
      console.log(`      · PO ${dem(no, 32)} request_id=${dem(rid, 46)} status=${st}`);
    }
  }

  // ── [2] PI → POI
  tieuDe("[2] CHẶNG PI (material_request_items) → POI (purchase_order_items)  ·  qua purchase_order_items.request_item_id");
  const poi = doChang(
    "purchase_order_items",
    "request_item_id",
    "material_request_items",
    "id",
    "Dòng POI truy được về dòng PR"
  );
  if (poi.moCoi > 0) {
    console.log("  ▼ VÍ DỤ DÒNG POI MỒ CÔI:");
    for (const [id, rid] of sql(
      "SELECT poi.id, IFNULL(poi.request_item_id,'<NULL>') FROM purchase_order_items poi " +
        "LEFT JOIN material_request_items i ON i.id=poi.request_item_id " +
        "WHERE poi.request_item_id IS NULL OR poi.request_item_id='' OR i.id IS NULL LIMIT 20"
    )) {
      console.log(`      · ${dem(id, 46)} request_item_id=${rid}`);
    }
  }

  // ── [3] PO → GRN (+ độ đầy đủ dòng GRI)
  tieuDe("[3] CHẶNG PO (purchase_orders) → GRN (goods_receipts) → GRI (goods_receipt_items)");
  const grn = doChang("goods_receipts", "purchase_order_id", "purchase_orders", "id", "GRN truy được về PO");
  const grnTong = grn.tong;
  const grnCoDong = Number(
    one(
      "SELECT COUNT(*) FROM goods_receipts g WHERE EXISTS " +
        "(SELECT 1 FROM goods_receipt_items i WHERE i.receipt_id=g.id)"
    )
  );
  const grnRong = grnTong - grnCoDong;
  console.log(
    `  ${dem("GRN CÓ ≥1 dòng GRI (đối soát được SL)", 44)} tổng=${dem(grnTong, 5)} có-dòng=${dem(grnCoDong, 5)} ` +
      `(${dem(tiLe(grnCoDong, grnTong), 7)}) RỖNG DÒNG=${grnRong}`
  );
  console.log(`  ⇒ ${tiLe(grnRong, grnTong)} số chuyến giao KHÔNG đối soát được số lượng.`);
  if (grnRong > 0) {
    console.log("  ▼ DANH SÁCH GRN RỖNG DÒNG:");
    for (const [no, poid, at] of sql(
      "SELECT g.receipt_no, g.purchase_order_id, g.received_at FROM goods_receipts g " +
        "WHERE NOT EXISTS (SELECT 1 FROM goods_receipt_items i WHERE i.receipt_id=g.id) ORDER BY g.receipt_no"
    )) {
      console.log(`      · ${dem(no, 34)} PO=${dem(poid, 36)} received_at=${at}`);
    }
  }

  // ── [4] GRN → SL
  tieuDe("[4] CHẶNG GRN (goods_receipts) → SL (stock_movements)  ·  qua stock_movements.reference_type/reference_id");
  const slTong = Number(one("SELECT COUNT(*) FROM stock_movements"));
  const slGrnRef = Number(one("SELECT COUNT(*) FROM stock_movements WHERE reference_type='goods_receipt'"));
  const slGrnTreo = Number(
    one(
      "SELECT COUNT(*) FROM stock_movements sm LEFT JOIN goods_receipts g ON g.id=sm.reference_id " +
        "WHERE sm.reference_type='goods_receipt' AND (sm.reference_id IS NULL OR sm.reference_id='' OR g.id IS NULL)"
    )
  );
  const sl = doQuanHe({ tong: slGrnRef, rong: 0, treo: slGrnTreo });
  console.log(`  Dòng SL tổng trong bảng:                 ${slTong}`);
  console.log(
    `  ${dem("SL gắn được về GRN", 44)} khai-GRN=${dem(slGrnRef, 5)} gắn-được=${dem(sl.truyDuoc, 5)} ` +
      `(${dem(tiLe(sl.truyDuoc, slGrnRef), 7)}) mồ côi=${sl.moCoi}`
  );
  console.log(`  Tỉ lệ trên TỔNG số dòng SL: ${tiLe(sl.truyDuoc, slTong)} (phần còn lại là nghiệp vụ khác, không thuộc chặng này)`);
  const phanBo = sql("SELECT reference_type, COUNT(*) FROM stock_movements GROUP BY reference_type ORDER BY reference_type");
  console.log(`  Phân bố reference_type: ${phanBo.map(([t, c]) => `${t}=${c}`).join(", ") || "(rỗng)"}`);

  // ── [5] TỔNG KẾT
  tieuDe("[5] BẢNG TỔNG KẾT — % truy vết TỪNG CHẶNG");
  const chang = [
    { ma: "A1", ...po, ten: "PO mồ côi", dat: po.dat },
    { ma: "A2", ...poi, ten: "Dòng POI mồ côi", dat: poi.dat },
    { ma: "A3", ...grn, ten: "GRN mồ côi", dat: grn.dat },
    { ma: "A4", ...sl, ten: "Dòng SL khai GRN mồ côi", dat: sl.dat },
    { ma: "B1", tong: grnTong, truyDuoc: grnCoDong, moCoi: grnRong, ten: "GRN có dòng GRI", dat: grnRong === 0 },
  ];
  console.log(`  ${dem("Mã", 4)}${dem("Chặng", 30)}${dem("Truy được/Tổng", 18)}${dem("%", 9)}Ngưỡng        Kết luận`);
  for (const c of chang) {
    const nguong = c.ma === "B1" ? "rỗng dòng = 0" : "mồ côi = 0";
    console.log(
      `  ${dem(c.ma, 4)}${dem(c.ten, 30)}${dem(`${c.truyDuoc}/${c.tong}`, 18)}${dem(tiLe(c.truyDuoc, c.tong), 9)}` +
        `${dem(nguong, 14)}${c.dat ? "ĐẠT" : "KHÔNG ĐẠT"}`
    );
  }

  // ── [6] KẾT LUẬN
  tieuDe("[6] KẾT LUẬN CỔNG");
  const kl = ketLuan(chang);
  for (const c of kl.hong) {
    console.log(`  [HỎNG] ${c.ma} ${c.ten}: ${c.moCoi} mồ côi / ${c.tong} dòng ⇒ truy vết ${tiLe(c.truyDuoc, c.tong)}`);
  }
  if (po.moCoi > 0) {
    console.log(`  [CHI TIẾT] PO mồ côi làm đứt chặng PR→PO: xem danh sách ở mục [1].`);
  }
  if (grnRong > 0) {
    console.log(`  [CHI TIẾT] ${grnRong}/${grnTong} GRN rỗng dòng ⇒ ${tiLe(grnRong, grnTong)} chuyến giao không có số lượng để đối soát.`);
  }
  console.log("");
  if (kl.dat) {
    console.log(`  KẾT LUẬN: ĐẠT — ${kl.soTong}/${kl.soTong} chặng truy vết đầy đủ (0 mồ côi).`);
  } else {
    console.log(`  KẾT LUẬN: KHÔNG ĐẠT — ${kl.soHong}/${kl.soTong} chặng đứt: ${kl.hong.map((c) => c.ma).join(", ")}.`);
  }
  console.log("");
  return kl.dat ? 0 : 1;
}

let code;
try {
  code = main();
} catch (e) {
  console.error("\n[BLOCKED] Không kết nối / không truy vấn được MySQL — DỪNG, KHÔNG suy đoán số liệu.");
  console.error(`  mysql: ${MYSQL}`);
  console.error(`  lỗi:  ${e && e.message ? e.message : e}`);
  console.error("  Gợi ý: đặt MYSQL_BIN nếu mysql.exe nằm ở đường dẫn khác.");
  process.exit(2);
}
process.exit(code);
