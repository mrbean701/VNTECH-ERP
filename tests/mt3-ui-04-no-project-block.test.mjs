// MT3-UI-04 — HỢP ĐỒNG: bỏ khối «Chọn dự án» độc lập ở đầu trang (MT3 §IV.5).
//
// MT3 §IV.5: «Bỏ tất cả khối "Chọn dự án" độc lập ở đầu trang. Nếu phân hệ vẫn cần chọn dự án,
// chuyển thành filter hoặc control trong toolbar CRUD. ⛔ Không làm mất phạm vi dự án hiện tại
// hoặc quyền truy cập dự án.»
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const page = read("app/page.tsx");
const requests = read("app/screens/Requests.tsx");

test("MT3-UI-04 — Phiếu đề nghị mua hàng: lựa chọn dự án NẰM TRONG TOOLBAR", () => {
  // ⛔ Không còn dải chip dự án rời ngoài toolbar.
  assert.doesNotMatch(requests, /className="global-project-scope-chip"/,
    "⛔ còn khối 'Dự án' rời ở đầu trang màn Phiếu đề nghị mua hàng");
  // ✅ Phải có control chọn dự án trong toolbar, gắn đúng callback sẵn có.
  assert.match(requests, /list-toolbar-field"><span>Dự án<\/span>/, "phải có bộ lọc «Dự án» trong toolbar");
  assert.match(requests, /onChange=\{\(event\)=>onProject\(event\.target\.value\)\}/,
    "bộ lọc phải dùng đúng callback `onProject` sẵn có (⛔ không tự tạo state mới)");
  assert.match(requests, /<option value="ALL">Tất cả dự án<\/option>/, "phải giữ lựa chọn «Tất cả dự án»");
});

test("MT3-UI-04 — ⛔ TOÀN HỆ THỐNG: không còn khối «Dự án» rời (dải chip chỉ-đọc) ở đầu trang", () => {
  // MT3 §IV.5: «Bỏ TẤT CẢ khối "Chọn dự án" độc lập ở đầu trang».
  // ⚠️ Lưu ý: audit đầu tiên của tôi CHỈ thấy 1 chỗ; đọc kỹ mới ra 3 chỗ (Thi công/Phòng ban,
  //    Tiến độ dự án, Trung tâm phê duyệt) — test này khoá theo số KHỚP để không bỏ sót lần sau.
  const chips = (src) => [...src.matchAll(/global-project-scope-chip/g)].length;
  assert.equal(chips(page), 0, `⛔ còn ${chips(page)} khối «Dự án» rời trong app/page.tsx`);
  assert.equal(chips(requests), 0, `⛔ còn ${chips(requests)} khối «Dự án» rời trong Requests.tsx`);
});

test("MT3-UI-04 — mỗi chỗ đã đổi phải thành BỘ LỌC có select, dùng prop `onProject` sẵn có", () => {
  // DepartmentTaskWorkspace (Phòng ban) · ProjectProgress (Tiến độ dự án) · Approvals (Trung tâm phê duyệt)
  const sel = /list-toolbar-field"><span>Dự án<\/span><select value=\{project\} onChange=\{e=>onProject\(e\.target\.value\)\}/g;
  assert.equal([...page.matchAll(sel)].length, 3,
    "⛔ phải có ĐÚNG 3 bộ lọc «Dự án» có select trong page.tsx (Phòng ban · Tiến độ dự án · Trung tâm phê duyệt)");
  for (const m of [...page.matchAll(sel)]) {
    assert.match(page.slice(m.index, m.index + 400), /<option value="ALL">Tất cả dự án<\/option>/,
      "mỗi bộ lọc phải giữ lựa chọn «Tất cả dự án»");
  }
});

test("MT3-UI-04 — màn Phòng ban: chip dự án chỉ-đọc đã thành BỘ LỌC có chọn được", () => {
  assert.doesNotMatch(page, /<span className="global-project-scope-chip">Dự án:/,
    "⛔ còn chip 'Dự án' chỉ đọc ở đầu trang");
  assert.match(page, /list-toolbar-field"><span>Dự án<\/span><select value=\{project\} onChange=\{e=>onProject\(/,
    "phải là bộ lọc «Dự án» có select, dùng onProject sẵn có (⛔ không tự tạo state mới)");
});

test("MT3-UI-04 — ⛔ KHÔNG được mất phạm vi dự án: logic lọc cũ phải còn nguyên", () => {
  // `filteredRequests` lọc theo `project` — phải giữ nguyên để không mất phạm vi hiện tại.
  assert.match(page, /data\.requests\.filter\(\(row\) => \(project === "ALL" \|\| row\.projectId === project\)/,
    "⛔ mất điều kiện lọc theo phạm vi dự án ở `filteredRequests`");
  // Bộ lọc phòng ban vẫn phải còn.
  assert.match(page, /projectMatchesFilters\(row, filterState, projectFilterContext/,
    "bộ lọc theo phạm vi dự án ở màn Phòng ban phải còn nguyên");
});

test("MT3-UI-04 — các màn KHÔNG bị đụng (bảng tab không phải bộ chọn dự án)", () => {
  // ⚠️ Bài học từ audit: `.project-scope-tabs` là DẢI TAB, không phải bộ chọn dự án ⇒ ⛔ không được sửa.
  for (const f of ["app/screens/Inventory.tsx", "app/screens/AllocateReturn.tsx"]) {
    const src = read(f);
    assert.doesNotMatch(src, /<select[^>]*>[\s\S]{0,80}Dự án/, `⛔ ${f} bị thêm bộ chọn dự án không cần thiết`);
  }
  // Tổ độc đã có filter dự án TRONG toolbar từ trước ⇒ phải giữ nguyên.
  const team = read("app/screens/TeamDirectory.tsx");
  assert.match(team, /value:\s*projectFilter/, "⛔ mất bộ lọc dự án trong toolbar của màn Tổ đội");
});
