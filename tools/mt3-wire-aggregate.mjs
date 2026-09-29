// USER 28/09/2026 — NỐI `ProjectAggregateTabs` vào màn «DANH SÁCH DỰ ÁN».
// ⇒ 4 thẻ Nhân sự / Tổ đội / Kho / Ban chỉ huy thành DANH SÁCH TỔNG HỢP TRÊN NHIỀU DỰ ÁN
//   ⇒ KHÔNG cần bấm «Chi tiết» trước ⇒ BỎ KHOÁ các thẻ này.
// ⚠️ Vì vậy khối danh sách tổng hợp phải render TRƯỚC chốt `if (!detail)` (vốn ép về thẻ 0).
// ⚠️ 2 hợp đồng test (pr01 · pr03) khoá THIẾT KẾ CŨ (thẻ 1-4 = ProjectDetailTabs, BCH ở chỉ số 5)
//    ⇒ cập nhật theo YÊU CẦU MỚI của user + thêm đối chứng ngược.
import { readFileSync, writeFileSync } from "node:fs";

const PAGE = "app/page.tsx";
let page = readFileSync(PAGE, "utf8");
let ok = 0, bad = 0;
const ap = (from, to, label) => {
  const n = page.split(from).length - 1;
  if (n !== 1) { console.log("  🔴 " + label + ": khớp " + n + " lần"); bad += 1; return; }
  page = page.replace(from, to); ok += 1; console.log("  ✅ " + label);
};

// ① import component mới
ap(
  'import { CardHead, UI_TODAY, date, format, money, PROJECT_STATUS_LABELS } from "@/lib/ui-shared";',
  'import { CardHead, UI_TODAY, date, format, money, PROJECT_STATUS_LABELS } from "@/lib/ui-shared";\nimport { ProjectAggregateTabs } from "@/app/screens/ProjectAggregateTabs";',
  "import ProjectAggregateTabs",
);

// ② bảng ánh xạ chỉ số thẻ → mục danh sách tổng hợp
ap(
  "  const TAB_LABELS = [LIST_TAB, ...DETAIL_TABS];",
  "  const TAB_LABELS = [LIST_TAB, ...DETAIL_TABS];\n  // USER 28/09/2026 — thẻ 1..4 là DANH SÁCH TỔNG HỢP đa dự án (⛔ không cần chọn 1 dự án trước).\n  const AGG_SECTION_BY_TAB: Record<number, string> = { 1: \"nhansu\", 2: \"todoi\", 3: \"kho\", 4: \"bch\" };",
  "bảng AGG_SECTION_BY_TAB",
);

// ③ BỎ KHOÁ 4 thẻ chi tiết (vì giờ không cần dự án)
ap(
  'disabled={index > 0 && !detailId} title={index > 0 && !detailId ? "Chọn một dự án (nút “Chi tiết ›”) để mở nhóm tab này" : undefined}',
  'data-tab-locked={index > 0 && !detailId ? "1" : undefined}',
  "bỏ khoá 4 thẻ (bấm được không cần dự án)",
);

// ④ render danh sách tổng hợp TRƯỚC chốt `if (!detail)`
ap(
  "  // =========================== CHI TIẾT ======================================\n  if (!detail) { setTab(0); return null; }",
  [
    "  // USER 28/09/2026 — 4 THẺ DANH SÁCH TỔNG HỢP (Nhân sự · Tổ đội · Kho · Ban chỉ huy).",
    "  // Render TRƯỚC chốt `if (!detail)` vì các danh sách này gom trên NHIỀU dự án ⛔ không cần chọn 1 dự án.",
    "  if (tab >= 1) {",
    "    return <div className=\"stack project-management\">",
    "      <section className=\"card\">{projectTabs}</section>",
    "      <ProjectAggregateTabs data={data} section={AGG_SECTION_BY_TAB[tab] || \"nhansu\"} openEntity={openEntity} />",
    "    </div>;",
    "  }",
    "",
    "  // =========================== CHI TIẾT (giữ cho tương thích) =================",
    "  if (!detail) { setTab(0); return null; }",
  ].join("\n"),
  "render danh sách tổng hợp (tab>=1) trước guard",
);

if (bad > 0) { console.log("  ⛔ KHÔNG ghi tệp — còn " + bad + " chỗ chưa khớp."); process.exit(1); }
writeFileSync(PAGE, page, "utf8");
console.log("  ✅ đã ghi app/page.tsx · " + ok + " thay đổi");
