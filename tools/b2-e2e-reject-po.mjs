// [PHASE 8 · D5 + B2 end-to-end] Tạo PO test ở `pending_approval` → gọi `reject_po` qua Java :18081 → kiểm 4 điều kiện → HOÀN TÁC.
// An toàn: ghi file hoàn tác, tự khôi phục trong `finally`, và KHÔNG đụng dữ liệu khác.
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
const MYSQL = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
const q = (sql) => execFileSync(MYSQL, ["-uvntech", "-pvntech", "--default-character-set=utf8mb4", "-N", "-B", "vntech_erp", "-e", sql], { encoding: "utf8" }).trim();
const one = (sql) => q(sql).split(/\r?\n/)[0] || "";

const po = one("SELECT CONCAT(id,'|',po_no,'|',COALESCE(status,''),'|',COALESCE(request_id,''),'|',COALESCE(buyer_user_id,'')) FROM purchase_orders WHERE request_id IS NOT NULL ORDER BY ordered_at DESC LIMIT 1;");
if (!po) { console.error("✖ Không có PO nào để thử ⇒ DỪNG."); process.exit(1); }
const [poId, poNo, statusBefore, requestId, buyer] = po.split("|");
const mrBefore = one(`SELECT COALESCE(status,'') FROM material_requests WHERE id='${requestId}';`);
const ntfBefore = Number(one("SELECT COUNT(*) FROM task_notifications;"));
console.log(`PO test: ${poNo} (${poId}) · trạng thái TRƯỚC='${statusBefore}' · MR=${requestId} (status='${mrBefore}') · buyer='${buyer}'`);
console.log(`task_notifications TRƯỚC = ${ntfBefore}`);

const results = [];
const check = (ok, label, ev) => { results.push(ok); console.log(`  [${ok ? "ĐẠT " : "HỎNG"}] ${label} :: ${ev}`); };

// 1) Dựng dữ liệu test: đưa PO về pending_approval
q(`UPDATE purchase_orders SET status='pending_approval', decision_reason=NULL, decided_by=NULL, decided_at=NULL WHERE id='${poId}';`);
const staged = one(`SELECT COALESCE(status,'') FROM purchase_orders WHERE id='${poId}';`);
check(staged === "pending_approval", "dựng được PO test ở pending_approval", `status='${staged}'`);

let httpStatus = 0, body = "";
try {
  // 2) Gọi reject_po qua Java (đăng nhập admin)
  const login = await fetch("http://127.0.0.1:18081/api/system", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "login", username: "admin", password: "Admin123456@" }) });
  const cookie = (login.headers.getSetCookie ? login.headers.getSetCookie() : [login.headers.get("set-cookie")]).filter(Boolean).map((c) => c.split(";")[0]).join("; ");
  const res = await fetch("http://127.0.0.1:18081/api/system", { method: "POST", headers: { "content-type": "application/json", cookie }, body: JSON.stringify({ action: "reject_po", purchaseOrderId: poId, reason: "KIỂM THỬ end-to-end B2 (tự động, sẽ hoàn tác)" }) });
  httpStatus = res.status; body = await res.text();
  console.log(`  reject_po ⇒ HTTP ${httpStatus}: ${body.slice(0, 160)}`);
  check(httpStatus === 200 && body.includes("ok\":true"), "reject_po chạy thành công qua Java", `HTTP ${httpStatus}`);

  // 3) Kiểm 4 điều kiện
  const after = one(`SELECT CONCAT(COALESCE(status,''),'|',COALESCE(decision_reason,''),'|',COALESCE(decided_by,'')) FROM purchase_orders WHERE id='${poId}';`).split("|");
  check(after[0] === "cancelled", "PO chuyển sang `cancelled`", `status='${after[0]}'`);
  check(after[1].length > 0, "có ghi `decision_reason`", `reason='${after[1].slice(0, 60)}'`);
  check(after[2].length > 0, "có ghi `decided_by`", `by='${after[2]}'`);
  const mrAfter = one(`SELECT COALESCE(status,'') FROM material_requests WHERE id='${requestId}';`);
  check(mrAfter === mrBefore, "**MR KHÔNG ĐỔI** (PR vẫn mở)", `MR status '${mrBefore}' → '${mrAfter}'`);
  const ntfAfter = Number(one("SELECT COUNT(*) FROM task_notifications;"));
  const lastNtf = one(`SELECT CONCAT(COALESCE(user_id,''),'|',COALESCE(title,'')) FROM task_notifications ORDER BY created_at DESC LIMIT 1;`);
  check(ntfAfter === ntfBefore + 1, "có THÊM 1 dòng `task_notifications` cho người tạo PO", `trước=${ntfBefore} sau=${ntfAfter} · ${lastNtf}`);
} finally {
  // 4) HOÀN TÁC dữ liệu test
  q(`UPDATE purchase_orders SET status='${statusBefore}', decision_reason=NULL, decided_by=NULL, decided_at=NULL WHERE id='${poId}';`);
  if (httpStatus === 200) q(`DELETE FROM task_notifications WHERE user_id='${buyer}' AND title LIKE 'PO ${poNo}%' AND body LIKE '%KIỂM THỬ end-to-end%';`);
  const restored = one(`SELECT COALESCE(status,'') FROM purchase_orders WHERE id='${poId}';`);
  const ntfRestored = Number(one("SELECT COUNT(*) FROM task_notifications;"));
  console.log(`  HOÀN TÁC: PO status='${restored}' (gốc '${statusBefore}') · task_notifications=${ntfRestored} (gốc ${ntfBefore})`);
  writeFileSync("docs/agent-progress/TASK-094-d5-b2-rollback.sql",
    `-- D5/B2 end-to-end ROLLBACK (18/09) — khôi phục PO test nếu script bị dừng giữa chừng\nUPDATE purchase_orders SET status='${statusBefore}', decision_reason=NULL, decided_by=NULL, decided_at=NULL WHERE id='${poId}';\nDELETE FROM task_notifications WHERE user_id='${buyer}' AND body LIKE '%KIỂM THỬ end-to-end%';\n`);
  check(restored === statusBefore, "đã HOÀN TÁC PO về trạng thái gốc", `'${restored}'`);
}
const bad = results.filter((r) => !r).length;
console.log(`\n=== B2 END-TO-END: ${results.length - bad}/${results.length} ĐẠT · ${bad} HỎNG ===`);
process.exit(bad ? 1 : 0);
