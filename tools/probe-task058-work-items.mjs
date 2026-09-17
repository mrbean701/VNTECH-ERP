// ════════════════════════════════════════════════════════════════════════════════════════════
// TASK-058 — cổng kiểm chứng `workItems`: ĐỦ CỘT + BỘ LỌC THEO PHÒNG BAN/BCH (JS `:715-717`)
// ════════════════════════════════════════════════════════════════════════════════════════════
// LỖI ĐƯỢC KIỂM (known issue #58): Java `BootstrapDataAdapter` trả `workItems` **KHÔNG có mệnh đề WHERE**
// ⇒ mọi tài khoản nhận **toàn bộ** công việc của mọi phòng ban/dự án; đồng thời thiếu 14 cột (UI đọc
// `assignedTo`/`assignedToName` nên hiện TRỐNG). JS `:715` dựng 4 nhánh lọc theo vai trò:
//   admin → `1=1` · KH (`departmentForRole==='KH'`) → `department_code='KH' AND (assigned_to=? OR EXISTS(role kh_truong…))`
//   DA → tương tự với `da_truong` · BCH (`departmentCodeForUser==='BCH'`) → `department_code='BCH' AND (assigned_to=? OR project_id IS NULL OR project_id IN (<phạm vi>))`
//   còn lại → `assigned_to=?` (chỉ việc CỦA MÌNH)
//
// CÁCH KIỂM: `work_items` đang **RỖNG (0 dòng)** nên probe **TỰ DỰNG 7 dòng TẠM** (ASCII, có dọn sạch)
// đủ để chạm CẢ 4 nhánh + 2 đối chứng âm, rồi đăng nhập từng tài khoản THẬT và khẳng định tập hiển thị.
// Chạy TRƯỚC khi vá sẽ thấy mọi tài khoản đều thấy 7 dòng ⇒ **đối chứng dương**.
//
// AN TOÀN DỮ LIỆU: chỉ INSERT/XOÁ các dòng có tiền tố `WRK_PROBE58_`/`WIE_PROBE58_`; cuối cùng khẳng định
// `work_items` + `work_item_events` về ĐÚNG số dòng ban đầu. KHÔNG đụng dữ liệu nghiệp vụ.
//
// Chạy: node tools/probe-task058-work-items.mjs [base]
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
const note = (m) => console.log(`  (bỏ qua)  ${m}`);

const userId = (username) => sqlOne(`SELECT id FROM users WHERE username=${q(username)}`);
const cleanupFailures = [];
function execSql(statement, label) {
  try { sql(statement); return true; }
  catch (e) { cleanupFailures.push(`${label}: ${String(e.stderr ?? e.message).replace(/\s+/g, " ").trim().slice(0, 120)}`); return false; }
}

// ---------- 0. TRẠNG THÁI TRƯỚC ----------
const before = {
  work_items: Number(sqlOne("SELECT COUNT(*) FROM work_items")),
  work_item_events: Number(sqlOne("SELECT COUNT(*) FROM work_item_events")),
};
console.log(`TRƯỚC: ${JSON.stringify(before)}`);
if (before.work_items !== 0) {
  console.log("⚠️ `work_items` KHÔNG rỗng — probe vẫn chạy nhưng mọi phép đếm dùng tiền tố `WRK_PROBE58_` để không lẫn dữ liệu thật.");
}
const adminId = userId("admin");
const ids = {
  kh_own: userId("nvkhdemo"), kh_boss: userId("trinhtrench"), da: userId("nvdademo"),
  bch: userId("tkhodemo"), hcpc: userId("thukydemo"),
};
console.log(`Tài khoản kiểm thử: admin=${adminId.slice(0, 12)}… · nvkhdemo=${ids.kh_own.slice(0, 12)}… · trinhtrench=${ids.kh_boss.slice(0, 12)}… · nvdademo=${ids.da.slice(0, 12)}… · tkhodemo=${ids.bch.slice(0, 12)}… · thukydemo=${ids.hcpc.slice(0, 12)}…\n`);

// ---------- 1. FIXTURE: 7 dòng công việc + 2 dòng sự kiện ----------
//  KH → T1 (giao nvkhdemo) · T5 (giao nvkhdemo) · T6 (giao trinhtrench — để phân biệt nhánh kh_truong)
//  DA → T2 (giao nvdademo) · T7 (giao thukydemo — nhánh "chỉ việc của mình" phải thấy DÙ khác phòng)
//  BCH → T3 (giao tkhodemo, project NULL) · T4 (giao cha.ht, thuộc PRJ-DEMO-01)
const FIX = [
  { id: "WRK_PROBE58_T1", dep: "KH", to: "kh_own", project: null, title: "probe58 KH own 1" },
  { id: "WRK_PROBE58_T5", dep: "KH", to: "kh_own", project: null, title: "probe58 KH own 2" },
  { id: "WRK_PROBE58_T6", dep: "KH", to: "kh_boss", project: null, title: "probe58 KH boss" },
  { id: "WRK_PROBE58_T2", dep: "DA", to: "da", project: null, title: "probe58 DA own" },
  { id: "WRK_PROBE58_T7", dep: "DA", to: "hcpc", project: null, title: "probe58 DA assigned to HCPC user" },
  { id: "WRK_PROBE58_T3", dep: "BCH", to: "bch", project: null, title: "probe58 BCH own (project NULL)" },
  { id: "WRK_PROBE58_T4", dep: "BCH", to: null, project: PROJECT_ID, title: "probe58 BCH theo du an" },
];
function insertFixtures() {
  // Chỉ cấp các cột NOT NULL (17 cột) — các cột còn lại của `work_items` cho phép NULL.
  // (Lỗi lượt chạy đầu: liệt kê 32 cột nhưng chỉ 31 giá trị ⇒ ERROR 1136 "Column count doesn't match".)
  for (const f of FIX) {
    const assignee = f.to ? ids[f.to] : userId("cha.ht");
    execSql(`INSERT INTO work_items (id,task_no,department_code,work_group,title,work_step,dedupe_key,
        task_origin,assigned_to,assigned_by,assigned_at,priority,status,progress,active,created_at,updated_at)
      VALUES (${q(f.id)},${q(f.id)},${q(f.dep)},'probe58',${q(f.title)},'buoc-1',${q(f.id)},
        'assigned',${q(assignee)},${q(adminId)},NOW(3),'normal','IN_PROGRESS',0,1,NOW(3),NOW(3))`,
      `insert ${f.id}`);
    if (f.project) {
      execSql(`UPDATE work_items SET project_id=${q(f.project)} WHERE id=${q(f.id)}`, `set project ${f.id}`);
    }
  }
  execSql(`INSERT INTO work_item_events (id,work_item_id,event_type,from_status,to_status,actor_user_id,
      previous_assignee,new_assignee,reason,detail_json,occurred_at,created_at)
    VALUES ('WIE_PROBE58_E1','WRK_PROBE58_T1','ASSIGNED',NULL,'IN_PROGRESS',${q(adminId)},NULL,${q(ids.kh_own)},
      'probe58 KH',NULL,NOW(3),NOW(3))`, "insert event E1 (KH)");
  execSql(`INSERT INTO work_item_events (id,work_item_id,event_type,from_status,to_status,actor_user_id,
      previous_assignee,new_assignee,reason,detail_json,occurred_at,created_at)
    VALUES ('WIE_PROBE58_E2','WRK_PROBE58_T2','ASSIGNED',NULL,'IN_PROGRESS',${q(adminId)},NULL,${q(ids.da)},
      'probe58 DA',NULL,NOW(3),NOW(3))`, "insert event E2 (DA)");
}
function dropFixtures() {
  execSql("DELETE FROM work_item_events WHERE id LIKE 'WIE_PROBE58_%'", "xoa events");
  execSql("DELETE FROM work_items WHERE id LIKE 'WRK_PROBE58_%'", "xoa work_items");
}

// ---------- đăng nhập + đọc bootstrap ----------
async function bootAs(username, password = "Vntech@2026") {
  const login = await fetch(`${BASE}/api/system`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "login", username, password }),
  });
  if (!login.ok) return { error: `HTTP ${login.status}` };
  const cookie = (login.headers.getSetCookie?.() ?? [login.headers.get("set-cookie")])
    .filter(Boolean).map((c) => c.split(";")[0]).join("; ");
  const body = await (await fetch(`${BASE}/api/system`, { headers: { cookie } })).json();
  return body.data ?? { error: "không có .data" };
}
const probeRows = (data) => (data.workItems ?? []).filter((r) => String(r.id).startsWith("WRK_PROBE58_"));
const probeEvents = (data) => (data.workItemEvents ?? []).filter((r) => String(r.id).startsWith("WIE_PROBE58_"));
const show = (rows) => rows.map((r) => String(r.id).replace("WRK_PROBE58_", "")).sort().join(",") || "(không có)";

try {
  insertFixtures();
  check("đã dựng 7 dòng công việc TẠM (KH×3 · DA×2 · BCH×2) + 2 sự kiện",
    Number(sqlOne("SELECT COUNT(*) FROM work_items WHERE id LIKE 'WRK_PROBE58_%'")) === 7,
    `${sqlOne("SELECT COUNT(*) FROM work_items WHERE id LIKE 'WRK_PROBE58_%'")} dòng`);

  // ══════════ ADMIN — nhánh `1=1`: thấy HẾT ══════════
  const admin = await bootAs("admin", "Admin123456@");
  check("ADMIN thấy ĐỦ 7 dòng của probe (nhánh `1=1`)", probeRows(admin).length === 7, show(probeRows(admin)));
  const rows0 = probeRows(admin);
  if (rows0.length) {
    const JS_COLS = ["taskNo", "departmentCode", "workGroup", "title", "description", "projectId", "projectCode",
      "projectName", "sourceModule", "sourceType", "sourceId", "sourceNo", "workStep", "taskOrigin",
      "assignedTo", "assignedToName", "assignedBy", "assignedByName", "assignedAt", "dueAt", "priority",
      "status", "progress", "requiredOutput", "waitingReason", "waitingStartedAt", "submittedAt",
      "completedAt", "active"];
    const withProject = rows0.find((r) => r.projectId);
    const missing = JS_COLS.filter((k) => !(k in rows0[0]));
    check(`mọi dòng có ĐỦ ${JS_COLS.length} cột như JS \`:717\``, missing.length === 0,
      missing.length ? `thiếu: ${missing.join(", ")}` : "đủ");
    check("dòng thuộc dự án có `projectCode`/`projectName` (JOIN projects như JS)",
      Boolean(withProject) && Boolean(withProject?.projectCode), withProject ? `${withProject.projectCode} · ${withProject.projectName}` : "(không có dòng nào thuộc dự án)");
    check("`assignedToName`/`assignedByName` có giá trị (trước đây khoá không tồn tại ⇒ UI trống)",
      Boolean(rows0[0].assignedToName) && Boolean(rows0[0].assignedByName),
      `${rows0[0].assignedToName} / ${rows0[0].assignedByName}`);
  } else {
    skippedCols();
  }
  check("ADMIN thấy đủ 2 SỰ KIỆN của probe", probeEvents(admin).length === 2, `${probeEvents(admin).length} dòng`);

  // ══════════ KH: nhánh `department_code='KH' AND (assigned_to=? OR EXISTS(role kh_truong…))` ══════════
  const khStaff = await bootAs("nvkhdemo");
  if (khStaff.error) { note(`nvkhdemo không đăng nhập được (${khStaff.error}) ⇒ bỏ qua nhánh KH`); }
  else {
    const rows = probeRows(khStaff);
    check("KH (nhân viên, role kh_nv): chỉ thấy công việc KH CỦA MÌNH (T1,T5)", show(rows) === "T1,T5", show(rows));
    check("KH (nhân viên): KHÔNG thấy việc KH giao cho người khác (T6) và KHÔNG thấy DA/BCH",
      !rows.some((r) => ["WRK_PROBE58_T6", "WRK_PROBE58_T2", "WRK_PROBE58_T3", "WRK_PROBE58_T4", "WRK_PROBE58_T7"].includes(String(r.id))),
      show(rows));
    check("KH (nhân viên): KHÔNG thấy sự kiện của công việc ngoài phạm vi",
      !probeEvents(khStaff).some((e) => String(e.id) === "WIE_PROBE58_E2"), `${probeEvents(khStaff).length} sự kiện`);
  }
  const khBoss = await bootAs("trinhtrench");
  if (khBoss.error) { note(`trinhtrench không đăng nhập được (${khBoss.error}) ⇒ bỏ qua nhánh KH-trưởng`); }
  else {
    const rows = probeRows(khBoss);
    check("KH-TRƯỞNG (role kh_truong): thấy MỌI việc KH (T1,T5,T6) — đúng nhánh `EXISTS(role kh_truong)`",
      show(rows) === "T1,T5,T6", show(rows));
    check("KH-TRƯỞNG: vẫn KHÔNG thấy DA/BCH", !rows.some((r) => ["WRK_PROBE58_T2", "WRK_PROBE58_T3", "WRK_PROBE58_T4", "WRK_PROBE58_T7"].includes(String(r.id))), show(rows));
  }

  // ══════════ DA: nhánh `department_code='DA' AND assigned_to=?` ══════════
  const da = await bootAs("nvdademo");
  if (da.error) { note(`nvdademo không đăng nhập được (${da.error}) ⇒ bỏ qua nhánh DA`); }
  else {
    const rows = probeRows(da);
    check("DA: chỉ thấy việc DA CỦA MÌNH (T2) — KHÔNG thấy T7 (giao người khác)", show(rows) === "T2", show(rows));
    check("DA: KHÔNG thấy KH/BCH", !rows.some((r) => ["WRK_PROBE58_T1", "WRK_PROBE58_T5", "WRK_PROBE58_T6", "WRK_PROBE58_T3", "WRK_PROBE58_T4"].includes(String(r.id))), show(rows));
    check("DA: KHÔNG thấy sự kiện của việc KH", !probeEvents(da).some((e) => String(e.id) === "WIE_PROBE58_E1"), `${probeEvents(da).length} sự kiện`);
  }

  // ══════════ BCH: nhánh `department_code='BCH' AND (assigned_to=? OR project_id IS NULL OR project_id IN …)` ══════════
  const bch = await bootAs("tkhodemo");
  if (bch.error) { note(`tkhodemo không đăng nhập được (${bch.error}) ⇒ bỏ qua nhánh BCH`); }
  else {
    const rows = probeRows(bch);
    check("BCH (phòng 'Ban chỉ huy công trường'): thấy T3 (việc của mình, project NULL) + T4 (BCH thuộc dự án trong phạm vi)",
      show(rows) === "T3,T4", show(rows));
    check("BCH: KHÔNG thấy KH/DA", !rows.some((r) => ["WRK_PROBE58_T1", "WRK_PROBE58_T5", "WRK_PROBE58_T6", "WRK_PROBE58_T2", "WRK_PROBE58_T7"].includes(String(r.id))), show(rows));
  }

  // ══════════ NHÁNH CUỐI: `assigned_to=?` (chỉ việc CỦA MÌNH, bất kể phòng) ══════════
  const hcpc = await bootAs("thukydemo");
  if (hcpc.error) { note(`thukydemo không đăng nhập được (${hcpc.error}) ⇒ bỏ qua nhánh cuối`); }
  else {
    const rows = probeRows(hcpc);
    check("Tài khoản HCPC (không thuộc KH/DA/BCH): chỉ thấy việc giao CHO MÌNH (T7), dù T7 mang mã phòng DA",
      show(rows) === "T7", show(rows));
  }
} catch (error) {
  check("probe chạy trọn vẹn (không ném lỗi)", false, String(error?.message ?? error));
} finally {
  dropFixtures();
  const after = {
    work_items: Number(sqlOne("SELECT COUNT(*) FROM work_items")),
    work_item_events: Number(sqlOne("SELECT COUNT(*) FROM work_item_events")),
  };
  console.log(`\nSAU KHI DỌN: ${JSON.stringify(after)}`);
  check("dọn sạch: `work_items` + `work_item_events` về ĐÚNG số dòng ban đầu",
    after.work_items === before.work_items && after.work_item_events === before.work_item_events && cleanupFailures.length === 0,
    cleanupFailures.length ? cleanupFailures.join(" · ") : `khớp (${after.work_items} · ${after.work_item_events})`);
}

function skippedCols() { note("không có dòng nào để kiểm tập cột"); }

const failed = results.filter((r) => !r.ok);
console.log(`\n═══ KẾT QUẢ: ${results.length - failed.length}/${results.length} ĐẠT ═══`);
if (failed.length) { console.log("MỤC HỎNG:"); for (const f of failed) console.log(`  • ${f.name} — ${f.detail}`); }
console.log("ĐỐI CHỨNG DƯƠNG: chạy probe này TRƯỚC khi vá ⇒ MỌI tài khoản đều thấy 7/7 dòng (Java không có WHERE).");
console.log("GIỚI HẠN: probe dựng dữ liệu TẠM rồi xoá; nhánh nào tài khoản không đăng nhập được sẽ được in rõ là 'bỏ qua'.");
process.exit(failed.length ? 1 : 0);
