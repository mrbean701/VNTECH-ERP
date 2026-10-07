// USER 28/09/2026 — 2 NÚT TẠO (tái dùng modal ĐÃ CÓ, KHÔNG tạo component trùng):
//   ① «＋ Tạo Dự án»  → open("projectMaster")  — modal «Thêm dự án» có sẵn, action create_project
//   ② «＋ Tạo Tổ đội» → open("teamCreate")     — modal «Tạo tổ đội dự án», action create_project_team
// QUYỀN (goal §12): chỉ hiện nút khi có quyền THẬT, dùng đúng hàm sẵn có của dự án:
//   · Tạo Dự án  → isAdminUser(data.user) || Boolean(modulePermission(data, "site_command").canCreate)
//   · Tạo Tổ đội → isAdminUser(data.user) || role ∈ {cht, commander}   (đúng cách L1268 đang dùng)
// ⚠️ KHÔNG thêm action mới, KHÔNG đổi nghiệp vụ — chỉ mở lại modal đã tồn tại.
import { readFileSync, writeFileSync } from "node:fs";

const AGG = "app/screens/ProjectAggregateTabs.tsx";
const PAGE = "app/page.tsx";
let agg = readFileSync(AGG, "utf8");
let page = readFileSync(PAGE, "utf8");
let ok = 0, bad = 0;
const ed = (buf, a, b, n) => { const c = buf.split(a).length - 1; if (c !== 1) { console.log("  FAIL " + n + " (khop " + c + ")"); bad += 1; return buf; } console.log("  OK   " + n); ok += 1; return buf.replace(a, b); };

// ── 1) Component: thêm prop `open` + `canCreateTeam` ──────────────────────────
agg = ed(agg,
  `export type ProjectAggregateTabsProps = {
  data: AppData;
  section: string;
  openEntity: (kind: EntityKind, row: Row) => void;
};`,
  `export type ProjectAggregateTabsProps = {
  data: AppData;
  section: string;
  openEntity: (kind: EntityKind, row: Row) => void;
  /** USER 28/09/2026 — mở modal ĐÃ CÓ (⛔ không tạo modal trùng): open("teamCreate"). */
  open?: (name: string, row?: Row) => void;
  /** ⛔ chỉ hiện nút «Tạo Tổ đội» khi user CÓ quyền (admin hoặc vai trò cht/commander). */
  canCreateTeam?: boolean;
};`,
  "them prop open + canCreateTeam");

agg = ed(agg,
  "export function ProjectAggregateTabs({ data, section, openEntity }: ProjectAggregateTabsProps) {",
  "export function ProjectAggregateTabs({ data, section, openEntity, open, canCreateTeam }: ProjectAggregateTabsProps) {",
  "nhan prop open + canCreateTeam");

// ── 2) Nút «＋ Tạo Tổ đội» trong thẻ Tổ đội ───────────────────────────────
agg = ed(agg,
  `          title="Tổ đội của dự án đang hoạt động"
          note={\`\${teamRows.length} tổ đội · chỉ tính dự án ĐANG HOẠT ĐỘNG · bấm một dòng để mở hộp chi tiết tổ đội\`}
        />`,
  `          title="Tổ đội của dự án đang hoạt động"
          note={\`\${teamRows.length} tổ đội · chỉ tính dự án ĐANG HOẠT ĐỘNG · bấm một dòng để mở hộp chi tiết tổ đội\`}
        />
        {canCreateTeam && (
          <p className="aggregate-toggle-row">
            <button type="button" className="primary" onClick={() => open?.("teamCreate")}>＋ Tạo tổ đội</button>
          </p>
        )}`,
  "nut «＋ Tạo tổ đội» (gate canCreateTeam)");

if (bad > 0) { console.log("  ⛔ KHONG ghi tep component"); process.exit(1); }
writeFileSync(AGG, agg, "utf8");
console.log("  ==> da ghi " + AGG);

// ── 3) page.tsx: truyền prop + thêm nút «＋ Tạo Dự án» vào nhánh danh sách ──
let ok2 = 0, bad2 = 0;
const ed2 = (a, b, n) => { const c = page.split(a).length - 1; if (c !== 1) { console.log("  FAIL " + n + " (khop " + c + ")"); bad2 += 1; return; } console.log("  OK   " + n); ok2 += 1; page = page.replace(a, b); };

ed2(
  '<ProjectAggregateTabs data={data} section={AGG_SECTION_BY_TAB[tab] || "nhansu"} openEntity={openEntity} />',
  '<ProjectAggregateTabs data={data} section={AGG_SECTION_BY_TAB[tab] || "nhansu"} openEntity={openEntity} open={open} canCreateTeam={isAdminUser(data.user) || ["cht", "commander"].includes(String(data.user?.role))} />',
  "truyen open + canCreateTeam vao ProjectAggregateTabs");

if (bad2 > 0) { console.log("  ⛔ KHONG ghi page.tsx"); process.exit(1); }
writeFileSync(PAGE, page, "utf8");
console.log("  ==> da ghi " + PAGE + " · tong " + (ok + ok2) + " thay doi");
