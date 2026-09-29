// USER 28/09/2026 — sửa 2 chỗ còn lại (đã đọc NGUYÊN VĂN từ tệp).
import { readFileSync, writeFileSync } from "node:fs";
const F = "app/page.tsx";
let t = readFileSync(F, "utf8");
let ok = 0, bad = 0;
const ed = (a, b, n) => { const c = t.split(a).length - 1; if (c !== 1) { console.log("  🔴 " + n + ": khớp " + c); bad += 1; return; } t = t.replace(a, b); ok += 1; console.log("  ✅ " + n); };

// ① import (dòng L26 thật)
ed(
  'import { CardHead, Empty, Kpi, NavIcon, date, money } from "@/lib/ui-shared";',
  'import { CardHead, Empty, Kpi, NavIcon, date, money } from "@/lib/ui-shared";\nimport { ProjectAggregateTabs } from "@/app/screens/ProjectAggregateTabs";',
  "import ProjectAggregateTabs",
);

// ② bỏ khoá 4 thẻ (nguyên văn dòng L765)
ed(
  'disabled={index > 0 && !detailId} title={index > 0 && !detailId ? "Chọn một dự án (nút “Chi tiết ›”) để mở nhóm tab này" : undefined}',
  'data-tab-locked={index > 0 && !detailId ? "1" : undefined}',
  "bỏ khoá 4 thẻ (danh sách tổng hợp không cần dự án)",
);

if (bad > 0) { console.log("  ⛔ KHÔNG ghi."); process.exit(1); }
writeFileSync(F, t, "utf8");
console.log("  ✅ đã ghi " + F + " · " + ok + " thay đổi");
