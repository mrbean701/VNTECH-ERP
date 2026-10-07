import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cssPath = join(root, "app/globals.css");
const canonicalPath = join(root, "app/styles/canonical.css");
const fontFloorPath = join(root, "app/styles/font-floor.css");
const pagePath = join(root, "app/page.tsx");
const css = readFileSync(cssPath, "utf8");
const canonicalCss = readFileSync(canonicalPath, "utf8");
const fontFloorCss = readFileSync(fontFloorPath, "utf8");
const page = readFileSync(pagePath, "utf8");
// MỐC 121 — phải BÓC CHÚ THÍCH trước khi dò. Bình thường dò trong cả comment vẫn "đúng", nhưng ở đây
// banner của khối CSS mới LIỆT KÊ TÊN CÁC SELECTOR dưới dạng văn xuôi ⇒ nếu quét cả comment thì
// xoá sạch rule thật, chỉ để lại dòng chú thích, cổng vẫn báo ĐẠT — tức bỏ lọt đúng lỗi mà
// cổng sinh ra để chặn. Đo được: `.purchase-tabbar` xuất hiện 2 lần, 1 trong số đó nằm ở DÒNG 1325
// thuộc comment.
const stripCssComments = (text) => text.replace(/\/\*[\s\S]*?\*\//g, "");
const cssCode = stripCssComments(css);
const canonicalCode = stripCssComments(canonicalCss);
const fontFloorCode = stripCssComments(fontFloorCss);
const allCssCode = `${cssCode}\n${canonicalCode}\n${fontFloorCode}`;
const byteCount = Buffer.byteLength(css, "utf8");
const lineCount = css.split(/\r?\n/).length;
const importantCount = (css.match(/!important/g) || []).length;
const beginMarker = "VNTECH_MASTER_BASELINE_CSS_R1_1_1_BEGIN";
const endMarker = "VNTECH_MASTER_BASELINE_CSS_R1_1_1_END";
const beginCount = css.split(beginMarker).length - 1;
const endCount = css.split(endMarker).length - 1;
const historicalMarkers = [
  "UI-only patch", "older runtime rules", "runtime audit fixes layered", "Final responsive override",
  "FULL W2 UI PASS", "VNTECH_FULL_W2_UI_REGRESSION_LOCK", "VNTECH_FULL_UI_20260907_BEGIN",
  "VNTECH_MASTER_BASELINE_CSS_R1_1_BEGIN", "VNTECH_MASTER_BASELINE_CSS_R1_1_END",
].filter((marker) => css.includes(marker));

const sourceExt = new Set([".tsx", ".ts", ".jsx", ".js", ".mjs", ".html"]);
const sourceParts = [];
function walkUi(directory) {
  for (const name of readdirSync(directory)) {
    const path = join(directory, name);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      if (["node_modules", "dist", ".next", ".git", "tests", "scripts", "drizzle"].includes(name)) continue;
      walkUi(path);
    } else if (sourceExt.has(extname(name)) && path !== cssPath) sourceParts.push(readFileSync(path, "utf8"));
  }
}
walkUi(join(root, "app"));
// U-11 (18/09/2026) — SỬA PHẠM VI ĐỌC, KHÔNG NỚI PHÉP KIỂM: sau khi `U-11` tách component dùng chung khỏi
// `app/page.tsx` sang `lib/`, các lớp CSS do chúng phát ra (`attachment-*`, `kpi-*`, `nav-glyph*`, …) không
// còn nằm trong `app/` ⇒ cổng báo "lớp chết" OAN (26 lớp, đo được). Nay quét HỢP NHẤT `app/` + `lib/` —
// đúng cùng cách đã vá cho `scripts/preflight-source.mjs` và 3 tệp test ở KP #94.
walkUi(join(root, "lib"));
const source = sourceParts.join("\n");
const dynamicPrefixes = new Set([...source.matchAll(/([A-Za-z_][\w-]*-)\$\{/g)].map((match) => match[1]));
// MỐC 121 (01/10/2026) — ĐÓNG ĐIỂM MÙ CỔNG CSS: trước đây cổng này CHỈ đọc `app/globals.css`,
// trong khi `app/layout.tsx` nạp 4 tệp theo thứ tự tokens → globals → canonical → font-floor
// ⇒ `app/styles/canonical.css` (nơi CSS mới đặt, và THẮNG điểm cùng cấp độ vì nạp sau) hoàn toàn
// vô hình với cổng. Đó chính là lý do lỗi "tab PR/PO dính chữ thành PR74PO28" đã lọt qua: JSX có
// `.purchase-tabbar` mà KHÔNG stylesheet nào nào định nghĩa ⇒ button rơi về `display:inline`.
// Nay quét HỢP NHẤT cả 3 tệp. Các ngưỡng byte/`!important` bên dưới VẪN áp cho `globals.css`
// riêng (đúng baseline R1.1.1 gốc) — không nới lỏng điều kiện cũ, chỉ MỞ RỘNG tầng nhìn.
const allCss = allCssCode;
const cssClasses = new Set([...allCss.matchAll(/(?<![\w-])\.([A-Za-z_][\w-]*)/g)].map((match) => match[1]));
const deadClasses = [...cssClasses].filter((name) => !source.includes(name) && ![...dynamicPrefixes].some((prefix) => name.startsWith(prefix))).sort();
// NỢ CŨ ĐÃ BIẾT trong `canonical.css` (MỐC 121): 11 lớp không còn tệp mã nào nhắc tới, 5 lớp chỉ
// còn sót trong CÔNG CỤ DÒ CŨ (`tools/probe-*.mjs`, `tests/mt3-ui-14-admin-notification.test.mjs`)
// ⇒ UI đã bỏ chúng nhưng công cụ chưa cập nhật. ⛔ KHÔNG xoá trong MỐC 121 (ngoài phạm vi yêu cầu
// của anh theo D-022) — chỉ ĐĂNG KÝ tên để nợ MỚI vẫn bị chặn đúng.
const KNOWN_DEAD_CANONICAL = new Set([
  "admin-overview-grid", "approval-comment-row", "approval-comments", "approval-supplement",
  "approval-supplement-actions", "delivery-timeline", "embedded-account-permissions",
  "notification-target-chip", "notification-target-chips", "notification-target-chosen",
  "notify-group-head", "notify-unread-dot", "staff-directory-head", "staff-toolbar",
  "task-notify-overflow", "three-col",
]);
const deadClassesNew = deadClasses.filter((name) => !KNOWN_DEAD_CANONICAL.has(name));
const definedVars = new Set([...allCss.matchAll(/(--[\w-]+)\s*:/g)].map((match) => match[1]));
const usedVars = new Set([...allCss.matchAll(/var\(\s*(--[\w-]+)/g)].map((match) => match[1]));
for (const name of definedVars) if (source.includes(name)) usedVars.add(name);
const deadVars = [...definedVars].filter((name) => !usedVars.has(name)).sort();

const failures = [];
const requireClass = (name, reason) => {
  if (!new RegExp(`\\.${name}(?![A-Za-z0-9_-])`).test(allCss)) failures.push(`${reason}: thiếu .${name}`);
};
const requireCssProp = (block, prop, reason) => {
  if (!new RegExp(`(?:^|;)\\s*${prop}\\s*:`).test(block)) failures.push(`${reason}: thiếu ${prop}`);
};

if (beginCount !== 1 || endCount !== 1) failures.push(`canonical markers ${beginCount}/${endCount}, expected 1/1`);
if (historicalMarkers.length) failures.push(`historical markers remain: ${historicalMarkers.join(", ")}`);
if (byteCount > 400653) failures.push(`CSS size ${byteCount} > 400653 bytes (safe-clean R1.1.1 baseline)`);
if (importantCount > 4950) failures.push(`!important ${importantCount} > 4950 (safe-clean R1.1.1 baseline)`);
if (deadClasses.length && deadClassesNew.length) failures.push(`dead CSS classes remain: ${deadClassesNew.slice(0, 25).join(", ")}`);
if (deadVars.length) failures.push(`dead CSS variables remain: ${deadVars.slice(0, 25).join(", ")}`);
if (/@media\s*\([^{}]+\)\s*\{\s*\}/.test(css)) failures.push("còn @media rỗng");
const endIndex = css.indexOf(endMarker);
if (endIndex < 0 || css.slice(endIndex + endMarker.length).replace(/[\s*/]/g, "").length) failures.push("CSS declarations/content found after canonical end marker");

// Two-way dynamic contract: source-generated nav icon tones must remain styled.
const toneObject = page.match(/const NAV_ICON_TONE:[^{]+\{([\s\S]*?)\n\};/i)?.[1] || "";
const navTones = new Set([...toneObject.matchAll(/:\s*["']([a-z0-9_-]+)["']/gi)].map((m) => m[1]));
navTones.add("blue"); navTones.add("green");
const navBase = css.match(/\.nav-glyph\{([^}]*)\}/)?.[1] || "";
for (const prop of ["width", "height", "min-width", "display", "place-items", "background", "color", "border"]) requireCssProp(navBase, prop, ".nav-glyph base contract");
for (const tone of [...navTones].sort()) if (tone !== "blue") requireClass(`nav-glyph-${tone}`, `NAV_ICON_TONE ${tone}`);

// KP #89 + KP #96 (18/09/2026) — ĐẢO PHÉP KIỂM (mạnh hơn, KHÔNG nới lỏng): hai nhánh render CHẾT đã dọn:
//   • KP #89 — 4 nhóm con phòng ban (`menu_group_catalog` chỉ 12 nhóm, KHÔNG nhóm nào có
//     group_key='department_management' ⇒ `data-dept: plan/project/finance/legal` không thể chạy).
//   • KP #96 — cây "workspace theo dự án" (sentinel không bao giờ khớp; nhóm `project_management` còn bị
//     `configuredMenuGroups()` LỌC BỎ).
// Sau khi dọn, KHÔNG nguồn giao diện nào phát ra các họ lớp dưới đây ⇒ phải VẮNG MẶT trong CSS.
for (const name of ["nav-subgroup", "nav-child-dept", "nav-child-bch", "mobile-nav-subgroup", "mobile-nav-grandchildren", "dept-chevron", "mobile-nav-expanded", "project-workspace"]) {
  if (new RegExp(`\\.${name}(?![A-Za-z0-9_])`).test(css)) failures.push(`mã chết KP #89/#96 quay lại: .${name} (nhánh render không bao giờ chạy)`);
}
for (const attr of ['[data-nav-group="department_management"]', '[data-nav-group="project_management"]']) {
  if (css.includes(attr)) failures.push(`mã chết KP #89/#96 quay lại: ${attr} (nhóm không tồn tại trong menu)`);
}
for (const status of ["exact", "review", "not_found", "manual"]) requireClass(`request-match-${status}`, `request match ${status}`);
for (const status of ["already_mapped", "exact", "very_high", "high", "review", "low", "not_found", "conflict"]) requireClass(`mapping-status-${status}`, `mapping status ${status}`);
for (const density of ["normal", "comfortable", "compact"]) requireClass(`density-${density}`, `density ${density}`);

// BOQ dynamically emits boq-row-${role}. Some roles intentionally inherit neutral table styling.
const backendRoleSet = readFileSync(join(root, "scripts/system-route.mjs"), "utf8").match(/allowedRoles=new Set\(\[([^\]]+)\]\)/)?.[1] || "";
const boqRoles = new Set([...backendRoleSet.matchAll(/["']([a-z0-9_-]+)["']/gi)].map((m) => m[1]));
const intentionallyNeutralBoqRoles = new Set(["material", "heading", "description"]);
for (const role of boqRoles) if (!intentionallyNeutralBoqRoles.has(role)) requireClass(`boq-row-${role}`, `BOQ row role ${role}`);
for (const requiredRole of ["material", "component", "section", "system", "group", "heading", "description", "subtotal", "note"]) {
  if (!boqRoles.has(requiredRole)) failures.push(`backend BOQ role contract thiếu ${requiredRole}`);
}

// MỐC 121 (01/10/2026) — HỢP ĐỒNG DẢI TAB "PR & PO" MUA HÀNG.
// Lỗi gốc: JSX phát `.purchase-tabbar` từ TASK-119 nhưng KHÔNG tệp CSS nào định nghĩa ⇒ 4 `<button>`
// rơi về `display:inline`, chữ dính liền thành "PR74PO28". Cổng này CHƯA bắt được vì nó chỉ kiểm
// chiều "CSS chết" (CSS có / mã không dùng), KHÔNG kiểm chiều ngược lại là chính lỗi đã gặp.
// Nay khóa HAI chiều cho đúng bộ lớp của màn này. ⛔ Cố tình KHÔNG mở rộng thành "mọi class trong
// JSX phải có CSS": đo được 133 class không stylesheet nào định nghĩa (phần lớn là móc ngữ nghĩa),
// nên quy tắc đó chỉ tạo báo động giả. Hợp đồng có mục tiêu mới là kiểm được.
// ⚠️ CẬP NHẬT THEO YÊU CẦU GO-LIVE MỤC 2 (02/10/2026): «Thiết kế tab PR PO Chi tiết lũy kế theo vật tư
//    giống như tabbar của menu công việc.» ⇒ màn Mua hàng BỎ lớp tự chế `.purchase-tabbar`/`.purchase-tab`
//    và dùng KHUÔN NHÀ `.project-scope-tabs` + `button.active` (đo ở `app/screens/WorkCenter.tsx:295`).
// ⛔ KHÔNG nới lỏng: 3 khai báo bắt buộc chống lỗi "PR74PO28" (`display:inline-flex` · `align-items` · `gap`)
//    VẪN được khóa, chỉ trỏ vào selector MỚI. Thêm `min-width`/`min-height` theo GOAL §11 (tab phải đều nhau).
const MOC121_PURCHASING_TAB_CLASSES = [
  "purchasing-tabs-card", "project-scope-tabs",
  "purchasing-tab-note", "purchase-system-table",
];
for (const name of MOC121_PURCHASING_TAB_CLASSES) {
  requireClass(name, "MỐC 121 dải tab PR/PO (màn Mua hàng)");
  if (!new RegExp(`(?<![\\w-])${name.replace(/-/g, "\\-")}(?![\\w-])`).test(source)) {
    failures.push(`MỐC 121: .${name} có CSS nhưng KHÔNG tệp mã nào phát ra (CSS sẽ thành chết)`);
  }
}
const TAB_BTN = ".purchasing-screen .project-scope-tabs button";
if (!new RegExp(`\\${TAB_BTN}\\s*\\{`.replace(/\s+/g, "\\s*"), "i").test(allCss)) {
  failures.push(`MỐC 121: thiếu rule phạm vi «${TAB_BTN}» cho dải tab màn Mua hàng`);
}
for (const prop of ["display:inline-flex", "align-items", "gap", "min-width", "min-height"]) {
  if (!new RegExp(`\\.purchasing-screen \\.project-scope-tabs button\\b[^{}]*\\{[^{}]*${prop}`, "i").test(allCss)) {
    failures.push(`MỐC 121: nút tab màn Mua hàng thiếu khai báo bắt buộc ${prop} (thiếu thì tab dính chữ hoặc lệch cỡ)`);
  }
}

if (failures.length) {
  console.error(`CSS BASELINE AUDIT: KHÔNG ĐẠT · ${failures.join(" · ")}`);
  process.exit(1);
}
console.log(`CSS BASELINE AUDIT: ĐẠT · ${lineCount} lines · ${byteCount} bytes · ${importantCount} !important · stylesheet quét=3 · dead classes=0 (nợ cũ canonical đã ghi nhận=${KNOWN_DEAD_CANONICAL.size}) · dead vars=0 · dynamic contracts=PASS · empty media=0 · historical patch markers=0 · MỐC 121 tab contract=PASS`);
