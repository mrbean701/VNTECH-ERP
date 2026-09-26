// PHASE 7 (`AD-02`) — HỢP ĐỒNG: 13 CỘT CỦA DANH SÁCH TÀI KHOẢN.
// Nguyên văn `docs/25_TODO_ROADMAP.md` dòng `AD-02`: «Bổ sung cột: mã · tên đăng nhập · họ tên · email ·
// phòng · chức danh · cấp · hạn mức · trạng thái · **số quyền** · vai trò · đăng nhập cuối · ngày tạo».
//
// HAI RÀNG BUỘC ĐƯỢC ĐO Ở ĐÂY:
//   (1) đủ + ĐÚNG THỨ TỰ 13 cột;
//   (2) «chưa có nguồn» ≠ 0 giả: 2 trường không có nguồn trong payload phải để `null` + có LÝ DO,
//       và `số quyền` phải ĐẾM THẬT từ `user_module_permissions` (không hard-code).
//
// Chạy riêng:  node --test tests/ad02-account-columns.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import esbuild from "esbuild";

const root = new URL("../", import.meta.url);
const read = (p) => readFileSync(new URL(p, root), "utf8");
const pure = read("app/screens/admin-governance-pure.ts");
const page = read("app/page.tsx");

function loadPure(names) {
  const start = pure.search(/^\/\/ AD-PURE-BEGIN$/m);
  const end = pure.search(/^\/\/ AD-PURE-END$/m);
  assert.ok(start > 0 && end > start, "Không tìm thấy khối AD-PURE-BEGIN/END");
  const block = pure.slice(start + "// AD-PURE-BEGIN".length, end).replace(/^export /gm, "");
  const js = esbuild.transformSync(block, { loader: "ts" }).code;
  return new Function(`${js}\nreturn { ${names.join(", ")} };`)();
}

// ⚠️ CẬP NHẬT 23/09/2026 (MT2-P12-03 §13.3) — DANH SÁCH TÀI KHOẢN NAY **12 CỘT**: MT2 gỡ cột «Hạn mức»
// (`users.approval_limit`) theo nguyên văn «⛔ Bỏ trường "Hạn mức" — không thay bằng trường khác nếu chưa có
// nghiệp vụ». ⛔ Cột CSDL GIỮ NGUYÊN (V25 ghi rõ «KHÔNG drop») — chỉ ẩn khỏi UI/API.
const REQUIRED_LABELS = ["Mã", "Tên đăng nhập", "Họ tên", "Email", "Phòng", "Chức danh", "Cấp",
  "Trạng thái", "Số quyền", "Vai trò", "Đăng nhập cuối", "Ngày tạo"];
const columnsGate = (columns) => JSON.stringify((columns || []).map((c) => c.label)) === JSON.stringify(REQUIRED_LABELS);

test("AD-02 — ĐÚNG 12 cột, ĐÚNG nhãn, ĐÚNG thứ tự nguyên văn", () => {
  const { ACCOUNT_COLUMNS } = loadPure(["ACCOUNT_COLUMNS"]);
  assert.equal(ACCOUNT_COLUMNS.length, 12, "Phải có ĐÚNG 12 cột (13 cột gốc − «Hạn mức» đã bị MT2-P12-03 gỡ)");
  assert.deepEqual(ACCOUNT_COLUMNS.map((c) => c.label), REQUIRED_LABELS, "12 nhãn phải khớp nguyên văn + đúng thứ tự");
  assert.equal(columnsGate(ACCOUNT_COLUMNS), true, "Cổng cột phải ĐẠT với dữ liệu thật");
  assert.ok(!ACCOUNT_COLUMNS.some((c) => c.label === "Hạn mức"),
    "⛔ KHÔNG được để lại cột «Hạn mức» (MT2-P12-03 đã gỡ theo §13.3)");
});

test("AD-02 — ĐỐI CHỨNG ÂM: thiếu «Số quyền» hoặc sai thứ tự ⇒ cổng HỎNG", () => {
  const { ACCOUNT_COLUMNS } = loadPure(["ACCOUNT_COLUMNS"]);
  const missing = ACCOUNT_COLUMNS.filter((c) => c.label !== "Số quyền");
  assert.equal(columnsGate(missing), false, "[đối chứng âm] thiếu cột «Số quyền» phải bị bắt");
  const swapped = [...ACCOUNT_COLUMNS];
  const i = swapped.findIndex((c) => c.label === "Vai trò");
  [swapped[i - 1], swapped[i]] = [swapped[i], swapped[i - 1]];
  assert.equal(columnsGate(swapped), false, "[đối chứng âm] đảo thứ tự 2 cột phải bị bắt");
});

test("AD-02 — «chưa có nguồn» ≠ 0 giả: MỌI cột nay CÓ NGUỒN khai báo, giá trị rỗng vẫn phải có LÝ DO cụ thể", () => {
  const { ACCOUNT_COLUMNS, ACCOUNT_UNSOURCED_REASON, accountRows } = loadPure(
    ["ACCOUNT_COLUMNS", "ACCOUNT_UNSOURCED_REASON", "accountRows"]);
  // ⚠️ CẬP NHẬT 23/09/2026 (MT2-P12-04 §13.3): 2 trường từng «chưa có nguồn» nay ĐÃ CÓ NGUỒN THẬT
  // (`users.last_login_at` ghi khi đăng nhập — migration V29; `users.created_at` đã chiếu trong payload `users`)
  // ⇒ `source === null` phải là **RỖNG**. Lý do chỉ còn dùng khi GIÁ TRỊ rỗng (user chưa đăng nhập lần nào).
  const unsourced = ACCOUNT_COLUMNS.filter((c) => c.source === null).map((c) => c.key).sort();
  assert.deepEqual(unsourced, [], "⛔ KHÔNG còn cột nào thiếu nguồn — mọi cột phải khai `source` thật");
  for (const column of ACCOUNT_COLUMNS) {
    assert.ok(String(column.source || "").length > 0, `Cột «${column.key}» phải có \`source\` (không để trống)`);
  }
  // Vẫn PHẢI có lý do cụ thể cho 2 trường dễ rỗng nhất (⛔ không hiện 0/«—» giả).
  for (const key of ["createdAt", "lastLoginAt"]) {
    assert.ok(String(ACCOUNT_UNSOURCED_REASON[key] || "").length > 40,
      `Trường «${key}» phải có LÝ DO cụ thể (chuỗi > 40 ký tự), không được để trống`);
  }
  // Lý do phải nói rõ VÌ SAO thiếu nguồn (cột không tồn tại / payload không trả) — bằng chứng nêu tên tệp.
  // ⚠️ CẬP NHẬT 23/09/2026: lý do nay nói rõ GIÁ TRỊ rỗng + NGUỒN THẬT (MT2-P12-04) ⇒ kiểm đúng điều đó.
  assert.match(ACCOUNT_UNSOURCED_REASON.lastLoginAt, /users\.last_login_at|login/,
    "Lý do «đăng nhập cuối» phải nêu NGUỒN THẬT đã kiểm");
  assert.match(ACCOUNT_UNSOURCED_REASON.createdAt, /users\.created_at/,
    "Lý do «ngày tạo» phải chỉ ra nguồn `users.created_at`");
  // accountRows: thiếu nguồn ⇒ null (KHÔNG phải 0 hay chuỗi rỗng giả).
  const rows = accountRows([{ id: "U1", fullName: "A", employeeCode: "NV01", active: 1 }], [], []);
  assert.equal(rows[0].lastLoginAt, null, "«đăng nhập cuối» không có nguồn phải là null (không hiện 0 giả)");
  assert.equal(rows[0].createdAt, null, "«ngày tạo» không có nguồn phải là null");
});

test("AD-02 — «Số quyền» ĐẾM THẬT từ `user_module_permissions` (≥1 capability), không hard-code", () => {
  const { accountRows, permissionCountOf } = loadPure(["accountRows", "permissionCountOf"]);
  const perms = [
    { userId: "U1", moduleKey: "a", canView: 1, canUse: 0 },
    { userId: "U1", moduleKey: "b", canView: 0, canUse: 0, canCreate: 0, canEdit: 0, canApprove: 0, canExport: 0 }, // rỗng ⇒ KHÔNG đếm
    { userId: "U1", moduleKey: "c", canExport: 1 },
    { userId: "U2", moduleKey: "d", canView: 1 },
  ];
  assert.equal(permissionCountOf(perms, "U1"), 2, "Chỉ đếm dòng có ÍT NHẤT 1 capability = 1");
  assert.equal(permissionCountOf(perms, "U2"), 1);
  assert.equal(permissionCountOf(perms, "U3"), 0, "User không có dòng nào ⇒ 0 (đúng: đã đo được, không phải bịa)");
  const rows = accountRows([{ id: "U1", active: 1 }, { id: "U2", active: 0 }], perms, []);
  assert.deepEqual(rows.map((r) => r.permissionCount), [2, 1], "Cột «số quyền» phải lấy từ phép đếm thật");
  // Cột khác lấy từ payload thật: cấp bậc tra từ `system_level_catalog`, vai trò = base_role.
  const enriched = accountRows([{ id: "U3", active: 1, systemLevelCode: "L2", role: "ksda", roleBase: "engineer" }], [], [{ code: "L2", name: "Chuyên viên" }]);
  assert.equal(enriched[0].systemLevelName, "Chuyên viên", "«Cấp» phải tra tên từ system_level_catalog");
  assert.equal(enriched[0].roleBase, "engineer", "«Vai trò» phải là base_role (System Role) khi payload có");
  assert.equal(enriched[0].statusLabel, "Đang hoạt động");
  assert.equal(accountRows([{ id: "U4", active: 0 }], [], [])[0].statusLabel, "Đã khoá");
  assert.equal(accountRows([{ id: "U5" }], [], [])[0].statusLabel, "Đang hoạt động", "Thiếu cột active ⇒ mặc định hoạt động (DEFAULT 1)");
});

test("AD-02 — UI hiện ĐỦ 13 cột và in «chưa có nguồn» cho 2 cột thiếu nguồn", () => {
  assert.match(page, /ACCOUNT_COLUMNS/, "Màn danh sách tài khoản phải dựng cột từ `ACCOUNT_COLUMNS`");
  assert.ok(page.includes("chưa có nguồn") || page.includes("{UNSOURCED_TEXT}"),
    "2 cột thiếu nguồn phải in «chưa có nguồn» (không im lặng, không hiện 0 giả)");
  assert.match(page, /ACCOUNT_UNSOURCED_REASON/, "UI phải dùng LÝ DO từ `ACCOUNT_UNSOURCED_REASON` (một nguồn sự thật)");
  assert.match(page, /permissionCount/, "UI phải hiện cột «số quyền»");
});
