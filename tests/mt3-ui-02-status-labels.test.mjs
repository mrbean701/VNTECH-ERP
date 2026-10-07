// MT3-UI-02 — HỢP ĐỒNG: trạng thái phải hiển thị bằng nguồn ánh xạ TIẾNG VIỆT DÙNG CHUNG.
//
// MT3 §IV.6 yêu cầu: không hiển thị mã thô (pending/approved/rejected/cancelled/in_progress…),
// một cơ chế dùng chung, và giá trị lạ phải có fallback an toàn KHÔNG làm crash UI.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { statusLabel, GENERIC_STATUS_LABELS, DOMAIN_STATUS_LABELS, STATUS_LABELS } from "../lib/status-labels.ts";

const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");

test("MT3-UI-02 — dịch đúng các mã trạng thái phổ biến sang tiếng Việt", () => {
  const cases = [
    ["pending", "Chờ xử lý"], ["pending_approval", "Chờ duyệt"], ["approved", "Đã duyệt"],
    ["rejected", "Từ chối"], ["cancelled", "Đã huỷ"], ["in_progress", "Đang xử lý"],
    ["completed", "Hoàn thành"], ["draft", "Bản nháp"], ["submitted", "Đã trình"],
  ];
  for (const [code, want] of cases) assert.equal(statusLabel(code), want, `mã «${code}» phải dịch thành «${want}»`);
});

test("MT3-UI-02 — ⛔ KHÔNG trả về mã thô có dấu gạch dưới (dấu hiệu chưa dịch)", () => {
  for (const code of Object.keys(GENERIC_STATUS_LABELS)) {
    const out = statusLabel(code);
    assert.doesNotMatch(out, /[_-]/, `nhãn của «${code}» = «${out}» còn dấu gạch ⇒ coi như chưa dịch`);
    assert.match(out, /[A-Za-zÀ-ỹ]/, "nhãn phải có chữ");
  }
});

test("MT3-UI-02 — FALLBACK AN TOÀN: không throw, không trả undefined/rỗng", () => {
  for (const bad of [null, undefined, "", "   ", 0, false, {}]) {
    const out = statusLabel(bad);
    assert.equal(typeof out, "string", `input ${JSON.stringify(bad)} phải trả về chuỗi`);
    assert.ok(out.length > 0, "⛔ không được trả chuỗi rỗng");
  }
  // Mã lạ vẫn phải ra nhãn đọc được, ⛔ không lộ nguyên `zzz_weird_code`.
  const weird = statusLabel("zzz_weird_code");
  assert.equal(typeof weird, "string");
  assert.ok(weird.length > 0);
});

test("MT3-UI-02 — nhãn riêng theo phân hệ được ưu tiên hơn nhãn chung", () => {
  // Mã `closed` của DỰ ÁN = "Đã đóng", còn mã `closed` chung = "Đã đóng" — kiểm bằng khoá khác nhau.
  assert.equal(statusLabel("active", "project"), "Đang hoạt động");
  assert.equal(statusLabel("purged", "project"), "Đã xoá");
  assert.equal(statusLabel("IN_PROGRESS", "work_item"), "Đang làm");
  assert.equal(statusLabel("WAITING_SUPPLIER", "work_item"), "Chờ NCC");
  // Không truyền domain ⇒ rơi về bảng chung.
  assert.equal(statusLabel("active"), "Đang hoạt động");
});

test("MT3-UI-02 — không phân biệt hoa/thường khi tra nhãn", () => {
  assert.equal(statusLabel("PENDING_APPROVAL"), statusLabel("pending_approval"));
  assert.equal(statusLabel("APPROVED"), statusLabel("approved"));
});

test("MT3-UI-02 — bảng dùng chung là điểm tra được", () => {
  assert.ok(Object.keys(STATUS_LABELS).length >= 20, "bảng nhãn chung phải có đủ phạm vi dùng thực tế");
  assert.ok(Object.keys(DOMAIN_STATUS_LABELS).length >= 3, "phải có nhãn riêng cho các phân hệ chính");
  for (const [domain, table] of Object.entries(DOMAIN_STATUS_LABELS)) {
    for (const [code, label] of Object.entries(table)) {
      assert.ok(label && label.length > 0, `${domain}.${code} phải có nhãn`);
    }
  }
});

test("MT3-UI-02 — ⛔ các màn đã sửa KHÔNG còn render mã trạng thái thô", () => {
  // Các màn từng bị đo là rò mã thô ra UI.
  const mustNotLeak = [
    ["app/screens/AllocateReturn.tsx", /StatusBadge value=\{String\(row\.status\)\}/],
    ["app/screens/TeamDirectory.tsx", /StatusBadge value=\{String\(row\.status/],
    ["app/screens/Inventory.tsx", /: String\(row\.status\)\} \/>/],
  ];
  for (const [file, re] of mustNotLeak) {
    const src = read(file);
    assert.doesNotMatch(src, re, `⛔ ${file} vẫn render mã trạng thái thô ra UI (MT3 §IV.6)`);
  }
  // Và phải thực sự dùng nguồn chung.
  for (const file of ["app/screens/AllocateReturn.tsx", "app/screens/TeamDirectory.tsx", "app/screens/Inventory.tsx"]) {
    assert.match(read(file), /from "@\/lib\/status-labels"/, `${file} phải import nguồn ánh xạ dùng chung`);
  }
});

test("MT3-UI-02 — ⛔ không tự tạo bảng nhãn trạng thái MỚI rải rác trong màn hình", () => {
  // Cho phép giữ các bảng RIÊNG theo phân hệ đã có sẵn (PR/PO/PO... của Mua hàng) vì chúng có ngữ nghĩa riêng,
  // nhưng phải KHÔNG sinh thêm bảng `*_STATUS_LABELS` mới ở phía màn hình.
  const screensDir = new URL("../app/screens/", import.meta.url);
  const offenders = [];
  for (const f of readdirSync(screensDir)) {
    if (!f.endsWith(".tsx")) continue;
    const src = read("app/screens/" + f);
    const hits = [...src.matchAll(/(?:const|export const)\s+\w*STATUS_LABELS?\w*\s*[:=]/g)];
    if (hits.length) offenders.push(`${f} (${hits.length})`);
  }
  // Danh sách được biết là CỐ Ý giữ (ngữ nghĩa riêng của Mua hàng) — ghi rõ để không "quét nhầm".
  const allowed = new Set(["Purchasing.tsx"]);
  const unexpected = offenders.filter((o) => !allowed.has(o.split(" ")[0]));
  assert.equal(unexpected.length, 0, "⛔ có màn tự khai bảng nhãn trạng thái mới: " + unexpected.join(", "));
});
