// HỢP ĐỒNG — «FORM CÓ TAB ⇒ NHÁNH RENDER **PHẢI** CÓ `key` (⛔ tránh React TÁI DÙNG ô nhập)» (ERP-SESSION-03 · `BUG-20261007-C12` phần 2 · **LUẬT 18**)
//
// ⛔ SỰ CỐ ĐÃ ĐO (2026-10-09): `HrProfileEditModal` render **2 nhánh tab CÙNG loại** `<div className="form-grid">` ở **CÙNG vị trí** **không có `key`**
//   ⇒ React **TÁI DÙNG** `<input>` cũ ⇒ `defaultValue` ⛔ không áp lại ⇒ tab «Thông tin cá nhân» **HIỆN giá trị của tab «Thông tin user»**:
//   «Số CCCD/CMND» = **«E2E-DIAG»** (= **mã nhân viên**) · «Địa chỉ thường trú» = **«Chẩn đoán»** (= **họ tên**) · «Trình độ» = **«Chỉ huy trưởng»** (= **chức danh**)
//   ⇒ ⚠️ **Bấm Lưu là GHI giá trị SAI vào hồ sơ** (⭐ khớp hồ sơ `cha.ht`).
//
// ✅ CÁCH VÁ ĐANG ĐƯỢC KHOÁ: mọi nhánh ternary render **cùng loại thẻ bao ngoài** trong một component **CÓ TAB** ⇒ **PHẢI có `key`** (⭐ vd `key={tab}`).
//
// ⚠️ GIỚI HẠN (⭐ trung thực): đây là cổng **TĨNH** — nó bắt **đúng mẫu đã gây lỗi** (2 nhánh cùng loại thẻ, thiếu `key`),
//    ⛔ **KHÔNG** bắt được mọi đường React tái dùng ô (vd **map theo index** · **fragment đổi thứ tự**) ⇒ ⭐ vẫn cần **kiểm ĐỘNG** ở form mới.
//
// Chạy riêng:  node --test tests/mt3-c14-tab-form-remount.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");

/** Liệt kê mọi tệp `.tsx` trong `app/**`. */
function appFiles(dirUrl = new URL("../app/", import.meta.url), prefix = "app/") {
  const out = [];
  for (const e of readdirSync(dirUrl, { withFileTypes: true })) {
    const next = prefix + e.name;
    if (e.isDirectory()) { out.push(...appFiles(new URL(e.name + "/", dirUrl), next + "/")); continue; }
    if (e.name.endsWith(".tsx")) out.push(next);
  }
  return out;
}

/** Tệp có TAB không? */
export const hasTabs = (src) => /role="tab"|aria-selected=/.test(src);

/**
 * ⛔ MẪU NGUY HIỂM: **CÙNG một `className`** xuất hiện ở **≥2 nhánh ternary** (`? (` **và** `) : (`) mà **THIẾU `key`**
 *   ⇒ ⭐ đúng điều kiện React TÁI DÙNG ô nhập (2 nhánh cùng loại thẻ ở cùng vị trí).
 * ⚠️ BÀI HỌC (đã mắc): bộ dò đời đầu ⛔ **chỉ khớp `? (`** ⇒ **bỏ sót nhánh `) : (`** ⇒ chỉ bắt 1/2 nhánh
 *   ⇒ ⭐ **đối chứng âm `C14-3` đã phát hiện** (⛔ nếu không có nó thì cổng này **ĐẠT RỖNG**).
 * ⭐ Trả về mảng className (mỗi nhánh vi phạm 1 phần tử) để giữ hình dạng dễ khẳng định.
 */
export function branchesWithoutKey(src) {
  const keyless = new Map();
  for (const m of src.matchAll(/[?:]\s*\(\s*<div\s+className="([^"]+)"([^>]*)>/g)) {
    const [, cls, rest] = m;
    if (!/\bkey=/.test(rest)) keyless.set(cls, (keyless.get(cls) || 0) + 1);
  }
  const bad = [];
  for (const [cls, n] of keyless) if (n >= 2) for (let i = 0; i < n; i++) bad.push(cls);
  return bad;
}

test("C14-1 · ⛔ KHÔNG có nhánh tab render cùng loại thẻ mà THIẾU `key` (mọi tệp `app/**` có TAB)", () => {
  const files = appFiles();
  // ⭐ CHỐT VÙNG PHỦ (⭐ chống «ĐẠT RỖNG» — bài học 21): ⛔ nếu bộ quét ⛔ KHÔNG đọc được tệp nào thì cổng này VÔ NGHĨA.
  assert.ok(files.length >= 40, `⛔ CHỐT VÙNG PHỦ: chỉ quét được ${files.length} tệp \`.tsx\` trong \`app/**\` (kỳ vọng ≥ 40) ⇒ bộ quét HỎNG, ⛔ kết quả bên dưới VÔ NGHĨA`);
  assert.ok(files.includes("app/screens/HrProfileEditModal.tsx"), "⛔ CHỐT VÙNG PHỦ: tệp đã vá phải nằm trong danh sách quét");
  const withTabs = files.filter((f) => hasTabs(read(f)));
  assert.ok(withTabs.length >= 3, `⛔ CHỐT VÙNG PHỦ: chỉ thấy ${withTabs.length} tệp có TAB (kỳ vọng ≥ 3) ⇒ bộ dò \`hasTabs\` HỎNG`);
  const offenders = [];
  for (const f of withTabs) {
    const bad = branchesWithoutKey(read(f));
    if (bad.length) offenders.push(`${f} → nhánh thiếu key: ${bad.map((c) => `«${c}»`).join(", ")}`);
  }
  assert.deepEqual(offenders, [],
    "⛔ NGUY CƠ `BUG-20261007-C12` phần 2 (React TÁI DÙNG ô nhập ⇒ hiển thị & LƯU SAI giá trị):\n" + offenders.join("\n") +
    "\n⇒ thêm `key` cho nhánh (⭐ vd `key={tab}`) — xem mẫu `app/screens/HrProfileEditModal.tsx` dòng 175/191.");
});

test("C14-2 · Tệp đã vá PHẢI còn `key={tab}` trên CẢ HAI nhánh", () => {
  const src = read("app/screens/HrProfileEditModal.tsx");
  const n = (src.match(/className="form-grid"\s+key=\{tab\}/g) || []).length;
  assert.equal(n, 2, `⛔ phải có ĐÚNG 2 nhánh \`form-grid\` kèm \`key={tab}\` (đang có ${n})`);
});

test("C14-3 · ĐỐI CHỨNG ÂM: bộ dò PHẢI bắt mẫu CŨ (⛔ nếu không thì cổng VÔ DỤNG)", () => {
  // ⭐ MẪU THẬT lấy từ mã TRƯỚC khi vá:
  const old = `{tab === "user" ? (\n<div className="form-grid">\n<label><span>Mã nhân viên</span><input name="employeeCode" /></label>\n</div>\n) : (\n<div className="form-grid">\n<label><span>Số CCCD/CMND</span><input name="identityNo" /></label>\n</div>\n)}`;
  assert.deepEqual(branchesWithoutKey(old), ["form-grid", "form-grid"], "⛔ bộ dò HỎNG: không bắt được mẫu mất dữ liệu thật");
  // ⛔ Và ⛔ KHÔNG báo oan mẫu ĐÃ VÁ:
  const fixed = `{tab === "user" ? (\n<div className="form-grid" key={tab}>\n<input name="employeeCode" />\n</div>\n) : (\n<div className="form-grid" key={tab}>\n<input name="identityNo" />\n</div>\n)}`;
  assert.deepEqual(branchesWithoutKey(fixed), [], "⛔ báo OAN mẫu đã vá");
});
