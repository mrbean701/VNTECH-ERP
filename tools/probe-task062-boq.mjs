// ════════════════════════════════════════════════════════════════════════════════════════════
// TASK-062 — CỔNG KIỂM CHỨNG LÚC CHẠY cho 2 khoá BOQ + 3 ca lệch ORDER BY/LIMIT/vai trò
// ════════════════════════════════════════════════════════════════════════════════════════════
// VÌ SAO CÓ CỔNG NÀY: `probe-column-parity.mjs` chỉ chứng minh **TẬP CỘT** khớp giữa hai câu SQL.
// Nó KHÔNG chứng minh được (và đã có 3 ca thực tế sai mà cổng vẫn xanh):
//   • SỐ DÒNG — JS `:653-654` gộp `unmappedSourceRows` vào CÙNG mảng `boqItems`; Java cũ không gộp
//     ⇒ thiếu hẳn một nửa danh sách BOQ. Cột có đủ mà DÒNG thiếu thì cổng cột mù.
//   • GIÁ TRỊ của 7 cột tổng hợp (subquery tương quan) — chép đúng cột mà sai mệnh đề thì vẫn "khớp".
//   • `ORDER BY` / `LIMIT` / lọc theo VAI TRÒ — xem Known Problems #61.
//
// CÁCH ĐO ĐỘC LẬP (không chép lại câu SQL của bản port):
//   * mọi giá trị kỳ vọng lấy từ MySQL bằng câu SQL viết KHÁC DẠNG (`JOIN … GROUP BY` thay vì
//     subquery tương quan), viết lại từ đặc tả JS chứ không sao chép mã Java;
//   * 3 trường dẫn xuất kiểm bằng BẤT BIẾN số học trên chính dòng dữ liệu;
//   * 3 ca ORDER BY / LIMIT / vai trò kiểm bằng so SÁCH chuỗi khoá trả về với sách MySQL.
//
// ĐỘ PHỦ THẬT CỦA DỮ LIỆU HIỆN TẠI (đo trước khi viết cổng, in ra ở mục 0):
//   `material_request_items.boq_item_id IS NULL` = **0** ⇒ nhánh dự phòng "vật tư duy nhất" của JS
//   KHÔNG BAO GIỜ chạy trên dữ liệu này ⇒ so được với công thức nối trực tiếp. Khi dữ liệu đổi
//   (xuất hiện dòng boq_item_id NULL) cổng tự IN CẢNH BÁO và bỏ qua phép so giá trị.
//
// Chạy: node tools/probe-task062-boq.mjs [base]
import { execFileSync } from "node:child_process";

const BASE = process.argv[2] || "http://127.0.0.1:18081";
const MYSQL = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
const MYSQL_ARGS = ["--default-character-set=utf8mb4", "-uvntech", "-pvntech", "vntech_erp",
  "--batch", "--raw", "--skip-column-names"];

const sql = (q) => execFileSync(MYSQL, [...MYSQL_ARGS, "-e", q], { encoding: "utf8" });
const sqlRows = (q) => sql(q).split(/\r?\n/).filter(Boolean).map((l) => l.split("\t"));
const sqlOne = (q) => { const r = sqlRows(q); return r.length ? r[0][0] : ""; };
/** `mysql --batch --raw` in NULL thành CHUỖI "NULL" ⇒ phải nhận diện, không được so như dữ liệu. */
const isMissing = (v) => v === "NULL" || v === "" || v === undefined || v === null;
const num = (v) => (v === null || v === undefined || isMissing(String(v)) ? 0 : Number(v));
const near = (a, b, eps = 1e-6) => Math.abs(num(a) - num(b)) <= eps;

const results = [];
let skipped = 0;
const check = (name, ok, detail) => {
  results.push({ name, ok, detail });
  console.log(`  ${ok ? "ĐẠT" : "HỎNG"}  ${name}${detail ? " — " + detail : ""}`);
};
const note = (msg) => { skipped++; console.log(`  (bỏ qua)  ${msg}`); };

async function loginAs(username, password) {
  const res = await fetch(`${BASE}/api/system`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "login", username, password }),
  });
  if (!res.ok) throw new Error(`đăng nhập ${username} lỗi HTTP ${res.status}`);
  const cookie = (res.headers.getSetCookie?.() ?? [res.headers.get("set-cookie")])
    .filter(Boolean).map((c) => c.split(";")[0]).join("; ");
  const boot = await (await fetch(`${BASE}/api/system`, { headers: { cookie } })).json();
  if (!boot?.data) throw new Error(`bootstrap ${username} không có .data`);
  return boot.data;
}

// ═══════════════════════════════ 0. ĐỘ PHỦ DỮ LIỆU ═══════════════════════════════
console.log("═══ 0. ĐỘ PHỦ DỮ LIỆU (đo TRƯỚC khi kết luận) ═══");
const fallbackRows = Number(sqlOne("SELECT COUNT(*) FROM material_request_items WHERE boq_item_id IS NULL"));
const cancelledMri = Number(sqlOne("SELECT COUNT(*) FROM material_request_items mri JOIN material_requests mr ON mr.id=mri.request_id WHERE mr.status='cancelled'"));
console.log(`  dòng "material_request_items" có boq_item_id NULL (kích hoạt nhánh dự phòng của JS): ${fallbackRows}`);
console.log(`  dòng vật tư thuộc phiếu ĐÃ HUỶ: ${cancelledMri}`);
const canCompareAggregates = fallbackRows === 0 && cancelledMri === 0;
if (!canCompareAggregates) {
  console.log("  ⚠️ CẢNH BÁO: dữ liệu đã đổi ⇒ phép so 7 cột tổng hợp ở mục 3 sẽ CHỈ kiểm sự tồn tại của cột,");
  console.log("     KHÔNG kiểm giá trị (nhánh dự phòng của JS chưa được mô phỏng ở cổng này).");
}

// ═══════════════════════════════ 1. SỐ DÒNG (mảng ghép) ═══════════════════════════════
const mainCount = Number(sqlOne(`
  SELECT COUNT(*) FROM project_boq_items pbi
  JOIN projects p ON p.id=pbi.project_id JOIN materials m ON m.id=pbi.material_id
  LEFT JOIN boq_versions bv ON bv.id=pbi.boq_version_id
  WHERE pbi.active=1 AND (pbi.boq_version_id IS NULL OR bv.active=1)`));
const unmappedCount = Number(sqlOne(`
  SELECT COUNT(*) FROM boq_source_items bsi
  JOIN boq_import_batches bib ON bib.id=bsi.batch_id AND bib.active=1
  JOIN projects p ON p.id=bsi.project_id
  WHERE bsi.active=1 AND bsi.project_boq_item_id IS NULL`));

const admin = await loginAs("admin", "Admin123456@");
const boqItems = admin.boqItems ?? [];
const boqSourceItems = admin.boqSourceItems ?? [];

console.log("\n═══ 1. SỐ DÒNG `boqItems` = dòng BOQ đã ánh xạ ⊕ dòng NGUỒN CHƯA ÁNH XẠ (JS `:653-654`) ═══");
console.log(`  MySQL độc lập: đã ánh xạ=${mainCount} · chưa ánh xạ=${unmappedCount} ⇒ kỳ vọng ${mainCount + unmappedCount}; Java trả ${boqItems.length}`);
check("boqItems trả ĐÚNG tổng số dòng (có gộp dòng nguồn chưa ánh xạ)",
  boqItems.length === mainCount + unmappedCount,
  `kỳ vọng ${mainCount + unmappedCount} · thực ${boqItems.length}`);

const pbiIds = new Set(sqlRows("SELECT id FROM project_boq_items").map((r) => r[0]));
const mergedRows = boqItems.filter((r) => !pbiIds.has(String(r.id)));
check("đúng số DÒNG NGUỒN CHƯA ÁNH XẠ được gộp vào boqItems",
  mergedRows.length === unmappedCount, `kỳ vọng ${unmappedCount} · thực ${mergedRows.length}`);

// ═══════════════════════════════ 2. CỘT MỚI CỦA boqItems ═══════════════════════════════
console.log("\n═══ 2. 13 cột vô hướng + 7 cột tổng hợp có mặt trên MỌI dòng ═══");
const NEW_SCALARS = ["contractLineRef", "parentSourceOrder", "outlineLevel", "sourceSheet", "sourceRow",
  "contractCode", "contractMaterialName", "standardMaterialName", "variationRef", "variationApprovedAt"];
const NEW_AGGS = ["requestedQty", "approvedQty", "orderedQty", "receivedQty", "issuedQty", "installedQty", "stockQty"];
// ⚠️ Chỉ kiểm trên DÒNG ĐÃ ÁNH XẠ: JS `:653` câu `unmappedSourceRows` **không** chọn các cột
// `parentSourceOrder`/`outlineLevel`/`sourceSheet`/`sourceRow`/`variation*` ⇒ dòng gộp KHÔNG có các khoá đó
// ở CẢ HAI phía. (Lượt chạy đầu cổng báo HỎNG oan vì đòi khoá trên mọi dòng — lỗi kỳ vọng của cổng.)
const mainRows = boqItems.filter((r) => pbiIds.has(String(r.id)));
const missingScalar = NEW_SCALARS.filter((k) => !mainRows.every((r) => k in r));
check(`10 cột vô hướng có mặt trên mọi dòng ĐÃ ÁNH XẠ`, missingScalar.length === 0,
  missingScalar.length ? `thiếu khoá: ${missingScalar.join(", ")}` : `${mainRows.length} dòng`);
const missingAgg = NEW_AGGS.filter((k) => !boqItems.every((r) => k in r));
check("7 cột TỔNG HỢP có mặt trên mọi dòng", missingAgg.length === 0,
  missingAgg.length ? `thiếu khoá: ${missingAgg.join(", ")}` : `${boqItems.length} dòng`);
const derivedMissing = ["orderedNotReceivedQty", "varianceContract", "varianceRemeasured", "customFields"]
  .filter((k) => !boqItems.every((r) => k in r));
check("3 trường DẪN XUẤT + customFields có mặt trên mọi dòng", derivedMissing.length === 0,
  derivedMissing.length ? `thiếu khoá: ${derivedMissing.join(", ")}` : `${boqItems.length} dòng`);

// ═══════════════════════════════ 3. GIÁ TRỊ 7 CỘT TỔNG HỢP (đối chiếu độc lập) ═══════════════════════════════
console.log("\n═══ 3. GIÁ TRỊ 7 cột tổng hợp — so với SQL viết KHÁC DẠNG (JOIN…GROUP BY) ═══");
if (!canCompareAggregates) {
  note("dữ liệu có dòng kích hoạt nhánh dự phòng của JS ⇒ không so giá trị (xem cảnh báo ở mục 0)");
} else {
  const expect = new Map();
  for (const [id, rq, aq, oq, iq, ins] of sqlRows(`
      SELECT pbi.id, COALESCE(SUM(mri.requested_qty),0), COALESCE(SUM(mri.approved_purchase_qty),0),
             COALESCE(SUM(mri.ordered_qty),0), COALESCE(SUM(mri.issued_qty),0), COALESCE(SUM(mri.installed_qty),0)
      FROM project_boq_items pbi
      LEFT JOIN material_request_items mri ON mri.boq_item_id=pbi.id
      LEFT JOIN material_requests mr ON mr.id=mri.request_id AND mr.status<>'cancelled'
           AND mr.project_id=pbi.project_id AND mr.contract_id=pbi.contract_id
      WHERE pbi.active=1 GROUP BY pbi.id`)) {
    expect.set(id, { requestedQty: rq, approvedQty: aq, orderedQty: oq, issuedQty: iq, installedQty: ins });
  }
  for (const [id, rc] of sqlRows(`
      SELECT pbi.id, COALESCE(SUM(gri.accepted_qty),0)
      FROM project_boq_items pbi
      JOIN material_request_items mri ON mri.boq_item_id=pbi.id
      JOIN material_requests mr ON mr.id=mri.request_id AND mr.status<>'cancelled'
           AND mr.project_id=pbi.project_id AND mr.contract_id=pbi.contract_id
      JOIN purchase_order_items poi ON poi.request_item_id=mri.id
      JOIN goods_receipt_items gri ON gri.purchase_order_item_id=poi.id
      JOIN goods_receipts gr ON gr.id=gri.receipt_id AND gr.bch_confirmation_status='confirmed'
      GROUP BY pbi.id`)) {
    (expect.get(id) ?? expect.set(id, {}).get(id)).receivedQty = rc;
  }
  for (const [id, st] of sqlRows(`
      SELECT pbi.id,
             COALESCE(SUM(CASE WHEN sm.to_warehouse_id IN (SELECT w.id FROM warehouses w WHERE w.project_id=pbi.project_id AND w.type='site')
                               THEN sm.quantity ELSE 0 END)
                    - SUM(CASE WHEN sm.from_warehouse_id IN (SELECT w.id FROM warehouses w WHERE w.project_id=pbi.project_id AND w.type='site')
                               THEN sm.quantity ELSE 0 END),0)
      FROM project_boq_items pbi
      LEFT JOIN stock_movements sm ON sm.project_id=pbi.project_id AND sm.material_id=pbi.material_id
      GROUP BY pbi.id`)) {
    (expect.get(id) ?? expect.set(id, {}).get(id)).stockQty = st;
  }

  const diffs = [];
  let compared = 0;
  for (const row of boqItems) {
    const exp = expect.get(String(row.id));
    if (!exp) continue;                     // dòng nguồn chưa ánh xạ: khối lượng = 0, kiểm ở mục 5
    for (const k of NEW_AGGS) {
      compared++;
      if (!near(row[k], exp[k] ?? 0)) diffs.push(`${row.id}.${k}: Java=${row[k]} · SQL độc lập=${exp[k] ?? 0}`);
    }
  }
  check(`7 cột tổng hợp khớp SQL độc lập (${compared} phép so)`, diffs.length === 0,
    diffs.length ? diffs.slice(0, 6).join(" | ") : "khớp hoàn toàn");
  const nonZeroAgg = boqItems.filter((r) => num(r.receivedQty) !== 0 || num(r.requestedQty) !== 0).length;
  console.log(`  (bối cảnh) số dòng có ít nhất một cột tổng hợp KHÁC 0: ${nonZeroAgg}/${boqItems.length}` +
    (nonZeroAgg === 0 ? " ⇒ phép so là so 0=0, giá trị chưa được chứng minh bằng dữ liệu thật" : ""));
}

// ═══════════════════════════════ 4. BẤT BIẾN 3 TRƯỜNG DẪN XUẤT ═══════════════════════════════
console.log("\n═══ 4. BẤT BIẾN của 3 trường dẫn xuất (JS `:640-642`) ═══");
{
  const bad = [];
  for (const row of boqItems) {
    if (!pbiIds.has(String(row.id))) continue;   // dòng nguồn chưa ánh xạ có công thức riêng (mục 5)
    if (!near(row.orderedNotReceivedQty, Math.max(0, num(row.orderedQty) - num(row.receivedQty)))) {
      bad.push(`${row.id}.orderedNotReceivedQty`);
    }
    if (!near(row.varianceContract, num(row.receivedQty) - num(row.contractQty))) bad.push(`${row.id}.varianceContract`);
    if (!near(row.varianceRemeasured, num(row.receivedQty) - num(row.remeasuredQty))) bad.push(`${row.id}.varianceRemeasured`);
  }
  check("mọi dòng BOQ đã ánh xạ thoả 3 công thức dẫn xuất", bad.length === 0,
    bad.length ? `sai ở: ${bad.slice(0, 5).join(", ")}` : `${boqItems.length - mergedRows.length} dòng`);
}

// ═══════════════════════════════ 5. DÒNG NGUỒN CHƯA ÁNH XẠ ═══════════════════════════════
console.log("\n═══ 5. Dòng nguồn chưa ánh xạ: khối lượng = 0, mã vật tư/nhóm = null, customFields từ 2 trường ═══");
if (!mergedRows.length) {
  note("không có dòng nguồn chưa ánh xạ trong phạm vi ⇒ không kiểm được nội dung (KHÔNG tính ĐẠT)");
} else {
  const ZEROS = ["requestedQty", "approvedQty", "orderedQty", "receivedQty", "issuedQty", "installedQty",
    "stockQty", "orderedNotReceivedQty"];
  const badZero = [];
  const badNull = [];
  const badDerived = [];
  const badCustom = [];
  for (const row of mergedRows) {
    for (const k of ZEROS) if (num(row[k]) !== 0) badZero.push(`${row.id}.${k}`);
    if (row.materialCode !== null) badNull.push(`${row.id}.materialCode=${row.materialCode}`);
    if (row.categoryName !== null) badNull.push(`${row.id}.categoryName=${row.categoryName}`);
    if (!near(row.varianceContract, -num(row.contractQty))) badDerived.push(`${row.id}.varianceContract`);
    if (!near(row.varianceRemeasured, -num(row.remeasuredQty))) badDerived.push(`${row.id}.varianceRemeasured`);
    const cf = row.customFields ?? {};
    const expectKeys = [];
    if (String(row.systemCode ?? "").trim()) expectKeys.push("systemCode");
    if (String(row.subgroupName ?? "").trim()) expectKeys.push("subgroupName");
    const got = Object.keys(cf).sort();
    if (JSON.stringify(got) !== JSON.stringify(expectKeys.sort())) {
      badCustom.push(`${row.id}: [${got}] ≠ [${expectKeys.sort()}]`);
    }
  }
  check(`8 trường khối lượng = 0 trên ${mergedRows.length} dòng`, badZero.length === 0, badZero.slice(0, 5).join(", "));
  check("materialCode/categoryName = null", badNull.length === 0, badNull.slice(0, 5).join(", "));
  check("varianceContract = −contractQty · varianceRemeasured = −remeasuredQty", badDerived.length === 0,
    badDerived.slice(0, 5).join(", "));
  check("customFields chỉ chứa 2 khoá có giá trị (systemCode/subgroupName)", badCustom.length === 0,
    badCustom.slice(0, 4).join(" | "));
}

// ═══════════════════════════════ 6. boqSourceItems — 9 cột mới ═══════════════════════════════
console.log("\n═══ 6. `boqSourceItems` — 9 cột mới, đối chiếu THEO TỪNG DÒNG với MySQL ═══");
{
  const NEW_COLS = ["contractLineRef", "contractCode", "contractMaterialName", "specification",
    "versionActive", "versionStatus", "versionNo", "versionCode"];
  const missing = NEW_COLS.filter((k) => !boqSourceItems.every((r) => k in r));
  check("8 cột mới có mặt trên mọi dòng + cột `id` (không alias)", missing.length === 0 && boqSourceItems.every((r) => "id" in r),
    missing.length ? `thiếu: ${missing.join(", ")}` : `${boqSourceItems.length} dòng`);

  // ⚠️ Phải lọc theo PHẠM VI DỰ ÁN như bootstrap: DB có 11 dòng `boq_source_items` nhưng chỉ 2 dự án
  // tồn tại ⇒ trong phạm vi chỉ 8. (Lượt chạy đầu cổng đòi 11 — lỗi kỳ vọng của cổng.)
  const expectCount = Number(sqlOne(`
    SELECT COUNT(*) FROM boq_source_items bsi JOIN boq_versions bv ON bv.id=bsi.boq_version_id
    WHERE bsi.project_id IN (SELECT id FROM projects)`));
  check("số dòng khớp MySQL trong PHẠM VI DỰ ÁN (JOIN boq_versions là INNER)",
    boqSourceItems.length === expectCount, `kỳ vọng ${expectCount} · thực ${boqSourceItems.length}`);

  const truth = new Map();
  for (const r of sqlRows(`
      SELECT bsi.id, bsi.contract_line_ref, bsi.contract_code, bsi.contract_material_name,
             COALESCE(m.specification,'NULL'), bv.active, bv.status, bv.version_no, COALESCE(bv.version_code,'NULL')
      FROM boq_source_items bsi JOIN boq_versions bv ON bv.id=bsi.boq_version_id
      LEFT JOIN materials m ON m.id=bsi.mapped_material_id
      WHERE bsi.project_id IN (SELECT id FROM projects)`)) {
    truth.set(r[0], { contractLineRef: r[1], contractCode: r[2], contractMaterialName: r[3],
      specification: r[4], versionActive: r[5], versionStatus: r[6], versionNo: r[7], versionCode: r[8] });
  }
  // Chuẩn hoá: JSON `null` (chữ thường) và SQL `NULL` (chữ hoa) là CÙNG một giá trị;
  // `tinyint(1)` có thể ra `true/false` ở JSON và `1/0` ở MySQL.
  const norm = (v, key) => {
    if (v === null || v === undefined) return "NULL";
    if (typeof v === "boolean") return v ? "1" : "0";
    const s = String(v);
    if (s === "" || s === "NULL" || s === "null") return "NULL";
    if (key === "versionActive") return num(s) ? "1" : "0";
    return s;
  };
  const diffs = [];
  let compared = 0;
  for (const row of boqSourceItems) {
    const t = truth.get(String(row.id));
    if (!t) { diffs.push(`${row.id}: không có trong MySQL`); continue; }
    for (const k of NEW_COLS) {
      compared++;
      const a = norm(row[k], k);
      const b = norm(t[k], k);
      if (a !== b) diffs.push(`${row.id}.${k}: Java=${a} · MySQL=${b}`);
    }
  }
  check(`9 cột mới khớp MySQL theo từng dòng (${compared} phép so)`, diffs.length === 0,
    diffs.length ? diffs.slice(0, 6).join(" | ") : "khớp hoàn toàn");
}

// ═══════════════════════════════ 7. BA CA ORDER BY / LIMIT / VAI TRÒ ═══════════════════════════════
console.log("\n═══ 7. Ba ca lệch KHÔNG phải cột (Known Problems #61) ═══");
{
  // 7a. boqImportBatches — JS `:647`: ORDER BY project_id,contract_id,version_no DESC
  // (kỳ vọng phải LỌC PHẠM VI DỰ ÁN như bootstrap; DB có lô BOQ của dự án không còn tồn tại ⇒ 4 lô, trong phạm vi 1)
  const batches = admin.boqImportBatches ?? [];
  const wantKeys = sqlRows(`SELECT CONCAT(project_id,'|',contract_id,'|',version_no) FROM boq_import_batches
                            WHERE project_id IN (SELECT id FROM projects)
                            ORDER BY project_id,contract_id,version_no DESC`).map((r) => r[0]);
  const gotKeys = batches.map((b) => `${b.projectId}|${b.contractId}|${b.versionNo}`);
  check("boqImportBatches sắp ĐÚNG thứ tự JS (project_id, contract_id, version_no DESC)",
    JSON.stringify(wantKeys) === JSON.stringify(gotKeys),
    wantKeys.length ? `MySQL=${wantKeys.slice(0, 3).join(" → ")} · Java=${gotKeys.slice(0, 3).join(" → ")}` : "bảng rỗng");

  // 7b. boqChangeHistory — JS `:648`: LIMIT 1000 + tiebreaker h.id DESC
  const hist = admin.boqChangeHistory ?? [];
  const histTotal = Number(sqlOne(`SELECT COUNT(*) FROM boq_change_history h JOIN projects p ON p.id=h.project_id`));
  check("boqChangeHistory có tiebreaker `id DESC` (dòng mới nhất cùng mốc thời gian lên trước)",
    hist.length > 1 ? String(hist[0].id) >= String(hist[1].id) || hist[0].createdAt !== hist[1].createdAt : true,
    `${hist.length} dòng / ${histTotal} dòng trong DB`);
  check("boqChangeHistory bị chặn trần 1000 dòng như JS", hist.length <= 1000, `${hist.length} dòng`);

  // 7c. workflowAssignments — JS `:723`: CHỈ admin, và KHÔNG lọc theo dự án
  const adminWa = admin.workflowAssignments ?? [];
  const waTotal = Number(sqlOne("SELECT COUNT(*) FROM approval_project_assignments"));
  check("admin nhận workflowAssignments = TOÀN BỘ bảng (không lọc theo dự án)",
    adminWa.length === waTotal, `kỳ vọng ${waTotal} · thực ${adminWa.length}`);
  let nonAdminWa = null;
  for (const [u, p] of [["thukydemo", "Vntech@2026"], ["nvkhdemo", "Vntech@2026"]]) {
    try {
      const d = await loginAs(u, p);
      nonAdminWa = { u, len: (d.workflowAssignments ?? []).length };
      break;
    } catch { /* thử tài khoản kế tiếp */ }
  }
  if (!nonAdminWa) note("không đăng nhập được tài khoản thường ⇒ KHÔNG kiểm được ca rò rỉ thông tin");
  else check(`tài khoản THƯỜNG (${nonAdminWa.u}) nhận workflowAssignments = [] (như JS, hết rò rỉ)`,
    nonAdminWa.len === 0, `nhận ${nonAdminWa.len} dòng`);
}

// ═══════════════════════════════ KẾT QUẢ ═══════════════════════════════
const pass = results.filter((r) => r.ok).length;
console.log(`\n═══ KẾT QUẢ: ${pass}/${results.length} ĐẠT` + (skipped ? ` · ${skipped} phép đo không thực hiện được` : "") + " ═══");
console.log("GIỚI HẠN: giá trị 7 cột tổng hợp chỉ được so khi dữ liệu KHÔNG kích hoạt nhánh dự phòng của JS");
console.log("         (`material_request_items.boq_item_id IS NULL`); nhánh đó CHƯA được cổng này mô phỏng.");
console.log("         Cổng không so JSON JS↔Java (lõi JS cũ không chạy trên MySQL).");
process.exit(results.every((r) => r.ok) ? 0 : 1);
