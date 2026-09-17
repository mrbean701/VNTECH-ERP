// ============================================================================
// TASK-048 — cổng kiểm chứng 5 mốc NHẬT KÝ KIỂM TOÁN của luồng Phiếu đề nghị
// ============================================================================
// VÌ SAO CÓ PROBE NÀY: cổng `probe-task043-custom-fields.mjs` chỉ kiểm được mốc `CREATE`
// (và bản thân phép kiểm đó từng **ném lỗi nên chưa bao giờ chạy** — xem ghi chú trong tệp đó).
// Bốn mốc còn lại (`EDIT_RETURNED` · `RESUBMIT` · `DELETE_RETURNED` · `CANCEL`) chỉ xảy ra khi
// phiếu đi qua trạng thái `returned_to_requester`, nên phải **LÁI ĐÚNG LUỒNG NGHIỆP VỤ**:
//   tạo phiếu → (Owner) TỪ CHỐI ⇒ `returned_to_requester` → sửa → gửi lại → từ chối lại → hủy.
//
// AN TOÀN DỮ LIỆU (bắt buộc, theo bài học TASK-041/043):
//   * Probe TẠO THẬT 2 phiếu (1 để hủy, 1 để xoá) — vì đó là cách duy nhất chạm đúng nhánh mã.
//   * DỌN SẠCH trong `finally` bằng chính bộ bảng mà JS `delete_request` xoá, CỘNG hai bảng mà
//     CẢ JS LẪN JAVA bỏ quên (`procurement_allocations`, `custom_field_values`) — vì phiếu bị HỦY
//     thì không xoá được qua API (API không cho xoá phiếu đã hủy).
//   * KHÔNG thêm/sửa phân công duyệt: probe chỉ KIỂM TRA điều kiện rồi mới chạy.
//   * `audit_logs` là bảng GHI THÊM (append-only) — probe KHÔNG xoá dấu vết kiểm toán; các dòng
//     này là bằng chứng và vô hại. Mọi bảng nghiệp vụ khác phải trở về đúng số dòng ban đầu.
//   * `document_sequences` bị đẩy lên (không hoàn tác) — in ra để minh bạch.
//
// Chạy: node tools/probe-task048-audit-requests.mjs [base]
import { execFileSync } from "node:child_process";

const BASE = process.argv[2] || "http://127.0.0.1:18081";
const MYSQL = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
const PROJECT_ID = "PRJ_fdbfab20-bf1f-4ad5-8159-7dcc582140c3"; // PRJ-DEMO-01

const sql = (q) => execFileSync(MYSQL, ["--default-character-set=utf8mb4", "-uvntech", "-pvntech",
  "vntech_erp", "--batch", "--raw", "--skip-column-names", "-e", q], { encoding: "utf8" }).trim();
const sqlRows = (q) => sql(q).split(/\r?\n/).filter(Boolean).map((l) => l.split("\t"));
const sqlOne = (q) => { const r = sqlRows(q); return r.length ? r[0][0] : ""; };
const q = (v) => `'${String(v).replace(/'/g, "''")}'`;
const results = [];
const check = (name, ok, detail) => { results.push({ name, ok, detail }); console.log(`  ${ok ? "ĐẠT" : "HỎNG"}  ${name}${detail ? " — " + detail : ""}`); };

// ---------- đăng nhập admin ----------
const login = await fetch(`${BASE}/api/system`, {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ action: "login", username: "admin", password: "Admin123456@" }),
});
if (!login.ok) { console.error(`Đăng nhập lỗi HTTP ${login.status}`); process.exit(1); }
const cookie = (login.headers.getSetCookie?.() ?? [login.headers.get("set-cookie")])
  .filter(Boolean).map((c) => c.split(";")[0]).join("; ");
console.log(`Đăng nhập OK (${BASE})\n`);

async function call(action, payload = {}) {
  const res = await fetch(`${BASE}/api/system`, {
    method: "POST", headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ action, ...payload }),
  });
  let body = {};
  try { body = await res.json(); } catch { /* bỏ qua */ }
  return { status: res.status, ok: body.ok === true, message: String(body.message ?? ""), error: String(body.error ?? "") };
}
const boot = async () => (await (await fetch(`${BASE}/api/system`, { headers: { cookie } })).json()).data ?? {};

// ---------- audit rows của một phiếu ----------
const auditsOf = (requestId) => sqlRows(`SELECT action,entity_type,user_id,after_json,before_json
  FROM audit_logs WHERE entity_id=${q(requestId)} AND entity_type='material_request' ORDER BY occurred_at`);
const auditActions = (requestId) => auditsOf(requestId).map((r) => r[0]);

// ---------- trạng thái TRƯỚC ----------
const TBL = ["material_requests", "material_request_items", "approvals", "approval_stage_decisions",
  "request_comments", "procurement_allocations", "custom_field_values"];
const counts = () => Object.fromEntries(TBL.map((t) => [t, Number(sqlOne(`SELECT COUNT(*) FROM ${t}`))]));
const before = counts();
console.log(`TRƯỚC: ${JSON.stringify(before)}`);
console.log(`audit_logs entity_type='material_request' TRƯỚC (đối chứng dương): ` +
  `${sqlOne("SELECT COUNT(*) FROM audit_logs WHERE entity_type='material_request'")}\n`);

const createdIds = [];
const cleanupFailures = [];
// ⚠️ BÀI HỌC CỦA CHÍNH PROBE NÀY (lượt chạy đầu, 17/09): bản đầu gộp 7 câu DELETE vào MỘT lần gọi
// mysql CLI; câu thứ 5 sai tên cột (`procurement_allocations` KHÔNG có `request_id` — cột thật là
// `request_item_id`) ⇒ mysql DỪNG ngay tại đó và **6 câu sau không chạy** ⇒ dữ liệu probe còn nằm lại
// (phiếu A `cancelled` + 1 dòng vật tư + 1 dòng phân bổ). Nay: **mỗi câu một lần chạy, có try/catch,
// và gom lại mọi lỗi** để không câu nào chặn câu nào; cuối cùng vẫn chạy phép kiểm "trở về đúng số dòng".
function execSql(statement, label) {
  try { sql(statement); return true; }
  catch (e) { cleanupFailures.push(`${label}: ${String(e.stderr ?? e.message).trim().slice(0, 120)}`); return false; }
}
function hardDelete(requestId, itemIds = []) {
  // Dòng phân bổ (procurement_allocations) KHÔNG xoá được theo request_id (cột không tồn tại) —
  // phải theo `request_item_id`. Với phiếu đã bị API xoá thì id dòng phải ĐƯỢC LƯU TRƯỚC khi xoá.
  const itemSql = itemIds.length ? itemIds.map(q).join(",") : `NULL`;
  const ownItems = itemIds.length ? `(${itemSql})`
    : `(SELECT id FROM material_request_items WHERE request_id=${q(requestId)})`;
  execSql(`DELETE FROM procurement_allocations WHERE request_item_id IN ${ownItems}`, "procurement_allocations");
  execSql(`DELETE FROM custom_field_values WHERE entity_id IN ${ownItems}`, "custom_field_values");
  execSql(`DELETE FROM approval_stage_decisions WHERE request_id=${q(requestId)}`, "approval_stage_decisions");
  execSql(`DELETE FROM approvals WHERE request_id=${q(requestId)}`, "approvals");
  execSql(`DELETE FROM request_comments WHERE request_id=${q(requestId)}`, "request_comments");
  execSql(`DELETE FROM material_request_items WHERE request_id=${q(requestId)}`, "material_request_items");
  execSql(`DELETE FROM material_requests WHERE id=${q(requestId)}`, "material_requests");
}
// Phiếu do API xoá: id dòng đã mất khỏi DB ⇒ phải giữ id để dọn phân bổ còn lại.
const savedItemIds = new Map();
const savedRequestIds = new Map();

try {
  // ---------- 0. ĐIỀU KIỆN: mọi bước hoạt động phải có Owner đang hoạt động ----------
  const missing = sqlRows(`SELECT s.stage_no FROM approval_stage_catalog s
     LEFT JOIN approval_project_assignments apa ON apa.project_id=${q(PROJECT_ID)} AND apa.stage=s.stage_no AND apa.active=1
     LEFT JOIN users u ON u.id=apa.owner_user_id
     WHERE s.active=1 AND COALESCE(s.auto_approve_on_submit,0)=0
       AND (apa.id IS NULL OR u.active IS NULL OR u.active=0)`).map((r) => r[0]);
  check("điều kiện nghiệp vụ: mọi bước đang hoạt động đều có Owner đang hoạt động (KHÔNG tự thêm phân công)",
    missing.length === 0, missing.length ? `thiếu bước ${missing.join(", ")}` : "đủ");
  if (missing.length) throw new Error("thiếu phân công — dừng để tránh tạo dữ liệu dở dang");

  const data = await boot();
  const material = (data.materials ?? [])[0];
  if (!material?.id) throw new Error("bootstrap không có vật tư");
  const lines = [{ materialId: material.id, materialCode: material.code, materialName: material.name,
    unit: material.unit, quantity: 2, unitPrice: 1000, itemType: "phat_sinh", outsideContract: true,
    note: "probe TASK-048" }];

  async function createRequest(tag) {
    const res = await call("create_request", { projectId: PROJECT_ID, neededAt: "2026-12-31",
      priority: "normal", area: `Khu vực probe TASK-048 ${tag}`, purpose: `probe TASK-048 ${tag}`, lines });
    if (res.status !== 200) throw new Error(`create_request ${tag} lỗi: ${res.message || res.error}`);
    const no = (res.message.match(/DNMH-\S+?(?= gồm)/) ?? [""])[0];
    const id = sqlOne(`SELECT id FROM material_requests WHERE request_no=${q(no)}`);
    if (!id) throw new Error(`không tìm thấy phiếu ${no} trong DB`);
    createdIds.push(id);
    // LƯU id DÒNG ngay khi phiếu còn tồn tại: nếu phiếu bị chính API xoá thì id dòng biến mất và
    // không còn cách nào dọn `procurement_allocations` mồ côi theo `request_item_id`.
    savedItemIds.set(id, sqlRows(`SELECT id FROM material_request_items WHERE request_id=${q(id)}`).map((r) => r[0]));
    savedRequestIds.set(id, no);
    const stage = Number(sqlOne(`SELECT approval_stage FROM material_requests WHERE id=${q(id)}`));
    return { id, no, stage, message: res.message };
  }

  // ══════════ PHIẾU A: CREATE → EDIT_RETURNED → RESUBMIT → CANCEL ══════════
  console.log("\n═══ PHIẾU A (tạo → từ chối → sửa → gửi lại → từ chối → hủy) ═══");
  const a = await createRequest("A");
  console.log(`  phiếu A: ${a.no} · ở bước ${a.stage}`);
  check("A1 · audit CREATE được ghi khi lập phiếu (JS :980)", auditActions(a.id).includes("CREATE"),
    auditActions(a.id).join(",") || "(không có dòng nào)");

  const rejectA = await call("decide_approval", { requestId: a.id, stage: a.stage,
    decision: "rejected", comment: "probe TASK-048: trả lại để thử nhánh sửa" });
  check("A2 · từ chối được ⇒ phiếu về returned_to_requester", rejectA.status === 200 &&
    sqlOne(`SELECT status FROM material_requests WHERE id=${q(a.id)}`) === "returned_to_requester",
    `HTTP ${rejectA.status} · ${rejectA.message || rejectA.error} · status=${sqlOne(`SELECT status FROM material_requests WHERE id=${q(a.id)}`)}`);

  const editA = await call("update_returned_request", { requestId: a.id, neededAt: "2026-12-30",
    priority: "high", area: "Khu vực đã sửa", purpose: "probe TASK-048 sửa",
    lines: sqlRows(`SELECT id,requested_qty FROM material_request_items WHERE request_id=${q(a.id)}`)
      .map((r) => ({ id: r[0], requestedQty: Number(r[1]) })) });
  check("A3 · audit EDIT_RETURNED được ghi (JS :994)", editA.status === 200 && auditActions(a.id).includes("EDIT_RETURNED"),
    `HTTP ${editA.status} · ${editA.message || editA.error} · actions=[${auditActions(a.id).join(",")}]`);
  const editRow = (auditsOf(a.id).find((r) => r[0] === "EDIT_RETURNED") ?? [])[3] ?? "";
  check("A4 · after_json của EDIT_RETURNED dùng giá trị THÔ của payload (priority='high', lineCount)",
    /"priority":"high"/.test(editRow) && /"lineCount":1/.test(editRow), editRow.slice(0, 160));

  const resubmitA = await call("resubmit_request", { requestId: a.id, comment: "" });
  check("A5 · audit RESUBMIT được ghi (JS :1019)", resubmitA.status === 200 && auditActions(a.id).includes("RESUBMIT"),
    `HTTP ${resubmitA.status} · ${resubmitA.message || resubmitA.error} · actions=[${auditActions(a.id).join(",")}]`);
  const resubmitRow = (auditsOf(a.id).find((r) => r[0] === "RESUBMIT") ?? [])[3] ?? "";
  check("A6 · after_json của RESUBMIT giữ `comment` THÔ = rỗng (KHÔNG lấy bản mặc định hoá)",
    /"comment":""/.test(resubmitRow) && /"restartStage":/.test(resubmitRow), resubmitRow.slice(0, 160));

  const stageAfterResubmit = Number(sqlOne(`SELECT approval_stage FROM material_requests WHERE id=${q(a.id)}`));
  const rejectA2 = await call("decide_approval", { requestId: a.id, stage: stageAfterResubmit,
    decision: "rejected", comment: "probe TASK-048: trả lại lần 2 để thử nhánh hủy" });
  check("A7 · từ chối lần 2 ⇒ returned_to_requester", rejectA2.status === 200 &&
    sqlOne(`SELECT status FROM material_requests WHERE id=${q(a.id)}`) === "returned_to_requester",
    `HTTP ${rejectA2.status} · ${rejectA2.message || rejectA2.error}`);

  const cancelA = await call("cancel_request", { requestId: a.id, reason: "probe TASK-048 hủy phiếu" });
  check("A8 · audit CANCEL được ghi (JS :1062)", cancelA.status === 200 && auditActions(a.id).includes("CANCEL"),
    `HTTP ${cancelA.status} · ${cancelA.message || cancelA.error} · actions=[${auditActions(a.id).join(",")}]`);
  const cancelRow = (auditsOf(a.id).find((r) => r[0] === "CANCEL") ?? [])[3] ?? "";
  check("A9 · after_json của CANCEL có đúng `reason`", /probe TASK-048 hủy phiếu/.test(cancelRow), cancelRow.slice(0, 160));
  check("A10 · chuỗi audit của phiếu A đúng thứ tự JS",
    JSON.stringify(auditActions(a.id)) === JSON.stringify(["CREATE", "EDIT_RETURNED", "RESUBMIT", "CANCEL"]),
    auditActions(a.id).join(" → "));

  // ══════════ PHIẾU B: CREATE → DELETE_RETURNED ══════════
  console.log("\n═══ PHIẾU B (tạo → từ chối → XOÁ) ═══");
  const b = await createRequest("B");
  const rejectB = await call("decide_approval", { requestId: b.id, stage: b.stage,
    decision: "rejected", comment: "probe TASK-048: trả lại để thử nhánh xoá" });
  check("B1 · từ chối ⇒ returned_to_requester", rejectB.status === 200 &&
    sqlOne(`SELECT status FROM material_requests WHERE id=${q(b.id)}`) === "returned_to_requester",
    `HTTP ${rejectB.status} · ${rejectB.message || rejectB.error}`);

  const deleteB = await call("delete_request", { requestId: b.id, reason: "" });
  const bItemIds = savedItemIds.get(b.id) ?? [];
  const gone = sqlOne(`SELECT COUNT(*) FROM material_requests WHERE id=${q(b.id)}`);
  check("B2 · xoá được phiếu bị trả lại", deleteB.status === 200 && gone === "0",
    `HTTP ${deleteB.status} · ${deleteB.message || deleteB.error} · còn ${gone} dòng`);
  const bActions = auditActions(b.id);
  check("B3 · audit DELETE_RETURNED được ghi TRƯỚC khi xoá (JS :1030) — dấu vết còn lại sau khi phiếu biến mất",
    bActions.includes("DELETE_RETURNED"), `actions=[${bActions.join(",")}]`);
  const deleteRow = (auditsOf(b.id).find((r) => r[0] === "DELETE_RETURNED") ?? [])[3] ?? "";
  check("B4 · after_json của DELETE_RETURNED có lý do MẶC ĐỊNH của JS khi payload rỗng",
    /CHT xóa phiếu bị trả lại để lập mới/.test(deleteRow), deleteRow.slice(0, 160));
  const beforeRow = (auditsOf(b.id).find((r) => r[0] === "DELETE_RETURNED") ?? [])[4] ?? "";
  check("B5 · before_json giữ 5 trường của `mr` như JS (id, requestNo, projectId, requestedBy, status)",
    ["requestNo", "projectId", "requestedBy", "status"].every((k) => beforeRow.includes(`"${k}"`)), beforeRow.slice(0, 200));

  // ---------- PHÁT HIỆN KÈM (đo, KHÔNG phải phép kiểm ĐẠT/HỎNG): `delete_request` để lại RÁC ----------
  // Known issue #36 / quyết định D1: CẢ JS LẪN JAVA đều không xoá `procurement_allocations` khi xoá phiếu.
  const orphanAlloc = sqlRows(`SELECT id,stage,reference_no FROM procurement_allocations
     WHERE request_item_id IN (${bItemIds.map(q).join(",") || "NULL"})`);
  console.log(`  → PHÁT HIỆN KÈM: sau \`delete_request\`, còn ${orphanAlloc.length} dòng ` +
    `procurement_allocations mồ côi của phiếu B (known issue #36 / D1) — bằng chứng SỐNG. ` +
    `Truy được theo reference_no: ${orphanAlloc.map((r) => r[2]).join(",") || "(không)"}`);
  check("GIỚI HẠN đã biết: probe DỌN dòng phân bổ mồ côi này (nếu không sẽ báo 'chưa dọn sạch' oan)",
    true, `${orphanAlloc.length} dòng sẽ bị dọn trong finally`);
} catch (error) {
  check("probe chạy trọn vẹn (không ném lỗi)", false, String(error?.message ?? error));
} finally {
  // ---------- DỌN SẠCH ----------
  // Phiếu B đã bị API xoá; phiếu A đang `cancelled` nên phải xoá cứng bằng SQL (API không cho xoá phiếu đã hủy).
  for (const id of createdIds) {
    hardDelete(id, savedItemIds.get(id) ?? []);
    const left = sqlOne(`SELECT COUNT(*) FROM material_requests WHERE id=${q(id)}`);
    if (left !== "0") cleanupFailures.push(`phiếu ${savedRequestIds.get(id) ?? id} vẫn còn trong DB`);
  }
  const after = counts();
  const drift = Object.keys(before).filter((t) => before[t] !== after[t]);
  console.log(`\nSAU KHI DỌN: ${JSON.stringify(after)}`);
  check("dọn sạch: mọi bảng nghiệp vụ trở về ĐÚNG số dòng ban đầu (trừ audit_logs — bảng ghi thêm, giữ làm bằng chứng)",
    drift.length === 0 && cleanupFailures.length === 0,
    drift.length ? `lệch: ${drift.map((t) => `${t} ${before[t]}→${after[t]}`).join(" · ")}` : "khớp toàn bộ");
  try {
    console.log(`  (bỏ qua) document_sequences bị đẩy lên khi lập phiếu: ${sqlOne("SELECT last_number FROM document_sequences WHERE document_type='DNMH' ORDER BY updated_at DESC LIMIT 1")}`);
  } catch (e) {
    // ⚠️ LỖI CỦA CHÍNH PROBE (lượt chạy đầu): câu này dùng cột KHÔNG tồn tại (`sequence_key`,
    // `last_value` — cột thật là `document_type`, `last_number`) và vì thế **ném lỗi sau khi mọi phép
    // kiểm đã ĐẠT** ⇒ probe thoát 1 oan. Nay bọc try/catch để dòng thông tin không bao giờ làm hỏng kết quả.
    console.log(`  (bỏ qua) không đọc được document_sequences: ${String(e.stderr ?? e.message).trim().slice(0, 120)}`);
  }
  console.log(`  (bỏ qua) audit_logs là bảng APPEND-ONLY: probe KHÔNG xoá dấu vết kiểm toán vừa tạo`);
}

const failed = results.filter((r) => !r.ok);
console.log(`\n═══ KẾT QUẢ: ${results.length - failed.length}/${results.length} ĐẠT ═══`);
if (failed.length) { console.log("MỤC HỎNG:"); for (const f of failed) console.log(`  • ${f.name} — ${f.detail}`); }
console.log("GIỚI HẠN: mốc APPROVE_PARTIAL (JS :1101) KHÔNG nằm trong probe này — nó thuộc nhánh duyệt");
console.log("         nhiều vai trò (`all_roles`) mà Java CHƯA port hành vi (xem TASK-048.md mục 5).");
process.exit(failed.length ? 1 : 0);
