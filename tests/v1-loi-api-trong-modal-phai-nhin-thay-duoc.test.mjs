/**
 * VNTECH ERP — HỢP ĐỒNG KIỂM THỬ RIÊNG (VNTECH proprietary)
 *
 * VÒNG 1 (GO-LIVE) — BUG-202010-002 / yêu cầu số 8: «test phân quyền cho user nhưng bấm lưu
 * thì lại không được, mở lại tab ra thì không thấy hiển thị các quyền tôi đã cấp cho user».
 *
 * ── BẰNG CHỨNG ĐÃ ĐO (02/10/2026, không phải suy đoán) ───────────────────────────────
 * 1. BACKEND — `java-backend/application/src/main/java/com/vntech/erp/application/service/
 *    UserManagementUseCase.java:480-511` (`assertDepartmentAllowsPermissions`) ném 400 khi
 *    phòng ban của tài khoản chưa được cấp `can_view` cho một chức năng đang cấp.
 *    Đo từ API sống (Java `:18081` qua proxy `:9000`): 8 đơn vị, 478 dòng quyền phòng ban,
 *    mỗi đơn vị chỉ phủ 59-60/76 chức năng ⇒ 441/2052 cặp (tài khoản × chức năng) bị chặn
 *    = 21,5%. Đã tái hiện: HTTP 400 «Phòng ban "Phòng Dự án" chưa được cấp quyền cho chức
 *    năng "admin_tab_01"…». Lỗi ném ở dòng 502, TRƯỚC `runAtomically` (dòng 278) ⇒ không ghi gì.
 * 2. API — thông báo lỗi CÓ trả về đúng, không phải mất.
 * 3. UI — `action()` (`app/page.tsx:405`) `setError(...)` ⇒ nhánh render ở `:718` vẽ
 *    `<div className="inline-alert danger">` BÊN TRONG `<main className="main-content">`.
 *    Mà `.overlay` trong `app/globals.css` là `position:fixed; inset:0; z-index:100` và modal
 *    vẽ ở gốc app, SAU `</main>` ⇒ thông báo lỗi nằm SAU tấm overlay ⇒ người dùng không thấy.
 * 4. Hệ thống ĐÃ CÓ cơ chế đúng: `.toast { position:fixed; … z-index:150 }` và
 *    `{toast && <div className="toast">…}` render ở gốc app SAU modal — nhưng chỉ dùng cho
 *    thông báo THÀNH CÔNG. Lỗi thì không dùng ⇒ mọi lỗi API trong modal đều vô hình.
 *
 * ── ROOT CAUSE ────────────────────────────────────────────────────────────────────────
 * Lỗi toàn cục được vẽ trong luồng trang nền, nằm dưới lớp overlay của modal (z-index 100).
 * Người dùng bấm «Lưu bảng phân quyền», API trả 400, modal không đóng — mà lý do nằm sau
 * tấm overlay nên không ai thấy. Vì chưa có gì được ghi nên mở lại tab cũng không thấy quyền.
 * ⇒ Sửa đúng chỗ: dùng CHÍNH cơ chế `.toast` sẵn có của nhà để báo lỗi (D-092 — một thay đổi,
 * một cơ chế), không bịa thêm lớp CSS mới cho lớp vân tay z-index.
 *
 * LƯU ü BẮT BUỘC: khẳng định chạy trên MÃ, không trên CHÚ THÍCH — bản sửa có giải thích
 * bằng chính những chuỗi bị cấm, nên phải bóc chú thích trước (giống `tests/v1-truy-vet-…`).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// `:` đứng ngay trước `//` là nhãn TypeScript, không phải chú thích — cắt nó sẽ phá mã.
const codeOf = (src) =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .split("\n")
    .map((line) => {
      const i = line.indexOf("//");
      if (i === -1) return line;
      return i > 0 && line[i - 1] === ":" ? line : line.slice(0, i);
    })
    .join("\n");

const read = (p) => readFileSync(p, "utf8");
const page = read("app/page.tsx");
const css = read("app/globals.css");
const pageCode = codeOf(page);

/** Lấy MỌI z-index khai trong các rule mà selector có nhắc tới `.ten` (D-097a: đọc từ tệp). */
const zIndexesFor = (selector) => {
  const re = new RegExp(`(^|[\\s,>+~])\\.${selector}(?![\\w-])`);
  const found = [];
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!re.test(m[1])) continue;
    const z = /z-index\s*:\s*(-?\d+)/.exec(m[2]);
    if (z) found.push(Number(z[1]));
  }
  return found;
};

const hasPositionFixed = (selector) =>
  [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].some(
    (m) => new RegExp(`(^|[\\s,>+~])\\.${selector}(?![\\w-])`).test(m[1]) && /position\s*:\s*fixed/.test(m[2]),
  );

test("VỆ 1 — lỗi toàn cục phải nổi TRÊN modal, không chui xuống trang nền", () => {
  assert.match(
    pageCode,
    /globalError\s*&&\s*<div className="toast[^"]*"[^>]*data-vntech="global-error"/,
    "Lỗi phải dùng đúng cơ chế `.toast` sẵn có của nhà (render ở gốc app, sau khối modal).",
  );
});

test("VỆ 2 — KHÔNG được còn render lỗi bằng `inline-alert` trong luồng trang nền", () => {
  assert.doesNotMatch(
    pageCode,
    /globalError\s*&&\s*<div className="inline-alert/,
    "Còn dòng render lỗi trong `main-content` ⇒ lỗi vẫn nằm sau overlay, đồng thời hiện 2 nơi.",
  );
});

test("VỆ 3 — neo z-index phải đúng: `.toast` phải nằm TRÊN `.overlay`", () => {
  const overlayZ = zIndexesFor("overlay");
  const toastZ = zIndexesFor("toast");
  assert.ok(overlayZ.length > 0, "Phải tìm thấy z-index của `.overlay` để so sánh.");
  assert.ok(toastZ.length > 0, "Phải tìm thấy z-index của `.toast` để so sánh.");
  assert.ok(
    Math.max(...toastZ) > Math.max(...overlayZ),
    `Đo được .toast z-index ${Math.max(...toastZ)} phải lớn hơn .overlay z-index ${Math.max(...overlayZ)}.`,
  );
  assert.ok(hasPositionFixed("toast"), "`.toast` phải `position:fixed` mới thoát khỏi luồng trang nền.");
});

test("VỆ 4 — cả hai modal phân quyền phải CHỈ đóng khi API trả thành công", () => {
  // MỐC 117: thẻ «Phân quyền công việc / chức năng» và tab «Phân quyền người dùng» là hai
  // nơi nhưng cùng một việc (D-088) ⇒ phải cùng một hành vi: lỗi thì modal ĐỪNG đóng.
  const len = (pageCode.match(/if\(await submit\("save_user_access"/g) || []).length;
  assert.equal(len, 2, "Cả `UserEditModal` và `UserAccessModal` phải chặn `close()` sau kết quả submit.");
  assert.doesNotMatch(
    pageCode,
    /await submit\("save_user_access"[^;]*;\s*close\(\)/,
    "Không được bỏ điều kiện — lỗi thì modal phải giữ nguyên để người dùng thấy lý do.",
  );
});

test("VỆ 5 — đối chứng âm: đưa lỗi về `inline-alert` thì VỆ 1/2 phải đỏ", () => {
  const run = (src) => ({
    v1: /globalError\s*&&\s*<div className="toast[^"]*"[^>]*data-vntech="global-error"/.test(src),
    v2: !/globalError\s*&&\s*<div className="inline-alert/.test(src),
  });
  const that = run(pageCode);
  const hoiQuy = run(
    pageCode.replace(
      /(globalError\s*&&\s*<div className=")toast([^"]*")([^>]*)/,
      '$1inline-alert danger"$3',
    ),
  );
  assert.equal(that.v1, true, "Mã đã sửa thì VỆ 1 phải xanh.");
  assert.equal(that.v2, true, "Mã đã sửa thì VỆ 2 phải xanh.");
  assert.equal(hoiQuy.v1, false, "Đối chứng âm: đổi về `inline-alert` thì VỆ 1 phải BẮT ĐƯỢC.");
  assert.equal(hoiQuy.v2, false, "Đối chứng âm: đổi về `inline-alert` thì VỆ 2 phải BẮT ĐƯỢC.");
});
