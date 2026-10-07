// USER 28/09/2026 — MÀN «DANH SÁCH DỰ ÁN»: (1) rút gọn toolbar (2) BỎ filter «Phòng ban»
//                    (3) BỎ tab «Tổng quan» (đã có modal chi tiết từng dự án)
// ⚠️ BỎ 1 tab ⇒ phải ĐÁNH LẠI CHỈ SỐ 5 → 4 VÀ SỬA HỢP ĐỒNG `tests/pr01-project-tabs.test.mjs`
//    (hợp đồng cũ chốt «đúng 6 mục»; user đã đổi yêu cầu ⇒ sửa hợp đồng + sửa code CÙNG LÚC).
// ⛔ Bài học #43: tự kiểm phải copy NGUYÊN VĂN điều kiện còn lại trong test, ⛔ không tự đặt lại kỳ vọng.
import { readFileSync, writeFileSync } from "node:fs";

const PAGE = "app/page.tsx";
const TEST = "tests/pr01-project-tabs.test.mjs";
let page = readFileSync(PAGE, "utf8");
let test = readFileSync(TEST, "utf8");
let ok = 0, bad = 0;
const apply = (label, from, to, buf) => {
  const n = buf.split(from).length - 1;
  if (n !== 1) { console.log("  🔴 " + label + ": khớp " + n + " lần"); bad += 1; return buf; }
  console.log("  ✅ " + label);
  ok += 1;
  return buf.replace(from, to);
};

// ── (1) RÚT GỌN `note` (bỏ câu giải thích dài về bộ lọc) ────────────────────
page = apply(
  "note: rút gọn (bỏ mô tả dài)",
  'note="Project Master · ưu tiên dự án ĐANG HOẠT ĐỘNG, trong nhóm mới nhất trước · 4 chiều lọc: Trạng thái · Quản lý dự án · Phòng ban · Ngày (Quản lý dự án = phạm vi admin của user_project_scopes; Phòng ban = đơn vị của nhân sự tham gia — bootstrap CHƯA trả projects.manager_user_id)"',
  'note="Project Master · ưu tiên dự án đang hoạt động, trong nhóm mới nhất trước"',
  page,
);

// ── (2) BỎ filter «Phòng ban» ──────────────────────────────────────────────
// ⚠️ Dùng REGEX (⛔ không dùng chuỗi nhiều dòng) vì tệp có thể dùng CRLF ⇒ so khớp theo `\n` sẽ hỏng.
{
  const RX = /\r?\n\s*\{ key: "organizationUnitId", label: "Phòng ban"[\s\S]*?filterChoices\.units\.map\(\(choice\) => \(\{ value: choice\.value, label: choice\.label \}\)\),\r?\n\s*\] \},/;
  const m = page.match(RX);
  if (!m) { console.log("  🔴 bỏ filter «Phòng ban»: KHÔNG khớp regex"); bad += 1; }
  else { page = page.replace(RX, ""); ok += 1; console.log("  ✅ bỏ filter «Phòng ban» (bằng regex, an toàn CRLF)"); }
}

// ── (3) BỎ tab «Tổng quan» ⇒ 4 tab chi tiết, đánh lại chỉ số ───────────────
page = apply(
  "bỏ tab «Tổng quan» khỏi DETAIL_TABS",
  'const DETAIL_TABS = ["Tổng quan", "Nhân sự", "Tổ đội", "Kho", "Ban chỉ huy"];',
  'const DETAIL_TABS = ["Nhân sự", "Tổ đội", "Kho", "Ban chỉ huy"];',
  page,
);
// sub-tab con: index 1..3 → Nhân sự / Tổ đội / Kho  (trước: 1..4 → Chung/Nhân sự/Tổ đội/Kho)
page = apply(
  "ánh xạ sub-tab: 1..3",
  "if (index >= 1 && index <= 4) setDetailSection(PROJECT_DETAIL_SUB_TABS[index - 1]);",
  "if (index >= 1 && index <= 3) setDetailSection(PROJECT_DETAIL_SUB_TABS[index]);",
  page,
);
// tab 4 nay là «Ban chỉ huy» (SiteCommandScreen); bỏ nhánh tab 5
page = apply(
  "tab 4 → SiteCommandScreen, bỏ nhánh tab 5",
  `    {tab === 5 && <SiteCommandScreen data={data} project={pid} action={action} openEntity={openEntity} />}`,
  `    {tab === 4 && <SiteCommandScreen data={data} project={pid} action={action} openEntity={openEntity} />}`,
  page,
);

// ── SỬA HỢP ĐỒNG TEST cho khớp ────────────────────────────────────────────
test = apply(
  "test: DETAIL_TABS 4 mục",
  'assert.match(pm, /const DETAIL_TABS = \\["Tổng quan", "Nhân sự", "Tổ đội", "Kho", "Ban chỉ huy"\\];/);',
  'assert.match(pm, /const DETAIL_TABS = \\["Nhân sự", "Tổ đội", "Kho", "Ban chỉ huy"\\];/);',
  test,
);
test = apply(
  "test: SiteCommandScreen ở tab 4",
  'assert.match(detailBranch, /\\{tab === 5 && <SiteCommandScreen/);',
  'assert.match(detailBranch, /\\{tab === 4 && <SiteCommandScreen/);',
  test,
);
test = apply(
  "test: tiêu đề «4 tab chi tiết» + chỉ số 1..4",
  `test("PR-01 — 5 tab chi tiết giữ nguyên hành vi nhưng lệch chỉ số 1..5 (tab 0 là danh sách)", () => {`,
  `test("PR-01 — 4 tab chi tiết giữ nguyên hành vi nhưng lệch chỉ số 1..4 (tab 0 là danh sách)", () => {`,
  test,
);
test = apply(
  "test: vòng lặp chỉ số 1..4",
  "  for (const index of [1, 2, 3, 4]) {",
  "  for (const index of [1, 2, 3, 4]) {",
  test,
);

if (bad > 0) { console.log("  ⛔ KHÔNG ghi tệp — còn " + bad + " chỗ chưa khớp."); process.exit(1); }
writeFileSync(PAGE, page, "utf8");
writeFileSync(TEST, test, "utf8");
console.log("  ✅ đã ghi app/page.tsx + tests/pr01-project-tabs.test.mjs · " + ok + " thay đổi");

// ── TỰ KIỂM: copy NGUYÊN VĂN các điều kiện C�òn LẠI ───────────────────
const src = readFileSync(PAGE, "utf8");
const pmStart = src.indexOf("function ProjectManagement(");
const pmEnd = src.indexOf("function ProjectProgress(", pmStart);
const pm = src.slice(pmStart, pmEnd);
const listStart = pm.indexOf('if (view === "list")');
const detailStart = pm.indexOf("// =========================== CHI TIẾT");
const listBranch = pm.slice(listStart, detailStart);
const detailBranch = pm.slice(detailStart);
const CHECKS = [
  ["L30 LIST_TAB", /const LIST_TAB = "Danh sách dự án";/.test(pm)],
  ["L32 TAB_LABELS", /const TAB_LABELS = \[LIST_TAB, \.\.\.DETAIL_TABS\];/.test(pm)],
  ["L36 view suy từ tab", /const view: "list" \| "detail" = tab === 0 \? "list" : "detail";/.test(pm)],
  ["L37 ⛔ không useState view", !/useState<"list" \| "detail">/.test(pm)],
  ["L38 ⛔ không setView", !/setView\(/.test(pm)],
  ["L42 projectTabs", /const projectTabs = <div className="project-scope-tabs"/.test(pm)],
  ["L43 listBranch dùng projectTabs", /\{projectTabs\}/.test(listBranch)],
  ["L44 detailBranch dùng projectTabs", /\{projectTabs\}/.test(detailBranch)],
  ["L45 ⛔ không dựng dải thứ hai", !/TABS\.map\(/.test(detailBranch)],
  ["L49 tab chi tiết bị khoá", /disabled=\{index > 0 && !detailId\}/.test(pm)],
  ["L50 canExport", /const canExport = Boolean\(permission\?\.canExport\);/.test(pm)],
  ["L51 listBranch canExport", /disabled=\{!canExport\}/.test(listBranch)],
  ["L55 count", /count=\{filtered\.length\}/.test(listBranch)],
  ["L56 total", /total=\{allProjects\.length\}/.test(listBranch)],
  ["L57 unit", /unit="dự án"/.test(listBranch)],
  ["L58 search", /search=\{/.test(listBranch)],
  ["L59 filters", /filters=\{\[/.test(listBranch)],
  ["L60 sort", /sort=\{\{/.test(listBranch)],
  ["L61 actions", /actions=\{/.test(listBranch)],
  ["L64 tab 4 = SiteCommandScreen", /\{tab === 4 && <SiteCommandScreen/.test(detailBranch)],
  ["L69 ⛔ không tab===0 trong detail", !/\{tab === 0 &&/.test(detailBranch)],
  ["⛔ ĐÃ BỎ filter Phòng ban", !/key: "organizationUnitId", label: "Phòng ban"/.test(listBranch)],
];
let f = 0;
for (const [n, v] of CHECKS) { if (!v) f += 1; console.log("   " + (v ? "✅" : "🔴") + " " + n); }
console.log("  === HỢP ĐỒNG (nguyên văn từ test): " + (CHECKS.length - f) + "/" + CHECKS.length + " ===");
process.exit(f === 0 ? 0 : 1);
