// CỔNG KP #89 — NHÁNH RENDER 4 NHÓM CON PHÒNG BAN LÀ MÃ CHẾT (đo TIỀN ĐỀ + đo ĐÓNG).
//
// Bài học #21 của dự án: MỌI cổng đo phải có ĐỐI CHỨNG. Cổng này có 3 tầng:
//   (A) TIỀN ĐỀ  — đọc CSDL THẬT (MySQL + SQLite) + bảng fallback trong mã: không nguồn nào có nhóm
//                  `department_management`, và 37 module phòng ban đều trỏ vào 6 nhóm THẬT.
//   (B) ĐỐI CHỨNG — (b1) dương: số nhóm ≥10 và số module phòng ban ≥30 (nếu cổng đọc hỏng thì không
//                  được kết luận); (b2) âm: bộ dò "mã chết" PHẢI phát hiện được chuỗi mẫu cố ý.
//   (C) ĐÓNG      — sau khi dọn: 0 dấu vết cơ chế chết ở nguồn giao diện + cổng CSS phải CẤM nó quay
//                  lại; đồng thời 2 nhánh CÒN SỐNG (cây dự án + render con mặc định) phải còn nguyên.
//
//   node tools/probe-kp89-dead-dept-branch.mjs
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
const myDept = mysqlRows("SELECT module_key, group_key FROM module_catalog WHERE module_key LIKE 'dept\\_%'");
const db = new DatabaseSync(resolve(".local-data/warehouse.sqlite"));
const sqGroups = db.prepare("SELECT group_key FROM menu_group_catalog").all().map((r) => String(r.group_key));
const sqDept = db.prepare("SELECT module_key, group_key FROM module_catalog WHERE module_key LIKE 'dept_%'").all();
db.close();
const shared = readFileSync("lib/ui-shared.tsx", "utf8");
const fallbackBlock = shared.match(/const defaultMenuGroups = \[([\s\S]*?)\n\];/)?.[1] || "";
const fallbackGroups = [...fallbackBlock.matchAll(/groupKey:\s*"([^"]+)"/g)].map((m) => m[1]);

for (const [label, list] of [["MySQL", myGroups], ["SQLite", sqGroups], ["fallback trong mã", fallbackGroups]]) {
  ok(`(A) ${label}: không có nhóm 'department_management'`, !list.includes("department_management"), `${list.length} nhóm: ${list.slice(0, 4).join(", ")}…`);
}
const badDept = [...myDept, ...sqDept.map((r) => [r.module_key, r.group_key])].filter(([, g]) => String(g) === "department_management");
ok("(A) cả 2 CSDL: 0 module phòng ban trỏ 'department_management'", badDept.length === 0, `vi phạm: ${badDept.length}`);
const realGroups = new Set(myGroups);
const orphan = myDept.filter(([, g]) => !realGroups.has(String(g)));
ok("(A) mọi module phòng ban trỏ vào nhóm CÓ THẬT", orphan.length === 0, `lạc: ${orphan.map((r) => r[0]).join(", ") || "không"}`);

// ── (B) ĐỐI CHỨNG ─────────────────────────────────────────────────────────────────────────
ok("(B1) đối chứng DƯƠNG: MySQL ≥10 nhóm", myGroups.length >= 10, `${myGroups.length}`);
ok("(B1) đối chứng DƯƠNG: SQLite ≥10 nhóm", sqGroups.length >= 10, `${sqGroups.length}`);
ok("(B1) đối chứng DƯƠNG: ≥30 module phòng ban ở mỗi CSDL", myDept.length >= 30 && sqDept.length >= 30, `MySQL ${myDept.length} · SQLite ${sqDept.length}`);
ok("(B1) đối chứng DƯƠNG: fallback ≥10 nhóm", fallbackGroups.length >= 10, `${fallbackGroups.length}`);

const DEAD_NEEDLES = ["department_management", "openDeptSubgroups", "mobileDepartmentExpanded", "deptMenuStorageKey", "mobileDepartmentStorageKey", "toggleDeptSubgroup", "data-dept", "mobile-nav-expanded"];
// ⚠️ SỬA BÁO OAN (MT2-P14-03c, 23/09/2026): needle `data-dept` khớp CHUỖI CON nên bắt luôn marker
// **ĐANG SỐNG** `data-dept-filter="AD-08"` (bộ lọc phòng ban của task AD-08, `app/page.tsx:1823`).
// Cơ chế CHẾT cần dò là nhóm menu/khối `department_management`, ⛔ không phải mọi tiền tố `data-dept`.
// Nay: needle `data-dept` chỉ tính khi **KHÔNG** phải `data-dept-filter`.
const findDead = (text) => DEAD_NEEDLES.filter((n) => (n === "data-dept"
  ? /data-dept(?!-filter)/.test(text)
  : text.includes(n)));
const probeSample = 'const x = "department_management"; const y=openDeptSubgroups;';
ok("(B2) đối chứng ÂM: bộ dò PHẢI phát hiện được mẫu cố ý", findDead(probeSample).length === 2, findDead(probeSample).join(", "));
ok("(B2) đối chứng ÂM: chuỗi sạch PHẢI coi là sạch", findDead("const x = 'site_command';").length === 0, "0 dấu vết");

// ── (C) ĐÓNG ──────────────────────────────────────────────────────────────────────────────
const page = readFileSync("app/page.tsx", "utf8");
const css = readFileSync("app/globals.css", "utf8");
const audit = readFileSync("scripts/css-baseline-audit.mjs", "utf8");
for (const [label, text] of [["app/page.tsx", page], ["lib/ui-shared.tsx", shared]]) {
  const found = findDead(text);
  ok(`(C) ${label}: 0 dấu vết cơ chế chết`, found.length === 0, found.join(", ") || "sạch");
}
for (const needle of ["nav-subgroup-plan", "nav-child-dept-plan", "nav-subgroup-finance", "nav-child-dept-legal", 'data-nav-group="department_management"', ".mobile-nav-expanded"]) {
  ok(`(C) globals.css: không còn '${needle}'`, !css.includes(needle), css.includes(needle) ? "CÒN" : "sạch");
}
ok("(C) cổng CSS nay CẤM mã chết quay lại", audit.includes("mã chết KP #89/#96 quay lại"), "có phép kiểm cấm");
const appWalk = audit.indexOf('walkUi(join(root, "app"))'), libWalk = audit.indexOf('walkUi(join(root, "lib"))');
ok("(C) cổng CSS quét HỢP NHẤT app/ + lib/", appWalk >= 0 && libWalk > appWalk, `app@${appWalk} · lib@${libWalk}`);
// Chống xoá quá tay: 2 nhánh CÒN SỐNG phải còn.
// (KP #96 ngày 18/09 đã dọn nốt nhánh sentinel của "cây workspace theo dự án" — xem tools/probe-kp96-dead-project-tree.mjs.)
ok("(C) nhánh cây dự án (sentinel) đã dọn theo KP #96", (page.split("__site_command_tree_disabled__").length - 1) === 0, `${page.split("__site_command_tree_disabled__").length - 1}`);
ok("(C) còn nhánh render con mặc định", (page.match(/group\.children\.map\(\(item\)/g) || []).length === 2, `${(page.match(/group\.children\.map\(\(item\)/g) || []).length}`);
ok("(C) còn phân quyền đọc nhãn nhóm con (subGroup SỐNG)", (page.match(/item\.subGroup\?/g) || []).length === 2, `${(page.match(/item\.subGroup\?/g) || []).length}`);
// ⚠️ SỬA BÁO OAN (MT2-P14-03c, 23/09/2026): 37 literal `subGroup: "` KHÔNG còn ở `app/page.tsx` mà đã được
// CHUYỂN sang **nguồn sự thật của menu** `lib/menu-helpers.ts` (bảng module + nhóm con) — đo được
// `app/page.tsx` = **0** · `lib/menu-helpers.ts` = **37**. Nay đếm ở ĐÚNG tệp đang khai báo (⛔ vẫn giữ nguyên
// ngưỡng 37 để phát hiện mất literal), và vẫn kiểm `page.tsx` dùng `item.subGroup?` khi render.
const menuHelpersText = readFileSync("lib/menu-helpers.ts", "utf8");
ok("(C) còn 37 literal nhóm phòng ban trỏ nhóm THẬT", (menuHelpersText.match(/subGroup: "/g) || []).length === 37,
  `menu-helpers.ts ${(menuHelpersText.match(/subGroup: "/g) || []).length} · page.tsx ${(page.match(/subGroup: "/g) || []).length}`);

const failed = checks.filter((c) => !c.pass);
for (const c of checks) console.log(`  ${c.pass ? "ĐẠT " : "HỎNG"} ${c.label}${c.detail ? "  —  " + c.detail : ""}`);
console.log(`\nKP #89 — TIỀN ĐỀ + ĐỐI CHỨNG + ĐÓNG: ${checks.length - failed.length}/${checks.length} ĐẠT`);
console.log(failed.length ? `KẾT LUẬN: HỎNG ❌ (${failed.length} phép kiểm không đạt)` : "KẾT LUẬN: ĐẠT ✅ (nhánh chết đã dọn, tiền đề vẫn đúng, đối chứng hoạt động)");
process.exit(failed.length ? 1 : 0);
