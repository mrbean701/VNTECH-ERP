// Kiểm chứng LÚC CHẠY cho TASK-043 (custom_field_values của dòng phiếu đề nghị)
// và phần TASK-044 (11 trường dòng phiếu mà bootstrap Java bỏ sót) — dựng cùng MỘT jar.
//
// ============================ VÌ SAO CÓ PROBE NÀY ============================
// TASK-043 là lỗi **hai chiều** trong CÙNG một tính năng:
//   (1) ĐƯỜNG GHI: JS `create_request` (scripts/system-route.mjs:974) ghi `custom_field_values`
//       cho TỪNG DÒNG phiếu; bản Java `RequestStoreAdapter.insertRequest` KHÔNG hề ghi bảng đó —
//       dù chú thích của interface `RequestStore.insertRequest` đã ghi rõ "…+ custom fields…".
//   (2) ĐƯỜNG ĐỌC: JS (system-route.mjs:563-568) tra bằng **id DÒNG** rồi gắn `customFields`
//       lên **từng dòng**; Java tra bằng **id PHIẾU** rồi gắn lên **phiếu** ⇒ không bao giờ khớp
//       (entity_id trong DB là `MRI_…`), nên `requests[].customFields` luôn `{}` và mỗi dòng
//       KHÔNG có khoá `customFields` mà UI đọc (`app/page.tsx:3543`).
//
// ============================ AN TOÀN DỮ LIỆU ============================
// Probe TẠO THẬT một phiếu đề nghị (vì phải chứng minh đường GHI), nên phải dựng đủ điều kiện
// nghiệp vụ rồi DỌN SẠCH trong `finally`:
//   - ĐIỀU KIỆN: mọi bước duyệt đang hoạt động phải có Owner đang hoạt động cho dự án. Probe chỉ
//     **KIỂM TRA** điều kiện đó (PRJ-DEMO-01 đã có sẵn 5 dòng `approval_project_assignments` thật với
//     người thật) — KHÔNG tự thêm phân công, nên bảng phân công không bị đụng tới.
//   - Phiếu tạo ra bị xoá theo đúng bộ bảng mà CHÍNH JS `delete_request` xoá
//     (approval_stage_decisions, approvals, request_comments, material_request_items, material_requests),
//     cộng thêm 2 bảng mà CẢ JS LẪN JAVA đều bỏ quên khi xoá phiếu (procurement_allocations,
//     custom_field_values) — xem "PHÁT HIỆN KÈM" trong TASK-043.md.
//   - `document_sequences` sẽ bị đẩy lên 1 số (không thể hoàn tác, vô hại) — probe in ra để minh bạch.
//
// Chạy: node tools/probe-task043-custom-fields.mjs [base]
import { execFileSync } from "node:child_process";

const BASE = process.argv[2] || "http://127.0.0.1:18081";
const MYSQL = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
const PROJECT_ID = "PRJ_fdbfab20-bf1f-4ad5-8159-7dcc582140c3"; // PRJ-DEMO-01 (dự án có dữ liệu thật)

// MySQL CLI PHẢI có `--default-character-set=utf8mb4`: mặc định cp850 làm hỏng tiếng Việt
// (bài học TASK-041 phần 3 — đã từng tạo 3 dòng rác vì lỗi này).
const sql = (q) =>
  execFileSync(MYSQL, ["--default-character-set=utf8mb4", "-uvntech", "-pvntech", "vntech_erp",
    "--batch", "--raw", "--skip-column-names", "-e", q], { encoding: "utf8" }).trim();
const sqlRows = (q) => sql(q).split(/\r?\n/).filter(Boolean).map((l) => l.split("\t"));
const sqlOne = (q) => { const r = sqlRows(q); return r.length ? r[0][0] : ""; };

const results = [];
const check = (name, ok, detail) => {
  results.push({ name, ok, detail });
  console.log(`  ${ok ? "ĐẠT" : "HỎNG"}  ${name}${detail ? " — " + detail : ""}`);
};
const q = (v) => `'${String(v).replace(/'/g, "''")}'`;

// ---------- đăng nhập ----------
const login = await fetch(`${BASE}/api/system`, {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ action: "login", username: "admin", password: "Admin123456@" }),
});
if (!login.ok) { console.error(`Đăng nhập lỗi HTTP ${login.status}`); process.exit(1); }
const cookie = (login.headers.getSetCookie?.() ?? [login.headers.get("set-cookie")])
  .filter(Boolean).map((c) => c.split(";")[0]).join("; ");
console.log(`Đăng nhập OK (${BASE})\n`);

const boot = async () => (await (await fetch(`${BASE}/api/system`, { headers: { cookie } })).json()).data ?? {};
async function call(action, payload = {}) {
  const res = await fetch(`${BASE}/api/system`, {
    method: "POST", headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ action, ...payload }),
  });
  let body = {};
  try { body = await res.json(); } catch { /* bỏ qua */ }
  return { status: res.status, ok: body.ok === true, message: String(body.message ?? ""), error: String(body.error ?? "") };
}

// ---------- trạng thái TRƯỚC (để chứng minh dọn sạch) ----------
const counts = () => ({
  requests: Number(sqlOne("SELECT COUNT(*) FROM material_requests")),
  items: Number(sqlOne("SELECT COUNT(*) FROM material_request_items")),
  approvals: Number(sqlOne("SELECT COUNT(*) FROM approvals")),
  allocations: Number(sqlOne("SELECT COUNT(*) FROM procurement_allocations")),
  customFields: Number(sqlOne("SELECT COUNT(*) FROM custom_field_values")),
  assignments: Number(sqlOne("SELECT COUNT(*) FROM approval_project_assignments")),
  formConfig: Number(sqlOne("SELECT COUNT(*) FROM form_field_config")),
  formConfigActiveCustom: Number(sqlOne("SELECT COUNT(*) FROM form_field_config WHERE form_key='request_line' AND source_kind='custom' AND active=1")),
});
const before = counts();
console.log(`TRƯỚC: ${JSON.stringify(before)}\n`);

let requestNo = ""; let requestId = "";

try {
  // ---------- 1. ĐIỀU KIỆN NGHIỆP VỤ: mọi bước đang hoạt động phải có Owner đang hoạt động ----------
  // LỖI CỦA CHÍNH TÔI Ở BẢN ĐẦU: tôi chạy `SELECT ... FROM approval_project_assignments` với cột
  // `stage_no` (SAI — cột thật là `stage`) và **đã nuốt stderr** (`2>$null`) nên thấy kết quả rỗng và
  // suýt kết luận "MySQL chưa cấu hình phân công nào". Sự thật: bảng CÓ 5 dòng thật cho PRJ-DEMO-01.
  // Vì vậy bản này KHÔNG tự thêm phân công nữa — chỉ KIỂM TRA điều kiện rồi mới tạo phiếu.
  const stages = sqlRows("SELECT stage_no FROM approval_stage_catalog WHERE active=1 ORDER BY stage_no").map((r) => r[0]);
  const missing = stages.filter((s) => Number(sqlOne(
    `SELECT COUNT(*) FROM approval_project_assignments WHERE project_id=${q(PROJECT_ID)} AND stage=${s} AND active=1`)) === 0);
  check(`điều kiện nghiệp vụ: ${stages.length} bước đang hoạt động đều có Owner cho PRJ-DEMO-01`,
    missing.length === 0, missing.length ? `thiếu bước ${missing.join(",")}` : `bước ${stages.join(",")}`);
  if (missing.length) throw new Error("thiếu phân công — không chạy tiếp để tránh tạo dữ liệu dở dang");

  const data = await boot();
  const material = (data.materials ?? [])[0];
  check("bootstrap có vật tư để lập phiếu", Boolean(material?.id), material ? `${material.code} · ${material.name}` : "KHÔNG CÓ");
  if (!material) throw new Error("không có vật tư trong bootstrap");

  // ---------- 2. tạo phiếu với 4 DẠNG `customFields` khác nhau ----------
  //  Dòng 1: object hợp lệ — có cả trường hợp cần BỎ (rỗng/null) và trường hợp cần TRIM.
  //  Dòng 2: customFields là CHUỖI JSON  ⇒ JS `customFieldsObject` trả {} ⇒ KHÔNG lưu gì.
  //  Dòng 3: customFields là MẢNG        ⇒ JS trả {} ⇒ KHÔNG lưu gì.
  //  Dòng 4: không có khoá customFields  ⇒ KHÔNG lưu gì.
  const line = (extra) => ({
    materialId: material.id, materialCode: material.code, materialName: material.name,
    unit: material.unit, quantity: 1, unitPrice: 1000,
    itemType: "phat_sinh", outsideContract: true, note: "probe TASK-043 (Ngoài HĐ/Phát sinh)",
    ...extra,
  });
  const expected = {
    ZZP043_A: "giá trị A",
    ZZP043_FALSE: "false",
    ZZP043_ONE: "1",
    ZZP043_TRIM: "B",
    ZZP043_ZERO: "0",
  };
  const created = await call("create_request", {
    projectId: PROJECT_ID, neededAt: "2026-12-31", priority: "normal",
    area: "Khu vực probe TASK-043", purpose: "probe TASK-043",
    lines: [
      line({ routeTag: "ROUTE-ZZP043", customFields: {
        "  ZZP043_TRIM  ": "B", ZZP043_A: "  giá trị A  ", ZZP043_EMPTY: "",
        ZZP043_NULL: null, ZZP043_ZERO: 0, ZZP043_FALSE: false, ZZP043_ONE: 1,
      } }),
      line({ customFields: '{"ZZP043_STR":"phải bị bỏ qua"}' }),
      line({ customFields: ["ZZP043_ARR"] }),
      line({}),
    ],
  });
  console.log(`  → create_request: HTTP ${created.status} · ${created.message || created.error}`);
  check("create_request trả HTTP 200", created.status === 200, `HTTP ${created.status}`);
  // LƯU Ý TRUNG THỰC: câu này kiểm ĐÚNG văn bản HIỆN TẠI của Java. JS lại trả
  // "... và chuyển tới ${TÊN BƯỚC}." (system-route.mjs:981) còn Java trả "chuyển tới bước <số>" ⇒
  // đây là lệch văn bản đã đăng ký trong TASK-043.md (không sửa ở lượt này vì phải đụng thông điệp
  // của cả 2 nhánh auto/không auto + ảnh hưởng test tích hợp H2).
  check("thông điệp đúng định dạng hiện tại của Java", /^Đã lập phiếu DNMH-.* gồm 4 dòng và chuyển tới bước \d+\.$/.test(created.message),
    created.message);
  requestNo = (created.message.match(/DNMH-\S+?(?= gồm)/) ?? [""])[0];
  requestId = sqlOne(`SELECT id FROM material_requests WHERE request_no=${q(requestNo)}`);
  check("phiếu được ghi vào DB", Boolean(requestId), requestNo);

  // ---------- 3. ĐƯỜNG GHI: bảng custom_field_values ----------
  const itemIds = sqlRows(`SELECT id FROM material_request_items WHERE request_id=${q(requestId)} ORDER BY line_no`).map((r) => r[0]);
  const inItems = itemIds.map(q).join(",");
  const rows = sqlRows(`SELECT entity_id,field_key,value_text,id FROM custom_field_values WHERE form_key='request_line' AND entity_id IN (${inItems}) ORDER BY field_key,entity_id`);
  const line1Id = itemIds[0];
  const line1Rows = rows.filter((r) => r[0] === line1Id);
  const actual = Object.fromEntries(line1Rows.map((r) => [r[1], r[2]]));
  console.log(`  → custom_field_values: ${rows.length} dòng (dòng 1: ${JSON.stringify(actual)})`);
  check("dòng 1 lưu ĐÚNG 5 giá trị, đã trim khoá và giá trị",
    JSON.stringify(actual) === JSON.stringify(expected), JSON.stringify(actual));
  check("trường rỗng / null bị BỎ (không tạo dòng rác)",
    !("ZZP043_EMPTY" in actual) && !("ZZP043_NULL" in actual), Object.keys(actual).join(","));
  check("khoá lạ trong chuỗi JSON / mảng KHÔNG được lưu (giống JS customFieldsObject)",
    !rows.some((r) => ["ZZP043_STR", "ZZP043_ARR"].includes(r[1])),
    rows.map((r) => r[1]).join(","));
  check("mọi dòng custom_field_values đều thuộc ĐÚNG 4 dòng phiếu vừa tạo (entity_id = id DÒNG)",
    rows.every((r) => itemIds.includes(r[0])) && rows.length === 5, `${rows.length} dòng / ${itemIds.length} dòng phiếu`);
  check("id sinh theo đúng quy ước JS `id(\"CFV\")` → `CFV_<uuid>`",
    rows.every((r) => /^CFV_[0-9a-f-]{36}$/.test(r[3])), rows[0]?.[3]);
  // ĐỐI CHỨNG DƯƠNG cho chính ĐƯỜNG ĐỌC đã sửa: truy vấn CŨ (lọc theo id PHIẾU) không bao giờ khớp,
  // vì `entity_id` lưu id DÒNG. Đây là lý do `customFields` của Java trước đây luôn `{}`.
  const oldQueryHits = Number(sqlOne(
    `SELECT COUNT(*) FROM custom_field_values WHERE form_key='request_line' AND entity_id IN (${q(requestId)})`));
  check("ĐỐI CHỨNG: truy vấn CŨ (lọc theo id PHIẾU) trả 0 dòng — đúng như lỗi đã mô tả",
    oldQueryHits === 0, `${oldQueryHits} dòng`);

  // ---------- 4. ĐƯỜNG GHI phụ: route_tag (trường Java bỏ im lặng) ----------
  const routeTag = sqlOne(`SELECT COALESCE(route_tag,'<NULL>') FROM material_request_items WHERE id=${q(line1Id)}`);
  check("routeTag của UI nay được ghi thật (trước đây luôn NULL)", routeTag === "ROUTE-ZZP043", routeTag);

  // ---------- 5. ĐƯỜNG ĐỌC: bootstrap trả customFields theo TỪNG DÒNG ----------
  const data2 = await boot();
  const req = (data2.requests ?? []).find((r) => r.requestNo === requestNo);
  check("bootstrap trả về phiếu vừa tạo", Boolean(req), requestNo);
  if (req) {
    const item1 = (req.items ?? []).find((it) => it.id === line1Id);
    // So sánh KHÔNG phụ thuộc THỨ TỰ KHOÁ: cả JS lẫn Java đều dựng object theo thứ tự dòng SQL trả
    // về (truy vấn không có ORDER BY) nên thứ tự khoá KHÔNG phải hợp đồng.
    const sameMap = (a, b) => JSON.stringify(Object.keys(a ?? {}).sort().map((k) => [k, a[k]]))
      === JSON.stringify(Object.keys(b ?? {}).sort().map((k) => [k, b[k]]));
    check("bootstrap gắn customFields lên TỪNG DÒNG (đúng như JS)",
      Boolean(item1) && sameMap(item1.customFields, expected),
      item1 ? JSON.stringify(item1.customFields) : "KHÔNG THẤY DÒNG");
    const others = (req.items ?? []).filter((it) => it.id !== line1Id);
    check("3 dòng không khai báo trường động vẫn có `customFields` = {} (không phải undefined)",
      others.length === 3 && others.every((it) => it.customFields && Object.keys(it.customFields).length === 0),
      others.map((it) => JSON.stringify(it.customFields)).join(" "));
    check("KHÔNG còn khoá `customFields` ở cấp PHIẾU (JS không có ⇒ tránh giao diện đọc nhầm chỗ)",
      !("customFields" in req), JSON.stringify(Object.keys(req).filter((k) => k.includes("custom"))));

    // TASK-048 — phép kiểm ĐỎ trước khi port: JS `:980` ghi `audit(user.id,"CREATE","material_request",…)`,
    // Java thêm sau. Chạy probe này khi CHƯA port sẽ thấy HỎNG ⇒ đối chứng dương cho vòng port.
    // ⚠️ SỬA LỖI CỦA CHÍNH PROBE (17/09): bản trước gọi `q1(requestId)` — hàm KHÔNG tồn tại
    // (helper thật tên là `q`) ⇒ phép kiểm này **ném lỗi và CHƯA BAO GIỜ CHẠY**, còn dòng
    // "19/20 ĐẠT" khiến tôi tưởng nó đã chạy và HỎNG. Nay gọi đúng `q(...)`.
    const auditCreate = sqlRows(`SELECT action,entity_type,after_json FROM audit_logs
                                 WHERE entity_id=${q(requestId)} AND action='CREATE' AND entity_type='material_request'`);
    check("TASK-048 · có dòng `audit_logs` CREATE/material_request cho phiếu vừa lập (JS `:980`)",
      auditCreate.length === 1 && /"requestNo"/.test(String(auditCreate[0]?.[2])),
      `${auditCreate.length} dòng`);
  }

  // ---------- 6. TASK-044: 11 trường dòng phiếu + đối chiếu SỐ với SQL ----------
  const NEED = ["workPackageCode", "boqCode", "installationArea", "contractLineNo", "pendingBchQty",
    "closeReason", "remainingQty", "rejectedQty", "linkedPoCount", "linkedReceiptCount", "missingDocumentCount"];
  const allItems = (data2.requests ?? []).flatMap((r) => (r.items ?? []).filter((it) => it.requestId !== requestId));
  check(`mọi dòng phiếu khác đều có ĐỦ 11 trường TASK-044 (${allItems.length} dòng)`,
    allItems.length > 0 && allItems.every((it) => NEED.every((k) => k in it)),
    allItems.length ? `thiếu ở dòng đầu: ${NEED.filter((k) => !(k in allItems[0])).join(",") || "KHÔNG THIẾU"}` : "không có dòng nào");
  const sum = (k) => allItems.reduce((s, it) => s + Number(it[k] ?? 0), 0);
  // ĐỐI CHIẾU PHẢI CÙNG MỘT TẬP HỢP: bootstrap chỉ trả các dòng thuộc PHIẾU mà nó trả về ⇒ phía SQL
  // cũng phải lọc đúng theo danh sách request đó, nếu không sẽ lệch vì **dòng mồ côi** (bài học
  // ngay trong lượt này — xem mục DÒNG MỒ CÔI bên dưới).
  const bootRequestIds = (data2.requests ?? []).map((r) => r.id).filter((id) => id !== requestId);
  const inReqs = bootRequestIds.length ? bootRequestIds.map(q).join(",") : q("");
  const sqlSumScope = (expr) => Number(sqlOne(
    `SELECT COALESCE(SUM(${expr}),0) FROM material_request_items mri WHERE mri.request_id IN (${inReqs})`));
  const sqlSumAll = (expr) => Number(sqlOne(
    `SELECT COALESCE(SUM(${expr}),0) FROM material_request_items mri WHERE mri.request_id<>${q(requestId)}`));
  const cases = {
    pendingBchQty: "CASE WHEN mri.delivered_qty>mri.received_qty THEN mri.delivered_qty-mri.received_qty ELSE 0 END",
    remainingQty: "CASE WHEN mri.approved_purchase_qty>mri.received_qty+mri.closed_qty THEN mri.approved_purchase_qty-mri.received_qty-mri.closed_qty ELSE 0 END",
    linkedPoCount: "(SELECT COUNT(DISTINCT poi3.purchase_order_id) FROM purchase_order_items poi3 WHERE poi3.request_item_id=mri.id)",
    linkedReceiptCount: "(SELECT COUNT(DISTINCT gri2.receipt_id) FROM goods_receipt_items gri2 JOIN purchase_order_items poi4 ON poi4.id=gri2.purchase_order_item_id WHERE poi4.request_item_id=mri.id)",
    rejectedQty: "(SELECT COALESCE(SUM(gri.rejected_qty),0) FROM goods_receipt_items gri JOIN purchase_order_items p ON p.id=gri.purchase_order_item_id WHERE p.request_item_id=mri.id)",
  };
  for (const [k, expr] of Object.entries(cases))
    check(`đối chiếu số liệu ${k}: bootstrap == SQL (cùng tập hợp phiếu)`, sum(k) === sqlSumScope(expr),
      `${sum(k)} vs ${sqlSumScope(expr)}`);

  // ---------- 7. DÒNG MỒ CÔI (phát hiện kèm — KHÔNG tự sửa dữ liệu) ----------
  const orphans = sqlRows("SELECT mri.id,mri.request_id FROM material_request_items mri "
    + "LEFT JOIN material_requests mr ON mr.id=mri.request_id WHERE mr.id IS NULL");
  const orphanGap = Object.fromEntries(Object.entries(cases).map(([k, expr]) => [k, sqlSumAll(expr) - sqlSumScope(expr)]));
  const orphanSum = (expr) => orphans.length === 0 ? 0 : Number(sqlOne(
    `SELECT COALESCE(SUM(${expr}),0) FROM material_request_items mri WHERE mri.id IN (${orphans.map((r) => q(r[0])).join(",")})`));
  check(`mọi chênh lệch giữa "toàn bộ" và "tập hợp phiếu" được GIẢI THÍCH HẾT bằng ${orphans.length} dòng mồ côi`,
    Object.entries(cases).every(([k, expr]) => orphanGap[k] === orphanSum(expr)),
    `chênh ${JSON.stringify(orphanGap)} · dòng mồ côi: ${orphans.map((r) => `${r[0]}→${r[1]} (không tồn tại)`).join(", ") || "không có"}`);
  console.log(`  (bootstrap: pending=${sum("pendingBchQty")} · remaining=${sum("remainingQty")} · PO=${sum("linkedPoCount")} · BCH=${sum("linkedReceiptCount")} · rejected=${sum("rejectedQty")})`);
} catch (e) {
  check("probe chạy trọn vẹn (không ném lỗi)", false, String(e && e.message ? e.message : e));
} finally {
  // ---------- 8. DỌN SẠCH ----------
  try {
    if (requestId) {
      const itemIds = sqlRows(`SELECT id FROM material_request_items WHERE request_id=${q(requestId)}`).map((r) => r[0]);
      if (itemIds.length) sql(`DELETE FROM custom_field_values WHERE form_key='request_line' AND entity_id IN (${itemIds.map(q).join(",")})`);
      sql(`DELETE FROM approval_stage_decisions WHERE request_id=${q(requestId)}`);
      sql(`DELETE FROM approvals WHERE request_id=${q(requestId)}`);
      sql(`DELETE FROM request_comments WHERE request_id=${q(requestId)}`);
      sql(`DELETE FROM procurement_allocations WHERE request_item_id IN (${itemIds.length ? itemIds.map(q).join(",") : q("")})`);
      sql(`DELETE FROM material_request_items WHERE request_id=${q(requestId)}`);
      sql(`DELETE FROM material_requests WHERE id=${q(requestId)}`);
    }
  } catch (e) {
    console.error(`DỌN DỮ LIỆU LỖI: ${e.message}`);
  }
  const after = counts();
  console.log(`\nSAU: ${JSON.stringify(after)}`);
  const same = (k) => before[k] === after[k];
  check("dọn sạch: số dòng các bảng nghiệp vụ trở về ĐÚNG như trước",
    ["requests", "items", "approvals", "allocations", "customFields", "assignments", "formConfig", "formConfigActiveCustom"].every(same),
    Object.keys(before).filter((k) => !same(k)).map((k) => `${k} ${before[k]}→${after[k]}`).join(" · ") || "khớp toàn bộ");
  check("KHÔNG đụng tới cấu hình trường động (form_field_config giữ nguyên: 0 trường custom đang bật)",
    after.formConfig === before.formConfig && after.formConfigActiveCustom === before.formConfigActiveCustom,
    `${after.formConfig} dòng · ${after.formConfigActiveCustom} custom đang bật`);
  check("GIỚI HẠN đã biết: `document_sequences` bị đẩy lên 1 số (không hoàn tác được, vô hại)",
    true, `DNMH của ${PROJECT_ID.slice(0, 14)}… → số ${sqlOne(`SELECT COALESCE(MAX(last_number),0) FROM document_sequences WHERE document_type='DNMH' AND project_id=${q(PROJECT_ID)}`)}`);
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} ĐẠT`);
if (failed.length) { console.log("MỤC HỎNG:"); for (const f of failed) console.log(` - ${f.name}: ${f.detail}`); }
process.exit(failed.length ? 1 : 0);
