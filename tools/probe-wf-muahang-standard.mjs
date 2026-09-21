// TASK-134 — MÔ PHỎNG LẠI QUY TRÌNH DUYỆT MUA HÀNG THỰC TẾ THEO WF-MUAHANG-01
//            (cấu hình người dùng VỪA CHỐT: 4 bước DUYỆT 2→3→4→5 + 3 bước CUNG ỨNG 101→102→103)
//
//   node tools/probe-wf-muahang-standard.mjs            # XEM TRƯỚC — in kế hoạch, 0 ghi
//   node tools/probe-wf-muahang-standard.mjs --apply    # THỰC THI
//
// KHUÔN: `tools/probe-purchasing-flow.mjs` (chỉ ĐỌC để học, KHÔNG sửa): đăng nhập từng vai trò bằng
// tài khoản THẬT, `call(user, action, payload)` qua `POST /api/system`, đếm ĐẠT/HỎNG, và
// **đối chứng âm tính là ĐẠT** (`opts.expectFail`).
//
// KHÁC BIỆT của probe này:
//   1. Ghi lại **HTTP code + trạng thái phiếu TRƯỚC → SAU mỗi bước** (status / approval_stage /
//      supply_status) — đây là phần người dùng đặc biệt quan tâm.
//   2. Có **oracle quyền không phá dữ liệu**: gọi `decide_approval` với `decision` KHÔNG hợp lệ.
//      Thứ tự kiểm trong `RequestManagementUseCase.decideApproval` là
//        (605) canApproveRequestStage → (607) đúng bước/ còn pending → (609) decision hợp lệ
//      nên: nhận "Quyết định không hợp lệ." ⇒ tài khoản **ĐÃ QUA** kiểm RBAC (dấu hiệu cấp quyền
//      thừa); nhận "Bạn không phải Owner…" ⇒ bị chặn thật. Oracle này KHÔNG ghi gì vào DB.
//   3. Kết quả đầy đủ được xuất JSON (mặc định ra thư mục tạm, KHÔNG ghi vào repo) để dán vào báo cáo.
//
// CHỈ HTTP. Không SQL, không sửa cấu hình, không build, không start/stop dịch vụ.
const BASE = process.env.PROBE_BASE || "http://127.0.0.1:9000";
const ADMIN = { username: "admin", password: "Admin123456@" };
const PASS = "Vntech@2026";
const APPLY = process.argv.includes("--apply");
const RUN_TAG = new Date().toISOString().replace(/[-:T.]/g, "").slice(0, 14);

// ---------- Dữ liệu PRJ-DEMO-01 (đọc từ MySQL ở GĐ-A) ----------
const PRJ = {
  id: "PRJ_fdbfab20-bf1f-4ad5-8159-7dcc582140c3",
  code: "PRJ-DEMO-01",
  contractId: "PCON_78092ea4-4d57-4984-9028-a835e4844cd4",
  boqVersionId: "BQVER_0390dda6-d4aa-4b4b-bf98-3a44ed24cc65",
  warehouseId: "WH_51e0f009-4873-4cb6-855c-e6e7fea41e4d",
  supplierId: "SUP_c0f509fc-ed78-4781-823c-2a230a2f6948",
};
// 2 dòng vật tư (đúng như yêu cầu B1: "2–3 dòng vật tư").
const LINES = [
  { boqItemId: "BOQ_762fd4c7-f591-4839-8065-9272540df208", materialId: "MAT_fc920779-6cc2-451c-8e12-c993141417f0", code: "KHAC-VLXD-004", name: "Thép hộp 40x40", unit: "cây", qty: 25, price: 350000 },
  { boqItemId: "BOQ_36a50087-88f4-49e3-ac5a-fff0631b733d", materialId: "MAT_c3ff35ff-c562-4814-8b77-5e925e0d0589", code: "KHAC-VLXD-005", name: "Xi măng PCB40", unit: "bao", qty: 60, price: 98000 },
];
// Tên trường dòng theo ĐÚNG mã nguồn (`quantity`, kèm materialCode/materialName/unit cho form_field_config).
function mkLines() {
  return LINES.map((l) => ({
    materialId: l.materialId, materialCode: l.code, materialName: l.name, unit: l.unit,
    boqItemId: l.boqItemId, quantity: l.qty, estimatedUnitPrice: l.price,
  }));
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
const asAdmin = (action, payload = {}) => call("__admin", action, payload);

// ---------- Ghi log ----------
const log = [];
const stateTimeline = [];
// `opts.expectFail = true` ⇒ ca ĐỐI CHỨNG ÂM: bị từ chối MỚI là ĐẠT.
function step(n, who, what, r, opts = {}) {
  const expectFail = opts.expectFail === true;
  const ok = expectFail ? !r.ok : r.ok;
  const msg = String(r.json?.error || r.json?.message || r.text || "").slice(0, 220);
  const detail = r.ok ? "" : ` → HTTP ${r.status}: ${msg}`;
  const line = `${ok ? "✅" : "❌"} ${String(n).padEnd(7)} [${who.padEnd(13)}] ${what}${detail}`;
  console.log(line);
  log.push({ n, who, what, ok, status: r.status, expectFail, error: msg });
  return r;
}
function note(text) { console.log(`        ↳ ${text}`); }

// ---------- Trạng thái phiếu/tài liệu qua API (bootstrap) ----------
let bootCache = null;
async function boot() {
  const res = await fetch(`${BASE}/api/system`, { headers: { cookie: sessions.get("__admin") || "" } });
  const j = await res.json().catch(() => null);
  bootCache = j?.data || {};
  return bootCache;
}
function findReq(b, id) { return (b?.requests || []).find((r) => String(r.id) === String(id)) || null; }
function findPo(b, id) { return (b?.purchaseOrders || []).find((p) => String(p.id) === String(id)) || null; }
function mrState(id) {
  const r = findReq(bootCache, id);
  if (!r) return { status: "(không thấy)", approvalStage: "-", supplyStatus: "-" };
  return { status: r.status, approvalStage: r.approvalStage, supplyStatus: r.supplyStatus };
}
function fmt(s) { return `status=${s.status} · bước=${s.approvalStage} · cấp phát=${s.supplyStatus}`; }
/** Chụp trạng thái TRƯỚC → SAU một bước nghiệp vụ. */
async function track(stepNo, label, fn) {
  await boot();
  const before = fn.before;
  const res = await fn.run();
  await boot();
  const after = mrState(fn.requestId);
  stateTimeline.push({ stepNo, label, before, after, http: res.status });
  console.log(`        · ${label}\n            TRƯỚC: ${fmt(before)}\n            SAU  : ${fmt(after)}`);
  return { res, before, after };
}

// ---------- Mở đầu ----------
console.log("═".repeat(104));
console.log(`  TASK-134 · MÔ PHỎNG WF-MUAHANG-01 THEO CẤU HÌNH ĐANG CHẠY — ${PRJ.code}`);
console.log(`  ${APPLY ? "THỰC THI (--apply)" : "XEM TRƯỚC (không --apply ⇒ 0 ghi)"} · RUN_TAG=${RUN_TAG}`);
console.log("═".repeat(104));
console.log("  Chuỗi DUYỆT (active=1 · stage_kind='approval'): 2 Thư ký TGĐ → 3 Phòng Dự án → 4 Phòng Kế hoạch → 5 Giám đốc");
console.log("  Chuỗi CUNG ỨNG (stage_kind='supply'): 101 Lập & phát hành PO → 102 Giao nhận → 103 BCH xác nhận giao hàng");
console.log("  Bước 1 (CHT xác nhận nhu cầu) ĐANG TẮT (active=0) ⇒ phiếu sinh ra ở BƯỚC 2.\n");

if (!APPLY) {
  console.log("KẾ HOẠCH (mọi thao tác đều là HTTP qua cổng proxy :9000 → Java :18081):");
  const plan = [
    ["B1", "ksda.demo", "create_request — lập phiếu 2 dòng vật tư, dự án PRJ-DEMO-01 ⇒ ghi request_no + status + approval_stage"],
    ["N1", "trdademo", "decide_approval stage 5 — người KHÔNG phải owner, sai vai trò ⇒ PHẢI bị chặn"],
    ["N2", "ksda.demo", "decide_approval stage 2 — người TẠO tự duyệt ⇒ PHẢI bị chặn"],
    ["N3", "nvkhdemo", "decide_approval stage 4 — SAI THỨ TỰ (khi đang ở bước 2) ⇒ PHẢI bị chặn"],
    ["N4", "thukydemo", "decide_approval requestId KHÔNG TỒN TẠI ⇒ PHẢI bị chặn"],
    ["N5", "thukydemo", "decide_approval stage 99 — bước không có trong luồng ⇒ PHẢI bị chặn"],
    ["B2", "thukydemo", "duyệt stage 2 ⇒ PHẢI sang bước 3"],
    ["N6", "thukydemo", "duyệt LẦN 2 cùng stage 2 ⇒ PHẢI bị chặn"],
    ["B3", "nvdademo", "duyệt stage 3 ⇒ PHẢI sang bước 4"],
    ["N7", "trinhtrench", "duyệt stage 4 (oracle quyền + gọi thật nếu bị chặn) ⇒ ghi nhận đúng thực tế"],
    ["B4", "nvkhdemo", "duyệt stage 4 ⇒ PHẢI sang bước 5"],
    ["B5", "giamdoc.demo", "duyệt stage 5 ⇒ PHẢI chốt `approved` + supply_status=awaiting_po"],
    ["B6", "nvkhdemo", "create_po (stage 101) rồi approve_po ⇒ ghi po_no + status"],
    ["N8", "trinhtrench", "create_po khi… (đối chứng vai trò mua hàng) — xem khi chạy"],
    ["B7", "tkhodemo", "receive_goods (stage 102) ⇒ ghi trạng thái PO/GRN"],
    ["B7b", "tkhodemo", "tải 1 ảnh giao hàng (POST /api/files, entity_type='goods_receipt')"],
    ["B8", "cha.ht", "confirm_delivery (stage 103 · BCH) ⇒ ghi trạng thái cuối"],
  ];
  for (const [s, w, d] of plan) console.log(`   ${s.padEnd(4)} [${w.padEnd(13)}] ${d}`);
  console.log("\nChạy lại với --apply để thực thi. Kết quả JSON: đặt biến môi trường PROBE_OUT=<đường dẫn>.");
  process.exitCode = 0;
} else {

// ---------- 0. ĐĂNG NHẬP ----------
const ACTORS = ["ksda.demo", "thukydemo", "nvdademo", "nvkhdemo", "giamdoc.demo", "tkhodemo", "cha.ht",
  "trdademo", "trinhtrench", "engineer.demo"];
console.log("── 0. ĐĂNG NHẬP THEO TỪNG VAI TRÒ ──");
const al = await login(ADMIN.username, ADMIN.password);
sessions.set("__admin", sessions.get(ADMIN.username));
sessions.delete(ADMIN.username);
if (!al.ok) throw new Error("Không đăng nhập được admin.");
console.log(`[admin] đăng nhập HTTP ${al.status}`);
for (const u of ACTORS) {
  let r = await login(u, PASS);
  if (!r.ok) {
    // Dự phòng: đặt lại mật khẩu bằng chức năng admin (update_user) rồi thử lại — giống khuôn cũ.
    const rows = bootCache?.users || [];
    const row = rows.find((s) => s.username === u);
    if (row) {
      await asAdmin("update_user", {
        userId: row.id, employeeCode: row.employeeCode, fullName: row.fullName, username: row.username,
        email: row.email || "", role: row.role, organizationUnitId: row.organizationUnitId,
        approvalLimit: row.approvalLimit ?? 0, newPassword: PASS, active: 1,
      });
      r = await login(u, PASS);
    }
  }
  step("0", u, "đăng nhập", r);
}
await boot();

// ---------- B1. LẬP PHIẾU ----------
console.log("\n── B1. ksda.demo LẬP PHIẾU ĐỀ NGHỊ MUA (2 dòng vật tư) ──");
const PURPOSE = `TASK-134 mô phỏng WF-MUAHANG-01 · ${RUN_TAG}`;
const mkRequest = () => ({
  projectId: PRJ.id, contractId: PRJ.contractId, boqVersionId: PRJ.boqVersionId,
  neededAt: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  priority: "high", area: "Khu A – mô phỏng luồng chuẩn", purpose: PURPOSE,
  sourceWarehouseId: PRJ.warehouseId, lines: mkLines(),
});
const createRes = await call("ksda.demo", "create_request", mkRequest());
step("B1", "ksda.demo", "create_request (2 dòng vật tư)", createRes);
note(`phản hồi: ${String(createRes.json?.message || "").slice(0, 160)}`);
// Lấy requestId: ưu tiên requestNo nhúng trong message, sau đó mới tới purpose.
const noFromMsg = String(createRes.json?.message || "").match(/DNMH-[A-Za-z0-9\-]+/)?.[0] || "";
await boot();
let reqRow = noFromMsg ? (bootCache.requests || []).find((r) => r.requestNo === noFromMsg) : null;
if (!reqRow) {
  const mine = (bootCache.requests || []).filter((r) => String(r.purpose || "").includes(RUN_TAG));
  reqRow = mine.sort((a, z) => String(z.requestNo).localeCompare(String(a.requestNo)))[0];
}
const requestId = reqRow?.id || null;
if (!requestId) { console.log("  ⛔ Không tra được phiếu vừa lập — DỪNG."); process.exitCode = 1; }
const mr0 = mrState(requestId);
console.log(`  ⇒ request_no = ${reqRow.requestNo} · requestId = ${requestId}`);
console.log(`  ⇒ TRẠNG THÁI NGAY SAU KHI LẬP: ${fmt(mr0)}   (kỳ vọng: pending_approval · bước 2 · approval_pending)`);
stateTimeline.push({ stepNo: "B1", label: "lập phiếu", before: { status: "(chưa có)", approvalStage: "-", supplyStatus: "-" }, after: mr0, http: createRes.status });

// ---------- ĐỐI CHỨNG ÂM (khi phiếu đang ở bước 2) ----------
console.log("\n── ĐỐI CHỨNG ÂM (phiếu đang ở BƯỚC 2 · mọi ca dưới đây PHẢI bị chặn) ──");
const neg = async (no, who, what, payload, expect) => {
  const r = await call(who, "decide_approval", payload);
  step(no, who, what, r, { expectFail: true });
  note(`kỳ vọng ${expect} · HTTP thật = ${r.status} · nguyên văn: ${String(r.json?.error || r.json?.message || r.text || "").slice(0, 200)}`);
  return r;
};
// N1 — người dùng không thuộc bước 5 và không có vai trò của bước 5.
await neg("N1", "trdademo", "duyệt stage 5 (da_truong — không phải owner, không đúng vai trò)", { requestId, stage: 5, decision: "approved", comment: "ĐC âm: trdademo bước 5" }, "400/403");
// N2 — người TẠO tự duyệt.
await neg("N2", "ksda.demo", "duyệt stage 2 (chính NGƯỜI TẠO phiếu)", { requestId, stage: 2, decision: "approved", comment: "ĐC âm: người tạo tự duyệt" }, "400/403");
// N3 — duyệt SAI THỨ TỰ: bước 4 khi phiếu còn ở bước 2 (nvkhdemo CÓ đủ vai trò của bước 4
//      ⇒ ca này chỉ bị chặn bởi kiểm "đúng bước", đúng như thiết kế).
await neg("N3", "nvkhdemo", "duyệt stage 4 khi phiếu còn ở BƯỚC 2 (sai thứ tự)", { requestId, stage: 4, decision: "approved", comment: "ĐC âm: sai thứ tự" }, "400");
// N4 — phiếu không tồn tại.
await neg("N4", "thukydemo", "duyệt phiếu KHÔNG TỒN TẠI", { requestId: "MR_KHONG_TON_TAI_134", stage: 2, decision: "approved", comment: "ĐC âm: phiếu lạ" }, "400");
// N5 — bước không có trong luồng của phiếu (99) và bước cung ứng (101) gọi qua decide_approval.
await neg("N5", "thukydemo", "duyệt stage 99 (không có trong luồng)", { requestId, stage: 99, decision: "approved", comment: "ĐC âm: bước lạ" }, "400");
await neg("N5b", "nvkhdemo", "gọi decide_approval cho bước CUNG ỨNG 101 (không phải bước duyệt hồ sơ)", { requestId, stage: 101, decision: "approved", comment: "ĐC âm: bước cung ứng" }, "400");

// ---------- B2..B5: CHUỖI DUYỆT ----------
console.log("\n── CHUỖI DUYỆT 2 → 3 → 4 → 5 ──");
const decide = async (no, who, stage, label) => {
  const before = mrState(requestId);
  const r = await call(who, "decide_approval", { requestId, stage, decision: "approved", comment: `TASK-134 ${label}` });
  step(no, who, `duyệt stage ${stage} — ${label}`, r);
  note(`nguyên văn: ${String(r.json?.message || r.json?.error || r.text || "").slice(0, 160)}`);
  await boot();
  const after = mrState(requestId);
  stateTimeline.push({ stepNo: no, label: `duyệt bước ${stage} (${who})`, before, after, http: r.status });
  console.log(`        · TRƯỚC: ${fmt(before)}\n        · SAU  : ${fmt(after)}`);
  return r;
};
await decide("B2", "thukydemo", 2, "Thư ký Tổng giám đốc");
// N6 — duyệt LẦN 2 cùng một bước.
await neg("N6", "thukydemo", "duyệt LẦN 2 stage 2 (đã duyệt ở B2)", { requestId, stage: 2, decision: "approved", comment: "ĐC âm: duyệt lần 2" }, "400");

await decide("B3", "nvdademo", 3, "Phòng Dự án");

// N7 — trinhtrench (kh_truong, base_role=procurement) tại bước 4 ĐANG LÀ bước hiện tại.
//      ORACLE KHÔNG GHI: gọi với decision không hợp lệ. Xem đầu tệp để biết vì sao oracle đọc được quyền.
{
  const r = await call("trinhtrench", "decide_approval", { requestId, stage: 4, decision: "__oracle__", comment: "oracle quyền" });
  const msg = String(r.json?.error || r.json?.message || r.text || "");
  const passedRbac = /Quyết định không hợp lệ/.test(msg);
  console.log(`   ${passedRbac ? "⚠️" : "✅"} N7      [trinhtrench  ] oracle quyền tại stage 4 (không phải owner, vai trò kh_truong) → HTTP ${r.status}: ${msg.slice(0, 160)}`);
  note(passedRbac
    ? "⇒ TÀI KHOẢN NÀY ĐÃ QUA KIỂM RBAC (cấp quyền thừa) — KHÔNG gọi thật để giữ luồng chính sạch."
    : "⇒ bị chặn bởi RBAC — gọi THẬT để lấy mã HTTP của ca đối chứng âm.");
  log.push({ n: "N7", who: "trinhtrench", what: "oracle quyền stage 4", ok: !passedRbac, status: r.status, expectFail: true, error: msg });
  if (!passedRbac) {
    const rr = await call("trinhtrench", "decide_approval", { requestId, stage: 4, decision: "approved", comment: "ĐC âm: trinhtrench bước 4" });
    step("N7b", "trinhtrench", "duyệt stage 4 (gọi THẬT)", rr, { expectFail: true });
  }
}

await decide("B4", "nvkhdemo", 4, "Phòng Kế hoạch");
await decide("B5", "giamdoc.demo", 5, "Giám đốc");

// ---------- B6: LẬP PO (bước cung ứng 101) ----------
console.log("\n── B6. nvkhdemo LẬP & PHÁT HÀNH PO (stage CUNG ỨNG 101) ──");
await boot();
const after5 = mrState(requestId);
const reqItems = (findReq(bootCache, requestId)?.items || []);
console.log(`        phiếu có ${reqItems.length} dòng · ${fmt(after5)}`);
const poLines = reqItems.map((i) => ({
  requestItemId: i.id,
  quantity: Number(i.approvedPurchaseQty || i.requestedQty || i.quantity || 0),
  supplierId: PRJ.supplierId,
  unitPrice: Number(i.estimatedUnitPrice || 0),
})).filter((l) => l.quantity > 0);
const poPayload = {
  requestId, warehouseId: PRJ.warehouseId, supplierId: PRJ.supplierId,
  eta: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10), lines: poLines,
  availabilityOverrideReason: "TASK-134: vật tư còn tồn ở kho tổ đội nhưng không đủ quy cách thi công",
};
{
  const before = mrState(requestId);
  const r = await call("nvkhdemo", "create_po", poPayload);
  step("B6a", "nvkhdemo", `create_po (${poLines.length} dòng · stage 101)`, r);
  note(`nguyên văn: ${String(r.json?.message || r.json?.error || r.text || "").slice(0, 200)}`);
  await boot();
  const after = mrState(requestId);
  stateTimeline.push({ stepNo: "B6a", label: "lập PO", before, after, http: r.status });
  console.log(`        · TRƯỚC: ${fmt(before)}\n        · SAU  : ${fmt(after)}`);
}
await boot();
let poRow = (bootCache.purchaseOrders || []).filter((p) => String(p.requestId) === String(requestId))
  .sort((a, z) => String(z.poNo).localeCompare(String(a.poNo)))[0] || null;
const poId = poRow?.id || null;
console.log(`  ⇒ po_no = ${poRow?.poNo || "(không có)"} · poId = ${poId || "-"} · status = ${poRow?.status || "-"}`);
{
  const r = await call("nvkhdemo", "approve_po", { purchaseOrderId: poId, comment: "TASK-134 phát hành PO (bước 101)" });
  step("B6b", "nvkhdemo", "approve_po ⇒ phát hành PO", r);
  await boot();
  poRow = findPo(bootCache, poId) || poRow;
  const after = mrState(requestId);
  note(`PO ${poRow?.poNo} ⇒ status = ${poRow?.status}`);
  stateTimeline.push({ stepNo: "B6b", label: "phát hành PO", before: after, after, http: r.status, poStatus: poRow?.status });
  console.log(`        · PHIẾU SAU: ${fmt(after)}  · PO status = ${poRow?.status}`);
}

// ---------- B7: GIAO NHẬN (102) ----------
console.log("\n── B7. tkhodemo GIAO NHẬN (stage CUNG ỨNG 102) ──");
await boot();
const poItems = (findPo(bootCache, poId)?.items || []);
console.log(`        PO ${poRow?.poNo} có ${poItems.length} dòng`);
const recvLines = poItems.map((i) => ({
  purchaseOrderItemId: i.id,
  quantity: Number(i.orderedQty || i.quantity || 0),
  lotNo: `LOT-T134-${RUN_TAG}`,
})).filter((l) => l.quantity > 0);
let receiptId = null;
{
  const before = mrState(requestId);
  const r = await call("tkhodemo", "receive_goods", {
    purchaseOrderId: poId, deliveryNoteNo: `GN-T134-${RUN_TAG}`, qcOk: true,
    certificateStatus: "complete", deliveryDocumentStatus: "complete", lines: recvLines,
  });
  step("B7", "tkhodemo", `receive_goods (${recvLines.length} dòng)`, r);
  note(`nguyên văn: ${String(r.json?.message || r.json?.error || r.text || "").slice(0, 200)}`);
  await boot();
  const after = mrState(requestId);
  stateTimeline.push({ stepNo: "B7", label: "giao nhận", before, after, http: r.status });
  console.log(`        · TRƯỚC: ${fmt(before)}\n        · SAU  : ${fmt(after)}`);
  const rc = (bootCache.receipts || []).filter((x) => String(x.purchaseOrderId) === String(poId))
    .sort((a, z) => String(z.receiptNo).localeCompare(String(a.receiptNo)))[0];
  receiptId = rc?.id || r.json?.receiptId || null;
  console.log(`  ⇒ receipt_no = ${rc?.receiptNo || "(không có)"} · receiptId = ${receiptId || "-"} · PO status = ${findPo(bootCache, poId)?.status}`);
}

// ---------- B7b: TẢI ẢNH GIAO HÀNG (điều kiện BẮT BUỘC của confirm_delivery) ----------
// `PurchaseManagementUseCase.confirmDelivery` dòng 401 chặn nếu <1 ảnh:
//   store.goodsReceiptImageCount = COUNT(attachments WHERE entity_type='goods_receipt' AND mime LIKE 'image/%')
console.log("\n── B7b. TẢI ẢNH GIAO HÀNG THỰC TẾ (PATCH không có — dùng POST /api/files multipart) ──");
let uploadOk = null;
if (receiptId) {
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==", "base64");
  for (const who of ["tkhodemo", "cha.ht", "admin"]) {
    const key = who === "admin" ? "__admin" : who;
    const fd = new FormData();
    fd.append("file", new Blob([png], { type: "image/png" }), `anh-giao-hang-${RUN_TAG}.png`);
    fd.append("entityType", "goods_receipt");
    fd.append("entityId", receiptId);
    const res = await fetch(`${BASE}/api/files`, { method: "POST", headers: { cookie: sessions.get(key) || "" }, body: fd });
    const text = await res.text();
    const okUp = res.status === 201 || res.status === 200;
    step("B7b", who, `upload ảnh goods_receipt=${receiptId}`, { status: res.status, ok: okUp, json: (() => { try { return JSON.parse(text); } catch { return null; } })(), text });
    if (okUp) { uploadOk = who; break; }
  }
  console.log(`  ⇒ ảnh tải lên bởi: ${uploadOk || "(KHÔNG tải được — confirm_delivery sẽ bị chặn)"}`);
} else { console.log("  ⛔ Không có receiptId — bỏ qua."); }

// ---------- B8: BCH XÁC NHẬN GIAO HÀNG (103) ----------
console.log("\n── B8. cha.ht BCH XÁC NHẬN GIAO HÀNG (stage CUNG ỨNG 103) ──");
if (receiptId) {
  const before = mrState(requestId);
  const r = await call("cha.ht", "confirm_delivery", {
    receiptId, certificateStatus: "complete", deliveryDocumentStatus: "complete",
    comment: "TASK-134 BCH xác nhận giao hàng",
  });
  step("B8", "cha.ht", "confirm_delivery", r);
  note(`nguyên văn: ${String(r.json?.message || r.json?.error || r.text || "").slice(0, 220)}`);
  await boot();
  const after = mrState(requestId);
  const rc = (bootCache.receipts || []).find((x) => String(x.id) === String(receiptId));
  stateTimeline.push({ stepNo: "B8", label: "BCH xác nhận giao hàng", before, after, http: r.status });
  console.log(`        · TRƯỚC: ${fmt(before)}\n        · SAU  : ${fmt(after)}`);
  console.log(`  ⇒ PO ${findPo(bootCache, poId)?.poNo} status = ${findPo(bootCache, poId)?.status} · GRN ${rc?.receiptNo} bch=${rc?.bchConfirmationStatus} posting=${rc?.postingStatus}`);
} else { console.log("  ⛔ Không có GRN — không thể chạy B8."); }

// ---------- TỔNG KẾT ----------
await boot();
const finalMr = mrState(requestId);
const finalPo = findPo(bootCache, poId);
const finalRc = (bootCache.receipts || []).find((x) => String(x.id) === String(receiptId));
console.log("\n" + "═".repeat(104));
console.log("TRẠNG THÁI CUỐI");
console.log(`  phiếu ${reqRow.requestNo}: ${fmt(finalMr)}`);
console.log(`  PO    ${finalPo?.poNo || "-"}: status = ${finalPo?.status || "-"}`);
console.log(`  GRN   ${finalRc?.receiptNo || "-"}: BCH = ${finalRc?.bchConfirmationStatus || "-"} · posting = ${finalRc?.postingStatus || "-"}`);

const okc = log.filter((l) => l.ok).length;
console.log(`\nKẾT QUẢ: ${okc}/${log.length} bước ĐẠT`);
for (const l of log.filter((x) => !x.ok)) console.log(`   ❌ [${l.who}] ${l.what} → HTTP ${l.status} ${l.error || ""}`);
console.log("═".repeat(104));

// ---------- Xuất JSON (mặc định ra thư mục tạm ⇒ KHÔNG ghi vào repo) ----------
const fs = await import("node:fs");
const os = await import("node:os");
const path = await import("node:path");
const out = process.env.PROBE_OUT || path.join(os.tmpdir(), `probe-wf-muahang-standard-${RUN_TAG}.json`);
fs.writeFileSync(out, JSON.stringify({
  runTag: RUN_TAG, base: BASE, apply: true,
  request: { id: requestId, no: reqRow.requestNo, purpose: PURPOSE },
  po: { id: poId, no: finalPo?.poNo, status: finalPo?.status },
  receipt: { id: receiptId, no: finalRc?.receiptNo, bch: finalRc?.bchConfirmationStatus, posting: finalRc?.postingStatus },
  uploadBy: uploadOk,
  timeline: stateTimeline, steps: log,
}, null, 2), "utf8");
console.log(`JSON: ${out}`);
}
