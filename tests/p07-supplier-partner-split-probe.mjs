// PROBE (không nằm trong gate `package.json` — chạy tay): ĐO THẬT cây menu «MUA HÀNG» sau `P-07`
// ⇒ khẳng định **2 MỤC MENU** «Nhà cung cấp» + «Đối tác» THỰC SỰ được vẽ ra, và bấm vào thì mở ĐÚNG màn.
//
// Vì sao KHÔNG đo bằng DOM: nhánh `P-07` BỊ CẤM build/khởi động dịch vụ (`8787`/`9000`/`18081`), mà bundle
// hiện có là bản build CŨ ⇒ đọc DOM của bundle cũ là bằng chứng SAI. Vì vậy probe dựng lại ĐÚNG cây menu
// bằng CHÍNH các hàm thật (`configuredMenuGroups` · `configuredModules` · `modulePermission`) + các khai báo
// thật (`supplierPartnerMenuItems` · `legacySupplierPartnerMenuKeys` · `supplierPartnerViewFor`).
// Chạy:  node --import tsx tests/p07-supplier-partner-split-probe.mjs
import { readFileSync } from "node:fs";
import { configuredModules } from "../lib/workflow-helpers.ts";
import { modulePermission } from "../lib/permissions.ts";
import {
  configuredMenuGroups,
  independentMenuKeys,
  legacySupplierPartnerMenuKeys,
  legacyWarehouseMenuKeys,
  legacyWorkMenuKeys,
  modules,
  supplierPartnerMenuItems,
  supplierPartnerViewFor,
  warehouseMenuItems,
  workMenuItems,
} from "../lib/menu-helpers.ts";

const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");

let pass = 0;
let fail = 0;
const check = (ok, text) => { console.log(`${ok ? "  ✔" : "  ✖"} ${text}`); if (ok) pass++; else fail++; };

// `module_catalog` MÔ PHỎNG ĐÚNG production SAU khi cập nhật nhãn (đo bằng mysql: label='Nhà cung cấp',
// group_key='purchasing', sort_order=110). Khoá mới `dept_plan_partners` CỐ Ý KHÔNG có dòng nào.
const dbCatalog = [
  { moduleKey: "dept_plan_suppliers", label: "Nhà cung cấp", groupKey: "purchasing", active: 1, sortOrder: 110 },
  { moduleKey: "supplier_catalog", label: "Danh mục Nhà cung cấp", groupKey: "purchasing", active: 1, sortOrder: 120 },
];
const userWithRight = { id: "u1", role: "kh_nv", fullName: "NV Kế hoạch" };
const withRight = { moduleCatalog: dbCatalog, menuGroups: [], user: userWithRight, modulePermissions: [{ moduleKey: "dept_plan_suppliers", canView: 1, canUse: 1 }] };
const withoutRight = { moduleCatalog: dbCatalog, menuGroups: [], user: userWithRight, modulePermissions: [{ moduleKey: "requests", canView: 1 }] };

/** DỰNG LẠI ĐÚNG cây menu của `app/page.tsx` (dòng 381–495): allowedModules → groupTree → 3 mảng mục code. */
function buildMenuTree(data) {
  const menuGroups = configuredMenuGroups(data);
  const visibleGroupKeys = new Set(menuGroups.map((row) => String(row.groupKey)));
  const permissionConfigured = data.modulePermissions.length > 0;
  const allowedModules = configuredModules(data)
    .filter((item) => (!item.groupKey || visibleGroupKeys.has(String(item.groupKey))) && (!permissionConfigured || modulePermission(data, item.key).canView));
  const codeChildren = (items) => items.flatMap((item) => {
    const viewable = item.permissionKeys.find((key) => modulePermission(data, key).canView);
    if (permissionConfigured && !viewable) return [];
    return [{ key: item.key, label: item.label, view: item.view ?? null, moduleKey: item.moduleKey ?? viewable ?? item.permissionKeys[0], badgeKeys: item.permissionKeys }];
  });
  const supplierPartnerMenuChildren = codeChildren(supplierPartnerMenuItems);
  const workMenuChildren = codeChildren(workMenuItems);
  const warehouseMenuChildren = codeChildren(warehouseMenuItems.map((item) => ({ ...item, moduleKey: item.moduleKey })));
  const hidden = new Set([...legacyWorkMenuKeys, ...legacyWarehouseMenuKeys, ...legacySupplierPartnerMenuKeys]);
  const groupTree = menuGroups
    .filter((group) => String(group.groupKey) !== "overview")
    .map((group) => ({
      ...group,
      children: allowedModules.filter((item) => !independentMenuKeys.includes(item.key) && String(item.groupKey) === String(group.groupKey) && !hidden.has(item.key)),
    }))
    .filter((group) => group.children.length > 0
      || (String(group.groupKey) === "my_work" && workMenuChildren.length > 0)
      || (String(group.groupKey) === "warehouse" && warehouseMenuChildren.length > 0)
      || (String(group.groupKey) === "purchasing" && supplierPartnerMenuChildren.length > 0));
  groupTree.sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
  const purchasing = groupTree.find((group) => String(group.groupKey) === "purchasing") || null;
  return { menuGroups, allowedModules, groupTree, purchasing, supplierPartnerMenuChildren };
}

console.log("═══ P-07 · PROBE CÂY MENU «MUA HÀNG»: 2 MỤC «Nhà cung cấp» + «Đối tác» (đo THẬT) ═══");
console.log("Nguồn: lib/menu-helpers.ts (`supplierPartnerMenuItems`) · lib/workflow-helpers.ts (`configuredModules`) · lib/permissions.ts");
console.log("");

const tree = buildMenuTree(withRight);
const rendered = tree.purchasing
  ? [...tree.supplierPartnerMenuChildren.map((item) => item.label), ...tree.purchasing.children.map((item) => item.label)]
  : [];
console.log("1) CÂY MENU RENDER — nhóm «MUA HÀNG» (khoá `purchasing`):");
console.log(`   ${tree.purchasing ? String(tree.purchasing.name) : "(KHÔNG CÓ NHÓM)"} → mục vẽ ra: ${rendered.map((label) => `"${label}"`).join(" · ")}`);
check(Boolean(tree.purchasing), "nhóm «MUA HÀNG» TỒN TẠI trong cây menu");
check(tree.purchasing?.children.length === 0, "dòng `modules` cũ của khoá `dept_plan_suppliers` đã bị ẨN khỏi `children` (lọc `legacySupplierPartnerMenuKeys`)");
check(JSON.stringify(tree.supplierPartnerMenuChildren.map((item) => item.label)) === JSON.stringify(["Nhà cung cấp", "Đối tác"]),
  `vẽ ra ĐÚNG 2 MỤC, đúng thứ tự: ${JSON.stringify(tree.supplierPartnerMenuChildren.map((item) => item.label))}`);
check(rendered.filter((label) => label === "Nhà cung cấp").length === 1 && rendered.filter((label) => label === "Đối tác").length === 1,
  "mỗi nhãn xuất hiện ĐÚNG 1 LẦN trong cây menu (không nhân đôi với dòng `modules`)");
console.log("");

console.log("2) NHÃN lấy từ ĐÂU — đối chứng ÂM với nhãn DB CŨ (nếu chưa chạy UPDATE `module_catalog`):");
const oldLabelTree = buildMenuTree({ ...withRight, moduleCatalog: [{ ...dbCatalog[0], label: "Nhà cung cấp / Đối tác" }] });
const oldRendered = oldLabelTree.purchasing
  ? [...oldLabelTree.supplierPartnerMenuChildren.map((item) => item.label), ...oldLabelTree.purchasing.children.map((item) => item.label)]
  : [];
console.log(`   DB còn nhãn cũ ⇒ mục vẽ ra: ${oldRendered.map((label) => `"${label}"`).join(" · ")}`);
check(JSON.stringify(oldRendered) === JSON.stringify(["Nhà cung cấp", "Đối tác"]),
  "2 mục vẫn ĐÚNG nhãn dù DB cũ ⇒ nhãn lấy từ CODE (không bị DB đè)");
check(!oldRendered.includes("Nhà cung cấp / Đối tác"), "nhãn GỘP «Nhà cung cấp / Đối tác» KHÔNG còn xuất hiện trong menu");
console.log("");

console.log("3) BẤM VÀO MỤC → mở ĐÚNG MÀN `SupplierManager` với ĐÚNG `view`:");
for (const item of tree.supplierPartnerMenuChildren) {
  const active = item.moduleKey;
  const view = supplierPartnerViewFor(item.view, active);
  const branch = active === "dept_plan_suppliers" && page.includes('active === "dept_plan_suppliers" && <SupplierManager data={data} action={action} view={supplierPartnerScreenView} />');
  console.log(`   "${item.label}" → active=${active} · view=${view} · nhánh render có thật: ${branch}`);
  check(view === item.view, `«${item.label}» → \`supplierPartnerViewFor\` trả ĐÚNG "${item.view}"`);
  check(branch === true, `«${item.label}» → \`app/page.tsx\` render \`SupplierManager\` (kèm \`view\`)`);
}
check(!/active\.startsWith\("dept_plan_"\) && active !== "dept_plan_tasks" && <DepartmentTaskWorkspace/.test(page),
  "khoá cũ ĐÃ bị loại khỏi nhánh chung `dept_plan_*` (không render 2 màn cùng lúc)");
console.log("");

console.log("4) ĐỐI CHỨNG ÂM — tài khoản KHÔNG có quyền `dept_plan_suppliers`:");
const none = buildMenuTree(withoutRight);
console.log(`   số mục vẽ ra của nhóm «MUA HÀNG»: ${none.supplierPartnerMenuChildren.length}`);
check(none.supplierPartnerMenuChildren.length === 0, "không có quyền ⇒ 2 mục BIẾN MẤT (cổng quyền THẬT, không hardcode admin)");
console.log("");

console.log("5) CỔNG QUYỀN + KHÔNG MIGRATION:");
check(supplierPartnerMenuItems.every((item) => item.permissionKeys.every((key) => modules.some((row) => row.key === key))),
  "`permissionKeys` của cả 2 mục là khoá ĐÃ CÓ trong bảng `modules`");
check(!modules.some((row) => row.key === "dept_plan_partners"),
  "khoá mới `dept_plan_partners` KHÔNG nằm trong `modules` ⇒ KHÔNG khoá module thật, KHÔNG dòng `module_catalog`");
check(supplierPartnerMenuItems.filter((item) => modules.some((row) => row.key === item.key)).length === 1,
  "chỉ MỤC GIỮ KHOÁ CŨ `dept_plan_suppliers` trùng bảng `modules` (tương thích ngược); khoá MỚI không sinh dòng quyền giả");
console.log("");
console.log(`═══ KẾT QUẢ: ${pass} ĐẠT · ${fail} HỎNG ═══`);
process.exit(fail ? 1 : 0);
