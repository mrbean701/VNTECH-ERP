// TASK-130 → TASK-132 → TASK-133 — CHẠY TRỌN LUỒNG CẤP PHÁT + XUẤT KHO (WF-XUATKHO-01) BẰNG ĐÚNG TÀI KHOẢN TỪNG VAI TRÒ
//
//   node tools/probe-stock-issue-flow.mjs            # chạy thử, in kế hoạch (KHÔNG gọi HTTP)
//   node tools/probe-stock-issue-flow.mjs --apply    # thực thi thật
//
// Khuôn mẫu: tools/probe-purchasing-flow.mjs (TASK-128).
// Quy ước ĐẠT/HỎNG: bước có `expectFail: true` là ĐỐI CHỨNG ÂM —
//   bị TỪ CHỐI mới là ĐẠT, được chấp nhận là HỎNG.
//
// ── PHẠM VI LƯỢT NÀY (TASK-133): TRỌN 5 BƯỚC CỦA WF-XUATKHO-01 ──────────────────
//  ① tạo phiếu (chỉ cần quyền tạo) · ② CHỈ HUY TRƯỞNG DUYỆT · ③ TIẾN HÀNH XUẤT KHO ·
//  ④ THỦ KHO XÁC NHẬN ĐÃ XUẤT ĐỦ · ⑤ CHUYỂN THÀNH GRN NHẬP KHO KHÁC (không duyệt).
//  ⇒ KHÔNG còn bước nào «CHƯA LÀM».
//
// ── ĐÃ ĐO TRƯỚC (không đoán) ────────────────────────────────────────────────────
//  · TRƯỚC TASK-132: `issue_stock` (Java `SystemController.java:1179` →
//    `StockManagementUseCase.issueStock` :53-162) TẠO PHIẾU Ở TRẠNG THÁI `posted` NGAY, trong MỘT
//    lệnh HTTP: `WarehouseStockStoreAdapter.insertStockIssue` dòng 121 bind cứng `"posted"`.
//    `SELECT COUNT(*) FROM approvals WHERE entity_id LIKE 'ISS%'` = **0** ⇒ không bước duyệt nào.
//  · TRƯỚC TASK-133 (nợ kỹ thuật đã đo): `insertStockIssue` ghi LUÔN `stock_movements` (SMI) +
//    `contract_stock_ledger` NGAY LÚC TẠO PHIẾU ⇒ TRỪ TỒN KHO Ở BƯỚC ①, trước cả khi CHT duyệt ⇒
//    bước duyệt ② chỉ là «treo biển». TASK-133 TÁCH phần ghi kho sang action `issue_stock_confirm`
//    (③, chỉ chạy khi phiếu `approved`).
//  · `supply_workflow_steps` KHÔNG có UNIQUE key (đo `SHOW INDEX`: chỉ PRIMARY(id) + 2 index
//    NON-unique) ⇒ `ON DUPLICATE KEY UPDATE` cũ KHÔNG BAO GIỜ kích hoạt ⇒ mỗi lần xuất cùng một MR
//    chèn thêm 1 dòng `step='issue'` (đo được: `MR_f4636c1c-…` 5 dòng · `MR_62b3e402-…` 4 dòng).
//    TASK-133 đổi sang UPDATE-then-INSERT ⇒ đúng 1 dòng/MR (probe này ĐO số dòng TRƯỚC/SAU).
const BASE = process.env.PROBE_BASE || "http://127.0.0.1:9000";
const PASS = "Vntech@2026";
const APPLY = process.argv.includes("--apply");

// Nhãn duy nhất mỗi lượt chạy — tránh đụng ràng buộc duy nhất / chọn nhầm phiếu cũ.
const RUN_TAG = new Date().toISOString().replace(/[-:T.]/g, "").slice(0, 14);

// ---------- Dữ liệu PRJ-DEMO-01 (đo từ MySQL `vntech_erp`, không đoán) ----------
const PRJ = {
  id: "PRJ_fdbfab20-bf1f-4ad5-8159-7dcc582140c3",
  code: "PRJ-DEMO-01",
  fromWarehouseId: "WH_51e0f009-4873-4cb6-855c-e6e7fea41e4d", // KHO-PRJ-DEMO-01
  teamId: "TEAM_8c1fecd9-1060-4f0f-849d-fa8d8dd75878",         // TD-01 (đúng tổ của PRJ-DEMO-01)
  teamWarehouseId: "WHTEAM_3d658322-ae04-49a6-83cb-018748ac9fd3", // TD-PRJ-DEMO-01-TD-01
};
// Số lượng cấp mỗi dòng (không vượt phần CHƯA CẤP của dòng MR — chọn ở `pickRequest()`).
const WANT_QTY = 5;
// ⚠ ĐÃ VA PHẢI (lượt chạy 4): phiếu `MR_f4636c1c-…` (0136) bị CHÍNH PROBE cấp hết
// (`issued_qty` 25/25) ⇒ `issue_stock` trả 400 «số lượng cấp lũy kế vượt nhu cầu MR» và probe
// báo HỎNG GIẢ. Vì vậy KHÔNG hard-code phiếu: chọn động phiếu ĐÃ DUYỆT còn dư chưa cấp.
let MR = null;
// Phiếu PHỤ cố ý để nguyên `pending_cht` — dùng làm «phiếu chưa duyệt/chưa xuất đủ» cho các đối chứng
// âm của bước ③ (xuất khi chưa duyệt ⇒ 400), ④ (xác nhận khi chưa qua ③ ⇒ 400) và ⑤ (sinh GRN khi chưa
// xác nhận đủ ⇒ 400). Khai ở phạm vi MODULE vì được dùng xuyên nhiều khối bước.
let pendingId = null;

// ---------- Chọn phiếu đề nghị ĐÃ DUYỆT còn dư (đo từ bootstrap, không đoán) ----------
// LỌC BẮT BUỘC theo `contractStockBalances`: `issue_stock` còn kiểm **tồn kế toán theo Contract**
// (`StockLedgerEngine.availability` → `contractBalance(projectId, contractId, warehouseId, materialId)`;
// lỗi đo được: «Dòng 1: Contract không đủ tồn kế toán tại kho nguồn (còn 0.000)»). Phiếu 0002 có
// `material_request_items.contract_id = PCON_a6d9b6a3-…` nhưng kho nguồn chỉ có ownership của
// `PCON_78092ea4-…` ⇒ cấp từ kho này LUÔN 400. Vì vậy chỉ chọn phiếu mà **mọi dòng định cấp** đều có
// Contract sở hữu tồn tại kho nguồn, và gửi kèm `contractId` tường minh.
async function pickRequest(boot) {
  const reqs = (boot?.data?.requests || []).filter((r) =>
    String(r.projectId) === PRJ.id &&
    ["approved", "ordered", "partial_received", "received", "partial_issued"].includes(String(r.status)));
  // (materialId|contractId) -> số dư ownership tại KHO NGUỒN
  const owned = new Map();
  for (const b of boot?.data?.contractStockBalances || []) {
    if (String(b.warehouseId) !== PRJ.fromWarehouseId) continue;
    owned.set(`${b.materialId}|${b.contractId}`, Number(b.balance || 0));
  }
  const usable = [];
  for (const r of reqs) {
    const lines = [];
    for (const i of r.items || []) {
      const remaining = Number(i.requestedQty) - Number(i.issuedQty);
      if (remaining < 1 || !i.materialId) continue;
      const contractId = String(i.contractId || r.contractId || "");
      const key = `${i.materialId}|${contractId}`;
      const ownerBal = owned.get(key);
      if (!ownerBal || ownerBal < 1) continue; // không có tồn kế toán ⇒ issue_stock chắc chắn 400
      lines.push({
        requestItemId: i.id, materialId: i.materialId, contractId,
        code: i.materialCode, name: i.materialName, unit: i.unit,
        requestedQty: Number(i.requestedQty), remaining,
        issueQty: Math.min(WANT_QTY, remaining, ownerBal),
      });
    }
    if (lines.length) usable.push({ r, lines });
  }
  if (!usable.length) return null;
  usable.sort((a, z) => z.lines.length - a.lines.length
    || String(z.r.requestNo).localeCompare(String(a.r.requestNo)));
  // ⚠ ĐÃ VA PHẢI (lượt chạy TASK-133): phiếu xuất PHỤ (để đo đối chứng âm «chưa duyệt») cấp trên CÙNG
  // MR với phiếu chính ⇒ 400 «số lượng cấp lũy kế vượt nhu cầu MR» khi phần còn dư chỉ đủ cho 1 phiếu.
  // Nay lấy 2 phiếu ĐỘC LẬP (mỗi phiếu có quota riêng) để cả 2 lần `issue_stock` đều hợp lệ.
  const toSpec = (pick) => ({
    id: pick.r.id, no: pick.r.requestNo, status: pick.r.status, projectCode: pick.r.projectCode,
    lines: pick.lines.slice(0, 2), candidates: usable.length,
  });
  return { main: toSpec(usable[0]), alt: usable[1] ? toSpec(usable[1]) : null };
}

// ---------- Phiên đăng nhập theo từng tài khoản ----------
const sessions = new Map();
async function login(username, password) {
  const res = await fetch(`${BASE}/api/system`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "login", username, password }),
  });
  const json = await res.json().catch(() => null);
  const cookie = (res.headers.getSetCookie?.() || []).map((c) => c.split(";")[0]).join("; ");
  if (res.status === 200 && json?.ok !== false && cookie) sessions.set(username, cookie);
  return { status: res.status, ok: res.ok && json?.ok !== false, json, cookie };
}
async function call(username, action, payload = {}) {
  const res = await fetch(`${BASE}/api/system`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie: sessions.get(username) || "" },
    body: JSON.stringify({ action, ...payload }),
  });
  const text = await res.text();
  let json = null; try { json = JSON.parse(text); } catch { /* không phải JSON */ }
  return { status: res.status, ok: res.ok && json?.ok !== false, json, text };
}

const log = [];
// `opts.expectFail = true` ⇒ ca ĐỐI CHỨNG ÂM: bị từ chối MỚI là ĐẠT.
function step(n, who, what, r, opts = {}) {
  const expectFail = opts.expectFail === true;
  const ok = expectFail ? !r.ok : r.ok;
  const detail = r.ok
    ? (expectFail ? ` → HTTP ${r.status} (ĐƯỢC CHẤP NHẬN — TRÁI KỲ VỌNG ĐỐI CHỨNG ÂM)` : "")
    : ` → HTTP ${r.status}: ${String(r.json?.error || r.json?.message || r.text || "").slice(0, 220)}${expectFail ? " (ĐÚNG — bị từ chối)" : ""}`;
  const line = `${ok ? "✅" : "❌"} ${String(n).padStart(6)}. [${who.padEnd(14)}] ${what}${detail}`;
  console.log(line);
  log.push({ n, who, what, ok, status: r.status, expectFail, error: r.json?.error || r.json?.message || null });
  return r;
}

// `assertStep` — bước KHẲNG ĐỊNH (không phải HTTP call): ĐẠT khi `cond` đúng.
function assertStep(n, who, what, cond, detail) {
  const ok = !!cond;
  console.log(`${ok ? "✅" : "❌"} ${String(n).padStart(6)}. [${who.padEnd(14)}] ${what} → ${detail}`);
  log.push({ n, who, what, ok, status: 0, expectFail: false, error: ok ? null : detail });
  return ok;
}

// Đọc bootstrap (nguồn trạng thái qua API, KHÔNG đoán) bằng phiên của `who`.
async function bootstrap(who) {
  const cookie = sessions.get(who) || sessions.get("admin") || "";
  const res = await fetch(`${BASE}/api/system`, { headers: { cookie } });
  return res.json();
}
function issueIn(boot, id) {
  const issues = boot?.data?.stockIssues || boot?.data?.issues || [];
  return issues.find((i) => String(i.id) === String(id)) || null;
}

console.log("═".repeat(110));
console.log(`  LUỒNG CẤP PHÁT / XUẤT KHO — ${PRJ.code} · ${APPLY ? "THỰC THI" : "XEM TRƯỚC"}`);
console.log("═".repeat(110));
console.log(`  kho nguồn : KHO-PRJ-DEMO-01 (${PRJ.fromWarehouseId})`);
console.log(`  kho nhận  : kho tổ đội TD-01 (${PRJ.teamWarehouseId})`);
console.log(`  phiếu MR  : (chọn động sau khi đăng nhập — phiếu ĐÃ DUYỆT còn dư chưa cấp)\n`);

const ACTORS = ["tkhodemo", "cha.ht", "kttdemo", "engineer.demo", "giamdoc.demo", "trdademo"];

if (!APPLY) {
  console.log("KẾ HOẠCH (chạy lại với --apply để thực thi):");
  console.log("  1. đăng nhập từng vai trò: " + ACTORS.join(", "));
  console.log("  2. ĐỐI CHỨNG ÂM A — engineer.demo / giamdoc.demo gọi issue_stock ⇒ KỲ VỌNG 403");
  console.log("  3. BƯỚC ① — TẠO phiếu xuất bằng tkhodemo (thủ kho) ⇒ kỳ vọng 200 + status='pending_cht'");
  console.log("     (KHẲNG ĐỊNH status ≠ 'posted' đo lại qua bootstrap — đây là hành vi TASK-132 sửa)");
  console.log("  4. BƯỚC ② — cha.ht (chỉ huy trưởng) gọi approve_stock_issue ⇒ kỳ vọng 200 +");
  console.log("     status='approved' + 1 bản ghi `approvals(entity_type='stock_issue', stage=1, status='approved')`");
  console.log("  5. ĐỐI CHỨNG ÂM B — engineer.demo duyệt ⇒ KỲ VỌNG 403 · duyệt LẦN 2 ⇒ KỲ VỌNG 400 ·");
  console.log("     duyệt phiếu KHÔNG tồn tại ⇒ KỲ VỌNG 400");
  console.log("  6. BƯỚC ③ — tkhodemo gọi `issue_stock_confirm` ⇒ kỳ vọng 200 + status='issued'");
  console.log("     (ĐO ĐƯỢC: trước TASK-133 tồn kho đã bị trừ NGAY ở bước ①; nay chỉ trừ ở ③)");
  console.log("     ĐỐI CHỨNG ÂM: gọi ③ khi phiếu còn `pending_cht` ⇒ 400 · user không có quyền kho ⇒ 403 ·");
  console.log("     gọi ③ LẦN 2 cùng phiếu ⇒ 400 (KHÔNG ghi thêm movement/ledger)");
  console.log("  7. BƯỚC ④ — tkhodemo (thủ kho) gọi `confirm_stock_issue` ⇒ kỳ vọng 200 + status='completed'");
  console.log("     ĐỐI CHỨNG ÂM: cha.ht (không phải thủ kho) ⇒ 403 · xác nhận LẦN 2 ⇒ 400 ·");
  console.log("     phiếu chưa qua ③ ⇒ 400");
  console.log("  8. BƯỚC ⑤ — gọi `create_issue_grn` (CHỈ cần quyền TẠO, KHÔNG duyệt) ⇒ kỳ vọng 200 +");
  console.log("     status='grn_created' + 1 `goods_receipts` + N `goods_receipt_items` cho kho đích");
  console.log("     ĐỐI CHỨNG ÂM: phiếu chưa `completed` ⇒ 400 · user không có quyền tạo phiếu nhập ⇒ 403 ·");
  console.log("     phiếu không tồn tại ⇒ 400 · sinh GRN LẦN 2 ⇒ 400");
  console.log("  9. ĐO HỆ QUẢ SQL (do người chạy đối chiếu): `stock_issues.status` · `stock_issue_items` ·");
  console.log("     `stock_movements` (SMI) TRƯỚC/SAU · `contract_stock_ledger` · `approvals` ·");
  console.log("     `goods_receipts`/`goods_receipt_items` · `material_requests.supply_status` ·");
  console.log("     `material_request_items.issued_qty`/`line_status` · số dòng `supply_workflow_steps` (step='issue')");
  process.exitCode = 0;
} else {

// ---------- 0. CHUẨN BỊ: admin đặt mật khẩu demo đã biết ----------
// ĐO ĐƯỢC (lượt chạy đầu): `kttdemo` trả **401** với `Vntech@2026` ⇒ không đăng nhập được nên
// mọi bước dùng tài khoản này rơi vào 401 «Phiên đăng nhập đã hạn» và bị đếm nhầm là ĐỐI CHỨNG ÂM
// ĐẠT. Đặt lại mật khẩu qua `update_user` (chính là kiểm thử chức năng admin), đúng khuôn
// `tools/probe-purchasing-flow.mjs` dòng 124-137. ⚠ BẮT BUỘC `active: 1`.
console.log("\n── CHUẨN BỊ: admin đặt mật khẩu demo đã biết ──");
const al = await login("admin", "Admin123456@");
step("P.admin", "admin", "đăng nhập admin", al);
if (!al.ok) throw new Error("Không đăng nhập được admin ⇒ dừng.");
const boot0 = await (await fetch(`${BASE}/api/system`, { headers: { cookie: sessions.get("admin") } })).json();
const staffRows = boot0?.data?.users || boot0?.data?.staffDirectory || [];
const byName = (u) => staffRows.find((s) => s.username === u);
for (const u of ACTORS) {
  const row = byName(u);
  if (!row) { console.log(`  ⚠️  không có tài khoản ${u}`); continue; }
  const r = await call("admin", "update_user", {
    userId: row.id, employeeCode: row.employeeCode, fullName: row.fullName, username: row.username,
    email: row.email || "", role: row.role, organizationUnitId: row.organizationUnitId,
    approvalLimit: row.approvalLimit ?? 0, newPassword: PASS, active: 1,
  });
  step(`P.${u}`, "admin", `đặt mật khẩu demo cho ${u}`, r);
}

// ---------- 1. CHỌN PHIẾU ĐỀ NGHỊ CÒN DƯ (không hard-code) ----------
console.log("\n── CHỌN PHIẾU ĐỀ NGHỊ ĐÃ DUYỆT CÒN DƯ ĐỂ CẤP PHÁT ──");
const picked = await pickRequest(boot0);
MR = picked?.main || null;
// Phiếu ĐỀ NGHỊ THỨ HAI (độc lập) dùng cho phiếu xuất PHỤ ở đối chứng âm — xem `pickRequest`.
const MR_ALT = picked?.alt || null;
if (!MR || !MR.lines.length) {
  console.log("  ⛔ Không có phiếu ĐÃ DUYỆT nào còn dư chưa cấp ⇒ không thể đo bước tạo phiếu xuất.");
  console.log("     (Cần người dùng duyệt thêm phiếu đề nghị, hoặc tăng nhu cầu — KHÔNG tự sửa dữ liệu.)");
} else {
  console.log(`  chọn: ${MR.no} (${MR.id}) · status=${MR.status} · ${MR.candidates} phiếu khả dụng`);
  for (const l of MR.lines) {
    console.log(`    · ${l.code} ${l.name}: cấp ${l.issueQty}/${l.requestedQty} (còn dư ${l.remaining})`);
  }
  console.log(`  phiếu đề nghị PHỤ (đối chứng âm ③④⑤): ${MR_ALT ? MR_ALT.no : "(không có phiếu thứ 2)"}`);
}

// ---------- 2. ĐĂNG NHẬP TỪNG VAI TRÒ ----------
console.log("\n── ĐĂNG NHẬP THEO TỪNG VAI TRÒ ──");
for (const u of ACTORS) {
  const r = await login(u, PASS);
  step(`L.${u}`, u, `đăng nhập`, r);
}

// ---------- 2. ĐỐI CHỨNG ÂM A — user KHÔNG có quyền gọi issue_stock ----------
console.log("\n── ĐỐI CHỨNG ÂM A: tài khoản KHÔNG có quyền cấp phát gọi issue_stock ──");
const mkIssuePayload = (mr = MR) => ({
  projectId: PRJ.id,
  fromWarehouseId: PRJ.fromWarehouseId,
  teamId: PRJ.teamId,
  requestId: mr?.id,
  receivedByName: "Tổ trưởng TD-01 (kiểm thử TASK-130/133)",
  note: `Kiểm thử TASK-130/133 ${RUN_TAG}`,
  lines: (mr?.lines || []).map((i) => ({
    materialId: i.materialId, requestItemId: i.requestItemId, quantity: i.issueQty,
    contractId: i.contractId,
    workPackageCode: "WP-TEST-T133", installationArea: "Khu A – kiểm thử TASK-133",
  })),
});
for (const who of ["engineer.demo", "giamdoc.demo"]) {
  const r = await call(who, "issue_stock", mkIssuePayload());
  step(`N-A.${who}`, who, "gọi issue_stock — ĐỐI CHỨNG ÂM, KỲ VỌNG 403", r, { expectFail: true });
}

// ---------- 3. TẠO PHIẾU XUẤT (đúng vai trò thủ kho) ----------
console.log("\n── TẠO PHIẾU CẤP PHÁT / XUẤT KHO ──");
let createRes = { status: 0, ok: false, json: null, text: "không có phiếu MR khả dụng" };
if (MR?.lines?.length) {
  createRes = await call("tkhodemo", "issue_stock", mkIssuePayload());
  step("1a", "tkhodemo", "issue_stock — vai trò thu_kho (đúng mô tả WF-XUATKHO-01)", createRes);
  if (!createRes.ok) {
    createRes = await call("cha.ht", "issue_stock", mkIssuePayload());
    step("1b", "cha.ht", "issue_stock — vai trò cht (BCH)", createRes);
  }
  if (!createRes.ok) {
    createRes = await call("admin", "issue_stock", mkIssuePayload());
    step("1c", "admin", "issue_stock — BIỆN PHÁP TẠM nếu các vai trò nghiệp vụ đều bị chặn", createRes);
  }
} else {
  console.log("  ⛔ BỎ QUA bước tạo phiếu xuất — không có phiếu đề nghị ĐÃ DUYỆT nào còn dư.");
}
const issueId = createRes.json?.issueId || createRes.json?.data?.issueId || null;
const issueNo = createRes.json?.issueNo || createRes.json?.data?.issueNo || null;
console.log(`      ↳ issueId=${issueId} · issueNo=${issueNo}`);
const warnings = createRes.json?.warnings || [];
if (warnings.length) console.log(`      ↳ warnings (chế độ CHỈ CẢNH BÁO): ${JSON.stringify(warnings)}`);

// BƯỚC ① — KHẲNG ĐỊNH trạng thái phiếu MỚI: phải là `pending_cht`, KHÔNG được là `posted`.
if (issueId) {
  const bootAfterCreate = await bootstrap("tkhodemo");
  const fresh = issueIn(bootAfterCreate, issueId);
  const st = fresh?.status ?? "(không thấy phiếu trong bootstrap)";
  assertStep("1d", "tkhodemo", "BƯỚC ① — phiếu MỚI KHÔNG còn 'posted' (kỳ vọng pending_cht)",
    st === "pending_cht", `status=${st}`);
} else {
  console.log("  ⛔ Không tạo được phiếu ⇒ bỏ qua khẳng định trạng thái (BƯỚC ①).");
}

// ---------- 4. BƯỚC ② — CHỈ HUY TRƯỞNG DUYỆT (`approve_stock_issue`) ----------
// TASK-132: action MỚI ở `SystemController` cạnh `issue_stock`, quyền = `requireRole(["commander","admin"])`
// (KHÔNG thêm khoá `module_catalog` mới — cổng module dùng lại `approvals`), và SINH bản ghi `approvals`
// với entity_type='stock_issue', entity_id=issueId, stage=1, status='approved', decided_at=now.
console.log("\n── BƯỚC ② — CHỈ HUY TRƯỞNG DUYỆT PHIẾU XUẤT (`approve_stock_issue`) ──");
if (!issueId) {
  console.log("  ⛔ Không có issueId — dừng bước duyệt.");
} else {
  // ĐỐI CHỨNG ÂM B1: người KHÔNG phải chỉ huy trưởng duyệt ⇒ 403.
  const eng = await call("engineer.demo", "approve_stock_issue", {
    issueId, decision: "approved", comment: "Đối chứng âm TASK-132: kỹ sư không được duyệt",
  });
  step("N-B1.eng", "engineer.demo", "duyệt phiếu xuất — ĐỐI CHỨNG ÂM, KỲ VỌNG 403", eng, { expectFail: true });

  // ĐỐI CHỨNG ÂM B2: phiếu KHÔNG tồn tại ⇒ 400.
  const ghost = await call("cha.ht", "approve_stock_issue", {
    issueId: "ISS_khong-ton-tai", decision: "approved", comment: "Đối chứng âm TASK-132: phiếu không tồn tại",
  });
  step("N-B2.ghost", "cha.ht", "duyệt phiếu KHÔNG tồn tại — ĐỐI CHỨNG ÂM, KỲ VỌNG 400", ghost, { expectFail: true });

  // BƯỚC ② THẬT: cha.ht (chỉ huy trưởng) duyệt ⇒ 200.
  const ok2 = await call("cha.ht", "approve_stock_issue", {
    issueId, decision: "approved", comment: "CHT duyệt phiếu xuất (TASK-132 bước ②)",
  });
  step("2.1", "cha.ht", "approve_stock_issue — CHỈ HUY TRƯỞNG duyệt", ok2);
  if (ok2.ok) console.log(`      ↳ ${String(ok2.json?.message || "").slice(0, 200)}`);

  const bootAfterApprove = await bootstrap("cha.ht");
  const approved = issueIn(bootAfterApprove, issueId);
  const st2 = approved?.status ?? "(không thấy phiếu trong bootstrap)";
  assertStep("2.2", "cha.ht", "sau duyệt: stock_issues.status = 'approved' (sẵn sàng xuất kho)",
    st2 === "approved", `status=${st2}`);
  // ⚠ GHI NHẬN (TASK-133): bootstrap KHÔNG trả `approved_by` của phiếu xuất — payload `data.issues`
  // chỉ có `id/issueNo/projectId/teamId/projectCode/teamName/issuedAt/status/receivedByName/itemCount/
  // totalQty/installedQty` (`BootstrapDataAdapter.java:373-385`). Trước TASK-133 probe khẳng định
  // «approvedBy != null» ⇒ ĐỎ GIẢ vĩnh viễn vì trường đó CHƯA BAO GIỜ tồn tại trên HTTP. Bằng chứng
  // đúng cho `approved_by` là SQL (dòng ghi chú bên dưới) — đo được trên LIVE: `USR_911a47b2-…` = cha.ht.
  console.log(`      ↳ (approved_by KHÔNG có trong payload bootstrap — đối chiếu bằng SQL ở mục dưới)`);

  // ĐỐI CHỨNG ÂM B3: duyệt LẦN 2 ⇒ 400 (đã duyệt rồi).
  const twice = await call("cha.ht", "approve_stock_issue", {
    issueId, decision: "approved", comment: "Đối chứng âm TASK-132: duyệt lần 2",
  });
  step("N-B3.2lan", "cha.ht", "duyệt LẦN 2 cùng phiếu — ĐỐI CHỨNG ÂM, KỲ VỌNG 400", twice, { expectFail: true });
}

// ---------- 4c. BƯỚC ③ — TIẾN HÀNH XUẤT KHO (`issue_stock_confirm`) ----------
// TASK-133: action MỚI. ĐÂY mới là chỗ ghi `stock_movements` (SMI) + `contract_stock_ledger` — phần
// ghi kho đã được TÁCH RA khỏi `insertStockIssue` (đường tạo phiếu ①) vì trước đây nó trừ tồn kho
// ngay lúc tạo phiếu, TRƯỚC cả khi CHT duyệt ⇒ bước ② chỉ là «treo biển».
// Quyền: cổng VAI TRÒ requireRole(["warehouse","commander","admin"]) + phạm vi dự án/kho nguồn.
// Cổng MODULE dùng lại khoá SẴN CÓ `warehouse_issue` (⛔ 0 khoá `module_catalog` mới).
// ⚠ Trên tài khoản CHT (`cha.ht`): cổng VAI TRÒ cho qua (commander) nhưng `warehouse_issue` có thể
// thiếu ⇒ dùng `tkhodemo` (thu_kho, đúng vai trò «thủ kho xuất kho») cho bước nghiệp vụ.
console.log("\n── BƯỚC ③ — TIẾN HÀNH XUẤT KHO (`issue_stock_confirm`) ──");
if (!issueId) {
  console.log("  ⛔ Không có issueId — dừng bước ③.");
} else {
  // ĐỐI CHỨNG ÂM ③a — phiếu KHÔNG tồn tại ⇒ 400.
  const ghost3 = await call("tkhodemo", "issue_stock_confirm", { issueId: "ISS_khong-ton-tai" });
  step("N-C1.ghost", "tkhodemo", "xuất kho phiếu KHÔNG tồn tại — ĐỐI CHỨNG ÂM, KỲ VỌNG 400", ghost3, { expectFail: true });

  // ĐỐI CHỨNG ÂM ③b — phiếu CHƯA DUYỆT (`pending_cht`) ⇒ 400. Tạo THÊM 1 phiếu mới rồi để nguyên
  // `pending_cht` (dùng lại cho đối chứng âm của ④ và ⑤). Dùng PHIẾU ĐỀ NGHỊ THỨ HAI ĐỘC LẬP —
  // cấp trên cùng MR sẽ bị 400 «cấp lũy kế vượt nhu cầu» khi phần dư chỉ đủ 1 phiếu.
  const mrAlt = MR_ALT || MR;
  if (mrAlt?.lines?.length) {
    const p = await call("tkhodemo", "issue_stock", mkIssuePayload(mrAlt));
    step("3.0", "tkhodemo", `tạo THÊM 1 phiếu để đo nhánh «chưa duyệt» (MR ${mrAlt.no})`, p);
    pendingId = p.json?.issueId || p.json?.data?.issueId || null;
  }
  if (pendingId) {
    const notApproved = await call("tkhodemo", "issue_stock_confirm", { issueId: pendingId });
    step("N-C2.pending", "tkhodemo", "xuất kho khi phiếu CHƯA DUYỆT — ĐỐI CHỨNG ÂM, KỲ VỌNG 400",
      notApproved, { expectFail: true });
  } else {
    console.log("  ⚠️  không tạo được phiếu phụ ⇒ bỏ qua đối chứng âm «chưa duyệt» (③).");
  }

  // ĐỐI CHỨNG ÂM ③c — vai trò KHÔNG có quyền xuất kho ⇒ 403.
  const eng3 = await call("engineer.demo", "issue_stock_confirm", { issueId });
  step("N-C3.eng", "engineer.demo", "xuất kho — ĐỐI CHỨNG ÂM, KỲ VỌNG 403", eng3, { expectFail: true });

  // BƯỚC ③ THẬT.
  const ok3 = await call("tkhodemo", "issue_stock_confirm", {
    issueId, note: `Xuất kho theo phiếu đã duyệt (TASK-133 bước ③) ${RUN_TAG}`,
  });
  step("3.1", "tkhodemo", "issue_stock_confirm — TIẾN HÀNH XUẤT KHO", ok3);
  if (ok3.ok) {
    console.log(`      ↳ movementCount=${ok3.json?.movementCount} · totalQty=${ok3.json?.totalQty}`
      + ` · status=${ok3.json?.status}`);
  }

  const boot3 = await bootstrap("tkhodemo");
  const issued = issueIn(boot3, issueId);
  assertStep("3.2", "tkhodemo", "③ sau xuất kho: stock_issues.status = 'issued'",
    issued?.status === "issued", `status=${issued?.status ?? "(không thấy phiếu)"}`);

  // ĐỐI CHỨNG ÂM ③d — xuất kho LẦN 2 cùng phiếu ⇒ 400 (KHÔNG ghi thêm kho).
  const twice3 = await call("tkhodemo", "issue_stock_confirm", { issueId });
  step("N-C4.2lan", "tkhodemo", "xuất kho LẦN 2 cùng phiếu — ĐỐI CHỨNG ÂM, KỲ VỌNG 400", twice3, { expectFail: true });
  console.log(`      ↳ SQL đối chiếu movement (KHÔNG được tăng sau lần gọi thứ 2):`);
  console.log(`        SELECT COUNT(*),COALESCE(SUM(quantity),0) FROM stock_movements`);
  console.log(`         WHERE movement_type='SMI' AND reference_type='stock_issue' AND reference_id='${issueId}';`);
}

// ---------- 4d. BƯỚC ④ — THỦ KHO XÁC NHẬN ĐÃ XUẤT ĐỦ (`confirm_stock_issue`) ----------
// Quyền: requireRole(["warehouse","admin"]) — ⛔ CHỈ thủ kho/admin, KHÔNG cho commander
// (`cha.ht` ⇒ 403) đúng đặc tả «thủ kho xác nhận». Trạng thái: issued → completed + đóng dấu signed_at.
console.log("\n── BƯỚC ④ — THỦ KHO XÁC NHẬN ĐÃ XUẤT ĐỦ (`confirm_stock_issue`) ──");
if (!issueId) {
  console.log("  ⛔ Không có issueId — dừng bước ④.");
} else {
  // ĐỐI CHỨNG ÂM ④a — `cha.ht` (chỉ huy trưởng, KHÔNG phải thủ kho) ⇒ 403.
  const cht4 = await call("cha.ht", "confirm_stock_issue", { issueId });
  step("N-D1.cht", "cha.ht", "xác nhận xuất đủ bằng CHỈ HUY TRƯỞNG — ĐỐI CHỨNG ÂM, KỲ VỌNG 403",
    cht4, { expectFail: true });

  // ĐỐI CHỨNG ÂM ④b — phiếu KHÔNG tồn tại ⇒ 400.
  const ghost4 = await call("tkhodemo", "confirm_stock_issue", { issueId: "ISS_khong-ton-tai" });
  step("N-D2.ghost", "tkhodemo", "xác nhận phiếu KHÔNG tồn tại — ĐỐI CHỨNG ÂM, KỲ VỌNG 400",
    ghost4, { expectFail: true });

  // BƯỚC ④ THẬT.
  const ok4 = await call("tkhodemo", "confirm_stock_issue", {
    issueId, comment: `Đã xuất đủ theo phiếu (TASK-133 bước ④) ${RUN_TAG}`,
  });
  step("4.1", "tkhodemo", "confirm_stock_issue — THỦ KHO XÁC NHẬN ĐÃ XUẤT ĐỦ", ok4);

  const boot4 = await bootstrap("tkhodemo");
  const done = issueIn(boot4, issueId);
  assertStep("4.2", "tkhodemo", "④ sau xác nhận: stock_issues.status = 'completed'",
    done?.status === "completed", `status=${done?.status ?? "(không thấy phiếu)"}`);

  // ĐỐI CHỨNG ÂM ④c — xác nhận LẦN 2 ⇒ 400.
  const twice4 = await call("tkhodemo", "confirm_stock_issue", { issueId });
  step("N-D3.2lan", "tkhodemo", "xác nhận LẦN 2 cùng phiếu — ĐỐI CHỨNG ÂM, KỲ VỌNG 400", twice4, { expectFail: true });
}

// ---------- 4e. BƯỚC ⑤ — SINH GRN NHẬP VÀO KHO KHÁC (`create_issue_grn`) ----------
// ⛔ KHÔNG cần duyệt — CHỈ cần QUYỀN TẠO (đúng đặc tả). Cổng VAI TRÒ
// requireRole(["warehouse","engineer","admin"]) + cổng MODULE dùng lại khoá SẴN CÓ `receiving`
// (capability canCreate — khuôn `receive_goods`). Chỉ chạy khi phiếu đã `completed` (bước ④ xong).
console.log("\n── BƯỚC ⑤ — SINH GRN NHẬP VÀO KHO KHÁC (`create_issue_grn`) ──");
let receiptId = null;
let receiptNo = null;
if (!issueId) {
  console.log("  ⛔ Không có issueId — dừng bước ⑤.");
} else {
  // ĐỐI CHỨNG ÂM ⑤a — phiếu KHÔNG tồn tại ⇒ 400.
  const ghost5 = await call("tkhodemo", "create_issue_grn",
    { issueId: "ISS_khong-ton-tai", toWarehouseId: PRJ.teamWarehouseId });
  step("N-E1.ghost", "tkhodemo", "sinh GRN cho phiếu KHÔNG tồn tại — ĐỐI CHỨNG ÂM, KỲ VỌNG 400",
    ghost5, { expectFail: true });

  // ĐỐI CHỨNG ÂM ⑤b — phiếu CHƯA `completed` ⇒ 400.
  if (pendingId) {
    const early5 = await call("tkhodemo", "create_issue_grn",
      { issueId: pendingId, toWarehouseId: PRJ.teamWarehouseId });
    step("N-E2.chuaXong", "tkhodemo", "sinh GRN khi phiếu CHƯA xác nhận đủ — ĐỐI CHỨNG ÂM, KỲ VỌNG 400",
      early5, { expectFail: true });
  }

  // ĐỐI CHỨNG ÂM ⑤c — vai trò KHÔNG có quyền tạo phiếu nhập ⇒ 403.
  const eng5 = await call("giamdoc.demo", "create_issue_grn",
    { issueId, toWarehouseId: PRJ.teamWarehouseId });
  step("N-E3.gd", "giamdoc.demo", "sinh GRN — ĐỐI CHỨNG ÂM, KỲ VỌNG 403", eng5, { expectFail: true });

  // BƯỚC ⑤ THẬT — kho đích = KHO TỔ ĐỘI (đúng đặc tả «nhập vào kho khác»).
  const ok5 = await call("tkhodemo", "create_issue_grn", {
    issueId, toWarehouseId: PRJ.teamWarehouseId,
    note: `Nhập vào kho khác theo phiếu xuất (TASK-133 bước ⑤) ${RUN_TAG}`,
  });
  step("5.1", "tkhodemo", "create_issue_grn — SINH GRN NHẬP KHO KHÁC (không duyệt)", ok5);
  receiptId = ok5.json?.receiptId || null;
  receiptNo = ok5.json?.receiptNo || null;
  if (ok5.ok) {
    console.log(`      ↳ receiptId=${receiptId} · receiptNo=${receiptNo}`
      + ` · kho đích=${ok5.json?.toWarehouseId} · lineCount=${ok5.json?.lineCount}`);
  }

  const boot5 = await bootstrap("tkhodemo");
  const grnDone = issueIn(boot5, issueId);
  assertStep("5.2", "tkhodemo", "⑤ sau sinh GRN: stock_issues.status = 'grn_created'",
    grnDone?.status === "grn_created", `status=${grnDone?.status ?? "(không thấy phiếu)"}`);

  // ĐỐI CHỨNG ÂM ⑤d — sinh GRN LẦN 2 ⇒ 400, KHÔNG sinh phiếu nhập thứ 2.
  const twice5 = await call("tkhodemo", "create_issue_grn",
    { issueId, toWarehouseId: PRJ.teamWarehouseId });
  step("N-E4.2lan", "tkhodemo", "sinh GRN LẦN 2 cùng phiếu — ĐỐI CHỨNG ÂM, KỲ VỌNG 400", twice5, { expectFail: true });

  // NỢ #4 — trạng thái PHIẾU ĐỀ NGHỊ sau khi xuất kho (đọc lại qua API bootstrap).
  const bootMr = await bootstrap("tkhodemo");
  const reqs2 = bootMr?.data?.requests || bootMr?.data?.materialRequests || [];
  const mr2 = reqs2.find((r) => String(r.id) === String(MR?.id));
  assertStep("5.3", "tkhodemo", "MR cập nhật trạng thái cấp phát (supplyStatus phải ∈ partial_issued/issued)",
    ["partial_issued", "issued"].includes(String(mr2?.supplyStatus)),
    `supplyStatus=${mr2?.supplyStatus ?? "(không thấy)"}`);
}

// ---------- 4f. GHI CHÚ KIỂM SQL BẮT BUỘC (probe chỉ đi HTTP) ----------
console.log("\n── KIỂM CHỨNG SQL (người chạy đối chiếu MySQL `vntech_erp`) ──");
if (issueId) {
  console.log(`   SELECT id,status,approved_by,signed_at FROM stock_issues WHERE id='${issueId}';`);
  console.log(`   SELECT entity_type,entity_id,stage,approver_user_id,status,decided_at FROM approvals`);
  console.log(`     WHERE entity_type='stock_issue' AND entity_id='${issueId}';`);
  console.log(`   -- ③ TỒN KHO: kho XUẤT phải GIẢM, kho ĐÍCH (tổ đội) phải TĂNG (tồn = tổng hợp stock_movements)`);
  console.log(`   SELECT from_warehouse_id,to_warehouse_id,movement_type,quantity FROM stock_movements`);
  console.log(`     WHERE reference_type='stock_issue' AND reference_id='${issueId}';`);
  console.log(`   SELECT warehouse_id,SUM(quantity_delta) FROM contract_stock_ledger`);
  console.log(`     WHERE reference_type='stock_issue' AND reference_id='${issueId}' GROUP BY warehouse_id;`);
  console.log(`   -- ⑤ PHIẾU NHẬP sinh ra`);
  if (receiptId) {
    console.log(`   SELECT id,receipt_no,warehouse_id,purchase_order_id,posting_status FROM goods_receipts`);
    console.log(`     WHERE id='${receiptId}';`);
    console.log(`   SELECT COUNT(*) FROM goods_receipt_items WHERE receipt_id='${receiptId}';`);
  } else {
    console.log(`   (chưa sinh được GRN ở lượt này)`);
  }
  console.log(`   -- NỢ #4/#5: trạng thái phiếu đề nghị + số dòng workflow`);
  if (MR?.id) {
    console.log(`   SELECT id,supply_status FROM material_requests WHERE id='${MR.id}';`);
    console.log(`   SELECT id,issued_qty,line_status FROM material_request_items WHERE request_id='${MR.id}';`);
    console.log(`   SELECT COUNT(*) FROM supply_workflow_steps WHERE request_id='${MR.id}' AND step='issue';`);
    console.log(`     -- phải là 1 (TASK-133 sửa lỗi trùng dòng; TRƯỚC khi sửa: 4-5 dòng cho MR đã xuất nhiều lần)`);
  }
}

// ---------- 5. TRẠNG THÁI CUỐI QUA API ----------
console.log("\n── TRẠNG THÁI ĐO QUA API (bootstrap) ──");
try {
  const boot = await bootstrap("tkhodemo");
  const issues = boot?.data?.stockIssues || boot?.data?.issues || [];
  const mine = issues.filter((i) => String(i.id) === String(issueId));
  const pick = mine[0] || issues.slice().sort((a, z) => String(z.issueNo).localeCompare(String(a.issueNo)))[0];
  console.log(`   ${issues.length} phiếu xuất trong bootstrap · chọn ${pick?.issueNo} · status=${pick?.status}`);
  const reqs = boot?.data?.requests || boot?.data?.materialRequests || [];
  const mr = reqs.find((r) => String(r.id) === String(MR?.id));
  console.log(`   MR ${mr?.requestNo} · status=${mr?.status} · bước=${mr?.approvalStage} · cấp phát=${mr?.supplyStatus}`);
} catch (e) {
  console.log(`   ⚠ không đọc được bootstrap: ${e.message}`);
}

// ---------- 6. KẾT QUẢ ----------
console.log("\n" + "═".repeat(110));
const okc = log.filter((l) => l.ok).length;
console.log(`KẾT QUẢ: ${okc}/${log.length} bước ĐẠT  (trọn 5 bước ① tạo phiếu → ② CHT duyệt → ③ xuất kho`
  + ` → ④ thủ kho xác nhận đủ → ⑤ sinh GRN, kèm đối chứng âm 400/403 cho từng bước)`);
for (const l of log.filter((x) => !x.ok)) console.log(`   ❌ [${l.who}] ${l.what} → HTTP ${l.status} ${l.error || ""}`);
console.log("═".repeat(110));
console.log(`\nMật khẩu tài khoản demo: ${PASS} · nhãn lượt chạy: ${RUN_TAG}`);
}
