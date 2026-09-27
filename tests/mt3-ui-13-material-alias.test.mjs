// MT3-UI-13 — HỢP ĐỒNG: danh sách TÊN PHỤ (alias) của vật tư phải được CHUẨN HOÁ trước khi lưu.
//
// MT3 §H: «Modal thêm/sửa vật tư có chức năng thêm nhiều tên phụ/alias. Cho phép thêm/xoá alias
//   trong form trước khi lưu. **Không cho alias rỗng hoặc trùng vô nghĩa sau khi chuẩn hóa.**»
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const page = read("app/page.tsx");

test("MT3-UI-13 — form vật tư CÓ ô nhập NHIỀU alias", () => {
  assert.match(page, /<textarea name="aliasText"/, "form phải có ô nhập alias (nhiều tên, mỗi dòng 1 tên)");
  assert.match(page, /name="aliasText"[^>]*placeholder="Mỗi tên một dòng hoặc cách nhau bằng dấu ;"/,
    "placeholder phải hướng dẫn nhập nhiều tên phụ");
});

test("MT3-UI-13 — có hàm CHUẨN HOÁ alias và được GỌI khi lưu", () => {
  assert.match(page, /function normalizeAliases\(/, "phải có hàm chuẩn hoá danh sách alias");
  assert.match(page, /const aliases = normalizeAliases\(typedRaw\)/, "hàm chuẩn hoá phải được gọi khi lưu");
  assert.match(page, /aliasText: aliases\.join\("; "\)/, "phải LƯU danh sách đã chuẩn hoá (không lưu nguyên chuỗi thô)");
});

test("MT3-UI-13 — ⛔ loại alias RỖNG và TRÙNG sau khi chuẩn hoá", () => {
  assert.match(page, /if \(!value\) continue;/, "⛔ phải bỏ mụn rỗng");
  assert.match(page, /if \(seen\.has\(key\)\) continue;/, "⛔ phải bỏ mụn trùng");
  assert.match(page, /value\.toLocaleLowerCase\("vi"\)/, "⛔ so trùng KHÔNG phân biệt hoa/thường");
  assert.match(page, /part\.replace\(\/\\s\+\/g, " "\)/, "phải gộp khoảng trắng thừa trước khi so sánh");
});

test("MT3-UI-13 — ⛔ chặn khi user gõ alias nhưng không còn tên phụ hợp lệ nào", () => {
  assert.match(page, /typedRaw\.replace\(\/\[\\n;\]\+\/g, ""\)\.trim\(\) && !aliases\.length/,
    "phải chặn lưu khi đã gõ alias nhưng sau chuẩn hoá không còn tên nào hợp lệ");
  assert.match(page, /window\.alert\("Tên phụ \(alias\) không hợp lệ\./, "phải báo rõ lý do chặn");
});

test("MT3-UI-13 — ⛔ KHÔNG được tự đặt luật nghiệp vụ mới ngoài chuẩn hoá văn bản", () => {
  // Chỉ được phép: tách ký tự, trim, gộp khoảng trắng, so trùng. ⛔ Không tự sinh alias.
  const fn = page.slice(page.indexOf("function normalizeAliases("), page.indexOf("async function send("));
  assert.doesNotMatch(fn, /toLowerCase\(\)\.replace|normalize\("NFKD"\)|\bgenerateAlias\b/,
    "⛔ không được tự sinh hay biến đổi tên phụ ngoài chuẩn hoá khoảng trắng/hoa-thường");
});
