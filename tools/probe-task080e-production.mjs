#!/usr/bin/env node
// VNTECH ERP V5.3.0 — CỔNG TASK-080E: BÁO CÁO SẢN LƯỢNG + THU HỒI VỐN bằng action THẬT
//
// Vì sao: hai bảng `production_reports` và `capital_recovery_records` đang RỖNG. Hai bảng này là
// CHỨNG TỪ TÀI CHÍNH nên TUYỆT ĐỐI không được nhét tay — cổng này dùng ĐÚNG đường thật:
//   `save_production_report` → `approve_production_report` → `save_capital_recovery`.
//
// NGUỒN SỐ LIỆU (100% dữ liệu thật, KHÔNG hằng số):
//   · Giá trị kế hoạch  = Σ (project_boq_items.contract_qty × unit_price) của dự án — đơn giá HỢP ĐỒNG.
//   · Giá trị thực tế   = Σ (khối lượng ĐÃ NHẬN theo từng mã vật tư × đơn giá HỢP ĐỒNG của vật tư đó).
//     (Khối lượng nhận lấy từ chính payload `receipts[].items[].actualQty`; đơn giá lấy từ `boqItems`.)
//     ⚠️ Vì sao KHÔNG lấy đơn giá từ PO: đo được **cả 13 dòng `purchase_order_items.unit_price` = 0**
//     ⇒ `purchase_orders.total_value` = 0 với cả 7 PO. Đây là lỗ hổng dữ liệu đã ghi thành Known Problem;
//     dùng đơn giá hợp đồng là cơ sở kế toán đúng cho "giá trị sản lượng nghiệm thu".
//
// Cách chạy:  node tools/probe-task080e-production.mjs
// Ghi chú: dùng phiên ADMIN vì các action này đòi `canCreate` của module `production`/`capital_recovery`,
// mà KHÔNG phòng ban nào hiện có `can_create=1` ở hai module đó (đã đo; ghi thành câu hỏi cho người dùng).
// Cổng cũng ĐO LẠI hành vi của một Trưởng phòng để làm bằng chứng cho khoảng trống đó (chỉ ghi nhận).

const BASE = process.env.PROBE_BASE || "http://127.0.0.1:9000";
const ADMIN_USER = process.env.PROBE_ADMIN_USER || "admin";
const ADMIN_PASS = process.env.PROBE_ADMIN_PASS || "Admin123456@";
const MGR_USER = process.env.PROBE_MGR_USER || "trdademo";
const MGR_PASS = process.env.PROBE_MGR_PASS || "Vntech@2026";
const PROJECT_CODE = process.env.PROBE_PROJECT || "PRJ-DEMO-01";
const KY = process.env.PROBE_PERIOD || "2026-09";
const KY_CHO_DUYET = process.env.PROBE_PERIOD_PENDING || "2026-08";

let pass = 0;
let fail = 0;
let gap = 0;
const kq = [];
function check(ten, ok, chiTiet) {
  if (ok) {
    pass++;
    kq.push(`  [DAT ] ${ten}${chiTiet ? " :: " + chiTiet : ""}`);
  } else {
    fail++;
    kq.push(`  [HONG] ${ten}${chiTiet ? " :: " + chiTiet : ""}`);
  }
}
function ghiNhan(ten, chiTiet) {
  gap++;
  kq.push(`  [GHI NHẬN] ${ten}${chiTiet ? " :: " + chiTiet : ""}`);
}

async function login(username, password) {
  const res = await fetch(`${BASE}/api/system`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "login", username, password }),
    redirect: "manual",
  });
  const jar = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  return {
    status: res.status,
    cookie: jar.length ? jar.map((c) => c.split(";")[0]).join("; ") : String(res.headers.get("set-cookie") || "").split(";")[0],
  };
}
async function call(cookie, body) {
  const res = await fetch(`${BASE}/api/system`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify(body),
  });
  let json = null;
  try { json = await res.json(); } catch { json = null; }
  return { status: res.status, json };
}
async function snapshot(cookie) {
  const res = await fetch(`${BASE}/api/system`, { headers: { Cookie: cookie }, cache: "no-store" });
  const body = await res.json();
  return body.data || body;
}
const num = (v) => Number(v || 0);

/** Σ khối lượng ĐÃ NHẬN theo mã vật tư (từ `receipts[].items[]` của payload). */
function khoiLuongTheoMaVatTu(receipts) {
  const map = new Map();
  for (const r of receipts) {
    for (const it of r.items || []) {
      const code = String(it.materialCode || "");
      if (!code) continue;
      map.set(code, (map.get(code) || 0) + num(it.actualQty));
    }
  }
  return map;
}

async function main() {
  console.log(`=== PROBE TASK-080E (sản lượng + thu hồi vốn) — ${BASE} · dự án ${PROJECT_CODE} · kỳ ${KY} ===\n`);

  const adm = await login(ADMIN_USER, ADMIN_PASS);
  check(`Đăng nhập admin HTTP 200`, adm.status === 200, `HTTP ${adm.status}`);
  if (!adm.cookie) { console.log(kq.join("\n")); console.log("\nKHÔNG CÓ PHIÊN — dừng."); process.exitCode = 1; return; }

  const d = await snapshot(adm.cookie);
  const duAn = (Array.isArray(d.projects) ? d.projects : []).find((p) => String(p.code) === PROJECT_CODE);
  check(`Tìm thấy dự án thật ${PROJECT_CODE}`, Boolean(duAn), duAn ? String(duAn.id) : "(khong thay)");
  if (!duAn) { console.log(kq.join("\n")); process.exitCode = 1; return; }
  const projectId = String(duAn.id);

  // ---- 1. Tính giá trị kế hoạch / thực tế TỪ DỮ LIỆU THẬT ----
  const boq = (Array.isArray(d.boqItems) ? d.boqItems : []).filter(
    (b) => String(b.projectId) === projectId && String(b.itemType || "contract") !== "outside_contract" && String(b.rowRole || "material") !== "section"
  );
  // ⚠️ TỰ KIỂM SOÁT CHỐNG ĐẾM TRÙNG (bài học TASK-080E): payload từng trả MỖI DÒNG BOQ HAI LẦN
  // (bản sao có `materialCode` rỗng) vì `boq_source_items.project_boq_item_id` để NULL ⇒ khối "dòng
  // nguồn chưa ánh xạ" bị gộp thêm lần nữa ⇒ màn Thanh toán hiện giá trị hợp đồng GẤP ĐÔI.
  const dongTrung = boq.filter((b) => !String(b.materialCode || "").trim());
  check(
    "payload boqItems KHÔNG có dòng trùng/rỗng vật tư (chống tái phát lỗi đếm trùng)",
    boq.length > 0 && dongTrung.length === 0,
    `${boq.length} dòng · ${dongTrung.length} dòng thiếu mã vật tư`
  );
  const plannedValue = boq.reduce((s, b) => s + num(b.contractQty) * num(b.unitPrice), 0);
  const nhanTheoMa = khoiLuongTheoMaVatTu(Array.isArray(d.receipts) ? d.receipts.filter((r) => String(r.projectId) === projectId) : []);
  const dongTheoMa = new Map(boq.map((b) => [String(b.materialCode), b]));
  let actualValue = 0;
  const chiTiet = [];
  for (const [code, qty] of nhanTheoMa) {
    const line = dongTheoMa.get(code);
    if (!line || qty <= 0) continue;
    const kl = Math.min(qty, num(line.contractQty) || qty);
    actualValue += kl * num(line.unitPrice);
    chiTiet.push(`${code}: ${kl}/${num(line.contractQty)} × ${num(line.unitPrice)}`);
  }
  check("Tính được giá trị KẾ HOẠCH từ BOQ thật (đơn giá hợp đồng)", plannedValue > 0, `${plannedValue.toLocaleString("vi-VN")} đ · ${boq.length} dòng BOQ`);
  check("Tính được giá trị THỰC TẾ từ khối lượng đã nhận × đơn giá hợp đồng", actualValue > 0, `${actualValue.toLocaleString("vi-VN")} đ · ${chiTiet.length} vật tư (${chiTiet.join(" | ")})`);
  check("Giá trị thực tế KHÔNG vượt giá trị kế hoạch (bất biến dữ liệu)", actualValue <= plannedValue, `thực tế ${actualValue.toLocaleString("vi-VN")} ≤ kế hoạch ${plannedValue.toLocaleString("vi-VN")}`);

  // ---- 2. Tạo báo cáo sản lượng kỳ KY (bỏ qua nếu đã có ⇒ chạy lại an toàn) ----
  const reports = Array.isArray(d.productionReports) ? d.productionReports.filter((r) => String(r.projectId) === projectId) : [];
  let bc = reports.find((r) => String(r.reportPeriod) === KY);
  if (bc && (num(bc.plannedValue) !== plannedValue || num(bc.actualValue) !== actualValue)) {
    // Báo cáo đã có nhưng giá trị khác căn cứ hiện tại (ví dụ lượt chạy trước bị ảnh hưởng bởi lỗi
    // ĐẾM TRÙNG BOQ) ⇒ SỬA bằng chính action thật, không sửa tay trong CSDL.
    const r = await call(adm.cookie, {
      action: "save_production_report",
      productionReportId: bc.id,
      projectId,
      reportPeriod: KY,
      referenceNo: `SL-${PROJECT_CODE}-${KY}`,
      description: `Báo cáo sản lượng kỳ ${KY} — giá trị theo khối lượng nghiệm thu nhập kho × đơn giá hợp đồng (đã sửa lại sau khi vá lỗi đếm trùng BOQ)`,
      plannedValue,
      actualValue,
    });
    check(
      `Sửa lại giá trị báo cáo kỳ ${KY} cho khớp căn cứ thật`,
      r.status === 200,
      `cũ KH=${num(bc.plannedValue).toLocaleString("vi-VN")} → mới ${plannedValue.toLocaleString("vi-VN")} · HTTP ${r.status}`
    );
  }
  if (bc) {
    kq.push(`  [BO QUA] kỳ ${KY} đã có báo cáo ${bc.id} (status=${bc.status})`);
  } else {
    const r = await call(adm.cookie, {
      action: "save_production_report",
      projectId,
      reportPeriod: KY,
      referenceNo: `SL-${PROJECT_CODE}-${KY}`,
      description: `Báo cáo sản lượng kỳ ${KY} — giá trị theo khối lượng nghiệm thu nhập kho × đơn giá hợp đồng`,
      plannedValue,
      actualValue,
    });
    const ok = r.status === 200;
    check(`Tạo báo cáo sản lượng kỳ ${KY}`, ok, ok ? JSON.stringify(r.json).slice(0, 120) : `HTTP ${r.status} · ${JSON.stringify(r.json).slice(0, 170)}`);
    if (!ok) { console.log(kq.join("\n")); console.log(`\n=== KẾT QUẢ: ${pass}/${pass + fail} ĐẠT · ${fail} HỎNG ===`); process.exitCode = 1; return; }
  }

  const d2 = await snapshot(adm.cookie);
  bc = (d2.productionReports || []).find((r) => String(r.projectId) === projectId && String(r.reportPeriod) === KY);
  check(`Payload có báo cáo kỳ ${KY}`, Boolean(bc), bc ? `id=${bc.id} · status=${bc.status}` : "(khong thay)");
  if (!bc) { console.log(kq.join("\n")); process.exitCode = 1; return; }
  check("Báo cáo giữ ĐÚNG giá trị kế hoạch/thực tế đã gửi", num(bc.plannedValue) === plannedValue && num(bc.actualValue) === actualValue,
    `KH=${num(bc.plannedValue).toLocaleString("vi-VN")} · TT=${num(bc.actualValue).toLocaleString("vi-VN")}`);

  // ---- 3. Duyệt báo cáo (approvedValue = actualValue) ----
  if (String(bc.status) !== "approved") {
    const r = await call(adm.cookie, { action: "approve_production_report", productionReportId: bc.id, approvedValue: actualValue });
    const ok = r.status === 200;
    check("Duyệt báo cáo sản lượng", ok, ok ? JSON.stringify(r.json).slice(0, 120) : `HTTP ${r.status} · ${JSON.stringify(r.json).slice(0, 170)}`);
  } else {
    kq.push("  [BO QUA] báo cáo đã ở trạng thái approved");
  }
  const d3 = await snapshot(adm.cookie);
  bc = (d3.productionReports || []).find((r) => String(r.id) === String(bc.id));
  check("Báo cáo chuyển sang `approved` và ghi giá trị được duyệt", String(bc.status) === "approved" && num(bc.approvedValue) === actualValue,
    `status=${bc.status} · approved=${num(bc.approvedValue).toLocaleString("vi-VN")} · người duyệt=${bc.approvedByName || "?"}`);

  // ---- 4. Tạo hồ sơ THU HỒI VỐN liên kết báo cáo ĐÃ DUYỆT ----
  const recs = Array.isArray(d3.capitalRecoveryRecords) ? d3.capitalRecoveryRecords.filter((r) => String(r.projectId) === projectId) : [];
  let rec = recs.find((r) => String(r.periodKey) === KY);
  if (rec) {
    kq.push(`  [BO QUA] kỳ ${KY} đã có hồ sơ thu hồi vốn ${rec.id} (status=${rec.status})`);
  } else {
    const r = await call(adm.cookie, {
      action: "save_capital_recovery",
      projectId,
      periodKey: KY,
      referenceNo: `THV-${PROJECT_CODE}-${KY}`,
      productionReportId: bc.id,
      submittedValue: num(bc.approvedValue),
      approvedValue: num(bc.approvedValue),
      invoiceValue: 0,
      note: "Hồ sơ thu hồi vốn kỳ " + KY + " — liên kết báo cáo sản lượng đã phê duyệt",
    });
    const ok = r.status === 200;
    check(`Tạo hồ sơ thu hồi vốn kỳ ${KY} (liên kết báo cáo đã duyệt)`, ok, ok ? JSON.stringify(r.json).slice(0, 140) : `HTTP ${r.status} · ${JSON.stringify(r.json).slice(0, 170)}`);
  }
  const d4 = await snapshot(adm.cookie);
  rec = (d4.capitalRecoveryRecords || []).find((r) => String(r.projectId) === projectId && String(r.periodKey) === KY);
  check(`Payload có hồ sơ thu hồi vốn kỳ ${KY}`, Boolean(rec), rec ? `id=${rec.id} · status=${rec.status}` : "(khong thay)");
  if (rec) {
    check("Hồ sơ liên kết ĐÚNG báo cáo sản lượng đã duyệt", String(rec.productionReportId) === String(bc.id),
      `productionReportId=${rec.productionReportId} · giá trị báo cáo=${num(rec.productionApprovedValue).toLocaleString("vi-VN")}`);
    check("Trạng thái hồ sơ suy đúng luật JS (approved khi chưa có hóa đơn)", String(rec.status) === "approved", `status=${rec.status}`);
    check("Giá trị trình = giá trị duyệt = giá trị báo cáo đã duyệt", num(rec.submittedValue) === num(bc.approvedValue) && num(rec.approvedValue) === num(bc.approvedValue),
      `trình=${num(rec.submittedValue).toLocaleString("vi-VN")} · duyệt=${num(rec.approvedValue).toLocaleString("vi-VN")}`);
    check("Tiền thực thu liên kết = 0 (chưa ghi nhận thanh toán)", num(rec.cashReceived) === 0, `cashReceived=${num(rec.cashReceived)}`);
  }

  // ---- 5. TỰ KIỂM SOÁT ----
  const dup = await call(adm.cookie, { action: "save_production_report", projectId, reportPeriod: KY, plannedValue: 1, actualValue: 1 });
  check("[tự kiểm soát] trùng kỳ báo cáo PHẢI bị từ chối", /đã có báo cáo sản lượng/i.test(JSON.stringify(dup.json || {})), JSON.stringify(dup.json || {}).slice(0, 160));

  const vuot = await call(adm.cookie, { action: "approve_production_report", productionReportId: bc.id, approvedValue: num(bc.actualValue) + 1000000 });
  check("[tự kiểm soát] duyệt VƯỢT sản lượng thực tế PHẢI bị từ chối", /không được vượt/i.test(JSON.stringify(vuot.json || {})), JSON.stringify(vuot.json || {}).slice(0, 160));

  // Báo cáo kỳ "chờ duyệt" để kiểm luật: chỉ được liên kết báo cáo ĐÃ DUYỆT
  let bcCho = (d4.productionReports || []).find((r) => String(r.projectId) === projectId && String(r.reportPeriod) === KY_CHO_DUYET);
  if (!bcCho) {
    const r = await call(adm.cookie, { action: "save_production_report", projectId, reportPeriod: KY_CHO_DUYET, plannedValue, actualValue: 0, description: "Báo cáo kỳ " + KY_CHO_DUYET + " đang chờ duyệt (dùng để kiểm luật liên kết)" });
    if (r.status === 200) {
      const d5 = await snapshot(adm.cookie);
      bcCho = (d5.productionReports || []).find((x) => String(x.projectId) === projectId && String(x.reportPeriod) === KY_CHO_DUYET);
    }
  }
  if (bcCho) {
    // Báo cáo chờ duyệt cũng phải khớp căn cứ thật (lượt tạo nó có thể đã bị ảnh hưởng bởi lỗi đếm trùng BOQ).
    if (num(bcCho.plannedValue) !== plannedValue) {
      const rc2 = await call(adm.cookie, {
        action: "save_production_report",
        productionReportId: bcCho.id,
        projectId,
        reportPeriod: KY_CHO_DUYET,
        plannedValue,
        actualValue: 0,
        description: `Báo cáo kỳ ${KY_CHO_DUYET} đang chờ duyệt (đã sửa giá trị kế hoạch cho khớp BOQ thật)`,
      });
      check("Sửa giá trị kế hoạch của báo cáo CHỜ DUYỆT cho khớp căn cứ thật", rc2.status === 200,
        `cũ ${num(bcCho.plannedValue).toLocaleString("vi-VN")} → mới ${plannedValue.toLocaleString("vi-VN")} · HTTP ${rc2.status}`);
      bcCho = { ...bcCho, plannedValue };
    }
    const lienKetSai = await call(adm.cookie, {
      action: "save_capital_recovery", projectId, periodKey: KY_CHO_DUYET, productionReportId: bcCho.id,
      submittedValue: 1000000, approvedValue: 1000000, invoiceValue: 0,
    });
    check("[tự kiểm soát] liên kết báo cáo CHƯA duyệt PHẢI bị từ chối", /chưa phê duyệt|đã phê duyệt/i.test(JSON.stringify(lienKetSai.json || {})), JSON.stringify(lienKetSai.json || {}).slice(0, 170));
    check("báo cáo chờ duyệt tồn tại THẬT (kỳ " + KY_CHO_DUYET + ", status=submitted)", String(bcCho.status) === "submitted", `status=${bcCho.status}`);
  }

  // ---- 6. GHI NHẬN: Trưởng phòng hiện KHÔNG tạo được (thiếu can_create của module) ----
  const mgr = await login(MGR_USER, MGR_PASS);
  const mgrCall = await call(mgr.cookie, { action: "save_production_report", projectId, reportPeriod: "2026-07", plannedValue: 1, actualValue: 1 });
  if (mgrCall.status !== 200) {
    ghiNhan(
      `Trưởng phòng Dự án (${MGR_USER}) KHÔNG tạo được báo cáo sản lượng`,
      `HTTP ${mgrCall.status} · ${JSON.stringify(mgrCall.json).slice(0, 120)} — nguyên nhân: module permission \`production\` của mọi phòng đang có can_create=0 ⇒ cần người dùng quyết định cấp`
    );
  } else {
    check(`Trưởng phòng Dự án (${MGR_USER}) tạo được báo cáo sản lượng`, true, "HTTP 200");
  }

  console.log(kq.join("\n"));
  console.log(`\n=== KẾT QUẢ: ${pass}/${pass + fail} ĐẠT · ${fail} HỎNG · ${gap} GHI NHẬN ===`);
  process.exitCode = fail === 0 ? 0 : 1;
}

main().catch((e) => {
  console.error("PROBE LOI:", e && e.message ? e.message : e);
  process.exitCode = 2;
});
