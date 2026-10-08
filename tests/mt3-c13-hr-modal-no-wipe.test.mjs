// HỢP ĐỒNG — «MODAL SỬA HỒ SƠ ⛔ KHÔNG ĐƯỢC GỬI RỖNG CÁC TRƯỜNG CỦA TAB KHÔNG MỞ» (ERP-SESSION-03 · `BUG-20261007-C12`, CRITICAL — MẤT DỮ LIỆU)
//
// ⛔ SỰ CỐ ĐÃ ĐO ĐƯỢC (user báo 2026-10-09):
//   Modal «Sửa hồ sơ» CHỈ render phần của **TAB ĐANG MỞ** ⇒ khi lưu ở tab này, mọi ô của tab kia
//   **không có trong DOM** ⇒ `fd.get("…")` trả `null` ⇒ code cũ `String(fd.get(…) || "")` gửi **`""`**
//   ⇒ backend `HrManagementUseCase.saveHrRecord` ghi `nvl(…)` = «rỗng ⇒ NULL» ⇒ **GHI ĐÈ ⇒ MẤT DỮ LIỆU**.
//   ⭐ TÁI HIỆN: `e2e.diag` có `position="Chỉ huy trưởng"`; gửi payload đúng như modal cũ (tab cá nhân mở)
//     ⇒ `position` ⇒ **NULL** (mất «Chức danh»).
//
// ✅ CÁCH VÁ ĐANG ĐƯỢC KHOÁ BỞI CỔNG NÀY: mọi trường vắng trong DOM ⇒ gửi **GIÁ TRỊ HIỆN CÓ** (`hr.*`),
//   ⛔ KHÔNG gửi chuỗi rỗng; nhưng ô CÓ trong DOM mà người dùng xoá trắng ⇒ **vẫn gửi rỗng** (tôn trọng ý người dùng).
//
// Chạy riêng:  node --test tests/mt3-c13-hr-modal-no-wipe.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const MODAL = "app/screens/HrProfileEditModal.tsx";

/** Trích khối payload của `save_hr_record` (từ lời gọi tới `});`). */
export function hrPayloadBlock(src) {
  const i = src.indexOf('submit("save_hr_record"');
  if (i < 0) return "";
  const j = src.indexOf("});", i);
  return j < 0 ? src.slice(i) : src.slice(i, j + 3);
}

/** ⛔ MẪU GÂY MẤT DỮ LIỆU: `String(fd.get("x") || "")` — rỗng khi ô KHÔNG có trong DOM. */
export function wipePatternFields(block) {
  const bad = [];
  for (const m of block.matchAll(/String\(fd\.get\("([A-Za-z]+)"\)\s*\|\|\s*""\)/g)) bad.push(m[1]);
  return bad;
}

/** ✅ MẪU AN TOÀN: `hrVal("x", String(hr.x ?? ""))` — vắng trong DOM thì giữ giá trị cũ. */
export function safePatternFields(block) {
  const ok = [];
  for (const m of block.matchAll(/hrVal\("([A-Za-z]+)",\s*String\(hr\.([A-Za-z]+)/g)) ok.push(m[1]);
  return ok;
}

const REQUIRED = ["position", "phone", "identityNo", "identityDate", "birthDate", "birthplace",
  "permanentAddress", "educationLevel", "joinedDate", "note", "identityPlace"];

test("C13-1 · ⛔ KHÔNG còn mẫu gây MẤT DỮ LIỆU trong payload `save_hr_record`", () => {
  const block = hrPayloadBlock(read(MODAL));
  assert.ok(block, "phải tìm thấy lời gọi `save_hr_record` trong modal");
  const bad = wipePatternFields(block);
  assert.deepEqual(bad, [],
    "⛔ TÁI PHÁT `BUG-20261007-C12` (mất dữ liệu): các trường sau gửi `\"\"` khi ô KHÔNG có trong DOM ⇒ backend ghi NULL ⇒ XOÁ dữ liệu: " + bad.join(", ") +
    "\n⇒ phải dùng `hrVal(\"<tên>\", String(hr.<tên> ?? \"\"))` để GIỮ giá trị hiện có.");
});

test("C13-2 · MỌI trường hồ sơ phải đi qua mẫu AN TOÀN `hrVal(…)`", () => {
  const block = hrPayloadBlock(read(MODAL));
  const ok = safePatternFields(block);
  const missing = REQUIRED.filter((f) => !ok.includes(f));
  assert.deepEqual(missing, [], "⛔ các trường CHƯA dùng mẫu an toàn (vắng trong DOM ⇒ sẽ ghi rỗng): " + missing.join(", "));
});

test("C13-3 · ĐỐI CHỨNG ÂM: bộ dò PHẢI bắt được mẫu CŨ (⛔ nếu không thì cổng VÔ DỤNG)", () => {
  // ⭐ MẪU THẬT lấy từ mã TRƯỚC khi vá (đúng nguyên văn lịch sử):
  const oldBlock = `submit("save_hr_record", {\n userId,\n fullName,\n position: String(fd.get("position") || ""),\n phone: String(fd.get("phone") || ""),\n identityNo: String(fd.get("identityNo") || ""),\n});`;
  const caught = wipePatternFields(oldBlock);
  assert.deepEqual(caught, ["position", "phone", "identityNo"],
    "⛔ BỘ DÒ HỎNG: không bắt được mẫu mất dữ liệu thật ⇒ cổng này vô dụng");
  // ⛔ Và bộ dò ⛔ KHÔNG được báo oan mẫu AN TOÀN:
  const newBlock = `submit("save_hr_record", {\n position: hrVal("position", String(hr.position ?? "")),\n phone: hrVal("phone", String(hr.phone ?? "")),\n});`;
  assert.deepEqual(wipePatternFields(newBlock), [], "⛔ báo OAN mẫu an toàn");
  assert.deepEqual(safePatternFields(newBlock), ["position", "phone"], "⛔ không nhận ra mẫu an toàn");
});

test("C13-4 · Ô CÓ trong DOM mà người dùng XOÁ TRẮNG ⇒ vẫn gửi rỗng (⛔ không phá quyền xoá của người dùng)", () => {
  const src = read(MODAL);
  // Hàm phải phân biệt `null` (không có trong DOM) với `""` (người dùng xoá trắng):
  assert.match(src, /raw === null \? fallback : String\(raw\)\.trim\(\)/,
    "⛔ `hrVal` phải: `null` ⇒ giữ giá trị cũ; còn `\"\"` ⇒ gửi rỗng (tôn trọng thao tác xoá của người dùng)");
});

test("C13-5 · PHẦN 2 — hai tab PHẢI có `key` khác nhau (⛔ nếu không: React TÁI DÙNG ô cũ ⇒ hiện & lưu SAI giá trị)", () => {
  const src = read(MODAL);
  // ⭐ ĐO ĐƯỢC (vòng 48): thiếu `key` ⇒ tab «Thông tin cá nhân» hiện «Số CCCD/CMND = E2E-DIAG» (MÃ NHÂN VIÊN),
  //    «Địa chỉ thường trú = Chẩn đoán» (HỌ TÊN), «Trình độ = Chỉ huy trưởng» (CHỨC DANH) ⇒ lưu là ghi giá trị SAI.
  assert.match(src, /className="form-grid"\s+key=\{tab\}/,
    "⛔ Thiếu `key={tab}` trên khối ô ⇒ React TÁI DÙNG `<input>` giữa 2 tab ⇒ `defaultValue` không áp lại " +
    "⇒ ô của tab này HIỆN giá trị của tab kia và **LƯU SAI** (mất/đổi dữ liệu).");
  // ⛔ Đối chứng âm: bộ dò phải BẮT được mã THIẾU key (mẫu lịch sử thật):
  const old = `{tab === "user" ? (\n<div className="form-grid">\n<label><span>Mã nhân viên</span><input name="employeeCode" /></label>\n</div>\n) : (\n<div className="form-grid">\n<label><span>Số CCCD/CMND</span><input name="identityNo" /></label>\n</div>\n)}`;
  assert.equal(/className="form-grid"\s+key=\{tab\}/.test(old), false, "⛔ bộ dò báo OAN mã cũ");
});

// ⭐⭐ THÊM 2026-10-09 (ERP-SESSION-03 vòng 58) — KHOÁ **HỢP ĐỒNG QUYỀN** của modal (⚠️ lớp `BUG-20261007-C13` + BUG-02):
//   ⚠️ TỆP NÀY TỪNG CÓ **KHỐI CHÚ THÍCH CŨ SAI** («khoá đúng theo hợp đồng backend = chỉ `role === "admin"`») — ⭐ ĐÃ GỠ.
//   ⚠️ Ai làm theo chú thích đó ⇒ **khoá CẢ mục TÀI KHOẢN** ⇒ ⭐ người có **`admin_tab_01`** ⛔ mất quyền sửa hồ sơ (⚠️ đúng lớp `BUG-C13`);
//     còn mở khoá khi backend CÒN chặn ⇒ **403 SAU KHI ĐÃ LƯU** (BUG-02 — ⚠️ user tưởng mất dữ liệu).
//   ✅ ĐO ĐƯỢC TRONG MÃ HIỆN TẠI: `UserManagementUseCase.java:167` `requireAccountUpdateRight` cho **`admin_tab_01` + `canEdit`** đi qua;
//     ⛔ **chỉ `role` là admin-only** (`:174-176` — chống leo thang đặc quyền).
test("C13-6 · ⭐ `canEditAccount = true` PHẢI giữ (⛔ KHÔNG khoá mục TÀI KHOẢN theo `role`)", () => {
  const src = read(MODAL);
  assert.match(src, /const\s+canEditAccount\s*=\s*true\s*;/,
    "⛔ TÁI PHÁT BUG-02 / lớp-C13: mục TÀI KHOẢN bị khoá theo `role` ⇒ người có `admin_tab_01` ⛔ không sửa được hồ sơ " +
    "(⚠️ trái với `ActionRbacRegistry` + `requireAccountUpdateRight` của backend).");
});

test("C13-7 · ⭐ Ô `role` PHẢI `disabled={!isAdminRole}` (chống leo thang đặc quyền — khớp backend) + ĐỐI CHỨNG ÂM", () => {
  const src = read(MODAL);
  const radar = (code) => /name="role"[\s\S]{0,220}?disabled=\{!isAdminRole\}/.test(code);
  assert.ok(radar(src),
    "⛔ ô `role` phải bị khoá với người ⛔ không phải admin (`UserManagementUseCase:174-176` chặn đổi vai trò để chống leo thang)");
  // ⛔ Đối chứng âm: ô `role` KHÔNG khoá ⇒ bộ dò PHẢI bắt (⛔ nếu không thì cổng VÔ DỤNG):
  const unlocked = `<select name="role" defaultValue={String(row.role ?? "")}>`;
  assert.equal(radar(unlocked), false, "⛔ bộ dò HỎNG: không nhận ra ô `role` ĐÃ BỊ MỞ KHOÁ (nguy cơ leo thang đặc quyền)");
});
