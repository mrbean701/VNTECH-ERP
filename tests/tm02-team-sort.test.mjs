// PHASE 6 (`TM-02`) — HỢP ĐỒNG: THỨ TỰ ƯU TIÊN CỦA DANH SÁCH TỔ ĐỘI.
// Nguyên văn `docs/25_TODO_ROADMAP.md` dòng `TM-02`:
//   «Ưu tiên sắp xếp: ĐANG HOẠT ĐỘNG → hoạt động gần nhất ↓ → ngừng»
//
// Cách kiểm: TRÍCH hàm so sánh `tmCompare` của `app/screens/TeamDirectory.tsx` (khối thuần TM-PURE-BEGIN/END),
// dịch TS→JS bằng esbuild rồi CHẠY THẬT. Bộ ca gồm ĐỐI CHỨNG ÂM bắt buộc: mỗi quy tắc phải có một ca mà
// "thứ tự SAI" bị chính hàm này bắt (nếu không, "test xanh" không chứng minh được gì — bài học #25 của dự án).
//
// LƯU Ý: tệp này CỐ Ý không nằm trong `package.json` → `test:regression` giữ nguyên số ca.
// Chạy riêng:  node --test tests/tm02-team-sort.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import esbuild from "esbuild";

const screen = readFileSync(new URL("../app/screens/TeamDirectory.tsx", import.meta.url), "utf8");
assert.equal((screen.match(/^\/\/ TM-PURE-BEGIN$/gm) || []).length, 1, "Mốc TM-PURE-BEGIN phải là DÒNG RIÊNG, đúng 1 lần");
assert.equal((screen.match(/^\/\/ TM-PURE-END$/gm) || []).length, 1, "Mốc TM-PURE-END phải là DÒNG RIÊNG, đúng 1 lần");

function loadPure() {
  const blockStart = screen.search(/^\/\/ TM-PURE-BEGIN$/m);
  const blockEnd = screen.search(/^\/\/ TM-PURE-END$/m);
  const block = screen.slice(blockStart + "// TM-PURE-BEGIN".length, blockEnd);
  const js = esbuild.transformSync(block, { loader: "ts" }).code;
  const names = ["tmCompare", "teamListRows", "TEAM_RANK_ACTIVE", "TEAM_RANK_STOPPED", "tmIsActive"];
  return new Function(`${js}\nreturn { ${names.join(", ")} };`)();
}

const codeOf = (list) => list.map((row) => row.code);

test("TM-02 — 3 khoá ưu tiên đúng thứ tự nguyên văn: ĐANG HOẠT ĐỘNG → gần nhất ↓ → ngừng", () => {
  const { tmCompare, TEAM_RANK_ACTIVE, TEAM_RANK_STOPPED } = loadPure();
  assert.equal(TEAM_RANK_ACTIVE, 0, "hạng của tổ đội ĐANG HOẠT ĐỘNG phải nhỏ hơn (đứng trước)");
  assert.equal(TEAM_RANK_STOPPED, 1);
  // (1) đang hoạt động THẮNG tổ đội đã ngừng — kể cả khi tổ đội đã ngừng "mới" hơn.
  assert.ok(tmCompare({ active: true, lastAt: "2026-01-01", code: "A" }, { active: false, lastAt: "2026-09-09", code: "B" }) < 0,
    "[đối chứng âm 1] tổ đội ĐÃ NGỪNG có hoạt động mới hơn vẫn phải xếp SAU");
  // (2) cùng đang hoạt động ⇒ hoạt động gần nhất ↓ (mới hơn đứng trước).
  assert.ok(tmCompare({ active: true, lastAt: "2026-09-05", code: "A" }, { active: true, lastAt: "2026-09-01", code: "B" }) < 0,
    "[đối chứng âm 2] trong nhóm đang hoạt động, ngày CŨ hơn không được đứng trước");
  // (3) cùng đang hoạt động ⇒ thiếu ngày hoạt động xếp SAU ngày có thật.
  assert.ok(tmCompare({ active: true, lastAt: "", code: "A" }, { active: true, lastAt: "2026-09-01", code: "B" }) > 0,
    "[đối chứng âm 3] tổ đội không có nguồn hoạt động không được nhảy lên đầu");
});

test("TM-02 — BỘ CA THẬT: sắp xếp lẫn lộn trạng thái + ngày, kiểm từng vị trí", () => {
  const { teamListRows } = loadPure();
  const teams = [
    { id: "T1", code: "TD-C", name: "C", trade: "Điện", projectId: "P1", active: 1 },
    { id: "T2", code: "TD-A", name: "A", trade: "Điện", projectId: "P1", active: 1 },
    { id: "T3", code: "TD-D", name: "D", trade: "Điện", projectId: "P1", active: 0 },
    { id: "T4", code: "TD-B", name: "B", trade: "Điện", projectId: "P1", active: 1 },
    { id: "T5", code: "TD-E", name: "E", trade: "Điện", projectId: "P1", active: 0 },
  ];
  const issues = [
    { id: "I1", teamId: "T1", issuedAt: "2026-09-02", status: "posted" },
    { id: "I2", teamId: "T2", issuedAt: "2026-09-08", status: "posted" },
    { id: "I3", teamId: "T3", issuedAt: "2026-09-30", status: "posted" },  // tổ đội ĐÃ NGỪNG nhưng có ngày MỚI NHẤT
    { id: "I4", teamId: "T5", issuedAt: "2026-09-20", status: "posted" },  // tổ đội đã ngừng, ngày cũ hơn T3
    // T4 KHÔNG có phiếu nào ⇒ lastAt = "" (chưa có nguồn hoạt động) ⇒ đứng cuối nhóm đang hoạt động
  ];
  const rows = teamListRows({ teams, issues, returns: [], projects: [{ id: "P1", code: "PRJ-1", name: "Dự án 1" }] });
  assert.deepEqual(codeOf(rows), ["TD-A", "TD-C", "TD-B", "TD-D", "TD-E"],
    "Kỳ vọng: nhóm ĐANG HOẠT ĐỘNG trước, trong nhóm theo ngày GIẢM DẦN — A(09-08) · C(09-02) · B(KHÔNG có ngày, xếp cuối nhóm); "
    + "rồi nhóm ĐÃ NGỪNG cũng theo ngày GIẢM DẦN — D(09-30) · E(09-20). "
    + "Điểm chốt: D(09-30) và E(09-20) MỚI HƠN C(09-02) và B nhưng VẪN đứng sau TẤT CẢ tổ đội đang hoạt động.");
  // Khẳng định LẠI bằng bất biến (không chỉ so mảng): mọi dòng đang hoạt động phải đứng TRƯỚC mọi dòng đã ngừng.
  const firstStopped = rows.findIndex((row) => !row.active);
  const lastActive = rows.map((row) => row.active).lastIndexOf(true);
  assert.ok(firstStopped > lastActive, "Dòng ĐANG HOẠT ĐỘNG cuối cùng phải đứng trước dòng ĐÃ NGỪNG đầu tiên");
});

test("TM-02 — ĐỐI CHỨNG ÂM: thứ tự SAI phải bị bắt", () => {
  const { teamListRows, tmCompare } = loadPure();
  const teams = [
    { id: "T1", code: "TD-A", name: "A", trade: "Điện", projectId: "P1", active: 1 },
    { id: "T2", code: "TD-B", name: "B", trade: "Điện", projectId: "P1", active: 0 },
  ];
  const rows = teamListRows({ teams, issues: [{ id: "I1", teamId: "T2", issuedAt: "2026-09-30" }, { id: "I2", teamId: "T1", issuedAt: "2026-01-01" }], returns: [], projects: [] });
  const wrongOrder = ["TD-B", "TD-A"];   // thứ tự SAI: đã ngừng đứng trước đang hoạt động
  assert.notDeepEqual(codeOf(rows), wrongOrder, "[đối chứng âm] cổng phải BẮT được thứ tự sai");
  assert.deepEqual(codeOf(rows), ["TD-A", "TD-B"], "thứ tự ĐÚNG: đang hoạt động trước, dù ngày cũ hơn");

  // Bảng đối chứng máy móc: khẳng định dấu của hàm so sánh, để nếu ai đảo dấu thì HỎNG ngay.
  const sign = (a, b) => Math.sign(tmCompare(a, b));
  assert.equal(sign({ active: true, lastAt: "2026-09-01", code: "A" }, { active: true, lastAt: "2026-09-01", code: "B" }), -1, "cùng trạng thái, cùng ngày ⇒ theo mã tăng dần");
  assert.equal(sign({ active: true, lastAt: "2026-09-01", code: "B" }, { active: true, lastAt: "2026-09-01", code: "A" }), 1, "đảo mã ⇒ dấu phải đảo theo");
  assert.equal(sign({ active: false, lastAt: "2026-09-01", code: "A" }, { active: false, lastAt: "2026-09-01", code: "A" }), 0, "hai dòng y hệt ⇒ 0");
});

test("TM-02 — đọc `active` đúng kiểu dữ liệu thật (tinyint 1/0, boolean, chuỗi)", () => {
  const { tmIsActive } = loadPure();
  assert.equal(tmIsActive({ active: 1 }), true);
  assert.equal(tmIsActive({ active: 0 }), false);
  assert.equal(tmIsActive({ active: true }), true);
  assert.equal(tmIsActive({ active: false }), false);
  assert.equal(tmIsActive({ active: "1" }), true, "JDBC có thể trả chuỗi '1' (lớp lỗi TASK-052)");
  assert.equal(tmIsActive({}), true, "thiếu cột ⇒ mặc định ĐANG hoạt động (đúng DEFAULT 1 của teams.active)");
});

test("TM-02 — UI dùng CHÍNH thứ tự đó và ghi rõ quy tắc cho người dùng", () => {
  assert.match(screen, /rows\.sort\(\(a, b\) => tmCompare\(/, "Nhánh danh sách phải sắp bằng `tmCompare` (một nguồn sự thật, không tự viết lại)");
  assert.match(screen, /data-team-sort-note="TM-02"/, "UI phải có khối ghi chú quy tắc ưu tiên");
  assert.match(screen, /ĐANG HOẠT ĐỘNG<\/strong> → hoạt động gần nhất ↓ → ngừng/, "Chuỗi quy tắc phải khớp nguyên văn yêu cầu");
});
