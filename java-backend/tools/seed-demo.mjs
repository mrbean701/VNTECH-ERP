#!/usr/bin/env node
/**
 * SEED DỮ LIỆU MẪU ĐẦY ĐỦ LUỒNG NGHIỆP VỤ — Java backend + MySQL (cutover).
 * Chạy: node java-backend/tools/seed-demo.mjs [baseUrl]
 *  - Reset lại mật khẩu admin + các user mẫu trực tiếp DB (PBKDF2 chuẩn Java)
 *    để bỏ sự phụ thuộc hash bị ghi đè bởi monolith UI song song.
 *  - Idempotent: đơn vị/user đã tồn tại thì bỏ qua; nếu chưa có MR thì tạo mới chuỗi.
 */
const BASE = process.argv[2] || "http://127.0.0.1:9000";
const ADMIN_USER = "admin";
const ADMIN_PASS = "Admin123456@";
const USER_PASS = "VnTech@123";
const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==", "base64");

import { execFileSync } from "node:child_process";
import { randomBytes, pbkdf2Sync } from "node:crypto";
const MYSQL = "C:/Program Files/MySQL/MySQL Server 8.0/bin/mysql.exe";
function mysqlQuery(sql) {
  return execFileSync(MYSQL, ["-h", "127.0.0.1", "-P", "3306", "-u", "vntech", "-pvntech", "-D", "vntech_erp", "-N", "-e", sql], { encoding: "utf8" }).trim();
}
function mysqlExec(sql) {
  execFileSync(MYSQL, ["-h", "127.0.0.1", "-P", "3306", "-u", "vntech", "-pvntech", "-D", "vntech_erp", "-e", sql], { encoding: "utf8" });
}
function pbkdf2(pass) {
  const salt = randomBytes(16);
  const key = pbkdf2Sync(pass, salt, 600000, 32, "sha256");
  return `pbkdf2$600000$${salt.toString("hex")}$${key.toString("hex")}`;
}
function tableList(sql) {
  return mysqlQuery(sql).split("\n").filter(Boolean).map((l) => l.split("\t").map((c) => c.replace(/\r$/, "")));
}

let cookie = "";
const results = [];
function record(step, ok, detail) {
  results.push({ step, ok, detail });
  console.log(`${ok ? "✅ PASS" : "❌ FAIL"}  ${step}${detail ? " — " + detail : ""}`);
}
const FAIL = (step, r) => record(step, false, `HTTP ${r.status} · ${String(r.json?.error || r.text).slice(0, 200)}`);

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
  let json = null; try { json = JSON.parse(text); } catch {}
  return { status: res.status, json, text };
}
async function login(username, password) {
  const before = cookie;
  cookie = "";
  const r = await call("login", { username, password });
  if (r.status !== 200) cookie = before;
  return r;
}
async function uploadFile(entityType, entityId, fileName, buffer, mime) {
  const form = new FormData();
  form.set("entityType", entityType);
  form.set("entityId", entityId);
  form.set("file", new Blob([buffer], { type: mime }), fileName);
  const res = await fetch(`${BASE}/api/files`, { method: "POST", headers: cookie ? { Cookie: cookie } : {}, body: form });
  const text = await res.text();
  let json = null; try { json = JSON.parse(text); } catch {}
  return { status: res.status, json, text };
}

// ======== helpers DB đọc id ========
function dbUserIds() {
  return Object.fromEntries(tableList("SELECT username, id FROM users").map(([u, id]) => [u, id]));
}
function dbOrgIds() {
  return Object.fromEntries(tableList("SELECT code, id FROM organization_units").map(([code, id]) => [code, id]));
}

(async () => {
  // ============ 0. RESET MẬT KHẨU + AUTH ============
  const adminHash = pbkdf2(ADMIN_PASS);
  mysqlExec(`UPDATE users SET password_hash='${adminHash}', must_change_password=0 WHERE username='${ADMIN_USER}';`);
  let r = await login(ADMIN_USER, ADMIN_PASS);
  if (r.status !== 200 || !r.json?.ok) { record("login admin", false, `HTTP ${r.status} · ${r.text.slice(0, 120)}`); process.exit(1); }
  record("login admin (hash đã reset)", true, "HTTP 200");

  // ============ 1. ĐƠN VỊ ============
  const orgs = [
    { unitType: "company", code: "VNTECH", name: "Tổng công ty VNTECH" },
    { unitType: "site_command", code: "BCH", name: "Ban chỉ huy công trường" },
    { unitType: "department", code: "DA", name: "Phòng Dự án" },
    { unitType: "department", code: "KH", name: "Phòng Kế hoạch" },
    { unitType: "department", code: "TCKT", name: "Phòng Tài chính – Kế toán" },
  ];
  let orgIds = dbOrgIds();
  for (const o of orgs) {
    if (orgIds[o.code]) { record(`Đơn vị ${o.code}`, true, "đã tồn tại"); continue; }
    r = await call("save_organization_unit", o);
    if (r.status === 200 || r.status === 201) { orgIds = dbOrgIds(); record(`Đơn vị ${o.code}`, true, String(r.json?.message || "").slice(0, 90)); }
    else if ((r.status === 400 || r.status === 409) && String(r.json?.error || "").includes("tồn tại")) {
      orgIds = dbOrgIds(); record(`Đơn vị ${o.code}`, true, "trùng tên/mã đơn vị đã có");
    }
    else record(`Đơn vị ${o.code}`, false, `HTTP ${r.status} · ${String(r.json?.error || r.text).slice(0, 120)}`);
  }
  orgIds = dbOrgIds();
  // DA trùng tên với DA-01 cũ → ánh xạ DA dùng DA-01
  if (!orgIds["DA"]) {
    const row = tableList("SELECT code, id FROM organization_units WHERE name LIKE 'Ph_ng D_ %n'");
    if (row.length) orgIds["DA"] = row[0][1];
  }
  record("org IDs sẵn sàng", Boolean(orgIds.VNTECH && orgIds.BCH && orgIds.KH && orgIds.TCKT && orgIds.DA),
    `VNTECH=${!!orgIds.VNTECH} BCH=${!!orgIds.BCH} DA=${!!orgIds.DA} KH=${!!orgIds.KH} TCKT=${!!orgIds.TCKT}`);

  // ============ 2. DỰ ÁN ============
  const existingProj = tableList("SELECT id FROM projects WHERE code='PRJ-DEMO-01'");
  r = await call("create_project", {
    code: "PRJ-DEMO-01", name: "Dự án mẫu chuẩn hóa quy trình VNTECH",
    status: "active", startDate: "2026-01-01", plannedEndDate: "2026-12-31",
  });
  if (r.status === 200) record("create_project PRJ-DEMO-01", true, String(r.json?.message || "").slice(0, 90));
  else if (existingProj.length && r.status >= 400) record("create_project PRJ-DEMO-01", true, "đã tồn tại từ lần chạy trước");
  else FAIL("create_project PRJ-DEMO-01", r);

  r = await call(null);
  const b1 = r.json?.data || {};
  const project = (b1.projects || []).find((p) => String(p.code) === "PRJ-DEMO-01");
  const projectId = project?.id || "";
  let warehouse = (b1.warehouses || []).find((w) => String(w.projectId) === String(projectId));
  record("có projectId + kho dự án", Boolean(projectId && warehouse), `project=${projectId.slice(0, 18)}… kho=${warehouse?.code ?? "?"}`);
  if (!projectId) process.exit(1);

  // ============ 3. USER (mẫu VnTech@123, idempotent) ============
  const usersDef = [
    { username: "cha.ht", role: "cht", fullName: "Chỉ huy trưởng A", employeeCode: "NV-CHA", org: "BCH" },
    { username: "trinhtrench", role: "kh_truong", fullName: "Trưởng phòng Kế hoạch B", employeeCode: "NV-TRP", org: "KH" },
    { username: "trdademo", role: "da_truong", fullName: "Trưởng phòng Dự án C", employeeCode: "NV-TRD", org: "DA" },
    { username: "thukydemo", role: "thuky", fullName: "Thư ký TGĐ D", employeeCode: "NV-TK", org: "VNTECH" },
    { username: "nvdademo", role: "da_nv", fullName: "Nhân viên Dự án E", employeeCode: "NV-DA", org: "DA" },
    { username: "nvkhdemo", role: "kh_nv", fullName: "Nhân viên Kế hoạch F", employeeCode: "NV-KH", org: "KH" },
    { username: "tkhodemo", role: "thu_kho", fullName: "Thủ kho G", employeeCode: "NV-TKHO", org: "BCH" },
    { username: "kttdemo", role: "accountant", fullName: "Kế toán trưởng H", employeeCode: "NV-KTT", org: "TCKT" },
  ];
  let userIds = dbUserIds();
  for (const u of usersDef) {
    const orgUnitId = orgIds[u.org];
    if (!orgUnitId) { record(`Tạo user ${u.username} [${u.role}]`, false, "thiếu orgId cho " + u.org); continue; }
    if (userIds[u.username]) {
      record(`Tạo user ${u.username} [${u.role}]`, true, "đã tồn tại");
      continue;
    }
    r = await call("create_user", {
      username: u.username, password: USER_PASS, role: u.role, fullName: u.fullName,
      employeeCode: u.employeeCode, organizationUnitId: orgUnitId, projectIds: [projectId],
    });
    if (r.status === 200) record(`Tạo user ${u.username} [${u.role}]`, true, String(r.json?.message || "").slice(0, 80));
    else FAIL(`Tạo user ${u.username} [${u.role}]`, r);
  }
  // đảm bảo mật khẩu user mẫu chuẩn Java (reset trực tiếp DB để login ổn định)
  for (const u of usersDef) {
    mysqlExec(`UPDATE users SET password_hash='${pbkdf2(USER_PASS)}', must_change_password=0 WHERE username='${u.username}';`);
  }
  userIds = dbUserIds();
  record("user IDs đủ (8 user)", usersDef.every((u) => userIds[u.username]), Object.keys(userIds).join(","));

  // ============ 4. HỢP ĐỒNG ============
  const contractRow = tableList("SELECT id FROM project_contracts WHERE project_id='" + projectId + "' LIMIT 1");
  if (!contractRow.length) {
    r = await call("save_project_contract", {
      projectId, contractNo: "HD-PRJ-DEMO-01", contractName: "Hợp đồng thi công tổng thầu",
      signedAt: "2026-01-10", effectiveFrom: "2026-01-10", effectiveTo: "2026-12-31",
    });
    if (r.status === 200) record("save_project_contract HD-PRJ-DEMO-01", true, String(r.json?.message || "").slice(0, 110));
    else FAIL("save_project_contract", r);
  } else record("save_project_contract HD-PRJ-DEMO-01", true, "đã tồn tại");

  // ============ 5. VẬT TƯ ============
  const mats = [
    { code: "VL-THEP", name: "Thép hộp 40x40", unit: "cây", standardPrice: 350000 },
    { code: "VL-XIMANG", name: "Xi măng PCB40", unit: "bao", standardPrice: 98000 },
    { code: "VL-SAT02", name: "Sắt phi 12", unit: "cây", standardPrice: 240000 },
    { code: "VL-GACH", name: "Gạch ống 4 lỗ", unit: "viên", standardPrice: 4200 },
  ];
  const materialIds = {};
  for (const m of mats) {
    const matRow = tableList("SELECT id FROM materials WHERE code='" + m.code + "' LIMIT 1");
    if (matRow.length) { materialIds[m.code] = matRow[0][0]; continue; }
    r = await call("save_material", { ...m, system: "KHAC" });
    if (r.status === 200) record(`save_material ${m.code}`, true, "HTTP 200");
    else FAIL(`save_material ${m.code}`, r);
  }
  for (const m of mats) {
    const matRow = tableList("SELECT id FROM materials WHERE code='" + m.code + "' LIMIT 1");
    if (matRow.length) materialIds[m.code] = materialIds[m.code] || matRow[0][0];
  }
  record("materialIds đủ", mats.every((m) => materialIds[m.code]), mats.length + " vật tư");

  // ============ 6. BOQ VERSION + DÒNG BOQ ============
  const boqRow = tableList("SELECT id FROM boq_versions WHERE version_name='BOQ V1' AND project_id='" + projectId + "' LIMIT 1");
  let boqVersionId = boqRow[0]?.[0] || "";
  if (!boqVersionId) {
    r = await call("save_boq_version", { projectId, contractId: "", versionName: "BOQ V1", makeActive: true });
    boqVersionId = r.json?.boqVersionId || "";
    if (r.status === 200 && boqVersionId) record("save_boq_version V1", true, boqVersionId.slice(0, 18) + "…");
    else FAIL("save_boq_version", r);
  } else record("save_boq_version V1", true, "đã tồn tại");

  const boqItemIds = {};
  for (const m of mats) {
    const biRow = tableList("SELECT id FROM project_boq_items WHERE material_id='" + materialIds[m.code] + "' AND boq_version_id='" + boqVersionId + "' LIMIT 1");
    if (biRow.length) { boqItemIds[m.code] = biRow[0][0]; continue; }
    r = await call("save_boq_item", {
      projectId, contractId: "", boqVersionId, materialId: materialIds[m.code],
      materialCode: m.code, materialName: m.name, unit: m.unit,
      contractQty: 500, unitPrice: m.standardPrice, itemType: "contract", rowRole: "material",
    });
    if (r.status === 200) { boqItemIds[m.code] = r.json?.boqItemId || ""; record(`save_boq_item ${m.code}`, true, "HTTP 200"); }
    else FAIL(`save_boq_item ${m.code}`, r);
  }

  // ============ 7. NCC + TỔ ĐỘI ============
  const supRow = tableList("SELECT id FROM suppliers WHERE code='NCC-VTMN' LIMIT 1");
  if (!supRow.length) {
    r = await call("save_supplier", {
      name: "Tổng kho Vật tư Miền Nam", code: "NCC-VTMN", contactName: "Minh",
      phone: "0901234567", email: "vtmn@test.local", address: "Bình Dương", active: true,
    });
    if (r.status === 200 || r.status === 201) record("save_supplier NCC-VTMN", true, "HTTP " + r.status);
    else FAIL("save_supplier NCC-VTMN", r);
  } else record("save_supplier NCC-VTMN", true, "đã tồn tại");

  const teamRow = tableList("SELECT id, code FROM teams WHERE project_id='" + projectId + "' LIMIT 1");
  if (!teamRow.length) {
    r = await call("create_project_team", { projectId, code: "TD-01", name: "Tổ đội thi công số 1", trade: "installation", active: true });
    if (r.status === 200 || r.status === 201) record("create_project_team TD-01", true, String(r.json?.message || "").slice(0, 90));
    else FAIL("create_project_team TD-01", r);
  } else record("create_project_team TD-01", true, "đã tồn tại");

  // ============ 8. OWNER 5 BẬC ============
  const owners = {
    1: userIds["cha.ht"],
    2: userIds["thukydemo"],
    3: userIds["nvdademo"],
    4: userIds["nvkhdemo"],
    5: userIds["trdademo"],
  };
  r = await call("save_email_settings", {
    enabled: false, smtpHost: "localhost", smtpPort: 25, security: "none",
    senderEmail: "no-reply@vntech.local", senderName: "VNTECH DEMO", baseUrl: BASE,
    assignments: [1, 2, 3, 4, 5].map((stage) => ({ projectId, stage, ownerUserId: owners[stage], ccEmails: "" })),
  });
  if (r.status === 200) record("save_email_settings (Owner 5 bậc)", true, String(r.json?.message || "").slice(0, 100));
  else FAIL("save_email_settings", r);

  // ============ 9. LẬP DNMH (tạo mới nếu chưa có MR cho dự án) ============
  const mrRow = tableList("SELECT id, request_no FROM material_requests WHERE project_id='" + projectId + "' LIMIT 1");
  if (mrRow.length) {
    record("create_request (DNMH)", true, "đã tồn tại " + mrRow[0][1]);
  } else {
    r = await call("create_request", {
      projectId, neededAt: "2026-10-01", area: "Khu A – Nhà xưởng", priority: "high",
      purpose: "Vật tư phục vụ thi công giai đoạn 1", sourceWarehouseId: warehouse?.id || "",
      lines: [
        { materialId: materialIds["VL-THEP"], materialCode: "VL-THEP", materialName: "Thép hộp 40x40", unit: "cây", quantity: 120, unitPrice: 350000, boqItemId: boqItemIds["VL-THEP"] },
        { materialId: materialIds["VL-XIMANG"], materialCode: "VL-XIMANG", materialName: "Xi măng PCB40", unit: "bao", quantity: 300, unitPrice: 98000, boqItemId: boqItemIds["VL-XIMANG"] },
      ],
    });
    if (r.status === 200 || r.status === 201) record("create_request (DNMH)", true, `HTTP ${r.status} · ${r.json?.requestNo || ""}`);
    else FAIL("create_request", r);
  }
  r = await call(null);
  const b5 = r.json?.data || {};
  let mr = (b5.requests || []).find((x) => String(x.projectId) === String(projectId)) || (b5.requests || []).slice(-1)[0];
  let requestId = mr?.id || "";
  let mrItems = mr?.items || [];
  if (!requestId) {
    // tìm qua DB khi bootstrap không trả
    const rr = tableList("SELECT id, request_no FROM material_requests WHERE project_id='" + projectId + "' LIMIT 1");
    if (rr.length) requestId = rr[0][0];
  }
  record("có requestId + dòng MR", Boolean(requestId), `MR=${mr?.requestNo ?? "?"} · ${mrItems.length} dòng`);

  // ============ 10. DUYỆT TỪNG BẬC THEO VAI ============
  const stages = [
    { stage: 1, user: "cha.ht", pass: "CHT xác nhận nhu cầu" },
    { stage: 2, user: "thukydemo", pass: "Thư ký TGĐ duyệt" },
    { stage: 3, user: "nvdademo", pass: "Phòng Dự án kiểm tra khối lượng" },
    { stage: 4, user: "nvkhdemo", pass: "Phòng Kế hoạch tiếp nhận" },
    { stage: 5, user: "trdademo", pass: "Trưởng phòng DA + KH xác nhận cuối" },
  ];
  let okStages = 0;
  const mrStatus0 = tableList("SELECT status FROM material_requests WHERE id='" + requestId + "'");
  const mrApproved = mrStatus0[0]?.[0] === "approved";
  for (const s of stages) {
    if (mrApproved) { record(`Duyệt bậc ${s.stage} (${s.pass})`, true, "đã duyệt ở lần chạy trước"); okStages++; continue; }
    r = await login(s.user, USER_PASS);
    if (r.status !== 200) { FAIL(`login ${s.user}`, r); continue; }
    r = await call("decide_approval", { requestId, stage: s.stage, decision: "approved", comment: "Duyệt tự động seed" });
    if (r.status === 200 || r.status === 201) { okStages++; record(`Duyệt bậc ${s.stage} (${s.pass})`, true, "HTTP " + r.status); }
    else FAIL(`Duyệt bậc ${s.stage} (${s.pass})`, r);
  }
  record(`Duyệt ${okStages}/${stages.length} bậc`, okStages === stages.length, mrApproved ? "MR đã duyệt hoàn tất trước đó" : "");

  r = await login(ADMIN_USER, ADMIN_PASS);
  record("login lại admin", r.status === 200, "HTTP " + r.status);

  // ============ 11. CREATE PO (lấy item ids/qty trực tiếp DB) ============
  const mrItemRows = tableList(
    "SELECT id, approved_purchase_qty, requested_qty, material_id FROM material_request_items WHERE request_id='" + requestId + "' ORDER BY line_no")
    .map(([id, aq, rq, mid]) => ({ id, approved: Number(aq), requested: Number(rq || aq), materialId: mid }));
  record("MR lines sẵn sàng (DB)", mrItemRows.length >= 2, mrItemRows.length + " dòng");
  const poRow = tableList("SELECT id FROM purchase_orders WHERE request_id='" + requestId + "' LIMIT 1");
  let poId = poRow[0]?.[0] || "";
  if (!poId && requestId) {
    r = await call("create_po", {
      requestId, warehouseId: warehouse?.id || "", supplierId: supRow[0]?.[0] || "",
      eta: "2026-10-15", certificateStatus: "not_required", deliveryDocumentStatus: "not_required",
      lines: mrItemRows.map((it) => ({
        requestItemId: it.id,
        quantity: Math.max(1, Math.round((it.approved || it.requested) / 2)),
        supplierId: supRow[0]?.[0] || "",
        plannedDeliveryAt: "2026-10-15",
      })),
    });
    const id = (r.status === 200 && (r.json?.poIds?.[0] || r.json?.purchaseOrderId || r.json?.poId || r.json?.id)) || "";
    if (id) { poId = id; record("create_po", true, String(r.json?.poNos?.[0] || "HTTP 200")); }
    else FAIL("create_po", r);
  } else if (poId) record("create_po", true, "đã tồn tại");

  // ============ 12. RECEIVE GOODS + ẢNH + CONFIRM DELIVERY ============
  // lấy dòng PO + số lượng còn thiếu nếu có
  let receiptId = "";
  if (poId) {
    const grRow = tableList("SELECT id FROM goods_receipts WHERE purchase_order_id='" + poId + "' LIMIT 1");
    if (grRow.length) {
      receiptId = grRow[0][0];
      record("receive_goods", true, "đã tồn tại");
    } else {
      r = await call(null);
      const po = (r.json?.data?.purchaseOrders || []).find((p) => String(p.id) === String(poId));
      const poLines = (po?.items || []).filter((it) => Number(it.actualDeliveredQty || 0) + Number(it.closedQty || 0) < Number(it.orderedQty || 0));
      r = await call("receive_goods", {
        purchaseOrderId: poId, deliveryNoteNo: `GRN-DEMO-${Date.now().toString().slice(-6)}`, qcOk: true,
        certificateStatus: "not_required", deliveryDocumentStatus: "complete",
        lines: poLines.map((l) => ({ purchaseOrderItemId: l.id, quantity: Number(l.orderedQty ?? 1), lotNo: "LOT-DEMO-01" })),
      });
      receiptId = r.status === 200 ? (r.json?.receiptId || r.json?.grnId || r.json?.id || "") : "";
      if (!receiptId && r.status === 200) {
        const grf = tableList("SELECT id FROM goods_receipts WHERE purchase_order_id='" + poId + "' ORDER BY created_at DESC LIMIT 1");
        receiptId = grf[0]?.[0] || "";
      }
      if (receiptId) record("receive_goods", true, String(r.json?.receiptNo || "").slice(0, 80));
      else FAIL("receive_goods", r);
    }
  }

  if (receiptId) {
    const fileRow = tableList("SELECT id FROM attachments WHERE entity_type='goods_receipt' AND entity_id='" + receiptId + "' LIMIT 1");
    if (!fileRow.length) {
      r = await uploadFile("goods_receipt", receiptId, "anh-giao-hang-demo.png", PNG_1X1, "image/png");
      record("POST /api/files (ảnh giao hàng)", r.status === 201 && r.json?.ok === true, "HTTP " + r.status);
    } else record("POST /api/files (ảnh giao hàng)", true, "đã tồn tại");
    const confRow = tableList("SELECT id FROM goods_receipts WHERE id='" + receiptId + "' AND bch_confirmation_status<>'pending' LIMIT 1");
    if (!confRow.length) {
      r = await call("confirm_delivery", {
        receiptId, certificateStatus: "not_required", deliveryDocumentStatus: "complete",
        comment: "BCH xác nhận giao hàng – seed demo",
      });
      if (r.status === 200) record("confirm_delivery", true, String(r.json?.message || "").slice(0, 90));
      else FAIL("confirm_delivery", r);
    } else record("confirm_delivery", true, "đã tồn tại");
  }

  // ============ 13. ISSUE + RETURN STOCK ============
  r = await call(null);
  const b6 = r.json?.data || {};
  const siteWarehouse = (b6.warehouses || []).find((w) => String(w.projectId) === String(projectId) && w.type === "site")
                     || (b6.warehouses || []).find((w) => String(w.projectId) === String(projectId)) || warehouse;
  const team2 = (b6.teams || []).find((t) => String(t.projectId) === String(projectId)) || { id: teamRow[0]?.[0] || "" };
  const issueRow = tableList("SELECT id FROM stock_issues WHERE request_id='" + requestId + "' LIMIT 1");
  if (!issueRow.length) {
    r = await call("issue_stock", {
      projectId, fromWarehouseId: siteWarehouse?.id || "", teamId: team2.id || "", requestId,
      receivedByName: "Tổ đội 1", note: "xuất kho theo DNMH",
      lines: mrItems.map((it) => ({
        requestItemId: it.id, materialId: it.materialId,
        quantity: Math.min(10, Number(it.approvedPurchaseQty ?? it.requestedQty ?? 1) || 1),
      })),
    });
    if (r.status === 200) record("issue_stock", true, String(r.json?.message || "").slice(0, 90));
    else FAIL("issue_stock", r);
  } else record("issue_stock", true, "đã tồn tại");

  const retRow = tableList("SELECT id FROM material_returns WHERE team_id='" + (team2.id || "") + "' LIMIT 1");
  if (!retRow.length) {
    r = await call("return_stock", {
      projectId, teamId: team2.id || "", toWarehouseId: siteWarehouse?.id || "",
      returnedByName: "Tổ đội 1", note: "hoàn trả vật tư thừa",
      lines: [{ materialId: materialIds["VL-XIMANG"], quantity: 1, condition: "good", reason: "thừa" }],
    });
    if (r.status === 200) record("return_stock", true, String(r.json?.message || "").slice(0, 90));
    else FAIL("return_stock", r);
  } else record("return_stock", true, "đã tồn tại");

  // ============ 14. BỔ SUNG DATA (VẬT TƯ CHUYÊN NGÀNH / HR / TÀI CHÍNH / NHẬT KÝ / CÔNG VĂN) ============
  // 14.1 Vật tư chuyên ngành + dòng BOQ tương ứng
  const mats2 = [
    { code: "VL-CAPDIEN", name: "Cáp điện CV 3x2.5mm", unit: "m", standardPrice: 18500 },
    { code: "VL-ONGPVC", name: "Ống nhựa PVC D60", unit: "m", standardPrice: 32000 },
    { code: "VL-GACHMEN", name: "Gạch men 600x600", unit: "viên", standardPrice: 150000 },
    { code: "VL-SON", name: "Sơn chống thấm (18L)", unit: "thùng", standardPrice: 890000 },
  ];
  let newMat2 = 0, newBoq2 = 0;
  for (const m of mats2) {
    let mt = tableList("SELECT id FROM materials WHERE code='" + m.code + "' LIMIT 1");
    if (!mt.length) {
      r = await call("save_material", { ...m, system: "KHAC" });
      mt = tableList("SELECT id FROM materials WHERE code='" + m.code + "' LIMIT 1");
      if (r.status === 200 && mt.length) { newMat2++; record(`save_material ${m.code} (chuyên ngành)`, true, "HTTP 200"); }
      else FAIL(`save_material ${m.code} (chuyên ngành)`, r);
    }
    const bi = tableList("SELECT id FROM project_boq_items WHERE material_id='" + (mt[0]?.[0] || "") + "' AND boq_version_id='" + boqVersionId + "' LIMIT 1");
    if (mt.length && !bi.length) {
      r = await call("save_boq_item", {
        projectId, contractId: "", boqVersionId, materialId: mt[0][0],
        materialCode: m.code, materialName: m.name, unit: m.unit,
        contractQty: 300, unitPrice: m.standardPrice, itemType: "contract", rowRole: "material",
      });
      if (r.status === 200) { newBoq2++; record(`save_boq_item ${m.code} (chuyên ngành)`, true, "HTTP 200"); }
      else FAIL(`save_boq_item ${m.code} (chuyên ngành)`, r);
    }
  }
  record(`Bổ sung vật tư chuyên ngành (4 loại + BOQ)`, mats2.every((m) => tableList("SELECT id FROM materials WHERE code='" + m.code + "' LIMIT 1").length), `${newMat2} vật tư mới · ${newBoq2} dòng BOQ mới`);

  // 14.2 Hồ sơ nhân sự (upsert theo user_id — an toàn lặp lại)
  const hrDefs = [
    { username: "cha.ht", fullName: "Chỉ huy trưởng A", identityNo: "079901001234", identityDate: "2012-05-10", identityPlace: "Cục CSQL cư trú", birthDate: "1985-03-12", birthplace: "Thanh Hóa", permanentAddress: "Hà Nội", phone: "0901122334", educationLevel: "Kỹ sư xây dựng", joinedDate: "2015-06-01", position: "Chỉ huy trưởng" },
    { username: "trdademo", fullName: "Trưởng phòng Dự án C", identityNo: "079901002345", identityDate: "2013-08-20", identityPlace: "Cục CSQL cư trú", birthDate: "1988-11-05", birthplace: "Nghệ An", permanentAddress: "Hà Nội", phone: "0902233445", educationLevel: "Kỹ sư công trình", joinedDate: "2016-03-15", position: "Trưởng phòng Dự án" },
    { username: "tkhodemo", fullName: "Thủ kho G", identityNo: "079901003456", birthDate: "1992-07-21", birthplace: "Hải Dương", permanentAddress: "Hưng Yên", phone: "0903344556", educationLevel: "Cao đẳng nghiệp vụ kho vận", joinedDate: "2019-01-05", position: "Thủ kho" },
    { username: "kttdemo", fullName: "Kế toán trưởng H", identityNo: "079901004567", birthDate: "1983-02-14", birthplace: "Hà Nội", permanentAddress: "Hà Nội", phone: "0904455667", educationLevel: "Cử nhân Kế toán", joinedDate: "2014-09-01", position: "Kế toán trưởng" },
  ];
  let hrOk = 0;
  for (const h of hrDefs) {
    r = await call("save_hr_record", { userId: userIds[h.username], fullName: h.fullName, ...h, username: undefined });
    if (r.status === 200) { hrOk++; record(`save_hr_record ${h.username}`, true, String(r.json?.message || "").slice(0, 70)); }
    else FAIL(`save_hr_record ${h.username}`, r);
  }
  record(`Hồ sơ nhân sự (${hrDefs.length} người)`, hrOk === hrDefs.length, hrOk + "/" + hrDefs.length);

  const lcDefs = [
    { username: "cha.ht", contractType: "Hợp đồng xác định thời hạn", startDate: "2015-06-01", endDate: "2027-05-31", signingDate: "2015-05-20", salary: 18500000 },
    { username: "nvdademo", contractType: "Hợp đồng xác định thời hạn", startDate: "2018-08-01", endDate: "2026-07-31", signingDate: "2018-07-15", salary: 12000000 },
  ];
  let lcOk = 0;
  for (const l of lcDefs) {
    const ex = tableList("SELECT id FROM labor_contracts WHERE user_id='" + userIds[l.username] + "' LIMIT 1");
    if (ex.length) { lcOk++; record(`save_labor_contract ${l.username}`, true, "đã tồn tại"); continue; }
    r = await call("save_labor_contract", { userId: userIds[l.username], contractType: l.contractType, startDate: l.startDate, endDate: l.endDate, signingDate: l.signingDate, salary: l.salary });
    if (r.status === 200) { lcOk++; record(`save_labor_contract ${l.username}`, true, String(r.json?.message || "HĐLĐ").slice(0, 70)); }
    else FAIL(`save_labor_contract ${l.username}`, r);
  }
  record(`Hợp đồng lao động (${lcDefs.length})`, lcOk === lcDefs.length, lcOk + "/" + lcDefs.length);

  const benRow = tableList("SELECT id FROM benefit_records WHERE user_id='" + userIds["cha.ht"] + "' LIMIT 1");
  if (!benRow.length) {
    r = await call("save_benefit_record", { userId: userIds["cha.ht"], benefitType: "BHXH", provider: "BHXH tỉnh Hà Nội", startDate: "2015-07-01", endDate: "2026-12-31", monthlyAmount: 2450000, note: "Bảo hiểm bắt buộc" });
    record("save_benefit_record cha.ht (BHXH)", r.status === 200, String(r.json?.message || "").slice(0, 70));
  } else record("save_benefit_record cha.ht (BHXH)", true, "đã tồn tại");

  // 14.3 Tài chính: tài khoản NH + sổ quỹ + thanh toán HĐ + kế hoạch giải ngân
  const bk = tableList("SELECT id FROM bank_accounts WHERE code='VNTECH-BIDV' LIMIT 1");
  let bankId = bk[0]?.[0] || "";
  if (!bankId) {
    r = await call("save_bank_account", { code: "VNTECH-BIDV", bankName: "BIDV", accountNo: "1234567890", branch: "BIDV Hà Nội", currency: "VND", openingBalance: 5000000000 });
    if (r.status === 200) { bankId = tableList("SELECT id FROM bank_accounts WHERE code='VNTECH-BIDV' LIMIT 1")[0]?.[0] || ""; record("save_bank_account VNTECH-BIDV", r.status === 200, String(r.json?.message || "").slice(0, 70)); }
    else FAIL("save_bank_account VNTECH-BIDV", r);
  } else record("save_bank_account VNTECH-BIDV", true, "đã tồn tại");

  if (bankId) {
    const cbe = tableList("SELECT id FROM cashbook_entries WHERE reference_id='" + projectId + "' LIMIT 1");
    if (!cbe.length) {
      r = await call("save_cashbook_entry", { entryDate: "2026-02-15", accountId: bankId, entryType: "IN", amount: 2000000000, counterparty: "Chủ đầu tư", referenceType: "contract_payment", referenceId: projectId, note: "Thu đợt 1 theo HĐ" });
      const ok1 = r.status === 200;
      r = await call("save_cashbook_entry", { entryDate: "2026-03-10", accountId: bankId, entryType: "OUT", amount: 150000000, counterparty: "Tổng kho Vật tư Miền Nam", referenceType: "purchase", referenceId: projectId, note: "Chi mua vật tư giai đoạn 1" });
      record("save_cashbook_entry (Thu/Chi)", ok1 && r.status === 200, "IN + OUT");
    } else record("save_cashbook_entry (Thu/Chi)", true, "đã tồn tại");
  }

  const contractId0 = tableList("SELECT id FROM project_contracts WHERE project_id='" + projectId + "' LIMIT 1")[0]?.[0] || "";
  const poId0 = tableList("SELECT id FROM purchase_orders WHERE request_id='" + requestId + "' LIMIT 1")[0]?.[0] || "";
  const payDefs = [
    { referenceNo: "TT-HD-PRJ-DEMO-01-01", paymentDate: "2026-02-15", description: "Tạm ứng 20% giá trị hợp đồng", amount: 500000000 },
    { referenceNo: "TT-HD-PRJ-DEMO-01-02", paymentDate: "2026-06-30", description: "Thanh toán đợt 2 - nghiệm thu giai đoạn 1", amount: 1000000000 },
  ];
  let payOk = 0;
  for (const p of payDefs) {
    const ex = tableList("SELECT id FROM contract_payments WHERE reference_no='" + p.referenceNo + "' LIMIT 1");
    if (ex.length) { payOk++; record(`save_contract_payment ${p.referenceNo}`, true, "đã tồn tại"); continue; }
    r = await call("save_contract_payment", { projectId, paymentDate: p.paymentDate, referenceNo: p.referenceNo, description: p.description, amount: p.amount });
    if (r.status === 200) { payOk++; record(`save_contract_payment ${p.referenceNo}`, true, String(r.json?.message || "").slice(0, 60)); }
    else FAIL(`save_contract_payment ${p.referenceNo}`, r);
  }
  record(`Thanh toán HĐ (${payDefs.length} đợt)`, payOk === payDefs.length, payOk + "/" + payDefs.length);

  const planDefs = [
    { milestone: "Tạm ứng 20%", plannedDate: "2026-02-15", plannedAmount: 500000000 },
    { milestone: "Nghiệm thu giai đoạn 1", plannedDate: "2026-06-30", plannedAmount: 1000000000 },
    { milestone: "Quyết toán công trình", plannedDate: "2026-12-31", plannedAmount: 800000000 },
  ];
  let planOk = 0;
  const existingPlans = tableList("SELECT id FROM payment_plans WHERE project_id='" + projectId + "' AND plan_no LIKE 'PPL-PRJ-DEMO-01-%'");
  if (existingPlans.length >= planDefs.length) {
    for (const p of planDefs) { planOk++; record(`save_payment_plan (${p.milestone})`, true, "đã tồn tại"); }
  } else {
    for (const p of planDefs) {
      r = await call("save_payment_plan", { projectId, contractId: contractId0, poId: poId0, milestone: p.milestone, plannedDate: p.plannedDate, plannedAmount: p.plannedAmount });
      if (r.status === 200) { planOk++; record(`save_payment_plan (${p.milestone})`, true, String(r.json?.message || "").slice(0, 60)); }
      else FAIL(`save_payment_plan (${p.milestone})`, r);
    }
  }
  record(`Kế hoạch giải ngân (${planDefs.length} mốc)`, planOk === planDefs.length, planOk + "/" + planDefs.length);

  // 14.4 Nhật ký thi công (1 phiếu + duyệt)
  const dlRow = tableList("SELECT id FROM construction_daily_logs WHERE log_no LIKE 'CDL-PRJ-DEMO-01-%' LIMIT 1");
  if (!dlRow.length) {
    r = await call("save_construction_daily_log", {
      projectId, warehouseId: siteWarehouse?.id || "", workDate: "2026-09-10", shift: "sang", weather: "Nắng", 
      workContent: "Đổ bê tông móng trục A-C, thí nghiệm xi măng, lắp đặt ván khuôn", laborCount: 24,
      equipmentNote: "1 cẩu tháp, 2 máy trộn", note: "Seed demo", submit: true,
      items: [
        { itemName: "Đổ bê tông móng", boqItemId: boqItemIds["VL-XIMANG"] || "", location: "Khu A", plannedQty: 40, completedQty: 36, unit: "m3", laborHours: 16 },
        { itemName: "Gia công cốt thép", boqItemId: boqItemIds["VL-SAT02"] || "", location: "Khu A", plannedQty: 30, completedQty: 25, unit: "cây", laborHours: 8 },
      ],
    });
    if (r.status === 200) {
      const dl1 = tableList("SELECT id FROM construction_daily_logs WHERE log_no LIKE 'CDL-PRJ-DEMO-01-%' ORDER BY created_at DESC LIMIT 1");
      record("save_construction_daily_log (nhật ký)", true, dl1[0]?.[1] ? "" : String(r.json?.message || "").slice(0, 70));
      if (dl1.length) {
        r = await call("approve_construction_daily_log", { logId: dl1[0][0] });
        record("approve_construction_daily_log", r.status === 200, String(r.json?.message || "").slice(0, 80));
      }
    } else FAIL("save_construction_daily_log", r);
  } else record("save_construction_daily_log (nhật ký)", true, "đã tồn tại");

  // 14.5 Công văn (pháp chế)
  const corrRow = tableList("SELECT id FROM official_correspondence WHERE doc_no='CV-2026-001' LIMIT 1");
  if (!corrRow.length) {
    r = await call("save_correspondence", { direction: "IN", docType: "Công văn chỉ đạo", docNo: "CV-2026-001", issueDate: "2026-03-05", senderName: "Ban QLDA VNTECH", summary: "Chỉ đạo đẩy nhanh tiến độ giai đoạn 1; yêu cầu báo cáo tuần." });
    if (r.status === 200) record("save_correspondence CV-2026-001", true, String(r.json?.message || "").slice(0, 70));
    else FAIL("save_correspondence CV-2026-001", r);
  } else record("save_correspondence CV-2026-001", true, "đã tồn tại");

  // ============ 15. TỔNG KẾT ============
  const pass = results.filter((x) => x.ok).length;
  const fail = results.length - pass;
  console.log(`\n===== SEED DEMO: ${pass}/${results.length} PASS · ${fail} FAIL =====`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => { console.error("UNCAUGHT:", e); process.exit(1); });