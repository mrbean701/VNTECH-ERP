// PROBE (không nằm trong gate `package.json` — chạy tay): đo THẬT cơ chế NHÃN của 5 mục menu «CÔNG VIỆC» (`T-01`).
//
// RỦI RO SỐ 1 của phương án A: nhãn menu của khoá ĐÃ CÓ trong `module_catalog` lấy từ DB
// (`lib/workflow-helpers.ts`: `config?.label || item.label`) ⇒ nếu dùng LẠI 4 khoá `dept_*` thì menu sẽ
// hiện nhãn DB («Nhiệm vụ nhân viên đang làm»…), KHÔNG phải 5 nhãn đã chốt. Probe này đo ĐÚNG điều đó:
//   1) nhãn mà `lib/menu-helpers.ts` khai báo cho 5 mục mới = 5 nhãn chốt;
//   2) ĐỐI CHỨNG ÂM: 4 khoá cũ, nếu đưa qua `configuredModules()` (đúng đường nhãn DB), cho nhãn KHÁC 5 nhãn chốt;
//   3) 5 khoá mới KHÔNG có dòng `module_catalog` (mô phỏng) và KHÔNG nằm trong `modules` ⇒ nhãn không thể bị DB đè.
// Chạy:  node --import tsx tests/t01-work-menu-probe.mjs
import { configuredModules } from "../lib/workflow-helpers.ts";
import { modules, workMenuItems, legacyWorkMenuKeys } from "../lib/menu-helpers.ts";

const EXPECTED = ["Cá nhân", "Phòng ban", "Giao việc", "Dashboard", "Báo cáo"];
// `module_catalog` MÔ PHỎNG ĐÚNG production (nhãn DB thật của 4 khoá cũ + `approvals`); KHÔNG có 5 khoá mới.
const dbCatalog = [
  { moduleKey: "dept_plan_tasks", label: "Nhiệm vụ nhân viên đang làm", groupKey: "my_work", active: 1, sortOrder: 10 },
  { moduleKey: "dept_project_tasks", label: "Nhiệm vụ nhân viên đang làm", groupKey: "my_work", active: 1, sortOrder: 20 },
  { moduleKey: "dept_plan_assign", label: "Giao việc & Kiểm soát hoàn thành", groupKey: "my_work", active: 1, sortOrder: 30 },
  { moduleKey: "dept_project_assign", label: "Giao việc & Kiểm soát hoàn thành", groupKey: "my_work", active: 1, sortOrder: 40 },
  { moduleKey: "approvals", label: "Trung tâm phê duyệt", groupKey: "my_work", active: 1, sortOrder: 50 },
];
const data = { moduleCatalog: dbCatalog, menuGroups: [], users: [], user: {} };
const rows = configuredModules(data, true);
const byKey = (key) => rows.find((row) => row.key === key);

let pass = 0;
let fail = 0;
const check = (ok, text) => { console.log(`${ok ? "  ✔" : "  ✖"} ${text}`); if (ok) pass++; else fail++; };

console.log("═══ T-01 · PROBE NHÃN 5 MỤC MENU «CÔNG VIỆC» (đo THẬT, không suy đoán) ═══");
console.log("Nguồn: lib/menu-helpers.ts (`workMenuItems`) · lib/workflow-helpers.ts (`configuredModules`)");
console.log("");
console.log("1) Nhãn mà code khai báo cho 5 mục mới (đây chính là nhãn VẼ RA ở `app/page.tsx`: `<span>{item.label}</span>`):");
console.log(`   ${workMenuItems.map((item) => `"${item.label}"`).join(" · ")}`);
check(workMenuItems.length === 5, "khai báo ĐÚNG 5 mục");
check(JSON.stringify(workMenuItems.map((item) => item.label)) === JSON.stringify(EXPECTED), `nhãn = ${JSON.stringify(EXPECTED)}`);
check(workMenuItems.every((item) => item.groupKey === "my_work"), "cả 5 mục thuộc nhóm `my_work` («CÔNG VIỆC»)");
console.log("");
console.log("2) ĐỐI CHỨNG ÂM — 4 khoá `dept_*` cũ đi qua đường nhãn DB của `configuredModules()`:");
for (const key of legacyWorkMenuKeys) {
  const label = byKey(key)?.label;
  console.log(`   ${key.padEnd(20)} → label DB = "${label}"`);
}
check(EXPECTED.every((label) => !legacyWorkMenuKeys.some((key) => byKey(key)?.label === label)),
  "KHÔNG nhãn DB nào của 4 khoá cũ trùng 5 nhãn chốt ⇒ dùng lại khoá cũ là SAI NHÃN");
console.log("");
console.log("3) 5 khoá mới có bị `module_catalog` đè nhãn không (RỦI RO SỐ 1)?");
const collisions = workMenuItems.filter((item) => dbCatalog.some((row) => row.moduleKey === item.key));
check(collisions.length === 0, `0/5 khoá mới có dòng module_catalog ⇒ nhãn lấy từ CODE (đụng: ${collisions.length})`);
console.log("   (mô phỏng ĐÚNG production: migration không seed khoá `work_*` nào — xem `drizzle/*.sql`)");
console.log("");
console.log("4) 5 mục mới có lọt vào ma trận phân quyền admin (`configuredModules` dùng ở màn Phân quyền) không?");
check(workMenuItems.every((item) => !modules.some((row) => row.key === item.key)),
  "5 mục menu KHÔNG nằm trong `modules` ⇒ KHÔNG sinh dòng quyền giả trong màn Phân quyền");
console.log("");
console.log("5) `approvals` («Trung tâm phê duyệt») — mục thứ 6 của nhóm, KHÔNG bị ẩn:");
console.log(`   approvals → label="${byKey("approvals")?.label}" groupKey="${byKey("approvals")?.groupKey}"`);
check(byKey("approvals")?.label === "Trung tâm phê duyệt" && !legacyWorkMenuKeys.includes("approvals"), "`approvals` KHÔNG nằm trong danh sách ẩn");
console.log("");
console.log(`═══ KẾT QUẢ: ${pass} ĐẠT · ${fail} HỎNG ═══`);
process.exit(fail ? 1 : 0);
