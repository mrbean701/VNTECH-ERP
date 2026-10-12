// TASK-236 — TEST quy tắc ④ «GIỮ CHỖ KHI PHIẾU ĐANG XỬ LÝ» (user chốt · DEC-20261008-013).
//   ⚠️ VÍ DỤ CHÍNH LÀ CỦA USER: «dây diện cadivi 1.5 tồn 100 - phiếu xuất 70 (đang xử lý)
//      thì những user khác không được thao tác xuất quá số lượng đang trạng thái bình thường»
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  availableToIssue,
  validateIssueQuantity,
  canChangeStockOnIssue,
  isIssueHoldingStock,
  ISSUE_DONE_STATUS,
  ISSUE_PENDING_STATUSES,
} from "../lib/warehouse-hub.ts";

const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");

test("TASK-236 — ⭐⭐ VÍ DỤ NGUYÊN VĂN CỦA USER: tồn 100 − đang xử lý 70 ⇒ còn 30", () => {
  assert.equal(availableToIssue(100, 70), 30, "cadivi 1.5: 100 − 70 = 30");
});

test("TASK-236 — `availableToIssue`: ⛔ KHÔNG trả số âm (dữ liệu lệch ⇒ kẹp về 0)", () => {
  assert.equal(availableToIssue(50, 70), 0, "giữ chỗ vượt tồn ⇒ 0, ⛔ không âm");
  assert.equal(availableToIssue(-5, 0), 0);
  assert.equal(availableToIssue(0, 0), 0);
});

test("TASK-236 — `availableToIssue`: chịu dữ liệu thiếu/bẩn (payload có thể thiếu `reserved`)", () => {
  assert.equal(availableToIssue(100, undefined), 100, "⛔ không có `reserved` ⇒ coi như 0");
  assert.equal(availableToIssue(100, null), 100);
  assert.equal(availableToIssue(undefined, 0), 0);
  assert.equal(availableToIssue("100", "70"), 30, "chuỗi số vẫn tính đúng");
  assert.equal(availableToIssue(100, "abc"), 100, "`reserved` không phải số ⇒ bỏ qua");
});

test("TASK-236 — ⭐ `validateIssueQuantity`: user khác ⛔ KHÔNG xuất quá 30", () => {
  // còn 30 ⇒ xuất 31 PHẢI BỊ CHẶN
  const vuot = validateIssueQuantity(31, 100, 70);
  assert.equal(vuot.ok, false, "xuất 31 > 30 ⇒ CHẶN");
  assert.equal(vuot.available, 30);
  assert.match(vuot.errors[0], /Chỉ còn 30/);
  // xuất đúng 30 thì được
  assert.equal(validateIssueQuantity(30, 100, 70).ok, true, "xuất đúng 30 ⇒ CHO PHÉP");
  assert.equal(validateIssueQuantity(10, 100, 70).ok, true, "xuất 10 ⇒ CHO PHÉP");
});

test("TASK-236 — `validateIssueQuantity`: ⛔ chặn số lượng ≤ 0 hoặc không phải số", () => {
  assert.equal(validateIssueQuantity(0, 100, 0).ok, false);
  assert.equal(validateIssueQuantity(-5, 100, 0).ok, false);
  assert.equal(validateIssueQuantity(null, 100, 0).ok, false);
  assert.equal(validateIssueQuantity(10, 100, 0).ok, true);
});

test("TASK-236 — ⭐⭐ `canChangeStockOnIssue`: ⛔ CHỈ `hoàn thành` mới được ĐỔI TỒN KHO", () => {
  assert.equal(ISSUE_DONE_STATUS, "completed");
  assert.equal(canChangeStockOnIssue("completed"), true, "hoàn thành ⇒ ĐƯỢC đổi tồn");
  assert.equal(canChangeStockOnIssue("  COMPLETED  "), true, "chuẩn hoá hoa/thường + trim");
  // ⛔ mọi trạng thái khác ⇒ CHỈ đang xử lý, ⛔ KHÔNG đổi tồn
  for (const st of ISSUE_PENDING_STATUSES) {
    assert.equal(canChangeStockOnIssue(st), false, `${st} ⇒ ⛔ KHÔNG được đổi tồn`);
    assert.equal(isIssueHoldingStock(st), true, `${st} ⇒ ĐANG XỬ LÝ (giữ chỗ)`);
  }
  assert.equal(canChangeStockOnIssue(""), false);
  assert.equal(canChangeStockOnIssue(null), false);
});

test("TASK-236 — quy tắc ④ phải ghi rõ NGUỒN + hạ tầng đã có (truy vết §22)", () => {
  const hub = read("lib/warehouse-hub.ts");
  assert.match(hub, /DEC-20261008-013/, "phải trỏ về quyết định của user");
  assert.match(hub, /cadivi/i, "phải ghi nguyên văn ví dụ của user");
  assert.match(hub, /stock_reservations/, "phải nêu hạ tầng giữ chỗ ĐÃ CÓ");
  assert.match(hub, /HANDOFF-20261008-009/, "phải nêu phần còn thiếu thuộc backend ⇒ S01");
  // ⛔ tầng lib KHÔNG được ghi CSDL
  assert.doesNotMatch(hub, /fetch\(|axios|jdbcTemplate/i, "lib ⛔ không gọi API/CSDL");
});
