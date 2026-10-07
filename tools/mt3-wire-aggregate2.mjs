// USER 28/09/2026 — NỐI `ProjectAggregateTabs` (dùng REGEX để chịu CRLF — bài học: so khớp chuỗi
// nhiều dòng bằng `\n` đã hỏng 2 lần trong phiên này).
import { readFileSync, writeFileSync } from "node:fs";

const PAGE = "app/page.tsx";
let page = readFileSync(PAGE, "utf8");
let ok = 0, bad = 0;
const rx = (re, rep, label) => {
  if (!re.test(page)) { console.log("  🔴 " + label + ": KHÔNG khớp regex"); bad += 1; return; }
  page = page.replace(re, rep); ok += 1; console.log("  ✅ " + label);
};

// ① import
rx(
  /(import \{ CardHead, UI_TODAY, date, format, money, PROJECT_STATUS_LABELS \} from "@\/lib\/ui-shared";)/,
  `$1\nimport { ProjectAggregateTabs } from "@/app/screens/ProjectAggregateTabs";`,
  "import ProjectAggregateTabs",
);

// ② bảng ánh xạ chỉ số thẻ → mục danh sách tổng hợp
rx(
  /(const TAB_LABELS = \[LIST_TAB, \.\.\.DETAIL_TABS\];)/,
  `$1\n  // USER 28/09/2026 — thẻ 1..4 là DANH SÁCH TỔNG HỢP đa dự án (⛔ không cần chọn 1 dự án trước).\n  const AGG_SECTION_BY_TAB: Record<number, string> = { 1: "nhansu", 2: "todoi", 3: "kho", 4: "bch" };`,
  "bảng AGG_SECTION_BY_TAB",
);

// ③ BỎ KHOÁ 4 thẻ
rx(
  /disabled=\{index > 0 && !detailId\} title=\{index > 0 && !detailId \?[^}]*\}\}/,
  `data-tab-locked={index > 0 && !detailId ? "1" : undefined}`,
  "bỏ khoá 4 thẻ",
);

// ④ render danh sách tổng hợp TRƯỚC chốt `if (!detail)`
rx(
  /(\s*\/\/ =+ CHI TIẾT =+\r?\n\s*if \(!detail\) \{ setTab\(0\); return null; \})/,
  [
    "",
    "  // USER 28/09/2026 — 4 THẺ DANH SÁCH TỔNG HỢP (Nhân sự · Tổ đội · Kho · Ban chỉ huy).",
    "  // Render TRƯỚC chốt `if (!detail)` vì các danh sách này gom trên NHIỀU dự án ⛔ không cần chọn 1 dự án.",
    "  if (tab >= 1) {",
    "    return <div className=\"stack project-management\">",
    "      <section className=\"card\">{projectTabs}</section>",
    "      <ProjectAggregateTabs data={data} section={AGG_SECTION_BY_TAB[tab] || \"nhansu\"} openEntity={openEntity} />",
    "    </div>;",
    "  }",
    "",
    "  // =========================== CHI TIẾT (giữ để tương thích) =====================",
    "  if (!detail) { setTab(0); return null; }",
  ].join("\n"),
  "render danh sách tổng hợp (tab>=1) trước guard",
);

if (bad > 0) { console.log("  ⛔ KHÔNG ghi tệp — còn " + bad + " chỗ."); process.exit(1); }
writeFileSync(PAGE, page, "utf8");
console.log("  ✅ đã ghi app/page.tsx · " + ok + " thay đổi");

// ── Cập nhật 2 hợp đồng test theo YÊU CẦU MỚI + thêm đối chứng ngược ──────────
for (const [f, rules] of [
  ["tests/pr01-project-tabs.test.mjs", [
    [/assert\.match\(pm, \/disabled=\\\{index > 0 && !detailId\}\/.*?\);/s,
     `// USER 28/09/2026: 4 thẻ đã thành DANH SÁCH TỔNG HỢP đa dự án ⇒ KHÔNG còn khoá theo dự án.
  assert.doesNotMatch(pm, /disabled=\\{index > 0 && !detailId\\}/, "4 thẻ danh sách tổng hợp không được khoá theo dự án");
  assert.match(pm, /<ProjectAggregateTabs data=\\{data\\}/, "phải render component danh sách tổng hợp");`],
  ]],
  ["tests/pr03-project-detail-tabs.test.mjs", [
    [/  assert\.match\(detailBranch, \/\\\{tab === 1 &&\[\^\\n\]\*<ProjectDetailTabs\`[\s\S]*?\n  \}\n  assert\.match\(detailBranch, \/\\\{tab === 4 && <SiteCommandScreen\/, "Tab BCH dịch từ chỉ số 5 sang 4 sau khi bỏ tab Tổng quan"\);/,
     `  // USER 28/09/2026: 4 thẻ KHÔNG còn mở ProjectDetailTabs theo 1 dự án ⇒ thay bằng danh sách tổng hợp.
  assert.match(pm, /if \\(tab >= 1\\) \\{/, "thẻ 1..4 phải render danh sách tổng hợp");
  assert.match(pm, /<ProjectAggregateTabs data=\\{data\\} section=\\{AGG_SECTION_BY_TAB\\[tab\\]/, "danh sách tổng hợp phải nhận mục theo chỉ số thẻ");
  assert.doesNotMatch(detailBranch, /\\{tab === 4 && <SiteCommandScreen/, "tab BCH không còn là SiteCommandScreen (đã gộp vào danh sách tổng hợp)");`],
  ]],
]) {
  let t = readFileSync(f, "utf8");
  let n = 0;
  for (const [re, rep] of rules) { if (re.test(t)) { t = t.replace(re, rep); n += 1; } }
  if (n) { writeFileSync(f, t, "utf8"); console.log("  ✅ " + f + " · cập nhật " + n + " khối hợp đồng"); }
  else console.log("  ⚠ " + f + ": regex hợp đồng không khớp — cần sửa tay");
}
