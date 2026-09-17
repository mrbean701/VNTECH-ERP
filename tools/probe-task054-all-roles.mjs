// ============================================================================
// TASK-054 — cổng kiểm chứng nhánh duyệt SONG SONG `all_roles` (JS `:1087-1108`)
// ============================================================================
// LỖI ĐƯỢC KIỂM: Java trước đây "đơn giản hoá" nhánh `all_roles` ⇒ **MỘT vai trò xác nhận là hồ sơ
// CHUYỂN BƯỚC**, tức vô hiệu hoá ràng buộc "mọi vai trò phải xác nhận". JS `:1097-1102` còn tính
// `missing`, cập nhật comment tiến độ, ghi audit `APPROVE_PARTIAL` và **RETURN SỚM (không chuyển bước)**.
//
// DỮ LIỆU THẬT DÙNG ĐỂ KIỂM (đo trước khi viết probe):
//   `approval_stage_catalog` có ĐÚNG 1 bước `all_roles`: stage_no=5, allowed_role_codes='da_truong,kh_truong'
//   ⇒ probe LÁI THẬT: tạo phiếu → duyệt các bước 1..4 (admin) → tới bước 5 → xác nhận LẦN 1 → khẳng định
//   hồ sơ **CHƯA chuyển bước** + comment tiến độ + audit; → xác nhận LẦN 2 → khẳng định mới hoàn tất.
//
// AN TOÀN DỮ LIỆU: tạo THẬT 1 phiếu (cách duy nhất chạm đúng mã), DỌN SẠCH trong `finally` bằng SQL
// (phiếu ở trạng thái `approved` nên API không cho xoá), mỗi câu DELETE một lần chạy + gom lỗi.
// `audit_logs` là bảng append-only — GIỮ LẠI làm bằng chứng.
//
// GIỚI HẠN (nói thẳng): hành vi CŨ (chuyển bước sớm) **không đo lại được** vì jar cũ đã bị ghi đè;
// đối chứng cho hành vi cũ là **đọc mã + chú thích trong mã** (`"đơn giản: tiếp tục như single"`).
// Phép kiểm "hồ sơ CHƯA chuyển bước sau xác nhận lần 1" sẽ **HỎNG** nếu chạy trên bản cũ.
//
// Chạy: node tools/probe-task054-all-roles.mjs [base]
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
const note = (m) => console.log(`  (bỏ qua)  ${m}`);

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

// ---------- 0. TIỀN ĐIỀU KIỆN + TRẠNG THÁI TRƯỚC ----------
const allRolesStages = sqlRows(`SELECT stage_no,allowed_role_codes,name FROM approval_stage_catalog
   WHERE active=1 AND approval_mode='all_roles' ORDER BY stage_no`);
console.log(`Bước \`all_roles\` đang hoạt động: ${allRolesStages.length ? allRolesStages.map((r) => `#${r[0]} [${r[1]}]`).join(" · ") : "(KHÔNG CÓ)"}\n`);
if (allRolesStages.length === 0) {
  console.log("KẾT LUẬN: dữ liệu hiện tại KHÔNG có bước `all_roles` ⇒ KHÔNG kiểm được end-to-end.");
  console.log("(Theo TASK-054.md: khi đó phải kiểm bằng test đơn vị với RequestStore giả — KHÔNG tự tạo cấu hình duyệt.)");
  process.exit(0);
}
const [stageNoRaw, rolesRaw, stageName] = allRolesStages[0];
const allRolesStage = Number(stageNoRaw);
const requiredRoles = String(rolesRaw).split(",").map((s) => s.trim()).filter(Boolean);
check("tiền điều kiện: bước `all_roles` có ≥2 vai trò bắt buộc", requiredRoles.length >= 2,
  `bước #${allRolesStage} “${stageName}” · vai trò: ${requiredRoles.join(", ")}`);

const TBL = ["material_requests", "material_request_items", "approvals", "approval_stage_decisions",
  "request_comments", "procurement_allocations", "custom_field_values", "supply_workflow_steps", "stock_reservations"];
const counts = () => Object.fromEntries(TBL.map((t) => [t, Number(sqlOne(`SELECT COUNT(*) FROM ${t}`))]));
const before = counts();
console.log(`TRƯỚC: ${JSON.stringify(before)}\n`);

const cleanupFailures = [];
function execSql(statement, label) {
  try { sql(statement); return true; }
  catch (e) { cleanupFailures.push(`${label}: ${String(e.stderr ?? e.message).trim().slice(0, 120)}`); return false; }
}

let requestId = null;
let requestNo = "";
let itemIds = [];

try {
  // ---------- 1. TẠO PHIẾU ----------
  const data = await boot();
  const material = (data.materials ?? [])[0];
  if (!material?.id) throw new Error("bootstrap không có vật tư");
  const created = await call("create_request", {
    projectId: PROJECT_ID, neededAt: "2026-12-31", priority: "normal",
    area: "Khu vực probe TASK-054", purpose: "probe TASK-054",
    lines: [{ materialId: material.id, materialCode: material.code, materialName: material.name,
      unit: material.unit, quantity: 1, unitPrice: 1000, itemType: "phat_sinh", outsideContract: true,
      note: "probe TASK-054" }],
  });
  if (created.status !== 200) throw new Error(`create_request lỗi: ${created.message || created.error}`);
  requestNo = (created.message.match(/DNMH-\S+?(?= gồm)/) ?? [""])[0];
  requestId = sqlOne(`SELECT id FROM material_requests WHERE request_no=${q(requestNo)}`);
  if (!requestId) throw new Error(`không tìm thấy phiếu ${requestNo} trong DB`);
  itemIds = sqlRows(`SELECT id FROM material_request_items WHERE request_id=${q(requestId)}`).map((r) => r[0]);
  console.log(`  phiếu ${requestNo} · ở bước ${sqlOne(`SELECT approval_stage FROM material_requests WHERE id=${q(requestId)}`)}`);

  // ---------- 2. DUYỆT CÁC BƯỚC TRƯỚC (single) ĐỂ TỚI BƯỚC all_roles ----------
  let guard = 0;
  let current = Number(sqlOne(`SELECT approval_stage FROM material_requests WHERE id=${q(requestId)}`));
  while (current < allRolesStage && guard++ < 10) {
    const step = await call("decide_approval", { requestId, stage: current, decision: "approved",
      comment: `probe TASK-054 duyệt bước ${current}` });
    if (step.status !== 200) throw new Error(`duyệt bước ${current} lỗi: ${step.message || step.error}`);
    const next = Number(sqlOne(`SELECT approval_stage FROM material_requests WHERE id=${q(requestId)}`));
    if (next === current) throw new Error(`duyệt bước ${current} nhưng không chuyển bước (dữ liệu bất thường)`);
    current = next;
  }
  check(`đã tới được bước \`all_roles\` #${allRolesStage} (đi qua ${allRolesStage - 1} bước single)`,
    current === allRolesStage, `approval_stage=${current}`);

  // ---------- 2b. PHÁT HIỆN (đo, KHÔNG phải lỗi của bản Java): SNAPSHOT ĐÓNG BĂNG CHẾ ĐỘ THÀNH `single` ----------
  // JS `:976` ghi `assignedOwner ? "single" : (clean(stage.approvalMode) || "single")` ⇒ hễ bước CÓ owner
  // phân công là snapshot = `single`; JS `:1080` (và bản Java port y hệt) lại ưu tiên SNAPSHOT hơn cấu hình
  // hiện tại ⇒ nhánh `all_roles` **KHÔNG BAO GIỜ CHẠY** với dữ liệu thật, ở CẢ HAI lõi.
  // Đo trên toàn bộ phiếu hiện có: mọi dòng bước 5 đều `approval_mode_snapshot='single'`.
  const snapMode = sqlOne(`SELECT approval_mode_snapshot FROM approvals
     WHERE request_id=${q(requestId)} AND stage=${allRolesStage}`);
  const frozenCount = sqlOne(`SELECT COUNT(*) FROM approvals a
     JOIN approval_stage_catalog c ON c.stage_no=a.stage
     WHERE c.approval_mode='all_roles' AND COALESCE(NULLIF(a.approval_mode_snapshot,''),c.approval_mode,'single')='single'`);
  const allRows = sqlOne(`SELECT COUNT(*) FROM approvals a
     JOIN approval_stage_catalog c ON c.stage_no=a.stage WHERE c.approval_mode='all_roles'`);
  console.log(`  → PHÁT HIỆN KÈM: cấu hình nói \`${sqlOne(`SELECT approval_mode FROM approval_stage_catalog WHERE stage_no=${allRolesStage}`)}\` ` +
    `nhưng snapshot của phiếu là \`${snapMode}\`; toàn hệ thống: ${frozenCount}/${allRows} dòng bước \`all_roles\` bị ĐÓNG BĂNG thành \`single\``);
  check("GHI NHẬN (dùng chung cả hai lõi, cần người dùng quyết định): snapshot đóng băng chế độ ⇒ BƯỚC all_roles KHÔNG chạy",
    frozenCount === allRows && allRows !== "0", `${frozenCount}/${allRows} dòng bị đóng băng`);
  // Vì vậy, để KIỂM ĐƯỢC nhánh mã vừa port, probe tự dựng ĐÚNG ca cần kiểm trên CHÍNH dòng của phiếu probe
  // (fixture hợp lệ: chỉ đụng dòng do probe tạo, sẽ bị xoá ở `finally`):
  execSql(`UPDATE approvals SET approval_mode_snapshot='all_roles'
           WHERE request_id=${q(requestId)} AND stage=${allRolesStage}`, "fixture approval_mode_snapshot");
  check("dựng đúng ca cần kiểm: snapshot bước = `all_roles` (fixture trên dòng của phiếu probe)",
    sqlOne(`SELECT approval_mode_snapshot FROM approvals WHERE request_id=${q(requestId)} AND stage=${allRolesStage}`) === "all_roles",
    sqlOne(`SELECT approval_mode_snapshot FROM approvals WHERE request_id=${q(requestId)} AND stage=${allRolesStage}`));

  // ---------- 3. XÁC NHẬN LẦN 1 — HỒ SƠ PHẢI **CHƯA** CHUYỂN BƯỚC ----------
  console.log(`\n═══ XÁC NHẬN LẦN 1 ở bước #${allRolesStage} (bắt buộc ≥2 vai trò) ═══`);
  const first = await call("decide_approval", { requestId, stage: allRolesStage, decision: "approved",
    comment: "probe TASK-054 xác nhận lần 1" });
  check("lần 1 trả HTTP 200", first.status === 200, `HTTP ${first.status} · ${first.message || first.error}`);

  const statusAfter1 = sqlOne(`SELECT status FROM material_requests WHERE id=${q(requestId)}`);
  const stageAfter1 = Number(sqlOne(`SELECT approval_stage FROM material_requests WHERE id=${q(requestId)}`));
  check("★ hồ sơ VẪN `pending_approval` (JS `:1102` return sớm — KHÔNG chuyển bước)",
    statusAfter1 === "pending_approval", `status=${statusAfter1}`);
  check("★ `approval_stage` VẪN ở bước `all_roles`", stageAfter1 === allRolesStage, `approval_stage=${stageAfter1}`);

  const decisions1 = sqlRows(`SELECT role_code,decision FROM approval_stage_decisions
     WHERE request_id=${q(requestId)} AND stage=${allRolesStage} ORDER BY role_code`);
  check("đã ghi ĐÚNG 1 dòng quyết định (vai trò đầu tiên)", decisions1.length === 1,
    decisions1.map((r) => `${r[0]}:${r[1]}`).join(",") || "(không có)");
  check("vai trò được ghi thuộc danh sách bắt buộc của bước",
    decisions1.length === 1 && requiredRoles.includes(decisions1[0][0]), decisions1[0]?.[0] ?? "—");

  const progress = sqlOne(`SELECT comment FROM approvals WHERE request_id=${q(requestId)} AND stage=${allRolesStage}`);
  check("★ comment tiến độ đúng định dạng JS (JS `:1099`)",
    /^Đã xác nhận 1\/\d+; còn chờ: /.test(String(progress)), String(progress));

  const auditRow = sqlRows(`SELECT after_json FROM audit_logs WHERE entity_id=${q(requestId)}
     AND action='APPROVE_PARTIAL' AND entity_type='material_request'`);
  check("★ audit `APPROVE_PARTIAL` được ghi (JS `:1101`)", auditRow.length === 1, `${auditRow.length} dòng`);
  const after = String(auditRow[0]?.[0] ?? "");
  check("after_json có đủ 4 khoá JS: stage · stageName · roleCode · missing",
    ["stage", "stageName", "roleCode", "missing"].every((k) => after.includes(`"${k}"`)), after.slice(0, 200));
  const missingRoles = requiredRoles.filter((r) => !decisions1.some((d) => d[0] === r));
  check("`missing` trong audit đúng bằng các vai trò còn thiếu",
    missingRoles.every((r) => after.includes(r)), `còn thiếu: ${missingRoles.join(",")}`);

  // ---------- 4. XÁC NHẬN LẦN 2 — ĐỦ VAI TRÒ ⇒ MỚI HOÀN TẤT ----------
  console.log(`\n═══ XÁC NHẬN LẦN 2 ở bước #${allRolesStage} ═══`);
  const second = await call("decide_approval", { requestId, stage: allRolesStage, decision: "approved",
    comment: "probe TASK-054 xác nhận lần 2" });
  check("lần 2 trả HTTP 200", second.status === 200, `HTTP ${second.status} · ${second.message || second.error}`);
  const decisions2 = sqlRows(`SELECT role_code FROM approval_stage_decisions
     WHERE request_id=${q(requestId)} AND stage=${allRolesStage} ORDER BY role_code`).map((r) => r[0]);
  check("★ đã ghi đủ số vai trò bắt buộc", decisions2.length === requiredRoles.length,
    `${decisions2.length}/${requiredRoles.length} · ${decisions2.join(",")}`);
  check("★ mọi vai trò bắt buộc đều có mặt", requiredRoles.every((r) => decisions2.includes(r)),
    requiredRoles.join(","));
  check("★ hồ sơ đã hoàn tất (đủ vai trò mới chuyển)",
    sqlOne(`SELECT status FROM material_requests WHERE id=${q(requestId)}`) === "approved",
    `status=${sqlOne(`SELECT status FROM material_requests WHERE id=${q(requestId)}`)}`);
  check("bước cuối ⇒ sinh bước cung ứng chờ lập PO (như JS)",
    Number(sqlOne(`SELECT COUNT(*) FROM supply_workflow_steps WHERE request_id=${q(requestId)} AND step='po_creation'`)) === 1,
    `${sqlOne(`SELECT COUNT(*) FROM supply_workflow_steps WHERE request_id=${q(requestId)}`)} dòng supply_workflow_steps`);
  check("KHÔNG ghi thêm `APPROVE_PARTIAL` sau khi đã đủ vai trò",
    Number(sqlOne(`SELECT COUNT(*) FROM audit_logs WHERE entity_id=${q(requestId)} AND action='APPROVE_PARTIAL'`)) === 1,
    `${sqlOne(`SELECT COUNT(*) FROM audit_logs WHERE entity_id=${q(requestId)} AND action='APPROVE_PARTIAL'`)} dòng`);
  console.log(`  chuỗi audit của phiếu: ${sqlRows(`SELECT action FROM audit_logs WHERE entity_id=${q(requestId)} ORDER BY occurred_at`).map((r) => r[0]).join(" → ")}`);
} catch (error) {
  check("probe chạy trọn vẹn (không ném lỗi)", false, String(error?.message ?? error));
} finally {
  if (requestId) {
    const itemSql = itemIds.length ? itemIds.map(q).join(",") : "NULL";
    execSql(`DELETE FROM supply_workflow_steps WHERE request_id=${q(requestId)}`, "supply_workflow_steps");
    execSql(`DELETE FROM stock_reservations WHERE request_id=${q(requestId)}`, "stock_reservations");
    execSql(`DELETE FROM procurement_allocations WHERE request_item_id IN (${itemSql})`, "procurement_allocations");
    execSql(`DELETE FROM custom_field_values WHERE entity_id IN (${itemSql})`, "custom_field_values");
    execSql(`DELETE FROM approval_stage_decisions WHERE request_id=${q(requestId)}`, "approval_stage_decisions");
    execSql(`DELETE FROM approvals WHERE request_id=${q(requestId)}`, "approvals");
    execSql(`DELETE FROM request_comments WHERE request_id=${q(requestId)}`, "request_comments");
    execSql(`DELETE FROM material_request_items WHERE request_id=${q(requestId)}`, "material_request_items");
    execSql(`DELETE FROM material_requests WHERE id=${q(requestId)}`, "material_requests");
    if (sqlOne(`SELECT COUNT(*) FROM material_requests WHERE id=${q(requestId)}`) !== "0")
      cleanupFailures.push(`phiếu ${requestNo} vẫn còn trong DB`);
  }
  const afterCounts = counts();
  const drift = Object.keys(before).filter((t) => before[t] !== afterCounts[t]);
  console.log(`\nSAU KHI DỌN: ${JSON.stringify(afterCounts)}`);
  check("dọn sạch: mọi bảng nghiệp vụ về ĐÚNG số dòng ban đầu (audit_logs giữ lại làm bằng chứng)",
    drift.length === 0 && cleanupFailures.length === 0,
    drift.length ? drift.map((t) => `${t} ${before[t]}→${afterCounts[t]}`).join(" · ") : (cleanupFailures.join(" · ") || "khớp toàn bộ"));
  try {
    console.log(`  (bỏ qua) document_sequences DNMH: ${sqlOne("SELECT last_number FROM document_sequences WHERE document_type='DNMH' ORDER BY updated_at DESC LIMIT 1")}`);
  } catch { /* thông tin, không ảnh hưởng kết quả */ }
}

const failed = results.filter((r) => !r.ok);
console.log(`\n═══ KẾT QUẢ: ${results.length - failed.length}/${results.length} ĐẠT ═══`);
if (failed.length) { console.log("MỤC HỎNG:"); for (const f of failed) console.log(`  • ${f.name} — ${f.detail}`); }
console.log("GIỚI HẠN: hành vi CŨ (chuyển bước sớm) không đo lại được vì jar cũ đã bị ghi đè —");
console.log("         phép kiểm ★ 'hồ sơ VẪN pending_approval sau xác nhận lần 1' sẽ HỎNG nếu chạy trên bản cũ.");
process.exit(failed.length ? 1 : 0);
