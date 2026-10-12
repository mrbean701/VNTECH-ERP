// HỢP ĐỒNG — «MÀN HỒ SƠ NHÂN SỰ ⛔ KHÔNG ĐƯỢC GHI ĐÈ HỒ SƠ ĐANG CÓ + NGÀY PHẢI QUA `date()`» (ERP-SESSION-03 · 10/10/2026 · `BUG-20261007-C15`)
//
// ⛔ SỰ CỐ ① (MẤT DỮ LIỆU — cùng lớp `BUG-20261007-C12`):
//   Backend `HrManagementUseCase:32-39`: hồ sơ ĐÃ TỒN TẠI ⇒ nhánh `store.updateHrRecord(… nvl(payload.get("x")) …)` ⇒ ⭐ **khoá VẮNG = NULL**.
//   ⚠️ Nút «＋ Lập hồ sơ» trước đây đổ **TOÀN BỘ** `staffDirectory` vào dropdown ⇒ ⚠️ chọn một nhân sự **đã có hồ sơ** rồi lưu form (phần lớn ô TRỐNG)
//   ⇒ ⛔ **XOÁ SẠCH** các trường cũ. ⭐ ĐO ĐƯỢC: **42** nhân sự hoạt động vs **26** hồ sơ ⇒ ⚠️ **26 người** phơi ra rủi ro.
//   ✅ VÁ: danh sách chọn CHỈ gồm người **CHƯA có hồ sơ** (+ chốt chặn thứ hai khi lưu).
//
// ⛔ SỰ CỐ ② (LỆCH ĐỊNH DẠNG NGÀY): cột «Ngày sinh» / «Ngày vào» in **THÔ** `{r.birthDate||"—"}` ⇒ hiện **`1995-09-02`** (ISO)
//   trong khi TOÀN APP hiện **`dd/mm/yyyy`** qua `date()` (⭐ `HrScreen` **đã import `date`** mà gọi **0 lần** — ⭐ đúng «dấu hiệu chí mạng» đã ghi ở `mt3-c10`).
//   ⭐ ĐO ĐƯỢC trong CSDL: `birth_date='1995-09-02'` · `joined_date='2024-09-15'` (ISO) ⇒ ✅ VÁ: bọc `date(...)`.
//
// Chạy riêng:  node --test tests/mt3-c17-hr-screen-safety.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const SCREEN = "app/screens/HrScreen.tsx";

/** ⛔ MẪU NGUY HIỂM ①: đổ TOÀN BỘ `staffDirectory` vào dropdown chọn nhân sự. */
export function doiTuongGhiDe(src) {
  return /name="userId"[\s\S]{0,400}?data\.staffDirectory\.map\(/.test(src);
}

/** ⛔ MẪU NGUY HIỂM ②: in NGÀY THÔ (⛔ không qua `date()`). */
export function ngayTho(src) {
  return [...src.matchAll(/\{r\.(birthDate|joinedDate)\s*\|\|\s*"—"\}/g)].map((m) => m[1]);
}

test("C17-1 · ⭐ CHỐT VÙNG PHỦ: đọc đúng tệp màn HR (⛔ không ĐẠT RỖNG)", () => {
  const src = read(SCREEN);
  assert.ok(src.length > 800, `⛔ CHỐT VÙNG PHỦ: chỉ đọc được ${src.length} ký tự của \`${SCREEN}\``);
  assert.match(src, /function HrScreen/, "⛔ CHỐT VÙNG PHỦ: phải tìm thấy `function HrScreen`");
  assert.match(src, /data\.staffDirectory/, "⛔ CHỐT VÙNG PHỦ: phải thấy `staffDirectory` (nguồn danh sách nhân sự)");
});

test("C17-2 · ⛔ Dropdown «Lập hồ sơ» ⛔ KHÔNG được đổ TOÀN BỘ nhân sự (⚠️ ghi đè hồ sơ đang có ⇒ MẤT DỮ LIỆU)", () => {
  const src = read(SCREEN);
  assert.equal(doiTuongGhiDe(src), false,
    "⛔ TÁI PHÁT lớp `BUG-C12/C15`: dropdown chọn nhân sự đổ TOÀN BỘ `data.staffDirectory` ⇒ " +
    "chọn người ĐÃ CÓ hồ sơ + lưu form trống ⇒ backend `updateHrRecord(nvl(...))` XOÁ SẠCH hồ sơ cũ. " +
    "⇒ phải LỌC bỏ người đã có hồ sơ (⭐ khớp KPI «Còn thiếu hồ sơ»).");
  // ⭐ Và PHẢI có bộ lọc ấy + dùng nó cho dropdown:
  assert.match(src, /missingProfile/, "⛔ thiếu danh sách `missingProfile` (nhân sự CHƯA có hồ sơ)");
  assert.match(src, /missingProfile\.map\(/, "⛔ dropdown phải dùng `missingProfile.map(...)`");
});

test("C17-3 · ⭐ PHẢI có chốt chặn THỨ HAI khi lưu (hỏi xác nhận nếu người đã có hồ sơ)", () => {
  const src = read(SCREEN);
  assert.match(src, /rows\.find\(\(r\)\s*=>\s*String\(r\.userId\)\s*===\s*userId\)/,
    "⛔ thiếu kiểm tra «nhân sự đã có hồ sơ» trong `saveHr`");
  assert.match(src, /window\.confirm\(/, "⛔ thiếu `window.confirm` cảnh báo GHI ĐÈ trước khi lưu");
});

test("C17-4 · ⛔ KHÔNG còn NGÀY THÔ trong bảng (⛔ phải qua `date()`) + ĐỐI CHỨNG ÂM", () => {
  const src = read(SCREEN);
  assert.deepEqual(ngayTho(src), [],
    "⛔ ngày in THÔ ⇒ hiện `yyyy-mm-dd` (ISO) trong khi toàn app hiện `dd/mm/yyyy` (⭐ `date()` đã import sẵn)");
  assert.equal((src.match(/\{date\(r\.(birthDate|joinedDate)\)\}/g) || []).length, 2,
    "⛔ phải có ĐÚNG 2 cột ngày đi qua `date()` (Ngày sinh · Ngày vào)");
  // ⛔ Đối chứng âm: bộ dò PHẢI bắt mẫu CŨ (⛔ nếu không thì cổng VÔ DỤNG):
  const cu = `<td>{r.birthDate||"—"}</td><td>{r.joinedDate||"—"}</td><td>{r.phone||"—"}</td>`;
  assert.deepEqual(ngayTho(cu), ["birthDate", "joinedDate"], "⛔ bộ dò HỎNG: không bắt được mẫu ngày thô thật");
  // ⛔ Và ⛔ KHÔNG báo oan mẫu đã vá:
  const moi = `<td>{date(r.birthDate)}</td><td>{date(r.joinedDate)}</td><td>{r.phone||"—"}</td>`;
  assert.deepEqual(ngayTho(moi), [], "⛔ báo OAN mẫu đã vá");
});
