// PHASE 7 (`AD-04`) — HỢP ĐỒNG: SẮP XẾP MẶC ĐỊNH «TRẠNG THÁI → MÃ TÀI KHOẢN».
// Nguyên văn `docs/25_TODO_ROADMAP.md` dòng `AD-04`: «Sắp xếp mặc định: Trạng thái → Mã tài khoản».
//
// Cách kiểm: CHẠY THẬT `accountSortCompare` + `accountRows` (khối THUẦN `AD-PURE-BEGIN/END`).
// ĐỐI CHỨNG ÂM BẮT BUỘC: (1) dấu của hàm so sánh, (2) ca «đã khoá nhưng mã nhỏ hơn» KHÔNG được đứng trước,
// (3) bộ so sánh CHỈ-theo-mã phải bị cổng phát hiện là SAI.
//
// Chạy riêng:  node --test tests/ad04-account-sort.test.mjs
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

/** Cổng độc lập: thứ tự «trạng thái trước, mã sau» mới ĐẠT — dùng cho đối chứng âm. */
const orderGate = (compare, a, b) => compare(a, b) < 0;

const ACTIVE_LATE = { id: "1", employeeCode: "NV99", active: 1 };
const LOCKED_EARLY = { id: "2", employeeCode: "NV01", active: 0 };

test("AD-04 — khoá 1 là TRẠNG THÁI, khoá 2 là MÃ; mặc định của màn là «status»", () => {
  const { ACCOUNT_DEFAULT_SORT, ACCOUNT_SORT_NOTE, accountStatusRank, accountIsActive } = loadPure(
    ["ACCOUNT_DEFAULT_SORT", "ACCOUNT_SORT_NOTE", "accountStatusRank", "accountIsActive"]);
  assert.equal(ACCOUNT_DEFAULT_SORT, "status", "Sắp xếp MẶC ĐỊNH phải là theo Trạng thái (không phải Họ tên)");
  assert.equal(accountStatusRank(ACTIVE_LATE), 0, "Đang hoạt động = hạng 0 (đứng trước)");
  assert.equal(accountStatusRank(LOCKED_EARLY), 1, "Đã khoá = hạng 1 (đứng sau)");
  assert.equal(accountIsActive({ active: "1" }), true, "tinyint trả chuỗi '1' vẫn phải hiểu là hoạt động (lớp lỗi TASK-052)");
  assert.match(ACCOUNT_SORT_NOTE, /Trạng thái/, "Ghi chú sắp xếp phải nêu Trạng thái");
  assert.match(ACCOUNT_SORT_NOTE, /Mã tài khoản/, "Ghi chú sắp xếp phải nêu Mã tài khoản");
});

test("AD-04 — BỘ CA THẬT: trạng thái trước, trong cùng trạng thái sắp theo mã tăng dần", () => {
  const { accountRows, accountSortCompare } = loadPure(["accountRows", "accountSortCompare"]);
  const users = [
    { id: "L1", employeeCode: "NV005", fullName: "Khoá 5", active: 0 },
    { id: "A1", employeeCode: "NV030", fullName: "Hoạt động 30", active: 1 },
    { id: "A2", employeeCode: "NV002", fullName: "Hoạt động 2", active: 1 },
    { id: "L2", employeeCode: "NV001", fullName: "Khoá 1", active: 0 },
    { id: "A3", employeeCode: "NV100", fullName: "Hoạt động 100", active: 1 },
  ];
  const sorted = accountRows(users, [], []).sort(accountSortCompare).map((r) => r.employeeCode);
  assert.deepEqual(sorted, ["NV002", "NV030", "NV100", "NV001", "NV005"],
    "Kỳ vọng: 3 tài khoản ĐANG HOẠT ĐỘNG (NV002 · NV030 · NV100) trước, rồi 2 tài khoản ĐÃ KHOÁ (NV001 · NV005). "
    + "Điểm chốt: NV001 (đã khoá) NHỎ HƠN mọi mã đang hoạt động nhưng VẪN đứng sau.");
  // Bất biến (không chỉ so mảng): mọi dòng hoạt động đứng trước mọi dòng đã khoá.
  const rows = accountRows(users, [], []).sort(accountSortCompare);
  const firstLocked = rows.findIndex((r) => !r.active);
  const lastActive = rows.map((r) => r.active !== 0).lastIndexOf(true);
  assert.ok(firstLocked > lastActive, "Dòng hoạt động cuối phải đứng trước dòng đã khoá đầu tiên");
});

test("AD-04 — ĐỐI CHỨNG ÂM: dấu hàm so sánh + bộ so sánh CHỈ-theo-mã phải bị bắt là SAI", () => {
  const { accountSortCompare } = loadPure(["accountSortCompare"]);
  assert.equal(Math.sign(accountSortCompare(ACTIVE_LATE, LOCKED_EARLY)), -1,
    "[đối chứng âm 1] đã khoá có mã NHỎ hơn vẫn phải xếp SAU ⇒ dấu phải là -1");
  assert.equal(Math.sign(accountSortCompare(LOCKED_EARLY, ACTIVE_LATE)), 1, "[đối chứng âm 2] dấu phải đảo theo");
  assert.equal(Math.sign(accountSortCompare({ active: 1, employeeCode: "NV02" }, { active: 1, employeeCode: "NV10" })), -1,
    "cùng trạng thái ⇒ mã tăng dần (numeric: NV02 < NV10)");
  assert.equal(Math.sign(accountSortCompare({ active: 1, employeeCode: "NV10" }, { active: 1, employeeCode: "NV10" })), 0, "hai dòng y hệt ⇒ 0");
  // Bộ so sánh SAI (chỉ theo mã) — cổng độc lập phải phát hiện.
  const codeOnly = (a, b) => String(a.employeeCode).localeCompare(String(b.employeeCode));
  assert.equal(orderGate(accountSortCompare, ACTIVE_LATE, LOCKED_EARLY), true, "hàm THẬT ĐẠT");
  assert.equal(orderGate(codeOnly, ACTIVE_LATE, LOCKED_EARLY), false, "[đối chứng âm 3] bộ so sánh chỉ-theo-mã phải bị bắt");
});

test("AD-04 — UI dùng CHÍNH bộ so sánh đó và mặc định chọn «status»", () => {
  assert.match(page, /useState\(ACCOUNT_DEFAULT_SORT\)/, "Màn danh sách phải mặc định sắp theo `ACCOUNT_DEFAULT_SORT`");
  assert.match(page, /return accountSortCompare\(a, b\);/, "Nhánh MẶC ĐỊNH phải sắp bằng `accountSortCompare` (một nguồn sự thật)");
  assert.match(page, /ACCOUNT_SORT_NOTE/, "UI phải ghi rõ quy tắc sắp xếp mặc định cho người dùng");
});
