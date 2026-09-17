// TASK-073 — CỔNG cho `teamMembers`: khoá Java-only CHƯA TỪNG ĐƯỢC ĐO
//   (bảng `team_members` = 0 dòng ⇒ mọi cổng trước đây đều "bỏ qua, không tính ĐẠT").
//
// Vì sao cần: TASK-070 in thẳng "2 phép đo KHÔNG thực hiện được: teamMembers (bảng 0 dòng)".
// Một khoá có SQL đúng/sai KHÔNG THỂ biết nếu chưa bao giờ có dữ liệu ⇒ phải CẮM FIXTURE
// (cách đã dùng cho `workItemEvents` ở probe-task058) rồi đo bằng dữ liệu thật.
//
// Đo được gì:
//   1. 11 cột trả về có DỮ LIỆU THẬT không (đối chiếu MySQL bằng CÂU VIẾT KHÁC DẠNG).
//   2. `LEFT JOIN users` có giữ dòng MỒ CÔI không — nếu Java dùng INNER JOIN thì dòng biến mất
//      (đúng lớp lỗi "thiếu DÒNG" đã gặp ở `boqItems`).
//   3. `ORDER BY tm.team_id,tm.joined_at` có đúng không.
//   4. `active` là `tinyint(1)` ⇒ JDBC có thể trả BOOLEAN (lớp lỗi TASK-052) — đo KIỂU thật.
//   5. Tài khoản KHÔNG phải admin có nhận được dữ liệu này không (kiểm RÒ RỈ).
//
// DỌN DẸP: fixture nằm trong `finally`, và khẳng định số dòng TRỞ VỀ ĐÚNG MỨC NỀN.

import { execFileSync } from "node:child_process";

const BASE = process.argv[2] || "http://127.0.0.1:18081";
const MYSQL = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
const ID_A = "PRB073-A";
const ID_B = "PRB073-B";
const ORPHAN_USER = "PRB073-NOUSER";
const J_A = "2026-01-01 08:00:00.000";
const J_B = "2026-01-02 08:00:00.000";

const sql = (query) => execFileSync(MYSQL, ["--default-character-set=utf8mb4", "-uvntech", "-pvntech",
  "vntech_erp", "--batch", "--raw", "--skip-column-names", "-e", query], { encoding: "utf8" }).trim();
const sqlRows = (query) => sql(query).split(/\r?\n/).filter(Boolean).map((l) => l.split("\t"));
const sqlOne = (query) => { const r = sqlRows(query); return r.length ? r[0][0] : ""; };
const q = (v) => `'${String(v).replace(/'/g, "''")}'`;

const results = [];
const check = (name, ok, detail) => {
  results.push({ name, ok });
  console.log(`  ${ok ? "ĐẠT" : "HỎNG"}  ${name}${detail ? " — " + detail : ""}`);
};
const note = (m) => console.log(`  (bỏ qua)  ${m}`);

async function boot(session) {
  const login = await fetch(`${BASE}/api/system`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "login", username: session.username, password: session.password }),
  });
  const cookie = (login.headers.get("set-cookie") || "").split(";")[0];
  const res = await fetch(`${BASE}/api/system`, { headers: { cookie } });
  const body = await res.json();
  const data = body?.data || body;
  return { status: res.status, data, cookie };
}

const ADMIN = { username: "admin", password: "Admin123456@" };
const NONADMIN = { username: "thukydemo", password: "Vntech@2026" };

let baseline = -1;
let teamId = "";
let realUser = null;
let inserted = false;

try {
  console.log("═══ TASK-073 · CỔNG `teamMembers` (khoá JAVa-only, bảng chưa từng có dữ liệu) ═══\n");

  baseline = Number(sqlOne("SELECT COUNT(*) FROM team_members"));
  teamId = sqlOne("SELECT id FROM teams ORDER BY created_at LIMIT 1");
  console.log(`Mức nền: team_members = ${baseline} dòng · teams = ${sqlOne("SELECT COUNT(*) FROM teams")} · users = ${sqlOne("SELECT COUNT(*) FROM users")}`);
  if (!teamId) {
    console.log("\nKHÔNG THỂ ĐO: bảng `teams` rỗng ⇒ `team_members.team_id` NOT NULL nên không cắm được fixture.");
    note("Nói rõ: phép đo KHÔNG thực hiện được — KHÔNG tính là ĐẠT.");
    process.exit(2);
  }

  // Người dùng THẬT để đối chiếu từng trường (chọn theo username cho tất định).
  const row = sqlRows("SELECT id,full_name,employee_code,role,department FROM users WHERE username='nvkhdemo' ORDER BY id")[0]
    || sqlRows("SELECT id,full_name,employee_code,role,department FROM users ORDER BY username LIMIT 1")[0];
  realUser = { id: row[0], fullName: row[1], employeeCode: row[2], role: row[3], department: row[4] };
  console.log(`Người dùng thật dùng làm mốc: ${realUser.id} · role=${realUser.role}\n`);

  // ── CẮM FIXTURE ───────────────────────────────────────────────────────────────
  sql(`INSERT INTO team_members (id,team_id,user_id,role_in_team,joined_at,left_at,active,created_at,updated_at) VALUES
       (${q(ID_A)},${q(teamId)},${q(realUser.id)},'PROBE-073-A',${q(J_A)},NULL,1,${q(J_A)},${q(J_A)}),
       (${q(ID_B)},${q(teamId)},${q(ORPHAN_USER)},'PROBE-073-B',${q(J_B)},NULL,0,${q(J_B)},${q(J_B)})`);
  inserted = true;
  check("C0 · fixture đã cắm (2 dòng tạm)", Number(sqlOne(`SELECT COUNT(*) FROM team_members WHERE id IN (${q(ID_A)},${q(ID_B)})`)) === 2,
    `tổng team_members = ${sqlOne("SELECT COUNT(*) FROM team_members")}`);

  // ── ĐỌC QUA API ───────────────────────────────────────────────────────────────
  const admin = await boot(ADMIN);
  const mine = (admin.data?.teamMembers || []).filter((r) => [ID_A, ID_B].includes(String(r.id)));
  check("C1 · API trả ĐÚNG 2 dòng fixture cho admin (khoá có dữ liệu thật)", mine.length === 2,
    `tổng teamMembers API = ${(admin.data?.teamMembers || []).length} · khớp fixture = ${mine.length}`);

  if (mine.length === 2) {
    const a = mine.find((r) => String(r.id) === ID_A);
    const b = mine.find((r) => String(r.id) === ID_B);

    // Đối chiếu TỪNG TRƯỜNG bằng CÂU VIẾT KHÁC DẠNG (subquery thay vì JOIN role_catalog).
    const ref = sqlRows(`SELECT u.full_name,u.employee_code,u.role,
                                (SELECT name FROM role_catalog WHERE code=u.role) AS rn,u.department
                         FROM users u WHERE u.id=${q(realUser.id)}`)[0];
    const eq = (label, apiVal, mysqlVal) => check(`C2.${label} · API = MySQL`, String(apiVal ?? "") === String(mysqlVal ?? ""),
      `API=${JSON.stringify(apiVal ?? null)} · MySQL=${JSON.stringify(mysqlVal ?? null)}`);

    eq("fullName", a.fullName, ref[0]);
    eq("employeeCode", a.employeeCode, ref[1]);
    eq("role", a.role, ref[2]);
    eq("roleName (COALESCE rc.name,u.role)", a.roleName, ref[3] ?? ref[2]);
    eq("department", a.department, ref[4]);
    eq("teamId", a.teamId, teamId);
    eq("roleInTeam", a.roleInTeam, "PROBE-073-A");
    check("C2.joinedAt · có giá trị thật", Boolean(a.joinedAt) && String(a.joinedAt).startsWith("2026-01-01"), `joinedAt=${a.joinedAt}`);
    check("C2.leftAt · NULL giữ nguyên là null (không thành chuỗi 'NULL')", a.leftAt === null || a.leftAt === undefined || a.leftAt === "", `leftAt=${JSON.stringify(a.leftAt ?? null)}`);

    // Lớp lỗi TASK-052: tinyint(1) ⇒ JDBC trả BOOLEAN. Đo KIỂU, không đoán.
    const activeLen = typeof a.active;
    check("C3 · `active` ĐÚNG GIÁ TRỊ và KIỂU đo được (tinyint(1) ⇒ boolean)", a.active === true || a.active === 1 || a.active === "1",
      `typeof=${activeLen} · giá trị=${JSON.stringify(a.active)} · dòng B active=${JSON.stringify(b.active)}`);

    // Dòng MỒ CÔI: nếu Java dùng INNER JOIN thì dòng này BIẾN MẤT (lớp lỗi "thiếu DÒNG").
    check("C4 · dòng MỒ CÔI vẫn được trả về (LEFT JOIN, không phải INNER JOIN)", Boolean(b),
      b ? `id=${b.id} · fullName=${JSON.stringify(b.fullName ?? null)}` : "DÒNG BỊ MẤT");
    if (b) check("C5 · dòng mồ côi có trường người dùng RỖNG (không bịa dữ liệu)",
      !b.fullName && !b.employeeCode, `fullName=${JSON.stringify(b.fullName ?? null)} · employeeCode=${JSON.stringify(b.employeeCode ?? null)}`);

    // Thứ tự: cùng team ⇒ joined_at tăng dần ⇒ A trước B.
    const idxA = (admin.data.teamMembers || []).findIndex((r) => String(r.id) === ID_A);
    const idxB = (admin.data.teamMembers || []).findIndex((r) => String(r.id) === ID_B);
    check("C6 · ORDER BY joined_at (A 01/01 đứng trước B 02/01)", idxA >= 0 && idxB >= 0 && idxA < idxB, `vị trí A=${idxA} · B=${idxB}`);
  } else {
    note("C2–C6 KHÔNG thực hiện được vì C1 không đạt — không tính là ĐẠT.");
  }

  // ── ĐỐI CHỨNG: chứng minh cổng CÓ THỂ BÁO HỎNG ────────────────────────────────
  // Nếu không có phần này thì "17/17 ĐẠT" KHÔNG chứng minh được gì (bài học #25 của dự án:
  // công cụ luôn báo sạch là công cụ vô dụng).
  const ctrl = (name, sameExpected, apiVal, mysqlVal) => {
    const same = String(apiVal ?? "") === String(mysqlVal ?? "");
    check(`ĐC · ${name}`, same === sameExpected,
      `API=${JSON.stringify(apiVal ?? null)} vs MySQL=${JSON.stringify(mysqlVal ?? null)} ⇒ ${same ? "KHỚP" : "LỆCH"}`);
  };
  ctrl("hai giá trị giống nhau ⇒ phải coi là KHỚP", true, "A", "A");
  ctrl("hai giá trị khác nhau ⇒ phải coi là LỆCH", false, "A", "B");
  ctrl("null (API) vs chuỗi 'NULL' (mysql --raw) ⇒ phải coi là LỆCH", false, null, "NULL");
  if (mine.length === 2) {
    const a2 = mine.find((r) => String(r.id) === ID_A);
    ctrl("CỐ Ý so SAI CẶP CỘT (fullName ↔ employeeCode) ⇒ phải coi là LỆCH", false, a2.fullName, a2.employeeCode);
  }

  // ── KHÔNG RÒ RỈ ───────────────────────────────────────────────────────────────
  const non = await boot(NONADMIN);
  const leaked = (non.data?.teamMembers || []).filter((r) => [ID_A, ID_B].includes(String(r.id)));
  check("C7 · tài khoản KHÔNG phải admin KHÔNG nhận dữ liệu này", leaked.length === 0,
    `khoá có trong payload: ${Object.prototype.hasOwnProperty.call(non.data || {}, "teamMembers")} · tổng dòng = ${(non.data?.teamMembers || []).length} · rò rỉ = ${leaked.length}`);

  // ── KHOÁ NÀY LÀ JAVA-ONLY ─────────────────────────────────────────────────────
  note("JS tham chiếu `scripts/system-route.mjs` KHÔNG có `team_members`/`teamMembers` ⇒ khoá này Java-only;");
  note("vì vậy KHÔNG có bản JS để so, và UI phải coi là tuỳ chọn — đúng khai báo `teamMembers?: Row[]`.");

} catch (error) {
  check("NGOẠI LỆ khi chạy", false, String(error && error.message || error));
} finally {
  if (inserted) {
    try {
      sql(`DELETE FROM team_members WHERE id IN (${q(ID_A)},${q(ID_B)})`);
      const after = Number(sqlOne("SELECT COUNT(*) FROM team_members"));
      check("C8 · dọn sạch fixture — số dòng TRỞ VỀ MỨC NỀN", after === baseline, `sau dọn = ${after} · mức nền = ${baseline}`);
    } catch (error) {
      check("C8 · dọn sạch fixture", false, String(error && error.message || error));
    }
  } else {
    note("Không có fixture nào được cắm ⇒ không cần dọn.");
  }
  const failed = results.filter((r) => !r.ok);
  console.log(`\nKẾT QUẢ: ${results.length - failed.length}/${results.length} ĐẠT`);
  if (failed.length) console.log("HỎNG: " + failed.map((r) => r.name).join(" · "));
  process.exit(failed.length ? 1 : 0);
}
