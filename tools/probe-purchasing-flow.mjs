// GĐ-C — CHẠY TRỌN LUỒNG MUA HÀNG BẰNG ĐÚNG TÀI KHOẢN TỪNG VAI TRÒ
//
//   node tools/probe-purchasing-flow.mjs            # chạy thử, in kế hoạch
//   node tools/probe-purchasing-flow.mjs --apply    # thực thi
//
// KHÁC BIỆT CỐT LÕI so với các probe trước: KHÔNG dùng admin để chạy nghiệp vụ.
// Mỗi bước do đúng vai trò thực hiện, đúng như workflow WF-MUAHANG quy định:
//
//   ksda.demo  → lập phiếu đề nghị mua
//   cha.ht     → bước 1  CHT xác nhận nhu cầu        (vai trò cht)
//   thukydemo  → bước 2  Thư ký Tổng giám đốc duyệt  (vai trò thuky)
//   nvdademo   → bước 3  Phòng Dự án kiểm tra khối lượng (da_nv)
//   nvkhdemo   → bước 4  Phòng Kế hoạch tiếp nhận    (kh_nv)
//   giamdoc.demo → bước 5 Giám đốc — OWNER ĐƯỢC PHÂN CÔNG của dự án (director)
//                  (TASK-106 ngày 20/09/2026 đã đổi `approval_project_assignments` bước 5
//                   từ trdademo/da_truong sang giamdoc.demo/director; catalog bước 5 =
//                   "Giám đốc" · allowed_role_codes = director,tgd,giam_doc)
//   trdademo   → bước 5  ĐỐI CHỨNG ÂM: ảnh chụp CŨ `workflow_step_approvers` (V8 seed 18/09)
//   trinhtrench→ bước 5  ĐỐI CHỨNG ÂM: kh_truong — không phân công, không đúng vai trò
//   nvkhdemo   → lập PO
//   tkhodemo   → nhận hàng (thủ kho)
//
// Admin CHỈ dùng cho một việc: đặt mật khẩu đã biết cho các tài khoản demo để đăng nhập được.
// Đó cũng chính là kiểm thử chức năng admin (update_user).
const BASE = process.env.PROBE_BASE || "http://127.0.0.1:9000";
const ADMIN = { username: "admin", password: "Admin123456@" };
const PASS = "Vntech@2026";
const APPLY = process.argv.includes("--apply");

// ---------- Dữ liệu PRJ-DEMO-01 (tra từ DB ở GĐ-A) ----------
const PRJ = {
  id: "PRJ_fdbfab20-bf1f-4ad5-8159-7dcc582140c3",
  code: "PRJ-DEMO-01",
  contractId: "PCON_78092ea4-4d57-4984-9028-a835e4844cd4",
  boqVersionId: "BQVER_0390dda6-d4aa-4b4b-bf98-3a44ed24cc65",
  warehouseId: "WH_51e0f009-4873-4cb6-855c-e6e7fea41e4d",
  supplierId: "SUP_c0f509fc-ed78-4781-823c-2a230a2f6948",
};
const LINES = [
  { boqItemId: "BOQ_762fd4c7-f591-4839-8065-9272540df208", materialId: "MAT_fc920779-6cc2-451c-8e12-c993141417f0", code: "KHAC-VLXD-004", name: "Thép hộp 40x40", unit: "cây", qty: 25, price: 350000 },
  { boqItemId: "BOQ_36a50087-88f4-49e3-ac5a-fff0631b733d", materialId: "MAT_c3ff35ff-c562-4814-8b77-5e925e0d0589", code: "KHAC-VLXD-005", name: "Xi măng PCB40", unit: "bao", qty: 60, price: 98000 },
];
// Tên trường dòng vật tư theo ĐÚNG mã nguồn (RequestManagementUseCase dòng 103-117):
// `quantity` chứ không phải `requestedQty`; kèm materialCode/materialName/unit để thoả
// cấu hình bắt buộc trong form_field_config.
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
async function adminCall(action, payload = {}) { return call("__admin", action, payload); }

const log = [];
// `opts.expectFail = true` ⇒ ca ĐỐI CHỨNG ÂM: bị từ chối (HTTP 400) MỚI là ĐẠT.
// Trước đây probe đếm mọi 400 là HỎNG, kể cả khi 400 là hành vi ĐÚNG của hệ thống
// (bước không tồn tại trong catalog · tài khoản không được phân công) ⇒ báo động giả.
function step(n, who, what, r, opts = {}) {
  const expectFail = opts.expectFail === true;
  const ok = expectFail ? !r.ok : r.ok;
  const detail = r.ok === ok
    ? (r.ok ? "" : ` → HTTP ${r.status}: ${String(r.json?.error || r.json?.message || r.text || "").slice(0, 200)}`)
    : ` → HTTP ${r.status}: ${String(r.json?.error || r.json?.message || r.text || "").slice(0, 200)} (kỳ vọng BỊ TỪ CHỐI)`;
  const line = `${ok ? "✅" : "❌"} ${String(n).padStart(2)}. [${who.padEnd(12)}] ${what}${detail}`;
  console.log(line);
  log.push({ n, who, what, ok, status: r.status, expectFail, error: r.json?.error || r.json?.message || null });
  return r;
}

// ---------- Mở đầu ----------
console.log("═".repeat(96));
console.log(`  LUỒNG MUA HÀNG THỰC TẾ — ${PRJ.code} · ${APPLY ? "THỰC THI" : "XEM TRƯỚC"}`);
console.log("═".repeat(96));

const al = await login(ADMIN.username, ADMIN.password);
sessions.set("__admin", sessions.get(ADMIN.username));
sessions.delete(ADMIN.username);
console.log(`[admin] đăng nhập HTTP ${al.status}`);
if (!al.ok) throw new Error("Không đăng nhập được admin.");

const boot = await (await fetch(`${BASE}/api/system`, { headers: { cookie: sessions.get("__admin") } })).json();
const data = boot?.data || {};
// `data.users` là danh sách ĐẦY ĐỦ (có username); `data.staffDirectory` là bản rút gọn
// chỉ có id/họ tên/vai trò nên KHÔNG tra được theo username. Đây là lỗi tôi đã mắc.
const staff = data.users || data.staffDirectory || [];
const byName = (u) => staff.find((s) => s.username === u);

const ACTORS = ["engineer.demo", "ksda.demo", "cha.ht", "thukydemo", "nvdademo", "nvkhdemo", "trdademo", "trinhtrench", "giamdoc.demo", "tkhodemo"];
console.log(`[bootstrap] ${staff.length} tài khoản · tìm thấy ${ACTORS.filter(byName).length}/${ACTORS.length} tài khoản cần dùng\n`);

if (!APPLY) {
  console.log("Kế hoạch: đặt mật khẩu đã biết cho các tài khoản trên (qua admin update_user),");
  console.log("sau đó chạy luồng bằng chính các tài khoản đó. Chạy lại với --apply.");
  process.exitCode = 0;
} else {

// ---------- 1. Đặt mật khẩu đã biết (chức năng admin) ----------
console.log("── CHUẨN BỊ: admin đặt mật khẩu cho tài khoản demo ──");
for (const u of ACTORS) {
  const row = byName(u);
  if (!row) { console.log(`  ⚠️  không có tài khoản ${u}`); continue; }
  const r = await adminCall("update_user", {
    userId: row.id, employeeCode: row.employeeCode, fullName: row.fullName, username: row.username,
    email: row.email || "", role: row.role, organizationUnitId: row.organizationUnitId,
    approvalLimit: row.approvalLimit ?? 0, newPassword: PASS,
    // ⚠️ BẮT BUỘC truyền active=1: update_user suy ra `active` từ payload và mặc định FALSE
    // (UserManagementUseCase dòng 98), nên thiếu trường này sẽ KHOÁ tài khoản và xoá phiên.
    active: 1,
  });
  step(`P.${u}`, "admin", `đặt mật khẩu cho ${u}`, r);
}

// ---------- 2. Đăng nhập từng vai trò ----------
console.log("\n── ĐĂNG NHẬP THEO TỪNG VAI TRÒ ──");
for (const u of ACTORS) {
  const r = await login(u, PASS);
  step(`L.${u}`, u, `đăng nhập`, r);
}

const as = (u) => (n, what, r) => step(n, u, what, r);

// ---------- 3. LẬP PHIẾU (ksda.demo) ----------
console.log("\n── BƯỚC 0: LẬP PHIẾU ĐỀ NGHỊ MUA ──");
// 0a. KIỂM CHỨNG SAI LỆCH VAI TRÒ (đã SỬA — nay phải chạy được):
//     RequestManagementUseCase.createRequest trước đây đòi vai trò ∈ {engineer, commander, admin},
//     nhưng canonicalRoleCode LUÔN đổi "engineer"→"ksda", "commander"→"cht" khi ghi DB ⇒ mã cũ
//     không bao giờ tồn tại ⇒ chỉ admin lập được phiếu. Nay đã dùng mã vai trò THẬT.
for (const who of ["ksda.demo", "engineer.demo"]) {
  const r = await call(who, "create_request", {
    projectId: PRJ.id, contractId: PRJ.contractId, boqVersionId: PRJ.boqVersionId,
    neededAt: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    priority: "high", area: "Khu A – kiểm thử luồng", purpose: `Kiểm thử vai trò ${who}`,
    sourceWarehouseId: PRJ.warehouseId,
    lines: mkLines(),
  });
  step("0a", who, `THỬ lập phiếu (vai trò thực tế ${byName(who)?.role})`, r);
}
console.log("      ↳ KỲ VỌNG SAU KHI SỬA: 200 — vai trò ksda lập được phiếu.");

// 0b. Lập phiếu bằng ĐÚNG vai trò người đề nghị — SAU KHI SỬA LỖI VAI TRÒ thì phải chạy được.
const mkRequest = () => ({
  projectId: PRJ.id, contractId: PRJ.contractId, boqVersionId: PRJ.boqVersionId,
  neededAt: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  priority: "high", area: "Khu A – kiểm thử luồng", purpose: "Kiểm thử luồng mua hàng thực tế",
  sourceWarehouseId: PRJ.warehouseId, lines: mkLines(),
});
let createRes = await call("ksda.demo", "create_request", mkRequest());
step("1", "ksda.demo", `lập phiếu đề nghị mua (${LINES.length} dòng) — vai trò ksda`, createRes);
if (!createRes.ok) {
  createRes = await adminCall("create_request", mkRequest());
  step("1b", "admin", "lập phiếu — BIỆN PHÁP TẠM", createRes);
}
const requestId = createRes.json?.data?.id || createRes.json?.id || createRes.json?.requestId
  || await (async () => {
    // Phản hồi create_request không trả thẳng id ở dạng tôi giả định ⇒ tra từ bootstrap
    // theo số phiếu LỚN NHẤT (chuỗi DNMH tăng dần). Đây cũng là một phép kiểm chứng:
    // phiếu vừa tạo PHẢI hiện ra trong dữ liệu tải về.
    console.log(`      (khoá phản hồi: ${Object.keys(createRes.json || {}).join(", ")})`);
    const b = await (await fetch(`${BASE}/api/system`, { headers: { cookie: sessions.get("__admin") } })).json();
    const rows = b?.data?.requests || b?.data?.materialRequests || [];
    const mine = rows.filter((r) => /Kiểm thử luồng mua hàng/.test(String(r.purpose || "")));
    const pick = (mine.length ? mine : rows).slice().sort((a, z) => String(z.requestNo).localeCompare(String(a.requestNo)))[0];
    console.log(`      (${rows.length} phiếu trong bootstrap · chọn ${pick?.requestNo} · trạng thái ${pick?.status} · bước ${pick?.approvalStage})`);
    return pick?.id;
  })();

// ---------- 4. NĂM BƯỚC DUYỆT ----------
console.log("\n── CHUỖI DUYỆT THEO CẤU HÌNH ĐANG CHẠY (§6 · `approval_stage_catalog` + `approval_project_assignments`) ──");
// ÁNH XẠ THẬT (đo từ MySQL `vntech_erp`, không đoán):
//   catalog ASTAGE-1 `active=0`  ⇒ phiếu KHÔNG có bước 1, sinh ra đã ở bước 2.
//   catalog ASTAGE-2 thukydemo(thuky) · ASTAGE-3 nvdademo(da_nv) · ASTAGE-4 nvkhdemo(kh_nv)
//   catalog ASTAGE-5 "Giám đốc" · allowed_role_codes=`director,tgd,giam_doc`
//     ↳ Owner của dự án (TASK-106, 20/09/2026) = **giamdoc.demo** (director).
// ⚠️ BẢNG `workflow_step_approvers` (WF-MUAHANG bước 5 = trdademo) là ẢNH CHỤP do migration
//    `V8__workflow_multi.sql` seed ngày 18/09/2026 từ `approval_project_assignments`, và KHÔNG
//    được cập nhật khi TASK-106 đổi Owner bước 5. Vì vậy trdademo KHÔNG phải người được phân
//    công của bước 5 của phiếu này ⇒ 400 là ĐÚNG. Dùng làm ĐỐI CHỨNG ÂM, không phải kỳ vọng ĐẠT.
const APPROVERS = [
  [2, "thukydemo", "Thư ký Tổng giám đốc duyệt"],
  [3, "nvdademo", "Phòng Dự án kiểm tra khối lượng"],
  [4, "nvkhdemo", "Phòng Kế hoạch tiếp nhận"],
];
// ĐỐI CHỨNG ÂM — phải bị TỪ CHỐI (400) mới là ĐẠT.
const NEGATIVE = [
  [1, "cha.ht", "bước 1 đã TẮT trong catalog (active=0) ⇒ phiếu không có bước 1"],
  [5, "trinhtrench", "kh_truong — không được phân công bước 5, không đúng vai trò"],
  [5, "trdademo", "da_truong — chỉ có trong ẢNH CHỤP CŨ workflow_step_approvers"],
];
if (!requestId) {
  console.log("  ⛔ Không lấy được mã phiếu — dừng chuỗi duyệt.");
} else {
  console.log(`  mã phiếu: ${requestId}`);
  for (const [stage, who, what] of APPROVERS) {
    const r = await call(who, "decide_approval", { requestId, stage, decision: "approved", comment: `Kiểm thử GĐ-C bước ${stage}` });
    step(`2.${stage}`, who, `duyệt bước ${stage} — ${what}`, r);
  }
  // ĐỐI CHỨNG ÂM trước khi chốt hồ sơ.
  for (const [stage, who, what] of NEGATIVE) {
    const r = await call(who, "decide_approval", { requestId, stage, decision: "approved", comment: `Đối chứng âm GĐ-C bước ${stage}` });
    step(`2.${stage}✗`, who, `PHẢI bị từ chối — ${what}`, r, { expectFail: true });
  }
  // BƯỚC 5 — do ĐÚNG người được phân công của dự án (giamdoc.demo · director).
  const r5 = await call("giamdoc.demo", "decide_approval", {
    requestId, stage: 5, decision: "approved", comment: "Kiểm thử GĐ-C bước 5 — Giám đốc (Owner được phân công)",
  });
  step("2.5c", "giamdoc.demo", "duyệt bước 5 — Giám đốc (Owner ĐƯỢC PHÂN CÔNG của dự án) → chốt hồ sơ", r5);
  // Sau khi chốt: trdademo phải bị từ chối vì hồ sơ đã qua bước (đối chứng âm thứ hai).
  const r5b = await call("trdademo", "decide_approval", { requestId, stage: 5, decision: "approved", comment: "Đối chứng âm: hồ sơ đã qua bước 5" });
  step("2.5d", "trdademo", "PHẢI bị từ chối — hồ sơ đã qua bước 5", r5b, { expectFail: true });

  // ---------- 5. LẬP PO ----------
  console.log("\n── SAU DUYỆT: LẬP PO ──");
  // Thử bằng ĐÚNG vai trò, nếu bị chặn thì ghi nhận rồi tạm dùng admin để chạy tiếp.
  // Dòng PO phải tham chiếu DÒNG CỦA PHIẾU (`requestItemId`), không phải materialId
  // — xem PurchaseManagementUseCase dòng 67.
  const b0 = await (await fetch(`${BASE}/api/system`, { headers: { cookie: sessions.get("__admin") } })).json();
  // Bootstrap dùng khoá `requests` và dòng vật tư nằm LỒNG trong `items` của phiếu.
  const reqRow = (b0?.data?.requests || []).find((r) => String(r.id) === String(requestId));
  const mrItems = reqRow?.items || [];
  console.log(`      phiếu ${reqRow?.requestNo} có ${mrItems.length} dòng vật tư (trạng thái ${reqRow?.status})`);
  const poLines = mrItems.map((i) => ({
    requestItemId: i.id,
    quantity: Number(i.approvedPurchaseQty || i.requestedQty || i.quantity || 0),
    supplierId: PRJ.supplierId,
    unitPrice: Number(i.estimatedUnitPrice || 0),
  })).filter((l) => l.quantity > 0);
  const poPayload = { requestId, warehouseId: PRJ.warehouseId, supplierId: PRJ.supplierId,
    eta: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10), lines: poLines,
    // Hệ thống CHẶN mua mới khi vật tư còn tồn ở kho khác — đúng nghiệp vụ. Muốn mua tiếp
    // phải nêu lý do ngoại lệ (PurchaseManagementUseCase dòng 125).
    availabilityOverrideReason: "Kiểm thử GĐ-C: vật tư còn tồn ở kho tổ đội nhưng không đủ quy cách thi công" };

  let poRes = await call("nvkhdemo", "create_po", poPayload);
  step("3a", "nvkhdemo", "lập PO bằng vai trò kh_nv (Nhân viên Kế hoạch — đúng mô tả workflow)", poRes);
  if (!poRes.ok) {
    poRes = await adminCall("create_po", poPayload);
    step("3b", "admin", "lập PO — BIỆN PHÁP TẠM do lỗi vai trò", poRes);
  }

  const poId = poRes.ok ? await (async () => {
    const b = await (await fetch(`${BASE}/api/system`, { headers: { cookie: sessions.get("__admin") } })).json();
    const pos = b?.data?.purchaseOrders || [];
    const pick = pos.slice().sort((a, z) => String(z.poNo).localeCompare(String(a.poNo)))[0];
    console.log(`      (${pos.length} PO trong bootstrap · chọn ${pick?.poNo} · trạng thái ${pick?.status})`);
    return pick?.id;
  })() : null;

  // ---------- 6. NHẬN HÀNG (thủ kho) ----------
  console.log("\n── NHẬN HÀNG TẠI KHO ──");
  if (!poId) { console.log("  ⛔ Không có PO — dừng."); }
  else {
    const b = await (await fetch(`${BASE}/api/system`, { headers: { cookie: sessions.get("__admin") } })).json();
    const po = (b?.data?.purchaseOrders || []).find((p) => p.id === poId);
    const items = (b?.data?.purchaseOrderItems || []).filter((i) => String(i.purchaseOrderId) === String(poId));
    const recvLines = (items.length ? items : po?.items || []).map((i) => ({
      purchaseOrderItemId: i.id, quantity: Number(i.orderedQty || i.quantity || 0), lotNo: "LOT-TEST-01",
    })).filter((l) => l.quantity > 0);
    console.log(`      PO ${po?.poNo} · ${recvLines.length} dòng cần nhận`);

    const recvPayload = { purchaseOrderId: poId, deliveryNoteNo: "GN-TEST-0001", qcOk: true,
      certificateStatus: "complete", deliveryDocumentStatus: "complete", lines: recvLines };
    let recvRes = await call("tkhodemo", "receive_goods", recvPayload);
    step("4a", "tkhodemo", "nhận hàng bằng vai trò thu_kho (Thủ kho — đúng mô tả workflow)", recvRes);
    if (!recvRes.ok) {
      recvRes = await adminCall("receive_goods", recvPayload);
      step("4b", "admin", "nhận hàng — BIỆN PHÁP TẠM do lỗi vai trò", recvRes);
    }

    // ---------- 7. XÁC NHẬN GIAO HÀNG ----------
    console.log("\n── XÁC NHẬN GIAO HÀNG ──");
    const b2 = await (await fetch(`${BASE}/api/system`, { headers: { cookie: sessions.get("__admin") } })).json();
    const receipts = b2?.data?.receipts || b2?.data?.goodsReceipts || [];
    const rc = receipts.filter((r) => String(r.purchaseOrderId) === String(poId))
      .sort((a, z) => String(z.receiptNo).localeCompare(String(a.receiptNo)))[0];
    console.log(`      ${receipts.length} phiếu nhập · chọn ${rc?.receiptNo || "(không có)"}`);
    if (rc) {
      const cdPayload = { receiptId: rc.id, certificateStatus: "ok", deliveryDocumentStatus: "ok", comment: "Kiểm thử GĐ-C" };
      let cdRes = await call("cha.ht", "confirm_delivery", cdPayload);
      step("5a", "cha.ht", "xác nhận giao hàng bằng vai trò cht (CHT — đúng mô tả workflow)", cdRes);
      if (!cdRes.ok) {
        cdRes = await adminCall("confirm_delivery", cdPayload);
        step("5b", "admin", "xác nhận giao hàng — BIỆN PHÁP TẠM", cdRes);
      }
    }
  }
}

// ---------- 8. TRẠNG THÁI CUỐI CỦA PHIẾU ----------
if (APPLY) {
  console.log("\n── TRẠNG THÁI CUỐI ──");
  const b = await (await fetch(`${BASE}/api/system`, { headers: { cookie: sessions.get("__admin") } })).json();
  const rows = b?.data?.requests || b?.data?.materialRequests || [];
  for (const r of rows.slice().sort((a, z) => String(z.requestNo).localeCompare(String(a.requestNo))).slice(0, 3)) {
    console.log(`   ${r.requestNo} · trạng thái ${r.status} · bước ${r.approvalStage} · cấp phát ${r.supplyStatus} · ${Number(r.totalEstimatedValue || 0).toLocaleString("vi-VN")} đ`);
  }
}

// ---------- 6. KẾT QUẢ ----------
console.log("\n" + "═".repeat(96));
const okc = log.filter((l) => l.ok).length;
console.log(`KẾT QUẢ: ${okc}/${log.length} bước ĐẠT`);
for (const l of log.filter((x) => !x.ok)) console.log(`   ❌ [${l.who}] ${l.what} → HTTP ${l.status} ${l.error || ""}`);
console.log("═".repeat(96));
console.log(`\nMật khẩu tài khoản demo: ${PASS}`);
}
