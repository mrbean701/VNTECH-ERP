// ============================================================================
// TASK-049 — cổng kiểm chứng 2 phép kiểm OWNER của bước duyệt mà Java còn thiếu
// ============================================================================
// JS `requireWorkflowAssignment` (`scripts/system-route.mjs:442-452`) kiểm 4 điều; bản Java trước đây
// chỉ kiểm 2 điều đầu ⇒ phiếu có thể được chuyển tới người **SAI VAI TRÒ của bước** hoặc
// **KHÔNG được phân quyền dự án** (JS chặn 400 ở cả hai). Cổng này đo CẢ HAI nhánh + ĐỐI CHỨNG DƯƠNG.
//
// PHÁT HIỆN QUAN TRỌNG NGAY TRÊN DỮ LIỆU THẬT (xem mục 1 của kết quả in ra):
//   Owner của BƯỚC 2 (`thukydemo`) **KHÔNG có `user_project_scopes`** cho PRJ-DEMO-01 — dòng phạm vi của
//   tài khoản này trỏ tới `PRJ_fdbfab20-bf1f-0000-0000-000000000000` (một project KHÔNG TỒN TẠI — known
//   issue #51 / quyết định D5). ⇒ Sau khi port, `create_request` cho PRJ-DEMO-01 trả **400** đúng như JS.
//
// AN TOÀN DỮ LIỆU: probe chỉ TẠM đổi 2 thứ rồi KHÔI PHỤC trong `finally`, và khẳng định số dòng về đúng
//   (1) đổi `approval_project_assignments.owner_user_id` của bước 1 sang tài khoản sai vai trò;
//   (2) THÊM 1 dòng `user_project_scopes` cho Owner bước 2 (đúng bài toán D5) — xoá lại sau khi kiểm.
//   Phiếu tạo ra trong nhánh ĐẠT bị xoá cứng bằng SQL (phiếu ở trạng thái chờ duyệt, API không cho xoá).
//
// Chạy: node tools/probe-task049-owner-checks.mjs [base]
import { execFileSync } from "node:child_process";

const BASE = process.argv[2] || "http://127.0.0.1:18081";
const MYSQL = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
const PROJECT_ID = "PRJ_fdbfab20-bf1f-4ad5-8159-7dcc582140c3"; // PRJ-DEMO-01

const sql = (q) => execFileSync(MYSQL, ["--default-character-set=utf8mb4", "-uvntech", "-pvntech",
  "vntech_erp", "--batch", "--raw", "--skip-column-names", "-e", q], { encoding: "utf8" }).trim();
const sqlRows = (q) => sql(q).split(/\r?\n/).filter(Boolean).map((l) => l.split("\t"));
const sqlOne = (q) => { const r = sqlRows(q); return r.length ? r[0][0] : ""; };
const q = (v) => `'${String(v).replace(/'/g, "''")}'`;
const results = [];
const check = (name, ok, detail) => { results.push({ name, ok, detail }); console.log(`  ${ok ? "ĐẠT" : "HỎNG"}  ${name}${detail ? " — " + detail : ""}`); };

// ---------- đăng nhập admin ----------
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
  return { status: res.status, ok: body.ok === true,
    message: String(body.message ?? ""), error: String(body.error ?? "") };
}
const boot = async () => (await (await fetch(`${BASE}/api/system`, { headers: { cookie } })).json()).data ?? {};
const apiMessage = (r) => r.error || r.message;

function execSql(statement, label) {
  try { sql(statement); return true; }
  catch (e) { cleanupFailures.push(`${label}: ${String(e.stderr ?? e.message).trim().slice(0, 130)}`); return false; }
}

// ---------- 0. TRẠNG THÁI TRƯỚC + phân công thật ----------
const TBL = ["material_requests", "material_request_items", "approvals", "approval_stage_decisions",
  "request_comments", "procurement_allocations", "custom_field_values", "supply_workflow_steps",
  "user_project_scopes", "approval_project_assignments"];
const counts = () => Object.fromEntries(TBL.map((t) => [t, Number(sqlOne(`SELECT COUNT(*) FROM ${t}`))]));
const before = counts();
console.log(`TRƯỚC: ${JSON.stringify(before)}\n`);

const assignments = sqlRows(`SELECT apa.stage,apa.owner_user_id,u.full_name,u.role,
   COALESCE(rc.base_role,u.role) AS baseRole,apa.active,
   (SELECT permission FROM user_project_scopes ups WHERE ups.user_id=apa.owner_user_id AND ups.project_id=apa.project_id LIMIT 1) AS scopePerm
   FROM approval_project_assignments apa JOIN users u ON u.id=apa.owner_user_id
   LEFT JOIN role_catalog rc ON rc.code=u.role
   WHERE apa.project_id=${q(PROJECT_ID)} AND apa.active=1 ORDER BY apa.stage`);
console.log("Phân công HIỆN TẠI (dự án PRJ-DEMO-01):");
for (const r of assignments) console.log(`  bước ${r[0]}: ${r[2]} (role=${r[3]}, base=${r[4]}) · phạm vi dự án=${r[6] ?? "(KHÔNG CÓ)"}`);
console.log("");

const cleanupFailures = [];
const createdIds = [];
const savedItemIds = new Map();
let fixtureOwnerStage1 = null;
let fixtureScopeId = null;

try {
  const data = await boot();
  const material = (data.materials ?? [])[0];
  if (!material?.id) throw new Error("bootstrap không có vật tư");
  const lines = [{ materialId: material.id, materialCode: material.code, materialName: material.name,
    unit: material.unit, quantity: 1, unitPrice: 1000, itemType: "phat_sinh", outsideContract: true,
    note: "probe TASK-049" }];
  const payload = () => ({ projectId: PROJECT_ID, neededAt: "2026-12-31", priority: "normal",
    area: "Khu vực probe TASK-049", purpose: "probe TASK-049", lines });
  const requestsBefore = Number(sqlOne("SELECT COUNT(*) FROM material_requests"));

  // ══════════ 1. NHÁNH PHẠM VI DỰ ÁN — LỖI THẬT NGAY TRÊN DỮ LIỆU HIỆN TẠI (không cần fixture) ══════════
  console.log("═══ 1. Owner của bước 2 KHÔNG có phạm vi dự án (dữ liệu THẬT) ═══");
  // ⚠️ LỖI CỦA CHÍNH PROBE (lượt chạy đầu): `mysql --batch --raw` in giá trị NULL thành CHUỖI `"NULL"`,
  // không phải chuỗi rỗng ⇒ phép kiểm `=== ""` không bao giờ đúng và 2 nhánh dưới bị BỎ QUA oan
  // (đúng lúc đó dữ liệu THẬT đang có Owner thiếu phạm vi). Nay coi cả `"NULL"` là thiếu.
  const isMissing = (v) => !v || v === "NULL";
  const unscoped = assignments.find((r) => isMissing(r[6]));
  if (!unscoped) {
    console.log("  (bỏ qua) mọi Owner đều đã có phạm vi dự án ⇒ dữ liệu đã được sửa; nhánh này chỉ kiểm được bằng fixture");
  } else {
    const stage = Number(unscoped[0]);
    const r1 = await call("create_request", payload());
    check(`[dữ liệu thật] create_request trả 400 vì Owner bước ${stage} không có phạm vi dự án`,
      r1.status === 400, `HTTP ${r1.status} · ${apiMessage(r1)}`);
    check("[dữ liệu thật] thông điệp ĐÚNG NGUYÊN VĂN JS `:450`",
      apiMessage(r1) === `Owner ${unscoped[2]} chưa được phân quyền dự án này.`, apiMessage(r1));
    check("[dữ liệu thật] KHÔNG tạo phiếu nào (400 phải chặn TRƯỚC khi ghi)",
      Number(sqlOne("SELECT COUNT(*) FROM material_requests")) === requestsBefore,
      `trước=${requestsBefore} · sau=${sqlOne("SELECT COUNT(*) FROM material_requests")}`);
    console.log(`  → PHÁT HIỆN KÈM: Owner bước ${stage} (\`${unscoped[2]}\`) có dòng \`user_project_scopes\` TRỎ TỚI PROJECT KHÔNG TỒN TẠI ` +
      `(known issue #51 / D5) ⇒ đây là LÝ DO gốc khiến luồng lập phiếu của PRJ-DEMO-01 bị chặn sau khi port.`);
  }

  // ══════════ 2. NHÁNH SAI VAI TRÒ (fixture: đổi Owner bước 1 sang tài khoản khác vai trò) ══════════
  console.log("\n═══ 2. Owner SAI VAI TRÒ của bước (fixture) ═══");
  const wrongRoleUser = sqlRows(`SELECT u.id,u.full_name,u.role,COALESCE(rc.base_role,u.role) AS baseRole
     FROM users u LEFT JOIN role_catalog rc ON rc.code=u.role
     WHERE u.active=1 AND u.role NOT IN ('cht','commander','admin')
       AND COALESCE(rc.base_role,u.role) NOT IN ('commander','admin')
       AND COALESCE(rc.base_role,u.role) NOT IN ('warehouse')
     ORDER BY u.username LIMIT 1`)[0];
  const stage1 = assignments.find((r) => Number(r[0]) === 1);
  if (!wrongRoleUser || !stage1) {
    check("tìm được tài khoản sai vai trò + phân công bước 1 để dựng fixture", false, "thiếu dữ liệu");
  } else {
    fixtureOwnerStage1 = stage1[1];
    execSql(`UPDATE approval_project_assignments SET owner_user_id=${q(wrongRoleUser[0])}
             WHERE project_id=${q(PROJECT_ID)} AND stage=1`, "fixture doi owner buoc 1");
    const r2 = await call("create_request", payload());
    check("[sai vai trò] create_request trả 400", r2.status === 400, `HTTP ${r2.status} · ${apiMessage(r2)}`);
    check("[sai vai trò] thông điệp ĐÚNG NGUYÊN VĂN JS `:447` (kèm tên Owner + số bước + tên bước)",
      /^Owner .+ không thuộc vai trò được phép của Bước 1 – .+\.$/.test(apiMessage(r2)), apiMessage(r2));
    check("[sai vai trò] KHÔNG tạo phiếu nào",
      Number(sqlOne("SELECT COUNT(*) FROM material_requests")) === requestsBefore,
      `số phiếu=${sqlOne("SELECT COUNT(*) FROM material_requests")}`);
    execSql(`UPDATE approval_project_assignments SET owner_user_id=${q(fixtureOwnerStage1)}
             WHERE project_id=${q(PROJECT_ID)} AND stage=1`, "khoi phuc owner buoc 1");
    check("khôi phục phân công bước 1 về đúng Owner cũ",
      sqlOne(`SELECT owner_user_id FROM approval_project_assignments WHERE project_id=${q(PROJECT_ID)} AND stage=1`) === fixtureOwnerStage1,
      sqlOne(`SELECT owner_user_id FROM approval_project_assignments WHERE project_id=${q(PROJECT_ID)} AND stage=1`));
  }

  // ══════════ 3. NHÁNH ĐẠT (fixture: cấp phạm vi dự án cho Owner đang thiếu — đúng bài toán D5) ══════════
  console.log("\n═══ 3. Nhánh ĐẠT — cấp phạm vi dự án cho Owner (fixture đúng bài toán D5) ═══");
  if (!unscoped) {
    console.log("  (bỏ qua) không còn Owner thiếu phạm vi ⇒ bỏ nhánh ĐẠT");
  } else {
    const ownerUserId = unscoped[1];
    fixtureScopeId = `SCOPE_${crypto.randomUUID()}`;
    execSql(`INSERT INTO user_project_scopes (id,user_id,project_id,permission,created_at,updated_at,joined_at)
             VALUES (${q(fixtureScopeId)},${q(ownerUserId)},${q(PROJECT_ID)},'read',NOW(3),NOW(3),NOW(3))`,
      "fixture them pham vi du an");
    const r3 = await call("create_request", payload());
    check("[đã cấp phạm vi] create_request trả 200 (đủ cả 2 phép kiểm mới)",
      r3.status === 200, `HTTP ${r3.status} · ${apiMessage(r3)}`);
    const no = (apiMessage(r3).match(/DNMH-\S+?(?= gồm)/) ?? [""])[0];
    const id = no ? sqlOne(`SELECT id FROM material_requests WHERE request_no=${q(no)}`) : "";
    check("[đã cấp phạm vi] phiếu được ghi vào DB", Boolean(id), no || "(không có số phiếu)");
    if (id) {
      createdIds.push(id);
      savedItemIds.set(id, sqlRows(`SELECT id FROM material_request_items WHERE request_id=${q(id)}`).map((r) => r[0]));
    }
  }
} catch (error) {
  check("probe chạy trọn vẹn (không ném lỗi)", false, String(error?.message ?? error));
} finally {
  // ---------- KHÔI PHỤC ----------
  if (fixtureOwnerStage1) {
    execSql(`UPDATE approval_project_assignments SET owner_user_id=${q(fixtureOwnerStage1)}
             WHERE project_id=${q(PROJECT_ID)} AND stage=1`, "khoi phuc owner buoc 1 (finally)");
  }
  if (fixtureScopeId) execSql(`DELETE FROM user_project_scopes WHERE id=${q(fixtureScopeId)}`, "xoa fixture pham vi");
  for (const id of createdIds) {
    const itemSql = (savedItemIds.get(id) ?? []).map(q).join(",") || "NULL";
    execSql(`DELETE FROM supply_workflow_steps WHERE request_id=${q(id)}`, "supply_workflow_steps");
    execSql(`DELETE FROM procurement_allocations WHERE request_item_id IN (${itemSql})`, "procurement_allocations");
    execSql(`DELETE FROM custom_field_values WHERE entity_id IN (${itemSql})`, "custom_field_values");
    execSql(`DELETE FROM approval_stage_decisions WHERE request_id=${q(id)}`, "approval_stage_decisions");
    execSql(`DELETE FROM approvals WHERE request_id=${q(id)}`, "approvals");
    execSql(`DELETE FROM request_comments WHERE request_id=${q(id)}`, "request_comments");
    execSql(`DELETE FROM material_request_items WHERE request_id=${q(id)}`, "material_request_items");
    execSql(`DELETE FROM material_requests WHERE id=${q(id)}`, "material_requests");
    if (sqlOne(`SELECT COUNT(*) FROM material_requests WHERE id=${q(id)}`) !== "0")
      cleanupFailures.push(`phiếu ${id} vẫn còn trong DB`);
  }
  const after = counts();
  const drift = Object.keys(before).filter((t) => before[t] !== after[t]);
  console.log(`\nSAU KHI KHÔI PHỤC: ${JSON.stringify(after)}`);
  check("khôi phục sạch: mọi bảng về ĐÚNG số dòng ban đầu (kể cả `user_project_scopes` + `approval_project_assignments`)",
    drift.length === 0 && cleanupFailures.length === 0,
    drift.length ? drift.map((t) => `${t} ${before[t]}→${after[t]}`).join(" · ") : (cleanupFailures.join(" · ") || "khớp toàn bộ"));
}

const failed = results.filter((r) => !r.ok);
console.log(`\n═══ KẾT QUẢ: ${results.length - failed.length}/${results.length} ĐẠT ═══`);
if (failed.length) { console.log("MỤC HỎNG:"); for (const f of failed) console.log(`  • ${f.name} — ${f.detail}`); }
console.log("ĐỐI CHỨNG DƯƠNG (nói rõ): TRƯỚC khi port, cùng lời gọi `create_request` cho PRJ-DEMO-01 đã trả **200 và");
console.log("  tạo phiếu thật** nhiều lần trên jar 19:00 (probe TASK-048 18/18 và TASK-054 20/20 đều tạo phiếu)");
console.log("  ⇒ việc nay trả 400 là HỆ QUẢ của 2 phép kiểm vừa thêm, không phải lỗi môi trường.");
console.log("GIỚI HẠN: nhánh `permission='none'` và nhánh \"không có dòng nào\" cho CÙNG kết quả vì câu SQL dùng");
console.log("  `permission IN ('read','write','approve','admin')`; probe chỉ dựng được nhánh THÊM dòng phạm vi.");
process.exit(failed.length ? 1 : 0);
