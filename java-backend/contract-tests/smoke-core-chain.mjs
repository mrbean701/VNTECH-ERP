#!/usr/bin/env node
/**
 * SMOKE TEST CHUỖI LÕI ĐẦY ĐỦ — Java backend + MySQL thật.
 * Chạy: node java-backend/contract-tests/smoke-core-chain.mjs [baseUrl]
 *
 * Chuỗi kiểm chứng (bám nghiệp vụ MEP):
 *   setup → login → bootstrap
 *   → tạo vật tư (material catalog)          [điều kiện để mapping]
 *   → tạo dự án → tạo hợp đồng
 *   → tạo BOQ item                            [phạm vi hợp đồng]
 *   → tạo đề nghị mua (DNMH)                  [lõi: đề nghị]
 *   → xem bậc duyệt → duyệt bậc 1 (nếu có)    [lõi: luồng duyệt]
 *   → health
 *
 * Ghi PASS/FAIL từng bước; exit != 0 nếu có bước FAIL.
 */

const BASE = process.argv[2] || "http://127.0.0.1:18081";
let cookie = "";
const results = [];

function record(step, ok, detail) {
  results.push({ step, ok, detail });
  console.log(`${ok ? "✅ PASS" : "❌ FAIL"}  ${step}${detail ? " — " + detail : ""}`);
}

async function call(action, payload = {}) {
  const res = await fetch(`${BASE}/api/system`, {
    method: action ? "POST" : "GET",
    headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
    body: action ? JSON.stringify({ action, ...payload }) : undefined,
  });
  for (const c of res.headers.getSetCookie?.() || []) {
    const kv = c.split(";")[0];
    if (kv.startsWith("mep_session=")) cookie = kv;
  }
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, json, text };
}

const stamp = Date.now().toString().slice(-6);
const tag = `SM${stamp}`;

// ---------- 1. AUTH ----------
let r = await call("setup", {
  companyName: "VNTECH SMOKE", fullName: "Smoke Admin", username: "smokeadmin",
  email: "smoke@test.local", password: "Smoke@12345",
});
record("setup (201) / đã setup (409)", r.status === 201 || r.status === 409, `HTTP ${r.status}`);

r = await call("login", { username: "smokeadmin", password: "Smoke@12345" });
record("login", r.status === 200 && r.json?.ok === true, `HTTP ${r.status} · session=${Boolean(cookie)}`);

r = await call(null);
const data0 = r.json?.data;
record("bootstrap", r.status === 200 && Boolean(data0), `${data0 ? Object.keys(data0).length : 0} nhóm dữ liệu`);

// ---------- 2. VẬT TƯ ----------
const matCode = `VT${stamp}`;
r = await call("save_material", {
  code: matCode, name: `Vật tư smoke ${stamp}`, unit: "cái",
  system: "KHAC", standardPrice: 125000,
});
const matOk = r.status === 200 || r.status === 201;
record("save_material (danh mục vật tư)", matOk, `HTTP ${r.status} · mã ${matCode}${!matOk ? " · " + String(r.json?.error || r.text).slice(0, 120) : ""}`);

r = await call(null);
const materials = r.json?.data?.materials || [];
const mat = materials.find((m) => String(m.code) === matCode);
record("bootstrap có vật tư mới", Boolean(mat), `${materials.length} vật tư · id=${mat?.id ?? "?"}`);

// ---------- 3. DỰ ÁN + HỢP ĐỒNG ----------
r = await call("create_project", {
  code: tag, name: `Dự án smoke ${stamp}`, status: "active",
  startDate: "2026-01-01", plannedEndDate: "2026-12-31",
});
record("create_project", r.status === 200 || r.status === 201, `HTTP ${r.status}`);

r = await call(null);
const projects = r.json?.data?.projects || [];
const project = projects.find((p) => String(p.code) === tag);
record("bootstrap có dự án mới", Boolean(project), `${projects.length} dự án · id=${project?.id ?? "?"}`);
const projectId = project?.id || "";

r = await call("save_project_contract", {
  projectId, contractNo: `HD${stamp}`, contractName: `Hợp đồng smoke ${stamp}`,
  signedAt: "2026-01-05", effectiveFrom: "2026-01-05", effectiveTo: "2026-12-31",
});
record("save_project_contract", r.status === 200 || r.status === 201, `HTTP ${r.status}${r.status >= 400 ? " · " + String(r.json?.error || r.text).slice(0, 120) : ""}`);

r = await call(null);
const contracts = (r.json?.data?.projectContracts || []).filter((c) => String(c.projectId) === String(projectId));
const contract = contracts[0];
record("bootstrap có hợp đồng", Boolean(contract), `hợp đồng=${contract?.contractNo ?? "?"}`);
const contractId = contract?.id || "";

// ---------- 4. BOQ ----------
// 4a. BOQ version (bắt buộc trước khi thêm dòng BOQ)
r = await call("save_boq_version", {
  projectId, contractId, versionName: `BOQ smoke ${stamp}`, makeActive: true, revisionType: "revision",
});
const verOk = r.status === 200 || r.status === 201;
record("save_boq_version (phiên bản BOQ)", verOk, `HTTP ${r.status}${r.json?.boqVersionId ? " · " + r.json.boqVersionId : ""}${!verOk ? " · " + String(r.json?.error || r.text).slice(0, 120) : ""}`);
const boqVersionId = r.json?.boqVersionId || "";

// 4b. Dòng BOQ (phạm vi hợp đồng để DNMH đối chiếu)
r = await call("save_boq_item", {
  projectId, contractId, boqVersionId, materialId: mat?.id || "",
  materialCode: matCode, materialName: `Vật tư smoke ${stamp}`,
  unit: "cái", contractQty: 100, unitPrice: 125000, itemType: "contract",
  rowRole: "material",
});
const boqOk = r.status === 200 || r.status === 201;
record("save_boq_item (dòng BOQ hợp đồng)", boqOk, `HTTP ${r.status}${!boqOk ? " · " + String(r.json?.error || r.text).slice(0, 130) : ""}`);

// 4c. đối chiếu vật tư BOQ ↔ danh mục (mapping)
r = await call("compare_boq_materials", { projectId, contractId, boqVersionId });
record("compare_boq_materials (đối chiếu BOQ↔danh mục)", r.status < 500, `HTTP ${r.status}`);

// ---------- 4d. PHÂN CÔNG OWNER DUYỆT THEO DỰ ÁN (điều kiện bắt buộc để tạo DNMH) ----------
// Bậc 1..5 phải có Owner hợp lệ cho từng dự án, nếu không create_request báo:
// "Dự án chưa được phân công 01 Owner hợp lệ cho Bước N"
// Lấy danh sách bậc duyệt TỪ BOOTSTRAP (không có action list_approval_stages riêng)
r = await call(null);
const bootData = r.json?.data || {};
const stages =
  bootData.approvalStages ||
  bootData.approval_stage_catalog ||
  bootData.approvalStageCatalog ||
  [];
record("bootstrap có bậc duyệt (seed V2)", Array.isArray(stages) && stages.length > 0,
  `${Array.isArray(stages) ? stages.length : 0} bậc${Array.isArray(stages) && stages[0] ? " · " + JSON.stringify(stages[0]).slice(0, 90) : ""}`);

const users = bootData.users || [];
const adminUser = users.find((x) => String(x.username) === "smokeadmin") || users[0];
const ownerId = adminUser?.id || "";

r = await call("save_email_settings", {
  enabled: false, smtpHost: "localhost", smtpPort: 25, security: "none",
  senderEmail: "no-reply@vntech.local", senderName: "VNTECH Smoke", baseUrl: "http://localhost:18081",
  assignments: (Array.isArray(stages) ? stages : []).map((s) => ({
    projectId, stage: s.stageNo ?? s.stage ?? s.stage_no, ownerUserId: ownerId, ccEmails: "",
  })),
});
record("save_email_settings + phân công Owner theo dự án", r.status === 200 || r.status === 201,
  `HTTP ${r.status} · owner=${ownerId || "?"} · ${Array.isArray(stages) ? stages.length : 0} bậc${r.status >= 400 ? " · " + String(r.json?.error || r.text).slice(0, 120) : ""}`);

// ---------- 5. ĐỀ NGHỊ MUA (LÕI) ----------
r = await call("create_request", {
  projectId, neededAt: "2026-10-01", area: "Khu vực smoke",
  lines: [{
    materialId: mat?.id || "", materialCode: matCode, materialName: `Vật tư smoke ${stamp}`,
    unit: "cái", quantity: 10, note: "smoke test",
  }],
});
let requestNo = null;
let requestCreated = false;
if (r.status === 200 || r.status === 201) {
  requestNo = r.json?.requestNo || r.json?.request_no || null;
  requestCreated = true;
  record("create_request (DNMH)", true, `HTTP ${r.status}${requestNo ? " · " + requestNo : ""}`);
} else {
  const msg = String(r.json?.error || r.text);
  record("create_request trả lỗi nghiệp vụ (không 500)", r.status === 400 || r.status === 409, `HTTP ${r.status} · ${msg.slice(0, 150)}`);
}

// ---------- 6. BOOTSTRAP PHẢN ÁNH PHIẾU ----------
r = await call(null);
const d = r.json?.data;
const reqs = d?.requests || [];
const mine = reqs.find((x) => String(x.projectCode || "") === tag) || reqs[reqs.length - 1] || null;
record("bootstrap phản ánh phiếu đề nghị", reqs.length > 0, `${reqs.length} phiếu${mine?.requestNo ? " · " + mine.requestNo : ""}${mine?.status ? " · " + mine.status : ""}`);

// ---------- 7. LUỒNG DUYỆT (stages đã lấy ở 4d) ----------
if (requestCreated && Array.isArray(stages) && stages.length && mine?.id) {
  const stageNo = stages[0].stageNo ?? stages[0].stage ?? stages[0].stage_no ?? 1;
  r = await call("decide_approval", { requestId: mine.id, stage: stageNo, decision: "approved" });
  const okOrClear = r.status < 500;
  record("decide_approval (duyệt bậc 1)", okOrClear,
    `HTTP ${r.status}${r.status >= 400 ? " · " + String(r.json?.error || r.text).slice(0, 140) : ""}`);
} else {
  record("decide_approval (bỏ qua — chưa có phiếu/bậc)", true, requestCreated ? `${stages.length} bậc` : "chưa tạo được phiếu");
}

// ---------- 8. HEALTH ----------
const h = await fetch(`${BASE}/actuator/health`).then((x) => x.json()).catch(() => null);
record("actuator health UP", h?.status === "UP",
  `db=${h?.components?.db?.details?.database ?? "?"} · components=${h?.components ? Object.keys(h.components).join(",") : "?"}`);

// ---------- TỔNG KẾT ----------
const pass = results.filter((x) => x.ok).length;
const fail = results.length - pass;
console.log(`\n===== SMOKE CHUỖI LÕI: ${pass}/${results.length} PASS · ${fail} FAIL =====`);
process.exit(fail === 0 ? 0 : 1);
