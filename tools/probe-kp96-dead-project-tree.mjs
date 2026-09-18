// CỔNG KP #96 — "CÂY WORKSPACE THEO DỰ ÁN" LÀ MÃ CHẾT (đo TIỀN ĐỀ + đối chứng + đo ĐÓNG).
//
// Ba tầng (theo bài học #21 của dự án — mọi cổng phải có ĐỐI CHỨNG):
//   (A) TIỀN ĐỀ  — đọc CSDL THẬT (MySQL + SQLite) + bản fallback trong mã: không nguồn nào có nhóm
//                  `__site_command_tree_disabled__` hay `project_management`; hàm dựng menu LỌC BỎ
//                  `project_management` ⇒ 2 nhánh render treo trên sentinel KHÔNG THỂ chạy.
//   (B) ĐỐI CHỨNG — dương (≥10 nhóm mỗi nguồn, thấy dòng lọc + dòng ánh xạ) và ÂM (bộ dò phải phát hiện
//                  được mẫu cố ý, và phải coi chuỗi sạch là sạch).
//   (C) ĐÓNG      — 0 dấu vết ở nguồn giao diện + CSS; cổng CSS phải CẤM tái phát; đồng thời các phần
//                  CÒN SỐNG (chọn dự án, danh sách con phẳng, cấp menu mobile) phải còn nguyên; 2 tệp test
//                  đã được viết lại (không còn kỳ vọng vào cây chết).
//
//   node tools/probe-kp96-dead-project-tree.mjs
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { DatabaseSync } from "node:sqlite";
import { resolve } from "node:path";

const MYSQL = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
const checks = [];
const ok = (label, pass, detail) => checks.push({ label, pass, detail });
const mysqlRows = (sql) => execFileSync(MYSQL, ["-uvntech", "-pvntech", "--default-character-set=utf8mb4", "-N", "-B", "vntech_erp", "-e", sql], { encoding: "utf8" }).split(/\r?\n/).filter(Boolean).map((l) => l.split("\t"));

// ── (A) TIỀN ĐỀ ───────────────────────────────────────────────────────────────────────────
const myGroups = mysqlRows("SELECT group_key FROM menu_group_catalog").map((r) => r[0]);
const db = new DatabaseSync(resolve(".local-data/warehouse.sqlite"));
const sqGroups = db.prepare("SELECT group_key FROM menu_group_catalog").all().map((r) => String(r.group_key));
db.close();
const shared = readFileSync("lib/ui-shared.tsx", "utf8");
const fallback = [...(shared.match(/const defaultMenuGroups = \[([\s\S]*?)\n\];/)?.[1] || "").matchAll(/groupKey:\s*"([^"]+)"/g)].map((m) => m[1]);
const page = readFileSync("app/page.tsx", "utf8");
const FILTER = '.filter((row) => String(row.groupKey) !== "project_management")';
const MAP = 'if (groupKey === "project_management") groupKey = "site_command"';

for (const [label, list] of [["MySQL", myGroups], ["SQLite", sqGroups], ["fallback trong mã", fallback]]) {
  ok(`(A) ${label}: không có nhóm 'project_management'`, !list.includes("project_management"), `${list.length} nhóm`);
  ok(`(A) ${label}: không có nhóm sentinel`, !list.includes("__site_command_tree_disabled__"), `${list.length} nhóm`);
}
ok("(A) hàm dựng menu LỌC BỎ project_management", page.includes(FILTER), FILTER.slice(0, 48) + "…");
ok("(A) module dự án được ÁNH XẠ vào site_command", page.includes(MAP), MAP);

// ── (B) ĐỐI CHỨNG ─────────────────────────────────────────────────────────────────────────
ok("(B1) đối chứng DƯƠNG: MySQL ≥10 nhóm", myGroups.length >= 10, `${myGroups.length}`);
ok("(B1) đối chứng DƯƠNG: SQLite ≥10 nhóm", sqGroups.length >= 10, `${sqGroups.length}`);
ok("(B1) đối chứng DƯƠNG: fallback ≥10 nhóm", fallback.length >= 10, `${fallback.length}`);
ok("(B1) đối chứng DƯƠNG: nhóm site_command CÓ THẬT", myGroups.includes("site_command") && sqGroups.includes("site_command"), "site_command");

const NEEDLES = ["__site_command_tree_disabled__", "project-workspace", "projectWorkspaceItems", "PROJECT_WORKSPACE_ITEMS", "PROJECT_WORKSPACE_CONTEXT_KEYS", "activateProjectModule", "projectWorkspaceId", "lockedWorkspaceProject", "openProjectNodeId", "activeProjectWorkspace", "selectedWorkspaceProject", "activeWorkspaceItem", "workspaceNeedTabs", "workspaceFinanceTabs", "project-context-lock", "activeSiteProjects"];
const findDead = (text) => NEEDLES.filter((n) => text.includes(n));
const sample = 'const a="__site_command_tree_disabled__"; const b=projectWorkspaceItems;';
ok("(B2) đối chứng ÂM: bộ dò PHẢI phát hiện mẫu cố ý", findDead(sample).length === 2, findDead(sample).join(", "));
ok("(B2) đối chứng ÂM: chuỗi sạch PHẢI coi là sạch", findDead("const a = 'site_command';").length === 0, "0 dấu vết");

// ── (C) ĐÓNG ──────────────────────────────────────────────────────────────────────────────
const css = readFileSync("app/globals.css", "utf8");
const audit = readFileSync("scripts/css-baseline-audit.mjs", "utf8");
for (const [label, text] of [["app/page.tsx", page], ["lib/ui-shared.tsx", shared]]) {
  const found = findDead(text);
  ok(`(C) ${label}: 0 dấu vết cây chết`, found.length === 0, found.join(", ") || "sạch");
}
for (const name of ["nav-subgroup", "nav-child-dept", "mobile-nav-subgroup", "mobile-nav-grandchildren", "dept-chevron", "project-workspace"]) {
  ok(`(C) globals.css: không còn '.${name}'`, !new RegExp(`\\.${name}(?![A-Za-z0-9_])`).test(css), "sạch");
}
ok('(C) globals.css: không còn [data-nav-group="project_management"]', !css.includes('[data-nav-group="project_management"]'), "sạch");
ok("(C) cổng CSS nay CẤM mã chết quay lại", audit.includes("mã chết KP #89/#96 quay lại"), "có phép kiểm cấm");
// Chống xoá quá tay — các phần CÒN SỐNG:
ok("(C) còn danh sách con phẳng (desktop)", page.includes("group.children.map((item) => {"), "1");
ok("(C) còn danh sách con phẳng (mobile)", page.includes("group.children.map((item)=>{"), "1");
ok("(C) còn chọn dự án THẬT (ProjectScopeSelect)", page.includes("<ProjectScopeSelect projects={data.projects} project={project} onChange={setProject} allowAll={data.projects.length>1}/>"), "1");
ok("(C) còn cấp menu mobile 'mobile-nav-children'", page.includes('className="mobile-nav-children"') && css.includes(".mobile-nav-children{"), "page + css");
ok("(C) còn thuộc tính data-nav-group", page.includes("data-nav-group={groupKey}"), "1");
for (const rel of ["tests/mobile-menu-interaction.test.mjs", "tests/project-navigation-consolidation.test.mjs"]) {
  const text = readFileSync(rel, "utf8");
  ok(`(C) ${rel}: đã viết lại theo KP #96`, text.includes("KP #96") && !text.includes("projectWorkspaceItems.map"), "có ghi chú + không còn kỳ vọng cây chết");
}

const failed = checks.filter((c) => !c.pass);
for (const c of checks) console.log(`  ${c.pass ? "ĐẠT " : "HỎNG"} ${c.label}${c.detail ? "  —  " + c.detail : ""}`);
console.log(`\nKP #96 — TIỀN ĐỀ + ĐỐI CHỨNG + ĐÓNG: ${checks.length - failed.length}/${checks.length} ĐẠT`);
console.log(failed.length ? `KẾT LUẬN: HỎNG ❌ (${failed.length} phép kiểm không đạt)` : "KẾT LUẬN: ĐẠT ✅ (cây chết đã dọn, tiền đề vẫn đúng, đối chứng hoạt động)");
process.exit(failed.length ? 1 : 0);
