// PHASE 5 (`W-01`) — HỢP ĐỒNG MENU NHÓM «KHO»: **ĐÚNG 5 MỤC** — Kho · Nhập · Xuất · Điều chuyển · Dashboard tồn kho.
//
// Nguyên văn `docs/25_TODO_ROADMAP.md` dòng `W-01`: «Tách 5 mục: Kho · Nhập · Xuất · Điều chuyển · Dashboard tồn kho».
// Làm ĐÚNG KHUÔN `T-01` (đã nghiệm thu): 5 mục khai báo **TRONG CODE** (`lib/menu-helpers.ts`), mỗi mục mang
// `permissionKeys` trỏ tới **KHOÁ ĐÃ CÓ**, lọc bằng `modulePermission(data, key).canView`; các khoá cũ của nhóm
// `warehouse` **bị ẩn khỏi menu** nhưng KHÔNG bị xoá (khoá vẫn sống cho quyền/tiêu đề/nhánh render).
//
// ⛔ ĐỐI CHỨNG ÂM (quan trọng nhất của mục này — "KHÔNG khoá module mới, KHÔNG migration"):
//     • mọi `permissionKeys` phải ∈ tập khoá kho ĐÃ CÓ,
//     • `MODULE_KEYS` (`scripts/system-route.mjs`) và `module_catalog` (drizzle `module_catalog_*.sql`) KHÔNG được
//       xuất hiện khoá `warehouse_*`/`kho_*` mới nào.
//
// Vì sao kiểm ở tầng NGUỒN (không phải DOM): nhánh PHASE 5 BỊ CẤM build/khởi động dịch vụ (xem đề bài), mà bằng
// chứng runtime chỉ có nghĩa SAU khi build lại bundle — đúng cách `tests/t01-work-menu.test.mjs` đang làm.
//
// LƯU Ý: tệp này CỐ Ý không nằm trong `package.json` → `test:regression` giữ nguyên số ca.
// Chạy riêng:  node --test tests/w01-warehouse-menu.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const menuHelpers = read("lib/menu-helpers.ts");
const page = read("app/page.tsx");
const uiShared = read("lib/ui-shared.tsx");
const route = read("scripts/system-route.mjs");

// ── BẢNG CHỐT `W-01` (nguyên văn yêu cầu của người dùng) ────────────────────────────────────────
// # | Nhãn (ĐÚNG 5 mục) | Cổng quyền (khoá ĐÃ CÓ) | Đích đến THẬT
const EXPECTED = [
  { key: "warehouse_hub", label: "Kho", permissionKeys: ["central_warehouse"], moduleKey: "central_warehouse" },
  { key: "warehouse_inbound", label: "Nhập", permissionKeys: ["warehouse_receipt"], moduleKey: "warehouse_receipt" },
  { key: "warehouse_outbound", label: "Xuất", permissionKeys: ["warehouse_issue"], moduleKey: "warehouse_issue" },
  { key: "warehouse_transfer", label: "Điều chuyển", permissionKeys: ["inventory"], moduleKey: "inventory" },
  { key: "warehouse_dashboard", label: "Dashboard tồn kho", permissionKeys: ["stocktake"], moduleKey: "inventory" },
];
// 6 khoá CŨ của nhóm KHO phải bị ẨN khỏi menu (nhưng KHÔNG xoá khỏi hệ thống).
const LEGACY = ["warehouse_receipt", "warehouse_issue", "inventory", "stocktake", "material_norms", "central_warehouse"];
// Tập khoá kho ĐÃ CÓ — mọi `permissionKeys` của 5 mục BẮT BUỘC nằm trong tập này.
const EXISTING_WAREHOUSE_KEYS = ["warehouse_receipt", "warehouse_issue", "inventory", "stocktake", "material_norms", "central_warehouse"];

const lineEnd = (text, from) => {
  const candidates = [text.indexOf("\r\n", from), text.indexOf("\n", from)].filter((index) => index > 0);
  return candidates.length ? Math.min(...candidates) : -1;
};
const menuItemsBlock = () => {
  const start = menuHelpers.indexOf("const warehouseMenuItems");
  const end = menuHelpers.indexOf("const legacyWarehouseMenuKeys", start);
  assert.ok(start > 0 && end > start, "Không tìm thấy khai báo `warehouseMenuItems` trong lib/menu-helpers.ts");
  return menuHelpers.slice(start, end);
};
const legacyBlock = () => {
  const start = menuHelpers.indexOf("const legacyWarehouseMenuKeys");
  const end = lineEnd(menuHelpers, start);
  assert.ok(start > 0 && end > start, "Không tìm thấy khai báo `legacyWarehouseMenuKeys` trong lib/menu-helpers.ts");
  return menuHelpers.slice(start, end);
};
const warehouseChildrenBlock = () => {
  const start = page.indexOf("const warehouseMenuChildren");
  const end = page.indexOf("});", start);
  assert.ok(start > 0 && end > start, "Không tìm thấy `warehouseMenuChildren` trong app/page.tsx");
  return page.slice(start, end);
};

test("W-01 — ĐÚNG 5 mục, ĐÚNG nhãn, ĐÚNG nhóm «warehouse», mỗi mục một cổng quyền RIÊNG từ khoá ĐÃ CÓ", () => {
  const block = menuItemsBlock();
  for (const item of EXPECTED) {
    const literal = `{ key: "${item.key}", label: "${item.label}", groupKey: "warehouse", moduleKey: "${item.moduleKey}", permissionKeys: ["${item.permissionKeys.join('", "')}"]`;
    assert.ok(block.includes(literal), `Thiếu/sai mục menu: ${literal}`);
  }
  assert.equal((block.match(/key: "warehouse_/g) || []).length, 5,
    "Nhóm «KHO» phải khai báo ĐÚNG 5 mục");
  // 5 NHÃN phải đúng nguyên văn và đúng thứ tự yêu cầu.
  const labels = [...block.matchAll(/label: "([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(labels, ["Kho", "Nhập", "Xuất", "Điều chuyển", "Dashboard tồn kho"],
    "5 nhãn phải ĐÚNG thứ tự: Kho · Nhập · Xuất · Điều chuyển · Dashboard tồn kho");
});

test("W-01 — ĐỐI CHỨNG ÂM: 0 khoá module mới — mọi `permissionKeys` ∈ 6 khoá kho ĐÃ CÓ", () => {
  const block = menuItemsBlock();
  const used = [...block.matchAll(/permissionKeys: \[([^\]]+)\]/g)]
    .flatMap((m) => m[1].split(",").map((s) => s.trim().replace(/"/g, "")));
  assert.equal(used.length, 5, "Mỗi mục phải khai ĐÚNG một khoá quyền (không dùng khoá mới gộp nhóm)");
  const unknown = used.filter((key) => !EXISTING_WAREHOUSE_KEYS.includes(key));
  assert.deepEqual(unknown, [],
    `Phát hiện KHOÁ MỚI trong menu ⇒ vi phạm "KHÔNG thêm khoá module mới": ${unknown.join(", ")}`);
  // Cổng quyền phải PHÂN BIỆT (không phải 5 mục cùng một khoá).
  assert.equal(new Set(used).size, 5, "5 mục phải có 5 cổng quyền RIÊNG (không trùng nhau)");
});

test("W-01 — ĐỐI CHỨNG ÂM: KHÔNG khoá module mới trong `ModuleKey` và KHÔNG `module_catalog` mới", () => {
  const moduleKeyLine = uiShared.slice(uiShared.indexOf("type ModuleKey ="), uiShared.indexOf(";", uiShared.indexOf("type ModuleKey =")));
  for (const key of EXPECTED.map((item) => item.key)) {
    assert.ok(!moduleKeyLine.includes(`"${key}"`),
      `KHÔNG được thêm khoá module mới «${key}» vào ModuleKey — 5 mục menu này là KHOÁ MENU (khai báo trong code), không phải khoá module`);
  }
  // `MODULE_KEYS` của server: không được có khoá `warehouse_*` nào khác ngoài 2 khoá ĐÃ CÓ.
  const keysBlock = route.slice(route.indexOf("MODULE_KEYS"), route.indexOf("MODULE_KEYS") + 4000);
  const warehouseKeys = [...new Set([...keysBlock.matchAll(/"(warehouse_[a-z_]+)"/g)].map((m) => m[1]))].sort();
  assert.deepEqual(warehouseKeys, ["warehouse_issue", "warehouse_receipt"],
    `Server MODULE_KEYS phải giữ ĐÚNG 2 khoá warehouse_* đã có — đọc được: ${warehouseKeys.join(", ")}`);
  // `module_catalog` (drizzle): không được phát sinh dòng mới cho 5 khoá MENU.
  // Tên tệp migration chứa `module_catalog` KHÔNG đồng nhất theo mẫu `module_catalog_*` ⇒ quét theo NỘI DUNG.
  const files = readdirSync(resolve(root, "drizzle")).filter((name) => name.endsWith(".sql"));
  const catalogFiles = files.filter((name) => read(`drizzle/${name}`).includes("module_catalog"));
  assert.ok(catalogFiles.length >= 1,
    `Phải tìm thấy tệp migration có bảng module_catalog (đọc ${files.length} tệp, khớp ${catalogFiles.length})`);
  const offenders = [];
  for (const name of catalogFiles) {
    const text = read(`drizzle/${name}`);
    for (const item of EXPECTED) {
      if (text.includes(`'${item.key}'`) || text.includes(`"${item.key}"`)) offenders.push(`drizzle/${name}: ${item.key}`);
    }
  }
  assert.deepEqual(offenders, [],
    `KHÔNG được thêm dòng module_catalog (cần migration) cho 5 khoá menu: ${offenders.join(", ")}`);
  // Quét TOÀN BỘ migration: 5 khoá MENU này không được xuất hiện ở bất kỳ đâu (không có migration nào cho chúng).
  const anySql = files.filter((name) => EXPECTED.some((item) => read(`drizzle/${name}`).includes(item.key))).map((name) => `drizzle/${name}`);
  assert.deepEqual(anySql, [], `5 khoá MENU của W-01 KHÔNG được xuất hiện trong migration nào: ${anySql.join(", ")}`);
});

test("W-01 — 6 khoá CŨ của nhóm KHO bị ẨN khỏi menu, nhưng khoá vẫn SỐNG cho quyền/tiêu đề/nhánh render", () => {
  const legacy = legacyBlock();
  for (const key of LEGACY) {
    assert.ok(legacy.includes(`"${key}"`), `Thiếu khoá cũ cần ẩn khỏi menu: ${key}`);
  }
  // KHÔNG được ẩn nhầm khoá của nhóm khác (nhất là 5 khoá CÔNG VIỆC đã chốt ở T-01).
  for (const key of ["work_personal", "work_department", "work_assign", "work_dashboard", "work_reports", "approvals", "material_catalog"]) {
    assert.ok(!legacy.includes(`"${key}"`), `KHÔNG được ẩn khoá ngoài nhóm KHO: ${key}`);
  }
  assert.match(page, /!legacyWarehouseMenuKeys\.includes\(item\.key\)/,
    "Cây menu chưa ẩn 6 khoá kho cũ");
  // Khoá cũ vẫn phải còn nhánh render THẬT (ẩn menu ≠ xoá chức năng).
  for (const key of ["inventory", "central_warehouse", "stocktake", "material_norms", "warehouse_receipt", "warehouse_issue"]) {
    assert.ok(page.includes(`active === "${key}" && <`), `Khoá cũ «${key}» đã MẤT nhánh render ⇒ chức năng bị xoá`);
  }
});

test("W-01 — cổng quyền THẬT: mỗi mục lọc bằng `modulePermission(data, permissionKey).canView` (KHÔNG hardcode admin)", () => {
  const block = warehouseChildrenBlock();
  assert.match(block, /item\.permissionKeys\.find\(\(key\) => modulePermission\(data, key\)\.canView\)/,
    "Mục menu KHO chưa lọc bằng `modulePermission(data, permissionKey).canView`");
  assert.doesNotMatch(block, /isAdminUser\(/, "Cổng quyền mục menu KHO KHÔNG được hardcode «chỉ admin»");
  assert.match(block, /badgeKeys: item\.permissionKeys/, "Mục menu chưa giữ cặp khoá quyền để tính huy hiệu");
});

test("W-01 — menu (desktop + mobile) dựng 5 mục MỚI của nhóm «KHO», và GIỮ nguyên nhóm CÔNG VIỆC", () => {
  const hits = page.match(/groupKey==="warehouse"&&warehouseMenuChildren\.map\(/g) || [];
  assert.equal(hits.length, 2, "Phải dựng 5 mục kho ở CẢ menu desktop LẪN menu mobile");
  assert.match(page, /const warehouseMenuChildren = warehouseMenuItems\.flatMap\(\(item\) => \{/,
    "Chưa suy ra danh sách mục menu từ `warehouseMenuItems`");
  // Không được phá nhóm «CÔNG VIỆC» (T-01) và mục `approvals` (T-10).
  const workHits = page.match(/groupKey==="my_work"&&workMenuChildren\.map\(/g) || [];
  assert.equal(workHits.length, 2, "Nhóm «CÔNG VIỆC» (T-01) phải còn nguyên 2 chỗ dựng menu");
});

test("W-01 — HUY HIỆU nhóm KHO không mất số: cộng theo CẢ CẶP khoá quyền như `T-01`", () => {
  // Trước `W-01`, huy hiệu nhóm = Σ badgeFor(child.key) trên 6 khoá cũ. Nay 6 khoá đó bị ẩn ⇒ nếu không cộng
  // theo `badgeKeys` thì huy hiệu nhóm sẽ TỤT về 0 (mất chỉ báo việc chưa xong).
  assert.match(page, /const warehouseMenuBadge = \(keys: ModuleKey\[\]\) => keys\.reduce\(\(sum, key\) => sum \+ badgeFor\(key\), 0\);/,
    "Thiếu phép cộng huy hiệu theo cặp khoá quyền cho nhóm KHO");
  const groupBadgeHits = page.match(/groupKey==="warehouse"\s*\?\s*warehouseMenuChildren\.reduce/g) || [];
  assert.equal(groupBadgeHits.length, 2, "Huy hiệu NHÓM KHO phải cộng theo 5 mục mới ở CẢ desktop lẫn mobile");
  assert.equal((page.match(/warehouseMenuBadge\(item\.badgeKeys\)/g) || []).length, 4,
    "Huy hiệu phải tính bằng `warehouseMenuBadge` ở CẢ badge nhóm lẫn mục con (desktop + mobile)");
  // Nguồn huy hiệu phải là badgeFor THẬT, không hardcode số.
  assert.match(page, /function badgeFor\(key: ModuleKey\)/, "Thiếu `badgeFor` — huy hiệu phải suy từ dữ liệu");
});

test("W-01 — ĐÍCH ĐẾN THẬT: 4 mục mở màn CŨ đúng khoá; «Dashboard tồn kho» mở TAB dashboard của `Inventory`", () => {
  const block = menuItemsBlock();
  // 4 mục đầu trỏ tới 4 khoá màn THẬT đã có.
  assert.match(block, /key: "warehouse_hub", label: "Kho", groupKey: "warehouse", moduleKey: "central_warehouse"/);
  assert.match(block, /key: "warehouse_inbound", label: "Nhập", groupKey: "warehouse", moduleKey: "warehouse_receipt"/);
  assert.match(block, /key: "warehouse_outbound", label: "Xuất", groupKey: "warehouse", moduleKey: "warehouse_issue"/);
  assert.match(block, /key: "warehouse_transfer", label: "Điều chuyển", groupKey: "warehouse", moduleKey: "inventory"/);
  // «Dashboard tồn kho» = TAB của màn Tồn kho (không màn mới, không route mới) ⇒ cần `view` + ánh xạ tab.
  assert.match(block, /key: "warehouse_dashboard", label: "Dashboard tồn kho", groupKey: "warehouse", moduleKey: "inventory", permissionKeys: \["stocktake"\], view: "dashboard"/);
  assert.match(menuHelpers, /type WarehouseMenuView = /, "Thiếu kiểu `WarehouseMenuView` cho đích đến của 5 mục");
  assert.match(menuHelpers, /warehouseMenuViewFor\(/, "Thiếu hàm định tuyến `warehouseMenuViewFor`");
  assert.match(page, /const warehouseView = warehouseMenuViewFor\(/,
    "app/page.tsx chưa suy ra `warehouseView` từ mục menu");
  assert.match(page, /<Inventory data=\{data\} project=\{project\} open=\{open\} view=\{warehouseView\}/,
    "Chưa truyền `view` (tab dashboard) vào màn `Inventory`");
  const inventory = read("app/screens/Inventory.tsx");
  assert.match(inventory, /view\?: WarehouseMenuView/, "`Inventory` chưa nhận prop `view`");
  assert.match(inventory, /WAREHOUSE_TABS/, "`Inventory` chưa khai báo bộ tab «Tồn kho / Dashboard tồn kho»");
  const workHits = page.match(/groupKey==="my_work"&&workMenuChildren\.map\(/g) || [];
  assert.equal(workHits.length, 2, "Nhóm «CÔNG VIỆC» (T-01) phải còn nguyên");
});
