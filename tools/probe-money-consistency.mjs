#!/usr/bin/env node
// VNTECH ERP V5.3.0 — CỔNG ĐỐI CHIẾU SỐ TIỀN: GIAO DIỆN (payload) ↔ CSDL (SQL thật)
//
// VÌ SAO CÓ CỔNG NÀY: đợt 2E phát hiện **payload `boqItems` trả MỖI DÒNG BOQ HAI LẦN** ⇒ màn Thanh toán
// hiển thị **giá trị hợp đồng GẤP ĐÔI** (1.346.500.000 thay vì 673.250.000). Lớp lỗi đó chỉ lộ ra khi
// đem con số của GIAO DIỆN so với con số của CSDL — vì vậy cổng này so đúng như vậy, cho MỌI nguồn tiền
// chính mà giao diện tự tính.
//
// Cách chạy:  node tools/probe-money-consistency.mjs
//
// NGUYÊN TẮC ĐO: mỗi phép kiểm in ra HAI con số (UI và CSDL) để người đọc tự thấy căn cứ, không chỉ
// "ĐẠT/HỎNG" suông. Chênh lệch cho phép ≤ 0,01 đ (làm tròn số thực).

import { execFileSync } from "node:child_process";

const BASE = process.env.PROBE_BASE || "http://127.0.0.1:9000";
const ADMIN_USER = process.env.PROBE_ADMIN_USER || "admin";
const ADMIN_PASS = process.env.PROBE_ADMIN_PASS || "Admin123456@";
const MYSQL = process.env.MYSQL_BIN || "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";

let pass = 0;
let fail = 0;
let gap = 0;
const kq = [];
function check(ten, ok, chiTiet) {
  if (ok) { pass++; kq.push(`  [DAT ] ${ten}${chiTiet ? " :: " + chiTiet : ""}`); }
  else { fail++; kq.push(`  [HONG] ${ten}${chiTiet ? " :: " + chiTiet : ""}`); }
}
function ghiNhan(ten, chiTiet) { gap++; kq.push(`  [GHI NHẬN] ${ten}${chiTiet ? " :: " + chiTiet : ""}`); }

/** Chạy một câu SELECT trên MySQL và trả về mảng dòng (mỗi dòng là mảng giá trị). */
function sql(cau) {
  const out = execFileSync(
    MYSQL,
    ["--default-character-set=utf8mb4", "-uvntech", "-pvntech", "vntech_erp", "-N", "-B", "-e", cau],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
  );
  return out.split(/\r?\n/).filter((l) => l.trim() !== "").map((l) => l.split("\t"));
}
const num = (v) => Number(v || 0);
const gan = (a, b, eps = 0.01) => Math.abs(num(a) - num(b)) <= eps;
const tien = (v) => num(v).toLocaleString("vi-VN");

async function login(username, password) {
  const res = await fetch(`${BASE}/api/system`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "login", username, password }),
    redirect: "manual",
  });
  const jar = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  return { status: res.status, cookie: jar.length ? jar.map((c) => c.split(";")[0]).join("; ") : "" };
}
async function snapshot(cookie) {
  const res = await fetch(`${BASE}/api/system`, { headers: { Cookie: cookie }, cache: "no-store" });
  const body = await res.json();
  return body.data || body;
}

async function main() {
  console.log(`=== CỔNG ĐỐI CHIẾU SỐ TIỀN (UI ↔ CSDL) — ${BASE} ===\n`);

  const adm = await login(ADMIN_USER, ADMIN_PASS);
  check("Đăng nhập admin", adm.status === 200 && adm.cookie.length > 0, `HTTP ${adm.status}`);
  if (!adm.cookie) { console.log(kq.join("\n")); process.exitCode = 1; return; }
  const d = await snapshot(adm.cookie);
  const projects = Array.isArray(d.projects) ? d.projects : [];
  check("Payload có danh sách dự án", projects.length > 0, `${projects.length} dự án`);

  // ─────────────── 1. BOQ: số dòng + giá trị hợp đồng ───────────────
  let soDuAnCoBoq = 0;
  let tongUi = 0;
  let tongSql = 0;
  let dongTrung = 0;
  for (const p of projects) {
    const pid = String(p.id);
    const boqUi = (Array.isArray(d.boqItems) ? d.boqItems : []).filter((b) => String(b.projectId) === pid);
    if (!boqUi.length) continue;
    soDuAnCoBoq++;
    dongTrung += boqUi.filter((b) => !String(b.materialCode || "").trim()).length;
    const uiVal = boqUi.reduce((s, b) => s + num(b.contractQty) * num(b.unitPrice), 0);
    const row = sql(`SELECT COUNT(*), COALESCE(SUM(contract_qty*unit_price),0) FROM project_boq_items WHERE project_id='${pid}'`)[0] || ["0", "0"];
    const sqlVal = num(row[1]);
    const sqlCount = num(row[0]);
    tongUi += uiVal;
    tongSql += sqlVal;
    check(
      `BOQ ${p.code}: SỐ DÒNG khớp (UI ↔ CSDL)`,
      boqUi.length === sqlCount,
      `UI ${boqUi.length} ↔ CSDL ${sqlCount}`
    );
    check(
      `BOQ ${p.code}: GIÁ TRỊ HỢP ĐỒNG khớp`,
      gan(uiVal, sqlVal),
      `UI ${tien(uiVal)} ↔ CSDL ${tien(sqlVal)}`
    );
  }
  check("Có ít nhất 1 dự án có dòng BOQ để đối chiếu (chống khẳng định rỗng)", soDuAnCoBoq > 0, `${soDuAnCoBoq} dự án`);
  check(
    "[tự kiểm soát] KHÔNG có dòng BOQ trùng/rỗng vật tư trên TOÀN BỘ dự án (chống đếm trùng)",
    dongTrung === 0,
    `${dongTrung} dòng thiếu mã vật tư · tổng UI ${tien(tongUi)} ↔ tổng CSDL ${tien(tongSql)}`
  );

  // ─────────────── 2. PO: giá trị đặt hàng ───────────────
  const poUi = Array.isArray(d.purchaseOrders) ? d.purchaseOrders : [];
  const poUiVal = poUi.reduce((s, po) => s + num(po.totalValue), 0);
  const poSqlVal = num((sql("SELECT COALESCE(SUM(total_value),0) FROM purchase_orders")[0] || ["0"])[0]);
  check("PO: tổng giá trị đặt hàng khớp (UI ↔ CSDL)", gan(poUiVal, poSqlVal), `UI ${tien(poUiVal)} ↔ CSDL ${tien(poSqlVal)}`);
  const poItemSqlVal = num((sql("SELECT COALESCE(SUM(ordered_qty*unit_price),0) FROM purchase_order_items")[0] || ["0"])[0]);
  if (poItemSqlVal === 0) {
    ghiNhan(
      "ĐƠN GIÁ PO = 0 trên TOÀN BỘ dòng ⇒ mọi số tiền suy từ PO đều bằng 0",
      `Σ(ordered_qty×unit_price) = 0 — xem MASTER_STATUS KP #82, cần người dùng quyết định`
    );
  }

  // ─────────────── 3. Thanh toán hợp đồng ───────────────
  const cpUi = (Array.isArray(d.contractPayments) ? d.contractPayments : []).reduce((s, r) => s + num(r.amount), 0);
  const cpSql = num((sql("SELECT COALESCE(SUM(amount),0) FROM contract_payments")[0] || ["0"])[0]);
  check("Thanh toán hợp đồng: tổng tiền khớp", gan(cpUi, cpSql), `UI ${tien(cpUi)} ↔ CSDL ${tien(cpSql)}`);

  // Bất biến NGHIỆP VỤ (không phải lỗi mã): tiền thực thu không nên VƯỢT giá trị hợp đồng của dự án.
  // Đây là việc ĐỐI CHIẾU DỮ LIỆU — cổng chỉ BÁO CÁO, KHÔNG tự sửa (quyết định tài chính của người dùng).
  for (const p of projects) {
    const pid = String(p.id);
    const cp = (Array.isArray(d.contractPayments) ? d.contractPayments : [])
      .filter((r) => String(r.projectId) === pid)
      .reduce((s, r) => s + num(r.amount), 0);
    const boqVal = (Array.isArray(d.boqItems) ? d.boqItems : [])
      .filter((b) => String(b.projectId) === pid)
      .reduce((s, b) => s + num(b.contractQty) * num(b.unitPrice), 0);
    if (boqVal > 0 && cp > boqVal + 0.01) {
      ghiNhan(
        `${p.code}: tiền thực thu/thanh toán VƯỢT giá trị hợp đồng — cần đối chiếu dữ liệu (KHÔNG tự sửa)`,
        `đã thu ${tien(cp)} > hợp đồng ${tien(boqVal)} (${(cp / boqVal * 100).toFixed(0)}%)`
      );
    }
  }

  // ─────────────── 4. Báo cáo sản lượng ───────────────
  const prUi = Array.isArray(d.productionReports) ? d.productionReports : [];
  const prSql = sql("SELECT COUNT(*), COALESCE(SUM(planned_value),0), COALESCE(SUM(actual_value),0), COALESCE(SUM(approved_value),0) FROM production_reports")[0] || ["0", "0", "0", "0"];
  check("Báo cáo sản lượng: SỐ DÒNG khớp", prUi.length === num(prSql[0]), `UI ${prUi.length} ↔ CSDL ${prSql[0]}`);
  check(
    "Báo cáo sản lượng: Σ giá trị ĐÃ DUYỆT khớp",
    gan(prUi.reduce((s, r) => s + num(r.approvedValue), 0), prSql[3]),
    `UI ${tien(prUi.reduce((s, r) => s + num(r.approvedValue), 0))} ↔ CSDL ${tien(prSql[3])}`
  );
  check(
    "Báo cáo sản lượng: Σ giá trị THỰC TẾ khớp",
    gan(prUi.reduce((s, r) => s + num(r.actualValue), 0), prSql[2]),
    `UI ${tien(prUi.reduce((s, r) => s + num(r.actualValue), 0))} ↔ CSDL ${tien(prSql[2])}`
  );

  // ─────────────── 5. Thu hồi vốn ───────────────
  const crUi = Array.isArray(d.capitalRecoveryRecords) ? d.capitalRecoveryRecords : [];
  const crSql = sql("SELECT COUNT(*), COALESCE(SUM(submitted_value),0), COALESCE(SUM(approved_value),0), COALESCE(SUM(invoice_value),0) FROM capital_recovery_records")[0] || ["0", "0", "0", "0"];
  check("Hồ sơ thu hồi vốn: SỐ DÒNG khớp", crUi.length === num(crSql[0]), `UI ${crUi.length} ↔ CSDL ${crSql[0]}`);
  check(
    "Hồ sơ thu hồi vốn: Σ giá trị ĐƯỢC DUYỆT khớp",
    gan(crUi.reduce((s, r) => s + num(r.approvedValue), 0), crSql[2]),
    `UI ${tien(crUi.reduce((s, r) => s + num(r.approvedValue), 0))} ↔ CSDL ${tien(crSql[2])}`
  );
  // Bất biến nghiệp vụ: tiền thực thu liên kết không được vượt giá trị đã duyệt của hồ sơ
  const vuot = crUi.filter((r) => num(r.cashReceived) > num(r.approvedValue) + 0.01);
  check("[tự kiểm soát] không hồ sơ nào có tiền thực thu VƯỢT giá trị được duyệt", vuot.length === 0, `${vuot.length} hồ sơ vượt`);

  // ─────────────── 6. Tồn kho theo giá (nếu có giá) ───────────────
  const inv = Array.isArray(d.inventory) ? d.inventory : [];
  const invCoGia = inv.filter((r) => num(r.unitPrice ?? r.price ?? 0) > 0).length;
  if (inv.length > 0 && invCoGia === 0) {
    ghiNhan("Tồn kho: KHÔNG dòng nào có đơn giá ⇒ giá trị tồn theo giá luôn 0", `${inv.length} dòng tồn, 0 dòng có giá (cùng gốc với KP #82)`);
  } else if (inv.length > 0) {
    check("Tồn kho: có dòng mang đơn giá thật", invCoGia > 0, `${invCoGia}/${inv.length} dòng có giá`);
  }

  console.log(kq.join("\n"));
  console.log(`\n=== KẾT QUẢ: ${pass}/${pass + fail} ĐẠT · ${fail} HỎNG · ${gap} GHI NHẬN ===`);
  process.exitCode = fail === 0 ? 0 : 1;
}

main().catch((e) => {
  console.error("PROBE LOI:", e && e.message ? e.message : e);
  process.exitCode = 2;
});
