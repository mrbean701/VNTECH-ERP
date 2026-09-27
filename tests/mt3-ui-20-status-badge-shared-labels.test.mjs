// MT3 §IV.6 / ma trận audit #5 — «1 BẢNG ÁNH XẠ TRẠNG THÁI DÙNG CHUNG».
//
// LỖI THẬT đã bịt: `StatusBadge` (dùng ở nhiều màn) khi người gọi KHÔNG truyền `label`
//   thì render THẲNG `String(value)` ⇒ **RÒ MÃ THÔ** (vd `pending_approval`) ra màn hình.
//   Đo được **10 chỗ** gọi `StatusBadge value={String(...)}` mà ⛔ không truyền `label`.
// CÁCH BỊT (theo §14 — 1 component giải quyết nhiều màn): cho `StatusBadge` tự tra
//   `lib/status-labels.ts`, ⛔ không phải sửa 10 màn riêng lẻ.
// ⚠️ CHỐT AN TOÀN (⛔ chống hồi quy giao diện): CHỈ tra khi giá trị **trông như mã thô**;
//   nhãn đã đúng tiếng Việt (có dấu cách/dấu tiếng Việt) phải được **giữ NGUYÊN**.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { statusLabel } from "../lib/status-labels.ts";

const BADGE = readFileSync("app/components/ui/StatusBadge.tsx", "utf8");

test("StatusBadge: nạp bảng nhãn DÙNG CHUNG (⛔ không giữ bảng riêng)", () => {
  assert.match(BADGE, /from\s+"@\/lib\/status-labels"/,
    "StatusBadge phải dùng bảng nhãn dùng chung");
  assert.match(BADGE, /statusLabel\(/, "và phải THẬT SỰ gọi hàm tra nhãn");
});

test("StatusBadge: ⛔ KHÔNG còn render thẳng mã thô khi thiếu `label`", () => {
  assert.doesNotMatch(BADGE, /label\s*\?\?\s*String\(value/,
    "chuỗi `label ?? String(value…)` chính là đường RÒ MÃ THÔ — đã bị bỏ");
});

test("StatusBadge: có CHỐT AN TOÀN chỉ tra khi trông như mã thô", () => {
  // Chốt này bảo vệ nhãn đã đúng tiếng Việt khỏi bị `humanize()` đổi hoa/thường.
  assert.match(BADGE, /looksLikeRawCode/,
    "phải có biến/biểu thức nhận biết «mã thô»");
  assert.match(BADGE, /\/\^\[a-z0-9_\.-\]\+\$\//,
    "biểu thức nhận biết mã thô: chỉ chữ thường + số + `_ . -`, ⛔ KHÔNG dấu cách");
});

test("statusLabel: DỊCH được mã thô và ⛔ KHÔNG lộ mã thô cho giá trị lạ", () => {
  // Hành vi thật: hàm phải trả tiếng Việt cho mã thô phổ biến…
  const pending = statusLabel("pending_approval");
  assert.notEqual(pending, "pending_approval", "⛔ mã thô phải được dịch");
  assert.match(pending, /[àáâãèéêìíòóôõùúýăđĩũơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i,
    "kết quả phải là TIẾNG VIỆT có dấu");

  // …và với mã HOÀN TOÀN LẠ thì ⛔ KHÔNG được trả lại y nguyên mã thô (đã ghi ở L85-86).
  const weird = statusLabel("zzz_unknown_code");
  assert.notEqual(weird, "zzz_unknown_code",
    "⛔ không được lộ mã thô cho giá trị lạ — phải `humanize`");
});

test("Chốt an toàn: nhãn ĐÃ ĐÚNG tiếng Việt có dấu cách ⇒ ⛔ KHÔNG bị tra bảng", () => {
  // Mô phỏng đúng biểu thức trong StatusBadge: giá trị có DẤU CÁCH ⇒ không khớp regex ⇒ giữ nguyên.
  // ⚠️ Tệp `.mjs` = JavaScript THUẦN ⇒ ⛔ KHÔNG được viết chú thích kiểu TypeScript (`(v: string) =>`)
  //    — tôi từng mắc: `SyntaxError: Unexpected token ':'`.
  const isRaw = (v) => v.length > 0 && /^[a-z0-9_.-]+$/.test(v);
  assert.equal(isRaw("Đang hoạt động"), false,
    "nhãn tiếng Việt có dấu cách ⛔ KHÔNG được coi là mã thô ⇒ giữ NGUYÊN (chống hồi quy cosmetic)");
  assert.equal(isRaw("Chờ duyệt"), false, "nhãn tiếng Việt phải được giữ nguyên");
  assert.equal(isRaw("Đã hủy"), false, "nhãn tiếng Việt phải được giữ nguyên");
  assert.equal(isRaw("pending_approval"), true, "mã thô phải được nhận diện");
  assert.equal(isRaw("in_transit"), true, "mã thô phải được nhận diện");
});
