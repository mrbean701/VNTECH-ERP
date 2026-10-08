// TASK-234 — TEST quy tắc sinh MÃ KHO `KD-xxx` + TÊN KHO `KHO <tên dự án>` (user chốt · DEC-20261008-013).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { nextWarehouseCode, projectWarehouseName, WAREHOUSE_CODE_PREFIX, validateWarehouseCode, validateProjectWarehouseName } from "../lib/warehouse-hub.ts";

const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");

test("TASK-234 — tiền tố mã kho là `KD-` (user chốt: «KD-xxx»)", () => {
  assert.equal(WAREHOUSE_CODE_PREFIX, "KD-");
});

test("TASK-234 — `nextWarehouseCode`: kho đầu tiên ⇒ KD-001, đủ 3 chữ số", () => {
  assert.equal(nextWarehouseCode([]), "KD-001");
  assert.equal(nextWarehouseCode(null), "KD-001");
  assert.equal(nextWarehouseCode(undefined), "KD-001");
});

test("TASK-234 — `nextWarehouseCode`: ⭐ LẤY MAX + 1 (⛔ KHÔNG tái dùng số đã dùng)", () => {
  // ⚠️ Điểm cốt lõi: nếu dùng «số nhỏ nhất còn trống» thì KD-002 (đã ngừng) sẽ bị TÁI DÙNG
  //    ⇒ chứng từ cũ trỏ nhầm sang kho mới. User yêu cầu «không được trùng với các kho khác».
  assert.equal(nextWarehouseCode(["KD-001", "KD-002", "KD-004"]), "KD-005", "phải lấy max+1, ⛔ không lấp lỗ KD-003");
  assert.equal(nextWarehouseCode(["KD-001"]), "KD-002");
  assert.equal(nextWarehouseCode(["KD-009", "KD-010"]), "KD-011", "vượt 3 chữ số thì vẫn tăng đúng");
});

test("TASK-234 — `nextWarehouseCode`: ⛔ BỎ QUA mã kho KHÔNG theo quy tắc (dữ liệu cũ)", () => {
  // ĐO ĐƯỢC trên dữ liệu thật: `KHO-DIAG` · `KHO-DA-MAU-01` · `KHO-P1` — không theo KD-xxx
  assert.equal(nextWarehouseCode(["KHO-DIAG", "KHO-DA-MAU-01"]), "KD-001", "mã cũ khác quy tắc ⛔ không ảnh hưởng");
  assert.equal(nextWarehouseCode(["KHO-P1", "KD-003", "TRANSIT"]), "KD-004", "chỉ đọc mã ĐÚNG quy tắc");
});

test("TASK-234 — `nextWarehouseCode`: chịu được dữ liệu bẩn + khoảng trắng + chữ thường", () => {
  assert.equal(nextWarehouseCode([" kd-007 "]), "KD-008", "trim + không phân biệt hoa/thường");
  assert.equal(nextWarehouseCode(["KD-", "KD-abc", "", null, undefined]), "KD-001", "⛔ không khớp thì bỏ qua");
});

test("TASK-234 — `projectWarehouseName`: đúng mẫu «KHO <tên dự án>»", () => {
  assert.equal(projectWarehouseName("Dự án A06"), "KHO Dự án A06");
  assert.equal(projectWarehouseName("PRJ-DEMO-01"), "KHO PRJ-DEMO-01");
  assert.equal(projectWarehouseName("  Dự án mẫu  "), "KHO Dự án mẫu", "trim khoảng trắng");
  assert.equal(projectWarehouseName(""), "KHO", "tên rỗng ⇒ chỉ còn tiền tố");
  assert.equal(projectWarehouseName(null), "KHO");
});

test("TASK-234 — ⭐ quy tắc phải được GHI RÕ NGUỒN trong mã (truy vết §22)", () => {
  const hub = read("lib/warehouse-hub.ts");
  assert.match(hub, /DEC-20261008-013/, "phải trỏ về quyết định của user");
  assert.match(hub, /KD-xxx/, "phải ghi nguyên văn quy tắc mã kho");
  assert.match(hub, /KHO xxx/, "phải ghi nguyên văn quy tắc tên kho");
  // ⛔ KHÔNG được ghi CSDL từ tầng lib (việc ghi thuộc backend — HANDOFF-20261008-009)
  assert.doesNotMatch(hub, /fetch\(|axios|requestApi/, "lib ⛔ không được gọi API/ghi dữ liệu");
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// Quy tắc ② (user chốt): «sửa kho: cho sửa… có cho phép sửa mã kho» ⇒ mã ĐỔI ĐƯỢC ⇒ phải KIỂM LẠI
// ─────────────────────────────────────────────────────────────────────────────────────────────
test("TASK-234 — `validateWarehouseCode`: TẠO MỚI — chấp nhận KD-xxx, chuẩn hoá trim + IN HOA", () => {
  assert.deepEqual(validateWarehouseCode("KD-005", []), { ok: true, code: "KD-005", errors: [] });
  assert.equal(validateWarehouseCode("  kd-005  ", []).code, "KD-005", "trim + in hoa");
});

test("TASK-234 — `validateWarehouseCode`: ⛔ TỪ CHỐI mã sai quy tắc hoặc rỗng", () => {
  assert.equal(validateWarehouseCode("", []).ok, false);
  assert.equal(validateWarehouseCode(null, []).ok, false);
  assert.equal(validateWarehouseCode("KHO-001", []).ok, false, "thiếu tiền tố KD-");
  assert.equal(validateWarehouseCode("KD-abc", []).ok, false, "phần số phải là chữ số");
  assert.equal(validateWarehouseCode("KD-", []).ok, false);
});

test("TASK-234 — `validateWarehouseCode`: ⛔ TỪ CHỐI mã TRÙNG kho khác", () => {
  const r = validateWarehouseCode("KD-002", ["KD-001", "KD-002"]);
  assert.equal(r.ok, false);
  assert.match(r.errors[0], /đã được dùng cho kho khác/);
});

test("TASK-234 — ⭐ `validateWarehouseCode` khi SỬA: BỎ QUA chính nó (⛔ không báo trùng sai)", () => {
  // ⚠️ Điểm cốt lõi: sửa kho KD-003 mà GIỮ NGUYÊN mã ⇒ ⛔ KHÔNG được báo «trùng» (vì trùng với CHÍNH NÓ)
  assert.equal(validateWarehouseCode("KD-003", ["KD-003", "KD-004"], "KD-003").ok, true, "giữ nguyên mã ⇒ HỢP LỆ");
  // nhưng đổi sang mã của kho KHÁC thì phải chặn
  const r = validateWarehouseCode("KD-004", ["KD-003", "KD-004"], "KD-003");
  assert.equal(r.ok, false, "đổi sang mã đã có ⇒ PHẢI CHẶN");
});

test("TASK-234 — `validateProjectWarehouseName`: đúng «KHO <tên dự án>», ⛔ chặn tên khác", () => {
  assert.equal(validateProjectWarehouseName("KHO Dự án A06", "Dự án A06").ok, true);
  assert.equal(validateProjectWarehouseName("Kho dự án A06", "Dự án A06").ok, false, "sai hoa/thường");
  assert.equal(validateProjectWarehouseName("", "Dự án A06").ok, false, "rỗng");
  assert.equal(validateProjectWarehouseName("KHO X", "Dự án A06").expected, "KHO Dự án A06", "gợi ý tên đúng");
});

test("TASK-234 — ⭐ 2 hàm kiểm phải được XUẤT và ghi rõ quy tắc ② trong mã", () => {
  const hub = read("lib/warehouse-hub.ts");
  assert.match(hub, /export function validateWarehouseCode/, "phải export");
  assert.match(hub, /export function validateProjectWarehouseName/, "phải export");
  assert.match(hub, /cho phép sửa mã kho/, "phải ghi rõ căn cứ quy tắc ② của user");
});
