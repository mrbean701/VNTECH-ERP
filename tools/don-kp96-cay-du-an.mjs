// KP #96 — DỌN "CÂY WORKSPACE THEO DỰ ÁN" (mã chết không bao giờ render) — người dùng đã quyết 18/09.
//
// TIỀN ĐỀ: hai nhánh render treo trên sentinel `groupKey==="__site_command_tree_disabled__"`, nhưng
// `configuredMenuGroups()` KHÔNG BAO GIỜ gán khoá đó: `menu_group_catalog` (MySQL + SQLite) chỉ có 12 nhóm
// thật, bản fallback `defaultMenuGroups` cũng 12 nhóm, và nhóm `project_management` bị chính hàm này LỌC BỎ.
// ⇒ Cây 8 mục/dự án + toàn bộ khoá ngữ cảnh dự án ("workspace lock") là MÃ CHẾT: `projectWorkspaceId`
// khởi tạo `null` và chỉ được gán bởi `activateProjectModule` (chỉ gọi từ chính 2 nhánh chết).
//
// Cách dùng:  node tools/don-kp96-cay-du-an.mjs [--apply]     (mặc định: chạy khô)
import { readFileSync, writeFileSync } from "node:fs";

const PAGE = "app/page.tsx";
const APPLY = process.argv.includes("--apply");
let page = readFileSync(PAGE, "utf8");
const beforeLines = page.split("\n").length, beforeBytes = Buffer.byteLength(page, "utf8");
const failures = [], changes = [];

const edit = (name, find, repl, expect = 1) => {
  const n = page.split(find).length - 1;
  if (n !== expect) { failures.push(`[${name}] mỏ neo khớp ${n} lần (cần ${expect}) ⇒ DỪNG`); return; }
  page = page.replace(find, repl);
  changes.push(`${name} (−${find.length - repl.length} ký tự)`);
};
const splice = (name, startAnchor, endAnchor, keep = "", expectStarts = 1) => {
  const starts = page.split(startAnchor).length - 1;
  if (starts !== expectStarts) { failures.push(`[${name}] mỏ neo đầu khớp ${starts} lần (cần ${expectStarts}) ⇒ DỪNG`); return; }
  const s = page.indexOf(startAnchor);
  const e = page.indexOf(endAnchor, s + startAnchor.length);
  if (e < 0) { failures.push(`[${name}] không tìm thấy mỏ neo cuối ⇒ DỪNG`); return; }
  const cut = e + endAnchor.length;
  changes.push(`${name} (−${cut - s} ký tự)`);
  page = page.slice(0, s) + keep + page.slice(cut);
};

// ── A. HAI NHÁNH RENDER CÂY (desktop + mobile) → giữ nhánh render con THẬT ─────────────────
// Lượt đầu công cụ TỰ CHỐI vì mỏ neo đầu xuất hiện 2 lần (desktop + mobile dùng CÙNG chuỗi sentinel);
// nay phân biệt bằng MỎ NEO CUỐI khác nhau (`(item) => {` của desktop vs `(item)=>{` của mobile).
splice("A1 nhánh cây desktop", '{groupKey==="__site_command_tree_disabled__" ?', 'group.children.map((item) => {', "{group.children.map((item) => {", 2);
splice("A2 nhánh cây mobile", '{groupKey==="__site_command_tree_disabled__" ?', 'group.children.map((item)=>{', "{group.children.map((item)=>{", 1);
edit("A3 bỏ activeSiteProjects",
  '          const activeSiteProjects=groupKey==="site_command"?data.projects.filter((p)=>String(p.status||"active")==="active"):[];\n', "");

// ── B. KHOÁ NGỮ CẢNH DỰ ÁN ("workspace lock") — luôn null/false ⇒ mã chết ───────────────────
edit("B1 bỏ state projectWorkspaceId", "  const [projectWorkspaceId,setProjectWorkspaceId]=useState<string|null>(null);\n", "");
edit("B2 bỏ state openProjectNodeId", "  const [openProjectNodeId,setOpenProjectNodeId]=useState<string|null>(null);\n", "");
edit("B3 bỏ lockedWorkspaceProject + đơn giản hoá `project`",
  `  const lockedWorkspaceProject = projectWorkspaceId && PROJECT_WORKSPACE_CONTEXT_KEYS.has(active) && data.projects.some((row)=>String(row.id)===String(projectWorkspaceId)) ? String(projectWorkspaceId) : null;
  const project = lockedWorkspaceProject || (data.projects.length===1`,
  "  const project = data.projects.length===1");
// ⚠️ Lỗi ĐÃ GẶP THẬT ở lượt áp dụng đầu: bỏ `lockedWorkspaceProject || (` thì phải bỏ LUÔN dấu `)` đóng tương ứng
// ở cuối biểu thức, nếu không `tsc` báo `TS1005: ',' expected` (page.tsx:461). Cổng bắt được ngay ở bước typecheck.
edit("B3b bỏ dấu ngoặc đóng thừa của `project`",
  '      : (data.projects.length>1?"ALL":String(data.projects[0]?.id||"ALL")));',
  '      : (data.projects.length>1?"ALL":String(data.projects[0]?.id||"ALL"));');
edit("B4 bỏ setProjectWorkspaceId trong activateModule", "    setProjectWorkspaceId(null);\n", "");
const activateProjectModule =
  `  function activateProjectModule(projectId:string,next:ModuleKey){
    const exists=data.projects.some((row)=>String(row.id)===String(projectId));
    if(!exists)return;
    setProjectSelection(String(projectId));
    setProjectWorkspaceId(String(projectId));
    setOpenProjectNodeId(String(projectId));
    setSearch("");setNotifyOpen(false);setMenuOpen(false);setSearchOpen(false);setActive(next);
  }
`;
edit("B5 bỏ hàm activateProjectModule", activateProjectModule, "");
edit("B6 bỏ effect reset khoá dự án",
  `  // A project lock is navigation context only; never let it leak back into corporate modules.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(()=>{if(projectWorkspaceId&&!PROJECT_WORKSPACE_CONTEXT_KEYS.has(active))setProjectWorkspaceId(null);},[active,projectWorkspaceId]);
`, "");
edit("B7 bỏ selectedWorkspaceProject + activeWorkspaceItem",
  `  const selectedWorkspaceProject = lockedWorkspaceProject ? data.projects.find((item)=>String(item.id)===String(lockedWorkspaceProject)) : null;
  const activeWorkspaceItem = PROJECT_WORKSPACE_ITEMS.find((item)=>item.key===active||(item.related||[]).includes(active));
`, "");
edit("B8 tiêu đề màn → nhánh còn sống",
  'selectedWorkspaceProject&&activeWorkspaceItem ? [`${activeWorkspaceItem.label.replace(/^\\d+\\.\\s*/,"")} · ${selectedWorkspaceProject.code}`, moduleUserDescription(active)] : [moduleMeta?.label || titles[active][0], moduleUserDescription(active)]',
  "[moduleMeta?.label || titles[active][0], moduleUserDescription(active)]");
edit("B9 bỏ projectWorkspaceItems + activeProjectWorkspace + 2 dải tab",
  `  const projectWorkspaceItems = PROJECT_WORKSPACE_ITEMS.filter((item)=>allowedModules.some((module)=>module.key===item.key));
  const activeProjectWorkspace = Boolean(lockedWorkspaceProject && PROJECT_WORKSPACE_CONTEXT_KEYS.has(active));
  const workspaceNeedTabs = (["requests","inventory","warehouse_issue","material_norms"] as ModuleKey[]).filter((key)=>allowedModules.some((item)=>item.key===key));
  const workspaceFinanceTabs = (["capital_recovery","payments"] as ModuleKey[]).filter((key)=>allowedModules.some((item)=>item.key===key));
`, "");

// ── C. HAI KHỐI GIAO DIỆN CHẾT TRONG THÂN RENDER ────────────────────────────────────────────
splice("C1 bỏ hộp 'DỰ ÁN ĐANG LÀM VIỆC' (giữ lại ProjectScopeSelect)",
  'activeProjectWorkspace&&selectedWorkspaceProject?<div className="inline-alert project-context-lock">', "</div>:");
splice("C2 bỏ dải tab 'Đề xuất và Nhu cầu'",
  '{activeProjectWorkspace&&selectedWorkspaceProject&&workspaceNeedTabs.includes(active)&&', "</div>}");
splice("C3 bỏ dải tab 'Tài chính và Thanh quyết toán'",
  '{activeProjectWorkspace&&selectedWorkspaceProject&&workspaceFinanceTabs.includes(active)&&', "</div>}");

// ── D. HẰNG SỐ 8 MỤC/DỰ ÁN + TẬP KHOÁ NGỮ CẢNH ─────────────────────────────────────────────
const constBlock = page.match(/\/\/ PROJECT NAVIGATION CONSOLIDATION:[\s\S]*?const PROJECT_WORKSPACE_CONTEXT_KEYS = [^\n]*\n/);
if (!constBlock) failures.push("[D1] không tìm thấy khối PROJECT_WORKSPACE_* ⇒ DỪNG");
else {
  page = page.replace(constBlock[0], `// KP #96 (18/09/2026) — ĐÃ DỌN "cây workspace theo dự án" (8 mục/dự án + khoá ngữ cảnh dự án).
// Lý do: hai nhánh render treo trên một SENTINEL không bao giờ khớp — \`configuredMenuGroups()\` chỉ ghép từ
// \`menu_group_catalog\` (12 nhóm thật, đo trên CẢ MySQL + SQLite) + bản fallback (12 nhóm), và nhóm
// \`project_management\` còn bị chính hàm đó LỌC BỎ ⇒ tính năng KHÔNG BAO GIỜ render, chỉ còn mã chết.
// Giao diện THẬT của nhóm «QUẢN LÝ DỰ ÁN» là danh sách con phẳng (\`group.children.map\`), giữ nguyên.
// Bằng chứng: tools/probe-kp96-dead-project-tree.mjs · docs/agent-progress/TASK-090.md · MASTER_STATUS KP #96.
`);
  changes.push(`D1 thay khối hằng số PROJECT_WORKSPACE_* (${constBlock[0].length} → ${page.length ? 0 : 0} ký tự)`);
}

// ── HẬU KIỂM ──────────────────────────────────────────────────────────────────────────────
const GONE = ["__site_command_tree_disabled__", "activeSiteProjects", "projectWorkspaceItems", "PROJECT_WORKSPACE_ITEMS", "PROJECT_WORKSPACE_CONTEXT_KEYS", "activateProjectModule", "openProjectNodeId", "lockedWorkspaceProject", "projectWorkspaceId", "selectedWorkspaceProject", "activeWorkspaceItem", "activeProjectWorkspace", "workspaceNeedTabs", "workspaceFinanceTabs", "project-workspace", "project-context-lock"];
for (const n of GONE) {
  const c = page.split(n).length - 1;
  if (c) { failures.push(`HẬU KIỂM: "${n}" còn ${c} lần`); for (const [i, l] of page.split("\n").entries()) { const k = l.indexOf(n); if (k >= 0) console.error(`      dòng ${i + 1}: …${l.slice(Math.max(0, k - 70), k + n.length + 40)}…`); } }
}
const KEEP = [
  ["A. nhánh render con THẬT (desktop)", "group.children.map((item) => {", 1],
  ["A. nhánh render con THẬT (mobile)", "group.children.map((item)=>{", 1],
  ["B. chọn dự án vẫn sống", "const project = data.projects.length===1", 1],
  ["B. setProject vẫn sống", "const setProject = setProjectSelection;", 1],
  ["C. ProjectScopeSelect vẫn render", "<ProjectScopeSelect projects={data.projects} project={project} onChange={setProject} allowAll={data.projects.length>1}/>", 1],
  ["B. tiêu đề màn vẫn có", "const title: [string, string] = [moduleMeta?.label || titles[active][0], moduleUserDescription(active)];", 1],
  ["B. activateModule vẫn còn", "function activateModule(next:ModuleKey){", 1],
  ["B. badgeFor vẫn còn", "function badgeFor(key: ModuleKey)", 1],
];
for (const [label, needle, want] of KEEP) {
  const c = page.split(needle).length - 1;
  if (c !== want) failures.push(`HẬU KIỂM SỐNG: ${label} = ${c} (cần ${want})`);
}
const afterLines = page.split("\n").length, afterBytes = Buffer.byteLength(page, "utf8");
console.log("=== KẾ HOẠCH DỌN KP #96 ===");
for (const c of changes) console.log("  • " + c);
console.log(`  • app/page.tsx: ${beforeLines} → ${afterLines} dòng · ${beforeBytes} → ${afterBytes} byte (giảm ${beforeBytes - afterBytes})`);
if (failures.length) {
  console.error("\nKHÔNG GHI TỆP — có điều kiện không đạt:");
  for (const f of failures) console.error("  ✖ " + f);
  process.exit(1);
}
if (!APPLY) { console.log("\nCHẠY KHÔ: chưa ghi tệp. Thêm --apply để ghi."); process.exit(0); }
writeFileSync(PAGE, page);
console.log("\nĐÃ GHI: app/page.tsx");
