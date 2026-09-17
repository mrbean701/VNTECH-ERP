#!/usr/bin/env node
// VNTECH ERP V5.3.0 — CỔNG KIỂM CHỨNG TASK-082: "DỮ LIỆU THẬT, KHÔNG HẰNG SỐ GIẢ"
//
// Mục đích: chứng minh 3 hằng số giả đã bị loại bỏ và 5 cột thiếu đã được nối,
// bằng chứng lấy từ CHÍNH payload mà UI nhận (`GET /api/system` qua cổng 9000).
//
// Cách chạy:  node tools/probe-task082-realdata.mjs
// (Mặc định đo qua http://127.0.0.1:9000 — cổng người dùng mở; đổi bằng PROBE_BASE.)
//
// Nguồn dữ liệu thật được đối chiếu:
//   · goods_receipts.certificate_status   -> receipts[].certificateCount  (1 nếu 'complete', ngược lại 0)
//   · goods_receipts.posting_status       -> UI cột "TÌNH TRẠNG" (Đã nhập kho / Chờ hạch toán / ...)
//   · goods_receipts.bch_confirmed_by/at  -> receipts[].bchConfirmedByName / bchConfirmedAt
//   · goods_receipts.delivery_note_no     -> receipts[].deliveryNoteNo
//   · goods_receipts.bch_comment          -> receipts[].bchComment
//   · attachments(entity_type='goods_receipt') -> receipts[].attachmentCount / purchaseOrders[].attachmentCount
//   · payment_plans.status='overdue'      -> màn Thanh toán "Quá hạn" (SlaComplianceWorker đánh dấu)

const BASE = process.env.PROBE_BASE || "http://127.0.0.1:9000";
const USER = process.env.PROBE_USER || "admin";
const PASS = process.env.PROBE_PASS || "Admin123456@";

let pass = 0;
let fail = 0;
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

async function main() {
  console.log(`=== PROBE TASK-082 (du lieu that) — do qua ${BASE} ===\n`);

  // ---- 1. Đăng nhập lấy cookie phiên (đúng đường UI đi) ----
  const loginRes = await fetch(`${BASE}/api/system`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "login", username: USER, password: PASS }),
    redirect: "manual",
  });
  const setCookie = loginRes.headers.getSetCookie ? loginRes.headers.getSetCookie() : [];
  const rawCookie = setCookie.length
    ? setCookie.map((c) => c.split(";")[0]).join("; ")
    : String(loginRes.headers.get("set-cookie") || "").split(";")[0];
  check("Đăng nhập qua cổng 9000 trả HTTP 200", loginRes.status === 200, `HTTP ${loginRes.status}`);
  check("Có cookie phiên mep_session", /mep_session=/.test(rawCookie), rawCookie ? rawCookie.split("=")[0] : "(khong co)");
  if (!rawCookie) {
    console.log(kq.join("\n"));
    console.log("\nKHÔNG LẤY ĐƯỢC PHIÊN — dừng.");
    process.exitCode = 1;
    return;
  }

  // ---- 2. Lấy payload bootstrap ----
  const res = await fetch(`${BASE}/api/system`, { headers: { Cookie: rawCookie }, cache: "no-store" });
  check("GET /api/system trả HTTP 200", res.status === 200, `HTTP ${res.status}`);
  const body = await res.json();
  const d = body.data || body;
  // Fingerprint nguồn do tầng SSR (scripts/local-server.mjs) phát ở TÀI LIỆU HTML, không ở API.
  const html = await fetch(`${BASE}/`, { headers: { Cookie: rawCookie }, cache: "no-store" });
  const fp = html.headers.get("x-vntech-source-fingerprint") || "";
  const { VNTECH_IDENTITY_DATA } = await import("../lib/vntech-identity-data.mjs");
  const fpSsot = VNTECH_IDENTITY_DATA.sourceFingerprintShort;
  check(
    "Bản đang phục vụ khớp định danh SSOT (x-vntech-source-fingerprint)",
    fp === fpSsot && fp.length > 0,
    `served=${fp || "(khong co)"} · ssot=${fpSsot}`
  );

  const receipts = Array.isArray(d.receipts) ? d.receipts : [];
  const pos = Array.isArray(d.purchaseOrders) ? d.purchaseOrders : [];
  const plans = Array.isArray(d.paymentPlans) ? d.paymentPlans : [];
  console.log(`\nDữ liệu nhận được: receipts=${receipts.length} · purchaseOrders=${pos.length} · paymentPlans=${plans.length}\n`);

  // ---- 3. Năm cột Java từng THIẾU so với JS (đã nối) ----
  const CAN = ["deliveryNoteNo", "bchConfirmedAt", "bchComment", "bchConfirmedByName", "attachmentCount", "certificateCount"];
  const thieuTheoDong = receipts.filter((r) => CAN.some((k) => !(k in r)));
  check(
    "receipts: đủ 6 khoá thật (deliveryNoteNo/bchConfirmedAt/bchComment/bchConfirmedByName/attachmentCount/certificateCount)",
    receipts.length > 0 && thieuTheoDong.length === 0,
    `${receipts.length - thieuTheoDong.length}/${receipts.length} dòng đủ khoá`
  );
  check(
    "purchaseOrders: có certificateCount + attachmentCount",
    pos.length > 0 && pos.every((p) => "certificateCount" in p && "attachmentCount" in p),
    pos.length ? `mẫu: ${pos[0].poNo}=cert ${pos[0].certificateCount}/att ${pos[0].attachmentCount}` : "(khong co PO)"
  );

  // ---- 4. certificateCount phải SUY TỪ certificate_status, không phải hằng số ----
  const saiQuyTac = receipts.filter((r) => Number(r.certificateCount || 0) !== (String(r.certificateStatus) === "complete" ? 1 : 0));
  check("receipts.certificateCount = (certificate_status==='complete' ? 1 : 0) cho MỌI dòng", receipts.length > 0 && saiQuyTac.length === 0, `${receipts.length - saiQuyTac.length}/${receipts.length} dòng đúng`);
  const distinct = [...new Set(receipts.map((r) => Number(r.certificateCount || 0)))].sort();
  check(
    "cột CHỨNG CHỈ KHÔNG còn là hằng số giả 2 (tập giá trị ≠ {2})",
    !(distinct.length === 1 && distinct[0] === 2),
    `tập giá trị thực = {${distinct.join(", ")}}`
  );
  const coChungChi = receipts.filter((r) => Number(r.certificateCount || 0) > 0).length;
  check("có dòng thật mang chứng chỉ (certificateCount > 0)", coChungChi > 0, `${coChungChi}/${receipts.length} dòng`);

  // ---- 5. ẢNH: attachmentCount phải > 0 ở đâu đó (trước đây luôn 0 vì Java không nạp cột) ----
  const coAnh = receipts.filter((r) => Number(r.attachmentCount || 0) > 0).length;
  check("receipts có ảnh thật (attachmentCount > 0)", coAnh > 0, `${coAnh}/${receipts.length} dòng`);
  const poCoAnh = pos.filter((p) => Number(p.attachmentCount || 0) > 0).length;
  const poCoChungChi = pos.filter((p) => Number(p.certificateCount || 0) > 0).length;
  check("purchaseOrders có ảnh thật", poCoAnh > 0, `${poCoAnh}/${pos.length} PO`);
  check("purchaseOrders có chứng chỉ thật", poCoChungChi > 0, `${poCoChungChi}/${pos.length} PO`);

  // ---- 6. TÌNH TRẠNG: phải phân hoá theo posting_status, không cố định 'Đã nhập kho' ----
  const postingSet = [...new Set(receipts.map((r) => String(r.postingStatus || "(trong)")))].sort();
  check("receipts.postingStatus có giá trị thật để hiển thị TÌNH TRẠNG", postingSet.length > 0 && postingSet[0] !== "(trong)", `tập giá trị = {${postingSet.join(", ")}}`);

  // ---- 7. BCH XÁC NHẬN: tên/ngày người xác nhận thật ----
  const coBch = receipts.filter((r) => String(r.bchConfirmedByName || "").trim().length > 0).length;
  check("receipts có tên người BCH xác nhận thật", coBch > 0, `${coBch}/${receipts.length} dòng`);

  // ---- 8. Màn Thanh toán 'Quá hạn' phải > 0 theo payment_plans.status='overdue' ----
  const quaHan = plans.filter((p) => String(p.status) === "overdue");
  const tongQuaHan = quaHan.reduce((s, p) => s + Math.max(0, Number(p.plannedAmount || 0) - Number(p.paidAmount || 0)), 0);
  check("paymentPlans có kế hoạch status='overdue' (nguồn cho ô 'Quá hạn')", quaHan.length > 0, `${quaHan.length}/${plans.length} kế hoạch`);
  check("tổng tiền quá hạn thật > 0 (trước đây hardcode moneyBillion(0))", tongQuaHan > 0, `${(tongQuaHan / 1e9).toFixed(2)} tỷ`);

  // ---- 9. TỰ KIỂM SOÁT (self-control): phép khẳng định không được rỗng ----
  check("[tự kiểm soát] khoá bịa KHÔNG tồn tại trong receipts", receipts.length > 0 && receipts.every((r) => !("__khong_ton_tai__" in r)));
  check("[tự kiểm soát] một dòng receipts thật có id + receiptNo", receipts.length > 0 && receipts.every((r) => r.id && r.receiptNo));

  console.log(kq.join("\n"));
  console.log(`\n=== KẾT QUẢ: ${pass}/${pass + fail} ĐẠT · ${fail} HỎNG ===`);
  process.exitCode = fail === 0 ? 0 : 1;
}

main().catch((e) => {
  console.error("PROBE LOI:", e && e.message ? e.message : e);
  process.exitCode = 2;
});
