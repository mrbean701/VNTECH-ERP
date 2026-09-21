// TASK-130 → TASK-132 — CHẠY TRỌN LUỒNG CẤP PHÁT + XUẤT KHO (WF-XUATKHO-01) BẰNG ĐÚNG TÀI KHOẢN TỪNG VAI TRÒ
//
//   node tools/probe-stock-issue-flow.mjs            # chạy thử, in kế hoạch (KHÔNG gọi HTTP)
//   node tools/probe-stock-issue-flow.mjs --apply    # thực thi thật
//
// Khuôn mẫu: tools/probe-purchasing-flow.mjs (TASK-128).
// Quy ước ĐẠT/HỎNG: bước có `expectFail: true` là ĐỐI CHỨNG ÂM —
//   bị TỪ CHỐI mới là ĐẠT, được chấp nhận là HỎNG.
//
// ── PHẠM VI LƯỢT NÀY (TASK-132): CHỈ 2 BƯỚC ĐẦU CỦA WF-XUATKHO-01 ────────────────
//  ① tạo phiếu (chỉ cần quyền tạo) · ② CHỈ HUY TRƯỞNG DUYỆT  ⇒ probe này ĐO 2 bước đó.
//  ③ tiến hành xuất kho · ④ thủ kho xác nhận đã xuất đủ · ⑤ chuyển thành GRN
//  ⇒ **CHƯA LÀM** (nhánh sau) — probe ĐÁNH DẤU RÕ và **KHÔNG đếm là HỎNG**.
//
// ── ĐÃ ĐO TRƯỚC (không đoán) ────────────────────────────────────────────────────
//  · TRƯỚC TASK-132: `issue_stock` (Java `SystemController.java:1179` →
//    `StockManagementUseCase.issueStock` :53-162) TẠO PHIẾU Ở TRẠNG THÁI `posted` NGAY, trong MỘT
//    lệnh HTTP: `WarehouseStockStoreAdapter.insertStockIssue` dòng 121 bind cứng `"posted"`.
//    `SELECT COUNT(*) FROM approvals WHERE entity_id LIKE 'ISS%'` = **0** ⇒ không bước duyệt nào.
//  · `WF-XUATKHO-01` có THẬT trong dữ liệu (`workflow_steps` WFS-XK-1 `canApprove` → `cha.ht`) nhưng
//    KHÔNG action Java nào đọc nó: `decide_approval` (SystemController.java:1063 →
//    `RequestManagementUseCase.decideApproval`) CHỈ nhận `material_requests` ⇒ gọi trên phiếu xuất = 400.
//  · TRƯỚC 132, tài khoản CHT (`cha.ht`) có `warehouse_issue.can_approve = 0` (đo MySQL) ⇒ cổng MODULE
//    của action duyệt PHẢI là `approvals` (`cha.ht.approvals.can_approve = 1`), còn cổng VAI TRÒ
//    (`requireRole(["commander","admin"])`) mới là cái chặn thật.
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
  const pick = usable[0];
  return {
    id: pick.r.id, no: pick.r.requestNo, status: pick.r.status, projectCode: pick.r.projectCode,
    lines: pick.lines.slice(0, 2), candidates: usable.length,
  };
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
  console.log("  6. ĐO HỆ QUẢ SQL (do người chạy đối chiếu): stock_issues.status · stock_issue_items ·");
  console.log("     stock_movements (SMI) · approvals theo (entity_type,entity_id)");
  console.log("  ⛔ CHƯA LÀM (nhánh sau, KHÔNG tính vào x/y): ③ tiến hành xuất kho ·");
  console.log("     ④ thủ kho xác nhận đã xuất đủ · ⑤ chuyển thành GRN để nhập kho khác");
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
MR = await pickRequest(boot0);
if (!MR || !MR.lines.length) {
  console.log("  ⛔ Không có phiếu ĐÃ DUYỆT nào còn dư chưa cấp ⇒ không thể đo bước tạo phiếu xuất.");
  console.log("     (Cần người dùng duyệt thêm phiếu đề nghị, hoặc tăng nhu cầu — KHÔNG tự sửa dữ liệu.)");
} else {
  console.log(`  chọn: ${MR.no} (${MR.id}) · status=${MR.status} · ${MR.candidates} phiếu khả dụng`);
  for (const l of MR.lines) {
    console.log(`    · ${l.code} ${l.name}: cấp ${l.issueQty}/${l.requestedQty} (còn dư ${l.remaining})`);
  }
}

// ---------- 2. ĐĂNG NHẬP TỪNG VAI TRÒ ----------
console.log("\n── ĐĂNG NHẬP THEO TỪNG VAI TRÒ ──");
for (const u of ACTORS) {
  const r = await login(u, PASS);
  step(`L.${u}`, u, `đăng nhập`, r);
}

// ---------- 2. ĐỐI CHỨNG ÂM A — user KHÔNG có quyền gọi issue_stock ----------
console.log("\n── ĐỐI CHỨNG ÂM A: tài khoản KHÔNG có quyền cấp phát gọi issue_stock ──");
const mkIssuePayload = () => ({
  projectId: PRJ.id,
  fromWarehouseId: PRJ.fromWarehouseId,
  teamId: PRJ.teamId,
  requestId: MR?.id,
  receivedByName: "Tổ trưởng TD-01 (kiểm thử TASK-130)",
  note: `Kiểm thử TASK-130 ${RUN_TAG}`,
  lines: (MR?.lines || []).map((i) => ({
    materialId: i.materialId, requestItemId: i.requestItemId, quantity: i.issueQty,
    contractId: i.contractId,
    workPackageCode: "WP-TEST-T130", installationArea: "Khu A – kiểm thử TASK-130",
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
  assertStep("2.3", "cha.ht", "khai báo `approved_by` trên phiếu đã duyệt",
    approved != null && approved.approvedBy != null,
    `approvedBy=${approved?.approvedBy ?? "(trống)"}`);

  // ĐỐI CHỨNG ÂM B3: duyệt LẦN 2 ⇒ 400 (đã duyệt rồi).
  const twice = await call("cha.ht", "approve_stock_issue", {
    issueId, decision: "approved", comment: "Đối chứng âm TASK-132: duyệt lần 2",
  });
  step("N-B3.2lan", "cha.ht", "duyệt LẦN 2 cùng phiếu — ĐỐI CHỨNG ÂM, KỲ VỌNG 400", twice, { expectFail: true });
}

// ---------- 4b. GHI CHÚ KIỂM SQL BẮT BUỘC (probe chỉ đi HTTP) ----------
console.log("\n── KIỂM CHỨNG SQL (người chạy đối chiếu MySQL `vntech_erp`) ──");
if (issueId) {
  console.log(`   SELECT id,status,approved_by FROM stock_issues WHERE id='${issueId}';`);
  console.log(`   SELECT entity_type,entity_id,stage,approver_user_id,status,decided_at FROM approvals`);
  console.log(`     WHERE entity_type='stock_issue' AND entity_id='${issueId}';`);
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

// ---------- 5b. BƯỚC ③④⑤ — CHƯA LÀM (nhánh sau), KHÔNG tính là HỎNG ----------
console.log("\n── ⛔ BƯỚC ③④⑤ CỦA WF-XUATKHO-01: CHƯA LÀM TRONG LƯỢT NÀY (TASK-132 chỉ ①②) ──");
console.log("   ⛔ ③ tiến hành xuất kho (tách ghi kho/movement/ledger khỏi lúc tạo phiếu)");
console.log("   ⛔ ④ thủ kho xác nhận đã xuất đủ");
console.log("   ⛔ ⑤ chuyển thành GRN để nhập vào kho khác");
console.log("   ⇒ 3 bước này KHÔNG được probe đếm vào x/y; nhánh sau sẽ làm.");
}

// ---------- 6. KẾT QUẢ ----------
console.log("\n" + "═".repeat(110));
const okc = log.filter((l) => l.ok).length;
console.log(`KẾT QUẢ: ${okc}/${log.length} bước ĐẠT  (chỉ tính 2 bước ① tạo phiếu + ② CHT duyệt và các đối chứng âm)`);
for (const l of log.filter((x) => !x.ok)) console.log(`   ❌ [${l.who}] ${l.what} → HTTP ${l.status} ${l.error || ""}`);
console.log("   ⛔ BƯỚC ③ tiến hành xuất kho · ④ thủ kho xác nhận · ⑤ chuyển GRN: CHƯA LÀM (nhánh sau) — KHÔNG tính vào x/y.");
console.log("═".repeat(110));
console.log(`\nMật khẩu tài khoản demo: ${PASS} · nhãn lượt chạy: ${RUN_TAG}`);
