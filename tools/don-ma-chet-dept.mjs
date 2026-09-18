// KP #89 — DỌN MÃ CHẾT: nhánh render 4 NHÓM CON phòng ban không bao giờ chạy.
//
// NGUYÊN TẮC (bài học #21/#25 của dự án): mọi phép sửa phải CÓ BẰNG CHỨNG và phải TỰ CHỐI nếu
// tiền đề không còn đúng. Công cụ này:
//   1. ĐỌC LẠI tiền đề từ CSDL thật (MySQL) để lấy ánh xạ module phòng ban → nhóm THẬT.
//   2. Sửa theo từng mỏ neo; mỏ neo nào không khớp ĐÚNG 1 lần ⇒ DỪNG, KHÔNG ghi tệp.
//   3. Hậu kiểm bất biến đầu ra; chỉ ghi khi tất cả đạt.
//
// Cách dùng:  node tools/don-ma-chet-dept.mjs [--apply]      (mặc định: chạy khô)
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const MYSQL = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
const APPLY = process.argv.includes("--apply");
const PAGE = "app/page.tsx";
const SHARED = "lib/ui-shared.tsx";

const failures = [];
const changes = [];
const refuse = (message) => failures.push(message);

// ── 1. TIỀN ĐỀ TỪ CSDL THẬT ────────────────────────────────────────────────────────────────
function mysqlRows(sql) {
  const out = execFileSync(MYSQL, ["-uvntech", "-pvntech", "--default-character-set=utf8mb4", "-N", "-B", "vntech_erp", "-e", sql], { encoding: "utf8" });
  return out.split(/\r?\n/).filter(Boolean).map((line) => line.split("\t"));
}
const groupKeys = new Set(mysqlRows("SELECT group_key FROM menu_group_catalog").map((r) => r[0]));
const deptMap = new Map(mysqlRows("SELECT module_key, group_key FROM module_catalog WHERE module_key LIKE 'dept\\_%'").map((r) => [r[0], r[1]]));
console.log(`TIỀN ĐỀ (MySQL): ${groupKeys.size} nhóm menu · ${deptMap.size} module phòng ban trong module_catalog`);
console.log(`  có nhóm 'department_management'? ${groupKeys.has("department_management") ? "CÓ (TIỀN ĐỀ SAI — DỪNG)" : "KHÔNG"}`);
if (groupKeys.has("department_management")) refuse("MySQL vẫn còn nhóm department_management ⇒ nhánh KHÔNG chết, dừng.");
if (groupKeys.size < 10) refuse(`Chỉ đọc được ${groupKeys.size} nhóm menu (<10) ⇒ phép đo không đáng tin, dừng.`);
if (deptMap.size < 30) refuse(`Chỉ đọc được ${deptMap.size} module phòng ban (<30) ⇒ phép đo không đáng tin, dừng.`);
for (const [key, group] of deptMap) if (!groupKeys.has(group)) refuse(`module ${key} trỏ vào nhóm không tồn tại: ${group}`);

// ── 2. SỬA app/page.tsx ────────────────────────────────────────────────────────────────────
let page = readFileSync(PAGE, "utf8");
const beforeLines = page.split("\n").length;
const edit = (name, find, repl, expect = 1) => {
  const n = page.split(find).length - 1;
  if (n !== expect) { refuse(`[${name}] mỏ neo xuất hiện ${n} lần (cần ${expect}) ⇒ DỪNG`); return; }
  page = page.replace(find, repl);
  changes.push(`${name} · gỡ ${find.length} ký tự → ${repl.length} ký tự`);
};
const editRegex = (name, regex, repl, expect = 1) => {
  const all = page.match(new RegExp(regex.source, regex.flags.includes("g") ? regex.flags : regex.flags + "g")) || [];
  if (all.length !== expect) { refuse(`[${name}] khớp ${all.length} lần (cần ${expect}) ⇒ DỪNG`); return; }
  page = page.replace(regex, repl);
  changes.push(`${name} · gỡ theo mẫu (${all[0].length} ký tự)`);
};

// 2.1 GIỮ `subGroup` — đây KHÔNG phải mã chết: cây PHÂN QUYỀN đọc nó để in nhãn nhóm con
//     (`page.tsx:3337/3358`: {item.group}{item.subGroup?` › ${item.subGroup}`:""}). Lượt chạy khô đầu
//     tiên đã TỰ CHỐI vì hậu kiểm thấy `subGroup` còn sống ⇒ sửa kế hoạch, KHÔNG xoá liều.

// 2.2 37 literal `groupKey: "department_management"` → KHOÁ NHÓM THẬT lấy từ CSDL (không đoán).
let literalFixed = 0;
for (const [moduleKey, groupKey] of deptMap) {
  const re = new RegExp(`(\\{ key: "${moduleKey}",[^}]*?)groupKey: "department_management"(, subGroup: "[^"]*")`);
  const hits = page.match(new RegExp(re.source, "g")) || [];
  if (hits.length !== 1) { refuse(`[literal ${moduleKey}] khớp ${hits.length} lần ⇒ DỪNG`); continue; }
  page = page.replace(re, `$1groupKey: "${groupKey}"$2`);
  literalFixed++;
}
console.log(`  đã thay ${literalFixed}/${deptMap.size} literal groupKey phòng ban bằng khoá nhóm THẬT từ CSDL`);
changes.push(`37 literal groupKey: "department_management" → khoá thật (${literalFixed} chỗ)`);

// 2.3 Nhánh render DESKTOP: bỏ nhánh đầu của chuỗi tam phân.
function dropFirstArm(name, startAnchor) {
  const startCount = page.split(startAnchor).length - 1;
  if (startCount !== 1) { refuse(`[${name}] mỏ neo đầu xuất hiện ${startCount} lần ⇒ DỪNG`); return; }
  const startIdx = page.indexOf(startAnchor);
  const sep = ': groupKey==="__site_command_tree_disabled__" ?';
  const sepIdx = page.indexOf(sep, startIdx + startAnchor.length);
  if (sepIdx < 0) { refuse(`[${name}] không tìm thấy mỏ neo ngăn cách ⇒ DỪNG`); return; }
  page = page.slice(0, startIdx) + '{groupKey==="__site_command_tree_disabled__" ?' + page.slice(sepIdx + sep.length);
  changes.push(`${name} · gỡ nhánh 4 nhóm con (${sepIdx - startIdx} ký tự)`);
}
dropFirstArm("nhánh desktop", '{groupKey === "department_management" ? ');
dropFirstArm("nhánh mobile", '{groupKey==="department_management"?');

// 2.4 Bỏ ngoại lệ `department_management` khỏi luật "nhóm 1 con thì đi thẳng".
edit("directChild",
  'const directChild=singleChild&&groupKey!=="department_management"&&groupKey!=="site_command"?singleChild:null;',
  'const directChild=singleChild&&groupKey!=="site_command"?singleChild:null;');

// 2.5 Trạng thái mở của nhóm phòng ban trên mobile → dùng luật chung.
edit("opened",
  'const opened=groupKey==="department_management"?mobileDepartmentExpanded:(!group.collapsible||openGroups.includes(groupKey));',
  'const opened=!group.collapsible||openGroups.includes(groupKey);');

// 2.6 Nút mở/đóng nhóm trên mobile → luật chung.
edit("onClick toggle nhóm mobile",
  'onClick={()=>{if(groupKey==="department_management")setMobileDepartmentExpanded(value=>!value);else toggleGroup(groupKey);}}',
  'onClick={()=>toggleGroup(groupKey)}');

// 2.7 Cây phân quyền: bỏ nhánh nhóm con phòng ban, giữ nguyên nhánh thường.
editRegex("permissionMenuStructure",
  /if\(groupKey==="department_management"\)\{[\s\S]*?\n    \} else \{\n      (for\(const item of children\)\{result\.push\(\{kind:"module",key:`module:\$\{item\.key\}`,label:item\.label,module:item\}\);seen\.add\(item\.key\);\}\n)    \}/,
  "$1");

// 2.8 Xoá state + localStorage + effect chỉ phục vụ nhánh chết.
edit("xoá mobileDepartmentStorageKey",
  '  const mobileDepartmentStorageKey=`vntech-erp-ui-v4:mobile-department-expanded:${data.user?.id || "guest"}`;\n', "");
edit("xoá deptMenuStorageKey",
  '  const deptMenuStorageKey = `vntech-erp-ui-v4:dept-subgroups:${data.user?.id || "guest"}`;\n', "");
const openDeptState = page.match(/  const \[openDeptSubgroups,setOpenDeptSubgroups\]=useState<string\[\]>\(\(\)=>\{[\s\S]*?\}\);\n/);
if (openDeptState) { page = page.replace(openDeptState[0], ""); changes.push("xoá state openDeptSubgroups + đọc localStorage"); }
else refuse("[openDeptSubgroups] không khớp mẫu ⇒ DỪNG");
const mobileDeptState = "const [mobileDepartmentExpanded,setMobileDepartmentExpanded]=useState<boolean>(()=>{if(typeof window===\"undefined\")return false;return window.localStorage.getItem(mobileDepartmentStorageKey)===\"1\";});";
if (page.split(mobileDeptState).length - 1 === 1) { page = page.replace(mobileDeptState, ""); changes.push("xoá state mobileDepartmentExpanded"); }
else refuse("[mobileDepartmentExpanded] không khớp mỏ neo ⇒ DỪNG");
// 2.8b Trạng thái khung menu mobile: CSS xếp `.mobile-nav-root` và `.mobile-nav-expanded` vào CÙNG một
// nhóm selector (globals.css:2626-2627 · 2652-2653) ⇒ hai lớp TRÙNG kiểu hoàn toàn. Nhánh chết từng
// đặt giá trị này; nay cố định lớp "root" (đúng bằng trạng thái phiên mới, localStorage trống).
edit("khung menu mobile → lớp root",
  'className={`mobile-nav-panel ${mobileDepartmentExpanded?"mobile-nav-expanded":"mobile-nav-root"}`}',
  'className="mobile-nav-panel mobile-nav-root"');
edit("xoá effect lưu deptMenuStorageKey",
  '  useEffect(()=>{try{window.localStorage.setItem(deptMenuStorageKey,JSON.stringify(openDeptSubgroups));}catch{/* localStorage có thể bị chặn */}},[deptMenuStorageKey,openDeptSubgroups]);\n', "");
edit("xoá effect lưu mobileDepartmentStorageKey",
  '  useEffect(()=>{try{window.localStorage.setItem(mobileDepartmentStorageKey,mobileDepartmentExpanded?"1":"0");}catch{/* localStorage có thể bị chặn */}},[mobileDepartmentStorageKey,mobileDepartmentExpanded]);\n', "");
const toggleDept = page.match(/  const toggleDeptSubgroup=\(subGroup:string\)=>setOpenDeptSubgroups\([\s\S]*?\);\n/);
if (toggleDept) { page = page.replace(toggleDept[0], ""); changes.push("xoá hàm toggleDeptSubgroup"); }
else refuse("[toggleDeptSubgroup] không khớp mẫu ⇒ DỪNG");

// 2.9 activateModule: bỏ 2 câu chỉ mở nhóm con phòng ban.
edit("activateModule bỏ subGroup",
  '    const subGroup=activeItem?.groupKey==="department_management"?String(activeItem.subGroup||""):"";\n    if(subGroup)setOpenDeptSubgroups((current)=>current.includes(subGroup)?current:[...current,subGroup]);\n',
  "");
// 2.10 Effect đồng bộ khi điều hướng từ màn con: chỉ phục vụ nhóm con phòng ban ⇒ xoá cả chú thích + eslint-disable.
edit("xoá effect đồng bộ nhóm con phòng ban",
  '  // Navigation may also originate in child screens; keep these view-only states synchronized.\n  // eslint-disable-next-line react-hooks/set-state-in-effect\n  useEffect(()=>{const activeItem=allowedModules.find((item)=>item.key===active);const subGroup=activeItem?.groupKey==="department_management"?String(activeItem.subGroup||""):"";if(!subGroup)return;setOpenDeptSubgroups((current)=>current.includes(subGroup)?current:[...current,subGroup]);setMobileDepartmentExpanded(true);},[active,allowedSignature]);\n',
  "");

// ── 3. SỬA lib/ui-shared.tsx ──────────────────────────────────────────────────────────────
let shared = readFileSync(SHARED, "utf8");
const editShared = (name, find, repl) => {
  const n = shared.split(find).length - 1;
  if (n !== 1) { refuse(`[shared ${name}] xuất hiện ${n} lần ⇒ DỪNG`); return; }
  shared = shared.replace(find, repl);
  changes.push(`ui-shared ${name}`);
};
editShared("chú thích menu",
  '// Menu 11 mục theo nghiệp vụ. Nhóm "department_management" cũ đã được tách thành\n// my_work / mep / finance / hr_legal / reports (xem migration V4__menu_restructure.sql).',
  '// Menu theo nghiệp vụ. Nhóm quản lý phòng ban cũ đã được tách thành\n// my_work / mep / finance / hr_legal / reports (xem migration V4__menu_restructure.sql).');
editShared("NAV_ICON_TYPE",
  '  department_management:"users", site_command:"hardhat", "phòng kế hoạch":"calendar", "phòng dự án":"hardhat", "tài chính kế toán":"coins", "hành chính pháp chế":"document",',
  '  site_command:"hardhat",');
editShared("NAV_ICON_TONE",
  'reports:"slate",department_management:"indigo",site_command:"orange","phòng kế hoạch":"green","phòng dự án":"blue","tài chính kế toán":"orange","hành chính pháp chế":"purple",project_management:"orange",',
  'reports:"slate",site_command:"orange",project_management:"orange",');

// ── 4. HẬU KIỂM BẤT BIẾN ĐẦU RA ───────────────────────────────────────────────────────────
const mustBeGone = ["department_management", "openDeptSubgroups", "mobileDepartmentExpanded", "deptMenuStorageKey", "mobileDepartmentStorageKey", "toggleDeptSubgroup", "data-dept", "mobile-nav-expanded", '"phòng kế hoạch"', '"phòng dự án"', '"tài chính kế toán"', '"hành chính pháp chế"'];
for (const needle of mustBeGone) {
  const a = page.split(needle).length - 1;
  const b = shared.split(needle).length - 1;
  if (a + b !== 0) {
    refuse(`HẬU KIỂM: "${needle}" còn ${a} lần ở page.tsx + ${b} lần ở ui-shared.tsx`);
    if (a) for (const [idx, line] of page.split("\n").entries()) { const i = line.indexOf(needle); if (i >= 0) console.error(`      page.tsx:${idx + 1}: …${line.slice(Math.max(0, i - 70), i + needle.length + 40)}…`); }
  }
}
// BẤT BIẾN SỐNG: những thứ PHẢI CÒN (chống xoá quá tay).
const count = (text, needle) => text.split(needle).length - 1;
const mustRemain = [
  ["page.tsx", page, 'subGroup: "Phòng Kế hoạch"', 12],
  ["page.tsx", page, 'subGroup: "Phòng Dự án"', 13],
  ["page.tsx", page, 'subGroup: "Tài chính Kế toán"', 6],
  ["page.tsx", page, 'subGroup: "Hành chính Pháp chế"', 6],
  ["page.tsx", page, "subGroup?: string", 1],
  ["page.tsx", page, "item.subGroup?", 2],
  ["page.tsx", page, '{groupKey==="__site_command_tree_disabled__" ?', 2],
  ["page.tsx", page, "group.children.map((item)", 2],
  ["page.tsx", page, "VNTECH_MOBILE_NAV_STATES_ROOT_EXPANDED", 1],
  ["page.tsx", page, "mobile-nav-root", 1],
  ["page.tsx", page, 'className="mobile-nav-panel mobile-nav-root"', 1],
  ["ui-shared.tsx", shared, "const NAV_ICON_TONE", 1],
  ["ui-shared.tsx", shared, "const NAV_ICON_TYPE", 1],
  ["ui-shared.tsx", shared, 'site_command:"hardhat"', 1],
  ["ui-shared.tsx", shared, 'site_command:"orange"', 1],
];
for (const [label, text, needle, want] of mustRemain) {
  const got = count(text, needle);
  if (got !== want) refuse(`HẬU KIỂM SỐNG: ${label} "${needle}" = ${got} (cần ${want}) ⇒ có thể đã xoá quá tay`);
}
for (const [label, text] of [["page.tsx", page], ["ui-shared.tsx", shared]]) {
  if (!text.includes("site_command")) refuse(`HẬU KIỂM: ${label} mất 'site_command'`);
}
if (!page.includes('{groupKey==="__site_command_tree_disabled__" ?')) refuse("HẬU KIỂM: mất nhánh site_command (không được đụng nhánh này)");
if (!page.includes("group.children.map((item) => {") && !page.includes("group.children.map((item)=>{") && !page.includes("group.children.map((item) =>")) refuse("HẬU KIỂM: mất nhánh render con mặc định");
const afterLines = page.split("\n").length;

console.log("\n=== KẾ HOẠCH SỬA ===");
for (const c of changes) console.log("  • " + c);
console.log(`  • app/page.tsx: ${beforeLines} → ${afterLines} dòng`);
console.log(`  • lib/ui-shared.tsx: ${readFileSync(SHARED, "utf8").split("\n").length} → ${shared.split("\n").length} dòng`);

if (failures.length) {
  console.error("\nKHÔNG GHI TỆP — có điều kiện không đạt:");
  for (const f of failures) console.error("  ✖ " + f);
  process.exit(1);
}
if (!APPLY) { console.log("\nCHẠY KHÔ: chưa ghi tệp. Thêm --apply để ghi."); process.exit(0); }
writeFileSync(PAGE, page);
writeFileSync(SHARED, shared);
console.log("\nĐÃ GHI: app/page.tsx · lib/ui-shared.tsx");
