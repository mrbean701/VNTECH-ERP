#!/usr/bin/env node
// VNTECH ERP V5.3.0 — CỔNG CHỐNG NHÂN DÒNG: payload KHÔNG được trả NHIỀU DÒNG HƠN CSDL
//
// VÌ SAO: đợt 2E phát hiện `boqItems` trả **16 dòng** trong khi CSDL chỉ có **8** ⇒ màn Thanh toán hiện
// **giá trị hợp đồng GẤP ĐÔI**. Đó là biểu hiện của một LỚP LỖI: đường ĐỌC nhân dòng (thường do JOIN/gộp
// sai). Lớp lỗi này KHÔNG bị bắt bởi cổng kiểu, cổng khoá, cổng TẬP CỘT hay cổng ảnh.
//
// BẤT BIẾN ĐƯỢC KIỂM: với mỗi khoá danh sách theo dự án,
//     số DÒNG payload (cho dự án đó)  ≤  số DÒNG trong CSDL (cho dự án đó)
// Payload ĐƯỢC PHÉP ít hơn (do lọc theo quyền/phạm vi/nghiệp vụ) nhưng **KHÔNG ĐƯỢC nhiều hơn** —
// nhiều hơn nghĩa là nhân dòng hoặc gộp sai.
//
// Cách chạy:  node tools/probe-row-duplication.mjs
// Ghi chú: đo bằng phiên ADMIN để loại yếu tố "bị lọc theo quyền" khỏi kết luận.

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

function sql(cau) {
  const out = execFileSync(
    MYSQL,
    ["--default-character-set=utf8mb4", "-uvntech", "-pvntech", "vntech_erp", "-N", "-B", "-e", cau],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
  );
  return out.split(/\r?\n/).filter((l) => l.trim() !== "").map((l) => l.split("\t"));
}
const num = (v) => Number(v || 0);

/**
 * Mỗi mục: khoá payload ↔ câu SQL đếm theo dự án.
 * `{P}` được thay bằng id dự án. Câu SQL PHẢI trả về đúng 1 dòng 1 cột (số dòng).
 */
const SPEC = [
  { key: "boqItems", nhan: "BOQ", table: "project_boq_items", sqlD: "SELECT COUNT(*) FROM project_boq_items WHERE project_id='{P}'" },
  { key: "purchaseOrders", nhan: "Đơn hàng (PO)", table: "purchase_orders", sqlD: "SELECT COUNT(*) FROM purchase_orders WHERE project_id='{P}'" },
  {
    key: "receipts", nhan: "Phiếu nhập kho", table: "goods_receipts",
    sqlD: "SELECT COUNT(*) FROM goods_receipts gr JOIN purchase_orders po ON po.id=gr.purchase_order_id WHERE po.project_id='{P}'",
  },
  { key: "issues", nhan: "Phiếu xuất kho", table: "stock_issues", sqlD: "SELECT COUNT(*) FROM stock_issues WHERE project_id='{P}'" },
  { key: "returns", nhan: "Phiếu hoàn trả", table: "material_returns", sqlD: "SELECT COUNT(*) FROM material_returns WHERE project_id='{P}'" },
  { key: "stockCounts", nhan: "Phiếu kiểm kê", table: "stock_counts", sqlD: "SELECT COUNT(*) FROM stock_counts WHERE project_id='{P}'" },
  { key: "stockReconciliations", nhan: "Đối chiếu kho hợp đồng", table: "contract_stock_reconciliations", sqlD: "SELECT COUNT(*) FROM contract_stock_reconciliations WHERE project_id='{P}'" },
  { key: "constructionDailyLogs", nhan: "Nhật ký thi công", table: "construction_daily_logs", sqlD: "SELECT COUNT(*) FROM construction_daily_logs WHERE project_id='{P}'" },
  { key: "productionReports", nhan: "Báo cáo sản lượng", table: "production_reports", sqlD: "SELECT COUNT(*) FROM production_reports WHERE project_id='{P}'" },
  { key: "capitalRecoveryRecords", nhan: "Hồ sơ thu hồi vốn", table: "capital_recovery_records", sqlD: "SELECT COUNT(*) FROM capital_recovery_records WHERE project_id='{P}'" },
  { key: "contractPayments", nhan: "Thanh toán hợp đồng", table: "contract_payments", sqlD: "SELECT COUNT(*) FROM contract_payments WHERE project_id='{P}'" },
  { key: "workItems", nhan: "Công việc", table: "work_items", sqlD: "SELECT COUNT(*) FROM work_items WHERE project_id='{P}'" },
  { key: "teams", nhan: "Tổ đội", table: "teams", sqlD: "SELECT COUNT(*) FROM teams WHERE project_id='{P}'" },
  // Hai khoá dưới đây gắn dự án bằng cột NGUỒN (`source_*`) chứ không phải `project_id` — nên payload
  // cũng trả khoá khác tên (`sourceProjectId`), vì vậy mục spec có thêm `field`.
  { key: "centralReturns", nhan: "Chuyển vật tư dư về Kho Tổng", table: "central_returns", field: "sourceProjectId", sqlD: "SELECT COUNT(*) FROM central_returns WHERE source_project_id='{P}'" },
  { key: "transferOrders", nhan: "Lệnh điều chuyển", table: "transfer_orders", field: "sourceProjectId", sqlD: "SELECT COUNT(*) FROM transfer_orders WHERE source_project_id='{P}'" },
  { key: "projectContracts", nhan: "Hợp đồng dự án", table: "project_contracts", sqlD: "SELECT COUNT(*) FROM project_contracts WHERE project_id='{P}'" },
  { key: "materialNorms", nhan: "Định mức vật tư", table: "material_norms", sqlD: "SELECT COUNT(*) FROM material_norms WHERE project_id='{P}'" },
];

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

async function main() {
  console.log(`=== CỔNG CHỐNG NHÂN DÒNG (payload ≤ CSDL) — ${BASE} ===\n`);

  const adm = await login(ADMIN_USER, ADMIN_PASS);
  check("Đăng nhập admin", adm.status === 200 && adm.cookie.length > 0, `HTTP ${adm.status}`);
  if (!adm.cookie) { console.log(kq.join("\n")); process.exitCode = 1; return; }

  const res = await fetch(`${BASE}/api/system`, { headers: { Cookie: adm.cookie }, cache: "no-store" });
  const d = (await res.json()).data || {};
  const projects = Array.isArray(d.projects) ? d.projects : [];
  check("Payload có danh sách dự án", projects.length > 0, `${projects.length} dự án`);
  if (!projects.length) { console.log(kq.join("\n")); process.exitCode = 1; return; }

  let soKhoaCoDuLieu = 0;
  for (const s of SPEC) {
    const rows = Array.isArray(d[s.key]) ? d[s.key] : [];
    let uiTong = 0;
    let sqlTong = 0;
    let loiSql = "";
    const chiTietVuot = [];
    for (const p of projects) {
      const pid = String(p.id);
      const field = s.field || "projectId";
      const ui = rows.filter((r) => String(r[field]) === pid).length;
      if (!ui) continue;
      let sqlN = 0;
      try {
        const out = sql(s.sqlD.replace(/\{P\}/g, pid));
        sqlN = num((out[0] || ["0"])[0]);
      } catch (e) {
        loiSql = String(e && e.message ? e.message : e).split("\n")[0].slice(0, 90);
        break;
      }
      uiTong += ui;
      sqlTong += sqlN;
      if (ui > sqlN) chiTietVuot.push(`${p.code}: UI ${ui} > CSDL ${sqlN}`);
    }
    if (loiSql) {
      ghiNhan(`${s.nhan} (${s.key}) — KHÔNG đối chiếu được (câu SQL lỗi, cổng không kết luận)`, loiSql);
      continue;
    }
    if (uiTong === 0) continue;
    soKhoaCoDuLieu++;
    check(
      `${s.nhan} (${s.key}): payload KHÔNG vượt CSDL`,
      chiTietVuot.length === 0,
      chiTietVuot.length ? chiTietVuot.join(" · ") : `UI ${uiTong} ≤ CSDL ${sqlTong}`
    );
  }
  check(
    "[tự kiểm soát] có ít nhất 5 khoá thật sự có dữ liệu để đối chiếu (chống khẳng định rỗng)",
    soKhoaCoDuLieu >= 5,
    `${soKhoaCoDuLieu}/${SPEC.length} khoá`
  );

  console.log(kq.join("\n"));
  console.log(`\n=== KẾT QUẢ: ${pass}/${pass + fail} ĐẠT · ${fail} HỎNG · ${gap} GHI NHẬN ===`);
  process.exitCode = fail === 0 ? 0 : 1;
}

main().catch((e) => {
  console.error("PROBE LOI:", e && e.message ? e.message : e);
  process.exitCode = 2;
});
