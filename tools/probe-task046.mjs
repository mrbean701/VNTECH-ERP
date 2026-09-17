// Kiểm chứng LÚC CHẠY cho TASK-046 — hai cột CONFIRMED của vòng rà cuối "bản đồ GHI":
//   A. `project_archives.purge_audit_id` — `delete_project` phải ghi `audit_logs` rồi LIÊN KẾT id audit
//      vào archive (JS `system-route.mjs:2451-2452`). Bản Java cũ **bỏ hẳn cả hai câu**.
//   B. `boq_price_import_items.changed` — cờ "dòng có đổi giá" (JS `:2827` `row.isChanged?1:0`).
//      Bản Java cũ ghi thiếu cột ⇒ lịch sử nhập giá không phân biệt được dòng nào đổi.
//
// AN TOÀN DỮ LIỆU:
//   A. Dựng một DỰ ÁN TẠM bằng SQL (`PRJ_ZZP046`, status='closed') + một archive TẠM `'verified'`,
//      rồi gọi `delete_project` với đúng mã xác nhận. Purge chỉ đụng các dòng có `project_id = PRJ_ZZP046`
//      (không có dòng nào khác) ⇒ hậu quả nằm gọn trong dữ liệu TẠM. Dọn sạch trong `finally`.
//   B. Dùng một dòng BOQ THẬT nhưng **trả giá về đúng giá trị cũ** ngay trong probe:
//      gọi 1 (giá +1000 ⇒ changed=1) → gọi 2 (giá gốc ⇒ changed=1, ĐÃ khôi phục) → gọi 3 (giá gốc,
//      không đổi ⇒ changed=0). Cuối cùng khẳng định `unit_price` == giá gốc và xoá batch/item tạm.
//
// Chạy: node tools/probe-task046.mjs [base]
import { execFileSync } from "node:child_process";

const BASE = process.argv[2] || "http://127.0.0.1:18081";
const MYSQL = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
const PRJ = "PRJ_ZZP046";
const PRJ_CODE = "ZZP046-PRJ";
const ARCH = "PAR_ZZP046";
const MYSQL_ARGS = ["--default-character-set=utf8mb4", "-uvntech", "-pvntech", "vntech_erp",
  "--batch", "--raw", "--skip-column-names"];
const sql = (q) => execFileSync(MYSQL, [...MYSQL_ARGS, "-e", q], { encoding: "utf8" }).trim();
const sqlRows = (q) => sql(q).split(/\r?\n/).filter(Boolean).map((l) => l.split("\t"));
const sqlOne = (q) => { const r = sqlRows(q); return r.length ? r[0][0] : ""; };
const q1 = (v) => `'${String(v).replace(/'/g, "''")}'`;

const results = [];
const check = (name, ok, detail) => {
  results.push({ name, ok, detail });
  console.log(`  ${ok ? "ĐẠT" : "HỎNG"}  ${name}${detail ? " — " + detail : ""}`);
};
const isJson = (s) => { try { return JSON.parse(s) !== null; } catch { return false; } };

const login = await fetch(`${BASE}/api/system`, {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ action: "login", username: "admin", password: "Admin123456@" }),
});
if (!login.ok) { console.error(`Đăng nhập lỗi HTTP ${login.status}`); process.exit(1); }
const cookie = (login.headers.getSetCookie?.() ?? [login.headers.get("set-cookie")])
  .filter(Boolean).map((c) => c.split(";")[0]).join("; ");
console.log(`Đăng nhập OK (${BASE})\n`);
async function call(action, payload = {}) {
  const res = await fetch(`${BASE}/api/system`, {
    method: "POST", headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ action, ...payload }),
  });
  let body = {};
  try { body = await res.json(); } catch { /* bỏ qua */ }
  return { status: res.status, message: String(body.message ?? ""), error: String(body.error ?? "") };
}
const adminId = sqlOne("SELECT id FROM users WHERE username='admin'");
const now = () => new Date().toISOString().slice(0, 23).replace("T", " ");

const counts = () => ({
  projects: Number(sqlOne("SELECT COUNT(*) FROM projects")),
  archives: Number(sqlOne("SELECT COUNT(*) FROM project_archives")),
  audit: Number(sqlOne("SELECT COUNT(*) FROM audit_logs")),
  batches: Number(sqlOne("SELECT COUNT(*) FROM boq_price_import_batches")),
  priceItems: Number(sqlOne("SELECT COUNT(*) FROM boq_price_import_items")),
});
const before = counts();
console.log(`TRƯỚC: ${JSON.stringify(before)}\n`);

let batches = [];

// ═══════════ PHẦN A — purge audit ═══════════
try {
  const t = now();
  sql(`INSERT INTO projects (id,code,name,status,created_at,updated_at) VALUES (${q1(PRJ)},${q1(PRJ_CODE)},'Dự án probe TASK-046','closed',${q1(t)},${q1(t)})`);
  sql(`INSERT INTO project_archives (id,project_id,project_code,project_name,file_name,sha256,byte_size,record_count,attachment_count,schema_version,status,generated_by,generated_at) `
    + `VALUES (${q1(ARCH)},${q1(PRJ)},${q1(PRJ_CODE)},'Dự án probe TASK-046','zzp046-archive.zip','SHA256ZZP046',1,0,0,'v1','verified',${q1(adminId)},${q1(t)})`);
  check("A0. dựng được dự án TẠM + archive VERIFIED tạm", Number(sqlOne(`SELECT COUNT(*) FROM project_archives WHERE id=${q1(ARCH)}`)) === 1, PRJ);

  const del = await call("delete_project", { projectId: PRJ, confirmCode: PRJ_CODE });
  console.log(`  → delete_project: HTTP ${del.status} · ${del.message || del.error}`);
  check("A1. delete_project ⇒ HTTP 200", del.status === 200, `HTTP ${del.status} · ${del.error}`);

  // LƯU Ý ĐO LƯỜNG: `AuditTrailFilter` (web layer) ghi 1 dòng `audit_logs` cho MỖI request có action,
  // nên `WHERE entity_id=PRJ` trả 2 dòng (1 của filter, 1 của luồng purge). Phép kiểm phải lọc theo
  // `action` — đây là bài học từ chính lần chạy đầu của probe này.
  const audits = sqlRows(`SELECT id,user_id,action,entity_type,entity_id,before_json,after_json,ip_address FROM audit_logs WHERE entity_id=${q1(PRJ)} AND action='PURGE_AFTER_OFFLINE_ARCHIVE' ORDER BY occurred_at DESC`);
  const filterRows = Number(sqlOne(`SELECT COUNT(*) FROM audit_logs WHERE entity_id=${q1(PRJ)} AND action='delete_project'`));
  check("A2. ĐÃ ghi `audit_logs` cho lần purge (bản cũ: 0 dòng)",
    audits.length === 1 && audits[0][2] === "PURGE_AFTER_OFFLINE_ARCHIVE",
    `${audits.length} dòng PURGE_AFTER_OFFLINE_ARCHIVE · (filter ghi thêm ${filterRows} dòng 'delete_project' — đúng thiết kế)`);
  if (audits.length === 1) {
    const [, userId, , entityType, , beforeJson, afterJson] = audits[0];
    check("A3. đúng `entity_type='project'` + `user_id` = admin", entityType === "project" && userId === adminId, `${entityType} · ${userId}`);
    check("A4. `before_json` là JSON HỢP LỆ và chứa dòng dự án (kiểm luôn bộ escape tự viết)",
      isJson(beforeJson) && beforeJson.includes(PRJ_CODE), String(beforeJson).slice(0, 90));
    const after = isJson(afterJson) ? JSON.parse(afterJson) : null;
    check("A5. `after_json` hợp lệ + đúng nội dung JS (archiveId/archiveSha256/status/crossProjectTracePreserved)",
      Boolean(after) && after.archiveId === ARCH && after.archiveSha256 === "SHA256ZZP046"
      && after.status === "purged" && after.crossProjectTracePreserved === true,
      String(afterJson).slice(0, 140));

    const linked = sqlOne(`SELECT COALESCE(purge_audit_id,'<NULL>') FROM project_archives WHERE id=${q1(ARCH)}`);
    check("A6. `project_archives.purge_audit_id` = ĐÚNG id audit vừa ghi (bản cũ: NULL)",
      linked === audits[0][0], `${linked} vs ${audits[0][0]}`);
    const purgedAt = sqlOne(`SELECT COALESCE(purged_at,'<NULL>') FROM project_archives WHERE id=${q1(ARCH)}`);
    check("A7. archive được đánh dấu `status='purged'` + `purged_at` (phần Java đã có từ trước)",
      sqlOne(`SELECT status FROM project_archives WHERE id=${q1(ARCH)}`) === "purged" && purgedAt !== "<NULL>", purgedAt);
  }
  check("A8. `projects.status` = 'purged' (hành vi cũ giữ nguyên)",
    sqlOne(`SELECT status FROM projects WHERE id=${q1(PRJ)}`) === "purged", sqlOne(`SELECT status FROM projects WHERE id=${q1(PRJ)}`));
} catch (e) {
  check("PHẦN A chạy trọn vẹn (không ném lỗi)", false, String(e && e.message ? e.message : e));
}

// ═══════════ PHẦN B — cờ `changed` của nhập giá BOQ ═══════════
try {
  const row = sqlRows(`SELECT id,project_id,contract_id,boq_version_id,unit_price FROM project_boq_items
                       WHERE row_role IN ('material','component') AND unit_price > 0 ORDER BY id LIMIT 1`)[0];
  if (!row) throw new Error("không có dòng BOQ nào để kiểm");
  const [itemId, projectId, contractId, versionId, priceStr] = row;
  const oldPrice = Number(priceStr);
  console.log(`  → dòng BOQ ${itemId} · giá gốc ${oldPrice}`);

  const priceOf = () => Number(sqlOne(`SELECT unit_price FROM project_boq_items WHERE id=${q1(itemId)}`));
  const callPrice = async (unitPrice) => call("update_boq_contract_prices",
    { projectId, contractId, boqVersionId: versionId, sourceFileName: "probe TASK-046", updates: [{ boqItemId: itemId, unitPrice }] });

  const c1 = await callPrice(oldPrice + 1000);
  batches.push(sqlOne(`SELECT id FROM boq_price_import_batches WHERE project_id=${q1(projectId)} ORDER BY created_at DESC LIMIT 1`));
  check("B1. nâng giá 1 dòng ⇒ 200 + giá ĐỔI thật",
    c1.status === 200 && priceOf() === oldPrice + 1000, `HTTP ${c1.status} · giá ${priceOf()}`);

  const c2 = await callPrice(oldPrice);
  batches.push(sqlOne(`SELECT id FROM boq_price_import_batches WHERE project_id=${q1(projectId)} ORDER BY created_at DESC LIMIT 1`));
  check("B2. trả giá về giá gốc ⇒ khôi phục đúng (probe không để lại thay đổi)",
    c2.status === 200 && priceOf() === oldPrice, `giá ${priceOf()} vs gốc ${oldPrice}`);

  const c3 = await callPrice(oldPrice);
  batches.push(sqlOne(`SELECT id FROM boq_price_import_batches WHERE project_id=${q1(projectId)} ORDER BY created_at DESC LIMIT 1`));
  check("B3. gửi lại ĐÚNG giá đang có ⇒ thông điệp '0 đơn giá … giữ nguyên'",
    c3.status === 200 && /Đã cập nhật 0 đơn giá hợp đồng; 1 dòng giữ nguyên\./.test(c3.message), c3.message || c3.error);

  const flags = sqlRows(`SELECT i.changed,i.old_unit_price,i.new_unit_price FROM boq_price_import_items i
                         WHERE i.batch_id IN (${batches.map(q1).join(",")}) ORDER BY i.created_at, i.id`)
    .map((r) => `${r[0]}:${r[1]}→${r[2]}`);
  check("B4. cột `changed` được GHI THẬT cho cả 3 lần (bản cũ: cột không tồn tại trong câu INSERT)",
    flags.length === 3 && flags[0].startsWith("1:") && flags[1].startsWith("1:") && flags[2].startsWith("0:"),
    flags.join(" · "));
} catch (e) {
  check("PHẦN B chạy trọn vẹn (không ném lỗi)", false, String(e && e.message ? e.message : e));
}

// ═══════════ DỌN SẠCH ═══════════
try {
  sql(`DELETE FROM audit_logs WHERE entity_id=${q1(PRJ)}`);
  sql(`DELETE FROM project_archives WHERE id=${q1(ARCH)}`);
  sql(`DELETE FROM projects WHERE id=${q1(PRJ)}`);
  for (const b of batches.filter(Boolean)) {
    sql(`DELETE FROM boq_price_import_items WHERE batch_id=${q1(b)}`);
    sql(`DELETE FROM boq_price_import_batches WHERE id=${q1(b)}`);
  }
} catch (e) { console.error(`DỌN DỮ LIỆU LỖI: ${e.message}`); }

const after = counts();
console.log(`\nSAU: ${JSON.stringify(after)}`);
check("dọn sạch: 4 bảng dữ liệu THẬT của probe (projects/archives/batches/priceItems) về ĐÚNG số dòng ban đầu",
  ["projects", "archives", "batches", "priceItems"].every((k) => before[k] === after[k]),
  ["projects", "archives", "batches", "priceItems"].filter((k) => before[k] !== after[k]).map((k) => `${k} ${before[k]}→${after[k]}`).join(" · ") || "khớp toàn bộ");
check("dọn sạch: mọi dòng audit do PROBE tạo (entity_id = dự án tạm) đã bị xoá",
  Number(sqlOne(`SELECT COUNT(*) FROM audit_logs WHERE entity_id=${q1(PRJ)}`)) === 0,
  `còn ${sqlOne(`SELECT COUNT(*) FROM audit_logs WHERE entity_id=${q1(PRJ)}`)} dòng`);
check(`GIỚI HẠN đã biết: audit_logs toàn cục tăng ${after.audit - before.audit} dòng do AuditTrailFilter ghi mỗi request — KHÔNG phải rác của probe và KHÔNG tự xoá (đó là nhật ký thật)`,
  true, `audit ${before.audit} → ${after.audit}`);
check("GIỚI HẠN đã biết: probe KHÔNG kiểm end-to-end giao diện (nút Xóa/Purge trên UI) và KHÔNG dọn object-storage",
  true, "tầng HTTP + DB đã được kiểm; phần UI cần người dùng bấm nút");

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} ĐẠT`);
if (failed.length) { console.log("MỤC HỎNG:"); for (const f of failed) console.log(` - ${f.name}: ${f.detail}`); }
process.exit(failed.length ? 1 : 0);
