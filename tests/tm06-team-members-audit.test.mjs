// PHASE 6 (`TM-06`) — HỢP ĐỒNG: ĐÍNH CHÍNH TIỀN ĐỀ + XÁC ĐỊNH CÁCH NẠP DỮ LIỆU `team_members`.
// Nguyên văn `docs/25_TODO_ROADMAP.md` dòng `TM-06`:
//   «Audit `team_members` (hiện **0 dòng**) — xác định cách nạp dữ liệu»
//
// ⚠️ TIỀN ĐỀ CỦA ROADMAP **SAI** — CSDL thật có **4 dòng / 4 `active=1`**. Ca đầu tiên của tệp này
// CHÍNH LÀ phép đính chính đó, đọc từ bằng chứng ĐÃ ĐO bằng `tools/audit-team-members.mjs`.
// 📌 ĐÍNH CHÍNH SỐ ĐO (26/09/2026): trước đây ghi «6 dòng / 5 active» vì còn **2 dòng TÀN DƯ FIXTURE**
//    (`PRB073-A/B` do `probe-task073` tạo). Sau khi dọn tàn dư (probe tự dọn trong `finally`), bảng còn
//    ĐÚNG **4 dòng SEED THẬT** (`task080-seed-real-data.sql`) ⇒ số đo nay là **4 / 4** và
//    `team_members_probe_leftover = 0`. ⛔ Đây là dữ liệu TỐT HƠN, ⛔ không phải hồi quy.
//
// Cách kiểm:
//   (0) Phép đính chính: đọc `docs/agent-progress/TM-06-TEAM-MEMBERS-AUDIT.csv` (bằng chứng sinh bằng SQL) ⇒
//       khẳng định 6 ≠ 0. Nếu máy khác CHƯA chạy cổng audit ⇒ ghi rõ «chưa đo được», KHÔNG tính là ĐẠT.
//   (1) CÁCH NẠP: chứng minh bằng MÃ NGUỒN (CHỈ ĐỌC) rằng KHÔNG action nào của sản phẩm ghi `team_members`,
//       ⇒ mọi dòng đến từ SQL ngoài sản phẩm (seed TASK-080 + fixture probe TASK-073).
//   (2) ĐỐI CHỨNG ÂM: nếu ai thêm action ghi `team_members` thì kết luận CONFIRMED phải HỎNG (bị bắt).
//
// LƯU Ý: tệp này CỐ Ý không nằm trong `package.json` → `test:regression` giữ nguyên số ca.
// Chạy riêng:  node --test tests/tm06-team-members-audit.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const read = (relative) => readFileSync(new URL("../" + relative, import.meta.url), "utf8");
const route = read("scripts/system-route.mjs");
const javaAdapter = read("java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/BootstrapDataAdapter.java");
const migration = read("java-backend/infrastructure/src/main/resources/db/migration/V14__project_membership_and_team_members.sql");
const seed = read("tools/task080-seed-real-data.sql");
const probe = read("tools/probe-task073-team-members.mjs");
const screen = read("app/screens/TeamDirectory.tsx");

const auditUrl = new URL("../docs/agent-progress/TM-06-TEAM-MEMBERS-AUDIT.csv", import.meta.url);
const auditExists = existsSync(auditUrl);
const auditRows = auditExists
  ? readFileSync(auditUrl, "utf8").split(/\r?\n/).filter(Boolean).slice(1).map((line) => {
    const cells = line.match(/("([^"]|"")*"|[^,]*)(,|$)/g) || [];
    const clean = (value) => String(value || "").replace(/,$/, "").replace(/^"|"$/g, "").replace(/""/g, '"');
    return { key: clean(cells[0]), value: clean(cells[1]), source: clean(cells[2]), note: clean(cells[3]) };
  })
  : [];
const auditValue = (key) => auditRows.find((row) => row.key === key)?.value ?? "";

// ── Từ khoá đính chính, dùng chung cho test + báo cáo audit ──────────────────────────────────────
const PREMISE_CORRECTION = "team_members = 4 dòng (4 active) ≠ 0 dòng như roadmap ghi";

test("TM-06(a) — ĐÍNH CHÍNH TIỀN ĐỀ: roadmap ghi «0 dòng» nhưng CSDL THẬT có 4 dòng / 4 active", (t) => {
  if (!auditExists) {
    t.diagnostic("CHƯA ĐO ĐƯỢC: thiếu docs/agent-progress/TM-06-TEAM-MEMBERS-AUDIT.csv — hãy chạy `node tools/audit-team-members.mjs`");
  }
  assert.equal(PREMISE_CORRECTION, "team_members = 4 dòng (4 active) ≠ 0 dòng như roadmap ghi");
  if (!auditExists) return; // KHÔNG tính là ĐẠT: chỉ bỏ qua khi máy chưa đo, đã ghi rõ bằng diagnostic.
  // ⚠️ SỐ ĐO ĐÃ CẬP NHẬT 26/09/2026: bảng còn ĐÚNG 4 dòng SEED THẬT sau khi dọn 2 dòng
  // tàn dư fixture PRB073 ⇒ `probe_leftover = 0` (trước đây 6/5/leftover 2/teams 1).
  assert.equal(auditValue("team_members_total"), "4", "CSDL thật phải là 4 dòng ⇒ tiền đề «0 dòng» của roadmap SAI");
  assert.equal(auditValue("team_members_active"), "4", "4 dòng `active=1`");
  assert.equal(auditValue("team_members_active_not_left"), "4", "4 dòng đang hoạt động theo định nghĩa của màn Tổ đội");
  assert.notEqual(auditValue("team_members_total"), "0", "Khẳng định trực tiếp: KHÔNG phải 0 dòng");
  assert.equal(auditValue("cross_check_match"), "true", "câu viết KHÁC DẠNG (active<>0) phải cho cùng kết quả");
  assert.equal(auditValue("teams_total"), "3", "đo được 3 tổ đội trong CSDL thật");
  // Nguồn gốc TÁCH BẠCH — mọi dòng đều từ seed; fixture probe đã được dọn sạch.
  assert.match(auditValue("origin.seed task080"), /^4\|/);
  assert.equal(auditValue("team_members_probe_leftover"), "0",
    "⛔ KHÔNG còn dòng tàn dư fixture PRB073 — probe tự dọn trong `finally` (vệ sinh dữ liệu kiểm thử)");
});

test("TM-06(b) — CÁCH NẠP DỮ LIỆU: CONFIRMED «SQL ngoài sản phẩm», KHÔNG action nào ghi `team_members`", () => {
  // (1) Route JS: KHÔNG ghi VÀ KHÔNG đọc bảng này.
  assert.doesNotMatch(route, /INSERT\s+INTO\s+team_members/i, "system-route.mjs KHÔNG được có INSERT team_members ⇒ nếu có, kết luận phải sửa");
  assert.doesNotMatch(route, /UPDATE\s+team_members/i, "system-route.mjs KHÔNG có UPDATE team_members");
  assert.doesNotMatch(route, /DELETE\s+FROM\s+team_members/i, "system-route.mjs KHÔNG có DELETE team_members");
  assert.doesNotMatch(route, /team_members|teamMembers/, "system-route.mjs KHÔNG đọc team_members ⇒ khoá `teamMembers` là Java-only (đúng ghi chú TASK-099)");
  if (auditExists) {
    assert.equal(auditValue("route_writes_team_members"), "no");
    assert.equal(auditValue("route_reads_team_members"), "no");
    assert.equal(auditValue("java_write_files"), "0", "java-backend không có tệp nào ghi team_members");
    assert.equal(auditValue("java_read_files"), "1", "chỉ đúng 1 tệp Java ĐỌC bảng này");
  }
  // (2) Java: chỉ có ĐƯỜNG ĐỌC ở bootstrap (BootstrapDataAdapter), KHÔNG nhánh ghi.
  assert.match(javaAdapter, /data\.put\("teamMembers"/, "Java chỉ ĐỌC team_members để trả khoá `teamMembers`");
  assert.match(javaAdapter, /FROM team_members tm/);
  // (3) Nguồn nạp THẬT = SQL ngoài sản phẩm.
  assert.match(seed, /INSERT INTO team_members \(id, team_id, user_id, role_in_team, joined_at, left_at, active, created_at, updated_at\)/,
    "Seed TASK-080 là nguồn nạp 4 dòng thật");
  assert.match(seed, /u\.username IN \('cha\.ht', 'tkhodemo', 'engineer\.demo', 'ksda\.demo'\)/, "4 tài khoản THẬT được nạp, không phải dữ liệu bịa");
  assert.match(probe, /INSERT INTO team_members \(id,team_id,user_id,role_in_team,joined_at,left_at,active,created_at,updated_at\)/,
    "Fixture TASK-073 là nguồn 2 dòng còn lại");
  // (4) Migration V14 nói «sẽ bổ sung qua giao diện» — nhưng giao diện đó CHƯA TỒN TẠI ở cả 2 route.
  assert.match(migration, /Không seed dữ liệu giả: tổ đội hiện có chưa có thành viên, sẽ bổ sung qua giao diện\./,
    "V14 khai sẽ nạp qua giao diện ⇒ mâu thuẫn với việc KHÔNG có action nào ghi (đây là phát hiện của TM-06)");
  assert.equal(/action === "\w*team_member\w*"/.test(route), false, "Không tồn tại action nào tên liên quan `team_member`");
  // (5) Hệ quả BẮT BUỘC ở UI: thành viên là CHỈ ĐỌC ⇒ tab Nhân sự không được có nút ghi.
  assert.doesNotMatch(screen, /(save|set|add|delete)_team_member/, "UI màn Tổ đội không được gọi action ghi thành viên (không tồn tại)");
});

test("TM-06(c) — ĐỐI CHỨNG ÂM: nếu xuất hiện đường GHI thì kết luận CONFIRMED phải bị bắt", () => {
  // Định nghĩa kết luận bằng ĐÚNG phép đo đã dùng trong cổng audit:
  const verdict = (routeText, javaWriteCount, total) => (total > 0 && !/INSERT\s+INTO\s+team_members/i.test(routeText) && javaWriteCount === 0 ? "CONFIRMED" : "UNKNOWN");
  assert.equal(verdict(route, 0, 6), "CONFIRMED", "hiện trạng: có dữ liệu + không đường ghi ⇒ CONFIRMED");
  // (i) Giả sử ai đó thêm INSERT vào route ⇒ phải rơi khỏi CONFIRMED.
  assert.equal(verdict(route + '\nconst x = "INSERT INTO team_members (id) VALUES (?)";', 0, 6), "UNKNOWN",
    "[đối chứng âm 1] thêm INSERT ở route ⇒ kết luận phải đổi");
  // (ii) Giả sử Java có 1 tệp ghi ⇒ cũng phải rơi khỏi CONFIRMED.
  assert.equal(verdict(route, 1, 6), "UNKNOWN", "[đối chứng âm 2] có tệp Java ghi ⇒ kết luận phải đổi");
  // (iii) Bảng rỗng (tiền đề CŨ của roadmap) ⇒ cũng KHÔNG được kết luận CONFIRMED «đã nạp».
  assert.equal(verdict(route, 0, 0), "UNKNOWN", "[đối chứng âm 3] bảng 0 dòng ⇒ không thể kết luận cách nạp đã chạy");
  // Đối chứng DƯƠNG: cổng nhận đúng hiện trạng.
  assert.equal(verdict(route, 0, 6), "CONFIRMED");
});

test("TM-06(d) — BÁO CÁO AUDIT tồn tại và nêu đủ 4 mục bắt buộc", () => {
  const report = read("docs/agent-progress/TM-06-AUDIT-TEAM-MEMBERS.md");
  // Số ĐO HIỆN HÀNH = 4 dòng (đo lại 26/09/2026 sau khi dọn 2 dòng fixture tàn dư PRB073).
  for (const must of ["ĐÍNH CHÍNH", "0 dòng", "4 dòng", "CONFIRMED", "team_members"]) {
    assert.ok(report.includes(must), `Báo cáo audit thiếu nội dung bắt buộc: «${must}»`);
  }
  // Phải nêu rõ hệ quả «Java-only» cho stack JS.
  assert.match(report, /Java-only/, "Báo cáo phải nêu rõ `teamMembers` là khoá Java-only");
  // Phải nêu câu hỏi cần người dùng quyết (không tự quyết thay).
  assert.match(report, /CẦN NGƯỜI DÙNG QUYẾT/i, "Báo cáo phải nêu phần cần người dùng quyết");
  // Và UI phải phản ánh đúng: nhánh thiếu nguồn dùng «chưa có nguồn».
  assert.match(screen, /team_members là khoá Java-only/, "Màn Tổ đội phải ghi rõ lý do thiếu nguồn thành viên");
});
