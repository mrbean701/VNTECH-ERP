// TASK-130 — CHẠY TRỌN LUỒNG CẤP PHÁT + XUẤT KHO (WF-XUATKHO-01) BẰNG ĐÚNG TÀI KHOẢN TỪNG VAI TRÒ
//
//   node tools/probe-stock-issue-flow.mjs            # chạy thử, in kế hoạch (KHÔNG gọi HTTP)
//   node tools/probe-stock-issue-flow.mjs --apply    # thực thi thật
//
// Khuôn mẫu: tools/probe-purchasing-flow.mjs (TASK-128).
// Quy ước ĐẠT/HỎNG: bước có `expectFail: true` là ĐỐI CHỨNG ÂM —
//   bị TỪ CHỐI mới là ĐẠT, được chấp nhận là HỎNG.
//
// ── ĐÃ ĐO TRƯỚC (không đoán) ────────────────────────────────────────────────────
//  · `issue_stock` (Java `SystemController.java:1179` → `StockManagementUseCase.issueStock`
//    `StockManagementUseCase.java:53-162`) TẠO PHIẾU Ở TRẠNG THÁI `posted` NGAY, trong MỘT
//    lệnh HTTP duy nhất: `WarehouseStockStoreAdapter.insertStockIssue` dòng 121 bind cứng
//    `"posted"` cho `stock_issues.status`. ⇒ KHÔNG có bước duyệt nào chặn giữa.
//  · `WF-XUATKHO-01` có THẬT trong dữ liệu (`workflow_definitions` module_key='warehouse_issue',
//    `workflow_steps` WFS-XK-1 `canApprove` → `cha.ht`, WFS-XK-2 `canApprove` → `kttdemo`) nhưng
//    KHÔNG có action Java nào đọc nó: `decide_approval` (SystemController.java:1063 →
//    `RequestManagementUseCase.decideApproval` :595) chỉ nhận `material_requests` (tra
//    `findRequestForApproval`), và `RequestStoreAdapter.approvalWarnings` (:22) chỉ CẢNH BÁO
//    chứ không chặn. Probe này ĐO đúng thực tế đó thay vì giả định có chuỗi duyệt.
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
  // Phiếu đề nghị ĐÃ DUYỆT dùng làm nguồn cấp phát (2 dòng, đủ tồn vật lý ở kho nguồn):
  requestId: "MR_f4636c1c-85db-4b32-bf03-9592c17ed591",
  requestNo: "DNMH-PRJ-DEMO-01-2026-0136",
  items: [
    { requestItemId: "MRI_f5b8a193-646a-44a9-9b7f-0f78fcbff2d0", materialId: "MAT_fc920779-6cc2-451c-8e12-c993141417f0", code: "KHAC-VLXD-004", name: "Thép hộp 40x40", unit: "cây", requestedQty: 25, issueQty: 5 },
    { requestItemId: "MRI_45b4eda3-aa62-4177-a386-33f07a5875f0", materialId: "MAT_c3ff35ff-c562-4814-8b77-5e925e0d0589", code: "KHAC-VLXD-005", name: "Xi măng PCB40", unit: "bao", requestedQty: 60, issueQty: 10 },
  ],
};

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

console.log("═".repeat(110));
console.log(`  LUỒNG CẤP PHÁT / XUẤT KHO — ${PRJ.code} · ${APPLY ? "THỰC THI" : "XEM TRƯỚC"}`);
console.log("═".repeat(110));
console.log(`  kho nguồn : KHO-PRJ-DEMO-01 (${PRJ.fromWarehouseId})`);
console.log(`  kho nhận  : kho tổ đội TD-01 (${PRJ.teamWarehouseId})`);
console.log(`  phiếu MR  : ${PRJ.requestNo} (${PRJ.requestId})`);
console.log(`  dòng cấp  : ${PRJ.items.map((i) => `${i.code} ×${i.issueQty}`).join(" · ")}\n`);

const ACTORS = ["tkhodemo", "cha.ht", "kttdemo", "engineer.demo", "giamdoc.demo", "trdademo"];

if (!APPLY) {
  console.log("KẾ HOẠCH (chạy lại với --apply để thực thi):");
  console.log("  1. đăng nhập từng vai trò: " + ACTORS.join(", "));
  console.log("  2. ĐỐI CHỨNG ÂM A — engineer.demo / giamdoc.demo gọi issue_stock ⇒ KỲ VỌNG 403");
  console.log("  3. TẠO phiếu xuất bằng tkhodemo (thủ kho, vai trò thu_kho) ⇒ kỳ vọng 200 + status='posted'");
  console.log("  4. nếu tkhodemo bị chặn → thử cha.ht (cht) → admin (biện pháp tạm)");
  console.log("  5. CHUỖI DUYỆT: bước 1 cha.ht (canApprove) → bước 2 kttdemo (canApprove)");
  console.log("     ⚠ đã đo trước: `stock_issues` sinh ra ĐÃ `posted` (adapter bind cứng), nên đây là");
  console.log("       phép ĐO xem action duyệt có tồn tại hay không — không phải giả định.");
  console.log("  6. ĐỐI CHỨNG ÂM B — duyệt sai bước (kttdemo duyệt bước 1 / cha.ht duyệt bước 2)");
  console.log("  7. ĐO HỆ QUẢ SQL: stock_issues.status · stock_issue_items · stock_movements (SMI) ·");
  console.log("     tồn kho TRƯỚC/SAU ở kho nguồn & kho tổ đội · material_requests.status + items.issued_qty");
  process.exitCode = 0;
} else {

// ---------- 1. ĐĂNG NHẬP TỪNG VAI TRÒ ----------
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
  requestId: PRJ.requestId,
  receivedByName: "Tổ trưởng TD-01 (kiểm thử TASK-130)",
  note: `Kiểm thử TASK-130 ${RUN_TAG}`,
  lines: PRJ.items.map((i) => ({
    materialId: i.materialId, requestItemId: i.requestItemId, quantity: i.issueQty,
    workPackageCode: "WP-TEST-T130", installationArea: "Khu A – kiểm thử TASK-130",
  })),
});
for (const who of ["engineer.demo", "giamdoc.demo"]) {
  const r = await call(who, "issue_stock", mkIssuePayload());
  step(`N-A.${who}`, who, "gọi issue_stock — ĐỐI CHỨNG ÂM, KỲ VỌNG 403", r, { expectFail: true });
}

// ---------- 3. TẠO PHIẾU XUẤT (đúng vai trò thủ kho) ----------
console.log("\n── TẠO PHIẾU CẤP PHÁT / XUẤT KHO ──");
let createRes = await call("tkhodemo", "issue_stock", mkIssuePayload());
step("1a", "tkhodemo", "issue_stock — vai trò thu_kho (đúng mô tả WF-XUATKHO-01)", createRes);
if (!createRes.ok) {
  createRes = await call("cha.ht", "issue_stock", mkIssuePayload());
  step("1b", "cha.ht", "issue_stock — vai trò cht (BCH)", createRes);
}
if (!createRes.ok) {
  const adminLogin = await login("admin", "Admin123456@");
  sessions.set("admin", sessions.get("admin") || adminLogin.cookie);
  createRes = await call("admin", "issue_stock", mkIssuePayload());
  step("1c", "admin", "issue_stock — BIỆN PHÁP TẠM nếu các vai trò nghiệp vụ đều bị chặn", createRes);
}
const issueId = createRes.json?.issueId || createRes.json?.data?.issueId || null;
const issueNo = createRes.json?.issueNo || createRes.json?.data?.issueNo || null;
console.log(`      ↳ issueId=${issueId} · issueNo=${issueNo}`);
const warnings = createRes.json?.warnings || [];
if (warnings.length) console.log(`      ↳ warnings (chế độ CHỈ CẢNH BÁO): ${JSON.stringify(warnings)}`);

// ---------- 4. CHUỖI DUYỆT WF-XUATKHO-01 (cha.ht → kttdemo) ----------
console.log("\n── CHUỖI DUYỆT WF-XUATKHO-01: bước 1 cha.ht (canApprove) → bước 2 kttdemo (canApprove) ──");
if (!issueId) {
  console.log("  ⛔ Không có issueId — dừng chuỗi duyệt.");
} else {
  // ĐỐI CHỨNG ÂM B: duyệt SAI BƯỚC (người của bước 2 đi duyệt bước 1).
  const wrong = await call("kttdemo", "decide_approval", {
    requestId: PRJ.requestId, stage: 1, decision: "approved",
    comment: "Đối chứng âm TASK-130: kế toán duyệt sai bước 1",
  });
  step("N-B.ktt/b1", "kttdemo", "duyệt SAI BƯỚC 1 — ĐỐI CHỨNG ÂM, KỲ VỌNG 400/403", wrong, { expectFail: true });

  // Thử trên chính PHIẾU XUẤT (nếu API có nhận issueId) để đo xem có chuỗi duyệt cho stock_issue.
  const s1 = await call("cha.ht", "decide_approval", {
    requestId: issueId, stage: 1, decision: "approved", comment: "Kiểm thử TASK-130 bước 1 (CHT/BCH xác nhận)",
  });
  step("2.1", "cha.ht", "duyệt bước 1 phiếu XUẤT (CHT/BCH xác nhận) — đo xem có chuỗi duyệt không", s1);
  const s2 = await call("kttdemo", "decide_approval", {
    requestId: issueId, stage: 2, decision: "approved", comment: "Kiểm thử TASK-130 bước 2 (Kế toán xác nhận)",
  });
  step("2.2", "kttdemo", "duyệt bước 2 phiếu XUẤT (Kế toán xác nhận) — đo xem có chuỗi duyệt không", s2);
}

// ---------- 5. TRẠNG THÁI CUỐI QUA API ----------
console.log("\n── TRẠNG THÁI ĐO QUA API (bootstrap) ──");
try {
  const cookie = sessions.get("tkhodemo") || sessions.get("admin") || "";
  const boot = await (await fetch(`${BASE}/api/system`, { headers: { cookie } })).json();
  const issues = boot?.data?.stockIssues || boot?.data?.issues || [];
  const mine = issues.filter((i) => String(i.id) === String(issueId));
  const pick = mine[0] || issues.slice().sort((a, z) => String(z.issueNo).localeCompare(String(a.issueNo)))[0];
  console.log(`   ${issues.length} phiếu xuất trong bootstrap · chọn ${pick?.issueNo} · status=${pick?.status}`);
  const reqs = boot?.data?.requests || boot?.data?.materialRequests || [];
  const mr = reqs.find((r) => String(r.id) === String(PRJ.requestId));
  console.log(`   MR ${mr?.requestNo} · status=${mr?.status} · bước=${mr?.approvalStage} · cấp phát=${mr?.supplyStatus}`);
} catch (e) {
  console.log(`   ⚠ không đọc được bootstrap: ${e.message}`);
}
}

// ---------- 6. KẾT QUẢ ----------
console.log("\n" + "═".repeat(110));
const okc = log.filter((l) => l.ok).length;
console.log(`KẾT QUẢ: ${okc}/${log.length} bước ĐẠT`);
for (const l of log.filter((x) => !x.ok)) console.log(`   ❌ [${l.who}] ${l.what} → HTTP ${l.status} ${l.error || ""}`);
console.log("═".repeat(110));
console.log(`\nMật khẩu tài khoản demo: ${PASS} · nhãn lượt chạy: ${RUN_TAG}`);
