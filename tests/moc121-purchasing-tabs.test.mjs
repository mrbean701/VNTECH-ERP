// MỐC 121 (01/10/2026) — HỢP ĐỒNG DẢI TAB "PR & PO" + BÀI HỌC "PR74PO28".
//
// BỐI CẢNH — vì sao tệp test này tồn tại:
//   Màn Mua hàng đã có 2 tab PR/PO từ TASK-119 (21/09/2026): state, cột, toolbar đổi theo tab,
//   markup `role="tablist"`. NHƯNG không tệp CSS nào định nghĩa `.purchase-tabbar` / `.purchase-tab`.
//   ⇒ 4 `<button>` rơi về `display:inline` mặc định, chữ dính liền, user thấy đúng chuỗi
//   "PR74PO28". Đo trên dữ liệu thật (/api/system): `requests = 74`, `purchaseOrders = 28` ⇒
//   `PR` + `74` + `PO` + `28` khớp tuyệt đối.
//
// VÌ SAO LỖI ĐÓ LỌT QUA CỔNG CŨ:
//   `scripts/css-baseline-audit.mjs` trước đây CHỈ đọc `app/globals.css`, trong khi `app/layout.tsx`
//   nạp 4 tệp (tokens → globals → canonical → font-floor) và `canonical.css` — nơi CSS mới đặt —
//   nạp SAU nên thắng điểm cùng cấp độ. 205 lớp chỉ tồn tại trong `canonical.css` nằm ngoài tầm
//   nhìn của cổng. Cổng chỉ kiểm chiều "CSS chết" (CSS có / mã không dùng), KHÔNG kiểm chiều
//   ngược lại — chính là lỗi đã gặp.
//
// NGUYÊN TẮC (giữ đúng D-044 trong docs/dsh-state/DECISIONS.md):
//   KHÔNG được nới lỏng điều kiện để làm test xanh; chỉ được MỞ RỘNG. Nếu màn này đổi bố cục,
//   hãy sửa lại HỢP ĐỒNG cho khớp và ghi lý do — đừng xoá phần kiểm.
// ⛔ CẬP NHẬT vòng 211 · mục 1.4 (USER yêu cầu thêm tab thứ 3): dải tab nay có ĐÚNG 3 tab —
//   `PR` · `PO` · «Chi tiết lũy kế theo vật tư». Ý của chỉ đạo 21/09 (KHÔNG tách chứng từ MR thành tab
//   riêng) vẫn giữ: 2 tab CHỨNG TỪ là PR/PO, tab thứ 3 là bảng TỔNG HỢP từ `boqItems`, không có
//   `requestNo`/`poNo` riêng. Bảng lũy kế «theo từng vật tư» ĐÃ CHUYỂN từ cuối màn vào thành tab 3.
//   Mọi khẳng định cũ về `role="tab"` · `data-vntech="purchasing-tab-count"` · chống lỗi "PR74PO28"
//   vẫn giữ nguyên — không nới lỏng điều kiện nào (đúng nguyên tắc D-044 ở đầu tệp).
// Chạy riêng:  node --test tests/moc121-purchasing-tabs.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const purchasing = readFileSync(new URL("../app/screens/Purchasing.tsx", import.meta.url), "utf8");
const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
const cssRaw = [
  readFileSync(new URL("../app/styles/canonical.css", import.meta.url), "utf8"),
  readFileSync(new URL("../app/globals.css", import.meta.url), "utf8"),
].join("\n");
// ⭐ BÓC CHÚ THÍCH trước khi dò. Nếu không, banner của khối CSS mới (vốn liệt kê tên selector dưới
// dạng văn xuôi) sẽ làm cho phép "còn class" đúng một cách giả — đã xảy ra thật trong lúc viết cổng.
const css = cssRaw.replace(/\/\*[\s\S]*?\*\//g, "");
const hasRule = (name) => new RegExp(`\\.${name.replace(/-/g, "\\-")}(?![\\w-])`).test(css);
const ruleBody = (name) => css.match(new RegExp(`\\.${name.replace(/-/g, "\\-")}(?![\\w-])[^{]*\\{([^}]*)\\}`))?.[1] ?? "";
// MỤC 2 (VÒNG 1 GO-LIVE) — cần đo thân của một selector GHÉP (`.a .b button`), không chỉ một lớp.
const scopedBody = (selector) => {
  const i = css.indexOf(`${selector}{`);
  if (i < 0) return "";
  const j = css.indexOf("}", i);
  return j < 0 ? "" : css.slice(i + selector.length + 1, j);
};

test("MỐC 121 — dải tab có ĐÚNG 3 tab (PR · PO · MAT), mỗi tab một nguồn danh sách", () => {
  assert.match(purchasing, /type TabKey = "PR" \| "PO" \| "MAT"/);
  assert.match(purchasing, /PURCHASING_TABS[\s\S]*?key: "PR"[\s\S]*?source: "requests"/);
  assert.match(purchasing, /PURCHASING_TABS[\s\S]*?key: "PO"[\s\S]*?source: "purchaseOrders"/);
  assert.match(purchasing, /PURCHASING_TABS[\s\S]*?key: "MAT"[\s\S]*?source: "boqItems"/);
  const tabs = purchasing.match(/const PURCHASING_TABS[^;]*;/)?.[0] ?? "";
  assert.equal((tabs.match(/key: "/g) || []).length, 3, "dải tab phải có đúng 3 tab (vòng 211 · mục 1.4)");
  assert.doesNotMatch(tabs, /key: "MR"/, "tab `MR` KHÔNG được quay lại — chỉ đạo 21/09 vẫn hiệu lực");
});

test("MỐC 121 · MỤC 2 (GO-LIVE) — markup tab theo KHUÔN NHÀ `.project-scope-tabs` + trợ năng", () => {
  // ⚠️ HỢP ĐỒNG ĐỔI THEO YÊU CẦU MỚI (GO-LIVE mục 2): «Thiết kế tab PR PO Chi tiết lũy kế theo vật tư
  //    giống như tabbar của menu công việc.» Khuôn nhà đo được ở `app/screens/WorkCenter.tsx:295`:
  //    `.project-scope-tabs` + `<button className="active">`. Lớp tự chế `.purchase-tabbar`/`.purchase-tab`
  //    của MỐC 121 bị bỏ ⇒ 3 khẳng định trợ năng bên dưới GIỮ NGUYÊN, chỉ đổi tên lớp vỏ.
  assert.match(purchasing, /className="project-scope-tabs" role="tablist"/);
  assert.match(purchasing, /role="tab"/);
  assert.match(purchasing, /aria-selected=\{activeTab===tab\.key\}/);
  assert.match(purchasing, /onClick=\{\(\)=>setActiveTab\(tab\.key\)\}/);
  // ⛔ KHÔNG được quay lại lớp tự chế — mục 2 yêu cầu dùng đúng khuôn nhà.
  assert.doesNotMatch(purchasing, /purchase-tabbar|purchase-tab(?![A-Za-z0-9_-])/, "còn lớp tab tự chế của MỐC 121");
});

test("MỐC 121 — tab hiện SỐ ĐẾM riêng cho từng tab (chính là thứ dính thành 'PR74PO28')", () => {
  assert.match(purchasing, /data-vntech="purchasing-tab-count"/);
  assert.match(purchasing, /\{format\.format\(counts\[tab\.key\]\)\}/);
  // số đếm PHẢI tách khỏi nhãn bằng phần tử riêng, không được gộp chuỗi
  assert.doesNotMatch(purchasing, /\$\{tab\.label\}\$\{/, "nhãn tab đang bị nối thẳng với số đếm");
});

test("MỐC 121 · MỤC 2 — ⭐ CHỐNG LỖI 'PR74PO28' TRÊN KHUÔN MỚI: nút tab PHẢI inline-flex + CÓ gap", () => {
  // ⛔ ĐÂY LÀ VỆ QUAN TRỌNG NHẤT CỦA TỆP NÀY — giữ nguyên tinh thần, chỉ đổi selector theo khuôn nhà.
  //    Lỗi gốc MỐC 121: nút rơi về `display:inline` ⇒ nhãn dính thẳng vào số đếm thành "PR74PO28".
  const body = scopedBody(".purchasing-screen .project-scope-tabs button");
  assert.ok(body, "không tìm thấy rule nút tab của màn Mua hàng (khuôn `.purchasing-screen .project-scope-tabs button`)");
  assert.match(body, /display:\s*inline-flex/, "thiếu display:inline-flex ⇒ nút rơi về inline và nhãn dính vào số đếm");
  assert.match(body, /gap:/, "thiếu gap ⇒ nhãn tab dính thẳng vào số đếm (đúng lỗi PR74PO28)");
  assert.match(scopedBody(".purchasing-screen .project-scope-tabs"), /display:\s*flex/, "dải tab phải là flex container");
  // GOAL §11: tab trong cùng một màn phải ĐỒNG NHẤT, không co giãn thất thường theo độ dài chữ.
  assert.match(body, /min-width:/, "thiếu min-width ⇒ 3 tab dài ngắn khác nhau theo độ dài nhãn");
  assert.match(body, /min-height:/, "thiếu min-height ⇒ chiều cao tab không đồng nhất");
});

test("MỐC 121 — mọi lớp của màn Mua hàng đều có rule CSS thật", () => {
  for (const name of ["purchasing-tabs-card", "purchasing-tab-note", "purchase-system-table"]) {
    assert.ok(hasRule(name), `thiếu rule CSS .${name} (đây đúng là nguyên nhân gốc của lỗi MỐC 121)`);
  }
  // MỤC 2: lớp vỏ tab nay là khuôn nhà ⇒ phải có rule PHẠM VI cho nó, nếu không nút rơi về mặc định.
  assert.ok(scopedBody(".purchasing-screen .project-scope-tabs"), "thiếu rule phạm vi cho .project-scope-tabs của màn Mua hàng");
});

test("MỐC 121 — lớp có trong JSX thì phải có rule CSS, và ngược lại (hai chiều)", () => {
  for (const name of ["purchasing-tabs-card", "purchasing-tab-note", "project-scope-tabs"]) {
    assert.match(purchasing, new RegExp(`(?<![\\w-])${name.replace(/-/g, "\\-")}(?![\\w-])`), `JSX không phát ra .${name}`);
  }
  for (const name of ["purchasing-tabs-card", "purchasing-tab-note"]) {
    assert.ok(hasRule(name), `.${name} có trong JSX nhưng không có rule CSS`);
  }
});

test("MỐC 121 · MỤC 2 — trạng thái tab đang chọn nhìn thấy được (`active` theo khuôn nhà)", () => {
  assert.match(purchasing, /className=\{activeTab===tab\.key\?"active":""\}/);
  assert.match(css, /\.purchasing-screen \.project-scope-tabs button\.active(?![A-Za-z0-9_-])/,
    "thiếu rule .active ⇒ không biết tab nào đang chọn");
  assert.match(css, /\.purchasing-screen \.project-scope-tabs button\[aria-selected="true"\]/,
    "thiếu nhánh aria-selected ⇒ trạng thái chọn chỉ dựa vào lớp CSS, không theo trợ năng");
});

test("MỐC 121 — canonical.css PHẢI được nạp, nạp sau globals để thắng điểm cùng cấp độ", () => {
  const imports = [...layout.matchAll(/import\s+"([^"]*\.css)"/g)].map((m) => m[1]);
  assert.ok(imports.some((p) => p.includes("canonical.css")), "app/layout.tsx không nạp styles/canonical.css");
  assert.ok(
    imports.findIndex((p) => p.includes("globals.css")) < imports.findIndex((p) => p.includes("canonical.css")),
    "canonical.css phải nạp SAU globals.css",
  );
});

test("MỐC 121 — bảng lũy kế được ghi chú là KHÔNG bị tab/lọc PR-PO tác động (tab 3 là nơi duy nhất nó còn nằm)", () => {
  assert.match(purchasing, /purchasing-tab-note/);
  assert.match(purchasing, /KHÔNG/);
  assert.match(purchasing, /Còn phải mua/);
  assert.match(purchasing, /data-vntech="purchasing-mat-table"/, "bảng lũy kế theo vật tư phải nằm TRONG thẻ tab (tab 3)");
  assert.doesNotMatch(purchasing, /card purchase-material-cumulative/, "không được còn treo bảng lũy kế ở CUỐI màn");
});

test("MỐC 121 — màn này CHỈ ĐỌC: không được thêm/xoá bằng action nào trong khối tab", () => {
  const tabBlock = purchasing.slice(purchasing.indexOf('data-vntech="purchasing-tabs"'), purchasing.indexOf("purchasing-pr-table"));
  assert.doesNotMatch(tabBlock, /action\("(?!update_boq_contract_prices)/, "khối tab gọi action thay đổi dữ liệu — trái quy tắc CHỈ ĐỌC");
});