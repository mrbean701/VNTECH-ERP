#!/usr/bin/env node
// VNTECH ERP V5.3.0 — PHASE 2 · CỔNG ĐO TOÀN VẸN THAM CHIẾU (vì CSDL có 0 KHOÁ NGOẠI)
//
// VÌ SAO CÓ CỔNG NÀY: CSDL `vntech_erp` có **121 bảng** và **0 khoá ngoại** — mọi quan hệ giữa các bảng
// CHỈ là quy ước đặt tên (`<bảng>_id`) do mã ứng dụng gánh. Nghĩa là CSDL KHÔNG hề chặn một bản ghi mồ côi:
// xoá một PR vẫn để lại PO/approvals trỏ vào hư không, và không có gì báo lỗi. Tiền lệ đã có (KP #71
// `attachments` mồ côi). Cổng này quét các cặp cột quan hệ chính và ĐẾM THẬT số giá trị trỏ vào hư không.
//
// Cách chạy:  node tools/p2-reference-integrity.mjs
// Biến môi trường: MYSQL_BIN (đường dẫn mysql.exe), MYSQL_DB (mặc định vntech_erp).
//
// ⚠️ CHỈ ĐỌC — 2 lớp khoá: (a) mọi câu lệnh là `SELECT`; (b) mọi lần gọi đều kèm
//    `SET SESSION TRANSACTION READ ONLY` nên CSDL TỪ CHỐI lệnh ghi. Không INSERT/UPDATE/DELETE/ALTER/CREATE.
//
// NGƯỠNG (in nguyên văn khi chạy — không giấu ngưỡng):
//   [BẮT BUỘC = 0] Số DÒNG có giá trị trỏ tới bản ghi KHÔNG tồn tại, cho TỪNG cặp cột quan hệ.
//                  Vì CSDL không có FK, con số này KHÔNG BAO GIỜ tự về 0 — nó phải do mã ứng dụng/cổng giữ.
//   [NGỮ NGHĨA NULL] Cột CÓ được phép NULL theo quy ước nghiệp vụ (vd `supply_workflow_steps.receipt_id`
//                  khi chưa giao hàng) thì NULL là "chưa tới bước đó" ⇒ KHÔNG tính mồ côi; cột KHÔNG được
//                  phép NULL thì NULL là dữ liệu thiếu ⇒ TÍNH mồ côi. Số NULL luôn được IN RIÊNG ở cột
//                  "NULL (hợp lệ)" để không giấu thông tin. Quyết định nằm ở hàm thuần `mucDoMoCoi`
//                  (tools/lib/p2-gates.mjs) và có test offline ở tests/p2-gates-tools.test.mjs.
//                  ⚠ SỬA TẠI TASK-108: trước đây tệp này gán NGƯỢC (`rong = choNull ? <đếm NULL> : 0`)
//                  nên coi 222 dòng NULL hợp lệ là mồ côi ⇒ cổng không thể về 0. Sửa xong, đo lại TRƯỚC khi
//                  seed dữ liệu cho kết quả 113 dòng mồ côi (toàn bộ là tham chiếu TREO) thay vì 335.
//   [ĐO]           Số quan hệ chỉ dựa vào QUY ƯỚC (= số cột `*_id` khi tổng FK = 0).
//   exit 0 = không cặp nào có dòng mồ côi · exit 1 = có ít nhất 1 cặp mồ côi · exit 2 = KHÔNG kết nối được MySQL

import { execFileSync } from "node:child_process";
import { theThamChieu, mucDoMoCoi, ketLuan, dem, rongCot, bang } from "./lib/p2-gates.mjs";

const MYSQL = process.env.MYSQL_BIN || "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
const DB = process.env.MYSQL_DB || "vntech_erp";
const KHOA_CHI_DOC = "SET SESSION TRANSACTION READ ONLY";

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
const coBang = (b) =>
  one(`SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name='${b}'`) === "1";
const coCot = (b, c) =>
  one(
    `SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() ` +
      `AND table_name='${b}' AND column_name='${c}'`
  ) === "1";
function tieuDe(t) {
  console.log(`\n${"─".repeat(112)}\n${t}\n${"─".repeat(112)}`);
}

/**
 * CÁC CẶP CỘT QUAN HỆ CHÍNH cần quét.
 * `rong` = cột có được phép NULL (quy ước nghiệp vụ) thì NULL KHÔNG tính là mồ côi.
 */
const QUAN_HE = [
  { bang: "purchase_orders", cot: "request_id", dichBang: "material_requests", dichCot: "id", nhan: "PO → PR", choNull: true },
  { bang: "purchase_order_items", cot: "request_item_id", dichBang: "material_request_items", dichCot: "id", nhan: "POI → dòng PR", choNull: false },
  { bang: "purchase_order_items", cot: "purchase_order_id", dichBang: "purchase_orders", dichCot: "id", nhan: "POI → PO", choNull: false },
  { bang: "goods_receipts", cot: "purchase_order_id", dichBang: "purchase_orders", dichCot: "id", nhan: "GRN → PO", choNull: false },
  // LƯU Ý LƯỢC ĐỒ THẬT: cột là `receipt_id` (KHÔNG phải `goods_receipt_id` như tài liệu audit ghi).
  { bang: "goods_receipt_items", cot: "receipt_id", dichBang: "goods_receipts", dichCot: "id", nhan: "GRI → GRN", choNull: false },
  { bang: "goods_receipt_items", cot: "purchase_order_item_id", dichBang: "purchase_order_items", dichCot: "id", nhan: "GRI → POI", choNull: false },
  { bang: "material_request_items", cot: "request_id", dichBang: "material_requests", dichCot: "id", nhan: "dòng PR → PR", choNull: false },
  { bang: "procurement_allocations", cot: "request_item_id", dichBang: "material_request_items", dichCot: "id", nhan: "PA → dòng PR", choNull: true },
  { bang: "procurement_allocations", cot: "purchase_order_item_id", dichBang: "purchase_order_items", dichCot: "id", nhan: "PA → POI", choNull: true },
  { bang: "procurement_allocations", cot: "receipt_item_id", dichBang: "goods_receipt_items", dichCot: "id", nhan: "PA → GRI", choNull: true },
  { bang: "approvals", cot: "request_id", dichBang: "material_requests", dichCot: "id", nhan: "duyệt → PR", choNull: true },
  { bang: "supply_workflow_steps", cot: "request_id", dichBang: "material_requests", dichCot: "id", nhan: "bước workflow → PR", choNull: true },
  { bang: "supply_workflow_steps", cot: "purchase_order_id", dichBang: "purchase_orders", dichCot: "id", nhan: "bước workflow → PO", choNull: true },
  { bang: "supply_workflow_steps", cot: "receipt_id", dichBang: "goods_receipts", dichCot: "id", nhan: "bước workflow → GRN", choNull: true },
  { bang: "stock_issue_items", cot: "request_item_id", dichBang: "material_request_items", dichCot: "id", nhan: "dòng xuất kho → dòng PR", choNull: true },
];

function main() {
  console.log("PHASE 2 — CỔNG ĐO TOÀN VẸN THAM CHIẾU (CSDL 0 FK ⇒ mọi quan hệ chỉ do quy ước)   (CHỈ ĐỌC)");
  console.log(`CSDL: ${DB}`);

  // ── [0] QUY MÔ vấn đề
  tieuDe("[0] QUY MÔ — CSDL không tự bảo vệ quan hệ nào cả");
  const soBang = Number(one("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE()"));
  const soFK = Number(
    one(
      "SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() " +
        "AND constraint_type='FOREIGN KEY'"
    )
  );
  const soCotId = Number(
    one("SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND column_name LIKE '%\\_id'")
  );
  const soCoFK = Number(
    one(
      "SELECT COUNT(DISTINCT CONCAT(table_name,'.',column_name)) FROM information_schema.key_column_usage " +
        "WHERE table_schema=DATABASE() AND referenced_table_name IS NOT NULL"
    )
  );
  console.log(`  Bảng trong CSDL:                            ${soBang}`);
  console.log(`  Khoá ngoại THẬT:                            ${soFK}`);
  console.log(`  Cột tên dạng '*_id' (ứng viên quan hệ):     ${soCotId}`);
  console.log(`  Trong đó CÓ FK thật:                        ${soCoFK}`);
  console.log(`  ⇒ SỐ QUAN HỆ CHỈ DỰA VÀO QUY ƯỚC:            ${soCotId - soCoFK}`);
  console.log("  ⇒ Không có FK nào: CSDL không chặn bản ghi mồ côi. Cổng này là lưới an toàn duy nhất.");

  // ── [1] QUÉT TỪNG CẶP
  tieuDe("[1] QUÉT TỪNG CẶP CỘT QUAN HỆ — đếm giá trị trỏ tới bản ghi KHÔNG tồn tại");
  const ketQua = [];
  const boQua = [];
  for (const q of QUAN_HE) {
    if (!coBang(q.bang) || !coBang(q.dichBang) || !coCot(q.bang, q.cot) || !coCot(q.dichBang, q.dichCot)) {
      boQua.push(q);
      continue;
    }
    const tong = Number(one(`SELECT COUNT(*) FROM ${q.bang}`));
    // Số NULL LUÔN được đếm để IN RA (không giấu thông tin), nhưng chỉ tính là MỒ CÔI khi cột KHÔNG được
    // phép NULL. Quyết định đó nằm ở hàm thuần `mucDoMoCoi` (test offline ở tests/p2-gates-tools.test.mjs)
    // thay vì một phép gán tại chỗ — trước đây phép gán đó NGƯỢC với tài liệu nên đếm NULL hợp lệ thành
    // mồ côi. Sửa tại TASK-108: SỐ NULL giữ riêng ở `rongNull`, `rong` chỉ còn là phần NULL ĐÁNG tính mồ côi.
    const soNull = Number(one(`SELECT COUNT(*) FROM ${q.bang} WHERE ${q.cot} IS NULL OR ${q.cot}=''`));
    const treo = Number(
      one(
        `SELECT COUNT(*) FROM ${q.bang} t LEFT JOIN ${q.dichBang} d ON d.${q.dichCot}=t.${q.cot} ` +
          `WHERE t.${q.cot} IS NOT NULL AND t.${q.cot}<>'' AND d.${q.dichCot} IS NULL`
      )
    );
    const kqCap = mucDoMoCoi({ choNull: q.choNull, tong, soNull, treo });
    const rong = kqCap.rong;
    // Ví dụ phải phân biệt 2 loại mồ côi: NULL/rỗng (không khai quan hệ) vs trỏ vào bản ghi không tồn tại.
    let viDu = [];
    if (rong > 0) viDu.push("<NULL/rỗng>");
    if (treo > 0) {
      viDu.push(
        ...sql(
          `SELECT DISTINCT t.${q.cot} FROM ${q.bang} t LEFT JOIN ${q.dichBang} d ON d.${q.dichCot}=t.${q.cot} ` +
            `WHERE t.${q.cot} IS NOT NULL AND t.${q.cot}<>'' AND d.${q.dichCot} IS NULL ORDER BY t.${q.cot} LIMIT 2`
        ).map((r) => r[0])
      );
    }
    ketQua.push({
      ...theThamChieu({ ...q, tong, rong, treo, viDu }),
      rongNull: kqCap.rongNull,
      nhan: q.nhan,
      choNull: q.choNull,
    });
  }

  const cotBang = [
    { ten: "Quan hệ (cột → bảng đích)", rong: Math.max(42, rongCot(ketQua.map((r) => r.quanHe)) + 2) },
    { ten: "Nghiệp vụ", rong: Math.max(22, rongCot(ketQua.map((r) => r.nhan))) },
    { ten: "Tổng dòng", rong: 10 },
    { ten: "NULL (hợp lệ)", rong: 13 },
    { ten: "Dòng MỒ CÔI", rong: 12 },
    { ten: "% mồ côi", rong: 9 },
    { ten: "Ví dụ giá trị mồ côi", rong: 44 },
    { ten: "Kết luận", rong: 10 },
  ];
  console.log(
    bang(
      cotBang,
      ketQua.map((r) => [
        r.quanHe,
        r.nhan,
        r.tong,
        r.choNull ? r.rongNull : "—",
        r.moCoi,
        r.tong === 0 ? "n/a" : `${((r.moCoi / r.tong) * 100).toFixed(1)}%`,
        r.viDu.length ? r.viDu.join(", ").slice(0, 44) : (r.moCoi === 0 ? "—" : "(không lấy được)"),
        r.dat ? "ĐẠT" : "MỒ CÔI",
      ])
    )
  );  if (ketQua.length === 0) console.log("  ⚠ Không cặp nào quét được — lược đồ khác dự kiến, cần xem lại.");
  if (boQua.length) {
    console.log(`\n  Bỏ qua ${boQua.length} cặp vì bảng/cột không tồn tại trên ${DB}:`);
    for (const q of boQua) console.log(`    · ${q.bang}.${q.cot} → ${q.dichBang}.${q.dichCot}`);
  }

  // ── [2] TỔNG HỢP
  tieuDe("[2] TỔNG HỢP");
  const tongDong = ketQua.reduce((s, r) => s + r.tong, 0);
  const tongMoCoi = ketQua.reduce((s, r) => s + r.moCoi, 0);
  console.log(`  Số cặp quan hệ đã quét:                        ${ketQua.length}`);
  console.log(`  Tổng số dòng trong các bảng có quan hệ:        ${tongDong}`);
  console.log(`  TỔNG SỐ DÒNG MỒ CÔI:                          ${tongMoCoi}`);
  console.log(`  Số cặp quan hệ CÓ dòng mồ côi:                 ${ketQua.filter((r) => !r.dat).length}`);
  console.log(`  SỐ QUAN HỆ CHỈ DỰA VÀO QUY ƯỚC (không FK):      ${soCotId - soCoFK}`);

  // ĐỐI CHIẾU CHÉO: mỗi con số mồ côi phải tính lại được bằng một truy vấn KHÁC (NOT EXISTS)
  // thay vì LEFT JOIN. Hai cách độc lập cùng ra một số thì số đó mới đáng tin.
  console.log("\n  ĐỐI CHIẾU CHÉO (LEFT JOIN vs NOT EXISTS — 2 cách đếm độc lập):");
  let soLechDoiChieu = 0;
  for (const q of QUAN_HE) {
    if (!coBang(q.bang) || !coBang(q.dichBang) || !coCot(q.bang, q.cot) || !coCot(q.dichBang, q.dichCot)) continue;
    const kqJoin = ketQua.find((r) => r.quanHe === `${q.bang}.${q.cot} → ${q.dichBang}.${q.dichCot}`);
    if (!kqJoin) continue;
    // ⚠ Phải dùng CÙNG ngữ nghĩa về NULL như vế LEFT JOIN: cột cho phép NULL thì NULL KHÔNG tính mồ côi.
    // (Trước TASK-108, vế này đếm NULL vô điều kiện nên LỆCH với vế LEFT JOIN ngay khi cổng được sửa.)
    const demNull = q.choNull ? "0=1" : `(t.${q.cot} IS NULL OR t.${q.cot}='')`;
    const theoNotExists = Number(
      one(
        `SELECT COUNT(*) FROM ${q.bang} t WHERE ${demNull} OR (t.${q.cot} IS NOT NULL AND t.${q.cot}<>'' AND NOT EXISTS ` +
          `(SELECT 1 FROM ${q.dichBang} d WHERE d.${q.dichCot}=t.${q.cot}))`
      )
    );
    const khop = theoNotExists === kqJoin.moCoi;
    if (!khop) soLechDoiChieu++;
    console.log(
      `    ${dem(kqJoin.quanHe, 58)} LEFT JOIN=${dem(kqJoin.moCoi, 5)} NOT EXISTS=${dem(theoNotExists, 5)} ${khop ? "khớp" : "LỆCH ✗"}`
    );
  }
  console.log(`  ⇒ ${soLechDoiChieu === 0 ? "Mọi cặp khớp nhau giữa 2 cách đếm." : `${soLechDoiChieu} cặp LỆCH — số liệu không đáng tin, cần xem lại.`}`);

  // ── [3] KẾT LUẬN
  tieuDe("[3] KẾT LUẬN CỔNG (ngưỡng: số dòng mồ côi của MỌI cặp phải = 0)");
  const kl = ketLuan(ketQua);
  for (const r of kl.hong) {
    console.log(`  [HỎNG] ${dem(r.quanHe, 58)} ${dem(`${r.moCoi}/${r.tong} dòng`, 14)} ví dụ: ${r.viDu.join(", ").slice(0, 60)}`);
  }
  console.log("");
  if (kl.dat && soLechDoiChieu === 0) {
    console.log(`  KẾT LUẬN: ĐẠT — ${kl.soTong}/${kl.soTong} cặp quan hệ không có dòng mồ côi.`);
  } else {
    console.log(`  KẾT LUẬN: KHÔNG ĐẠT — ${kl.soHong}/${kl.soTong} cặp quan hệ có dòng mồ côi (tổng ${tongMoCoi}).`);
    console.log("  GHI CHÚ: vì CSDL có 0 FK, tình trạng này KHÔNG bị CSDL chặn — phải do mã ứng dụng/cổng giữ.");
  }
  console.log("");
  return kl.dat && soLechDoiChieu === 0 ? 0 : 1;
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
